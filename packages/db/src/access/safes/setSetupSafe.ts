import { Chain } from '@zodiac/chains'
import { SetupSafeTable, User } from '@zodiac/db/schema'
import { HexAddress } from '@zodiac/schema'
import { DBClient } from '../../dbClient'

type SetSetupSafeOptions = {
  chainId: Chain
  address: HexAddress
}

export const setSetupSafe = (
  db: DBClient,
  user: User,
  options: SetSetupSafeOptions,
) => db.insert(SetupSafeTable).values({ ...options, userId: user.id })
