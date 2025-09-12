import { Chain } from '@zodiac/chains'
import { User } from '@zodiac/db/schema'
import { DBClient } from '../../dbClient'

export const findSetupSafeAddress = async (
  db: DBClient,
  user: User,
  chainId: Chain,
) => {
  const setupSafe = await db.query.setupSafe.findFirst({
    where(fields, { eq, and }) {
      return and(eq(fields.userId, user.id), eq(fields.chainId, chainId))
    },
  })

  if (setupSafe == null) {
    return null
  }

  return setupSafe.address
}
