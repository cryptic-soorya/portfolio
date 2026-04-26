'use client'

import { useRef, useEffect } from 'react'
import { SITE } from '@/lib/data/site'
// Import registers ScrollTrigger + CustomEase as a side-effect
import { gsap } from '@/lib/animations/gsap.config'
import { EASE, DURATION } from '@/lib/animations/easing'
import { CalibrationNoise, type NoiseHandle } from './CalibrationNoise'
import { PortraitReveal } from './PortraitReveal'

// ─── Scramble engine ──────────────────────────────────────────────────────────

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!<>-_\\/[]{}—=+*^?#@|~'

/**
 * Signal-lock scramble with organic stutter.
 *
 * Characters resolve with a front-weighted power curve (earlier chars lock faster).
 * ~4% chance of brief re-scramble on already-resolved chars before 75% complete —
 * mimics a radio signal struggling to acquire before locking in cleanly.
 */
function scramble(
  el: HTMLElement,
  target: string,
  duration: number,
  onComplete?: () => void
): () => void {
  let frame = 0
  const totalFrames = Math.round(duration * 60)
  const stuttered = new Set<number>()
  let rafId = 0

  function tick() {
    frame++
    const t = Math.min(frame / totalFrames, 1)
    const progress = Math.pow(t, 0.65) // front-weighted resolution
    const resolved = Math.floor(progress * target.length)

    let out = ''
    for (let i = 0; i < target.length; i++) {
      if (target[i] === ' ') { out += ' '; continue }

      const isResolved = i < resolved

      if (isResolved && t < 0.75 && !stuttered.has(i) && Math.random() < 0.04) {
        stuttered.add(i)
        out += CHARS[Math.floor(Math.random() * CHARS.length)]
      } else if (isResolved) {
        out += target[i]
      } else {
        out += CHARS[Math.floor(Math.random() * CHARS.length)]
      }
    }

    el.textContent = out

    if (frame < totalFrames) {
      rafId = requestAnimationFrame(tick)
    } else {
      el.textContent = target
      onComplete?.()
    }
  }

  rafId = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(rafId)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalibrationHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const glowRef    = useRef<HTMLDivElement>(null)
  const eyebrowRef = useRef<HTMLSpanElement>(null)
  const nameH1Ref  = useRef<HTMLHeadingElement>(null)
  const nameL1Ref  = useRef<HTMLSpanElement>(null)
  const nameL2Ref  = useRef<HTMLSpanElement>(null)
  const accentRef  = useRef<HTMLDivElement>(null)
  const taglineRef = useRef<HTMLDivElement>(null)
  const ctaRef     = useRef<HTMLAnchorElement>(null)
  const noiseRef   = useRef<NoiseHandle>(null)

  const [taglineA, taglineB] = SITE.hero.tagline.split('. ')
  const wordsA = taglineA.split(' ')
  const wordsB = taglineB ? taglineB.split(' ') : []

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    // ── Scramble RAF functions (not tracked by GSAP context, cancelled manually) ──
    const cancelFns: Array<() => void> = []

    // ── Mouse parallax state — defined outside ctx so mousemove can read it ──
    const px = { strength: 0 }

    // ── Single GSAP context owns all tweens + ScrollTrigger ───────────────
    // This guarantees clean revert on React Strict Mode double-mount cleanup.
    const ctx = gsap.context(() => {

      const displaceEl = section.querySelector<SVGFEDisplacementMapElement>('#cal-displace')
      const wordEls    = section.querySelectorAll<HTMLElement>('.cal-word')

      // ── Initial states ──────────────────────────────────────────────────
      gsap.set(
        [eyebrowRef.current, nameL1Ref.current, nameL2Ref.current, ctaRef.current],
        { opacity: 0 }
      )
      gsap.set(ctaRef.current, { y: 28 })
      gsap.set(accentRef.current, { scaleX: 0, opacity: 0, transformOrigin: 'left center' })
      gsap.set(glowRef.current, { opacity: 0, scale: 0.85 })
      gsap.set(nameH1Ref.current, { transformPerspective: 1200 })
      gsap.set(wordEls, { y: '115%' })

      noiseRef.current?.setIntensity(0.16)

      // ── Parallax intensity ramp (tracked inside ctx) ────────────────────
      gsap.to(px, { strength: 1, duration: 1.8, delay: 3.2, ease: EASE.smooth })

      // ── Atmospheric glow — rises immediately in background ──────────────
      gsap.to(glowRef.current, {
        opacity: 0.28,
        scale: 1,
        duration: 3.5,
        ease: EASE.cinematic,
      })

      // ── Entry — overlapping cascade ─────────────────────────────────────
      const entry = gsap.timeline()

      // Eyebrow at t=0.25
      entry
        .to(eyebrowRef.current, { opacity: 1, duration: 0.06 }, 0.25)
        .call(() => {
          if (eyebrowRef.current)
            cancelFns.push(scramble(eyebrowRef.current, SITE.hero.eyebrow, 0.9))
        }, [], 0.25)

      // Name L1 at t=0.55 — eyebrow still resolving, overlap is intentional
      entry
        .to(nameL1Ref.current, { opacity: 1, duration: 0.06 }, 0.55)
        .call(() => {
          const el = nameL1Ref.current
          if (!el) return

          // Chromatic aberration appears with the text
          gsap.set(el, { textShadow: '-4px 0 rgba(255,0,80,0.55), 4px 0 rgba(0,230,210,0.55)' })

          // Distortion spike when text materialises
          if (displaceEl) {
            gsap.fromTo(displaceEl,
              { attr: { scale: 18 } },
              { attr: { scale: 0 }, duration: 2.8, ease: 'expo.out' }
            )
          }

          cancelFns.push(
            scramble(el, SITE.hero.nameLines[0], 1.4, () => {
              // On lock-in: aberration collapses to phosphor glow then fades
              gsap.to(el, {
                textShadow: '0 0 50px rgba(124,255,203,0.85)',
                duration: 0.12,
                onComplete: () => {
                  gsap.to(el, {
                    textShadow: '0 0 0px rgba(124,255,203,0)',
                    duration: 1.6,
                    ease: EASE.smooth,
                  })
                },
              })
            })
          )
        }, [], 0.55)

      // Name L2 at t=1.05 — L1 ~40% resolved
      entry
        .to(nameL2Ref.current, { opacity: 1, duration: 0.06 }, 1.05)
        .call(() => {
          const el = nameL2Ref.current
          if (!el) return

          gsap.set(el, { textShadow: '-3px 0 rgba(255,0,80,0.4), 3px 0 rgba(0,230,210,0.4)' })

          cancelFns.push(
            scramble(el, SITE.hero.nameLines[1], 1.1, () => {
              gsap.to(el, {
                textShadow: '0 0 35px rgba(124,255,203,0.7)',
                duration: 0.12,
                onComplete: () => {
                  gsap.to(el, {
                    textShadow: '0 0 0px rgba(124,255,203,0)',
                    duration: 1.2,
                    ease: EASE.smooth,
                  })
                },
              })
            })
          )
        }, [], 1.05)

      // Accent line — liquid fill with spring overshoot
      entry.fromTo(
        accentRef.current,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.7, ease: 'back.out(2.2)' },
        1.55
      )

      // Tagline words — cascades in while L2 is still resolving
      entry.to(wordEls, {
        y: 0,
        duration: 0.75,
        stagger: 0.036,
        ease: EASE.smooth,
      }, 1.75)

      // CTA
      entry.to(ctaRef.current, {
        opacity: 1,
        y: 0,
        duration: DURATION.slow,
        ease: EASE.smooth,
      }, 2.35)

      // Noise settles
      const noiseObj = { v: 0.16 }
      entry.to(noiseObj, {
        v: 0.020,
        duration: 2.4,
        ease: 'expo.out',
        onUpdate: () => noiseRef.current?.setIntensity(noiseObj.v),
      }, 2.8)

      // Ambient glow breathe — begins after entry fully settles
      gsap.to(glowRef.current, {
        opacity: 0.38,
        scale: 1.06,
        duration: 4.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 4.5,
      })

      // ── Scroll-driven exit — depth-aware dissolution ─────────────────────
      // Each element exits at a rate matching its virtual z-depth:
      //   eyebrow/CTA (closest) — fastest exit, most travel
      //   tagline               — medium depth
      //   name                  — stays longest
      //   glow (furthest)       — barely moves until name is gone
      const noiseExit = { v: 0.020 }
      const wordElsExit = section.querySelectorAll<HTMLElement>('.cal-word')

      const exitTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${window.innerHeight * 0.80}`,
          pin: true,
          pinSpacing: true,
          scrub: 1.4,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      // Eyebrow — exits up fast (closest layer)
      exitTl.to(eyebrowRef.current, {
        y: -65, opacity: 0, ease: 'power2.in', duration: 0.22,
      }, 0)

      // CTA — exits up with acceleration
      exitTl.to(ctaRef.current, {
        y: -40, opacity: 0, ease: 'power2.in', duration: 0.18,
      }, 0)

      // Accent line — retracts right-to-left (feels like being erased)
      exitTl.to(accentRef.current, {
        scaleX: 0, opacity: 0,
        duration: 0.14, ease: 'power2.in',
        transformOrigin: 'right center',
      }, 0.02)

      // Tagline — drops away (stagger from last word for inside-out feel)
      exitTl.to(wordElsExit, {
        y: 38, opacity: 0,
        ease: 'power1.in', duration: 0.30,
        stagger: { each: 0.008, from: 'end' },
      }, 0.06)

      // Name — last thing standing, scale+blur+skew, accelerates out
      exitTl.to([nameL1Ref.current, nameL2Ref.current], {
        scale:   1.055,
        filter:  'blur(18px)',
        opacity: 0,
        skewX:   1.5,
        ease:    'power3.in',
        duration: 0.62,
        stagger:  0.05,
      }, 0.22)

      // Glow — expands and fades last (deepest layer)
      exitTl.to(glowRef.current, {
        scale: 1.8, opacity: 0,
        ease: 'power2.in', duration: 0.45,
      }, 0.35)

      // Portrait — dissolves in sync with glow (same virtual depth)
      const portraitWrap = section.querySelector('[data-portrait-wrap]')
      if (portraitWrap) {
        exitTl.to(portraitWrap, {
          opacity: 0,
          filter: 'blur(22px)',
          ease: 'power2.in',
          duration: 0.48,
        }, 0.28)
      }

      // Noise surges as identity dissolves
      exitTl.to(noiseExit, {
        v: 0.20,
        ease: 'power2.in', duration: 0.50,
        onUpdate: () => noiseRef.current?.setIntensity(noiseExit.v),
      }, 0.40)

    }, section) // end gsap.context

    // ── Mouse parallax — wired outside ctx but reads ctx-tracked px ───────
    function onMouseMove(e: MouseEvent) {
      const cx = window.innerWidth  / 2
      const cy = window.innerHeight / 2
      const nx = ((e.clientX - cx) / cx) * px.strength
      const ny = ((e.clientY - cy) / cy) * px.strength

      // Name: mild 3D rotation — floats in its own space
      gsap.to(nameH1Ref.current, {
        rotateY:  nx * 4.5,
        rotateX: -ny * 2.5,
        duration: 1.8,
        ease: 'power2.out',
        overwrite: 'auto',
      })

      // Eyebrow: more movement (closer virtual layer)
      gsap.to(eyebrowRef.current, {
        x: nx * 7,
        duration: 1.4,
        ease: 'power2.out',
        overwrite: 'auto',
      })

      // Tagline: counter-moves (further virtual layer)
      gsap.to(taglineRef.current, {
        x: nx * -4,
        duration: 2.0,
        ease: 'power2.out',
        overwrite: 'auto',
      })

      // Glow: drifts counter to cursor — deepest layer, most inertia
      gsap.to(glowRef.current, {
        x: nx * -45,
        y: ny * -25,
        duration: 2.6,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    section.addEventListener('mousemove', onMouseMove)

    return () => {
      cancelFns.forEach((fn) => fn())
      section.removeEventListener('mousemove', onMouseMove)
      ctx.revert()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden bg-[#050505]"
      aria-label="Hero"
    >
      {/* ── SVG filter definition — 0×0, just defines the filter ── */}
      <svg
        aria-hidden
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          <filter
            id="cal-distort"
            x="-15%" y="-35%"
            width="130%" height="170%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              id="cal-turb"
              type="turbulence"
              baseFrequency="0.018 0.004"
              numOctaves="3"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              id="cal-displace"
              in2="noise"
              in="SourceGraphic"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* ── Grain overlay ── */}
      <CalibrationNoise ref={noiseRef} />

      {/* ── Atmospheric glow — depth -1, behind everything ── */}
      <div
        ref={glowRef}
        aria-hidden
        className="absolute pointer-events-none will-transform"
        style={{
          zIndex: 0,
          top: '25%',
          left: '2%',
          width: '70%',
          aspectRatio: '1.8',
          background:
            'radial-gradient(ellipse at center, rgba(124,255,203,0.10) 0%, rgba(124,255,203,0.03) 50%, transparent 72%)',
          filter: 'blur(50px)',
          transformOrigin: 'center center',
        }}
      />

      {/* ── Portrait reveal — z=5, between glow and text ── */}
      <PortraitReveal />

      {/* ── Main content ── */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 max-w-[1600px]">

        {/* Eyebrow — virtual layer +1 */}
        <span
          ref={eyebrowRef}
          className="block font-mono text-[11px] tracking-[0.35em] uppercase text-[var(--color-accent)] mb-8 will-transform"
        >
          {SITE.hero.eyebrow}
        </span>

        {/* Name — virtual layer 0, filter + 3D rotation via GSAP */}
        <h1
          ref={nameH1Ref}
          className="font-sans will-transform backface-hidden"
          style={{
            lineHeight: 0.88,
            letterSpacing: '-0.03em',
            filter: 'url(#cal-distort)',
          }}
        >
          <span
            ref={nameL1Ref}
            className="block text-[clamp(4rem,12vw,13rem)] font-bold text-[var(--color-text-primary)] will-transform"
          >
            {SITE.hero.nameLines[0]}
          </span>
          <span
            ref={nameL2Ref}
            className="block text-[clamp(4rem,12vw,13rem)] font-bold italic text-[var(--color-text-primary)] will-transform"
          >
            {SITE.hero.nameLines[1]}
          </span>
        </h1>

        {/* Accent rule */}
        <div
          ref={accentRef}
          className="mt-7 mb-8 md:mt-8 md:mb-9 h-px w-20 bg-[var(--color-accent)]"
          aria-hidden
        />

        {/* Tagline — virtual layer +0.5 */}
        <div
          ref={taglineRef}
          className="flex flex-col gap-[0.2em] max-w-2xl will-transform"
          aria-label={SITE.hero.tagline}
        >
          <p className="flex flex-wrap gap-x-[0.3em] leading-[1.6]">
            {wordsA.map((word, i) => (
              <span key={i} className="overflow-hidden inline-block" aria-hidden>
                <span className="cal-word inline-block text-[clamp(0.9rem,1.4vw,1.15rem)] text-[var(--color-text-secondary)] font-sans">
                  {i === wordsA.length - 1 ? `${word}.` : word}
                </span>
              </span>
            ))}
          </p>

          {wordsB.length > 0 && (
            <p className="flex flex-wrap gap-x-[0.28em] leading-[1.6]">
              {wordsB.map((word, i) => (
                <span key={i} className="overflow-hidden inline-block" aria-hidden>
                  <span className="cal-word inline-block text-[clamp(0.75rem,1.15vw,0.92rem)] font-mono text-[var(--color-text-tertiary)] tracking-wide">
                    {word}
                  </span>
                </span>
              ))}
            </p>
          )}
        </div>

        {/* CTA — virtual layer +1 */}
        <a
          ref={ctaRef}
          href={SITE.hero.cta.target}
          className="inline-flex items-center gap-3 mt-12 md:mt-14 self-start font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--color-text-primary)] border border-[var(--color-border-strong)] px-7 py-4 transition-colors duration-300 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          {SITE.hero.cta.label}
        </a>
      </div>
    </section>
  )
}
