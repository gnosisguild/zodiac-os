import { vnetTransactionsListSchema } from '../types'
import { api } from './api'

export const getVnetTransactions = async (vnetId: string) => {
  return api(`/${vnetId}/transactions`, {
    searchParams: {
      kind: 'blockchain',
      category: 'write',
      status: 'success',
      per_page: 100,
    },
    schema: vnetTransactionsListSchema,
  })
}
