import { authorizedLoader } from '@/auth-server'
import { Navigation, PilotStatus, ProvidePilotStatus } from '@/components'
import { getSignInUrl } from '@workos-inc/authkit-react-router'
import {
  Divider,
  GhostLinkButton,
  PrimaryLinkButton,
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarLayout,
  ZodiacOsLogo,
} from '@zodiac/ui'
import {
  ArrowRightLeft,
  ArrowUpFromLine,
  BookmarkX,
  Landmark,
  MessageCircle,
  Signature,
} from 'lucide-react'
import { href, Outlet } from 'react-router'
import type { Route } from './+types/offline-layout'

export const loader = async (args: Route.LoaderArgs) =>
  authorizedLoader(args, async () => {
    return {
      signInUrl: await getSignInUrl(),
    }
  })

const OfflineLayout = ({ loaderData: { signInUrl } }: Route.ComponentProps) => {
  return (
    <ProvidePilotStatus>
      <SidebarLayout
        navbar={null}
        sidebar={
          <Sidebar>
            <SidebarHeader>
              <div className="my-8 flex items-center justify-center gap-2">
                <ZodiacOsLogo className="h-6" />
              </div>
            </SidebarHeader>

            <SidebarBody>
              <Navigation>
                <Navigation.Section title="Tokens">
                  <Navigation.Link
                    reloadDocument={(location) =>
                      !location.pathname.startsWith('/tokens')
                    }
                    to={href('/offline/tokens/send/:chain?/:token?')}
                    icon={ArrowUpFromLine}
                  >
                    Send Tokens
                  </Navigation.Link>

                  <Navigation.Link
                    reloadDocument={(location) =>
                      !location.pathname.startsWith('/tokens')
                    }
                    to={href('/offline/tokens/balances')}
                    icon={Landmark}
                  >
                    Balances
                  </Navigation.Link>

                  <Navigation.Link
                    reloadDocument={(location) =>
                      !location.pathname.startsWith('/tokens')
                    }
                    to={href('/offline/tokens/swap')}
                    icon={ArrowRightLeft}
                  >
                    Swap
                  </Navigation.Link>
                </Navigation.Section>

                <Navigation.Section title="Safe Accounts">
                  <Navigation.Link
                    to={href('/offline/accounts')}
                    icon={BookmarkX}
                    reloadDocument={(location) =>
                      location.pathname.startsWith('/tokens')
                    }
                  >
                    Local Safe Accounts
                  </Navigation.Link>
                </Navigation.Section>

                <Navigation.Section title="Transactions">
                  <Navigation.Link
                    to={href('/offline/submit')}
                    icon={Signature}
                  >
                    Sign a transaction
                  </Navigation.Link>
                </Navigation.Section>

                <Navigation.Section title="Agent">
                  <Navigation.Link
                    to={href('/offline/agent')}
                    icon={MessageCircle}
                  >
                    Chat
                  </Navigation.Link>
                </Navigation.Section>
              </Navigation>
            </SidebarBody>

            <SidebarFooter>
              <div className="py-4">
                <PilotStatus />
              </div>

              <div className="flex flex-col gap-4">
                <Divider />

                <div className="flex gap-2">
                  <GhostLinkButton
                    fluid
                    to={href('/offline/sign-up')}
                    size="small"
                  >
                    Sign Up
                  </GhostLinkButton>

                  <PrimaryLinkButton fluid to={signInUrl} size="small">
                    Sign In
                  </PrimaryLinkButton>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>
        }
      >
        <Outlet />
      </SidebarLayout>
    </ProvidePilotStatus>
  )
}

export default OfflineLayout
