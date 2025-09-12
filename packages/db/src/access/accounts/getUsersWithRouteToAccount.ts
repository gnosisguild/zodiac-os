import { RouteTable, UserTable } from '@zodiac/db/schema'
import { UUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

export const getUsersWithRouteToAccount = (db: DBClient, accountId: UUID) =>
  db
    .select({ id: UserTable.id, fullName: UserTable.fullName })
    .from(UserTable)
    .innerJoin(
      RouteTable,
      and(eq(RouteTable.userId, UserTable.id), eq(RouteTable.toId, accountId)),
    )
