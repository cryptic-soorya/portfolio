/**
 * Content schema contracts for the data layer.
 * All components consume these types — never raw SITE_CONTENT.md strings.
 */

export interface HeroData {
  eyebrow: string
  nameLines: [string, string]
  tagline: string
  cta: { label: string; target: string }
}

export interface AboutData {
  pullQuote: string
  bio: string[]
  terminalCommands: string[]
}

export interface ProjectLink {
  label: string
  url: string | null
}

export interface Project {
  id: string
  index: string
  name: string
  tagline: string
  year: string
  status: 'live' | 'In Progress' | 'beta'
  description: string
  tags: string[]
  accentColor: string
  accentColorDim: string
  link: ProjectLink
  secondLink: ProjectLink | null
  image: string
}

export interface SkillCategory {
  category: string
  items: string[]
}

export interface ContactData {
  heading: { base: string; italic: string }
  subtext: string
  email: string
  links: { label: string; url: string }[]
}

export interface SiteData {
  hero: HeroData
  about: AboutData
  marquee: string
  contact: ContactData
  footer: { left: string; right: string }
}
