import { href, redirect } from 'react-router'
import { Route } from './+types/index-redirect'

export const loader = ({ params: { workspaceId } }: Route.LoaderArgs) =>
  redirect(href('/workspace/:workspaceId/roles/managed', { workspaceId }))
