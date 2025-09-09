import { invariant } from '@epic-web/invariant'
import {
  ActiveDeployment,
  DeploymentIssue,
  DeploymentTable,
  Role,
  User,
  schema,
} from '@zodiac/db/schema'
import { DBClient } from '../../dbClient'

const { roleDeployment } = schema

type CreateDeploymentOptions = {
  issues: DeploymentIssue[]
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
          issues,
        })
        .returning()

    // Insert the role deployment relationship
    await tx.insert(roleDeployment).values({
      deploymentId: deployment.id,
      roleId: role.id,
    })

    invariant(completedAt == null, 'Deployment has already been completed')

    invariant(
      cancelledById == null && cancelledAt == null,
      'Deployment has already been cancelled',
    )

    return { completedAt, cancelledAt, cancelledById, ...deployment }
  })
}
