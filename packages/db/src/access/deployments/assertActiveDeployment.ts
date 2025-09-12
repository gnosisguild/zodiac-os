import { invariant } from '@epic-web/invariant'
import { ActiveDeployment, BaseDeployment } from '@zodiac/db/schema'

export function assertActiveDeployment(
  deployment: BaseDeployment,
): asserts deployment is ActiveDeployment {
  invariant(
    deployment.completedAt == null,
    'Deployment has already been completed',
  )

  invariant(
    deployment.cancelledById == null && deployment.cancelledAt == null,
    'Deployment has already been cancelled',
  )
}
