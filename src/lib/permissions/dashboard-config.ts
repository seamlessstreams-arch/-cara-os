// ══════════════════════════════════════════════════════════════════════════════
// Cara Permission System — Role-Based Dashboard Configuration
//
// Defines which dashboard sections, widgets, and navigation items each role
// can see. Consumed by the dashboard layout to render role-appropriate views.
//
// Principle: "Every user should only see what they need to safely do their role."
//
// No AI. No external calls. Pure configuration.
// ══════════════════════════════════════════════════════════════════════════════

import type { Role } from "./types";

// ── Widget Types ───────────────────────────────────────────────────────────

export type DashboardWidget =
  | "my_tasks"
  | "shift_checklist"
  | "handover_prompt"
  | "young_people_strip"
  | "activity_feed"
  | "quick_actions"
  | "medication_status"
  | "night_summary"
  | "concern_escalation"
  | "approval_queue"
  | "lifecycle_compliance"
  | "team_tasks"
  | "supervision_tracker"
  | "training_compliance"
  | "staffing_coverage"
  | "key_dates"
  | "document_signoff"
  | "incident_trends"
  | "recruitment_pipeline"
  | "young_people_risk"
  | "care_plan_compliance"
  | "outcomes_summary"
  | "governance_score"
  | "ri_alerts"
  | "leave_overview"
  | "daily_log_summary"
  | "environment_status"
  | "cara_intelligence"
  | "cara_briefing"
  | "cara_regulatory_pulse"
  | "cara_recording_quality"
  | "cara_shift_safety"
  | "qa_metrics"
  | "filing_status"
  | "escalation_tracker"
  | "cross_home_overview"
  | "provider_kpi";

// ── Navigation Items ───────────────────────────────────────────────────────

export type NavSection =
  | "dashboard"
  | "my_work"
  | "children"
  | "staff"
  | "quality"
  | "control_centre"
  | "reporting"
  | "settings"
  | "hr"
  | "recruitment"
  | "filing_cabinet"
  | "audit"
  | "provider_overview";

// ── Role Dashboard Configuration ───────────────────────────────────────────

export interface RoleDashboardConfig {
  role: Role;
  dashboardTitle: string;
  primaryWidgets: DashboardWidget[];    // main content area
  secondaryWidgets: DashboardWidget[];  // sidebar/lower priority
  navSections: NavSection[];
  features: {
    canViewControlCentre: boolean;
    canViewApprovalQueue: boolean;
    canViewAuditLog: boolean;
    canViewFilingCabinet: boolean;
    canManageTemplates: boolean;
    canViewCrossHome: boolean;
    canViewStaffRecords: boolean;
    canExportData: boolean;
    canViewQAMetrics: boolean;
  };
}

// ── Configuration Map ──────────────────────────────────────────────────────

export const DASHBOARD_CONFIG: Record<string, RoleDashboardConfig> = {
  // ── RSW (Residential Social Worker) ───────────────────────────────
  rsw: {
    role: "rsw",
    dashboardTitle: "My Shift",
    primaryWidgets: [
      "my_tasks",
      "shift_checklist",
      "young_people_strip",
      "handover_prompt",
      "medication_status",
    ],
    secondaryWidgets: [
      "activity_feed",
      "quick_actions",
      "concern_escalation",
      "key_dates",
    ],
    navSections: ["dashboard", "my_work", "children"],
    features: {
      canViewControlCentre: false,
      canViewApprovalQueue: false,
      canViewAuditLog: false,
      canViewFilingCabinet: false,
      canManageTemplates: false,
      canViewCrossHome: false,
      canViewStaffRecords: false,
      canExportData: false,
      canViewQAMetrics: false,
    },
  },

  // ── Senior RSW ────────────────────────────────────────────────────
  senior_rsw: {
    role: "senior_rsw",
    dashboardTitle: "My Shift",
    primaryWidgets: [
      "my_tasks",
      "shift_checklist",
      "young_people_strip",
      "handover_prompt",
      "medication_status",
      "team_tasks",
    ],
    secondaryWidgets: [
      "activity_feed",
      "quick_actions",
      "concern_escalation",
      "key_dates",
      "daily_log_summary",
    ],
    navSections: ["dashboard", "my_work", "children"],
    features: {
      canViewControlCentre: false,
      canViewApprovalQueue: false,
      canViewAuditLog: false,
      canViewFilingCabinet: false,
      canManageTemplates: false,
      canViewCrossHome: false,
      canViewStaffRecords: false,
      canExportData: false,
      canViewQAMetrics: false,
    },
  },

  // ── Team Leader ───────────────────────────────────────────────────
  team_leader: {
    role: "team_leader",
    dashboardTitle: "Team Overview",
    primaryWidgets: [
      "approval_queue",
      "team_tasks",
      "escalation_tracker",
      "young_people_strip",
      "supervision_tracker",
      "staffing_coverage",
    ],
    secondaryWidgets: [
      "lifecycle_compliance",
      "training_compliance",
      "incident_trends",
      "key_dates",
      "daily_log_summary",
      "activity_feed",
    ],
    navSections: ["dashboard", "my_work", "children", "staff", "quality"],
    features: {
      canViewControlCentre: false,
      canViewApprovalQueue: true,
      canViewAuditLog: false,
      canViewFilingCabinet: true,
      canManageTemplates: false,
      canViewCrossHome: false,
      canViewStaffRecords: false,
      canExportData: false,
      canViewQAMetrics: false,
    },
  },

  // ── Deputy Manager ────────────────────────────────────────────────
  deputy_manager: {
    role: "deputy_manager",
    dashboardTitle: "Home Management",
    primaryWidgets: [
      "approval_queue",
      "lifecycle_compliance",
      "escalation_tracker",
      "qa_metrics",
      "young_people_risk",
      "staffing_coverage",
    ],
    secondaryWidgets: [
      "supervision_tracker",
      "training_compliance",
      "incident_trends",
      "recruitment_pipeline",
      "care_plan_compliance",
      "filing_status",
      "cara_intelligence",
    ],
    navSections: ["dashboard", "my_work", "children", "staff", "quality", "filing_cabinet", "reporting"],
    features: {
      canViewControlCentre: false,
      canViewApprovalQueue: true,
      canViewAuditLog: true,
      canViewFilingCabinet: true,
      canManageTemplates: false,
      canViewCrossHome: false,
      canViewStaffRecords: true,
      canExportData: true,
      canViewQAMetrics: true,
    },
  },

  // ── Registered Manager ────────────────────────────────────────────
  registered_manager: {
    role: "registered_manager",
    dashboardTitle: "Home Control Centre",
    primaryWidgets: [
      "approval_queue",
      "lifecycle_compliance",
      "escalation_tracker",
      "qa_metrics",
      "governance_score",
      "cara_regulatory_pulse",
    ],
    secondaryWidgets: [
      "young_people_risk",
      "outcomes_summary",
      "staffing_coverage",
      "training_compliance",
      "recruitment_pipeline",
      "incident_trends",
      "care_plan_compliance",
      "filing_status",
      "cara_intelligence",
      "cara_recording_quality",
    ],
    navSections: ["dashboard", "my_work", "children", "staff", "quality", "control_centre", "filing_cabinet", "reporting", "hr", "recruitment", "audit"],
    features: {
      canViewControlCentre: true,
      canViewApprovalQueue: true,
      canViewAuditLog: true,
      canViewFilingCabinet: true,
      canManageTemplates: true,
      canViewCrossHome: false,
      canViewStaffRecords: true,
      canExportData: true,
      canViewQAMetrics: true,
    },
  },

  // ── Operations Manager ────────────────────────────────────────────
  operations_manager: {
    role: "operations_manager",
    dashboardTitle: "Operations Overview",
    primaryWidgets: [
      "cross_home_overview",
      "lifecycle_compliance",
      "escalation_tracker",
      "governance_score",
      "provider_kpi",
      "qa_metrics",
    ],
    secondaryWidgets: [
      "approval_queue",
      "young_people_risk",
      "staffing_coverage",
      "training_compliance",
      "recruitment_pipeline",
      "incident_trends",
      "cara_intelligence",
      "cara_regulatory_pulse",
    ],
    navSections: ["dashboard", "children", "staff", "quality", "control_centre", "filing_cabinet", "reporting", "hr", "recruitment", "audit", "provider_overview"],
    features: {
      canViewControlCentre: true,
      canViewApprovalQueue: true,
      canViewAuditLog: true,
      canViewFilingCabinet: true,
      canManageTemplates: true,
      canViewCrossHome: true,
      canViewStaffRecords: true,
      canExportData: true,
      canViewQAMetrics: true,
    },
  },

  // ── Responsible Individual ────────────────────────────────────────
  responsible_individual: {
    role: "responsible_individual",
    dashboardTitle: "Provider Oversight",
    primaryWidgets: [
      "cross_home_overview",
      "governance_score",
      "provider_kpi",
      "ri_alerts",
      "lifecycle_compliance",
      "qa_metrics",
    ],
    secondaryWidgets: [
      "escalation_tracker",
      "incident_trends",
      "young_people_risk",
      "outcomes_summary",
      "staffing_coverage",
      "cara_regulatory_pulse",
      "cara_intelligence",
    ],
    navSections: ["dashboard", "children", "staff", "quality", "control_centre", "filing_cabinet", "reporting", "hr", "recruitment", "audit", "provider_overview", "settings"],
    features: {
      canViewControlCentre: true,
      canViewApprovalQueue: true,
      canViewAuditLog: true,
      canViewFilingCabinet: true,
      canManageTemplates: true,
      canViewCrossHome: true,
      canViewStaffRecords: true,
      canExportData: true,
      canViewQAMetrics: true,
    },
  },

  // ── Waking Night Staff ────────────────────────────────────────────
  waking_night: {
    role: "waking_night",
    dashboardTitle: "Night Shift",
    primaryWidgets: [
      "my_tasks",
      "shift_checklist",
      "night_summary",
      "young_people_strip",
      "medication_status",
    ],
    secondaryWidgets: [
      "concern_escalation",
      "quick_actions",
      "activity_feed",
    ],
    navSections: ["dashboard", "my_work", "children"],
    features: {
      canViewControlCentre: false,
      canViewApprovalQueue: false,
      canViewAuditLog: false,
      canViewFilingCabinet: false,
      canManageTemplates: false,
      canViewCrossHome: false,
      canViewStaffRecords: false,
      canExportData: false,
      canViewQAMetrics: false,
    },
  },

  // ── Agency Staff ──────────────────────────────────────────────────
  agency_staff: {
    role: "agency_staff",
    dashboardTitle: "My Shift",
    primaryWidgets: [
      "my_tasks",
      "shift_checklist",
      "young_people_strip",
    ],
    secondaryWidgets: [
      "quick_actions",
      "concern_escalation",
    ],
    navSections: ["dashboard", "my_work"],
    features: {
      canViewControlCentre: false,
      canViewApprovalQueue: false,
      canViewAuditLog: false,
      canViewFilingCabinet: false,
      canManageTemplates: false,
      canViewCrossHome: false,
      canViewStaffRecords: false,
      canExportData: false,
      canViewQAMetrics: false,
    },
  },
};

// ── Helper: Get Config by Role ─────────────────────────────────────────────

export function getDashboardConfig(role: Role): RoleDashboardConfig {
  return DASHBOARD_CONFIG[role] ?? DASHBOARD_CONFIG.rsw;
}

// ── Helper: Check Feature Access ───────────────────────────────────────────

export function hasFeature(
  role: Role,
  feature: keyof RoleDashboardConfig["features"],
): boolean {
  const config = getDashboardConfig(role);
  return config.features[feature];
}

// ── Helper: Get Nav Sections ───────────────────────────────────────────────

export function getNavSections(role: Role): NavSection[] {
  const config = getDashboardConfig(role);
  return config.navSections;
}

// ── Helper: Get All Widgets for Role ───────────────────────────────────────

export function getAllWidgets(role: Role): DashboardWidget[] {
  const config = getDashboardConfig(role);
  return [...config.primaryWidgets, ...config.secondaryWidgets];
}
