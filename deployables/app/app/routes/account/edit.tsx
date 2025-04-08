import { Page } from '@/components'
import {
  activateRoute,
  createRoute,
  dbClient,
  findActiveRoute,
  getAccount,
  getWalletByAddress,
  getWallets,
  removeActiveRoute,
  updateAccount,
} from '@/db'
import { useIsPending } from '@/hooks'
import { ChainSelect } from '@/routes-ui'
import { authKitAction, authKitLoader } from '@/workOS/server'
import { getOptionalHexString, getString } from '@zodiac/form-data'
import {
  AddressInput,
  AddressSelect,
  Form,
  GhostLinkButton,
  PrimaryButton,
  TextInput,
} from '@zodiac/ui'
import { href } from 'react-router'
import { prefixAddress, queryInitiators } from 'ser-kit'
import type { Route } from './+types/edit'

export const loader = (args: Route.LoaderArgs) =>
  authKitLoader(
    args,
    async ({
      params: { accountId },
      context: {
        auth: { user },
      },
    }) => {
      const account = await getAccount(dbClient(), accountId)
      const wallets = await getWallets(dbClient(), user.id)
      const initiators = await queryInitiators(
        prefixAddress(account.chainId, account.address),
      )
      const activeRoute = await findActiveRoute(dbClient(), user, account.id)

      return {
        label: account.label || '',
        initiator:
          activeRoute == null ? undefined : activeRoute.route.wallet.address,
        initiators: wallets.filter((wallet) =>
          initiators.includes(wallet.address),
        ),
        account: account.address,
        chainId: account.chainId,
      }
    },
    {
      ensureSignedIn: true,
      async hasAccess({ user, params: { accountId } }) {
        const account = await getAccount(dbClient(), accountId)

        return account.createdById === user.id
      },
    },
  )

export const action = (args: Route.ActionArgs) =>
  authKitAction(
    args,
    async ({
      request,
      params: { accountId },
      context: {
        auth: { user },
      },
    }) => {
      const data = await request.formData()

      await dbClient().transaction(async (tx) => {
        const initiator = getOptionalHexString(data, 'initiator')

        const activeRoute = await findActiveRoute(tx, user, accountId)

        if (initiator != null) {
          if (
            activeRoute == null ||
            activeRoute.route.wallet.address !== initiator
          ) {
            const wallet = await getWalletByAddress(tx, user, initiator)
            const account = await getAccount(tx, accountId)

            const route = await createRoute(tx, wallet, account)

            if (activeRoute != null) {
              await removeActiveRoute(tx, user, accountId)
            }

            await activateRoute(tx, user, route)
          }
        } else {
          await removeActiveRoute(tx, user, accountId)
        }

        await updateAccount(tx, accountId, {
          label: getString(data, 'label'),
        })
      })

      return null
    },
    {
      ensureSignedIn: true,
      async hasAccess({ user, params: { accountId } }) {
        const account = await getAccount(dbClient(), accountId)

        return account.createdById === user.id
      },
    },
  )

const EditAccount = ({
  loaderData: { label, initiators, initiator, account, chainId },
}: Route.ComponentProps) => {
  return (
    <Page>
      <Page.Header>Edit Account</Page.Header>
      <Page.Main>
        <Form>
          <TextInput label="Label" name="label" defaultValue={label} />

          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-2">
              <ChainSelect disabled value={chainId} />
            </div>

            <div className="col-span-4">
              <AddressInput disabled label="Safe Account" value={account} />
            </div>
          </div>

          <AddressSelect
            isClearable
            isMulti={false}
            label="Pilot Signer"
            name="initiator"
            clearLabel="Remove Pilot Signer"
            placeholder="Select a wallet form the list"
            defaultValue={initiator}
            options={initiators.map(({ address, label }) => ({
              address,
              label,
            }))}
          />

          <Form.Actions>
            <PrimaryButton
              submit
              intent={Intent.Save}
              busy={useIsPending(Intent.Save)}
            >
              Save
            </PrimaryButton>

            <GhostLinkButton to={href('/edit')}>Cancel</GhostLinkButton>
          </Form.Actions>
        </Form>
      </Page.Main>
    </Page>
  )
}

export default EditAccount

enum Intent {
  Save = 'Save',
}
