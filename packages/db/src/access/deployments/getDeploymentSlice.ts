import { invariant } from '@epic-web/invariant'
import { jsonParse } from '@zodiac/schema'
import { UUID } from 'crypto'
import { StepsByAccount } from '../../../schema'
import { DBClient } from '../../dbClient'

export const getDeploymentSlice = async (
  db: DBClient,
  deploymentSliceId: UUID,
) => {
  const step = await db.query.deploymentSlice.findFirst({
    where(fields, { eq }) {
      return eq(fields.id, deploymentSliceId)
    },
  })

  invariant(
    step != null,
    `Could not find deployment slice with id "${deploymentSliceId}"`,
  )

  const { steps, ...rest } = step

  return {
    steps: jsonParse<StepsByAccount[]>(steps),
    ...rest,
  }
}
