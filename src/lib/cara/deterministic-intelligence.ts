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

// ── Practice bank → generic evidence-based "what works" (safe to template) ────
function practiceBank() {
  return {
    what_is_working: [
      "Consistent, attuned relationships with key staff — predictability builds safety",
      "Co-regulation: a calm adult helping the young person settle before problem-solving",
      "Clear, kind boundaries held warmly rather than punitively",
    ],
    suggested_approaches: [
      { approach: "PACE stance (Playfulness, Acceptance, Curiosity, Empathy)", rationale: "Helps a child feel understood rather than judged.", how_to_try: "Lead with curiosity about the feeling beneath the behaviour before any expectation.", expected_benefit: "Reduced escalation and a stronger relationship." },
      { approach: "Connection before correction", rationale: "A dysregulated child can't access reasoning; regulate first.", how_to_try: "Acknowledge the feeling, lower demands, offer presence; reflect and repair later.", expected_benefit: "Faster de-escalation and less rupture." },
      { approach: "Strengths-based key work (ARC competency)", rationale: "Noticing what a child can do builds self-worth.", how_to_try: "Name one genuine strength each shift; plan around their interests.", expected_benefit: "Improved engagement and self-esteem." },
    ],
    note: "AI tailoring is unavailable, so these are evidence-based starting points from trauma-informed and relational practice. Adapt them to this young person using what you know from their records and key work.",
  };
}

const LIVERS_NOTE =
  "AI is unavailable, so Cara cannot analyse this child. This is the L.I.V.E.R.S. framework structure for you to complete from the child's records — never generalise; ground every statement in evidence.";

// ── L.I.V.E.R.S. → HONEST framework scaffold (the prompt forbids generic output,
//    so we provide the structure to complete, never a fabricated analysis) ─────
function liversAnalysis() {
  return {
    lived_experience_summary: "[L — Lived Experience: what is it actually like to be this child every day? What do they communicate through behaviour; what do they fear, protect, avoid, need?]",
    immediate_cumulative_risk: "[I — Immediate and cumulative risk: current harm, pattern of escalation, chronic vs acute, risk at worst moments.]",
    risk_pattern: "[Describe the risk pattern over time.]",
    viability_of_change: "[V — Viability of change: is change achievable now? What barriers exist? What has been tried?]",
    viability_rating: "moderate",
    environment_system_forces: "[E — Environment and system forces: staff consistency, family, education, peers, online.]",
    relational_psychological_drivers: "[R — Relational and psychological drivers: trauma, attachment, the function the behaviour serves, the unmet need beneath it.]",
    sustainability_independence_safety: "[S — Sustainability and independence of safety: can this child be safe without professionals present? What must be strengthened?]",
    sustainability_rating: "moderate",
    cara_summary: LIVERS_NOTE,
    cara_confidence: "insufficient_information",
    recommended_intervention_type: "[Determine from the completed analysis.]",
    escalation_required: false,
    escalation_actions: ["Complete this L.I.V.E.R.S. analysis from the child's records", "Review the completed analysis with a manager"],
    management_oversight: "A manager should review the completed analysis.",
  };
}

function liversIntervention() {
  return {
    title: "Trauma-informed key work session (starter)",
    session_type: "key_work_session",
    reason_for_session: "A planned, relationship-focused session to check in and strengthen safety. Adapt to this child's L.I.V.E.R.S. analysis.",
    aim: "Build trust, hear the child's voice, and support one small step.",
    staff_preparation: "Read recent records. Choose a calm setting and an activity the child enjoys. (Cara deterministic starter — AI tailoring is unavailable; adapt to the individual.)",
    emotional_safety_notes: "Let the child set the pace; offer breaks; presence over content. Don't push disclosure.",
    pace_opening_script: "I just wanted some time with you — no agenda, just to see how you're doing.",
    session_steps: [
      { step_number: 1, title: "Warm-up", duration_minutes: 5, description: "Do something low-pressure together.", facilitator_prompt: "Let the child lead.", child_activity: "Choose an activity (walk, game, drawing)." },
      { step_number: 2, title: "Check-in", duration_minutes: 10, description: "How are things, on a scale of 1-10?", facilitator_prompt: "Stay curious; reflect feelings.", child_activity: "Share how the week has been." },
      { step_number: 3, title: "What would help", duration_minutes: 10, description: "Explore one worry and one wish.", facilitator_prompt: "What would make things a bit better?", child_activity: "Name something they'd like." },
      { step_number: 4, title: "Close", duration_minutes: 5, description: "Summarise, agree a next step, end positively.", facilitator_prompt: "Thank them; confirm the next session.", child_activity: "Agree one small step." },
    ],
    child_friendly_version: "This is your time — to talk, be heard, and sort anything that's on your mind.",
    reflective_questions_child: ["What helps you feel safe here?", "What's one thing you'd change?"],
    reflective_questions_staff: ["What did I learn about how this child feels?", "What will I follow up?"],
    follow_up_actions: ["Record the session in the child's own words", "Action the agreed step"],
    management_oversight_note: "Confirm the session captured the child's voice and led to a clear next step.",
  };
}

function liversEscalation() {
  return {
    escalation_required: false,
    escalation_level: "internal_oversight",
    escalation_rationale: "AI escalation review is unavailable in this environment, so Cara has NOT made an escalation decision. A manager must review this child's L.I.V.E.R.S. analysis and current risk directly and decide. Defaulting to internal management oversight — do not treat the absence of an AI flag as 'no risk'.",
    escalation_actions: ["A manager reviews the child's risk and L.I.V.E.R.S. analysis", "Escalate externally if safeguarding thresholds are met"],
    management_oversight_required: true,
    management_oversight_note: "Manager to review and decide on escalation.",
    safeguarding_referral_required: false,
    safeguarding_rationale: "Not assessed by AI — a practitioner must assess against safeguarding thresholds.",
    review_timeframe: "As soon as possible",
  };
}

// ── Oversight radar → the page expects parsed to be an ARRAY of gap items.
//    Honest single "blue" (reflective) item — Cara couldn't scan, review manually.
function checkMissingEvidence() {
  return [
    {
      id: "radar_manual",
      category: "Oversight",
      issue: "Deterministic oversight scan unavailable",
      why_it_matters: "AI is unavailable in this environment, so Cara couldn't scan for missing evidence. An empty result does NOT mean there are no gaps — review the child's records manually against your oversight checklist.",
      suggested_action: "Complete a manual oversight review of this child's records (daily logs, key work, plans, safeguarding, statutory reviews).",
      regulation: "Children's Homes Regulations 2015 — Reg 13 (leadership and management)",
      severity: "blue",
      child_id: "",
      record_type: "",
      record_id: "",
      is_reviewed: false,
    },
  ];
}

// ── Document modes → honest "couldn't auto-extract; review/enter manually" ────
function documentClassify() {
  return {
    document_type: "Unknown — manual review needed",
    confidence: 0,
    suggested_module: "/documents",
    suggested_child_id: null,
    suggested_form_type: "",
    suggested_tags: [] as string[],
    suggested_confidentiality: "restricted",
    key_facts: [] as string[],
    key_dates: [] as string[],
    key_people: [] as string[],
    risks_identified: [] as string[],
    actions_identified: [] as string[],
    child_voice_present: false,
    safeguarding_indicators: [] as string[],
    missing_information: ["AI extraction unavailable — review the document manually"],
    recommended_placement: "Review and file manually",
    recommended_linkages: [] as Array<{ type: string; description: string }>,
    cara_summary: "AI document analysis is unavailable in this environment, so Cara couldn't classify or extract from this document. Please review it and file it manually.",
  };
}

function documentToForm() {
  const fields = {
    date: null, time: null, location: null, description: null, immediate_action: null,
    young_person_name: null, reported_by: null, severity: null, type: null,
  };
  return {
    form_type: "unknown",
    form_title: "Manual entry required",
    fields, // the document-wizard reads formResult.fields …
    extracted_fields: fields, // … the prompt names it extracted_fields — provide both
    missing_fields: ["AI extraction unavailable — complete all fields manually"],
    cara_notes: "AI extraction is unavailable in this environment, so Cara couldn't auto-fill this form. Please complete it manually from the document.",
    confidence: 0,
  };
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

const BUILDERS: Record<string, () => unknown> = {
  keywork_session_plan: keyworkSessionPlan,
  situation_review: situationReview,
  generate_oversight: generateOversight,
  interactive_session_summary: interactiveSessionSummary,
  compute_experience_snapshot: computeExperienceSnapshot,
  compute_home_climate: computeHomeClimate,
  practice_bank: practiceBank,
  livers_analysis: liversAnalysis,
  livers_intervention: liversIntervention,
  livers_escalation: liversEscalation,
  check_missing_evidence: checkMissingEvidence,
  document_classify: documentClassify,
  document_to_form: documentToForm,
};

/**
 * Returns deterministic intelligence-panel content for a supported mode, or null
 * if the mode has no deterministic builder. The shape matches each mode's JSON
 * contract so the consuming page renders it without changes. Record/child-specific
 * modes return an honest scaffold (never fabricated analysis); scoring modes return
 * neutral defaults with an explicit placeholder narrative.
 */
export function buildDeterministicIntelligence(mode: string): unknown {
  const builder = BUILDERS[mode];
  return builder ? builder() : null;
}

/** Intelligence modes that have a deterministic fallback (for tests/inspection). */
export const DETERMINISTIC_INTELLIGENCE_MODES = Object.keys(BUILDERS);
