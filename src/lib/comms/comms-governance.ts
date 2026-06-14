// ══════════════════════════════════════════════════════════════════════════════
// CARA COMMS CENTRE — message governance (Phase 2)
//
// Pure, deterministic logic that turns everyday messages into accountable records:
//
//   1. analyseMessageLanguage()  — reuses the Cara recording-quality scorer to nudge
//      staff toward professional, child-focused, factual language BEFORE they send.
//      It is advisory only — it never blocks a send and never changes a message.
//
//   2. detectRecordableContent() — flags messages that describe something that
//      probably belongs in a formal record (safeguarding, medication, injury,
//      missing-from-care, allegation…) so it is captured once and never lives only
//      as a chat message ("no hidden second record").
//
//   3. ACTION_EVENT_MAP — maps a chosen conversion action to the canonical
//      Cara event type + task category used by the convert endpoint, so a
//      message becomes a real record on the event spine / task list, linked back to
//      its source message.
//
// No wall-clock, no I/O — every function is a pure transform for deterministic
// tests. The API routes own identity, persistence and audit.
// ══════════════════════════════════════════════════════════════════════════════

import { scoreRecordingQuality, type QualityScore } from "@/lib/cara/recording-quality";
import type { CornerstoneEventType } from "@/types/cornerstone-event";
import type { CommsMessageActionType, CommsLinkedRecordType } from "@/types/comms";
import type { TaskCategory } from "@/lib/constants";

// ── 1. Language nudge ─────────────────────────────────────────────────────────

export interface MessageLanguageAnalysis {
  /** Whether staff should be gently nudged to improve before sending. */
  shouldNudge: boolean;
  grade: QualityScore["grade"];
  /** 0-100 overall professional-recording score. */
  score: number;
  wordCount: number;
  /** Up to three short, plain-English improvement prompts. */
  suggestions: string[];
  strengths: string[];
}

/**
 * Only nudge once a message is substantial enough to judge. Very short operational
 * pings ("running 5 min late", "kettle's broken") are not records and must not be
 * nagged — that would train staff to ignore the nudge.
 */
export const MIN_WORDS_FOR_LANGUAGE_NUDGE = 12;

/** Grades at or below this trigger a (non-blocking) professional-language nudge. */
const NUDGE_GRADES: ReadonlySet<QualityScore["grade"]> = new Set([
  "needs_improvement",
  "insufficient",
]);

/**
 * Score a draft/sent message for professional-recording quality. Pure wrapper over
 * the shared Cara scorer so Comms and care-recording stay consistent. Advisory only.
 */
export function analyseMessageLanguage(
  text: string,
  opts: { hasLinkedChild?: boolean; hasLinkedIncident?: boolean } = {},
): MessageLanguageAnalysis {
  const content = (text ?? "").trim();
  const wordCount = content ? content.split(/\s+/).length : 0;

  // Too short to meaningfully score — never nudge.
  if (wordCount < MIN_WORDS_FOR_LANGUAGE_NUDGE) {
    return { shouldNudge: false, grade: "adequate", score: 0, wordCount, suggestions: [], strengths: [] };
  }

  const q = scoreRecordingQuality({
    content,
    entryType: "comms_message",
    childName: opts.hasLinkedChild ? "the child" : undefined,
    hasLinkedIncident: opts.hasLinkedIncident,
  });

  return {
    shouldNudge: NUDGE_GRADES.has(q.grade),
    grade: q.grade,
    score: q.overall,
    wordCount: q.wordCount,
    suggestions: q.suggestions.slice(0, 3),
    strengths: q.strengths.slice(0, 2),
  };
}

// ── 2. Recordable-content detection ───────────────────────────────────────────

export interface RecordableSignal {
  category: string;
  /** The lowercased trigger words that matched (for transparency, not storage). */
  matched: string[];
  /** The conversion the home should consider for this signal. */
  suggestedAction: CommsMessageActionType;
  /** Plain-English reason shown to staff. */
  reason: string;
}

export interface RecordableDetection {
  recordable: boolean;
  signals: RecordableSignal[];
  /** De-duplicated ordered list of suggested conversions (highest concern first). */
  suggestedActions: CommsMessageActionType[];
}

interface KeywordRule {
  category: string;
  suggestedAction: CommsMessageActionType;
  reason: string;
  /** Concern weight — higher sorts first. */
  weight: number;
  keywords: string[];
}

// Ordered by safeguarding concern. Keywords are matched as whole words/phrases,
// case-insensitively. Deliberately conservative: this *suggests*, never auto-files.
const KEYWORD_RULES: KeywordRule[] = [
  {
    category: "safeguarding",
    suggestedAction: "safeguarding_concern",
    reason: "Mentions a possible safeguarding or welfare concern — this usually needs a formal safeguarding record.",
    weight: 100,
    keywords: [
      "disclosure", "disclosed", "allegation", "alleged", "abuse", "abused", "neglect", "neglected",
      "grooming", "exploitation", "cse", "cce", "self-harm", "self harm", "suicidal", "suicide",
      "overdose", "ligature", "safeguarding", "at risk", "unsafe", "bruise", "bruising",
      "injury", "injured", "hit", "assault", "assaulted",
    ],
  },
  {
    category: "missing",
    suggestedAction: "incident_follow_up",
    reason: "Mentions a child away or missing from care — this needs a missing-from-home / incident record.",
    weight: 90,
    keywords: ["missing", "absconded", "ran away", "not returned", "awol", "didn't come back", "did not come back"],
  },
  {
    category: "physical_intervention",
    suggestedAction: "incident_follow_up",
    reason: "Mentions restraint or physical intervention — this needs an incident record and oversight.",
    weight: 85,
    keywords: ["restraint", "restrained", "physical intervention", "held him", "held her", "team teach", "pi used"],
  },
  {
    category: "medication",
    suggestedAction: "medication_note",
    reason: "Mentions medication — errors, omissions or PRN usually need a medication record.",
    weight: 70,
    keywords: ["medication error", "missed dose", "wrong dose", "double dose", "prn", "refused meds", "refused medication", "med error"],
  },
  {
    category: "incident",
    suggestedAction: "incident_follow_up",
    reason: "Describes an incident — consider recording it so it is captured once and tracked.",
    weight: 60,
    keywords: ["incident", "damage", "police", "called 999", "ambulance", "a&e", "emergency", "altercation", "fight"],
  },
  {
    category: "complaint",
    suggestedAction: "management_oversight",
    reason: "Mentions a complaint — this should be logged for management oversight.",
    weight: 40,
    keywords: ["complaint", "complained", "unhappy with", "wants to make a complaint"],
  },
];

/** Escape a keyword for use in a word-boundary-ish RegExp (phrases allowed). */
function matchesKeyword(haystack: string, keyword: string): boolean {
  // Word-boundary match for single tokens; substring for multi-word phrases.
  if (keyword.includes(" ")) return haystack.includes(keyword);
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(haystack);
}

/**
 * Heuristically detect content that should probably become a formal record. Pure +
 * deterministic. This is a *prompt to a human*, never an automatic filing — staff
 * stay in control and decide whether (and how) to convert.
 */
export function detectRecordableContent(text: string): RecordableDetection {
  const hay = (text ?? "").toLowerCase();
  if (!hay.trim()) return { recordable: false, signals: [], suggestedActions: [] };

  const signals: (RecordableSignal & { weight: number })[] = [];
  for (const rule of KEYWORD_RULES) {
    const matched = rule.keywords.filter((k) => matchesKeyword(hay, k));
    if (matched.length > 0) {
      signals.push({
        category: rule.category,
        matched,
        suggestedAction: rule.suggestedAction,
        reason: rule.reason,
        weight: rule.weight,
      });
    }
  }

  signals.sort((a, b) => b.weight - a.weight);
  const suggestedActions: CommsMessageActionType[] = [];
  for (const s of signals) {
    if (!suggestedActions.includes(s.suggestedAction)) suggestedActions.push(s.suggestedAction);
  }

  return {
    recordable: signals.length > 0,
    // Strip the internal weight from the public shape.
    signals: signals.map(({ weight: _w, ...s }) => s),
    suggestedActions,
  };
}

// ── 3. Conversion mapping (message → canonical record / task) ─────────────────

export interface ActionMapping {
  /**
   * Canonical event type written to the Cara event spine, or null when the
   * action produces a task rather than a spine event.
   */
  eventType: CornerstoneEventType | null;
  /** Task category used when the action produces a task. */
  taskCategory: TaskCategory;
  /** The link type stamped back on the source message (so the thread shows it). */
  linkedRecordType: CommsLinkedRecordType;
  /** Whether converting requires the message to be linked to a child. */
  requiresChild: boolean;
  /** Human label for menus and audit detail. */
  label: string;
  /** Default risk level for the captured event (advisory; never auto-escalates). */
  riskLevel: "low" | "medium" | "high" | "critical";
}

export const ACTION_EVENT_MAP: Record<CommsMessageActionType, ActionMapping> = {
  task: { eventType: null, taskCategory: "professional_communication", linkedRecordType: "task", requiresChild: false, label: "Task / follow-up", riskLevel: "low" },
  daily_log: { eventType: "daily_log", taskCategory: "young_person_plans", linkedRecordType: "daily_log", requiresChild: true, label: "Daily log entry", riskLevel: "low" },
  // incident + safeguarding are CHILD_EVENTS on the spine — a child link is mandatory
  // (validateDraft rejects them otherwise), so requiresChild must be true here.
  incident_follow_up: { eventType: "incident", taskCategory: "safeguarding", linkedRecordType: "incident", requiresChild: true, label: "Incident record", riskLevel: "high" },
  safeguarding_concern: { eventType: "safeguarding", taskCategory: "safeguarding", linkedRecordType: "incident", requiresChild: true, label: "Safeguarding concern", riskLevel: "high" },
  medication_note: { eventType: "medication", taskCategory: "medication", linkedRecordType: "medication_record", requiresChild: true, label: "Medication record", riskLevel: "medium" },
  risk_assessment_review: { eventType: "risk_assessment", taskCategory: "young_person_plans", linkedRecordType: "risk_assessment", requiresChild: true, label: "Risk assessment review", riskLevel: "medium" },
  management_oversight: { eventType: "qa_check", taskCategory: "compliance", linkedRecordType: "management_oversight", requiresChild: false, label: "Management oversight", riskLevel: "low" },
  keywork_action: { eventType: "keywork", taskCategory: "young_person_plans", linkedRecordType: "keywork_session", requiresChild: true, label: "Key-work action", riskLevel: "low" },
  reg44_evidence: { eventType: "reg44", taskCategory: "inspection", linkedRecordType: "management_oversight", requiresChild: false, label: "Reg 44 evidence", riskLevel: "low" },
  reg45_evidence: { eventType: "reg45", taskCategory: "inspection", linkedRecordType: "management_oversight", requiresChild: false, label: "Reg 45 evidence", riskLevel: "low" },
};

/** The set of conversion actions, in the order shown in the UI menu. */
export const CONVERSION_ACTIONS: CommsMessageActionType[] = [
  "safeguarding_concern",
  "incident_follow_up",
  "medication_note",
  "daily_log",
  "keywork_action",
  "risk_assessment_review",
  "management_oversight",
  "reg45_evidence",
  "reg44_evidence",
  "task",
];

// ── 4. Retention categories ───────────────────────────────────────────────────
//
// UK children's-homes records have long statutory retention. Investigation hold
// freezes a message (no edit/delete) and bumps retention while a matter is live.

export interface RetentionCategory {
  key: string;
  label: string;
  description: string;
}

export const RETENTION_CATEGORIES: RetentionCategory[] = [
  { key: "routine_messages", label: "Routine messages", description: "Everyday operational comms — standard retention." },
  { key: "child_related", label: "Child-related", description: "Relates to a child — retained with the child's record." },
  { key: "safeguarding", label: "Safeguarding", description: "Safeguarding matter — long statutory retention." },
  { key: "hr_conduct", label: "HR / conduct", description: "Staff conduct or HR matter — retained per HR policy." },
  { key: "investigation", label: "Investigation", description: "Subject to an active investigation — frozen and preserved." },
];

export const RETENTION_KEYS = RETENTION_CATEGORIES.map((r) => r.key);

/** Validate a retention key (used by the hold endpoint). */
export function isValidRetentionCategory(key: string): boolean {
  return RETENTION_KEYS.includes(key);
}
