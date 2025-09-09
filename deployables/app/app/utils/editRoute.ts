import { encode, type ExecutionRoute } from '@zodiac/schema'
import { UUID } from 'node:crypto'
import { href, redirect } from 'react-router'

export const editRoute = (route: ExecutionRoute, workspaceId: UUID | null) =>
  redirect(
    workspaceId == null
      ? href('/offline/accounts/:accountId/:data', {
          data: encode(route),
          accountId: route.id,
        })
      : href('/workspace/:workspaceId/local-accounts/:accountId/:data', {
          workspaceId,
          data: encode(route),
          accountId: route.id,
        }),
  )
