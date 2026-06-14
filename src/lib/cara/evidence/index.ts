// ══════════════════════════════════════════════════════════════════════════════
// Cara — EVIDENCE MODULE (barrel export)
// ══════════════════════════════════════════════════════════════════════════════

export {
  retrieveEvidence,
  retrieveChildProfile,
  groupEvidenceByType,
  summariseEvidence,
} from "./evidence-retrieval";

export { CaraEvidenceEngine, caraEvidenceEngine, EVIDENCE_SOURCE_TYPES } from "./evidence-engine";
export type { EvidenceSourceType } from "./evidence-engine";
