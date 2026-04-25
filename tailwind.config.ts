import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Maps to CSS custom properties defined in globals.css
      // GSAP can animate the CSS variables directly; Tailwind classes reference them
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        accent: 'var(--color-accent)',
        'accent-muted': 'var(--color-accent-muted)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      // CSS cubic-bezier counterparts for GSAP easing presets
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
        cinematic: 'cubic-bezier(0.76, 0, 0.24, 1)',
        punch: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      // Grain overlay opacity steps
      opacity: {
        '2': '0.02',
        '3': '0.03',
        '4': '0.04',
        '8': '0.08',
        '15': '0.15',
      },
    },
  },
  plugins: [],
}

export default config
