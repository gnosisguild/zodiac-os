import { invariant } from '@epic-web/invariant'
import { schema } from '@zodiac/db/schema'
import { UUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

const { roleDeployment, role } = schema

export const getRoleDeployment = async (db: DBClient, deploymentId: UUID) => {
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

  invariant(
    rows.length === 1,
    `Could not find role deployment for deployment id "${deploymentId}"`,
  )

  return rows[0]
}
