// ══════════════════════════════════════════════════════════════════════════════
// CARA INTELLIGENCE LAYER — TYPED MODELS
// Mirrors migration 015_intelligence_layer_schema.sql
// ══════════════════════════════════════════════════════════════════════════════

// ── Urgency / Status enums ─────────────────────────────────────────────────

export type Urgency = "low" | "medium" | "high" | "critical";
export type AttentionStatus = "open" | "in_progress" | "reviewed" | "escalated" | "closed";

// ── 1. Manager Attention Items ─────────────────────────────────────────────

export type AttentionCategory =
  | "log_approval"
  | "incident_oversight"
  | "serious_incident"
  | "missing_from_care"
  | "risk_assessment_review"
  | "placement_plan_update"
  | "key_work_overdue"
  | "wishes_feelings_missing"
  | "medication_check"
  | "supervision_overdue"
  | "training_gap"
  | "recruitment_gap"
  | "complaint_open"
  | "reg44_action_overdue"
  | "reg45_evidence_gap"
  | "task_overdue"
  | "staff_debrief"
  | "document_sign_off"
  | "cara_pattern";

export interface ManagerAttentionItem {
  id: string;
  homeId: string;
  title: string;
  category: AttentionCategory;
  urgency: Urgency;
  childId?: string;
  staffId?: string;
  sourceRecordType: string;
  sourceRecordId?: string;
  reason?: string;
  suggestedAction?: string;
  dueDate?: string;
  status: AttentionStatus;
  assignedTo?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  escalatedTo?: string;
  escalatedAt?: string;
  caraDraftId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ── 2. Ofsted Evidence Room ────────────────────────────────────────────────

export type EvidenceCategory =
  | "overall_experiences"
  | "help_and_protection"
  | "leaders_and_managers"
  | "quality_of_care"
  | "education"
  | "health"
  | "emotional_wellbeing"
  | "safeguarding"
  | "missing_from_care"
  | "behaviour_support"
  | "restraint"
  | "medication"
  | "complaints"
  | "staff_supervision"
  | "training"
  | "safer_recruitment"
  | "regulation_44"
  | "regulation_45"
  | "wishes_and_feelings"
  | "family_time"
  | "independence"
  | "placement_planning"
  | "risk_assessment"
  | "management_oversight"
  | "ri_oversight"
  | "notifications"
  | "patterns_and_learning";

export type JudgementArea =
  | "overall_experiences_and_progress"
  | "help_and_protection"
  | "effectiveness_of_leaders";

export interface InspectionEvidenceItem {
  id: string;
  homeId: string;
  childId?: string;
  staffId?: string;
  sourceType: string;
  sourceId?: string;
  title: string;
  summary?: string;
  evidenceCategory: EvidenceCategory;
  judgementArea?: JudgementArea;
  regulationReference?: string;
  confidenceScore?: number;
  evidenceDate?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionEvidenceLink {
  id: string;
  evidenceItemId: string;
  linkedRecordType: string;
  linkedRecordId: string;
  relationshipType?: string;
  createdBy?: string;
  createdAt: string;
}

export type EvidencePackStatus = "draft" | "ready" | "exported" | "archived";

export interface InspectionEvidencePack {
  id: string;
  homeId: string;
  title: string;
  periodStart?: string;
  periodEnd?: string;
  generatedBy?: string;
  generatedAt?: string;
  status: EvidencePackStatus;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

// ── 3. Child Progress & Outcomes ───────────────────────────────────────────

export type ProgressArea =
  | "education"
  | "health"
  | "emotional_wellbeing"
  | "safety"
  | "relationships"
  | "family_time"
  | "independence"
  | "behaviour_support"
  | "identity"
  | "wishes_and_feelings"
  | "community"
  | "placement_stability";

export type GoalStatus = "active" | "achieved" | "paused" | "closed";

export interface ChildProgressGoal {
  id: string;
  childId: string;
  homeId: string;
  goalArea: ProgressArea;
  title: string;
  description?: string;
  startingPoint?: string;
  desiredOutcome?: string;
  planActions?: string;
  responsiblePeople?: string[];
  status: GoalStatus;
  targetDate?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChildProgressEntry {
  id: string;
  childId: string;
  homeId: string;
  goalId?: string;
  entryDate: string;
  area: ProgressArea;
  whatHappened: string;
  impactOnChild?: string;
  evidenceSourceType?: string;
  evidenceSourceId?: string;
  managerAnalysis?: string;
  caraSuggestedAnalysis?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChildOutcomeSnapshot {
  id: string;
  childId: string;
  homeId: string;
  snapshotDate: string;
  educationScore?: number;
  healthScore?: number;
  emotionalWellbeingScore?: number;
  safetyScore?: number;
  relationshipsScore?: number;
  independenceScore?: number;
  engagementScore?: number;
  summary?: string;
  createdBy?: string;
  createdAt: string;
}

// ── 4. Regulation 44 / 45 ──────────────────────────────────────────────────

export type Reg44ReportStatus = "draft" | "submitted" | "reviewed" | "closed";
export type Reg44ActionStatus = "open" | "in_progress" | "completed" | "overdue" | "cancelled";
export type Reg44ActionPriority = "low" | "medium" | "high" | "urgent";

export interface Reg44Visit {
  id: string;
  homeId: string;
  visitDate: string;
  visitorName: string;
  reportStatus: Reg44ReportStatus;
  summary?: string;
  strengths?: string;
  concerns?: string;
  childrenViewsSummary?: string;
  staffViewsSummary?: string;
  managerResponse?: string;
  riResponse?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reg44Action {
  id: string;
  visitId: string;
  homeId: string;
  title: string;
  description?: string;
  priority: Reg44ActionPriority;
  assignedTo?: string;
  dueDate?: string;
  status: Reg44ActionStatus;
  managerResponse?: string;
  completedAt?: string;
  evidenceItemId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type Reg45Status = "draft" | "in_progress" | "submitted" | "approved" | "published";

export interface Reg45Review {
  id: string;
  homeId: string;
  periodStart: string;
  periodEnd: string;
  status: Reg45Status;
  qualityOfCareSummary?: string;
  childrenExperiencesSummary?: string;
  outcomesSummary?: string;
  safeguardingSummary?: string;
  leadershipSummary?: string;
  strengths?: string;
  weaknesses?: string;
  improvementActions?: string;
  childrenViews?: string;
  parentsViews?: string;
  placingAuthorityViews?: string;
  staffViews?: string;
  generatedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── 5. Incident Learning Review ────────────────────────────────────────────

export type LearningReviewStatus = "required" | "in_progress" | "completed" | "not_required";

export interface IncidentLearningReview {
  id: string;
  incidentId: string;
  homeId: string;
  childId?: string;
  reviewStatus: LearningReviewStatus;
  managerOversight?: string;
  caraSuggestedAnalysis?: string;
  triggerAnalysis?: string;
  whatWorked?: string;
  whatDidNotWork?: string;
  impactOnChild?: string;
  staffDebriefRequired: boolean;
  childKeyworkRequired: boolean;
  riskAssessmentReviewRequired: boolean;
  placementPlanReviewRequired: boolean;
  notificationReviewRequired: boolean;
  learningSummary?: string;
  actionsCreated: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ── 7. Smart Record Links ──────────────────────────────────────────────────

export interface SmartRecordLink {
  id: string;
  homeId: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationship: string;
  suggestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdBy?: string;
  createdAt: string;
}

// ── 8. Staff Competence Passport ───────────────────────────────────────────

export type DbsStatus = "not_started" | "applied" | "current" | "due_renewal" | "expired";
export type ProbationStatus = "not_started" | "in_progress" | "passed" | "extended" | "failed";
export type Level3Status = "not_started" | "enrolled" | "in_progress" | "achieved" | "exempt";

export interface StaffCompetenceRecord {
  id: string;
  staffId: string;
  homeId: string;
  saferRecruitmentComplete: boolean;
  dbsStatus: DbsStatus;
  dbsDate?: string;
  dbsUpdateService: boolean;
  referencesReceived: boolean;
  referenceCount: number;
  rightToWork: boolean;
  inductionComplete: boolean;
  inductionDate?: string;
  probationStatus: ProbationStatus;
  probationEndDate?: string;
  level3Status: Level3Status;
  mandatoryTrainingComplete: boolean;
  safeguardingTrainingDate?: string;
  medicationCompetency: boolean;
  medicationCompetencyDate?: string;
  physicalInterventionTrained: boolean;
  physicalInterventionDate?: string;
  lastSupervisionDate?: string;
  supervisionFrequencyWeeks: number;
  lastAppraisalDate?: string;
  canLeadShift: boolean;
  canAdministerMedication: boolean;
  canLoneWork: boolean;
  canSuperviseOthers: boolean;
  restrictions: string[];
  compliments: string[];
  performanceConcerns: string[];
  roleCompetencies: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ── 9. Voice of the Child ──────────────────────────────────────────────────

export type VoiceCategory =
  | "wishes_and_feelings"
  | "complaint"
  | "compliment"
  | "house_meeting"
  | "food"
  | "activity"
  | "bedroom"
  | "family_time"
  | "education"
  | "health"
  | "safety"
  | "relationship_with_staff"
  | "general_wellbeing";

export interface ChildVoiceEntry {
  id: string;
  childId: string;
  homeId: string;
  entryDate: string;
  category: VoiceCategory;
  childWords?: string;
  summary?: string;
  actionTaken?: string;
  staffResponse?: string;
  managerReview?: string;
  linkedRecordType?: string;
  linkedRecordId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ── 10. Provider Home Summaries ────────────────────────────────────────────

export interface ProviderHomeSummary {
  id: string;
  homeId: string;
  periodStart: string;
  periodEnd: string;
  inspectionReadinessScore?: number;
  openRisksCount: number;
  seriousIncidentsCount: number;
  safeguardingThemes: string[];
  reg44Status?: string;
  reg45Status?: string;
  overdueActionsCount: number;
  supervisionCompliancePct?: number;
  trainingCompliancePct?: number;
  recruitmentCompliancePct?: number;
  complaintsOpen: number;
  missingEpisodes: number;
  placementStabilityPct?: number;
  managerOversightPct?: number;
  caraRiskFlags: string[];
  riOversightNotes?: string;
  riReviewedAt?: string;
  riReviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Evidence gap type ──────────────────────────────────────────────────────

export type EvidenceGapType =
  | "no_recent_key_work"
  | "no_child_voice"
  | "incident_no_oversight"
  | "incident_no_follow_up"
  | "reg44_overdue"
  | "reg45_missing"
  | "risk_not_reviewed"
  | "placement_plan_stale"
  | "supervision_overdue"
  | "training_expired"
  | "complaint_not_closed"
  | "repeated_pattern_no_review";

export interface EvidenceGap {
  type: EvidenceGapType;
  title: string;
  description: string;
  severity: Urgency;
  childId?: string;
  staffId?: string;
  sourceRecordType?: string;
  sourceRecordId?: string;
  recommendation: string;
}

// ── Smart link suggestion ──────────────────────────────────────────────────

export interface SmartLinkSuggestion {
  targetType: string;
  targetId?: string;
  relationship: string;
  reason: string;
  autoLink: boolean;
}

// ── Cara humanised oversight ───────────────────────────────────────────────

export interface HumanisedOversightInput {
  recordType: string;
  recordId: string;
  recordSummary: string;
  childName?: string;
  context?: Record<string, unknown>;
}

export interface HumanisedOversightOutput {
  draftText: string;
  confidence: "low" | "medium" | "high";
  suggestedActions: string[];
  missingInformation: string[];
  riskFlags: string[];
  evidenceLinks: string[];
  requiresManagerApproval: true;
}

// ── Staff competence warnings ──────────────────────────────────────────────

export type CompetenceWarningType =
  | "cannot_lead_shift"
  | "cannot_administer_medication"
  | "cannot_lone_work"
  | "supervision_overdue"
  | "training_expired"
  | "probation_review_overdue"
  | "dbs_expired"
  | "dbs_due_renewal"
  | "induction_incomplete"
  | "restriction_active";

export interface CompetenceWarning {
  type: CompetenceWarningType;
  severity: Urgency;
  title: string;
  detail: string;
}
