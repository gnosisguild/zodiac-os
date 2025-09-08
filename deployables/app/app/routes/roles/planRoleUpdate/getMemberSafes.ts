import {
  dbClient,
  getActivatedAccounts,
  getDefaultWallets,
  getRoleMembers,
} from '@zodiac/db'
import { DeploymentIssue, Role } from '@zodiac/db/schema'
import { AccountType, type NewAccount, type UpdateAccount } from 'ser-kit'

type UpdateOrNewSafe = Extract<
  UpdateAccount | NewAccount,
  { type: AccountType.SAFE }
>

type Result = {
  safes: UpdateOrNewSafe[]
  issues: DeploymentIssue[]
}

export const getMemberSafes = async (role: Role): Promise<Result> => {
  const members = await getRoleMembers(dbClient(), { roleId: role.id })

  if (members.length === 0) {
    return {
      safes: [],
      issues: [DeploymentIssue.NoActiveMembers],
    }
  }

  const accounts = await getActivatedAccounts(dbClient(), { roleId: role.id })

  if (accounts.length === 0) {
    return {
      safes: [],
      issues: [DeploymentIssue.NoActiveAccounts],
    }
  }

  const activeChains = Array.from(
    new Set(accounts.map((account) => account.chainId)),
  )

  const safes: UpdateOrNewSafe[] = []
  const issues: DeploymentIssue[] = []

  for (const member of members) {
    const defaultWallets = await getDefaultWallets(dbClient(), member.id)

    for (const chainId of activeChains) {
      if (defaultWallets[chainId] == null) {
        if (!issues.includes(DeploymentIssue.MissingDefaultWallet)) {
          issues.push(DeploymentIssue.MissingDefaultWallet)
        }

        continue
      }

      safes.push({
        type: AccountType.SAFE,
        chain: chainId,
        modules: [],
        owners: [defaultWallets[chainId].address],
        threshold: 1,
        nonce: member.nonce,
      })
    }
  }

  return { safes, issues }
}
