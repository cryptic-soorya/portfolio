'use client'

import { useRef, useEffect, useCallback } from 'react'
import { PROJECTS } from '@/lib/data/projects'
import { gsap } from '@/lib/animations/gsap.config'

const P = PROJECTS[2]

const VECTORS = [
  { label: 'LIP SYNC FAILURE',        score: 0.89 },
  { label: 'EDGE BLENDING',           score: 0.72 },
  { label: 'LIGHTING INCONSISTENCY',  score: 0.53 },
  { label: 'MICRO-EXPRESSION DRIFT',  score: 0.87 },
  { label: 'TEMPORAL GLITCH',         score: 0.94 },
]

/** Renders one detection metric row */
function VectorRow({ label, score }: { label: string; score: number }) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!barRef.current) return
    gsap.fromTo(barRef.current,
      { width: '0%' },
      { width: `${score * 100}%`, duration: 1.2, ease: 'power2.out', delay: Math.random() * 0.4 }
    )
  }, [score])

  const col = score > 0.8 ? '#f97316' : score > 0.6 ? '#fb923c' : '#fdba74'

  return (
    <div className="flex items-center gap-4 py-[6px]" style={{ borderBottom: '1px solid rgba(249,115,22,0.07)' }}>
      <span
        className="font-mono text-[9px] tracking-[0.25em] uppercase flex-none"
        style={{ color: 'rgba(249,115,22,0.5)', width: '11rem' }}
      >
        {label}
      </span>

      {/* Track */}
      <div className="relative flex-1 h-px" style={{ background: 'rgba(249,115,22,0.10)' }}>
        <div
          ref={barRef}
          className="absolute top-0 left-0 h-full"
          style={{ width: 0, background: col, boxShadow: `0 0 4px ${col}` }}
        />
      </div>

      <span className="font-mono text-[10px] flex-none" style={{ color: col, width: '2.5rem', textAlign: 'right' }}>
        {(score * 100).toFixed(0)}%
      </span>
    </div>
  )
}

/**
 * MorpheusContent — forensic scan report.
 *
 * Styled as a surveillance document, not a portfolio entry.
 * Thermal cursor trail via canvas overlay.
 * Slight rotation reinforces "printed report" aesthetic.
 */
export function MorpheusContent() {
  const trailCanvasRef = useRef<HTMLCanvasElement>(null)
  const trailRef       = useRef<Array<{ x: number; y: number; age: number }>>([])
  const containerRef   = useRef<HTMLDivElement>(null)

  // Thermal cursor trail
  useEffect(() => {
    if (!trailCanvasRef.current) return
    const canvas = trailCanvasRef.current as HTMLCanvasElement
    const ctx    = canvas.getContext('2d') as CanvasRenderingContext2D

    let rafId = 0

    const setSize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    setSize()
    window.addEventListener('resize', setSize)

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      trailRef.current.forEach((pt, i) => {
        pt.age++
        const life  = 1 - pt.age / 40
        if (life <= 0) { trailRef.current.splice(i, 1); return }
        const r = 4 + (1 - life) * 8
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(249, 115, 22, ${life * 0.45})`
        ctx.shadowColor = '#f97316'
        ctx.shadowBlur  = 10 * life
        ctx.fill()
        ctx.shadowBlur = 0
      })

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', setSize)
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    trailRef.current.push({ x: e.clientX, y: e.clientY, age: 0 })
    if (trailRef.current.length > 60) trailRef.current.shift()
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ zIndex: 10 }}
      onMouseMove={handleMouseMove}
    >
      {/* Thermal trail canvas */}
      <canvas
        ref={trailCanvasRef}
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Forensic report document */}
      <div
        className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24"
        style={{ zIndex: 2 }}
      >
        <div style={{ transform: 'rotate(-0.4deg)', maxWidth: '680px' }}>

          {/* Header bar */}
          <div
            className="flex items-center justify-between mb-6 pb-4"
            style={{ borderBottom: '1px solid rgba(249,115,22,0.2)' }}
          >
            <span
              className="font-mono text-[9px] tracking-[0.5em] uppercase"
              style={{ color: 'rgba(249,115,22,0.4)' }}
            >
              MORPHEUS.AI · FORENSIC ANALYSIS · v2.1
            </span>
            <span
              className="font-mono text-[9px] tracking-[0.3em]"
              style={{ color: 'rgba(249,115,22,0.25)' }}
            >
              {P.year} — {P.status}
            </span>
          </div>

          {/* Scan target */}
          <div className="mb-6">
            <div className="font-mono text-[9px] tracking-[0.4em] uppercase mb-2" style={{ color: 'rgba(249,115,22,0.3)' }}>
              SCAN TARGET
            </div>
            <div
              className="font-mono text-[11px] tracking-[0.2em] px-3 py-2"
              style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)', color: 'rgba(249,115,22,0.6)' }}
            >
              input_video.mp4 · FACE DETECTED · ANALYSIS IN PROGRESS
            </div>
          </div>

          {/* Project name — huge, treated as a scan result header */}
          <h2
            className="font-sans font-bold leading-[0.88] tracking-[-0.03em] mb-2"
            style={{ fontSize: 'clamp(3rem,7vw,7.5rem)', color: 'var(--color-text-primary)' }}
          >
            {P.name}
          </h2>
          <p
            className="font-sans italic text-[clamp(0.85rem,1.2vw,1.0rem)] mb-4"
            style={{ color: 'rgba(249,115,22,0.5)' }}
          >
            {P.tagline}
          </p>
          {/* Description — visible immediately */}
          <p
            className="font-sans text-[clamp(0.70rem,0.95vw,0.82rem)] leading-[1.7] max-w-[38rem] mb-8"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            {P.description.split('.').slice(0, 3).join('.')}.
          </p>

          {/* Detection vectors */}
          <div className="mb-6">
            <div className="font-mono text-[9px] tracking-[0.4em] uppercase mb-3" style={{ color: 'rgba(249,115,22,0.3)' }}>
              DETECTION VECTORS — GRAD-CAM HEATMAP
            </div>
            {VECTORS.map((v) => <VectorRow key={v.label} {...v} />)}
          </div>

          {/* Verdict */}
          <div
            className="flex items-center gap-6 p-4"
            style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.18)' }}
          >
            <span className="font-mono text-[9px] tracking-[0.4em] uppercase" style={{ color: 'rgba(249,115,22,0.4)' }}>VERDICT</span>
            <span
              className="font-mono text-[14px] tracking-[0.15em] font-bold"
              style={{ color: '#f97316' }}
            >
              SYNTHETIC — 94.7% CONFIDENCE
            </span>
          </div>

          {/* Tags + link — quiet footer */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            {P.tags.slice(0, 5).map((t) => (
              <span key={t} className="font-mono text-[8px] tracking-[0.2em] uppercase" style={{ color: 'rgba(249,115,22,0.2)' }}>
                {t}
              </span>
            ))}
            <span className="flex-1" />
            {P.link.url ? (
              <a href={P.link.url} target="_blank" rel="noopener noreferrer"
                className="font-mono text-[9px] tracking-[0.3em] uppercase"
                style={{ color: 'rgba(249,115,22,0.35)' }}>
                GitHub ↗
              </a>
            ) : (
              <span className="font-mono text-[9px] tracking-[0.2em]" style={{ color: 'rgba(249,115,22,0.15)' }}>
                GitHub — soon
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
