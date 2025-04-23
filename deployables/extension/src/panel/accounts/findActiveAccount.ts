import {
  findRemoteActiveAccount,
  toAccount,
  type FetchOptions,
} from '@/companion'
import { getLastUsedRouteId, getRoutes } from '@/execution-routes'

export const findActiveAccount = async (options: FetchOptions = {}) => {
  const activeAccount = await findRemoteActiveAccount(options)

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
