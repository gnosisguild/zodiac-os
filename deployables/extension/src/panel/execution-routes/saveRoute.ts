import { saveStorageEntry } from '@/storage'
import { ExecutionRoute } from '@zodiac/schema'

export const saveRoute = (route: ExecutionRoute) =>
  saveStorageEntry({
    collection: 'routes',
    key: route.id,
    value: route,
  })
