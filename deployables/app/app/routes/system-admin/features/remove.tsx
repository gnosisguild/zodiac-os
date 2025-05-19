import { authorizedAction, authorizedLoader } from '@/auth-server'
import { invariantResponse } from '@epic-web/invariant'
import { dbClient, deleteFeature, getFeature } from '@zodiac/db'
import { useIsPending } from '@zodiac/hooks'
import { isUUID } from '@zodiac/schema'
import { GhostButton, InlineForm, Modal, PrimaryButton } from '@zodiac/ui'
import { href, redirect, useNavigate } from 'react-router'
import type { Route } from './+types/remove'

export const loader = (args: Route.LoaderArgs) =>
  authorizedLoader(
    args,
    async ({ params: { featureId } }) => {
      invariantResponse(isUUID(featureId), 'Feature id is not a UUID')

      return { feature: await getFeature(dbClient(), featureId) }
    },
    {
      ensureSignedIn: true,
      hasAccess({ isSystemAdmin }) {
        return isSystemAdmin
      },
    },
  )

export const action = (args: Route.ActionArgs) =>
  authorizedAction(
    args,
    async ({ params: { featureId } }) => {
      invariantResponse(isUUID(featureId), 'Feature id is not a UUID')

      await deleteFeature(dbClient(), featureId)

      return redirect(href('/system-admin/features'))
    },
    {
      ensureSignedIn: true,
      hasAccess({ isSystemAdmin }) {
        return isSystemAdmin
      },
    },
  )

const RemoveFeature = ({ loaderData: { feature } }: Route.ComponentProps) => {
  const navigate = useNavigate()

  return (
    <Modal
      open
      title="Remove feature"
      onClose={() => navigate(href('/system-admin/features'))}
    >
      Are you sure that you want to remove the feature{' '}
      <strong>"{feature.name}"</strong>?
      <Modal.Actions>
        <InlineForm>
          <PrimaryButton
            submit
            intent={Intent.Delete}
            busy={useIsPending(Intent.Delete)}
          >
            Remove
          </PrimaryButton>
        </InlineForm>

        <GhostButton onClick={() => navigate(href('/system-admin/features'))}>
          Cancel
        </GhostButton>
      </Modal.Actions>
    </Modal>
  )
}

export default RemoveFeature

enum Intent {
  Delete = 'Delete',
}
