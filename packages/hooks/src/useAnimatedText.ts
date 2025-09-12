import { animate } from 'framer-motion'
import { useEffect, useState } from 'react'

export const useAnimatedText = (text: string, delimiter: string = '') => {
  const [cursor, setCursor] = useState(1) // Start with 1 to show first character immediately
  const [startingCursor, setStartingCursor] = useState(1)
  const [prevText, setPrevText] = useState(text)

  if (prevText !== text) {
    setPrevText(text)
    setStartingCursor(text.startsWith(prevText) ? cursor : 1)
  }

  useEffect(() => {
    const parts = text.split(delimiter)

    // Use consistent speed based on units per second
    const unitsPerSecond =
      delimiter === ''
        ? 75 // characters per second
        : delimiter === ' '
          ? 10 // words per second
          : 4 // chunks per second

    // Lower-bound only: keep short outputs readable but don't cap long ones
    const duration = Math.max(parts.length / unitsPerSecond, 0.4)

    const controls = animate(startingCursor, parts.length, {
      duration,
      ease: 'linear',
      onUpdate(latest) {
        setCursor(Math.floor(latest))
      },
    })

    return () => controls.stop()
  }, [startingCursor, text, delimiter])

  return text.split(delimiter).slice(0, cursor).join(delimiter)
}
