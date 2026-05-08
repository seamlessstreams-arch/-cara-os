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
} from "@/types/extended";
import { generateId, todayStr, daysFromNow } from "@/lib/utils";

// ── Mutable collections ───────────────────────────────────────────────────────

const store = {
  home: { ...HOME } as Home,
  staff: [...STAFF] as StaffMember[],
  youngPeople: [...YOUNG_PEOPLE] as YoungPerson[],
  tasks: [...TASKS] as Task[],
  incidents: [...INCIDENTS] as Incident[],
  shifts: [...SHIFTS] as Shift[],
  medications: [...MEDICATIONS] as Medication[],
  medicationAdministrations: [] as MedicationAdministration[],
  dailyLog: [...DAILY_LOG] as DailyLogEntry[],
  leaveRequests: [...LEAVE_REQUESTS] as LeaveRequest[],
  trainingRecords: [...TRAINING_RECORDS] as TrainingRecord[],
  missingEpisodes: [] as MissingEpisode[],
  chronology: [] as ChronologyEntry[],
  handovers: [] as HandoverEntry[],
  buildings: [] as Building[],
  buildingChecks: [] as BuildingCheck[],
  vehicles: [] as Vehicle[],
  vehicleChecks: [] as VehicleCheck[],
  notifications: [] as Notification[],
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
  medicationErrors: [] as MedicationError[],
  bodyMap: [] as BodyMapEntry[],
  activities: [] as Activity[],
  adoptionRecords: [] as AdoptionRecord[],
  advocacyRecords: [] as AdvocacyRecord[],
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
  dolRecords: [] as DoLRecord[],
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
  exploitationScreenings: [] as ExploitationScreening[],
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
  independenceSkillsRecords: [] as IndependenceSkillsRecord[],
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
  localityRisks: [] as LocalityRisk[],
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
  multiAgencyMeetings: [] as MultiAgencyMeeting[],
  multiDisciplinaryFormulations: [] as MultiDisciplinaryFormulation[],
  culturalVisits: [] as CulturalVisit[],
  nightChecks: [] as NightCheck[],
  nightStaffGuidanceSections: [] as NightStaffGuidanceSection[],
  nightStaffHandovers: [] as NightStaffHandover[],
  nightAnxietySupportRecords: [] as NightAnxietySupportRecord[],
  notificationLogEntries: [] as NotificationLogEntry[],
  occupationalTherapyRecords: [] as OccupationalTherapyRecord[],
  ofstedActionItems: [] as OfstedActionItem[],
  ofstedEngagementRecords: [] as OfstedEngagementRecord[],
  selfEvaluationAreas: [] as SelfEvaluationArea[],
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
  pathwayPlans: [] as PathwayPlan[],
  peerDynamics: [] as PeerDynamic[],
  peerGroupDynamics: [] as PeerGroupDynamic[],
  pepRecords: [] as PepRecord[],
  belongingsRecords: [] as BelongingsRecord[],
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
  professionalNetworkContacts: [] as ProfessionalNetworkContact[],
  propertyDamageRecords: [] as PropertyDamageRecord[],
  qaAuditRecords: [] as QAAuditRecord[],
  qualityOfCareReviews: [] as QualityOfCareReview[],
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
  staffDisciplinaryRecords: [] as StaffDisciplinaryRecord[],
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
    outcome: undefined, follow_up_date: undefined, staff_id: "staff_edward", status: "open",
    home_id: "home_oak", created_at: daysFromNow(-1) + "T16:00:00Z",
  },
  {
    id: "edu_002", child_id: "yp_alex", record_type: "exclusion", title: "Fixed-term exclusion — 1 day",
    date: daysFromNow(-3), school: "Derby Alternative Provision",
    details: "Alex excluded for one day following verbal altercation with teaching assistant. Refused to leave classroom when asked. School applied fixed-term exclusion under behaviour policy.",
    outcome: "Reintegration meeting booked with inclusion lead. Key worker to attend.",
    follow_up_date: daysFromNow(-1), staff_id: "staff_edward", status: "monitoring",
    home_id: "home_oak", created_at: daysFromNow(-3) + "T14:00:00Z",
  },
  {
    id: "edu_003", child_id: "yp_jordan", record_type: "attendance", title: "Full day attendance",
    date: daysFromNow(-2), school: "Highfields Academy",
    details: "Jordan attended full day. Completed maths assessment — scored 72%. Teacher notes improvement in concentration.",
    outcome: undefined, follow_up_date: undefined, staff_id: "staff_anna", status: "open",
    home_id: "home_oak", created_at: daysFromNow(-2) + "T16:00:00Z",
  },
  {
    id: "edu_004", child_id: "yp_casey", record_type: "attendance", title: "Late arrival — transport issue",
    date: daysFromNow(-2), school: "Allestree Woodlands",
    details: "Casey arrived 25 minutes late due to vehicle breakdown on the school run. School notified in advance.",
    outcome: undefined, follow_up_date: undefined, staff_id: "staff_chervelle", status: "open",
    home_id: "home_oak", created_at: daysFromNow(-2) + "T09:30:00Z",
  },
  {
    id: "edu_005", child_id: "yp_jordan", record_type: "pep_meeting", title: "PEP Review — Spring Term",
    date: daysFromNow(-7), school: "Highfields Academy",
    details: "Personal Education Plan review held with Virtual School Head, designated teacher, and key worker. Jordan making expected progress in English and exceeding in PE. Maths remains below expected — additional 1:1 tutoring agreed.",
    outcome: "1:1 maths tutoring to start next week. Reading challenge participation agreed. Next PEP review: Summer term.",
    follow_up_date: daysFromNow(56), staff_id: "staff_anna", status: "monitoring",
    home_id: "home_oak", created_at: daysFromNow(-7) + "T14:30:00Z",
  },
  {
    id: "edu_006", child_id: "yp_casey", record_type: "achievement", title: "English mock result — Grade 5",
    date: daysFromNow(-5), school: "Allestree Woodlands",
    details: "Casey achieved Grade 5 in English Language mock exam. Significant improvement from Grade 3 in autumn term. Teacher impressed with essay structure development.",
    outcome: "Positive feedback shared with Casey. Achievement celebrated at house meeting.",
    follow_up_date: undefined, staff_id: "staff_chervelle", status: "resolved",
    home_id: "home_oak", created_at: daysFromNow(-5) + "T15:30:00Z",
  },
  {
    id: "edu_007", child_id: "yp_alex", record_type: "pep_meeting", title: "Emergency PEP — post-exclusion",
    date: daysFromNow(-10), school: "Derby Alternative Provision",
    details: "Emergency PEP called following second exclusion this term. Discussed triggers, reintegration support, and whether provision remains suitable. Virtual School Head recommended additional behaviour support and possible assessment for EHCP.",
    outcome: "EHCP assessment referral to be made. Behaviour support plan updated. Reduced timetable for 2 weeks. Key worker to do daily school check-ins.",
    follow_up_date: daysFromNow(14), staff_id: "staff_darren", status: "monitoring",
    home_id: "home_oak", created_at: daysFromNow(-10) + "T10:00:00Z",
  },
  {
    id: "edu_008", child_id: "yp_casey", record_type: "achievement", title: "Selected for school debate team",
    date: daysFromNow(-1), school: "Allestree Woodlands",
    details: "Casey selected to represent Year 11 in inter-school debate competition. Topic: social media impact. Casey enthusiastic and has begun research.",
    outcome: "Competition date: 3 weeks. Staff to support with practice sessions at home.",
    follow_up_date: daysFromNow(21), staff_id: "staff_chervelle", status: "open",
    home_id: "home_oak", created_at: daysFromNow(-1) + "T16:30:00Z",
  },
  {
    id: "edu_009", child_id: "yp_alex", record_type: "concern", title: "Persistent absence pattern",
    date: daysFromNow(-15), school: "Derby Alternative Provision",
    details: "School flagged that Alex's attendance has dropped to 76% this term. Three unauthorised absences in last two weeks — Alex refusing to attend on mornings after difficult evenings. Pattern emerging.",
    outcome: "Attendance meeting with school booked. Morning routine review with Alex. Consider transport support.",
    follow_up_date: daysFromNow(-10), staff_id: "staff_edward", status: "monitoring",
    home_id: "home_oak", created_at: daysFromNow(-15) + "T10:00:00Z",
  },
  {
    id: "edu_010", child_id: "yp_jordan", record_type: "achievement", title: "PE Award — Student of the Week",
    date: daysFromNow(-4), school: "Highfields Academy",
    details: "Jordan received Student of the Week award for PE. Teacher praised leadership during team sports and positive attitude. Jordan visibly proud — brought certificate home.",
    outcome: "Certificate displayed in Jordan's room. Achievement shared at team meeting. Positive feedback to social worker.",
    follow_up_date: undefined, staff_id: "staff_anna", status: "resolved",
    home_id: "home_oak", created_at: daysFromNow(-4) + "T16:00:00Z",
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
};
