// ══════════════════════════════════════════════════════════════════════════════
// CARA — POST-INCIDENT REFLECTION ASSEMBLY (pure, deterministic)
//
// Replaces the blank reflection with a PRE-POPULATED one, assembled from the
// incident's surrounding records: previous related incidents, time-of-day and
// location patterns, the linked restraint + debrief, behaviour context around
// the date, any escalation decision, medication context, and the child's own
// quoted words.
//
// Everything is a SUGGESTION drawn from cited records — staff confirm or edit;
// nothing overwrites what a human has already written, and where the records
// cannot carry an answer the assembly says so ("insufficient data") rather than
// inventing one. No model calls, no store access.
// ══════════════════════════════════════════════════════════════════════════════

import type { PostIncidentReflection } from "./types";

export const REFLECTION_ASSEMBLY_VERSION = "1.0.0";

// ── Input snapshots (the route reads the store; the engine stays pure) ────────

export interface ReflectionAssemblyInput {
  incident: {
    id: string;
    date: string;
    time?: string;
    type: string;
    severity: string;
    location?: string;
    description?: string;
    immediateAction?: string;
    childId: string;
  };
  /** Prior incidents for the same child (any window the caller chose). */
  previousIncidents: Array<{ id: string; date: string; time?: string; type: string; severity: string; location?: string; description?: string }>;
  /** Behaviour entries for the child around the incident. */
  behaviourEntries: Array<{ id: string; date: string; time?: string; direction: string; intensity: string; trigger: string; behaviour: string; strategy_used?: string; outcome?: string }>;
  /** The restraint linked to this incident, if any. */
  linkedRestraint?: { id: string; duration: number; restraint_type: string; child_debriefed: boolean; de_escalation_attempts: string[]; injuries: unknown[] };
  /** A debrief already recorded for this incident, if any. */
  linkedDebrief?: { id: string; child_perspective?: string; lessons_learned?: string[] };
  /** Escalation decisions raised for the child. */
  escalationDecisions: Array<{ id: string; suggestedLevel: string; confirmedLevel?: string; status: string }>;
  /** The child's own quoted words found in records around the incident. */
  childQuotes: Array<{ recordId: string; recordType: string; quote: string }>;
  /** Medication administered around the incident date, if relevant. */
  medicationContext?: Array<{ id: string; date: string; note: string }>;
}

// ── Output ────────────────────────────────────────────────────────────────────

export interface ReflectionEvidenceRef {
  recordType: string;
  recordId: string;
}

export interface ReflectionPatternInsight {
  label: string;
  detail: string;
  /** false when there is not enough data to claim a pattern. */
  sufficientData: boolean;
  sources: ReflectionEvidenceRef[];
}

export interface ReflectionAssembly {
  /** Suggested pre-fills for the reflection's derivable string fields. */
  suggestions: Partial<Pick<
    PostIncidentReflection,
    | "what_happened"
    | "location"
    | "likely_triggers"
    | "contributing_factors"
    | "staff_response"
    | "child_view"
  >>;
  /** Pattern insights surfaced for the reflection (with honest "insufficient data"). */
  patterns: ReflectionPatternInsight[];
  /** Previous related incidents, summarised. */
  previousRelated: Array<{ id: string; date: string; summary: string }>;
  /** Everything cited — the pack is traceable. */
  sources: ReflectionEvidenceRef[];
  engineVersion: string;
  disclaimer: string;
}

const DISCLAIMER =
  "Cara pre-filled this reflection from the records cited — every suggestion is drawn from an existing record, none is invented. Confirm or edit each one; where the records could not answer, the field is left open rather than guessed.";

const nonEmpty = (s?: string | null) => !!s && s.trim().length > 0;

function hourOf(time?: string): number | null {
  if (!time) return null;
  const m = /^(\d{1,2}):/.exec(time.trim());
  return m ? Number(m[1]) : null;
}

// ── The assembler ─────────────────────────────────────────────────────────────

export function assembleReflectionPack(input: ReflectionAssemblyInput): ReflectionAssembly {
  const sources: ReflectionEvidenceRef[] = [{ recordType: "incidents", recordId: input.incident.id }];
  const patterns: ReflectionPatternInsight[] = [];

  // ── Previous related incidents (same child, same type OR same location) ───
  const related = input.previousIncidents
    .filter((i) => i.id !== input.incident.id)
    .filter((i) => i.type === input.incident.type || (nonEmpty(i.location) && i.location === input.incident.location))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);
  for (const r of related) sources.push({ recordType: "incidents", recordId: r.id });
  const previousRelated = related.map((r) => ({
    id: r.id,
    date: r.date,
    summary: `${r.date} — ${r.type.replace(/_/g, " ")} (${r.severity})${r.location ? ` at ${r.location}` : ""}`,
  }));

  // ── Time-of-day pattern (this + related incidents) ────────────────────────
  const allForTiming = [input.incident, ...related];
  const eveningCount = allForTiming.filter((i) => {
    const h = hourOf(i.time);
    return h !== null && h >= 18 && h <= 23;
  }).length;
  patterns.push({
    label: "Time of day",
    detail:
      allForTiming.filter((i) => hourOf(i.time) !== null).length < 3
        ? "Insufficient data — fewer than three timed incidents to read a pattern."
        : eveningCount >= Math.ceil(allForTiming.length * 0.6)
          ? `${eveningCount} of ${allForTiming.length} incidents fall in the evening (18:00–23:00) — a possible high-risk window.`
          : "No clear time-of-day concentration across these incidents.",
    sufficientData: allForTiming.filter((i) => hourOf(i.time) !== null).length >= 3,
    sources: allForTiming.map((i) => ({ recordType: "incidents", recordId: i.id })),
  });

  // ── Location pattern ──────────────────────────────────────────────────────
  const locCounts = new Map<string, number>();
  for (const i of allForTiming) {
    if (nonEmpty(i.location)) locCounts.set(i.location!, (locCounts.get(i.location!) ?? 0) + 1);
  }
  const topLoc = [...locCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  patterns.push({
    label: "Location",
    detail:
      allForTiming.length < 3
        ? "Insufficient data to read a location pattern."
        : topLoc && topLoc[1] >= 2
          ? `${topLoc[1]} of these incidents occurred at "${topLoc[0]}".`
          : "No repeated location across these incidents.",
    sufficientData: allForTiming.length >= 3,
    sources: allForTiming.filter((i) => nonEmpty(i.location)).map((i) => ({ recordType: "incidents", recordId: i.id })),
  });

  // ── Recurring triggers (behaviour log around the incident) ────────────────
  const concerning = input.behaviourEntries.filter((b) => /concern/i.test(b.direction));
  const triggerCounts = new Map<string, { count: number; ids: string[] }>();
  for (const b of concerning) {
    const key = b.trigger.trim().toLowerCase();
    if (!key) continue;
    const cur = triggerCounts.get(key) ?? { count: 0, ids: [] };
    cur.count += 1;
    cur.ids.push(b.id);
    triggerCounts.set(key, cur);
  }
  const topTriggers = [...triggerCounts.entries()].filter(([, v]) => v.count >= 2).sort((a, b) => b[1].count - a[1].count);
  for (const [, v] of topTriggers) for (const id of v.ids) sources.push({ recordType: "behaviourLog", recordId: id });

  // ── Suggestions ───────────────────────────────────────────────────────────
  const suggestions: ReflectionAssembly["suggestions"] = {};
  if (nonEmpty(input.incident.description)) suggestions.what_happened = input.incident.description!.trim();
  if (nonEmpty(input.incident.location)) suggestions.location = input.incident.location!.trim();

  if (topTriggers.length > 0) {
    suggestions.likely_triggers = `From recent behaviour records, recurring triggers include: ${topTriggers
      .map(([t, v]) => `"${t}" (×${v.count})`)
      .join(", ")}. Confirm which applied here.`;
  }

  const contributing: string[] = [];
  if (topTriggers.some(([t]) => /family|contact|call/.test(t))) contributing.push("family contact appears in the recent pattern");
  if (input.medicationContext && input.medicationContext.length > 0) {
    contributing.push("medication was administered around this date — check timing as a factor");
    for (const m of input.medicationContext) sources.push({ recordType: "medication", recordId: m.id });
  }
  if (eveningCount >= 2) contributing.push("the timing sits in the evening cluster");
  if (contributing.length > 0) {
    suggestions.contributing_factors = `Possible contributing factors from the records: ${contributing.join("; ")}. These are prompts to consider, not conclusions.`;
  }

  if (nonEmpty(input.incident.immediateAction)) suggestions.staff_response = input.incident.immediateAction!.trim();
  if (input.linkedRestraint) {
    sources.push({ recordType: "restraints", recordId: input.linkedRestraint.id });
    const de = input.linkedRestraint.de_escalation_attempts.filter(nonEmpty);
    suggestions.staff_response = `${suggestions.staff_response ? suggestions.staff_response + " " : ""}A ${input.linkedRestraint.duration}-minute ${input.linkedRestraint.restraint_type} hold was used${de.length ? ` after de-escalation attempts (${de.join(", ")})` : ""}.`;
  }

  // ── Child voice ───────────────────────────────────────────────────────────
  if (input.childQuotes.length > 0) {
    suggestions.child_view = input.childQuotes.map((q) => `"${q.quote.trim()}"`).join(" ");
    for (const q of input.childQuotes) sources.push({ recordType: q.recordType, recordId: q.recordId });
  } else {
    patterns.push({
      label: "Child voice",
      detail: "The child's own words about this incident are not yet in the records — capture their view before, during and after as part of the reflection.",
      sufficientData: false,
      sources: [],
    });
  }

  // ── Restraint debrief gap (safeguarding-critical) ─────────────────────────
  if (input.linkedRestraint && !input.linkedRestraint.child_debriefed && !input.linkedDebrief) {
    patterns.push({
      label: "Repair gap",
      detail: "A restraint was used but no child debrief is recorded — the repair conversation is outstanding.",
      sufficientData: true,
      sources: [{ recordType: "restraints", recordId: input.linkedRestraint.id }],
    });
  }

  // ── Escalation context ────────────────────────────────────────────────────
  const decided = input.escalationDecisions.find((d) => d.status === "decided" && d.confirmedLevel);
  if (decided) {
    patterns.push({
      label: "Escalation",
      detail: `A manager confirmed the escalation level "${decided.confirmedLevel!.replace(/_/g, " ")}" for a related concern — this reflection should account for it.`,
      sufficientData: true,
      sources: [{ recordType: "escalationDecisions", recordId: decided.id }],
    });
  }

  // De-dupe sources.
  const seen = new Set<string>();
  const dedupedSources = sources.filter((s) => {
    const k = `${s.recordType}/${s.recordId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return {
    suggestions,
    patterns,
    previousRelated,
    sources: dedupedSources,
    engineVersion: REFLECTION_ASSEMBLY_VERSION,
    disclaimer: DISCLAIMER,
  };
}

/**
 * Apply suggestions to a reflection WITHOUT overwriting anything a human already
 * wrote — a field is only pre-filled when it is empty. Returns the (mutated)
 * reflection and the list of fields Cara pre-filled (for provenance).
 */
export function applyAssemblySuggestions(
  reflection: PostIncidentReflection,
  assembly: ReflectionAssembly,
): { reflection: PostIncidentReflection; prefilled: string[] } {
  const prefilled: string[] = [];
  for (const [key, value] of Object.entries(assembly.suggestions) as Array<[keyof PostIncidentReflection, string]>) {
    if (!nonEmpty(value)) continue;
    if (!nonEmpty(reflection[key] as string)) {
      (reflection as Record<string, unknown>)[key] = value;
      prefilled.push(key);
    }
  }
  return { reflection, prefilled };
}
