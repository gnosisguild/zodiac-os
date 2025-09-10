import type { Hex, MetaTransactionRequest } from '@zodiac/schema'
import { PermissionViolation } from 'ser-kit'
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

export enum PermissionCheckStatusType {
  void = 'void',
  pending = 'pending',
  passed = 'passed',
  failed = 'failed',
}

type VoidPermissionCheck = {
  type: PermissionCheckStatusType.void
}

type PendingPermissionCheck = {
  type: PermissionCheckStatusType.pending
}

type PassedPermissionCheck = {
  type: PermissionCheckStatusType.passed
}

type FailedPermissionCheck = {
  type: PermissionCheckStatusType.failed
  error: PermissionViolation
}

type PermissionCheck =
  | VoidPermissionCheck
  | PendingPermissionCheck
  | PassedPermissionCheck
  | FailedPermissionCheck

export type State = {
  pending: UnconfirmedTransaction[]
  executed: ConfirmedTransaction[]

  rollback: ConfirmedTransaction | null

  refresh: boolean

  permissionChecks: Record<string, PermissionCheck>
}
