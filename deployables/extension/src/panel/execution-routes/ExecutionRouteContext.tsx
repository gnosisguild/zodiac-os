import { invariant } from '@epic-web/invariant'
import { ExecutionRoute } from '@zodiac/schema'
import { createContext, useContext, type PropsWithChildren } from 'react'

const ExecutionRouteContext = createContext<{ route: ExecutionRoute | null }>({
  route: null,
})

export const ProvideExecutionRoute = ({
  route,
  children,
}: PropsWithChildren<{ route: ExecutionRoute }>) => (
  <ExecutionRouteContext.Provider value={{ route }}>
    {children}
  </ExecutionRouteContext.Provider>
)

export const useExecutionRoute = () => {
  const route = useOptionalExecutionRoute()

  invariant(route != null, 'Could not find active route on context')

  return route
}

export const useOptionalExecutionRoute = () => {
  const { route } = useContext(ExecutionRouteContext)

  return route
}
