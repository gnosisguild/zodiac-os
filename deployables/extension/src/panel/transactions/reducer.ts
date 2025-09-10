import { invariant } from '@epic-web/invariant'
import { metaTransactionRequestEqual } from '@zodiac/schema'
import { nanoid } from 'nanoid'
import type { MetaTransactionRequest } from 'ser-kit'
import { ActionType, type TransactionAction } from './actions'
import { ExecutionStatus } from './executionStatus'
import {
  PermissionCheckStatusType,
  type ContractInfo,
  type State,
  type Transaction,
  type UnconfirmedTransaction,
} from './state'

export const transactionsReducer = (
  state: State,
  { type, payload }: TransactionAction,
): State => {
  switch (type) {
    case ActionType.Append: {
      const { transaction } = payload

      const trackedTransaction = createTransaction(transaction)

      return {
        ...state,

        pending: [...state.pending, trackedTransaction],

        permissionChecks: {
          ...state.permissionChecks,

          [trackedTransaction.id]: { type: PermissionCheckStatusType.pending },
        },
      }
    }

    case ActionType.Decode: {
      const { id, contractInfo } = payload

      return {
        ...state,

        pending: decodeTransaction(state.pending, id, contractInfo),
        executed: decodeTransaction(state.executed, id, contractInfo),
      }
    }

    case ActionType.Confirm: {
      const { id, snapshotId, transactionHash } = payload

      const transaction = findTransaction(state.pending, id)
      if (!transaction) {
        // Since Action.Confirm is dispatched async, it's possible that the account has been switched and the state cleared through Action.Clear in the meantime.
        // In that case, we ignore the confirmation.
        return state
      }

      return {
        ...state,

        pending: removeTransaction(state.pending, id),
        executed: [
          ...state.executed,
          {
            ...transaction,
            snapshotId,
            transactionHash,
            executedAt: new Date(),
            status: ExecutionStatus.CONFIRMED,
          },
        ],
      }
    }

    case ActionType.Clear: {
      return {
        pending: [],
        executed: [],

        rollback: null,
        refresh: false,

        permissionChecks: {},
      }
    }

    case ActionType.Fail: {
      const { id } = payload

      return {
        ...state,

        executed: updateTransactionStatus(
          state.executed,
          id,
          ExecutionStatus.FAILED,
        ),
      }
    }

    case ActionType.Finish: {
      const { id } = payload

      return {
        ...state,

        executed: updateTransactionStatus(
          state.executed,
          id,
          ExecutionStatus.SUCCESS,
        ),
      }
    }

    case ActionType.Revert: {
      const { id } = payload

      return {
        ...state,

        executed: updateTransactionStatus(
          state.executed,
          id,
          ExecutionStatus.META_TRANSACTION_REVERTED,
        ),
      }
    }

    case ActionType.Rollback: {
      const { id } = payload

      return rollback(state, id)
    }

    case ActionType.ConfirmRollback: {
      const { id } = payload

      invariant(state.rollback != null, 'No transaction rollback in progress')
      invariant(
        state.rollback.id === id,
        'Confirmed rollback id does not match transaction currently being rolled back',
      )

      return {
        ...state,

        rollback: null,
      }
    }

    case ActionType.Translate: {
      const { id, translations } = payload

      const rollbackState = rollback(state, id)
      return {
        ...rollbackState,

        // Rollback moves all transactions after the rollback transaction to pending.
        // Prepend the replacement transactions to keep everything in order.
        pending: [
          ...translations.map(createTransaction),
          ...rollbackState.pending,
        ],
      }
    }

    case ActionType.GlobalTranslate: {
      const { translations } = payload

      const firstDifferenceIndex = state.executed.findIndex(
        (tx, index) => !metaTransactionRequestEqual(tx, translations[index]),
      )

      if (
        firstDifferenceIndex === -1 &&
        translations.length === state.executed.length
      ) {
        console.warn(
          'Global translations returned the original set of transactions. It should return undefined in that case.',
        )

        return state
      }

      if (firstDifferenceIndex !== -1) {
        const updatedState = rollback(
          state,
          state.executed[firstDifferenceIndex].id,
        )

        return {
          ...updatedState,

          pending: [
            ...state.pending,
            ...translations.slice(firstDifferenceIndex).map(createTransaction),
          ],
        }
      }

      return {
        ...state,

        pending: [
          ...state.pending,
          ...translations.slice(state.executed.length).map(createTransaction),
        ],
      }
    }

    case ActionType.Refresh: {
      return {
        ...state,

        pending: state.executed,
        executed: [],

        refresh: true,
      }
    }

    case ActionType.CommitRefresh: {
      return { ...state, refresh: false }
    }

    case ActionType.PassPermissionCheck: {
      return {
        ...state,
        permissionChecks: {
          ...state.permissionChecks,
          [payload.transactionId]: { type: PermissionCheckStatusType.passed },
        },
      }
    }

    case ActionType.FailPermissionCheck: {
      return {
        ...state,

        permissionChecks: {
          ...state.permissionChecks,

          [payload.transactionId]: {
            type: PermissionCheckStatusType.failed,
            error: payload.error,
          },
        },
      }
    }

    case ActionType.ClearPermissionChecks: {
      return {
        ...state,

        permissionChecks: {},
      }
    }
  }
}

const createTransaction = (
  transaction: MetaTransactionRequest,
): UnconfirmedTransaction => ({
  ...transaction,
  id: nanoid(),
  createdAt: new Date(),
})

const decodeTransaction = <T extends Transaction>(
  transactions: T[],
  id: string,
  contractInfo: ContractInfo,
): T[] =>
  transactions.map((transaction) =>
    transaction.id === id ? { ...transaction, contractInfo } : transaction,
  )

const removeTransaction = <T extends Transaction>(
  transactions: T[],
  id: string,
): T[] => transactions.filter((transaction) => transaction.id !== id)

const getTransaction = <T extends Transaction>(
  transactions: T[],
  id: string,
): T => {
  const transaction = findTransaction(transactions, id)

  invariant(transaction != null, `Could not find transaction with id "${id}"`)

  return transaction
}

const findTransaction = <T extends Transaction>(
  transactions: T[],
  id: string,
): T | undefined => {
  const transaction = transactions.find((transaction) => transaction.id === id)

  return transaction
}

const rollback = (state: State, id: string): State => {
  const transaction = getTransaction(state.executed, id)

  const index = state.executed.indexOf(transaction)

  return {
    ...state,

    executed: state.executed.slice(0, index),
    pending: [...state.executed.slice(index + 1), ...state.pending],

    rollback: transaction,
  }
}

const updateTransactionStatus = <T extends Transaction>(
  transactions: T[],
  id: string,
  status: ExecutionStatus,
): T[] =>
  transactions.map((transaction) => {
    if (transaction.id === id) {
      return { ...transaction, status }
    }

    return transaction
  })
