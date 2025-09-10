import { createConfirmedTransaction, createTransaction } from '@/test-utils'
import { createMockTransactionRequest } from '@zodiac/modules/test-utils'
import { addMinutes } from 'date-fns'
import { describe, expect, it } from 'vitest'
import {
  appendTransaction,
  clearPermissionChecks,
  clearTransactions,
  commitRefreshTransactions,
  confirmRollbackTransaction,
  confirmTransaction,
  failPermissionCheck,
  failTransaction,
  finishTransaction,
  passPermissionCheck,
  refreshTransactions,
  revertTransaction,
  rollbackTransaction,
  translateTransaction,
} from './actions'
import { ExecutionStatus } from './executionStatus'
import { transactionsReducer } from './reducer'
import { PermissionCheckStatusType, type State } from './state'

describe('Transactions reducer', () => {
  const createState = (initialState: Partial<State> = {}): State => ({
    pending: [],
    executed: [],

    rollback: null,
    refresh: false,

    permissionChecks: {},

    ...initialState,
  })

  describe('Append', () => {
    it('adds a transaction to the pending queue', () => {
      const transaction = createMockTransactionRequest()

      expect(
        transactionsReducer(createState(), appendTransaction({ transaction })),
      ).toMatchObject({
        pending: [expect.objectContaining(transaction)],
      })
    })
  })

  describe('Confirm', () => {
    it('moves a transaction from the pending to the confirmed state', () => {
      const transaction = createTransaction()

      expect(
        transactionsReducer(
          createState({ pending: [transaction] }),
          confirmTransaction({
            id: transaction.id,
            snapshotId: 'test',
            transactionHash: 'test',
          }),
        ),
      ).toMatchObject({
        pending: [],
        executed: [
          {
            ...transaction,
            snapshotId: 'test',
            transactionHash: 'test',
            status: ExecutionStatus.CONFIRMED,
          },
        ],
      })
    })

    it('ignores confirmations for transactions that are not in the pending state', () => {
      const transaction = createConfirmedTransaction()

      expect(
        transactionsReducer(
          createState({ executed: [transaction] }),
          confirmTransaction({
            id: 'not-found',
            snapshotId: 'test',
            transactionHash: 'test',
          }),
        ),
      ).toMatchObject({ executed: [transaction] })
    })
  })

  describe('Clear', () => {
    it('is possible to remove all transactions', () => {
      const initialState = createState({
        executed: [createConfirmedTransaction(), createConfirmedTransaction()],
      })

      expect(
        transactionsReducer(initialState, clearTransactions()),
      ).toMatchObject({ executed: [] })
    })
  })

  describe('Failure', () => {
    it('moves a transaction from the pending state into the failed state', () => {
      const transaction = createConfirmedTransaction()

      expect(
        transactionsReducer(
          createState({ executed: [transaction] }),
          failTransaction({ id: transaction.id }),
        ),
      ).toMatchObject({
        pending: [],
        executed: [{ ...transaction, status: ExecutionStatus.FAILED }],
      })
    })
  })

  describe('Success', () => {
    it('moves a transaction from the pending state to the done state', () => {
      const transaction = createConfirmedTransaction()

      expect(
        transactionsReducer(
          createState({ executed: [transaction] }),
          finishTransaction({ id: transaction.id }),
        ),
      ).toMatchObject({
        executed: [{ ...transaction, status: ExecutionStatus.SUCCESS }],
      })
    })
  })

  describe('Revert', () => {
    it('moves a transaction from the pending to the reverted state', () => {
      const transaction = createConfirmedTransaction()

      expect(
        transactionsReducer(
          createState({ executed: [transaction] }),
          revertTransaction({ id: transaction.id }),
        ),
      ).toMatchObject({
        executed: [
          { ...transaction, status: ExecutionStatus.META_TRANSACTION_REVERTED },
        ],
      })
    })
  })

  describe('Rollback', () => {
    it('is possible to confirm a rollback', () => {
      const transaction = createConfirmedTransaction()

      expect(
        transactionsReducer(
          createState({ rollback: transaction }),
          confirmRollbackTransaction({ id: transaction.id }),
        ),
      ).toMatchObject({ rollback: null })
    })

    describe('Successful transaction', () => {
      it('puts a transaction into the rollback state', () => {
        const transaction = createConfirmedTransaction()

        expect(
          transactionsReducer(
            createState({ executed: [transaction] }),
            rollbackTransaction({ id: transaction.id }),
          ),
        ).toMatchObject({ rollback: transaction, executed: [] })
      })

      it('puts all transaction that came after the one that was rolled back into pending state', () => {
        const transactionA = createConfirmedTransaction()
        const transactionB = createConfirmedTransaction()

        const initialState = createState({
          executed: [transactionA, transactionB],
        })

        expect(
          transactionsReducer(
            initialState,
            rollbackTransaction({ id: transactionA.id }),
          ),
        ).toMatchObject({
          rollback: transactionA,
          pending: [transactionB],
          executed: [],
        })
      })
    })

    describe('Failed transaction', () => {
      it('puts a transaction into the rollback state', () => {
        const transaction = createConfirmedTransaction({
          status: ExecutionStatus.FAILED,
        })

        expect(
          transactionsReducer(
            createState({ executed: [transaction] }),
            rollbackTransaction({ id: transaction.id }),
          ),
        ).toMatchObject({ rollback: transaction, executed: [] })
      })

      it('puts all transaction that came after the one that was rolled back into pending state', () => {
        const transactionA = createConfirmedTransaction({
          status: ExecutionStatus.FAILED,
        })
        const transactionB = createConfirmedTransaction({
          status: ExecutionStatus.FAILED,
        })

        const initialState = createState({
          executed: [transactionA, transactionB],
        })

        expect(
          transactionsReducer(
            initialState,
            rollbackTransaction({ id: transactionA.id }),
          ),
        ).toMatchObject({
          rollback: transactionA,
          pending: [transactionB],
          executed: [],
        })
      })
    })
  })

  describe('Refresh', () => {
    it('puts all transactions into pending state sorted by date', () => {
      const now = new Date()

      const transactionA = createConfirmedTransaction({ createdAt: now })
      const transactionB = createConfirmedTransaction({
        createdAt: addMinutes(now, 1),
        status: ExecutionStatus.FAILED,
      })
      const transactionC = createConfirmedTransaction({
        createdAt: addMinutes(now, 2),
        status: ExecutionStatus.CONFIRMED,
      })
      const transactionD = createConfirmedTransaction({
        createdAt: addMinutes(now, 3),
        status: ExecutionStatus.META_TRANSACTION_REVERTED,
      })

      const initialState = createState({
        executed: [transactionA, transactionB, transactionC, transactionD],
      })

      expect(
        transactionsReducer(initialState, refreshTransactions()),
      ).toMatchObject({
        pending: [transactionA, transactionB, transactionC, transactionD],

        executed: [],
      })
    })

    it('sets the refresh flag', () => {
      expect(
        transactionsReducer(createState(), refreshTransactions()),
      ).toMatchObject({ refresh: true })
    })

    it('is possible to commit a refresh', () => {
      expect(
        transactionsReducer(
          createState({ refresh: true }),
          commitRefreshTransactions(),
        ),
      ).toMatchObject({ refresh: false })
    })
  })

  describe('Apply translation', () => {
    it('enqueues all new transactions and rolls back the current transaction being translated', () => {
      const transactionA = createConfirmedTransaction()
      const transactionB = createConfirmedTransaction()

      const translation = createMockTransactionRequest()

      const initialState = createState({
        executed: [transactionA, transactionB],
      })

      expect(
        transactionsReducer(
          initialState,
          translateTransaction({
            id: transactionA.id,
            translations: [translation],
          }),
        ),
      ).toMatchObject({
        rollback: transactionA,
        pending: [expect.objectContaining(translation), transactionB],
      })
    })

    it.todo('apply global translation')
  })

  describe('Permission checks', async () => {
    it('enqueues a transaction for a permission check when it has been executed', () => {
      const state = transactionsReducer(
        createState(),
        appendTransaction({ transaction: createMockTransactionRequest() }),
      )

      const [transaction] = state.pending

      expect(state).toMatchObject({
        permissionChecks: {
          [transaction.id]: { type: PermissionCheckStatusType.pending },
        },
      })
    })

    it('is possible to mark a permission check as successful', () => {
      const transaction = createTransaction()

      expect(
        transactionsReducer(
          createState({
            permissionChecks: {
              [transaction.id]: { type: PermissionCheckStatusType.pending },
            },
          }),
          passPermissionCheck({ transactionId: transaction.id }),
        ),
      ).toMatchObject({
        permissionChecks: {
          [transaction.id]: { type: PermissionCheckStatusType.passed },
        },
      })
    })

    it('is possible to mark a permission check as failed', () => {
      const transaction = createTransaction()

      expect(
        transactionsReducer(
          createState({
            permissionChecks: {
              [transaction.id]: { type: PermissionCheckStatusType.pending },
            },
          }),
          failPermissionCheck({ transactionId: transaction.id }),
        ),
      ).toMatchObject({
        permissionChecks: {
          [transaction.id]: { type: PermissionCheckStatusType.failed },
        },
      })
    })

    it('is possible to clear all permission checks', () => {
      const transaction = createTransaction()

      expect(
        transactionsReducer(
          createState({
            permissionChecks: {
              [transaction.id]: { type: PermissionCheckStatusType.pending },
            },
          }),
          clearPermissionChecks(),
        ),
      ).toMatchObject({
        permissionChecks: {},
      })
    })
  })
})
