import {
  dbIt,
  deploymentFactory,
  tenantFactory,
  userFactory,
} from '@zodiac/db/test-utils'
import { beforeEach, describe, expect, vi } from 'vitest'
import { dbClient } from '../../dbClient'
import { assertActiveDeployment } from './assertActiveDeployment'
import { completeDeploymentIfNeeded } from './completeDeploymentIfNeeded'
import { getDeployment } from './getDeployment'

describe('completeDeploymentIfNeeded', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date())
  })

  dbIt('sets the deployment to completed', async () => {
    const user = await userFactory.create()
    const tenant = await tenantFactory.create(user)
    const deployment = await deploymentFactory.create(tenant, user)

    assertActiveDeployment(deployment)

    await completeDeploymentIfNeeded(dbClient(), deployment)

    await expect(
      getDeployment(dbClient(), deployment.id),
    ).resolves.toHaveProperty('completedAt', new Date())
  })
})
