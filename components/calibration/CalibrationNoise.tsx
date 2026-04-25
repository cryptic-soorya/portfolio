'use client'

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

export interface NoiseHandle {
  setIntensity: (value: number) => void
}

/**
 * Canvas-based animated grain overlay.
 *
 * Renders a 128×128 noise texture that updates every frame via RAF.
 * Scaled to cover the parent via CSS — `image-rendering: pixelated` keeps
 * the chunky CRT texture rather than blurring it smooth.
 *
 * Intensity is controlled imperatively via the `setIntensity` handle so GSAP
 * can drive it without React re-renders.
 */
export const CalibrationNoise = forwardRef<NoiseHandle>(function CalibrationNoise(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intensityRef = useRef(0.04)
  const rafRef = useRef<number>(0)

  useImperativeHandle(ref, () => ({
    setIntensity: (value: number) => {
      intensityRef.current = Math.max(0, Math.min(1, value))
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const SIZE = 128
    canvas.width = SIZE
    canvas.height = SIZE

    // Allocated once — reused every frame to avoid 60 heap allocs/sec.
    const imgData = ctx.createImageData(SIZE, SIZE)
    const d = imgData.data

    function render() {
      if (!canvas || !ctx) return

      const alpha = (intensityRef.current * 255) | 0

      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0
        d[i] = v
        d[i + 1] = v
        d[i + 2] = v
        d[i + 3] = alpha
      }

      ctx.putImageData(imgData, 0, 0)
      rafRef.current = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        // Scale the 128×128 canvas to fill the container — pixelated keeps grain chunky
        imageRendering: 'pixelated',
        mixBlendMode: 'overlay',
      }}
    />
  )
})
