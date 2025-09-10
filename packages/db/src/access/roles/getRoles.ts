import { UUID } from 'crypto'
import { DBClient } from '../../dbClient'

type GetRolesOptions = {
  workspaceId?: UUID
}

export const getRoles = (db: DBClient, { workspaceId }: GetRolesOptions = {}) =>
  db.query.role.findMany({
    where(fields, { eq }) {
      if (workspaceId != null) {
        return eq(fields.workspaceId, workspaceId)
      }
    },
    orderBy(fields, { asc }) {
      return asc(fields.label)
    },
    with: {
      createdBy: { columns: { fullName: true } },
    },
  })
