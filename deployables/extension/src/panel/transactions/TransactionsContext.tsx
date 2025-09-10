import { invariant } from '@epic-web/invariant'
import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type PropsWithChildren,
} from 'react'
import type { TransactionAction } from './actions'
import { ExecutionStatus } from './executionStatus'
import { isConfirmedTransaction } from './isConfirmedTransaction'
import { transactionsReducer } from './reducer'
import type { State, Transaction } from './state'

const TransactionsContext = createContext<
  State & { dispatch: Dispatch<TransactionAction> }
>({
  pending: [],
  executed: [],

  rollback: null,
  refresh: false,

  permissionChecks: {},

  dispatch() {
    throw new Error('must be wrapped in <ProvideTransactions>')
  },
})

type ProvideTransactionsProps = PropsWithChildren<{
  initialState?: State
}>

export const ProvideTransactions = ({
  children,
  initialState = {
    pending: [],
    executed: [],

    rollback: null,
    refresh: false,

    permissionChecks: {},
  },
}: ProvideTransactionsProps) => {
  const [state, dispatch] = useReducer(transactionsReducer, initialState)

  return (
    <TransactionsContext value={{ ...state, dispatch }}>
      {children}
    </TransactionsContext>
  )
}

export const useDispatch = () => {
  const { dispatch } = useContext(TransactionsContext)

  return dispatch
}

export const useTransactions = () => {
  const state = useContext(TransactionsContext)

  return [...state.executed, ...state.pending]
}

export const useTransaction = (transactionId: string) => {
  const transactions = useTransactions()

  const transaction = transactions.find(
    (transaction) => transaction.id === transactionId,
  )

  invariant(
    transaction != null,
    `Could not find transaction with id "${transactionId}"`,
  )

  return transaction
}

export const useTransactionStatus = (
  transaction: Transaction,
): ExecutionStatus => {
  const { pending } = useContext(TransactionsContext)

  if (pending.includes(transaction)) {
    return ExecutionStatus.PENDING
  }

  invariant(
    isConfirmedTransaction(transaction),
    'Transaction is not pending but also not confirmed',
  )

  return transaction.status
}

export const useRollback = () => {
  const { rollback } = useContext(TransactionsContext)

  return rollback
}

export const usePendingTransactions = () => {
  const { pending } = useContext(TransactionsContext)

  return pending
}

export const useRefresh = () => {
  const { refresh } = useContext(TransactionsContext)

  return refresh
}

export const useExecutedTransactions = () => {
  const { executed } = useContext(TransactionsContext)

  return executed
}
