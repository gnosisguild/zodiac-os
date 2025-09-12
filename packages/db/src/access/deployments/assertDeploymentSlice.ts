import { invariant } from '@epic-web/invariant'
import { BaseDeploymentSlice, DeploymentSlice } from '@zodiac/db/schema'

export function assertDeploymentSlice(
  deploymentSlice: BaseDeploymentSlice,
): asserts deploymentSlice is DeploymentSlice {
  const { completedAt, completedById, cancelledAt, cancelledById } =
    deploymentSlice

  if (completedAt != null || completedById != null) {
    invariant(
      completedAt != null,
      'Deployment slice is missing information about when it was completed',
    )

    invariant(
      completedById != null,
      'Deployment slice is missing information about who completed it',
    )

    invariant(
      cancelledAt == null && cancelledById == null,
      'Completed deployment slices cannot be cancelled',
    )

    return
  }

  if (cancelledAt != null || cancelledById != null) {
    invariant(
      cancelledAt != null,
      'Deployment slice is missing information about when it was cancelled',
    )

    invariant(
      cancelledById != null,
      'Deployment slice is missing information about who cancelled it',
    )

    invariant(
      completedAt == null && completedById == null,
      'Cancelled deployment slices cannot be completed',
    )

    return
  }

  invariant(
    completedAt == null &&
      completedById == null &&
      cancelledAt == null &&
      cancelledById == null,
    'Invalid deployment slice',
  )
}
