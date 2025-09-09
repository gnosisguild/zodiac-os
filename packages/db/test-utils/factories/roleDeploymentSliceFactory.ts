import { Chain } from '@zodiac/chains'
import {
  RoleDeployment,
  RoleDeploymentSlice,
  RoleDeploymentSliceCreateInput,
  RoleDeploymentSliceTable,
  User,
} from '@zodiac/db/schema'
import { safeJson } from '@zodiac/schema'
import { randomAddress } from '@zodiac/test-utils'
import { randomUUID } from 'crypto'
import { createFactory } from './createFactory'

export const roleDeploymentSliceFactory = createFactory<
  RoleDeploymentSliceCreateInput,
  RoleDeploymentSlice,
  [createdBy: User, deployment: RoleDeployment]
>({
  build(
    createdBy,
    deployment,
    { from = randomAddress(), steps = [], ...data } = {},
  ) {
    return {
      createdById: createdBy.id,
      roleId: deployment.roleId,
      tenantId: deployment.tenantId,
      workspaceId: deployment.workspaceId,
      steps: safeJson(steps),
      from,
      chainId: Chain.ETH,
      index: 0,
      roleDeploymentId: deployment.id,

      ...data,
    }
  },
  async create(db, data) {
    const [deploymentSlice] = await db
      .insert(RoleDeploymentSliceTable)
      .values(data)
      .returning()

    return deploymentSlice
  },
  createWithoutDb(data) {
    return {
      id: randomUUID(),
      createdAt: new Date(),

      cancelledAt: null,
      cancelledById: null,
      completedAt: null,
      completedById: null,
      proposedTransactionId: null,
      signedTransactionId: null,
      transactionHash: null,
      updatedAt: null,
      targetAccount: null,

      ...data,
    }
  },
})
