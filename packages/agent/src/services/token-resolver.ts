// Import JSON file like this for now.
import tokenListJson from '../data/token-list-uni.json'

// Chain ID to DeFi Kit chain mapping
const CHAIN_ID_MAP: Record<number, string> = {
  1: 'eth',
  10: 'opt',
  8453: 'base',
  42161: 'arb',
  100: 'gno',
}

// DeFi Kit chain to Chain ID mapping
const DEFI_KIT_CHAIN_MAP: Record<string, number> = {
  eth: 1,
  opt: 10,
  base: 8453,
  arb: 42161,
  gno: 100,
}

export interface TokenInfo {
  chainId: number
  address: string
  name: string
  symbol: string
  decimals: number
  logoURI?: string
  extensions?: any
}

export interface TokenList {
  name: string
  timestamp: string
  version: { major: number; minor: number; patch: number }
  tokens: TokenInfo[]
}

export class TokenResolver {
  private tokenList: TokenList | null = null
  private tokensByChain: Map<number, Map<string, TokenInfo>> = new Map()
  private tokensByChainByAddress: Map<number, Map<string, TokenInfo>> =
    new Map()
  private lastLoaded = 0
  private readonly cacheTimeout = 1000 * 60 * 60 // 1h

  constructor() {
    // Synchronous init from bundled JSON
    this.tokenList = tokenListJson as TokenList
    this.buildLookupMaps()
    this.lastLoaded = Date.now()
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('🔍 Token Resolver initialized (static import):', {
        totalTokens: this.tokenList.tokens.length,
        supportedChains: Array.from(this.tokensByChain.keys()),
        version: `${this.tokenList.version.major}.${this.tokenList.version.minor}.${this.tokenList.version.patch}`,
        timestamp: this.tokenList.timestamp,
      })
    }
  }

  private buildLookupMaps(): void {
    if (!this.tokenList) return
    this.tokensByChain.clear()
    this.tokensByChainByAddress.clear()

    for (const token of this.tokenList.tokens) {
      if (!this.tokensByChain.has(token.chainId)) {
        this.tokensByChain.set(token.chainId, new Map())
      }
      if (!this.tokensByChainByAddress.has(token.chainId)) {
        this.tokensByChainByAddress.set(token.chainId, new Map())
      }
      this.tokensByChain
        .get(token.chainId)!
        .set(token.symbol.toUpperCase(), token)
      this.tokensByChainByAddress
        .get(token.chainId)!
        .set(token.address.toLowerCase(), token)
    }
  }

  resolveTokenAddress(token: string, defiKitChain: string): string {
    if (this.isNativeCurrency(token))
      return this.resolveNativeCurrency(token, defiKitChain)
    if (this.isValidAddress(token)) return token

    const chainId = DEFI_KIT_CHAIN_MAP[defiKitChain]
    if (!chainId) return token

    const tokenInfo = this.getTokenInfo(token, chainId)
    if (tokenInfo) return tokenInfo.address

    return token
  }

  getTokenInfo(symbol: string, chainId: number): TokenInfo | null {
    const chainMap = this.tokensByChain.get(chainId)
    return chainMap?.get(symbol.toUpperCase()) ?? null
  }

  getTokenInfoByAddress(address: string, chainId: number): TokenInfo | null {
    const addrMap = this.tokensByChainByAddress.get(chainId)
    return addrMap?.get(address.toLowerCase()) ?? null
  }

  isValidToken(symbol: string, defiKitChain: string): boolean {
    if (this.isNativeCurrency(symbol) || this.isValidAddress(symbol))
      return true
    const chainId = DEFI_KIT_CHAIN_MAP[defiKitChain]
    return !!chainId && !!this.getTokenInfo(symbol, chainId)
  }

  getAvailableTokens(defiKitChain: string): string[] {
    const chainId = DEFI_KIT_CHAIN_MAP[defiKitChain]
    const chainMap = chainId ? this.tokensByChain.get(chainId) : undefined
    return chainMap ? Array.from(chainMap.keys()) : []
  }

  getTokenSuggestions(
    partialSymbol: string,
    defiKitChain: string,
    limit = 5,
  ): string[] {
    const chainId = DEFI_KIT_CHAIN_MAP[defiKitChain]
    const chainMap = chainId ? this.tokensByChain.get(chainId) : undefined
    if (!chainMap) return []
    const upper = partialSymbol.toUpperCase()
    const out: string[] = []
    for (const sym of chainMap.keys()) {
      if (sym.includes(upper)) {
        out.push(sym)
        if (out.length >= limit) break
      }
    }
    return out
  }

  private isNativeCurrency(token: string): boolean {
    const lower = token.toLowerCase()
    return lower === 'eth' || lower === 'native' || lower === 'ether'
  }

  private resolveNativeCurrency(_token: string, defiKitChain: string): string {
    const nativeCurrencyMap: Record<string, string> = {
      eth: 'WETH',
      arb: 'ETH',
      opt: 'ETH',
      base: 'ETH',
      gno: 'XDAI',
    }
    return nativeCurrencyMap[defiKitChain] ?? 'ETH'
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  // No-op here; kept for API parity
  async refreshTokenList(): Promise<void> {
    this.tokenList = tokenListJson as TokenList
    this.buildLookupMaps()
    this.lastLoaded = Date.now()
  }

  getStats() {
    const chainCoverage: Record<string, number> = {}
    for (const [chainId, tokenMap] of this.tokensByChain.entries()) {
      const dk = CHAIN_ID_MAP[chainId]
      if (dk) chainCoverage[dk] = tokenMap.size
    }
    return {
      totalTokens: this.tokenList?.tokens.length ?? 0,
      chainCoverage,
      lastUpdated: new Date(this.lastLoaded).toISOString(),
      version: this.tokenList
        ? `${this.tokenList.version.major}.${this.tokenList.version.minor}.${this.tokenList.version.patch}`
        : undefined,
    }
  }
}

// Singleton + convenience fns
const tokenResolver = new TokenResolver()
export default tokenResolver

export const resolveTokenAddress = (token: string, chain: string) =>
  tokenResolver.resolveTokenAddress(token, chain)

export const isValidToken = (token: string, chain: string) =>
  tokenResolver.isValidToken(token, chain)

export const getTokenInfo = (symbol: string, chain: string) => {
  const chainId = DEFI_KIT_CHAIN_MAP[chain]
  return chainId ? tokenResolver.getTokenInfo(symbol, chainId) : null
}

export const getAvailableTokens = (chain: string) =>
  tokenResolver.getAvailableTokens(chain)

export const getTokenInfoByAddress = (address: string, chain: string) => {
  const chainId = DEFI_KIT_CHAIN_MAP[chain]
  return chainId ? tokenResolver.getTokenInfoByAddress(address, chainId) : null
}
