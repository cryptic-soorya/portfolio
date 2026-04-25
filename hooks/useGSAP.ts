'use client'

/**
 * Safe GSAP animation hook with automatic context cleanup.
 *
 * Why this exists:
 * — GSAP animations created in useEffect without a context scope will leak
 *   into the global timeline. In React Strict Mode (double-invoke), or when
 *   components unmount, orphaned tweens continue running against detached DOM.
 *
 * — gsap.context() scopes all tweens and ScrollTriggers created inside the
 *   callback to a root element. .revert() on unmount kills them cleanly.
 *
 * Usage:
 *   const containerRef = useRef<HTMLDivElement>(null)
 *   useGSAP(
 *     (context) => {
 *       gsap.fromTo('.my-el', { opacity: 0 }, { opacity: 1 })
 *     },
 *     { scope: containerRef, deps: [] }
 *   )
 */
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { gsap } from '@/lib/animations/gsap.config'

interface UseGSAPOptions {
  /** Scope ref — all selectors inside the callback are relative to this element */
  scope?: RefObject<HTMLElement | null>
  /** Re-run the animation when these values change (like useEffect deps) */
  deps?: React.DependencyList
}

type GSAPContextCallback = (context: gsap.Context) => void | (() => void)

export function useGSAP(
  callback: GSAPContextCallback,
  { scope, deps = [] }: UseGSAPOptions = {}
): void {
  const contextRef = useRef<gsap.Context | null>(null)
  const callbackRef = useRef<GSAPContextCallback>(callback)

  // Keep callback ref fresh without re-creating the effect
  callbackRef.current = callback

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const cleanup = callbackRef.current(self)
      if (typeof cleanup === 'function') {
        self.add(() => cleanup)
      }
    }, scope?.current ?? undefined)

    contextRef.current = ctx

    return () => {
      ctx.revert()
      contextRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
