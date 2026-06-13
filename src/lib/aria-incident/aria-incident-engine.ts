// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara INCIDENT MODE ENGINE (pure / deterministic)
//
// The live-incident core of the Cara Practice Assistant: incident types, per-type
// workflow checklists, the co-regulation prompt bank, child-voice prompts, the
// pre-save quality gate, and a deterministic draft-record assembler (the no-LLM
// fallback that NEVER invents facts — it only re-presents what staff recorded).
//
// Design principle (hard contract): AI suggests. Staff decide. Manager reviews.
// System audits. Cara never replaces professional judgement, never makes
// safeguarding decisions, and never states that a Regulation 40 notification is
// definitely required — only that the manager should consider it.
// ══════════════════════════════════════════════════════════════════════════════

import { scoreProfessionalLanguage } from "@/lib/recording-quality/recording-quality-engine";
import { FRAMEWORK_GUIDANCE_BLOCK } from "@/lib/aria/practice-frameworks";

export const INCIDENT_DISCLAIMER =
  "Cara suggests — staff decide, the manager reviews, the system audits. Cara supports recording and practice; it never replaces professional judgement and never makes safeguarding decisions.";

export const REG40_WORDING =
  "The manager should consider whether a Regulation 40 notification is required.";

// ── Incident types (spec) ───────────────────────────────────────────────────────
export const INCIDENT_TYPES: { key: string; label: string }[] = [
  { key: "emotional_dysregulation", label: "Emotional dysregulation" },
  { key: "missing_from_home", label: "Missing from home concern" },
  { key: "physical_aggression", label: "Physical aggression" },
  { key: "verbal_aggression", label: "Verbal aggression" },
  { key: "self_harm_concern", label: "Self-harm concern" },
  { key: "bullying_concern", label: "Bullying concern" },
  { key: "medication_refusal", label: "Medication refusal" },
  { key: "family_contact_distress", label: "Family contact distress" },
  { key: "peer_conflict", label: "Peer conflict" },
  { key: "police_involvement", label: "Police involvement" },
  { key: "physical_intervention", label: "Physical intervention / restraint" },
  { key: "property_damage", label: "Property damage" },
  { key: "substance_concern", label: "Substance concern" },
  { key: "exploitation_concern", label: "Exploitation concern" },
  { key: "room_search", label: "Room search" },
  { key: "safeguarding_concern", label: "Safeguarding concern" },
  { key: "other", label: "Other" },
];

export const ENTRY_TYPES: { key: string; label: string }[] = [
  { key: "observation", label: "Observation" },
  { key: "staff_action", label: "Staff action" },
  { key: "child_voice", label: "Child's voice" },
  { key: "safety_update", label: "Safety update" },
  { key: "manager_notification", label: "Manager notified" },
  { key: "restorative_action", label: "Restorative action" },
  { key: "deescalation_attempt", label: "De-escalation" },
  { key: "risk_change", label: "Risk change" },
  { key: "other", label: "Other" },
];

export type RiskLevel = "low" | "medium" | "high";

// ── Data shapes (in-memory store + Supabase tables mirror these) ───────────────
export interface IncidentSession {
  id: string;
  home_id: string;
  child_id: string;
  started_by_user_id: string;
  started_at: string;
  ended_at: string | null;
  incident_type: string;
  incident_status: "active" | "ended" | "record_created";
  immediate_risk_level: RiskLevel;
  manager_notified: boolean;
  manager_notified_at: string | null;
  ai_support_used: boolean;
  final_record_created: boolean;
  workflow_progress: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface IncidentTimelineEntry {
  id: string;
  incident_session_id: string;
  home_id: string;
  child_id: string;
  user_id: string;
  entry_type: string;
  raw_text: string;
  ai_rewritten_text: string | null;
  accepted_text: string | null;
  timestamp: string;
  created_at: string;
}

// Audit-safe recording review: original, AI suggestion and final accepted version
// are ALL preserved — staff may never hide the original note behind a rewrite.
export interface AriaRecordingReview {
  id: string;
  home_id: string;
  child_id: string;
  user_id: string;
  incident_session_id: string | null;
  record_type: string;
  raw_text: string;
  ai_suggested_text: string | null;
  final_accepted_text: string;
  ai_quality_flags: string[];
  staff_accepted: boolean;
  accepted_at: string | null;
  manager_review_required: boolean;
  manager_reviewed_by: string | null;
  manager_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Workflow checklists per incident type ──────────────────────────────────────
export interface WorkflowStep {
  key: string;
  title: string;
  required: boolean;
  manager_review_required?: boolean;
  regulation_related?: boolean;
}

const MANAGER_REVIEW_STEP: WorkflowStep = { key: "manager_review", title: "Manager review required", required: true, manager_review_required: true };

const WORKFLOWS: Record<string, WorkflowStep[]> = {
  emotional_dysregulation: [
    { key: "safety", title: "Check immediate safety", required: true },
    { key: "reduce_demands", title: "Reduce demands", required: true },
    { key: "reassure", title: "Offer reassurance", required: true },
    { key: "space", title: "Offer space", required: false },
    { key: "trigger", title: "Record trigger / context", required: true },
    { key: "staff_response", title: "Record staff response", required: true },
    { key: "child_voice", title: "Capture child's voice when settled", required: true },
    { key: "restorative", title: "Consider restorative conversation", required: true },
    { key: "keywork", title: "Consider key-work follow-up", required: false },
  ],
  missing_from_home: [
    { key: "location", title: "Check location and last known whereabouts", required: true },
    { key: "notify_manager", title: "Notify manager", required: true, manager_review_required: true },
    { key: "protocol", title: "Follow missing-from-care protocol", required: true, regulation_related: true },
    { key: "police", title: "Contact police if threshold met", required: true },
    { key: "placing_authority", title: "Notify placing authority / social worker", required: true },
    { key: "actions", title: "Record actions taken", required: true },
    { key: "return_conversation", title: "Record return conversation", required: true },
    { key: "exploitation", title: "Consider exploitation risk", required: true },
    { key: "risk_assessment", title: "Update risk assessment if required", required: false },
  ],
  physical_intervention: [
    { key: "deescalation", title: "Record de-escalation attempted", required: true },
    { key: "necessity", title: "Record why intervention was necessary", required: true },
    { key: "times", title: "Record start and end time", required: true },
    { key: "staff_involved", title: "Record staff involved", required: true },
    { key: "presentation", title: "Record child's presentation before, during and after", required: true },
    { key: "injuries", title: "Record injuries or confirm no injuries", required: true },
    { key: "body_map", title: "Complete body map if needed", required: false },
    { key: "notify_manager", title: "Notify manager", required: true, manager_review_required: true },
    { key: "reg40", title: "Consider Regulation 40 notification", required: true, regulation_related: true },
    { key: "child_debrief", title: "Complete child debrief", required: true },
    { key: "staff_debrief", title: "Complete staff debrief", required: true },
  ],
  self_harm_concern: [
    { key: "safety", title: "Check immediate safety and provide first aid if needed", required: true },
    { key: "stay", title: "Stay with the young person — calm, non-judgemental presence", required: true },
    { key: "remove_means", title: "Make the environment safe where possible", required: true },
    { key: "notify_manager", title: "Notify manager", required: true, manager_review_required: true },
    { key: "medical", title: "Seek medical advice if any injury or uncertainty", required: true },
    { key: "safety_plan", title: "Review the self-harm safety plan", required: true },
    { key: "child_voice", title: "Capture child's voice when ready — without pressure", required: true },
    { key: "reg40", title: "Consider whether notification is required", required: true, regulation_related: true },
  ],
  safeguarding_concern: [
    { key: "listen", title: "Listen without leading; do not promise confidentiality", required: true },
    { key: "record_words", title: "Record the child's words accurately", required: true },
    { key: "notify_dsl", title: "Escalate to the DSL / manager without delay", required: true, manager_review_required: true },
    { key: "no_investigation", title: "Do not investigate — preserve the account", required: true },
    { key: "referral", title: "Manager to consider referral / LADO / notification thresholds", required: true, regulation_related: true },
    { key: "support", title: "Keep supporting the child; record their presentation", required: true },
  ],
  medication_refusal: [
    { key: "no_force", title: "Never force — record the refusal calmly", required: true },
    { key: "mar", title: "Record on the MAR sheet", required: true },
    { key: "advice", title: "Seek pharmacy / prescriber advice if needed", required: true },
    { key: "monitor", title: "Monitor for effects of the missed dose", required: true },
    { key: "reoffer", title: "Re-offer later if protocol allows", required: false },
    { key: "pattern", title: "Consider whether refusals are becoming a pattern", required: false },
  ],
  family_contact_distress: [
    { key: "reassure", title: "Offer reassurance and emotional availability", required: true },
    { key: "space", title: "Offer space to regulate", required: true },
    { key: "trigger", title: "Record the contact context and what changed", required: true },
    { key: "child_voice", title: "Capture child's voice when settled", required: true },
    { key: "contact_plan", title: "Consider the family-contact support plan", required: true },
    { key: "keywork", title: "Consider key-work follow-up on family contact", required: false },
  ],
  peer_conflict: [
    { key: "separate", title: "Keep all children safe; create space between peers", required: true },
    { key: "regulate", title: "Support each child to regulate before resolution", required: true },
    { key: "voices", title: "Hear each child's account separately", required: true },
    { key: "restorative", title: "Plan a restorative conversation when ready", required: true },
    { key: "patterns", title: "Consider any pattern between these children", required: false },
  ],
};

const DEFAULT_WORKFLOW: WorkflowStep[] = [
  { key: "safety", title: "Check immediate safety", required: true },
  { key: "support", title: "Offer calm support and reduce demands", required: true },
  { key: "context", title: "Record trigger / context", required: true },
  { key: "staff_response", title: "Record staff response", required: true },
  { key: "child_voice", title: "Capture child's voice when settled", required: true },
  { key: "follow_up", title: "Identify follow-up actions", required: true },
];

export function buildWorkflowChecklist(incidentType: string): WorkflowStep[] {
  const steps = WORKFLOWS[incidentType] ?? DEFAULT_WORKFLOW;
  return [...steps, MANAGER_REVIEW_STEP];
}

// ── Co-regulation prompt bank (live mode: short, calm, never overwhelming) ─────
export const CO_REGULATION_PROMPTS: string[] = [
  "Lower your voice.",
  "Reduce demands.",
  "Give physical space.",
  "Offer two safe choices.",
  "Avoid arguing about the behaviour.",
  "Name the feeling, not the behaviour.",
  "Use reassurance before consequences.",
  "Check hunger, tiredness, sensory overload, fear, shame or contact-related distress.",
  "Ask yourself: what is the child communicating?",
  "Stay emotionally available.",
  "Keep other children safe.",
  "Seek support from another staff member if needed.",
];

const TYPE_PROMPTS: Record<string, string[]> = {
  missing_from_home: ["Note the time and last known location.", "Follow the missing-from-care protocol.", "Keep the search calm and coordinated."],
  physical_intervention: ["Only as a last resort, for safety.", "Note the start time.", "Keep talking calmly throughout.", "Watch breathing and wellbeing constantly."],
  self_harm_concern: ["Stay calm and non-judgemental.", "Your presence matters more than your words.", "Make the space safe without battles."],
  safeguarding_concern: ["Listen. Don't lead. Don't promise secrecy.", "The child's words, not your interpretation."],
  medication_refusal: ["Never force or trick.", "Stay neutral — record and seek advice."],
  family_contact_distress: ["Contact can stir grief and loyalty — name the feeling gently.", "Don't rush repair; offer presence."],
  peer_conflict: ["Separate to regulate, not to punish.", "Each child needs to feel heard."],
};

const SUGGESTED_PHRASES: Record<string, string> = {
  default: "“I can see this is difficult right now. I am here to help, not argue.”",
  self_harm_concern: "“I'm not angry. I'm here, and I want to keep you safe.”",
  family_contact_distress: "“That call sounded really hard. I'm here when you're ready.”",
  peer_conflict: "“I want to hear your side properly — let's get some space first.”",
};

export interface LivePrompts {
  immediate: string[];
  suggested_phrase: string;
  recording_reminder: string;
}

export function pickLivePrompts(incidentType: string, risk: RiskLevel): LivePrompts {
  const typeExtras = TYPE_PROMPTS[incidentType] ?? [];
  const core = risk === "high"
    ? ["Check safety first.", "Keep other children safe.", ...CO_REGULATION_PROMPTS.slice(0, 3)]
    : CO_REGULATION_PROMPTS.slice(0, 5);
  const immediate = [...typeExtras, ...core].slice(0, 6);
  return {
    immediate,
    suggested_phrase: SUGGESTED_PHRASES[incidentType] ?? SUGGESTED_PHRASES.default,
    recording_reminder: "Record what happened before, what staff observed, and what support was offered.",
  };
}

// ── Child voice prompts ─────────────────────────────────────────────────────────
export const CHILD_VOICE_PROMPTS: string[] = [
  "What does the child say happened?",
  "How did the child describe their feelings?",
  "Did the child identify a trigger?",
  "Did the child say what helped?",
  "Did the child say what made things worse?",
  "Did the child want anyone informed?",
  "Did the child understand what happens next?",
  "Has the child been offered a restorative conversation?",
  "Has the child declined to talk? If so, how was this respected?",
];

export const CHILD_DECLINED_PROMPTS: string[] = [
  "Record that the child declined, and when they were offered.",
  "Record how staff respected the child's decision.",
  "Record whether staff will revisit later.",
  "Record whether advocacy or a trusted adult is needed.",
];

// ── Quality gate (pre-save checks per spec) ─────────────────────────────────────
export interface GateCheck {
  key: string;
  label: string;
  ok: boolean;
  detail?: string;
}

export interface QualityGate {
  ready: boolean;
  checks: GateCheck[];
  missing: string[];
}

export function computeIncidentQualityGate(input: {
  session: Pick<IncidentSession, "incident_type" | "child_id" | "started_at" | "ended_at" | "manager_notified" | "immediate_risk_level">;
  entries: Pick<IncidentTimelineEntry, "entry_type" | "raw_text">[];
}): QualityGate {
  const { session, entries } = input;
  const has = (type: string) => entries.some((e) => e.entry_type === type && e.raw_text.trim().length > 0);
  const allText = entries.map((e) => e.raw_text).join(" ");
  const languageOk = allText.trim().length === 0 || scoreProfessionalLanguage(allText) === 100;

  const checks: GateCheck[] = [
    { key: "incident_type", label: "Incident type selected", ok: !!session.incident_type },
    { key: "child", label: "Child selected", ok: !!session.child_id },
    { key: "time", label: "Date / time captured", ok: !!session.started_at },
    { key: "context", label: "Trigger / context recorded", ok: has("observation"), detail: "Add an observation describing what was happening before." },
    { key: "staff_response", label: "Staff response recorded", ok: has("staff_action"), detail: "Record what staff did to support." },
    { key: "deescalation", label: "De-escalation recorded", ok: has("deescalation_attempt") || has("staff_action"), detail: "Record how staff tried to de-escalate." },
    { key: "child_voice", label: "Child's voice captured (or decline recorded)", ok: has("child_voice"), detail: "Capture the child's voice when settled — or record that they declined and how this was respected." },
    { key: "safety", label: "Safety / risk recorded", ok: !!session.immediate_risk_level || has("safety_update") || has("risk_change") },
    { key: "manager", label: "Manager notified or review requested", ok: session.manager_notified || has("manager_notification"), detail: "Notify the manager, or record why notification was not needed." },
    { key: "outcome", label: "Outcome recorded (incident ended)", ok: !!session.ended_at, detail: "End the incident to record the outcome." },
    { key: "follow_up", label: "Follow-up identified", ok: has("restorative_action"), detail: "Plan the restorative conversation or follow-up support." },
    { key: "language", label: "Language professional and non-blaming", ok: languageOk, detail: "Some wording may be judgemental — Cara can suggest a factual rewrite." },
  ];

  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  return { ready: missing.length === 0, checks, missing };
}

// ── Deterministic draft (no-LLM fallback — re-presents facts, never invents) ───
export function buildDeterministicDraft(input: {
  session: Pick<IncidentSession, "incident_type" | "started_at" | "ended_at" | "immediate_risk_level" | "manager_notified">;
  entries: Pick<IncidentTimelineEntry, "entry_type" | "raw_text" | "timestamp">[];
  child_name: string;
}): string {
  const { session, entries, child_name } = input;
  const label = INCIDENT_TYPES.find((t) => t.key === session.incident_type)?.label ?? session.incident_type;
  const hhmm = (iso: string) => (iso && iso.includes("T") ? iso.slice(11, 16) : iso);
  const sorted = [...entries].sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));

  const lines: string[] = [];
  lines.push(`Incident record (draft): ${label} — ${child_name}.`);
  lines.push(`Started ${hhmm(session.started_at)}${session.ended_at ? `, ended ${hhmm(session.ended_at)}` : " (ongoing)"}. Immediate risk assessed as ${session.immediate_risk_level}.`);
  lines.push("");
  lines.push("Timeline:");
  for (const e of sorted) {
    const tag = ENTRY_TYPES.find((t) => t.key === e.entry_type)?.label ?? e.entry_type;
    lines.push(`${hhmm(String(e.timestamp))} — [${tag}] ${e.raw_text}`);
  }
  lines.push("");
  const voice = sorted.filter((e) => e.entry_type === "child_voice");
  lines.push(voice.length
    ? `Child's voice: ${voice.map((v) => v.raw_text).join(" ")}`
    : "Child's voice: not yet captured — capture when the child is settled, or record that they declined and how this was respected.");
  lines.push(session.manager_notified ? "Manager notified during the incident." : `Manager notification: not recorded. ${REG40_WORDING}`);
  lines.push("");
  lines.push("This draft re-presents only the facts staff recorded. Staff must review, complete and confirm accuracy before saving.");
  return lines.join("\n");
}

// ── Prompt bank (practice library; custom prompts merge into live mode) ────────
export interface PromptBankEntry {
  id: string;
  category: string;            // co_regulation | deescalation | child_voice | ...
  title: string | null;
  prompt_text: string;
  incident_type: string | null;
  risk_level: string | null;
  is_active: boolean;
  custom: boolean;             // false = versioned in code (shown read-only)
  created_at: string;
  updated_at: string;
}

const BANK_SEEDED_AT = "2026-01-01T00:00:00Z";

export function defaultPromptBank(): PromptBankEntry[] {
  const rows: PromptBankEntry[] = [];
  const add = (id: string, category: string, prompt_text: string, opts: Partial<PromptBankEntry> = {}) =>
    rows.push({ id, category, title: null, prompt_text, incident_type: null, risk_level: null, is_active: true, custom: false, created_at: BANK_SEEDED_AT, updated_at: BANK_SEEDED_AT, ...opts });

  CO_REGULATION_PROMPTS.forEach((p, i) => add(`pb_coreg_${i + 1}`, "co_regulation", p));
  for (const [type, prompts] of Object.entries(TYPE_PROMPTS)) {
    prompts.forEach((p, i) => add(`pb_${type}_${i + 1}`, "deescalation", p, { incident_type: type }));
  }
  for (const [type, phrase] of Object.entries(SUGGESTED_PHRASES)) {
    add(`pb_phrase_${type}`, "deescalation", phrase, { title: "Suggested phrase", incident_type: type === "default" ? null : type });
  }
  CHILD_VOICE_PROMPTS.forEach((p, i) => add(`pb_voice_${i + 1}`, "child_voice", p));
  CHILD_DECLINED_PROMPTS.forEach((p, i) => add(`pb_declined_${i + 1}`, "child_voice", p, { title: "If the child declines" }));
  return rows;
}

// ── Central Cara system prompt (server-side LLM rewrite) ────────────────────────
export const ARIA_INCIDENT_SYSTEM_PROMPT = `You are Cara, the AI practice assistant inside Cara OS, supporting residential childcare staff with therapeutic, restorative, trauma-informed, safeguarding-aware and professionally written recording.
You must: use factual language; avoid judgemental language and labels; support co-regulation; help staff consider the child's lived experience; prompt for the child's voice; preserve the meaning of the staff member's original notes; NEVER invent facts; NEVER diagnose children; NEVER make safeguarding decisions; NEVER state that a Regulation 40 notification is definitely required — instead say "the manager should consider whether notification is required"; always recommend manager review where risk is present; always separate fact, interpretation and suggested action.
Use phrases such as "staff observed", "the young person appeared", "the young person stated", "staff offered", "staff supported". Avoid certainty where there is uncertainty. Tone: calm, professional, trauma-informed, non-blaming, concise, relational, restorative.
${FRAMEWORK_GUIDANCE_BLOCK}
Output EXACTLY these five numbered sections:
1. Improved professional record
2. Missing information
3. Practice considerations
4. Suggested follow-up actions
5. Manager oversight recommendation`;
