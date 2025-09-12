import type { Anthropic } from '@anthropic-ai/sdk'
import { tools } from './definitions'

// Expose only txkit-related tools for the tx-only chat UI.
const allowed = new Set([
  'build_executable_tx',
  'tx_aave_v3',
  'tx_erc20_approve',
  'tx_cowswap',
  'tx_lido',
])

export const txkitTools: Anthropic.Tool[] = tools.filter((t) =>
  allowed.has(t.name),
)
