'use client'

import { useEffect, useState } from 'react'
import { PROJECTS } from '@/lib/data/projects'

const P = PROJECTS[0]

const BOOT_LINES: Array<{ text: string; color: 'cmd' | 'out' | 'dim' | 'warn' | 'gap' }> = [
  { text: '$ vocterm --start --model=mistral',            color: 'cmd'  },
  { text: '> loading faster-whisper... OK',               color: 'out'  },
  { text: '> connecting ollama/mistral:7b... OK',         color: 'out'  },
  { text: '> gemini-1.5-flash registered as fallback',    color: 'dim'  },
  { text: '> zero telemetry mode: enabled',               color: 'out'  },
  { text: '> listening on default mic',                   color: 'out'  },
  { text: '',                                             color: 'gap'  },
  { text: '$ "delete everything in Downloads"',           color: 'cmd'  },
  { text: '',                                             color: 'gap'  },
  { text: '  ↳ rm -rf ~/Downloads/*',                     color: 'warn' },
  { text: '',                                             color: 'gap'  },
]

// Commands the risk preview cycles through on click
const PREVIEWS = [
  { cmd: 'rm -rf ~/Downloads/*',        risk: 0.68, rev: false, note: 'DESTRUCTIVE — not recoverable' },
  { cmd: 'brew install --cask cursor',   risk: 0.11, rev: true,  note: 'brew uninstall to undo'      },
  { cmd: 'sudo shutdown -h +5',          risk: 0.90, rev: false, note: 'saves open docs first'       },
  { cmd: 'git reset --hard HEAD~3',      risk: 0.77, rev: false, note: '3 commits erased'            },
  { cmd: 'pip install -r requirements',  risk: 0.08, rev: true,  note: 'pip uninstall to undo'       },
]

const RISK_COLOR = (r: number) =>
  r > 0.7 ? '#ef4444' : r > 0.4 ? '#f59e0b' : '#4ade80'

export function VoctermContent() {
  const [printedLines, setPrintedLines] = useState<typeof BOOT_LINES>([])
  const [booted, setBooted] = useState(false)
  const [previewIdx, setPreviewIdx] = useState(0)
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      if (i >= BOOT_LINES.length) {
        clearInterval(id)
        setBooted(true)
        return
      }
      const line = BOOT_LINES[i]
      setPrintedLines((p) => [...p, line])
      i++
    }, 210)
    return () => clearInterval(id)
  }, [])

  const preview = PREVIEWS[previewIdx]
  const barW    = `${preview.risk * 100}%`
  const riskCol = RISK_COLOR(preview.risk)

  return (
    <div
      className="absolute inset-0 flex flex-col font-mono select-none"
      style={{ zIndex: 10 }}
    >
      {/* ── Scanline overlay ─────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)',
          zIndex: 1,
        }}
      />

      {/* ── Terminal window ──────────────────────────────── */}
      <div className="relative flex flex-col h-full p-6 md:p-12" style={{ zIndex: 2 }}>

        {/* ── Project identity ─────────────────────────── */}
        <div className="mb-6">
          {/* Index */}
          <div className="font-mono text-[9px] tracking-[0.5em] uppercase mb-3" style={{ color: 'rgba(74,222,128,0.30)' }}>
            01 / 04
          </div>
          {/* Name */}
          <h2
            className="font-sans font-bold leading-[0.9] tracking-[-0.03em] mb-3"
            style={{ fontSize: 'clamp(2.4rem,6vw,6rem)', color: 'var(--color-text-primary)' }}
          >
            {P.name}
          </h2>
          {/* Tagline */}
          <p
            className="font-mono text-[clamp(0.72rem,1.1vw,0.9rem)] italic mb-2"
            style={{ color: 'rgba(74,222,128,0.60)' }}
          >
            {P.tagline}
          </p>
          {/* Description */}
          <p
            className="font-sans text-[clamp(0.70rem,0.95vw,0.82rem)] leading-[1.7] max-w-[38rem]"
            style={{ color: 'rgba(255,255,255,0.32)' }}
          >
            {P.description.split('.').slice(0, 2).join('.')}.
          </p>
          {/* Accent rule */}
          <div className="mt-4 mb-0 h-px w-10" style={{ background: '#4ade80', opacity: 0.5 }} />
        </div>

        {/* Window chrome */}
        <div className="flex items-center gap-[6px] mb-5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
          <span
            className="ml-4 text-[9px] tracking-[0.4em] uppercase"
            style={{ color: 'rgba(74,222,128,0.25)' }}
          >
            vocterm — v0.9.4-beta
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-[5px] h-[5px] rounded-full inline-block animate-pulse" style={{ background: '#4ade80' }} />
            <span className="text-[9px] tracking-[0.3em]" style={{ color: 'rgba(74,222,128,0.35)' }}>LIVE</span>
          </div>
        </div>

        <div className="w-full h-px mb-5" style={{ background: 'rgba(74,222,128,0.08)' }} />

        {/* Boot output */}
        <div className="flex-1 overflow-hidden">
          {printedLines.map((line, i) => (
            <div
              key={i}
              className="text-[12px] md:text-[13px] leading-[2.0]"
              style={{
                color:
                  line.color === 'cmd'  ? '#4ade80' :
                  line.color === 'warn' ? '#fbbf24' :
                  line.color === 'dim'  ? 'rgba(74,222,128,0.3)' :
                  'rgba(74,222,128,0.55)',
                fontWeight: line.color === 'cmd' ? 600 : 400,
              }}
            >
              {line.text}
            </div>
          ))}
          {booted && (
            <span
              className="inline-block w-[9px] h-[1.1em] align-middle ml-px"
              style={{ background: '#4ade80', animation: 'cursor-blink 1.1s step-end infinite' }}
            />
          )}
        </div>

        {/* ── Risk preview ─────────────────────────────── */}
        <div
          className="mt-auto pt-5 cursor-pointer group"
          style={{ borderTop: '1px solid rgba(74,222,128,0.07)' }}
        >
          <div
            className="text-[9px] tracking-[0.45em] uppercase mb-3"
            style={{ color: 'rgba(74,222,128,0.25)' }}
          >
            RISK PREVIEW
          </div>

          <div
            className="text-[13px] md:text-[14px] mb-3 transition-opacity"
            style={{ color: riskCol }}
            onClick={() => { setPreviewIdx((previewIdx + 1) % PREVIEWS.length); setAllowed(null) }}
          >
            $ {preview.cmd}
          </div>

          {/* Risk bar */}
          <div className="relative h-px w-full mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="absolute left-0 top-0 h-full transition-all duration-500"
              style={{ width: barW, background: riskCol, boxShadow: `0 0 6px ${riskCol}` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: riskCol }}>
              RISK {(preview.risk * 100).toFixed(0)}%
              {!preview.rev && ' · IRREVERSIBLE'}
            </span>
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {preview.note}
            </span>
          </div>

          {/* Allow / Deny */}
          {allowed === null ? (
            <div className="flex gap-4 mt-4">
              <button
                className="text-[10px] tracking-[0.3em] uppercase px-5 py-2 border transition-all duration-200"
                style={{ color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.05)' }}
                onClick={(e) => { e.stopPropagation(); setAllowed(true) }}
              >
                ALLOW
              </button>
              <button
                className="text-[10px] tracking-[0.3em] uppercase px-5 py-2 border transition-all duration-200"
                style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}
                onClick={(e) => { e.stopPropagation(); setAllowed(false) }}
              >
                DENY
              </button>
            </div>
          ) : (
            <div
              className="mt-4 text-[11px] tracking-widest"
              style={{ color: allowed ? '#4ade80' : '#ef4444' }}
            >
              {allowed ? '> executing...' : '> aborted. safe.'}
            </div>
          )}

          {/* Meta — year + tags, very quiet */}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 items-center">
            <span className="text-[9px] tracking-[0.3em]" style={{ color: 'rgba(74,222,128,0.15)' }}>
              {P.year}
            </span>
            {P.tags.slice(0, 4).map((t) => (
              <span key={t} className="text-[9px] tracking-[0.2em]" style={{ color: 'rgba(74,222,128,0.15)' }}>
                {t}
              </span>
            ))}
            {P.link.url ? (
              <a
                href={P.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[9px] tracking-[0.3em] uppercase"
                style={{ color: 'rgba(74,222,128,0.4)' }}
                onClick={(e) => e.stopPropagation()}
              >
                GitHub ↗
              </a>
            ) : (
              <span className="ml-auto text-[9px] tracking-[0.2em]" style={{ color: 'rgba(74,222,128,0.12)' }}>
                GitHub — soon
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
