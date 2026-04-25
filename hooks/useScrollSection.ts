'use client'

/**
 * Tracks which section is currently in the viewport.
 *
 * Works by attaching IntersectionObserver to elements with
 * data-section="<sectionId>" attributes.
 *
 * Usage:
 *   const activeSection = useScrollSection()
 *   // → 'hero' | 'about' | 'projects' | etc.
 *
 *   // In your JSX:
 *   <section data-section="projects">...</section>
 */
import { useState, useEffect } from 'react'
import type { SectionId } from '@/lib/animations/controller'
import { setSection } from '@/lib/animations/controller'

export function useScrollSection(): SectionId {
  const [active, setActive] = useState<SectionId>('hero')

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('[data-section]')
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.section as SectionId
            if (id) {
              setActive(id)
              setSection(id) // sync to global controller
            }
          }
        }
      },
      {
        // Fire when the section is 40% visible
        threshold: 0.4,
      }
    )

    sections.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return active
}
