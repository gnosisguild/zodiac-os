import { authorizedAction, authorizedLoader } from '@/auth-server'
import { Page } from '@/components'
import { invariantResponse } from '@epic-web/invariant'
import {
  createRole,
  dbClient,
  findRoleByKey,
  getAccounts,
  getUsers,
  getWorkspace,
  setActiveAccounts,
  setRoleMembers,
} from '@zodiac/db'
import { getString, getUUIDList } from '@zodiac/form-data'
import { useIsPending } from '@zodiac/hooks'
import { getRoleKey } from '@zodiac/modules'
import { isUUID } from '@zodiac/schema'
import {
  Error,
  Form,
  FormLayout,
  GhostLinkButton,
  Info,
  MultiSelect,
  PrimaryButton,
  SecondaryButton,
} from '@zodiac/ui'
import { href, redirect } from 'react-router'
import { Route } from './+types/create'
import { AccountSelect } from './AccountSelect'
import { Intent } from './intents'
import { RoleLabelInput } from './RoleLabelInput'

export const loader = async (args: Route.LoaderArgs) =>
  authorizedLoader(
    args,
    async ({
      context: {
        auth: { tenant },
      },
      params: { workspaceId },
    }) => {
      invariantResponse(isUUID(workspaceId), '"workspaceId" is not a UUID')

      const [users, accounts] = await Promise.all([
        getUsers(dbClient(), { tenantId: tenant.id }),
        getAccounts(dbClient(), { workspaceId }),
      ])

      return { users, accounts }
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
    async ({
      request,
      params: { workspaceId },
      context: {
        auth: { user, tenant },
      },
    }) => {
      const data = await request.formData()
      invariantResponse(isUUID(workspaceId), '"workspaceId" is not a UUID')

      const label = getString(data, 'label')
      const key = getRoleKey(label)

      const existingRole = await findRoleByKey(dbClient(), workspaceId, key)

      if (existingRole != null) {
        return { error: 'duplicate-role' }
      }

      const role = await dbClient().transaction(async (tx) => {
        const role = await createRole(tx, user, tenant, {
          label,
          key,
          workspaceId,
        })

        await setRoleMembers(tx, role, getUUIDList(data, 'members'))
        await setActiveAccounts(tx, role, getUUIDList(data, 'accounts'))

        return role
      })

      return redirect(
        href('/workspace/:workspaceId/roles/:roleId', {
          workspaceId,
          roleId: role.id,
        }),
      )
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

const CreateRole = ({
  loaderData: { users, accounts },
  actionData,
  params: { workspaceId },
}: Route.ComponentProps) => {
  return (
    <Page>
      <Page.Header>Create new role</Page.Header>
      <Page.Main>
        <Form>
          <Form.Section
            title="Base configuration"
            description="Defines the basics for this role. Who should it be enabled for and what accounts are affected."
          >
            {actionData != null && (
              <Error title="Could not create role">
                A role with this name already exists. Please choose another
                label.
              </Error>
            )}

            <RoleLabelInput
              required
              label="Label"
              name="label"
              placeholder="Give this role a descriptive name"
            />

            <MultiSelect
              label="Members"
              name="members"
              placeholder="Select who should be able to assume this role"
              options={users.map((user) => ({
                label: user.fullName,
                value: user.id,
              }))}
            />

            <AccountSelect accounts={accounts} />

            <Form.Actions>
              <PrimaryButton
                intent={Intent.Create}
                busy={useIsPending(Intent.Create)}
                submit
              >
                Create
              </PrimaryButton>

              <GhostLinkButton
                to={href('/workspace/:workspaceId/roles', {
                  workspaceId,
                })}
              >
                Cancel
              </GhostLinkButton>
            </Form.Actions>
          </Form.Section>

          <FormLayout>
            <FormLayout.Section title="Actions">
              <Info title="Create role to add actions">
                You can add actions once you've created the initial version of
                the role
              </Info>

              <FormLayout.Actions>
                <SecondaryButton disabled>Add new action</SecondaryButton>
              </FormLayout.Actions>
            </FormLayout.Section>
          </FormLayout>
        </Form>
      </Page.Main>
    </Page>
  )
}

export default CreateRole
