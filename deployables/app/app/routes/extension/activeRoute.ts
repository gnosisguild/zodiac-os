import { authorizedLoader } from '@/auth-server'
import { invariantResponse } from '@epic-web/invariant'
import {
  dbClient,
  findActiveRoute,
  getAccount,
  toExecutionRoute,
} from '@zodiac/db'
import { isUUID } from '@zodiac/schema'
import type { Route } from './+types/activeRoute'

export const loader = (args: Route.LoaderArgs) =>
  authorizedLoader(
    args,
    async ({
      params: { accountId },
      context: {
        auth: { user, tenant },
      },
    }) => {
      if (user == null) {
        return null
      }

      invariantResponse(isUUID(accountId), '"accountId" is not a UUID')

      const activeRoute = await findActiveRoute(
        dbClient(),
        tenant,
        user,
        accountId,
      )

      if (activeRoute == null) {
        return null
      }

      const { account, route } = activeRoute

      return toExecutionRoute({
        wallet: route.wallet,
        account: account,
        route,
      })
    },
    {
      async hasAccess({ tenant, params: { accountId } }) {
        if (tenant == null) {
          return true
        }

        invariantResponse(isUUID(accountId), '"accountId" is not a UUID')

        const account = await getAccount(dbClient(), accountId)

        return account.tenantId === tenant.id
      },
    },
  )
