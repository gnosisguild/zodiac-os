import {
  ProposedTransactionTable,
  type Account,
  type ProposedTransaction,
  type ProposedTransactionCreateInput,
  type Tenant,
  type User,
} from '@zodiac/db/schema'
import { createMockTransactionRequest } from '@zodiac/modules/test-utils'
import { safeJson } from '@zodiac/schema'
import { randomUUID } from 'crypto'
import { createFactory } from './createFactory'

export const transactionProposalFactory = createFactory<
  ProposedTransactionCreateInput,
  ProposedTransaction,
  [tenant: Tenant, user: User, account: Account]
>({
  build(tenant, user, account, data) {
    return {
      accountId: account.id,
      tenantId: tenant.id,
      userId: user.id,
      workspaceId: account.workspaceId,

      transaction: [createMockTransactionRequest()],

      ...data,
    }
  },

  async create(db, { transaction, ...data }) {
    const [proposal] = await db
      .insert(ProposedTransactionTable)
      .values({
        ...data,

        transaction: safeJson(transaction),
      })
      .returning()

    return proposal
  },

  createWithoutDb(data) {
    return {
      id: randomUUID(),
      createdAt: new Date(),
      signedTransactionId: null,
      callbackUrl: null,
      callbackState: null,
      routeId: null,

      ...data,
    }
  },
})
