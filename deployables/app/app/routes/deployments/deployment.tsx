import { authorizedAction, authorizedLoader } from '@/auth-server'
import { Page } from '@/components'
import { invariantResponse } from '@epic-web/invariant'
import {
  dbClient,
  getAccountByAddress,
  getDeployment,
  getDeploymentSlice,
  getDeploymentSlices,
  getUser,
  proposeTransaction,
  updateDeploymentSlice,
} from '@zodiac/db'
import { getPrefixedAddress, getUUID } from '@zodiac/form-data'
import { isUUID } from '@zodiac/schema'
import { DateValue, Info } from '@zodiac/ui'
import { ConnectWalletButton } from '@zodiac/web3'
import { randomUUID } from 'crypto'
import { href, redirect } from 'react-router'
import { Route } from './+types/deployment'
import { Slice } from './Slice'

export const loader = (args: Route.LoaderArgs) =>
  authorizedLoader(
    args,
    async ({ params: { deploymentId } }) => {
      invariantResponse(isUUID(deploymentId), '"deploymentId" is not a UUID')

      const deployment = await getDeployment(dbClient(), deploymentId)
      const slices = await getDeploymentSlices(dbClient(), deploymentId)

      return {
        slices,
        addressLabels: {},
        ...(deployment.cancelledAt == null
          ? { cancelledAt: null, cancelledBy: null }
          : {
              cancelledAt: deployment.cancelledAt,
              cancelledBy: await getUser(dbClient(), deployment.cancelledById),
            }),
      }
    },
    {
      ensureSignedIn: true,
      async hasAccess({ params: { workspaceId, deploymentId }, tenant }) {
        invariantResponse(isUUID(deploymentId), '"deploymentId" is no UUID')

        const deployment = await getDeployment(dbClient(), deploymentId)

        return (
          deployment.tenantId === tenant.id &&
          deployment.workspaceId === workspaceId
        )
      },
    },
  )

export const action = (args: Route.ActionArgs) =>
  authorizedAction(
    args,
    async ({
      request,
      params: { workspaceId, deploymentId },
      context: {
        auth: { user, tenant },
      },
    }) => {
      const data = await request.formData()
      const url = new URL(request.url)

      const account = await getAccountByAddress(dbClient(), {
        tenantId: tenant.id,
        prefixedAddress: getPrefixedAddress(data, 'from'),
      })

      const deploymentSlice = await getDeploymentSlice(
        dbClient(),
        getUUID(data, 'deploymentSliceId'),
      )

      const transactionProposal = await dbClient().transaction(async (tx) => {
        const callbackUrl = new URL(
          href(
            '/workspace/:workspaceId/deployment/:deploymentId/slice/:deploymentSliceId/sign-callback',
            {
              workspaceId,
              deploymentId,
              deploymentSliceId: deploymentSlice.id,
            },
          ),
          url.origin,
        )

        const transactionBundle = deploymentSlice.steps.flatMap(
          (stepsByAccount) =>
            stepsByAccount.steps.map((step) => step.transaction),
        )

        const transactionProposal = await proposeTransaction(tx, {
          userId: user.id,
          tenantId: deploymentSlice.tenantId,
          workspaceId: deploymentSlice.workspaceId,
          accountId: account.id,
          transaction: transactionBundle,
          callbackUrl,
          callbackState: randomUUID(),
        })

        await updateDeploymentSlice(tx, deploymentSlice.id, {
          proposedTransactionId: transactionProposal.id,
        })

        return transactionProposal
      })

      return redirect(
        href('/workspace/:workspaceId/submit/proposal/:proposalId', {
          workspaceId,
          proposalId: transactionProposal.id,
        }),
      )
    },
    {
      ensureSignedIn: true,
      async hasAccess({
        request,
        params: { workspaceId, deploymentId },
        tenant,
      }) {
        const data = await request.formData()

        const deploymentSlice = await getDeploymentSlice(
          dbClient(),
          getUUID(data, 'deploymentSliceId'),
        )

        return (
          deploymentSlice.tenantId === tenant.id &&
          deploymentSlice.workspaceId === workspaceId &&
          deploymentSlice.deploymentId === deploymentId
        )
      },
    },
  )

const Deployment = ({
  loaderData: { slices, addressLabels, cancelledAt, cancelledBy },
}: Route.ComponentProps) => {
  return (
    <Page>
      <Page.Header
        action={
          <ConnectWalletButton addressLabels={addressLabels}>
            Connect signer wallet
          </ConnectWalletButton>
        }
      >
        Deploy account updates
      </Page.Header>

      <Page.Main>
        {cancelledAt != null && (
          <Info title="Deployment cancelled">
            {cancelledBy.fullName} cancelled this deployment on{' '}
            <DateValue>{cancelledAt}</DateValue>
          </Info>
        )}

        {slices.length === 0 ? (
          <Info title="Nothing to deploy">
            All updates have been applied onchain.
          </Info>
        ) : (
          <div className="flex flex-col gap-8">
            <Info>The following changes are going to be applied.</Info>

            {slices.map((slice) => (
              <Slice
                key={slice.from}
                slice={slice}
                deploymentCancelled={cancelledAt != null}
              />
            ))}
          </div>
        )}
      </Page.Main>
    </Page>
  )
}

export default Deployment
