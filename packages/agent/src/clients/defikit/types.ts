// Core types for DeFi Kit protocol system

export type Chain = 'eth' | 'arb' | 'opt' | 'base' | 'gno'
export type ActionType = 'deposit' | 'borrow' | 'stake' | 'lock' | 'swap'
export type ParameterType =
  | 'string'
  | 'string[]'
  | 'number'
  | 'boolean'
  | 'address'

// Enhanced parameter interface covering all protocols
export interface DeFiKitParams {
  // Core identification parameters
  chain: Chain
  rolesModAddress: string
  role: string
  protocol: string
  action: ActionType

  // Universal parameters (used across multiple protocols)
  targets?: string[] // Token symbols/addresses/pool IDs (most common)
  tokens?: string[] // Token refinement/specification

  // Market and pool parameters
  market?: string // Aave v3 market selection ("Core", "Prime", "EtherFi")
  poolId?: string // Balancer/Aura pool IDs
  vaultId?: string // Vault identifiers for StakeWise/Stader
  positionId?: string // NFT position IDs for Uniswap v3

  // Fee and pricing parameters
  fees?: string[] // Uniswap v3 fee tiers
  feeAmountBp?: number // CowSwap fee in basis points (0-10000)

  // Swap-specific parameters (CowSwap)
  sell?: string[] // Tokens to sell
  buy?: string[] // Tokens to buy (optional)
  twap?: boolean // TWAP vs Market order

  // Transaction parameters
  receiver?: string // Receiver address for output tokens
  recipient?: string // Recipient address for bridging
  sender?: string // Sender address for bridging
  delegatee?: string // Delegation target for governance

  // Advanced parameters
  minAmountOut?: string // Slippage protection
  deadline?: number // Transaction deadline
  referralCode?: string // Referral codes (Aave, Spark)
}

// Parameter schema definition for validation
export interface ParameterSchema {
  type: ParameterType
  required: boolean
  description: string
  constraints?: ParameterConstraints
  dependencies?: ParameterDependency[]
}

export interface ParameterConstraints {
  min?: number
  max?: number
  enum?: string[]
  pattern?: RegExp
  addressFormat?: boolean
}

export interface ParameterDependency {
  parameter: string
  condition: any
  required: boolean
}

// Protocol configuration structure
export interface ProtocolConfig {
  name: string
  description: string
  actions: ActionType[]
  parameters: Record<ActionType, Record<string, ParameterSchema>>
  deployments: Record<Chain, ContractDeployment>
  parameterMappings?: ParameterMappingRule[]
  // New: Normalize layer configuration
  actionAliases?: Record<string, ActionType>
  tokenPolicy?: TokenPolicy
}

export interface ContractDeployment {
  supported: boolean
  contracts: Record<string, string>
  markets?: Record<string, string> // For Aave v3 markets
}

export interface ParameterMappingRule {
  from: string
  to: string
  condition?: {
    protocol?: string
    action?: ActionType
    chain?: Chain
  }
}

// New: Token normalization policy per protocol
export interface TokenPolicy {
  nativeSymbol: 'ETH' | 'WETH'
  // If true, keep native literal as-is (e.g., 'ETH' stays 'ETH' for CowSwap)
  keepNativeLiteral?: boolean
  // If true, resolve symbols to addresses for the selected fields
  resolveSymbolsToAddresses?: boolean
  // Which fields to resolve: e.g., ['sell','buy'] for CowSwap, ['tokens'] for Uniswap v3
  resolveFields?: Array<'sell' | 'buy' | 'tokens' | 'targets'>
}

// Validation results
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings?: ValidationWarning[]
}

export interface ValidationError {
  parameter: string
  message: string
  type: 'required' | 'type' | 'constraint' | 'dependency'
}

export interface ValidationWarning {
  parameter: string
  message: string
  type: 'deprecated' | 'optimization' | 'info'
}

// Asset resolution types
export interface TokenInfo {
  symbol: string
  address: string
  decimals: number
  name: string
}

export interface PoolInfo {
  id: string
  address: string
  name: string
  tokens: TokenInfo[]
}

export interface VaultInfo {
  id: string
  address: string
  name: string
  underlyingToken: TokenInfo
}

// Response types (existing, enhanced)
export interface DeFiKitTransaction {
  to: string
  value: string
  contractMethod: {
    inputs: Array<{
      name: string
      type: string
    }>
    name: string
    payable: boolean
  }
  contractInputsValues: Record<string, any>
}

export interface DeFiKitResponse {
  version: string
  chainId: string
  createdAt: number
  meta: {
    name: string
    description: string
    txBuilderVersion: string
  }
  transactions: DeFiKitTransaction[]
}

export interface DeFiKitFormattedResponse {
  protocol: string
  action: string
  chain: string
  role: string
  transactions: DeFiKitTransaction[]
  summary: string
}
