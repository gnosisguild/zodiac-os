import { Chain } from '@zodiac/chains'
import { User } from '@zodiac/db/schema'
import { DBClient } from '../../dbClient'

export const getSetupSafeAddresses = async (
  db: DBClient,
  user: User,
  chainIds: Chain[],
) =>
  db.query.setupSafe.findMany({
    where(fields, { eq, inArray, and }) {
      return and(eq(fields.userId, user.id), inArray(fields.chainId, chainIds))
    },
    columns: { chainId: true, address: true },
  })
