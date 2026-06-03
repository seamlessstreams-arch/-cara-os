"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DASHBOARD CARD REGISTRY
// Shared dynamic imports of the spine-derived intelligence cards, so the named
// role dashboards compose them without duplicating summaries. Every card here
// computes from the Event Spine / its engine (not hand-maintained data).
// ══════════════════════════════════════════════════════════════════════════════

import dynamic from "next/dynamic";

const d = <T extends Record<string, any>>(loader: () => Promise<T>, key: string) =>
  dynamic(() => loader().then((m) => ({ default: m[key] })), { ssr: false });

// Spine + automation
export const ManagerInbox = d(() => import("@/components/dashboard/manager-inbox-card"), "ManagerInboxCard");
export const EvidenceBank = d(() => import("@/components/dashboard/evidence-bank-card"), "EvidenceBankCard");
export const ComplianceRules = d(() => import("@/components/dashboard/compliance-rules-card"), "ComplianceRulesCard");
export const WorkflowOrchestration = d(() => import("@/components/dashboard/workflow-orchestration-card"), "WorkflowOrchestrationCard");
export const EventIntelligence = d(() => import("@/components/dashboard/event-intelligence-card"), "EventIntelligenceCard");
export const EventStream = d(() => import("@/components/dashboard/event-stream-card"), "EventStreamCard");
export const EventRouting = d(() => import("@/components/dashboard/event-routing-card"), "EventRoutingCard");
export const EventCapture = d(() => import("@/components/dashboard/event-capture-card"), "EventCaptureCard");
export const DuplicateDetection = d(() => import("@/components/dashboard/duplicate-detection-card"), "DuplicateDetectionCard");
export const ConflictDetection = d(() => import("@/components/dashboard/conflict-detection-card"), "ConflictDetectionCard");
export const IntegrationHub = d(() => import("@/components/dashboard/integration-hub-card"), "IntegrationHubCard");

// Per-child intelligence
export const ChildPriority = d(() => import("@/components/dashboard/child-priority-card"), "ChildPriorityCard");
export const PlacementForecast = d(() => import("@/components/dashboard/placement-breakdown-forecast-card"), "PlacementBreakdownForecastCard");
export const MedicationTrends = d(() => import("@/components/dashboard/medication-error-trends-card"), "MedicationErrorTrendsCard");
export const ComplaintsCorrelation = d(() => import("@/components/dashboard/complaints-incident-correlation-card"), "ComplaintsIncidentCorrelationCard");
export const Continuity = d(() => import("@/components/dashboard/staff-child-continuity-card"), "StaffChildContinuityCard");
export const BehaviourTriggers = d(() => import("@/components/dashboard/behaviour-trigger-patterns-card"), "BehaviourTriggerPatternsCard");

// Recording quality
export const RecordingQuality = d(() => import("@/components/dashboard/recording-quality-score-card"), "RecordingQualityScoreCard");
export const StaffRecordingPractice = d(() => import("@/components/dashboard/staff-recording-practice-card"), "StaffRecordingPracticeCard");
export const RecordingQualityTrend = d(() => import("@/components/dashboard/recording-quality-trend-card"), "RecordingQualityTrendCard");
