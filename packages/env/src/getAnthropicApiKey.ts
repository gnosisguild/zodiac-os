import { invariant } from '@epic-web/invariant'

export const getAnthropicApiKey = () => {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

  invariant(
    ANTHROPIC_API_KEY != null,
    '"ANTHROPIC_API_KEY" environment variable missing',
  )

  return ANTHROPIC_API_KEY
}
