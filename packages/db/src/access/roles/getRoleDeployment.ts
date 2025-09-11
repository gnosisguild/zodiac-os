import { invariant } from '@epic-web/invariant'
import { schema } from '@zodiac/db/schema'
import { UUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

const { roleDeployment, role } = schema

export const findRoleDeployment = async (db: DBClient, deploymentId: UUID) => {
  const rows = await db
    .select({
      role: role,
      issues: roleDeployment.issues,
      deploymentId: roleDeployment.deploymentId,
    })
    .from(roleDeployment)
    .innerJoin(role, eq(roleDeployment.roleId, role.id))
    .where(eq(roleDeployment.deploymentId, deploymentId))
    .limit(1)

  return rows.length > 0 ? rows[0] : null
}

export const getRoleDeployment = async (db: DBClient, deploymentId: UUID) => {
  const result = await findRoleDeployment(db, deploymentId)

  invariant(
    result != null,
    `Could not find role deployment for deployment id "${deploymentId}"`,
  )

  return result
}
