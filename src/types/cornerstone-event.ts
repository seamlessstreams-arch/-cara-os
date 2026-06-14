// ══════════════════════════════════════════════════════════════════════════════
// CARA — CANONICAL EVENT MODEL
//
// The single, unified shape every domain event normalises into — the backbone of
// the core rule: "capture once, link intelligently, surface everywhere, never
// duplicate". Incidents, daily logs, missing episodes, medication errors,
// restraints, key-working, education, supervision (and more) all project into a
// CornerstoneEvent, so one stream, one timeline and one set of intelligence can
// reason across everything that happens in a home.
// ══════════════════════════════════════════════════════════════════════════════

export type CornerstoneEventType =
  | "daily_log"
  | "incident"
  | "safeguarding"
  | "medication"
  | "missing"
  | "physical_intervention"
  | "keywork"
  | "education"
  | "health"
  | "complaint"
  | "family_contact"
  | "risk_assessment"
  | "lac_review"
  | "notifiable_event"
  | "behaviour_support_plan"
  | "staff_absence"
  | "overtime"
  | "supervision"
  | "maintenance"
  | "qa_check"
  | "reg44"
  | "reg45";

export type CornerstoneRiskLevel = "low" | "medium" | "high" | "critical";
export type CornerstoneApprovalLevel = "team_leader" | "deputy" | "manager" | "ri";

export interface CornerstoneCaraAnalysis {
  themes: string[];
  suggestedActions: string[];
  complianceFlags: string[];
  missingInformation: string[];
  confidenceScore: number; // 0-1
}

export interface CornerstoneEventChange {
  at: string;
  by: string;
  field: string;
  from: unknown;
  to: unknown;
}

export interface CornerstoneAudit {
  createdAt: string;
  updatedAt: string;
  version: number;
  changeHistory: CornerstoneEventChange[];
}

export interface CornerstoneEvent {
  id: string;
  eventType: CornerstoneEventType;

  homeId: string;
  childId?: string;
  staffId?: string;
  shiftId?: string;

  occurredAt: string;
  createdBy: string;

  summary: string;
  structuredTags: string[];
  /** Ofsted evidence categories this event contributes to (populated by the projector). */
  evidenceCategories?: string[];

  riskLevel: CornerstoneRiskLevel;
  requiresApproval: boolean;
  approvalLevel?: CornerstoneApprovalLevel;

  linkedDocuments: string[];
  linkedTasks: string[];
  linkedRisks: string[];
  linkedNotifications: string[];

  caraAnalysis?: CornerstoneCaraAnalysis;

  audit: CornerstoneAudit;
}
