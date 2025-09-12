import { UUID } from 'crypto'
import { DBClient } from '../../dbClient'

export const getRoleDeployments = (db: DBClient, roleId: UUID) =>
  db.query.roleDeployment.findMany({
    where(fields, { eq }) {
      return eq(fields.roleId, roleId)
    },
  })
