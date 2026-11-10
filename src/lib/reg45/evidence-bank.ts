// ─────────────────────────────────────────────────────────────────────────────
// CARA — REG 45 EVIDENCE BANK (deterministic)
//
// The Regulation 45 page shows an "evidence bank": the categories of record the
// home has captured in the period, each with a count and a few real examples.
// It fed from /api/intelligence/reg45-evidence, which read a `reg45_evidence`
// table that was never created on the live tenant — so on live the panel and
// the "Request Cara Draft" buttons (which assemble from the same evidence) saw
// nothing, and the page showed a storage error.
//
// The home's recorded evidence already lives on the care-event spine, which is
// persisted on live. This counts those events into evidence categories. It is
// pure assembly over real records:
//   • a category appears only if at least one event carries it — never a fixed
//     list padded with zeros, which would be a claim the home has those record
//     types when it may not;
//   • every count is a count of real events, and every example is a real event
//     title. Nothing is invented. An empty spine yields an empty bank, which is
//     itself the Reg 45 finding.
//
// It is deliberately the spine only. Other verified live sources (child voice,
// Reg 44 reports, supervision) can be folded in the same way once each is read
// through a live-safe path; this keeps the first version wholly truthful.
// ─────────────────────────────────────────────────────────────────────────────

import type { CareEvent } from "@/types/care-events";
import type { EvidenceCategoryCount } from "./section-draft";

// Readable names for the evidence categories. Covers both the care-event
// category enum and the category tokens the live seed uses (key_work,
// daily_log, positive_moment), which are carried through verbatim from the row.
const CATEGORY_LABELS: Record<string, string> = {
  daily_log: "Daily Logs",
  key_work: "Key-Work Sessions",
  key_work_session: "Key-Work Sessions",
  keywork: "Key-Work Sessions",
  safeguarding: "Safeguarding Records",
  health: "Health Records",
  medication: "Medication Records",
  education: "Education Records",
  behaviour: "Behaviour Records",
  physical_intervention: "Physical Intervention Records",
  restraint: "Restraint Records",
  missing_episode: "Missing Episodes",
  family_contact: "Family Contact Records",
  professional_contact: "Professional Contact Records",
  complaint: "Complaints",
  activity: "Activity Records",
  wellbeing: "Wellbeing Records",
  positive_moment: "Positive Moments",
  sleep: "Sleep Records",
  food: "Mealtime Records",
  finance: "Finance Records",
  general: "General Records",
  other: "Other Records",
};

/** A readable evidence-bank label for a stored category token. Unknown tokens
 *  (future categories, or anything the seed introduces) become Title Case so
 *  they still read correctly rather than being dropped or mislabelled. */
export function evidenceCategoryLabel(category: string): string {
  const key = (category ?? "").trim().toLowerCase();
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  const titled = key
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  return titled || "Uncategorised";
}

export interface Reg45EvidenceBankOptions {
  /** Most example titles to show per category. Default 3. */
  maxExamples?: number;
}

/**
 * Count care events into Reg 45 evidence categories. The caller supplies the
 * events already scoped to the home (and, if it wants a period, to the period);
 * this function only groups and counts what it is given.
 */
export function buildReg45EvidenceBank(
  events: CareEvent[],
  options: Reg45EvidenceBankOptions = {},
): EvidenceCategoryCount[] {
  const maxExamples = options.maxExamples ?? 3;
  const groups = new Map<string, { count: number; examples: string[] }>();

  // Newest first, so the examples shown are the most recent records.
  const ordered = [...events].sort((a, b) =>
    String(b.event_date ?? "").localeCompare(String(a.event_date ?? "")),
  );

  for (const event of ordered) {
    const label = evidenceCategoryLabel(event.category ?? "other");
    const group = groups.get(label) ?? { count: 0, examples: [] };
    group.count += 1;
    const title = typeof event.title === "string" ? event.title.trim() : "";
    if (title && group.examples.length < maxExamples && !group.examples.includes(title)) {
      group.examples.push(title);
    }
    groups.set(label, group);
  }

  return [...groups.entries()]
    .map(([category, group]) => ({ category, count: group.count, examples: group.examples }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}
