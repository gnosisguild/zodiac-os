import {
  RoleDeploymentSliceTable,
  RoleDeploymentTable,
} from '@zodiac/db/schema'
import { UUID } from 'crypto'
import { and, count, eq, isNull } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

export const completeRoleDeploymentIfNeeded = async (
  db: DBClient,
  roleDeploymentId: UUID,
) => {
  const [pendingSteps] = await db
    .select({ count: count() })
    .from(RoleDeploymentSliceTable)
    .where(
      and(
        eq(RoleDeploymentSliceTable.roleDeploymentId, roleDeploymentId),
        isNull(RoleDeploymentSliceTable.completedAt),
      ),
    )

  if (pendingSteps.count > 0) {
    return
  }

  return db
    .update(RoleDeploymentTable)
    .set({ completedAt: new Date() })
    .where(
      and(
        eq(RoleDeploymentTable.id, roleDeploymentId),
        isNull(RoleDeploymentTable.cancelledAt),
      ),
    )
}
