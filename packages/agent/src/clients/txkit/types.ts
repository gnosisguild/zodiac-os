export type Chain = 'eth' | 'arb' | 'opt' | 'base' | 'gno'
export type Action = 'swap' | 'deposit' | 'borrow' | 'stake' | 'lock'

export interface ActionRequest {
  protocol: string
  action: Action
  chain: Chain
  // Asset and routing
  asset?: string
  from?: string
  to?: string
  amount?: string | number
  minAmountOut?: string
  slippageBps?: number
  feeAmountBp?: number
  ttlSeconds?: number
  receiver?: string
  sender: string
  verifyingContractOverride?: string
  // Aave/Spark specific
  market?: 'Core' | 'Prime' | 'EtherFi'
  onBehalfOf?: string
  interestRateMode?: 1 | 2
  referralCode?: number
  // Lido specific
  referral?: string
}

export interface ApproveRequest {
  chain: Chain
  token: string // symbol or address
  spender: string // address
  amount: string | number // human units or 'max'
  sender: string
}

export type ExecutionKind = 'eip712' | 'safeTx'

export interface EIP712Domain {
  name?: string
  version?: string
  chainId?: number
  verifyingContract?: string
}

export interface EIP712TypedData {
  domain: EIP712Domain
  types: Record<string, Array<{ name: string; type: string }>>
  primaryType: string
  message: Record<string, any>
}

export interface SafeTxMethodInput {
  name: string
  type: string
  components?: SafeTxMethodInput[]
}

export interface SafeTxPayload {
  to: string
  value: string
  operation?: 0 | 1
  contractMethod: {
    name: string
    payable: boolean
    inputs: SafeTxMethodInput[]
  }
  contractInputsValues: Record<string, any>
}

export interface ExecutionPayload {
  kind: ExecutionKind
  chainId: number
  preview: string
  eip712?: EIP712TypedData & { signer: string; metadata?: Record<string, any> }
  safeTx?: SafeTxPayload
}

export interface ActionBuilder {
  supports(protocol: string, action: string, chain: Chain): boolean
  build(req: ActionRequest): Promise<ExecutionPayload>
}
