// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — recordType reporting-quality checklists (slice 9)
//
// Deterministic "missing element" checks per record type and field. Unlike the
// positioned care-rules (spelling, tone, blame) these apply to the WHOLE TEXT
// and fire when a required quality element appears to be absent. They use
// start:0/end:0 as a whole-text sentinel — no inline underline, but an issue
// card still surfaces. All require human judgement (author decides if the
// element was intended to be absent).
//
// CHR 2015 / Ofsted framing: incident records must be factual, timed and
// attributed; risk records must have clear if/then actions; child voice must
// reflect what was said; handovers must carry forward commitments.
// ══════════════════════════════════════════════════════════════════════════════

import type { WritingIssue, IssueType, IssueSeverity, WritingMode } from "./types";

// ── Rule definition ────────────────────────────────────────────────────────

interface CompletenessRule {
  key: string;
  /** Which recordType values trigger this rule. "*" = any. */
  recordTypes: string[];
  /** If set, only fires when fieldName is one of these values. */
  fieldNames?: string[];
  /** If set, only fires in these writing modes. */
  modes?: WritingMode[];
  /**
   * Returns true if the required element IS PRESENT in the text.
   * The rule fires (emits an issue) when this returns FALSE.
   */
  present: (text: string) => boolean;
  type: IssueType;
  severity: IssueSeverity;
  message: string;
  explanation: string;
}

// ── Rules bank ─────────────────────────────────────────────────────────────

const RULES: CompletenessRule[] = [
  // ── Incident records ───────────────────────────────────────────────────────
  {
    key: "incident-time",
    recordTypes: ["incident"],
    fieldNames: ["description"],
    present: (t) =>
      /\b(\d{1,2}[:h]\d{2}|\d{1,2}\s*(am|pm)\b|at approximately|\baround \d|\b\d{1,2}[.:]\d{2}\s*(am|pm)\b|\bmorning\b|\bafternoon\b|\bevening\b|\bnight\b|\bmidnight\b)\b/i.test(t),
    type: "chronology",
    severity: "medium",
    message: "Time reference not found",
    explanation:
      "Incident records should include the time the incident occurred — even an approximate time ('around 9pm') satisfies the regulatory requirement and makes the log useful for chronology.",
  },
  {
    key: "incident-notification",
    recordTypes: ["incident"],
    fieldNames: ["immediate_action", "description"],
    present: (t) =>
      /\b(notif|inform|contact|call|report|manag|on.call|on call|police|la\b|local authority|social work|placing authority|parent|carer)\b/i.test(t),
    type: "chronology",
    severity: "medium",
    message: "Notification not referenced",
    explanation:
      "Incident records should note who was informed — manager, placing authority, parents/carers, or other relevant parties. Recording this protects staff and demonstrates duty of care.",
  },

  // ── Risk assessment ────────────────────────────────────────────────────────
  {
    key: "risk-contingency-actions",
    recordTypes: ["risk_assessment"],
    fieldNames: ["contingency_plan"],
    present: (t) =>
      /\b(if |when |contact|call|remove|move to|notify|alert|implement|do not|ensure|staff (must|should|will)|keyworker|manager (must|should|will)|in the event)\b/i.test(t),
    type: "chronology",
    severity: "medium",
    message: "No clear action steps found",
    explanation:
      "Contingency plans should include specific 'if/then' actions — what staff do when the risk escalates, and who they contact. Vague plans are harder to follow under pressure.",
  },
  {
    key: "risk-child-views-direct",
    recordTypes: ["risk_assessment"],
    fieldNames: ["child_views"],
    present: (t) =>
      /["']|(\bsaid\b|\btold\b|\bexpressed\b|\bfelt\b|\bwanted\b|\bwishes\b|\bbelieves\b|\basked\b|\bthinks\b)/i.test(t),
    type: "writing-to-child",
    severity: "low",
    message: "No direct speech or attribution found",
    explanation:
      "The child's views field is most meaningful when it reflects what the young person actually said or expressed — even a paraphrase like 'Alex told me that…' shows you sought their view.",
  },

  // ── Key working sessions ───────────────────────────────────────────────────
  {
    key: "keywork-child-voice-direct",
    recordTypes: ["key_work"],
    fieldNames: ["child_voice"],
    present: (t) =>
      /["']|(\bsaid\b|\btold\b|\bexpressed\b|\bfelt\b|\bwanted\b|\bwishes\b|\basked\b|\bthinks\b|\bshared\b)/i.test(t),
    type: "writing-to-child",
    severity: "medium",
    message: "No direct speech or attribution found",
    explanation:
      "Child's voice should reflect what the young person actually said or expressed, ideally in their own words (e.g. 'Alex said that…'). This evidences that their view was genuinely sought.",
  },
  {
    key: "keywork-observations-professional",
    recordTypes: ["key_work"],
    fieldNames: ["worker_observations"],
    present: (t) =>
      /\b(appear|seem|observ|noted|present|express|engag|respond|reflect|display|show|demonstrat)\w*/i.test(t),
    type: "chronology",
    severity: "low",
    message: "Limited observational language",
    explanation:
      "Worker observations are strongest when they describe what you saw and heard ('appeared calm', 'engaged well with…', 'expressed concern about…') rather than just what occurred.",
  },

  // ── Handover notes ─────────────────────────────────────────────────────────
  {
    key: "handover-forward-reference",
    recordTypes: ["handover"],
    present: (t) =>
      /\b(tomorrow|tonight|today|next week|upcoming|due|scheduled|appointment|will need|should be|needs to|remember to|follow.up|check on|review)\b/i.test(t),
    type: "chronology",
    severity: "low",
    message: "No forward-looking actions found",
    explanation:
      "Handover notes are most useful to the incoming shift when they include what needs to happen next — appointments, actions to follow up, anything to keep an eye on.",
  },

  // ── Return interview / safeguarding ───────────────────────────────────────
  {
    key: "return-interview-attribution",
    recordTypes: ["return_interview"],
    modes: ["safeguarding"],
    present: (t) =>
      /\b(allege|disclos|report|told (me|us|staff)|said that|according to|observ|witness|inform|stated)\b/i.test(t),
    type: "safeguarding-quality",
    severity: "medium",
    message: "Information source not attributed",
    explanation:
      "Safeguarding and return-interview records should clearly attribute information — who said what, what was observed, what was reported — so the record is evidentially sound.",
  },

  // ── Daily log ─────────────────────────────────────────────────────────────
  {
    key: "daily-log-wellbeing",
    recordTypes: ["daily_log"],
    present: (t) =>
      /\b(mood|felt|appear|seem|settl|unsettl|happy|anxi|calm|distress|uplift|low|tired|energet|engag)\w*/i.test(t),
    type: "chronology",
    severity: "low",
    message: "No wellbeing observation found",
    explanation:
      "Daily log entries are richer when they include a brief wellbeing observation — mood, energy, how the young person presented — alongside what happened.",
  },
];

// ── Public export ───────────────────────────────────────────────────────────

export function runCompletenessRules(
  text: string,
  recordType?: string,
  fieldName?: string,
  mode?: WritingMode,
): WritingIssue[] {
  if (!text || text.trim().length < 20) return [];

  const issues: WritingIssue[] = [];

  for (const rule of RULES) {
    // recordType filter
    if (!rule.recordTypes.includes("*") && recordType && !rule.recordTypes.includes(recordType)) continue;
    if (!recordType) continue; // don't fire without recordType context

    // fieldName filter — only apply if the rule specifies field(s)
    if (rule.fieldNames && fieldName && !rule.fieldNames.includes(fieldName)) continue;
    if (rule.fieldNames && !fieldName) continue; // rule is field-specific, but no fieldName provided

    // mode filter
    if (rule.modes && mode && !rule.modes.includes(mode)) continue;

    // Check presence — issue fires only if element is ABSENT
    if (rule.present(text)) continue;

    issues.push({
      id: `wa-completeness-${rule.key}`,
      type: rule.type,
      severity: rule.severity,
      start: 0,
      end: 0,
      originalText: "",
      message: rule.message,
      explanation: rule.explanation,
      suggestions: [],
      source: "rule-engine",
      confidence: 0.8,
      requiresHumanJudgement: true,
    });
  }

  return issues;
}
