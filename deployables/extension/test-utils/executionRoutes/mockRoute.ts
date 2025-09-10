import { saveRoute } from '@/execution-routes'
import { ExecutionRoute } from '@zodiac/schema'
import { createMockRoute } from '../creators'

export const mockRoute = (route: Partial<ExecutionRoute> = {}) => {
  const mockRoute = createMockRoute(route)

  return saveRoute(mockRoute)
}
