import { getAvailableChains } from '@/balances-server'
import {
  loadAndActivateRoute,
  loadRoutes,
  postMessage,
  render,
} from '@/test-utils'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { activateRoute, dbClient, getAccounts } from '@zodiac/db'
import {
  accountFactory,
  routeFactory,
  tenantFactory,
  userFactory,
  walletFactory,
} from '@zodiac/db/test-utils'
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

describe.sequential('List Routes', () => {
  beforeEach(() => {
    mockGetAvailableChains.mockResolvedValue([])
  })

  describe('List', () => {
    describe('Logged in', () => {
      it('lists all accounts', async () => {
        const tenant = await tenantFactory.create()
        const user = await userFactory.create(tenant)

        await accountFactory.create(tenant, user, {
          label: 'Test account',
        })

        await render(href('/edit'), { tenant, user })

        expect(
          await screen.findByRole('cell', { name: 'Test account' }),
        ).toBeInTheDocument()
      })

      it('shows the currently active initiator', async () => {
        const tenant = await tenantFactory.create()
        const user = await userFactory.create(tenant)
        const account = await accountFactory.create(tenant, user)
        const wallet = await walletFactory.create(user, {
          label: 'Test wallet',
        })
        const route = await routeFactory.create(account, wallet)

        await activateRoute(dbClient(), tenant, user, route)

        await render(href('/edit'), { tenant, user })

        expect(
          await screen.findByRole('cell', { name: 'Test wallet' }),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Edit', () => {
    describe('Logged in', () => {
      it('is possible to edit a route', async () => {
        const tenant = await tenantFactory.create()
        const user = await userFactory.create(tenant)

        const account = await accountFactory.create(tenant, user)

        await render(href('/edit'), {
          tenant,
          user,
        })

        await userEvent.click(
          await screen.findByRole('button', { name: 'Account options' }),
        )
        await userEvent.click(await screen.findByRole('link', { name: 'Edit' }))

        await expectRouteToBe(
          href('/account/:accountId', {
            accountId: account.id,
          }),
        )
      })
    })

    describe('Logged out', () => {
      it('is possible to edit a route', async () => {
        const route = createMockExecutionRoute({ label: 'Test route' })

        await render(href('/edit'), {
          availableRoutes: [route],
        })

        await postMessage({
          type: CompanionResponseMessageType.PROVIDE_ACTIVE_ROUTE,
          activeRouteId: route.id,
        })

        await userEvent.click(
          await screen.findByRole('button', { name: 'Account options' }),
        )
        await userEvent.click(await screen.findByRole('link', { name: 'Edit' }))

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
  })

  describe('Remove', () => {
    describe('Logged in', () => {
      it('is possible to remove an account', async () => {
        const tenant = await tenantFactory.create()
        const user = await userFactory.create(tenant)

        const account = await accountFactory.create(tenant, user)

        const { waitForPendingActions } = await render(href('/edit'), {
          tenant,
          user,
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

        await waitForPendingActions()

        const [deletedAccount] = await getAccounts(dbClient(), {
          userId: user.id,
          tenantId: tenant.id,
          deleted: true,
        })

        expect(deletedAccount).toMatchObject({
          id: account.id,

          deleted: true,
          deletedById: user.id,
        })
      })
    })

    describe('Logged out', () => {
      it('is possible to remove an account', async () => {
        const route = createMockExecutionRoute({ label: 'Test route' })
        const mockPostMessage = vi.spyOn(window, 'postMessage')

        await render(href('/edit'), {
          availableRoutes: [route],
        })

        await loadAndActivateRoute(route)

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
          availableRoutes: [route],
        })

        await loadAndActivateRoute(route)

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
  })
})
