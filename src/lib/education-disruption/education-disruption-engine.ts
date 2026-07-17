// ─────────────────────────────────────────────────────────────────────────────
// Education Disruption Engine (Practice Intelligence OS §5.18 / doctrine 1.17)
//
// For a children's home, any school-instability signal is a CARE-PLANNING
// event, not an education footnote. This engine reads the existing education
// and PEP records and fires deterministic triggers:
//
//   • suspension / exclusion-risk  → consider an INTERIM PEP review
//     (DfE suspension & exclusion guidance, statutory from 26 July 2026);
//   • managed move that looks like a trial period or exclusion workaround
//     → scrutiny prompt (managed moves must be planned, voluntary, permanent);
//   • informal send-home           → prohibited-practice signal;
//   • reduced timetable with no review date / long-running → these must be
//     temporary, time-limited and reviewed;
//   • any disruption with no care-planning response → the placement-plan check.
//
// Statutory grounding is DATA, not prose scattered through the code: the
// STATUTORY_BASIS const names the source and its effective date, and is meant
// to be governed through the §6 knowledge-governance layer (reviewer, expiry,
// limitations) rather than trusted because it is written here.
//
// Every trigger is a prompt with evidence and the statutory basis — never an
// automatic notification, never a legal determination. "Flag managed moves
// that look like trial periods" means WORTH SCRUTINY, decided by a human.
//
// Pure and deterministic: caller supplies `now`; no store, no AI.
// ─────────────────────────────────────────────────────────────────────────────

export const STATUTORY_BASIS = {
  name: "DfE — Suspension and permanent exclusion guidance",
  effective_from: "2026-07-26",
  points: {
    interim_pep:
      "An interim PEP review should be considered whenever a looked-after child is at risk of suspension or permanent exclusion.",
    managed_moves:
      "Managed moves must be planned, voluntary and permanent — never trial periods or exclusion workarounds.",
    informal_exclusion:
      "Informal/unlawful exclusions and off-rolling are prohibited.",
  },
  governance_note:
    "Statutory content — must be governed (reviewer, review date, limitations) via the knowledge-governance layer, not trusted because it is hardcoded.",
} as const;

export interface DisruptionEducationRecord {
  id: string;
  child_id: string;
  record_type: string;
  title: string;
  date: string;
  details?: string;
  follow_up_date?: string;
  linked_pep?: boolean;
  status: string;
}

export interface DisruptionPepRecord {
  id: string;
  child_id: string;
  pep_date: string;
  next_review_date: string;
}

export interface EducationDisruptionInput {
  childId: string;
  childName: string;
  now: string;
  educationRecords: DisruptionEducationRecord[];
  pepRecords: DisruptionPepRecord[];
}

const DISRUPTION_TYPES = new Set([
  "suspension", "exclusion", "managed_move", "reduced_timetable", "informal_send_home",
]);

// Managed-move wording that reads as a trial period / workaround. Multi-word
// substrings by design (the repo's word-boundary rule is for single tokens).
const TRIAL_CUES = ["trial", "see how it goes", "temporary basis", "if it works out", "review after", "on a trial"];

export type DisruptionTriggerKey =
  | "interim_pep_due"
  | "managed_move_scrutiny"
  | "informal_exclusion_signal"
  | "reduced_timetable_unreviewed"
  | "care_planning_response_missing"
  | "stability_protected";

export interface DisruptionTrigger {
  key: DisruptionTriggerKey;
  tone: "prompt" | "positive";
  childId: string;
  headline: string;
  whyShown: string;
  statutoryBasis: string | null;
  evidenceRecordIds: string[];
  suggestedActions: string[];
}

export interface EducationDisruptionRead {
  childId: string;
  childName: string;
  disruptionEvents: DisruptionEducationRecord[];
  triggers: DisruptionTrigger[];
  /** True when there are no disruption-type records at all. */
  stable: boolean;
}

const DAY = 86_400_000;
const REDUCED_TIMETABLE_MAX_AGE_DAYS = 42; // must be temporary — 6 weeks unreviewed is the prompt line

function daysBetween(nowIso: string, iso: string): number {
  const a = Date.parse(nowIso), b = Date.parse(iso);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.floor((a - b) / DAY);
}

export function readEducationDisruption(input: EducationDisruptionInput): EducationDisruptionRead {
  const mine = input.educationRecords.filter((r) => r.child_id === input.childId);
  const events = mine
    .filter((r) => DISRUPTION_TYPES.has(r.record_type))
    .sort((a, b) => b.date.localeCompare(a.date));
  const peps = input.pepRecords.filter((p) => p.child_id === input.childId);

  if (events.length === 0) {
    return { childId: input.childId, childName: input.childName, disruptionEvents: [], triggers: [], stable: true };
  }

  const triggers: DisruptionTrigger[] = [];

  // ── Interim PEP: any suspension/exclusion(-risk) with no PEP dated after it ─
  const exclusionish = events.filter((e) => e.record_type === "suspension" || e.record_type === "exclusion");
  for (const e of exclusionish) {
    const pepAfter = peps.some((p) => p.pep_date >= e.date);
    if (!pepAfter) {
      triggers.push({
        key: "interim_pep_due",
        tone: "prompt",
        childId: input.childId,
        headline: `Consider an interim PEP review — no PEP since the ${e.record_type.replace("_", " ")} on ${e.date}`,
        whyShown:
          `"${e.title}" is recorded on ${e.date} and no PEP review is dated after it. ` +
          `For a looked-after child at risk of suspension or exclusion, an interim PEP review should be considered.`,
        statutoryBasis: `${STATUTORY_BASIS.name} (statutory from ${STATUTORY_BASIS.effective_from}): ${STATUTORY_BASIS.points.interim_pep}`,
        evidenceRecordIds: [e.id],
        suggestedActions: [
          "Contact the Virtual School about an interim PEP review.",
          "Check the placement plan reflects the change in education.",
          "Record the child's view of what happened at school.",
        ],
      });
    }
  }

  // ── Managed moves that read as trial periods / follow exclusion pressure ────
  for (const e of events.filter((x) => x.record_type === "managed_move")) {
    const details = `${e.title} ${e.details ?? ""}`.toLowerCase();
    const trialWording = TRIAL_CUES.filter((c) => details.includes(c));
    const followsExclusionPressure = exclusionish.some((x) => x.date <= e.date && daysBetween(e.date, x.date) <= 90);
    if (trialWording.length > 0 || followsExclusionPressure) {
      triggers.push({
        key: "managed_move_scrutiny",
        tone: "prompt",
        childId: input.childId,
        headline: "This managed move is worth scrutiny",
        whyShown:
          (trialWording.length > 0
            ? `The record's wording (${trialWording.map((w) => `"${w}"`).join(", ")}) reads like a trial period. `
            : "") +
          (followsExclusionPressure ? "It follows suspension/exclusion pressure within 90 days. " : "") +
          "Managed moves must be planned, voluntary and permanent — this is a prompt for the Registered Manager to check, not a legal determination.",
        statutoryBasis: `${STATUTORY_BASIS.name}: ${STATUTORY_BASIS.points.managed_moves}`,
        evidenceRecordIds: [e.id],
        suggestedActions: [
          "Ask the school to confirm in writing that the move is permanent and voluntary.",
          "If it is framed as a trial, raise it — a professional challenge may be appropriate.",
        ],
      });
    }
  }

  // ── Informal send-homes are prohibited practice ─────────────────────────────
  const informal = events.filter((e) => e.record_type === "informal_send_home");
  if (informal.length > 0) {
    triggers.push({
      key: "informal_exclusion_signal",
      tone: "prompt",
      childId: input.childId,
      headline: `${informal.length} informal send-home(s) recorded — prohibited practice signal`,
      whyShown:
        "Being sent home without a formal suspension is an informal exclusion. It is unlawful, it is invisible " +
        "in official data, and each occurrence costs the child education. This surfaces to the Registered Manager for challenge.",
      statutoryBasis: `${STATUTORY_BASIS.name}: ${STATUTORY_BASIS.points.informal_exclusion}`,
      evidenceRecordIds: informal.map((e) => e.id),
      suggestedActions: [
        "Log each occurrence with date, who requested it and the reason given.",
        "Raise with the school in writing; involve the Virtual School if it continues.",
      ],
    });
  }

  // ── Reduced timetables must be temporary and reviewed ───────────────────────
  for (const e of events.filter((x) => x.record_type === "reduced_timetable")) {
    const age = daysBetween(input.now, e.date);
    const unreviewed = !e.follow_up_date;
    if ((unreviewed || age > REDUCED_TIMETABLE_MAX_AGE_DAYS) && e.status !== "resolved") {
      triggers.push({
        key: "reduced_timetable_unreviewed",
        tone: "prompt",
        childId: input.childId,
        headline: unreviewed
          ? "Reduced timetable has no review date"
          : `Reduced timetable running ${age} days without resolution`,
        whyShown:
          "A reduced timetable is a temporary measure. " +
          (unreviewed ? "No review date is recorded, so nothing is pulling it back to full-time education. " : "") +
          (age > REDUCED_TIMETABLE_MAX_AGE_DAYS ? `It has now run ${age} days. ` : "") +
          "Every week on a partial timetable is education the child is not getting.",
        statutoryBasis: null,
        evidenceRecordIds: [e.id],
        suggestedActions: ["Set a review date with the school.", "Ask what the plan back to full-time provision is, in writing."],
      });
    }
  }

  // ── The care-planning check — the doctrine's core line ─────────────────────
  const respondedTo = (e: DisruptionEducationRecord) =>
    e.linked_pep === true || !!e.follow_up_date || e.status === "resolved";
  const unresponded = events.filter((e) => !respondedTo(e));
  if (unresponded.length > 0) {
    triggers.push({
      key: "care_planning_response_missing",
      tone: "prompt",
      childId: input.childId,
      headline: `${unresponded.length} education disruption(s) with no care-planning response`,
      whyShown:
        "School instability is a care-planning event, not an education footnote. These records show no linked PEP, " +
        "no follow-up date and no resolution — the disruption happened and the plan did not move.",
      statutoryBasis: null,
      evidenceRecordIds: unresponded.map((e) => e.id),
      suggestedActions: [
        "Review the placement plan against the current education reality.",
        "Notify the social worker and Virtual School where not already done.",
      ],
    });
  }

  // ── The positive: disruption met with a documented response ─────────────────
  const allResponded = events.length > 0 && unresponded.length === 0 && triggers.every((t) => t.key !== "interim_pep_due");
  if (allResponded) {
    triggers.push({
      key: "stability_protected",
      tone: "positive",
      childId: input.childId,
      headline: "Education disruption met with a documented care-planning response",
      whyShown: "Every disruption record here has a linked PEP, follow-up or resolution — the plan moved when school did.",
      statutoryBasis: null,
      evidenceRecordIds: events.map((e) => e.id),
      suggestedActions: [],
    });
  }

  return { childId: input.childId, childName: input.childName, disruptionEvents: events, triggers, stable: false };
}

// ── Whole-home rollup ─────────────────────────────────────────────────────────

export interface EducationDisruptionOverview {
  reads: EducationDisruptionRead[];
  counts: { childrenWithDisruption: number; openTriggers: number; positives: number };
}

export function buildEducationDisruptionOverview(reads: EducationDisruptionRead[]): EducationDisruptionOverview {
  const withDisruption = reads.filter((r) => !r.stable);
  return {
    reads: [...reads].sort((a, b) =>
      b.triggers.filter((t) => t.tone === "prompt").length - a.triggers.filter((t) => t.tone === "prompt").length),
    counts: {
      childrenWithDisruption: withDisruption.length,
      openTriggers: reads.reduce((n, r) => n + r.triggers.filter((t) => t.tone === "prompt").length, 0),
      positives: reads.reduce((n, r) => n + r.triggers.filter((t) => t.tone === "positive").length, 0),
    },
  };
}
