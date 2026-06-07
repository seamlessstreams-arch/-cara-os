// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MUTABLE IN-MEMORY DATA STORE
//
// This is the single source of truth for all API routes.
// Initialized from seed data on first access.
// Each collection is mutable — API routes read/write here.
//
// TO CONNECT SUPABASE: replace each collection's read/write with
// Supabase queries. The API route signatures stay identical.
// ══════════════════════════════════════════════════════════════════════════════

import {
  STAFF, YOUNG_PEOPLE, TASKS, INCIDENTS, SHIFTS, MEDICATIONS,
  DAILY_LOG, LEAVE_REQUESTS, TRAINING_RECORDS, HOME,
} from "@/lib/seed-data";
import type {
  StaffMember, YoungPerson, Task, Incident, Shift, Medication,
  MedicationAdministration, DailyLogEntry, LeaveRequest,
  TrainingRecord, Home, CareForm, Supervision,
} from "@/types";
import type { CornerstoneEvent } from "@/types/cornerstone-event";
import type {
  CommsChannel,
  CommsChannelMember,
  CommsMessage,
  CommsMessageReceipt,
  CommsMessageAction,
  StaffTrustNoticeAck,
} from "@/types/comms";
import type { SignInVerification } from "@/lib/attendance/presence-verification";
import type { EmergencyAlert } from "@/lib/staffing/emergency-types";
import type {
  Building, BuildingCheck, Vehicle, VehicleCheck,
  MissingEpisode, ChronologyEntry, HandoverEntry,
  Notification, TimeSavedEntry,
  Audit, MaintenanceItem,
  WelfareCheck, WelfareCheckRound,
  OutcomeTarget, OutcomeReview,
  ShiftSwapRequest,
  Reg44VisitReport, Reg44Recommendation,
  KeyWorkingSession,
  LACReview,
  RiskAssessment,
  EducationRecord,
  BehaviourSupportPlan,
  DelegatedAuthority,
  HouseMeeting,
  SanctionRewardEntry,
  YPFeedbackEntry,
  SleepLogEntry,
  Compliment,
  VisitorEntry,
  FireDrill,
  SignificantEvent,
  RestraintRecord,
  Complaint,
  NotifiableEvent,
  NightLogEntry,
  BehaviourEntry,
  AccidentRecord,
  AbsenceRecord,
  PositiveHandlingPlan,
  MedicationError,
  BodyMapEntry,
  Activity,
  AdoptionRecord,
  AdvocacyRecord,
  AfterCareRecord,
  AgencyInduction,
  AgencyStaffRecord,
  AnnualDevelopmentReview,
  AnnualHealthAssessment,
  AnnualOutcome,
  Appointment,
  NeedsAssessment,
  AttachmentProfile,
  BehaviourMapEntry,
  BereavementRecord,
  BullyingIncident,
  CamhsReferral,
  CCTVAccess,
  ADHDPlan,
  AllergyPlan,
  AspirationRecord,
  AsthmaPlan,
  AutismPlan,
  ChildBankAccount,
  CareAnniversaryRecord,
  CyclingBikeRecord,
  CharityGrantRecord,
  ClothingShoppingTrip,
  ContinencePlan,
  CookingBakingRecord,
  IncomingCorrespondence,
  CourtAttendanceRecord,
  CreativeProjectRecord,
  CulturalReligiousMentor,
  DeafHearingSupportRecord,
  DiabeticCarePlan,
  SpldSupportPlan,
  EpilepsySeizurePlan,
  ExtracurricularClubRecord,
  ChildFeedbackLoop,
  ChildStaffFeedback,
  ChildFriendlyPolicy,
  HeritageLanguageRecord,
  ImmigrationUascRecord,
  ChildInjuryRecord,
  ChildKeyDocument,
  KeyworkerSessionRecord,
  LaundrySelfCareRecord,
  ChildLedMeetingRecord,
  MentalHealthCheckIn,
  ChildPhoneRecord,
  MobilityDisabilityPlan,
  PhotoIdRecord,
  ChildPhotoEntry,
  PhysioOtPlan,
  PoliceContactRecord,
  PreventScreeningRecord,
  CpConferenceRecord,
  RightsLiteracyRecord,
  SchoolEngagementEvent,
  SelfSoothingToolkit,
  SkinConditionPlan,
  SmokingVapingRecord,
  TraumaTherapyLog,
  StyleIdentityRecord,
  TutoringRecord,
  VisionCareRecord,
  ChildExpertEntry,
  CMERecord,
  ChildrensMeetingRecord,
  ClothingAllowanceRecord,
  CommissioningFeedbackRecord,
  CommunicationBookEntry,
  CommunityFeedbackRecord,
  ComplaintOutcomeRecord,
  ConsentRecord,
  ContactDirectoryEntry,
  ContactSupervisionSession,
  ContextualSafeguardingRisk,
  CorrespondenceEntry,
  CriticalIncidentDebriefRecord,
  CulturalIdentityPlan,
  DataBreachRecord,
  DataProtectionRecord,
  DebriefRecord,
  DentalRecord,
  DoLRecord,
  DevicePolicyRecord,
  DigitalLiteracySkillRecord,
  DischargeRecord,
  DiversityCalendarEvent,
  TrackedDocument,
  DrivingRecord,
  SubstanceScreening,
  DutyLogEntry,
  EatingSupportPlan,
  EduAttendanceRecord,
  EhcpRecord,
  EmergencyChildContact,
  EvacuationPlan,
  EmergencyMedicationProtocol,
  EmergencyReferral,
  EmergencyPlan,
  ProtocolDrill,
  EmotionalVocabRecord,
  EnvironmentalRisk,
  ExploitationScreening,
  ExternalVisitor,
  FamilyTimeSession,
  GenogramEntry,
  FireRiskItem,
  FireEquipmentCheck,
  FirstAiderRecord,
  FoodBudgetWeekRecord,
  FoodHygieneRecord,
  FriendshipMap,
  FuneralRecord,
  GardenPlotRecord,
  SafetyCheckRecord,
  GiftRecord,
  GovernanceMeeting,
  GrabBag,
  GriefRecord,
  HairAppointment,
  HandoverAudit,
  HateIncident,
  HealthAssessment,
  HealthMonitoringEntry,
  HealthPassport,
  HealthcarePlan,
  TripPlan,
  ImprovementObjective,
  PetRecord,
  HomeworkSession,
  HouseRule,
  HouseholdTask,
  ImmunisationRecord,
  ImpactAssessment,
  IncidentTrendRecord,
  ClubRecord,
  AgencyFeedback,
  BedroomProfile,
  BedtimeRoutine,
  CardRecord,
  BoardReport,
  AsbestosRecord,
  PestRecord,
  WindowCheck,
  BcpScenarioPlan,
  CaseFileAudit,
  MoneyRecord,
  OrthoRecord,
  ParticipationEntry,
  RiteRecord,
  UniformRecord,
  SaltRecord,
  SwimRecord,
  VolunteerRecord,
  WorkExpRecord,
  ChildPledge,
  CleaningEntry,
  CommunityEngagement,
  ResolutionMeeting,
  ConsequenceRecord,
  ContactPlan,
  DailyRoutinePlan,
  DietaryPlan,
  DigitalPlan,
  Disclosure,
  ShiftChecklist,
  Escalation,
  ChosenFamilyRecord,
  FamilyRelationshipRecord,
  FirstRelationshipRecord,
  ChildrensRightEntry,
  LocalOfferSection,
  LocationAssessmentArea,
  AlertNotification,
  PositiveAchievement,
  PostIncidentChildDebrief,
} from "@/types/extended";
import type { Document, DocumentReadReceipt, Expense } from "@/types";
import type { UploadedDocument, DocumentAuditEntry } from "@/types/documents";
import type {
  Vacancy, CandidateProfile, CandidateCheck, CandidateReference,
  EmploymentHistoryEntry, GapExplanation, CandidateInterview,
  ConditionalOffer, RecruitmentAuditEntry,
} from "@/types/recruitment";
import type {
  StaffCompetencyProfile, CompetencyScore, DevelopmentPlan,
  PracticeObservation, CareerReadinessReport, SuccessionPlan,
  AppraisalRecord, InductionRecord, QualificationRecord,
  DailyRiskBriefing, EqualityInitiative, EqualityTrainingRecord,
  IndependencePathway, IndependenceSkillsRecord,
  IndependenceLivingAssessment, IndependentTravelRecord,
  VisitorReport, InfectionRecord, ReadinessItem,
  InsurancePolicy, InventoryItem, IroCorrespondence,
  HolidayRecord, ComplaintTrend, KeyRecord,
  KitchenHygieneCheck, KpiEntry, LacReviewPrep,
  LadoReferral, CommunicationProfile, LeavingCarePackage,
  LessonLearned, LgbtqInclusionRecord, LifeStoryEntry,
  LocalityRisk, LoneWorkingRecord, LoneWorkingRiskAssessment,
  MaintenanceScheduleItem, ManagementWalkround, TrainingMatrixRow,
  MarEntry, MatchingReferral, MediaPublicityConsent,
  MedicationAuditRecord, MedicationErrorInvestigation, MedicationNearMiss,
  MedicationStockCheck, MedicationStorageAudit, MedTrainingRecord,
  MemorialOccasionRecord, MenstrualHealthPlan, MealPlan,
  ReturnInterview, MultiAgencyMeeting, MultiDisciplinaryFormulation,
  CulturalVisit, NightCheck, NightStaffGuidanceSection,
  NightStaffHandover, NightAnxietySupportRecord, NotificationLogEntry,
  OccupationalTherapyRecord, OfstedActionItem, OfstedEngagementRecord,
  SelfEvaluationArea, OnCallShift, OnlineGamingRecord,
  OnlineSafetyIncident, OnlineSafetyAgreement, OperationalMeeting,
  OpticiansRecord,
  OutcomeStarAssessment, OutcomeMetric, OutdoorActivityRiskAssessment,
  ParentPartnershipRecord, ParentalResponsibilityRecord, PathwayPlan,
  PeerDynamic, PeerGroupDynamic, PepRecord, BelongingsRecord,
  PersonalPassport, PettyCashEntry, PhotoAlbumRecord,
  PhotoConsentRecord,
  PhysicalActivityEntry,
  PlacementAnniversaryEntry,
  PlacementBudgetTracker,
  CohortAnalysis,
  DisruptionPreventionPlan,
  PlacementEndSummary,
  PlacementImpactAssessment,
  PlacementMeeting,
  PlacementObjective,
  PlacementStabilityRecord,
  PlacementStabilityMeeting,
  SuccessFactor,
  PocketMoneyTransaction,
  PocketMoneyAccount,
  HomePolicy,
  PolicyImpactAnalysis,
  PolicyReviewRecord,
  PreAdmissionChecklist,
  PreventRecord,
  ProfessionalConsultation,
  CuriosityLogEntry,
  CPDRecord,
  ProfessionalFeeRecord,
  ProfessionalMeetingAttendance,
  ProfessionalNetworkContact,
  PropertyDamageRecord,
  QAAuditRecord,
  QualityOfCareReview,
  Reg46Review,
  ReferralTrackerRecord,
  Reg22Record,
  Reg35Notification,
  Reg40StaffEntry,
  Reg44ActionRecord,
  RegistrationChangeRecord,
  RegulatoryCorrespondenceLetter,
  ReligiousFestivalRecord,
  ReligiousObservanceRecord,
  RestrictionsLogRecord,
  RiskAppetiteDomain,
  StrategicRiskRecord,
  RiskManagementPlanRecord,
  RiskRegisterEntry,
  RoomAllocationRecord,
  RoomSearchRecord,
  RseTrackerRecord,
  SafeTouchProtocolRecord,
  SafeguardingSupervisionRecord,
  SaferRecruitmentRecord,
  SecureStorageRecord,
  SelfHarmSafetyPlanRecord,
  SensoryEquipmentRecord,
  SensoryProfileRecord,
  SensoryRoomUsageRecord,
  SeriousIncidentReviewRecord,
  ServiceImprovementRecord,
  ServiceUserAgreementRecord,
  ShiftNoteRecord,
  SiblingContactProtocolRecord,
  SleepAssessmentRecord,
  SleepInRecord,
  SocialWorkerContactRecord,
  StaffCommunicationPreferenceRecord,
  StaffCompetencyRecord,
  StaffDebriefRecord,
  StaffDisciplinaryRecord,
  StaffExitInterviewRecord,
  StaffGrievanceRecord,
  StaffHandbookAcknowledgementRecord,
  StaffInductionRecord,
  StaffMeetingRecord,
  StaffRecognitionRecord,
  StaffReflectionRecord,
  StaffSaferCaringRecord,
  StaffShadowingRecord,
  StaffSicknessRecord,
  StaffSupervisionThemeRecord,
  StaffWellbeingRecord,
  StakeholderFeedbackRecord,
  StatutoryCheckRecord,
  StatutoryVisitRecord,
  SubjectAccessRequestRecord,
  SupervisionMatrixRecord,
  SupervisionTrackerRecord,
  TherapeuticInputRecord,
  TransitionPlanningRecord,
  TransportLogRecord,
  UnannouncedVisitRecord,
  UtilityMonitoringRecord,
  VisitorsFeedbackRecord,
  VisitorRegistrationRecord,
  DbsCheckRecord,
  IdVerificationRecord,
  SafeguardingProtocolRecord,
  VisitorLogRecord,
  WaterHygieneRecord,
  WellbeingPulseSurveyRecord,
  WhistleblowingRecord,
  WBInvestigationRecord,
  YPSavingsAccountRecord,
  AdmissionReferral,
  HealthRecordEntry,
} from "@/types/extended";
import { generateId, todayStr, daysFromNow } from "@/lib/utils";
import type {
  CareEvent, CareEventRoute, CareEventJob, CareEventAuditLog,
  Reg45EvidenceItem, AnnexAEvidenceItem, ChildDailySummary,
  FilingCabinetItem, SavedTimeMetric,
} from "@/types/care-events";
import type { InspectionRecord } from "@/types/extended";
import type {
  AriaPracticeAssessment,
  AriaDevelopmentalGapRecord,
  AriaProtectiveFactorReview,
  AriaRelationshipDepthReview,
  AriaThresholdConsultation,
  AriaStaffWellbeingSignal,
  AriaPracticeFlag,
  AriaGuidanceRule,
} from "@/lib/aria-practice/types";
import type {
  WakeUpRoutine,
  OutcomeMeasure,
  WelfareProtocol,
  YoungCarerRecord,
  YpJob,
  TransportRA,
  UtilityBill,
  TimelineEvent,
  WelcomeTour,
  TransAffirmingPlan,
  VehiclePreUseCheck,
  VehiclePreUseCheckItem,
  CivicRecord,
  WarmWelcomePack,
  WarmWelcomePackItem,
  TherapeuticStaffTraining,
  TherapeuticChildImpact,
  HomeEmergencyContact,
  RiGovernanceReport,
} from "@/types/extended";
import {
  SEED_CARE_EVENTS, SEED_CARE_EVENT_ROUTES, SEED_CARE_EVENT_AUDIT,
  SEED_REG45_EVIDENCE, SEED_ANNEX_A_EVIDENCE, SEED_CHILD_DAILY_SUMMARIES,
  SEED_FILING_CABINET, SEED_SAVED_TIME_METRICS,
} from "@/lib/seed-care-events";
import type {
  AriaArtifact, AriaSource, AriaArtifactVersion, AriaArtifactReview,
  AriaArtifactAction, AriaQualityCheck, AriaGap, AriaStudioAuditLog,
  AriaHomeDynamicsSnapshot,
  AriaSafeguardingPattern, AriaEarlyWarning,
  AriaCareGraphNode, AriaCareGraphEdge,
  AriaFormulation, AriaDecisionRecommendation, AriaReg45EvidenceItem,
  AriaAnnexASnapshot,
  AriaReg45Report,
  AriaSuggestedRecord,
  AriaCommittedRecord,
  AriaReg40Triage,
} from "@/types/aria-studio";

// ── Persisted inspection snapshot envelope (M31) ─────────────────────────────
// Self-contained immutable record. Payload is the full InspectionSnapshot
// captured by src/lib/care-events/inspection-snapshot.ts; we keep it loosely
// typed here to avoid a circular import with the engine that consumes the db.
export interface PersistedInspectionSnapshot {
  id: string;
  home_id: string;
  generated_at: string;
  generated_by: string | null;
  schema_version: number;
  readiness_score: number;
  readiness_severity: string;
  payload: unknown;
}

// Per-user notification read/dismiss state (M34). Notification ids are
// deterministic ("source:source_id") and produced by
// src/lib/care-events/notifications.ts. We persist only the per-user
// envelope so the derived stream remains the source of truth.
export interface UserNotificationState {
  id: string;                 // `${user_id}::${notification_id}`
  user_id: string;
  notification_id: string;
  home_id: string;
  read_at: string | null;
  dismissed_at: string | null;
  updated_at: string;
}

// Persisted Reg 44 visit evidence pack header (M35). The full payload
// is the engine's Reg44Pack; kept loose here to avoid a circular import.
export interface PersistedReg44Pack {
  id: string;
  home_id: string;
  generated_at: string;
  generated_by: string | null;
  schema_version: number;
  window_start: string;
  window_end: string;
  headline_children: number;
  headline_safeguarding_events: number;
  payload: unknown;
}

// Persisted Inspection Bundle envelope (M43). Composed artifact built by
// src/lib/care-events/inspection-bundle.ts. Always safeguarding-sensitive
// in practice; the immutable export history rows record every download.
export interface PersistedInspectionBundle {
  id: string;
  home_id: string;
  generated_at: string;
  generated_by: string | null;
  schema_version: number;
  reg44_packs_included: number;
  filing_total: number;
  reg45_evidence_items: number;
  annex_a_evidence_items: number;
  recent_exports_included: number;
  readiness_score: number;
  readiness_severity: string;
  trajectory_alerts_open: number;
  trajectory_acks_recent: number;
  payload: unknown;
}

// Trajectory alert acknowledgement (M48). One row per (alert_id, acked_by_user)
// recording a manager's action note + timestamp so the acknowledged alert
// stops appearing in the manager notification stream until the next bundle
// (because the alert id is bundle-scoped and changes with each new bundle).
export interface TrajectoryAlertAck {
  id: string;                  // alert_id::user_id
  alert_id: string;
  home_id: string;
  bundle_id: string | null;
  alert_kind: string;
  acked_by_user: string;
  acked_by_role: string;
  note: string;
  acked_at: string;
}

// Trajectory RI escalation acknowledgement (M52). Parallel to the manager ack
// but scoped to the RI audience: an RI ack does not silence the underlying
// manager-facing alert, only the RI-escalation item, so management is still
// expected to acknowledge separately.
export interface TrajectoryRiEscalationAck {
  id: string;                  // escalation_id::user_id
  escalation_id: string;
  alert_id: string;
  home_id: string;
  bundle_id: string | null;
  alert_kind: string;
  acked_by_user: string;
  acked_by_role: string;
  note: string;
  acked_at: string;
}

// Immutable export history entry (M36). One row per successful export of a
// persisted artifact. Used to satisfy CLAUDE.md "restricted export
// permissions" + audit / traceability.
export type ExportHistoryKind =
  | "inspection_snapshot"
  | "reg44_pack"
  | "filing_cabinet_index"
  | "inspection_bundle";
export type ExportHistoryFormat = "json";
export interface ExportHistoryEntry {
  id: string;
  home_id: string;
  kind: ExportHistoryKind;
  artifact_id: string;
  format: ExportHistoryFormat;
  exported_at: string;
  exported_by: string;
  exported_by_role: string;
  is_safeguarding_sensitive: boolean;
  byte_size: number;
  reason: string | null;
}

/**
 * A learned ARIA answer — produced once by Claude, then replayed for near-identical
 * future requests so the API isn't called again. Only ever populated for LOW-risk,
 * non-sensitive commands, and bucketed by child so an answer is never served across
 * different children. (The intelligence chain: rules → this learned cache → Claude.)
 */
export interface AriaCachedResponse {
  id: string;
  /** ARIA command this answer was produced for (the cache bucket). */
  command_id: string;
  /** Child bucket — a learned answer is NEVER matched across different children. */
  child_id: string | null;
  /** Original input text (for near-identical similarity matching). */
  input_text: string;
  /** The learned answer, replayed without an API call. */
  output: string;
  confidence: string;
  /** Times this answer has been replayed instead of calling Claude. */
  hit_count: number;
  created_at: string;
  last_used_at: string;
}

/** A device's Web Push subscription, keyed by endpoint, owned by a staff recipient. */
export interface StoredPushSubscription {
  id: string;
  recipient_id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  created_at: string;
}

// ── Mutable collections ───────────────────────────────────────────────────────

const store = {
  home: { ...HOME } as Home,
  staff: [...STAFF] as StaffMember[],
  youngPeople: [...YOUNG_PEOPLE] as YoungPerson[],
  tasks: [...TASKS] as Task[],
  incidents: [...INCIDENTS] as Incident[],
  shifts: [...SHIFTS] as Shift[],
  signInVerifications: [] as SignInVerification[],
  emergencyAlerts: [] as EmergencyAlert[],
  ariaResponseCache: [] as AriaCachedResponse[],
  pushSubscriptions: [] as StoredPushSubscription[],
  medications: [...MEDICATIONS] as Medication[],
  medicationAdministrations: [] as MedicationAdministration[],
  dailyLog: [...DAILY_LOG] as DailyLogEntry[],
  leaveRequests: [...LEAVE_REQUESTS] as LeaveRequest[],
  trainingRecords: [...TRAINING_RECORDS] as TrainingRecord[],
  missingEpisodes: [] as MissingEpisode[],
  // Canonical persisted event spine (forms-as-views write path). Empty by default —
  // the read-only projection of domain collections is unchanged until events are captured here.
  cornerstoneEvents: [] as CornerstoneEvent[],
  chronology: [] as ChronologyEntry[],
  handovers: [] as HandoverEntry[],
  // ── Comms Centre (Phase 1) ────────────────────────────────────────────────
  commsChannels: [] as CommsChannel[],
  commsChannelMembers: [] as CommsChannelMember[],
  commsMessages: [] as CommsMessage[],
  commsMessageReceipts: [] as CommsMessageReceipt[],
  commsMessageActions: [] as CommsMessageAction[],
  staffTrustNoticeAcks: [] as StaffTrustNoticeAck[],
  buildings: [] as Building[],
  buildingChecks: [] as BuildingCheck[],
  vehicles: [] as Vehicle[],
  vehicleChecks: [] as VehicleCheck[],
  notifications: [
    {
      id: "notif_demo_01",
      home_id: "home_oak",
      recipient_id: "staff_darren",
      title: "Care entry verified",
      body: "Your entry \"Alex – general wellbeing\" has been verified by the manager. 2 evidence item(s) approved.",
      type: "system",
      priority: "normal",
      read: false,
      read_at: null,
      action_url: "/care-events/ce_demo_01",
      entity_type: "care_event",
      entity_id: "ce_demo_01",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "notif_demo_02",
      home_id: "home_oak",
      recipient_id: "staff_ryan",
      title: "Care entry returned",
      body: "Your entry \"Jordan – behaviour incident\" has been returned. Reason: \"Please add more detail about the antecedents before the incident.\"",
      type: "system",
      priority: "high",
      read: false,
      read_at: null,
      action_url: "/care-events/ce_demo_02",
      entity_type: "care_event",
      entity_id: "ce_demo_02",
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "notif_demo_03",
      home_id: "home_oak",
      recipient_id: "staff_darren",
      title: "Amendment requires review",
      body: "\"Casey – family contact log\" has been amended (version 2). Reason: Incorrect contact time recorded.",
      type: "system",
      priority: "normal",
      read: false,
      read_at: null,
      action_url: "/care-events/ce_demo_03",
      entity_type: "care_event",
      entity_id: "ce_demo_03",
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "notif_demo_04",
      home_id: "home_oak",
      recipient_id: "staff_ryan",
      title: "Care entry needs manager review",
      body: "Alex's entry \"Physical altercation with peer — restraint required\" requires your review and verification. This event has been routed to Management Oversight and Regulation 40 triage.",
      type: "incident",
      priority: "urgent",
      read: false,
      read_at: null,
      action_url: "/care-events/ce_001",
      entity_type: "care_event",
      entity_id: "ce_001",
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "notif_demo_05",
      home_id: "home_oak",
      recipient_id: "staff_ryan",
      title: "Regulation 45 evidence suggested",
      body: "A new Regulation 45 evidence item has been suggested from Casey's missing episode record. Please review and approve or reject.",
      type: "system",
      priority: "high",
      read: false,
      read_at: null,
      action_url: "/regulation-45",
      entity_type: "care_event",
      entity_id: "ce_003",
      created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    },
    {
      id: "notif_demo_06",
      home_id: "home_oak",
      recipient_id: "staff_chervelle",
      title: "Care entry verified",
      body: "Your entry \"Casey: PEP meeting — spring term targets agreed\" has been verified. Evidence has been added to the Annex A readiness dashboard.",
      type: "system",
      priority: "normal",
      read: true,
      read_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      action_url: "/care-events/ce_029",
      entity_type: "care_event",
      entity_id: "ce_029",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "notif_demo_07",
      home_id: "home_oak",
      recipient_id: "staff_mirela",
      title: "Safeguarding entry returned — action required",
      body: "Your safeguarding entry for Alex has been returned by the manager. Reason: \"Please add LADO contact details and confirm referral number.\" Please update and resubmit.",
      type: "safeguarding",
      priority: "urgent",
      read: false,
      read_at: null,
      action_url: "/care-events/ce_004",
      entity_type: "care_event",
      entity_id: "ce_004",
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
  ] as Notification[],
  timeSaved: [] as TimeSavedEntry[],
  careForms: [] as CareForm[],
  supervisions: [] as Supervision[],
  vacancies: [] as Vacancy[],
  candidateProfiles: [] as CandidateProfile[],
  candidateChecks: [] as CandidateCheck[],
  candidateReferences: [] as CandidateReference[],
  employmentHistory: [] as EmploymentHistoryEntry[],
  gapExplanations: [] as GapExplanation[],
  candidateInterviews: [] as CandidateInterview[],
  conditionalOffers: [] as ConditionalOffer[],
  recruitmentAudit: [] as RecruitmentAuditEntry[],
  documents: [] as Document[],
  documentReadReceipts: [] as DocumentReadReceipt[],
  expenses: [] as Expense[],
  audits: [] as Audit[],
  maintenance: [] as MaintenanceItem[],
  uploadedDocuments: [] as UploadedDocument[],
  documentAuditLog: [] as DocumentAuditEntry[],
  // Workforce Intelligence
  competencyProfiles: [] as StaffCompetencyProfile[],
  competencyScores: [] as CompetencyScore[],
  developmentPlans: [] as DevelopmentPlan[],
  practiceObservations: [] as PracticeObservation[],
  readinessReports: [] as CareerReadinessReport[],
  successionPlans: [] as SuccessionPlan[],
  appraisals: [] as AppraisalRecord[],
  inductionRecords: [] as InductionRecord[],
  qualifications: [] as QualificationRecord[],
  // Welfare Checks
  welfareChecks: [] as WelfareCheck[],
  welfareCheckRounds: [] as WelfareCheckRound[],
  // Outcomes Tracker
  outcomeTargets: [] as OutcomeTarget[],
  outcomeReviews: [] as OutcomeReview[],
  // Reg 44 Visitor Reports
  reg44VisitReports: [] as Reg44VisitReport[],
  // Key Working Sessions
  keyWorkingSessions: [] as KeyWorkingSession[],
  // Education Records
  educationRecords: [] as EducationRecord[],
  // Risk Assessments
  riskAssessments: [] as RiskAssessment[],
  // LAC Reviews
  lacReviews: [] as LACReview[],
  // Behaviour Support Plans
  behaviourSupportPlans: [] as BehaviourSupportPlan[],
  // Delegated Authority
  delegatedAuthority: [] as DelegatedAuthority[],
  // House Meetings
  houseMeetings: [] as HouseMeeting[],
  // Sanctions & Rewards
  sanctionRewards: [] as SanctionRewardEntry[],
  // Young Person Feedback
  ypFeedback: [] as YPFeedbackEntry[],
  // Sleep Log
  sleepLog: [] as SleepLogEntry[],
  // Compliments
  compliments: [] as Compliment[],
  visitors: [] as VisitorEntry[],
  fireDrills: [] as FireDrill[],
  significantEvents: [] as SignificantEvent[],
  restraints: [] as RestraintRecord[],
  notifiableEvents: [] as NotifiableEvent[],
  nightLogs: [] as NightLogEntry[],
  behaviourLog: [] as BehaviourEntry[],
  accidentBook: [] as AccidentRecord[],
  absenceTracking: [] as AbsenceRecord[],
  positiveHandling: [] as PositiveHandlingPlan[],
  medicationErrors: [
    {
      id: "MEDE-001", child_id: "yp_jordan", date_occurred: daysFromNow(-78), time_occurred: "18:30",
      reported_by: "staff_anna", reported_date: daysFromNow(-78), error_type: "wrong_dose", severity: "no_harm",
      medication: "Methylphenidate", prescribed_dose: "10mg", actual_dose: "20mg",
      what_happened: "Evening dose given as 20mg instead of prescribed 10mg. Identified at second check before any further doses.",
      immediate_action: "Sought advice from on-call GP; Jordan monitored, no adverse effects observed.",
      person_informed: ["GP", "Registered Manager", "Parent"], duty_of_candour: true, duty_of_candour_completed: daysFromNow(-77),
      root_cause: "Two strengths of the same medication stored together; busy evening round.",
      contributing_factors: ["look-alike packaging", "evening round time pressure"],
      remedial_actions: [{ action: "Refresher training on stimulant dosing and independent second-check", owner: "staff_darren", due_date: daysFromNow(-70), status: "completed" }],
      lessons_learned: "Refreshed staff training on stimulant dosing and introduced an independent second check for controlled drugs.",
      status: "closed", review_date: daysFromNow(-70), outcome: "No harm. Second-check process strengthened.", created_at: daysFromNow(-78),
    },
    {
      id: "MEDE-002", child_id: "yp_jordan", date_occurred: daysFromNow(-46), time_occurred: "18:15",
      reported_by: "staff_mirela", reported_date: daysFromNow(-46), error_type: "wrong_dose", severity: "low",
      medication: "Methylphenidate", prescribed_dose: "10mg", actual_dose: "5mg",
      what_happened: "Evening dose under-administered (5mg instead of 10mg) due to misread MAR chart.",
      immediate_action: "GP advice sought; no top-up required. Monitored overnight.",
      person_informed: ["GP", "Registered Manager"], duty_of_candour: true, duty_of_candour_completed: daysFromNow(-45),
      root_cause: "MAR chart handwriting unclear; second check not completed.",
      contributing_factors: ["unclear MAR entry", "second check skipped"],
      remedial_actions: [{ action: "Re-print MAR chart and reinforce second-check during evening round", owner: "staff_ryan", due_date: daysFromNow(-40), status: "completed" }],
      lessons_learned: "Reinforced that the controlled-drug second check is mandatory at every administration.",
      status: "closed", review_date: daysFromNow(-40), outcome: "Minimal impact. MAR clarity improved.", created_at: daysFromNow(-46),
    },
    {
      id: "MEDE-003", child_id: "yp_casey", date_occurred: daysFromNow(-12), time_occurred: "18:40",
      reported_by: "staff_chervelle", reported_date: daysFromNow(-12), error_type: "wrong_time", severity: "no_harm",
      medication: "Methylphenidate", prescribed_dose: "10mg", actual_dose: "10mg",
      what_happened: "Evening dose administered over 90 minutes late during a busy handover.",
      immediate_action: "GP advice sought; dose given, sleep monitored.",
      person_informed: ["GP", "Registered Manager"], duty_of_candour: false, duty_of_candour_completed: null,
      root_cause: "Evening medication round delayed by concurrent incident; no cover allocated.",
      contributing_factors: ["evening round time pressure", "single staff covering round"],
      remedial_actions: [{ action: "Review evening round staffing and protect medication time", owner: "staff_darren", due_date: daysFromNow(5), status: "pending" }],
      lessons_learned: "",
      status: "action_required", review_date: null, outcome: "Under review — recurrence of evening-round timing issue.", created_at: daysFromNow(-12),
    },
    {
      id: "MEDE-004", child_id: "yp_alex", date_occurred: daysFromNow(-30), time_occurred: "08:00",
      reported_by: "staff_edward", reported_date: daysFromNow(-30), error_type: "omission", severity: "no_harm",
      medication: "Sertraline", prescribed_dose: "50mg", actual_dose: "0mg (omitted)",
      what_happened: "Morning dose omitted — Alex declined and this was not escalated or re-offered.",
      immediate_action: "GP advised single missed dose acceptable; dose re-offered and taken at lunch.",
      person_informed: ["GP", "Registered Manager"], duty_of_candour: false, duty_of_candour_completed: null,
      root_cause: "Medication refusal not followed up; no clear re-offer protocol.",
      contributing_factors: ["refusal not escalated"],
      remedial_actions: [{ action: "Add a refusal re-offer and escalation step to the MAR protocol", owner: "staff_ryan", due_date: daysFromNow(-22), status: "completed" }],
      lessons_learned: "Agreed a clear re-offer and escalation pathway for declined medication.",
      status: "closed", review_date: daysFromNow(-22), outcome: "No harm. Refusal protocol clarified.", created_at: daysFromNow(-30),
    },
    {
      id: "MEDE-005", child_id: "yp_alex", date_occurred: daysFromNow(-9), time_occurred: "13:00",
      reported_by: "staff_lackson", reported_date: daysFromNow(-9), error_type: "wrong_time", severity: "no_harm",
      medication: "Paracetamol", prescribed_dose: "500mg PRN", actual_dose: "500mg",
      what_happened: "PRN paracetamol given without checking the minimum interval since the previous dose (interval was in fact met).",
      immediate_action: "Interval confirmed as adequate; no further action needed clinically.",
      person_informed: ["Registered Manager"], duty_of_candour: false, duty_of_candour_completed: null,
      root_cause: "PRN interval not documented at point of administration.",
      contributing_factors: ["PRN recording gap"],
      remedial_actions: [{ action: "Reinforce PRN interval recording on the MAR", owner: "staff_darren", due_date: daysFromNow(-2), status: "completed" }],
      lessons_learned: "PRN administrations must record the time of the previous dose.",
      status: "closed", review_date: daysFromNow(-2), outcome: "No harm. PRN recording reinforced.", created_at: daysFromNow(-9),
    },
    {
      id: "MEDE-006", child_id: "yp_casey", date_occurred: daysFromNow(-20), time_occurred: "19:00",
      reported_by: "staff_diane", reported_date: daysFromNow(-20), error_type: "wrong_dose", severity: "moderate",
      medication: "Risperidone", prescribed_dose: "0.5mg", actual_dose: "1mg",
      what_happened: "Double dose of risperidone administered during the evening round; Casey became drowsy and unsteady.",
      immediate_action: "GP and NHS 111 contacted; Casey observed closely overnight, recovered fully by morning.",
      person_informed: ["GP", "NHS 111", "Registered Manager", "Social Worker", "Parent"], duty_of_candour: true, duty_of_candour_completed: null,
      root_cause: "Two 0.5mg tablets dispensed in one pot; second-check not completed under time pressure.",
      contributing_factors: ["evening round time pressure", "second check skipped", "look-alike dispensing"],
      remedial_actions: [{ action: "Complete duty of candour with Casey and family", owner: "staff_darren", due_date: daysFromNow(3), status: "in_progress" }, { action: "Independent medicines competency re-assessment for staff on the round", owner: "staff_ryan", due_date: daysFromNow(7), status: "pending" }],
      lessons_learned: "",
      status: "under_investigation", review_date: null, outcome: "Under investigation — moderate harm; duty of candour outstanding.", created_at: daysFromNow(-20),
    },
    {
      id: "MEDE-007", child_id: "yp_jordan", date_occurred: daysFromNow(-5), time_occurred: "08:30",
      reported_by: "staff_anna", reported_date: daysFromNow(-5), error_type: "near_miss", severity: "no_harm",
      medication: "Paracetamol", prescribed_dose: "500mg", actual_dose: "0mg (caught before administration)",
      what_happened: "Near miss — paracetamol about to be given to Jordan from a pot prepared for another child; caught at the second check.",
      immediate_action: "Medication returned; correct administration completed. Positive catch by second checker.",
      person_informed: ["Registered Manager"], duty_of_candour: false, duty_of_candour_completed: null,
      root_cause: "Two pots prepared simultaneously during the morning round.",
      contributing_factors: ["multiple pots prepared at once"],
      remedial_actions: [{ action: "Reinforce one-child-at-a-time preparation", owner: "staff_darren", due_date: daysFromNow(-1), status: "completed" }],
      lessons_learned: "The independent second check worked exactly as intended — prepare and administer one child at a time.",
      status: "closed", review_date: daysFromNow(-1), outcome: "Harm prevented by the second-check system.", created_at: daysFromNow(-5),
    },
  ] as MedicationError[],
  complaints: [
    {
      id: "CMP-A1", home_id: "home_oak", reference: "CMP-2026-011", child_id: "yp_alex",
      complainant_type: "young_person", complainant_name: "Alex", complainant_relationship: null,
      date_received: daysFromNow(-52), category: "staff_conduct", stage: "stage_1", status: "closed",
      summary: "Alex says a member of staff 'shouts and doesn't listen' to him.",
      full_detail: "Alex raised this during a key-working session, saying he feels talked down to during the evening routine.",
      outcome: "partially_upheld", outcome_detail: "Communication approach with the staff member reviewed in supervision.",
      acknowledgement_due: daysFromNow(-49), response_due: daysFromNow(-42), acknowledged_at: daysFromNow(-51), response_sent_at: daysFromNow(-45),
      assigned_to: "staff_darren", investigation_notes: "Reflective discussion held; no further conduct concern.",
      lessons_learned: "Reflective session held; communication approach reviewed.", learning_shared: true,
      escalated_to_stage2_at: null, escalated_reason: null, ombudsman_reference: null, timeline: [],
      includes_safeguarding_element: false, linked_incident_id: null, aria_summary: null,
      created_at: daysFromNow(-52), updated_at: daysFromNow(-45), created_by: "staff_edward",
    },
    {
      id: "CMP-A2", home_id: "home_oak", reference: "CMP-2026-013", child_id: "yp_alex",
      complainant_type: "young_person", complainant_name: "Alex", complainant_relationship: null,
      date_received: daysFromNow(-45), category: "care_practice", stage: "stage_1", status: "closed",
      summary: "Alex feels he is restrained too quickly when he becomes upset.",
      full_detail: "Alex described feeling that staff move to physical intervention before trying to talk things through.",
      outcome: "not_upheld", outcome_detail: "Records reviewed; interventions found proportionate, but de-escalation plan refreshed with Alex.",
      acknowledgement_due: daysFromNow(-42), response_due: daysFromNow(-35), acknowledged_at: daysFromNow(-44), response_sent_at: daysFromNow(-36),
      assigned_to: "staff_darren", investigation_notes: "Reviewed last three interventions with the team.",
      lessons_learned: "Behaviour support plan and de-escalation strategies revisited with Alex.", learning_shared: true,
      escalated_to_stage2_at: null, escalated_reason: null, ombudsman_reference: null, timeline: [],
      includes_safeguarding_element: false, linked_incident_id: null, aria_summary: null,
      created_at: daysFromNow(-45), updated_at: daysFromNow(-36), created_by: "staff_anna",
    },
    {
      id: "CMP-A3", home_id: "home_oak", reference: "CMP-2026-015", child_id: "yp_alex",
      complainant_type: "advocate", complainant_name: "R. Singh (advocate)", complainant_relationship: "Independent advocate",
      date_received: daysFromNow(-38), category: "decisions_about_me", stage: "stage_2", status: "escalated",
      summary: "Advocate raises that Alex feels unsafe and is not being listened to about his care.",
      full_detail: "Alex's advocate escalated concerns that Alex's wishes about staffing and routine were not being acted on, and that Alex had said he 'doesn't feel safe'.",
      outcome: "partially_upheld", outcome_detail: "Care plan review brought forward; Alex's wishes incorporated.",
      acknowledgement_due: daysFromNow(-35), response_due: daysFromNow(-28), acknowledged_at: daysFromNow(-37), response_sent_at: null,
      assigned_to: "staff_darren", investigation_notes: "Stage 2 review underway with the placing authority.",
      lessons_learned: null, learning_shared: false,
      escalated_to_stage2_at: daysFromNow(-30), escalated_reason: "Advocate not satisfied that Alex's safety concerns were acted on at stage 1.", ombudsman_reference: null, timeline: [],
      includes_safeguarding_element: true, linked_incident_id: null, aria_summary: null,
      created_at: daysFromNow(-38), updated_at: daysFromNow(-30), created_by: "staff_darren",
    },
    {
      id: "CMP-A4", home_id: "home_oak", reference: "CMP-2026-022", child_id: "yp_alex",
      complainant_type: "young_person", complainant_name: "Alex", complainant_relationship: null,
      date_received: daysFromNow(-5), category: "care_practice", stage: "stage_1", status: "under_investigation",
      summary: "Alex is unhappy about a recent physical intervention and wants it reviewed.",
      full_detail: "Following a recent incident, Alex asked for his key worker to review how the intervention was handled.",
      outcome: "ongoing", outcome_detail: null,
      acknowledgement_due: daysFromNow(-2), response_due: daysFromNow(5), acknowledged_at: daysFromNow(-4), response_sent_at: null,
      assigned_to: "staff_edward", investigation_notes: "Debrief with Alex scheduled.",
      lessons_learned: null, learning_shared: false,
      escalated_to_stage2_at: null, escalated_reason: null, ombudsman_reference: null, timeline: [],
      includes_safeguarding_element: false, linked_incident_id: "inc_007", aria_summary: null,
      created_at: daysFromNow(-5), updated_at: daysFromNow(-4), created_by: "staff_edward",
    },
    {
      id: "CMP-J1", home_id: "home_oak", reference: "CMP-2026-009", child_id: "yp_jordan",
      complainant_type: "parent_carer", complainant_name: "Ms M (mother)", complainant_relationship: "Mother",
      date_received: daysFromNow(-40), category: "contact_family", stage: "stage_1", status: "closed",
      summary: "Jordan's mother complained that a planned family contact call was missed.",
      full_detail: "A scheduled video contact call did not take place due to a rota mix-up.",
      outcome: "upheld", outcome_detail: "Apology given; contact diary introduced to protect calls.",
      acknowledgement_due: daysFromNow(-37), response_due: daysFromNow(-30), acknowledged_at: daysFromNow(-39), response_sent_at: daysFromNow(-32),
      assigned_to: "staff_ryan", investigation_notes: "Rota and contact scheduling reviewed.",
      lessons_learned: "Family contact now logged in a protected contact diary.", learning_shared: true,
      escalated_to_stage2_at: null, escalated_reason: null, ombudsman_reference: null, timeline: [],
      includes_safeguarding_element: false, linked_incident_id: null, aria_summary: null,
      created_at: daysFromNow(-40), updated_at: daysFromNow(-32), created_by: "staff_ryan",
    },
    {
      id: "CMP-J2", home_id: "home_oak", reference: "CMP-2026-018", child_id: "yp_jordan",
      complainant_type: "young_person", complainant_name: "Jordan", complainant_relationship: null,
      date_received: daysFromNow(-14), category: "environment", stage: "stage_1", status: "closed",
      summary: "Jordan complained about noise levels during study time.",
      full_detail: "Jordan raised a formal complaint that noise in communal areas disrupts his study time.",
      outcome: "partially_upheld", outcome_detail: "Quiet study period agreed at the house meeting.",
      acknowledgement_due: daysFromNow(-11), response_due: daysFromNow(-4), acknowledged_at: daysFromNow(-13), response_sent_at: daysFromNow(-6),
      assigned_to: "staff_chervelle", investigation_notes: "Discussed and resolved at house meeting.",
      lessons_learned: "Protected quiet study time introduced.", learning_shared: true,
      escalated_to_stage2_at: null, escalated_reason: null, ombudsman_reference: null, timeline: [],
      includes_safeguarding_element: false, linked_incident_id: "inc_003", aria_summary: null,
      created_at: daysFromNow(-14), updated_at: daysFromNow(-6), created_by: "staff_chervelle",
    },
    {
      id: "CMP-C1", home_id: "home_oak", reference: "CMP-2026-024", child_id: "yp_casey",
      complainant_type: "young_person", complainant_name: "Casey", complainant_relationship: null,
      date_received: daysFromNow(-6), category: "care_practice", stage: "stage_1", status: "acknowledged",
      summary: "Casey is unhappy about how her evening medication and routine are handled.",
      full_detail: "Casey raised that she feels rushed at the evening medication round and wants more say in her routine.",
      outcome: "ongoing", outcome_detail: null,
      acknowledgement_due: daysFromNow(-3), response_due: daysFromNow(4), acknowledged_at: daysFromNow(-5), response_sent_at: null,
      assigned_to: "staff_chervelle", investigation_notes: "Key-working session arranged to hear Casey's views.",
      lessons_learned: null, learning_shared: false,
      escalated_to_stage2_at: null, escalated_reason: null, ombudsman_reference: null, timeline: [],
      includes_safeguarding_element: false, linked_incident_id: null, aria_summary: null,
      created_at: daysFromNow(-6), updated_at: daysFromNow(-5), created_by: "staff_diane",
    },
    {
      id: "CMP-C2", home_id: "home_oak", reference: "CMP-2026-006", child_id: "yp_casey",
      complainant_type: "professional", complainant_name: "School SENCo", complainant_relationship: "Education professional",
      date_received: daysFromNow(-25), category: "education_health", stage: "stage_1", status: "closed",
      summary: "School raised a concern about communication regarding Casey's appointments.",
      full_detail: "The school SENCo felt updates about Casey's health appointments were not shared promptly.",
      outcome: "not_upheld", outcome_detail: "Communication log shared; process clarified with school.",
      acknowledgement_due: daysFromNow(-22), response_due: daysFromNow(-15), acknowledged_at: daysFromNow(-24), response_sent_at: daysFromNow(-16),
      assigned_to: "staff_ryan", investigation_notes: "Reviewed communication records with school.",
      lessons_learned: "Shared a single point of contact for school communication.", learning_shared: true,
      escalated_to_stage2_at: null, escalated_reason: null, ombudsman_reference: null, timeline: [],
      includes_safeguarding_element: false, linked_incident_id: null, aria_summary: null,
      created_at: daysFromNow(-25), updated_at: daysFromNow(-16), created_by: "staff_ryan",
    },
  ] as Complaint[],
  bodyMap: [] as BodyMapEntry[],
  activities: [] as Activity[],
  adoptionRecords: [] as AdoptionRecord[],
  advocacyRecords: [
    {
      id: "adv_001", child_id: "yp_alex", advocacy_type: "independent" as const,
      status: "completed" as const, provider: "NYAS", advocate_name: "Sarah Thompson",
      referral_date: daysFromNow(-90), start_date: daysFromNow(-85),
      reason: "LAC review support", issues_raised: ["placement stability", "education plan"],
      visits: [
        { date: daysFromNow(-80), visit_type: "face_to_face" as const, summary: "Initial meeting — built rapport, discussed Alex's views on placement", private_session: true, actions_raised: ["Follow up on college options"] },
        { date: daysFromNow(-65), visit_type: "face_to_face" as const, summary: "Preparation for LAC review — identified key points Alex wants raised", private_session: true, actions_raised: ["Draft child's statement for review"] },
        { date: daysFromNow(-50), visit_type: "phone" as const, summary: "Post-review follow-up — Alex satisfied with outcomes", private_session: false, actions_raised: [] },
      ],
      child_view: "I felt listened to and Sarah helped me say what I wanted at the review",
      home_response: "Excellent advocacy support — Alex was well-prepared for LAC review",
      review_date: daysFromNow(-45), notes: "Completed successfully. Alex's views were represented at review.", created_at: daysFromNow(-90),
    },
    {
      id: "adv_002", child_id: "yp_jordan", advocacy_type: "issue_based" as const,
      status: "active" as const, provider: "Coram Voice", advocate_name: "Marcus Obi",
      referral_date: daysFromNow(-21), start_date: daysFromNow(-18),
      reason: "Complaint support", issues_raised: ["contact arrangements", "privacy concerns"],
      visits: [
        { date: daysFromNow(-15), visit_type: "face_to_face" as const, summary: "Discussed Jordan's complaint about contact visit arrangements", private_session: true, actions_raised: ["Draft formal complaint letter", "Request meeting with SW"] },
        { date: daysFromNow(-7), visit_type: "virtual" as const, summary: "Reviewed draft complaint — Jordan happy to submit", private_session: true, actions_raised: ["Submit complaint", "Schedule follow-up"] },
      ],
      child_view: "Marcus is helping me get my complaint heard properly",
      home_response: "Supporting Jordan through the complaints process appropriately",
      review_date: daysFromNow(14), notes: "Active — complaint submitted, awaiting response.", created_at: daysFromNow(-21),
    },
    {
      id: "adv_003", child_id: "yp_casey", advocacy_type: "independent" as const,
      status: "active" as const, provider: "NYAS", advocate_name: "Lisa Chen",
      referral_date: daysFromNow(-10), start_date: daysFromNow(-7),
      reason: "Child request", issues_raised: ["pathway planning", "identity support"],
      visits: [
        { date: daysFromNow(-5), visit_type: "face_to_face" as const, summary: "Initial meeting with Casey — discussed pathway plan concerns and identity exploration needs", private_session: true, actions_raised: ["Raise pathway plan timeline at next review", "Explore specialist support options"] },
      ],
      child_view: "I asked for an advocate because I want someone independent to help me with my plan",
      home_response: "Fully supporting Casey's request — advocate welcomed to the home",
      review_date: daysFromNow(21), notes: "New referral — building relationship.", created_at: daysFromNow(-10),
    },
    {
      id: "adv_004", child_id: "yp_alex", advocacy_type: "peer" as const,
      status: "completed" as const, provider: "Children in Care Council", advocate_name: "CiCC Peer Mentor",
      referral_date: daysFromNow(-180), start_date: daysFromNow(-175),
      reason: "Peer support", issues_raised: ["transition to independence"],
      visits: [
        { date: daysFromNow(-170), visit_type: "face_to_face" as const, summary: "Peer mentoring session — shared experiences of moving towards independence", private_session: false, actions_raised: [] },
        { date: daysFromNow(-150), visit_type: "face_to_face" as const, summary: "Group session at CiCC event — Alex participated confidently", private_session: false, actions_raised: [] },
      ],
      child_view: "It was good to talk to someone who's been through the same thing",
      home_response: "Positive engagement with peer support programme",
      review_date: daysFromNow(-140), notes: "Completed — Alex now acts as peer mentor for younger children.", created_at: daysFromNow(-180),
    },
    {
      id: "adv_005", child_id: "yp_jordan", advocacy_type: "complaints" as const,
      status: "completed" as const, provider: "NYAS", advocate_name: "Sarah Thompson",
      referral_date: daysFromNow(-120), start_date: daysFromNow(-117),
      reason: "Previous complaint support", issues_raised: ["activities provision"],
      visits: [
        { date: daysFromNow(-110), visit_type: "face_to_face" as const, summary: "Supported Jordan to articulate complaint about limited activities", private_session: true, actions_raised: ["Write up complaint"] },
        { date: daysFromNow(-95), visit_type: "phone" as const, summary: "Complaint resolved — additional activities now scheduled", private_session: false, actions_raised: [] },
      ],
      child_view: "They sorted it out after I made the complaint",
      home_response: "Acted on feedback — expanded activities programme",
      review_date: daysFromNow(-90), notes: "Resolved satisfactorily. Led to improvements in activities provision.", created_at: daysFromNow(-120),
    },
  ] as AdvocacyRecord[],
  afterCareRecords: [] as AfterCareRecord[],
  agencyInductions: [] as AgencyInduction[],
  agencyStaffLog: [] as AgencyStaffRecord[],
  annualDevelopmentReviews: [] as AnnualDevelopmentReview[],
  annualHealthAssessments: [] as AnnualHealthAssessment[],
  annualOutcomes: [] as AnnualOutcome[],
  appointments: [] as Appointment[],
  needsAssessments: [] as NeedsAssessment[],
  attachmentProfiles: [] as AttachmentProfile[],
  behaviourMapEntries: [] as BehaviourMapEntry[],
  bereavementRecords: [] as BereavementRecord[],
  bullyingIncidents: [] as BullyingIncident[],
  camhsReferrals: [] as CamhsReferral[],
  cctvAccesses: [] as CCTVAccess[],
  adhdPlans: [] as ADHDPlan[],
  allergyPlans: [] as AllergyPlan[],
  aspirationRecords: [] as AspirationRecord[],
  asthmaPlans: [] as AsthmaPlan[],
  autismPlans: [] as AutismPlan[],
  childBankAccounts: [] as ChildBankAccount[],
  careAnniversaryRecords: [] as CareAnniversaryRecord[],
  cyclingBikeRecords: [] as CyclingBikeRecord[],
  charityGrantRecords: [] as CharityGrantRecord[],
  clothingShoppingTrips: [] as ClothingShoppingTrip[],
  continencePlans: [] as ContinencePlan[],
  cookingBakingRecords: [] as CookingBakingRecord[],
  incomingCorrespondence: [] as IncomingCorrespondence[],
  courtAttendanceRecords: [] as CourtAttendanceRecord[],
  creativeProjectRecords: [] as CreativeProjectRecord[],
  culturalReligiousMentors: [] as CulturalReligiousMentor[],
  deafHearingSupportRecords: [] as DeafHearingSupportRecord[],
  diabeticCarePlans: [] as DiabeticCarePlan[],
  spldSupportPlans: [] as SpldSupportPlan[],
  epilepsySeizurePlans: [] as EpilepsySeizurePlan[],
  extracurricularClubRecords: [] as ExtracurricularClubRecord[],
  childFeedbackLoops: [] as ChildFeedbackLoop[],
  childStaffFeedback: [] as ChildStaffFeedback[],
  childFriendlyPolicies: [] as ChildFriendlyPolicy[],
  heritageLanguageRecords: [] as HeritageLanguageRecord[],
  immigrationUascRecords: [] as ImmigrationUascRecord[],
  childInjuryRecords: [] as ChildInjuryRecord[],
  childKeyDocuments: [] as ChildKeyDocument[],
  keyworkerSessions: [] as KeyworkerSessionRecord[],
  laundrySelfCareRecords: [] as LaundrySelfCareRecord[],
  childLedMeetings: [] as ChildLedMeetingRecord[],
  mentalHealthCheckIns: [] as MentalHealthCheckIn[],
  childPhoneRecords: [] as ChildPhoneRecord[],
  mobilityDisabilityPlans: [] as MobilityDisabilityPlan[],
  photoIdRecords: [] as PhotoIdRecord[],
  childPhotoEntries: [] as ChildPhotoEntry[],
  physioOtPlans: [] as PhysioOtPlan[],
  policeContactRecords: [] as PoliceContactRecord[],
  preventScreenings: [] as PreventScreeningRecord[],
  cpConferences: [] as CpConferenceRecord[],
  rightsLiteracyRecords: [] as RightsLiteracyRecord[],
  schoolEngagementEvents: [] as SchoolEngagementEvent[],
  selfSoothingToolkits: [] as SelfSoothingToolkit[],
  skinConditionPlans: [] as SkinConditionPlan[],
  smokingVapingRecords: [] as SmokingVapingRecord[],
  traumaTherapyLogs: [] as TraumaTherapyLog[],
  styleIdentityRecords: [] as StyleIdentityRecord[],
  tutoringRecords: [] as TutoringRecord[],
  visionCareRecords: [] as VisionCareRecord[],
  childExpertEntries: [] as ChildExpertEntry[],
  cmeRecords: [] as CMERecord[],
  childrensMeetingRecords: [] as ChildrensMeetingRecord[],
  clothingAllowanceRecords: [] as ClothingAllowanceRecord[],
  commissioningFeedbackRecords: [] as CommissioningFeedbackRecord[],
  communicationBookEntries: [] as CommunicationBookEntry[],
  communityFeedbackRecords: [] as CommunityFeedbackRecord[],
  complaintOutcomeRecords: [] as ComplaintOutcomeRecord[],
  consentRecords: [] as ConsentRecord[],
  contactDirectoryEntries: [] as ContactDirectoryEntry[],
  contactSupervisionSessions: [] as ContactSupervisionSession[],
  contextualSafeguardingRisks: [] as ContextualSafeguardingRisk[],
  correspondenceEntries: [] as CorrespondenceEntry[],
  criticalIncidentDebriefRecords: [] as CriticalIncidentDebriefRecord[],
  culturalIdentityPlans: [] as CulturalIdentityPlan[],
  dataBreachRecords: [] as DataBreachRecord[],
  dataProtectionRecords: [] as DataProtectionRecord[],
  debriefRecords: [] as DebriefRecord[],
  dentalRecords: [] as DentalRecord[],
  dolRecords: [
    {
      id: "dol_001", child_id: "yp_alex", restriction_type: "internet_monitoring" as const,
      description: "Internet filtering and monitoring due to online exploitation risk",
      legal_basis: "care_plan" as const, authorised_by_id: "staff_darren",
      date_imposed: daysFromNow(-42), review_date: daysFromNow(-12),
      status: "current" as const, proportionate: true,
      necessary_justification: "Active online exploitation concerns — contact with unknown adults on social media",
      child_consulted: true, child_views: "Alex understands why it's in place but finds it frustrating",
      sw_consulted: true, sw_views: "Agrees proportionate given risk level",
      ilo_consulted: false, court_authorised: false, court_ref: "",
      alternatives_considered: ["Education-only approach", "Time-limited device access"],
      impact_on_child: "Reduced online social contact. Compensated with additional face-to-face activities.",
      review_history: [
        { date: daysFromNow(-42), outcome: "Imposed following CSE screening" },
        { date: daysFromNow(-28), outcome: "Maintained — risk level unchanged" },
        { date: daysFromNow(-12), outcome: "Maintained — Alex consulted, views recorded" },
      ],
      notes: "Linked to CSE safety plan", created_at: daysFromNow(-42) + "T09:00:00Z",
    },
    {
      id: "dol_002", child_id: "yp_alex", restriction_type: "geographic_restriction" as const,
      description: "Cannot leave home unaccompanied after 8pm",
      legal_basis: "risk_assessment" as const, authorised_by_id: "staff_darren",
      date_imposed: daysFromNow(-42), review_date: daysFromNow(-50),
      status: "current" as const, proportionate: true,
      necessary_justification: "Missing episodes all occurred in evenings. Safety plan requires supervision.",
      child_consulted: true, child_views: "Alex disagrees but accepts it for now",
      sw_consulted: true, sw_views: "Supports the restriction given MACE involvement",
      ilo_consulted: false, court_authorised: false, court_ref: "",
      alternatives_considered: ["Curfew with check-ins", "GPS tracking (rejected as disproportionate)"],
      impact_on_child: "Limited evening independence. Staff arrange activities to compensate.",
      review_history: [
        { date: daysFromNow(-42), outcome: "Imposed alongside safety plan" },
        { date: daysFromNow(-28), outcome: "Maintained — no missing episodes since" },
      ],
      notes: "Review overdue — next review needed", created_at: daysFromNow(-42) + "T09:30:00Z",
    },
    {
      id: "dol_003", child_id: "yp_jordan", restriction_type: "contact_restriction" as const,
      description: "No unsupervised contact with maternal uncle",
      legal_basis: "court_order" as const, authorised_by_id: "staff_darren",
      date_imposed: daysFromNow(-180), review_date: daysFromNow(-10),
      status: "current" as const, proportionate: true,
      necessary_justification: "Court order following safeguarding concerns — uncle subject to investigation",
      child_consulted: true, child_views: "Jordan understands and agrees with this",
      sw_consulted: true, sw_views: "Court-directed — must remain in place",
      ilo_consulted: true, court_authorised: true, court_ref: "FC-2025-0892",
      alternatives_considered: ["Supervised contact only"],
      impact_on_child: "Jordan has supervised contact fortnightly — no distress noted.",
      review_history: [
        { date: daysFromNow(-180), outcome: "Court order imposed" },
        { date: daysFromNow(-90), outcome: "Reviewed — maintained per court direction" },
        { date: daysFromNow(-10), outcome: "Reviewed — no change. Uncle's investigation ongoing." },
      ],
      notes: "Part of family court proceedings", created_at: daysFromNow(-180) + "T10:00:00Z",
    },
    {
      id: "dol_004", child_id: "yp_jordan", restriction_type: "curfew" as const,
      description: "Must be home by 9pm on school nights",
      legal_basis: "care_plan" as const, authorised_by_id: "staff_darren",
      date_imposed: daysFromNow(-60), review_date: daysFromNow(-30),
      status: "current" as const, proportionate: true,
      necessary_justification: "Sleep routine support — school attendance improved since curfew in place",
      child_consulted: false, child_views: "",
      sw_consulted: true, sw_views: "Proportionate for age and need",
      ilo_consulted: false, court_authorised: false, court_ref: "",
      alternatives_considered: ["Later curfew with gradual extension"],
      impact_on_child: "Jordan occasionally frustrated but acknowledges sleep has improved",
      review_history: [
        { date: daysFromNow(-60), outcome: "Imposed as part of sleep support plan" },
        { date: daysFromNow(-30), outcome: "Maintained — school attendance data supports effectiveness" },
      ],
      notes: "Child not formally consulted at last review — needs addressing", created_at: daysFromNow(-60) + "T11:00:00Z",
    },
    {
      id: "dol_005", child_id: "yp_casey", restriction_type: "internet_monitoring" as const,
      description: "Age-appropriate internet filtering on home devices",
      legal_basis: "care_plan" as const, authorised_by_id: "staff_darren",
      date_imposed: daysFromNow(-100), review_date: daysFromNow(-5),
      status: "current" as const, proportionate: true,
      necessary_justification: "Standard safeguarding measure for age group — not restrictive beyond normal parenting",
      child_consulted: true, child_views: "Casey is happy with current arrangement",
      sw_consulted: true, sw_views: "Standard measure — no concerns",
      ilo_consulted: false, court_authorised: false, court_ref: "",
      alternatives_considered: [],
      impact_on_child: "Minimal impact — normal parenting equivalent",
      review_history: [
        { date: daysFromNow(-100), outcome: "Standard measure on admission" },
        { date: daysFromNow(-5), outcome: "Reviewed — age-appropriate, maintained" },
      ],
      notes: "Standard measure — good parenting equivalent", created_at: daysFromNow(-100) + "T09:00:00Z",
    },
    {
      id: "dol_006", child_id: "yp_alex", restriction_type: "confiscation" as const,
      description: "Second mobile phone confiscated — device of unknown origin",
      legal_basis: "risk_assessment" as const, authorised_by_id: "staff_darren",
      date_imposed: daysFromNow(-18), review_date: daysFromNow(-18),
      status: "current" as const, proportionate: true,
      necessary_justification: "Phone believed to be provided by person of concern. Evidence preserved for police.",
      child_consulted: true, child_views: "Alex was upset but staff explained clearly",
      sw_consulted: true, sw_views: "Appropriate action — supports police investigation",
      ilo_consulted: false, court_authorised: false, court_ref: "",
      alternatives_considered: ["Monitoring phone content (rejected — evidential concerns)"],
      impact_on_child: "Alex has own phone returned. Second phone with police.",
      review_history: [
        { date: daysFromNow(-18), outcome: "Phone confiscated and handed to police" },
      ],
      notes: "Police ref POL-2026-4421", created_at: daysFromNow(-18) + "T16:00:00Z",
    },
  ] as DoLRecord[],
  devicePolicyRecords: [] as DevicePolicyRecord[],
  digitalLiteracySkillRecords: [] as DigitalLiteracySkillRecord[],
  dischargeRecords: [] as DischargeRecord[],
  diversityCalendarEvents: [] as DiversityCalendarEvent[],
  trackedDocuments: [] as TrackedDocument[],
  drivingRecords: [] as DrivingRecord[],
  substanceScreenings: [] as SubstanceScreening[],
  dutyLogEntries: [] as DutyLogEntry[],
  eatingSupportPlans: [] as EatingSupportPlan[],
  eduAttendanceRecords: [] as EduAttendanceRecord[],
  ehcpRecords: [] as EhcpRecord[],
  emergencyChildContacts: [] as EmergencyChildContact[],
  evacuationPlans: [] as EvacuationPlan[],
  emergencyMedicationProtocols: [] as EmergencyMedicationProtocol[],
  emergencyReferrals: [] as EmergencyReferral[],
  emergencyPlans: [] as EmergencyPlan[],
  protocolDrills: [] as ProtocolDrill[],
  emotionalVocabRecords: [] as EmotionalVocabRecord[],
  environmentalRisks: [] as EnvironmentalRisk[],
  exploitationScreenings: [
    {
      id: "es_001", date: daysFromNow(-20), review_date: daysFromNow(-20), completed_by: "staff_darren",
      child_id: "yp_alex", exploitation_type: "cse" as const, risk_level: "high" as const,
      previous_risk_level: "medium" as const, status: "referred" as const,
      risk_indicators: [
        { indicator: "Going missing from placement", present: true, notes: "3 episodes in 30 days" },
        { indicator: "Unexplained gifts or money", present: true, notes: "New phone of unknown origin" },
        { indicator: "Older associates", present: true, notes: "Seen with adults aged 20-25" },
        { indicator: "Sexually harmful language", present: true, notes: "Increased sexualised language noted" },
        { indicator: "Secrecy about phone/online activity", present: true, notes: "Deleting messages" },
      ],
      protective_factors: ["Positive relationship with key worker", "Engaged in education"],
      vulnerabilities: ["History of neglect", "Low self-esteem", "Desire for belonging"],
      contextual_factors: "Town centre park identified as meeting point. Bus station used for travel to unknown locations.",
      associates_of_concern: "Male aged approx 22-25, goes by 'D'. Drives silver BMW.",
      locations_concern: "Town Centre Park, Bus Station, unknown address in neighbouring borough",
      online_risks: "Active on Snapchat — communication with unknown adults",
      safeguarding_actions: ["MACE referral made", "Safety plan implemented", "Enhanced night checks"],
      multi_agency_involved: ["Police", "MACE", "Social Worker", "CAMHS"],
      nrm_referral: false, nrm_ref: null, nrm_outcome: null, police_ref: "POL-2026-4421",
      social_worker_notified: true, safety_plan: "Do not leave home unaccompanied after 8pm. Staff to escort to/from school. Mobile phone monitored.",
      direct_work: "Weekly 1:1 sessions on healthy relationships and online safety",
      management_oversight: "Weekly review by RM. Discussed at team meeting.",
      next_review_date: daysFromNow(10), created_at: daysFromNow(-20) + "T09:00:00Z",
    },
    {
      id: "es_002", date: daysFromNow(-15), review_date: daysFromNow(-15), completed_by: "staff_anna",
      child_id: "yp_alex", exploitation_type: "cce" as const, risk_level: "medium" as const,
      previous_risk_level: "low" as const, status: "monitoring" as const,
      risk_indicators: [
        { indicator: "Going missing from placement", present: true, notes: "Same episodes linked to CCE concern" },
        { indicator: "County lines indicators", present: false, notes: "" },
        { indicator: "Association with known gang members", present: false, notes: "" },
      ],
      protective_factors: ["No drug use identified", "Good school engagement"],
      vulnerabilities: ["Peer influence", "Desire for material goods"],
      contextual_factors: "Bus station identified as potential recruitment location",
      associates_of_concern: "Unknown — monitoring", locations_concern: "Bus station",
      online_risks: "No specific online CCE indicators", safeguarding_actions: ["Monitoring", "Included in MACE discussion"],
      multi_agency_involved: ["Police", "Social Worker"], nrm_referral: false, nrm_ref: null, nrm_outcome: null, police_ref: null,
      social_worker_notified: true, safety_plan: "Covered under existing CSE safety plan",
      direct_work: "County lines awareness session delivered", management_oversight: "Monthly review",
      next_review_date: daysFromNow(15), created_at: daysFromNow(-15) + "T10:00:00Z",
    },
    {
      id: "es_003", date: daysFromNow(-25), review_date: daysFromNow(-25), completed_by: "staff_anna",
      child_id: "yp_jordan", exploitation_type: "online_exploitation" as const, risk_level: "medium" as const,
      previous_risk_level: null, status: "monitoring" as const,
      risk_indicators: [
        { indicator: "Contact with unknown adults online", present: true, notes: "Gaming platform" },
        { indicator: "Sharing personal information online", present: true, notes: "Shared location on public profile" },
      ],
      protective_factors: ["Open with staff about online activity", "Trusting relationship with key worker"],
      vulnerabilities: ["Social isolation", "Desire for peer connection"],
      contextual_factors: "Online gaming community — Discord server with older users",
      associates_of_concern: "Username 'GamerKing99' — age unverified", locations_concern: "Online only",
      online_risks: "Discord server with unmoderated content. Profile publicly visible.",
      safeguarding_actions: ["Privacy settings reviewed", "Online safety direct work", "Parental controls enhanced"],
      multi_agency_involved: ["Social Worker"], nrm_referral: false, nrm_ref: null, nrm_outcome: null, police_ref: null,
      social_worker_notified: true, safety_plan: "Device checks weekly. Parental controls on router.",
      direct_work: "Fortnightly online safety sessions", management_oversight: "Monthly review",
      next_review_date: daysFromNow(5), created_at: daysFromNow(-25) + "T11:00:00Z",
    },
    {
      id: "es_004", date: daysFromNow(-30), review_date: daysFromNow(-30), completed_by: "staff_chervelle",
      child_id: "yp_jordan", exploitation_type: "cse" as const, risk_level: "low" as const,
      previous_risk_level: null, status: "closed" as const,
      risk_indicators: [
        { indicator: "Going missing from placement", present: false, notes: "" },
        { indicator: "Unexplained gifts or money", present: false, notes: "" },
      ],
      protective_factors: ["No concerning associations", "Good peer relationships", "Stable placement"],
      vulnerabilities: [], contextual_factors: "No concerns identified",
      associates_of_concern: "None", locations_concern: "None",
      online_risks: "None specific to CSE", safeguarding_actions: [],
      multi_agency_involved: [], nrm_referral: false, nrm_ref: null, nrm_outcome: null, police_ref: null,
      social_worker_notified: false, safety_plan: "", direct_work: "General healthy relationships work",
      management_oversight: "Standard quarterly review", next_review_date: daysFromNow(60),
      created_at: daysFromNow(-30) + "T09:00:00Z",
    },
    {
      id: "es_005", date: daysFromNow(-10), review_date: daysFromNow(-10), completed_by: "staff_darren",
      child_id: "yp_casey", exploitation_type: "cse" as const, risk_level: "low" as const,
      previous_risk_level: null, status: "closed" as const,
      risk_indicators: [
        { indicator: "Going missing from placement", present: false, notes: "" },
        { indicator: "Older associates", present: false, notes: "" },
      ],
      protective_factors: ["Strong school engagement", "Positive family contact", "Trusted adult relationships"],
      vulnerabilities: [], contextual_factors: "No contextual concerns",
      associates_of_concern: "None", locations_concern: "None",
      online_risks: "Age-appropriate online activity", safeguarding_actions: [],
      multi_agency_involved: [], nrm_referral: false, nrm_ref: null, nrm_outcome: null, police_ref: null,
      social_worker_notified: false, safety_plan: "", direct_work: "Healthy relationships in PSHE",
      management_oversight: "Quarterly review", next_review_date: daysFromNow(80),
      created_at: daysFromNow(-10) + "T14:00:00Z",
    },
    {
      id: "es_006", date: daysFromNow(-10), review_date: daysFromNow(-10), completed_by: "staff_darren",
      child_id: "yp_casey", exploitation_type: "peer_on_peer" as const, risk_level: "low" as const,
      previous_risk_level: null, status: "closed" as const,
      risk_indicators: [
        { indicator: "Bullying others", present: false, notes: "" },
        { indicator: "Harmful sexual behaviour", present: false, notes: "" },
      ],
      protective_factors: ["Empathetic nature", "Good peer relationships"],
      vulnerabilities: [], contextual_factors: "No peer-on-peer concerns",
      associates_of_concern: "None", locations_concern: "None",
      online_risks: "None", safeguarding_actions: [],
      multi_agency_involved: [], nrm_referral: false, nrm_ref: null, nrm_outcome: null, police_ref: null,
      social_worker_notified: false, safety_plan: "", direct_work: "",
      management_oversight: "Quarterly review", next_review_date: daysFromNow(80),
      created_at: daysFromNow(-10) + "T14:30:00Z",
    },
    {
      id: "es_007", date: daysFromNow(-18), review_date: daysFromNow(-18), completed_by: "staff_anna",
      child_id: "yp_alex", exploitation_type: "radicalisation" as const, risk_level: "low" as const,
      previous_risk_level: null, status: "closed" as const,
      risk_indicators: [
        { indicator: "Extremist material", present: false, notes: "" },
        { indicator: "Isolating from peers", present: false, notes: "" },
      ],
      protective_factors: ["Diverse friendship group", "Critical thinking skills"],
      vulnerabilities: [], contextual_factors: "No Prevent concerns identified",
      associates_of_concern: "None", locations_concern: "None",
      online_risks: "None specific to radicalisation", safeguarding_actions: [],
      multi_agency_involved: [], nrm_referral: false, nrm_ref: null, nrm_outcome: null, police_ref: null,
      social_worker_notified: false, safety_plan: "", direct_work: "",
      management_oversight: "Quarterly review", next_review_date: daysFromNow(72),
      created_at: daysFromNow(-18) + "T10:00:00Z",
    },
    {
      id: "es_008", date: daysFromNow(-95), review_date: daysFromNow(-95), completed_by: "staff_darren",
      child_id: "yp_jordan", exploitation_type: "cce" as const, risk_level: "low" as const,
      previous_risk_level: null, status: "closed" as const,
      risk_indicators: [
        { indicator: "County lines indicators", present: false, notes: "" },
        { indicator: "Unexplained money", present: false, notes: "" },
      ],
      protective_factors: ["No drug involvement", "Good attendance at activities"],
      vulnerabilities: [], contextual_factors: "None",
      associates_of_concern: "None", locations_concern: "None",
      online_risks: "None", safeguarding_actions: [],
      multi_agency_involved: [], nrm_referral: false, nrm_ref: null, nrm_outcome: null, police_ref: null,
      social_worker_notified: false, safety_plan: "", direct_work: "",
      management_oversight: "Standard review", next_review_date: daysFromNow(-5),
      created_at: daysFromNow(-95) + "T09:00:00Z",
    },
  ] as ExploitationScreening[],
  externalVisitors: [] as ExternalVisitor[],
  familyTimeSessions: [] as FamilyTimeSession[],
  genogramEntries: [] as GenogramEntry[],
  fireRiskItems: [] as FireRiskItem[],
  fireEquipmentChecks: [] as FireEquipmentCheck[],
  firstAiderRecords: [] as FirstAiderRecord[],
  foodBudgetWeekRecords: [] as FoodBudgetWeekRecord[],
  foodHygieneRecords: [] as FoodHygieneRecord[],
  friendshipMaps: [] as FriendshipMap[],
  funeralRecords: [] as FuneralRecord[],
  gardenPlotRecords: [] as GardenPlotRecord[],
  safetyCheckRecords: [] as SafetyCheckRecord[],
  giftRecords: [] as GiftRecord[],
  governanceMeetings: [] as GovernanceMeeting[],
  grabBags: [] as GrabBag[],
  griefRecords: [] as GriefRecord[],
  hairAppointments: [] as HairAppointment[],
  handoverAudits: [] as HandoverAudit[],
  hateIncidents: [] as HateIncident[],
  healthAssessments: [] as HealthAssessment[],
  healthMonitoring: [] as HealthMonitoringEntry[],
  healthPassports: [] as HealthPassport[],
  healthcarePlans: [] as HealthcarePlan[],
  tripPlans: [] as TripPlan[],
  improvementObjectives: [] as ImprovementObjective[],
  petRecords: [] as PetRecord[],
  homeworkSessions: [] as HomeworkSession[],
  houseRules: [] as HouseRule[],
  householdTasks: [] as HouseholdTask[],
  immunisationRecords: [] as ImmunisationRecord[],
  impactAssessments: [] as ImpactAssessment[],
  incidentTrends: [] as IncidentTrendRecord[],
  clubRecords: [] as ClubRecord[],
  agencyFeedback: [] as AgencyFeedback[],
  bedroomProfiles: [] as BedroomProfile[],
  bedtimeRoutines: [] as BedtimeRoutine[],
  wakeUpRoutines: [] as WakeUpRoutine[],
  outcomeMeasures: [] as OutcomeMeasure[],
  welfareProtocols: [] as WelfareProtocol[],
  youngCarerRecords: [] as YoungCarerRecord[],
  ypJobs: [] as YpJob[],
  transportRAs: [] as TransportRA[],
  utilityBills: [] as UtilityBill[],
  timelineEvents: [] as TimelineEvent[],
  welcomeTours: [] as WelcomeTour[],
  transAffirmingPlans: [] as TransAffirmingPlan[],
  vehiclePreUseChecks: [] as VehiclePreUseCheck[],
  civicRecords: [] as CivicRecord[],
  warmWelcomePacks: [] as WarmWelcomePack[],
  therapeuticStaffTraining: [] as TherapeuticStaffTraining[],
  therapeuticChildImpact: [] as TherapeuticChildImpact[],
  homeEmergencyContacts: [] as HomeEmergencyContact[],
  riGovernanceReports: [] as RiGovernanceReport[],
  cardRecords: [] as CardRecord[],
  boardReports: [] as BoardReport[],
  asbestosRecords: [] as AsbestosRecord[],
  pestRecords: [] as PestRecord[],
  windowChecks: [] as WindowCheck[],
  bcpScenarios: [] as BcpScenarioPlan[],
  caseFileAudits: [] as CaseFileAudit[],
  moneyRecords: [] as MoneyRecord[],
  orthoRecords: [] as OrthoRecord[],
  participationEntries: [] as ParticipationEntry[],
  riteRecords: [] as RiteRecord[],
  uniformRecords: [] as UniformRecord[],
  saltRecords: [] as SaltRecord[],
  swimRecords: [] as SwimRecord[],
  volunteerRecords: [] as VolunteerRecord[],
  workExpRecords: [] as WorkExpRecord[],
  childPledges: [] as ChildPledge[],
  cleaningEntries: [] as CleaningEntry[],
  communityEngagements: [] as CommunityEngagement[],
  resolutionMeetings: [] as ResolutionMeeting[],
  consequenceRecords: [] as ConsequenceRecord[],
  contactPlans: [] as ContactPlan[],
  dailyRoutinePlans: [] as DailyRoutinePlan[],
  dietaryPlans: [] as DietaryPlan[],
  digitalPlans: [] as DigitalPlan[],
  disclosures: [] as Disclosure[],
  shiftChecklists: [] as ShiftChecklist[],
  escalations: [] as Escalation[],
  chosenFamilyRecords: [] as ChosenFamilyRecord[],
  familyRelationshipRecords: [] as FamilyRelationshipRecord[],
  firstRelationshipRecords: [] as FirstRelationshipRecord[],
  dailyRiskBriefings: [] as DailyRiskBriefing[],
  equalityInitiatives: [] as EqualityInitiative[],
  equalityTraining: [] as EqualityTrainingRecord[],
  independencePathways: [] as IndependencePathway[],
  independenceSkillsRecords: [
    {
      id: "isk_001", child_id: "yp_alex", review_date: daysFromNow(-30), reviewer: "staff_darren",
      overall_readiness: 72,
      skills: [
        { id: "sk_a1", name: "Cooking", category: "cooking" as const, proficiency: "developing" as const, target_date: daysFromNow(60), last_assessed: daysFromNow(-30), assessed_by: "staff_darren", evidence: "Can prepare simple meals independently. Working on meal planning.", next_step: "Plan and cook full Sunday dinner" },
        { id: "sk_a2", name: "Budgeting", category: "budgeting" as const, proficiency: "competent" as const, target_date: daysFromNow(30), last_assessed: daysFromNow(-30), assessed_by: "staff_darren", evidence: "Manages pocket money well. Understands bills and direct debits.", next_step: "Open current account and set up standing orders" },
        { id: "sk_a3", name: "Laundry", category: "laundry" as const, proficiency: "independent" as const, target_date: daysFromNow(-60), last_assessed: daysFromNow(-30), assessed_by: "staff_darren", evidence: "Fully independent with washing, drying, and ironing.", next_step: "Maintain" },
        { id: "sk_a4", name: "Travel", category: "travel" as const, proficiency: "competent" as const, target_date: daysFromNow(30), last_assessed: daysFromNow(-30), assessed_by: "staff_darren", evidence: "Uses buses and trains independently. Can plan routes.", next_step: "Apply for provisional driving licence" },
        { id: "sk_a5", name: "Health Management", category: "health" as const, proficiency: "developing" as const, target_date: daysFromNow(90), last_assessed: daysFromNow(-30), assessed_by: "staff_darren", evidence: "Registers with GP, attends appointments. Needs prompting for dental.", next_step: "Book and attend dental appointment independently" },
        { id: "sk_a6", name: "Communication", category: "communication" as const, proficiency: "competent" as const, target_date: daysFromNow(30), last_assessed: daysFromNow(-30), assessed_by: "staff_darren", evidence: "Good verbal skills. Confident in meetings. Email use improving.", next_step: "Practice formal email for apprenticeship applications" },
        { id: "sk_a7", name: "Job Skills", category: "housing" as const, proficiency: "developing" as const, target_date: daysFromNow(90), last_assessed: daysFromNow(-30), assessed_by: "staff_darren", evidence: "CV written. Mock interview completed. Needs confidence in real settings.", next_step: "Attend work experience placement" },
      ],
      strengths: ["Self-motivated", "Good routine", "Proactive about learning"],
      areas_for_development: ["Cooking variety", "Health appointments", "Job interview confidence"],
      child_view: "I feel ready to move on. Just need to get better at cooking and find my apprenticeship.",
      pathway_notes: "Alex is progressing well. On track for August move to supported lodgings.", created_at: daysFromNow(-30),
    },
    {
      id: "isk_002", child_id: "yp_jordan", review_date: daysFromNow(-45), reviewer: "staff_anna",
      overall_readiness: 48,
      skills: [
        { id: "sk_j1", name: "Cooking", category: "cooking" as const, proficiency: "emerging" as const, target_date: daysFromNow(60), last_assessed: daysFromNow(-45), assessed_by: "staff_anna", evidence: "Can make basic snacks. Reluctant to engage with cooking sessions.", next_step: "Agree to attend weekly cooking sessions" },
        { id: "sk_j2", name: "Budgeting", category: "budgeting" as const, proficiency: "emerging" as const, target_date: daysFromNow(90), last_assessed: daysFromNow(-45), assessed_by: "staff_anna", evidence: "Spends pocket money quickly. Limited understanding of bills.", next_step: "Complete budgeting workshop with PA" },
        { id: "sk_j3", name: "Laundry", category: "laundry" as const, proficiency: "developing" as const, target_date: daysFromNow(30), last_assessed: daysFromNow(-45), assessed_by: "staff_anna", evidence: "Can use washing machine but needs reminding. Doesn't iron.", next_step: "Establish regular laundry routine" },
        { id: "sk_j4", name: "Travel", category: "travel" as const, proficiency: "competent" as const, target_date: daysFromNow(-30), last_assessed: daysFromNow(-45), assessed_by: "staff_anna", evidence: "Confident on buses. Uses maps app. Good road awareness.", next_step: "Plan a journey to apprenticeship provider independently" },
        { id: "sk_j5", name: "Health Management", category: "health" as const, proficiency: "emerging" as const, target_date: daysFromNow(120), last_assessed: daysFromNow(-45), assessed_by: "staff_anna", evidence: "Knows where GP is but avoids appointments. Sleep issues unaddressed.", next_step: "Book and attend GP about sleep" },
        { id: "sk_j6", name: "Communication", category: "communication" as const, proficiency: "developing" as const, target_date: daysFromNow(60), last_assessed: daysFromNow(-45), assessed_by: "staff_anna", evidence: "Good with peers. Can be closed in professional settings.", next_step: "Practice speaking in review meetings" },
        { id: "sk_j7", name: "Job Skills", category: "housing" as const, proficiency: "not_started" as const, target_date: daysFromNow(120), last_assessed: daysFromNow(-45), assessed_by: "staff_anna", evidence: "No CV yet. Has expressed interest in construction.", next_step: "Visit local apprenticeship fair with PA" },
      ],
      strengths: ["Street-smart", "Good with people", "Physical confidence"],
      areas_for_development: ["Cooking", "Budgeting", "Health awareness", "Job readiness", "Engagement with services"],
      child_view: "I'll figure it out when I need to. Not bothered about cooking yet.",
      pathway_notes: "Needs significant support. Engagement is inconsistent — motivational approach needed.", created_at: daysFromNow(-45),
    },
    {
      id: "isk_003", child_id: "yp_casey", review_date: daysFromNow(-60), reviewer: "staff_chervelle",
      overall_readiness: 35,
      skills: [
        { id: "sk_c1", name: "Cooking", category: "cooking" as const, proficiency: "emerging" as const, target_date: daysFromNow(180), last_assessed: daysFromNow(-60), assessed_by: "staff_chervelle", evidence: "Enjoys baking but limited meal preparation. Interested in learning.", next_step: "Join weekly cooking activity" },
        { id: "sk_c2", name: "Budgeting", category: "budgeting" as const, proficiency: "not_started" as const, target_date: daysFromNow(240), last_assessed: daysFromNow(-60), assessed_by: "staff_chervelle", evidence: "Age-appropriate — not yet introduced to formal budgeting.", next_step: "Introduce pocket money tracker" },
        { id: "sk_c3", name: "Laundry", category: "laundry" as const, proficiency: "emerging" as const, target_date: daysFromNow(120), last_assessed: daysFromNow(-60), assessed_by: "staff_chervelle", evidence: "Has put a wash on with support. Needs practice.", next_step: "Wash own clothes weekly with decreasing support" },
        { id: "sk_c4", name: "Travel", category: "travel" as const, proficiency: "developing" as const, target_date: daysFromNow(90), last_assessed: daysFromNow(-60), assessed_by: "staff_chervelle", evidence: "Walks to school alone. Bus trips with staff.", next_step: "Independent bus trip to town and back" },
        { id: "sk_c5", name: "Health Management", category: "health" as const, proficiency: "emerging" as const, target_date: daysFromNow(180), last_assessed: daysFromNow(-60), assessed_by: "staff_chervelle", evidence: "Knows about GP. Staff manage appointments currently.", next_step: "Attend next appointment and ask own questions" },
        { id: "sk_c6", name: "Communication", category: "communication" as const, proficiency: "developing" as const, target_date: daysFromNow(60), last_assessed: daysFromNow(-60), assessed_by: "staff_chervelle", evidence: "Expressive creatively. Growing confidence in verbal expression.", next_step: "Participate in next LAC review discussion" },
        { id: "sk_c7", name: "Job Skills", category: "housing" as const, proficiency: "not_started" as const, target_date: daysFromNow(365), last_assessed: daysFromNow(-60), assessed_by: "staff_chervelle", evidence: "Age-appropriate — focus is on education currently.", next_step: "Explore creative career interests in key work" },
      ],
      strengths: ["Creative", "Self-aware", "Growing confidence", "Engaged with education"],
      areas_for_development: ["Practical life skills", "Confidence in new situations"],
      child_view: "I want to go to art college. I know I need to learn other stuff too but there's time.",
      pathway_notes: "Casey is 15 — focus on building skills gradually without pressure. Creative route for engagement.", created_at: daysFromNow(-60),
    },
  ] as IndependenceSkillsRecord[],
  independenceLivingAssessments: [] as IndependenceLivingAssessment[],
  independentTravelRecords: [] as IndependentTravelRecord[],
  visitorReports: [] as VisitorReport[],
  infectionRecords: [] as InfectionRecord[],
  readinessItems: [] as ReadinessItem[],
  insurancePolicies: [] as InsurancePolicy[],
  inventoryItems: [] as InventoryItem[],
  iroCorrespondences: [] as IroCorrespondence[],
  holidayRecords: [] as HolidayRecord[],
  complaintTrends: [] as ComplaintTrend[],
  keyRecords: [] as KeyRecord[],
  kitchenHygieneChecks: [] as KitchenHygieneCheck[],
  kpiEntries: [] as KpiEntry[],
  lacReviewPreps: [] as LacReviewPrep[],
  ladoReferrals: [] as LadoReferral[],
  communicationProfiles: [] as CommunicationProfile[],
  leavingCarePackages: [] as LeavingCarePackage[],
  lessonsLearned: [] as LessonLearned[],
  lgbtqInclusionRecords: [] as LgbtqInclusionRecord[],
  lifeStoryEntries: [] as LifeStoryEntry[],
  localityRisks: [
    {
      id: "lr_001", category: "cse" as const, risk_level: "high" as const,
      location: "Town Centre Park", description: "Known meeting point for CSE perpetrators targeting looked after children",
      intelligence: "Police intel — 3 arrests in past 6 months. Known adult males approach YP.",
      mitigations: [
        { measure: "Staff escort policy for under-14s", effectiveness: "effective" as const },
        { measure: "Information shared with all staff", effectiveness: "effective" as const },
        { measure: "Alternative route mapped avoiding park", effectiveness: "partial" as const },
      ],
      last_reviewed: daysFromNow(-14), reviewed_by: "staff_darren",
      next_review: daysFromNow(16), impact_on_yp: "Alex specifically — MACE flagged this location",
      notes: "Monthly police liaison updates received", created_at: daysFromNow(-90) + "T09:00:00Z",
    },
    {
      id: "lr_002", category: "county_lines" as const, risk_level: "high" as const,
      location: "Bus Station", description: "Recruitment point for county lines. Children targeted for drug running.",
      intelligence: "3 NRM referrals from this location in past year. Known drug line 'OX' operates here.",
      mitigations: [
        { measure: "YP awareness training delivered", effectiveness: "effective" as const },
        { measure: "Safe route avoids bus station", effectiveness: "effective" as const },
      ],
      last_reviewed: daysFromNow(-21), reviewed_by: "staff_darren",
      next_review: daysFromNow(9), impact_on_yp: "All children — general awareness. Alex specifically due to missing episodes.",
      notes: "Police PCSO patrols increased", created_at: daysFromNow(-120) + "T10:00:00Z",
    },
    {
      id: "lr_003", category: "gang_activity" as const, risk_level: "medium" as const,
      location: "Riverside Shopping Centre", description: "Gang congregation point — evenings and weekends",
      intelligence: "Low-level ASB and territorial disputes. No direct targeting of LAC identified.",
      mitigations: [
        { measure: "YP informed of risks", effectiveness: "effective" as const },
        { measure: "Staff awareness of group identifiers", effectiveness: "partial" as const },
      ],
      last_reviewed: daysFromNow(-30), reviewed_by: "staff_anna",
      next_review: daysFromNow(0), impact_on_yp: "Jordan uses shopping centre independently — monitored",
      notes: "", created_at: daysFromNow(-180) + "T11:00:00Z",
    },
    {
      id: "lr_004", category: "drug_activity" as const, risk_level: "medium" as const,
      location: "Alley behind Spar (High Street)", description: "Known drug dealing location",
      intelligence: "Cannabis and nitrous oxide dealing. Targets school-age children.",
      mitigations: [
        { measure: "Route avoidance built into care plans", effectiveness: "effective" as const },
      ],
      last_reviewed: daysFromNow(-45), reviewed_by: "staff_darren",
      next_review: daysFromNow(-15), impact_on_yp: "General awareness for all children",
      notes: "Review overdue", created_at: daysFromNow(-200) + "T09:00:00Z",
    },
    {
      id: "lr_005", category: "online_risks" as const, risk_level: "medium" as const,
      location: "Online — Discord gaming servers", description: "Unmoderated gaming communities with adult users",
      intelligence: "Jordan identified as active in servers with unverified age users",
      mitigations: [
        { measure: "Parental controls on home network", effectiveness: "effective" as const },
        { measure: "Weekly device checks", effectiveness: "partial" as const },
      ],
      last_reviewed: daysFromNow(-10), reviewed_by: "staff_anna",
      next_review: daysFromNow(20), impact_on_yp: "Jordan specifically — monitoring in place",
      notes: "", created_at: daysFromNow(-40) + "T14:00:00Z",
    },
    {
      id: "lr_006", category: "road_safety" as const, risk_level: "low" as const,
      location: "A-road crossing near school", description: "Busy road with limited crossing points",
      intelligence: "2 near-misses reported by school in past term",
      mitigations: [
        { measure: "Walking route established using pelican crossing", effectiveness: "effective" as const },
      ],
      last_reviewed: daysFromNow(-60), reviewed_by: "staff_chervelle",
      next_review: daysFromNow(30), impact_on_yp: "Casey walks to school — safe route confirmed",
      notes: "", created_at: daysFromNow(-200) + "T09:00:00Z",
    },
  ] as LocalityRisk[],
  loneWorkingRecords: [] as LoneWorkingRecord[],
  loneWorkingRiskAssessments: [] as LoneWorkingRiskAssessment[],
  maintenanceScheduleItems: [] as MaintenanceScheduleItem[],
  managementWalkrounds: [] as ManagementWalkround[],
  trainingMatrixRows: [] as TrainingMatrixRow[],
  marEntries: [] as MarEntry[],
  matchingReferrals: [] as MatchingReferral[],
  mediaPublicityConsents: [] as MediaPublicityConsent[],
  medicationAuditRecords: [] as MedicationAuditRecord[],
  medicationErrorInvestigations: [] as MedicationErrorInvestigation[],
  medicationNearMisses: [] as MedicationNearMiss[],
  medicationStockChecks: [] as MedicationStockCheck[],
  medicationStorageAudits: [] as MedicationStorageAudit[],
  medTrainingRecords: [] as MedTrainingRecord[],
  memorialOccasionRecords: [] as MemorialOccasionRecord[],
  menstrualHealthPlans: [] as MenstrualHealthPlan[],
  mealPlans: [] as MealPlan[],
  returnInterviews: [] as ReturnInterview[],
  multiAgencyMeetings: [
    {
      id: "mam_001", child_id: "yp_alex", meeting_type: "lac_review" as const,
      meeting_status: "completed" as const, date: daysFromNow(-45), time: "10:00",
      venue: "Virtual — Teams", chaired_by: "S. Williams (IRO)",
      home_representative: "Darren Laville",
      attendees: [
        { name: "Darren Laville", role: "Registered Manager", organisation: "Oak House", attended: true },
        { name: "S. Williams", role: "IRO", organisation: "Local Authority", attended: true },
        { name: "J. Cooper", role: "Social Worker", organisation: "Local Authority", attended: true },
        { name: "Alex", role: "Young Person", organisation: "", attended: true },
        { name: "T. Evans", role: "Virtual School Head", organisation: "Local Authority", attended: true },
      ],
      key_discussion_points: ["Placement stability", "Education progress", "CSE concerns"],
      decisions_reached: ["Placement to continue", "Enhanced safety plan agreed", "PEP to be updated"],
      child_participation: "Alex attended full meeting, contributed views, asked questions",
      action_items: [
        { action: "Update PEP to reflect college aspirations", owner: "T. Evans", due_date: daysFromNow(-30), status: "completed" as const },
        { action: "Arrange CAMHS reassessment", owner: "J. Cooper", due_date: daysFromNow(-15), status: "completed" as const },
        { action: "MACE update to IRO", owner: "Darren Laville", due_date: daysFromNow(-30), status: "completed" as const },
      ],
      next_meeting_date: daysFromNow(45), notes: "Positive review. Alex engaged throughout.",
      created_at: daysFromNow(-45) + "T10:00:00Z",
    },
    {
      id: "mam_002", child_id: "yp_jordan", meeting_type: "lac_review" as const,
      meeting_status: "scheduled" as const, date: daysFromNow(5), time: "14:00",
      venue: "Oak House", chaired_by: "M. Khan (IRO)",
      home_representative: "Darren Laville",
      attendees: [
        { name: "Darren Laville", role: "Registered Manager", organisation: "Oak House", attended: false },
        { name: "M. Khan", role: "IRO", organisation: "Local Authority", attended: false },
        { name: "L. Patel", role: "Social Worker", organisation: "Local Authority", attended: false },
        { name: "Jordan", role: "Young Person", organisation: "", attended: false },
      ],
      key_discussion_points: [], decisions_reached: [],
      child_participation: "", action_items: [],
      next_meeting_date: null, notes: "Home report submitted.",
      created_at: daysFromNow(-10) + "T09:00:00Z",
    },
    {
      id: "mam_003", child_id: "yp_casey", meeting_type: "pep" as const,
      meeting_status: "completed" as const, date: daysFromNow(-20), time: "11:00",
      venue: "School", chaired_by: "Designated Teacher",
      home_representative: "Anna Mitchell",
      attendees: [
        { name: "Anna Mitchell", role: "Key Worker", organisation: "Oak House", attended: true },
        { name: "H. Brooks", role: "Designated Teacher", organisation: "Academy School", attended: true },
        { name: "Casey", role: "Young Person", organisation: "", attended: true },
        { name: "T. Evans", role: "Virtual School Head", organisation: "Local Authority", attended: true },
      ],
      key_discussion_points: ["Attendance improvement", "Maths support", "Friendship group"],
      decisions_reached: ["Additional maths tutor approved via PP+", "Attendance target 95%"],
      child_participation: "Casey completed her views form and contributed to target-setting",
      action_items: [
        { action: "Arrange maths tutor (2x weekly)", owner: "H. Brooks", due_date: daysFromNow(-5), status: "completed" as const },
        { action: "Monitor attendance weekly", owner: "Anna Mitchell", due_date: daysFromNow(60), status: "in_progress" as const },
      ],
      next_meeting_date: daysFromNow(70), notes: "Positive PEP. Casey's attendance has improved significantly.",
      created_at: daysFromNow(-20) + "T11:00:00Z",
    },
    {
      id: "mam_004", child_id: "yp_alex", meeting_type: "strategy" as const,
      meeting_status: "completed" as const, date: daysFromNow(-19), time: "09:00",
      venue: "Virtual — Teams", chaired_by: "J. Cooper (SW)",
      home_representative: "Darren Laville",
      attendees: [
        { name: "Darren Laville", role: "Registered Manager", organisation: "Oak House", attended: true },
        { name: "J. Cooper", role: "Social Worker", organisation: "Local Authority", attended: true },
        { name: "DC Watkins", role: "Police", organisation: "Police", attended: true },
        { name: "MACE Coordinator", role: "MACE", organisation: "Local Authority", attended: true },
      ],
      key_discussion_points: ["CSE risk escalation", "Missing episodes", "Safety plan review"],
      decisions_reached: ["Safety plan strengthened", "Police patrols increased near home", "MACE referral confirmed"],
      child_participation: "Not present — strategy meeting",
      action_items: [
        { action: "Strengthen safety plan — add evening escort", owner: "Darren Laville", due_date: daysFromNow(-17), status: "completed" as const },
        { action: "Share intel on associate 'D'", owner: "DC Watkins", due_date: daysFromNow(-14), status: "completed" as const },
        { action: "Reconvene in 4 weeks", owner: "J. Cooper", due_date: daysFromNow(9), status: "in_progress" as const },
      ],
      next_meeting_date: daysFromNow(9), notes: "Serious concerns discussed. Multi-agency response agreed.",
      created_at: daysFromNow(-19) + "T09:00:00Z",
    },
    {
      id: "mam_005", child_id: "yp_jordan", meeting_type: "professionals" as const,
      meeting_status: "completed" as const, date: daysFromNow(-35), time: "15:00",
      venue: "Oak House", chaired_by: "Darren Laville",
      home_representative: "Darren Laville",
      attendees: [
        { name: "Darren Laville", role: "Registered Manager", organisation: "Oak House", attended: true },
        { name: "L. Patel", role: "Social Worker", organisation: "Local Authority", attended: true },
        { name: "Dr. Singh", role: "CAMHS Therapist", organisation: "NHS", attended: false },
        { name: "Anna Mitchell", role: "Key Worker", organisation: "Oak House", attended: true },
      ],
      key_discussion_points: ["CAMHS engagement", "Emotional wellbeing", "Pathway planning"],
      decisions_reached: ["Alternative CAMHS offer to be explored", "Wellbeing check-ins increased"],
      child_participation: "Jordan's views gathered beforehand via key worker",
      action_items: [
        { action: "Explore art therapy as CAMHS alternative", owner: "L. Patel", due_date: daysFromNow(-20), status: "in_progress" as const },
        { action: "Weekly wellbeing check-ins", owner: "Anna Mitchell", due_date: daysFromNow(25), status: "in_progress" as const },
      ],
      next_meeting_date: daysFromNow(25), notes: "CAMHS therapist did not attend — 3rd cancellation. Escalated.",
      created_at: daysFromNow(-35) + "T15:00:00Z",
    },
    {
      id: "mam_006", child_id: "yp_casey", meeting_type: "lac_review" as const,
      meeting_status: "completed" as const, date: daysFromNow(-60), time: "10:00",
      venue: "Local Authority offices", chaired_by: "M. Khan (IRO)",
      home_representative: "Darren Laville",
      attendees: [
        { name: "Darren Laville", role: "Registered Manager", organisation: "Oak House", attended: true },
        { name: "M. Khan", role: "IRO", organisation: "Local Authority", attended: true },
        { name: "R. Hughes", role: "Social Worker", organisation: "Local Authority", attended: true },
        { name: "Casey", role: "Young Person", organisation: "", attended: true },
      ],
      key_discussion_points: ["Placement progress", "Education", "Family contact"],
      decisions_reached: ["Placement continues", "Family contact to increase to weekly"],
      child_participation: "Casey completed consultation booklet and attended meeting",
      action_items: [
        { action: "Increase family contact to weekly", owner: "R. Hughes", due_date: daysFromNow(-45), status: "completed" as const },
        { action: "Submit home report 3 days before next review", owner: "Darren Laville", due_date: daysFromNow(-3), status: "in_progress" as const },
      ],
      next_meeting_date: daysFromNow(30), notes: "Good progress noted. Casey settling well.",
      created_at: daysFromNow(-60) + "T10:00:00Z",
    },
  ] as MultiAgencyMeeting[],
  multiDisciplinaryFormulations: [] as MultiDisciplinaryFormulation[],
  culturalVisits: [] as CulturalVisit[],
  nightChecks: [] as NightCheck[],
  nightStaffGuidanceSections: [] as NightStaffGuidanceSection[],
  nightStaffHandovers: [] as NightStaffHandover[],
  nightAnxietySupportRecords: [] as NightAnxietySupportRecord[],
  notificationLogEntries: [
    {
      id: "notif_001", date: daysFromNow(-18), notified_to: "Ofsted",
      method: "Online notification form", notification_type: "Serious incident",
      regulation: "Reg 40(4)(a)", event_summary: "Child A missing from care for 6+ hours — police notified",
      sent_by: "staff_darren", within_timeframe: true, required_timeframe: "Within 24 hours",
      actual_timeframe: "Within 4 hours", acknowledgement_received: true,
      linked_event: "missing_001", notes: "Alex returned safely. Debrief completed.",
      created_at: daysFromNow(-18) + "T22:00:00Z",
    },
    {
      id: "notif_002", date: daysFromNow(-52), notified_to: "Ofsted",
      method: "Online notification form", notification_type: "Allegation against staff",
      regulation: "Reg 40(4)(d)", event_summary: "Allegation of sleeping on duty — agency staff suspended",
      sent_by: "staff_darren", within_timeframe: true, required_timeframe: "Within 24 hours",
      actual_timeframe: "Within 12 hours", acknowledgement_received: true,
      linked_event: "disc_002", notes: "LADO also notified. Investigation concluded — dismissed.",
      created_at: daysFromNow(-52) + "T08:00:00Z",
    },
    {
      id: "notif_003", date: daysFromNow(-5), notified_to: "Ofsted",
      method: "Online notification form", notification_type: "Serious incident",
      regulation: "Reg 40(4)(a)", event_summary: "Physical intervention — TCI hold lasting 8 minutes",
      sent_by: "staff_darren", within_timeframe: true, required_timeframe: "Within 24 hours",
      actual_timeframe: "Within 6 hours", acknowledgement_received: true,
      linked_event: "incident_001", notes: "Debrief completed with child and staff. No injuries.",
      created_at: daysFromNow(-5) + "T19:00:00Z",
    },
    {
      id: "notif_004", date: daysFromNow(-30), notified_to: "Local Authority (Placing)",
      method: "Email", notification_type: "Significant event",
      regulation: "Reg 40(5)", event_summary: "School exclusion — fixed term 3 days",
      sent_by: "staff_darren", within_timeframe: true, required_timeframe: "Without delay",
      actual_timeframe: "Same day", acknowledgement_received: true,
      linked_event: "edu_001", notes: "SW informed. PEP review brought forward.",
      created_at: daysFromNow(-30) + "T16:00:00Z",
    },
    {
      id: "notif_005", date: daysFromNow(-70), notified_to: "Ofsted",
      method: "Online notification form", notification_type: "Child death or serious harm",
      regulation: "Reg 40(4)(a)", event_summary: "Child B A&E attendance — self-harm requiring stitches",
      sent_by: "staff_darren", within_timeframe: true, required_timeframe: "Within 24 hours",
      actual_timeframe: "Within 3 hours", acknowledgement_received: true,
      linked_event: "incident_002", notes: "CAMHS crisis team involved. Safety plan updated.",
      created_at: daysFromNow(-70) + "T23:00:00Z",
    },
  ] as NotificationLogEntry[],
  occupationalTherapyRecords: [] as OccupationalTherapyRecord[],
  ofstedActionItems: [] as OfstedActionItem[],
  ofstedEngagementRecords: [] as OfstedEngagementRecord[],
  selfEvaluationAreas: [
    {
      id: "se_001", area: "overall_experiences",
      self_grade: "good" as const,
      strengths: [
        "Children are making measurable progress in education — attendance improved from 72% to 91%",
        "Key working is excellent — detailed, reflective, with the child's voice central to all records",
        "Children report feeling happy, safe, and heard through regular consultation",
        "Placement stability is strong — no unplanned moves in 18 months",
        "Life story work is embedded and therapeutically informed",
        "Cultural identity is celebrated through diverse activities and community engagement",
        "Health outcomes improved — all health assessments up to date",
        "Pathway planning for older children is proactive with independence skills on track",
        "Enrichment activities are varied and child-led — photography, cooking, sports clubs",
        "Family contact is well-supported with flexible arrangements responsive to children's wishes",
        "Friendships are encouraged through sleepovers, social activities, and peer support",
        "Children participate in house meetings and influence decisions about their care",
      ],
      evidence: [
        "PEP records showing attendance improvement trajectory",
        "Key working session logs with child voice extracts",
        "Children's consultation feedback forms (quarterly)",
        "Placement stability data — Cornerstone dashboard",
        "Life story books (sample pages on file)",
        "Health assessment tracker",
        "Pathway plan reviews",
        "Activity logs and photo evidence",
        "Family contact records",
        "House meeting minutes",
      ],
      areas_for_development: [
        "Night staff recording quality needs strengthening — some entries too brief",
        "More consistent use of mood capture at evening check-ins",
        "Sleep log completion has gaps — 3 missed entries in past month",
        "Outdoor activity provision limited in winter months",
      ],
      actions: [
        { action: "Night shift recording training for all staff", owner: "Darren Laville", target_date: daysFromNow(-10), status: "completed" },
        { action: "Implement mood capture prompt in daily log template", owner: "Anna Mitchell", target_date: daysFromNow(10), status: "in_progress" },
        { action: "Add sleep log verification to night shift checklist", owner: "Darren Laville", target_date: daysFromNow(-5), status: "completed" },
        { action: "Winter activity programme — indoor alternatives and community venues", owner: "Chervelle Grant", target_date: daysFromNow(20), status: "in_progress" },
      ],
      created_at: daysFromNow(-90) + "T09:00:00Z",
    },
    {
      id: "se_002", area: "helped_and_protected",
      self_grade: "good" as const,
      strengths: [
        "Safeguarding procedures are robust — all staff trained to Level 3",
        "Risk assessments are comprehensive, reviewed regularly, and inform daily practice",
        "Physical interventions are rare, proportionate, and thoroughly debriefed",
        "Missing from care protocol is clear — all episodes reported within timescales",
        "MACE engagement is strong — home proactively shares intelligence",
        "Exploitation screening is up to date for all children with clear safety plans",
        "Online safety is well-managed with age-appropriate monitoring",
        "DoL restrictions are proportionate, reviewed, and children's views recorded",
        "Multi-agency working is effective — strong relationships with SW, police, CAMHS",
        "Whistleblowing culture is embedded — staff feel confident to raise concerns",
      ],
      evidence: [
        "Training records showing Level 3 safeguarding completion",
        "Risk assessment examples with review dates",
        "Physical intervention log and debrief records",
        "Missing from care log and return interview records",
        "MACE referral documentation",
        "Exploitation screening records",
        "Internet monitoring and online safety records",
        "DoL restriction register with review history",
        "Multi-agency meeting minutes",
        "Whistleblowing policy and case records",
      ],
      areas_for_development: [
        "Child voice in restriction reviews — consultation rate is 83% (target 100%)",
        "CAMHS engagement for one child is inconsistent — 3 cancelled appointments",
        "Some locality risk reviews are overdue — 1 review due date passed",
        "Return interview quality could be strengthened — more reflective depth needed",
        "Need to improve evidence of impact for exploitation safety plans",
      ],
      actions: [
        { action: "Implement child consultation checklist for all restriction reviews", owner: "Darren Laville", target_date: daysFromNow(5), status: "in_progress" },
        { action: "Escalate CAMHS non-attendance to team manager", owner: "Anna Mitchell", target_date: daysFromNow(-15), status: "completed" },
        { action: "Complete overdue locality risk reviews", owner: "Darren Laville", target_date: daysFromNow(3), status: "in_progress" },
        { action: "Return interview training session for all staff", owner: "Darren Laville", target_date: daysFromNow(14), status: "open" },
        { action: "Create safety plan impact evidence template", owner: "Chervelle Grant", target_date: daysFromNow(-20), status: "completed" },
      ],
      created_at: daysFromNow(-90) + "T09:00:00Z",
    },
    {
      id: "se_003", area: "leadership_and_management",
      self_grade: "good" as const,
      strengths: [
        "Registered Manager is experienced, qualified (Level 5), and completing Level 7",
        "Staff supervision is regular and reflective — 6-weekly cycle maintained",
        "Training matrix is comprehensive — 95% compliance with mandatory training",
        "Reg 44 visits are monthly with recommendations actioned promptly",
        "Reg 45 quality of care review completed with clear development plan",
        "Staff morale is positive — team stability with low turnover",
        "Governance is effective — responsible individual engaged and involved",
        "Complaints are handled transparently with learning shared across team",
        "Cornerstone platform provides data-driven management oversight",
      ],
      evidence: [
        "Manager qualification certificates",
        "Supervision records showing 6-weekly completion",
        "Training matrix with compliance percentages",
        "Reg 44 visit reports and recommendation tracker",
        "Reg 45 quality of care review document",
        "Staff survey results",
        "RI governance meeting minutes",
        "Complaints log and outcomes",
        "Cornerstone dashboard exports",
      ],
      areas_for_development: [
        "Deputy manager development — formal qualification pathway not yet in place",
        "Peer observation programme to be strengthened — only 2 observations completed this quarter",
        "Need to improve timeliness of Ofsted notifications — 1 was close to 24-hour deadline",
        "Staff reflective practice journals are inconsistent — some staff not engaging",
        "Appraisal completion rate needs improvement — 1 overdue",
      ],
      actions: [
        { action: "Enrol deputy on Level 5 leadership programme", owner: "Darren Laville", target_date: daysFromNow(30), status: "in_progress" },
        { action: "Schedule monthly peer observations into rota", owner: "Darren Laville", target_date: daysFromNow(7), status: "in_progress" },
        { action: "Review notification process — add manager alert system", owner: "Darren Laville", target_date: daysFromNow(-10), status: "completed" },
        { action: "Reflective practice sessions added to team meetings", owner: "Anna Mitchell", target_date: daysFromNow(14), status: "open" },
        { action: "Complete overdue staff appraisal", owner: "Darren Laville", target_date: daysFromNow(-90), status: "completed" },
      ],
      created_at: daysFromNow(-90) + "T09:00:00Z",
    },
  ] as SelfEvaluationArea[],
  inspectionHistory: [
    {
      id: "insp_001",
      home_id: "home_oak",
      inspection_date: "2025-10-15",
      inspection_type: "Full inspection",
      grade: "Good",
      inspector_name: "Jane Whitfield",
      report_reference: "REP-2025-10-OAK",
      report_url: null,
      actions_required: 2,
      actions_completed: 2,
      summary: "Overall the home provides good care and outcomes for children. Leadership and management are effective.",
      published_at: "2025-11-01",
      created_at: "2025-10-15T09:00:00Z",
      updated_at: "2025-11-01T09:00:00Z",
    },
    {
      id: "insp_002",
      home_id: "home_oak",
      inspection_date: "2024-04-22",
      inspection_type: "Full inspection",
      grade: "Good",
      inspector_name: "Mark Tanner",
      report_reference: "REP-2024-04-OAK",
      report_url: null,
      actions_required: 1,
      actions_completed: 1,
      summary: "The home continues to provide a good standard of care. Relationships between staff and children are warm and supportive.",
      published_at: "2024-05-10",
      created_at: "2024-04-22T09:00:00Z",
      updated_at: "2024-05-10T09:00:00Z",
    },
    {
      id: "insp_003",
      home_id: "home_oak",
      inspection_date: "2023-11-08",
      inspection_type: "Short notice",
      grade: "Requires improvement",
      inspector_name: "Susan Blake",
      report_reference: "REP-2023-11-OAK",
      report_url: null,
      actions_required: 5,
      actions_completed: 5,
      summary: "Some aspects of care require improvement. Record keeping and supervision arrangements need strengthening.",
      published_at: "2023-11-30",
      created_at: "2023-11-08T09:00:00Z",
      updated_at: "2023-11-30T09:00:00Z",
    },
  ] as InspectionRecord[],
  onCallShifts: [] as OnCallShift[],
  onlineGamingRecords: [] as OnlineGamingRecord[],
  onlineSafetyIncidents: [] as OnlineSafetyIncident[],
  onlineSafetyAgreements: [] as OnlineSafetyAgreement[],
  operationalMeetings: [] as OperationalMeeting[],
  opticiansRecords: [] as OpticiansRecord[],
  outcomeStarAssessments: [] as OutcomeStarAssessment[],
  outcomeMetrics: [] as OutcomeMetric[],
  outdoorActivityRiskAssessments: [] as OutdoorActivityRiskAssessment[],
  parentPartnershipRecords: [] as ParentPartnershipRecord[],
  parentalResponsibilityRecords: [] as ParentalResponsibilityRecord[],
  pathwayPlans: [
    {
      id: "pp_001", child_id: "yp_alex", child_initials: "AW", age: 17,
      status: "active_16_18" as const, plan_version: "3.0",
      last_review_date: daysFromNow(-30), personal_advisor: "Jane Smith",
      social_worker: "Sarah Williams", accommodation: "Supported lodgings identified — move planned for August 2026",
      education_employment_training: "Apprenticeship in IT support starting September 2026",
      health_needs: ["GP registered", "Dental check booked", "Mental health support via CAMHS"],
      financial_support: ["Setting Up Home Allowance confirmed", "Bursary for apprenticeship"],
      support_network: ["Personal advisor", "Key worker (Darren)", "CAMHS worker", "College tutor", "CiCC peer mentor"],
      aspirations: ["Complete apprenticeship", "Live independently", "Learn to drive"],
      risks: ["Anxiety around transitions", "Limited family support"],
      independent_living_skills: { cooking: "developing" as const, budgeting: "established" as const, laundry: "established" as const, travel: "established" as const, health: "developing" as const, communication: "established" as const, job_skills: "developing" as const },
      next_review_date: daysFromNow(60), contact_arrangements: "Fortnightly with PA, monthly with SW",
      statutory_16plus_review_schedule: "6-monthly", created_at: daysFromNow(-180),
    },
    {
      id: "pp_002", child_id: "yp_jordan", child_initials: "JH", age: 17,
      status: "active_16_18" as const, plan_version: "2.0",
      last_review_date: daysFromNow(-95), personal_advisor: "Mark Jones",
      social_worker: "Sarah Williams", accommodation: "Exploring semi-independent options — not yet confirmed",
      education_employment_training: "Currently disengaged from education — exploring construction apprenticeship",
      health_needs: ["GP registered", "Sleep issues discussed with GP"],
      financial_support: ["Standard leaving care grant eligible"],
      support_network: ["Personal advisor", "Key worker (Anna)"],
      aspirations: ["Get a job", "Own flat", "Reconnect with older brother"],
      risks: ["Peer influence", "Disengagement from education", "Limited financial literacy"],
      independent_living_skills: { cooking: "emerging" as const, budgeting: "emerging" as const, laundry: "developing" as const, travel: "established" as const, health: "emerging" as const, communication: "developing" as const, job_skills: "not_yet" as const },
      next_review_date: daysFromNow(-5), contact_arrangements: "Monthly with PA, 6-weekly with SW",
      statutory_16plus_review_schedule: "6-monthly", created_at: daysFromNow(-270),
    },
    {
      id: "pp_003", child_id: "yp_casey", child_initials: "CM", age: 15,
      status: "pre_pathway_15plus" as const, plan_version: "1.0",
      last_review_date: daysFromNow(-60), personal_advisor: "",
      social_worker: "Sarah Williams", accommodation: "",
      education_employment_training: "Full-time education Year 11",
      health_needs: ["Emotional wellbeing support"],
      financial_support: [],
      support_network: ["Key worker (Chervelle)", "School pastoral lead"],
      aspirations: ["Art college", "Own creative studio"],
      risks: ["Identity exploration", "Emotional regulation"],
      independent_living_skills: { cooking: "emerging" as const, budgeting: "not_yet" as const, laundry: "emerging" as const, travel: "developing" as const, health: "emerging" as const, communication: "developing" as const, job_skills: "not_yet" as const },
      next_review_date: daysFromNow(120), contact_arrangements: "Monthly with SW",
      statutory_16plus_review_schedule: "To commence at 16", created_at: daysFromNow(-90),
    },
  ] as PathwayPlan[],
  peerDynamics: [] as PeerDynamic[],
  peerGroupDynamics: [] as PeerGroupDynamic[],
  pepRecords: [] as PepRecord[],
  belongingsRecords: [
    {
      id: "bel_001", child_id: "yp_alex", admission_date: "2024-09-01",
      admission_inventory_complete: true, admission_checked_by: "staff_darren",
      admission_witnessed_by: "staff_anna", last_audit_date: daysFromNow(-30),
      last_audit_by: "staff_darren", next_audit_due: daysFromNow(60),
      notes: "Alex keeps belongings well-organised. All items accounted for at last audit.",
      created_at: "2024-09-01",
      items: [
        { id: "item_a1", description: "iPhone 14", category: "electronics" as const, condition: "good" as const, status: "in_possession" as const, date_logged: "2024-09-01", logged_by: "staff_darren", estimated_value: 450, photo_on_file: true, storage_location: "bedroom", notes: "" },
        { id: "item_a2", description: "MacBook Air (school)", category: "electronics" as const, condition: "good" as const, status: "in_possession" as const, date_logged: "2024-09-01", logged_by: "staff_darren", estimated_value: 800, photo_on_file: true, storage_location: "bedroom", notes: "School-issued, registered" },
        { id: "item_a3", description: "Sony WH-1000XM5 Headphones", category: "electronics" as const, condition: "good" as const, status: "lost" as const, date_logged: "2024-09-01", logged_by: "staff_darren", estimated_value: 280, photo_on_file: true, storage_location: "", notes: "Reported missing 2 weeks ago, search ongoing" },
        { id: "item_a4", description: "Leather wallet", category: "other" as const, condition: "fair" as const, status: "in_possession" as const, date_logged: "2024-09-01", logged_by: "staff_darren", estimated_value: 40, photo_on_file: true, storage_location: "bedroom", notes: "" },
        { id: "item_a5", description: "North Face jacket", category: "clothing" as const, condition: "good" as const, status: "in_possession" as const, date_logged: "2024-09-01", logged_by: "staff_darren", estimated_value: 180, photo_on_file: true, storage_location: "wardrobe", notes: "" },
        { id: "item_a6", description: "Family photo album", category: "sentimental" as const, condition: "good" as const, status: "in_storage" as const, date_logged: "2024-09-01", logged_by: "staff_darren", estimated_value: 0, photo_on_file: true, storage_location: "safe", notes: "Stored in office safe at Alex's request" },
      ],
    },
    {
      id: "bel_002", child_id: "yp_jordan", admission_date: "2024-11-15",
      admission_inventory_complete: true, admission_checked_by: "staff_anna",
      admission_witnessed_by: "staff_ryan", last_audit_date: daysFromNow(-45),
      last_audit_by: "staff_anna", next_audit_due: daysFromNow(45),
      notes: "Jordan has high-value items. Audit identified damaged backpack and missing watch.",
      created_at: "2024-11-15",
      items: [
        { id: "item_j1", description: "PlayStation 5 console", category: "electronics" as const, condition: "good" as const, status: "in_possession" as const, date_logged: "2024-11-15", logged_by: "staff_anna", estimated_value: 400, photo_on_file: true, storage_location: "bedroom", notes: "" },
        { id: "item_j2", description: "Nike Air Max trainers", category: "clothing" as const, condition: "good" as const, status: "in_possession" as const, date_logged: "2024-11-15", logged_by: "staff_anna", estimated_value: 150, photo_on_file: true, storage_location: "bedroom", notes: "" },
        { id: "item_j3", description: "Adidas backpack", category: "other" as const, condition: "damaged" as const, status: "in_possession" as const, date_logged: "2024-11-15", logged_by: "staff_anna", estimated_value: 60, photo_on_file: false, storage_location: "bedroom", notes: "Zip broken, needs replacement" },
        { id: "item_j4", description: "Casio G-Shock watch", category: "jewellery" as const, condition: "good" as const, status: "lost" as const, date_logged: "2024-11-15", logged_by: "staff_anna", estimated_value: 90, photo_on_file: false, storage_location: "", notes: "Missing since activities trip. Reported to staff." },
        { id: "item_j5", description: "Mountain bike", category: "sports_equipment" as const, condition: "good" as const, status: "in_possession" as const, date_logged: "2024-11-15", logged_by: "staff_anna", estimated_value: 350, photo_on_file: false, storage_location: "shed", notes: "" },
      ],
    },
    {
      id: "bel_003", child_id: "yp_casey", admission_date: "2025-01-10",
      admission_inventory_complete: true, admission_checked_by: "staff_chervelle",
      admission_witnessed_by: "staff_darren", last_audit_date: daysFromNow(-20),
      last_audit_by: "staff_chervelle", next_audit_due: daysFromNow(70),
      notes: "Casey's belongings are mostly sentimental or creative items. All well cared for.",
      created_at: "2025-01-10",
      items: [
        { id: "item_c1", description: "Art supplies set (paints, brushes, sketchbook)", category: "other" as const, condition: "good" as const, status: "in_possession" as const, date_logged: "2025-01-10", logged_by: "staff_chervelle", estimated_value: 85, photo_on_file: true, storage_location: "bedroom", notes: "" },
        { id: "item_c2", description: "Personal journal", category: "sentimental" as const, condition: "good" as const, status: "in_possession" as const, date_logged: "2025-01-10", logged_by: "staff_chervelle", estimated_value: 0, photo_on_file: true, storage_location: "bedroom", notes: "Private — staff do not read" },
        { id: "item_c3", description: "Silver necklace (from grandmother)", category: "jewellery" as const, condition: "good" as const, status: "in_storage" as const, date_logged: "2025-01-10", logged_by: "staff_chervelle", estimated_value: 120, photo_on_file: true, storage_location: "safe", notes: "In safe for safekeeping at Casey's request" },
        { id: "item_c4", description: "JBL portable speaker", category: "electronics" as const, condition: "good" as const, status: "in_possession" as const, date_logged: "2025-01-10", logged_by: "staff_chervelle", estimated_value: 75, photo_on_file: true, storage_location: "bedroom", notes: "" },
      ],
    },
  ] as BelongingsRecord[],
  personalPassports: [] as PersonalPassport[],
  pettyCashEntries: [] as PettyCashEntry[],
  photoAlbumRecords: [] as PhotoAlbumRecord[],
  photoConsentRecords: [] as PhotoConsentRecord[],
  physicalActivityEntries: [] as PhysicalActivityEntry[],
  placementAnniversaryEntries: [] as PlacementAnniversaryEntry[],
  placementBudgetTrackers: [] as PlacementBudgetTracker[],
  cohortAnalyses: [] as CohortAnalysis[],
  disruptionPreventionPlans: [] as DisruptionPreventionPlan[],
  placementEndSummaries: [] as PlacementEndSummary[],
  placementImpactAssessments: [] as PlacementImpactAssessment[],
  placementMeetings: [] as PlacementMeeting[],
  placementObjectives: [] as PlacementObjective[],
  placementStabilityRecords: [] as PlacementStabilityRecord[],
  placementStabilityMeetings: [] as PlacementStabilityMeeting[],
  successFactors: [] as SuccessFactor[],
  pocketMoneyTransactions: [] as PocketMoneyTransaction[],
  pocketMoneyAccounts: [] as PocketMoneyAccount[],
  homePolicies: [] as HomePolicy[],
  policyImpactAnalyses: [] as PolicyImpactAnalysis[],
  policyReviewRecords: [] as PolicyReviewRecord[],
  childrensRights: [] as ChildrensRightEntry[],
  localOfferSections: [] as LocalOfferSection[],
  locationAssessmentAreas: [] as LocationAssessmentArea[],
  alertNotifications: [] as AlertNotification[],
  positiveAchievements: [] as PositiveAchievement[],
  postIncidentChildDebriefs: [] as PostIncidentChildDebrief[],
  preAdmissionChecklists: [] as PreAdmissionChecklist[],
  preventRecords: [] as PreventRecord[],
  professionalConsultations: [] as ProfessionalConsultation[],
  curiosityLogEntries: [] as CuriosityLogEntry[],
  cpdRecords: [] as CPDRecord[],
  professionalFeeRecords: [] as ProfessionalFeeRecord[],
  professionalMeetingAttendances: [] as ProfessionalMeetingAttendance[],
  professionalNetworkContacts: [
    { id: "pnc_001", child_id: "yp_alex", role: "social_worker", name: "J. Cooper", organisation: "Local Authority", phone: "01onal", email: "j.cooper@la.gov.uk", last_contact: daysFromNow(-3), contact_frequency: "fortnightly" as const, key_responsibilities: ["Care plan", "Reviews", "Safeguarding"], notes: "", is_active: true },
    { id: "pnc_002", child_id: "yp_alex", role: "iro", name: "S. Williams", organisation: "Local Authority", phone: "01onal", email: "s.williams@la.gov.uk", last_contact: daysFromNow(-45), contact_frequency: "quarterly" as const, key_responsibilities: ["LAC reviews", "Care plan oversight"], notes: "", is_active: true },
    { id: "pnc_003", child_id: "yp_alex", role: "camhs", name: "Dr. Patel", organisation: "NHS CAMHS", phone: "01onal", email: "d.patel@nhs.uk", last_contact: daysFromNow(-10), contact_frequency: "monthly" as const, key_responsibilities: ["Therapeutic support", "Mental health"], notes: "", is_active: true },
    { id: "pnc_004", child_id: "yp_alex", role: "education", name: "T. Evans", organisation: "Virtual School", phone: "01onal", email: "t.evans@la.gov.uk", last_contact: daysFromNow(-20), contact_frequency: "termly" as const, key_responsibilities: ["PEP", "Education progress"], notes: "", is_active: true },
    { id: "pnc_005", child_id: "yp_alex", role: "police", name: "DC Watkins", organisation: "Police", phone: "01onal", email: "dc.watkins@police.uk", last_contact: daysFromNow(-12), contact_frequency: "monthly" as const, key_responsibilities: ["CSE investigation", "Safety planning"], notes: "Active investigation", is_active: true },
    { id: "pnc_006", child_id: "yp_jordan", role: "social_worker", name: "L. Patel", organisation: "Local Authority", phone: "01onal", email: "l.patel@la.gov.uk", last_contact: daysFromNow(-7), contact_frequency: "fortnightly" as const, key_responsibilities: ["Care plan", "Pathway planning"], notes: "", is_active: true },
    { id: "pnc_007", child_id: "yp_jordan", role: "iro", name: "M. Khan", organisation: "Local Authority", phone: "01onal", email: "m.khan@la.gov.uk", last_contact: daysFromNow(-60), contact_frequency: "quarterly" as const, key_responsibilities: ["LAC reviews"], notes: "", is_active: true },
    { id: "pnc_008", child_id: "yp_jordan", role: "camhs", name: "Dr. Singh", organisation: "NHS CAMHS", phone: "01onal", email: "d.singh@nhs.uk", last_contact: daysFromNow(-40), contact_frequency: "monthly" as const, key_responsibilities: ["Emotional wellbeing"], notes: "3 cancelled appointments — escalated", is_active: true },
    { id: "pnc_009", child_id: "yp_jordan", role: "yot", name: "K. Brown", organisation: "Youth Offending Team", phone: "01onal", email: "k.brown@yot.gov.uk", last_contact: daysFromNow(-50), contact_frequency: "monthly" as const, key_responsibilities: ["Offending behaviour work"], notes: "Contact overdue", is_active: true },
    { id: "pnc_010", child_id: "yp_casey", role: "social_worker", name: "R. Hughes", organisation: "Local Authority", phone: "01onal", email: "r.hughes@la.gov.uk", last_contact: daysFromNow(-5), contact_frequency: "fortnightly" as const, key_responsibilities: ["Care plan", "Family contact"], notes: "", is_active: true },
    { id: "pnc_011", child_id: "yp_casey", role: "iro", name: "M. Khan", organisation: "Local Authority", phone: "01onal", email: "m.khan@la.gov.uk", last_contact: daysFromNow(-60), contact_frequency: "quarterly" as const, key_responsibilities: ["LAC reviews"], notes: "", is_active: true },
    { id: "pnc_012", child_id: "yp_casey", role: "education", name: "H. Brooks", organisation: "Academy School", phone: "01onal", email: "h.brooks@school.uk", last_contact: daysFromNow(-20), contact_frequency: "termly" as const, key_responsibilities: ["Designated teacher", "PEP"], notes: "", is_active: true },
  ] as ProfessionalNetworkContact[],
  propertyDamageRecords: [] as PropertyDamageRecord[],
  qaAuditRecords: [] as QAAuditRecord[],
  qualityOfCareReviews: [
    {
      id: "qoc_001", date: daysFromNow(-120), type: "annual" as const, lead_reviewer: "Darren Laville",
      overall_rating: "good" as const,
      domains: [
        { domain: "safety" as const, rating: "good" as const, evidence: "Safeguarding procedures robust", trend: "stable" as const },
        { domain: "wellbeing" as const, rating: "good" as const, evidence: "Children report feeling happy", trend: "improving" as const },
        { domain: "education" as const, rating: "good" as const, evidence: "Attendance improved across all children", trend: "improving" as const },
      ],
      strengths: ["Strong therapeutic approach", "Excellent key working records", "Children's voice central to planning"],
      areas_for_improvement: ["Night staff recording quality", "Supervision timeliness"],
      children_feedback: "All three children contributed views. Overall positive about care.",
      staff_feedback: "Staff feel supported. Some concern about workload during short-staffing.",
      actions: [
        { action: "Night shift recording training", owner: "Darren Laville", due_date: daysFromNow(-90), status: "completed" as const, priority: "medium" as const },
        { action: "Supervision calendar review", owner: "Darren Laville", due_date: daysFromNow(-100), status: "completed" as const, priority: "high" as const },
      ],
      next_review_date: daysFromNow(60), notes: "Shared with RI and Ofsted as part of Reg 45 evidence.",
    },
  ] as QualityOfCareReview[],
  reg46Reviews: [] as Reg46Review[],
  referralTrackerRecords: [] as ReferralTrackerRecord[],
  reg22Records: [] as Reg22Record[],
  reg35Notifications: [] as Reg35Notification[],
  reg40StaffEntries: [] as Reg40StaffEntry[],
  reg44ActionRecords: [] as Reg44ActionRecord[],
  registrationChangeRecords: [] as RegistrationChangeRecord[],
  regulatoryCorrespondenceLetters: [] as RegulatoryCorrespondenceLetter[],
  religiousFestivalRecords: [] as ReligiousFestivalRecord[],
  religiousObservanceRecords: [] as ReligiousObservanceRecord[],
  restrictionsLogRecords: [] as RestrictionsLogRecord[],
  riskAppetiteDomains: [] as RiskAppetiteDomain[],
  strategicRiskRecords: [] as StrategicRiskRecord[],
  riskManagementPlanRecords: [] as RiskManagementPlanRecord[],
  riskRegisterEntries: [] as RiskRegisterEntry[],
  roomAllocationRecords: [] as RoomAllocationRecord[],
  roomSearchRecords: [] as RoomSearchRecord[],
  rseTrackerRecords: [] as RseTrackerRecord[],
  safeTouchProtocolRecords: [] as SafeTouchProtocolRecord[],
  safeguardingSupervisionRecords: [] as SafeguardingSupervisionRecord[],
  saferRecruitmentRecords: [] as SaferRecruitmentRecord[],
  secureStorageRecords: [] as SecureStorageRecord[],
  selfHarmSafetyPlanRecords: [] as SelfHarmSafetyPlanRecord[],
  sensoryEquipmentRecords: [] as SensoryEquipmentRecord[],
  sensoryProfileRecords: [] as SensoryProfileRecord[],
  sensoryRoomUsageRecords: [] as SensoryRoomUsageRecord[],
  seriousIncidentReviewRecords: [] as SeriousIncidentReviewRecord[],
  serviceImprovementRecords: [] as ServiceImprovementRecord[],
  serviceUserAgreementRecords: [] as ServiceUserAgreementRecord[],
  shiftNoteRecords: [] as ShiftNoteRecord[],
  siblingContactProtocolRecords: [] as SiblingContactProtocolRecord[],
  sleepAssessmentRecords: [] as SleepAssessmentRecord[],
  sleepInRecords: [] as SleepInRecord[],
  socialWorkerContactRecords: [] as SocialWorkerContactRecord[],
  staffCommunicationPreferenceRecords: [] as StaffCommunicationPreferenceRecord[],
  staffCompetencyRecords: [] as StaffCompetencyRecord[],
  staffDebriefRecords: [] as StaffDebriefRecord[],
  staffDisciplinaryRecords: [
    {
      id: "disc_001", staff_member: "staff_edward", date_raised: daysFromNow(-57),
      category: "misconduct" as const, severity: "serious" as const, stage: "no_case" as const,
      allegation: "Inappropriate language used in front of young person during handover",
      investigator: "staff_darren", investigation_start_date: daysFromNow(-55),
      investigation_end_date: daysFromNow(-45), suspended: false, suspension_date: null,
      suspension_review_dates: [], hearing_date: null, hearing_panel: [],
      outcome: "Verbal warning issued. Staff member acknowledged and apologised.",
      sanction_expiry_date: daysFromNow(308), appeal_lodged: false, appeal_date: null, appeal_outcome: "",
      timeline: [
        { date: daysFromNow(-57), action: "Concern raised by colleague", by: "staff_anna" },
        { date: daysFromNow(-55), action: "Investigation commenced", by: "staff_darren" },
        { date: daysFromNow(-50), action: "Statements gathered", by: "staff_darren" },
        { date: daysFromNow(-45), action: "Outcome — verbal warning issued", by: "staff_darren" },
      ],
      support_offered: ["Reflective supervision session", "Communication skills refresher"],
      lado_notified: false, dbs_referral: false, ofsted_notified: false,
      confidentiality_level: "standard" as const, trade_union_rep: null,
      lessons_learned: "Reminder issued to all staff about professional language in front of YP",
      notes: "Edward was receptive and reflective. No repeat incidents.",
    },
    {
      id: "disc_002", staff_member: "staff_agency_01", date_raised: daysFromNow(-160),
      category: "gross_misconduct" as const, severity: "gross" as const, stage: "dismissed" as const,
      allegation: "Sleeping during waking night duty — confirmed by CCTV review",
      investigator: "staff_darren", investigation_start_date: daysFromNow(-159),
      investigation_end_date: daysFromNow(-152), suspended: true, suspension_date: daysFromNow(-159),
      suspension_review_dates: [daysFromNow(-156)], hearing_date: daysFromNow(-153),
      hearing_panel: ["staff_darren", "external_hr"],
      outcome: "Dismissed. Agency worker removed from approved list. LADO informed.",
      sanction_expiry_date: null, appeal_lodged: false, appeal_date: null, appeal_outcome: "",
      timeline: [
        { date: daysFromNow(-160), action: "Concern raised via whistleblowing", by: "staff_chervelle" },
        { date: daysFromNow(-159), action: "CCTV reviewed — confirmed sleeping on duty", by: "staff_darren" },
        { date: daysFromNow(-159), action: "Immediate suspension from duties", by: "staff_darren" },
        { date: daysFromNow(-158), action: "LADO referral made", by: "staff_darren" },
        { date: daysFromNow(-153), action: "Hearing held — dismissed for gross misconduct", by: "staff_darren" },
        { date: daysFromNow(-152), action: "Agency formally notified", by: "staff_darren" },
      ],
      support_offered: [],
      lado_notified: true, dbs_referral: false, ofsted_notified: true,
      confidentiality_level: "restricted" as const, trade_union_rep: null,
      lessons_learned: "Enhanced induction for agency staff. CCTV spot-checks added to audit schedule.",
      notes: "Agency worker — no longer on approved list.",
    },
    {
      id: "disc_003", staff_member: "staff_ryan", date_raised: daysFromNow(-35),
      category: "attendance" as const, severity: "minor" as const, stage: "no_case" as const,
      allegation: "Pattern of lateness — 4 late arrivals in 3 weeks",
      investigator: "staff_darren", investigation_start_date: daysFromNow(-34),
      investigation_end_date: daysFromNow(-30), suspended: false, suspension_date: null,
      suspension_review_dates: [], hearing_date: null, hearing_panel: [],
      outcome: "Management advice issued. Personal circumstances identified and supported.",
      sanction_expiry_date: null, appeal_lodged: false, appeal_date: null, appeal_outcome: "",
      timeline: [
        { date: daysFromNow(-35), action: "Pattern of lateness identified through rota records", by: "staff_darren" },
        { date: daysFromNow(-34), action: "Informal meeting with staff member", by: "staff_darren" },
        { date: daysFromNow(-30), action: "Management advice — personal circumstances identified, flexible start agreed temporarily", by: "staff_darren" },
      ],
      support_offered: ["Flexible start time (temporary)", "Wellbeing check-in"],
      lado_notified: false, dbs_referral: false, ofsted_notified: false,
      confidentiality_level: "standard" as const, trade_union_rep: null,
      lessons_learned: "", notes: "Resolved informally. Ryan's attendance has since improved.",
    },
    {
      id: "disc_004", staff_member: "staff_edward", date_raised: daysFromNow(-14),
      category: "policy_breach" as const, severity: "serious" as const, stage: "investigation" as const,
      allegation: "Failure to complete medication administration records on two occasions",
      investigator: "staff_darren", investigation_start_date: daysFromNow(-13),
      investigation_end_date: null, suspended: false, suspension_date: null,
      suspension_review_dates: [], hearing_date: null, hearing_panel: [],
      outcome: "", sanction_expiry_date: null, appeal_lodged: false, appeal_date: null, appeal_outcome: "",
      timeline: [
        { date: daysFromNow(-14), action: "MAR audit identified two missing entries", by: "staff_anna" },
        { date: daysFromNow(-13), action: "Investigation commenced — staff member informed", by: "staff_darren" },
        { date: daysFromNow(-10), action: "Statements being gathered from shift colleagues", by: "staff_darren" },
      ],
      support_offered: ["Supervision meeting scheduled", "Medication policy refresher training"],
      lado_notified: false, dbs_referral: false, ofsted_notified: false,
      confidentiality_level: "standard" as const, trade_union_rep: null,
      lessons_learned: "", notes: "Under investigation. No safeguarding concerns.",
    },
    {
      id: "disc_005", staff_member: "staff_lackson", date_raised: daysFromNow(-8),
      category: "performance" as const, severity: "minor" as const, stage: "investigation" as const,
      allegation: "Recording quality below expected standard — multiple entries too brief",
      investigator: "staff_darren", investigation_start_date: daysFromNow(-7),
      investigation_end_date: null, suspended: false, suspension_date: null,
      suspension_review_dates: [], hearing_date: null, hearing_panel: [],
      outcome: "", sanction_expiry_date: null, appeal_lodged: false, appeal_date: null, appeal_outcome: "",
      timeline: [
        { date: daysFromNow(-8), action: "Recording quality audit flagged consistent shortfall", by: "staff_darren" },
        { date: daysFromNow(-7), action: "Informal capability conversation held", by: "staff_darren" },
        { date: daysFromNow(-5), action: "Support plan agreed — mentor assigned", by: "staff_darren" },
      ],
      support_offered: ["Additional recording training", "Mentor assigned (Anna)", "Weekly check-ins"],
      lado_notified: false, dbs_referral: false, ofsted_notified: false,
      confidentiality_level: "standard" as const, trade_union_rep: null,
      lessons_learned: "", notes: "Capability matter, not misconduct. Supportive approach being taken.",
    },
  ] as StaffDisciplinaryRecord[],
  staffExitInterviewRecords: [] as StaffExitInterviewRecord[],
  staffGrievanceRecords: [] as StaffGrievanceRecord[],
  staffHandbookAcknowledgementRecords: [] as StaffHandbookAcknowledgementRecord[],
  staffInductionRecords: [] as StaffInductionRecord[],
  staffMeetingRecords: [] as StaffMeetingRecord[],
  staffRecognitionRecords: [] as StaffRecognitionRecord[],
  staffReflectionRecords: [] as StaffReflectionRecord[],
  staffSaferCaringRecords: [] as StaffSaferCaringRecord[],
  staffShadowingRecords: [] as StaffShadowingRecord[],
  staffSicknessRecords: [] as StaffSicknessRecord[],
  staffSupervisionThemeRecords: [] as StaffSupervisionThemeRecord[],
  staffWellbeingRecords: [] as StaffWellbeingRecord[],
  stakeholderFeedbackRecords: [] as StakeholderFeedbackRecord[],
  statutoryCheckRecords: [] as StatutoryCheckRecord[],
  statutoryVisitRecords: [] as StatutoryVisitRecord[],
  subjectAccessRequestRecords: [] as SubjectAccessRequestRecord[],
  supervisionMatrixRecords: [] as SupervisionMatrixRecord[],
  supervisionTrackerRecords: [] as SupervisionTrackerRecord[],
  therapeuticInputRecords: [] as TherapeuticInputRecord[],
  transitionPlanningRecords: [] as TransitionPlanningRecord[],
  transportLogRecords: [] as TransportLogRecord[],
  unannouncedVisitRecords: [] as UnannouncedVisitRecord[],
  utilityMonitoringRecords: [] as UtilityMonitoringRecord[],
  visitorsFeedbackRecords: [] as VisitorsFeedbackRecord[],
  visitorRegistrationRecords: [] as VisitorRegistrationRecord[],
  dbsCheckRecords: [] as DbsCheckRecord[],
  idVerificationRecords: [] as IdVerificationRecord[],
  safeguardingProtocolRecords: [] as SafeguardingProtocolRecord[],
  visitorLogRecords: [] as VisitorLogRecord[],
  waterHygieneRecords: [] as WaterHygieneRecord[],
  wellbeingPulseSurveyRecords: [] as WellbeingPulseSurveyRecord[],
  whistleblowingRecords: [
    {
      id: "wb_001", reference: "WB-2026-001", date_raised: daysFromNow(-60),
      raised_by: "staff_anna", anonymous: false,
      category: "safeguarding" as const, severity: "high" as const,
      status: "resolved" as const,
      subject_of_concern: "Concerns about night shift staffing levels",
      summary: "Staff member raised concerns about reduced night cover potentially affecting children's safety",
      detail: "On three occasions in the past month, night shifts have run with only one waking staff member due to sickness absence not being covered. This creates a safeguarding risk if an incident occurs.",
      evidence_provided: ["Rota records", "Incident log for 12 March"],
      assigned_to: "staff_darren",
      external_referral: null,
      outcome: "Substantiated. Agency cover now mandated for any night shift below minimum staffing. New protocol implemented.",
      lessons_learned: "Night staffing must never fall below minimum ratio. Updated absence cover protocol to require immediate agency call-in.",
      timeline: [
        { date: daysFromNow(-60), action: "Disclosure received", by: "staff_darren" },
        { date: daysFromNow(-58), action: "Investigation commenced — reviewed rota records", by: "staff_darren" },
        { date: daysFromNow(-50), action: "Staff interviews completed", by: "staff_darren" },
        { date: daysFromNow(-42), action: "Outcome determined — concerns substantiated", by: "staff_darren" },
        { date: daysFromNow(-40), action: "New night cover protocol implemented", by: "staff_darren" },
      ],
      protection_measures: ["Confidentiality maintained", "No detriment to whistleblower", "Regular check-ins with whistleblower"],
    },
    {
      id: "wb_002", reference: "WB-2026-002", date_raised: daysFromNow(-35),
      raised_by: "staff_edward", anonymous: true,
      category: "malpractice" as const, severity: "medium" as const,
      status: "resolved" as const,
      subject_of_concern: "Recording practices concerns",
      summary: "Anonymous disclosure that some daily records are being backdated or written from memory days after events",
      detail: "Concern raised that on busy shifts, some staff are not completing daily logs until 2-3 days later, relying on memory rather than contemporaneous recording. This may affect accuracy of records.",
      evidence_provided: ["System timestamps showing late entries"],
      assigned_to: "staff_darren",
      external_referral: null,
      outcome: "Partially substantiated. Some late recording identified. Addressed through staff meeting and supervision. No falsification found.",
      lessons_learned: "Reinforced importance of contemporaneous recording. Added automated reminders for incomplete daily logs.",
      timeline: [
        { date: daysFromNow(-35), action: "Anonymous disclosure received via suggestion box", by: "staff_darren" },
        { date: daysFromNow(-33), action: "System audit of recording timestamps initiated", by: "staff_darren" },
        { date: daysFromNow(-25), action: "Audit findings reviewed — late recording confirmed in some cases", by: "staff_darren" },
        { date: daysFromNow(-20), action: "Staff meeting held — expectations reinforced", by: "staff_darren" },
        { date: daysFromNow(-18), action: "Automated reminder system implemented", by: "staff_darren" },
      ],
      protection_measures: ["Anonymous disclosure — identity unknown", "General staff reminder issued to avoid targeting"],
    },
    {
      id: "wb_003", reference: "WB-2026-003", date_raised: daysFromNow(-12),
      raised_by: "staff_ryan", anonymous: false,
      category: "health_safety" as const, severity: "medium" as const,
      status: "investigating" as const,
      subject_of_concern: "Fire door maintenance concerns",
      summary: "Staff raised concern that two fire doors on the first floor are not closing properly and maintenance has been requested but not completed",
      detail: "Maintenance request was submitted 3 weeks ago for fire doors in corridor B. Despite follow-up, the landlord has not arranged repair. Doors are currently propped closed with wedges which is not compliant.",
      evidence_provided: ["Maintenance request log", "Photos of door condition"],
      assigned_to: "staff_darren",
      external_referral: null,
      outcome: "",
      lessons_learned: "",
      timeline: [
        { date: daysFromNow(-12), action: "Disclosure received and logged", by: "staff_darren" },
        { date: daysFromNow(-11), action: "Physical inspection confirmed door issues", by: "staff_darren" },
        { date: daysFromNow(-9), action: "Escalated to landlord with formal deadline", by: "staff_darren" },
        { date: daysFromNow(-5), action: "Interim measures put in place — manual checks added to fire safety rounds", by: "staff_darren" },
      ],
      protection_measures: ["Whistleblower informed of progress", "No detriment"],
    },
    {
      id: "wb_004", reference: "WB-2026-004", date_raised: daysFromNow(-150),
      raised_by: "staff_chervelle", anonymous: false,
      category: "neglect" as const, severity: "high" as const,
      status: "resolved" as const,
      subject_of_concern: "Concerns about previous agency staff conduct",
      summary: "Concern raised about agency staff member not engaging with young person during waking night shift",
      detail: "Chervelle observed on two occasions that an agency night worker was sleeping during waking night duty. CCTV confirmed staff member was not conducting checks at required intervals.",
      evidence_provided: ["CCTV timestamps", "Missing check entries in log"],
      assigned_to: "staff_darren",
      external_referral: "LADO",
      outcome: "Substantiated. Agency worker removed from approved list. LADO informed. Agency company notified formally.",
      lessons_learned: "Enhanced induction process for agency staff. CCTV spot-checks added to night shift audit schedule.",
      timeline: [
        { date: daysFromNow(-150), action: "Disclosure received", by: "staff_darren" },
        { date: daysFromNow(-149), action: "CCTV reviewed — confirmed concerns", by: "staff_darren" },
        { date: daysFromNow(-148), action: "Agency worker suspended from duties at home", by: "staff_darren" },
        { date: daysFromNow(-147), action: "LADO referral made", by: "staff_darren" },
        { date: daysFromNow(-140), action: "Investigation completed — substantiated", by: "staff_darren" },
        { date: daysFromNow(-135), action: "Agency formally notified — worker removed from approved list", by: "staff_darren" },
      ],
      protection_measures: ["Whistleblower thanked and supported", "No detriment", "Outcome shared with whistleblower"],
    },
  ] as WhistleblowingRecord[],
  wbInvestigationRecords: [] as WBInvestigationRecord[],
  admissionReferrals: [] as AdmissionReferral[],
  healthRecordEntries: [] as HealthRecordEntry[],
  ypSavingsAccountRecords: [] as YPSavingsAccountRecord[],
  // ── Care Events (live update routing system) ───────────────────────────────
  careEvents: [...SEED_CARE_EVENTS] as CareEvent[],
  careEventRoutes: [...SEED_CARE_EVENT_ROUTES] as CareEventRoute[],
  careEventJobs: [] as CareEventJob[],
  careEventAuditLog: [...SEED_CARE_EVENT_AUDIT] as CareEventAuditLog[],
  reg45EvidenceQueue: [...SEED_REG45_EVIDENCE] as Reg45EvidenceItem[],
  annexAEvidenceQueue: [...SEED_ANNEX_A_EVIDENCE] as AnnexAEvidenceItem[],
  childDailySummaries: [...SEED_CHILD_DAILY_SUMMARIES] as ChildDailySummary[],
  filingCabinet: [...SEED_FILING_CABINET] as FilingCabinetItem[],
  savedTimeMetrics: [...SEED_SAVED_TIME_METRICS] as SavedTimeMetric[],

  // ── Inspection Snapshots (M31) ───────────────────────────────────────────
  inspectionSnapshots: [] as PersistedInspectionSnapshot[],

  // ── User Notification State (M34) ────────────────────────────────────────
  userNotificationStates: [] as UserNotificationState[],

  // ── Persisted Reg 44 Packs (M35) ────────────────────────────────────────
  reg44Packs: [] as PersistedReg44Pack[],
  inspectionBundles: [] as PersistedInspectionBundle[],
  trajectoryAlertAcks: [] as TrajectoryAlertAck[],
  trajectoryRiEscalationAcks: [] as TrajectoryRiEscalationAck[],

  // ── Export History (M36) ─────────────────────────────────────────────────────
  exportHistory: [] as ExportHistoryEntry[],

  // ── Branding ─────────────────────────────────────────────────────────────
  systemBranding: {
    id: "cornerstone_system" as const,
    logo_url: null as string | null,
    icon_url: null as string | null,
    wordmark_url: null as string | null,
    primary_colour: "#1e3a5f",
    secondary_colour: "#2dd4bf",
    accent_colour: "#3b82f6",
    background_colour: "#f8fafc",
    default_footer_text: "Generated securely through Cornerstone",
    support_email: "support@cornerstone.care",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  organisationBrandings: [
    {
      id: "obr_default",
      organisation_id: "org_oak",
      company_name: "Seamless Streams Care Ltd",
      trading_name: "Oak House Residential Care",
      registered_provider_name: "Seamless Streams Care Ltd",
      company_registration_number: "12345678",
      ofsted_provider_reference: "SC123456",
      logo_url: null as string | null,
      document_logo_url: null as string | null,
      email_logo_url: null as string | null,
      primary_colour: "#1e3a5f",
      secondary_colour: "#2dd4bf",
      accent_colour: null as string | null,
      address: "1 Care Lane, Oak Town, OA1 2BC",
      phone: "01234 567890",
      email: "admin@oakhouse.care",
      website: "www.oakhouse.care",
      responsible_individual_name: "Eleanor Hartley",
      default_footer_text:
        "Generated securely through Cornerstone on behalf of Seamless Streams Care Ltd",
      confidentiality_notice:
        "This document is confidential. It contains sensitive information about children in care and must not be shared without authorisation from the Registered Manager or Responsible Individual.",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ] as Array<Record<string, unknown>>,
  homeBrandings: [
    {
      id: "hbr_oak",
      home_id: "home_oak",
      organisation_id: "org_oak",
      home_name: "Oak House",
      home_address: "1 Care Lane, Oak Town, OA1 2BC",
      ofsted_urn: "SC123456",
      registered_manager_name: "Darren Cartwright",
      responsible_individual_name: "Eleanor Hartley",
      emergency_contact: "01234 567891",
      safeguarding_contact: "01234 567892",
      lado_contact: "Oak Town LA LADO: 01234 999001",
      local_authority_contact: "Oak Town Children's Services: 01234 900100",
      police_contact: "Oak Town Police: 101",
      logo_override_url: null as string | null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ] as Array<Record<string, unknown>>,
  documentBrandingSnapshots: [] as Array<Record<string, unknown>>,
  brandingAuditLog: [] as Array<Record<string, unknown>>,

  // ── ARIA Studio ──────────────────────────────────────────────────────────────
  ariaArtifacts: [
    {
      id: "art_demo_001",
      artifact_type: "keywork_session",
      title: "Keywork session — managing school transitions (Alex)",
      status: "approved",
      child_id: "yp_alex",
      home_id: "home_oak",
      staff_id: null,
      incident_id: null,
      linked_record_id: null,
      linked_record_type: null,
      framework: "pace",
      tone: "warm",
      creative_mode: "therapeutic",
      generated_content: `## Keywork Session Plan\n\n**Child:** Alex | **Framework:** PACE\n\n### Purpose\nTo explore Alex's feelings about the upcoming school transition and build a shared plan for managing the change.\n\n### Evidence used\nThree recent daily log entries note Alex becoming withdrawn before school days. A risk assessment flags education engagement as a current concern.\n\n### Child voice currently known\nAlex has said: "I don't want to go to a new school." This was recorded during the last keywork session.\n\n### Therapeutic rationale\nUsing PACE, we aim to hold Alex's anxiety with curiosity rather than reassurance, helping him feel understood before problem-solving begins.\n\n### Suggested opening\n"I know school changes can feel really big. I'm wondering what the hardest bit feels like for you?"\n\n### Scaling question\n"If 10 is feeling totally ready and 1 is feeling really scared, where are you today?"\n\n### Follow-up actions\n- Arrange a visit to the new school with a familiar staff member\n- Update care plan section on education\n- Review with manager\n\n**This is an ARIA draft. A human must review and approve before use.**`,
      structured_content: null,
      plain_text_content: null,
      quality_score: 88,
      evidence_confidence_score: 75,
      safeguarding_level: "none",
      regulation_relevance: [],
      source_ids: [],
      created_by: "staff_darren",
      reviewed_by: "staff_manager",
      approved_by: "staff_manager",
      committed_by: null,
      rejected_by: null,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      submitted_for_review_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      reviewed_at: new Date(Date.now() - 86400000).toISOString(),
      approved_at: new Date(Date.now() - 86400000).toISOString(),
      committed_at: null,
      rejected_at: null,
      archived_at: null,
      version_number: 1,
      filing_cabinet_path: null,
      official_record_id: null,
      child_voice_present: true,
      quality_checks_passed: true,
      amendment_reason: null,
    },
    {
      id: "art_demo_002",
      artifact_type: "management_oversight",
      title: "Management oversight — peer conflict pattern (October–November)",
      status: "committed",
      child_id: null,
      home_id: "home_oak",
      staff_id: null,
      incident_id: null,
      linked_record_id: null,
      linked_record_type: null,
      framework: "safeguarding_led",
      tone: "professional",
      creative_mode: "inspection_ready",
      generated_content: `## Management Oversight Note\n\n**Period:** October–November 2026 | **Framework:** Safeguarding-led\n\n### Evidence reviewed\nSeven incident records, two risk assessment reviews, and the monthly home dynamics summary were used to prepare this oversight.\n\n### Child impact analysis\nThree children have been involved in peer conflicts this period. Incidents cluster around unsettled evenings and shifts with reduced familiar staffing.\n\n### Risk analysis\nRisk of escalation is assessed as medium. There are no current safeguarding referrals but patterns warrant monitoring.\n\n### Regulatory relevance\nTwo incidents may require consideration for Regulation 40. Reg 45 evidence has been updated.\n\n### Management decisions and actions\n1. Staffing consistency review — Action: HR lead — Due: 2 weeks\n2. Peer support plan review for all affected young people — Due: 10 days\n3. Risk assessments to be updated — Due: 7 days\n\n**Approved by registered manager. Committed to official record.**`,
      structured_content: null,
      plain_text_content: null,
      quality_score: 95,
      evidence_confidence_score: 88,
      safeguarding_level: "low",
      regulation_relevance: ["reg40", "reg45"],
      source_ids: [],
      created_by: "staff_manager",
      reviewed_by: "staff_manager",
      approved_by: "staff_manager",
      committed_by: "staff_manager",
      rejected_by: null,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      submitted_for_review_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      reviewed_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      approved_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      committed_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      rejected_at: null,
      archived_at: null,
      version_number: 1,
      filing_cabinet_path: "Home/Management Oversight/2026/November/management_oversight",
      official_record_id: null,
      child_voice_present: false,
      quality_checks_passed: true,
      amendment_reason: null,
    },
    {
      id: "art_demo_003",
      artifact_type: "risk_review",
      title: "Risk review — missing from care indicators (Maya)",
      status: "draft",
      child_id: "yp_maya",
      home_id: "home_oak",
      staff_id: null,
      incident_id: null,
      linked_record_id: null,
      linked_record_type: null,
      framework: "safeguarding_led",
      tone: "professional",
      creative_mode: "conservative",
      generated_content: `## Risk Review — Missing From Care\n\n**Child:** Maya\n\n**ARIA draft — requires human review before any action is taken.**\n\n### Current risk summary\nMaya has had two missing episodes in the past four weeks. Both returns were within three hours. Return home conversations were completed.\n\n### Recent indicators\n- Increased secrecy around phone use (noted in 4 daily logs)\n- Reluctance to attend education (3 days missed this week)\n- Emotional presentation described as "flat" by night staff\n\n### Protective factors\n- Strong relationship with key worker\n- Consistent engagement with therapeutic sessions\n- Supportive family contact\n\n### Possible escalation signs to watch\n- Overnight missing episodes\n- New adults appearing in contact\n- Unexplained money or gifts\n- Withdrawal from trusted adults\n\n### Recommended actions (for manager review)\n1. Update risk assessment — required within 5 days\n2. CSE screening review — consider request\n3. Next return home conversation to include exploitation screening questions\n4. Update key worker plan\n\n**This is an ARIA-generated draft. A manager must review and approve all content before any action is taken.**`,
      structured_content: null,
      plain_text_content: null,
      quality_score: null,
      evidence_confidence_score: 55,
      safeguarding_level: "high",
      regulation_relevance: ["reg45", "annex_a"],
      source_ids: [],
      created_by: "staff_anna",
      reviewed_by: null,
      approved_by: null,
      committed_by: null,
      rejected_by: null,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      submitted_for_review_at: null,
      reviewed_at: null,
      approved_at: null,
      committed_at: null,
      rejected_at: null,
      archived_at: null,
      version_number: 1,
      filing_cabinet_path: null,
      official_record_id: null,
      child_voice_present: false,
      quality_checks_passed: false,
      amendment_reason: null,
    },
  ] as AriaArtifact[],
  ariaSources: [] as AriaSource[],
  ariaArtifactVersions: [] as AriaArtifactVersion[],
  ariaArtifactReviews: [] as AriaArtifactReview[],
  ariaArtifactActions: [] as AriaArtifactAction[],
  ariaQualityChecks: [] as AriaQualityCheck[],
  ariaGaps: [] as AriaGap[],
  ariaStudioAuditLog: [] as AriaStudioAuditLog[],
  ariaHomeDynamicsSnapshots: [] as AriaHomeDynamicsSnapshot[],
  ariaSafeguardingPatterns: [] as AriaSafeguardingPattern[],
  ariaEarlyWarnings: [] as AriaEarlyWarning[],
  ariaCareGraphNodes: [] as AriaCareGraphNode[],
  ariaCareGraphEdges: [] as AriaCareGraphEdge[],
  ariaFormulations: [] as AriaFormulation[],
  ariaDecisionRecommendations: [] as AriaDecisionRecommendation[],
  ariaReg45EvidenceItems: [] as AriaReg45EvidenceItem[],
  ariaAnnexASnapshots: [] as AriaAnnexASnapshot[],
  ariaReg45Reports: [] as AriaReg45Report[],
  ariaSuggestedRecords: [] as AriaSuggestedRecord[],
  ariaCommittedRecords: [] as AriaCommittedRecord[],
  ariaReg40Triages: [] as AriaReg40Triage[],

  // ARIA Practice Intelligence
  ariaPracticeAssessments: [] as AriaPracticeAssessment[],
  ariaDevelopmentalGaps: [] as AriaDevelopmentalGapRecord[],
  ariaProtectiveFactorReviews: [] as AriaProtectiveFactorReview[],
  ariaRelationshipDepthReviews: [] as AriaRelationshipDepthReview[],
  ariaThresholdConsultations: [] as AriaThresholdConsultation[],
  ariaStaffWellbeingSignals: [] as AriaStaffWellbeingSignal[],
  ariaPracticeFlags: [] as AriaPracticeFlag[],
  ariaGuidanceRules: [] as AriaGuidanceRule[],

  // Shift Swap Requests
  shiftSwaps: [
    {
      id: "swap_001",
      requester_id: "staff_anna",
      target_staff_id: "staff_edward",
      requester_shift_id: "shift_004",
      target_shift_id: "shift_003",
      status: "pending",
      reason: "Medical appointment on this date — happy to swap sleep-in for Edward's day shift.",
      manager_notes: null,
      decided_by: null,
      decided_at: null,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: "swap_002",
      requester_id: "staff_lackson",
      target_staff_id: "staff_diane",
      requester_shift_id: "shift_005",
      target_shift_id: null,
      status: "pending",
      reason: "Family commitment — need to swap my day shift, Diane has agreed informally.",
      manager_notes: null,
      decided_by: null,
      decided_at: null,
      created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
  ] as ShiftSwapRequest[],
};

// Seed key working sessions
store.keyWorkingSessions = [
  {
    id: "kw_001", child_id: "yp_alex", staff_id: "staff_darren", date: daysFromNow(-1), type: "one_to_one",
    duration: 45, location: "Quiet room",
    topics: ["College application progress", "Anxiety about interviews", "Weekend plans"],
    child_voice: "I'm worried about the college interview. I don't know what to say about why I want to do the course. Can we practise?",
    worker_observations: "Alex appeared anxious initially but relaxed during the session. Engaged well with mock interview practice. Showed genuine interest in the course but lacks confidence in articulating this.",
    actions_agreed: ["Practise interview questions together on Thursday", "Write three reasons for choosing the course", "Staff to contact college about support for LAC students"],
    mood_before: 2, mood_after: 4, follow_up: "Mock interview session", follow_up_date: daysFromNow(2), follow_up_completed: false,
    linked_goals: ["College application"], confidential: false, home_id: "home_oak", created_at: daysFromNow(-1),
  },
  {
    id: "kw_002", child_id: "yp_alex", staff_id: "staff_darren", date: daysFromNow(-8), type: "goal_setting",
    duration: 30, location: "Kitchen",
    topics: ["Cooking independence goal", "Meal planning", "Budgeting for food shopping"],
    child_voice: "I want to learn how to make a roast dinner. My nan used to make the best roasts and I want to learn.",
    worker_observations: "Emotional connection to cooking through memories of nan. This is a strong motivator. Alex planned a shopping list independently with minimal prompting.",
    actions_agreed: ["Plan roast dinner for Sunday", "Create shopping list together", "Alex to try making a simple dessert midweek"],
    mood_before: 3, mood_after: 5, follow_up: "Sunday roast cooking session", follow_up_date: daysFromNow(-3), follow_up_completed: true,
    linked_goals: ["Independent cooking skills"], confidential: false, home_id: "home_oak", created_at: daysFromNow(-8),
  },
  {
    id: "kw_003", child_id: "yp_jordan", staff_id: "staff_anna", date: daysFromNow(-2), type: "wellbeing_check",
    duration: 20, location: "Jordan's bedroom",
    topics: ["Sleep patterns", "Contact with mum", "Football club"],
    child_voice: "I'm not sleeping well again. I keep thinking about things. Football helps though — I feel better after training.",
    worker_observations: "Jordan tired and quieter than usual. Sleep disruption coincides with cancelled contact with mum last week. Football clearly a positive outlet. May need referral to CAMHS if sleep issues persist.",
    actions_agreed: ["Try relaxation techniques before bed", "Staff to follow up with social worker about contact", "Keep attending football twice weekly"],
    mood_before: 2, mood_after: 3, follow_up: "Check in about sleep in 3 days", follow_up_date: daysFromNow(1), follow_up_completed: false,
    linked_goals: ["Health & wellbeing"], confidential: false, home_id: "home_oak", created_at: daysFromNow(-2),
  },
  {
    id: "kw_004", child_id: "yp_jordan", staff_id: "staff_ryan", date: daysFromNow(-5), type: "review",
    duration: 40, location: "Office",
    topics: ["Pathway plan review", "Housing options", "Leaving care entitlements"],
    child_voice: "I don't want to think about leaving yet. It's scary. But I know I need to start looking at places.",
    worker_observations: "Jordan is anxious about transition but willing to engage when given time. Responded well to visiting supported accommodation photos. Preferred the option with communal living spaces.",
    actions_agreed: ["Visit supported accommodation next Tuesday", "Jordan to list three things important in a home", "Staff to arrange meeting with leaving care PA"],
    mood_before: 2, mood_after: 3, follow_up: "Supported accommodation visit", follow_up_date: daysFromNow(-1), follow_up_completed: true,
    linked_goals: ["Housing preparation"], confidential: false, home_id: "home_oak", created_at: daysFromNow(-5),
  },
  {
    id: "kw_005", child_id: "yp_casey", staff_id: "staff_chervelle", date: daysFromNow(-3), type: "one_to_one",
    duration: 35, location: "Garden",
    topics: ["School friendships", "Identity exploration", "Creative writing"],
    child_voice: "I wrote a poem about who I am. Do you want to hear it? I'm not sure if it's any good but it felt important to write it.",
    worker_observations: "Casey shared a deeply personal poem about identity and belonging. Showed vulnerability and trust in sharing this. The poem referenced feeling 'in between two worlds'. Casey is processing complex feelings about heritage with maturity.",
    actions_agreed: ["Casey to keep writing journal", "Consider sharing poem with therapist if comfortable", "Staff to source creative writing resources"],
    mood_before: 3, mood_after: 4, follow_up: "Check if Casey wants to continue creative work", follow_up_date: daysFromNow(4), follow_up_completed: false,
    linked_goals: ["Identity exploration"], confidential: true, home_id: "home_oak", created_at: daysFromNow(-3),
  },
  {
    id: "kw_006", child_id: "yp_casey", staff_id: "staff_chervelle", date: daysFromNow(-10), type: "life_skills",
    duration: 60, location: "Kitchen & utility room",
    topics: ["Laundry skills", "Cleaning routine", "Personal hygiene"],
    child_voice: "I didn't know you had to separate colours! No one ever showed me before.",
    worker_observations: "Casey engaged well with practical learning. Needed step-by-step guidance but picked up quickly. Showed pride in completing a full wash cycle independently. Good opportunity for positive reinforcement.",
    actions_agreed: ["Casey to do own laundry every Saturday", "Create visual guide for laundry steps", "Try ironing school uniform next week"],
    mood_before: 3, mood_after: 5, follow_up: "Check laundry routine on Saturday", follow_up_date: daysFromNow(-3), follow_up_completed: true,
    linked_goals: ["Independent living skills"], confidential: false, home_id: "home_oak", created_at: daysFromNow(-10),
  },
  {
    id: "kw_007", child_id: "yp_alex", staff_id: "staff_darren", date: daysFromNow(-14), type: "therapeutic",
    duration: 50, location: "Quiet room",
    topics: ["Anger management strategies", "Recent frustration at school", "Coping techniques"],
    child_voice: "I tried the breathing thing you showed me and it actually worked. I walked away instead of kicking off. I was proud of myself.",
    worker_observations: "Significant progress with emotional regulation. Alex self-reported using calming strategies in a school situation that would previously have escalated. This is a breakthrough moment worth celebrating and recording.",
    actions_agreed: ["Continue practising grounding techniques daily", "Create a personal calm-down plan card", "Share progress with school SENCO"],
    mood_before: 4, mood_after: 5, follow_up: "Follow up with school about incident", follow_up_date: daysFromNow(-10), follow_up_completed: true,
    linked_goals: ["Emotional wellbeing"], confidential: false, home_id: "home_oak", created_at: daysFromNow(-14),
  },
  {
    id: "kw_008", child_id: "yp_jordan", staff_id: "staff_anna", date: daysFromNow(-12), type: "informal",
    duration: 15, location: "Living room",
    topics: ["Weekend activities", "TV preferences", "Family memories"],
    child_voice: "Can we watch that cooking show together? It reminds me of when my dad used to cook.",
    worker_observations: "Brief but meaningful interaction. Jordan initiated conversation about family memories which is rare. Didn't push further but noted the openness. Watching TV together provided a natural, low-pressure connection point.",
    actions_agreed: ["Watch cooking show together on Wednesdays", "Consider cooking activity linked to family memories"],
    mood_before: 3, mood_after: 4, follow_up: "", follow_up_date: "", follow_up_completed: false,
    linked_goals: [], confidential: false, home_id: "home_oak", created_at: daysFromNow(-12),
  },
];

// Seed keyworker (1:1) sessions
store.keyworkerSessions = [
  {
    id: "kws_001",
    child_id: "yp_casey",
    staff_id: "staff_chervelle",
    session_date: daysFromNow(-5),
    duration_minutes: 45,
    format: "one_to_one_at_home" as const,
    child_chose_format: true,
    themes_covered: ["identity", "education"],
    child_went_in_with: "3",
    child_walked_out_with: "4",
    what_child_brought_up: "Casey shared feelings about school friendships and identity",
    what_staff_brought_up: "Upcoming education review and creative writing project",
    agreed_actions_staff: ["Arrange creative writing resources", "Follow up on school peer relationships"],
    agreed_actions_child: ["Continue writing journal", "Speak to form tutor about friendships"],
    child_satisfaction: 4,
    follow_up_date: daysFromNow(9),
    flags_raised: [],
    created_at: daysFromNow(-5),
  },
  {
    id: "kws_002",
    child_id: "yp_jordan",
    staff_id: "staff_anna",
    session_date: daysFromNow(-3),
    duration_minutes: 30,
    format: "one_to_one_walk" as const,
    child_chose_format: true,
    themes_covered: ["transition", "wellbeing"],
    child_went_in_with: "2",
    child_walked_out_with: "3",
    what_child_brought_up: "Jordan spoke about transition planning and anxiety about leaving care",
    what_staff_brought_up: "Pathway plan review and housing options",
    agreed_actions_staff: ["Book transition planning meeting", "Arrange supported accommodation visit"],
    agreed_actions_child: ["Think about three things important in a home", "Bring questions to next session"],
    child_satisfaction: 3,
    follow_up_date: daysFromNow(11),
    flags_raised: [],
    created_at: daysFromNow(-3),
  },
];

// Seed missing episodes
store.missingEpisodes = [
  {
    id: "mfc_001", reference: "MFC-2026-001", child_id: "yp_alex",
    date_missing: "2026-01-15", time_missing: "21:30",
    date_returned: "2026-01-15", time_returned: "23:25",
    duration_hours: 1.9, risk_level: "medium",
    location_last_seen: "Outside Oak House — said going to shop",
    return_location: "Local park, returned voluntarily",
    reported_to_police: false, police_reference: null,
    reported_to_la: true, la_notified_at: "2026-01-16T09:00:00Z",
    return_interview_completed: true, return_interview_by: "staff_ryan",
    return_interview_date: "2026-01-16",
    return_interview_notes: "Alex said he lost track of time. No safeguarding concerns disclosed. Agreed to check in next time.",
    contextual_safeguarding_risk: false,
    linked_incident_id: null,
    pattern_notes: "First episode. Informal community time.",
    status: "closed", home_id: "home_oak",
    created_at: "2026-01-15T23:30:00Z", created_by: "staff_edward",
  },
  {
    id: "mfc_002", reference: "MFC-2026-002", child_id: "yp_alex",
    date_missing: "2026-02-28", time_missing: "19:00",
    date_returned: "2026-02-28", time_returned: "23:10",
    duration_hours: 4.2, risk_level: "high",
    location_last_seen: "Leaving for 'mate's house' — no address given",
    return_location: "Town centre, collected by staff",
    reported_to_police: true, police_reference: "DERBYSHIRE/2026/001122",
    reported_to_la: true, la_notified_at: "2026-02-28T20:00:00Z",
    return_interview_completed: true, return_interview_by: "staff_darren",
    return_interview_date: "2026-03-01",
    return_interview_notes: "Alex disclosed spending time with a group of older males he met online. Names not provided. CS risk assessment initiated.",
    contextual_safeguarding_risk: true,
    linked_incident_id: null,
    pattern_notes: "Second episode. Increasing duration. CS risk flagged — older peer network.",
    status: "closed", home_id: "home_oak",
    created_at: "2026-02-28T19:15:00Z", created_by: "staff_lackson",
  },
  {
    id: "mfc_003", reference: "MFC-2026-003", child_id: "yp_alex",
    date_missing: "2026-04-01", time_missing: "20:45",
    date_returned: "2026-04-01", time_returned: "22:20",
    duration_hours: 1.6, risk_level: "high",
    location_last_seen: "Community — said going to shop",
    return_location: "Local park, with unknown males",
    reported_to_police: true, police_reference: "DERBYSHIRE/2026/002876",
    reported_to_la: true, la_notified_at: "2026-04-01T21:00:00Z",
    return_interview_completed: true, return_interview_by: "staff_edward",
    return_interview_date: "2026-04-02",
    return_interview_notes: "Alex was evasive. Wouldn't name contacts. Mobile phone observed — not usual device. Risk assessment updated. Strategy discussion arranged.",
    contextual_safeguarding_risk: true,
    linked_incident_id: "inc_001",
    pattern_notes: "Third episode this year. Pattern emerging — always late evening, always community. Same unknown peer group suspected. Escalated to MASH.",
    status: "closed", home_id: "home_oak",
    created_at: "2026-04-01T20:55:00Z", created_by: "staff_edward",
  },
];

// Seed chronology
store.chronology = [
  // Alex chronology
  { id: "chr_001", child_id: "yp_alex", date: "2025-09-01", time: "14:00", category: "placement", title: "Placement commenced at Oak House", description: "Alex admitted to Oak House under S20. Initial placement meeting held with LA, IRO, and social worker. Risk assessment reviewed.", significance: "critical", recorded_by: "staff_darren", linked_incident_id: null, home_id: "home_oak", created_at: "2025-09-01T14:00:00Z" },
  { id: "chr_002", child_id: "yp_alex", date: "2025-10-01", time: null, category: "education", title: "School placement arranged — Derby Alternative Provision", description: "Education arranged with Derby AP following exclusion from previous school. Alex settled well in first week.", significance: "significant", recorded_by: "staff_ryan", linked_incident_id: null, home_id: "home_oak", created_at: "2025-10-01T10:00:00Z" },
  { id: "chr_003", child_id: "yp_alex", date: "2026-01-15", time: "21:30", category: "missing", title: "First missing from care episode (MFC-2026-001)", description: "Alex absent 1h 55m. Returned voluntarily. Low-risk return interview completed.", significance: "significant", recorded_by: "staff_edward", linked_incident_id: null, home_id: "home_oak", created_at: "2026-01-15T23:30:00Z" },
  { id: "chr_004", child_id: "yp_alex", date: "2026-02-05", time: null, category: "review", title: "LAC Review — Alex W", description: "Looked After Child review held at Derby City Council. Placement stable. Education engagement improved. No change to Care Order.", significance: "significant", recorded_by: "staff_darren", linked_incident_id: null, home_id: "home_oak", created_at: "2026-02-05T11:00:00Z" },
  { id: "chr_005", child_id: "yp_alex", date: "2026-02-28", time: "19:00", category: "missing", title: "Second missing from care episode (MFC-2026-002) — CS risk flagged", description: "Alex absent 4h 10m. Police informed. CS risk identified — older peer network. Strategy discussion booked.", significance: "critical", recorded_by: "staff_lackson", linked_incident_id: null, home_id: "home_oak", created_at: "2026-02-28T19:15:00Z" },
  { id: "chr_006", child_id: "yp_alex", date: "2026-04-01", time: "20:45", category: "missing", title: "Third missing from care episode (MFC-2026-003) — pattern escalated", description: "Alex absent 1h 35m. Police informed. Contextual safeguarding escalation — MASH referral made. Unknown peer group suspected.", significance: "critical", recorded_by: "staff_edward", linked_incident_id: "inc_001", home_id: "home_oak", created_at: "2026-04-01T20:55:00Z" },
  { id: "chr_007", child_id: "yp_alex", date: "2026-04-14", time: "19:10", category: "safeguarding", title: "Safeguarding disclosure — criminal exploitation risk", description: "Alex disclosed older peer asking him to carry items. Immediate safeguarding response. Social worker, police, and RM notified. Strategy discussion arranged.", significance: "critical", recorded_by: "staff_edward", linked_incident_id: "inc_004", home_id: "home_oak", created_at: "2026-04-14T19:15:00Z" },
  // Jordan chronology
  { id: "chr_010", child_id: "yp_jordan", date: "2025-11-15", time: null, category: "placement", title: "Placement commenced at Oak House", description: "Jordan admitted under Full Care Order (S31). Placement plan agreed with Nottinghamshire CC. Halal food and dietary requirements confirmed.", significance: "critical", recorded_by: "staff_darren", linked_incident_id: null, home_id: "home_oak", created_at: "2025-11-15T12:00:00Z" },
  { id: "chr_011", child_id: "yp_jordan", date: "2025-12-01", time: null, category: "education", title: "School placement — Highfields Academy", description: "Jordan started at Highfields Academy. Initial settling in period. Positive engagement with PE.", significance: "significant", recorded_by: "staff_ryan", linked_incident_id: null, home_id: "home_oak", created_at: "2025-12-01T09:00:00Z" },
  { id: "chr_012", child_id: "yp_jordan", date: "2026-04-14", time: "14:30", category: "behaviour", title: "Complaint raised — noise during study time (INC-2026-0042)", description: "Jordan raised formal complaint about noise levels. Complaint logged and investigation commenced.", significance: "significant", recorded_by: "staff_chervelle", linked_incident_id: "inc_003", home_id: "home_oak", created_at: "2026-04-14T14:35:00Z" },
  // Casey chronology
  { id: "chr_020", child_id: "yp_casey", date: "2026-01-10", time: null, category: "placement", title: "Placement commenced at Oak House", description: "Casey admitted under Full Care Order. From previous placement that broke down. Settling-in plan agreed. CAMHS referral in place.", significance: "critical", recorded_by: "staff_darren", linked_incident_id: null, home_id: "home_oak", created_at: "2026-01-10T13:00:00Z" },
  { id: "chr_021", child_id: "yp_casey", date: "2026-01-15", time: null, category: "health", title: "Melatonin prescribed — sleep support", description: "Dr Chen prescribed Melatonin 3mg for sleep difficulties. MAR commenced.", significance: "significant", recorded_by: "staff_darren", linked_incident_id: null, home_id: "home_oak", created_at: "2026-01-15T10:00:00Z" },
  { id: "chr_022", child_id: "yp_casey", date: "2026-02-01", time: null, category: "health", title: "Fluoxetine prescribed — mood support", description: "Dr Chen prescribed Fluoxetine 10mg for low mood. Risk assessment updated. CAMHS oversight confirmed.", significance: "significant", recorded_by: "staff_darren", linked_incident_id: null, home_id: "home_oak", created_at: "2026-02-01T11:00:00Z" },
  { id: "chr_023", child_id: "yp_casey", date: "2026-04-13", time: "08:15", category: "health", title: "Medication late administration — refusal episode (INC-2026-0040)", description: "Casey refused morning Fluoxetine. Incident logged. Late administration at 08:45 following second attempt.", significance: "significant", recorded_by: "staff_anna", linked_incident_id: "inc_002", home_id: "home_oak", created_at: "2026-04-13T08:20:00Z" },
];

// Seed medication administrations (MAR data)
const today = todayStr();
const mar_base = { home_id: "home_oak", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "staff_darren", updated_by: "staff_darren" };
store.medicationAdministrations = [
  // Casey Fluoxetine (med_002) — last 5 days
  { ...mar_base, id: "mar_001", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-04-11T08:00:00Z", actual_time: "2026-04-11T08:05:00Z", status: "given", administered_by: "staff_darren", witnessed_by: "staff_ryan", dose_given: "10mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_002", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-04-12T08:00:00Z", actual_time: "2026-04-12T08:10:00Z", status: "given", administered_by: "staff_ryan", witnessed_by: "staff_edward", dose_given: "10mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_003", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-04-13T08:00:00Z", actual_time: "2026-04-13T08:45:00Z", status: "late", administered_by: "staff_anna", witnessed_by: "staff_chervelle", dose_given: "10mg", reason_not_given: null, notes: "Initial refusal at 08:00. Second attempt successful at 08:45. Casey settled after 10 mins.", prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_004", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-04-14T08:00:00Z", actual_time: "2026-04-14T08:08:00Z", status: "given", administered_by: "staff_darren", witnessed_by: "staff_ryan", dose_given: "10mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_005", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-04-15T08:00:00Z", actual_time: "2026-04-15T08:03:00Z", status: "given", administered_by: "staff_ryan", witnessed_by: "staff_darren", dose_given: "10mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_006", medication_id: "med_002", child_id: "yp_casey", scheduled_time: "2026-04-16T08:00:00Z", actual_time: null, status: "scheduled", administered_by: null, witnessed_by: null, dose_given: null, reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  // Casey Melatonin (med_001) — last 5 nights
  { ...mar_base, id: "mar_010", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-04-11T21:30:00Z", actual_time: "2026-04-11T21:35:00Z", status: "given", administered_by: "staff_edward", witnessed_by: "staff_anna", dose_given: "3mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_011", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-04-12T21:30:00Z", actual_time: "2026-04-12T22:15:00Z", status: "late", administered_by: "staff_anna", witnessed_by: "staff_lackson", dose_given: "3mg", reason_not_given: null, notes: "Casey initially refused. Settled 45 mins later. Late administration documented.", prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_012", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-04-13T21:30:00Z", actual_time: "2026-04-13T21:32:00Z", status: "given", administered_by: "staff_chervelle", witnessed_by: "staff_diane", dose_given: "3mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_013", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-04-14T21:30:00Z", actual_time: "2026-04-14T21:30:00Z", status: "given", administered_by: "staff_diane", witnessed_by: "staff_mirela", dose_given: "3mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_014", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-04-15T21:30:00Z", actual_time: "2026-04-15T21:28:00Z", status: "given", administered_by: "staff_edward", witnessed_by: "staff_anna", dose_given: "3mg", reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  { ...mar_base, id: "mar_015", medication_id: "med_001", child_id: "yp_casey", scheduled_time: "2026-04-16T21:30:00Z", actual_time: null, status: "scheduled", administered_by: null, witnessed_by: null, dose_given: null, reason_not_given: null, notes: null, prn_reason: null, prn_effectiveness: null },
  // Alex Ibuprofen PRN (med_003)
  { ...mar_base, id: "mar_020", medication_id: "med_003", child_id: "yp_alex", scheduled_time: "2026-04-13T16:00:00Z", actual_time: "2026-04-13T16:05:00Z", status: "given", administered_by: "staff_edward", witnessed_by: "staff_lackson", dose_given: "200mg", reason_not_given: null, notes: null, prn_reason: "Headache — Alex complained of head pain post-school", prn_effectiveness: "Effective — resolved within 1 hour" },
  { ...mar_base, id: "mar_021", medication_id: "med_003", child_id: "yp_alex", scheduled_time: "2026-04-15T17:30:00Z", actual_time: "2026-04-15T17:35:00Z", status: "given", administered_by: "staff_lackson", witnessed_by: "staff_chervelle", dose_given: "200mg", reason_not_given: null, notes: null, prn_reason: "Knee pain following football training", prn_effectiveness: "Partially effective — advised rest and elevation" },
  // Jordan Piriton PRN (med_004)
  { ...mar_base, id: "mar_030", medication_id: "med_004", child_id: "yp_jordan", scheduled_time: "2026-03-20T14:00:00Z", actual_time: "2026-03-20T14:10:00Z", status: "given", administered_by: "staff_ryan", witnessed_by: "staff_anna", dose_given: "4mg", reason_not_given: null, notes: null, prn_reason: "Mild rash on forearm — suspected mild allergic reaction after outdoor activity", prn_effectiveness: "Effective — rash resolved within 2 hours. No further symptoms." },
];

// Seed buildings and H&S
store.buildings = [
  {
    id: "bld_001", home_id: "home_oak", name: "Oak House — Main Building",
    type: "residential", address: "Oak House, Derby, DE1 3AA",
    areas: ["bedroom_alex", "bedroom_jordan", "bedroom_casey", "lounge", "kitchen", "bathroom_main", "bathroom_staff", "office", "medication_room", "garden"],
    gas_cert_expiry: "2026-12-01", electrical_cert_expiry: "2027-03-01",
    fire_risk_assessment_date: "2026-01-15", epc_rating: "C",
    last_full_inspection: "2026-01-15", next_inspection_due: "2027-01-15",
    status: "operational", created_at: new Date().toISOString(),
  },
];

store.buildingChecks = [
  { id: "bchk_001", building_id: "bld_001", home_id: "home_oak", area: "whole_home", check_type: "daily_walkround", check_date: today, due_date: today, responsible_person: "staff_chervelle", status: "due", result: null, risk_level: null, notes: null, action_required: null, action_due: null, manager_oversight: false, linked_maintenance_id: null, evidence_urls: [], created_at: new Date().toISOString() },
  { id: "bchk_002", building_id: "bld_001", home_id: "home_oak", area: "medication_room", check_type: "medication_room_security", check_date: today, due_date: today, responsible_person: "staff_ryan", status: "completed", result: "pass", risk_level: "low", notes: "Medication room secure. Controlled drugs register checked. Stock counts match MAR.", action_required: null, action_due: null, manager_oversight: false, linked_maintenance_id: null, evidence_urls: [], created_at: new Date().toISOString() },
  { id: "bchk_003", building_id: "bld_001", home_id: "home_oak", area: "kitchen", check_type: "food_hygiene", check_date: today, due_date: today, responsible_person: "staff_edward", status: "completed", result: "pass", risk_level: "low", notes: "Fridge temp 4°C. Freezer -18°C. Surfaces clean. Halal/non-halal separation maintained.", action_required: null, action_due: null, manager_oversight: false, linked_maintenance_id: null, evidence_urls: [], created_at: new Date().toISOString() },
  { id: "bchk_004", building_id: "bld_001", home_id: "home_oak", area: "whole_home", check_type: "fire_alarm_test", check_date: "2026-04-14", due_date: "2026-04-21", responsible_person: "staff_darren", status: "completed", result: "pass", risk_level: "low", notes: "Weekly fire alarm test completed. All zones activated and reset correctly.", action_required: null, action_due: null, manager_oversight: false, linked_maintenance_id: null, evidence_urls: [], created_at: new Date().toISOString() },
  { id: "bchk_005", building_id: "bld_001", home_id: "home_oak", area: "garden", check_type: "external_security", check_date: "2026-04-15", due_date: "2026-04-15", responsible_person: "staff_lackson", status: "completed", result: "fail", risk_level: "medium", notes: "Rear gate latch is loose. Could be forced. Risk to perimeter security.", action_required: "Replace rear gate latch. Interim fix — padlock applied.", action_due: "2026-04-18", manager_oversight: true, linked_maintenance_id: "mnt_001", evidence_urls: [], created_at: new Date().toISOString() },
  { id: "bchk_006", building_id: "bld_001", home_id: "home_oak", area: "whole_home", check_type: "emergency_lighting", check_date: "2026-03-15", due_date: "2026-04-15", responsible_person: "staff_ryan", status: "overdue", result: null, risk_level: "high", notes: null, action_required: "Emergency lighting test overdue — schedule immediately", action_due: today, manager_oversight: true, linked_maintenance_id: null, evidence_urls: [], created_at: new Date().toISOString() },
];

// Seed vehicles
store.vehicles = [
  {
    id: "veh_001", home_id: "home_oak",
    registration: "AB21 CDE", make: "Ford", model: "Transit Custom",
    colour: "White", year: 2021, seats: 5,
    mot_expiry: "2026-08-15", insurance_expiry: "2026-09-01",
    tax_expiry: "2026-07-01", last_service: "2025-10-20",
    next_service_due: "2026-10-20", mileage: 34800,
    status: "available", breakdown_cover: "RAC", breakdown_ref: "RAC-OAK-2024",
    notes: null, created_at: new Date().toISOString(),
  },
  {
    id: "veh_002", home_id: "home_oak",
    registration: "FG23 HIJ", make: "Vauxhall", model: "Vivaro",
    colour: "Silver", year: 2023, seats: 7,
    mot_expiry: "2026-05-10", insurance_expiry: "2026-09-01",
    tax_expiry: "2026-08-01", last_service: "2026-02-10",
    next_service_due: "2026-08-10", mileage: 18200,
    status: "available", breakdown_cover: "RAC", breakdown_ref: "RAC-OAK-2024",
    notes: "Check tyre pressure — flagged at last check",
    created_at: new Date().toISOString(),
  },
];

store.vehicleChecks = [
  { id: "vchk_001", vehicle_id: "veh_001", home_id: "home_oak", check_type: "daily_safety", check_date: today, driver: "staff_lackson", tyres: "pass", lights: "pass", brakes: "pass", mirrors: "pass", fluids: "pass", wipers: "pass", cleanliness: "pass", mileage_start: 34780, mileage_end: null, fuel_level: "3/4", overall_result: "pass", defects: null, notes: "Vehicle in good condition.", created_at: new Date().toISOString() },
  { id: "vchk_002", vehicle_id: "veh_002", home_id: "home_oak", check_type: "daily_safety", check_date: "2026-04-15", driver: "staff_anna", tyres: "advisory", lights: "pass", brakes: "pass", mirrors: "pass", fluids: "pass", wipers: "pass", cleanliness: "pass", mileage_start: 18190, mileage_end: 18200, fuel_level: "1/2", overall_result: "advisory", defects: "Nearside front tyre borderline — tread depth 2.1mm. Recommend replacement within 2 weeks.", notes: "Tyre pressure also low — inflated at garage.", created_at: new Date().toISOString() },
];

// Seed handovers
store.handovers = [
  {
    id: "hnd_001", home_id: "home_oak",
    shift_date: today, shift_from: "day", shift_to: "sleep_in",
    handover_time: "21:30", completed_at: null,
    outgoing_staff: ["staff_darren", "staff_lackson"], incoming_staff: ["staff_anna", "staff_mirela", "staff_alex"],
    created_by: "staff_darren", signed_off_by: null, sign_offs: [],
    child_updates: [
      { child_id: "yp_alex", mood_score: 6, key_notes: "Alex had a settled day overall. Engaged with education in the morning. Some low mood around 4pm — disclosed worrying about court proceedings. Supported with 1:1 time.", alerts: ["Phone usage overnight — third time this week", "Court proceedings anxiety"] },
      { child_id: "yp_jordan", mood_score: 9, key_notes: "Jordan had an excellent day. Went to football training with Lackson. Made positive comments about feeling settled at Oak House.", alerts: [] },
      { child_id: "yp_casey", mood_score: 4, key_notes: "Casey struggled this afternoon. Became distressed about a phone call from her mother. Supported to regulate. Refused evening medication initially — accepted 30 minutes later.", alerts: ["Contact distress", "Medication delay — administered 30 mins late"] },
    ],
    general_notes: "Rear gate latch needs fixing urgently — flagged to Ryan. CCTV camera still not installed. Strategy discussion tomorrow re: Alex safeguarding.",
    flags: ["gate_security", "casey_medication_delay", "alex_safeguarding_strategy_tomorrow"],
    linked_incident_ids: ["inc_004"],
    created_at: new Date().toISOString(),
  },
  {
    id: "hnd_002", home_id: "home_oak",
    shift_date: today, shift_from: "night", shift_to: "day",
    handover_time: "07:30", completed_at: "07:45",
    outgoing_staff: ["staff_edward"], incoming_staff: ["staff_darren", "staff_ryan"],
    created_by: "staff_edward", signed_off_by: "staff_darren",
    sign_offs: [
      { staff_id: "staff_darren", acknowledged_at: today + "T07:40:00Z", notes: null },
      { staff_id: "staff_ryan", acknowledged_at: today + "T07:42:00Z", notes: "Noted Casey sleep issue — will follow up with key work session" },
    ],
    child_updates: [
      { child_id: "yp_alex", mood_score: 6, key_notes: "Alex had a settled night. Some restlessness at 02:00 — checked, was on phone. Phone discussion needed. Mood okay this morning.", alerts: ["Phone usage overnight — third time this week"] },
      { child_id: "yp_jordan", mood_score: 8, key_notes: "Jordan slept well. Up at 07:00, positive this morning. Prepared own breakfast.", alerts: [] },
      { child_id: "yp_casey", mood_score: 5, key_notes: "Casey had a difficult night. Woke at 01:30 distressed — contact with mother earlier affected mood. Settled with support from Edward.", alerts: ["Sleep disturbance linked to contact", "Medication refusal risk for morning"] },
    ],
    general_notes: "Rear gate latch needs fixing urgently — flagged to Ryan. CCTV camera still not installed.",
    flags: ["gate_security", "alex_phone_overnight", "casey_sleep_disturbance"],
    linked_incident_ids: ["inc_001", "inc_004"],
    created_at: daysFromNow(0) + "T07:30:00Z",
  },
];

// ── Safer Recruitment Seed Data ───────────────────────────────────────────────

store.vacancies = [
  {
    id: "vac_001",
    home_id: "home_oak",
    title: "Residential Care Worker",
    role_code: "RCW",
    employment_type: "permanent",
    contract_type: "full_time",
    salary_min: 24000,
    salary_max: 27000,
    hours: 40,
    shift_pattern: "Rotating days, evenings and sleep-ins across a 4-week rota",
    reports_to: "staff_darren",
    safeguarding_statement: "Oak House is committed to safeguarding and promoting the welfare of children and young people. All posts are subject to an enhanced DBS check, barred list check, and satisfactory references.",
    status: "open",
    approval_status: "approved",
    created_by: "staff_darren",
    approved_by: "staff_darren",
    approved_at: "2026-03-10T09:00:00Z",
    created_at: "2026-03-08T10:00:00Z",
    updated_at: "2026-03-10T09:00:00Z",
  },
  {
    id: "vac_002",
    home_id: "home_oak",
    title: "Team Leader",
    role_code: "TL",
    employment_type: "permanent",
    contract_type: "full_time",
    salary_min: 30000,
    salary_max: 34000,
    hours: 40,
    shift_pattern: "Supernumerary management shifts plus on-call cover",
    reports_to: "staff_darren",
    safeguarding_statement: "Oak House is committed to safeguarding and promoting the welfare of children and young people. All posts are subject to an enhanced DBS check, barred list check, and satisfactory references.",
    status: "open",
    approval_status: "approved",
    created_by: "staff_darren",
    approved_by: "staff_darren",
    approved_at: "2026-03-15T11:00:00Z",
    created_at: "2026-03-14T14:00:00Z",
    updated_at: "2026-03-15T11:00:00Z",
  },
];

// Candidate IDs
const CAND_AMARA = "cand_001";
const CAND_DANIEL = "cand_002";
const CAND_PRISCILLA = "cand_003";

store.candidateProfiles = [
  {
    id: CAND_AMARA,
    home_id: "home_oak",
    vacancy_id: "vac_001",
    first_name: "Amara",
    last_name: "Osei",
    preferred_name: null,
    email: "amara.osei@email.com",
    phone: "07712 345678",
    dob: "1998-06-14",
    current_address: "12 Maple Close, Derby, DE3 9PL",
    source: "indeed",
    current_stage: "interview_scheduled",
    compliance_status: "in_progress",
    risk_level: "low",
    shortlisted: true,
    appointed: false,
    assigned_manager_id: "staff_darren",
    cv_url: "/uploads/candidates/cand_001_cv.pdf",
    application_form_url: "/uploads/candidates/cand_001_application.pdf",
    cover_letter_url: null,
    adjustments_requested: false,
    adjustments_notes: null,
    notes: "Strong application. Good values statement. Worked in a similar environment previously. Panel interview arranged for 22 April.",
    created_at: "2026-03-20T10:30:00Z",
    updated_at: "2026-04-10T09:00:00Z",
    created_by: "staff_darren",
  },
  {
    id: CAND_DANIEL,
    home_id: "home_oak",
    vacancy_id: "vac_001",
    first_name: "Daniel",
    last_name: "Wright",
    preferred_name: "Dan",
    email: "d.wright@email.co.uk",
    phone: "07823 456789",
    dob: "1994-11-03",
    current_address: "45 Regent Street, Nottingham, NG1 5BS",
    source: "total_jobs",
    current_stage: "references_received",
    compliance_status: "in_progress",
    risk_level: "low",
    shortlisted: true,
    appointed: false,
    assigned_manager_id: "staff_darren",
    cv_url: "/uploads/candidates/cand_002_cv.pdf",
    application_form_url: "/uploads/candidates/cand_002_application.pdf",
    cover_letter_url: "/uploads/candidates/cand_002_cover.pdf",
    adjustments_requested: false,
    adjustments_notes: null,
    notes: "6 years experience in residential care. One reference received and satisfactory. Awaiting second reference from Paul Reeves. DBS not yet submitted — chasing candidate.",
    created_at: "2026-03-22T14:00:00Z",
    updated_at: "2026-04-12T11:00:00Z",
    created_by: "staff_darren",
  },
  {
    id: CAND_PRISCILLA,
    home_id: "home_oak",
    vacancy_id: "vac_002",
    first_name: "Priscilla",
    last_name: "Mensah",
    preferred_name: null,
    email: "p.mensah@email.com",
    phone: "07934 567890",
    dob: "1989-02-22",
    current_address: "8 Birch Lane, Leicester, LE4 2KT",
    source: "staff_referral",
    current_stage: "pre_start_checks",
    compliance_status: "in_progress",
    risk_level: "low",
    shortlisted: true,
    appointed: false,
    assigned_manager_id: "staff_darren",
    cv_url: "/uploads/candidates/cand_003_cv.pdf",
    application_form_url: "/uploads/candidates/cand_003_application.pdf",
    cover_letter_url: "/uploads/candidates/cand_003_cover.pdf",
    adjustments_requested: true,
    adjustments_notes: "Requires parking space at site — uses crutches intermittently following knee surgery. Ground floor office access preferred.",
    notes: "Excellent candidate. 10 years in residential care, 3 as a senior. Both references satisfactory. DBS submitted 8 April — awaiting certificate. Conditional offer sent.",
    created_at: "2026-03-18T09:00:00Z",
    updated_at: "2026-04-14T10:00:00Z",
    created_by: "staff_darren",
  },
];

// Checks — Amara
store.candidateChecks = [
  {
    id: "chk_001", candidate_id: CAND_AMARA, check_type: "enhanced_dbs",
    status: "not_started", required: true, owner_id: "staff_darren",
    due_date: "2026-04-30", requested_at: null, received_at: null,
    verified_at: null, verified_by: null, concern_flag: false,
    concern_summary: null, override_used: false, override_reason: null,
    overridden_by: null, overridden_at: null, certificate_number: null,
    document_type: null, document_expiry: null, metadata: {},
    created_at: "2026-03-20T10:30:00Z", updated_at: "2026-03-20T10:30:00Z",
  },
  {
    id: "chk_002", candidate_id: CAND_AMARA, check_type: "right_to_work",
    status: "not_started", required: true, owner_id: "staff_darren",
    due_date: "2026-04-30", requested_at: null, received_at: null,
    verified_at: null, verified_by: null, concern_flag: false,
    concern_summary: null, override_used: false, override_reason: null,
    overridden_by: null, overridden_at: null, certificate_number: null,
    document_type: null, document_expiry: null, metadata: {},
    created_at: "2026-03-20T10:30:00Z", updated_at: "2026-03-20T10:30:00Z",
  },
  {
    id: "chk_003", candidate_id: CAND_AMARA, check_type: "identity",
    status: "not_started", required: true, owner_id: "staff_darren",
    due_date: "2026-04-30", requested_at: null, received_at: null,
    verified_at: null, verified_by: null, concern_flag: false,
    concern_summary: null, override_used: false, override_reason: null,
    overridden_by: null, overridden_at: null, certificate_number: null,
    document_type: null, document_expiry: null, metadata: {},
    created_at: "2026-03-20T10:30:00Z", updated_at: "2026-03-20T10:30:00Z",
  },
  {
    id: "chk_004", candidate_id: CAND_AMARA, check_type: "references",
    status: "not_started", required: true, owner_id: "staff_darren",
    due_date: "2026-04-30", requested_at: null, received_at: null,
    verified_at: null, verified_by: null, concern_flag: false,
    concern_summary: null, override_used: false, override_reason: null,
    overridden_by: null, overridden_at: null, certificate_number: null,
    document_type: null, document_expiry: null, metadata: {},
    created_at: "2026-03-20T10:30:00Z", updated_at: "2026-03-20T10:30:00Z",
  },
  // Checks — Daniel
  {
    id: "chk_005", candidate_id: CAND_DANIEL, check_type: "enhanced_dbs",
    status: "not_started", required: true, owner_id: "staff_darren",
    due_date: "2026-04-28", requested_at: null, received_at: null,
    verified_at: null, verified_by: null, concern_flag: false,
    concern_summary: null, override_used: false, override_reason: null,
    overridden_by: null, overridden_at: null, certificate_number: null,
    document_type: null, document_expiry: null, metadata: {},
    created_at: "2026-03-22T14:00:00Z", updated_at: "2026-03-22T14:00:00Z",
  },
  {
    id: "chk_006", candidate_id: CAND_DANIEL, check_type: "right_to_work",
    status: "verified", required: true, owner_id: "staff_darren",
    due_date: "2026-04-28", requested_at: "2026-04-01T09:00:00Z",
    received_at: "2026-04-03T11:00:00Z", verified_at: "2026-04-03T14:00:00Z",
    verified_by: "staff_darren", concern_flag: false, concern_summary: null,
    override_used: false, override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: "UK Passport", document_expiry: "2031-05-10",
    metadata: {},
    created_at: "2026-03-22T14:00:00Z", updated_at: "2026-04-03T14:00:00Z",
  },
  {
    id: "chk_007", candidate_id: CAND_DANIEL, check_type: "identity",
    status: "verified", required: true, owner_id: "staff_darren",
    due_date: "2026-04-28", requested_at: "2026-04-01T09:00:00Z",
    received_at: "2026-04-03T11:00:00Z", verified_at: "2026-04-03T14:00:00Z",
    verified_by: "staff_darren", concern_flag: false, concern_summary: null,
    override_used: false, override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: "UK Passport", document_expiry: null,
    metadata: {},
    created_at: "2026-03-22T14:00:00Z", updated_at: "2026-04-03T14:00:00Z",
  },
  {
    id: "chk_008", candidate_id: CAND_DANIEL, check_type: "references",
    status: "in_progress", required: true, owner_id: "staff_darren",
    due_date: "2026-04-28", requested_at: "2026-04-01T09:00:00Z",
    received_at: null, verified_at: null, verified_by: null,
    concern_flag: false, concern_summary: null, override_used: false,
    override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: null, document_expiry: null,
    metadata: { refs_received: 1, refs_required: 2 },
    created_at: "2026-03-22T14:00:00Z", updated_at: "2026-04-10T09:00:00Z",
  },
  // Checks — Priscilla
  {
    id: "chk_009", candidate_id: CAND_PRISCILLA, check_type: "enhanced_dbs",
    status: "in_progress", required: true, owner_id: "staff_darren",
    due_date: "2026-05-01", requested_at: "2026-04-08T10:00:00Z",
    received_at: null, verified_at: null, verified_by: null,
    concern_flag: false, concern_summary: null, override_used: false,
    override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: null, document_expiry: null,
    metadata: { submitted_via: "DBS online portal", tracking_reference: "DBS-2026-78432" },
    created_at: "2026-03-18T09:00:00Z", updated_at: "2026-04-08T10:00:00Z",
  },
  {
    id: "chk_010", candidate_id: CAND_PRISCILLA, check_type: "right_to_work",
    status: "verified", required: true, owner_id: "staff_darren",
    due_date: "2026-05-01", requested_at: "2026-03-28T09:00:00Z",
    received_at: "2026-03-30T10:00:00Z", verified_at: "2026-03-30T11:00:00Z",
    verified_by: "staff_darren", concern_flag: false, concern_summary: null,
    override_used: false, override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: "British Passport", document_expiry: "2029-11-22",
    metadata: {},
    created_at: "2026-03-18T09:00:00Z", updated_at: "2026-03-30T11:00:00Z",
  },
  {
    id: "chk_011", candidate_id: CAND_PRISCILLA, check_type: "identity",
    status: "verified", required: true, owner_id: "staff_darren",
    due_date: "2026-05-01", requested_at: "2026-03-28T09:00:00Z",
    received_at: "2026-03-30T10:00:00Z", verified_at: "2026-03-30T11:00:00Z",
    verified_by: "staff_darren", concern_flag: false, concern_summary: null,
    override_used: false, override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: "British Passport", document_expiry: null,
    metadata: {},
    created_at: "2026-03-18T09:00:00Z", updated_at: "2026-03-30T11:00:00Z",
  },
  {
    id: "chk_012", candidate_id: CAND_PRISCILLA, check_type: "references",
    status: "verified", required: true, owner_id: "staff_darren",
    due_date: "2026-05-01", requested_at: "2026-03-28T09:00:00Z",
    received_at: "2026-04-10T14:00:00Z", verified_at: "2026-04-11T09:00:00Z",
    verified_by: "staff_darren", concern_flag: false, concern_summary: null,
    override_used: false, override_reason: null, overridden_by: null, overridden_at: null,
    certificate_number: null, document_type: null, document_expiry: null,
    metadata: { refs_received: 2, refs_required: 2 },
    created_at: "2026-03-18T09:00:00Z", updated_at: "2026-04-11T09:00:00Z",
  },
];

// References — Amara
store.candidateReferences = [
  {
    id: "ref_001", candidate_id: CAND_AMARA,
    referee_name: "Sarah Jenkins", referee_role: "Residential Manager",
    organisation_name: "Bright Futures Care Ltd",
    email: "s.jenkins@brightfutures.co.uk", phone: "01332 890123",
    relationship_to_candidate: "Direct line manager",
    is_most_recent_employer: true,
    requested_at: "2026-04-08T09:00:00Z", chased_at: null,
    received_at: null, structured_response: null,
    verbal_verification_completed: false, verbal_verified_by: null, verbal_verified_at: null,
    discrepancy_flag: false, discrepancy_notes: null, reliability_rating: null,
    status: "requested",
    created_at: "2026-04-08T09:00:00Z", updated_at: "2026-04-08T09:00:00Z",
  },
  {
    id: "ref_002", candidate_id: CAND_AMARA,
    referee_name: "Mark Bhatt", referee_role: "Senior Care Worker",
    organisation_name: "Bright Futures Care Ltd",
    email: "m.bhatt@brightfutures.co.uk", phone: null,
    relationship_to_candidate: "Colleague",
    is_most_recent_employer: false,
    requested_at: "2026-04-08T09:00:00Z", chased_at: null,
    received_at: null, structured_response: null,
    verbal_verification_completed: false, verbal_verified_by: null, verbal_verified_at: null,
    discrepancy_flag: false, discrepancy_notes: null, reliability_rating: null,
    status: "requested",
    created_at: "2026-04-08T09:00:00Z", updated_at: "2026-04-08T09:00:00Z",
  },
  // References — Daniel
  {
    id: "ref_003", candidate_id: CAND_DANIEL,
    referee_name: "Emma Holt", referee_role: "Registered Manager",
    organisation_name: "Turning Point Children's Services",
    email: "emma.holt@turningpoint.org", phone: "0115 234 5678",
    relationship_to_candidate: "Direct line manager",
    is_most_recent_employer: true,
    requested_at: "2026-04-01T09:00:00Z", chased_at: null,
    received_at: "2026-04-09T14:00:00Z",
    structured_response: {
      dates_of_employment_confirmed: true,
      role_confirmed: true,
      performance_rating: "good",
      disciplinary_concerns: false,
      safeguarding_concerns: false,
      would_re_employ: true,
      additional_comments: "Daniel is a reliable and compassionate care worker. He demonstrates a strong understanding of safeguarding and works well with young people with complex needs.",
    },
    verbal_verification_completed: true,
    verbal_verified_by: "staff_darren",
    verbal_verified_at: "2026-04-09T16:00:00Z",
    discrepancy_flag: false, discrepancy_notes: null, reliability_rating: "high",
    status: "satisfactory",
    created_at: "2026-04-01T09:00:00Z", updated_at: "2026-04-09T16:00:00Z",
  },
  {
    id: "ref_004", candidate_id: CAND_DANIEL,
    referee_name: "Paul Reeves", referee_role: "Deputy Manager",
    organisation_name: "Kingsway Residential Care",
    email: "paul.reeves@kingsway.care", phone: null,
    relationship_to_candidate: "Previous line manager",
    is_most_recent_employer: false,
    requested_at: "2026-04-01T09:00:00Z", chased_at: "2026-04-12T09:00:00Z",
    received_at: null, structured_response: null,
    verbal_verification_completed: false, verbal_verified_by: null, verbal_verified_at: null,
    discrepancy_flag: false, discrepancy_notes: null, reliability_rating: null,
    status: "chased",
    created_at: "2026-04-01T09:00:00Z", updated_at: "2026-04-12T09:00:00Z",
  },
  // References — Priscilla
  {
    id: "ref_005", candidate_id: CAND_PRISCILLA,
    referee_name: "Jane Kimber", referee_role: "Registered Manager",
    organisation_name: "Heatherwood Children's Services",
    email: "j.kimber@heatherwood.co.uk", phone: "0116 876 5432",
    relationship_to_candidate: "Direct line manager",
    is_most_recent_employer: true,
    requested_at: "2026-03-28T09:00:00Z", chased_at: null,
    received_at: "2026-04-05T11:00:00Z",
    structured_response: {
      dates_of_employment_confirmed: true,
      role_confirmed: true,
      performance_rating: "excellent",
      disciplinary_concerns: false,
      safeguarding_concerns: false,
      would_re_employ: true,
      additional_comments: "Priscilla is an exceptional team leader. She has a natural ability to support both young people and staff teams. I have no hesitation in recommending her.",
    },
    verbal_verification_completed: true,
    verbal_verified_by: "staff_darren",
    verbal_verified_at: "2026-04-05T14:00:00Z",
    discrepancy_flag: false, discrepancy_notes: null, reliability_rating: "high",
    status: "satisfactory",
    created_at: "2026-03-28T09:00:00Z", updated_at: "2026-04-05T14:00:00Z",
  },
  {
    id: "ref_006", candidate_id: CAND_PRISCILLA,
    referee_name: "Richard Park", referee_role: "Head of Operations",
    organisation_name: "Heatherwood Children's Services",
    email: "r.park@heatherwood.co.uk", phone: "0116 876 5433",
    relationship_to_candidate: "Senior manager",
    is_most_recent_employer: false,
    requested_at: "2026-03-28T09:00:00Z", chased_at: null,
    received_at: "2026-04-10T14:00:00Z",
    structured_response: {
      dates_of_employment_confirmed: true,
      role_confirmed: true,
      performance_rating: "excellent",
      disciplinary_concerns: false,
      safeguarding_concerns: false,
      would_re_employ: true,
      additional_comments: "Priscilla consistently led her team to high standards. A thoroughly professional and safeguarding-conscious practitioner.",
    },
    verbal_verification_completed: true,
    verbal_verified_by: "staff_darren",
    verbal_verified_at: "2026-04-10T16:00:00Z",
    discrepancy_flag: false, discrepancy_notes: null, reliability_rating: "high",
    status: "satisfactory",
    created_at: "2026-03-28T09:00:00Z", updated_at: "2026-04-10T16:00:00Z",
  },
];

// Conditional offer for Priscilla
store.conditionalOffers = [
  {
    id: "offer_001", candidate_id: CAND_PRISCILLA,
    status: "conditional_sent",
    conditional_offer_sent_at: "2026-04-12T10:00:00Z",
    proposed_start_date: "2026-05-12",
    salary: 32000, hours: 40, probation_months: 6,
    conditions: ["Clear enhanced DBS certificate", "Satisfactory occupational health screening"],
    exceptional_start: false,
    exceptional_start_approved_by: null,
    exceptional_start_rationale: null,
    exceptional_start_risk_mitigation: null,
    final_clearance_completed_at: null,
    final_clearance_by: null,
    created_at: "2026-04-12T10:00:00Z", updated_at: "2026-04-12T10:00:00Z",
  },
];

// Audit entries
store.recruitmentAudit = [
  {
    id: generateId("aud"),
    candidate_id: CAND_AMARA, vacancy_id: "vac_001",
    actor_id: "staff_darren",
    event_type: "candidate_created",
    entity_type: "candidate_profile", entity_id: CAND_AMARA,
    before_state: null,
    after_state: { stage: "application_received", compliance_status: "not_started" },
    notes: "Application received via Indeed. Shortlisted for interview.",
    created_at: "2026-03-20T10:30:00Z",
  },
  {
    id: generateId("aud"),
    candidate_id: CAND_AMARA, vacancy_id: "vac_001",
    actor_id: "staff_darren",
    event_type: "stage_changed",
    entity_type: "candidate_profile", entity_id: CAND_AMARA,
    before_state: { stage: "sift" },
    after_state: { stage: "interview_scheduled" },
    notes: "Panel interview scheduled for 22 April 2026 at 10:00.",
    created_at: "2026-04-10T09:00:00Z",
  },
  {
    id: generateId("aud"),
    candidate_id: CAND_DANIEL, vacancy_id: "vac_001",
    actor_id: "staff_darren",
    event_type: "check_verified",
    entity_type: "candidate_check", entity_id: "chk_006",
    before_state: { status: "requested" },
    after_state: { status: "verified", document_type: "UK Passport" },
    notes: "Right to work confirmed — UK passport sighted and verified in person.",
    created_at: "2026-04-03T14:00:00Z",
  },
  {
    id: generateId("aud"),
    candidate_id: CAND_DANIEL, vacancy_id: "vac_001",
    actor_id: "staff_darren",
    event_type: "reference_received",
    entity_type: "candidate_reference", entity_id: "ref_003",
    before_state: { status: "requested" },
    after_state: { status: "satisfactory" },
    notes: "Reference received from Emma Holt at Turning Point. Satisfactory. Verbal verification completed.",
    created_at: "2026-04-09T16:00:00Z",
  },
  {
    id: generateId("aud"),
    candidate_id: CAND_PRISCILLA, vacancy_id: "vac_002",
    actor_id: "staff_darren",
    event_type: "dbs_submitted",
    entity_type: "candidate_check", entity_id: "chk_009",
    before_state: { status: "not_started" },
    after_state: { status: "in_progress", metadata: { submitted_via: "DBS online portal", tracking_reference: "DBS-2026-78432" } },
    notes: "Enhanced DBS submitted via online portal. Tracking reference: DBS-2026-78432.",
    created_at: "2026-04-08T10:00:00Z",
  },
  {
    id: generateId("aud"),
    candidate_id: CAND_PRISCILLA, vacancy_id: "vac_002",
    actor_id: "staff_darren",
    event_type: "conditional_offer_sent",
    entity_type: "conditional_offer", entity_id: "offer_001",
    before_state: { status: "draft" },
    after_state: { status: "conditional_sent", salary: 32000, proposed_start_date: "2026-05-12" },
    notes: "Conditional offer letter sent to candidate. Conditions: clear DBS, occupational health clearance.",
    created_at: "2026-04-12T10:00:00Z",
  },
];

// Seed care forms
store.careForms = [
  {
    id: "form_001", home_id: "home_oak",
    title: "Alex W — Return from Missing Interview", form_type: "return_from_missing",
    status: "submitted", priority: "high",
    linked_child_id: "yp_alex", linked_staff_id: null,
    linked_incident_id: null, linked_shift_id: null, linked_task_id: null,
    description: "Return interview following MFC-2026-003 on 01 April 2026.",
    body: { questions_asked: ["Where were you?", "Who were you with?", "Are you safe?"], young_person_disclosed: "Alex was evasive but mentioned spending time in the park." },
    submitted_at: "2026-04-02T10:30:00Z", submitted_by: "staff_edward",
    reviewed_by: "staff_darren", reviewed_at: "2026-04-02T14:00:00Z",
    review_notes: "Return interview thorough. CS risk noted. Strategy discussion to follow.",
    approved_at: null, approved_by: null,
    due_date: "2026-04-02", tags: ["missing", "safeguarding", "yp_alex"],
    created_at: "2026-04-02T10:00:00Z", updated_at: "2026-04-02T14:00:00Z",
    created_by: "staff_edward", updated_by: "staff_darren",
  },
  {
    id: "form_002", home_id: "home_oak",
    title: "Casey T — CAMHS Risk Assessment (April 2026)", form_type: "risk_assessment",
    status: "approved", priority: "high",
    linked_child_id: "yp_casey", linked_staff_id: null,
    linked_incident_id: null, linked_shift_id: null, linked_task_id: null,
    description: "Monthly risk assessment updated following medication refusal episode.",
    body: { risk_level: "medium", protective_factors: ["therapeutic relationship", "medication now stable"], risk_factors: ["self-harm history", "low mood"] },
    submitted_at: "2026-04-14T09:00:00Z", submitted_by: "staff_darren",
    reviewed_by: "staff_darren", reviewed_at: "2026-04-14T09:30:00Z",
    review_notes: "Risk level confirmed medium. CAMHS oversight maintained.",
    approved_at: "2026-04-14T09:30:00Z", approved_by: "staff_darren",
    due_date: "2026-04-15", tags: ["risk", "camhs", "yp_casey"],
    created_at: "2026-04-13T16:00:00Z", updated_at: "2026-04-14T09:30:00Z",
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "form_003", home_id: "home_oak",
    title: "Jordan T — Weekly Supervision Note (Week 15)", form_type: "supervision_record",
    status: "draft", priority: "medium",
    linked_child_id: "yp_jordan", linked_staff_id: "staff_ryan",
    linked_incident_id: null, linked_shift_id: null, linked_task_id: null,
    description: "Weekly therapeutic support session note.",
    body: {},
    submitted_at: null, submitted_by: null,
    reviewed_by: null, reviewed_at: null, review_notes: null,
    approved_at: null, approved_by: null,
    due_date: "2026-04-19", tags: ["supervision", "yp_jordan"],
    created_at: "2026-04-17T11:00:00Z", updated_at: "2026-04-17T11:00:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "form_004", home_id: "home_oak",
    title: "Oak House — Monthly Health & Safety Check", form_type: "health_safety_check",
    status: "pending_review", priority: "medium",
    linked_child_id: null, linked_staff_id: "staff_chervelle",
    linked_incident_id: null, linked_shift_id: null, linked_task_id: null,
    description: "Monthly H&S walkround checklist for April 2026.",
    body: { areas_checked: ["kitchen", "garden", "bedrooms", "fire exits"], issues_found: ["rear gate latch loose — padlock applied"] },
    submitted_at: "2026-04-15T16:00:00Z", submitted_by: "staff_chervelle",
    reviewed_by: null, reviewed_at: null, review_notes: null,
    approved_at: null, approved_by: null,
    due_date: "2026-04-16", tags: ["health_safety", "maintenance"],
    created_at: "2026-04-15T15:00:00Z", updated_at: "2026-04-15T16:00:00Z",
    created_by: "staff_chervelle", updated_by: "staff_chervelle",
  },
  {
    id: "form_005", home_id: "home_oak",
    title: "Alex W — Contextual Safeguarding Referral", form_type: "safeguarding_referral",
    status: "submitted", priority: "urgent",
    linked_child_id: "yp_alex", linked_staff_id: null,
    linked_incident_id: "inc_004", linked_shift_id: null, linked_task_id: null,
    description: "MASH referral following disclosure of possible criminal exploitation.",
    body: { referral_type: "MASH", reason: "Young person disclosed carrying items for older males. Criminal exploitation indicators present." },
    submitted_at: "2026-04-14T20:00:00Z", submitted_by: "staff_darren",
    reviewed_by: null, reviewed_at: null, review_notes: null,
    approved_at: null, approved_by: null,
    due_date: "2026-04-14", tags: ["safeguarding", "ce", "mash", "yp_alex", "urgent"],
    created_at: "2026-04-14T19:30:00Z", updated_at: "2026-04-14T20:00:00Z",
    created_by: "staff_darren", updated_by: "staff_darren",
  },
];

// Seed supervision records
store.supervisions = [
  // ── Completed supervisions (historical) ────────────────────────────────────
  {
    id: "sup_001", staff_id: "staff_edward", supervisor_id: "staff_ryan",
    type: "formal", scheduled_date: "2026-03-26", actual_date: "2026-03-26",
    duration_minutes: 60, status: "completed",
    discussion_points: "Performance review following incident involvement on 2026-02-28. Alex's contextual safeguarding risk — Edward's response was timely and appropriate. Discussed de-escalation techniques. Identified further training need: trauma-informed practice refresher.",
    actions_agreed: [
      { id: "act_001a", description: "Book trauma-informed practice refresher", owner: "staff_edward", due_date: "2026-04-15", status: "pending", completed_at: null },
      { id: "act_001b", description: "Shadow senior staff at next strategy discussion", owner: "staff_edward", due_date: "2026-04-30", status: "pending", completed_at: null },
    ],
    wellbeing_score: 7, staff_signature: true, supervisor_signature: true,
    next_date: "2026-04-19", linked_document_id: null, home_id: "home_oak",
    created_at: "2026-03-26T14:00:00Z", updated_at: "2026-03-26T15:10:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "sup_002", staff_id: "staff_anna", supervisor_id: "staff_ryan",
    type: "formal", scheduled_date: "2026-04-03", actual_date: "2026-04-03",
    duration_minutes: 55, status: "completed",
    discussion_points: "Monthly formal supervision. Anna managing a full caseload and on sleep-in rota. Discussed medication refusal incident on 2026-04-13 — handled well initially. Concern raised around fatigue from consecutive shifts. Reviewed MAR competency sign-off. Wellbeing discussed — Anna reported feeling supported.",
    actions_agreed: [
      { id: "act_002a", description: "Complete online GDPR refresher before next shift", owner: "staff_anna", due_date: "2026-04-10", status: "completed", completed_at: "2026-04-08T18:00:00Z" },
    ],
    wellbeing_score: 8, staff_signature: true, supervisor_signature: true,
    next_date: "2026-04-23", linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-03T10:00:00Z", updated_at: "2026-04-03T11:00:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "sup_003", staff_id: "staff_lackson", supervisor_id: "staff_ryan",
    type: "formal", scheduled_date: "2026-03-28", actual_date: "2026-03-28",
    duration_minutes: 50, status: "completed",
    discussion_points: "Monthly supervision. Lackson has settled well and relationships with young people are strong. Discussed Alex's missing pattern — Lackson was present during the second episode and handled it appropriately. Punctuality concern raised — two late arrivals this month. Agreed plan to address.",
    actions_agreed: [
      { id: "act_003a", description: "No further late arrivals — review at next supervision", owner: "staff_lackson", due_date: "2026-04-25", status: "pending", completed_at: null },
    ],
    wellbeing_score: 8, staff_signature: true, supervisor_signature: true,
    next_date: "2026-04-25", linked_document_id: null, home_id: "home_oak",
    created_at: "2026-03-28T11:30:00Z", updated_at: "2026-03-28T12:20:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  // ── Scheduled / upcoming supervisions ──────────────────────────────────────
  {
    id: "sup_004", staff_id: "staff_diane", supervisor_id: "staff_ryan",
    type: "formal", scheduled_date: "2026-04-20", actual_date: null,
    duration_minutes: null, status: "scheduled",
    discussion_points: "", actions_agreed: [],
    wellbeing_score: null, staff_signature: false, supervisor_signature: false,
    next_date: null, linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-10T09:00:00Z", updated_at: "2026-04-10T09:00:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "sup_005", staff_id: "staff_chervelle", supervisor_id: "staff_darren",
    type: "formal", scheduled_date: "2026-04-23", actual_date: null,
    duration_minutes: null, status: "scheduled",
    discussion_points: "", actions_agreed: [],
    wellbeing_score: null, staff_signature: false, supervisor_signature: false,
    next_date: null, linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-10T09:00:00Z", updated_at: "2026-04-10T09:00:00Z",
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "sup_006", staff_id: "staff_alex", supervisor_id: "staff_ryan",
    type: "probation_review", scheduled_date: "2026-04-20", actual_date: null,
    duration_minutes: null, status: "scheduled",
    discussion_points: "", actions_agreed: [],
    wellbeing_score: null, staff_signature: false, supervisor_signature: false,
    next_date: null, linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-08T09:00:00Z", updated_at: "2026-04-08T09:00:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "sup_007", staff_id: "staff_mirela", supervisor_id: "staff_darren",
    type: "probation_review", scheduled_date: "2026-04-25", actual_date: null,
    duration_minutes: null, status: "scheduled",
    discussion_points: "", actions_agreed: [],
    wellbeing_score: null, staff_signature: false, supervisor_signature: false,
    next_date: null, linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-08T09:00:00Z", updated_at: "2026-04-08T09:00:00Z",
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "sup_008", staff_id: "staff_ryan", supervisor_id: "staff_darren",
    type: "formal", scheduled_date: "2026-04-21", actual_date: null,
    duration_minutes: null, status: "scheduled",
    discussion_points: "", actions_agreed: [],
    wellbeing_score: null, staff_signature: false, supervisor_signature: false,
    next_date: null, linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-10T09:00:00Z", updated_at: "2026-04-10T09:00:00Z",
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  // ── Overdue (missed) ───────────────────────────────────────────────────────
  {
    id: "sup_009", staff_id: "staff_lackson", supervisor_id: "staff_ryan",
    type: "informal", scheduled_date: "2026-04-10", actual_date: null,
    duration_minutes: null, status: "scheduled",
    discussion_points: "", actions_agreed: [],
    wellbeing_score: null, staff_signature: false, supervisor_signature: false,
    next_date: null, linked_document_id: null, home_id: "home_oak",
    created_at: "2026-04-01T09:00:00Z", updated_at: "2026-04-01T09:00:00Z",
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
];

// ── Seed Documents ────────────────────────────────────────────────────────────

store.documents = [
  {
    id: "doc_1", title: "Behaviour Support Plan — Tyler",
    category: "behaviour_support", description: "Updated following MDT review on 10 April 2026",
    file_url: "#", file_name: "Tyler_BSP_v3.pdf", file_size: 245000, mime_type: "application/pdf",
    version: 3, previous_version_id: "doc_1_v2", requires_read_sign: true,
    linked_child_id: "yp_tyler", linked_staff_id: null, linked_incident_id: null,
    expiry_date: daysFromNow(180), tags: ["behaviour", "mandatory", "mdt"],
    home_id: "home_oak", created_at: daysFromNow(-5), updated_at: daysFromNow(-5),
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "doc_2", title: "Missing from Care Protocol",
    category: "missing_protocol", description: "Procedure to follow when a young person goes missing from the home",
    file_url: "#", file_name: "MFC_Protocol_2026.pdf", file_size: 180000, mime_type: "application/pdf",
    version: 2, previous_version_id: "doc_2_v1", requires_read_sign: true,
    linked_child_id: null, linked_staff_id: null, linked_incident_id: null,
    expiry_date: daysFromNow(365), tags: ["safeguarding", "mandatory"],
    home_id: "home_oak", created_at: daysFromNow(-30), updated_at: daysFromNow(-30),
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "doc_3", title: "Oak House — Child Protection Policy",
    category: "policy", description: "Whole-home child protection and safeguarding policy",
    file_url: "#", file_name: "CP_Policy_2026.pdf", file_size: 320000, mime_type: "application/pdf",
    version: 4, previous_version_id: "doc_3_v3", requires_read_sign: true,
    linked_child_id: null, linked_staff_id: null, linked_incident_id: null,
    expiry_date: daysFromNow(90), tags: ["policy", "safeguarding", "mandatory"],
    home_id: "home_oak", created_at: daysFromNow(-60), updated_at: daysFromNow(-10),
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "doc_4", title: "Risk Assessment — Jordan (Contextual Safeguarding)",
    category: "risk_assessment", description: "Dynamic risk assessment updated following recent intelligence",
    file_url: "#", file_name: "Jordan_RiskAssess_Apr26.pdf", file_size: 95000, mime_type: "application/pdf",
    version: 1, previous_version_id: null, requires_read_sign: false,
    linked_child_id: "yp_jordan", linked_staff_id: null, linked_incident_id: "inc_006",
    expiry_date: daysFromNow(30), tags: ["risk", "safeguarding"],
    home_id: "home_oak", created_at: daysFromNow(-3), updated_at: daysFromNow(-3),
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "doc_5", title: "Medication Administration Policy",
    category: "procedure", description: "Full procedure for MAR, controlled drugs, and PRN",
    file_url: "#", file_name: "Medication_Policy_v2.pdf", file_size: 210000, mime_type: "application/pdf",
    version: 2, previous_version_id: "doc_5_v1", requires_read_sign: true,
    linked_child_id: null, linked_staff_id: null, linked_incident_id: null,
    expiry_date: daysFromNow(270), tags: ["medication", "mandatory"],
    home_id: "home_oak", created_at: daysFromNow(-90), updated_at: daysFromNow(-15),
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "doc_6", title: "Ryan Forsythe — Employment Contract",
    category: "contract", description: "Permanent contract — Deputy Manager",
    file_url: "#", file_name: "Ryan_Contract_2024.pdf", file_size: 145000, mime_type: "application/pdf",
    version: 1, previous_version_id: null, requires_read_sign: false,
    linked_child_id: null, linked_staff_id: "staff_ryan", linked_incident_id: null,
    expiry_date: null, tags: ["hr", "contract"],
    home_id: "home_oak", created_at: daysFromNow(-400), updated_at: daysFromNow(-400),
    created_by: "staff_darren", updated_by: "staff_darren",
  },
  {
    id: "doc_7", title: "Reg 44 Report — March 2026",
    category: "reg44_report", description: "Independent person's report — March 2026",
    file_url: "#", file_name: "Reg44_March2026.pdf", file_size: 87000, mime_type: "application/pdf",
    version: 1, previous_version_id: null, requires_read_sign: false,
    linked_child_id: null, linked_staff_id: null, linked_incident_id: null,
    expiry_date: null, tags: ["ofsted", "regulation"],
    home_id: "home_oak", created_at: daysFromNow(-15), updated_at: daysFromNow(-15),
    created_by: "staff_alicia", updated_by: "staff_alicia",
  },
];

store.documentReadReceipts = [
  { id: "rr_1", document_id: "doc_1", staff_id: "staff_darren", read_at: daysFromNow(-4), signed_at: daysFromNow(-4) },
  { id: "rr_2", document_id: "doc_1", staff_id: "staff_ryan", read_at: daysFromNow(-3), signed_at: daysFromNow(-3) },
  { id: "rr_3", document_id: "doc_2", staff_id: "staff_darren", read_at: daysFromNow(-29), signed_at: daysFromNow(-29) },
  { id: "rr_4", document_id: "doc_2", staff_id: "staff_ryan", read_at: daysFromNow(-28), signed_at: daysFromNow(-28) },
  { id: "rr_5", document_id: "doc_2", staff_id: "staff_sarah", read_at: daysFromNow(-27), signed_at: daysFromNow(-27) },
  { id: "rr_6", document_id: "doc_3", staff_id: "staff_darren", read_at: daysFromNow(-8), signed_at: daysFromNow(-8) },
  { id: "rr_7", document_id: "doc_5", staff_id: "staff_darren", read_at: daysFromNow(-14), signed_at: daysFromNow(-14) },
  { id: "rr_8", document_id: "doc_5", staff_id: "staff_ryan", read_at: daysFromNow(-13), signed_at: daysFromNow(-13) },
  { id: "rr_9", document_id: "doc_5", staff_id: "staff_priya", read_at: daysFromNow(-12), signed_at: daysFromNow(-12) },
];

// ── Seed Expenses ─────────────────────────────────────────────────────────────

store.expenses = [
  {
    id: "exp_1", submitted_by: "staff_ryan", category: "young_person_activities",
    description: "Cinema trip for Tyler and Jordan — Odeon Derby", amount: 28.50,
    receipt_url: "#", date: daysFromNow(-3), status: "submitted",
    approved_by: null, approved_at: null, linked_child_id: "yp_tyler",
    payment_method: "personal card", home_id: "home_oak",
    created_at: daysFromNow(-3), updated_at: daysFromNow(-3),
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
  {
    id: "exp_2", submitted_by: "staff_sarah", category: "food_shopping",
    description: "Weekly food shop — Tesco Derby", amount: 142.80,
    receipt_url: "#", date: daysFromNow(-5), status: "approved",
    approved_by: "staff_darren", approved_at: daysFromNow(-4),
    linked_child_id: null, payment_method: "house card", home_id: "home_oak",
    created_at: daysFromNow(-5), updated_at: daysFromNow(-4),
    created_by: "staff_sarah", updated_by: "staff_darren",
  },
  {
    id: "exp_3", submitted_by: "staff_darren", category: "training",
    description: "Level 7 Diploma study materials — Books & online access", amount: 95.00,
    receipt_url: "#", date: daysFromNow(-10), status: "approved",
    approved_by: "staff_alicia", approved_at: daysFromNow(-9),
    linked_child_id: null, payment_method: "personal card", home_id: "home_oak",
    created_at: daysFromNow(-10), updated_at: daysFromNow(-9),
    created_by: "staff_darren", updated_by: "staff_alicia",
  },
  {
    id: "exp_4", submitted_by: "staff_priya", category: "transport",
    description: "Mileage — hospital appointment with Ayo (62 miles @ 0.45)", amount: 27.90,
    receipt_url: null, date: daysFromNow(-7), status: "submitted",
    approved_by: null, approved_at: null, linked_child_id: "yp_ayo",
    payment_method: "mileage", home_id: "home_oak",
    created_at: daysFromNow(-7), updated_at: daysFromNow(-7),
    created_by: "staff_priya", updated_by: "staff_priya",
  },
  {
    id: "exp_5", submitted_by: "staff_marcus", category: "maintenance",
    description: "Emergency plumber call-out — broken pipe in bathroom", amount: 185.00,
    receipt_url: "#", date: daysFromNow(-14), status: "paid",
    approved_by: "staff_darren", approved_at: daysFromNow(-13),
    linked_child_id: null, payment_method: "house card", home_id: "home_oak",
    created_at: daysFromNow(-14), updated_at: daysFromNow(-10),
    created_by: "staff_marcus", updated_by: "staff_darren",
  },
  {
    id: "exp_6", submitted_by: "staff_gemma", category: "clothing",
    description: "School uniform and shoes for Jordan (LA approved)", amount: 67.40,
    receipt_url: "#", date: daysFromNow(-1), status: "submitted",
    approved_by: null, approved_at: null, linked_child_id: "yp_jordan",
    payment_method: "personal card", home_id: "home_oak",
    created_at: daysFromNow(-1), updated_at: daysFromNow(-1),
    created_by: "staff_gemma", updated_by: "staff_gemma",
  },
  {
    id: "exp_7", submitted_by: "staff_ryan", category: "petty_cash",
    description: "Haircut for Tyler (arranged by social worker)", amount: 15.00,
    receipt_url: null, date: daysFromNow(-2), status: "draft",
    approved_by: null, approved_at: null, linked_child_id: "yp_tyler",
    payment_method: "petty cash", home_id: "home_oak",
    created_at: daysFromNow(-2), updated_at: daysFromNow(-2),
    created_by: "staff_ryan", updated_by: "staff_ryan",
  },
];

// ── Seed Audits ───────────────────────────────────────────────────────────────

store.audits = [
  {
    id: "a1", title: "Medication Administration Audit", category: "medication",
    date: daysFromNow(-14), completed_by: "staff_darren", score: 92, max_score: 100,
    status: "completed", findings: 1, actions: 1,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "a2", title: "Health & Safety Walk-around", category: "health_safety",
    date: daysFromNow(-7), completed_by: "staff_ryan", score: 87, max_score: 100,
    status: "completed", findings: 2, actions: 2,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "a3", title: "Records Quality Audit — Care Plans", category: "care_records",
    date: daysFromNow(7), completed_by: null, score: 0, max_score: 100,
    status: "scheduled", findings: 0, actions: 0,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "a4", title: "Finance Audit — Petty Cash", category: "finance",
    date: daysFromNow(-30), completed_by: "staff_darren", score: 78, max_score: 100,
    status: "completed", findings: 3, actions: 2,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "a5", title: "Safeguarding & Child Protection Audit", category: "safeguarding",
    date: daysFromNow(21), completed_by: null, score: 0, max_score: 100,
    status: "scheduled", findings: 0, actions: 0,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

// ── Seed Maintenance ──────────────────────────────────────────────────────────

store.maintenance = [
  {
    id: "m1", title: "Boiler annual service", category: "hvac",
    priority: "high", status: "scheduled", due_date: daysFromNow(14),
    assigned_to: "Homeserve", notes: "Annual gas safety certificate required", recurring: true,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "m2", title: "Fire alarm weekly test", category: "fire_safety",
    priority: "urgent", status: "completed", due_date: daysFromNow(-1),
    assigned_to: "staff_marcus", notes: "All zones tested — pass", recurring: true,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "m3", title: "Bathroom tap dripping — YP2 room", category: "plumbing",
    priority: "medium", status: "open", due_date: daysFromNow(3),
    assigned_to: null, notes: "Needs new washer", recurring: false,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "m4", title: "External gate lock faulty", category: "security",
    priority: "urgent", status: "open", due_date: daysFromNow(1),
    assigned_to: null, notes: "Latch not catching — security risk", recurring: false,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "m5", title: "PAT testing — electrical equipment", category: "electrical",
    priority: "medium", status: "open", due_date: daysFromNow(30),
    assigned_to: "Electrician TBC", notes: "Due annually", recurring: true,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "m6", title: "Deep clean — kitchen", category: "cleaning",
    priority: "low", status: "completed", due_date: daysFromNow(-7),
    assigned_to: "Cleaning company", notes: "Done — signed off by Ryan", recurring: true,
    home_id: "home_oak", created_by: "staff_darren", updated_by: "staff_darren",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

// ── Workforce Intelligence Seed Data ─────────────────────────────────────────

const NOW = new Date().toISOString();

store.competencyProfiles = [
  {
    id: "cprof_darren", staff_id: "staff_darren", home_id: "home_oak",
    current_stage: "registered_manager", target_stage: undefined,
    overall_readiness_score: 91,
    domain_scores: [],
    strengths: [
      "Exceptional safeguarding oversight and child protection decision-making",
      "Strategic leadership — holds the home's regulatory and governance framework",
      "ARIA utilisation — consistently drives ARIA-first intelligence processes",
    ],
    development_areas: [
      "Formal leadership coaching to sustain RM role long-term",
      "Level 5 Diploma in Leadership for Health and Social Care (in progress)",
    ],
    aria_narrative: "Darren demonstrates outstanding strategic and operational leadership. His competency profile across all domains places him firmly at Registered Manager level. ARIA identifies no blocking gaps for his current stage. Continued investment in formal qualification completion (Level 5) and reflective leadership practice is recommended.",
    last_assessed_at: "2026-03-15T10:00:00Z",
    next_review_date: "2026-09-15",
    created_at: NOW, updated_at: NOW,
  },
  {
    id: "cprof_ryan", staff_id: "staff_ryan", home_id: "home_oak",
    current_stage: "deputy_manager", target_stage: "registered_manager",
    overall_readiness_score: 74,
    domain_scores: [],
    strengths: [
      "Strong therapeutic relationships with young people — consistently positive feedback",
      "Risk management — demonstrates confident and proportionate decision-making",
      "Statutory compliance — accurate recording and regulatory knowledge",
    ],
    development_areas: [
      "Leadership under pressure — needs more exposure to complex RI challenge situations",
      "Formal Level 5 Diploma (enrolled, 40% complete)",
      "ARIA engagement — lower utilisation than expected at deputy level",
    ],
    aria_narrative: "Ryan has a strong foundation at Deputy Manager level with a clear pathway to Registered Manager. His primary development gap is formal leadership qualification and strategic ARIA use. ARIA recommends a structured 12-month succession development plan targeting RM readiness by Q1 2027.",
    last_assessed_at: "2026-03-15T10:00:00Z",
    next_review_date: "2026-09-15",
    created_at: NOW, updated_at: NOW,
  },
  {
    id: "cprof_edward", staff_id: "staff_edward", home_id: "home_oak",
    current_stage: "rsw", target_stage: "senior_rsw",
    overall_readiness_score: 62,
    domain_scores: [],
    strengths: [
      "Trauma-informed practice — empathetic and consistent approach",
      "Communication and recording — high-quality daily logs and handovers",
      "Self-care and resilience — actively uses reflective supervision",
    ],
    development_areas: [
      "Risk management — needs support with written risk assessment",
      "Leadership foundations — ready to begin senior RSW responsibilities",
      "Level 3 Diploma (first unit completed — ongoing)",
    ],
    aria_narrative: "Edward is performing above the standard RSW benchmark, particularly in trauma-informed practice. ARIA identifies him as a strong candidate for Senior RSW promotion within 6 months pending risk assessment upskill and Level 3 progress.",
    last_assessed_at: "2026-02-20T09:00:00Z",
    next_review_date: "2026-08-20",
    created_at: NOW, updated_at: NOW,
  },
  {
    id: "cprof_lackson", staff_id: "staff_lackson", home_id: "home_oak",
    current_stage: "rsw", target_stage: "team_leader",
    overall_readiness_score: 68,
    domain_scores: [],
    strengths: [
      "Safeguarding — confident recogniser and reporter",
      "Equality, diversity and inclusion — cultural competence is exceptional",
      "Therapeutic relationships — creative and consistent with all young people",
    ],
    development_areas: [
      "Leadership & supervision — limited experience line-managing others",
      "Statutory compliance — occasional gaps in recording timeliness",
      "Level 3 Diploma (in progress, 60% complete)",
    ],
    aria_narrative: "Lackson demonstrates strong practice and cultural intelligence. His EDI competence is a model for the team. ARIA recommends structured leadership exposure (buddy supervision, co-leading team meetings) as preparation for Team Leader candidacy within 9 months.",
    last_assessed_at: "2026-02-20T09:00:00Z",
    next_review_date: "2026-08-20",
    created_at: NOW, updated_at: NOW,
  },
  {
    id: "cprof_anna", staff_id: "staff_anna", home_id: "home_oak",
    current_stage: "rsw", target_stage: "senior_rsw",
    overall_readiness_score: 58,
    domain_scores: [],
    strengths: [
      "Medication management — accurate and diligent MAR completion",
      "Consistency — reliable and stable presence for young people",
    ],
    development_areas: [
      "Trauma-informed practice — further training required",
      "Communication — verbal confidence in multi-agency meetings",
      "Level 3 Diploma (not yet started)",
    ],
    aria_narrative: "Anna is a reliable and conscientious RSW. ARIA identifies medication administration as a key strength. Priority development areas are trauma-informed practice training and enrolment on Level 3 Diploma to unlock progression pathway.",
    last_assessed_at: "2026-03-01T09:00:00Z",
    next_review_date: "2026-09-01",
    created_at: NOW, updated_at: NOW,
  },
];

store.developmentPlans = [
  {
    id: "devplan_ryan_rm", staff_id: "staff_ryan", home_id: "home_oak",
    title: "Ryan Forsythe — Registered Manager Readiness Plan",
    from_stage: "deputy_manager", to_stage: "registered_manager",
    status: "active", aria_generated: true,
    aria_rationale: "ARIA analysis of Ryan's competency profile, supervision records, and practice observations indicates strong foundational capability with specific gaps in strategic leadership and regulatory governance. This plan targets RM readiness by Q1 2027.",
    actions: [
      { id: "dpa_r1", title: "Complete Level 5 Diploma in Leadership for Health and Social Care", description: "Complete remaining 60% of Level 5 Diploma. Target submission of final units by December 2026.", domain: "learning_and_professional_development", target_date: "2026-12-01", completed: false },
      { id: "dpa_r2", title: "Lead RI Challenge Log responses (x3)", description: "Take primary responsibility for drafting 3 responses to RI challenge log entries, supported by Darren.", domain: "leadership_and_supervision", target_date: "2026-09-01", completed: false },
      { id: "dpa_r3", title: "Attend Reg 45 review as lead author", description: "Co-author the next Reg 45 independent review with Alicia. Take lead on evidence collation.", domain: "statutory_compliance", target_date: "2026-07-01", completed: false },
      { id: "dpa_r4", title: "Shadow RI Governance Scorecard submission", description: "Participate fully in next RI scorecard governance meeting. Prepare briefing notes.", domain: "statutory_compliance", target_date: "2026-06-15", completed: true, completed_at: "2026-04-20T09:00:00Z", evidence_notes: "Ryan attended RI scorecard review on 20 April. Contributed detailed analysis of safeguarding themes. Darren noted excellent strategic thinking." },
      { id: "dpa_r5", title: "ARIA Strategic Analysis training", description: "Complete ARIA platform deep-dive: safeguarding scan, succession, oversight generator. Produce one strategic analysis per month.", domain: "learning_and_professional_development", target_date: "2026-06-01", completed: false },
    ],
    created_by: "staff_darren", created_at: NOW, updated_at: NOW,
  },
  {
    id: "devplan_edward_senior", staff_id: "staff_edward", home_id: "home_oak",
    title: "Edward Fitzpatrick — Senior RSW Development Plan",
    from_stage: "rsw", to_stage: "senior_rsw",
    status: "active", aria_generated: true,
    aria_rationale: "ARIA assessment identifies Edward as high-potential for Senior RSW promotion. His strengths in trauma-informed practice and communication are well above RSW benchmark. Risk assessment writing and early leadership exposure are the targeted development areas.",
    actions: [
      { id: "dpa_e1", title: "Complete Level 3 Diploma Unit 2 — Safeguarding", description: "Submit Level 3 Diploma Unit 2 assessment by June 2026.", domain: "safeguarding_and_child_protection", target_date: "2026-06-30", completed: false },
      { id: "dpa_e2", title: "Complete 3 written risk assessments with supervision review", description: "Write 3 risk assessments for young people's plans under Darren's supervision. Each to be reviewed and scored.", domain: "risk_management", target_date: "2026-07-01", completed: false },
      { id: "dpa_e3", title: "Lead one team handover briefing per month", description: "Chair the evening handover briefing monthly — develop confidence in leading practice discussions.", domain: "leadership_and_supervision", target_date: "2026-09-01", completed: false },
      { id: "dpa_e4", title: "Attend trauma-informed practice refresher workshop", description: "Complete Acacia Therapy Homes TIP refresher (online, 4 hours). Produce a reflective account.", domain: "trauma_informed_practice", target_date: "2026-05-31", completed: true, completed_at: "2026-04-10T11:00:00Z", evidence_notes: "Workshop completed. Reflective account submitted and approved by Ryan." },
    ],
    created_by: "staff_darren", created_at: NOW, updated_at: NOW,
  },
];

store.practiceObservations = [
  {
    id: "obs_001", staff_id: "staff_edward", home_id: "home_oak",
    observer_id: "staff_ryan", observation_date: "2026-04-10",
    context: "Evening keywork session with Alex W",
    domains_observed: ["therapeutic_relationships", "communication_and_recording", "safeguarding_and_child_protection"],
    narrative: "Edward facilitated a structured keywork session with Alex covering identity and self-esteem. His approach was warm, unhurried, and consistently trauma-informed. He followed Alex's lead and demonstrated excellent active listening. Recording in the keywork log was detailed and captured Alex's voice authentically.",
    strengths_noted: ["Child-led approach throughout", "Accurate and detailed recording", "Seamless safeguarding check-in"],
    areas_for_development: ["Could be more confident challenging avoidance — gently persisted but could go further"],
    outcome: "outstanding",
    score_adjustments: [
      { domain: "therapeutic_relationships", delta: 1 },
      { domain: "communication_and_recording", delta: 0 },
      { domain: "safeguarding_and_child_protection", delta: 0 },
    ],
    linked_development_plan_id: "devplan_edward_senior",
    signed_off_by_staff: true, signed_off_at: "2026-04-11T09:00:00Z",
    aria_summary: "Edward's observed practice in this keywork session meets the standard expected at Senior RSW level. ARIA recommends this observation is used as positive evidence in his promotion case.",
    created_at: NOW, updated_at: NOW,
  },
  {
    id: "obs_002", staff_id: "staff_lackson", home_id: "home_oak",
    observer_id: "staff_darren", observation_date: "2026-03-22",
    context: "Medication administration — morning round",
    domains_observed: ["statutory_compliance", "communication_and_recording", "self_care_and_resilience"],
    narrative: "Lackson administered morning medications with confidence and precision. MAR completion was accurate and timely. He communicated clearly with Casey about the medication, explaining its purpose without being patronising. Some minor delay in countersigning the controlled drugs register — flagged as learning point.",
    strengths_noted: ["Accurate MAR completion", "Clear communication with young person", "Calm and consistent manner"],
    areas_for_development: ["CD register countersigning to be done immediately — not at end of round"],
    outcome: "meets_standard",
    score_adjustments: [
      { domain: "statutory_compliance", delta: 0 },
      { domain: "communication_and_recording", delta: 0 },
    ],
    signed_off_by_staff: true, signed_off_at: "2026-03-22T14:00:00Z",
    aria_summary: "Lackson meets medication administration standards. The CD register timing issue is a minor procedural point, not a competency concern. Overall performance is solid.",
    created_at: NOW, updated_at: NOW,
  },
];

store.appraisals = [
  {
    id: "appr_ryan_2026", staff_id: "staff_ryan", home_id: "home_oak",
    appraisal_type: "annual_appraisal", appraisal_date: "2026-03-15",
    appraiser_id: "staff_darren", status: "completed",
    overall_rating: "good",
    competency_scores: {
      safeguarding_and_child_protection: 4,
      therapeutic_relationships: 4,
      trauma_informed_practice: 3,
      risk_management: 4,
      statutory_compliance: 4,
      communication_and_recording: 4,
      leadership_and_supervision: 3,
      self_care_and_resilience: 3,
      learning_and_professional_development: 3,
      equality_diversity_inclusion: 4,
    },
    key_achievements: "Led the introduction of the ARIA Key Work builder for all YP. Successfully managed two complex safeguarding referrals independently. Completed RI scorecard shadowing.",
    areas_for_improvement: "Level 5 Diploma completion — 60% remaining. ARIA strategic use needs to increase to monthly minimum.",
    objectives_next_period: "Complete Level 5 Diploma. Lead 3 RI Challenge Log responses. Take lead on Reg 45 evidence collation.",
    linked_development_plan_id: "devplan_ryan_rm",
    aria_insights: "Ryan's appraisal scores are consistent with a high-performing Deputy Manager with strong RM potential. ARIA recommends structured succession exposure in the next 12 months.",
    signed_by_staff: true, signed_at: "2026-03-17T10:00:00Z",
    next_review_date: "2027-03-15",
    created_at: NOW, updated_at: NOW,
  },
  {
    id: "appr_edward_prob", staff_id: "staff_edward", home_id: "home_oak",
    appraisal_type: "probation_review", appraisal_date: "2026-03-01",
    appraiser_id: "staff_ryan", status: "completed",
    overall_rating: "good",
    competency_scores: {
      safeguarding_and_child_protection: 3,
      therapeutic_relationships: 4,
      trauma_informed_practice: 4,
      risk_management: 2,
      statutory_compliance: 3,
      communication_and_recording: 4,
      self_care_and_resilience: 4,
      learning_and_professional_development: 3,
      equality_diversity_inclusion: 3,
    },
    key_achievements: "Consistent and empathetic practice with all young people. High-quality recording recognised by RI. Completed TIP refresher ahead of schedule.",
    areas_for_improvement: "Risk assessment writing — needs development. Level 3 Diploma to accelerate.",
    objectives_next_period: "Complete 3 supervised risk assessments. Submit Level 3 Unit 2 by June 2026.",
    linked_development_plan_id: "devplan_edward_senior",
    aria_insights: "Edward passed probation with commendation on therapeutic practice. ARIA identifies Senior RSW readiness trajectory of 4-6 months with focused risk management development.",
    signed_by_staff: true, signed_at: "2026-03-03T09:00:00Z",
    next_review_date: "2026-09-01",
    created_at: NOW, updated_at: NOW,
  },
  {
    id: "appr_anna_overdue", staff_id: "staff_anna", home_id: "home_oak",
    appraisal_type: "annual_appraisal", appraisal_date: "2026-04-01",
    appraiser_id: "staff_darren", status: "overdue",
    overall_rating: undefined,
    competency_scores: {},
    signed_by_staff: false,
    next_review_date: undefined,
    created_at: NOW, updated_at: NOW,
  },
  {
    id: "appr_lackson_annual", staff_id: "staff_lackson", home_id: "home_oak",
    appraisal_type: "annual_appraisal", appraisal_date: "2026-02-20",
    appraiser_id: "staff_darren", status: "completed",
    overall_rating: "good",
    competency_scores: {
      safeguarding_and_child_protection: 4,
      therapeutic_relationships: 5,
      trauma_informed_practice: 4,
      risk_management: 3,
      statutory_compliance: 3,
      communication_and_recording: 3,
      leadership_and_supervision: 3,
      self_care_and_resilience: 4,
      learning_and_professional_development: 3,
      equality_diversity_inclusion: 5,
    },
    key_achievements: "Outstanding therapeutic relationship with all three young people. Led a successful integration support plan for Casey. Demonstrated exceptional cultural sensitivity in family work.",
    areas_for_improvement: "Recording quality — needs to be more analytical. Leadership shadowing opportunities to be increased for Deputy readiness.",
    objectives_next_period: "Complete 4 shift lead shadowing sessions. Submit reflective piece on leadership. Achieve Level 3 Diploma Unit 3 by August 2026.",
    aria_insights: "Lackson's EDI and therapeutic relationship scores are the highest in the team. ARIA identifies Deputy Manager readiness potential within 6-9 months with structured leadership exposure.",
    signed_by_staff: true, signed_at: "2026-02-22T11:00:00Z",
    next_review_date: "2027-02-20",
    created_at: NOW, updated_at: NOW,
  },
  {
    id: "appr_chervelle_mid", staff_id: "staff_chervelle", home_id: "home_oak",
    appraisal_type: "mid_year", appraisal_date: "2026-01-15",
    appraiser_id: "staff_darren", status: "completed",
    overall_rating: "outstanding",
    competency_scores: {
      safeguarding_and_child_protection: 5,
      therapeutic_relationships: 4,
      trauma_informed_practice: 4,
      risk_management: 5,
      statutory_compliance: 5,
      communication_and_recording: 5,
      leadership_and_supervision: 4,
      self_care_and_resilience: 4,
      learning_and_professional_development: 4,
      equality_diversity_inclusion: 4,
    },
    key_achievements: "Led the Reg 45 evidence collation for Q4 2025 — resulting in the strongest submission in 2 years. Completed SEND specialist pathway qualification. Mentored two new RSWs.",
    areas_for_improvement: "Work–life balance monitoring — tendency to take on too many additional responsibilities. Delegate more to developing staff.",
    objectives_next_period: "Lead Reg 45 Q1 2026 submission. Complete coaching qualification module. Take 3 days' AL in next quarter (overdue).",
    aria_insights: "Chervelle is the strongest all-round practitioner in the team. ARIA recommends she be the RI evidence quality lead for the next inspection cycle. Outstanding across all statutory compliance domains.",
    signed_by_staff: true, signed_at: "2026-01-17T14:00:00Z",
    next_review_date: "2026-07-15",
    created_at: NOW, updated_at: NOW,
  },
  {
    id: "appr_diane_prob", staff_id: "staff_diane", home_id: "home_oak",
    appraisal_type: "probation_review", appraisal_date: "2026-03-15",
    appraiser_id: "staff_ryan", status: "completed",
    overall_rating: "good",
    competency_scores: {
      safeguarding_and_child_protection: 3,
      therapeutic_relationships: 3,
      trauma_informed_practice: 3,
      risk_management: 2,
      statutory_compliance: 3,
      communication_and_recording: 3,
      self_care_and_resilience: 3,
      learning_and_professional_development: 3,
      equality_diversity_inclusion: 3,
    },
    key_achievements: "Adapted quickly to residential childcare setting. Built positive relationships with all three young people in first 6 months. Completed all induction milestones on time.",
    areas_for_improvement: "Risk assessment framework — needs more experience with dynamic risk assessments. Lone working confidence to develop.",
    objectives_next_period: "Complete 5 dynamic risk assessments with supervision support. Achieve Level 3 Diploma Unit 1 by September 2026.",
    signed_by_staff: true, signed_at: "2026-03-16T10:00:00Z",
    next_review_date: "2026-09-15",
    created_at: NOW, updated_at: NOW,
  },
  {
    id: "appr_mirela_sched", staff_id: "staff_mirela", home_id: "home_oak",
    appraisal_type: "annual_appraisal", appraisal_date: "2026-05-10",
    appraiser_id: "staff_darren", status: "scheduled",
    overall_rating: undefined,
    competency_scores: {},
    signed_by_staff: false,
    next_review_date: undefined,
    created_at: NOW, updated_at: NOW,
  },
  {
    id: "appr_lackson_mid_sched", staff_id: "staff_lackson", home_id: "home_oak",
    appraisal_type: "mid_year", appraisal_date: "2026-05-20",
    appraiser_id: "staff_darren", status: "scheduled",
    overall_rating: undefined,
    competency_scores: {},
    signed_by_staff: false,
    next_review_date: undefined,
    created_at: NOW, updated_at: NOW,
  },
];

store.successionPlans = [
  {
    id: "succ_rm_001", home_id: "home_oak",
    role_title: "Registered Manager", target_stage: "registered_manager",
    urgency: "twelve_months",
    candidates: [
      { staff_id: "staff_ryan", readiness_score: 74, ready_now: false, estimated_ready_date: "2027-03-01", development_plan_id: "devplan_ryan_rm", notes: "Primary succession candidate. On track with RM readiness plan." },
    ],
    aria_narrative: "Oak House has one clear succession candidate for the Registered Manager role: Ryan Forsythe. His current readiness score of 74/100 reflects strong operational performance with a Level 5 qualification gap as the primary blocking factor. ARIA projects RM readiness by Q1 2027 subject to development plan milestones being met. No immediate risk to regulatory continuity — recommend activating succession plan review at 6-month mark.",
    review_date: "2026-10-01",
    created_by: "staff_darren", created_at: NOW, updated_at: NOW,
  },
  {
    id: "succ_deputy_001", home_id: "home_oak",
    role_title: "Deputy Manager", target_stage: "deputy_manager",
    urgency: "six_months",
    candidates: [
      { staff_id: "staff_edward", readiness_score: 62, ready_now: false, estimated_ready_date: "2026-12-01", development_plan_id: "devplan_edward_senior", notes: "Strong TI practice. Risk management development needed before Deputy consideration." },
      { staff_id: "staff_lackson", readiness_score: 68, ready_now: false, estimated_ready_date: "2026-11-01", notes: "EDI and therapeutic relationship strengths. Leadership exposure programme to be activated." },
    ],
    aria_narrative: "Two viable internal candidates exist for Deputy Manager succession: Edward Fitzpatrick and Lackson Phiri. Lackson holds a marginally higher readiness score. Both require 6-9 months of structured development. ARIA recommends running both on parallel leadership development tracks and conducting a formal comparison at Q3 2026.",
    review_date: "2026-07-01",
    created_by: "staff_darren", created_at: NOW, updated_at: NOW,
  },
];

store.inductionRecords = [
  {
    id: "induct_diane", staff_id: "staff_diane", home_id: "home_oak",
    start_date: "2025-01-15", target_completion_date: "2025-04-15",
    buddy_id: "staff_edward", line_manager_id: "staff_ryan",
    overall_status: "completed",
    probation_passed: true, probation_passed_at: "2026-03-15T10:00:00Z",
    items: [
      { id: "ii_d1", title: "Health & Safety induction", required_by_day: 1, status: "completed", completed_at: "2025-01-15T12:00:00Z", completed_by: "staff_ryan" },
      { id: "ii_d2", title: "Safeguarding policy and procedure", required_by_day: 1, status: "completed", completed_at: "2025-01-15T14:00:00Z", completed_by: "staff_darren" },
      { id: "ii_d3", title: "Medication awareness training", required_by_day: 7, status: "completed", completed_at: "2025-01-20T10:00:00Z", completed_by: "staff_ryan" },
      { id: "ii_d4", title: "Young people profiles read and signed", required_by_day: 7, status: "completed", completed_at: "2025-01-21T09:00:00Z", completed_by: "staff_diane" },
      { id: "ii_d5", title: "First supervised shift", required_by_day: 7, status: "completed", completed_at: "2025-01-17T20:00:00Z", completed_by: "staff_edward" },
      { id: "ii_d6", title: "Regulation 44 awareness", required_by_day: 28, status: "completed", completed_at: "2025-02-10T11:00:00Z", completed_by: "staff_darren" },
      { id: "ii_d7", title: "Level 3 Diploma enrolment", required_by_day: 90, status: "completed", completed_at: "2025-03-30T09:00:00Z", completed_by: "staff_diane" },
    ],
    notes: "Diane completed induction smoothly. Probation passed March 2026.",
    created_at: NOW, updated_at: NOW,
  },
  {
    id: "induct_alex", staff_id: "staff_alex", home_id: "home_oak",
    start_date: "2025-03-01", target_completion_date: "2025-06-01",
    buddy_id: "staff_lackson", line_manager_id: "staff_ryan",
    overall_status: "in_progress",
    items: [
      { id: "ii_a1", title: "Health & Safety induction", required_by_day: 1, status: "completed", completed_at: "2025-03-01T12:00:00Z", completed_by: "staff_ryan" },
      { id: "ii_a2", title: "Safeguarding policy and procedure", required_by_day: 1, status: "completed", completed_at: "2025-03-01T14:00:00Z", completed_by: "staff_darren" },
      { id: "ii_a3", title: "Medication awareness training", required_by_day: 7, status: "completed", completed_at: "2025-03-06T10:00:00Z", completed_by: "staff_ryan" },
      { id: "ii_a4", title: "Young people profiles read and signed", required_by_day: 7, status: "completed", completed_at: "2025-03-07T09:00:00Z", completed_by: "staff_alex" },
      { id: "ii_a5", title: "First supervised shift", required_by_day: 7, status: "completed", completed_at: "2025-03-03T20:00:00Z", completed_by: "staff_lackson" },
      { id: "ii_a6", title: "Regulation 44 awareness", required_by_day: 28, status: "completed", completed_at: "2025-03-25T11:00:00Z", completed_by: "staff_darren" },
      { id: "ii_a7", title: "Level 3 Diploma enrolment", required_by_day: 90, status: "not_started" },
    ],
    notes: "Alex (Bennett) progressing well. Level 3 enrolment overdue — chase at next supervision.",
    created_at: NOW, updated_at: NOW,
  },
];

store.qualifications = [
  { id: "qual_001", staff_id: "staff_darren", home_id: "home_oak", qualification_name: "Level 5 Diploma in Leadership for Health and Social Care", awarding_body: "CACHE", level: "Level 5", mandatory: true, regulatory_requirement: "Children's Homes Regs 2015 Reg 29 (RM qualification)", status: "in_progress", started_at: "2025-09-01", completed_at: undefined, expiry_date: undefined, created_at: NOW, updated_at: NOW },
  { id: "qual_002", staff_id: "staff_darren", home_id: "home_oak", qualification_name: "DBS Enhanced Check", awarding_body: "DBS Service", mandatory: true, regulatory_requirement: "Children's Homes Regs 2015 Reg 5", status: "completed", completed_at: "2024-02-01", expiry_date: "2027-02-01", certificate_ref: "DBS001234", created_at: NOW, updated_at: NOW },
  { id: "qual_003", staff_id: "staff_ryan", home_id: "home_oak", qualification_name: "Level 5 Diploma in Leadership for Health and Social Care", awarding_body: "CACHE", level: "Level 5", mandatory: false, status: "in_progress", started_at: "2025-06-01", created_at: NOW, updated_at: NOW },
  { id: "qual_004", staff_id: "staff_ryan", home_id: "home_oak", qualification_name: "DBS Enhanced Check", awarding_body: "DBS Service", mandatory: true, regulatory_requirement: "Children's Homes Regs 2015 Reg 5", status: "completed", completed_at: "2024-05-01", expiry_date: "2027-05-01", certificate_ref: "DBS001235", created_at: NOW, updated_at: NOW },
  { id: "qual_005", staff_id: "staff_edward", home_id: "home_oak", qualification_name: "Level 3 Diploma in Residential Childcare", awarding_body: "CACHE", level: "Level 3", mandatory: true, regulatory_requirement: "Children's Homes Regs 2015 Reg 32 (within 2 years)", status: "in_progress", started_at: "2025-01-01", created_at: NOW, updated_at: NOW },
  { id: "qual_006", staff_id: "staff_edward", home_id: "home_oak", qualification_name: "DBS Enhanced Check", awarding_body: "DBS Service", mandatory: true, status: "completed", completed_at: "2024-08-01", expiry_date: "2027-08-01", certificate_ref: "DBS002001", created_at: NOW, updated_at: NOW },
  { id: "qual_007", staff_id: "staff_lackson", home_id: "home_oak", qualification_name: "Level 3 Diploma in Residential Childcare", awarding_body: "CACHE", level: "Level 3", mandatory: true, regulatory_requirement: "Children's Homes Regs 2015 Reg 32", status: "in_progress", started_at: "2024-10-01", created_at: NOW, updated_at: NOW },
  { id: "qual_008", staff_id: "staff_anna", home_id: "home_oak", qualification_name: "Level 3 Diploma in Residential Childcare", awarding_body: "CACHE", level: "Level 3", mandatory: true, regulatory_requirement: "Children's Homes Regs 2015 Reg 32", status: "not_started", created_at: NOW, updated_at: NOW },
  { id: "qual_009", staff_id: "staff_anna", home_id: "home_oak", qualification_name: "Medication Administration (QCF)", mandatory: true, status: "completed", completed_at: "2024-05-15", expiry_date: "2026-05-15", created_at: NOW, updated_at: NOW },
  { id: "qual_010", staff_id: "staff_diane", home_id: "home_oak", qualification_name: "Level 3 Diploma in Residential Childcare", awarding_body: "CACHE", level: "Level 3", mandatory: true, status: "in_progress", started_at: "2025-03-30", created_at: NOW, updated_at: NOW },
  { id: "qual_011", staff_id: "staff_mirela", home_id: "home_oak", qualification_name: "Level 3 Diploma in Residential Childcare", awarding_body: "CACHE", level: "Level 3", mandatory: true, status: "not_started", created_at: NOW, updated_at: NOW },
  { id: "qual_012", staff_id: "staff_alex", home_id: "home_oak", qualification_name: "Level 3 Diploma in Residential Childcare", awarding_body: "CACHE", level: "Level 3", mandatory: true, status: "not_started", created_at: NOW, updated_at: NOW },
];

// Seed welfare check rounds (last 3 nights)
const welfareToday = todayStr();
const welfareYesterday = daysFromNow(-1);
const welfareTwoDaysAgo = daysFromNow(-2);

function makeWelfareRound(roundId: string, date: string, time: string, staffId: string, shiftType: string): WelfareCheckRound {
  const checks: WelfareCheck[] = [
    { id: `${roundId}_yp_alex`, child_id: "yp_alex", staff_id: staffId, home_id: "home_oak", check_date: date, check_time: time, status: time >= "22:00" || time < "06:00" ? "asleep" : "ok", location: "bedroom", mood: "settled", notes: "Settled and resting", door_locked: false, window_secure: true, room_temperature: "comfortable", created_at: NOW },
    { id: `${roundId}_yp_jordan`, child_id: "yp_jordan", staff_id: staffId, home_id: "home_oak", check_date: date, check_time: time, status: time >= "22:00" || time < "06:00" ? "asleep" : "ok", location: "bedroom", mood: "calm", notes: "Sleeping peacefully", door_locked: false, window_secure: true, room_temperature: "comfortable", created_at: NOW },
    { id: `${roundId}_yp_casey`, child_id: "yp_casey", staff_id: staffId, home_id: "home_oak", check_date: date, check_time: time, status: time >= "23:00" || time < "06:00" ? "asleep" : "awake", location: "bedroom", mood: time < "23:00" && time >= "22:00" ? "restless" : "settled", notes: time < "23:00" && time >= "22:00" ? "Still awake reading, reassured and settled" : "Asleep", door_locked: false, window_secure: true, room_temperature: "comfortable", created_at: NOW },
  ];
  return {
    id: roundId, home_id: "home_oak", staff_id: staffId, round_date: date, round_time: time, shift_type: shiftType,
    checks, all_children_checked: true, building_secure: true, fire_exits_clear: true, external_doors_locked: true, alarm_set: time === "22:00",
    completed_at: NOW, created_at: NOW,
  };
}

store.welfareCheckRounds = [
  makeWelfareRound("wcr_001", welfareYesterday, "22:00", "staff_anna", "sleep_in"),
  makeWelfareRound("wcr_002", welfareYesterday, "00:00", "staff_anna", "sleep_in"),
  makeWelfareRound("wcr_003", welfareYesterday, "02:00", "staff_anna", "sleep_in"),
  makeWelfareRound("wcr_004", welfareYesterday, "04:00", "staff_anna", "sleep_in"),
  makeWelfareRound("wcr_005", welfareYesterday, "06:00", "staff_anna", "sleep_in"),
  makeWelfareRound("wcr_006", welfareTwoDaysAgo, "22:00", "staff_lackson", "sleep_in"),
  makeWelfareRound("wcr_007", welfareTwoDaysAgo, "00:00", "staff_lackson", "sleep_in"),
  makeWelfareRound("wcr_008", welfareTwoDaysAgo, "02:00", "staff_lackson", "sleep_in"),
  makeWelfareRound("wcr_009", welfareTwoDaysAgo, "04:00", "staff_lackson", "sleep_in"),
  makeWelfareRound("wcr_010", welfareTwoDaysAgo, "06:00", "staff_lackson", "sleep_in"),
];
store.welfareChecks = store.welfareCheckRounds.flatMap((r) => r.checks);

// Seed outcome targets and reviews
const outBase = { home_id: "home_oak", linked_care_plan_id: null };
const outNow = new Date().toISOString();
store.outcomeTargets = [
  // Alex — 6 targets
  { ...outBase, id: "ot_001", child_id: "yp_alex", domain: "emotional_wellbeing", target_description: "Develop safe strategies to manage anger and frustration without aggression", success_criteria: "Use de-escalation techniques independently in 3 out of 5 situations", baseline_rating: 2 as const, current_rating: 3 as const, target_rating: 4 as const, direction: "improving" as const, status: "active" as const, review_date: daysFromNow(14), set_by: "staff_darren", set_date: daysFromNow(-60), yp_voice: "I want to stop getting angry all the time. Sometimes I can't help it though.", notes: "CAMHS engaged — weekly sessions started.", evidence_notes: "3 incidents this month vs 7 last month — clear reduction", created_at: outNow, updated_at: outNow },
  { ...outBase, id: "ot_002", child_id: "yp_alex", domain: "education", target_description: "Attend alternative provision consistently (4+ days per week)", success_criteria: "Achieve 80% attendance over a half-term period", baseline_rating: 2 as const, current_rating: 2 as const, target_rating: 4 as const, direction: "stable" as const, status: "active" as const, review_date: daysFromNow(7), set_by: "staff_darren", set_date: daysFromNow(-45), yp_voice: "School is boring but I like the workshop days.", notes: "Attendance 62% this half-term. Workshop days have full attendance.", evidence_notes: null, created_at: outNow, updated_at: outNow },
  { ...outBase, id: "ot_003", child_id: "yp_alex", domain: "identity", target_description: "Build positive sense of identity through activities and relationships", success_criteria: "Engage in at least 2 community activities per month", baseline_rating: 2 as const, current_rating: 3 as const, target_rating: 4 as const, direction: "improving" as const, status: "active" as const, review_date: daysFromNow(21), set_by: "staff_edward", set_date: daysFromNow(-50), yp_voice: "I like going to the gym. Makes me feel good about myself.", notes: "Started gym 3x/week. Joined youth club Thursdays.", evidence_notes: null, created_at: outNow, updated_at: outNow },
  { ...outBase, id: "ot_004", child_id: "yp_alex", domain: "health", target_description: "Register with GP and attend all health appointments", success_criteria: "LAC health assessment completed and dental check up to date", baseline_rating: 3 as const, current_rating: 4 as const, target_rating: 5 as const, direction: "improving" as const, status: "active" as const, review_date: daysFromNow(30), set_by: "staff_darren", set_date: daysFromNow(-90), yp_voice: null, notes: "LAC health assessment done. Dental appointment next week.", evidence_notes: "Health assessment uploaded to docs", created_at: outNow, updated_at: outNow },
  { ...outBase, id: "ot_005", child_id: "yp_alex", domain: "family_social", target_description: "Maintain positive contact with mum and rebuild trust", success_criteria: "Weekly phone calls maintained without distress patterns", baseline_rating: 2 as const, current_rating: 2 as const, target_rating: 3 as const, direction: "declining" as const, status: "active" as const, review_date: daysFromNow(7), set_by: "staff_darren", set_date: daysFromNow(-30), yp_voice: "I want to see mum but it makes me angry after.", notes: "Post-contact distress pattern noted — 3 of last 5 calls resulted in upset.", evidence_notes: null, created_at: outNow, updated_at: outNow },
  { ...outBase, id: "ot_006", child_id: "yp_alex", domain: "behaviour", target_description: "Reduce physical intervention frequency and engage with de-escalation plans", success_criteria: "No more than 1 PI per month with engagement in debrief", baseline_rating: 1 as const, current_rating: 2 as const, target_rating: 4 as const, direction: "improving" as const, status: "active" as const, review_date: daysFromNow(14), set_by: "staff_darren", set_date: daysFromNow(-60), yp_voice: "I don't want to be held. I'll try to walk away.", notes: "3 PIs this month — down from 5 last month. Engaged in all debriefs.", evidence_notes: "PI reduction log maintained by key worker", created_at: outNow, updated_at: outNow },
  // Jordan — 5 targets
  { ...outBase, id: "ot_007", child_id: "yp_jordan", domain: "education", target_description: "Achieve expected progress in English and Maths at Highfields Academy", success_criteria: "End of year report shows at least 'expected progress' in both subjects", baseline_rating: 3 as const, current_rating: 4 as const, target_rating: 5 as const, direction: "improving" as const, status: "active" as const, review_date: daysFromNow(30), set_by: "staff_anna", set_date: daysFromNow(-80), yp_voice: "I'm doing well in maths. English is harder but I'm trying.", notes: "PEP meeting confirmed good progress. Reading age up 6 months.", evidence_notes: "PEP report on file", created_at: outNow, updated_at: outNow },
  { ...outBase, id: "ot_008", child_id: "yp_jordan", domain: "health", target_description: "Maintain healthy eating and physical activity routine", success_criteria: "Participation in 3+ physical activities per week and balanced diet", baseline_rating: 4 as const, current_rating: 4 as const, target_rating: 5 as const, direction: "stable" as const, status: "active" as const, review_date: daysFromNow(30), set_by: "staff_anna", set_date: daysFromNow(-60), yp_voice: "I love football. Can we get more sessions?", notes: "Football Mon/Wed, swimming Saturdays. Eating well.", evidence_notes: null, created_at: outNow, updated_at: outNow },
  { ...outBase, id: "ot_009", child_id: "yp_jordan", domain: "emotional_wellbeing", target_description: "Feel settled and safe at Oak House", success_criteria: "Express feeling safe and happy in keywork sessions consistently", baseline_rating: 3 as const, current_rating: 4 as const, target_rating: 5 as const, direction: "improving" as const, status: "active" as const, review_date: daysFromNow(21), set_by: "staff_anna", set_date: daysFromNow(-45), yp_voice: "I like it here. The staff are nice. I feel safe.", notes: "Very settled. No incidents this month. Positive keywork engagement.", evidence_notes: null, created_at: outNow, updated_at: outNow },
  { ...outBase, id: "ot_010", child_id: "yp_jordan", domain: "independence", target_description: "Develop age-appropriate independence skills — cooking and laundry", success_criteria: "Prepare a simple meal independently and manage own laundry weekly", baseline_rating: 2 as const, current_rating: 3 as const, target_rating: 4 as const, direction: "improving" as const, status: "active" as const, review_date: daysFromNow(14), set_by: "staff_anna", set_date: daysFromNow(-40), yp_voice: "I made pasta last week! It was actually good.", notes: "Can make 3 simple meals. Does own laundry with prompting.", evidence_notes: null, created_at: outNow, updated_at: outNow },
  { ...outBase, id: "ot_011", child_id: "yp_jordan", domain: "family_social", target_description: "Maintain positive contact with family and develop peer friendships", success_criteria: "Regular family contact without distress; at least 2 peer social activities per month", baseline_rating: 3 as const, current_rating: 4 as const, target_rating: 5 as const, direction: "improving" as const, status: "active" as const, review_date: daysFromNow(21), set_by: "staff_anna", set_date: daysFromNow(-45), yp_voice: "I like seeing mum at the weekend. I've made friends at football.", notes: "Family contact consistently positive. 2 friends from football team.", evidence_notes: null, created_at: outNow, updated_at: outNow },
  // Casey — 5 targets
  { ...outBase, id: "ot_012", child_id: "yp_casey", domain: "health", target_description: "Establish consistent sleep routine and medication compliance", success_criteria: "Asleep by 22:30 on 5 out of 7 nights; medication taken as prescribed", baseline_rating: 2 as const, current_rating: 2 as const, target_rating: 4 as const, direction: "stable" as const, status: "active" as const, review_date: daysFromNow(7), set_by: "staff_chervelle", set_date: daysFromNow(-30), yp_voice: "I can't sleep. My brain won't stop thinking.", notes: "Melatonin dose under review with GP. Sleep diary maintained.", evidence_notes: "Sleep log shows avg 23:15 onset", created_at: outNow, updated_at: outNow },
  { ...outBase, id: "ot_013", child_id: "yp_casey", domain: "emotional_wellbeing", target_description: "Engage with therapeutic support and develop emotional literacy", success_criteria: "Attend CAMHS sessions and identify 5 emotional regulation strategies", baseline_rating: 2 as const, current_rating: 3 as const, target_rating: 4 as const, direction: "improving" as const, status: "active" as const, review_date: daysFromNow(14), set_by: "staff_chervelle", set_date: daysFromNow(-45), yp_voice: "Talking to Sam (therapist) helps. I'm learning about my feelings.", notes: "CAMHS fortnightly. Can now name 8 emotions. Using breathing techniques.", evidence_notes: null, created_at: outNow, updated_at: outNow },
  { ...outBase, id: "ot_014", child_id: "yp_casey", domain: "education", target_description: "Improve school attendance and engagement", success_criteria: "Achieve 90% attendance and positive behaviour reports", baseline_rating: 3 as const, current_rating: 3 as const, target_rating: 4 as const, direction: "stable" as const, status: "active" as const, review_date: daysFromNow(21), set_by: "staff_chervelle", set_date: daysFromNow(-40), yp_voice: "I like art and drama. The other lessons are okay.", notes: "Attendance 85%. Strong in creative subjects. Maths support in place.", evidence_notes: null, created_at: outNow, updated_at: outNow },
  { ...outBase, id: "ot_015", child_id: "yp_casey", domain: "self_care", target_description: "Develop consistent self-care routines — morning and evening", success_criteria: "Complete morning routine independently on 5 out of 7 days", baseline_rating: 2 as const, current_rating: 3 as const, target_rating: 4 as const, direction: "improving" as const, status: "active" as const, review_date: daysFromNow(14), set_by: "staff_chervelle", set_date: daysFromNow(-35), yp_voice: "I like choosing my own clothes now. I'm getting better at mornings.", notes: "Morning routine chart working well. Evening routine still needs prompting.", evidence_notes: null, created_at: outNow, updated_at: outNow },
  { ...outBase, id: "ot_016", child_id: "yp_casey", domain: "identity", target_description: "Explore heritage and build positive self-image", success_criteria: "Complete life story work and engage in 1 cultural activity per month", baseline_rating: 2 as const, current_rating: 3 as const, target_rating: 4 as const, direction: "improving" as const, status: "active" as const, review_date: daysFromNow(30), set_by: "staff_chervelle", set_date: daysFromNow(-50), yp_voice: "I want to know more about my background. The memory box is cool.", notes: "Life story book in progress. Memory box started.", evidence_notes: null, created_at: outNow, updated_at: outNow },
] as OutcomeTarget[];

// Seed outcome reviews (recent progress check-ins)
store.outcomeReviews = [
  { id: "or_001", target_id: "ot_001", child_id: "yp_alex", home_id: "home_oak", review_date: daysFromNow(-14), previous_rating: 2 as const, new_rating: 3 as const, direction: "improving" as const, reviewer_id: "staff_darren", reviewer_role: "Registered Manager", yp_participated: true, yp_voice: "I walked away from an argument yesterday. I'm proud of that.", progress_notes: "Alex demonstrating improved self-regulation. Used calm-down corner twice this fortnight. CAMHS input supporting progress.", barriers: "Trigger management still inconsistent when tired or post-contact with family.", next_steps: "Continue CAMHS. Add pre-contact preparation sessions.", created_at: outNow },
  { id: "or_002", target_id: "ot_006", child_id: "yp_alex", home_id: "home_oak", review_date: daysFromNow(-14), previous_rating: 1 as const, new_rating: 2 as const, direction: "improving" as const, reviewer_id: "staff_darren", reviewer_role: "Registered Manager", yp_participated: true, yp_voice: "I don't want to be held. I'll try harder.", progress_notes: "3 PIs this month vs 5 last month. Alex engaging in post-incident debriefs. Developing awareness of triggers.", barriers: "Court proceedings causing additional anxiety.", next_steps: "Pre-court preparation with social worker. Adjust risk plan.", created_at: outNow },
  { id: "or_003", target_id: "ot_007", child_id: "yp_jordan", home_id: "home_oak", review_date: daysFromNow(-7), previous_rating: 3 as const, new_rating: 4 as const, direction: "improving" as const, reviewer_id: "staff_anna", reviewer_role: "Key Worker", yp_participated: true, yp_voice: "I got a good mark in my maths test! I want to keep doing well.", progress_notes: "Jordan making excellent academic progress. Reading age improved. Teacher reports positive engagement.", barriers: null, next_steps: "Continue current support. Consider gifted/talented register for maths.", created_at: outNow },
  { id: "or_004", target_id: "ot_012", child_id: "yp_casey", home_id: "home_oak", review_date: daysFromNow(-7), previous_rating: 2 as const, new_rating: 2 as const, direction: "stable" as const, reviewer_id: "staff_chervelle", reviewer_role: "Key Worker", yp_participated: true, yp_voice: "I tried but I still can't sleep. The new medicine might help.", progress_notes: "Sleep onset still averaging 23:15. Melatonin dose reviewed — increased to 4mg trial starting this week. Good compliance with taking medication.", barriers: "Anxiety at bedtime — worries about family. Room temperature sometimes too warm.", next_steps: "Monitor new dose for 2 weeks. Consider weighted blanket. Explore bedtime wind-down routine.", created_at: outNow },
  { id: "or_005", target_id: "ot_013", child_id: "yp_casey", home_id: "home_oak", review_date: daysFromNow(-10), previous_rating: 2 as const, new_rating: 3 as const, direction: "improving" as const, reviewer_id: "staff_chervelle", reviewer_role: "Key Worker", yp_participated: true, yp_voice: "Sam taught me to breathe when I feel upset. It works sometimes.", progress_notes: "Casey now using 3 regulation strategies: deep breathing, counting, and drawing. CAMHS therapist reports good therapeutic engagement.", barriers: "Difficulty generalising strategies to school environment.", next_steps: "Share strategies with school SENCO. Consider visual prompt card.", created_at: outNow },
] as OutcomeReview[];

// ── Seed Reg 44 Visit Reports ─────────────────────────────────────────────────

const r44d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

store.reg44VisitReports = [
  {
    id: "v44_1", home_id: "home_oak", visit_date: r44d(-7),
    visitor: "Margaret Thompson (Independent)", duration: "4 hours",
    children_spoken: "3/3", staff_spoken: 4,
    records_reviewed: ["daily logs", "medication", "incidents"],
    overall_judgement: "Good — no immediate concerns.",
    strengths: [
      "Warm, positive relationships observed between staff and young people throughout the visit",
      "Medication records are excellent — accurate, timely, and countersigned consistently",
      "All three children spoke positively about their care and relationships with key workers",
    ],
    areas_for_development: [
      "Sleep log completion is inconsistent — 3 gaps identified in the past month where entries were missed on night shifts",
      "One fire drill is overdue by 12 days — last drill was 14 weeks ago against a quarterly requirement",
    ],
    recommendations: [
      { id: "rec44_1a", recommendation: "Implement a nightly checklist to ensure sleep logs are completed before end of each night shift. Consider adding a prompt to the night staff handover template.", priority: "medium", rm_response: "Accepted. Night shift checklist updated to include sleep log verification. Team briefed at handover. Will monitor compliance over next 4 weeks.", status: "in_progress", evidence_notes: null, completed_at: null },
      { id: "rec44_1b", recommendation: "Conduct fire drill within 7 days and review the scheduling system to prevent future overruns. Evidence drill completion to the visitor.", priority: "high", rm_response: "Fire drill completed on " + r44d(-5) + " (both day and evening scenarios). Calendar alerts set for 11-week intervals to provide a buffer before the quarterly deadline.", status: "completed", evidence_notes: "Fire drill log signed by all staff. Photos of drill attached.", completed_at: r44d(-5) },
      { id: "rec44_1c", recommendation: "Consider involving young people in reviewing and updating the house rules display, which appears dated.", priority: "low", rm_response: "Agreed — will add to next children's meeting agenda. Young people will co-design updated display.", status: "in_progress", evidence_notes: null, completed_at: null },
    ],
    previous_actions_status: "2 closed, 0 outstanding",
    report_sent_to_ofsted: true, report_sent_date: r44d(-5),
    notes: "Visitor had unrestricted access throughout. All children were relaxed and willing to speak. Staff were open and transparent.",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "v44_2", home_id: "home_oak", visit_date: r44d(-37),
    visitor: "Margaret Thompson", duration: "3.5 hours",
    children_spoken: "2/3 (Casey absent — school trip)", staff_spoken: 3,
    records_reviewed: ["daily logs", "supervision records", "key working sessions"],
    overall_judgement: "Good.",
    strengths: [
      "Home is clean, warm, and welcoming — presented to a high standard throughout",
      "Children's bedrooms are well-personalised reflecting their interests and identities",
      "Staff morale is notably positive — team appear well-supported and cohesive",
    ],
    areas_for_development: [
      "One staff supervision session was completed 3 days late — while content was thorough, the delay means it fell outside the 6-weekly frequency requirement",
    ],
    recommendations: [
      { id: "rec44_2a", recommendation: "Review supervision scheduling to build in buffer time. Consider a tracker that alerts the manager 1 week before supervision is due.", priority: "medium", rm_response: "Cornerstone supervision tracker now set to alert 7 days before due date. Deputy to cover if RM unavailable. No supervisions will be more than 1 day late going forward.", status: "completed", evidence_notes: "Tracker screenshot uploaded. Deputy coverage confirmed in team minutes.", completed_at: r44d(-30) },
      { id: "rec44_2b", recommendation: "Ensure Casey is spoken to at the next visit — visitor to consider scheduling an additional brief visit if Casey is unavailable again.", priority: "medium", rm_response: "Noted. Casey's school schedule shared with visitor to support planning. Casey confirmed she is happy to speak at next visit.", status: "completed", evidence_notes: null, completed_at: r44d(-8) },
    ],
    previous_actions_status: "All previous actions closed",
    report_sent_to_ofsted: true, report_sent_date: r44d(-35),
    notes: "Casey was on a school residential trip — positive that the home supports these opportunities. Spoke with Casey's key worker about her progress.",
    created_at: new Date(Date.now() - 37 * 86400000).toISOString(),
  },
  {
    id: "v44_3", home_id: "home_oak", visit_date: r44d(-67),
    visitor: "Margaret Thompson", duration: "4 hours",
    children_spoken: "3/3", staff_spoken: 4,
    records_reviewed: ["key working records", "behaviour logs", "TCI records", "placement plans"],
    overall_judgement: "Good with notable practice.",
    strengths: [
      "Outstanding key work records — detailed, reflective, and clearly child-centred with the young person's voice evident throughout",
      "Casey's progress was explicitly noted — significant reduction in incidents and improved school attendance over the past 3 months",
      "TCI (Therapeutic Crisis Intervention) use was appropriate, proportionate, and well-documented with thorough debriefs",
    ],
    areas_for_development: [
      "Garden furniture (wooden bench and table) is weathered and one bench leg is split — this presents a minor trip hazard and should be replaced",
    ],
    recommendations: [
      { id: "rec44_3a", recommendation: "Replace or remove damaged garden furniture to eliminate trip hazard. Ensure replacement furniture is suitable for outdoor use year-round.", priority: "medium", rm_response: "Damaged furniture removed immediately on day of visit. Replacement outdoor furniture ordered — weather-resistant composite material. Budget approved by RI. Expected delivery within 2 weeks.", status: "completed", evidence_notes: "Receipt for new furniture. Before/after photos.", completed_at: r44d(-55) },
    ],
    previous_actions_status: "All previous actions closed",
    report_sent_to_ofsted: true, report_sent_date: r44d(-65),
    notes: "Visitor commended the quality of key working and therapeutic approach. Recommended the home's key work model as potential good practice example for the organisation.",
    created_at: new Date(Date.now() - 67 * 86400000).toISOString(),
  },
  {
    id: "v44_4", home_id: "home_oak", visit_date: r44d(-97),
    visitor: "Margaret Thompson", duration: "3 hours",
    children_spoken: "3/3", staff_spoken: 3,
    records_reviewed: ["notifications register", "staffing records", "complaints log", "activities programme"],
    overall_judgement: "Requires improvement in one area.",
    strengths: [
      "Strong, trusting relationships evident between young people and their key workers",
      "Activities programme is varied, inclusive, and reflects each child's individual interests and goals",
      "Complaint handling is thorough — young people confirmed they know how to complain and feel heard",
    ],
    areas_for_development: [
      "One Ofsted notification was submitted 2 days late — the notification related to a Schedule 5 event and should have been made within 24 hours without exception",
      "The staffing plan for the home is not displayed in a location accessible to staff — regulation requires the staffing plan to be available",
    ],
    recommendations: [
      { id: "rec44_4a", recommendation: "Review the notification process to identify why the delay occurred. Implement a checklist for notifiable events that includes immediate notification as step one, before any other actions.", priority: "high", rm_response: "Root cause identified — RM was on leave and deputy was unsure of the classification. Notifiable events decision tree created and laminated for office. All senior staff briefed. Deputy completed notification training refresher.", status: "completed", evidence_notes: "Decision tree photographed and shared. Training attendance log.", completed_at: r44d(-90) },
      { id: "rec44_4b", recommendation: "Display the current staffing plan in the staff office and ensure it is updated whenever changes occur. All staff should know where to find it.", priority: "medium", rm_response: "Staffing plan now displayed in staff office (laminated, on noticeboard). Updated version uploaded to Cornerstone. All staff informed at team meeting.", status: "completed", evidence_notes: "Photo of noticeboard. Team meeting minutes.", completed_at: r44d(-92) },
      { id: "rec44_4c", recommendation: "Consider adding notification timescales to the staff induction pack so all staff (including agency) understand the urgency requirements.", priority: "low", rm_response: "Induction pack updated to include notification timescales and decision tree. Agency staff receive a summary card on arrival.", status: "completed", evidence_notes: "Updated induction pack PDF uploaded.", completed_at: r44d(-85) },
      { id: "rec44_4d", recommendation: "Review whether the activities programme is being consistently recorded in daily logs — two activity sessions were referenced by children but not recorded in the log.", priority: "low", rm_response: "Acknowledged. Staff reminded to log all structured activities. Daily log template updated to include a specific activities section to prompt recording.", status: "completed", evidence_notes: null, completed_at: r44d(-88) },
    ],
    previous_actions_status: "1 outstanding from previous visit (garden furniture — subsequently addressed)",
    report_sent_to_ofsted: true, report_sent_date: r44d(-95),
    notes: "Visitor expressed concern about the notification delay and requested written confirmation that the process has been reviewed. This has been provided.",
    created_at: new Date(Date.now() - 97 * 86400000).toISOString(),
  },
] as Reg44VisitReport[];

// Seed education records
store.educationRecords = [
  {
    id: "edu_001", child_id: "yp_alex", record_type: "attendance", title: "Full day attendance",
    date: daysFromNow(-1), school: "Derby Alternative Provision",
    details: "Alex attended all lessons. Positive feedback from English teacher — engaged well in creative writing task.",
    attendance_status: "present", linked_pep: false,
    outcome: undefined, follow_up_date: undefined, staff_id: "staff_edward", status: "open",
    home_id: "home_oak", created_at: daysFromNow(-1) + "T16:00:00Z",
  },
  {
    id: "edu_002", child_id: "yp_alex", record_type: "exclusion", title: "Fixed-term exclusion — 1 day",
    date: daysFromNow(-3), school: "Derby Alternative Provision",
    details: "Alex excluded for one day following verbal altercation with teaching assistant. Refused to leave classroom when asked. School applied fixed-term exclusion under behaviour policy.",
    attendance_status: "excluded", linked_pep: false,
    outcome: "Reintegration meeting booked with inclusion lead. Key worker to attend.",
    follow_up_date: daysFromNow(-1), staff_id: "staff_edward", status: "monitoring",
    home_id: "home_oak", created_at: daysFromNow(-3) + "T14:00:00Z",
  },
  {
    id: "edu_003", child_id: "yp_jordan", record_type: "attendance", title: "Full day attendance",
    date: daysFromNow(-2), school: "Highfields Academy",
    details: "Jordan attended full day. Completed maths assessment — scored 72%. Teacher notes improvement in concentration.",
    attendance_status: "present", linked_pep: false,
    outcome: undefined, follow_up_date: undefined, staff_id: "staff_anna", status: "open",
    home_id: "home_oak", created_at: daysFromNow(-2) + "T16:00:00Z",
  },
  {
    id: "edu_004", child_id: "yp_casey", record_type: "attendance", title: "Late arrival — transport issue",
    date: daysFromNow(-2), school: "Allestree Woodlands",
    details: "Casey arrived 25 minutes late due to vehicle breakdown on the school run. School notified in advance.",
    attendance_status: "late", linked_pep: false,
    outcome: undefined, follow_up_date: undefined, staff_id: "staff_chervelle", status: "open",
    home_id: "home_oak", created_at: daysFromNow(-2) + "T09:30:00Z",
  },
  {
    id: "edu_005", child_id: "yp_jordan", record_type: "pep_meeting", title: "PEP Review — Spring Term",
    date: daysFromNow(-7), school: "Highfields Academy",
    details: "Personal Education Plan review held with Virtual School Head, designated teacher, and key worker. Jordan making expected progress in English and exceeding in PE. Maths remains below expected — additional 1:1 tutoring agreed.",
    attendance_status: null, linked_pep: true,
    outcome: "1:1 maths tutoring to start next week. Reading challenge participation agreed. Next PEP review: Summer term.",
    follow_up_date: daysFromNow(56), staff_id: "staff_anna", status: "monitoring",
    home_id: "home_oak", created_at: daysFromNow(-7) + "T14:30:00Z",
  },
  {
    id: "edu_006", child_id: "yp_casey", record_type: "attainment", title: "English mock result — Grade 5",
    date: daysFromNow(-5), school: "Allestree Woodlands",
    details: "Casey achieved Grade 5 in English Language mock exam. Significant improvement from Grade 3 in autumn term. Teacher impressed with essay structure development.",
    attendance_status: null, linked_pep: true,
    outcome: "Positive feedback shared with Casey. Achievement celebrated at house meeting.",
    follow_up_date: undefined, staff_id: "staff_chervelle", status: "resolved",
    home_id: "home_oak", created_at: daysFromNow(-5) + "T15:30:00Z",
  },
  {
    id: "edu_007", child_id: "yp_alex", record_type: "pep_meeting", title: "Emergency PEP — post-exclusion",
    date: daysFromNow(-10), school: "Derby Alternative Provision",
    details: "Emergency PEP called following second exclusion this term. Discussed triggers, reintegration support, and whether provision remains suitable. Virtual School Head recommended additional behaviour support and possible assessment for EHCP.",
    attendance_status: null, linked_pep: true,
    outcome: "EHCP assessment referral to be made. Behaviour support plan updated. Reduced timetable for 2 weeks. Key worker to do daily school check-ins.",
    follow_up_date: daysFromNow(14), staff_id: "staff_darren", status: "monitoring",
    home_id: "home_oak", created_at: daysFromNow(-10) + "T10:00:00Z",
  },
  {
    id: "edu_008", child_id: "yp_casey", record_type: "achievement", title: "Selected for school debate team",
    date: daysFromNow(-1), school: "Allestree Woodlands",
    details: "Casey selected to represent Year 11 in inter-school debate competition. Topic: social media impact. Casey enthusiastic and has begun research.",
    attendance_status: null, linked_pep: false,
    outcome: "Competition date: 3 weeks. Staff to support with practice sessions at home.",
    follow_up_date: daysFromNow(21), staff_id: "staff_chervelle", status: "open",
    home_id: "home_oak", created_at: daysFromNow(-1) + "T16:30:00Z",
  },
  {
    id: "edu_009", child_id: "yp_alex", record_type: "concern", title: "Persistent absence pattern",
    date: daysFromNow(-15), school: "Derby Alternative Provision",
    details: "School flagged that Alex's attendance has dropped to 76% this term. Three unauthorised absences in last two weeks — Alex refusing to attend on mornings after difficult evenings. Pattern emerging.",
    attendance_status: null, linked_pep: false,
    outcome: "Attendance meeting with school booked. Morning routine review with Alex. Consider transport support.",
    follow_up_date: daysFromNow(-10), staff_id: "staff_edward", status: "monitoring",
    home_id: "home_oak", created_at: daysFromNow(-15) + "T10:00:00Z",
  },
  {
    id: "edu_010", child_id: "yp_jordan", record_type: "achievement", title: "PE Award — Student of the Week",
    date: daysFromNow(-4), school: "Highfields Academy",
    details: "Jordan received Student of the Week award for PE. Teacher praised leadership during team sports and positive attitude. Jordan visibly proud — brought certificate home.",
    attendance_status: null, linked_pep: false,
    outcome: "Certificate displayed in Jordan's room. Achievement shared at team meeting. Positive feedback to social worker.",
    follow_up_date: undefined, staff_id: "staff_anna", status: "resolved",
    home_id: "home_oak", created_at: daysFromNow(-4) + "T16:00:00Z",
  },
];

// ── Admission Referrals seed data ────────────────────────────────────────────
store.admissionReferrals = [
  {
    id: "ref_001", child_name: "Child A", date_of_birth: "2011-08-15", age: 14, gender: "male",
    ethnicity: "White British", referral_date: daysFromNow(-3), referral_source: "local_authority",
    referred_by: "Jennifer Brooks — Placement Team", local_authority: "Nottinghamshire County Council",
    status: "under_assessment",
    presenting_needs: ["Emotional and behavioural difficulties", "School exclusion", "Previous placement breakdown", "Attachment difficulties"],
    risk_factors: ["Self-harm history", "Absconding from previous placement", "Peer-on-peer aggression"],
    placement_history: "Two foster placements (both broke down), one residential placement (six months).",
    impact_assessment_complete: false, impact_assessment_notes: "",
    matching_considerations: "Need to consider impact on current cohort. Age-appropriate. Gender mix would be maintained.",
    decision_date: "", decision_by: "", decision_reason: "",
    estimated_placement_date: "", notes: "Urgent placement needed. Current placement giving 28 days notice.",
    staff_id: "staff_darren", home_id: "home_oak", created_at: daysFromNow(-3) + "T09:00:00Z",
  },
  {
    id: "ref_002", child_name: "Child B", date_of_birth: "2010-03-22", age: 16, gender: "female",
    ethnicity: "Mixed — White and Black Caribbean", referral_date: daysFromNow(-14), referral_source: "local_authority",
    referred_by: "Marcus Johnson — CLA Team", local_authority: "Derby City Council",
    status: "impact_assessment",
    presenting_needs: ["Learning difficulties", "Low self-esteem", "Family breakdown", "Mild anxiety"],
    risk_factors: ["Vulnerability to exploitation", "Previous missing episodes"],
    placement_history: "Long-term foster placement ended due to carer retirement. No previous residential.",
    impact_assessment_complete: true,
    impact_assessment_notes: "Impact assessment shows low risk to current group. Child B's needs align well with our model. Age and maturity would be positive addition. Safeguarding considerations re exploitation risk — addressed in risk management plan.",
    matching_considerations: "Good match for current cohort. Similar age to Casey. Would benefit from structured environment and therapeutic approach.",
    decision_date: "", decision_by: "", decision_reason: "",
    estimated_placement_date: daysFromNow(14),
    notes: "Positive referral. Strong matching potential. Panel scheduled for next week.",
    staff_id: "staff_darren", home_id: "home_oak", created_at: daysFromNow(-14) + "T10:00:00Z",
  },
  {
    id: "ref_003", child_name: "Child C", date_of_birth: "2012-11-01", age: 13, gender: "male",
    ethnicity: "Asian — Pakistani", referral_date: daysFromNow(-30), referral_source: "emergency",
    referred_by: "Emergency Duty Team — Derbyshire", local_authority: "Derbyshire County Council",
    status: "declined",
    presenting_needs: ["Sexual harmful behaviour", "Fire-setting", "Severe trauma history"],
    risk_factors: ["Sexual harmful behaviour towards peers", "History of fire-setting", "Severe emotional dysregulation"],
    placement_history: "Three placement breakdowns in 12 months. Currently in unregulated provision.",
    impact_assessment_complete: true,
    impact_assessment_notes: "Impact assessment concluded that placement would pose unacceptable risk to current young people, particularly given sexual harmful behaviour. Our home is not registered for this complexity level.",
    matching_considerations: "Not suitable for current cohort. Risk to existing children too high. Registration does not cover this level of need.",
    decision_date: daysFromNow(-25), decision_by: "staff_darren",
    decision_reason: "Declined — presenting needs exceed our Statement of Purpose and registration. Risk to existing children unacceptable.",
    estimated_placement_date: "",
    notes: "Referral declined with full rationale shared with LA. Suggested specialist provision.",
    staff_id: "staff_darren", home_id: "home_oak", created_at: daysFromNow(-30) + "T08:00:00Z",
  },
  {
    id: "ref_004", child_name: "Child D", date_of_birth: "2010-07-10", age: 15, gender: "non_binary",
    ethnicity: "White British", referral_date: daysFromNow(-45), referral_source: "agency",
    referred_by: "Compass Fostering — Rebecca Lane", local_authority: "Leicester City Council",
    status: "withdrawn",
    presenting_needs: ["Gender identity support needed", "Bullying at school", "Mild ADHD", "Attachment needs"],
    risk_factors: ["Self-harm (historical, resolved)", "Low-level substance experimentation"],
    placement_history: "Two foster placements. Current foster carer unable to provide gender-affirming support.",
    impact_assessment_complete: false, impact_assessment_notes: "",
    matching_considerations: "Good potential match. Would benefit from our therapeutic model.",
    decision_date: daysFromNow(-35), decision_by: "",
    decision_reason: "Withdrawn by LA — child placed with specialist foster carer.",
    estimated_placement_date: "",
    notes: "LA found alternative placement before we completed assessment.",
    staff_id: "staff_darren", home_id: "home_oak", created_at: daysFromNow(-45) + "T11:00:00Z",
  },
  {
    id: "ref_005", child_name: "Casey", date_of_birth: "2011-06-18", age: 14, gender: "female",
    ethnicity: "Mixed — White and Asian", referral_date: daysFromNow(-60), referral_source: "local_authority",
    referred_by: "Emma Watson — Derby CLA Team", local_authority: "Derby City Council",
    status: "placed",
    presenting_needs: ["Identity needs", "Previous placement concerns", "Low confidence", "Creative strengths"],
    risk_factors: ["Vulnerability to emotional harm", "Difficulty trusting adults"],
    placement_history: "One foster placement — ended due to placement concerns raised by child.",
    impact_assessment_complete: true,
    impact_assessment_notes: "Excellent match for current cohort. Casey's needs align with our strengths — identity work, creative expression, therapeutic model. Low risk to group.",
    matching_considerations: "Strong match. Similar age to peers. Would benefit from structured care and creative opportunities.",
    decision_date: daysFromNow(-50), decision_by: "staff_darren",
    decision_reason: "Accepted — strong match. Casey's needs align well with our Statement of Purpose.",
    estimated_placement_date: daysFromNow(-31),
    notes: "Casey placed successfully. Settling in well.",
    staff_id: "staff_darren", home_id: "home_oak", created_at: daysFromNow(-60) + "T09:00:00Z",
  },
];

// ── Health Record Entries seed data ──────────────────────────────────────────
store.healthRecordEntries = [
  {
    id: "hr_001", child_id: "yp_alex", date: daysFromNow(-30), record_type: "health_assessment",
    title: "Initial Health Assessment",
    details: "Comprehensive health assessment completed within 20 days of placement. General health good. BMI within normal range. Immunisations up to date. Dental: some decay noted — dental appointment booked. Eyesight: normal. Hearing: normal. CAMHS referral recommended due to emotional regulation difficulties.",
    professional: "Dr. S. Patel (GP)", status: "current",
    follow_up_date: daysFromNow(150), outcome: "Dental referral made. CAMHS referral submitted. Health action plan created.",
    staff_id: "staff_darren", home_id: "home_oak", created_at: daysFromNow(-30) + "T10:00:00Z",
  },
  {
    id: "hr_002", child_id: "yp_jordan", date: daysFromNow(-60), record_type: "allergy",
    title: "Penicillin Allergy — documented",
    details: "Known allergy to Penicillin documented from referral paperwork. Allergic reaction: rash and swelling. GP confirmed allergy. Allergy band provided. All staff briefed. School nurse notified. Alternative antibiotics noted in health plan.",
    professional: "Dr. A. Khan (GP)", status: "current",
    follow_up_date: null, outcome: "Allergy documented in health plan, MAR, and school records. EpiPen not required — reaction is mild.",
    staff_id: "staff_anna", home_id: "home_oak", created_at: daysFromNow(-60) + "T09:00:00Z",
  },
  {
    id: "hr_003", child_id: "yp_casey", date: daysFromNow(-14), record_type: "mental_health",
    title: "CAMHS Review — anxiety management",
    details: "CAMHS review session. Casey reports improved sleep over the past two weeks following sleep hygiene strategies. Anxiety levels reduced but still present around school transitions. Therapist recommends continuing current approach.",
    professional: "Dr. H. Williams (CAMHS)", status: "monitoring",
    follow_up_date: daysFromNow(42), outcome: "Continue current strategies. Next review in 6 weeks. No medication change.",
    staff_id: "staff_chervelle", home_id: "home_oak", created_at: daysFromNow(-14) + "T14:00:00Z",
  },
  {
    id: "hr_004", child_id: "yp_casey", date: daysFromNow(-7), record_type: "optical",
    title: "Eye test — prescription change",
    details: "Annual eye test at Specsavers. Slight prescription change detected. Casey has been reporting headaches during reading which is consistent with eye strain. New glasses ordered.",
    professional: "Specsavers Optometrist", status: "current",
    follow_up_date: daysFromNow(3), outcome: "New glasses ordered. 7-10 day wait. Headaches expected to resolve.",
    staff_id: "staff_diane", home_id: "home_oak", created_at: daysFromNow(-7) + "T13:30:00Z",
  },
  {
    id: "hr_005", child_id: "yp_jordan", date: daysFromNow(-90), record_type: "immunisation",
    title: "Flu vaccination",
    details: "Annual flu vaccination administered at school by school nurse. Jordan consented. No adverse reaction reported. Observed for 15 minutes post-vaccination.",
    professional: "School Nurse", status: "resolved",
    follow_up_date: null, outcome: "Vaccination recorded on health record. No side effects.",
    staff_id: "staff_anna", home_id: "home_oak", created_at: daysFromNow(-90) + "T11:00:00Z",
  },
  {
    id: "hr_006", child_id: "yp_alex", date: daysFromNow(-20), record_type: "referral",
    title: "CAMHS Referral — emotional regulation",
    details: "Referral submitted to Derby CAMHS for emotional regulation assessment. Referral includes history of physical interventions, self-harm risk, and trauma background. Priority assessment requested given safeguarding context.",
    professional: "Dr. S. Patel (GP)", status: "referred",
    follow_up_date: daysFromNow(10), outcome: "Referral accepted. Initial assessment booked — see appointments.",
    staff_id: "staff_darren", home_id: "home_oak", created_at: daysFromNow(-20) + "T10:00:00Z",
  },
  {
    id: "hr_007", child_id: "yp_casey", date: daysFromNow(-120), record_type: "dental",
    title: "Dental check-up — routine",
    details: "6-monthly dental check-up. No new cavities. Good oral hygiene. One small filling from previous visit holding well. Next check-up in 6 months.",
    professional: "Mr. Ahmed (Dentist)", status: "resolved",
    follow_up_date: daysFromNow(60), outcome: "Good dental health. Next check-up booked.",
    staff_id: "staff_chervelle", home_id: "home_oak", created_at: daysFromNow(-120) + "T10:00:00Z",
  },
  {
    id: "hr_008", child_id: "yp_alex", date: daysFromNow(-45), record_type: "condition",
    title: "Asthma — mild, controlled",
    details: "Pre-existing asthma documented from referral. Mild, well-controlled with salbutamol inhaler PRN. No hospital admissions. Triggers: cold weather, exercise. Asthma plan in place.",
    professional: "Dr. S. Patel (GP)", status: "current",
    follow_up_date: daysFromNow(90), outcome: "Inhaler available at home and school. Asthma plan reviewed annually.",
    staff_id: "staff_darren", home_id: "home_oak", created_at: daysFromNow(-45) + "T09:00:00Z",
  },
  {
    id: "hr_009", child_id: "yp_jordan", date: daysFromNow(-10), record_type: "growth",
    title: "Height & weight check",
    details: "Routine height and weight check. Jordan: Height 152cm (50th percentile), Weight 43kg (45th percentile). BMI within healthy range. Growth tracking normal. No concerns.",
    professional: "School Nurse", status: "resolved",
    follow_up_date: daysFromNow(180), outcome: "Growth within normal parameters. Next check in 6 months.",
    staff_id: "staff_anna", home_id: "home_oak", created_at: daysFromNow(-10) + "T11:00:00Z",
  },
  {
    id: "hr_010", child_id: "yp_casey", date: daysFromNow(-2), record_type: "condition",
    title: "Sleep disturbance — ongoing monitoring",
    details: "Casey continues to experience intermittent sleep difficulties. Current approach: consistent bedtime routine, no screens 1hr before bed, calm environment. GP reviewed — no medication change. CAMHS monitoring.",
    professional: "Dr. L. Chen (GP)", status: "monitoring",
    follow_up_date: daysFromNow(90), outcome: "Continue current sleep hygiene approach. Monitor and review at next GP appointment.",
    staff_id: "staff_chervelle", home_id: "home_oak", created_at: daysFromNow(-2) + "T09:00:00Z",
  },
];

// ── Risk Assessments seed data ────────────────────────────────────────────────
store.riskAssessments = [
  {
    id: "ra_001", child_id: "yp_alex", domain: "aggression", current_level: "high", previous_level: "very_high",
    trend: "decreasing", status: "current", assessed_by: "staff_darren", assessed_date: daysFromNow(-14),
    review_date: daysFromNow(16), triggers: ["Perceived unfairness", "Feeling ignored", "Tiredness"],
    indicators: ["Voice raising", "Pacing", "Clenched fists"],
    mitigations: [
      { strategy: "1:1 de-escalation using grounding techniques", responsible: "All staff", effectiveness: "effective" },
      { strategy: "Structured daily routine with visual schedule", responsible: "Key worker", effectiveness: "effective" },
    ],
    contingency_plan: "If physical aggression occurs, remove other YP from area. Use Team Teach holds only as last resort. Debrief within 24 hours.",
    child_views: "I know I get angry but I'm getting better at walking away. The breathing thing helps.",
    history_notes: "Significant improvement since Sept. Was very_high on arrival. Anger management sessions with CAMHS contributing to progress.",
    linked_incidents: ["inc_001"], home_id: "home_oak", created_at: daysFromNow(-60),
  },
  {
    id: "ra_002", child_id: "yp_jordan", domain: "absconding", current_level: "medium", previous_level: "high",
    trend: "decreasing", status: "current", assessed_by: "staff_anna", assessed_date: daysFromNow(-7),
    review_date: daysFromNow(23), triggers: ["Cancelled contact with mum", "Arguments with peers", "Boredom"],
    indicators: ["Withdrawing to bedroom", "Asking about bus routes", "Packing bag"],
    mitigations: [
      { strategy: "Proactive check-ins after contact sessions", responsible: "Key worker", effectiveness: "effective" },
      { strategy: "Evening activity programme to reduce boredom triggers", responsible: "Shift team", effectiveness: "partially_effective" },
    ],
    contingency_plan: "If missing, follow home missing protocol. Notify police after 1hr. Check known locations. Contact social worker.",
    child_views: "I don't run away anymore really. Sometimes I just need space and I go for a walk.",
    history_notes: "Missing episodes reduced from weekly to monthly. Last episode 3 weeks ago, returned voluntarily after 2 hours.",
    linked_incidents: [], home_id: "home_oak", created_at: daysFromNow(-45),
  },
  {
    id: "ra_003", child_id: "yp_casey", domain: "self_harm", current_level: "medium", previous_level: "medium",
    trend: "stable", status: "current", assessed_by: "staff_chervelle", assessed_date: daysFromNow(-10),
    review_date: daysFromNow(20), triggers: ["Identity-related distress", "Social media conflict", "Anniversaries"],
    indicators: ["Wearing long sleeves in warm weather", "Withdrawal from group activities", "Changes in eating"],
    mitigations: [
      { strategy: "Weekly therapeutic key work sessions", responsible: "Key worker", effectiveness: "effective" },
      { strategy: "Access to sensory toolkit in bedroom", responsible: "All staff", effectiveness: "partially_effective" },
      { strategy: "CAMHS sessions fortnightly", responsible: "CAMHS therapist", effectiveness: "effective" },
    ],
    contingency_plan: "If self-harm discovered, provide first aid, record on body map, notify manager and social worker. Do not remove items without discussion.",
    child_views: "Writing helps me more than anything. When I feel like hurting myself I try to write instead.",
    history_notes: "No new incidents in 6 weeks. Creative writing has become a positive coping strategy. CAMHS reports good engagement.",
    linked_incidents: [], home_id: "home_oak", created_at: daysFromNow(-90),
  },
  {
    id: "ra_004", child_id: "yp_alex", domain: "exploitation", current_level: "low", previous_level: "medium",
    trend: "decreasing", status: "current", assessed_by: "staff_darren", assessed_date: daysFromNow(-21),
    review_date: daysFromNow(9), triggers: ["Contact with older peers outside home", "Access to social media"],
    indicators: ["New possessions", "Secretive phone use", "Late returns"],
    mitigations: [
      { strategy: "Online safety sessions and phone monitoring agreement", responsible: "Key worker", effectiveness: "effective" },
      { strategy: "Contextual safeguarding mapping updated monthly", responsible: "RM", effectiveness: "effective" },
    ],
    contingency_plan: "If exploitation suspected, refer to MACE panel. Complete NRM referral if trafficking indicators present.",
    child_views: "I understand why you check my phone now. I know some people aren't really friends.",
    history_notes: "Previously county lines concerns. Multi-agency work through MACE has been effective. Alex now recognises grooming behaviours.",
    linked_incidents: [], home_id: "home_oak", created_at: daysFromNow(-120),
  },
];

// ── LAC Reviews seed data ─────────────────────────────────────────────────────
store.lacReviews = [
  {
    id: "lac_001", child_id: "yp_alex", date: daysFromNow(-30), review_type: "subsequent",
    iro: "Sarah Mitchell", venue: "Oak House — Quiet Room",
    attendees: [
      { name: "Sarah Mitchell", role: "IRO" }, { name: "Darren Laville", role: "Registered Manager" },
      { name: "Lisa Chen", role: "Social Worker" }, { name: "Alex", role: "Young Person" },
    ],
    child_participation: "attended",
    child_views: "I like it here. I want to stay. I'm doing better at school and I want to go to college next year.",
    key_discussions: ["Education progress and college plans", "Contact with birth family", "Anger management progress", "Pathway planning"],
    recommendations: ["Continue placement at Oak House", "Support college application", "Maintain CAMHS sessions"],
    outcome: "placement_continues",
    actions_agreed: [
      { action: "Support Alex with college application", owner: "Key worker", due_date: daysFromNow(30), completed: false },
      { action: "Arrange meeting with leaving care PA", owner: "Social worker", due_date: daysFromNow(14), completed: true },
      { action: "Update pathway plan", owner: "Social worker", due_date: daysFromNow(21), completed: false },
    ],
    next_review_date: daysFromNow(150), placement_stability: "stable", care_plan_updated: true,
    notes: "Positive review. Alex engaged well and contributed to all discussions. IRO pleased with progress.",
    recorded_by: "staff_darren", home_id: "home_oak", created_at: daysFromNow(-30),
  },
  {
    id: "lac_002", child_id: "yp_jordan", date: daysFromNow(-45), review_type: "subsequent",
    iro: "David Wright", venue: "Oak House — Office",
    attendees: [
      { name: "David Wright", role: "IRO" }, { name: "Darren Laville", role: "Registered Manager" },
      { name: "Mark Evans", role: "Social Worker" }, { name: "Anna Kovacs", role: "Key Worker" },
    ],
    child_participation: "views_submitted",
    child_views: "I don't want to come to the meeting but I wrote down what I think. I want more contact with mum and I want to stay here.",
    key_discussions: ["Contact arrangements with mother", "Missing episodes", "Leaving care preparation", "Housing options"],
    recommendations: ["Increase supervised contact to fortnightly", "Continue missing from care work", "Begin supported accommodation visits"],
    outcome: "care_plan_amended",
    actions_agreed: [
      { action: "Arrange fortnightly supervised contact", owner: "Social worker", due_date: daysFromNow(-30), completed: true },
      { action: "Visit two supported accommodation options", owner: "Key worker", due_date: daysFromNow(7), completed: false },
      { action: "Complete leaving care assessment", owner: "PA", due_date: daysFromNow(30), completed: false },
    ],
    next_review_date: daysFromNow(135), placement_stability: "some_concerns", care_plan_updated: true,
    notes: "Jordan chose not to attend but submitted written views. IRO noted improved engagement compared to previous review.",
    recorded_by: "staff_darren", home_id: "home_oak", created_at: daysFromNow(-45),
  },
  {
    id: "lac_003", child_id: "yp_casey", date: daysFromNow(-60), review_type: "first_review",
    iro: "Sarah Mitchell", venue: "Oak House — Living Room",
    attendees: [
      { name: "Sarah Mitchell", role: "IRO" }, { name: "Darren Laville", role: "Registered Manager" },
      { name: "Priya Sharma", role: "Social Worker" }, { name: "Casey", role: "Young Person" },
      { name: "Chervelle Duporte", role: "Key Worker" },
    ],
    child_participation: "attended",
    child_views: "I feel safe here. The staff listen to me. I want to keep going to the same school. I like my key worker.",
    key_discussions: ["Settling in at Oak House", "School attendance", "Identity and wellbeing", "CAMHS referral", "Life story work"],
    recommendations: ["Maintain current school placement", "Prioritise CAMHS referral", "Begin life story work when ready", "Explore cultural identity support"],
    outcome: "placement_continues",
    actions_agreed: [
      { action: "Fast-track CAMHS referral", owner: "Social worker", due_date: daysFromNow(-45), completed: true },
      { action: "Source cultural identity resources", owner: "Key worker", due_date: daysFromNow(-30), completed: true },
      { action: "Begin life story work", owner: "Key worker", due_date: daysFromNow(14), completed: false },
    ],
    next_review_date: daysFromNow(120), placement_stability: "stable", care_plan_updated: true,
    notes: "Very positive first review. Casey settling well. Strong relationship with key worker. IRO impressed with home's identity-affirming approach.",
    recorded_by: "staff_darren", home_id: "home_oak", created_at: daysFromNow(-60),
  },
];

// ── Behaviour Support Plans seed data ─────────────────────────────────────────
store.behaviourSupportPlans = [
  {
    id: "bsp_001", child_id: "yp_alex", created_date: daysFromNow(-90), created_by: "staff_darren",
    review_date: daysFromNow(0), last_reviewed: daysFromNow(-30), status: "active",
    diagnosis: ["ADHD", "Attachment disorder"],
    primary_behaviours: [
      { behaviour: "Verbal aggression towards peers", frequency: "weekly", severity: "medium", trend: "improving" },
      { behaviour: "Property damage when frustrated", frequency: "occasional", severity: "high", trend: "improving" },
    ],
    known_triggers: [
      { trigger: "Perceived unfairness or injustice", category: "emotional", likelihood: "high" },
      { trigger: "Transitions between activities", category: "routine_change", likelihood: "medium" },
      { trigger: "Tiredness or hunger", category: "sensory", likelihood: "medium" },
    ],
    early_warnings: ["Voice gets louder", "Pacing around room", "Refusing to make eye contact", "Verbal put-downs of others"],
    de_escalation: [
      { stage: "green", strategies: ["Verbal praise for positive choices", "Structured routine with visual schedule"], staff_approach: "Warm, predictable interactions. Give choices where possible." },
      { stage: "amber", strategies: ["Offer 1:1 time in quiet space", "Redirect to physical activity", "Use agreed calm-down signal"], staff_approach: "Lower voice, reduce demands, acknowledge feelings." },
      { stage: "red", strategies: ["Clear room of other YP", "Maintain safe distance", "Team Teach holds ONLY if imminent risk"], staff_approach: "Minimal language, calm presence, wait for de-escalation." },
    ],
    positive_strategies: [
      { strategy: "Daily check-in with key worker", frequency: "Daily", effectiveness: "highly_effective" },
      { strategy: "Grounding exercises (5-4-3-2-1)", frequency: "As needed", effectiveness: "effective" },
    ],
    rewards: [
      { reward: "Extra gaming time", earned_by: "Full day without verbal aggression", frequency: "Daily" },
      { reward: "Takeaway Friday", earned_by: "Positive week at school", frequency: "Weekly" },
    ],
    boundaries: [
      { boundary: "No physical aggression towards others", consequence: "Loss of evening privilege + debrief", rationale: "Safety of all residents" },
      { boundary: "Property must be respected", consequence: "Contribute to repair/replacement", rationale: "Teaches responsibility and accountability" },
    ],
    safety_plan: [
      { scenario: "Physical aggression towards peer", response: "Separate YP, Team Teach if necessary, debrief both parties within 24hrs", staff_required: 2 },
    ],
    communication_needs: "Alex responds best to calm, direct communication. Avoid sarcasm. Give processing time before expecting a response.",
    sensory_considerations: "Can be overstimulated by loud environments. Benefits from quiet space access.",
    child_views: "I know I need help with my temper. The breathing thing works. I want to stop breaking things.",
    parent_views: "N/A — no parental contact",
    professional_input: [
      { name: "Dr Sarah Khan", role: "CAMHS Psychologist", recommendation: "Continue anger management programme. Consider EMDR for trauma processing.", date: daysFromNow(-45) },
    ],
    staff_guidance: ["Always offer choice rather than demand", "Avoid confrontation in front of peers", "Debrief privately after incidents"],
    restrictive_interventions: [
      { intervention: "Team Teach standing hold", last_resort: true, authorised_by: "Darren Laville (RM)", conditions: "Only when imminent risk of serious harm to self or others" },
    ],
    review_history: [
      { date: daysFromNow(-30), reviewed_by: "staff_darren", changes: "Reduced frequency of verbal aggression from daily to weekly", outcome: "Plan continues with updated strategies" },
    ],
    home_id: "home_oak", created_at: daysFromNow(-90),
  },
  {
    id: "bsp_002", child_id: "yp_jordan", created_date: daysFromNow(-60), created_by: "staff_anna",
    review_date: daysFromNow(30), last_reviewed: daysFromNow(-15), status: "active",
    diagnosis: [],
    primary_behaviours: [
      { behaviour: "Absconding from home", frequency: "occasional", severity: "high", trend: "improving" },
      { behaviour: "Refusal to engage with routines", frequency: "weekly", severity: "low", trend: "stable" },
    ],
    known_triggers: [
      { trigger: "Cancelled contact with mum", category: "emotional", likelihood: "high" },
      { trigger: "Peer conflict", category: "social", likelihood: "medium" },
    ],
    early_warnings: ["Withdraws to bedroom", "Stops eating with group", "Asks about bus times"],
    de_escalation: [
      { stage: "green", strategies: ["Maintain predictable routine", "Proactive check-ins after contact"], staff_approach: "Gentle, non-intrusive. Respect need for space." },
      { stage: "amber", strategies: ["Offer walk with staff member", "1:1 conversation about feelings"], staff_approach: "Acknowledge emotions without pressure." },
      { stage: "red", strategies: ["Do not physically prevent leaving unless immediate danger", "Follow at safe distance", "Contact police if >1hr"], staff_approach: "Stay calm, state you care, give phone number." },
    ],
    positive_strategies: [
      { strategy: "Evening activity choices board", frequency: "Daily", effectiveness: "effective" },
      { strategy: "Walking group twice weekly", frequency: "Twice weekly", effectiveness: "highly_effective" },
    ],
    rewards: [
      { reward: "Weekend cinema trip", earned_by: "No absconding for 2 weeks", frequency: "Fortnightly" },
    ],
    boundaries: [
      { boundary: "Must tell staff before leaving the building", consequence: "Wellbeing conversation + risk assessment review", rationale: "Staff need to know where YP is for safeguarding" },
    ],
    safety_plan: [
      { scenario: "Jordan leaves without telling staff", response: "Follow missing protocol. Check known locations. Police after 1hr.", staff_required: 1 },
    ],
    communication_needs: "Jordan responds to low-key conversations. Avoids direct questions — use side-by-side activities (walking, cooking) to facilitate discussion.",
    sensory_considerations: "No specific sensory needs identified.",
    child_views: "I don't run away, I just need to get out sometimes. I always come back.",
    parent_views: "Mum wants more contact. Supports placement.",
    professional_input: [],
    staff_guidance: ["Don't interrogate when Jordan returns — welcome back warmly", "Offer food and drink on return", "Debrief next day, not immediately"],
    restrictive_interventions: [],
    review_history: [
      { date: daysFromNow(-15), reviewed_by: "staff_anna", changes: "Walking group added as proactive strategy", outcome: "Missing episodes reduced" },
    ],
    home_id: "home_oak", created_at: daysFromNow(-60),
  },
];

// ── Behaviour Log Seed Data ────────────────────────────────────────────────────

const behBase = { created_at: daysFromNow(0) };

store.behaviourLog = [
  // Alex — mix of positive and concerning (mostly evenings)
  { ...behBase, id: "beh_001", child_id: "yp_alex", date: daysFromNow(-1), time: "09:15", direction: "positive" as const, intensity: "low" as const, title: "Engaged well with morning routine", antecedent: "Staff used visual schedule", behaviour: "Completed breakfast and hygiene tasks without prompting", consequence: "Verbal praise and extra gaming time earned", trigger: "", strategy_used: "Visual schedule and choice board", outcome: "Alex cooperated fully. Positive start to the day.", recorded_by: "staff_darren" },
  { ...behBase, id: "beh_002", child_id: "yp_alex", date: daysFromNow(-2), time: "19:30", direction: "concerning" as const, intensity: "medium" as const, title: "Verbal aggression after phone call", antecedent: "Phone call with family member ended abruptly", behaviour: "Shouted at staff, used threatening language, paced corridor", consequence: "Offered quiet space and 1:1 time", trigger: "Family contact", strategy_used: "Offered quiet space and verbal de-escalation", outcome: "Alex settled after 15 minutes in his room. Apologised later.", recorded_by: "staff_edward" },
  { ...behBase, id: "beh_003", child_id: "yp_alex", date: daysFromNow(-3), time: "16:00", direction: "positive" as const, intensity: "low" as const, title: "Helped younger peer with homework", antecedent: "Jordan struggling with maths", behaviour: "Alex offered to help and showed patience", consequence: "Staff praised prosocial behaviour", trigger: "", strategy_used: "", outcome: "Positive interaction lasted 30 minutes. Both YP benefited.", recorded_by: "staff_anna" },
  { ...behBase, id: "beh_004", child_id: "yp_alex", date: daysFromNow(-4), time: "21:45", direction: "concerning" as const, intensity: "high" as const, title: "Property damage in bedroom", antecedent: "Request to turn off gaming console at bedtime", behaviour: "Alex threw controller at wall, cracking plaster. Shouted and kicked door.", consequence: "Staff maintained calm presence. Repair discussed next day.", trigger: "Perceived restriction on gaming", strategy_used: "Low-arousal approach and minimal language", outcome: "Alex eventually settled but refused debrief until morning.", recorded_by: "staff_chervelle" },
  { ...behBase, id: "beh_005", child_id: "yp_alex", date: daysFromNow(-5), time: "14:30", direction: "positive" as const, intensity: "low" as const, title: "Completed full day at school", antecedent: "Key worker preparation talk in morning", behaviour: "Attended all lessons, positive teacher feedback", consequence: "Takeaway Friday earned", trigger: "", strategy_used: "Morning preparation and social story", outcome: "Best school day this term. Alex proud of achievement.", recorded_by: "staff_ryan" },
  { ...behBase, id: "beh_006", child_id: "yp_alex", date: daysFromNow(-6), time: "18:45", direction: "concerning" as const, intensity: "medium" as const, title: "Refused evening meal and became argumentative", antecedent: "Peer made comment about Alex's appearance", behaviour: "Verbal aggression towards peer, refused to eat, went to room", consequence: "Staff offered alternative meal later. 1:1 discussion.", trigger: "Peer comment", strategy_used: "Verbal reassurance and space", outcome: "Alex regulated after 20 minutes. Ate snack later.", recorded_by: "staff_edward" },
  { ...behBase, id: "beh_007", child_id: "yp_alex", date: daysFromNow(-8), time: "10:30", direction: "positive" as const, intensity: "low" as const, title: "Positive key worker session", antecedent: "Scheduled 1:1 time with Edward", behaviour: "Engaged openly, discussed feelings about court proceedings", consequence: "Alex expressed gratitude for support", trigger: "", strategy_used: "", outcome: "Excellent engagement. Alex identified two coping strategies.", recorded_by: "staff_edward" },
  { ...behBase, id: "beh_008", child_id: "yp_alex", date: daysFromNow(-10), time: "20:15", direction: "concerning" as const, intensity: "severe" as const, title: "Self-harm attempt following difficult conversation", antecedent: "Discussion about upcoming court proceedings", behaviour: "Alex attempted to use sharp object. Staff intervened.", consequence: "PI required. Body map completed. Medical attention.", trigger: "Court proceedings anxiety", strategy_used: "Verbal de-escalation attempted but insufficient", outcome: "PI used. Alex assessed by ambulance. Settled with 1:1 support.", recorded_by: "staff_ryan" },
  { ...behBase, id: "beh_009", child_id: "yp_alex", date: daysFromNow(-12), time: "15:00", direction: "positive" as const, intensity: "low" as const, title: "Used grounding technique independently", antecedent: "Started becoming agitated during group activity", behaviour: "Alex recognised escalation and asked to leave. Used 5-4-3-2-1.", consequence: "Staff praised self-awareness", trigger: "", strategy_used: "Self-initiated grounding technique", outcome: "Excellent self-regulation. Returned to group after 10 minutes.", recorded_by: "staff_anna" },
  { ...behBase, id: "beh_010", child_id: "yp_alex", date: daysFromNow(-14), time: "22:00", direction: "concerning" as const, intensity: "medium" as const, title: "Late evening agitation and verbal threats", antecedent: "Peer conflict earlier unresolved", behaviour: "Pacing corridor, making verbal threats towards peer's bedroom door", consequence: "Staff separated YP, offered cooling off walk", trigger: "Unresolved peer conflict", strategy_used: "Physical separation and offered walk", outcome: "Alex calmed after walk with staff. Agreed to debrief in morning.", recorded_by: "staff_edward" },
  // Alex older entries (15-28 days ago) for trend comparison
  { ...behBase, id: "beh_011", child_id: "yp_alex", date: daysFromNow(-16), time: "19:00", direction: "concerning" as const, intensity: "high" as const, title: "Threw furniture in communal area", antecedent: "Lost board game to peer", behaviour: "Threw game pieces and overturned table", consequence: "Room cleared, Team Teach hold considered", trigger: "Losing game", strategy_used: "Low-arousal approach", outcome: "Settled after 25 minutes without PI. Apologised next day.", recorded_by: "staff_chervelle" },
  { ...behBase, id: "beh_012", child_id: "yp_alex", date: daysFromNow(-18), time: "08:00", direction: "concerning" as const, intensity: "medium" as const, title: "Refused morning routine entirely", antecedent: "Poor sleep night before", behaviour: "Refused to get up, verbally aggressive to staff", consequence: "Staff gave space, returned after 30 min", trigger: "Tiredness", strategy_used: "Space and time", outcome: "Eventually engaged at 10am. Quiet morning.", recorded_by: "staff_darren" },
  { ...behBase, id: "beh_013", child_id: "yp_alex", date: daysFromNow(-20), time: "17:30", direction: "positive" as const, intensity: "low" as const, title: "Cooked dinner with staff support", antecedent: "Life skills activity planned", behaviour: "Alex chose recipe and followed instructions", consequence: "Shared meal with group, positive feedback", trigger: "", strategy_used: "", outcome: "Great engagement. Alex enjoyed cooking spaghetti bolognese.", recorded_by: "staff_anna" },
  { ...behBase, id: "beh_014", child_id: "yp_alex", date: daysFromNow(-22), time: "14:50", direction: "concerning" as const, intensity: "high" as const, title: "Physical aggression towards staff following refused request", antecedent: "Community trip refused due to incomplete homework", behaviour: "Alex ran towards front door, became physically threatening", consequence: "PI required in corridor", trigger: "Refused community time", strategy_used: "Verbal de-escalation attempted", outcome: "Team Teach hold used for 2 minutes. Alex settled.", recorded_by: "staff_chervelle" },
  // Jordan — mostly positive, occasional concerning
  { ...behBase, id: "beh_015", child_id: "yp_jordan", date: daysFromNow(-1), time: "14:00", direction: "positive" as const, intensity: "low" as const, title: "Excellent engagement at football training", antecedent: "Regular scheduled activity", behaviour: "Full participation, positive interactions with teammates", consequence: "Praise from coach and staff", trigger: "", strategy_used: "", outcome: "Jordan returned in high spirits. Great social skills demonstrated.", recorded_by: "staff_lackson" },
  { ...behBase, id: "beh_016", child_id: "yp_jordan", date: daysFromNow(-3), time: "17:00", direction: "concerning" as const, intensity: "low" as const, title: "Withdrew to bedroom after contact call", antecedent: "Mum cancelled planned visit", behaviour: "Jordan went quiet, refused evening meal, stayed in room", consequence: "Staff checked in, offered space", trigger: "Cancelled family contact", strategy_used: "Gentle check-ins, respect for space", outcome: "Jordan came down for supper. Brief chat with key worker.", recorded_by: "staff_anna" },
  { ...behBase, id: "beh_017", child_id: "yp_jordan", date: daysFromNow(-5), time: "10:00", direction: "positive" as const, intensity: "low" as const, title: "Helped with younger children at community group", antecedent: "Community volunteering session", behaviour: "Supportive and patient with younger children", consequence: "Certificate from group leader", trigger: "", strategy_used: "", outcome: "Jordan beaming. Excellent prosocial behaviour.", recorded_by: "staff_chervelle" },
  { ...behBase, id: "beh_018", child_id: "yp_jordan", date: daysFromNow(-7), time: "08:30", direction: "positive" as const, intensity: "low" as const, title: "Independent morning routine without prompts", antecedent: "Established routine", behaviour: "Shower, breakfast, school prep all completed independently", consequence: "Earned cinema trip points", trigger: "", strategy_used: "", outcome: "Third consecutive independent morning. Excellent progress.", recorded_by: "staff_ryan" },
  { ...behBase, id: "beh_019", child_id: "yp_jordan", date: daysFromNow(-9), time: "16:30", direction: "positive" as const, intensity: "low" as const, title: "Managed frustration during homework", antecedent: "Difficult maths problem", behaviour: "Asked for help calmly instead of giving up", consequence: "Praise for communication", trigger: "", strategy_used: "Self-regulation — asking for help", outcome: "Completed homework. Jordan recognised own progress.", recorded_by: "staff_anna" },
  // Casey — mostly positive, very few concerning
  { ...behBase, id: "beh_020", child_id: "yp_casey", date: daysFromNow(-1), time: "15:30", direction: "concerning" as const, intensity: "medium" as const, title: "Distressed after phone call from mother", antecedent: "Unplanned phone call from mum", behaviour: "Crying, refusing to speak, withdrew to room", consequence: "1:1 support from Chervelle", trigger: "Family contact", strategy_used: "Active listening and grounding", outcome: "Casey settled after 20 minutes. Reviewed contact agreement.", recorded_by: "staff_chervelle" },
  { ...behBase, id: "beh_021", child_id: "yp_casey", date: daysFromNow(-2), time: "11:00", direction: "positive" as const, intensity: "low" as const, title: "Creative writing session — excellent work", antecedent: "Scheduled education time", behaviour: "Produced creative story, shared with group", consequence: "Displayed on notice board with permission", trigger: "", strategy_used: "", outcome: "Casey proud of work. Growing confidence in literacy.", recorded_by: "staff_anna" },
  { ...behBase, id: "beh_022", child_id: "yp_casey", date: daysFromNow(-4), time: "09:00", direction: "positive" as const, intensity: "low" as const, title: "Took morning medication willingly", antecedent: "Staff offered choice of timing", behaviour: "Accepted medication with no refusal", consequence: "Praise for cooperation", trigger: "", strategy_used: "Offering choice and control", outcome: "Three consecutive days of willing medication. Progress noted.", recorded_by: "staff_darren" },
  { ...behBase, id: "beh_023", child_id: "yp_casey", date: daysFromNow(-6), time: "14:00", direction: "positive" as const, intensity: "low" as const, title: "Positive CAMHS session", antecedent: "Scheduled therapy appointment", behaviour: "Engaged openly with therapist", consequence: "Therapist reported good progress", trigger: "", strategy_used: "", outcome: "Casey discussed trauma memories safely. Big step.", recorded_by: "staff_chervelle" },
  { ...behBase, id: "beh_024", child_id: "yp_casey", date: daysFromNow(-11), time: "20:00", direction: "concerning" as const, intensity: "low" as const, title: "Difficulty settling at bedtime", antecedent: "Overheard staff discussing her review", behaviour: "Restless, asking repeated questions about placement", consequence: "Extended bedtime support", trigger: "Anxiety about placement review", strategy_used: "Reassurance and grounding", outcome: "Casey settled after 30 min extra support. Melatonin effective.", recorded_by: "staff_edward" },
] as BehaviourEntry[];

// ── Sanctions & Rewards Seed Data ────────────────────────────────────────────

store.sanctionRewards = [
  // Alex — more balanced now but historically sanctions-heavy
  { id: "sr_001", child_id: "yp_alex", date: daysFromNow(-1), time: "09:30", direction: "reward" as const, reward_type: "privilege" as const, sanction_type: null, title: "Extra gaming time earned", description: "Full cooperation with morning routine", context: "Alex completed all morning tasks without prompting", child_response: "Pleased and motivated", outcome: "Positive morning sustained", proportionate: true, recorded_by: "staff_darren", created_at: daysFromNow(-1) },
  { id: "sr_002", child_id: "yp_alex", date: daysFromNow(-4), time: "22:00", direction: "sanction" as const, reward_type: null, sanction_type: "loss_of_privilege" as const, title: "Loss of evening gaming privilege", description: "Property damage in bedroom — threw controller at wall", context: "Following refusal to turn off console at bedtime", child_response: "Initially angry, accepted next day after debrief", outcome: "Alex contributed to repair cost from pocket money", proportionate: true, recorded_by: "staff_chervelle", created_at: daysFromNow(-4) },
  { id: "sr_003", child_id: "yp_alex", date: daysFromNow(-5), time: "16:00", direction: "reward" as const, reward_type: "activity" as const, sanction_type: null, title: "Takeaway Friday earned", description: "Full week at school with positive feedback", context: "Alex attended all lessons and received good report from AP", child_response: "Very happy — chose pizza", outcome: "Positive reinforcement of school attendance", proportionate: true, recorded_by: "staff_ryan", created_at: daysFromNow(-5) },
  { id: "sr_004", child_id: "yp_alex", date: daysFromNow(-8), time: "11:00", direction: "reward" as const, reward_type: "verbal_praise" as const, sanction_type: null, title: "Verbal praise for engagement in key work", description: "Open and honest engagement in key worker session", context: "Alex shared feelings about court proceedings", child_response: "Appreciative — said thank you", outcome: "Strengthened trust relationship", proportionate: true, recorded_by: "staff_edward", created_at: daysFromNow(-8) },
  { id: "sr_005", child_id: "yp_alex", date: daysFromNow(-12), time: "15:15", direction: "reward" as const, reward_type: "verbal_praise" as const, sanction_type: null, title: "Praised for using grounding technique", description: "Self-initiated de-escalation using 5-4-3-2-1", context: "Alex recognised own escalation and removed self from group", child_response: "Proud — said CAMHS taught him", outcome: "Excellent self-regulation", proportionate: true, recorded_by: "staff_anna", created_at: daysFromNow(-12) },
  { id: "sr_006", child_id: "yp_alex", date: daysFromNow(-16), time: "19:30", direction: "sanction" as const, reward_type: null, sanction_type: "loss_of_privilege" as const, title: "Loss of TV privilege for evening", description: "Threw game pieces and overturned table in communal area", context: "Lost board game to peer — unable to regulate frustration", child_response: "Accepted next day. Apologised.", outcome: "Discussed alternatives to throwing", proportionate: true, recorded_by: "staff_chervelle", created_at: daysFromNow(-16) },
  { id: "sr_007", child_id: "yp_alex", date: daysFromNow(-22), time: "15:30", direction: "sanction" as const, reward_type: null, sanction_type: "loss_of_privilege" as const, title: "Community trip removed for remainder of day", description: "Physical aggression towards staff after refused request", context: "PI required — proportionate consequence applied", child_response: "Initially very upset, accepted after debrief", outcome: "Linked to BSP boundary around physical aggression", proportionate: true, recorded_by: "staff_ryan", created_at: daysFromNow(-22) },
  // Jordan — mostly rewards
  { id: "sr_008", child_id: "yp_jordan", date: daysFromNow(-1), time: "17:00", direction: "reward" as const, reward_type: "activity" as const, sanction_type: null, title: "Cinema trip earned", description: "Two full weeks without absconding", context: "Jordan has maintained excellent engagement with routines", child_response: "Excited — chose horror film", outcome: "Positive reinforcement of safe boundaries", proportionate: true, recorded_by: "staff_anna", created_at: daysFromNow(-1) },
  { id: "sr_009", child_id: "yp_jordan", date: daysFromNow(-7), time: "09:00", direction: "reward" as const, reward_type: "privilege" as const, sanction_type: null, title: "Later bedtime on weekend", description: "Three consecutive independent mornings", context: "Jordan completing routine without prompting", child_response: "Motivated — values independence", outcome: "Building self-management skills", proportionate: true, recorded_by: "staff_ryan", created_at: daysFromNow(-7) },
  { id: "sr_010", child_id: "yp_jordan", date: daysFromNow(-14), time: "17:30", direction: "reward" as const, reward_type: "verbal_praise" as const, sanction_type: null, title: "Praise for community volunteering", description: "Excellent behaviour and helpfulness at youth group", context: "Certificate awarded by group leader", child_response: "Beaming — asked to go again", outcome: "Strengthening community links", proportionate: true, recorded_by: "staff_chervelle", created_at: daysFromNow(-14) },
  // Casey — all rewards
  { id: "sr_011", child_id: "yp_casey", date: daysFromNow(-2), time: "11:30", direction: "reward" as const, reward_type: "privilege" as const, sanction_type: null, title: "Creative writing displayed on notice board", description: "Excellent creative writing shared with group", context: "Casey produced story and gave permission to display", child_response: "Proud and pleased", outcome: "Growing confidence in literacy and self-expression", proportionate: true, recorded_by: "staff_anna", created_at: daysFromNow(-2) },
  { id: "sr_012", child_id: "yp_casey", date: daysFromNow(-4), time: "09:30", direction: "reward" as const, reward_type: "verbal_praise" as const, sanction_type: null, title: "Praised for medication compliance", description: "Three days of willing medication acceptance", context: "Staff offered choice of timing — Casey responded well", child_response: "Acknowledged with smile", outcome: "Medication refusals reducing significantly", proportionate: true, recorded_by: "staff_darren", created_at: daysFromNow(-4) },
  { id: "sr_013", child_id: "yp_casey", date: daysFromNow(-9), time: "15:00", direction: "reward" as const, reward_type: "activity" as const, sanction_type: null, title: "Art supplies purchased", description: "Casey requested art materials as reward for CAMHS engagement", context: "Positive therapy sessions and homework completion", child_response: "Grateful — started painting same evening", outcome: "Therapeutic value of creative outlet", proportionate: true, recorded_by: "staff_chervelle", created_at: daysFromNow(-9) },
] as SanctionRewardEntry[];

// ── Restraints Seed Data ─────────────────────────────────────────────────────

store.restraints = [
  {
    id: "rst_001", date: daysFromNow(-35), start_time: "21:15", end_time: "21:18", duration: 3,
    child_id: "yp_alex",
    staff_involved: [{ staff_id: "staff_edward", role: "lead" as const, team_teach_trained: true }, { staff_id: "staff_anna", role: "support" as const, team_teach_trained: true }],
    reason: "imminent_harm_to_others" as const,
    restraint_type: "planned_hold" as const,
    antecedent: "Alex became extremely agitated following a phone call with a family member. Began throwing items and directed verbal threats at staff.",
    behaviour: "Struck out at staff member who attempted to guide Alex away from area.",
    de_escalation_attempts: ["Verbal reassurance", "Offered quiet space", "Attempted redirect to room"],
    justification: "Imminent risk of harm to staff. Less restrictive options exhausted.",
    description: "Team Teach planned holding technique used. Brief duration (3 minutes). Alex de-escalated and was supported to their room.",
    injuries: [],
    child_debriefed: true, child_debrief_notes: "Alex apologised next day. Identified phone call as trigger. Agreed pre-call preparation strategy.",
    staff_debriefed: true,
    witnessed_by: ["staff_anna"],
    review_status: "reviewed" as const, review_notes: "Hold proportionate and minimum duration. Team Teach technique used correctly.", reviewed_by: "staff_darren",
    linked_incident_id: "inc_005",
    notifications_sent: [{ party: "Registered Manager", date: daysFromNow(-35) }, { party: "Social Worker", date: daysFromNow(-35) }],
    body_map_completed: true, medical_check_completed: false,
    recorded_by: "staff_edward", created_at: daysFromNow(-35),
  },
  {
    id: "rst_002", date: daysFromNow(-22), start_time: "14:50", end_time: "14:52", duration: 2,
    child_id: "yp_alex",
    staff_involved: [{ staff_id: "staff_chervelle", role: "lead" as const, team_teach_trained: true }, { staff_id: "staff_ryan", role: "support" as const, team_teach_trained: true }],
    reason: "imminent_harm_to_others" as const,
    restraint_type: "standing_hold" as const,
    antecedent: "Community trip refused due to incomplete homework. Alex ran towards front door.",
    behaviour: "Became physically threatening towards staff member in corridor.",
    de_escalation_attempts: ["Verbal de-escalation", "Offered alternative activity", "Calm voice"],
    justification: "Alex posed imminent risk to staff member. Verbal strategies insufficient.",
    description: "Team Teach restrictive hold used in corridor for 2 minutes until Alex verbally agreed to engage with support.",
    injuries: [],
    child_debriefed: true, child_debrief_notes: "Alex agreed refusal wasn't right response. Discussed how to handle disappointment.",
    staff_debriefed: true,
    witnessed_by: ["staff_ryan"],
    review_status: "pending" as const, review_notes: "", reviewed_by: "",
    linked_incident_id: "inc_006",
    notifications_sent: [{ party: "Registered Manager", date: daysFromNow(-22) }, { party: "Social Worker", date: daysFromNow(-22) }],
    body_map_completed: true, medical_check_completed: false,
    recorded_by: "staff_chervelle", created_at: daysFromNow(-22),
  },
  {
    id: "rst_003", date: daysFromNow(-10), start_time: "18:30", end_time: "18:37", duration: 7,
    child_id: "yp_alex",
    staff_involved: [{ staff_id: "staff_ryan", role: "lead" as const, team_teach_trained: true }, { staff_id: "staff_edward", role: "support" as const, team_teach_trained: true }],
    reason: "imminent_harm_to_self" as const,
    restraint_type: "wrap_hold" as const,
    antecedent: "Difficult conversation about upcoming court proceedings. Alex became extremely distressed.",
    behaviour: "Attempted to self-harm with a sharp object. Violent resistance when staff intervened.",
    de_escalation_attempts: ["Verbal de-escalation", "Attempt to remove object verbally", "Offered alternative coping"],
    justification: "Imminent risk of serious self-harm. Sharp object needed to be secured immediately.",
    description: "Team Teach wrap hold maintained for 7 minutes. Sharp object secured by second staff member. Alex sustained minor bruise to left forearm during struggle (not caused by hold). Ambulance called as precaution.",
    injuries: [{ person: "yp_alex", description: "Minor bruise to left forearm — not caused by hold, sustained during struggle" }],
    child_debriefed: false, child_debrief_notes: "Planned for following day — Alex too distressed on evening of incident.",
    staff_debriefed: true,
    witnessed_by: ["staff_edward"],
    review_status: "pending" as const, review_notes: "", reviewed_by: "",
    linked_incident_id: "inc_007",
    notifications_sent: [{ party: "Registered Manager", date: daysFromNow(-10) }, { party: "Social Worker", date: daysFromNow(-10) }, { party: "Parent", date: daysFromNow(-10) }, { party: "Ambulance", date: daysFromNow(-10) }],
    body_map_completed: true, medical_check_completed: true,
    recorded_by: "staff_ryan", created_at: daysFromNow(-10),
  },
] as RestraintRecord[];

// ── Visitors Seed Data ────────────────────────────────────────────────────────

store.visitors = [
  {
    id: "vis_001", date: daysFromNow(-1), visitor_name: "Sarah Mitchell",
    organisation: "Placing Authority", category: "professional" as const,
    purpose: "Statutory visit — LAC review preparation",
    dbs_checked: true, id_verified: true,
    sign_in_time: "10:00", sign_out_time: "11:30",
    status: "signed_out" as const, host_staff_id: "staff_darren",
    children_seen: ["yp_alex"], notes: "Reviewed care plan with Alex. Positive engagement.",
    created_at: daysFromNow(-1),
  },
  {
    id: "vis_002", date: daysFromNow(-3), visitor_name: "Dr James Patel",
    organisation: "CAMHS", category: "professional" as const,
    purpose: "Therapeutic session with Casey",
    dbs_checked: true, id_verified: true,
    sign_in_time: "14:00", sign_out_time: "15:00",
    status: "signed_out" as const, host_staff_id: "staff_anna",
    children_seen: ["yp_casey"], notes: null,
    created_at: daysFromNow(-3),
  },
  {
    id: "vis_003", date: daysFromNow(-5), visitor_name: "Karen Thompson",
    organisation: null, category: "family" as const,
    purpose: "Contact visit — Jordan's mother",
    dbs_checked: false, id_verified: true,
    sign_in_time: "13:00", sign_out_time: "15:30",
    status: "signed_out" as const, host_staff_id: "staff_chervelle",
    children_seen: ["yp_jordan"], notes: "Supervised contact. Positive interaction observed.",
    created_at: daysFromNow(-5),
  },
  {
    id: "vis_004", date: daysFromNow(-7), visitor_name: "Mike Roberts",
    organisation: "Roberts Plumbing Ltd", category: "tradesperson" as const,
    purpose: "Emergency boiler repair",
    dbs_checked: false, id_verified: true,
    sign_in_time: "09:00", sign_out_time: "12:00",
    status: "signed_out" as const, host_staff_id: "staff_edward",
    children_seen: [], notes: "Escorted at all times per policy.",
    created_at: daysFromNow(-7),
  },
  {
    id: "vis_005", date: daysFromNow(-10), visitor_name: "Helen Clarke",
    organisation: "Ofsted", category: "inspector" as const,
    purpose: "Unannounced monitoring visit",
    dbs_checked: true, id_verified: true,
    sign_in_time: "08:30", sign_out_time: "16:00",
    status: "signed_out" as const, host_staff_id: "staff_darren",
    children_seen: ["yp_alex", "yp_jordan", "yp_casey"],
    notes: "Full inspection visit. All children spoken to. Staff records reviewed.",
    created_at: daysFromNow(-10),
  },
  {
    id: "vis_006", date: daysFromNow(-14), visitor_name: "Janet Lewis",
    organisation: "Reg 44 Independent Person", category: "professional" as const,
    purpose: "Reg 44 monthly monitoring visit",
    dbs_checked: true, id_verified: true,
    sign_in_time: "10:00", sign_out_time: "14:00",
    status: "signed_out" as const, host_staff_id: "staff_darren",
    children_seen: ["yp_alex", "yp_jordan", "yp_casey"],
    notes: "Monthly Reg 44 visit. All children spoken to privately. Report to follow.",
    created_at: daysFromNow(-14),
  },
  {
    id: "vis_007", date: daysFromNow(-18), visitor_name: "David Brown",
    organisation: null, category: "family" as const,
    purpose: "Contact visit — Alex's uncle",
    dbs_checked: true, id_verified: true,
    sign_in_time: "11:00", sign_out_time: "13:00",
    status: "signed_out" as const, host_staff_id: "staff_ryan",
    children_seen: ["yp_alex"], notes: "Approved contact. Positive visit.",
    created_at: daysFromNow(-18),
  },
  {
    id: "vis_008", date: daysFromNow(0), visitor_name: "Lisa Green",
    organisation: "YOT", category: "professional" as const,
    purpose: "YOT review meeting — Alex",
    dbs_checked: true, id_verified: true,
    sign_in_time: "14:00", sign_out_time: null,
    status: "signed_in" as const, host_staff_id: "staff_chervelle",
    children_seen: ["yp_alex"], notes: null,
    created_at: daysFromNow(0),
  },
  {
    id: "vis_009", date: daysFromNow(-2), visitor_name: "Tom Wilson",
    organisation: "Oak Academy", category: "professional" as const,
    purpose: "PEP meeting — Jordan's education plan",
    dbs_checked: true, id_verified: true,
    sign_in_time: "09:30", sign_out_time: "10:45",
    status: "signed_out" as const, host_staff_id: "staff_anna",
    children_seen: ["yp_jordan"], notes: "PEP targets reviewed and updated.",
    created_at: daysFromNow(-2),
  },
  {
    id: "vis_010", date: daysFromNow(-22), visitor_name: "Claire Adams",
    organisation: "Placing Authority", category: "professional" as const,
    purpose: "Supervision of contact — Casey",
    dbs_checked: true, id_verified: true,
    sign_in_time: "10:00", sign_out_time: "11:30",
    status: "signed_out" as const, host_staff_id: "staff_edward",
    children_seen: ["yp_casey"], notes: null,
    created_at: daysFromNow(-22),
  },
] as VisitorEntry[];

// ── Independence Pathways Seed Data ───────────────────────────────────────────

store.independencePathways = [
  {
    id: "ip_001", child_id: "yp_alex", assessed_by: "staff_anna",
    assessment_date: daysFromNow(-15), review_date: daysFromNow(75),
    overall_readiness: 68, status: "on_track" as const,
    expected_transition_age: 18, pathway_plan_linked: true,
    domains: [
      { name: "Personal Care", score: 8, max_score: 10, evidence: "Manages hygiene independently", next_steps: "Support with laundry scheduling" },
      { name: "Cooking & Nutrition", score: 6, max_score: 10, evidence: "Can prepare simple meals", next_steps: "Introduce meal planning and shopping lists" },
      { name: "Money Management", score: 4, max_score: 10, evidence: "Basic understanding of budgeting", next_steps: "Open bank account, practice weekly budgeting" },
      { name: "Home Management", score: 5, max_score: 10, evidence: "Keeps room tidy with prompting", next_steps: "Build cleaning rota skills" },
      { name: "Social Networks", score: 7, max_score: 10, evidence: "Good peer relationships", next_steps: "Support with community connections" },
      { name: "Education & Employment", score: 6, max_score: 10, evidence: "Attending college courses", next_steps: "Work experience placement" },
      { name: "Emotional Wellbeing", score: 7, max_score: 10, evidence: "Uses coping strategies", next_steps: "Continue CAMHS sessions" },
      { name: "Practical Skills", score: 7, max_score: 10, evidence: "Can use public transport independently", next_steps: "Practice route planning" },
    ],
    notes: "Alex showing good progress. Strongest in personal care and social networks. Money management is the key area to develop before transition.",
    created_at: daysFromNow(-15),
  },
  {
    id: "ip_002", child_id: "yp_jordan", assessed_by: "staff_chervelle",
    assessment_date: daysFromNow(-20), review_date: daysFromNow(70),
    overall_readiness: 45, status: "attention_needed" as const,
    expected_transition_age: 18, pathway_plan_linked: false,
    domains: [
      { name: "Personal Care", score: 6, max_score: 10, evidence: "Manages basic hygiene with reminders", next_steps: "Reduce prompting frequency" },
      { name: "Cooking & Nutrition", score: 3, max_score: 10, evidence: "Can make toast and cereal", next_steps: "Cooking sessions twice weekly" },
      { name: "Money Management", score: 2, max_score: 10, evidence: "Limited understanding of money", next_steps: "Pocket money management programme" },
      { name: "Home Management", score: 3, max_score: 10, evidence: "Needs significant prompting", next_steps: "Structured bedroom cleaning routine" },
      { name: "Social Networks", score: 5, max_score: 10, evidence: "Some peer friendships at school", next_steps: "Community activity referral" },
      { name: "Education & Employment", score: 4, max_score: 10, evidence: "Attending school regularly", next_steps: "PEP targets to include work experience" },
      { name: "Emotional Wellbeing", score: 5, max_score: 10, evidence: "Beginning to identify emotions", next_steps: "Continue therapeutic key work" },
      { name: "Practical Skills", score: 4, max_score: 10, evidence: "Learning to use bus with support", next_steps: "Independent travel training" },
    ],
    notes: "Jordan needs focused support across most domains. Cooking and money management are particular gaps.",
    created_at: daysFromNow(-20),
  },
  {
    id: "ip_003", child_id: "yp_casey", assessed_by: "staff_anna",
    assessment_date: daysFromNow(-10), review_date: daysFromNow(80),
    overall_readiness: 52, status: "on_track" as const,
    expected_transition_age: 18, pathway_plan_linked: false,
    domains: [
      { name: "Personal Care", score: 7, max_score: 10, evidence: "Good self-care routine", next_steps: "Develop health appointment management" },
      { name: "Cooking & Nutrition", score: 5, max_score: 10, evidence: "Helps with meal preparation", next_steps: "Independent cooking sessions" },
      { name: "Money Management", score: 4, max_score: 10, evidence: "Saves pocket money sometimes", next_steps: "Introduce savings goals" },
      { name: "Home Management", score: 4, max_score: 10, evidence: "Keeps space reasonably tidy", next_steps: "Expand to shared area responsibility" },
      { name: "Social Networks", score: 6, max_score: 10, evidence: "Active in youth club", next_steps: "Mentoring programme" },
      { name: "Education & Employment", score: 5, max_score: 10, evidence: "Engaging with school", next_steps: "Career exploration sessions" },
      { name: "Emotional Wellbeing", score: 6, max_score: 10, evidence: "CAMHS engaged, building resilience", next_steps: "Transition to community support" },
      { name: "Practical Skills", score: 5, max_score: 10, evidence: "Growing confidence with daily tasks", next_steps: "Independent travel practice" },
    ],
    notes: "Casey making steady progress. Personal care strongest. Money management and home management need development.",
    created_at: daysFromNow(-10),
  },
] as IndependencePathway[];

// ── House Meetings Seed Data ──────────────────────────────────────────────────

store.houseMeetings = [
  {
    id: "hm_001", date: daysFromNow(-7),
    meeting_type: "regular" as const,
    chair_person: "staff_darren", minutes_taker: "staff_anna",
    children_present: ["yp_alex", "yp_jordan", "yp_casey"],
    children_absent: [],
    staff_present: ["staff_darren", "staff_anna", "staff_edward"],
    agenda: [
      { topic: "Weekend activities", raised_by: "yp_alex", discussion: "Discussed options for Saturday trip", outcome: "Bowling trip agreed" },
      { topic: "Menu choices", raised_by: "yp_jordan", discussion: "Jordan wants more pasta options", outcome: "New pasta dishes added to weekly menu" },
      { topic: "Wi-Fi speed", raised_by: "yp_casey", discussion: "Casey says Wi-Fi slow in bedroom", outcome: "Staff to check router placement" },
    ],
    child_feedback: ["Good meeting", "Glad we get to choose activities", "Wi-Fi thing was important thanks"],
    actions_from_previous: [
      { action: "Fix garden gate", owner: "staff_edward", completed: true },
      { action: "Get new board games", owner: "staff_anna", completed: true },
    ],
    new_actions: [
      { action: "Book bowling trip", owner: "staff_darren", due_date: daysFromNow(-3) },
      { action: "Check Wi-Fi router", owner: "staff_edward", due_date: daysFromNow(-5) },
      { action: "Update menu rota", owner: "staff_anna", due_date: daysFromNow(-4) },
    ],
    general_comments: "Positive meeting. All children engaged well.",
    next_meeting_date: daysFromNow(7),
    duration: 35,
    created_at: daysFromNow(-7),
  },
  {
    id: "hm_002", date: daysFromNow(-14),
    meeting_type: "regular" as const,
    chair_person: "staff_darren", minutes_taker: "staff_chervelle",
    children_present: ["yp_alex", "yp_casey"],
    children_absent: ["yp_jordan"],
    staff_present: ["staff_darren", "staff_chervelle"],
    agenda: [
      { topic: "Bedroom decoration", raised_by: "yp_alex", discussion: "Wants to repaint room", outcome: "Agreed — colour choices to be confirmed" },
      { topic: "Contact visits", raised_by: "yp_casey", discussion: "Wants more phone time with mum", outcome: "SW to be consulted about increasing contact" },
    ],
    child_feedback: ["Want Jordan to be here too"],
    actions_from_previous: [
      { action: "Arrange cinema trip", owner: "staff_anna", completed: true },
      { action: "Fix bedroom light", owner: "staff_edward", completed: false },
    ],
    new_actions: [
      { action: "Source paint samples for Alex", owner: "staff_darren", due_date: daysFromNow(-10) },
      { action: "Contact SW re Casey phone time", owner: "staff_chervelle", due_date: daysFromNow(-12) },
    ],
    general_comments: "Jordan absent due to school trip. Feedback noted about inclusion.",
    next_meeting_date: daysFromNow(-7),
    duration: 25,
    created_at: daysFromNow(-14),
  },
  {
    id: "hm_003", date: daysFromNow(-21),
    meeting_type: "regular" as const,
    chair_person: "staff_anna", minutes_taker: "staff_ryan",
    children_present: ["yp_alex", "yp_jordan", "yp_casey"],
    children_absent: [],
    staff_present: ["staff_anna", "staff_ryan"],
    agenda: [
      { topic: "Summer holiday plans", raised_by: "staff_anna", discussion: "Discussed holiday options", outcome: "Day trips to be planned" },
      { topic: "Pocket money", raised_by: "yp_jordan", discussion: "Jordan wants increase", outcome: "Review scheduled with RM" },
    ],
    child_feedback: ["Excited about summer", "Want to go to the beach"],
    actions_from_previous: [
      { action: "Get new TV remote", owner: "staff_ryan", completed: true },
    ],
    new_actions: [
      { action: "Plan summer day trips", owner: "staff_anna", due_date: daysFromNow(-14) },
      { action: "Review pocket money with RM", owner: "staff_ryan", due_date: daysFromNow(-18) },
    ],
    general_comments: "Good attendance. All children contributed.",
    next_meeting_date: daysFromNow(-14),
    duration: 30,
    created_at: daysFromNow(-21),
  },
  {
    id: "hm_004", date: daysFromNow(-28),
    meeting_type: "regular" as const,
    chair_person: "staff_darren", minutes_taker: "staff_edward",
    children_present: ["yp_alex", "yp_jordan"],
    children_absent: ["yp_casey"],
    staff_present: ["staff_darren", "staff_edward"],
    agenda: [
      { topic: "Garden project", raised_by: "yp_alex", discussion: "Wants to grow vegetables", outcome: "Raised beds approved" },
    ],
    child_feedback: ["Good idea about the garden"],
    actions_from_previous: [],
    new_actions: [
      { action: "Buy raised bed materials", owner: "staff_edward", due_date: daysFromNow(-24) },
    ],
    general_comments: "Casey absent — unwell. Feedback to be sought separately.",
    next_meeting_date: daysFromNow(-21),
    duration: 20,
    created_at: daysFromNow(-28),
  },
] as HouseMeeting[];

// ── Notifiable Events Seed Data ───────────────────────────────────────────────

store.notifiableEvents = [
  {
    id: "ne_001", date: daysFromNow(-3), event_type: "restraint" as const,
    child_id: "yp_alex", summary: "Physical intervention — imminent harm to staff",
    detail: "Alex struck out at staff after phone call. Team Teach hold applied for 2 minutes.",
    immediate_action: "PI applied. Child debriefed. Social worker informed.",
    reported_by: "staff_edward",
    ofsted_status: "notified_within_24h" as const,
    ofsted: { body: "Notifiable event: restraint used on Alex. 2-minute hold.", notified_date: daysFromNow(-3), method: "Ofsted online portal", reference: "OFS-2026-4421" },
    local_authority: { body: "Restraint notification to placing authority.", notified_date: daysFromNow(-3), method: "Email", reference: null },
    placing: { body: "PI notification to social worker.", notified_date: daysFromNow(-3), method: "Phone + email", reference: null },
    follow_up: "BSP reviewed. Pre-call strategy added.",
    lesson_learned: "Pre-call preparation reduces escalation risk.",
  },
  {
    id: "ne_002", date: daysFromNow(-10), event_type: "absconding" as const,
    child_id: "yp_alex", summary: "Missing from care — absent for 3 hours",
    detail: "Alex left without permission after argument about homework. Located at local park by police.",
    immediate_action: "Police called after 30 minutes. Missing person report filed. Return interview completed.",
    reported_by: "staff_ryan",
    ofsted_status: "notified_within_24h" as const,
    ofsted: { body: "Notifiable event: child absent from home for 3 hours.", notified_date: daysFromNow(-10), method: "Ofsted online portal", reference: "OFS-2026-4398" },
    local_authority: { body: "Missing episode notification.", notified_date: daysFromNow(-10), method: "Email", reference: null },
    placing: { body: "Missing episode — social worker informed same day.", notified_date: daysFromNow(-10), method: "Phone", reference: null },
    follow_up: "Return interview completed. Triggers identified.",
    lesson_learned: "Homework refusal is a known trigger — de-escalation before insistence.",
  },
  {
    id: "ne_003", date: daysFromNow(-18), event_type: "allegation_against_staff" as const,
    child_id: null, summary: "Allegation of inappropriate language by agency staff",
    detail: "Young person reported agency worker used inappropriate language during night shift.",
    immediate_action: "Agency worker removed from rota. LADO referral made. Statement taken from young person.",
    reported_by: "staff_darren",
    ofsted_status: "notified_within_24h" as const,
    ofsted: { body: "Allegation against agency staff member — LADO referral made.", notified_date: daysFromNow(-18), method: "Ofsted online portal", reference: "OFS-2026-4355" },
    local_authority: { body: "LADO notification.", notified_date: daysFromNow(-18), method: "LADO referral form", reference: "LADO-2026-0891" },
    placing: { body: "N/A — allegation against staff, not child-specific.", notified_date: null, method: "", reference: null },
    follow_up: "Investigation ongoing. Staff suspended from rota. Outcome pending.",
    lesson_learned: "Agency staff supervision protocols strengthened.",
  },
  {
    id: "ne_004", date: daysFromNow(-25), event_type: "police_involvement" as const,
    child_id: "yp_alex", summary: "Police called following criminal damage in community",
    detail: "Alex involved in criminal damage at local shop. Police attended and issued community resolution.",
    immediate_action: "Police attended. No arrest. Community resolution applied. YOT informed.",
    reported_by: "staff_chervelle",
    ofsted_status: "notified_within_24h" as const,
    ofsted: { body: "Police involvement — community resolution for criminal damage.", notified_date: daysFromNow(-25), method: "Ofsted online portal", reference: "OFS-2026-4312" },
    local_authority: { body: "Police involvement notification.", notified_date: daysFromNow(-25), method: "Email", reference: null },
    placing: { body: "SW notified of police involvement.", notified_date: daysFromNow(-25), method: "Phone", reference: null },
    follow_up: "Community reparation completed. Shop accepted apology.",
    lesson_learned: "Community links with local businesses help de-escalate police responses.",
  },
  {
    id: "ne_005", date: daysFromNow(-40), event_type: "serious_incident" as const,
    child_id: "yp_casey", summary: "Self-harm disclosure during key work session",
    detail: "Casey disclosed historical self-harm during therapeutic key work session. No current risk identified.",
    immediate_action: "Immediate safeguarding discussion. CAMHS referral expedited. Safety plan updated.",
    reported_by: "staff_anna",
    ofsted_status: "notified_within_24h" as const,
    ofsted: { body: "Serious incident: self-harm disclosure. CAMHS referral made.", notified_date: daysFromNow(-40), method: "Ofsted online portal", reference: "OFS-2026-4278" },
    local_authority: { body: "Safeguarding notification — self-harm disclosure.", notified_date: daysFromNow(-40), method: "Email", reference: null },
    placing: { body: "SW notified — CAMHS referral expedited.", notified_date: daysFromNow(-40), method: "Phone + email", reference: null },
    follow_up: "CAMHS assessment completed. Weekly sessions commenced.",
    lesson_learned: "Therapeutic key work approach enables safe disclosure.",
  },
  {
    id: "ne_006", date: daysFromNow(-2), event_type: "restraint" as const,
    child_id: "yp_alex", summary: "Physical intervention — threat to peer in communal area",
    detail: "Alex became physically threatening towards Jordan following dispute over TV remote. Standing hold for 2 minutes.",
    immediate_action: "PI applied. Both children separated. Debrief completed same shift.",
    reported_by: "staff_chervelle",
    ofsted_status: "pending" as const,
    ofsted: { body: "", notified_date: null, method: "", reference: null },
    local_authority: { body: "Restraint notification to LA.", notified_date: daysFromNow(-2), method: "Email", reference: null },
    placing: { body: "SW notified of PI.", notified_date: daysFromNow(-2), method: "Phone", reference: null },
    follow_up: "BSP boundary around peer conflict reinforced.",
    lesson_learned: "TV access rota may reduce friction between Alex and Jordan.",
  },
] as NotifiableEvent[];

// ── Pocket Money Transactions (Finance Intelligence) ──────────────────────────

store.pocketMoneyTransactions = [
  // Alex — weekly allowances (£20/week × 4)
  { id: "pm_001", child_id: "yp_alex", date: daysFromNow(-3), type: "allowance", amount: 20, description: "Weekly pocket money", category: "allowance", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  { id: "pm_002", child_id: "yp_alex", date: daysFromNow(-10), type: "allowance", amount: 20, description: "Weekly pocket money", category: "allowance", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  { id: "pm_003", child_id: "yp_alex", date: daysFromNow(-17), type: "allowance", amount: 20, description: "Weekly pocket money", category: "allowance", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  { id: "pm_004", child_id: "yp_alex", date: daysFromNow(-24), type: "allowance", amount: 20, description: "Weekly pocket money", category: "allowance", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  // Alex — spending
  { id: "pm_005", child_id: "yp_alex", date: daysFromNow(-5), type: "spending", amount: 35, description: "New trainers — JD Sports", category: "clothing", receipt_held: true, approved_by: "staff_ryan", notes: null, created_at: new Date().toISOString() },
  { id: "pm_006", child_id: "yp_alex", date: daysFromNow(-8), type: "spending", amount: 18, description: "Cinema with friends", category: "entertainment", receipt_held: true, approved_by: "staff_anna", notes: null, created_at: new Date().toISOString() },
  { id: "pm_007", child_id: "yp_alex", date: daysFromNow(-12), type: "spending", amount: 15, description: "Phone top-up", category: "phone", receipt_held: true, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  // Alex — savings
  { id: "pm_008", child_id: "yp_alex", date: daysFromNow(-3), type: "savings_deposit", amount: 10, description: "Weekly savings", category: "savings", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  { id: "pm_009", child_id: "yp_alex", date: daysFromNow(-10), type: "savings_deposit", amount: 10, description: "Weekly savings", category: "savings", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },

  // Jordan — weekly allowances (£20/week × 4)
  { id: "pm_010", child_id: "yp_jordan", date: daysFromNow(-3), type: "allowance", amount: 20, description: "Weekly pocket money", category: "allowance", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  { id: "pm_011", child_id: "yp_jordan", date: daysFromNow(-10), type: "allowance", amount: 20, description: "Weekly pocket money", category: "allowance", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  { id: "pm_012", child_id: "yp_jordan", date: daysFromNow(-17), type: "allowance", amount: 20, description: "Weekly pocket money", category: "allowance", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  { id: "pm_013", child_id: "yp_jordan", date: daysFromNow(-24), type: "allowance", amount: 20, description: "Weekly pocket money", category: "allowance", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  // Jordan — spending (higher than average)
  { id: "pm_014", child_id: "yp_jordan", date: daysFromNow(-2), type: "spending", amount: 45, description: "Hoodie — Primark", category: "clothing", receipt_held: true, approved_by: "staff_ryan", notes: null, created_at: new Date().toISOString() },
  { id: "pm_015", child_id: "yp_jordan", date: daysFromNow(-6), type: "spending", amount: 22, description: "Takeaway with friends", category: "food", receipt_held: false, approved_by: "staff_anna", notes: null, created_at: new Date().toISOString() },
  { id: "pm_016", child_id: "yp_jordan", date: daysFromNow(-9), type: "spending", amount: 30, description: "Bowling and pizza", category: "activities", receipt_held: true, approved_by: "staff_edward", notes: null, created_at: new Date().toISOString() },
  { id: "pm_017", child_id: "yp_jordan", date: daysFromNow(-15), type: "spending", amount: 25, description: "Gaming credit top-up", category: "entertainment", receipt_held: false, approved_by: "staff_lackson", notes: null, created_at: new Date().toISOString() },
  { id: "pm_018", child_id: "yp_jordan", date: daysFromNow(-20), type: "spending", amount: 12, description: "Bus fare to contact visit", category: "transport", receipt_held: true, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  // Jordan — savings
  { id: "pm_019", child_id: "yp_jordan", date: daysFromNow(-10), type: "savings_deposit", amount: 5, description: "Savings", category: "savings", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },

  // Casey — weekly allowances (£15/week × 4)
  { id: "pm_020", child_id: "yp_casey", date: daysFromNow(-3), type: "allowance", amount: 15, description: "Weekly pocket money", category: "allowance", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  { id: "pm_021", child_id: "yp_casey", date: daysFromNow(-10), type: "allowance", amount: 15, description: "Weekly pocket money", category: "allowance", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  { id: "pm_022", child_id: "yp_casey", date: daysFromNow(-17), type: "allowance", amount: 15, description: "Weekly pocket money", category: "allowance", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  { id: "pm_023", child_id: "yp_casey", date: daysFromNow(-24), type: "allowance", amount: 15, description: "Weekly pocket money", category: "allowance", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  // Casey — spending (minimal)
  { id: "pm_024", child_id: "yp_casey", date: daysFromNow(-7), type: "spending", amount: 8, description: "Snacks from corner shop", category: "food", receipt_held: true, approved_by: "staff_anna", notes: null, created_at: new Date().toISOString() },
  // Casey — savings (regular saver)
  { id: "pm_025", child_id: "yp_casey", date: daysFromNow(-3), type: "savings_deposit", amount: 15, description: "Weekly savings", category: "savings", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  { id: "pm_026", child_id: "yp_casey", date: daysFromNow(-10), type: "savings_deposit", amount: 15, description: "Weekly savings", category: "savings", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
  { id: "pm_027", child_id: "yp_casey", date: daysFromNow(-17), type: "savings_deposit", amount: 15, description: "Weekly savings", category: "savings", receipt_held: false, approved_by: "staff_darren", notes: null, created_at: new Date().toISOString() },
] as PocketMoneyTransaction[];

// ── Clothing Allowances (Finance Intelligence) ────────────────────────────────

store.clothingAllowanceRecords = [
  { id: "car_001", child_id: "yp_alex", financial_year: "2025-2026", annual_budget: 600, quarterly_allowance: 150, current_quarter: 2, quarter_spend: 90, ytd_spend: 240, purchases: [], preferences: ["sportswear", "trainers"], sizes: { shoe: "8", top: "M", trousers: "30" }, notes: "", created_at: new Date().toISOString() },
  { id: "car_002", child_id: "yp_jordan", financial_year: "2025-2026", annual_budget: 600, quarterly_allowance: 150, current_quarter: 2, quarter_spend: 145, ytd_spend: 420, purchases: [], preferences: ["streetwear", "hoodies"], sizes: { shoe: "9", top: "L", trousers: "32" }, notes: "Approaching budget limit", created_at: new Date().toISOString() },
  { id: "car_003", child_id: "yp_casey", financial_year: "2025-2026", annual_budget: 600, quarterly_allowance: 150, current_quarter: 2, quarter_spend: 45, ytd_spend: 130, purchases: [], preferences: ["casual", "art supplies"], sizes: { shoe: "6", top: "S", trousers: "28" }, notes: "", created_at: new Date().toISOString() },
] as ClothingAllowanceRecord[];

// ── Complaints (Complaints Intelligence) ──────────────────────────────────────

store.complaintOutcomeRecords = [
  { id: "cmp_001", complaint_date: daysFromNow(-30), complainant: "Alex", source: "child" as const, theme: "food" as const, outcome: "upheld" as const, investigated_by: "staff_darren", date_resolved: daysFromNow(-22), response_time_days: 8, child_id: "yp_alex", summary: "Requested more variety in evening meals", findings: "Menu rotation limited — same meals repeated weekly", lessons_learned: "Menu planning to include young people monthly", practice_changes: ["Monthly menu consultation with all children"], complainant_satisfied: true, escalated: false, escalated_to: null, ofsted_notified: false, created_at: new Date().toISOString() },
  { id: "cmp_002", complaint_date: daysFromNow(-25), complainant: "Mrs Thompson (Jordan's aunt)", source: "parent_carer" as const, theme: "communication" as const, outcome: "partially_upheld" as const, investigated_by: "staff_darren", date_resolved: daysFromNow(-15), response_time_days: 10, child_id: "yp_jordan", summary: "Not informed about school exclusion promptly", findings: "48-hour delay in notifying family — staff changeover gap", lessons_learned: "Significant event notification checklist updated", practice_changes: ["Family notification within 24 hours added to handover protocol"], complainant_satisfied: true, escalated: false, escalated_to: null, ofsted_notified: false, created_at: new Date().toISOString() },
  { id: "cmp_003", complaint_date: daysFromNow(-20), complainant: "Social Worker (Laura Smith)", source: "social_worker" as const, theme: "care_quality" as const, outcome: "not_upheld" as const, investigated_by: "staff_darren", date_resolved: daysFromNow(-12), response_time_days: 8, child_id: "yp_casey", summary: "Concerns about bedroom personalisation not being supported", findings: "Casey has personalised room — photos and artwork displayed. Budget provided.", lessons_learned: "Room personalisation evidenced in care records going forward", practice_changes: [], complainant_satisfied: false, escalated: false, escalated_to: null, ofsted_notified: false, created_at: new Date().toISOString() },
  { id: "cmp_004", complaint_date: daysFromNow(-8), complainant: "Jordan", source: "child" as const, theme: "activities" as const, outcome: "ongoing" as const, investigated_by: "staff_ryan", date_resolved: null, response_time_days: 0, child_id: "yp_jordan", summary: "Wants to attend boxing club but transport not arranged", findings: "", lessons_learned: "", practice_changes: [], complainant_satisfied: null, escalated: false, escalated_to: null, ofsted_notified: false, created_at: new Date().toISOString() },
  { id: "cmp_005", complaint_date: daysFromNow(-18), complainant: "Staff member (anonymous)", source: "staff" as const, theme: "environment" as const, outcome: "upheld" as const, investigated_by: "staff_darren", date_resolved: daysFromNow(-10), response_time_days: 8, child_id: null, summary: "Heating in staff sleep-in room inadequate", findings: "Thermostat in sleep-in room faulty — replaced same week", lessons_learned: "Monthly premises checks to include sleep-in room temperature", practice_changes: ["Sleep-in comfort check added to monthly premises audit"], complainant_satisfied: true, escalated: false, escalated_to: null, ofsted_notified: false, created_at: new Date().toISOString() },
  { id: "cmp_006", complaint_date: daysFromNow(-45), complainant: "Anonymous", source: "anonymous" as const, theme: "staff_conduct" as const, outcome: "not_upheld" as const, investigated_by: "staff_darren", date_resolved: daysFromNow(-30), response_time_days: 15, child_id: null, summary: "Allegation of staff using phones during shifts", findings: "CCTV reviewed — no evidence to support claim. Staff phone policy in place.", lessons_learned: "Phone-free zone signage refreshed in communal areas", practice_changes: ["Refreshed phone policy signage"], complainant_satisfied: null, escalated: false, escalated_to: null, ofsted_notified: false, created_at: new Date().toISOString() },
  { id: "cmp_007", complaint_date: daysFromNow(-3), complainant: "Casey", source: "child" as const, theme: "privacy" as const, outcome: "ongoing" as const, investigated_by: "staff_anna", date_resolved: null, response_time_days: 0, child_id: "yp_casey", summary: "Felt room was entered without knocking during quiet time", findings: "", lessons_learned: "", practice_changes: [], complainant_satisfied: null, escalated: false, escalated_to: null, ofsted_notified: false, created_at: new Date().toISOString() },
  { id: "cmp_008", complaint_date: daysFromNow(-35), complainant: "Placing Authority (Jane Roberts)", source: "professional" as const, theme: "medication" as const, outcome: "upheld" as const, investigated_by: "staff_darren", date_resolved: daysFromNow(-20), response_time_days: 15, child_id: "yp_casey", summary: "Medication given 45 minutes late on two occasions", findings: "Late administration confirmed on MAR — staff workload at handover time", lessons_learned: "Medication round to start 15 minutes before handover", practice_changes: ["Medication schedule adjusted to avoid handover overlap", "Second witness requirement reiterated"], complainant_satisfied: true, escalated: true, escalated_to: "Ofsted", ofsted_notified: true, created_at: new Date().toISOString() },
] as ComplaintOutcomeRecord[];

// ── QA Audit Records (Quality Assurance Intelligence) ─────────────────────────

store.qaAuditRecords = [
  { id: "qa_001", title: "Medication Management Audit", date: daysFromNow(-60), auditor: "staff_darren", scope: "medication", overall_rating: "excellent" as const, score: 4, findings: ["All MAR records complete and witnessed", "Stock reconciliation up to date"], strengths: ["Consistent double-witness process", "Timely PRN documentation"], areas_for_improvement: ["Storage temperature log gap on 2 days"], actions: [{ action: "Implement daily temperature check reminder", owner: "staff_anna", deadline: daysFromNow(-30), status: "completed" as const }, { action: "Laminate temperature log sheet for fridge", owner: "staff_ryan", deadline: daysFromNow(-30), status: "completed" as const }], notes: "" },
  { id: "qa_002", title: "Safeguarding Practice Audit", date: daysFromNow(-45), auditor: "staff_darren", scope: "safeguarding", overall_rating: "good" as const, score: 3, findings: ["DBS tracker current for all staff", "Safeguarding referrals timely"], strengths: ["Strong multi-agency communication", "Children know how to raise concerns"], areas_for_improvement: ["Risk assessment template needs updating", "Body map training due for 2 staff"], actions: [{ action: "Update risk assessment template", owner: "staff_darren", deadline: daysFromNow(-15), status: "completed" as const }, { action: "Book body map training for Anna and Lackson", owner: "staff_ryan", deadline: daysFromNow(-10), status: "completed" as const }, { action: "Review safeguarding policy cross-references", owner: "staff_darren", deadline: daysFromNow(-5), status: "overdue" as const }], notes: "" },
  { id: "qa_003", title: "Daily Recording Quality Audit", date: daysFromNow(-30), auditor: "staff_darren", scope: "recording", overall_rating: "requires_improvement" as const, score: 2, findings: ["Missing reflective analysis in 40% of entries", "Timestamp gaps on evening records"], strengths: ["Good factual recording of events"], areas_for_improvement: ["Reflective practice training needed", "Evening handover recording protocol", "Child voice not consistently captured", "Timestamps missing on 6 entries"], actions: [{ action: "Deliver reflective recording workshop", owner: "staff_darren", deadline: daysFromNow(-10), status: "completed" as const }, { action: "Create evening recording template", owner: "staff_ryan", deadline: daysFromNow(-5), status: "in_progress" as const }, { action: "Audit child voice inclusion monthly", owner: "staff_anna", deadline: daysFromNow(10), status: "pending" as const }, { action: "Implement timestamp auto-fill on mobile app", owner: "staff_darren", deadline: daysFromNow(-7), status: "overdue" as const }], notes: "" },
  { id: "qa_004", title: "Health & Safety Audit", date: daysFromNow(-20), auditor: "staff_ryan", scope: "health_safety", overall_rating: "excellent" as const, score: 4, findings: ["All areas clean and well-maintained", "Fire exits clear"], strengths: ["Excellent premises condition", "Regular deep cleaning schedule", "COSHH records up to date"], areas_for_improvement: ["Garden shed needs new lock"], actions: [{ action: "Replace garden shed lock", owner: "staff_edward", deadline: daysFromNow(-5), status: "completed" as const }, { action: "Order replacement first aid supplies", owner: "staff_anna", deadline: daysFromNow(-3), status: "completed" as const }], notes: "" },
  { id: "qa_005", title: "Care Planning Audit", date: daysFromNow(-10), auditor: "staff_darren", scope: "care_planning", overall_rating: "good" as const, score: 3, findings: ["All children have current care plans", "Placement plans reviewed on time"], strengths: ["Child participation in care plan reviews", "Multi-agency input evidenced"], areas_for_improvement: ["Pathway plan for Jordan needs update"], actions: [{ action: "Update Jordan pathway plan with leaving care PA", owner: "staff_darren", deadline: daysFromNow(14), status: "pending" as const }, { action: "Schedule Casey care plan review", owner: "staff_anna", deadline: daysFromNow(7), status: "pending" as const }, { action: "File Alex annual review minutes", owner: "staff_ryan", deadline: daysFromNow(-2), status: "completed" as const }], notes: "" },
  { id: "qa_006", title: "Fire Safety Audit", date: daysFromNow(-5), auditor: "staff_ryan", scope: "fire_safety", overall_rating: "good" as const, score: 3, findings: ["Fire drills on schedule", "Equipment serviced"], strengths: ["Monthly drill programme maintained", "All staff trained"], areas_for_improvement: ["Assembly point signage faded"], actions: [{ action: "Replace assembly point signage", owner: "staff_edward", deadline: daysFromNow(14), status: "pending" as const }], notes: "" },
] as QAAuditRecord[];

// ── Home Policies (Policies Intelligence) ─────────────────────────────────────

const policyAcks = (staffIds: string[]) => staffIds.map(id => ({ staff_id: id, acknowledged_at: daysFromNow(-30) }));
const allStaffAck = policyAcks(["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_lackson", "staff_chervelle", "staff_diane", "staff_mirela"]);
const partialAck = policyAcks(["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_lackson", "staff_chervelle"]);

store.homePolicies = [
  { id: "pol_001", title: "Safeguarding Children Policy", category: "safeguarding" as const, description: "Overarching safeguarding policy", version: "3.1", status: "current" as const, owner_id: "staff_darren", approved_by: "staff_darren", approved_date: daysFromNow(-90), effective_date: daysFromNow(-90), next_review_date: daysFromNow(45), last_reviewed: daysFromNow(-90), statutory_basis: "Reg 12, Reg 13", linked_standard: "SCCIF: Safe", key_points: ["Designated safeguarding lead", "Reporting procedures", "Multi-agency working"], read_acknowledgements: allStaffAck, total_staff_required: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "pol_002", title: "Care Practice Policy", category: "care_practice" as const, description: "Standards of care delivery", version: "2.0", status: "current" as const, owner_id: "staff_darren", approved_by: "staff_darren", approved_date: daysFromNow(-60), effective_date: daysFromNow(-60), next_review_date: daysFromNow(30), last_reviewed: daysFromNow(-60), statutory_basis: "Reg 6, Reg 7", linked_standard: "SCCIF: Experience", key_points: ["Child-centred approach", "Therapeutic care model"], read_acknowledgements: policyAcks(["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_lackson", "staff_chervelle", "staff_diane"]), total_staff_required: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "pol_003", title: "Health & Safety Policy", category: "health_safety" as const, description: "H&S management procedures", version: "2.4", status: "overdue" as const, owner_id: "staff_darren", approved_by: "staff_darren", approved_date: daysFromNow(-400), effective_date: daysFromNow(-400), next_review_date: daysFromNow(-14), last_reviewed: daysFromNow(-400), statutory_basis: "Reg 25", linked_standard: "SCCIF: Leadership", key_points: ["Risk assessments", "COSHH", "Fire safety"], read_acknowledgements: allStaffAck, total_staff_required: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "pol_004", title: "Workforce Development Policy", category: "workforce" as const, description: "Staff training and development", version: "1.5", status: "current" as const, owner_id: "staff_darren", approved_by: "staff_darren", approved_date: daysFromNow(-120), effective_date: daysFromNow(-120), next_review_date: daysFromNow(90), last_reviewed: daysFromNow(-120), statutory_basis: "Reg 33, Reg 34", linked_standard: "SCCIF: Leadership", key_points: ["Supervision", "Training matrix", "Appraisals"], read_acknowledgements: allStaffAck, total_staff_required: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "pol_005", title: "Behaviour Support Policy", category: "behaviour" as const, description: "Positive behaviour support framework", version: "3.0", status: "current" as const, owner_id: "staff_darren", approved_by: "staff_darren", approved_date: daysFromNow(-45), effective_date: daysFromNow(-45), next_review_date: daysFromNow(60), last_reviewed: daysFromNow(-45), statutory_basis: "Reg 9, Reg 19, Reg 20", linked_standard: "SCCIF: Safe", key_points: ["De-escalation", "Physical intervention", "Sanctions/rewards"], read_acknowledgements: partialAck, total_staff_required: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "pol_006", title: "Complaints Procedure", category: "complaints" as const, description: "How to make and handle complaints", version: "2.1", status: "overdue" as const, owner_id: "staff_darren", approved_by: "staff_darren", approved_date: daysFromNow(-380), effective_date: daysFromNow(-380), next_review_date: daysFromNow(-7), last_reviewed: daysFromNow(-380), statutory_basis: "Reg 39", linked_standard: "SCCIF: Leadership", key_points: ["Children's guide to complaining", "Timescales", "Advocacy"], read_acknowledgements: allStaffAck, total_staff_required: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "pol_007", title: "Data Protection Policy", category: "data_protection" as const, description: "GDPR compliance and data handling", version: "1.2", status: "current" as const, owner_id: "staff_darren", approved_by: "staff_darren", approved_date: daysFromNow(-180), effective_date: daysFromNow(-180), next_review_date: daysFromNow(120), last_reviewed: daysFromNow(-180), statutory_basis: "GDPR, DPA 2018", linked_standard: "SCCIF: Leadership", key_points: ["Data retention", "Subject access requests", "Breach procedures"], read_acknowledgements: allStaffAck, total_staff_required: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "pol_008", title: "Admissions Policy", category: "admissions" as const, description: "Referral and matching procedures", version: "1.8", status: "current" as const, owner_id: "staff_darren", approved_by: "staff_darren", approved_date: daysFromNow(-150), effective_date: daysFromNow(-150), next_review_date: daysFromNow(15), last_reviewed: daysFromNow(-150), statutory_basis: "Reg 14, Reg 15", linked_standard: "SCCIF: Experience", key_points: ["Matching criteria", "Impact assessment", "Transition planning"], read_acknowledgements: allStaffAck, total_staff_required: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "pol_009", title: "Missing from Care Policy", category: "missing_persons" as const, description: "Response to children missing", version: "2.2", status: "current" as const, owner_id: "staff_darren", approved_by: "staff_darren", approved_date: daysFromNow(-75), effective_date: daysFromNow(-75), next_review_date: daysFromNow(20), last_reviewed: daysFromNow(-75), statutory_basis: "Reg 12, Reg 34, Reg 40", linked_standard: "SCCIF: Safe", key_points: ["Return home interviews", "Grab bags", "Police liaison"], read_acknowledgements: allStaffAck, total_staff_required: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "pol_010", title: "Medication Policy", category: "medication" as const, description: "Safe medication management", version: "3.2", status: "current" as const, owner_id: "staff_darren", approved_by: "staff_darren", approved_date: daysFromNow(-30), effective_date: daysFromNow(-30), next_review_date: daysFromNow(50), last_reviewed: daysFromNow(-30), statutory_basis: "Reg 23", linked_standard: "SCCIF: Health", key_points: ["Storage", "Administration", "Error reporting"], read_acknowledgements: allStaffAck, total_staff_required: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "pol_011", title: "Fire Safety Policy", category: "fire_safety" as const, description: "Fire prevention and evacuation", version: "2.0", status: "current" as const, owner_id: "staff_ryan", approved_by: "staff_darren", approved_date: daysFromNow(-100), effective_date: daysFromNow(-100), next_review_date: daysFromNow(80), last_reviewed: daysFromNow(-100), statutory_basis: "Reg 25, Fire Safety Order 2005", linked_standard: "SCCIF: Safe", key_points: ["Drill schedule", "Equipment checks", "Night-time procedures"], read_acknowledgements: allStaffAck, total_staff_required: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "pol_012", title: "Whistleblowing Policy", category: "whistleblowing" as const, description: "Raising concerns procedure", version: "1.3", status: "current" as const, owner_id: "staff_darren", approved_by: "staff_darren", approved_date: daysFromNow(-200), effective_date: daysFromNow(-200), next_review_date: daysFromNow(100), last_reviewed: daysFromNow(-200), statutory_basis: "Reg 38, PIDA 1998", linked_standard: "SCCIF: Leadership", key_points: ["How to raise concerns", "Protection from reprisal", "External contacts"], read_acknowledgements: allStaffAck, total_staff_required: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
] as HomePolicy[];

// ── Protocol Drills (Emergency Intelligence) ──────────────────────────────────

store.protocolDrills = [
  { id: "drill_001", date: daysFromNow(-60), scenario_type: "evacuation" as const, scenario_description: "Daytime fire evacuation — all staff and children", lead_by: "staff_darren", participants: ["staff_darren", "staff_ryan", "staff_anna", "staff_edward"], response_time_minutes: 3, protocol_followed: true, deviations: "", learning_points: ["Assembly achieved in 3 minutes — within target"], actions_required: [], outcome: "satisfactory" as const, next_drill_due: daysFromNow(30), linked_protocol: "Fire Evacuation Plan", created_at: new Date().toISOString() },
  { id: "drill_002", date: daysFromNow(-30), scenario_type: "evacuation" as const, scenario_description: "Repeat daytime evacuation following building works", lead_by: "staff_ryan", participants: ["staff_ryan", "staff_anna", "staff_lackson", "staff_chervelle"], response_time_minutes: 2.5, protocol_followed: true, deviations: "", learning_points: ["Improved from previous drill — new signage helped"], actions_required: [], outcome: "satisfactory" as const, next_drill_due: daysFromNow(60), linked_protocol: "Fire Evacuation Plan", created_at: new Date().toISOString() },
  { id: "drill_003", date: daysFromNow(-90), scenario_type: "missing_child" as const, scenario_description: "Child reported missing during evening activity", lead_by: "staff_darren", participants: ["staff_darren", "staff_anna", "staff_edward"], response_time_minutes: 8, protocol_followed: true, deviations: "", learning_points: ["Search protocol executed correctly", "Police notification within timeframe"], actions_required: [], outcome: "satisfactory" as const, next_drill_due: daysFromNow(-10), linked_protocol: "Missing from Care Policy", created_at: new Date().toISOString() },
  { id: "drill_004", date: daysFromNow(-45), scenario_type: "medical_emergency" as const, scenario_description: "Simulated anaphylaxis response", lead_by: "staff_anna", participants: ["staff_anna", "staff_lackson", "staff_diane"], response_time_minutes: 5, protocol_followed: false, deviations: "EpiPen location not immediately found — moved since last check", learning_points: ["EpiPen location must be checked weekly", "Refresher training needed"], actions_required: ["Weekly EpiPen location check added to handover checklist", "Book anaphylaxis refresher for all staff"], outcome: "needs_improvement" as const, next_drill_due: daysFromNow(45), linked_protocol: "Medical Emergency Plan", created_at: new Date().toISOString() },
  { id: "drill_005", date: daysFromNow(-20), scenario_type: "power_failure" as const, scenario_description: "Simulated power outage during evening", lead_by: "staff_ryan", participants: ["staff_ryan", "staff_chervelle", "staff_edward"], response_time_minutes: 4, protocol_followed: true, deviations: "", learning_points: ["Torch batteries all working", "Children settled quickly"], actions_required: [], outcome: "satisfactory" as const, next_drill_due: daysFromNow(70), linked_protocol: "Power Failure Plan", created_at: new Date().toISOString() },
  { id: "drill_006", date: daysFromNow(-120), scenario_type: "intruder_alert" as const, scenario_description: "Unknown person at front door scenario", lead_by: "staff_darren", participants: ["staff_darren", "staff_ryan", "staff_anna"], response_time_minutes: 6, protocol_followed: true, deviations: "", learning_points: ["CCTV check first", "Children to safe room"], actions_required: [], outcome: "satisfactory" as const, next_drill_due: daysFromNow(-30), linked_protocol: "Intruder Alert Protocol", created_at: new Date().toISOString() },
  { id: "drill_007", date: daysFromNow(-15), scenario_type: "flooding" as const, scenario_description: "Burst pipe scenario in laundry room", lead_by: "staff_edward", participants: ["staff_edward", "staff_anna", "staff_lackson"], response_time_minutes: 3.5, protocol_followed: true, deviations: "", learning_points: ["Stopcock location known by all participants"], actions_required: [], outcome: "satisfactory" as const, next_drill_due: daysFromNow(75), linked_protocol: "Flood Plan", created_at: new Date().toISOString() },
  { id: "drill_008", date: daysFromNow(-7), scenario_type: "evacuation" as const, scenario_description: "Night-time fire evacuation drill", lead_by: "staff_anna", participants: ["staff_anna", "staff_chervelle"], response_time_minutes: 4.2, protocol_followed: true, deviations: "", learning_points: ["All children accounted for within 4 minutes", "Emergency lighting working"], actions_required: [], outcome: "satisfactory" as const, next_drill_due: daysFromNow(83), linked_protocol: "Fire Evacuation Plan", created_at: new Date().toISOString() },
] as ProtocolDrill[];

// ── Emergency Plans (Emergency Intelligence) ──────────────────────────────────

store.emergencyPlans = [
  { id: "eplan_001", title: "Fire Evacuation Plan", plan_type: "fire_evacuation" as const, colour: "red", scenario: "Fire detected in any part of the building", immediate_actions: ["Activate fire alarm", "Evacuate to assembly point", "Call 999", "Account for all persons"], contact_sequence: [{ who: "Fire Brigade", number: "999", when: "Immediately" }, { who: "Registered Manager", number: "07xxx", when: "Within 5 minutes" }], evacuation_required: true, assembly_point: "Front car park by the oak tree", child_considerations: ["Casey needs support down stairs", "Alex may resist leaving bedroom"], staff_roles: ["Senior on duty leads evacuation", "Night staff sweeps bedrooms"], equipment_needed: ["Fire blanket", "First aid kit", "Grab bag"], recovery_actions: ["Contact all parents/carers", "Notify Ofsted if serious"], last_tested: daysFromNow(-7), next_test: daysFromNow(83), status: "current" as const, created_at: new Date().toISOString() },
  { id: "eplan_002", title: "Power Failure Plan", plan_type: "power_failure" as const, colour: "amber", scenario: "Complete power loss to the home", immediate_actions: ["Check fuse box", "Deploy torches", "Reassure children", "Contact utility provider"], contact_sequence: [{ who: "Electricity provider", number: "105", when: "Immediately" }, { who: "Registered Manager", number: "07xxx", when: "Within 15 minutes" }], evacuation_required: false, assembly_point: null, child_considerations: ["Jordan anxious in dark — nightlight battery backup available"], staff_roles: ["Senior staff coordinates response", "One staff stays with children"], equipment_needed: ["Torches", "Battery radio", "Blankets"], recovery_actions: ["Check all appliances safe when power returns", "Log duration and impact"], last_tested: daysFromNow(-20), next_test: daysFromNow(70), status: "current" as const, created_at: new Date().toISOString() },
  { id: "eplan_003", title: "Flood / Water Damage Plan", plan_type: "flood_water_damage" as const, colour: "blue", scenario: "Burst pipe or external flooding", immediate_actions: ["Turn off water at stopcock", "Move children upstairs if ground floor affected", "Protect electrics"], contact_sequence: [{ who: "Emergency plumber", number: "01onal", when: "Immediately" }, { who: "Insurance company", number: "0800xxx", when: "Within 1 hour" }], evacuation_required: false, assembly_point: null, child_considerations: ["Ensure medication stored safely above water level"], staff_roles: ["Senior staff assesses severity", "Support staff secures belongings"], equipment_needed: ["Sandbags", "Mops", "Dehumidifier"], recovery_actions: ["Photograph damage for insurance", "Arrange alternative accommodation if needed"], last_tested: daysFromNow(-100), next_test: daysFromNow(-10), status: "review_due" as const, created_at: new Date().toISOString() },
  { id: "eplan_004", title: "Serious Incident Plan", plan_type: "serious_incident" as const, colour: "red", scenario: "Serious injury, death, or major safeguarding event", immediate_actions: ["Call 999 if medical emergency", "Secure scene", "Notify manager immediately", "Begin contemporaneous notes"], contact_sequence: [{ who: "Emergency services", number: "999", when: "Immediately" }, { who: "Ofsted", number: "0300 123 1231", when: "Within 24 hours" }, { who: "Local Authority MASH", number: "01xxx", when: "Same day" }], evacuation_required: false, assembly_point: null, child_considerations: ["Other children may need immediate reassurance and debriefing"], staff_roles: ["Manager leads response", "Staff provide 1:1 support to children"], equipment_needed: ["First aid kit", "Defibrillator", "Incident report forms"], recovery_actions: ["Staff debrief within 24 hours", "RIDDOR report if applicable", "Review risk assessments"], last_tested: daysFromNow(-30), next_test: daysFromNow(60), status: "current" as const, created_at: new Date().toISOString() },
] as EmergencyPlan[];

// ── Staff Wellbeing Records ─────────────────────────────────────────────────
store.staffWellbeingRecords = [
  {
    id: "swbr_001", staff_id: "staff_edward", date: daysFromNow(-3),
    type: "monthly_checkin" as const,
    overall_score: 7, workload_score: 6, support_score: 8, moral_score: 7,
    stressors: ["Long shifts this week", "Missing episode paperwork backlog"],
    positives: ["Good relationship with Alex", "Team support"],
    support_needed: "Help catching up on recording",
    action_agreed: "Ryan to cover one shift next week to allow admin catch-up",
    follow_up_date: daysFromNow(25), conducted_by: "staff_ryan",
    confidential: false, notes: "Edward generally positive. Enjoys the work but finding paperwork challenging.",
  },
  {
    id: "swbr_002", staff_id: "staff_anna", date: daysFromNow(-10),
    type: "post_incident" as const,
    overall_score: 5, workload_score: 5, support_score: 7, moral_score: 4,
    stressors: ["Witnessing physical intervention with Alex", "Worry about doing the right thing"],
    positives: ["Felt supported by team after incident", "Debrief was helpful"],
    support_needed: "Refresher on Team Teach techniques",
    action_agreed: "Book onto next Team Teach refresher. Darren to provide 1:1 reflective session.",
    follow_up_date: daysFromNow(4), conducted_by: "staff_darren",
    confidential: false, notes: "Anna shaken after witnessing PI. No signs of burnout but needs reassurance.",
  },
  {
    id: "swbr_003", staff_id: "staff_diane", date: daysFromNow(-7),
    type: "return_from_absence" as const,
    overall_score: 6, workload_score: 5, support_score: 6, moral_score: 6,
    stressors: ["Returning after sickness", "Catching up with changes"],
    positives: ["Glad to be back", "Children happy to see her"],
    support_needed: "Briefing on any changes during absence",
    action_agreed: "Ryan to provide catch-up briefing on shift. Phased return first two days.",
    follow_up_date: daysFromNow(7), conducted_by: "staff_ryan",
    confidential: false, notes: "Diane returning from stomach bug. Phased return agreed.",
  },
  {
    id: "swbr_004", staff_id: "staff_lackson", date: daysFromNow(-14),
    type: "monthly_checkin" as const,
    overall_score: 8, workload_score: 7, support_score: 9, moral_score: 8,
    stressors: ["Sometimes finds sleep-in shifts tiring"],
    positives: ["Loves working with Jordan", "Football sessions going well", "Good team morale"],
    support_needed: "None at present",
    action_agreed: "Continue as is. Review shift pattern if tiredness persists.",
    follow_up_date: daysFromNow(16), conducted_by: "staff_darren",
    confidential: false, notes: "Lackson thriving. Very positive about the home and his role.",
  },
  {
    id: "swbr_005", staff_id: "staff_chervelle", date: daysFromNow(-5),
    type: "supervision_wellbeing" as const,
    overall_score: 7, workload_score: 7, support_score: 8, moral_score: 7,
    stressors: ["Casey's emotional dysregulation can be draining", "Wants more training on trauma-informed care"],
    positives: ["Strong bond with Casey", "Feels valued by management"],
    support_needed: "Trauma-informed care training",
    action_agreed: "Darren to source TIC training. Chervelle to attend within 8 weeks.",
    follow_up_date: daysFromNow(23), conducted_by: "staff_darren",
    confidential: false, notes: "Chervelle is a dedicated worker. Trauma-informed training will strengthen her practice.",
  },
  {
    id: "swbr_006", staff_id: "staff_mirela", date: daysFromNow(-20),
    type: "manager_concern" as const,
    overall_score: 4, workload_score: 4, support_score: 5, moral_score: 3,
    stressors: ["Language barrier in documentation", "Feeling isolated at times", "Unsure about probation expectations"],
    positives: ["Children like her", "Willing to learn"],
    support_needed: "Mentoring from experienced staff member. English support for recording.",
    action_agreed: "Anna assigned as mentor. Darren to review probation objectives with Mirela. Recording templates provided.",
    follow_up_date: daysFromNow(-6), conducted_by: "staff_darren",
    confidential: false, notes: "Mirela struggling with confidence. Needs structured support during probation.",
  },
  {
    id: "swbr_007", staff_id: "staff_alex", date: daysFromNow(-12),
    type: "monthly_checkin" as const,
    overall_score: 6, workload_score: 6, support_score: 7, moral_score: 6,
    stressors: ["New to residential care", "Learning curve steep"],
    positives: ["Enthusiastic", "Good rapport with young people"],
    support_needed: "Shadowing opportunities with experienced staff",
    action_agreed: "Schedule shadowing with Edward and Anna over next fortnight.",
    follow_up_date: daysFromNow(2), conducted_by: "staff_ryan",
    confidential: false, notes: "Alex Bennett settling in well. Needs continued induction support.",
  },
  {
    id: "swbr_008", staff_id: "staff_ryan", date: daysFromNow(-8),
    type: "monthly_checkin" as const,
    overall_score: 7, workload_score: 6, support_score: 7, moral_score: 8,
    stressors: ["Workload increasing with deputy responsibilities", "Covering supervisions when Darren unavailable"],
    positives: ["Enjoys leadership role", "Good relationship with whole team"],
    support_needed: "Protected admin time",
    action_agreed: "Darren to ensure Ryan has one protected admin day per fortnight.",
    follow_up_date: daysFromNow(22), conducted_by: "staff_darren",
    confidential: false, notes: "Ryan managing well but workload needs monitoring as deputy demands increase.",
  },
] as StaffWellbeingRecord[];

// ── Peer Dynamics ───────────────────────────────────────────────────────────
store.peerDynamics = [
  {
    id: "pd_001", child_id_1: "yp_alex", child_id_2: "yp_jordan",
    quality: "developing" as const, risk_level: "low" as const,
    strengths: ["Share interest in football", "Can co-regulate during activities"],
    concerns: ["Alex can dominate conversations", "Jordan withdraws when Alex escalates"],
    strategies: ["Staff to facilitate turn-taking during shared activities", "Separate debrief after any tension"],
    entries: [
      { id: "pe_001", date: daysFromNow(-5), type: "positive_interaction" as const, description: "Alex and Jordan played FIFA together for an hour. Took turns, no conflict.", staff_witness: "staff_lackson", intervention_used: "", outcome: "Positive evening. Both in good mood." },
      { id: "pe_002", date: daysFromNow(-12), type: "observation" as const, description: "Jordan seemed quiet during dinner with Alex present. Alex talking loudly about missing episode.", staff_witness: "staff_anna", intervention_used: "Staff redirected conversation to neutral topic.", outcome: "Jordan relaxed after topic changed." },
      { id: "pe_003", date: daysFromNow(-20), type: "mediation" as const, description: "Disagreement over TV remote. Alex refused to share. Jordan became upset.", staff_witness: "staff_chervelle", intervention_used: "Mediation — agreed on a rota for TV time.", outcome: "Both accepted rota. No further issues." },
    ],
    last_review_date: daysFromNow(-7), reviewed_by: "staff_darren",
    next_review_due: daysFromNow(23), notes: "Developing relationship. Positive when structured, risky when unstructured.",
    created_at: daysFromNow(-60) + "T10:00:00Z",
  },
  {
    id: "pd_002", child_id_1: "yp_alex", child_id_2: "yp_casey",
    quality: "strained" as const, risk_level: "medium" as const,
    strengths: ["Can coexist in communal areas with staff present"],
    concerns: ["Alex's behaviour escalation triggers Casey's anxiety", "Casey avoids communal areas when Alex is dysregulated", "Power imbalance — Alex older and more physically imposing"],
    strategies: ["Never leave unsupervised together", "Proactive separation during Alex's escalation", "Casey given safe space signal"],
    entries: [
      { id: "pe_004", date: daysFromNow(-3), type: "incident" as const, description: "Alex slammed door during argument with staff. Casey had panic attack in her room.", staff_witness: "staff_chervelle", intervention_used: "Chervelle supported Casey with grounding techniques. Edward de-escalated Alex separately.", outcome: "Casey settled after 20 mins. Alex apologised later." },
      { id: "pe_005", date: daysFromNow(-15), type: "observation" as const, description: "Casey chose to eat in dining room with Alex present. Conversation was polite. Positive step.", staff_witness: "staff_diane", intervention_used: "", outcome: "Successful shared mealtime. Staff praised both." },
      { id: "pe_006", date: daysFromNow(-25), type: "review" as const, description: "Formal review of Alex-Casey dynamic. Risk assessment updated. Strategies reinforced.", staff_witness: "staff_darren", intervention_used: "Risk assessment reviewed with team.", outcome: "Strategies updated. Team briefed." },
    ],
    last_review_date: daysFromNow(-3), reviewed_by: "staff_darren",
    next_review_due: daysFromNow(11), notes: "Strained relationship requiring active management. Casey's wellbeing is priority.",
    created_at: daysFromNow(-45) + "T10:00:00Z",
  },
  {
    id: "pd_003", child_id_1: "yp_jordan", child_id_2: "yp_casey",
    quality: "positive" as const, risk_level: "none" as const,
    strengths: ["Naturally supportive of each other", "Casey helps Jordan with homework", "Jordan includes Casey in activities"],
    concerns: [],
    strategies: ["Continue to facilitate positive interactions", "Use this relationship as a model for group dynamics"],
    entries: [
      { id: "pe_007", date: daysFromNow(-2), type: "positive_interaction" as const, description: "Jordan and Casey baked cookies together. Casey taught Jordan her recipe. Both laughing and engaged.", staff_witness: "staff_mirela", intervention_used: "", outcome: "Excellent engagement. Both proud of result." },
      { id: "pe_008", date: daysFromNow(-8), type: "positive_interaction" as const, description: "Casey helped Jordan with maths homework. Jordan was grateful and said 'thank you' without prompting.", staff_witness: "staff_anna", intervention_used: "", outcome: "Positive peer support. Both benefited." },
    ],
    last_review_date: daysFromNow(-10), reviewed_by: "staff_ryan",
    next_review_due: daysFromNow(20), notes: "Healthy, supportive relationship. A genuine strength of the home.",
    created_at: daysFromNow(-40) + "T10:00:00Z",
  },
] as PeerDynamic[];

store.peerGroupDynamics = [
  {
    id: "pgd_001", assessment_date: daysFromNow(-4), assessed_by: "staff_darren",
    overall_atmosphere: "mixed" as const,
    group_strengths: ["Jordan-Casey friendship stabilises the home", "Shared activities generally well-received", "Young people can eat together most evenings"],
    group_concerns: ["Alex's escalations impact the whole group", "Casey's anxiety increases during Alex's difficult periods", "Power dynamic imbalance between oldest and youngest"],
    current_dynamics: "The home has a mixed atmosphere. Jordan and Casey have a stabilising positive relationship, but Alex's behaviour can destabilise the group quickly. When Alex is regulated, the group functions well. Staff presence is critical for maintaining equilibrium.",
    recommendations: ["Increase structured group activities during stable periods", "Review Alex's BSP with focus on group impact", "Consider therapeutic group session facilitated by external therapist"],
    created_at: daysFromNow(-4) + "T14:00:00Z",
  },
  {
    id: "pgd_002", assessment_date: daysFromNow(-35), assessed_by: "staff_ryan",
    overall_atmosphere: "calm" as const,
    group_strengths: ["All three young people engaged in house meeting", "No peer conflicts this week", "Positive feedback from school about all three"],
    group_concerns: ["Need to monitor whether calm is genuine or suppressed"],
    current_dynamics: "A particularly calm and productive period. All three engaged well in house meeting and expressed their views. Alex more settled this week following positive school report.",
    recommendations: ["Maintain current approach", "Plan a group outing to reinforce positive dynamics"],
    created_at: daysFromNow(-35) + "T11:00:00Z",
  },
] as PeerGroupDynamic[];

// ── On-Call Shifts ──────────────────────────────────────────────────────────
store.onCallShifts = [
  {
    id: "oc_001", date_from: daysFromNow(-1) + "T17:00:00Z", date_to: today + "T08:00:00Z",
    role: "first_line_rm" as const, on_call_staff: "staff_darren", backup_staff: "staff_ryan",
    contact_number: "07700 000001", shift_pattern: "weekday_evenings" as const,
    calls_received: [
      { datetime: daysFromNow(-1) + "T22:30:00Z", from_contact: "staff_anna", call_type: "routine", duration_mins: 8, outcome: "Advised on medication timing query. No further action.", escalated: false },
    ],
    critical_incidents_handled: 0, routine_calls_handled: 1, advisory_calls_handled: 0,
    staff_wellbeing_during_on_call: "Fine — one call only.",
    feedback_on_arrangements: "Clear and well-documented handover from shift staff.",
    review_notes: "", created_at: daysFromNow(-1) + "T17:00:00Z",
  },
  {
    id: "oc_002", date_from: daysFromNow(-3) + "T17:00:00Z", date_to: daysFromNow(-2) + "T08:00:00Z",
    role: "first_line_rm" as const, on_call_staff: "staff_darren", backup_staff: "staff_ryan",
    contact_number: "07700 000001", shift_pattern: "weekday_evenings" as const,
    calls_received: [
      { datetime: daysFromNow(-3) + "T19:20:00Z", from_contact: "staff_edward", call_type: "critical", duration_mins: 35, outcome: "Alex safeguarding disclosure. RM attended home. Social worker and police notified.", escalated: true },
      { datetime: daysFromNow(-3) + "T21:00:00Z", from_contact: "staff_edward", call_type: "advisory", duration_mins: 12, outcome: "Follow-up re: Alex settling. Advice on bedtime supervision.", escalated: false },
    ],
    critical_incidents_handled: 1, routine_calls_handled: 0, advisory_calls_handled: 1,
    staff_wellbeing_during_on_call: "Stressful evening due to safeguarding disclosure. Darren debriefed with RI next morning.",
    feedback_on_arrangements: "System worked well. Escalation was appropriate. RM attended within 25 minutes.",
    review_notes: "Consider adding specific safeguarding on-call protocol.", created_at: daysFromNow(-3) + "T17:00:00Z",
  },
  {
    id: "oc_003", date_from: daysFromNow(-7) + "T17:00:00Z", date_to: daysFromNow(-5) + "T08:00:00Z",
    role: "first_line_rm" as const, on_call_staff: "staff_darren", backup_staff: "staff_ryan",
    contact_number: "07700 000001", shift_pattern: "weekend_full" as const,
    calls_received: [
      { datetime: daysFromNow(-7) + "T20:00:00Z", from_contact: "staff_chervelle", call_type: "routine", duration_mins: 5, outcome: "Query about visitor protocol. Advised.", escalated: false },
      { datetime: daysFromNow(-6) + "T14:30:00Z", from_contact: "staff_lackson", call_type: "routine", duration_mins: 10, outcome: "Jordan's father called unexpectedly. Advised on contact plan.", escalated: false },
      { datetime: daysFromNow(-6) + "T23:15:00Z", from_contact: "staff_anna", call_type: "advisory", duration_mins: 15, outcome: "Casey not settling at bedtime. Discussed strategies. Resolved.", escalated: false },
    ],
    critical_incidents_handled: 0, routine_calls_handled: 2, advisory_calls_handled: 1,
    staff_wellbeing_during_on_call: "Weekend was manageable. Good sleep between calls.",
    feedback_on_arrangements: "Weekend rota works well. Backup was aware and available.",
    review_notes: "", created_at: daysFromNow(-7) + "T17:00:00Z",
  },
  {
    id: "oc_004", date_from: daysFromNow(-8) + "T17:00:00Z", date_to: daysFromNow(-7) + "T08:00:00Z",
    role: "second_line_deputy" as const, on_call_staff: "staff_ryan", backup_staff: "staff_darren",
    contact_number: "07700 000002", shift_pattern: "weekday_evenings" as const,
    calls_received: [],
    critical_incidents_handled: 0, routine_calls_handled: 0, advisory_calls_handled: 0,
    staff_wellbeing_during_on_call: "Quiet night. No calls received.",
    feedback_on_arrangements: "Good to have second-line cover. RM was first-line same evening.",
    review_notes: "", created_at: daysFromNow(-8) + "T17:00:00Z",
  },
  {
    id: "oc_005", date_from: daysFromNow(-14) + "T17:00:00Z", date_to: daysFromNow(-12) + "T08:00:00Z",
    role: "first_line_rm" as const, on_call_staff: "staff_darren", backup_staff: "staff_ryan",
    contact_number: "07700 000001", shift_pattern: "weekend_full" as const,
    calls_received: [
      { datetime: daysFromNow(-14) + "T18:45:00Z", from_contact: "staff_mirela", call_type: "advisory", duration_mins: 20, outcome: "Mirela unsure about recording process. Guided through template.", escalated: false },
    ],
    critical_incidents_handled: 0, routine_calls_handled: 0, advisory_calls_handled: 1,
    staff_wellbeing_during_on_call: "Fine. Quiet weekend apart from one advisory call.",
    feedback_on_arrangements: "Consider making recording templates more accessible for newer staff.",
    review_notes: "New staff may need more support — add recording guidance to on-call pack.", created_at: daysFromNow(-14) + "T17:00:00Z",
  },
  {
    id: "oc_006", date_from: today + "T17:00:00Z", date_to: daysFromNow(1) + "T08:00:00Z",
    role: "first_line_rm" as const, on_call_staff: "staff_darren", backup_staff: "staff_ryan",
    contact_number: "07700 000001", shift_pattern: "weekday_evenings" as const,
    calls_received: [],
    critical_incidents_handled: 0, routine_calls_handled: 0, advisory_calls_handled: 0,
    staff_wellbeing_during_on_call: "",
    feedback_on_arrangements: "",
    review_notes: "", created_at: today + "T08:00:00Z",
  },
] as OnCallShift[];

// ── Transition Planning Records (Reg 14) ────────────────────────────────────
store.transitionPlanningRecords = [
  // Alex — 17, should have robust transition plan. 4 goals across areas.
  {
    id: "tpr_001", child_id: "yp_alex",
    area: "independent_living" as const, goal: "Cook 3 meals independently per week",
    description: "Alex is learning to plan, shop, and cook basic meals. Building towards full independence.",
    status: "on_track" as const, target_date: "2026-09-01", start_date: "2026-01-15",
    key_worker: "staff_darren", actions: ["Weekly cooking session", "Create meal planner", "Budget for ingredients"],
    progress: "Now confidently cooking pasta dishes and jacket potatoes. Learning stir-fry this month.",
    percent_complete: 65, review_date: daysFromNow(-10), notes: "Enjoying cooking — wants to try baking next.",
    created_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "tpr_002", child_id: "yp_alex",
    area: "financial" as const, goal: "Open and manage own bank account",
    description: "Alex needs to understand banking, budgeting, and managing money for post-18 transition.",
    status: "in_progress" as const, target_date: "2026-07-01", start_date: "2026-02-01",
    key_worker: "staff_darren", actions: ["Visit bank to open account", "Set up standing order for savings", "Complete budgeting workbook"],
    progress: "Account opened. Learning to use banking app. Budgeting workbook 50% complete.",
    percent_complete: 50, review_date: daysFromNow(-5), notes: "PA also supporting with this.",
    created_at: "2026-02-01T10:00:00Z",
  },
  {
    id: "tpr_003", child_id: "yp_alex",
    area: "education_employment" as const, goal: "Secure part-time employment or apprenticeship",
    description: "Alex wants to work in IT. Exploring apprenticeships and part-time roles.",
    status: "at_risk" as const, target_date: "2026-08-01", start_date: "2026-03-01",
    key_worker: "staff_ryan", actions: ["Create CV", "Apply to 3 apprenticeships", "Practice interview skills"],
    progress: "CV created but applications not yet submitted. Needs more support with confidence.",
    percent_complete: 25, review_date: daysFromNow(-20), notes: "Review overdue — needs chasing.",
    created_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "tpr_004", child_id: "yp_alex",
    area: "health_wellbeing" as const, goal: "Register with GP and dentist independently",
    description: "Preparing Alex to manage own health appointments post-18.",
    status: "achieved" as const, target_date: "2026-06-01", start_date: "2026-01-15",
    key_worker: "staff_darren", actions: ["Visit GP surgery together", "Register at dentist", "Create health folder"],
    progress: "Registered with GP and dentist. Health folder maintained. Attended last appointment independently.",
    percent_complete: 100, review_date: daysFromNow(-7), notes: "Excellent progress — fully independent here.",
    created_at: "2026-01-15T10:00:00Z",
  },
  // Jordan — 15, earlier stage. 2 goals started.
  {
    id: "tpr_005", child_id: "yp_jordan",
    area: "relationships" as const, goal: "Identify and maintain positive support network",
    description: "Jordan is mapping trusted adults and peers for long-term support.",
    status: "in_progress" as const, target_date: "2026-12-01", start_date: "2026-04-01",
    key_worker: "staff_anna", actions: ["Complete relationship map", "Reconnect with mentor", "Attend youth group"],
    progress: "Relationship map started. Attending youth group fortnightly.",
    percent_complete: 30, review_date: daysFromNow(-12), notes: "",
    created_at: "2026-04-01T10:00:00Z",
  },
  {
    id: "tpr_006", child_id: "yp_jordan",
    area: "independent_living" as const, goal: "Learn to do own laundry and basic cleaning",
    description: "Building practical independent living skills appropriate to age.",
    status: "not_started" as const, target_date: "2026-10-01", start_date: "2026-06-01",
    key_worker: "staff_anna", actions: ["Create laundry routine", "Practice weekly with support", "Learn to use washing machine"],
    progress: "",
    percent_complete: 0, review_date: "", notes: "Planned to start after half-term.",
    created_at: "2026-05-20T10:00:00Z",
  },
  // Casey — 14, just 1 early goal (younger child, earlier pathway stage).
  {
    id: "tpr_007", child_id: "yp_casey",
    area: "identity" as const, goal: "Explore life story work and cultural identity",
    description: "Casey wants to understand their history and build a strong sense of identity.",
    status: "in_progress" as const, target_date: "2027-03-01", start_date: "2026-03-15",
    key_worker: "staff_chervelle", actions: ["Begin life story book", "Connect with cultural community group", "Therapeutic sessions around identity"],
    progress: "Life story book started. Two therapeutic sessions completed. Cultural group identified.",
    percent_complete: 35, review_date: daysFromNow(-8), notes: "Casey is engaging well. Sensitive area — pace carefully.",
    created_at: "2026-03-15T10:00:00Z",
  },
] as TransitionPlanningRecord[];

// ── Delegated Authority (Reg 22) ────────────────────────────────────────────
store.delegatedAuthority = [
  {
    id: "da_001", child_id: "yp_alex",
    last_reviewed: daysFromNow(-15), next_review: daysFromNow(75),
    items: [
      { category: "medical" as const, status: "granted" as const, detail: "RM to consent to routine medical/dental appointments.", conditions: "Excludes elective surgery — requires SW authorisation.", granted_by: "SW Sarah Collins", granted_date: "2026-02-10", review_date: daysFromNow(75) },
      { category: "education" as const, status: "granted" as const, detail: "RM/keyworker to authorise school trips, parent evening attendance.", conditions: "Overnight trips require SW approval.", granted_by: "SW Sarah Collins", granted_date: "2026-02-10", review_date: daysFromNow(75) },
      { category: "haircut_appearance" as const, status: "granted" as const, detail: "Alex can choose own haircut. Staff to facilitate.", conditions: "No extreme changes without discussion with Alex's mother.", granted_by: "SW Sarah Collins", granted_date: "2026-02-10", review_date: daysFromNow(75) },
      { category: "overnight_stays" as const, status: "partial" as const, detail: "Overnight stays with approved friends — RM to authorise after DBS check.", conditions: "Maximum 2 consecutive nights. New friends need SW approval.", granted_by: "SW Sarah Collins", granted_date: "2026-02-10", review_date: daysFromNow(75) },
      { category: "social_media" as const, status: "granted" as const, detail: "Alex can use social media with agreed safety plan.", conditions: "Staff to monitor periodically. No location sharing.", granted_by: "SW Sarah Collins", granted_date: "2026-02-10", review_date: daysFromNow(75) },
      { category: "leisure" as const, status: "granted" as const, detail: "Staff to facilitate leisure activities and clubs.", conditions: "None.", granted_by: "SW Sarah Collins", granted_date: "2026-02-10", review_date: daysFromNow(75) },
      { category: "travel" as const, status: "granted" as const, detail: "Local independent travel agreed. Public transport from age 16.", conditions: "Must inform staff of destination and expected return.", granted_by: "SW Sarah Collins", granted_date: "2026-02-10", review_date: daysFromNow(75) },
      { category: "pocket_money" as const, status: "granted" as const, detail: "Weekly pocket money managed by keyworker.", conditions: "Recorded in finance log.", granted_by: "SW Sarah Collins", granted_date: "2026-02-10", review_date: daysFromNow(75) },
      { category: "photography" as const, status: "granted" as const, detail: "Consent for home's internal photos. No social media of Alex.", conditions: "No identifying photos on home's website or social media.", granted_by: "SW Sarah Collins", granted_date: "2026-02-10", review_date: daysFromNow(75) },
      { category: "emergency" as const, status: "granted" as const, detail: "RM authorised for emergency medical decisions.", conditions: "Notify SW as soon as practicable.", granted_by: "SW Sarah Collins", granted_date: "2026-02-10", review_date: daysFromNow(75) },
    ],
    notes: "Comprehensive delegated authority in place. Alex's mother consulted and agrees.",
  },
  {
    id: "da_002", child_id: "yp_jordan",
    last_reviewed: daysFromNow(-40), next_review: daysFromNow(50),
    items: [
      { category: "medical" as const, status: "granted" as const, detail: "RM to consent to routine medical.", conditions: "None.", granted_by: "SW Marcus Obi", granted_date: "2026-01-20", review_date: daysFromNow(50) },
      { category: "education" as const, status: "granted" as const, detail: "RM to sign school documents and attend parents' evenings.", conditions: "None.", granted_by: "SW Marcus Obi", granted_date: "2026-01-20", review_date: daysFromNow(50) },
      { category: "leisure" as const, status: "granted" as const, detail: "Staff to take Jordan to football and swimming.", conditions: "None.", granted_by: "SW Marcus Obi", granted_date: "2026-01-20", review_date: daysFromNow(50) },
      { category: "overnight_stays" as const, status: "not_granted" as const, detail: "Not yet agreed due to placement stability concerns.", conditions: "To review at next LAC review.", granted_by: "SW Marcus Obi", granted_date: "2026-01-20", review_date: daysFromNow(50) },
      { category: "contact" as const, status: "partial" as const, detail: "Supervised contact with father. Unsupervised phone with mother.", conditions: "Father contact must be supervised by staff member.", granted_by: "SW Marcus Obi", granted_date: "2026-01-20", review_date: daysFromNow(50) },
      { category: "emergency" as const, status: "granted" as const, detail: "RM authorised for emergency decisions.", conditions: "Notify SW immediately.", granted_by: "SW Marcus Obi", granted_date: "2026-01-20", review_date: daysFromNow(50) },
    ],
    notes: "Review due after LAC review in July. Some areas pending due to father's contact order.",
  },
  {
    id: "da_003", child_id: "yp_casey",
    last_reviewed: daysFromNow(-90), next_review: daysFromNow(-5),
    items: [
      { category: "medical" as const, status: "granted" as const, detail: "RM to consent to routine medical.", conditions: "None.", granted_by: "SW Lisa Chen", granted_date: "2025-12-01", review_date: daysFromNow(-5) },
      { category: "education" as const, status: "pending" as const, detail: "Awaiting new school placement confirmation.", conditions: "To be updated once school is confirmed.", granted_by: "SW Lisa Chen", granted_date: "2025-12-01", review_date: daysFromNow(-5) },
      { category: "leisure" as const, status: "granted" as const, detail: "Staff to facilitate art club and drama group.", conditions: "None.", granted_by: "SW Lisa Chen", granted_date: "2025-12-01", review_date: daysFromNow(-5) },
      { category: "emergency" as const, status: "granted" as const, detail: "RM authorised.", conditions: "Notify SW asap.", granted_by: "SW Lisa Chen", granted_date: "2025-12-01", review_date: daysFromNow(-5) },
    ],
    notes: "Review overdue — chase SW Lisa Chen. Education authority pending school confirmation.",
  },
] as DelegatedAuthority[];

// ── Fire Drills (Reg 25) ────────────────────────────────────────────────────
store.fireDrills = [
  {
    id: "fd_001", date: daysFromNow(-10), time: "14:30",
    drill_type: "fire_drill" as const, evacuation_time_seconds: 95,
    result: "satisfactory" as const, all_present: true,
    children_present: ["yp_alex", "yp_jordan", "yp_casey"],
    staff_present: ["staff_darren", "staff_anna", "staff_edward"],
    issues: "", actions_taken: "All accounted for within target time.",
    next_drill_due: daysFromNow(20), conducted_by: "staff_darren",
    notes: "Daytime drill — smooth evacuation via front entrance.",
    created_at: daysFromNow(-10) + "T14:30:00Z",
  },
  {
    id: "fd_002", date: daysFromNow(-40), time: "22:15",
    drill_type: "fire_drill" as const, evacuation_time_seconds: 145,
    result: "issues_identified" as const, all_present: true,
    children_present: ["yp_alex", "yp_jordan", "yp_casey"],
    staff_present: ["staff_anna", "staff_lackson"],
    issues: "Casey took longer to respond from bedroom — needed prompting. Evacuation time exceeded 2 min target.",
    actions_taken: "Reviewed fire safety with Casey. Updated PEEP for Casey's bedroom.",
    next_drill_due: daysFromNow(-10), conducted_by: "staff_anna",
    notes: "Night drill — important learning points. Casey's PEEP updated same week.",
    created_at: daysFromNow(-40) + "T22:15:00Z",
  },
  {
    id: "fd_003", date: daysFromNow(-70), time: "10:00",
    drill_type: "fire_drill" as const, evacuation_time_seconds: 88,
    result: "satisfactory" as const, all_present: false,
    children_present: ["yp_alex", "yp_jordan"],
    staff_present: ["staff_darren", "staff_chervelle"],
    issues: "Casey at school — not present.", actions_taken: "Drill recorded. Casey briefed on return.",
    next_drill_due: daysFromNow(-40), conducted_by: "staff_darren",
    notes: "Morning drill during school time. Casey absent — noted in log.",
    created_at: daysFromNow(-70) + "T10:00:00Z",
  },
  {
    id: "fd_004", date: daysFromNow(-15), time: "09:00",
    drill_type: "equipment_check" as const, evacuation_time_seconds: null,
    result: "satisfactory" as const, all_present: false,
    children_present: [],
    staff_present: ["staff_darren"],
    issues: "", actions_taken: "All fire extinguishers in date. Smoke detectors tested — all operational. Emergency lighting checked.",
    next_drill_due: daysFromNow(15), conducted_by: "staff_darren",
    notes: "Monthly fire equipment check. All items passed.",
    created_at: daysFromNow(-15) + "T09:00:00Z",
  },
  {
    id: "fd_005", date: daysFromNow(-45), time: "09:30",
    drill_type: "equipment_check" as const, evacuation_time_seconds: null,
    result: "issues_identified" as const, all_present: false,
    children_present: [],
    staff_present: ["staff_ryan"],
    issues: "Fire extinguisher in kitchen due for service next month. Emergency exit sign light dim in hallway.",
    actions_taken: "Booked extinguisher service. Replaced hallway exit sign bulb same day.",
    next_drill_due: daysFromNow(-15), conducted_by: "staff_ryan",
    notes: "Monthly equipment check. Two items flagged — both actioned promptly.",
    created_at: daysFromNow(-45) + "T09:30:00Z",
  },
  {
    id: "fd_006", date: daysFromNow(-100), time: "11:00",
    drill_type: "evacuation" as const, evacuation_time_seconds: 110,
    result: "satisfactory" as const, all_present: true,
    children_present: ["yp_alex", "yp_jordan", "yp_casey"],
    staff_present: ["staff_darren", "staff_anna", "staff_mirela"],
    issues: "", actions_taken: "Full evacuation — all mustered at assembly point within target.",
    next_drill_due: daysFromNow(-70), conducted_by: "staff_darren",
    notes: "Quarterly full building evacuation. Good practice.",
    created_at: daysFromNow(-100) + "T11:00:00Z",
  },
] as FireDrill[];

// ── Sleep Log (Reg 7/10) ────────────────────────────────────────────────────
store.sleepLog = [
  {
    id: "sl_001", date: daysFromNow(-1), shift_type: "waking_night" as const,
    staff_id: "staff_anna", start_time: "22:00", end_time: "07:00",
    disturbance_level: "none" as const, disturbances: [],
    checks_completed: ["22:30", "00:00", "02:00", "04:00", "06:00"],
    building_secure: true, alarms_set: true,
    handover_notes: "All young people settled by 22:15. Quiet night.",
    morning_handover: "All well. Alex up at 06:30 independently. Jordan and Casey still asleep at handover.",
    hours_slept: null,
  },
  {
    id: "sl_002", date: daysFromNow(-2), shift_type: "waking_night" as const,
    staff_id: "staff_lackson", start_time: "22:00", end_time: "07:00",
    disturbance_level: "minor" as const,
    disturbances: [
      { time: "01:30", young_person: "yp_casey", description: "Casey woke briefly — needed reassurance after a bad dream.", action_taken: "Sat with Casey for 10 minutes. Settled back to sleep.", duration: 15 },
    ],
    checks_completed: ["22:30", "00:00", "02:00", "04:00", "06:00"],
    building_secure: true, alarms_set: true,
    handover_notes: "Casey had bad dream around 01:30 — settled quickly with reassurance.",
    morning_handover: "Casey fine in morning — no further issues. All young people had good sleep.",
    hours_slept: null,
  },
  {
    id: "sl_003", date: daysFromNow(-3), shift_type: "waking_night" as const,
    staff_id: "staff_edward", start_time: "22:00", end_time: "07:00",
    disturbance_level: "moderate" as const,
    disturbances: [
      { time: "23:45", young_person: "yp_alex", description: "Alex not settling — anxiety about school next day.", action_taken: "Offered warm drink and conversation. Used grounding techniques from BSP.", duration: 25 },
      { time: "03:00", young_person: "yp_jordan", description: "Jordan up for toilet — heard noise and became unsettled.", action_taken: "Brief reassurance. Settled quickly.", duration: 5 },
    ],
    checks_completed: ["22:30", "00:30", "02:00", "04:00", "06:00"],
    building_secure: true, alarms_set: true,
    handover_notes: "Alex had difficulty settling — anxiety re: school. Jordan brief wake at 03:00.",
    morning_handover: "Both Alex and Jordan tired. Consider informing school about Alex's sleep.",
    hours_slept: null,
  },
  {
    id: "sl_004", date: daysFromNow(-4), shift_type: "sleep_in" as const,
    staff_id: "staff_chervelle", start_time: "22:30", end_time: "07:00",
    disturbance_level: "none" as const, disturbances: [],
    checks_completed: ["22:30", "06:30"],
    building_secure: true, alarms_set: true,
    handover_notes: "Sleep-in shift. All quiet. Checked young people at 22:30 — all asleep.",
    morning_handover: "Uneventful night. All YP well rested.",
    hours_slept: 7,
  },
  {
    id: "sl_005", date: daysFromNow(-5), shift_type: "waking_night" as const,
    staff_id: "staff_anna", start_time: "22:00", end_time: "07:00",
    disturbance_level: "significant" as const,
    disturbances: [
      { time: "00:30", young_person: "yp_alex", description: "Alex woke screaming — night terror episode.", action_taken: "Stayed with Alex. Used calming voice. Did not restrain. Alex re-settled after 20 mins.", duration: 30 },
      { time: "01:15", young_person: "yp_casey", description: "Casey woken by Alex's distress — became upset.", action_taken: "Comforted Casey in their room. Read together until settled.", duration: 20 },
      { time: "04:00", young_person: "yp_alex", description: "Alex woke again — went to kitchen for water.", action_taken: "Accompanied to kitchen. Brief chat. Back to bed by 04:15.", duration: 15 },
    ],
    checks_completed: ["22:30", "00:00", "02:00", "04:30", "06:00"],
    building_secure: true, alarms_set: true,
    handover_notes: "Difficult night — Alex had night terror at 00:30, woke Casey. Third disturbance at 04:00. Informed RM in morning.",
    morning_handover: "Alex and Casey both tired. RM to discuss with therapist. Night terrors increasing — may need CAMHS referral.",
    hours_slept: null,
  },
  {
    id: "sl_006", date: daysFromNow(-6), shift_type: "waking_night" as const,
    staff_id: "staff_lackson", start_time: "22:00", end_time: "07:00",
    disturbance_level: "none" as const, disturbances: [],
    checks_completed: ["22:30", "00:00", "02:00", "04:00", "06:00"],
    building_secure: true, alarms_set: true,
    handover_notes: "All settled by 21:45. Completely quiet night.",
    morning_handover: "All well. Everyone slept through.",
    hours_slept: null,
  },
  {
    id: "sl_007", date: daysFromNow(-7), shift_type: "waking_night" as const,
    staff_id: "staff_mirela", start_time: "22:00", end_time: "07:00",
    disturbance_level: "minor" as const,
    disturbances: [
      { time: "02:30", young_person: "yp_jordan", description: "Jordan woke — said feeling unwell (stomach).", action_taken: "Offered water and checked temperature. No fever. Settled back to sleep.", duration: 10 },
    ],
    checks_completed: ["22:30", "00:00", "02:00", "04:00", "06:00"],
    building_secure: true, alarms_set: true,
    handover_notes: "Jordan briefly unwell at 02:30 — stomach complaint. No temperature.",
    morning_handover: "Jordan fine in morning. Ate breakfast. Monitor today.",
    hours_slept: null,
  },
] as SleepLogEntry[];

// ── Additional Daily Log entries (Reg 36 — Recording quality) ───────────────
const dlBase = { home_id: "home_oak", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: "staff_darren", updated_by: "staff_darren", aria_assist_used: false };
const additionalDailyLogs: DailyLogEntry[] = [
  // Day -2
  { ...dlBase, id: "log_101", child_id: "yp_alex", date: daysFromNow(-2), time: "08:45", entry_type: "general" as const, content: "Alex had a relaxed morning. Good engagement at breakfast. Discussed plans for the day — wants to practice guitar.", mood_score: 7, staff_id: "staff_ryan", linked_incident_id: null, is_significant: false },
  { ...dlBase, id: "log_102", child_id: "yp_jordan", date: daysFromNow(-2), time: "09:00", entry_type: "education" as const, content: "Jordan completed maths revision. Good focus for 40 minutes. Positive interaction with tutor.", mood_score: 7, staff_id: "staff_anna", linked_incident_id: null, is_significant: false },
  { ...dlBase, id: "log_103", child_id: "yp_casey", date: daysFromNow(-2), time: "14:00", entry_type: "health" as const, content: "Casey attended CAMHS appointment. Positive session — discussed coping strategies for anxiety.", mood_score: 6, staff_id: "staff_chervelle", linked_incident_id: null, is_significant: true },
  // Day -3
  { ...dlBase, id: "log_104", child_id: "yp_alex", date: daysFromNow(-3), time: "10:30", entry_type: "activity" as const, content: "Alex went swimming with Edward. Completed 20 lengths — personal best. Very proud.", mood_score: 9, staff_id: "staff_edward", linked_incident_id: null, is_significant: true },
  { ...dlBase, id: "log_105", child_id: "yp_jordan", date: daysFromNow(-3), time: "16:00", entry_type: "contact" as const, content: "Jordan had scheduled phone call with mum. Call was positive — discussed plans for half-term.", mood_score: 8, staff_id: "staff_lackson", linked_incident_id: null, is_significant: false },
  { ...dlBase, id: "log_106", child_id: "yp_casey", date: daysFromNow(-3), time: "20:00", entry_type: "mood" as const, content: "Casey reported feeling anxious before bed. Used breathing exercises from CAMHS. Settled after 15 minutes.", mood_score: 4, staff_id: "staff_anna", linked_incident_id: null, is_significant: false },
  // Day -4
  { ...dlBase, id: "log_107", child_id: "yp_alex", date: daysFromNow(-4), time: "09:00", entry_type: "general" as const, content: "Good morning routine. Alex prepared own breakfast independently.", mood_score: 7, staff_id: "staff_darren", linked_incident_id: null, is_significant: false },
  { ...dlBase, id: "log_108", child_id: "yp_jordan", date: daysFromNow(-4), time: "13:00", entry_type: "food" as const, content: "Jordan helped prepare lunch — halal chicken wraps. Good engagement with cooking skills.", mood_score: 8, staff_id: "staff_edward", linked_incident_id: null, is_significant: false },
  { ...dlBase, id: "log_109", child_id: "yp_casey", date: daysFromNow(-4), time: "15:30", entry_type: "behaviour" as const, content: "Casey had a difficult afternoon. Refused to attend online tutoring. Key worker discussion — underlying worry about exam.", mood_score: 3, staff_id: "staff_chervelle", linked_incident_id: null, is_significant: true },
  // Day -5
  { ...dlBase, id: "log_110", child_id: "yp_alex", date: daysFromNow(-5), time: "11:00", entry_type: "education" as const, content: "Alex attended Derby AP — positive report from school. Good behaviour throughout.", mood_score: 7, staff_id: "staff_ryan", linked_incident_id: null, is_significant: false },
  { ...dlBase, id: "log_111", child_id: "yp_jordan", date: daysFromNow(-5), time: "14:30", entry_type: "activity" as const, content: "Jordan went to youth club. Engaged well with peers. No concerns.", mood_score: 8, staff_id: "staff_lackson", linked_incident_id: null, is_significant: false },
  { ...dlBase, id: "log_112", child_id: "yp_casey", date: daysFromNow(-5), time: "09:30", entry_type: "health" as const, content: "Medication administered on time. No side effects reported.", mood_score: 6, staff_id: "staff_anna", linked_incident_id: null, is_significant: false },
  // Day -6
  { ...dlBase, id: "log_113", child_id: "yp_alex", date: daysFromNow(-6), time: "10:00", entry_type: "general" as const, content: "Alex spent the morning reading. Calm and settled. Positive mood.", mood_score: 7, staff_id: "staff_darren", linked_incident_id: null, is_significant: false },
  { ...dlBase, id: "log_114", child_id: "yp_jordan", date: daysFromNow(-6), time: "16:00", entry_type: "mood" as const, content: "Jordan appeared withdrawn this afternoon. 1:1 check-in — missing friends from previous placement. Reassured and spent time together.", mood_score: 4, staff_id: "staff_anna", linked_incident_id: null, is_significant: true },
  // Day -7
  { ...dlBase, id: "log_115", child_id: "yp_alex", date: daysFromNow(-7), time: "08:30", entry_type: "general" as const, content: "Good start to the week. Alex up early and helped with breakfast preparation.", mood_score: 8, staff_id: "staff_ryan", linked_incident_id: null, is_significant: false },
  { ...dlBase, id: "log_116", child_id: "yp_jordan", date: daysFromNow(-7), time: "14:00", entry_type: "activity" as const, content: "Jordan attended football training. Scored two goals. Very positive mood on return.", mood_score: 9, staff_id: "staff_lackson", linked_incident_id: null, is_significant: true },
  { ...dlBase, id: "log_117", child_id: "yp_casey", date: daysFromNow(-7), time: "10:00", entry_type: "education" as const, content: "Casey completed English homework independently. Good concentration.", mood_score: 6, staff_id: "staff_chervelle", linked_incident_id: null, is_significant: false },
  // Days -8 to -10 (fewer entries to show trailing off)
  { ...dlBase, id: "log_118", child_id: "yp_alex", date: daysFromNow(-8), time: "09:00", entry_type: "general" as const, content: "Routine morning. Alex ate breakfast and completed personal care independently.", mood_score: 7, staff_id: "staff_edward", linked_incident_id: null, is_significant: false },
  { ...dlBase, id: "log_119", child_id: "yp_jordan", date: daysFromNow(-9), time: "11:00", entry_type: "education" as const, content: "Jordan attended tuition session. Some difficulty with concentration today.", mood_score: 5, staff_id: "staff_ryan", linked_incident_id: null, is_significant: false },
  { ...dlBase, id: "log_120", child_id: "yp_casey", date: daysFromNow(-10), time: "15:00", entry_type: "contact" as const, content: "Casey had video call with social worker. Discussed placement review.", mood_score: 6, staff_id: "staff_darren", linked_incident_id: null, is_significant: false },
  { ...dlBase, id: "log_121", child_id: "yp_alex", date: daysFromNow(-11), time: "14:00", entry_type: "activity" as const, content: "Alex went to climbing wall with Lackson. Great engagement and confidence building.", mood_score: 9, staff_id: "staff_lackson", linked_incident_id: null, is_significant: true },
  { ...dlBase, id: "log_122", child_id: "yp_jordan", date: daysFromNow(-12), time: "09:00", entry_type: "general" as const, content: "Jordan had a good morning. Calm and engaged.", mood_score: 7, staff_id: "staff_anna", linked_incident_id: null, is_significant: false },
  { ...dlBase, id: "log_123", child_id: "yp_casey", date: daysFromNow(-13), time: "10:30", entry_type: "health" as const, content: "Casey attended GP appointment. Routine check — no concerns.", mood_score: 6, staff_id: "staff_chervelle", linked_incident_id: null, is_significant: false },
  // Day -10, 21:30 — night welfare log that contradicts the restraint injury recorded earlier the same day (rst_003, 18:30: minor bruise to left forearm). Intentional recording inconsistency for the conflict-detection engine to surface for human reconciliation.
  { ...dlBase, id: "log_124", child_id: "yp_alex", date: daysFromNow(-10), time: "21:30", entry_type: "general" as const, content: "Night welfare check completed. Alex settled in room by 21:00 and slept through. Visual observation on rounds — no injuries or marks observed, appeared comfortable.", mood_score: 5, staff_id: "staff_anna", linked_incident_id: null, is_significant: false },
];
store.dailyLog.push(...additionalDailyLogs);

// ── ARIA Practice Intelligence — demo signals (so the dashboard renders cards) ──
const ariaPracticeSeedAt = new Date().toISOString();
store.ariaPracticeFlags = [
  { id: "apf_seed_1", tenant_id: null, child_id: "yp_alex", staff_id: null, home_id: "home_oak", source_type: "daily_record", source_id: "log_120", flag_type: "activity_over_impact", severity: "medium", title: "Activity recorded, but child impact not yet evidenced", description: "The record shows activity took place but does not evidence what changed in the child's lived experience.", evidence: "completed key work; engaged well; no concerns", recommended_action: "Add what the child said, showed or felt, and what is now different for the child.", requires_manager_review: false, requires_ri_review: false, resolved: false, created_at: ariaPracticeSeedAt, resolved_at: null },
  { id: "apf_seed_2", tenant_id: null, child_id: "yp_alex", staff_id: null, home_id: "home_oak", source_type: "daily_record", source_id: "log_120", flag_type: "vague_recording", severity: "medium", title: "Vague recording — limited child-centred detail", description: "Reassurance language is used without evidence of impact or the child's voice.", evidence: "engaged well; no concerns", recommended_action: "Replace reassurance with specifics: what happened and what the child experienced.", requires_manager_review: false, requires_ri_review: false, resolved: false, created_at: ariaPracticeSeedAt, resolved_at: null },
  { id: "apf_seed_3", tenant_id: null, child_id: "yp_casey", staff_id: null, home_id: "home_oak", source_type: "care_plan", source_id: null, flag_type: "vague_recording", severity: "medium", title: "Vague recording — limited child-centred detail", description: "Settled / no concerns recorded without analysis.", evidence: "settled; no concerns", recommended_action: "Record what the child said, showed, feared or avoided.", requires_manager_review: false, requires_ri_review: false, resolved: false, created_at: ariaPracticeSeedAt, resolved_at: null },
  { id: "apf_seed_4", tenant_id: null, child_id: "yp_casey", staff_id: null, home_id: "home_oak", source_type: "daily_record", source_id: null, flag_type: "vague_recording", severity: "medium", title: "Vague recording — limited child-centred detail", description: "Compliant / settled recorded without the child's experience.", evidence: "compliant; settled", recommended_action: "Describe the child's lived experience, not adult engagement.", requires_manager_review: false, requires_ri_review: false, resolved: false, created_at: ariaPracticeSeedAt, resolved_at: null },
  { id: "apf_seed_5", tenant_id: null, child_id: "yp_casey", staff_id: null, home_id: "home_oak", source_type: "care_plan", source_id: null, flag_type: "developmental_gap", severity: "high", title: "Developmental gap detected (stability, belonging, emotional security)", description: "The plan describes domains of childhood that are missing or insufficient.", evidence: "stability; belonging; emotional security", recommended_action: "Add owned plan actions that close each gap and define what will be different for the child.", requires_manager_review: true, requires_ri_review: false, resolved: false, created_at: ariaPracticeSeedAt, resolved_at: null },
  { id: "apf_seed_6", tenant_id: null, child_id: "yp_jordan", staff_id: null, home_id: "home_oak", source_type: "risk_assessment", source_id: null, flag_type: "overstated_protective_factor", severity: "medium", title: "Possible overstated protective factor", description: "Mum attends meetings — needs strengthening into a real protective factor.", evidence: "attends meetings; engages with professionals", recommended_action: "Test what harm it reduces, reliability under stress, and strength for the current risk.", requires_manager_review: false, requires_ri_review: false, resolved: false, created_at: ariaPracticeSeedAt, resolved_at: null },
  { id: "apf_seed_7", tenant_id: null, child_id: "yp_jordan", staff_id: null, home_id: "home_oak", source_type: "safeguarding_concern", source_id: null, flag_type: "safeguarding_threshold", severity: "high", title: "Possible safeguarding threshold concern", description: "Disclosure / harm language that may meet a safeguarding threshold. Manager review advised.", evidence: "disclosed; scared", recommended_action: "Manager to complete a threshold consultation and consider a strategy discussion.", requires_manager_review: true, requires_ri_review: false, resolved: false, created_at: ariaPracticeSeedAt, resolved_at: null },
  { id: "apf_seed_8", tenant_id: null, child_id: "yp_alex", staff_id: null, home_id: "home_oak", source_type: "key_work", source_id: null, flag_type: "relationship_depth", severity: "low", title: "Relationship at Interaction stage", description: "The record describes contact. ARIA does not assume this is trust; emotional safety is not yet evidenced.", evidence: "Interaction — “I speak with you.”", recommended_action: "Move from contact toward cooperation and notice what the child allows the adult to see.", requires_manager_review: false, requires_ri_review: false, resolved: false, created_at: ariaPracticeSeedAt, resolved_at: null },
  { id: "apf_seed_9", tenant_id: null, child_id: null, staff_id: "staff_ryan", home_id: "home_oak", source_type: "supervision", source_id: null, flag_type: "staff_wellbeing", severity: "medium", title: "Staff wellbeing signal — offer support", description: "Wellbeing signals are present. Support indicators, not disciplinary evidence.", evidence: "overwhelmed; drained", recommended_action: "Offer reflective supervision and a wellbeing check-in; review workload.", requires_manager_review: true, requires_ri_review: false, resolved: false, created_at: ariaPracticeSeedAt, resolved_at: null },
];
store.ariaThresholdConsultations = [
  { id: "atc_seed_1", tenant_id: null, child_id: "yp_jordan", concern_type: "safeguarding", source_type: "safeguarding_concern", source_id: null, child_lived_experience: "Jordan describes feeling unsafe and unheard at home.", evidence_and_harm_analysis: "Disclosure of harm; corroborating low mood recorded over two weeks.", family_functioning_parental_capacity: "Manager to complete — parental capacity assessment outstanding.", threshold_and_escalation_analysis: "Concern may meet threshold; structured consultation required.", decision_rationale: "Manager to complete — ARIA does not make the statutory decision.", recommended_next_step: "Complete a threshold consultation and consider a strategy discussion.", reasonable_cause_to_suspect_significant_harm: null, strategy_discussion_recommended: true, lado_consultation_recommended: false, emergency_action_recommended: false, aria_summary: "Possible safeguarding threshold concern — manager review advised.", manager_decision: null, manager_rationale: null, created_by: "staff_darren", created_at: ariaPracticeSeedAt },
];
store.ariaStaffWellbeingSignals = [
  { id: "aws_seed_1", tenant_id: null, staff_id: "staff_ryan", home_id: "home_oak", signal_type: "burnout", signal_source: "supervision", severity: "medium", evidence: "Reported feeling overwhelmed and emotionally drained over recent shifts.", support_recommendation: "Reflective supervision, wellbeing check-in, and a workload/rota review.", manager_action: null, resolved: false, created_at: ariaPracticeSeedAt },
];
store.ariaPracticeAssessments = [
  { id: "apa_seed_1", tenant_id: null, child_id: "yp_alex", staff_id: null, home_id: "home_oak", source_type: "daily_record", source_id: "log_120", assessment_type: "practice_quality", status: "open", created_by: "staff_anna", created_at: ariaPracticeSeedAt, updated_at: ariaPracticeSeedAt, developmental_gap_score: 100, child_lived_experience_score: 35, protective_factor_score: 100, relationship_depth_score: 28, safeguarding_threshold_score: 100, supervision_quality_score: 55, workforce_wellbeing_score: 100, overall_practice_quality_score: 55, summary: "Activity recorded without evidencing child impact.", aria_advice: [], aria_flags: [], aria_recommendations: [], aria_questions: [], aria_draft_output: null, reviewer_id: null, reviewed_at: null, manager_decision: null, manager_rationale: null },
  { id: "apa_seed_2", tenant_id: null, child_id: "yp_casey", staff_id: null, home_id: "home_oak", source_type: "key_work", source_id: null, assessment_type: "practice_quality", status: "open", created_by: "staff_chervelle", created_at: ariaPracticeSeedAt, updated_at: ariaPracticeSeedAt, developmental_gap_score: 78, child_lived_experience_score: 90, protective_factor_score: 100, relationship_depth_score: 64, safeguarding_threshold_score: 100, supervision_quality_score: 72, workforce_wellbeing_score: 100, overall_practice_quality_score: 72, summary: "Strong child-centred record evidencing what changed for the child.", aria_advice: [], aria_flags: [], aria_recommendations: [], aria_questions: [], aria_draft_output: null, reviewer_id: null, reviewed_at: null, manager_decision: null, manager_rationale: null },
];

// ── CRUD helpers ──────────────────────────────────────────────────────────────

export function getStore() { return store; }

export const db = {
  // ── Staff ─────────────────────────────────────────────────────────────────
  staff: {
    findAll: () => store.staff,
    findById: (id: string) => store.staff.find((s) => s.id === id),
    findActive: () => store.staff.filter((s) => s.is_active),
  },

  // ── Young People ──────────────────────────────────────────────────────────
  youngPeople: {
    findAll: () => store.youngPeople,
    findById: (id: string) => store.youngPeople.find((yp) => yp.id === id),
    findCurrent: () => store.youngPeople.filter((yp) => yp.status === "current"),
  },

  // ── Cornerstone Events (canonical persisted spine — capture-once write path) ─
  cornerstoneEvents: {
    findAll: (): CornerstoneEvent[] => store.cornerstoneEvents,
    findById: (id: string): CornerstoneEvent | undefined => store.cornerstoneEvents.find((e) => e.id === id),
    append: (event: CornerstoneEvent): CornerstoneEvent => {
      store.cornerstoneEvents.push(event);
      return event;
    },
  },

  // ── Incidents ─────────────────────────────────────────────────────────────
  incidents: {
    findAll: () => store.incidents,
    findById: (id: string) => store.incidents.find((i) => i.id === id),
    findOpen: () => store.incidents.filter((i) => i.status === "open"),
    findNeedingOversight: () => store.incidents.filter((i) => i.requires_oversight && !i.oversight_by),
    create: (data: Partial<Incident>): Incident => {
      const incident = { ...data, id: generateId("inc"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Incident;
      store.incidents.push(incident);
      return incident;
    },
    addOversight: (id: string, note: string, by: string): Incident | null => {
      const idx = store.incidents.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      store.incidents[idx] = { ...store.incidents[idx], oversight_note: note, oversight_by: by, oversight_at: new Date().toISOString() };
      return store.incidents[idx];
    },
    update: (id: string, data: Partial<Incident>): Incident | null => {
      const idx = store.incidents.findIndex((i) => i.id === id);
      if (idx === -1) return null;
      store.incidents[idx] = { ...store.incidents[idx], ...data, updated_at: new Date().toISOString() };
      return store.incidents[idx];
    },
  },

  // ── Missing Episodes ──────────────────────────────────────────────────────
  missingEpisodes: {
    findAll: () => store.missingEpisodes,
    findByChild: (childId: string) => store.missingEpisodes.filter((m) => m.child_id === childId),
    findActive: () => store.missingEpisodes.filter((m) => m.status === "active"),
    findById: (id: string) => store.missingEpisodes.find((m) => m.id === id),
    create: (data: Partial<MissingEpisode>): MissingEpisode => {
      const totalCount = store.missingEpisodes.length + 1;
      const episode = {
        ...data,
        id: generateId("mfc"),
        reference: `MFC-${new Date().getFullYear()}-${String(totalCount).padStart(3, "0")}`,
        status: data.status ?? "active",
        created_at: new Date().toISOString(),
        created_by: data.created_by ?? "staff_darren",
      } as MissingEpisode;
      store.missingEpisodes.push(episode);
      return episode;
    },
    patch: (id: string, data: Partial<MissingEpisode>): MissingEpisode | null => {
      const idx = store.missingEpisodes.findIndex((m) => m.id === id);
      if (idx === -1) return null;
      store.missingEpisodes[idx] = { ...store.missingEpisodes[idx], ...data };
      return store.missingEpisodes[idx];
    },
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────
  tasks: {
    findAll: () => store.tasks,
    findById: (id: string) => store.tasks.find((t) => t.id === id),
    findActive: () => store.tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled"),
    findOverdue: () => store.tasks.filter((t) => t.due_date && t.due_date < todayStr() && t.status !== "completed" && t.status !== "cancelled"),
    create: (data: Partial<Task>): Task => {
      const task = { ...data, id: generateId("task"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Task;
      store.tasks.push(task);
      return task;
    },
    complete: (id: string, by: string, note?: string): Task | null => {
      const idx = store.tasks.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      store.tasks[idx] = { ...store.tasks[idx], status: "completed", completed_at: new Date().toISOString(), completed_by: by, evidence_note: note || store.tasks[idx].evidence_note };
      return store.tasks[idx];
    },
    update: (id: string, data: Partial<Task>): Task | null => {
      const idx = store.tasks.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      store.tasks[idx] = { ...store.tasks[idx], ...data, updated_at: new Date().toISOString() };
      return store.tasks[idx];
    },
  },

  // ── Care Forms ────────────────────────────────────────────────────────────
  careForms: {
    findAll: () => store.careForms,
    findById: (id: string) => store.careForms.find((f) => f.id === id),
    findByChild: (childId: string) => store.careForms.filter((f) => f.linked_child_id === childId),
    findByStatus: (status: string) => store.careForms.filter((f) => f.status === status),
    findByType: (type: string) => store.careForms.filter((f) => f.form_type === type),
    findPendingReview: () => store.careForms.filter((f) => f.status === "pending_review" || f.status === "submitted"),
    create: (data: Partial<CareForm>): CareForm => {
      const form = {
        ...data,
        id: generateId("form"),
        status: data.status ?? "draft",
        body: data.body ?? {},
        tags: data.tags ?? [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as CareForm;
      store.careForms.push(form);
      return form;
    },
    update: (id: string, data: Partial<CareForm>): CareForm | null => {
      const idx = store.careForms.findIndex((f) => f.id === id);
      if (idx === -1) return null;
      store.careForms[idx] = { ...store.careForms[idx], ...data, updated_at: new Date().toISOString() };
      return store.careForms[idx];
    },
    submit: (id: string, by: string): CareForm | null => {
      const idx = store.careForms.findIndex((f) => f.id === id);
      if (idx === -1) return null;
      store.careForms[idx] = {
        ...store.careForms[idx],
        status: "submitted",
        submitted_at: new Date().toISOString(),
        submitted_by: by,
        updated_at: new Date().toISOString(),
        updated_by: by,
      };
      return store.careForms[idx];
    },
    approve: (id: string, by: string, notes?: string): CareForm | null => {
      const idx = store.careForms.findIndex((f) => f.id === id);
      if (idx === -1) return null;
      store.careForms[idx] = {
        ...store.careForms[idx],
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: by,
        reviewed_by: by,
        reviewed_at: new Date().toISOString(),
        review_notes: notes ?? store.careForms[idx].review_notes,
        updated_at: new Date().toISOString(),
        updated_by: by,
      };
      return store.careForms[idx];
    },
  },

  // ── Medication ────────────────────────────────────────────────────────────
  medications: {
    findAll: () => store.medications,
    findActive: () => store.medications.filter((m) => m.is_active),
    findByChild: (childId: string) => store.medications.filter((m) => m.child_id === childId && m.is_active),
  },
  medicationAdministrations: {
    findAll: () => store.medicationAdministrations,
    findByMed: (medId: string) => store.medicationAdministrations.filter((a) => a.medication_id === medId),
    findByChild: (childId: string) => store.medicationAdministrations.filter((a) => a.child_id === childId),
    findScheduled: () => store.medicationAdministrations.filter((a) => a.status === "scheduled"),
    findExceptions: () => store.medicationAdministrations.filter((a) => a.status === "refused" || a.status === "late" || a.status === "missed"),
    administer: (id: string, data: Partial<MedicationAdministration>): MedicationAdministration | null => {
      const idx = store.medicationAdministrations.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      store.medicationAdministrations[idx] = { ...store.medicationAdministrations[idx], ...data, actual_time: new Date().toISOString() };
      return store.medicationAdministrations[idx];
    },
  },

  // ── Daily Log ─────────────────────────────────────────────────────────────
  dailyLog: {
    findAll: () => store.dailyLog,
    findByChild: (childId: string) => store.dailyLog.filter((e) => e.child_id === childId),
    findToday: () => store.dailyLog.filter((e) => e.date === todayStr()),
    create: (data: Partial<DailyLogEntry>): DailyLogEntry => {
      const entry = { ...data, id: generateId("log"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as DailyLogEntry;
      store.dailyLog.push(entry);
      return entry;
    },
  },

  // ── Chronology ────────────────────────────────────────────────────────────
  chronology: {
    findAll: () => store.chronology,
    findByChild: (childId: string) => store.chronology.filter((c) => c.child_id === childId).sort((a, b) => b.date.localeCompare(a.date)),
    create: (data: Partial<ChronologyEntry>): ChronologyEntry => {
      const entry = { ...data, id: generateId("chr"), created_at: new Date().toISOString() } as ChronologyEntry;
      store.chronology.push(entry);
      return entry;
    },
  },

  // ── Handovers ─────────────────────────────────────────────────────────────
  handovers: {
    findAll: () => store.handovers,
    findLatest: () => store.handovers.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null,
    findById: (id: string) => store.handovers.find((h) => h.id === id) || null,
    findByDate: (date: string) => store.handovers.filter((h) => h.shift_date === date),
    update: (id: string, data: Partial<HandoverEntry>): HandoverEntry | null => {
      const idx = store.handovers.findIndex((h) => h.id === id);
      if (idx === -1) return null;
      store.handovers[idx] = { ...store.handovers[idx], ...data };
      return store.handovers[idx];
    },
    create: (data: Partial<HandoverEntry>): HandoverEntry => {
      const entry = { ...data, id: generateId("hnd"), sign_offs: [], created_at: new Date().toISOString() } as HandoverEntry;
      store.handovers.push(entry);
      return entry;
    },
  },

  // ── Buildings ─────────────────────────────────────────────────────────────
  buildings: {
    findAll: () => store.buildings,
    findById: (id: string) => store.buildings.find((b) => b.id === id),
  },
  buildingChecks: {
    findAll: () => store.buildingChecks,
    findDue: () => store.buildingChecks.filter((c) => c.status === "due" || c.status === "overdue"),
    findOverdue: () => store.buildingChecks.filter((c) => c.status === "overdue"),
    create: (data: Partial<BuildingCheck>): BuildingCheck => {
      const check = { ...data, id: generateId("bchk"), created_at: new Date().toISOString() } as BuildingCheck;
      store.buildingChecks.push(check);
      return check;
    },
  },

  // ── Vehicles ──────────────────────────────────────────────────────────────
  vehicles: {
    findAll: () => store.vehicles,
    findById: (id: string) => store.vehicles.find((v) => v.id === id),
    findAvailable: () => store.vehicles.filter((v) => v.status === "available"),
  },
  vehicleChecks: {
    findAll: () => store.vehicleChecks,
    findByVehicle: (vehicleId: string) => store.vehicleChecks.filter((c) => c.vehicle_id === vehicleId),
    findDefects: () => store.vehicleChecks.filter((c) => c.overall_result === "fail" || c.overall_result === "advisory"),
    create: (data: Partial<VehicleCheck>): VehicleCheck => {
      const check = { ...data, id: generateId("vchk"), created_at: new Date().toISOString() } as VehicleCheck;
      store.vehicleChecks.push(check);
      return check;
    },
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    findAll: () => store.notifications,
    findForUser: (userId: string) => store.notifications.filter((n) => n.recipient_id === userId && !n.read),
    create: (data: Partial<Notification>): Notification => {
      const notif = { ...data, id: generateId("notif"), created_at: new Date().toISOString() } as Notification;
      store.notifications.push(notif);
      return notif;
    },
    patch: (id: string, updates: Partial<Notification>): Notification | null => {
      const idx = store.notifications.findIndex((n) => n.id === id);
      if (idx === -1) return null;
      store.notifications[idx] = { ...store.notifications[idx], ...updates };
      return store.notifications[idx];
    },
  },

  // ── Comms Centre (Phase 1) ──────────────────────────────────────────────────
  commsChannels: {
    /** Lazily create the standard channel set for a home on first access (demo). */
    seedDefaults: (homeId: string): void => {
      if (store.commsChannels.some((c) => c.home_id === homeId)) return;
      const now = new Date().toISOString();
      const defs: Array<{ type: CommsChannel["type"]; name: string; access: CommsChannel["access"]; sensitivity: CommsChannel["sensitivity"]; allowed_roles?: string[] }> = [
        { type: "home_announcements", name: "Whole Home Announcements", access: "all_staff", sensitivity: "internal" },
        { type: "shift_handover", name: "Shift Handover", access: "on_shift", sensitivity: "internal" },
        { type: "managers_seniors", name: "Managers & Seniors", access: "managers", sensitivity: "confidential" },
        { type: "waking_night", name: "Waking Night Team", access: "role_restricted", sensitivity: "internal", allowed_roles: ["waking_night", "team_leader", "deputy_manager", "registered_manager"] },
        { type: "medication_updates", name: "Medication Updates", access: "on_shift", sensitivity: "confidential" },
        { type: "safeguarding_alerts", name: "Safeguarding Alerts", access: "safeguarding", sensitivity: "restricted" },
        { type: "rota_cover", name: "Rota Cover Requests", access: "all_staff", sensitivity: "internal" },
        { type: "health_safety", name: "Health & Safety", access: "all_staff", sensitivity: "internal" },
        { type: "maintenance", name: "Maintenance", access: "all_staff", sensitivity: "internal" },
        { type: "training_policy", name: "Training & Policy Updates", access: "all_staff", sensitivity: "internal" },
        { type: "keywork_sessions", name: "Key Work & Sessions", access: "on_shift", sensitivity: "confidential" },
        { type: "emergency_broadcast", name: "Emergency Broadcasts", access: "all_staff", sensitivity: "internal" },
      ];
      for (const d of defs) {
        store.commsChannels.push({
          id: generateId("ch"), home_id: homeId, type: d.type, name: d.name, description: null,
          access: d.access, allowed_roles: d.allowed_roles ?? [], linked_child_id: null, linked_incident_id: null,
          sensitivity: d.sensitivity, is_archived: false, created_by: "system", created_at: now, updated_at: now,
        });
      }
    },
    findForHome: (homeId: string): CommsChannel[] => {
      db.commsChannels.seedDefaults(homeId);
      return store.commsChannels.filter((c) => c.home_id === homeId && !c.is_archived);
    },
    findById: (id: string): CommsChannel | undefined => store.commsChannels.find((c) => c.id === id),
    create: (data: Partial<CommsChannel>): CommsChannel => {
      const now = new Date().toISOString();
      const channel: CommsChannel = {
        id: generateId("ch"), home_id: data.home_id ?? "home_oak", type: data.type ?? "home_announcements",
        name: data.name ?? "Channel", description: data.description ?? null, access: data.access ?? "all_staff",
        allowed_roles: data.allowed_roles ?? [], linked_child_id: data.linked_child_id ?? null,
        linked_incident_id: data.linked_incident_id ?? null, sensitivity: data.sensitivity ?? "internal",
        is_archived: false, created_by: data.created_by ?? "system", created_at: now, updated_at: now,
      };
      store.commsChannels.push(channel);
      return channel;
    },
    patch: (id: string, updates: Partial<CommsChannel>): CommsChannel | null => {
      const idx = store.commsChannels.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      store.commsChannels[idx] = { ...store.commsChannels[idx], ...updates, updated_at: new Date().toISOString() };
      return store.commsChannels[idx];
    },
  },
  commsMessages: {
    findAll: (): CommsMessage[] => store.commsMessages,
    findByChannel: (channelId: string, includeDeleted = false): CommsMessage[] =>
      store.commsMessages
        .filter((m) => m.channel_id === channelId && (includeDeleted || !m.is_deleted))
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    findById: (id: string): CommsMessage | undefined => store.commsMessages.find((m) => m.id === id),
    create: (data: Partial<CommsMessage>): CommsMessage => {
      const now = new Date().toISOString();
      const msg: CommsMessage = {
        id: generateId("msg"), channel_id: data.channel_id ?? "", home_id: data.home_id ?? "home_oak",
        author_id: data.author_id ?? "system", body: data.body ?? "", priority: data.priority ?? "normal",
        requires_acknowledgement: data.requires_acknowledgement ?? false, linked_child_id: data.linked_child_id ?? null,
        linked_incident_id: data.linked_incident_id ?? null, linked_record_type: data.linked_record_type ?? null,
        linked_record_id: data.linked_record_id ?? null, edited: false, edit_history: [], is_deleted: false,
        deleted_at: null, deleted_by: null, retention_category: data.retention_category ?? "routine_messages",
        investigation_hold: false, created_at: now, updated_at: now,
      };
      store.commsMessages.push(msg);
      return msg;
    },
    patch: (id: string, updates: Partial<CommsMessage>): CommsMessage | null => {
      const idx = store.commsMessages.findIndex((m) => m.id === id);
      if (idx === -1) return null;
      store.commsMessages[idx] = { ...store.commsMessages[idx], ...updates, updated_at: new Date().toISOString() };
      return store.commsMessages[idx];
    },
  },
  commsMessageReceipts: {
    findByMessage: (messageId: string): CommsMessageReceipt[] => store.commsMessageReceipts.filter((r) => r.message_id === messageId),
    findForUserInChannel: (userId: string, channelId: string): CommsMessageReceipt[] =>
      store.commsMessageReceipts.filter((r) => r.user_id === userId && r.channel_id === channelId),
    /** Mark read (and optionally acknowledge) — idempotent upsert per (message,user). */
    mark: (messageId: string, channelId: string, userId: string, opts: { read?: boolean; acknowledge?: boolean }): CommsMessageReceipt => {
      const now = new Date().toISOString();
      let r = store.commsMessageReceipts.find((x) => x.message_id === messageId && x.user_id === userId);
      if (!r) {
        r = { id: generateId("rcpt"), message_id: messageId, channel_id: channelId, user_id: userId, read_at: null, acknowledged_at: null };
        store.commsMessageReceipts.push(r);
      }
      if (opts.read && !r.read_at) r.read_at = now;
      if (opts.acknowledge) { r.acknowledged_at = now; if (!r.read_at) r.read_at = now; }
      return r;
    },
  },
  commsMessageActions: {
    findAll: (): CommsMessageAction[] => store.commsMessageActions,
    findByMessage: (messageId: string): CommsMessageAction[] => store.commsMessageActions.filter((a) => a.message_id === messageId),
    create: (data: Partial<CommsMessageAction>): CommsMessageAction => {
      const action: CommsMessageAction = {
        id: generateId("cact"), message_id: data.message_id ?? "", action_type: data.action_type ?? "task",
        target_record_id: data.target_record_id ?? null, created_by: data.created_by ?? "system", created_at: new Date().toISOString(),
      };
      store.commsMessageActions.push(action);
      return action;
    },
  },
  staffTrustNoticeAcks: {
    latestForUser: (userId: string): StaffTrustNoticeAck | undefined =>
      store.staffTrustNoticeAcks.filter((a) => a.user_id === userId).sort((a, b) => b.acknowledged_at.localeCompare(a.acknowledged_at))[0],
    create: (data: Partial<StaffTrustNoticeAck>): StaffTrustNoticeAck => {
      const now = new Date().toISOString();
      const ack: StaffTrustNoticeAck = {
        id: generateId("tna"), organisation_id: data.organisation_id ?? "org_default", user_id: data.user_id ?? "",
        notice_version: data.notice_version ?? "unknown", acknowledged_at: now, device_id: data.device_id ?? null, created_at: now,
      };
      store.staffTrustNoticeAcks.push(ack);
      return ack;
    },
  },

  // ── Training ──────────────────────────────────────────────────────────────
  training: {
    findAll: () => store.trainingRecords,
    findByStaff: (staffId: string) => store.trainingRecords.filter((t) => t.staff_id === staffId),
    findExpired: () => store.trainingRecords.filter((t) => t.status === "expired"),
    findExpiringSoon: () => store.trainingRecords.filter((t) => t.status === "expiring_soon"),
    create: (data: TrainingRecord) => {
      store.trainingRecords.push(data);
      return data;
    },
    patch: (id: string, updates: Partial<TrainingRecord>) => {
      const idx = store.trainingRecords.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      store.trainingRecords[idx] = { ...store.trainingRecords[idx], ...updates };
      return store.trainingRecords[idx];
    },
  },

  // ── Leave ─────────────────────────────────────────────────────────────────
  leave: {
    findAll: () => store.leaveRequests,
    findPending: () => store.leaveRequests.filter((l) => l.status === "pending"),
    findOnLeaveToday: () => {
      const t = todayStr();
      return store.leaveRequests.filter((l) => l.status === "approved" && l.start_date <= t && l.end_date >= t);
    },
  },

  // ── Shifts ────────────────────────────────────────────────────────────────
  shifts: {
    findAll: () => store.shifts,
    findToday: () => store.shifts.filter((s) => s.date === todayStr()),
    findByStaff: (staffId: string) => store.shifts.filter((s) => s.staff_id === staffId),
    findOpen: () => store.shifts.filter((s) => s.is_open_shift && s.date >= todayStr()),
    findByDateAndTime: (date: string, startTime: string) =>
      store.shifts.find((s) => s.date === date && s.start_time === startTime && s.is_open_shift),
    update: (id: string, data: Partial<Shift>): Shift | null => {
      const idx = store.shifts.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      store.shifts[idx] = { ...store.shifts[idx], ...data, updated_at: new Date().toISOString() };
      return store.shifts[idx];
    },
    create: (data: Partial<Shift>): Shift => {
      const shift = {
        ...data,
        id: generateId("shf"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Shift;
      store.shifts.push(shift);
      return shift;
    },
  },

  // ── Sign-in presence verifications (Phase 5 — no coordinates stored) ────────
  signInVerifications: {
    findAll: (): SignInVerification[] => store.signInVerifications,
    findByStaff: (staffId: string): SignInVerification[] =>
      store.signInVerifications.filter((v) => v.staff_id === staffId),
    findByShift: (shiftId: string): SignInVerification[] =>
      store.signInVerifications.filter((v) => v.shift_id === shiftId),
    create: (data: Omit<SignInVerification, "id" | "created_at">): SignInVerification => {
      const rec: SignInVerification = { ...data, id: generateId("siv"), created_at: new Date().toISOString() };
      store.signInVerifications.push(rec);
      return rec;
    },
  },

  // ── ARIA learned-answer cache (rules → cache → Claude) ──────────────────────
  ariaResponseCache: {
    findAll: (): AriaCachedResponse[] => store.ariaResponseCache,
    findByBucket: (commandId: string, childId: string | null): AriaCachedResponse[] =>
      store.ariaResponseCache.filter(
        (r) => r.command_id === commandId && r.child_id === (childId ?? null),
      ),
    create: (
      data: Omit<AriaCachedResponse, "id" | "created_at" | "last_used_at" | "hit_count">,
    ): AriaCachedResponse => {
      const now = new Date().toISOString();
      const rec: AriaCachedResponse = {
        ...data,
        id: generateId("arc"),
        hit_count: 0,
        created_at: now,
        last_used_at: now,
      };
      store.ariaResponseCache.push(rec);
      return rec;
    },
    recordHit: (id: string): void => {
      const rec = store.ariaResponseCache.find((r) => r.id === id);
      if (rec) {
        rec.hit_count += 1;
        rec.last_used_at = new Date().toISOString();
      }
    },
  },

  // ── Web Push subscriptions ──────────────────────────────────────────────────
  pushSubscriptions: {
    findAll: (): StoredPushSubscription[] => store.pushSubscriptions,
    findByUser: (userId: string): StoredPushSubscription[] =>
      store.pushSubscriptions.filter((s) => s.recipient_id === userId),
    upsert: (data: Omit<StoredPushSubscription, "id" | "created_at">): StoredPushSubscription => {
      const existing = store.pushSubscriptions.find((s) => s.endpoint === data.endpoint);
      if (existing) {
        existing.recipient_id = data.recipient_id;
        existing.keys = data.keys;
        return existing;
      }
      const rec: StoredPushSubscription = { ...data, id: generateId("push"), created_at: new Date().toISOString() };
      store.pushSubscriptions.push(rec);
      return rec;
    },
    removeByEndpoint: (endpoint: string): void => {
      const idx = store.pushSubscriptions.findIndex((s) => s.endpoint === endpoint);
      if (idx !== -1) store.pushSubscriptions.splice(idx, 1);
    },
  },

  // ── Emergency alerts (Phase 7) ──────────────────────────────────────────────
  emergencyAlerts: {
    findAll: (): EmergencyAlert[] => store.emergencyAlerts,
    findById: (id: string): EmergencyAlert | undefined => store.emergencyAlerts.find((a) => a.id === id),
    findActive: (homeId: string): EmergencyAlert[] =>
      store.emergencyAlerts.filter((a) => a.home_id === homeId && a.status === "active"),
    create: (data: Omit<EmergencyAlert, "id" | "created_at">): EmergencyAlert => {
      const rec: EmergencyAlert = { ...data, id: generateId("emrg"), created_at: new Date().toISOString() };
      store.emergencyAlerts.push(rec);
      return rec;
    },
    patch: (id: string, updates: Partial<EmergencyAlert>): EmergencyAlert | null => {
      const idx = store.emergencyAlerts.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      store.emergencyAlerts[idx] = { ...store.emergencyAlerts[idx], ...updates };
      return store.emergencyAlerts[idx];
    },
  },

  // ── Shift Swaps ─────────────────────────────────────────────────────────
  shiftSwaps: {
    findAll: () => store.shiftSwaps,
    findPending: () => store.shiftSwaps.filter((s) => s.status === "pending"),
    create: (data: Partial<ShiftSwapRequest>): ShiftSwapRequest => {
      const swap = {
        ...data,
        id: generateId("swap"),
        created_at: new Date().toISOString(),
      } as ShiftSwapRequest;
      store.shiftSwaps.push(swap);
      return swap;
    },
    update: (id: string, data: Partial<ShiftSwapRequest>): ShiftSwapRequest | null => {
      const idx = store.shiftSwaps.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      store.shiftSwaps[idx] = { ...store.shiftSwaps[idx], ...data };
      return store.shiftSwaps[idx];
    },
  },

  // ── Safer Recruitment ─────────────────────────────────────────────────────
  vacancies: {
    findAll: () => store.vacancies,
    findById: (id: string) => store.vacancies.find((v) => v.id === id),
    findOpen: () => store.vacancies.filter((v) => v.status === "open"),
    create: (data: Partial<Vacancy>): Vacancy => {
      const vacancy = { ...data, id: generateId("vac"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Vacancy;
      store.vacancies.push(vacancy);
      return vacancy;
    },
  },
  candidateProfiles: {
    findAll: () => store.candidateProfiles,
    findById: (id: string) => store.candidateProfiles.find((c) => c.id === id),
    findByVacancy: (vacancyId: string) => store.candidateProfiles.filter((c) => c.vacancy_id === vacancyId),
    findByStage: (stage: string) => store.candidateProfiles.filter((c) => c.current_stage === stage),
    create: (data: Partial<CandidateProfile>): CandidateProfile => {
      const candidate = { ...data, id: generateId("cand"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as CandidateProfile;
      store.candidateProfiles.push(candidate);
      return candidate;
    },
    update: (id: string, data: Partial<CandidateProfile>): CandidateProfile | null => {
      const idx = store.candidateProfiles.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      store.candidateProfiles[idx] = { ...store.candidateProfiles[idx], ...data, updated_at: new Date().toISOString() };
      return store.candidateProfiles[idx];
    },
  },
  candidateChecks: {
    findAll: () => store.candidateChecks,
    findByCandidate: (candidateId: string) => store.candidateChecks.filter((c) => c.candidate_id === candidateId),
    findById: (id: string) => store.candidateChecks.find((c) => c.id === id),
    create: (data: Partial<CandidateCheck>): CandidateCheck => {
      const check = { ...data, id: generateId("chk"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as CandidateCheck;
      store.candidateChecks.push(check);
      return check;
    },
    update: (id: string, data: Partial<CandidateCheck>): CandidateCheck | null => {
      const idx = store.candidateChecks.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      store.candidateChecks[idx] = { ...store.candidateChecks[idx], ...data, updated_at: new Date().toISOString() };
      return store.candidateChecks[idx];
    },
  },
  candidateReferences: {
    findAll: () => store.candidateReferences,
    findByCandidate: (candidateId: string) => store.candidateReferences.filter((r) => r.candidate_id === candidateId),
    findById: (id: string) => store.candidateReferences.find((r) => r.id === id),
    create: (data: Partial<CandidateReference>): CandidateReference => {
      const ref = { ...data, id: generateId("ref"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as CandidateReference;
      store.candidateReferences.push(ref);
      return ref;
    },
    update: (id: string, data: Partial<CandidateReference>): CandidateReference | null => {
      const idx = store.candidateReferences.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.candidateReferences[idx] = { ...store.candidateReferences[idx], ...data, updated_at: new Date().toISOString() };
      return store.candidateReferences[idx];
    },
  },
  employmentHistory: {
    findAll: () => store.employmentHistory,
    findByCandidate: (candidateId: string) => store.employmentHistory.filter((e) => e.candidate_id === candidateId),
    create: (data: Partial<EmploymentHistoryEntry>): EmploymentHistoryEntry => {
      const entry = { ...data, id: generateId("emp"), created_at: new Date().toISOString() } as EmploymentHistoryEntry;
      store.employmentHistory.push(entry);
      return entry;
    },
  },
  gapExplanations: {
    findAll: () => store.gapExplanations,
    findByCandidate: (candidateId: string) => store.gapExplanations.filter((g) => g.candidate_id === candidateId),
    create: (data: Partial<GapExplanation>): GapExplanation => {
      const gap = { ...data, id: generateId("gap"), created_at: new Date().toISOString() } as GapExplanation;
      store.gapExplanations.push(gap);
      return gap;
    },
  },
  candidateInterviews: {
    findAll: () => store.candidateInterviews,
    findByCandidate: (candidateId: string) => store.candidateInterviews.filter((i) => i.candidate_id === candidateId),
    findById: (id: string) => store.candidateInterviews.find((i) => i.id === id),
    create: (data: Partial<CandidateInterview>): CandidateInterview => {
      const interview = { ...data, id: generateId("int"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as CandidateInterview;
      store.candidateInterviews.push(interview);
      return interview;
    },
  },
  conditionalOffers: {
    findAll: () => store.conditionalOffers,
    findByCandidate: (candidateId: string) => store.conditionalOffers.find((o) => o.candidate_id === candidateId) || null,
    findById: (id: string) => store.conditionalOffers.find((o) => o.id === id),
    create: (data: Partial<ConditionalOffer>): ConditionalOffer => {
      const offer = { ...data, id: generateId("offer"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ConditionalOffer;
      store.conditionalOffers.push(offer);
      return offer;
    },
    update: (id: string, data: Partial<ConditionalOffer>): ConditionalOffer | null => {
      const idx = store.conditionalOffers.findIndex((o) => o.id === id);
      if (idx === -1) return null;
      store.conditionalOffers[idx] = { ...store.conditionalOffers[idx], ...data, updated_at: new Date().toISOString() };
      return store.conditionalOffers[idx];
    },
  },
  recruitmentAudit: {
    findAll: () => store.recruitmentAudit,
    findByCandidate: (candidateId: string) => store.recruitmentAudit.filter((a) => a.candidate_id === candidateId),
    findRecent: (limit = 20) => [...store.recruitmentAudit].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit),
    create: (data: Partial<RecruitmentAuditEntry>): RecruitmentAuditEntry => {
      const entry = { ...data, id: generateId("aud"), created_at: new Date().toISOString() } as RecruitmentAuditEntry;
      store.recruitmentAudit.push(entry);
      return entry;
    },
  },

  // ── Supervisions ──────────────────────────────────────────────────────────
  supervisions: {
    findAll: () => store.supervisions,
    findById: (id: string) => store.supervisions.find((s) => s.id === id),
    findByStaff: (staffId: string) => store.supervisions.filter((s) => s.staff_id === staffId),
    findBySupervisor: (supervisorId: string) => store.supervisions.filter((s) => s.supervisor_id === supervisorId),
    findScheduled: () => store.supervisions.filter((s) => s.status === "scheduled"),
    findCompleted: () => store.supervisions.filter((s) => s.status === "completed"),
    findOverdue: () => {
      const today = todayStr();
      return store.supervisions.filter((s) => s.status === "scheduled" && s.scheduled_date < today);
    },
    findDueSoon: (days = 7) => {
      const today = todayStr();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      return store.supervisions.filter((s) => s.status === "scheduled" && s.scheduled_date >= today && s.scheduled_date <= cutoffStr);
    },
    create: (data: Partial<Supervision>): Supervision => {
      const supervision = {
        ...data,
        id: generateId("sup"),
        status: data.status ?? "scheduled",
        actions_agreed: data.actions_agreed ?? [],
        staff_signature: false,
        supervisor_signature: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Supervision;
      store.supervisions.push(supervision);
      return supervision;
    },
    complete: (id: string, data: Partial<Supervision>): Supervision | null => {
      const idx = store.supervisions.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      store.supervisions[idx] = {
        ...store.supervisions[idx],
        ...data,
        status: "completed",
        actual_date: data.actual_date ?? todayStr(),
        updated_at: new Date().toISOString(),
      };
      return store.supervisions[idx];
    },
    update: (id: string, data: Partial<Supervision>): Supervision | null => {
      const idx = store.supervisions.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      store.supervisions[idx] = { ...store.supervisions[idx], ...data, updated_at: new Date().toISOString() };
      return store.supervisions[idx];
    },
  },

  // ── Documents ─────────────────────────────────────────────────────────────
  documents: {
    findAll: () => store.documents,
    findById: (id: string) => store.documents.find((d) => d.id === id),
    create: (data: Partial<Document>): Document => {
      const doc = { ...data, id: generateId("doc"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Document;
      store.documents.push(doc);
      return doc;
    },
  },

  // ── Document Read Receipts ────────────────────────────────────────────────
  documentReadReceipts: {
    findAll: () => store.documentReadReceipts,
    findByDocument: (docId: string) => store.documentReadReceipts.filter((r) => r.document_id === docId),
    findByStaff: (staffId: string) => store.documentReadReceipts.filter((r) => r.staff_id === staffId),
    upsertSignature: (docId: string, staffId: string): DocumentReadReceipt => {
      const existing = store.documentReadReceipts.find((r) => r.document_id === docId && r.staff_id === staffId);
      if (existing) {
        existing.signed_at = new Date().toISOString();
        return existing;
      }
      const receipt: DocumentReadReceipt = { id: generateId("rr"), document_id: docId, staff_id: staffId, read_at: new Date().toISOString(), signed_at: new Date().toISOString() };
      store.documentReadReceipts.push(receipt);
      return receipt;
    },
  },

  // ── Expenses ──────────────────────────────────────────────────────────────
  expenses: {
    findAll: () => store.expenses,
    findById: (id: string) => store.expenses.find((e) => e.id === id),
    findPending: () => store.expenses.filter((e) => e.status === "submitted"),
    create: (data: Partial<Expense>): Expense => {
      const exp = { ...data, id: generateId("exp"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Expense;
      store.expenses.push(exp);
      return exp;
    },
    update: (id: string, data: Partial<Expense>): Expense | null => {
      const idx = store.expenses.findIndex((e) => e.id === id);
      if (idx === -1) return null;
      store.expenses[idx] = { ...store.expenses[idx], ...data, updated_at: new Date().toISOString() };
      return store.expenses[idx];
    },
  },

  // ── Audits ────────────────────────────────────────────────────────────────
  audits: {
    findAll: () => store.audits,
    findById: (id: string) => store.audits.find((a) => a.id === id),
    create: (data: Partial<Audit>): Audit => {
      const audit = { ...data, id: generateId("aud"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Audit;
      store.audits.push(audit);
      return audit;
    },
    update: (id: string, data: Partial<Audit>): Audit | null => {
      const idx = store.audits.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      store.audits[idx] = { ...store.audits[idx], ...data, updated_at: new Date().toISOString() };
      return store.audits[idx];
    },
  },

  // ── Maintenance ───────────────────────────────────────────────────────────
  maintenance: {
    findAll: () => store.maintenance,
    findById: (id: string) => store.maintenance.find((m) => m.id === id),
    findOpen: () => store.maintenance.filter((m) => m.status !== "completed"),
    create: (data: Partial<MaintenanceItem>): MaintenanceItem => {
      const item = { ...data, id: generateId("mnt"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as MaintenanceItem;
      store.maintenance.push(item);
      return item;
    },
    update: (id: string, data: Partial<MaintenanceItem>): MaintenanceItem | null => {
      const idx = store.maintenance.findIndex((m) => m.id === id);
      if (idx === -1) return null;
      store.maintenance[idx] = { ...store.maintenance[idx], ...data, updated_at: new Date().toISOString() };
      return store.maintenance[idx];
    },
  },

  // ── Document Intelligence ─────────────────────────────────────────────────
  uploadedDocuments: {
    findAll: () => store.uploadedDocuments,
    findById: (id: string) => store.uploadedDocuments.find((d) => d.id === id),
    findByStatus: (status: string) => store.uploadedDocuments.filter((d) => d.document_status === status),
    create: (data: UploadedDocument): UploadedDocument => {
      store.uploadedDocuments.push(data);
      return data;
    },
    patch: (id: string, updates: Partial<UploadedDocument>): UploadedDocument | null => {
      const idx = store.uploadedDocuments.findIndex((d) => d.id === id);
      if (idx === -1) return null;
      store.uploadedDocuments[idx] = { ...store.uploadedDocuments[idx], ...updates, updated_at: new Date().toISOString() };
      return store.uploadedDocuments[idx];
    },
  },

  documentAuditLog: {
    findByDocument: (docId: string) => store.documentAuditLog.filter((e) => e.document_id === docId),
    append: (entry: DocumentAuditEntry): DocumentAuditEntry => {
      store.documentAuditLog.push(entry);
      return entry;
    },
  },

  // ── Workforce Intelligence ────────────────────────────────────────────────
  competencyProfiles: {
    findAll: () => store.competencyProfiles,
    findById: (id: string) => store.competencyProfiles.find((p) => p.id === id),
    findByStaff: (staffId: string) => store.competencyProfiles.find((p) => p.staff_id === staffId),
    create: (data: Partial<StaffCompetencyProfile>): StaffCompetencyProfile => {
      const profile = { ...data, id: generateId("cprof"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as StaffCompetencyProfile;
      store.competencyProfiles.push(profile);
      return profile;
    },
    update: (id: string, data: Partial<StaffCompetencyProfile>): StaffCompetencyProfile | null => {
      const idx = store.competencyProfiles.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      store.competencyProfiles[idx] = { ...store.competencyProfiles[idx], ...data, updated_at: new Date().toISOString() };
      return store.competencyProfiles[idx];
    },
  },

  competencyScores: {
    findAll: () => store.competencyScores,
    findByStaff: (staffId: string) => store.competencyScores.filter((s) => s.staff_id === staffId),
    create: (data: Partial<CompetencyScore>): CompetencyScore => {
      const score = { ...data, id: generateId("cscore"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as CompetencyScore;
      store.competencyScores.push(score);
      return score;
    },
    upsert: (staffId: string, domain: string, data: Partial<CompetencyScore>): CompetencyScore => {
      const idx = store.competencyScores.findIndex((s) => s.staff_id === staffId && s.domain === domain);
      if (idx !== -1) {
        store.competencyScores[idx] = { ...store.competencyScores[idx], ...data, updated_at: new Date().toISOString() };
        return store.competencyScores[idx];
      }
      return db.competencyScores.create(data);
    },
  },

  developmentPlans: {
    findAll: () => store.developmentPlans,
    findById: (id: string) => store.developmentPlans.find((p) => p.id === id),
    findByStaff: (staffId: string) => store.developmentPlans.filter((p) => p.staff_id === staffId),
    findActive: () => store.developmentPlans.filter((p) => p.status === "active"),
    create: (data: Partial<DevelopmentPlan>): DevelopmentPlan => {
      const plan = { ...data, id: generateId("devplan"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as DevelopmentPlan;
      store.developmentPlans.push(plan);
      return plan;
    },
    update: (id: string, data: Partial<DevelopmentPlan>): DevelopmentPlan | null => {
      const idx = store.developmentPlans.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      store.developmentPlans[idx] = { ...store.developmentPlans[idx], ...data, updated_at: new Date().toISOString() };
      return store.developmentPlans[idx];
    },
  },

  practiceObservations: {
    findAll: () => store.practiceObservations,
    findById: (id: string) => store.practiceObservations.find((o) => o.id === id),
    findByStaff: (staffId: string) => store.practiceObservations.filter((o) => o.staff_id === staffId),
    create: (data: Partial<PracticeObservation>): PracticeObservation => {
      const obs = { ...data, id: generateId("obs"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as PracticeObservation;
      store.practiceObservations.push(obs);
      return obs;
    },
  },

  readinessReports: {
    findAll: () => store.readinessReports,
    findByStaff: (staffId: string) => store.readinessReports.filter((r) => r.staff_id === staffId),
    create: (data: Partial<CareerReadinessReport>): CareerReadinessReport => {
      const report = { ...data, id: generateId("ready"), created_at: new Date().toISOString() } as CareerReadinessReport;
      store.readinessReports.push(report);
      return report;
    },
  },

  successionPlans: {
    findAll: () => store.successionPlans,
    findById: (id: string) => store.successionPlans.find((s) => s.id === id),
    create: (data: Partial<SuccessionPlan>): SuccessionPlan => {
      const plan = { ...data, id: generateId("succ"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as SuccessionPlan;
      store.successionPlans.push(plan);
      return plan;
    },
    update: (id: string, data: Partial<SuccessionPlan>): SuccessionPlan | null => {
      const idx = store.successionPlans.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      store.successionPlans[idx] = { ...store.successionPlans[idx], ...data, updated_at: new Date().toISOString() };
      return store.successionPlans[idx];
    },
  },

  appraisals: {
    findAll: () => store.appraisals,
    findById: (id: string) => store.appraisals.find((a) => a.id === id),
    findByStaff: (staffId: string) => store.appraisals.filter((a) => a.staff_id === staffId),
    findOverdue: () => store.appraisals.filter((a) => a.status === "overdue"),
    create: (data: Partial<AppraisalRecord>): AppraisalRecord => {
      const appraisal = { ...data, id: generateId("appr"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as AppraisalRecord;
      store.appraisals.push(appraisal);
      return appraisal;
    },
    update: (id: string, data: Partial<AppraisalRecord>): AppraisalRecord | null => {
      const idx = store.appraisals.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      store.appraisals[idx] = { ...store.appraisals[idx], ...data, updated_at: new Date().toISOString() };
      return store.appraisals[idx];
    },
  },

  inductionRecords: {
    findAll: () => store.inductionRecords,
    findByStaff: (staffId: string) => store.inductionRecords.find((r) => r.staff_id === staffId),
    findByStatus: (status: string) => store.inductionRecords.filter((r) => r.overall_status === status),
    create: (data: Partial<InductionRecord>): InductionRecord => {
      const record = { ...data, id: generateId("induct"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as InductionRecord;
      store.inductionRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<InductionRecord>): InductionRecord | null => {
      const idx = store.inductionRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.inductionRecords[idx] = { ...store.inductionRecords[idx], ...data, updated_at: new Date().toISOString() };
      return store.inductionRecords[idx];
    },
  },

  qualifications: {
    findAll: () => store.qualifications,
    findByStaff: (staffId: string) => store.qualifications.filter((q) => q.staff_id === staffId),
    findExpiring: (days: number) => {
      const cutoff = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
      return store.qualifications.filter((q) => q.expiry_date && q.expiry_date <= cutoff && q.status !== "expired");
    },
    create: (data: Partial<QualificationRecord>): QualificationRecord => {
      const qual = { ...data, id: generateId("qual"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as QualificationRecord;
      store.qualifications.push(qual);
      return qual;
    },
    update: (id: string, data: Partial<QualificationRecord>): QualificationRecord | null => {
      const idx = store.qualifications.findIndex((q) => q.id === id);
      if (idx === -1) return null;
      store.qualifications[idx] = { ...store.qualifications[idx], ...data, updated_at: new Date().toISOString() };
      return store.qualifications[idx];
    },
  },

  // ── Welfare Checks ─────────────────────────────────────────────────────────
  welfareChecks: {
    findAll: () => store.welfareChecks,
    findByChild: (childId: string) => store.welfareChecks.filter((w) => w.child_id === childId),
    findByDate: (date: string) => store.welfareChecks.filter((w) => w.check_date === date),
    findConcerns: () => store.welfareChecks.filter((w) => w.status === "concern" || w.physical_marks_noted),
    create: (data: Partial<WelfareCheck>): WelfareCheck => {
      const check = { ...data, id: generateId("wc"), created_at: new Date().toISOString() } as WelfareCheck;
      store.welfareChecks.push(check);
      return check;
    },
  },
  welfareCheckRounds: {
    findAll: () => store.welfareCheckRounds,
    findByDate: (date: string) => store.welfareCheckRounds.filter((r) => r.round_date === date),
    findRecent: (limit = 20) => [...store.welfareCheckRounds].sort((a, b) => {
      const aKey = `${a.round_date}_${a.round_time}`;
      const bKey = `${b.round_date}_${b.round_time}`;
      return bKey.localeCompare(aKey);
    }).slice(0, limit),
    create: (data: Partial<WelfareCheckRound>): WelfareCheckRound => {
      const round = { ...data, id: generateId("wcr"), created_at: new Date().toISOString() } as WelfareCheckRound;
      store.welfareCheckRounds.push(round);
      // Also add individual checks to the flat collection
      if (round.checks) {
        round.checks.forEach((c) => store.welfareChecks.push(c));
      }
      return round;
    },
  },

  // ── Outcomes Tracker ────────────────────────────────────────────────────────
  outcomeTargets: {
    findAll: () => store.outcomeTargets,
    findByChild: (childId: string) => store.outcomeTargets.filter((t) => t.child_id === childId),
    findById: (id: string) => store.outcomeTargets.find((t) => t.id === id),
    findActive: () => store.outcomeTargets.filter((t) => t.status === "active"),
    findByDomain: (domain: string) => store.outcomeTargets.filter((t) => t.domain === domain),
    findDeclining: () => store.outcomeTargets.filter((t) => t.direction === "declining"),
    create: (data: Partial<OutcomeTarget>): OutcomeTarget => {
      const target = { ...data, id: generateId("ot"), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as OutcomeTarget;
      store.outcomeTargets.push(target);
      return target;
    },
    update: (id: string, data: Partial<OutcomeTarget>): OutcomeTarget | null => {
      const idx = store.outcomeTargets.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      store.outcomeTargets[idx] = { ...store.outcomeTargets[idx], ...data, updated_at: new Date().toISOString() };
      return store.outcomeTargets[idx];
    },
  },
  outcomeReviews: {
    findAll: () => store.outcomeReviews,
    findByTarget: (targetId: string) => store.outcomeReviews.filter((r) => r.target_id === targetId),
    findByChild: (childId: string) => store.outcomeReviews.filter((r) => r.child_id === childId),
    findRecent: (limit = 10) => [...store.outcomeReviews].sort((a, b) => b.review_date.localeCompare(a.review_date)).slice(0, limit),
    create: (data: Partial<OutcomeReview>): OutcomeReview => {
      const review = { ...data, id: generateId("or"), created_at: new Date().toISOString() } as OutcomeReview;
      store.outcomeReviews.push(review);
      // Update the target's current rating and direction
      const targetIdx = store.outcomeTargets.findIndex((t) => t.id === review.target_id);
      if (targetIdx !== -1) {
        store.outcomeTargets[targetIdx] = {
          ...store.outcomeTargets[targetIdx],
          current_rating: review.new_rating,
          direction: review.direction,
          updated_at: new Date().toISOString(),
        };
      }
      return review;
    },
  },

  // ── Reg 44 Visit Reports ─────────────────────────────────────────────────
  reg44VisitReports: {
    findAll: () => store.reg44VisitReports,
    findById: (id: string) => store.reg44VisitReports.find((v) => v.id === id),
    create: (data: Partial<Reg44VisitReport>): Reg44VisitReport => {
      const visit = { ...data, id: generateId("v44"), created_at: new Date().toISOString() } as Reg44VisitReport;
      store.reg44VisitReports.push(visit);
      return visit;
    },
    update: (id: string, data: Partial<Reg44VisitReport>): Reg44VisitReport | null => {
      const idx = store.reg44VisitReports.findIndex((v) => v.id === id);
      if (idx === -1) return null;
      store.reg44VisitReports[idx] = { ...store.reg44VisitReports[idx], ...data };
      return store.reg44VisitReports[idx];
    },
    updateRecommendation: (visitId: string, recId: string, data: Partial<Reg44Recommendation>): Reg44Recommendation | null => {
      const visit = store.reg44VisitReports.find((v) => v.id === visitId);
      if (!visit) return null;
      const recIdx = visit.recommendations.findIndex((r) => r.id === recId);
      if (recIdx === -1) return null;
      visit.recommendations[recIdx] = { ...visit.recommendations[recIdx], ...data };
      return visit.recommendations[recIdx];
    },
  },

  // ── Key Working Sessions ──────────────────────────────────────────────────
  keyWorkingSessions: {
    findAll: () => store.keyWorkingSessions,
    findByChild: (childId: string) => store.keyWorkingSessions.filter((s) => s.child_id === childId),
    findByStaff: (staffId: string) => store.keyWorkingSessions.filter((s) => s.staff_id === staffId),
    findById: (id: string) => store.keyWorkingSessions.find((s) => s.id === id),
    create: (data: Partial<KeyWorkingSession>): KeyWorkingSession => {
      const session = {
        ...data,
        id: generateId("kw"),
        home_id: data.home_id ?? "home_oak",
        created_at: new Date().toISOString(),
      } as KeyWorkingSession;
      store.keyWorkingSessions.push(session);
      return session;
    },
    update: (id: string, data: Partial<KeyWorkingSession>): KeyWorkingSession | null => {
      const idx = store.keyWorkingSessions.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      store.keyWorkingSessions[idx] = { ...store.keyWorkingSessions[idx], ...data };
      return store.keyWorkingSessions[idx];
    },
  },

  // ── Education Records ────────────────────────────────────────────────────
  educationRecords: {
    findAll: () => store.educationRecords,
    findByChild: (childId: string) => store.educationRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.educationRecords.find((r) => r.id === id),
    create: (data: Partial<EducationRecord>): EducationRecord => {
      const record = {
        ...data,
        id: generateId("edu"),
        home_id: data.home_id ?? "home_oak",
        created_at: new Date().toISOString(),
      } as EducationRecord;
      store.educationRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<EducationRecord>): EducationRecord | null => {
      const idx = store.educationRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.educationRecords[idx] = { ...store.educationRecords[idx], ...data };
      return store.educationRecords[idx];
    },
  },

  riskAssessments: {
    findAll: () => store.riskAssessments,
    findByChild: (childId: string) => store.riskAssessments.filter((r) => r.child_id === childId),
    findById: (id: string) => store.riskAssessments.find((r) => r.id === id),
    create: (data: Partial<RiskAssessment>): RiskAssessment => {
      const record = { ...data, id: generateId("ra"), home_id: data.home_id ?? "home_oak", created_at: new Date().toISOString() } as RiskAssessment;
      store.riskAssessments.push(record);
      return record;
    },
    update: (id: string, data: Partial<RiskAssessment>): RiskAssessment | null => {
      const idx = store.riskAssessments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.riskAssessments[idx] = { ...store.riskAssessments[idx], ...data };
      return store.riskAssessments[idx];
    },
  },

  lacReviews: {
    findAll: () => store.lacReviews,
    findByChild: (childId: string) => store.lacReviews.filter((r) => r.child_id === childId),
    findById: (id: string) => store.lacReviews.find((r) => r.id === id),
    create: (data: Partial<LACReview>): LACReview => {
      const record = { ...data, id: generateId("lac"), home_id: data.home_id ?? "home_oak", created_at: new Date().toISOString() } as LACReview;
      store.lacReviews.push(record);
      return record;
    },
    update: (id: string, data: Partial<LACReview>): LACReview | null => {
      const idx = store.lacReviews.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.lacReviews[idx] = { ...store.lacReviews[idx], ...data };
      return store.lacReviews[idx];
    },
  },

  behaviourSupportPlans: {
    findAll: () => store.behaviourSupportPlans,
    findByChild: (childId: string) => store.behaviourSupportPlans.filter((r) => r.child_id === childId),
    findById: (id: string) => store.behaviourSupportPlans.find((r) => r.id === id),
    create: (data: Partial<BehaviourSupportPlan>): BehaviourSupportPlan => {
      const record = { ...data, id: generateId("bsp"), home_id: data.home_id ?? "home_oak", created_at: new Date().toISOString() } as BehaviourSupportPlan;
      store.behaviourSupportPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<BehaviourSupportPlan>): BehaviourSupportPlan | null => {
      const idx = store.behaviourSupportPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.behaviourSupportPlans[idx] = { ...store.behaviourSupportPlans[idx], ...data };
      return store.behaviourSupportPlans[idx];
    },
  },

  delegatedAuthority: {
    findAll: () => store.delegatedAuthority,
    findByChild: (childId: string) => store.delegatedAuthority.filter((r) => r.child_id === childId),
    findById: (id: string) => store.delegatedAuthority.find((r) => r.id === id),
    create: (data: Partial<DelegatedAuthority>): DelegatedAuthority => {
      const record = { ...data, id: generateId("da"), created_at: new Date().toISOString() } as DelegatedAuthority;
      store.delegatedAuthority.push(record);
      return record;
    },
    update: (id: string, data: Partial<DelegatedAuthority>): DelegatedAuthority | null => {
      const idx = store.delegatedAuthority.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.delegatedAuthority[idx] = { ...store.delegatedAuthority[idx], ...data };
      return store.delegatedAuthority[idx];
    },
  },

  houseMeetings: {
    findAll: () => store.houseMeetings,
    findById: (id: string) => store.houseMeetings.find((r) => r.id === id),
    create: (data: Partial<HouseMeeting>): HouseMeeting => {
      const record = { ...data, id: generateId("hm"), created_at: new Date().toISOString() } as HouseMeeting;
      store.houseMeetings.push(record);
      return record;
    },
    update: (id: string, data: Partial<HouseMeeting>): HouseMeeting | null => {
      const idx = store.houseMeetings.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.houseMeetings[idx] = { ...store.houseMeetings[idx], ...data };
      return store.houseMeetings[idx];
    },
  },

  sanctionRewards: {
    findAll: () => store.sanctionRewards,
    findByChild: (childId: string) => store.sanctionRewards.filter((r) => r.child_id === childId),
    findById: (id: string) => store.sanctionRewards.find((r) => r.id === id),
    create: (data: Partial<SanctionRewardEntry>): SanctionRewardEntry => {
      const record = { ...data, id: generateId("sr"), created_at: new Date().toISOString() } as SanctionRewardEntry;
      store.sanctionRewards.push(record);
      return record;
    },
    update: (id: string, data: Partial<SanctionRewardEntry>): SanctionRewardEntry | null => {
      const idx = store.sanctionRewards.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.sanctionRewards[idx] = { ...store.sanctionRewards[idx], ...data };
      return store.sanctionRewards[idx];
    },
  },

  ypFeedback: {
    findAll: () => store.ypFeedback,
    findByChild: (childId: string) => store.ypFeedback.filter((r) => r.child_id === childId),
    findById: (id: string) => store.ypFeedback.find((r) => r.id === id),
    create: (data: Partial<YPFeedbackEntry>): YPFeedbackEntry => {
      const record = { ...data, id: generateId("fb"), created_at: new Date().toISOString() } as YPFeedbackEntry;
      store.ypFeedback.push(record);
      return record;
    },
    update: (id: string, data: Partial<YPFeedbackEntry>): YPFeedbackEntry | null => {
      const idx = store.ypFeedback.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ypFeedback[idx] = { ...store.ypFeedback[idx], ...data };
      return store.ypFeedback[idx];
    },
  },

  sleepLog: {
    findAll: () => store.sleepLog,
    findById: (id: string) => store.sleepLog.find((r) => r.id === id),
    create: (data: Partial<SleepLogEntry>): SleepLogEntry => {
      const record = { ...data, id: generateId("sl"), created_at: new Date().toISOString() } as SleepLogEntry;
      store.sleepLog.push(record);
      return record;
    },
    update: (id: string, data: Partial<SleepLogEntry>): SleepLogEntry | null => {
      const idx = store.sleepLog.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.sleepLog[idx] = { ...store.sleepLog[idx], ...data };
      return store.sleepLog[idx];
    },
  },

  compliments: {
    findAll: () => store.compliments,
    findById: (id: string) => store.compliments.find((r) => r.id === id),
    create: (data: Partial<Compliment>): Compliment => {
      const record = { ...data, id: generateId("cmp"), created_at: new Date().toISOString() } as Compliment;
      store.compliments.push(record);
      return record;
    },
    update: (id: string, data: Partial<Compliment>): Compliment | null => {
      const idx = store.compliments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.compliments[idx] = { ...store.compliments[idx], ...data };
      return store.compliments[idx];
    },
  },

  visitors: {
    findAll: () => store.visitors,
    findById: (id: string) => store.visitors.find((r) => r.id === id),
    create: (data: Partial<VisitorEntry>): VisitorEntry => {
      const record = { ...data, id: generateId("vis"), created_at: new Date().toISOString() } as VisitorEntry;
      store.visitors.push(record);
      return record;
    },
    update: (id: string, data: Partial<VisitorEntry>): VisitorEntry | null => {
      const idx = store.visitors.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.visitors[idx] = { ...store.visitors[idx], ...data };
      return store.visitors[idx];
    },
  },

  fireDrills: {
    findAll: () => store.fireDrills,
    findById: (id: string) => store.fireDrills.find((r) => r.id === id),
    create: (data: Partial<FireDrill>): FireDrill => {
      const record = { ...data, id: generateId("fd"), created_at: new Date().toISOString() } as FireDrill;
      store.fireDrills.push(record);
      return record;
    },
    update: (id: string, data: Partial<FireDrill>): FireDrill | null => {
      const idx = store.fireDrills.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.fireDrills[idx] = { ...store.fireDrills[idx], ...data };
      return store.fireDrills[idx];
    },
  },

  significantEvents: {
    findAll: () => store.significantEvents,
    findByChild: (childId: string) => store.significantEvents.filter((r) => r.child_id === childId),
    findById: (id: string) => store.significantEvents.find((r) => r.id === id),
    create: (data: Partial<SignificantEvent>): SignificantEvent => {
      const record = { ...data, id: generateId("se"), created_at: new Date().toISOString() } as SignificantEvent;
      store.significantEvents.push(record);
      return record;
    },
    update: (id: string, data: Partial<SignificantEvent>): SignificantEvent | null => {
      const idx = store.significantEvents.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.significantEvents[idx] = { ...store.significantEvents[idx], ...data };
      return store.significantEvents[idx];
    },
  },

  restraints: {
    findAll: () => store.restraints,
    findByChild: (childId: string) => store.restraints.filter((r) => r.child_id === childId),
    findById: (id: string) => store.restraints.find((r) => r.id === id),
    create: (data: Partial<RestraintRecord>): RestraintRecord => {
      const record = { ...data, id: generateId("rst"), created_at: new Date().toISOString() } as RestraintRecord;
      store.restraints.push(record);
      return record;
    },
    update: (id: string, data: Partial<RestraintRecord>): RestraintRecord | null => {
      const idx = store.restraints.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.restraints[idx] = { ...store.restraints[idx], ...data };
      return store.restraints[idx];
    },
  },

  notifiableEvents: {
    findAll: () => store.notifiableEvents,
    findByChild: (childId: string) => store.notifiableEvents.filter((r) => r.child_id === childId),
    findById: (id: string) => store.notifiableEvents.find((r) => r.id === id),
    create: (data: Partial<NotifiableEvent>): NotifiableEvent => {
      const record = { ...data, id: generateId("ne") } as NotifiableEvent;
      store.notifiableEvents.push(record);
      return record;
    },
    update: (id: string, data: Partial<NotifiableEvent>): NotifiableEvent | null => {
      const idx = store.notifiableEvents.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.notifiableEvents[idx] = { ...store.notifiableEvents[idx], ...data };
      return store.notifiableEvents[idx];
    },
  },

  nightLogs: {
    findAll: () => store.nightLogs,
    findById: (id: string) => store.nightLogs.find((r) => r.id === id),
    create: (data: Partial<NightLogEntry>): NightLogEntry => {
      const record = { ...data, id: generateId("nl") } as NightLogEntry;
      store.nightLogs.push(record);
      return record;
    },
    update: (id: string, data: Partial<NightLogEntry>): NightLogEntry | null => {
      const idx = store.nightLogs.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.nightLogs[idx] = { ...store.nightLogs[idx], ...data };
      return store.nightLogs[idx];
    },
  },

  behaviourLog: {
    findAll: () => store.behaviourLog,
    findByChild: (childId: string) => store.behaviourLog.filter((r) => r.child_id === childId),
    findById: (id: string) => store.behaviourLog.find((r) => r.id === id),
    create: (data: Partial<BehaviourEntry>): BehaviourEntry => {
      const record = { ...data, id: generateId("bh"), created_at: new Date().toISOString() } as BehaviourEntry;
      store.behaviourLog.push(record);
      return record;
    },
    update: (id: string, data: Partial<BehaviourEntry>): BehaviourEntry | null => {
      const idx = store.behaviourLog.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.behaviourLog[idx] = { ...store.behaviourLog[idx], ...data };
      return store.behaviourLog[idx];
    },
  },

  accidentBook: {
    findAll: () => store.accidentBook,
    findById: (id: string) => store.accidentBook.find((r) => r.id === id),
    create: (data: Partial<AccidentRecord>): AccidentRecord => {
      const record = { ...data, id: generateId("acc"), created_at: new Date().toISOString() } as AccidentRecord;
      store.accidentBook.push(record);
      return record;
    },
    update: (id: string, data: Partial<AccidentRecord>): AccidentRecord | null => {
      const idx = store.accidentBook.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.accidentBook[idx] = { ...store.accidentBook[idx], ...data };
      return store.accidentBook[idx];
    },
  },

  absenceTracking: {
    findAll: () => store.absenceTracking,
    findByChild: (childId: string) => store.absenceTracking.filter((r) => r.child_id === childId),
    findById: (id: string) => store.absenceTracking.find((r) => r.id === id),
    create: (data: Partial<AbsenceRecord>): AbsenceRecord => {
      const record = { ...data, id: generateId("abs"), created_at: new Date().toISOString() } as AbsenceRecord;
      store.absenceTracking.push(record);
      return record;
    },
    update: (id: string, data: Partial<AbsenceRecord>): AbsenceRecord | null => {
      const idx = store.absenceTracking.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.absenceTracking[idx] = { ...store.absenceTracking[idx], ...data };
      return store.absenceTracking[idx];
    },
  },

  positiveHandling: {
    findAll: () => store.positiveHandling,
    findByChild: (childId: string) => store.positiveHandling.filter((r) => r.child_id === childId),
    findById: (id: string) => store.positiveHandling.find((r) => r.id === id),
    create: (data: Partial<PositiveHandlingPlan>): PositiveHandlingPlan => {
      const record = { ...data, id: generateId("php"), created_at: new Date().toISOString() } as PositiveHandlingPlan;
      store.positiveHandling.push(record);
      return record;
    },
    update: (id: string, data: Partial<PositiveHandlingPlan>): PositiveHandlingPlan | null => {
      const idx = store.positiveHandling.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.positiveHandling[idx] = { ...store.positiveHandling[idx], ...data };
      return store.positiveHandling[idx];
    },
  },

  medicationErrors: {
    findAll: () => store.medicationErrors,
    findByChild: (childId: string) => store.medicationErrors.filter((r) => r.child_id === childId),
    findById: (id: string) => store.medicationErrors.find((r) => r.id === id),
    create: (data: Partial<MedicationError>): MedicationError => {
      const record = { ...data, id: generateId("me"), created_at: new Date().toISOString() } as MedicationError;
      store.medicationErrors.push(record);
      return record;
    },
    update: (id: string, data: Partial<MedicationError>): MedicationError | null => {
      const idx = store.medicationErrors.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.medicationErrors[idx] = { ...store.medicationErrors[idx], ...data };
      return store.medicationErrors[idx];
    },
  },

  bodyMap: {
    findAll: () => store.bodyMap,
    findByChild: (childId: string) => store.bodyMap.filter((r) => r.child_id === childId),
    findById: (id: string) => store.bodyMap.find((r) => r.id === id),
    create: (data: Partial<BodyMapEntry>): BodyMapEntry => {
      const record = { ...data, id: generateId("bm"), created_at: new Date().toISOString() } as BodyMapEntry;
      store.bodyMap.push(record);
      return record;
    },
    update: (id: string, data: Partial<BodyMapEntry>): BodyMapEntry | null => {
      const idx = store.bodyMap.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.bodyMap[idx] = { ...store.bodyMap[idx], ...data };
      return store.bodyMap[idx];
    },
  },

  activities: {
    findAll: () => store.activities,
    findByChild: (childId: string) => store.activities.filter((r) => r.child_id === childId),
    findById: (id: string) => store.activities.find((r) => r.id === id),
    create: (data: Partial<Activity>): Activity => {
      const record = { ...data, id: generateId("act"), created_at: new Date().toISOString() } as Activity;
      store.activities.push(record);
      return record;
    },
    update: (id: string, data: Partial<Activity>): Activity | null => {
      const idx = store.activities.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.activities[idx] = { ...store.activities[idx], ...data };
      return store.activities[idx];
    },
  },

  adoptionRecords: {
    findAll: () => store.adoptionRecords,
    findById: (id: string) => store.adoptionRecords.find((r) => r.id === id),
    create: (data: Partial<AdoptionRecord>): AdoptionRecord => {
      const record = { ...data, id: generateId("adp"), created_at: new Date().toISOString() } as AdoptionRecord;
      store.adoptionRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<AdoptionRecord>): AdoptionRecord | null => {
      const idx = store.adoptionRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.adoptionRecords[idx] = { ...store.adoptionRecords[idx], ...data };
      return store.adoptionRecords[idx];
    },
  },

  advocacyRecords: {
    findAll: () => store.advocacyRecords,
    findByChild: (childId: string) => store.advocacyRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.advocacyRecords.find((r) => r.id === id),
    create: (data: Partial<AdvocacyRecord>): AdvocacyRecord => {
      const record = { ...data, id: generateId("adv"), created_at: new Date().toISOString() } as AdvocacyRecord;
      store.advocacyRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<AdvocacyRecord>): AdvocacyRecord | null => {
      const idx = store.advocacyRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.advocacyRecords[idx] = { ...store.advocacyRecords[idx], ...data };
      return store.advocacyRecords[idx];
    },
  },

  afterCareRecords: {
    findAll: () => store.afterCareRecords,
    findByChild: (childId: string) => store.afterCareRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.afterCareRecords.find((r) => r.id === id),
    create: (data: Partial<AfterCareRecord>): AfterCareRecord => {
      const record = { ...data, id: generateId("ac"), created_at: new Date().toISOString() } as AfterCareRecord;
      store.afterCareRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<AfterCareRecord>): AfterCareRecord | null => {
      const idx = store.afterCareRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.afterCareRecords[idx] = { ...store.afterCareRecords[idx], ...data };
      return store.afterCareRecords[idx];
    },
  },

  agencyInductions: {
    findAll: () => store.agencyInductions,
    findById: (id: string) => store.agencyInductions.find((r) => r.id === id),
    create: (data: Partial<AgencyInduction>): AgencyInduction => {
      const record = { ...data, id: generateId("agi"), created_at: new Date().toISOString() } as AgencyInduction;
      store.agencyInductions.push(record);
      return record;
    },
    update: (id: string, data: Partial<AgencyInduction>): AgencyInduction | null => {
      const idx = store.agencyInductions.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.agencyInductions[idx] = { ...store.agencyInductions[idx], ...data };
      return store.agencyInductions[idx];
    },
  },

  agencyStaffLog: {
    findAll: () => store.agencyStaffLog,
    findById: (id: string) => store.agencyStaffLog.find((r) => r.id === id),
    create: (data: Partial<AgencyStaffRecord>): AgencyStaffRecord => {
      const record = { ...data, id: generateId("asl"), created_at: new Date().toISOString() } as AgencyStaffRecord;
      store.agencyStaffLog.push(record);
      return record;
    },
    update: (id: string, data: Partial<AgencyStaffRecord>): AgencyStaffRecord | null => {
      const idx = store.agencyStaffLog.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.agencyStaffLog[idx] = { ...store.agencyStaffLog[idx], ...data };
      return store.agencyStaffLog[idx];
    },
  },

  annualDevelopmentReviews: {
    findAll: () => store.annualDevelopmentReviews,
    findById: (id: string) => store.annualDevelopmentReviews.find((r) => r.id === id),
    create: (data: Partial<AnnualDevelopmentReview>): AnnualDevelopmentReview => {
      const record = { ...data, id: generateId("adr"), created_at: new Date().toISOString() } as AnnualDevelopmentReview;
      store.annualDevelopmentReviews.push(record);
      return record;
    },
    update: (id: string, data: Partial<AnnualDevelopmentReview>): AnnualDevelopmentReview | null => {
      const idx = store.annualDevelopmentReviews.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.annualDevelopmentReviews[idx] = { ...store.annualDevelopmentReviews[idx], ...data };
      return store.annualDevelopmentReviews[idx];
    },
  },

  annualHealthAssessments: {
    findAll: () => store.annualHealthAssessments,
    findById: (id: string) => store.annualHealthAssessments.find((r) => r.id === id),
    findByChild: (childId: string) => store.annualHealthAssessments.filter((r) => r.child_id === childId),
    create: (data: Partial<AnnualHealthAssessment>): AnnualHealthAssessment => {
      const record = { ...data, id: generateId("aha"), created_at: new Date().toISOString() } as AnnualHealthAssessment;
      store.annualHealthAssessments.push(record);
      return record;
    },
    update: (id: string, data: Partial<AnnualHealthAssessment>): AnnualHealthAssessment | null => {
      const idx = store.annualHealthAssessments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.annualHealthAssessments[idx] = { ...store.annualHealthAssessments[idx], ...data };
      return store.annualHealthAssessments[idx];
    },
  },

  annualOutcomes: {
    findAll: () => store.annualOutcomes,
    findById: (id: string) => store.annualOutcomes.find((r) => r.id === id),
    findByChild: (childId: string) => store.annualOutcomes.filter((r) => r.child_id === childId),
    create: (data: Partial<AnnualOutcome>): AnnualOutcome => {
      const record = { ...data, id: generateId("ao"), created_at: new Date().toISOString() } as AnnualOutcome;
      store.annualOutcomes.push(record);
      return record;
    },
    update: (id: string, data: Partial<AnnualOutcome>): AnnualOutcome | null => {
      const idx = store.annualOutcomes.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.annualOutcomes[idx] = { ...store.annualOutcomes[idx], ...data };
      return store.annualOutcomes[idx];
    },
  },

  appointments: {
    findAll: () => store.appointments,
    findById: (id: string) => store.appointments.find((r) => r.id === id),
    findByChild: (childId: string) => store.appointments.filter((r) => r.child_id === childId),
    create: (data: Partial<Appointment>): Appointment => {
      const record = { ...data, id: generateId("apt"), created_at: new Date().toISOString() } as Appointment;
      store.appointments.push(record);
      return record;
    },
    update: (id: string, data: Partial<Appointment>): Appointment | null => {
      const idx = store.appointments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.appointments[idx] = { ...store.appointments[idx], ...data };
      return store.appointments[idx];
    },
  },

  needsAssessments: {
    findAll: () => store.needsAssessments,
    findById: (id: string) => store.needsAssessments.find((r) => r.id === id),
    findByChild: (childId: string) => store.needsAssessments.filter((r) => r.child_id === childId),
    create: (data: Partial<NeedsAssessment>): NeedsAssessment => {
      const record = { ...data, id: generateId("aon"), created_at: new Date().toISOString() } as NeedsAssessment;
      store.needsAssessments.push(record);
      return record;
    },
    update: (id: string, data: Partial<NeedsAssessment>): NeedsAssessment | null => {
      const idx = store.needsAssessments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.needsAssessments[idx] = { ...store.needsAssessments[idx], ...data };
      return store.needsAssessments[idx];
    },
  },

  attachmentProfiles: {
    findAll: () => store.attachmentProfiles,
    findById: (id: string) => store.attachmentProfiles.find((r) => r.id === id),
    findByChild: (childId: string) => store.attachmentProfiles.filter((r) => r.child_id === childId),
    create: (data: Partial<AttachmentProfile>): AttachmentProfile => {
      const record = { ...data, id: generateId("ap"), created_at: new Date().toISOString() } as AttachmentProfile;
      store.attachmentProfiles.push(record);
      return record;
    },
    update: (id: string, data: Partial<AttachmentProfile>): AttachmentProfile | null => {
      const idx = store.attachmentProfiles.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.attachmentProfiles[idx] = { ...store.attachmentProfiles[idx], ...data };
      return store.attachmentProfiles[idx];
    },
  },

  behaviourMapEntries: {
    findAll: () => store.behaviourMapEntries,
    findById: (id: string) => store.behaviourMapEntries.find((r) => r.id === id),
    findByChild: (childId: string) => store.behaviourMapEntries.filter((r) => r.child_id === childId),
    create: (data: Partial<BehaviourMapEntry>): BehaviourMapEntry => {
      const record = { ...data, id: generateId("bm"), created_at: new Date().toISOString() } as BehaviourMapEntry;
      store.behaviourMapEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<BehaviourMapEntry>): BehaviourMapEntry | null => {
      const idx = store.behaviourMapEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.behaviourMapEntries[idx] = { ...store.behaviourMapEntries[idx], ...data };
      return store.behaviourMapEntries[idx];
    },
  },

  bereavementRecords: {
    findAll: () => store.bereavementRecords,
    findById: (id: string) => store.bereavementRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.bereavementRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<BereavementRecord>): BereavementRecord => {
      const record = { ...data, id: generateId("br"), created_at: new Date().toISOString() } as BereavementRecord;
      store.bereavementRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<BereavementRecord>): BereavementRecord | null => {
      const idx = store.bereavementRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.bereavementRecords[idx] = { ...store.bereavementRecords[idx], ...data };
      return store.bereavementRecords[idx];
    },
  },

  bullyingIncidents: {
    findAll: () => store.bullyingIncidents,
    findById: (id: string) => store.bullyingIncidents.find((r) => r.id === id),
    findByChild: (childId: string) => store.bullyingIncidents.filter((r) => r.child_id === childId),
    create: (data: Partial<BullyingIncident>): BullyingIncident => {
      const record = { ...data, id: generateId("bul"), created_at: new Date().toISOString() } as BullyingIncident;
      store.bullyingIncidents.push(record);
      return record;
    },
    update: (id: string, data: Partial<BullyingIncident>): BullyingIncident | null => {
      const idx = store.bullyingIncidents.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.bullyingIncidents[idx] = { ...store.bullyingIncidents[idx], ...data };
      return store.bullyingIncidents[idx];
    },
  },

  camhsReferrals: {
    findAll: () => store.camhsReferrals,
    findById: (id: string) => store.camhsReferrals.find((r) => r.id === id),
    findByChild: (childId: string) => store.camhsReferrals.filter((r) => r.child_id === childId),
    create: (data: Partial<CamhsReferral>): CamhsReferral => {
      const record = { ...data, id: generateId("camhs"), created_at: new Date().toISOString() } as CamhsReferral;
      store.camhsReferrals.push(record);
      return record;
    },
    update: (id: string, data: Partial<CamhsReferral>): CamhsReferral | null => {
      const idx = store.camhsReferrals.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.camhsReferrals[idx] = { ...store.camhsReferrals[idx], ...data };
      return store.camhsReferrals[idx];
    },
  },

  cctvAccesses: {
    findAll: () => store.cctvAccesses,
    findById: (id: string) => store.cctvAccesses.find((r) => r.id === id),
    create: (data: Partial<CCTVAccess>): CCTVAccess => {
      const record = { ...data, id: generateId("cc"), created_at: new Date().toISOString() } as CCTVAccess;
      store.cctvAccesses.push(record);
      return record;
    },
    update: (id: string, data: Partial<CCTVAccess>): CCTVAccess | null => {
      const idx = store.cctvAccesses.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.cctvAccesses[idx] = { ...store.cctvAccesses[idx], ...data };
      return store.cctvAccesses[idx];
    },
  },

  adhdPlans: {
    findAll: () => store.adhdPlans,
    findById: (id: string) => store.adhdPlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.adhdPlans.filter((r) => r.child_id === childId),
    create: (data: Partial<ADHDPlan>): ADHDPlan => {
      const record = { ...data, id: generateId("adhd"), created_at: new Date().toISOString() } as ADHDPlan;
      store.adhdPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<ADHDPlan>): ADHDPlan | null => {
      const idx = store.adhdPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.adhdPlans[idx] = { ...store.adhdPlans[idx], ...data };
      return store.adhdPlans[idx];
    },
  },

  allergyPlans: {
    findAll: () => store.allergyPlans,
    findById: (id: string) => store.allergyPlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.allergyPlans.filter((r) => r.child_id === childId),
    create: (data: Partial<AllergyPlan>): AllergyPlan => {
      const record = { ...data, id: generateId("alp"), created_at: new Date().toISOString() } as AllergyPlan;
      store.allergyPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<AllergyPlan>): AllergyPlan | null => {
      const idx = store.allergyPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.allergyPlans[idx] = { ...store.allergyPlans[idx], ...data };
      return store.allergyPlans[idx];
    },
  },

  aspirationRecords: {
    findAll: () => store.aspirationRecords,
    findById: (id: string) => store.aspirationRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.aspirationRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<AspirationRecord>): AspirationRecord => {
      const record = { ...data, id: generateId("asp"), created_at: new Date().toISOString() } as AspirationRecord;
      store.aspirationRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<AspirationRecord>): AspirationRecord | null => {
      const idx = store.aspirationRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.aspirationRecords[idx] = { ...store.aspirationRecords[idx], ...data };
      return store.aspirationRecords[idx];
    },
  },

  asthmaPlans: {
    findAll: () => store.asthmaPlans,
    findById: (id: string) => store.asthmaPlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.asthmaPlans.filter((r) => r.child_id === childId),
    create: (data: Partial<AsthmaPlan>): AsthmaPlan => {
      const record = { ...data, id: generateId("aap"), created_at: new Date().toISOString() } as AsthmaPlan;
      store.asthmaPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<AsthmaPlan>): AsthmaPlan | null => {
      const idx = store.asthmaPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.asthmaPlans[idx] = { ...store.asthmaPlans[idx], ...data };
      return store.asthmaPlans[idx];
    },
  },

  autismPlans: {
    findAll: () => store.autismPlans,
    findById: (id: string) => store.autismPlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.autismPlans.filter((r) => r.child_id === childId),
    create: (data: Partial<AutismPlan>): AutismPlan => {
      const record = { ...data, id: generateId("aut"), created_at: new Date().toISOString() } as AutismPlan;
      store.autismPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<AutismPlan>): AutismPlan | null => {
      const idx = store.autismPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.autismPlans[idx] = { ...store.autismPlans[idx], ...data };
      return store.autismPlans[idx];
    },
  },

  childBankAccounts: {
    findAll: () => store.childBankAccounts,
    findById: (id: string) => store.childBankAccounts.find((r) => r.id === id),
    findByChild: (childId: string) => store.childBankAccounts.filter((r) => r.child_id === childId),
    create: (data: Partial<ChildBankAccount>): ChildBankAccount => {
      const record = { ...data, id: generateId("ba"), created_at: new Date().toISOString() } as ChildBankAccount;
      store.childBankAccounts.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChildBankAccount>): ChildBankAccount | null => {
      const idx = store.childBankAccounts.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.childBankAccounts[idx] = { ...store.childBankAccounts[idx], ...data };
      return store.childBankAccounts[idx];
    },
  },

  careAnniversaryRecords: {
    findAll: () => store.careAnniversaryRecords,
    findById: (id: string) => store.careAnniversaryRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.careAnniversaryRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<CareAnniversaryRecord>): CareAnniversaryRecord => {
      const record = { ...data, id: generateId("ca"), created_at: new Date().toISOString() } as CareAnniversaryRecord;
      store.careAnniversaryRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<CareAnniversaryRecord>): CareAnniversaryRecord | null => {
      const idx = store.careAnniversaryRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.careAnniversaryRecords[idx] = { ...store.careAnniversaryRecords[idx], ...data };
      return store.careAnniversaryRecords[idx];
    },
  },

  cyclingBikeRecords: {
    findAll: () => store.cyclingBikeRecords,
    findById: (id: string) => store.cyclingBikeRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.cyclingBikeRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<CyclingBikeRecord>): CyclingBikeRecord => {
      const record = { ...data, id: generateId("cbr"), created_at: new Date().toISOString() } as CyclingBikeRecord;
      store.cyclingBikeRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<CyclingBikeRecord>): CyclingBikeRecord | null => {
      const idx = store.cyclingBikeRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.cyclingBikeRecords[idx] = { ...store.cyclingBikeRecords[idx], ...data };
      return store.cyclingBikeRecords[idx];
    },
  },

  charityGrantRecords: {
    findAll: () => store.charityGrantRecords,
    findById: (id: string) => store.charityGrantRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.charityGrantRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<CharityGrantRecord>): CharityGrantRecord => {
      const record = { ...data, id: generateId("cgr"), created_at: new Date().toISOString() } as CharityGrantRecord;
      store.charityGrantRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<CharityGrantRecord>): CharityGrantRecord | null => {
      const idx = store.charityGrantRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.charityGrantRecords[idx] = { ...store.charityGrantRecords[idx], ...data };
      return store.charityGrantRecords[idx];
    },
  },

  clothingShoppingTrips: {
    findAll: () => store.clothingShoppingTrips,
    findById: (id: string) => store.clothingShoppingTrips.find((r) => r.id === id),
    findByChild: (childId: string) => store.clothingShoppingTrips.filter((r) => r.child_id === childId),
    create: (data: Partial<ClothingShoppingTrip>): ClothingShoppingTrip => {
      const record = { ...data, id: generateId("cst"), created_at: new Date().toISOString() } as ClothingShoppingTrip;
      store.clothingShoppingTrips.push(record);
      return record;
    },
    update: (id: string, data: Partial<ClothingShoppingTrip>): ClothingShoppingTrip | null => {
      const idx = store.clothingShoppingTrips.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.clothingShoppingTrips[idx] = { ...store.clothingShoppingTrips[idx], ...data };
      return store.clothingShoppingTrips[idx];
    },
  },

  continencePlans: {
    findAll: () => store.continencePlans,
    findById: (id: string) => store.continencePlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.continencePlans.filter((r) => r.child_id === childId),
    create: (data: Partial<ContinencePlan>): ContinencePlan => {
      const record = { ...data, id: generateId("ccp"), created_at: new Date().toISOString() } as ContinencePlan;
      store.continencePlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<ContinencePlan>): ContinencePlan | null => {
      const idx = store.continencePlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.continencePlans[idx] = { ...store.continencePlans[idx], ...data };
      return store.continencePlans[idx];
    },
  },

  cookingBakingRecords: {
    findAll: () => store.cookingBakingRecords,
    findById: (id: string) => store.cookingBakingRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.cookingBakingRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<CookingBakingRecord>): CookingBakingRecord => {
      const record = { ...data, id: generateId("ckb"), created_at: new Date().toISOString() } as CookingBakingRecord;
      store.cookingBakingRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<CookingBakingRecord>): CookingBakingRecord | null => {
      const idx = store.cookingBakingRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.cookingBakingRecords[idx] = { ...store.cookingBakingRecords[idx], ...data };
      return store.cookingBakingRecords[idx];
    },
  },

  incomingCorrespondence: {
    findAll: () => store.incomingCorrespondence,
    findById: (id: string) => store.incomingCorrespondence.find((r) => r.id === id),
    findByChild: (childId: string) => store.incomingCorrespondence.filter((r) => r.child_id === childId),
    create: (data: Partial<IncomingCorrespondence>): IncomingCorrespondence => {
      const record = { ...data, id: generateId("icr"), created_at: new Date().toISOString() } as IncomingCorrespondence;
      store.incomingCorrespondence.push(record);
      return record;
    },
    update: (id: string, data: Partial<IncomingCorrespondence>): IncomingCorrespondence | null => {
      const idx = store.incomingCorrespondence.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.incomingCorrespondence[idx] = { ...store.incomingCorrespondence[idx], ...data };
      return store.incomingCorrespondence[idx];
    },
  },

  courtAttendanceRecords: {
    findAll: () => store.courtAttendanceRecords,
    findById: (id: string) => store.courtAttendanceRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.courtAttendanceRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<CourtAttendanceRecord>): CourtAttendanceRecord => {
      const record = { ...data, id: generateId("car"), created_at: new Date().toISOString() } as CourtAttendanceRecord;
      store.courtAttendanceRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<CourtAttendanceRecord>): CourtAttendanceRecord | null => {
      const idx = store.courtAttendanceRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.courtAttendanceRecords[idx] = { ...store.courtAttendanceRecords[idx], ...data };
      return store.courtAttendanceRecords[idx];
    },
  },

  creativeProjectRecords: {
    findAll: () => store.creativeProjectRecords,
    findById: (id: string) => store.creativeProjectRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.creativeProjectRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<CreativeProjectRecord>): CreativeProjectRecord => {
      const record = { ...data, id: generateId("cpr"), created_at: new Date().toISOString() } as CreativeProjectRecord;
      store.creativeProjectRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<CreativeProjectRecord>): CreativeProjectRecord | null => {
      const idx = store.creativeProjectRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.creativeProjectRecords[idx] = { ...store.creativeProjectRecords[idx], ...data };
      return store.creativeProjectRecords[idx];
    },
  },

  culturalReligiousMentors: {
    findAll: () => store.culturalReligiousMentors,
    findById: (id: string) => store.culturalReligiousMentors.find((r) => r.id === id),
    findByChild: (childId: string) => store.culturalReligiousMentors.filter((r) => r.child_id === childId),
    create: (data: Partial<CulturalReligiousMentor>): CulturalReligiousMentor => {
      const record = { ...data, id: generateId("crm"), created_at: new Date().toISOString() } as CulturalReligiousMentor;
      store.culturalReligiousMentors.push(record);
      return record;
    },
    update: (id: string, data: Partial<CulturalReligiousMentor>): CulturalReligiousMentor | null => {
      const idx = store.culturalReligiousMentors.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.culturalReligiousMentors[idx] = { ...store.culturalReligiousMentors[idx], ...data };
      return store.culturalReligiousMentors[idx];
    },
  },

  deafHearingSupportRecords: {
    findAll: () => store.deafHearingSupportRecords,
    findById: (id: string) => store.deafHearingSupportRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.deafHearingSupportRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<DeafHearingSupportRecord>): DeafHearingSupportRecord => {
      const record = { ...data, id: generateId("dhs"), created_at: new Date().toISOString() } as DeafHearingSupportRecord;
      store.deafHearingSupportRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<DeafHearingSupportRecord>): DeafHearingSupportRecord | null => {
      const idx = store.deafHearingSupportRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.deafHearingSupportRecords[idx] = { ...store.deafHearingSupportRecords[idx], ...data };
      return store.deafHearingSupportRecords[idx];
    },
  },

  diabeticCarePlans: {
    findAll: () => store.diabeticCarePlans,
    findById: (id: string) => store.diabeticCarePlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.diabeticCarePlans.filter((r) => r.child_id === childId),
    create: (data: Partial<DiabeticCarePlan>): DiabeticCarePlan => {
      const record = { ...data, id: generateId("dcp"), created_at: new Date().toISOString() } as DiabeticCarePlan;
      store.diabeticCarePlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<DiabeticCarePlan>): DiabeticCarePlan | null => {
      const idx = store.diabeticCarePlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.diabeticCarePlans[idx] = { ...store.diabeticCarePlans[idx], ...data };
      return store.diabeticCarePlans[idx];
    },
  },

  spldSupportPlans: {
    findAll: () => store.spldSupportPlans,
    findById: (id: string) => store.spldSupportPlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.spldSupportPlans.filter((r) => r.child_id === childId),
    create: (data: Partial<SpldSupportPlan>): SpldSupportPlan => {
      const record = { ...data, id: generateId("ssp"), created_at: new Date().toISOString() } as SpldSupportPlan;
      store.spldSupportPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<SpldSupportPlan>): SpldSupportPlan | null => {
      const idx = store.spldSupportPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.spldSupportPlans[idx] = { ...store.spldSupportPlans[idx], ...data };
      return store.spldSupportPlans[idx];
    },
  },

  epilepsySeizurePlans: {
    findAll: () => store.epilepsySeizurePlans,
    findById: (id: string) => store.epilepsySeizurePlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.epilepsySeizurePlans.filter((r) => r.child_id === childId),
    create: (data: Partial<EpilepsySeizurePlan>): EpilepsySeizurePlan => {
      const record = { ...data, id: generateId("esp"), created_at: new Date().toISOString() } as EpilepsySeizurePlan;
      store.epilepsySeizurePlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<EpilepsySeizurePlan>): EpilepsySeizurePlan | null => {
      const idx = store.epilepsySeizurePlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.epilepsySeizurePlans[idx] = { ...store.epilepsySeizurePlans[idx], ...data };
      return store.epilepsySeizurePlans[idx];
    },
  },

  extracurricularClubRecords: {
    findAll: () => store.extracurricularClubRecords,
    findById: (id: string) => store.extracurricularClubRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.extracurricularClubRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<ExtracurricularClubRecord>): ExtracurricularClubRecord => {
      const record = { ...data, id: generateId("ecr"), created_at: new Date().toISOString() } as ExtracurricularClubRecord;
      store.extracurricularClubRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ExtracurricularClubRecord>): ExtracurricularClubRecord | null => {
      const idx = store.extracurricularClubRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.extracurricularClubRecords[idx] = { ...store.extracurricularClubRecords[idx], ...data };
      return store.extracurricularClubRecords[idx];
    },
  },

  childFeedbackLoops: {
    findAll: () => store.childFeedbackLoops,
    findById: (id: string) => store.childFeedbackLoops.find((r) => r.id === id),
    findByChild: (childId: string) => store.childFeedbackLoops.filter((r) => r.child_id === childId),
    create: (data: Partial<ChildFeedbackLoop>): ChildFeedbackLoop => {
      const record = { ...data, id: generateId("cfl"), created_at: new Date().toISOString() } as ChildFeedbackLoop;
      store.childFeedbackLoops.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChildFeedbackLoop>): ChildFeedbackLoop | null => {
      const idx = store.childFeedbackLoops.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.childFeedbackLoops[idx] = { ...store.childFeedbackLoops[idx], ...data };
      return store.childFeedbackLoops[idx];
    },
  },

  childStaffFeedback: {
    findAll: () => store.childStaffFeedback,
    findById: (id: string) => store.childStaffFeedback.find((r) => r.id === id),
    findByChild: (childId: string) => store.childStaffFeedback.filter((r) => r.child_id === childId),
    create: (data: Partial<ChildStaffFeedback>): ChildStaffFeedback => {
      const record = { ...data, id: generateId("csf"), created_at: new Date().toISOString() } as ChildStaffFeedback;
      store.childStaffFeedback.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChildStaffFeedback>): ChildStaffFeedback | null => {
      const idx = store.childStaffFeedback.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.childStaffFeedback[idx] = { ...store.childStaffFeedback[idx], ...data };
      return store.childStaffFeedback[idx];
    },
  },

  childFriendlyPolicies: {
    findAll: () => store.childFriendlyPolicies,
    findById: (id: string) => store.childFriendlyPolicies.find((r) => r.id === id),
    create: (data: Partial<ChildFriendlyPolicy>): ChildFriendlyPolicy => {
      const record = { ...data, id: generateId("cfp"), created_at: new Date().toISOString() } as ChildFriendlyPolicy;
      store.childFriendlyPolicies.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChildFriendlyPolicy>): ChildFriendlyPolicy | null => {
      const idx = store.childFriendlyPolicies.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.childFriendlyPolicies[idx] = { ...store.childFriendlyPolicies[idx], ...data };
      return store.childFriendlyPolicies[idx];
    },
  },

  heritageLanguageRecords: {
    findAll: () => store.heritageLanguageRecords,
    findById: (id: string) => store.heritageLanguageRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.heritageLanguageRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<HeritageLanguageRecord>): HeritageLanguageRecord => {
      const record = { ...data, id: generateId("hlr"), created_at: new Date().toISOString() } as HeritageLanguageRecord;
      store.heritageLanguageRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<HeritageLanguageRecord>): HeritageLanguageRecord | null => {
      const idx = store.heritageLanguageRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.heritageLanguageRecords[idx] = { ...store.heritageLanguageRecords[idx], ...data };
      return store.heritageLanguageRecords[idx];
    },
  },

  immigrationUascRecords: {
    findAll: () => store.immigrationUascRecords,
    findById: (id: string) => store.immigrationUascRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.immigrationUascRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<ImmigrationUascRecord>): ImmigrationUascRecord => {
      const record = { ...data, id: generateId("iur"), created_at: new Date().toISOString() } as ImmigrationUascRecord;
      store.immigrationUascRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ImmigrationUascRecord>): ImmigrationUascRecord | null => {
      const idx = store.immigrationUascRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.immigrationUascRecords[idx] = { ...store.immigrationUascRecords[idx], ...data };
      return store.immigrationUascRecords[idx];
    },
  },

  childInjuryRecords: {
    findAll: () => store.childInjuryRecords,
    findById: (id: string) => store.childInjuryRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.childInjuryRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<ChildInjuryRecord>): ChildInjuryRecord => {
      const record = { ...data, id: generateId("cir"), created_at: new Date().toISOString() } as ChildInjuryRecord;
      store.childInjuryRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChildInjuryRecord>): ChildInjuryRecord | null => {
      const idx = store.childInjuryRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.childInjuryRecords[idx] = { ...store.childInjuryRecords[idx], ...data };
      return store.childInjuryRecords[idx];
    },
  },

  childKeyDocuments: {
    findAll: () => store.childKeyDocuments,
    findById: (id: string) => store.childKeyDocuments.find((r) => r.id === id),
    findByChild: (childId: string) => store.childKeyDocuments.filter((r) => r.child_id === childId),
    create: (data: Partial<ChildKeyDocument>): ChildKeyDocument => {
      const record = { ...data, id: generateId("ckd"), created_at: new Date().toISOString() } as ChildKeyDocument;
      store.childKeyDocuments.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChildKeyDocument>): ChildKeyDocument | null => {
      const idx = store.childKeyDocuments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.childKeyDocuments[idx] = { ...store.childKeyDocuments[idx], ...data };
      return store.childKeyDocuments[idx];
    },
  },

  keyworkerSessions: {
    findAll: () => store.keyworkerSessions,
    findById: (id: string) => store.keyworkerSessions.find((r) => r.id === id),
    findByChild: (childId: string) => store.keyworkerSessions.filter((r) => r.child_id === childId),
    create: (data: Partial<KeyworkerSessionRecord>): KeyworkerSessionRecord => {
      const record = { ...data, id: generateId("kws"), created_at: new Date().toISOString() } as KeyworkerSessionRecord;
      store.keyworkerSessions.push(record);
      return record;
    },
    update: (id: string, data: Partial<KeyworkerSessionRecord>): KeyworkerSessionRecord | null => {
      const idx = store.keyworkerSessions.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.keyworkerSessions[idx] = { ...store.keyworkerSessions[idx], ...data };
      return store.keyworkerSessions[idx];
    },
  },

  laundrySelfCareRecords: {
    findAll: () => store.laundrySelfCareRecords,
    findById: (id: string) => store.laundrySelfCareRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.laundrySelfCareRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<LaundrySelfCareRecord>): LaundrySelfCareRecord => {
      const record = { ...data, id: generateId("lsc"), created_at: new Date().toISOString() } as LaundrySelfCareRecord;
      store.laundrySelfCareRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<LaundrySelfCareRecord>): LaundrySelfCareRecord | null => {
      const idx = store.laundrySelfCareRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.laundrySelfCareRecords[idx] = { ...store.laundrySelfCareRecords[idx], ...data };
      return store.laundrySelfCareRecords[idx];
    },
  },

  childLedMeetings: {
    findAll: () => store.childLedMeetings,
    findById: (id: string) => store.childLedMeetings.find((r) => r.id === id),
    findByChild: (childId: string) => store.childLedMeetings.filter((r) => r.child_id === childId),
    create: (data: Partial<ChildLedMeetingRecord>): ChildLedMeetingRecord => {
      const record = { ...data, id: generateId("clm"), created_at: new Date().toISOString() } as ChildLedMeetingRecord;
      store.childLedMeetings.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChildLedMeetingRecord>): ChildLedMeetingRecord | null => {
      const idx = store.childLedMeetings.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.childLedMeetings[idx] = { ...store.childLedMeetings[idx], ...data };
      return store.childLedMeetings[idx];
    },
  },

  mentalHealthCheckIns: {
    findAll: () => store.mentalHealthCheckIns,
    findById: (id: string) => store.mentalHealthCheckIns.find((r) => r.id === id),
    findByChild: (childId: string) => store.mentalHealthCheckIns.filter((r) => r.child_id === childId),
    create: (data: Partial<MentalHealthCheckIn>): MentalHealthCheckIn => {
      const record = { ...data, id: generateId("mhc"), created_at: new Date().toISOString() } as MentalHealthCheckIn;
      store.mentalHealthCheckIns.push(record);
      return record;
    },
    update: (id: string, data: Partial<MentalHealthCheckIn>): MentalHealthCheckIn | null => {
      const idx = store.mentalHealthCheckIns.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.mentalHealthCheckIns[idx] = { ...store.mentalHealthCheckIns[idx], ...data };
      return store.mentalHealthCheckIns[idx];
    },
  },

  childPhoneRecords: {
    findAll: () => store.childPhoneRecords,
    findById: (id: string) => store.childPhoneRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.childPhoneRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<ChildPhoneRecord>): ChildPhoneRecord => {
      const record = { ...data, id: generateId("cpr"), created_at: new Date().toISOString() } as ChildPhoneRecord;
      store.childPhoneRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChildPhoneRecord>): ChildPhoneRecord | null => {
      const idx = store.childPhoneRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.childPhoneRecords[idx] = { ...store.childPhoneRecords[idx], ...data };
      return store.childPhoneRecords[idx];
    },
  },

  mobilityDisabilityPlans: {
    findAll: () => store.mobilityDisabilityPlans,
    findById: (id: string) => store.mobilityDisabilityPlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.mobilityDisabilityPlans.filter((r) => r.child_id === childId),
    create: (data: Partial<MobilityDisabilityPlan>): MobilityDisabilityPlan => {
      const record = { ...data, id: generateId("mdp"), created_at: new Date().toISOString() } as MobilityDisabilityPlan;
      store.mobilityDisabilityPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<MobilityDisabilityPlan>): MobilityDisabilityPlan | null => {
      const idx = store.mobilityDisabilityPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.mobilityDisabilityPlans[idx] = { ...store.mobilityDisabilityPlans[idx], ...data };
      return store.mobilityDisabilityPlans[idx];
    },
  },

  photoIdRecords: {
    findAll: () => store.photoIdRecords,
    findById: (id: string) => store.photoIdRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.photoIdRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<PhotoIdRecord>): PhotoIdRecord => {
      const record = { ...data, id: generateId("pid"), created_at: new Date().toISOString() } as PhotoIdRecord;
      store.photoIdRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<PhotoIdRecord>): PhotoIdRecord | null => {
      const idx = store.photoIdRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.photoIdRecords[idx] = { ...store.photoIdRecords[idx], ...data };
      return store.photoIdRecords[idx];
    },
  },

  childPhotoEntries: {
    findAll: () => store.childPhotoEntries,
    findById: (id: string) => store.childPhotoEntries.find((r) => r.id === id),
    findByChild: (childId: string) => store.childPhotoEntries.filter((r) => r.child_id === childId),
    create: (data: Partial<ChildPhotoEntry>): ChildPhotoEntry => {
      const record = { ...data, id: generateId("cpe"), created_at: new Date().toISOString() } as ChildPhotoEntry;
      store.childPhotoEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChildPhotoEntry>): ChildPhotoEntry | null => {
      const idx = store.childPhotoEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.childPhotoEntries[idx] = { ...store.childPhotoEntries[idx], ...data };
      return store.childPhotoEntries[idx];
    },
  },

  physioOtPlans: {
    findAll: () => store.physioOtPlans,
    findById: (id: string) => store.physioOtPlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.physioOtPlans.filter((r) => r.child_id === childId),
    create: (data: Partial<PhysioOtPlan>): PhysioOtPlan => {
      const record = { ...data, id: generateId("pot"), created_at: new Date().toISOString() } as PhysioOtPlan;
      store.physioOtPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<PhysioOtPlan>): PhysioOtPlan | null => {
      const idx = store.physioOtPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.physioOtPlans[idx] = { ...store.physioOtPlans[idx], ...data };
      return store.physioOtPlans[idx];
    },
  },

  policeContactRecords: {
    findAll: () => store.policeContactRecords,
    findById: (id: string) => store.policeContactRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.policeContactRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<PoliceContactRecord>): PoliceContactRecord => {
      const record = { ...data, id: generateId("pcr"), created_at: new Date().toISOString() } as PoliceContactRecord;
      store.policeContactRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<PoliceContactRecord>): PoliceContactRecord | null => {
      const idx = store.policeContactRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.policeContactRecords[idx] = { ...store.policeContactRecords[idx], ...data };
      return store.policeContactRecords[idx];
    },
  },

  preventScreenings: {
    findAll: () => store.preventScreenings,
    findById: (id: string) => store.preventScreenings.find((r) => r.id === id),
    findByChild: (childId: string) => store.preventScreenings.filter((r) => r.child_id === childId),
    create: (data: Partial<PreventScreeningRecord>): PreventScreeningRecord => {
      const record = { ...data, id: generateId("psr"), created_at: new Date().toISOString() } as PreventScreeningRecord;
      store.preventScreenings.push(record);
      return record;
    },
    update: (id: string, data: Partial<PreventScreeningRecord>): PreventScreeningRecord | null => {
      const idx = store.preventScreenings.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.preventScreenings[idx] = { ...store.preventScreenings[idx], ...data };
      return store.preventScreenings[idx];
    },
  },

  cpConferences: {
    findAll: () => store.cpConferences,
    findById: (id: string) => store.cpConferences.find((r) => r.id === id),
    findByChild: (childId: string) => store.cpConferences.filter((r) => r.child_id === childId),
    create: (data: Partial<CpConferenceRecord>): CpConferenceRecord => {
      const record = { ...data, id: generateId("cpc"), created_at: new Date().toISOString() } as CpConferenceRecord;
      store.cpConferences.push(record);
      return record;
    },
    update: (id: string, data: Partial<CpConferenceRecord>): CpConferenceRecord | null => {
      const idx = store.cpConferences.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.cpConferences[idx] = { ...store.cpConferences[idx], ...data };
      return store.cpConferences[idx];
    },
  },

  rightsLiteracyRecords: {
    findAll: () => store.rightsLiteracyRecords,
    findById: (id: string) => store.rightsLiteracyRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.rightsLiteracyRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<RightsLiteracyRecord>): RightsLiteracyRecord => {
      const record = { ...data, id: generateId("rlr"), created_at: new Date().toISOString() } as RightsLiteracyRecord;
      store.rightsLiteracyRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<RightsLiteracyRecord>): RightsLiteracyRecord | null => {
      const idx = store.rightsLiteracyRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.rightsLiteracyRecords[idx] = { ...store.rightsLiteracyRecords[idx], ...data };
      return store.rightsLiteracyRecords[idx];
    },
  },

  schoolEngagementEvents: {
    findAll: () => store.schoolEngagementEvents,
    findById: (id: string) => store.schoolEngagementEvents.find((r) => r.id === id),
    findByChild: (childId: string) => store.schoolEngagementEvents.filter((r) => r.child_id === childId),
    create: (data: Partial<SchoolEngagementEvent>): SchoolEngagementEvent => {
      const record = { ...data, id: generateId("see"), created_at: new Date().toISOString() } as SchoolEngagementEvent;
      store.schoolEngagementEvents.push(record);
      return record;
    },
    update: (id: string, data: Partial<SchoolEngagementEvent>): SchoolEngagementEvent | null => {
      const idx = store.schoolEngagementEvents.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.schoolEngagementEvents[idx] = { ...store.schoolEngagementEvents[idx], ...data };
      return store.schoolEngagementEvents[idx];
    },
  },

  selfSoothingToolkits: {
    findAll: () => store.selfSoothingToolkits,
    findById: (id: string) => store.selfSoothingToolkits.find((r) => r.id === id),
    findByChild: (childId: string) => store.selfSoothingToolkits.filter((r) => r.child_id === childId),
    create: (data: Partial<SelfSoothingToolkit>): SelfSoothingToolkit => {
      const record = { ...data, id: generateId("sst"), created_at: new Date().toISOString() } as SelfSoothingToolkit;
      store.selfSoothingToolkits.push(record);
      return record;
    },
    update: (id: string, data: Partial<SelfSoothingToolkit>): SelfSoothingToolkit | null => {
      const idx = store.selfSoothingToolkits.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.selfSoothingToolkits[idx] = { ...store.selfSoothingToolkits[idx], ...data };
      return store.selfSoothingToolkits[idx];
    },
  },

  skinConditionPlans: {
    findAll: () => store.skinConditionPlans,
    findById: (id: string) => store.skinConditionPlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.skinConditionPlans.filter((r) => r.child_id === childId),
    create: (data: Partial<SkinConditionPlan>): SkinConditionPlan => {
      const record = { ...data, id: generateId("scp"), created_at: new Date().toISOString() } as SkinConditionPlan;
      store.skinConditionPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<SkinConditionPlan>): SkinConditionPlan | null => {
      const idx = store.skinConditionPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.skinConditionPlans[idx] = { ...store.skinConditionPlans[idx], ...data };
      return store.skinConditionPlans[idx];
    },
  },

  smokingVapingRecords: {
    findAll: () => store.smokingVapingRecords,
    findById: (id: string) => store.smokingVapingRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.smokingVapingRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<SmokingVapingRecord>): SmokingVapingRecord => {
      const record = { ...data, id: generateId("svr"), created_at: new Date().toISOString() } as SmokingVapingRecord;
      store.smokingVapingRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SmokingVapingRecord>): SmokingVapingRecord | null => {
      const idx = store.smokingVapingRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.smokingVapingRecords[idx] = { ...store.smokingVapingRecords[idx], ...data };
      return store.smokingVapingRecords[idx];
    },
  },

  traumaTherapyLogs: {
    findAll: () => store.traumaTherapyLogs,
    findById: (id: string) => store.traumaTherapyLogs.find((r) => r.id === id),
    findByChild: (childId: string) => store.traumaTherapyLogs.filter((r) => r.child_id === childId),
    create: (data: Partial<TraumaTherapyLog>): TraumaTherapyLog => {
      const record = { ...data, id: generateId("ttl"), created_at: new Date().toISOString() } as TraumaTherapyLog;
      store.traumaTherapyLogs.push(record);
      return record;
    },
    update: (id: string, data: Partial<TraumaTherapyLog>): TraumaTherapyLog | null => {
      const idx = store.traumaTherapyLogs.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.traumaTherapyLogs[idx] = { ...store.traumaTherapyLogs[idx], ...data };
      return store.traumaTherapyLogs[idx];
    },
  },

  styleIdentityRecords: {
    findAll: () => store.styleIdentityRecords,
    findById: (id: string) => store.styleIdentityRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.styleIdentityRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<StyleIdentityRecord>): StyleIdentityRecord => {
      const record = { ...data, id: generateId("sir"), created_at: new Date().toISOString() } as StyleIdentityRecord;
      store.styleIdentityRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StyleIdentityRecord>): StyleIdentityRecord | null => {
      const idx = store.styleIdentityRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.styleIdentityRecords[idx] = { ...store.styleIdentityRecords[idx], ...data };
      return store.styleIdentityRecords[idx];
    },
  },

  tutoringRecords: {
    findAll: () => store.tutoringRecords,
    findById: (id: string) => store.tutoringRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.tutoringRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<TutoringRecord>): TutoringRecord => {
      const record = { ...data, id: generateId("tut"), created_at: new Date().toISOString() } as TutoringRecord;
      store.tutoringRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<TutoringRecord>): TutoringRecord | null => {
      const idx = store.tutoringRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.tutoringRecords[idx] = { ...store.tutoringRecords[idx], ...data };
      return store.tutoringRecords[idx];
    },
  },

  visionCareRecords: {
    findAll: () => store.visionCareRecords,
    findById: (id: string) => store.visionCareRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.visionCareRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<VisionCareRecord>): VisionCareRecord => {
      const record = { ...data, id: generateId("vcr"), created_at: new Date().toISOString() } as VisionCareRecord;
      store.visionCareRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<VisionCareRecord>): VisionCareRecord | null => {
      const idx = store.visionCareRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.visionCareRecords[idx] = { ...store.visionCareRecords[idx], ...data };
      return store.visionCareRecords[idx];
    },
  },

  childExpertEntries: {
    findAll: () => store.childExpertEntries,
    findById: (id: string) => store.childExpertEntries.find((r) => r.id === id),
    findByChild: (childId: string) => store.childExpertEntries.filter((r) => r.child_id === childId),
    create: (data: Partial<ChildExpertEntry>): ChildExpertEntry => {
      const record = { ...data, id: generateId("cee"), created_at: new Date().toISOString() } as ChildExpertEntry;
      store.childExpertEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChildExpertEntry>): ChildExpertEntry | null => {
      const idx = store.childExpertEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.childExpertEntries[idx] = { ...store.childExpertEntries[idx], ...data };
      return store.childExpertEntries[idx];
    },
  },

  cmeRecords: {
    findAll: () => store.cmeRecords,
    findById: (id: string) => store.cmeRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.cmeRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<CMERecord>): CMERecord => {
      const record = { ...data, id: generateId("cme"), created_at: new Date().toISOString() } as CMERecord;
      store.cmeRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<CMERecord>): CMERecord | null => {
      const idx = store.cmeRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.cmeRecords[idx] = { ...store.cmeRecords[idx], ...data };
      return store.cmeRecords[idx];
    },
  },

  childrensMeetingRecords: {
    findAll: () => store.childrensMeetingRecords,
    findById: (id: string) => store.childrensMeetingRecords.find((r) => r.id === id),
    create: (data: Partial<ChildrensMeetingRecord>): ChildrensMeetingRecord => {
      const record = { ...data, id: generateId("cmr"), created_at: new Date().toISOString() } as ChildrensMeetingRecord;
      store.childrensMeetingRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChildrensMeetingRecord>): ChildrensMeetingRecord | null => {
      const idx = store.childrensMeetingRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.childrensMeetingRecords[idx] = { ...store.childrensMeetingRecords[idx], ...data };
      return store.childrensMeetingRecords[idx];
    },
  },

  clothingAllowanceRecords: {
    findAll: () => store.clothingAllowanceRecords,
    findById: (id: string) => store.clothingAllowanceRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.clothingAllowanceRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<ClothingAllowanceRecord>): ClothingAllowanceRecord => {
      const record = { ...data, id: generateId("car"), created_at: new Date().toISOString() } as ClothingAllowanceRecord;
      store.clothingAllowanceRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ClothingAllowanceRecord>): ClothingAllowanceRecord | null => {
      const idx = store.clothingAllowanceRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.clothingAllowanceRecords[idx] = { ...store.clothingAllowanceRecords[idx], ...data };
      return store.clothingAllowanceRecords[idx];
    },
  },

  commissioningFeedbackRecords: {
    findAll: () => store.commissioningFeedbackRecords,
    findById: (id: string) => store.commissioningFeedbackRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.commissioningFeedbackRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<CommissioningFeedbackRecord>): CommissioningFeedbackRecord => {
      const record = { ...data, id: generateId("cfr"), created_at: new Date().toISOString() } as CommissioningFeedbackRecord;
      store.commissioningFeedbackRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<CommissioningFeedbackRecord>): CommissioningFeedbackRecord | null => {
      const idx = store.commissioningFeedbackRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.commissioningFeedbackRecords[idx] = { ...store.commissioningFeedbackRecords[idx], ...data };
      return store.commissioningFeedbackRecords[idx];
    },
  },

  communicationBookEntries: {
    findAll: () => store.communicationBookEntries,
    findById: (id: string) => store.communicationBookEntries.find((r) => r.id === id),
    create: (data: Partial<CommunicationBookEntry>): CommunicationBookEntry => {
      const record = { ...data, id: generateId("cbe"), created_at: new Date().toISOString() } as CommunicationBookEntry;
      store.communicationBookEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<CommunicationBookEntry>): CommunicationBookEntry | null => {
      const idx = store.communicationBookEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.communicationBookEntries[idx] = { ...store.communicationBookEntries[idx], ...data };
      return store.communicationBookEntries[idx];
    },
  },

  communityFeedbackRecords: {
    findAll: () => store.communityFeedbackRecords,
    findById: (id: string) => store.communityFeedbackRecords.find((r) => r.id === id),
    create: (data: Partial<CommunityFeedbackRecord>): CommunityFeedbackRecord => {
      const record = { ...data, id: generateId("cfb"), created_at: new Date().toISOString() } as CommunityFeedbackRecord;
      store.communityFeedbackRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<CommunityFeedbackRecord>): CommunityFeedbackRecord | null => {
      const idx = store.communityFeedbackRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.communityFeedbackRecords[idx] = { ...store.communityFeedbackRecords[idx], ...data };
      return store.communityFeedbackRecords[idx];
    },
  },

  complaintOutcomeRecords: {
    findAll: () => store.complaintOutcomeRecords,
    findById: (id: string) => store.complaintOutcomeRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.complaintOutcomeRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<ComplaintOutcomeRecord>): ComplaintOutcomeRecord => {
      const record = { ...data, id: generateId("cor"), created_at: new Date().toISOString() } as ComplaintOutcomeRecord;
      store.complaintOutcomeRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ComplaintOutcomeRecord>): ComplaintOutcomeRecord | null => {
      const idx = store.complaintOutcomeRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.complaintOutcomeRecords[idx] = { ...store.complaintOutcomeRecords[idx], ...data };
      return store.complaintOutcomeRecords[idx];
    },
  },

  consentRecords: {
    findAll: () => store.consentRecords,
    findById: (id: string) => store.consentRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.consentRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<ConsentRecord>): ConsentRecord => {
      const record = { ...data, id: generateId("csr"), created_at: new Date().toISOString() } as ConsentRecord;
      store.consentRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ConsentRecord>): ConsentRecord | null => {
      const idx = store.consentRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.consentRecords[idx] = { ...store.consentRecords[idx], ...data };
      return store.consentRecords[idx];
    },
  },

  contactDirectoryEntries: {
    findAll: () => store.contactDirectoryEntries,
    findById: (id: string) => store.contactDirectoryEntries.find((r) => r.id === id),
    create: (data: Partial<ContactDirectoryEntry>): ContactDirectoryEntry => {
      const record = { ...data, id: generateId("cde"), created_at: new Date().toISOString() } as ContactDirectoryEntry;
      store.contactDirectoryEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<ContactDirectoryEntry>): ContactDirectoryEntry | null => {
      const idx = store.contactDirectoryEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.contactDirectoryEntries[idx] = { ...store.contactDirectoryEntries[idx], ...data };
      return store.contactDirectoryEntries[idx];
    },
  },

  contactSupervisionSessions: {
    findAll: () => store.contactSupervisionSessions,
    findById: (id: string) => store.contactSupervisionSessions.find((r) => r.id === id),
    findByChild: (childId: string) => store.contactSupervisionSessions.filter((r) => r.child_id === childId),
    create: (data: Partial<ContactSupervisionSession>): ContactSupervisionSession => {
      const record = { ...data, id: generateId("css"), created_at: new Date().toISOString() } as ContactSupervisionSession;
      store.contactSupervisionSessions.push(record);
      return record;
    },
    update: (id: string, data: Partial<ContactSupervisionSession>): ContactSupervisionSession | null => {
      const idx = store.contactSupervisionSessions.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.contactSupervisionSessions[idx] = { ...store.contactSupervisionSessions[idx], ...data };
      return store.contactSupervisionSessions[idx];
    },
  },

  contextualSafeguardingRisks: {
    findAll: () => store.contextualSafeguardingRisks,
    findById: (id: string) => store.contextualSafeguardingRisks.find((r) => r.id === id),
    create: (data: Partial<ContextualSafeguardingRisk>): ContextualSafeguardingRisk => {
      const record = { ...data, id: generateId("csg"), created_at: new Date().toISOString() } as ContextualSafeguardingRisk;
      store.contextualSafeguardingRisks.push(record);
      return record;
    },
    update: (id: string, data: Partial<ContextualSafeguardingRisk>): ContextualSafeguardingRisk | null => {
      const idx = store.contextualSafeguardingRisks.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.contextualSafeguardingRisks[idx] = { ...store.contextualSafeguardingRisks[idx], ...data };
      return store.contextualSafeguardingRisks[idx];
    },
  },

  correspondenceEntries: {
    findAll: () => store.correspondenceEntries,
    findById: (id: string) => store.correspondenceEntries.find((r) => r.id === id),
    findByChild: (childId: string) => store.correspondenceEntries.filter((r) => r.child_id === childId),
    create: (data: Partial<CorrespondenceEntry>): CorrespondenceEntry => {
      const record = { ...data, id: generateId("cre"), created_at: new Date().toISOString() } as CorrespondenceEntry;
      store.correspondenceEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<CorrespondenceEntry>): CorrespondenceEntry | null => {
      const idx = store.correspondenceEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.correspondenceEntries[idx] = { ...store.correspondenceEntries[idx], ...data };
      return store.correspondenceEntries[idx];
    },
  },

  criticalIncidentDebriefRecords: {
    findAll: () => store.criticalIncidentDebriefRecords,
    findById: (id: string) => store.criticalIncidentDebriefRecords.find((r) => r.id === id),
    create: (data: Partial<CriticalIncidentDebriefRecord>): CriticalIncidentDebriefRecord => {
      const record = { ...data, id: generateId("cid"), created_at: new Date().toISOString() } as CriticalIncidentDebriefRecord;
      store.criticalIncidentDebriefRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<CriticalIncidentDebriefRecord>): CriticalIncidentDebriefRecord | null => {
      const idx = store.criticalIncidentDebriefRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.criticalIncidentDebriefRecords[idx] = { ...store.criticalIncidentDebriefRecords[idx], ...data };
      return store.criticalIncidentDebriefRecords[idx];
    },
  },

  culturalIdentityPlans: {
    findAll: () => store.culturalIdentityPlans,
    findById: (id: string) => store.culturalIdentityPlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.culturalIdentityPlans.filter((r) => r.child_id === childId),
    create: (data: Partial<CulturalIdentityPlan>): CulturalIdentityPlan => {
      const record = { ...data, id: generateId("cip"), created_at: new Date().toISOString() } as CulturalIdentityPlan;
      store.culturalIdentityPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<CulturalIdentityPlan>): CulturalIdentityPlan | null => {
      const idx = store.culturalIdentityPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.culturalIdentityPlans[idx] = { ...store.culturalIdentityPlans[idx], ...data };
      return store.culturalIdentityPlans[idx];
    },
  },

  dataBreachRecords: {
    findAll: () => store.dataBreachRecords,
    findById: (id: string) => store.dataBreachRecords.find((r) => r.id === id),
    create: (data: Partial<DataBreachRecord>): DataBreachRecord => {
      const record = { ...data, id: generateId("dbr"), created_at: new Date().toISOString() } as DataBreachRecord;
      store.dataBreachRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<DataBreachRecord>): DataBreachRecord | null => {
      const idx = store.dataBreachRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.dataBreachRecords[idx] = { ...store.dataBreachRecords[idx], ...data };
      return store.dataBreachRecords[idx];
    },
  },

  dataProtectionRecords: {
    findAll: () => store.dataProtectionRecords,
    findById: (id: string) => store.dataProtectionRecords.find((r) => r.id === id),
    create: (data: Partial<DataProtectionRecord>): DataProtectionRecord => {
      const record = { ...data, id: generateId("dpr"), created_at: new Date().toISOString() } as DataProtectionRecord;
      store.dataProtectionRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<DataProtectionRecord>): DataProtectionRecord | null => {
      const idx = store.dataProtectionRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.dataProtectionRecords[idx] = { ...store.dataProtectionRecords[idx], ...data };
      return store.dataProtectionRecords[idx];
    },
  },

  debriefRecords: {
    findAll: () => store.debriefRecords,
    findById: (id: string) => store.debriefRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.debriefRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<DebriefRecord>): DebriefRecord => {
      const record = { ...data, id: generateId("dbf"), created_at: new Date().toISOString() } as DebriefRecord;
      store.debriefRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<DebriefRecord>): DebriefRecord | null => {
      const idx = store.debriefRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.debriefRecords[idx] = { ...store.debriefRecords[idx], ...data };
      return store.debriefRecords[idx];
    },
  },

  dentalRecords: {
    findAll: () => store.dentalRecords,
    findById: (id: string) => store.dentalRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.dentalRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<DentalRecord>): DentalRecord => {
      const record = { ...data, id: generateId("dnt"), created_at: new Date().toISOString() } as DentalRecord;
      store.dentalRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<DentalRecord>): DentalRecord | null => {
      const idx = store.dentalRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.dentalRecords[idx] = { ...store.dentalRecords[idx], ...data };
      return store.dentalRecords[idx];
    },
  },

  dolRecords: {
    findAll: () => store.dolRecords,
    findById: (id: string) => store.dolRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.dolRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<DoLRecord>): DoLRecord => {
      const record = { ...data, id: generateId("dol"), created_at: new Date().toISOString() } as DoLRecord;
      store.dolRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<DoLRecord>): DoLRecord | null => {
      const idx = store.dolRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.dolRecords[idx] = { ...store.dolRecords[idx], ...data };
      return store.dolRecords[idx];
    },
  },

  devicePolicyRecords: {
    findAll: () => store.devicePolicyRecords,
    findById: (id: string) => store.devicePolicyRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.devicePolicyRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<DevicePolicyRecord>): DevicePolicyRecord => {
      const record = { ...data, id: generateId("dvp"), created_at: new Date().toISOString() } as DevicePolicyRecord;
      store.devicePolicyRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<DevicePolicyRecord>): DevicePolicyRecord | null => {
      const idx = store.devicePolicyRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.devicePolicyRecords[idx] = { ...store.devicePolicyRecords[idx], ...data };
      return store.devicePolicyRecords[idx];
    },
  },

  digitalLiteracySkillRecords: {
    findAll: () => store.digitalLiteracySkillRecords,
    findById: (id: string) => store.digitalLiteracySkillRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.digitalLiteracySkillRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<DigitalLiteracySkillRecord>): DigitalLiteracySkillRecord => {
      const record = { ...data, id: generateId("dls"), created_at: new Date().toISOString() } as DigitalLiteracySkillRecord;
      store.digitalLiteracySkillRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<DigitalLiteracySkillRecord>): DigitalLiteracySkillRecord | null => {
      const idx = store.digitalLiteracySkillRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.digitalLiteracySkillRecords[idx] = { ...store.digitalLiteracySkillRecords[idx], ...data };
      return store.digitalLiteracySkillRecords[idx];
    },
  },

  dischargeRecords: {
    findAll: () => store.dischargeRecords,
    findById: (id: string) => store.dischargeRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.dischargeRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<DischargeRecord>): DischargeRecord => {
      const record = { ...data, id: generateId("dis"), created_at: new Date().toISOString() } as DischargeRecord;
      store.dischargeRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<DischargeRecord>): DischargeRecord | null => {
      const idx = store.dischargeRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.dischargeRecords[idx] = { ...store.dischargeRecords[idx], ...data };
      return store.dischargeRecords[idx];
    },
  },

  diversityCalendarEvents: {
    findAll: () => store.diversityCalendarEvents,
    findById: (id: string) => store.diversityCalendarEvents.find((r) => r.id === id),
    create: (data: Partial<DiversityCalendarEvent>): DiversityCalendarEvent => {
      const record = { ...data, id: generateId("dce"), created_at: new Date().toISOString() } as DiversityCalendarEvent;
      store.diversityCalendarEvents.push(record);
      return record;
    },
    update: (id: string, data: Partial<DiversityCalendarEvent>): DiversityCalendarEvent | null => {
      const idx = store.diversityCalendarEvents.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.diversityCalendarEvents[idx] = { ...store.diversityCalendarEvents[idx], ...data };
      return store.diversityCalendarEvents[idx];
    },
  },

  trackedDocuments: {
    findAll: () => store.trackedDocuments,
    findById: (id: string) => store.trackedDocuments.find((r) => r.id === id),
    create: (data: Partial<TrackedDocument>): TrackedDocument => {
      const record = { ...data, id: generateId("tdoc"), created_at: new Date().toISOString() } as TrackedDocument;
      store.trackedDocuments.push(record);
      return record;
    },
    update: (id: string, data: Partial<TrackedDocument>): TrackedDocument | null => {
      const idx = store.trackedDocuments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.trackedDocuments[idx] = { ...store.trackedDocuments[idx], ...data };
      return store.trackedDocuments[idx];
    },
  },

  drivingRecords: {
    findAll: () => store.drivingRecords,
    findById: (id: string) => store.drivingRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.drivingRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<DrivingRecord>): DrivingRecord => {
      const record = { ...data, id: generateId("drv"), created_at: new Date().toISOString() } as DrivingRecord;
      store.drivingRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<DrivingRecord>): DrivingRecord | null => {
      const idx = store.drivingRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.drivingRecords[idx] = { ...store.drivingRecords[idx], ...data };
      return store.drivingRecords[idx];
    },
  },

  substanceScreenings: {
    findAll: () => store.substanceScreenings,
    findById: (id: string) => store.substanceScreenings.find((r) => r.id === id),
    findByChild: (childId: string) => store.substanceScreenings.filter((r) => r.child_id === childId),
    create: (data: Partial<SubstanceScreening>): SubstanceScreening => {
      const record = { ...data, id: generateId("das"), created_at: new Date().toISOString() } as SubstanceScreening;
      store.substanceScreenings.push(record);
      return record;
    },
    update: (id: string, data: Partial<SubstanceScreening>): SubstanceScreening | null => {
      const idx = store.substanceScreenings.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.substanceScreenings[idx] = { ...store.substanceScreenings[idx], ...data };
      return store.substanceScreenings[idx];
    },
  },

  dutyLogEntries: {
    findAll: () => store.dutyLogEntries,
    findById: (id: string) => store.dutyLogEntries.find((r) => r.id === id),
    create: (data: Partial<DutyLogEntry>): DutyLogEntry => {
      const record = { ...data, id: generateId("dl"), created_at: new Date().toISOString() } as DutyLogEntry;
      store.dutyLogEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<DutyLogEntry>): DutyLogEntry | null => {
      const idx = store.dutyLogEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.dutyLogEntries[idx] = { ...store.dutyLogEntries[idx], ...data };
      return store.dutyLogEntries[idx];
    },
  },

  eatingSupportPlans: {
    findAll: () => store.eatingSupportPlans,
    findById: (id: string) => store.eatingSupportPlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.eatingSupportPlans.filter((r) => r.child_id === childId),
    create: (data: Partial<EatingSupportPlan>): EatingSupportPlan => {
      const record = { ...data, id: generateId("eat"), created_at: new Date().toISOString() } as EatingSupportPlan;
      store.eatingSupportPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<EatingSupportPlan>): EatingSupportPlan | null => {
      const idx = store.eatingSupportPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.eatingSupportPlans[idx] = { ...store.eatingSupportPlans[idx], ...data };
      return store.eatingSupportPlans[idx];
    },
  },

  eduAttendanceRecords: {
    findAll: () => store.eduAttendanceRecords,
    findById: (id: string) => store.eduAttendanceRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.eduAttendanceRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<EduAttendanceRecord>): EduAttendanceRecord => {
      const record = { ...data, id: generateId("eat"), created_at: new Date().toISOString() } as EduAttendanceRecord;
      store.eduAttendanceRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<EduAttendanceRecord>): EduAttendanceRecord | null => {
      const idx = store.eduAttendanceRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.eduAttendanceRecords[idx] = { ...store.eduAttendanceRecords[idx], ...data };
      return store.eduAttendanceRecords[idx];
    },
  },

  ehcpRecords: {
    findAll: () => store.ehcpRecords,
    findById: (id: string) => store.ehcpRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.ehcpRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<EhcpRecord>): EhcpRecord => {
      const record = { ...data, id: generateId("ehcp"), created_at: new Date().toISOString() } as EhcpRecord;
      store.ehcpRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<EhcpRecord>): EhcpRecord | null => {
      const idx = store.ehcpRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ehcpRecords[idx] = { ...store.ehcpRecords[idx], ...data };
      return store.ehcpRecords[idx];
    },
  },

  emergencyChildContacts: {
    findAll: () => store.emergencyChildContacts,
    findById: (id: string) => store.emergencyChildContacts.find((r) => r.id === id),
    findByChild: (childId: string) => store.emergencyChildContacts.filter((r) => r.child_id === childId),
    create: (data: Partial<EmergencyChildContact>): EmergencyChildContact => {
      const record = { ...data, id: generateId("ecc"), created_at: new Date().toISOString() } as EmergencyChildContact;
      store.emergencyChildContacts.push(record);
      return record;
    },
    update: (id: string, data: Partial<EmergencyChildContact>): EmergencyChildContact | null => {
      const idx = store.emergencyChildContacts.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.emergencyChildContacts[idx] = { ...store.emergencyChildContacts[idx], ...data };
      return store.emergencyChildContacts[idx];
    },
  },

  evacuationPlans: {
    findAll: () => store.evacuationPlans,
    findById: (id: string) => store.evacuationPlans.find((r) => r.id === id),
    create: (data: Partial<EvacuationPlan>): EvacuationPlan => {
      const record = { ...data, id: generateId("evac"), created_at: new Date().toISOString() } as EvacuationPlan;
      store.evacuationPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<EvacuationPlan>): EvacuationPlan | null => {
      const idx = store.evacuationPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.evacuationPlans[idx] = { ...store.evacuationPlans[idx], ...data };
      return store.evacuationPlans[idx];
    },
  },

  emergencyMedicationProtocols: {
    findAll: () => store.emergencyMedicationProtocols,
    findById: (id: string) => store.emergencyMedicationProtocols.find((r) => r.id === id),
    findByChild: (childId: string) => store.emergencyMedicationProtocols.filter((r) => r.child_id === childId),
    create: (data: Partial<EmergencyMedicationProtocol>): EmergencyMedicationProtocol => {
      const record = { ...data, id: generateId("emp"), created_at: new Date().toISOString() } as EmergencyMedicationProtocol;
      store.emergencyMedicationProtocols.push(record);
      return record;
    },
    update: (id: string, data: Partial<EmergencyMedicationProtocol>): EmergencyMedicationProtocol | null => {
      const idx = store.emergencyMedicationProtocols.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.emergencyMedicationProtocols[idx] = { ...store.emergencyMedicationProtocols[idx], ...data };
      return store.emergencyMedicationProtocols[idx];
    },
  },

  emergencyReferrals: {
    findAll: () => store.emergencyReferrals,
    findById: (id: string) => store.emergencyReferrals.find((r) => r.id === id),
    create: (data: Partial<EmergencyReferral>): EmergencyReferral => {
      const record = { ...data, id: generateId("emr"), created_at: new Date().toISOString() } as EmergencyReferral;
      store.emergencyReferrals.push(record);
      return record;
    },
    update: (id: string, data: Partial<EmergencyReferral>): EmergencyReferral | null => {
      const idx = store.emergencyReferrals.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.emergencyReferrals[idx] = { ...store.emergencyReferrals[idx], ...data };
      return store.emergencyReferrals[idx];
    },
  },

  emergencyPlans: {
    findAll: () => store.emergencyPlans,
    findById: (id: string) => store.emergencyPlans.find((r) => r.id === id),
    create: (data: Partial<EmergencyPlan>): EmergencyPlan => {
      const record = { ...data, id: generateId("epl"), created_at: new Date().toISOString() } as EmergencyPlan;
      store.emergencyPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<EmergencyPlan>): EmergencyPlan | null => {
      const idx = store.emergencyPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.emergencyPlans[idx] = { ...store.emergencyPlans[idx], ...data };
      return store.emergencyPlans[idx];
    },
  },

  protocolDrills: {
    findAll: () => store.protocolDrills,
    findById: (id: string) => store.protocolDrills.find((r) => r.id === id),
    create: (data: Partial<ProtocolDrill>): ProtocolDrill => {
      const record = { ...data, id: generateId("pd"), created_at: new Date().toISOString() } as ProtocolDrill;
      store.protocolDrills.push(record);
      return record;
    },
    update: (id: string, data: Partial<ProtocolDrill>): ProtocolDrill | null => {
      const idx = store.protocolDrills.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.protocolDrills[idx] = { ...store.protocolDrills[idx], ...data };
      return store.protocolDrills[idx];
    },
  },

  emotionalVocabRecords: {
    findAll: () => store.emotionalVocabRecords,
    findById: (id: string) => store.emotionalVocabRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.emotionalVocabRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<EmotionalVocabRecord>): EmotionalVocabRecord => {
      const record = { ...data, id: generateId("evc"), created_at: new Date().toISOString() } as EmotionalVocabRecord;
      store.emotionalVocabRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<EmotionalVocabRecord>): EmotionalVocabRecord | null => {
      const idx = store.emotionalVocabRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.emotionalVocabRecords[idx] = { ...store.emotionalVocabRecords[idx], ...data };
      return store.emotionalVocabRecords[idx];
    },
  },

  environmentalRisks: {
    findAll: () => store.environmentalRisks,
    findById: (id: string) => store.environmentalRisks.find((r) => r.id === id),
    create: (data: Partial<EnvironmentalRisk>): EnvironmentalRisk => {
      const record = { ...data, id: generateId("envr"), created_at: new Date().toISOString() } as EnvironmentalRisk;
      store.environmentalRisks.push(record);
      return record;
    },
    update: (id: string, data: Partial<EnvironmentalRisk>): EnvironmentalRisk | null => {
      const idx = store.environmentalRisks.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.environmentalRisks[idx] = { ...store.environmentalRisks[idx], ...data };
      return store.environmentalRisks[idx];
    },
  },

  exploitationScreenings: {
    findAll: () => store.exploitationScreenings,
    findById: (id: string) => store.exploitationScreenings.find((r) => r.id === id),
    findByChild: (childId: string) => store.exploitationScreenings.filter((r) => r.child_id === childId),
    create: (data: Partial<ExploitationScreening>): ExploitationScreening => {
      const record = { ...data, id: generateId("exs"), created_at: new Date().toISOString() } as ExploitationScreening;
      store.exploitationScreenings.push(record);
      return record;
    },
    update: (id: string, data: Partial<ExploitationScreening>): ExploitationScreening | null => {
      const idx = store.exploitationScreenings.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.exploitationScreenings[idx] = { ...store.exploitationScreenings[idx], ...data };
      return store.exploitationScreenings[idx];
    },
  },

  externalVisitors: {
    findAll: () => store.externalVisitors,
    findById: (id: string) => store.externalVisitors.find((r) => r.id === id),
    create: (data: Partial<ExternalVisitor>): ExternalVisitor => {
      const record = { ...data, id: generateId("vis"), created_at: new Date().toISOString() } as ExternalVisitor;
      store.externalVisitors.push(record);
      return record;
    },
    update: (id: string, data: Partial<ExternalVisitor>): ExternalVisitor | null => {
      const idx = store.externalVisitors.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.externalVisitors[idx] = { ...store.externalVisitors[idx], ...data };
      return store.externalVisitors[idx];
    },
  },

  familyTimeSessions: {
    findAll: () => store.familyTimeSessions,
    findById: (id: string) => store.familyTimeSessions.find((r) => r.id === id),
    findByChild: (childId: string) => store.familyTimeSessions.filter((r) => r.child_id === childId),
    create: (data: Partial<FamilyTimeSession>): FamilyTimeSession => {
      const record = { ...data, id: generateId("fts"), created_at: new Date().toISOString() } as FamilyTimeSession;
      store.familyTimeSessions.push(record);
      return record;
    },
    update: (id: string, data: Partial<FamilyTimeSession>): FamilyTimeSession | null => {
      const idx = store.familyTimeSessions.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.familyTimeSessions[idx] = { ...store.familyTimeSessions[idx], ...data };
      return store.familyTimeSessions[idx];
    },
  },

  genogramEntries: {
    findAll: () => store.genogramEntries,
    findById: (id: string) => store.genogramEntries.find((r) => r.id === id),
    findByChild: (childId: string) => store.genogramEntries.filter((r) => r.child_id === childId),
    create: (data: Partial<GenogramEntry>): GenogramEntry => {
      const record = { ...data, id: generateId("geno"), created_at: new Date().toISOString() } as GenogramEntry;
      store.genogramEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<GenogramEntry>): GenogramEntry | null => {
      const idx = store.genogramEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.genogramEntries[idx] = { ...store.genogramEntries[idx], ...data };
      return store.genogramEntries[idx];
    },
  },

  fireRiskItems: {
    findAll: () => store.fireRiskItems,
    findById: (id: string) => store.fireRiskItems.find((r) => r.id === id),
    create: (data: Partial<FireRiskItem>): FireRiskItem => {
      const record = { ...data, id: generateId("fri"), created_at: new Date().toISOString() } as FireRiskItem;
      store.fireRiskItems.push(record);
      return record;
    },
    update: (id: string, data: Partial<FireRiskItem>): FireRiskItem | null => {
      const idx = store.fireRiskItems.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.fireRiskItems[idx] = { ...store.fireRiskItems[idx], ...data };
      return store.fireRiskItems[idx];
    },
  },

  fireEquipmentChecks: {
    findAll: () => store.fireEquipmentChecks,
    findById: (id: string) => store.fireEquipmentChecks.find((r) => r.id === id),
    create: (data: Partial<FireEquipmentCheck>): FireEquipmentCheck => {
      const record = { ...data, id: generateId("fec"), created_at: new Date().toISOString() } as FireEquipmentCheck;
      store.fireEquipmentChecks.push(record);
      return record;
    },
    update: (id: string, data: Partial<FireEquipmentCheck>): FireEquipmentCheck | null => {
      const idx = store.fireEquipmentChecks.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.fireEquipmentChecks[idx] = { ...store.fireEquipmentChecks[idx], ...data };
      return store.fireEquipmentChecks[idx];
    },
  },

  firstAiderRecords: {
    findAll: () => store.firstAiderRecords,
    findById: (id: string) => store.firstAiderRecords.find((r) => r.id === id),
    create: (data: Partial<FirstAiderRecord>): FirstAiderRecord => {
      const record = { ...data, id: generateId("far"), created_at: new Date().toISOString() } as FirstAiderRecord;
      store.firstAiderRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<FirstAiderRecord>): FirstAiderRecord | null => {
      const idx = store.firstAiderRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.firstAiderRecords[idx] = { ...store.firstAiderRecords[idx], ...data };
      return store.firstAiderRecords[idx];
    },
  },

  foodBudgetWeekRecords: {
    findAll: () => store.foodBudgetWeekRecords,
    findById: (id: string) => store.foodBudgetWeekRecords.find((r) => r.id === id),
    create: (data: Partial<FoodBudgetWeekRecord>): FoodBudgetWeekRecord => {
      const record = { ...data, id: generateId("fbw"), created_at: new Date().toISOString() } as FoodBudgetWeekRecord;
      store.foodBudgetWeekRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<FoodBudgetWeekRecord>): FoodBudgetWeekRecord | null => {
      const idx = store.foodBudgetWeekRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.foodBudgetWeekRecords[idx] = { ...store.foodBudgetWeekRecords[idx], ...data };
      return store.foodBudgetWeekRecords[idx];
    },
  },

  foodHygieneRecords: {
    findAll: () => store.foodHygieneRecords,
    findById: (id: string) => store.foodHygieneRecords.find((r) => r.id === id),
    create: (data: Partial<FoodHygieneRecord>): FoodHygieneRecord => {
      const record = { ...data, id: generateId("fhr"), created_at: new Date().toISOString() } as FoodHygieneRecord;
      store.foodHygieneRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<FoodHygieneRecord>): FoodHygieneRecord | null => {
      const idx = store.foodHygieneRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.foodHygieneRecords[idx] = { ...store.foodHygieneRecords[idx], ...data };
      return store.foodHygieneRecords[idx];
    },
  },

  friendshipMaps: {
    findAll: () => store.friendshipMaps,
    findById: (id: string) => store.friendshipMaps.find((r) => r.id === id),
    findByChild: (childId: string) => store.friendshipMaps.filter((r) => r.child_id === childId),
    create: (data: Partial<FriendshipMap>): FriendshipMap => {
      const record = { ...data, id: generateId("fm"), created_at: new Date().toISOString() } as FriendshipMap;
      store.friendshipMaps.push(record);
      return record;
    },
    update: (id: string, data: Partial<FriendshipMap>): FriendshipMap | null => {
      const idx = store.friendshipMaps.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.friendshipMaps[idx] = { ...store.friendshipMaps[idx], ...data };
      return store.friendshipMaps[idx];
    },
  },

  funeralRecords: {
    findAll: () => store.funeralRecords,
    findById: (id: string) => store.funeralRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.funeralRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<FuneralRecord>): FuneralRecord => {
      const record = { ...data, id: generateId("fun"), created_at: new Date().toISOString() } as FuneralRecord;
      store.funeralRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<FuneralRecord>): FuneralRecord | null => {
      const idx = store.funeralRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.funeralRecords[idx] = { ...store.funeralRecords[idx], ...data };
      return store.funeralRecords[idx];
    },
  },

  gardenPlotRecords: {
    findAll: () => store.gardenPlotRecords,
    findById: (id: string) => store.gardenPlotRecords.find((r) => r.id === id),
    create: (data: Partial<GardenPlotRecord>): GardenPlotRecord => {
      const record = { ...data, id: generateId("gpr"), created_at: new Date().toISOString() } as GardenPlotRecord;
      store.gardenPlotRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<GardenPlotRecord>): GardenPlotRecord | null => {
      const idx = store.gardenPlotRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.gardenPlotRecords[idx] = { ...store.gardenPlotRecords[idx], ...data };
      return store.gardenPlotRecords[idx];
    },
  },

  safetyCheckRecords: {
    findAll: () => store.safetyCheckRecords,
    findById: (id: string) => store.safetyCheckRecords.find((r) => r.id === id),
    create: (data: Partial<SafetyCheckRecord>): SafetyCheckRecord => {
      const record = { ...data, id: generateId("sck"), created_at: new Date().toISOString() } as SafetyCheckRecord;
      store.safetyCheckRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SafetyCheckRecord>): SafetyCheckRecord | null => {
      const idx = store.safetyCheckRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.safetyCheckRecords[idx] = { ...store.safetyCheckRecords[idx], ...data };
      return store.safetyCheckRecords[idx];
    },
  },

  giftRecords: {
    findAll: () => store.giftRecords,
    findById: (id: string) => store.giftRecords.find((r) => r.id === id),
    create: (data: Partial<GiftRecord>): GiftRecord => {
      const record = { ...data, id: generateId("gift"), created_at: new Date().toISOString() } as GiftRecord;
      store.giftRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<GiftRecord>): GiftRecord | null => {
      const idx = store.giftRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.giftRecords[idx] = { ...store.giftRecords[idx], ...data };
      return store.giftRecords[idx];
    },
  },

  governanceMeetings: {
    findAll: () => store.governanceMeetings,
    findById: (id: string) => store.governanceMeetings.find((r) => r.id === id),
    create: (data: Partial<GovernanceMeeting>): GovernanceMeeting => {
      const record = { ...data, id: generateId("gov"), created_at: new Date().toISOString() } as GovernanceMeeting;
      store.governanceMeetings.push(record);
      return record;
    },
    update: (id: string, data: Partial<GovernanceMeeting>): GovernanceMeeting | null => {
      const idx = store.governanceMeetings.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.governanceMeetings[idx] = { ...store.governanceMeetings[idx], ...data };
      return store.governanceMeetings[idx];
    },
  },

  grabBags: {
    findAll: () => store.grabBags,
    findById: (id: string) => store.grabBags.find((r) => r.id === id),
    findByChild: (childId: string) => store.grabBags.filter((r) => r.child_id === childId),
    create: (data: Partial<GrabBag>): GrabBag => {
      const record = { ...data, id: generateId("grab"), created_at: new Date().toISOString() } as GrabBag;
      store.grabBags.push(record);
      return record;
    },
    update: (id: string, data: Partial<GrabBag>): GrabBag | null => {
      const idx = store.grabBags.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.grabBags[idx] = { ...store.grabBags[idx], ...data };
      return store.grabBags[idx];
    },
  },

  griefRecords: {
    findAll: () => store.griefRecords,
    findById: (id: string) => store.griefRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.griefRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<GriefRecord>): GriefRecord => {
      const record = { ...data, id: generateId("grief"), created_at: new Date().toISOString() } as GriefRecord;
      store.griefRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<GriefRecord>): GriefRecord | null => {
      const idx = store.griefRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.griefRecords[idx] = { ...store.griefRecords[idx], ...data };
      return store.griefRecords[idx];
    },
  },

  hairAppointments: {
    findAll: () => store.hairAppointments,
    findById: (id: string) => store.hairAppointments.find((r) => r.id === id),
    findByChild: (childId: string) => store.hairAppointments.filter((r) => r.child_id === childId),
    create: (data: Partial<HairAppointment>): HairAppointment => {
      const record = { ...data, id: generateId("hair"), created_at: new Date().toISOString() } as HairAppointment;
      store.hairAppointments.push(record);
      return record;
    },
    update: (id: string, data: Partial<HairAppointment>): HairAppointment | null => {
      const idx = store.hairAppointments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.hairAppointments[idx] = { ...store.hairAppointments[idx], ...data };
      return store.hairAppointments[idx];
    },
  },

  handoverAudits: {
    findAll: () => store.handoverAudits,
    findById: (id: string) => store.handoverAudits.find((r) => r.id === id),
    create: (data: Partial<HandoverAudit>): HandoverAudit => {
      const record = { ...data, id: generateId("haud"), created_at: new Date().toISOString() } as HandoverAudit;
      store.handoverAudits.push(record);
      return record;
    },
    update: (id: string, data: Partial<HandoverAudit>): HandoverAudit | null => {
      const idx = store.handoverAudits.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.handoverAudits[idx] = { ...store.handoverAudits[idx], ...data };
      return store.handoverAudits[idx];
    },
  },

  hateIncidents: {
    findAll: () => store.hateIncidents,
    findById: (id: string) => store.hateIncidents.find((r) => r.id === id),
    create: (data: Partial<HateIncident>): HateIncident => {
      const record = { ...data, id: generateId("hate"), created_at: new Date().toISOString() } as HateIncident;
      store.hateIncidents.push(record);
      return record;
    },
    update: (id: string, data: Partial<HateIncident>): HateIncident | null => {
      const idx = store.hateIncidents.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.hateIncidents[idx] = { ...store.hateIncidents[idx], ...data };
      return store.hateIncidents[idx];
    },
  },

  healthAssessments: {
    findAll: () => store.healthAssessments,
    findById: (id: string) => store.healthAssessments.find((r) => r.id === id),
    findByChild: (childId: string) => store.healthAssessments.filter((r) => r.child_id === childId),
    create: (data: Partial<HealthAssessment>): HealthAssessment => {
      const record = { ...data, id: generateId("hlth"), created_at: new Date().toISOString() } as HealthAssessment;
      store.healthAssessments.push(record);
      return record;
    },
    update: (id: string, data: Partial<HealthAssessment>): HealthAssessment | null => {
      const idx = store.healthAssessments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.healthAssessments[idx] = { ...store.healthAssessments[idx], ...data };
      return store.healthAssessments[idx];
    },
  },

  healthMonitoring: {
    findAll: () => store.healthMonitoring,
    findById: (id: string) => store.healthMonitoring.find((r) => r.id === id),
    findByChild: (childId: string) => store.healthMonitoring.filter((r) => r.child_id === childId),
    create: (data: Partial<HealthMonitoringEntry>): HealthMonitoringEntry => {
      const record = { ...data, id: generateId("hmon"), created_at: new Date().toISOString() } as HealthMonitoringEntry;
      store.healthMonitoring.push(record);
      return record;
    },
    update: (id: string, data: Partial<HealthMonitoringEntry>): HealthMonitoringEntry | null => {
      const idx = store.healthMonitoring.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.healthMonitoring[idx] = { ...store.healthMonitoring[idx], ...data };
      return store.healthMonitoring[idx];
    },
  },

  healthPassports: {
    findAll: () => store.healthPassports,
    findById: (id: string) => store.healthPassports.find((r) => r.id === id),
    findByChild: (childId: string) => store.healthPassports.filter((r) => r.child_id === childId),
    create: (data: Partial<HealthPassport>): HealthPassport => {
      const record = { ...data, id: generateId("hpas"), created_at: new Date().toISOString() } as HealthPassport;
      store.healthPassports.push(record);
      return record;
    },
    update: (id: string, data: Partial<HealthPassport>): HealthPassport | null => {
      const idx = store.healthPassports.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.healthPassports[idx] = { ...store.healthPassports[idx], ...data };
      return store.healthPassports[idx];
    },
  },

  healthcarePlans: {
    findAll: () => store.healthcarePlans,
    findById: (id: string) => store.healthcarePlans.find((r) => r.id === id),
    findByChild: (childId: string) => store.healthcarePlans.filter((r) => r.child_id === childId),
    create: (data: Partial<HealthcarePlan>): HealthcarePlan => {
      const record = { ...data, id: generateId("hcpl"), created_at: new Date().toISOString() } as HealthcarePlan;
      store.healthcarePlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<HealthcarePlan>): HealthcarePlan | null => {
      const idx = store.healthcarePlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.healthcarePlans[idx] = { ...store.healthcarePlans[idx], ...data };
      return store.healthcarePlans[idx];
    },
  },

  tripPlans: {
    findAll: () => store.tripPlans,
    findById: (id: string) => store.tripPlans.find((r) => r.id === id),
    create: (data: Partial<TripPlan>): TripPlan => {
      const record = { ...data, id: generateId("trip"), created_at: new Date().toISOString() } as TripPlan;
      store.tripPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<TripPlan>): TripPlan | null => {
      const idx = store.tripPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.tripPlans[idx] = { ...store.tripPlans[idx], ...data };
      return store.tripPlans[idx];
    },
  },

  improvementObjectives: {
    findAll: () => store.improvementObjectives,
    findById: (id: string) => store.improvementObjectives.find((r) => r.id === id),
    create: (data: Partial<ImprovementObjective>): ImprovementObjective => {
      const record = { ...data, id: generateId("himp"), created_at: new Date().toISOString() } as ImprovementObjective;
      store.improvementObjectives.push(record);
      return record;
    },
    update: (id: string, data: Partial<ImprovementObjective>): ImprovementObjective | null => {
      const idx = store.improvementObjectives.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.improvementObjectives[idx] = { ...store.improvementObjectives[idx], ...data };
      return store.improvementObjectives[idx];
    },
  },

  petRecords: {
    findAll: () => store.petRecords,
    findById: (id: string) => store.petRecords.find((r) => r.id === id),
    create: (data: Partial<PetRecord>): PetRecord => {
      const record = { ...data, id: generateId("pet_"), created_at: new Date().toISOString() } as PetRecord;
      store.petRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<PetRecord>): PetRecord | null => {
      const idx = store.petRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.petRecords[idx] = { ...store.petRecords[idx], ...data };
      return store.petRecords[idx];
    },
  },

  homeworkSessions: {
    findAll: () => store.homeworkSessions,
    findById: (id: string) => store.homeworkSessions.find((r) => r.id === id),
    findByChild: (childId: string) => store.homeworkSessions.filter((r) => r.child_id === childId),
    create: (data: Partial<HomeworkSession>): HomeworkSession => {
      const record = { ...data, id: generateId("hw__"), created_at: new Date().toISOString() } as HomeworkSession;
      store.homeworkSessions.push(record);
      return record;
    },
    update: (id: string, data: Partial<HomeworkSession>): HomeworkSession | null => {
      const idx = store.homeworkSessions.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.homeworkSessions[idx] = { ...store.homeworkSessions[idx], ...data };
      return store.homeworkSessions[idx];
    },
  },

  houseRules: {
    findAll: () => store.houseRules,
    findById: (id: string) => store.houseRules.find((r) => r.id === id),
    create: (data: Partial<HouseRule>): HouseRule => {
      const record = { ...data, id: generateId("hrul"), created_at: new Date().toISOString() } as HouseRule;
      store.houseRules.push(record);
      return record;
    },
    update: (id: string, data: Partial<HouseRule>): HouseRule | null => {
      const idx = store.houseRules.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.houseRules[idx] = { ...store.houseRules[idx], ...data };
      return store.houseRules[idx];
    },
  },

  householdTasks: {
    findAll: () => store.householdTasks,
    findById: (id: string) => store.householdTasks.find((r) => r.id === id),
    findByChild: (childId: string) => store.householdTasks.filter((r) => r.child_id === childId),
    create: (data: Partial<HouseholdTask>): HouseholdTask => {
      const record = { ...data, id: generateId("htsk"), created_at: new Date().toISOString() } as HouseholdTask;
      store.householdTasks.push(record);
      return record;
    },
    update: (id: string, data: Partial<HouseholdTask>): HouseholdTask | null => {
      const idx = store.householdTasks.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.householdTasks[idx] = { ...store.householdTasks[idx], ...data };
      return store.householdTasks[idx];
    },
  },

  immunisationRecords: {
    findAll: () => store.immunisationRecords,
    findById: (id: string) => store.immunisationRecords.find((r) => r.id === id),
    findByChild: (childId: string) => store.immunisationRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<ImmunisationRecord>): ImmunisationRecord => {
      const record = { ...data, id: generateId("immu"), created_at: new Date().toISOString() } as ImmunisationRecord;
      store.immunisationRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ImmunisationRecord>): ImmunisationRecord | null => {
      const idx = store.immunisationRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.immunisationRecords[idx] = { ...store.immunisationRecords[idx], ...data };
      return store.immunisationRecords[idx];
    },
  },

  impactAssessments: {
    findAll: () => store.impactAssessments,
    findById: (id: string) => store.impactAssessments.find((r) => r.id === id),
    create: (data: Partial<ImpactAssessment>): ImpactAssessment => {
      const record = { ...data, id: generateId("ia__"), created_at: new Date().toISOString() } as ImpactAssessment;
      store.impactAssessments.push(record);
      return record;
    },
    update: (id: string, data: Partial<ImpactAssessment>): ImpactAssessment | null => {
      const idx = store.impactAssessments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.impactAssessments[idx] = { ...store.impactAssessments[idx], ...data };
      return store.impactAssessments[idx];
    },
  },

  incidentTrends: {
    findAll: () => store.incidentTrends,
    findById: (id: string) => store.incidentTrends.find((r) => r.id === id),
    create: (data: Partial<IncidentTrendRecord>): IncidentTrendRecord => {
      const record = { ...data, id: generateId("itrn"), created_at: new Date().toISOString() } as IncidentTrendRecord;
      store.incidentTrends.push(record);
      return record;
    },
    update: (id: string, data: Partial<IncidentTrendRecord>): IncidentTrendRecord | null => {
      const idx = store.incidentTrends.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.incidentTrends[idx] = { ...store.incidentTrends[idx], ...data };
      return store.incidentTrends[idx];
    },
  },

  clubRecords: {
    findAll: () => store.clubRecords,
    findByChild: (childId: string) => store.clubRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.clubRecords.find((r) => r.id === id),
    create: (data: Partial<ClubRecord>): ClubRecord => {
      const record = { ...data, id: generateId("club"), created_at: new Date().toISOString() } as ClubRecord;
      store.clubRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ClubRecord>): ClubRecord | null => {
      const idx = store.clubRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.clubRecords[idx] = { ...store.clubRecords[idx], ...data };
      return store.clubRecords[idx];
    },
  },

  agencyFeedback: {
    findAll: () => store.agencyFeedback,
    findById: (id: string) => store.agencyFeedback.find((r) => r.id === id),
    create: (data: Partial<AgencyFeedback>): AgencyFeedback => {
      const record = { ...data, id: generateId("afbk"), created_at: new Date().toISOString() } as AgencyFeedback;
      store.agencyFeedback.push(record);
      return record;
    },
    update: (id: string, data: Partial<AgencyFeedback>): AgencyFeedback | null => {
      const idx = store.agencyFeedback.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.agencyFeedback[idx] = { ...store.agencyFeedback[idx], ...data };
      return store.agencyFeedback[idx];
    },
  },

  bedroomProfiles: {
    findAll: () => store.bedroomProfiles,
    findByChild: (childId: string) => store.bedroomProfiles.filter((r) => r.child_id === childId),
    findById: (id: string) => store.bedroomProfiles.find((r) => r.id === id),
    create: (data: Partial<BedroomProfile>): BedroomProfile => {
      const record = { ...data, id: generateId("bdrm"), created_at: new Date().toISOString() } as BedroomProfile;
      store.bedroomProfiles.push(record);
      return record;
    },
    update: (id: string, data: Partial<BedroomProfile>): BedroomProfile | null => {
      const idx = store.bedroomProfiles.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.bedroomProfiles[idx] = { ...store.bedroomProfiles[idx], ...data };
      return store.bedroomProfiles[idx];
    },
  },

  bedtimeRoutines: {
    findAll: () => store.bedtimeRoutines,
    findByChild: (childId: string) => store.bedtimeRoutines.filter((r) => r.child_id === childId),
    findById: (id: string) => store.bedtimeRoutines.find((r) => r.id === id),
    create: (data: Partial<BedtimeRoutine>): BedtimeRoutine => {
      const record = { ...data, id: generateId("bdtm"), created_at: new Date().toISOString() } as BedtimeRoutine;
      store.bedtimeRoutines.push(record);
      return record;
    },
    update: (id: string, data: Partial<BedtimeRoutine>): BedtimeRoutine | null => {
      const idx = store.bedtimeRoutines.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.bedtimeRoutines[idx] = { ...store.bedtimeRoutines[idx], ...data };
      return store.bedtimeRoutines[idx];
    },
  },

  cardRecords: {
    findAll: () => store.cardRecords,
    findByChild: (childId: string) => store.cardRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.cardRecords.find((r) => r.id === id),
    create: (data: Partial<CardRecord>): CardRecord => {
      const record = { ...data, id: generateId("card"), created_at: new Date().toISOString() } as CardRecord;
      store.cardRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<CardRecord>): CardRecord | null => {
      const idx = store.cardRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.cardRecords[idx] = { ...store.cardRecords[idx], ...data };
      return store.cardRecords[idx];
    },
  },

  boardReports: {
    findAll: () => store.boardReports,
    findById: (id: string) => store.boardReports.find((r) => r.id === id),
    create: (data: Partial<BoardReport>): BoardReport => {
      const record = { ...data, id: generateId("brpt"), created_at: new Date().toISOString() } as BoardReport;
      store.boardReports.push(record);
      return record;
    },
    update: (id: string, data: Partial<BoardReport>): BoardReport | null => {
      const idx = store.boardReports.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.boardReports[idx] = { ...store.boardReports[idx], ...data };
      return store.boardReports[idx];
    },
  },

  asbestosRecords: {
    findAll: () => store.asbestosRecords,
    findById: (id: string) => store.asbestosRecords.find((r) => r.id === id),
    create: (data: Partial<AsbestosRecord>): AsbestosRecord => {
      const record = { ...data, id: generateId("asbr"), created_at: new Date().toISOString() } as AsbestosRecord;
      store.asbestosRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<AsbestosRecord>): AsbestosRecord | null => {
      const idx = store.asbestosRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.asbestosRecords[idx] = { ...store.asbestosRecords[idx], ...data };
      return store.asbestosRecords[idx];
    },
  },

  pestRecords: {
    findAll: () => store.pestRecords,
    findById: (id: string) => store.pestRecords.find((r) => r.id === id),
    create: (data: Partial<PestRecord>): PestRecord => {
      const record = { ...data, id: generateId("pest"), created_at: new Date().toISOString() } as PestRecord;
      store.pestRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<PestRecord>): PestRecord | null => {
      const idx = store.pestRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.pestRecords[idx] = { ...store.pestRecords[idx], ...data };
      return store.pestRecords[idx];
    },
  },

  windowChecks: {
    findAll: () => store.windowChecks,
    findById: (id: string) => store.windowChecks.find((r) => r.id === id),
    create: (data: Partial<WindowCheck>): WindowCheck => {
      const record = { ...data, id: generateId("winc"), created_at: new Date().toISOString() } as WindowCheck;
      store.windowChecks.push(record);
      return record;
    },
    update: (id: string, data: Partial<WindowCheck>): WindowCheck | null => {
      const idx = store.windowChecks.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.windowChecks[idx] = { ...store.windowChecks[idx], ...data };
      return store.windowChecks[idx];
    },
  },

  bcpScenarios: {
    findAll: () => store.bcpScenarios,
    findById: (id: string) => store.bcpScenarios.find((r) => r.id === id),
    create: (data: Partial<BcpScenarioPlan>): BcpScenarioPlan => {
      const record = { ...data, id: generateId("bcps"), created_at: new Date().toISOString() } as BcpScenarioPlan;
      store.bcpScenarios.push(record);
      return record;
    },
    update: (id: string, data: Partial<BcpScenarioPlan>): BcpScenarioPlan | null => {
      const idx = store.bcpScenarios.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.bcpScenarios[idx] = { ...store.bcpScenarios[idx], ...data };
      return store.bcpScenarios[idx];
    },
  },

  caseFileAudits: {
    findAll: () => store.caseFileAudits,
    findByChild: (childId: string) => store.caseFileAudits.filter((r) => r.child_id === childId),
    findById: (id: string) => store.caseFileAudits.find((r) => r.id === id),
    create: (data: Partial<CaseFileAudit>): CaseFileAudit => {
      const record = { ...data, id: generateId("cfau"), created_at: new Date().toISOString() } as CaseFileAudit;
      store.caseFileAudits.push(record);
      return record;
    },
    update: (id: string, data: Partial<CaseFileAudit>): CaseFileAudit | null => {
      const idx = store.caseFileAudits.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.caseFileAudits[idx] = { ...store.caseFileAudits[idx], ...data };
      return store.caseFileAudits[idx];
    },
  },

  moneyRecords: {
    findAll: () => store.moneyRecords,
    findByChild: (childId: string) => store.moneyRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.moneyRecords.find((r) => r.id === id),
    create: (data: Partial<MoneyRecord>): MoneyRecord => {
      const record = { ...data, id: generateId("mney"), created_at: new Date().toISOString() } as MoneyRecord;
      store.moneyRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<MoneyRecord>): MoneyRecord | null => {
      const idx = store.moneyRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.moneyRecords[idx] = { ...store.moneyRecords[idx], ...data };
      return store.moneyRecords[idx];
    },
  },

  orthoRecords: {
    findAll: () => store.orthoRecords,
    findByChild: (childId: string) => store.orthoRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.orthoRecords.find((r) => r.id === id),
    create: (data: Partial<OrthoRecord>): OrthoRecord => {
      const record = { ...data, id: generateId("orth"), created_at: new Date().toISOString() } as OrthoRecord;
      store.orthoRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<OrthoRecord>): OrthoRecord | null => {
      const idx = store.orthoRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.orthoRecords[idx] = { ...store.orthoRecords[idx], ...data };
      return store.orthoRecords[idx];
    },
  },

  participationEntries: {
    findAll: () => store.participationEntries,
    findById: (id: string) => store.participationEntries.find((r) => r.id === id),
    create: (data: Partial<ParticipationEntry>): ParticipationEntry => {
      const record = { ...data, id: generateId("part"), created_at: new Date().toISOString() } as ParticipationEntry;
      store.participationEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<ParticipationEntry>): ParticipationEntry | null => {
      const idx = store.participationEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.participationEntries[idx] = { ...store.participationEntries[idx], ...data };
      return store.participationEntries[idx];
    },
  },

  riteRecords: {
    findAll: () => store.riteRecords,
    findByChild: (childId: string) => store.riteRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.riteRecords.find((r) => r.id === id),
    create: (data: Partial<RiteRecord>): RiteRecord => {
      const record = { ...data, id: generateId("rite"), created_at: new Date().toISOString() } as RiteRecord;
      store.riteRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<RiteRecord>): RiteRecord | null => {
      const idx = store.riteRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.riteRecords[idx] = { ...store.riteRecords[idx], ...data };
      return store.riteRecords[idx];
    },
  },

  uniformRecords: {
    findAll: () => store.uniformRecords,
    findByChild: (childId: string) => store.uniformRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.uniformRecords.find((r) => r.id === id),
    create: (data: Partial<UniformRecord>): UniformRecord => {
      const record = { ...data, id: generateId("unif"), created_at: new Date().toISOString() } as UniformRecord;
      store.uniformRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<UniformRecord>): UniformRecord | null => {
      const idx = store.uniformRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.uniformRecords[idx] = { ...store.uniformRecords[idx], ...data };
      return store.uniformRecords[idx];
    },
  },

  saltRecords: {
    findAll: () => store.saltRecords,
    findByChild: (childId: string) => store.saltRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.saltRecords.find((r) => r.id === id),
    create: (data: Partial<SaltRecord>): SaltRecord => {
      const record = { ...data, id: generateId("salt"), created_at: new Date().toISOString() } as SaltRecord;
      store.saltRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SaltRecord>): SaltRecord | null => {
      const idx = store.saltRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.saltRecords[idx] = { ...store.saltRecords[idx], ...data };
      return store.saltRecords[idx];
    },
  },

  swimRecords: {
    findAll: () => store.swimRecords,
    findByChild: (childId: string) => store.swimRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.swimRecords.find((r) => r.id === id),
    create: (data: Partial<SwimRecord>): SwimRecord => {
      const record = { ...data, id: generateId("swim"), created_at: new Date().toISOString() } as SwimRecord;
      store.swimRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SwimRecord>): SwimRecord | null => {
      const idx = store.swimRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.swimRecords[idx] = { ...store.swimRecords[idx], ...data };
      return store.swimRecords[idx];
    },
  },

  volunteerRecords: {
    findAll: () => store.volunteerRecords,
    findByChild: (childId: string) => store.volunteerRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.volunteerRecords.find((r) => r.id === id),
    create: (data: Partial<VolunteerRecord>): VolunteerRecord => {
      const record = { ...data, id: generateId("volr"), created_at: new Date().toISOString() } as VolunteerRecord;
      store.volunteerRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<VolunteerRecord>): VolunteerRecord | null => {
      const idx = store.volunteerRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.volunteerRecords[idx] = { ...store.volunteerRecords[idx], ...data };
      return store.volunteerRecords[idx];
    },
  },

  workExpRecords: {
    findAll: () => store.workExpRecords,
    findByChild: (childId: string) => store.workExpRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.workExpRecords.find((r) => r.id === id),
    create: (data: Partial<WorkExpRecord>): WorkExpRecord => {
      const record = { ...data, id: generateId("wexp"), created_at: new Date().toISOString() } as WorkExpRecord;
      store.workExpRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<WorkExpRecord>): WorkExpRecord | null => {
      const idx = store.workExpRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.workExpRecords[idx] = { ...store.workExpRecords[idx], ...data };
      return store.workExpRecords[idx];
    },
  },

  childPledges: {
    findAll: () => store.childPledges,
    findByChild: (childId: string) => store.childPledges.filter((r) => r.child_id === childId),
    findById: (id: string) => store.childPledges.find((r) => r.id === id),
    create: (data: Partial<ChildPledge>): ChildPledge => {
      const record = { ...data, id: generateId("pldg"), created_at: new Date().toISOString() } as ChildPledge;
      store.childPledges.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChildPledge>): ChildPledge | null => {
      const idx = store.childPledges.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.childPledges[idx] = { ...store.childPledges[idx], ...data };
      return store.childPledges[idx];
    },
  },

  cleaningEntries: {
    findAll: () => store.cleaningEntries,
    findById: (id: string) => store.cleaningEntries.find((r) => r.id === id),
    create: (data: Partial<CleaningEntry>): CleaningEntry => {
      const record = { ...data, id: generateId("clnr"), created_at: new Date().toISOString() } as CleaningEntry;
      store.cleaningEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<CleaningEntry>): CleaningEntry | null => {
      const idx = store.cleaningEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.cleaningEntries[idx] = { ...store.cleaningEntries[idx], ...data };
      return store.cleaningEntries[idx];
    },
  },

  communityEngagements: {
    findAll: () => store.communityEngagements,
    findById: (id: string) => store.communityEngagements.find((r) => r.id === id),
    create: (data: Partial<CommunityEngagement>): CommunityEngagement => {
      const record = { ...data, id: generateId("cmel"), created_at: new Date().toISOString() } as CommunityEngagement;
      store.communityEngagements.push(record);
      return record;
    },
    update: (id: string, data: Partial<CommunityEngagement>): CommunityEngagement | null => {
      const idx = store.communityEngagements.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.communityEngagements[idx] = { ...store.communityEngagements[idx], ...data };
      return store.communityEngagements[idx];
    },
  },

  resolutionMeetings: {
    findAll: () => store.resolutionMeetings,
    findById: (id: string) => store.resolutionMeetings.find((r) => r.id === id),
    create: (data: Partial<ResolutionMeeting>): ResolutionMeeting => {
      const record = { ...data, id: generateId("cmrm"), created_at: new Date().toISOString() } as ResolutionMeeting;
      store.resolutionMeetings.push(record);
      return record;
    },
    update: (id: string, data: Partial<ResolutionMeeting>): ResolutionMeeting | null => {
      const idx = store.resolutionMeetings.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.resolutionMeetings[idx] = { ...store.resolutionMeetings[idx], ...data };
      return store.resolutionMeetings[idx];
    },
  },

  consequenceRecords: {
    findAll: () => store.consequenceRecords,
    findByChild: (childId: string) => store.consequenceRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.consequenceRecords.find((r) => r.id === id),
    create: (data: Partial<ConsequenceRecord>): ConsequenceRecord => {
      const record = { ...data, id: generateId("cnsq"), created_at: new Date().toISOString() } as ConsequenceRecord;
      store.consequenceRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ConsequenceRecord>): ConsequenceRecord | null => {
      const idx = store.consequenceRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.consequenceRecords[idx] = { ...store.consequenceRecords[idx], ...data };
      return store.consequenceRecords[idx];
    },
  },

  contactPlans: {
    findAll: () => store.contactPlans,
    findByChild: (childId: string) => store.contactPlans.filter((r) => r.child_id === childId),
    findById: (id: string) => store.contactPlans.find((r) => r.id === id),
    create: (data: Partial<ContactPlan>): ContactPlan => {
      const record = { ...data, id: generateId("ctpl"), created_at: new Date().toISOString() } as ContactPlan;
      store.contactPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<ContactPlan>): ContactPlan | null => {
      const idx = store.contactPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.contactPlans[idx] = { ...store.contactPlans[idx], ...data };
      return store.contactPlans[idx];
    },
  },

  dailyRoutinePlans: {
    findAll: () => store.dailyRoutinePlans,
    findByChild: (childId: string) => store.dailyRoutinePlans.filter((r) => r.child_id === childId),
    findById: (id: string) => store.dailyRoutinePlans.find((r) => r.id === id),
    create: (data: Partial<DailyRoutinePlan>): DailyRoutinePlan => {
      const record = { ...data, id: generateId("drtp"), created_at: new Date().toISOString() } as DailyRoutinePlan;
      store.dailyRoutinePlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<DailyRoutinePlan>): DailyRoutinePlan | null => {
      const idx = store.dailyRoutinePlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.dailyRoutinePlans[idx] = { ...store.dailyRoutinePlans[idx], ...data };
      return store.dailyRoutinePlans[idx];
    },
  },

  dietaryPlans: {
    findAll: () => store.dietaryPlans,
    findByChild: (childId: string) => store.dietaryPlans.filter((r) => r.child_id === childId),
    findById: (id: string) => store.dietaryPlans.find((r) => r.id === id),
    create: (data: Partial<DietaryPlan>): DietaryPlan => {
      const record = { ...data, id: generateId("diet"), created_at: new Date().toISOString() } as DietaryPlan;
      store.dietaryPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<DietaryPlan>): DietaryPlan | null => {
      const idx = store.dietaryPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.dietaryPlans[idx] = { ...store.dietaryPlans[idx], ...data };
      return store.dietaryPlans[idx];
    },
  },

  digitalPlans: {
    findAll: () => store.digitalPlans,
    findByChild: (childId: string) => store.digitalPlans.filter((r) => r.child_id === childId),
    findById: (id: string) => store.digitalPlans.find((r) => r.id === id),
    create: (data: Partial<DigitalPlan>): DigitalPlan => {
      const record = { ...data, id: generateId("dgwb"), created_at: new Date().toISOString() } as DigitalPlan;
      store.digitalPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<DigitalPlan>): DigitalPlan | null => {
      const idx = store.digitalPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.digitalPlans[idx] = { ...store.digitalPlans[idx], ...data };
      return store.digitalPlans[idx];
    },
  },

  disclosures: {
    findAll: () => store.disclosures,
    findByChild: (childId: string) => store.disclosures.filter((r) => r.child_id === childId),
    findById: (id: string) => store.disclosures.find((r) => r.id === id),
    create: (data: Partial<Disclosure>): Disclosure => {
      const record = { ...data, id: generateId("dscl"), created_at: new Date().toISOString() } as Disclosure;
      store.disclosures.push(record);
      return record;
    },
    update: (id: string, data: Partial<Disclosure>): Disclosure | null => {
      const idx = store.disclosures.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.disclosures[idx] = { ...store.disclosures[idx], ...data };
      return store.disclosures[idx];
    },
  },

  shiftChecklists: {
    findAll: () => store.shiftChecklists,
    findById: (id: string) => store.shiftChecklists.find((r) => r.id === id),
    create: (data: Partial<ShiftChecklist>): ShiftChecklist => {
      const record = { ...data, id: generateId("shck"), created_at: new Date().toISOString() } as ShiftChecklist;
      store.shiftChecklists.push(record);
      return record;
    },
    update: (id: string, data: Partial<ShiftChecklist>): ShiftChecklist | null => {
      const idx = store.shiftChecklists.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.shiftChecklists[idx] = { ...store.shiftChecklists[idx], ...data };
      return store.shiftChecklists[idx];
    },
  },

  escalations: {
    findAll: () => store.escalations,
    findById: (id: string) => store.escalations.find((r) => r.id === id),
    create: (data: Partial<Escalation>): Escalation => {
      const record = { ...data, id: generateId("escl"), created_at: new Date().toISOString() } as Escalation;
      store.escalations.push(record);
      return record;
    },
    update: (id: string, data: Partial<Escalation>): Escalation | null => {
      const idx = store.escalations.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.escalations[idx] = { ...store.escalations[idx], ...data };
      return store.escalations[idx];
    },
  },

  chosenFamilyRecords: {
    findAll: () => store.chosenFamilyRecords,
    findByChild: (childId: string) => store.chosenFamilyRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.chosenFamilyRecords.find((r) => r.id === id),
    create: (data: Partial<ChosenFamilyRecord>): ChosenFamilyRecord => {
      const record = { ...data, id: generateId("chfm"), created_at: new Date().toISOString() } as ChosenFamilyRecord;
      store.chosenFamilyRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChosenFamilyRecord>): ChosenFamilyRecord | null => {
      const idx = store.chosenFamilyRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.chosenFamilyRecords[idx] = { ...store.chosenFamilyRecords[idx], ...data };
      return store.chosenFamilyRecords[idx];
    },
  },

  familyRelationshipRecords: {
    findAll: () => store.familyRelationshipRecords,
    findByChild: (childId: string) => store.familyRelationshipRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.familyRelationshipRecords.find((r) => r.id === id),
    create: (data: Partial<FamilyRelationshipRecord>): FamilyRelationshipRecord => {
      const record = { ...data, id: generateId("fmrl"), created_at: new Date().toISOString() } as FamilyRelationshipRecord;
      store.familyRelationshipRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<FamilyRelationshipRecord>): FamilyRelationshipRecord | null => {
      const idx = store.familyRelationshipRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.familyRelationshipRecords[idx] = { ...store.familyRelationshipRecords[idx], ...data };
      return store.familyRelationshipRecords[idx];
    },
  },

  firstRelationshipRecords: {
    findAll: () => store.firstRelationshipRecords,
    findByChild: (childId: string) => store.firstRelationshipRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.firstRelationshipRecords.find((r) => r.id === id),
    create: (data: Partial<FirstRelationshipRecord>): FirstRelationshipRecord => {
      const record = { ...data, id: generateId("frrs"), created_at: new Date().toISOString() } as FirstRelationshipRecord;
      store.firstRelationshipRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<FirstRelationshipRecord>): FirstRelationshipRecord | null => {
      const idx = store.firstRelationshipRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.firstRelationshipRecords[idx] = { ...store.firstRelationshipRecords[idx], ...data };
      return store.firstRelationshipRecords[idx];
    },
  },

  dailyRiskBriefings: {
    findAll: () => store.dailyRiskBriefings,
    findById: (id: string) => store.dailyRiskBriefings.find((r) => r.id === id),
    create: (data: Partial<DailyRiskBriefing>): DailyRiskBriefing => {
      const record = { ...data, id: generateId("drbr"), created_at: new Date().toISOString() } as DailyRiskBriefing;
      store.dailyRiskBriefings.push(record);
      return record;
    },
    update: (id: string, data: Partial<DailyRiskBriefing>): DailyRiskBriefing | null => {
      const idx = store.dailyRiskBriefings.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.dailyRiskBriefings[idx] = { ...store.dailyRiskBriefings[idx], ...data };
      return store.dailyRiskBriefings[idx];
    },
  },

  equalityInitiatives: {
    findAll: () => store.equalityInitiatives,
    findById: (id: string) => store.equalityInitiatives.find((r) => r.id === id),
    create: (data: Partial<EqualityInitiative>): EqualityInitiative => {
      const record = { ...data, id: generateId("eqin"), created_at: new Date().toISOString() } as EqualityInitiative;
      store.equalityInitiatives.push(record);
      return record;
    },
    update: (id: string, data: Partial<EqualityInitiative>): EqualityInitiative | null => {
      const idx = store.equalityInitiatives.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.equalityInitiatives[idx] = { ...store.equalityInitiatives[idx], ...data };
      return store.equalityInitiatives[idx];
    },
  },

  equalityTraining: {
    findAll: () => store.equalityTraining,
    findById: (id: string) => store.equalityTraining.find((r) => r.id === id),
    create: (data: Partial<EqualityTrainingRecord>): EqualityTrainingRecord => {
      const record = { ...data, id: generateId("eqtr") } as EqualityTrainingRecord;
      store.equalityTraining.push(record);
      return record;
    },
    update: (id: string, data: Partial<EqualityTrainingRecord>): EqualityTrainingRecord | null => {
      const idx = store.equalityTraining.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.equalityTraining[idx] = { ...store.equalityTraining[idx], ...data };
      return store.equalityTraining[idx];
    },
  },

  independencePathways: {
    findAll: () => store.independencePathways,
    findByChild: (childId: string) => store.independencePathways.filter((r) => r.child_id === childId),
    findById: (id: string) => store.independencePathways.find((r) => r.id === id),
    create: (data: Partial<IndependencePathway>): IndependencePathway => {
      const record = { ...data, id: generateId("ipth"), created_at: new Date().toISOString() } as IndependencePathway;
      store.independencePathways.push(record);
      return record;
    },
    update: (id: string, data: Partial<IndependencePathway>): IndependencePathway | null => {
      const idx = store.independencePathways.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.independencePathways[idx] = { ...store.independencePathways[idx], ...data };
      return store.independencePathways[idx];
    },
  },

  independenceSkillsRecords: {
    findAll: () => store.independenceSkillsRecords,
    findByChild: (childId: string) => store.independenceSkillsRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.independenceSkillsRecords.find((r) => r.id === id),
    create: (data: Partial<IndependenceSkillsRecord>): IndependenceSkillsRecord => {
      const record = { ...data, id: generateId("iskl"), created_at: new Date().toISOString() } as IndependenceSkillsRecord;
      store.independenceSkillsRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<IndependenceSkillsRecord>): IndependenceSkillsRecord | null => {
      const idx = store.independenceSkillsRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.independenceSkillsRecords[idx] = { ...store.independenceSkillsRecords[idx], ...data };
      return store.independenceSkillsRecords[idx];
    },
  },

  independenceLivingAssessments: {
    findAll: () => store.independenceLivingAssessments,
    findByChild: (childId: string) => store.independenceLivingAssessments.filter((r) => r.child_id === childId),
    findById: (id: string) => store.independenceLivingAssessments.find((r) => r.id === id),
    create: (data: Partial<IndependenceLivingAssessment>): IndependenceLivingAssessment => {
      const record = { ...data, id: generateId("ilsa"), created_at: new Date().toISOString() } as IndependenceLivingAssessment;
      store.independenceLivingAssessments.push(record);
      return record;
    },
    update: (id: string, data: Partial<IndependenceLivingAssessment>): IndependenceLivingAssessment | null => {
      const idx = store.independenceLivingAssessments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.independenceLivingAssessments[idx] = { ...store.independenceLivingAssessments[idx], ...data };
      return store.independenceLivingAssessments[idx];
    },
  },

  independentTravelRecords: {
    findAll: () => store.independentTravelRecords,
    findByChild: (childId: string) => store.independentTravelRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.independentTravelRecords.find((r) => r.id === id),
    create: (data: Partial<IndependentTravelRecord>): IndependentTravelRecord => {
      const record = { ...data, id: generateId("ittr"), created_at: new Date().toISOString() } as IndependentTravelRecord;
      store.independentTravelRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<IndependentTravelRecord>): IndependentTravelRecord | null => {
      const idx = store.independentTravelRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.independentTravelRecords[idx] = { ...store.independentTravelRecords[idx], ...data };
      return store.independentTravelRecords[idx];
    },
  },

  visitorReports: {
    findAll: () => store.visitorReports,
    findById: (id: string) => store.visitorReports.find((r) => r.id === id),
    create: (data: Partial<VisitorReport>): VisitorReport => {
      const record = { ...data, id: generateId("vrpt"), created_at: new Date().toISOString() } as VisitorReport;
      store.visitorReports.push(record);
      return record;
    },
    update: (id: string, data: Partial<VisitorReport>): VisitorReport | null => {
      const idx = store.visitorReports.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.visitorReports[idx] = { ...store.visitorReports[idx], ...data };
      return store.visitorReports[idx];
    },
  },

  infectionRecords: {
    findAll: () => store.infectionRecords,
    findById: (id: string) => store.infectionRecords.find((r) => r.id === id),
    create: (data: Partial<InfectionRecord>): InfectionRecord => {
      const record = { ...data, id: generateId("infr"), created_at: new Date().toISOString() } as InfectionRecord;
      store.infectionRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<InfectionRecord>): InfectionRecord | null => {
      const idx = store.infectionRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.infectionRecords[idx] = { ...store.infectionRecords[idx], ...data };
      return store.infectionRecords[idx];
    },
  },

  readinessItems: {
    findAll: () => store.readinessItems,
    findById: (id: string) => store.readinessItems.find((r) => r.id === id),
    create: (data: Partial<ReadinessItem>): ReadinessItem => {
      const record = { ...data, id: generateId("rdyi"), created_at: new Date().toISOString() } as ReadinessItem;
      store.readinessItems.push(record);
      return record;
    },
    update: (id: string, data: Partial<ReadinessItem>): ReadinessItem | null => {
      const idx = store.readinessItems.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.readinessItems[idx] = { ...store.readinessItems[idx], ...data };
      return store.readinessItems[idx];
    },
  },

  insurancePolicies: {
    findAll: () => store.insurancePolicies,
    findById: (id: string) => store.insurancePolicies.find((r) => r.id === id),
    create: (data: Partial<InsurancePolicy>): InsurancePolicy => {
      const record = { ...data, id: generateId("insp"), created_at: new Date().toISOString() } as InsurancePolicy;
      store.insurancePolicies.push(record);
      return record;
    },
    update: (id: string, data: Partial<InsurancePolicy>): InsurancePolicy | null => {
      const idx = store.insurancePolicies.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.insurancePolicies[idx] = { ...store.insurancePolicies[idx], ...data };
      return store.insurancePolicies[idx];
    },
  },

  inventoryItems: {
    findAll: () => store.inventoryItems,
    findById: (id: string) => store.inventoryItems.find((r) => r.id === id),
    create: (data: Partial<InventoryItem>): InventoryItem => {
      const record = { ...data, id: generateId("invt"), created_at: new Date().toISOString() } as InventoryItem;
      store.inventoryItems.push(record);
      return record;
    },
    update: (id: string, data: Partial<InventoryItem>): InventoryItem | null => {
      const idx = store.inventoryItems.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.inventoryItems[idx] = { ...store.inventoryItems[idx], ...data };
      return store.inventoryItems[idx];
    },
  },

  iroCorrespondences: {
    findAll: () => store.iroCorrespondences,
    findByChild: (childId: string) => store.iroCorrespondences.filter((r) => r.child_id === childId),
    findById: (id: string) => store.iroCorrespondences.find((r) => r.id === id),
    create: (data: Partial<IroCorrespondence>): IroCorrespondence => {
      const record = { ...data, id: generateId("iroc"), created_at: new Date().toISOString() } as IroCorrespondence;
      store.iroCorrespondences.push(record);
      return record;
    },
    update: (id: string, data: Partial<IroCorrespondence>): IroCorrespondence | null => {
      const idx = store.iroCorrespondences.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.iroCorrespondences[idx] = { ...store.iroCorrespondences[idx], ...data };
      return store.iroCorrespondences[idx];
    },
  },

  /* ── batch 36 ─────────────────────────────────────────────────────────── */

  holidayRecords: {
    findAll: () => store.holidayRecords,
    findByChild: (childId: string) => store.holidayRecords.filter((r) => r.child_id === childId),
    findById: (id: string) => store.holidayRecords.find((r) => r.id === id),
    create: (data: Partial<HolidayRecord>): HolidayRecord => {
      const record = { ...data, id: generateId("holr"), created_at: new Date().toISOString() } as HolidayRecord;
      store.holidayRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<HolidayRecord>): HolidayRecord | null => {
      const idx = store.holidayRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.holidayRecords[idx] = { ...store.holidayRecords[idx], ...data };
      return store.holidayRecords[idx];
    },
  },

  complaintTrends: {
    findAll: () => store.complaintTrends,
    findById: (id: string) => store.complaintTrends.find((r) => r.id === id),
    create: (data: Partial<ComplaintTrend>): ComplaintTrend => {
      const record = { ...data, id: generateId("ctrd"), created_at: new Date().toISOString() } as ComplaintTrend;
      store.complaintTrends.push(record);
      return record;
    },
    update: (id: string, data: Partial<ComplaintTrend>): ComplaintTrend | null => {
      const idx = store.complaintTrends.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.complaintTrends[idx] = { ...store.complaintTrends[idx], ...data };
      return store.complaintTrends[idx];
    },
  },

  keyRecords: {
    findAll: () => store.keyRecords,
    findById: (id: string) => store.keyRecords.find((r) => r.id === id),
    create: (data: Partial<KeyRecord>): KeyRecord => {
      const record = { ...data, id: generateId("keyr"), created_at: new Date().toISOString() } as KeyRecord;
      store.keyRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<KeyRecord>): KeyRecord | null => {
      const idx = store.keyRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.keyRecords[idx] = { ...store.keyRecords[idx], ...data };
      return store.keyRecords[idx];
    },
  },

  kitchenHygieneChecks: {
    findAll: () => store.kitchenHygieneChecks,
    findById: (id: string) => store.kitchenHygieneChecks.find((r) => r.id === id),
    create: (data: Partial<KitchenHygieneCheck>): KitchenHygieneCheck => {
      const record = { ...data, id: generateId("kthg"), created_at: new Date().toISOString() } as KitchenHygieneCheck;
      store.kitchenHygieneChecks.push(record);
      return record;
    },
    update: (id: string, data: Partial<KitchenHygieneCheck>): KitchenHygieneCheck | null => {
      const idx = store.kitchenHygieneChecks.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.kitchenHygieneChecks[idx] = { ...store.kitchenHygieneChecks[idx], ...data };
      return store.kitchenHygieneChecks[idx];
    },
  },

  kpiEntries: {
    findAll: () => store.kpiEntries,
    findById: (id: string) => store.kpiEntries.find((r) => r.id === id),
    create: (data: Partial<KpiEntry>): KpiEntry => {
      const record = { ...data, id: generateId("kpie"), created_at: new Date().toISOString() } as KpiEntry;
      store.kpiEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<KpiEntry>): KpiEntry | null => {
      const idx = store.kpiEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.kpiEntries[idx] = { ...store.kpiEntries[idx], ...data };
      return store.kpiEntries[idx];
    },
  },

  lacReviewPreps: {
    findAll: () => store.lacReviewPreps,
    findByChild: (childId: string) => store.lacReviewPreps.filter((r) => r.child_id === childId),
    findById: (id: string) => store.lacReviewPreps.find((r) => r.id === id),
    create: (data: Partial<LacReviewPrep>): LacReviewPrep => {
      const record = { ...data, id: generateId("lrpr"), created_at: new Date().toISOString() } as LacReviewPrep;
      store.lacReviewPreps.push(record);
      return record;
    },
    update: (id: string, data: Partial<LacReviewPrep>): LacReviewPrep | null => {
      const idx = store.lacReviewPreps.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.lacReviewPreps[idx] = { ...store.lacReviewPreps[idx], ...data };
      return store.lacReviewPreps[idx];
    },
  },

  /* ── Batch 37 ──────────────────────────────────────────────────── */

  ladoReferrals: {
    findAll: (): LadoReferral[] => store.ladoReferrals,
    findById: (id: string): LadoReferral | undefined => store.ladoReferrals.find((r) => r.id === id),
    create: (data: Partial<LadoReferral>): LadoReferral => {
      const record = { ...data, id: generateId("lado"), created_at: new Date().toISOString() } as LadoReferral;
      store.ladoReferrals.push(record);
      return record;
    },
    update: (id: string, data: Partial<LadoReferral>): LadoReferral | null => {
      const idx = store.ladoReferrals.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ladoReferrals[idx] = { ...store.ladoReferrals[idx], ...data };
      return store.ladoReferrals[idx];
    },
  },

  communicationProfiles: {
    findAll: (): CommunicationProfile[] => store.communicationProfiles,
    findByChild: (childId: string): CommunicationProfile[] => store.communicationProfiles.filter((r) => r.child_id === childId),
    findById: (id: string): CommunicationProfile | undefined => store.communicationProfiles.find((r) => r.id === id),
    create: (data: Partial<CommunicationProfile>): CommunicationProfile => {
      const record = { ...data, id: generateId("cmpr"), created_at: new Date().toISOString() } as CommunicationProfile;
      store.communicationProfiles.push(record);
      return record;
    },
    update: (id: string, data: Partial<CommunicationProfile>): CommunicationProfile | null => {
      const idx = store.communicationProfiles.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.communicationProfiles[idx] = { ...store.communicationProfiles[idx], ...data };
      return store.communicationProfiles[idx];
    },
  },

  leavingCarePackages: {
    findAll: (): LeavingCarePackage[] => store.leavingCarePackages,
    findByChild: (childId: string): LeavingCarePackage[] => store.leavingCarePackages.filter((r) => r.child_id === childId),
    findById: (id: string): LeavingCarePackage | undefined => store.leavingCarePackages.find((r) => r.id === id),
    create: (data: Partial<LeavingCarePackage>): LeavingCarePackage => {
      const record = { ...data, id: generateId("lcfp"), created_at: new Date().toISOString() } as LeavingCarePackage;
      store.leavingCarePackages.push(record);
      return record;
    },
    update: (id: string, data: Partial<LeavingCarePackage>): LeavingCarePackage | null => {
      const idx = store.leavingCarePackages.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.leavingCarePackages[idx] = { ...store.leavingCarePackages[idx], ...data };
      return store.leavingCarePackages[idx];
    },
  },

  lessonsLearned: {
    findAll: (): LessonLearned[] => store.lessonsLearned,
    findById: (id: string): LessonLearned | undefined => store.lessonsLearned.find((r) => r.id === id),
    create: (data: Partial<LessonLearned>): LessonLearned => {
      const record = { ...data, id: generateId("llrn"), created_at: new Date().toISOString() } as LessonLearned;
      store.lessonsLearned.push(record);
      return record;
    },
    update: (id: string, data: Partial<LessonLearned>): LessonLearned | null => {
      const idx = store.lessonsLearned.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.lessonsLearned[idx] = { ...store.lessonsLearned[idx], ...data };
      return store.lessonsLearned[idx];
    },
  },

  lgbtqInclusionRecords: {
    findAll: (): LgbtqInclusionRecord[] => store.lgbtqInclusionRecords,
    findByChild: (childId: string): LgbtqInclusionRecord[] => store.lgbtqInclusionRecords.filter((r) => r.child_id === childId),
    findById: (id: string): LgbtqInclusionRecord | undefined => store.lgbtqInclusionRecords.find((r) => r.id === id),
    create: (data: Partial<LgbtqInclusionRecord>): LgbtqInclusionRecord => {
      const record = { ...data, id: generateId("lgir"), created_at: new Date().toISOString() } as LgbtqInclusionRecord;
      store.lgbtqInclusionRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<LgbtqInclusionRecord>): LgbtqInclusionRecord | null => {
      const idx = store.lgbtqInclusionRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.lgbtqInclusionRecords[idx] = { ...store.lgbtqInclusionRecords[idx], ...data };
      return store.lgbtqInclusionRecords[idx];
    },
  },

  lifeStoryEntries: {
    findAll: (): LifeStoryEntry[] => store.lifeStoryEntries,
    findByChild: (childId: string): LifeStoryEntry[] => store.lifeStoryEntries.filter((r) => r.child_id === childId),
    findById: (id: string): LifeStoryEntry | undefined => store.lifeStoryEntries.find((r) => r.id === id),
    create: (data: Partial<LifeStoryEntry>): LifeStoryEntry => {
      const record = { ...data, id: generateId("lstr"), created_at: new Date().toISOString() } as LifeStoryEntry;
      store.lifeStoryEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<LifeStoryEntry>): LifeStoryEntry | null => {
      const idx = store.lifeStoryEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.lifeStoryEntries[idx] = { ...store.lifeStoryEntries[idx], ...data };
      return store.lifeStoryEntries[idx];
    },
  },

  localityRisks: {
    findAll: (): LocalityRisk[] => store.localityRisks,
    findById: (id: string): LocalityRisk | undefined => store.localityRisks.find((r) => r.id === id),
    create: (data: Partial<LocalityRisk>): LocalityRisk => {
      const record = { ...data, id: generateId("lrsk"), created_at: new Date().toISOString() } as LocalityRisk;
      store.localityRisks.push(record);
      return record;
    },
    update: (id: string, data: Partial<LocalityRisk>): LocalityRisk | null => {
      const idx = store.localityRisks.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.localityRisks[idx] = { ...store.localityRisks[idx], ...data };
      return store.localityRisks[idx];
    },
  },

  loneWorkingRecords: {
    findAll: (): LoneWorkingRecord[] => store.loneWorkingRecords,
    findById: (id: string): LoneWorkingRecord | undefined => store.loneWorkingRecords.find((r) => r.id === id),
    create: (data: Partial<LoneWorkingRecord>): LoneWorkingRecord => {
      const record = { ...data, id: generateId("lwrk"), created_at: new Date().toISOString() } as LoneWorkingRecord;
      store.loneWorkingRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<LoneWorkingRecord>): LoneWorkingRecord | null => {
      const idx = store.loneWorkingRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.loneWorkingRecords[idx] = { ...store.loneWorkingRecords[idx], ...data };
      return store.loneWorkingRecords[idx];
    },
  },

  loneWorkingRiskAssessments: {
    findAll: (): LoneWorkingRiskAssessment[] => store.loneWorkingRiskAssessments,
    findById: (id: string): LoneWorkingRiskAssessment | undefined => store.loneWorkingRiskAssessments.find((r) => r.id === id),
    create: (data: Partial<LoneWorkingRiskAssessment>): LoneWorkingRiskAssessment => {
      const record = { ...data, id: generateId("lwra"), created_at: new Date().toISOString() } as LoneWorkingRiskAssessment;
      store.loneWorkingRiskAssessments.push(record);
      return record;
    },
    update: (id: string, data: Partial<LoneWorkingRiskAssessment>): LoneWorkingRiskAssessment | null => {
      const idx = store.loneWorkingRiskAssessments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.loneWorkingRiskAssessments[idx] = { ...store.loneWorkingRiskAssessments[idx], ...data };
      return store.loneWorkingRiskAssessments[idx];
    },
  },

  maintenanceScheduleItems: {
    findAll: (): MaintenanceScheduleItem[] => store.maintenanceScheduleItems,
    findById: (id: string): MaintenanceScheduleItem | undefined => store.maintenanceScheduleItems.find((r) => r.id === id),
    create: (data: Partial<MaintenanceScheduleItem>): MaintenanceScheduleItem => {
      const record = { ...data, id: generateId("msit"), created_at: new Date().toISOString() } as MaintenanceScheduleItem;
      store.maintenanceScheduleItems.push(record);
      return record;
    },
    update: (id: string, data: Partial<MaintenanceScheduleItem>): MaintenanceScheduleItem | null => {
      const idx = store.maintenanceScheduleItems.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.maintenanceScheduleItems[idx] = { ...store.maintenanceScheduleItems[idx], ...data };
      return store.maintenanceScheduleItems[idx];
    },
  },

  managementWalkrounds: {
    findAll: (): ManagementWalkround[] => store.managementWalkrounds,
    findById: (id: string): ManagementWalkround | undefined => store.managementWalkrounds.find((r) => r.id === id),
    create: (data: Partial<ManagementWalkround>): ManagementWalkround => {
      const record = { ...data, id: generateId("mwlk"), created_at: new Date().toISOString() } as ManagementWalkround;
      store.managementWalkrounds.push(record);
      return record;
    },
    update: (id: string, data: Partial<ManagementWalkround>): ManagementWalkround | null => {
      const idx = store.managementWalkrounds.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.managementWalkrounds[idx] = { ...store.managementWalkrounds[idx], ...data };
      return store.managementWalkrounds[idx];
    },
  },

  trainingMatrixRows: {
    findAll: (): TrainingMatrixRow[] => store.trainingMatrixRows,
    findById: (id: string): TrainingMatrixRow | undefined => store.trainingMatrixRows.find((r) => r.id === id),
    create: (data: Partial<TrainingMatrixRow>): TrainingMatrixRow => {
      const record = { ...data, id: generateId("tmrw"), created_at: new Date().toISOString() } as TrainingMatrixRow;
      store.trainingMatrixRows.push(record);
      return record;
    },
    update: (id: string, data: Partial<TrainingMatrixRow>): TrainingMatrixRow | null => {
      const idx = store.trainingMatrixRows.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.trainingMatrixRows[idx] = { ...store.trainingMatrixRows[idx], ...data };
      return store.trainingMatrixRows[idx];
    },
  },

  /* ── Batch 39 ──────────────────────────────────────────────────────── */

  marEntries: {
    findAll: (): MarEntry[] => store.marEntries,
    findByChild: (childId: string): MarEntry[] => store.marEntries.filter((r) => r.child_id === childId),
    findById: (id: string): MarEntry | undefined => store.marEntries.find((r) => r.id === id),
    create: (data: Partial<MarEntry>): MarEntry => {
      const record = { ...data, id: generateId("mare"), created_at: new Date().toISOString() } as MarEntry;
      store.marEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<MarEntry>): MarEntry | null => {
      const idx = store.marEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.marEntries[idx] = { ...store.marEntries[idx], ...data };
      return store.marEntries[idx];
    },
  },

  matchingReferrals: {
    findAll: (): MatchingReferral[] => store.matchingReferrals,
    findById: (id: string): MatchingReferral | undefined => store.matchingReferrals.find((r) => r.id === id),
    create: (data: Partial<MatchingReferral>): MatchingReferral => {
      const record = { ...data, id: generateId("mref"), created_at: new Date().toISOString() } as MatchingReferral;
      store.matchingReferrals.push(record);
      return record;
    },
    update: (id: string, data: Partial<MatchingReferral>): MatchingReferral | null => {
      const idx = store.matchingReferrals.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.matchingReferrals[idx] = { ...store.matchingReferrals[idx], ...data };
      return store.matchingReferrals[idx];
    },
  },

  mediaPublicityConsents: {
    findAll: (): MediaPublicityConsent[] => store.mediaPublicityConsents,
    findByChild: (childId: string): MediaPublicityConsent[] => store.mediaPublicityConsents.filter((r) => r.child_id === childId),
    findById: (id: string): MediaPublicityConsent | undefined => store.mediaPublicityConsents.find((r) => r.id === id),
    create: (data: Partial<MediaPublicityConsent>): MediaPublicityConsent => {
      const record = { ...data, id: generateId("mpcs"), created_at: new Date().toISOString() } as MediaPublicityConsent;
      store.mediaPublicityConsents.push(record);
      return record;
    },
    update: (id: string, data: Partial<MediaPublicityConsent>): MediaPublicityConsent | null => {
      const idx = store.mediaPublicityConsents.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.mediaPublicityConsents[idx] = { ...store.mediaPublicityConsents[idx], ...data };
      return store.mediaPublicityConsents[idx];
    },
  },

  medicationAuditRecords: {
    findAll: (): MedicationAuditRecord[] => store.medicationAuditRecords,
    findByChild: (childId: string): MedicationAuditRecord[] => store.medicationAuditRecords.filter((r) => r.child_id === childId),
    findById: (id: string): MedicationAuditRecord | undefined => store.medicationAuditRecords.find((r) => r.id === id),
    create: (data: Partial<MedicationAuditRecord>): MedicationAuditRecord => {
      const record = { ...data, id: generateId("maud"), created_at: new Date().toISOString() } as MedicationAuditRecord;
      store.medicationAuditRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<MedicationAuditRecord>): MedicationAuditRecord | null => {
      const idx = store.medicationAuditRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.medicationAuditRecords[idx] = { ...store.medicationAuditRecords[idx], ...data };
      return store.medicationAuditRecords[idx];
    },
  },

  medicationErrorInvestigations: {
    findAll: (): MedicationErrorInvestigation[] => store.medicationErrorInvestigations,
    findByChild: (childId: string): MedicationErrorInvestigation[] => store.medicationErrorInvestigations.filter((r) => r.child_id === childId),
    findById: (id: string): MedicationErrorInvestigation | undefined => store.medicationErrorInvestigations.find((r) => r.id === id),
    create: (data: Partial<MedicationErrorInvestigation>): MedicationErrorInvestigation => {
      const record = { ...data, id: generateId("meiv"), created_at: new Date().toISOString() } as MedicationErrorInvestigation;
      store.medicationErrorInvestigations.push(record);
      return record;
    },
    update: (id: string, data: Partial<MedicationErrorInvestigation>): MedicationErrorInvestigation | null => {
      const idx = store.medicationErrorInvestigations.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.medicationErrorInvestigations[idx] = { ...store.medicationErrorInvestigations[idx], ...data };
      return store.medicationErrorInvestigations[idx];
    },
  },

  medicationNearMisses: {
    findAll: (): MedicationNearMiss[] => store.medicationNearMisses,
    findByChild: (childId: string): MedicationNearMiss[] => store.medicationNearMisses.filter((r) => r.child_id === childId),
    findById: (id: string): MedicationNearMiss | undefined => store.medicationNearMisses.find((r) => r.id === id),
    create: (data: Partial<MedicationNearMiss>): MedicationNearMiss => {
      const record = { ...data, id: generateId("mnml"), created_at: new Date().toISOString() } as MedicationNearMiss;
      store.medicationNearMisses.push(record);
      return record;
    },
    update: (id: string, data: Partial<MedicationNearMiss>): MedicationNearMiss | null => {
      const idx = store.medicationNearMisses.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.medicationNearMisses[idx] = { ...store.medicationNearMisses[idx], ...data };
      return store.medicationNearMisses[idx];
    },
  },

  medicationStockChecks: {
    findAll: (): MedicationStockCheck[] => store.medicationStockChecks,
    findById: (id: string): MedicationStockCheck | undefined => store.medicationStockChecks.find((r) => r.id === id),
    create: (data: Partial<MedicationStockCheck>): MedicationStockCheck => {
      const record = { ...data, id: generateId("mstk"), created_at: new Date().toISOString() } as MedicationStockCheck;
      store.medicationStockChecks.push(record);
      return record;
    },
    update: (id: string, data: Partial<MedicationStockCheck>): MedicationStockCheck | null => {
      const idx = store.medicationStockChecks.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.medicationStockChecks[idx] = { ...store.medicationStockChecks[idx], ...data };
      return store.medicationStockChecks[idx];
    },
  },

  medicationStorageAudits: {
    findAll: (): MedicationStorageAudit[] => store.medicationStorageAudits,
    findById: (id: string): MedicationStorageAudit | undefined => store.medicationStorageAudits.find((r) => r.id === id),
    create: (data: Partial<MedicationStorageAudit>): MedicationStorageAudit => {
      const record = { ...data, id: generateId("msau"), created_at: new Date().toISOString() } as MedicationStorageAudit;
      store.medicationStorageAudits.push(record);
      return record;
    },
    update: (id: string, data: Partial<MedicationStorageAudit>): MedicationStorageAudit | null => {
      const idx = store.medicationStorageAudits.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.medicationStorageAudits[idx] = { ...store.medicationStorageAudits[idx], ...data };
      return store.medicationStorageAudits[idx];
    },
  },

  medTrainingRecords: {
    findAll: (): MedTrainingRecord[] => store.medTrainingRecords,
    findById: (id: string): MedTrainingRecord | undefined => store.medTrainingRecords.find((r) => r.id === id),
    create: (data: Partial<MedTrainingRecord>): MedTrainingRecord => {
      const record = { ...data, id: generateId("mtrc"), created_at: new Date().toISOString() } as MedTrainingRecord;
      store.medTrainingRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<MedTrainingRecord>): MedTrainingRecord | null => {
      const idx = store.medTrainingRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.medTrainingRecords[idx] = { ...store.medTrainingRecords[idx], ...data };
      return store.medTrainingRecords[idx];
    },
  },

  memorialOccasionRecords: {
    findAll: (): MemorialOccasionRecord[] => store.memorialOccasionRecords,
    findByChild: (childId: string): MemorialOccasionRecord[] => store.memorialOccasionRecords.filter((r) => r.affected_children.includes(childId)),
    findById: (id: string): MemorialOccasionRecord | undefined => store.memorialOccasionRecords.find((r) => r.id === id),
    create: (data: Partial<MemorialOccasionRecord>): MemorialOccasionRecord => {
      const record = { ...data, id: generateId("meml"), created_at: new Date().toISOString() } as MemorialOccasionRecord;
      store.memorialOccasionRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<MemorialOccasionRecord>): MemorialOccasionRecord | null => {
      const idx = store.memorialOccasionRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.memorialOccasionRecords[idx] = { ...store.memorialOccasionRecords[idx], ...data };
      return store.memorialOccasionRecords[idx];
    },
  },

  menstrualHealthPlans: {
    findAll: (): MenstrualHealthPlan[] => store.menstrualHealthPlans,
    findByChild: (childId: string): MenstrualHealthPlan[] => store.menstrualHealthPlans.filter((r) => r.child_id === childId),
    findById: (id: string): MenstrualHealthPlan | undefined => store.menstrualHealthPlans.find((r) => r.id === id),
    create: (data: Partial<MenstrualHealthPlan>): MenstrualHealthPlan => {
      const record = { ...data, id: generateId("mhpl"), created_at: new Date().toISOString() } as MenstrualHealthPlan;
      store.menstrualHealthPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<MenstrualHealthPlan>): MenstrualHealthPlan | null => {
      const idx = store.menstrualHealthPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.menstrualHealthPlans[idx] = { ...store.menstrualHealthPlans[idx], ...data };
      return store.menstrualHealthPlans[idx];
    },
  },

  mealPlans: {
    findAll: (): MealPlan[] => store.mealPlans,
    findById: (id: string): MealPlan | undefined => store.mealPlans.find((r) => r.id === id),
    create: (data: Partial<MealPlan>): MealPlan => {
      const record = { ...data, id: generateId("meal"), created_at: new Date().toISOString() } as MealPlan;
      store.mealPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<MealPlan>): MealPlan | null => {
      const idx = store.mealPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.mealPlans[idx] = { ...store.mealPlans[idx], ...data };
      return store.mealPlans[idx];
    },
  },

  returnInterviews: {
    findAll: (): ReturnInterview[] => store.returnInterviews,
    findByChild: (childId: string): ReturnInterview[] => store.returnInterviews.filter((r) => r.child_id === childId),
    findById: (id: string): ReturnInterview | undefined => store.returnInterviews.find((r) => r.id === id),
    create: (data: Partial<ReturnInterview>): ReturnInterview => {
      const record = { ...data, id: generateId("rtni"), created_at: new Date().toISOString() } as ReturnInterview;
      store.returnInterviews.push(record);
      return record;
    },
    update: (id: string, data: Partial<ReturnInterview>): ReturnInterview | null => {
      const idx = store.returnInterviews.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.returnInterviews[idx] = { ...store.returnInterviews[idx], ...data };
      return store.returnInterviews[idx];
    },
  },

  multiAgencyMeetings: {
    findAll: (): MultiAgencyMeeting[] => store.multiAgencyMeetings,
    findByChild: (childId: string): MultiAgencyMeeting[] => store.multiAgencyMeetings.filter((r) => r.child_id === childId),
    findById: (id: string): MultiAgencyMeeting | undefined => store.multiAgencyMeetings.find((r) => r.id === id),
    create: (data: Partial<MultiAgencyMeeting>): MultiAgencyMeeting => {
      const record = { ...data, id: generateId("mamg"), created_at: new Date().toISOString() } as MultiAgencyMeeting;
      store.multiAgencyMeetings.push(record);
      return record;
    },
    update: (id: string, data: Partial<MultiAgencyMeeting>): MultiAgencyMeeting | null => {
      const idx = store.multiAgencyMeetings.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.multiAgencyMeetings[idx] = { ...store.multiAgencyMeetings[idx], ...data };
      return store.multiAgencyMeetings[idx];
    },
  },

  multiDisciplinaryFormulations: {
    findAll: (): MultiDisciplinaryFormulation[] => store.multiDisciplinaryFormulations,
    findByChild: (childId: string): MultiDisciplinaryFormulation[] => store.multiDisciplinaryFormulations.filter((r) => r.child_id === childId),
    findById: (id: string): MultiDisciplinaryFormulation | undefined => store.multiDisciplinaryFormulations.find((r) => r.id === id),
    create: (data: Partial<MultiDisciplinaryFormulation>): MultiDisciplinaryFormulation => {
      const record = { ...data, id: generateId("mdfl"), created_at: new Date().toISOString() } as MultiDisciplinaryFormulation;
      store.multiDisciplinaryFormulations.push(record);
      return record;
    },
    update: (id: string, data: Partial<MultiDisciplinaryFormulation>): MultiDisciplinaryFormulation | null => {
      const idx = store.multiDisciplinaryFormulations.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.multiDisciplinaryFormulations[idx] = { ...store.multiDisciplinaryFormulations[idx], ...data };
      return store.multiDisciplinaryFormulations[idx];
    },
  },

  culturalVisits: {
    findAll: (): CulturalVisit[] => store.culturalVisits,
    findByChild: (childId: string): CulturalVisit[] => store.culturalVisits.filter((r) => r.young_people_attended.includes(childId)),
    findById: (id: string): CulturalVisit | undefined => store.culturalVisits.find((r) => r.id === id),
    create: (data: Partial<CulturalVisit>): CulturalVisit => {
      const record = { ...data, id: generateId("cvst"), created_at: new Date().toISOString() } as CulturalVisit;
      store.culturalVisits.push(record);
      return record;
    },
    update: (id: string, data: Partial<CulturalVisit>): CulturalVisit | null => {
      const idx = store.culturalVisits.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.culturalVisits[idx] = { ...store.culturalVisits[idx], ...data };
      return store.culturalVisits[idx];
    },
  },

  nightChecks: {
    findAll: (): NightCheck[] => store.nightChecks,
    findByChild: (childId: string): NightCheck[] => store.nightChecks.filter((r) => r.child_id === childId),
    findById: (id: string): NightCheck | undefined => store.nightChecks.find((r) => r.id === id),
    create: (data: Partial<NightCheck>): NightCheck => {
      const record = { ...data, id: generateId("nchk"), created_at: new Date().toISOString() } as NightCheck;
      store.nightChecks.push(record);
      return record;
    },
    update: (id: string, data: Partial<NightCheck>): NightCheck | null => {
      const idx = store.nightChecks.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.nightChecks[idx] = { ...store.nightChecks[idx], ...data };
      return store.nightChecks[idx];
    },
  },

  nightStaffGuidanceSections: {
    findAll: (): NightStaffGuidanceSection[] => store.nightStaffGuidanceSections,
    findById: (id: string): NightStaffGuidanceSection | undefined => store.nightStaffGuidanceSections.find((r) => r.id === id),
    create: (data: Partial<NightStaffGuidanceSection>): NightStaffGuidanceSection => {
      const record = { ...data, id: generateId("nsgs"), created_at: new Date().toISOString() } as NightStaffGuidanceSection;
      store.nightStaffGuidanceSections.push(record);
      return record;
    },
    update: (id: string, data: Partial<NightStaffGuidanceSection>): NightStaffGuidanceSection | null => {
      const idx = store.nightStaffGuidanceSections.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.nightStaffGuidanceSections[idx] = { ...store.nightStaffGuidanceSections[idx], ...data };
      return store.nightStaffGuidanceSections[idx];
    },
  },

  nightStaffHandovers: {
    findAll: (): NightStaffHandover[] => store.nightStaffHandovers,
    findById: (id: string): NightStaffHandover | undefined => store.nightStaffHandovers.find((r) => r.id === id),
    create: (data: Partial<NightStaffHandover>): NightStaffHandover => {
      const record = { ...data, id: generateId("nshd"), created_at: new Date().toISOString() } as NightStaffHandover;
      store.nightStaffHandovers.push(record);
      return record;
    },
    update: (id: string, data: Partial<NightStaffHandover>): NightStaffHandover | null => {
      const idx = store.nightStaffHandovers.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.nightStaffHandovers[idx] = { ...store.nightStaffHandovers[idx], ...data };
      return store.nightStaffHandovers[idx];
    },
  },

  nightAnxietySupportRecords: {
    findAll: (): NightAnxietySupportRecord[] => store.nightAnxietySupportRecords,
    findByChild: (childId: string): NightAnxietySupportRecord[] => store.nightAnxietySupportRecords.filter((r) => r.child_id === childId),
    findById: (id: string): NightAnxietySupportRecord | undefined => store.nightAnxietySupportRecords.find((r) => r.id === id),
    create: (data: Partial<NightAnxietySupportRecord>): NightAnxietySupportRecord => {
      const record = { ...data, id: generateId("nasp"), created_at: new Date().toISOString() } as NightAnxietySupportRecord;
      store.nightAnxietySupportRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<NightAnxietySupportRecord>): NightAnxietySupportRecord | null => {
      const idx = store.nightAnxietySupportRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.nightAnxietySupportRecords[idx] = { ...store.nightAnxietySupportRecords[idx], ...data };
      return store.nightAnxietySupportRecords[idx];
    },
  },

  notificationLogEntries: {
    findAll: (): NotificationLogEntry[] => store.notificationLogEntries,
    findById: (id: string): NotificationLogEntry | undefined => store.notificationLogEntries.find((r) => r.id === id),
    create: (data: Partial<NotificationLogEntry>): NotificationLogEntry => {
      const record = { ...data, id: generateId("ntlg"), created_at: new Date().toISOString() } as NotificationLogEntry;
      store.notificationLogEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<NotificationLogEntry>): NotificationLogEntry | null => {
      const idx = store.notificationLogEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.notificationLogEntries[idx] = { ...store.notificationLogEntries[idx], ...data };
      return store.notificationLogEntries[idx];
    },
  },

  occupationalTherapyRecords: {
    findAll: (): OccupationalTherapyRecord[] => store.occupationalTherapyRecords,
    findByChild: (childId: string): OccupationalTherapyRecord[] => store.occupationalTherapyRecords.filter((r) => r.child_id === childId),
    findById: (id: string): OccupationalTherapyRecord | undefined => store.occupationalTherapyRecords.find((r) => r.id === id),
    create: (data: Partial<OccupationalTherapyRecord>): OccupationalTherapyRecord => {
      const record = { ...data, id: generateId("otrr"), created_at: new Date().toISOString() } as OccupationalTherapyRecord;
      store.occupationalTherapyRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<OccupationalTherapyRecord>): OccupationalTherapyRecord | null => {
      const idx = store.occupationalTherapyRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.occupationalTherapyRecords[idx] = { ...store.occupationalTherapyRecords[idx], ...data };
      return store.occupationalTherapyRecords[idx];
    },
  },

  ofstedActionItems: {
    findAll: (): OfstedActionItem[] => store.ofstedActionItems,
    findById: (id: string): OfstedActionItem | undefined => store.ofstedActionItems.find((r) => r.id === id),
    create: (data: Partial<OfstedActionItem>): OfstedActionItem => {
      const record = { ...data, id: generateId("oapi"), created_at: new Date().toISOString() } as OfstedActionItem;
      store.ofstedActionItems.push(record);
      return record;
    },
    update: (id: string, data: Partial<OfstedActionItem>): OfstedActionItem | null => {
      const idx = store.ofstedActionItems.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ofstedActionItems[idx] = { ...store.ofstedActionItems[idx], ...data };
      return store.ofstedActionItems[idx];
    },
  },

  ofstedEngagementRecords: {
    findAll: (): OfstedEngagementRecord[] => store.ofstedEngagementRecords,
    findById: (id: string): OfstedEngagementRecord | undefined => store.ofstedEngagementRecords.find((r) => r.id === id),
    create: (data: Partial<OfstedEngagementRecord>): OfstedEngagementRecord => {
      const record = { ...data, id: generateId("ofer"), created_at: new Date().toISOString() } as OfstedEngagementRecord;
      store.ofstedEngagementRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<OfstedEngagementRecord>): OfstedEngagementRecord | null => {
      const idx = store.ofstedEngagementRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ofstedEngagementRecords[idx] = { ...store.ofstedEngagementRecords[idx], ...data };
      return store.ofstedEngagementRecords[idx];
    },
  },

  selfEvaluationAreas: {
    findAll: (): SelfEvaluationArea[] => store.selfEvaluationAreas,
    findById: (id: string): SelfEvaluationArea | undefined => store.selfEvaluationAreas.find((r) => r.id === id),
    create: (data: Partial<SelfEvaluationArea>): SelfEvaluationArea => {
      const record = { ...data, id: generateId("seva"), created_at: new Date().toISOString() } as SelfEvaluationArea;
      store.selfEvaluationAreas.push(record);
      return record;
    },
    update: (id: string, data: Partial<SelfEvaluationArea>): SelfEvaluationArea | null => {
      const idx = store.selfEvaluationAreas.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.selfEvaluationAreas[idx] = { ...store.selfEvaluationAreas[idx], ...data };
      return store.selfEvaluationAreas[idx];
    },
  },

  inspectionHistory: {
    findAll: (): InspectionRecord[] =>
      [...store.inspectionHistory].sort((a, b) =>
        b.inspection_date.localeCompare(a.inspection_date)
      ),
    findById: (id: string): InspectionRecord | undefined =>
      store.inspectionHistory.find((r) => r.id === id),
    latest: (): InspectionRecord | undefined =>
      store.inspectionHistory.reduce<InspectionRecord | undefined>((best, r) =>
        !best || r.inspection_date > best.inspection_date ? r : best, undefined),
    create: (data: Partial<InspectionRecord>): InspectionRecord => {
      const now = new Date().toISOString();
      const record: InspectionRecord = {
        id: generateId("insp"),
        home_id: "home_oak",
        inspection_date: data.inspection_date ?? now.slice(0, 10),
        inspection_type: data.inspection_type ?? "Full inspection",
        grade: data.grade ?? "Good",
        inspector_name: data.inspector_name ?? "",
        report_reference: data.report_reference ?? null,
        report_url: data.report_url ?? null,
        actions_required: data.actions_required ?? 0,
        actions_completed: data.actions_completed ?? 0,
        summary: data.summary ?? null,
        published_at: data.published_at ?? null,
        created_at: now,
        updated_at: now,
      };
      store.inspectionHistory.push(record);
      return record;
    },
    update: (id: string, data: Partial<InspectionRecord>): InspectionRecord | null => {
      const idx = store.inspectionHistory.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.inspectionHistory[idx] = {
        ...store.inspectionHistory[idx],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return store.inspectionHistory[idx];
    },
  },

  onCallShifts: {
    findAll: (): OnCallShift[] => store.onCallShifts,
    findById: (id: string): OnCallShift | undefined => store.onCallShifts.find((r) => r.id === id),
    create: (data: Partial<OnCallShift>): OnCallShift => {
      const record = { ...data, id: generateId("ocsh"), created_at: new Date().toISOString() } as OnCallShift;
      store.onCallShifts.push(record);
      return record;
    },
    update: (id: string, data: Partial<OnCallShift>): OnCallShift | null => {
      const idx = store.onCallShifts.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.onCallShifts[idx] = { ...store.onCallShifts[idx], ...data };
      return store.onCallShifts[idx];
    },
  },

  onlineGamingRecords: {
    findAll: (): OnlineGamingRecord[] => store.onlineGamingRecords,
    findByChild: (childId: string): OnlineGamingRecord[] => store.onlineGamingRecords.filter((r) => r.child_id === childId),
    findById: (id: string): OnlineGamingRecord | undefined => store.onlineGamingRecords.find((r) => r.id === id),
    create: (data: Partial<OnlineGamingRecord>): OnlineGamingRecord => {
      const record = { ...data, id: generateId("ogrc"), created_at: new Date().toISOString() } as OnlineGamingRecord;
      store.onlineGamingRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<OnlineGamingRecord>): OnlineGamingRecord | null => {
      const idx = store.onlineGamingRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.onlineGamingRecords[idx] = { ...store.onlineGamingRecords[idx], ...data };
      return store.onlineGamingRecords[idx];
    },
  },

  onlineSafetyIncidents: {
    findAll: (): OnlineSafetyIncident[] => store.onlineSafetyIncidents,
    findByChild: (childId: string): OnlineSafetyIncident[] => store.onlineSafetyIncidents.filter((r) => r.child_id === childId),
    findById: (id: string): OnlineSafetyIncident | undefined => store.onlineSafetyIncidents.find((r) => r.id === id),
    create: (data: Partial<OnlineSafetyIncident>): OnlineSafetyIncident => {
      const record = { ...data, id: generateId("osic"), created_at: new Date().toISOString() } as OnlineSafetyIncident;
      store.onlineSafetyIncidents.push(record);
      return record;
    },
    update: (id: string, data: Partial<OnlineSafetyIncident>): OnlineSafetyIncident | null => {
      const idx = store.onlineSafetyIncidents.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.onlineSafetyIncidents[idx] = { ...store.onlineSafetyIncidents[idx], ...data };
      return store.onlineSafetyIncidents[idx];
    },
  },

  onlineSafetyAgreements: {
    findAll: (): OnlineSafetyAgreement[] => store.onlineSafetyAgreements,
    findByChild: (childId: string): OnlineSafetyAgreement[] => store.onlineSafetyAgreements.filter((r) => r.child_id === childId),
    findById: (id: string): OnlineSafetyAgreement | undefined => store.onlineSafetyAgreements.find((r) => r.id === id),
    create: (data: Partial<OnlineSafetyAgreement>): OnlineSafetyAgreement => {
      const record = { ...data, id: generateId("osag"), created_at: new Date().toISOString() } as OnlineSafetyAgreement;
      store.onlineSafetyAgreements.push(record);
      return record;
    },
    update: (id: string, data: Partial<OnlineSafetyAgreement>): OnlineSafetyAgreement | null => {
      const idx = store.onlineSafetyAgreements.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.onlineSafetyAgreements[idx] = { ...store.onlineSafetyAgreements[idx], ...data };
      return store.onlineSafetyAgreements[idx];
    },
  },

  operationalMeetings: {
    findAll: (): OperationalMeeting[] => store.operationalMeetings,
    findById: (id: string): OperationalMeeting | undefined => store.operationalMeetings.find((r) => r.id === id),
    create: (data: Partial<OperationalMeeting>): OperationalMeeting => {
      const record = { ...data, id: generateId("opmg"), created_at: new Date().toISOString() } as OperationalMeeting;
      store.operationalMeetings.push(record);
      return record;
    },
    update: (id: string, data: Partial<OperationalMeeting>): OperationalMeeting | null => {
      const idx = store.operationalMeetings.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.operationalMeetings[idx] = { ...store.operationalMeetings[idx], ...data };
      return store.operationalMeetings[idx];
    },
  },

  opticiansRecords: {
    findAll: (): OpticiansRecord[] => store.opticiansRecords,
    findByChild: (childId: string): OpticiansRecord[] => store.opticiansRecords.filter((r) => r.child_id === childId),
    findById: (id: string): OpticiansRecord | undefined => store.opticiansRecords.find((r) => r.id === id),
    create: (data: Partial<OpticiansRecord>): OpticiansRecord => {
      const record = { ...data, id: generateId("oprc"), created_at: new Date().toISOString() } as OpticiansRecord;
      store.opticiansRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<OpticiansRecord>): OpticiansRecord | null => {
      const idx = store.opticiansRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.opticiansRecords[idx] = { ...store.opticiansRecords[idx], ...data };
      return store.opticiansRecords[idx];
    },
  },

  outcomeStarAssessments: {
    findAll: (): OutcomeStarAssessment[] => store.outcomeStarAssessments,
    findByChild: (childId: string): OutcomeStarAssessment[] => store.outcomeStarAssessments.filter((r) => r.child_id === childId),
    findById: (id: string): OutcomeStarAssessment | undefined => store.outcomeStarAssessments.find((r) => r.id === id),
    create: (data: Partial<OutcomeStarAssessment>): OutcomeStarAssessment => {
      const record = { ...data, id: generateId("osar"), created_at: new Date().toISOString() } as OutcomeStarAssessment;
      store.outcomeStarAssessments.push(record);
      return record;
    },
    update: (id: string, data: Partial<OutcomeStarAssessment>): OutcomeStarAssessment | null => {
      const idx = store.outcomeStarAssessments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.outcomeStarAssessments[idx] = { ...store.outcomeStarAssessments[idx], ...data };
      return store.outcomeStarAssessments[idx];
    },
  },

  outcomeMetrics: {
    findAll: (): OutcomeMetric[] => store.outcomeMetrics,
    findById: (id: string): OutcomeMetric | undefined => store.outcomeMetrics.find((r) => r.id === id),
    create: (data: Partial<OutcomeMetric>): OutcomeMetric => {
      const record = { ...data, id: generateId("omrc"), created_at: new Date().toISOString() } as OutcomeMetric;
      store.outcomeMetrics.push(record);
      return record;
    },
    update: (id: string, data: Partial<OutcomeMetric>): OutcomeMetric | null => {
      const idx = store.outcomeMetrics.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.outcomeMetrics[idx] = { ...store.outcomeMetrics[idx], ...data };
      return store.outcomeMetrics[idx];
    },
  },

  outdoorActivityRiskAssessments: {
    findAll: (): OutdoorActivityRiskAssessment[] => store.outdoorActivityRiskAssessments,
    findById: (id: string): OutdoorActivityRiskAssessment | undefined => store.outdoorActivityRiskAssessments.find((r) => r.id === id),
    create: (data: Partial<OutdoorActivityRiskAssessment>): OutdoorActivityRiskAssessment => {
      const record = { ...data, id: generateId("oara"), created_at: new Date().toISOString() } as OutdoorActivityRiskAssessment;
      store.outdoorActivityRiskAssessments.push(record);
      return record;
    },
    update: (id: string, data: Partial<OutdoorActivityRiskAssessment>): OutdoorActivityRiskAssessment | null => {
      const idx = store.outdoorActivityRiskAssessments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.outdoorActivityRiskAssessments[idx] = { ...store.outdoorActivityRiskAssessments[idx], ...data };
      return store.outdoorActivityRiskAssessments[idx];
    },
  },

  parentPartnershipRecords: {
    findAll: (): ParentPartnershipRecord[] => store.parentPartnershipRecords,
    findByChild: (childId: string): ParentPartnershipRecord[] => store.parentPartnershipRecords.filter((r) => r.child_id === childId),
    findById: (id: string): ParentPartnershipRecord | undefined => store.parentPartnershipRecords.find((r) => r.id === id),
    create: (data: Partial<ParentPartnershipRecord>): ParentPartnershipRecord => {
      const record = { ...data, id: generateId("pprc"), created_at: new Date().toISOString() } as ParentPartnershipRecord;
      store.parentPartnershipRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ParentPartnershipRecord>): ParentPartnershipRecord | null => {
      const idx = store.parentPartnershipRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.parentPartnershipRecords[idx] = { ...store.parentPartnershipRecords[idx], ...data };
      return store.parentPartnershipRecords[idx];
    },
  },

  parentalResponsibilityRecords: {
    findAll: (): ParentalResponsibilityRecord[] => store.parentalResponsibilityRecords,
    findByChild: (childId: string): ParentalResponsibilityRecord[] => store.parentalResponsibilityRecords.filter((r) => r.child_id === childId),
    findById: (id: string): ParentalResponsibilityRecord | undefined => store.parentalResponsibilityRecords.find((r) => r.id === id),
    create: (data: Partial<ParentalResponsibilityRecord>): ParentalResponsibilityRecord => {
      const record = { ...data, id: generateId("prrc"), created_at: new Date().toISOString() } as ParentalResponsibilityRecord;
      store.parentalResponsibilityRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ParentalResponsibilityRecord>): ParentalResponsibilityRecord | null => {
      const idx = store.parentalResponsibilityRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.parentalResponsibilityRecords[idx] = { ...store.parentalResponsibilityRecords[idx], ...data };
      return store.parentalResponsibilityRecords[idx];
    },
  },

  pathwayPlans: {
    findAll: (): PathwayPlan[] => store.pathwayPlans,
    findByChild: (childId: string): PathwayPlan[] => store.pathwayPlans.filter((r) => r.child_id === childId),
    findById: (id: string): PathwayPlan | undefined => store.pathwayPlans.find((r) => r.id === id),
    create: (data: Partial<PathwayPlan>): PathwayPlan => {
      const record = { ...data, id: generateId("pwpl"), created_at: new Date().toISOString() } as PathwayPlan;
      store.pathwayPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<PathwayPlan>): PathwayPlan | null => {
      const idx = store.pathwayPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.pathwayPlans[idx] = { ...store.pathwayPlans[idx], ...data };
      return store.pathwayPlans[idx];
    },
  },

  peerDynamics: {
    findAll: (): PeerDynamic[] => store.peerDynamics,
    findById: (id: string): PeerDynamic | undefined => store.peerDynamics.find((r) => r.id === id),
    create: (data: Partial<PeerDynamic>): PeerDynamic => {
      const record = { ...data, id: generateId("pdyn"), created_at: new Date().toISOString() } as PeerDynamic;
      store.peerDynamics.push(record);
      return record;
    },
    update: (id: string, data: Partial<PeerDynamic>): PeerDynamic | null => {
      const idx = store.peerDynamics.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.peerDynamics[idx] = { ...store.peerDynamics[idx], ...data };
      return store.peerDynamics[idx];
    },
  },

  peerGroupDynamics: {
    findAll: (): PeerGroupDynamic[] => store.peerGroupDynamics,
    findById: (id: string): PeerGroupDynamic | undefined => store.peerGroupDynamics.find((r) => r.id === id),
    create: (data: Partial<PeerGroupDynamic>): PeerGroupDynamic => {
      const record = { ...data, id: generateId("pgdn"), created_at: new Date().toISOString() } as PeerGroupDynamic;
      store.peerGroupDynamics.push(record);
      return record;
    },
    update: (id: string, data: Partial<PeerGroupDynamic>): PeerGroupDynamic | null => {
      const idx = store.peerGroupDynamics.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.peerGroupDynamics[idx] = { ...store.peerGroupDynamics[idx], ...data };
      return store.peerGroupDynamics[idx];
    },
  },

  pepRecords: {
    findAll: (): PepRecord[] => store.pepRecords,
    findByChild: (childId: string): PepRecord[] => store.pepRecords.filter((r) => r.child_id === childId),
    findById: (id: string): PepRecord | undefined => store.pepRecords.find((r) => r.id === id),
    create: (data: Partial<PepRecord>): PepRecord => {
      const record = { ...data, id: generateId("pepr"), created_at: new Date().toISOString() } as PepRecord;
      store.pepRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<PepRecord>): PepRecord | null => {
      const idx = store.pepRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.pepRecords[idx] = { ...store.pepRecords[idx], ...data };
      return store.pepRecords[idx];
    },
  },

  belongingsRecords: {
    findAll: (): BelongingsRecord[] => store.belongingsRecords,
    findByChild: (childId: string): BelongingsRecord[] => store.belongingsRecords.filter((r) => r.child_id === childId),
    findById: (id: string): BelongingsRecord | undefined => store.belongingsRecords.find((r) => r.id === id),
    create: (data: Partial<BelongingsRecord>): BelongingsRecord => {
      const record = { ...data, id: generateId("blrc"), created_at: new Date().toISOString() } as BelongingsRecord;
      store.belongingsRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<BelongingsRecord>): BelongingsRecord | null => {
      const idx = store.belongingsRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.belongingsRecords[idx] = { ...store.belongingsRecords[idx], ...data };
      return store.belongingsRecords[idx];
    },
  },

  personalPassports: {
    findAll: (): PersonalPassport[] => store.personalPassports,
    findByChild: (childId: string): PersonalPassport[] => store.personalPassports.filter((r) => r.child_id === childId),
    findById: (id: string): PersonalPassport | undefined => store.personalPassports.find((r) => r.id === id),
    create: (data: Partial<PersonalPassport>): PersonalPassport => {
      const record = { ...data, id: generateId("ppsp"), created_at: new Date().toISOString() } as PersonalPassport;
      store.personalPassports.push(record);
      return record;
    },
    update: (id: string, data: Partial<PersonalPassport>): PersonalPassport | null => {
      const idx = store.personalPassports.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.personalPassports[idx] = { ...store.personalPassports[idx], ...data };
      return store.personalPassports[idx];
    },
  },

  pettyCashEntries: {
    findAll: (): PettyCashEntry[] => store.pettyCashEntries,
    findById: (id: string): PettyCashEntry | undefined => store.pettyCashEntries.find((r) => r.id === id),
    create: (data: Partial<PettyCashEntry>): PettyCashEntry => {
      const record = { ...data, id: generateId("pcen"), created_at: new Date().toISOString() } as PettyCashEntry;
      store.pettyCashEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<PettyCashEntry>): PettyCashEntry | null => {
      const idx = store.pettyCashEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.pettyCashEntries[idx] = { ...store.pettyCashEntries[idx], ...data };
      return store.pettyCashEntries[idx];
    },
  },

  photoAlbumRecords: {
    findAll: (): PhotoAlbumRecord[] => store.photoAlbumRecords,
    findByChild: (childId: string): PhotoAlbumRecord[] => store.photoAlbumRecords.filter((r) => r.child_id === childId),
    findById: (id: string): PhotoAlbumRecord | undefined => store.photoAlbumRecords.find((r) => r.id === id),
    create: (data: Partial<PhotoAlbumRecord>): PhotoAlbumRecord => {
      const record = { ...data, id: generateId("parc"), created_at: new Date().toISOString() } as PhotoAlbumRecord;
      store.photoAlbumRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<PhotoAlbumRecord>): PhotoAlbumRecord | null => {
      const idx = store.photoAlbumRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.photoAlbumRecords[idx] = { ...store.photoAlbumRecords[idx], ...data };
      return store.photoAlbumRecords[idx];
    },
  },

  photoConsentRecords: {
    getAll: (childId?: string) => {
      if (childId) return store.photoConsentRecords.filter((r) => r.child_id === childId);
      return store.photoConsentRecords;
    },
    create: (data: Partial<PhotoConsentRecord>) => {
      const record = { ...data, id: `pcrc_${Date.now()}`, created_at: new Date().toISOString() } as PhotoConsentRecord;
      store.photoConsentRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<PhotoConsentRecord>) => {
      const idx = store.photoConsentRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.photoConsentRecords[idx] = { ...store.photoConsentRecords[idx], ...data };
      return store.photoConsentRecords[idx];
    },
  },

  physicalActivityEntries: {
    getAll: (childId?: string) => {
      if (childId) return store.physicalActivityEntries.filter((r) => r.child_id === childId);
      return store.physicalActivityEntries;
    },
    create: (data: Partial<PhysicalActivityEntry>) => {
      const record = { ...data, id: `paen_${Date.now()}`, created_at: new Date().toISOString() } as PhysicalActivityEntry;
      store.physicalActivityEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<PhysicalActivityEntry>) => {
      const idx = store.physicalActivityEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.physicalActivityEntries[idx] = { ...store.physicalActivityEntries[idx], ...data };
      return store.physicalActivityEntries[idx];
    },
  },

  placementAnniversaryEntries: {
    getAll: (childId?: string) => {
      if (childId) return store.placementAnniversaryEntries.filter((r) => r.child_id === childId);
      return store.placementAnniversaryEntries;
    },
    create: (data: Partial<PlacementAnniversaryEntry>) => {
      const record = { ...data, id: `pann_${Date.now()}`, created_at: new Date().toISOString() } as PlacementAnniversaryEntry;
      store.placementAnniversaryEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<PlacementAnniversaryEntry>) => {
      const idx = store.placementAnniversaryEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.placementAnniversaryEntries[idx] = { ...store.placementAnniversaryEntries[idx], ...data };
      return store.placementAnniversaryEntries[idx];
    },
  },

  placementBudgetTrackers: {
    getAll: (childId?: string) => {
      if (childId) return store.placementBudgetTrackers.filter((r) => r.child_id === childId);
      return store.placementBudgetTrackers;
    },
    create: (data: Partial<PlacementBudgetTracker>) => {
      const record = { ...data, id: `pbtk_${Date.now()}`, created_at: new Date().toISOString() } as PlacementBudgetTracker;
      store.placementBudgetTrackers.push(record);
      return record;
    },
    update: (id: string, data: Partial<PlacementBudgetTracker>) => {
      const idx = store.placementBudgetTrackers.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.placementBudgetTrackers[idx] = { ...store.placementBudgetTrackers[idx], ...data };
      return store.placementBudgetTrackers[idx];
    },
  },

  cohortAnalyses: {
    getAll: () => store.cohortAnalyses,
    create: (data: Partial<CohortAnalysis>) => {
      const record = { ...data, id: `coan_${Date.now()}`, created_at: new Date().toISOString() } as CohortAnalysis;
      store.cohortAnalyses.push(record);
      return record;
    },
    update: (id: string, data: Partial<CohortAnalysis>) => {
      const idx = store.cohortAnalyses.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.cohortAnalyses[idx] = { ...store.cohortAnalyses[idx], ...data };
      return store.cohortAnalyses[idx];
    },
  },

  disruptionPreventionPlans: {
    getAll: (childId?: string) => {
      if (childId) return store.disruptionPreventionPlans.filter((r) => r.child_id === childId);
      return store.disruptionPreventionPlans;
    },
    create: (data: Partial<DisruptionPreventionPlan>) => {
      const record = { ...data, id: `dppl_${Date.now()}`, created_at: new Date().toISOString() } as DisruptionPreventionPlan;
      store.disruptionPreventionPlans.push(record);
      return record;
    },
    update: (id: string, data: Partial<DisruptionPreventionPlan>) => {
      const idx = store.disruptionPreventionPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.disruptionPreventionPlans[idx] = { ...store.disruptionPreventionPlans[idx], ...data };
      return store.disruptionPreventionPlans[idx];
    },
  },
  placementEndSummaries: {
    getAll: () => store.placementEndSummaries,
    create: (data: Partial<PlacementEndSummary>) => {
      const record = { ...data, id: `pend_${Date.now()}`, created_at: new Date().toISOString() } as PlacementEndSummary;
      store.placementEndSummaries.push(record);
      return record;
    },
    update: (id: string, data: Partial<PlacementEndSummary>) => {
      const idx = store.placementEndSummaries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.placementEndSummaries[idx] = { ...store.placementEndSummaries[idx], ...data };
      return store.placementEndSummaries[idx];
    },
  },
  placementImpactAssessments: {
    getAll: () => store.placementImpactAssessments,
    create: (data: Partial<PlacementImpactAssessment>) => {
      const record = { ...data, id: `pias_${Date.now()}`, created_at: new Date().toISOString() } as PlacementImpactAssessment;
      store.placementImpactAssessments.push(record);
      return record;
    },
    update: (id: string, data: Partial<PlacementImpactAssessment>) => {
      const idx = store.placementImpactAssessments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.placementImpactAssessments[idx] = { ...store.placementImpactAssessments[idx], ...data };
      return store.placementImpactAssessments[idx];
    },
  },
  placementMeetings: {
    getAll: (childId?: string) => {
      if (childId) return store.placementMeetings.filter((r) => r.child_id === childId);
      return store.placementMeetings;
    },
    create: (data: Partial<PlacementMeeting>) => {
      const record = { ...data, id: `pmtg_${Date.now()}`, created_at: new Date().toISOString() } as PlacementMeeting;
      store.placementMeetings.push(record);
      return record;
    },
    update: (id: string, data: Partial<PlacementMeeting>) => {
      const idx = store.placementMeetings.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.placementMeetings[idx] = { ...store.placementMeetings[idx], ...data };
      return store.placementMeetings[idx];
    },
  },
  placementObjectives: {
    getAll: (childId?: string) => {
      if (childId) return store.placementObjectives.filter((r) => r.child_id === childId);
      return store.placementObjectives;
    },
    create: (data: Partial<PlacementObjective>) => {
      const record = { ...data, id: `pobj_${Date.now()}`, created_at: new Date().toISOString() } as PlacementObjective;
      store.placementObjectives.push(record);
      return record;
    },
    update: (id: string, data: Partial<PlacementObjective>) => {
      const idx = store.placementObjectives.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.placementObjectives[idx] = { ...store.placementObjectives[idx], ...data };
      return store.placementObjectives[idx];
    },
  },
  placementStabilityRecords: {
    getAll: (childId?: string) => {
      if (childId) return store.placementStabilityRecords.filter((r) => r.child_id === childId);
      return store.placementStabilityRecords;
    },
    create: (data: Partial<PlacementStabilityRecord>) => {
      const record = { ...data, id: `psrc_${Date.now()}`, created_at: new Date().toISOString() } as PlacementStabilityRecord;
      store.placementStabilityRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<PlacementStabilityRecord>) => {
      const idx = store.placementStabilityRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.placementStabilityRecords[idx] = { ...store.placementStabilityRecords[idx], ...data };
      return store.placementStabilityRecords[idx];
    },
  },
  placementStabilityMeetings: {
    getAll: (childId?: string) => {
      if (childId) return store.placementStabilityMeetings.filter((r) => r.child_id === childId);
      return store.placementStabilityMeetings;
    },
    create: (data: Partial<PlacementStabilityMeeting>) => {
      const record = { ...data, id: `psmg_${Date.now()}`, created_at: new Date().toISOString() } as PlacementStabilityMeeting;
      store.placementStabilityMeetings.push(record);
      return record;
    },
    update: (id: string, data: Partial<PlacementStabilityMeeting>) => {
      const idx = store.placementStabilityMeetings.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.placementStabilityMeetings[idx] = { ...store.placementStabilityMeetings[idx], ...data };
      return store.placementStabilityMeetings[idx];
    },
  },
  successFactors: {
    getAll: () => store.successFactors,
    create: (data: Partial<SuccessFactor>) => {
      const record = { ...data, id: `psf_${Date.now()}` } as SuccessFactor;
      store.successFactors.push(record);
      return record;
    },
    update: (id: string, data: Partial<SuccessFactor>) => {
      const idx = store.successFactors.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.successFactors[idx] = { ...store.successFactors[idx], ...data };
      return store.successFactors[idx];
    },
  },
  pocketMoneyTransactions: {
    getAll: (childId?: string) => {
      if (childId) return store.pocketMoneyTransactions.filter((r) => r.child_id === childId);
      return store.pocketMoneyTransactions;
    },
    create: (data: Partial<PocketMoneyTransaction>) => {
      const record = { ...data, id: `pm_${Date.now()}`, created_at: new Date().toISOString() } as PocketMoneyTransaction;
      store.pocketMoneyTransactions.push(record);
      return record;
    },
    update: (id: string, data: Partial<PocketMoneyTransaction>) => {
      const idx = store.pocketMoneyTransactions.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.pocketMoneyTransactions[idx] = { ...store.pocketMoneyTransactions[idx], ...data };
      return store.pocketMoneyTransactions[idx];
    },
  },
  pocketMoneyAccounts: {
    getAll: (childId?: string) => {
      if (childId) return store.pocketMoneyAccounts.filter((r) => r.child_id === childId);
      return store.pocketMoneyAccounts;
    },
    create: (data: Partial<PocketMoneyAccount>) => {
      const record = { ...data, id: `pma_${Date.now()}` } as PocketMoneyAccount;
      store.pocketMoneyAccounts.push(record);
      return record;
    },
    update: (id: string, data: Partial<PocketMoneyAccount>) => {
      const idx = store.pocketMoneyAccounts.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.pocketMoneyAccounts[idx] = { ...store.pocketMoneyAccounts[idx], ...data };
      return store.pocketMoneyAccounts[idx];
    },
  },
  homePolicies: {
    getAll: () => store.homePolicies,
    create: (data: Partial<HomePolicy>) => {
      const record = { ...data, id: `hpol_${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as HomePolicy;
      store.homePolicies.push(record);
      return record;
    },
    update: (id: string, data: Partial<HomePolicy>) => {
      const idx = store.homePolicies.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.homePolicies[idx] = { ...store.homePolicies[idx], ...data, updated_at: new Date().toISOString() };
      return store.homePolicies[idx];
    },
  },
  policyImpactAnalyses: {
    getAll: () => store.policyImpactAnalyses,
    create: (data: Partial<PolicyImpactAnalysis>) => {
      const record = { ...data, id: `pia_${Date.now()}` } as PolicyImpactAnalysis;
      store.policyImpactAnalyses.push(record);
      return record;
    },
    update: (id: string, data: Partial<PolicyImpactAnalysis>) => {
      const idx = store.policyImpactAnalyses.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.policyImpactAnalyses[idx] = { ...store.policyImpactAnalyses[idx], ...data };
      return store.policyImpactAnalyses[idx];
    },
  },
  policyReviewRecords: {
    getAll: () => store.policyReviewRecords,
    create: (data: Partial<PolicyReviewRecord>) => {
      const record = { ...data, id: `prr_${Date.now()}` } as PolicyReviewRecord;
      store.policyReviewRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<PolicyReviewRecord>) => {
      const idx = store.policyReviewRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.policyReviewRecords[idx] = { ...store.policyReviewRecords[idx], ...data };
      return store.policyReviewRecords[idx];
    },
  },
  childrensRights: {
    getAll: () => store.childrensRights,
    create: (data: Partial<ChildrensRightEntry>) => {
      const record = { ...data, id: `cre_${Date.now()}` } as ChildrensRightEntry;
      store.childrensRights.push(record);
      return record;
    },
    update: (id: string, data: Partial<ChildrensRightEntry>) => {
      const idx = store.childrensRights.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.childrensRights[idx] = { ...store.childrensRights[idx], ...data };
      return store.childrensRights[idx];
    },
  },
  localOfferSections: {
    getAll: () => store.localOfferSections,
    create: (data: Partial<LocalOfferSection>) => {
      const record = { ...data, id: `los_${Date.now()}` } as LocalOfferSection;
      store.localOfferSections.push(record);
      return record;
    },
    update: (id: string, data: Partial<LocalOfferSection>) => {
      const idx = store.localOfferSections.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.localOfferSections[idx] = { ...store.localOfferSections[idx], ...data };
      return store.localOfferSections[idx];
    },
  },
  locationAssessmentAreas: {
    getAll: () => store.locationAssessmentAreas,
    create: (data: Partial<LocationAssessmentArea>) => {
      const record = { ...data, id: `laa_${Date.now()}` } as LocationAssessmentArea;
      store.locationAssessmentAreas.push(record);
      return record;
    },
    update: (id: string, data: Partial<LocationAssessmentArea>) => {
      const idx = store.locationAssessmentAreas.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.locationAssessmentAreas[idx] = { ...store.locationAssessmentAreas[idx], ...data };
      return store.locationAssessmentAreas[idx];
    },
  },
  alertNotifications: {
    getAll: () => store.alertNotifications,
    create: (data: Partial<AlertNotification>) => {
      const record = { ...data, id: `an_${Date.now()}` } as AlertNotification;
      store.alertNotifications.push(record);
      return record;
    },
    update: (id: string, data: Partial<AlertNotification>) => {
      const idx = store.alertNotifications.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.alertNotifications[idx] = { ...store.alertNotifications[idx], ...data };
      return store.alertNotifications[idx];
    },
  },
  positiveAchievements: {
    getAll: () => store.positiveAchievements,
    create: (data: Partial<PositiveAchievement>) => {
      const record = { ...data, id: `pa_${Date.now()}` } as PositiveAchievement;
      store.positiveAchievements.push(record);
      return record;
    },
    update: (id: string, data: Partial<PositiveAchievement>) => {
      const idx = store.positiveAchievements.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.positiveAchievements[idx] = { ...store.positiveAchievements[idx], ...data };
      return store.positiveAchievements[idx];
    },
  },
  postIncidentChildDebriefs: {
    getAll: () => store.postIncidentChildDebriefs,
    create: (data: Partial<PostIncidentChildDebrief>) => {
      const record = { ...data, id: `picd_${Date.now()}` } as PostIncidentChildDebrief;
      store.postIncidentChildDebriefs.push(record);
      return record;
    },
    update: (id: string, data: Partial<PostIncidentChildDebrief>) => {
      const idx = store.postIncidentChildDebriefs.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.postIncidentChildDebriefs[idx] = { ...store.postIncidentChildDebriefs[idx], ...data };
      return store.postIncidentChildDebriefs[idx];
    },
  },
  preAdmissionChecklists: {
    getAll: () => store.preAdmissionChecklists,
    create: (data: Partial<PreAdmissionChecklist>) => {
      const record = { ...data, id: `pac_${Date.now()}` } as PreAdmissionChecklist;
      store.preAdmissionChecklists.push(record);
      return record;
    },
    update: (id: string, data: Partial<PreAdmissionChecklist>) => {
      const idx = store.preAdmissionChecklists.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.preAdmissionChecklists[idx] = { ...store.preAdmissionChecklists[idx], ...data };
      return store.preAdmissionChecklists[idx];
    },
  },
  preventRecords: {
    getAll: () => store.preventRecords,
    create: (data: Partial<PreventRecord>) => {
      const record = { ...data, id: `prev_${Date.now()}` } as PreventRecord;
      store.preventRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<PreventRecord>) => {
      const idx = store.preventRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.preventRecords[idx] = { ...store.preventRecords[idx], ...data };
      return store.preventRecords[idx];
    },
  },
  professionalConsultations: {
    getAll: () => store.professionalConsultations,
    create: (data: Partial<ProfessionalConsultation>) => {
      const record = { ...data, id: `pcon_${Date.now()}` } as ProfessionalConsultation;
      store.professionalConsultations.push(record);
      return record;
    },
    update: (id: string, data: Partial<ProfessionalConsultation>) => {
      const idx = store.professionalConsultations.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.professionalConsultations[idx] = { ...store.professionalConsultations[idx], ...data };
      return store.professionalConsultations[idx];
    },
  },
  curiosityLogEntries: {
    getAll: () => store.curiosityLogEntries,
    create: (data: Partial<CuriosityLogEntry>) => {
      const record = { ...data, id: `cle_${Date.now()}` } as CuriosityLogEntry;
      store.curiosityLogEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<CuriosityLogEntry>) => {
      const idx = store.curiosityLogEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.curiosityLogEntries[idx] = { ...store.curiosityLogEntries[idx], ...data };
      return store.curiosityLogEntries[idx];
    },
  },
  cpdRecords: {
    getAll: () => store.cpdRecords,
    create: (data: Partial<CPDRecord>) => {
      const record = { ...data, id: `cpd_${Date.now()}` } as CPDRecord;
      store.cpdRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<CPDRecord>) => {
      const idx = store.cpdRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.cpdRecords[idx] = { ...store.cpdRecords[idx], ...data };
      return store.cpdRecords[idx];
    },
  },
  professionalFeeRecords: {
    getAll: () => store.professionalFeeRecords,
    create: (data: Partial<ProfessionalFeeRecord>) => {
      const record = { ...data, id: `pfr_${Date.now()}` } as ProfessionalFeeRecord;
      store.professionalFeeRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ProfessionalFeeRecord>) => {
      const idx = store.professionalFeeRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.professionalFeeRecords[idx] = { ...store.professionalFeeRecords[idx], ...data };
      return store.professionalFeeRecords[idx];
    },
  },

  professionalMeetingAttendances: {
    getAll: () => store.professionalMeetingAttendances,
    create: (data: Partial<ProfessionalMeetingAttendance>) => {
      const record = { ...data, id: `pma_${Date.now()}` } as ProfessionalMeetingAttendance;
      store.professionalMeetingAttendances.push(record);
      return record;
    },
    update: (id: string, data: Partial<ProfessionalMeetingAttendance>) => {
      const idx = store.professionalMeetingAttendances.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.professionalMeetingAttendances[idx] = { ...store.professionalMeetingAttendances[idx], ...data };
      return store.professionalMeetingAttendances[idx];
    },
  },

  professionalNetworkContacts: {
    getAll: () => store.professionalNetworkContacts,
    create: (data: Partial<ProfessionalNetworkContact>) => {
      const record = { ...data, id: `pnc_${Date.now()}` } as ProfessionalNetworkContact;
      store.professionalNetworkContacts.push(record);
      return record;
    },
    update: (id: string, data: Partial<ProfessionalNetworkContact>) => {
      const idx = store.professionalNetworkContacts.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.professionalNetworkContacts[idx] = { ...store.professionalNetworkContacts[idx], ...data };
      return store.professionalNetworkContacts[idx];
    },
  },

  propertyDamageRecords: {
    getAll: () => store.propertyDamageRecords,
    create: (data: Partial<PropertyDamageRecord>) => {
      const record = { ...data, id: `pdr_${Date.now()}` } as PropertyDamageRecord;
      store.propertyDamageRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<PropertyDamageRecord>) => {
      const idx = store.propertyDamageRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.propertyDamageRecords[idx] = { ...store.propertyDamageRecords[idx], ...data };
      return store.propertyDamageRecords[idx];
    },
  },

  qaAuditRecords: {
    getAll: () => store.qaAuditRecords,
    create: (data: Partial<QAAuditRecord>) => {
      const record = { ...data, id: `qaa_${Date.now()}` } as QAAuditRecord;
      store.qaAuditRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<QAAuditRecord>) => {
      const idx = store.qaAuditRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.qaAuditRecords[idx] = { ...store.qaAuditRecords[idx], ...data };
      return store.qaAuditRecords[idx];
    },
  },

  qualityOfCareReviews: {
    getAll: () => store.qualityOfCareReviews,
    create: (data: Partial<QualityOfCareReview>) => {
      const record = { ...data, id: `qoc_${Date.now()}` } as QualityOfCareReview;
      store.qualityOfCareReviews.push(record);
      return record;
    },
    update: (id: string, data: Partial<QualityOfCareReview>) => {
      const idx = store.qualityOfCareReviews.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.qualityOfCareReviews[idx] = { ...store.qualityOfCareReviews[idx], ...data };
      return store.qualityOfCareReviews[idx];
    },
  },

  reg46Reviews: {
    getAll: () => store.reg46Reviews,
    create: (data: Partial<Reg46Review>) => {
      const record = { ...data, id: `r46_${Date.now()}` } as Reg46Review;
      store.reg46Reviews.push(record);
      return record;
    },
    update: (id: string, data: Partial<Reg46Review>) => {
      const idx = store.reg46Reviews.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.reg46Reviews[idx] = { ...store.reg46Reviews[idx], ...data };
      return store.reg46Reviews[idx];
    },
  },

  referralTrackerRecords: {
    getAll: () => store.referralTrackerRecords,
    create: (data: Partial<ReferralTrackerRecord>) => {
      const record = { ...data, id: `rtr_${Date.now()}` } as ReferralTrackerRecord;
      store.referralTrackerRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ReferralTrackerRecord>) => {
      const idx = store.referralTrackerRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.referralTrackerRecords[idx] = { ...store.referralTrackerRecords[idx], ...data };
      return store.referralTrackerRecords[idx];
    },
  },

  reg22Records: {
    getAll: () => store.reg22Records,
    create: (data: Partial<Reg22Record>) => {
      const record = { ...data, id: `r22_${Date.now()}` } as Reg22Record;
      store.reg22Records.push(record);
      return record;
    },
    update: (id: string, data: Partial<Reg22Record>) => {
      const idx = store.reg22Records.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.reg22Records[idx] = { ...store.reg22Records[idx], ...data };
      return store.reg22Records[idx];
    },
  },

  reg35Notifications: {
    getAll: () => store.reg35Notifications,
    getByChild: (childId: string) => store.reg35Notifications.filter((r) => r.child_id === childId),
    create: (data: Partial<Reg35Notification>) => {
      const record = { ...data, id: `r35_${Date.now()}` } as Reg35Notification;
      store.reg35Notifications.push(record);
      return record;
    },
    update: (id: string, data: Partial<Reg35Notification>) => {
      const idx = store.reg35Notifications.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.reg35Notifications[idx] = { ...store.reg35Notifications[idx], ...data };
      return store.reg35Notifications[idx];
    },
  },

  reg40StaffEntries: {
    getAll: () => store.reg40StaffEntries,
    create: (data: Partial<Reg40StaffEntry>) => {
      const record = { ...data, id: `r40s_${Date.now()}` } as Reg40StaffEntry;
      store.reg40StaffEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<Reg40StaffEntry>) => {
      const idx = store.reg40StaffEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.reg40StaffEntries[idx] = { ...store.reg40StaffEntries[idx], ...data };
      return store.reg40StaffEntries[idx];
    },
  },

  reg44ActionRecords: {
    getAll: () => store.reg44ActionRecords,
    create: (data: Partial<Reg44ActionRecord>) => {
      const record = { ...data, id: `r44a_${Date.now()}` } as Reg44ActionRecord;
      store.reg44ActionRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<Reg44ActionRecord>) => {
      const idx = store.reg44ActionRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.reg44ActionRecords[idx] = { ...store.reg44ActionRecords[idx], ...data };
      return store.reg44ActionRecords[idx];
    },
  },

  registrationChangeRecords: {
    getAll: () => store.registrationChangeRecords,
    create: (data: Partial<RegistrationChangeRecord>) => {
      const record = { ...data, id: `rcr_${Date.now()}` } as RegistrationChangeRecord;
      store.registrationChangeRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<RegistrationChangeRecord>) => {
      const idx = store.registrationChangeRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.registrationChangeRecords[idx] = { ...store.registrationChangeRecords[idx], ...data };
      return store.registrationChangeRecords[idx];
    },
  },

  regulatoryCorrespondenceLetters: {
    getAll: () => store.regulatoryCorrespondenceLetters,
    create: (data: Partial<RegulatoryCorrespondenceLetter>) => {
      const record = { ...data, id: `rcl_${Date.now()}` } as RegulatoryCorrespondenceLetter;
      store.regulatoryCorrespondenceLetters.push(record);
      return record;
    },
    update: (id: string, data: Partial<RegulatoryCorrespondenceLetter>) => {
      const idx = store.regulatoryCorrespondenceLetters.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.regulatoryCorrespondenceLetters[idx] = { ...store.regulatoryCorrespondenceLetters[idx], ...data };
      return store.regulatoryCorrespondenceLetters[idx];
    },
  },

  religiousFestivalRecords: {
    getAll: () => store.religiousFestivalRecords,
    getByChild: (childId: string) => store.religiousFestivalRecords.filter((r) => r.children_involved.includes(childId)),
    create: (data: Partial<ReligiousFestivalRecord>) => {
      const record = { ...data, id: `rfr_${Date.now()}` } as ReligiousFestivalRecord;
      store.religiousFestivalRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ReligiousFestivalRecord>) => {
      const idx = store.religiousFestivalRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.religiousFestivalRecords[idx] = { ...store.religiousFestivalRecords[idx], ...data };
      return store.religiousFestivalRecords[idx];
    },
  },

  religiousObservanceRecords: {
    getAll: () => store.religiousObservanceRecords,
    getByChild: (childId: string) => store.religiousObservanceRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<ReligiousObservanceRecord>) => {
      const record = { ...data, id: `ror_${Date.now()}` } as ReligiousObservanceRecord;
      store.religiousObservanceRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ReligiousObservanceRecord>) => {
      const idx = store.religiousObservanceRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.religiousObservanceRecords[idx] = { ...store.religiousObservanceRecords[idx], ...data };
      return store.religiousObservanceRecords[idx];
    },
  },

  restrictionsLogRecords: {
    getAll: () => store.restrictionsLogRecords,
    getByChild: (childId: string) => store.restrictionsLogRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<RestrictionsLogRecord>) => {
      const record = { ...data, id: `rlr_${Date.now()}` } as RestrictionsLogRecord;
      store.restrictionsLogRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<RestrictionsLogRecord>) => {
      const idx = store.restrictionsLogRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.restrictionsLogRecords[idx] = { ...store.restrictionsLogRecords[idx], ...data };
      return store.restrictionsLogRecords[idx];
    },
  },

  riskAppetiteDomains: {
    getAll: () => store.riskAppetiteDomains,
    create: (data: Partial<RiskAppetiteDomain>) => {
      const record = { ...data, id: `rad_${Date.now()}` } as RiskAppetiteDomain;
      store.riskAppetiteDomains.push(record);
      return record;
    },
    update: (id: string, data: Partial<RiskAppetiteDomain>) => {
      const idx = store.riskAppetiteDomains.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.riskAppetiteDomains[idx] = { ...store.riskAppetiteDomains[idx], ...data };
      return store.riskAppetiteDomains[idx];
    },
  },

  strategicRiskRecords: {
    getAll: () => store.strategicRiskRecords,
    create: (data: Partial<StrategicRiskRecord>) => {
      const record = { ...data, id: `srr_${Date.now()}` } as StrategicRiskRecord;
      store.strategicRiskRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StrategicRiskRecord>) => {
      const idx = store.strategicRiskRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.strategicRiskRecords[idx] = { ...store.strategicRiskRecords[idx], ...data };
      return store.strategicRiskRecords[idx];
    },
  },

  riskManagementPlanRecords: {
    getAll: () => store.riskManagementPlanRecords,
    getByChild: (childId: string) => store.riskManagementPlanRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<RiskManagementPlanRecord>) => {
      const record = { ...data, id: `rmpr_${Date.now()}` } as RiskManagementPlanRecord;
      store.riskManagementPlanRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<RiskManagementPlanRecord>) => {
      const idx = store.riskManagementPlanRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.riskManagementPlanRecords[idx] = { ...store.riskManagementPlanRecords[idx], ...data };
      return store.riskManagementPlanRecords[idx];
    },
  },

  riskRegisterEntries: {
    getAll: () => store.riskRegisterEntries,
    getByChild: (childId: string) => store.riskRegisterEntries.filter((r) => r.child_id === childId),
    create: (data: Partial<RiskRegisterEntry>) => {
      const record = { ...data, id: `rre_${Date.now()}` } as RiskRegisterEntry;
      store.riskRegisterEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<RiskRegisterEntry>) => {
      const idx = store.riskRegisterEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.riskRegisterEntries[idx] = { ...store.riskRegisterEntries[idx], ...data };
      return store.riskRegisterEntries[idx];
    },
  },

  roomAllocationRecords: {
    getAll: () => store.roomAllocationRecords,
    getByChild: (childId: string) => store.roomAllocationRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<RoomAllocationRecord>) => {
      const record = { ...data, id: `rar_${Date.now()}` } as RoomAllocationRecord;
      store.roomAllocationRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<RoomAllocationRecord>) => {
      const idx = store.roomAllocationRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.roomAllocationRecords[idx] = { ...store.roomAllocationRecords[idx], ...data };
      return store.roomAllocationRecords[idx];
    },
  },

  roomSearchRecords: {
    getAll: () => store.roomSearchRecords,
    getByChild: (childId: string) => store.roomSearchRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<RoomSearchRecord>) => {
      const record = { ...data, id: `rsr_${Date.now()}` } as RoomSearchRecord;
      store.roomSearchRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<RoomSearchRecord>) => {
      const idx = store.roomSearchRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.roomSearchRecords[idx] = { ...store.roomSearchRecords[idx], ...data };
      return store.roomSearchRecords[idx];
    },
  },

  rseTrackerRecords: {
    getAll: () => store.rseTrackerRecords,
    getByChild: (childId: string) => store.rseTrackerRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<RseTrackerRecord>) => {
      const record = { ...data, id: `rtr_${Date.now()}` } as RseTrackerRecord;
      store.rseTrackerRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<RseTrackerRecord>) => {
      const idx = store.rseTrackerRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.rseTrackerRecords[idx] = { ...store.rseTrackerRecords[idx], ...data };
      return store.rseTrackerRecords[idx];
    },
  },

  safeTouchProtocolRecords: {
    getAll: () => store.safeTouchProtocolRecords,
    getByChild: (childId: string) => store.safeTouchProtocolRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<SafeTouchProtocolRecord>) => {
      const record = { ...data, id: `stpr_${Date.now()}` } as SafeTouchProtocolRecord;
      store.safeTouchProtocolRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SafeTouchProtocolRecord>) => {
      const idx = store.safeTouchProtocolRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.safeTouchProtocolRecords[idx] = { ...store.safeTouchProtocolRecords[idx], ...data };
      return store.safeTouchProtocolRecords[idx];
    },
  },

  safeguardingSupervisionRecords: {
    getAll: () => store.safeguardingSupervisionRecords,
    create: (data: Partial<SafeguardingSupervisionRecord>) => {
      const record = { ...data, id: `sgsr_${Date.now()}` } as SafeguardingSupervisionRecord;
      store.safeguardingSupervisionRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SafeguardingSupervisionRecord>) => {
      const idx = store.safeguardingSupervisionRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.safeguardingSupervisionRecords[idx] = { ...store.safeguardingSupervisionRecords[idx], ...data };
      return store.safeguardingSupervisionRecords[idx];
    },
  },

  saferRecruitmentRecords: {
    getAll: () => store.saferRecruitmentRecords,
    create: (data: Partial<SaferRecruitmentRecord>) => {
      const record = { ...data, id: `srr_${Date.now()}` } as SaferRecruitmentRecord;
      store.saferRecruitmentRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SaferRecruitmentRecord>) => {
      const idx = store.saferRecruitmentRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.saferRecruitmentRecords[idx] = { ...store.saferRecruitmentRecords[idx], ...data };
      return store.saferRecruitmentRecords[idx];
    },
  },

  secureStorageRecords: {
    getAll: () => store.secureStorageRecords,
    create: (data: Partial<SecureStorageRecord>) => {
      const record = { ...data, id: `ssr_${Date.now()}` } as SecureStorageRecord;
      store.secureStorageRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SecureStorageRecord>) => {
      const idx = store.secureStorageRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.secureStorageRecords[idx] = { ...store.secureStorageRecords[idx], ...data };
      return store.secureStorageRecords[idx];
    },
  },

  selfHarmSafetyPlanRecords: {
    getAll: () => store.selfHarmSafetyPlanRecords,
    getByChild: (childId: string) => store.selfHarmSafetyPlanRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<SelfHarmSafetyPlanRecord>) => {
      const record = { ...data, id: `shspr_${Date.now()}` } as SelfHarmSafetyPlanRecord;
      store.selfHarmSafetyPlanRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SelfHarmSafetyPlanRecord>) => {
      const idx = store.selfHarmSafetyPlanRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.selfHarmSafetyPlanRecords[idx] = { ...store.selfHarmSafetyPlanRecords[idx], ...data };
      return store.selfHarmSafetyPlanRecords[idx];
    },
  },

  sensoryEquipmentRecords: {
    getAll: () => store.sensoryEquipmentRecords,
    create: (data: Partial<SensoryEquipmentRecord>) => {
      const record = { ...data, id: `ser_${Date.now()}` } as SensoryEquipmentRecord;
      store.sensoryEquipmentRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SensoryEquipmentRecord>) => {
      const idx = store.sensoryEquipmentRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.sensoryEquipmentRecords[idx] = { ...store.sensoryEquipmentRecords[idx], ...data };
      return store.sensoryEquipmentRecords[idx];
    },
  },

  sensoryProfileRecords: {
    getAll: () => store.sensoryProfileRecords,
    getByChild: (childId: string) => store.sensoryProfileRecords.filter((r) => r.child_id === childId),
    create: (data: Partial<SensoryProfileRecord>) => {
      const record = { ...data, id: `spr_${Date.now()}` } as SensoryProfileRecord;
      store.sensoryProfileRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SensoryProfileRecord>) => {
      const idx = store.sensoryProfileRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.sensoryProfileRecords[idx] = { ...store.sensoryProfileRecords[idx], ...data };
      return store.sensoryProfileRecords[idx];
    },
  },

  sensoryRoomUsageRecords: {
    getAll: () => store.sensoryRoomUsageRecords,
    getByChild: (childId: string) => store.sensoryRoomUsageRecords.filter((r) => r.child_id === childId),
    create: (data: Omit<SensoryRoomUsageRecord, "id">) => {
      const record = { ...data, id: generateId("srur_") } as SensoryRoomUsageRecord;
      store.sensoryRoomUsageRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SensoryRoomUsageRecord>) => {
      const idx = store.sensoryRoomUsageRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.sensoryRoomUsageRecords[idx] = { ...store.sensoryRoomUsageRecords[idx], ...data };
      return store.sensoryRoomUsageRecords[idx];
    },
  },

  seriousIncidentReviewRecords: {
    getAll: () => store.seriousIncidentReviewRecords,
    create: (data: Omit<SeriousIncidentReviewRecord, "id">) => {
      const record = { ...data, id: generateId("sirr_") } as SeriousIncidentReviewRecord;
      store.seriousIncidentReviewRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SeriousIncidentReviewRecord>) => {
      const idx = store.seriousIncidentReviewRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.seriousIncidentReviewRecords[idx] = { ...store.seriousIncidentReviewRecords[idx], ...data };
      return store.seriousIncidentReviewRecords[idx];
    },
  },

  serviceImprovementRecords: {
    getAll: () => store.serviceImprovementRecords,
    create: (data: Omit<ServiceImprovementRecord, "id">) => {
      const record = { ...data, id: generateId("sir_") } as ServiceImprovementRecord;
      store.serviceImprovementRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ServiceImprovementRecord>) => {
      const idx = store.serviceImprovementRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.serviceImprovementRecords[idx] = { ...store.serviceImprovementRecords[idx], ...data };
      return store.serviceImprovementRecords[idx];
    },
  },

  serviceUserAgreementRecords: {
    getAll: () => store.serviceUserAgreementRecords,
    getByChild: (childId: string) => store.serviceUserAgreementRecords.filter((r) => r.child_id === childId),
    create: (data: Omit<ServiceUserAgreementRecord, "id">) => {
      const record = { ...data, id: generateId("suar_") } as ServiceUserAgreementRecord;
      store.serviceUserAgreementRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ServiceUserAgreementRecord>) => {
      const idx = store.serviceUserAgreementRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.serviceUserAgreementRecords[idx] = { ...store.serviceUserAgreementRecords[idx], ...data };
      return store.serviceUserAgreementRecords[idx];
    },
  },

  shiftNoteRecords: {
    getAll: () => store.shiftNoteRecords,
    create: (data: Omit<ShiftNoteRecord, "id">) => {
      const record = { ...data, id: generateId("snr_") } as ShiftNoteRecord;
      store.shiftNoteRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<ShiftNoteRecord>) => {
      const idx = store.shiftNoteRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.shiftNoteRecords[idx] = { ...store.shiftNoteRecords[idx], ...data };
      return store.shiftNoteRecords[idx];
    },
  },

  siblingContactProtocolRecords: {
    getAll: () => store.siblingContactProtocolRecords,
    getByChild: (childId: string) => store.siblingContactProtocolRecords.filter((r) => r.child_id === childId),
    create: (data: Omit<SiblingContactProtocolRecord, "id">) => {
      const record = { ...data, id: generateId("scpr_") } as SiblingContactProtocolRecord;
      store.siblingContactProtocolRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SiblingContactProtocolRecord>) => {
      const idx = store.siblingContactProtocolRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.siblingContactProtocolRecords[idx] = { ...store.siblingContactProtocolRecords[idx], ...data };
      return store.siblingContactProtocolRecords[idx];
    },
  },

  sleepAssessmentRecords: {
    getAll: () => store.sleepAssessmentRecords,
    getByChild: (childId: string) => store.sleepAssessmentRecords.filter((r) => r.child_id === childId),
    create: (data: Omit<SleepAssessmentRecord, "id">) => {
      const record = { ...data, id: generateId("sar_") } as SleepAssessmentRecord;
      store.sleepAssessmentRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SleepAssessmentRecord>) => {
      const idx = store.sleepAssessmentRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.sleepAssessmentRecords[idx] = { ...store.sleepAssessmentRecords[idx], ...data };
      return store.sleepAssessmentRecords[idx];
    },
  },

  sleepInRecords: {
    getAll: () => store.sleepInRecords,
    create: (data: Omit<SleepInRecord, "id">) => {
      const record = { ...data, id: generateId("sir_") } as SleepInRecord;
      store.sleepInRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SleepInRecord>) => {
      const idx = store.sleepInRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.sleepInRecords[idx] = { ...store.sleepInRecords[idx], ...data };
      return store.sleepInRecords[idx];
    },
  },

  socialWorkerContactRecords: {
    getAll: () => store.socialWorkerContactRecords,
    getByChild: (childId: string) => store.socialWorkerContactRecords.filter((r) => r.child_id === childId),
    create: (data: Omit<SocialWorkerContactRecord, "id">) => {
      const record = { ...data, id: generateId("swcr_") } as SocialWorkerContactRecord;
      store.socialWorkerContactRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SocialWorkerContactRecord>) => {
      const idx = store.socialWorkerContactRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.socialWorkerContactRecords[idx] = { ...store.socialWorkerContactRecords[idx], ...data };
      return store.socialWorkerContactRecords[idx];
    },
  },

  staffCommunicationPreferenceRecords: {
    getAll: () => store.staffCommunicationPreferenceRecords,
    create: (data: Omit<StaffCommunicationPreferenceRecord, "id">) => {
      const record = { ...data, id: generateId("scpr2_") } as StaffCommunicationPreferenceRecord;
      store.staffCommunicationPreferenceRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffCommunicationPreferenceRecord>) => {
      const idx = store.staffCommunicationPreferenceRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffCommunicationPreferenceRecords[idx] = { ...store.staffCommunicationPreferenceRecords[idx], ...data };
      return store.staffCommunicationPreferenceRecords[idx];
    },
  },

  staffCompetencyRecords: {
    getAll: () => store.staffCompetencyRecords,
    create: (data: Omit<StaffCompetencyRecord, "id">) => {
      const record = { ...data, id: generateId("scr_") } as StaffCompetencyRecord;
      store.staffCompetencyRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffCompetencyRecord>) => {
      const idx = store.staffCompetencyRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffCompetencyRecords[idx] = { ...store.staffCompetencyRecords[idx], ...data };
      return store.staffCompetencyRecords[idx];
    },
  },

  staffDebriefRecords: {
    getAll: () => store.staffDebriefRecords,
    create: (data: Omit<StaffDebriefRecord, "id">) => {
      const record = { ...data, id: generateId("sdr_") } as StaffDebriefRecord;
      store.staffDebriefRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffDebriefRecord>) => {
      const idx = store.staffDebriefRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffDebriefRecords[idx] = { ...store.staffDebriefRecords[idx], ...data };
      return store.staffDebriefRecords[idx];
    },
  },

  staffDisciplinaryRecords: {
    getAll: () => store.staffDisciplinaryRecords,
    create: (data: Omit<StaffDisciplinaryRecord, "id">) => {
      const record = { ...data, id: generateId("sdpr_") } as StaffDisciplinaryRecord;
      store.staffDisciplinaryRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffDisciplinaryRecord>) => {
      const idx = store.staffDisciplinaryRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffDisciplinaryRecords[idx] = { ...store.staffDisciplinaryRecords[idx], ...data };
      return store.staffDisciplinaryRecords[idx];
    },
  },

  staffExitInterviewRecords: {
    getAll: () => store.staffExitInterviewRecords,
    create: (data: Omit<StaffExitInterviewRecord, "id">) => {
      const record = { ...data, id: generateId("seir_") } as StaffExitInterviewRecord;
      store.staffExitInterviewRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffExitInterviewRecord>) => {
      const idx = store.staffExitInterviewRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffExitInterviewRecords[idx] = { ...store.staffExitInterviewRecords[idx], ...data };
      return store.staffExitInterviewRecords[idx];
    },
  },

  staffGrievanceRecords: {
    getAll: () => store.staffGrievanceRecords,
    create: (data: Omit<StaffGrievanceRecord, "id">) => {
      const record = { ...data, id: generateId("sgr_") } as StaffGrievanceRecord;
      store.staffGrievanceRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffGrievanceRecord>) => {
      const idx = store.staffGrievanceRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffGrievanceRecords[idx] = { ...store.staffGrievanceRecords[idx], ...data };
      return store.staffGrievanceRecords[idx];
    },
  },

  staffHandbookAcknowledgementRecords: {
    getAll: () => store.staffHandbookAcknowledgementRecords,
    create: (data: Omit<StaffHandbookAcknowledgementRecord, "id">) => {
      const record = { ...data, id: generateId("shar_") } as StaffHandbookAcknowledgementRecord;
      store.staffHandbookAcknowledgementRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffHandbookAcknowledgementRecord>) => {
      const idx = store.staffHandbookAcknowledgementRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffHandbookAcknowledgementRecords[idx] = { ...store.staffHandbookAcknowledgementRecords[idx], ...data };
      return store.staffHandbookAcknowledgementRecords[idx];
    },
  },

  staffInductionRecords: {
    getAll: () => store.staffInductionRecords,
    create: (data: Omit<StaffInductionRecord, "id">) => {
      const record = { ...data, id: generateId("sinr_") } as StaffInductionRecord;
      store.staffInductionRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffInductionRecord>) => {
      const idx = store.staffInductionRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffInductionRecords[idx] = { ...store.staffInductionRecords[idx], ...data };
      return store.staffInductionRecords[idx];
    },
  },

  staffMeetingRecords: {
    getAll: () => store.staffMeetingRecords,
    create: (data: Omit<StaffMeetingRecord, "id">) => {
      const record = { ...data, id: generateId("smr_") } as StaffMeetingRecord;
      store.staffMeetingRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffMeetingRecord>) => {
      const idx = store.staffMeetingRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffMeetingRecords[idx] = { ...store.staffMeetingRecords[idx], ...data };
      return store.staffMeetingRecords[idx];
    },
  },

  staffRecognitionRecords: {
    getAll: () => store.staffRecognitionRecords,
    create: (data: Omit<StaffRecognitionRecord, "id">) => {
      const record = { ...data, id: generateId("srr_") } as StaffRecognitionRecord;
      store.staffRecognitionRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffRecognitionRecord>) => {
      const idx = store.staffRecognitionRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffRecognitionRecords[idx] = { ...store.staffRecognitionRecords[idx], ...data };
      return store.staffRecognitionRecords[idx];
    },
  },

  staffReflectionRecords: {
    getAll: () => store.staffReflectionRecords,
    create: (data: Omit<StaffReflectionRecord, "id">) => {
      const record = { ...data, id: generateId("srefr_") } as StaffReflectionRecord;
      store.staffReflectionRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffReflectionRecord>) => {
      const idx = store.staffReflectionRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffReflectionRecords[idx] = { ...store.staffReflectionRecords[idx], ...data };
      return store.staffReflectionRecords[idx];
    },
  },

  staffSaferCaringRecords: {
    getAll: () => store.staffSaferCaringRecords,
    create: (data: Omit<StaffSaferCaringRecord, "id">) => {
      const record = { ...data, id: generateId("sscr_") } as StaffSaferCaringRecord;
      store.staffSaferCaringRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffSaferCaringRecord>) => {
      const idx = store.staffSaferCaringRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffSaferCaringRecords[idx] = { ...store.staffSaferCaringRecords[idx], ...data };
      return store.staffSaferCaringRecords[idx];
    },
  },

  staffShadowingRecords: {
    getAll: () => store.staffShadowingRecords,
    create: (data: Omit<StaffShadowingRecord, "id">) => {
      const record = { ...data, id: generateId("sshr_") } as StaffShadowingRecord;
      store.staffShadowingRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffShadowingRecord>) => {
      const idx = store.staffShadowingRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffShadowingRecords[idx] = { ...store.staffShadowingRecords[idx], ...data };
      return store.staffShadowingRecords[idx];
    },
  },

  staffSicknessRecords: {
    getAll: () => store.staffSicknessRecords,
    create: (data: Omit<StaffSicknessRecord, "id">) => {
      const record = { ...data, id: generateId("sskr_") } as StaffSicknessRecord;
      store.staffSicknessRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffSicknessRecord>) => {
      const idx = store.staffSicknessRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffSicknessRecords[idx] = { ...store.staffSicknessRecords[idx], ...data };
      return store.staffSicknessRecords[idx];
    },
  },

  staffSupervisionThemeRecords: {
    getAll: () => store.staffSupervisionThemeRecords,
    create: (data: Omit<StaffSupervisionThemeRecord, "id">) => {
      const record = { ...data, id: generateId("sstr_") } as StaffSupervisionThemeRecord;
      store.staffSupervisionThemeRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffSupervisionThemeRecord>) => {
      const idx = store.staffSupervisionThemeRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffSupervisionThemeRecords[idx] = { ...store.staffSupervisionThemeRecords[idx], ...data };
      return store.staffSupervisionThemeRecords[idx];
    },
  },

  staffWellbeingRecords: {
    getAll: () => store.staffWellbeingRecords,
    create: (data: Omit<StaffWellbeingRecord, "id">) => {
      const record = { ...data, id: generateId("swbr_") } as StaffWellbeingRecord;
      store.staffWellbeingRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StaffWellbeingRecord>) => {
      const idx = store.staffWellbeingRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.staffWellbeingRecords[idx] = { ...store.staffWellbeingRecords[idx], ...data };
      return store.staffWellbeingRecords[idx];
    },
  },

  stakeholderFeedbackRecords: {
    getAll: () => store.stakeholderFeedbackRecords,
    create: (data: Omit<StakeholderFeedbackRecord, "id">) => {
      const record = { ...data, id: generateId("sfbr_") } as StakeholderFeedbackRecord;
      store.stakeholderFeedbackRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StakeholderFeedbackRecord>) => {
      const idx = store.stakeholderFeedbackRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.stakeholderFeedbackRecords[idx] = { ...store.stakeholderFeedbackRecords[idx], ...data };
      return store.stakeholderFeedbackRecords[idx];
    },
  },

  statutoryCheckRecords: {
    getAll: () => store.statutoryCheckRecords,
    create: (data: Omit<StatutoryCheckRecord, "id">) => {
      const record = { ...data, id: generateId("schr_") } as StatutoryCheckRecord;
      store.statutoryCheckRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StatutoryCheckRecord>) => {
      const idx = store.statutoryCheckRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.statutoryCheckRecords[idx] = { ...store.statutoryCheckRecords[idx], ...data };
      return store.statutoryCheckRecords[idx];
    },
  },

  statutoryVisitRecords: {
    getAll: () => store.statutoryVisitRecords,
    create: (data: Omit<StatutoryVisitRecord, "id">) => {
      const record = { ...data, id: generateId("svr_") } as StatutoryVisitRecord;
      store.statutoryVisitRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<StatutoryVisitRecord>) => {
      const idx = store.statutoryVisitRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.statutoryVisitRecords[idx] = { ...store.statutoryVisitRecords[idx], ...data };
      return store.statutoryVisitRecords[idx];
    },
  },

  subjectAccessRequestRecords: {
    getAll: () => store.subjectAccessRequestRecords,
    create: (data: Omit<SubjectAccessRequestRecord, "id">) => {
      const record = { ...data, id: generateId("sarr_") } as SubjectAccessRequestRecord;
      store.subjectAccessRequestRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SubjectAccessRequestRecord>) => {
      const idx = store.subjectAccessRequestRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.subjectAccessRequestRecords[idx] = { ...store.subjectAccessRequestRecords[idx], ...data };
      return store.subjectAccessRequestRecords[idx];
    },
  },

  supervisionMatrixRecords: {
    getAll: () => store.supervisionMatrixRecords,
    create: (data: Omit<SupervisionMatrixRecord, "id">) => {
      const record = { ...data, id: generateId("smr_") } as SupervisionMatrixRecord;
      store.supervisionMatrixRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SupervisionMatrixRecord>) => {
      const idx = store.supervisionMatrixRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.supervisionMatrixRecords[idx] = { ...store.supervisionMatrixRecords[idx], ...data };
      return store.supervisionMatrixRecords[idx];
    },
  },

  supervisionTrackerRecords: {
    getAll: () => store.supervisionTrackerRecords,
    create: (data: Omit<SupervisionTrackerRecord, "id">) => {
      const record = { ...data, id: generateId("str_") } as SupervisionTrackerRecord;
      store.supervisionTrackerRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<SupervisionTrackerRecord>) => {
      const idx = store.supervisionTrackerRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.supervisionTrackerRecords[idx] = { ...store.supervisionTrackerRecords[idx], ...data };
      return store.supervisionTrackerRecords[idx];
    },
  },

  therapeuticInputRecords: {
    getAll: () => store.therapeuticInputRecords,
    create: (data: Omit<TherapeuticInputRecord, "id">) => {
      const record = { ...data, id: generateId("tir_") } as TherapeuticInputRecord;
      store.therapeuticInputRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<TherapeuticInputRecord>) => {
      const idx = store.therapeuticInputRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.therapeuticInputRecords[idx] = { ...store.therapeuticInputRecords[idx], ...data };
      return store.therapeuticInputRecords[idx];
    },
  },

  transitionPlanningRecords: {
    getAll: () => store.transitionPlanningRecords,
    create: (data: Omit<TransitionPlanningRecord, "id">) => {
      const record = { ...data, id: generateId("tpr_") } as TransitionPlanningRecord;
      store.transitionPlanningRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<TransitionPlanningRecord>) => {
      const idx = store.transitionPlanningRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.transitionPlanningRecords[idx] = { ...store.transitionPlanningRecords[idx], ...data };
      return store.transitionPlanningRecords[idx];
    },
  },

  transportLogRecords: {
    getAll: () => store.transportLogRecords,
    create: (data: Omit<TransportLogRecord, "id">) => {
      const record = { ...data, id: generateId("tlr_") } as TransportLogRecord;
      store.transportLogRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<TransportLogRecord>) => {
      const idx = store.transportLogRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.transportLogRecords[idx] = { ...store.transportLogRecords[idx], ...data };
      return store.transportLogRecords[idx];
    },
  },

  unannouncedVisitRecords: {
    getAll: () => store.unannouncedVisitRecords,
    create: (data: Omit<UnannouncedVisitRecord, "id">) => {
      const record = { ...data, id: generateId("uvr_") } as UnannouncedVisitRecord;
      store.unannouncedVisitRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<UnannouncedVisitRecord>) => {
      const idx = store.unannouncedVisitRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.unannouncedVisitRecords[idx] = { ...store.unannouncedVisitRecords[idx], ...data };
      return store.unannouncedVisitRecords[idx];
    },
  },

  utilityMonitoringRecords: {
    getAll: () => store.utilityMonitoringRecords,
    create: (data: Omit<UtilityMonitoringRecord, "id">) => {
      const record = { ...data, id: generateId("umr_") } as UtilityMonitoringRecord;
      store.utilityMonitoringRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<UtilityMonitoringRecord>) => {
      const idx = store.utilityMonitoringRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.utilityMonitoringRecords[idx] = { ...store.utilityMonitoringRecords[idx], ...data };
      return store.utilityMonitoringRecords[idx];
    },
  },

  visitorsFeedbackRecords: {
    getAll: () => store.visitorsFeedbackRecords,
    create: (data: Omit<VisitorsFeedbackRecord, "id">) => {
      const record = { ...data, id: generateId("vfr_") } as VisitorsFeedbackRecord;
      store.visitorsFeedbackRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<VisitorsFeedbackRecord>) => {
      const idx = store.visitorsFeedbackRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.visitorsFeedbackRecords[idx] = { ...store.visitorsFeedbackRecords[idx], ...data };
      return store.visitorsFeedbackRecords[idx];
    },
  },

  waterHygieneRecords: {
    getAll: () => store.waterHygieneRecords,
    create: (data: Omit<WaterHygieneRecord, "id">) => {
      const record = { ...data, id: generateId("whr_") } as WaterHygieneRecord;
      store.waterHygieneRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<WaterHygieneRecord>) => {
      const idx = store.waterHygieneRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.waterHygieneRecords[idx] = { ...store.waterHygieneRecords[idx], ...data };
      return store.waterHygieneRecords[idx];
    },
  },

  wellbeingPulseSurveyRecords: {
    getAll: () => store.wellbeingPulseSurveyRecords,
    create: (data: Omit<WellbeingPulseSurveyRecord, "id">) => {
      const record = { ...data, id: generateId("wpsr_") } as WellbeingPulseSurveyRecord;
      store.wellbeingPulseSurveyRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<WellbeingPulseSurveyRecord>) => {
      const idx = store.wellbeingPulseSurveyRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.wellbeingPulseSurveyRecords[idx] = { ...store.wellbeingPulseSurveyRecords[idx], ...data };
      return store.wellbeingPulseSurveyRecords[idx];
    },
  },

  whistleblowingRecords: {
    getAll: () => store.whistleblowingRecords,
    create: (data: Omit<WhistleblowingRecord, "id">) => {
      const record = { ...data, id: generateId("wbr_") } as WhistleblowingRecord;
      store.whistleblowingRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<WhistleblowingRecord>) => {
      const idx = store.whistleblowingRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.whistleblowingRecords[idx] = { ...store.whistleblowingRecords[idx], ...data };
      return store.whistleblowingRecords[idx];
    },
  },

  wbInvestigationRecords: {
    getAll: () => store.wbInvestigationRecords,
    create: (data: Omit<WBInvestigationRecord, "id">) => {
      const record = { ...data, id: generateId("wbir_") } as WBInvestigationRecord;
      store.wbInvestigationRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<WBInvestigationRecord>) => {
      const idx = store.wbInvestigationRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.wbInvestigationRecords[idx] = { ...store.wbInvestigationRecords[idx], ...data };
      return store.wbInvestigationRecords[idx];
    },
  },

  healthRecordEntries: {
    getAll: () => store.healthRecordEntries,
    create: (data: Omit<HealthRecordEntry, "id">) => {
      const record = { ...data, id: generateId("hr_") } as HealthRecordEntry;
      store.healthRecordEntries.push(record);
      return record;
    },
    update: (id: string, data: Partial<HealthRecordEntry>) => {
      const idx = store.healthRecordEntries.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.healthRecordEntries[idx] = { ...store.healthRecordEntries[idx], ...data };
      return store.healthRecordEntries[idx];
    },
  },

  admissionReferrals: {
    getAll: () => store.admissionReferrals,
    create: (data: Omit<AdmissionReferral, "id">) => {
      const record = { ...data, id: generateId("ref_") } as AdmissionReferral;
      store.admissionReferrals.push(record);
      return record;
    },
    update: (id: string, data: Partial<AdmissionReferral>) => {
      const idx = store.admissionReferrals.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.admissionReferrals[idx] = { ...store.admissionReferrals[idx], ...data };
      return store.admissionReferrals[idx];
    },
  },

  ypSavingsAccountRecords: {
    getAll: () => store.ypSavingsAccountRecords,
    create: (data: Omit<YPSavingsAccountRecord, "id">) => {
      const record = { ...data, id: generateId("ysar_") } as YPSavingsAccountRecord;
      store.ypSavingsAccountRecords.push(record);
      return record;
    },
    update: (id: string, data: Partial<YPSavingsAccountRecord>) => {
      const idx = store.ypSavingsAccountRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ypSavingsAccountRecords[idx] = { ...store.ypSavingsAccountRecords[idx], ...data };
      return store.ypSavingsAccountRecords[idx];
    },
  },

  // ── Care Events ─────────────────────────────────────────────────────────────
  careEvents: {
    findAll: () => store.careEvents,
    findById: (id: string) => store.careEvents.find((e) => e.id === id),
    findCurrent: () => store.careEvents.filter((e) => e.is_current_version),
    findByChild: (childId: string) => store.careEvents.filter((e) => e.child_id === childId && e.is_current_version),
    findByStatus: (status: CareEvent["status"]) => store.careEvents.filter((e) => e.status === status && e.is_current_version),
    findNeedingManagerReview: () => store.careEvents.filter((e) => e.requires_manager_review && e.status === "manager_review_required"),
    findForReg40: () => store.careEvents.filter((e) => e.requires_reg40_triage && e.is_current_version),
    create: (data: Partial<CareEvent>): CareEvent => {
      const now = new Date().toISOString();
      const event: CareEvent = {
        id: generateId("ce"),
        home_id: "home_oak",
        child_id: null,
        shift_id: null,
        staff_id: data.staff_id ?? "staff_darren",
        verified_by: null,
        returned_by: null,
        locked_by: null,
        category: "general",
        title: "",
        content: "",
        mood_score: null,
        is_significant: false,
        status: "draft",
        event_date: todayStr(),
        event_time: null,
        requires_manager_review: false,
        requires_reg40_triage: false,
        contributes_to_reg45: false,
        contributes_to_annex_a: false,
        is_safeguarding: false,
        evidence_prompts: [],
        evidence_prompts_completed: false,
        staff_signature: false,
        staff_signed_at: null,
        manager_id: null,
        manager_review_note: null,
        manager_review_at: null,
        manager_review_completed: false,
        manager_signature: false,
        manager_notes: null,
        return_reason: null,
        returned_at: null,
        submitted_at: null,
        submitted_by: null,
        verified_at: null,
        locked_at: null,
        version: 1,
        previous_version_id: null,
        amendment_reason: null,
        amended_by: null,
        amended_at: null,
        is_current_version: true,
        aria_suggested_summary: null,
        aria_suggested_category: null,
        aria_suggested_routing: null,
        aria_suggested_reg45: null,
        aria_suggested_annex_a: null,
        aria_suggestions_reviewed: false,
        routing_summary: null,
        created_at: now,
        updated_at: now,
        ...data,
      };
      store.careEvents.push(event);
      return event;
    },
    patch: (id: string, data: Partial<CareEvent>): CareEvent | null => {
      const idx = store.careEvents.findIndex((e) => e.id === id);
      if (idx === -1) return null;
      store.careEvents[idx] = { ...store.careEvents[idx], ...data, updated_at: new Date().toISOString() };
      return store.careEvents[idx];
    },
  },

  // ── Care Event Routes ────────────────────────────────────────────────────────
  careEventRoutes: {
    findAll: () => store.careEventRoutes,
    findByCareEvent: (careEventId: string) => store.careEventRoutes.filter((r) => r.care_event_id === careEventId),
    findFailed: () => store.careEventRoutes.filter((r) => r.status === "failed" || r.status === "retry_required"),
    upsert: (data: Omit<CareEventRoute, "id" | "created_at" | "updated_at">): CareEventRoute => {
      const now = new Date().toISOString();
      const existing = store.careEventRoutes.findIndex(
        (r) => r.care_event_id === data.care_event_id && r.route_type === data.route_type
      );
      if (existing !== -1) {
        store.careEventRoutes[existing] = { ...store.careEventRoutes[existing], ...data, updated_at: now };
        return store.careEventRoutes[existing];
      }
      const route: CareEventRoute = { ...data, id: generateId("cer"), created_at: now, updated_at: now };
      store.careEventRoutes.push(route);
      return route;
    },
    patch: (id: string, data: Partial<CareEventRoute>): CareEventRoute | null => {
      const idx = store.careEventRoutes.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.careEventRoutes[idx] = { ...store.careEventRoutes[idx], ...data, updated_at: new Date().toISOString() };
      return store.careEventRoutes[idx];
    },
  },

  // ── Care Event Jobs ──────────────────────────────────────────────────────────
  careEventJobs: {
    findAll: () => store.careEventJobs,
    findPending: () => store.careEventJobs.filter((j) => j.status === "pending"),
    findFailed: () => store.careEventJobs.filter((j) => j.status === "failed" || j.status === "retry_required"),
    upsert: (data: Omit<CareEventJob, "id" | "created_at" | "updated_at">): CareEventJob => {
      const now = new Date().toISOString();
      const existing = store.careEventJobs.findIndex(
        (j) => j.care_event_id === data.care_event_id && j.job_type === data.job_type
      );
      if (existing !== -1) {
        store.careEventJobs[existing] = { ...store.careEventJobs[existing], ...data, updated_at: now };
        return store.careEventJobs[existing];
      }
      const job: CareEventJob = { ...data, id: generateId("cej"), created_at: now, updated_at: now };
      store.careEventJobs.push(job);
      return job;
    },
    patch: (id: string, data: Partial<CareEventJob>): CareEventJob | null => {
      const idx = store.careEventJobs.findIndex((j) => j.id === id);
      if (idx === -1) return null;
      store.careEventJobs[idx] = { ...store.careEventJobs[idx], ...data, updated_at: new Date().toISOString() };
      return store.careEventJobs[idx];
    },
  },

  // ── Care Event Audit Log ─────────────────────────────────────────────────────
  careEventAuditLog: {
    findAll: () => store.careEventAuditLog,
    findByCareEvent: (careEventId: string) => store.careEventAuditLog.filter((a) => a.care_event_id === careEventId),
    append: (data: Omit<CareEventAuditLog, "id" | "created_at">): CareEventAuditLog => {
      const entry: CareEventAuditLog = { ...data, id: generateId("ceal"), created_at: new Date().toISOString() };
      store.careEventAuditLog.push(entry);
      return entry;
    },
  },

  // ── Reg 45 Evidence Queue ────────────────────────────────────────────────────
  reg45EvidenceQueue: {
    findAll: () => store.reg45EvidenceQueue,
    findByHome: () => store.reg45EvidenceQueue,
    findPending: () => store.reg45EvidenceQueue.filter((e) => e.manager_decision === "pending"),
    upsert: (data: Omit<Reg45EvidenceItem, "id" | "created_at" | "updated_at">): Reg45EvidenceItem => {
      const now = new Date().toISOString();
      const existing = store.reg45EvidenceQueue.findIndex((e) => e.care_event_id === data.care_event_id);
      if (existing !== -1) {
        store.reg45EvidenceQueue[existing] = { ...store.reg45EvidenceQueue[existing], ...data, updated_at: now };
        return store.reg45EvidenceQueue[existing];
      }
      const item: Reg45EvidenceItem = { ...data, id: generateId("r45"), created_at: now, updated_at: now };
      store.reg45EvidenceQueue.push(item);
      return item;
    },
    patch: (id: string, data: Partial<Reg45EvidenceItem>): Reg45EvidenceItem | null => {
      const idx = store.reg45EvidenceQueue.findIndex((e) => e.id === id);
      if (idx === -1) return null;
      store.reg45EvidenceQueue[idx] = { ...store.reg45EvidenceQueue[idx], ...data, updated_at: new Date().toISOString() };
      return store.reg45EvidenceQueue[idx];
    },
  },

  // ── Annex A Evidence Queue ───────────────────────────────────────────────────
  annexAEvidenceQueue: {
    findAll: () => store.annexAEvidenceQueue,
    findPending: () => store.annexAEvidenceQueue.filter((e) => e.manager_decision === "pending"),
    upsert: (data: Omit<AnnexAEvidenceItem, "id" | "created_at" | "updated_at">): AnnexAEvidenceItem => {
      const now = new Date().toISOString();
      const existing = store.annexAEvidenceQueue.findIndex(
        (e) => e.care_event_id === data.care_event_id && e.annex_section === data.annex_section
      );
      if (existing !== -1) {
        store.annexAEvidenceQueue[existing] = { ...store.annexAEvidenceQueue[existing], ...data, updated_at: now };
        return store.annexAEvidenceQueue[existing];
      }
      const item: AnnexAEvidenceItem = { ...data, id: generateId("aae"), created_at: now, updated_at: now };
      store.annexAEvidenceQueue.push(item);
      return item;
    },
    patch: (id: string, data: Partial<AnnexAEvidenceItem>): AnnexAEvidenceItem | null => {
      const idx = store.annexAEvidenceQueue.findIndex((e) => e.id === id);
      if (idx === -1) return null;
      store.annexAEvidenceQueue[idx] = { ...store.annexAEvidenceQueue[idx], ...data, updated_at: new Date().toISOString() };
      return store.annexAEvidenceQueue[idx];
    },
  },

  // ── Child Daily Summaries ────────────────────────────────────────────────────
  childDailySummaries: {
    findAll: () => store.childDailySummaries,
    findByChild: (childId: string) => store.childDailySummaries.filter((s) => s.child_id === childId),
    findByDate: (date: string) => store.childDailySummaries.filter((s) => s.summary_date === date),
    upsert: (data: Omit<ChildDailySummary, "id" | "generated_at" | "updated_at">): ChildDailySummary => {
      const now = new Date().toISOString();
      const existing = store.childDailySummaries.findIndex(
        (s) => s.child_id === data.child_id && s.summary_date === data.summary_date && s.home_id === data.home_id
      );
      if (existing !== -1) {
        store.childDailySummaries[existing] = { ...store.childDailySummaries[existing], ...data, updated_at: now };
        return store.childDailySummaries[existing];
      }
      const summary: ChildDailySummary = { ...data, id: generateId("cds"), generated_at: now, updated_at: now };
      store.childDailySummaries.push(summary);
      return summary;
    },
  },

  // ── Filing Cabinet ───────────────────────────────────────────────────────────
  filingCabinet: {
    findAll: () => store.filingCabinet,
    findByHome: (homeId: string) => store.filingCabinet.filter((f) => f.home_id === homeId),
    findByChild: (childId: string) => store.filingCabinet.filter((f) => f.child_id === childId),
    findByCategory: (category: string) => store.filingCabinet.filter((f) => f.category === category),
    findByCareEvent: (careEventId: string) => store.filingCabinet.filter((f) => f.care_event_id === careEventId),
    upsert: (data: Omit<FilingCabinetItem, "id" | "created_at" | "updated_at">): FilingCabinetItem => {
      const now = new Date().toISOString();
      const existing = store.filingCabinet.findIndex(
        (f) => f.care_event_id === data.care_event_id && f.category === data.category
      );
      if (existing !== -1) {
        store.filingCabinet[existing] = { ...store.filingCabinet[existing], ...data, updated_at: now };
        return store.filingCabinet[existing];
      }
      const item: FilingCabinetItem = { ...data, id: generateId("fil"), created_at: now, updated_at: now };
      store.filingCabinet.push(item);
      return item;
    },
    patch: (id: string, data: Partial<FilingCabinetItem>): FilingCabinetItem | null => {
      const idx = store.filingCabinet.findIndex((f) => f.id === id);
      if (idx === -1) return null;
      store.filingCabinet[idx] = { ...store.filingCabinet[idx], ...data, updated_at: new Date().toISOString() };
      return store.filingCabinet[idx];
    },
  },

  // ── Branding ─────────────────────────────────────────────────────────────────
  branding: {
    getSystem: () => store.systemBranding,
    updateSystem: (data: Partial<typeof store.systemBranding>) => {
      store.systemBranding = { ...store.systemBranding, ...data, updated_at: new Date().toISOString() };
      return store.systemBranding;
    },
    getOrganisation: (orgId: string) =>
      store.organisationBrandings.find((b) => b.organisation_id === orgId) ?? null,
    upsertOrganisation: (orgId: string, data: Record<string, unknown>) => {
      const now = new Date().toISOString();
      const idx = store.organisationBrandings.findIndex((b) => b.organisation_id === orgId);
      if (idx !== -1) {
        store.organisationBrandings[idx] = { ...store.organisationBrandings[idx], ...data, updated_at: now };
        return store.organisationBrandings[idx];
      }
      const record = {
        id: generateId("obr"),
        organisation_id: orgId,
        company_name: (data.company_name as string) ?? "Unknown Organisation",
        trading_name: null,
        registered_provider_name: null,
        company_registration_number: null,
        ofsted_provider_reference: null,
        logo_url: null,
        document_logo_url: null,
        email_logo_url: null,
        primary_colour: null,
        secondary_colour: null,
        accent_colour: null,
        address: null,
        phone: null,
        email: null,
        website: null,
        responsible_individual_name: null,
        default_footer_text: null,
        confidentiality_notice:
          "This document is confidential. It contains sensitive information about children in care and must not be shared without authorisation.",
        created_at: now,
        updated_at: now,
        ...data,
      };
      store.organisationBrandings.push(record);
      return record;
    },
    getHome: (homeId: string) =>
      store.homeBrandings.find((b) => b.home_id === homeId) ?? null,
    upsertHome: (homeId: string, orgId: string, data: Record<string, unknown>) => {
      const now = new Date().toISOString();
      const idx = store.homeBrandings.findIndex((b) => b.home_id === homeId);
      if (idx !== -1) {
        store.homeBrandings[idx] = { ...store.homeBrandings[idx], ...data, updated_at: now };
        return store.homeBrandings[idx];
      }
      const record = {
        id: generateId("hbr"),
        home_id: homeId,
        organisation_id: orgId,
        home_name: (data.home_name as string) ?? "Unknown Home",
        home_address: null,
        ofsted_urn: null,
        registered_manager_name: null,
        responsible_individual_name: null,
        emergency_contact: null,
        safeguarding_contact: null,
        lado_contact: null,
        local_authority_contact: null,
        police_contact: null,
        logo_override_url: null,
        created_at: now,
        updated_at: now,
        ...data,
      };
      store.homeBrandings.push(record);
      return record;
    },
    // Document branding snapshots
    createSnapshot: (data: {
      document_id: string;
      document_type: string;
      organisation_id?: string;
      home_id?: string;
      branding_json: object;
      generated_by?: string;
    }) => {
      const snapshot = {
        id: generateId("dbs"),
        organisation_id: data.organisation_id ?? null,
        home_id: data.home_id ?? null,
        generated_by: data.generated_by ?? null,
        created_at: new Date().toISOString(),
        ...data,
      };
      store.documentBrandingSnapshots.push(snapshot);
      return snapshot;
    },
    getSnapshot: (documentId: string) =>
      store.documentBrandingSnapshots.find((s) => s.document_id === documentId) ?? null,
    // Branding audit log
    addAuditEntry: (entry: {
      changed_by: string;
      changed_by_name?: string;
      target_type: "system" | "organisation" | "home";
      target_id: string;
      field_name: string;
      previous_value?: string | null;
      new_value?: string | null;
      session_info?: string;
    }) => {
      const record = {
        id: generateId("bal"),
        changed_by_name: null,
        previous_value: null,
        new_value: null,
        session_info: null,
        created_at: new Date().toISOString(),
        ...entry,
      };
      store.brandingAuditLog.push(record);
      return record;
    },
    getAuditLog: (targetType?: string, targetId?: string) => {
      let log = store.brandingAuditLog;
      if (targetType) log = log.filter((e) => e.target_type === targetType);
      if (targetId) log = log.filter((e) => e.target_id === targetId);
      return log.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    },
  },

  // ── Saved Time Metrics ───────────────────────────────────────────────────────
  savedTimeMetrics: {
    findAll: () => store.savedTimeMetrics,
    findByHome: (homeId: string) => store.savedTimeMetrics.filter((m) => m.home_id === homeId),
    findByStaff: (staffId: string) => store.savedTimeMetrics.filter((m) => m.staff_id === staffId),
    findByCareEvent: (careEventId: string) => store.savedTimeMetrics.filter((m) => m.care_event_id === careEventId),
    totalMinutesSaved: (homeId: string): number =>
      store.savedTimeMetrics.filter((m) => m.home_id === homeId).reduce((sum, m) => sum + m.minutes_saved, 0),
    upsert: (data: Omit<SavedTimeMetric, "id" | "created_at">): SavedTimeMetric => {
      const now = new Date().toISOString();
      const existing = store.savedTimeMetrics.findIndex(
        (m) => m.care_event_id === data.care_event_id && m.route_type === data.route_type
      );
      if (existing !== -1) {
        store.savedTimeMetrics[existing] = { ...store.savedTimeMetrics[existing], ...data };
        return store.savedTimeMetrics[existing];
      }
      const metric: SavedTimeMetric = { ...data, id: generateId("stm"), created_at: now };
      store.savedTimeMetrics.push(metric);
      return metric;
    },
  },

  // ── Inspection Snapshots (M31) ───────────────────────────────────────────
  inspectionSnapshots: {
    findAll: (homeId?: string) =>
      homeId
        ? store.inspectionSnapshots.filter((s) => s.home_id === homeId)
        : store.inspectionSnapshots,
    findById: (id: string) =>
      store.inspectionSnapshots.find((s) => s.id === id) ?? null,
    create: (snap: PersistedInspectionSnapshot): PersistedInspectionSnapshot => {
      // immutable: reject duplicate ids
      if (store.inspectionSnapshots.some((s) => s.id === snap.id)) return snap;
      store.inspectionSnapshots.push(snap);
      return snap;
    },
  },

  // ── Persisted Reg 44 Packs (M35) ────────────────────────────────────────
  reg44Packs: {
    findAll: (homeId?: string) =>
      homeId
        ? store.reg44Packs.filter((p) => p.home_id === homeId)
        : store.reg44Packs,
    findById: (id: string) => store.reg44Packs.find((p) => p.id === id) ?? null,
    create: (pack: PersistedReg44Pack): PersistedReg44Pack => {
      // immutable: reject duplicate ids
      if (store.reg44Packs.some((p) => p.id === pack.id)) return pack;
      store.reg44Packs.push(pack);
      return pack;
    },
  },

  // ── Persisted Inspection Bundles (M43) ──────────────────────────────────
  inspectionBundles: {
    findAll: (homeId?: string) =>
      homeId
        ? store.inspectionBundles.filter((b) => b.home_id === homeId)
        : store.inspectionBundles,
    findById: (id: string) =>
      store.inspectionBundles.find((b) => b.id === id) ?? null,
    create: (b: PersistedInspectionBundle): PersistedInspectionBundle => {
      // immutable: reject duplicate ids
      if (store.inspectionBundles.some((x) => x.id === b.id)) return b;
      store.inspectionBundles.push(b);
      return b;
    },
  },

  // ── Trajectory Alert Acks (M48) ─────────────────────────────────────────
  trajectoryAlertAcks: {
    findAll: (homeId?: string): TrajectoryAlertAck[] =>
      homeId
        ? store.trajectoryAlertAcks.filter((a) => a.home_id === homeId)
        : store.trajectoryAlertAcks,
    findByAlertId: (alertId: string): TrajectoryAlertAck[] =>
      store.trajectoryAlertAcks.filter((a) => a.alert_id === alertId),
    create: (a: TrajectoryAlertAck): TrajectoryAlertAck => {
      // idempotent: an ack from the same user on the same alert is preserved
      if (store.trajectoryAlertAcks.some((x) => x.id === a.id)) {
        return store.trajectoryAlertAcks.find((x) => x.id === a.id)!;
      }
      store.trajectoryAlertAcks.push(a);
      return a;
    },
  },

  // ── Trajectory RI Escalation Acks (M52) ─────────────────────────────────
  trajectoryRiEscalationAcks: {
    findAll: (homeId?: string): TrajectoryRiEscalationAck[] =>
      homeId
        ? store.trajectoryRiEscalationAcks.filter((a) => a.home_id === homeId)
        : store.trajectoryRiEscalationAcks,
    findByEscalationId: (escalationId: string): TrajectoryRiEscalationAck[] =>
      store.trajectoryRiEscalationAcks.filter((a) => a.escalation_id === escalationId),
    create: (a: TrajectoryRiEscalationAck): TrajectoryRiEscalationAck => {
      if (store.trajectoryRiEscalationAcks.some((x) => x.id === a.id)) {
        return store.trajectoryRiEscalationAcks.find((x) => x.id === a.id)!;
      }
      store.trajectoryRiEscalationAcks.push(a);
      return a;
    },
  },

  // ── Export History (M36) ─────────────────────────────────────────────────────
  exportHistory: {
    findAll: (homeId?: string) =>
      homeId
        ? store.exportHistory.filter((e) => e.home_id === homeId)
        : store.exportHistory,
    findById: (id: string) => store.exportHistory.find((e) => e.id === id) ?? null,
    findForArtifact: (artifactId: string) =>
      store.exportHistory.filter((e) => e.artifact_id === artifactId),
    create: (entry: ExportHistoryEntry): ExportHistoryEntry => {
      // immutable append-only — reject duplicate ids
      if (store.exportHistory.some((e) => e.id === entry.id)) return entry;
      store.exportHistory.push(entry);
      return entry;
    },
  },

  // ── User Notification State (M34) ────────────────────────────────────────
  userNotificationStates: {
    findForUser: (userId: string, homeId?: string): UserNotificationState[] => {
      let items = store.userNotificationStates.filter((s) => s.user_id === userId);
      if (homeId) items = items.filter((s) => s.home_id === homeId);
      return items;
    },
    findOne: (userId: string, notificationId: string): UserNotificationState | null =>
      store.userNotificationStates.find(
        (s) => s.user_id === userId && s.notification_id === notificationId,
      ) ?? null,
    upsert: (input: {
      user_id: string;
      notification_id: string;
      home_id: string;
      read_at?: string | null;
      dismissed_at?: string | null;
    }): UserNotificationState => {
      const id = `${input.user_id}::${input.notification_id}`;
      const now = new Date().toISOString();
      const idx = store.userNotificationStates.findIndex((s) => s.id === id);
      if (idx === -1) {
        const row: UserNotificationState = {
          id,
          user_id: input.user_id,
          notification_id: input.notification_id,
          home_id: input.home_id,
          read_at: input.read_at ?? null,
          dismissed_at: input.dismissed_at ?? null,
          updated_at: now,
        };
        store.userNotificationStates.push(row);
        return row;
      }
      const existing = store.userNotificationStates[idx];
      const merged: UserNotificationState = {
        ...existing,
        read_at: input.read_at !== undefined ? input.read_at : existing.read_at,
        dismissed_at:
          input.dismissed_at !== undefined ? input.dismissed_at : existing.dismissed_at,
        updated_at: now,
      };
      store.userNotificationStates[idx] = merged;
      return merged;
    },
  },

  // ── ARIA Studio ───────────────────────────────────────────────────────────────
  ariaArtifacts: {
    findAll: (homeId?: string) =>
      homeId ? store.ariaArtifacts.filter((a) => a.home_id === homeId) : store.ariaArtifacts,
    findById: (id: string) => store.ariaArtifacts.find((a) => a.id === id) ?? null,
    findByChild: (childId: string) => store.ariaArtifacts.filter((a) => a.child_id === childId),
    findByStatus: (status: string, homeId?: string) => {
      let items = store.ariaArtifacts.filter((a) => a.status === status);
      if (homeId) items = items.filter((a) => a.home_id === homeId);
      return items;
    },
    findByType: (type: string, homeId?: string) => {
      let items = store.ariaArtifacts.filter((a) => a.artifact_type === type);
      if (homeId) items = items.filter((a) => a.home_id === homeId);
      return items;
    },
    create: (data: Omit<AriaArtifact, "id" | "created_at">): AriaArtifact => {
      const now = new Date().toISOString();
      const artifact: AriaArtifact = {
        ...data,
        id: generateId("art"),
        created_at: now,
      };
      store.ariaArtifacts.push(artifact);
      return artifact;
    },
    patch: (id: string, data: Partial<AriaArtifact>): AriaArtifact | null => {
      const idx = store.ariaArtifacts.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      store.ariaArtifacts[idx] = { ...store.ariaArtifacts[idx], ...data };
      return store.ariaArtifacts[idx];
    },
    stats: (homeId: string) => {
      const items = store.ariaArtifacts.filter((a) => a.home_id === homeId);
      return {
        total: items.length,
        draft: items.filter((a) => a.status === "draft").length,
        in_review: items.filter((a) => a.status === "in_review").length,
        approved: items.filter((a) => a.status === "approved").length,
        committed: items.filter((a) => a.status === "committed").length,
      };
    },
  },
  ariaSources: {
    findAll: (homeId?: string) =>
      homeId ? store.ariaSources.filter((s) => s.home_id === homeId) : store.ariaSources,
    findById: (id: string) => store.ariaSources.find((s) => s.id === id) ?? null,
    findByChild: (childId: string) => store.ariaSources.filter((s) => s.child_id === childId),
    findByIds: (ids: string[]) => store.ariaSources.filter((s) => ids.includes(s.id)),
    create: (data: Omit<AriaSource, "id" | "created_at" | "updated_at">): AriaSource => {
      const now = new Date().toISOString();
      const source: AriaSource = { ...data, id: generateId("src"), created_at: now, updated_at: now };
      store.ariaSources.push(source);
      return source;
    },
    patch: (id: string, data: Partial<AriaSource>): AriaSource | null => {
      const idx = store.ariaSources.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      store.ariaSources[idx] = { ...store.ariaSources[idx], ...data, updated_at: new Date().toISOString() };
      return store.ariaSources[idx];
    },
  },
  ariaArtifactVersions: {
    findByArtifact: (artifactId: string) =>
      store.ariaArtifactVersions.filter((v) => v.artifact_id === artifactId)
        .sort((a, b) => b.version_number - a.version_number),
    create: (data: Omit<AriaArtifactVersion, "id">): AriaArtifactVersion => {
      const version: AriaArtifactVersion = { ...data, id: generateId("av") };
      store.ariaArtifactVersions.push(version);
      return version;
    },
  },
  ariaArtifactReviews: {
    findByArtifact: (artifactId: string) =>
      store.ariaArtifactReviews.filter((r) => r.artifact_id === artifactId),
    create: (data: Omit<AriaArtifactReview, "id" | "created_at">): AriaArtifactReview => {
      const review: AriaArtifactReview = { ...data, id: generateId("rev"), created_at: new Date().toISOString() };
      store.ariaArtifactReviews.push(review);
      return review;
    },
  },
  ariaArtifactActions: {
    findByArtifact: (artifactId: string) =>
      store.ariaArtifactActions.filter((a) => a.artifact_id === artifactId),
    create: (data: Omit<AriaArtifactAction, "id" | "created_at">): AriaArtifactAction => {
      const action: AriaArtifactAction = { ...data, id: generateId("aac"), created_at: new Date().toISOString() };
      store.ariaArtifactActions.push(action);
      return action;
    },
    patch: (id: string, data: Partial<AriaArtifactAction>): AriaArtifactAction | null => {
      const idx = store.ariaArtifactActions.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      store.ariaArtifactActions[idx] = { ...store.ariaArtifactActions[idx], ...data };
      return store.ariaArtifactActions[idx];
    },
  },
  ariaQualityChecks: {
    findByArtifact: (artifactId: string) =>
      store.ariaQualityChecks.filter((q) => q.artifact_id === artifactId),
    findLatestByArtifact: (artifactId: string) =>
      store.ariaQualityChecks.filter((q) => q.artifact_id === artifactId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null,
    create: (data: Omit<AriaQualityCheck, "id" | "created_at">): AriaQualityCheck => {
      const check: AriaQualityCheck = { ...data, id: generateId("qc"), created_at: new Date().toISOString() };
      store.ariaQualityChecks.push(check);
      return check;
    },
  },
  ariaGaps: {
    findAll: (homeId?: string) =>
      homeId ? store.ariaGaps.filter((g) => g.home_id === homeId) : store.ariaGaps,
    findByChild: (childId: string) => store.ariaGaps.filter((g) => g.child_id === childId),
    findOpen: (homeId: string) =>
      store.ariaGaps.filter((g) => g.home_id === homeId && g.status === "open"),
    create: (data: Omit<AriaGap, "id" | "created_at">): AriaGap => {
      const gap: AriaGap = { ...data, id: generateId("gap"), created_at: new Date().toISOString() };
      store.ariaGaps.push(gap);
      return gap;
    },
    patch: (id: string, data: Partial<AriaGap>): AriaGap | null => {
      const idx = store.ariaGaps.findIndex((g) => g.id === id);
      if (idx === -1) return null;
      store.ariaGaps[idx] = { ...store.ariaGaps[idx], ...data };
      return store.ariaGaps[idx];
    },
  },
  ariaStudioAuditLog: {
    findAll: (homeId?: string) =>
      homeId ? store.ariaStudioAuditLog.filter((l) => l.home_id === homeId) : store.ariaStudioAuditLog,
    findByArtifact: (artifactId: string) =>
      store.ariaStudioAuditLog.filter((l) => l.artifact_id === artifactId),
    create: (data: Omit<AriaStudioAuditLog, "id" | "created_at">): AriaStudioAuditLog => {
      const entry: AriaStudioAuditLog = { ...data, id: generateId("aal"), created_at: new Date().toISOString() };
      store.ariaStudioAuditLog.push(entry);
      return entry;
    },
  },
  ariaHomeDynamicsSnapshots: {
    findAll: (homeId?: string) =>
      homeId
        ? store.ariaHomeDynamicsSnapshots.filter((s) => s.home_id === homeId)
        : store.ariaHomeDynamicsSnapshots,
    findById: (id: string) => store.ariaHomeDynamicsSnapshots.find((s) => s.id === id),
    latestForHome: (homeId: string) => {
      const list = store.ariaHomeDynamicsSnapshots
        .filter((s) => s.home_id === homeId)
        .sort((a, b) => b.generated_at.localeCompare(a.generated_at));
      return list[0] ?? null;
    },
    create: (data: Omit<AriaHomeDynamicsSnapshot, "id">): AriaHomeDynamicsSnapshot => {
      const snap: AriaHomeDynamicsSnapshot = { ...data, id: generateId("hds") };
      store.ariaHomeDynamicsSnapshots.push(snap);
      return snap;
    },
  },
  ariaSafeguardingPatterns: {
    findAll: (homeId?: string) =>
      homeId
        ? store.ariaSafeguardingPatterns.filter((p) => p.home_id === homeId)
        : store.ariaSafeguardingPatterns,
    findById: (id: string) => store.ariaSafeguardingPatterns.find((p) => p.id === id),
    findOpen: (homeId: string) =>
      store.ariaSafeguardingPatterns.filter(
        (p) => p.home_id === homeId && p.status === "open",
      ),
    create: (data: Omit<AriaSafeguardingPattern, "id">): AriaSafeguardingPattern => {
      const rec: AriaSafeguardingPattern = { ...data, id: generateId("sgp") };
      store.ariaSafeguardingPatterns.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaSafeguardingPattern>): AriaSafeguardingPattern | null => {
      const idx = store.ariaSafeguardingPatterns.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      store.ariaSafeguardingPatterns[idx] = { ...store.ariaSafeguardingPatterns[idx], ...data };
      return store.ariaSafeguardingPatterns[idx];
    },
  },
  ariaEarlyWarnings: {
    findAll: (homeId?: string) =>
      homeId
        ? store.ariaEarlyWarnings.filter((w) => w.home_id === homeId)
        : store.ariaEarlyWarnings,
    findById: (id: string) => store.ariaEarlyWarnings.find((w) => w.id === id),
    findActive: (homeId: string) =>
      store.ariaEarlyWarnings.filter(
        (w) => w.home_id === homeId && w.status === "active",
      ),
    create: (data: Omit<AriaEarlyWarning, "id" | "created_at">): AriaEarlyWarning => {
      const rec: AriaEarlyWarning = {
        ...data,
        id: generateId("ewn"),
        created_at: new Date().toISOString(),
      };
      store.ariaEarlyWarnings.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaEarlyWarning>): AriaEarlyWarning | null => {
      const idx = store.ariaEarlyWarnings.findIndex((w) => w.id === id);
      if (idx === -1) return null;
      store.ariaEarlyWarnings[idx] = { ...store.ariaEarlyWarnings[idx], ...data };
      return store.ariaEarlyWarnings[idx];
    },
  },
  // ── ARIA Practice Intelligence ─────────────────────────────────────────────
  ariaPracticeAssessments: {
    findAll: (homeId?: string) =>
      homeId ? store.ariaPracticeAssessments.filter((r) => r.home_id === homeId) : store.ariaPracticeAssessments,
    findById: (id: string) => store.ariaPracticeAssessments.find((r) => r.id === id),
    findByChild: (childId: string) => store.ariaPracticeAssessments.filter((r) => r.child_id === childId),
    create: (data: Omit<AriaPracticeAssessment, "id" | "created_at" | "updated_at">): AriaPracticeAssessment => {
      const now = new Date().toISOString();
      const rec: AriaPracticeAssessment = { ...data, id: generateId("apa"), created_at: now, updated_at: now };
      store.ariaPracticeAssessments.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaPracticeAssessment>): AriaPracticeAssessment | null => {
      const idx = store.ariaPracticeAssessments.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ariaPracticeAssessments[idx] = { ...store.ariaPracticeAssessments[idx], ...data, updated_at: new Date().toISOString() };
      return store.ariaPracticeAssessments[idx];
    },
  },
  ariaDevelopmentalGaps: {
    findAll: () => store.ariaDevelopmentalGaps,
    findById: (id: string) => store.ariaDevelopmentalGaps.find((r) => r.id === id),
    findByChild: (childId: string) => store.ariaDevelopmentalGaps.filter((r) => r.child_id === childId),
    create: (data: Omit<AriaDevelopmentalGapRecord, "id" | "created_at" | "updated_at">): AriaDevelopmentalGapRecord => {
      const now = new Date().toISOString();
      const rec: AriaDevelopmentalGapRecord = { ...data, id: generateId("adg"), created_at: now, updated_at: now };
      store.ariaDevelopmentalGaps.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaDevelopmentalGapRecord>): AriaDevelopmentalGapRecord | null => {
      const idx = store.ariaDevelopmentalGaps.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ariaDevelopmentalGaps[idx] = { ...store.ariaDevelopmentalGaps[idx], ...data, updated_at: new Date().toISOString() };
      return store.ariaDevelopmentalGaps[idx];
    },
  },
  ariaProtectiveFactorReviews: {
    findAll: () => store.ariaProtectiveFactorReviews,
    findById: (id: string) => store.ariaProtectiveFactorReviews.find((r) => r.id === id),
    findByChild: (childId: string) => store.ariaProtectiveFactorReviews.filter((r) => r.child_id === childId),
    create: (data: Omit<AriaProtectiveFactorReview, "id" | "created_at">): AriaProtectiveFactorReview => {
      const rec: AriaProtectiveFactorReview = { ...data, id: generateId("apf"), created_at: new Date().toISOString() };
      store.ariaProtectiveFactorReviews.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaProtectiveFactorReview>): AriaProtectiveFactorReview | null => {
      const idx = store.ariaProtectiveFactorReviews.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ariaProtectiveFactorReviews[idx] = { ...store.ariaProtectiveFactorReviews[idx], ...data };
      return store.ariaProtectiveFactorReviews[idx];
    },
  },
  ariaRelationshipDepthReviews: {
    findAll: () => store.ariaRelationshipDepthReviews,
    findById: (id: string) => store.ariaRelationshipDepthReviews.find((r) => r.id === id),
    findByChild: (childId: string) => store.ariaRelationshipDepthReviews.filter((r) => r.child_id === childId),
    create: (data: Omit<AriaRelationshipDepthReview, "id" | "created_at">): AriaRelationshipDepthReview => {
      const rec: AriaRelationshipDepthReview = { ...data, id: generateId("ard"), created_at: new Date().toISOString() };
      store.ariaRelationshipDepthReviews.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaRelationshipDepthReview>): AriaRelationshipDepthReview | null => {
      const idx = store.ariaRelationshipDepthReviews.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ariaRelationshipDepthReviews[idx] = { ...store.ariaRelationshipDepthReviews[idx], ...data };
      return store.ariaRelationshipDepthReviews[idx];
    },
  },
  ariaThresholdConsultations: {
    findAll: () => store.ariaThresholdConsultations,
    findById: (id: string) => store.ariaThresholdConsultations.find((r) => r.id === id),
    findByChild: (childId: string) => store.ariaThresholdConsultations.filter((r) => r.child_id === childId),
    create: (data: Omit<AriaThresholdConsultation, "id" | "created_at">): AriaThresholdConsultation => {
      const rec: AriaThresholdConsultation = { ...data, id: generateId("atc"), created_at: new Date().toISOString() };
      store.ariaThresholdConsultations.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaThresholdConsultation>): AriaThresholdConsultation | null => {
      const idx = store.ariaThresholdConsultations.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ariaThresholdConsultations[idx] = { ...store.ariaThresholdConsultations[idx], ...data };
      return store.ariaThresholdConsultations[idx];
    },
  },
  ariaStaffWellbeingSignals: {
    findAll: (homeId?: string) =>
      homeId ? store.ariaStaffWellbeingSignals.filter((r) => r.home_id === homeId) : store.ariaStaffWellbeingSignals,
    findById: (id: string) => store.ariaStaffWellbeingSignals.find((r) => r.id === id),
    findByStaff: (staffId: string) => store.ariaStaffWellbeingSignals.filter((r) => r.staff_id === staffId),
    create: (data: Omit<AriaStaffWellbeingSignal, "id" | "created_at">): AriaStaffWellbeingSignal => {
      const rec: AriaStaffWellbeingSignal = { ...data, id: generateId("aws"), created_at: new Date().toISOString() };
      store.ariaStaffWellbeingSignals.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaStaffWellbeingSignal>): AriaStaffWellbeingSignal | null => {
      const idx = store.ariaStaffWellbeingSignals.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ariaStaffWellbeingSignals[idx] = { ...store.ariaStaffWellbeingSignals[idx], ...data };
      return store.ariaStaffWellbeingSignals[idx];
    },
  },
  ariaPracticeFlags: {
    findAll: (homeId?: string) =>
      homeId ? store.ariaPracticeFlags.filter((r) => r.home_id === homeId) : store.ariaPracticeFlags,
    findById: (id: string) => store.ariaPracticeFlags.find((r) => r.id === id),
    findByChild: (childId: string) => store.ariaPracticeFlags.filter((r) => r.child_id === childId),
    findOpen: (homeId?: string) =>
      store.ariaPracticeFlags.filter((r) => !r.resolved && (!homeId || r.home_id === homeId)),
    create: (data: Omit<AriaPracticeFlag, "id" | "created_at">): AriaPracticeFlag => {
      const rec: AriaPracticeFlag = { ...data, id: generateId("apf_flag"), created_at: new Date().toISOString() };
      store.ariaPracticeFlags.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaPracticeFlag>): AriaPracticeFlag | null => {
      const idx = store.ariaPracticeFlags.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ariaPracticeFlags[idx] = { ...store.ariaPracticeFlags[idx], ...data };
      return store.ariaPracticeFlags[idx];
    },
  },
  ariaGuidanceRules: {
    findAll: () => store.ariaGuidanceRules,
    findById: (id: string) => store.ariaGuidanceRules.find((r) => r.id === id),
    findByKey: (key: string) => store.ariaGuidanceRules.find((r) => r.rule_key === key),
    create: (data: Omit<AriaGuidanceRule, "id" | "created_at">): AriaGuidanceRule => {
      const rec: AriaGuidanceRule = { ...data, id: generateId("agr"), created_at: new Date().toISOString() };
      store.ariaGuidanceRules.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaGuidanceRule>): AriaGuidanceRule | null => {
      const idx = store.ariaGuidanceRules.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ariaGuidanceRules[idx] = { ...store.ariaGuidanceRules[idx], ...data };
      return store.ariaGuidanceRules[idx];
    },
  },
  ariaCareGraphNodes: {
    findAll: (homeId?: string) =>
      homeId
        ? store.ariaCareGraphNodes.filter((n) => n.home_id === homeId)
        : store.ariaCareGraphNodes,
    findById: (id: string) => store.ariaCareGraphNodes.find((n) => n.id === id),
    findByChild: (homeId: string, childId: string) =>
      store.ariaCareGraphNodes.filter(
        (n) => n.home_id === homeId && (n.child_id === childId || n.child_id === null),
      ),
    create: (data: Omit<AriaCareGraphNode, "id" | "created_at">): AriaCareGraphNode => {
      const rec: AriaCareGraphNode = {
        ...data,
        id: generateId("cgn"),
        created_at: new Date().toISOString(),
      };
      store.ariaCareGraphNodes.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaCareGraphNode>): AriaCareGraphNode | null => {
      const idx = store.ariaCareGraphNodes.findIndex((n) => n.id === id);
      if (idx === -1) return null;
      store.ariaCareGraphNodes[idx] = { ...store.ariaCareGraphNodes[idx], ...data };
      return store.ariaCareGraphNodes[idx];
    },
    deleteByHome: (homeId: string, childId?: string | null) => {
      store.ariaCareGraphNodes = store.ariaCareGraphNodes.filter((n) => {
        if (n.home_id !== homeId) return true;
        if (childId === undefined) return false;
        return n.child_id !== childId && n.child_id !== null;
      });
    },
  },
  ariaCareGraphEdges: {
    findAll: (homeId?: string) =>
      homeId
        ? store.ariaCareGraphEdges.filter((e) => e.home_id === homeId)
        : store.ariaCareGraphEdges,
    findById: (id: string) => store.ariaCareGraphEdges.find((e) => e.id === id),
    findByNode: (nodeId: string) =>
      store.ariaCareGraphEdges.filter(
        (e) => e.from_node_id === nodeId || e.to_node_id === nodeId,
      ),
    create: (data: Omit<AriaCareGraphEdge, "id" | "created_at">): AriaCareGraphEdge => {
      const rec: AriaCareGraphEdge = {
        ...data,
        id: generateId("cge"),
        created_at: new Date().toISOString(),
      };
      store.ariaCareGraphEdges.push(rec);
      return rec;
    },
    deleteByHome: (homeId: string) => {
      store.ariaCareGraphEdges = store.ariaCareGraphEdges.filter((e) => e.home_id !== homeId);
    },
    deleteByNodeIds: (nodeIds: Set<string>) => {
      store.ariaCareGraphEdges = store.ariaCareGraphEdges.filter(
        (e) => !nodeIds.has(e.from_node_id) && !nodeIds.has(e.to_node_id),
      );
    },
  },
  ariaFormulations: {
    findAll: (homeId?: string) =>
      homeId
        ? store.ariaFormulations.filter((f) => f.home_id === homeId)
        : store.ariaFormulations,
    findById: (id: string) => store.ariaFormulations.find((f) => f.id === id),
    findByChild: (homeId: string, childId: string) =>
      store.ariaFormulations.filter(
        (f) => f.home_id === homeId && f.child_id === childId,
      ),
    findActiveForChild: (homeId: string, childId: string) =>
      store.ariaFormulations.find(
        (f) =>
          f.home_id === homeId &&
          f.child_id === childId &&
          (f.status === "ai_draft" || f.status === "in_review" || f.status === "approved"),
      ),
    create: (data: Omit<AriaFormulation, "id">): AriaFormulation => {
      const rec: AriaFormulation = { ...data, id: generateId("frm") };
      store.ariaFormulations.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaFormulation>): AriaFormulation | null => {
      const idx = store.ariaFormulations.findIndex((f) => f.id === id);
      if (idx === -1) return null;
      store.ariaFormulations[idx] = { ...store.ariaFormulations[idx], ...data };
      return store.ariaFormulations[idx];
    },
  },
  ariaDecisionRecommendations: {
    findAll: (homeId?: string) =>
      homeId
        ? store.ariaDecisionRecommendations.filter((r) => r.home_id === homeId)
        : store.ariaDecisionRecommendations,
    findById: (id: string) => store.ariaDecisionRecommendations.find((r) => r.id === id),
    findOpen: (homeId: string) =>
      store.ariaDecisionRecommendations.filter(
        (r) =>
          r.home_id === homeId &&
          (r.status === "ai_draft" || r.status === "modified" || r.status === "deferred"),
      ),
    create: (data: Omit<AriaDecisionRecommendation, "id">): AriaDecisionRecommendation => {
      const rec: AriaDecisionRecommendation = { ...data, id: generateId("rec") };
      store.ariaDecisionRecommendations.push(rec);
      return rec;
    },
    patch: (
      id: string,
      data: Partial<AriaDecisionRecommendation>,
    ): AriaDecisionRecommendation | null => {
      const idx = store.ariaDecisionRecommendations.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ariaDecisionRecommendations[idx] = {
        ...store.ariaDecisionRecommendations[idx],
        ...data,
      };
      return store.ariaDecisionRecommendations[idx];
    },
  },
  ariaReg45EvidenceItems: {
    findAll: (homeId?: string) =>
      homeId
        ? store.ariaReg45EvidenceItems.filter((e) => e.home_id === homeId)
        : store.ariaReg45EvidenceItems,
    findById: (id: string) => store.ariaReg45EvidenceItems.find((e) => e.id === id),
    findInPeriod: (homeId: string, periodStart: string, periodEnd: string) =>
      store.ariaReg45EvidenceItems.filter(
        (e) =>
          e.home_id === homeId &&
          e.period_start === periodStart &&
          e.period_end === periodEnd,
      ),
    findBySource: (homeId: string, sourceTable: string, sourceId: string) =>
      store.ariaReg45EvidenceItems.find(
        (e) => e.home_id === homeId && e.source_table === sourceTable && e.source_id === sourceId,
      ),
    create: (data: Omit<AriaReg45EvidenceItem, "id">): AriaReg45EvidenceItem => {
      const rec: AriaReg45EvidenceItem = { ...data, id: generateId("r45") };
      store.ariaReg45EvidenceItems.push(rec);
      return rec;
    },
    patch: (
      id: string,
      data: Partial<AriaReg45EvidenceItem>,
    ): AriaReg45EvidenceItem | null => {
      const idx = store.ariaReg45EvidenceItems.findIndex((e) => e.id === id);
      if (idx === -1) return null;
      store.ariaReg45EvidenceItems[idx] = {
        ...store.ariaReg45EvidenceItems[idx],
        ...data,
      };
      return store.ariaReg45EvidenceItems[idx];
    },
  },
  ariaAnnexASnapshots: {
    findAll: (homeId?: string) =>
      homeId
        ? store.ariaAnnexASnapshots.filter((s) => s.home_id === homeId)
        : store.ariaAnnexASnapshots,
    findById: (id: string) => store.ariaAnnexASnapshots.find((s) => s.id === id),
    findLatestDraft: (homeId: string): AriaAnnexASnapshot | undefined =>
      [...store.ariaAnnexASnapshots]
        .filter((s) => s.home_id === homeId && s.status === "draft")
        .sort((a, b) => b.generated_at.localeCompare(a.generated_at))[0],
    create: (data: Omit<AriaAnnexASnapshot, "id">): AriaAnnexASnapshot => {
      const rec: AriaAnnexASnapshot = { ...data, id: generateId("axa") };
      store.ariaAnnexASnapshots.push(rec);
      return rec;
    },
    patch: (
      id: string,
      data: Partial<AriaAnnexASnapshot>,
    ): AriaAnnexASnapshot | null => {
      const idx = store.ariaAnnexASnapshots.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      store.ariaAnnexASnapshots[idx] = {
        ...store.ariaAnnexASnapshots[idx],
        ...data,
      };
      return store.ariaAnnexASnapshots[idx];
    },
  },
  ariaReg45Reports: {
    findAll: (homeId?: string) =>
      homeId
        ? store.ariaReg45Reports.filter((r) => r.home_id === homeId)
        : store.ariaReg45Reports,
    findById: (id: string) => store.ariaReg45Reports.find((r) => r.id === id),
    create: (data: Omit<AriaReg45Report, "id">): AriaReg45Report => {
      const rec: AriaReg45Report = { ...data, id: generateId("r45rep") };
      store.ariaReg45Reports.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaReg45Report>): AriaReg45Report | null => {
      const idx = store.ariaReg45Reports.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ariaReg45Reports[idx] = { ...store.ariaReg45Reports[idx], ...data };
      return store.ariaReg45Reports[idx];
    },
  },
  ariaSuggestedRecords: {
    findAll: (homeId?: string) =>
      homeId
        ? store.ariaSuggestedRecords.filter((s) => s.home_id === homeId)
        : store.ariaSuggestedRecords,
    findById: (id: string) => store.ariaSuggestedRecords.find((s) => s.id === id),
    findByStatus: (homeId: string, status: AriaSuggestedRecord["status"]) =>
      store.ariaSuggestedRecords.filter(
        (s) => s.home_id === homeId && s.status === status,
      ),
    create: (data: Omit<AriaSuggestedRecord, "id">): AriaSuggestedRecord => {
      const rec: AriaSuggestedRecord = { ...data, id: generateId("asug") };
      store.ariaSuggestedRecords.push(rec);
      return rec;
    },
    patch: (
      id: string,
      data: Partial<AriaSuggestedRecord>,
    ): AriaSuggestedRecord | null => {
      const idx = store.ariaSuggestedRecords.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      store.ariaSuggestedRecords[idx] = {
        ...store.ariaSuggestedRecords[idx],
        ...data,
      };
      return store.ariaSuggestedRecords[idx];
    },
  },
  ariaCommittedRecords: {
    findAll: (homeId?: string) =>
      homeId
        ? store.ariaCommittedRecords.filter((c) => c.home_id === homeId)
        : store.ariaCommittedRecords,
    findById: (id: string) => store.ariaCommittedRecords.find((c) => c.id === id),
    create: (data: Omit<AriaCommittedRecord, "id">): AriaCommittedRecord => {
      const rec: AriaCommittedRecord = { ...data, id: generateId("acom") };
      store.ariaCommittedRecords.push(rec);
      return rec;
    },
  },
  ariaReg40Triages: {
    findAll: (homeId?: string) =>
      homeId
        ? store.ariaReg40Triages.filter((t) => t.home_id === homeId)
        : store.ariaReg40Triages,
    findById: (id: string) => store.ariaReg40Triages.find((t) => t.id === id),
    findBySourceEvent: (eventId: string) =>
      store.ariaReg40Triages.find((t) => t.source_event_id === eventId),
    create: (data: Omit<AriaReg40Triage, "id">): AriaReg40Triage => {
      const rec: AriaReg40Triage = { ...data, id: generateId("reg40") };
      store.ariaReg40Triages.push(rec);
      return rec;
    },
    patch: (id: string, data: Partial<AriaReg40Triage>): AriaReg40Triage | null => {
      const idx = store.ariaReg40Triages.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      store.ariaReg40Triages[idx] = { ...store.ariaReg40Triages[idx], ...data };
      return store.ariaReg40Triages[idx];
    },
  },
  wakeUpRoutines: {
    findAll: () => store.wakeUpRoutines,
    findByChild: (childId: string) => store.wakeUpRoutines.filter((r) => r.child_id === childId),
    findByHome: (homeId: string) => store.wakeUpRoutines.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.wakeUpRoutines.find((r) => r.id === id),
    create: (data: Omit<WakeUpRoutine, "id" | "created_at">): WakeUpRoutine => {
      const record: WakeUpRoutine = { ...data, id: generateId("wur"), created_at: new Date().toISOString() };
      store.wakeUpRoutines.push(record);
      return record;
    },
    patch: (id: string, data: Partial<WakeUpRoutine>): WakeUpRoutine | null => {
      const idx = store.wakeUpRoutines.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.wakeUpRoutines[idx] = { ...store.wakeUpRoutines[idx], ...data };
      return store.wakeUpRoutines[idx];
    },
  },
  outcomeMeasures: {
    findAll: () => store.outcomeMeasures,
    findByChild: (childId: string) => store.outcomeMeasures.filter((r) => r.child_id === childId),
    findByHome: (homeId: string) => store.outcomeMeasures.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.outcomeMeasures.find((r) => r.id === id),
    create: (data: Omit<OutcomeMeasure, "id" | "created_at">): OutcomeMeasure => {
      const record: OutcomeMeasure = { ...data, id: generateId("om"), created_at: new Date().toISOString() };
      store.outcomeMeasures.push(record);
      return record;
    },
    patch: (id: string, data: Partial<OutcomeMeasure>): OutcomeMeasure | null => {
      const idx = store.outcomeMeasures.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.outcomeMeasures[idx] = { ...store.outcomeMeasures[idx], ...data };
      return store.outcomeMeasures[idx];
    },
  },
  welfareProtocols: {
    findAll: () => store.welfareProtocols,
    findByChild: (childId: string) => store.welfareProtocols.filter((r) => r.child_id === childId),
    findByHome: (homeId: string) => store.welfareProtocols.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.welfareProtocols.find((r) => r.id === id),
    create: (data: Omit<WelfareProtocol, "id" | "created_at">): WelfareProtocol => {
      const record: WelfareProtocol = { ...data, id: generateId("wcp"), created_at: new Date().toISOString() };
      store.welfareProtocols.push(record);
      return record;
    },
    patch: (id: string, data: Partial<WelfareProtocol>): WelfareProtocol | null => {
      const idx = store.welfareProtocols.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.welfareProtocols[idx] = { ...store.welfareProtocols[idx], ...data };
      return store.welfareProtocols[idx];
    },
  },
  youngCarerRecords: {
    findAll: () => store.youngCarerRecords,
    findByChild: (childId: string) => store.youngCarerRecords.filter((r) => r.child_id === childId),
    findByHome: (homeId: string) => store.youngCarerRecords.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.youngCarerRecords.find((r) => r.id === id),
    create: (data: Omit<YoungCarerRecord, "id" | "created_at">): YoungCarerRecord => {
      const record: YoungCarerRecord = { ...data, id: generateId("yc"), created_at: new Date().toISOString() };
      store.youngCarerRecords.push(record);
      return record;
    },
    patch: (id: string, data: Partial<YoungCarerRecord>): YoungCarerRecord | null => {
      const idx = store.youngCarerRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.youngCarerRecords[idx] = { ...store.youngCarerRecords[idx], ...data };
      return store.youngCarerRecords[idx];
    },
  },
  ypJobs: {
    findAll: () => store.ypJobs,
    findByChild: (childId: string) => store.ypJobs.filter((r) => r.child_id === childId),
    findByHome: (homeId: string) => store.ypJobs.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.ypJobs.find((r) => r.id === id),
    create: (data: Omit<YpJob, "id" | "created_at">): YpJob => {
      const record: YpJob = { ...data, id: generateId("ypj"), created_at: new Date().toISOString() };
      store.ypJobs.push(record);
      return record;
    },
    patch: (id: string, data: Partial<YpJob>): YpJob | null => {
      const idx = store.ypJobs.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.ypJobs[idx] = { ...store.ypJobs[idx], ...data };
      return store.ypJobs[idx];
    },
  },
  transportRAs: {
    findAll: () => store.transportRAs,
    findByChild: (childId: string) => store.transportRAs.filter((r) => r.child_id === childId),
    findByHome: (homeId: string) => store.transportRAs.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.transportRAs.find((r) => r.id === id),
    create: (data: Omit<TransportRA, "id" | "created_at">): TransportRA => {
      const record: TransportRA = { ...data, id: generateId("tra"), created_at: new Date().toISOString() };
      store.transportRAs.push(record);
      return record;
    },
    patch: (id: string, data: Partial<TransportRA>): TransportRA | null => {
      const idx = store.transportRAs.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.transportRAs[idx] = { ...store.transportRAs[idx], ...data };
      return store.transportRAs[idx];
    },
  },
  utilityBills: {
    findAll: () => store.utilityBills,
    findByHome: (homeId: string) => store.utilityBills.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.utilityBills.find((r) => r.id === id),
    create: (data: Omit<UtilityBill, "id" | "created_at">): UtilityBill => {
      const record: UtilityBill = { ...data, id: generateId("ub"), created_at: new Date().toISOString() };
      store.utilityBills.push(record);
      return record;
    },
    patch: (id: string, data: Partial<UtilityBill>): UtilityBill | null => {
      const idx = store.utilityBills.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.utilityBills[idx] = { ...store.utilityBills[idx], ...data };
      return store.utilityBills[idx];
    },
  },
  timelineEvents: {
    findAll: () => store.timelineEvents,
    findByChild: (childId: string) => store.timelineEvents.filter((r) => r.child_id === childId),
    findByHome: (homeId: string) => store.timelineEvents.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.timelineEvents.find((r) => r.id === id),
    create: (data: Omit<TimelineEvent, "id" | "created_at">): TimelineEvent => {
      const record: TimelineEvent = { ...data, id: generateId("tte"), created_at: new Date().toISOString() };
      store.timelineEvents.push(record);
      return record;
    },
    patch: (id: string, data: Partial<TimelineEvent>): TimelineEvent | null => {
      const idx = store.timelineEvents.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.timelineEvents[idx] = { ...store.timelineEvents[idx], ...data };
      return store.timelineEvents[idx];
    },
  },
  welcomeTours: {
    findAll: () => store.welcomeTours,
    findByChild: (childId: string) => store.welcomeTours.filter((r) => r.child_id === childId),
    findByHome: (homeId: string) => store.welcomeTours.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.welcomeTours.find((r) => r.id === id),
    create: (data: Omit<WelcomeTour, "id" | "created_at">): WelcomeTour => {
      const record: WelcomeTour = { ...data, id: generateId("wt"), created_at: new Date().toISOString() };
      store.welcomeTours.push(record);
      return record;
    },
    patch: (id: string, data: Partial<WelcomeTour>): WelcomeTour | null => {
      const idx = store.welcomeTours.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.welcomeTours[idx] = { ...store.welcomeTours[idx], ...data };
      return store.welcomeTours[idx];
    },
  },
  transAffirmingPlans: {
    findAll: () => store.transAffirmingPlans,
    findByChild: (childId: string) => store.transAffirmingPlans.filter((r) => r.child_id === childId),
    findByHome: (homeId: string) => store.transAffirmingPlans.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.transAffirmingPlans.find((r) => r.id === id),
    create: (data: Omit<TransAffirmingPlan, "id" | "created_at">): TransAffirmingPlan => {
      const record: TransAffirmingPlan = { ...data, id: generateId("tap"), created_at: new Date().toISOString() };
      store.transAffirmingPlans.push(record);
      return record;
    },
    patch: (id: string, data: Partial<TransAffirmingPlan>): TransAffirmingPlan | null => {
      const idx = store.transAffirmingPlans.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.transAffirmingPlans[idx] = { ...store.transAffirmingPlans[idx], ...data };
      return store.transAffirmingPlans[idx];
    },
  },
  vehiclePreUseChecks: {
    findAll: () => store.vehiclePreUseChecks,
    findByHome: (homeId: string) => store.vehiclePreUseChecks.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.vehiclePreUseChecks.find((r) => r.id === id),
    create: (data: Omit<VehiclePreUseCheck, "id" | "created_at">): VehiclePreUseCheck => {
      const record: VehiclePreUseCheck = { ...data, id: generateId("vpc"), created_at: new Date().toISOString() };
      store.vehiclePreUseChecks.push(record);
      return record;
    },
    patch: (id: string, data: Partial<VehiclePreUseCheck>): VehiclePreUseCheck | null => {
      const idx = store.vehiclePreUseChecks.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.vehiclePreUseChecks[idx] = { ...store.vehiclePreUseChecks[idx], ...data };
      return store.vehiclePreUseChecks[idx];
    },
  },
  civicRecords: {
    findAll: () => store.civicRecords,
    findByChild: (childId: string) => store.civicRecords.filter((r) => r.child_id === childId),
    findByHome: (homeId: string) => store.civicRecords.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.civicRecords.find((r) => r.id === id),
    create: (data: Omit<CivicRecord, "id" | "created_at">): CivicRecord => {
      const record: CivicRecord = { ...data, id: generateId("civ"), created_at: new Date().toISOString() };
      store.civicRecords.push(record);
      return record;
    },
    patch: (id: string, data: Partial<CivicRecord>): CivicRecord | null => {
      const idx = store.civicRecords.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.civicRecords[idx] = { ...store.civicRecords[idx], ...data };
      return store.civicRecords[idx];
    },
  },
  warmWelcomePacks: {
    findAll: () => store.warmWelcomePacks,
    findByChild: (childId: string) => store.warmWelcomePacks.filter((r) => r.child_id === childId),
    findByHome: (homeId: string) => store.warmWelcomePacks.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.warmWelcomePacks.find((r) => r.id === id),
    create: (data: Omit<WarmWelcomePack, "id" | "created_at">): WarmWelcomePack => {
      const record: WarmWelcomePack = { ...data, id: generateId("wwp"), created_at: new Date().toISOString() };
      store.warmWelcomePacks.push(record);
      return record;
    },
    patch: (id: string, data: Partial<WarmWelcomePack>): WarmWelcomePack | null => {
      const idx = store.warmWelcomePacks.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.warmWelcomePacks[idx] = { ...store.warmWelcomePacks[idx], ...data };
      return store.warmWelcomePacks[idx];
    },
  },
  therapeuticStaffTraining: {
    findAll: () => store.therapeuticStaffTraining,
    findByHome: (homeId: string) => store.therapeuticStaffTraining.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.therapeuticStaffTraining.find((r) => r.id === id),
    create: (data: Omit<TherapeuticStaffTraining, "id" | "created_at">): TherapeuticStaffTraining => {
      const record: TherapeuticStaffTraining = { ...data, id: generateId("tst"), created_at: new Date().toISOString() };
      store.therapeuticStaffTraining.push(record);
      return record;
    },
    patch: (id: string, data: Partial<TherapeuticStaffTraining>): TherapeuticStaffTraining | null => {
      const idx = store.therapeuticStaffTraining.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.therapeuticStaffTraining[idx] = { ...store.therapeuticStaffTraining[idx], ...data };
      return store.therapeuticStaffTraining[idx];
    },
  },
  therapeuticChildImpact: {
    findAll: () => store.therapeuticChildImpact,
    findByChild: (childId: string) => store.therapeuticChildImpact.filter((r) => r.child_id === childId),
    findByHome: (homeId: string) => store.therapeuticChildImpact.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.therapeuticChildImpact.find((r) => r.id === id),
    create: (data: Omit<TherapeuticChildImpact, "id" | "created_at">): TherapeuticChildImpact => {
      const record: TherapeuticChildImpact = { ...data, id: generateId("tci"), created_at: new Date().toISOString() };
      store.therapeuticChildImpact.push(record);
      return record;
    },
    patch: (id: string, data: Partial<TherapeuticChildImpact>): TherapeuticChildImpact | null => {
      const idx = store.therapeuticChildImpact.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.therapeuticChildImpact[idx] = { ...store.therapeuticChildImpact[idx], ...data };
      return store.therapeuticChildImpact[idx];
    },
  },
  homeEmergencyContacts: {
    findAll: () => store.homeEmergencyContacts,
    findByHome: (homeId: string) => store.homeEmergencyContacts.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.homeEmergencyContacts.find((r) => r.id === id),
    create: (data: Omit<HomeEmergencyContact, "id" | "created_at">): HomeEmergencyContact => {
      const record: HomeEmergencyContact = { ...data, id: generateId("hec"), created_at: new Date().toISOString() };
      store.homeEmergencyContacts.push(record);
      return record;
    },
    patch: (id: string, data: Partial<HomeEmergencyContact>): HomeEmergencyContact | null => {
      const idx = store.homeEmergencyContacts.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.homeEmergencyContacts[idx] = { ...store.homeEmergencyContacts[idx], ...data };
      return store.homeEmergencyContacts[idx];
    },
  },

  riGovernanceReports: {
    findAll: () => store.riGovernanceReports,
    findByHome: (homeId: string) => store.riGovernanceReports.filter((r) => r.home_id === homeId),
    findById: (id: string) => store.riGovernanceReports.find((r) => r.id === id),
    create: (data: Partial<RiGovernanceReport>): RiGovernanceReport => {
      const now = new Date().toISOString();
      const record = { ...data, id: generateId("rigr"), created_at: now, updated_at: now } as RiGovernanceReport;
      store.riGovernanceReports.push(record);
      return record;
    },
    patch: (id: string, data: Partial<RiGovernanceReport>): RiGovernanceReport | null => {
      const idx = store.riGovernanceReports.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      store.riGovernanceReports[idx] = { ...store.riGovernanceReports[idx], ...data, updated_at: new Date().toISOString() };
      return store.riGovernanceReports[idx];
    },
  },
};
