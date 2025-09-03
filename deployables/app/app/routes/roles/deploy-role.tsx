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
  getRoleDeploymentStep,
  getRoleDeploymentSteps,
  getRoleMembers,
  getUser,
  proposeTransaction,
  updateRoleDeploymentStep,
} from '@zodiac/db'
import { RoleDeploymentStep } from '@zodiac/db/schema'
import { formData, getPrefixedAddress, getUUID } from '@zodiac/form-data'
import { useIsPending } from '@zodiac/hooks'
import { isUUID } from '@zodiac/schema'
import {
  Card,
  Collapsible,
  DateValue,
  Info,
  InlineForm,
  PrimaryLinkButton,
  SecondaryButton,
} from '@zodiac/ui'
import {
  ConnectWalletButton,
  TransactionStatus,
  useSendTransaction,
} from '@zodiac/web3'
import { randomUUID, UUID } from 'crypto'
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

      const steps = await getRoleDeploymentSteps(dbClient(), deploymentId)

      return {
        steps,
        roleId,
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

      const deploymentStep = await getRoleDeploymentStep(
        dbClient(),
        getUUID(data, 'roleDeploymentStepId'),
      )

      const transactionProposal = await dbClient().transaction(async (tx) => {
        const callbackUrl = new URL(
          href(
            '/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId/step/:deploymentStepId/sign-callback',
            {
              workspaceId,
              roleId,
              deploymentId,
              deploymentStepId: deploymentStep.id,
            },
          ),
          url.origin,
        )

        const transactionProposal = await proposeTransaction(tx, {
          userId: user.id,
          tenantId: deploymentStep.tenantId,
          workspaceId: deploymentStep.workspaceId,
          accountId: account.id,
          transaction: deploymentStep.transactionBundle,
          callbackUrl,
          callbackState: randomUUID(),
        })

        await updateRoleDeploymentStep(tx, deploymentStep.id, {
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

        const deploymentStep = await getRoleDeploymentStep(
          dbClient(),
          getUUID(data, 'roleDeploymentStepId'),
        )

        return (
          deploymentStep.tenantId === tenant.id &&
          deploymentStep.workspaceId === workspaceId &&
          deploymentStep.roleDeploymentId === deploymentId
        )
      },
    },
  )

const DeployRole = ({
  loaderData: {
    steps,
    addressLabels,
    roleLabels,
    issues,
    cancelledAt,
    cancelledBy,
    roleId,
  },
  params: { workspaceId },
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
            {steps.length === 0 ? (
              <Info title="Nothing to deploy">
                All updates have been applied onchain.
              </Info>
            ) : (
              <div className="flex flex-col gap-8">
                <Info>
                  The following changes need to be applied to deploy this role.
                </Info>

                {steps.map((step) => (
                  <Card key={step.id}>
                    <Collapsible
                      header={
                        <div className="flex flex-1 items-center justify-between gap-8">
                          <Description account={step.account} />

                          <div className="flex items-center gap-2">
                            {step.transactionHash != null && (
                              <TransactionStatus hash={step.transactionHash}>
                                Deployed
                              </TransactionStatus>
                            )}

                            <Deploy
                              disabled={
                                step.transactionHash != null ||
                                cancelledAt != null
                              }
                              deploymentStep={step}
                              roleId={roleId}
                            />

                            {step.proposedTransactionId &&
                              cancelledAt == null && (
                                <PrimaryLinkButton
                                  size="small"
                                  to={href(
                                    '/workspace/:workspaceId/submit/proposal/:proposalId',
                                    {
                                      workspaceId,
                                      proposalId: step.proposedTransactionId,
                                    },
                                  )}
                                >
                                  Show transaction
                                </PrimaryLinkButton>
                              )}
                          </div>
                        </div>
                      }
                    >
                      <div className="flex flex-col gap-4 divide-y divide-zinc-700 pt-4">
                        {step.calls.map((call, index) => (
                          <div
                            key={`${step.id}-${index}`}
                            className="not-last:pb-4"
                          >
                            <Call callData={call} chainId={step.chainId} />
                          </div>
                        ))}
                      </div>
                    </Collapsible>
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
  deploymentStep: RoleDeploymentStep
  roleId: UUID
  disabled: boolean
}

const Deploy = ({ deploymentStep, roleId, disabled }: DeployProps) => {
  const { sendTransaction, isPending } = useSendTransaction()

  const pending = useIsPending(
    Intent.ExecuteTransaction,
    (data) => data.get('roleDeploymentStepId') === deploymentStep.id,
  )

  if (deploymentStep.from == null) {
    const [transaction] = deploymentStep.transactionBundle

    return (
      <InlineForm
        intent={Intent.ExecuteTransaction}
        context={{ roleDeploymentStepId: deploymentStep.id }}
        action={href(
          '/workspace/:workspaceId/roles/:roleId/deployment/:deploymentId/step/:deploymentStepId/sign-callback',
          {
            workspaceId: deploymentStep.workspaceId,
            deploymentId: deploymentStep.roleDeploymentId,
            deploymentStepId: deploymentStep.id,
            roleId,
          },
        )}
      >
        {({ submit }) => (
          <SecondaryButton
            size="small"
            disabled={disabled}
            busy={pending || isPending}
            onClick={() =>
              sendTransaction(transaction, {
                onSuccess(transactionHash) {
                  submit(formData({ transactionHash }))
                },
              })
            }
          >
            Deploy
          </SecondaryButton>
        )}
      </InlineForm>
    )
  }

  return (
    <InlineForm
      context={{
        roleDeploymentStepId: deploymentStep.id,
        from: prefixAddress(deploymentStep.chainId, deploymentStep.from),
      }}
    >
      <SecondaryButton
        submit
        size="small"
        disabled={disabled}
        intent={Intent.ExecuteTransaction}
        busy={pending}
        onClick={(event) => event.stopPropagation()}
      >
        Deploy
      </SecondaryButton>
    </InlineForm>
  )
}
