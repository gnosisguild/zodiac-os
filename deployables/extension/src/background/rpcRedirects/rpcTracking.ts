import { sentry } from '@/sentry'
import { getVnetApiUrl } from '@zodiac/env'
import type { ChainId } from 'ser-kit'
import type { Event } from '../events'
import { createEventListener } from '../events'
import { updateCSPHeaderRule } from './cspHeaderRule'
import {
  detectNetworkOfRpcUrl,
  type DetectNetworkResult,
} from './detectNetworkOfRpcUrl'
import { enableRpcDebugLogging } from './enableRpcDebugLogging'
import { hasJsonRpcBody } from './hasJsonRpcBody'
import { parseNetworkFromRequestBody } from './parseNetworkFromRequestBody'
import {
  createRpcTrackingState,
  TrackedRpcEndpoints,
  type TrackingState,
} from './rpcTrackingState'
import { trackRpcUrl } from './trackRpcUrl'

type GetTrackedRpcUrlsForChainIdOptions = {
  chainId: ChainId
}

export type TrackRequestsResult = {
  getTrackedRpcUrlsForChainId: (
    options: GetTrackedRpcUrlsForChainIdOptions,
  ) => Map<string, number[]>
  trackTab: (tabId: number) => Promise<void>
  untrackTab: (tabId: number) => Promise<void>
  onNewRpcEndpointDetected: Event
}

export const trackRequests = (): TrackRequestsResult => {
  enableRpcDebugLogging()

  const state = createRpcTrackingState()

  const onNewRpcEndpointDetected = createEventListener()

  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const hasActiveSession = state.trackedTabs.has(details.tabId)

      // only handle requests in tracked tabs
      if (!hasActiveSession) {
        return
      }

      trackRequest(state.chainIdByRpcUrl, details)
        .then((result) => {
          if (result.newEndpoint) {
            console.debug(
              `detected **new** network of JSON RPC endpoint ${details.url} in tab #${details.tabId}: ${result.chainId}`,
            )

            state.chainIdByRpcUrl.set(details.url, result.chainId)

            trackRpcUrl(state, { tabId: details.tabId, url: details.url })

            onNewRpcEndpointDetected.callListeners()
          }
        })
        .catch((error) => sentry.captureException(error))

      return undefined
    },
    {
      urls: ['<all_urls>'],
      types: ['xmlhttprequest'],
    },
    ['requestBody'],
  )

  chrome.tabs.onRemoved.addListener((tabId) => {
    state.rpcUrlsByTabId.delete(tabId)
  })

  return {
    getTrackedRpcUrlsForChainId({ chainId }) {
      return getTabIdsByRpcUrl(state, { chainId })
    },
    async trackTab(tabId) {
      state.trackedTabs.add(tabId)

      await updateCSPHeaderRule(state.trackedTabs)
    },
    async untrackTab(tabId) {
      state.trackedTabs.delete(tabId)

      await updateCSPHeaderRule(state.trackedTabs)
    },
    onNewRpcEndpointDetected: onNewRpcEndpointDetected.toEvent(),
  }
}

const trackRequest = async (
  knownChainIds: TrackedRpcEndpoints,
  { tabId, url, method, requestBody }: chrome.webRequest.OnBeforeRequestDetails,
): Promise<DetectNetworkResult> => {
  if (method !== 'POST') {
    return { newEndpoint: false }
  }

  // ignore requests to fork Rpcs
  if (
    url.startsWith(getVnetApiUrl('https')) ||
    url.startsWith(getVnetApiUrl('wss'))
  ) {
    return { newEndpoint: false }
  }

  // only consider requests with a JSON Rpc body
  if (!hasJsonRpcBody(requestBody)) {
    const result = parseNetworkFromRequestBody({ requestBody })

    const knownChainId = knownChainIds.get(url)

    if (knownChainId == null) {
      return result
    }

    if (result.newEndpoint && result.chainId !== knownChainId) {
      return result
    }

    return { newEndpoint: false }
  }

  if (knownChainIds.has(url)) {
    return { newEndpoint: false }
  }

  return detectNetworkOfRpcUrl({ url, tabId })
}

type GetRpcUrlsOptions = {
  chainId: ChainId
}

const getTabIdsByRpcUrl = (
  { rpcUrlsByTabId, chainIdByRpcUrl }: TrackingState,
  { chainId }: GetRpcUrlsOptions,
) => {
  const tabIdsByRpcUrl = new Map<string, number[]>()

  for (const [tabId, urls] of rpcUrlsByTabId.entries()) {
    const matchingUrls = Array.from(urls).filter(
      (url) => chainIdByRpcUrl.get(url) === chainId,
    )

    for (const url of matchingUrls) {
      const tabIds = tabIdsByRpcUrl.get(url) || []

      tabIdsByRpcUrl.set(url, [...tabIds, tabId])
    }
  }

  return tabIdsByRpcUrl
}
