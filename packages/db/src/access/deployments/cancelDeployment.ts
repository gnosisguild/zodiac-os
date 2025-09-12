import { invariant } from '@epic-web/invariant'
import {
  ActiveDeployment,
  CancelledDeployment,
  DeploymentSliceTable,
  DeploymentTable,
  User,
} from '@zodiac/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

export const cancelDeployment = async (
  db: DBClient,
  user: User,
  activeDeployment: ActiveDeployment,
): Promise<CancelledDeployment> => {
  return db.transaction(async (tx) => {
    const [{ cancelledAt, cancelledById, completedAt, ...deployment }] =
      await tx
        .update(DeploymentTable)
        .set({ cancelledAt: new Date(), cancelledById: user.id })
        .where(eq(DeploymentTable.id, activeDeployment.id))
        .returning()

    invariant(
      cancelledAt != null && cancelledById != null,
      'Required fields have not been set',
    )

    invariant(
      completedAt == null,
      'Cancelled deployments cannot have a completed date',
    )

    await tx
      .update(DeploymentSliceTable)
      .set({ cancelledAt, cancelledById })
      .where(
        and(
          eq(DeploymentSliceTable.deploymentId, activeDeployment.id),
          isNull(DeploymentSliceTable.completedAt),
        ),
      )

    return { cancelledAt, cancelledById, completedAt, ...deployment }
  })
}
