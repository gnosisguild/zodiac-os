import { jsonParse } from '@zodiac/schema'
import { UUID } from 'crypto'
import { StepsByAccount } from '../../../schema'
import { DBClient } from '../../dbClient'
import { assertDeploymentSlice } from './assertDeploymentSlice'

export const getDeploymentSlices = async (db: DBClient, deploymentId: UUID) => {
  const slices = await db.query.deploymentSlice.findMany({
    where(fields, { eq }) {
      return eq(fields.deploymentId, deploymentId)
    },
    orderBy(fields, { asc }) {
      return asc(fields.index)
    },
  })

  return slices.map((slice) => {
    assertDeploymentSlice(slice)

    return {
      ...slice,
      steps: jsonParse<StepsByAccount[]>(slice.steps),
    }
  })
}
