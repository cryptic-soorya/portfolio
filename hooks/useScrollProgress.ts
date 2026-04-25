'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLenis } from '@/hooks/useLenis'

interface ScrollState {
  /** 0 → 1 across the full page */
  progress: number
  /** Current scroll position in pixels */
  scroll: number
  /** +1 = down, -1 = up */
  direction: 1 | -1
  /** Scroll velocity */
  velocity: number
}

const INITIAL_STATE: ScrollState = {
  progress: 0,
  scroll: 0,
  direction: 1,
  velocity: 0,
}

/**
 * Reactive scroll state powered by Lenis.
 * Components that only need progress can destructure { progress }.
 * All values update every animation frame — keep consumers lightweight.
 */
export function useScrollProgress(): ScrollState {
  const [state, setState] = useState<ScrollState>(INITIAL_STATE)
  const lenis = useLenis()

  const onScroll = useCallback(
    (e: { scroll: number; progress: number; velocity: number; direction: 1 | -1 }) => {
      setState({
        progress: e.progress,
        scroll: e.scroll,
        direction: e.direction,
        velocity: e.velocity,
      })
    },
    []
  )

  useEffect(() => {
    if (!lenis) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lenis.on('scroll', onScroll as any)
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lenis.off('scroll', onScroll as any)
    }
  }, [lenis, onScroll])

  return state
}
