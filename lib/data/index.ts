/**
 * Data layer barrel export.
 * All components import from '@/lib/data' — never from individual files.
 */
export { SITE } from './site'
export { PROJECTS, getProject } from './projects'
export { SKILLS, SKILL_NODES } from './skills'
export type {
  SiteData,
  HeroData,
  AboutData,
  Project,
  ProjectLink,
  SkillCategory,
  ContactData,
} from './types'
// SkillNode is derived in skills.ts — import directly from there if needed
export type { SkillNode } from './skills'
