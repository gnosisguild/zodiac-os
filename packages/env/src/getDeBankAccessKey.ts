import { invariant } from '@epic-web/invariant'

export const getDeBankAccessKey = () => {
  const DEBANK_ACCESS_KEY = process.env.DEBANK_ACCESS_KEY

  invariant(
    DEBANK_ACCESS_KEY != null,
    '"DEBANK_ACCESS_KEY" environment variable missing',
  )

  return DEBANK_ACCESS_KEY
}
