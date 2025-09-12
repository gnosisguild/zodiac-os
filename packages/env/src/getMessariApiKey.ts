import { invariant } from '@epic-web/invariant'

export const getMessariApiKey = () => {
  const MESSARI_API_KEY = process.env.MESSARI_API_KEY

  invariant(
    MESSARI_API_KEY != null,
    '"MESSARI_API_KEY" environment variable missing',
  )

  return MESSARI_API_KEY
}
