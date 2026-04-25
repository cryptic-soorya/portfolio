'use client'

import type { Project } from '@/lib/data/types'

interface Props {
  project: Project
}

/**
 * WorldContent — full-screen editorial content layout.
 *
 * No cards. No grids. Content owns the space.
 *
 * Layout zones:
 *   top-left     — index + status
 *   center-left  — name (massive), tagline, description
 *   bottom-left  — tags + link
 *   right-center — year (rotated)
 */
export function WorldContent({ project }: Props) {
  const isLive = project.status.toLowerCase() === 'live'

  return (
    <div
      className="absolute inset-0 flex flex-col justify-between px-8 md:px-16 lg:px-24 py-10 pointer-events-none select-none"
      style={{ zIndex: 10 }}
    >
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        {/* Index */}
        <span
          className="world-index font-mono text-[10px] tracking-[0.4em] uppercase will-transform"
          style={{ color: project.accentColor, opacity: 0.7 }}
        >
          {project.index} / 04
        </span>

        {/* Status */}
        <div className="world-status flex items-center gap-2 will-transform">
          <span
            className="block w-[5px] h-[5px] rounded-full"
            style={{
              background: isLive ? project.accentColor : 'rgba(255,255,255,0.3)',
              boxShadow:  isLive ? `0 0 6px ${project.accentColor}` : 'none',
            }}
          />
          <span
            className="font-mono text-[9px] tracking-[0.35em] uppercase"
            style={{ color: isLive ? project.accentColor : 'rgba(255,255,255,0.3)' }}
          >
            {project.status}
          </span>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div className="max-w-[56rem]">

          {/* Project name — owns the space */}
          <h2
            className="world-name font-sans font-bold leading-[0.86] tracking-[-0.03em] will-transform"
            style={{
              fontSize:   'clamp(3.8rem, 9.5vw, 11rem)',
              color:      'var(--color-text-primary)',
            }}
          >
            {project.name}
          </h2>

          {/* Accent rule under name */}
          <div
            className="world-rule mt-5 mb-6 h-px will-transform"
            style={{
              width:      '3.5rem',
              background: project.accentColor,
              transformOrigin: 'left center',
            }}
          />

          {/* Tagline */}
          <p
            className="world-tagline font-sans text-[clamp(1rem,1.6vw,1.35rem)] font-light italic leading-[1.5] mb-6 will-transform"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {project.tagline}
          </p>

          {/* Description */}
          <p
            className="world-description font-sans text-[clamp(0.78rem,1.1vw,0.94rem)] leading-[1.75] max-w-[42rem] will-transform"
            style={{ color: 'var(--color-text-secondary)', opacity: 0.75 }}
          >
            {project.description}
          </p>

          {/* Tags + Link row */}
          <div className="world-meta mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 will-transform">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[9px] tracking-[0.25em] uppercase px-3 py-1.5 border"
                  style={{
                    color:       project.accentColor,
                    borderColor: `${project.accentColor}30`,
                    background:  `${project.accentColor}08`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Divider */}
            <span className="hidden md:block w-px h-4 bg-white/10" aria-hidden />

            {/* Links */}
            <div className="flex gap-4 pointer-events-auto">
              {project.link.url ? (
                <a
                  href={project.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] tracking-[0.3em] uppercase flex items-center gap-2 transition-opacity duration-300 hover:opacity-100"
                  style={{ color: project.accentColor, opacity: 0.7 }}
                >
                  {project.link.label}
                  <span aria-hidden>↗</span>
                </a>
              ) : (
                <span
                  className="font-mono text-[10px] tracking-[0.3em] uppercase"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  {project.link.label} — Coming
                </span>
              )}

              {project.secondLink && project.secondLink.url && (
                <a
                  href={project.secondLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] tracking-[0.3em] uppercase flex items-center gap-2 transition-opacity duration-300 hover:opacity-100"
                  style={{ color: project.accentColor, opacity: 0.7 }}
                >
                  {project.secondLink.label}
                  <span aria-hidden>↗</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Year — right side, rotated */}
        <div
          className="world-year hidden lg:flex items-center gap-3 will-transform"
          style={{
            writingMode: 'vertical-rl',
            transform:   'rotate(180deg)',
            color:       'rgba(255,255,255,0.12)',
          }}
        >
          <span className="font-mono text-[10px] tracking-[0.35em]">{project.year}</span>
        </div>
      </div>
    </div>
  )
}
