import { Account as DBAccount, User, Wallet } from '@zodiac/db/schema'
import { AccountType, NewAccount, resolveAccounts } from 'ser-kit'

export const predictRolesModAddress = async (account: DBAccount) =>
  await predictAddress({
    type: AccountType.ROLES,
    avatar: account.address,
    chain: account.chainId,
    owner: account.address,
    target: account.address,
    nonce: account.nonce,
    modules: [],
    allowances: [],
    multisend: [],
    roles: [],
  })

export const predictMemberSafeAddress = async (user: User, wallet: Wallet) =>
  await predictAddress({
    type: AccountType.SAFE,
    chain: 1, // chainId does not matter for address, so we simply assume mainnet
    modules: [],
    owners: [wallet.address],
    threshold: 1,
    nonce: user.nonce,
  })

export const predictAddress = async (account: NewAccount) => {
  const { desired } = await resolveAccounts({
    current: [],
    updatesOrCreations: [account],
  })
  return desired[0].address
}
