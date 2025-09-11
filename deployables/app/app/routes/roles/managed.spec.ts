import { createMockStepsByAccount, render } from '@/test-utils'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chain } from '@zodiac/chains'
import {
  dbClient,
  getDeployment,
  getDeploymentSlices,
  getRoleDeployment,
  getRoleDeployments,
  setActiveAccounts,
  setDefaultWallet,
  setRoleMembers,
} from '@zodiac/db'
import { RoleDeploymentIssue } from '@zodiac/db/schema'
import {
  accountFactory,
  dbIt,
  deploymentFactory,
  roleDeploymentFactory,
  roleFactory,
  tenantFactory,
  userFactory,
  walletFactory,
} from '@zodiac/db/test-utils'
import { createMockSafeAccount } from '@zodiac/modules/test-utils'
import {
  expectRouteToBe,
  randomAddress,
  waitForPendingActions,
} from '@zodiac/test-utils'
import { href } from 'react-router'
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

      const [{ deploymentId }] = await getRoleDeployments(dbClient(), role.id)

      await expectRouteToBe(
        href('/workspace/:workspaceId/role-deployment/:deploymentId', {
          workspaceId: tenant.defaultWorkspaceId,
          deploymentId,
        }),
      )
    })

    dbIt('creates all necessary slices for the deployment', async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const role = await roleFactory.create(tenant, user)

      const slice = {
        from: randomAddress(),
        steps: [createMockStepsByAccount()],
      }

      mockPlanRoleUpdate.mockResolvedValue({
        issues: [],
        slices: [slice],
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

      const [{ deploymentId }] = await getRoleDeployments(dbClient(), role.id)
      const slices = await getDeploymentSlices(dbClient(), deploymentId)

      expect(slices).toMatchObject([
        {
          index: 0,
          ...slice,
        },
      ])
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

        const [{ deploymentId }] = await getRoleDeployments(dbClient(), role.id)
        const roleDeployment = await getRoleDeployment(dbClient(), deploymentId)

        expect(roleDeployment).toHaveProperty('issues', [
          RoleDeploymentIssue.MissingDefaultWallet,
        ])
      })
    })

    describe('Outstanding deployment', () => {
      dbIt('gives the user the option to open pending deployment', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const role = await roleFactory.create(tenant, user)
        const deployment = await deploymentFactory.create(tenant, user)
        const roleDeployment = await roleDeploymentFactory.create(
          deployment,
          role,
        )

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
          href('/workspace/:workspaceId/role-deployment/:deploymentId', {
            deploymentId: roleDeployment.deploymentId,
            workspaceId: tenant.defaultWorkspaceId,
          }),
        )
      })

      dbIt(
        'gives the user the option to cancel the current deployment',
        async () => {
          const user = await userFactory.create()
          const tenant = await tenantFactory.create(user)

          const role = await roleFactory.create(tenant, user)
          const deployment = await deploymentFactory.create(tenant, user)
          const roleDeployment = await roleDeploymentFactory.create(
            deployment,
            role,
          )

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
            getDeployment(dbClient(), roleDeployment.deploymentId),
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
