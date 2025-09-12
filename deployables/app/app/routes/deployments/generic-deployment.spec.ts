import { simulateTransactionBundle } from '@/simulation-server'
import {
  createMockExecuteTransactionAction,
  createMockStepsByAccount,
  render,
} from '@/test-utils'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chain } from '@zodiac/chains'
import {
  assertActiveDeployment,
  cancelDeployment,
  completeDeploymentSlice,
  dbClient,
  getDeploymentSlice,
  getProposedTransactions,
  setDefaultRoute,
  setDefaultWallet,
} from '@zodiac/db'
import {
  accountFactory,
  dbIt,
  deploymentFactory,
  deploymentSliceFactory,
  routeFactory,
  signedTransactionFactory,
  tenantFactory,
  transactionProposalFactory,
  userFactory,
  walletFactory,
} from '@zodiac/db/test-utils'
import {
  expectRouteToBe,
  randomHex,
  selectOption,
  waitForPendingActions,
} from '@zodiac/test-utils'
import { formatDate } from '@zodiac/ui'
import { href } from 'react-router'
import {
  checkPermissions,
  planApplyAccounts,
  planExecution,
  queryAccounts,
  queryRoutes,
} from 'ser-kit'
import { beforeEach, describe, expect, vi } from 'vitest'
import { Intent } from './intents'

vi.mock('ser-kit', async (importOriginal) => {
  const module = await importOriginal<typeof import('ser-kit')>()

  return {
    ...module,

    planApplyAccounts: vi.fn(),
    queryAccounts: vi.fn(),
    planExecution: vi.fn(),
    queryRoutes: vi.fn(),
    checkPermissions: vi.fn(),
  }
})

const mockQueryAccounts = vi.mocked(queryAccounts)
const mockPlanApplyAccounts = vi.mocked(planApplyAccounts)
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

describe('Generic Deployment', () => {
  beforeEach(() => {
    mockPlanExecution.mockResolvedValue([createMockExecuteTransactionAction()])
    mockQueryRoutes.mockResolvedValue([])
    mockCheckPermissions.mockResolvedValue({ success: true, error: undefined })
    mockQueryAccounts.mockResolvedValue([])
    mockPlanApplyAccounts.mockResolvedValue([])

    mockSimulateTransactionBundle.mockResolvedValue({
      error: null,
      approvals: [],
      tokenFlows: { sent: [], received: [], other: [] },
    })

    vi.setSystemTime(new Date())
  })

  describe('Execute', () => {
    describe('Route selection', () => {
      dbIt(
        'informs the user when no route is configured for the respective account',
        async () => {
          const user = await userFactory.create()
          const tenant = await tenantFactory.create(user)

          const account = await accountFactory.create(tenant, user)

          const deployment = await deploymentFactory.create(tenant, user)

          await deploymentSliceFactory.create(user, deployment, {
            from: account.address,
          })

          await render(
            href('/workspace/:workspaceId/deployments/:deploymentId', {
              workspaceId: tenant.defaultWorkspaceId,
              deploymentId: deployment.id,
            }),
            { tenant, user },
          )

          await userEvent.click(
            await screen.findByRole('button', { name: 'Deploy' }),
          )

          expect(
            await screen.findByRole('dialog', {
              name: 'Missing route to account',
            }),
          ).toHaveAccessibleDescription(
            'You have not set up a route to this account. After you have set up a route for this account you can come back here and continue with this step.',
          )
        },
      )

      dbIt(
        'informs the user when someone else could propose the transaction',
        async () => {
          const user = await userFactory.create()
          const otherUser = await userFactory.create()

          const wallet = await walletFactory.create(otherUser)

          const tenant = await tenantFactory.create([user, otherUser])

          const account = await accountFactory.create(tenant, user)

          await routeFactory.create(account, wallet)

          const deployment = await deploymentFactory.create(tenant, user)

          await deploymentSliceFactory.create(user, deployment, {
            from: account.address,
          })

          await render(
            href('/workspace/:workspaceId/deployments/:deploymentId', {
              workspaceId: tenant.defaultWorkspaceId,
              deploymentId: deployment.id,
            }),
            { tenant, user },
          )

          await userEvent.click(
            await screen.findByRole('button', { name: 'Deploy' }),
          )

          const { getByRole } = within(
            await screen.findByRole('list', { name: 'Users who can execute' }),
          )

          expect(
            getByRole('listitem', { name: otherUser.fullName }),
          ).toBeInTheDocument()
        },
      )

      dbIt('offers a link to add a route', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const account = await accountFactory.create(tenant, user)

        const deployment = await deploymentFactory.create(tenant, user)

        await deploymentSliceFactory.create(user, deployment, {
          from: account.address,
        })

        await render(
          href('/workspace/:workspaceId/deployments/:deploymentId', {
            workspaceId: tenant.defaultWorkspaceId,
            deploymentId: deployment.id,
          }),
          { tenant, user },
        )

        await userEvent.click(
          await screen.findByRole('button', { name: 'Deploy' }),
        )

        expect(
          await screen.findByRole('link', {
            name: 'Open account',
          }),
        ).toHaveAttribute(
          'href',
          href('/workspace/:workspaceId/accounts/:accountId', {
            workspaceId: tenant.defaultWorkspaceId,
            accountId: account.id,
          }),
        )
      })

      dbIt(
        'allows you to select a route to use to execute a step',
        async () => {
          const user = await userFactory.create()
          const tenant = await tenantFactory.create(user)

          const wallet = await walletFactory.create(user)

          const account = await accountFactory.create(tenant, user)

          const routeA = await routeFactory.create(account, wallet, {
            label: 'First route',
          })
          const routeB = await routeFactory.create(account, wallet, {
            label: 'Second route',
          })

          await setDefaultRoute(dbClient(), tenant, user, routeA)

          const deployment = await deploymentFactory.create(tenant, user)

          await deploymentSliceFactory.create(user, deployment, {
            from: account.address,
          })

          await render(
            href('/workspace/:workspaceId/deployments/:deploymentId', {
              workspaceId: tenant.defaultWorkspaceId,
              deploymentId: deployment.id,
            }),
            { tenant, user },
          )

          await userEvent.click(
            await screen.findByRole('button', { name: 'Deploy' }),
          )

          await selectOption('Route', 'Second route')

          await userEvent.click(
            await screen.findByRole('button', { name: 'Use route' }),
          )

          await waitForPendingActions()

          const [proposal] = await getProposedTransactions(
            dbClient(),
            user,
            account,
          )

          await expectRouteToBe(
            href(
              '/workspace/:workspaceId/submit/proposal/:proposalId/:routeId',
              {
                workspaceId: tenant.defaultWorkspaceId,
                proposalId: proposal.id,
                routeId: routeB.id,
              },
            ),
          )
        },
      )
    })

    describe('Transaction proposal', () => {
      dbIt(
        'redirects the user to a prepared transaction proposal',
        async () => {
          const user = await userFactory.create()
          const tenant = await tenantFactory.create(user)

          const wallet = await walletFactory.create(user)

          await setDefaultWallet(dbClient(), user, {
            walletId: wallet.id,
            chainId: Chain.ETH,
          })

          const account = await accountFactory.create(tenant, user, {
            chainId: Chain.ETH,
          })
          const route = await routeFactory.create(account, wallet)

          await setDefaultRoute(dbClient(), tenant, user, route)

          const deployment = await deploymentFactory.create(tenant, user)

          await deploymentSliceFactory.create(user, deployment, {
            from: account.address,
            steps: [createMockStepsByAccount()],
          })

          await render(
            href('/workspace/:workspaceId/deployments/:deploymentId', {
              workspaceId: tenant.defaultWorkspaceId,
              deploymentId: deployment.id,
            }),
            { tenant, user },
          )

          await userEvent.click(
            await screen.findByRole('button', { name: 'Deploy' }),
          )

          await waitForPendingActions(Intent.ExecuteTransaction)

          const [transactionProposal] = await getProposedTransactions(
            dbClient(),
            user,
            account,
          )

          await expectRouteToBe(
            href(
              '/workspace/:workspaceId/submit/proposal/:proposalId/:routeId',
              {
                workspaceId: tenant.defaultWorkspaceId,
                proposalId: transactionProposal.id,
                routeId: route.id,
              },
            ),
          )
        },
      )

      dbIt(
        'links the transaction proposal to the deployment step',
        async () => {
          const user = await userFactory.create()
          const tenant = await tenantFactory.create(user)

          const wallet = await walletFactory.create(user)

          await setDefaultWallet(dbClient(), user, {
            walletId: wallet.id,
            chainId: Chain.ETH,
          })

          const account = await accountFactory.create(tenant, user, {
            chainId: Chain.ETH,
          })
          const route = await routeFactory.create(account, wallet)

          await setDefaultRoute(dbClient(), tenant, user, route)

          const deployment = await deploymentFactory.create(tenant, user)

          const deploymentSlice = await deploymentSliceFactory.create(
            user,
            deployment,
            {
              from: account.address,
              steps: [createMockStepsByAccount()],
            },
          )

          await render(
            href('/workspace/:workspaceId/deployments/:deploymentId', {
              workspaceId: tenant.defaultWorkspaceId,
              deploymentId: deployment.id,
            }),
            { tenant, user },
          )

          await userEvent.click(
            await screen.findByRole('button', { name: 'Deploy' }),
          )

          await waitForPendingActions(Intent.ExecuteTransaction)

          const [transactionProposal] = await getProposedTransactions(
            dbClient(),
            user,
            account,
          )

          await expect(
            getDeploymentSlice(dbClient(), deploymentSlice.id),
          ).resolves.toHaveProperty(
            'proposedTransactionId',
            transactionProposal.id,
          )
        },
      )

      dbIt('sets the correct callback url on the proposal', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const wallet = await walletFactory.create(user)

        await setDefaultWallet(dbClient(), user, {
          walletId: wallet.id,
          chainId: Chain.ETH,
        })

        const account = await accountFactory.create(tenant, user, {
          chainId: Chain.ETH,
        })
        const route = await routeFactory.create(account, wallet)

        await setDefaultRoute(dbClient(), tenant, user, route)

        const deployment = await deploymentFactory.create(tenant, user)

        const step = await deploymentSliceFactory.create(user, deployment, {
          from: account.address,
          steps: [createMockStepsByAccount()],
        })

        await render(
          href('/workspace/:workspaceId/deployments/:deploymentId', {
            workspaceId: tenant.defaultWorkspaceId,
            deploymentId: deployment.id,
          }),
          { tenant, user },
        )

        await userEvent.click(
          await screen.findByRole('button', { name: 'Deploy' }),
        )

        await waitForPendingActions(Intent.ExecuteTransaction)

        const [transactionProposal] = await getProposedTransactions(
          dbClient(),
          user,
          account,
        )

        expect(transactionProposal).toHaveProperty(
          'callbackUrl',
          `http://localhost${href('/workspace/:workspaceId/deployments/:deploymentId/slice/:deploymentSliceId/sign-callback', { workspaceId: tenant.defaultWorkspaceId, deploymentId: deployment.id, deploymentSliceId: step.id })}`,
        )
      })

      dbIt(
        'offers to open the transaction proposal when one already exists',
        async () => {
          const user = await userFactory.create()
          const tenant = await tenantFactory.create(user)

          const wallet = await walletFactory.create(user)

          await setDefaultWallet(dbClient(), user, {
            walletId: wallet.id,
            chainId: Chain.ETH,
          })

          const account = await accountFactory.create(tenant, user, {
            chainId: Chain.ETH,
          })
          const route = await routeFactory.create(account, wallet)

          await setDefaultRoute(dbClient(), tenant, user, route)
          const deployment = await deploymentFactory.create(tenant, user)

          const proposal = await transactionProposalFactory.create(
            tenant,
            user,
            account,
          )

          await deploymentSliceFactory.create(user, deployment, {
            proposedTransactionId: proposal.id,
          })

          await render(
            href('/workspace/:workspaceId/deployments/:deploymentId', {
              workspaceId: tenant.defaultWorkspaceId,
              deploymentId: deployment.id,
            }),
            { tenant, user },
          )

          expect(
            await screen.findByRole('link', { name: 'Show transaction' }),
          ).toHaveAttribute(
            'href',
            href('/workspace/:workspaceId/submit/proposal/:proposalId', {
              proposalId: proposal.id,
              workspaceId: proposal.workspaceId,
            }),
          )
        },
      )

      dbIt(
        'disables the deploy button when a transaction has been signed',
        async () => {
          const user = await userFactory.create()
          const tenant = await tenantFactory.create(user)

          const wallet = await walletFactory.create(user)

          await setDefaultWallet(dbClient(), user, {
            walletId: wallet.id,
            chainId: Chain.ETH,
          })

          const account = await accountFactory.create(tenant, user, {
            chainId: Chain.ETH,
          })
          const route = await routeFactory.create(account, wallet)

          await setDefaultRoute(dbClient(), tenant, user, route)

          const deployment = await deploymentFactory.create(tenant, user)

          const transaction = await signedTransactionFactory.create(
            tenant,
            user,
            route,
          )
          const proposal = await transactionProposalFactory.create(
            tenant,
            user,
            account,
            { signedTransactionId: transaction.id },
          )

          const step = await deploymentSliceFactory.create(user, deployment, {
            proposedTransactionId: proposal.id,
            signedTransactionId: transaction.id,
          })

          await completeDeploymentSlice(dbClient(), user, {
            deploymentSliceId: step.id,
            transactionHash: randomHex(18),
          })

          await render(
            href('/workspace/:workspaceId/deployments/:deploymentId', {
              workspaceId: tenant.defaultWorkspaceId,
              deploymentId: deployment.id,
            }),
            { tenant, user },
          )

          expect(
            await screen.findByRole('button', { name: 'Deploy' }),
          ).toBeDisabled()
        },
      )
    })
  })

  describe('Cancelled deployment', () => {
    dbIt('indicates that a deployment has been cancelled', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)
      const deployment = await deploymentFactory.create(tenant, user)

      assertActiveDeployment(deployment)

      const cancelledDeployment = await cancelDeployment(
        dbClient(),
        user,
        deployment,
      )

      await render(
        href('/workspace/:workspaceId/deployments/:deploymentId', {
          workspaceId: tenant.defaultWorkspaceId,
          deploymentId: deployment.id,
        }),
        { tenant, user },
      )

      expect(
        await screen.findByRole('alert', { name: 'Deployment cancelled' }),
      ).toHaveAccessibleDescription(
        `${user.fullName} cancelled this deployment on ${formatDate(cancelledDeployment.cancelledAt)}`,
      )
    })

    dbIt('disables deploy buttons', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const deployment = await deploymentFactory.create(tenant, user)

      await deploymentSliceFactory.create(user, deployment)

      assertActiveDeployment(deployment)

      await cancelDeployment(dbClient(), user, deployment)

      await render(
        href('/workspace/:workspaceId/deployments/:deploymentId', {
          workspaceId: tenant.defaultWorkspaceId,
          deploymentId: deployment.id,
        }),
        { tenant, user },
      )

      expect(
        await screen.findByRole('button', { name: 'Deploy' }),
      ).toBeDisabled()
    })

    dbIt('does not link to transaction proposals', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const account = await accountFactory.create(tenant, user)
      const deployment = await deploymentFactory.create(tenant, user)

      const proposal = await transactionProposalFactory.create(
        tenant,
        user,
        account,
      )

      await deploymentSliceFactory.create(user, deployment, {
        proposedTransactionId: proposal.id,
      })

      assertActiveDeployment(deployment)

      await cancelDeployment(dbClient(), user, deployment)

      await render(
        href('/workspace/:workspaceId/deployments/:deploymentId', {
          workspaceId: tenant.defaultWorkspaceId,
          deploymentId: deployment.id,
        }),
        { tenant, user },
      )

      expect(
        screen.queryByRole('link', { name: 'Show transaction' }),
      ).not.toBeInTheDocument()
    })
  })
})
