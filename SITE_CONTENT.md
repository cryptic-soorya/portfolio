# SITE_CONTENT.md — All Copy & Content
# Project: "Magnetic Smoke" Portfolio — Soorya Sijin
# This is the single source of truth for ALL text, links, and project data.
# Design and animation details live in DESIGN.md — not here.
# When building components, import data from src/data/projects.js (generated from this file).

---

## Owner
- **Name:** Soorya Sijin
- **Role:** Final Year Engineering Student
- **Location:** India
- **Machine:** M4 MacBook Pro, 16GB RAM

---

## Hero Section

| Field        | Value                                                                            |
|--------------|----------------------------------------------------------------------------------|
| Eyebrow      | `— Engineer & Builder`                                                           |
| Name Line 1  | `Soorya`                                                                         |
| Name Line 2  | `Sijin.` (italic)                                                                |
| Tagline      | `I build the tools I wish existed. Local-first, privacy-always, shipped from scratch.` |
| CTA text     | `See my work ↓`                                                                  |
| CTA target   | `#projects` (smooth scroll)                                                      |
| Photo path   | `src/assets/profile.jpg`                                                         |
| Photo alt    | `Soorya Sijin, 2025`                                                             |

> ⚠️ Replace `src/assets/profile.jpg` with a real photo before deployment. Min 600×600px, square or portrait crop.

---

## Marquee Strip
Scrolls between Hero and About. Repeat twice for seamless CSS loop.

```
vocterm · JARVIS · Morpheus.AI · Mika · Local-first · Privacy-always · Open source · Apple Silicon
```

---

## About Section

**Pull quote:**
> "I build the tools I wish existed."

**Bio — paragraph 1:**
Final year engineering student who builds tools I actually want to use. If existing solutions are locked behind paywalls or simply don't exist — I build them.

**Bio — paragraph 2:**
Philosophy: local-first, privacy-always. Your data lives on your machine, not on someone else's server. JARVIS never phones home. vocterm never uploads a command.

**Bio — paragraph 3:**
When I'm not in the terminal, I'm thinking about what to build next.

**Terminal commands** (cycle every 3s, crossfade, loop infinitely):
```
$ sudo caffeinate brain
$ git commit -m "built what didn't exist"
$ if (problem) { build(); }
$ privacy --mode=local --data=mine
$ rm -rf vendor-lock-in
$ while (curious) { ship(); }
```

---

## Projects
Displayed in this order. Source of truth for `src/data/projects.js`.

### Project 01 — vocterm
```js
{
  index: "01",
  name: "vocterm",
  tagline: "Plain English → Terminal commands",
  year: "2025",
  status: "In Progress",
  description: "Voice-controlled terminal assistant for macOS. Speak plain English, get the right shell command — previewed with a risk score before it ever runs. Conversation-aware: 'do that but for Downloads' just works. Built on faster-whisper + Ollama (Mistral/Llama3), Gemini 1.5 Flash as free fallback. All on-device, zero telemetry.",
  tags: ["Python", "faster-whisper", "Ollama", "Mistral", "Gemini API", "macOS", "rumps"],
  accentColor: "#4ade80",   // terminal green
  link: { label: "GitHub", url: null },   // ⚠️ Add GitHub URL before launch
  secondLink: null,
  image: "src/assets/projects/vocterm.jpg"  // ⚠️ Add project screenshot
}
```

### Project 02 — JARVIS
```js
{
  index: "02",
  name: "JARVIS",
  tagline: "Local AI desktop assistant, M4 optimised",
  year: "2025",
  status: "In Progress",
  description: "A fully local AI desktop assistant built for macOS and Apple Silicon. A glowing floating orb with cursor-tracking eyes and a frosted glass transcript bubble. Uses Apple's MLX framework — zero cloud, zero leakage. State-reactive: Pink = Idle, Green = Listening, Blue = Thinking. Core loop: Click → Record → Transcribe (Whisper) → Infer (local LLM) → Speak (TTS). Thread-safe, 60fps UI.",
  tags: ["Python", "PyObjC", "MLX", "Apple Silicon", "Whisper", "macOS", "Objective-C"],
  accentColor: "#60a5fa",   // electric blue
  link: { label: "GitHub", url: null },   // ⚠️ Add GitHub URL before launch
  secondLink: null,
  image: "src/assets/projects/jarvis.jpg"  // ⚠️ Add project screenshot
}
```

### Project 03 — Morpheus.AI
```js
{
  index: "03",
  name: "Morpheus.AI",
  tagline: "Deepfake detection with explainable AI heatmaps",
  year: "2025",
  status: "In Progress",
  description: "Doesn't just say 'fake' — shows exactly why. Grad-CAM generates thermal heatmaps over the manipulated pixels. OpenCV extracts frame-by-frame timelines to catch temporal glitches. Forensic vector breakdown scores Lip-Sync Failure, Edge Blending, Lighting Inconsistency, and Micro-expression fluidity. Premium React dashboard with Radar charts, timeline sliders, and split-screen raw-vs-heatmap viewer.",
  tags: ["TensorFlow", "Keras", "Grad-CAM", "OpenCV", "React", "Flask", "MTCNN", "Framer Motion"],
  accentColor: "#f97316",   // deep orange
  link: { label: "GitHub", url: null },   // ⚠️ Add GitHub URL before launch
  secondLink: null,
  image: "src/assets/projects/morpheus.jpg"  // ⚠️ Add project screenshot
}
```

### Project 04 — Mika
```js
{
  index: "04",
  name: "Mika",
  tagline: "AI study companion for NEET aspirants",
  year: "2024",
  status: "Live",
  description: "Dual-persona AI: strict NEET tutor or empathetic companion depending on what you need. Voice mode (mic input + neural TTS), PDF context memory for entire session, quiz generation from current chat, one-click mistake log. Multiple API keys rotate automatically on rate limits. Built entirely on free tiers — not a rupee spent.",
  tags: ["React", "Firebase", "Firestore", "Gemini AI", "Web Speech API", "TTS"],
  accentColor: "#a78bfa",   // soft violet
  link: { label: "Live Site", url: "https://mikav2.vercel.app/landing" },
  secondLink: { label: "GitHub", url: null },  // ⚠️ Add GitHub URL before launch
  image: "src/assets/projects/mika.jpg"  // ⚠️ Add project screenshot
}
```

---

## Skills

| Category       | Items                                                              |
|----------------|--------------------------------------------------------------------|
| AI / ML        | faster-whisper · Ollama · TensorFlow · Gemini API · MLX · Grad-CAM |
| Frontend       | React · Vite · Tailwind CSS · Framer Motion                        |
| Backend        | Python · Flask · FastAPI · Firebase                                |
| Native / macOS | PyObjC · OpenCV · Apple Silicon · MTCNN                            |
| Tools          | Git · Vercel · Whisper · Grad-CAM                                  |

---

## Contact Section

| Field    | Value                                             |
|----------|---------------------------------------------------|
| Heading  | `Let's build something.` (italic on "something.") |
| Subtext  | `Open to internships, collabs, and interesting problems.` |
| Email    | `your@email.com` ⚠️ REPLACE BEFORE LAUNCH        |
| LinkedIn | `https://linkedin.com/in/yourprofile` ⚠️ REPLACE  |
| GitHub   | `https://github.com/yourusername` ⚠️ REPLACE      |

---

## Footer

| Position | Value                                   |
|----------|-----------------------------------------|
| Left     | `Designed & built by Soorya Sijin, 2025` |
| Right    | `sooryasijin.vercel.app` (update if custom domain) |

---

## Pre-Launch Checklist (Content)
- [ ] Replace `src/assets/profile.jpg` with real photo
- [ ] Add `src/assets/projects/vocterm.jpg` screenshot
- [ ] Add `src/assets/projects/jarvis.jpg` screenshot
- [ ] Add `src/assets/projects/morpheus.jpg` screenshot
- [ ] Add `src/assets/projects/mika.jpg` screenshot
- [ ] Replace GitHub URLs in all four projects
- [ ] Replace `your@email.com` with real email
- [ ] Replace LinkedIn URL
- [ ] Replace GitHub profile URL
- [ ] Update footer domain if using custom domain
