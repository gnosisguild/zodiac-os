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
  pending = 'pending',
  passed = 'passed',
  failed = 'failed',
}

type PendingPermissionCheck = {
  type: PermissionCheckStatusType.pending
}

type PassedPermissionCheck = {
  type: PermissionCheckStatusType.passed
}
type PermissionCheckServiceUnavailable = 'Service unavailable'

export type PermissionCheckError =
  | PermissionViolation
  | PermissionCheckServiceUnavailable

type FailedPermissionCheck = {
  type: PermissionCheckStatusType.failed
  error: PermissionCheckError
}

type PermissionCheck =
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
