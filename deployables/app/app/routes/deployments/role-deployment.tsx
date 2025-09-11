import { authorizedLoader } from '@/auth-server'
import { Page } from '@/components'
import { invariantResponse } from '@epic-web/invariant'
import {
  dbClient,
  getActivatedAccounts,
  getDefaultWalletLabels,
  getDeployment,
  getDeploymentSlices,
  getRoleActionAssets,
  getRoleDeployment,
  getRoleMembers,
  getUser,
} from '@zodiac/db'
import { Role } from '@zodiac/db/schema'
import { isUUID } from '@zodiac/schema'
import { DateValue, Info } from '@zodiac/ui'
import { ConnectWalletButton } from '@zodiac/web3'
import { Issues } from '../roles/issues'
import { Route } from './+types/role-deployment'
import { Labels, ProvideAddressLabels } from './AddressLabelContext'
import { ProvideRoleLabels } from './RoleLabelContext'
import { Slice } from './Slice'
import { action as deploymentAction } from './deployment'

const contractLabels: Labels = {
  ['0x23da9ade38e4477b23770ded512fd37b12381fab']: 'Cow Swap',
}

const assembleRoleAddressLabels = async (role: Role): Promise<Labels> => {
  const assets = await getRoleActionAssets(dbClient(), {
    roleId: role.id,
  })
  const assetLabels = assets.reduce<Labels>(
    (result, asset) => ({ ...result, [asset.address]: asset.symbol }),
    {},
  )
  const members = await getRoleMembers(dbClient(), { roleId: role.id })
  const accounts = await getActivatedAccounts(dbClient(), { roleId: role.id })
  const accountLabels = accounts.reduce<Labels>(
    (result, account) => ({ ...result, [account.address]: account.label }),
    {},
  )

  const walletLabels = await getDefaultWalletLabels(dbClient(), {
    chainIds: Array.from(new Set(accounts.map(({ chainId }) => chainId))),
    userIds: members.map(({ id }) => id),
  })

  return {
    ...accountLabels,
    ...walletLabels,
    ...assetLabels,
  }
}

export const loader = (args: Route.LoaderArgs) =>
  authorizedLoader(
    args,
    async ({ params: { deploymentId } }) => {
      invariantResponse(isUUID(deploymentId), '"deploymentId" is not a UUID')

      const deployment = await getDeployment(dbClient(), deploymentId)
      const slices = await getDeploymentSlices(dbClient(), deploymentId)

      const { role, issues } = await getRoleDeployment(dbClient(), deploymentId)
      const roleAddressLabels = await assembleRoleAddressLabels(role)

      return {
        slices,
        addressLabels: {
          ...roleAddressLabels,
          ...contractLabels,
        },
        roleLabels: { [role.key]: role.label },
        issues,
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

// the action is the same as for generic deployments, so we can reuse it
export const action = deploymentAction

const RoleDeployment = ({
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
                  <Slice
                    key={slice.from}
                    slice={slice}
                    deploymentCancelled={cancelledAt != null}
                  />
                ))}
              </div>
            )}
          </ProvideAddressLabels>
        </ProvideRoleLabels>
      </Page.Main>
    </Page>
  )
}

export default RoleDeployment
