import { invariant } from '@epic-web/invariant'
import { BaseRoleDeployment, RoleDeployment } from '@zodiac/db/schema'

export function assertRoleDeployment(
  deployment: BaseRoleDeployment,
): asserts deployment is RoleDeployment {
  const { cancelledAt, cancelledById, completedAt } = deployment

  if (completedAt != null) {
    invariant(
      cancelledAt == null && cancelledById == null,
      'Completed deployments cannot be also cancelled',
    )

    return
  }

  if (cancelledAt != null) {
    invariant(
      cancelledById != null,
      'Cancelled deployment must have a reference to who canceled it',
    )

    return
  }

  invariant(
    cancelledById == null,
    'Active deployment must not have a reference to who cancelled it',
  )
}
