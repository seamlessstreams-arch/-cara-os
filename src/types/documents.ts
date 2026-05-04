// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DOCUMENT INTELLIGENCE TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type DocumentIntelStatus =
  | "pending"
  | "analysing"
  | "review"
  | "approved"
  | "rejected"
  | "actioned"
  | "archived";

export type DocumentIntelRisk = "low" | "medium" | "high" | "critical";

export type DocumentIntelFileType =
  | "pdf"
  | "docx"
  | "xlsx"
  | "csv"
  | "png"
  | "jpg"
  | "txt"
  | "email"
  | "other";

export type DocumentIntelCategory =
  // Child-related
  | "placement_plan"
  | "care_plan"
  | "risk_assessment"
  | "mfc_report"
  | "incident_report"
  | "strategy_meeting"
  | "cla_review"
  | "pep_minutes"
  | "health_assessment"
  | "therapy_report"
  | "education_report"
  | "family_time_agreement"
  | "safety_plan"
  | "court_document"
  | "delegated_authority"
  | "behaviour_support_plan"
  | "independence_plan"
  // Staff-related
  | "dbs_certificate"
  | "right_to_work"
  | "reference"
  | "interview_notes"
  | "application_form"
  | "training_certificate"
  | "supervision_record_doc"
  | "probation_review"
  | "disciplinary"
  | "grievance"
  | "return_to_work"
  | "sickness_record"
  // Home/compliance
  | "fire_risk_assessment"
  | "health_safety_check"
  | "vehicle_check_doc"
  | "maintenance_record"
  | "reg44_report"
  | "reg45_review"
  | "ofsted_communication"
  | "policy_document"
  | "audit_document"
  | "insurance_certificate"
  | "la_contract"
  | "safer_recruitment"
  | "medication_audit"
  | "training_matrix"
  | "other";

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentIntelCategory, string> = {
  placement_plan: "Placement Plan",
  care_plan: "Care Plan",
  risk_assessment: "Risk Assessment",
  mfc_report: "Missing from Care Report",
  incident_report: "Incident Report",
  strategy_meeting: "Strategy Meeting Minutes",
  cla_review: "CLA Review Minutes",
  pep_minutes: "PEP Meeting Minutes",
  health_assessment: "Health Assessment",
  therapy_report: "Therapy Report",
  education_report: "Education Report",
  family_time_agreement: "Family Time Agreement",
  safety_plan: "Safety Plan",
  court_document: "Court Document",
  delegated_authority: "Delegated Authority Document",
  behaviour_support_plan: "Behaviour Support Plan",
  independence_plan: "Independence Plan",
  dbs_certificate: "DBS Certificate",
  right_to_work: "Right to Work Document",
  reference: "Reference",
  interview_notes: "Interview Notes",
  application_form: "Application Form",
  training_certificate: "Training Certificate",
  supervision_record_doc: "Supervision Record",
  probation_review: "Probation Review",
  disciplinary: "Disciplinary Document",
  grievance: "Grievance Document",
  return_to_work: "Return to Work Form",
  sickness_record: "Sickness Record",
  fire_risk_assessment: "Fire Risk Assessment",
  health_safety_check: "Health & Safety Check",
  vehicle_check_doc: "Vehicle Check",
  maintenance_record: "Maintenance Record",
  reg44_report: "Regulation 44 Report",
  reg45_review: "Regulation 45 Review",
  ofsted_communication: "Ofsted Communication",
  policy_document: "Policy Document",
  audit_document: "Audit Document",
  insurance_certificate: "Insurance Certificate",
  la_contract: "Local Authority Contract",
  safer_recruitment: "Safer Recruitment Evidence",
  medication_audit: "Medication Audit",
  training_matrix: "Training Matrix",
  other: "Other",
};

export const DOCUMENT_CATEGORY_MODULE: Record<DocumentIntelCategory, string> = {
  placement_plan: "/young-people",
  care_plan: "/young-people",
  risk_assessment: "/young-people",
  mfc_report: "/safeguarding",
  incident_report: "/incidents",
  strategy_meeting: "/safeguarding",
  cla_review: "/young-people",
  pep_minutes: "/young-people",
  health_assessment: "/young-people",
  therapy_report: "/young-people",
  education_report: "/young-people",
  family_time_agreement: "/young-people",
  safety_plan: "/safeguarding",
  court_document: "/young-people",
  delegated_authority: "/young-people",
  behaviour_support_plan: "/young-people",
  independence_plan: "/young-people",
  dbs_certificate: "/recruitment",
  right_to_work: "/recruitment",
  reference: "/recruitment",
  interview_notes: "/recruitment",
  application_form: "/recruitment",
  training_certificate: "/training",
  supervision_record_doc: "/supervision",
  probation_review: "/supervision",
  disciplinary: "/staff",
  grievance: "/staff",
  return_to_work: "/staff",
  sickness_record: "/staff",
  fire_risk_assessment: "/buildings",
  health_safety_check: "/buildings",
  vehicle_check_doc: "/vehicles",
  maintenance_record: "/maintenance",
  reg44_report: "/ri/reg45",
  reg45_review: "/ri/reg45",
  ofsted_communication: "/ri/ofsted",
  policy_document: "/documents",
  audit_document: "/audits",
  insurance_certificate: "/documents",
  la_contract: "/documents",
  safer_recruitment: "/recruitment",
  medication_audit: "/medication",
  training_matrix: "/training",
  other: "/documents",
};

// ── Extracted entities ────────────────────────────────────────────────────────

export interface DocumentExtractedEntity {
  type: "person" | "date" | "action" | "risk" | "medication" | "location" | "agency" | "regulation";
  value: string;
  confidence: number;
  source_text?: string;
}

// ── Suggested task from document ──────────────────────────────────────────────

export interface DocumentSuggestedTask {
  id: string;
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  responsible_person: string | null;
  due_date: string | null;
  regulation_link: string | null;
  source_quote: string | null;
  approved: boolean;
  created_task_id: string | null;
}

// ── Regulation / evidence links ────────────────────────────────────────────────

export interface DocumentRegulationLink {
  regulation: string;
  quality_standard: string | null;
  relevance: string;
  confidence: number;
}

export interface DocumentEvidenceArea {
  area: string;
  reg45_section: string | null;
  strength: "strong" | "moderate" | "weak";
}

// ── Risk flags ────────────────────────────────────────────────────────────────

export type DocumentRiskFlagType =
  | "missing_signature"
  | "missing_date"
  | "no_responsible_person"
  | "safeguarding_concern"
  | "missing_child_voice"
  | "missing_review_date"
  | "outdated_assessment"
  | "no_oversight"
  | "training_gap"
  | "incomplete_information"
  | "suspicious_content"
  | "medication_risk"
  | "recruitment_gap";

export interface DocumentRiskFlag {
  flag_type: DocumentRiskFlagType;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}

// ── Chronology suggestion ─────────────────────────────────────────────────────

export interface DocumentChronologySuggestion {
  date: string;
  summary: string;
  significance: "routine" | "significant" | "critical";
  approved: boolean;
  created_entry_id: string | null;
}

// ── AI Intelligence result (stored on document) ───────────────────────────────

export interface DocumentAiResult {
  document_category: DocumentIntelCategory;
  document_category_label: string;
  confidence: number;
  ai_summary: string;
  ai_risk_level: DocumentIntelRisk;
  review_required: boolean;
  suggested_filing: string;
  suggested_module: string;
  extracted_entities: {
    people: string[];
    dates: { label: string; value: string }[];
    actions: { action: string; responsible_person: string | null; due_date: string | null }[];
    risks: string[];
    safeguarding_concerns: string[];
    missing_information: string[];
  };
  suggested_tasks: DocumentSuggestedTask[];
  regulation_links: DocumentRegulationLink[];
  evidence_areas: DocumentEvidenceArea[];
  risk_flags: DocumentRiskFlag[];
  chronology_suggestions: DocumentChronologySuggestion[];
  oversight_draft: string;
  child_friendly_summary: string | null;
  prompt_injection_detected: boolean;
  suspicious_content: string | null;
}

// ── Main uploaded document record ─────────────────────────────────────────────

export interface UploadedDocument {
  id: string;
  original_file_name: string;
  stored_file_path: string;
  file_type: DocumentIntelFileType;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  linked_home_id: string;
  linked_child_id: string | null;
  linked_staff_id: string | null;
  linked_incident_id: string | null;
  linked_task_id: string | null;
  document_status: DocumentIntelStatus;
  document_category: DocumentIntelCategory | null;
  classification_confidence: number | null;
  ai_summary: string | null;
  ai_risk_level: DocumentIntelRisk | null;
  review_required: boolean;
  approved_by: string | null;
  approved_at: string | null;
  // Extracted text (simulated — in production parsed from actual file)
  extracted_text: string;
  // AI outputs (set after ARIA processes the document)
  ai_result: DocumentAiResult | null;
  // Actions taken
  tasks_created: string[];
  evidence_linked: boolean;
  chronology_created: boolean;
  // Context
  upload_context: string | null;
  created_at: string;
  updated_at: string;
}

// ── Audit log entry ───────────────────────────────────────────────────────────

export interface DocumentAuditEntry {
  id: string;
  document_id: string;
  action: string;
  actor_id: string;
  timestamp: string;
  details: string;
  ai_confidence: number | null;
}
