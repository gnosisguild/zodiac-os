import { resolveTokenAddress } from '../../services/token-resolver'
import { getProtocolConfig } from './protocols'
import { ActionType, DeFiKitParams, ProtocolConfig } from './types'

function applyActionAliases(
  action: string,
  config?: ProtocolConfig,
): ActionType {
  if (!config?.actionAliases) return action as ActionType
  const lower = action.toLowerCase()
  const aliased = (config.actionAliases as Record<string, ActionType>)[lower]
  return (aliased || action) as ActionType
}

function applyParameterMappings(params: any, config?: ProtocolConfig): any {
  if (!config?.parameterMappings) return params
  const cloned = { ...params }
  for (const rule of config.parameterMappings) {
    const matchesProtocol =
      !rule.condition?.protocol || rule.condition.protocol === params.protocol
    const matchesAction =
      !rule.condition?.action || rule.condition.action === params.action
    const matchesChain =
      !rule.condition?.chain || rule.condition.chain === params.chain
    if (matchesProtocol && matchesAction && matchesChain) {
      if (cloned[rule.from] && !cloned[rule.to]) {
        cloned[rule.to] = cloned[rule.from]
        delete cloned[rule.from]
      }
    }
  }
  return cloned
}

function applyTokenPolicy(params: any, config?: ProtocolConfig): any {
  const policy = config?.tokenPolicy
  if (!policy) return params

  const cloned = { ...params }
  const chain = params.chain

  const normalizeArray = (arr?: string[]): string[] | undefined => {
    if (!arr) return arr
    return arr.map((token) => {
      const isEth =
        token.toLowerCase() === 'eth' || token.toLowerCase() === 'ether'
      if (isEth) {
        // Native handling
        if (policy.nativeSymbol === 'ETH') {
          return 'ETH'
        } else if (policy.nativeSymbol === 'WETH') {
          return 'WETH'
        }
      }
      // Resolve to address if required for the targeted fields
      if (policy.resolveSymbolsToAddresses) {
        return resolveTokenAddress(token, chain)
      }
      return token
    })
  }

  // Apply per-field resolution
  if (policy.resolveFields?.includes('sell'))
    cloned.sell = normalizeArray(cloned.sell)
  if (policy.resolveFields?.includes('buy'))
    cloned.buy = normalizeArray(cloned.buy)
  if (policy.resolveFields?.includes('tokens'))
    cloned.tokens = normalizeArray(cloned.tokens)
  if (policy.resolveFields?.includes('targets'))
    cloned.targets = normalizeArray(cloned.targets)

  // If no specific fields specified but nativeSymbol affects semantics, still map ETH/WETH on common arrays
  if (!policy.resolveFields || policy.resolveFields.length === 0) {
    cloned.tokens = normalizeArray(cloned.tokens)
    cloned.targets = normalizeArray(cloned.targets)
    cloned.sell = normalizeArray(cloned.sell)
    cloned.buy = normalizeArray(cloned.buy)
  }

  return cloned
}

// Map various fee formats to Uniswap v3 canonical tiers (strings)
function normalizeUniswapFees(params: any): any {
  if (params.protocol !== 'uniswap_v3') return params
  if (!params.fees) return params

  const allowedPercents = new Set(['0.01%', '0.05%', '0.3%', '1%'])
  const bpsToPercent: Record<string, string> = {
    '100': '0.01%',
    '500': '0.05%',
    '3000': '0.3%',
    '10000': '1%',
  }
  const numericToPercent: Record<string, string> = {
    '0.01': '0.01%',
    '0.05': '0.05%',
    '0.3': '0.3%',
    '1': '1%',
  }

  const toPercent = (fee: any): string | undefined => {
    if (typeof fee === 'number') {
      const s = String(fee)
      if (numericToPercent[s]) return numericToPercent[s]
      if (bpsToPercent[s]) return bpsToPercent[s]
      return undefined
    }
    if (typeof fee === 'string') {
      const t = fee.trim()
      if (allowedPercents.has(t)) return t
      const compact = t.replace(/\s+/g, '')
      if (allowedPercents.has(compact)) return compact
      // strip trailing % to map numeric
      const noPercent = compact.endsWith('%') ? compact.slice(0, -1) : compact
      if (numericToPercent[noPercent]) return numericToPercent[noPercent]
      if (bpsToPercent[compact]) return bpsToPercent[compact]
      if (numericToPercent[compact]) return numericToPercent[compact]
    }
    return undefined
  }

  const normalizedFees: string[] = (params.fees as any[])
    .map(toPercent)
    .filter((v): v is string => typeof v === 'string' && allowedPercents.has(v))

  return {
    ...params,
    fees: normalizedFees.length > 0 ? normalizedFees : params.fees,
  }
}

export function normalizeDeFiKitArgs(input: DeFiKitParams): DeFiKitParams {
  const config = getProtocolConfig(input.protocol)

  // 1) Map action aliases
  const action = applyActionAliases(input.action, config)

  // 2) Apply parameter mappings (e.g., tokens -> targets)
  const mapped = applyParameterMappings({ ...input, action }, config)

  // 2b) Minimal protocol-specific conveniences not expressible in SSOT rules
  // CowSwap: if tokens provided and no sell, map tokens -> sell
  let minimallyMapped = mapped
  if (input.protocol === 'cowswap' && action === 'swap') {
    if (!minimallyMapped.sell && minimallyMapped.tokens) {
      minimallyMapped = {
        ...minimallyMapped,
        sell: minimallyMapped.tokens,
        tokens: undefined,
      }
    }
  }

  // 3) Apply token policy (ETH/WETH and symbol->address policy by field)
  const tokenNormalized = applyTokenPolicy(minimallyMapped, config)

  // 4) Protocol-specific normalization (Uniswap v3 fees)
  const finalParams = normalizeUniswapFees(tokenNormalized)

  return finalParams as DeFiKitParams
}
