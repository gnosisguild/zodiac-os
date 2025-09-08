import { UUID } from 'crypto'
import { DBClient } from '../../dbClient'

export const getRoleDeployments = (db: DBClient, roleId: UUID) =>
  db.query.deployment.findMany({
    where(fields, { eq }) {
      return eq(fields.reference, `role:${roleId}`)
    },
    orderBy(fields, { desc }) {
      return desc(fields.createdAt)
    },
  })
