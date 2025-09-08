import { DeploymentSliceTable, User } from '@zodiac/db/schema'
import { Hex } from '@zodiac/schema'
import { UUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

type CompleteDeploymentSliceOptions = {
  deploymentSliceId: UUID
  transactionHash: Hex
}

export const completeDeploymentSlice = (
  db: DBClient,
  user: User,
  { deploymentSliceId, transactionHash }: CompleteDeploymentSliceOptions,
) =>
  db
    .update(DeploymentSliceTable)
    .set({ completedAt: new Date(), completedById: user.id, transactionHash })
    .where(eq(DeploymentSliceTable.id, deploymentSliceId))
