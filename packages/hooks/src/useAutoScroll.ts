import { useCallback, useEffect, useRef, useState } from 'react'

export const useAutoScroll = (
  containerRef: React.RefObject<HTMLDivElement>,
  endRef: React.RefObject<HTMLDivElement>,
  bottomThreshold = 40,
) => {
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [follow, setFollow] = useState(false)
  const lastTop = useRef(0)
  const dragging = useRef(false)
  const smoothScrolling = useRef(false)

  const dist = useCallback(() => {
    const container = containerRef.current
    return container
      ? container.scrollHeight - container.scrollTop - container.clientHeight
      : 0
  }, [containerRef])

  const refreshBtn = useCallback(() => {
    setShowScrollButton(!follow && dist() > bottomThreshold)
  }, [follow, dist, bottomThreshold])

  const scrollToBottom = useCallback(() => {
    setFollow(true)
    smoothScrolling.current = true
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
    requestAnimationFrame(refreshBtn)

    // Reset smooth scrolling flag after animation completes
    setTimeout(() => {
      smoothScrolling.current = false
    }, 1000) // Smooth scroll typically takes ~500ms, using 1000ms for safety
  }, [endRef, refreshBtn])

  const handleNewAnimatedMessage = useCallback(() => {
    scrollToBottom() // re-enable follow when a new animated msg starts
  }, [scrollToBottom])

  const handleAnimationTick = useCallback(() => {
    // don't fight the user while dragging; also add tiny hysteresis
    // don't interfere with smooth scrolling
    if (follow && !dragging.current && !smoothScrolling.current && dist() > 2) {
      endRef.current?.scrollIntoView({ behavior: 'auto' })
    }
    refreshBtn()
  }, [follow, dist, endRef, refreshBtn])

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const dy = container.scrollTop - lastTop.current
    // if user is dragging and moving upward at all, ensure follow is off
    if (dragging.current && dy < 0) setFollow(false)
    lastTop.current = container.scrollTop
    refreshBtn()
  }, [containerRef, refreshBtn])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    lastTop.current = container.scrollTop

    const onPointerDown = () => {
      dragging.current = true
      setFollow(false)
    }
    const onPointerUp = () => {
      dragging.current = false
    }
    const onTouchStart = () => {
      dragging.current = true
      setFollow(false)
    }
    const onTouchEnd = () => {
      dragging.current = false
    }
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) setFollow(false)
    } // wheel-up = user intent up

    container.addEventListener('scroll', handleScroll, { passive: true })
    container.addEventListener('pointerdown', onPointerDown, { passive: true })
    container.addEventListener('pointerup', onPointerUp, { passive: true })
    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchend', onTouchEnd, { passive: true })
    container.addEventListener('touchcancel', onTouchEnd, { passive: true })
    container.addEventListener('wheel', onWheel, { passive: true })

    refreshBtn()
    return () => {
      container.removeEventListener('scroll', handleScroll as any)
      container.removeEventListener('pointerdown', onPointerDown as any)
      container.removeEventListener('pointerup', onPointerUp as any)
      container.removeEventListener('touchstart', onTouchStart as any)
      container.removeEventListener('touchend', onTouchEnd as any)
      container.removeEventListener('touchcancel', onTouchEnd as any)
      container.removeEventListener('wheel', onWheel as any)
    }
  }, [containerRef, handleScroll, refreshBtn])

  return {
    showScrollButton,
    scrollToBottom: () => {
      setFollow(true)
      scrollToBottom()
    }, // button re-enables follow
    handleAnimationTick,
    handleNewAnimatedMessage,
  }
}
