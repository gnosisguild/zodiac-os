import type { TransactionState } from '@/state'
import type { ExecutionRoute } from '@/types'
import {
  render as baseRender,
  type RenderOptions,
  type Route,
} from '@zodiac/test-utils'
import { ToastContainer } from '@zodiac/ui'
import { type PropsWithChildren } from 'react'
import {
  createMockPort,
  mockActiveTab,
  mockRuntimeConnect,
  mockTabConnect,
} from './chrome'
import { RenderWrapper } from './RenderWrapper'

type Options = RenderOptions & {
  /** Can be used to change the attributes of the currently active tab */
  activeTab?: Partial<chrome.tabs.Tab>
  /**
   * Initial transaction state when the component renders
   */
  initialState?: TransactionState[]
  /**
   * Pass a route id here to define the currently launched route
   */
  initialSelectedRoute?: ExecutionRoute | null
}

export const render = async (
  currentPath: string,
  routes: Route[],
  {
    activeTab,
    initialState,
    initialSelectedRoute,
    wrapper: Wrapper = ({ children }: PropsWithChildren) => <>{children}</>,

    ...options
  }: Options = {},
) => {
  const mockedTab = mockActiveTab(activeTab)
  const mockedPort = createMockPort()
  const mockedRuntimePort = createMockPort()

  mockRuntimeConnect(mockedRuntimePort)
  mockTabConnect(mockedPort)

  const FinalRenderWrapper = ({ children }: PropsWithChildren) => (
    <Wrapper>
      <RenderWrapper
        initialSelectedRoute={initialSelectedRoute}
        initialState={initialState}
      >
        {children}
        <ToastContainer />
      </RenderWrapper>
    </Wrapper>
  )

  const result = await baseRender(currentPath, routes, {
    ...options,
    wrapper: FinalRenderWrapper,
  })

  return { ...result, mockedTab, mockedPort, mockedRuntimePort }
}
