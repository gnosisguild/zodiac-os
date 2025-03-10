import { getAvailableChains } from '@/balances-server'
import { loadRoutes, postMessage, render } from '@/test-utils'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  CompanionAppMessageType,
  CompanionResponseMessageType,
  type CompanionAppMessage,
} from '@zodiac/messages'
import { encode } from '@zodiac/schema'
import { createMockExecutionRoute, expectRouteToBe } from '@zodiac/test-utils'
import { href } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetAvailableChains = vi.mocked(getAvailableChains)

describe('List Routes', () => {
  beforeEach(() => {
    mockGetAvailableChains.mockResolvedValue([])
  })

  describe('Active route', () => {
    it('indicates which route is currently active', async () => {
      const route = createMockExecutionRoute({ label: 'Test route' })

      await render(href('/edit'), {
        version: '3.6.0',
        availableRoutes: [route],
        activeRouteId: route.id,
      })

      expect(
        await screen.findByRole('cell', { name: 'Test route' }),
      ).toHaveAccessibleDescription('Active')
    })
  })

  describe('Edit', () => {
    it('is possible to edit a route', async () => {
      const route = createMockExecutionRoute({ label: 'Test route' })

      await render(href('/edit'), {
        version: '3.4.0',
        availableRoutes: [route],
      })

      await userEvent.click(
        await screen.findByRole('button', { name: 'Account options' }),
      )
      await userEvent.click(await screen.findByRole('button', { name: 'Edit' }))

      await postMessage({
        type: CompanionResponseMessageType.PROVIDE_ROUTE,
        route,
      })

      await loadRoutes()

      await expectRouteToBe(
        href('/edit/:routeId/:data', {
          routeId: route.id,
          data: encode(route),
        }),
      )
    })
  })

  describe('Remove', () => {
    it('is possible to remove a route', async () => {
      const route = createMockExecutionRoute({ label: 'Test route' })
      const mockPostMessage = vi.spyOn(window, 'postMessage')

      await render(href('/edit'), {
        version: '3.6.0',
        availableRoutes: [route],
      })

      await userEvent.click(
        await screen.findByRole('button', { name: 'Account options' }),
      )
      await userEvent.click(
        await screen.findByRole('button', { name: 'Delete' }),
      )

      const { getByRole } = within(
        screen.getByRole('dialog', { name: 'Confirm delete' }),
      )

      await userEvent.click(getByRole('button', { name: 'Delete' }))

      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          type: CompanionAppMessageType.DELETE_ROUTE,
          routeId: route.id,
        } satisfies CompanionAppMessage,
        '*',
      )
    })

    it('hides the dialog once the delete is confirmed', async () => {
      const route = createMockExecutionRoute({ label: 'Test route' })

      await render(href('/edit'), {
        version: '3.6.0',
        availableRoutes: [route],
      })

      await userEvent.click(
        await screen.findByRole('button', { name: 'Account options' }),
      )
      await userEvent.click(
        await screen.findByRole('button', { name: 'Delete' }),
      )

      const { getByRole } = within(
        screen.getByRole('dialog', { name: 'Confirm delete' }),
      )

      await userEvent.click(getByRole('button', { name: 'Delete' }))

      await postMessage({ type: CompanionResponseMessageType.DELETED_ROUTE })

      await waitFor(() => {
        expect(
          screen.queryByRole('dialog', { name: 'Confirm delete' }),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Launch', () => {
    it('is possible to launch a route', async () => {
      const route = createMockExecutionRoute({ label: 'Test route' })
      const mockPostMessage = vi.spyOn(window, 'postMessage')

      await render(href('/edit'), {
        version: '3.6.0',
        availableRoutes: [route],
      })

      await userEvent.click(
        await screen.findByRole('button', { name: 'Launch' }),
      )

      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          type: CompanionAppMessageType.LAUNCH_ROUTE,
          routeId: route.id,
        } satisfies CompanionAppMessage,
        '*',
      )
    })
  })
})
