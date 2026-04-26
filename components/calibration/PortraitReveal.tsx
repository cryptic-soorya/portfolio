'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { gsap } from '@/lib/animations/gsap.config'
import { EASE } from '@/lib/animations/easing'

/**
 * Interactive portrait reveal — cursor spotlight (desktop) / scroll dissolve (mobile).
 *
 * Device detection: matchMedia('(hover: hover) and (pointer: fine)')
 *   Identifies true pointer devices without UA sniffing. Touch/stylus falls
 *   back to scroll. This covers: mouse+trackpad → desktop path, finger touch
 *   (phone/iPad touch mode) → mobile path.
 *
 * Performance strategy:
 *   - Single RAF loop drives both cursor lerp and mask string writes
 *   - mask-image updated via direct style mutation — zero React re-renders
 *   - Cursor coordinates rounded to 1 decimal to avoid style-recalc churn
 *   - will-change: filter on image div — GPU layer before GSAP starts tweening
 *   - 128×128 grain canvas scaled by CSS, one ImageData allocation reused each frame
 *
 * Add your portrait to: /public/portrait.jpg  (or pass a custom src prop)
 */
export function PortraitReveal({ src = '/portrait.jpg' }: { src?: string }) {
  const wrapRef    = useRef<HTMLDivElement>(null)
  const imgRef     = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const grainRef   = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap    = wrapRef.current
    const img     = imgRef.current
    const overlay = overlayRef.current
    const grain   = grainRef.current
    if (!wrap || !img || !overlay || !grain) return

    // ── Grain canvas — runs for both paths ──────────────────────────────────
    const SIZE  = 128
    grain.width = SIZE
    grain.height = SIZE

    const gctx    = grain.getContext('2d')
    const imgData = gctx?.createImageData(SIZE, SIZE) ?? null
    const pd      = imgData?.data ?? null
    let grainRaf  = 0

    // Plain object — GSAP can tween its `alpha` property directly
    const grainState = { alpha: 0.20 }

    function renderGrain() {
      if (gctx && imgData && pd) {
        const a = (grainState.alpha * 255) | 0
        for (let i = 0; i < pd.length; i += 4) {
          const v  = (Math.random() * 255) | 0
          pd[i]    = v
          pd[i + 1] = v
          pd[i + 2] = v
          pd[i + 3] = a
        }
        gctx.putImageData(imgData, 0, 0)
      }
      grainRaf = requestAnimationFrame(renderGrain)
    }

    renderGrain()

    // ── Route to device-appropriate interaction ──────────────────────────────
    const isPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const teardown  = isPointer
      ? setupDesktop(wrap, img, overlay, grainState)
      : setupMobile(wrap, img, overlay, grainState)

    return () => {
      cancelAnimationFrame(grainRaf)
      teardown()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={wrapRef}
      aria-hidden
      data-portrait-wrap=""
      className="absolute top-0 right-0 h-full pointer-events-none select-none"
      style={{ width: 'clamp(260px, 42vw, 680px)', zIndex: 5 }}
    >
      {/* ── B&W portrait — starts invisible + blurred ── */}
      <div
        ref={imgRef}
        className="absolute inset-0"
        style={{
          filter: 'grayscale(1) blur(14px) brightness(0.52)',
          opacity: 0,
          willChange: 'filter, opacity',
        }}
      >
        <Image
          src={src}
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 65vw, 42vw"
          style={{ objectFit: 'cover', objectPosition: 'center 12%' }}
          draggable={false}
        />
      </div>

      {/* ── Dark cover — cursor punches a hole (desktop) or fades out (mobile) ── */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{
          background: '#050505',
          // 0px radius = fully opaque cover at start
          maskImage:
            'radial-gradient(circle 0px at 50% 40%, transparent 0%, #050505 1px)',
          WebkitMaskImage:
            'radial-gradient(circle 0px at 50% 40%, transparent 0%, #050505 1px)',
        }}
      />

      {/* ── Portrait-scoped grain — sits above image + overlay ── */}
      <canvas
        ref={grainRef}
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* ── Left-edge vignette — dissolves portrait into page background ── */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, #050505 0%, rgba(5,5,5,0.72) 20%, transparent 52%)',
          zIndex: 3,
        }}
      />

      {/* ── Top + bottom vignette ── */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #050505 0%, transparent 16%, transparent 80%, #050505 100%)',
          zIndex: 3,
        }}
      />
    </div>
  )
}

// ─── Desktop: cursor-driven spotlight reveal ──────────────────────────────────

function setupDesktop(
  wrap: HTMLDivElement,
  img: HTMLDivElement,
  overlay: HTMLDivElement,
  grain: { alpha: number },
): () => void {
  const section: EventTarget =
    wrap.closest('section') ?? document.documentElement

  // Lerp state — all mutable, lives in the RAF closure
  let targetX = window.innerWidth  / 2
  let targetY = window.innerHeight / 2
  let smoothX = targetX
  let smoothY = targetY
  let radius  = 0
  let targetRadius = 0
  let inside  = false
  let rafId   = 0

  // Portrait fades in once the name scramble completes (~2.8s)
  gsap.to(img, {
    opacity: 0.9,
    duration: 2.0,
    delay: 2.8,
    ease: EASE.cinematic,
  })

  function onMove(e: MouseEvent) {
    targetX = e.clientX
    targetY = e.clientY

    if (!inside) {
      inside = true
      targetRadius = 230

      // Blur collapses as user explores — "signal locking in"
      gsap.to(img, {
        filter: 'grayscale(1) blur(2px) brightness(0.82)',
        duration: 1.8,
        ease: EASE.smooth,
        overwrite: 'auto',
      })

      // Grain settles in sync with blur
      gsap.to(grain, { alpha: 0.07, duration: 2.2, ease: EASE.smooth })
    }
  }

  function onLeave() {
    inside = false
    targetRadius = 0

    // Signal lost — blur returns, grain rises
    gsap.to(img, {
      filter: 'grayscale(1) blur(8px) brightness(0.58)',
      duration: 1.4,
      ease: 'power2.inOut',
      overwrite: 'auto',
    })
    gsap.to(grain, { alpha: 0.20, duration: 1.0, ease: 'power2.in' })
  }

  function tick() {
    // Exponential lerp — lower factor = more lag = smoother feel
    smoothX += (targetX - smoothX) * 0.072
    smoothY += (targetY - smoothY) * 0.072
    radius  += (targetRadius - radius) * 0.09

    const rect = wrap.getBoundingClientRect()
    const px   = ((smoothX - rect.left) / rect.width)  * 100
    const py   = ((smoothY - rect.top)  / rect.height) * 100
    const r    = Math.round(radius)

    // Soft-edged spotlight: transparent core → semi-dark penumbra → solid edge
    const mask =
      `radial-gradient(circle ${r}px at ${px.toFixed(1)}% ${py.toFixed(1)}%, ` +
      `transparent 0%, transparent 42%, rgba(5,5,5,0.62) 68%, #050505 92%)`

    overlay.style.maskImage       = mask
    overlay.style.webkitMaskImage = mask

    rafId = requestAnimationFrame(tick)
  }

  section.addEventListener('mousemove', onMove as EventListener, { passive: true })
  section.addEventListener('mouseleave', onLeave as EventListener)
  rafId = requestAnimationFrame(tick)

  return () => {
    section.removeEventListener('mousemove', onMove as EventListener)
    section.removeEventListener('mouseleave', onLeave as EventListener)
    cancelAnimationFrame(rafId)
  }
}

// ─── Mobile: scroll-driven dissolve reveal ────────────────────────────────────

function setupMobile(
  wrap: HTMLDivElement,
  img: HTMLDivElement,
  overlay: HTMLDivElement,
  grain: { alpha: number },
): () => void {
  const section = wrap.closest('section')
  if (!section) return () => {}

  // Image starts visible but heavily obscured — scroll lifts the veil
  gsap.set(img, { opacity: 0.55 })

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerHeight * 0.55}`,
        scrub: 2.2,
        invalidateOnRefresh: true,
      },
    })

    // Overlay dissolves away — portrait emerges from under the cover
    tl.to(overlay, {
      opacity: 0,
      ease: 'power2.out',
      duration: 0.7,
    }, 0)

    // Blur + brightness lift — "signal acquiring"
    tl.to(img, {
      opacity: 0.88,
      filter: 'grayscale(1) blur(0px) brightness(0.88)',
      ease: 'power2.out',
      duration: 0.9,
    }, 0)

    // Grain settles as image clears
    tl.to(grain, {
      alpha: 0.05,
      ease: 'power2.out',
      duration: 0.8,
    }, 0)
  })

  return () => ctx.revert()
}
