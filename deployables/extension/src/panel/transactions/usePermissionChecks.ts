import { ExecutionRoute } from '@zodiac/schema'
import { useEffect } from 'react'
import { AccountType } from 'ser-kit'
import { useDispatch } from './TransactionsContext'
import { clearPermissionChecks } from './actions'

export const usePermissionChecks = (route: ExecutionRoute) => {
  const dispatch = useDispatch()

  const routeHasRoles = routeGoesThroughRoles(route)

  useEffect(() => {
    if (routeHasRoles) {
      return
    }

    dispatch(clearPermissionChecks())
  }, [dispatch, routeHasRoles])
}

const routeGoesThroughRoles = (route: ExecutionRoute | null) => {
  if (route == null) {
    return false
  }

  if (route.waypoints == null) {
    return false
  }

  return route.waypoints.some(
    ({ account }) => account.type === AccountType.ROLES,
  )
}
