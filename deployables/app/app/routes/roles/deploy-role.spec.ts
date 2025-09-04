import { simulateTransactionBundle } from '@/simulation-server'
import { createMockExecuteTransactionAction, render } from '@/test-utils'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chain } from '@zodiac/chains'
import {
  assertActiveRoleDeployment,
  cancelRoleDeployment,
  completeRoleDeploymentSlice,
  dbClient,
  getProposedTransactions,
  getRoleDeploymentSlice,
  setActiveAccounts,
  setDefaultRoute,
  setDefaultWallet,
  setRoleMembers,
} from '@zodiac/db'
import { RoleDeploymentIssue, StepsByAccount } from '@zodiac/db/schema'
import {
  accountFactory,
  dbIt,
  roleDeploymentFactory,
  roleDeploymentSliceFactory,
  roleFactory,
  routeFactory,
  signedTransactionFactory,
  tenantFactory,
  transactionProposalFactory,
  userFactory,
  walletFactory,
} from '@zodiac/db/test-utils'
import {
  createMockSafeAccount,
  createMockTransactionRequest,
} from '@zodiac/modules/test-utils'
import {
  expectRouteToBe,
  randomAddress,
  randomHex,
  waitForPendingActions,
} from '@zodiac/test-utils'
import { formatDate } from '@zodiac/ui'
import { href } from 'react-router'
import {
  AccountType,
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

describe('Deploy Role', () => {
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

  describe('Warnings', () => {
    describe('Members', () => {
      dbIt('warns when no members have been selected', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const role = await roleFactory.create(tenant, user)
        const deployment = await roleDeploymentFactory.create(user, role, {
          issues: [RoleDeploymentIssue.NoActiveMembers],
        })

        await render(
          href(
            '/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId',
            {
              workspaceId: tenant.defaultWorkspaceId,
              roleId: role.id,
              deploymentId: deployment.id,
            },
          ),
          { tenant, user },
        )

        expect(
          await screen.findByRole('alert', { name: 'Members missing' }),
        ).toHaveAccessibleDescription(
          'You have not selected any members that should be part of this role.',
        )
      })

      dbIt('warns when not all members have default safes set up', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const account = await accountFactory.create(tenant, user)
        const role = await roleFactory.create(tenant, user)
        const deployment = await roleDeploymentFactory.create(user, role, {
          issues: [RoleDeploymentIssue.MissingDefaultWallet],
        })

        await setActiveAccounts(dbClient(), role, [account.id])
        await setRoleMembers(dbClient(), role, [user.id])

        await render(
          href(
            '/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId',
            {
              workspaceId: tenant.defaultWorkspaceId,
              roleId: role.id,
              deploymentId: deployment.id,
            },
          ),
          { tenant, user },
        )

        expect(
          await screen.findByRole('alert', { name: 'Members missing' }),
        ).toHaveAccessibleDescription(
          'Not all members have selected a default safes for the chains this role will be deployed to. This means the role will not be active for them on these chains.',
        )
      })
    })

    describe('Accounts', () => {
      dbIt('warns when no account shave been selected', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const role = await roleFactory.create(tenant, user)
        const deployment = await roleDeploymentFactory.create(user, role, {
          issues: [RoleDeploymentIssue.NoActiveAccounts],
        })

        await render(
          href(
            '/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId',
            {
              workspaceId: tenant.defaultWorkspaceId,
              roleId: role.id,
              deploymentId: deployment.id,
            },
          ),
          { tenant, user },
        )

        expect(
          await screen.findByRole('alert', { name: 'Accounts missing' }),
        ).toHaveAccessibleDescription(
          'You have not selected any accounts that this role should be active on.',
        )
      })
    })
  })

  describe('Execute', () => {
    describe('Route selection', () => {
      dbIt.todo(
        'offers to complete the route setup when no route is configured for the respective account',
      )
      dbIt.todo('allows you to select a route to use to execute a step')
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

          const role = await roleFactory.create(tenant, user)
          const deployment = await roleDeploymentFactory.create(user, role)

          await roleDeploymentSliceFactory.create(user, deployment, {
            from: account.address,
            steps: [createMockStepsByAccount()],
          })

          await setRoleMembers(dbClient(), role, [user.id])
          await setActiveAccounts(dbClient(), role, [account.id])

          await render(
            href(
              '/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId',
              {
                workspaceId: tenant.defaultWorkspaceId,
                roleId: role.id,
                deploymentId: deployment.id,
              },
            ),
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

          const role = await roleFactory.create(tenant, user)
          const deployment = await roleDeploymentFactory.create(user, role)

          const deploymentSlice = await roleDeploymentSliceFactory.create(
            user,
            deployment,
            {
              from: account.address,
              steps: [createMockStepsByAccount()],
            },
          )

          await setRoleMembers(dbClient(), role, [user.id])
          await setActiveAccounts(dbClient(), role, [account.id])

          await render(
            href(
              '/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId',
              {
                workspaceId: tenant.defaultWorkspaceId,
                roleId: role.id,
                deploymentId: deployment.id,
              },
            ),
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
            getRoleDeploymentSlice(dbClient(), deploymentSlice.id),
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

        const role = await roleFactory.create(tenant, user)
        const deployment = await roleDeploymentFactory.create(user, role)

        const step = await roleDeploymentSliceFactory.create(user, deployment, {
          from: account.address,
          steps: [createMockStepsByAccount()],
        })

        await setRoleMembers(dbClient(), role, [user.id])
        await setActiveAccounts(dbClient(), role, [account.id])

        await render(
          href(
            '/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId',
            {
              workspaceId: tenant.defaultWorkspaceId,
              roleId: role.id,
              deploymentId: deployment.id,
            },
          ),
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
          `http://localhost${href('/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId/slice/:deploymentSliceId/sign-callback', { workspaceId: tenant.defaultWorkspaceId, roleId: role.id, deploymentId: deployment.id, deploymentSliceId: step.id })}`,
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

          const role = await roleFactory.create(tenant, user)

          await setRoleMembers(dbClient(), role, [user.id])
          await setActiveAccounts(dbClient(), role, [account.id])

          const deployment = await roleDeploymentFactory.create(user, role)

          const proposal = await transactionProposalFactory.create(
            tenant,
            user,
            account,
          )

          await roleDeploymentSliceFactory.create(user, deployment, {
            proposedTransactionId: proposal.id,
          })

          await render(
            href(
              '/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId',
              {
                workspaceId: tenant.defaultWorkspaceId,
                roleId: role.id,
                deploymentId: deployment.id,
              },
            ),
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

          const role = await roleFactory.create(tenant, user)

          await setRoleMembers(dbClient(), role, [user.id])
          await setActiveAccounts(dbClient(), role, [account.id])

          const deployment = await roleDeploymentFactory.create(user, role)

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

          const step = await roleDeploymentSliceFactory.create(
            user,
            deployment,
            {
              proposedTransactionId: proposal.id,
              signedTransactionId: transaction.id,
            },
          )

          await completeRoleDeploymentSlice(dbClient(), user, {
            roleDeploymentSliceId: step.id,
            transactionHash: randomHex(18),
          })

          await render(
            href(
              '/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId',
              {
                workspaceId: tenant.defaultWorkspaceId,
                roleId: role.id,
                deploymentId: deployment.id,
              },
            ),
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

      const role = await roleFactory.create(tenant, user)
      const deployment = await roleDeploymentFactory.create(user, role)

      assertActiveRoleDeployment(deployment)

      const cancelledDeployment = await cancelRoleDeployment(
        dbClient(),
        user,
        deployment,
      )

      await render(
        href('/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId', {
          workspaceId: tenant.defaultWorkspaceId,
          roleId: role.id,
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

      const role = await roleFactory.create(tenant, user)
      const deployment = await roleDeploymentFactory.create(user, role)

      await roleDeploymentSliceFactory.create(user, deployment)

      assertActiveRoleDeployment(deployment)

      await cancelRoleDeployment(dbClient(), user, deployment)

      await render(
        href('/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId', {
          workspaceId: tenant.defaultWorkspaceId,
          roleId: role.id,
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

      const role = await roleFactory.create(tenant, user)
      const deployment = await roleDeploymentFactory.create(user, role)

      const proposal = await transactionProposalFactory.create(
        tenant,
        user,
        account,
      )

      await roleDeploymentSliceFactory.create(user, deployment, {
        proposedTransactionId: proposal.id,
      })

      assertActiveRoleDeployment(deployment)

      await cancelRoleDeployment(dbClient(), user, deployment)

      await render(
        href('/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId', {
          workspaceId: tenant.defaultWorkspaceId,
          roleId: role.id,
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

export const createMockStepsByAccount = (): StepsByAccount => ({
  account: createMockSafeAccount(),
  steps: [
    {
      from: randomAddress(),
      call: {
        call: 'createNode',
        accountType: AccountType.SAFE,
        creationNonce: 0n,
        args: {
          owners: [],
          modules: [],
          threshold: 1,
        },
        deploymentAddress: randomAddress(),
      },
      transaction: createMockTransactionRequest(),
    },
  ],
})
