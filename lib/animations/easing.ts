/**
 * Easing constants for both GSAP timelines and CSS transitions.
 *
 * GSAP strings reference registered CustomEase names (from gsap.config.ts)
 * or built-in GSAP ease strings.
 *
 * CSS counterparts are kept here for consistency when Tailwind transitions
 * need to match GSAP-driven motion.
 */

export const EASE = {
  // General-purpose smooth deceleration
  smooth: 'portfolio.smooth',
  // Energetic snap-in — use for reveal moments
  punch: 'portfolio.punch',
  // Environmental state changes — slower, weightier
  cinematic: 'portfolio.cinematic',
  // Organic bounce for playful micro-interactions
  spring: 'back.out(1.7)',
  // Pure expo for high-speed entry
  expo: 'expo.out',
} as const

export type EaseKey = keyof typeof EASE

/** Default durations by interaction type (seconds) */
export const DURATION = {
  instant: 0.15,
  fast: 0.3,
  normal: 0.6,
  slow: 1.0,
  cinematic: 1.6,
  epic: 2.4,
} as const

export type DurationKey = keyof typeof DURATION
