import {
  RouteTable,
  type Account,
  type Route,
  type RouteCreateInput,
  type Wallet,
} from '@zodiac/db/schema'
import { randomUUID } from 'crypto'
import { createFactory } from './createFactory'

export const routeFactory = createFactory<
  RouteCreateInput,
  Route,
  [account: Account, wallet: Wallet]
>({
  build(account, wallet, route) {
    return {
      tenantId: account.tenantId,
      toId: account.id,
      fromId: wallet.id,

      ...route,
    }
  },
  async create(db, data) {
    const [route] = await db.insert(RouteTable).values(data).returning()

    return route
  },
  createWithoutDb(data) {
    return Object.assign(
      { id: randomUUID(), createdAt: new Date(), waypoints: null },
      data,
    )
  },
})
