import type { Hex, MetaTransactionRequest } from '@zodiac/schema'
import type { ExecutionStatus } from './executionStatus'

type AbiFragment = object

export interface ContractInfo {
  address: Hex
  proxyTo?: Hex
  verified: boolean
  name?: string
  abi?: AbiFragment[]
}

export type UnconfirmedTransaction = MetaTransactionRequest & {
  id: string
  createdAt: Date
  contractInfo?: ContractInfo
}

export type ConfirmedTransaction = UnconfirmedTransaction & {
  snapshotId: string
  transactionHash: string
  executedAt: Date
  status: ExecutionStatus
}

export type Transaction = UnconfirmedTransaction | ConfirmedTransaction

export type State = {
  pending: UnconfirmedTransaction[]
  executed: ConfirmedTransaction[]

  rollback: ConfirmedTransaction | null

  refresh: boolean
}
