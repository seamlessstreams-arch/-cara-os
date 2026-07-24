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
import { cn, localMonthKey } from "@/lib/utils";
import { CaraDailyIntelligence } from "@/components/cara/cara-daily-intelligence";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import dynamic from "next/dynamic";
import { CardSkeleton } from "@/components/dashboard/card-skeleton";
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

/* ── lazy-loaded dashboard cards (dynamic) ──────────────────────── */

const MissingFromCareCardLazy = dynamic(
  () => import("@/components/dashboard/missing-from-care-card")
    .then(mod => ({ default: mod.MissingFromCareCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ComplaintsNotificationsCardLazy = dynamic(
  () => import("@/components/dashboard/complaints-notifications-card")
    .then(mod => ({ default: mod.ComplaintsNotificationsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PlacementIntelligenceCardLazy = dynamic(
  () => import("@/components/dashboard/placement-intelligence-card")
    .then(mod => ({ default: mod.PlacementIntelligenceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const BehaviourIntelligenceCardLazy = dynamic(
  () => import("@/components/dashboard/behaviour-intelligence-card")
    .then(mod => ({ default: mod.BehaviourIntelligenceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const RotaIntelligenceCardLazy = dynamic(
  () => import("@/components/dashboard/rota-intelligence-card")
    .then(mod => ({ default: mod.RotaIntelligenceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PremisesIntelligenceCardLazy = dynamic(
  () => import("@/components/dashboard/premises-intelligence-card")
    .then(mod => ({ default: mod.PremisesIntelligenceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const TrainingIntelligenceCardLazy = dynamic(
  () => import("@/components/dashboard/training-intelligence-card")
    .then(mod => ({ default: mod.TrainingIntelligenceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const FinanceIntelligenceCardLazy = dynamic(
  () => import("@/components/dashboard/finance-intelligence-card")
    .then(mod => ({ default: mod.FinanceIntelligenceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const LifeSkillsCardLazy = dynamic(
  () => import("@/components/dashboard/life-skills-card")
    .then(mod => ({ default: mod.LifeSkillsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const NotifiableEventsCardLazy = dynamic(
  () => import("@/components/dashboard/notifiable-events-card")
    .then(mod => ({ default: mod.NotifiableEventsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SCCIFEvaluationCardLazy = dynamic(
  () => import("@/components/dashboard/s-c-c-i-f-evaluation-card")
    .then(mod => ({ default: mod.SCCIFEvaluationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const VisitorsCardLazy = dynamic(
  () => import("@/components/dashboard/visitors-card")
    .then(mod => ({ default: mod.VisitorsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const OutcomesCardLazy = dynamic(
  () => import("@/components/dashboard/outcomes-card")
    .then(mod => ({ default: mod.OutcomesCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HandoverCardLazy = dynamic(
  () => import("@/components/dashboard/handover-card")
    .then(mod => ({ default: mod.HandoverCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const AppraisalsCardLazy = dynamic(
  () => import("@/components/dashboard/appraisals-card")
    .then(mod => ({ default: mod.AppraisalsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MeetingsCardLazy = dynamic(
  () => import("@/components/dashboard/meetings-card")
    .then(mod => ({ default: mod.MeetingsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const RestraintCardLazy = dynamic(
  () => import("@/components/dashboard/restraint-card")
    .then(mod => ({ default: mod.RestraintCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const QualityAssuranceCardLazy = dynamic(
  () => import("@/components/dashboard/quality-assurance-card")
    .then(mod => ({ default: mod.QualityAssuranceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PossessionsCardLazy = dynamic(
  () => import("@/components/dashboard/possessions-card")
    .then(mod => ({ default: mod.PossessionsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const EmergencyCardLazy = dynamic(
  () => import("@/components/dashboard/emergency-card")
    .then(mod => ({ default: mod.EmergencyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SaferRecruitmentCardLazy = dynamic(
  () => import("@/components/dashboard/safer-recruitment-card")
    .then(mod => ({ default: mod.SaferRecruitmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const LeavingCareCardLazy = dynamic(
  () => import("@/components/dashboard/leaving-care-card")
    .then(mod => ({ default: mod.LeavingCareCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffDisciplinaryCardLazy = dynamic(
  () => import("@/components/dashboard/staff-disciplinary-card")
    .then(mod => ({ default: mod.StaffDisciplinaryCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SanctionsRewardsCardLazy = dynamic(
  () => import("@/components/dashboard/sanctions-rewards-card")
    .then(mod => ({ default: mod.SanctionsRewardsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ContextualSafeguardingCardLazy = dynamic(
  () => import("@/components/dashboard/contextual-safeguarding-card")
    .then(mod => ({ default: mod.ContextualSafeguardingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const DeprivationOfLibertyCardLazy = dynamic(
  () => import("@/components/dashboard/deprivation-of-liberty-card")
    .then(mod => ({ default: mod.DeprivationOfLibertyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const WhistleblowingCardLazy = dynamic(
  () => import("@/components/dashboard/whistleblowing-card")
    .then(mod => ({ default: mod.WhistleblowingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PoliciesRegisterCardLazy = dynamic(
  () => import("@/components/dashboard/policies-register-card")
    .then(mod => ({ default: mod.PoliciesRegisterCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const AdvocacyCardLazy = dynamic(
  () => import("@/components/dashboard/advocacy-card")
    .then(mod => ({ default: mod.AdvocacyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MultiAgencyCardLazy = dynamic(
  () => import("@/components/dashboard/multi-agency-card")
    .then(mod => ({ default: mod.MultiAgencyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const NightMonitoringCardLazy = dynamic(
  () => import("@/components/dashboard/night-monitoring-card")
    .then(mod => ({ default: mod.NightMonitoringCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const CulturalIdentityCardLazy = dynamic(
  () => import("@/components/dashboard/cultural-identity-card")
    .then(mod => ({ default: mod.CulturalIdentityCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SubstanceMisuseCardLazy = dynamic(
  () => import("@/components/dashboard/substance-misuse-card")
    .then(mod => ({ default: mod.SubstanceMisuseCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const IndependentVisitorsCardLazy = dynamic(
  () => import("@/components/dashboard/independent-visitors-card")
    .then(mod => ({ default: mod.IndependentVisitorsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const BusinessContinuityCardLazy = dynamic(
  () => import("@/components/dashboard/business-continuity-card")
    .then(mod => ({ default: mod.BusinessContinuityCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StatementOfPurposeCardLazy = dynamic(
  () => import("@/components/dashboard/statement-of-purpose-card")
    .then(mod => ({ default: mod.StatementOfPurposeCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const Reg45ReportsCardLazy = dynamic(
  () => import("@/components/dashboard/reg45reports-card")
    .then(mod => ({ default: mod.Reg45ReportsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildrensGuideCardLazy = dynamic(
  () => import("@/components/dashboard/childrens-guide-card")
    .then(mod => ({ default: mod.ChildrensGuideCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const TransitionPlanningCardLazy = dynamic(
  () => import("@/components/dashboard/transition-planning-card")
    .then(mod => ({ default: mod.TransitionPlanningCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildrensParticipationCardLazy = dynamic(
  () => import("@/components/dashboard/childrens-participation-card")
    .then(mod => ({ default: mod.ChildrensParticipationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const FoodNutritionCardLazy = dynamic(
  () => import("@/components/dashboard/food-nutrition-card")
    .then(mod => ({ default: mod.FoodNutritionCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PocketMoneyCardLazy = dynamic(
  () => import("@/components/dashboard/pocket-money-card")
    .then(mod => ({ default: mod.PocketMoneyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const EnvironmentalSafetyCardLazy = dynamic(
  () => import("@/components/dashboard/environmental-safety-card")
    .then(mod => ({ default: mod.EnvironmentalSafetyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const RecordsManagementCardLazy = dynamic(
  () => import("@/components/dashboard/records-management-card")
    .then(mod => ({ default: mod.RecordsManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SleepPatternsCardLazy = dynamic(
  () => import("@/components/dashboard/sleep-patterns-card")
    .then(mod => ({ default: mod.SleepPatternsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StakeholderEngagementCardLazy = dynamic(
  () => import("@/components/dashboard/stakeholder-engagement-card")
    .then(mod => ({ default: mod.StakeholderEngagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ImpactRiskAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/impact-risk-assessment-card")
    .then(mod => ({ default: mod.ImpactRiskAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffWellbeingCardLazy = dynamic(
  () => import("@/components/dashboard/staff-wellbeing-card")
    .then(mod => ({ default: mod.StaffWellbeingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const KpiTrackingCardLazy = dynamic(
  () => import("@/components/dashboard/kpi-tracking-card")
    .then(mod => ({ default: mod.KpiTrackingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ProfessionalDevelopmentCardLazy = dynamic(
  () => import("@/components/dashboard/professional-development-card")
    .then(mod => ({ default: mod.ProfessionalDevelopmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const TherapeuticInterventionsCardLazy = dynamic(
  () => import("@/components/dashboard/therapeutic-interventions-card")
    .then(mod => ({ default: mod.TherapeuticInterventionsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const WorkforcePlanningCardLazy = dynamic(
  () => import("@/components/dashboard/workforce-planning-card")
    .then(mod => ({ default: mod.WorkforcePlanningCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const CarePlanningCardLazy = dynamic(
  () => import("@/components/dashboard/care-planning-card")
    .then(mod => ({ default: mod.CarePlanningCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const FamilyEngagementCardLazy = dynamic(
  () => import("@/components/dashboard/family-engagement-card")
    .then(mod => ({ default: mod.FamilyEngagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const CommissioningReferralsCardLazy = dynamic(
  () => import("@/components/dashboard/commissioning-referrals-card")
    .then(mod => ({ default: mod.CommissioningReferralsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildrensRightsCardLazy = dynamic(
  () => import("@/components/dashboard/childrens-rights-card")
    .then(mod => ({ default: mod.ChildrensRightsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PracticeLearningCardLazy = dynamic(
  () => import("@/components/dashboard/practice-learning-card")
    .then(mod => ({ default: mod.PracticeLearningCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffAbsenceCardLazy = dynamic(
  () => import("@/components/dashboard/staff-absence-card")
    .then(mod => ({ default: mod.StaffAbsenceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ActivityPlanningCardLazy = dynamic(
  () => import("@/components/dashboard/activity-planning-card")
    .then(mod => ({ default: mod.ActivityPlanningCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const OnlineSafetyCardLazy = dynamic(
  () => import("@/components/dashboard/online-safety-card")
    .then(mod => ({ default: mod.OnlineSafetyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const LACReviewCardLazy = dynamic(
  () => import("@/components/dashboard/l-a-c-review-card")
    .then(mod => ({ default: mod.LACReviewCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffInductionCardLazy = dynamic(
  () => import("@/components/dashboard/staff-induction-card")
    .then(mod => ({ default: mod.StaffInductionCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const DutyOfCandourCardLazy = dynamic(
  () => import("@/components/dashboard/duty-of-candour-card")
    .then(mod => ({ default: mod.DutyOfCandourCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const AntiBullyingCardLazy = dynamic(
  () => import("@/components/dashboard/anti-bullying-card")
    .then(mod => ({ default: mod.AntiBullyingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ConsentManagementCardLazy = dynamic(
  () => import("@/components/dashboard/consent-management-card")
    .then(mod => ({ default: mod.ConsentManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SignificantEventsCardLazy = dynamic(
  () => import("@/components/dashboard/significant-events-card")
    .then(mod => ({ default: mod.SignificantEventsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const LegalStatusCardLazy = dynamic(
  () => import("@/components/dashboard/legal-status-card")
    .then(mod => ({ default: mod.LegalStatusCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const BodyMapCardLazy = dynamic(
  () => import("@/components/dashboard/body-map-card")
    .then(mod => ({ default: mod.BodyMapCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const KeyDocumentsCardLazy = dynamic(
  () => import("@/components/dashboard/key-documents-card")
    .then(mod => ({ default: mod.KeyDocumentsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PlacementStabilityCardLazy = dynamic(
  () => import("@/components/dashboard/placement-stability-card")
    .then(mod => ({ default: mod.PlacementStabilityCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ProviderVisitsCardLazy = dynamic(
  () => import("@/components/dashboard/provider-visits-card")
    .then(mod => ({ default: mod.ProviderVisitsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MatchingReferralCardLazy = dynamic(
  () => import("@/components/dashboard/matching-referral-card")
    .then(mod => ({ default: mod.MatchingReferralCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const IndependencePreparationCardLazy = dynamic(
  () => import("@/components/dashboard/independence-preparation-card")
    .then(mod => ({ default: mod.IndependencePreparationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SensoryProfileCardLazy = dynamic(
  () => import("@/components/dashboard/sensory-profile-card")
    .then(mod => ({ default: mod.SensoryProfileCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PeerMentoringCardLazy = dynamic(
  () => import("@/components/dashboard/peer-mentoring-card")
    .then(mod => ({ default: mod.PeerMentoringCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ContactMonitoringCardLazy = dynamic(
  () => import("@/components/dashboard/contact-monitoring-card")
    .then(mod => ({ default: mod.ContactMonitoringCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const AttachmentRelationshipsCardLazy = dynamic(
  () => import("@/components/dashboard/attachment-relationships-card")
    .then(mod => ({ default: mod.AttachmentRelationshipsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const DiversityInclusionCardLazy = dynamic(
  () => import("@/components/dashboard/diversity-inclusion-card")
    .then(mod => ({ default: mod.DiversityInclusionCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const EmergencyPlacementCardLazy = dynamic(
  () => import("@/components/dashboard/emergency-placement-card")
    .then(mod => ({ default: mod.EmergencyPlacementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const CourtProceedingsCardLazy = dynamic(
  () => import("@/components/dashboard/court-proceedings-card")
    .then(mod => ({ default: mod.CourtProceedingsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const BehaviourSupportPlansCardLazy = dynamic(
  () => import("@/components/dashboard/behaviour-support-plans-card")
    .then(mod => ({ default: mod.BehaviourSupportPlansCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const DischargeTransitionCardLazy = dynamic(
  () => import("@/components/dashboard/discharge-transition-card")
    .then(mod => ({ default: mod.DischargeTransitionCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MedicationErrorsCardLazy = dynamic(
  () => import("@/components/dashboard/medication-errors-card")
    .then(mod => ({ default: mod.MedicationErrorsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildrensAchievementsCardLazy = dynamic(
  () => import("@/components/dashboard/childrens-achievements-card")
    .then(mod => ({ default: mod.ChildrensAchievementsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const RiskRegisterCardLazy = dynamic(
  () => import("@/components/dashboard/riskregister-card")
    .then(mod => ({ default: mod.RiskRegisterCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const DelegatedAuthorityCardLazy = dynamic(
  () => import("@/components/dashboard/delegated-authority-card")
    .then(mod => ({ default: mod.DelegatedAuthorityCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const LanguageCommunicationCardLazy = dynamic(
  () => import("@/components/dashboard/language-communication-card")
    .then(mod => ({ default: mod.LanguageCommunicationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const IndividualRiskAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/individual-risk-assessment-card")
    .then(mod => ({ default: mod.IndividualRiskAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ParentalResponsibilityCardLazy = dynamic(
  () => import("@/components/dashboard/parental-responsibility-card")
    .then(mod => ({ default: mod.ParentalResponsibilityCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildrensWishesFeelingsCardLazy = dynamic(
  () => import("@/components/dashboard/childrens-wishes-feelings-card")
    .then(mod => ({ default: mod.ChildrensWishesFeelingsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const DailyRoutineCardLazy = dynamic(
  () => import("@/components/dashboard/daily-routine-card")
    .then(mod => ({ default: mod.DailyRoutineCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildExploitationScreeningCardLazy = dynamic(
  () => import("@/components/dashboard/child-exploitation-screening-card")
    .then(mod => ({ default: mod.ChildExploitationScreeningCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const TraumaInformedCareCardLazy = dynamic(
  () => import("@/components/dashboard/trauma-informed-care-card")
    .then(mod => ({ default: mod.TraumaInformedCareCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const RespiteShortBreaksCardLazy = dynamic(
  () => import("@/components/dashboard/respite-short-breaks-card")
    .then(mod => ({ default: mod.RespiteShortBreaksCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MedicationAdministrationCardLazy = dynamic(
  () => import("@/components/dashboard/medication-administration-card")
    .then(mod => ({ default: mod.MedicationAdministrationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffSupervisionSessionsCardLazy = dynamic(
  () => import("@/components/dashboard/staffsupervisionsessions-card")
    .then(mod => ({ default: mod.StaffSupervisionSessionsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const FireSafetyCardLazy = dynamic(
  () => import("@/components/dashboard/fire-safety-card")
    .then(mod => ({ default: mod.FireSafetyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SecureStorageCardLazy = dynamic(
  () => import("@/components/dashboard/securestorage-card")
    .then(mod => ({ default: mod.SecureStorageCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ComplaintsInvestigationCardLazy = dynamic(
  () => import("@/components/dashboard/complaints-investigation-card")
    .then(mod => ({ default: mod.ComplaintsInvestigationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const WorkforceDiversityCardLazy = dynamic(
  () => import("@/components/dashboard/workforce-diversity-card")
    .then(mod => ({ default: mod.WorkforceDiversityCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const VisitorManagementCardLazy = dynamic(
  () => import("@/components/dashboard/visitor-management-card")
    .then(mod => ({ default: mod.VisitorManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const EmergencyAdmissionsCardLazy = dynamic(
  () => import("@/components/dashboard/emergency-admissions-card")
    .then(mod => ({ default: mod.EmergencyAdmissionsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffGrievanceCardLazy = dynamic(
  () => import("@/components/dashboard/staff-grievance-card")
    .then(mod => ({ default: mod.StaffGrievanceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const EqualityHumanRightsCardLazy = dynamic(
  () => import("@/components/dashboard/equality-human-rights-card")
    .then(mod => ({ default: mod.EqualityHumanRightsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildrensFundManagementCardLazy = dynamic(
  () => import("@/components/dashboard/childrens-fund-management-card")
    .then(mod => ({ default: mod.ChildrensFundManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffAttendanceCardLazy = dynamic(
  () => import("@/components/dashboard/staff-attendance-card")
    .then(mod => ({ default: mod.StaffAttendanceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const AllegationManagementCardLazy = dynamic(
  () => import("@/components/dashboard/allegation-management-card")
    .then(mod => ({ default: mod.AllegationManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const TransportSafetyCardLazy = dynamic(
  () => import("@/components/dashboard/transport-safety-card")
    .then(mod => ({ default: mod.TransportSafetyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffTeamMeetingsCardLazy = dynamic(
  () => import("@/components/dashboard/staff-team-meetings-card")
    .then(mod => ({ default: mod.StaffTeamMeetingsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const CctvSurveillanceCardLazy = dynamic(
  () => import("@/components/dashboard/cctv-surveillance-card")
    .then(mod => ({ default: mod.CctvSurveillanceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MealtimesNutritionCardLazy = dynamic(
  () => import("@/components/dashboard/mealtimes-nutrition-card")
    .then(mod => ({ default: mod.MealtimesNutritionCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const BuildingSecurityCardLazy = dynamic(
  () => import("@/components/dashboard/building-security-card")
    .then(mod => ({ default: mod.BuildingSecurityCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const WaterSafetyCardLazy = dynamic(
  () => import("@/components/dashboard/water-safety-card")
    .then(mod => ({ default: mod.WaterSafetyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const InfectionControlCardLazy = dynamic(
  () => import("@/components/dashboard/infection-control-card")
    .then(mod => ({ default: mod.InfectionControlCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MaintenanceRepairsCardLazy = dynamic(
  () => import("@/components/dashboard/maintenance-repairs-card")
    .then(mod => ({ default: mod.MaintenanceRepairsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const GiftsHospitalityCardLazy = dynamic(
  () => import("@/components/dashboard/gifts-hospitality-card")
    .then(mod => ({ default: mod.GiftsHospitalityCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const BedroomAuditCardLazy = dynamic(
  () => import("@/components/dashboard/bedroom-audit-card")
    .then(mod => ({ default: mod.BedroomAuditCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const LaundryClothingCardLazy = dynamic(
  () => import("@/components/dashboard/laundry-clothing-card")
    .then(mod => ({ default: mod.LaundryClothingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const EmergencyDrillCardLazy = dynamic(
  () => import("@/components/dashboard/emergency-drill-card")
    .then(mod => ({ default: mod.EmergencyDrillCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HealthAppointmentsCardLazy = dynamic(
  () => import("@/components/dashboard/health-appointments-card")
    .then(mod => ({ default: mod.HealthAppointmentsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const CommunalAreaAuditCardLazy = dynamic(
  () => import("@/components/dashboard/communal-area-audit-card")
    .then(mod => ({ default: mod.CommunalAreaAuditCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const NotificationsRegisterCardLazy = dynamic(
  () => import("@/components/dashboard/notifications-register-card")
    .then(mod => ({ default: mod.NotificationsRegisterCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffExitInterviewsCardLazy = dynamic(
  () => import("@/components/dashboard/staff-exit-interviews-card")
    .then(mod => ({ default: mod.StaffExitInterviewsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildrensMeetingsCardLazy = dynamic(
  () => import("@/components/dashboard/childrens-meetings-card")
    .then(mod => ({ default: mod.ChildrensMeetingsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HolidayTripsCardLazy = dynamic(
  () => import("@/components/dashboard/holiday-trips-card")
    .then(mod => ({ default: mod.HolidayTripsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const DataProtectionCardLazy = dynamic(
  () => import("@/components/dashboard/data-protection-card")
    .then(mod => ({ default: mod.DataProtectionCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PanelDecisionsCardLazy = dynamic(
  () => import("@/components/dashboard/panel-decisions-card")
    .then(mod => ({ default: mod.PanelDecisionsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const VehicleManagementCardLazy = dynamic(
  () => import("@/components/dashboard/vehicle-management-card")
    .then(mod => ({ default: mod.VehicleManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PestControlCardLazy = dynamic(
  () => import("@/components/dashboard/pest-control-card")
    .then(mod => ({ default: mod.PestControlCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildrensFeedbackCardLazy = dynamic(
  () => import("@/components/dashboard/childrens-feedback-card")
    .then(mod => ({ default: mod.ChildrensFeedbackCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const UtilityManagementCardLazy = dynamic(
  () => import("@/components/dashboard/utility-management-card")
    .then(mod => ({ default: mod.UtilityManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const VolunteerManagementCardLazy = dynamic(
  () => import("@/components/dashboard/volunteer-management-card")
    .then(mod => ({ default: mod.VolunteerManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const RoomTemperatureCardLazy = dynamic(
  () => import("@/components/dashboard/room-temperature-card")
    .then(mod => ({ default: mod.RoomTemperatureCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MedicationAuditCardLazy = dynamic(
  () => import("@/components/dashboard/medication-audit-card")
    .then(mod => ({ default: mod.MedicationAuditCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildrensAbsenceCardLazy = dynamic(
  () => import("@/components/dashboard/childrens-absence-card")
    .then(mod => ({ default: mod.ChildrensAbsenceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeImprovementCardLazy = dynamic(
  () => import("@/components/dashboard/home-improvement-card")
    .then(mod => ({ default: mod.HomeImprovementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const CleaningScheduleCardLazy = dynamic(
  () => import("@/components/dashboard/cleaning-schedule-card")
    .then(mod => ({ default: mod.CleaningScheduleCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const KeyHoldingCardLazy = dynamic(
  () => import("@/components/dashboard/key-holding-card")
    .then(mod => ({ default: mod.KeyHoldingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PersonalHygieneCardLazy = dynamic(
  () => import("@/components/dashboard/personal-hygiene-card")
    .then(mod => ({ default: mod.PersonalHygieneCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MissingPersonRiskCardLazy = dynamic(
  () => import("@/components/dashboard/missing-person-risk-card")
    .then(mod => ({ default: mod.MissingPersonRiskCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SafeguardingReferralCardLazy = dynamic(
  () => import("@/components/dashboard/safeguarding-referral-card")
    .then(mod => ({ default: mod.SafeguardingReferralCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MedicationStorageCardLazy = dynamic(
  () => import("@/components/dashboard/medication-storage-card")
    .then(mod => ({ default: mod.MedicationStorageCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const AdmissionAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/admissionassessment-card")
    .then(mod => ({ default: mod.AdmissionAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffCompetencyAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/staff-competency-assessment-card")
    .then(mod => ({ default: mod.StaffCompetencyAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const EnvironmentalAuditCardLazy = dynamic(
  () => import("@/components/dashboard/environmental-audit-card")
    .then(mod => ({ default: mod.EnvironmentalAuditCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ProfessionalConsultationCardLazy = dynamic(
  () => import("@/components/dashboard/professional-consultation-card")
    .then(mod => ({ default: mod.ProfessionalConsultationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const OfstedActionPlanCardLazy = dynamic(
  () => import("@/components/dashboard/ofsted-action-plan-card")
    .then(mod => ({ default: mod.OfstedActionPlanCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const LifeStoryWorkCardLazy = dynamic(
  () => import("@/components/dashboard/life-story-work-card")
    .then(mod => ({ default: mod.LifeStoryWorkCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PositiveHandlingCardLazy = dynamic(
  () => import("@/components/dashboard/positive-handling-card")
    .then(mod => ({ default: mod.PositiveHandlingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ShiftHandoverQualityCardLazy = dynamic(
  () => import("@/components/dashboard/shift-handover-quality-card")
    .then(mod => ({ default: mod.ShiftHandoverQualityCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildrensProgressTrackingCardLazy = dynamic(
  () => import("@/components/dashboard/childrens-progress-tracking-card")
    .then(mod => ({ default: mod.ChildrensProgressTrackingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const KeyworkerSessionsCardLazy = dynamic(
  () => import("@/components/dashboard/keyworker-sessions-card")
    .then(mod => ({ default: mod.KeyworkerSessionsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const RestraintDebriefCardLazy = dynamic(
  () => import("@/components/dashboard/restraint-debrief-card")
    .then(mod => ({ default: mod.RestraintDebriefCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffReflectivePracticeCardLazy = dynamic(
  () => import("@/components/dashboard/staff-reflective-practice-card")
    .then(mod => ({ default: mod.StaffReflectivePracticeCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffHandoverNotesCardLazy = dynamic(
  () => import("@/components/dashboard/staff-handover-notes-card")
    .then(mod => ({ default: mod.StaffHandoverNotesCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildRiskAssessmentReviewCardLazy = dynamic(
  () => import("@/components/dashboard/child-risk-assessment-review-card")
    .then(mod => ({ default: mod.ChildRiskAssessmentReviewCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeDecorationPersonalisationCardLazy = dynamic(
  () => import("@/components/dashboard/home-decoration-personalisation-card")
    .then(mod => ({ default: mod.HomeDecorationPersonalisationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MedicationConsentCardLazy = dynamic(
  () => import("@/components/dashboard/medication-consent-card")
    .then(mod => ({ default: mod.MedicationConsentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffLoneWorkingCardLazy = dynamic(
  () => import("@/components/dashboard/staff-lone-working-card")
    .then(mod => ({ default: mod.StaffLoneWorkingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildrensTherapySessionsCardLazy = dynamic(
  () => import("@/components/dashboard/childrens-therapy-sessions-card")
    .then(mod => ({ default: mod.ChildrensTherapySessionsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const NightWakingMonitoringCardLazy = dynamic(
  () => import("@/components/dashboard/night-waking-monitoring-card")
    .then(mod => ({ default: mod.NightWakingMonitoringCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const CommunityLinksIntegrationCardLazy = dynamic(
  () => import("@/components/dashboard/community-links-integration-card")
    .then(mod => ({ default: mod.CommunityLinksIntegrationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffMedicationCompetencyCardLazy = dynamic(
  () => import("@/components/dashboard/staff-medication-competency-card")
    .then(mod => ({ default: mod.StaffMedicationCompetencyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const BoundaryManagementCardLazy = dynamic(
  () => import("@/components/dashboard/boundary-management-card")
    .then(mod => ({ default: mod.BoundaryManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const InternetUsageMonitoringCardLazy = dynamic(
  () => import("@/components/dashboard/internet-usage-monitoring-card")
    .then(mod => ({ default: mod.InternetUsageMonitoringCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SleepQualityAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/sleep-quality-assessment-card")
    .then(mod => ({ default: mod.SleepQualityAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const CulturalIdentitySupportCardLazy = dynamic(
  () => import("@/components/dashboard/cultural-identity-support-card")
    .then(mod => ({ default: mod.CulturalIdentitySupportCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PocketMoneyManagementCardLazy = dynamic(
  () => import("@/components/dashboard/pocket-money-management-card")
    .then(mod => ({ default: mod.PocketMoneyManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildWellbeingCheckinCardLazy = dynamic(
  () => import("@/components/dashboard/child-wellbeingcheckin-card")
    .then(mod => ({ default: mod.ChildWellbeingCheckinCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffDebriefSupportCardLazy = dynamic(
  () => import("@/components/dashboard/staff-debriefsupport-card")
    .then(mod => ({ default: mod.StaffDebriefSupportCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const EducationAttendanceTrackingCardLazy = dynamic(
  () => import("@/components/dashboard/education-attendance-tracking-card")
    .then(mod => ({ default: mod.EducationAttendanceTrackingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ContactSupervisionCardLazy = dynamic(
  () => import("@/components/dashboard/contact-supervision-card")
    .then(mod => ({ default: mod.ContactSupervisionCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SelfHarmRiskMonitoringCardLazy = dynamic(
  () => import("@/components/dashboard/self-harm-risk-monitoring-card")
    .then(mod => ({ default: mod.SelfHarmRiskMonitoringCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const RoomSharingAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/room-sharing-assessment-card")
    .then(mod => ({ default: mod.RoomSharingAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MedicationSideEffectsCardLazy = dynamic(
  () => import("@/components/dashboard/medication-side-effects-card")
    .then(mod => ({ default: mod.MedicationSideEffectsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PeerRelationshipAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/peer-relationship-assessment-card")
    .then(mod => ({ default: mod.PeerRelationshipAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeEnvironmentInspectionCardLazy = dynamic(
  () => import("@/components/dashboard/home-environment-inspection-card")
    .then(mod => ({ default: mod.HomeEnvironmentInspectionCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ComplaintResolutionTrackingCardLazy = dynamic(
  () => import("@/components/dashboard/complaint-resolution-tracking-card")
    .then(mod => ({ default: mod.ComplaintResolutionTrackingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffSupervisionComplianceCardLazy = dynamic(
  () => import("@/components/dashboard/staffsupervision-compliance-card")
    .then(mod => ({ default: mod.StaffSupervisionComplianceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildDevelopmentMilestoneCardLazy = dynamic(
  () => import("@/components/dashboard/child-development-milestone-card")
    .then(mod => ({ default: mod.ChildDevelopmentMilestoneCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const VisitorFeedbackCollectionCardLazy = dynamic(
  () => import("@/components/dashboard/visitor-feedback-collection-card")
    .then(mod => ({ default: mod.VisitorFeedbackCollectionCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffShiftPatternMonitoringCardLazy = dynamic(
  () => import("@/components/dashboard/staffshift-pattern-monitoring-card")
    .then(mod => ({ default: mod.StaffShiftPatternMonitoringCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildDigitalWellbeingCardLazy = dynamic(
  () => import("@/components/dashboard/child-digital-wellbeing-card")
    .then(mod => ({ default: mod.ChildDigitalWellbeingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const FamilyEngagementTrackingCardLazy = dynamic(
  () => import("@/components/dashboard/family-engagement-tracking-card")
    .then(mod => ({ default: mod.FamilyEngagementTrackingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const TransitionPlanningReadinessCardLazy = dynamic(
  () => import("@/components/dashboard/transition-planning-readiness-card")
    .then(mod => ({ default: mod.TransitionPlanningReadinessCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const KeyWorkerAllocationCardLazy = dynamic(
  () => import("@/components/dashboard/key-worker-allocation-card")
    .then(mod => ({ default: mod.KeyWorkerAllocationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ConsentCapacityMonitoringCardLazy = dynamic(
  () => import("@/components/dashboard/consentcapacity-monitoring-card")
    .then(mod => ({ default: mod.ConsentCapacityMonitoringCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const BehaviourPatternAnalysisCardLazy = dynamic(
  () => import("@/components/dashboard/behaviour-pattern-analysis-card")
    .then(mod => ({ default: mod.BehaviourPatternAnalysisCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PhysicalActivityTrackingCardLazy = dynamic(
  () => import("@/components/dashboard/physical-activity-tracking-card")
    .then(mod => ({ default: mod.PhysicalActivityTrackingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ReligiousCulturalObservanceCardLazy = dynamic(
  () => import("@/components/dashboard/religious-cultural-observance-card")
    .then(mod => ({ default: mod.ReligiousCulturalObservanceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SiblingContactQualityCardLazy = dynamic(
  () => import("@/components/dashboard/sibling-contact-quality-card")
    .then(mod => ({ default: mod.SiblingContactQualityCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PrivacyDignityMonitoringCardLazy = dynamic(
  () => import("@/components/dashboard/privacy-dignity-monitoring-card")
    .then(mod => ({ default: mod.PrivacyDignityMonitoringCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildrensAspirationsGoalsCardLazy = dynamic(
  () => import("@/components/dashboard/childrens-aspirations-goals-card")
    .then(mod => ({ default: mod.ChildrensAspirationsGoalsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const CreativeEnrichmentActivitiesCardLazy = dynamic(
  () => import("@/components/dashboard/creative-enrichment-activities-card")
    .then(mod => ({ default: mod.CreativeEnrichmentActivitiesCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MedicationEffectivenessReviewCardLazy = dynamic(
  () => import("@/components/dashboard/medication-effectiveness-review-card")
    .then(mod => ({ default: mod.MedicationEffectivenessReviewCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HealthScreeningImmunisationCardLazy = dynamic(
  () => import("@/components/dashboard/health-screening-immunisation-card")
    .then(mod => ({ default: mod.HealthScreeningImmunisationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SocialSkillsDevelopmentCardLazy = dynamic(
  () => import("@/components/dashboard/socialskills-development-card")
    .then(mod => ({ default: mod.SocialSkillsDevelopmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const RestorativeJusticePracticeCardLazy = dynamic(
  () => import("@/components/dashboard/restorative-justice-practice-card")
    .then(mod => ({ default: mod.RestorativeJusticePracticeCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const LeisureRecreationActivitiesCardLazy = dynamic(
  () => import("@/components/dashboard/leisure-recreation-activities-card")
    .then(mod => ({ default: mod.LeisureRecreationActivitiesCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeworkAcademicSupportCardLazy = dynamic(
  () => import("@/components/dashboard/homework-academic-support-card")
    .then(mod => ({ default: mod.HomeworkAcademicSupportCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const AdvocacyRepresentationCardLazy = dynamic(
  () => import("@/components/dashboard/advocacy-representation-card")
    .then(mod => ({ default: mod.AdvocacyRepresentationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const CelebrationMilestonesCardLazy = dynamic(
  () => import("@/components/dashboard/celebration-milestones-card")
    .then(mod => ({ default: mod.CelebrationMilestonesCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const WorkExperienceEmploymentCardLazy = dynamic(
  () => import("@/components/dashboard/work-experience-employment-card")
    .then(mod => ({ default: mod.WorkExperienceEmploymentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const DeviceScreenTimeMonitoringCardLazy = dynamic(
  () => import("@/components/dashboard/device-screen-time-monitoring-card")
    .then(mod => ({ default: mod.DeviceScreenTimeMonitoringCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const FinancialLiteracySavingsCardLazy = dynamic(
  () => import("@/components/dashboard/financial-literacy-savings-card")
    .then(mod => ({ default: mod.FinancialLiteracySavingsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const FirstAidMedicalEmergencyCardLazy = dynamic(
  () => import("@/components/dashboard/first-aid-medical-emergency-card")
    .then(mod => ({ default: mod.FirstAidMedicalEmergencyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const OutdoorSpacesPlayAreasCardLazy = dynamic(
  () => import("@/components/dashboard/outdoor-spaces-play-areas-card")
    .then(mod => ({ default: mod.OutdoorSpacesPlayAreasCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PositiveBehaviourReinforcementCardLazy = dynamic(
  () => import("@/components/dashboard/positive-behaviour-reinforcement-card")
    .then(mod => ({ default: mod.PositiveBehaviourReinforcementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const DentalOpticalHealthCardLazy = dynamic(
  () => import("@/components/dashboard/dental-optical-health-card")
    .then(mod => ({ default: mod.DentalOpticalHealthCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SelfEsteemConfidenceBuildingCardLazy = dynamic(
  () => import("@/components/dashboard/self-esteem-confidence-building-card")
    .then(mod => ({ default: mod.SelfEsteemConfidenceBuildingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ArrivalSettlingExperienceCardLazy = dynamic(
  () => import("@/components/dashboard/arrival-settling-experience-card")
    .then(mod => ({ default: mod.ArrivalSettlingExperienceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HealthyEatingCookingSkillsCardLazy = dynamic(
  () => import("@/components/dashboard/healthy-eating-cooking-skills-card")
    .then(mod => ({ default: mod.HealthyEatingCookingSkillsCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const RelationshipEducationSafetyCardLazy = dynamic(
  () => import("@/components/dashboard/relationship-education-safety-card")
    .then(mod => ({ default: mod.RelationshipEducationSafetyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PetCareResponsibilityCardLazy = dynamic(
  () => import("@/components/dashboard/pet-care-responsibility-card")
    .then(mod => ({ default: mod.PetCareResponsibilityCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const GardenHorticultureActivitiesCardLazy = dynamic(
  () => import("@/components/dashboard/garden-horticulture-activities-card")
    .then(mod => ({ default: mod.GardenHorticultureActivitiesCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const FaithSpiritualObservanceCardLazy = dynamic(
  () => import("@/components/dashboard/faith-spiritual-observance-card")
    .then(mod => ({ default: mod.FaithSpiritualObservanceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffPatternIntelligenceCardLazy = dynamic(
  () => import("@/components/dashboard/staff-pattern-intelligence-card")
    .then(mod => ({ default: mod.StaffPatternIntelligenceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffPerformanceDipCardLazy = dynamic(
  () => import("@/components/dashboard/staff-performance-dip-card")
    .then(mod => ({ default: mod.StaffPerformanceDipCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffBurnoutIndicatorCardLazy = dynamic(
  () => import("@/components/dashboard/staff-burnout-indicator-card")
    .then(mod => ({ default: mod.StaffBurnoutIndicatorCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffDevelopmentPlanCardLazy = dynamic(
  () => import("@/components/dashboard/staff-development-plan-card")
    .then(mod => ({ default: mod.StaffDevelopmentPlanCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffSupportPlanCardLazy = dynamic(
  () => import("@/components/dashboard/staffsupport-plan-card")
    .then(mod => ({ default: mod.StaffSupportPlanCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffPracticeRiskAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/staff-practice-risk-assessment-card")
    .then(mod => ({ default: mod.StaffPracticeRiskAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffTriggerMapCardLazy = dynamic(
  () => import("@/components/dashboard/staff-trigger-map-card")
    .then(mod => ({ default: mod.StaffTriggerMapCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffSupportActionCardLazy = dynamic(
  () => import("@/components/dashboard/staffsupport-action-card")
    .then(mod => ({ default: mod.StaffSupportActionCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffReviewOutcomeCardLazy = dynamic(
  () => import("@/components/dashboard/staff-review-outcome-card")
    .then(mod => ({ default: mod.StaffReviewOutcomeCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffConfidenceIndicatorCardLazy = dynamic(
  () => import("@/components/dashboard/staff-confidence-indicator-card")
    .then(mod => ({ default: mod.StaffConfidenceIndicatorCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffMandatoryTrainingCardLazy = dynamic(
  () => import("@/components/dashboard/staff-mandatory-training-card")
    .then(mod => ({ default: mod.StaffMandatoryTrainingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const YoungPersonDailyDiaryCardLazy = dynamic(
  () => import("@/components/dashboard/young-person-daily-diary-card")
    .then(mod => ({ default: mod.YoungPersonDailyDiaryCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ProfessionalNetworkDirectoryCardLazy = dynamic(
  () => import("@/components/dashboard/professional-network-directory-card")
    .then(mod => ({ default: mod.ProfessionalNetworkDirectoryCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MenuPlanningDietaryCardLazy = dynamic(
  () => import("@/components/dashboard/menu-planning-dietary-card")
    .then(mod => ({ default: mod.MenuPlanningDietaryCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const EhcpSendMonitoringCardLazy = dynamic(
  () => import("@/components/dashboard/ehcp-send-monitoring-card")
    .then(mod => ({ default: mod.EhcpSendMonitoringCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const PlacementMatchingAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/placement-matching-assessment-card")
    .then(mod => ({ default: mod.PlacementMatchingAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const Reg44IndependentVisitorCardLazy = dynamic(
  () => import("@/components/dashboard/reg44-independent-visitor-card")
    .then(mod => ({ default: mod.Reg44IndependentVisitorCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const EmotionalWellbeingOutcomeCardLazy = dynamic(
  () => import("@/components/dashboard/emotional-wellbeing-outcome-card")
    .then(mod => ({ default: mod.EmotionalWellbeingOutcomeCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ComplianceCertificateCardLazy = dynamic(
  () => import("@/components/dashboard/compliancecertificate-card")
    .then(mod => ({ default: mod.ComplianceCertificateCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeClosurePlanningCardLazy = dynamic(
  () => import("@/components/dashboard/home-closure-planning-card")
    .then(mod => ({ default: mod.HomeClosurePlanningCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ParentalContactArrangementCardLazy = dynamic(
  () => import("@/components/dashboard/parental-contact-arrangement-card")
    .then(mod => ({ default: mod.ParentalContactArrangementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SafeguardingPartnershipCardLazy = dynamic(
  () => import("@/components/dashboard/safeguarding-partnership-card")
    .then(mod => ({ default: mod.SafeguardingPartnershipCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const LacHealthAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/lac-health-assessment-card")
    .then(mod => ({ default: mod.LacHealthAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffWhistleblowingInvestigationCardLazy = dynamic(
  () => import("@/components/dashboard/staff-whistleblowing-investigation-card")
    .then(mod => ({ default: mod.StaffWhistleblowingInvestigationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeAtmosphereAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/home-atmosphere-assessment-card")
    .then(mod => ({ default: mod.HomeAtmosphereAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const QualityOfCareReviewCardLazy = dynamic(
  () => import("@/components/dashboard/quality-of-care-review-card")
    .then(mod => ({ default: mod.QualityOfCareReviewCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const MedicationIncidentReportingCardLazy = dynamic(
  () => import("@/components/dashboard/medication-incident-reporting-card")
    .then(mod => ({ default: mod.MedicationIncidentReportingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffAnnualLeaveCardLazy = dynamic(
  () => import("@/components/dashboard/staff-annual-leave-card")
    .then(mod => ({ default: mod.StaffAnnualLeaveCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildrensPocketMoneyAuditCardLazy = dynamic(
  () => import("@/components/dashboard/childrens-pocket-money-audit-card")
    .then(mod => ({ default: mod.ChildrensPocketMoneyAuditCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffConflictOfInterestCardLazy = dynamic(
  () => import("@/components/dashboard/staff-conflict-of-interest-card")
    .then(mod => ({ default: mod.StaffConflictOfInterestCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const EnvironmentalImpactAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/environmental-impact-assessment-card")
    .then(mod => ({ default: mod.EnvironmentalImpactAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffRetentionExitAnalysisCardLazy = dynamic(
  () => import("@/components/dashboard/staff-retention-exit-analysis-card")
    .then(mod => ({ default: mod.StaffRetentionExitAnalysisCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildSexualExploitationRiskCardLazy = dynamic(
  () => import("@/components/dashboard/child-sexual-exploitation-risk-card")
    .then(mod => ({ default: mod.ChildSexualExploitationRiskCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const OfstedInspectionReadinessCardLazy = dynamic(
  () => import("@/components/dashboard/ofsted-inspection-readiness-card")
    .then(mod => ({ default: mod.OfstedInspectionReadinessCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const YoungPersonEmploymentSupportCardLazy = dynamic(
  () => import("@/components/dashboard/young-person-employment-support-card")
    .then(mod => ({ default: mod.YoungPersonEmploymentSupportCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const SleepDisturbanceInterventionCardLazy = dynamic(
  () => import("@/components/dashboard/sleep-disturbance-intervention-card")
    .then(mod => ({ default: mod.SleepDisturbanceInterventionCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildCriminalExploitationRiskCardLazy = dynamic(
  () => import("@/components/dashboard/childcriminal-exploitation-risk-card")
    .then(mod => ({ default: mod.ChildCriminalExploitationRiskCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffSicknessManagementCardLazy = dynamic(
  () => import("@/components/dashboard/staffsickness-management-card")
    .then(mod => ({ default: mod.StaffSicknessManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeInsuranceComplianceCardLazy = dynamic(
  () => import("@/components/dashboard/home-insurance-compliance-card")
    .then(mod => ({ default: mod.HomeInsuranceComplianceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildVoiceParticipationTrackingCardLazy = dynamic(
  () => import("@/components/dashboard/child-voice-participation-tracking-card")
    .then(mod => ({ default: mod.ChildVoiceParticipationTrackingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffCodeOfConductComplianceCardLazy = dynamic(
  () => import("@/components/dashboard/staff-code-of-conduct-compliance-card")
    .then(mod => ({ default: mod.StaffCodeOfConductComplianceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeEnergyEfficiencyCardLazy = dynamic(
  () => import("@/components/dashboard/home-energy-efficiency-card")
    .then(mod => ({ default: mod.HomeEnergyEfficiencyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildRadicalisationPreventionCardLazy = dynamic(
  () => import("@/components/dashboard/child-radicalisation-prevention-card")
    .then(mod => ({ default: mod.ChildRadicalisationPreventionCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffNvqQualificationTrackingCardLazy = dynamic(
  () => import("@/components/dashboard/staff-nvq-qualification-tracking-card")
    .then(mod => ({ default: mod.StaffNvqQualificationTrackingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeAccessibilityAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/home-accessibility-assessment-card")
    .then(mod => ({ default: mod.HomeAccessibilityAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildNutritionWeightMonitoringCardLazy = dynamic(
  () => import("@/components/dashboard/child-nutrition-weight-monitoring-card")
    .then(mod => ({ default: mod.ChildNutritionWeightMonitoringCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffDbsRenewalTrackingCardLazy = dynamic(
  () => import("@/components/dashboard/staff-dbs-renewal-tracking-card")
    .then(mod => ({ default: mod.StaffDbsRenewalTrackingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeFireRiskAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/home-fire-risk-assessment-card")
    .then(mod => ({ default: mod.HomeFireRiskAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildSubstanceMisuseScreeningCardLazy = dynamic(
  () => import("@/components/dashboard/child-substance-misuse-screening-card")
    .then(mod => ({ default: mod.ChildSubstanceMisuseScreeningCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffReturnToWorkInterviewCardLazy = dynamic(
  () => import("@/components/dashboard/staff-return-to-work-interview-card")
    .then(mod => ({ default: mod.StaffReturnToWorkInterviewCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeLegionellaRiskAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/home-legionella-risk-assessment-card")
    .then(mod => ({ default: mod.HomeLegionellaRiskAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildBereavementSupportCardLazy = dynamic(
  () => import("@/components/dashboard/child-bereavement-support-card")
    .then(mod => ({ default: mod.ChildBereavementSupportCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffMandatoryRefresherTrainingCardLazy = dynamic(
  () => import("@/components/dashboard/staff-mandatory-refresher-training-card")
    .then(mod => ({ default: mod.StaffMandatoryRefresherTrainingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeAsbestosManagementCardLazy = dynamic(
  () => import("@/components/dashboard/home-asbestos-management-card")
    .then(mod => ({ default: mod.HomeAsbestosManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildGangsAffiliationRiskCardLazy = dynamic(
  () => import("@/components/dashboard/child-gangs-affiliation-risk-card")
    .then(mod => ({ default: mod.ChildGangsAffiliationRiskCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffAgencyWorkerComplianceCardLazy = dynamic(
  () => import("@/components/dashboard/staff-agency-worker-compliance-card")
    .then(mod => ({ default: mod.StaffAgencyWorkerComplianceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeRadonTestingCardLazy = dynamic(
  () => import("@/components/dashboard/home-radon-testing-card")
    .then(mod => ({ default: mod.HomeRadonTestingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildFgmRiskAssessmentCardLazy = dynamic(
  () => import("@/components/dashboard/child-fgm-risk-assessment-card")
    .then(mod => ({ default: mod.ChildFgmRiskAssessmentCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffProfessionalRegistrationCardLazy = dynamic(
  () => import("@/components/dashboard/staff-professional-registration-card")
    .then(mod => ({ default: mod.StaffProfessionalRegistrationCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeElectricalSafetyCardLazy = dynamic(
  () => import("@/components/dashboard/home-electrical-safety-card")
    .then(mod => ({ default: mod.HomeElectricalSafetyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildForcedMarriageRiskCardLazy = dynamic(
  () => import("@/components/dashboard/child-forced-marriage-risk-card")
    .then(mod => ({ default: mod.ChildForcedMarriageRiskCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffSecondmentManagementCardLazy = dynamic(
  () => import("@/components/dashboard/staffsecondment-management-card")
    .then(mod => ({ default: mod.StaffSecondmentManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeGasSafetyCardLazy = dynamic(
  () => import("@/components/dashboard/home-gas-safety-card")
    .then(mod => ({ default: mod.HomeGasSafetyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildModernSlaveryRiskCardLazy = dynamic(
  () => import("@/components/dashboard/child-modern-slavery-risk-card")
    .then(mod => ({ default: mod.ChildModernSlaveryRiskCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffPayrollComplianceCardLazy = dynamic(
  () => import("@/components/dashboard/staff-payroll-compliance-card")
    .then(mod => ({ default: mod.StaffPayrollComplianceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeLiftEquipmentSafetyCardLazy = dynamic(
  () => import("@/components/dashboard/home-lift-equipment-safety-card")
    .then(mod => ({ default: mod.HomeLiftEquipmentSafetyCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildHonourBasedAbuseRiskCardLazy = dynamic(
  () => import("@/components/dashboard/child-honour-based-abuse-risk-card")
    .then(mod => ({ default: mod.ChildHonourBasedAbuseRiskCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffExitInterviewManagementCardLazy = dynamic(
  () => import("@/components/dashboard/staff-exit-interview-management-card")
    .then(mod => ({ default: mod.StaffExitInterviewManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeWaterHygieneManagementCardLazy = dynamic(
  () => import("@/components/dashboard/home-waterhygiene-management-card")
    .then(mod => ({ default: mod.HomeWaterHygieneManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildRadicalisationRiskCardLazy = dynamic(
  () => import("@/components/dashboard/child-radicalisation-risk-card")
    .then(mod => ({ default: mod.ChildRadicalisationRiskCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffWhistleblowingManagementCardLazy = dynamic(
  () => import("@/components/dashboard/staff-whistleblowing-management-card")
    .then(mod => ({ default: mod.StaffWhistleblowingManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomePestControlManagementCardLazy = dynamic(
  () => import("@/components/dashboard/home-pest-control-management-card")
    .then(mod => ({ default: mod.HomePestControlManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildTraffickingRiskCardLazy = dynamic(
  () => import("@/components/dashboard/child-trafficking-risk-card")
    .then(mod => ({ default: mod.ChildTraffickingRiskCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffOvertimeManagementCardLazy = dynamic(
  () => import("@/components/dashboard/staff-overtime-management-card")
    .then(mod => ({ default: mod.StaffOvertimeManagementCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeCctvComplianceCardLazy = dynamic(
  () => import("@/components/dashboard/home-cctv-compliance-card")
    .then(mod => ({ default: mod.HomeCctvComplianceCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const ChildOnlineSafetyMonitoringCardLazy = dynamic(
  () => import("@/components/dashboard/child-online-safety-monitoring-card")
    .then(mod => ({ default: mod.ChildOnlineSafetyMonitoringCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const StaffLoneWorkingRiskCardLazy = dynamic(
  () => import("@/components/dashboard/staff-lone-working-risk-card")
    .then(mod => ({ default: mod.StaffLoneWorkingRiskCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
const HomeEmergencyLightingCardLazy = dynamic(
  () => import("@/components/dashboard/home-emergency-lighting-card")
    .then(mod => ({ default: mod.HomeEmergencyLightingCard })),
  { loading: () => <CardSkeleton />, ssr: false }
);
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
    badge: "bg-[var(--cs-risk)] text-white border-transparent",
    border: "border-l-[var(--cs-risk)]",
    label: "Critical",
  },
  high: {
    badge: "bg-[var(--cs-warning)] text-white border-transparent",
    border: "border-l-[var(--cs-warning)]",
    label: "High",
  },
  medium: {
    badge: "bg-[var(--cs-info-bg)] text-[var(--cs-info)] border-transparent",
    border: "border-l-[var(--cs-info)]",
    label: "Medium",
  },
  low: {
    badge: "bg-[var(--cs-bg)] text-[var(--cs-text-secondary)] border-transparent",
    border: "border-l-[var(--cs-border)]",
    label: "Low",
  },
};

/* ── category config ───────────────────────────────────────────────────────── */

const CATEGORY_META: Record<AttentionCategory, { label: string; badge: string; icon: React.ElementType }> = {
  log_approval:          { label: "Log Approval",          badge: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)]", icon: ClipboardCheck },
  incident_oversight:    { label: "Incident Oversight",    badge: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]", icon: AlertCircle },
  serious_incident:      { label: "Serious Incident",      badge: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",       icon: Siren },
  missing_from_care:     { label: "Missing from Care",     badge: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",       icon: AlertTriangle },
  risk_assessment_review:{ label: "Risk Assessment",       badge: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",   icon: ShieldAlert },
  placement_plan_update: { label: "Placement Plan",        badge: "bg-sky-100 text-sky-800",       icon: FileText },
  key_work_overdue:      { label: "Key Work Overdue",      badge: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]", icon: UserCheck },
  wishes_feelings_missing:{ label: "Wishes & Feelings",    badge: "bg-pink-100 text-pink-800",     icon: MessageSquareWarning },
  medication_check:      { label: "Medication Check",      badge: "bg-teal-100 text-teal-800",     icon: Pill },
  supervision_overdue:   { label: "Supervision Overdue",   badge: "bg-indigo-100 text-indigo-800", icon: Users },
  training_gap:          { label: "Training Gap",          badge: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]", icon: GraduationCap },
  recruitment_gap:       { label: "Recruitment Gap",       badge: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",     icon: FileSearch },
  complaint_open:        { label: "Complaint Open",        badge: "bg-fuchsia-100 text-fuchsia-800", icon: MessageSquareWarning },
  reg44_action_overdue:  { label: "Reg 44 Action",         badge: "bg-cyan-100 text-cyan-800",     icon: Scale },
  reg45_evidence_gap:    { label: "Reg 45 Evidence",       badge: "bg-lime-100 text-lime-800",     icon: BookOpen },
  task_overdue:          { label: "Task Overdue",          badge: "bg-[var(--cs-bg)] text-[var(--cs-text)]",   icon: Clock },
  staff_debrief:         { label: "Staff Debrief",         badge: "bg-[var(--cs-info-bg)] text-[var(--cs-info)]",     icon: Users },
  document_sign_off:     { label: "Document Sign-off",     badge: "bg-[var(--cs-bg)] text-[var(--cs-text)]",     icon: ClipboardList },
  cara_pattern:          { label: "Cara Pattern",          badge: "bg-[var(--cs-oversight-bg)] text-[var(--cs-oversight)]", icon: Brain },
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
      { label: "Critical Items",       value: criticalCount,     icon: AlertTriangle,        colour: "text-[var(--cs-risk)]" },
      { label: "High Items",           value: highCount,         icon: AlertCircle,           colour: "text-[var(--cs-warning)]" },
      { label: "Incidents Needing Oversight", value: incidentOversight, icon: ShieldAlert,    colour: "text-[var(--cs-warning)]" },
      { label: "Overdue Tasks",         value: overdueCount,      icon: Clock,                colour: "text-[var(--cs-risk)]" },
      { label: "Supervision Gaps",      value: supervisionGaps,   icon: Users,                colour: "text-indigo-600" },
      { label: "Training Gaps",         value: trainingGaps,      icon: GraduationCap,        colour: "text-[var(--cs-warning)]" },
      { label: "Complaints Open",       value: complaintsOpen,    icon: MessageSquareWarning,  colour: "text-fuchsia-600" },
      { label: "Patterns Detected",     value: patternsDetected,  icon: Brain,                colour: "text-[var(--cs-oversight)]" },
    ];
  }, [items]);

  /* ── cross-module aggregate stats ───────────────────────────────────────── */

  const moduleStats = useMemo(() => {
    const learningReviews = (learningData?.reviews as Record<string, unknown>[]) ?? [];
    const pendingReviews = learningReviews.filter((r) => r.review_status === "required" || r.status === "required").length;

    const reg44Visits = (reg44Data?.visits as Record<string, unknown>[]) ?? [];
    const currentMonth = localMonthKey();
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
        <Card className="border-[var(--cs-info-soft)]">
          <CardContent className="pt-4 pb-3 text-center">
            <ClipboardCheck className={cn("h-5 w-5 mx-auto mb-1", moduleStats.inspectionReadiness >= 80 ? "text-[var(--cs-success)]" : moduleStats.inspectionReadiness >= 50 ? "text-[var(--cs-warning)]" : "text-[var(--cs-risk)]")} />
            <p className="text-2xl font-bold">{moduleStats.inspectionReadiness}%</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Inspection Readiness</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Activity className="h-5 w-5 mx-auto mb-1 text-[var(--cs-info)]" />
            <p className="text-2xl font-bold">{moduleStats.totalAttentionOpen}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Open Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Siren className="h-5 w-5 mx-auto mb-1 text-[var(--cs-warning)]" />
            <p className="text-2xl font-bold">{moduleStats.pendingReviews}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Incident Reviews Due</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <CheckCircle2 className={cn("h-5 w-5 mx-auto mb-1", moduleStats.reg44ThisMonth ? "text-[var(--cs-success)]" : "text-[var(--cs-risk)]")} />
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
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-[var(--cs-success)]" />
            <p className="text-2xl font-bold">{moduleStats.evidenceCount}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Evidence Items</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Cara proactive intelligence panel ─────────────────────────────── */}
      {caraAlerts.length > 0 && (
        <div className="rounded-xl border border-[var(--cs-oversight-soft)] bg-[var(--cs-oversight-bg)] p-4 mb-4 flex items-start gap-3">
          <Brain className="h-5 w-5 text-[var(--cs-oversight)] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--cs-oversight)]">
              Cara has detected {caraAlerts.length} proactive {caraAlerts.length === 1 ? "alert" : "alerts"} from live records
            </p>
            <p className="text-xs text-[var(--cs-oversight)] mt-0.5">
              {caraAlerts.filter((a) => a.severity === "urgent").length} urgent ·{" "}
              {caraAlerts.filter((a) => a.severity === "high").length} high ·{" "}
              {caraAlerts.filter((a) => a.severity === "medium").length} medium —
              patterns, voice gaps and compliance concerns surfaced automatically
            </p>
          </div>
          <Link href="/intelligence/cara/pattern-intelligence">
            <Button size="sm" variant="outline" className="gap-1.5 text-[var(--cs-oversight)] border-[var(--cs-oversight-soft)] hover:bg-[var(--cs-oversight-bg)] shrink-0">
              <ArrowUpRight className="h-3.5 w-3.5" />
              View all
            </Button>
          </Link>
        </div>
      )}

      {/* ── critical alert banner ─────────────────────────────────────────── */}
      {stats[0].value > 0 && (
        <div className="bg-[var(--cs-risk-bg)] border border-[var(--cs-risk-soft)] rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-[var(--cs-risk)] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-[var(--cs-risk)]">
              {stats[0].value} critical {stats[0].value === 1 ? "item requires" : "items require"} immediate attention
            </p>
            <p className="text-[var(--cs-risk)]">
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
                  item.urgency === "critical" && "ring-1 ring-[var(--cs-risk-soft)]",
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
                          item.status === "open" && "bg-[var(--cs-success-bg)] text-[var(--cs-success)]",
                          item.status === "in_progress" && "bg-[var(--cs-info-bg)] text-[var(--cs-info)]",
                          item.status === "reviewed" && "bg-[var(--cs-bg)] text-[var(--cs-text-secondary)]",
                          item.status === "escalated" && "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
                          item.status === "closed" && "bg-[var(--cs-bg)] text-[var(--cs-text-muted)]",
                        )}
                      >
                        {STATUS_LABELS[item.status]}
                      </Badge>
                      {overdue && (
                        <Badge variant="outline" className="text-[11px] bg-[var(--cs-risk-bg)] text-[var(--cs-risk)] border-[var(--cs-risk-soft)]">
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
                        <span className={cn("flex items-center gap-1", overdue && "text-[var(--cs-risk)] font-medium")}>
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
                    <div className="bg-[var(--cs-info-bg)] border border-[var(--cs-info-soft)] rounded-lg p-3">
                      <p className="text-xs font-semibold text-[var(--cs-info)] uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        Suggested Action
                      </p>
                      <p className="text-sm text-[var(--cs-info)] leading-relaxed">
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
                        <div className={cn("rounded-lg p-2.5", overdue ? "bg-[var(--cs-risk-bg)]" : "bg-muted/40")}>
                          <p className={cn("font-medium mb-0.5", overdue ? "text-[var(--cs-risk)]" : "text-[var(--cs-text-secondary)]")}>Due Date</p>
                          <p className={cn(overdue ? "text-[var(--cs-risk)] font-semibold" : "text-[var(--cs-navy)]")}>{formatDate(item.dueDate)}</p>
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
                        className="gap-1.5 border-[var(--cs-success-soft)] text-[var(--cs-success)] hover:bg-[var(--cs-success-bg)]"
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
                        className="gap-1.5 border-[var(--cs-risk-soft)] text-[var(--cs-risk)] hover:bg-[var(--cs-risk-bg)]"
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
        <CardErrorBoundary><MissingFromCareCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ComplaintsNotificationsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PlacementIntelligenceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><BehaviourIntelligenceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><RotaIntelligenceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PremisesIntelligenceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><TrainingIntelligenceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><FinanceIntelligenceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><LifeSkillsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><NotifiableEventsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SCCIFEvaluationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><VisitorsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><OutcomesCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HandoverCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><AppraisalsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MeetingsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><RestraintCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><QualityAssuranceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PossessionsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><EmergencyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SaferRecruitmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><LeavingCareCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffDisciplinaryCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SanctionsRewardsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ContextualSafeguardingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><DeprivationOfLibertyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><WhistleblowingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PoliciesRegisterCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><AdvocacyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MultiAgencyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><NightMonitoringCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><CulturalIdentityCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SubstanceMisuseCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><IndependentVisitorsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><BusinessContinuityCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StatementOfPurposeCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><Reg45ReportsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensGuideCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><TransitionPlanningCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensParticipationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><FoodNutritionCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PocketMoneyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><EnvironmentalSafetyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><RecordsManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SleepPatternsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StakeholderEngagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ImpactRiskAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffWellbeingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><KpiTrackingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ProfessionalDevelopmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><TherapeuticInterventionsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><WorkforcePlanningCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><CarePlanningCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><FamilyEngagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><CommissioningReferralsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensRightsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PracticeLearningCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffAbsenceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ActivityPlanningCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><OnlineSafetyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><LACReviewCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffInductionCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><DutyOfCandourCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><AntiBullyingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ConsentManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SignificantEventsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><LegalStatusCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><BodyMapCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><KeyDocumentsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PlacementStabilityCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ProviderVisitsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MatchingReferralCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><IndependencePreparationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SensoryProfileCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PeerMentoringCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ContactMonitoringCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><AttachmentRelationshipsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><DiversityInclusionCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><EmergencyPlacementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><CourtProceedingsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><BehaviourSupportPlansCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><DischargeTransitionCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MedicationErrorsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensAchievementsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><RiskRegisterCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><DelegatedAuthorityCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><LanguageCommunicationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><IndividualRiskAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ParentalResponsibilityCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensWishesFeelingsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><DailyRoutineCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildExploitationScreeningCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><TraumaInformedCareCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><RespiteShortBreaksCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MedicationAdministrationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffSupervisionSessionsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><FireSafetyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SecureStorageCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ComplaintsInvestigationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><WorkforceDiversityCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><VisitorManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><EmergencyAdmissionsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffGrievanceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><EqualityHumanRightsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensFundManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffAttendanceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><AllegationManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><TransportSafetyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffTeamMeetingsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><CctvSurveillanceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MealtimesNutritionCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><BuildingSecurityCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><WaterSafetyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><InfectionControlCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MaintenanceRepairsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><GiftsHospitalityCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><BedroomAuditCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><LaundryClothingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><EmergencyDrillCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HealthAppointmentsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><CommunalAreaAuditCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><NotificationsRegisterCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffExitInterviewsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensMeetingsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HolidayTripsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><DataProtectionCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PanelDecisionsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><VehicleManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PestControlCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensFeedbackCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><UtilityManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><VolunteerManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><RoomTemperatureCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MedicationAuditCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensAbsenceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeImprovementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><CleaningScheduleCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><KeyHoldingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PersonalHygieneCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MissingPersonRiskCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SafeguardingReferralCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MedicationStorageCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><AdmissionAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffCompetencyAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><EnvironmentalAuditCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ProfessionalConsultationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><OfstedActionPlanCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><LifeStoryWorkCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PositiveHandlingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ShiftHandoverQualityCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensProgressTrackingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><KeyworkerSessionsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><RestraintDebriefCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffReflectivePracticeCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffHandoverNotesCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildRiskAssessmentReviewCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeDecorationPersonalisationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MedicationConsentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffLoneWorkingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensTherapySessionsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><NightWakingMonitoringCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><CommunityLinksIntegrationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffMedicationCompetencyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><BoundaryManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><InternetUsageMonitoringCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SleepQualityAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><CulturalIdentitySupportCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PocketMoneyManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildWellbeingCheckinCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffDebriefSupportCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><EducationAttendanceTrackingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ContactSupervisionCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SelfHarmRiskMonitoringCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><RoomSharingAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MedicationSideEffectsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PeerRelationshipAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeEnvironmentInspectionCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ComplaintResolutionTrackingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffSupervisionComplianceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildDevelopmentMilestoneCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><VisitorFeedbackCollectionCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffShiftPatternMonitoringCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildDigitalWellbeingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><FamilyEngagementTrackingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><TransitionPlanningReadinessCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><KeyWorkerAllocationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ConsentCapacityMonitoringCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><BehaviourPatternAnalysisCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PhysicalActivityTrackingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ReligiousCulturalObservanceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SiblingContactQualityCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PrivacyDignityMonitoringCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensAspirationsGoalsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><CreativeEnrichmentActivitiesCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MedicationEffectivenessReviewCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HealthScreeningImmunisationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SocialSkillsDevelopmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><RestorativeJusticePracticeCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><LeisureRecreationActivitiesCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeworkAcademicSupportCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><AdvocacyRepresentationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><CelebrationMilestonesCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><WorkExperienceEmploymentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><DeviceScreenTimeMonitoringCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><FinancialLiteracySavingsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><FirstAidMedicalEmergencyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><OutdoorSpacesPlayAreasCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PositiveBehaviourReinforcementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><DentalOpticalHealthCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SelfEsteemConfidenceBuildingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ArrivalSettlingExperienceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HealthyEatingCookingSkillsCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><RelationshipEducationSafetyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PetCareResponsibilityCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><GardenHorticultureActivitiesCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><FaithSpiritualObservanceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffPatternIntelligenceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffPerformanceDipCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffBurnoutIndicatorCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffDevelopmentPlanCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffSupportPlanCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffPracticeRiskAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffTriggerMapCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffSupportActionCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffReviewOutcomeCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffConfidenceIndicatorCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffMandatoryTrainingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><YoungPersonDailyDiaryCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ProfessionalNetworkDirectoryCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MenuPlanningDietaryCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><EhcpSendMonitoringCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><PlacementMatchingAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><Reg44IndependentVisitorCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><EmotionalWellbeingOutcomeCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ComplianceCertificateCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeClosurePlanningCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ParentalContactArrangementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SafeguardingPartnershipCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><LacHealthAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffWhistleblowingInvestigationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeAtmosphereAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><QualityOfCareReviewCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><MedicationIncidentReportingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffAnnualLeaveCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildrensPocketMoneyAuditCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffConflictOfInterestCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><EnvironmentalImpactAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffRetentionExitAnalysisCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildSexualExploitationRiskCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><OfstedInspectionReadinessCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><YoungPersonEmploymentSupportCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><SleepDisturbanceInterventionCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildCriminalExploitationRiskCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffSicknessManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeInsuranceComplianceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildVoiceParticipationTrackingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffCodeOfConductComplianceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeEnergyEfficiencyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildRadicalisationPreventionCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffNvqQualificationTrackingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeAccessibilityAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildNutritionWeightMonitoringCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffDbsRenewalTrackingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeFireRiskAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildSubstanceMisuseScreeningCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffReturnToWorkInterviewCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeLegionellaRiskAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildBereavementSupportCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffMandatoryRefresherTrainingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeAsbestosManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildGangsAffiliationRiskCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffAgencyWorkerComplianceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeRadonTestingCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildFgmRiskAssessmentCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffProfessionalRegistrationCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeElectricalSafetyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildForcedMarriageRiskCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffSecondmentManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeGasSafetyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildModernSlaveryRiskCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffPayrollComplianceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeLiftEquipmentSafetyCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildHonourBasedAbuseRiskCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffExitInterviewManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeWaterHygieneManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildRadicalisationRiskCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffWhistleblowingManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomePestControlManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildTraffickingRiskCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffOvertimeManagementCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeCctvComplianceCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><ChildOnlineSafetyMonitoringCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><StaffLoneWorkingRiskCardLazy /></CardErrorBoundary>
        <CardErrorBoundary><HomeEmergencyLightingCardLazy /></CardErrorBoundary>
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
