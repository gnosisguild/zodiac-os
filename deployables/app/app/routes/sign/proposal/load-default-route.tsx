import { authorizedLoader } from '@/auth-server'
import { invariantResponse } from '@epic-web/invariant'
import {
  dbClient,
  findDefaultRoute,
  getProposedTransaction,
  getRoutes,
} from '@zodiac/db'
import { isUUID } from '@zodiac/schema'
import { Error } from '@zodiac/ui'
import { href, redirect } from 'react-router'
import type { Route } from './+types/load-default-route'

export const loader = (args: Route.LoaderArgs) =>
  authorizedLoader(
    args,
    async ({
      params: { proposalId, workspaceId },
      context: {
        auth: { tenant, user },
      },
    }) => {
      invariantResponse(isUUID(proposalId), '"proposalId" is not a UUID')

      const proposal = await getProposedTransaction(dbClient(), proposalId)

      if (proposal.routeId != null) {
        return redirect(
          href('/workspace/:workspaceId/submit/proposal/:proposalId/:routeId', {
            workspaceId,
            proposalId,
            routeId: proposal.routeId,
          }),
        )
      }

      const defaultRoute = await findDefaultRoute(
        dbClient(),
        tenant,
        user,
        proposal.accountId,
      )

      if (defaultRoute != null) {
        return redirect(
          href('/workspace/:workspaceId/submit/proposal/:proposalId/:routeId', {
            proposalId,
            workspaceId,
            routeId: defaultRoute.routeId,
          }),
        )
      }

      const [route] = await getRoutes(dbClient(), tenant.id, {
        userId: user.id,
        accountId: proposal.accountId,
      })

      if (route != null) {
        return redirect(
          href('/workspace/:workspaceId/submit/proposal/:proposalId/:routeId', {
            proposalId,
            workspaceId,
            routeId: route.id,
          }),
        )
      }

      return null
    },
    {
      ensureSignedIn: true,
      async hasAccess({ params: { proposalId }, tenant }) {
        invariantResponse(isUUID(proposalId), '"proposalId" is not a UUID')

        const proposal = await getProposedTransaction(dbClient(), proposalId)

        return proposal.tenantId === tenant.id
      },
    },
  )

const MissingConfiguration = () => {
  return (
    <Error title="Incomplete account configuration">
      This transaction cannot be signed because the configuration for this
      account is incomplete.
    </Error>
  )
}

export default MissingConfiguration
