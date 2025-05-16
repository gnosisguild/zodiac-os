import { featureFactory, tenantFactory } from '@zodiac/db/test-utils'
import { describe, expect, it } from 'vitest'
import { dbClient } from '../../dbClient'
import { activateFeatures } from './activateFeatures'
import { getActiveFeatures } from './getActiveFeatures'

describe('getActiveFeatures', () => {
  it('returns features for a tenant', async () => {
    const tenant = await tenantFactory.create()
    const feature = await featureFactory.create()

    await activateFeatures(dbClient(), {
      tenantId: tenant.id,
      featureIds: [feature.id],
    })

    await expect(getActiveFeatures(dbClient(), tenant.id)).resolves.toEqual([
      feature,
    ])
  })

  it('does not include features that are not active for a tenant', async () => {
    const tenant = await tenantFactory.create()
    await featureFactory.create()

    await expect(getActiveFeatures(dbClient(), tenant.id)).resolves.toEqual([])
  })
})
