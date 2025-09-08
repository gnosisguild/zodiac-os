import { invariant } from '@epic-web/invariant'
import {
  ActiveDeployment,
  DeploymentIssue,
  DeploymentTable,
  Role,
  User,
} from '@zodiac/db/schema'
import { DBClient } from '../../dbClient'

type CreateDeploymentOptions = {
  issues: DeploymentIssue[]
}

export const createRoleDeployment = async (
  db: DBClient,
  user: User,
  role: Role,
  { issues }: CreateDeploymentOptions,
): Promise<ActiveDeployment> => {
  const [{ completedAt, cancelledAt, cancelledById, ...deployment }] = await db
    .insert(DeploymentTable)
    .values({
      reference: `role:${role.id}`,
      workspaceId: role.workspaceId,
      tenantId: role.tenantId,
      createdById: user.id,
      issues,
    })
    .returning()

  invariant(completedAt == null, 'Deployment has already been completed')

  invariant(
    cancelledById == null && cancelledAt == null,
    'Deployment has already been cancelled',
  )

  return { completedAt, cancelledAt, cancelledById, ...deployment }
}
