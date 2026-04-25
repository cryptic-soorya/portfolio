'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/lib/animations/gsap.config'
import { LenisContext } from '@/lib/lenis-context'

interface SmoothScrollProps {
  children: ReactNode
}

/**
 * Wraps the application with a Lenis smooth-scroll instance synced to GSAP's ticker.
 *
 * Why GSAP ticker instead of requestAnimationFrame?
 * — ScrollTrigger and Lenis must update on the same frame.
 *   GSAP's ticker is the shared clock; using it for Lenis raf() calls
 *   guarantees zero drift between scroll position and triggered animations.
 *
 * Why lagSmoothing(0)?
 * — GSAP normally catches up skipped frames (e.g. after a tab switch) by
 *   advancing time rapidly. That makes Lenis jump. Disabling it keeps
 *   scroll position stable when focus returns.
 */
export function SmoothScroll({ children }: SmoothScrollProps) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    const instance = new Lenis({
      duration: 1.2,
      // Expo ease-out: fast start, graceful deceleration
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    setLenis(instance)

    // Keep ScrollTrigger's internal scroll value in sync with Lenis
    const onScroll = () => ScrollTrigger.update()
    instance.on('scroll', onScroll)

    // Drive Lenis from GSAP's tick — one shared clock, zero drift
    const tick = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      instance.off('scroll', onScroll)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  )
}
