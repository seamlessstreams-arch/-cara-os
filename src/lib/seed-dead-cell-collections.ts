// ══════════════════════════════════════════════════════════════════════════════
// CARA — Demo seeds for previously-dark intelligence composites
//
// These source collections shipped empty, so their composite engines returned
// `insufficient_data` (dark/empty cards). This file seeds realistic, home-scoped
// demo data so the cards render with honest, meaningful numbers — a healthy home
// with a couple of due/attention items so the engines demonstrate their range.
//
// Covers: Facilities Compliance (fire/water/window/pest) and Agency Staff
// Management (shifts/inductions/feedback). Dates are relative to "now" so
// compliance currency stays correct over time.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  FireEquipmentCheck,
  WaterHygieneRecord,
  WindowCheck,
  PestRecord,
  AgencyStaffRecord,
  AgencyInduction,
  AgencyFeedback,
  CommunityEngagement,
  IndependentTravelRecord,
  HomePolicy,
} from "@/types/extended";
import type {
  PolicyReviewScheduleRecordInput,
  PolicyVersionControlRecordInput,
  PolicyAcknowledgementRecordInput,
  PolicyAlignmentRecordInput,
  PolicyAccessibilityRecordInput,
} from "@/lib/engines/home-policy-review-cycle-compliance-intelligence-engine";

const DAY = 864e5;
const ago = (d: number) => new Date(Date.now() - d * DAY).toISOString().slice(0, 10);
const ahead = (d: number) => new Date(Date.now() + d * DAY).toISOString().slice(0, 10);

// ── Fire equipment checks ─────────────────────────────────────────────────────
function fire(o: Partial<FireEquipmentCheck> & { id: string }): FireEquipmentCheck {
  return {
    equipment_type: "smoke_detector",
    location: "Ground floor hallway",
    identifier_tag: "FE-000",
    last_inspected_date: ago(18),
    inspection_type: "monthly_test",
    inspector: "Sam Okafor (RM)",
    external_contractor: "",
    result: "pass",
    defect_noted: "",
    action_taken: "",
    certificate_ref: "",
    next_inspection_due: ahead(12),
    compliance_status: "compliant",
    last_battery_change_date: ago(150),
    notes: "",
    created_at: ago(18),
    ...o,
  };
}

export function seedFireEquipmentChecks(): FireEquipmentCheck[] {
  return [
    fire({ id: "fe_smoke_hall", equipment_type: "smoke_detector", location: "Ground floor hallway", identifier_tag: "FE-001" }),
    fire({ id: "fe_smoke_landing", equipment_type: "smoke_detector", location: "First floor landing", identifier_tag: "FE-002" }),
    fire({ id: "fe_heat_kitchen", equipment_type: "heat_detector", location: "Kitchen", identifier_tag: "FE-003" }),
    fire({ id: "fe_co_boiler", equipment_type: "carbon_monoxide_detector", location: "Boiler room", identifier_tag: "FE-004", last_battery_change_date: ago(60) }),
    fire({ id: "fe_ext_kitchen", equipment_type: "fire_extinguisher", location: "Kitchen exit", identifier_tag: "FE-005", inspection_type: "annual_certified", external_contractor: "FireGuard Services Ltd", result: "pass", certificate_ref: "FG-2026-118", next_inspection_due: ahead(180) }),
    fire({ id: "fe_blanket_kitchen", equipment_type: "fire_blanket", location: "Kitchen", identifier_tag: "FE-006" }),
    fire({ id: "fe_panel_hall", equipment_type: "fire_alarm_panel", location: "Entrance hall", identifier_tag: "FE-007", inspection_type: "quarterly_service", external_contractor: "FireGuard Services Ltd", certificate_ref: "FG-2026-119", next_inspection_due: ahead(70) }),
    fire({ id: "fe_emerg_light_stair", equipment_type: "emergency_lighting", location: "Main staircase", identifier_tag: "FE-008", result: "pass_with_notes", defect_noted: "Slight flicker on test — monitor", action_taken: "Logged for re-test next month", notes: "Functioning; advisory only" }),
    fire({ id: "fe_door_lounge", equipment_type: "fire_door", location: "Lounge", identifier_tag: "FE-009", inspection_type: "weekly_visual" }),
    // one item due now — engine should surface it
    fire({ id: "fe_signage_rear", equipment_type: "fire_exit_signage", location: "Rear exit", identifier_tag: "FE-010", last_inspected_date: ago(40), next_inspection_due: ahead(2), compliance_status: "due_now" }),
  ];
}

// ── Water hygiene records (HSE L8 / legionella) ───────────────────────────────
function water(o: Partial<WaterHygieneRecord> & { id: string }): WaterHygieneRecord {
  return {
    date: ago(10),
    time: "09:00",
    checked_by: "Sam Okafor (RM)",
    check_type: "hot_temp",
    location: "kitchen_hot",
    temperature: 55,
    target_min: 50,
    target_max: 60,
    compliance: "compliant",
    notes: "",
    action_required: "",
    action_completed: false,
    action_completed_date: null,
    next_due_date: ahead(20),
    ...o,
  };
}

export function seedWaterHygieneRecords(): WaterHygieneRecord[] {
  return [
    water({ id: "wh_kitchen_hot", check_type: "hot_temp", location: "kitchen_hot", temperature: 55 }),
    water({ id: "wh_kitchen_cold", check_type: "cold_temp", location: "kitchen_cold", temperature: 18, target_min: 0, target_max: 20 }),
    water({ id: "wh_bath1_hot", check_type: "hot_temp", location: "bathroom_1_hot", temperature: 52 }),
    water({ id: "wh_bath1_shower", check_type: "showerhead_clean", location: "bathroom_1_shower", temperature: null, target_min: null, target_max: null, notes: "Descaled and disinfected" }),
    water({ id: "wh_tmv_bath2", check_type: "tmv_check", location: "bathroom_2_hot", temperature: 41, target_min: 38, target_max: 44 }),
    // one action-required that was remediated — demonstrates closed-loop
    water({ id: "wh_deadleg", check_type: "dead_leg_flush", location: "utility_hot", temperature: 48, compliance: "remediated", action_required: "Flush infrequently-used outlet weekly", action_completed: true, action_completed_date: ago(3) }),
    // one open action — engine should surface
    water({ id: "wh_header", check_type: "tank_inspection", location: "header_tank", temperature: null, target_min: null, target_max: null, compliance: "action_required", action_required: "Fit tighter lid to header tank", action_completed: false, next_due_date: ahead(7) }),
  ];
}

// ── Window restrictor checks (CHR Reg 25 / 100mm rule) ────────────────────────
function window(o: Partial<WindowCheck> & { id: string }): WindowCheck {
  return {
    inspection_date: ago(14),
    window_location: "Bedroom",
    window_type: "casement",
    floor_level: "first",
    restrictor_present: true,
    restrictor_type: "cable_key",
    restrictor_working: true,
    opening_maximum_cm: 9,
    opening_compliance_with_100mm_rule: true,
    signage_in_place: true,
    child_aware: true,
    damage_noted: [],
    remedial_actions: [],
    outcome: "pass",
    inspected_by: "Sam Okafor (RM)",
    flags_concerns: [],
    next_due_date: ahead(75),
    created_at: ago(14),
    ...o,
  };
}

export function seedWindowChecks(): WindowCheck[] {
  return [
    window({ id: "wc_alex_bed", window_location: "Alex's bedroom", floor_level: "first" }),
    window({ id: "wc_casey_bed", window_location: "Casey's bedroom", floor_level: "first" }),
    window({ id: "wc_jordan_bed", window_location: "Jordan's bedroom", floor_level: "second" }),
    window({ id: "wc_landing", window_location: "First floor landing", floor_level: "first", window_type: "sash" }),
    window({ id: "wc_bathroom", window_location: "Family bathroom", floor_level: "first", window_type: "top_hung", opening_maximum_cm: 8 }),
    window({ id: "wc_lounge", window_location: "Lounge", floor_level: "ground", restrictor_type: "standard_window_lock", outcome: "pass" }),
    // one remedial required — engine should surface
    window({ id: "wc_office", window_location: "Office", floor_level: "second", restrictor_working: false, opening_maximum_cm: 14, opening_compliance_with_100mm_rule: false, outcome: "remedial_required", damage_noted: ["Restrictor cable frayed"], remedial_actions: ["Replace restrictor — booked"], flags_concerns: ["Opens beyond 100mm until repaired"], next_due_date: ahead(3) }),
  ];
}

// ── Pest control records ──────────────────────────────────────────────────────
function pest(o: Partial<PestRecord> & { id: string }): PestRecord {
  return {
    record_date: ago(30),
    record_type: "routine_preventive_treatment",
    pest_category: "none_preventive_only",
    affected_areas: [],
    contractor: "GreenShield Pest Control",
    contractor_accreditation: "BPCA member",
    treatment_method: ["Inspection", "Bait station check"],
    chemicals_used: [],
    child_safety_measures: ["Treatment outside child areas", "Tamper-proof bait stations only"],
    child_informed_and_paced: true,
    prevention_advice: ["Keep food sealed", "Report sightings promptly"],
    follow_up_required: false,
    outcome_evidence: "No activity found; preventive measures in place",
    recorded_by: "Sam Okafor (RM)",
    flags_concerns: [],
    created_at: ago(30),
    ...o,
  };
}

export function seedPestRecords(): PestRecord[] {
  return [
    pest({ id: "pest_q1_routine", record_date: ago(80), record_type: "annual_contract_review" }),
    pest({ id: "pest_routine_recent", record_date: ago(30) }),
    // one reactive call-out, resolved with follow-up done
    pest({ id: "pest_mice_kitchen", record_date: ago(45), record_type: "reactive_call_out", pest_category: "mice", affected_areas: ["Kitchen — under units"], treatment_method: ["Sealed entry points", "Bait stations"], child_safety_measures: ["Bait in locked stations", "Children kept clear during treatment"], follow_up_required: true, follow_up_date: ago(31), outcome_evidence: "No further activity at follow-up", prevention_advice: ["Gap under back door sealed"] }),
  ];
}

// ── Agency staff shifts (CHR Reg 32 / safe staffing) ──────────────────────────
function agencyShift(o: Partial<AgencyStaffRecord> & { id: string }): AgencyStaffRecord {
  return {
    agency_name: "BrightCare Staffing",
    worker_name: "Worker",
    worker_ref: "BC-000",
    date_of_shift: ago(7),
    shift_type: "long_day",
    shift_hours: 12,
    booking_reason: "sickness_cover",
    covering_for_id: null,
    vetting_status: "fully_vetted",
    dbs_number: "001234567890",
    dbs_date: ago(200),
    dbs_enhanced: true,
    induction_completed: true,
    induction_date: ago(7),
    induction_by: "Sam Okafor (RM)",
    safeguarding_briefing: true,
    young_people_briefing: true,
    medication_trained: false,
    price_trained_level: null,
    feedback_score: 4,
    feedback_notes: "Settled well, followed routines.",
    concerns: "",
    authorised_by_id: "staff_sam_rm",
    cost_per_hour: 28,
    notes: "",
    created_at: ago(7),
    ...o,
  };
}

export function seedAgencyStaffLog(): AgencyStaffRecord[] {
  return [
    agencyShift({ id: "ag_shift_1", worker_name: "Dani Price", worker_ref: "BC-204", date_of_shift: ago(21), feedback_score: 5, feedback_notes: "Excellent rapport, strong recording." }),
    agencyShift({ id: "ag_shift_2", worker_name: "Dani Price", worker_ref: "BC-204", date_of_shift: ago(14), feedback_score: 5, booking_reason: "vacancy_cover" }),
    agencyShift({ id: "ag_shift_3", worker_name: "Dani Price", worker_ref: "BC-204", date_of_shift: ago(7), feedback_score: 5, booking_reason: "vacancy_cover" }),
    agencyShift({ id: "ag_shift_4", worker_name: "Marcus Hill", worker_ref: "BC-188", date_of_shift: ago(10), shift_type: "wake_night", booking_reason: "sickness_cover", feedback_score: 4 }),
    // one partially-vetted, briefed but not fully inducted — engine should flag
    agencyShift({ id: "ag_shift_5", worker_name: "Toni Reed", worker_ref: "RR-061", agency_name: "Reliable Relief", date_of_shift: ago(4), vetting_status: "partially_vetted", induction_completed: false, induction_date: null, induction_by: null, young_people_briefing: false, feedback_score: 3, feedback_notes: "Capable; complete full induction before repeat booking.", concerns: "Induction pack not yet signed" }),
    // emergency same-day booking — higher risk, well-managed
    agencyShift({ id: "ag_shift_6", worker_name: "Marcus Hill", worker_ref: "BC-188", date_of_shift: ago(2), booking_reason: "emergency", shift_type: "late", feedback_score: 4 }),
  ];
}

// ── Agency inductions ─────────────────────────────────────────────────────────
function agencyInduction(o: Partial<AgencyInduction> & { id: string }): AgencyInduction {
  const topics = [
    { topic: "Safeguarding & reporting", covered: true, notes: "" },
    { topic: "Behaviour support plans", covered: true, notes: "" },
    { topic: "Fire & emergency procedures", covered: true, notes: "" },
    { topic: "Medication protocols", covered: true, notes: "" },
    { topic: "Recording standards", covered: true, notes: "" },
  ];
  return {
    agency_staff_name: "Worker",
    agency: "BrightCare Staffing",
    date_inducted: ago(21),
    inducted_by: "Sam Okafor (RM)",
    induction_duration: 90,
    induction_type: "half_day_full_induction",
    children_informed_about_agency_arrival: true,
    agency_dbs_verified: true,
    agency_training_verified: true,
    agency_references_verified: true,
    induction_topics: topics,
    child_information_shared: "Need-to-know summaries shared; full plans available on shift.",
    key_policies_shared: ["Safeguarding", "Behaviour support", "Missing from care"],
    photo_taken_and_verified: true,
    behaviour_support_plans_briefed: true,
    agency_staff_signed_induction_pack: true,
    shifts_booked: 3,
    agency_staff_feedback: "Clear and thorough induction.",
    home_feedback_on_agency: "Reliable, well-prepared worker.",
    repeat_booking_approved: true,
    created_at: ago(21),
    ...o,
  };
}

export function seedAgencyInductions(): AgencyInduction[] {
  return [
    agencyInduction({ id: "ag_ind_dani", agency_staff_name: "Dani Price" }),
    agencyInduction({ id: "ag_ind_marcus", agency_staff_name: "Marcus Hill" }),
    // partial induction matching the flagged shift
    agencyInduction({
      id: "ag_ind_toni", agency_staff_name: "Toni Reed", agency: "Reliable Relief",
      induction_type: "pre_shift_brief", induction_duration: 30,
      induction_topics: [
        { topic: "Safeguarding & reporting", covered: true, notes: "" },
        { topic: "Behaviour support plans", covered: false, notes: "To complete before repeat booking" },
        { topic: "Fire & emergency procedures", covered: true, notes: "" },
        { topic: "Medication protocols", covered: false, notes: "Not medication-trained" },
        { topic: "Recording standards", covered: true, notes: "" },
      ],
      agency_references_verified: false, behaviour_support_plans_briefed: false,
      agency_staff_signed_induction_pack: false, shifts_booked: 1,
      home_feedback_on_agency: "Complete full induction before further shifts.",
      repeat_booking_approved: false,
    }),
  ];
}

// ── Agency feedback ───────────────────────────────────────────────────────────
function agencyFeedback(o: Partial<AgencyFeedback> & { id: string }): AgencyFeedback {
  return {
    agency_staff_name: "Worker",
    agency: "BrightCare Staffing",
    shift_date: ago(7),
    shift_type: "long_day",
    induction_recorded: true,
    permanent_staff_on_shift: "Sam Okafor",
    children_interacted_with: [],
    observations_positive: ["Warm, attuned interactions", "Followed routines without prompting"],
    observations_constructive: [],
    child_feedback: "Children responded well.",
    follows_routines: true,
    follows_behaviour_support_plans: true,
    follows_sensory_protocols: true,
    recording_quality: "good",
    professionalism_rating: 4,
    relational_skills_rating: 4,
    overall_verdict: "approved_for_repeat",
    feedback_to_agency_date: ago(6),
    feedback_summary: "Strong shift; approved for repeat booking.",
    follow_up_action: "",
    reviewed_by: "Sam Okafor (RM)",
    notes: "",
    created_at: ago(6),
    ...o,
  };
}

export function seedAgencyFeedback(): AgencyFeedback[] {
  return [
    agencyFeedback({ id: "ag_fb_dani", agency_staff_name: "Dani Price", recording_quality: "excellent", professionalism_rating: 5, relational_skills_rating: 5, feedback_summary: "Outstanding — request as first-choice cover." }),
    agencyFeedback({ id: "ag_fb_marcus", agency_staff_name: "Marcus Hill", shift_type: "wake_night", professionalism_rating: 4, relational_skills_rating: 4 }),
    // constructive feedback / development plan
    agencyFeedback({
      id: "ag_fb_toni", agency_staff_name: "Toni Reed", agency: "Reliable Relief",
      observations_positive: ["Calm presence"], observations_constructive: ["Recording lacked child voice", "Complete induction before repeat"],
      follows_behaviour_support_plans: false, recording_quality: "needs_improvement",
      professionalism_rating: 3, relational_skills_rating: 3, overall_verdict: "approved_with_development_plan",
      feedback_summary: "Potential; needs full induction and recording support.",
      follow_up_action: "Share recording exemplar; complete behaviour-plan briefing.",
    }),
  ];
}

// ── Community engagements (CHR Reg 9 — enjoyment & achievement) ────────────────
function engagement(o: Partial<CommunityEngagement> & { id: string }): CommunityEngagement {
  return {
    date: ago(7),
    young_people: ["yp_alex"],
    activity_type: "sports_fitness",
    activity: "Community football club",
    location: "Local leisure centre",
    organisation: "Riverside FC Juniors",
    duration_minutes: 90,
    staff_present: ["Sam Okafor"],
    outcomes: ["Built peer friendships", "Improved confidence"],
    child_feedback: "Really enjoyed it — wants to keep going.",
    builds_connections: true,
    ongoing_commitment: true,
    recorded_by: "Sam Okafor (RM)",
    notes: "",
    created_at: ago(7),
    ...o,
  };
}

export function seedCommunityEngagements(): CommunityEngagement[] {
  return [
    engagement({ id: "ce_alex_football", young_people: ["yp_alex"], activity_type: "sports_fitness", activity: "Community football club", date: ago(5) }),
    engagement({ id: "ce_casey_art", young_people: ["yp_casey"], activity_type: "arts_culture", activity: "Youth art group", organisation: "Town Arts Collective", location: "Community arts hub", child_feedback: "Loves the painting sessions.", date: ago(9) }),
    engagement({ id: "ce_jordan_volunteer", young_people: ["yp_jordan"], activity_type: "volunteering", activity: "Animal shelter volunteering", organisation: "Paws Rescue", duration_minutes: 120, outcomes: ["Responsibility", "Work-readiness skills"], child_feedback: "Proud to help the animals.", date: ago(12) }),
    engagement({ id: "ce_group_cinema", young_people: ["yp_alex", "yp_casey"], activity_type: "social", activity: "Cinema trip", organisation: "—", location: "Town centre", duration_minutes: 150, ongoing_commitment: false, outcomes: ["Shared positive experience"], date: ago(18) }),
    // one with no ongoing commitment — engine should note follow-through opportunity
    engagement({ id: "ce_jordan_scouts", young_people: ["yp_jordan"], activity_type: "social", activity: "Tried local Scouts session", organisation: "14th Town Scouts", builds_connections: false, ongoing_commitment: false, child_feedback: "Not sure it's for me.", outcomes: ["Explored a new interest"], date: ago(25) }),
  ];
}

// ── Independent travel training (CHR Reg 12 — independence) ────────────────────
function travel(o: Partial<IndependentTravelRecord> & { id: string; child_id: string }): IndependentTravelRecord {
  return {
    last_updated: ago(20),
    current_stage: "stage_3_solo_familiar",
    routes_mastered: [{ from: "Home", to: "School", mode: "Bus", achieved_date: ago(60) }],
    routes_learning: [],
    travel_cards_held: ["Local bus pass"],
    monthly_travel_budget: 40,
    phone_and_charger_check: true,
    what_if_lost_plan: "Call home; staff number saved; knows safe places en route.",
    check_in_protocol: "Text on arrival and departure.",
    risk_factors: [],
    protective_factors: ["Knows route well", "Confident asking for help"],
    child_confidence: "confident",
    staff_observation: "Travels the familiar route reliably and safely.",
    child_voice: "I like getting myself to school.",
    review_date: ahead(60),
    key_worker: "Sam Okafor",
    created_at: ago(60),
    ...o,
  };
}

export function seedIndependentTravelRecords(): IndependentTravelRecord[] {
  return [
    travel({
      id: "itr_alex", child_id: "yp_alex", current_stage: "stage_4_solo_new", child_confidence: "highly_confident",
      routes_mastered: [
        { from: "Home", to: "School", mode: "Bus", achieved_date: ago(120) },
        { from: "Home", to: "Football club", mode: "Bus", achieved_date: ago(40) },
      ],
      routes_learning: [{ from: "Home", to: "Town centre", mode: "Bus + walk", next_step: "One more accompanied trip" }],
      staff_observation: "Ready to attempt town-centre route solo soon.",
    }),
    travel({
      id: "itr_casey", child_id: "yp_casey", current_stage: "stage_2_staff_shadowing", child_confidence: "building",
      routes_mastered: [],
      routes_learning: [{ from: "Home", to: "School", mode: "Bus", next_step: "Staff shadow from a distance" }],
      protective_factors: ["Keen to learn"], risk_factors: ["Can be anxious in crowds"],
      child_voice: "I want to do it but the bus is busy.",
    }),
  ];
}

// ── Policy register + review cycle (CHR Reg 9 / quality assurance) ─────────────
// A coherent set: one register + per-policy review / version / acknowledgement /
// alignment / accessibility records, mostly current with a couple of items due.
const POLICIES: { id: string; name: string; cat: HomePolicy["category"]; sched_cat: PolicyReviewScheduleRecordInput["category"]; reg: string; statutory: string }[] = [
  { id: "pol_safeguarding", name: "Safeguarding & Child Protection", cat: "safeguarding", sched_cat: "safeguarding", reg: "CHR 2015 Reg 12", statutory: "Children's Homes Regs 2015" },
  { id: "pol_behaviour", name: "Behaviour Support & Positive Handling", cat: "behaviour", sched_cat: "behaviour", reg: "CHR 2015 Reg 11", statutory: "Children's Homes Regs 2015" },
  { id: "pol_missing", name: "Missing from Care", cat: "missing_persons", sched_cat: "safeguarding", reg: "Stat. Guidance 2014", statutory: "Children Act 1989" },
  { id: "pol_medication", name: "Medication Management", cat: "medication", sched_cat: "health_safety", reg: "CHR 2015 Reg 23", statutory: "Children's Homes Regs 2015" },
  { id: "pol_health_safety", name: "Health & Safety", cat: "health_safety", sched_cat: "health_safety", reg: "HSWA 1974", statutory: "Health & Safety at Work Act 1974" },
  { id: "pol_complaints", name: "Complaints & Representations", cat: "complaints", sched_cat: "complaints", reg: "CHR 2015 Reg 39", statutory: "Children's Homes Regs 2015" },
  { id: "pol_staffing", name: "Safer Recruitment & Staffing", cat: "workforce", sched_cat: "staffing", reg: "CHR 2015 Reg 32", statutory: "Children's Homes Regs 2015" },
  { id: "pol_whistleblowing", name: "Whistleblowing", cat: "whistleblowing", sched_cat: "staffing", reg: "CHR 2015 Reg 32", statutory: "Public Interest Disclosure Act 1998" },
];

// Real staff ids who have read & acknowledged the whistleblowing policy (one outstanding).
const WB_POLICY_READERS = [
  "staff_darren", "staff_ryan", "staff_alicia", "staff_edward", "staff_lackson",
  "staff_anna", "staff_diane", "staff_mirela",
];

export function seedHomePolicies(): HomePolicy[] {
  return POLICIES.map((p, i): HomePolicy => {
    const due = p.id === "pol_complaints"; // one due for review
    return {
      id: p.id,
      title: p.name,
      category: p.cat,
      description: `${p.name} policy for the home.`,
      version: due ? "2.0" : "3.1",
      status: due ? "due_review" : "current",
      owner_id: "staff_sam_rm",
      approved_by: "Registered Manager",
      approved_date: ago(due ? 400 : 120),
      effective_date: ago(due ? 395 : 115),
      next_review_date: due ? ahead(-10) : ahead(245 - i * 20),
      last_reviewed: ago(due ? 400 : 120),
      statutory_basis: p.statutory,
      linked_standard: p.reg,
      key_points: ["Clear staff responsibilities", "Child-centred and rights-respecting", "Reviewed against current regulation"],
      read_acknowledgements:
        p.id === "pol_whistleblowing"
          ? WB_POLICY_READERS.map((sid) => ({ staff_id: sid, read_at: ago(70), acknowledged: true }))
          : [],
      total_staff_required: 12,
      created_at: ago(400),
      updated_at: ago(due ? 400 : 120),
    };
  });
}

export function seedPolicyReviewSchedule(): PolicyReviewScheduleRecordInput[] {
  return POLICIES.map((p): PolicyReviewScheduleRecordInput => {
    const due = p.id === "pol_complaints";
    return {
      id: `prs_${p.id}`,
      policy_id: p.id,
      policy_name: p.name,
      category: p.sched_cat,
      last_review_date: ago(due ? 400 : 120),
      next_review_due: due ? ahead(-10) : ahead(240),
      review_completed: !due,
      review_completed_date: due ? null : ago(120),
      reviewer: "Sam Okafor (RM)",
      review_outcome: due ? "pending" : "approved",
      days_overdue: due ? 10 : 0,
      review_frequency_months: 12,
      responsible_person: "Registered Manager",
      consultation_undertaken: !due,
      young_people_consulted: p.id === "pol_behaviour" || p.id === "pol_complaints",
      notes: due ? "Review scheduled — bring forward at next QA meeting." : null,
      created_at: ago(400),
    };
  });
}

export function seedPolicyVersionControl(): PolicyVersionControlRecordInput[] {
  return POLICIES.filter((p) => p.id !== "pol_complaints").map((p): PolicyVersionControlRecordInput => ({
    id: `pvc_${p.id}`,
    policy_id: p.id,
    policy_name: p.name,
    version_number: "3.1",
    previous_version: "3.0",
    change_date: ago(120),
    change_type: "scheduled_review",
    change_summary: "Annual review — minor updates for current regulation and practice.",
    approved_by: "Registered Manager",
    approval_date: ago(120),
    superseded_version_archived: true,
    change_log_maintained: true,
    rationale_documented: true,
    effective_date: ago(115),
    created_at: ago(120),
  }));
}

export function seedPolicyAcknowledgements(): PolicyAcknowledgementRecordInput[] {
  const staff = [
    { id: "staff_sam_rm", name: "Sam Okafor" },
    { id: "staff_priya", name: "Priya Shah" },
    { id: "staff_leon", name: "Leon Carter" },
  ];
  const out: PolicyAcknowledgementRecordInput[] = [];
  for (const p of POLICIES.slice(0, 5)) {
    for (const s of staff) {
      const lapsed = p.id === "pol_medication" && s.id === "staff_leon"; // one outstanding
      out.push({
        id: `pack_${p.id}_${s.id}`,
        policy_id: p.id,
        policy_name: p.name,
        staff_id: s.id,
        staff_name: s.name,
        acknowledgement_required_date: ago(110),
        acknowledged: !lapsed,
        acknowledgement_date: lapsed ? null : ago(108),
        comprehension_confirmed: !lapsed,
        assessment_passed: lapsed ? null : true,
        days_to_acknowledge: lapsed ? 0 : 2,
        reminder_sent: lapsed,
        version_acknowledged: "3.1",
        created_at: ago(110),
      });
    }
  }
  return out;
}

export function seedPolicyAlignment(): PolicyAlignmentRecordInput[] {
  return POLICIES.slice(0, 5).map((p): PolicyAlignmentRecordInput => {
    const partial = p.id === "pol_complaints";
    return {
      id: `pa_${p.id}`,
      policy_id: p.id,
      policy_name: p.name,
      regulation_reference: p.reg,
      regulation_description: `${p.name} aligned to ${p.statutory}.`,
      alignment_status: partial ? "partially_aligned" : "fully_aligned",
      last_alignment_check_date: ago(partial ? 400 : 120),
      gaps_identified: partial ? ["Update complaints timescales to current guidance"] : [],
      remediation_actions: partial ? ["Redraft section 4 — in progress"] : [],
      remediation_completed: !partial,
      legislative_change_tracked: true,
      ofsted_recommendation_addressed: true,
      next_alignment_review_due: partial ? ahead(-10) : ahead(240),
      created_at: ago(400),
    };
  });
}

export function seedPolicyAccessibility(): PolicyAccessibilityRecordInput[] {
  return POLICIES.slice(0, 5).map((p): PolicyAccessibilityRecordInput => {
    const childFacing = p.id === "pol_behaviour" || p.id === "pol_complaints" || p.id === "pol_missing";
    return {
      id: `pac_${p.id}`,
      policy_id: p.id,
      policy_name: p.name,
      digital_copy_available: true,
      physical_copy_available: true,
      staff_accessible: true,
      young_people_version_available: childFacing,
      easy_read_version_available: childFacing,
      translated_versions_available: false,
      location_documented: true,
      last_accessibility_check_date: ago(90),
      accessibility_issues: [],
      issues_resolved: true,
      created_at: ago(120),
    };
  });
}
