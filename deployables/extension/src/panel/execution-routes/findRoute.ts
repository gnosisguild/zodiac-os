import { getStorageEntry } from '@/storage'
import { ExecutionRoute } from '@zodiac/schema'

export const findRoute = async (routeId: string) => {
  const route = await getStorageEntry<ExecutionRoute | undefined>({
    collection: 'routes',
    key: routeId,
  })

  return route
}
