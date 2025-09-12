import { simulateTransactionBundle } from '@/simulation-server'
import { createMockExecuteTransactionAction, render } from '@/test-utils'
import { screen } from '@testing-library/react'
import { dbClient, setActiveAccounts, setRoleMembers } from '@zodiac/db'
import { RoleDeploymentIssue } from '@zodiac/db/schema'
import {
  accountFactory,
  dbIt,
  deploymentFactory,
  roleDeploymentFactory,
  roleFactory,
  tenantFactory,
  userFactory,
} from '@zodiac/db/test-utils'
import { href } from 'react-router'
import {
  checkPermissions,
  planApplyAccounts,
  planExecution,
  queryAccounts,
  queryRoutes,
} from 'ser-kit'
import { beforeEach, describe, expect, vi } from 'vitest'

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

describe('Role Deployment', () => {
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
        const deployment = await deploymentFactory.create(tenant, user)
        await roleDeploymentFactory.create(deployment, role, {
          issues: [RoleDeploymentIssue.NoActiveMembers],
        })

        await render(
          href('/workspace/:workspaceId/role-deployment/:deploymentId', {
            workspaceId: tenant.defaultWorkspaceId,
            deploymentId: deployment.id,
          }),
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
        const deployment = await deploymentFactory.create(tenant, user)
        await roleDeploymentFactory.create(deployment, role, {
          issues: [RoleDeploymentIssue.MissingDefaultWallet],
        })

        await setActiveAccounts(dbClient(), role, [account.id])
        await setRoleMembers(dbClient(), role, [user.id])

        await render(
          href('/workspace/:workspaceId/role-deployment/:deploymentId', {
            workspaceId: tenant.defaultWorkspaceId,
            deploymentId: deployment.id,
          }),
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
      dbIt('warns when no accounts have been selected', async () => {
        const user = await userFactory.create()
        const tenant = await tenantFactory.create(user)

        const role = await roleFactory.create(tenant, user)
        const deployment = await deploymentFactory.create(tenant, user)
        await roleDeploymentFactory.create(deployment, role, {
          issues: [RoleDeploymentIssue.NoActiveAccounts],
        })

        await render(
          href('/workspace/:workspaceId/role-deployment/:deploymentId', {
            workspaceId: tenant.defaultWorkspaceId,
            deploymentId: deployment.id,
          }),
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
})
