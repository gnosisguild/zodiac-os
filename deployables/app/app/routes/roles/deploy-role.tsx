import { authorizedAction, authorizedLoader } from '@/auth-server'
import { Page } from '@/components'
import { invariantResponse } from '@epic-web/invariant'
import {
  dbClient,
  getAccountByAddress,
  getActivatedAccounts,
  getDefaultRoute,
  getDefaultWalletLabels,
  getRole,
  getRoleActionAssets,
  getRoleDeployment,
  getRoleDeploymentSlice,
  getRoleDeploymentSlices,
  getRoleMembers,
  getRoutes,
  getUser,
  proposeTransaction,
  updateRoleDeploymentSlice,
} from '@zodiac/db'
import { RoleDeploymentSlice } from '@zodiac/db/schema'
import { getOptionalUUID, getPrefixedAddress, getUUID } from '@zodiac/form-data'
import { useAfterSubmit, useIsPending } from '@zodiac/hooks'
import { isUUID } from '@zodiac/schema'
import {
  Card,
  Collapsible,
  DateValue,
  Divider,
  Form,
  Info,
  InlineForm,
  Modal,
  PrimaryButton,
  PrimaryLinkButton,
  SecondaryButton,
  Select,
} from '@zodiac/ui'
import { ConnectWalletButton, TransactionStatus } from '@zodiac/web3'
import { randomUUID } from 'crypto'
import { useState } from 'react'
import { href, redirect } from 'react-router'
import { prefixAddress } from 'ser-kit'
import { Route } from './+types/deploy-role'
import {
  LabeledAddress,
  Labels,
  ProvideAddressLabels,
} from './AddressLabelContext'
import { Call } from './Call'
import { Description } from './FeedEntry'
import { ProvideRoleLabels } from './RoleLabelContext'
import { Intent } from './intents'
import { Issues } from './issues'

const contractLabels: Labels = {
  ['0x23da9ade38e4477b23770ded512fd37b12381fab']: 'Cowswap',
}

export const loader = (args: Route.LoaderArgs) =>
  authorizedLoader(
    args,
    async ({ params: { deploymentId, roleId } }) => {
      invariantResponse(isUUID(deploymentId), '"deploymentId" is not a UUID')
      invariantResponse(isUUID(roleId), '"roleId" is not a UUID')

      const deployment = await getRoleDeployment(dbClient(), deploymentId)
      const role = await getRole(dbClient(), roleId)

      const assets = await getRoleActionAssets(dbClient(), {
        roleId,
      })
      const members = await getRoleMembers(dbClient(), { roleId })
      const accounts = await getActivatedAccounts(dbClient(), { roleId })

      const accountLabels = accounts.reduce<Labels>(
        (result, account) => ({ ...result, [account.address]: account.label }),
        {},
      )

      const walletLabels = await getDefaultWalletLabels(dbClient(), {
        chainIds: Array.from(new Set(accounts.map(({ chainId }) => chainId))),
        userIds: members.map(({ id }) => id),
      })

      const assetLabels = assets.reduce<Labels>(
        (result, asset) => ({ ...result, [asset.address]: asset.symbol }),
        {},
      )

      const slices = await getRoleDeploymentSlices(dbClient(), deploymentId)

      return {
        slices,
        addressLabels: {
          ...accountLabels,
          ...walletLabels,
          ...assetLabels,
          ...contractLabels,
        },
        roleLabels: { [role.key]: role.label },
        issues: deployment.issues,
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
      async hasAccess({
        params: { roleId, workspaceId, deploymentId },
        tenant,
      }) {
        invariantResponse(isUUID(deploymentId), '"deploymentId" is no UUID')

        const deployment = await getRoleDeployment(dbClient(), deploymentId)

        return (
          deployment.tenantId === tenant.id &&
          deployment.workspaceId === workspaceId &&
          deployment.roleId === roleId
        )
      },
    },
  )

export const action = (args: Route.ActionArgs) =>
  authorizedAction(
    args,
    async ({
      request,
      params: { workspaceId, roleId, deploymentId },
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
      const deploymentSlice = await getRoleDeploymentSlice(
        dbClient(),
        getUUID(data, 'roleDeploymentSliceId'),
      )

      const routes = await getRoutes(dbClient(), tenant.id, {
        accountId: account.id,
        userId: user.id,
      })

      if (routes.length === 0) {
        return {
          issue: DeployIssues.NoRouteToAccount,
          accountId: account.id,
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
          issue: DeployIssues.MultipleRoutes,
          routes,
          defaultRouteId: defaultRoute.routeId,

          context: {
            roleDeploymentSliceId: deploymentSlice.id,
            from: prefixAddress(account.chainId, account.address),
          },
        } as const
      }

      const transactionProposal = await dbClient().transaction(async (tx) => {
        const callbackUrl = new URL(
          href(
            '/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId/slice/:deploymentSliceId/sign-callback',
            {
              workspaceId,
              roleId,
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

        await updateRoleDeploymentSlice(tx, deploymentSlice.id, {
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

        const deploymentSlice = await getRoleDeploymentSlice(
          dbClient(),
          getUUID(data, 'roleDeploymentSliceId'),
        )

        return (
          deploymentSlice.tenantId === tenant.id &&
          deploymentSlice.workspaceId === workspaceId &&
          deploymentSlice.roleDeploymentId === deploymentId
        )
      },
    },
  )

const DeployRole = ({
  loaderData: {
    slices,
    addressLabels,
    roleLabels,
    issues,
    cancelledAt,
    cancelledBy,
  },
  actionData,
  params: { workspaceId },
}: Route.ComponentProps) => {
  const [dismissedRouteWarning, setDismissedRouteWarning] = useState(false)

  useAfterSubmit(Intent.ExecuteTransaction, () =>
    setDismissedRouteWarning(false),
  )

  return (
    <Page>
      <Page.Header
        action={
          <ConnectWalletButton addressLabels={addressLabels}>
            Connect signer wallet
          </ConnectWalletButton>
        }
      >
        Deploy role
      </Page.Header>

      <Page.Main>
        {actionData != null && (
          <>
            {actionData.issue === DeployIssues.NoRouteToAccount && (
              <Modal
                open={!dismissedRouteWarning}
                onClose={() => setDismissedRouteWarning(true)}
                title="Missing route to account"
                description="You have not set up a route to this account. After you have set up a route for this account you can come back here and continue with this step."
              >
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

            {actionData.issue === DeployIssues.MultipleRoutes && (
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

        <Issues issues={issues} />

        {cancelledAt != null && (
          <Info title="Deployment cancelled">
            {cancelledBy.fullName} cancelled this deployment on{' '}
            <DateValue>{cancelledAt}</DateValue>
          </Info>
        )}

        <ProvideRoleLabels labels={roleLabels}>
          <ProvideAddressLabels labels={addressLabels}>
            {slices.length === 0 ? (
              <Info title="Nothing to deploy">
                All updates have been applied onchain.
              </Info>
            ) : (
              <div className="flex flex-col gap-8">
                {slices.map((slice) => (
                  <Card key={slice.from}>
                    {slice.steps.map(({ account, steps }) => (
                      <Collapsible
                        key={account.address}
                        header={
                          <div className="flex flex-1 items-center justify-between gap-8">
                            <Description account={account} />
                            <span className="text-xs">
                              {steps.length === 1
                                ? '1 call'
                                : `${steps.length} calls`}
                            </span>
                          </div>
                        }
                      >
                        <div className="flex flex-col gap-4 divide-y divide-zinc-700 pt-4">
                          {steps.map((step, index) => (
                            <div key={index} className="not-last:pb-4">
                              <Call
                                callData={step.call}
                                chainId={slice.chainId}
                              />
                            </div>
                          ))}
                        </div>
                      </Collapsible>
                    ))}
                    <Divider />
                    <Deploy
                      slice={slice}
                      deploymentCancelled={cancelledAt != null}
                    />
                  </Card>
                ))}
              </div>
            )}
          </ProvideAddressLabels>
        </ProvideRoleLabels>
      </Page.Main>
    </Page>
  )
}

export default DeployRole

type DeployProps = {
  slice: RoleDeploymentSlice
  deploymentCancelled: boolean
}

const Deploy = ({ slice, deploymentCancelled }: DeployProps) => {
  const pending = useIsPending(
    Intent.ExecuteTransaction,
    (data) => data.get('roleDeploymentSliceId') === slice.id,
  )

  return (
    <div className="flex flex-1 items-center justify-between gap-8">
      <LabeledAddress>{slice.from}</LabeledAddress>

      <div className="flex items-center gap-2">
        {slice.transactionHash != null && (
          <TransactionStatus hash={slice.transactionHash}>
            Deployed
          </TransactionStatus>
        )}

        <InlineForm
          context={{
            roleDeploymentSliceId: slice.id,
            from: prefixAddress(slice.chainId, slice.from),
          }}
        >
          <SecondaryButton
            submit
            size="small"
            disabled={deploymentCancelled || slice.transactionHash != null}
            intent={Intent.ExecuteTransaction}
            busy={pending}
            onClick={(event) => event.stopPropagation()}
          >
            Deploy
          </SecondaryButton>
        </InlineForm>

        {slice.proposedTransactionId && slice.cancelledAt == null && (
          <PrimaryLinkButton
            size="small"
            to={href('/workspace/:workspaceId/submit/proposal/:proposalId', {
              workspaceId: slice.workspaceId,
              proposalId: slice.proposedTransactionId,
            })}
          >
            Show transaction
          </PrimaryLinkButton>
        )}
      </div>
    </div>
  )
}

enum DeployIssues {
  NoRouteToAccount = 'NoRouteToAccount',
  MultipleRoutes = 'MultipleRoutes',
}
