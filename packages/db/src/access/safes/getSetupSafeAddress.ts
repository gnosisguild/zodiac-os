import { invariant } from '@epic-web/invariant'
import { Chain } from '@zodiac/chains'
import { User } from '@zodiac/db/schema'
import { DBClient } from '../../dbClient'
import { findSetupSafeAddress } from './findSetupSafeAddress'

export const getSetupSafeAddress = async (
  db: DBClient,
  user: User,
  chainId: Chain,
) => {
  const address = await findSetupSafeAddress(db, user, chainId)

  invariant(
    address != null,
    `No setup safe defined for user with id "${user.id}" and chain "${chainId}"`,
  )

  return address
}
