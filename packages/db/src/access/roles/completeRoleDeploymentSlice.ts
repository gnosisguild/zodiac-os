import { RoleDeploymentSliceTable, User } from '@zodiac/db/schema'
import { Hex } from '@zodiac/schema'
import { UUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

type CompleteRoleDeploymentSliceOptions = {
  roleDeploymentSliceId: UUID
  transactionHash: Hex
}

export const completeRoleDeploymentSlice = (
  db: DBClient,
  user: User,
  {
    roleDeploymentSliceId,
    transactionHash,
  }: CompleteRoleDeploymentSliceOptions,
) =>
  db
    .update(RoleDeploymentSliceTable)
    .set({ completedAt: new Date(), completedById: user.id, transactionHash })
    .where(eq(RoleDeploymentSliceTable.id, roleDeploymentSliceId))
