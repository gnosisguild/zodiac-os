import {
  CompanionAppMessageType,
  CompanionResponseMessageType,
  createWindowMessageHandler,
  type CompanionAppMessage,
} from '@zodiac/messages'
import { useStableHandler } from '@zodiac/ui'
import { useEffect } from 'react'
import { useActiveWhenVisible } from './useActiveWhenVisible'

type DisconnectWhenUnreachableOptions = {
  onDisconnect: () => void
}

export const useDisconnectWhenUnreachable = (
  connected: boolean,
  { onDisconnect }: DisconnectWhenUnreachableOptions,
) => {
  const onDisconnectRef = useStableHandler(onDisconnect)
  const active = useActiveWhenVisible()

  useEffect(() => {
    if (connected === false) {
      return
    }

    if (!active) {
      return
    }

    let cancelled = false

    const probeConnection = () => {
      window.postMessage(
        { type: CompanionAppMessageType.PING } satisfies CompanionAppMessage,
        '*',
      )

      const disconnectTimeout = setTimeout(() => {
        if (cancelled) {
          return
        }

        onDisconnectRef.current()
      }, 1000)

      const handlePong = createWindowMessageHandler(
        CompanionResponseMessageType.PONG,
        () => clearTimeout(disconnectTimeout),
      )

      window.addEventListener('message', handlePong)
    }

    const interval = setInterval(probeConnection, 1000)

    return () => {
      cancelled = true

      clearInterval(interval)
    }
  }, [active, connected, onDisconnectRef])
}
