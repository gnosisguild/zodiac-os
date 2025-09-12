import { authorizedAction, authorizedLoader } from '@/auth-server'
import { invariantResponse } from '@epic-web/invariant'
import {
  dbClient,
  getAccountByAddress,
  getDefaultRoute,
  getDeployment,
  getDeploymentSlice,
  getDeploymentSlices,
  getRoutes,
  getUser,
  getUsersWithRouteToAccount,
  proposeTransaction,
  updateDeploymentSlice,
} from '@zodiac/db'
import { getOptionalUUID, getPrefixedAddress, getUUID } from '@zodiac/form-data'
import { useAfterSubmit } from '@zodiac/hooks'
import { isUUID } from '@zodiac/schema'
import {
  DateValue,
  Form,
  Info,
  List,
  ListItem,
  Modal,
  PrimaryButton,
  PrimaryLinkButton,
  Select,
} from '@zodiac/ui'
import { randomUUID } from 'crypto'
import { useState } from 'react'
import { href, redirect } from 'react-router'
import { prefixAddress } from 'ser-kit'
import { Route } from './+types/deployment'
import { Slice } from './Slice'
import { Intent } from './intents'

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

      const routes = await getRoutes(dbClient(), tenant.id, {
        accountId: account.id,
        userId: user.id,
      })

      if (routes.length === 0) {
        return {
          issue: DeployIssue.NoRouteToAccount,
          accountId: account.id,
          usersWhoCanExecute: await getUsersWithRouteToAccount(
            dbClient(),
            account.id,
          ),
        } as const
      }

      const selectedRouteId = getOptionalUUID(data, 'route')

      if (routes.length > 1 && selectedRouteId == null) {
        const defaultRoute = await getDefaultRoute(
          dbClient(),
          tenant,
          user,
          account.id,
        )

        return {
          issue: DeployIssue.MultipleRoutes,
          routes,
          defaultRouteId: defaultRoute.routeId,

          context: {
            deploymentSliceId: deploymentSlice.id,
            from: prefixAddress(account.chainId, account.address),
          },
        } as const
      }

      const transactionProposal = await dbClient().transaction(async (tx) => {
        const callbackUrl = new URL(
          href(
            '/workspace/:workspaceId/deployments/:deploymentId/slice/:deploymentSliceId/sign-callback',
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
          routeId: selectedRouteId,
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
  loaderData: { slices, cancelledAt, cancelledBy },
  actionData,
  params: { workspaceId },
}: Route.ComponentProps) => {
  const [dismissedRouteWarning, setDismissedRouteWarning] = useState(false)

  useAfterSubmit(Intent.ExecuteTransaction, () =>
    setDismissedRouteWarning(false),
  )

  return (
    <>
      {actionData != null && (
        <>
          {actionData.issue === DeployIssue.NoRouteToAccount && (
            <Modal
              open={!dismissedRouteWarning}
              onClose={() => setDismissedRouteWarning(true)}
              title="Missing route to account"
              description="You have not set up a route to this account. After you have set up a route for this account you can come back here and continue with this step."
            >
              {actionData.usersWhoCanExecute.length > 0 && (
                <List label="Users who can execute">
                  {actionData.usersWhoCanExecute.map((user) => (
                    <ListItem key={user.id}>{user.fullName}</ListItem>
                  ))}
                </List>
              )}

              <Modal.Actions>
                <PrimaryLinkButton
                  to={href('/workspace/:workspaceId/accounts/:accountId', {
                    workspaceId,
                    accountId: actionData.accountId,
                  })}
                >
                  Open account
                </PrimaryLinkButton>

                <Modal.CloseAction>Cancel</Modal.CloseAction>
              </Modal.Actions>
            </Modal>
          )}

          {actionData.issue === DeployIssue.MultipleRoutes && (
            <Modal
              open={!dismissedRouteWarning}
              onClose={() => setDismissedRouteWarning(true)}
              title="Multiple routes available"
              description="Please choose the route you want to use. The default one has been pre-selected."
            >
              <Form context={actionData.context}>
                <Select
                  name="route"
                  label="Route"
                  options={actionData.routes.map((route) => ({
                    value: route.id,
                    label: route.label,
                  }))}
                  defaultValue={actionData.defaultRouteId}
                />
                <Modal.Actions>
                  <PrimaryButton submit intent={Intent.ExecuteTransaction}>
                    Use route
                  </PrimaryButton>
                  <Modal.CloseAction>Cancel</Modal.CloseAction>
                </Modal.Actions>
              </Form>
            </Modal>
          )}
        </>
      )}

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
          {slices.map((slice) => (
            <Slice
              key={slice.from}
              slice={slice}
              deploymentCancelled={cancelledAt != null}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default Deployment

enum DeployIssue {
  NoRouteToAccount = 'NoRouteToAccount',
  MultipleRoutes = 'MultipleRoutes',
}
