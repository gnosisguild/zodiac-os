import { authorizedAction, authorizedLoader } from '@/auth-server'
import { Page } from '@/components'
import { invariantResponse } from '@epic-web/invariant'
import {
  dbClient,
  getAccountByAddress,
  getActivatedAccounts,
  getDefaultWalletLabels,
  getRole,
  getRoleActionAssets,
  getRoleDeployment,
  getRoleDeploymentSlice,
  getRoleDeploymentSlices,
  getRoleMembers,
  getUser,
  proposeTransaction,
  updateRoleDeploymentSlice,
} from '@zodiac/db'
import { RoleDeploymentSlice } from '@zodiac/db/schema'
import { getPrefixedAddress, getUUID } from '@zodiac/form-data'
import { useIsPending } from '@zodiac/hooks'
import { isUUID } from '@zodiac/schema'
import {
  Card,
  Collapsible,
  DateValue,
  Divider,
  Info,
  InlineForm,
  PrimaryLinkButton,
  SecondaryButton,
} from '@zodiac/ui'
import { Address, ConnectWalletButton, TransactionStatus } from '@zodiac/web3'
import { randomUUID } from 'crypto'
import { href, redirect } from 'react-router'
import { prefixAddress } from 'ser-kit'
import { Route } from './+types/deploy-role'
import { Labels, ProvideAddressLabels } from './AddressLabelContext'
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
        Deploy role
      </Page.Header>

      <Page.Main>
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
                <Info>
                  The following changes need to be applied to deploy this role.
                </Info>

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
      <Address>{slice.from}</Address>

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
