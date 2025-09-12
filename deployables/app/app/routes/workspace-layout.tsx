import { authorizedAction, authorizedLoader } from '@/auth-server'
import { Navigation, PilotStatus, ProvidePilotStatus } from '@/components'
import { ProvideWorkspace } from '@/workspaces'
import { invariantResponse } from '@epic-web/invariant'
import {
  dbClient,
  getLastAccountsUpdateTime,
  getLastRoutesUpdateTime,
  getWorkspace,
  getWorkspaces,
} from '@zodiac/db'
import { getAdminOrganizationId } from '@zodiac/env'
import { getUUID } from '@zodiac/form-data'
import { isUUID } from '@zodiac/schema'
import {
  Divider,
  Feature,
  InlineForm,
  Select,
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
  Bookmark,
  BookmarkX,
  Cog,
  Drama,
  Landmark,
  MessageCircle,
  Shield,
  Signature,
  User,
} from 'lucide-react'
import { href, NavLink, Outlet, redirect } from 'react-router'
import type { Route } from './+types/workspace-layout'

export const loader = async (args: Route.LoaderArgs) =>
  authorizedLoader(
    args,
    async ({
      context: {
        auth: { tenant, workOsOrganization, user, role },
      },
      params: { workspaceId },
    }) => {
      invariantResponse(isUUID(workspaceId), '"workspaceId" is not a UUID')

      const db = dbClient()

      const [lastAccountsUpdate, lastRoutesUpdate, workspace, workspaces] =
        await Promise.all([
          getLastAccountsUpdateTime(db, tenant.id),
          getLastRoutesUpdateTime(db, tenant.id),
          getWorkspace(db, workspaceId),
          getWorkspaces(db, { tenantId: tenant.id }),
        ])

      return {
        user,
        role,
        workspace,
        workspaces,
        isSystemAdmin: getAdminOrganizationId() === workOsOrganization.id,
        lastAccountsUpdate,
        lastRoutesUpdate,
      }
    },
    {
      ensureSignedIn: true,
      async hasAccess({ tenant, params: { workspaceId } }) {
        invariantResponse(isUUID(workspaceId), '"workspaceId" is not a UUID')

        const workspace = await getWorkspace(dbClient(), workspaceId)

        return workspace.tenantId === tenant.id
      },
    },
  )

export const action = (args: Route.ActionArgs) =>
  authorizedAction(
    args,
    async ({ request }) => {
      const data = await request.formData()

      return redirect(
        href('/workspace/:workspaceId', {
          workspaceId: getUUID(data, 'workspaceId'),
        }),
      )
    },
    {
      ensureSignedIn: true,
      async hasAccess({ request, tenant }) {
        const data = await request.formData()

        const workspace = await getWorkspace(
          dbClient(),
          getUUID(data, 'workspaceId'),
        )

        return workspace.tenantId === tenant.id
      },
    },
  )

const PageLayout = ({
  loaderData: {
    user,
    role,
    isSystemAdmin,
    lastAccountsUpdate,
    lastRoutesUpdate,
    workspace,
    workspaces,
  },
  params: { workspaceId },
}: Route.ComponentProps) => {
  return (
    <ProvideWorkspace workspace={workspace}>
      <ProvidePilotStatus
        lastAccountsUpdate={lastAccountsUpdate}
        lastRoutesUpdate={lastRoutesUpdate}
      >
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
                {workspaces.length > 1 && (
                  <InlineForm className="mb-8">
                    {({ submit }) => (
                      <Select
                        label="Workspace"
                        name="workspaceId"
                        defaultValue={workspace.id}
                        options={workspaces.map((workspace) => ({
                          value: workspace.id,
                          label: workspace.label,
                        }))}
                        onChange={() => submit()}
                      />
                    )}
                  </InlineForm>
                )}

                <Navigation>
                  <Navigation.Section title="Tokens">
                    <Navigation.Link
                      reloadDocument={(location) =>
                        !location.pathname.startsWith(
                          `/workspace/${workspaceId}/tokens`,
                        )
                      }
                      to={href(
                        '/workspace/:workspaceId/tokens/send/:chain?/:token?',
                        { workspaceId },
                      )}
                      icon={ArrowUpFromLine}
                    >
                      Send Tokens
                    </Navigation.Link>

                    <Navigation.Link
                      reloadDocument={(location) =>
                        !location.pathname.startsWith(
                          `/workspace/${workspaceId}/tokens`,
                        )
                      }
                      to={href('/workspace/:workspaceId/tokens/balances', {
                        workspaceId,
                      })}
                      icon={Landmark}
                    >
                      Balances
                    </Navigation.Link>

                    <Navigation.Link
                      reloadDocument={(location) =>
                        !location.pathname.startsWith(
                          `/workspace/${workspaceId}/tokens`,
                        )
                      }
                      to={href('/workspace/:workspaceId/tokens/swap', {
                        workspaceId,
                      })}
                      icon={ArrowRightLeft}
                    >
                      Swap
                    </Navigation.Link>
                  </Navigation.Section>

                  <Navigation.Section title="Safe Accounts">
                    <Navigation.Link
                      to={href('/workspace/:workspaceId/accounts', {
                        workspaceId,
                      })}
                      icon={Bookmark}
                      reloadDocument={(location) =>
                        location.pathname.startsWith(
                          `/workspace/${workspaceId}/tokens`,
                        )
                      }
                    >
                      Safe Accounts
                    </Navigation.Link>

                    <Navigation.Link
                      to={href('/workspace/:workspaceId/local-accounts', {
                        workspaceId,
                      })}
                      icon={BookmarkX}
                      reloadDocument={(location) =>
                        location.pathname.startsWith(
                          `/workspace/${workspaceId}/tokens`,
                        )
                      }
                    >
                      Local Safe Accounts
                    </Navigation.Link>

                    <Feature feature="roles">
                      <Navigation.Link
                        to={href('/workspace/:workspaceId/roles', {
                          workspaceId,
                        })}
                        icon={Drama}
                      >
                        Roles
                      </Navigation.Link>
                    </Feature>
                  </Navigation.Section>

                  <Navigation.Section title="Transactions">
                    <Navigation.Link
                      to={href('/workspace/:workspaceId/submit', {
                        workspaceId,
                      })}
                      icon={Signature}
                    >
                      Sign a transaction
                    </Navigation.Link>
                  </Navigation.Section>

                  <Navigation.Section title="Agent">
                    <Navigation.Link
                      to={href('/workspace/:workspaceId/agent', {
                        workspaceId,
                      })}
                      icon={MessageCircle}
                    >
                      Chat
                    </Navigation.Link>
                  </Navigation.Section>

                  {role === 'admin' && (
                    <Navigation.Section title="Organization">
                      <Navigation.Link
                        to={href('/workspace/:workspaceId/admin', {
                          workspaceId,
                        })}
                        icon={Cog}
                      >
                        Settings
                      </Navigation.Link>
                    </Navigation.Section>
                  )}

                  {isSystemAdmin && (
                    <Navigation.Section title="System">
                      <Navigation.Link to={href('/system-admin')} icon={Shield}>
                        System admin
                      </Navigation.Link>
                    </Navigation.Section>
                  )}
                </Navigation>
              </SidebarBody>

              <SidebarFooter>
                <div className="py-4">
                  <PilotStatus />
                </div>

                <div className="flex flex-col gap-4">
                  <Divider />

                  <NavLink
                    to={href('/workspace/:workspaceId/profile', {
                      workspaceId,
                    })}
                    className="group flex items-center gap-x-2 text-sm/6 font-semibold text-zinc-950 dark:text-white"
                  >
                    <div className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-white">
                      <User size={16} />
                    </div>

                    <span className="sr-only">Your profile</span>
                    <span
                      aria-hidden="true"
                      className="flex-1 rounded px-4 py-2 group-hover:bg-zinc-950/5 group-hover:dark:bg-white/5"
                    >
                      {user.fullName}
                    </span>
                  </NavLink>
                </div>
              </SidebarFooter>
            </Sidebar>
          }
        >
          <Outlet />
        </SidebarLayout>
      </ProvidePilotStatus>
    </ProvideWorkspace>
  )
}

export default PageLayout
