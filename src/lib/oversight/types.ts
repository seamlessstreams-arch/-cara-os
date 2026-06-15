// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGEMENT OVERSIGHT ENGINE · types
//
// Workflow-based management assurance for children's homes. The engine reviews
// the WHOLE professional response to an event/record/concern — not just one form
// — and produces inspection-ready PROFESSIONAL oversight and, where safe, warm
// CHILD-ADDRESSED oversight, entirely deterministically (no API calls by
// default). It is additive to the existing single-record engine in
// src/lib/cara/managementOversightEngine.ts (which it does not replace).
//
// All generation is pure + deterministic: feed structured workflow data in,
// get a professional management oversight, scores, actions, escalation and
// (optionally) a child-addressed version out. API drafting is only ever
// RECOMMENDED — never performed here — when deterministic rules are insufficient.
// ══════════════════════════════════════════════════════════════════════════════

export type OversightMode = "professional" | "child_addressed" | "both";

export type ChildAddressedTone =
  | "younger_child"
  | "older_child"
  | "neutral"
  | "trauma_informed"
  | "highly_sensitive";

export type TherapeuticModel =
  | "PACE"
  | "trauma_informed"
  | "therapeutic_parenting"
  | "attachment_based"
  | "restorative"
  | "positive_behaviour_support"
  | "none_recorded"
  | "other";

export type PatternDirection =
  | "improving"
  | "declining"
  | "stable"
  | "fluctuating"
  | "unknown";

export type RecordType =
  | "daily_log"
  | "incident"
  | "missing_episode"
  | "physical_intervention"
  | "medication"
  | "safeguarding"
  | "complaint"
  | "allegation"
  | "key_work"
  | "room_search"
  | "contact"
  | "education"
  | "health"
  | "sanction_or_consequence"
  | "other";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type OversightOutcome =
  | "satisfactory"
  | "requires_clarification"
  | "requires_action"
  | "requires_escalation"
  | "senior_review_required";

export type PlanAdherenceStatus =
  | "followed"
  | "partially_followed"
  | "not_followed"
  | "not_applicable"
  | "unclear";

export type PracticeConcernLevel =
  | "none"
  | "minor_recording_gap"
  | "practice_development_needed"
  | "management_review_required"
  | "serious_policy_failure"
  | "safeguarding_escalation_required";

export type ReferralStatus =
  | "not_required"
  | "required_and_completed"
  | "required_not_completed"
  | "completed_late"
  | "unclear";

export type ManagementResponseStatus =
  | "appropriate"
  | "partially_appropriate"
  | "insufficient"
  | "unclear"
  | "senior_review_required";

export type WorkflowCompletionStatus =
  | "complete"
  | "mostly_complete"
  | "partially_complete"
  | "incomplete"
  | "not_applicable"
  | "unclear";

export type DebriefStatus =
  | "not_required"
  | "required_completed"
  | "required_not_completed"
  | "offered_declined"
  | "completed_late"
  | "unclear";

export type AssociatedPaperworkStatus =
  | "complete"
  | "outstanding"
  | "completed_late"
  | "not_required"
  | "unclear";

export type TaskOversightStatus =
  | "not_reviewed"
  | "reviewed_satisfactory"
  | "requires_clarification"
  | "requires_action"
  | "escalated"
  | "not_applicable";

export interface OversightAction {
  action: string;
  responsibleRole: string;
  timescale: string;
  priority: RiskLevel;
  source?: string;
  impactReviewRequired?: boolean;
  impactReviewDueBy?: string;
}

export type EvidenceSourceType =
  | "incident_record"
  | "daily_log"
  | "handover"
  | "body_map"
  | "MAR_chart"
  | "missing_record"
  | "return_home_interview"
  | "child_debrief"
  | "staff_debrief"
  | "management_review"
  | "risk_assessment"
  | "care_plan"
  | "placement_plan"
  | "behaviour_support_plan"
  | "keeping_me_safe_plan"
  | "safety_plan"
  | "notification"
  | "referral"
  | "staff_statement"
  | "key_work"
  | "supervision"
  | "other";

export interface EvidenceSource {
  id?: string;
  type: EvidenceSourceType;
  title?: string;
  reviewed: boolean;
  reviewedAt?: string;
  reviewedByRole?: string;
  concern?: string;
}

export interface ChildContext {
  livedExperienceSummary?: string;
  knownTriggers?: string[];
  knownCalmingStrategies?: string[];
  communicationNeeds?: string[];
  sensoryNeeds?: string[];
  relationshipNeeds?: string[];
  strengths?: string[];
  worries?: string[];
  currentPlanGoals?: string[];
  importantPeople?: string[];
  therapeuticModelNotes?: string;
  equalityIdentityNeeds?: string[];
}

export interface RecentContext {
  recentIncidentsCount?: number;
  recentMissingEpisodesCount?: number;
  recentPhysicalInterventionsCount?: number;
  recentSafeguardingConcernsCount?: number;
  recentMedicationConcernsCount?: number;
  recentEducationConcerns?: string[];
  recentHealthConcerns?: string[];
  recentContactImpact?: string;
  recentMoodPresentation?: string;
  recentSleepPattern?: string;
  recentPeerRelationshipPattern?: string;
  recentStaffRelationshipPattern?: string;
  recentPositiveProgress?: string[];
  recentWorriesRaisedByChild?: string[];
  timeframeDays?: number;
}

export interface PatternContext {
  repeatedThemes?: string[];
  possibleTriggers?: string[];
  escalationPattern?: string[];
  deescalationSuccesses?: string[];
  timesOfDayPattern?: string;
  locationPattern?: string;
  peerPattern?: string;
  staffResponsePattern?: string;
  patternDirection?: PatternDirection;
  patternConfidence?: "low" | "medium" | "high";
}

export interface ActionTaken {
  action: string;
  takenByRole: string;
  timeTaken?: string;
  linkedToPlan?: string;
  wasPlannedStrategy?: boolean;
  outcome?: string;
  evidenceSource?: string;
}

export type ReferralKind =
  | "social_worker"
  | "placing_authority"
  | "parent_or_person_with_pr"
  | "police"
  | "health"
  | "CAMHS"
  | "education"
  | "LADO"
  | "Ofsted"
  | "local_authority_designated_officer"
  | "safeguarding_partnership"
  | "advocacy"
  | "independent_visitor"
  | "therapist"
  | "other";

export interface ReferralOrNotification {
  type: ReferralKind;
  required: boolean;
  completed: boolean;
  completedByRole?: string;
  completedAt?: string;
  reason?: string;
  evidenceSource?: string;
}

export type GuidingDocumentType =
  | "care_plan"
  | "placement_plan"
  | "risk_assessment"
  | "child_safety_plan"
  | "keeping_me_safe_plan"
  | "behaviour_support_plan"
  | "missing_from_care_plan"
  | "health_plan"
  | "medication_plan"
  | "education_plan"
  | "communication_plan"
  | "sensory_plan"
  | "contact_plan"
  | "local_protocol"
  | "home_policy"
  | "other";

export interface GuidingDocumentCheck {
  documentType: GuidingDocumentType;
  documentName?: string;
  documentVersion?: string;
  relevantInstruction?: string;
  wasFollowed: PlanAdherenceStatus;
  evidence?: string;
  rationaleForNotFollowing?: string;
  impactOfNotFollowing?: string;
  actionRequired?: string;
}

export interface PracticeResponseContext {
  staffActionsTaken?: ActionTaken[];
  managementActionsTaken?: ActionTaken[];
  immediateSafetyActionsTaken?: ActionTaken[];
  deescalationActionsTaken?: ActionTaken[];
  therapeuticActionsTaken?: ActionTaken[];
  plannedStrategiesUsed?: string[];
  plannedStrategiesNotUsed?: string[];
  reasonStrategiesNotUsed?: string;
  staffReflectionCompleted?: boolean;
  childDebriefOffered?: boolean;
  childDebriefCompleted?: boolean;
  staffDebriefCompleted?: boolean;
  managerDebriefCompleted?: boolean;
}

export interface PlanAdherenceContext {
  guidingDocumentChecks?: GuidingDocumentCheck[];
  overallPlanAdherence?: PlanAdherenceStatus;
  planAdherenceSummary?: string;
  planFailuresIdentified?: string[];
  justifiedDeviationsFromPlan?: string[];
  unjustifiedDeviationsFromPlan?: string[];
  documentsRequiringUpdate?: string[];
}

export interface ReferralContext {
  referralsAndNotifications?: ReferralOrNotification[];
  referralsRequiredButNotCompleted?: ReferralOrNotification[];
  referralsCompletedLate?: ReferralOrNotification[];
  externalProfessionalsToUpdate?: string[];
  multiAgencyFollowUpRequired?: boolean;
}

export interface PolicyComplianceContext {
  relevantPolicies?: string[];
  policyStepsFollowed?: string[];
  policyStepsNotFollowed?: string[];
  possiblePolicyFailures?: string[];
  policyFailureImpact?: string;
  requiresStaffSupervision?: boolean;
  requiresRetraining?: boolean;
  requiresFormalManagementReview?: boolean;
  requiresSeniorLeadershipReview?: boolean;
}

export interface ManagementAccountabilityContext {
  shiftLeadOversightCompleted?: boolean;
  deputyManagerOversightCompleted?: boolean;
  registeredManagerOversightCompleted?: boolean;
  responsibleIndividualOversightRequired?: boolean;
  responsibleIndividualOversightCompleted?: boolean;
  managementResponseStatus?: ManagementResponseStatus;
  managementActionsOutstanding?: OversightAction[];
}

export interface WorkflowStep {
  stepName: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  completedByRole?: string;
  dueBy?: string;
  completedLate?: boolean;
  evidenceSource?: string;
  notes?: string;
  oversightComment?: string;
  oversightStatus?: TaskOversightStatus;
}

export type AssociatedPaperworkType =
  | "incident_form"
  | "daily_log"
  | "body_map"
  | "injury_record"
  | "physical_intervention_record"
  | "physical_intervention_review"
  | "missing_from_care_record"
  | "return_home_interview"
  | "safeguarding_concern_form"
  | "medication_error_form"
  | "MAR_chart_update"
  | "complaint_record"
  | "room_search_record"
  | "sanction_or_consequence_record"
  | "key_work_record"
  | "child_debrief_record"
  | "staff_debrief_record"
  | "management_review_record"
  | "notification_record"
  | "referral_record"
  | "risk_assessment_update"
  | "behaviour_support_plan_update"
  | "care_plan_update"
  | "keeping_me_safe_plan_update"
  | "handover_record"
  | "team_briefing_record"
  | "supervision_record"
  | "other";

export interface AssociatedPaperwork {
  paperworkType: AssociatedPaperworkType;
  required: boolean;
  status: AssociatedPaperworkStatus;
  completedByRole?: string;
  completedAt?: string;
  dueBy?: string;
  evidenceSource?: string;
  concern?: string;
  oversightComment?: string;
}

export interface StaffDebriefContext {
  required: boolean;
  status: DebriefStatus;
  completedAt?: string;
  facilitatedByRole?: string;
  staffAttendees?: string[];
  keyThemes?: string[];
  practiceLearning?: string[];
  emotionalImpactOnStaff?: string;
  supportOfferedToStaff?: string[];
  trainingNeedsIdentified?: string[];
  policyOrPlanIssuesIdentified?: string[];
  staffRationaleRecorded?: boolean;
  furtherManagementActionRequired?: boolean;
}

export interface ChildDebriefContext {
  required: boolean;
  status: DebriefStatus;
  offeredAt?: string;
  completedAt?: string;
  completedByRole?: string;
  childDeclined?: boolean;
  declineRespectedAndRecorded?: boolean;
  childViews?: string[];
  childFeelings?: string[];
  childWorries?: string[];
  childSaidHelped?: string[];
  childSaidDidNotHelp?: string[];
  childRequestedSupport?: string[];
  advocacyOffered?: boolean;
  planChangedFollowingDebrief?: boolean;
  planChangeSummary?: string;
  followUpConversationRequired?: boolean;
}

export interface KeyWorkFollowUpContext {
  keyWorkRequired: boolean;
  keyWorkCompleted: boolean;
  completedAt?: string;
  completedByRole?: string;
  keyWorkPurpose?: string;
  keyWorkThemes?: string[];
  linkedToIncidentOrConcern?: boolean;
  childVoiceCaptured?: boolean;
  agreedActionsWithChild?: string[];
  furtherDirectWorkRequired?: boolean;
  nextSessionDueBy?: string;
}

export interface WorkflowCompletionContext {
  workflowId?: string;
  workflowName?: string;
  workflowStatus?: WorkflowCompletionStatus;
  workflowSteps?: WorkflowStep[];
  associatedPaperwork?: AssociatedPaperwork[];
  staffDebrief?: StaffDebriefContext;
  childDebrief?: ChildDebriefContext;
  keyWorkFollowUp?: KeyWorkFollowUpContext;
  outstandingWorkflowActions?: OversightAction[];
  workflowConsistencyConcerns?: string[];
  actionTrackerUpdated?: boolean;
  allActionsAssigned?: boolean;
  allActionsHaveTimescales?: boolean;
  impactReviewScheduled?: boolean;
}

export interface PreviousActionsReview {
  previousActionsCompleted?: boolean;
  overdueActions?: OversightAction[];
  repeatedActions?: string[];
  evidenceOfImpact?: string;
  driftConcern?: boolean;
}

export interface ProportionalityAssessment {
  leastRestrictiveOptionConsidered?: boolean;
  rationaleRecorded?: boolean;
  dignityMaintained?: boolean;
  interventionNecessary?: boolean;
  interventionProportionate?: boolean;
  concern?: string;
}

export interface StaffLearningContext {
  staffBriefingRequired?: boolean;
  supervisionRequired?: boolean;
  retrainingRequired?: boolean;
  competencyReviewRequired?: boolean;
  agencyStaffInvolved?: boolean;
  newStaffInvolved?: boolean;
  teamLearningTheme?: string;
}

export interface ContextualPracticeFactors {
  agencyStaffInvolved?: boolean;
  newStaffInvolved?: boolean;
  staffingLevelConcern?: boolean;
  handoverConcern?: boolean;
  environmentalTrigger?: string;
  transitionPoint?: string;
  peerGroupDynamic?: string;
}

export interface QualityAssuranceRouting {
  includeInReg44Summary?: boolean;
  includeInReg45Review?: boolean;
  includeInHomeDevelopmentPlan?: boolean;
  includeInTeamMeeting?: boolean;
  includeInStaffSupervision?: boolean;
  includeInChildReview?: boolean;
}

export interface OversightInput {
  oversightMode: OversightMode;
  recordType: RecordType;
  childName?: string;
  childAge?: number;
  managerName?: string;
  reviewedByRole?: string;
  recordDate?: string;
  reviewDate?: string;
  summary?: string;
  therapeuticModel?: TherapeuticModel;
  childAddressedTone?: ChildAddressedTone;

  childContext?: ChildContext;
  recentContext?: RecentContext;
  patternContext?: PatternContext;

  evidenceSourcesReviewed?: EvidenceSource[];

  practiceResponseContext?: PracticeResponseContext;
  planAdherenceContext?: PlanAdherenceContext;
  referralContext?: ReferralContext;
  policyComplianceContext?: PolicyComplianceContext;
  managementAccountabilityContext?: ManagementAccountabilityContext;
  workflowCompletionContext?: WorkflowCompletionContext;
  previousActionsReview?: PreviousActionsReview;
  proportionalityAssessment?: ProportionalityAssessment;
  staffLearningContext?: StaffLearningContext;
  contextualPracticeFactors?: ContextualPracticeFactors;
  qualityAssuranceRouting?: QualityAssuranceRouting;

  // Evidence-quality flags (the main record)
  antecedentsIncluded?: boolean;
  chronologyClear?: boolean;
  staffActionsRecorded?: boolean;
  childVoiceCaptured?: boolean;
  childPresentationRecorded?: boolean;
  injuriesRecordedOrRuledOut?: boolean;
  notificationsCompleted?: boolean;
  debriefCompleted?: boolean;
  riskAssessmentReviewed?: boolean;
  carePlanReviewed?: boolean;
  behaviourSupportPlanReviewed?: boolean;
  managementActionRecorded?: boolean;
  responsiblePersonRecorded?: boolean;
  timescaleRecorded?: boolean;

  // Risk / safeguarding signals
  allegation?: boolean;
  disclosure?: boolean;
  injury?: boolean;
  restraintUsed?: boolean;
  missingFromCare?: boolean;
  medicationError?: boolean;
  selfHarmConcern?: boolean;
  exploitationConcern?: boolean;
  policeInvolved?: boolean;
  emergencyServicesInvolved?: boolean;
  repeatedPattern?: boolean;
  lateRecording?: boolean;
  contradictoryInformation?: boolean;
  existingRiskLevel?: RiskLevel;
  managerRequestedEnhancedDrafting?: boolean;
}

export interface OversightResult {
  professionalOversight?: string;
  childAddressedOversight?: string;

  riskLevel: RiskLevel;
  oversightOutcome: OversightOutcome;
  evidenceQualityScore: number;
  workflowScore: number;
  planAdherenceScore: number;
  practiceResponseScore: number;
  referralCompletionScore: number;
  policyComplianceScore: number;

  missingEvidence: string[];
  requiredActions: OversightAction[];
  staffPracticeActions: OversightAction[];
  supportRecommendations: OversightAction[];
  outstandingWorkflowActions: OversightAction[];

  escalationRequired: boolean;
  escalationReasons: string[];

  regulatoryTags: string[];
  therapeuticTags: string[];
  qualityAssuranceRoutes: string[];

  evidenceFindings: string[];
  workflowFindings: string[];
  associatedPaperworkFindings: string[];
  staffDebriefFindings: string[];
  childDebriefFindings: string[];
  keyWorkFollowUpFindings: string[];
  practiceResponseFindings: string[];
  planAdherenceFindings: string[];
  referralFindings: string[];
  policyComplianceFindings: string[];
  managementAccountabilityFindings: string[];
  patternFindings: string[];
  livedExperienceConsiderations: string[];
  professionalCuriosityFindings: string[];
  positivePracticeFindings: string[];
  dignityAndTrustFindings: string[];
  preventabilityFindings: string[];

  workflowCompletionStatus: WorkflowCompletionStatus;
  planAdherenceStatus: PlanAdherenceStatus;
  practiceConcernLevel: PracticeConcernLevel;
  managementResponseStatus: ManagementResponseStatus;

  outstandingPaperwork: AssociatedPaperwork[];
  referralsOutstanding: ReferralOrNotification[];

  policyFailurePossible: boolean;
  childAddressedSuppressed: boolean;
  childAddressedSuppressionReason?: string;

  apiCallRecommended: boolean;
  apiCallReason?: string;

  engineVersion: string;
  generatedAt: string;
}

// ─── Task-level oversight ──────────────────────────────────────────────────────

export interface TaskOversightInput {
  taskName: string;
  taskType?: string;
  required: boolean;
  completed: boolean;
  completedByRole?: string;
  completedAt?: string;
  dueBy?: string;
  completedLate?: boolean;
  evidenceSource?: string;
  riskRelevance?: RiskLevel;
  consistentWithWorkflow?: boolean;
  affectsChildSafetyOrDignity?: boolean;
  recordType?: RecordType;
  today?: string;
}

export interface TaskOversightResult {
  taskName: string;
  oversightStatus: TaskOversightStatus;
  suggestedOversight: string;
  requiredAction?: OversightAction;
  escalationRequired: boolean;
  includeInSignOff: boolean;
}

// ─── Workflow sign-off ─────────────────────────────────────────────────────────

export type SignOffRole =
  | "support_worker"
  | "senior_support_worker"
  | "shift_lead"
  | "team_leader"
  | "deputy_manager"
  | "registered_manager"
  | "responsible_individual"
  | "senior_leadership";

export interface SignOffBlocker {
  code: string;
  description: string;
  mandatory: boolean;
}

export interface WorkflowSignOffInput {
  oversightResult: OversightResult;
  signOffRole: SignOffRole;
  finalProfessionalOversight: string;
  childAddressedOversight?: string;
  confirmActionsAssigned: boolean;
  confirmTimescalesRecorded: boolean;
  confirmRisksEscalated: boolean;
  confirmChildFacingSafeOrSuppressed: boolean;
  /** Whether a child-addressed version was requested for this workflow (gates the safe-to-share blocker). */
  oversightChildModeRequested?: boolean;
  /** Whether contradictions across records remain unresolved (a mandatory blocker). */
  contradictionsUnresolved?: boolean;
  overrideReason?: string;
  signedOffByUserId?: string;
  today?: string;
}

export interface WorkflowSignOffAuditEntry {
  signedOffByUserId?: string;
  signedOffByRole: SignOffRole;
  signedOffAt: string;
  finalProfessionalOversight: string;
  childAddressedOversight?: string;
  childAddressedSuppressed: boolean;
  suppressionReason?: string;
  outstandingActions: OversightAction[];
  escalationRequired: boolean;
  escalationReasons: string[];
  overrideUsed: boolean;
  overrideReason?: string;
  qualityAssuranceRoutes: string[];
}

export interface WorkflowSignOffResult {
  signed: boolean;
  blockers: SignOffBlocker[];
  requiresSeniorReview: boolean;
  roleAuthorised: boolean;
  overrideUsed: boolean;
  auditEntry?: WorkflowSignOffAuditEntry;
  signOffStatement: string;
  reason?: string;
}

export const OVERSIGHT_ENGINE_VERSION = "2.0.0";

export const OVERSIGHT_DISCLAIMER =
  "Cara produces a deterministic suggested management oversight from the workflow data. It supports the manager's professional judgement and Regulation 44/45 evidence — it never decides, and Regulation 40 items are always for the manager to consider.";
