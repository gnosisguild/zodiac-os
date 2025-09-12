import { Page } from '@/components'
import { ConnectWalletButton } from '@zodiac/web3'
import { Outlet } from 'react-router'

const GenericDeployment = () => {
  return (
    <Page>
      <Page.Header
        action={
          <ConnectWalletButton addressLabels={{}}>
            Connect signer wallet
          </ConnectWalletButton>
        }
      >
        Deploy account updates
      </Page.Header>

      <Page.Main>
        <Outlet />
      </Page.Main>
    </Page>
  )
}

export default GenericDeployment
