import { Chain } from '@zodiac/chains'
import { User } from '@zodiac/db/schema'
import { HexAddress } from '@zodiac/schema'
import { DBClient } from '../../dbClient'

export const getSetupSafeAddresses = async (
  db: DBClient,
  user: User,
  chainIds: Chain[],
): Promise<Map<Chain, HexAddress>> => {
  const setupSafes = await db.query.setupSafe.findMany({
    where(fields, { eq, inArray, and }) {
      return and(eq(fields.userId, user.id), inArray(fields.chainId, chainIds))
    },
    columns: { chainId: true, address: true },
  })

  const safes = new Map()

  for (const safe of setupSafes) {
    safes.set(safe.chainId, safe.address)
  }

  return safes
}
