import { ProvideAccount, toLocalAccount, type TaggedAccount } from '@/accounts'
import { toAccount } from '@/companion'
import { ProvideExecutionRoute } from '@/execution-routes'
import {
  ProvideForkProvider,
  ProvideTransactions,
  type State,
} from '@/transactions'
import { invariant } from '@epic-web/invariant'
import { createMockExecutionRoute } from '@zodiac/modules/test-utils'
import { ExecutionRoute } from '@zodiac/schema'
import {
  renderHook as renderHookBase,
  type RenderHookOptions,
} from '@zodiac/test-utils'
import { createRef, Fragment, RefObject, type PropsWithChildren } from 'react'
import { mockActiveTab, mockRuntimeConnect } from './chrome'
import { createTransactionState } from './creators'

type Fn<Result, Props> = (props: Props) => Result

type ExtendedOptions = {
  activeTab?: Partial<chrome.tabs.Tab>

  account?: TaggedAccount
  route?: ExecutionRoute

  initialState?: Partial<State>
}

export const renderHook = async <Result, Props>(
  fn: Fn<Result, Props>,
  {
    activeTab,
    route = createMockExecutionRoute(),
    account = toLocalAccount(toAccount(route)),
    wrapper: Wrapper = Fragment,
    initialState,

    ...options
  }: RenderHookOptions<Props> & ExtendedOptions = {},
) => {
  const mockedTab = mockActiveTab(activeTab)
  const mockedRuntimePort = mockRuntimeConnect()

  const state = createRef<State>()

  const FinalWrapper = ({ children }: PropsWithChildren) => (
    <RenderWrapper
      account={account}
      route={route}
      initialState={createTransactionState(initialState)}
      stateRef={state}
    >
      <Wrapper>{children}</Wrapper>
    </RenderWrapper>
  )

  const result = await renderHookBase<Result, Props>(fn, {
    ...options,
    wrapper: FinalWrapper,
  })

  return {
    ...result,
    mockedTab,
    mockedRuntimePort,
    getState() {
      invariant(state.current != null, 'State has not been initialized, yet')

      return state.current
    },
  }
}

type RenderWrapperProps = PropsWithChildren<{
  account: TaggedAccount
  route: ExecutionRoute
  initialState: State
  stateRef: RefObject<State | null>
}>

const RenderWrapper = ({
  account,
  initialState,
  children,
  stateRef,
  route,
}: RenderWrapperProps) => (
  <ProvideAccount account={account}>
    <ProvideExecutionRoute route={route}>
      <ProvideTransactions initialState={initialState} stateRef={stateRef}>
        <ProvideForkProvider route={null}>{children}</ProvideForkProvider>
      </ProvideTransactions>
    </ProvideExecutionRoute>
  </ProvideAccount>
)
