'use client'

/**
 * PHASE 7 — CAPABILITY MATRIX (v2)
 *
 * Canvas 2D force-field network. 5 hub nodes in a pentagon. Skill nodes fan
 * outward per category. Cross-domain dashed edges with flowing animation.
 *
 * Layout contract:
 *   • cx = W/2, cy = H/2 — no offset so bottom hubs never clip
 *   • maxR = min(W/2, H/2) - PADDING — bounds guaranteed
 *   • HUB_R = maxR * 0.50, SKILL_R = maxR * 0.43 → HUB_R + SKILL_R < maxR
 *
 * Render stack (draw order):
 *   1. Orbital rings (ambient background)
 *   2. Cross-domain flowing dashed edges
 *   3. Radial hub→skill gradient edges
 *   4. Skill nodes (radial gradient + glow)
 *   5. Hub nodes (radial gradient + halo ring + core dot)
 *   6. Labels
 *   7. HTML tooltip
 */

import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/animations/gsap.config'
import {
  SKILLS,
  SKILL_NOTES,
  CATEGORY_COLORS,
  CROSS_CONNECTIONS,
} from '@/lib/data/skills'

// ─── Graph types ───────────────────────────────────────────────────────────────

interface GNode {
  id: string
  label: string
  note: string
  type: 'hub' | 'skill'
  categoryId: string
  color: string
  x: number
  y: number
  alpha: number
  tx: number
  ty: number
  r: number
  phase: number
}

interface GEdge {
  fromId: string
  toId: string
  type: 'radial' | 'cross'
  color: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

// ─── Graph builder ────────────────────────────────────────────────────────────

const PADDING    = 88   // minimum px gap from canvas edge to any node center
const HUB_NODE_R   = 21
const SKILL_NODE_R = 8

function buildGraph(W: number, H: number): { nodes: GNode[]; edges: GEdge[] } {
  const cx   = W / 2
  const cy   = H / 2   // always centered — never shifted down
  // Maximum safe orbit radius so no node (center) exceeds canvas bounds
  const maxR = Math.min(W / 2, H / 2) - PADDING
  const HUB_R   = maxR * 0.50   // hub orbit
  const SKILL_R = maxR * 0.43   // skill orbit from hub — HUB_R + SKILL_R < maxR ✓

  const nodes: GNode[] = []
  const edges: GEdge[] = []
  const N = SKILLS.length

  SKILLS.forEach((cat, i) => {
    const color    = CATEGORY_COLORS[cat.category] ?? '#ffffff'
    const hubAngle = -Math.PI / 2 + (2 * Math.PI * i) / N
    const hx = cx + HUB_R * Math.cos(hubAngle)
    const hy = cy + HUB_R * Math.sin(hubAngle)
    const hubId = `hub-${i}`

    nodes.push({
      id: hubId, label: cat.category, note: '',
      type: 'hub', categoryId: cat.category, color,
      x: hx, y: hy, alpha: 1,
      tx: hx, ty: hy,
      r: HUB_NODE_R,
      phase: Math.random() * Math.PI * 2,
    })

    const n = cat.items.length
    const fanSpread = (Math.PI / 180) * (n <= 3 ? 70 : n <= 4 ? 90 : 110)
    const step = n > 1 ? fanSpread / (n - 1) : 0
    const startAngle = hubAngle - fanSpread / 2

    cat.items.forEach((label, j) => {
      const angle  = startAngle + step * j
      const sx = hx + SKILL_R * Math.cos(angle)
      const sy = hy + SKILL_R * Math.sin(angle)
      const skillId = `skill-${i}-${j}`

      nodes.push({
        id: skillId, label, note: SKILL_NOTES[label] ?? '',
        type: 'skill', categoryId: cat.category, color,
        x: sx, y: sy, alpha: 1,
        tx: sx, ty: sy,
        r: SKILL_NODE_R,
        phase: Math.random() * Math.PI * 2,
      })

      edges.push({ fromId: hubId, toId: skillId, type: 'radial', color })
    })
  })

  CROSS_CONNECTIONS.forEach(([labelA, labelB]) => {
    const na = nodes.find(n => n.type === 'skill' && n.label === labelA)
    const nb = nodes.find(n => n.type === 'skill' && n.label === labelB)
    if (na && nb) {
      edges.push({ fromId: na.id, toId: nb.id, type: 'cross', color: '#ffffff' })
    }
  })

  return { nodes, edges }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TooltipState {
  visible: boolean
  label: string
  note: string
  color: string
  vx: number
  vy: number
}

export function SkillsNetwork() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rafRef     = useRef<number>(0)

  const stateRef = useRef<{
    nodes:       GNode[]
    edges:       GEdge[]
    cursor:      { x: number; y: number }
    prevHoverId: string | null
    time:        number
    W:           number
    H:           number
    burstPlayed: boolean
  }>({
    nodes: [], edges: [],
    cursor: { x: -9999, y: -9999 },
    prevHoverId: null,
    time: 0,
    W: 0, H: 0,
    burstPlayed: false,
  })

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, label: '', note: '', color: '#7cffcb', vx: 0, vy: 0,
  })

  useEffect(() => {
    const canvas  = canvasRef.current
    const section = sectionRef.current
    if (!canvas || !section) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    // Cached once — canvas.getContext returns the same object every call,
    // but the lookup + null-check overhead at 60 fps adds up.
    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return

    const applyDpr = () => {
      ctx2d.scale(dpr, dpr)
    }

    const resize = () => {
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      if (W === 0 || H === 0) return

      canvas.width  = W * dpr
      canvas.height = H * dpr
      applyDpr()

      stateRef.current.W = W
      stateRef.current.H = H

      const prevState: Record<string, { alpha: number }> = {}
      stateRef.current.nodes.forEach(n => { prevState[n.id] = { alpha: n.alpha } })

      const { nodes, edges } = buildGraph(W, H)
      nodes.forEach(n => {
        const prev = prevState[n.id]
        if (prev !== undefined) { n.alpha = prev.alpha }
      })

      stateRef.current.nodes = nodes
      stateRef.current.edges = edges
    }

    resize()

    // ── Burst entry ──────────────────────────────────────────────────────────
    const burstEntry = () => {
      if (stateRef.current.burstPlayed) return
      stateRef.current.burstPlayed = true

      const { nodes, W, H } = stateRef.current
      const tl = gsap.timeline()

      nodes.forEach((node) => {
        const isHub   = node.type === 'hub'
        const groupIdx = nodes.filter(n => n.type === node.type).indexOf(node)
        const baseDelay = isHub ? 0 : 0.3
        const stagger   = isHub ? 0.08 : 0.022

        tl.fromTo(
          node,
          { x: W / 2 + (Math.random() - 0.5) * 30, y: H / 2 + (Math.random() - 0.5) * 30, alpha: 0 },
          { x: node.tx, y: node.ty, alpha: 1, duration: isHub ? 1.2 : 0.9, ease: 'expo.out' },
          baseDelay + groupIdx * stagger
        )
      })
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      once: true,
      invalidateOnRefresh: true,
      onEnter: burstEntry,
    })

    // ── Render loop ──────────────────────────────────────────────────────────

    const render = (ts: number) => {
      const ctx = ctx2d

      const state = stateRef.current
      state.time = ts * 0.001
      const { nodes, edges, cursor, time, W, H } = state

      ctx.clearRect(0, 0, W, H)

      // ── Ambient orbital rings ─────────────────────────────────────────────
      // Three concentric dashed rings centered at canvas center — drawn first
      // so they sit beneath all nodes.
      const cx = W / 2, cy = H / 2
      const maxR = Math.min(W / 2, H / 2) - PADDING
      ;[0.30, 0.60, 0.95].forEach((frac) => {
        const ringR = maxR * frac
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
        ctx.setLineDash([4, 14])
        ctx.lineDashOffset = -time * 6 * (frac + 0.3)  // each ring flows at different speed
        ctx.strokeStyle = `rgba(255,255,255,${0.028 + frac * 0.012})`
        ctx.lineWidth = 0.5
        ctx.stroke()
        ctx.restore()
      })

      // ── Hover detection ──────────────────────────────────────────────────
      let hoverId: string | null = null
      let minDist = Infinity
      nodes.forEach(node => {
        if (node.alpha < 0.05) return
        const fx = Math.sin(time * 0.55 + node.phase) * 3
        const fy = Math.cos(time * 0.42 + node.phase * 1.3) * 2.5
        const nx = node.x + fx
        const ny = node.y + fy
        const dx = cursor.x - nx
        const dy = cursor.y - ny
        const dist = Math.sqrt(dx * dx + dy * dy)
        const hit  = node.type === 'hub' ? node.r + 16 : node.r + 12
        if (dist < hit && dist < minDist) { minDist = dist; hoverId = node.id }
      })

      if (hoverId !== state.prevHoverId) {
        state.prevHoverId = hoverId
        if (hoverId) {
          const hn = nodes.find(n => n.id === hoverId)
          if (hn && hn.note) {
            const rect = canvas.getBoundingClientRect()
            setTooltip({
              visible: true, label: hn.label, note: hn.note, color: hn.color,
              vx: cursor.x + rect.left, vy: cursor.y + rect.top - 64,
            })
          } else {
            setTooltip(prev => ({ ...prev, visible: false }))
          }
        } else {
          setTooltip(prev => ({ ...prev, visible: false }))
        }
      }

      const connected = new Set<string>()
      if (hoverId) {
        connected.add(hoverId)
        edges.forEach(e => {
          if (e.fromId === hoverId) connected.add(e.toId)
          if (e.toId   === hoverId) connected.add(e.fromId)
        })
      }
      const anyHover = hoverId !== null

      const pos = (node: GNode): [number, number] => [
        node.x + Math.sin(time * 0.55 + node.phase) * 3,
        node.y + Math.cos(time * 0.42 + node.phase * 1.3) * 2.5,
      ]

      // ── Draw cross edges (flowing dashes) ────────────────────────────────
      edges.forEach(edge => {
        if (edge.type !== 'cross') return
        const a = nodes.find(n => n.id === edge.fromId)
        const b = nodes.find(n => n.id === edge.toId)
        if (!a || !b) return

        const edgeAlpha = Math.min(a.alpha, b.alpha)
        if (edgeAlpha < 0.04) return

        const [ax, ay] = pos(a)
        const [bx, by] = pos(b)
        const lit    = anyHover && connected.has(edge.fromId) && connected.has(edge.toId)
        const dimmed = anyHover && !lit

        ctx.save()
        const base = dimmed ? 0.025 : (lit ? 0.55 : 0.13)
        ctx.strokeStyle = `rgba(255,255,255,${base * edgeAlpha})`
        ctx.lineWidth = lit ? 1.2 : 0.6
        ctx.setLineDash([4, 10])
        ctx.lineDashOffset = -time * 18  // flowing animation
        if (lit) { ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(255,255,255,0.5)' }
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()
        ctx.restore()
      })

      // ── Draw radial edges ────────────────────────────────────────────────
      edges.forEach(edge => {
        if (edge.type !== 'radial') return
        const a = nodes.find(n => n.id === edge.fromId)
        const b = nodes.find(n => n.id === edge.toId)
        if (!a || !b) return

        const edgeAlpha = Math.min(a.alpha, b.alpha)
        if (edgeAlpha < 0.04) return

        const [ax, ay] = pos(a)
        const [bx, by] = pos(b)
        const lit    = anyHover && connected.has(edge.fromId) && connected.has(edge.toId)
        const dimmed = anyHover && !lit

        const [r, g, bl] = hexToRgb(edge.color)
        const base = dimmed ? 0.025 : (lit ? 0.72 : 0.20)

        ctx.save()
        const grad = ctx.createLinearGradient(ax, ay, bx, by)
        grad.addColorStop(0, `rgba(${r},${g},${bl},${base * edgeAlpha})`)
        grad.addColorStop(0.4, `rgba(${r},${g},${bl},${base * 0.6 * edgeAlpha})`)
        grad.addColorStop(1, `rgba(${r},${g},${bl},${base * 0.12 * edgeAlpha})`)
        ctx.strokeStyle = grad
        ctx.lineWidth = lit ? 1.8 : 0.9
        if (lit) { ctx.shadowBlur = 14; ctx.shadowColor = edge.color }
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()
        ctx.restore()
      })

      // ── Draw skill nodes ─────────────────────────────────────────────────
      nodes.forEach(node => {
        if (node.type !== 'skill') return
        if (node.alpha < 0.01) return

        const [nx, ny] = pos(node)
        const isHov  = node.id === hoverId
        const isCon  = connected.has(node.id)
        const dimmed = anyHover && !isCon

        const [r, g, b] = hexToRgb(node.color)
        const scale = isHov ? 1.55 : (isCon ? 1.2 : 1.0)
        const nr    = node.r * scale
        const drawA = dimmed ? node.alpha * 0.15 : node.alpha

        ctx.save()
        ctx.globalAlpha = drawA

        // Glow halo
        if (!dimmed) {
          ctx.shadowBlur  = isHov ? 32 : (isCon ? 16 : 8)
          ctx.shadowColor = `rgba(${r},${g},${b},0.9)`
        }

        // Radial gradient fill
        const grad = ctx.createRadialGradient(nx - nr * 0.2, ny - nr * 0.2, 0, nx, ny, nr)
        grad.addColorStop(0, `rgba(${r},${g},${b},${isHov ? 1.0 : 0.9})`)
        grad.addColorStop(0.55, `rgba(${r},${g},${b},${isHov ? 0.85 : 0.65})`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0.15)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(nx, ny, nr, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()

        // Label — always visible at low opacity, brighter when connected
        const labelAlpha = dimmed
          ? 0
          : isHov
            ? node.alpha * 0.95
            : isCon
              ? node.alpha * 0.70
              : node.alpha * 0.28

        if (labelAlpha > 0.01) {
          ctx.save()
          ctx.globalAlpha = labelAlpha
          ctx.fillStyle   = isHov ? node.color : '#d0d0d0'
          ctx.font        = `${isHov ? '500' : '400'} ${isHov ? '9.5' : '8.5'}px var(--font-mono, monospace)`
          ctx.textAlign   = 'center'
          ctx.textBaseline = 'top'
          ctx.fillText(node.label, nx, ny + nr + 6)
          ctx.restore()
        }
      })

      // ── Draw hub nodes ───────────────────────────────────────────────────
      nodes.forEach(node => {
        if (node.type !== 'hub') return
        if (node.alpha < 0.01) return

        const [nx, ny] = pos(node)
        const isHov  = node.id === hoverId
        const isCon  = connected.has(node.id)
        const dimmed = anyHover && !isCon

        const [r, g, b] = hexToRgb(node.color)
        const pulse  = 1 + Math.sin(time * 1.2 + node.phase) * 0.04   // subtle breathing
        const scale  = isHov ? 1.35 : pulse
        const nr     = node.r * scale
        const drawA  = dimmed ? node.alpha * 0.12 : node.alpha

        ctx.save()
        ctx.globalAlpha = drawA

        // Outer halo ring
        if (!dimmed) {
          const haloR = nr + (isHov ? 11 : 7)
          const haloA = isHov ? 0.55 : 0.18
          ctx.beginPath()
          ctx.arc(nx, ny, haloR, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${r},${g},${b},${haloA})`
          ctx.lineWidth = isHov ? 1.5 : 0.8
          if (isHov) { ctx.shadowBlur = 20; ctx.shadowColor = `rgba(${r},${g},${b},0.8)` }
          ctx.stroke()
          ctx.shadowBlur = 0
        }

        // Body glow
        ctx.shadowBlur  = isHov ? 40 : (isCon ? 22 : 14)
        ctx.shadowColor = `rgba(${r},${g},${b},0.9)`

        // Radial gradient body
        const grad = ctx.createRadialGradient(nx - nr * 0.22, ny - nr * 0.22, 0, nx, ny, nr)
        grad.addColorStop(0, `rgba(${r},${g},${b},0.96)`)
        grad.addColorStop(0.5, `rgba(${r},${g},${b},0.82)`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0.30)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(nx, ny, nr, 0, Math.PI * 2)
        ctx.fill()

        // Core white dot
        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.beginPath()
        ctx.arc(nx, ny, isHov ? 4.5 : 3.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()

        // Hub label
        ctx.save()
        ctx.globalAlpha = dimmed ? 0.10 : (isHov ? node.alpha * 0.95 : node.alpha * 0.70)
        ctx.fillStyle   = isHov ? node.color : `rgba(${hexToRgb(node.color).join(',')},0.85)`
        ctx.font        = `600 ${isHov ? '10.5' : '9.5'}px var(--font-mono, monospace)`
        ctx.textAlign   = 'center'
        ctx.textBaseline = 'top'
        if (isHov) {
          ctx.shadowBlur = 12
          ctx.shadowColor = node.color
        }
        ctx.fillText(node.label.toUpperCase(), nx, ny + nr + (isHov ? 13 : 10))
        ctx.restore()
      })

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)

    // ── Mouse events ─────────────────────────────────────────────────────────
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      stateRef.current.cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onLeave = () => {
      stateRef.current.cursor = { x: -9999, y: -9999 }
    }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(rafRef.current)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
      ro.disconnect()
      ScrollTrigger.getAll()
        .filter(t => t.vars.trigger === section)
        .forEach(t => t.kill())
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      aria-label="Skills network"
      className="contain-layout"
      style={{
        height: '100vh',
        background: '#050505',
        position: 'relative',
        zIndex: 1,
      }}
    >

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="absolute top-14 left-0 right-0 flex flex-col items-center pointer-events-none"
        style={{ zIndex: 2 }}
      >
        <p
          className="font-mono text-[10px] tracking-[0.35em] uppercase"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          capability_matrix.sys
        </p>
        <p
          className="font-mono text-[11px] tracking-[0.22em] uppercase mt-1.5"
          style={{ color: 'rgba(255,255,255,0.38)' }}
        >
          — skill network —
        </p>
      </div>

      {/* ── Canvas ────────────────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ cursor: 'crosshair' }}
      />

      {/* ── Tooltip ───────────────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="fixed z-50 pointer-events-none"
        style={{
          opacity: tooltip.visible ? 1 : 0,
          left: tooltip.vx,
          top: tooltip.vy,
          transform: 'translateX(-50%)',
          transition: 'opacity 0.12s ease',
        }}
      >
        <div
          className="px-3 py-2 rounded-sm text-center"
          style={{
            background: 'rgba(5,5,5,0.92)',
            border: `1px solid ${tooltip.color}38`,
            backdropFilter: 'blur(14px)',
            boxShadow: `0 0 28px ${tooltip.color}22, inset 0 0 12px ${tooltip.color}08`,
            minWidth: '128px',
          }}
        >
          <div
            className="font-mono text-[10px] font-semibold tracking-wider uppercase mb-0.5"
            style={{ color: tooltip.color }}
          >
            {tooltip.label}
          </div>
          <div
            className="font-mono text-[9px] tracking-wide"
            style={{ color: 'rgba(255,255,255,0.42)' }}
          >
            {tooltip.note}
          </div>
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute bottom-8 left-8 pointer-events-none flex flex-col gap-1"
        style={{ zIndex: 2 }}
      >
        {Object.entries({
          'AI / ML': '#7cffcb',
          'Frontend': '#60a5fa',
          'Backend': '#f97316',
          'Native / macOS': '#4ade80',
          'Tools': '#a78bfa',
        }).map(([label, color]) => (
          <div key={label} className="flex items-center gap-2">
            <div
              style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: color,
                boxShadow: `0 0 6px ${color}`,
              }}
            />
            <span
              className="font-mono text-[8px] tracking-[0.2em] uppercase"
              style={{ color: `${color}70` }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Corner hint ───────────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute bottom-8 right-8 pointer-events-none"
        style={{ color: 'rgba(255,255,255,0.14)', zIndex: 2 }}
      >
        <p className="font-mono text-[8px] tracking-[0.25em] uppercase">hover to explore</p>
      </div>

    </section>
  )
}
