import { invariant } from '@epic-web/invariant'
import { Chain } from '@zodiac/chains'
import { dbClient, getDefaultWallets } from '@zodiac/db'
import { User } from '@zodiac/db/schema'
import { AccountType, NewAccount } from 'ser-kit'

export type NewSafe = Extract<NewAccount, { type: AccountType.SAFE }>

export const createUserSafes = async (
  user: User,
  chainIds: Chain[],
): Promise<NewSafe[]> => {
  const safes: NewSafe[] = []

  const defaultWallets = await getDefaultWallets(dbClient(), user.id)

  for (const chainId of chainIds) {
    invariant(
      defaultWallets[chainId] != null,
      `User has not defined a default wallet for chain "${chainId}"`,
    )

    safes.push({
      type: AccountType.SAFE,
      chain: chainId,
      modules: [],
      owners: [defaultWallets[chainId].address],
      threshold: 1,
      nonce: user.nonce,
    })
  }

  return safes
}
