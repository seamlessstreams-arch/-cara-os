// ══════════════════════════════════════════════════════════════════════════════
// CARA — DETERMINISTIC INTELLIGENCE FALLBACKS
//
// When the AI service is unavailable (e.g. exhausted credits), several Cara
// Intelligence Module panels would return parsed:null and render an empty panel.
//
// IMPORTANT SAFETY DISTINCTION (different from the Learning fallbacks):
//   - keywork_session_plan is GENERIC good practice → real, useful content.
//   - situation_review / generate_oversight / interactive_session_summary are
//     about a SPECIFIC record, child or session. Cara must NOT fabricate analysis
//     about a real child. These return an HONEST, shape-matched scaffold (the
//     practitioner completes it) using the prompts' own "not_identified" /
//     "insufficient_information" enum values — never invented conclusions.
//   - compute_experience_snapshot / compute_home_climate are scoring modes. The
//     prompts themselves default to a neutral score when evidence is missing
//     (50 / 70). The fallback returns those neutral defaults with a narrative
//     that is explicit they are placeholders, not an assessment.
//
// Every object matches the exact shape the consuming page expects, and arrays the
// pages map over are present (empty is safe; `.map()` on [] renders nothing).
// ══════════════════════════════════════════════════════════════════════════════

// ── Generic, safe-to-template: a real PACE/ARC key work session plan ──────────
function keyworkSessionPlan() {
  return {
    session_title: "Key work check-in — connection and safety",
    reason_for_session: "A planned key work session to strengthen the relationship and check how the young person is doing.",
    aim: "Build trust, hear the young person's voice, and agree one small, supported next step.",
    desired_outcome: "The young person feels listened to and safe, and any worries are surfaced.",
    why_this_matters: "Consistent, attuned key work is one of the strongest protective factors in residential care.",
    preparation_for_staff: "Read recent records. Choose a relaxed setting and an activity they enjoy. Hold no agenda beyond connection. (Cara deterministic starter — adapt to the individual child.)",
    emotional_safety_considerations: "Let the young person set the pace. Offer breaks. Don't push disclosure — presence matters more than content.",
    opening_script: "I just wanted some time with you today — no agenda, just to see how you're doing. We can do something you like while we chat.",
    warm_up_activity: "Do something low-pressure together — a walk, a game, or a drink and a snack.",
    main_discussion_questions: [
      "How has your week been, on a scale of 1-10? What's behind that number?",
      "What's going well for you right now?",
      "Is there anything worrying you, or anything you'd like help with?",
      "What would make things feel a bit better here?",
    ],
    reflective_activity: "Together, notice one strength the young person has shown recently, and name it.",
    practical_activity: "Plan one small thing to look forward to before the next session.",
    child_friendly_explanation: "Key work time is just for you — a chance to talk, be heard, and sort anything that's on your mind.",
    staff_prompts: ["Stay curious, not corrective.", "Reflect feelings back ('that sounds really hard').", "Allow silences."],
    pace_informed_responses: "Lead with Playfulness, Acceptance, Curiosity and Empathy — accept the feeling before any expectation.",
    arc_attachment: "Be a consistent, reliable presence — predictability builds attachment security.",
    arc_regulation: "Co-regulate: model calm, and help the young person notice and name feelings.",
    arc_competency: "Notice and build on what the young person can do; celebrate small wins.",
    safeguarding_link: "If the young person discloses harm, stay calm, reassure, don't promise secrecy, and report to the DSL.",
    rights_and_responsibilities: "Remind the young person of their rights — to be heard, to be safe, and to be involved in decisions about them.",
    closing_reflection: "Summarise what you heard, thank them, and confirm when you'll next meet.",
    follow_up_actions: ["Record the session in the young person's own words", "Action the agreed next step", "Share relevant information with the team within confidentiality boundaries"],
    evidence_to_record: "The young person's voice, their wishes and feelings, and any actions agreed.",
    plan_updates_required: "Update the care plan or risk assessment if anything new emerged.",
    manager_oversight_prompt: "Did the session capture the child's voice and lead to a clear next step?",
  };
}

const SITUATION_NOTE =
  "AI analysis is unavailable in this environment, so Cara cannot analyse this specific situation. Complete each field from what you know — keep curiosity before certainty, and frame behaviour as communication of unmet need. If unsure about safeguarding, consult the DSL.";

// ── Record-specific → HONEST scaffold, never fabricated analysis ──────────────
function situationReview() {
  return {
    what_happened: "[Describe what happened, factually.]",
    immediate_concern: "[What is the immediate concern?]",
    child_communication_through_behaviour: "[What might the child be communicating through this behaviour?]",
    known_triggers: "[What triggers are known for this child?]",
    protective_factors: "[What protective factors are present?]",
    current_risks: "[What are the current risks?]",
    emotional_need_underneath: "[What unmet emotional need might sit underneath?]",
    safeguarding_concern: "[Any safeguarding concern? If unsure, consult the DSL.]",
    child_voice_tells_us: "[What does the child's voice tell us?]",
    team_understanding: "[What is the team's shared understanding?]",
    action_now: "[Action needed now]",
    action_24h: "[Action within 24 hours]",
    action_72h: "[Action within 72 hours]",
    management_oversight_needed: true,
    escalation_needed: false,
    follow_up_key_work: "[Follow-up key work]",
    resources_needed: "[Resources needed]",
    risk_level: "not_identified",
    confidence_level: "insufficient_information",
    safeguarding_flags: [] as string[],
    protective_factors_list: ["[Add the protective factors you can identify]"],
    emotional_needs_list: ["[Add the emotional needs you can identify]"],
    suggested_actions: [
      { title: "Complete this situation analysis from what you know", why_this_matters: SITUATION_NOTE, priority: "high", deadline_days: 1, assigned_role: "Key worker / manager" },
    ],
  };
}

function generateOversight() {
  const note = "AI is unavailable, so Cara cannot author oversight for this specific record. Use the prompts below to complete a reflective, evidence-based management oversight comment.";
  return {
    summary: "[Summarise the record and the staff response.]",
    quality_of_staff_response: "[How well did staff respond? Evidence it.]",
    child_emotional_presentation: "[How was the child presenting emotionally?]",
    child_voice: "[What does the child's voice tell us here?]",
    risk_analysis: "[Analyse the risks.]",
    safeguarding_consideration: "[Any safeguarding considerations?]",
    contextual_factors: "[Relevant contextual factors.]",
    what_went_well: "[What went well?]",
    what_could_be_improved: "[What could be improved?]",
    follow_up_actions: ["Complete this oversight from the record", "Confirm any actions and who owns them"],
    learning_for_staff: "[Learning for the staff team.]",
    management_decision: "[Your management decision.]",
    plans_to_update: ["[List any plans to update]"],
    professionals_to_inform: ["[List professionals to inform, if any]"],
    is_ofsted_ready: false,
    full_oversight_text: note,
  };
}

function interactiveSessionSummary() {
  return {
    child_friendly_summary: "Thanks for spending this time today. Your key worker will write up what you shared.",
    professional_summary: "AI summary is unavailable in this environment. Please complete this summary from the session responses recorded above.",
    child_voice_section: "[Record the child's own words from the session.]",
    staff_reflection_prompt: "What did you notice about how this young person was feeling, and what will you follow up?",
    follow_up_actions: ["Write up the session from the recorded responses", "Action anything the young person raised"],
    plan_updates_suggested: [] as string[],
    manager_oversight_needed: false,
    safeguarding_flags: [] as string[],
  };
}

// ── Scoring modes → neutral defaults (as the prompts themselves specify) ──────
function computeExperienceSnapshot() {
  const s = 50;
  return {
    safety_score: s, belonging_score: s, regulation_score: s, engagement_score: s,
    relationships_score: s, participation_score: s, health_score: s, education_score: s,
    stability_score: s, achievement_score: s, overall_score: s,
    narrative: "AI wellbeing scoring is unavailable in this environment. These are neutral placeholders (50/100), not an assessment — review this child's records and recent key work directly for an accurate picture.",
    trend: "mixed",
    strengths: ["Review the child's recent records to identify current strengths"],
    concerns: ["Deterministic scoring unavailable — assess from the records and recent key work"],
  };
}

function computeHomeClimate() {
  const s = 70;
  return {
    staffing_consistency_score: s, incident_frequency_score: s, missing_episode_score: s,
    complaints_score: s, safeguarding_score: s, peer_tension_score: s,
    training_compliance_score: s, maintenance_score: s, overall_climate_score: s,
    narrative: "AI climate analysis is unavailable in this environment. These are neutral placeholder scores (70/100), not an assessment — use the home's live intelligence dashboards (incidents, safeguarding, staffing, complaints) for the real picture.",
    hotspot_times: [] as string[],
    risk_flags: [] as string[],
  };
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

const BUILDERS: Record<string, () => Record<string, unknown>> = {
  keywork_session_plan: keyworkSessionPlan,
  situation_review: situationReview,
  generate_oversight: generateOversight,
  interactive_session_summary: interactiveSessionSummary,
  compute_experience_snapshot: computeExperienceSnapshot,
  compute_home_climate: computeHomeClimate,
};

/**
 * Returns deterministic intelligence-panel content for a supported mode, or null
 * if the mode has no deterministic builder. The shape matches each mode's JSON
 * contract so the consuming page renders it without changes. Record/child-specific
 * modes return an honest scaffold (never fabricated analysis); scoring modes return
 * neutral defaults with an explicit placeholder narrative.
 */
export function buildDeterministicIntelligence(mode: string): Record<string, unknown> | null {
  const builder = BUILDERS[mode];
  return builder ? builder() : null;
}

/** Intelligence modes that have a deterministic fallback (for tests/inspection). */
export const DETERMINISTIC_INTELLIGENCE_MODES = Object.keys(BUILDERS);
