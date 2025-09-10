import type { MetaTransactionRequest } from '@zodiac/schema'
import { PermissionViolation } from 'ser-kit'
import type { ContractInfo } from './state'

export enum ActionType {
  Append = 'Append',
  Decode = 'Decode',
  Confirm = 'Confirm',
  Clear = 'Clear',
  Fail = 'Fail',
  Finish = 'Finish',
  Revert = 'Revert',
  Rollback = 'Rollback',
  ConfirmRollback = 'ConfirmRollback',
  Translate = 'Translate',
  Refresh = 'Refresh',
  CommitRefresh = 'CommitRefresh',
  GlobalTranslate = 'GlobalTranslate',
  PassPermissionCheck = 'PassPermissionCheck',
  FailPermissionCheck = 'FailPermissionCheck',
  ClearPermissionChecks = 'ClearPermissionChecks',
}

type Action<Type extends ActionType, Payload = null> = {
  type: Type
  payload: Payload
}
type Payload<T extends Action<ActionType, unknown>> = T['payload']

type AppendTransactionAction = Action<
  ActionType.Append,
  { transaction: MetaTransactionRequest }
>

export const appendTransaction = (
  payload: Payload<AppendTransactionAction>,
): AppendTransactionAction => ({ type: ActionType.Append, payload })

type DecodeTransactionAction = Action<
  ActionType.Decode,
  {
    id: string
    contractInfo: ContractInfo
  }
>

export const decodeTransaction = (
  payload: Payload<DecodeTransactionAction>,
): DecodeTransactionAction => ({ type: ActionType.Decode, payload })

type ConfirmTransactionAction = Action<
  ActionType.Confirm,
  {
    id: string
    snapshotId: string
    transactionHash: string
  }
>

export const confirmTransaction = (
  payload: Payload<ConfirmTransactionAction>,
): ConfirmTransactionAction => ({ type: ActionType.Confirm, payload })

type FailTransactionAction = Action<ActionType.Fail, { id: string }>

export const failTransaction = (
  payload: Payload<FailTransactionAction>,
): FailTransactionAction => ({
  type: ActionType.Fail,
  payload,
})

type FinishTransactionAction = Action<ActionType.Finish, { id: string }>

export const finishTransaction = (
  payload: Payload<FinishTransactionAction>,
): FinishTransactionAction => ({ type: ActionType.Finish, payload })

type RevertTransactionAction = Action<ActionType.Revert, { id: string }>

export const revertTransaction = (
  payload: Payload<RevertTransactionAction>,
): RevertTransactionAction => ({ type: ActionType.Revert, payload })

type ClearTransactionsAction = Action<ActionType.Clear>

export const clearTransactions = (): ClearTransactionsAction => ({
  type: ActionType.Clear,
  payload: null,
})

type RollbackTransactionType = Action<ActionType.Rollback, { id: string }>

export const rollbackTransaction = (
  payload: Payload<RollbackTransactionType>,
): RollbackTransactionType => ({ type: ActionType.Rollback, payload })

type ConfirmRollbackTransactionAction = Action<
  ActionType.ConfirmRollback,
  { id: string }
>

export const confirmRollbackTransaction = (
  payload: Payload<ConfirmRollbackTransactionAction>,
): ConfirmRollbackTransactionAction => ({
  type: ActionType.ConfirmRollback,
  payload,
})

type TranslateTransactionAction = Action<
  ActionType.Translate,
  {
    id: string
    translations: MetaTransactionRequest[]
  }
>

export const translateTransaction = (
  payload: Payload<TranslateTransactionAction>,
): TranslateTransactionAction => ({ type: ActionType.Translate, payload })

type RefreshTransactionsAction = Action<ActionType.Refresh>

export const refreshTransactions = (): RefreshTransactionsAction => ({
  type: ActionType.Refresh,
  payload: null,
})

type CommitRefreshAction = Action<ActionType.CommitRefresh>

export const commitRefreshTransactions = (): CommitRefreshAction => ({
  type: ActionType.CommitRefresh,
  payload: null,
})

type GlobalTranslateTransactionsAction = Action<
  ActionType.GlobalTranslate,
  { translations: MetaTransactionRequest[] }
>

export const globalTranslateTransactions = (
  payload: Payload<GlobalTranslateTransactionsAction>,
): GlobalTranslateTransactionsAction => ({
  type: ActionType.GlobalTranslate,
  payload,
})

type PassPermissionCheckAction = Action<
  ActionType.PassPermissionCheck,
  { transactionId: string }
>

export const passPermissionCheck = (
  payload: PassPermissionCheckAction['payload'],
): PassPermissionCheckAction => ({
  type: ActionType.PassPermissionCheck,
  payload,
})

type FailPermissionCheckAction = Action<
  ActionType.FailPermissionCheck,
  { transactionId: string; error: PermissionViolation }
>

export const failPermissionCheck = (
  payload: Payload<FailPermissionCheckAction>,
): FailPermissionCheckAction => ({
  type: ActionType.FailPermissionCheck,
  payload,
})

type ClearPermissionChecksAction = Action<ActionType.ClearPermissionChecks>

export const clearPermissionChecks = (): ClearPermissionChecksAction => ({
  type: ActionType.ClearPermissionChecks,
  payload: null,
})

export type TransactionAction =
  | AppendTransactionAction
  | DecodeTransactionAction
  | ConfirmTransactionAction
  | ClearTransactionsAction
  | FailTransactionAction
  | FinishTransactionAction
  | RevertTransactionAction
  | RollbackTransactionType
  | ConfirmRollbackTransactionAction
  | TranslateTransactionAction
  | RefreshTransactionsAction
  | CommitRefreshAction
  | GlobalTranslateTransactionsAction
  | PassPermissionCheckAction
  | FailPermissionCheckAction
  | ClearPermissionChecksAction
