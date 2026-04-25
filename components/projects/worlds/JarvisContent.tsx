'use client'

import { useRef, useEffect } from 'react'
import { gsap } from '@/lib/animations/gsap.config'
import { PROJECTS } from '@/lib/data/projects'

const P = PROJECTS[1]

// Orb home fractions — must match JarvisEnv
const ORB_FX = 0.62
const ORB_FY = 0.48

// JARVIS startup transcript shown on close approach
const TRANSCRIPT = [
  '> JARVIS initialised · M4 · 16GB',
  '> Whisper loaded  (base.en)',
  '> MLX model: mistral-7b-q4',
  '> Voice: active · zero telemetry',
  '> All on-device. Nothing leaves.',
]

type State = 'IDLE' | 'LISTENING' | 'THINKING'

const STATE_META: Record<State, { dot: string; rgba: string; label: string }> = {
  IDLE:      { dot: '#ec4899', rgba: 'rgba(236,72,153,',  label: 'IDLE · M4'  },
  LISTENING: { dot: '#4ade80', rgba: 'rgba(74,222,128,',  label: 'LISTENING'  },
  THINKING:  { dot: '#60a5fa', rgba: 'rgba(96,165,250,',  label: 'THINKING'   },
}

/**
 * JarvisContent — scroll-entry reveal + proximity-reactive depth layers.
 *
 * Entry (auto, no cursor needed):
 *   mount        → state indicator pulses in
 *   0.3s delay   → name materialises (fade + slide)
 *   0.55s delay  → tagline follows
 *
 * Proximity layers (cursor-to-orb distance):
 *   > 400px  state = IDLE      · name + tagline always visible
 *   400–160px state = LISTENING · description + tags appear
 *   < 100px  state = THINKING  · transcript bubble appears
 *
 * "approach" hint fades out as cursor closes in.
 */
export function JarvisContent() {
  const containerRef   = useRef<HTMLDivElement>(null)
  const nameRef        = useRef<HTMLDivElement>(null)
  const taglineRef     = useRef<HTMLDivElement>(null)
  const descRef        = useRef<HTMLDivElement>(null)
  const transcriptRef  = useRef<HTMLDivElement>(null)
  const hintRef        = useRef<HTMLDivElement>(null)

  // State indicator DOM refs (updated directly — no React re-render)
  const stateRowRef    = useRef<HTMLDivElement>(null)
  const stateDotRef    = useRef<HTMLSpanElement>(null)
  const stateLabelRef  = useRef<HTMLSpanElement>(null)

  const lastState = useRef<State>('IDLE')

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // ── Initial states ─────────────────────────────────────────────────
    // Name + tagline: hidden but will auto-reveal on entry
    gsap.set([nameRef.current, taglineRef.current], { opacity: 0, y: 12 })
    // Depth layers: hidden until cursor proximity
    gsap.set([descRef.current, transcriptRef.current], { opacity: 0, x: 16 })
    gsap.set(hintRef.current, { opacity: 0 })
    gsap.set(stateRowRef.current, { opacity: 0, x: 10 })

    // ── Auto-reveal on entry ───────────────────────────────────────────
    // State indicator
    gsap.to(stateRowRef.current, {
      opacity: 1, x: 0, duration: 1.2, delay: 0.2, ease: 'power2.out',
    })
    // Name — slides up and fades in
    gsap.to(nameRef.current, {
      opacity: 1, y: 0, duration: 1.0, delay: 0.35, ease: 'power3.out',
    })
    // Tagline — follows name
    gsap.to(taglineRef.current, {
      opacity: 1, y: 0, duration: 0.9, delay: 0.58, ease: 'power3.out',
    })
    // Description — always reveals after tagline (no cursor gating)
    gsap.to(descRef.current, {
      opacity: 1, x: 0, duration: 0.85, delay: 0.85, ease: 'power2.out',
    })
    // Approach hint — fades in softly after name settles
    gsap.to(hintRef.current, {
      opacity: 1, duration: 1.0, delay: 1.1, ease: 'power2.out',
    })

    function applyState(state: State) {
      if (state === lastState.current) return
      lastState.current = state
      const m = STATE_META[state]
      if (stateDotRef.current) {
        stateDotRef.current.style.background = m.dot
        stateDotRef.current.style.boxShadow  = `0 0 10px ${m.dot}`
      }
      if (stateLabelRef.current) {
        stateLabelRef.current.textContent = m.label
        stateLabelRef.current.style.color = `${m.rgba}0.42)`
      }
    }

    function onMove(e: MouseEvent) {
      const orbX = window.innerWidth  * ORB_FX
      const orbY = window.innerHeight * ORB_FY
      const dx   = e.clientX - orbX
      const dy   = e.clientY - orbY
      const dist = Math.sqrt(dx * dx + dy * dy)

      // State machine
      let state: State = 'IDLE'
      if (dist < 100)      state = 'THINKING'
      else if (dist < 400) state = 'LISTENING'
      applyState(state)

      // Depth layers — description always visible; transcript close-in only
      // Description: base 1.0, no longer cursor-gated (set in initial reveal above)
      const transA  = Math.max(0, Math.min(1, 1 - (dist -  80) / 60))
      // Hint fades as cursor approaches (inverse)
      const hintA   = Math.max(0, Math.min(1, (dist - 100) / 200))

      // Description stays at full opacity — don't override the entry reveal
      gsap.to(descRef.current, {
        opacity: 1, x: 0,
        duration: 0.5, ease: 'power2.out', overwrite: 'auto',
      })
      gsap.to(transcriptRef.current, {
        opacity: transA, y: transA > 0.05 ? 0 : 12,
        duration: 0.42, ease: 'power2.out', overwrite: 'auto',
      })
      gsap.to(hintRef.current, {
        opacity: hintA, duration: 0.6, ease: 'power2.out', overwrite: 'auto',
      })
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>

      {/* ── State indicator — top right ───────────────────────────── */}
      <div ref={stateRowRef} className="absolute top-8 right-8 flex items-center gap-3">
        <span
          ref={stateDotRef}
          className="w-[6px] h-[6px] rounded-full flex-shrink-0"
          style={{
            background: '#ec4899',
            boxShadow: '0 0 10px #ec4899',
            animation: 'cursor-blink 2.8s ease-in-out infinite',
          }}
        />
        <span
          ref={stateLabelRef}
          className="font-mono text-[9px] tracking-[0.45em] uppercase"
          style={{ color: 'rgba(236,72,153,0.42)', transition: 'color 0.6s ease' }}
        >
          IDLE · M4
        </span>
      </div>

      {/* ── Content panel — left side ─────────────────────────────── */}
      {/* Anchored to the left third, vertically centered             */}
      <div
        className="absolute flex flex-col justify-center"
        style={{
          left:      '5%',
          top:       '50%',
          transform: 'translateY(-50%)',
          width:     '36%',
          maxWidth:  '520px',
        }}
      >
        {/* ── Identity block — auto-reveals on scroll entry ── */}
        <div ref={nameRef}>
          {/* Project label */}
          <div className="mb-4 flex items-center gap-3">
            <span
              className="font-mono text-[9px] tracking-[0.5em] uppercase"
              style={{ color: 'rgba(96,165,250,0.40)' }}
            >
              02 / 04 — {P.name}
            </span>
            <span
              className="h-px flex-1"
              style={{ background: 'rgba(96,165,250,0.14)', maxWidth: '2rem' }}
            />
          </div>

          {/* Name */}
          <h2
            className="font-sans font-bold leading-[0.88] tracking-[-0.04em]"
            style={{
              fontSize: 'clamp(3.2rem,8vw,9rem)',
              color: 'var(--color-text-primary)',
            }}
          >
            {P.name}
          </h2>

          {/* Accent rule */}
          <div
            className="mt-4 h-px"
            style={{ width: '2.5rem', background: '#60a5fa' }}
          />
        </div>

        {/* ── Tagline — follows name ── */}
        <div ref={taglineRef} className="mt-5">
          <p
            className="font-sans italic leading-[1.55]"
            style={{
              fontSize: 'clamp(0.92rem,1.45vw,1.15rem)',
              color: 'rgba(255,255,255,0.52)',
            }}
          >
            {P.tagline}
          </p>
        </div>

        {/* ── Depth layer — unlocks on cursor approach ── */}
        <div ref={descRef} className="mt-7">
          {/* Separator */}
          <div
            className="mb-5 h-px"
            style={{ background: 'rgba(255,255,255,0.06)', width: '100%' }}
          />

          <p
            className="font-sans leading-[1.85]"
            style={{
              fontSize: 'clamp(0.74rem,1.05vw,0.88rem)',
              color: 'rgba(255,255,255,0.38)',
            }}
          >
            {P.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {P.tags.slice(0, 5).map((t) => (
              <span
                key={t}
                className="font-mono text-[8px] tracking-[0.22em] uppercase px-2.5 py-1"
                style={{
                  color:      '#60a5fa',
                  border:     '1px solid rgba(96,165,250,0.18)',
                  background: 'rgba(96,165,250,0.04)',
                }}
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-5 pointer-events-auto">
            {P.link.url ? (
              <a
                href={P.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[9px] tracking-[0.3em] uppercase"
                style={{ color: 'rgba(96,165,250,0.50)' }}
              >
                GitHub ↗
              </a>
            ) : (
              <span
                className="font-mono text-[9px] tracking-[0.3em] uppercase"
                style={{ color: 'rgba(96,165,250,0.20)' }}
              >
                GitHub — soon
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Frosted glass transcript bubble ───────────────────────── */}
      {/* Appears only when cursor is very close to the orb (<~80px) */}
      <div
        ref={transcriptRef}
        className="absolute"
        style={{
          left:                 'calc(62% + 2vw)',
          top:                  'calc(48% + 8vh)',
          width:                '268px',
          background:           'rgba(6,8,20,0.82)',
          backdropFilter:       'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          border:               '1px solid rgba(96,165,250,0.14)',
          borderTop:            '1px solid rgba(96,165,250,0.30)',
          borderRadius:         '3px',
          padding:              '14px 16px 16px',
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center gap-2.5 mb-3 pb-2.5"
          style={{ borderBottom: '1px solid rgba(96,165,250,0.10)' }}
        >
          <span
            className="w-[5px] h-[5px] rounded-full flex-shrink-0"
            style={{ background: '#60a5fa', boxShadow: '0 0 7px #60a5fa' }}
          />
          <span
            className="font-mono text-[8px] tracking-[0.42em] uppercase"
            style={{ color: 'rgba(96,165,250,0.50)' }}
          >
            JARVIS · TRANSCRIPT
          </span>
        </div>

        {TRANSCRIPT.map((line, i) => (
          <div
            key={i}
            className="font-mono text-[10px] leading-[2.1]"
            style={{
              color: i === TRANSCRIPT.length - 1
                ? 'rgba(96,165,250,0.72)'
                : 'rgba(255,255,255,0.25)',
            }}
          >
            {line}
          </div>
        ))}

        <span
          className="font-mono text-[10px]"
          style={{
            color: 'rgba(96,165,250,0.72)',
            animation: 'cursor-blink 1.2s step-end infinite',
          }}
        >
          _
        </span>
      </div>

      {/* ── Approach hint — invites cursor interaction ─────────────── */}
      <div
        ref={hintRef}
        className="absolute font-mono text-[8px] tracking-[0.5em] uppercase"
        style={{
          bottom:     '2.5rem',
          left:       '5%',
          color:      'rgba(96,165,250,0.22)',
          userSelect: 'none',
        }}
      >
        approach the orb
      </div>

    </div>
  )
}
