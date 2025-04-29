import {
  SignedTransactionTable,
  type Tenant,
  type User,
} from '@zodiac/db/schema'
import { jsonStringify, type MetaTransactionRequest } from '@zodiac/schema'
import type { UUID } from 'crypto'
import type { DBClient } from '../dbClient'

type SaveTransactionOptions = {
  accountId: UUID
  walletId: UUID
  routeId: UUID

  transaction: MetaTransactionRequest[]

  safeWalletUrl: string | undefined
  explorerUrl: string | undefined
}

export const saveTransaction = async (
  db: DBClient,
  tenant: Tenant,
  user: User,
  { transaction, ...options }: SaveTransactionOptions,
) => {
  const [result] = await db
    .insert(SignedTransactionTable)
    .values({
      tenantId: tenant.id,
      userId: user.id,
      transaction: JSON.parse(jsonStringify(transaction)),

      ...options,
    })
    .returning()

  return result
}
