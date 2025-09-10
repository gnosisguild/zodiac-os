import type { State } from '@/transactions'

export const createTransactionState = (state: Partial<State> = {}): State => ({
  pending: [],
  executed: [],

  rollback: null,
  refresh: false,

  permissionChecks: {},

  ...state,
})
