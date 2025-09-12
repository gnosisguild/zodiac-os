import { invariant } from '@epic-web/invariant'
import {
  CompletedDeployment,
  DeploymentSliceTable,
  DeploymentTable,
} from '@zodiac/db/schema'
import { UUID } from 'crypto'
import { and, count, eq, isNull } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

export const completeDeploymentIfNeeded = async (
  db: DBClient,
  deploymentId: UUID,
): Promise<CompletedDeployment | undefined> => {
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

  return db.transaction(async (tx) => {
    const [{ completedAt, cancelledAt, cancelledById, ...deployment }] =
      await tx
        .update(DeploymentTable)
        .set({ completedAt: new Date() })
        .where(
          and(
            eq(DeploymentTable.id, deploymentId),
            isNull(DeploymentTable.cancelledAt),
          ),
        )
        .returning()

    invariant(
      completedAt != null,
      '"completedAt" timestamp not set on deployment',
    )

    invariant(
      cancelledAt == null && cancelledById == null,
      'Deployment was already cancelled',
    )

    return { completedAt, cancelledAt, cancelledById, ...deployment }
  })
}
