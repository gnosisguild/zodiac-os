import { saveRoute } from '@/execution-routes'
import { ExecutionRoute } from '@zodiac/schema'
import { createMockRoute } from '../creators'

export const mockRoutes = (...routes: Partial<ExecutionRoute>[]) => {
  const mockedRoutes = routes.map(createMockRoute).map(saveRoute)

  return Promise.all(mockedRoutes)
}
