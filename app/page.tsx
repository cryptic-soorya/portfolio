import { CalibrationHero }  from '@/components/calibration/CalibrationHero'
import { SignalStream }      from '@/components/signal/SignalStream'
import { ProjectWorlds }     from '@/components/projects/ProjectWorlds'
import { SkillsNetwork }     from '@/components/skills/SkillsNetwork'
import { ContactPortal }     from '@/components/contact/ContactPortal'

/**
 * Scroll canvas.
 *
 * Phase 2 — CalibrationHero   (boot sequence + scroll exit)
 * Phase 4 — SignalStream       (ambient telemetry band)
 * Phase 5 — ProjectWorlds      (4 dimensional environments, morphing transitions)
 * Phase 7 — SkillsNetwork      (interactive capability matrix)
 * Phase 8 — ContactPortal      (terminal unlock + exit portal)
 */
export default function Home() {
  return (
    <main>
      <CalibrationHero />

      {/* Phase 4 — Signal Layer */}
      <SignalStream />

      {/* Phase 5 — Project Worlds */}
      <ProjectWorlds />

      {/* Phase 7 — Skills Network */}
      <SkillsNetwork />

      {/* Phase 8 — Exit Portal */}
      <ContactPortal />
    </main>
  )
}
