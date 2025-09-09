import { schema } from '@zodiac/db/schema'
import { UUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

const { roleDeployment, role } = schema

export const getDeployedRole = async (db: DBClient, deploymentId: UUID) => {
  const rows = await db
    .select({
      id: role.id,
      label: role.label,
      key: role.key,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      tenantId: role.tenantId,
      workspaceId: role.workspaceId,
      createdById: role.createdById,
    })
    .from(roleDeployment)
    .innerJoin(role, eq(roleDeployment.roleId, role.id))
    .where(eq(roleDeployment.deploymentId, deploymentId))
    .limit(1)

  return rows.length > 0 ? rows[0] : null
}
