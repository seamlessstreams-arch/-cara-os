// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TYPE SYSTEM
// Every entity is typed. Every relationship is explicit.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  SystemRole, TaskPriority, TaskStatus, TaskCategory,
  IncidentType, IncidentSeverity, ShiftType, LeaveType,
  EmploymentType, EmploymentStatus, TrainingCategory,
  ComplianceStatus, DocumentCategory, MedicationType,
  AdministrationStatus, SupervisionType, AppraisalRating,
  ExpenseCategory, ExpenseStatus, RecruitmentStage,
  CareFormType, CareFormStatus,
} from "@/lib/constants";

// ── Base ─────────────────────────────────────────────────────────────────────

export interface AuditFields {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

// ── Staff / User ─────────────────────────────────────────────────────────────

export interface StaffMember extends AuditFields {
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: SystemRole;
  job_title: string;
  employment_type: EmploymentType;
  employment_status: EmploymentStatus;
  start_date: string;
  end_date: string | null;
  probation_end_date: string | null;
  contracted_hours: number;
  hourly_rate: number | null;
  annual_salary: number | null;
  payroll_id: string | null;
  dbs_number: string | null;
  dbs_issue_date: string | null;
  dbs_update_service: boolean;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  next_supervision_due: string | null;
  next_appraisal_due: string | null;
  avatar_url: string | null;
  home_id: string;
  is_active: boolean;
}

// ── Young Person ─────────────────────────────────────────────────────────────

export interface YoungPerson extends AuditFields {
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  date_of_birth: string;
  gender: string;
  ethnicity: string | null;
  religion: string | null;
  placement_start: string;
  placement_end: string | null;
  placement_type: string;
  local_authority: string;
  social_worker_name: string;
  social_worker_phone: string | null;
  social_worker_email: string | null;
  iro_name: string | null;
  iro_phone: string | null;
  key_worker_id: string | null;
  secondary_worker_id: string | null;
  legal_status: string;
  risk_flags: string[];
  dietary_requirements: string | null;
  allergies: string[];
  gp_name: string | null;
  gp_phone: string | null;
  school_name: string | null;
  school_contact: string | null;
  photo_url: string | null;
  status: "current" | "planned" | "ended" | "emergency";
  home_id: string;
}

// ── Task ─────────────────────────────────────────────────────────────────────

export interface Task extends AuditFields {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to: string | null;
  assigned_role: SystemRole | null;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  recurring: boolean;
  recurring_schedule: "daily" | "weekly" | "fortnightly" | "monthly" | null;
  requires_sign_off: boolean;
  signed_off_by: string | null;
  signed_off_at: string | null;
  evidence_note: string | null;
  evidence_files: string[];
  escalated: boolean;
  escalated_to: string | null;
  escalated_at: string | null;
  escalation_reason: string | null;
  // Entity links
  linked_child_id: string | null;
  linked_incident_id: string | null;
  linked_document_id: string | null;
  parent_task_id: string | null;
  home_id: string;
  tags: string[];
}

// ── Incident ─────────────────────────────────────────────────────────────────

export interface Incident extends AuditFields {
  reference: string;
  type: IncidentType;
  severity: IncidentSeverity;
  child_id: string;
  date: string;
  time: string;
  location: string | null;
  description: string;
  immediate_action: string;
  reported_by: string;
  witnesses: string[];
  body_map_required: boolean;
  body_map_completed: boolean;
  body_map_url: string | null;
  notifications: IncidentNotification[];
  requires_oversight: boolean;
  oversight_note: string | null;
  oversight_by: string | null;
  oversight_at: string | null;
  status: "open" | "under_review" | "closed";
  outcome: string | null;
  lessons_learned: string | null;
  linked_task_ids: string[];
  linked_document_ids: string[];
  home_id: string;
}

export interface IncidentNotification {
  role: string;
  name: string;
  method: string;
  notified_at: string;
  acknowledged: boolean;
}

// ── Shift / Rota ─────────────────────────────────────────────────────────────

export interface Shift extends AuditFields {
  staff_id: string;
  date: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  break_minutes: number;
  actual_start: string | null;
  actual_end: string | null;
  clock_in_at: string | null;
  clock_out_at: string | null;
  overtime_minutes: number;
  notes: string | null;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "no_show" | "cancelled";
  is_open_shift: boolean;
  home_id: string;
}

export interface LeaveRequest extends AuditFields {
  staff_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: "pending" | "approved" | "declined" | "cancelled";
  approved_by: string | null;
  approved_at: string | null;
  return_to_work_required: boolean;
  return_to_work_completed: boolean;
  return_to_work_date: string | null;
  return_to_work_by: string | null;
  return_to_work_notes: string | null;
  home_id: string;
}

// ── Training / Compliance ────────────────────────────────────────────────────

export interface TrainingRecord extends AuditFields {
  staff_id: string;
  course_name: string;
  category: TrainingCategory;
  provider: string | null;
  completed_date: string | null;
  expiry_date: string | null;
  certificate_url: string | null;
  status: ComplianceStatus;
  is_mandatory: boolean;
  notes: string | null;
  home_id: string;
}

export interface TrainingRequirement {
  id: string;
  course_name: string;
  category: TrainingCategory;
  is_mandatory: boolean;
  renewal_months: number | null;
  applies_to_roles: SystemRole[];
  home_id: string;
}

// ── Supervision ──────────────────────────────────────────────────────────────

export interface Supervision extends AuditFields {
  staff_id: string;
  supervisor_id: string;
  type: SupervisionType;
  scheduled_date: string;
  actual_date: string | null;
  duration_minutes: number | null;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  discussion_points: string;
  actions_agreed: SupervisionAction[];
  wellbeing_score: number | null;
  staff_signature: boolean;
  supervisor_signature: boolean;
  next_date: string | null;
  linked_document_id: string | null;
  home_id: string;
}

export interface SupervisionAction {
  id: string;
  description: string;
  owner: string;
  due_date: string;
  status: "pending" | "completed";
  completed_at: string | null;
}

// ── Document ─────────────────────────────────────────────────────────────────

export interface Document extends AuditFields {
  title: string;
  category: DocumentCategory;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  version: number;
  previous_version_id: string | null;
  requires_read_sign: boolean;
  linked_child_id: string | null;
  linked_staff_id: string | null;
  linked_incident_id: string | null;
  expiry_date: string | null;
  tags: string[];
  home_id: string;
}

export interface DocumentReadReceipt {
  id: string;
  document_id: string;
  staff_id: string;
  read_at: string;
  signed_at: string | null;
}

// ── Medication ───────────────────────────────────────────────────────────────

export interface Medication extends AuditFields {
  child_id: string;
  name: string;
  type: MedicationType;
  dosage: string;
  frequency: string;
  route: string;
  prescriber: string;
  pharmacy: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  stock_count: number | null;
  stock_last_checked: string | null;
  side_effects: string | null;
  special_instructions: string | null;
  home_id: string;
}

export interface MedicationAdministration extends AuditFields {
  medication_id: string;
  child_id: string;
  scheduled_time: string;
  actual_time: string | null;
  status: AdministrationStatus;
  administered_by: string | null;
  witnessed_by: string | null;
  dose_given: string | null;
  reason_not_given: string | null;
  notes: string | null;
  prn_reason: string | null;
  prn_effectiveness: string | null;
  home_id: string;
}

// ── Daily Log ────────────────────────────────────────────────────────────────

export interface DailyLogEntry extends AuditFields {
  child_id: string;
  date: string;
  time: string;
  entry_type: "general" | "behaviour" | "health" | "education" | "contact" | "activity" | "mood" | "sleep" | "food";
  content: string;
  mood_score: number | null;
  staff_id: string;
  linked_incident_id: string | null;
  is_significant: boolean;
  home_id: string;
}

// ── Expense ──────────────────────────────────────────────────────────────────

export interface Expense extends AuditFields {
  submitted_by: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  receipt_url: string | null;
  date: string;
  status: ExpenseStatus;
  approved_by: string | null;
  approved_at: string | null;
  linked_child_id: string | null;
  payment_method: string | null;
  home_id: string;
}

// ── Recruitment ──────────────────────────────────────────────────────────────

export interface Candidate extends AuditFields {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role_applied: string;
  stage: RecruitmentStage;
  source: string | null;
  cv_url: string | null;
  interview_date: string | null;
  interview_notes: string | null;
  reference_1_name: string | null;
  reference_1_status: "pending" | "received" | "satisfactory" | "unsatisfactory" | null;
  reference_2_name: string | null;
  reference_2_status: "pending" | "received" | "satisfactory" | "unsatisfactory" | null;
  dbs_submitted: boolean;
  dbs_received: boolean;
  offer_date: string | null;
  start_date: string | null;
  notes: string | null;
  home_id: string;
}

// ── Audit Trail ──────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: "create" | "update" | "delete" | "sign_off" | "escalate" | "complete" | "view";
  changes: Record<string, { old: unknown; new: unknown }>;
  performed_by: string;
  performed_at: string;
  ip_address: string | null;
  home_id: string;
}

// ── Notification ─────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  recipient_id: string;
  title: string;
  body: string;
  type: "task" | "incident" | "training" | "leave" | "supervision" | "medication" | "document" | "system";
  priority: "low" | "normal" | "high" | "urgent";
  read: boolean;
  read_at: string | null;
  action_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  home_id: string;
}

// ── Dashboard Aggregates ─────────────────────────────────────────────────────

export interface DashboardStats {
  tasks: {
    total_active: number;
    overdue: number;
    due_today: number;
    high_priority: number;
    awaiting_sign_off: number;
    completed_today: number;
    my_tasks: number;
  };
  incidents: {
    open: number;
    awaiting_oversight: number;
    critical_open: number;
    this_week: number;
    this_month: number;
  };
  staffing: {
    on_shift_today: number;
    on_leave: number;
    open_shifts: number;
    overtime_hours_week: number;
  };
  compliance: {
    training_expired: number;
    training_expiring_30d: number;
    supervisions_overdue: number;
    dbs_expiring: number;
    policies_due_review: number;
  };
  medication: {
    exceptions_today: number;
    stock_alerts: number;
    prn_given_today: number;
  };
  young_people: {
    current: number;
    missing_episodes_month: number;
    welfare_checks_due: number;
  };
}

// ── Care Form ────────────────────────────────────────────────────────────────

export interface CareForm extends AuditFields {
  title: string;
  form_type: CareFormType;
  status: CareFormStatus;
  // Context links
  linked_child_id: string | null;
  linked_staff_id: string | null;
  linked_incident_id: string | null;
  linked_shift_id: string | null;
  linked_task_id: string | null;
  // Content
  description: string | null;
  body: Record<string, unknown>;
  // Workflow
  submitted_at: string | null;
  submitted_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  // Tracking
  due_date: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  tags: string[];
  home_id: string;
}

// ── Home (the physical children's home) ──────────────────────────────────────

export interface Home {
  id: string;
  name: string;
  address: string;
  phone: string;
  ofsted_urn: string | null;
  registered_manager_id: string;
  responsible_individual_id: string | null;
  max_beds: number;
  current_occupancy: number;
  last_inspection_date: string | null;
  last_inspection_grade: string | null;
  created_at: string;
}
