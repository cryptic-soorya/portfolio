'use client'

import { useRef, useEffect } from 'react'

/**
 * Mika environment — dual-presence bokeh field.
 *
 * Two soft light sources represent the dual persona:
 *   Left — cool violet (strict tutor)
 *   Right — warm rose-violet (empathetic companion)
 *
 * Bokeh circles float gently upward between the two sources.
 * A barely-visible notebook grid underlies the field.
 */

export function MikaEnv() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current as HTMLCanvasElement
    const ctx    = canvas.getContext('2d') as CanvasRenderingContext2D

    let rafId = 0

    const setSize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    setSize()
    window.addEventListener('resize', setSize)

    // Bokeh particles
    const NUM_BOKEH = 70
    type Bokeh = {
      x: number; y: number
      r: number; speed: number
      wobble: number; phase: number
      hue: number; alpha: number
    }

    function makeBokeh(): Bokeh {
      // Spawn across lower portion, drift upward
      const side   = Math.random()
      const hue    = side < 0.5
        ? 260 + Math.random() * 30   // violet
        : 290 + Math.random() * 30   // rose-violet

      return {
        x:       Math.random() * canvas.width,
        y:       canvas.height * 0.5 + Math.random() * canvas.height * 0.6,
        r:       8 + Math.random() * 26,
        speed:   0.12 + Math.random() * 0.28,
        wobble:  (Math.random() - 0.5) * 0.6,
        phase:   Math.random() * Math.PI * 2,
        hue,
        alpha:   0.04 + Math.random() * 0.12,
      }
    }

    const bokeh: Bokeh[] = Array.from({ length: NUM_BOKEH }, makeBokeh)

    let frame = 0

    function tick() {
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // ── Notebook grid — barely visible ────────────────────────────
      const GRID_H = 26
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.035)'
      ctx.lineWidth   = 0.5
      for (let y = GRID_H; y < canvas.height; y += GRID_H) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
      // Vertical margin line
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.04)'
      ctx.beginPath()
      ctx.moveTo(60, 0)
      ctx.lineTo(60, canvas.height)
      ctx.stroke()

      // ── Dual light sources ────────────────────────────────────────
      // Left — cool violet (strict tutor)
      const lx     = canvas.width * 0.28
      const ly     = canvas.height * 0.42 + Math.sin(frame * 0.016) * 18
      const leftR  = 200 + Math.sin(frame * 0.022) * 30

      const leftGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, leftR)
      leftGrad.addColorStop(0,   'rgba(139, 92, 246, 0.16)')
      leftGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.06)')
      leftGrad.addColorStop(1,   'transparent')
      ctx.fillStyle = leftGrad
      ctx.beginPath()
      ctx.arc(lx, ly, leftR, 0, Math.PI * 2)
      ctx.fill()

      // Right — warm rose-violet (companion)
      const rx     = canvas.width * 0.72
      const ry     = canvas.height * 0.55 + Math.sin(frame * 0.019 + 1.2) * 22
      const rightR = 240 + Math.sin(frame * 0.017 + 0.8) * 35

      const rightGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, rightR)
      rightGrad.addColorStop(0,   'rgba(192, 132, 252, 0.14)')
      rightGrad.addColorStop(0.5, 'rgba(192, 132, 252, 0.05)')
      rightGrad.addColorStop(1,   'transparent')
      ctx.fillStyle = rightGrad
      ctx.beginPath()
      ctx.arc(rx, ry, rightR, 0, Math.PI * 2)
      ctx.fill()

      // ── Bokeh circles ─────────────────────────────────────────────
      bokeh.forEach((b) => {
        b.y     -= b.speed
        b.x     += Math.sin(frame * 0.008 + b.phase) * b.wobble
        b.phase += 0.004

        // Reset when drifted off top
        if (b.y + b.r < 0) {
          Object.assign(b, makeBokeh())
          b.y = canvas.height + b.r
        }

        // Soft-focus ring — no fill, just stroke
        const alpha = b.alpha * (0.7 + Math.sin(frame * 0.02 + b.phase) * 0.3)
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.strokeStyle = `hsla(${b.hue}, 70%, 75%, ${alpha})`
        ctx.lineWidth   = 0.8
        ctx.stroke()

        // Tiny bright center
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r * 0.12, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${b.hue}, 80%, 85%, ${alpha * 2.5})`
        ctx.fill()
      })

      // ── Subtle center bridge — the two personas in dialogue ───────
      const bridgeAlpha = 0.03 + Math.sin(frame * 0.015) * 0.02
      const bridge = ctx.createLinearGradient(lx, ly, rx, ry)
      bridge.addColorStop(0,   `rgba(139, 92, 246, ${bridgeAlpha})`)
      bridge.addColorStop(0.5, `rgba(192, 132, 252, ${bridgeAlpha * 0.5})`)
      bridge.addColorStop(1,   `rgba(236, 72, 153, ${bridgeAlpha})`)
      ctx.strokeStyle = bridge
      ctx.lineWidth   = 1
      ctx.beginPath()
      ctx.moveTo(lx, ly)
      ctx.quadraticCurveTo(canvas.width * 0.5, canvas.height * 0.3, rx, ry)
      ctx.stroke()

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', setSize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.9 }}
    />
  )
}
