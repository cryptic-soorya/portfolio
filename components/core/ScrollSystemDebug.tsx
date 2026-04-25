'use client'

import { useScrollProgress } from '@/hooks/useScrollProgress'
import { useLenis } from '@/hooks/useLenis'
import { cn } from '@/lib/utils'

/**
 * Phase 1 debug overlay — confirms Lenis + GSAP ticker are operational.
 * Displays live scroll state: progress, velocity, direction.
 *
 * Removed entirely in Phase 2.
 */
export function ScrollSystemDebug() {
  const { progress, scroll, velocity, direction } = useScrollProgress()
  const lenis = useLenis()

  const isReady = lenis !== null

  return (
    <div
      className="fixed bottom-6 left-6 z-[9999] font-mono text-[10px] leading-relaxed select-none pointer-events-none"
      aria-hidden
    >
      <div
        className={cn(
          'flex flex-col gap-0.5 px-3 py-2.5 rounded border',
          'bg-black/80 backdrop-blur-sm',
          isReady
            ? 'border-[var(--color-accent)]/20 text-[var(--color-accent)]/70'
            : 'border-white/10 text-white/30'
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'inline-block w-1.5 h-1.5 rounded-full',
              isReady ? 'bg-[var(--color-accent)]' : 'bg-white/20'
            )}
          />
          <span className="uppercase tracking-widest text-[9px]">
            {isReady ? 'lenis · active' : 'lenis · initializing'}
          </span>
        </div>

        <Row label="progress" value={`${(progress * 100).toFixed(1)}%`} />
        <Row label="scroll  " value={`${Math.round(scroll)}px`} />
        <Row
          label="velocity"
          value={velocity.toFixed(3)}
          highlight={Math.abs(velocity) > 0.1}
        />
        <Row label="dir     " value={direction === 1 ? '↓ down' : '↑ up'} />
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex gap-3">
      <span className="opacity-40">{label}</span>
      <span className={highlight ? 'opacity-100' : 'opacity-70'}>{value}</span>
    </div>
  )
}
