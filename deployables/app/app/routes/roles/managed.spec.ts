import { render } from '@/test-utils'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chain } from '@zodiac/chains'
import {
  dbClient,
  getRoleDeployment,
  getRoleDeployments,
  getRoleDeploymentSlices,
  setActiveAccounts,
  setDefaultWallet,
  setRoleMembers,
} from '@zodiac/db'
import { RoleDeploymentIssue } from '@zodiac/db/schema'
import {
  accountFactory,
  dbIt,
  roleDeploymentFactory,
  roleFactory,
  tenantFactory,
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
  waitForPendingActions,
} from '@zodiac/test-utils'
import { href } from 'react-router'
import { AccountBuilderCall, AccountType } from 'ser-kit'
import { beforeEach, describe, expect, vi } from 'vitest'
import { Intent } from './intents'
import { planRoleUpdate } from './planRoleUpdate'

vi.mock('./planRoleUpdate', () => ({ planRoleUpdate: vi.fn() }))

const mockPlanRoleUpdate = vi.mocked(planRoleUpdate)

describe('Managed roles', () => {
  beforeEach(() => {
    mockPlanRoleUpdate.mockResolvedValue({
      issues: [],
      slices: [],
    })

    vi.setSystemTime(new Date())
  })

  describe('Deploy', () => {
    dbIt('creates a new deployment', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const role = await roleFactory.create(tenant, user)

      mockPlanRoleUpdate.mockResolvedValue({
        issues: [],
        slices: [
          {
            from: randomAddress(),
            steps: [{ account: createMockSafeAccount(), steps: [] }],
          },
        ],
      })

      await render(
        href('/workspace/:workspaceId/roles', {
          workspaceId: tenant.defaultWorkspaceId,
        }),
        { tenant, user },
      )

      await userEvent.click(
        await screen.findByRole('button', { name: 'Deploy' }),
      )

      await waitForPendingActions()

      const [deployment] = await getRoleDeployments(dbClient(), role.id)

      await expectRouteToBe(
        href('/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId', {
          workspaceId: tenant.defaultWorkspaceId,
          roleId: role.id,
          deploymentId: deployment.id,
        }),
      )
    })

    dbIt('creates all necessary slices for the deployment', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const role = await roleFactory.create(tenant, user)

      const account = createMockSafeAccount()
      const call = {
        call: 'createNode',
        accountType: AccountType.SAFE,
        args: { owners: [], threshold: 1, modules: [] },
        creationNonce: 1n,
        deploymentAddress: randomAddress(),
      } satisfies AccountBuilderCall
      const transaction = createMockTransactionRequest()

      mockPlanRoleUpdate.mockResolvedValue({
        issues: [],
        slices: [
          {
            from: randomAddress(),
            steps: [
              {
                account,
                steps: [
                  {
                    from: undefined,
                    call,
                    transaction,
                  },
                ],
              },
            ],
          },
        ],
      })

      await render(
        href('/workspace/:workspaceId/roles', {
          workspaceId: tenant.defaultWorkspaceId,
        }),
        { tenant, user },
      )

      await userEvent.click(
        await screen.findByRole('button', { name: 'Deploy' }),
      )

      await waitForPendingActions()

      const [deployment] = await getRoleDeployments(dbClient(), role.id)
      const [slice] = await getRoleDeploymentSlices(dbClient(), deployment.id)

      expect(slice).toMatchObject({
        index: 0,
        account,
        steps: [{ call, transaction }],
      })
    })

    describe('Issues', () => {
      dbIt(
        'prompts the user to confirm deployment when issues are found',
        async () => {
          const user = await userFactory.create()
          const tenant = await tenantFactory.create(user)

          await roleFactory.create(tenant, user)

          mockPlanRoleUpdate.mockResolvedValue({
            issues: [RoleDeploymentIssue.MissingDefaultWallet],
            slices: [],
          })

          await render(
            href('/workspace/:workspaceId/roles', {
              workspaceId: tenant.defaultWorkspaceId,
            }),
            { tenant, user },
          )

          await userEvent.click(
            await screen.findByRole('button', { name: 'Deploy' }),
          )

          await waitForPendingActions()

          expect(
            await screen.findByRole('dialog', {
              name: 'Please check your configuration',
            }),
          ).toHaveAccessibleDescription(
            'We identified one or more issues with your role configuration.',
          )
        },
      )

      dbIt('is possible to proceed with the deployment', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const role = await roleFactory.create(tenant, user)

        mockPlanRoleUpdate.mockResolvedValue({
          issues: [RoleDeploymentIssue.MissingDefaultWallet],
          slices: [],
        })

        await render(
          href('/workspace/:workspaceId/roles', {
            workspaceId: tenant.defaultWorkspaceId,
          }),
          { tenant, user },
        )

        await userEvent.click(
          await screen.findByRole('button', { name: 'Deploy' }),
        )

        await userEvent.click(
          await screen.findByRole('button', { name: 'Proceed' }),
        )

        await waitForPendingActions()

        const [deployment] = await getRoleDeployments(dbClient(), role.id)

        expect(deployment).toHaveProperty('issues', [
          RoleDeploymentIssue.MissingDefaultWallet,
        ])
      })
    })

    describe('Outstanding deployment', () => {
      dbIt('gives the user the option to open pending deployment', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const role = await roleFactory.create(tenant, user)
        const deployment = await roleDeploymentFactory.create(user, role)

        await render(
          href('/workspace/:workspaceId/roles', {
            workspaceId: tenant.defaultWorkspaceId,
          }),
          { tenant, user },
        )

        await userEvent.click(
          await screen.findByRole('button', { name: 'Deploy' }),
        )
        await userEvent.click(
          await screen.findByRole('link', { name: 'Open deployment' }),
        )

        await expectRouteToBe(
          href(
            '/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId',
            {
              deploymentId: deployment.id,
              roleId: role.id,
              workspaceId: tenant.defaultWorkspaceId,
            },
          ),
        )
      })

      dbIt(
        'gives the user the option to cancel the current deployment',
        async () => {
          const user = await userFactory.create()
          const tenant = await tenantFactory.create(user)

          const role = await roleFactory.create(tenant, user)
          const deployment = await roleDeploymentFactory.create(user, role)

          await render(
            href('/workspace/:workspaceId/roles', {
              workspaceId: tenant.defaultWorkspaceId,
            }),
            { tenant, user },
          )

          await userEvent.click(
            await screen.findByRole('button', { name: 'Deploy' }),
          )
          await userEvent.click(
            await screen.findByRole('button', { name: 'Cancel deployment' }),
          )

          await waitForPendingActions()

          await expect(
            getRoleDeployment(dbClient(), deployment.id),
          ).resolves.toMatchObject({
            cancelledAt: new Date(),
            cancelledById: user.id,
          })
        },
      )
    })

    describe('Empty deployment', () => {
      dbIt(
        'does not create a deployment when there are no changes',
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
          const role = await roleFactory.create(tenant, user)

          await setActiveAccounts(dbClient(), role, [account.id])
          await setRoleMembers(dbClient(), role, [user.id])

          await render(
            href('/workspace/:workspaceId/roles', {
              workspaceId: tenant.defaultWorkspaceId,
            }),
            { tenant, user },
          )

          await userEvent.click(
            await screen.findByRole('button', { name: 'Deploy' }),
          )

          await waitForPendingActions()

          await expect(
            getRoleDeployments(dbClient(), role.id),
          ).resolves.toHaveLength(0)
        },
      )

      dbIt('shows a warning', async () => {
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
        const role = await roleFactory.create(tenant, user)

        await setActiveAccounts(dbClient(), role, [account.id])
        await setRoleMembers(dbClient(), role, [user.id])

        await render(
          href('/workspace/:workspaceId/roles', {
            workspaceId: tenant.defaultWorkspaceId,
          }),
          { tenant, user },
        )

        await userEvent.click(
          await screen.findByRole('button', { name: 'Deploy' }),
        )

        await waitForPendingActions(Intent.Deploy)

        expect(
          await screen.findByRole('dialog', { name: 'Nothing to deploy' }),
        ).toHaveAccessibleDescription(
          'There are no changes that need to be applied.',
        )
      })
    })
  })
})
