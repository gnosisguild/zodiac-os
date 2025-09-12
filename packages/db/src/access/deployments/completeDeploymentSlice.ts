import { invariant } from '@epic-web/invariant'
import {
  ActiveDeploymentSlice,
  CompletedDeploymentSlice,
  DeploymentSliceTable,
} from '@zodiac/db/schema'
import { Hex } from '@zodiac/schema'
import { UUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

type CompleteDeploymentSliceOptions = {
  userId: UUID
  transactionHash: Hex
  signedTransactionId: UUID
}

export const completeDeploymentSlice = async (
  db: DBClient,
  deploymentSlice: ActiveDeploymentSlice,
  {
    userId,
    transactionHash,
    signedTransactionId,
  }: CompleteDeploymentSliceOptions,
): Promise<CompletedDeploymentSlice> => {
  return db.transaction(async (tx) => {
    const [
      {
        completedAt,
        completedById,
        cancelledAt,
        cancelledById,
        transactionHash: insertedTransactionHash,
        signedTransactionId: insertedTransactionId,
        ...slice
      },
    ] = await tx
      .update(DeploymentSliceTable)
      .set({
        completedAt: new Date(),
        completedById: userId,
        transactionHash,
        signedTransactionId,
      })
      .where(eq(DeploymentSliceTable.id, deploymentSlice.id))
      .returning()

    invariant(
      completedAt != null &&
        completedById != null &&
        insertedTransactionHash != null &&
        insertedTransactionId != null,
      'Deployment slice was not marked as completed',
    )

    invariant(
      cancelledAt == null && cancelledById == null,
      'Deployment was already cancelled',
    )

    return {
      completedAt,
      completedById,
      cancelledAt,
      cancelledById,
      transactionHash: insertedTransactionHash,
      signedTransactionId: insertedTransactionId,
      ...slice,
    }
  })
}
