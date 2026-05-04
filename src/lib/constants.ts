// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONSTANTS
// Regulated care operations platform for children's homes
// ══════════════════════════════════════════════════════════════════════════════

export const APP_NAME = "Cornerstone";
export const APP_TAGLINE = "The operating system for children's homes";

// ── Roles & Permissions ──────────────────────────────────────────────────────

export const SYSTEM_ROLES = [
  "registered_manager",
  "responsible_individual",
  "deputy_manager",
  "team_leader",
  "residential_care_worker",
  "bank_staff",
  "admin",
  // Extended roles
  "super_admin",
  "therapist",
  "hr_recruitment",
  "finance_operations",
  "external_partner",
  "auditor",
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

export const ROLE_LABELS: Record<SystemRole, string> = {
  registered_manager: "Registered Manager",
  responsible_individual: "Responsible Individual",
  deputy_manager: "Deputy Manager",
  team_leader: "Team Leader",
  residential_care_worker: "Residential Care Worker",
  bank_staff: "Bank Staff",
  admin: "Administrator",
  super_admin: "Super Admin",
  therapist: "Therapist / Clinician",
  hr_recruitment: "HR / Recruitment",
  finance_operations: "Finance / Operations",
  external_partner: "External Professional",
  auditor: "Auditor / Inspector",
};

// ── Task System ──────────────────────────────────────────────────────────────

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ["not_started", "in_progress", "blocked", "completed", "cancelled"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_CATEGORIES = [
  "compliance",
  "safeguarding",
  "medication",
  "maintenance",
  "staffing",
  "training",
  "supervision",
  "young_person_plans",
  "professional_communication",
  "finance",
  "inspection",
  "health_and_safety",
  "admin",
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  compliance: "Compliance",
  safeguarding: "Safeguarding",
  medication: "Medication",
  maintenance: "Maintenance",
  staffing: "Staffing",
  training: "Training",
  supervision: "Supervision",
  young_person_plans: "Young Person Plans",
  professional_communication: "Professional Communication",
  finance: "Finance",
  inspection: "Inspection",
  health_and_safety: "Health & Safety",
  admin: "Admin",
};

// ── Incident System ──────────────────────────────────────────────────────────

export const INCIDENT_TYPES = [
  "safeguarding_concern",
  "missing_from_care",
  "physical_intervention",
  "self_harm",
  "damage_to_property",
  "complaint",
  "medication_error",
  "allegation",
  "police_involvement",
  "hospital_attendance",
  "behaviour_incident",
  "contextual_safeguarding",
  "exploitation_concern",
  "bullying",
  "online_safety",
  "other",
] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  safeguarding_concern: "Safeguarding Concern",
  missing_from_care: "Missing from Care",
  physical_intervention: "Physical Intervention",
  self_harm: "Self-Harm",
  damage_to_property: "Damage to Property",
  complaint: "Complaint",
  medication_error: "Medication Error",
  allegation: "Allegation",
  police_involvement: "Police Involvement",
  hospital_attendance: "Hospital Attendance",
  behaviour_incident: "Behaviour Incident",
  contextual_safeguarding: "Contextual Safeguarding",
  exploitation_concern: "Exploitation Concern",
  bullying: "Bullying",
  online_safety: "Online Safety",
  other: "Other",
};

export const INCIDENT_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

// ── Shift System ─────────────────────────────────────────────────────────────

export const SHIFT_TYPES = ["day", "sleep_in", "waking_night", "short", "handover", "on_call", "training_day"] as const;
export type ShiftType = (typeof SHIFT_TYPES)[number];

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  day: "Day Shift",
  sleep_in: "Sleep-in",
  waking_night: "Waking Night",
  short: "Short Shift",
  handover: "Handover",
  on_call: "On Call",
  training_day: "Training Day",
};

export const LEAVE_TYPES = ["annual_leave", "sick", "compassionate", "parental", "unpaid", "toil", "training"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual_leave: "Annual Leave",
  sick: "Sickness",
  compassionate: "Compassionate",
  parental: "Parental Leave",
  unpaid: "Unpaid Leave",
  toil: "TOIL",
  training: "Training",
};

// ── Employment ───────────────────────────────────────────────────────────────

export const EMPLOYMENT_TYPES = ["permanent", "fixed_term", "bank", "agency", "volunteer"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_STATUSES = ["active", "probation", "suspended", "notice_period", "left"] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

// ── Training / Compliance ────────────────────────────────────────────────────

export const TRAINING_CATEGORIES = [
  "mandatory",
  "safeguarding",
  "medication",
  "first_aid",
  "fire_safety",
  "restraint",
  "mental_health",
  "data_protection",
  "health_and_safety",
  "food_hygiene",
  "equality_diversity",
  "trauma_informed",
  "professional_development",
] as const;
export type TrainingCategory = (typeof TRAINING_CATEGORIES)[number];

export const COMPLIANCE_STATUSES = ["compliant", "expiring_soon", "expired", "not_started"] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// ── Documents ────────────────────────────────────────────────────────────────

export const DOCUMENT_CATEGORIES = [
  "policy",
  "procedure",
  "risk_assessment",
  "care_plan",
  "placement_plan",
  "missing_protocol",
  "behaviour_support",
  "health_plan",
  "education_plan",
  "reg44_report",
  "reg45_report",
  "ofsted_correspondence",
  "supervision_record",
  "training_certificate",
  "dbs_certificate",
  "contract",
  "template",
  "other",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

// ── Medication ───────────────────────────────────────────────────────────────

export const MEDICATION_TYPES = ["regular", "prn", "controlled", "topical", "inhaler", "injection", "other"] as const;
export type MedicationType = (typeof MEDICATION_TYPES)[number];

export const ADMINISTRATION_STATUSES = ["given", "refused", "withheld", "not_available", "self_administered", "late", "missed", "scheduled"] as const;
export type AdministrationStatus = (typeof ADMINISTRATION_STATUSES)[number];

// ── Ofsted Quality Standards ─────────────────────────────────────────────────

export const QUALITY_STANDARDS = [
  { id: "qs1", label: "The overall experiences and progress of children and young people" },
  { id: "qs2", label: "How well children and young people are helped and protected" },
  { id: "qs3", label: "The effectiveness of leaders and managers" },
] as const;

export const OFSTED_GRADES = ["outstanding", "good", "requires_improvement", "inadequate"] as const;
export type OfstedGrade = (typeof OFSTED_GRADES)[number];

// ── Supervision & Performance ────────────────────────────────────────────────

export const SUPERVISION_TYPES = ["formal", "informal", "group", "reflective_practice", "probation_review"] as const;
export type SupervisionType = (typeof SUPERVISION_TYPES)[number];

export const SUPERVISION_TYPE_LABELS: Record<SupervisionType, string> = {
  formal:               "Formal Supervision",
  informal:             "Informal Check-in",
  group:                "Group Supervision",
  reflective_practice:  "Reflective Practice",
  probation_review:     "Probation Review",
};

export const APPRAISAL_RATINGS = ["exceptional", "effective", "developing", "requires_support"] as const;
export type AppraisalRating = (typeof APPRAISAL_RATINGS)[number];

// ── Finance ──────────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  "petty_cash",
  "young_person_activities",
  "food_shopping",
  "clothing",
  "transport",
  "maintenance",
  "office_supplies",
  "training",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_STATUSES = ["draft", "submitted", "approved", "rejected", "paid"] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

// ── Recruitment ──────────────────────────────────────────────────────────────

export const RECRUITMENT_STAGES = [
  "application_received",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "references_requested",
  "dbs_submitted",
  "offer_made",
  "onboarding",
  "started",
  "withdrawn",
  "rejected",
] as const;
export type RecruitmentStage = (typeof RECRUITMENT_STAGES)[number];

// ── Navigation ───────────────────────────────────────────────────────────────

// ── Safer Recruitment ────────────────────────────────────────────────────────

export const RECRUITMENT_STAGES_V2 = [
  "enquiry", "application_received", "sift", "interview_scheduled",
  "interview_completed", "references_requested", "references_received",
  "dbs_submitted", "dbs_received", "conditional_offer", "pre_start_checks",
  "final_clearance", "onboarding", "appointed", "unsuccessful", "withdrawn"
] as const;

export const RECRUITMENT_STAGE_LABELS: Record<string, string> = {
  enquiry: "Enquiry",
  application_received: "Application Received",
  sift: "Sift",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Completed",
  references_requested: "References Requested",
  references_received: "References Received",
  dbs_submitted: "DBS Submitted",
  dbs_received: "DBS Received",
  conditional_offer: "Conditional Offer",
  pre_start_checks: "Pre-Start Checks",
  final_clearance: "Final Clearance",
  onboarding: "Onboarding",
  appointed: "Appointed",
  unsuccessful: "Unsuccessful",
  withdrawn: "Withdrawn",
};

export const CHECK_TYPE_LABELS: Record<string, string> = {
  enhanced_dbs: "Enhanced DBS",
  barred_list: "Barred List Check",
  right_to_work: "Right to Work",
  identity: "Identity Verification",
  overseas_criminal_record: "Overseas Criminal Record",
  professional_qualifications: "Qualifications Verification",
  employment_history: "Employment History",
  medical_fitness: "Medical Fitness",
  social_media: "Social Media Check",
  references: "References",
  driving_licence: "Driving Licence",
  safeguarding_training_check: "Safeguarding Training",
};

// ── Navigation ───────────────────────────────────────────────────────────────

export const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { label: "My Day", href: "/dashboard/my-day", icon: "Target" },
    ],
  },
  {
    label: "Care",
    items: [
      { label: "Young People", href: "/young-people", icon: "Heart" },
      { label: "Daily Log", href: "/daily-log", icon: "BookOpen" },
      { label: "Incidents", href: "/incidents", icon: "AlertTriangle" },
      { label: "Safeguarding", href: "/safeguarding", icon: "Shield" },
      { label: "Medication", href: "/medication", icon: "Pill" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Tasks", href: "/tasks", icon: "CheckSquare" },
      { label: "Rota", href: "/rota", icon: "Calendar" },
      { label: "Handover", href: "/handover", icon: "ArrowRightLeft" },
      { label: "Maintenance", href: "/maintenance", icon: "Wrench" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Staff", href: "/staff", icon: "Users" },
      { label: "Supervision", href: "/supervision", icon: "MessageSquare" },
      { label: "Training", href: "/training", icon: "GraduationCap" },
      { label: "Recruitment", href: "/recruitment", icon: "UserPlus" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { label: "Documents", href: "/documents", icon: "FileText" },
      { label: "Audits", href: "/audits", icon: "ClipboardCheck" },
      { label: "Inspection", href: "/inspection", icon: "Award" },
      { label: "Reports", href: "/reports", icon: "BarChart3" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Expenses", href: "/expenses", icon: "Receipt" },
      { label: "Timesheets", href: "/timesheets", icon: "Clock" },
    ],
  },
] as const;

// ── Care Forms ────────────────────────────────────────────────────────────────

export const CARE_FORM_TYPES = [
  "daily_check",
  "risk_assessment",
  "behaviour_record",
  "health_record",
  "key_work_session",
  "missing_person_protocol",
  "return_from_missing",
  "contact_log",
  "education_update",
  "review_meeting_notes",
  "medication_audit",
  "physical_check",
  "welfare_check",
  "placement_review",
  "safeguarding_referral",
  "court_report",
  "professional_meeting",
  "supervision_record",
  "health_safety_check",
] as const;
export type CareFormType = (typeof CARE_FORM_TYPES)[number];

export const CARE_FORM_TYPE_LABELS: Record<CareFormType, string> = {
  daily_check: "Daily Check",
  risk_assessment: "Risk Assessment",
  behaviour_record: "Behaviour Record",
  health_record: "Health Record",
  key_work_session: "Key Work Session",
  missing_person_protocol: "Missing Person Protocol",
  return_from_missing: "Return from Missing Interview",
  contact_log: "Contact Log",
  education_update: "Education Update",
  review_meeting_notes: "Review Meeting Notes",
  medication_audit: "Medication Audit",
  physical_check: "Physical Check",
  welfare_check: "Welfare Check",
  placement_review: "Placement Review",
  safeguarding_referral: "Safeguarding Referral",
  court_report: "Court Report",
  professional_meeting: "Professional Meeting",
  supervision_record: "Supervision Record",
  health_safety_check: "H&S Check",
};

export const CARE_FORM_STATUSES = [
  "draft",
  "submitted",
  "pending_review",
  "approved",
  "rejected",
  "archived",
] as const;
export type CareFormStatus = (typeof CARE_FORM_STATUSES)[number];
