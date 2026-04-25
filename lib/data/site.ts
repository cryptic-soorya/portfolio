/**
 * Global site data — parsed from SITE_CONTENT.md.
 * Hero identity, about section, marquee, contact.
 *
 * Components must transform this data into animated experiences.
 * Never render these strings plainly.
 */
import type { SiteData } from './types'

export const SITE: SiteData = {
  hero: {
    eyebrow: '— Engineer & Builder',
    nameLines: ['Soorya', 'Sijin.'],
    tagline: 'I build the tools I wish existed. Local-first, privacy-always, shipped from scratch.',
    cta: { label: 'See my work ↓', target: '#projects' },
  },

  about: {
    pullQuote: 'I build the tools I wish existed.',
    bio: [
      'Final year engineering student who builds tools I actually want to use. If existing solutions are locked behind paywalls or simply don\'t exist — I build them.',
      'Philosophy: local-first, privacy-always. Your data lives on your machine, not on someone else\'s server. JARVIS never phones home. vocterm never uploads a command.',
      'When I\'m not in the terminal, I\'m thinking about what to build next.',
    ],
    terminalCommands: [
      '$ sudo caffeinate brain',
      '$ git commit -m "built what didn\'t exist"',
      '$ if (problem) { build(); }',
      '$ privacy --mode=local --data=mine',
      '$ rm -rf vendor-lock-in',
      '$ while (curious) { ship(); }',
    ],
  },

  marquee: 'vocterm · JARVIS · Morpheus.AI · Mika · Local-first · Privacy-always · Open source · Apple Silicon',

  contact: {
    heading: { base: "Let's build ", italic: 'something.' },
    subtext: 'Open to internships, collabs, and interesting problems.',
    email: 'sijinsoorya@gmail.com',
    links: [
      { label: 'Email', url: 'mailto:sijinsoorya@gmail.com' },
      { label: 'LinkedIn', url: 'https://linkedin.com/in/sooryasijin' },
      { label: 'GitHub', url: 'https://github.com/sooryasijin' },
    ],
  },

  footer: {
    left: 'Designed & built by Soorya Sijin, 2025',
    right: 'sooryasijin.vercel.app',
  },
}
