import { authorizedLoader } from '@/auth-server'
import { invariantResponse } from '@epic-web/invariant'
import {
  assertActiveDeployment,
  assertActiveDeploymentSlice,
  completeDeploymentIfNeeded,
  completeDeploymentSlice,
  dbClient,
  findRoleDeployment,
  getDeployment,
  getDeploymentSlice,
  getProposedTransaction,
  getSignedTransaction,
} from '@zodiac/db'
import { getHexString, getUUID } from '@zodiac/form-data'
import { isUUID } from '@zodiac/schema'
import { href } from 'react-router'
import { Route } from './+types/sign-callback'

export const action = (args: Route.LoaderArgs) =>
  authorizedLoader(
    args,
    async ({
      request,
      params: { workspaceId, deploymentId, deploymentSliceId },
    }) => {
      invariantResponse(
        isUUID(deploymentSliceId),
        '"deploymentSliceId" is not a UUID',
      )
      invariantResponse(isUUID(deploymentId), '"deploymentId" is not a UUID')

      const data = await request.formData()

      const proposal = await getProposedTransaction(
        dbClient(),
        getUUID(data, 'proposalId'),
      )

      invariantResponse(
        proposal.signedTransactionId != null,
        'Transaction proposal has not been signed, yet.',
      )

      const transaction = await getSignedTransaction(
        dbClient(),
        proposal.signedTransactionId,
      )

      const deployment = await getDeployment(dbClient(), deploymentId)

      assertActiveDeployment(deployment)

      const deploymentSlice = await getDeploymentSlice(
        dbClient(),
        deploymentSliceId,
      )

      assertActiveDeploymentSlice(deploymentSlice)

      await dbClient().transaction(async (tx) => {
        await completeDeploymentSlice(tx, deploymentSlice, {
          userId: transaction.userId,
          transactionHash: getHexString(data, 'transactionHash'),
          signedTransactionId: transaction.id,
        })

        await completeDeploymentIfNeeded(tx, deployment)
      })

      const roleDeployment = await findRoleDeployment(dbClient(), deploymentId)

      return Response.json({
        redirectTo: href(
          roleDeployment != null
            ? '/workspace/:workspaceId/role-deployments/:deploymentId'
            : '/workspace/:workspaceId/deployments/:deploymentId',
          {
            workspaceId,
            deploymentId,
          },
        ),
      })
    },
    {
      ensureSignedIn: false,
      async hasAccess({
        request,
        params: { deploymentId, workspaceId, deploymentSliceId },
      }) {
        const data = await request.formData()

        const proposal = await getProposedTransaction(
          dbClient(),
          getUUID(data, 'proposalId'),
        )

        const state = new URL(request.url).searchParams.get('state')

        if (proposal.callbackState !== state) {
          return false
        }

        invariantResponse(
          isUUID(deploymentSliceId),
          '"deploymentSliceId" is not a UUID',
        )

        const deploymentSlice = await getDeploymentSlice(
          dbClient(),
          deploymentSliceId,
        )

        return (
          deploymentSlice.tenantId === proposal.tenantId &&
          deploymentSlice.deploymentId === deploymentId &&
          deploymentSlice.workspaceId === workspaceId
        )
      },
    },
  )
