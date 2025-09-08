import { invariant } from '@epic-web/invariant'
import { assertDeployment } from '@zodiac/db'
import {
  Deployment,
  DeploymentCreateInput,
  DeploymentTable,
  Role,
  User,
} from '@zodiac/db/schema'
import { randomUUID } from 'crypto'
import { createFactory } from './createFactory'

export const deploymentFactory = createFactory<
  DeploymentCreateInput,
  Deployment,
  [createdBy: User, role: Role]
>({
  build(createdBy, role, data) {
    return {
      createdById: createdBy.id,
      roleId: role.id,
      tenantId: role.tenantId,
      workspaceId: role.workspaceId,

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
  createWithoutDb({ completedAt, cancelledAt, cancelledById, ...input }) {
    if (completedAt != null) {
      return {
        id: randomUUID(),

        cancelledAt: null,
        cancelledById: null,
        completedAt,
        createdAt: new Date(),
        updatedAt: null,
        issues: [],

        ...input,
      }
    }

    if (cancelledAt != null) {
      invariant(
        cancelledById != null,
        'Cancelled deployments must specify who cancelled them',
      )

      return {
        id: randomUUID(),

        cancelledAt,
        cancelledById,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: null,
        issues: [],

        ...input,
      }
    }

    return {
      id: randomUUID(),

      cancelledAt: null,
      cancelledById: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: null,
      issues: [],

      ...input,
    } satisfies Deployment
  },
})
