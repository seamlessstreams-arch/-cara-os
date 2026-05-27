"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { PriorityCard } from "@/components/ui/priority-card";
import { useDashboard, useHealthCheck, useTimeSaved } from "@/hooks/use-dashboard";
import { useCareEvents } from "@/hooks/use-care-events";
import { useAddOversight } from "@/hooks/use-incidents";
import { useCompleteTask } from "@/hooks/use-tasks";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { cn, todayStr, formatRelative, isOverdue, isDueToday } from "@/lib/utils";
import type { Task, Incident, YoungPerson, Shift } from "@/types";
import {
  AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock,
  Shield, Users, Pill, GraduationCap, ChevronRight, Circle, Ban,
  UserX, Eye, Timer, Building2, Car, Sparkles, TrendingUp, Heart,
  AlertCircle, Flame, Target, RefreshCw, CheckCheck, MapPin,
  Activity, Zap, TriangleAlert, XCircle,
} from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import type { AppRole } from "@/lib/permissions";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Dynamic imports — loaded on demand to prevent browser memory crash ────────


const IntelligenceBriefWidget = dynamic(() => import("@/components/intelligence/intelligence-brief-widget").then(m => m.IntelligenceBriefWidget ? { default: m.IntelligenceBriefWidget } : m), { ssr: false });
const ManagerIntelligenceBriefingCard = dynamic(() => import("@/components/dashboard/manager-intelligence-briefing-card").then(m => m.ManagerIntelligenceBriefingCard ? { default: m.ManagerIntelligenceBriefingCard } : m), { ssr: false });
const InspectionReadinessIntelligenceCard = dynamic(() => import("@/components/dashboard/inspection-readiness-intelligence-card").then(m => m.InspectionReadinessIntelligenceCard ? { default: m.InspectionReadinessIntelligenceCard } : m), { ssr: false });
const StaffWellbeingIntelligenceCard = dynamic(() => import("@/components/dashboard/staff-wellbeing-intelligence-card").then(m => m.StaffWellbeingIntelligenceCard ? { default: m.StaffWellbeingIntelligenceCard } : m), { ssr: false });
const RiskIntelligenceDashboardCard = dynamic(() => import("@/components/dashboard/risk-intelligence-dashboard-card").then(m => m.RiskIntelligenceDashboardCard ? { default: m.RiskIntelligenceDashboardCard } : m), { ssr: false });
const AriaDashboardPanel = dynamic(() => import("@/components/dashboard/aria-dashboard-panel").then(m => m.AriaDashboardPanel ? { default: m.AriaDashboardPanel } : m), { ssr: false });
const AriaDailyIntelligence = dynamic(() => import("@/components/aria/aria-daily-intelligence").then(m => m.AriaDailyIntelligence ? { default: m.AriaDailyIntelligence } : m), { ssr: false });
const AriaTodayBriefing = dynamic(() => import("@/components/aria/aria-today-briefing").then(m => m.AriaTodayBriefing ? { default: m.AriaTodayBriefing } : m), { ssr: false });
const AriaRegulatoryPulse = dynamic(() => import("@/components/aria/aria-regulatory-pulse").then(m => m.AriaRegulatoryPulse ? { default: m.AriaRegulatoryPulse } : m), { ssr: false });
const AriaRecordingQuality = dynamic(() => import("@/components/aria/aria-recording-quality").then(m => m.AriaRecordingQuality ? { default: m.AriaRecordingQuality } : m), { ssr: false });
const AriaShiftSafety = dynamic(() => import("@/components/aria/aria-shift-safety").then(m => m.AriaShiftSafety ? { default: m.AriaShiftSafety } : m), { ssr: false });
const AriaSupervisionIntelligence = dynamic(() => import("@/components/aria/aria-supervision-intelligence").then(m => m.AriaSupervisionIntelligence ? { default: m.AriaSupervisionIntelligence } : m), { ssr: false });
const AriaMedicationIntelligence = dynamic(() => import("@/components/aria/aria-medication-intelligence"), { ssr: false });
const AriaStaffingAdequacy = dynamic(() => import("@/components/aria/aria-staffing-adequacy"), { ssr: false });
const AriaTrainingCompliance = dynamic(() => import("@/components/aria/aria-training-compliance"), { ssr: false });
const AriaIncidentAnalysis = dynamic(() => import("@/components/aria/aria-incident-analysis"), { ssr: false });

const ActivityFeed = dynamic(() => import("@/components/dashboard/activity-feed").then(m => m.ActivityFeed ? { default: m.ActivityFeed } : m), { ssr: false });
const YoungPeopleStrip = dynamic(() => import("@/components/dashboard/young-people-strip").then(m => m.YoungPeopleStrip ? { default: m.YoungPeopleStrip } : m), { ssr: false });
const QuickActionsDial = dynamic(() => import("@/components/dashboard/quick-actions-dial").then(m => m.QuickActionsDial ? { default: m.QuickActionsDial } : m), { ssr: false });
const HandoverPrompt = dynamic(() => import("@/components/dashboard/handover-prompt").then(m => m.HandoverPrompt ? { default: m.HandoverPrompt } : m), { ssr: false });
const SupervisionTracker = dynamic(() => import("@/components/dashboard/supervision-tracker").then(m => m.SupervisionTracker ? { default: m.SupervisionTracker } : m), { ssr: false });
const KeyDatesCard = dynamic(() => import("@/components/dashboard/key-dates-card").then(m => m.KeyDatesCard ? { default: m.KeyDatesCard } : m), { ssr: false });
const DocumentSignOff = dynamic(() => import("@/components/dashboard/document-sign-off").then(m => m.DocumentSignOff ? { default: m.DocumentSignOff } : m), { ssr: false });
const LeaveOverview = dynamic(() => import("@/components/dashboard/leave-overview").then(m => m.LeaveOverview ? { default: m.LeaveOverview } : m), { ssr: false });
const NightSummary = dynamic(() => import("@/components/dashboard/night-summary").then(m => m.NightSummary ? { default: m.NightSummary } : m), { ssr: false });
const YourHandoverCard = dynamic(() => import("@/components/dashboard/your-handover-card").then(m => m.YourHandoverCard ? { default: m.YourHandoverCard } : m), { ssr: false });
const ConcernEscalation = dynamic(() => import("@/components/dashboard/concern-escalation").then(m => m.ConcernEscalation ? { default: m.ConcernEscalation } : m), { ssr: false });
const ShiftChecklist = dynamic(() => import("@/components/dashboard/shift-checklist").then(m => m.ShiftChecklist ? { default: m.ShiftChecklist } : m), { ssr: false });
const OutcomesSummary = dynamic(() => import("@/components/dashboard/outcomes-summary").then(m => m.OutcomesSummary ? { default: m.OutcomesSummary } : m), { ssr: false });
const RiAlertsSummary = dynamic(() => import("@/components/dashboard/ri-alerts-summary").then(m => m.RiAlertsSummary ? { default: m.RiAlertsSummary } : m), { ssr: false });
const GovernanceScore = dynamic(() => import("@/components/dashboard/governance-score").then(m => m.GovernanceScore ? { default: m.GovernanceScore } : m), { ssr: false });
const TrainingComplianceCard = dynamic(() => import("@/components/dashboard/training-compliance-card").then(m => m.TrainingComplianceCard ? { default: m.TrainingComplianceCard } : m), { ssr: false });
const MedicationStatusCard = dynamic(() => import("@/components/dashboard/medication-status-card").then(m => m.MedicationStatusCard ? { default: m.MedicationStatusCard } : m), { ssr: false });
const RecruitmentPipelineCard = dynamic(() => import("@/components/dashboard/recruitment-pipeline-card").then(m => m.RecruitmentPipelineCard ? { default: m.RecruitmentPipelineCard } : m), { ssr: false });
const YoungPeopleRiskCard = dynamic(() => import("@/components/dashboard/young-people-risk-card").then(m => m.YoungPeopleRiskCard ? { default: m.YoungPeopleRiskCard } : m), { ssr: false });
const DailyLogSummaryCard = dynamic(() => import("@/components/dashboard/daily-log-summary-card").then(m => m.DailyLogSummaryCard ? { default: m.DailyLogSummaryCard } : m), { ssr: false });
const StaffingCoverageCard = dynamic(() => import("@/components/dashboard/staffing-coverage-card").then(m => m.StaffingCoverageCard ? { default: m.StaffingCoverageCard } : m), { ssr: false });
const IncidentTrendsCard = dynamic(() => import("@/components/dashboard/incident-trends-card").then(m => m.IncidentTrendsCard ? { default: m.IncidentTrendsCard } : m), { ssr: false });
const EnvironmentStatusCard = dynamic(() => import("@/components/dashboard/environment-status-card").then(m => m.EnvironmentStatusCard ? { default: m.EnvironmentStatusCard } : m), { ssr: false });
const TasksSummaryCard = dynamic(() => import("@/components/dashboard/tasks-summary-card").then(m => m.TasksSummaryCard ? { default: m.TasksSummaryCard } : m), { ssr: false });
const CarePlanComplianceCard = dynamic(() => import("@/components/dashboard/care-plan-compliance-card").then(m => m.CarePlanComplianceCard ? { default: m.CarePlanComplianceCard } : m), { ssr: false });
const DocumentComplianceCard = dynamic(() => import("@/components/dashboard/document-compliance-card").then(m => m.DocumentComplianceCard ? { default: m.DocumentComplianceCard } : m), { ssr: false });
const SupervisionComplianceCard = dynamic(() => import("@/components/dashboard/supervision-compliance-card").then(m => m.SupervisionComplianceCard ? { default: m.SupervisionComplianceCard } : m), { ssr: false });
const ComplaintsSummaryCard = dynamic(() => import("@/components/dashboard/complaints-summary-card").then(m => m.ComplaintsSummaryCard ? { default: m.ComplaintsSummaryCard } : m), { ssr: false });
const WelfareChecksCard = dynamic(() => import("@/components/dashboard/welfare-checks-card").then(m => m.WelfareChecksCard ? { default: m.WelfareChecksCard } : m), { ssr: false });
const MissingFromCareCard = dynamic(() => import("@/components/dashboard/missing-from-care-card").then(m => m.MissingFromCareCard ? { default: m.MissingFromCareCard } : m), { ssr: false });
const FamilyContactCard = dynamic(() => import("@/components/dashboard/family-contact-card").then(m => m.FamilyContactCard ? { default: m.FamilyContactCard } : m), { ssr: false });
const OutcomesProgressCard = dynamic(() => import("@/components/dashboard/outcomes-progress-card").then(m => m.OutcomesProgressCard ? { default: m.OutcomesProgressCard } : m), { ssr: false });
const MaintenanceSummaryCard = dynamic(() => import("@/components/dashboard/maintenance-summary-card").then(m => m.MaintenanceSummaryCard ? { default: m.MaintenanceSummaryCard } : m), { ssr: false });
const AuditComplianceCard = dynamic(() => import("@/components/dashboard/audit-compliance-card").then(m => m.AuditComplianceCard ? { default: m.AuditComplianceCard } : m), { ssr: false });
const ExpensesSummaryCard = dynamic(() => import("@/components/dashboard/expenses-summary-card").then(m => m.ExpensesSummaryCard ? { default: m.ExpensesSummaryCard } : m), { ssr: false });
const FormComplianceCard = dynamic(() => import("@/components/dashboard/form-compliance-card").then(m => m.FormComplianceCard ? { default: m.FormComplianceCard } : m), { ssr: false });
const CareEventsPanel = dynamic(() => import("@/components/care-events/care-events-panel").then(m => m.CareEventsPanel ? { default: m.CareEventsPanel } : m), { ssr: false });
const ChildVoiceParticipationCard = dynamic(() => import("@/components/dashboard/child-voice-participation-card").then(m => m.ChildVoiceParticipationCard ? { default: m.ChildVoiceParticipationCard } : m), { ssr: false });
const HomeWellbeingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-wellbeing-intelligence-card").then(m => m.HomeWellbeingIntelligenceCard ? { default: m.HomeWellbeingIntelligenceCard } : m), { ssr: false });
const HomeActivityEnrichmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-activity-enrichment-intelligence-card").then(m => m.HomeActivityEnrichmentIntelligenceCard ? { default: m.HomeActivityEnrichmentIntelligenceCard } : m), { ssr: false });
const HomeNightSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-night-safety-intelligence-card").then(m => m.HomeNightSafetyIntelligenceCard ? { default: m.HomeNightSafetyIntelligenceCard } : m), { ssr: false });
const HomeRegulatoryComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-regulatory-compliance-intelligence-card").then(m => m.HomeRegulatoryComplianceIntelligenceCard ? { default: m.HomeRegulatoryComplianceIntelligenceCard } : m), { ssr: false });
const HomeStaffDevelopmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-development-intelligence-card").then(m => m.HomeStaffDevelopmentIntelligenceCard ? { default: m.HomeStaffDevelopmentIntelligenceCard } : m), { ssr: false });
const HomeIncidentSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-incident-safety-intelligence-card").then(m => m.HomeIncidentSafetyIntelligenceCard ? { default: m.HomeIncidentSafetyIntelligenceCard } : m), { ssr: false });
const HomeChildVoiceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-child-voice-intelligence-card").then(m => m.HomeChildVoiceIntelligenceCard ? { default: m.HomeChildVoiceIntelligenceCard } : m), { ssr: false });
const HomeKeyWorkingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-key-working-intelligence-card").then(m => m.HomeKeyWorkingIntelligenceCard ? { default: m.HomeKeyWorkingIntelligenceCard } : m), { ssr: false });
const HomeEducationAchievementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-education-achievement-intelligence-card").then(m => m.HomeEducationAchievementIntelligenceCard ? { default: m.HomeEducationAchievementIntelligenceCard } : m), { ssr: false });
const HomeMissingEpisodesIntelligenceCard = dynamic(() => import("@/components/dashboard/home-missing-episodes-intelligence-card").then(m => m.HomeMissingEpisodesIntelligenceCard ? { default: m.HomeMissingEpisodesIntelligenceCard } : m), { ssr: false });
const HomeHealthWellbeingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-health-wellbeing-intelligence-card").then(m => m.HomeHealthWellbeingIntelligenceCard ? { default: m.HomeHealthWellbeingIntelligenceCard } : m), { ssr: false });
const HomeLACReviewIntelligenceCard = dynamic(() => import("@/components/dashboard/home-lac-review-intelligence-card").then(m => m.HomeLACReviewIntelligenceCard ? { default: m.HomeLACReviewIntelligenceCard } : m), { ssr: false });
const HomeRiskAssessmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-risk-assessment-intelligence-card").then(m => m.HomeRiskAssessmentIntelligenceCard ? { default: m.HomeRiskAssessmentIntelligenceCard } : m), { ssr: false });
const HomeIndependenceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-independence-intelligence-card").then(m => m.HomeIndependenceIntelligenceCard ? { default: m.HomeIndependenceIntelligenceCard } : m), { ssr: false });
const HomeParticipationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-participation-intelligence-card").then(m => m.HomeParticipationIntelligenceCard ? { default: m.HomeParticipationIntelligenceCard } : m), { ssr: false });
const HomeNotifiableEventsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-notifiable-events-intelligence-card").then(m => m.HomeNotifiableEventsIntelligenceCard ? { default: m.HomeNotifiableEventsIntelligenceCard } : m), { ssr: false });
const HomeRestrictivePracticeIntelligenceCard = dynamic(() => import("@/components/dashboard/home-restrictive-practice-intelligence-card").then(m => m.HomeRestrictivePracticeIntelligenceCard ? { default: m.HomeRestrictivePracticeIntelligenceCard } : m), { ssr: false });
const HomeSupervisionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-supervision-intelligence-card").then(m => m.HomeSupervisionIntelligenceCard ? { default: m.HomeSupervisionIntelligenceCard } : m), { ssr: false });
const HomeBehaviourIntelligenceCard = dynamic(() => import("@/components/dashboard/home-behaviour-intelligence-card").then(m => m.HomeBehaviourIntelligenceCard ? { default: m.HomeBehaviourIntelligenceCard } : m), { ssr: false });
const HomeSafeguardingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-safeguarding-intelligence-card").then(m => m.HomeSafeguardingIntelligenceCard ? { default: m.HomeSafeguardingIntelligenceCard } : m), { ssr: false });
const HomeReg44IntelligenceCard = dynamic(() => import("@/components/dashboard/home-reg44-intelligence-card").then(m => m.HomeReg44IntelligenceCard ? { default: m.HomeReg44IntelligenceCard } : m), { ssr: false });
const HomeFamilyEngagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-family-engagement-intelligence-card").then(m => m.HomeFamilyEngagementIntelligenceCard ? { default: m.HomeFamilyEngagementIntelligenceCard } : m), { ssr: false });
const HomeAdmissionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-admission-intelligence-card").then(m => m.HomeAdmissionIntelligenceCard ? { default: m.HomeAdmissionIntelligenceCard } : m), { ssr: false });
const HomeVisitorIntelligenceCard = dynamic(() => import("@/components/dashboard/home-visitor-intelligence-card").then(m => m.HomeVisitorIntelligenceCard ? { default: m.HomeVisitorIntelligenceCard } : m), { ssr: false });
const HomeEmergencyPreparednessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-emergency-preparedness-intelligence-card").then(m => m.HomeEmergencyPreparednessIntelligenceCard ? { default: m.HomeEmergencyPreparednessIntelligenceCard } : m), { ssr: false });
const HomeComplaintsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-complaints-intelligence-card").then(m => m.HomeComplaintsIntelligenceCard ? { default: m.HomeComplaintsIntelligenceCard } : m), { ssr: false });
const HomeQualityAssuranceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-quality-assurance-intelligence-card").then(m => m.HomeQualityAssuranceIntelligenceCard ? { default: m.HomeQualityAssuranceIntelligenceCard } : m), { ssr: false });
const HomeFinancialWellbeingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-financial-wellbeing-intelligence-card").then(m => m.HomeFinancialWellbeingIntelligenceCard ? { default: m.HomeFinancialWellbeingIntelligenceCard } : m), { ssr: false });
const HomePolicyComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-policy-compliance-intelligence-card").then(m => m.HomePolicyComplianceIntelligenceCard ? { default: m.HomePolicyComplianceIntelligenceCard } : m), { ssr: false });
const HomePremisesSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-premises-safety-intelligence-card").then(m => m.HomePremisesSafetyIntelligenceCard ? { default: m.HomePremisesSafetyIntelligenceCard } : m), { ssr: false });
const HomeHandoverContinuityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-handover-continuity-intelligence-card").then(m => m.HomeHandoverContinuityIntelligenceCard ? { default: m.HomeHandoverContinuityIntelligenceCard } : m), { ssr: false });
const HomeDocumentGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-document-governance-intelligence-card").then(m => m.HomeDocumentGovernanceIntelligenceCard ? { default: m.HomeDocumentGovernanceIntelligenceCard } : m), { ssr: false });
const HomeRecordingQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-recording-quality-intelligence-card").then(m => m.HomeRecordingQualityIntelligenceCard ? { default: m.HomeRecordingQualityIntelligenceCard } : m), { ssr: false });
const HomeSaferRecruitmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-safer-recruitment-intelligence-card").then(m => m.HomeSaferRecruitmentIntelligenceCard ? { default: m.HomeSaferRecruitmentIntelligenceCard } : m), { ssr: false });
const HomeWorkforcePlanningIntelligenceCard = dynamic(() => import("@/components/dashboard/home-workforce-planning-intelligence-card").then(m => m.HomeWorkforcePlanningIntelligenceCard ? { default: m.HomeWorkforcePlanningIntelligenceCard } : m), { ssr: false });
const HomeChronologyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-chronology-intelligence-card").then(m => m.HomeChronologyIntelligenceCard ? { default: m.HomeChronologyIntelligenceCard } : m), { ssr: false });
const HomeMeetingGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-meeting-governance-intelligence-card").then(m => m.HomeMeetingGovernanceIntelligenceCard ? { default: m.HomeMeetingGovernanceIntelligenceCard } : m), { ssr: false });
const HomeKeyworkerIntelligenceCard = dynamic(() => import("@/components/dashboard/home-keyworker-intelligence-card").then(m => m.HomeKeyworkerIntelligenceCard ? { default: m.HomeKeyworkerIntelligenceCard } : m), { ssr: false });
const HomePlacementStabilityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-placement-stability-intelligence-card").then(m => m.HomePlacementStabilityIntelligenceCard ? { default: m.HomePlacementStabilityIntelligenceCard } : m), { ssr: false });
const HomeOutcomesProgressIntelligenceCard = dynamic(() => import("@/components/dashboard/home-outcomes-progress-intelligence-card").then(m => m.HomeOutcomesProgressIntelligenceCard ? { default: m.HomeOutcomesProgressIntelligenceCard } : m), { ssr: false });
const HomeRiskLandscapeIntelligenceCard = dynamic(() => import("@/components/dashboard/home-risk-landscape-intelligence-card").then(m => m.HomeRiskLandscapeIntelligenceCard ? { default: m.HomeRiskLandscapeIntelligenceCard } : m), { ssr: false });
const HomeTherapeuticClimateIntelligenceCard = dynamic(() => import("@/components/dashboard/home-therapeutic-climate-intelligence-card").then(m => m.HomeTherapeuticClimateIntelligenceCard ? { default: m.HomeTherapeuticClimateIntelligenceCard } : m), { ssr: false });
const HomeBSPEffectivenessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-bsp-effectiveness-intelligence-card").then(m => m.HomeBSPEffectivenessIntelligenceCard ? { default: m.HomeBSPEffectivenessIntelligenceCard } : m), { ssr: false });
const HomeCompetencyLandscapeIntelligenceCard = dynamic(() => import("@/components/dashboard/home-competency-landscape-intelligence-card").then(m => m.HomeCompetencyLandscapeIntelligenceCard ? { default: m.HomeCompetencyLandscapeIntelligenceCard } : m), { ssr: false });
const HomeExpenseGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-expense-governance-intelligence-card").then(m => m.HomeExpenseGovernanceIntelligenceCard ? { default: m.HomeExpenseGovernanceIntelligenceCard } : m), { ssr: false });
const HomeShiftPatternIntelligenceCard = dynamic(() => import("@/components/dashboard/home-shift-pattern-intelligence-card").then(m => m.HomeShiftPatternIntelligenceCard ? { default: m.HomeShiftPatternIntelligenceCard } : m), { ssr: false });
const HomeLeaveAbsenceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-leave-absence-intelligence-card").then(m => m.HomeLeaveAbsenceIntelligenceCard ? { default: m.HomeLeaveAbsenceIntelligenceCard } : m), { ssr: false });
const HomeStaffWellbeingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-wellbeing-intelligence-card").then(m => m.HomeStaffWellbeingIntelligenceCard ? { default: m.HomeStaffWellbeingIntelligenceCard } : m), { ssr: false });
const HomePeerDynamicsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-peer-dynamics-intelligence-card").then(m => m.HomePeerDynamicsIntelligenceCard ? { default: m.HomePeerDynamicsIntelligenceCard } : m), { ssr: false });
const HomeOnCallGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-on-call-governance-intelligence-card").then(m => m.HomeOnCallGovernanceIntelligenceCard ? { default: m.HomeOnCallGovernanceIntelligenceCard } : m), { ssr: false });
const HomeTransitionPlanningIntelligenceCard = dynamic(() => import("@/components/dashboard/home-transition-planning-intelligence-card").then(m => m.HomeTransitionPlanningIntelligenceCard ? { default: m.HomeTransitionPlanningIntelligenceCard } : m), { ssr: false });
const HomeDelegatedAuthorityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-delegated-authority-intelligence-card").then(m => m.HomeDelegatedAuthorityIntelligenceCard ? { default: m.HomeDelegatedAuthorityIntelligenceCard } : m), { ssr: false });
const HomeFireSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-fire-safety-intelligence-card").then(m => m.HomeFireSafetyIntelligenceCard ? { default: m.HomeFireSafetyIntelligenceCard } : m), { ssr: false });
const HomeSleepQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-sleep-quality-intelligence-card").then(m => m.HomeSleepQualityIntelligenceCard ? { default: m.HomeSleepQualityIntelligenceCard } : m), { ssr: false });
const HomeMedicationManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-medication-management-intelligence-card").then(m => m.HomeMedicationManagementIntelligenceCard ? { default: m.HomeMedicationManagementIntelligenceCard } : m), { ssr: false });
const HomeExploitationScreeningIntelligenceCard = dynamic(() => import("@/components/dashboard/home-exploitation-screening-intelligence-card").then(m => m.HomeExploitationScreeningIntelligenceCard ? { default: m.HomeExploitationScreeningIntelligenceCard } : m), { ssr: false });
const HomeDailyLogIntelligenceCard = dynamic(() => import("@/components/dashboard/home-daily-log-intelligence-card").then(m => m.HomeDailyLogIntelligenceCard ? { default: m.HomeDailyLogIntelligenceCard } : m), { ssr: false });
const HomeDigitalSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-digital-safety-intelligence-card").then(m => m.HomeDigitalSafetyIntelligenceCard ? { default: m.HomeDigitalSafetyIntelligenceCard } : m), { ssr: false });
const HomeMentalHealthIntelligenceCard = dynamic(() => import("@/components/dashboard/home-mental-health-intelligence-card").then(m => m.HomeMentalHealthIntelligenceCard ? { default: m.HomeMentalHealthIntelligenceCard } : m), { ssr: false });
const HomeStaffSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-safety-intelligence-card").then(m => m.HomeStaffSafetyIntelligenceCard ? { default: m.HomeStaffSafetyIntelligenceCard } : m), { ssr: false });
const HomeOrganizationalLearningIntelligenceCard = dynamic(() => import("@/components/dashboard/home-organizational-learning-intelligence-card").then(m => m.HomeOrganizationalLearningIntelligenceCard ? { default: m.HomeOrganizationalLearningIntelligenceCard } : m), { ssr: false });
const HomeMultiAgencyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-multi-agency-intelligence-card").then(m => m.HomeMultiAgencyIntelligenceCard ? { default: m.HomeMultiAgencyIntelligenceCard } : m), { ssr: false });
const HomeDataGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-data-governance-intelligence-card").then(m => m.HomeDataGovernanceIntelligenceCard ? { default: m.HomeDataGovernanceIntelligenceCard } : m), { ssr: false });
const HomeNutritionCateringIntelligenceCard = dynamic(() => import("@/components/dashboard/home-nutrition-catering-intelligence-card").then(m => m.HomeNutritionCateringIntelligenceCard ? { default: m.HomeNutritionCateringIntelligenceCard } : m), { ssr: false });
const HomeHealthMonitoringIntelligenceCard = dynamic(() => import("@/components/dashboard/home-health-monitoring-intelligence-card").then(m => m.HomeHealthMonitoringIntelligenceCard ? { default: m.HomeHealthMonitoringIntelligenceCard } : m), { ssr: false });
const HomeMedicationGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-medication-governance-intelligence-card").then(m => m.HomeMedicationGovernanceIntelligenceCard ? { default: m.HomeMedicationGovernanceIntelligenceCard } : m), { ssr: false });

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatLiveDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-[var(--cs-surface)]", className)} />;
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-12" />
      <Skeleton className="h-2.5 w-28" />
    </div>
  );
}

function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, bgColor, subtitle, href, pulse,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  subtitle?: string;
  href?: string;
  pulse?: boolean;
}) {
  const inner = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider truncate">{label}</div>
        <div className={cn("mt-1 text-3xl font-bold tabular-nums", color)}>{value}</div>
        {subtitle && <div className="mt-0.5 text-xs text-[var(--cs-text-gentle)] truncate">{subtitle}</div>}
      </div>
      <div className={cn("rounded-2xl p-3 shrink-0 relative", bgColor)}>
        <Icon className={cn("h-5 w-5", color)} />
        {pulse && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--cs-risk)] animate-pulse" />}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-5 transition-all hover:shadow-[var(--cs-shadow-card)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--cs-aria-gold)]/40"
      >
        {inner}
      </Link>
    );
  }
  return <div className="rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-5">{inner}</div>;
}

// ─── Alert Command Strip ──────────────────────────────────────────────────────

interface AlertItem {
  key: string;
  label: string;
  href: string;
  severity: "critical" | "high" | "medium";
}

function AlertCommandStrip({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null;

  const hasCritical = alerts.some((a) => a.severity === "critical");

  return (
    <div className={cn(
      "rounded-2xl border p-4 flex flex-wrap items-center gap-3",
      hasCritical
        ? "bg-red-50 border-red-300"
        : "bg-amber-50 border-amber-300"
    )}>
      <div className="flex items-center gap-2 shrink-0">
        {hasCritical ? (
          <XCircle className="h-5 w-5 text-red-600 shrink-0" />
        ) : (
          <TriangleAlert className="h-5 w-5 text-amber-600 shrink-0" />
        )}
        <span className={cn(
          "text-sm font-bold",
          hasCritical ? "text-red-800" : "text-amber-800"
        )}>
          {hasCritical ? "Immediate action required" : "Attention needed"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 flex-1">
        {alerts.map((alert) => (
          <Link
            key={alert.key}
            href={alert.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105",
              alert.severity === "critical"
                ? "bg-red-600 text-white hover:bg-red-700"
                : alert.severity === "high"
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-amber-500 text-white hover:bg-amber-600"
            )}
          >
            <AlertCircle className="h-3 w-3" />
            {alert.label}
            <ArrowRight className="h-3 w-3" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Priority Task Row ─────────────────────────────────────────────────────────

function TaskRow({ task, onComplete }: { task: Task; onComplete?: (id: string) => void }) {
  const overdue = isOverdue(task.due_date, task.status);
  const dueToday = isDueToday(task.due_date);
  const [completing, setCompleting] = useState(false);

  const prioColors: Record<string, string> = {
    urgent: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-blue-100 text-blue-700",
    low: "bg-slate-100 text-[var(--cs-text-secondary)]",
  };

  const statusIcons: Record<string, React.ElementType> = {
    not_started: Circle,
    in_progress: Clock,
    blocked: Ban,
    completed: CheckCircle2,
  };
  const StatusIcon = statusIcons[task.status] || Circle;

  const handleComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onComplete || completing) return;
    setCompleting(true);
    onComplete(task.id);
    setTimeout(() => setCompleting(false), 1500);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[var(--cs-surface)] transition-colors group">
      <StatusIcon
        className={cn(
          "h-4 w-4 shrink-0",
          task.status === "in_progress" ? "text-[var(--cs-info)]" :
          task.status === "blocked" ? "text-[var(--cs-risk)]" :
          "text-[var(--cs-text-gentle)]"
        )}
      />
      <Link href="/tasks" className="flex-1 min-w-0">
        <div className={cn("text-sm font-medium truncate", overdue ? "text-[var(--cs-risk)]" : "text-[var(--cs-navy)]")}>
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.assigned_to && (
            <span className="text-[10px] text-[var(--cs-text-muted)]">{getStaffName(task.assigned_to).split(" ")[0]}</span>
          )}
          {task.due_date && (
            <span className={cn(
              "text-[10px]",
              overdue ? "text-red-600 font-semibold" :
              dueToday ? "text-orange-600 font-medium" :
              "text-[var(--cs-text-muted)]"
            )}>
              {overdue ? "Overdue · " : ""}{formatRelative(task.due_date)}
            </span>
          )}
          {task.linked_child_id && (
            <span className="text-[10px] text-[var(--cs-aria-gold)] flex items-center gap-0.5">
              <Heart className="h-2.5 w-2.5" />
              {getYPName(task.linked_child_id)}
            </span>
          )}
        </div>
      </Link>
      <Badge className={cn("text-[10px] rounded-full border-0 shrink-0", prioColors[task.priority])}>
        {task.priority}
      </Badge>
      {onComplete && task.status !== "completed" && (
        <button
          onClick={handleComplete}
          disabled={completing}
          title="Mark complete"
          className={cn(
            "shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition-all",
            completing
              ? "bg-emerald-100 text-emerald-600"
              : "bg-slate-100 text-[var(--cs-text-muted)] hover:bg-emerald-100 hover:text-emerald-600 opacity-0 group-hover:opacity-100"
          )}
        >
          {completing ? <CheckCheck className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

// ─── Oversight Row ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  safeguarding_concern: "Safeguarding",
  missing_from_care: "Missing",
  medication_error: "Medication Error",
  complaint: "Complaint",
  physical_intervention: "Restraint",
  self_harm: "Self-Harm",
  exploitation_concern: "Exploitation",
  assault: "Assault",
  near_miss: "Near Miss",
};

const SEV_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
};

function OversightRow({
  incident,
  onAddOversight,
}: {
  incident: Incident;
  onAddOversight: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-[var(--cs-surface)] transition-colors group">
      <AlertTriangle
        className={cn(
          "h-4 w-4 shrink-0 mt-0.5",
          incident.severity === "critical" ? "text-[var(--cs-risk)]" :
          incident.severity === "high" ? "text-orange-500" :
          "text-[var(--cs-warning)]"
        )}
      />
      <Link href="/incidents" className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[var(--cs-navy)]">{incident.reference}</span>
          <Badge className={cn("text-[10px] rounded-full border shrink-0", SEV_COLORS[incident.severity])}>
            {incident.severity}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[10px] text-[var(--cs-text-muted)]">{TYPE_LABELS[incident.type] || incident.type}</span>
          {incident.child_id && (
            <span className="text-[10px] text-[var(--cs-aria-gold)] flex items-center gap-0.5">
              <Heart className="h-2.5 w-2.5" />
              {getYPName(incident.child_id)}
            </span>
          )}
          <span className="text-[10px] text-[var(--cs-text-muted)]">{formatRelative(incident.date)}</span>
        </div>
      </Link>
      <button
        onClick={() => onAddOversight(incident.id)}
        className="shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold bg-purple-50 text-[var(--cs-oversight)] border border-purple-200 hover:bg-[var(--cs-oversight)] hover:text-white hover:border-[var(--cs-oversight)] transition-all"
      >
        <Eye className="h-3 w-3" />
        Oversee
      </button>
    </div>
  );
}

// ─── Shift Row ─────────────────────────────────────────────────────────────────

const SHIFT_TYPE_LABELS: Record<string, string> = {
  day: "Day",
  sleep_in: "Sleep-in",
  waking_night: "Waking Night",
  early: "Early",
  late: "Late",
};

const SHIFT_TYPE_COLORS: Record<string, string> = {
  day: "bg-emerald-100 text-emerald-700",
  sleep_in: "bg-indigo-100 text-indigo-700",
  waking_night: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]",
  early: "bg-sky-100 text-sky-700",
  late: "bg-orange-100 text-orange-700",
};

function ShiftRow({ shift }: { shift: Shift }) {
  const name = getStaffName(shift.staff_id);
  const isOnNow = shift.status === "in_progress";

  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--cs-surface)] px-3 py-2 hover:bg-[var(--cs-surface)]/80 transition-colors">
      <Avatar name={name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--cs-navy)] truncate">{name}</div>
        <div className="text-[10px] text-[var(--cs-text-gentle)]">
          {shift.start_time} – {shift.end_time}
        </div>
      </div>
      <Badge className={cn("text-[10px] rounded-full border-0 shrink-0", SHIFT_TYPE_COLORS[shift.shift_type] || "bg-slate-100 text-[var(--cs-text-secondary)]")}>
        {SHIFT_TYPE_LABELS[shift.shift_type] || shift.shift_type}
      </Badge>
      {isOnNow && (
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="On shift now" />
      )}
    </div>
  );
}

// ─── Health Check Gauge ────────────────────────────────────────────────────────

function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size / 2) - 8;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;

  const scoreColor =
    score >= 80 ? "#10b981" :
    score >= 60 ? "#f59e0b" :
    score >= 40 ? "#f97316" :
    "#ef4444";

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={scoreColor}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={circumference / 4}
        className="transition-all duration-700"
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={scoreColor} fontSize={size * 0.22} fontWeight="700">
        {score}
      </text>
    </svg>
  );
}

const RISK_LEVEL_CONFIG = {
  low: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Low Risk" },
  medium: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "Medium Risk" },
  high: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "High Risk" },
  critical: { color: "bg-red-100 text-red-700 border-red-200", label: "Critical" },
};

const PRIORITY_COLORS = {
  critical: "text-red-600",
  high: "text-orange-500",
  medium: "text-amber-500",
  low: "text-[var(--cs-text-muted)]",
};

function SubScoreBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  const color =
    value >= 80 ? "bg-emerald-500" :
    value >= 60 ? "bg-amber-500" :
    value >= 40 ? "bg-orange-500" :
    "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 text-[var(--cs-text-muted)]" />
          <span className="text-[11px] text-[var(--cs-text-muted)]">{label}</span>
        </div>
        <span className="text-[11px] font-semibold text-[var(--cs-text-secondary)] tabular-nums">{value}</span>
      </div>
      <Progress value={value} color={color} className="h-1.5" />
    </div>
  );
}

// ─── Time Saved Widget ─────────────────────────────────────────────────────────

function TimeSavedWidget({ formatted }: { formatted: Record<string, string> }) {
  const stats = [
    { label: "You today", value: formatted.user_today || "—", icon: Timer, color: "text-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)]" },
    { label: "You this week", value: formatted.user_week || "—", icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
    { label: "Home this week", value: formatted.home_week || "—", icon: Activity, color: "text-emerald-600 bg-emerald-50" },
    { label: "Home this month", value: formatted.home_month || "—", icon: Zap, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-5 w-5 text-[var(--cs-aria-gold)]" />
          Time Saved by ARIA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={cn("rounded-xl p-3 flex items-center gap-2.5", s.color.split(" ")[1])}>
              <s.icon className={cn("h-4 w-4 shrink-0", s.color.split(" ")[0])} />
              <div>
                <div className={cn("text-base font-bold tabular-nums", s.color.split(" ")[0])}>{s.value}</div>
                <div className="text-[10px] text-[var(--cs-text-muted)]">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[var(--cs-text-muted)] text-center">
          Time reclaimed from admin — back into care
        </p>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMMAND CENTRE — 3-ZONE LAYOUT
// A. What Needs Attention  B. Today's Operation  C. Assurance & Patterns
// ══════════════════════════════════════════════════════════════════════════════

/** Labelled zone separator */
function ZoneHeader({ label, description }: { label: string; description?: string }) {
  return (
    <div className="flex items-end gap-3 pt-2 pb-1">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--cs-text-gentle)]">{label}</p>
        {description && <p className="text-xs text-[var(--cs-text-gentle)] mt-0.5">{description}</p>}
      </div>
      <div className="flex-1 border-b border-[var(--cs-border-subtle)]" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROLE-BASED DASHBOARD CONFIGURATION
// Controls which zones and cards each role tier can see.
// Principle: show only what's relevant — never overwhelm a care worker with
// management governance data, and never hide critical info from managers.
// ══════════════════════════════════════════════════════════════════════════════

type PriorityCardKey = "oversight" | "medication" | "missing" | "tasks" | "building" | "supervision" | "training" | "shifts";
type StatCardKey     = "onShift" | "tasksDueToday" | "medication" | "incidents" | "missing" | "training";

interface DashboardConfig {
  // Zone A
  priorityCards:     PriorityCardKey[];
  showAlertStrip:    boolean;
  showReadOnlyBanner:boolean;
  // Zone B
  statCards:           StatCardKey[];
  showShiftCard:       boolean;
  showTeamTasksCard:   boolean;
  personalTasksOnly:   boolean;  // filter task list to current user
  showMedicationCard:  boolean;
  showIntelligenceBrief: boolean;
  // Zone C
  showZoneC:          boolean;
  showHealthCheck:    boolean;
  showOversightQueue: boolean;
  showComplianceCard: boolean;
  showEnvironmentCard:boolean;
  showTimeSaved:      boolean;
  // Extras
  showRICallout:      boolean;
  // Labels
  zoneALabel:         string;
  zoneADescription:   string;
  zoneBLabel:         string;
  zoneBDescription:   string;
}

const ALL_PRIORITY_CARDS: PriorityCardKey[] = ["oversight", "medication", "missing", "tasks", "building", "supervision", "training", "shifts"];
const ALL_STAT_CARDS: StatCardKey[]         = ["onShift", "tasksDueToday", "medication", "incidents", "missing", "training"];

const FULL_CONFIG: Omit<DashboardConfig, "showRICallout" | "zoneALabel" | "zoneADescription" | "zoneBLabel" | "zoneBDescription"> = {
  priorityCards:       ALL_PRIORITY_CARDS,
  showAlertStrip:      true,
  showReadOnlyBanner:  false,
  statCards:           ALL_STAT_CARDS,
  showShiftCard:       true,
  showTeamTasksCard:   true,
  personalTasksOnly:   false,
  showMedicationCard:  true,
  showIntelligenceBrief: true,
  showZoneC:           true,
  showHealthCheck:     true,
  showOversightQueue:  true,
  showComplianceCard:  true,
  showEnvironmentCard: true,
  showTimeSaved:       true,
};

function getDashboardConfig(role: AppRole): DashboardConfig {
  // ── Care Worker / Bank Staff ─────────────────────────────────────────────
  if (role === "residential_care_worker" || role === "bank_staff") {
    return {
      priorityCards:       ["medication", "missing", "tasks"],
      showAlertStrip:      true,
      showReadOnlyBanner:  false,
      statCards:           ["onShift", "tasksDueToday", "medication"],
      showShiftCard:       true,
      showTeamTasksCard:   true,
      personalTasksOnly:   true,
      showMedicationCard:  true,
      showIntelligenceBrief: false,
      showZoneC:           false,
      showHealthCheck:     false,
      showOversightQueue:  false,
      showComplianceCard:  false,
      showEnvironmentCard: false,
      showTimeSaved:       false,
      showRICallout:       false,
      zoneALabel:          "A  ·  My alerts",
      zoneADescription:    "Critical items relevant to your shift right now",
      zoneBLabel:          "B  ·  My day",
      zoneBDescription:    "Your assigned tasks, today's shift, and medication",
    };
  }

  // ── Team Leader ──────────────────────────────────────────────────────────
  if (role === "team_leader") {
    return {
      ...FULL_CONFIG,
      showHealthCheck:     false,
      showTimeSaved:       false,
      showRICallout:       false,
      zoneALabel:          "A  ·  What needs attention",
      zoneADescription:    "Priority items requiring action right now",
      zoneBLabel:          "B  ·  Today's operation",
      zoneBDescription:    "Shift coverage, tasks, medication, and team intelligence",
    };
  }

  // ── Responsible Individual ───────────────────────────────────────────────
  if (role === "responsible_individual") {
    return {
      ...FULL_CONFIG,
      showRICallout:       true,
      zoneALabel:          "A  ·  What needs attention",
      zoneADescription:    "Priority items requiring immediate action",
      zoneBLabel:          "B  ·  Today's operation",
      zoneBDescription:    "Shift coverage, tasks, medication, and ARIA intelligence",
    };
  }

  // ── HR / Recruitment ─────────────────────────────────────────────────────
  if (role === "hr_recruitment") {
    return {
      priorityCards:       ["supervision", "training", "shifts"],
      showAlertStrip:      false,
      showReadOnlyBanner:  false,
      statCards:           ["onShift", "tasksDueToday", "training"],
      showShiftCard:       true,
      showTeamTasksCard:   true,
      personalTasksOnly:   false,
      showMedicationCard:  false,
      showIntelligenceBrief: false,
      showZoneC:           true,
      showHealthCheck:     false,
      showOversightQueue:  false,
      showComplianceCard:  true,
      showEnvironmentCard: false,
      showTimeSaved:       false,
      showRICallout:       false,
      zoneALabel:          "A  ·  Staffing alerts",
      zoneADescription:    "Training, supervision, and rota gaps requiring attention",
      zoneBLabel:          "B  ·  Today's operation",
      zoneBDescription:    "Staff on shift, tasks, and team coverage",
    };
  }

  // ── Finance / Operations ─────────────────────────────────────────────────
  if (role === "finance_operations") {
    return {
      priorityCards:       ["building", "shifts"],
      showAlertStrip:      false,
      showReadOnlyBanner:  false,
      statCards:           ["onShift", "tasksDueToday"],
      showShiftCard:       true,
      showTeamTasksCard:   true,
      personalTasksOnly:   false,
      showMedicationCard:  false,
      showIntelligenceBrief: false,
      showZoneC:           true,
      showHealthCheck:     false,
      showOversightQueue:  false,
      showComplianceCard:  false,
      showEnvironmentCard: true,
      showTimeSaved:       false,
      showRICallout:       false,
      zoneALabel:          "A  ·  Operational alerts",
      zoneADescription:    "Building, vehicle, and facilities items requiring attention",
      zoneBLabel:          "B  ·  Today's operation",
      zoneBDescription:    "Staff coverage and active tasks",
    };
  }

  // ── Read-only (Auditor / External / Therapist) ───────────────────────────
  if (role === "auditor" || role === "external_partner" || role === "therapist") {
    return {
      priorityCards:       [],
      showAlertStrip:      true,
      showReadOnlyBanner:  true,
      statCards:           ALL_STAT_CARDS,
      showShiftCard:       true,
      showTeamTasksCard:   false,
      personalTasksOnly:   false,
      showMedicationCard:  true,
      showIntelligenceBrief: false,
      showZoneC:           true,
      showHealthCheck:     true,
      showOversightQueue:  false,
      showComplianceCard:  true,
      showEnvironmentCard: true,
      showTimeSaved:       false,
      showRICallout:       false,
      zoneALabel:          "A  ·  Home overview",
      zoneADescription:    "Read-only view of active alerts",
      zoneBLabel:          "B  ·  Today's operation",
      zoneBDescription:    "Staff and care operations summary (read-only)",
    };
  }

  // ── Default: Deputy / Registered Manager / Super Admin / Admin ───────────
  return {
    ...FULL_CONFIG,
    showRICallout:       false,
    zoneALabel:          "A  ·  What needs attention",
    zoneADescription:    "Priority items requiring action right now",
    zoneBLabel:          "B  ·  Today's operation",
    zoneBDescription:    "Shift coverage, medication, active tasks, and daily intelligence",
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { currentUser } = useAuthContext();
  const { role }        = usePermissions();
  const config          = getDashboardConfig(role);
  const dashboard   = useDashboard();
  const healthCheck = useHealthCheck();
  const timeSaved   = useTimeSaved();
  const careEvents  = useCareEvents({ days: 1, limit: 5 });
  const addOversight = useAddOversight();
  const completeTask = useCompleteTask();

  const [oversightTarget, setOversightTarget] = useState<string | null>(null);

  const d  = dashboard.data?.data;
  const hc = healthCheck.data?.data;
  const ts = timeSaved.data?.formatted;

  const isLoading = dashboard.isLoading;
  const isError   = dashboard.isError;

  const alertItems = useMemo<AlertItem[]>(() => {
    if (!d) return [];
    const items: AlertItem[] = [];
    if (d.incidents.critical > 0)
      items.push({ key: "critical_incident", label: `${d.incidents.critical} critical incident${d.incidents.critical > 1 ? "s" : ""} open`, href: "/incidents", severity: "critical" });
    if (d.safeguarding.missing_active > 0)
      items.push({ key: "missing", label: `${d.safeguarding.missing_active} missing from care`, href: "/missing-from-care", severity: "critical" });
    if (d.medication.missed_today > 0)
      items.push({ key: "medication", label: `${d.medication.missed_today} medication missed today`, href: "/medication", severity: "high" });
    if (d.environment.building_checks_overdue > 0)
      items.push({ key: "building", label: `${d.environment.building_checks_overdue} building check${d.environment.building_checks_overdue > 1 ? "s" : ""} overdue`, href: "/buildings", severity: "high" });
    if (d.environment.vehicle_defects > 0)
      items.push({ key: "vehicle", label: `${d.environment.vehicle_defects} vehicle defect${d.environment.vehicle_defects > 1 ? "s" : ""}`, href: "/vehicles", severity: "medium" });
    return items;
  }, [d]);

  const handleCompleteTask = (id: string) =>
    completeTask.mutate({ id, by: currentUser?.id ?? "staff_darren" });

  const handleAddOversight = (id: string) => {
    setOversightTarget(id);
    document.getElementById("aria-anchor")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // For care workers: filter task list to current user only
  const taskQueue = useMemo(() => {
    const queue = d?.tasks.priority_queue ?? [];
    if (config.personalTasksOnly && currentUser?.id) {
      return queue.filter((t) => t.assigned_to === currentUser.id);
    }
    return queue;
  }, [d?.tasks.priority_queue, config.personalTasksOnly, currentUser?.id]);

  if (isError) {
    return (
      <PageShell title="Command Centre" showQuickCreate={false}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-8 text-center max-w-md">
            <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-base font-semibold text-red-800 mb-1">Dashboard failed to load</p>
            <p className="text-sm text-red-600 mb-4">Unable to reach the API. Please try again.</p>
            <Button variant="outline" size="sm" onClick={() => dashboard.refetch()} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => dashboard.refetch()} disabled={dashboard.isFetching} className="text-[var(--cs-text-muted)]">
        <RefreshCw className={cn("h-3.5 w-3.5 mr-1", dashboard.isFetching && "animate-spin")} />
        {dashboard.isFetching ? "Refreshing…" : "Refresh"}
      </Button>
      <SmartUploadButton variant="inline" label="Upload" uploadContext="Dashboard — general upload" />
    </div>
  );

  return (
    <PageShell
      title={`${getGreeting()}, ${currentUser?.first_name ?? "Darren"}`}
      subtitle={`${formatLiveDate()} · Oak House · ${d ? d.young_people.current.length : 3} young people in placement`}
      quickCreateContext={{ module: "dashboard" }}
      actions={pageActions}
      ariaContext={{ sourceType: "general", pageTitle: "Command Centre" }}
    >
      <div className="space-y-8 pb-8">

        {/* Handover Prompt — contextual shift awareness */}
        {!config.showReadOnlyBanner && <HandoverPrompt />}

        {/* Your Handover — personalised catch-up based on last shift */}
        {!config.showReadOnlyBanner && <YourHandoverCard />}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ZONE A — WHAT NEEDS ATTENTION                                       */}
        {/* ════════════════════════════════════════════════════════════════════ */}

        <section aria-label="What Needs Attention">
          <ZoneHeader label={config.zoneALabel} description={config.zoneADescription} />

          {/* Read-only access banner */}
          {config.showReadOnlyBanner && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3">
              <Eye className="h-5 w-5 text-blue-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Read-only access</p>
                <p className="text-xs text-blue-600 mt-0.5">You have view-only access to this dashboard. Contact a manager to make changes.</p>
              </div>
            </div>
          )}

          {/* Critical alert strip */}
          {config.showAlertStrip && !isLoading && alertItems.length > 0 && (
            <div className="mt-3 mb-4">
              <AlertCommandStrip alerts={alertItems} />
            </div>
          )}

          {/* Concern escalation tracker */}
          {!config.showReadOnlyBanner && (
            <div className="mt-3">
              <ConcernEscalation />
            </div>
          )}

          {/* Priority cards — filtered by config */}
          {config.priorityCards.length > 0 && (
            isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
                {config.priorityCards.includes("oversight") && (
                  <PriorityCard
                    title="incidents need management oversight"
                    count={d?.incidents.awaiting_oversight ?? 0}
                    description="These incidents have not yet received a management oversight note and sign-off."
                    priority="high" href="/incidents" icon={Eye} actionLabel="Review now"
                  />
                )}
                {config.priorityCards.includes("medication") && (
                  <PriorityCard
                    title="medication missed today"
                    count={d?.medication.missed_today ?? 0}
                    description="At least one scheduled medication administration has not been recorded today."
                    priority="critical" href="/medication" icon={Pill} actionLabel="View medication"
                  />
                )}
                {config.priorityCards.includes("missing") && (
                  <PriorityCard
                    title="young people missing from care"
                    count={d?.safeguarding.missing_active ?? 0}
                    description="Active missing episode(s). Police and LA notified per protocol."
                    priority="critical" href="/missing-from-care" icon={MapPin} actionLabel="View episodes"
                  />
                )}
                {config.priorityCards.includes("tasks") && (
                  <PriorityCard
                    title={config.personalTasksOnly ? "my tasks overdue" : "tasks overdue"}
                    count={d?.tasks.overdue ?? 0}
                    description={config.personalTasksOnly
                      ? "Your assigned tasks have passed their due date without completion."
                      : "Assigned tasks have passed their due date without completion."}
                    priority="high" href="/tasks" icon={AlertTriangle} actionLabel="View tasks"
                  />
                )}
                {config.priorityCards.includes("building") && (
                  <PriorityCard
                    title="building checks overdue"
                    count={d?.environment.building_checks_overdue ?? 0}
                    description="Scheduled building safety checks have not been completed on time."
                    priority="medium" href="/buildings" icon={Building2} actionLabel="View checks"
                  />
                )}
                {config.priorityCards.includes("supervision") && (
                  <PriorityCard
                    title="staff supervisions overdue"
                    count={d?.staffing.supervision_overdue ?? 0}
                    description="Staff supervisions have passed their scheduled date."
                    priority="medium" href="/supervision" icon={Users} actionLabel="View supervisions"
                  />
                )}
                {config.priorityCards.includes("training") && (
                  <PriorityCard
                    title="training records expired"
                    count={d?.compliance.training_expired ?? 0}
                    description="Staff training certificates have expired and require renewal."
                    priority="high" href="/training" icon={GraduationCap} actionLabel="View training"
                  />
                )}
                {config.priorityCards.includes("shifts") && (
                  <PriorityCard
                    title="open shifts to fill"
                    count={d?.staffing.open_shifts ?? 0}
                    description="Rota gaps with no staff assigned. Review and fill to maintain safe staffing ratios."
                    priority="medium" href="/rota" icon={UserX} actionLabel="View rota"
                  />
                )}
              </div>
            )
          )}

          {/* All-clear message — full-access roles only */}
          {!isLoading && !config.showReadOnlyBanner && config.priorityCards.length >= 8 &&
            alertItems.length === 0 &&
            (d?.incidents.awaiting_oversight ?? 0) === 0 &&
            (d?.medication.missed_today ?? 0) === 0 &&
            (d?.tasks.overdue ?? 0) === 0 &&
            (d?.staffing.open_shifts ?? 0) === 0 && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">All clear — no immediate attention items</p>
                <p className="text-xs text-emerald-600 mt-0.5">Oak House is running smoothly. Keep it up.</p>
              </div>
            </div>
          )}
        </section>

        {/* Young People — At-a-Glance */}
        {!config.showReadOnlyBanner && !isLoading && (
          <YoungPeopleStrip />
        )}

        {/* Care Event Routing Status — recent 24h entries */}
        {!config.showReadOnlyBanner && (() => {
          const recentEvents = careEvents.data?.data ?? [];
          if (recentEvents.length === 0) return null;
          const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
            draft:          { label: "Draft",             color: "bg-slate-100 text-slate-600",   icon: <Circle className="w-3 h-3" /> },
            submitted:      { label: "Submitted",         color: "bg-blue-50 text-blue-700",      icon: <Clock className="w-3 h-3" /> },
            routing:        { label: "Routing…",          color: "bg-indigo-50 text-indigo-700",  icon: <Activity className="w-3 h-3 animate-pulse" /> },
            routed:         { label: "Pending review",    color: "bg-amber-50 text-amber-700",    icon: <Clock className="w-3 h-3" /> },
            manager_review: { label: "Manager review",   color: "bg-orange-50 text-orange-700",  icon: <Eye className="w-3 h-3" /> },
            returned:       { label: "Returned",          color: "bg-red-50 text-red-700",        icon: <AlertCircle className="w-3 h-3" /> },
            verified:       { label: "Verified",          color: "bg-emerald-50 text-emerald-700",icon: <CheckCircle2 className="w-3 h-3" /> },
            locked:         { label: "Locked",            color: "bg-slate-50 text-slate-600",    icon: <CheckCheck className="w-3 h-3" /> },
            routing_failed: { label: "Routing failed",   color: "bg-red-50 text-red-700",        icon: <AlertTriangle className="w-3 h-3" /> },
          };
          return (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-slate-800">Care Events — Last 24 Hours</span>
                  <span className="text-xs text-slate-400">Live routing status</span>
                </div>
                <Link href="/care-events" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
                  All events <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {recentEvents.map((event) => {
                  const sc = statusConfig[event.status] ?? { label: event.status, color: "bg-slate-100 text-slate-600", icon: <Circle className="w-3 h-3" /> };
                  const enriched = event as never as { staff_name?: string; child_name?: string };
                  return (
                    <div key={event.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <Link href={`/care-events/${event.id}`} className="text-sm font-medium text-slate-900 hover:text-indigo-700 hover:underline truncate block">
                          {event.title}
                        </Link>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {enriched.staff_name ?? event.staff_id}{enriched.child_name ? ` · ${enriched.child_name}` : ""}
                          {event.routing_summary && event.routing_summary.records_updated > 0 && (
                            <> · <span className="text-emerald-600">{event.routing_summary.records_updated} records updated</span></>
                          )}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${sc.color}`}>
                        {sc.icon}
                        {sc.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ZONE B — TODAY'S OPERATION                                          */}
        {/* ════════════════════════════════════════════════════════════════════ */}

        <section aria-label="Today's Operation">
          <ZoneHeader label={config.zoneBLabel} description={config.zoneBDescription} />

          {/* Stat row — only render stats listed in config.statCards */}
          <div className={cn(
            "grid gap-3 mt-3",
            config.statCards.length >= 6 ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6" :
            config.statCards.length === 3 ? "grid-cols-2 sm:grid-cols-3" :
            config.statCards.length === 2 ? "grid-cols-2" :
            "grid-cols-2 sm:grid-cols-3",
          )}>
            {isLoading ? (
              Array.from({ length: config.statCards.length || 3 }).map((_, i) => <StatSkeleton key={i} />)
            ) : (
              <>
                {config.statCards.includes("onShift") && (
                  <StatCard label="On Shift" value={d?.staffing.on_shift ?? 0} icon={Users}
                    color="text-emerald-600" bgColor="bg-emerald-50"
                    subtitle={(d?.staffing.open_shifts ?? 0) > 0 ? `${d!.staffing.open_shifts} gaps` : "Full coverage"}
                    href="/rota" />
                )}
                {config.statCards.includes("tasksDueToday") && (
                  <StatCard label="Tasks Due Today" value={d?.tasks.due_today ?? 0} icon={CalendarDays}
                    color="text-blue-600" bgColor="bg-blue-50"
                    subtitle={config.personalTasksOnly ? "Assigned to you" : `${d?.tasks.my_tasks ?? 0} assigned to me`}
                    href="/tasks" />
                )}
                {config.statCards.includes("medication") && (
                  <StatCard label="Medication Today" value={d?.medication.scheduled_today ?? 0} icon={Pill}
                    color="text-teal-600" bgColor="bg-teal-50"
                    subtitle={(d?.medication.missed_today ?? 0) > 0 ? `${d!.medication.missed_today} missed` : "All given"}
                    href="/medication" pulse={(d?.medication.missed_today ?? 0) > 0} />
                )}
                {config.statCards.includes("incidents") && (
                  <StatCard label="Open Incidents" value={d?.incidents.open ?? 0} icon={Shield}
                    color="text-rose-600" bgColor="bg-rose-50"
                    subtitle={`${d?.incidents.awaiting_oversight ?? 0} need oversight`}
                    href="/incidents" pulse={(d?.incidents.critical ?? 0) > 0} />
                )}
                {config.statCards.includes("missing") && (
                  <StatCard label="Missing" value={d?.safeguarding.missing_active ?? 0} icon={MapPin}
                    color="text-purple-600" bgColor="bg-purple-50"
                    subtitle={`${d?.young_people.missing_episodes_total ?? 0} episodes total`}
                    href="/missing-from-care" pulse={(d?.safeguarding.missing_active ?? 0) > 0} />
                )}
                {config.statCards.includes("training") && (
                  <StatCard label="Training Gaps" value={(d?.compliance.training_expired ?? 0) + (d?.compliance.training_expiring ?? 0)} icon={GraduationCap}
                    color="text-amber-600" bgColor="bg-amber-50"
                    subtitle={`${d?.compliance.training_expired ?? 0} expired`}
                    href="/training" />
                )}
              </>
            )}
          </div>

          {/* Operational detail grid */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">

            {/* Today's Shift */}
            {config.showShiftCard && (
              isLoading ? <CardSkeleton rows={4} /> : (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-[13px]">
                        <Users className="h-4 w-4 text-emerald-500" />
                        On Shift Today
                      </CardTitle>
                      <Link href="/rota" className="text-[11px] text-blue-600 hover:underline">Full rota →</Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {d?.staffing.today_shifts && d.staffing.today_shifts.length > 0 ? (
                      d.staffing.today_shifts.slice(0, 6).map((shift) => (
                        <ShiftRow key={shift.id} shift={shift} />
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-[var(--cs-text-muted)]">No shifts recorded today</div>
                    )}
                    {(d?.staffing.open_shifts ?? 0) > 0 && (
                      <Link href="/rota" className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 hover:bg-amber-100 transition-colors mt-1">
                        <UserX className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-medium text-amber-800">{d!.staffing.open_shifts} open shift{d!.staffing.open_shifts > 1 ? "s" : ""} — assign staff</span>
                        <ChevronRight className="h-3.5 w-3.5 text-amber-500 ml-auto" />
                      </Link>
                    )}
                    {(d?.staffing.on_leave ?? 0) > 0 && (
                      <p className="text-[10px] text-[var(--cs-text-muted)] px-1">{d!.staffing.on_leave} staff on leave today</p>
                    )}
                  </CardContent>
                </Card>
              )
            )}

            {/* Priority Tasks / My Tasks */}
            {config.showTeamTasksCard && (
              isLoading ? <CardSkeleton rows={5} /> : (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-[13px]">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {config.personalTasksOnly ? "My Tasks" : "Priority Tasks"}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {!config.personalTasksOnly && (d?.tasks.awaiting_sign_off ?? 0) > 0 && (
                          <span className="text-[10px] font-medium text-[var(--cs-aria-gold)] bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] rounded-full px-2 py-0.5">
                            {d!.tasks.awaiting_sign_off} sign-off
                          </span>
                        )}
                        <Link href="/tasks" className="text-[11px] text-blue-600 hover:underline">All →</Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {taskQueue.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {taskQueue.slice(0, 6).map((task) => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            onComplete={config.showReadOnlyBanner ? undefined : handleCompleteTask}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-emerald-700">
                          {config.personalTasksOnly ? "No outstanding tasks" : "All clear"}
                        </p>
                        <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                          {config.personalTasksOnly ? "Nothing assigned to you right now" : "No overdue or urgent tasks"}
                        </p>
                      </div>
                    )}
                    {(d?.tasks.completed_today ?? 0) > 0 && (
                      <div className="mt-3 pt-2 border-t border-[var(--cs-border-subtle)] flex items-center gap-2 px-2">
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-[11px] text-[var(--cs-text-muted)]">{d!.tasks.completed_today} completed today</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            )}

            {/* Medication + Intelligence Brief */}
            {(config.showMedicationCard || config.showIntelligenceBrief) && (
              <div className="space-y-4">
                {config.showMedicationCard && <MedicationStatusCard />}
                {config.showIntelligenceBrief && (
                  <>
                    <ManagerIntelligenceBriefingCard />
                    <InspectionReadinessIntelligenceCard />
                    <StaffWellbeingIntelligenceCard />
                    <RiskIntelligenceDashboardCard />
                    <AriaTodayBriefing />
                    <AriaShiftSafety />
                    <AriaRegulatoryPulse />
                    <AriaRecordingQuality />
                    <AriaSupervisionIntelligence />
                    <AriaMedicationIntelligence />
                    <AriaStaffingAdequacy />
                    <AriaTrainingCompliance />
                    <AriaIncidentAnalysis />
                    <AriaDailyIntelligence />
                    <AriaDashboardPanel />
                    <ChildVoiceParticipationCard />
                    <HomeWellbeingIntelligenceCard />
                    <HomeActivityEnrichmentIntelligenceCard />
                    <HomeNightSafetyIntelligenceCard />
                    <HomeRegulatoryComplianceIntelligenceCard />
                    <HomeStaffDevelopmentIntelligenceCard />
                    <HomeIncidentSafetyIntelligenceCard />
                    <HomeChildVoiceIntelligenceCard />
                    <HomeKeyWorkingIntelligenceCard />
                    <HomeEducationAchievementIntelligenceCard />
                    <HomeMissingEpisodesIntelligenceCard />
                    <HomeHealthWellbeingIntelligenceCard />
                    <HomeLACReviewIntelligenceCard />
                    <HomeRiskAssessmentIntelligenceCard />
                    <HomeIndependenceIntelligenceCard />
                    <HomeParticipationIntelligenceCard />
                    <HomeNotifiableEventsIntelligenceCard />
                    <HomeRestrictivePracticeIntelligenceCard />
                    <HomeSupervisionIntelligenceCard />
                    <HomeBehaviourIntelligenceCard />
                    <HomeSafeguardingIntelligenceCard />
                    <HomeReg44IntelligenceCard />
                    <HomeFamilyEngagementIntelligenceCard />
                    <HomeAdmissionIntelligenceCard />
                    <HomeVisitorIntelligenceCard />
                    <HomeEmergencyPreparednessIntelligenceCard />
                    <HomeComplaintsIntelligenceCard />
                    <HomeQualityAssuranceIntelligenceCard />
                    <HomeFinancialWellbeingIntelligenceCard />
                    <HomePolicyComplianceIntelligenceCard />
                    <HomePremisesSafetyIntelligenceCard />
                    <HomeHandoverContinuityIntelligenceCard />
                    <HomeDocumentGovernanceIntelligenceCard />
                    <HomeRecordingQualityIntelligenceCard />
                    <HomeSaferRecruitmentIntelligenceCard />
                    <HomeWorkforcePlanningIntelligenceCard />
                    <HomeChronologyIntelligenceCard />
                    <HomeMeetingGovernanceIntelligenceCard />
                    <HomeKeyworkerIntelligenceCard />
                    <HomePlacementStabilityIntelligenceCard />
                    <HomeOutcomesProgressIntelligenceCard />
                    <HomeRiskLandscapeIntelligenceCard />
                    <HomeTherapeuticClimateIntelligenceCard />
                    <HomeBSPEffectivenessIntelligenceCard />
                    <HomeCompetencyLandscapeIntelligenceCard />
                    <HomeExpenseGovernanceIntelligenceCard />
                    <HomeShiftPatternIntelligenceCard />
                    <HomeLeaveAbsenceIntelligenceCard />
                    <HomeStaffWellbeingIntelligenceCard />
                    <HomePeerDynamicsIntelligenceCard />
                    <HomeOnCallGovernanceIntelligenceCard />
                    <HomeTransitionPlanningIntelligenceCard />
                    <HomeDelegatedAuthorityIntelligenceCard />
                    <HomeFireSafetyIntelligenceCard />
                    <HomeSleepQualityIntelligenceCard />
                    <HomeMedicationManagementIntelligenceCard />
                    <HomeExploitationScreeningIntelligenceCard />
                    <HomeDailyLogIntelligenceCard />
                    <HomeDigitalSafetyIntelligenceCard />
                    <HomeMentalHealthIntelligenceCard />
                    <HomeOrganizationalLearningIntelligenceCard />
                    <HomeStaffSafetyIntelligenceCard />
                    <HomeMultiAgencyIntelligenceCard />
                    <HomeDataGovernanceIntelligenceCard />
                    <HomeNutritionCateringIntelligenceCard />
                    <HomeHealthMonitoringIntelligenceCard />
                    <HomeMedicationGovernanceIntelligenceCard />
                    <IntelligenceBriefWidget />
                  </>
                )}
              </div>
            )}

          </div>

          {/* Live Activity Feed + Document Sign-Off — below the operational grid */}
          {!config.showReadOnlyBanner && (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-6">
              <ActivityFeed limit={10} />
              <DocumentSignOff />
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ZONE C — ASSURANCE & PATTERNS (manager/RI-level only)               */}
        {/* ════════════════════════════════════════════════════════════════════ */}

        {config.showZoneC && (
          <section aria-label="Assurance and Patterns">
            <ZoneHeader
              label="C  ·  Assurance & patterns"
              description="Manager and RI-level oversight — health scores, compliance, and oversight queue"
            />

            {/* RI Callout */}
            {config.showRICallout && (
              <div className="mt-3 mb-4 flex items-center gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                  <Target className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-indigo-900">RI Governance View</p>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    You are viewing as the Responsible Individual. Visit the RI Command Centre for Reg 44 visit management, multi-home oversight, and governance reporting.
                  </p>
                </div>
                <Link
                  href="/ri"
                  className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[var(--cs-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--cs-navy)]/90 transition-colors whitespace-nowrap"
                >
                  RI Centre <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3 mt-3">

              {/* Home Health Check */}
              {config.showHealthCheck && (
                healthCheck.isLoading ? <CardSkeleton rows={4} /> : hc ? (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-[13px]">
                          <Activity className="h-4 w-4 text-emerald-500" />
                          Home Health Check
                        </CardTitle>
                        <Badge className={cn("text-[10px] rounded-full border", RISK_LEVEL_CONFIG[hc.risk_level]?.color || "bg-slate-100 text-[var(--cs-text-secondary)]")}>
                          {RISK_LEVEL_CONFIG[hc.risk_level]?.label || hc.risk_level}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <ScoreGauge score={hc.overall} size={76} />
                        <div className="flex-1 space-y-2 min-w-0">
                          <SubScoreBar label="Safeguarding" value={hc.safeguarding} icon={Shield} />
                          <SubScoreBar label="Medication"   value={hc.medication}   icon={Pill} />
                          <SubScoreBar label="Staffing"     value={hc.staffing}     icon={Users} />
                          <SubScoreBar label="Compliance"   value={hc.compliance}   icon={GraduationCap} />
                        </div>
                      </div>
                      {hc.action_plan && hc.action_plan.length > 0 && (
                        <div className="space-y-1.5 pt-3 border-t border-[var(--cs-border-subtle)]">
                          <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">Priority actions</p>
                          {hc.action_plan.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2">
                              <span className={cn("text-xs font-bold shrink-0 tabular-nums", PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] || "text-[var(--cs-text-muted)]")}>{i + 1}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-[var(--cs-navy)] truncate">{item.issue}</p>
                                <p className="text-[10px] text-[var(--cs-text-muted)]">{item.area} · {formatRelative(item.due)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null
              )}

              {/* Oversight Queue */}
              {config.showOversightQueue && (
                isLoading ? <CardSkeleton rows={4} /> : (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-[13px]">
                          <Eye className="h-4 w-4 text-[var(--cs-aria-gold)]" />
                          Oversight Queue
                        </CardTitle>
                        <Link href="/incidents" className="text-[11px] text-blue-600 hover:underline">All incidents →</Link>
                      </div>
                      {(d?.incidents.awaiting_oversight ?? 0) > 0 && (
                        <p className="text-[11px] text-[var(--cs-aria-gold)] font-medium mt-1">
                          {d!.incidents.awaiting_oversight} awaiting your oversight
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      {d?.incidents.oversight_queue && d.incidents.oversight_queue.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {d.incidents.oversight_queue.map((inc) => (
                            <OversightRow key={inc.id} incident={inc} onAddOversight={handleAddOversight} />
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-emerald-700">All incidents overseen</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              )}

              {/* Compliance + Environment + Time Saved column */}
              {(config.showComplianceCard || config.showEnvironmentCard || config.showTimeSaved) && (
                <div className="space-y-4">
                  {config.showComplianceCard && (
                    isLoading ? <CardSkeleton rows={2} /> : (
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-[13px]">
                              <GraduationCap className="h-4 w-4 text-amber-500" />
                              Staff Compliance
                            </CardTitle>
                            <Link href="/training" className="text-[11px] text-blue-600 hover:underline">Training →</Link>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl bg-red-50 p-2.5">
                              <p className="text-xl font-bold text-red-600 tabular-nums">{d?.compliance.training_expired ?? 0}</p>
                              <p className="text-[10px] text-red-500">Expired</p>
                            </div>
                            <div className="rounded-xl bg-amber-50 p-2.5">
                              <p className="text-xl font-bold text-amber-600 tabular-nums">{d?.compliance.training_expiring ?? 0}</p>
                              <p className="text-[10px] text-amber-500">Expiring</p>
                            </div>
                            <div className="rounded-xl bg-blue-50 p-2.5">
                              <p className="text-xl font-bold text-blue-600 tabular-nums">{d?.compliance.cert_warnings ?? 0}</p>
                              <p className="text-[10px] text-blue-500">Warnings</p>
                            </div>
                          </div>
                          {(d?.compliance.cert_warnings_list?.length ?? 0) > 0 && (
                            <div className="mt-3 space-y-1">
                              {d!.compliance.cert_warnings_list.slice(0, 3).map((w, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px] text-[var(--cs-text-secondary)]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                                  <span className="truncate">{w}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  )}

                  {config.showEnvironmentCard && (
                    isLoading ? <CardSkeleton rows={2} /> : (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-[13px]">
                            <Building2 className="h-4 w-4 text-[var(--cs-text-muted)]" />
                            Environment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          {[
                            { icon: Building2, label: "Building checks", overdue: d?.environment.building_checks_overdue ?? 0, due: d?.environment.building_checks_due ?? 0, href: "/buildings" },
                            { icon: Car,       label: "Vehicles",        overdue: d?.environment.vehicle_defects ?? 0,          due: d?.environment.vehicles_restricted ?? 0,  href: "/vehicles" },
                          ].map(({ icon: Icon, label, overdue, due, href }) => (
                            <Link key={label} href={href} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 hover:bg-[var(--cs-surface)] transition-colors">
                              <div className="flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                                <span className="text-xs text-[var(--cs-text-secondary)]">{label}</span>
                              </div>
                              <span className={cn("text-[10px] font-medium", overdue > 0 ? "text-red-600" : due > 0 ? "text-amber-600" : "text-emerald-600")}>
                                {overdue > 0 ? `${overdue} overdue` : due > 0 ? `${due} due` : "All clear"}
                              </span>
                            </Link>
                          ))}
                        </CardContent>
                      </Card>
                    )
                  )}

                  {config.showTimeSaved && ts && <TimeSavedWidget formatted={ts} />}
                  <LeaveOverview />
                  <NightSummary />
                  <ShiftChecklist />
                  <OutcomesSummary />
                  <RiAlertsSummary />
                  <GovernanceScore />
                  <TasksSummaryCard />
                  <CarePlanComplianceCard />
                  <YoungPeopleRiskCard />
                  <DailyLogSummaryCard />
                  <DocumentComplianceCard />
                  <SupervisionComplianceCard />
                  <WelfareChecksCard />
                  <MissingFromCareCard />
                  <ComplaintsSummaryCard />
                  <FamilyContactCard />
                  <StaffingCoverageCard />
                  <IncidentTrendsCard />
                  <EnvironmentStatusCard />
                  <RecruitmentPipelineCard />
                  <OutcomesProgressCard />
                  <MaintenanceSummaryCard />
                  <AuditComplianceCard />
                  <ExpensesSummaryCard />
                  <FormComplianceCard />
                </div>
              )}

            </div>

            {/* Supervision + Training + Key Dates row */}
            {(config.showOversightQueue || config.showComplianceCard) && (
              <div className="grid gap-6 lg:grid-cols-3 mt-6">
                <SupervisionTracker />
                <TrainingComplianceCard />
                <KeyDatesCard limit={8} />
              </div>
            )}
          </section>
        )}

        {/* Aria anchor for oversight scroll target */}
        <div id="aria-anchor" />

      </div>

      {/* Quick Actions Speed Dial — floating bottom-right */}
      {!config.showReadOnlyBanner && <QuickActionsDial />}
      <CareEventsPanel
        title="Recent Care Events"
        category="general"
        days={14}
        defaultCollapsed
      />
    </PageShell>
  );
}
