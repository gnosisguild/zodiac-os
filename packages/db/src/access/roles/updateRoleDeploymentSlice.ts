import { RoleDeploymentSliceTable } from '@zodiac/db/schema'
import { UUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { DBClient } from '../../dbClient'

type UpdateRoleDeploymentSliceOptions = {
  proposedTransactionId?: UUID
}

export const updateRoleDeploymentSlice = (
  db: DBClient,
  roleDeploymentSliceId: UUID,
  { proposedTransactionId }: UpdateRoleDeploymentSliceOptions,
) =>
  db
    .update(RoleDeploymentSliceTable)
    .set({ proposedTransactionId })
    .where(eq(RoleDeploymentSliceTable.id, roleDeploymentSliceId))
