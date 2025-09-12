import { Page } from '@/components'
import { Outlet } from 'react-router'

const ChatLayout = () => {
  return (
    <Page>
      <Page.Header>Chat</Page.Header>
      <Page.Main>
        <Outlet />
      </Page.Main>
    </Page>
  )
}

export default ChatLayout
