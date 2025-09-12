import { authorizedLoader } from '@/auth-server'
import { invariantResponse } from '@epic-web/invariant'
import {
  completeDeploymentIfNeeded,
  completeDeploymentSlice,
  dbClient,
  findRoleDeployment,
  getDeploymentSlice,
  getProposedTransaction,
  getSignedTransaction,
  getUser,
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
      const user = await getUser(dbClient(), transaction.userId)

      await dbClient().transaction(async (tx) => {
        await completeDeploymentSlice(tx, user, {
          deploymentSliceId: deploymentSliceId,
          transactionHash: getHexString(data, 'transactionHash'),
        })

        await completeDeploymentIfNeeded(tx, deploymentId)
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
