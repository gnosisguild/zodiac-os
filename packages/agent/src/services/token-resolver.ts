// Browser-compatible imports - only import Node.js modules when available
let readFileSync: typeof import('fs').readFileSync | null = null
let dirname: typeof import('path').dirname | null = null
let join: typeof import('path').join | null = null
let fileURLToPath: typeof import('url').fileURLToPath | null = null

// Check if we're in a Node.js environment
const isNode =
  typeof process !== 'undefined' && process.versions && process.versions.node

if (isNode) {
  try {
    // Use dynamic imports for Node.js modules
    const fs = require('fs')
    const path = require('path')
    const url = require('url')
    readFileSync = fs.readFileSync
    dirname = path.dirname
    join = path.join
    fileURLToPath = url.fileURLToPath
  } catch (error) {
    console.warn('Failed to load Node.js modules:', error)
  }
}

// Get current directory for Node.js environments
let __dirname: string | null = null
if (isNode && fileURLToPath && dirname) {
  try {
    const __filename = fileURLToPath(import.meta.url)
    __dirname = dirname(__filename)
  } catch (error) {
    console.warn('Failed to get current directory:', error)
  }
}

// Chain ID to DeFi Kit chain mapping
const CHAIN_ID_MAP: Record<number, string> = {
  1: 'eth', // Ethereum
  10: 'opt', // Optimism
  8453: 'base', // Base
  42161: 'arb', // Arbitrum
  100: 'gno', // Gnosis (if we add support later)
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
  version: {
    major: number
    minor: number
    patch: number
  }
  tokens: TokenInfo[]
}

export class TokenResolver {
  private tokenList: TokenList | null = null
  private tokensByChain: Map<number, Map<string, TokenInfo>> = new Map()
  private tokensByChainByAddress: Map<number, Map<string, TokenInfo>> =
    new Map()
  private lastLoaded: number = 0
  private readonly cacheTimeout = 1000 * 60 * 60 // 1 hour

  constructor() {
    this.loadTokenList()
  }

  /**
   * Load the Uniswap token list from local file (Node.js only)
   * In browser environments, this will initialize with empty data
   */
  private loadTokenList(): void {
    // Only attempt to load from file system in Node.js environments
    if (!isNode || !readFileSync || !join || !__dirname) {
      console.log(
        '🌐 Token Resolver initialized in browser mode (no file system access)',
      )
      this.tokensByChain = new Map()
      this.tokensByChainByAddress = new Map()
      this.lastLoaded = Date.now()
      return
    }

    try {
      const tokenListPath = join(__dirname, '../data/token-list-uni.json')
      const rawData = readFileSync(tokenListPath, 'utf8')
      this.tokenList = JSON.parse(rawData)
      this.buildLookupMaps()
      this.lastLoaded = Date.now()

      console.log('🔍 Token Resolver initialized:', {
        totalTokens: this.tokenList?.tokens.length || 0,
        supportedChains: Array.from(this.tokensByChain.keys()),
        version: this.tokenList
          ? `${this.tokenList.version.major}.${this.tokenList.version.minor}.${this.tokenList.version.patch}`
          : 'unknown',
        timestamp: this.tokenList?.timestamp || 'unknown',
      })
    } catch (error) {
      console.error('❌ Failed to load token list:', error)
      // Initialize with empty maps to prevent crashes
      this.tokensByChain = new Map()
      this.tokensByChainByAddress = new Map()
    }
  }

  /**
   * Build optimized lookup maps by chain and symbol
   */
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

      const chainMap = this.tokensByChain.get(token.chainId)!
      // Use uppercase symbol for case-insensitive lookup
      chainMap.set(token.symbol.toUpperCase(), token)
      // Address-based lookup (lowercase for consistency)
      const addrMap = this.tokensByChainByAddress.get(token.chainId)!
      addrMap.set(token.address.toLowerCase(), token)
    }

    console.log('📊 Token lookup maps built:', {
      chains: Array.from(this.tokensByChain.keys()).map((chainId) => ({
        chainId,
        defiKitChain: CHAIN_ID_MAP[chainId] || 'unknown',
        tokenCount: this.tokensByChain.get(chainId)?.size || 0,
      })),
    })
  }

  /**
   * Resolve a token symbol to its contract address for a specific chain
   * Handles native currency, contract addresses, and symbol resolution
   */
  resolveTokenAddress(token: string, defiKitChain: string): string {
    // Handle native currency
    if (this.isNativeCurrency(token)) {
      return this.resolveNativeCurrency(token, defiKitChain)
    }

    // If already a valid contract address, return as-is
    if (this.isValidAddress(token)) {
      return token
    }

    // Resolve symbol to address
    const chainId = DEFI_KIT_CHAIN_MAP[defiKitChain]
    if (!chainId) {
      console.warn(`⚠️ Unsupported DeFi Kit chain: ${defiKitChain}`)
      return token
    }

    const tokenInfo = this.getTokenInfo(token, chainId)
    if (tokenInfo) {
      console.log(
        `🔍 Token resolved: ${token} → ${tokenInfo.address} on ${defiKitChain}`,
      )
      return tokenInfo.address
    }

    // Log warning for unknown tokens
    console.warn(`⚠️ Unknown token: ${token} on ${defiKitChain}. Using as-is.`)
    return token
  }

  /**
   * Get detailed token information by symbol and chain ID
   */
  getTokenInfo(symbol: string, chainId: number): TokenInfo | null {
    const chainMap = this.tokensByChain.get(chainId)
    if (!chainMap) return null

    return chainMap.get(symbol.toUpperCase()) || null
  }

  /**
   * Get detailed token information by address and chain ID
   */
  getTokenInfoByAddress(address: string, chainId: number): TokenInfo | null {
    const addrMap = this.tokensByChainByAddress.get(chainId)
    if (!addrMap) return null
    return addrMap.get(address.toLowerCase()) || null
  }

  /**
   * Check if a token is available on a specific chain
   */
  isValidToken(symbol: string, defiKitChain: string): boolean {
    if (this.isNativeCurrency(symbol)) return true
    if (this.isValidAddress(symbol)) return true

    const chainId = DEFI_KIT_CHAIN_MAP[defiKitChain]
    if (!chainId) return false

    return this.getTokenInfo(symbol, chainId) !== null
  }

  /**
   * Get all available tokens for a specific chain
   */
  getAvailableTokens(defiKitChain: string): string[] {
    const chainId = DEFI_KIT_CHAIN_MAP[defiKitChain]
    if (!chainId) return []

    const chainMap = this.tokensByChain.get(chainId)
    if (!chainMap) return []

    return Array.from(chainMap.keys())
  }

  /**
   * Get token suggestions for a partial symbol match
   */
  getTokenSuggestions(
    partialSymbol: string,
    defiKitChain: string,
    limit: number = 5,
  ): string[] {
    const chainId = DEFI_KIT_CHAIN_MAP[defiKitChain]
    if (!chainId) return []

    const chainMap = this.tokensByChain.get(chainId)
    if (!chainMap) return []

    const upperPartial = partialSymbol.toUpperCase()
    const suggestions: string[] = []

    for (const symbol of Array.from(chainMap.keys())) {
      if (symbol.includes(upperPartial)) {
        suggestions.push(symbol)
        if (suggestions.length >= limit) break
      }
    }

    return suggestions
  }

  /**
   * Check if token is native currency (ETH, native, etc.)
   */
  private isNativeCurrency(token: string): boolean {
    const lower = token.toLowerCase()
    return lower === 'eth' || lower === 'native' || lower === 'ether'
  }

  /**
   * Resolve native currency symbol per chain
   * For protocols that require wrapped tokens, use WETH instead of ETH
   */
  private resolveNativeCurrency(token: string, defiKitChain: string): string {
    const nativeCurrencyMap: Record<string, string> = {
      eth: 'WETH', // Use WETH for Ethereum mainnet for protocol compatibility
      arb: 'ETH',
      opt: 'ETH',
      base: 'ETH',
      gno: 'XDAI',
    }
    return nativeCurrencyMap[defiKitChain] || 'ETH'
  }

  /**
   * Check if string is a valid Ethereum address
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  /**
   * Refresh token list (for future use with dynamic updates)
   */
  async refreshTokenList(): Promise<void> {
    // In browser environments, this is a no-op since we can't access file system
    if (!isNode || !readFileSync || !join || !__dirname) {
      console.log('🔄 Token list refresh skipped in browser environment')
      return
    }

    // For now, just reload from file
    // In the future, this could fetch from IPFS or HTTP
    this.loadTokenList()
  }

  /**
   * Get resolver statistics
   */
  getStats(): {
    totalTokens: number
    chainCoverage: Record<string, number>
    lastUpdated: string
    version?: string
  } {
    const chainCoverage: Record<string, number> = {}

    for (const [chainId, tokenMap] of Array.from(
      this.tokensByChain.entries(),
    )) {
      const defiKitChain = CHAIN_ID_MAP[chainId]
      if (defiKitChain) {
        chainCoverage[defiKitChain] = tokenMap.size
      }
    }

    return {
      totalTokens: this.tokenList?.tokens.length || 0,
      chainCoverage,
      lastUpdated: new Date(this.lastLoaded).toISOString(),
      version: this.tokenList
        ? `${this.tokenList.version.major}.${this.tokenList.version.minor}.${this.tokenList.version.patch}`
        : undefined,
    }
  }
}

// Singleton instance
const tokenResolver = new TokenResolver()

export default tokenResolver

// Export common functions for easy use
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
