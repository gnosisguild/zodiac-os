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
  build(deployment, role) {
    return {
      deploymentId: deployment.id,
      roleId: role.id,
    }
  },
  async create(db, data) {
    const [roleDeployment] = await db
      .insert(RoleDeploymentTable)
      .values(data)
      .returning()

    return roleDeployment
  },
  createWithoutDb({ deploymentId, roleId }) {
    return {
      deploymentId,
      roleId,
    } satisfies RoleDeployment
  },
})
