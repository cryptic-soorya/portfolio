/**
 * Skills data — parsed from SITE_CONTENT.md.
 *
 * Phase 7 renders these as an interactive force-directed node graph.
 * nodeId is stable — used as React key and for edge definitions.
 */
import type { SkillCategory } from './types'

export const SKILLS: SkillCategory[] = [
  {
    category: 'AI / ML',
    items: ['faster-whisper', 'Ollama', 'TensorFlow', 'Gemini API', 'MLX', 'Grad-CAM'],
  },
  {
    category: 'Frontend',
    items: ['React', 'Vite', 'Tailwind CSS', 'Framer Motion'],
  },
  {
    category: 'Backend',
    items: ['Python', 'Flask', 'FastAPI', 'Firebase'],
  },
  {
    category: 'Native / macOS',
    items: ['PyObjC', 'OpenCV', 'Apple Silicon', 'MTCNN'],
  },
  {
    category: 'Tools',
    items: ['Git', 'Vercel', 'Whisper'],
  },
]

/**
 * Per-skill descriptors shown in the hover tooltip.
 * Key = exact label string from SKILLS.items.
 */
export const SKILL_NOTES: Record<string, string> = {
  'faster-whisper': 'On-device speech recognition',
  'Ollama': 'Local LLM inference engine',
  'TensorFlow': 'Deep learning framework',
  'Gemini API': 'Google multimodal AI',
  'MLX': 'Apple Silicon ML framework',
  'Grad-CAM': 'CNN visual explainability',
  'React': 'Component-driven UI',
  'Vite': 'Next-gen build tooling',
  'Tailwind CSS': 'Utility-first styling',
  'Framer Motion': 'React animation library',
  'Python': 'Primary language',
  'Flask': 'Lightweight web framework',
  'FastAPI': 'Async REST APIs',
  'Firebase': 'Realtime backend + auth',
  'PyObjC': 'Python ↔ macOS bridge',
  'OpenCV': 'Computer vision library',
  'Apple Silicon': 'M-series chip optimization',
  'MTCNN': 'Multi-task face detection',
  'Git': 'Distributed version control',
  'Vercel': 'Edge deployment platform',
  'Whisper': 'OpenAI speech model',
}

/**
 * Category accent colors — used for node/edge coloring in the graph.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  'AI / ML':        '#7cffcb',
  'Frontend':       '#60a5fa',
  'Backend':        '#f97316',
  'Native / macOS': '#4ade80',
  'Tools':          '#a78bfa',
}

/**
 * Cross-domain connections for the graph.
 * Pairs of [skill label A, skill label B] that share conceptual ground
 * across different categories. Rendered as dashed white edges.
 */
export const CROSS_CONNECTIONS: [string, string][] = [
  ['faster-whisper', 'Whisper'],    // both Whisper-based speech models
  ['MLX', 'Apple Silicon'],         // Apple Silicon native optimization
  ['Python', 'PyObjC'],             // Python powers the macOS bridge
  ['TensorFlow', 'Grad-CAM'],       // Grad-CAM is a TensorFlow technique
  ['Ollama', 'Python'],             // Ollama driven via Python client
]

/**
 * Flat list of all skill items with a stable id and their parent category.
 * Used as leaf nodes in the force-graph.
 */
export const SKILL_NODES = SKILLS.flatMap((cat) =>
  cat.items.map((item) => ({
    id: `${cat.category.toLowerCase().replace(/\s+\/\s+|\s+/g, '-')}-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    label: item,
    category: cat.category,
    note: SKILL_NOTES[item] ?? '',
    color: CATEGORY_COLORS[cat.category] ?? '#ffffff',
  }))
)

export type SkillNode = (typeof SKILL_NODES)[number]
