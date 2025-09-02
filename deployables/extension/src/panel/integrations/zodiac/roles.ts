import { getStorageEntry, saveStorageEntry } from '@/storage'
import { getRolesAppUrl } from '@zodiac/env'
import { jsonStringify, type MetaTransactionRequest } from '@zodiac/schema'
import { useEffect, useState } from 'react'
import { type PrefixedAddress } from 'ser-kit'
import { z } from 'zod'
import { decodeKey as decodeRoleKey } from 'zodiac-roles-sdk'

/**
 * Record calls to the Zodiac Roles app, so the user can update their role's permissions.
 *
 * This function is a wrapper around `recordCallsSimple` that ensures no two invocations
 * with the same `{ rolesMod, roleKey }` run in parallel. If an invocation is already in
 * progress for a given key, any new call will be deferred and its `transactions` added to
 * the pending batch.
 *
 * When the current call finishes, all accumulated transactions for that key
 * will be processed in a single (batched) invocation of `recordCalls`.
 *
 * This serialization is necessary especially when initially creating a new calls record so
 * that now multiple records will be created for the same role.
 */
export async function recordCalls(
  transactions: MetaTransactionRequest[],
  { rolesMod, roleKey }: { rolesMod: PrefixedAddress; roleKey: string },
): Promise<void> {
  const key = `${rolesMod}:${decodeRoleKey(roleKey)}`

  if (recordCallsQueue.has(key)) {
    const queueEntry = recordCallsQueue.get(key)!
    queueEntry.transactions.push(...transactions)
    return queueEntry.deferred.promise
  }

  const deferred = Promise.withResolvers<void>()
  const queueEntry: RecordCallsQueueEntry = {
    transactions: [...transactions],
    deferred,
  }
  recordCallsQueue.set(key, queueEntry)
  ;(async () => {
    try {
      while (queueEntry.transactions.length > 0) {
        const currentBatch = queueEntry.transactions
        queueEntry.transactions = []
        await recordCallsSimple(currentBatch, { rolesMod, roleKey })
      }
      queueEntry.deferred.resolve()
    } catch (error) {
      queueEntry.deferred.reject(error)
    } finally {
      recordCallsQueue.delete(key)
    }
  })()

  return deferred.promise
}

const recordCallsSimple = async (
  transactions: MetaTransactionRequest[],
  { rolesMod, roleKey }: { rolesMod: PrefixedAddress; roleKey: string },
) => {
  const record = await getStoredRoleRecord(rolesMod, roleKey)

  if (record) {
    return await recordSubsequentCalls(transactions, record)
  }

  return await recordInitialCalls(transactions, { rolesMod, roleKey })
}

const recordInitialCalls = async (
  transactions: MetaTransactionRequest[],
  { rolesMod, roleKey }: { rolesMod: PrefixedAddress; roleKey: string },
) => {
  const metadata = {
    recordedAt: new Date().toISOString(),
    recordedWith: 'Zodiac Pilot',
  }

  const response = await fetch(`${getRolesAppUrl()}/api/records`, {
    method: 'POST',
    body: jsonStringify(transactions.map((t) => ({ ...t, metadata }))),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const record = zRecord.parse(await response.json())
  await saveStoredRoleRecord(rolesMod, roleKey, record)
}

const recordSubsequentCalls = async (
  transactions: MetaTransactionRequest[],
  record: Record,
) => {
  const metadata = {
    recordedAt: new Date().toISOString(),
    recordedWith: 'Zodiac Pilot',
  }

  const response = await fetch(
    `${getRolesAppUrl()}/api/records/${record.id}/calls`,
    {
      method: 'POST',
      body: jsonStringify(transactions.map((t) => ({ ...t, metadata }))),
      headers: {
        Authorization: `Bearer ${record.authToken}`,
        'Content-Type': 'application/json',
      },
    },
  )

  const data = await response.json()
  if (!response.ok) {
    console.error('Failed to record calls', data)
    throw new Error('Failed to record calls: ' + response.statusText)
  }
}

const zRecord = z.object({
  id: z.string(),
  authToken: z.string(),
})
type Record = z.infer<typeof zRecord>

// We use a single chrome.sync.storage key for all role records so that we don't
// consume an excessive of stored values (limit: 512).
const STORAGE_KEY = 'role-records'
const zRecordStore = z.record(z.string(), zRecord.optional()) // 📀 🎧

const recordStoreKey = (rolesMod: PrefixedAddress, roleKey: string) =>
  `${rolesMod}:${decodeRoleKey(roleKey)}`

export const useRoleRecordLink = (props?: {
  rolesMod: PrefixedAddress
  roleKey: string
}) => {
  const { rolesMod, roleKey } = props ?? {}
  const [record, setRecord] = useState<Record | undefined>(undefined)

  useEffect(() => {
    if (!rolesMod || !roleKey) return

    getStoredRoleRecord(rolesMod, roleKey).then(setRecord)

    const key = recordStoreKey(rolesMod, roleKey)
    const handleStorageChange = (changes: {
      [key: string]: chrome.storage.StorageChange
    }) => {
      const newRecordStore =
        changes[STORAGE_KEY]?.newValue &&
        zRecordStore.parse(changes[STORAGE_KEY].newValue)
      if (newRecordStore) {
        setRecord(newRecordStore[key])
      }
    }
    chrome.storage.sync.onChanged.addListener(handleStorageChange)

    return () => {
      chrome.storage.sync.onChanged.removeListener(handleStorageChange)
    }
  }, [rolesMod, roleKey])

  return (
    rolesMod &&
    roleKey &&
    record &&
    `${getRolesAppUrl()}/${rolesMod}/roles/${decodeRoleKey(roleKey)}/records/${record.id}/auth/${record.authToken}`
  )
}

/**
 * Get a stored role record for the given rolesMod and roleKey combination.
 * Returns undefined if no record exists.
 */
async function getStoredRoleRecord(
  rolesMod: PrefixedAddress,
  roleKey: string,
): Promise<Record | undefined> {
  const recordStore = zRecordStore.parse(
    (await getStorageEntry({ key: STORAGE_KEY })) || {},
  )
  const storageKey = `${rolesMod}:${decodeRoleKey(roleKey)}`
  const record = recordStore[storageKey]
  return record ? zRecord.parse(record) : undefined
}

/**
 * Save a role record for the given rolesMod and roleKey combination.
 */
async function saveStoredRoleRecord(
  rolesMod: PrefixedAddress,
  roleKey: string,
  record: Record,
): Promise<void> {
  const recordStore = zRecordStore.parse(
    (await getStorageEntry({ key: STORAGE_KEY })) || {},
  )
  const storageKey = `${rolesMod}:${decodeRoleKey(roleKey)}`
  recordStore[storageKey] = record
  await saveStorageEntry({ key: STORAGE_KEY, value: recordStore })
}

type RecordCallsQueueEntry = {
  transactions: MetaTransactionRequest[]
  deferred: {
    promise: Promise<void>
    resolve: () => void
    reject: (error: any) => void
  }
}

const recordCallsQueue = new Map<string, RecordCallsQueueEntry>()
