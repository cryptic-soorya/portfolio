/**
 * Project data — parsed from SITE_CONTENT.md.
 *
 * Each project is a world, not a card.
 * accentColor drives the entire environment color when that project is active.
 * GSAP will animate --color-accent to this value on scroll entry.
 *
 * accentColorDim is used for ambient glow and background fields.
 */
import type { Project } from './types'

export const PROJECTS: Project[] = [
  {
    id: 'vocterm',
    index: '01',
    name: 'vocterm',
    tagline: 'Plain English → Terminal commands',
    year: '2025',
    status: 'In Progress',
    description:
      'Voice-controlled terminal assistant for macOS. Speak plain English, get the right shell command — previewed with a risk score before it ever runs. Conversation-aware: \'do that but for Downloads\' just works. Built on faster-whisper + Ollama (Mistral/Llama3), Gemini 1.5 Flash as free fallback. All on-device, zero telemetry.',
    tags: ['Python', 'faster-whisper', 'Ollama', 'Mistral', 'Gemini API', 'macOS', 'rumps'],
    accentColor: '#4ade80',
    accentColorDim: 'rgba(74, 222, 128, 0.08)',
    link: { label: 'GitHub', url: null },
    secondLink: null,
    image: '/assets/projects/vocterm.jpg',
  },
  {
    id: 'jarvis',
    index: '02',
    name: 'JARVIS',
    tagline: 'Local AI desktop assistant, M4 optimised',
    year: '2025',
    status: 'In Progress',
    description:
      'A fully local AI desktop assistant built for macOS and Apple Silicon. A glowing floating orb with cursor-tracking eyes and a frosted glass transcript bubble. Uses Apple\'s MLX framework — zero cloud, zero leakage. State-reactive: Pink = Idle, Green = Listening, Blue = Thinking. Core loop: Click → Record → Transcribe (Whisper) → Infer (local LLM) → Speak (TTS). Thread-safe, 60fps UI.',
    tags: ['Python', 'PyObjC', 'MLX', 'Apple Silicon', 'Whisper', 'macOS', 'Objective-C'],
    accentColor: '#60a5fa',
    accentColorDim: 'rgba(96, 165, 250, 0.08)',
    link: { label: 'GitHub', url: null },
    secondLink: null,
    image: '/assets/projects/jarvis.jpg',
  },
  {
    id: 'morpheus',
    index: '03',
    name: 'Morpheus.AI',
    tagline: 'Deepfake detection with explainable AI heatmaps',
    year: '2025',
    status: 'In Progress',
    description:
      'Doesn\'t just say \'fake\' — shows exactly why. Grad-CAM generates thermal heatmaps over the manipulated pixels. OpenCV extracts frame-by-frame timelines to catch temporal glitches. Forensic vector breakdown scores Lip-Sync Failure, Edge Blending, Lighting Inconsistency, and Micro-expression fluidity. Premium React dashboard with Radar charts, timeline sliders, and split-screen raw-vs-heatmap viewer.',
    tags: ['TensorFlow', 'Keras', 'Grad-CAM', 'OpenCV', 'React', 'Flask', 'MTCNN', 'Framer Motion'],
    accentColor: '#f97316',
    accentColorDim: 'rgba(249, 115, 22, 0.08)',
    link: { label: 'GitHub', url: null },
    secondLink: null,
    image: '/assets/projects/morpheus.jpg',
  },
  {
    id: 'mika',
    index: '04',
    name: 'Mika',
    tagline: 'AI study companion for NEET aspirants',
    year: '2024',
    status: 'live',
    description:
      'Dual-persona AI: strict NEET tutor or empathetic companion depending on what you need. Voice mode (mic input + neural TTS), PDF context memory for entire session, quiz generation from current chat, one-click mistake log. Multiple API keys rotate automatically on rate limits. Built entirely on free tiers — not a rupee spent.',
    tags: ['React', 'Firebase', 'Firestore', 'Gemini AI', 'Web Speech API', 'TTS'],
    accentColor: '#a78bfa',
    accentColorDim: 'rgba(167, 139, 250, 0.08)',
    link: { label: 'Live Site', url: 'https://mikav2.vercel.app/landing' },
    secondLink: { label: 'GitHub', url: null },
    image: '/assets/projects/mika.jpg',
  },
]

/** Look up a project by id — used in detail views and URL routing */
export function getProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id)
}
