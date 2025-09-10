import {
  Deployment,
  Role,
  RoleDeployment,
  RoleDeploymentCreateInput,
  RoleDeploymentTable,
} from '@zodiac/db/schema'
import { createFactory } from './createFactory'

export const roleDeploymentFactory = createFactory<
  RoleDeploymentCreateInput,
  RoleDeployment,
  [deployment: Deployment, role: Role]
>({
  build(deployment, role, { issues = [] } = {}) {
    return {
      deploymentId: deployment.id,
      roleId: role.id,
      issues,
    }
  },
  async create(db, data) {
    const [roleDeployment] = await db
      .insert(RoleDeploymentTable)
      .values(data)
      .returning()

    return roleDeployment
  },
  createWithoutDb({ deploymentId, roleId, issues = [] }) {
    return {
      deploymentId,
      roleId,
      issues,
    } satisfies RoleDeployment
  },
})
