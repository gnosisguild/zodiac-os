import { invariant } from '@epic-web/invariant'
import {
  ActiveRoleDeployment,
  CancelledRoleDeployment,
  RoleDeploymentSliceTable,
  RoleDeploymentTable,
  User,
} from '@zodiac/db/schema'
import { eq } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

export const cancelRoleDeployment = async (
  db: DBClient,
  user: User,
  activeDeployment: ActiveRoleDeployment,
): Promise<CancelledRoleDeployment> => {
  return db.transaction(async (tx) => {
    const [{ cancelledAt, cancelledById, completedAt, ...deployment }] =
      await tx
        .update(RoleDeploymentTable)
        .set({ cancelledAt: new Date(), cancelledById: user.id })
        .where(eq(RoleDeploymentTable.id, activeDeployment.id))
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
      .update(RoleDeploymentSliceTable)
      .set({ cancelledAt, cancelledById })
      .where(eq(RoleDeploymentSliceTable.roleDeploymentId, activeDeployment.id))

    return { cancelledAt, cancelledById, completedAt, ...deployment }
  })
}
