"use client";

import { useHomeName } from "@/hooks/use-home-profile";
import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { TaskSlaCard } from "@/components/dashboard/task-sla-card";
import { CommandCentreHero } from "@/components/dashboard/command-centre-hero";
import { TodayBand } from "@/components/dashboard/today-band";

// ── Dynamic imports — loaded on demand to prevent browser memory crash ────────


const IntelligenceBriefWidget = dynamic(() => import("@/components/intelligence/intelligence-brief-widget").then(m => ({ default: m.IntelligenceBriefWidget })), { ssr: false });
const ManagerIntelligenceBriefingCard = dynamic(() => import("@/components/dashboard/manager-intelligence-briefing-card").then(m => ({ default: m.ManagerIntelligenceBriefingCard })), { ssr: false });
const ManagerPriorityBriefingCard = dynamic(() => import("@/components/dashboard/manager-priority-briefing-card").then(m => ({ default: m.ManagerPriorityBriefingCard })), { ssr: false });
const HomeSummaryReportCard = dynamic(() => import("@/components/dashboard/home-summary-report-card").then(m => ({ default: m.HomeSummaryReportCard })), { ssr: false });
const ChildReviewPackCard = dynamic(() => import("@/components/dashboard/child-review-pack-card").then(m => ({ default: m.ChildReviewPackCard })), { ssr: false });
const HomeTrendsCard = dynamic(() => import("@/components/dashboard/home-trends-card").then(m => ({ default: m.HomeTrendsCard })), { ssr: false });
const UpcomingWeekCard = dynamic(() => import("@/components/dashboard/upcoming-week-card").then(m => ({ default: m.UpcomingWeekCard })), { ssr: false });
const PlanTodayCard = dynamic(() => import("@/components/dashboard/plan-today-card").then(m => ({ default: m.PlanTodayCard })), { ssr: false });
const ActionsRegisterCard = dynamic(() => import("@/components/dashboard/actions-register-card").then(m => ({ default: m.ActionsRegisterCard })), { ssr: false });
const ComplaintsClockCard = dynamic(() => import("@/components/dashboard/complaints-clock-card").then(m => ({ default: m.ComplaintsClockCard })), { ssr: false });
const PlanCurrencyCard = dynamic(() => import("@/components/dashboard/plan-currency-card").then(m => ({ default: m.PlanCurrencyCard })), { ssr: false });
const ShiftBriefingCard = dynamic(() => import("@/components/dashboard/shift-briefing-card").then(m => ({ default: m.ShiftBriefingCard })), { ssr: false });
const PremisesComplianceCard = dynamic(() => import("@/components/dashboard/premises-compliance-card").then(m => ({ default: m.PremisesComplianceCard })), { ssr: false });
const InspectionReadinessIntelligenceCard = dynamic(() => import("@/components/dashboard/inspection-readiness-intelligence-card").then(m => ({ default: m.InspectionReadinessIntelligenceCard })), { ssr: false });
const StaffWellbeingIntelligenceCard = dynamic(() => import("@/components/dashboard/staff-wellbeing-intelligence-card").then(m => ({ default: m.StaffWellbeingIntelligenceCard })), { ssr: false });
const RiskIntelligenceDashboardCard = dynamic(() => import("@/components/dashboard/risk-intelligence-dashboard-card").then(m => ({ default: m.RiskIntelligenceDashboardCard })), { ssr: false });
const ManagerPracticeOversightCard = dynamic(() => import("@/components/dashboard/manager-practice-oversight-card").then(m => ({ default: m.ManagerPracticeOversightCard })), { ssr: false });
const CaraDashboardPanel = dynamic(() => import("@/components/dashboard/cara-dashboard-panel").then(m => ({ default: m.CaraDashboardPanel })), { ssr: false });
const CaraDailyIntelligence = dynamic(() => import("@/components/cara/cara-daily-intelligence").then(m => ({ default: m.CaraDailyIntelligence })), { ssr: false });
const CaraTodayBriefing = dynamic(() => import("@/components/cara/cara-today-briefing").then(m => ({ default: m.CaraTodayBriefing })), { ssr: false });
const CaraRegulatoryPulse = dynamic(() => import("@/components/cara/cara-regulatory-pulse").then(m => ({ default: m.CaraRegulatoryPulse })), { ssr: false });
const CaraRecordingQuality = dynamic(() => import("@/components/cara/cara-recording-quality").then(m => ({ default: m.CaraRecordingQuality })), { ssr: false });
const CaraShiftSafety = dynamic(() => import("@/components/cara/cara-shift-safety").then(m => ({ default: m.CaraShiftSafety })), { ssr: false });
const CaraSupervisionIntelligence = dynamic(() => import("@/components/cara/cara-supervision-intelligence").then(m => ({ default: m.CaraSupervisionIntelligence })), { ssr: false });
const CaraMedicationIntelligence = dynamic(() => import("@/components/cara/cara-medication-intelligence"), { ssr: false });
const CaraStaffingAdequacy = dynamic(() => import("@/components/cara/cara-staffing-adequacy"), { ssr: false });
const CaraTrainingCompliance = dynamic(() => import("@/components/cara/cara-training-compliance"), { ssr: false });
const CaraIncidentAnalysis = dynamic(() => import("@/components/cara/cara-incident-analysis"), { ssr: false });

const ActivityFeed = dynamic(() => import("@/components/dashboard/activity-feed").then(m => ({ default: m.ActivityFeed })), { ssr: false });
const YoungPeopleStrip = dynamic(() => import("@/components/dashboard/young-people-strip").then(m => ({ default: m.YoungPeopleStrip })), { ssr: false });
const QuickActionsDial = dynamic(() => import("@/components/dashboard/quick-actions-dial").then(m => ({ default: m.QuickActionsDial })), { ssr: false });
const HandoverPrompt = dynamic(() => import("@/components/dashboard/handover-prompt").then(m => ({ default: m.HandoverPrompt })), { ssr: false });
const SupervisionTracker = dynamic(() => import("@/components/dashboard/supervision-tracker").then(m => ({ default: m.SupervisionTracker })), { ssr: false });
const KeyDatesCard = dynamic(() => import("@/components/dashboard/key-dates-card").then(m => ({ default: m.KeyDatesCard })), { ssr: false });
const DocumentSignOff = dynamic(() => import("@/components/dashboard/document-sign-off").then(m => ({ default: m.DocumentSignOff })), { ssr: false });
const LeaveOverview = dynamic(() => import("@/components/dashboard/leave-overview").then(m => ({ default: m.LeaveOverview })), { ssr: false });
const NightSummary = dynamic(() => import("@/components/dashboard/night-summary").then(m => ({ default: m.NightSummary })), { ssr: false });
const YourHandoverCard = dynamic(() => import("@/components/dashboard/your-handover-card").then(m => ({ default: m.YourHandoverCard })), { ssr: false });
const ConcernEscalation = dynamic(() => import("@/components/dashboard/concern-escalation").then(m => ({ default: m.ConcernEscalation })), { ssr: false });
const ShiftChecklist = dynamic(() => import("@/components/dashboard/shift-checklist").then(m => ({ default: m.ShiftChecklist })), { ssr: false });
const OutcomesSummary = dynamic(() => import("@/components/dashboard/outcomes-summary").then(m => ({ default: m.OutcomesSummary })), { ssr: false });
const RiAlertsSummary = dynamic(() => import("@/components/dashboard/ri-alerts-summary").then(m => ({ default: m.RiAlertsSummary })), { ssr: false });
const GovernanceScore = dynamic(() => import("@/components/dashboard/governance-score").then(m => ({ default: m.GovernanceScore })), { ssr: false });
const TrainingComplianceCard = dynamic(() => import("@/components/dashboard/training-compliance-card").then(m => ({ default: m.TrainingComplianceCard })), { ssr: false });
const MedicationStatusCard = dynamic(() => import("@/components/dashboard/medication-status-card").then(m => ({ default: m.MedicationStatusCard })), { ssr: false });
const RecruitmentPipelineCard = dynamic(() => import("@/components/dashboard/recruitment-pipeline-card").then(m => ({ default: m.RecruitmentPipelineCard })), { ssr: false });
const YoungPeopleRiskCard = dynamic(() => import("@/components/dashboard/young-people-risk-card").then(m => ({ default: m.YoungPeopleRiskCard })), { ssr: false });
const DailyLogSummaryCard = dynamic(() => import("@/components/dashboard/daily-log-summary-card").then(m => ({ default: m.DailyLogSummaryCard })), { ssr: false });
const StaffingCoverageCard = dynamic(() => import("@/components/dashboard/staffing-coverage-card").then(m => ({ default: m.StaffingCoverageCard })), { ssr: false });
const WorkforceSummaryCard = dynamic(() => import("@/components/dashboard/workforce-summary-card").then(m => ({ default: m.WorkforceSummaryCard })), { ssr: false });
const IncidentTrendsCard = dynamic(() => import("@/components/dashboard/incident-trends-card").then(m => ({ default: m.IncidentTrendsCard })), { ssr: false });
const EnvironmentStatusCard = dynamic(() => import("@/components/dashboard/environment-status-card").then(m => ({ default: m.EnvironmentStatusCard })), { ssr: false });
const TasksSummaryCard = dynamic(() => import("@/components/dashboard/tasks-summary-card").then(m => ({ default: m.TasksSummaryCard })), { ssr: false });
const CarePlanComplianceCard = dynamic(() => import("@/components/dashboard/care-plan-compliance-card").then(m => ({ default: m.CarePlanComplianceCard })), { ssr: false });
const DocumentComplianceCard = dynamic(() => import("@/components/dashboard/document-compliance-card").then(m => ({ default: m.DocumentComplianceCard })), { ssr: false });
const SupervisionComplianceCard = dynamic(() => import("@/components/dashboard/supervision-compliance-card").then(m => ({ default: m.SupervisionComplianceCard })), { ssr: false });
const ComplaintsSummaryCard = dynamic(() => import("@/components/dashboard/complaints-summary-card").then(m => ({ default: m.ComplaintsSummaryCard })), { ssr: false });
const WelfareChecksCard = dynamic(() => import("@/components/dashboard/welfare-checks-card").then(m => ({ default: m.WelfareChecksCard })), { ssr: false });
const MissingFromCareCard = dynamic(() => import("@/components/dashboard/missing-from-care-card").then(m => ({ default: m.MissingFromCareCard })), { ssr: false });
const FamilyContactCard = dynamic(() => import("@/components/dashboard/family-contact-card").then(m => ({ default: m.FamilyContactCard })), { ssr: false });
const OutcomesProgressCard = dynamic(() => import("@/components/dashboard/outcomes-progress-card").then(m => ({ default: m.OutcomesProgressCard })), { ssr: false });
const MaintenanceSummaryCard = dynamic(() => import("@/components/dashboard/maintenance-summary-card").then(m => ({ default: m.MaintenanceSummaryCard })), { ssr: false });
const AuditComplianceCard = dynamic(() => import("@/components/dashboard/audit-compliance-card").then(m => ({ default: m.AuditComplianceCard })), { ssr: false });
const ExpensesSummaryCard = dynamic(() => import("@/components/dashboard/expenses-summary-card").then(m => ({ default: m.ExpensesSummaryCard })), { ssr: false });
const FormComplianceCard = dynamic(() => import("@/components/dashboard/form-compliance-card").then(m => ({ default: m.FormComplianceCard })), { ssr: false });
const CareEventsPanel = dynamic(() => import("@/components/care-events/care-events-panel").then(m => ({ default: m.CareEventsPanel })), { ssr: false });
const ChildVoiceParticipationCard = dynamic(() => import("@/components/dashboard/child-voice-participation-card").then(m => ({ default: m.ChildVoiceParticipationCard })), { ssr: false });
const HomeWellbeingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-wellbeing-intelligence-card").then(m => ({ default: m.HomeWellbeingIntelligenceCard })), { ssr: false });
const HomeActivityEnrichmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-activity-enrichment-intelligence-card").then(m => ({ default: m.HomeActivityEnrichmentIntelligenceCard })), { ssr: false });
const HomeNightSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-night-safety-intelligence-card").then(m => ({ default: m.HomeNightSafetyIntelligenceCard })), { ssr: false });
const HomeRegulatoryComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-regulatory-compliance-intelligence-card").then(m => ({ default: m.HomeRegulatoryComplianceIntelligenceCard })), { ssr: false });
const HomeStaffDevelopmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-development-intelligence-card").then(m => ({ default: m.HomeStaffDevelopmentIntelligenceCard })), { ssr: false });
const HomeIncidentSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-incident-safety-intelligence-card").then(m => ({ default: m.HomeIncidentSafetyIntelligenceCard })), { ssr: false });
const HomeChildVoiceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-child-voice-intelligence-card").then(m => ({ default: m.HomeChildVoiceIntelligenceCard })), { ssr: false });
const HomeKeyWorkingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-key-working-intelligence-card").then(m => ({ default: m.HomeKeyWorkingIntelligenceCard })), { ssr: false });
const HomeEducationAchievementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-education-achievement-intelligence-card").then(m => ({ default: m.HomeEducationAchievementIntelligenceCard })), { ssr: false });
const HomeMissingEpisodesIntelligenceCard = dynamic(() => import("@/components/dashboard/home-missing-episodes-intelligence-card").then(m => ({ default: m.HomeMissingEpisodesIntelligenceCard })), { ssr: false });
const HomeHealthWellbeingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-health-wellbeing-intelligence-card").then(m => ({ default: m.HomeHealthWellbeingIntelligenceCard })), { ssr: false });
const HomeLACReviewIntelligenceCard = dynamic(() => import("@/components/dashboard/home-lac-review-intelligence-card").then(m => ({ default: m.HomeLACReviewIntelligenceCard })), { ssr: false });
const HomeRiskAssessmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-risk-assessment-intelligence-card").then(m => ({ default: m.HomeRiskAssessmentIntelligenceCard })), { ssr: false });
const ManagerInboxCard = dynamic(() => import("@/components/dashboard/manager-inbox-card").then(m => ({ default: m.ManagerInboxCard })), { ssr: false });
const EvidenceBankCard = dynamic(() => import("@/components/dashboard/evidence-bank-card").then(m => ({ default: m.EvidenceBankCard })), { ssr: false });
const ComplianceRulesCard = dynamic(() => import("@/components/dashboard/compliance-rules-card").then(m => ({ default: m.ComplianceRulesCard })), { ssr: false });
const DuplicateDetectionCard = dynamic(() => import("@/components/dashboard/duplicate-detection-card").then(m => ({ default: m.DuplicateDetectionCard })), { ssr: false });
const ConflictDetectionCard = dynamic(() => import("@/components/dashboard/conflict-detection-card").then(m => ({ default: m.ConflictDetectionCard })), { ssr: false });
const IntegrationHubCard = dynamic(() => import("@/components/dashboard/integration-hub-card").then(m => ({ default: m.IntegrationHubCard })), { ssr: false });
const EventCaptureCard = dynamic(() => import("@/components/dashboard/event-capture-card").then(m => ({ default: m.EventCaptureCard })), { ssr: false });
const WorkflowOrchestrationCard = dynamic(() => import("@/components/dashboard/workflow-orchestration-card").then(m => ({ default: m.WorkflowOrchestrationCard })), { ssr: false });
const EventStreamCard = dynamic(() => import("@/components/dashboard/event-stream-card").then(m => ({ default: m.EventStreamCard })), { ssr: false });
const EventIntelligenceCard = dynamic(() => import("@/components/dashboard/event-intelligence-card").then(m => ({ default: m.EventIntelligenceCard })), { ssr: false });
const EventRoutingCard = dynamic(() => import("@/components/dashboard/event-routing-card").then(m => ({ default: m.EventRoutingCard })), { ssr: false });
const RecordingQualityScoreCard = dynamic(() => import("@/components/dashboard/recording-quality-score-card").then(m => ({ default: m.RecordingQualityScoreCard })), { ssr: false });
const StaffRecordingPracticeCard = dynamic(() => import("@/components/dashboard/staff-recording-practice-card").then(m => ({ default: m.StaffRecordingPracticeCard })), { ssr: false });
const RecordingQualityTrendCard = dynamic(() => import("@/components/dashboard/recording-quality-trend-card").then(m => ({ default: m.RecordingQualityTrendCard })), { ssr: false });
const ChildPriorityCard = dynamic(() => import("@/components/dashboard/child-priority-card").then(m => ({ default: m.ChildPriorityCard })), { ssr: false });
const PlacementBreakdownForecastCard = dynamic(() => import("@/components/dashboard/placement-breakdown-forecast-card").then(m => ({ default: m.PlacementBreakdownForecastCard })), { ssr: false });
const MedicationErrorTrendsCard = dynamic(() => import("@/components/dashboard/medication-error-trends-card").then(m => ({ default: m.MedicationErrorTrendsCard })), { ssr: false });
const ComplaintsIncidentCorrelationCard = dynamic(() => import("@/components/dashboard/complaints-incident-correlation-card").then(m => ({ default: m.ComplaintsIncidentCorrelationCard })), { ssr: false });
const StaffChildContinuityCard = dynamic(() => import("@/components/dashboard/staff-child-continuity-card").then(m => ({ default: m.StaffChildContinuityCard })), { ssr: false });
const BehaviourTriggerPatternsCard = dynamic(() => import("@/components/dashboard/behaviour-trigger-patterns-card").then(m => ({ default: m.BehaviourTriggerPatternsCard })), { ssr: false });
const HomeIndependenceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-independence-intelligence-card").then(m => ({ default: m.HomeIndependenceIntelligenceCard })), { ssr: false });
const HomeParticipationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-participation-intelligence-card").then(m => ({ default: m.HomeParticipationIntelligenceCard })), { ssr: false });
const HomeNotifiableEventsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-notifiable-events-intelligence-card").then(m => ({ default: m.HomeNotifiableEventsIntelligenceCard })), { ssr: false });
const HomeRestrictivePracticeIntelligenceCard = dynamic(() => import("@/components/dashboard/home-restrictive-practice-intelligence-card").then(m => ({ default: m.HomeRestrictivePracticeIntelligenceCard })), { ssr: false });
const HomeSupervisionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-supervision-intelligence-card").then(m => ({ default: m.HomeSupervisionIntelligenceCard })), { ssr: false });
const HomeBehaviourIntelligenceCard = dynamic(() => import("@/components/dashboard/home-behaviour-intelligence-card").then(m => ({ default: m.HomeBehaviourIntelligenceCard })), { ssr: false });
const HomeSafeguardingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-safeguarding-intelligence-card").then(m => ({ default: m.HomeSafeguardingIntelligenceCard })), { ssr: false });
const HomeReg44IntelligenceCard = dynamic(() => import("@/components/dashboard/home-reg44-intelligence-card").then(m => ({ default: m.HomeReg44IntelligenceCard })), { ssr: false });
const HomeFamilyEngagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-family-engagement-intelligence-card").then(m => ({ default: m.HomeFamilyEngagementIntelligenceCard })), { ssr: false });
const HomeAdmissionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-admission-intelligence-card").then(m => ({ default: m.HomeAdmissionIntelligenceCard })), { ssr: false });
const HomeVisitorIntelligenceCard = dynamic(() => import("@/components/dashboard/home-visitor-intelligence-card").then(m => ({ default: m.HomeVisitorIntelligenceCard })), { ssr: false });
const HomeEmergencyPreparednessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-emergency-preparedness-intelligence-card").then(m => ({ default: m.HomeEmergencyPreparednessIntelligenceCard })), { ssr: false });
const HomeComplaintsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-complaints-intelligence-card").then(m => ({ default: m.HomeComplaintsIntelligenceCard })), { ssr: false });
const HomeQualityAssuranceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-quality-assurance-intelligence-card").then(m => ({ default: m.HomeQualityAssuranceIntelligenceCard })), { ssr: false });
const HomeFinancialWellbeingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-financial-wellbeing-intelligence-card").then(m => ({ default: m.HomeFinancialWellbeingIntelligenceCard })), { ssr: false });
const HomePolicyComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-policy-compliance-intelligence-card").then(m => ({ default: m.HomePolicyComplianceIntelligenceCard })), { ssr: false });
const HomePremisesSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-premises-safety-intelligence-card").then(m => ({ default: m.HomePremisesSafetyIntelligenceCard })), { ssr: false });
const HomeHandoverContinuityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-handover-continuity-intelligence-card").then(m => ({ default: m.HomeHandoverContinuityIntelligenceCard })), { ssr: false });
const HomeDocumentGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-document-governance-intelligence-card").then(m => ({ default: m.HomeDocumentGovernanceIntelligenceCard })), { ssr: false });
const HomeRecordingQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-recording-quality-intelligence-card").then(m => ({ default: m.HomeRecordingQualityIntelligenceCard })), { ssr: false });
const HomeSaferRecruitmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-safer-recruitment-intelligence-card").then(m => ({ default: m.HomeSaferRecruitmentIntelligenceCard })), { ssr: false });
const HomeWorkforcePlanningIntelligenceCard = dynamic(() => import("@/components/dashboard/home-workforce-planning-intelligence-card").then(m => ({ default: m.HomeWorkforcePlanningIntelligenceCard })), { ssr: false });
const HomeChronologyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-chronology-intelligence-card").then(m => ({ default: m.HomeChronologyIntelligenceCard })), { ssr: false });
const HomeMeetingGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-meeting-governance-intelligence-card").then(m => ({ default: m.HomeMeetingGovernanceIntelligenceCard })), { ssr: false });
const HomeKeyworkerIntelligenceCard = dynamic(() => import("@/components/dashboard/home-keyworker-intelligence-card").then(m => ({ default: m.HomeKeyworkerIntelligenceCard })), { ssr: false });
const HomePlacementStabilityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-placement-stability-intelligence-card").then(m => ({ default: m.HomePlacementStabilityIntelligenceCard })), { ssr: false });
const HomeOutcomesProgressIntelligenceCard = dynamic(() => import("@/components/dashboard/home-outcomes-progress-intelligence-card").then(m => ({ default: m.HomeOutcomesProgressIntelligenceCard })), { ssr: false });
const HomeRiskLandscapeIntelligenceCard = dynamic(() => import("@/components/dashboard/home-risk-landscape-intelligence-card").then(m => ({ default: m.HomeRiskLandscapeIntelligenceCard })), { ssr: false });
const HomeTherapeuticClimateIntelligenceCard = dynamic(() => import("@/components/dashboard/home-therapeutic-climate-intelligence-card").then(m => ({ default: m.HomeTherapeuticClimateIntelligenceCard })), { ssr: false });
const HomeBSPEffectivenessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-bsp-effectiveness-intelligence-card").then(m => ({ default: m.HomeBSPEffectivenessIntelligenceCard })), { ssr: false });
const HomeCompetencyLandscapeIntelligenceCard = dynamic(() => import("@/components/dashboard/home-competency-landscape-intelligence-card").then(m => ({ default: m.HomeCompetencyLandscapeIntelligenceCard })), { ssr: false });
const HomeExpenseGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-expense-governance-intelligence-card").then(m => ({ default: m.HomeExpenseGovernanceIntelligenceCard })), { ssr: false });
const HomeShiftPatternIntelligenceCard = dynamic(() => import("@/components/dashboard/home-shift-pattern-intelligence-card").then(m => ({ default: m.HomeShiftPatternIntelligenceCard })), { ssr: false });
const HomeLeaveAbsenceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-leave-absence-intelligence-card").then(m => ({ default: m.HomeLeaveAbsenceIntelligenceCard })), { ssr: false });
const HomeStaffWellbeingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-wellbeing-intelligence-card").then(m => ({ default: m.HomeStaffWellbeingIntelligenceCard })), { ssr: false });
const HomePeerDynamicsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-peer-dynamics-intelligence-card").then(m => ({ default: m.HomePeerDynamicsIntelligenceCard })), { ssr: false });
const HomeOnCallGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-on-call-governance-intelligence-card").then(m => ({ default: m.HomeOnCallGovernanceIntelligenceCard })), { ssr: false });
const HomeTransitionPlanningIntelligenceCard = dynamic(() => import("@/components/dashboard/home-transition-planning-intelligence-card").then(m => ({ default: m.HomeTransitionPlanningIntelligenceCard })), { ssr: false });
const HomeDelegatedAuthorityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-delegated-authority-intelligence-card").then(m => ({ default: m.HomeDelegatedAuthorityIntelligenceCard })), { ssr: false });
const HomeFireSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-fire-safety-intelligence-card").then(m => ({ default: m.HomeFireSafetyIntelligenceCard })), { ssr: false });
const HomeSleepQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-sleep-quality-intelligence-card").then(m => ({ default: m.HomeSleepQualityIntelligenceCard })), { ssr: false });
const HomeMedicationManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-medication-management-intelligence-card").then(m => ({ default: m.HomeMedicationManagementIntelligenceCard })), { ssr: false });
const HomeExploitationScreeningIntelligenceCard = dynamic(() => import("@/components/dashboard/home-exploitation-screening-intelligence-card").then(m => ({ default: m.HomeExploitationScreeningIntelligenceCard })), { ssr: false });
const HomeDailyLogIntelligenceCard = dynamic(() => import("@/components/dashboard/home-daily-log-intelligence-card").then(m => ({ default: m.HomeDailyLogIntelligenceCard })), { ssr: false });
const HomeDigitalSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-digital-safety-intelligence-card").then(m => ({ default: m.HomeDigitalSafetyIntelligenceCard })), { ssr: false });
const HomeMentalHealthIntelligenceCard = dynamic(() => import("@/components/dashboard/home-mental-health-intelligence-card").then(m => ({ default: m.HomeMentalHealthIntelligenceCard })), { ssr: false });
const HomeStaffSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-safety-intelligence-card").then(m => ({ default: m.HomeStaffSafetyIntelligenceCard })), { ssr: false });
const HomeOrganizationalLearningIntelligenceCard = dynamic(() => import("@/components/dashboard/home-organizational-learning-intelligence-card").then(m => ({ default: m.HomeOrganizationalLearningIntelligenceCard })), { ssr: false });
const HomeMultiAgencyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-multi-agency-intelligence-card").then(m => ({ default: m.HomeMultiAgencyIntelligenceCard })), { ssr: false });
const HomeDataGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-data-governance-intelligence-card").then(m => ({ default: m.HomeDataGovernanceIntelligenceCard })), { ssr: false });
const HomeNutritionCateringIntelligenceCard = dynamic(() => import("@/components/dashboard/home-nutrition-catering-intelligence-card").then(m => ({ default: m.HomeNutritionCateringIntelligenceCard })), { ssr: false });
const HomeHealthMonitoringIntelligenceCard = dynamic(() => import("@/components/dashboard/home-health-monitoring-intelligence-card").then(m => ({ default: m.HomeHealthMonitoringIntelligenceCard })), { ssr: false });
const HomeMedicationGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-medication-governance-intelligence-card").then(m => ({ default: m.HomeMedicationGovernanceIntelligenceCard })), { ssr: false });
const HomeSpecializedHealthPlansIntelligenceCard = dynamic(() => import("@/components/dashboard/home-specialized-health-plans-intelligence-card").then(m => ({ default: m.HomeSpecializedHealthPlansIntelligenceCard })), { ssr: false });
const HomeEducationEngagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-education-engagement-intelligence-card").then(m => ({ default: m.HomeEducationEngagementIntelligenceCard })), { ssr: false });
const HomeSafeguardingPreventionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-safeguarding-prevention-intelligence-card").then(m => ({ default: m.HomeSafeguardingPreventionIntelligenceCard })), { ssr: false });
const HomeCommunicationContactIntelligenceCard = dynamic(() => import("@/components/dashboard/home-communication-contact-intelligence-card").then(m => ({ default: m.HomeCommunicationContactIntelligenceCard })), { ssr: false });
const HomeStaffLifecycleIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-lifecycle-intelligence-card").then(m => ({ default: m.HomeStaffLifecycleIntelligenceCard })), { ssr: false });
const HomeFacilitiesComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-facilities-compliance-intelligence-card").then(m => ({ default: m.HomeFacilitiesComplianceIntelligenceCard })), { ssr: false });
const HomeTherapeuticProgressIntelligenceCard = dynamic(() => import("@/components/dashboard/home-therapeutic-progress-intelligence-card").then(m => ({ default: m.HomeTherapeuticProgressIntelligenceCard })), { ssr: false });
const HomeChildrensRightsParticipationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-childrens-rights-participation-intelligence-card").then(m => ({ default: m.HomeChildrensRightsParticipationIntelligenceCard })), { ssr: false });
const HomePlacementStabilityDepthIntelligenceCard = dynamic(() => import("@/components/dashboard/home-placement-stability-depth-intelligence-card").then(m => ({ default: m.HomePlacementStabilityDepthIntelligenceCard })), { ssr: false });
const HomeCulturalIdentityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-cultural-identity-intelligence-card").then(m => ({ default: m.HomeCulturalIdentityIntelligenceCard })), { ssr: false });
const HomeIndependenceLifeSkillsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-independence-life-skills-intelligence-card").then(m => ({ default: m.HomeIndependenceLifeSkillsIntelligenceCard })), { ssr: false });
const HomeEnrichmentAchievementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-enrichment-achievement-intelligence-card").then(m => ({ default: m.HomeEnrichmentAchievementIntelligenceCard })), { ssr: false });
const HomeLivingEnvironmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-living-environment-intelligence-card").then(m => ({ default: m.HomeLivingEnvironmentIntelligenceCard })), { ssr: false });
const HomeCommunityAccessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-community-access-intelligence-card").then(m => ({ default: m.HomeCommunityAccessIntelligenceCard })), { ssr: false });
const HomeNightCareSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-night-care-safety-intelligence-card").then(m => ({ default: m.HomeNightCareSafetyIntelligenceCard })), { ssr: false });
const HomeSafeguardingDepthIntelligenceCard = dynamic(() => import("@/components/dashboard/home-safeguarding-depth-intelligence-card").then(m => ({ default: m.HomeSafeguardingDepthIntelligenceCard })), { ssr: false });
const HomeReg4445EvidenceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-reg4445-evidence-intelligence-card").then(m => ({ default: m.HomeReg4445EvidenceIntelligenceCard })), { ssr: false });
const HomePlacementJourneyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-placement-journey-intelligence-card").then(m => ({ default: m.HomePlacementJourneyIntelligenceCard })), { ssr: false });
const HomeLifeStoryIdentityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-life-story-identity-intelligence-card").then(m => ({ default: m.HomeLifeStoryIdentityIntelligenceCard })), { ssr: false });
const HomeStrategicRiskIntelligenceCard = dynamic(() => import("@/components/dashboard/home-strategic-risk-intelligence-card").then(m => ({ default: m.HomeStrategicRiskIntelligenceCard })), { ssr: false });
const HomeBuildingOpsSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-building-ops-safety-intelligence-card").then(m => ({ default: m.HomeBuildingOpsSafetyIntelligenceCard })), { ssr: false });
const HomeOfstedReadinessCompositeCard = dynamic(() => import("@/components/dashboard/home-ofsted-readiness-composite-card").then(m => ({ default: m.HomeOfstedReadinessCompositeCard })), { ssr: false });
const HomeChildWellbeingCompositeCard = dynamic(() => import("@/components/dashboard/home-child-wellbeing-composite-card").then(m => ({ default: m.HomeChildWellbeingCompositeCard })), { ssr: false });
const HomeWorkforceResilienceCompositeCard = dynamic(() => import("@/components/dashboard/home-workforce-resilience-composite-card").then(m => ({ default: m.HomeWorkforceResilienceCompositeCard })), { ssr: false });
const HomeSafeguardingOversightCompositeCard = dynamic(() => import("@/components/dashboard/home-safeguarding-oversight-composite-card").then(m => ({ default: m.HomeSafeguardingOversightCompositeCard })), { ssr: false });
const HomeRegulatoryComplianceCompositeCard = dynamic(() => import("@/components/dashboard/home-regulatory-compliance-composite-card").then(m => ({ default: m.HomeRegulatoryComplianceCompositeCard })), { ssr: false });
const HomeQualityOfCareCompositeCard = dynamic(() => import("@/components/dashboard/home-quality-of-care-composite-card").then(m => ({ default: m.HomeQualityOfCareCompositeCard })), { ssr: false });
const HomeAccidentInjurySurveillanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-accident-injury-surveillance-intelligence-card").then(m => ({ default: m.HomeAccidentInjurySurveillanceIntelligenceCard })), { ssr: false });
const HomeStatutoryVisitComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-statutory-visit-compliance-intelligence-card").then(m => ({ default: m.HomeStatutoryVisitComplianceIntelligenceCard })), { ssr: false });
const HomeBelongingPersonalPropertyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-belonging-personal-property-intelligence-card").then(m => ({ default: m.HomeBelongingPersonalPropertyIntelligenceCard })), { ssr: false });
const HomeCamhsSpecialistReferralIntelligenceCard = dynamic(() => import("@/components/dashboard/home-camhs-specialist-referral-intelligence-card").then(m => ({ default: m.HomeCamhsSpecialistReferralIntelligenceCard })), { ssr: false });
const HomeConsentRightsLiteracyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-consent-rights-literacy-intelligence-card").then(m => ({ default: m.HomeConsentRightsLiteracyIntelligenceCard })), { ssr: false });
const HomeStaffReflectivePracticeIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-reflective-practice-intelligence-card").then(m => ({ default: m.HomeStaffReflectivePracticeIntelligenceCard })), { ssr: false });
const HomeSensoryTherapeuticEnvironmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-sensory-therapeutic-environment-intelligence-card").then(m => ({ default: m.HomeSensoryTherapeuticEnvironmentIntelligenceCard })), { ssr: false });
const HomeDailyRoutineCareContinuityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-daily-routine-care-continuity-intelligence-card").then(m => ({ default: m.HomeDailyRoutineCareContinuityIntelligenceCard })), { ssr: false });
// Batch 11 — Outcome Star, Infection Control, Case File Audit, Stakeholder Engagement
const HomeOutcomeStarNeedsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-outcome-star-needs-intelligence-card").then(m => ({ default: m.HomeOutcomeStarNeedsIntelligenceCard })), { ssr: false });
const HomeInfectionControlHealthSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-infection-control-health-safety-intelligence-card").then(m => ({ default: m.HomeInfectionControlHealthSafetyIntelligenceCard })), { ssr: false });
const HomeCaseFileAuditQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-case-file-audit-quality-intelligence-card").then(m => ({ default: m.HomeCaseFileAuditQualityIntelligenceCard })), { ssr: false });
const HomeStakeholderEngagementFeedbackIntelligenceCard = dynamic(() => import("@/components/dashboard/home-stakeholder-engagement-feedback-intelligence-card").then(m => ({ default: m.HomeStakeholderEngagementFeedbackIntelligenceCard })), { ssr: false });
// Batch 12 — Financial Literacy, Safer Recruitment, Leaving Care, Governance
const HomeFinancialLiteracyMoneyManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-financial-literacy-money-management-intelligence-card").then(m => ({ default: m.HomeFinancialLiteracyMoneyManagementIntelligenceCard })), { ssr: false });
const HomeSaferRecruitmentVettingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-safer-recruitment-vetting-intelligence-card").then(m => ({ default: m.HomeSaferRecruitmentVettingIntelligenceCard })), { ssr: false });
const HomeLeavingCareTransitionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-leaving-care-transition-intelligence-card").then(m => ({ default: m.HomeLeavingCareTransitionIntelligenceCard })), { ssr: false });
const HomeGovernanceManagementOversightIntelligenceCard = dynamic(() => import("@/components/dashboard/home-governance-management-oversight-intelligence-card").then(m => ({ default: m.HomeGovernanceManagementOversightIntelligenceCard })), { ssr: false });
// Batch 13 — Staff Competency, Children's Voice, Digital Safety, Therapeutic Wellbeing
const HomeStaffCompetencyTrainingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-competency-training-intelligence-card").then(m => ({ default: m.HomeStaffCompetencyTrainingIntelligenceCard })), { ssr: false });
const HomeChildrensVoiceParticipationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-childrens-voice-participation-intelligence-card").then(m => ({ default: m.HomeChildrensVoiceParticipationIntelligenceCard })), { ssr: false });
const HomeDigitalLiteracyOnlineSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-digital-literacy-online-safety-intelligence-card").then(m => ({ default: m.HomeDigitalLiteracyOnlineSafetyIntelligenceCard })), { ssr: false });
const HomeTherapeuticWellbeingImpactIntelligenceCard = dynamic(() => import("@/components/dashboard/home-therapeutic-wellbeing-impact-intelligence-card").then(m => ({ default: m.HomeTherapeuticWellbeingImpactIntelligenceCard })), { ssr: false });
// Batch 14 — LADO Allegations, Disruption Prevention, Lessons Learned, Diversity & Inclusion
const HomeLadoAllegationManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-lado-allegation-management-intelligence-card").then(m => ({ default: m.HomeLadoAllegationManagementIntelligenceCard })), { ssr: false });
const HomePlacementDisruptionPreventionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-placement-disruption-prevention-intelligence-card").then(m => ({ default: m.HomePlacementDisruptionPreventionIntelligenceCard })), { ssr: false });
const HomeLessonsLearnedImprovementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-lessons-learned-improvement-intelligence-card").then(m => ({ default: m.HomeLessonsLearnedImprovementIntelligenceCard })), { ssr: false });
const HomeDiversityInclusionEqualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-diversity-inclusion-equality-intelligence-card").then(m => ({ default: m.HomeDiversityInclusionEqualityIntelligenceCard })), { ssr: false });
// Batch 15 — Lone Working Safety, Food Nutrition Hygiene, Whistleblowing Transparency, Staff Debrief
const HomeLoneWorkingStaffSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-lone-working-staff-safety-intelligence-card").then(m => ({ default: m.HomeLoneWorkingStaffSafetyIntelligenceCard })), { ssr: false });
const HomeFoodNutritionHygieneSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-food-nutrition-hygiene-safety-intelligence-card").then(m => ({ default: m.HomeFoodNutritionHygieneSafetyIntelligenceCard })), { ssr: false });
const HomeWhistleblowingTransparencyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-whistleblowing-transparency-intelligence-card").then(m => ({ default: m.HomeWhistleblowingTransparencyIntelligenceCard })), { ssr: false });
const HomeStaffDebriefEmotionalSupportIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-debrief-emotional-support-intelligence-card").then(m => ({ default: m.HomeStaffDebriefEmotionalSupportIntelligenceCard })), { ssr: false });
// Batch 16 — Agency Staff Management, Holiday Experiences, Quality of Care Review, Transport Safety
const HomeAgencyStaffManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-agency-staff-management-intelligence-card").then(m => ({ default: m.HomeAgencyStaffManagementIntelligenceCard })), { ssr: false });
const HomeHolidayEnrichingExperiencesIntelligenceCard = dynamic(() => import("@/components/dashboard/home-holiday-enriching-experiences-intelligence-card").then(m => ({ default: m.HomeHolidayEnrichingExperiencesIntelligenceCard })), { ssr: false });
const HomeQualityOfCareReviewIntelligenceCard = dynamic(() => import("@/components/dashboard/home-quality-of-care-review-intelligence-card").then(m => ({ default: m.HomeQualityOfCareReviewIntelligenceCard })), { ssr: false });
const HomeTransportJourneySafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-transport-journey-safety-intelligence-card").then(m => ({ default: m.HomeTransportJourneySafetyIntelligenceCard })), { ssr: false });
// Batch 17 — Management Walkrounds, Practice Observations, House Meetings, Staff Recognition
const HomeManagementWalkroundOversightIntelligenceCard = dynamic(() => import("@/components/dashboard/home-management-walkround-oversight-intelligence-card").then(m => ({ default: m.HomeManagementWalkroundOversightIntelligenceCard })), { ssr: false });
const HomePracticeObservationCompetencyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-practice-observation-competency-intelligence-card").then(m => ({ default: m.HomePracticeObservationCompetencyIntelligenceCard })), { ssr: false });
const HomeHouseMeetingGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-house-meeting-governance-intelligence-card").then(m => ({ default: m.HomeHouseMeetingGovernanceIntelligenceCard })), { ssr: false });
const HomeStaffRecognitionMoraleIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-recognition-morale-intelligence-card").then(m => ({ default: m.HomeStaffRecognitionMoraleIntelligenceCard })), { ssr: false });
// Batch 18 — Cooking Life Skills, Self-Evaluation, Night Handover, Contextual Safeguarding
const HomeCookingLifeSkillsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-cooking-life-skills-intelligence-card").then(m => ({ default: m.HomeCookingLifeSkillsIntelligenceCard })), { ssr: false });
const HomeSelfEvaluationImprovementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-self-evaluation-improvement-intelligence-card").then(m => ({ default: m.HomeSelfEvaluationImprovementIntelligenceCard })), { ssr: false });
const HomeNightHandoverQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-night-handover-quality-intelligence-card").then(m => ({ default: m.HomeNightHandoverQualityIntelligenceCard })), { ssr: false });
const HomeContextualSafeguardingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-contextual-safeguarding-intelligence-card").then(m => ({ default: m.HomeContextualSafeguardingIntelligenceCard })), { ssr: false });

// Batch 19 — Health Appointments, Return Interviews, Fire Drills, Parent Partnership
const HomeHealthAppointmentContinuityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-health-appointment-continuity-intelligence-card").then(m => ({ default: m.HomeHealthAppointmentContinuityIntelligenceCard })), { ssr: false });
const HomeReturnInterviewQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-return-interview-quality-intelligence-card").then(m => ({ default: m.HomeReturnInterviewQualityIntelligenceCard })), { ssr: false });
const HomeFireDrillEmergencyPreparednessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-fire-drill-emergency-preparedness-intelligence-card").then(m => ({ default: m.HomeFireDrillEmergencyPreparednessIntelligenceCard })), { ssr: false });
const HomeParentPartnershipEngagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-parent-partnership-engagement-intelligence-card").then(m => ({ default: m.HomeParentPartnershipEngagementIntelligenceCard })), { ssr: false });

// Batch 20 — Advocacy, Substance Screening, Annual Health Assessment, PEP Education
const HomeAdvocacyIndependentVoiceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-advocacy-independent-voice-intelligence-card").then(m => ({ default: m.HomeAdvocacyIndependentVoiceIntelligenceCard })), { ssr: false });
const HomeSubstanceMisuseScreeningIntelligenceCard = dynamic(() => import("@/components/dashboard/home-substance-misuse-screening-intelligence-card").then(m => ({ default: m.HomeSubstanceMisuseScreeningIntelligenceCard })), { ssr: false });
const HomeAnnualHealthAssessmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-annual-health-assessment-intelligence-card").then(m => ({ default: m.HomeAnnualHealthAssessmentIntelligenceCard })), { ssr: false });
const HomePepEducationQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-pep-education-quality-intelligence-card").then(m => ({ default: m.HomePepEducationQualityIntelligenceCard })), { ssr: false });

// Batch 21 — Sibling Contact, Placement Impact, Multi-Disciplinary Formulation, Social Worker Contact
const HomeSiblingContactProtocolIntelligenceCard = dynamic(() => import("@/components/dashboard/home-sibling-contact-protocol-intelligence-card").then(m => ({ default: m.HomeSiblingContactProtocolIntelligenceCard })), { ssr: false });
const HomePlacementImpactAssessmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-placement-impact-assessment-intelligence-card").then(m => ({ default: m.HomePlacementImpactAssessmentIntelligenceCard })), { ssr: false });
const HomeMultidisciplinaryFormulationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-multidisciplinary-formulation-intelligence-card").then(m => ({ default: m.HomeMultidisciplinaryFormulationIntelligenceCard })), { ssr: false });
const HomeSocialWorkerContactIntelligenceCard = dynamic(() => import("@/components/dashboard/home-social-worker-contact-intelligence-card").then(m => ({ default: m.HomeSocialWorkerContactIntelligenceCard })), { ssr: false });

// Batch 22 — Trauma Therapy, Attachment Profile, Self-Harm Safety Plan, Post-Incident Child Debrief
const HomeTraumaTherapyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-trauma-therapy-intelligence-card").then(m => ({ default: m.HomeTraumaTherapyIntelligenceCard })), { ssr: false });
const HomeAttachmentProfileIntelligenceCard = dynamic(() => import("@/components/dashboard/home-attachment-profile-intelligence-card").then(m => ({ default: m.HomeAttachmentProfileIntelligenceCard })), { ssr: false });
const HomeSelfHarmSafetyPlanIntelligenceCard = dynamic(() => import("@/components/dashboard/home-self-harm-safety-plan-intelligence-card").then(m => ({ default: m.HomeSelfHarmSafetyPlanIntelligenceCard })), { ssr: false });
const HomePostIncidentChildDebriefIntelligenceCard = dynamic(() => import("@/components/dashboard/home-post-incident-child-debrief-intelligence-card").then(m => ({ default: m.HomePostIncidentChildDebriefIntelligenceCard })), { ssr: false });

// Batch 23 — Outcome Star, Behaviour Support Plan, Contextual Safeguarding, Risk Management Plan
const HomeOutcomeStarAssessmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-outcome-star-assessment-intelligence-card").then(m => ({ default: m.HomeOutcomeStarAssessmentIntelligenceCard })), { ssr: false });
const HomeBehaviourSupportPlanIntelligenceCard = dynamic(() => import("@/components/dashboard/home-behaviour-support-plan-intelligence-card").then(m => ({ default: m.HomeBehaviourSupportPlanIntelligenceCard })), { ssr: false });
const HomeContextualSafeguardingRiskIntelligenceCard = dynamic(() => import("@/components/dashboard/home-contextual-safeguarding-risk-intelligence-card").then(m => ({ default: m.HomeContextualSafeguardingRiskIntelligenceCard })), { ssr: false });
const HomeRiskManagementPlanIntelligenceCard = dynamic(() => import("@/components/dashboard/home-risk-management-plan-intelligence-card").then(m => ({ default: m.HomeRiskManagementPlanIntelligenceCard })), { ssr: false });

// Batch 24 — Restraint/Physical Intervention, Missing Episodes, Sleep & Night Care, Medication Administration
const HomeRestraintPhysicalInterventionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-restraint-physical-intervention-intelligence-card").then(m => ({ default: m.HomeRestraintPhysicalInterventionIntelligenceCard })), { ssr: false });
const HomeMissingEpisodeIntelligenceCard = dynamic(() => import("@/components/dashboard/home-missing-episode-intelligence-card").then(m => ({ default: m.HomeMissingEpisodeIntelligenceCard })), { ssr: false });
const HomeSleepNightCareIntelligenceCard = dynamic(() => import("@/components/dashboard/home-sleep-night-care-intelligence-card").then(m => ({ default: m.HomeSleepNightCareIntelligenceCard })), { ssr: false });
const HomeMedicationAdministrationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-medication-administration-intelligence-card").then(m => ({ default: m.HomeMedicationAdministrationIntelligenceCard })), { ssr: false });

// Batch 25 — Welfare Check Compliance, Deprivation of Liberty, Sanction & Reward Balance, Staff Disciplinary & Conduct
const HomeWelfareCheckComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-welfare-check-compliance-intelligence-card").then(m => ({ default: m.HomeWelfareCheckComplianceIntelligenceCard })), { ssr: false });
const HomeDeprivationOfLibertyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-deprivation-of-liberty-intelligence-card").then(m => ({ default: m.HomeDeprivationOfLibertyIntelligenceCard })), { ssr: false });
const HomeSanctionRewardBalanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-sanction-reward-balance-intelligence-card").then(m => ({ default: m.HomeSanctionRewardBalanceIntelligenceCard })), { ssr: false });
const HomeStaffDisciplinaryConductIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-disciplinary-conduct-intelligence-card").then(m => ({ default: m.HomeStaffDisciplinaryConductIntelligenceCard })), { ssr: false });

// Batch 26 — Care Event Quality, Statutory Notification Compliance, Staff Performance Composite, Young Person Daily Wellbeing
const HomeCareEventQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-care-event-quality-intelligence-card").then(m => ({ default: m.HomeCareEventQualityIntelligenceCard })), { ssr: false });
const HomeStatutoryNotificationComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-statutory-notification-compliance-intelligence-card").then(m => ({ default: m.HomeStatutoryNotificationComplianceIntelligenceCard })), { ssr: false });
const HomeStaffPerformanceCompositeIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-performance-composite-intelligence-card").then(m => ({ default: m.HomeStaffPerformanceCompositeIntelligenceCard })), { ssr: false });
const HomeYoungPersonDailyWellbeingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-young-person-daily-wellbeing-intelligence-card").then(m => ({ default: m.HomeYoungPersonDailyWellbeingIntelligenceCard })), { ssr: false });

// Batch 27 — Automation ROI, Task Action Completion, Professional Network, Locality Safeguarding
const HomeAutomationROIIntelligenceCard = dynamic(() => import("@/components/dashboard/home-automation-roi-intelligence-card").then(m => ({ default: m.HomeAutomationROIIntelligenceCard })), { ssr: false });
const HomeTaskActionCompletionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-task-action-completion-intelligence-card").then(m => ({ default: m.HomeTaskActionCompletionIntelligenceCard })), { ssr: false });
const HomeProfessionalNetworkIntelligenceCard = dynamic(() => import("@/components/dashboard/home-professional-network-intelligence-card").then(m => ({ default: m.HomeProfessionalNetworkIntelligenceCard })), { ssr: false });
const HomeLocalitySafeguardingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-locality-safeguarding-intelligence-card").then(m => ({ default: m.HomeLocalitySafeguardingIntelligenceCard })), { ssr: false });

// Batch 28 — Recruitment Audit Trail, Filing Evidence Governance, Independence Skills Readiness, Cara Content Quality
const HomeRecruitmentAuditTrailIntelligenceCard = dynamic(() => import("@/components/dashboard/home-recruitment-audit-trail-intelligence-card").then(m => ({ default: m.HomeRecruitmentAuditTrailIntelligenceCard })), { ssr: false });
const HomeFilingEvidenceGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-filing-evidence-governance-intelligence-card").then(m => ({ default: m.HomeFilingEvidenceGovernanceIntelligenceCard })), { ssr: false });
const HomeIndependenceSkillsReadinessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-independence-skills-readiness-intelligence-card").then(m => ({ default: m.HomeIndependenceSkillsReadinessIntelligenceCard })), { ssr: false });
const HomeCaraContentQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-cara-content-quality-intelligence-card").then(m => ({ default: m.HomeCaraContentQualityIntelligenceCard })), { ssr: false });

// Batch 29 — Notification Responsiveness, Holistic Child Progress, Information Flow Quality, Regulatory Evidence Completeness
const HomeNotificationResponsivenessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-notification-responsiveness-intelligence-card").then(m => ({ default: m.HomeNotificationResponsivenessIntelligenceCard })), { ssr: false });
const HomeHolisticChildProgressIntelligenceCard = dynamic(() => import("@/components/dashboard/home-holistic-child-progress-intelligence-card").then(m => ({ default: m.HomeHolisticChildProgressIntelligenceCard })), { ssr: false });
const HomeInformationFlowQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-information-flow-quality-intelligence-card").then(m => ({ default: m.HomeInformationFlowQualityIntelligenceCard })), { ssr: false });
const HomeRegulatoryEvidenceCompletenessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-regulatory-evidence-completeness-intelligence-card").then(m => ({ default: m.HomeRegulatoryEvidenceCompletenessIntelligenceCard })), { ssr: false });

// Batch 30 — Family Social Connectivity, Emotional Safety Climate, Staff Induction Onboarding, Living Environment Standards
const HomeFamilySocialConnectivityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-family-social-connectivity-intelligence-card").then(m => ({ default: m.HomeFamilySocialConnectivityIntelligenceCard })), { ssr: false });
const HomeEmotionalSafetyClimateIntelligenceCard = dynamic(() => import("@/components/dashboard/home-emotional-safety-climate-intelligence-card").then(m => ({ default: m.HomeEmotionalSafetyClimateIntelligenceCard })), { ssr: false });
const HomeStaffInductionOnboardingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-induction-onboarding-intelligence-card").then(m => ({ default: m.HomeStaffInductionOnboardingIntelligenceCard })), { ssr: false });
const HomeLivingEnvironmentStandardsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-living-environment-standards-intelligence-card").then(m => ({ default: m.HomeLivingEnvironmentStandardsIntelligenceCard })), { ssr: false });

// ── Batch 31 ──
const HomeHealthWellbeingOversightIntelligenceCard = dynamic(() => import("@/components/dashboard/home-health-wellbeing-oversight-intelligence-card").then(m => ({ default: m.HomeHealthWellbeingOversightIntelligenceCard })), { ssr: false });
const HomeCulturalIdentityDiversityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-cultural-identity-diversity-intelligence-card").then(m => ({ default: m.HomeCulturalIdentityDiversityIntelligenceCard })), { ssr: false });
const HomeNightCareQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-night-care-quality-intelligence-card").then(m => ({ default: m.HomeNightCareQualityIntelligenceCard })), { ssr: false });
const HomeComplaintAdvocacyResponsivenessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-complaint-advocacy-responsiveness-intelligence-card").then(m => ({ default: m.HomeComplaintAdvocacyResponsivenessIntelligenceCard })), { ssr: false });

// ── Batch 32 ──
const HomeMedicationSafetyComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-medication-safety-compliance-intelligence-card").then(m => ({ default: m.HomeMedicationSafetyComplianceIntelligenceCard })), { ssr: false });
const HomeTransportVehicleSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-transport-vehicle-safety-intelligence-card").then(m => ({ default: m.HomeTransportVehicleSafetyIntelligenceCard })), { ssr: false });
const HomeTransitionLeavingCareReadinessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-transition-leaving-care-readiness-intelligence-card").then(m => ({ default: m.HomeTransitionLeavingCareReadinessIntelligenceCard })), { ssr: false });
const HomeStaffSupervisionReflectivePracticeIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-supervision-reflective-practice-intelligence-card").then(m => ({ default: m.HomeStaffSupervisionReflectivePracticeIntelligenceCard })), { ssr: false });

// ── Batch 33 ──
const HomeEmergencyPreparednessContinuityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-emergency-preparedness-continuity-intelligence-card").then(m => ({ default: m.HomeEmergencyPreparednessContinuityIntelligenceCard })), { ssr: false });
const HomePeerRelationshipSocialDevelopmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-peer-relationship-social-development-intelligence-card").then(m => ({ default: m.HomePeerRelationshipSocialDevelopmentIntelligenceCard })), { ssr: false });
const HomeDigitalSafetyOnlineProtectionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-digital-safety-online-protection-intelligence-card").then(m => ({ default: m.HomeDigitalSafetyOnlineProtectionIntelligenceCard })), { ssr: false });
const HomeTherapeuticInterventionEffectivenessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-therapeutic-intervention-effectiveness-intelligence-card").then(m => ({ default: m.HomeTherapeuticInterventionEffectivenessIntelligenceCard })), { ssr: false });

// ── Batch 34 ──
const HomeNutritionDietaryManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-nutrition-dietary-management-intelligence-card").then(m => ({ default: m.HomeNutritionDietaryManagementIntelligenceCard })), { ssr: false });
const HomeParentalContactFamilyEngagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-parental-contact-family-engagement-intelligence-card").then(m => ({ default: m.HomeParentalContactFamilyEngagementIntelligenceCard })), { ssr: false });
const HomeStaffTrainingCpdComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-training-cpd-compliance-intelligence-card").then(m => ({ default: m.HomeStaffTrainingCpdComplianceIntelligenceCard })), { ssr: false });
const HomePhysicalActivityRecreationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-physical-activity-recreation-intelligence-card").then(m => ({ default: m.HomePhysicalActivityRecreationIntelligenceCard })), { ssr: false });

// ── Batch 35 ──
const HomeEnvironmentalSustainabilityEcoAwarenessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-environmental-sustainability-eco-awareness-intelligence-card").then(m => ({ default: m.HomeEnvironmentalSustainabilityEcoAwarenessIntelligenceCard })), { ssr: false });
const HomeSensoryAccessibilitySupportIntelligenceCard = dynamic(() => import("@/components/dashboard/home-sensory-accessibility-support-intelligence-card").then(m => ({ default: m.HomeSensoryAccessibilitySupportIntelligenceCard })), { ssr: false });
const HomeSleepQualityRestManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-sleep-quality-rest-management-intelligence-card").then(m => ({ default: m.HomeSleepQualityRestManagementIntelligenceCard })), { ssr: false });
const HomeReligiousSpiritualWellbeingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-religious-spiritual-wellbeing-intelligence-card").then(m => ({ default: m.HomeReligiousSpiritualWellbeingIntelligenceCard })), { ssr: false });

// ── Batch 36 ──
const HomeVisitorManagementSecurityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-visitor-management-security-intelligence-card").then(m => ({ default: m.HomeVisitorManagementSecurityIntelligenceCard })), { ssr: false });
const HomeKeyWorkerRelationshipQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-key-worker-relationship-quality-intelligence-card").then(m => ({ default: m.HomeKeyWorkerRelationshipQualityIntelligenceCard })), { ssr: false });
const HomeBehaviourSupportPlanEffectivenessIntelligenceCard = dynamic(() => import("@/components/dashboard/home-behaviour-support-plan-effectiveness-intelligence-card").then(m => ({ default: m.HomeBehaviourSupportPlanEffectivenessIntelligenceCard })), { ssr: false });
const HomePocketMoneyFinancialLiteracyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-pocket-money-financial-literacy-intelligence-card").then(m => ({ default: m.HomePocketMoneyFinancialLiteracyIntelligenceCard })), { ssr: false });

// ── Batch 37 ──
const HomeIndependenceLifeSkillsDevelopmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-independence-life-skills-development-intelligence-card").then(m => ({ default: m.HomeIndependenceLifeSkillsDevelopmentIntelligenceCard })), { ssr: false });
const HomeMultiAgencyCollaborationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-multi-agency-collaboration-intelligence-card").then(m => ({ default: m.HomeMultiAgencyCollaborationIntelligenceCard })), { ssr: false });
const HomeStaffWellbeingRetentionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-wellbeing-retention-intelligence-card").then(m => ({ default: m.HomeStaffWellbeingRetentionIntelligenceCard })), { ssr: false });
const HomePlacementStabilityPermanenceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-placement-stability-permanence-intelligence-card").then(m => ({ default: m.HomePlacementStabilityPermanenceIntelligenceCard })), { ssr: false });

// ── Batch 38 ──
const HomeRecordKeepingDocumentationQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-record-keeping-documentation-quality-intelligence-card").then(m => ({ default: m.HomeRecordKeepingDocumentationQualityIntelligenceCard })), { ssr: false });
const HomeClothingPersonalPossessionsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-clothing-personal-possessions-intelligence-card").then(m => ({ default: m.HomeClothingPersonalPossessionsIntelligenceCard })), { ssr: false });
const HomeCommunicationLanguageSupportIntelligenceCard = dynamic(() => import("@/components/dashboard/home-communication-language-support-intelligence-card").then(m => ({ default: m.HomeCommunicationLanguageSupportIntelligenceCard })), { ssr: false });
const HomeHomeworkAcademicSupportIntelligenceCard = dynamic(() => import("@/components/dashboard/home-homework-academic-support-intelligence-card").then(m => ({ default: m.HomeHomeworkAcademicSupportIntelligenceCard })), { ssr: false });

// ── Batch 39 ──
const HomeConsentCapacityManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-consent-capacity-management-intelligence-card").then(m => ({ default: m.HomeConsentCapacityManagementIntelligenceCard })), { ssr: false });
const HomeFireSafetyEmergencyDrillIntelligenceCard = dynamic(() => import("@/components/dashboard/home-fire-safety-emergency-drill-intelligence-card").then(m => ({ default: m.HomeFireSafetyEmergencyDrillIntelligenceCard })), { ssr: false });
const HomeInfectionPreventionControlIntelligenceCard = dynamic(() => import("@/components/dashboard/home-infection-prevention-control-intelligence-card").then(m => ({ default: m.HomeInfectionPreventionControlIntelligenceCard })), { ssr: false });
const HomePrivacyDignityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-privacy-dignity-intelligence-card").then(m => ({ default: m.HomePrivacyDignityIntelligenceCard })), { ssr: false });

// ── Batch 40 ──
const HomeAllegationsInvestigationsManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-allegations-investigations-management-intelligence-card").then(m => ({ default: m.HomeAllegationsInvestigationsManagementIntelligenceCard })), { ssr: false });
const HomeAdmissionsMatchingAssessmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-admissions-matching-assessment-intelligence-card").then(m => ({ default: m.HomeAdmissionsMatchingAssessmentIntelligenceCard })), { ssr: false });
const HomeDailyRoutineStructureIntelligenceCard = dynamic(() => import("@/components/dashboard/home-daily-routine-structure-intelligence-card").then(m => ({ default: m.HomeDailyRoutineStructureIntelligenceCard })), { ssr: false });
const HomeOutdoorNatureEngagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-outdoor-nature-engagement-intelligence-card").then(m => ({ default: m.HomeOutdoorNatureEngagementIntelligenceCard })), { ssr: false });

// ── Batch 41 ──
const HomeCulturalEventsCelebrationsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-cultural-events-celebrations-intelligence-card").then(m => ({ default: m.HomeCulturalEventsCelebrationsIntelligenceCard })), { ssr: false });
const HomeWaterSafetyHydrationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-water-safety-hydration-intelligence-card").then(m => ({ default: m.HomeWaterSafetyHydrationIntelligenceCard })), { ssr: false });
const HomeDentalOralHealthIntelligenceCard = dynamic(() => import("@/components/dashboard/home-dental-oral-health-intelligence-card").then(m => ({ default: m.HomeDentalOralHealthIntelligenceCard })), { ssr: false });
const HomeTechnologyDigitalInclusionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-technology-digital-inclusion-intelligence-card").then(m => ({ default: m.HomeTechnologyDigitalInclusionIntelligenceCard })), { ssr: false });

// ── Batch 42 ──
const HomeGriefBereavementSupportIntelligenceCard = dynamic(() => import("@/components/dashboard/home-grief-bereavement-support-intelligence-card").then(m => ({ default: m.HomeGriefBereavementSupportIntelligenceCard })), { ssr: false });
const HomeSubstanceMisusePreventionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-substance-misuse-prevention-intelligence-card").then(m => ({ default: m.HomeSubstanceMisusePreventionIntelligenceCard })), { ssr: false });
const HomeYouthJusticeOffendingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-youth-justice-offending-intelligence-card").then(m => ({ default: m.HomeYouthJusticeOffendingIntelligenceCard })), { ssr: false });
const HomePositiveIdentitySelfEsteemIntelligenceCard = dynamic(() => import("@/components/dashboard/home-positive-identity-self-esteem-intelligence-card").then(m => ({ default: m.HomePositiveIdentitySelfEsteemIntelligenceCard })), { ssr: false });

// ── Batch 43 ──
const HomePetAnimalTherapyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-pet-animal-therapy-intelligence-card").then(m => ({ default: m.HomePetAnimalTherapyIntelligenceCard })), { ssr: false });
const HomeSiblingContactRelationshipsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-sibling-contact-relationships-intelligence-card").then(m => ({ default: m.HomeSiblingContactRelationshipsIntelligenceCard })), { ssr: false });
const HomeStaffRotaAdequateStaffingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-rota-adequate-staffing-intelligence-card").then(m => ({ default: m.HomeStaffRotaAdequateStaffingIntelligenceCard })), { ssr: false });
const HomeWhistleblowingSafeguardingCultureIntelligenceCard = dynamic(() => import("@/components/dashboard/home-whistleblowing-safeguarding-culture-intelligence-card").then(m => ({ default: m.HomeWhistleblowingSafeguardingCultureIntelligenceCard })), { ssr: false });

// ── Batch 44 ──
const HomeAnxietyMentalHealthScreeningIntelligenceCard = dynamic(() => import("@/components/dashboard/home-anxiety-mental-health-screening-intelligence-card").then(m => ({ default: m.HomeAnxietyMentalHealthScreeningIntelligenceCard })), { ssr: false });
const HomeMinorRepairsMaintenanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-minor-repairs-maintenance-intelligence-card").then(m => ({ default: m.HomeMinorRepairsMaintenanceIntelligenceCard })), { ssr: false });
const HomeCommunityIntegrationVolunteeringIntelligenceCard = dynamic(() => import("@/components/dashboard/home-community-integration-volunteering-intelligence-card").then(m => ({ default: m.HomeCommunityIntegrationVolunteeringIntelligenceCard })), { ssr: false });
const HomePersonalCalendarAppointmentsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-personal-calendar-appointments-intelligence-card").then(m => ({ default: m.HomePersonalCalendarAppointmentsIntelligenceCard })), { ssr: false });

// ── Batch 45 ──
const HomeHobbiesInterestsDevelopmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-hobbies-interests-development-intelligence-card").then(m => ({ default: m.HomeHobbiesInterestsDevelopmentIntelligenceCard })), { ssr: false });
const HomeContinencePersonalHygieneSupportIntelligenceCard = dynamic(() => import("@/components/dashboard/home-continence-personal-hygiene-support-intelligence-card").then(m => ({ default: m.HomeContinencePersonalHygieneSupportIntelligenceCard })), { ssr: false });
const HomeRewardsIncentivesManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-rewards-incentives-management-intelligence-card").then(m => ({ default: m.HomeRewardsIncentivesManagementIntelligenceCard })), { ssr: false });
const HomeStaffDebriefingCriticalIncidentSupportIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-debriefing-critical-incident-support-intelligence-card").then(m => ({ default: m.HomeStaffDebriefingCriticalIncidentSupportIntelligenceCard })), { ssr: false });

// ── Batch 46 ──
const HomeSensoryDietRegulationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-sensory-diet-regulation-intelligence-card").then(m => ({ default: m.HomeSensoryDietRegulationIntelligenceCard })), { ssr: false });
const HomeEthnicHairSkincareIntelligenceCard = dynamic(() => import("@/components/dashboard/home-ethnic-hair-skincare-intelligence-card").then(m => ({ default: m.HomeEthnicHairSkincareIntelligenceCard })), { ssr: false });
const HomeHolidayTripPlanningIntelligenceCard = dynamic(() => import("@/components/dashboard/home-holiday-trip-planning-intelligence-card").then(m => ({ default: m.HomeHolidayTripPlanningIntelligenceCard })), { ssr: false });
const HomeRestorativePracticeConflictResolutionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-restorative-practice-conflict-resolution-intelligence-card").then(m => ({ default: m.HomeRestorativePracticeConflictResolutionIntelligenceCard })), { ssr: false });

// ── Batch 47 ──
const HomeSexualHealthRseEducationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-sexual-health-rse-education-intelligence-card").then(m => ({ default: m.HomeSexualHealthRseEducationIntelligenceCard })), { ssr: false });
const HomeNoiseSoundManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-noise-sound-management-intelligence-card").then(m => ({ default: m.HomeNoiseSoundManagementIntelligenceCard })), { ssr: false });
const HomeStaffPerformanceAppraisalIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-performance-appraisal-intelligence-card").then(m => ({ default: m.HomeStaffPerformanceAppraisalIntelligenceCard })), { ssr: false });
const HomeAdvocacyIndependentVisitorIntelligenceCard = dynamic(() => import("@/components/dashboard/home-advocacy-independent-visitor-intelligence-card").then(m => ({ default: m.HomeAdvocacyIndependentVisitorIntelligenceCard })), { ssr: false });

// ── Batch 48 ──
const HomeEmotionalLiteracyFeelingsExpressionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-emotional-literacy-feelings-expression-intelligence-card").then(m => ({ default: m.HomeEmotionalLiteracyFeelingsExpressionIntelligenceCard })), { ssr: false });
const HomeSavingsBankingSkillsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-savings-banking-skills-intelligence-card").then(m => ({ default: m.HomeSavingsBankingSkillsIntelligenceCard })), { ssr: false });
const HomeHazardNearMissReportingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-hazard-near-miss-reporting-intelligence-card").then(m => ({ default: m.HomeHazardNearMissReportingIntelligenceCard })), { ssr: false });
const HomeMenstruationPubertySupportIntelligenceCard = dynamic(() => import("@/components/dashboard/home-menstruation-puberty-support-intelligence-card").then(m => ({ default: m.HomeMenstruationPubertySupportIntelligenceCard })), { ssr: false });

// ── Batch 49 ──
const HomeEyeHealthVisionCareIntelligenceCard = dynamic(() => import("@/components/dashboard/home-eye-health-vision-care-intelligence-card").then(m => ({ default: m.HomeEyeHealthVisionCareIntelligenceCard })), { ssr: false });
const HomeAsthmaRespiratoryManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-asthma-respiratory-management-intelligence-card").then(m => ({ default: m.HomeAsthmaRespiratoryManagementIntelligenceCard })), { ssr: false });
const HomeLaundryLinenManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-laundry-linen-management-intelligence-card").then(m => ({ default: m.HomeLaundryLinenManagementIntelligenceCard })), { ssr: false });
const HomeBirthdaySpecialOccasionCelebrationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-birthday-special-occasion-celebration-intelligence-card").then(m => ({ default: m.HomeBirthdaySpecialOccasionCelebrationIntelligenceCard })), { ssr: false });

// ── Batch 50 ──
const HomeFriendshipSocialNetworkIntelligenceCard = dynamic(() => import("@/components/dashboard/home-friendship-social-network-intelligence-card").then(m => ({ default: m.HomeFriendshipSocialNetworkIntelligenceCard })), { ssr: false });
const HomeCctvSurveillanceGovernanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-cctv-surveillance-governance-intelligence-card").then(m => ({ default: m.HomeCctvSurveillanceGovernanceIntelligenceCard })), { ssr: false });
const HomePocketMoneyAuditReconciliationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-pocket-money-audit-reconciliation-intelligence-card").then(m => ({ default: m.HomePocketMoneyAuditReconciliationIntelligenceCard })), { ssr: false });
const HomeImmunisationVaccinationComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-immunisation-vaccination-compliance-intelligence-card").then(m => ({ default: m.HomeImmunisationVaccinationComplianceIntelligenceCard })), { ssr: false });

// ── Batch 51 ──
const HomeFurnitureRoomPersonalisationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-furniture-room-personalisation-intelligence-card").then(m => ({ default: m.HomeFurnitureRoomPersonalisationIntelligenceCard })), { ssr: false });
const HomeCookingKitchenSkillsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-cooking-kitchen-skills-intelligence-card").then(m => ({ default: m.HomeCookingKitchenSkillsIntelligenceCard })), { ssr: false });
const HomeBedwettingEnuresisSupportIntelligenceCard = dynamic(() => import("@/components/dashboard/home-bedwetting-enuresis-support-intelligence-card").then(m => ({ default: m.HomeBedwettingEnuresisSupportIntelligenceCard })), { ssr: false });
const HomeStaffLoneWorkingSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-staff-lone-working-safety-intelligence-card").then(m => ({ default: m.HomeStaffLoneWorkingSafetyIntelligenceCard })), { ssr: false });

// ── Batch 52 ──
const HomeTeethBrushingOralRoutineIntelligenceCard = dynamic(() => import("@/components/dashboard/home-teeth-brushing-oral-routine-intelligence-card").then(m => ({ default: m.HomeTeethBrushingOralRoutineIntelligenceCard })), { ssr: false });
const HomeGardenOutdoorSpaceMaintenanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-garden-outdoor-space-maintenance-intelligence-card").then(m => ({ default: m.HomeGardenOutdoorSpaceMaintenanceIntelligenceCard })), { ssr: false });
const HomeEmergencyContactNextOfKinIntelligenceCard = dynamic(() => import("@/components/dashboard/home-emergency-contact-next-of-kin-intelligence-card").then(m => ({ default: m.HomeEmergencyContactNextOfKinIntelligenceCard })), { ssr: false });
const HomeWeeklyPlannerActivityScheduleIntelligenceCard = dynamic(() => import("@/components/dashboard/home-weekly-planner-activity-schedule-intelligence-card").then(m => ({ default: m.HomeWeeklyPlannerActivityScheduleIntelligenceCard })), { ssr: false });

// ── Batch 53 ──
const HomeDbsRenewalStaffVettingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-dbs-renewal-staff-vetting-intelligence-card").then(m => ({ default: m.HomeDbsRenewalStaffVettingIntelligenceCard })), { ssr: false });
const HomeChildVoiceParticipationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-child-voice-participation-intelligence-card").then(m => ({ default: m.HomeChildVoiceParticipationIntelligenceCard })), { ssr: false });
const HomeAromatherapyWellbeingTherapiesIntelligenceCard = dynamic(() => import("@/components/dashboard/home-aromatherapy-wellbeing-therapies-intelligence-card").then(m => ({ default: m.HomeAromatherapyWellbeingTherapiesIntelligenceCard })), { ssr: false });
const HomePestControlHygieneComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-pest-control-hygiene-compliance-intelligence-card").then(m => ({ default: m.HomePestControlHygieneComplianceIntelligenceCard })), { ssr: false });

// ── Batch 54 ──
const HomeMissingPersonAbsentAuthorityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-missing-person-absent-authority-intelligence-card").then(m => ({ default: m.HomeMissingPersonAbsentAuthorityIntelligenceCard })), { ssr: false });
const HomeBedroomTemperatureVentilationIntelligenceCard = dynamic(() => import("@/components/dashboard/home-bedroom-temperature-ventilation-intelligence-card").then(m => ({ default: m.HomeBedroomTemperatureVentilationIntelligenceCard })), { ssr: false });
const HomeHomeworkEnvironmentStudySpaceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-homework-environment-study-space-intelligence-card").then(m => ({ default: m.HomeHomeworkEnvironmentStudySpaceIntelligenceCard })), { ssr: false });
const HomeWeightManagementHealthyEatingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-weight-management-healthy-eating-intelligence-card").then(m => ({ default: m.HomeWeightManagementHealthyEatingIntelligenceCard })), { ssr: false });

// ── Batch 55 ──
const HomeFirstAidKitMedicalSuppliesIntelligenceCard = dynamic(() => import("@/components/dashboard/home-first-aid-kit-medical-supplies-intelligence-card").then(m => ({ default: m.HomeFirstAidKitMedicalSuppliesIntelligenceCard })), { ssr: false });
const HomeKeyholdingAccessControlIntelligenceCard = dynamic(() => import("@/components/dashboard/home-keyholding-access-control-intelligence-card").then(m => ({ default: m.HomeKeyholdingAccessControlIntelligenceCard })), { ssr: false });
const HomeHandoverCommunicationQualityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-handover-communication-quality-intelligence-card").then(m => ({ default: m.HomeHandoverCommunicationQualityIntelligenceCard })), { ssr: false });
const HomeClothingLabellingStorageIntelligenceCard = dynamic(() => import("@/components/dashboard/home-clothing-labelling-storage-intelligence-card").then(m => ({ default: m.HomeClothingLabellingStorageIntelligenceCard })), { ssr: false });

// ── Batch 56 ──
const HomeElectricityGasSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-electricity-gas-safety-intelligence-card").then(m => ({ default: m.HomeElectricityGasSafetyIntelligenceCard })), { ssr: false });
const HomeBathroomShowerFacilitiesIntelligenceCard = dynamic(() => import("@/components/dashboard/home-bathroom-shower-facilities-intelligence-card").then(m => ({ default: m.HomeBathroomShowerFacilitiesIntelligenceCard })), { ssr: false });
const HomeMobilePhoneScreenTimeIntelligenceCard = dynamic(() => import("@/components/dashboard/home-mobile-phone-screen-time-intelligence-card").then(m => ({ default: m.HomeMobilePhoneScreenTimeIntelligenceCard })), { ssr: false });
const HomePocketMoneyDistributionEquityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-pocket-money-distribution-equity-intelligence-card").then(m => ({ default: m.HomePocketMoneyDistributionEquityIntelligenceCard })), { ssr: false });

// ── Batch 57 ──
const HomeAllergyManagementFoodSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-allergy-management-food-safety-intelligence-card").then(m => ({ default: m.HomeAllergyManagementFoodSafetyIntelligenceCard })), { ssr: false });
const HomeBathroomAccessibilityAdaptationsIntelligenceCard = dynamic(() => import("@/components/dashboard/home-bathroom-accessibility-adaptations-intelligence-card").then(m => ({ default: m.HomeBathroomAccessibilityAdaptationsIntelligenceCard })), { ssr: false });
const HomeUtilityBillsCostManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-utility-bills-cost-management-intelligence-card").then(m => ({ default: m.HomeUtilityBillsCostManagementIntelligenceCard })), { ssr: false });
const HomeNeighbourhoodSafetyRiskAssessmentIntelligenceCard = dynamic(() => import("@/components/dashboard/home-neighbourhood-safety-risk-assessment-intelligence-card").then(m => ({ default: m.HomeNeighbourhoodSafetyRiskAssessmentIntelligenceCard })), { ssr: false });

// ── Batch 58 ──
const HomeWashingMachineDryerMaintenanceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-washing-machine-dryer-maintenance-intelligence-card").then(m => ({ default: m.HomeWashingMachineDryerMaintenanceIntelligenceCard })), { ssr: false });
const HomeItEquipmentConnectivityIntelligenceCard = dynamic(() => import("@/components/dashboard/home-it-equipment-connectivity-intelligence-card").then(m => ({ default: m.HomeItEquipmentConnectivityIntelligenceCard })), { ssr: false });
const HomeWindowBlindCurtainSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-window-blind-curtain-safety-intelligence-card").then(m => ({ default: m.HomeWindowBlindCurtainSafetyIntelligenceCard })), { ssr: false });
const HomeSharpsDisposalHazardousWasteIntelligenceCard = dynamic(() => import("@/components/dashboard/home-sharps-disposal-hazardous-waste-intelligence-card").then(m => ({ default: m.HomeSharpsDisposalHazardousWasteIntelligenceCard })), { ssr: false });

// ── Batch 59 ──
const HomeReg4445QualityAssuranceReportingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-reg44-45-quality-assurance-reporting-intelligence-card").then(m => ({ default: m.HomeReg4445QualityAssuranceReportingIntelligenceCard })), { ssr: false });
const HomeDampMouldManagementIntelligenceCard = dynamic(() => import("@/components/dashboard/home-damp-mould-management-intelligence-card").then(m => ({ default: m.HomeDampMouldManagementIntelligenceCard })), { ssr: false });
const HomeFoodStorageRefrigerationSafetyIntelligenceCard = dynamic(() => import("@/components/dashboard/home-food-storage-refrigeration-safety-intelligence-card").then(m => ({ default: m.HomeFoodStorageRefrigerationSafetyIntelligenceCard })), { ssr: false });
const HomeSlipsTripsFallsPreventionIntelligenceCard = dynamic(() => import("@/components/dashboard/home-slips-trips-falls-prevention-intelligence-card").then(m => ({ default: m.HomeSlipsTripsFallsPreventionIntelligenceCard })), { ssr: false });

// ── Batch 60 ──
const HomeBoilerHeatingSystemServicingIntelligenceCard = dynamic(() => import("@/components/dashboard/home-boiler-heating-system-servicing-intelligence-card").then(m => ({ default: m.HomeBoilerHeatingSystemServicingIntelligenceCard })), { ssr: false });
const HomeStatementPurposeChildrenGuideIntelligenceCard = dynamic(() => import("@/components/dashboard/home-statement-purpose-children-guide-intelligence-card").then(m => ({ default: m.HomeStatementPurposeChildrenGuideIntelligenceCard })), { ssr: false });
const HomePolicyReviewCycleComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-policy-review-cycle-compliance-intelligence-card").then(m => ({ default: m.HomePolicyReviewCycleComplianceIntelligenceCard })), { ssr: false });
const HomeDataProtectionGdprComplianceIntelligenceCard = dynamic(() => import("@/components/dashboard/home-data-protection-gdpr-compliance-intelligence-card").then(m => ({ default: m.HomeDataProtectionGdprComplianceIntelligenceCard })), { ssr: false });

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
// Base placeholder = the shared primitive (components/ui/skeleton) so every
// loading state shimmers the same way; only the composed shapes live here.

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
      <div className={cn("rounded-2xl p-3 shrink-0 relative ring-1 ring-black/[0.03] shadow-sm transition-transform duration-200 group-hover:scale-105", bgColor)}>
        <Icon className={cn("h-5 w-5", color)} />
        {pulse && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--cs-risk)] animate-pulse" />}
      </div>
    </div>
  );

  const base = "group block rounded-2xl border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] p-5 shadow-[var(--cs-shadow-soft)]";
  if (href) {
    return (
      <Link
        href={href}
        className={cn(base, "cs-lift focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]/40")}
      >
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
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
        ? "bg-[--cs-risk-bg] border-[--cs-risk-soft]"
        : "bg-[--cs-warning-bg] border-[--cs-warning-soft]"
    )}>
      <div className="flex items-center gap-2 shrink-0">
        {hasCritical ? (
          <XCircle className="h-5 w-5 text-[--cs-risk] shrink-0" />
        ) : (
          <TriangleAlert className="h-5 w-5 text-[--cs-warning] shrink-0" />
        )}
        <span className={cn(
          "text-sm font-bold",
          hasCritical ? "text-[--cs-risk]" : "text-[--cs-warning]"
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
    urgent: "bg-[--cs-risk-bg] text-[--cs-risk]",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-[--cs-info-bg] text-[--cs-info]",
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
              overdue ? "text-[--cs-risk] font-semibold" :
              dueToday ? "text-orange-600 font-medium" :
              "text-[var(--cs-text-muted)]"
            )}>
              {overdue ? "Overdue · " : ""}{formatRelative(task.due_date)}
            </span>
          )}
          {task.linked_child_id && (
            <span className="text-[10px] text-[var(--cs-cara-gold)] flex items-center gap-0.5">
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
              ? "bg-[--cs-success-bg] text-[--cs-success]"
              : "bg-slate-100 text-[var(--cs-text-muted)] hover:bg-[--cs-success-bg] hover:text-[--cs-success] opacity-0 group-hover:opacity-100"
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
  critical: "bg-[--cs-risk-bg] text-[--cs-risk] border-[--cs-risk-soft]",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-[--cs-warning-bg] text-[--cs-warning] border-[--cs-warning-soft]",
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
            <span className="text-[10px] text-[var(--cs-cara-gold)] flex items-center gap-0.5">
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
  waking_night: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]",
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
        <span className="h-2 w-2 rounded-full bg-[--cs-success] animate-pulse shrink-0" title="On shift now" />
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
  low: { color: "bg-[--cs-success-bg] text-[--cs-success] border-[--cs-success-soft]", label: "Low Risk" },
  medium: { color: "bg-[--cs-warning-bg] text-[--cs-warning] border-[--cs-warning-soft]", label: "Medium Risk" },
  high: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "High Risk" },
  critical: { color: "bg-[--cs-risk-bg] text-[--cs-risk] border-[--cs-risk-soft]", label: "Critical" },
};

const PRIORITY_COLORS = {
  critical: "text-[--cs-risk]",
  high: "text-orange-500",
  medium: "text-[--cs-warning]",
  low: "text-[var(--cs-text-muted)]",
};

function SubScoreBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  const color =
    value >= 80 ? "bg-[--cs-success]" :
    value >= 60 ? "bg-[--cs-warning]" :
    value >= 40 ? "bg-orange-500" :
    "bg-[--cs-risk]";

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
    { label: "You today", value: formatted.user_today || "—", icon: Timer, color: "text-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)]" },
    { label: "You this week", value: formatted.user_week || "—", icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
    { label: "Home this week", value: formatted.home_week || "—", icon: Activity, color: "text-emerald-600 bg-emerald-50" },
    { label: "Home this month", value: formatted.home_month || "—", icon: Zap, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-5 w-5 text-[var(--cs-cara-gold)]" />
          Time Saved by Cara
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
      zoneBDescription:    "Shift coverage, tasks, medication, and Cara intelligence",
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
  const homeName = useHomeName();
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
  const [showDetailed, setShowDetailed] = useState(false);

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
    document.getElementById("cara-anchor")?.scrollIntoView({ behavior: "smooth", block: "center" });
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
          <div className="rounded-2xl bg-[--cs-risk-bg] border border-[--cs-risk-soft] p-8 text-center max-w-md">
            <XCircle className="h-10 w-10 text-[--cs-risk] mx-auto mb-3" />
            <p className="text-base font-semibold text-[--cs-risk] mb-1">Dashboard failed to load</p>
            <p className="text-sm text-[--cs-risk] mb-4">Unable to reach the API. Please try again.</p>
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
      subtitle={`${formatLiveDate()} · ${homeName} · ${d ? d.young_people.current.length : 3} young people in placement`}
      quickCreateContext={{ module: "dashboard" }}
      actions={pageActions}
      caraContext={{ sourceType: "general", pageTitle: "Command Centre" }}
    >
      <div className="space-y-8 pb-8">

        {/* Command Centre hero — the redesigned "needs you now" + at-a-glance surface */}
        {d && (
          <CommandCentreHero
            stats={{
              youngPeople: d.young_people?.current?.length ?? 0,
              places: 0,
              onShift: d.staffing?.on_shift ?? 0,
              openIncidents: d.incidents?.open ?? 0,
              tasksDue: d.tasks?.due_today ?? 0,
            }}
            people={(d.young_people?.current ?? []).map((c) => ({
              id: String(c.id),
              name: String(c.preferred_name || c.first_name || "Child"),
            }))}
          />
        )}

        {/* Today band — who's on, what's next, the whole-home pulse, every child one tap away */}
        {d && (
          <TodayBand
            shifts={d.staffing?.today_shifts ?? []}
            childrenList={(d.young_people?.current ?? []).map((c) => ({
              id: String(c.id),
              name: String(c.preferred_name || c.first_name || "Child"),
            }))}
            showPulse={config.showZoneC}
          />
        )}

        {/* Detailed operational dashboard — collapsed by default so the command centre leads */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[13px] text-[var(--cs-text-secondary,#5a6d74)]">
            {showDetailed
              ? "Full operational dashboard — every card and zone."
              : "Your command centre leads with what needs you. The full dashboard is one tap away."}
          </p>
          <button
            type="button"
            onClick={() => setShowDetailed((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--cs-border)] bg-[var(--cs-surface-elevated,#fff)] px-4 py-2 text-[13px] font-semibold text-[var(--cs-navy,#12202b)] shadow-[var(--cs-shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--cs-shadow-card)]"
          >
            {showDetailed ? "Hide detailed dashboard ▴" : "Show detailed dashboard ▾"}
          </button>
        </div>

        {showDetailed && (
          <div className="cs-page-enter space-y-8">
        {/* Handover Prompt — contextual shift awareness */}
        {!config.showReadOnlyBanner && <HandoverPrompt />}

        {/* Your Handover — personalised catch-up based on last shift */}
        {!config.showReadOnlyBanner && <YourHandoverCard />}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ZONE A — WHAT NEEDS ATTENTION                                       */}
        {/* ════════════════════════════════════════════════════════════════════ */}

        <section aria-label="What Needs Attention">
          <ZoneHeader label={config.zoneALabel} description={config.zoneADescription} />

          {/* Action SLA breaches — overdue deadline-bound tasks from recorded events */}
          <div className="mt-3">
            <TaskSlaCard />
          </div>

          {/* Your plan today — the timed running order, surfaced where the day starts */}
          <div className="mt-3">
            <PlanTodayCard />
          </div>

          {/* This week — the next 7 days from the unified calendar (plan the day) */}
          <div className="mt-3">
            <UpcomingWeekCard />
          </div>

          {/* Read-only access banner */}
          {config.showReadOnlyBanner && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[--cs-info-soft] bg-[--cs-info-bg] px-5 py-3">
              <Eye className="h-5 w-5 text-[--cs-info] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[--cs-info]">Read-only access</p>
                <p className="text-xs text-[--cs-info] mt-0.5">You have view-only access to this dashboard. Contact a manager to make changes.</p>
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
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[--cs-success-soft] bg-[--cs-success-bg] px-5 py-4">
              <CheckCircle2 className="h-6 w-6 text-[--cs-success] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[--cs-success]">All clear — no immediate attention items</p>
                <p className="text-xs text-[--cs-success] mt-0.5">{`${homeName} is running smoothly. Keep it up.`}</p>
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
            submitted:      { label: "Submitted",         color: "bg-[--cs-info-bg] text-[--cs-info]",      icon: <Clock className="w-3 h-3" /> },
            routing:        { label: "Routing…",          color: "bg-indigo-50 text-indigo-700",  icon: <Activity className="w-3 h-3 animate-pulse" /> },
            routed:         { label: "Pending review",    color: "bg-[--cs-warning-bg] text-[--cs-warning]",    icon: <Clock className="w-3 h-3" /> },
            manager_review: { label: "Manager review",   color: "bg-orange-50 text-orange-700",  icon: <Eye className="w-3 h-3" /> },
            returned:       { label: "Returned",          color: "bg-[--cs-risk-bg] text-[--cs-risk]",        icon: <AlertCircle className="w-3 h-3" /> },
            verified:       { label: "Verified",          color: "bg-[--cs-success-bg] text-[--cs-success]",icon: <CheckCircle2 className="w-3 h-3" /> },
            locked:         { label: "Locked",            color: "bg-slate-50 text-slate-600",    icon: <CheckCheck className="w-3 h-3" /> },
            routing_failed: { label: "Routing failed",   color: "bg-[--cs-risk-bg] text-[--cs-risk]",        icon: <AlertTriangle className="w-3 h-3" /> },
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
                            <> · <span className="text-[--cs-success]">{event.routing_summary.records_updated} records updated</span></>
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
            "cs-stagger grid gap-3 mt-3",
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
                      <Link href="/rota" className="flex items-center gap-2 rounded-xl bg-[--cs-warning-bg] border border-[--cs-warning-soft] px-3 py-2.5 hover:bg-[--cs-warning-soft] transition-colors mt-1">
                        <UserX className="h-4 w-4 text-[--cs-warning] shrink-0" />
                        <span className="text-xs font-medium text-[--cs-warning]">{d!.staffing.open_shifts} open shift{d!.staffing.open_shifts > 1 ? "s" : ""} — assign staff</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[--cs-warning] ml-auto" />
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
                          <span className="text-[10px] font-medium text-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] rounded-full px-2 py-0.5">
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
                        <CheckCircle2 className="h-8 w-8 text-[--cs-success] mx-auto mb-2" />
                        <p className="text-sm font-medium text-[--cs-success]">
                          {config.personalTasksOnly ? "No outstanding tasks" : "All clear"}
                        </p>
                        <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                          {config.personalTasksOnly ? "Nothing assigned to you right now" : "No overdue or urgent tasks"}
                        </p>
                      </div>
                    )}
                    {(d?.tasks.completed_today ?? 0) > 0 && (
                      <div className="mt-3 pt-2 border-t border-[var(--cs-border-subtle)] flex items-center gap-2 px-2">
                        <CheckCheck className="h-3.5 w-3.5 text-[--cs-success]" />
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
                    <ShiftBriefingCard />
                    <ManagerPriorityBriefingCard />
                    <HomeSummaryReportCard />
                    <ChildReviewPackCard />
                    <HomeTrendsCard />
                    <ActionsRegisterCard />
                    <ComplaintsClockCard />
                    <PlanCurrencyCard />
                    <PremisesComplianceCard />
                    <ManagerIntelligenceBriefingCard />
                    <InspectionReadinessIntelligenceCard />
                    <StaffWellbeingIntelligenceCard />
                    <RiskIntelligenceDashboardCard />
                    <ManagerPracticeOversightCard />
                    <CaraTodayBriefing />
                    <CaraShiftSafety />
                    <CaraRegulatoryPulse />
                    <CaraRecordingQuality />
                    <CaraSupervisionIntelligence />
                    <CaraMedicationIntelligence />
                    <CaraStaffingAdequacy />
                    <CaraTrainingCompliance />
                    <CaraIncidentAnalysis />
                    <CaraDailyIntelligence />
                    <CaraDashboardPanel />
                    <HomeOfstedReadinessCompositeCard />
                    <HomeChildWellbeingCompositeCard />
                    <HomeWorkforceResilienceCompositeCard />
                    <HomeSafeguardingOversightCompositeCard />
                    <HomeRegulatoryComplianceCompositeCard />
                    <HomeQualityOfCareCompositeCard />
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
                    <ManagerInboxCard />
                    <EvidenceBankCard />
                    <ComplianceRulesCard />
                    <EventCaptureCard />
                    <WorkflowOrchestrationCard />
                    <DuplicateDetectionCard />
                    <ConflictDetectionCard />
                    <IntegrationHubCard />
                    <EventStreamCard />
                    <EventIntelligenceCard />
                    <EventRoutingCard />
                    <RecordingQualityScoreCard />
                    <StaffRecordingPracticeCard />
                    <RecordingQualityTrendCard />
                    <ChildPriorityCard />
                    <PlacementBreakdownForecastCard />
                    <MedicationErrorTrendsCard />
                    <ComplaintsIncidentCorrelationCard />
                    <StaffChildContinuityCard />
                    <BehaviourTriggerPatternsCard />
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
                    <HomeSpecializedHealthPlansIntelligenceCard />
                    <HomeEducationEngagementIntelligenceCard />
                    <HomeSafeguardingPreventionIntelligenceCard />
                    <HomeCommunicationContactIntelligenceCard />
                    <HomeStaffLifecycleIntelligenceCard />
                    <HomeFacilitiesComplianceIntelligenceCard />
                    <HomeTherapeuticProgressIntelligenceCard />
                    <HomeChildrensRightsParticipationIntelligenceCard />
                    <HomePlacementStabilityDepthIntelligenceCard />
                    <HomeCulturalIdentityIntelligenceCard />
                    <HomeIndependenceLifeSkillsIntelligenceCard />
                    <HomeEnrichmentAchievementIntelligenceCard />
                    <HomeLivingEnvironmentIntelligenceCard />
                    <HomeCommunityAccessIntelligenceCard />
                    <HomeNightCareSafetyIntelligenceCard />
                    <HomeSafeguardingDepthIntelligenceCard />
                    <HomeReg4445EvidenceIntelligenceCard />
                    <HomePlacementJourneyIntelligenceCard />
                    <HomeLifeStoryIdentityIntelligenceCard />
                    <HomeStrategicRiskIntelligenceCard />
                    <HomeBuildingOpsSafetyIntelligenceCard />
                    <HomeAccidentInjurySurveillanceIntelligenceCard />
                    <HomeStatutoryVisitComplianceIntelligenceCard />
                    <HomeBelongingPersonalPropertyIntelligenceCard />
                    <HomeCamhsSpecialistReferralIntelligenceCard />
                    <HomeConsentRightsLiteracyIntelligenceCard />
                    <HomeStaffReflectivePracticeIntelligenceCard />
                    <HomeSensoryTherapeuticEnvironmentIntelligenceCard />
                    <HomeDailyRoutineCareContinuityIntelligenceCard />
                    <HomeOutcomeStarNeedsIntelligenceCard />
                    <HomeInfectionControlHealthSafetyIntelligenceCard />
                    <HomeCaseFileAuditQualityIntelligenceCard />
                    <HomeStakeholderEngagementFeedbackIntelligenceCard />
                    <HomeFinancialLiteracyMoneyManagementIntelligenceCard />
                    <HomeSaferRecruitmentVettingIntelligenceCard />
                    <HomeLeavingCareTransitionIntelligenceCard />
                    <HomeGovernanceManagementOversightIntelligenceCard />
                    <HomeStaffCompetencyTrainingIntelligenceCard />
                    <HomeChildrensVoiceParticipationIntelligenceCard />
                    <HomeDigitalLiteracyOnlineSafetyIntelligenceCard />
                    <HomeTherapeuticWellbeingImpactIntelligenceCard />
                    <HomeLadoAllegationManagementIntelligenceCard />
                    <HomePlacementDisruptionPreventionIntelligenceCard />
                    <HomeLessonsLearnedImprovementIntelligenceCard />
                    <HomeDiversityInclusionEqualityIntelligenceCard />
                    <HomeLoneWorkingStaffSafetyIntelligenceCard />
                    <HomeFoodNutritionHygieneSafetyIntelligenceCard />
                    <HomeWhistleblowingTransparencyIntelligenceCard />
                    <HomeStaffDebriefEmotionalSupportIntelligenceCard />
                    <HomeAgencyStaffManagementIntelligenceCard />
                    <HomeHolidayEnrichingExperiencesIntelligenceCard />
                    <HomeQualityOfCareReviewIntelligenceCard />
                    <HomeTransportJourneySafetyIntelligenceCard />
                    <HomeManagementWalkroundOversightIntelligenceCard />
                    <HomePracticeObservationCompetencyIntelligenceCard />
                    <HomeHouseMeetingGovernanceIntelligenceCard />
                    <HomeStaffRecognitionMoraleIntelligenceCard />
                    <HomeCookingLifeSkillsIntelligenceCard />
                    <HomeSelfEvaluationImprovementIntelligenceCard />
                    <HomeNightHandoverQualityIntelligenceCard />
                    <HomeContextualSafeguardingIntelligenceCard />
                    <HomeHealthAppointmentContinuityIntelligenceCard />
                    <HomeReturnInterviewQualityIntelligenceCard />
                    <HomeFireDrillEmergencyPreparednessIntelligenceCard />
                    <HomeParentPartnershipEngagementIntelligenceCard />
                    <HomeAdvocacyIndependentVoiceIntelligenceCard />
                    <HomeSubstanceMisuseScreeningIntelligenceCard />
                    <HomeAnnualHealthAssessmentIntelligenceCard />
                    <HomePepEducationQualityIntelligenceCard />
                    <HomeSiblingContactProtocolIntelligenceCard />
                    <HomePlacementImpactAssessmentIntelligenceCard />
                    <HomeMultidisciplinaryFormulationIntelligenceCard />
                    <HomeSocialWorkerContactIntelligenceCard />
                    <HomeTraumaTherapyIntelligenceCard />
                    <HomeAttachmentProfileIntelligenceCard />
                    <HomeSelfHarmSafetyPlanIntelligenceCard />
                    <HomePostIncidentChildDebriefIntelligenceCard />
                    <HomeOutcomeStarAssessmentIntelligenceCard />
                    <HomeBehaviourSupportPlanIntelligenceCard />
                    <HomeContextualSafeguardingRiskIntelligenceCard />
                    <HomeRiskManagementPlanIntelligenceCard />
                    <HomeRestraintPhysicalInterventionIntelligenceCard />
                    <HomeMissingEpisodeIntelligenceCard />
                    <HomeSleepNightCareIntelligenceCard />
                    <HomeMedicationAdministrationIntelligenceCard />
                    <HomeWelfareCheckComplianceIntelligenceCard />
                    <HomeDeprivationOfLibertyIntelligenceCard />
                    <HomeSanctionRewardBalanceIntelligenceCard />
                    <HomeStaffDisciplinaryConductIntelligenceCard />
                    <HomeCareEventQualityIntelligenceCard />
                    <HomeStatutoryNotificationComplianceIntelligenceCard />
                    <HomeStaffPerformanceCompositeIntelligenceCard />
                    <HomeYoungPersonDailyWellbeingIntelligenceCard />
                    <HomeAutomationROIIntelligenceCard />
                    <HomeTaskActionCompletionIntelligenceCard />
                    <HomeProfessionalNetworkIntelligenceCard />
                    <HomeLocalitySafeguardingIntelligenceCard />
                    <HomeRecruitmentAuditTrailIntelligenceCard />
                    <HomeFilingEvidenceGovernanceIntelligenceCard />
                    <HomeIndependenceSkillsReadinessIntelligenceCard />
                    <HomeCaraContentQualityIntelligenceCard />
                    <HomeNotificationResponsivenessIntelligenceCard />
                    <HomeHolisticChildProgressIntelligenceCard />
                    <HomeInformationFlowQualityIntelligenceCard />
                    <HomeRegulatoryEvidenceCompletenessIntelligenceCard />
                    <HomeFamilySocialConnectivityIntelligenceCard />
                    <HomeEmotionalSafetyClimateIntelligenceCard />
                    <HomeStaffInductionOnboardingIntelligenceCard />
                    <HomeLivingEnvironmentStandardsIntelligenceCard />
                    <HomeHealthWellbeingOversightIntelligenceCard />
                    <HomeCulturalIdentityDiversityIntelligenceCard />
                    <HomeNightCareQualityIntelligenceCard />
                    <HomeComplaintAdvocacyResponsivenessIntelligenceCard />
                    <HomeMedicationSafetyComplianceIntelligenceCard />
                    <HomeTransportVehicleSafetyIntelligenceCard />
                    <HomeTransitionLeavingCareReadinessIntelligenceCard />
                    <HomeStaffSupervisionReflectivePracticeIntelligenceCard />
                    <HomeEmergencyPreparednessContinuityIntelligenceCard />
                    <HomePeerRelationshipSocialDevelopmentIntelligenceCard />
                    <HomeDigitalSafetyOnlineProtectionIntelligenceCard />
                    <HomeTherapeuticInterventionEffectivenessIntelligenceCard />
                    <HomeNutritionDietaryManagementIntelligenceCard />
                    <HomeParentalContactFamilyEngagementIntelligenceCard />
                    <HomeStaffTrainingCpdComplianceIntelligenceCard />
                    <HomePhysicalActivityRecreationIntelligenceCard />
                    <HomeEnvironmentalSustainabilityEcoAwarenessIntelligenceCard />
                    <HomeSensoryAccessibilitySupportIntelligenceCard />
                    <HomeSleepQualityRestManagementIntelligenceCard />
                    <HomeReligiousSpiritualWellbeingIntelligenceCard />
                    <HomeVisitorManagementSecurityIntelligenceCard />
                    <HomeKeyWorkerRelationshipQualityIntelligenceCard />
                    <HomeBehaviourSupportPlanEffectivenessIntelligenceCard />
                    <HomePocketMoneyFinancialLiteracyIntelligenceCard />
                    <HomeIndependenceLifeSkillsDevelopmentIntelligenceCard />
                    <HomeMultiAgencyCollaborationIntelligenceCard />
                    <HomeStaffWellbeingRetentionIntelligenceCard />
                    <HomePlacementStabilityPermanenceIntelligenceCard />
                    <HomeRecordKeepingDocumentationQualityIntelligenceCard />
                    <HomeClothingPersonalPossessionsIntelligenceCard />
                    <HomeCommunicationLanguageSupportIntelligenceCard />
                    <HomeHomeworkAcademicSupportIntelligenceCard />
                    <HomeConsentCapacityManagementIntelligenceCard />
                    <HomeFireSafetyEmergencyDrillIntelligenceCard />
                    <HomeInfectionPreventionControlIntelligenceCard />
                    <HomePrivacyDignityIntelligenceCard />
                    <HomeAllegationsInvestigationsManagementIntelligenceCard />
                    <HomeAdmissionsMatchingAssessmentIntelligenceCard />
                    <HomeDailyRoutineStructureIntelligenceCard />
                    <HomeOutdoorNatureEngagementIntelligenceCard />
                    <HomeCulturalEventsCelebrationsIntelligenceCard />
                    <HomeWaterSafetyHydrationIntelligenceCard />
                    <HomeDentalOralHealthIntelligenceCard />
                    <HomeTechnologyDigitalInclusionIntelligenceCard />
                    <HomeGriefBereavementSupportIntelligenceCard />
                    <HomeSubstanceMisusePreventionIntelligenceCard />
                    <HomeYouthJusticeOffendingIntelligenceCard />
                    <HomePositiveIdentitySelfEsteemIntelligenceCard />
                    <HomePetAnimalTherapyIntelligenceCard />
                    <HomeSiblingContactRelationshipsIntelligenceCard />
                    <HomeStaffRotaAdequateStaffingIntelligenceCard />
                    <HomeWhistleblowingSafeguardingCultureIntelligenceCard />
                    <HomeAnxietyMentalHealthScreeningIntelligenceCard />
                    <HomeMinorRepairsMaintenanceIntelligenceCard />
                    <HomeCommunityIntegrationVolunteeringIntelligenceCard />
                    <HomePersonalCalendarAppointmentsIntelligenceCard />
                    <HomeHobbiesInterestsDevelopmentIntelligenceCard />
                    <HomeContinencePersonalHygieneSupportIntelligenceCard />
                    <HomeRewardsIncentivesManagementIntelligenceCard />
                    <HomeStaffDebriefingCriticalIncidentSupportIntelligenceCard />
                    <HomeSensoryDietRegulationIntelligenceCard />
                    <HomeEthnicHairSkincareIntelligenceCard />
                    <HomeHolidayTripPlanningIntelligenceCard />
                    <HomeRestorativePracticeConflictResolutionIntelligenceCard />
                    <HomeSexualHealthRseEducationIntelligenceCard />
                    <HomeNoiseSoundManagementIntelligenceCard />
                    <HomeStaffPerformanceAppraisalIntelligenceCard />
                    <HomeAdvocacyIndependentVisitorIntelligenceCard />
                    <HomeEmotionalLiteracyFeelingsExpressionIntelligenceCard />
                    <HomeSavingsBankingSkillsIntelligenceCard />
                    <HomeHazardNearMissReportingIntelligenceCard />
                    <HomeMenstruationPubertySupportIntelligenceCard />
                    <HomeEyeHealthVisionCareIntelligenceCard />
                    <HomeAsthmaRespiratoryManagementIntelligenceCard />
                    <HomeLaundryLinenManagementIntelligenceCard />
                    <HomeBirthdaySpecialOccasionCelebrationIntelligenceCard />
                    <HomeFriendshipSocialNetworkIntelligenceCard />
                    <HomeCctvSurveillanceGovernanceIntelligenceCard />
                    <HomePocketMoneyAuditReconciliationIntelligenceCard />
                    <HomeImmunisationVaccinationComplianceIntelligenceCard />
                    <HomeFurnitureRoomPersonalisationIntelligenceCard />
                    <HomeCookingKitchenSkillsIntelligenceCard />
                    <HomeBedwettingEnuresisSupportIntelligenceCard />
                    <HomeStaffLoneWorkingSafetyIntelligenceCard />
                    <HomeTeethBrushingOralRoutineIntelligenceCard />
                    <HomeGardenOutdoorSpaceMaintenanceIntelligenceCard />
                    <HomeEmergencyContactNextOfKinIntelligenceCard />
                    <HomeWeeklyPlannerActivityScheduleIntelligenceCard />
                    <HomeDbsRenewalStaffVettingIntelligenceCard />
                    <HomeChildVoiceParticipationIntelligenceCard />
                    <HomeAromatherapyWellbeingTherapiesIntelligenceCard />
                    <HomePestControlHygieneComplianceIntelligenceCard />
                    <HomeMissingPersonAbsentAuthorityIntelligenceCard />
                    <HomeBedroomTemperatureVentilationIntelligenceCard />
                    <HomeHomeworkEnvironmentStudySpaceIntelligenceCard />
                    <HomeWeightManagementHealthyEatingIntelligenceCard />
                    <HomeFirstAidKitMedicalSuppliesIntelligenceCard />
                    <HomeKeyholdingAccessControlIntelligenceCard />
                    <HomeHandoverCommunicationQualityIntelligenceCard />
                    <HomeClothingLabellingStorageIntelligenceCard />
                    <HomeElectricityGasSafetyIntelligenceCard />
                    <HomeBathroomShowerFacilitiesIntelligenceCard />
                    <HomeMobilePhoneScreenTimeIntelligenceCard />
                    <HomePocketMoneyDistributionEquityIntelligenceCard />
                    <HomeAllergyManagementFoodSafetyIntelligenceCard />
                    <HomeBathroomAccessibilityAdaptationsIntelligenceCard />
                    <HomeUtilityBillsCostManagementIntelligenceCard />
                    <HomeNeighbourhoodSafetyRiskAssessmentIntelligenceCard />
                    <HomeWashingMachineDryerMaintenanceIntelligenceCard />
                    <HomeItEquipmentConnectivityIntelligenceCard />
                    <HomeWindowBlindCurtainSafetyIntelligenceCard />
                    <HomeSharpsDisposalHazardousWasteIntelligenceCard />
                    <HomeReg4445QualityAssuranceReportingIntelligenceCard />
                    <HomeDampMouldManagementIntelligenceCard />
                    <HomeFoodStorageRefrigerationSafetyIntelligenceCard />
                    <HomeSlipsTripsFallsPreventionIntelligenceCard />
                    <HomeBoilerHeatingSystemServicingIntelligenceCard />
                    <HomeStatementPurposeChildrenGuideIntelligenceCard />
                    <HomePolicyReviewCycleComplianceIntelligenceCard />
                    <HomeDataProtectionGdprComplianceIntelligenceCard />
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
                healthCheck.isLoading ? <CardSkeleton rows={4} /> : hc?.assessed === false ? (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-[13px]">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        Home Health Check
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium text-[var(--cs-navy)]">No data yet</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--cs-text-secondary)]">
                        {hc.note ?? "The home health score appears once children and daily records are added."}
                      </p>
                    </CardContent>
                  </Card>
                ) : hc ? (
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
                          <Eye className="h-4 w-4 text-[var(--cs-cara-gold)]" />
                          Oversight Queue
                        </CardTitle>
                        <Link href="/incidents" className="text-[11px] text-blue-600 hover:underline">All incidents →</Link>
                      </div>
                      {(d?.incidents.awaiting_oversight ?? 0) > 0 && (
                        <p className="text-[11px] text-[var(--cs-cara-gold)] font-medium mt-1">
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
                          <Shield className="h-8 w-8 text-[--cs-success] mx-auto mb-2" />
                          <p className="text-sm font-medium text-[--cs-success]">All incidents overseen</p>
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
                            <div className="rounded-xl bg-[--cs-risk-bg] p-2.5">
                              <p className="text-xl font-bold text-[--cs-risk] tabular-nums">{d?.compliance.training_expired ?? 0}</p>
                              <p className="text-[10px] text-[--cs-risk]">Expired</p>
                            </div>
                            <div className="rounded-xl bg-[--cs-warning-bg] p-2.5">
                              <p className="text-xl font-bold text-[--cs-warning] tabular-nums">{d?.compliance.training_expiring ?? 0}</p>
                              <p className="text-[10px] text-[--cs-warning]">Expiring</p>
                            </div>
                            <div className="rounded-xl bg-[--cs-info-bg] p-2.5">
                              <p className="text-xl font-bold text-[--cs-info] tabular-nums">{d?.compliance.cert_warnings ?? 0}</p>
                              <p className="text-[10px] text-[--cs-info]">Warnings</p>
                            </div>
                          </div>
                          {(d?.compliance.cert_warnings_list?.length ?? 0) > 0 && (
                            <div className="mt-3 space-y-1">
                              {d!.compliance.cert_warnings_list.slice(0, 3).map((w, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px] text-[var(--cs-text-secondary)]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[--cs-warning] shrink-0" />
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
                              <span className={cn("text-[10px] font-medium", overdue > 0 ? "text-[--cs-risk]" : due > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>
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
                  <WorkforceSummaryCard />
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

        {/* Cara anchor for oversight scroll target */}
        <div id="cara-anchor" />
          </div>
        )}

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
