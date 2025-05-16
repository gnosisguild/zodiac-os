import type { State } from '@/state'
import {
  createRenderDataMode,
  type RenderDataOptions,
} from '@zodiac/test-utils'
import { ToastContainer } from '@zodiac/ui'
import type { PropsWithChildren } from 'react'
import { routes } from '../src/panel/routes'
import {
  createMockPort,
  mockActiveTab,
  mockRuntimeConnect,
  mockTabConnect,
} from './chrome'
import { createTransactionState } from './creators'
import { RenderWrapper } from './RenderWrapper'

type Options = RenderDataOptions & {
  /** Can be used to change the attributes of the currently active tab */
  activeTab?: Partial<chrome.tabs.Tab>
  /**
   * Initial transaction state when the component renders
   */
  initialState?: Partial<State>
}

const baseRender = createRenderDataMode(routes)

export const render = async (
  currentPath: string,
  {
    activeTab,
    initialState,
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
      <RenderWrapper initialState={createTransactionState(initialState)}>
        {children}

        <ToastContainer />
      </RenderWrapper>
    </Wrapper>
  )

  const result = await baseRender(currentPath, {
    ...options,

    wrapper: FinalRenderWrapper,
  })

  return { ...result, mockedTab, mockedPort, mockedRuntimePort }
}
