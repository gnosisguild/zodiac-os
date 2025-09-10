import { createTransaction, renderHook } from '@/test-utils'
import { createMockExecutionRoute } from '@zodiac/modules/test-utils'
import { describe, expect, it } from 'vitest'
import { PermissionCheckStatusType } from './state'
import { usePermissionChecks } from './usePermissionChecks'

describe('usePermissionChecks', () => {
  it('voids the check for a transaction when the route does not go through a roles mod', async () => {
    const transaction = createTransaction()
    const route = createMockExecutionRoute()

    const { getState } = await renderHook(() => usePermissionChecks(route), {
      initialState: {
        pending: [transaction],
        permissionChecks: {
          [transaction.id]: { type: PermissionCheckStatusType.pending },
        },
      },
    })

    expect(getState()).toMatchObject({ permissionChecks: {} })
  })
})
