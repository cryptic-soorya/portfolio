'use client'

import { useRef, useEffect } from 'react'

interface Props {
  cursorRef?: React.RefObject<{ x: number; y: number }>
}

/**
 * VoctermEnv — CRT phosphor matrix rain with cursor storm.
 *
 * Columns near the cursor accelerate and brighten — like the terminal is
 * responding to you, data cascading faster where attention lands.
 */
export function VoctermEnv({ cursorRef }: Props) {
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

    const SOURCE = '$ vocterm --listen ALLOW? risk:0.12 on_device=True ollama.run(mistral) whisper.infer() preview: pipe_cmd() context.update() fallback shell 0xFF echo $PATH ↓ > _'
    const COL_W  = 20

    function buildCols() {
      const count = Math.ceil(canvas.width / COL_W) + 2
      return {
        count,
        drops:  Array.from({ length: count }, () => Math.random() * -canvas.height),
        speeds: Array.from({ length: count }, () => 0.35 + Math.random() * 0.55),
        srcIdx: Array.from({ length: count }, () => Math.floor(Math.random() * SOURCE.length)),
      }
    }

    let cols = buildCols()
    window.addEventListener('resize', () => { cols = buildCols() })

    let frame = 0

    function tick() {
      frame++

      ctx.fillStyle = 'rgba(5, 5, 5, 0.052)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font        = '11px "Courier New", monospace'
      ctx.textBaseline = 'top'

      const cx = cursorRef?.current?.x ?? -999
      const cy = cursorRef?.current?.y ?? -999

      for (let i = 0; i < cols.count; i++) {
        const x = i * COL_W
        const y = cols.drops[i]

        if (y > -2 && y < canvas.height + 2) {
          cols.srcIdx[i] = (cols.srcIdx[i] + 1) % SOURCE.length
          const ch = SOURCE[cols.srcIdx[i]]

          // Cursor storm: columns near cursor accelerate + flare
          const dx    = x - cx
          const dy    = y - cy
          const dist  = Math.sqrt(dx * dx + dy * dy)
          const storm = dist < 200 ? Math.pow(1 - dist / 200, 1.5) : 0

          // Storm makes column faster
          const stormSpeed = storm * 3.0
          cols.speeds[i] = (0.35 + Math.random() * 0.04) + stormSpeed

          const alpha = 0.65 + storm * 0.35
          ctx.fillStyle   = `rgba(74, 222, 128, ${alpha})`
          ctx.shadowColor = storm > 0.3 ? '#4ade80' : 'transparent'
          ctx.shadowBlur  = storm > 0.3 ? 10 + storm * 6 : 0
          ctx.fillText(ch, x, y)
          ctx.shadowBlur  = 0
        }

        cols.drops[i] += cols.speeds[i] * 12

        if (cols.drops[i] > canvas.height && Math.random() > 0.974) {
          cols.drops[i] = -30
        }
      }

      // CRT scan line
      const scanY = (frame * 1.0) % canvas.height
      const sg    = ctx.createLinearGradient(0, scanY - 4, 0, scanY + 4)
      sg.addColorStop(0,   'transparent')
      sg.addColorStop(0.5, 'rgba(74, 222, 128, 0.10)')
      sg.addColorStop(1,   'transparent')
      ctx.fillStyle = sg
      ctx.fillRect(0, scanY - 4, canvas.width, 8)

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', setSize)
    }
  }, [cursorRef])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.65 }}
    />
  )
}
