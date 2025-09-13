import { Chain } from '@zodiac/chains'
import {
  Deployment,
  DeploymentSlice,
  DeploymentSliceCreateInput,
  DeploymentSliceTable,
  User,
} from '@zodiac/db/schema'
import { safeJson } from '@zodiac/schema'
import { randomAddress } from '@zodiac/test-utils'
import { randomUUID } from 'crypto'
import { assertDeploymentSlice } from '../../src'
import { createFactory } from './createFactory'

export const deploymentSliceFactory = createFactory<
  DeploymentSliceCreateInput,
  DeploymentSlice,
  [createdBy: User, deployment: Deployment]
>({
  build(
    createdBy,
    deployment,
    { from = randomAddress(), steps = [], ...data } = {},
  ) {
    return {
      createdById: createdBy.id,
      tenantId: deployment.tenantId,
      workspaceId: deployment.workspaceId,
      steps: safeJson(steps),
      from,
      chainId: Chain.ETH,
      index: 0,
      deploymentId: deployment.id,

      ...data,
    }
  },
  async create(db, data) {
    const [deploymentSlice] = await db
      .insert(DeploymentSliceTable)
      .values(data)
      .returning()

    assertDeploymentSlice(deploymentSlice)

    return deploymentSlice
  },
  createWithoutDb(data) {
    const deploymentSlice = {
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

    assertDeploymentSlice(deploymentSlice)

    return deploymentSlice
  },
})
