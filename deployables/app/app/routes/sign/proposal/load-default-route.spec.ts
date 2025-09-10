import { simulateTransactionBundle } from '@/simulation-server'
import { createMockExecuteTransactionAction, render } from '@/test-utils'
import { jsonRpcProvider } from '@/utils'
import { screen } from '@testing-library/react'
import { Chain } from '@zodiac/chains'
import { dbClient, setDefaultRoute } from '@zodiac/db'
import {
  accountFactory,
  dbIt,
  routeFactory,
  tenantFactory,
  transactionProposalFactory,
  userFactory,
  walletFactory,
} from '@zodiac/db/test-utils'
import { expectRouteToBe, randomAddress } from '@zodiac/test-utils'
import { MockJsonRpcProvider } from '@zodiac/test-utils/rpc'
import { useAccount, useConnectorClient } from '@zodiac/web3'
import { href } from 'react-router'
import { planExecution, queryRoutes } from 'ser-kit'
import { beforeEach, describe, expect, vi } from 'vitest'

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

const mockPlanExecution = vi.mocked(planExecution)
const mockQueryRoutes = vi.mocked(queryRoutes)

vi.mock('@zodiac/web3', async (importOriginal) => {
  const module = await importOriginal<typeof import('@zodiac/web3')>()

  return {
    ...module,

    useAccount: vi.fn(module.useAccount),
    useConnectorClient: vi.fn(module.useConnectorClient),
  }
})

const mockUseAccount = vi.mocked(useAccount)
const mockUseConnectorClient = vi.mocked(useConnectorClient)

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

describe('Load default route', () => {
  beforeEach(() => {
    mockPlanExecution.mockResolvedValue([createMockExecuteTransactionAction()])
    mockQueryRoutes.mockResolvedValue([])

    mockJsonRpcProvider.mockReturnValue(new MockJsonRpcProvider())

    // @ts-expect-error We really only want to use this subset
    mockUseAccount.mockReturnValue({
      address: randomAddress(),
      chainId: Chain.ETH,
    })

    // @ts-expect-error We just need this to be there
    mockUseConnectorClient.mockReturnValue({ data: {} })

    mockSimulateTransactionBundle.mockResolvedValue({
      error: null,
      approvals: [],
      tokenFlows: { sent: [], received: [], other: [] },
    })
  })

  dbIt(
    'loads the default route for an account and redirects the user',
    async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const wallet = await walletFactory.create(user)
      const account = await accountFactory.create(tenant, user)

      const route = await routeFactory.create(account, wallet)

      const proposal = await transactionProposalFactory.create(
        tenant,
        user,
        account,
      )

      await setDefaultRoute(dbClient(), tenant, user, route)

      await render(
        href('/workspace/:workspaceId/submit/proposal/:proposalId', {
          proposalId: proposal.id,
          workspaceId: tenant.defaultWorkspaceId,
        }),
        { tenant, user },
      )

      await expectRouteToBe(
        href('/workspace/:workspaceId/submit/proposal/:proposalId/:routeId', {
          proposalId: proposal.id,
          routeId: route.id,
          workspaceId: tenant.defaultWorkspaceId,
        }),
      )
    },
  )

  dbIt('picks the first route when no default route is set', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const wallet = await walletFactory.create(user)
    const account = await accountFactory.create(tenant, user)

    const routeA = await routeFactory.create(account, wallet, {
      label: 'Route A',
    })
    await routeFactory.create(account, wallet, { label: 'Route B' })

    const proposal = await transactionProposalFactory.create(
      tenant,
      user,
      account,
    )

    await render(
      href('/workspace/:workspaceId/submit/proposal/:proposalId', {
        proposalId: proposal.id,
        workspaceId: tenant.defaultWorkspaceId,
      }),
      { tenant, user },
    )

    await expectRouteToBe(
      href('/workspace/:workspaceId/submit/proposal/:proposalId/:routeId', {
        proposalId: proposal.id,
        routeId: routeA.id,
        workspaceId: tenant.defaultWorkspaceId,
      }),
    )
  })

  dbIt(
    'picks the route specified for the proposal when one is specified',
    async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const wallet = await walletFactory.create(user)
      const account = await accountFactory.create(tenant, user)

      await routeFactory.create(account, wallet, {
        label: 'Route A',
      })
      const routeB = await routeFactory.create(account, wallet, {
        label: 'Route B',
      })

      const proposal = await transactionProposalFactory.create(
        tenant,
        user,
        account,
        { routeId: routeB.id },
      )

      await render(
        href('/workspace/:workspaceId/submit/proposal/:proposalId', {
          proposalId: proposal.id,
          workspaceId: tenant.defaultWorkspaceId,
        }),
        { tenant, user },
      )

      await expectRouteToBe(
        href('/workspace/:workspaceId/submit/proposal/:proposalId/:routeId', {
          proposalId: proposal.id,
          routeId: routeB.id,
          workspaceId: tenant.defaultWorkspaceId,
        }),
      )
    },
  )

  dbIt('shows an error when no route has been configured', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const account = await accountFactory.create(tenant, user)

    const proposal = await transactionProposalFactory.create(
      tenant,
      user,
      account,
    )

    await render(
      href('/workspace/:workspaceId/submit/proposal/:proposalId', {
        proposalId: proposal.id,
        workspaceId: tenant.defaultWorkspaceId,
      }),
      { tenant, user },
    )

    expect(
      await screen.findByRole('alert', {
        name: 'Incomplete account configuration',
      }),
    ).toHaveAccessibleDescription(
      'This transaction cannot be signed because the configuration for this account is incomplete.',
    )
  })
})
