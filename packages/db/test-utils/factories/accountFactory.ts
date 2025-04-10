import { faker } from '@faker-js/faker'
import { Chain } from '@zodiac/chains'
import {
  AccountTable,
  type Account,
  type AccountCreateInput,
  type Tenant,
  type User,
} from '@zodiac/db/schema'
import { randomAddress } from '@zodiac/test-utils'
import { randomUUID } from 'crypto'
import { createFactory } from './createFactory'

export const accountFactory = createFactory<
  AccountCreateInput,
  Account,
  [tenant: Tenant, owner: User]
>({
  build(tenant, user, account) {
    return {
      address: randomAddress(),
      chainId: Chain.ETH,
      createdById: user.id,
      tenantId: tenant.id,

      ...account,
    }
  },
  async create(db, data) {
    const [account] = await db.insert(AccountTable).values(data).returning()

    return account
  },
  createWithoutDb(data) {
    return Object.assign(
      {
        id: randomUUID(),
        createdAt: new Date(),
        label: faker.company.buzzNoun(),
        deleted: false,
        deletedById: null,
        deletedAt: null,
      },
      data,
    )
  },
})
