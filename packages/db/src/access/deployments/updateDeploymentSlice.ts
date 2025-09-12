import { DeploymentSliceTable } from '@zodiac/db/schema'
import { UUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

type UpdateDeploymentSliceOptions = {
  proposedTransactionId?: UUID
}

export const updateDeploymentSlice = (
  db: DBClient,
  deploymentSliceId: UUID,
  { proposedTransactionId }: UpdateDeploymentSliceOptions,
) =>
  db
    .update(DeploymentSliceTable)
    .set({ proposedTransactionId })
    .where(eq(DeploymentSliceTable.id, deploymentSliceId))
