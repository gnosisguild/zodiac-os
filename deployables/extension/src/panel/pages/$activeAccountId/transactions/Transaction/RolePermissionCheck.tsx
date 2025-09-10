import {
  Translate,
  useApplicableTranslation,
  usePermissionCheck,
} from '@/transactions'
import { GhostLinkButton, Popover, Spinner, Tag } from '@zodiac/ui'
import {
  Check,
  SquareArrowOutUpRight,
  TriangleAlert,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { RecordPermissions, useRolePageLink } from './RecordPermissions'

type Props = {
  transactionId: string
  mini?: boolean
}

export const RolePermissionCheck = ({ transactionId, mini = false }: Props) => {
  const permissionCheck = usePermissionCheck(transactionId)
  const translation = useApplicableTranslation(transactionId)
  const rolePageLink = useRolePageLink()

  if (mini) {
    if (permissionCheck.isPending) {
      return <Tag head={<Spinner />} color="blue" />
    }

    if (permissionCheck.isSkipped) {
      return <Tag head={<UserRound size={16} />} color="gray" />
    }

    if (permissionCheck.error == null) {
      return <Tag head={<UsersRound size={16} />} color="green" />
    }

    return <Tag head={<UsersRound size={16} />} color="red" />
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        Role permissions
        <div className="flex gap-2">
          {permissionCheck.isPending ? (
            <Tag head={<Spinner />} color="blue">
              Checking...
            </Tag>
          ) : permissionCheck.isSkipped ? (
            <Tag color="gray">Skipped</Tag>
          ) : permissionCheck.error != null ? (
            <Popover
              popover={<span className="text-sm">{permissionCheck.error}</span>}
            >
              <Tag head={<TriangleAlert size={16} />} color="red">
                Error
              </Tag>
            </Popover>
          ) : (
            <Tag head={<Check size={16} />} color="green">
              Allowed
            </Tag>
          )}

          {rolePageLink && (
            <GhostLinkButton
              openInNewWindow
              iconOnly
              size="small"
              icon={SquareArrowOutUpRight}
              to={rolePageLink}
            >
              View role permissions
            </GhostLinkButton>
          )}
        </div>
      </div>

      {permissionCheck.error != null && (
        <>
          <Translate transactionId={transactionId} />

          {translation == null && (
            <RecordPermissions transactionId={transactionId} />
          )}
        </>
      )}
    </div>
  )
}
