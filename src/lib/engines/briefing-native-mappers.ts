// ─────────────────────────────────────────────────────────────────────────────
// Briefing native mappers
//
// The newer CARA intelligence engines (relationship / outcome / inspection) have
// richer, differently-shaped payloads than the home-* fleet, so the Manager
// Priority Briefing maps them to its EngineSignalInput shape natively rather than
// via the generic extractor.
//
// These are PURE functions (engine `data` → signal) so the mapping — especially
// the severity / Ofsted-rating vocab the briefing depends on — is unit-testable
// without standing up the HTTP fan-out. Each returns null when there's no data.
// ─────────────────────────────────────────────────────────────────────────────

import type { EngineSignalInput } from "./manager-priority-briefing-engine";

// These four take another route's JSON over HTTP, so the input genuinely is
// unknown at compile time — but each mapper reads a known handful of fields,
// and naming them keeps those reads checked instead of turning checking off.
// The single cast in each sits immediately after the runtime object check.

interface LabelledItem {
  label?: string;
  detail?: string;
}

interface ChildOutcomeRow {
  childName?: string;
  overallStatus?: string;
  relStatus?: string;
  esStatus?: string;
  topConcern?: string;
  topGap?: string;
}

interface BriefingSource {
  headline?: unknown;
  areasLimited?: number;
  areasDeveloping?: number;
  childrenNeedingFocus?: number;
  priorities?: LabelledItem[];
  inspectionRisks?: LabelledItem[];
  children?: ChildOutcomeRow[];
}


/** Inspection Intelligence (SCCIF evidence gaps, whole home) → one manager signal. */
export function mapInspectionToSignal(raw: unknown): EngineSignalInput | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as BriefingSource;
  return {
    engine_key: "inspection-intelligence",
    label: "Inspection readiness (SCCIF)",
    domain: "leadership",
    rating:
      (data.areasLimited ?? 0) > 0 ? "inadequate"
      : (data.areasDeveloping ?? 0) > 0 ? "requires_improvement"
      : "good",
    score: null,
    headline: typeof data.headline === "string" ? data.headline : null,
    insights: (data.priorities ?? []).map((p) => ({
      text: `${p.label}${p.detail ? ` — ${p.detail}` : ""}`,
      severity: "high",
    })),
    concerns: [],
    recommendations: [],
  };
}

/** Outcome Intelligence (whole-home rollup) → one manager signal. */
export function mapOutcomeHomeToSignal(raw: unknown): EngineSignalInput | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as BriefingSource;
  const needs = (data.children ?? []).filter((c) => c.overallStatus === "needs_focus");
  return {
    engine_key: "outcome-intelligence-home",
    label: "Outcome intelligence (whole home)",
    domain: "experiences",
    rating: (data.childrenNeedingFocus ?? 0) > 0 ? "requires_improvement" : "good",
    score: null,
    headline: typeof data.headline === "string" ? data.headline : null,
    insights: needs.map((c) => ({
      text: `${c.childName}'s outcomes need focus${c.topConcern ? ` — ${c.topConcern}` : ""}`,
      severity: "high",
    })),
    concerns: [],
    recommendations: [],
  };
}

/** Relationship Intelligence (whole-home overview) → one manager signal. */
export function mapRelationshipHomeToSignal(raw: unknown): EngineSignalInput | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as BriefingSource;
  const needs = (data.children ?? []).filter((c) => c.relStatus === "fragile" || c.esStatus === "concern");
  return {
    engine_key: "relationship-intelligence-home",
    label: "Relationship intelligence (whole home)",
    domain: "experiences",
    rating: needs.length > 0 ? "requires_improvement" : "good",
    score: null,
    headline: typeof data.headline === "string" ? data.headline : null,
    insights: needs.map((c) => ({
      text: `${c.childName} needs relational or emotional support${c.topGap ? ` — ${c.topGap}` : ""}`,
      severity: c.relStatus === "fragile" ? "high" : "warning",
    })),
    concerns: [],
    recommendations: [],
  };
}

/** SOP Reality Check (can the home prove it lives its Statement of Purpose?) → one manager signal. */
export function mapSopRealityCheckToSignal(raw: unknown): EngineSignalInput | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as BriefingSource;
  const risks = Array.isArray(data.inspectionRisks) ? data.inspectionRisks : [];
  return {
    engine_key: "sop-reality-check",
    label: "Statement of Purpose reality check",
    domain: "leadership",
    rating:
      (data.areasLimited ?? 0) > 0 ? "inadequate"
      : (data.areasDeveloping ?? 0) > 0 ? "requires_improvement"
      : "good",
    score: null,
    headline: typeof data.headline === "string" ? data.headline : null,
    insights: risks.map((r) => ({
      text: `SoP — ${r.label}${r.detail ? `: ${r.detail}` : ""}`,
      severity: "high",
    })),
    concerns: [],
    recommendations: [],
  };
}
