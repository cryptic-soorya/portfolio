'use client'

/**
 * PHASE 8 — EXIT PORTAL
 *
 * Hold-to-unlock interaction. A glowing orbital ring sits center-screen.
 * User presses and holds it for 2.2s to charge the connection.
 * On completion: ring explodes, screen flashes, contact materialises.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from '@/lib/animations/gsap.config'
import { SITE } from '@/lib/data/site'

// ─── Ring geometry ─────────────────────────────────────────────────────────────

const R            = 68
const STROKE_W     = 1.5
const SVG_D        = (R + 24) * 2
const CXY          = SVG_D / 2
const CIRC         = 2 * Math.PI * R
const HOLD_MS      = 2200
const N_PARTICLES  = 10

type Phase = 'locked' | 'charging' | 'revealed'

// ─── Typewriter ────────────────────────────────────────────────────────────────

function typewrite(
  text: string,
  speed: number,
  onFrame: (t: string) => void,
  onDone: () => void,
): () => void {
  let i = 0
  let cancelled = false
  const next = () => {
    if (cancelled) return
    i++
    onFrame(text.slice(0, i))
    if (i < text.length) setTimeout(next, speed + Math.random() * speed * 0.5)
    else onDone()
  }
  setTimeout(next, speed)
  return () => { cancelled = true }
}

// ─── Particle position helper ──────────────────────────────────────────────────

function particlePos(i: number, total: number, r: number) {
  const angle = (i / total) * Math.PI * 2 - Math.PI / 2
  return {
    x: CXY + Math.cos(angle) * r,
    y: CXY + Math.sin(angle) * r,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContactPortal() {
  const sectionRef   = useRef<HTMLElement>(null)
  const gatewayRef   = useRef<HTMLDivElement>(null)
  const ringRef      = useRef<SVGCircleElement>(null)
  const glowRef      = useRef<SVGCircleElement>(null)
  const fillRef      = useRef<SVGCircleElement>(null)
  const flashRef     = useRef<HTMLDivElement>(null)
  const contentRef   = useRef<HTMLDivElement>(null)
  const footerRef    = useRef<HTMLDivElement>(null)
  const particleRefs = useRef<(HTMLDivElement | null)[]>([])
  const scanRef      = useRef<HTMLDivElement>(null)

  const [phase,        setPhase]        = useState<Phase>('locked')
  const [labelText,    setLabelText]    = useState('HOLD TO ESTABLISH CONNECTION')
  const [statusMsg,    setStatusMsg]    = useState('')
  const [copied,       setCopied]       = useState<number | null>(null)
  const [footerVis,    setFooterVis]    = useState(false)

  const holdStartRef    = useRef<number | null>(null)
  const rafRef          = useRef<number | null>(null)
  const chargeRef       = useRef(0)
  const phaseRef        = useRef<Phase>('locked')
  // Direct DOM refs for charge display — bypasses React re-render on every RAF tick.
  const chargePercentRef = useRef<HTMLParagraphElement>(null)
  const chargeBarRef     = useRef<HTMLDivElement>(null)

  // Keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase }, [phase])

  // ── Scanline (ambient) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!scanRef.current) return
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 5 })
    tl.fromTo(scanRef.current,
      { top: '-2px', opacity: 0.4 },
      { top: '100%', opacity: 0, duration: 2.5, ease: 'none' }
    )
    return () => { tl.kill() }
  }, [])

  // ── Particle ambient pulse ──────────────────────────────────────────────────
  useEffect(() => {
    const tls: gsap.core.Tween[] = []
    particleRefs.current.forEach((p, i) => {
      if (!p) return
      const tl = gsap.to(p, {
        opacity: 0.15,
        scale: 0.5,
        duration: 1.2 + i * 0.18,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.13,
      })
      tls.push(tl)
    })
    return () => { tls.forEach(t => t.kill()) }
  }, [])

  // ── Unlock sequence ─────────────────────────────────────────────────────────
  const triggerUnlock = useCallback(() => {
    if (phaseRef.current === 'revealed') return
    setPhase('revealed')
    phaseRef.current = 'revealed'
    setLabelText('CONNECTION ESTABLISHED')

    const tl = gsap.timeline()

    // Ring burst
    tl.to(ringRef.current, {
      attr: { r: R * 5, 'stroke-width': 0.3 },
      opacity: 0,
      duration: 0.65,
      ease: 'power2.out',
    }, 0)

    // Glow burst
    tl.to(glowRef.current, {
      attr: { r: R * 5, 'stroke-width': 0.3 },
      opacity: 0,
      duration: 0.65,
      ease: 'power2.out',
    }, 0)

    // Fill ring disappears
    tl.to(fillRef.current, { opacity: 0, duration: 0.2 }, 0)

    // Particles scatter outward
    particleRefs.current.forEach((p, i) => {
      if (!p) return
      const angle = (i / N_PARTICLES) * Math.PI * 2 - Math.PI / 2
      const dist  = 220 + Math.random() * 180
      tl.to(p, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        opacity: 0,
        scale: 0.3,
        duration: 0.75,
        ease: 'power3.out',
      }, 0)
    })

    // White flash
    tl.set(flashRef.current, { opacity: 1 }, 0.18)
    tl.to(flashRef.current, { opacity: 0, duration: 0.55, ease: 'power2.out' }, 0.22)

    // Gateway collapses
    tl.to(gatewayRef.current, {
      scale: 0.3,
      opacity: 0,
      duration: 0.45,
      ease: 'power3.in',
    }, 0.08)

    // Content reveals
    tl.fromTo(contentRef.current,
      { opacity: 0, y: 28, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: 'power2.out' },
      0.52,
    )

    // Status typewrite
    tl.add(() => {
      typewrite('> CONNECTION ESTABLISHED — AWAITING INPUT_', 16, setStatusMsg, () => {})
    }, 0.85)

    // Footer
    tl.add(() => { setFooterVis(true) }, 1.1)
  }, [])

  // ── Charging RAF loop ───────────────────────────────────────────────────────
  const startCharging = useCallback(() => {
    if (phaseRef.current !== 'locked') return
    setPhase('charging')
    holdStartRef.current = performance.now()

    const tick = (now: number) => {
      if (!holdStartRef.current) return
      const progress = Math.min((now - holdStartRef.current) / HOLD_MS, 1)
      chargeRef.current = progress

      // Write directly to DOM — avoids triggering a React re-render every frame.
      if (fillRef.current)
        fillRef.current.style.strokeDashoffset = String(CIRC * (1 - progress))
      if (chargeBarRef.current)
        chargeBarRef.current.style.width = `${progress * 100}%`
      if (chargePercentRef.current)
        chargePercentRef.current.textContent = `${Math.round(progress * 100)}%`

      if (progress >= 1) {
        triggerUnlock()
      } else {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [triggerUnlock])

  const stopCharging = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    holdStartRef.current = null
    if (phaseRef.current === 'charging') {
      setPhase('locked')
      const start   = chargeRef.current
      const began   = performance.now()
      const drainMs = 500

      const drain = (now: number) => {
        const t = Math.min((now - began) / drainMs, 1)
        const v = start * (1 - t * t * t)
        chargeRef.current = v
        if (fillRef.current)
          fillRef.current.style.strokeDashoffset = String(CIRC * (1 - v))
        if (chargeBarRef.current)
          chargeBarRef.current.style.width = `${v * 100}%`
        if (chargePercentRef.current)
          chargePercentRef.current.textContent = `${Math.round(v * 100)}%`
        if (t < 1) requestAnimationFrame(drain)
        else chargeRef.current = 0
      }
      requestAnimationFrame(drain)
    }
  }, [])

  // Pulse label when charging
  useEffect(() => {
    if (phase === 'charging') {
      setLabelText('CHARGING…')
    } else if (phase === 'locked') {
      setLabelText('HOLD TO ESTABLISH CONNECTION')
    }
  }, [phase])

  const handleCopy = useCallback((email: string, idx: number) => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(idx)
      setTimeout(() => setCopied(null), 2000)
    })
  }, [])

  // ── Contact data ────────────────────────────────────────────────────────────
  const cards = [
    { command: '$ connect --channel email',   label: SITE.contact.email,                        url: `mailto:${SITE.contact.email}`, accent: '#4ade80', copy: SITE.contact.email },
    { command: '$ open --profile linkedin',   label: 'linkedin.com/in/sooryasijin',             url: SITE.contact.links[1].url,       accent: '#60a5fa' },
    { command: '$ open --profile github',     label: 'github.com/cryptic-soorya',                  url: SITE.contact.links[2].url,       accent: '#a78bfa' },
  ]

  return (
    <section
      ref={sectionRef}
      aria-label="Contact portal"
      style={{
        background: '#020202',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
      }}
    >
      {/* Grid noise */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),' +
          'linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Scanline */}
      <div ref={scanRef} aria-hidden style={{
        position: 'absolute', left: 0, right: 0, height: '1px', top: '-2px',
        background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* White flash overlay */}
      <div ref={flashRef} aria-hidden style={{
        position: 'absolute', inset: 0, background: '#fff', opacity: 0,
        pointerEvents: 'none', zIndex: 10,
      }} />

      {/* Corner brackets */}
      {(['tl','tr','bl','br'] as const).map(pos => (
        <CornerBracket key={pos} pos={pos} active={phase === 'revealed'} />
      ))}

      {/* ── GATEWAY (hold zone) ────────────────────────────────────────────── */}
      <div
        ref={gatewayRef}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          opacity: phase === 'revealed' ? 0 : 1,
          pointerEvents: phase === 'revealed' ? 'none' : 'auto',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* System label */}
        <p className="font-mono" style={{
          fontSize: '9px', letterSpacing: '0.35em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.2)',
        }}>
          exit_portal.sys — phase 08
        </p>

        {/* Ring + particles */}
        <div
          style={{ position: 'relative', width: SVG_D, height: SVG_D, cursor: 'pointer' }}
          onMouseDown={startCharging}
          onMouseUp={stopCharging}
          onMouseLeave={stopCharging}
          onTouchStart={e => { e.preventDefault(); startCharging() }}
          onTouchEnd={stopCharging}
          onTouchCancel={stopCharging}
        >
          {/* Ambient particles */}
          {Array.from({ length: N_PARTICLES }, (_, i) => {
            const pos = particlePos(i, N_PARTICLES, R)
            return (
              <div
                key={i}
                ref={el => { particleRefs.current[i] = el }}
                aria-hidden
                style={{
                  position: 'absolute',
                  left: pos.x - 2,
                  top:  pos.y - 2,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: phase === 'charging'
                    ? `hsl(${(i / N_PARTICLES) * 120 + 120}, 80%, 65%)`
                    : 'rgba(255,255,255,0.55)',
                  boxShadow: phase === 'charging'
                    ? `0 0 8px hsl(${(i / N_PARTICLES) * 120 + 120}, 80%, 65%)`
                    : '0 0 4px rgba(255,255,255,0.3)',
                  opacity: 0.45,
                  transition: 'background 0.3s ease, box-shadow 0.3s ease',
                  pointerEvents: 'none',
                }}
              />
            )
          })}

          {/* SVG ring */}
          <svg
            width={SVG_D} height={SVG_D}
            style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
          >
            <defs>
              <filter id="glow-ring">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Track ring */}
            <circle
              cx={CXY} cy={CXY} r={R}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={STROKE_W}
            />

            {/* Glow ring (outer) */}
            <circle
              ref={glowRef}
              cx={CXY} cy={CXY} r={R}
              fill="none"
              stroke="rgba(74,222,128,0.12)"
              strokeWidth={8}
              filter="url(#glow-ring)"
              style={{
                transition: 'opacity 0.3s ease',
                opacity: phase === 'charging' ? 1 : 0.3,
              }}
            />

            {/* Charge fill */}
            <circle
              ref={fillRef}
              cx={CXY} cy={CXY} r={R}
              fill="none"
              stroke={phase === 'charging' ? '#4ade80' : 'rgba(255,255,255,0.25)'}
              strokeWidth={STROKE_W + 0.5}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC}
              transform={`rotate(-90 ${CXY} ${CXY})`}
              filter="url(#glow-ring)"
              style={{ transition: 'stroke 0.3s ease' }}
            />

            {/* Pulse ring */}
            <circle
              ref={ringRef}
              cx={CXY} cy={CXY} r={R}
              fill="none"
              stroke="rgba(74,222,128,0.6)"
              strokeWidth={STROKE_W}
            />
          </svg>

          {/* Center dot + charge % */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '6px',
          }}>
            <div style={{
              width: phase === 'charging' ? 10 : 6,
              height: phase === 'charging' ? 10 : 6,
              borderRadius: '50%',
              background: phase === 'charging' ? '#4ade80' : 'rgba(255,255,255,0.5)',
              boxShadow: phase === 'charging' ? '0 0 20px #4ade80' : '0 0 8px rgba(255,255,255,0.4)',
              transition: 'width 0.2s ease, height 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
            }} />
            {phase === 'charging' && (
              <p ref={chargePercentRef} className="font-mono" style={{
                fontSize: '9px', color: '#4ade80', letterSpacing: '0.15em',
                fontVariantNumeric: 'tabular-nums',
              }}>
                0%
              </p>
            )}
          </div>
        </div>

        {/* Label */}
        <div style={{ textAlign: 'center' }}>
          <p className="font-mono" style={{
            fontSize: '10px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: phase === 'charging' ? '#4ade80' : 'rgba(255,255,255,0.3)',
            transition: 'color 0.3s ease',
          }}>
            {labelText}
          </p>
          {phase === 'locked' && (
            <p className="font-mono" style={{
              fontSize: '8px', letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.12)', marginTop: '8px',
            }}>
              press and hold the ring
            </p>
          )}
        </div>

        {/* Charge bar (bottom) */}
        <div style={{
          width: 180,
          height: 1,
          background: 'rgba(255,255,255,0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div ref={chargeBarRef} style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: '0%',
            background: 'linear-gradient(90deg, #4ade8066, #4ade80)',
            boxShadow: '0 0 12px #4ade8088',
          }} />
        </div>
      </div>

      {/* ── REVEALED CONTENT ───────────────────────────────────────────────── */}
      <div
        ref={contentRef}
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '680px',
          opacity: 0,
          pointerEvents: phase === 'revealed' ? 'auto' : 'none',
        }}
      >
        {/* System label */}
        <p className="font-mono" style={{
          fontSize: '9px', letterSpacing: '0.35em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.18)', marginBottom: '52px',
        }}>
          exit_portal.sys — terminal bridge
        </p>

        {/* Heading */}
        <h2 className="font-mono" style={{
          fontSize: 'clamp(28px, 5vw, 52px)',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.92)',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginBottom: '18px',
        }}>
          Let&apos;s build <em style={{ fontStyle: 'italic' }}>something.</em>
        </h2>

        {/* Subtext */}
        <p className="font-mono" style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.04em',
          marginBottom: '60px',
        }}>
          {SITE.contact.subtext}
        </p>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cards.map((card, i) => (
            <ContactCard
              key={card.label}
              card={card}
              isCopied={copied === i}
              onCopy={card.copy ? () => handleCopy(card.copy!, i) : undefined}
            />
          ))}
        </div>

        {/* Status */}
        <div className="font-mono" style={{
          marginTop: '52px', fontSize: '10px',
          letterSpacing: '0.2em', color: 'rgba(74,222,128,0.5)',
          minHeight: '14px',
        }}>
          {statusMsg}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        ref={footerRef}
        style={{
          position: 'absolute', bottom: '32px', left: 0, right: 0,
          padding: '0 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          opacity: footerVis ? 1 : 0,
          transition: 'opacity 1.4s ease',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <p className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.14)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          {SITE.footer.left}
        </p>
        <p className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.14)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          {SITE.footer.right}
        </p>
      </footer>

      {/* Blink keyframe */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeOut { 0%{opacity:1} 80%{opacity:1} 100%{opacity:0} }
      `}</style>
    </section>
  )
}

// ─── Contact Card ─────────────────────────────────────────────────────────────

interface CardData {
  command: string
  label: string
  url: string
  accent: string
  copy?: string
}

function ContactCard({ card, isCopied, onCopy }: {
  card: CardData
  isCopied: boolean
  onCopy?: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={card.url}
      target={card.copy ? undefined : '_blank'}
      rel="noopener noreferrer"
      onClick={onCopy ? (e) => { e.preventDefault(); onCopy() } : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '2px',
        border: `1px solid ${hovered ? card.accent + '55' : 'rgba(255,255,255,0.06)'}`,
        background: hovered ? `${card.accent}07` : 'rgba(255,255,255,0.02)',
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'border-color 0.25s ease, background 0.25s ease',
      }}
    >
      {/* Left glow bar */}
      <div aria-hidden style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: hovered ? '3px' : '0px',
        background: card.accent,
        boxShadow: hovered ? `0 0 16px ${card.accent}88` : 'none',
        transition: 'width 0.2s ease, box-shadow 0.2s ease',
      }} />

      <p className="font-mono" style={{
        fontSize: '9px', color: `${card.accent}66`,
        letterSpacing: '0.2em', marginBottom: '5px',
      }}>
        {card.command}
      </p>

      <p className="font-mono" style={{
        fontSize: '14px',
        color: hovered ? card.accent : 'rgba(255,255,255,0.72)',
        letterSpacing: '0.04em',
        transition: 'color 0.2s ease',
      }}>
        {card.label}
      </p>

      {isCopied && (
        <span className="font-mono" style={{
          position: 'absolute', right: '16px', top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '9px', color: card.accent,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          animation: 'fadeOut 2s ease forwards',
        }}>
          COPIED
        </span>
      )}
    </a>
  )
}

// ─── Corner Bracket ───────────────────────────────────────────────────────────

function CornerBracket({ pos, active }: { pos: 'tl'|'tr'|'bl'|'br'; active: boolean }) {
  const isTop  = pos === 'tl' || pos === 'tr'
  const isLeft = pos === 'tl' || pos === 'bl'
  const c = active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)'

  return (
    <div aria-hidden style={{
      position: 'absolute',
      width: 28, height: 28,
      borderTop:    isTop  ? `1px solid ${c}` : 'none',
      borderBottom: !isTop ? `1px solid ${c}` : 'none',
      borderLeft:   isLeft  ? `1px solid ${c}` : 'none',
      borderRight:  !isLeft ? `1px solid ${c}` : 'none',
      top:    isTop  ? 24 : undefined,
      bottom: !isTop ? 24 : undefined,
      left:   isLeft  ? 24 : undefined,
      right:  !isLeft ? 24 : undefined,
      transition: 'border-color 0.8s ease',
      zIndex: 1,
      pointerEvents: 'none',
    }} />
  )
}
