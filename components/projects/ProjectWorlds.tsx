'use client'

import { useRef, useEffect, useCallback } from 'react'
import { PROJECTS } from '@/lib/data/projects'
import { gsap, ScrollTrigger } from '@/lib/animations/gsap.config'
import { VoctermEnv }   from './environments/VoctermEnv'
import { JarvisEnv }    from './environments/JarvisEnv'
import { MorpheusEnv }  from './environments/MorpheusEnv'
import { MikaEnv }      from './environments/MikaEnv'
import { VoctermContent }  from './worlds/VoctermContent'
import { JarvisContent }   from './worlds/JarvisContent'
import { MorpheusContent } from './worlds/MorpheusContent'
import { MikaContent }     from './worlds/MikaContent'

/**
 * PHASE 5 — Project Worlds (radical edition)
 *
 * Three unique transition types:
 *
 *   vocterm → JARVIS   : TV IMPLOSION
 *     vocterm scaleY → 0.02, brightness:8 (horizontal compression line),
 *     then JARVIS orb explodes outward from its canvas position (62%, 48%).
 *
 *   JARVIS → Morpheus  : FORENSIC SCAN WIPE
 *     Both worlds use clipPath. JARVIS is "scanned away" from the bottom.
 *     Morpheus is revealed by a top-down scan bar.
 *
 *   Morpheus → Mika    : OVEREXPOSURE FLASH
 *     Morpheus filter: brightness(4) saturate(0) → white.
 *     A full-screen flash overlay peaks then fades to black.
 *     Mika emerges from the void.
 *
 * Cursor reactivity:
 *   Each world receives a cursorRef. Only the active world gets pointer-events.
 *   VoctermEnv: storm effect around cursor.
 *   JarvisEnv:  cursor-tracking eyes + proximity-gated content.
 *   MorpheusContent: thermal canvas trail.
 *   MikaContent: cursor X drives persona blend.
 *
 * Layout: ZERO portfolio chrome. No section labels. No nav dots. No progress rail.
 * Each world is a different application.
 */
export function ProjectWorlds() {
  const sectionRef   = useRef<HTMLElement>(null)
  const stageRef     = useRef<HTMLDivElement>(null)
  const worldRefs    = useRef<(HTMLDivElement | null)[]>([])
  const flashRef     = useRef<HTMLDivElement>(null)
  const pointFlashRef = useRef<HTMLDivElement>(null)
  const activeIdxRef  = useRef(0)

  // Per-world cursor refs — shared between env canvas and content
  const cursor0 = useRef<{ x: number; y: number }>({ x: -999, y: -999 })
  const cursor1 = useRef<{ x: number; y: number }>({ x: -999, y: -999 })
  const cursor2 = useRef<{ x: number; y: number }>({ x: -999, y: -999 })
  const cursor3 = useRef<{ x: number; y: number }>({ x: -999, y: -999 })
  const cursors  = [cursor0, cursor1, cursor2, cursor3]

  const handleMove = useCallback((i: number) => (e: React.MouseEvent) => {
    cursors[i].current = { x: e.clientX, y: e.clientY }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update pointer-events based on active world
  const setActive = useCallback((idx: number) => {
    if (activeIdxRef.current === idx) return
    activeIdxRef.current = idx
    worldRefs.current.forEach((w, i) => {
      if (!w) return
      w.style.pointerEvents = i === idx ? 'auto' : 'none'
    })
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    const stage   = stageRef.current
    if (!section || !stage) return

    const worlds = worldRefs.current.filter(Boolean) as HTMLDivElement[]
    if (worlds.length !== PROJECTS.length) return

    const ctx = gsap.context(() => {

      const N    = PROJECTS.length  // 4
      const SLOT = 1 / (N - 1)     // 0.333…

      // ── JITTER — computed once per page load ───────────────────────
      // Slight unpredictability: values vary each visit but are stable
      // during scroll so forward/backward scrub feels coherent.
      const jitter = {
        lineY:      (Math.random() - 0.5) * 8,      // horizontal line drifts ±4px
        collapseX:  (Math.random() - 0.5) * 18,     // beam dies ±9px off-center
        shiver1:    2.6 + Math.random() * 1.6,      // first shiver angle (deg)
        shiver2:    -(2.0 + Math.random() * 1.4),   // second shiver, opposite
        brightness: 11 + Math.random() * 5,         // peak brightness 11–16×
      }

      // Shorthand: build a consistent 4-function filter string so GSAP
      // can interpolate every property independently without re-ordering.
      const filt = (bl: number, br: number, sa: number, co: number) =>
        `blur(${bl}px) brightness(${br}) saturate(${sa}) contrast(${co})`

      // ── INITIAL STATES ─────────────────────────────────────────────

      // World 0 — fully visible, consistent filter format for smooth GSAP interp
      gsap.set(worlds[0], {
        opacity: 1, scaleY: 1, scaleX: 1, skewX: 0, x: 0, y: 0,
        filter: filt(0, 1, 1, 1),
        clipPath: 'inset(0% 0 0% 0)',
      })

      // World 1 — orb-point start (origin at JARVIS orb position)
      gsap.set(worlds[1], {
        opacity: 0, scale: 0.04,
        transformOrigin: '62% 48%',
        filter: filt(0, 1, 1, 1),
        clipPath: 'inset(0% 0 0% 0)',
      })

      // World 2 — starts fully clipped (top fully inset = hidden)
      gsap.set(worlds[2], { opacity: 1, filter: 'brightness(1)', clipPath: 'inset(100% 0 0% 0)' })

      // World 3 — dark void, waiting
      gsap.set(worlds[3], { opacity: 0, scale: 1.04, filter: 'brightness(1)', clipPath: 'inset(0% 0 0% 0)' })

      // Overlays — hidden
      gsap.set(flashRef.current, { opacity: 0 })
      gsap.set(pointFlashRef.current, { opacity: 0, scale: 0.0 })

      // Pointer events — only world 0 active initially
      worlds.forEach((w, i) => { w.style.pointerEvents = i === 0 ? 'auto' : 'none' })

      // ── ACCENT COLOR PROXY ─────────────────────────────────────────

      const accentRGBs = PROJECTS.map((p) => {
        const h = p.accentColor.replace('#', '')
        return { r: parseInt(h.slice(0,2), 16), g: parseInt(h.slice(2,4), 16), b: parseInt(h.slice(4,6), 16) }
      })

      // ── MASTER SCRUBBED TIMELINE ────────────────────────────────────
      //
      // Total duration = 1.0 (normalized). SLOT = 0.333 per transition.
      //
      // Transition 0→1 : 0.000 → 0.333
      // Transition 1→2 : 0.333 → 0.666
      // Transition 2→3 : 0.666 → 1.000

      const tl = gsap.timeline({ paused: true })

      // ────────────────────────────────────────────────────────────────
      // TRANSITION 0→1 — TV IMPLOSION → ORB EXPLOSION (4-phase)
      //
      // Phase 0  [0.00 → 0.11]  Pre-stress shiver
      //   Two-beat skewX oscillation — the display shows electrical
      //   instability before mechanical failure.
      //
      // Phase 1  [0.08 → 0.30]  Vertical crush with smear
      //   scaleY collapses with tv.resist ease (hesitates at ~30% then
      //   accelerates). blur() creates pixel-smear distortion so the
      //   content doesn't compress cleanly — it bleeds.
      //
      // Phase 2  [0.30 → 0.37]  Hot line
      //   Blur drops to 0. The horizontal sliver is searing white.
      //   Slight Y drift (jitter.lineY) — the electron beam isn't
      //   perfectly aligned when it fails.
      //
      // Phase 3  [0.35 → 0.43]  Point collapse + afterglow
      //   scaleX → 0, beam collapses left/right toward a point.
      //   jitter.collapseX means the dot isn't at dead center.
      //   A white radial dot (pointFlash) blooms then fades — the
      //   phosphor persistence before total darkness.
      //
      // Phase 4  [0.33 → 0.82]  JARVIS eruption
      //   Orb bursts from the same void using tv.burst ease, which
      //   overshoots scale slightly before settling (spring feel).
      //   Starts as the hot line is forming so the timing feels causal.
      // ────────────────────────────────────────────────────────────────

      const T01_START = 0
      const T01_END   = SLOT  // 0.333

      // ── Phase 0: Pre-stress shiver ──────────────────────────────────

      // Beat 1 — lean right, electricity building
      tl.to(worlds[0], {
        skewX:  jitter.shiver1,
        filter: filt(0.2, 1.7, 1.0, 1.3),
        ease:   'power3.out',
        duration: SLOT * 0.045,
      }, T01_START)

      // Beat 2 — snap back left, harder
      tl.to(worlds[0], {
        skewX:  jitter.shiver2,
        filter: filt(0.5, 2.6, 0.8, 1.5),
        ease:   'power2.inOut',
        duration: SLOT * 0.045,
      }, T01_START + SLOT * 0.045)

      // Beat 3 — return to center, about to give
      tl.to(worlds[0], {
        skewX:  0,
        filter: filt(0.3, 2.0, 0.6, 1.4),
        ease:   'power2.out',
        duration: SLOT * 0.030,
      }, T01_START + SLOT * 0.090)

      // ── Phase 1: Vertical crush with smear ─────────────────────────

      tl.to(worlds[0], {
        scaleY:  0.016,
        scaleX:  1.14,
        // blur() is the key: pixels smear as they compress.
        // Brightness overshoots so the smear looks overexposed.
        filter:  filt(3.0, jitter.brightness, 0, 0.55),
        ease:    'tv.resist',
        duration: SLOT * 0.22,
      }, T01_START + SLOT * 0.08)

      // ── Phase 2: Hot line forms — blur clears, line is blinding ────

      tl.to(worlds[0], {
        y:      jitter.lineY,
        filter: filt(0, jitter.brightness * 1.5, 0, 1.0),
        ease:   'power3.out',
        duration: SLOT * 0.06,
      }, T01_START + SLOT * 0.30)

      // ── Phase 3: Point collapse ──────────────────────────────────

      tl.to(worlds[0], {
        scaleX:  0,
        x:       jitter.collapseX,
        opacity: 0,
        filter:  filt(5, jitter.brightness * 2.5, 0, 1.0),
        ease:    'power4.in',
        duration: SLOT * 0.075,
      }, T01_START + SLOT * 0.355)

      // Point-flash: phosphor afterglow at collapse point
      tl.to(pointFlashRef.current, {
        opacity: 1,
        scale:   1,
        ease:    'power4.out',
        duration: SLOT * 0.025,
      }, T01_START + SLOT * 0.400)

      tl.to(pointFlashRef.current, {
        opacity: 0,
        scale:   4.5,
        ease:    'power2.in',
        duration: SLOT * 0.120,
      }, T01_START + SLOT * 0.425)

      // ── Phase 4: JARVIS eruption ────────────────────────────────────
      // Starts just as the hot line is forming — feels causal, not delayed.
      // tv.burst overshoots scale ~1.02 then settles to 1.

      tl.to(worlds[1], {
        scale:   1,
        opacity: 1,
        ease:    'tv.burst',
        duration: SLOT * 0.50,
      }, T01_START + SLOT * 0.33)

      // Accent: vocterm-green → JARVIS-blue
      const proxy01 = { ...accentRGBs[0] }
      tl.to(proxy01, {
        r: accentRGBs[1].r, g: accentRGBs[1].g, b: accentRGBs[1].b,
        duration: SLOT,
        ease: 'none',
        onUpdate() {
          document.documentElement.style.setProperty(
            '--color-accent',
            `rgb(${Math.round(proxy01.r)},${Math.round(proxy01.g)},${Math.round(proxy01.b)})`
          )
        },
      }, T01_START)

      // Pointer events: hand off from world 0 → world 1 at midpoint
      tl.call(() => setActive(1), [], T01_START + SLOT * 0.5)

      // ────────────────────────────────────────────────────────────────
      // TRANSITION 1→2 — FORENSIC SCAN WIPE
      // ────────────────────────────────────────────────────────────────

      const T12_START = SLOT
      const T12_END   = SLOT * 2

      // JARVIS: scanned away — clip from bottom (bottom inset grows → wipes up)
      tl.to(worlds[1], {
        clipPath: 'inset(0% 0 100% 0)',
        ease:     'power2.inOut',
        duration: SLOT * 0.42,
      }, T12_START)

      // Morpheus: revealed by scan from top (top inset shrinks → wipes down)
      tl.to(worlds[2], {
        clipPath: 'inset(0% 0 0% 0)',
        ease:     'power2.inOut',
        duration: SLOT * 0.42,
      }, T12_START)

      // Accent: JARVIS-blue → Morpheus-orange
      const proxy12 = { ...accentRGBs[1] }
      tl.to(proxy12, {
        r: accentRGBs[2].r, g: accentRGBs[2].g, b: accentRGBs[2].b,
        duration: SLOT,
        ease: 'none',
        onUpdate() {
          document.documentElement.style.setProperty(
            '--color-accent',
            `rgb(${Math.round(proxy12.r)},${Math.round(proxy12.g)},${Math.round(proxy12.b)})`
          )
        },
      }, T12_START)

      tl.call(() => setActive(2), [], T12_START + SLOT * 0.5)

      // ────────────────────────────────────────────────────────────────
      // TRANSITION 2→3 — OVEREXPOSURE FLASH → VOID
      // ────────────────────────────────────────────────────────────────

      const T23_START = SLOT * 2
      const T23_END   = SLOT * 3  // 1.0

      // Morpheus: overexposes toward white
      tl.to(worlds[2], {
        filter:  'brightness(4) saturate(0)',
        ease:    'power2.in',
        duration: SLOT * 0.20,
      }, T23_START)

      // Flash overlay peaks
      tl.to(flashRef.current, {
        opacity:  1,
        ease:     'power3.in',
        duration: SLOT * 0.14,
      }, T23_START + SLOT * 0.14)

      // Morpheus vanishes behind the flash
      tl.to(worlds[2], {
        opacity:  0,
        duration: 0.001,
      }, T23_START + SLOT * 0.22)

      // Flash fades to black — Mika emerges
      tl.to(flashRef.current, {
        opacity:  0,
        ease:     'power2.out',
        duration: SLOT * 0.24,
      }, T23_START + SLOT * 0.22)

      // Mika: fades in + settles from slight scale
      tl.to(worlds[3], {
        opacity:  1,
        scale:    1,
        ease:     'power2.out',
        duration: SLOT * 0.38,
      }, T23_START + SLOT * 0.24)

      // Accent: Morpheus-orange → Mika-violet
      const proxy23 = { ...accentRGBs[2] }
      tl.to(proxy23, {
        r: accentRGBs[3].r, g: accentRGBs[3].g, b: accentRGBs[3].b,
        duration: SLOT,
        ease: 'none',
        onUpdate() {
          document.documentElement.style.setProperty(
            '--color-accent',
            `rgb(${Math.round(proxy23.r)},${Math.round(proxy23.g)},${Math.round(proxy23.b)})`
          )
        },
      }, T23_START)

      tl.call(() => setActive(3), [], T23_START + SLOT * 0.5)

      // ── SINGLE SCROLLTRIGGER — PIN + SCRUB ────────────────────────
      ScrollTrigger.create({
        trigger:    section,
        start:      'top top',
        end:        () => `+=${(N - 1) * window.innerHeight}`,
        pin:        stage,
        pinSpacing: true,
        scrub:      1.4,
        animation:  tl,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (st) => {
          // Smooth active index tracking for pointer events
          const idx = Math.min(N - 1, Math.round(st.progress * (N - 1)))
          setActive(idx)
        },
      })

    }, section)

    return () => ctx.revert()
  }, [setActive]) // eslint-disable-line react-hooks/exhaustive-deps

  const worldContents = [
    <VoctermContent  key="vocterm-c"  />,
    <JarvisContent   key="jarvis-c"   />,
    <MorpheusContent key="morpheus-c" />,
    <MikaContent     key="mika-c"     />,
  ]

  const worldEnvs = [
    <VoctermEnv   key="vocterm-e"  cursorRef={cursor0} />,
    <JarvisEnv    key="jarvis-e"   cursorRef={cursor1} />,
    <MorpheusEnv  key="morpheus-e" />,
    <MikaEnv      key="mika-e"     />,
  ]

  return (
    <section
      ref={sectionRef}
      id="projects"
      aria-label="Projects"
    >
      <div
        ref={stageRef}
        className="relative w-full h-screen overflow-hidden bg-[#050505]"
      >

        {/* ── Worlds ─────────────────────────────────────────────── */}
        {PROJECTS.map((project, i) => (
          <div
            key={project.id}
            ref={(el) => { worldRefs.current[i] = el }}
            className="world-container absolute inset-0 will-transform"
            data-project={project.id}
            style={{ pointerEvents: i === 0 ? 'auto' : 'none' }}
            onMouseMove={handleMove(i)}
          >
            {/* Generative environment canvas */}
            {worldEnvs[i]}

            {/* Ambient color bloom */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 65% 55% at 50% 65%, ${project.accentColorDim} 0%, transparent 70%)`,
                zIndex: 2,
              }}
            />

            {/* World-specific content application */}
            {worldContents[i]}
          </div>
        ))}

        {/* ── Overexposure flash overlay (Morpheus → Mika) ────────── */}
        <div
          ref={flashRef}
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: '#ffffff', zIndex: 50, opacity: 0 }}
        />

        {/* ── Phosphor afterglow dot (TV collapse point) ───────────── */}
        {/* Pinned to center — the exact point where the beam dies.     */}
        {/* Blooms outward from scale 0 → 4.5 while fading to 0.       */}
        <div
          ref={pointFlashRef}
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top:  '50%',
            width:  '6px',
            height: '6px',
            marginLeft: '-3px',
            marginTop:  '-3px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 30%, transparent 70%)',
            boxShadow: '0 0 12px 4px rgba(255,255,255,0.8), 0 0 40px 12px rgba(255,255,255,0.3)',
            zIndex: 55,
            opacity: 0,
            transformOrigin: 'center',
          }}
        />

      </div>
    </section>
  )
}
