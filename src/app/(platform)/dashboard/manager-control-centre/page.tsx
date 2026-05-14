"use client";

import { useState, useMemo, useEffect } from "react";
import { PageShell } from "@/components/ui/page-shell";
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
import { AriaDailyIntelligence } from "@/components/aria/aria-daily-intelligence";
import { SupervisionIntelligenceCard } from "@/components/dashboard/supervision-intelligence-card";
import { RegulatoryReportingCard } from "@/components/dashboard/regulatory-reporting-card";
import { RiskIntelligenceCard } from "@/components/dashboard/risk-intelligence-card";
import { IncidentAnalyticsCard } from "@/components/dashboard/incident-analytics-card";
import { RecordingQualityCard } from "@/components/dashboard/recording-quality-card";
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
import { LacReviewCard } from "@/components/dashboard/lac-review-card";
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
import { EmotionalRegulationSupportCard } from "@/components/dashboard/emotional-regulation-support-card";
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
import type {
  AttentionCategory,
  Urgency,
  AttentionStatus,
} from "@/types/intelligence.layer";

/* ══════════════════════════════════════════════════════════════════════════════
   CORNERSTONE — MANAGER CONTROL CENTRE
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
  log_approval:          { label: "Log Approval",          badge: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-navy)]", icon: ClipboardCheck },
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
  aria_pattern:          { label: "ARIA Pattern",          badge: "bg-purple-100 text-purple-800", icon: Brain },
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

const DEMO_ITEMS: AttentionItem[] = [
  {
    id: "att_001",
    title: "Serious incident report requires manager oversight",
    category: "serious_incident",
    urgency: "critical",
    status: "open",
    reason: "A serious incident was recorded on " + d(-1) + " involving Child A. No manager oversight has been added within the required 24-hour window. Ofsted notification may be required under Reg 40.",
    suggestedAction: "Review the incident record, add your oversight analysis, and determine whether Ofsted notification is required. Consider whether a staff debrief and learning review are needed.",
    dueDate: d(0),
    childName: "Child A",
    createdAt: d(-1),
  },
  {
    id: "att_002",
    title: "Missing from care episode — return interview overdue",
    category: "missing_from_care",
    urgency: "critical",
    status: "open",
    reason: "Child B returned from a missing episode 48 hours ago. The independent return interview has not been completed. This is a statutory requirement and the placing authority must be informed.",
    suggestedAction: "Arrange the independent return interview urgently. Ensure the placing authority and police are informed of the return. Update the missing from care log with return details.",
    dueDate: d(-1),
    childName: "Child B",
    createdAt: d(-2),
  },
  {
    id: "att_003",
    title: "Incident log awaiting manager review",
    category: "incident_oversight",
    urgency: "high",
    status: "open",
    reason: "Three incident records from the past 5 days have no manager oversight recorded. Regulation 40 requires the registered person to ensure proper oversight of all significant events.",
    suggestedAction: "Review each incident, add oversight notes covering your analysis of triggers, response quality, and follow-up actions needed. Link to relevant risk assessments.",
    dueDate: d(1),
    childName: "Child C",
    createdAt: d(-3),
  },
  {
    id: "att_004",
    title: "Medication audit discrepancy identified",
    category: "medication_check",
    urgency: "high",
    status: "open",
    reason: "The weekly medication count for Child A shows a discrepancy of 2 tablets of prescribed medication. This must be investigated and resolved immediately as per the home's medication policy.",
    suggestedAction: "Conduct a full medication reconciliation. Check all MAR sheets against stock. Interview staff who administered medication during the relevant period. Record findings and any corrective action.",
    dueDate: d(0),
    childName: "Child A",
    staffName: "Staff Member D",
    createdAt: d(-1),
  },
  {
    id: "att_005",
    title: "Staff supervision overdue by 3 weeks",
    category: "supervision_overdue",
    urgency: "high",
    status: "open",
    reason: "Staff Member B has not had formal supervision for 7 weeks. The home's statement of purpose commits to supervision every 4 weeks. This is a common area of Ofsted scrutiny.",
    suggestedAction: "Schedule supervision within the next 5 working days. Prepare agenda covering recent incidents, training needs, wellbeing, and professional development. Record on the supervision log.",
    dueDate: d(5),
    staffName: "Staff Member B",
    createdAt: d(-7),
  },
  {
    id: "att_006",
    title: "Risk assessment review overdue — self-harm",
    category: "risk_assessment_review",
    urgency: "high",
    status: "in_progress",
    reason: "Child C's self-harm risk assessment was last reviewed 8 weeks ago. The review frequency is set to 4-weekly due to active risk. A recent incident may indicate escalation.",
    suggestedAction: "Complete the risk assessment review incorporating recent incident data. Consider whether the risk level or management strategies need updating. Consult with CAMHS if appropriate.",
    dueDate: d(-3),
    childName: "Child C",
    createdAt: d(-5),
  },
  {
    id: "att_007",
    title: "Placement plan update required",
    category: "placement_plan_update",
    urgency: "medium",
    status: "open",
    reason: "Child A's placement plan has not been updated following the last LAC review held 2 weeks ago. The agreed actions from the review need to be incorporated into the plan.",
    suggestedAction: "Update the placement plan to reflect the LAC review outcomes. Ensure all agreed actions are captured with responsible persons and timescales. Share the updated plan with the placing authority.",
    dueDate: d(3),
    childName: "Child A",
    createdAt: d(-10),
  },
  {
    id: "att_008",
    title: "Key work session overdue",
    category: "key_work_overdue",
    urgency: "medium",
    status: "open",
    reason: "Child B has not had a recorded key work session for 3 weeks. The care plan specifies weekly key work. This is an important mechanism for capturing the child's voice and monitoring wellbeing.",
    suggestedAction: "Schedule a key work session this week. Focus on the child's current wishes and feelings, any concerns, and progress against care plan targets. Record the session promptly.",
    dueDate: d(2),
    childName: "Child B",
    staffName: "Staff Member E",
    createdAt: d(-4),
  },
  {
    id: "att_009",
    title: "Wishes and feelings not captured this month",
    category: "wishes_feelings_missing",
    urgency: "medium",
    status: "open",
    reason: "No wishes and feelings entry has been recorded for Child C in the current calendar month. The voice of the child is a central focus for Ofsted inspections under the social care common inspection framework.",
    suggestedAction: "Ensure the key worker captures Child C's wishes and feelings through an appropriate method (direct conversation, activity, creative work). Record in the child's voice where possible.",
    childName: "Child C",
    createdAt: d(-6),
  },
  {
    id: "att_010",
    title: "Daily logs awaiting approval",
    category: "log_approval",
    urgency: "medium",
    status: "open",
    reason: "Five daily log entries from the past 7 days have not been reviewed and approved by management. Regular log review demonstrates active oversight and ensures recording quality.",
    suggestedAction: "Review each pending log entry for accuracy, completeness, and tone. Approve entries that meet the standard. Return any that need amendment with clear guidance for the author.",
    dueDate: d(1),
    createdAt: d(-2),
  },
  {
    id: "att_011",
    title: "Reg 44 visit action overdue",
    category: "reg44_action_overdue",
    urgency: "medium",
    status: "open",
    reason: "An action from the last Reg 44 independent visitor's report (dated " + d(-30) + ") regarding fire evacuation drill frequency remains incomplete. The action was due " + d(-7) + ".",
    suggestedAction: "Complete the outstanding action or provide a written update to the independent visitor explaining the delay and revised timescale. Record completion evidence in the Reg 44 action tracker.",
    dueDate: d(-7),
    createdAt: d(-14),
  },
  {
    id: "att_012",
    title: "Training gap — physical intervention refresher",
    category: "training_gap",
    urgency: "medium",
    status: "open",
    reason: "Staff Member C's physical intervention certification expired 2 weeks ago. They must not be involved in any physical intervention until the refresher is completed. This affects shift planning.",
    suggestedAction: "Book the next available physical intervention refresher course. Update the rota to ensure Staff Member C is always paired with a certified colleague until recertification. Notify Staff Member C in writing.",
    staffName: "Staff Member C",
    createdAt: d(-14),
  },
  {
    id: "att_013",
    title: "Complaint from placing authority — response due",
    category: "complaint_open",
    urgency: "high",
    status: "in_progress",
    reason: "A formal complaint was received from the placing authority for Child B regarding communication about a recent incident. The complaints procedure requires an initial response within 5 working days.",
    suggestedAction: "Draft a response to the complaint. Review the incident communication timeline. Identify any gaps in the notification process and outline corrective steps. Log on the complaints register.",
    dueDate: d(2),
    childName: "Child B",
    createdAt: d(-3),
  },
  {
    id: "att_014",
    title: "ARIA has detected a pattern — escalating behaviour",
    category: "aria_pattern",
    urgency: "medium",
    status: "open",
    reason: "ARIA has identified a pattern of escalating behaviour incidents involving Child A over the past 14 days. The frequency has increased from 1 per week to 3 per week, with increasing severity. This may correlate with reduced family contact during the same period.",
    suggestedAction: "Review the behaviour trend analysis. Consider whether the behaviour support plan needs updating. Explore the link to family contact patterns. Discuss with the team and consider a multi-agency strategy meeting.",
    childName: "Child A",
    createdAt: d(-1),
  },
  {
    id: "att_015",
    title: "Reg 45 report — evidence gap in quality of care",
    category: "reg45_evidence_gap",
    urgency: "low",
    status: "open",
    reason: "The upcoming Reg 45 half-yearly report has a gap in evidencing quality of care outcomes for the current period. Specifically, there are limited recorded examples of how the home has responded to children's individual needs.",
    suggestedAction: "Gather evidence from key work records, daily logs, and activity records that demonstrate individualised care. Ask staff to provide specific examples for each child. Compile into the evidence folder.",
    dueDate: d(14),
    createdAt: d(-7),
  },
];

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
  { value: "aria_pattern", label: "ARIA Pattern" },
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

  const [items, setItems] = useState<AttentionItem[]>(DEMO_ITEMS);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("7d");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const updateItem = useUpdateAttentionItem();

  useEffect(() => {
    if (apiData?.persisted && apiData.items.length > 0) {
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
    const patternsDetected = activeItems.filter((i) => i.category === "aria_pattern").length;

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

      {/* ── ARIA Daily Intelligence Brief ─────────────────────────────────── */}
      <AriaDailyIntelligence className="mb-6" />

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
                        Request ARIA Draft
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
        <SupervisionIntelligenceCard />
        <RegulatoryReportingCard />
        <RiskIntelligenceCard />
        <IncidentAnalyticsCard />
        <RecordingQualityCard />
        <SafeguardingIntelligenceCard />
        <MedicationIntelligenceCard />
        <ContactEngagementCard />
        <EducationIntelligenceCard />
        <HealthWellbeingCard />
        <MissingFromCareCard />
        <ComplaintsNotificationsCard />
        <PlacementIntelligenceCard />
        <BehaviourIntelligenceCard />
        <RotaIntelligenceCard />
        <PremisesIntelligenceCard />
        <TrainingIntelligenceCard />
        <FinanceIntelligenceCard />
        <LifeSkillsCard />
        <NotifiableEventsCard />
        <SCCIFEvaluationCard />
        <VisitorsCard />
        <OutcomesCard />
        <HandoverCard />
        <AppraisalsCard />
        <MeetingsCard />
        <RestraintCard />
        <QualityAssuranceCard />
        <PossessionsCard />
        <EmergencyCard />
        <SaferRecruitmentCard />
        <LeavingCareCard />
        <StaffDisciplinaryCard />
        <SanctionsRewardsCard />
        <ContextualSafeguardingCard />
        <DeprivationOfLibertyCard />
        <WhistleblowingCard />
        <PoliciesRegisterCard />
        <AdvocacyCard />
        <MultiAgencyCard />
        <NightMonitoringCard />
        <CulturalIdentityCard />
        <SubstanceMisuseCard />
        <IndependentVisitorsCard />
        <BusinessContinuityCard />
        <StatementOfPurposeCard />
        <Reg45ReportsCard />
        <ChildrensGuideCard />
        <TransitionPlanningCard />
        <ChildrensParticipationCard />
        <FoodNutritionCard />
        <PocketMoneyCard />
        <EnvironmentalSafetyCard />
        <RecordsManagementCard />
        <SleepPatternsCard />
        <StakeholderEngagementCard />
        <ImpactRiskAssessmentCard />
        <StaffWellbeingCard />
        <KpiTrackingCard />
        <ProfessionalDevelopmentCard />
        <TherapeuticInterventionsCard />
        <WorkforcePlanningCard />
        <CarePlanningCard />
        <FamilyEngagementCard />
        <CommissioningReferralsCard />
        <ChildrensRightsCard />
        <PracticeLearningCard />
        <StaffAbsenceCard />
        <ActivityPlanningCard />
        <OnlineSafetyCard />
        <LacReviewCard />
        <StaffInductionCard />
        <DutyOfCandourCard />
        <AntiBullyingCard />
        <ConsentManagementCard />
        <SignificantEventsCard />
        <LegalStatusCard />
        <BodyMapCard />
        <KeyDocumentsCard />
        <PlacementStabilityCard />
        <ProviderVisitsCard />
        <MatchingReferralCard />
        <IndependencePreparationCard />
        <SensoryProfileCard />
        <PeerMentoringCard />
        <ContactMonitoringCard />
        <AttachmentRelationshipsCard />
        <DiversityInclusionCard />
        <EmergencyPlacementCard />
        <CourtProceedingsCard />
        <BehaviourSupportPlansCard />
        <DischargeTransitionCard />
        <MedicationErrorsCard />
        <ChildrensAchievementsCard />
        <RiskRegisterCard />
        <DelegatedAuthorityCard />
        <LanguageCommunicationCard />
        <IndividualRiskAssessmentCard />
        <ParentalResponsibilityCard />
        <ChildrensWishesFeelingsCard />
        <DailyRoutineCard />
        <ChildExploitationScreeningCard />
        <TraumaInformedCareCard />
        <RespiteShortBreaksCard />
        <MedicationAdministrationCard />
        <StaffSupervisionSessionsCard />
        <FireSafetyCard />
        <SecureStorageCard />
        <ComplaintsInvestigationCard />
        <WorkforceDiversityCard />
        <VisitorManagementCard />
        <EmergencyAdmissionsCard />
        <StaffGrievanceCard />
        <EqualityHumanRightsCard />
        <ChildrensFundManagementCard />
        <StaffAttendanceCard />
        <AllegationManagementCard />
        <TransportSafetyCard />
        <StaffTeamMeetingsCard />
        <CctvSurveillanceCard />
        <MealtimesNutritionCard />
        <BuildingSecurityCard />
        <WaterSafetyCard />
        <InfectionControlCard />
        <MaintenanceRepairsCard />
        <GiftsHospitalityCard />
        <BedroomAuditCard />
        <LaundryClothingCard />
        <EmergencyDrillCard />
        <HealthAppointmentsCard />
        <CommunalAreaAuditCard />
        <NotificationsRegisterCard />
        <StaffExitInterviewsCard />
        <ChildrensMeetingsCard />
        <HolidayTripsCard />
        <DataProtectionCard />
        <PanelDecisionsCard />
        <VehicleManagementCard />
        <PestControlCard />
        <ChildrensFeedbackCard />
        <UtilityManagementCard />
        <VolunteerManagementCard />
        <RoomTemperatureCard />
        <MedicationAuditCard />
        <ChildrensAbsenceCard />
        <HomeImprovementCard />
        <CleaningScheduleCard />
        <KeyHoldingCard />
        <PersonalHygieneCard />
        <MissingPersonRiskCard />
        <SafeguardingReferralCard />
        <MedicationStorageCard />
        <AdmissionAssessmentCard />
        <StaffCompetencyAssessmentCard />
        <EnvironmentalAuditCard />
        <ProfessionalConsultationCard />
        <OfstedActionPlanCard />
        <LifeStoryWorkCard />
        <PositiveHandlingCard />
        <ShiftHandoverQualityCard />
        <ChildrensProgressTrackingCard />
        <KeyworkerSessionsCard />
        <RestraintDebriefCard />
        <StaffReflectivePracticeCard />
        <StaffHandoverNotesCard />
        <ChildRiskAssessmentReviewCard />
        <HomeDecorationPersonalisationCard />
        <MedicationConsentCard />
        <StaffLoneWorkingCard />
        <ChildrensTherapySessionsCard />
        <NightWakingMonitoringCard />
        <CommunityLinksIntegrationCard />
        <StaffMedicationCompetencyCard />
        <BoundaryManagementCard />
        <EmotionalRegulationSupportCard />
        <InternetUsageMonitoringCard />
        <SleepQualityAssessmentCard />
        <CulturalIdentitySupportCard />
        <PocketMoneyManagementCard />
        <ChildWellbeingCheckinCard />
        <StaffDebriefSupportCard />
        <EducationAttendanceTrackingCard />
        <ContactSupervisionCard />
        <SelfHarmRiskMonitoringCard />
        <RoomSharingAssessmentCard />
        <MedicationSideEffectsCard />
        <PeerRelationshipAssessmentCard />
        <HomeEnvironmentInspectionCard />
        <ComplaintResolutionTrackingCard />
        <StaffSupervisionComplianceCard />
        <ChildDevelopmentMilestoneCard />
        <VisitorFeedbackCollectionCard />
        <StaffShiftPatternMonitoringCard />
        <ChildDigitalWellbeingCard />
        <FamilyEngagementTrackingCard />
        <TransitionPlanningReadinessCard />
        <KeyWorkerAllocationCard />
        <ConsentCapacityMonitoringCard />
        <BehaviourPatternAnalysisCard />
        <PhysicalActivityTrackingCard />
        <ReligiousCulturalObservanceCard />
        <SiblingContactQualityCard />
        <PrivacyDignityMonitoringCard />
        <ChildrensAspirationsGoalsCard />
        <CreativeEnrichmentActivitiesCard />
        <MedicationEffectivenessReviewCard />
        <HealthScreeningImmunisationCard />
        <SocialSkillsDevelopmentCard />
        <RestorativeJusticePracticeCard />
        <LeisureRecreationActivitiesCard />
        <HomeworkAcademicSupportCard />
        <AdvocacyRepresentationCard />
        <CelebrationMilestonesCard />
        <WorkExperienceEmploymentCard />
        <DeviceScreenTimeMonitoringCard />
      </div>

      {/* ── regulatory note ────────────────────────────────────────────────── */}
      <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
        <p className="font-semibold mb-1">Regulatory Framework</p>
        <p>
          Children&apos;s Homes (England) Regulations 2015 — Reg 13 (leadership and management),
          Reg 40 (notifications), Reg 44 (independent person visits), Reg 45 (review of quality of care).
          The Manager Control Centre surfaces items requiring oversight by the Registered Manager as required
          under the social care common inspection framework. Quality Standards 1–6 are monitored through
          category-specific attention items. Items marked as ARIA patterns are generated by the platform&apos;s
          intelligence layer and require human review before any action is taken.
        </p>
      </div>
    </PageShell>
  );
}
