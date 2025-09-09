import { invariant } from '@epic-web/invariant'
import {
  ActiveRoleDeployment,
  RoleDeploymentSliceTable,
  StepsByAccount,
} from '@zodiac/db/schema'
import { HexAddress, safeJson } from '@zodiac/schema'
import { DBClient } from '../../dbClient'

type CreateRoleDeploymentSliceOptions = {
  steps: StepsByAccount[]
  from: HexAddress
}

export const createRoleDeploymentSlice = async (
  db: DBClient,
  roleDeployment: ActiveRoleDeployment,
  { steps, from }: CreateRoleDeploymentSliceOptions,
) => {
  const previousSlice = await db.query.roleDeploymentSlice.findFirst({
    // TODO: is findFirst correct here? don't we have to look for the highest index?
    where(fields, { eq }) {
      return eq(fields.roleDeploymentId, roleDeployment.id)
    },
  })

  invariant(steps.length > 0, 'steps must not be empty')
  const chainId = steps[0].account.chain

  return db.insert(RoleDeploymentSliceTable).values({
    chainId: chainId,
    index: previousSlice == null ? 0 : previousSlice.index + 1,
    roleDeploymentId: roleDeployment.id,
    tenantId: roleDeployment.tenantId,
    workspaceId: roleDeployment.workspaceId,
    from,
    steps: safeJson(steps),
  })
}
