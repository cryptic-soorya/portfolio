'use client'

import { useRef, useCallback, useEffect } from 'react'
import { gsap } from '@/lib/animations/gsap.config'
import { PROJECTS } from '@/lib/data/projects'

const P = PROJECTS[3]

/**
 * MikaContent — dual-persona split.
 *
 * Left half = TUTOR (cold, clipped, demanding)
 * Right half = COMPANION (warm, soft, open)
 *
 * Cursor X position (0→1 across viewport) determines which persona dominates.
 * At center: Mika's name reveals itself.
 * No portfolio chrome.
 */
export function MikaContent() {
  const containerRef = useRef<HTMLDivElement>(null)
  const tutorRef     = useRef<HTMLDivElement>(null)
  const companionRef = useRef<HTMLDivElement>(null)
  const nameRef      = useRef<HTMLDivElement>(null)
  const blendRef     = useRef(0.5)

  // On mount: name reveals automatically — not cursor-gated
  useEffect(() => {
    if (!nameRef.current) return
    gsap.set(nameRef.current, { opacity: 0, y: 16 })
    gsap.to(nameRef.current, {
      opacity: 1, y: 0, duration: 1.1, delay: 0.4, ease: 'power3.out',
    })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const norm  = e.clientX / window.innerWidth   // 0 = left, 1 = right

    // Tutor: fully visible left, fades right
    const tutorAlpha     = Math.max(0, 1 - norm * 2.2)
    // Companion: fully visible right, fades left
    const companionAlpha = Math.max(0, (norm - 0.15) * 2.2)

    // Persona panels respond to cursor — name stays visible always
    gsap.to(tutorRef.current,     { opacity: Math.min(1, tutorAlpha),     duration: 0.45, ease: 'power2.out', overwrite: 'auto' })
    gsap.to(companionRef.current, { opacity: Math.min(1, companionAlpha), duration: 0.45, ease: 'power2.out', overwrite: 'auto' })
    // Name: keep visible, slight scale pulse toward cursor center
    const centerProximity = 1 - Math.abs(norm - 0.5) * 1.5
    const nameScale = 1 + Math.max(0, centerProximity) * 0.03
    gsap.to(nameRef.current,      { scale: nameScale, duration: 0.4, ease: 'power2.out', overwrite: 'auto' })
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ zIndex: 10 }}
      onMouseMove={handleMouseMove}
    >

      {/* ── TUTOR — left persona ──────────────────────── */}
      <div
        ref={tutorRef}
        className="absolute flex flex-col justify-center"
        style={{
          left:    '5%',
          top:     '50%',
          transform: 'translateY(-50%)',
          width:   '36%',
          opacity: 0.7,
        }}
      >
        <div
          className="font-mono text-[9px] tracking-[0.5em] uppercase mb-6"
          style={{ color: 'rgba(167,139,250,0.35)' }}
        >
          TUTOR MODE
        </div>

        <div
          className="font-sans font-bold leading-[1.15] tracking-[-0.02em] mb-5"
          style={{ fontSize: 'clamp(1.4rem,2.8vw,2.8rem)', color: 'rgba(255,255,255,0.85)' }}
        >
          Focus.<br />
          NEET is in<br />
          90 days.
        </div>

        <p
          className="font-mono text-[11px] leading-[1.9]"
          style={{ color: 'rgba(167,139,250,0.4)' }}
        >
          $ mika --mode=strict<br />
          &gt; quiz: cardiovascular<br />
          &gt; 24 questions loaded<br />
          &gt; time_limit: 18min<br />
          &gt; no hints. start?
        </p>

        <div className="mt-6 h-px w-12" style={{ background: 'rgba(167,139,250,0.25)' }} />
        <p
          className="mt-4 font-mono text-[9px] tracking-[0.2em]"
          style={{ color: 'rgba(167,139,250,0.2)' }}
        >
          PDF context · quiz gen · mistake log
        </p>
      </div>

      {/* ── COMPANION — right persona ──────────────────── */}
      <div
        ref={companionRef}
        className="absolute flex flex-col justify-center"
        style={{
          right:   '5%',
          top:     '50%',
          transform: 'translateY(-50%)',
          width:   '36%',
          textAlign: 'right',
          opacity: 0.1,
        }}
      >
        <div
          className="font-mono text-[9px] tracking-[0.5em] uppercase mb-6"
          style={{ color: 'rgba(192,132,252,0.35)' }}
        >
          COMPANION MODE
        </div>

        <div
          className="font-sans font-light italic leading-[1.4]"
          style={{ fontSize: 'clamp(1.2rem,2.3vw,2.4rem)', color: 'rgba(255,255,255,0.7)' }}
        >
          It's okay to be<br />
          overwhelmed.<br />
          Want to talk it through?
        </div>

        <p
          className="mt-5 font-sans text-[clamp(0.78rem,1.05vw,0.9rem)] leading-[1.9]"
          style={{ color: 'rgba(192,132,252,0.4)' }}
        >
          Voice mode on. I'm listening.<br />
          Your notes are loaded.<br />
          We'll go slow.
        </p>

        <div className="mt-6 h-px ml-auto w-12" style={{ background: 'rgba(192,132,252,0.25)' }} />
        <p
          className="mt-4 font-mono text-[9px] tracking-[0.2em]"
          style={{ color: 'rgba(192,132,252,0.2)' }}
        >
          neural TTS · mic input · free tier
        </p>
      </div>

      {/* ── CENTER — Mika identity, always visible ── */}
      <div
        ref={nameRef}
        className="absolute left-1/2 top-1/2"
        style={{ transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', width: '90%', maxWidth: '780px' }}
      >
        {/* Index */}
        <div className="font-mono text-[9px] tracking-[0.5em] uppercase mb-4" style={{ color: 'rgba(167,139,250,0.28)' }}>
          04 / 04
        </div>
        {/* Name */}
        <h2
          className="font-sans font-bold tracking-[-0.04em] leading-[0.9] mb-4"
          style={{ fontSize: 'clamp(4.5rem,10vw,11rem)', color: 'var(--color-text-primary)' }}
        >
          {P.name}
        </h2>
        {/* Accent rule */}
        <div className="mx-auto mb-4 h-px w-10" style={{ background: '#a78bfa', opacity: 0.5 }} />
        {/* Tagline */}
        <p
          className="font-sans italic text-[clamp(0.88rem,1.3vw,1.1rem)] mb-3"
          style={{ color: 'rgba(167,139,250,0.62)' }}
        >
          {P.tagline}
        </p>
        {/* Description — 2 sentences */}
        <p
          className="font-sans text-[clamp(0.70rem,0.95vw,0.82rem)] leading-[1.7] mx-auto max-w-[32rem]"
          style={{ color: 'rgba(255,255,255,0.28)' }}
        >
          {P.description.split('.').slice(0, 2).join('.')}.
        </p>
        {/* Year + link */}
        <div className="mt-5 font-mono text-[9px] tracking-[0.5em] uppercase" style={{ color: 'rgba(167,139,250,0.3)' }}>
          {P.year} · {P.link.url ? (
            <a href={P.link.url} target="_blank" rel="noopener noreferrer"
              style={{ color: 'rgba(167,139,250,0.55)', pointerEvents: 'auto' }}>
              Live ↗
            </a>
          ) : 'AI companion'}
        </div>
      </div>

      {/* ── Movement hint ─────────────────────────────── */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8"
        style={{ pointerEvents: 'none' }}
      >
        <span className="font-mono text-[8px] tracking-[0.4em] uppercase" style={{ color: 'rgba(167,139,250,0.15)' }}>
          ← tutor
        </span>
        <div className="w-px h-3" style={{ background: 'rgba(167,139,250,0.12)' }} />
        <span className="font-mono text-[8px] tracking-[0.4em] uppercase" style={{ color: 'rgba(167,139,250,0.15)' }}>
          companion →
        </span>
      </div>
    </div>
  )
}
