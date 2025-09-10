import { invariant } from '@epic-web/invariant'
import type { ExecutionRoute, MetaTransactionRequest } from '@zodiac/schema'
import { checkPermissions as baseCheckPermissions } from 'ser-kit'

type SuccessResult = {
  error: null
  permissionCheck: Awaited<ReturnType<typeof baseCheckPermissions>>
}

type ErrorResult = {
  error: Error
  permissionCheck: null
}

type CheckPermissionsResult = SuccessResult | ErrorResult

export const checkPermissions = async (
  { initiator, waypoints, ...route }: ExecutionRoute,
  transactions: MetaTransactionRequest[],
): Promise<CheckPermissionsResult> => {
  invariant(initiator != null, 'Route needs an initiator')
  invariant(waypoints != null, 'Route does not provide any waypoints')

  try {
    const permissionCheck = await baseCheckPermissions(transactions, {
      initiator,
      waypoints,
      ...route,
    })

    return {
      error: null,
      permissionCheck,
    }
  } catch (error) {
    return {
      error: new Error('Could not check permissions', { cause: error }),
      permissionCheck: null,
    }
  }
}
