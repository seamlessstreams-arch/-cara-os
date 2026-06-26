// ══════════════════════════════════════════════════════════════════════════════
// CARA — DETERMINISTIC LEARNING FALLBACKS
//
// When the AI service is unavailable (e.g. exhausted credits), the /api/v1/cara
// learning modes would otherwise return parsed:null and the Learning Studio pages
// (flashcards, quizzes, workshops, curriculum, worksheets, guidance, sessions,
// safety plans, micro-learning, training-needs) would render an empty panel.
//
// Unlike evaluative judgements about a child, LEARNING content can be authored
// deterministically — so these return real, professionally-sound STARTER content
// on evergreen residential-childcare topics (trauma-informed practice, PACE,
// safeguarding, recording). Each object matches the exact shape the consuming
// page expects (mirrors the JSON contract in MODE_INSTRUCTIONS), and every array
// is non-empty so unguarded `.map()` in the pages renders real items.
//
// Staff adapt these to their home and current development needs — Cara provides
// the scaffold, the team makes it theirs.
// ══════════════════════════════════════════════════════════════════════════════

const STARTER_NOTE =
  "Cara's AI tailoring is unavailable in this environment, so this is a ready-to-use deterministic starter on a core topic. Adapt it to your team, your home and the individual child.";

function learningFlashcards() {
  return {
    set_title: "Trauma-informed care — core principles",
    pathway: "staff",
    topic: "Trauma-informed practice",
    introduction_note: STARTER_NOTE,
    cards: [
      { id: "c1", question: "What does 'trauma-informed' mean in practice?", answer: "Responding to behaviour as a communication of need, and prioritising safety, trust and choice rather than control or punishment.", hint: "Behaviour is a signal, not the problem itself.", difficulty: "easy", tags: ["trauma", "principles"] },
      { id: "c2", question: "What are the core principles of a trauma-informed approach?", answer: "Safety, trustworthiness, choice, collaboration and empowerment.", hint: "Five words.", difficulty: "medium", tags: ["principles"] },
      { id: "c3", question: "Why ask 'what happened to you?' instead of 'what's wrong with you?'", answer: "It shifts from blaming the child to understanding the experiences behind the behaviour.", hint: "Understanding, not blame.", difficulty: "medium", tags: ["language"] },
      { id: "c4", question: "What is the 'window of tolerance'?", answer: "The zone where a child can manage emotions and think clearly. Outside it they move into hyper-arousal (fight/flight) or hypo-arousal (shutdown).", hint: "A regulation zone.", difficulty: "hard", tags: ["regulation"] },
      { id: "c5", question: "How do you help a dysregulated child?", answer: "Stay calm and present, lower demands, offer co-regulation (your calm), and reflect together later once they're back in their window of tolerance.", hint: "Connect before you correct.", difficulty: "medium", tags: ["regulation", "pace"] },
    ],
    learning_objective: "Staff can describe the core principles of trauma-informed care and apply them on shift.",
    suggested_use: "Use in a team meeting or supervision: read a card, then discuss a real (anonymised) example from your home.",
    staff_guidance: "Deterministic starter from Cara — replace or add cards to match your team's current development needs.",
  };
}

function learningQuiz() {
  return {
    quiz_title: "Safeguarding essentials",
    pathway: "staff",
    topic: "Safeguarding in residential care",
    instructions: "Answer each question, then check your home's policy. This is a Cara starter quiz — align it to your procedures before use.",
    questions: [
      { id: "q1", question: "If a child discloses abuse, what should you do first?", type: "multiple_choice", options: ["Promise to keep it secret", "Listen, reassure, and report to the DSL without delay", "Investigate it yourself", "Wait until the next handover"], correct_answer: "Listen, reassure, and report to the DSL without delay", explanation: "Never promise secrecy or investigate yourself. Record the child's own words and inform the Designated Safeguarding Lead immediately.", marks: 1 },
      { id: "q2", question: "You should record a child's disclosure in their own words.", type: "true_false", options: ["True", "False"], correct_answer: "True", explanation: "Record verbatim where possible — do not paraphrase or interpret.", marks: 1 },
      { id: "q3", question: "What does 'contextual safeguarding' consider?", type: "multiple_choice", options: ["Only risks inside the home", "Risks in the wider environment — peers, school, online and community", "Only family risks", "Only historical risks"], correct_answer: "Risks in the wider environment — peers, school, online and community", explanation: "Harm can come from outside the home (exploitation, county lines, peer relationships).", marks: 1 },
      { id: "q4", question: "Who can you escalate to if a concern isn't being acted on?", type: "short_answer", options: null, correct_answer: "The DSL, the manager, the LADO, or directly to children's services / police if a child is at immediate risk.", explanation: "Know your escalation routes — never let a concern stall.", marks: 1 },
      { id: "q5", question: "A child going missing is a safeguarding concern.", type: "true_false", options: ["True", "False"], correct_answer: "True", explanation: "Missing episodes carry exploitation risk and require notifications and a Return Home Interview.", marks: 1 },
    ],
    total_marks: 5,
    pass_mark: 4,
    feedback_pass: "Well done — you've shown a solid grasp of safeguarding essentials.",
    feedback_fail: "Review your home's safeguarding policy and discuss the missed areas in supervision.",
    staff_guidance: "Deterministic starter from Cara — align every answer with your home's specific policies before use.",
  };
}

function learningWorkshopPlan() {
  return {
    workshop_title: "Building trusted relationships with PACE",
    pathway: "staff",
    learning_objectives: ["Understand the PACE approach (Playfulness, Acceptance, Curiosity, Empathy)", "Practise responding to behaviour as communication", "Plan one relational change to try on shift"],
    duration_minutes: 90,
    facilitator_notes: "Keep it experiential — use real, anonymised examples from your home. " + STARTER_NOTE,
    materials_needed: ["Flip chart or whiteboard", "Pens and sticky notes", "Printed PACE summary"],
    introduction: "Welcome the team and frame the session: in residential care, relationships are the intervention.",
    icebreaker: "In pairs, share one moment this week where a relationship helped a child feel safe.",
    main_content_sections: [
      { title: "What is PACE?", duration_minutes: 20, content: "Playfulness, Acceptance, Curiosity, Empathy — Dan Hughes' relational stance.", activity: "Match each PACE element to a real example.", facilitator_prompt: "Where do we already do this well?" },
      { title: "Behaviour as communication", duration_minutes: 25, content: "Every behaviour meets a need. Look beneath the behaviour.", activity: "Take a recent incident and ask 'what was this child communicating?'", facilitator_prompt: "What changes when we ask 'what happened to you?'" },
      { title: "Curiosity over consequence", duration_minutes: 20, content: "Wonder aloud with the child instead of reaching for sanctions.", activity: "Re-script a sanction conversation using curiosity.", facilitator_prompt: "What might get in the way of staying curious?" },
    ],
    group_activity: "As a team, choose one relational practice to commit to this month.",
    reflection_exercise: "Write one sentence: 'The child I find hardest is communicating ___.'",
    key_messages: ["Connection before correction", "Behaviour is communication", "Relationships are the intervention"],
    evaluation_questions: ["What will you do differently on your next shift?", "What support do you need to sustain it?"],
    follow_up_actions: ["Revisit commitments at the next team meeting", "Bring a PACE example to supervision"],
    safeguarding_considerations: "Keep examples anonymised. If a discussion raises a live concern, pause and follow safeguarding procedures.",
    additional_resources: ["Dan Hughes — Building the Bonds of Attachment", "Your home's PACE / DDP guidance"],
  };
}

function learningGuidanceNote() {
  return {
    title: "Recording with dignity and accuracy",
    pathway: "staff",
    purpose: "To help staff write care records that are factual, respectful, and useful to the child and the team.",
    key_definitions: [
      { term: "Factual recording", definition: "What you saw and heard, kept separate from your interpretation." },
      { term: "Strengths-based language", definition: "Describing what a child can do and is working towards, not only deficits." },
    ],
    main_content: "Good recording is written as if the child will read it one day — because they may. Record behaviour as communication, avoid labels, and be precise about what happened, when, and what you did. " + STARTER_NOTE,
    practical_examples: ["Instead of 'kicked off', write 'became distressed and shouted, then settled after a walk outside.'", "Instead of 'attention-seeking', write 'sought connection by coming to find a staff member.'"],
    legal_regulatory_context: "Children's Homes (England) Regulations 2015 (Reg 6, 13); the SCCIF; data protection — records must be accurate, respectful and retained appropriately.",
    what_good_looks_like: "Clear, dated, factual entries a child could read with dignity and a colleague could act on.",
    common_mistakes: ["Recording opinion as fact", "Using labels (manipulative, naughty)", "Vague entries ('the situation')", "Writing days later from memory"],
    reflection_questions: ["Would this entry feel respectful if the child read it at 18?", "Have I separated fact from interpretation?"],
    further_reading: ["Your home's recording policy", "Cara's 'Writing to the Child' guidance"],
    key_contacts: ["Your line manager or supervisor", "The Designated Safeguarding Lead"],
  };
}

function trainingNeedsAnalysis() {
  return {
    analysis_summary: "AI tailoring is unavailable, so this is a structured starter training-needs analysis. Validate each need against your home's incidents, supervision records and audit findings, then prioritise.",
    needs: [
      { need_type: "safeguarding", title: "Contextual safeguarding & exploitation awareness", description: "Recognising and responding to extra-familial harm (county lines, CSE, peer-on-peer abuse).", priority: "high", identified_by: "cara", affected_roles: ["Residential care workers", "Team leaders"], cara_evidence: "Review against the missing episodes and safeguarding concerns in your records.", recommended_approach: "Half-day workshop plus scenario discussion in a team meeting.", deadline_days: 60 },
      { need_type: "therapeutic", title: "De-escalation & trauma-informed responses", description: "Co-regulation and reducing reliance on physical intervention.", priority: "high", identified_by: "cara", affected_roles: ["All care staff"], cara_evidence: "Cross-check against restraint and incident frequency.", recommended_approach: "Refresher training paired with reflective practice.", deadline_days: 90 },
      { need_type: "recording", title: "Quality of recording", description: "Factual, strengths-based, child-readable records.", priority: "medium", identified_by: "cara", affected_roles: ["All staff"], cara_evidence: "Review a sample of recent daily logs and incident records.", recommended_approach: "Short micro-learning plus a supervision focus.", deadline_days: 45 },
    ],
    knowledge_gaps: [
      { gap_area: "Escalation routes and thresholds", severity: "significant", staff_roles: ["New starters", "Bank staff"] },
      { gap_area: "Online safety and digital risk", severity: "moderate", staff_roles: ["All care staff"] },
    ],
    overall_training_risk: "medium",
    immediate_actions: ["Validate these needs against your home's records", "Book the two high-priority items", "Add recording quality to the next supervision cycle"],
  };
}

function curriculumBuilder() {
  return {
    curriculum_title: "Residential care core induction curriculum",
    pathway: "staff",
    overview: "A structured induction pathway covering the essentials for new residential care staff. " + STARTER_NOTE,
    duration: "6 weeks (part-time, alongside shifts)",
    learning_outcomes: ["Apply trauma-informed and PACE-based practice", "Safeguard children and escalate concerns", "Record to a professional standard", "Understand core regulatory duties"],
    modules: [
      { module_number: 1, title: "Welcome & values", learning_objective: "Understand the home's ethos and the child's experience of care.", duration: "Week 1", content_type: "discussion", description: "Ethos, the child's journey, professional boundaries.", resources_needed: ["Statement of Purpose", "Children's guide"], assessment_method: "Reflective discussion in supervision" },
      { module_number: 2, title: "Safeguarding essentials", learning_objective: "Recognise, respond to and escalate concerns.", duration: "Week 2", content_type: "workshop", description: "Disclosures, contextual safeguarding, missing children, escalation routes.", resources_needed: ["Safeguarding policy"], assessment_method: "Scenario quiz" },
      { module_number: 3, title: "Trauma-informed practice & PACE", learning_objective: "Respond to behaviour as communication.", duration: "Week 3", content_type: "workshop", description: "ACEs, the window of tolerance, co-regulation, PACE.", resources_needed: ["PACE summary"], assessment_method: "Observed practice plus reflection" },
      { module_number: 4, title: "Recording & accountability", learning_objective: "Write factual, respectful records.", duration: "Week 4", content_type: "self_study", description: "Recording standards, writing to the child, data protection.", resources_needed: ["Recording policy"], assessment_method: "Recording sample review" },
      { module_number: 5, title: "Regulation & quality", learning_objective: "Understand the Children's Homes Regulations and the SCCIF.", duration: "Week 5", content_type: "discussion", description: "Quality standards, Regulation 44/45, Ofsted inspection.", resources_needed: ["Regulations summary"], assessment_method: "Knowledge check" },
      { module_number: 6, title: "Putting it together", learning_objective: "Integrate learning into practice.", duration: "Week 6", content_type: "assessment", description: "Reflective portfolio and supervision sign-off.", resources_needed: ["Induction workbook"], assessment_method: "Portfolio plus manager sign-off" },
    ],
    assessment_framework: "A mix of discussion, scenario quizzes, observed practice and a reflective portfolio, signed off in supervision.",
    completion_criteria: "All six modules completed with manager sign-off and the probation review passed.",
    staff_guidance: "Deterministic starter from Cara — map the modules to your mandatory training matrix and the Level 3 Diploma.",
    review_date: "Review 6 months after adoption.",
  };
}

function learningSessionPlan() {
  return {
    session_title: "1:1 keywork — checking in",
    pathway: "child",
    session_purpose: "A relaxed 1:1 to strengthen the relationship and hear how the young person is doing.",
    duration_minutes: 30,
    learning_outcomes: ["The young person feels heard", "Any worries are surfaced safely", "One small next step is agreed"],
    materials_needed: ["A comfortable, private space", "Drinks or snacks", "Optional: paper and pens"],
    staff_preparation: "Read recent records. Plan an activity the young person enjoys. Hold no agenda beyond connection. " + STARTER_NOTE,
    opening_activity: "Start with something easy and enjoyable — a walk, a game, or a drink together. Let them lead.",
    main_activities: [
      { title: "Check-in", duration_minutes: 10, description: "How has your week been, on a scale of 1-10? What's behind the number?", facilitator_notes: "Follow their lead; don't interrogate. Silences are fine." },
      { title: "Anything on your mind", duration_minutes: 10, description: "Is there anything you'd like help with, or anything worrying you?", facilitator_notes: "If a safeguarding concern emerges, follow procedures and record the child's own words." },
      { title: "Looking ahead", duration_minutes: 5, description: "Is there something you're looking forward to, or something we could plan together?", facilitator_notes: "Build hope and a sense of agency." },
    ],
    closing_activity: "Summarise what you heard, agree one small next step, and thank them for talking.",
    reflection_prompts: ["What did I learn about how this young person is feeling?", "What will I follow up?"],
    follow_up_actions: ["Record the session in the child's own words", "Action the agreed next step", "Share relevant information with the team within confidentiality boundaries"],
    safeguarding_considerations: "If the young person discloses harm, stay calm, reassure, do not promise secrecy, and report to the DSL.",
    differentiation_notes: "Adapt the pace, language and activity to the young person's age, communication style and needs.",
  };
}

function learningWorksheet() {
  return {
    worksheet_title: "My safe people and places",
    pathway: "child",
    topic: "Safety and trusted relationships",
    instructions: "Take your time — there are no wrong answers. A trusted adult can help you fill this in if you'd like.",
    sections: [
      { section_title: "My safe people", description: "The people who help you feel safe.", task: "Write or draw the people you trust and can go to.", prompt_questions: ["Who makes you feel safe?", "How do they help?", "How could you reach them?"], space_for_response: true },
      { section_title: "My safe places", description: "Where you feel calm.", task: "List or draw the places where you feel safe and calm.", prompt_questions: ["Where do you feel most relaxed?", "What makes that place feel safe?"], space_for_response: true },
      { section_title: "What helps me", description: "Things that help when things feel hard.", task: "Note what helps you feel better when you're upset.", prompt_questions: ["What calms you down?", "What would you like staff to do when you're upset?"], space_for_response: true },
    ],
    reflection_questions: ["What did you notice doing this?", "Is there anything you'd like to add or change?"],
    key_messages: ["You deserve to feel safe", "Asking for help is a strength", "The adults here want to help you"],
    staff_notes: "Use as a relational tool, not a test. Go at the child's pace. " + STARTER_NOTE,
    accessibility_notes: "Offer to scribe, use pictures or symbols, or complete it verbally. Keep language simple and warm.",
  };
}

function learningSafetyPlan() {
  return {
    plan_title: "My safety plan",
    pathway: "child",
    purpose: "A plan we make together so you know what helps and who to go to when things feel hard.",
    warning_signs: ["Feeling tense or angry", "Wanting to be alone or to leave", "Racing thoughts or trouble sleeping"],
    coping_strategies: [
      { strategy: "Take slow breaths or go for a walk", when_to_use: "When you first notice you're getting wound up." },
      { strategy: "Listen to music or do something with your hands", when_to_use: "When you need to settle." },
      { strategy: "Talk to a trusted adult", when_to_use: "When it feels too big to manage alone." },
    ],
    people_who_can_help: [
      { name_or_role: "Your key worker", contact_or_availability: "On shift — ask any staff member to find them." },
      { name_or_role: "Staff on duty", contact_or_availability: "There is always someone here, day and night." },
    ],
    safe_places: ["Your room", "A quiet space in the home", "Outside in the garden"],
    what_to_do_in_crisis: "Find a staff member straight away. If you're not safe and can't find staff, call for help. You are never in trouble for asking.",
    things_to_remember: ["This feeling will pass", "You are not alone", "Staff are here to help, not to judge"],
    review_date_suggestion: "Review this plan together in about a month, or sooner if things change.",
    staff_guidance: "Co-produce this WITH the child — their words, their ideas. " + STARTER_NOTE + " Never impose it; store it where the child agrees and the team can see it.",
    child_friendly_language_notes: "Keep it warm and simple. Use the child's own words and examples.",
  };
}

function learningMicroLearning() {
  return {
    title: "De-escalation in 5 minutes",
    pathway: "staff",
    topic: "Calming a tense moment",
    hook: "When a child is dysregulated, your calm is the intervention.",
    key_point_1: "Lower the temperature: soften your voice, slow down, give space, and drop unnecessary demands.",
    key_point_2: "Connect before you correct: acknowledge the feeling ('I can see this is really hard') before any expectation.",
    key_point_3: "Co-regulate: stay regulated yourself — your nervous system helps settle theirs. Reflect and repair later.",
    quick_activity: "Think of a recent tense moment. Which of the three points would have helped most?",
    one_thing_to_do: "On your next shift, when tension rises, pause and lower one demand before saying anything else.",
    reflection_question: "What helps YOU stay calm when a child is escalating?",
    further_learning: "Your home's positive behaviour support / de-escalation guidance.",
    estimated_minutes: 5,
  };
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

const BUILDERS: Record<string, () => Record<string, unknown>> = {
  learning_flashcards: learningFlashcards,
  learning_quiz: learningQuiz,
  learning_workshop_plan: learningWorkshopPlan,
  learning_guidance_note: learningGuidanceNote,
  training_needs_analysis: trainingNeedsAnalysis,
  curriculum_builder: curriculumBuilder,
  learning_session_plan: learningSessionPlan,
  learning_worksheet: learningWorksheet,
  learning_safety_plan: learningSafetyPlan,
  learning_micro_learning: learningMicroLearning,
};

/**
 * Returns deterministic learning content for a supported learning mode, or null
 * if the mode has no deterministic builder. The shape matches each mode's JSON
 * contract so the consuming Learning Studio page renders it without changes.
 */
export function buildDeterministicLearning(mode: string): Record<string, unknown> | null {
  const builder = BUILDERS[mode];
  return builder ? builder() : null;
}

/** The learning modes that have a deterministic fallback (for tests/inspection). */
export const DETERMINISTIC_LEARNING_MODES = Object.keys(BUILDERS);
