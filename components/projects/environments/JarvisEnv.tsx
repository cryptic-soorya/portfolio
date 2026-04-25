'use client'

import { useRef, useEffect } from 'react'

interface Props {
  cursorRef?: React.RefObject<{ x: number; y: number }>
}

// JARVIS state colors — proximity-driven, not time-driven
const COLORS = {
  idle:      { r: 236, g:  72, b: 153 },  // pink
  listening: { r:  74, g: 222, b: 128 },  // green
  thinking:  { r:  96, g: 165, b: 250 },  // blue
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

/**
 * JarvisEnv — physics-based floating orb with cursor-reactive state machine.
 *
 * States (proximity-driven):
 *   > 280px  → IDLE      (pink  · slow pulse)
 *   280–100px → LISTENING (green · medium pulse · orb drifts toward cursor)
 *   < 100px  → THINKING  (blue  · fast pulse · bright glow · sonar pings)
 *
 * Features:
 *   - Spring physics: orb position follows cursor with damping
 *   - Eyes: always visible, natural blink, iris + pupil gaze from anywhere
 *   - Sonar pings: expand outward in active states
 *   - Scan sweep: rotating radar arc
 *   - 4-layer dashed tech rings at different speeds
 *   - 3 rings of orbital particles
 *   - Neural radial lines with wandering angles
 */
export function JarvisEnv({ cursorRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')!

    let rafId = 0
    let frame = 0

    // ── Orb home position ─────────────────────────────────
    const HOME = { fx: 0.62, fy: 0.48 }

    // Physics state
    const pos = { x: 0, y: 0 }
    const vel = { x: 0, y: 0 }

    // Color (lerped each frame toward target)
    const color = { ...COLORS.idle }

    // Eye blink state machine
    let blinkState    = 1.0   // 1 = fully open, 0 = fully closed
    let blinkDir      = 0     // -1 closing, +1 opening, 0 idle
    let blinkCooldown = 180 + Math.random() * 260

    // Sonar pings pool
    type Ping = { life: number }
    let pings: Ping[] = []
    let pingTimer     = 0

    // Scan line angle
    let scanAngle = 0

    const setSize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      pos.x = canvas.width  * HOME.fx
      pos.y = canvas.height * HOME.fy
    }
    setSize()
    window.addEventListener('resize', setSize)

    // ── Orbital particle rings ─────────────────────────────
    // Three rings at increasing radii (as multiples of orbR at render time)
    const RINGS = [
      Array.from({ length: 22 }, () => ({
        angle: Math.random() * Math.PI * 2,
        distMul: 1.75 + Math.random() * 0.20,
        speed:   (0.0005 + Math.random() * 0.0004) * (Math.random() > 0.5 ? 1 : -1),
        size:    0.7 + Math.random() * 1.1,
        phase:   Math.random() * Math.PI * 2,
      })),
      Array.from({ length: 30 }, () => ({
        angle: Math.random() * Math.PI * 2,
        distMul: 3.2 + Math.random() * 0.35,
        speed:   (0.0003 + Math.random() * 0.0003) * (Math.random() > 0.5 ? 1 : -1),
        size:    0.5 + Math.random() * 1.2,
        phase:   Math.random() * Math.PI * 2,
      })),
      Array.from({ length: 40 }, () => ({
        angle: Math.random() * Math.PI * 2,
        distMul: 5.4 + Math.random() * 0.55,
        speed:   (0.0001 + Math.random() * 0.0002) * (Math.random() > 0.5 ? 1 : -1),
        size:    0.4 + Math.random() * 0.9,
        phase:   Math.random() * Math.PI * 2,
      })),
    ]

    // ── Neural lines wandering phase offsets ───────────────
    const NUM_LINES  = 20
    const linePhases = Array.from({ length: NUM_LINES }, (_, i) => i * 0.7 + Math.random())

    function tick() {
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // ── Mouse ─────────────────────────────────────────────
      const mX = cursorRef?.current?.x ?? -9999
      const mY = cursorRef?.current?.y ?? -9999

      // ── Orb spring physics ────────────────────────────────
      const homeX = canvas.width  * HOME.fx
      const homeY = canvas.height * HOME.fy

      const cdx  = mX - homeX
      const cdy  = mY - homeY
      const cd   = Math.sqrt(cdx * cdx + cdy * cdy)

      // Cursor pull strength — tapers off beyond 500px
      const pull  = cd < 500 ? (1 - cd / 500) ** 1.6 * 0.16 : 0
      const tX    = homeX + cdx * pull
      const tY    = homeY + cdy * pull

      // Damped spring
      vel.x = (vel.x + (tX - pos.x) * 0.055) * 0.84
      vel.y = (vel.y + (tY - pos.y) * 0.055) * 0.84
      pos.x += vel.x
      pos.y += vel.y

      const cx = pos.x
      const cy = pos.y

      // ── Cursor distance from orb center ───────────────────
      const dx   = mX - cx
      const dy   = mY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // ── State & energy ─────────────────────────────────────
      let targetColor  = COLORS.idle
      let stateEnergy  = 0.0  // 0–1 intensity multiplier
      if (dist < 100) {
        targetColor = COLORS.thinking
        stateEnergy = 1.0
      } else if (dist < 280) {
        targetColor = COLORS.listening
        stateEnergy = (280 - dist) / 180
      }

      // Smooth color lerp (slow for cinematic feel)
      color.r = lerp(color.r, targetColor.r, 0.032)
      color.g = lerp(color.g, targetColor.g, 0.032)
      color.b = lerp(color.b, targetColor.b, 0.032)

      // Color helpers
      const ca = (a: number) =>
        `rgba(${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)},${a})`

      // ── Orb radius & pulse ────────────────────────────────
      const pulseFreq = 0.024 + stateEnergy * 0.038
      const pulse     = 0.88 + Math.sin(frame * pulseFreq * 2) * 0.12
      const orbR      = (62 + Math.sin(frame * pulseFreq) * 6) * (1 + stateEnergy * 0.18)

      // ── Atmosphere (wide diffuse glow) ─────────────────────
      const atmosR = Math.min(canvas.width, canvas.height) * 0.42
      const atmos  = ctx.createRadialGradient(cx, cy, orbR * 1.1, cx, cy, atmosR)
      atmos.addColorStop(0,    ca(0.08 + stateEnergy * 0.05))
      atmos.addColorStop(0.45, ca(0.025))
      atmos.addColorStop(1,    'transparent')
      ctx.fillStyle = atmos
      ctx.beginPath()
      ctx.arc(cx, cy, atmosR, 0, Math.PI * 2)
      ctx.fill()

      // ── Neural radial lines ───────────────────────────────
      ctx.lineWidth = 0.5
      for (let li = 0; li < NUM_LINES; li++) {
        const baseAngle = (li / NUM_LINES) * Math.PI * 2
        const wander    = Math.sin(frame * 0.0007 * (li + 1) + linePhases[li]) * 0.28
        const rotDir    = li % 2 === 0 ? 1 : -1
        const angle     = baseAngle + wander + frame * 0.00028 * rotDir
        const lineLen   = orbR * (3.6 + Math.sin(frame * 0.0018 + li * 0.8) * 0.9)
        const sx        = cx + Math.cos(angle) * orbR
        const sy        = cy + Math.sin(angle) * orbR
        const ex        = cx + Math.cos(angle) * lineLen
        const ey        = cy + Math.sin(angle) * lineLen
        const lg        = ctx.createLinearGradient(sx, sy, ex, ey)
        lg.addColorStop(0,    ca(0.22 + stateEnergy * 0.08))
        lg.addColorStop(0.55, ca(0.05))
        lg.addColorStop(1,    'transparent')
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.strokeStyle = lg
        ctx.stroke()
      }

      // ── Orbital particle rings ─────────────────────────────
      RINGS.forEach((ring, ri) => {
        const baseAlpha = [0.42, 0.28, 0.18][ri]
        ring.forEach((p) => {
          p.angle += p.speed
          const r  = orbR * p.distMul
          const px = cx + Math.cos(p.angle) * r
          const py = cy + Math.sin(p.angle) * r
          if (px < -10 || px > canvas.width + 10 || py < -10 || py > canvas.height + 10) return
          const a = baseAlpha * (0.65 + Math.sin(frame * 0.028 + p.phase) * 0.35)
          ctx.beginPath()
          ctx.arc(px, py, p.size, 0, Math.PI * 2)
          ctx.fillStyle = ca(Math.max(0, a))
          ctx.fill()
        })
      })

      // ── 4-layer dashed tech rings ──────────────────────────
      const techRings = [
        { r: orbR * 1.52, speed:  0.0014, dash: [8, 14],  alpha: 0.24, lw: 1.0 },
        { r: orbR * 2.18, speed: -0.0008, dash: [3, 10],  alpha: 0.15, lw: 0.8 },
        { r: orbR * 3.10, speed:  0.0004, dash: [1, 22],  alpha: 0.08, lw: 0.6 },
        { r: orbR * 4.30, speed: -0.0002, dash: [5, 34],  alpha: 0.05, lw: 0.5 },
      ]
      techRings.forEach(({ r, speed, dash, alpha, lw }) => {
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(frame * speed)
        ctx.beginPath()
        ctx.arc(0, 0, r, 0, Math.PI * 2)
        ctx.strokeStyle = ca(alpha + stateEnergy * 0.10)
        ctx.lineWidth   = lw
        ctx.setLineDash(dash)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      })

      // ── Scan sweep (radar arc) ─────────────────────────────
      scanAngle += 0.007 + stateEnergy * 0.010
      const scanLen   = orbR * 5.0
      const wedge     = 0.055
      // Use filled wedge path with radial gradient
      ctx.save()
      ctx.globalAlpha = 0.18 + stateEnergy * 0.14
      const sweepGrad = ctx.createRadialGradient(cx, cy, orbR, cx, cy, scanLen)
      sweepGrad.addColorStop(0,   ca(1))
      sweepGrad.addColorStop(0.6, ca(0.3))
      sweepGrad.addColorStop(1,   ca(0))
      ctx.fillStyle = sweepGrad
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, scanLen, scanAngle - wedge, scanAngle + wedge)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1

      // Bright leading edge
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(
        cx + Math.cos(scanAngle) * scanLen,
        cy + Math.sin(scanAngle) * scanLen
      )
      ctx.strokeStyle = ca(0.35 + stateEnergy * 0.20)
      ctx.lineWidth   = 1
      ctx.stroke()
      ctx.restore()

      // ── Sonar pings (listening/thinking states) ───────────
      pingTimer++
      const pingInterval = stateEnergy > 0.6 ? 50 : stateEnergy > 0.1 ? 90 : 999
      if (pingTimer >= pingInterval) {
        pingTimer = 0
        pings.push({ life: 0 })
      }
      pings.forEach((p) => { p.life += 0.016 })
      pings = pings.filter((p) => p.life < 1)
      pings.forEach((p) => {
        const pingR = orbR + p.life * orbR * 4.2
        const pingA = (1 - p.life) * 0.28 * (0.6 + stateEnergy * 0.4)
        ctx.beginPath()
        ctx.arc(cx, cy, pingR, 0, Math.PI * 2)
        ctx.strokeStyle = ca(pingA)
        ctx.lineWidth   = 1.5 * (1 - p.life)
        ctx.stroke()
      })

      // ── Inner glow halo ────────────────────────────────────
      const halo = ctx.createRadialGradient(cx, cy, orbR * 0.65, cx, cy, orbR * 2.3)
      halo.addColorStop(0, ca((0.26 + stateEnergy * 0.14) * pulse))
      halo.addColorStop(1, 'transparent')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, orbR * 2.3, 0, Math.PI * 2)
      ctx.fill()

      // ── Orb core ───────────────────────────────────────────
      const core = ctx.createRadialGradient(cx - orbR * 0.22, cy - orbR * 0.24, 0, cx, cy, orbR)
      core.addColorStop(0,    `rgba(255,255,255,${0.92 * pulse})`)
      core.addColorStop(0.30, ca(0.96 * pulse))
      core.addColorStop(0.72, ca(0.58 * pulse))
      core.addColorStop(1,    ca(0.06))
      ctx.fillStyle = core
      ctx.beginPath()
      ctx.arc(cx, cy, orbR, 0, Math.PI * 2)
      ctx.fill()

      // Specular highlight
      ctx.beginPath()
      ctx.arc(cx - orbR * 0.27, cy - orbR * 0.30, orbR * 0.26, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${0.32 * pulse})`
      ctx.fill()

      // State ring — glows brighter in active states
      ctx.beginPath()
      ctx.arc(cx, cy, orbR + 3, 0, Math.PI * 2)
      ctx.strokeStyle = ca(0.40 + stateEnergy * 0.25)
      ctx.lineWidth   = 1.5
      ctx.stroke()

      if (stateEnergy > 0.15) {
        ctx.beginPath()
        ctx.arc(cx, cy, orbR + 9, 0, Math.PI * 2)
        ctx.strokeStyle = ca(0.12 * stateEnergy)
        ctx.lineWidth   = 1
        ctx.stroke()
      }

      // ── Eyes ─────────────────────────────────────────────
      // Blink state machine
      blinkCooldown--
      if (blinkCooldown <= 0 && blinkDir === 0) {
        blinkDir = -1
      }
      if (blinkDir === -1) {
        blinkState = Math.max(0, blinkState - 0.20)
        if (blinkState <= 0) blinkDir = 1
      } else if (blinkDir === 1) {
        blinkState = Math.min(1, blinkState + 0.14)
        if (blinkState >= 1) {
          blinkDir      = 0
          blinkCooldown = 200 + Math.random() * 280
        }
      }

      // Gaze direction — tracks cursor from anywhere on screen
      const gazeAngle = Math.atan2(dy, dx)
      const maxShift  = orbR * 0.10
      const gazeShift = Math.min(maxShift, dist * 0.038)
      const gazeDx    = Math.cos(gazeAngle) * gazeShift
      const gazeDy    = Math.sin(gazeAngle) * gazeShift

      // Visibility: always at least 30%, full at close range
      const eyeAlpha = Math.max(0.28, Math.min(1.0, 1.0 - (dist - 60) / 420))

      const EYE_Y   = cy - orbR * 0.16
      const EYE_GAP = orbR * 0.30
      const EYE_W   = orbR * 0.148
      const EYE_H   = Math.max(0.6, orbR * 0.25 * blinkState)

      const drawEye = (ex: number, ey: number) => {
        ctx.save()

        // Clip to ellipse so iris/pupil don't bleed outside
        ctx.beginPath()
        ctx.ellipse(ex, ey, EYE_W, EYE_H, 0, 0, Math.PI * 2)
        ctx.clip()

        // Sclera
        ctx.fillStyle = `rgba(255,255,255,${eyeAlpha * 0.88})`
        ctx.fill()

        if (EYE_H > 1) {
          const irisR = EYE_W * 0.68
          // Iris
          ctx.beginPath()
          ctx.arc(ex + gazeDx * 0.45, ey + gazeDy * 0.45, irisR, 0, Math.PI * 2)
          ctx.fillStyle = ca(eyeAlpha * 0.94)
          ctx.fill()

          // Pupil
          ctx.beginPath()
          ctx.arc(ex + gazeDx, ey + gazeDy, irisR * 0.52, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0,0,0,${eyeAlpha})`
          ctx.fill()

          // Specular dot
          ctx.beginPath()
          ctx.arc(
            ex + gazeDx - irisR * 0.30,
            ey + gazeDy - irisR * 0.32,
            irisR * 0.20, 0, Math.PI * 2
          )
          ctx.fillStyle = `rgba(255,255,255,${eyeAlpha * 0.92})`
          ctx.fill()
        }

        ctx.restore()

        // Glow rim (outside clip)
        ctx.beginPath()
        ctx.ellipse(ex, ey, EYE_W + 2, Math.max(0.8, EYE_H + 2), 0, 0, Math.PI * 2)
        ctx.strokeStyle = ca(eyeAlpha * 0.30)
        ctx.lineWidth   = 1
        ctx.stroke()
      }

      drawEye(cx - EYE_GAP, EYE_Y)
      drawEye(cx + EYE_GAP, EYE_Y)

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
      style={{ opacity: 0.90 }}
    />
  )
}
