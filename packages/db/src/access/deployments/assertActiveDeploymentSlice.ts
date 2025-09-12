import { invariant } from '@epic-web/invariant'
import { ActiveDeploymentSlice, DeploymentSlice } from '@zodiac/db/schema'

export function assertActiveDeploymentSlice(
  deploymentSlice: DeploymentSlice,
): asserts deploymentSlice is ActiveDeploymentSlice {
  const { completedAt, completedById, cancelledAt, cancelledById } =
    deploymentSlice

  invariant(
    completedAt == null && completedById == null,
    'Active deployments cannot be completed',
  )

  invariant(
    cancelledAt == null && cancelledById == null,
    'Active deployments cannot be cancelled',
  )
}
