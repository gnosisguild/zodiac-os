import {
  dbIt,
  roleDeploymentFactory,
  roleDeploymentSliceFactory,
  roleFactory,
  tenantFactory,
  userFactory,
} from '@zodiac/db/test-utils'
import { beforeEach, describe, expect, vi } from 'vitest'
import { dbClient } from '../../dbClient'
import { assertActiveRoleDeployment } from './assertActiveRoleDeployment'
import { cancelRoleDeployment } from './cancelRoleDeployment'
import { getRoleDeploymentSlice } from './getRoleDeploymentSlice'

describe('Cancel role deployment', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date())
  })

  dbIt('cancels all deployment steps', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const role = await roleFactory.create(tenant, user)
    const deployment = await roleDeploymentFactory.create(user, role)
    const step = await roleDeploymentSliceFactory.create(user, deployment)

    assertActiveRoleDeployment(deployment)

    await cancelRoleDeployment(dbClient(), user, deployment)

    await expect(
      getRoleDeploymentSlice(dbClient(), step.id),
    ).resolves.toMatchObject({
      cancelledAt: new Date(),
      cancelledById: user.id,
    })
  })
})
