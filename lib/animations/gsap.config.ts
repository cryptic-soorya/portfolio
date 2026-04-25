/**
 * Central GSAP configuration.
 * All animation code imports gsap, ScrollTrigger, and CustomEase from here —
 * never from 'gsap' directly — so plugins are always registered before use.
 *
 * Safe to import only from client components / client modules.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, CustomEase)

  // force3D: use matrix3d on all transform animations → GPU compositing.
  // nullTargetWarn: suppress SSR/hydration ref misses.
  gsap.config({ force3D: true, nullTargetWarn: false })

  // Register the signature easing used across the experience
  CustomEase.create(
    'portfolio.smooth',
    'M0,0 C0.075,0.82 0.165,1 1,1'
  )

  // Snap, energetic entry
  CustomEase.create(
    'portfolio.punch',
    'M0,0 C0.215,0.61 0.355,1 1,1'
  )

  // Slow inhale, dramatic exhale — environmental transitions
  CustomEase.create(
    'portfolio.cinematic',
    'M0,0 C0.42,0 0.58,1 1,1'
  )

  // TV collapse — screen resists before giving up.
  // Curve: slow start, micro-hesitation at ~30%, then violent acceleration.
  CustomEase.create(
    'tv.resist',
    'M0,0 C0.14,0.02 0.26,0.18 0.30,0.22 C0.34,0.26 0.33,0.19 0.40,0.28 C0.60,0.80 0.84,0.99 1,1'
  )

  // Orb eruption — bursts past target scale then settles with spring feel.
  CustomEase.create(
    'tv.burst',
    'M0,0 C0.14,0.86 0.24,1.04 0.36,1.02 C0.52,1.01 0.72,1.00 1,1'
  )
}

export { gsap, ScrollTrigger, CustomEase }
export default gsap
