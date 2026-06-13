// ══════════════════════════════════════════════════════════════════════════════
// CARA — Compliance document extraction (pure / deterministic)
//
// Reads the TEXT of a compliance document (Statement of Purpose, Workforce /
// Home Development Plan, fire risk assessment, H&S check, insurance certificate,
// policy …) and pulls out what stops it rotting in a folder:
//   • the document category (inferred from title + content)
//   • the key dates — when it must be reviewed / when it expires
//   • the ACTIONS inside it (recommendations, must-dos), with owner + due date
//   • risk flags — overdue review, expired certificate, unowned/undated actions
// It assembles a DocumentAiResult (the shape the documents module already uses),
// so this becomes the no-AI-key spine; an LLM pass can enrich on top in the route.
// `today` is injected; no clock. Fully unit-testable.
// ══════════════════════════════════════════════════════════════════════════════

import {
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_CATEGORY_MODULE,
  type DocumentAiResult,
  type DocumentIntelCategory,
  type DocumentIntelRisk,
  type DocumentRiskFlag,
  type DocumentSuggestedTask,
} from "@/types/documents";

export interface ExtractionInput {
  text: string;
  fileName?: string;
  title?: string;
  /** Manual category override — wins over inference. */
  category?: DocumentIntelCategory | null;
  today: string; // YYYY-MM-DD
}

export interface ComplianceExtraction {
  category: DocumentIntelCategory;
  categoryConfidence: number;
  summary: string;
  riskLevel: DocumentIntelRisk;
  reviewRequired: boolean;
  keyDates: { label: string; value: string }[];
  reviewDue: string | null;
  expiry: string | null;
  actions: { action: string; responsible_person: string | null; due_date: string | null }[];
  suggestedTasks: DocumentSuggestedTask[];
  riskFlags: DocumentRiskFlag[];
  aiResult: DocumentAiResult;
}

const DAY = 864e5;
function toMs(d: string): number { return Date.parse(`${d.slice(0, 10)}T00:00:00Z`); }
function daysBetween(from: string, to: string): number { return Math.round((toMs(to) - toMs(from)) / DAY); }

// ── Category inference ─────────────────────────────────────────────────────────
const CATEGORY_RULES: { re: RegExp; category: DocumentIntelCategory }[] = [
  { re: /statement of purpose/i, category: "statement_of_purpose" },
  { re: /workforce development plan|workforce plan|staff development plan|workforce strategy/i, category: "workforce_development_plan" },
  { re: /home development plan|development plan|improvement plan|home improvement|quality improvement plan/i, category: "home_development_plan" },
  { re: /fire risk assessment|fire safety|fire log|fire drill/i, category: "fire_risk_assessment" },
  { re: /health (and|&) safety|h&s|premises check|water (temperature|safety)|legionella|coshh/i, category: "health_safety_check" },
  { re: /insurance|public liability|employers? liability/i, category: "insurance_certificate" },
  { re: /regulation 44|reg 44|reg\.?44|independent visit/i, category: "reg44_report" },
  { re: /regulation 45|reg 45|reg\.?45|quality of care review/i, category: "reg45_review" },
  { re: /ofsted/i, category: "ofsted_communication" },
  { re: /training matrix/i, category: "training_matrix" },
  { re: /\baudit\b/i, category: "audit_document" },
  { re: /safeguarding policy|policy|procedure/i, category: "policy_document" },
  { re: /children'?s guide|young person'?s guide/i, category: "statement_of_purpose" },
];

function inferCategory(text: string, fileName?: string): { category: DocumentIntelCategory; confidence: number } {
  const hay = `${fileName ?? ""}\n${text}`;
  for (const rule of CATEGORY_RULES) {
    if (rule.re.test(hay)) return { category: rule.category, confidence: 0.8 };
  }
  return { category: "policy_document", confidence: 0.3 };
}

// ── Date parsing ─────────────────────────────────────────────────────────────
const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
function iso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
/** Parse the first date in a string. Handles ISO, dd/mm/yyyy, "1 March 2026", "March 2026". */
function parseDate(s: string): string | null {
  let m = s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})\b/); // dd/mm/yyyy (UK)
  if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return iso(y, +m[2], +m[1]); }
  m = s.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\.?\s+(\d{4})\b/); // 1 March 2026
  if (m && MONTHS[m[2].toLowerCase()]) return iso(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  m = s.match(/\b([A-Za-z]+)\.?\s+(\d{4})\b/); // March 2026 → 1st
  if (m && MONTHS[m[1].toLowerCase()]) return iso(+m[2], MONTHS[m[1].toLowerCase()], 1);
  return null;
}

const REVIEW_CUES = /(review|next review|reviewed|to be reviewed|renewal|renew|next due|valid until|expir|due)/i;
const REVIEW_LABEL = /(next review|review date|to be reviewed|review by|annual review|renewal date|next due)/i;
const EXPIRY_LABEL = /(expir|valid until|expires|renewal date|certificate.*valid|valid to)/i;

// ── Action extraction ──────────────────────────────────────────────────────────
const ACTION_CUE = /\b(action|must|should|to ensure|ensure that|recommend|required to|need to|needs to|to do|complete|implement|introduce|review|update|arrange|renew|carry out|schedule|put in place|develop|provide|obtain|undertake|address)\b/i;
const BULLET = /^\s*(?:[-*•·▪◦]|\d{1,2}[.)]|\[\s?[xX ]?\s?\]|action\s*\d*\s*[:.\-])\s*/i;
const OWNER_RE = /(?:responsible|owner|lead|assigned to|by)\s*[:\-]?\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/;

function cleanLine(line: string): string {
  return line.replace(BULLET, "").replace(/\s+/g, " ").trim();
}

function extractActions(text: string): { action: string; responsible_person: string | null; due_date: string | null }[] {
  const out: { action: string; responsible_person: string | null; due_date: string | null }[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/\r?\n/)) {
    const isBullet = BULLET.test(raw);
    const hasCue = ACTION_CUE.test(raw);
    if (!isBullet && !hasCue) continue;
    const line = cleanLine(raw);
    if (line.length < 6 || line.length > 240) continue;
    // skip section headings ("Actions:", "Recommendations:", "Next steps:")
    if (/^(actions?|recommendations?|next steps?|to ?do|tasks?|action plan)\s*:?\s*$/i.test(line)) continue;
    // skip pure headings (no verb-ish cue and short)
    if (!hasCue && line.split(" ").length < 3) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const owner = line.match(OWNER_RE);
    out.push({ action: line, responsible_person: owner ? owner[1] : null, due_date: parseDate(line) });
    if (out.length >= 25) break;
  }
  return out;
}

// ── Priority + regulation inference for suggested tasks ─────────────────────────
function priorityFor(actionText: string, dueDate: string | null, today: string): DocumentSuggestedTask["priority"] {
  if (/\b(urgent|immediat|critical|as soon as possible|asap|overdue)/i.test(actionText)) return "urgent";
  if (dueDate && daysBetween(today, dueDate) < 0) return "urgent"; // already overdue
  if (dueDate && daysBetween(today, dueDate) <= 7) return "high";
  if (/\b(must|required|legal|statutory|safeguarding|fire|safety)\b/i.test(actionText)) return "high";
  if (/\b(should|review|update|recommend)\b/i.test(actionText)) return "medium";
  return "low";
}
function regulationFor(text: string): string | null {
  const m = text.match(/\b(regulation\s*\d+|reg\.?\s*\d+|quality standard\s*\d+)\b/i);
  return m ? m[1].replace(/\s+/g, " ") : null;
}

export function extractComplianceDocument(input: ExtractionInput): ComplianceExtraction {
  const text = input.text ?? "";
  const inferred = inferCategory(text, input.fileName);
  const category = input.category ?? inferred.category;
  const categoryConfidence = input.category ? 1 : inferred.confidence;
  const label = DOCUMENT_CATEGORY_LABELS[category];

  // ── Key dates (labelled) ──
  const keyDates: { label: string; value: string }[] = [];
  let reviewDue: string | null = null;
  let expiry: string | null = null;
  for (const raw of text.split(/\r?\n/)) {
    if (!REVIEW_CUES.test(raw)) continue;
    const value = parseDate(raw);
    if (!value) continue;
    const labelText = cleanLine(raw).slice(0, 80);
    keyDates.push({ label: labelText, value });
    if (EXPIRY_LABEL.test(raw) && (!expiry || value < expiry)) expiry = value;
    else if (REVIEW_LABEL.test(raw) && (!reviewDue || value < reviewDue)) reviewDue = value;
  }
  // If a review cadence is stated but only review labels found, keep the soonest as reviewDue.
  if (!reviewDue && !expiry && keyDates.length > 0) reviewDue = keyDates.map((d) => d.value).sort()[0];

  const actions = extractActions(text);

  // ── Suggested tasks from actions ──
  const suggestedTasks: DocumentSuggestedTask[] = actions.map((a, i) => ({
    id: `sgt_${i}`,
    title: a.action.length > 90 ? `${a.action.slice(0, 87)}…` : a.action,
    description: a.action,
    priority: priorityFor(a.action, a.due_date, input.today),
    responsible_person: a.responsible_person,
    due_date: a.due_date,
    regulation_link: regulationFor(a.action),
    source_quote: a.action,
    approved: false,
    created_task_id: null,
  }));

  // ── Risk flags ──
  const riskFlags: DocumentRiskFlag[] = [];
  const reviewOverdue = reviewDue && daysBetween(input.today, reviewDue) < 0;
  const expired = expiry && daysBetween(input.today, expiry) < 0;
  const needsDate = ["statement_of_purpose", "workforce_development_plan", "home_development_plan", "fire_risk_assessment", "health_safety_check", "insurance_certificate", "policy_document", "audit_document"].includes(category);
  if (expired) riskFlags.push({ flag_type: "outdated_assessment", description: `This document expired on ${expiry}.`, severity: "critical" });
  if (reviewOverdue) riskFlags.push({ flag_type: "missing_review_date", description: `Review was due on ${reviewDue} and has passed.`, severity: "high" });
  if (!reviewDue && !expiry && needsDate) riskFlags.push({ flag_type: "missing_review_date", description: "No review or expiry date was found — this document needs a review cycle.", severity: "medium" });
  if (actions.length > 0 && actions.every((a) => !a.responsible_person)) riskFlags.push({ flag_type: "no_responsible_person", description: "Actions were identified but none name a responsible person.", severity: "low" });
  if (actions.some((a) => !a.due_date)) riskFlags.push({ flag_type: "missing_date", description: "Some actions have no due date — they risk drifting.", severity: "low" });

  // ── Risk level ──
  let riskLevel: DocumentIntelRisk = "low";
  if (expired) riskLevel = "critical";
  else if (reviewOverdue) riskLevel = "high";
  else if (riskFlags.some((f) => f.severity === "medium") || actions.length > 0) riskLevel = "medium";

  const reviewRequired = riskLevel !== "low";

  // ── Summary ──
  const dateBit = expired ? `Expired ${expiry}.` : reviewOverdue ? `Review overdue (was due ${reviewDue}).` : reviewDue ? `Review due ${reviewDue}.` : expiry ? `Valid until ${expiry}.` : "No review or expiry date stated.";
  const summary = `${label}. ${actions.length} action${actions.length === 1 ? "" : "s"} identified. ${dateBit}`;

  const people = [...new Set(actions.map((a) => a.responsible_person).filter((p): p is string => !!p))];

  const aiResult: DocumentAiResult = {
    document_category: category,
    document_category_label: label,
    confidence: categoryConfidence,
    ai_summary: summary,
    ai_risk_level: riskLevel,
    review_required: reviewRequired,
    suggested_filing: label,
    suggested_module: DOCUMENT_CATEGORY_MODULE[category],
    extracted_entities: {
      people,
      // Canonical entries first (durable, machine-readable) then the raw labelled dates.
      dates: [
        ...(reviewDue ? [{ label: "Review due", value: reviewDue }] : []),
        ...(expiry ? [{ label: "Expiry", value: expiry }] : []),
        ...keyDates,
      ],
      actions,
      risks: riskFlags.map((f) => f.description),
      safeguarding_concerns: [],
      missing_information: !reviewDue && !expiry && needsDate ? ["Review / expiry date"] : [],
    },
    suggested_tasks: suggestedTasks,
    regulation_links: [],
    evidence_areas: [],
    risk_flags: riskFlags,
    chronology_suggestions: [],
    oversight_draft: `${label} processed: ${actions.length} action(s) to track. ${dateBit}`,
    child_friendly_summary: null,
    prompt_injection_detected: false,
    suspicious_content: null,
  };

  return { category, categoryConfidence, summary, riskLevel, reviewRequired, keyDates, reviewDue, expiry, actions, suggestedTasks, riskFlags, aiResult };
}
