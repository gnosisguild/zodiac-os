import { authorizedLoader } from '@/auth-server'
import { Page } from '@/components'
import { invariantResponse } from '@epic-web/invariant'
import {
  dbClient,
  getActivatedAccounts,
  getDefaultWalletLabels,
  getRoleActionAssets,
  getRoleDeployment,
  getRoleMembers,
} from '@zodiac/db'
import { Role } from '@zodiac/db/schema'
import { isUUID } from '@zodiac/schema'
import { ConnectWalletButton } from '@zodiac/web3'
import { Outlet } from 'react-router'
import { Issues as RoleIssues } from '../roles/issues'
import { Route } from './+types/role-deployment'
import { Labels, ProvideAddressLabels } from './AddressLabelContext'
import { ProvideRoleLabels } from './RoleLabelContext'

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
      const { role, issues } = await getRoleDeployment(dbClient(), deploymentId)
      const roleAddressLabels = await assembleRoleAddressLabels(role)

      return {
        issues,
        addressLabels: {
          ...roleAddressLabels,
          ...contractLabels,
        },
        roleLabels: { [role.key]: role.label },
      }
    },
    {
      ensureSignedIn: true,
      async hasAccess({ params: { workspaceId, deploymentId }, tenant }) {
        invariantResponse(isUUID(deploymentId), '"deploymentId" is no UUID')
        const { role } = await getRoleDeployment(dbClient(), deploymentId)

        return role.tenantId === tenant.id && role.workspaceId === workspaceId
      },
    },
  )

const RoleDeployment = ({
  loaderData: { addressLabels, roleLabels, issues },
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
        <RoleIssues issues={issues} />

        <ProvideRoleLabels labels={roleLabels}>
          <ProvideAddressLabels labels={addressLabels}>
            <Outlet />
          </ProvideAddressLabels>
        </ProvideRoleLabels>
      </Page.Main>
    </Page>
  )
}

export default RoleDeployment
