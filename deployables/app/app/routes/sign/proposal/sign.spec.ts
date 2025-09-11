import { simulateTransactionBundle } from '@/simulation-server'
import {
  createMockExecuteTransactionAction,
  createMockProposeTransactionAction,
  render,
} from '@/test-utils'
import { jsonRpcProvider } from '@/utils'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chain, explorerUrl } from '@zodiac/chains'
import {
  dbClient,
  getProposedTransaction,
  getTransactions,
  setDefaultRoute,
  toExecutionRoute,
} from '@zodiac/db'
import {
  accountFactory,
  dbIt,
  routeFactory,
  signedTransactionFactory,
  tenantFactory,
  transactionProposalFactory,
  userFactory,
  walletFactory,
} from '@zodiac/db/test-utils'
import { formData } from '@zodiac/form-data'
import { multisigTransactionUrl } from '@zodiac/safe'
import {
  expectRouteToBe,
  randomAddress,
  randomHex,
  waitForPendingActions,
} from '@zodiac/test-utils'
import { MockJsonRpcProvider } from '@zodiac/test-utils/rpc'
import { mockAccount } from '@zodiac/web3/test-utils'
import { href } from 'react-router'
import {
  checkPermissions,
  execute,
  PermissionViolation,
  planExecution,
  queryRoutes,
} from 'ser-kit'
import { beforeEach, describe, expect, vi } from 'vitest'
import { toSerRoute } from './toSerRoute'

vi.mock('ser-kit', async (importOriginal) => {
  const module = await importOriginal<typeof import('ser-kit')>()

  return {
    ...module,

    execute: vi.fn(),
    planExecution: vi.fn(),
    queryRoutes: vi.fn(),
    checkPermissions: vi.fn(),
  }
})

const mockExecute = vi.mocked(execute)
const mockPlanExecution = vi.mocked(planExecution)
const mockQueryRoutes = vi.mocked(queryRoutes)
const mockCheckPermissions = vi.mocked(checkPermissions)

vi.mock('@/simulation-server', async (importOriginal) => {
  const module = await importOriginal<typeof import('@/simulation-server')>()

  return {
    ...module,

    simulateTransactionBundle: vi.fn(),
  }
})

const mockSimulateTransactionBundle = vi.mocked(simulateTransactionBundle)

vi.mock('@/utils', async (importOriginal) => {
  const module = await importOriginal<typeof import('@/utils')>()

  return {
    ...module,

    jsonRpcProvider: vi.fn(),
  }
})

const mockJsonRpcProvider = vi.mocked(jsonRpcProvider)

describe('Sign', () => {
  const chainId = Chain.ETH
  const initiator = randomAddress()

  beforeEach(() => {
    mockPlanExecution.mockResolvedValue([createMockExecuteTransactionAction()])
    mockJsonRpcProvider.mockReturnValue(new MockJsonRpcProvider())

    mockAccount({ address: initiator })

    mockSimulateTransactionBundle.mockResolvedValue({
      error: null,
      approvals: [],
      tokenFlows: { sent: [], received: [], other: [] },
    })
  })

  describe('Route', () => {
    describe('Unknown route', () => {
      dbIt('shows a warning to the user', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const account = await accountFactory.create(tenant, user)
        const wallet = await walletFactory.create(user, { address: initiator })
        const route = await routeFactory.create(account, wallet)
        const proposal = await transactionProposalFactory.create(
          tenant,
          user,
          account,
        )

        await setDefaultRoute(dbClient(), tenant, user, route)

        mockQueryRoutes.mockResolvedValue([])

        await render(
          href('/workspace/:workspaceId/submit/proposal/:proposalId', {
            proposalId: proposal.id,
            workspaceId: tenant.defaultWorkspaceId,
          }),
          { tenant, user },
        )

        expect(
          screen.getByRole('alert', { name: 'Unknown route' }),
        ).toHaveAccessibleDescription(
          'The selected execution route appears invalid. Proceed with caution.',
        )
      })
    })

    describe('Ser unavailability', () => {
      dbIt('shows the page even when ser-kit cannot query routes', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const account = await accountFactory.create(tenant, user)
        const wallet = await walletFactory.create(user, { address: initiator })
        const route = await routeFactory.create(account, wallet)
        const proposal = await transactionProposalFactory.create(
          tenant,
          user,
          account,
        )

        await setDefaultRoute(dbClient(), tenant, user, route)

        mockQueryRoutes.mockRejectedValue('Ser is down')

        await expect(
          render(
            href('/workspace/:workspaceId/submit/proposal/:proposalId', {
              proposalId: proposal.id,
              workspaceId: tenant.defaultWorkspaceId,
            }),
            { tenant, user },
          ),
        ).resolves.not.toThrow()
      })

      dbIt('shows a warning when ser is unavailable', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const account = await accountFactory.create(tenant, user)
        const wallet = await walletFactory.create(user, { address: initiator })
        const route = await routeFactory.create(account, wallet)
        const proposal = await transactionProposalFactory.create(
          tenant,
          user,
          account,
        )

        await setDefaultRoute(dbClient(), tenant, user, route)

        mockQueryRoutes.mockRejectedValue('Ser is down')

        await render(
          href('/workspace/:workspaceId/submit/proposal/:proposalId', {
            proposalId: proposal.id,
            workspaceId: tenant.defaultWorkspaceId,
          }),
          { tenant, user },
        )

        expect(
          await screen.findByRole('alert', {
            name: 'Route validation unavailable',
          }),
        ).toHaveAccessibleDescription(
          'The selected execution route could not be validated. Proceed with caution.',
        )
      })

      dbIt('enables the "Sign" button when ser is unavailable', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const account = await accountFactory.create(tenant, user)
        const wallet = await walletFactory.create(user, { address: initiator })
        const route = await routeFactory.create(account, wallet)
        const proposal = await transactionProposalFactory.create(
          tenant,
          user,
          account,
        )

        await setDefaultRoute(dbClient(), tenant, user, route)

        mockQueryRoutes.mockRejectedValue('Ser is down')

        await render(
          href('/workspace/:workspaceId/submit/proposal/:proposalId', {
            proposalId: proposal.id,
            workspaceId: tenant.defaultWorkspaceId,
          }),
          { tenant, user },
        )

        expect(
          await screen.findByRole('button', { name: 'Sign' }),
        ).toBeEnabled()
      })
    })

    dbIt('uses the passed route', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const wallet = await walletFactory.create(user)
      const account = await accountFactory.create(tenant, user)

      const proposal = await transactionProposalFactory.create(
        tenant,
        user,
        account,
      )
      const route = await routeFactory.create(account, wallet, {
        label: 'Test route',
      })

      mockQueryRoutes.mockResolvedValue([
        toSerRoute(toExecutionRoute({ wallet, account, route })),
      ])

      await render(
        href('/workspace/:workspaceId/submit/proposal/:proposalId/:routeId', {
          proposalId: proposal.id,
          routeId: route.id,
          workspaceId: tenant.defaultWorkspaceId,
        }),
        { tenant, user },
      )

      expect(
        await screen.findByLabelText('Execution route'),
      ).toHaveAccessibleDescription('Test route')
    })
  })

  describe('Permissions', () => {
    dbIt('shows the permission error', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const account = await accountFactory.create(tenant, user)
      const wallet = await walletFactory.create(user, { address: initiator })
      const route = await routeFactory.create(account, wallet)
      const proposal = await transactionProposalFactory.create(
        tenant,
        user,
        account,
      )

      await setDefaultRoute(dbClient(), tenant, user, route)

      mockQueryRoutes.mockResolvedValue([
        toSerRoute(toExecutionRoute({ wallet, account, route })),
      ])
      mockCheckPermissions.mockResolvedValue({
        success: false,
        error: PermissionViolation.AllowanceExceeded,
      })

      await render(
        href('/workspace/:workspaceId/submit/proposal/:proposalId', {
          proposalId: proposal.id,
          workspaceId: tenant.defaultWorkspaceId,
        }),
        { tenant, user },
      )

      expect(
        screen.getByRole('alert', { name: 'Permission violation' }),
      ).toHaveAccessibleDescription(PermissionViolation.AllowanceExceeded)
    })

    describe('Ser unavailability', () => {
      dbIt(
        'shows the page even when ser-kit cannot check permissions',
        async () => {
          const user = await userFactory.create()
          const tenant = await tenantFactory.create(user)

          const account = await accountFactory.create(tenant, user)
          const wallet = await walletFactory.create(user, {
            address: initiator,
          })
          const route = await routeFactory.create(account, wallet)
          const proposal = await transactionProposalFactory.create(
            tenant,
            user,
            account,
          )

          await setDefaultRoute(dbClient(), tenant, user, route)

          mockQueryRoutes.mockResolvedValue([
            toSerRoute(toExecutionRoute({ wallet, account, route })),
          ])
          mockCheckPermissions.mockRejectedValue('Ser is down')

          await expect(
            render(
              href('/workspace/:workspaceId/submit/proposal/:proposalId', {
                proposalId: proposal.id,
                workspaceId: tenant.defaultWorkspaceId,
              }),
              { tenant, user },
            ),
          ).resolves.not.toThrow()
        },
      )

      dbIt('shows a warning when ser is unavailable', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const account = await accountFactory.create(tenant, user)
        const wallet = await walletFactory.create(user, { address: initiator })
        const route = await routeFactory.create(account, wallet)
        const proposal = await transactionProposalFactory.create(
          tenant,
          user,
          account,
        )

        await setDefaultRoute(dbClient(), tenant, user, route)

        mockQueryRoutes.mockResolvedValue([
          toSerRoute(toExecutionRoute({ wallet, account, route })),
        ])
        mockCheckPermissions.mockRejectedValue('Ser is down')

        await render(
          href('/workspace/:workspaceId/submit/proposal/:proposalId', {
            proposalId: proposal.id,
            workspaceId: tenant.defaultWorkspaceId,
          }),
          { tenant, user },
        )

        expect(
          await screen.findByRole('alert', {
            name: 'Permissions check unavailable',
          }),
        ).toHaveAccessibleDescription(
          'We could not check the permissions for this route. Proceed with caution.',
        )
      })

      dbIt('enables the "Sign" button when ser is unavailable', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const account = await accountFactory.create(tenant, user)
        const wallet = await walletFactory.create(user, { address: initiator })
        const route = await routeFactory.create(account, wallet)
        const proposal = await transactionProposalFactory.create(
          tenant,
          user,
          account,
        )

        await setDefaultRoute(dbClient(), tenant, user, route)

        mockQueryRoutes.mockResolvedValue([
          toSerRoute(toExecutionRoute({ wallet, account, route })),
        ])
        mockCheckPermissions.mockRejectedValue('Ser is down')

        await render(
          href('/workspace/:workspaceId/submit/proposal/:proposalId', {
            proposalId: proposal.id,
            workspaceId: tenant.defaultWorkspaceId,
          }),
          { tenant, user },
        )

        expect(
          await screen.findByRole('button', { name: 'Sign' }),
        ).toBeEnabled()
      })
    })
  })

  describe('Approvals', () => {
    beforeEach(() => {
      mockQueryRoutes.mockResolvedValue([])
    })

    dbIt('does not revoke approvals by default', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const account = await accountFactory.create(tenant, user)
      const wallet = await walletFactory.create(user, { address: initiator })
      const route = await routeFactory.create(account, wallet)
      const proposal = await transactionProposalFactory.create(
        tenant,
        user,
        account,
      )

      await setDefaultRoute(dbClient(), tenant, user, route)

      mockSimulateTransactionBundle.mockResolvedValue({
        error: null,
        approvals: [
          {
            spender: randomAddress(),
            tokenAddress: randomAddress(),
            symbol: '',
            logoUrl: '',
            decimals: 0,
            approvalAmount: 0n,
          },
        ],
        tokenFlows: { sent: [], received: [], other: [] },
      })

      await render(
        href('/workspace/:workspaceId/submit/proposal/:proposalId', {
          proposalId: proposal.id,
          workspaceId: tenant.defaultWorkspaceId,
        }),
        { tenant, user },
      )

      expect(
        await screen.findByRole('checkbox', { name: 'Revoke all approvals' }),
      ).not.toBeChecked()
    })
  })

  describe('Sign', () => {
    dbIt('stores a reference to the transaction.', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const account = await accountFactory.create(tenant, user)
      const wallet = await walletFactory.create(user, { address: initiator })
      const route = await routeFactory.create(account, wallet)
      const proposal = await transactionProposalFactory.create(
        tenant,
        user,
        account,
      )

      await setDefaultRoute(dbClient(), tenant, user, route)

      const testHash = randomHex(18)

      mockQueryRoutes.mockResolvedValue([])
      mockPlanExecution.mockResolvedValue([
        createMockExecuteTransactionAction({
          from: wallet.address,
        }),
      ])
      mockExecute.mockImplementation(async (_, state = []) => {
        state.push(testHash)
      })

      await render(
        href('/workspace/:workspaceId/submit/proposal/:proposalId', {
          proposalId: proposal.id,
          workspaceId: tenant.defaultWorkspaceId,
        }),
        { user, tenant },
      )

      await userEvent.click(await screen.findByRole('button', { name: 'Sign' }))

      await waitForPendingActions()

      const [transaction] = await getTransactions(dbClient(), account.id)

      expect(transaction).toHaveProperty(
        'explorerUrl',
        new URL(`tx/${testHash}`, explorerUrl(account.chainId)).toString(),
      )
    })

    dbIt('stores a reference to the multisig.', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const account = await accountFactory.create(tenant, user)
      const wallet = await walletFactory.create(user, { address: initiator })
      const route = await routeFactory.create(account, wallet)
      const proposal = await transactionProposalFactory.create(
        tenant,
        user,
        account,
      )

      await setDefaultRoute(dbClient(), tenant, user, route)

      const testHash = randomHex(18)

      mockQueryRoutes.mockResolvedValue([])
      mockPlanExecution.mockResolvedValue([
        createMockProposeTransactionAction({
          proposer: wallet.address,
          safe: account.address,
        }),
      ])
      mockExecute.mockImplementation(async (_, state = []) => {
        state.push(testHash)
      })

      await render(
        href('/workspace/:workspaceId/submit/proposal/:proposalId', {
          proposalId: proposal.id,
          workspaceId: tenant.defaultWorkspaceId,
        }),
        { user, tenant },
      )

      await userEvent.click(await screen.findByRole('button', { name: 'Sign' }))

      await waitFor(async () => {
        await waitForPendingActions()

        const [transaction] = await getTransactions(dbClient(), account.id)

        const url = multisigTransactionUrl(chainId, account.address, testHash)

        expect(transaction).toHaveProperty('safeWalletUrl', url.toString())
      })
    })

    dbIt('links the proposal and the signed transaction', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const account = await accountFactory.create(tenant, user)
      const wallet = await walletFactory.create(user, { address: initiator })
      const route = await routeFactory.create(account, wallet)
      const proposal = await transactionProposalFactory.create(
        tenant,
        user,
        account,
      )

      await setDefaultRoute(dbClient(), tenant, user, route)

      const testHash = randomHex(18)

      mockQueryRoutes.mockResolvedValue([])
      mockPlanExecution.mockResolvedValue([
        createMockExecuteTransactionAction({
          from: wallet.address,
        }),
      ])
      mockExecute.mockImplementation(async (_, state = []) => {
        state.push(testHash)
      })

      await render(
        href('/workspace/:workspaceId/submit/proposal/:proposalId', {
          proposalId: proposal.id,
          workspaceId: tenant.defaultWorkspaceId,
        }),
        { user, tenant },
      )

      await userEvent.click(await screen.findByRole('button', { name: 'Sign' }))

      await waitFor(async () => {
        await waitForPendingActions()

        const [transaction] = await getTransactions(dbClient(), account.id)

        await expect(
          getProposedTransaction(dbClient(), proposal.id),
        ).resolves.toHaveProperty('signedTransactionId', transaction.id)
      })
    })

    describe('Callback', () => {
      dbIt('posts transaction hash to a provided callback URL', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const account = await accountFactory.create(tenant, user)
        const wallet = await walletFactory.create(user, {
          address: initiator,
        })
        const route = await routeFactory.create(account, wallet)
        const proposal = await transactionProposalFactory.create(
          tenant,
          user,
          account,
          { callbackUrl: 'http://test.com/test-callback' },
        )

        await setDefaultRoute(dbClient(), tenant, user, route)

        const testHash = randomHex(18)

        mockQueryRoutes.mockResolvedValue([])
        mockPlanExecution.mockResolvedValue([
          createMockExecuteTransactionAction({
            from: wallet.address,
          }),
        ])
        mockExecute.mockImplementation(async (_, state = []) => {
          state.push(testHash)
        })

        const mockFetch = vi.spyOn(global, 'fetch')

        await render(
          href('/workspace/:workspaceId/submit/proposal/:proposalId', {
            proposalId: proposal.id,
            workspaceId: tenant.defaultWorkspaceId,
          }),
          {
            user,
            tenant,
          },
        )

        await userEvent.click(
          await screen.findByRole('button', { name: 'Sign' }),
        )

        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            'http://test.com/test-callback',
            {
              method: 'POST',
              body: formData({
                proposalId: proposal.id,
                transactionHash: testHash,
              }),
            },
          )
        })
      })

      dbIt('passes along state to the callback', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const account = await accountFactory.create(tenant, user)
        const wallet = await walletFactory.create(user, {
          address: initiator,
        })
        const route = await routeFactory.create(account, wallet)
        const proposal = await transactionProposalFactory.create(
          tenant,
          user,
          account,
          {
            callbackUrl: 'http://test.com/test-callback',
            callbackState: 'test-state',
          },
        )

        await setDefaultRoute(dbClient(), tenant, user, route)

        const testHash = randomHex(18)

        mockQueryRoutes.mockResolvedValue([])
        mockPlanExecution.mockResolvedValue([
          createMockExecuteTransactionAction({
            from: wallet.address,
          }),
        ])
        mockExecute.mockImplementation(async (_, state = []) => {
          state.push(testHash)
        })

        const mockFetch = vi.spyOn(global, 'fetch')

        await render(
          href('/workspace/:workspaceId/submit/proposal/:proposalId', {
            proposalId: proposal.id,
            workspaceId: tenant.defaultWorkspaceId,
          }),
          {
            user,
            tenant,
          },
        )

        await userEvent.click(
          await screen.findByRole('button', { name: 'Sign' }),
        )

        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            'http://test.com/test-callback?state=test-state',
            {
              method: 'POST',
              body: formData({
                proposalId: proposal.id,
                transactionHash: testHash,
              }),
            },
          )
        })
      })

      dbIt(
        'redirects to the callback response when it is a redirect',
        async () => {
          const user = await userFactory.create()
          const tenant = await tenantFactory.create(user)

          const account = await accountFactory.create(tenant, user)
          const wallet = await walletFactory.create(user, {
            address: initiator,
          })
          const route = await routeFactory.create(account, wallet)
          const proposal = await transactionProposalFactory.create(
            tenant,
            user,
            account,
            { callbackUrl: 'http://test.com/test-callback' },
          )

          await setDefaultRoute(dbClient(), tenant, user, route)

          const testHash = randomHex(18)

          mockQueryRoutes.mockResolvedValue([])
          mockPlanExecution.mockResolvedValue([
            createMockExecuteTransactionAction({
              from: wallet.address,
            }),
          ])
          mockExecute.mockImplementation(async (_, state = []) => {
            state.push(testHash)
          })

          const mockFetch = vi.spyOn(global, 'fetch')

          mockFetch.mockImplementation(async (url) => {
            if (url === 'http://test.com/test-callback') {
              return Response.json({ redirectTo: '/test-route' })
            }

            return Response.json({})
          })

          await render(
            href('/workspace/:workspaceId/submit/proposal/:proposalId', {
              proposalId: proposal.id,
              workspaceId: tenant.defaultWorkspaceId,
            }),
            {
              user,
              tenant,
              extraRoutes: [{ path: '/test-route', Component: () => null }],
            },
          )

          await userEvent.click(
            await screen.findByRole('button', { name: 'Sign' }),
          )

          await expectRouteToBe('/test-route')
        },
      )
    })
  })

  describe('Signed proposal', () => {
    dbIt('disables the sign button', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const account = await accountFactory.create(tenant, user)
      const wallet = await walletFactory.create(user, { address: initiator })
      const route = await routeFactory.create(account, wallet)
      const signedTransaction = await signedTransactionFactory.create(
        tenant,
        user,
        route,
      )
      const proposal = await transactionProposalFactory.create(
        tenant,
        user,
        account,
        {
          transaction: signedTransaction.transaction,
          signedTransactionId: signedTransaction.id,
        },
      )

      await setDefaultRoute(dbClient(), tenant, user, route)

      mockQueryRoutes.mockResolvedValue([])

      await render(
        href('/workspace/:workspaceId/submit/proposal/:proposalId', {
          proposalId: proposal.id,
          workspaceId: tenant.defaultWorkspaceId,
        }),
        { user, tenant },
      )

      expect(await screen.findByRole('button', { name: 'Sign' })).toBeDisabled()
    })

    dbIt(
      'shows a message that the proposal has already been signed',
      async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const account = await accountFactory.create(tenant, user)
        const wallet = await walletFactory.create(user, { address: initiator })
        const route = await routeFactory.create(account, wallet)
        const signedTransaction = await signedTransactionFactory.create(
          tenant,
          user,
          route,
        )
        const proposal = await transactionProposalFactory.create(
          tenant,
          user,
          account,
          {
            transaction: signedTransaction.transaction,
            signedTransactionId: signedTransaction.id,
          },
        )

        await setDefaultRoute(dbClient(), tenant, user, route)

        mockQueryRoutes.mockResolvedValue([])

        await render(
          href('/workspace/:workspaceId/submit/proposal/:proposalId', {
            proposalId: proposal.id,
            workspaceId: tenant.defaultWorkspaceId,
          }),
          { user, tenant },
        )

        const dateFormatter = new Intl.DateTimeFormat('en-GB', {
          dateStyle: 'long',
          timeStyle: 'short',
        })

        expect(
          await screen.findByRole('alert', {
            name: 'Transaction bundle already signed',
          }),
        ).toHaveAccessibleDescription(
          `This transaction bundle has already been signed by ${user.fullName} on ${dateFormatter.format(signedTransaction.createdAt)}`,
        )
      },
    )
  })
})
