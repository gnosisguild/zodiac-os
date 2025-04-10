import { invariant } from '@epic-web/invariant'
import type { Tenant, User } from '@zodiac/db/schema'
import type { DBClient } from '../dbClient'
import { findActiveRoute } from './findActiveRoute'

export const getActiveRoute = async (
  db: DBClient,
  tenant: Tenant,
  user: User,
  accountId: string,
) => {
  const route = await findActiveRoute(db, tenant, user, accountId)

  invariant(
    route != null,
    `User with id "${user.id}" has no active route to account with id "${accountId}"`,
  )

  return route
}
