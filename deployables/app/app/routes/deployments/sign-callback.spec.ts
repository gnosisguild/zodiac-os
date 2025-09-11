import { post } from '@/test-utils'
import { dbClient, getDeployment, getDeploymentSlice } from '@zodiac/db'
import {
  accountFactory,
  dbIt,
  deploymentFactory,
  deploymentSliceFactory,
  roleDeploymentFactory,
  roleFactory,
  routeFactory,
  signedTransactionFactory,
  tenantFactory,
  transactionProposalFactory,
  userFactory,
  walletFactory,
} from '@zodiac/db/test-utils'
import { formData } from '@zodiac/form-data'
import { randomHex } from '@zodiac/test-utils'
import { href } from 'react-router'
import { beforeEach, describe, expect, vi } from 'vitest'

describe('Sign callback', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date())
  })

  dbIt('stores the transaction hash on the deployment slice', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const wallet = await walletFactory.create(user)
    const account = await accountFactory.create(tenant, user)

    const route = await routeFactory.create(account, wallet)

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
      {
        signedTransactionId: transaction.id,
      },
    )

    const slice = await deploymentSliceFactory.create(user, deployment, {
      proposedTransactionId: proposal.id,
    })

    const transactionHash = randomHex(18)

    await post(
      href(
        '/workspace/:workspaceId/deployment/:deploymentId/slice/:deploymentSliceId/sign-callback',
        {
          workspaceId: tenant.defaultWorkspaceId,
          deploymentId: deployment.id,
          deploymentSliceId: slice.id,
        },
      ),
      formData({ proposalId: proposal.id, transactionHash }),
    )

    await expect(
      getDeploymentSlice(dbClient(), slice.id),
    ).resolves.toHaveProperty('transactionHash', transactionHash)
  })

  dbIt('records who completed the slice when', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const wallet = await walletFactory.create(user)
    const account = await accountFactory.create(tenant, user)
    const route = await routeFactory.create(account, wallet)

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

    const slice = await deploymentSliceFactory.create(user, deployment, {
      proposedTransactionId: proposal.id,
    })

    const transactionHash = randomHex(18)

    await post(
      href(
        '/workspace/:workspaceId/deployment/:deploymentId/slice/:deploymentSliceId/sign-callback',
        {
          workspaceId: tenant.defaultWorkspaceId,
          deploymentId: deployment.id,
          deploymentSliceId: slice.id,
        },
      ),
      formData({ proposalId: proposal.id, transactionHash }),
      { tenant, user },
    )

    await expect(
      getDeploymentSlice(dbClient(), slice.id),
    ).resolves.toMatchObject({
      completedAt: new Date(),
      completedById: user.id,
    })
  })

  dbIt(
    'completes the deployment if all slices have been completed',
    async () => {
      const user = await userFactory.create()
      const tenant = await tenantFactory.create(user)

      const wallet = await walletFactory.create(user)
      const account = await accountFactory.create(tenant, user)
      const route = await routeFactory.create(account, wallet)

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

      const slice = await deploymentSliceFactory.create(user, deployment, {
        proposedTransactionId: proposal.id,
      })

      const transactionHash = randomHex(18)

      await post(
        href(
          '/workspace/:workspaceId/deployment/:deploymentId/slice/:deploymentSliceId/sign-callback',
          {
            workspaceId: tenant.defaultWorkspaceId,
            deploymentId: deployment.id,
            deploymentSliceId: slice.id,
          },
        ),
        formData({ proposalId: proposal.id, transactionHash }),
        { tenant, user },
      )

      await expect(
        getDeployment(dbClient(), deployment.id),
      ).resolves.toMatchObject({
        completedAt: new Date(),
      })
    },
  )

  dbIt('redirects to the deployment page', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const wallet = await walletFactory.create(user)
    const account = await accountFactory.create(tenant, user)
    const route = await routeFactory.create(account, wallet)

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

    const slice = await deploymentSliceFactory.create(user, deployment, {
      proposedTransactionId: proposal.id,
    })

    const transactionHash = randomHex(18)

    const response = await post(
      href(
        '/workspace/:workspaceId/deployment/:deploymentId/slice/:deploymentSliceId/sign-callback',
        {
          workspaceId: tenant.defaultWorkspaceId,
          deploymentId: deployment.id,
          deploymentSliceId: slice.id,
        },
      ),
      formData({ proposalId: proposal.id, transactionHash }),
      { tenant, user },
    )

    await expect(response.json()).resolves.toEqual({
      redirectTo: `/workspace/${tenant.defaultWorkspaceId}/deployment/${deployment.id}`,
    })
  })

  dbIt('redirects to the role deployment page', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const wallet = await walletFactory.create(user)
    const account = await accountFactory.create(tenant, user)
    const route = await routeFactory.create(account, wallet)

    const role = await roleFactory.create(tenant, user)
    const deployment = await deploymentFactory.create(tenant, user)
    await roleDeploymentFactory.create(deployment, role)

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

    const slice = await deploymentSliceFactory.create(user, deployment, {
      proposedTransactionId: proposal.id,
    })

    const transactionHash = randomHex(18)

    const response = await post(
      href(
        '/workspace/:workspaceId/deployment/:deploymentId/slice/:deploymentSliceId/sign-callback',
        {
          workspaceId: tenant.defaultWorkspaceId,
          deploymentId: deployment.id,
          deploymentSliceId: slice.id,
        },
      ),
      formData({ proposalId: proposal.id, transactionHash }),
      { tenant, user },
    )

    await expect(response.json()).resolves.toEqual({
      redirectTo: `/workspace/${tenant.defaultWorkspaceId}/role-deployment/${deployment.id}`,
    })
  })
})
