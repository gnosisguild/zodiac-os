import { invariant } from '@epic-web/invariant'
import {
  ActiveDeployment,
  CompletedDeployment,
  DeploymentSliceTable,
  DeploymentTable,
} from '@zodiac/db/schema'
import { and, count, eq, isNull } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

export const completeDeploymentIfNeeded = async (
  db: DBClient,
  activeDeployment: ActiveDeployment,
): Promise<CompletedDeployment | undefined> => {
  const [pendingSteps] = await db
    .select({ count: count() })
    .from(DeploymentSliceTable)
    .where(
      and(
        eq(DeploymentSliceTable.deploymentId, activeDeployment.id),
        isNull(DeploymentSliceTable.completedAt),
      ),
    )

  if (pendingSteps.count > 0) {
    return
  }

  return db.transaction(async (tx) => {
    const [deployment] = await tx
      .update(DeploymentTable)
      .set({ completedAt: new Date() })
      .where(eq(DeploymentTable.id, activeDeployment.id))
      .returning()

    if (deployment == null) {
      return
    }

    const { completedAt, cancelledAt, cancelledById, ...rest } = deployment

    invariant(
      completedAt != null,
      '"completedAt" timestamp not set on deployment',
    )

    invariant(
      cancelledAt == null && cancelledById == null,
      'Deployment was already cancelled',
    )

    return { completedAt, cancelledAt, cancelledById, ...rest }
  })
}
