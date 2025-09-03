import { getChainId } from '@zodiac/chains'
import {
  ActiveRoleDeployment,
  RoleDeploymentStepTable,
} from '@zodiac/db/schema'
import { HexAddress, MetaTransactionRequest, safeJson } from '@zodiac/schema'
import { Account, AccountBuilderCall } from 'ser-kit'
import { DBClient } from '../../dbClient'

type CreateRoleDeploymentStepOptions = {
  account: Account
  calls: AccountBuilderCall[]
  transactionBundle: MetaTransactionRequest[]
  from: HexAddress | null
}

export const createRoleDeploymentStep = async (
  db: DBClient,
  roleDeployment: ActiveRoleDeployment,
  { account, calls, transactionBundle, from }: CreateRoleDeploymentStepOptions,
) => {
  const previousStep = await db.query.roleDeploymentStep.findFirst({
    where(fields, { eq }) {
      return eq(fields.roleDeploymentId, roleDeployment.id)
    },
  })

  return db.insert(RoleDeploymentStepTable).values({
    account: safeJson(account),
    calls: safeJson(calls),
    chainId: getChainId(account.prefixedAddress),
    index: previousStep == null ? 0 : previousStep.index + 1,
    roleDeploymentId: roleDeployment.id,
    tenantId: roleDeployment.tenantId,
    transactionBundle: safeJson(transactionBundle),
    workspaceId: roleDeployment.workspaceId,
    from,
  })
}
