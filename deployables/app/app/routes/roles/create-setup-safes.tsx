import { authorizedLoader } from '@/auth-server'
import { Chain } from '@/routes-ui'
import { invariant, invariantResponse } from '@epic-web/invariant'
import { ChainId, ZERO_ADDRESS } from '@zodiac/chains'
import {
  dbClient,
  getActivatedAccounts,
  getDefaultWallets,
  getRole,
  getSetupSafeAddresses,
  getWalletLabels,
} from '@zodiac/db'
import { Wallet } from '@zodiac/db/schema'
import { HexAddress, isUUID } from '@zodiac/schema'
import {
  Error,
  Labeled,
  Modal,
  SecondaryButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowActions,
} from '@zodiac/ui'
import {
  Address,
  ConnectWalletButton,
  useAccount,
  useSendTransaction,
} from '@zodiac/web3'
import { href, Link, useNavigate } from 'react-router'
import {
  MetaTransactionRequest,
  planApplyAccounts,
  prefixAddress,
  resolveAccounts,
} from 'ser-kit'
import { Route } from './+types/create-setup-safes'
import { createUserSafes, groupByFrom } from './planRoleUpdate'

export const loader = (args: Route.LoaderArgs) =>
  authorizedLoader(
    args,
    async ({
      params: { roleId },
      context: {
        auth: { user },
      },
    }) => {
      invariantResponse(isUUID(roleId), '"roleId" is not a UUID')

      const accounts = await getActivatedAccounts(dbClient(), { roleId })
      const chainIds = Array.from(
        new Set(accounts.map(({ chainId }) => chainId)),
      )

      const setupSafes = await getSetupSafeAddresses(dbClient(), user, chainIds)

      const missingChainIds = chainIds.filter(
        (chainId) => !setupSafes.some((safe) => safe.chainId === chainId),
      )

      try {
        const newSafes = await createUserSafes(user, missingChainIds)
        const accounts = await resolveAccounts({
          current: [],
          updatesOrCreations: [...newSafes],
          accountForSetup: ZERO_ADDRESS,
        })
        const executionPlan = await planApplyAccounts({
          ...accounts,
          accountForSetup: ZERO_ADDRESS,
        })

        const actions = groupByFrom(executionPlan, ZERO_ADDRESS)

        invariantResponse(actions.length === 1, 'Too many actions')

        const [{ steps }] = actions

        return {
          stepsByAccount: steps,
          defaultWallets: await getDefaultWallets(dbClient(), user.id),
          walletLabels: await getWalletLabels(dbClient(), user.id),
        }
      } catch {
        return { missingChainIds }
      }
    },
    {
      ensureSignedIn: true,
      async hasAccess({ tenant, params: { roleId, workspaceId } }) {
        invariantResponse(isUUID(roleId), '"roleId" is not a UUID')

        const role = await getRole(dbClient(), roleId)

        return role.tenantId === tenant.id && role.workspaceId === workspaceId
      },
    },
  )

const CreateSetupSafes = ({
  loaderData: { missingChainIds, stepsByAccount, defaultWallets, walletLabels },
  params: { workspaceId },
}: Route.ComponentProps) => {
  const navigate = useNavigate()

  return (
    <Modal
      open
      onClose={() =>
        navigate(href('/workspace/:workspaceId/roles/managed', { workspaceId }))
      }
      size="3xl"
      title="Create setup safes"
      description="We'll create a personal safe that you will control to perform all actions in this deployment. It will be owned by the default wallet you configured for each chain."
    >
      {missingChainIds != null && (
        <Error title="Missing default wallet">
          We cannot create all safes required to set up this role because you
          have not configured a default wallet for all affected chains. Go to
          your{' '}
          <Link to={href('/workspace/:workspaceId/profile', { workspaceId })}>
            profile
          </Link>{' '}
          and set a default wallet for these chains:
          <ul>
            {missingChainIds.map((chainId) => (
              <li key={chainId}>
                <Chain chainId={chainId} />
              </li>
            ))}
          </ul>
        </Error>
      )}

      {stepsByAccount && (
        <div className="flex flex-col gap-8">
          <Labeled label="Connected wallet">
            <div className="flex">
              <ConnectWalletButton addressLabels={walletLabels}>
                Connect your wallet to continue
              </ConnectWalletButton>
            </div>
          </Labeled>

          <Table>
            <TableHead>
              <TableRow withActions>
                <TableHeader>Safe</TableHeader>
                <TableHeader>Chain</TableHeader>
                <TableHeader>Owner</TableHeader>
              </TableRow>
            </TableHead>

            <TableBody>
              {stepsByAccount.map(({ account, steps }) => {
                const wallet = defaultWallets[account.chain]

                invariant(
                  wallet != null,
                  'Default wallet used to create a safe but not present',
                )

                invariant(
                  steps.length === 1,
                  'Deploying a safe should always happen in one step',
                )

                const [{ transaction }] = steps

                return (
                  <DeploySafe
                    key={prefixAddress(account.chain, account.address)}
                    transaction={transaction}
                    wallet={wallet}
                    address={account.address}
                    chainId={account.chain}
                  />
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal.Actions>
        <Modal.CloseAction>Cancel</Modal.CloseAction>
      </Modal.Actions>
    </Modal>
  )
}

export default CreateSetupSafes

type DeploySafeProps = {
  address: HexAddress
  chainId: ChainId
  transaction: MetaTransactionRequest
  wallet: Wallet
}

const DeploySafe = ({
  transaction,
  wallet,
  address,
  chainId,
}: DeploySafeProps) => {
  invariant(
    wallet != null,
    'Default wallet used to create a safe but not present',
  )

  const account = useAccount()
  const { sendTransaction, isPending } = useSendTransaction()

  return (
    <TableRow>
      <TableCell>
        <Address shorten size="small">
          {address}
        </Address>
      </TableCell>
      <TableCell>
        <Chain chainId={chainId} />
      </TableCell>
      <TableCell>
        <Address shorten label={wallet.label}>
          {wallet.address}
        </Address>
      </TableCell>
      <TableCell>
        <TableRowActions autoHide={false}>
          <SecondaryButton
            size="small"
            busy={isPending}
            disabled={
              account.isDisconnected ||
              account.address?.toLowerCase() !== wallet.address ||
              account.chainId !== chainId
            }
            onClick={() => sendTransaction(transaction)}
          >
            Setup safe
          </SecondaryButton>
        </TableRowActions>
      </TableCell>
    </TableRow>
  )
}
