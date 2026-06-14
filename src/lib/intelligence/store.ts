// ══════════════════════════════════════════════════════════════════════════════
// CARA — INTELLIGENCE LAYER IN-MEMORY STORE
//
// Mutable in-memory collections for all intelligence entities.
// Seeded with realistic Chamberlain House demo data.
//
// TO CONNECT SUPABASE: replace each collection's read/write methods with
// Supabase queries. The API route signatures stay identical.
// ══════════════════════════════════════════════════════════════════════════════

import { generateId } from "@/lib/utils";
import type {
  ChildExperienceSnapshot,
  PatternAlert,
  Intervention,
  RelationalRecord,
  PracticeBankEntry,
  VoiceRecord,
  HomeClimateSnapshot,
  DocumentIntelligenceJob,
  ActionOutcome,
  CaraAssessment,
  CaraOversight,
  KeyWorkSession,
  ChildResource,
  InteractiveSession,
  CaraAuditEntry,
  CaraRecommendation,
  CaraSafeguardingFlag,
  // RI Command Centre
  RiChallengeLog,
  RiGovernanceReport,
  RiReg45Evidence,
  RiAlert,
  Reg44Visit,
  PIDebrief,
  Complaint,
  CarePlan,
  ContactArrangement,
  ContactLog,
  ContactPerson,
  // Learning Studio
  LearningProject,
  GeneratedResource,
  TrainingNeed,
  KnowledgeGap,
  ResourceLibraryEntry,
  // L.I.V.E.R.S.
  LiversAnalysis,
  InterventionSession,
  LiversOutcomeRecord,
} from "@/types/extended";

// ── Mutable collections ───────────────────────────────────────────────────────

const intelligenceStore = {
  childExperience: [] as ChildExperienceSnapshot[],
  patternAlerts: [] as PatternAlert[],
  interventions: [] as Intervention[],
  relationalRecords: [] as RelationalRecord[],
  practiceBank: [] as PracticeBankEntry[],
  voiceRecords: [] as VoiceRecord[],
  homeClimate: [] as HomeClimateSnapshot[],
  docJobs: [] as DocumentIntelligenceJob[],
  actionOutcomes: [] as ActionOutcome[],
  // Cara Intelligence module
  caraAssessments: [] as CaraAssessment[],
  caraOversight: [] as CaraOversight[],
  keyWorkSessions: [] as KeyWorkSession[],
  childResources: [] as ChildResource[],
  interactiveSessions: [] as InteractiveSession[],
  caraAuditTrail: [] as CaraAuditEntry[],
  caraRecommendations: [] as CaraRecommendation[],
  caraSafeguardingFlags: [] as CaraSafeguardingFlag[],
  // RI Command Centre
  riChallengeLogs: [] as RiChallengeLog[],
  riGovernanceReports: [] as RiGovernanceReport[],
  riReg45Evidence: [] as RiReg45Evidence[],
  riAlerts: [] as RiAlert[],
  reg44Visits: [] as Reg44Visit[],
  // Care — PI Debriefs
  piDebriefs: [] as PIDebrief[],
  // Care — Complaints
  complaints: [] as Complaint[],
  // Care — Care Plans
  carePlans: [] as CarePlan[],
  // Care — Family Contact
  contactPersons: [] as ContactPerson[],
  contactArrangements: [] as ContactArrangement[],
  contactLogs: [] as ContactLog[],
  // Learning Studio
  learningProjects: [] as LearningProject[],
  generatedResources: [] as GeneratedResource[],
  trainingNeeds: [] as TrainingNeed[],
  knowledgeGaps: [] as KnowledgeGap[],
  resourceLibrary: [] as ResourceLibraryEntry[],
  // L.I.V.E.R.S. Intervention Intelligence
  liversAnalyses: [] as LiversAnalysis[],
  interventionSessions: [] as InterventionSession[],
  interventionOutcomes: [] as LiversOutcomeRecord[],
};

// ── Seed: Child Experience Snapshots ─────────────────────────────────────────

intelligenceStore.childExperience = [
  // Casey — week 1 (baseline)
  {
    id: "ces_jas_001",
    home_id: "home_oak",
    child_id: "yp_casey",
    period_start: "2026-03-30",
    period_end: "2026-04-05",
    safety_score: 72,
    belonging_score: 61,
    regulation_score: 58,
    engagement_score: 65,
    relationships_score: 70,
    participation_score: 55,
    health_score: 78,
    education_score: 62,
    stability_score: 68,
    achievement_score: 60,
    overall_score: 65,
    score_delta: null,
    narrative:
      "Casey's first full week at Chamberlain House. She settled cautiously — engaging with staff on her own terms and showing early signs of trust with her key worker. Education attendance was 3 out of 5 days, with one refusal linked to anxiety about peers. Health is stable. No major regulation difficulties, though she required two co-regulation episodes. Overall a cautious but positive start.",
    evidence_refs: [
      { type: "daily_log", id: "log_jas_001", date: "2026-04-01", excerpt: "Joined staff in the kitchen unprompted to help with dinner", significance: "belonging indicator" },
      { type: "incident", id: "inc_jas_001", date: "2026-04-03", excerpt: "Distressed by phone call from mother — co-regulation successful", significance: "regulation capacity noted" },
    ],
    computed_by: "cara",
    reviewed_by: "staff_darren",
    created_at: "2026-04-06T07:00:00Z",
  },
  // Casey — week 2 (improvement)
  {
    id: "ces_jas_002",
    home_id: "home_oak",
    child_id: "yp_casey",
    period_start: "2026-04-06",
    period_end: "2026-04-12",
    safety_score: 76,
    belonging_score: 68,
    regulation_score: 63,
    engagement_score: 71,
    relationships_score: 75,
    participation_score: 62,
    health_score: 80,
    education_score: 70,
    stability_score: 72,
    achievement_score: 66,
    overall_score: 70,
    score_delta: 5,
    narrative:
      "Casey showed meaningful progress this week. Full education attendance for the first time since placement. She initiated conversation with her key worker about her placement goals and expressed that she feels 'more settled here than anywhere'. One regulation difficulty on Wednesday evening linked to contact, but she self-managed with breathing strategies within 15 minutes — a significant step forward.",
    evidence_refs: [
      { type: "daily_log", id: "log_jas_010", date: "2026-04-09", excerpt: "Casey said 'I actually like it here' to key worker during evening 1:1", significance: "belonging — direct voice evidence" },
      { type: "voice_record", id: "vrc_jas_001", date: "2026-04-10", excerpt: "Wants to start a creative writing club at school", significance: "education engagement and aspirations" },
    ],
    computed_by: "cara",
    reviewed_by: null,
    created_at: "2026-04-13T07:00:00Z",
  },
  // Alex — week 1
  {
    id: "ces_mar_001",
    home_id: "home_oak",
    child_id: "yp_alex",
    period_start: "2026-03-30",
    period_end: "2026-04-05",
    safety_score: 55,
    belonging_score: 48,
    regulation_score: 40,
    engagement_score: 52,
    relationships_score: 45,
    participation_score: 38,
    health_score: 60,
    education_score: 35,
    stability_score: 50,
    achievement_score: 42,
    overall_score: 47,
    score_delta: null,
    narrative:
      "Alex is in the early stages of a complex placement. Regulation difficulties are prominent — three significant dysregulation episodes this week, each linked to perceived rejection or unpredictability. Education attendance was one partial day. He is not yet engaging with his key worker and declines most planned activities. The focus must be on safety and consistent, non-demanding presence. CAMHS assessment is pending.",
    evidence_refs: [
      { type: "incident", id: "inc_mar_001", date: "2026-04-02", excerpt: "Alex left the home for 2 hours without permission following staff redirect", significance: "regulation and boundary difficulties" },
      { type: "daily_log", id: "log_mar_003", date: "2026-04-04", excerpt: "Accepted hot chocolate from Lackson at 22:30 — first positive contact", significance: "early trust indicator" },
    ],
    computed_by: "cara",
    reviewed_by: "staff_darren",
    created_at: "2026-04-06T07:00:00Z",
  },
  // Alex — week 2 (slight improvement)
  {
    id: "ces_mar_002",
    home_id: "home_oak",
    child_id: "yp_alex",
    period_start: "2026-04-06",
    period_end: "2026-04-12",
    safety_score: 58,
    belonging_score: 52,
    regulation_score: 46,
    engagement_score: 55,
    relationships_score: 50,
    participation_score: 44,
    health_score: 62,
    education_score: 42,
    stability_score: 54,
    achievement_score: 46,
    overall_score: 51,
    score_delta: 4,
    narrative:
      "Marginal but real progress. Alex attended education twice and engaged briefly with his key worker during a car journey to the shops. He still struggles significantly with boundaries and perceived rejection. One peer conflict arose which required staff mediation. However, his regulation window appears to be widening slightly — he is accepting verbal co-regulation before reaching full dysregulation on more occasions.",
    evidence_refs: [
      { type: "daily_log", id: "log_mar_015", date: "2026-04-11", excerpt: "Alex helped Lackson wash the car — talked about his old dog. First sustained 1:1 conversation.", significance: "relational progress" },
    ],
    computed_by: "cara",
    reviewed_by: null,
    created_at: "2026-04-13T07:00:00Z",
  },
  // Jordan — week 2 (stable, high-functioning)
  {
    id: "ces_len_001",
    home_id: "home_oak",
    child_id: "yp_jordan",
    period_start: "2026-04-06",
    period_end: "2026-04-12",
    safety_score: 85,
    belonging_score: 82,
    regulation_score: 80,
    engagement_score: 88,
    relationships_score: 84,
    participation_score: 79,
    health_score: 86,
    education_score: 90,
    stability_score: 83,
    achievement_score: 85,
    overall_score: 84,
    score_delta: 2,
    narrative:
      "Jordan continues to thrive in placement. Full education attendance with a commendation from her teacher for her GCSE coursework. She is engaged with her key worker and has self-reported feeling settled and safe. One moment of anxiety around an upcoming LAC review — supported well by her key worker through preparation conversations. Jordan is a strong advocate for herself and her voice is consistently heard.",
    evidence_refs: [
      { type: "voice_record", id: "vrc_len_001", date: "2026-04-08", excerpt: "Said she wants to stay at Chamberlain House until she moves into supported living at 18", significance: "stability and future planning" },
      { type: "daily_log", id: "log_len_008", date: "2026-04-10", excerpt: "Received GCSE commendation letter from school — shared it with the team at dinner", significance: "achievement and belonging" },
    ],
    computed_by: "cara",
    reviewed_by: "staff_darren",
    created_at: "2026-04-13T07:00:00Z",
  },
];

// ── Seed: Pattern Alerts ──────────────────────────────────────────────────────

intelligenceStore.patternAlerts = [
  {
    id: "pat_001",
    home_id: "home_oak",
    child_id: "yp_alex",
    alert_type: "regulation_deterioration",
    title: "Escalating dysregulation episodes — Alex",
    description:
      "Cara has identified three dysregulation episodes in a 7-day period, each occurring between 17:00–19:00. The pattern suggests a consistent trigger window, potentially linked to transition from school or contact-related anxiety. Without targeted intervention this pattern is likely to continue.",
    severity: "high",
    status: "active",
    evidence_refs: [
      { type: "incident", id: "inc_mar_001", date: "2026-04-02", excerpt: "Unauthorised absence following staff redirect at 17:30" },
      { type: "incident", id: "inc_mar_002", date: "2026-04-05", excerpt: "Verbal aggression towards staff at 18:15 — de-escalated after 40 minutes" },
      { type: "daily_log", id: "log_mar_009", date: "2026-04-07", excerpt: "Alex refused dinner and isolated in room from 17:00–19:30" },
    ],
    reflective_prompt:
      "What is happening for Alex between 5pm and 7pm? Is there a transition, a contact call, or an unmet need that is consistently triggering dysregulation at this time? What would it look like to proactively support him before this window opens?",
    detected_at: "2026-04-08T06:00:00Z",
    period_start: "2026-04-01",
    period_end: "2026-04-08",
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_by: null,
    resolved_at: null,
    created_at: "2026-04-08T06:00:00Z",
  },
  {
    id: "pat_002",
    home_id: "home_oak",
    child_id: "yp_casey",
    alert_type: "contact_linked_distress",
    title: "Consistent post-contact distress — Casey",
    description:
      "Casey has shown significant emotional distress following each of three contact sessions with her mother in the past 3 weeks. The pattern includes tearfulness, social withdrawal, and reduced sleep on contact days. This suggests contact is currently destabilising for Casey and warrants a review of the contact arrangement and how it is being prepared for and processed.",
    severity: "medium",
    status: "acknowledged",
    evidence_refs: [
      { type: "daily_log", id: "log_jas_004", date: "2026-04-03", excerpt: "Distressed after phone contact with mother — cried for 45 mins, refused to engage" },
      { type: "daily_log", id: "log_jas_019", date: "2026-04-10", excerpt: "Quieter than usual following contact visit — went to room early" },
      { type: "incident", id: "inc_jas_002", date: "2026-04-17", excerpt: "Casey distressed post-contact, required co-regulation for 30 minutes" },
    ],
    reflective_prompt:
      "What does Casey need before, during, and after contact to feel safer? Has she been given the opportunity to share how contact feels for her? Is the current contact arrangement meeting her needs or the needs of the plan?",
    detected_at: "2026-04-18T06:00:00Z",
    period_start: "2026-04-01",
    period_end: "2026-04-18",
    acknowledged_by: "staff_darren",
    acknowledged_at: "2026-04-18T09:30:00Z",
    resolved_by: null,
    resolved_at: null,
    created_at: "2026-04-18T06:00:00Z",
  },
  {
    id: "pat_003",
    home_id: "home_oak",
    child_id: null,
    alert_type: "staffing_continuity_risk",
    title: "Home-wide staffing continuity gap — peak evenings",
    description:
      "Cara has identified that Chamberlain House has had 6 agency staff shifts in the past 14 days, predominantly evening shifts. Three of the four dysregulation episodes in this period occurred during agency-covered shifts. Unfamiliar staff during vulnerable evening hours is a consistent risk factor for the current resident group.",
    severity: "high",
    status: "active",
    evidence_refs: [
      { type: "shift", id: "shift_004", date: "2026-04-07", excerpt: "Agency staff (Alex Obi) — evening shift" },
      { type: "shift", id: "shift_009", date: "2026-04-10", excerpt: "Agency staff — evening shift. Two incidents on same shift." },
    ],
    reflective_prompt:
      "What is driving the current reliance on agency staff for evening shifts? Is there a rota gap, a leave pattern, or a recruitment gap that needs addressing? What is the impact of unfamiliar staff on young people who have experienced repeated disruption?",
    detected_at: "2026-04-15T06:00:00Z",
    period_start: "2026-04-01",
    period_end: "2026-04-15",
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_by: null,
    resolved_at: null,
    created_at: "2026-04-15T06:00:00Z",
  },
  {
    id: "pat_004",
    home_id: "home_oak",
    child_id: "yp_jordan",
    alert_type: "education_achievement_milestone",
    title: "Sustained education achievement — Jordan",
    description:
      "Jordan has maintained 100% school attendance for 6 consecutive weeks and received a formal commendation for her GCSE coursework. This represents a significant positive trajectory for a young person who had 43% attendance in the previous placement. The protective factors sustaining this should be identified and reinforced.",
    severity: "low",
    status: "resolved",
    evidence_refs: [
      { type: "daily_log", id: "log_len_008", date: "2026-04-10", excerpt: "GCSE commendation letter received and shared with the team" },
    ],
    reflective_prompt:
      "What is enabling Jordan to engage with education in a way she hasn't before? Which relationships, routines, and environmental factors are protective? How can these be named, celebrated with Jordan, and documented for her future?",
    detected_at: "2026-04-12T06:00:00Z",
    period_start: "2026-03-01",
    period_end: "2026-04-12",
    acknowledged_by: "staff_darren",
    acknowledged_at: "2026-04-12T10:00:00Z",
    resolved_by: "staff_darren",
    resolved_at: "2026-04-14T09:00:00Z",
    created_at: "2026-04-12T06:00:00Z",
  },
];

// ── Seed: Interventions ────────────────────────────────────────────────────────

intelligenceStore.interventions = [
  {
    id: "int_001",
    home_id: "home_oak",
    child_id: "yp_alex",
    title: "Proactive 5pm transition support — Alex",
    description:
      "From 4:45pm each day, a consistent named staff member (Lackson where possible) will meet Alex informally — not in a structured way but with activity or company — to bridge the school-to-home transition. The aim is to reduce the activation that appears to occur at this time.",
    rationale:
      "Cara pattern alert identified consistent dysregulation between 17:00–19:00. Transition periods are known high-risk times for young people with a history of relational trauma. Proactive co-regulation before the window opens is more effective than reactive de-escalation.",
    started_at: "2026-04-10",
    review_date: "2026-04-24",
    ended_at: null,
    agreed_by: "staff_darren",
    status: "active",
    intended_outcome: "Reduce frequency of dysregulation episodes in the 17:00–19:00 window from 3 per week to fewer than 1 per week within 3 weeks.",
    outcome: "too_early",
    outcome_notes: null,
    evidence_refs: [
      { type: "pattern_alert", id: "pat_001", date: "2026-04-08", excerpt: "Escalating dysregulation — 3 episodes in 7 days, all 17–19:00" },
    ],
    created_by: "staff_darren",
    created_at: "2026-04-10T11:00:00Z",
    updated_at: "2026-04-10T11:00:00Z",
  },
  {
    id: "int_002",
    home_id: "home_oak",
    child_id: "yp_casey",
    title: "Contact preparation and post-contact recovery plan",
    description:
      "Before each contact session with her mother, Casey's key worker will spend 20 minutes with her to check in, answer any worries, and agree a 'come back to' plan for after. After contact, Casey will have unstructured time with her key worker — no activities planned, just available presence — for at least 45 minutes.",
    rationale:
      "Pattern alert identified consistent post-contact distress in Casey over 3 weeks. Contact with her mother is meaningful but destabilising. Preparation and recovery time are evidence-based protective approaches for contact-related distress in looked-after children.",
    started_at: "2026-04-19",
    review_date: "2026-05-03",
    ended_at: null,
    agreed_by: "staff_darren",
    status: "active",
    intended_outcome: "Reduce post-contact distress duration from 45+ minutes to under 20 minutes. Casey reports feeling more ready for and recovered from contact.",
    outcome: "too_early",
    outcome_notes: null,
    evidence_refs: [
      { type: "pattern_alert", id: "pat_002", date: "2026-04-18", excerpt: "Post-contact distress pattern — 3 occurrences in 3 weeks" },
    ],
    created_by: "staff_darren",
    created_at: "2026-04-19T09:00:00Z",
    updated_at: "2026-04-19T09:00:00Z",
  },
  {
    id: "int_003",
    home_id: "home_oak",
    child_id: "yp_jordan",
    title: "Education aspirations planning — Jordan",
    description:
      "Monthly 1:1 sessions with key worker focused on Jordan's post-16 aspirations, pathway options, and next steps. Sessions will draw on her current GCSE trajectory and use a strengths-based approach to help her build a realistic and ambitious future plan.",
    rationale:
      "Jordan's sustained education engagement and achievement milestone present an opportunity to build on her protective factors and help her plan proactively for the future. This supports her stability and sense of agency.",
    started_at: "2026-04-15",
    review_date: "2026-07-15",
    ended_at: null,
    agreed_by: "staff_ryan",
    status: "active",
    intended_outcome: "Jordan has a clear written pathway plan for post-16 options by July 2026 and feels confident about her future.",
    outcome: "working",
    outcome_notes: "First session completed 2026-04-15. Jordan identified college and healthcare as areas of interest. Very engaged.",
    evidence_refs: [
      { type: "pattern_alert", id: "pat_004", date: "2026-04-12", excerpt: "Sustained education achievement — 6 weeks full attendance" },
    ],
    created_by: "staff_ryan",
    created_at: "2026-04-15T14:00:00Z",
    updated_at: "2026-04-15T14:00:00Z",
  },
];

// ── Seed: Relational Records ───────────────────────────────────────────────────

intelligenceStore.relationalRecords = [
  {
    id: "rr_001",
    home_id: "home_oak",
    child_id: "yp_alex",
    record_type: "preferred_adult",
    title: "Lackson — preferred staff member",
    description:
      "Alex has shown a consistent preference for Lackson. He accepts co-regulation from Lackson more readily than other staff, and the car-washing conversation on 11 April was the first sustained interaction Alex has had with any adult since placement. Lackson should be prioritised as Alex's key worker and primary contact for high-stakes moments.",
    staff_id: "staff_lackson",
    is_positive: true,
    confidence: "medium",
    source_ref_type: "daily_log",
    source_ref_id: "log_mar_015",
    created_by: "staff_darren",
    created_at: "2026-04-12T09:00:00Z",
  },
  {
    id: "rr_002",
    home_id: "home_oak",
    child_id: "yp_alex",
    record_type: "what_to_avoid",
    title: "Do not use direct instructions or redirects when dysregulating",
    description:
      "Alex responds very badly to direct instructions or confrontational redirection when already activated. This escalates the episode. Instead, staff should withdraw slightly, offer non-verbal presence, and wait for the window of openness to offer a soft connection.",
    staff_id: null,
    is_positive: false,
    confidence: "high",
    source_ref_type: "incident",
    source_ref_id: "inc_mar_001",
    created_by: "staff_darren",
    created_at: "2026-04-08T10:00:00Z",
  },
  {
    id: "rr_003",
    home_id: "home_oak",
    child_id: "yp_alex",
    record_type: "regulation_strategy",
    title: "Going to the garden or open space helps Alex regulate",
    description:
      "On two occasions, staff have successfully supported Alex through the early stages of dysregulation by suggesting a walk to the garden. He responds better to movement and open space than to contained indoor environments during escalating episodes.",
    staff_id: null,
    is_positive: true,
    confidence: "medium",
    source_ref_type: "daily_log",
    source_ref_id: "log_mar_009",
    created_by: "staff_lackson",
    created_at: "2026-04-09T11:00:00Z",
  },
  {
    id: "rr_004",
    home_id: "home_oak",
    child_id: "yp_casey",
    record_type: "trust_moment",
    title: "Casey initiated kitchen help unprompted",
    description:
      "On 1 April, Casey came into the kitchen unprompted and asked if she could help with dinner. She stayed for 40 minutes and chatted with staff. This is a significant trust indicator — Casey is beginning to use communal space voluntarily and initiate with adults.",
    staff_id: "staff_chervelle",
    is_positive: true,
    confidence: "high",
    source_ref_type: "daily_log",
    source_ref_id: "log_jas_001",
    created_by: "staff_chervelle",
    created_at: "2026-04-01T19:30:00Z",
  },
  {
    id: "rr_005",
    home_id: "home_oak",
    child_id: "yp_casey",
    record_type: "what_helps",
    title: "Casey responds well to humour and gentle banter",
    description:
      "Staff have noted that Casey responds positively to light humour and gentle banter. This can be used to open difficult conversations or to de-escalate mild anxiety. It must feel natural — Casey will disengage if it feels forced or patronising.",
    staff_id: null,
    is_positive: true,
    confidence: "medium",
    source_ref_type: null,
    source_ref_id: null,
    created_by: "staff_ryan",
    created_at: "2026-04-07T12:00:00Z",
  },
  {
    id: "rr_006",
    home_id: "home_oak",
    child_id: "yp_jordan",
    record_type: "preferred_adult",
    title: "Ryan — key worker and primary trusted adult",
    description:
      "Jordan has a strong, established relationship with Ryan. She has explicitly named him as the adult she feels most comfortable with at Chamberlain House. This relationship should be protected and prioritised, including in rota planning.",
    staff_id: "staff_ryan",
    is_positive: true,
    confidence: "high",
    source_ref_type: "voice_record",
    source_ref_id: "vrc_len_001",
    created_by: "staff_darren",
    created_at: "2026-04-08T09:00:00Z",
  },
  {
    id: "rr_007",
    home_id: "home_oak",
    child_id: "yp_jordan",
    record_type: "attachment_indicator",
    title: "Jordan tests boundaries around review and planning conversations",
    description:
      "Jordan becomes anxious and can appear dismissive or deflective when LAC review or future planning is mentioned without warning. This appears to be an attachment-based response — fear of change, of plans not being kept, and of being let down. Advance notice and explicit follow-through on commitments is essential.",
    staff_id: null,
    is_positive: false,
    confidence: "high",
    source_ref_type: "daily_log",
    source_ref_id: "log_len_008",
    created_by: "staff_ryan",
    created_at: "2026-04-11T10:00:00Z",
  },
];

// ── Seed: Practice Bank ────────────────────────────────────────────────────────

intelligenceStore.practiceBank = [
  {
    id: "pb_001",
    home_id: "home_oak",
    child_id: "yp_alex",
    category: "what_works",
    title: "Offer activity before conversation",
    description:
      "Alex engages better when a shared activity (washing the car, cooking, going to the shop) precedes any attempt at conversation. Side-by-side activity reduces the pressure of direct eye contact and allows him to open up at his own pace.",
    evidence: "log_mar_015 — first sustained conversation happened during car washing with Lackson.",
    contributed_by: "staff_lackson",
    reviewed_by: "staff_darren",
    reviewed_at: "2026-04-13T09:00:00Z",
    is_active: true,
    created_by: "staff_lackson",
    created_at: "2026-04-12T09:00:00Z",
    updated_at: "2026-04-13T09:00:00Z",
  },
  {
    id: "pb_002",
    home_id: "home_oak",
    child_id: "yp_alex",
    category: "what_to_avoid",
    title: "Avoid raising concerns or behaviour conversations in the first 30 minutes after school",
    description:
      "Attempting to address issues or concerns with Alex immediately when he arrives back from school consistently results in escalation. He needs at least 30 minutes of low-demand time before any conversation about behaviour, expectations, or incidents.",
    evidence: "Three incidents in the 5pm window — all preceded by immediate staff engagement on arrival.",
    contributed_by: "staff_darren",
    reviewed_by: "staff_darren",
    reviewed_at: "2026-04-10T10:00:00Z",
    is_active: true,
    created_by: "staff_darren",
    created_at: "2026-04-10T09:30:00Z",
    updated_at: "2026-04-10T10:00:00Z",
  },
  {
    id: "pb_003",
    home_id: "home_oak",
    child_id: "yp_casey",
    category: "regulation",
    title: "Box breathing with Casey — effective co-regulation tool",
    description:
      "Casey has responded well to box breathing exercises when introduced during a calm moment (not mid-crisis). She has now used this independently on two occasions. Staff should reinforce this skill and acknowledge when she uses it.",
    evidence: "inc_jas_001 — Casey used breathing strategies after 15 minutes. Resolved without further escalation.",
    contributed_by: "staff_chervelle",
    reviewed_by: "staff_ryan",
    reviewed_at: "2026-04-08T11:00:00Z",
    is_active: true,
    created_by: "staff_chervelle",
    created_at: "2026-04-06T16:00:00Z",
    updated_at: "2026-04-08T11:00:00Z",
  },
  {
    id: "pb_004",
    home_id: "home_oak",
    child_id: "yp_casey",
    category: "language",
    title: "Avoid the word 'fine' — Casey interprets it as dismissal",
    description:
      "Casey has said explicitly that when adults say 'you'll be fine' it makes her feel unheard. Staff should instead use validating language: 'that sounds really hard', 'I can see this is upsetting for you', 'I'm here if you want to talk'.",
    evidence: "Noted by Casey in key work session — documented in voice record vrc_jas_001.",
    contributed_by: "staff_ryan",
    reviewed_by: null,
    reviewed_at: null,
    is_active: true,
    created_by: "staff_ryan",
    created_at: "2026-04-10T14:00:00Z",
    updated_at: "2026-04-10T14:00:00Z",
  },
  {
    id: "pb_005",
    home_id: "home_oak",
    child_id: "yp_jordan",
    category: "preparation",
    title: "Give Jordan 48 hours notice before any significant conversation",
    description:
      "Jordan needs advance notice for any conversation about her future, her placement, or her plan. Springing these topics on her — even positively — triggers anxiety. A 48-hour heads-up, with the option to choose the time and place of the conversation, respects her need for control and reduces the attachment-based anxiety response.",
    evidence: "Identified through key work sessions with Ryan. Confirmed through observation of two unplanned planning conversations.",
    contributed_by: "staff_ryan",
    reviewed_by: "staff_darren",
    reviewed_at: "2026-04-12T09:00:00Z",
    is_active: true,
    created_by: "staff_ryan",
    created_at: "2026-04-11T11:00:00Z",
    updated_at: "2026-04-12T09:00:00Z",
  },
  {
    id: "pb_006",
    home_id: "home_oak",
    child_id: "yp_jordan",
    category: "engagement",
    title: "Jordan responds well to being asked for her opinion or expertise",
    description:
      "Jordan lights up when staff genuinely ask for her view or advice — on cooking, on what film to watch, on how the home could be improved. This activates her sense of agency and belonging. It should be done authentically, not as a technique.",
    evidence: "Observed across multiple daily log entries — most recently log_len_008.",
    contributed_by: "staff_ryan",
    reviewed_by: null,
    reviewed_at: null,
    is_active: true,
    created_by: "staff_ryan",
    created_at: "2026-04-10T15:00:00Z",
    updated_at: "2026-04-10T15:00:00Z",
  },
];

// ── Seed: Voice Records ────────────────────────────────────────────────────────

intelligenceStore.voiceRecords = [
  {
    id: "vrc_jas_001",
    home_id: "home_oak",
    child_id: "yp_casey",
    recorded_at: "2026-04-10T15:30:00Z",
    theme: "wishes",
    direct_quote: "I want to start a creative writing club at school. I wrote a story last week and my teacher actually liked it.",
    paraphrase: "Casey expressed a wish to start a creative writing group at school, prompted by positive feedback on a piece of writing she had completed.",
    capture_method: "direct",
    action_taken: "Key worker spoke to school link worker about creative writing opportunities. School confirmed an existing lunchtime club Casey was unaware of.",
    action_owner: "staff_ryan",
    action_outcome: "Casey attended the club for the first time on 17 April. Reported enjoying it.",
    voice_heeded: true,
    source_ref_type: null,
    source_ref_id: null,
    recorded_by: "staff_ryan",
    created_at: "2026-04-10T16:00:00Z",
  },
  {
    id: "vrc_jas_002",
    home_id: "home_oak",
    child_id: "yp_casey",
    recorded_at: "2026-04-18T19:00:00Z",
    theme: "feelings",
    direct_quote: "I don't know why I feel so bad after seeing mum. I love her but afterwards I just feel really sad and I don't know why.",
    paraphrase: "Casey expressed ambivalence and distress around contact with her mother — feeling both love and post-contact sadness she couldn't fully explain.",
    capture_method: "direct",
    action_taken: "Key worker validated Casey's feelings. Contact plan discussed with social worker. Contact preparation and recovery plan initiated.",
    action_owner: "staff_darren",
    action_outcome: null,
    voice_heeded: true,
    source_ref_type: "incident",
    source_ref_id: "inc_jas_002",
    recorded_by: "staff_chervelle",
    created_at: "2026-04-18T19:30:00Z",
  },
  {
    id: "vrc_len_001",
    home_id: "home_oak",
    child_id: "yp_jordan",
    recorded_at: "2026-04-08T17:00:00Z",
    theme: "plans",
    direct_quote: "I want to stay here until I'm 18 and then move into my own place. I've had too many moves. I need to know I can stay.",
    paraphrase: "Jordan clearly communicated her wish for placement stability until 18, then transition to supported living. She expressed that movement and change are her primary fear.",
    capture_method: "direct",
    action_taken: "Key worker committed to advocating for placement stability at the next LAC review. Jordan's wishes documented and to be shared with IRO.",
    action_owner: "staff_ryan",
    action_outcome: "LAC review confirmed placement stability agreed through to 18.",
    voice_heeded: true,
    source_ref_type: null,
    source_ref_id: null,
    recorded_by: "staff_ryan",
    created_at: "2026-04-08T17:30:00Z",
  },
  {
    id: "vrc_len_002",
    home_id: "home_oak",
    child_id: "yp_jordan",
    recorded_at: "2026-04-14T16:00:00Z",
    theme: "future",
    direct_quote: "I think I want to work in a hospital — maybe a healthcare assistant or something like that. I like looking after people.",
    paraphrase: "Jordan expressed interest in a healthcare career. She connected this to a sense of wanting to care for others — a significant insight given her own experience of being cared for.",
    capture_method: "direct",
    action_taken: "Key worker to explore healthcare apprenticeship options and college courses at next 1:1 session.",
    action_owner: "staff_ryan",
    action_outcome: null,
    voice_heeded: true,
    source_ref_type: null,
    source_ref_id: null,
    recorded_by: "staff_ryan",
    created_at: "2026-04-14T16:30:00Z",
  },
  {
    id: "vrc_mar_001",
    home_id: "home_oak",
    child_id: "yp_alex",
    recorded_at: "2026-04-11T21:00:00Z",
    theme: "relationships",
    direct_quote: "Lackson's alright. He doesn't make it weird.",
    paraphrase: "During the car-washing session, Alex made an unprompted positive comment about Lackson, indicating emerging trust.",
    capture_method: "observed",
    action_taken: "Lackson identified as preferred adult. Key worker allocation reviewed. Proactive transition support plan assigned to Lackson where possible.",
    action_owner: "staff_darren",
    action_outcome: null,
    voice_heeded: true,
    source_ref_type: "daily_log",
    source_ref_id: "log_mar_015",
    recorded_by: "staff_lackson",
    created_at: "2026-04-11T21:30:00Z",
  },
];

// ── Seed: Home Climate Snapshots ───────────────────────────────────────────────

intelligenceStore.homeClimate = [
  {
    id: "hcs_001",
    home_id: "home_oak",
    period_start: "2026-03-24",
    period_end: "2026-03-30",
    staffing_consistency_score: 72,
    incident_frequency_score: 68,
    missing_episode_score: 75,
    complaints_score: 90,
    safeguarding_score: 80,
    peer_tension_score: 70,
    training_compliance_score: 82,
    maintenance_score: 78,
    overall_climate_score: 77,
    climate_delta: null,
    narrative:
      "A broadly stable week at Chamberlain House. Staffing consistency is the principal risk factor — two agency shifts in the week. Incident frequency is within expected range for a home with a newly placed young person. No complaints. Training compliance remains strong.",
    hotspot_times: ["Tuesday 17:00–19:00", "Thursday 21:00–22:30"],
    risk_flags: [],
    computed_by: "cara",
    created_at: "2026-03-31T06:00:00Z",
  },
  {
    id: "hcs_002",
    home_id: "home_oak",
    period_start: "2026-03-31",
    period_end: "2026-04-06",
    staffing_consistency_score: 65,
    incident_frequency_score: 58,
    missing_episode_score: 75,
    complaints_score: 88,
    safeguarding_score: 78,
    peer_tension_score: 62,
    training_compliance_score: 82,
    maintenance_score: 71,
    overall_climate_score: 72,
    climate_delta: -5,
    narrative:
      "A more challenging week. Staffing consistency has declined — four agency shifts, three in the evening window. Incident frequency is elevated, driven primarily by Alex's dysregulation pattern. Peer tension between Alex and Casey noted on two occasions. Rear gate latch maintenance issue remains outstanding.",
    hotspot_times: ["Monday 17:30–19:00", "Wednesday 17:00–19:30", "Friday 21:00–22:00"],
    risk_flags: ["agency_staff_evening_pattern", "marcus_dysregulation_peak", "maintenance_gate_outstanding"],
    computed_by: "cara",
    created_at: "2026-04-07T06:00:00Z",
  },
  {
    id: "hcs_003",
    home_id: "home_oak",
    period_start: "2026-04-07",
    period_end: "2026-04-13",
    staffing_consistency_score: 68,
    incident_frequency_score: 62,
    missing_episode_score: 78,
    complaints_score: 90,
    safeguarding_score: 80,
    peer_tension_score: 68,
    training_compliance_score: 85,
    maintenance_score: 82,
    overall_climate_score: 77,
    climate_delta: 5,
    narrative:
      "Modest recovery this week. The proactive transition support intervention for Alex appears to be having early impact — the 5pm window was calmer on 4 of 5 days. Staffing consistency remains a concern but improved slightly. Rear gate latch resolved. Casey's wellbeing is positive and Jordan continues to thrive.",
    hotspot_times: ["Wednesday 17:30–18:30"],
    risk_flags: ["agency_staff_evening_pattern"],
    computed_by: "cara",
    created_at: "2026-04-14T06:00:00Z",
  },
];

// ── Seed: Document Intelligence Jobs ──────────────────────────────────────────

intelligenceStore.docJobs = [
  {
    id: "dij_001",
    home_id: "home_oak",
    original_filename: "Casey_T_Initial_Health_Assessment_April2026.pdf",
    file_size_bytes: 284120,
    mime_type: "application/pdf",
    extracted_text: null,
    status: "classified",
    classification: {
      document_type: "health_assessment",
      confidence: 0.94,
      key_people: ["Casey R", "Dr Patel", "staff_ryan"],
      key_dates: ["2026-04-05"],
      risks_identified: ["dental appointment outstanding", "immunisations to review"],
      actions_identified: ["Book dental appointment within 4 weeks", "Review immunisation status with GP"],
      child_voice_present: true,
      safeguarding_indicators: false,
    },
    suggested_module: "health",
    suggested_child_id: "yp_casey",
    suggested_form_type: "health_assessment",
    suggested_tags: ["health", "initial_assessment", "yp_casey"],
    confidence_score: 0.94,
    reviewed_by: null,
    reviewed_at: null,
    placed_at: null,
    placement_ref_type: null,
    placement_ref_id: null,
    aria_notes:
      "High-confidence classification. Document is Casey's initial health assessment dated 5 April 2026. Two actions identified: dental appointment and immunisation review. Child voice present — Casey reported feeling 'okay' about her health. Recommend placing in Health module and creating two tasks for the identified actions.",
    created_by: "staff_darren",
    created_at: "2026-04-06T10:00:00Z",
    updated_at: "2026-04-06T10:45:00Z",
  },
  {
    id: "dij_002",
    home_id: "home_oak",
    original_filename: "Alex_W_CAMHS_assessment_referral.docx",
    file_size_bytes: 89034,
    mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extracted_text: null,
    status: "placed",
    classification: {
      document_type: "camhs_referral",
      confidence: 0.91,
      key_people: ["Alex T", "Dr Ahmed", "staff_darren"],
      key_dates: ["2026-04-08", "2026-04-22"],
      risks_identified: [],
      actions_identified: ["Await CAMHS triage — expected within 14 days"],
      child_voice_present: false,
      safeguarding_indicators: false,
    },
    suggested_module: "health",
    suggested_child_id: "yp_alex",
    suggested_form_type: "camhs_referral",
    suggested_tags: ["camhs", "mental_health", "yp_alex"],
    confidence_score: 0.91,
    reviewed_by: "staff_darren",
    reviewed_at: "2026-04-08T14:00:00Z",
    placed_at: "2026-04-08T14:05:00Z",
    placement_ref_type: "care_form",
    placement_ref_id: "form_camhs_mar_001",
    aria_notes:
      "CAMHS assessment referral for Alex. Confirmed placement by manager. CAMHS triage expected within 14 days of referral date (8 April). Task created to chase if no response by 22 April.",
    created_by: "staff_darren",
    created_at: "2026-04-08T13:30:00Z",
    updated_at: "2026-04-08T14:05:00Z",
  },
  {
    id: "dij_003",
    home_id: "home_oak",
    original_filename: "scan0042.pdf",
    file_size_bytes: 1204800,
    mime_type: "application/pdf",
    extracted_text: null,
    status: "pending",
    classification: null,
    suggested_module: null,
    suggested_child_id: null,
    suggested_form_type: null,
    suggested_tags: [],
    confidence_score: null,
    reviewed_by: null,
    reviewed_at: null,
    placed_at: null,
    placement_ref_type: null,
    placement_ref_id: null,
    aria_notes: null,
    created_by: "staff_anna",
    created_at: "2026-04-19T11:00:00Z",
    updated_at: "2026-04-19T11:00:00Z",
  },
];

// ── Seed: Action Outcomes ─────────────────────────────────────────────────────

intelligenceStore.actionOutcomes = [
  {
    id: "ao_001",
    home_id: "home_oak",
    task_id: null,
    child_id: "yp_alex",
    title: "CAMHS referral — follow up if no triage by 22 April",
    what_was_agreed: "Chase CAMHS if no triage confirmation received by 22 April 2026.",
    why_it_matters:
      "Alex is currently without CAMHS support and is displaying significant dysregulation. Early therapeutic input is a protective factor and will support the team's ability to respond to his needs effectively.",
    owner_id: "staff_darren",
    due_date: "2026-04-22",
    completed_at: null,
    what_was_done: null,
    what_changed: null,
    effectiveness: null,
    effectiveness_notes: null,
    status: "overdue",
    linked_evidence: [
      { type: "document_intelligence_job", id: "dij_002", description: "CAMHS referral submitted 8 April 2026" },
    ],
    should_continue: null,
    created_by: "staff_darren",
    created_at: "2026-04-08T14:10:00Z",
    updated_at: "2026-04-08T14:10:00Z",
  },
  {
    id: "ao_002",
    home_id: "home_oak",
    task_id: null,
    child_id: "yp_casey",
    title: "Book Casey's dental appointment",
    what_was_agreed: "Book a dental appointment for Casey within 4 weeks of initial health assessment (by 3 May 2026).",
    why_it_matters:
      "Dental care is a looked-after children health requirement. Casey's initial health assessment flagged no recent dental check.",
    owner_id: "staff_ryan",
    due_date: "2026-05-03",
    completed_at: null,
    what_was_done: null,
    what_changed: null,
    effectiveness: null,
    effectiveness_notes: null,
    status: "in_progress",
    linked_evidence: [
      { type: "document_intelligence_job", id: "dij_001", description: "Initial health assessment — dental appointment flagged" },
    ],
    should_continue: null,
    created_by: "staff_darren",
    created_at: "2026-04-06T11:00:00Z",
    updated_at: "2026-04-06T11:00:00Z",
  },
  {
    id: "ao_003",
    home_id: "home_oak",
    task_id: null,
    child_id: "yp_alex",
    title: "Proactive 5pm support — review effectiveness at 3 weeks",
    what_was_agreed: "Review the proactive 5pm transition support intervention after 3 weeks (by 1 May 2026) to assess whether dysregulation frequency has reduced.",
    why_it_matters:
      "The intervention represents a significant rota and staffing commitment. Its effectiveness must be evaluated to determine whether to continue, adapt, or replace it.",
    owner_id: "staff_darren",
    due_date: "2026-05-01",
    completed_at: null,
    what_was_done: null,
    what_changed: null,
    effectiveness: null,
    effectiveness_notes: null,
    status: "open",
    linked_evidence: [
      { type: "intervention", id: "int_001", description: "Proactive 5pm transition support — started 10 April 2026" },
      { type: "pattern_alert", id: "pat_001", description: "Escalating dysregulation pattern alert — 8 April 2026" },
    ],
    should_continue: null,
    created_by: "staff_darren",
    created_at: "2026-04-10T11:30:00Z",
    updated_at: "2026-04-10T11:30:00Z",
  },
  {
    id: "ao_004",
    home_id: "home_oak",
    task_id: null,
    child_id: "yp_jordan",
    title: "Confirm placement stability at LAC review",
    what_was_agreed: "Advocate at the LAC review for Jordan's placement to be confirmed stable through to age 18 as per her explicit wishes.",
    why_it_matters:
      "Jordan has experienced multiple placement breakdowns. Her voice is clear: she wants to stay at Chamberlain House until 18. Placement stability is a fundamental protective factor for her wellbeing, education, and future.",
    owner_id: "staff_ryan",
    due_date: "2026-04-20",
    completed_at: "2026-04-20T15:00:00Z",
    what_was_done: "Raised Jordan's wishes explicitly at LAC review. IRO confirmed placement stability agreed through to 18. Jordan was present and heard.",
    what_changed: "Placement stability formally recorded in LAC review minutes. Jordan reported feeling 'relieved and happy'.",
    effectiveness: "very_effective",
    effectiveness_notes: "Jordan's direct participation in the review and hearing the commitment made was powerful. She appeared much less anxious in the days following the review.",
    status: "completed",
    linked_evidence: [
      { type: "voice_record", id: "vrc_len_001", description: "Jordan's expressed wish to remain at Chamberlain House until 18" },
    ],
    should_continue: false,
    created_by: "staff_ryan",
    created_at: "2026-04-08T18:00:00Z",
    updated_at: "2026-04-20T15:30:00Z",
  },
  {
    id: "ao_005",
    home_id: "home_oak",
    task_id: null,
    child_id: "yp_alex",
    title: "Review immunisation records — Alex",
    what_was_agreed: "Obtain and review Alex's immunisation records from previous GP within 2 weeks of placement (by 14 April 2026).",
    why_it_matters: "LAC health requirement — immunisation status must be verified for all newly placed young people within the statutory timeframe.",
    owner_id: "staff_ryan",
    due_date: "2026-04-14",
    completed_at: null,
    what_was_done: null,
    what_changed: null,
    effectiveness: null,
    effectiveness_notes: null,
    status: "overdue",
    linked_evidence: [],
    should_continue: null,
    created_by: "staff_darren",
    created_at: "2026-03-31T10:00:00Z",
    updated_at: "2026-03-31T10:00:00Z",
  },
  {
    id: "ao_006",
    home_id: "home_oak",
    task_id: null,
    child_id: "yp_casey",
    title: "Obtain Casey's school reports from previous placement",
    what_was_agreed: "Request school reports and EHCP documentation from previous placement within 10 days (by 15 April 2026).",
    why_it_matters: "Education planning for Casey cannot be fully progressed without a picture of her prior education history and any existing SEND provisions.",
    owner_id: "staff_ryan",
    due_date: "2026-04-15",
    completed_at: null,
    what_was_done: null,
    what_changed: null,
    effectiveness: null,
    effectiveness_notes: null,
    status: "overdue",
    linked_evidence: [],
    should_continue: null,
    created_by: "staff_darren",
    created_at: "2026-04-05T09:00:00Z",
    updated_at: "2026-04-05T09:00:00Z",
  },
];

// ── Seed: Cara Assessments ────────────────────────────────────────────────────

intelligenceStore.caraAssessments = [
  {
    id: "aa_001",
    home_id: "home_oak",
    child_id: "yp_casey",
    assessment_type: "situation_review",
    situation_summary: "Casey presented with significant emotional dysregulation following a family contact call on 14th April. She became verbally aggressive and later withdrew to her room for 3 hours. Previous patterns suggest family contact is a consistent trigger.",
    risk_level: "medium",
    safeguarding_flags: [],
    protective_factors: ["Strong relationship with key worker", "Engages well with creative activities", "Responds positively to PACE approaches"],
    emotional_needs: ["Felt unheard after the call", "Experienced perceived rejection", "Needed co-regulation support"],
    suggested_actions: [
      { title: "Complete key work session on family contact", why_this_matters: "Casey needs a safe space to process the phone call and understand her feelings", priority: "high", deadline_days: 3, assigned_role: "key_worker" },
      { title: "Review family contact plan with social worker", why_this_matters: "Current contact frequency may be causing more harm than good", priority: "medium", deadline_days: 7, assigned_role: "registered_manager" },
    ],
    confidence_level: "high",
    ai_generated_text: "Based on the available information, Casey's behaviour following the family contact call is consistent with a pattern of emotional dysregulation linked to perceived rejection and anxiety about family relationships. This is not unusual for young people in residential care who have experienced relational trauma. The 3-hour withdrawal period may indicate she needed time and space to self-regulate, which could be a developing healthy coping mechanism. Staff should approach this with curiosity rather than concern about the behaviour itself.",
    status: "reviewed",
    created_by: "staff_darren",
    reviewed_by: "staff_darren",
    created_at: "2026-04-15T10:00:00Z",
    reviewed_at: "2026-04-15T14:00:00Z",
  },
];

// ── Seed: Key Work Sessions ────────────────────────────────────────────────────

intelligenceStore.keyWorkSessions = [
  {
    id: "kws_001",
    home_id: "home_oak",
    child_id: "yp_casey",
    title: "Understanding My Feelings After Family Contact",
    theme: "family_contact",
    reason: "Casey became distressed following family contact call on 14th April. She needs a supported space to process her feelings.",
    aims: "Help Casey identify and name her feelings. Explore what family contact means to her. Build a simple coping strategy for difficult calls.",
    desired_outcomes: "Casey feels heard and understood. She has at least one coping strategy she can use before/after calls. Staff have a better understanding of her needs.",
    session_plan: null,
    resources: [],
    status: "planned",
    created_by: "staff_darren",
    created_at: "2026-04-15T10:30:00Z",
  },
  {
    id: "kws_002",
    home_id: "home_oak",
    child_id: "yp_alex",
    title: "Staying Safe Online",
    theme: "staying_safe_online",
    reason: "Alex has been spending significant time online and staff have noticed possible contact with unknown individuals.",
    aims: "Explore Alex's online activity in a non-judgmental way. Identify any risks. Build digital safety awareness.",
    desired_outcomes: "Alex understands what safe and unsafe online contact looks like. They know who to talk to if worried.",
    session_plan: null,
    resources: [],
    status: "planned",
    created_by: "staff_darren",
    created_at: "2026-04-16T09:00:00Z",
  },
];

// ── Seed: Cara Recommendations ─────────────────────────────────────────────────

intelligenceStore.caraRecommendations = [
  {
    id: "ar_001",
    home_id: "home_oak",
    child_id: "yp_casey",
    source_type: "aria_assessment",
    source_id: "aa_001",
    recommendation_type: "key_work_session",
    title: "Complete key work session on family contact",
    reason: "Casey needs a safe space to process the family contact call and the feelings it triggered. Without this, the emotional impact may escalate.",
    priority: "high",
    deadline: "2026-04-18T17:00:00Z",
    assigned_role: "key_worker",
    task_created: false,
    status: "pending",
    created_at: "2026-04-15T10:00:00Z",
  },
  {
    id: "ar_002",
    home_id: "home_oak",
    child_id: "yp_casey",
    source_type: "aria_assessment",
    source_id: "aa_001",
    recommendation_type: "risk_assessment_update",
    title: "Update risk assessment to reflect family contact trigger",
    reason: "The pattern of dysregulation following family contact is now established. The risk assessment should reflect this known trigger and include a management strategy.",
    priority: "medium",
    deadline: "2026-04-22T17:00:00Z",
    assigned_role: "registered_manager",
    task_created: false,
    status: "pending",
    created_at: "2026-04-15T10:00:00Z",
  },
];

// ── Seed: Cara Safeguarding Flags ──────────────────────────────────────────────

intelligenceStore.caraSafeguardingFlags = [
  {
    id: "asf_001",
    home_id: "home_oak",
    child_id: "yp_alex",
    source_type: "key_work_session",
    source_id: "kws_002",
    flag_type: "online_exploitation",
    severity: "medium",
    description: "Alex has been making contact with unknown individuals online and has been reluctant to share details. Staff have noticed changes in behaviour including staying up late and being secretive about their phone.",
    recommended_action: "Immediate key work session on online safety. Notify social worker. Review online safety risk assessment. Consider referral to online exploitation specialist.",
    status: "open",
    created_at: "2026-04-16T09:30:00Z",
  },
];

// ── Seed: RI Challenge Logs ───────────────────────────────────────────────────

intelligenceStore.riChallengeLogs = [
  {
    id: "ric_001",
    home_id: "home_oak",
    title: "Three missing from care episodes in 90 days — MASH escalation not completed",
    challenge_area: "safeguarding",
    evidence_summary: "Alex W has had three missing from care episodes between January and April 2026 (MFC-2026-001, 002, 003). The April episode involved contextual safeguarding risks with an unknown peer group, and a MASH referral was documented as 'pending' on 1 April but has not been evidenced as completed. This represents a serious safeguarding gap.",
    challenge_text: "As Responsible Individual I am formally challenging the management team regarding the absence of a completed MASH referral following MFC-2026-003. The evidence suggests a pattern of escalating contextual safeguarding risk for Alex W. The delay in progressing the MASH referral is not consistent with the duty to safeguard. I require confirmation of escalation and a strategy discussion date within 48 hours.",
    escalation_level: "critical",
    action_required: "Confirm MASH referral completed. Provide date of strategy discussion. Update risk assessment. Brief all staff on contextual safeguarding indicators.",
    action_due_date: "2026-04-16",
    status: "action_pending",
    aria_generated: false,
    created_by: "staff_darren",
    created_at: "2026-04-14T10:00:00Z",
    updated_at: "2026-04-14T10:00:00Z",
  },
  {
    id: "ric_002",
    home_id: "home_oak",
    title: "Two staff members without formal supervision in 5+ weeks",
    challenge_area: "staffing",
    evidence_summary: "Review of supervision records shows that Anna T (Residential Care Worker) and Chervelle B (Senior Residential Care Worker) have not received formal documented supervision in over 5 weeks. The regulatory minimum under Children's Homes Regulations 2015 requires regular supervision. No documented reasons for delay were found.",
    challenge_text: "I am challenging the registered manager on the supervision gap for two team members. Regular supervision is a statutory requirement and a key governance safeguard. This must be addressed as a priority. Outstanding supervisions must be scheduled and completed within 7 days and evidence provided to me.",
    escalation_level: "elevated",
    manager_response: "Acknowledged. Supervision sessions have been scheduled for both staff members on 17 April (Anna) and 19 April (Chervelle). Apologies for the delay — staffing pressures were a factor.",
    manager_responded_at: "2026-04-14T16:30:00Z",
    manager_responded_by: "staff_edward",
    action_required: "Complete overdue supervisions and share signed records with RI by 21 April.",
    action_due_date: "2026-04-21",
    status: "responded",
    aria_generated: false,
    created_by: "staff_darren",
    created_at: "2026-04-13T09:30:00Z",
    updated_at: "2026-04-14T16:30:00Z",
  },
  {
    id: "ric_003",
    home_id: "home_oak",
    title: "Mandatory training — first aid and safeguarding expired for two staff",
    challenge_area: "compliance",
    evidence_summary: "The training matrix shows Ryan P and Lackson M have expired first aid certifications (expired February 2026 and March 2026 respectively). Ryan P also has an expired Level 3 safeguarding certificate. Both staff continue to be rostered on solo-cover shifts. This presents a compliance and safety risk.",
    challenge_text: "I am formally challenging the continued rostering of staff with expired mandatory training, particularly for first aid and safeguarding which are both safety-critical. This must be rectified immediately — either training must be rebooked and confirmed within 30 days, or staffing patterns adjusted to ensure a qualified member is always present. Training evidence must be filed within this timeframe.",
    escalation_level: "elevated",
    action_required: "Rebook and confirm first aid training for Ryan P and Lackson M. Rebook Level 3 safeguarding for Ryan P. Adjust rota to ensure compliant cover.",
    action_due_date: "2026-05-14",
    status: "open",
    aria_generated: false,
    created_by: "staff_darren",
    created_at: "2026-04-12T11:00:00Z",
    updated_at: "2026-04-12T11:00:00Z",
  },
  {
    id: "ric_004",
    home_id: "home_oak",
    title: "Medication error — late administration not reviewed within 24 hours",
    challenge_area: "practice",
    evidence_summary: "Incident INC-2026-0040 documented a late medication administration for Casey (Fluoxetine) on 13 April. The incident log shows the error was recorded but no clinical review or formal post-incident debrief has been evidenced within the 24-hour window required by the home's medication policy.",
    challenge_text: "The late administration of Fluoxetine (a psychiatric medication) for Casey constitutes a medication error requiring clinical oversight. I have seen no evidence that a pharmacist or prescriber review was completed, nor that a PIR (Post Incident Review) debrief was held with the staff member. This must be addressed with evidence of review provided.",
    escalation_level: "standard",
    manager_response: "GP was notified on the day (13 April). Dr Chen advised that a single late dose of Fluoxetine is unlikely to cause harm but requested monitoring of mood for 48 hours. Staff debrief was completed verbally on shift but not yet documented. Written PIR to be completed by 22 April.",
    manager_responded_at: "2026-04-15T10:00:00Z",
    manager_responded_by: "staff_edward",
    action_required: "Complete and file formal PIR by 22 April. Review medication administration training with the staff member involved.",
    action_due_date: "2026-04-22",
    status: "responded",
    aria_generated: false,
    created_by: "staff_darren",
    created_at: "2026-04-15T09:00:00Z",
    updated_at: "2026-04-15T10:00:00Z",
  },
];

// ── Seed: RI Alerts ───────────────────────────────────────────────────────────

intelligenceStore.riAlerts = [
  {
    id: "ria_001",
    home_id: "home_oak",
    alert_type: "safeguarding_risk",
    severity: "critical",
    title: "Contextual safeguarding escalation required — Alex W",
    description: "Three missing from care episodes in 90 days with an escalating pattern of contextual risk. MASH referral not confirmed. Alex is associating with unknown older males. Immediate multi-agency strategy discussion required.",
    data_evidence: { mfc_episodes: 3, contextual_risk: true, mash_referral_pending: true, last_episode: "2026-04-01" },
    is_resolved: false,
    auto_generated: true,
    linked_challenge_id: "ric_001",
    created_by: "cara",
    created_at: "2026-04-14T08:00:00Z",
  },
  {
    id: "ria_002",
    home_id: "home_oak",
    alert_type: "training_gap",
    severity: "high",
    title: "Mandatory training expired — 2 staff currently on shift",
    description: "First aid and safeguarding training has expired for two staff members who are currently rostered. Under Children's Homes Regulations and Ofsted inspection framework, this represents a compliance risk requiring immediate action.",
    data_evidence: { expired_staff: ["staff_ryan", "staff_lackson"], expired_types: ["first_aid", "safeguarding_l3"], last_checked: "2026-04-12" },
    is_resolved: false,
    auto_generated: true,
    linked_challenge_id: "ric_003",
    created_by: "cara",
    created_at: "2026-04-12T08:00:00Z",
  },
  {
    id: "ria_003",
    home_id: "home_oak",
    alert_type: "supervision_gap",
    severity: "medium",
    title: "Supervision overdue — 2 staff members (5+ weeks)",
    description: "Anna T and Chervelle B have not received formal supervision in over 5 weeks. This falls below the regulatory requirement and has been formally challenged. Supervisions are now scheduled but not yet completed.",
    data_evidence: { overdue_staff: ["staff_anna", "staff_chervelle"], weeks_overdue: [5.5, 5], scheduled: true },
    is_resolved: false,
    auto_generated: true,
    linked_challenge_id: "ric_002",
    created_by: "cara",
    created_at: "2026-04-13T08:00:00Z",
  },
  {
    id: "ria_004",
    home_id: "home_oak",
    alert_type: "repeated_incident",
    severity: "high",
    title: "Repeated restraint incidents — de-escalation training recommended",
    description: "Three physical intervention / restraint incidents recorded in the last 30 days. Post-incident analysis suggests de-escalation opportunities may have been missed. Team de-escalation refresher recommended as a preventative measure.",
    data_evidence: { restraint_count: 3, period_days: 30, de_escalation_training_current: false },
    is_resolved: false,
    auto_generated: true,
    created_by: "cara",
    created_at: "2026-04-11T08:00:00Z",
  },
  // ── Historically resolved alerts (evidence for Reg 45) ───────────────────
  {
    id: "ria_005",
    home_id: "home_oak",
    alert_type: "training_gap",
    severity: "medium",
    title: "First aid certificates expired — 3 staff",
    description: "Three staff members' first aid certificates lapsed. Renewal training commissioned and completed.",
    is_resolved: true,
    resolved_at: "2026-03-20T11:00:00Z",
    resolved_by: "staff_ryan",
    resolution_note: "All three staff completed accredited first aid renewal training on 20 March 2026. Certificates uploaded to compliance records.",
    auto_generated: true,
    created_by: "cara",
    created_at: "2026-03-01T08:00:00Z",
  },
  {
    id: "ria_006",
    home_id: "home_oak",
    alert_type: "supervision_gap",
    severity: "medium",
    title: "Supervision backlog — 4 staff overdue",
    description: "Four staff members were overdue supervision following staff sickness and rota pressures in February.",
    is_resolved: true,
    resolved_at: "2026-03-10T16:00:00Z",
    resolved_by: "staff_darren",
    resolution_note: "All four overdue supervisions completed by 10 March 2026. Rota adjusted to protect supervision time.",
    auto_generated: true,
    created_by: "cara",
    created_at: "2026-02-28T08:00:00Z",
  },
  // ── Additional alerts for richer dataset ───────────────────────────────────
  {
    id: "ria_007",
    home_id: "home_oak",
    alert_type: "missing_compliance",
    severity: "high",
    title: "Fire drill not completed — overdue by 12 days",
    description: "The monthly fire evacuation drill scheduled for 18 April has not been conducted. Children's Homes Regulations require monthly fire drills with documented outcomes. This represents a safety compliance gap.",
    data_evidence: { scheduled_date: "2026-04-18", days_overdue: 12, last_drill: "2026-03-15" },
    is_resolved: false,
    auto_generated: true,
    created_by: "cara",
    created_at: "2026-04-30T07:00:00Z",
  },
  {
    id: "ria_008",
    home_id: "home_oak",
    alert_type: "overdue_action",
    severity: "medium",
    title: "Reg 44 recommendation not actioned — 18 days overdue",
    description: "Two recommendations from the January Reg 44 independent visit remain open. The visitor recommended care plan updates for two young people within 5 working days. The target was missed and updates have still not been completed.",
    data_evidence: { visit_id: "r44_001", open_recommendations: 2, days_overdue: 18 },
    is_resolved: false,
    auto_generated: true,
    linked_challenge_id: "ric_002",
    created_by: "cara",
    created_at: "2026-04-28T08:00:00Z",
  },
  {
    id: "ria_009",
    home_id: "home_oak",
    alert_type: "weak_oversight",
    severity: "medium",
    title: "Management oversight gaps — daily log entries unchecked",
    description: "Seven daily log entries from the past two weeks have not received management sign-off. Consistent management oversight of day-to-day records is essential for quality assurance and early identification of concerns.",
    data_evidence: { unchecked_entries: 7, period_days: 14, affected_staff: ["staff_anna", "staff_ryan", "staff_lackson"] },
    is_resolved: false,
    auto_generated: true,
    created_by: "cara",
    created_at: "2026-04-25T09:00:00Z",
  },
  {
    id: "ria_010",
    home_id: "home_oak",
    alert_type: "rising_risk",
    severity: "high",
    title: "Escalating peer conflict — Jordan M and Casey T",
    description: "Four verbal altercations and one physical incident between Jordan and Casey in the last 10 days. The frequency is increasing. Risk assessment requires updating and a targeted intervention strategy should be developed.",
    data_evidence: { incidents: 5, period_days: 10, physical: 1, trend: "escalating" },
    is_resolved: false,
    auto_generated: true,
    created_by: "cara",
    created_at: "2026-04-27T14:00:00Z",
  },
  // ── More resolved alerts for history ────────────────────────────────────────
  {
    id: "ria_011",
    home_id: "home_oak",
    alert_type: "missing_compliance",
    severity: "high",
    title: "DBS renewals overdue — 2 staff",
    description: "Two staff members' enhanced DBS checks are due for renewal and have not been submitted for processing.",
    is_resolved: true,
    resolved_at: "2026-03-28T14:00:00Z",
    resolved_by: "staff_darren",
    resolution_note: "Both DBS renewal applications submitted 25 March. Confirmation received 28 March. Certificates uploaded to HR records.",
    auto_generated: true,
    created_by: "cara",
    created_at: "2026-03-15T08:00:00Z",
  },
  {
    id: "ria_012",
    home_id: "home_oak",
    alert_type: "overdue_action",
    severity: "medium",
    title: "Key work sessions behind schedule — all three YP",
    description: "Scheduled key work sessions for all three young people are behind the weekly cadence by 8–12 days due to staff absence.",
    is_resolved: true,
    resolved_at: "2026-02-20T16:00:00Z",
    resolved_by: "staff_chervelle",
    resolution_note: "All key work sessions caught up by 20 February. Contingency key work allocation process agreed in team meeting.",
    auto_generated: true,
    created_by: "cara",
    created_at: "2026-02-10T08:00:00Z",
  },
  {
    id: "ria_013",
    home_id: "home_oak",
    alert_type: "rising_risk",
    severity: "critical",
    title: "Night waking pattern — Casey T emotional wellbeing concern",
    description: "Casey has woken distressed on 6 of the last 7 nights. Sleep deprivation is impacting daytime behaviour and school attendance. Therapeutic input referral should be considered.",
    is_resolved: true,
    resolved_at: "2026-04-05T11:00:00Z",
    resolved_by: "staff_darren",
    resolution_note: "CAMHS referral accepted 1 April. Initial consultation 3 April. Sleep hygiene plan implemented with sensory support. Night waking reduced to 1–2 per week by 5 April.",
    auto_generated: true,
    created_by: "cara",
    created_at: "2026-03-25T08:00:00Z",
  },
  {
    id: "ria_014",
    home_id: "home_oak",
    alert_type: "weak_oversight",
    severity: "low",
    title: "Handover notes quality — inconsistent detail",
    description: "Analysis of the last 10 shift handovers shows 4 had minimal detail. Best practice recommends consistent, structured handovers covering all young people and outstanding tasks.",
    is_resolved: true,
    resolved_at: "2026-04-08T09:00:00Z",
    resolved_by: "staff_darren",
    resolution_note: "Handover template updated with mandatory sections. Team briefed in weekly meeting. Quality of subsequent handovers markedly improved.",
    auto_generated: true,
    created_by: "cara",
    created_at: "2026-04-01T08:00:00Z",
  },
];

// ── Shared date helper (used by Reg 44, Care Plans, Complaints, PI Debriefs) ─
const dFN = (n: number) => new Date(Date.now() + n * 86400000).toISOString().split("T")[0];

// ── Seed: Reg 44 Independent Visits ──────────────────────────────────────────

intelligenceStore.reg44Visits = [
  {
    id: "r44_001",
    home_id: "home_oak",
    visit_number: 1,
    visit_date: "2026-01-14",
    scheduled_date: "2026-01-14",
    visitor_name: "Patricia Osei",
    visitor_organisation: "Osei Independent Consultancy",
    status: "ri_reviewed",
    report_received_date: "2026-01-22",
    report_document_id: null,
    overall_finding: "satisfactory",
    findings: [
      {
        id: "r44f_001",
        visit_id: "r44_001",
        type: "strength",
        area: "Safeguarding",
        description: "All safeguarding records are up to date and accessible. Staff demonstrated clear knowledge of escalation pathways and the home's safeguarding lead was able to articulate the single central record process.",
        evidence_cited: "SCR reviewed; safeguarding folder inspection; staff interviews",
        severity: null,
        action_required: null,
        action_completed: false,
        action_completed_at: null,
        action_completed_by: null,
        action_evidence: null,
      },
      {
        id: "r44f_002",
        visit_id: "r44_001",
        type: "recommendation",
        area: "Care Planning",
        description: "Two care plans reviewed had not been updated following recent placement review meetings. The plans should reflect the outcomes of those reviews within 5 working days.",
        evidence_cited: "Care plan audit — YP ref CYP_002, CYP_003",
        severity: "minor",
        action_required: "Update both care plans to reflect January placement review outcomes",
        action_completed: true,
        action_completed_at: "2026-01-27T10:00:00Z",
        action_completed_by: "staff_darren",
        action_evidence: "Both plans updated and signed off by RM 27/01/2026",
      },
      {
        id: "r44f_003",
        visit_id: "r44_001",
        type: "strength",
        area: "Staff Practice",
        description: "Positive staff culture observed. Staff interactions with young people were warm, child-centred and trauma-informed. Two young people spoken to independently expressed feeling safe and heard by staff.",
        evidence_cited: "Observation; YP voice conversations",
        severity: null,
        action_required: null,
        action_completed: false,
        action_completed_at: null,
        action_completed_by: null,
        action_evidence: null,
      },
    ],
    manager_response: "Thank you for the thorough visit report. We are pleased the safeguarding arrangements and staff practice were noted positively. Regarding the care plan recommendation, both plans have now been updated by 27 January and signed off. We will implement a post-review update tracker to prevent recurrence.",
    manager_response_date: "2026-01-27T11:00:00Z",
    manager_response_by: "staff_darren",
    ri_review_date: "2026-02-03T09:00:00Z",
    ri_review_by: "staff_ri",
    ri_comments: "Satisfactory first visit of the year. Actions completed promptly. Reg 45 period 1 baseline looks positive.",
    aria_summary: "Visit 1 (Jan 2026) found the home performing satisfactorily. Two care plan updates were identified and completed within 5 working days. Safeguarding arrangements and staff practice received positive observations. No outstanding actions.",
    created_at: "2026-01-22T14:00:00Z",
    created_by: "staff_darren",
    updated_at: "2026-02-03T09:00:00Z",
  },
  {
    id: "r44_002",
    home_id: "home_oak",
    visit_number: 2,
    visit_date: "2026-02-18",
    scheduled_date: "2026-02-18",
    visitor_name: "Patricia Osei",
    visitor_organisation: "Osei Independent Consultancy",
    status: "ri_reviewed",
    report_received_date: "2026-02-25",
    report_document_id: null,
    overall_finding: "concerns_identified",
    findings: [
      {
        id: "r44f_004",
        visit_id: "r44_002",
        type: "concern",
        area: "Supervision",
        description: "Two members of staff had not received formal supervision within the required 6-week timeframe. Records show supervisions were 5 weeks overdue at the time of the visit. This is a regulatory compliance gap.",
        evidence_cited: "Supervision log review; staff records",
        severity: "moderate",
        action_required: "Schedule and complete overdue supervisions within 2 weeks. Review supervision scheduling system to prevent recurrence.",
        action_completed: true,
        action_completed_at: "2026-03-10T16:00:00Z",
        action_completed_by: "staff_darren",
        action_evidence: "Both supervisions completed by 10/03/2026. Supervision schedule rebuilt with calendar alerts.",
      },
      {
        id: "r44f_005",
        visit_id: "r44_002",
        type: "concern",
        area: "Mandatory Training",
        description: "First aid training has expired for one member of staff currently rostered for unsupported night shifts. This must be addressed immediately as it constitutes a regulatory and safety risk.",
        evidence_cited: "Training matrix review; rota inspection",
        severity: "significant",
        action_required: "Remove affected staff member from unsupported shifts until first aid is renewed. Book first aid training within 7 days.",
        action_completed: true,
        action_completed_at: "2026-02-28T14:00:00Z",
        action_completed_by: "staff_darren",
        action_evidence: "Staff member moved to supported shifts from 19/02. First aid booked and completed 28/02/2026.",
      },
      {
        id: "r44f_006",
        visit_id: "r44_002",
        type: "strength",
        area: "Young People's Voice",
        description: "Child-centred practice remains a strength. The home has recently introduced weekly 'my time' sessions where each young person spends 30 minutes with their keyworker. Young people spoken to were positive about this initiative.",
        evidence_cited: "Keywork records; YP conversations",
        severity: null,
        action_required: null,
        action_completed: false,
        action_completed_at: null,
        action_completed_by: null,
        action_evidence: null,
      },
    ],
    manager_response: "We take the concerns raised seriously. Both overdue supervisions have now been completed and the training gap has been resolved. We have introduced a rota check at the start of each month to catch expiring training proactively. A revised supervision schedule with calendar alerts has been shared with the RI.",
    manager_response_date: "2026-03-12T10:00:00Z",
    manager_response_by: "staff_darren",
    ri_review_date: "2026-03-18T09:00:00Z",
    ri_review_by: "staff_ri",
    ri_comments: "Concerns noted. Actions are now all completed and verified. Supervision scheduling and training monitoring must remain a priority for Period 2 Reg 45. I will carry these themes into the next visit.",
    aria_summary: "Visit 2 (Feb 2026) identified two compliance concerns: overdue supervision for 2 staff (5 weeks), and expired first aid training for 1 rostered staff member. Both were resolved by 10 March. YP voice practice noted as a positive strength.",
    created_at: "2026-02-25T15:00:00Z",
    created_by: "staff_darren",
    updated_at: "2026-03-18T09:00:00Z",
  },
  {
    id: "r44_003",
    home_id: "home_oak",
    visit_number: 3,
    visit_date: "2026-03-24",
    scheduled_date: "2026-03-24",
    visitor_name: "Patricia Osei",
    visitor_organisation: "Osei Independent Consultancy",
    status: "manager_response_submitted",
    report_received_date: "2026-04-01",
    report_document_id: null,
    overall_finding: "concerns_identified",
    findings: [
      {
        id: "r44f_007",
        visit_id: "r44_003",
        type: "concern",
        area: "Safeguarding",
        description: "One young person (Alex W) has had three missing from care episodes in the preceding 90 days. While safeguarding referrals have been made, the multi-agency strategy meeting has not yet been convened. There is a risk that the contextual safeguarding picture is not being addressed at sufficient pace.",
        evidence_cited: "Missing episode logs; safeguarding records; MASH correspondence",
        severity: "significant",
        action_required: "Escalate to MASH to confirm strategy meeting date. Ensure contextual safeguarding assessment is completed within 10 working days.",
        action_completed: false,
        action_completed_at: null,
        action_completed_by: null,
        action_evidence: null,
      },
      {
        id: "r44f_008",
        visit_id: "r44_003",
        type: "concern",
        area: "Physical Intervention",
        description: "Three physical intervention incidents recorded in the last 30 days. Post-incident de-brief records show incomplete analysis of triggers and learning. The home should ensure all PI records include a structured de-escalation review.",
        evidence_cited: "Incident log; PI forms; post-incident de-brief records",
        severity: "moderate",
        action_required: "Review all three PI records with the team. Complete structured de-escalation review template for each. Book team de-escalation refresher within 4 weeks.",
        action_completed: false,
        action_completed_at: null,
        action_completed_by: null,
        action_evidence: null,
      },
      {
        id: "r44f_009",
        visit_id: "r44_003",
        type: "recommendation",
        area: "Environment",
        description: "The communal lounge fire exit has a delayed closing mechanism that has been reported twice in maintenance logs but not yet rectified. This must be escalated to the provider's facilities team as a priority.",
        evidence_cited: "Maintenance log; premises inspection",
        severity: "minor",
        action_required: "Escalate to facilities team. Confirm rectification date. Interim risk assessment to be completed.",
        action_completed: true,
        action_completed_at: "2026-04-08T12:00:00Z",
        action_completed_by: "staff_darren",
        action_evidence: "Facilities attended 8/04. Mechanism replaced. Fire safety check signed off.",
      },
      {
        id: "r44f_010",
        visit_id: "r44_003",
        type: "strength",
        area: "Records & Documentation",
        description: "Daily log quality has improved noticeably since the last visit. Entries are more reflective, evidence-based and child-centred. Staff are evidencing responses to young people's needs rather than simply reporting events.",
        evidence_cited: "Daily logs sample — 12 entries reviewed",
        severity: null,
        action_required: null,
        action_completed: false,
        action_completed_at: null,
        action_completed_by: null,
        action_evidence: null,
      },
    ],
    manager_response: "We acknowledge the concerns raised around Alex W's contextual safeguarding and the physical intervention records. We have escalated to MASH today (02/04/2026) and requested the strategy meeting be convened within the week. The three PI records are being reviewed with the team this week and a de-escalation refresher has been booked for 28/04/2026. The fire exit has been fixed. We are committed to addressing all outstanding items.",
    manager_response_date: "2026-04-02T14:30:00Z",
    manager_response_by: "staff_darren",
    ri_review_date: null,
    ri_review_by: null,
    ri_comments: null,
    aria_summary: "Visit 3 (Mar 2026) identified two ongoing concerns: contextual safeguarding around Alex W (3 MFC episodes, strategy meeting pending) and incomplete PI de-brief records following 3 physical interventions. Environment recommendation (fire exit) was resolved quickly. Daily log quality noted as an improving strength. Two actions remain open.",
    created_at: "2026-04-01T09:00:00Z",
    created_by: "staff_darren",
    updated_at: "2026-04-02T14:30:00Z",
  },
  {
    id: "r44_004",
    home_id: "home_oak",
    visit_number: 4,
    visit_date: null,
    scheduled_date: "2026-05-06",
    visitor_name: "Patricia Osei",
    visitor_organisation: "Osei Independent Consultancy",
    status: "scheduled",
    report_received_date: null,
    report_document_id: null,
    overall_finding: null,
    findings: [],
    manager_response: null,
    manager_response_date: null,
    manager_response_by: null,
    ri_review_date: null,
    ri_review_by: null,
    ri_comments: null,
    aria_summary: null,
    created_at: "2026-04-14T09:00:00Z",
    created_by: "staff_darren",
    updated_at: "2026-04-14T09:00:00Z",
  },
];

// ── Seed: Care Plans ─────────────────────────────────────────────────────────

intelligenceStore.carePlans = [
  // ── Alex W — Care Plan ───────────────────────────────────────────────────
  {
    id: "cp_alex",
    home_id: "home_oak",
    child_id: "yp_alex",
    version: 3,
    status: "active",
    placement_start: "2025-09-01",
    current_placement_type: "Full-time residential",
    legal_status: "Section 20",
    goals: [
      {
        id: "cpg_001",
        domain: "safety",
        title: "Reduce missing from care episodes",
        description: "Alex has had three missing from care episodes in the last 90 days. The goal is to address the underlying triggers and reduce the frequency and risk level of absences.",
        desired_outcome: "Zero MFC episodes in a 30-day period. Alex able to articulate safe people and safe places. Contextual safeguarding assessment completed.",
        actions: [
          "Complete contextual safeguarding assessment with social worker",
          "Develop safety plan with Alex's involvement",
          "Pre-agree community time boundaries and check-in protocol",
          "Weekly risk review with keyworker (Edward)",
        ],
        status: "attention_needed",
        progress_note: "Three MFC episodes in March-April. Strategy meeting pending. Alex engaged in safety planning conversation on 10/04 but remains at risk. Contextual safeguarding assessment underway with Karen Holding.",
        target_date: dFN(30),
        achieved_date: null,
        last_reviewed: dFN(-7),
        reviewed_by: "staff_darren",
        evidence: "MFC incident logs INC-2026-0041, INC-2026-0035. Safeguarding disclosure INC-2026-0043.",
      },
      {
        id: "cpg_002",
        domain: "emotional_behavioural",
        title: "Develop co-regulation strategies for distress and conflict",
        description: "Alex becomes dysregulated during difficult family contact and conversations about court proceedings. Three physical interventions in the last 30 days, all triggered by high-distress situations.",
        desired_outcome: "Alex can identify their own distress signals and request support before reaching crisis point. Reduction in PI incidents to zero in a 60-day period.",
        actions: [
          "Introduce 'feelings thermometer' tool in keywork sessions",
          "Staff to use co-regulation techniques consistently across all shifts",
          "Pre-call preparation protocol for family contact",
          "Refer to CAMHS for therapeutic support — assess suitability for trauma-informed therapy",
        ],
        status: "in_progress",
        progress_note: "Edward has introduced the feelings thermometer. Alex engaged initially but disengaged during high-stress period in April. Pre-call protocol implemented following PI 1 (INC-2026-0035). CAMHS referral submitted 02/04.",
        target_date: dFN(60),
        achieved_date: null,
        last_reviewed: dFN(-5),
        reviewed_by: "staff_edward",
        evidence: "PI debriefs pid_001, pid_002, pid_003. Keywork records April 2026.",
      },
      {
        id: "cpg_003",
        domain: "education",
        title: "Maintain consistent school attendance",
        description: "Alex is currently attending Derby Alternative Provision. Attendance has been inconsistent due to placement instability and emotional difficulties.",
        desired_outcome: "Alex achieves 85%+ attendance at Derby Alternative Provision. Alex completes allocated coursework for English and Maths.",
        actions: [
          "Regular contact with school to monitor attendance",
          "Ensure transport is booked and reliable each morning",
          "Morning routine support — staff to check Alex is ready and motivated",
          "Liaise with school SENCO about additional support needs",
        ],
        status: "on_track",
        progress_note: "Attendance at 78% this half-term — improving from 60% last term. School reports Alex is engaging better with staff. One exclusion in March due to a verbal confrontation.",
        target_date: dFN(90),
        achieved_date: null,
        last_reviewed: dFN(-14),
        reviewed_by: "staff_edward",
        evidence: "School attendance records. PEP minutes March 2026.",
      },
      {
        id: "cpg_004",
        domain: "health",
        title: "Address self-harm risk",
        description: "Alex has self-harm risk flags following disclosures and the PI incident of 18/04 where a sharp object was involved. CAMHS involvement is critical.",
        desired_outcome: "Alex has access to appropriate therapeutic support. Self-harm risk is actively managed within the placement. Safety plan is in place and reviewed monthly.",
        actions: [
          "Maintain sharp items log and bedroom safety check",
          "CAMHS assessment confirmed and regular sessions established",
          "Alex has a named trusted adult — Edward — for disclosure conversations",
          "Staff trained in self-harm response protocol",
        ],
        status: "attention_needed",
        progress_note: "CAMHS referral submitted but assessment not yet scheduled. Safety plan in place. One self-harm incident 18/04 (INC-2026-0039). Bedroom safety review completed 19/04.",
        target_date: dFN(14),
        achieved_date: null,
        last_reviewed: dFN(-9),
        reviewed_by: "staff_darren",
        evidence: "Incident INC-2026-0039. CAMHS referral letter 02/04/2026.",
      },
      {
        id: "cpg_005",
        domain: "identity",
        title: "Support Alex's understanding of his legal status and rights",
        description: "Alex is placed under Section 20 and has expressed confusion and distress about upcoming court proceedings. He needs to understand his rights, the process, and have access to an advocate.",
        desired_outcome: "Alex is allocated an independent advocate. Alex can articulate his own views about placement and future. Court proceedings progressed with Alex's voice heard.",
        actions: [
          "Refer to advocacy service for independent advocate allocation",
          "Keyworker to complete 'Understanding Your Care' module in keywork",
          "Social worker to explain Section 20 and court process in accessible terms",
        ],
        status: "in_progress",
        progress_note: "Advocate referral submitted 15/04. Not yet allocated. Edward has introduced understanding your care themes in keywork — Alex engaged positively.",
        target_date: dFN(30),
        achieved_date: null,
        last_reviewed: dFN(-12),
        reviewed_by: "staff_edward",
        evidence: "Keywork records. Advocate referral letter.",
      },
    ],
    last_lac_review: dFN(-45),
    next_lac_review: dFN(135),
    lac_review_frequency_months: 6,
    keyworker_id: "staff_edward",
    rm_id: "staff_darren",
    rm_sign_off_date: dFN(-7),
    rm_sign_off_by: "staff_darren",
    strengths_summary: "Alex is articulate, perceptive, and has strong rapport with Edward. When regulated, Alex engages well with support and shows insight into his own behaviour. School attendance is improving.",
    concerns_summary: "Three missing from care episodes in 90 days. Three physical interventions triggered by distress. Self-harm risk elevated. CAMHS not yet engaged. Contextual safeguarding concerns around criminal exploitation.",
    aria_overview: "Alex's care plan has 5 active goals across safety, emotional wellbeing, education, health, and identity. Two goals are currently flagged as 'attention needed' (safety/MFC and self-harm). Education is on track with improving attendance. The most urgent priorities are: completing the contextual safeguarding assessment, securing CAMHS engagement, and reducing PI frequency through consistent co-regulation practice.",
    created_at: dFN(-180) + "T09:00:00Z",
    updated_at: dFN(-7) + "T10:00:00Z",
    created_by: "staff_darren",
  },

  // ── Jordan M — Care Plan ─────────────────────────────────────────────────
  {
    id: "cp_jordan",
    home_id: "home_oak",
    child_id: "yp_jordan",
    version: 2,
    status: "active",
    placement_start: "2025-11-15",
    current_placement_type: "Full-time residential",
    legal_status: "Section 31 (Full Care Order)",
    goals: [
      {
        id: "cpg_006",
        domain: "education",
        title: "Achieve regular attendance at Highfields Academy",
        description: "Jordan is enrolled at Highfields Academy and has the ability to achieve well academically. Attendance needs to be consistent and Jordan needs to feel settled and supported at school.",
        desired_outcome: "Attendance above 90%. Jordan achieves predicted grades in at least 3 GCSEs. Positive relationship with form tutor maintained.",
        actions: [
          "Morning routine support — homework and uniform check each day",
          "Monthly liaison between home staff and school",
          "Jordan to have a named school mentor",
          "Address any bullying or peer issues promptly",
        ],
        status: "on_track",
        progress_note: "Attendance at 91% this term. Jordan is performing well in English and Science. No significant pastoral concerns reported by school. Jordan says he enjoys school and values the routine.",
        target_date: dFN(120),
        achieved_date: null,
        last_reviewed: dFN(-21),
        reviewed_by: "staff_anna",
        evidence: "School reports. PEP minutes January 2026.",
      },
      {
        id: "cpg_007",
        domain: "family_social",
        title: "Maintain and strengthen family contact",
        description: "Jordan has supervised contact with his father (2 hours weekly) and indirect contact with his mother by letter (monthly). Jordan values family relationships but contact can be emotionally difficult.",
        desired_outcome: "Consistent contact with father maintained. Jordan able to express his feelings about family contact and receive support. Contact records completed after every visit.",
        actions: [
          "Weekly supervised contact with father — Chervelle or Anna to facilitate",
          "Post-contact debrief with Jordan after each visit",
          "Monthly letter exchange with mother facilitated by keyworker",
          "Contact record completed within 24 hours of each contact",
        ],
        status: "on_track",
        progress_note: "Contact with father has been consistent — one cancellation by father in February. Jordan was disappointed but managed well. Post-contact debriefs are happening. Jordan wrote a letter to his mother in March.",
        target_date: null,
        achieved_date: null,
        last_reviewed: dFN(-14),
        reviewed_by: "staff_anna",
        evidence: "Contact records. Daily logs.",
      },
      {
        id: "cpg_008",
        domain: "emotional_behavioural",
        title: "Develop assertiveness and conflict resolution skills",
        description: "Jordan can become frustrated when he feels unheard or when decisions are made without his input. He has raised a formal complaint (CMP-2026-001) about a staff interaction. This goal aims to support Jordan to express himself effectively without conflict.",
        desired_outcome: "Jordan is able to express his views calmly and feel heard. Jordan understands the complaints process and feels able to use it. No formal complaints in the next 6 months.",
        actions: [
          "Keywork theme: assertiveness and rights — 'my voice matters'",
          "Staff to actively seek Jordan's input in house decisions",
          "Explore whether Jordan would benefit from advocacy",
          "Ensure Jordan knows his rights and the complaints process",
        ],
        status: "in_progress",
        progress_note: "Jordan raised a formal complaint in April which was partially upheld (CMP-2026-001). This is positive — he used the process correctly rather than acting out. Complaint resolved. Chore rota reviewed. Assertiveness theme introduced in keywork.",
        target_date: dFN(90),
        achieved_date: null,
        last_reviewed: dFN(-7),
        reviewed_by: "staff_anna",
        evidence: "Complaint record CMP-2026-001. Keywork records.",
      },
      {
        id: "cpg_009",
        domain: "health",
        title: "Maintain GP registration and health monitoring",
        description: "Jordan has a Penicillin allergy recorded. Routine health checks and dental appointments need to be maintained. Jordan has no current active health conditions.",
        desired_outcome: "Annual health assessment completed. Dental check up-to-date. Jordan's allergy is documented across all health records.",
        actions: [
          "Book annual health assessment with LAC nurse",
          "Dental check-up booked for May 2026",
          "Ensure allergy documented on all medication and health records",
        ],
        status: "on_track",
        progress_note: "LAC health assessment booked for 15 May 2026. Dental check-up scheduled. Allergy documented on MAR sheet and care plan cover sheet.",
        target_date: dFN(30),
        achieved_date: null,
        last_reviewed: dFN(-21),
        reviewed_by: "staff_chervelle",
        evidence: "Health records. GP correspondence.",
      },
    ],
    last_lac_review: dFN(-30),
    next_lac_review: dFN(150),
    lac_review_frequency_months: 6,
    keyworker_id: "staff_anna",
    rm_id: "staff_darren",
    rm_sign_off_date: dFN(-21),
    rm_sign_off_by: "staff_darren",
    strengths_summary: "Jordan is engaging positively with placement. Strong school attendance, good relationships with staff and peers, and is using appropriate processes (complaints) to express his views. Family contact is consistent.",
    concerns_summary: "Jordan can become frustrated when decisions are made without his input. One partially upheld complaint in April 2026. Requires consistent co-regulation support and active involvement in decisions.",
    aria_overview: "Jordan's care plan has 4 goals across education, family contact, emotional wellbeing, and health. All goals are currently on track or in progress. Education attendance is strong at 91%. The complaint raised in April was handled correctly and resolved. Next LAC review in 5 months.",
    created_at: dFN(-160) + "T10:00:00Z",
    updated_at: dFN(-7) + "T10:00:00Z",
    created_by: "staff_darren",
  },

  // ── Casey T — Care Plan ──────────────────────────────────────────────────
  {
    id: "cp_casey",
    home_id: "home_oak",
    child_id: "yp_casey",
    version: 1,
    status: "active",
    placement_start: "2026-01-10",
    current_placement_type: "Full-time residential",
    legal_status: "Section 31 (Full Care Order)",
    goals: [
      {
        id: "cpg_010",
        domain: "health",
        title: "Establish consistent medication routine",
        description: "Casey is prescribed Fluoxetine for depression and has a history of medication refusal, particularly in the morning. One late administration incident has been recorded (INC-2026-0040).",
        desired_outcome: "100% medication compliance with no more than one refusal per month. Casey understands why she takes her medication. GP and prescriber review completed.",
        actions: [
          "Medication administered by Chervelle consistently — build therapeutic relationship",
          "Discuss medication openly with Casey — offer choice of time where possible",
          "Review morning routine with GP",
          "Monthly medication review with prescriber",
        ],
        status: "in_progress",
        progress_note: "One late administration in April (INC-2026-0040). Compliance improving since Chervelle took primary role. Casey has engaged with conversation about her medication and now understands the benefits better. GP review requested.",
        target_date: dFN(60),
        achieved_date: null,
        last_reviewed: dFN(-10),
        reviewed_by: "staff_chervelle",
        evidence: "MAR sheet. Incident INC-2026-0040.",
      },
      {
        id: "cpg_011",
        domain: "health",
        title: "Improve sleep quality and establish bedtime routine",
        description: "Casey has sleep disturbances flagged as a risk. She frequently struggles to settle at night and wakes multiple times. This impacts on her mood, school engagement, and medication compliance.",
        desired_outcome: "Casey has a consistent bedtime routine. Sleep disturbances reduce to fewer than 3 per week. GP assessment of sleep completed.",
        actions: [
          "Establish consistent bedtime routine — no screens after 9pm",
          "Wind-down activity before bed — reading, hot drink, music",
          "Record sleep patterns on daily log for 4 weeks",
          "Refer to GP for sleep assessment if no improvement after 4 weeks",
        ],
        status: "in_progress",
        progress_note: "Bedtime routine introduced. Casey has engaged reasonably well but still has disturbed nights approximately 4 times per week. Recording sleep data daily. Referral to GP planned if no improvement by May.",
        target_date: dFN(45),
        achieved_date: null,
        last_reviewed: dFN(-7),
        reviewed_by: "staff_chervelle",
        evidence: "Daily logs — sleep section.",
      },
      {
        id: "cpg_012",
        domain: "education",
        title: "Reintegrate into mainstream school or appropriate provision",
        description: "Casey is currently not in any school placement following move to Chamberlain House. She was excluded from her previous school. A new placement at Allestree Woodlands has been identified but not yet started.",
        desired_outcome: "Casey starts at Allestree Woodlands by May 2026. Casey has a positive transition with a named mentor. PEP meeting held within 20 days of joining.",
        actions: [
          "Confirm start date at Allestree Woodlands with LA",
          "Arrange pre-placement visit for Casey",
          "PEP meeting within 20 days of starting",
          "Transport arranged",
        ],
        status: "attention_needed",
        progress_note: "Start date confirmed for 05/05/2026. Pre-placement visit scheduled for 01/05/2026. PEP meeting to be arranged. Casey has mixed feelings about the new school.",
        target_date: dFN(10),
        achieved_date: null,
        last_reviewed: dFN(-5),
        reviewed_by: "staff_chervelle",
        evidence: "LA correspondence. School admission letter.",
      },
      {
        id: "cpg_013",
        domain: "emotional_behavioural",
        title: "Therapeutic support for depression and low self-esteem",
        description: "Casey has been diagnosed with depression and has low self-esteem. She benefits from consistent, warm relationships with staff and needs therapeutic support to process past experiences.",
        desired_outcome: "Casey is engaged with appropriate therapeutic support (CAMHS or equivalent). Casey can identify and express her emotions. Reduction in low-mood episodes.",
        actions: [
          "Maintain CAMHS referral — chase fortnightly",
          "Keywork sessions to explore feelings, strengths, and aspirations",
          "Introduce LIVERS-based intervention in keywork",
          "Staff to use consistent trauma-informed language and approach",
        ],
        status: "in_progress",
        progress_note: "CAMHS referral submitted January 2026. Assessment appointment in June 2026 confirmed. Keywork with Chervelle is going well — Casey is engaging and has identified three personal strengths. LIVERS introduced in April keywork.",
        target_date: dFN(60),
        achieved_date: null,
        last_reviewed: dFN(-10),
        reviewed_by: "staff_chervelle",
        evidence: "CAMHS referral. Keywork records.",
      },
      {
        id: "cpg_014",
        domain: "identity",
        title: "Celebrate and affirm Casey's mixed heritage identity",
        description: "Casey has mixed heritage (White and South Asian) and has not previously been placed in a setting that actively promotes cultural identity. This goal ensures Casey's identity and culture are celebrated.",
        desired_outcome: "Casey is able to articulate her identity with confidence. Cultural events and foods are included in placement life. Casey feels represented and respected.",
        actions: [
          "Discuss cultural identity in keywork — what matters to Casey",
          "Ensure dietary requirements (vegetarian) are consistently met",
          "Explore cultural activities Casey would enjoy",
          "Include identity theme in care plan review",
        ],
        status: "in_progress",
        progress_note: "Vegetarian diet consistently maintained. Casey has started to share more about her cultural background in keywork. Attended a local art event in April. Casey said she felt proud of who she is.",
        target_date: dFN(90),
        achieved_date: null,
        last_reviewed: dFN(-12),
        reviewed_by: "staff_chervelle",
        evidence: "Keywork records. Daily logs.",
      },
    ],
    last_lac_review: null,
    next_lac_review: dFN(20),
    lac_review_frequency_months: 6,
    keyworker_id: "staff_chervelle",
    rm_id: "staff_darren",
    rm_sign_off_date: dFN(-14),
    rm_sign_off_by: "staff_darren",
    strengths_summary: "Casey is engaging well with staff, particularly Chervelle. She is beginning to open up about her feelings and identity. Medication compliance is improving. CAMHS engagement secured for June.",
    concerns_summary: "Sleep disturbances remain frequent. School placement has only just been confirmed. CAMHS not yet started. Casey is new to placement — still building trust and settling.",
    aria_overview: "Casey's care plan has 5 goals across health, education, emotional wellbeing, and identity. One goal is flagged as 'attention needed' (school placement start). All others are in progress. Key priorities: ensuring school start in May goes smoothly, improving sleep quality, and maintaining CAMHS engagement for June assessment.",
    created_at: dFN(-108) + "T09:00:00Z",
    updated_at: dFN(-5) + "T09:00:00Z",
    created_by: "staff_darren",
  },
];

// ── Seed: Complaints & Representations ───────────────────────────────────────

const addWorkingDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d.toISOString().split("T")[0];
};

intelligenceStore.complaints = [
  {
    id: "cmp_001",
    home_id: "home_oak",
    reference: "CMP-2026-001",
    child_id: "yp_jordan",
    complainant_type: "young_person",
    complainant_name: "Jordan Davies",
    complainant_relationship: null,
    date_received: dFN(-14),
    category: "staff_conduct",
    stage: "stage_1",
    status: "response_sent",
    summary: "Jordan raised a formal complaint that a member of staff spoke to them in a dismissive manner during a disagreement about household chores, and that they did not feel listened to.",
    full_detail: "Jordan felt that the staff member raised their voice and made a sarcastic comment when Jordan questioned why they were expected to complete chores that another young person was not being asked to do. Jordan said this made them feel disrespected and that their feelings were not taken seriously. Jordan requested an apology and a review of the chore rota.",
    outcome: "partially_upheld",
    outcome_detail: "Investigation found the staff member's tone was not consistent with the home's values and standards, though there was no malicious intent. A reflective conversation was held with the staff member, who acknowledged their response. Jordan received a verbal apology and the chore rota was reviewed. Partially upheld — staff conduct and rota both addressed.",
    acknowledgement_due: addWorkingDays(dFN(-14), 3),
    response_due: addWorkingDays(dFN(-14), 10),
    acknowledged_at: dFN(-13) + "T11:00:00Z",
    response_sent_at: dFN(-6) + "T14:30:00Z",
    assigned_to: "staff_darren",
    investigation_notes: "Spoke with Jordan on 15/04. Reviewed daily log entries. Spoke with staff member concerned — they acknowledged their tone was inappropriate under pressure. Spoke with two other staff who witnessed the exchange and confirmed Jordan's account was broadly accurate.",
    lessons_learned: "Staff to receive refresher on de-escalation language under pressure. Chore rota now rotated weekly and displayed on noticeboard.",
    learning_shared: true,
    escalated_to_stage2_at: null,
    escalated_reason: null,
    ombudsman_reference: null,
    timeline: [
      { date: dFN(-14), action: "Complaint received", recorded_by: "staff_darren", note: "Jordan spoke to RM directly. Complaint logged." },
      { date: dFN(-13), action: "Acknowledged in writing", recorded_by: "staff_darren", note: "Written acknowledgement given to Jordan, outlining investigation process." },
      { date: dFN(-11), action: "Investigation commenced", recorded_by: "staff_darren", note: "Interviews with Jordan and relevant staff conducted." },
      { date: dFN(-6), action: "Response sent", recorded_by: "staff_darren", note: "Written outcome letter given to Jordan. Outcome: partially upheld." },
    ],
    includes_safeguarding_element: false,
    linked_incident_id: "inc_003",
    aria_summary: "CMP-2026-001 (Jordan, staff conduct) was partially upheld. Investigation confirmed inappropriate tone by staff. Response sent within statutory 10 working days. Lessons learned and shared with team. Chore rota reviewed. No outstanding actions.",
    created_at: dFN(-14) + "T16:00:00Z",
    updated_at: dFN(-6) + "T14:30:00Z",
    created_by: "staff_darren",
  },
  {
    id: "cmp_002",
    home_id: "home_oak",
    reference: "CMP-2026-002",
    child_id: "yp_alex",
    complainant_type: "parent_carer",
    complainant_name: "Sandra W (Alex's mother)",
    complainant_relationship: "Parent",
    date_received: dFN(-7),
    category: "decisions_about_me",
    stage: "stage_1",
    status: "under_investigation",
    summary: "Alex's mother raised a complaint that she was not informed promptly about Alex's third missing from care episode, and that she only found out through Alex rather than staff. She also complained that she was not invited to the subsequent risk review meeting.",
    full_detail: "Sandra states she was not contacted about Alex's absence on the evening it occurred (04/04/2026), and only discovered Alex had been missing when Alex mentioned it during a phone call the following day. She also states she received no invitation to the safeguarding strategy meeting that followed. She is requesting an explanation and wishes to be included in future planning.",
    outcome: null,
    outcome_detail: null,
    acknowledgement_due: addWorkingDays(dFN(-7), 3),
    response_due: addWorkingDays(dFN(-7), 10),
    acknowledged_at: dFN(-6) + "T10:00:00Z",
    response_sent_at: null,
    assigned_to: "staff_darren",
    investigation_notes: "Reviewing communication logs for MFC episode 3. Checking notification records — initial indication is social worker was notified but parent notification may have been delayed. Checking meeting invite records.",
    lessons_learned: null,
    learning_shared: false,
    escalated_to_stage2_at: null,
    escalated_reason: null,
    ombudsman_reference: null,
    timeline: [
      { date: dFN(-7), action: "Complaint received", recorded_by: "staff_darren", note: "Sandra called the home directly. Complaint logged and investigation begun." },
      { date: dFN(-6), action: "Acknowledged", recorded_by: "staff_darren", note: "Written acknowledgement sent by email and post." },
      { date: dFN(-5), action: "Investigation commenced", recorded_by: "staff_darren", note: "Reviewing notification logs and meeting records." },
    ],
    includes_safeguarding_element: true,
    linked_incident_id: "inc_001",
    aria_summary: null,
    created_at: dFN(-7) + "T11:30:00Z",
    updated_at: dFN(-5) + "T09:00:00Z",
    created_by: "staff_darren",
  },
  {
    id: "cmp_003",
    home_id: "home_oak",
    reference: "CMP-2026-003",
    child_id: "yp_casey",
    complainant_type: "young_person",
    complainant_name: "Casey Morgan",
    complainant_relationship: null,
    date_received: dFN(-45),
    category: "environment",
    stage: "stage_1",
    status: "closed",
    summary: "Casey complained that their bedroom is too cold at night and that maintenance requests had not been acted upon for three weeks.",
    full_detail: "Casey said they had raised the issue verbally with staff twice, and a maintenance request had been logged but not followed up. Casey was sleeping in extra clothes and felt the issue was being ignored.",
    outcome: "upheld",
    outcome_detail: "Complaint upheld. Investigation confirmed maintenance request had been logged but not escalated. Heating system thermostat in Casey's room was faulty. Repaired within 48 hours of complaint. Casey received a written apology. Maintenance escalation process tightened.",
    acknowledgement_due: addWorkingDays(dFN(-45), 3),
    response_due: addWorkingDays(dFN(-45), 10),
    acknowledged_at: dFN(-44) + "T09:00:00Z",
    response_sent_at: dFN(-38) + "T15:00:00Z",
    assigned_to: "staff_ryan",
    investigation_notes: "Reviewed maintenance log — request was logged 21 days before complaint. Facilities team had not been chased. Heating engineer attended and identified faulty thermostat.",
    lessons_learned: "Maintenance requests older than 7 days to be escalated automatically to RM. Weekly maintenance log review added to RM weekly checks.",
    learning_shared: true,
    escalated_to_stage2_at: null,
    escalated_reason: null,
    ombudsman_reference: null,
    timeline: [
      { date: dFN(-45), action: "Complaint received", recorded_by: "staff_ryan", note: "Casey raised complaint in keywork session." },
      { date: dFN(-44), action: "Acknowledged", recorded_by: "staff_ryan", note: "Casey given written acknowledgement." },
      { date: dFN(-43), action: "Investigation commenced", recorded_by: "staff_ryan", note: "Reviewed maintenance logs. Heating engineer booked." },
      { date: dFN(-42), action: "Repair completed", recorded_by: "staff_ryan", note: "Thermostat replaced. Casey confirmed room is warm." },
      { date: dFN(-38), action: "Response sent", recorded_by: "staff_darren", note: "Outcome letter sent. Upheld. Apology given. Process improvement actioned." },
    ],
    includes_safeguarding_element: false,
    linked_incident_id: null,
    aria_summary: "CMP-2026-003 (Casey, environment) was upheld. Faulty bedroom thermostat identified and repaired within 48 hours of complaint. Response sent within statutory timeframe. Maintenance escalation process improved. Closed — no outstanding actions.",
    created_at: dFN(-45) + "T14:00:00Z",
    updated_at: dFN(-38) + "T15:00:00Z",
    created_by: "staff_ryan",
  },
];

// ── Seed: PI Debriefs ─────────────────────────────────────────────────────────

intelligenceStore.piDebriefs = [
  {
    id: "pid_001",
    home_id: "home_oak",
    incident_id: "inc_005",
    technique_used: "team_teach_holding",
    technique_other: null,
    duration_minutes: 3,
    body_position: "standing",
    staff_involved: ["staff_edward", "staff_anna"],
    de_escalation_attempted: true,
    de_escalation_description: "Staff attempted verbal de-escalation for approximately 5 minutes. Redirected Alex to kitchen for a drink, offered 1:1 time, and attempted to talk through the phone call. Alex's level of distress escalated despite these attempts.",
    injuries: [],
    medical_assessment_completed: true,
    medical_assessment_notes: "No injuries sustained by Alex or staff. Body map completed — no marks or bruising observed.",
    ofsted_notification_required: false,
    ofsted_notified_at: null,
    ofsted_reference: null,
    la_notification_required: false,
    la_notified_at: null,
    riddor_reportable: false,
    riddor_reported_at: null,
    riddor_reference: null,
    yp_debrief_completed: true,
    yp_debrief_date: dFN(-34),
    yp_debrief_by: "staff_edward",
    yp_debrief_notes: "Alex engaged well with the debrief. Acknowledged that the phone call had been distressing and that they had felt out of control. Agreed that throwing items could hurt someone.",
    yp_debrief_feelings: "Alex said they felt 'angry and embarrassed' and was sorry for putting staff in that position. Alex asked for help managing calls with family in future.",
    staff_debrief_completed: true,
    staff_debrief_date: dFN(-33),
    staff_debrief_by: "staff_darren",
    staff_debrief_notes: "Edward and Anna both attended debrief. Both confirmed Team Teach technique was used correctly and for minimum required time. Both felt supported. Edward noted the family call had been clearly distressing for Alex.",
    trigger_identified: "Distressing family contact — mother made critical comments about care placement during phone call",
    preventative_measures: "Keyworker to be present during future contact calls. Pre-call check-in with Alex. Post-call support protocol documented in care plan.",
    learning_shared_with_team: true,
    status: "rm_signed_off",
    rm_sign_off_date: dFN(-32),
    rm_sign_off_by: "staff_darren",
    rm_comments: "PI was proportionate, technique correct, and debriefs completed within 48 hours. Learning has been documented and preventative measures added to care plan. Good practice in difficult circumstances.",
    aria_analysis: "This PI (INC-2026-0035) was a low-risk, short-duration intervention triggered by distressing family contact. Both YP and staff debriefs were completed promptly within 48 hours and all regulatory requirements were met. The trigger has been identified and preventative measures implemented. This incident does not indicate a pattern of concerning behaviour on the part of staff.",
    created_at: dFN(-34) + "T11:00:00Z",
    updated_at: dFN(-32) + "T10:00:00Z",
    created_by: "staff_darren",
  },
  {
    id: "pid_002",
    home_id: "home_oak",
    incident_id: "inc_006",
    technique_used: "restrictive_escort",
    technique_other: null,
    duration_minutes: 2,
    body_position: "standing",
    staff_involved: ["staff_chervelle", "staff_ryan"],
    de_escalation_attempted: true,
    de_escalation_description: "Chervelle attempted de-escalation for approximately 8 minutes — offered alternative trip options, tried to explore Alex's frustration, offered to call social worker to discuss. Alex became increasingly agitated and made towards the door.",
    injuries: [],
    medical_assessment_completed: true,
    medical_assessment_notes: "No injuries. Body map completed — no marks observed on Alex or staff.",
    ofsted_notification_required: false,
    ofsted_notified_at: null,
    ofsted_reference: null,
    la_notification_required: false,
    la_notified_at: null,
    riddor_reportable: false,
    riddor_reported_at: null,
    riddor_reference: null,
    yp_debrief_completed: false,
    yp_debrief_date: null,
    yp_debrief_by: null,
    yp_debrief_notes: null,
    yp_debrief_feelings: null,
    staff_debrief_completed: false,
    staff_debrief_date: null,
    staff_debrief_by: null,
    staff_debrief_notes: null,
    trigger_identified: "Refused community trip — Alex had been told trip could not proceed due to behaviour concerns earlier that day",
    preventative_measures: null,
    learning_shared_with_team: false,
    status: "pending",
    rm_sign_off_date: null,
    rm_sign_off_by: null,
    rm_comments: null,
    aria_analysis: null,
    created_at: dFN(-21) + "T09:00:00Z",
    updated_at: dFN(-21) + "T09:00:00Z",
    created_by: "staff_chervelle",
  },
  {
    id: "pid_003",
    home_id: "home_oak",
    incident_id: "inc_007",
    technique_used: "team_teach_wrap",
    technique_other: null,
    duration_minutes: 7,
    body_position: "standing",
    staff_involved: ["staff_ryan", "staff_edward"],
    de_escalation_attempted: true,
    de_escalation_description: "Ryan attempted to de-escalate for 4 minutes following disclosure, offering 1:1 support, co-regulation strategies, and offering to call Alex's allocated worker. When Alex reached for a sharp object the intervention became essential.",
    injuries: [
      {
        person_type: "young_person",
        person_id: "yp_alex",
        description: "Minor bruise to left forearm — pre-existing or sustained during the struggle prior to hold. Not caused by Team Teach technique.",
        body_location: "Left forearm",
        medical_attention_required: true,
        medical_attention_detail: "Ambulance called as precaution. EMAS assessed Alex. No treatment required. Minor bruising only.",
        riddor_reportable: false,
      },
    ],
    medical_assessment_completed: true,
    medical_assessment_notes: "EMAS attended. Alex assessed — minor bruising left forearm. No treatment required. Discharged at scene. Body map completed and signed by paramedic.",
    ofsted_notification_required: true,
    ofsted_notified_at: null,
    ofsted_reference: null,
    la_notification_required: true,
    la_notified_at: dFN(-9) + "T09:30:00Z",
    riddor_reportable: false,
    riddor_reported_at: null,
    riddor_reference: null,
    yp_debrief_completed: false,
    yp_debrief_date: null,
    yp_debrief_by: null,
    yp_debrief_notes: null,
    yp_debrief_feelings: null,
    staff_debrief_completed: false,
    staff_debrief_date: null,
    staff_debrief_by: null,
    staff_debrief_notes: null,
    trigger_identified: "Distressing conversation regarding upcoming court proceedings for criminal matter",
    preventative_measures: null,
    learning_shared_with_team: false,
    status: "pending",
    rm_sign_off_date: null,
    rm_sign_off_by: null,
    rm_comments: null,
    aria_analysis: null,
    created_at: dFN(-9) + "T08:30:00Z",
    updated_at: dFN(-9) + "T08:30:00Z",
    created_by: "staff_ryan",
  },
];

// ── Seed: Family Contact — Contact Persons ────────────────────────────────────

intelligenceStore.contactPersons = [
  {
    id: "cp_person_001",
    name: "Sharon Williams",
    relationship: "Mother",
    contact_details: "07700 900 111",
    la_approved: true,
    approval_date: dFN(-180),
    notes: "Approved for supervised telephone and face-to-face contact. Not to discuss placement location. Positive intent but can inadvertently destabilise Alex post-contact.",
  },
  {
    id: "cp_person_002",
    name: "Marcus Williams",
    relationship: "Father",
    contact_details: null,
    la_approved: false,
    approval_date: null,
    notes: "No approved contact. Restraining order in place. Staff must not disclose placement or contact details to Marcus Williams under any circumstances.",
  },
  {
    id: "cp_person_003",
    name: "Jade Williams",
    relationship: "Sister",
    contact_details: "07700 900 222",
    la_approved: true,
    approval_date: dFN(-150),
    notes: "Positive sibling relationship. Alex enjoys contact with Jade. Approved for unsupported telephone contact.",
  },
  {
    id: "cp_person_004",
    name: "Patricia Morgan",
    relationship: "Mother",
    contact_details: "07700 900 333",
    la_approved: true,
    approval_date: dFN(-200),
    notes: "Approved for supervised face-to-face and telephone contact. Contact is generally positive. Casey finds contact emotionally intense — preparation and debrief time built into the contact plan.",
  },
  {
    id: "cp_person_005",
    name: "Liam Morgan",
    relationship: "Brother",
    contact_details: "07700 900 444",
    la_approved: true,
    approval_date: dFN(-200),
    notes: "Sibling contact. Casey and Liam have a warm relationship. Monthly face-to-face approved.",
  },
  {
    id: "cp_person_006",
    name: "Robert Clarke",
    relationship: "Father",
    contact_details: "07700 900 555",
    la_approved: true,
    approval_date: dFN(-90),
    notes: "Jordan's father. Consistent and reliable. Approved for unsupported telephone contact and monthly face-to-face. Jordan finds contact with his father grounding.",
  },
  {
    id: "cp_person_007",
    name: "Deborah Clarke",
    relationship: "Mother",
    contact_details: "07700 900 556",
    la_approved: true,
    approval_date: dFN(-90),
    notes: "Jordan's mother. Currently in supported housing. Approved for telephone contact. Face-to-face under review pending stability assessment.",
  },
];

// ── Seed: Family Contact — Arrangements ──────────────────────────────────────

intelligenceStore.contactArrangements = [
  {
    id: "arr_001",
    home_id: "home_oak",
    child_id: "yp_alex",
    contact_person_id: "cp_person_001",
    contact_type: "face_to_face",
    frequency: "Fortnightly",
    frequency_detail: "Every other Saturday, 14:00–16:00, contact centre",
    supervision_level: "supervised",
    location: "Northfields Contact Centre",
    court_ordered: false,
    court_order_reference: null,
    la_requirement: true,
    status: "active",
    suspension_reason: null,
    suspension_date: null,
    review_date: dFN(14),
    notes: "Alex requires 30-minute preparation with key worker before each visit. Allow 45 minutes post-contact wind-down time — do not schedule activities immediately after.",
    created_at: dFN(-180) + "T09:00:00Z",
    updated_at: dFN(-10) + "T10:00:00Z",
    created_by: "staff_darren",
  },
  {
    id: "arr_002",
    home_id: "home_oak",
    child_id: "yp_alex",
    contact_person_id: "cp_person_003",
    contact_type: "telephone",
    frequency: "Weekly",
    frequency_detail: "Every Sunday, approx. 18:00–18:30",
    supervision_level: "supported",
    location: null,
    court_ordered: false,
    court_order_reference: null,
    la_requirement: true,
    status: "active",
    suspension_reason: null,
    suspension_date: null,
    review_date: dFN(30),
    notes: "Sibling telephone contact. Generally positive. Staff to be available but not intruding unless safeguarding concern arises.",
    created_at: dFN(-150) + "T09:00:00Z",
    updated_at: dFN(-150) + "T09:00:00Z",
    created_by: "staff_darren",
  },
  {
    id: "arr_003",
    home_id: "home_oak",
    child_id: "yp_casey",
    contact_person_id: "cp_person_004",
    contact_type: "face_to_face",
    frequency: "Monthly",
    frequency_detail: "First Saturday of each month, 13:00–16:00",
    supervision_level: "supervised",
    location: "Chamberlain House — family room",
    court_ordered: false,
    court_order_reference: null,
    la_requirement: true,
    status: "under_review",
    suspension_reason: "Pattern of post-contact distress — contact arrangement under review by social worker. Cara pattern alert raised 18/04/2026.",
    suspension_date: null,
    review_date: dFN(5),
    notes: "Key worker pre-contact check-in mandatory. 45-minute post-contact debrief with key worker. Do not schedule activities on contact day.",
    created_at: dFN(-200) + "T09:00:00Z",
    updated_at: dFN(-10) + "T11:00:00Z",
    created_by: "staff_darren",
  },
  {
    id: "arr_004",
    home_id: "home_oak",
    child_id: "yp_casey",
    contact_person_id: "cp_person_005",
    contact_type: "face_to_face",
    frequency: "Monthly",
    frequency_detail: "Third weekend of each month, arranged in advance",
    supervision_level: "supported",
    location: "Community — agreed activity",
    court_ordered: false,
    court_order_reference: null,
    la_requirement: true,
    status: "active",
    suspension_reason: null,
    suspension_date: null,
    review_date: dFN(45),
    notes: "Sibling contact. Liam and Casey enjoy bowling, cinema, or café outings. Staff present but not intrusive.",
    created_at: dFN(-200) + "T09:00:00Z",
    updated_at: dFN(-200) + "T09:00:00Z",
    created_by: "staff_darren",
  },
  {
    id: "arr_005",
    home_id: "home_oak",
    child_id: "yp_jordan",
    contact_person_id: "cp_person_006",
    contact_type: "telephone",
    frequency: "Weekly",
    frequency_detail: "Every Wednesday evening, 19:00–19:30",
    supervision_level: "unsupervised",
    location: null,
    court_ordered: false,
    court_order_reference: null,
    la_requirement: true,
    status: "active",
    suspension_reason: null,
    suspension_date: null,
    review_date: dFN(60),
    notes: "Jordan values his relationship with his father. Contact is consistently positive. Unsupervised as no safeguarding concerns.",
    created_at: dFN(-90) + "T09:00:00Z",
    updated_at: dFN(-90) + "T09:00:00Z",
    created_by: "staff_darren",
  },
  {
    id: "arr_006",
    home_id: "home_oak",
    child_id: "yp_jordan",
    contact_person_id: "cp_person_006",
    contact_type: "face_to_face",
    frequency: "Monthly",
    frequency_detail: "Last Saturday of each month, 14:00–17:00",
    supervision_level: "unsupervised",
    location: "Community — agreed activity",
    court_ordered: false,
    court_order_reference: null,
    la_requirement: true,
    status: "active",
    suspension_reason: null,
    suspension_date: null,
    review_date: dFN(60),
    notes: "Jordan and his dad enjoy football and sport. Positive contact consistently reported. Jordan returns settled.",
    created_at: dFN(-90) + "T09:00:00Z",
    updated_at: dFN(-90) + "T09:00:00Z",
    created_by: "staff_darren",
  },
];

// ── Seed: Family Contact — Contact Logs ───────────────────────────────────────

intelligenceStore.contactLogs = [
  // ── Alex — Face-to-face with Mum (arr_001) ──
  {
    id: "cl_001",
    home_id: "home_oak",
    child_id: "yp_alex",
    arrangement_id: "arr_001",
    contact_person_id: "cp_person_001",
    contact_type: "face_to_face",
    date: dFN(-28),
    start_time: "14:00",
    end_time: "16:00",
    duration_minutes: 120,
    location: "Northfields Contact Centre",
    supervision_level: "supervised",
    supervised_by: "staff_anna",
    outcome: "mixed",
    status: "completed",
    yp_mood_before: "anxious",
    yp_mood_after: "unsettled",
    narrative: "Alex attended the contact session with his mother Sharon. Initial engagement was strained — Alex kept his hood up and responded in monosyllables for the first 30 minutes. Sharon brought a card game which helped break the ice and the second hour was more relaxed. Sharon referenced 'home' several times which appeared to unsettle Alex. Session ended on a positive note with a hug. Alex was quiet during the journey back and went to his room on return. Staff checked in at 17:30 and Alex had settled with headphones.",
    yp_voice: "When asked how it went, Alex shrugged and said 'alright'. When pressed he said 'she's alright, I just don't know what to say to her'.",
    concerns_identified: true,
    concerns_detail: "Sharon referenced Alex returning home three times. Staff advised Sharon at session end that placement discussions should go through the social worker. Sharon appeared to acknowledge this.",
    safeguarding_concern: false,
    safeguarding_detail: null,
    follow_up_required: true,
    follow_up_detail: "Check-in with Alex key worker about contact content. Raise with social worker that Sharon is discussing return home in contact sessions.",
    cancelled_reason: null,
    social_worker_notified: true,
    social_worker_notified_at: dFN(-27) + "T09:00:00Z",
    photos_shared: false,
    gifts_received: false,
    gifts_detail: null,
    aria_analysis: null,
    created_at: dFN(-28) + "T16:30:00Z",
    updated_at: dFN(-27) + "T09:10:00Z",
    created_by: "staff_anna",
  },
  {
    id: "cl_002",
    home_id: "home_oak",
    child_id: "yp_alex",
    arrangement_id: "arr_001",
    contact_person_id: "cp_person_001",
    contact_type: "face_to_face",
    date: dFN(-14),
    start_time: "14:00",
    end_time: "16:00",
    duration_minutes: 120,
    location: "Northfields Contact Centre",
    supervision_level: "supervised",
    supervised_by: "staff_lackson",
    outcome: "positive",
    status: "completed",
    yp_mood_before: "neutral",
    yp_mood_after: "settled",
    narrative: "A notably better session than the previous fortnight. Alex came in ready for contact — Lackson had spent 25 minutes with Alex beforehand playing pool and this seemed to settle him. Sharon brought a meal deal and they ate lunch together and watched a short video on her phone about a football match. Alex was engaged throughout. No destabilising comments from Sharon this session. Alex was noticeably more relaxed on return, joined the communal lounge and had dinner with the group.",
    yp_voice: "Alex said 'that was alright actually. She seems different when Lackson drives.' He was smiling.",
    concerns_identified: false,
    concerns_detail: null,
    safeguarding_concern: false,
    safeguarding_detail: null,
    follow_up_required: false,
    follow_up_detail: null,
    cancelled_reason: null,
    social_worker_notified: false,
    social_worker_notified_at: null,
    photos_shared: false,
    gifts_received: false,
    gifts_detail: null,
    aria_analysis: "Contact log for Alex and Sharon (14 April 2026) indicates a significantly improved contact session compared to the previous fortnight. Preparation time with relational key worker Lackson appears to be a protective factor — Alex arrived in a regulated state and the session unfolded naturally. This supports the hypothesis in the care plan that side-by-side activity before high-stakes interactions reduces Alex's anxiety threshold. Recommend: formalise Lackson-led pre-contact preparation in the contact plan. Review Sharon's previous pattern of placement-return comments — one session without this is encouraging but not yet a trend.",
    created_at: dFN(-14) + "T16:45:00Z",
    updated_at: dFN(-13) + "T10:00:00Z",
    created_by: "staff_lackson",
  },
  // ── Alex — Sibling telephone with Jade (arr_002) ──
  {
    id: "cl_003",
    home_id: "home_oak",
    child_id: "yp_alex",
    arrangement_id: "arr_002",
    contact_person_id: "cp_person_003",
    contact_type: "telephone",
    date: dFN(-7),
    start_time: "18:05",
    end_time: "18:35",
    duration_minutes: 30,
    location: null,
    supervision_level: "supported",
    supervised_by: "staff_anna",
    outcome: "positive",
    status: "completed",
    yp_mood_before: "neutral",
    yp_mood_after: "positive",
    narrative: "Alex spoke to his sister Jade for approximately 30 minutes. The call was warm throughout. Alex was laughing on multiple occasions. They discussed a television programme they both watch and Jade sent Alex a funny video via the staff phone after the call which Alex appreciated. No concerns during the call. Alex was in a visibly elevated mood for the rest of the evening.",
    yp_voice: "Alex said 'Jade always makes me feel better. She actually gets me.'",
    concerns_identified: false,
    concerns_detail: null,
    safeguarding_concern: false,
    safeguarding_detail: null,
    follow_up_required: false,
    follow_up_detail: null,
    cancelled_reason: null,
    social_worker_notified: false,
    social_worker_notified_at: null,
    photos_shared: false,
    gifts_received: false,
    gifts_detail: null,
    aria_analysis: null,
    created_at: dFN(-7) + "T18:40:00Z",
    updated_at: dFN(-7) + "T18:40:00Z",
    created_by: "staff_anna",
  },
  // ── Casey — Contact with Mum (arr_003) — distressing pattern ──
  {
    id: "cl_004",
    home_id: "home_oak",
    child_id: "yp_casey",
    arrangement_id: "arr_003",
    contact_person_id: "cp_person_004",
    contact_type: "face_to_face",
    date: dFN(-42),
    start_time: "13:00",
    end_time: "16:00",
    duration_minutes: 180,
    location: "Chamberlain House — family room",
    supervision_level: "supervised",
    supervised_by: "staff_ryan",
    outcome: "mixed",
    status: "completed",
    yp_mood_before: "anxious",
    yp_mood_after: "distressed",
    narrative: "Casey's mother Patricia arrived on time and brought gifts including clothing and a perfume set. The first hour was positive — they caught up, looked at photos, and Patricia cooked a meal in the family room kitchen. After lunch, Patricia became emotional talking about missing Casey at home and began to cry. Casey appeared visibly affected and became withdrawn. The final hour was strained. Casey was tearful by the time Patricia left. Staff provided a co-regulation session lasting 45 minutes post-contact. Casey then went to bed early.",
    yp_voice: "Casey said 'I love her but it always makes me feel sad. I don't know why she has to bring up home all the time. I feel like I've ruined everything.'",
    concerns_identified: true,
    concerns_detail: "Patricia's emotional expression about Casey not being at home is inadvertently placing emotional burden on Casey. Casey expressed guilt about being in care. Raised with social worker.",
    safeguarding_concern: false,
    safeguarding_detail: null,
    follow_up_required: true,
    follow_up_detail: "Social worker to discuss contact approach with Patricia. Casey to have key work session exploring placement guilt feelings.",
    cancelled_reason: null,
    social_worker_notified: true,
    social_worker_notified_at: dFN(-41) + "T09:00:00Z",
    photos_shared: false,
    gifts_received: true,
    gifts_detail: "Clothing (hoodie, jeans) and perfume set — all cleared by staff and checked for appropriateness.",
    aria_analysis: null,
    created_at: dFN(-42) + "T16:30:00Z",
    updated_at: dFN(-41) + "T09:15:00Z",
    created_by: "staff_ryan",
  },
  {
    id: "cl_005",
    home_id: "home_oak",
    child_id: "yp_casey",
    arrangement_id: "arr_003",
    contact_person_id: "cp_person_004",
    contact_type: "face_to_face",
    date: dFN(-21),
    start_time: "13:00",
    end_time: "16:00",
    duration_minutes: 180,
    location: "Chamberlain House — family room",
    supervision_level: "supervised",
    supervised_by: "staff_jasmine",
    outcome: "difficult",
    status: "completed",
    yp_mood_before: "reluctant",
    yp_mood_after: "distressed",
    narrative: "Casey was reluctant to attend contact and required 20 minutes of encouragement from Jasmine before agreeing to go. Contact initially awkward — Casey did not engage with Patricia's attempts at conversation. Patricia brought a takeaway which Casey appreciated and the middle hour improved. Towards the end of the session Patricia began discussing a family holiday they had taken three years ago and became upset. Casey shut down and refused to speak for the final 30 minutes. Patricia left distressed. Casey required a 35-minute co-regulation session and went to her room. She refused dinner.",
    yp_voice: "The following morning Casey said to Jasmine 'I feel like seeing her makes everything worse. But I'd feel bad if I stopped seeing her.'",
    concerns_identified: true,
    concerns_detail: "Second consecutive contact session ending in significant post-contact distress for Casey. Pattern emerging. Cara pattern alert to be raised. Contact arrangement review needed.",
    safeguarding_concern: false,
    safeguarding_detail: null,
    follow_up_required: true,
    follow_up_detail: "RM to review contact arrangement. Social worker notified. Cara analysis requested. Casey to have key work session on contact boundaries and her choices.",
    cancelled_reason: null,
    social_worker_notified: true,
    social_worker_notified_at: dFN(-20) + "T09:00:00Z",
    photos_shared: false,
    gifts_received: false,
    gifts_detail: null,
    aria_analysis: "This is the second consecutive contact session with Patricia ending in significant distress for Casey. The pattern includes Casey arriving reluctant, the session improving mid-contact, then deteriorating when Patricia introduces emotionally charged memories or expresses grief about the placement. Casey's verbatim response — feeling guilty about stopping contact — indicates she is managing her mother's emotional needs in contact rather than having her own needs met. This is a recognised dynamic in contact sessions for looked-after children and warrants an urgent review of the contact arrangement. The current format is not in Casey's best interests. Recommendation: contact plan review with LA, pre-contact therapeutic preparation for both Casey and Patricia, shorter contact sessions, and clear guidance for Patricia on what is and is not appropriate to discuss.",
    created_at: dFN(-21) + "T16:30:00Z",
    updated_at: dFN(-20) + "T11:00:00Z",
    created_by: "staff_jasmine",
  },
  {
    id: "cl_006",
    home_id: "home_oak",
    child_id: "yp_casey",
    arrangement_id: "arr_003",
    contact_person_id: "cp_person_004",
    contact_type: "face_to_face",
    date: dFN(-5),
    start_time: null,
    end_time: null,
    duration_minutes: null,
    location: "Chamberlain House — family room",
    supervision_level: "supervised",
    supervised_by: null,
    outcome: "cancelled_by_yp",
    status: "cancelled",
    yp_mood_before: "reluctant",
    yp_mood_after: null,
    narrative: "Casey declined to participate in contact session on the morning of the arranged visit. She stated she was 'not ready' and became distressed when encouraged to reconsider. Patricia was informed by social worker. Patricia expressed disappointment but was understanding. Contact arrangement is currently under review.",
    yp_voice: "Casey said 'I'm not saying I never want to see her. I just need a break. Is that allowed?'",
    concerns_identified: false,
    concerns_detail: null,
    safeguarding_concern: false,
    safeguarding_detail: null,
    follow_up_required: true,
    follow_up_detail: "Ensure Casey's decision is recorded and her view fed back to the social worker and contact arrangement review. Casey's right to express her wishes about contact must be respected.",
    cancelled_reason: "Casey exercised her right to decline contact. Review of the arrangement is already underway following the previous two difficult contact sessions.",
    social_worker_notified: true,
    social_worker_notified_at: dFN(-5) + "T12:00:00Z",
    photos_shared: false,
    gifts_received: false,
    gifts_detail: null,
    aria_analysis: null,
    created_at: dFN(-5) + "T12:30:00Z",
    updated_at: dFN(-5) + "T12:30:00Z",
    created_by: "staff_darren",
  },
  // ── Jordan — Telephone with Dad (arr_005) ──
  {
    id: "cl_007",
    home_id: "home_oak",
    child_id: "yp_jordan",
    arrangement_id: "arr_005",
    contact_person_id: "cp_person_006",
    contact_type: "telephone",
    date: dFN(-10),
    start_time: "19:00",
    end_time: "19:32",
    duration_minutes: 32,
    location: null,
    supervision_level: "unsupervised",
    supervised_by: null,
    outcome: "positive",
    status: "completed",
    yp_mood_before: "positive",
    yp_mood_after: "positive",
    narrative: "Jordan had his weekly call with his dad Robert. The call lasted 32 minutes. Jordan was in excellent spirits throughout. They discussed Jordan's school week — Jordan had received positive feedback from his form tutor — and Robert was clearly proud and expressed this directly. They talked about attending a local football match together next month. Jordan had dinner with the group in high spirits following the call.",
    yp_voice: "Jordan said 'My dad always knows the right thing to say. He told me he's proud of me for making the effort at school. That meant a lot.'",
    concerns_identified: false,
    concerns_detail: null,
    safeguarding_concern: false,
    safeguarding_detail: null,
    follow_up_required: false,
    follow_up_detail: null,
    cancelled_reason: null,
    social_worker_notified: false,
    social_worker_notified_at: null,
    photos_shared: false,
    gifts_received: false,
    gifts_detail: null,
    aria_analysis: null,
    created_at: dFN(-10) + "T19:40:00Z",
    updated_at: dFN(-10) + "T19:40:00Z",
    created_by: "staff_edward",
  },
  {
    id: "cl_008",
    home_id: "home_oak",
    child_id: "yp_jordan",
    arrangement_id: "arr_006",
    contact_person_id: "cp_person_006",
    contact_type: "face_to_face",
    date: dFN(-3),
    start_time: "14:00",
    end_time: "17:15",
    duration_minutes: 195,
    location: "Community — Westfield Sports Centre (five-a-side)",
    supervision_level: "unsupervised",
    supervised_by: null,
    outcome: "positive",
    status: "completed",
    yp_mood_before: "positive",
    yp_mood_after: "positive",
    narrative: "Jordan's monthly face-to-face contact with his father. They played five-a-side football at Westfield Sports Centre — a venue Jordan had requested. Jordan returned to the home in excellent spirits, talking enthusiastically about the match. He brought back a burger and chips from the sports centre café. Contact was clearly a significant positive. Jordan engaged in the communal lounge for the rest of the evening.",
    yp_voice: "Jordan said 'That's the best day I've had since I've been here. Dad let me score the winning goal on purpose but I still count it.'",
    concerns_identified: false,
    concerns_detail: null,
    safeguarding_concern: false,
    safeguarding_detail: null,
    follow_up_required: false,
    follow_up_detail: null,
    cancelled_reason: null,
    social_worker_notified: false,
    social_worker_notified_at: null,
    photos_shared: false,
    gifts_received: false,
    gifts_detail: null,
    aria_analysis: null,
    created_at: dFN(-3) + "T17:30:00Z",
    updated_at: dFN(-3) + "T17:30:00Z",
    created_by: "staff_edward",
  },
];

// ── Seed: Training Needs ──────────────────────────────────────────────────────

intelligenceStore.trainingNeeds = [
  {
    id: "tn_001",
    home_id: "home_oak",
    identified_by: "incident",
    need_type: "de_escalation",
    title: "De-escalation and physical intervention — whole team refresher",
    description: "Three restraint incidents in 30 days. Post-incident analysis indicates missed de-escalation opportunities. A whole-team refresher in advanced de-escalation techniques is required as a priority preventative measure.",
    priority: "urgent",
    affected_roles: ["residential_care_worker", "senior_residential_care_worker"],
    status: "identified",
    linked_ri_alert_id: "ria_004",
    aria_evidence: "3 physical interventions in 30 days (INC-2026-0038, 0041, 0043). Cara analysis suggests earlier verbal de-escalation may have reduced risk of physical intervention in 2 of 3 incidents.",
    deadline: "2026-05-10",
    created_by: "staff_darren",
    created_at: "2026-04-11T09:00:00Z",
    updated_at: "2026-04-11T09:00:00Z",
  },
  {
    id: "tn_002",
    home_id: "home_oak",
    identified_by: "ri_challenge",
    need_type: "safeguarding",
    title: "Contextual safeguarding awareness — recognising county lines and exploitation",
    description: "Escalating contextual safeguarding risks for Alex W require all staff to be current in county lines indicators, online exploitation, and contextual safeguarding frameworks. This is identified as urgent in light of the RI challenge log.",
    priority: "urgent",
    affected_roles: ["residential_care_worker", "senior_residential_care_worker", "deputy_manager"],
    status: "learning_studio_sent",
    linked_ri_challenge_id: "ric_001",
    linked_ri_alert_id: "ria_001",
    aria_evidence: "Multiple MFC episodes with contextual risk factors. Alex disclosing contact with unknown older males. MASH escalation pending. Cara identified critical safeguarding awareness gap.",
    deadline: "2026-04-28",
    created_by: "staff_darren",
    created_at: "2026-04-14T10:30:00Z",
    updated_at: "2026-04-15T09:00:00Z",
  },
  {
    id: "tn_003",
    home_id: "home_oak",
    identified_by: "supervision",
    need_type: "mental_health_first_aid",
    title: "Mental health first aid — supporting young people in emotional crisis",
    description: "Identified from supervision sessions. Staff have raised that they feel under-confident responding to Casey's mental health needs, particularly around medication refusal and emotional dysregulation linked to her trauma history. Mental health first aid training is needed.",
    priority: "high",
    affected_staff: ["staff_anna", "staff_ryan"],
    affected_roles: ["residential_care_worker"],
    status: "identified",
    aria_evidence: "Casey is prescribed Fluoxetine for low mood and has had one medication refusal incident. Staff supervision notes indicate anxiety about responding to emotional crises. Cara recommends MHFA training as a priority.",
    deadline: "2026-05-20",
    created_by: "staff_darren",
    created_at: "2026-04-10T14:00:00Z",
    updated_at: "2026-04-10T14:00:00Z",
  },
  {
    id: "tn_004",
    home_id: "home_oak",
    identified_by: "ri_challenge",
    need_type: "medication_management",
    title: "Medication management and error reporting — practice refresher",
    description: "Medication error identified in incident INC-2026-0040 (late administration of Fluoxetine). Post-incident debrief highlighted gaps in understanding of the medication error reporting protocol and when clinical review is required. Refresher training needed.",
    priority: "medium",
    affected_staff: ["staff_anna"],
    affected_roles: ["residential_care_worker", "senior_residential_care_worker"],
    status: "identified",
    linked_ri_challenge_id: "ric_004",
    linked_incident_id: "inc_002",
    aria_evidence: "Medication error (Fluoxetine late administration) on 13 April 2026. Staff involved expressed uncertainty about error reporting process in debrief. Policy review needed.",
    deadline: "2026-05-15",
    created_by: "staff_darren",
    created_at: "2026-04-15T11:00:00Z",
    updated_at: "2026-04-15T11:00:00Z",
  },
  // ── Completed training needs (historical evidence for Reg 45) ─────────────
  {
    id: "tn_005",
    home_id: "home_oak",
    identified_by: "supervision",
    need_type: "safeguarding",
    title: "Safer recruitment and DBS refresher — all staff",
    description: "Whole-team safer recruitment awareness refresher completed following Ofsted readiness review.",
    priority: "high",
    affected_roles: ["residential_care_worker", "senior_residential_care_worker", "deputy_manager"],
    status: "completed",
    completed_at: "2026-03-15T14:00:00Z",
    created_by: "staff_darren",
    created_at: "2026-02-20T09:00:00Z",
    updated_at: "2026-03-15T14:00:00Z",
  },
  {
    id: "tn_006",
    home_id: "home_oak",
    identified_by: "audit",
    need_type: "fire_safety",
    title: "Fire safety awareness and evacuation procedures — refresher",
    description: "Fire safety refresher completed following maintenance audit recommendation. All staff completed evacuation drill and refresher session.",
    priority: "medium",
    affected_roles: ["residential_care_worker", "senior_residential_care_worker"],
    status: "completed",
    completed_at: "2026-03-28T10:00:00Z",
    created_by: "staff_ryan",
    created_at: "2026-03-01T11:00:00Z",
    updated_at: "2026-03-28T10:00:00Z",
  },
  {
    id: "tn_007",
    home_id: "home_oak",
    identified_by: "ri_challenge",
    need_type: "trauma_informed_practice",
    title: "Trauma-informed care — foundations training",
    description: "Three staff completed accredited trauma-informed care foundations training through external provider. Positive feedback reported.",
    priority: "high",
    affected_staff: ["staff_anna", "staff_edward", "staff_lackson"],
    status: "completed",
    completed_at: "2026-04-05T16:00:00Z",
    created_by: "staff_darren",
    created_at: "2026-03-10T09:00:00Z",
    updated_at: "2026-04-05T16:00:00Z",
  },
];

// ── Collection API ─────────────────────────────────────────────────────────────

export const intelligenceDb = {
  // ── Child Experience ────────────────────────────────────────────────────────
  childExperience: {
    findByChild: (childId: string): ChildExperienceSnapshot[] =>
      intelligenceStore.childExperience
        .filter((s) => s.child_id === childId)
        .sort((a, b) => b.period_start.localeCompare(a.period_start)),

    findLatest: (childId: string): ChildExperienceSnapshot | null =>
      intelligenceStore.childExperience
        .filter((s) => s.child_id === childId)
        .sort((a, b) => b.period_start.localeCompare(a.period_start))[0] ?? null,

    create: (data: Omit<ChildExperienceSnapshot, "id" | "created_at">): ChildExperienceSnapshot => {
      const record: ChildExperienceSnapshot = {
        ...data,
        id: generateId("ces"),
        created_at: new Date().toISOString(),
      };
      intelligenceStore.childExperience.push(record);
      return record;
    },
  },

  // ── Pattern Alerts ─────────────────────────────────────────────────────────
  patterns: {
    findAll: (homeId: string): PatternAlert[] =>
      intelligenceStore.patternAlerts
        .filter((p) => p.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByChild: (childId: string): PatternAlert[] =>
      intelligenceStore.patternAlerts
        .filter((p) => p.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    create: (data: Omit<PatternAlert, "id" | "created_at">): PatternAlert => {
      const record: PatternAlert = {
        ...data,
        id: generateId("pat"),
        created_at: new Date().toISOString(),
      };
      intelligenceStore.patternAlerts.push(record);
      return record;
    },

    patch: (id: string, data: Partial<PatternAlert>): PatternAlert | null => {
      const idx = intelligenceStore.patternAlerts.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      intelligenceStore.patternAlerts[idx] = { ...intelligenceStore.patternAlerts[idx], ...data };
      return intelligenceStore.patternAlerts[idx];
    },
  },

  // ── Interventions ──────────────────────────────────────────────────────────
  interventions: {
    findByChild: (childId: string): Intervention[] =>
      intelligenceStore.interventions
        .filter((i) => i.child_id === childId)
        .sort((a, b) => b.started_at.localeCompare(a.started_at)),

    findAll: (homeId: string): Intervention[] =>
      intelligenceStore.interventions
        .filter((i) => i.home_id === homeId)
        .sort((a, b) => b.started_at.localeCompare(a.started_at)),

    create: (data: Omit<Intervention, "id" | "created_at" | "updated_at">): Intervention => {
      const now = new Date().toISOString();
      const record: Intervention = {
        ...data,
        id: generateId("int"),
        created_at: now,
        updated_at: now,
      };
      intelligenceStore.interventions.push(record);
      return record;
    },

    patch: (id: string, data: Partial<Intervention>): Intervention | null => {
      const idx = intelligenceStore.interventions.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      intelligenceStore.interventions[idx] = {
        ...intelligenceStore.interventions[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return intelligenceStore.interventions[idx];
    },
  },

  // ── Relational Records ─────────────────────────────────────────────────────
  relational: {
    findByChild: (childId: string, type?: string): RelationalRecord[] => {
      let records = intelligenceStore.relationalRecords.filter((r) => r.child_id === childId);
      if (type) records = records.filter((r) => r.record_type === type);
      return records.sort((a, b) => b.created_at.localeCompare(a.created_at));
    },

    create: (data: Omit<RelationalRecord, "id" | "created_at">): RelationalRecord => {
      const record: RelationalRecord = {
        ...data,
        id: generateId("rr"),
        created_at: new Date().toISOString(),
      };
      intelligenceStore.relationalRecords.push(record);
      return record;
    },
  },

  // ── Practice Bank ──────────────────────────────────────────────────────────
  practiceBank: {
    findByChild: (childId: string): PracticeBankEntry[] =>
      intelligenceStore.practiceBank
        .filter((p) => p.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    create: (data: Omit<PracticeBankEntry, "id" | "created_at" | "updated_at">): PracticeBankEntry => {
      const now = new Date().toISOString();
      const record: PracticeBankEntry = {
        ...data,
        id: generateId("pb"),
        created_at: now,
        updated_at: now,
      };
      intelligenceStore.practiceBank.push(record);
      return record;
    },

    patch: (id: string, data: Partial<PracticeBankEntry>): PracticeBankEntry | null => {
      const idx = intelligenceStore.practiceBank.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      intelligenceStore.practiceBank[idx] = {
        ...intelligenceStore.practiceBank[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return intelligenceStore.practiceBank[idx];
    },
  },

  // ── Voice Records ──────────────────────────────────────────────────────────
  voice: {
    findByChild: (childId: string): VoiceRecord[] =>
      intelligenceStore.voiceRecords
        .filter((v) => v.child_id === childId)
        .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)),

    create: (data: Omit<VoiceRecord, "id" | "created_at">): VoiceRecord => {
      const record: VoiceRecord = {
        ...data,
        id: generateId("vrc"),
        created_at: new Date().toISOString(),
      };
      intelligenceStore.voiceRecords.push(record);
      return record;
    },
  },

  // ── Home Climate ───────────────────────────────────────────────────────────
  homeClimate: {
    findLatest: (homeId: string): HomeClimateSnapshot | null =>
      intelligenceStore.homeClimate
        .filter((s) => s.home_id === homeId)
        .sort((a, b) => b.period_start.localeCompare(a.period_start))[0] ?? null,

    findHistory: (homeId: string, limit = 8): HomeClimateSnapshot[] =>
      intelligenceStore.homeClimate
        .filter((s) => s.home_id === homeId)
        .sort((a, b) => b.period_start.localeCompare(a.period_start))
        .slice(0, limit),

    create: (data: Omit<HomeClimateSnapshot, "id" | "created_at">): HomeClimateSnapshot => {
      const record: HomeClimateSnapshot = {
        ...data,
        id: generateId("hcs"),
        created_at: new Date().toISOString(),
      };
      intelligenceStore.homeClimate.push(record);
      return record;
    },
  },

  // ── Document Intelligence Jobs ─────────────────────────────────────────────
  docJobs: {
    findAll: (homeId: string): DocumentIntelligenceJob[] =>
      intelligenceStore.docJobs
        .filter((j) => j.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    find: (id: string): DocumentIntelligenceJob | null =>
      intelligenceStore.docJobs.find((j) => j.id === id) ?? null,

    create: (data: Omit<DocumentIntelligenceJob, "id" | "created_at" | "updated_at">): DocumentIntelligenceJob => {
      const now = new Date().toISOString();
      const record: DocumentIntelligenceJob = {
        ...data,
        id: generateId("dij"),
        created_at: now,
        updated_at: now,
      };
      intelligenceStore.docJobs.push(record);
      return record;
    },

    patch: (id: string, data: Partial<DocumentIntelligenceJob>): DocumentIntelligenceJob | null => {
      const idx = intelligenceStore.docJobs.findIndex((j) => j.id === id);
      if (idx === -1) return null;
      intelligenceStore.docJobs[idx] = {
        ...intelligenceStore.docJobs[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return intelligenceStore.docJobs[idx];
    },
  },

  // ── Action Outcomes ────────────────────────────────────────────────────────
  actionOutcomes: {
    findByChild: (childId: string): ActionOutcome[] =>
      intelligenceStore.actionOutcomes
        .filter((a) => a.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findAll: (homeId: string): ActionOutcome[] =>
      intelligenceStore.actionOutcomes
        .filter((a) => a.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    create: (data: Omit<ActionOutcome, "id" | "created_at" | "updated_at">): ActionOutcome => {
      const now = new Date().toISOString();
      const record: ActionOutcome = {
        ...data,
        id: generateId("ao"),
        created_at: now,
        updated_at: now,
      };
      intelligenceStore.actionOutcomes.push(record);
      return record;
    },

    patch: (id: string, data: Partial<ActionOutcome>): ActionOutcome | null => {
      const idx = intelligenceStore.actionOutcomes.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      intelligenceStore.actionOutcomes[idx] = {
        ...intelligenceStore.actionOutcomes[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return intelligenceStore.actionOutcomes[idx];
    },
  },

  // ── Cara Assessments ───────────────────────────────────────────────────────
  caraAssessments: {
    findAll: (homeId: string): CaraAssessment[] =>
      intelligenceStore.caraAssessments
        .filter((a) => a.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByChild: (childId: string): CaraAssessment[] =>
      intelligenceStore.caraAssessments
        .filter((a) => a.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): CaraAssessment | null =>
      intelligenceStore.caraAssessments.find((a) => a.id === id) ?? null,

    create: (data: Omit<CaraAssessment, "id" | "created_at">): CaraAssessment => {
      const record: CaraAssessment = {
        ...data,
        id: generateId("aa"),
        created_at: new Date().toISOString(),
      };
      intelligenceStore.caraAssessments.push(record);
      return record;
    },

    patch: (id: string, data: Partial<CaraAssessment>): CaraAssessment | null => {
      const idx = intelligenceStore.caraAssessments.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      intelligenceStore.caraAssessments[idx] = { ...intelligenceStore.caraAssessments[idx], ...data };
      return intelligenceStore.caraAssessments[idx];
    },
  },

  // ── Cara Oversight ─────────────────────────────────────────────────────────
  caraOversight: {
    findAll: (homeId: string): CaraOversight[] =>
      intelligenceStore.caraOversight
        .filter((o) => o.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByChild: (childId: string): CaraOversight[] =>
      intelligenceStore.caraOversight
        .filter((o) => o.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): CaraOversight | null =>
      intelligenceStore.caraOversight.find((o) => o.id === id) ?? null,

    create: (data: Omit<CaraOversight, "id" | "created_at" | "updated_at">): CaraOversight => {
      const now = new Date().toISOString();
      const record: CaraOversight = {
        ...data,
        id: generateId("ao"),
        created_at: now,
        updated_at: now,
      };
      intelligenceStore.caraOversight.push(record);
      return record;
    },

    patch: (id: string, data: Partial<CaraOversight>): CaraOversight | null => {
      const idx = intelligenceStore.caraOversight.findIndex((o) => o.id === id);
      if (idx === -1) return null;
      intelligenceStore.caraOversight[idx] = {
        ...intelligenceStore.caraOversight[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return intelligenceStore.caraOversight[idx];
    },
  },

  // ── Key Work Sessions ──────────────────────────────────────────────────────
  keyWorkSessions: {
    findAll: (homeId: string): KeyWorkSession[] =>
      intelligenceStore.keyWorkSessions
        .filter((s) => s.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByChild: (childId: string): KeyWorkSession[] =>
      intelligenceStore.keyWorkSessions
        .filter((s) => s.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): KeyWorkSession | null =>
      intelligenceStore.keyWorkSessions.find((s) => s.id === id) ?? null,

    create: (data: Omit<KeyWorkSession, "id" | "created_at">): KeyWorkSession => {
      const record: KeyWorkSession = {
        ...data,
        id: generateId("kws"),
        created_at: new Date().toISOString(),
      };
      intelligenceStore.keyWorkSessions.push(record);
      return record;
    },

    patch: (id: string, data: Partial<KeyWorkSession>): KeyWorkSession | null => {
      const idx = intelligenceStore.keyWorkSessions.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      intelligenceStore.keyWorkSessions[idx] = { ...intelligenceStore.keyWorkSessions[idx], ...data };
      return intelligenceStore.keyWorkSessions[idx];
    },
  },

  // ── Child Resources ────────────────────────────────────────────────────────
  childResources: {
    findAll: (homeId: string): ChildResource[] =>
      intelligenceStore.childResources
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByChild: (childId: string): ChildResource[] =>
      intelligenceStore.childResources
        .filter((r) => r.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): ChildResource | null =>
      intelligenceStore.childResources.find((r) => r.id === id) ?? null,

    create: (data: Omit<ChildResource, "id" | "created_at">): ChildResource => {
      const record: ChildResource = {
        ...data,
        id: generateId("cr"),
        created_at: new Date().toISOString(),
      };
      intelligenceStore.childResources.push(record);
      return record;
    },

    patch: (id: string, data: Partial<ChildResource>): ChildResource | null => {
      const idx = intelligenceStore.childResources.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.childResources[idx] = { ...intelligenceStore.childResources[idx], ...data };
      return intelligenceStore.childResources[idx];
    },
  },

  // ── Interactive Sessions ───────────────────────────────────────────────────
  interactiveSessions: {
    findAll: (homeId: string): InteractiveSession[] =>
      intelligenceStore.interactiveSessions
        .filter((s) => s.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByChild: (childId: string): InteractiveSession[] =>
      intelligenceStore.interactiveSessions
        .filter((s) => s.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): InteractiveSession | null =>
      intelligenceStore.interactiveSessions.find((s) => s.id === id) ?? null,

    create: (data: Omit<InteractiveSession, "id" | "created_at">): InteractiveSession => {
      const record: InteractiveSession = {
        ...data,
        id: generateId("is"),
        created_at: new Date().toISOString(),
      };
      intelligenceStore.interactiveSessions.push(record);
      return record;
    },

    patch: (id: string, data: Partial<InteractiveSession>): InteractiveSession | null => {
      const idx = intelligenceStore.interactiveSessions.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      intelligenceStore.interactiveSessions[idx] = { ...intelligenceStore.interactiveSessions[idx], ...data };
      return intelligenceStore.interactiveSessions[idx];
    },
  },

  // ── Cara Audit Trail ───────────────────────────────────────────────────────
  caraAuditTrail: {
    findAll: (homeId: string): CaraAuditEntry[] =>
      intelligenceStore.caraAuditTrail
        .filter((e) => e.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByChild: (childId: string): CaraAuditEntry[] =>
      intelligenceStore.caraAuditTrail
        .filter((e) => e.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): CaraAuditEntry | null =>
      intelligenceStore.caraAuditTrail.find((e) => e.id === id) ?? null,

    create: (data: Omit<CaraAuditEntry, "id" | "created_at">): CaraAuditEntry => {
      const record: CaraAuditEntry = {
        ...data,
        id: generateId("aat"),
        created_at: new Date().toISOString(),
      };
      intelligenceStore.caraAuditTrail.push(record);
      return record;
    },

    patch: (id: string, data: Partial<CaraAuditEntry>): CaraAuditEntry | null => {
      const idx = intelligenceStore.caraAuditTrail.findIndex((e) => e.id === id);
      if (idx === -1) return null;
      intelligenceStore.caraAuditTrail[idx] = { ...intelligenceStore.caraAuditTrail[idx], ...data };
      return intelligenceStore.caraAuditTrail[idx];
    },
  },

  // ── Cara Recommendations ───────────────────────────────────────────────────
  caraRecommendations: {
    findAll: (homeId: string): CaraRecommendation[] =>
      intelligenceStore.caraRecommendations
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByChild: (childId: string): CaraRecommendation[] =>
      intelligenceStore.caraRecommendations
        .filter((r) => r.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): CaraRecommendation | null =>
      intelligenceStore.caraRecommendations.find((r) => r.id === id) ?? null,

    create: (data: Omit<CaraRecommendation, "id" | "created_at">): CaraRecommendation => {
      const record: CaraRecommendation = {
        ...data,
        id: generateId("ar"),
        created_at: new Date().toISOString(),
      };
      intelligenceStore.caraRecommendations.push(record);
      return record;
    },

    patch: (id: string, data: Partial<CaraRecommendation>): CaraRecommendation | null => {
      const idx = intelligenceStore.caraRecommendations.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.caraRecommendations[idx] = { ...intelligenceStore.caraRecommendations[idx], ...data };
      return intelligenceStore.caraRecommendations[idx];
    },
  },

  // ── Cara Safeguarding Flags ────────────────────────────────────────────────
  caraSafeguardingFlags: {
    findAll: (homeId: string): CaraSafeguardingFlag[] =>
      intelligenceStore.caraSafeguardingFlags
        .filter((f) => f.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByChild: (childId: string): CaraSafeguardingFlag[] =>
      intelligenceStore.caraSafeguardingFlags
        .filter((f) => f.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): CaraSafeguardingFlag | null =>
      intelligenceStore.caraSafeguardingFlags.find((f) => f.id === id) ?? null,

    create: (data: Omit<CaraSafeguardingFlag, "id" | "created_at">): CaraSafeguardingFlag => {
      const record: CaraSafeguardingFlag = {
        ...data,
        id: generateId("asf"),
        created_at: new Date().toISOString(),
      };
      intelligenceStore.caraSafeguardingFlags.push(record);
      return record;
    },

    patch: (id: string, data: Partial<CaraSafeguardingFlag>): CaraSafeguardingFlag | null => {
      const idx = intelligenceStore.caraSafeguardingFlags.findIndex((f) => f.id === id);
      if (idx === -1) return null;
      intelligenceStore.caraSafeguardingFlags[idx] = { ...intelligenceStore.caraSafeguardingFlags[idx], ...data };
      return intelligenceStore.caraSafeguardingFlags[idx];
    },
  },

  // ── RI Challenge Logs ─────────────────────────────────────────────────────
  riChallengeLogs: {
    findAll: (homeId: string): RiChallengeLog[] =>
      intelligenceStore.riChallengeLogs
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): RiChallengeLog | null =>
      intelligenceStore.riChallengeLogs.find((r) => r.id === id) ?? null,

    create: (data: Omit<RiChallengeLog, "id" | "created_at" | "updated_at">): RiChallengeLog => {
      const now = new Date().toISOString();
      const record: RiChallengeLog = { ...data, id: generateId("ric"), created_at: now, updated_at: now };
      intelligenceStore.riChallengeLogs.push(record);
      return record;
    },

    patch: (id: string, data: Partial<RiChallengeLog>): RiChallengeLog | null => {
      const idx = intelligenceStore.riChallengeLogs.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.riChallengeLogs[idx] = { ...intelligenceStore.riChallengeLogs[idx], ...data, updated_at: new Date().toISOString() };
      return intelligenceStore.riChallengeLogs[idx];
    },
  },

  // ── RI Governance Reports ─────────────────────────────────────────────────
  riGovernanceReports: {
    findAll: (homeId: string): RiGovernanceReport[] =>
      intelligenceStore.riGovernanceReports
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): RiGovernanceReport | null =>
      intelligenceStore.riGovernanceReports.find((r) => r.id === id) ?? null,

    create: (data: Omit<RiGovernanceReport, "id" | "created_at" | "updated_at">): RiGovernanceReport => {
      const now = new Date().toISOString();
      const record: RiGovernanceReport = { ...data, id: generateId("rigr"), created_at: now, updated_at: now };
      intelligenceStore.riGovernanceReports.push(record);
      return record;
    },

    patch: (id: string, data: Partial<RiGovernanceReport>): RiGovernanceReport | null => {
      const idx = intelligenceStore.riGovernanceReports.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.riGovernanceReports[idx] = { ...intelligenceStore.riGovernanceReports[idx], ...data, updated_at: new Date().toISOString() };
      return intelligenceStore.riGovernanceReports[idx];
    },
  },

  // ── RI Reg 45 Evidence ────────────────────────────────────────────────────
  riReg45Evidence: {
    findAll: (homeId: string): RiReg45Evidence[] =>
      intelligenceStore.riReg45Evidence
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): RiReg45Evidence | null =>
      intelligenceStore.riReg45Evidence.find((r) => r.id === id) ?? null,

    create: (data: Omit<RiReg45Evidence, "id" | "created_at" | "updated_at">): RiReg45Evidence => {
      const now = new Date().toISOString();
      const record: RiReg45Evidence = { ...data, id: generateId("r45"), created_at: now, updated_at: now };
      intelligenceStore.riReg45Evidence.push(record);
      return record;
    },

    patch: (id: string, data: Partial<RiReg45Evidence>): RiReg45Evidence | null => {
      const idx = intelligenceStore.riReg45Evidence.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.riReg45Evidence[idx] = { ...intelligenceStore.riReg45Evidence[idx], ...data, updated_at: new Date().toISOString() };
      return intelligenceStore.riReg45Evidence[idx];
    },
  },

  // ── RI Alerts ─────────────────────────────────────────────────────────────
  riAlerts: {
    findAll: (homeId: string): RiAlert[] =>
      intelligenceStore.riAlerts
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): RiAlert | null =>
      intelligenceStore.riAlerts.find((r) => r.id === id) ?? null,

    create: (data: Omit<RiAlert, "id" | "created_at">): RiAlert => {
      const record: RiAlert = { ...data, id: generateId("ria"), created_at: new Date().toISOString() };
      intelligenceStore.riAlerts.push(record);
      return record;
    },

    patch: (id: string, data: Partial<RiAlert>): RiAlert | null => {
      const idx = intelligenceStore.riAlerts.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.riAlerts[idx] = { ...intelligenceStore.riAlerts[idx], ...data };
      return intelligenceStore.riAlerts[idx];
    },
  },

  // ── Care Plans ────────────────────────────────────────────────────────────
  carePlans: {
    findAll: (homeId: string): CarePlan[] =>
      intelligenceStore.carePlans.filter((r) => r.home_id === homeId),

    findById: (id: string): CarePlan | null =>
      intelligenceStore.carePlans.find((r) => r.id === id) ?? null,

    findByChild: (childId: string): CarePlan | null =>
      intelligenceStore.carePlans.find((r) => r.child_id === childId) ?? null,

    create: (data: Omit<CarePlan, "id" | "created_at" | "updated_at">): CarePlan => {
      const record: CarePlan = {
        ...data,
        id: generateId("cp"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      intelligenceStore.carePlans.push(record);
      return record;
    },

    patch: (id: string, data: Partial<CarePlan>): CarePlan | null => {
      const idx = intelligenceStore.carePlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.carePlans[idx] = {
        ...intelligenceStore.carePlans[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return intelligenceStore.carePlans[idx];
    },
  },

  // ── Complaints ────────────────────────────────────────────────────────────
  complaints: {
    findAll: (homeId: string): Complaint[] =>
      intelligenceStore.complaints
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.date_received.localeCompare(a.date_received)),

    findById: (id: string): Complaint | null =>
      intelligenceStore.complaints.find((r) => r.id === id) ?? null,

    findOpen: (homeId: string): Complaint[] =>
      intelligenceStore.complaints
        .filter((r) => r.home_id === homeId && r.status !== "closed")
        .sort((a, b) => a.response_due.localeCompare(b.response_due)),

    create: (data: Omit<Complaint, "id" | "created_at" | "updated_at">): Complaint => {
      const record: Complaint = {
        ...data,
        id: generateId("cmp"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      intelligenceStore.complaints.push(record);
      return record;
    },

    patch: (id: string, data: Partial<Complaint>): Complaint | null => {
      const idx = intelligenceStore.complaints.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.complaints[idx] = {
        ...intelligenceStore.complaints[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return intelligenceStore.complaints[idx];
    },
  },

  // ── PI Debriefs ───────────────────────────────────────────────────────────
  piDebriefs: {
    findAll: (homeId: string): PIDebrief[] =>
      intelligenceStore.piDebriefs
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByIncident: (incidentId: string): PIDebrief | null =>
      intelligenceStore.piDebriefs.find((r) => r.incident_id === incidentId) ?? null,

    findById: (id: string): PIDebrief | null =>
      intelligenceStore.piDebriefs.find((r) => r.id === id) ?? null,

    create: (data: Omit<PIDebrief, "id" | "created_at" | "updated_at">): PIDebrief => {
      const record: PIDebrief = {
        ...data,
        id: generateId("pid"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      intelligenceStore.piDebriefs.push(record);
      return record;
    },

    patch: (id: string, data: Partial<PIDebrief>): PIDebrief | null => {
      const idx = intelligenceStore.piDebriefs.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.piDebriefs[idx] = {
        ...intelligenceStore.piDebriefs[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return intelligenceStore.piDebriefs[idx];
    },
  },

  // ── Family Contact ────────────────────────────────────────────────────────
  contactPersons: {
    findAll: (): ContactPerson[] => [...intelligenceStore.contactPersons],
    findById: (id: string): ContactPerson | null =>
      intelligenceStore.contactPersons.find((r) => r.id === id) ?? null,
    create: (data: Omit<ContactPerson, "id">): ContactPerson => {
      const record: ContactPerson = { ...data, id: generateId("cpp") };
      intelligenceStore.contactPersons.push(record);
      return record;
    },
    patch: (id: string, data: Partial<ContactPerson>): ContactPerson | null => {
      const idx = intelligenceStore.contactPersons.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.contactPersons[idx] = { ...intelligenceStore.contactPersons[idx], ...data };
      return intelligenceStore.contactPersons[idx];
    },
  },

  contactArrangements: {
    findAll: (homeId: string): ContactArrangement[] =>
      intelligenceStore.contactArrangements.filter((r) => r.home_id === homeId),
    findByChild: (childId: string): ContactArrangement[] =>
      intelligenceStore.contactArrangements.filter((r) => r.child_id === childId),
    findById: (id: string): ContactArrangement | null =>
      intelligenceStore.contactArrangements.find((r) => r.id === id) ?? null,
    create: (data: Omit<ContactArrangement, "id" | "created_at" | "updated_at">): ContactArrangement => {
      const record: ContactArrangement = {
        ...data,
        id: generateId("arr"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      intelligenceStore.contactArrangements.push(record);
      return record;
    },
    patch: (id: string, data: Partial<ContactArrangement>): ContactArrangement | null => {
      const idx = intelligenceStore.contactArrangements.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.contactArrangements[idx] = {
        ...intelligenceStore.contactArrangements[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return intelligenceStore.contactArrangements[idx];
    },
  },

  contactLogs: {
    findAll: (homeId: string): ContactLog[] =>
      intelligenceStore.contactLogs
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    findByChild: (childId: string): ContactLog[] =>
      intelligenceStore.contactLogs
        .filter((r) => r.child_id === childId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    findByArrangement: (arrangementId: string): ContactLog[] =>
      intelligenceStore.contactLogs
        .filter((r) => r.arrangement_id === arrangementId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    findById: (id: string): ContactLog | null =>
      intelligenceStore.contactLogs.find((r) => r.id === id) ?? null,
    create: (data: Omit<ContactLog, "id" | "created_at" | "updated_at">): ContactLog => {
      const record: ContactLog = {
        ...data,
        id: generateId("cl"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      intelligenceStore.contactLogs.push(record);
      return record;
    },
    patch: (id: string, data: Partial<ContactLog>): ContactLog | null => {
      const idx = intelligenceStore.contactLogs.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.contactLogs[idx] = {
        ...intelligenceStore.contactLogs[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return intelligenceStore.contactLogs[idx];
    },
  },

  // ── Reg 44 Visits ─────────────────────────────────────────────────────────
  reg44Visits: {
    findAll: (homeId: string): Reg44Visit[] =>
      intelligenceStore.reg44Visits
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date)),

    findById: (id: string): Reg44Visit | null =>
      intelligenceStore.reg44Visits.find((r) => r.id === id) ?? null,

    create: (data: Omit<Reg44Visit, "id" | "created_at" | "updated_at">): Reg44Visit => {
      const record: Reg44Visit = {
        ...data,
        id: generateId("r44"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      intelligenceStore.reg44Visits.push(record);
      return record;
    },

    patch: (id: string, data: Partial<Reg44Visit>): Reg44Visit | null => {
      const idx = intelligenceStore.reg44Visits.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.reg44Visits[idx] = {
        ...intelligenceStore.reg44Visits[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return intelligenceStore.reg44Visits[idx];
    },
  },

  // ── Learning Projects ─────────────────────────────────────────────────────
  learningProjects: {
    findAll: (homeId: string): LearningProject[] =>
      intelligenceStore.learningProjects
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): LearningProject | null =>
      intelligenceStore.learningProjects.find((r) => r.id === id) ?? null,

    create: (data: Omit<LearningProject, "id" | "created_at" | "updated_at">): LearningProject => {
      const now = new Date().toISOString();
      const record: LearningProject = { ...data, id: generateId("lp"), created_at: now, updated_at: now };
      intelligenceStore.learningProjects.push(record);
      return record;
    },

    patch: (id: string, data: Partial<LearningProject>): LearningProject | null => {
      const idx = intelligenceStore.learningProjects.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.learningProjects[idx] = { ...intelligenceStore.learningProjects[idx], ...data, updated_at: new Date().toISOString() };
      return intelligenceStore.learningProjects[idx];
    },
  },

  // ── Generated Resources ───────────────────────────────────────────────────
  generatedResources: {
    findAll: (homeId: string): GeneratedResource[] =>
      intelligenceStore.generatedResources
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByProject: (projectId: string): GeneratedResource[] =>
      intelligenceStore.generatedResources
        .filter((r) => r.project_id === projectId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): GeneratedResource | null =>
      intelligenceStore.generatedResources.find((r) => r.id === id) ?? null,

    create: (data: Omit<GeneratedResource, "id" | "created_at" | "updated_at">): GeneratedResource => {
      const now = new Date().toISOString();
      const record: GeneratedResource = { ...data, id: generateId("gr"), created_at: now, updated_at: now };
      intelligenceStore.generatedResources.push(record);
      return record;
    },

    patch: (id: string, data: Partial<GeneratedResource>): GeneratedResource | null => {
      const idx = intelligenceStore.generatedResources.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.generatedResources[idx] = { ...intelligenceStore.generatedResources[idx], ...data, updated_at: new Date().toISOString() };
      return intelligenceStore.generatedResources[idx];
    },
  },

  // ── Training Needs ────────────────────────────────────────────────────────
  trainingNeeds: {
    findAll: (homeId: string): TrainingNeed[] =>
      intelligenceStore.trainingNeeds
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): TrainingNeed | null =>
      intelligenceStore.trainingNeeds.find((r) => r.id === id) ?? null,

    create: (data: Omit<TrainingNeed, "id" | "created_at" | "updated_at">): TrainingNeed => {
      const now = new Date().toISOString();
      const record: TrainingNeed = { ...data, id: generateId("tn"), created_at: now, updated_at: now };
      intelligenceStore.trainingNeeds.push(record);
      return record;
    },

    patch: (id: string, data: Partial<TrainingNeed>): TrainingNeed | null => {
      const idx = intelligenceStore.trainingNeeds.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.trainingNeeds[idx] = { ...intelligenceStore.trainingNeeds[idx], ...data, updated_at: new Date().toISOString() };
      return intelligenceStore.trainingNeeds[idx];
    },
  },

  // ── Knowledge Gaps ────────────────────────────────────────────────────────
  knowledgeGaps: {
    findAll: (homeId: string): KnowledgeGap[] =>
      intelligenceStore.knowledgeGaps
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): KnowledgeGap | null =>
      intelligenceStore.knowledgeGaps.find((r) => r.id === id) ?? null,

    create: (data: Omit<KnowledgeGap, "id" | "created_at">): KnowledgeGap => {
      const record: KnowledgeGap = { ...data, id: generateId("kg"), created_at: new Date().toISOString() };
      intelligenceStore.knowledgeGaps.push(record);
      return record;
    },

    patch: (id: string, data: Partial<KnowledgeGap>): KnowledgeGap | null => {
      const idx = intelligenceStore.knowledgeGaps.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.knowledgeGaps[idx] = { ...intelligenceStore.knowledgeGaps[idx], ...data };
      return intelligenceStore.knowledgeGaps[idx];
    },
  },

  // ── Resource Library ──────────────────────────────────────────────────────
  resourceLibrary: {
    findAll: (homeId: string): ResourceLibraryEntry[] =>
      intelligenceStore.resourceLibrary
        .filter((r) => r.home_id === homeId)
        .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || b.created_at.localeCompare(a.created_at)),

    findById: (id: string): ResourceLibraryEntry | null =>
      intelligenceStore.resourceLibrary.find((r) => r.id === id) ?? null,

    create: (data: Omit<ResourceLibraryEntry, "id" | "created_at">): ResourceLibraryEntry => {
      const record: ResourceLibraryEntry = { ...data, id: generateId("rl"), created_at: new Date().toISOString() };
      intelligenceStore.resourceLibrary.push(record);
      return record;
    },

    patch: (id: string, data: Partial<ResourceLibraryEntry>): ResourceLibraryEntry | null => {
      const idx = intelligenceStore.resourceLibrary.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      intelligenceStore.resourceLibrary[idx] = { ...intelligenceStore.resourceLibrary[idx], ...data };
      return intelligenceStore.resourceLibrary[idx];
    },
  },

  // ── L.I.V.E.R.S. Analyses ────────────────────────────────────────────────
  liversAnalyses: {
    findAll: (homeId: string): LiversAnalysis[] =>
      intelligenceStore.liversAnalyses
        .filter((a) => a.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByChild: (childId: string): LiversAnalysis[] =>
      intelligenceStore.liversAnalyses
        .filter((a) => a.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): LiversAnalysis | null =>
      intelligenceStore.liversAnalyses.find((a) => a.id === id) ?? null,

    create: (data: Omit<LiversAnalysis, "id" | "created_at" | "updated_at">): LiversAnalysis => {
      const now = new Date().toISOString();
      const record: LiversAnalysis = { ...data, id: generateId("liv"), created_at: now, updated_at: now };
      intelligenceStore.liversAnalyses.push(record);
      return record;
    },

    patch: (id: string, data: Partial<LiversAnalysis>): LiversAnalysis | null => {
      const idx = intelligenceStore.liversAnalyses.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      intelligenceStore.liversAnalyses[idx] = {
        ...intelligenceStore.liversAnalyses[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return intelligenceStore.liversAnalyses[idx];
    },
  },

  // ── Intervention Sessions ─────────────────────────────────────────────────
  interventionSessions: {
    findAll: (homeId: string): InterventionSession[] =>
      intelligenceStore.interventionSessions
        .filter((s) => s.home_id === homeId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByChild: (childId: string): InterventionSession[] =>
      intelligenceStore.interventionSessions
        .filter((s) => s.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findByLivers: (liversId: string): InterventionSession[] =>
      intelligenceStore.interventionSessions
        .filter((s) => s.livers_analysis_id === liversId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): InterventionSession | null =>
      intelligenceStore.interventionSessions.find((s) => s.id === id) ?? null,

    create: (data: Omit<InterventionSession, "id" | "created_at" | "updated_at">): InterventionSession => {
      const now = new Date().toISOString();
      const record: InterventionSession = { ...data, id: generateId("int"), created_at: now, updated_at: now };
      intelligenceStore.interventionSessions.push(record);
      return record;
    },

    patch: (id: string, data: Partial<InterventionSession>): InterventionSession | null => {
      const idx = intelligenceStore.interventionSessions.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      intelligenceStore.interventionSessions[idx] = {
        ...intelligenceStore.interventionSessions[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return intelligenceStore.interventionSessions[idx];
    },
  },

  // ── Intervention Outcomes ─────────────────────────────────────────────────
  interventionOutcomes: {
    findBySession: (sessionId: string): LiversOutcomeRecord[] =>
      intelligenceStore.interventionOutcomes
        .filter((o) => o.intervention_session_id === sessionId),

    findByChild: (childId: string): LiversOutcomeRecord[] =>
      intelligenceStore.interventionOutcomes
        .filter((o) => o.child_id === childId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),

    findById: (id: string): LiversOutcomeRecord | null =>
      intelligenceStore.interventionOutcomes.find((o) => o.id === id) ?? null,

    create: (data: Omit<LiversOutcomeRecord, "id" | "created_at">): LiversOutcomeRecord => {
      const record: LiversOutcomeRecord = { ...data, id: generateId("iou"), created_at: new Date().toISOString() };
      intelligenceStore.interventionOutcomes.push(record);
      return record;
    },
  },
};
