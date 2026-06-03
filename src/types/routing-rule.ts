// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EVENT ROUTING RULES
//
// The "link intelligently" pillar of the core rule. A RoutingRule decides which
// surfaces a CornerstoneEvent flows to (child profile, risk assessment, care plan,
// manager inbox, QA / Reg 45 evidence, notification centre, external APIs), and
// whether that routing needs a human to approve it first.
//
// SAFETY: external API routing (Ofsted, Police, LADO, Virtual School…) is a
// side-effectful action. The routing engine produces a PLAN only — external
// destinations are always gated behind human approval and never fired
// automatically.
// ══════════════════════════════════════════════════════════════════════════════

export type RoutingConditionField =
  | "eventType"
  | "riskLevel"
  | "requiresApproval"
  | "tag"
  | "complianceFlags"
  | "childId"
  | "staffId";

export type RoutingConditionOp = "eq" | "neq" | "gte" | "in" | "includes" | "exists";

export interface RoutingCondition {
  field: RoutingConditionField;
  op: RoutingConditionOp;
  value?: unknown;
}

export interface RouteTargets {
  dashboard?: boolean;
  handover?: boolean;
  childProfile?: boolean;
  staffProfile?: boolean;
  riskAssessment?: boolean;
  carePlan?: boolean;
  managerInbox?: boolean;
  qaEvidenceBank?: boolean;
  reg45Evidence?: boolean;
  notificationCentre?: boolean;
  externalApi?: string[];
}

export type RoutingRule = {
  eventType: string; // a CornerstoneEventType, or "*" for any
  conditions: RoutingCondition[];
  routeTo: RouteTargets;
  requiresHumanApproval: boolean;
};

/** The internal (in-app) surfaces an event can route to. */
export const INTERNAL_DESTINATIONS = [
  "dashboard",
  "handover",
  "childProfile",
  "staffProfile",
  "riskAssessment",
  "carePlan",
  "managerInbox",
  "qaEvidenceBank",
  "reg45Evidence",
  "notificationCentre",
] as const;

export type InternalDestination = (typeof INTERNAL_DESTINATIONS)[number];
