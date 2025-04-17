import {
  getRemoteActiveAccount,
  toAccount,
  type FetchOptions,
} from '@/companion'
import { getLastUsedRouteId, getRoutes } from '@/execution-routes'

export const getActiveAccount = async (options: FetchOptions = {}) => {
  const activeAccount = await getRemoteActiveAccount(options)

  if (activeAccount != null) {
    return activeAccount
  }

  const routes = await getRoutes()
  const activeAccountId = await getLastUsedRouteId()

  const route = routes.find((route) => route.id === activeAccountId)

  if (route == null) {
    return null
  }

  return toAccount(route)
}
