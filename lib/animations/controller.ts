/**
 * Global animation controller.
 *
 * Single source of truth for which "world" is active and what the
 * current accent color should be. Components never set CSS variables
 * directly — they call controller methods and the controller orchestrates
 * the transition.
 *
 * Why a module singleton instead of React state?
 * — GSAP timeline callbacks run outside React's render cycle.
 *   A plain object with a GSAP tween is the correct primitive here.
 *
 * Usage:
 *   controller.enterProject('vocterm', '#4ade80')
 *   controller.exitProject()
 *   controller.setSection('hero')
 */
import { gsap } from './gsap.config'
import { DURATION } from './easing'

export type SectionId = 'hero' | 'about' | 'marquee' | 'projects' | 'skills' | 'contact'

interface ControllerState {
  activeSection: SectionId
  activeProject: string | null
  accentColor: string
}

const state: ControllerState = {
  activeSection: 'hero',
  activeProject: null,
  accentColor: '#7cffcb', // default mint — matches globals.css
}

const DEFAULT_ACCENT = '#7cffcb'

/** Returns a snapshot of current controller state (read-only) */
export function getControllerState(): Readonly<ControllerState> {
  return { ...state }
}

/** Transition the global accent color to the project's world color */
export function enterProject(projectId: string, accentColor: string): void {
  state.activeProject = projectId
  state.accentColor = accentColor

  gsap.to(document.documentElement, {
    '--color-accent': accentColor,
    duration: DURATION.cinematic,
    ease: 'portfolio.cinematic',
  })
}

/** Reset accent color to default when leaving a project world */
export function exitProject(): void {
  state.activeProject = null
  state.accentColor = DEFAULT_ACCENT

  gsap.to(document.documentElement, {
    '--color-accent': DEFAULT_ACCENT,
    duration: DURATION.slow,
    ease: 'portfolio.smooth',
  })
}

/** Mark the active section — consumed by the scroll progress indicator */
export function setSection(section: SectionId): void {
  state.activeSection = section
}

const controller = { enterProject, exitProject, setSection, getControllerState }
export default controller
