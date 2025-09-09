import {
  createMockTab,
  mockRpcRequest,
  mockWebRequest,
  startPilotSession,
} from '@/test-utils'
import { Chain } from '@zodiac/chains'
import { getVnetApiUrl } from '@zodiac/env'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { trackSessions } from '../sessions'
import { detectNetworkOfRpcUrl } from './detectNetworkOfRpcUrl'
import { trackRequests } from './rpcTracking'

vi.mock('./detectNetworkOfRpcUrl', () => ({
  detectNetworkOfRpcUrl: vi.fn(),
}))

const mockDetectNetworkOfRpcUrl = vi.mocked(detectNetworkOfRpcUrl)

describe('RPC Tracking', () => {
  describe('Event handling', () => {
    beforeEach(() => {
      mockDetectNetworkOfRpcUrl.mockResolvedValue({
        newEndpoint: true,
        chainId: Chain.ETH,
      })
    })

    it('notifies when a new network has been tracked', async () => {
      const result = trackRequests()
      trackSessions(result)

      const tab = createMockTab({ id: 1 })
      await startPilotSession({ windowId: 1 }, tab)
      const handler = vi.fn()

      result.onNewRpcEndpointDetected.addListener(handler)

      await mockRpcRequest(tab, {
        chainId: 1,
        url: 'http://test-json-rpc.com',
      })

      expect(handler).toHaveBeenCalled()
    })

    it('is possible to stop getting notified', async () => {
      const result = trackRequests()
      trackSessions(result)

      const tab = createMockTab({ id: 1 })

      await startPilotSession({ windowId: 1 }, tab)

      const handler = vi.fn()

      result.onNewRpcEndpointDetected.addListener(handler)
      result.onNewRpcEndpointDetected.removeListener(handler)

      await mockRpcRequest(tab, {
        chainId: 1,
        url: 'http://test-json-rpc.com',
      })

      expect(handler).not.toHaveBeenCalled()
    })

    it('is possible to remove all listeners', async () => {
      const result = trackRequests()
      trackSessions(result)

      const tab = createMockTab({ id: 1 })

      await startPilotSession({ windowId: 1 }, tab)

      const handler = vi.fn()

      result.onNewRpcEndpointDetected.addListener(handler)
      result.onNewRpcEndpointDetected.removeAllListeners()

      await mockRpcRequest(tab, {
        chainId: 1,
        url: 'http://test-json-rpc.com',
      })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('Ignored from tracking', () => {
    beforeEach(() => {
      mockDetectNetworkOfRpcUrl.mockResolvedValue({
        newEndpoint: true,
        chainId: Chain.ETH,
      })
    })

    it.each(['GET', 'OPTIONS', 'PUT'])(
      'does not track %s requests',
      async () => {
        const result = trackRequests()
        trackSessions(result)

        const tab = createMockTab({ id: 1 })

        await startPilotSession({ windowId: 1 }, tab)

        const handler = vi.fn()

        result.onNewRpcEndpointDetected.addListener(handler)

        mockDetectNetworkOfRpcUrl.mockResolvedValue({
          newEndpoint: true,
          chainId: Chain.ETH,
        })

        await mockWebRequest(tab, {
          method: 'GET',
          requestBody: { jsonrpc: '2.0' },
        })

        expect(handler).not.toHaveBeenCalled()
      },
    )

    it('only considers requests with jsonrpc request bodies', async () => {
      const result = trackRequests()
      trackSessions(result)

      const tab = createMockTab({ id: 1 })

      await startPilotSession({ windowId: 1 }, tab)

      const handler = vi.fn()

      result.onNewRpcEndpointDetected.addListener(handler)

      mockDetectNetworkOfRpcUrl.mockResolvedValue({
        newEndpoint: true,
        chainId: Chain.ETH,
      })

      await mockWebRequest(tab, {
        method: 'POST',
        requestBody: 'Hello there!',
      })

      expect(handler).not.toHaveBeenCalled()
    })

    it('only considers requests inside an active pilot session', async () => {
      const result = trackRequests()
      trackSessions(result)

      const tab = createMockTab({ id: 1 })

      const handler = vi.fn()

      result.onNewRpcEndpointDetected.addListener(handler)

      mockDetectNetworkOfRpcUrl.mockResolvedValue({
        newEndpoint: true,
        chainId: Chain.ETH,
      })

      await mockWebRequest(tab, {
        method: 'POST',
        requestBody: { jsonrpc: '2.0' },
      })

      expect(handler).not.toHaveBeenCalled()
    })

    it('ignores requests against the Tenderly fork', async () => {
      const result = trackRequests()
      trackSessions(result)

      const tab = createMockTab({ id: 1 })

      await startPilotSession({ windowId: 1 }, tab)

      const handler = vi.fn()

      result.onNewRpcEndpointDetected.addListener(handler)

      mockDetectNetworkOfRpcUrl.mockResolvedValue({
        newEndpoint: true,
        chainId: Chain.ETH,
      })

      await mockWebRequest(tab, {
        method: 'POST',
        url: `${getVnetApiUrl('https')}/rpc/mainnet/some-slug`,
        requestBody: { jsonrpc: '2.0' },
      })

      await mockWebRequest(tab, {
        method: 'POST',
        url: `${getVnetApiUrl('wss')}/rpc/mainnet/some-slug`,
        requestBody: { jsonrpc: '2.0' },
      })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('Immediate chain extraction', () => {
    beforeEach(() => {
      mockDetectNetworkOfRpcUrl.mockResolvedValue({ newEndpoint: false })
    })

    it('extract the chainId from the request body if also a method is present', async () => {
      const result = trackRequests()
      trackSessions(result)

      const tab = createMockTab({ id: 1 })

      await startPilotSession({ windowId: 1 }, tab)

      await mockWebRequest(tab, {
        url: 'http://test-rpc.com',
        method: 'POST',
        requestBody: { chainId: Chain.ETH, method: 'eth_call' },
      })

      const trackedUrls = result.getTrackedRpcUrlsForChainId({
        chainId: Chain.ETH,
      })

      expect(trackedUrls.has('http://test-rpc.com')).toBeTruthy()
    })

    it('notifies about new endpoints', async () => {
      const result = trackRequests()
      trackSessions(result)

      const tab = createMockTab({ id: 1 })

      await startPilotSession({ windowId: 1 }, tab)

      const handler = vi.fn()

      result.onNewRpcEndpointDetected.addListener(handler)

      await mockWebRequest(tab, {
        method: 'POST',
        requestBody: { chainId: Chain.ETH, method: 'eth_call' },
      })

      expect(handler).toHaveBeenCalledWith()
    })
  })

  describe('Embedded chain id', () => {
    it('notifies when the embedded chain id changes', async () => {
      const result = trackRequests()
      trackSessions(result)

      const tab = createMockTab({ id: 1 })

      await startPilotSession({ windowId: 1 }, tab)

      const handler = vi.fn()

      result.onNewRpcEndpointDetected.addListener(handler)

      await mockWebRequest(tab, {
        method: 'POST',
        requestBody: { chainId: Chain.ETH, method: 'eth_call' },
      })

      await mockWebRequest(tab, {
        method: 'POST',
        requestBody: { chainId: Chain.GNO, method: 'eth_call' },
      })

      expect(handler).toHaveBeenCalledTimes(2)
    })
  })
})
