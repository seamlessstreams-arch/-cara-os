// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA POST-INCIDENT ENGINE (pure / deterministic)
//
// Slice B of the Practice Assistant: the restorative-conversation template and
// the post-incident reflection — both tied to an incident session. Complements
// (does not replace) the standalone child/staff debrief logs that already exist.
//
// The engine provides the question templates, derives suggested follow-up
// actions from what staff actually recorded (deterministic mapping — explainable,
// no AI required), assembles factual summaries, and decides when manager review
// is required. AI (where used, in the route) only drafts a summary for staff to
// accept or reject — it never writes conclusions on its own.
// ══════════════════════════════════════════════════════════════════════════════

export const RESTORATIVE_DISCLAIMER =
  "Restorative conversations happen at the child's pace. If the child is not ready, record that their decision was respected and when staff will gently revisit.";

export const REFLECTION_DISCLAIMER =
  "Reflection is about learning, not blame. ARIA's suggestions support the conversation — conclusions belong to staff and the manager.";

// ── Restorative conversation ───────────────────────────────────────────────────
export const RESTORATIVE_READINESS_CHECKS: string[] = [
  "Has the child had enough time to regulate?",
  "Is now the right time for a restorative conversation?",
  "Who is the best trusted adult to speak with the child?",
];

export const RESTORATIVE_QUESTIONS: { key: string; label: string }[] = [
  { key: "what_happened", label: "What happened?" },
  { key: "who_was_affected", label: "Who was affected?" },
  { key: "child_voice", label: "What was the child feeling and needing?" },
  { key: "what_helped", label: "What helped?" },
  { key: "what_made_it_worse", label: "What made things worse?" },
  { key: "repair_actions", label: "What repair is needed — and what could adults do differently next time?" },
];

export interface RestorativeConversationRecord {
  id: string;
  home_id: string;
  child_id: string;
  incident_session_id: string | null;
  completed_by_user_id: string;
  conversation_date: string;
  child_ready_to_engage: boolean;
  child_voice: string;
  what_happened: string;
  who_was_affected: string;
  what_helped: string;
  what_made_it_worse: string;
  repair_actions: string;
  follow_up_required: boolean;
  ai_summary: string | null;
  manager_review_required: boolean;
  created_at: string;
  updated_at: string;
}

export function buildRestorativeSummary(r: Pick<RestorativeConversationRecord,
  "child_ready_to_engage" | "what_happened" | "who_was_affected" | "child_voice" | "what_helped" | "what_made_it_worse" | "repair_actions" | "follow_up_required">,
  child_name: string,
): string {
  if (!r.child_ready_to_engage) {
    return [
      `${child_name} was offered a restorative conversation and was not ready to engage.`,
      "Staff respected this decision and will gently revisit when the child feels ready.",
      r.repair_actions ? `Planned next steps: ${r.repair_actions}` : "Staff will consider whether advocacy or a trusted adult would help.",
    ].join(" ");
  }
  const parts: string[] = [];
  if (r.what_happened) parts.push(`What happened: ${r.what_happened}`);
  if (r.who_was_affected) parts.push(`Who was affected: ${r.who_was_affected}`);
  if (r.child_voice) parts.push(`${child_name}'s voice: ${r.child_voice}`);
  if (r.what_helped) parts.push(`What helped: ${r.what_helped}`);
  if (r.what_made_it_worse) parts.push(`What made it worse: ${r.what_made_it_worse}`);
  if (r.repair_actions) parts.push(`Repair agreed: ${r.repair_actions}`);
  if (r.follow_up_required) parts.push("Key-work follow-up is planned.");
  return parts.join("\n");
}

export function restorativeManagerReview(r: Pick<RestorativeConversationRecord, "child_ready_to_engage" | "follow_up_required" | "what_made_it_worse">): boolean {
  // not ready, follow-up needed, or adult actions made things worse → manager should see it
  return !r.child_ready_to_engage || r.follow_up_required || !!r.what_made_it_worse.trim();
}

// ── Post-incident reflection ───────────────────────────────────────────────────
export const REFLECTION_QUESTIONS: { key: string; label: string }[] = [
  { key: "antecedents", label: "What was happening before the incident?" },
  { key: "early_warning_signs", label: "What were the early signs?" },
  { key: "staff_response", label: "What did staff do — and what went well?" },
  { key: "what_worked", label: "What helped the child regulate?" },
  { key: "what_did_not_work", label: "What escalated the situation or didn't help?" },
  { key: "child_needs_identified", label: "What might the child have been communicating or needing?" },
  { key: "environmental_factors", label: "Any environmental triggers (noise, space, time of day)?" },
];

// contributing-factor flags → deterministic, explainable follow-up suggestions
export const REFLECTION_FACTORS: { key: string; label: string; suggestion: string }[] = [
  { key: "staffing", label: "Staffing was a factor", suggestion: "Review staffing pattern for this time of day and raise at team meeting." },
  { key: "family_contact", label: "Family contact was a factor", suggestion: "Key-work session on family contact; review emotional preparation before and after calls." },
  { key: "peer_conflict", label: "Peer conflict was a factor", suggestion: "Plan restorative work between the young people and review group dynamics." },
  { key: "school_stress", label: "School stress was a factor", suggestion: "Liaise with education and consider after-school decompression time." },
  { key: "identity_trauma", label: "Identity, culture, shame, grief, trauma or rejection may be a factor", suggestion: "Bring to reflective supervision and consider therapeutic consultation — explore gently in key-work." },
];

export const REFLECTION_OUTCOMES: { key: string; label: string; suggestion: string }[] = [
  { key: "risk_assessment_update", label: "Risk assessment update needed", suggestion: "Update the risk assessment and circulate to the team." },
  { key: "placement_plan_update", label: "Placement plan update needed", suggestion: "Update the placement plan and notify the social worker." },
  { key: "keywork_session", label: "Key-work session needed", suggestion: "Book a key-work session with the child's trusted adult." },
  { key: "staff_supervision", label: "Staff supervision needed", suggestion: "Offer the staff involved a supervision or debrief conversation." },
  { key: "team_learning", label: "Team learning required", suggestion: "Add to the next team meeting as a learning theme." },
];

export interface PostIncidentReflectionRecord {
  id: string;
  home_id: string;
  child_id: string;
  incident_session_id: string | null;
  completed_by_user_id: string;
  antecedents: string;
  early_warning_signs: string;
  staff_response: string;
  what_worked: string;
  what_did_not_work: string;
  child_needs_identified: string;
  environmental_factors: string;
  factors: string[];            // REFLECTION_FACTORS keys
  outcomes: string[];           // REFLECTION_OUTCOMES keys
  follow_up_actions: string[];
  ai_reflective_summary: string | null;
  manager_review_required: boolean;
  created_at: string;
  updated_at: string;
}

export function deriveFollowUpActions(factors: string[], outcomes: string[]): string[] {
  const out: string[] = [];
  for (const f of REFLECTION_FACTORS) if (factors.includes(f.key)) out.push(f.suggestion);
  for (const o of REFLECTION_OUTCOMES) if (outcomes.includes(o.key)) out.push(o.suggestion);
  return [...new Set(out)];
}

export function reflectionManagerReview(outcomes: string[]): boolean {
  // statutory-plan or supervision implications → manager must see it
  return outcomes.some((o) => ["risk_assessment_update", "placement_plan_update", "staff_supervision"].includes(o));
}

export function buildReflectionSummary(r: Pick<PostIncidentReflectionRecord,
  "antecedents" | "early_warning_signs" | "staff_response" | "what_worked" | "what_did_not_work" | "child_needs_identified" | "environmental_factors" | "factors" | "outcomes">,
): string {
  const parts: string[] = [];
  if (r.antecedents) parts.push(`Before: ${r.antecedents}`);
  if (r.early_warning_signs) parts.push(`Early signs: ${r.early_warning_signs}`);
  if (r.staff_response) parts.push(`Staff response: ${r.staff_response}`);
  if (r.what_worked) parts.push(`What worked: ${r.what_worked}`);
  if (r.what_did_not_work) parts.push(`What didn't help: ${r.what_did_not_work}`);
  if (r.child_needs_identified) parts.push(`Possible need: ${r.child_needs_identified}`);
  if (r.environmental_factors) parts.push(`Environment: ${r.environmental_factors}`);
  const factorLabels = REFLECTION_FACTORS.filter((f) => r.factors.includes(f.key)).map((f) => f.label);
  if (factorLabels.length) parts.push(`Contributing factors: ${factorLabels.join("; ")}.`);
  const outcomeLabels = REFLECTION_OUTCOMES.filter((o) => r.outcomes.includes(o.key)).map((o) => o.label);
  if (outcomeLabels.length) parts.push(`Agreed outcomes: ${outcomeLabels.join("; ")}.`);
  return parts.join("\n");
}

// ── AI summary prompt (route-side; drafts only, staff accept/reject) ───────────
export const POST_INCIDENT_AI_SYSTEM_PROMPT =
  "You are ARIA, supporting residential childcare staff after an incident. Summarise the reflection or restorative conversation provided in 3–5 calm, factual, non-blaming sentences using only the facts given — never invent, never diagnose, never judge the child or staff. Frame behaviour as communication. End with one sentence on the agreed next steps. This is a draft for staff to review.";
