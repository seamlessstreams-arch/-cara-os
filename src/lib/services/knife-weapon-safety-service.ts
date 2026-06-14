// ==============================================================================
// CARA -- KNIFE & WEAPON SAFETY SERVICE
// Tracks kitchen knife audits, sharp object checks, weapon incidents,
// bedroom searches (with consent), communal area checks, risk assessments,
// educational sessions, policy reviews, Reg 40 notifications, and
// compliance status for premises safety in residential children's homes.
//
// Covers: Kitchen knife accountability and counting, sharp object security,
// tool storage checks, bedroom searches with consent documentation,
// communal area inspections, incident recording (weapon found, threat with
// weapon, weapon brought in), educational session delivery, environmental
// changes, police notification, Reg 40 Ofsted notification for serious
// events, compliance tracking, and audit scheduling.
//
// UK Regulatory Framework:
// CHR 2015 Reg 12 (protection of children from harm),
// CHR 2015 Reg 25 (premises safety — suitable, safe, well-maintained),
// Offensive Weapons Act 2019 (knife/weapon possession),
// Serious Violence Duty 2022 (local authorities),
// Knife Crime Prevention Orders (KCPO),
// CHR 2015 Reg 40 (notification of serious events to Ofsted).
//
// SCCIF: Safety — "The home manages risks from weapons effectively.
// Kitchen knives are accounted for, sharp objects are secured, tool
// storage is locked, and there are clear protocols for responding to
// weapon-related incidents. Staff deliver proactive educational sessions
// on knife and weapon safety. Ofsted is notified promptly of serious
// events under Reg 40."
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RECORD_TYPES = [
  "Kitchen Knife Audit",
  "Sharp Object Check",
  "Bedroom Search — with consent",
  "Communal Area Check",
  "Risk Assessment",
  "Incident — Weapon Found",
  "Incident — Threat with Weapon",
  "Incident — Weapon Brought In",
  "Educational Session",
  "Policy Review",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const RISK_LEVELS = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Action Required",
  "Under Review",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const INCIDENT_TYPES: RecordType[] = [
  "Incident — Weapon Found",
  "Incident — Threat with Weapon",
  "Incident — Weapon Brought In",
];

export const AUDIT_TYPES: RecordType[] = [
  "Kitchen Knife Audit",
  "Sharp Object Check",
  "Communal Area Check",
];

export const SEARCH_TYPES: RecordType[] = [
  "Bedroom Search — with consent",
];

// -- Label maps ---------------------------------------------------------------

export const RECORD_TYPE_LABELS: { type: RecordType; label: string }[] = [
  { type: "Kitchen Knife Audit", label: "Kitchen Knife Audit" },
  { type: "Sharp Object Check", label: "Sharp Object Check" },
  { type: "Bedroom Search — with consent", label: "Bedroom Search (with consent)" },
  { type: "Communal Area Check", label: "Communal Area Check" },
  { type: "Risk Assessment", label: "Risk Assessment" },
  { type: "Incident — Weapon Found", label: "Incident — Weapon Found" },
  { type: "Incident — Threat with Weapon", label: "Incident — Threat with Weapon" },
  { type: "Incident — Weapon Brought In", label: "Incident — Weapon Brought In" },
  { type: "Educational Session", label: "Educational Session" },
  { type: "Policy Review", label: "Policy Review" },
];

export const RISK_LEVEL_LABELS: { level: RiskLevel; label: string }[] = [
  { level: "Low", label: "Low Risk" },
  { level: "Medium", label: "Medium Risk" },
  { level: "High", label: "High Risk" },
  { level: "Critical", label: "Critical Risk" },
];

export const COMPLIANCE_STATUS_LABELS: { status: ComplianceStatus; label: string }[] = [
  { status: "Compliant", label: "Compliant" },
  { status: "Non-Compliant", label: "Non-Compliant" },
  { status: "Action Required", label: "Action Required" },
  { status: "Under Review", label: "Under Review" },
];

// -- Row type -----------------------------------------------------------------

export interface KnifeWeaponSafetyRow {
  id: string;
  home_id: string;
  record_date: string;
  recorded_by: string;
  record_type: RecordType;
  child_name: string | null;
  weapon_type: string | null;
  location_found: string | null;
  risk_level: RiskLevel;
  kitchen_knives_accounted_for: boolean;
  kitchen_knife_count: number | null;
  sharp_objects_secured: boolean;
  tool_storage_locked: boolean;
  search_consent_obtained: boolean | null;
  police_notified: boolean;
  social_worker_informed: boolean;
  reg_40_notification: boolean;
  parent_carer_informed: boolean;
  child_safety_plan_updated: boolean;
  environmental_changes_made: string | null;
  educational_content_delivered: boolean;
  next_audit_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateKnifeWeaponSafety(input: {
  recordDate?: string;
  recordedBy?: string;
  recordType?: string;
  childName?: string | null;
  weaponType?: string | null;
  locationFound?: string | null;
  riskLevel?: string;
  kitchenKnifeCount?: number | null;
  searchConsentObtained?: boolean | null;
  policeNotified?: boolean;
  reg40Notification?: boolean;
  complianceStatus?: string;
  nextAuditDate?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.recordDate) {
    errors.push("Record date is required");
  } else {
    const dateObj = new Date(input.recordDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Record date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Record date cannot be in the future");
    }
  }
  if (!input.recordedBy || input.recordedBy.trim().length === 0) {
    errors.push("Recorded by (staff name) is required");
  }
  if (!input.recordType || !(RECORD_TYPES as readonly string[]).includes(input.recordType)) {
    errors.push(`Record type must be one of: ${RECORD_TYPES.join(", ")}`);
  }
  if (!input.riskLevel || !(RISK_LEVELS as readonly string[]).includes(input.riskLevel)) {
    errors.push(`Risk level must be one of: ${RISK_LEVELS.join(", ")}`);
  }
  if (input.complianceStatus && !(COMPLIANCE_STATUSES as readonly string[]).includes(input.complianceStatus)) {
    errors.push(`Compliance status must be one of: ${COMPLIANCE_STATUSES.join(", ")}`);
  }

  // Business rule: incident types must specify weapon type
  if (
    input.recordType &&
    (INCIDENT_TYPES as string[]).includes(input.recordType) &&
    (!input.weaponType || input.weaponType.trim().length === 0)
  ) {
    errors.push("Weapon type must be specified for all weapon-related incidents");
  }

  // Business rule: incident types must specify child name
  if (
    input.recordType &&
    (INCIDENT_TYPES as string[]).includes(input.recordType) &&
    (!input.childName || input.childName.trim().length === 0)
  ) {
    errors.push("Child name must be specified for all weapon-related incidents");
  }

  // Business rule: bedroom search must have consent field set
  if (
    input.recordType === "Bedroom Search — with consent" &&
    input.searchConsentObtained === null
  ) {
    errors.push("Search consent status must be recorded for bedroom searches — consent is required under CHR 2015");
  }

  // Business rule: bedroom search must have child name
  if (
    input.recordType === "Bedroom Search — with consent" &&
    (!input.childName || input.childName.trim().length === 0)
  ) {
    errors.push("Child name is required for bedroom searches");
  }

  // Business rule: kitchen knife count should be non-negative
  if (input.kitchenKnifeCount !== undefined && input.kitchenKnifeCount !== null) {
    if (input.kitchenKnifeCount < 0) {
      errors.push("Kitchen knife count cannot be negative");
    } else if (input.kitchenKnifeCount > 100) {
      errors.push("Kitchen knife count seems unusually high — please verify");
    }
  }

  // Business rule: Threat/Brought In incidents at High/Critical should notify police
  if (
    input.recordType &&
    (input.recordType === "Incident — Threat with Weapon" || input.recordType === "Incident — Weapon Brought In") &&
    input.riskLevel &&
    (input.riskLevel === "High" || input.riskLevel === "Critical") &&
    input.policeNotified === false
  ) {
    errors.push("Police notification is strongly recommended for High/Critical weapon threat or weapon brought in incidents per Offensive Weapons Act 2019");
  }

  // Business rule: serious incidents should have Reg 40 notification considered
  if (
    input.recordType &&
    (input.recordType === "Incident — Threat with Weapon" || input.recordType === "Incident — Weapon Brought In") &&
    input.riskLevel &&
    (input.riskLevel === "High" || input.riskLevel === "Critical") &&
    input.reg40Notification === false
  ) {
    errors.push("Reg 40 notification to Ofsted is required for serious weapon-related events — please confirm this has been considered");
  }

  // Business rule: next audit date must not be in the past
  if (input.nextAuditDate) {
    const auditDate = new Date(input.nextAuditDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(auditDate.getTime())) {
      errors.push("Next audit date must be a valid date");
    } else if (auditDate < today) {
      errors.push("Next audit date should not be in the past");
    }
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: KnifeWeaponSafetyRow[],
): {
  total_records: number;
  by_record_type: Record<string, number>;
  by_risk_level: Record<string, number>;
  by_compliance_status: Record<string, number>;
  incidents_count: number;
  weapons_found_count: number;
  weapons_threat_count: number;
  weapons_brought_in_count: number;
  kitchen_compliance_rate: number;
  sharp_objects_secured_rate: number;
  tool_storage_rate: number;
  search_consent_rate: number;
  police_notification_rate: number;
  reg_40_rate: number;
  educational_session_count: number;
  compliance_rate: number;
  overdue_audit_count: number;
  social_worker_informed_rate: number;
  parent_carer_informed_rate: number;
  safety_plan_update_rate: number;
  unique_children_involved: number;
  environmental_changes_count: number;
} {
  const total = rows.length;

  const boolRate = (field: keyof KnifeWeaponSafetyRow, subset?: KnifeWeaponSafetyRow[]) => {
    const pool = subset ?? rows;
    const count = pool.filter((r) => r[field] === true).length;
    return pool.length > 0 ? Math.round((count / pool.length) * 1000) / 10 : 0;
  };

  // Record type breakdown
  const byRecordType: Record<string, number> = {};
  for (const rt of RECORD_TYPES) byRecordType[rt] = 0;
  for (const r of rows) byRecordType[r.record_type] = (byRecordType[r.record_type] || 0) + 1;

  // Risk level breakdown
  const byRiskLevel: Record<string, number> = {};
  for (const rl of RISK_LEVELS) byRiskLevel[rl] = 0;
  for (const r of rows) byRiskLevel[r.risk_level] = (byRiskLevel[r.risk_level] || 0) + 1;

  // Compliance status breakdown
  const byComplianceStatus: Record<string, number> = {};
  for (const cs of COMPLIANCE_STATUSES) byComplianceStatus[cs] = 0;
  for (const r of rows) byComplianceStatus[r.compliance_status] = (byComplianceStatus[r.compliance_status] || 0) + 1;

  // Incident counts
  const incidents = rows.filter((r) => (INCIDENT_TYPES as string[]).includes(r.record_type));
  const incidentsCount = incidents.length;
  const weaponsFoundCount = rows.filter((r) => r.record_type === "Incident — Weapon Found").length;
  const weaponsThreatCount = rows.filter((r) => r.record_type === "Incident — Threat with Weapon").length;
  const weaponsBroughtInCount = rows.filter((r) => r.record_type === "Incident — Weapon Brought In").length;

  // Kitchen knife audits — compliance rate
  const kitchenAudits = rows.filter((r) => r.record_type === "Kitchen Knife Audit");
  const kitchenComplianceRate = kitchenAudits.length > 0
    ? Math.round((kitchenAudits.filter((r) => r.kitchen_knives_accounted_for).length / kitchenAudits.length) * 1000) / 10
    : 0;

  // Sharp objects secured rate (for sharp object checks)
  const sharpChecks = rows.filter((r) => r.record_type === "Sharp Object Check");
  const sharpObjectsSecuredRate = boolRate("sharp_objects_secured", sharpChecks);

  // Tool storage rate
  const toolChecks = rows.filter(
    (r) => r.record_type === "Kitchen Knife Audit" || r.record_type === "Sharp Object Check" || r.record_type === "Communal Area Check",
  );
  const toolStorageRate = boolRate("tool_storage_locked", toolChecks);

  // Search consent rate (for bedroom searches)
  const searches = rows.filter((r) => r.record_type === "Bedroom Search — with consent");
  const searchConsentRate = searches.length > 0
    ? Math.round((searches.filter((r) => r.search_consent_obtained === true).length / searches.length) * 1000) / 10
    : 0;

  // Police notification rate (for incidents only)
  const policeNotificationRate = incidents.length > 0
    ? Math.round((incidents.filter((r) => r.police_notified).length / incidents.length) * 1000) / 10
    : 0;

  // Reg 40 rate (for incidents only)
  const reg40Rate = incidents.length > 0
    ? Math.round((incidents.filter((r) => r.reg_40_notification).length / incidents.length) * 1000) / 10
    : 0;

  // Educational session count
  const educationalSessionCount = rows.filter((r) => r.record_type === "Educational Session").length;

  // Overall compliance rate
  const complianceRate = total > 0
    ? Math.round((rows.filter((r) => r.compliance_status === "Compliant").length / total) * 1000) / 10
    : 0;

  // Overdue audit count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueAuditCount = rows.filter((r) => {
    if (!r.next_audit_date) return false;
    const auditDate = new Date(r.next_audit_date);
    return auditDate < today;
  }).length;

  // Social worker informed rate (for incidents)
  const socialWorkerInformedRate = incidents.length > 0
    ? Math.round((incidents.filter((r) => r.social_worker_informed).length / incidents.length) * 1000) / 10
    : 0;

  // Parent/carer informed rate (for incidents)
  const parentCarerInformedRate = incidents.length > 0
    ? Math.round((incidents.filter((r) => r.parent_carer_informed).length / incidents.length) * 1000) / 10
    : 0;

  // Safety plan update rate (for incidents)
  const safetyPlanUpdateRate = incidents.length > 0
    ? Math.round((incidents.filter((r) => r.child_safety_plan_updated).length / incidents.length) * 1000) / 10
    : 0;

  // Unique children involved in incidents
  const uniqueChildrenInvolved = new Set(
    incidents.filter((r) => r.child_name).map((r) => r.child_name),
  ).size;

  // Environmental changes count
  const environmentalChangesCount = rows.filter(
    (r) => r.environmental_changes_made && r.environmental_changes_made.trim().length > 0,
  ).length;

  return {
    total_records: total,
    by_record_type: byRecordType,
    by_risk_level: byRiskLevel,
    by_compliance_status: byComplianceStatus,
    incidents_count: incidentsCount,
    weapons_found_count: weaponsFoundCount,
    weapons_threat_count: weaponsThreatCount,
    weapons_brought_in_count: weaponsBroughtInCount,
    kitchen_compliance_rate: kitchenComplianceRate,
    sharp_objects_secured_rate: sharpObjectsSecuredRate,
    tool_storage_rate: toolStorageRate,
    search_consent_rate: searchConsentRate,
    police_notification_rate: policeNotificationRate,
    reg_40_rate: reg40Rate,
    educational_session_count: educationalSessionCount,
    compliance_rate: complianceRate,
    overdue_audit_count: overdueAuditCount,
    social_worker_informed_rate: socialWorkerInformedRate,
    parent_carer_informed_rate: parentCarerInformedRate,
    safety_plan_update_rate: safetyPlanUpdateRate,
    unique_children_involved: uniqueChildrenInvolved,
    environmental_changes_count: environmentalChangesCount,
  };
}

export function computeAlerts(
  rows: KnifeWeaponSafetyRow[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical: Weapon threat or weapon brought in without police notification
  for (const r of rows) {
    if (
      (r.record_type === "Incident — Threat with Weapon" || r.record_type === "Incident — Weapon Brought In") &&
      !r.police_notified
    ) {
      alerts.push({
        type: "weapon_incident_no_police",
        severity: "critical",
        message: `${r.record_type} involving ${r.child_name ?? "unknown child"}: police not notified — immediate police notification required per Offensive Weapons Act 2019`,
        record_id: r.id,
      });
    }
  }

  // Critical: Serious weapon incident without Reg 40 notification
  for (const r of rows) {
    if (
      (r.record_type === "Incident — Threat with Weapon" || r.record_type === "Incident — Weapon Brought In") &&
      (r.risk_level === "High" || r.risk_level === "Critical") &&
      !r.reg_40_notification
    ) {
      alerts.push({
        type: "serious_incident_no_reg40",
        severity: "critical",
        message: `${r.record_type} at ${r.risk_level} risk: Reg 40 notification to Ofsted has not been submitted — notification is required within 24 hours for serious events`,
        record_id: r.id,
      });
    }
  }

  // Critical: Kitchen knives not accounted for
  for (const r of rows) {
    if (r.record_type === "Kitchen Knife Audit" && !r.kitchen_knives_accounted_for) {
      alerts.push({
        type: "knives_not_accounted",
        severity: "critical",
        message: `Kitchen knife audit on ${r.record_date}: knives not fully accounted for — immediate lockdown of kitchen, full search, and incident report required per Reg 25`,
        record_id: r.id,
      });
    }
  }

  // High: Critical risk level with no safety plan update
  for (const r of rows) {
    if (
      r.risk_level === "Critical" &&
      !r.child_safety_plan_updated &&
      r.child_name
    ) {
      alerts.push({
        type: "critical_no_safety_plan",
        severity: "high",
        message: `${r.child_name} has Critical weapon safety risk level but safety plan not updated — update individual safety plan immediately per Reg 12`,
        record_id: r.id,
      });
    }
  }

  // High: Non-compliant status
  for (const r of rows) {
    if (r.compliance_status === "Non-Compliant") {
      alerts.push({
        type: "non_compliant",
        severity: "high",
        message: `${r.record_type} on ${r.record_date} is Non-Compliant — take immediate corrective action to meet Reg 25 premises safety requirements`,
        record_id: r.id,
      });
    }
  }

  // High: Sharp objects not secured
  for (const r of rows) {
    if (r.record_type === "Sharp Object Check" && !r.sharp_objects_secured) {
      alerts.push({
        type: "sharp_objects_not_secured",
        severity: "high",
        message: `Sharp object check on ${r.record_date}: sharp objects are not properly secured — secure immediately per Reg 25 premises safety`,
        record_id: r.id,
      });
    }
  }

  // High: Tool storage not locked
  for (const r of rows) {
    if (
      (r.record_type === "Kitchen Knife Audit" || r.record_type === "Sharp Object Check" || r.record_type === "Communal Area Check") &&
      !r.tool_storage_locked
    ) {
      alerts.push({
        type: "tool_storage_unlocked",
        severity: "high",
        message: `${r.record_type} on ${r.record_date}: tool storage is not locked — lock immediately per Reg 25`,
        record_id: r.id,
      });
    }
  }

  // High: Weapon incident without social worker notification
  for (const r of rows) {
    if (
      (INCIDENT_TYPES as string[]).includes(r.record_type) &&
      r.child_name &&
      !r.social_worker_informed
    ) {
      alerts.push({
        type: "incident_sw_not_informed",
        severity: "high",
        message: `${r.record_type} involving ${r.child_name}: social worker not informed — notification required under Working Together 2023`,
        record_id: r.id,
      });
    }
  }

  // Medium: Bedroom search without consent
  for (const r of rows) {
    if (r.record_type === "Bedroom Search — with consent" && r.search_consent_obtained === false) {
      alerts.push({
        type: "search_no_consent",
        severity: "medium",
        message: `Bedroom search of ${r.child_name ?? "unknown child"} on ${r.record_date} conducted without consent — document reasons and ensure proportionality per CHR 2015`,
        record_id: r.id,
      });
    }
  }

  // Medium: Overdue audits
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of rows) {
    if (r.next_audit_date) {
      const auditDate = new Date(r.next_audit_date);
      if (auditDate < today) {
        alerts.push({
          type: "overdue_audit",
          severity: "medium",
          message: `${r.record_type} audit was due on ${r.next_audit_date} and is now overdue — schedule promptly to maintain compliance with Reg 25`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: Action Required compliance status
  for (const r of rows) {
    if (r.compliance_status === "Action Required") {
      alerts.push({
        type: "action_required",
        severity: "medium",
        message: `${r.record_type} on ${r.record_date} has Action Required status — complete outstanding actions to achieve compliance`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: KnifeWeaponSafetyRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_record_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} knife/weapon safety ${metrics.total_records === 1 ? "record" : "records"}. ` +
      `Types: ${typeBreakdown || "none recorded"}. ` +
      `Incidents: ${metrics.incidents_count} (${metrics.weapons_found_count} found, ` +
      `${metrics.weapons_threat_count} threats, ${metrics.weapons_brought_in_count} brought in). ` +
      `Kitchen compliance: ${metrics.kitchen_compliance_rate}%. ` +
      `Sharp objects secured: ${metrics.sharp_objects_secured_rate}%. ` +
      `Tool storage locked: ${metrics.tool_storage_rate}%. ` +
      `Overall compliance: ${metrics.compliance_rate}%.`,
  );

  // Insight 2: Priority safety concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority weapon safety alerts active. ` +
        `${metrics.unique_children_involved} ${metrics.unique_children_involved === 1 ? "child" : "children"} involved in incidents. ` +
        `Police notification rate: ${metrics.police_notification_rate}%. ` +
        `Reg 40 notification rate: ${metrics.reg_40_rate}%. ` +
        `Safety plan update rate: ${metrics.safety_plan_update_rate}%. ` +
        `Educational sessions delivered: ${metrics.educational_session_count}. ` +
        `${metrics.overdue_audit_count} overdue ${metrics.overdue_audit_count === 1 ? "audit" : "audits"}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority weapon safety alerts currently active. ` +
        `Search consent rate: ${metrics.search_consent_rate}%. ` +
        `Environmental changes made: ${metrics.environmental_changes_count}. ` +
        `Educational sessions: ${metrics.educational_session_count}. ` +
        `Continue regular audits and proactive education per Reg 25 and Serious Violence Duty 2022.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  if (metrics.incidents_count > 0 && metrics.educational_session_count === 0) {
    insights.push(
      `[reflect] There have been ${metrics.incidents_count} weapon-related ${metrics.incidents_count === 1 ? "incident" : "incidents"} ` +
        `but no educational sessions have been delivered. Are staff using weapon incidents as ` +
        `opportunities for proactive education about knife safety, the legal consequences of ` +
        `weapon possession under the Offensive Weapons Act 2019, and the impact of knife crime? ` +
        `The Serious Violence Duty 2022 requires a preventative, educational approach alongside enforcement.`,
    );
  } else if (metrics.kitchen_compliance_rate < 100 && metrics.kitchen_compliance_rate > 0) {
    insights.push(
      `[reflect] Kitchen knife audit compliance is at ${metrics.kitchen_compliance_rate}%, below the ` +
        `required 100% standard. What systems are in place to ensure all kitchen knives are ` +
        `accounted for at every shift change? Are knife shadow boards, knife registers, and ` +
        `daily counts being consistently used? Reg 25 requires premises to be safe and ` +
        `well-maintained, including secure storage of all potentially dangerous items.`,
    );
  } else if (metrics.overdue_audit_count > 0) {
    insights.push(
      `[reflect] ${metrics.overdue_audit_count} weapon safety ${metrics.overdue_audit_count === 1 ? "audit is" : "audits are"} overdue. ` +
        `Is there a robust schedule for regular knife and weapon safety checks across all ` +
        `areas of the home? Are communal spaces, kitchens, tool sheds, and gardens all ` +
        `included in the audit cycle? Consistent auditing is essential for demonstrating ` +
        `compliance with Reg 25 and for early identification of potential risks.`,
    );
  } else {
    insights.push(
      `[reflect] Are staff confident in their understanding of the home's knife and weapon ` +
        `safety protocols, including the process for conducting bedroom searches with consent, ` +
        `the threshold for police notification under the Offensive Weapons Act 2019, and the ` +
        `Reg 40 notification requirements for serious weapon-related events? Regular scenario-based ` +
        `training supports consistent and proportionate responses.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listKnifeWeaponSafety(
  homeId: string,
  filters?: {
    recordType?: RecordType;
    riskLevel?: RiskLevel;
    complianceStatus?: ComplianceStatus;
    limit?: number;
  },
): Promise<ServiceResult<KnifeWeaponSafetyRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_knife_weapon_safety") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.recordType) q = q.eq("record_type", filters.recordType);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getKnifeWeaponSafety(
  id: string,
): Promise<ServiceResult<KnifeWeaponSafetyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_knife_weapon_safety") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createKnifeWeaponSafety(input: {
  homeId: string;
  recordDate: string;
  recordedBy: string;
  recordType: RecordType;
  childName?: string | null;
  weaponType?: string | null;
  locationFound?: string | null;
  riskLevel: RiskLevel;
  kitchenKnivesAccountedFor?: boolean;
  kitchenKnifeCount?: number | null;
  sharpObjectsSecured?: boolean;
  toolStorageLocked?: boolean;
  searchConsentObtained?: boolean | null;
  policeNotified?: boolean;
  socialWorkerInformed?: boolean;
  reg40Notification?: boolean;
  parentCarerInformed?: boolean;
  childSafetyPlanUpdated?: boolean;
  environmentalChangesMade?: string | null;
  educationalContentDelivered?: boolean;
  nextAuditDate?: string | null;
  complianceStatus?: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<KnifeWeaponSafetyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateKnifeWeaponSafety({
    recordDate: input.recordDate,
    recordedBy: input.recordedBy,
    recordType: input.recordType,
    childName: input.childName,
    weaponType: input.weaponType,
    locationFound: input.locationFound,
    riskLevel: input.riskLevel,
    kitchenKnifeCount: input.kitchenKnifeCount,
    searchConsentObtained: input.searchConsentObtained,
    policeNotified: input.policeNotified,
    reg40Notification: input.reg40Notification,
    complianceStatus: input.complianceStatus,
    nextAuditDate: input.nextAuditDate,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_knife_weapon_safety") as SB)
    .insert({
      home_id: input.homeId,
      record_date: input.recordDate,
      recorded_by: input.recordedBy,
      record_type: input.recordType,
      child_name: input.childName ?? null,
      weapon_type: input.weaponType ?? null,
      location_found: input.locationFound ?? null,
      risk_level: input.riskLevel,
      kitchen_knives_accounted_for: input.kitchenKnivesAccountedFor ?? true,
      kitchen_knife_count: input.kitchenKnifeCount ?? null,
      sharp_objects_secured: input.sharpObjectsSecured ?? true,
      tool_storage_locked: input.toolStorageLocked ?? true,
      search_consent_obtained: input.searchConsentObtained ?? null,
      police_notified: input.policeNotified ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      reg_40_notification: input.reg40Notification ?? false,
      parent_carer_informed: input.parentCarerInformed ?? false,
      child_safety_plan_updated: input.childSafetyPlanUpdated ?? false,
      environmental_changes_made: input.environmentalChangesMade ?? null,
      educational_content_delivered: input.educationalContentDelivered ?? false,
      next_audit_date: input.nextAuditDate ?? null,
      compliance_status: input.complianceStatus ?? "Compliant",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateKnifeWeaponSafety(
  id: string,
  updates: Partial<{
    recordDate: string;
    recordedBy: string;
    recordType: RecordType;
    childName: string | null;
    weaponType: string | null;
    locationFound: string | null;
    riskLevel: RiskLevel;
    kitchenKnivesAccountedFor: boolean;
    kitchenKnifeCount: number | null;
    sharpObjectsSecured: boolean;
    toolStorageLocked: boolean;
    searchConsentObtained: boolean | null;
    policeNotified: boolean;
    socialWorkerInformed: boolean;
    reg40Notification: boolean;
    parentCarerInformed: boolean;
    childSafetyPlanUpdated: boolean;
    environmentalChangesMade: string | null;
    educationalContentDelivered: boolean;
    nextAuditDate: string | null;
    complianceStatus: ComplianceStatus;
    notes: string | null;
  }>,
): Promise<ServiceResult<KnifeWeaponSafetyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.recordType !== undefined) mapped.record_type = updates.recordType;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.weaponType !== undefined) mapped.weapon_type = updates.weaponType;
  if (updates.locationFound !== undefined) mapped.location_found = updates.locationFound;
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.kitchenKnivesAccountedFor !== undefined) mapped.kitchen_knives_accounted_for = updates.kitchenKnivesAccountedFor;
  if (updates.kitchenKnifeCount !== undefined) mapped.kitchen_knife_count = updates.kitchenKnifeCount;
  if (updates.sharpObjectsSecured !== undefined) mapped.sharp_objects_secured = updates.sharpObjectsSecured;
  if (updates.toolStorageLocked !== undefined) mapped.tool_storage_locked = updates.toolStorageLocked;
  if (updates.searchConsentObtained !== undefined) mapped.search_consent_obtained = updates.searchConsentObtained;
  if (updates.policeNotified !== undefined) mapped.police_notified = updates.policeNotified;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.reg40Notification !== undefined) mapped.reg_40_notification = updates.reg40Notification;
  if (updates.parentCarerInformed !== undefined) mapped.parent_carer_informed = updates.parentCarerInformed;
  if (updates.childSafetyPlanUpdated !== undefined) mapped.child_safety_plan_updated = updates.childSafetyPlanUpdated;
  if (updates.environmentalChangesMade !== undefined) mapped.environmental_changes_made = updates.environmentalChangesMade;
  if (updates.educationalContentDelivered !== undefined) mapped.educational_content_delivered = updates.educationalContentDelivered;
  if (updates.nextAuditDate !== undefined) mapped.next_audit_date = updates.nextAuditDate;
  if (updates.complianceStatus !== undefined) mapped.compliance_status = updates.complianceStatus;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_knife_weapon_safety") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteKnifeWeaponSafety(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_knife_weapon_safety") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
