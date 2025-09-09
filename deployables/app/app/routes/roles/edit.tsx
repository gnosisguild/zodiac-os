import { authorizedAction, authorizedLoader } from '@/auth-server'
import { Page } from '@/components'
import { invariantResponse } from '@epic-web/invariant'
import { chainName } from '@zodiac/chains'
import {
  dbClient,
  getAccounts,
  getActivatedAccounts,
  getDefaultWallets,
  getRole,
  getRoleActions,
  getRoleMembers,
  getUsers,
  setActiveAccounts,
  setRoleMembers,
  updateRole,
} from '@zodiac/db'
import { getString, getUUIDList } from '@zodiac/form-data'
import { useAfterSubmit, useIsPending } from '@zodiac/hooks'
import { isUUID } from '@zodiac/schema'
import {
  Form,
  FormLayout,
  GhostLinkButton,
  Info,
  MultiSelect,
  PrimaryButton,
  SecondaryLinkButton,
  successToast,
} from '@zodiac/ui'
import { UUID } from 'node:crypto'
import { href, Outlet } from 'react-router'
import { Route } from './+types/edit'
import { AccountSelect } from './AccountSelect'
import { Action } from './Action'
import { Intent } from './intents'
import { RoleLabelInput } from './RoleLabelInput'

export const loader = (args: Route.LoaderArgs) =>
  authorizedLoader(
    args,
    async ({
      params: { roleId, workspaceId },
      context: {
        auth: { tenant },
      },
    }) => {
      invariantResponse(isUUID(roleId), '"roleId" is not a UUID')
      invariantResponse(isUUID(workspaceId), '"workspaceId" is not a UUID')

      const [members, activeAccounts, role, users, accounts, actions] =
        await Promise.all([
          getRoleMembers(dbClient(), { roleId }),
          getActivatedAccounts(dbClient(), { roleId }),
          getRole(dbClient(), roleId),
          getUsers(dbClient(), { tenantId: tenant.id }),
          getAccounts(dbClient(), { workspaceId }),
          getRoleActions(dbClient(), roleId),
        ])

      const activeChains = Array.from(
        new Set(activeAccounts.map((account) => account.chainId)),
      )
      const missingDefaultWallets: Record<UUID, string[]> = {}

      for (const member of members) {
        const defaultWallets = await getDefaultWallets(dbClient(), member.id)

        missingDefaultWallets[member.id] = activeChains.reduce<string[]>(
          (result, chainId) => {
            if (defaultWallets[chainId] == null) {
              return [...result, chainName(chainId)]
            }

            return result
          },
          [],
        )
      }

      return {
        role,
        users,
        accounts,
        activeAccountIds: activeAccounts.map(
          (activeAccount) => activeAccount.id,
        ),
        memberIds: members.map((member) => member.id),
        actions,
        missingDefaultWallets,
      }
    },
    {
      ensureSignedIn: true,
      async hasAccess({ params: { roleId, workspaceId }, tenant }) {
        invariantResponse(isUUID(roleId), '"roleId" is not a UUID')

        const role = await getRole(dbClient(), roleId)

        return role.tenantId === tenant.id && role.workspaceId === workspaceId
      },
    },
  )

export const action = (args: Route.ActionArgs) =>
  authorizedAction(
    args,
    async ({ params: { roleId }, request }) => {
      invariantResponse(isUUID(roleId), '"roleId" is not a UUID')

      const data = await request.formData()

      await dbClient().transaction(async (tx) => {
        const role = await getRole(tx, roleId)

        const label = getString(data, 'label')

        if (label !== role.label) {
          await updateRole(tx, roleId, { label: getString(data, 'label') })
        }

        await setRoleMembers(tx, role, getUUIDList(data, 'members'))
        await setActiveAccounts(tx, role, getUUIDList(data, 'accounts'))
      })

      return null
    },
    {
      ensureSignedIn: true,
      async hasAccess({ params: { roleId, workspaceId }, tenant }) {
        invariantResponse(isUUID(roleId), '"roleId" is not a UUID')

        const role = await getRole(dbClient(), roleId)

        return role.tenantId === tenant.id && role.workspaceId === workspaceId
      },
    },
  )

const EditRole = ({
  loaderData: {
    role,
    users,
    memberIds,
    accounts,
    activeAccountIds,
    actions,
    missingDefaultWallets,
  },
  params: { workspaceId, roleId },
}: Route.ComponentProps) => {
  useAfterSubmit(Intent.Save, () =>
    successToast({
      title: 'Role saved',
      message: 'Your changes to this role have been saved',
    }),
  )

  return (
    <Page>
      <Page.Header>Edit role</Page.Header>
      <Page.Main>
        <Form>
          <Form.Section
            title="Base configuration"
            description="Defines the basics for this role. Who should it be enabled for and what accounts are affected."
          >
            <RoleLabelInput
              required
              label="Label"
              name="label"
              defaultValue={role.label}
              keyValue={role.key}
            />

            <MultiSelect
              label="Members"
              name="members"
              placeholder="Select who should be able to assume this role"
              options={users.map((user) => ({
                label: user.fullName,
                value: user.id,
              }))}
              defaultValue={memberIds}
            >
              {({ data: { label, value } }) => (
                <div className="flex flex-col gap-1">
                  {label}
                  {value in missingDefaultWallets &&
                    missingDefaultWallets[value].length > 0 && (
                      <span
                        role="alert"
                        className="text-xs text-red-600 dark:text-red-400"
                        aria-label="Default wallet missing"
                      >
                        User has no default wallet set for:{' '}
                        <span className="font-semibold dark:font-normal dark:text-red-300">
                          {missingDefaultWallets[value].join(', ')}
                        </span>
                      </span>
                    )}
                </div>
              )}
            </MultiSelect>

            <AccountSelect
              accounts={accounts}
              defaultValue={activeAccountIds}
            />

            <Form.Actions>
              <PrimaryButton
                submit
                intent={Intent.Save}
                busy={useIsPending(Intent.Save)}
              >
                Save
              </PrimaryButton>

              <GhostLinkButton
                to={href('/workspace/:workspaceId/roles', { workspaceId })}
              >
                Cancel
              </GhostLinkButton>
            </Form.Actions>
          </Form.Section>
        </Form>

        <FormLayout>
          <Form.Section title="Actions">
            {actions.map((action) => (
              <Action
                action={action}
                assets={action.assets}
                createdBy={action.createdBy.fullName}
              />
            ))}

            {actions.length === 0 && (
              <Info title="No actions">
                You have not added any actions to this role, yet.
              </Info>
            )}

            <FormLayout.Actions>
              <SecondaryLinkButton
                to={href('/workspace/:workspaceId/roles/:roleId/add-action', {
                  workspaceId,
                  roleId,
                })}
              >
                Add new action
              </SecondaryLinkButton>
            </FormLayout.Actions>
          </Form.Section>
        </FormLayout>
      </Page.Main>

      <Outlet />
    </Page>
  )
}

export default EditRole
