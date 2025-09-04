import { jsonParse } from '@zodiac/schema'
import { UUID } from 'crypto'
import { StepsByAccount } from '../../../schema'
import { DBClient } from '../../dbClient'

export const getRoleDeploymentSlices = async (
  db: DBClient,
  deploymentId: UUID,
) => {
  const slices = await db.query.roleDeploymentSlice.findMany({
    where(fields, { eq }) {
      return eq(fields.roleDeploymentId, deploymentId)
    },
    orderBy(fields, { asc }) {
      return asc(fields.index)
    },
  })

  return slices.map(({ steps, ...slice }) => {
    return {
      ...slice,
      steps: jsonParse<StepsByAccount>(steps),
    }
  })
}
