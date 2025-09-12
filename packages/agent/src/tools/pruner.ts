import type { Anthropic } from '@anthropic-ai/sdk'

type Msg = { role: string; content: any }

const PROTOCOL_KEYWORDS: Record<string, string[]> = {
  aave_v3: ['aave', 'aave v3'],
  compound_v3: ['compound'],
  spark: ['spark'],
  uniswap_v3: ['uniswap', 'uni v3', 'uniswap v3'],
  lido: ['lido', 'steth', 'st. eth'],
  cowswap: ['cowswap', 'cow swap', 'cows'],
  balancer_v2: ['balancer'],
  aura: ['aura'],
  stakewise_v3: ['stakewise', 'stake wise'],
}

const ACTION_HINTS = [
  'deposit',
  'supply',
  'borrow',
  'stake',
  'swap',
  'liquidity',
  'pool',
  'lp',
]

function textFromContent(content: any): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((b) => (typeof b === 'string' ? b : (b?.text ?? '')))
      .join('\n')
  }
  if (typeof content === 'object' && content) {
    return String(content.text || '')
  }
  return ''
}

export function pruneTools(
  tools: Anthropic.Tool[],
  history: Msg[],
): Anthropic.Tool[] {
  // Always keep non‑DeFi utilities
  const alwaysKeep = new Set(['greeting', 'get_portfolio'])
  const baseTools = tools.filter((t) => alwaysKeep.has(t.name))

  const lastTwo = history.slice(-2)
  const text = lastTwo.map((m) => textFromContent(m.content)).join(' \n ')
  const lower = text.toLowerCase()

  const candidates = new Set<string>()

  // Keyword hits
  for (const [protocol, keys] of Object.entries(PROTOCOL_KEYWORDS)) {
    if (keys.some((k) => lower.includes(k))) candidates.add(protocol)
  }

  // Action hints
  // No default fallback: if ambiguous, return no defikit_* tools and let the model ask for details.

  // Map protocol set to tool names
  const wanted = new Set(Array.from(candidates))
  const defiTools = tools.filter((t) => t.name.startsWith('defikit_'))
  const selectedDeFi = defiTools.filter((t) => {
    const p = t.name.replace(/^defikit_/, '')
    return wanted.has(p)
  })

  // Limit to <=5 DeFi tools
  const limited = selectedDeFi.slice(0, 5)

  return [...baseTools, ...limited]
}
