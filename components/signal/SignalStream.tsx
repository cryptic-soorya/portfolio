'use client'

import { useRef, useEffect } from 'react'
import { SITE } from '@/lib/data/site'
import { gsap } from '@/lib/animations/gsap.config'
import { useLenis } from '@/hooks/useLenis'

// ─── Content ──────────────────────────────────────────────────────────────────

const SEPARATOR = '  ◈  '

const TOKENS = SITE.marquee
  .split('·')
  .map((t) => t.trim())
  .filter(Boolean)

const BAND_TEXT = TOKENS.join(SEPARATOR) + SEPARATOR

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PHASE 4 — Signal Layer (refined)
 *
 * GSAP ticker drives both tracks frame-by-frame rather than CSS animation-duration,
 * which eliminates the position-jump artifact from dynamic duration changes.
 *
 * Each frame:
 *  - Organic breathing: two independent sine oscillators modulate speed ±6%
 *    at rest so the stream never feels mechanically constant
 *  - Velocity coupling: Lenis signed velocity feeds primary and echo
 *    with different weights — primary reacts fast, echo lags
 *  - Opacity drift: third oscillator on each track, out-of-phase
 *  - Echo Y drift: 4th slow oscillator, ±2px vertical float
 *  - Wrap is pixel-accurate: positions snap mod singleWidth each frame
 */
export function SignalStream() {
  const wrapRef        = useRef<HTMLDivElement>(null)
  const primaryInnerRef = useRef<HTMLSpanElement>(null)
  const echoInnerRef    = useRef<HTMLSpanElement>(null)

  // Persist across effect re-runs (lenis becomes available after initial render)
  const primaryX    = useRef(0)
  const echoX       = useRef(0)
  const singleWidth = useRef(0)
  const originTime  = useRef(0)

  const lenis = useLenis()

  // ── Ticker — drives all motion ────────────────────────────────────────────
  useEffect(() => {
    const pEl = primaryInnerRef.current
    const eEl = echoInnerRef.current
    if (!pEl || !eEl) return

    // Measure once (after paint) — re-used for wrap math
    if (!singleWidth.current) {
      singleWidth.current = pEl.scrollWidth / 4   // content repeated 4×
    }
    if (!originTime.current) {
      originTime.current = performance.now()
    }

    const sw = singleWidth.current

    function tick() {
      const t   = (performance.now() - originTime.current) / 1000
      const vel = (lenis as unknown as { velocity?: number })?.velocity ?? 0

      // ── Organic speed breathing at idle — two out-of-phase sine waves ──
      // Periods ~57s and ~90s — well below perception as deliberate oscillation
      const breathP = 1 + Math.sin(t * 0.11) * 0.06          // primary ±6%
      const breathE = 1 + Math.sin(t * 0.07 + 2.1) * 0.05    // echo    ±5%

      // ── Velocity coupling ──
      // primary  — more responsive (surface layer, lighter)
      // echo     — lagging  (deeper layer, heavier)
      // Both accelerate in their natural direction; primary gets more push
      const velNorm    = vel / 900                             // ~1 at peak
      const velPrimary = velNorm * 0.55                        // px/frame add
      const velEcho    = velNorm * 0.28                        // echo lags

      // ── px/frame  (base ~0.5 → ~30px/s at 60fps) ──
      const speedP = 0.50 * breathP + velPrimary
      const speedE = 0.32 * breathE + velEcho

      // ── Advance and wrap ──
      primaryX.current -= speedP                              // left
      echoX.current    += speedE                              // right

      if (primaryX.current <= -sw) primaryX.current += sw
      if (primaryX.current >   0)  primaryX.current -= sw
      if (echoX.current    >= sw)  echoX.current    -= sw
      if (echoX.current    <  0)   echoX.current    += sw

      // ── Opacity breathing — independent slow oscillators ──
      const opP = 0.72 + Math.sin(t * 0.09) * 0.13           // 0.59 → 0.85
      const opE = 0.28 + Math.sin(t * 0.06 + 1.4) * 0.09     // 0.19 → 0.37

      // ── Echo vertical drift — barely perceptible parallax float ──
      const echoY = Math.sin(t * 0.13 + 0.8) * 1.8           // ±1.8px

      // pEl / eEl are guaranteed non-null — checked before gsap.ticker.add
      pEl!.style.transform = `translate3d(${primaryX.current}px, 0, 0)`
      pEl!.style.opacity   = opP.toFixed(3)

      eEl!.style.transform = `translate3d(${echoX.current}px, ${echoY}px, 0)`
      eEl!.style.opacity   = opE.toFixed(3)
    }

    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [lenis])

  // ── Entrance — drifts up from below with opacity ──────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const ctx = gsap.context(() => {
      gsap.from(wrap, {
        opacity: 0,
        y: 10,
        duration: 2.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: wrap,
          start: 'top 94%',
          toggleActions: 'play none none none',
        },
      })
    }, wrap)

    return () => ctx.revert()
  }, [])

  const repeated = Array(4).fill(BAND_TEXT).join('')

  return (
    <div
      ref={wrapRef}
      className="signal-stream relative w-full overflow-hidden select-none"
      aria-hidden
      style={{
        paddingBlock: '1.4rem',
        borderTop:    '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        background:   'linear-gradient(180deg, transparent 0%, rgba(124,255,203,0.015) 50%, transparent 100%)',
      }}
    >
      {/* Edge fade — text dissolves into void */}
      <div
        aria-hidden
        style={{
          position:   'absolute',
          inset:      0,
          zIndex:     2,
          pointerEvents: 'none',
          background: 'linear-gradient(90deg, var(--color-bg) 0%, transparent 7%, transparent 93%, var(--color-bg) 100%)',
        }}
      />

      {/* Scan cursor — faint pulse at top edge */}
      <div
        aria-hidden
        className="signal-scan-cursor"
        style={{
          position:      'absolute',
          top:           0,
          left:          0,
          right:         0,
          height:        '1px',
          background:    'linear-gradient(90deg, transparent 0%, rgba(124,255,203,0.28) 18%, rgba(124,255,203,0.55) 50%, rgba(124,255,203,0.28) 82%, transparent 100%)',
          zIndex:        3,
          pointerEvents: 'none',
        }}
      />

      {/* Primary track — moves left */}
      <div
        className="signal-track"
        style={{ overflow: 'hidden' }}
      >
        <span
          ref={primaryInnerRef}
          className="signal-inner signal-inner--primary"
          style={{ display: 'inline-block', whiteSpace: 'nowrap', willChange: 'transform' }}
        >
          {repeated}
        </span>
      </div>

      {/* Echo track — moves right, floats vertically */}
      <div
        className="signal-track"
        style={{ overflow: 'hidden', marginTop: '0.4rem' }}
      >
        <span
          ref={echoInnerRef}
          className="signal-inner signal-inner--echo"
          style={{ display: 'inline-block', whiteSpace: 'nowrap', willChange: 'transform' }}
        >
          {repeated}
        </span>
      </div>
    </div>
  )
}
