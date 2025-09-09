import { schema } from '@zodiac/db/schema'
import { UUID } from 'crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

const { roleDeployment, deployment } = schema

export const findPendingRoleDeployment = async (db: DBClient, roleId: UUID) => {
  const rows = await db
    .select({
      id: deployment.id,
      completedAt: deployment.completedAt,
      cancelledAt: deployment.cancelledAt,
      cancelledById: deployment.cancelledById,
      issues: deployment.issues,
      createdById: deployment.createdById,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt,
      tenantId: deployment.tenantId,
      workspaceId: deployment.workspaceId,
    })
    .from(roleDeployment)
    .innerJoin(deployment, eq(roleDeployment.deploymentId, deployment.id))
    .where(
      and(
        eq(roleDeployment.roleId, roleId),
        isNull(deployment.completedAt),
        isNull(deployment.cancelledAt),
      ),
    )
    .limit(1)

  return rows.length > 0 ? rows[0] : null
}
