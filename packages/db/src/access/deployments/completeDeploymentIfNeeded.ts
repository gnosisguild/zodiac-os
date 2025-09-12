import { DeploymentSliceTable, DeploymentTable } from '@zodiac/db/schema'
import { UUID } from 'crypto'
import { and, count, eq, isNull } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

export const completeDeploymentIfNeeded = async (
  db: DBClient,
  deploymentId: UUID,
) => {
  const [pendingSteps] = await db
    .select({ count: count() })
    .from(DeploymentSliceTable)
    .where(
      and(
        eq(DeploymentSliceTable.deploymentId, deploymentId),
        isNull(DeploymentSliceTable.completedAt),
      ),
    )

  if (pendingSteps.count > 0) {
    return
  }

  return db
    .update(DeploymentTable)
    .set({ completedAt: new Date() })
    .where(
      and(
        eq(DeploymentTable.id, deploymentId),
        isNull(DeploymentTable.cancelledAt),
      ),
    )
}
