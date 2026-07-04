// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE OS DEMO SEED (the capability-showcase incident range)
//
// A designed narrative arc, not random filler. Three children, three stories:
//
//   ALEX  — the "needs attention" arc: an evening escalation cluster tied to
//           family-contact/court anxiety, rising intensity over 90 days, mixed
//           de-escalation outcomes, three restraints (the latest with NO child
//           debrief 10 days on — an open repair gap), an exploitation
//           disclosure with a manager-confirmed IMMEDIATE escalation, one
//           complete ethical-intelligence cycle (learning embedded) and one
//           still open.
//   CASEY — the improvement arc: a morning-medication trigger fading as
//           co-regulation strategies get credited; recent entries positive.
//   JORDAN— voice-rich low-level recording (quoted child speech throughout),
//           the contrast for child-voice-presence.
//
// HONESTY RULES: every spine entry traces to a REAL seeded record (the
// Ethical Intelligence traceability rule holds even in demo data); Casey's
// improvement is not overstated; nothing here fabricates compliance.
// Real (activated) deployments start with these collections EMPTY.
//
// Consumed by src/lib/db/store.ts. Pinned by seed-practice-os.test.ts so the
// arc keeps lighting the engines it was designed for as they evolve.
// ══════════════════════════════════════════════════════════════════════════════

import type { BehaviourEntry, DebriefRecord, RestraintRecord } from "@/types/extended";
import type { EthicalIntelligenceEvent } from "@/lib/ethical-intelligence/types";
import type { EscalationDecision } from "@/lib/risk-escalation/types";
import type { TapSession } from "@/lib/tap-thinking/types";

// ── Relative dates (deterministic per boot, mirrors seed-data.ts) ─────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function iso(n: number, time = "12:00"): string {
  return `${daysAgo(n)}T${time}:00Z`;
}

const ALEX = "yp_alex";
const CASEY = "yp_casey";
const JORDAN = "yp_jordan";

// ── A. Behaviour log (powers trigger patterns, trajectory, ABC, de-escalation) ─

const beh = (
  id: string,
  child_id: string,
  agoDays: number,
  time: string,
  direction: BehaviourEntry["direction"],
  intensity: BehaviourEntry["intensity"],
  title: string,
  fields: Partial<BehaviourEntry>,
): BehaviourEntry => ({
  id,
  child_id,
  date: daysAgo(agoDays),
  time,
  direction,
  intensity,
  title,
  antecedent: "",
  behaviour: "",
  consequence: "",
  trigger: "",
  strategy_used: "",
  outcome: "",
  recorded_by: "staff_edward",
  created_at: iso(agoDays, time),
  ...fields,
});

export const PRACTICE_OS_BEHAVIOUR_LOG: BehaviourEntry[] = [
  // ── Alex: evening cluster, family-contact trigger, RISING intensity ────────
  beh("beh_alex_01", ALEX, 84, "19:40", "concern", "moderate", "Unsettled after family call", {
    antecedent: "Scheduled phone contact with mother overran and ended abruptly.",
    behaviour: "Paced the communal lounge, raised voice, slammed the kitchen door.",
    consequence: "Given space, then a walk around the garden with key worker.",
    trigger: "family contact",
    strategy_used: "Time and space, then side-by-side walk with key worker.",
    outcome: "Alex was supported to regulate and settled within half an hour.",
  }),
  beh("beh_alex_02", ALEX, 70, "20:15", "concern", "moderate", "Agitation at bedtime routine", {
    antecedent: "Reminder about college paperwork during the evening routine.",
    behaviour: "Refused the routine, shouted at staff, went to room and played loud music.",
    consequence: "Staff checked in every 15 minutes; paperwork left for the morning.",
    trigger: "evening routine",
    strategy_used: "Low-demand check-ins, choice offered about timing.",
    outcome: "Settled by 21:30 and came down for supper — calm on his own terms.",
  }),
  beh("beh_alex_03", ALEX, 56, "19:05", "concern", "moderate", "Escalation after contact call", {
    antecedent: "Family contact call — mother mentioned the upcoming court date.",
    behaviour: "Threw a cushion across the lounge, verbal threats towards staff.",
    consequence: "Area cleared, 1:1 support offered, debrief conversation later that evening.",
    trigger: "family contact",
    strategy_used: "Cleared the space, calm single voice, offered the punch bag.",
    outcome: "Alex remained dysregulated for most of the evening and declined the debrief.",
  }),
  beh("beh_alex_04", ALEX, 43, "21:00", "concern", "high", "Court-letter distress", {
    antecedent: "A letter about court proceedings arrived; Alex opened it alone before staff could sit with him.",
    behaviour: "Tore up the letter, punched a corridor wall, refused all interaction.",
    consequence: "First-aid check offered (declined). Social worker updated next morning.",
    trigger: "court proceedings",
    strategy_used: "Quiet presence outside his door, written note offering hot chocolate.",
    outcome: "Accepted the hot chocolate at 22:20 and talked for ten minutes — partial repair, still unsettled at handover.",
  }),
  beh("beh_alex_05", ALEX, 35, "21:15", "concern", "critical", "Escalation → planned hold (INC-2026-0035)", {
    antecedent: "Distressing phone call with a family member (see incident INC-2026-0035).",
    behaviour: "Threw items across the lounge, struck out at staff who approached.",
    consequence: "Brief Team Teach hold (3 minutes); supported to his room; body map completed.",
    trigger: "family contact",
    strategy_used: "Verbal de-escalation attempted first; hold used as last resort.",
    outcome: "De-escalated after the hold and slept; keyworker debrief the next day.",
  }),
  beh("beh_alex_06", ALEX, 22, "14:50", "concern", "high", "Blocked community trip (INC-2026-0037)", {
    antecedent: "Community trip request refused because staffing was short.",
    behaviour: "Ran for the front door, threatening posture towards staff in the corridor.",
    consequence: "Escort hold (2 minutes) until verbally engaged; trip re-planned for the weekend.",
    trigger: "refused request",
    strategy_used: "Named the feeling, offered the weekend alternative in writing.",
    outcome: "Alex agreed to the plan but stayed guarded for the rest of the shift.",
  }),
  beh("beh_alex_07", ALEX, 10, "18:30", "concern", "critical", "Self-harm attempt during court conversation (INC-2026-0039)", {
    antecedent: "Difficult conversation about the upcoming court proceedings.",
    behaviour: "Attempted to self-harm with a sharp object; wrap hold used to keep him safe (7 minutes).",
    consequence: "Ambulance precaution; minor bruise mapped; social worker, mother and RM notified.",
    trigger: "court proceedings",
    strategy_used: "Two-staff response, continuous calm narration through the hold.",
    outcome: "Alex remained dysregulated into the night; child debrief still outstanding.",
  }),
  beh("beh_alex_08", ALEX, 4, "19:50", "concern", "critical", "Evening crisis — court date next week", {
    antecedent: "Countdown to the court date raised at dinner by another young person.",
    behaviour: "Left the table, kicked his bedroom door until it split, and said he would hurt himself if court goes ahead.",
    consequence: "Key worker sat outside his door; sharps sweep completed; night staff briefed at handover; safety plan reviewed.",
    trigger: "court proceedings",
    strategy_used: "Low-demand presence, music he chose played in the corridor.",
    outcome: "Quietened by 22:00 but did not talk; breakfast the next day was calm.",
  }),
  // Alex — the strengths that must not be lost in the risk picture.
  beh("beh_alex_09", ALEX, 30, "16:00", "positive", "low", "Cooked for the house", {
    antecedent: "Saturday activity planning — Alex chose to lead the evening meal.",
    behaviour: "Planned, shopped for and cooked spaghetti bolognese for everyone.",
    consequence: "Praise from staff and peers; photo added to his achievement folder.",
    trigger: "",
    strategy_used: "",
    outcome: "Alex said he wants to cook every Saturday — added to the weekly plan.",
  }),
  beh("beh_alex_10", ALEX, 15, "17:30", "positive", "low", "Helped new resident settle", {
    antecedent: "A new young person arrived anxious at teatime.",
    behaviour: "Alex showed them around, lent his spare charger and sat with them at dinner.",
    consequence: "Recognised at the house meeting; keyworker noted it in his star chart.",
    trigger: "",
    strategy_used: "",
    outcome: "Alex told staff it 'felt good to be the one who knows the ropes'.",
  }),

  // ── Casey: the improvement arc (trigger fading, strategies credited) ───────
  beh("beh_casey_01", CASEY, 75, "08:10", "concern", "moderate", "Morning medication refusal", {
    antecedent: "Woken late; medication offered as soon as Casey came downstairs.",
    behaviour: "Refused medication, shouted, went back to her room.",
    consequence: "Second attempt after breakfast succeeded (45 minutes late; MAR noted).",
    trigger: "morning routine",
    strategy_used: "Backed off, offered breakfast first, tried again without an audience.",
    outcome: "Took the medication but the morning stayed tense.",
  }),
  beh("beh_casey_02", CASEY, 60, "08:05", "concern", "moderate", "Morning refusal repeated", {
    antecedent: "Medication offered at the kitchen hatch with other young people present.",
    behaviour: "Pushed the pot away, swore at staff, left for school without it.",
    consequence: "GP advice sought; school informed; taken at lunchtime instead.",
    trigger: "morning routine",
    strategy_used: "Privacy trialled the next day — offered in the quiet lounge instead.",
    outcome: "The next three mornings went smoothly with the private routine.",
  }),
  beh("beh_casey_03", CASEY, 45, "08:00", "concern", "low", "Wobble on school-trip morning", {
    antecedent: "Excited and anxious about the school trip; routine ran early.",
    behaviour: "Initially refused, asked staff to 'stop rushing me'.",
    consequence: "Staff slowed the routine down; Casey took it five minutes later.",
    trigger: "morning routine",
    strategy_used: "Casey's own words used: she asked for no rushing — staff matched her pace.",
    outcome: "Casey counted her breathing with staff and settled quickly — she boarded the bus on time.",
  }),
  beh("beh_casey_04", CASEY, 28, "08:00", "positive", "low", "Two settled weeks of mornings", {
    antecedent: "Private, unhurried medication routine now standard.",
    behaviour: "Casey has taken her medication first-time every day for a fortnight.",
    consequence: "Celebrated at keywork; Casey chose the Friday film as recognition.",
    trigger: "",
    strategy_used: "Consistent private routine, Casey setting the pace.",
    outcome: "Casey said the mornings 'don't feel like a fight any more' — calm and settled.",
  }),
  beh("beh_casey_05", CASEY, 9, "16:45", "positive", "low", "Asked for help before the wobble", {
    antecedent: "Casey came to staff before tea saying she felt 'buzzy and cross'.",
    behaviour: "Asked to do the breathing count together before it built up.",
    consequence: "Five minutes of co-regulation; tea went ahead normally.",
    trigger: "",
    strategy_used: "Casey-initiated co-regulation — the breathing count she chose.",
    outcome: "Casey settled and was proud she caught it early; noted for her LAC review.",
  }),

  // ── Jordan: voice-rich low-level recording ──────────────────────────────────
  beh("beh_jordan_01", JORDAN, 40, "17:20", "concern", "low", "Frustration about study noise", {
    antecedent: "Communal area was loud during Jordan's revision hour.",
    behaviour: "Jordan said \"I can't think in here and nobody listens when I ask.\"",
    consequence: "Quiet study space agreed in the dining room, on Jordan's suggestion.",
    trigger: "noise",
    strategy_used: "Listened, validated, acted on Jordan's own solution.",
    outcome: "Jordan said \"that's all I wanted\" and revised calmly all week.",
  }),
  beh("beh_jordan_02", JORDAN, 18, "19:00", "positive", "low", "Led the house meeting item", {
    antecedent: "House meeting — Jordan asked for an agenda slot.",
    behaviour: "Jordan proposed a rota for the games console and chaired the vote.",
    consequence: "Rota adopted; Jordan said \"it's fairer now, even for the little ones.\"",
    trigger: "",
    strategy_used: "",
    outcome: "Fewer console arguments since; Jordan proud of the change.",
  }),
];

// ── B. Restraints (match incidents inc_005 / inc_006 / inc_007) ───────────────

export const PRACTICE_OS_RESTRAINTS: RestraintRecord[] = [
  {
    id: "rst_005",
    date: daysAgo(35),
    start_time: "21:15",
    end_time: "21:18",
    duration: 3,
    child_id: ALEX,
    staff_involved: [
      { staff_id: "staff_edward", role: "Lead", technique: "Team Teach standing hold" },
      { staff_id: "staff_anna", role: "Support", technique: "Guide away" },
    ],
    reason: "harm_to_others",
    restraint_type: "standing",
    antecedent: "Distressing family contact call; items thrown; struck out at staff (INC-2026-0035).",
    behaviour: "Throwing items, striking out when approached.",
    de_escalation_attempts: ["Verbal de-escalation", "Space offered", "Second staff swap-in"],
    justification: "Immediate risk of injury to staff; least restrictive hold for the minimum time.",
    description: "Brief planned standing hold, approximately 3 minutes, released as soon as safe.",
    injuries: [],
    child_debriefed: true,
    child_debrief_notes: "Alex talked it through with his key worker the next morning — said the call 'flipped a switch' and agreed to pre-call preparation.",
    staff_debriefed: true,
    witnessed_by: ["staff_anna"],
    review_status: "reviewed",
    review_notes: "Proportionate, minimum duration, correct technique. Trigger identified: family contact.",
    reviewed_by: "staff_darren",
    created_at: iso(35, "22:30"),
  } as RestraintRecord,
  {
    id: "rst_006",
    date: daysAgo(22),
    start_time: "14:50",
    end_time: "14:52",
    duration: 2,
    child_id: ALEX,
    staff_involved: [{ staff_id: "staff_chervelle", role: "Lead", technique: "Team Teach escort" }],
    reason: "absconding_danger",
    restraint_type: "escort",
    antecedent: "Community trip refused; ran for the front door; threatening posture (INC-2026-0037).",
    behaviour: "Attempting to leave in an unsafe state; physical threat to staff in corridor.",
    de_escalation_attempts: ["Verbal de-escalation", "Named the feeling", "Alternative offered"],
    justification: "Immediate absconding risk in an unsafe emotional state.",
    description: "Escort hold for approximately 2 minutes until Alex verbally engaged.",
    injuries: [],
    child_debriefed: true,
    child_debrief_notes: "Alex accepted the weekend trip plan; said being told 'no' with no reason is what stings.",
    staff_debriefed: true,
    witnessed_by: ["staff_ryan"],
    review_status: "reviewed",
    review_notes: "Correct use; learning — give the reason with the refusal, and the alternative in writing.",
    reviewed_by: "staff_darren",
    created_at: iso(22, "16:00"),
  } as RestraintRecord,
  {
    id: "rst_007",
    date: daysAgo(10),
    start_time: "18:30",
    end_time: "18:37",
    duration: 7,
    child_id: ALEX,
    staff_involved: [
      { staff_id: "staff_ryan", role: "Lead", technique: "Team Teach wrap hold" },
      { staff_id: "staff_edward", role: "Support", technique: "Object secured" },
    ],
    reason: "harm_to_self",
    restraint_type: "other",
    antecedent: "Difficult conversation about court proceedings; attempted self-harm with a sharp object (INC-2026-0039).",
    behaviour: "Attempting self-harm; violent resistance when staff intervened.",
    de_escalation_attempts: ["Calm narration", "Second staff called", "Object negotiation attempted"],
    justification: "Immediate, serious risk of self-injury.",
    description: "Wrap hold maintained for 7 minutes until the object was secured and Alex was safe. Ambulance precaution.",
    injuries: [{ person: "child", description: "Minor bruise, left forearm — sustained in the struggle, not the hold", treatment: "Checked by ambulance crew; no further treatment" } as RestraintRecord["injuries"][number]],
    child_debriefed: false,
    child_debrief_notes: "",
    staff_debriefed: true,
    witnessed_by: ["staff_edward"],
    review_status: "pending_rm",
    review_notes: "",
    reviewed_by: "",
    created_at: iso(10, "20:00"),
  } as RestraintRecord,
];

// ── C. Debriefs (complete repair for inc_005; inc_007 deliberately absent) ────

export const PRACTICE_OS_DEBRIEFS: DebriefRecord[] = [
  {
    id: "dbf_005",
    date: daysAgo(34),
    type: "post_restraint",
    linked_incident_id: "inc_005",
    linked_incident_summary: "PI following distressing family contact (INC-2026-0035)",
    child_id: ALEX,
    staff_involved: ["staff_edward", "staff_anna"],
    facilitated_by: "staff_darren",
    what_happened: "A distressing family call escalated quickly; a brief hold was needed when Alex struck out.",
    what_worked_well: "Early area clearing; one calm voice; hold released at the first safe moment.",
    what_could_improve: "The call happened with no preparation — Alex was ambushed by the court topic.",
    staff_wellbeing: "Both staff okay; Edward shaken initially, supported by the on-shift senior.",
    child_perspective: "Alex: 'The call flipped a switch. I didn't want to hurt anyone. Warn me next time it's about court.'",
    lessons_learned: ["Pre-call preparation reduces escalation risk", "Keyworker present during contact calls about court"],
    changes_needed: ["Contact plan updated: pre-call preparation + keyworker present", "Evening staffing reviewed for call nights"],
    follow_up_actions: [
      { action: "Update contact arrangements with pre-call preparation", owner: "staff_darren", completed: true },
      { action: "Share the learning at team meeting", owner: "staff_ryan", completed: true },
    ],
    support_offered: true,
    support_details: "1:1 with key worker next morning; Alex chose a walk-and-talk format.",
    created_at: iso(34, "11:00"),
  } as DebriefRecord,
];

// ── D. Ethical Intelligence cycles (one complete, one open) ───────────────────

const SRC_INC005 = [{ recordType: "incidents", recordId: "inc_005" }];
const SRC_INC004 = [{ recordType: "incidents", recordId: "inc_004" }];

export const PRACTICE_OS_ETHICAL_EVENTS: EthicalIntelligenceEvent[] = [
  // COMPLETE cycle — the learning loop closed on inc_005.
  {
    id: "eie_seed_inc005",
    createdAt: iso(34, "10:00"),
    updatedAt: iso(7, "09:00"),
    createdBy: "staff_darren",
    homeId: "home_oak",
    childId: ALEX,
    childName: "Alex",
    trigger: { recordType: "incidents", recordId: "inc_005", note: "PI after distressing family contact" },
    triggerSummary: "Physical intervention after a distressing family contact call (INC-2026-0035)",
    whatHappened: "A family contact call escalated; Alex threw items and struck out; a 3-minute hold was used.",
    childExperience: "Alex: 'The call flipped a switch. Warn me next time it's about court.'",
    staffObserved: "Escalation began within minutes of the call ending; de-escalation attempts did not land until after the hold.",
    insights: [
      {
        id: "eii_seed_1",
        capturedAt: iso(34, "10:10"),
        capturedBy: "staff_darren",
        informationKnown: ["Two prior evening escalations after family calls", "Court proceedings raised in the call"],
        interpretation: "Unprepared contact about court is the pressure point — the behaviour is communication of dread, not defiance.",
        alternativeExplanations: ["General evening dysregulation", "Peer conflict earlier that day (ruled out — settled afternoon)"],
        sourceRecords: [...SRC_INC005, { recordType: "behaviourLog", recordId: "beh_alex_03" }],
      },
    ],
    decisions: [
      {
        id: "eid_seed_1",
        capturedAt: iso(33, "09:30"),
        decisionSummary: "Introduce pre-call preparation and keyworker presence for all contact calls that may touch court matters",
        decisionMaker: "Olivia Hayes",
        decisionMakerRole: "registered_manager",
        evidence: ["Debrief with Alex (his own ask)", "Pattern across behaviour log", "PI review findings"],
        sourceRecords: [...SRC_INC005, { recordType: "debriefRecords", recordId: "dbf_005" }],
      },
    ],
    actions: [
      {
        id: "eiact_seed_1",
        capturedAt: iso(33, "10:00"),
        capturedBy: "staff_darren",
        actionTaken: "Contact plan updated: pre-call preparation conversation + keyworker present; evening staffing reviewed for call nights.",
        followUpRequired: ["Review at the next LAC review", "Monitor evening entries for contact-linked escalation"],
        followUpOwner: "staff_darren",
        followUpDue: daysAgo(-7),
        sourceRecords: SRC_INC005,
      },
    ],
    outcomes: [
      {
        id: "eio_seed_1",
        capturedAt: iso(7, "09:00"),
        capturedBy: "staff_darren",
        whatChanged: "No contact-linked escalation in the three weeks since the plan changed; Alex initiated one call himself.",
        direction: "improved",
        reviewedAt: iso(7, "09:00"),
        reviewedBy: "Olivia Hayes",
        sourceRecords: [...SRC_INC005, { recordType: "behaviourLog", recordId: "beh_alex_09" }],
      },
    ],
    learning: [
      {
        id: "eil_seed_1",
        capturedAt: iso(7, "09:15"),
        capturedBy: "staff_darren",
        whatWasLearned: "Preparation, not restriction, is what makes Alex's family contact safe — he manages hard topics when he is warned and accompanied.",
        toEmbedInPractice: ["Pre-call preparation as standard for court-related contact", "Keyworker presence recorded on the contact plan"],
        embedTargets: ["care plan", "contact arrangements", "team meeting learning log"],
        embedded: true,
        embeddedAt: iso(7, "09:15"),
        sourceRecords: [...SRC_INC005, { recordType: "debriefRecords", recordId: "dbf_005" }],
      },
    ],
    integration: {
      childVoiceHeard: true,
      childPlanUpdated: true,
      riskAssessmentUpdated: true,
      behaviourSupportPlanUpdated: true,
      managementOversightCompleted: true,
      workflowFullyCompleted: true,
      outcomeReviewed: true,
    },
    auditTrail: [
      { id: "eia_seed_1", at: iso(34, "10:00"), actor: "staff_darren", action: "event_created", stage: "experience" },
      { id: "eia_seed_2", at: iso(34, "10:10"), actor: "staff_darren", action: "insight_recorded", stage: "insight" },
      { id: "eia_seed_3", at: iso(33, "09:30"), actor: "Olivia Hayes", action: "decision_recorded", stage: "decision" },
      { id: "eia_seed_4", at: iso(33, "10:00"), actor: "staff_darren", action: "action_recorded", stage: "impact" },
      { id: "eia_seed_5", at: iso(7, "09:00"), actor: "staff_darren", action: "outcome_recorded", stage: "impact", detail: "improved" },
      { id: "eia_seed_6", at: iso(7, "09:15"), actor: "staff_darren", action: "learning_recorded", stage: "learning" },
      { id: "eia_seed_7", at: iso(7, "09:20"), actor: "Olivia Hayes", action: "integration_updated", stage: "integration" },
    ],
  },
  // OPEN cycle — inc_004 exploitation disclosure: 3/6 stages, work outstanding.
  {
    id: "eie_seed_inc004",
    createdAt: iso(1, "20:00"),
    updatedAt: iso(1, "21:00"),
    createdBy: "staff_edward",
    homeId: "home_oak",
    childId: ALEX,
    childName: "Alex",
    trigger: { recordType: "incidents", recordId: "inc_004", note: "Exploitation disclosure" },
    triggerSummary: "Alex disclosed an older peer asking him to carry items (INC-2026-0042)",
    whatHappened: "During keywork, Alex disclosed that an older peer in the community has been asking him to carry items.",
    childExperience: "Alex was distressed; he said he 'didn't want to get anyone in trouble' but was scared to say no to the peer.",
    staffObserved: "Disclosure came unprompted; Alex's distress was visible; he accepted 1:1 support afterwards.",
    insights: [
      {
        id: "eii_seed_2",
        capturedAt: iso(1, "20:30"),
        capturedBy: "staff_edward",
        informationKnown: ["Recent missing episode with no account of whereabouts", "New older contacts noticed by staff"],
        interpretation: "The pattern is consistent with early-stage criminal exploitation grooming.",
        alternativeExplanations: ["A misread favour between friends — not assumed; the fear in the telling matters"],
        sourceRecords: [...SRC_INC004, { recordType: "incidents", recordId: "inc_001" }],
      },
    ],
    decisions: [
      {
        id: "eid_seed_2",
        capturedAt: iso(1, "21:00"),
        decisionSummary: "Immediate safeguarding response: social worker + MASH referral, risk assessment review booked",
        decisionMaker: "Olivia Hayes",
        decisionMakerRole: "registered_manager",
        evidence: ["The disclosure itself", "Missing episode pattern", "New older contacts"],
        sourceRecords: SRC_INC004,
      },
    ],
    actions: [],
    outcomes: [],
    learning: [],
    integration: {
      childVoiceHeard: true,
      childPlanUpdated: null,
      riskAssessmentUpdated: null,
      behaviourSupportPlanUpdated: null,
      managementOversightCompleted: null,
      workflowFullyCompleted: null,
      outcomeReviewed: null,
    },
    auditTrail: [
      { id: "eia_seed_8", at: iso(1, "20:00"), actor: "staff_edward", action: "event_created", stage: "experience" },
      { id: "eia_seed_9", at: iso(1, "20:30"), actor: "staff_edward", action: "insight_recorded", stage: "insight" },
      { id: "eia_seed_10", at: iso(1, "21:00"), actor: "Olivia Hayes", action: "decision_recorded", stage: "decision" },
    ],
  },
];

// ── E. Escalation decisions (one decided, one awaiting) ───────────────────────

export const PRACTICE_OS_ESCALATION_DECISIONS: EscalationDecision[] = [
  {
    id: "escd_seed_1",
    createdAt: iso(1, "19:30"),
    createdBy: "staff_edward",
    childId: ALEX,
    childName: "Alex",
    concernSummary: "Disclosure of an older peer asking Alex to carry items — potential criminal exploitation.",
    suggestedLevel: "immediate_safeguarding",
    suggestedAt: iso(1, "19:30"),
    suggestionEvidence: [{ rule: "disclosure_of_abuse", because: "A disclosure of abuse or assault is recorded." }],
    engineVersion: "1.0.0",
    status: "decided",
    agreement: "confirmed",
    confirmedLevel: "immediate_safeguarding",
    decisionMaker: "Olivia Hayes",
    decisionMakerRole: "registered_manager",
    decisionReason: undefined,
    evidenceUsed: ["The disclosure in keywork", "Missing episode two days prior", "New older contacts"],
    actionsTriggered: [
      "Ensure immediate safety",
      "Notify the manager",
      "Notify the social worker",
      "Contact police/emergency services if required",
      "Emergency review",
    ],
    decidedAt: iso(1, "19:45"),
    sourceRecords: [{ recordType: "incidents", recordId: "inc_004" }],
    auditTrail: [
      { at: iso(1, "19:30"), actor: "staff_edward", action: "suggestion_created", detail: "Cara suggested Immediate safeguarding" },
      { at: iso(1, "19:45"), actor: "Olivia Hayes", action: "decision_confirmed", detail: "Immediate safeguarding — 5 required actions triggered" },
    ],
  },
  {
    id: "escd_seed_2",
    createdAt: iso(0, "08:30"),
    createdBy: "staff_ryan",
    childId: ALEX,
    childName: "Alex",
    concernSummary: "Evening escalation pattern is tightening around the court date — third court-linked entry this month.",
    suggestedLevel: "emerging_concern",
    suggestedAt: iso(0, "08:30"),
    suggestionEvidence: [
      { rule: "pattern_developing", because: "A pattern is developing across recent records." },
      { rule: "incident_frequency", because: "Three or more incidents in the last 30 days suggest a developing pattern." },
    ],
    engineVersion: "1.0.0",
    status: "awaiting_decision",
    actionsTriggered: [],
    sourceRecords: [
      { recordType: "behaviourLog", recordId: "beh_alex_07" },
      { recordType: "behaviourLog", recordId: "beh_alex_08" },
    ],
    auditTrail: [{ at: iso(0, "08:30"), actor: "staff_ryan", action: "suggestion_created", detail: "Cara suggested Emerging concern" }],
  },
];

// ── F. TAP session (in progress at the oversight decision point) ──────────────

export const PRACTICE_OS_TAP_SESSIONS: TapSession[] = [
  {
    id: "tap_seed_1",
    createdAt: iso(2, "10:00"),
    updatedAt: iso(2, "10:40"),
    createdBy: "staff_darren",
    childId: ALEX,
    childName: "Alex",
    context: "management_oversight",
    purpose: "Oversight thinking for INC-2026-0039 before sign-off — the hold, the self-harm risk, and the outstanding child debrief.",
    answers: {
      see_clearly: [
        {
          question: "What is the child's lived experience?",
          answer: "Alex is carrying court-date dread into every evening; the house feels unsafe to him after 7pm on call nights.",
          answeredBy: "staff_darren",
          answeredAt: iso(2, "10:10"),
        },
        {
          question: "What do we know beyond risks?",
          answer: "He cooks for the house, helped the new resident settle, and asked us to warn him before court topics — he tells us what works.",
          answeredBy: "staff_darren",
          answeredAt: iso(2, "10:15"),
        },
        {
          question: "What is present, missing or unclear?",
          answer: "Missing: his debrief after the wrap hold (10 days). Unclear: what he understood about the ambulance being called.",
          answeredBy: "staff_darren",
          answeredAt: iso(2, "10:20"),
        },
      ],
      think_deeply: [
        {
          question: "What does this information mean?",
          answer: "The self-harm attempt was the court conversation landing without preparation — the same mechanism as the contact calls, at higher stakes.",
          answeredBy: "staff_darren",
          answeredAt: iso(2, "10:30"),
        },
        {
          question: "What patterns or contradictions exist?",
          answer: "Pattern: unprepared court content → evening escalation. Contradiction: he engages calmly with hard topics when he sets the pace (keywork walk-and-talks).",
          answeredBy: "staff_darren",
          answeredAt: iso(2, "10:40"),
        },
      ],
      work_relationally: [],
      act_with_purpose: [],
      sustain_practice: [],
    },
    status: "in_progress",
    sourceRecords: [
      { recordType: "incidents", recordId: "inc_007" },
      { recordType: "restraints", recordId: "rst_007" },
    ],
    auditTrail: [
      { at: iso(2, "10:00"), actor: "staff_darren", action: "session_created", detail: "management_oversight" },
      { at: iso(2, "10:20"), actor: "staff_darren", action: "answers_recorded", detail: "See Clearly: 3 answer(s)" },
      { at: iso(2, "10:40"), actor: "staff_darren", action: "answers_recorded", detail: "Think Deeply: 2 answer(s)" },
    ],
  },
];
