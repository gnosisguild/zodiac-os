import { invariant } from '@epic-web/invariant'
import {
  ActiveDeployment,
  DeploymentTable,
  Role,
  RoleDeploymentIssue,
  User,
  schema,
} from '@zodiac/db/schema'
import { DBClient } from '../../dbClient'

const { roleDeployment } = schema

type CreateDeploymentOptions = {
  issues: RoleDeploymentIssue[]
}

export const createRoleDeployment = async (
  db: DBClient,
  user: User,
  role: Role,
  { issues }: CreateDeploymentOptions,
): Promise<ActiveDeployment> => {
  return await db.transaction(async (tx) => {
    // Insert the deployment
    const [{ completedAt, cancelledAt, cancelledById, ...deployment }] =
      await tx
        .insert(DeploymentTable)
        .values({
          workspaceId: role.workspaceId,
          tenantId: role.tenantId,
          createdById: user.id,
        })
        .returning()

    // Insert the role deployment
    await tx.insert(roleDeployment).values({
      deploymentId: deployment.id,
      roleId: role.id,
      issues,
    })

    invariant(completedAt == null, 'Deployment has already been completed')

    invariant(
      cancelledById == null && cancelledAt == null,
      'Deployment has already been cancelled',
    )

    return { completedAt, cancelledAt, cancelledById, ...deployment }
  })
}
