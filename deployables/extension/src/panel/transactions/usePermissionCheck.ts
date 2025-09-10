import { invariant } from '@epic-web/invariant'
import { EOA_ZERO_ADDRESS } from '@zodiac/chains'
import { checkPermissions } from '@zodiac/modules'
import { ExecutionRoute } from '@zodiac/schema'
import { useEffect } from 'react'
import { AccountType, Route } from 'ser-kit'
import { useDispatch, useTransaction } from './TransactionsContext'
import {
  clearPermissionChecks,
  failPermissionCheck,
  passPermissionCheck,
} from './actions'

export const usePermissionCheck = (
  route: ExecutionRoute,
  transactionId: string,
) => {
  const dispatch = useDispatch()

  const transaction = useTransaction(transactionId)
  const routeHasRoles = routeGoesThroughRoles(route)

  useEffect(() => {
    if (routeHasRoles) {
      return
    }

    dispatch(clearPermissionChecks())
  }, [dispatch, routeHasRoles])

  useEffect(() => {
    const abortController = new AbortController()

    if (routeHasRoles === false) {
      return
    }

    const { waypoints } = route

    invariant(waypoints != null, 'Route must have waypoints')

    const checkableRoute = {
      ...route,
      waypoints,
      initiator: route.initiator ?? EOA_ZERO_ADDRESS,
    } satisfies Route

    checkPermissions(checkableRoute, [transaction]).then((result) => {
      if (abortController.signal.aborted) {
        return
      }

      if (result.error == null) {
        if (result.permissionCheck.success) {
          dispatch(passPermissionCheck({ transactionId: transaction.id }))
        } else {
          dispatch(
            failPermissionCheck({
              transactionId: transaction.id,
              error: result.permissionCheck.error,
            }),
          )
        }
      }
    })

    return () => {
      abortController.abort('Effect cancelled')
    }
  }, [dispatch, route, routeHasRoles, transaction])
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
