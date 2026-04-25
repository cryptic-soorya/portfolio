'use client'

import { useContext } from 'react'
import { LenisContext } from '@/lib/lenis-context'
import type Lenis from 'lenis'

/**
 * Returns the active Lenis instance.
 * Will be null until SmoothScroll mounts and initializes Lenis on the client.
 *
 * Usage:
 *   const lenis = useLenis()
 *   lenis?.scrollTo('#section', { duration: 1.2 })
 *   lenis?.stop()  // pause scrolling (e.g. modal open)
 *   lenis?.start() // resume
 */
export function useLenis(): Lenis | null {
  return useContext(LenisContext)
}
