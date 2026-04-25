'use client'

import { useRef, useEffect } from 'react'

/**
 * Morpheus.AI environment — forensic thermal scanner.
 *
 * A dot-matrix grid covers the viewport.
 * Orange "heat" zones spread and fade through the grid cells — the Grad-CAM heatmap.
 * A hard scan bar sweeps downward, lighting up cells as it passes.
 * Faint edge-detection ghost lines flicker in the background.
 */

const ACCENT = { r: 249, g: 115, b: 22 } // #f97316

export function MorpheusEnv() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current as HTMLCanvasElement
    const ctx    = canvas.getContext('2d') as CanvasRenderingContext2D

    let rafId = 0

    const CELL = 28  // grid cell size

    type HeatZone = {
      cx: number; cy: number
      radius: number; maxRadius: number
      heat: number; speed: number
      phase: 'grow' | 'hold' | 'decay'
      holdTimer: number
    }

    const zones: HeatZone[] = []

    const setSize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    setSize()
    window.addEventListener('resize', setSize)

    function spawnZone() {
      zones.push({
        cx:        (Math.random() * 0.6 + 0.2) * canvas.width,
        cy:        (Math.random() * 0.6 + 0.2) * canvas.height,
        radius:    0,
        maxRadius: 60 + Math.random() * 80,
        heat:      0,
        speed:     0.4 + Math.random() * 0.4,
        phase:     'grow',
        holdTimer: 0,
      })
    }

    // Seed initial zones
    for (let i = 0; i < 4; i++) spawnZone()

    let frame = 0

    function tick() {
      frame++

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Very faint background grid overlay
      ctx.fillStyle = 'rgba(5, 5, 5, 1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const cols = Math.ceil(canvas.width  / CELL) + 1
      const rows = Math.ceil(canvas.width  / CELL) + 1
      const rowCount = Math.ceil(canvas.height / CELL) + 1

      // Update zones
      zones.forEach((z, zi) => {
        if (z.phase === 'grow') {
          z.radius += z.speed * 0.9
          z.heat    = Math.min(1, z.heat + 0.018)
          if (z.radius >= z.maxRadius) {
            z.phase = 'hold'
            z.holdTimer = 80 + Math.floor(Math.random() * 60)
          }
        } else if (z.phase === 'hold') {
          z.holdTimer--
          if (z.holdTimer <= 0) z.phase = 'decay'
        } else {
          z.radius += z.speed * 0.3
          z.heat    = Math.max(0, z.heat - 0.008)
          if (z.heat <= 0) zones.splice(zi, 1)
        }
      })

      // Spawn new zones occasionally
      if (zones.length < 5 && Math.random() < 0.018) spawnZone()

      // Scan bar position — sweeps full height in ~3.5s
      const scanY = (frame * 1.2) % canvas.height

      // Draw grid cells
      for (let row = 0; row < rowCount; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * CELL
          const y = row * CELL
          const cx = x + CELL / 2
          const cy = y + CELL / 2

          // Compute max heat from all zones
          let maxHeat = 0
          for (const z of zones) {
            const dx = cx - z.cx
            const dy = cy - z.cy
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < z.radius) {
              const falloff = 1 - dist / z.radius
              const h = z.heat * falloff * falloff  // quadratic falloff
              if (h > maxHeat) maxHeat = h
            }
          }

          // Scan bar brightens cells it passes over
          const scanDist = Math.abs(cy - scanY)
          const scanBoost = Math.max(0, 1 - scanDist / 18) * 0.4

          const cellHeat = Math.min(1, maxHeat + scanBoost)

          if (cellHeat < 0.015) {
            // Base grid dot — very dim
            ctx.fillStyle = 'rgba(249, 115, 22, 0.06)'
            ctx.beginPath()
            ctx.arc(cx, cy, 1.2, 0, Math.PI * 2)
            ctx.fill()
          } else {
            // Thermal cell
            const size = 1.5 + cellHeat * 5
            const alpha = 0.12 + cellHeat * 0.75

            // Color: dim orange → bright orange → white at peak
            const r = Math.round(ACCENT.r)
            const g = Math.round(ACCENT.g + cellHeat * 80)
            const b = Math.round(ACCENT.b + cellHeat * 200)

            ctx.shadowColor = `rgba(${r},${g},${b}, ${alpha})`
            ctx.shadowBlur  = cellHeat > 0.5 ? 6 : 0
            ctx.fillStyle   = `rgba(${r},${g},${b}, ${alpha})`
            ctx.beginPath()
            ctx.arc(cx, cy, size, 0, Math.PI * 2)
            ctx.fill()
            ctx.shadowBlur = 0
          }
        }
      }

      // Scan bar itself — a bright horizontal slash
      const barGrad = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2)
      barGrad.addColorStop(0,   'transparent')
      barGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.22)')
      barGrad.addColorStop(1,   'transparent')
      ctx.fillStyle = barGrad
      ctx.fillRect(0, scanY - 2, canvas.width, 4)

      // Ghost edge-detection lines — faint flicker
      if (frame % 90 < 4) {
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.08)'
        ctx.lineWidth   = 1
        ctx.beginPath()
        ctx.moveTo(canvas.width * 0.3 + Math.sin(frame * 0.1) * 8, 0)
        ctx.lineTo(canvas.width * 0.3 + Math.sin(frame * 0.1) * 8, canvas.height)
        ctx.stroke()
      }

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
      style={{ opacity: 0.85 }}
    />
  )
}
