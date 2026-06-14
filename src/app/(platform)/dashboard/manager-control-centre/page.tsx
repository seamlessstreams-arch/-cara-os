"use client";

import { useState, useMemo, useEffect } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertTriangle, ShieldAlert, Clock, ClipboardCheck,
  Users, GraduationCap, MessageSquareWarning, Brain,
  ChevronDown, ChevronUp, Download, FileText, Eye,
  ClipboardList, Sparkles, CheckCircle2, ArrowUpRight,
  Filter, Calendar, AlertCircle, UserCheck, Pill,
  FileSearch, BookOpen, Scale, Activity, Siren,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CaraDailyIntelligence } from "@/components/cara/cara-daily-intelligence";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { SupervisionIntelligenceCard } from "@/components/dashboard/supervision-intelligence-card";
import { RegulatoryReportingCard } from "@/components/dashboard/regulatory-reporting-card";
import { RiskIntelligenceCard } from "@/components/dashboard/risk-intelligence-card";
import { IncidentAnalyticsCard } from "@/components/dashboard/incident-analytics-card";
import { RecordingQualityCard } from "@/components/dashboard/recording-quality-card";
import { RecordingCultureCard } from "@/components/dashboard/recording-culture-card";
import { RecordingTrendCard } from "@/components/dashboard/recording-trend-card";
import { SafeguardingIntelligenceCard } from "@/components/dashboard/safeguarding-intelligence-card";
import { MedicationIntelligenceCard } from "@/components/dashboard/medication-intelligence-card";
import { ContactEngagementCard } from "@/components/dashboard/contact-engagement-card";
import { EducationIntelligenceCard } from "@/components/dashboard/education-intelligence-card";
import { HealthWellbeingCard } from "@/components/dashboard/health-wellbeing-card";
import { MissingFromCareCard } from "@/components/dashboard/missing-from-care-card";
import { ComplaintsNotificationsCard } from "@/components/dashboard/complaints-notifications-card";
import { PlacementIntelligenceCard } from "@/components/dashboard/placement-intelligence-card";
import { BehaviourIntelligenceCard } from "@/components/dashboard/behaviour-intelligence-card";
import { RotaIntelligenceCard } from "@/components/dashboard/rota-intelligence-card";
import { PremisesIntelligenceCard } from "@/components/dashboard/premises-intelligence-card";
import { TrainingIntelligenceCard } from "@/components/dashboard/training-intelligence-card";
import { FinanceIntelligenceCard } from "@/components/dashboard/finance-intelligence-card";
import { LifeSkillsCard } from "@/components/dashboard/life-skills-card";
import { NotifiableEventsCard } from "@/components/dashboard/notifiable-events-card";
import { SCCIFEvaluationCard } from "@/components/dashboard/sccif-evaluation-card";
import { VisitorsCard } from "@/components/dashboard/visitors-card";
import { OutcomesCard } from "@/components/dashboard/outcomes-card";
import { HandoverCard } from "@/components/dashboard/handover-card";
import { AppraisalsCard } from "@/components/dashboard/appraisals-card";
import { MeetingsCard } from "@/components/dashboard/meetings-card";
import { RestraintCard } from "@/components/dashboard/restraint-card";
import { QualityAssuranceCard } from "@/components/dashboard/quality-assurance-card";
import { PossessionsCard } from "@/components/dashboard/possessions-card";
import { EmergencyCard } from "@/components/dashboard/emergency-card";
import { SaferRecruitmentCard } from "@/components/dashboard/safer-recruitment-card";
import { LeavingCareCard } from "@/components/dashboard/leaving-care-card";
import { StaffDisciplinaryCard } from "@/components/dashboard/staff-disciplinary-card";
import { SanctionsRewardsCard } from "@/components/dashboard/sanctions-rewards-card";
import { ContextualSafeguardingCard } from "@/components/dashboard/contextual-safeguarding-card";
import { DeprivationOfLibertyCard } from "@/components/dashboard/deprivation-of-liberty-card";
import { WhistleblowingCard } from "@/components/dashboard/whistleblowing-card";
import { PoliciesRegisterCard } from "@/components/dashboard/policies-register-card";
import { AdvocacyCard } from "@/components/dashboard/advocacy-card";
import { MultiAgencyCard } from "@/components/dashboard/multi-agency-card";
import { NightMonitoringCard } from "@/components/dashboard/night-monitoring-card";
import { CulturalIdentityCard } from "@/components/dashboard/cultural-identity-card";
import { SubstanceMisuseCard } from "@/components/dashboard/substance-misuse-card";
import { IndependentVisitorsCard } from "@/components/dashboard/independent-visitors-card";
import { BusinessContinuityCard } from "@/components/dashboard/business-continuity-card";
import { StatementOfPurposeCard } from "@/components/dashboard/statement-of-purpose-card";
import { Reg45ReportsCard } from "@/components/dashboard/reg45-reports-card";
import { ChildrensGuideCard } from "@/components/dashboard/childrens-guide-card";
import { TransitionPlanningCard } from "@/components/dashboard/transition-planning-card";
import { ChildrensParticipationCard } from "@/components/dashboard/childrens-participation-card";
import { FoodNutritionCard } from "@/components/dashboard/food-nutrition-card";
import { PocketMoneyCard } from "@/components/dashboard/pocket-money-card";
import { EnvironmentalSafetyCard } from "@/components/dashboard/environmental-safety-card";
import { RecordsManagementCard } from "@/components/dashboard/records-management-card";
import { SleepPatternsCard } from "@/components/dashboard/sleep-patterns-card";
import { StakeholderEngagementCard } from "@/components/dashboard/stakeholder-engagement-card";
import { ImpactRiskAssessmentCard } from "@/components/dashboard/impact-risk-assessment-card";
import { StaffWellbeingCard } from "@/components/dashboard/staff-wellbeing-card";
import { KpiTrackingCard } from "@/components/dashboard/kpi-tracking-card";
import { ProfessionalDevelopmentCard } from "@/components/dashboard/professional-development-card";
import { TherapeuticInterventionsCard } from "@/components/dashboard/therapeutic-interventions-card";
import { WorkforcePlanningCard } from "@/components/dashboard/workforce-planning-card";
import { CarePlanningCard } from "@/components/dashboard/care-planning-card";
import { FamilyEngagementCard } from "@/components/dashboard/family-engagement-card";
import { CommissioningReferralsCard } from "@/components/dashboard/commissioning-referrals-card";
import { ChildrensRightsCard } from "@/components/dashboard/childrens-rights-card";
import { PracticeLearningCard } from "@/components/dashboard/practice-learning-card";
import { StaffAbsenceCard } from "@/components/dashboard/staff-absence-card";
import { ActivityPlanningCard } from "@/components/dashboard/activity-planning-card";
import { OnlineSafetyCard } from "@/components/dashboard/online-safety-card";
import { LACReviewCard } from "@/components/dashboard/lac-review-card";
import { StaffInductionCard } from "@/components/dashboard/staff-induction-card";
import { DutyOfCandourCard } from "@/components/dashboard/duty-of-candour-card";
import { AntiBullyingCard } from "@/components/dashboard/anti-bullying-card";
import { ConsentManagementCard } from "@/components/dashboard/consent-management-card";
import { SignificantEventsCard } from "@/components/dashboard/significant-events-card";
import { LegalStatusCard } from "@/components/dashboard/legal-status-card";
import { BodyMapCard } from "@/components/dashboard/body-map-card";
import { KeyDocumentsCard } from "@/components/dashboard/key-documents-card";
import { PlacementStabilityCard } from "@/components/dashboard/placement-stability-card";
import { ProviderVisitsCard } from "@/components/dashboard/provider-visits-card";
import { MatchingReferralCard } from "@/components/dashboard/matching-referral-card";
import { IndependencePreparationCard } from "@/components/dashboard/independence-preparation-card";
import { SensoryProfileCard } from "@/components/dashboard/sensory-profile-card";
import { PeerMentoringCard } from "@/components/dashboard/peer-mentoring-card";
import { ContactMonitoringCard } from "@/components/dashboard/contact-monitoring-card";
import { AttachmentRelationshipsCard } from "@/components/dashboard/attachment-relationships-card";
import { DiversityInclusionCard } from "@/components/dashboard/diversity-inclusion-card";
import { EmergencyPlacementCard } from "@/components/dashboard/emergency-placement-card";
import { CourtProceedingsCard } from "@/components/dashboard/court-proceedings-card";
import { BehaviourSupportPlansCard } from "@/components/dashboard/behaviour-support-plans-card";
import { DischargeTransitionCard } from "@/components/dashboard/discharge-transition-card";
import { MedicationErrorsCard } from "@/components/dashboard/medication-errors-card";
import { ChildrensAchievementsCard } from "@/components/dashboard/childrens-achievements-card";
import { RiskRegisterCard } from "@/components/dashboard/risk-register-card";
import { DelegatedAuthorityCard } from "@/components/dashboard/delegated-authority-card";
import { LanguageCommunicationCard } from "@/components/dashboard/language-communication-card";
import { IndividualRiskAssessmentCard } from "@/components/dashboard/individual-risk-assessment-card";
import { ParentalResponsibilityCard } from "@/components/dashboard/parental-responsibility-card";
import { ChildrensWishesFeelingsCard } from "@/components/dashboard/childrens-wishes-feelings-card";
import { DailyRoutineCard } from "@/components/dashboard/daily-routine-card";
import { ChildExploitationScreeningCard } from "@/components/dashboard/child-exploitation-screening-card";
import { TraumaInformedCareCard } from "@/components/dashboard/trauma-informed-care-card";
import { RespiteShortBreaksCard } from "@/components/dashboard/respite-short-breaks-card";
import { MedicationAdministrationCard } from "@/components/dashboard/medication-administration-card";
import { StaffSupervisionSessionsCard } from "@/components/dashboard/staff-supervision-sessions-card";
import { FireSafetyCard } from "@/components/dashboard/fire-safety-card";
import { SecureStorageCard } from "@/components/dashboard/secure-storage-card";
import { ComplaintsInvestigationCard } from "@/components/dashboard/complaints-investigation-card";
import { WorkforceDiversityCard } from "@/components/dashboard/workforce-diversity-card";
import { VisitorManagementCard } from "@/components/dashboard/visitor-management-card";
import { EmergencyAdmissionsCard } from "@/components/dashboard/emergency-admissions-card";
import { StaffGrievanceCard } from "@/components/dashboard/staff-grievance-card";
import { EqualityHumanRightsCard } from "@/components/dashboard/equality-human-rights-card";
import { ChildrensFundManagementCard } from "@/components/dashboard/childrens-fund-management-card";
import { StaffAttendanceCard } from "@/components/dashboard/staff-attendance-card";
import { AllegationManagementCard } from "@/components/dashboard/allegation-management-card";
import { TransportSafetyCard } from "@/components/dashboard/transport-safety-card";
import { StaffTeamMeetingsCard } from "@/components/dashboard/staff-team-meetings-card";
import { CctvSurveillanceCard } from "@/components/dashboard/cctv-surveillance-card";
import { MealtimesNutritionCard } from "@/components/dashboard/mealtimes-nutrition-card";
import { BuildingSecurityCard } from "@/components/dashboard/building-security-card";
import { WaterSafetyCard } from "@/components/dashboard/water-safety-card";
import { InfectionControlCard } from "@/components/dashboard/infection-control-card";
import { MaintenanceRepairsCard } from "@/components/dashboard/maintenance-repairs-card";
import { GiftsHospitalityCard } from "@/components/dashboard/gifts-hospitality-card";
import { BedroomAuditCard } from "@/components/dashboard/bedroom-audit-card";
import { LaundryClothingCard } from "@/components/dashboard/laundry-clothing-card";
import { EmergencyDrillCard } from "@/components/dashboard/emergency-drill-card";
import { HealthAppointmentsCard } from "@/components/dashboard/health-appointments-card";
import { CommunalAreaAuditCard } from "@/components/dashboard/communal-area-audit-card";
import { NotificationsRegisterCard } from "@/components/dashboard/notifications-register-card";
import { StaffExitInterviewsCard } from "@/components/dashboard/staff-exit-interviews-card";
import { ChildrensMeetingsCard } from "@/components/dashboard/childrens-meetings-card";
import { HolidayTripsCard } from "@/components/dashboard/holiday-trips-card";
import { DataProtectionCard } from "@/components/dashboard/data-protection-card";
import { PanelDecisionsCard } from "@/components/dashboard/panel-decisions-card";
import { VehicleManagementCard } from "@/components/dashboard/vehicle-management-card";
import { PestControlCard } from "@/components/dashboard/pest-control-card";
import { ChildrensFeedbackCard } from "@/components/dashboard/childrens-feedback-card";
import { UtilityManagementCard } from "@/components/dashboard/utility-management-card";
import { VolunteerManagementCard } from "@/components/dashboard/volunteer-management-card";
import { RoomTemperatureCard } from "@/components/dashboard/room-temperature-card";
import { MedicationAuditCard } from "@/components/dashboard/medication-audit-card";
import { ChildrensAbsenceCard } from "@/components/dashboard/childrens-absence-card";
import { HomeImprovementCard } from "@/components/dashboard/home-improvement-card";
import { CleaningScheduleCard } from "@/components/dashboard/cleaning-schedule-card";
import { KeyHoldingCard } from "@/components/dashboard/key-holding-card";
import { PersonalHygieneCard } from "@/components/dashboard/personal-hygiene-card";
import { MissingPersonRiskCard } from "@/components/dashboard/missing-person-risk-card";
import { SafeguardingReferralCard } from "@/components/dashboard/safeguarding-referral-card";
import { MedicationStorageCard } from "@/components/dashboard/medication-storage-card";
import { AdmissionAssessmentCard } from "@/components/dashboard/admission-assessment-card";
import { StaffCompetencyAssessmentCard } from "@/components/dashboard/staff-competency-assessment-card";
import { EnvironmentalAuditCard } from "@/components/dashboard/environmental-audit-card";
import { ProfessionalConsultationCard } from "@/components/dashboard/professional-consultation-card";
import { OfstedActionPlanCard } from "@/components/dashboard/ofsted-action-plan-card";
import { LifeStoryWorkCard } from "@/components/dashboard/life-story-work-card";
import { PositiveHandlingCard } from "@/components/dashboard/positive-handling-card";
import { ShiftHandoverQualityCard } from "@/components/dashboard/shift-handover-quality-card";
import { ChildrensProgressTrackingCard } from "@/components/dashboard/childrens-progress-tracking-card";
import { KeyworkerSessionsCard } from "@/components/dashboard/keyworker-sessions-card";
import { RestraintDebriefCard } from "@/components/dashboard/restraint-debrief-card";
import { StaffReflectivePracticeCard } from "@/components/dashboard/staff-reflective-practice-card";
import { StaffHandoverNotesCard } from "@/components/dashboard/staff-handover-notes-card";
import { ChildRiskAssessmentReviewCard } from "@/components/dashboard/child-risk-assessment-review-card";
import { HomeDecorationPersonalisationCard } from "@/components/dashboard/home-decoration-personalisation-card";
import { MedicationConsentCard } from "@/components/dashboard/medication-consent-card";
import { StaffLoneWorkingCard } from "@/components/dashboard/staff-lone-working-card";
import { ChildrensTherapySessionsCard } from "@/components/dashboard/childrens-therapy-sessions-card";
import { NightWakingMonitoringCard } from "@/components/dashboard/night-waking-monitoring-card";
import { CommunityLinksIntegrationCard } from "@/components/dashboard/community-links-integration-card";
import { StaffMedicationCompetencyCard } from "@/components/dashboard/staff-medication-competency-card";
import { BoundaryManagementCard } from "@/components/dashboard/boundary-management-card";
import { InternetUsageMonitoringCard } from "@/components/dashboard/internet-usage-monitoring-card";
import { SleepQualityAssessmentCard } from "@/components/dashboard/sleep-quality-assessment-card";
import { CulturalIdentitySupportCard } from "@/components/dashboard/cultural-identity-support-card";
import { PocketMoneyManagementCard } from "@/components/dashboard/pocket-money-management-card";
import { ChildWellbeingCheckinCard } from "@/components/dashboard/child-wellbeing-checkin-card";
import { StaffDebriefSupportCard } from "@/components/dashboard/staff-debrief-support-card";
import { EducationAttendanceTrackingCard } from "@/components/dashboard/education-attendance-tracking-card";
import { ContactSupervisionCard } from "@/components/dashboard/contact-supervision-card";
import { SelfHarmRiskMonitoringCard } from "@/components/dashboard/self-harm-risk-monitoring-card";
import { RoomSharingAssessmentCard } from "@/components/dashboard/room-sharing-assessment-card";
import { MedicationSideEffectsCard } from "@/components/dashboard/medication-side-effects-card";
import { PeerRelationshipAssessmentCard } from "@/components/dashboard/peer-relationship-assessment-card";
import { HomeEnvironmentInspectionCard } from "@/components/dashboard/home-environment-inspection-card";
import { ComplaintResolutionTrackingCard } from "@/components/dashboard/complaint-resolution-tracking-card";
import { StaffSupervisionComplianceCard } from "@/components/dashboard/staff-supervision-compliance-card";
import { ChildDevelopmentMilestoneCard } from "@/components/dashboard/child-development-milestone-card";
import { VisitorFeedbackCollectionCard } from "@/components/dashboard/visitor-feedback-collection-card";
import { StaffShiftPatternMonitoringCard } from "@/components/dashboard/staff-shift-pattern-monitoring-card";
import { ChildDigitalWellbeingCard } from "@/components/dashboard/child-digital-wellbeing-card";
import { FamilyEngagementTrackingCard } from "@/components/dashboard/family-engagement-tracking-card";
import { TransitionPlanningReadinessCard } from "@/components/dashboard/transition-planning-readiness-card";
import { KeyWorkerAllocationCard } from "@/components/dashboard/key-worker-allocation-card";
import { ConsentCapacityMonitoringCard } from "@/components/dashboard/consent-capacity-monitoring-card";
import { BehaviourPatternAnalysisCard } from "@/components/dashboard/behaviour-pattern-analysis-card";
import { PhysicalActivityTrackingCard } from "@/components/dashboard/physical-activity-tracking-card";
import { ReligiousCulturalObservanceCard } from "@/components/dashboard/religious-cultural-observance-card";
import { SiblingContactQualityCard } from "@/components/dashboard/sibling-contact-quality-card";
import { PrivacyDignityMonitoringCard } from "@/components/dashboard/privacy-dignity-monitoring-card";
import { ChildrensAspirationsGoalsCard } from "@/components/dashboard/childrens-aspirations-goals-card";
import { CreativeEnrichmentActivitiesCard } from "@/components/dashboard/creative-enrichment-activities-card";
import { MedicationEffectivenessReviewCard } from "@/components/dashboard/medication-effectiveness-review-card";
import { HealthScreeningImmunisationCard } from "@/components/dashboard/health-screening-immunisation-card";
import { SocialSkillsDevelopmentCard } from "@/components/dashboard/social-skills-development-card";
import { RestorativeJusticePracticeCard } from "@/components/dashboard/restorative-justice-practice-card";
import { LeisureRecreationActivitiesCard } from "@/components/dashboard/leisure-recreation-activities-card";
import { HomeworkAcademicSupportCard } from "@/components/dashboard/homework-academic-support-card";
import { AdvocacyRepresentationCard } from "@/components/dashboard/advocacy-representation-card";
import { CelebrationMilestonesCard } from "@/components/dashboard/celebration-milestones-card";
import { WorkExperienceEmploymentCard } from "@/components/dashboard/work-experience-employment-card";
import { DeviceScreenTimeMonitoringCard } from "@/components/dashboard/device-screen-time-monitoring-card";
import { FinancialLiteracySavingsCard } from "@/components/dashboard/financial-literacy-savings-card";
import { FirstAidMedicalEmergencyCard } from "@/components/dashboard/first-aid-medical-emergency-card";
import { OutdoorSpacesPlayAreasCard } from "@/components/dashboard/outdoor-spaces-play-areas-card";
import { PositiveBehaviourReinforcementCard } from "@/components/dashboard/positive-behaviour-reinforcement-card";
import { DentalOpticalHealthCard } from "@/components/dashboard/dental-optical-health-card";
import { SelfEsteemConfidenceBuildingCard } from "@/components/dashboard/self-esteem-confidence-building-card";
import { ArrivalSettlingExperienceCard } from "@/components/dashboard/arrival-settling-experience-card";
import { HealthyEatingCookingSkillsCard } from "@/components/dashboard/healthy-eating-cooking-skills-card";
import { RelationshipEducationSafetyCard } from "@/components/dashboard/relationship-education-safety-card";
import { PetCareResponsibilityCard } from "@/components/dashboard/pet-care-responsibility-card";
import { GardenHorticultureActivitiesCard } from "@/components/dashboard/garden-horticulture-activities-card";
import { FaithSpiritualObservanceCard } from "@/components/dashboard/faith-spiritual-observance-card";
import { StaffPatternIntelligenceCard } from "@/components/dashboard/staff-pattern-intelligence-card";
import { StaffPerformanceDipCard } from "@/components/dashboard/staff-performance-dip-card";
import { StaffBurnoutIndicatorCard } from "@/components/dashboard/staff-burnout-indicator-card";
import { StaffDevelopmentPlanCard } from "@/components/dashboard/staff-development-plan-card";
import { StaffSupportPlanCard } from "@/components/dashboard/staff-support-plan-card";
import { StaffPracticeRiskAssessmentCard } from "@/components/dashboard/staff-practice-risk-assessment-card";
import { StaffTriggerMapCard } from "@/components/dashboard/staff-trigger-map-card";
import { StaffSupportActionCard } from "@/components/dashboard/staff-support-action-card";
import { StaffReviewOutcomeCard } from "@/components/dashboard/staff-review-outcome-card";
import { StaffConfidenceIndicatorCard } from "@/components/dashboard/staff-confidence-indicator-card";
import { StaffMandatoryTrainingCard } from "@/components/dashboard/staff-mandatory-training-card";
import { YoungPersonDailyDiaryCard } from "@/components/dashboard/young-person-daily-diary-card";
import { ProfessionalNetworkDirectoryCard } from "@/components/dashboard/professional-network-directory-card";
import { MenuPlanningDietaryCard } from "@/components/dashboard/menu-planning-dietary-card";
import { EhcpSendMonitoringCard } from "@/components/dashboard/ehcp-send-monitoring-card";
import { PlacementMatchingAssessmentCard } from "@/components/dashboard/placement-matching-assessment-card";
import { Reg44IndependentVisitorCard } from "@/components/dashboard/reg44-independent-visitor-card";
import { EmotionalWellbeingOutcomeCard } from "@/components/dashboard/emotional-wellbeing-outcome-card";
import { ComplianceCertificateCard } from "@/components/dashboard/compliance-certificate-card";
import { HomeClosurePlanningCard } from "@/components/dashboard/home-closure-planning-card";
import { ParentalContactArrangementCard } from "@/components/dashboard/parental-contact-arrangement-card";
import { SafeguardingPartnershipCard } from "@/components/dashboard/safeguarding-partnership-card";
import { LacHealthAssessmentCard } from "@/components/dashboard/lac-health-assessment-card";
import { StaffWhistleblowingInvestigationCard } from "@/components/dashboard/staff-whistleblowing-investigation-card";
import { HomeAtmosphereAssessmentCard } from "@/components/dashboard/home-atmosphere-assessment-card";
import { QualityOfCareReviewCard } from "@/components/dashboard/quality-of-care-review-card";
import { MedicationIncidentReportingCard } from "@/components/dashboard/medication-incident-reporting-card";
import { StaffAnnualLeaveCard } from "@/components/dashboard/staff-annual-leave-card";
import { ChildrensPocketMoneyAuditCard } from "@/components/dashboard/childrens-pocket-money-audit-card";
import { StaffConflictOfInterestCard } from "@/components/dashboard/staff-conflict-of-interest-card";
import { EnvironmentalImpactAssessmentCard } from "@/components/dashboard/environmental-impact-assessment-card";
import { StaffRetentionExitAnalysisCard } from "@/components/dashboard/staff-retention-exit-analysis-card";
import { ChildSexualExploitationRiskCard } from "@/components/dashboard/child-sexual-exploitation-risk-card";
import { OfstedInspectionReadinessCard } from "@/components/dashboard/ofsted-inspection-readiness-card";
import { YoungPersonEmploymentSupportCard } from "@/components/dashboard/young-person-employment-support-card";
import { SleepDisturbanceInterventionCard } from "@/components/dashboard/sleep-disturbance-intervention-card";
import { ChildCriminalExploitationRiskCard } from "@/components/dashboard/child-criminal-exploitation-risk-card";
import { StaffSicknessManagementCard } from "@/components/dashboard/staff-sickness-management-card";
import { HomeInsuranceComplianceCard } from "@/components/dashboard/home-insurance-compliance-card";
import { ChildVoiceParticipationTrackingCard } from "@/components/dashboard/child-voice-participation-tracking-card";
import { StaffCodeOfConductComplianceCard } from "@/components/dashboard/staff-code-of-conduct-compliance-card";
import { HomeEnergyEfficiencyCard } from "@/components/dashboard/home-energy-efficiency-card";
import { ChildRadicalisationPreventionCard } from "@/components/dashboard/child-radicalisation-prevention-card";
import { StaffNvqQualificationTrackingCard } from "@/components/dashboard/staff-nvq-qualification-tracking-card";
import { HomeAccessibilityAssessmentCard } from "@/components/dashboard/home-accessibility-assessment-card";
import { ChildNutritionWeightMonitoringCard } from "@/components/dashboard/child-nutrition-weight-monitoring-card";
import { StaffDbsRenewalTrackingCard } from "@/components/dashboard/staff-dbs-renewal-tracking-card";
import { HomeFireRiskAssessmentCard } from "@/components/dashboard/home-fire-risk-assessment-card";
import { ChildSubstanceMisuseScreeningCard } from "@/components/dashboard/child-substance-misuse-screening-card";
import { StaffReturnToWorkInterviewCard } from "@/components/dashboard/staff-return-to-work-interview-card";
import { HomeLegionellaRiskAssessmentCard } from "@/components/dashboard/home-legionella-risk-assessment-card";
import { ChildBereavementSupportCard } from "@/components/dashboard/child-bereavement-support-card";
import { StaffMandatoryRefresherTrainingCard } from "@/components/dashboard/staff-mandatory-refresher-training-card";
import { HomeAsbestosManagementCard } from "@/components/dashboard/home-asbestos-management-card";
import { ChildGangsAffiliationRiskCard } from "@/components/dashboard/child-gangs-affiliation-risk-card";
import { StaffAgencyWorkerComplianceCard } from "@/components/dashboard/staff-agency-worker-compliance-card";
import { HomeRadonTestingCard } from "@/components/dashboard/home-radon-testing-card";
import { ChildFgmRiskAssessmentCard } from "@/components/dashboard/child-fgm-risk-assessment-card";
import { StaffProfessionalRegistrationCard } from "@/components/dashboard/staff-professional-registration-card";
import { HomeElectricalSafetyCard } from "@/components/dashboard/home-electrical-safety-card";
import { ChildForcedMarriageRiskCard } from "@/components/dashboard/child-forced-marriage-risk-card";
import { StaffSecondmentManagementCard } from "@/components/dashboard/staff-secondment-management-card";
import { HomeGasSafetyCard } from "@/components/dashboard/home-gas-safety-card";
import { ChildModernSlaveryRiskCard } from "@/components/dashboard/child-modern-slavery-risk-card";
import { StaffPayrollComplianceCard } from "@/components/dashboard/staff-payroll-compliance-card";
import { HomeLiftEquipmentSafetyCard } from "@/components/dashboard/home-lift-equipment-safety-card";
import { ChildHonourBasedAbuseRiskCard } from "@/components/dashboard/child-honour-based-abuse-risk-card";
import { StaffExitInterviewManagementCard } from "@/components/dashboard/staff-exit-interview-management-card";
import { HomeWaterHygieneManagementCard } from "@/components/dashboard/home-water-hygiene-management-card";
import { ChildRadicalisationRiskCard } from "@/components/dashboard/child-radicalisation-risk-card";
import { StaffWhistleblowingManagementCard } from "@/components/dashboard/staff-whistleblowing-management-card";
import { HomePestControlManagementCard } from "@/components/dashboard/home-pest-control-management-card";
import { ChildTraffickingRiskCard } from "@/components/dashboard/child-trafficking-risk-card";
import { StaffOvertimeManagementCard } from "@/components/dashboard/staff-overtime-management-card";
import { HomeCctvComplianceCard } from "@/components/dashboard/home-cctv-compliance-card";
import { ChildOnlineSafetyMonitoringCard } from "@/components/dashboard/child-online-safety-monitoring-card";
import { StaffLoneWorkingRiskCard } from "@/components/dashboard/staff-lone-working-risk-card";
import { HomeEmergencyLightingCard } from "@/components/dashboard/home-emergency-lighting-card";
import {
  useAttentionItems,
  useUpdateAttentionItem,
  useLearningReviews,
  useReg44Visits,
  useReg45Reviews,
  useCompetenceRecords,
  useVoiceEntries,
  useEvidenceItems,
} from "@/hooks/use-intelligence-layer";
import { SmartLinkBadge } from "@/components/intelligence/smart-link-panel";
import { useIncidents } from "@/hooks/use-incidents";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useKeyWorkingSessions } from "@/hooks/use-key-working";
import { runProactiveAlertScan, type ProactiveAlert } from "@/lib/cara/cara-proactive-alerts";
import type { IncidentRecord } from "@/lib/cara/cara-pattern-engine";
import type { ChildRecord, IncidentSummary } from "@/lib/cara/cara-voice-gap-analysis";
import Link from "next/link";
import type {
  AttentionCategory,
  Urgency,
  AttentionStatus,
} from "@/types/intelligence.layer";

/* ══════════════════════════════════════════════════════════════════════════════
   CARA — MANAGER CONTROL CENTRE
   Registered Manager's single-pane-of-glass for oversight and compliance.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const formatDate = (iso: string) => {
  const dt = new Date(iso);
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const isOverdue = (iso?: string) => {
  if (!iso) return false;
  return new Date(iso) < new Date();
};

/* ── urgency config ────────────────────────────────────────────────────────── */

const URGENCY_STYLES: Record<Urgency, { badge: string; border: string; label: string }> = {
  critical: {
    badge: "bg-red-600 text-white border-transparent",
    border: "border-l-red-600",
    label: "Critical",
  },
  high: {
    badge: "bg-amber-500 text-white border-transparent",
    border: "border-l-amber-500",
    label: "High",
  },
  medium: {
    badge: "bg-blue-100 text-blue-800 border-transparent",
    border: "border-l-blue-400",
    label: "Medium",
  },
  low: {
    badge: "bg-slate-100 text-[var(--cs-text-secondary)] border-transparent",
    border: "border-l-slate-300",
    label: "Low",
  },
};

/* ── category config ───────────────────────────────────────────────────────── */

const CATEGORY_META: Record<AttentionCategory, { label: string; badge: string; icon: React.ElementType }> = {
  log_approval:          { label: "Log Approval",          badge: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)]", icon: ClipboardCheck },
  incident_oversight:    { label: "Incident Oversight",    badge: "bg-orange-100 text-orange-800", icon: AlertCircle },
  serious_incident:      { label: "Serious Incident",      badge: "bg-red-100 text-red-800",       icon: Siren },
  missing_from_care:     { label: "Missing from Care",     badge: "bg-red-100 text-red-800",       icon: AlertTriangle },
  risk_assessment_review:{ label: "Risk Assessment",       badge: "bg-amber-100 text-amber-800",   icon: ShieldAlert },
  placement_plan_update: { label: "Placement Plan",        badge: "bg-sky-100 text-sky-800",       icon: FileText },
  key_work_overdue:      { label: "Key Work Overdue",      badge: "bg-emerald-100 text-emerald-800", icon: UserCheck },
  wishes_feelings_missing:{ label: "Wishes & Feelings",    badge: "bg-pink-100 text-pink-800",     icon: MessageSquareWarning },
  medication_check:      { label: "Medication Check",      badge: "bg-teal-100 text-teal-800",     icon: Pill },
  supervision_overdue:   { label: "Supervision Overdue",   badge: "bg-indigo-100 text-indigo-800", icon: Users },
  training_gap:          { label: "Training Gap",          badge: "bg-yellow-100 text-yellow-800", icon: GraduationCap },
  recruitment_gap:       { label: "Recruitment Gap",       badge: "bg-rose-100 text-rose-800",     icon: FileSearch },
  complaint_open:        { label: "Complaint Open",        badge: "bg-fuchsia-100 text-fuchsia-800", icon: MessageSquareWarning },
  reg44_action_overdue:  { label: "Reg 44 Action",         badge: "bg-cyan-100 text-cyan-800",     icon: Scale },
  reg45_evidence_gap:    { label: "Reg 45 Evidence",       badge: "bg-lime-100 text-lime-800",     icon: BookOpen },
  task_overdue:          { label: "Task Overdue",          badge: "bg-stone-100 text-stone-800",   icon: Clock },
  staff_debrief:         { label: "Staff Debrief",         badge: "bg-blue-100 text-blue-800",     icon: Users },
  document_sign_off:     { label: "Document Sign-off",     badge: "bg-zinc-100 text-zinc-800",     icon: ClipboardList },
  cara_pattern:          { label: "Cara Pattern",          badge: "bg-purple-100 text-purple-800", icon: Brain },
};

const STATUS_LABELS: Record<AttentionStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  reviewed: "Reviewed",
  escalated: "Escalated",
  closed: "Closed",
};

/* ── demo attention item type (extends ManagerAttentionItem for UI) ─────── */

interface AttentionItem {
  id: string;
  title: string;
  category: AttentionCategory;
  urgency: Urgency;
  status: AttentionStatus;
  reason: string;
  suggestedAction: string;
  dueDate?: string;
  childName?: string;
  staffName?: string;
  createdAt: string;
}

/* ── demo data ─────────────────────────────────────────────────────────────── */


/* ── stat card type ────────────────────────────────────────────────────────── */

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  colour: string;
}

/* ── category filter options ───────────────────────────────────────────────── */

const CATEGORY_OPTIONS: { value: AttentionCategory; label: string }[] = [
  { value: "log_approval", label: "Log Approval" },
  { value: "incident_oversight", label: "Incident Oversight" },
  { value: "serious_incident", label: "Serious Incident" },
  { value: "missing_from_care", label: "Missing from Care" },
  { value: "risk_assessment_review", label: "Risk Assessment" },
  { value: "placement_plan_update", label: "Placement Plan" },
  { value: "key_work_overdue", label: "Key Work Overdue" },
  { value: "wishes_feelings_missing", label: "Wishes & Feelings" },
  { value: "medication_check", label: "Medication Check" },
  { value: "supervision_overdue", label: "Supervision Overdue" },
  { value: "training_gap", label: "Training Gap" },
  { value: "recruitment_gap", label: "Recruitment Gap" },
  { value: "complaint_open", label: "Complaint" },
  { value: "reg44_action_overdue", label: "Reg 44 Action" },
  { value: "reg45_evidence_gap", label: "Reg 45 Evidence" },
  { value: "task_overdue", label: "Task Overdue" },
  { value: "staff_debrief", label: "Staff Debrief" },
  { value: "document_sign_off", label: "Document Sign-off" },
  { value: "cara_pattern", label: "Cara Pattern" },
];

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */

export default function ManagerControlCentrePage() {
  const { data: apiData } = useAttentionItems();
  const { data: learningData } = useLearningReviews();
  const { data: reg44Data } = useReg44Visits();
  const { data: reg45Data } = useReg45Reviews();
  const { data: competenceData } = useCompetenceRecords();
  const { data: voiceData } = useVoiceEntries();
  const { data: evidenceData } = useEvidenceItems();

  // ── Cara proactive alert engine ─────────────────────────────────────────
  const { data: incidentsData } = useIncidents();
  const { data: ypData }        = useYoungPeople();
  const { data: kwData }        = useKeyWorkingSessions();

  const caraAlerts = useMemo<ProactiveAlert[]>(() => {
    const incidents   = incidentsData?.data ?? [];
    const youngPeople = ypData?.data ?? [];
    const kwSessions  = kwData?.data ?? [];
    if (incidents.length === 0) return [];

    const incidentRecords: IncidentRecord[] = incidents.map((i) => ({
      id: i.id, reference: i.reference, type: i.type, severity: i.severity,
      child_id: i.child_id, reported_by: i.reported_by, date: i.date,
      time: i.time ?? undefined, location: i.location ?? undefined,
      description: i.description, status: i.status,
      requires_oversight: i.requires_oversight,
      oversight_by: i.oversight_by, oversight_at: i.oversight_at,
      home_id: "oak-house",
    }));

    const childRecords: ChildRecord[] = kwSessions.map((s) => ({
      id: s.id, childId: s.child_id,
      childName: youngPeople.find((yp) => yp.id === s.child_id)
        ? `${youngPeople.find((yp) => yp.id === s.child_id)!.preferred_name ?? youngPeople.find((yp) => yp.id === s.child_id)!.first_name} ${youngPeople.find((yp) => yp.id === s.child_id)!.last_name}`
        : s.child_id,
      recordType: "key_work", date: s.date,
      hasDirectQuote: (s.child_voice?.length ?? 0) > 0,
      themes: s.topics ?? [], wordCount: s.child_voice?.split(/\s+/).length ?? 0,
    }));

    const incidentSummaries: IncidentSummary[] = incidents.map((i) => ({
      id: i.id, childId: i.child_id, date: i.date,
      type: i.type, severity: i.severity, hasPostIncidentVoice: false,
    }));

    const children = youngPeople.map((yp) => ({
      id: yp.id, name: yp.preferred_name ?? `${yp.first_name} ${yp.last_name}`,
    }));

    try {
      return runProactiveAlertScan({
        incidents: incidentRecords, childRecords, incidentSummaries,
        children, complianceChecks: [], homeId: "oak-house",
      }).alerts;
    } catch { return []; }
  }, [incidentsData, ypData, kwData]);

  const [items, setItems] = useState<AttentionItem[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("7d");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const updateItem = useUpdateAttentionItem();

  useEffect(() => {
    if (apiData?.persisted && Array.isArray(apiData.items)) {
      setItems((apiData.items as Record<string, unknown>[]).map((item) => ({
        id: item.id as string,
        title: item.title as string,
        category: item.category as AttentionCategory,
        urgency: item.urgency as Urgency,
        status: item.status as AttentionStatus,
        reason: (item.reason as string) ?? "",
        suggestedAction: (item.suggested_action as string) ?? "",
        dueDate: item.due_date as string | undefined,
        childName: item.child_id as string | undefined,
        staffName: item.staff_id as string | undefined,
        createdAt: item.created_at as string,
      })));
    }
  }, [apiData]);

  // Merge live Cara proactive alerts into the attention items list
  useEffect(() => {
    if (caraAlerts.length === 0) return;
    const severityToUrgency = (s: string): Urgency =>
      s === "urgent" ? "critical" : s === "high" ? "high" : s === "medium" ? "medium" : "low";
    const caraItems: AttentionItem[] = caraAlerts.map((a) => ({
      id:             `cara_${a.id}`,
      title:          a.title,
      category:       "cara_pattern" as AttentionCategory,
      urgency:        severityToUrgency(a.severity),
      status:         "open" as AttentionStatus,
      reason:         a.description,
      suggestedAction: a.recommendation,
      childName:      undefined,
      staffName:      undefined,
      createdAt:      a.detectedAt,
    }));
    setItems((prev) => [
      ...prev.filter((i) => i.category !== "cara_pattern"),
      ...caraItems,
    ]);
  }, [caraAlerts]);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  /* ── period filter logic ─────────────────────────────────────────────────── */

  const periodCutoff = useMemo(() => {
    const now = new Date();
    switch (filterPeriod) {
      case "24h": { const dt = new Date(now); dt.setDate(dt.getDate() - 1); return dt; }
      case "48h": { const dt = new Date(now); dt.setDate(dt.getDate() - 2); return dt; }
      case "7d":  { const dt = new Date(now); dt.setDate(dt.getDate() - 7); return dt; }
      case "14d": { const dt = new Date(now); dt.setDate(dt.getDate() - 14); return dt; }
      case "30d": { const dt = new Date(now); dt.setDate(dt.getDate() - 30); return dt; }
      case "all": return null;
      default:    { const dt = new Date(now); dt.setDate(dt.getDate() - 7); return dt; }
    }
  }, [filterPeriod]);

  /* ── filtered items ──────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterCategory !== "all" && item.category !== filterCategory) return false;
      if (filterUrgency !== "all" && item.urgency !== filterUrgency) return false;
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (periodCutoff) {
        const created = new Date(item.createdAt);
        if (created < periodCutoff) return false;
      }
      return true;
    }).sort((a, b) => {
      const urgencyOrder: Urgency[] = ["critical", "high", "medium", "low"];
      const aIdx = urgencyOrder.indexOf(a.urgency);
      const bIdx = urgencyOrder.indexOf(b.urgency);
      if (aIdx !== bIdx) return aIdx - bIdx;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [items, filterCategory, filterUrgency, filterStatus, periodCutoff]);

  /* ── summary stats ───────────────────────────────────────────────────────── */

  const stats = useMemo((): StatCard[] => {
    const activeItems = items.filter((i) => i.status !== "closed" && i.status !== "reviewed");
    const criticalCount = activeItems.filter((i) => i.urgency === "critical").length;
    const highCount = activeItems.filter((i) => i.urgency === "high").length;
    const incidentOversight = activeItems.filter(
      (i) => i.category === "incident_oversight" || i.category === "serious_incident"
    ).length;
    const overdueCount = activeItems.filter((i) => i.dueDate && isOverdue(i.dueDate)).length;
    const supervisionGaps = activeItems.filter((i) => i.category === "supervision_overdue").length;
    const trainingGaps = activeItems.filter((i) => i.category === "training_gap").length;
    const complaintsOpen = activeItems.filter((i) => i.category === "complaint_open").length;
    const patternsDetected = activeItems.filter((i) => i.category === "cara_pattern").length;

    return [
      { label: "Critical Items",       value: criticalCount,     icon: AlertTriangle,        colour: "text-red-600" },
      { label: "High Items",           value: highCount,         icon: AlertCircle,           colour: "text-amber-600" },
      { label: "Incidents Needing Oversight", value: incidentOversight, icon: ShieldAlert,    colour: "text-orange-600" },
      { label: "Overdue Tasks",         value: overdueCount,      icon: Clock,                colour: "text-rose-600" },
      { label: "Supervision Gaps",      value: supervisionGaps,   icon: Users,                colour: "text-indigo-600" },
      { label: "Training Gaps",         value: trainingGaps,      icon: GraduationCap,        colour: "text-yellow-600" },
      { label: "Complaints Open",       value: complaintsOpen,    icon: MessageSquareWarning,  colour: "text-fuchsia-600" },
      { label: "Patterns Detected",     value: patternsDetected,  icon: Brain,                colour: "text-purple-600" },
    ];
  }, [items]);

  /* ── cross-module aggregate stats ───────────────────────────────────────── */

  const moduleStats = useMemo(() => {
    const learningReviews = (learningData?.reviews as Record<string, unknown>[]) ?? [];
    const pendingReviews = learningReviews.filter((r) => r.review_status === "required" || r.status === "required").length;

    const reg44Visits = (reg44Data?.visits as Record<string, unknown>[]) ?? [];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const reg44ThisMonth = reg44Visits.some((v) => ((v.visit_date as string) ?? "").startsWith(currentMonth));

    const reg45Reviews = (reg45Data?.reviews as Record<string, unknown>[]) ?? [];
    const draftReg45 = reg45Reviews.filter((r) => r.status === "draft" || r.status === "in_progress").length;

    const competence = (competenceData?.records as Record<string, unknown>[]) ?? [];
    const mandatoryIncomplete = competence.filter((r) => !r.mandatory_training_complete).length;

    const voiceEntries = (voiceData?.entries as Record<string, unknown>[]) ?? [];
    const voiceLast30 = voiceEntries.filter((e) => {
      const d = (e.entry_date as string) ?? (e.created_at as string) ?? "";
      return d >= new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    }).length;

    const evidence = (evidenceData?.items as Record<string, unknown>[]) ?? [];
    const evidenceCount = evidence.length;

    const totalAttentionOpen = items.filter((i) => i.status === "open" || i.status === "in_progress").length;

    // Inspection readiness: simple heuristic score out of 100
    const readinessFactors = [
      reg44ThisMonth ? 20 : 0,
      draftReg45 === 0 ? 20 : 10,
      mandatoryIncomplete === 0 ? 20 : Math.max(0, 20 - mandatoryIncomplete * 4),
      voiceLast30 >= 3 ? 20 : Math.round((voiceLast30 / 3) * 20),
      evidenceCount >= 10 ? 20 : Math.round((evidenceCount / 10) * 20),
    ];
    const inspectionReadiness = readinessFactors.reduce((a, b) => a + b, 0);

    return {
      totalAttentionOpen,
      pendingReviews,
      reg44ThisMonth,
      draftReg45,
      mandatoryIncomplete,
      voiceLast30,
      evidenceCount,
      inspectionReadiness,
    };
  }, [items, learningData, reg44Data, reg45Data, competenceData, voiceData, evidenceData]);

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Manager Control Centre"
      subtitle="What needs your attention today"
      caraContext={{ pageTitle: "Nothing needs your attention", sourceType: "child_record" }}
      actions={
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" />
          Export Summary
        </Button>
      }
    >
      {/* ── summary stats bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <stat.icon className={cn("h-5 w-5 mx-auto mb-1", stat.colour)} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Cara Daily Intelligence Brief ─────────────────────────────────── */}
      <CaraDailyIntelligence className="mb-6" />

      {/* ── cross-module intelligence ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <Card className="border-blue-100">
          <CardContent className="pt-4 pb-3 text-center">
            <ClipboardCheck className={cn("h-5 w-5 mx-auto mb-1", moduleStats.inspectionReadiness >= 80 ? "text-green-600" : moduleStats.inspectionReadiness >= 50 ? "text-amber-600" : "text-red-600")} />
            <p className="text-2xl font-bold">{moduleStats.inspectionReadiness}%</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Inspection Readiness</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Activity className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">{moduleStats.totalAttentionOpen}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Open Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Siren className="h-5 w-5 mx-auto mb-1 text-orange-600" />
            <p className="text-2xl font-bold">{moduleStats.pendingReviews}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Incident Reviews Due</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <CheckCircle2 className={cn("h-5 w-5 mx-auto mb-1", moduleStats.reg44ThisMonth ? "text-green-600" : "text-red-600")} />
            <p className="text-2xl font-bold">{moduleStats.reg44ThisMonth ? "Done" : "Due"}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Reg 44 This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <FileSearch className="h-5 w-5 mx-auto mb-1 text-indigo-600" />
            <p className="text-2xl font-bold">{moduleStats.draftReg45}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Reg 45 Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Scale className="h-5 w-5 mx-auto mb-1 text-teal-600" />
            <p className="text-2xl font-bold">{moduleStats.voiceLast30}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Voice Entries (30d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
            <p className="text-2xl font-bold">{moduleStats.evidenceCount}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Evidence Items</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Cara proactive intelligence panel ─────────────────────────────── */}
      {caraAlerts.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 mb-4 flex items-start gap-3">
          <Brain className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-violet-900">
              Cara has detected {caraAlerts.length} proactive {caraAlerts.length === 1 ? "alert" : "alerts"} from live records
            </p>
            <p className="text-xs text-violet-700 mt-0.5">
              {caraAlerts.filter((a) => a.severity === "urgent").length} urgent ·{" "}
              {caraAlerts.filter((a) => a.severity === "high").length} high ·{" "}
              {caraAlerts.filter((a) => a.severity === "medium").length} medium —
              patterns, voice gaps and compliance concerns surfaced automatically
            </p>
          </div>
          <Link href="/intelligence/cara/pattern-intelligence">
            <Button size="sm" variant="outline" className="gap-1.5 text-violet-700 border-violet-300 hover:bg-violet-100 shrink-0">
              <ArrowUpRight className="h-3.5 w-3.5" />
              View all
            </Button>
          </Link>
        </div>
      )}

      {/* ── critical alert banner ─────────────────────────────────────────── */}
      {stats[0].value > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-red-800">
              {stats[0].value} critical {stats[0].value === 1 ? "item requires" : "items require"} immediate attention
            </p>
            <p className="text-red-700">
              Critical items may have regulatory, safeguarding, or child safety implications. These should be addressed before the end of your shift.
            </p>
          </div>
        </div>
      )}

      {/* ── filter controls ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterUrgency} onValueChange={setFilterUrgency}>
          <SelectTrigger className="w-[160px]">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <SelectValue placeholder="All Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgency</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <Activity className="h-4 w-4 mr-1" />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-[160px]">
            <Calendar className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="48h">Last 48 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="14d">Last 14 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto text-sm text-muted-foreground flex items-center gap-1">
          <Activity className="h-4 w-4" />
          {filtered.length} {filtered.length === 1 ? "item" : "items"}
        </div>
      </div>

      {/* ── attention items list ───────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nothing needs your attention"
          description="All items have been reviewed for the selected filters. Adjust the filters or check back later."
          actions={[
            {
              label: "Show All Items",
              onClick: () => {
                setFilterCategory("all");
                setFilterUrgency("all");
                setFilterStatus("all");
                setFilterPeriod("all");
              },
              variant: "outline",
            },
          ]}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const open = expandedId === item.id;
            const catMeta = CATEGORY_META[item.category];
            const urgStyle = URGENCY_STYLES[item.urgency];
            const CatIcon = catMeta.icon;
            const overdue = isOverdue(item.dueDate);

            return (
              <Card
                key={item.id}
                className={cn(
                  "border-l-4 transition-shadow",
                  urgStyle.border,
                  item.urgency === "critical" && "ring-1 ring-red-200",
                  open && "shadow-md",
                )}
              >
                {/* ── collapsed header row ──────────────────────────────────── */}
                <div
                  className="flex items-start justify-between p-4 cursor-pointer select-none"
                  onClick={() => toggle(item.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(item.id); } }}
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* badges row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className={cn("text-[11px]", urgStyle.badge)}>
                        {urgStyle.label}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[11px] gap-1", catMeta.badge)}>
                        <CatIcon className="h-3 w-3" />
                        {catMeta.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px]",
                          item.status === "open" && "bg-emerald-50 text-emerald-700",
                          item.status === "in_progress" && "bg-blue-50 text-blue-700",
                          item.status === "reviewed" && "bg-slate-50 text-[var(--cs-text-secondary)]",
                          item.status === "escalated" && "bg-red-50 text-red-700",
                          item.status === "closed" && "bg-gray-50 text-gray-500",
                        )}
                      >
                        {STATUS_LABELS[item.status]}
                      </Badge>
                      {overdue && (
                        <Badge variant="outline" className="text-[11px] bg-red-50 text-red-700 border-red-200">
                          <Clock className="h-3 w-3 mr-0.5" />
                          Overdue
                        </Badge>
                      )}
                    </div>

                    {/* title */}
                    <p className="text-sm font-semibold text-[var(--cs-navy)] leading-snug">
                      {item.title}
                    </p>

                    {/* meta line */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {item.childName && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {item.childName}
                        </span>
                      )}
                      {item.staffName && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {item.staffName}
                        </span>
                      )}
                      {item.dueDate && (
                        <span className={cn("flex items-center gap-1", overdue && "text-red-600 font-medium")}>
                          <Clock className="h-3 w-3" />
                          Due {formatDate(item.dueDate)}
                        </span>
                      )}
                      <span>
                        Created {formatDate(item.createdAt)}
                      </span>
                      <SmartLinkBadge sourceType={item.category} sourceId={item.id} />
                    </div>
                  </div>

                  <div className="ml-3 mt-1 shrink-0">
                    {open ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* ── expanded detail panel ──────────────────────────────────── */}
                {open && (
                  <div className="px-4 pb-4 pt-0 space-y-4 border-t border-[var(--cs-border-subtle)]">
                    {/* reason */}
                    <div className="pt-3">
                      <p className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">
                        Why this needs attention
                      </p>
                      <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">
                        {item.reason}
                      </p>
                    </div>

                    {/* suggested action */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        Suggested Action
                      </p>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {item.suggestedAction}
                      </p>
                    </div>

                    {/* context strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {item.childName && (
                        <div className="bg-muted/40 rounded-lg p-2.5">
                          <p className="font-medium text-[var(--cs-text-secondary)] mb-0.5">Child</p>
                          <p className="text-[var(--cs-navy)]">{item.childName}</p>
                        </div>
                      )}
                      {item.staffName && (
                        <div className="bg-muted/40 rounded-lg p-2.5">
                          <p className="font-medium text-[var(--cs-text-secondary)] mb-0.5">Staff</p>
                          <p className="text-[var(--cs-navy)]">{item.staffName}</p>
                        </div>
                      )}
                      <div className="bg-muted/40 rounded-lg p-2.5">
                        <p className="font-medium text-[var(--cs-text-secondary)] mb-0.5">Status</p>
                        <p className="text-[var(--cs-navy)]">{STATUS_LABELS[item.status]}</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-2.5">
                        <p className="font-medium text-[var(--cs-text-secondary)] mb-0.5">Created</p>
                        <p className="text-[var(--cs-navy)]">{formatDate(item.createdAt)}</p>
                      </div>
                      {item.dueDate && (
                        <div className={cn("rounded-lg p-2.5", overdue ? "bg-red-50" : "bg-muted/40")}>
                          <p className={cn("font-medium mb-0.5", overdue ? "text-red-600" : "text-[var(--cs-text-secondary)]")}>Due Date</p>
                          <p className={cn(overdue ? "text-red-800 font-semibold" : "text-[var(--cs-navy)]")}>{formatDate(item.dueDate)}</p>
                        </div>
                      )}
                    </div>

                    {/* action buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--cs-border-subtle)]">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Open Record
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        Add Oversight
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5" />
                        Assign Task
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                        <Sparkles className="h-3.5 w-3.5" />
                        Request Cara Draft
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateItem.mutate({ id: item.id, status: "reviewed" });
                          setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "reviewed" } : i));
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark Reviewed
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateItem.mutate({ id: item.id, status: "escalated" });
                          setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "escalated" } : i));
                        }}
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Escalate to RI
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── operational intelligence cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <CardErrorBoundary><SupervisionIntelligenceCard /></CardErrorBoundary>
        <CardErrorBoundary><RegulatoryReportingCard /></CardErrorBoundary>
        <CardErrorBoundary><RiskIntelligenceCard /></CardErrorBoundary>
        <CardErrorBoundary><IncidentAnalyticsCard /></CardErrorBoundary>
        <CardErrorBoundary><RecordingQualityCard /></CardErrorBoundary>
        <CardErrorBoundary><RecordingCultureCard /></CardErrorBoundary>
        <CardErrorBoundary><RecordingTrendCard /></CardErrorBoundary>
        <CardErrorBoundary><SafeguardingIntelligenceCard /></CardErrorBoundary>
        <CardErrorBoundary><MedicationIntelligenceCard /></CardErrorBoundary>
        <CardErrorBoundary><ContactEngagementCard /></CardErrorBoundary>
        <CardErrorBoundary><EducationIntelligenceCard /></CardErrorBoundary>
        <CardErrorBoundary><HealthWellbeingCard /></CardErrorBoundary>
        <CardErrorBoundary><MissingFromCareCard /></CardErrorBoundary>
        <CardErrorBoundary><ComplaintsNotificationsCard /></CardErrorBoundary>
        <CardErrorBoundary><PlacementIntelligenceCard /></CardErrorBoundary>
        <CardErrorBoundary><BehaviourIntelligenceCard /></CardErrorBoundary>
        <CardErrorBoundary><RotaIntelligenceCard /></CardErrorBoundary>
        <CardErrorBoundary><PremisesIntelligenceCard /></CardErrorBoundary>
        <CardErrorBoundary><TrainingIntelligenceCard /></CardErrorBoundary>
        <CardErrorBoundary><FinanceIntelligenceCard /></CardErrorBoundary>
        <CardErrorBoundary><LifeSkillsCard /></CardErrorBoundary>
        <CardErrorBoundary><NotifiableEventsCard /></CardErrorBoundary>
        <CardErrorBoundary><SCCIFEvaluationCard /></CardErrorBoundary>
        <CardErrorBoundary><VisitorsCard /></CardErrorBoundary>
        <CardErrorBoundary><OutcomesCard /></CardErrorBoundary>
        <CardErrorBoundary><HandoverCard /></CardErrorBoundary>
        <CardErrorBoundary><AppraisalsCard /></CardErrorBoundary>
        <CardErrorBoundary><MeetingsCard /></CardErrorBoundary>
        <CardErrorBoundary><RestraintCard /></CardErrorBoundary>
        <CardErrorBoundary><QualityAssuranceCard /></CardErrorBoundary>
        <CardErrorBoundary><PossessionsCard /></CardErrorBoundary>
        <CardErrorBoundary><EmergencyCard /></CardErrorBoundary>
        <CardErrorBoundary><SaferRecruitmentCard /></CardErrorBoundary>
        <CardErrorBoundary><LeavingCareCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffDisciplinaryCard /></CardErrorBoundary>
        <CardErrorBoundary><SanctionsRewardsCard /></CardErrorBoundary>
        <CardErrorBoundary><ContextualSafeguardingCard /></CardErrorBoundary>
        <CardErrorBoundary><DeprivationOfLibertyCard /></CardErrorBoundary>
        <CardErrorBoundary><WhistleblowingCard /></CardErrorBoundary>
        <CardErrorBoundary><PoliciesRegisterCard /></CardErrorBoundary>
        <CardErrorBoundary><AdvocacyCard /></CardErrorBoundary>
        <CardErrorBoundary><MultiAgencyCard /></CardErrorBoundary>
        <CardErrorBoundary><NightMonitoringCard /></CardErrorBoundary>
        <CardErrorBoundary><CulturalIdentityCard /></CardErrorBoundary>
        <CardErrorBoundary><SubstanceMisuseCard /></CardErrorBoundary>
        <CardErrorBoundary><IndependentVisitorsCard /></CardErrorBoundary>
        <CardErrorBoundary><BusinessContinuityCard /></CardErrorBoundary>
        <CardErrorBoundary><StatementOfPurposeCard /></CardErrorBoundary>
        <CardErrorBoundary><Reg45ReportsCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensGuideCard /></CardErrorBoundary>
        <CardErrorBoundary><TransitionPlanningCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensParticipationCard /></CardErrorBoundary>
        <CardErrorBoundary><FoodNutritionCard /></CardErrorBoundary>
        <CardErrorBoundary><PocketMoneyCard /></CardErrorBoundary>
        <CardErrorBoundary><EnvironmentalSafetyCard /></CardErrorBoundary>
        <CardErrorBoundary><RecordsManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><SleepPatternsCard /></CardErrorBoundary>
        <CardErrorBoundary><StakeholderEngagementCard /></CardErrorBoundary>
        <CardErrorBoundary><ImpactRiskAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffWellbeingCard /></CardErrorBoundary>
        <CardErrorBoundary><KpiTrackingCard /></CardErrorBoundary>
        <CardErrorBoundary><ProfessionalDevelopmentCard /></CardErrorBoundary>
        <CardErrorBoundary><TherapeuticInterventionsCard /></CardErrorBoundary>
        <CardErrorBoundary><WorkforcePlanningCard /></CardErrorBoundary>
        <CardErrorBoundary><CarePlanningCard /></CardErrorBoundary>
        <CardErrorBoundary><FamilyEngagementCard /></CardErrorBoundary>
        <CardErrorBoundary><CommissioningReferralsCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensRightsCard /></CardErrorBoundary>
        <CardErrorBoundary><PracticeLearningCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffAbsenceCard /></CardErrorBoundary>
        <CardErrorBoundary><ActivityPlanningCard /></CardErrorBoundary>
        <CardErrorBoundary><OnlineSafetyCard /></CardErrorBoundary>
        <CardErrorBoundary><LACReviewCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffInductionCard /></CardErrorBoundary>
        <CardErrorBoundary><DutyOfCandourCard /></CardErrorBoundary>
        <CardErrorBoundary><AntiBullyingCard /></CardErrorBoundary>
        <CardErrorBoundary><ConsentManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><SignificantEventsCard /></CardErrorBoundary>
        <CardErrorBoundary><LegalStatusCard /></CardErrorBoundary>
        <CardErrorBoundary><BodyMapCard /></CardErrorBoundary>
        <CardErrorBoundary><KeyDocumentsCard /></CardErrorBoundary>
        <CardErrorBoundary><PlacementStabilityCard /></CardErrorBoundary>
        <CardErrorBoundary><ProviderVisitsCard /></CardErrorBoundary>
        <CardErrorBoundary><MatchingReferralCard /></CardErrorBoundary>
        <CardErrorBoundary><IndependencePreparationCard /></CardErrorBoundary>
        <CardErrorBoundary><SensoryProfileCard /></CardErrorBoundary>
        <CardErrorBoundary><PeerMentoringCard /></CardErrorBoundary>
        <CardErrorBoundary><ContactMonitoringCard /></CardErrorBoundary>
        <CardErrorBoundary><AttachmentRelationshipsCard /></CardErrorBoundary>
        <CardErrorBoundary><DiversityInclusionCard /></CardErrorBoundary>
        <CardErrorBoundary><EmergencyPlacementCard /></CardErrorBoundary>
        <CardErrorBoundary><CourtProceedingsCard /></CardErrorBoundary>
        <CardErrorBoundary><BehaviourSupportPlansCard /></CardErrorBoundary>
        <CardErrorBoundary><DischargeTransitionCard /></CardErrorBoundary>
        <CardErrorBoundary><MedicationErrorsCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensAchievementsCard /></CardErrorBoundary>
        <CardErrorBoundary><RiskRegisterCard /></CardErrorBoundary>
        <CardErrorBoundary><DelegatedAuthorityCard /></CardErrorBoundary>
        <CardErrorBoundary><LanguageCommunicationCard /></CardErrorBoundary>
        <CardErrorBoundary><IndividualRiskAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><ParentalResponsibilityCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensWishesFeelingsCard /></CardErrorBoundary>
        <CardErrorBoundary><DailyRoutineCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildExploitationScreeningCard /></CardErrorBoundary>
        <CardErrorBoundary><TraumaInformedCareCard /></CardErrorBoundary>
        <CardErrorBoundary><RespiteShortBreaksCard /></CardErrorBoundary>
        <CardErrorBoundary><MedicationAdministrationCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffSupervisionSessionsCard /></CardErrorBoundary>
        <CardErrorBoundary><FireSafetyCard /></CardErrorBoundary>
        <CardErrorBoundary><SecureStorageCard /></CardErrorBoundary>
        <CardErrorBoundary><ComplaintsInvestigationCard /></CardErrorBoundary>
        <CardErrorBoundary><WorkforceDiversityCard /></CardErrorBoundary>
        <CardErrorBoundary><VisitorManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><EmergencyAdmissionsCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffGrievanceCard /></CardErrorBoundary>
        <CardErrorBoundary><EqualityHumanRightsCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensFundManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffAttendanceCard /></CardErrorBoundary>
        <CardErrorBoundary><AllegationManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><TransportSafetyCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffTeamMeetingsCard /></CardErrorBoundary>
        <CardErrorBoundary><CctvSurveillanceCard /></CardErrorBoundary>
        <CardErrorBoundary><MealtimesNutritionCard /></CardErrorBoundary>
        <CardErrorBoundary><BuildingSecurityCard /></CardErrorBoundary>
        <CardErrorBoundary><WaterSafetyCard /></CardErrorBoundary>
        <CardErrorBoundary><InfectionControlCard /></CardErrorBoundary>
        <CardErrorBoundary><MaintenanceRepairsCard /></CardErrorBoundary>
        <CardErrorBoundary><GiftsHospitalityCard /></CardErrorBoundary>
        <CardErrorBoundary><BedroomAuditCard /></CardErrorBoundary>
        <CardErrorBoundary><LaundryClothingCard /></CardErrorBoundary>
        <CardErrorBoundary><EmergencyDrillCard /></CardErrorBoundary>
        <CardErrorBoundary><HealthAppointmentsCard /></CardErrorBoundary>
        <CardErrorBoundary><CommunalAreaAuditCard /></CardErrorBoundary>
        <CardErrorBoundary><NotificationsRegisterCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffExitInterviewsCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensMeetingsCard /></CardErrorBoundary>
        <CardErrorBoundary><HolidayTripsCard /></CardErrorBoundary>
        <CardErrorBoundary><DataProtectionCard /></CardErrorBoundary>
        <CardErrorBoundary><PanelDecisionsCard /></CardErrorBoundary>
        <CardErrorBoundary><VehicleManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><PestControlCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensFeedbackCard /></CardErrorBoundary>
        <CardErrorBoundary><UtilityManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><VolunteerManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><RoomTemperatureCard /></CardErrorBoundary>
        <CardErrorBoundary><MedicationAuditCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensAbsenceCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeImprovementCard /></CardErrorBoundary>
        <CardErrorBoundary><CleaningScheduleCard /></CardErrorBoundary>
        <CardErrorBoundary><KeyHoldingCard /></CardErrorBoundary>
        <CardErrorBoundary><PersonalHygieneCard /></CardErrorBoundary>
        <CardErrorBoundary><MissingPersonRiskCard /></CardErrorBoundary>
        <CardErrorBoundary><SafeguardingReferralCard /></CardErrorBoundary>
        <CardErrorBoundary><MedicationStorageCard /></CardErrorBoundary>
        <CardErrorBoundary><AdmissionAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffCompetencyAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><EnvironmentalAuditCard /></CardErrorBoundary>
        <CardErrorBoundary><ProfessionalConsultationCard /></CardErrorBoundary>
        <CardErrorBoundary><OfstedActionPlanCard /></CardErrorBoundary>
        <CardErrorBoundary><LifeStoryWorkCard /></CardErrorBoundary>
        <CardErrorBoundary><PositiveHandlingCard /></CardErrorBoundary>
        <CardErrorBoundary><ShiftHandoverQualityCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensProgressTrackingCard /></CardErrorBoundary>
        <CardErrorBoundary><KeyworkerSessionsCard /></CardErrorBoundary>
        <CardErrorBoundary><RestraintDebriefCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffReflectivePracticeCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffHandoverNotesCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildRiskAssessmentReviewCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeDecorationPersonalisationCard /></CardErrorBoundary>
        <CardErrorBoundary><MedicationConsentCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffLoneWorkingCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensTherapySessionsCard /></CardErrorBoundary>
        <CardErrorBoundary><NightWakingMonitoringCard /></CardErrorBoundary>
        <CardErrorBoundary><CommunityLinksIntegrationCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffMedicationCompetencyCard /></CardErrorBoundary>
        <CardErrorBoundary><BoundaryManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><InternetUsageMonitoringCard /></CardErrorBoundary>
        <CardErrorBoundary><SleepQualityAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><CulturalIdentitySupportCard /></CardErrorBoundary>
        <CardErrorBoundary><PocketMoneyManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildWellbeingCheckinCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffDebriefSupportCard /></CardErrorBoundary>
        <CardErrorBoundary><EducationAttendanceTrackingCard /></CardErrorBoundary>
        <CardErrorBoundary><ContactSupervisionCard /></CardErrorBoundary>
        <CardErrorBoundary><SelfHarmRiskMonitoringCard /></CardErrorBoundary>
        <CardErrorBoundary><RoomSharingAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><MedicationSideEffectsCard /></CardErrorBoundary>
        <CardErrorBoundary><PeerRelationshipAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeEnvironmentInspectionCard /></CardErrorBoundary>
        <CardErrorBoundary><ComplaintResolutionTrackingCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffSupervisionComplianceCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildDevelopmentMilestoneCard /></CardErrorBoundary>
        <CardErrorBoundary><VisitorFeedbackCollectionCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffShiftPatternMonitoringCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildDigitalWellbeingCard /></CardErrorBoundary>
        <CardErrorBoundary><FamilyEngagementTrackingCard /></CardErrorBoundary>
        <CardErrorBoundary><TransitionPlanningReadinessCard /></CardErrorBoundary>
        <CardErrorBoundary><KeyWorkerAllocationCard /></CardErrorBoundary>
        <CardErrorBoundary><ConsentCapacityMonitoringCard /></CardErrorBoundary>
        <CardErrorBoundary><BehaviourPatternAnalysisCard /></CardErrorBoundary>
        <CardErrorBoundary><PhysicalActivityTrackingCard /></CardErrorBoundary>
        <CardErrorBoundary><ReligiousCulturalObservanceCard /></CardErrorBoundary>
        <CardErrorBoundary><SiblingContactQualityCard /></CardErrorBoundary>
        <CardErrorBoundary><PrivacyDignityMonitoringCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensAspirationsGoalsCard /></CardErrorBoundary>
        <CardErrorBoundary><CreativeEnrichmentActivitiesCard /></CardErrorBoundary>
        <CardErrorBoundary><MedicationEffectivenessReviewCard /></CardErrorBoundary>
        <CardErrorBoundary><HealthScreeningImmunisationCard /></CardErrorBoundary>
        <CardErrorBoundary><SocialSkillsDevelopmentCard /></CardErrorBoundary>
        <CardErrorBoundary><RestorativeJusticePracticeCard /></CardErrorBoundary>
        <CardErrorBoundary><LeisureRecreationActivitiesCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeworkAcademicSupportCard /></CardErrorBoundary>
        <CardErrorBoundary><AdvocacyRepresentationCard /></CardErrorBoundary>
        <CardErrorBoundary><CelebrationMilestonesCard /></CardErrorBoundary>
        <CardErrorBoundary><WorkExperienceEmploymentCard /></CardErrorBoundary>
        <CardErrorBoundary><DeviceScreenTimeMonitoringCard /></CardErrorBoundary>
        <CardErrorBoundary><FinancialLiteracySavingsCard /></CardErrorBoundary>
        <CardErrorBoundary><FirstAidMedicalEmergencyCard /></CardErrorBoundary>
        <CardErrorBoundary><OutdoorSpacesPlayAreasCard /></CardErrorBoundary>
        <CardErrorBoundary><PositiveBehaviourReinforcementCard /></CardErrorBoundary>
        <CardErrorBoundary><DentalOpticalHealthCard /></CardErrorBoundary>
        <CardErrorBoundary><SelfEsteemConfidenceBuildingCard /></CardErrorBoundary>
        <CardErrorBoundary><ArrivalSettlingExperienceCard /></CardErrorBoundary>
        <CardErrorBoundary><HealthyEatingCookingSkillsCard /></CardErrorBoundary>
        <CardErrorBoundary><RelationshipEducationSafetyCard /></CardErrorBoundary>
        <CardErrorBoundary><PetCareResponsibilityCard /></CardErrorBoundary>
        <CardErrorBoundary><GardenHorticultureActivitiesCard /></CardErrorBoundary>
        <CardErrorBoundary><FaithSpiritualObservanceCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffPatternIntelligenceCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffPerformanceDipCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffBurnoutIndicatorCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffDevelopmentPlanCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffSupportPlanCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffPracticeRiskAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffTriggerMapCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffSupportActionCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffReviewOutcomeCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffConfidenceIndicatorCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffMandatoryTrainingCard /></CardErrorBoundary>
        <CardErrorBoundary><YoungPersonDailyDiaryCard /></CardErrorBoundary>
        <CardErrorBoundary><ProfessionalNetworkDirectoryCard /></CardErrorBoundary>
        <CardErrorBoundary><MenuPlanningDietaryCard /></CardErrorBoundary>
        <CardErrorBoundary><EhcpSendMonitoringCard /></CardErrorBoundary>
        <CardErrorBoundary><PlacementMatchingAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><Reg44IndependentVisitorCard /></CardErrorBoundary>
        <CardErrorBoundary><EmotionalWellbeingOutcomeCard /></CardErrorBoundary>
        <CardErrorBoundary><ComplianceCertificateCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeClosurePlanningCard /></CardErrorBoundary>
        <CardErrorBoundary><ParentalContactArrangementCard /></CardErrorBoundary>
        <CardErrorBoundary><SafeguardingPartnershipCard /></CardErrorBoundary>
        <CardErrorBoundary><LacHealthAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffWhistleblowingInvestigationCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeAtmosphereAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><QualityOfCareReviewCard /></CardErrorBoundary>
        <CardErrorBoundary><MedicationIncidentReportingCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffAnnualLeaveCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensPocketMoneyAuditCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffConflictOfInterestCard /></CardErrorBoundary>
        <CardErrorBoundary><EnvironmentalImpactAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffRetentionExitAnalysisCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildSexualExploitationRiskCard /></CardErrorBoundary>
        <CardErrorBoundary><OfstedInspectionReadinessCard /></CardErrorBoundary>
        <CardErrorBoundary><YoungPersonEmploymentSupportCard /></CardErrorBoundary>
        <CardErrorBoundary><SleepDisturbanceInterventionCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildCriminalExploitationRiskCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffSicknessManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeInsuranceComplianceCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildVoiceParticipationTrackingCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffCodeOfConductComplianceCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeEnergyEfficiencyCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildRadicalisationPreventionCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffNvqQualificationTrackingCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeAccessibilityAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildNutritionWeightMonitoringCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffDbsRenewalTrackingCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeFireRiskAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildSubstanceMisuseScreeningCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffReturnToWorkInterviewCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeLegionellaRiskAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildBereavementSupportCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffMandatoryRefresherTrainingCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeAsbestosManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildGangsAffiliationRiskCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffAgencyWorkerComplianceCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeRadonTestingCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildFgmRiskAssessmentCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffProfessionalRegistrationCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeElectricalSafetyCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildForcedMarriageRiskCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffSecondmentManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeGasSafetyCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildModernSlaveryRiskCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffPayrollComplianceCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeLiftEquipmentSafetyCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildHonourBasedAbuseRiskCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffExitInterviewManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeWaterHygieneManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildRadicalisationRiskCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffWhistleblowingManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><HomePestControlManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildTraffickingRiskCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffOvertimeManagementCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeCctvComplianceCard /></CardErrorBoundary>
        <CardErrorBoundary><ChildOnlineSafetyMonitoringCard /></CardErrorBoundary>
        <CardErrorBoundary><StaffLoneWorkingRiskCard /></CardErrorBoundary>
        <CardErrorBoundary><HomeEmergencyLightingCard /></CardErrorBoundary>
      </div>

      {/* ── regulatory note ────────────────────────────────────────────────── */}
      <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
        <p className="font-semibold mb-1">Regulatory Framework</p>
        <p>
          Children&apos;s Homes (England) Regulations 2015 — Reg 13 (leadership and management),
          Reg 40 (notifications), Reg 44 (independent person visits), Reg 45 (review of quality of care).
          The Manager Control Centre surfaces items requiring oversight by the Registered Manager as required
          under the social care common inspection framework. Quality Standards 1–6 are monitored through
          category-specific attention items. Items marked as Cara patterns are generated by the platform&apos;s
          intelligence layer and require human review before any action is taken.
        </p>
      </div>
    </PageShell>
  );
}
