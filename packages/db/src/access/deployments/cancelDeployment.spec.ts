import {
  dbIt,
  deploymentFactory,
  deploymentSliceFactory,
  roleFactory,
  tenantFactory,
  userFactory,
} from '@zodiac/db/test-utils'
import { beforeEach, describe, expect, vi } from 'vitest'
import { dbClient } from '../../dbClient'
import { assertActiveDeployment } from './assertActiveDeployment'
import { cancelDeployment } from './cancelDeployment'
import { getDeploymentSlice } from './getDeploymentSlice'

describe('Cancel role deployment', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date())
  })

  dbIt('cancels all deployment steps', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const role = await roleFactory.create(tenant, user)
    const deployment = await deploymentFactory.create(user, role)
    const step = await deploymentSliceFactory.create(user, deployment)

    assertActiveDeployment(deployment)

    await cancelDeployment(dbClient(), user, deployment)

    await expect(
      getDeploymentSlice(dbClient(), step.id),
    ).resolves.toMatchObject({
      cancelledAt: new Date(),
      cancelledById: user.id,
    })
  })
})
