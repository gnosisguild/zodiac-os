import { invariant } from '@epic-web/invariant'
import { Deployment } from '@zodiac/db/schema'
import { UUID } from 'crypto'
import { DBClient } from '../../dbClient'
import { assertDeployment } from './assertDeployment'

export const getDeployment = async (
  db: DBClient,
  deploymentId: UUID,
): Promise<Deployment> => {
  const deployment = await db.query.deployment.findFirst({
    where(fields, { eq }) {
      return eq(fields.id, deploymentId)
    },
  })

  invariant(
    deployment != null,
    `Could not find deployment with id "${deploymentId}"`,
  )

  assertDeployment(deployment)

  return deployment
}
