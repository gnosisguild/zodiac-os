import { getProtocolConfig } from './protocols'
import { DeFiKitParams, ParameterMappingRule } from './types'

export class ParameterMapper {
  /**
   * Apply protocol-specific parameter mappings
   * This handles cases where the API expects different parameter names
   * than what the user provides (e.g., tokens -> targets for Aave)
   */
  mapParameters(params: DeFiKitParams): DeFiKitParams {
    const config = getProtocolConfig(params.protocol)
    if (!config?.parameterMappings) {
      return params
    }

    let mappedParams = { ...params }

    // Apply protocol-specific mappings
    for (const rule of config.parameterMappings) {
      if (this.shouldApplyMapping(rule, params)) {
        mappedParams = this.applyMapping(mappedParams, rule)
      }
    }

    // Apply built-in protocol-specific logic
    mappedParams = this.applyProtocolSpecificMappings(mappedParams)

    return mappedParams
  }

  /**
   * Check if a mapping rule should be applied based on conditions
   */
  private shouldApplyMapping(
    rule: ParameterMappingRule,
    params: DeFiKitParams,
  ): boolean {
    const condition = rule.condition
    if (!condition) return true

    if (condition.protocol && condition.protocol !== params.protocol)
      return false
    if (condition.action && condition.action !== params.action) return false
    if (condition.chain && condition.chain !== params.chain) return false

    return true
  }

  /**
   * Apply a single mapping rule
   */
  private applyMapping(
    params: DeFiKitParams,
    rule: ParameterMappingRule,
  ): DeFiKitParams {
    const fromValue = (params as any)[rule.from]
    if (fromValue === undefined || fromValue === null) {
      return params
    }

    const mapped = { ...params }

    // Only map if target parameter doesn't already exist
    if ((mapped as any)[rule.to] === undefined) {
      ;(mapped as any)[rule.to] = fromValue
      delete (mapped as any)[rule.from]
    }

    return mapped
  }

  /**
   * Apply built-in protocol-specific mappings that can't be expressed as simple rules
   */
  private applyProtocolSpecificMappings(params: DeFiKitParams): DeFiKitParams {
    const mapped = { ...params }

    switch (params.protocol) {
      case 'cowswap':
        return this.mapCowSwapParameters(mapped)

      case 'aave_v3':
        return this.mapAaveV3Parameters(mapped)

      case 'lido':
        return this.mapLidoParameters(mapped)

      case 'uniswap_v3':
        return this.mapUniswapV3Parameters(mapped)

      case 'balancer_v2':
      case 'aura':
        return this.mapBalancerParameters(mapped)

      case 'compound_v3':
        return this.mapCompoundParameters(mapped)

      default:
        return mapped
    }
  }

  /**
   * CowSwap-specific parameter mapping
   */
  private mapCowSwapParameters(params: DeFiKitParams): DeFiKitParams {
    const mapped = { ...params }

    // For CowSwap swap action, tokens should be mapped to sell parameter
    if (params.action === 'swap') {
      // If user provided generic 'tokens' but not specific 'sell', map it
      if (params.tokens && !params.sell) {
        mapped.sell = params.tokens
        delete mapped.tokens
      }

      // If user provided both sell and buy with same tokens, it's bidirectional
      // Allow this configuration for bidirectional trading permissions
    }

    return mapped
  }

  /**
   * Aave v3 parameter mapping with market support
   */
  private mapAaveV3Parameters(params: DeFiKitParams): DeFiKitParams {
    const mapped = { ...params }

    // Map tokens to targets for deposit/borrow actions
    if (params.action === 'deposit' || params.action === 'borrow') {
      if (params.tokens && !params.targets) {
        mapped.targets = params.tokens
        delete mapped.tokens
      }
    }

    // Ensure market parameter is properly formatted
    if (mapped.market) {
      // Convert market names to standardized format
      const marketMap: Record<string, string> = {
        core: 'Core',
        prime: 'Prime',
        etherfi: 'EtherFi',
        ethereum: 'Core',
      }

      const normalizedMarket = marketMap[mapped.market.toLowerCase()]
      if (normalizedMarket) {
        mapped.market = normalizedMarket
      }
    }

    return mapped
  }

  /**
   * Lido parameter mapping
   */
  private mapLidoParameters(params: DeFiKitParams): DeFiKitParams {
    const mapped = { ...params }

    // For Lido staking, tokens should be mapped to targets
    if (params.action === 'stake') {
      if (params.tokens && !params.targets) {
        mapped.targets = params.tokens
        delete mapped.tokens
      }

      // Ensure ETH is properly handled
      if (mapped.targets) {
        mapped.targets = mapped.targets.map((token) =>
          token.toLowerCase() === 'eth' ? 'ETH' : token,
        )
      }
    }

    return mapped
  }

  /**
   * Uniswap v3 parameter mapping
   */
  private mapUniswapV3Parameters(params: DeFiKitParams): DeFiKitParams {
    const mapped = { ...params }

    // For Uniswap v3, keep tokens as tokens for general swapping
    // Only map to targets if user explicitly provided position IDs
    if (params.action === 'deposit') {
      // Validate fee tiers if provided
      if (mapped.fees) {
        const validFees = ['100', '500', '3000', '10000']
        mapped.fees = mapped.fees.filter((fee) => validFees.includes(fee))
      }
    }

    return mapped
  }

  /**
   * Balancer v2 / Aura parameter mapping
   */
  private mapBalancerParameters(params: DeFiKitParams): DeFiKitParams {
    const mapped = { ...params }

    // For Balancer deposits, tokens should be mapped to targets if not specified
    if (params.action === 'deposit') {
      if (params.tokens && !params.targets) {
        mapped.targets = params.tokens
        delete mapped.tokens
      }
    }

    return mapped
  }

  /**
   * Compound v3 parameter mapping
   */
  private mapCompoundParameters(params: DeFiKitParams): DeFiKitParams {
    const mapped = { ...params }

    // For Compound v3, tokens should be mapped to targets
    if (params.action === 'deposit' || params.action === 'borrow') {
      if (params.tokens && !params.targets) {
        mapped.targets = params.tokens
        delete mapped.tokens
      }
    }

    return mapped
  }
}

/**
 * Helper function for parameter mapping
 */
export function mapParameters(params: DeFiKitParams): DeFiKitParams {
  const mapper = new ParameterMapper()
  return mapper.mapParameters(params)
}

// Token resolution removed - DeFi Kit protocols handle string tokens natively
