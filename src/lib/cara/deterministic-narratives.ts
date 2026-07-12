// ══════════════════════════════════════════════════════════════════════════════
// CARA — DETERMINISTIC NARRATIVE RENDERERS
//
// The chronology and inspection "Generate with Cara" buttons stream from
// /api/v1/cara (modes chronology_summary / inspection_narrative). Those modes had
// no deterministic engine wired, so with the AI provider unavailable (e.g.
// exhausted credits) they emitted only a generic "ran without AI" note.
//
// These pure renderers turn the EXISTING deterministic engine projections
// (computeChronologyIntelligence / buildInspectionReadiness) into a readable
// narrative, so both features produce real content with no AI. They add no facts
// beyond what the engines computed from the home's records, and — per the
// inspection engine's own contract — NEVER predict an Ofsted grade.
// ══════════════════════════════════════════════════════════════════════════════

import type { ChronologyIntelligenceResult } from "@/lib/engines/chronology-intelligence-engine";
import type { InspectionReadiness } from "@/lib/inspection-intelligence/inspection-intelligence-engine";

export interface ChronologyNarrativeOpts {
  /** Focus on a single child when known (the chronology page selects one). */
  childId?: string;
  /** The requested window, for framing only (the engine reports 30/90-day counts). */
  periodDays?: number;
  childCount: number;
  eventCount: number;
}

/** Render a chronology-intelligence projection as a professional summary. */
export function renderChronologyNarrative(
  result: ChronologyIntelligenceResult,
  opts: ChronologyNarrativeOpts,
): string {
  const lines: string[] = [];
  lines.push("# Chronology summary (deterministic)");
  lines.push(
    `_Computed from ${opts.eventCount} recorded chronology event${opts.eventCount === 1 ? "" : "s"} across ${opts.childCount} ${opts.childCount === 1 ? "child" : "children"} — no AI. Review for completeness before use._`,
  );
  lines.push("");

  const profile = opts.childId
    ? result.child_profiles.find((p) => p.child_id === opts.childId)
    : undefined;

  if (profile) {
    lines.push(`## ${profile.child_name}`);
    lines.push(`- Events recorded: ${profile.total_events} (last 30 days: ${profile.events_30d})`);
    lines.push(`- Critical: ${profile.critical_count} · Significant: ${profile.significant_count}`);
    lines.push(
      `- Categories covered: ${profile.categories_covered.length ? profile.categories_covered.join(", ") : "none recorded yet"}`,
    );
    lines.push(
      `- Days since last entry: ${profile.days_since_last_entry}${profile.has_gap ? " — ⚠️ recording gap (>14 days)" : ""}`,
    );
    lines.push(
      `- Recording rate: ${profile.recording_rate} events / 30 days over ${profile.placement_duration_days} days in placement`,
    );
  } else {
    const o = result.overview;
    lines.push("## Home overview");
    lines.push(`- Total events: ${o.total_events} · last 30 days: ${o.events_30d} · last 90 days: ${o.events_90d}`);
    lines.push(`- Critical: ${o.critical_events_total} · Significant: ${o.significant_events_total}`);
    lines.push(
      `- Children with a chronology: ${o.children_with_chronology}/${opts.childCount} · category coverage: ${o.category_coverage}`,
    );
    if (result.child_profiles.length) {
      lines.push("");
      lines.push("## Per child");
      for (const p of result.child_profiles) {
        lines.push(
          `- **${p.child_name}** — ${p.total_events} events, ${p.critical_count} critical, last entry ${p.days_since_last_entry} day${p.days_since_last_entry === 1 ? "" : "s"} ago${p.has_gap ? " — ⚠️ gap" : ""}`,
        );
      }
    }
  }

  const alerts = (result.alerts ?? []).filter((a) => a.severity === "critical" || a.severity === "high");
  if (alerts.length) {
    lines.push("");
    lines.push("## Recording alerts");
    for (const a of alerts.slice(0, 8)) lines.push(`- (${a.severity}) ${a.message}`);
  }

  return lines.join("\n");
}

/** Render an inspection-readiness projection as an evidence-and-gaps narrative.
 *  Never states or implies an Ofsted grade — mirrors the engine's contract. */
export function renderInspectionNarrative(readiness: InspectionReadiness): string {
  const lines: string[] = [];
  lines.push("# Inspection readiness narrative (deterministic)");
  lines.push(`_${readiness.headline}_`);
  lines.push(
    "_Maps your records to the SCCIF judgement areas as evidence you can show and gaps an inspector may probe — computed with no AI. Cara never predicts an Ofsted grade._",
  );
  lines.push("");

  for (const area of readiness.areas) {
    lines.push(`## ${area.label} — evidence strength: ${area.strength}`);
    if (area.summary) lines.push(area.summary);
    if (area.evidence.length) {
      lines.push("");
      lines.push(`**Evidence you can show (${area.evidence.length}):**`);
      for (const e of area.evidence.slice(0, 6)) lines.push(`- ${e.label} — ${e.detail} (${e.count})`);
    }
    if (area.gaps.length) {
      lines.push("");
      lines.push(`**Gaps an inspector may probe (${area.gaps.length}):**`);
      for (const g of area.gaps.slice(0, 6)) lines.push(`- (${g.severity}) ${g.label} — ${g.detail}`);
    }
    lines.push("");
  }

  if (readiness.priorities.length) {
    lines.push("## Priorities to close");
    for (const p of readiness.priorities.slice(0, 8)) lines.push(`- **${p.label}** — ${p.detail}`);
  }

  return lines.join("\n").trimEnd();
}
