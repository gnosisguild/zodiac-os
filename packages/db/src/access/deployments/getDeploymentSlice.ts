import { invariant } from '@epic-web/invariant'
import { DeploymentSlice, StepsByAccount } from '@zodiac/db/schema'
import { jsonParse } from '@zodiac/schema'
import { UUID } from 'crypto'
import { DBClient } from '../../dbClient'
import { assertDeploymentSlice } from './assertDeploymentSlice'

export const getDeploymentSlice = async (
  db: DBClient,
  deploymentSliceId: UUID,
): Promise<DeploymentSlice> => {
  const slice = await db.query.deploymentSlice.findFirst({
    where(fields, { eq }) {
      return eq(fields.id, deploymentSliceId)
    },
  })

  invariant(
    slice != null,
    `Could not find deployment slice with id "${deploymentSliceId}"`,
  )

  assertDeploymentSlice(slice)

  const { steps, ...rest } = slice

  return {
    steps: jsonParse<StepsByAccount[]>(steps),
    ...rest,
  }
}
