import { invariant } from '@epic-web/invariant'
import {
  ActiveDeployment,
  DeploymentSliceTable,
  StepsByAccount,
} from '@zodiac/db/schema'
import { HexAddress, safeJson } from '@zodiac/schema'
import { DBClient } from '../../dbClient'

type CreateDeploymentSliceOptions = {
  steps: StepsByAccount[]
  from: HexAddress
}

export const createDeploymentSlice = async (
  db: DBClient,
  deployment: ActiveDeployment,
  { steps, from }: CreateDeploymentSliceOptions,
) => {
  const previousSlice = await db.query.deploymentSlice.findFirst({
    where(fields, { eq }) {
      return eq(fields.deploymentId, deployment.id)
    },
    orderBy(fields, { desc }) {
      return desc(fields.index)
    },
  })

  invariant(steps.length > 0, 'steps must not be empty')
  const chainId = steps[0].account.chain

  return db.insert(DeploymentSliceTable).values({
    chainId,
    index: previousSlice == null ? 0 : previousSlice.index + 1,
    deploymentId: deployment.id,
    tenantId: deployment.tenantId,
    workspaceId: deployment.workspaceId,
    from,
    steps: safeJson(steps),
  })
}
