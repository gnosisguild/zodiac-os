import { createTransaction, renderHook } from '@/test-utils'
import { waitFor } from '@testing-library/react'
import { checkPermissions } from '@zodiac/modules'
import {
  createMockExecutionRoute,
  createMockMemberConnection,
  createMockRolesExecutionAccount,
  createMockWaypoints,
} from '@zodiac/modules/test-utils'
import { beforeEach } from 'node:test'
import { describe, expect, it, vi } from 'vitest'
import { PermissionCheckStatusType } from './state'
import { usePermissionCheck } from './usePermissionCheck'

vi.mock('@zodiac/modules', async (importOriginal) => {
  const module = await importOriginal<typeof import('@zodiac/modules')>()

  return {
    ...module,

    checkPermissions: vi.fn(),
  }
})

const mockCheckPermissions = vi.mocked(checkPermissions)

describe('usePermissionCheck', () => {
  beforeEach(() => {
    mockCheckPermissions.mockResolvedValue({
      error: null,
      permissionCheck: { success: true, error: undefined },
    })
  })

  describe('Route without roles mod', () => {
    it('voids the check for a transaction when the route does not go through a roles mod', async () => {
      const transaction = createTransaction()
      const route = createMockExecutionRoute()

      const { getState } = await renderHook(
        () => usePermissionCheck(route, transaction.id),
        {
          initialState: {
            pending: [transaction],
            permissionChecks: {
              [transaction.id]: { type: PermissionCheckStatusType.pending },
            },
          },
        },
      )

      expect(getState()).toMatchObject({ permissionChecks: {} })
    })
  })

  describe('Route with roles mod', () => {
    const route = createMockExecutionRoute({
      waypoints: createMockWaypoints({
        waypoints: [
          {
            account: createMockRolesExecutionAccount(),
            connection: createMockMemberConnection(),
          },
        ],
      }),
    })

    it('marks transactions that pass the check as passed', async () => {
      const transaction = createTransaction()

      mockCheckPermissions.mockResolvedValue({
        error: null,
        permissionCheck: { success: true, error: undefined },
      })

      const { getState } = await renderHook(
        () => usePermissionCheck(route, transaction.id),
        {
          initialState: {
            pending: [transaction],
            permissionChecks: {
              [transaction.id]: { type: PermissionCheckStatusType.pending },
            },
          },
        },
      )

      await waitFor(() => {
        expect(getState()).toMatchObject({
          permissionChecks: {
            [transaction.id]: { type: PermissionCheckStatusType.passed },
          },
        })
      })
    })
  })
})
