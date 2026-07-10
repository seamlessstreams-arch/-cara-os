// ==============================================================================
// CARA -- HOME CCTV COMPLIANCE SERVICE
// Tracks CCTV camera compliance reviews including DPIA completion, signage,
// data retention, encryption, access logging, SAR handling, and privacy
// zone configuration for children's residential homes.
//
// Covers: Camera location and purpose, DPIA compliance, signage checks,
// retention period validation, data protection registration, footage
// accessibility and encryption, access log maintenance, subject access
// request handling, children and staff notification, privacy zones.
//
// SCCIF: Leadership -- "Leaders and managers ensure compliance with data
// protection legislation and children's right to privacy."
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const CAMERA_PURPOSES = [
  "Security",
  "Safeguarding",
  "Health & Safety",
  "Monitoring",
  "Entrance",
  "Car Park",
  "Other",
] as const;
export type CameraPurpose = (typeof CAMERA_PURPOSES)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Action Required",
  "Under Review",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// -- Row type -----------------------------------------------------------------

export interface HomeCctvComplianceRow {
  id: string;
  home_id: string;
  review_date: string;
  reviewer_name: string;
  camera_location: string;
  camera_purpose: CameraPurpose;
  dpia_completed: boolean;
  signage_in_place: boolean;
  retention_period_days: number;
  retention_compliant: boolean;
  data_protection_registered: boolean;
  footage_accessible: boolean;
  footage_encrypted: boolean;
  access_log_maintained: boolean;
  sar_received: boolean;
  sar_responded_in_time: boolean | null;
  children_informed: boolean;
  staff_informed: boolean;
  privacy_zones_set: boolean;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Constants ----------------------------------------------------------------

export const CAMERA_PURPOSE_LABELS: { purpose: CameraPurpose; label: string }[] = [
  { purpose: "Security", label: "Security" },
  { purpose: "Safeguarding", label: "Safeguarding" },
  { purpose: "Health & Safety", label: "Health & Safety" },
  { purpose: "Monitoring", label: "Monitoring" },
  { purpose: "Entrance", label: "Entrance" },
  { purpose: "Car Park", label: "Car Park" },
  { purpose: "Other", label: "Other" },
];

export const COMPLIANCE_STATUS_LABELS: { status: ComplianceStatus; label: string }[] = [
  { status: "Compliant", label: "Compliant" },
  { status: "Non-Compliant", label: "Non-Compliant" },
  { status: "Action Required", label: "Action Required" },
  { status: "Under Review", label: "Under Review" },
];

// -- Pure functions (no DB) ---------------------------------------------------

export function computeCctvComplianceMetrics(
  rows: HomeCctvComplianceRow[],
): {
  total_reviews: number;
  non_compliant_count: number;
  action_required_count: number;
  dpia_rate: number;
  signage_rate: number;
  retention_compliant_rate: number;
  encryption_rate: number;
  access_log_rate: number;
  children_informed_rate: number;
  staff_informed_rate: number;
  privacy_zones_rate: number;
  sar_count: number;
  sar_response_rate: number;
  avg_retention_days: number;
  unique_locations: number;
  unique_reviewers: number;
} {
  const total = rows.length;

  const nonCompliant = rows.filter(
    (r) => r.compliance_status === "Non-Compliant",
  ).length;

  const actionRequired = rows.filter(
    (r) => r.compliance_status === "Action Required",
  ).length;

  const dpiaCompleted = rows.filter((r) => r.dpia_completed).length;
  const dpiaRate =
    total > 0
      ? Math.round((dpiaCompleted / total) * 1000) / 10
      : 0;

  const signageInPlace = rows.filter((r) => r.signage_in_place).length;
  const signageRate =
    total > 0
      ? Math.round((signageInPlace / total) * 1000) / 10
      : 0;

  const retentionCompliant = rows.filter((r) => r.retention_compliant).length;
  const retentionCompliantRate =
    total > 0
      ? Math.round((retentionCompliant / total) * 1000) / 10
      : 0;

  const encrypted = rows.filter((r) => r.footage_encrypted).length;
  const encryptionRate =
    total > 0
      ? Math.round((encrypted / total) * 1000) / 10
      : 0;

  const accessLogMaintained = rows.filter((r) => r.access_log_maintained).length;
  const accessLogRate =
    total > 0
      ? Math.round((accessLogMaintained / total) * 1000) / 10
      : 0;

  const childrenInformed = rows.filter((r) => r.children_informed).length;
  const childrenInformedRate =
    total > 0
      ? Math.round((childrenInformed / total) * 1000) / 10
      : 0;

  const staffInformed = rows.filter((r) => r.staff_informed).length;
  const staffInformedRate =
    total > 0
      ? Math.round((staffInformed / total) * 1000) / 10
      : 0;

  const privacyZonesSet = rows.filter((r) => r.privacy_zones_set).length;
  const privacyZonesRate =
    total > 0
      ? Math.round((privacyZonesSet / total) * 1000) / 10
      : 0;

  const sarCount = rows.filter((r) => r.sar_received).length;

  const sarRespondedRows = rows.filter(
    (r) => r.sar_received && r.sar_responded_in_time !== null,
  );
  const sarRespondedInTime = sarRespondedRows.filter(
    (r) => r.sar_responded_in_time === true,
  ).length;
  const sarResponseRate =
    sarRespondedRows.length > 0
      ? Math.round((sarRespondedInTime / sarRespondedRows.length) * 1000) / 10
      : 0;

  const totalRetentionDays = rows.reduce(
    (sum, r) => sum + r.retention_period_days,
    0,
  );
  const avgRetentionDays =
    total > 0
      ? Math.round((totalRetentionDays / total) * 10) / 10
      : 0;

  const uniqueLocations = new Set(rows.map((r) => r.camera_location)).size;
  const uniqueReviewers = new Set(rows.map((r) => r.reviewer_name)).size;

  return {
    total_reviews: total,
    non_compliant_count: nonCompliant,
    action_required_count: actionRequired,
    dpia_rate: dpiaRate,
    signage_rate: signageRate,
    retention_compliant_rate: retentionCompliantRate,
    encryption_rate: encryptionRate,
    access_log_rate: accessLogRate,
    children_informed_rate: childrenInformedRate,
    staff_informed_rate: staffInformedRate,
    privacy_zones_rate: privacyZonesRate,
    sar_count: sarCount,
    sar_response_rate: sarResponseRate,
    avg_retention_days: avgRetentionDays,
    unique_locations: uniqueLocations,
    unique_reviewers: uniqueReviewers,
  };
}

export function identifyCctvComplianceAlerts(
  rows: HomeCctvComplianceRow[],
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

  // Critical: no DPIA completed
  for (const r of rows) {
    if (!r.dpia_completed) {
      alerts.push({
        type: "no_dpia",
        severity: "critical",
        message: `No DPIA completed for CCTV at ${r.camera_location} reviewed on ${r.review_date} — a Data Protection Impact Assessment is legally required before operating CCTV in a children's home`,
        record_id: r.id,
      });
    }
  }

  // Critical: children not informed of CCTV
  for (const r of rows) {
    if (!r.children_informed) {
      alerts.push({
        type: "children_not_informed",
        severity: "critical",
        message: `Children not informed of CCTV at ${r.camera_location} reviewed on ${r.review_date} — children must be made aware of surveillance in their home to uphold their rights and dignity`,
        record_id: r.id,
      });
    }
  }

  // High: no signage in place
  for (const r of rows) {
    if (!r.signage_in_place) {
      alerts.push({
        type: "no_signage",
        severity: "high",
        message: `No CCTV signage in place at ${r.camera_location} reviewed on ${r.review_date} — visible signage is required to comply with data protection regulations`,
        record_id: r.id,
      });
    }
  }

  // High: non-compliant status
  for (const r of rows) {
    if (r.compliance_status === "Non-Compliant") {
      alerts.push({
        type: "non_compliant_status",
        severity: "high",
        message: `CCTV at ${r.camera_location} reviewed on ${r.review_date} has been marked as Non-Compliant — immediate action is required to address compliance failures`,
        record_id: r.id,
      });
    }
  }

  // Medium: no encryption
  for (const r of rows) {
    if (!r.footage_encrypted) {
      alerts.push({
        type: "no_encryption",
        severity: "medium",
        message: `CCTV footage at ${r.camera_location} reviewed on ${r.review_date} is not encrypted — unencrypted footage poses a data security risk`,
        record_id: r.id,
      });
    }
  }

  // Medium: SAR received but not responded in time
  for (const r of rows) {
    if (r.sar_received && r.sar_responded_in_time === false) {
      alerts.push({
        type: "sar_not_responded",
        severity: "medium",
        message: `Subject access request for CCTV at ${r.camera_location} reviewed on ${r.review_date} was not responded to in time — failure to respond within the statutory timeframe is a data protection breach`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCctvComplianceCaraInsights(
  rows: HomeCctvComplianceRow[],
): string[] {
  const metrics = computeCctvComplianceMetrics(rows);
  const alerts = identifyCctvComplianceAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary stats
  insights.push(
    `[zinc] ${metrics.total_reviews} CCTV compliance ${metrics.total_reviews === 1 ? "review" : "reviews"} recorded across ${metrics.unique_locations} ${metrics.unique_locations === 1 ? "location" : "locations"} by ${metrics.unique_reviewers} ${metrics.unique_reviewers === 1 ? "reviewer" : "reviewers"}. ` +
      `DPIA completion rate is ${metrics.dpia_rate}%, signage rate is ${metrics.signage_rate}%, ` +
      `and encryption rate is ${metrics.encryption_rate}%.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority CCTV compliance alerts identified. ` +
        `${metrics.non_compliant_count} ${metrics.non_compliant_count === 1 ? "camera is" : "cameras are"} non-compliant. ` +
        `${metrics.action_required_count} ${metrics.action_required_count === 1 ? "review requires" : "reviews require"} action and ${metrics.sar_count} ${metrics.sar_count === 1 ? "SAR has" : "SARs have"} been received.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority CCTV compliance alerts currently active. ` +
        `Children informed rate is ${metrics.children_informed_rate}% and staff informed rate is ${metrics.staff_informed_rate}%. ` +
        `Continue regular CCTV compliance reviews to maintain data protection standards.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.non_compliant_count > 0) {
    insights.push(
      `[reflect] ${metrics.non_compliant_count} ${metrics.non_compliant_count === 1 ? "CCTV camera has" : "CCTV cameras have"} been recorded as non-compliant across compliance reviews. ` +
        `What immediate remedial actions have been taken to address non-compliance, ` +
        `and is the CCTV policy and review schedule adequate for the home's needs?`,
    );
  } else if (metrics.action_required_count > 0 || metrics.sar_count > 0) {
    insights.push(
      `[reflect] ${metrics.action_required_count} ${metrics.action_required_count === 1 ? "review requires" : "reviews require"} action and ${metrics.sar_count} ${metrics.sar_count === 1 ? "SAR has" : "SARs have"} been received. ` +
        `How can the home improve its CCTV compliance processes, ` +
        `and are privacy zones and retention periods being consistently reviewed across all cameras?`,
    );
  } else {
    insights.push(
      `[reflect] All CCTV compliance reviews show no non-compliant cameras and no outstanding actions. ` +
        `How can the home continue to maintain this high standard of CCTV compliance, ` +
        `and are children and staff aware of how CCTV data is used, stored, and their rights regarding it?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listHomeCctvCompliance(
  homeId: string,
  filters?: {
    cameraPurpose?: CameraPurpose;
    complianceStatus?: ComplianceStatus;
    limit?: number;
  },
): Promise<ServiceResult<HomeCctvComplianceRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  let q = (sb.from("cs_home_cctv_compliance") as SB).select("*").eq("home_id", homeId);
  if (filters?.cameraPurpose) q = q.eq("camera_purpose", filters.cameraPurpose);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);
  q = q.order("review_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHomeCctvCompliance(input: {
  homeId: string;
  reviewDate: string;
  reviewerName: string;
  cameraLocation: string;
  cameraPurpose: CameraPurpose;
  dpiaCompleted: boolean;
  signageInPlace: boolean;
  retentionPeriodDays?: number;
  retentionCompliant: boolean;
  dataProtectionRegistered: boolean;
  footageAccessible: boolean;
  footageEncrypted: boolean;
  accessLogMaintained: boolean;
  sarReceived: boolean;
  sarRespondedInTime?: boolean | null;
  childrenInformed: boolean;
  staffInformed: boolean;
  privacyZonesSet: boolean;
  complianceStatus: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<HomeCctvComplianceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_cctv_compliance") as SB)
    .insert({
      home_id: input.homeId,
      review_date: input.reviewDate,
      reviewer_name: input.reviewerName,
      camera_location: input.cameraLocation,
      camera_purpose: input.cameraPurpose,
      dpia_completed: input.dpiaCompleted,
      signage_in_place: input.signageInPlace,
      retention_period_days: input.retentionPeriodDays ?? 30,
      retention_compliant: input.retentionCompliant,
      data_protection_registered: input.dataProtectionRegistered,
      footage_accessible: input.footageAccessible,
      footage_encrypted: input.footageEncrypted,
      access_log_maintained: input.accessLogMaintained,
      sar_received: input.sarReceived,
      sar_responded_in_time: input.sarRespondedInTime ?? null,
      children_informed: input.childrenInformed,
      staff_informed: input.staffInformed,
      privacy_zones_set: input.privacyZonesSet,
      compliance_status: input.complianceStatus,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateHomeCctvCompliance(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<HomeCctvComplianceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_home_cctv_compliance") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteHomeCctvCompliance(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { error } = await (sb.from("cs_home_cctv_compliance") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

// -- Testing exports ----------------------------------------------------------

export const _testing = {
  computeCctvComplianceMetrics,
  identifyCctvComplianceAlerts,
  generateCctvComplianceCaraInsights,
};
