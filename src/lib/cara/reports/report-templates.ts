// ══════════════════════════════════════════════════════════════════════════════
// Cara — REPORT SECTION TEMPLATES
// Canonical section definitions for every report type. Each template defines
// the section key, display title, ordering, and whether the section requires
// evidence links or child voice content.
// ══════════════════════════════════════════════════════════════════════════════

import type { ReportType } from "@/types/cara-reports";

// ── Section Template Shape ──────────────────────────────────────────────────

export interface SectionTemplate {
  key: string;
  title: string;
  order: number;
  required: boolean;
  needsChildVoice: boolean;
  needsEvidence: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// WEEKLY CHILD REPORT — 15 sections
// ══════════════════════════════════════════════════════════════════════════════

const WEEKLY_CHILD_REPORT_SECTIONS: SectionTemplate[] = [
  {
    key: "overview",
    title: "Overview",
    order: 1,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "presentation",
    title: "Presentation",
    order: 2,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "positives",
    title: "Positives",
    order: 3,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "childs_voice",
    title: "Child's Voice",
    order: 4,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "incidents_concerns",
    title: "Incidents / Concerns",
    order: 5,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "education",
    title: "Education",
    order: 6,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "health",
    title: "Health",
    order: 7,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "family_contact",
    title: "Family Contact",
    order: 8,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "keywork_direct_work",
    title: "Keywork / Direct Work",
    order: 9,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "risk_assessment",
    title: "Risk Assessment",
    order: 10,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "care_plan",
    title: "Care Plan",
    order: 11,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "staff_reflection",
    title: "Staff Reflection",
    order: 12,
    required: false,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "manager_oversight",
    title: "Manager Oversight",
    order: 13,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "actions",
    title: "Actions",
    order: 14,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "evidence_summary",
    title: "Evidence Summary",
    order: 15,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// CHILD REVIEW REPORT — 18 sections
// ══════════════════════════════════════════════════════════════════════════════

const CHILD_REVIEW_REPORT_SECTIONS: SectionTemplate[] = [
  {
    key: "purpose",
    title: "Purpose",
    order: 1,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "current_placement",
    title: "Current Placement",
    order: 2,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "progress",
    title: "Progress",
    order: 3,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "childs_views",
    title: "Child's Views",
    order: 4,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "emotional_wellbeing",
    title: "Emotional Wellbeing",
    order: 5,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "education",
    title: "Education",
    order: 6,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "health",
    title: "Health",
    order: 7,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "family_relationships",
    title: "Family / Relationships",
    order: 8,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "behaviour_risk_safeguarding",
    title: "Behaviour, Risk & Safeguarding",
    order: 9,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "keywork_direct_work",
    title: "Keywork / Direct Work",
    order: 10,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "therapeutic_themes",
    title: "Therapeutic Themes",
    order: 11,
    required: false,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "placement_stability",
    title: "Placement Stability",
    order: 12,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "care_plan_progress",
    title: "Care Plan Progress",
    order: 13,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "working_well",
    title: "Working Well",
    order: 14,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "remaining_concerns",
    title: "Remaining Concerns",
    order: 15,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "recommended_next_steps",
    title: "Recommended Next Steps",
    order: 16,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "manager_oversight",
    title: "Manager Oversight",
    order: 17,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "evidence_summary",
    title: "Evidence Summary",
    order: 18,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// RISK REVIEW REPORT — 12 sections
// ══════════════════════════════════════════════════════════════════════════════

const RISK_REVIEW_REPORT_SECTIONS: SectionTemplate[] = [
  {
    key: "overview",
    title: "Overview",
    order: 1,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "current_risk_profile",
    title: "Current Risk Profile",
    order: 2,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "incident_analysis",
    title: "Incident Analysis",
    order: 3,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "safeguarding_concerns",
    title: "Safeguarding Concerns",
    order: 4,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "missing_episodes",
    title: "Missing Episodes",
    order: 5,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "exploitation_indicators",
    title: "Exploitation Indicators",
    order: 6,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "protective_factors",
    title: "Protective Factors",
    order: 7,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "risk_mitigation_actions",
    title: "Risk Mitigation Actions",
    order: 8,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "childs_perspective",
    title: "Child's Perspective on Safety",
    order: 9,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "manager_analysis",
    title: "Manager Analysis",
    order: 10,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "recommended_actions",
    title: "Recommended Actions",
    order: 11,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "evidence_summary",
    title: "Evidence Summary",
    order: 12,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// SOCIAL WORKER UPDATE — 9 sections
// ══════════════════════════════════════════════════════════════════════════════

const SOCIAL_WORKER_UPDATE_SECTIONS: SectionTemplate[] = [
  {
    key: "purpose_of_update",
    title: "Purpose of Update",
    order: 1,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "current_presentation",
    title: "Current Presentation",
    order: 2,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "progress_and_positives",
    title: "Progress & Positives",
    order: 3,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "concerns_and_risks",
    title: "Concerns & Risks",
    order: 4,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "childs_voice",
    title: "Child's Voice",
    order: 5,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "placement_plan_update",
    title: "Placement Plan Update",
    order: 6,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "family_contact",
    title: "Family Contact",
    order: 7,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "actions_required",
    title: "Actions Required",
    order: 8,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "manager_sign_off",
    title: "Manager Sign-Off",
    order: 9,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// MONTHLY PROGRESS SUMMARY — 16 sections
// ══════════════════════════════════════════════════════════════════════════════

const MONTHLY_PROGRESS_SUMMARY_SECTIONS: SectionTemplate[] = [
  {
    key: "overview",
    title: "Overview",
    order: 1,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "presentation_and_wellbeing",
    title: "Presentation & Wellbeing",
    order: 2,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "positives_and_achievements",
    title: "Positives & Achievements",
    order: 3,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "childs_voice",
    title: "Child's Voice",
    order: 4,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "incidents_and_concerns",
    title: "Incidents & Concerns",
    order: 5,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "education",
    title: "Education",
    order: 6,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "health",
    title: "Health",
    order: 7,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "family_contact_and_relationships",
    title: "Family Contact & Relationships",
    order: 8,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "keywork_and_direct_work",
    title: "Keywork & Direct Work",
    order: 9,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "risk_and_safeguarding",
    title: "Risk & Safeguarding",
    order: 10,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "care_plan_progress",
    title: "Care Plan Progress",
    order: 11,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "placement_stability",
    title: "Placement Stability",
    order: 12,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "staff_reflection",
    title: "Staff Reflection",
    order: 13,
    required: false,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "manager_oversight",
    title: "Manager Oversight",
    order: 14,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "actions",
    title: "Actions",
    order: 15,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "evidence_summary",
    title: "Evidence Summary",
    order: 16,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// KEYWORK PROGRESS REPORT — 11 sections
// ══════════════════════════════════════════════════════════════════════════════

const KEYWORK_PROGRESS_REPORT_SECTIONS: SectionTemplate[] = [
  {
    key: "overview",
    title: "Overview",
    order: 1,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "sessions_completed",
    title: "Sessions Completed",
    order: 2,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "themes_explored",
    title: "Themes Explored",
    order: 3,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "childs_engagement",
    title: "Child's Engagement",
    order: 4,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "childs_voice",
    title: "Child's Voice",
    order: 5,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "progress_against_goals",
    title: "Progress Against Goals",
    order: 6,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "therapeutic_observations",
    title: "Therapeutic Observations",
    order: 7,
    required: false,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "barriers_and_challenges",
    title: "Barriers & Challenges",
    order: 8,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "recommended_next_steps",
    title: "Recommended Next Steps",
    order: 9,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "manager_oversight",
    title: "Manager Oversight",
    order: 10,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "evidence_summary",
    title: "Evidence Summary",
    order: 11,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// PLACEMENT STABILITY REPORT — 13 sections
// ══════════════════════════════════════════════════════════════════════════════

const PLACEMENT_STABILITY_REPORT_SECTIONS: SectionTemplate[] = [
  {
    key: "overview",
    title: "Overview",
    order: 1,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "placement_history",
    title: "Placement History",
    order: 2,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "current_stability_assessment",
    title: "Current Stability Assessment",
    order: 3,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "childs_views_on_placement",
    title: "Child's Views on Placement",
    order: 4,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "relationships_and_belonging",
    title: "Relationships & Belonging",
    order: 5,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "risk_factors",
    title: "Risk Factors",
    order: 6,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "protective_factors",
    title: "Protective Factors",
    order: 7,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "peer_dynamics",
    title: "Peer Dynamics",
    order: 8,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "staffing_consistency",
    title: "Staffing Consistency",
    order: 9,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "care_plan_alignment",
    title: "Care Plan Alignment",
    order: 10,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "recommended_actions",
    title: "Recommended Actions",
    order: 11,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "manager_oversight",
    title: "Manager Oversight",
    order: 12,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "evidence_summary",
    title: "Evidence Summary",
    order: 13,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// EDUCATION & HEALTH SUMMARY — 12 sections
// ══════════════════════════════════════════════════════════════════════════════

const EDUCATION_HEALTH_SUMMARY_SECTIONS: SectionTemplate[] = [
  {
    key: "overview",
    title: "Overview",
    order: 1,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "education_placement",
    title: "Education Placement",
    order: 2,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "attendance_and_engagement",
    title: "Attendance & Engagement",
    order: 3,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "academic_progress",
    title: "Academic Progress",
    order: 4,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "sen_and_ehcp",
    title: "SEN & EHCP",
    order: 5,
    required: false,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "childs_views_on_education",
    title: "Child's Views on Education",
    order: 6,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "physical_health",
    title: "Physical Health",
    order: 7,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "emotional_and_mental_health",
    title: "Emotional & Mental Health",
    order: 8,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "medication",
    title: "Medication",
    order: 9,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "health_appointments",
    title: "Health Appointments",
    order: 10,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "recommended_actions",
    title: "Recommended Actions",
    order: 11,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "evidence_summary",
    title: "Evidence Summary",
    order: 12,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// END OF PLACEMENT / TRANSITION REPORT — 16 sections
// ══════════════════════════════════════════════════════════════════════════════

const END_OF_PLACEMENT_TRANSITION_REPORT_SECTIONS: SectionTemplate[] = [
  {
    key: "overview",
    title: "Overview",
    order: 1,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "placement_summary",
    title: "Placement Summary",
    order: 2,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "reason_for_transition",
    title: "Reason for Transition",
    order: 3,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "childs_views_and_wishes",
    title: "Child's Views & Wishes",
    order: 4,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "progress_during_placement",
    title: "Progress During Placement",
    order: 5,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "education_during_placement",
    title: "Education During Placement",
    order: 6,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "health_during_placement",
    title: "Health During Placement",
    order: 7,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "relationships_and_identity",
    title: "Relationships & Identity",
    order: 8,
    required: true,
    needsChildVoice: true,
    needsEvidence: true,
  },
  {
    key: "risk_and_safeguarding_summary",
    title: "Risk & Safeguarding Summary",
    order: 9,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "what_worked_well",
    title: "What Worked Well",
    order: 10,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "outstanding_concerns",
    title: "Outstanding Concerns",
    order: 11,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
  {
    key: "transition_plan",
    title: "Transition Plan",
    order: 12,
    required: true,
    needsChildVoice: true,
    needsEvidence: false,
  },
  {
    key: "handover_information",
    title: "Handover Information",
    order: 13,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "recommended_actions",
    title: "Recommended Actions for Receiving Placement",
    order: 14,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "manager_oversight",
    title: "Manager Oversight",
    order: 15,
    required: true,
    needsChildVoice: false,
    needsEvidence: false,
  },
  {
    key: "evidence_summary",
    title: "Evidence Summary",
    order: 16,
    required: true,
    needsChildVoice: false,
    needsEvidence: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// MASTER TEMPLATE REGISTRY
// ══════════════════════════════════════════════════════════════════════════════

export const REPORT_SECTION_TEMPLATES: Record<ReportType, SectionTemplate[]> = {
  weekly_child_report: WEEKLY_CHILD_REPORT_SECTIONS,
  child_review_report: CHILD_REVIEW_REPORT_SECTIONS,
  social_worker_update: SOCIAL_WORKER_UPDATE_SECTIONS,
  monthly_progress_summary: MONTHLY_PROGRESS_SUMMARY_SECTIONS,
  risk_review_report: RISK_REVIEW_REPORT_SECTIONS,
  keywork_progress_report: KEYWORK_PROGRESS_REPORT_SECTIONS,
  placement_stability_report: PLACEMENT_STABILITY_REPORT_SECTIONS,
  education_health_summary: EDUCATION_HEALTH_SUMMARY_SECTIONS,
  end_of_placement_transition_report: END_OF_PLACEMENT_TRANSITION_REPORT_SECTIONS,
};

// ── Helper Functions ────────────────────────────────────────────────────────

/**
 * Returns the section templates for a given report type.
 * Throws if the report type is not recognised.
 */
export function getSectionsForReportType(reportType: ReportType): SectionTemplate[] {
  const sections = REPORT_SECTION_TEMPLATES[reportType];
  if (!sections) {
    throw new Error(`Unknown report type: ${reportType}`);
  }
  return sections;
}

/**
 * Returns only the required sections for a given report type.
 */
export function getRequiredSections(reportType: ReportType): SectionTemplate[] {
  return getSectionsForReportType(reportType).filter((s) => s.required);
}

/**
 * Returns all sections that require child voice content.
 */
export function getChildVoiceSections(reportType: ReportType): SectionTemplate[] {
  return getSectionsForReportType(reportType).filter((s) => s.needsChildVoice);
}

/**
 * Returns all sections that require evidence links.
 */
export function getEvidenceSections(reportType: ReportType): SectionTemplate[] {
  return getSectionsForReportType(reportType).filter((s) => s.needsEvidence);
}
