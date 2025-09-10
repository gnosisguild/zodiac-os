import { useOptionalExecutionRoute } from '@/execution-routes'
import { invariant } from '@epic-web/invariant'
import { EOA_ZERO_ADDRESS } from '@zodiac/chains'
import { checkPermissions } from '@zodiac/modules'
import { ExecutionRoute } from '@zodiac/schema'
import { useEffect } from 'react'
import { AccountType, Route } from 'ser-kit'
import {
  useDispatch,
  usePermissionCheckResult,
  useTransaction,
} from './TransactionsContext'
import {
  clearPermissionChecks,
  failPermissionCheck,
  passPermissionCheck,
} from './actions'
import { PermissionCheckError, PermissionCheckStatusType } from './state'

type PermissionCheckResult = {
  isPending: boolean
  isSkipped: boolean
  error: PermissionCheckError | null
}

export const usePermissionCheck = (
  transactionId: string,
): PermissionCheckResult => {
  const dispatch = useDispatch()

  const route = useOptionalExecutionRoute()
  const transaction = useTransaction(transactionId)
  const routeHasRoles = routeGoesThroughRoles(route)

  const state = usePermissionCheckResult(transactionId)

  const isPending =
    state != null && state.type == PermissionCheckStatusType.pending

  useEffect(() => {
    if (routeHasRoles) {
      return
    }

    dispatch(clearPermissionChecks())
  }, [dispatch, routeHasRoles])

  useEffect(() => {
    const abortController = new AbortController()

    if (!isPending) {
      return
    }

    if (routeHasRoles === false) {
      return
    }

    if (route == null) {
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
      } else {
        dispatch(
          failPermissionCheck({
            transactionId: transaction.id,
            error: 'Service unavailable',
          }),
        )
      }
    })

    return () => {
      abortController.abort('Effect cancelled')
    }
  }, [dispatch, isPending, route, routeHasRoles, transaction])

  if (state == null) {
    return { isPending: false, isSkipped: true, error: null }
  }

  switch (state.type) {
    case PermissionCheckStatusType.pending: {
      return { isPending: true, isSkipped: false, error: null }
    }
    case PermissionCheckStatusType.failed: {
      return { isPending: false, isSkipped: false, error: state.error }
    }
    case PermissionCheckStatusType.passed: {
      return { isPending: false, isSkipped: false, error: null }
    }
  }
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
