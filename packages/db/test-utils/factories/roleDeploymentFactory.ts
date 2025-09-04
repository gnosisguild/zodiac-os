import { invariant } from '@epic-web/invariant'
import { assertRoleDeployment } from '@zodiac/db'
import {
  Role,
  RoleDeployment,
  RoleDeploymentCreateInput,
  RoleDeploymentTable,
  User,
} from '@zodiac/db/schema'
import { randomUUID } from 'crypto'
import { createFactory } from './createFactory'

export const roleDeploymentFactory = createFactory<
  RoleDeploymentCreateInput,
  RoleDeployment,
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
      .insert(RoleDeploymentTable)
      .values(data)
      .returning()

    assertRoleDeployment(deployment)

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
    } satisfies RoleDeployment
  },
})
