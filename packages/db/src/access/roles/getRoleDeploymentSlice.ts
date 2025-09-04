import { invariant } from '@epic-web/invariant'
import { jsonParse } from '@zodiac/schema'
import { UUID } from 'crypto'
import { StepsByAccount } from '../../../schema'
import { DBClient } from '../../dbClient'

export const getRoleDeploymentSlice = async (
  db: DBClient,
  roleDeploymentSliceId: UUID,
) => {
  const step = await db.query.roleDeploymentSlice.findFirst({
    where(fields, { eq }) {
      return eq(fields.id, roleDeploymentSliceId)
    },
  })

  invariant(
    step != null,
    `Could not find role deployment slice with id "${roleDeploymentSliceId}"`,
  )

  const { steps, ...rest } = step

  return {
    steps: jsonParse<StepsByAccount>(steps),
    ...rest,
  }
}
