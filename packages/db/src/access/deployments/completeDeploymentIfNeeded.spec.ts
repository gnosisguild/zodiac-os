import {
  dbIt,
  deploymentFactory,
  roleFactory,
  tenantFactory,
  userFactory,
} from '@zodiac/db/test-utils'
import { beforeEach, describe, expect, vi } from 'vitest'
import { dbClient } from '../../dbClient'
import { assertActiveDeployment } from './assertActiveDeployment'
import { cancelDeployment } from './cancelDeployment'
import { completeDeploymentIfNeeded } from './completeDeploymentIfNeeded'
import { getDeployment } from './getDeployment'

describe('completeDeploymentIfNeeded', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date())
  })

  dbIt('sets the deployment to completed', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const role = await roleFactory.create(tenant, user)
    const deployment = await deploymentFactory.create(user, role)

    await completeDeploymentIfNeeded(dbClient(), deployment.id)

    await expect(
      getDeployment(dbClient(), deployment.id),
    ).resolves.toHaveProperty('completedAt', new Date())
  })

  dbIt('does not complete the deployment if it was cancelled', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)

    const role = await roleFactory.create(tenant, user)
    const deployment = await deploymentFactory.create(user, role)

    assertActiveDeployment(deployment)

    await cancelDeployment(dbClient(), user, deployment)

    await completeDeploymentIfNeeded(dbClient(), deployment.id)

    await expect(
      getDeployment(dbClient(), deployment.id),
    ).resolves.toHaveProperty('completedAt', null)
  })
})
