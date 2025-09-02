import { authorizedLoader } from '@/auth-server'
import { FetchRolesDocument, RoleListEntryFragment } from '@/graphql'
import { graphqlClient } from '@/graphql-client'
import { Chain } from '@/routes-ui'
import { invariant, invariantResponse } from '@epic-web/invariant'
import { verifyChainId } from '@zodiac/chains'
import { dbClient, getAccounts, getWorkspace } from '@zodiac/db'
import { Account } from '@zodiac/db/schema'
import { isUUID, verifyHexAddress } from '@zodiac/schema'
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@zodiac/ui'
import { Address } from '@zodiac/web3'
import { prefixAddress, PrefixedAddress } from 'ser-kit'
import { decodeKey as decodeRoleKey } from 'zodiac-roles-sdk'
import { Route } from './+types/on-chain'

export const loader = (args: Route.LoaderArgs) =>
  authorizedLoader(
    args,
    async ({ params: { workspaceId } }) => {
      invariantResponse(isUUID(workspaceId), '"workspaceId" is no UUID')

      const accounts = await getAccounts(dbClient(), { workspaceId })

      const onChainRoles = await Promise.all(
        accounts.flatMap(async (account) => {
          const { rolesModifiers } = await graphqlClient().query(
            FetchRolesDocument,
            { account: prefixAddress(account.chainId, account.address) },
          )

          return rolesModifiers
        }),
      )

      const rolesByAccount = onChainRoles
        .flat()
        .reduce<
          Record<
            PrefixedAddress,
            { account: Account; id: string; roles: RoleListEntryFragment[] }
          >
        >((result, { roles, avatar: _avatar, chainId }) => {
          if (roles.length === 0) {
            return result
          }

          const avatar = verifyHexAddress(_avatar)
          const prefixedAddress = prefixAddress(verifyChainId(chainId), avatar)
          const account = accounts.find(
            (a) => a.address === avatar && a.chainId === chainId,
          )

          invariant(
            account != null,
            `Could not find account with address "${avatar}" on chain "${chainId}"`,
          )

          if (prefixedAddress in result) {
            return {
              ...result,

              [avatar]: {
                account,
                roles: [...result[prefixedAddress].roles, ...roles],
              },
            }
          }

          return {
            ...result,
            [prefixedAddress]: { account, roles },
          }
        }, {})

      return {
        rolesByAccount,
      }
    },
    {
      ensureSignedIn: true,
      async hasAccess({ params: { workspaceId }, tenant }) {
        invariantResponse(isUUID(workspaceId), '"workspaceId" is no UUID')

        const workspace = await getWorkspace(dbClient(), workspaceId)

        return workspace.tenantId === tenant.id
      },
    },
  )

const OnChainRoles = ({
  loaderData: { rolesByAccount },
}: Route.ComponentProps) => {
  return Object.entries(rolesByAccount).map(([, { account, roles }]) => (
    <Card key={account.id} title={account.label}>
      <span className="mt-1.5 flex items-center gap-8 text-xs text-zinc-500 dark:text-zinc-300">
        <Chain chainId={account.chainId} />
        <Address size="small" shorten>
          {account.address}
        </Address>
      </span>

      <Table bleed dense className="[--gutter:--spacing(4)]">
        <TableHead>
          <TableRow>
            <TableHeader className="w-1/3">Label</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.key}>
              <TableCell>{decodeRoleKey(role.key)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  ))
}

export default OnChainRoles
