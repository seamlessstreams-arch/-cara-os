// ══════════════════════════════════════════════════════════════════════════════
// CARA INTELLIGENCE — PACE practice engine · public API
//
// PACE (Playfulness, Acceptance, Curiosity, Empathy — Dr Dan Hughes / DDP) as a
// deterministic practice engine: recognise PACE in records, score quality, guide
// practice, and assist recording — all advise-only, never replacing professional
// judgement or safeguarding. (Supervision, training, reflection and child-profile
// modules are added in subsequent phases.)
// ══════════════════════════════════════════════════════════════════════════════

export * from "./pace.types";
export {
  PACE_DISCLAIMER, PACE_SCRIPTS, PACE_ELEMENT_LABELS, PACE_PROMPTS,
} from "./pace.constants";
export { analyzePACE } from "./paceAnalyzer";
export { scorePACE, type PACEScoreSignals } from "./paceQualityAssurance";
export { getPACEGuidance } from "./paceGuidanceEngine";
export { assistRecording } from "./paceRecordingAssistant";
export { buildPACESupervisionInsight } from "./paceSupervisionEngine";
export { buildPACEReflection, type PACEReflection } from "./paceReflectionEngine";
export {
  PACE_TRAINING_MODULES, getPACETrainingModules, getPACETrainingForContext, getPACETrainingModule,
} from "./paceTrainingEngine";
