import { authorizedLoader } from '@/auth-server'
import { Page } from '@/components'
import { dbClient, getWalletLabels } from '@zodiac/db'
import { ConnectWalletButton } from '@zodiac/web3'
import { Outlet } from 'react-router'
import { Route } from './+types/layout'

export const loader = (args: Route.LoaderArgs) =>
  authorizedLoader(
    args,
    async ({
      context: {
        auth: { user },
      },
    }) => ({
      addressLabels:
        user == null ? {} : await getWalletLabels(dbClient(), user.id),
    }),
  )

const SubmitLayout = ({
  loaderData: { addressLabels },
}: Route.ComponentProps) => (
  <Page fullWidth>
    <Page.Header
      action={
        <ConnectWalletButton addressLabels={addressLabels}>
          Connect Pilot Signer
        </ConnectWalletButton>
      }
    >
      Sign Transaction Bundle
    </Page.Header>

    <button
      onClick={() => {
        console.log('Button clicked!')
      }}
    >
      Test
    </button>

    <Page.Main>
      <Outlet />
    </Page.Main>
  </Page>
)

export default SubmitLayout
