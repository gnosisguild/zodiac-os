import { assertDeployment } from '@zodiac/db'
import {
  Deployment,
  DeploymentCreateInput,
  DeploymentTable,
  Tenant,
  User,
} from '@zodiac/db/schema'
import { randomUUID } from 'crypto'
import { createFactory } from './createFactory'

export const deploymentFactory = createFactory<
  DeploymentCreateInput,
  Deployment,
  [tenant: Tenant, createdBy: User]
>({
  build(tenant, createdBy, data) {
    return {
      createdById: createdBy.id,
      tenantId: tenant.id,
      workspaceId: tenant.defaultWorkspaceId,

      ...data,
    }
  },
  async create(db, data) {
    const [deployment] = await db
      .insert(DeploymentTable)
      .values(data)
      .returning()

    assertDeployment(deployment)

    return deployment
  },
  createWithoutDb(data) {
    const deployment = {
      id: randomUUID(),

      cancelledAt: null,
      cancelledById: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: null,
      issues: [],

      ...data,
    }

    assertDeployment(deployment)

    return deployment
  },
})
