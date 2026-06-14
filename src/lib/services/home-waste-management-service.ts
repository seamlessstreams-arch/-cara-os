// ==============================================================================
// CARA -- HOME WASTE MANAGEMENT & RECYCLING SERVICE
// Tracks waste audits, recycling compliance, duty of care, waste transfer
// documentation, carrier licensing, bin condition, contamination monitoring,
// and young people's involvement in environmental education.
//
// Covers: General waste, recycling (paper, plastic, glass, metal), food waste,
// garden waste, clinical/sharps, confidential documents, electrical/WEEE,
// hazardous materials, bulky items. Collection frequency tracking, provider
// management, annual cost monitoring, contamination identification, bin
// condition assessment, storage compliance, duty of care compliance,
// waste transfer note management, and waste carrier licence verification.
//
// UK Regulatory Framework:
// CHR 2015 Reg 25 (premises — suitable, well-maintained, safe environment),
// Environmental Protection Act 1990 (duty of care for waste management),
// Waste (England and Wales) Regulations 2011 (waste hierarchy obligations),
// Controlled Waste Regulations 2012,
// Hazardous Waste Regulations 2005 (for clinical/sharps and hazardous waste),
// WEEE Regulations 2013 (electrical waste),
// Data Protection Act 2018 / UK GDPR (confidential document destruction).
//
// SCCIF: Leadership and management -- Premises should be well-maintained
// and model good environmental practice for children. Ofsted expects homes
// to maintain clean, hygienic premises with appropriate waste management
// and to involve young people in learning about environmental responsibility.
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const WASTE_CATEGORIES = [
  "General Waste",
  "Recycling — Paper/Card",
  "Recycling — Plastic",
  "Recycling — Glass",
  "Recycling — Metal",
  "Food Waste",
  "Garden Waste",
  "Clinical/Sharps",
  "Confidential Documents",
  "Electrical/WEEE",
  "Hazardous",
  "Bulky Items",
] as const;
export type WasteCategory = (typeof WASTE_CATEGORIES)[number];

export const COLLECTION_FREQUENCIES = [
  "Daily",
  "Twice Weekly",
  "Weekly",
  "Fortnightly",
  "Monthly",
  "On Request",
] as const;
export type CollectionFrequency = (typeof COLLECTION_FREQUENCIES)[number];

export const BIN_CONDITIONS = [
  "Good",
  "Fair",
  "Poor",
  "Replacement Needed",
] as const;
export type BinCondition = (typeof BIN_CONDITIONS)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Action Required",
  "Under Review",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// -- Label maps ---------------------------------------------------------------

export const WASTE_CATEGORY_LABELS: { category: WasteCategory; label: string; regulatoryNote: string }[] = [
  { category: "General Waste", label: "General Waste (non-recyclable)", regulatoryNote: "Environmental Protection Act 1990" },
  { category: "Recycling — Paper/Card", label: "Recycling — Paper & Cardboard", regulatoryNote: "Waste Regulations 2011 — waste hierarchy" },
  { category: "Recycling — Plastic", label: "Recycling — Plastic", regulatoryNote: "Waste Regulations 2011 — waste hierarchy" },
  { category: "Recycling — Glass", label: "Recycling — Glass", regulatoryNote: "Waste Regulations 2011 — waste hierarchy" },
  { category: "Recycling — Metal", label: "Recycling — Metal (cans, tins)", regulatoryNote: "Waste Regulations 2011 — waste hierarchy" },
  { category: "Food Waste", label: "Food Waste", regulatoryNote: "Waste Regulations 2011 — separate collection" },
  { category: "Garden Waste", label: "Garden Waste", regulatoryNote: "Controlled Waste Regulations 2012" },
  { category: "Clinical/Sharps", label: "Clinical / Sharps Waste", regulatoryNote: "Hazardous Waste Regulations 2005" },
  { category: "Confidential Documents", label: "Confidential Documents", regulatoryNote: "Data Protection Act 2018 / UK GDPR" },
  { category: "Electrical/WEEE", label: "Electrical / WEEE", regulatoryNote: "WEEE Regulations 2013" },
  { category: "Hazardous", label: "Hazardous Waste", regulatoryNote: "Hazardous Waste Regulations 2005" },
  { category: "Bulky Items", label: "Bulky Items (furniture, mattresses)", regulatoryNote: "Controlled Waste Regulations 2012" },
];

export const COLLECTION_FREQUENCY_LABELS: { frequency: CollectionFrequency; label: string }[] = [
  { frequency: "Daily", label: "Daily" },
  { frequency: "Twice Weekly", label: "Twice Weekly" },
  { frequency: "Weekly", label: "Weekly" },
  { frequency: "Fortnightly", label: "Fortnightly" },
  { frequency: "Monthly", label: "Monthly" },
  { frequency: "On Request", label: "On Request / Ad Hoc" },
];

export const BIN_CONDITION_LABELS: { condition: BinCondition; label: string }[] = [
  { condition: "Good", label: "Good — Clean, intact, lid works properly" },
  { condition: "Fair", label: "Fair — Minor wear but functional" },
  { condition: "Poor", label: "Poor — Damaged, dirty, or lid broken" },
  { condition: "Replacement Needed", label: "Replacement Needed — Not fit for purpose" },
];

export const COMPLIANCE_STATUS_LABELS: { status: ComplianceStatus; label: string }[] = [
  { status: "Compliant", label: "Compliant" },
  { status: "Non-Compliant", label: "Non-Compliant" },
  { status: "Action Required", label: "Action Required" },
  { status: "Under Review", label: "Under Review" },
];

// -- Constants ----------------------------------------------------------------

const REGULATED_WASTE_CATEGORIES: WasteCategory[] = [
  "Clinical/Sharps",
  "Confidential Documents",
  "Electrical/WEEE",
  "Hazardous",
];

// -- Row type -----------------------------------------------------------------

export interface HomeWasteManagementRow {
  id: string;
  home_id: string;
  audit_date: string;
  auditor_name: string;
  waste_category: WasteCategory;
  collection_frequency: CollectionFrequency;
  provider_name: string | null;
  annual_cost: number | null;
  contamination_found: boolean;
  contamination_details: string | null;
  bin_condition: BinCondition;
  storage_compliant: boolean;
  young_people_involved: boolean;
  duty_of_care_compliant: boolean;
  waste_transfer_note_held: boolean;
  waste_carrier_licence_checked: boolean;
  next_audit_date: string | null;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateHomeWasteManagement(input: {
  auditDate?: string;
  auditorName?: string;
  wasteCategory?: string;
  collectionFrequency?: string;
  providerName?: string | null;
  annualCost?: number | null;
  contaminationFound?: boolean;
  contaminationDetails?: string | null;
  binCondition?: string;
  storageCompliant?: boolean;
  youngPeopleInvolved?: boolean;
  dutyOfCareCompliant?: boolean;
  wasteTransferNoteHeld?: boolean;
  wasteCarrierLicenceChecked?: boolean;
  nextAuditDate?: string | null;
  complianceStatus?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.auditDate) {
    errors.push("Audit date is required");
  } else {
    const dateObj = new Date(input.auditDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Audit date must be a valid date");
    }
  }

  if (!input.auditorName || input.auditorName.trim().length === 0) {
    errors.push("Auditor name is required");
  }

  if (!input.wasteCategory || !(WASTE_CATEGORIES as readonly string[]).includes(input.wasteCategory)) {
    errors.push(`Waste category must be one of: ${WASTE_CATEGORIES.join(", ")}`);
  }

  if (!input.collectionFrequency || !(COLLECTION_FREQUENCIES as readonly string[]).includes(input.collectionFrequency)) {
    errors.push(`Collection frequency must be one of: ${COLLECTION_FREQUENCIES.join(", ")}`);
  }

  if (!input.binCondition || !(BIN_CONDITIONS as readonly string[]).includes(input.binCondition)) {
    errors.push(`Bin condition must be one of: ${BIN_CONDITIONS.join(", ")}`);
  }

  if (!input.complianceStatus || !(COMPLIANCE_STATUSES as readonly string[]).includes(input.complianceStatus)) {
    errors.push(`Compliance status must be one of: ${COMPLIANCE_STATUSES.join(", ")}`);
  }

  // Business rule: annual cost must be non-negative
  if (input.annualCost !== null && input.annualCost !== undefined && input.annualCost < 0) {
    errors.push("Annual cost cannot be negative");
  }

  // Business rule: contamination details required if contamination found
  if (input.contaminationFound === true && (!input.contaminationDetails || input.contaminationDetails.trim().length === 0)) {
    errors.push("Contamination details are required when contamination has been found — describe what was contaminated and the type of contaminant");
  }

  // Business rule: next audit date should be after audit date
  if (input.nextAuditDate && input.auditDate) {
    const next = new Date(input.nextAuditDate);
    const audit = new Date(input.auditDate);
    if (!isNaN(next.getTime()) && !isNaN(audit.getTime()) && next <= audit) {
      errors.push("Next audit date must be after the current audit date");
    }
  }

  // Business rule: regulated waste categories require waste transfer notes
  if (
    input.wasteCategory &&
    REGULATED_WASTE_CATEGORIES.includes(input.wasteCategory as WasteCategory) &&
    input.wasteTransferNoteHeld === false
  ) {
    errors.push(`Waste transfer note is legally required for ${input.wasteCategory} under Environmental Protection Act 1990 duty of care — obtain and file the note`);
  }

  // Business rule: regulated waste categories require carrier licence check
  if (
    input.wasteCategory &&
    REGULATED_WASTE_CATEGORIES.includes(input.wasteCategory as WasteCategory) &&
    input.wasteCarrierLicenceChecked === false
  ) {
    errors.push(`Waste carrier licence must be verified for ${input.wasteCategory} — using an unlicensed carrier is a criminal offence under Environmental Protection Act 1990`);
  }

  // Business rule: clinical/sharps and hazardous waste require provider
  if (
    input.wasteCategory &&
    (input.wasteCategory === "Clinical/Sharps" || input.wasteCategory === "Hazardous") &&
    (!input.providerName || input.providerName.trim().length === 0)
  ) {
    errors.push(`Provider name is required for ${input.wasteCategory} waste — a licensed specialist contractor must handle this waste type`);
  }

  // Business rule: confidential documents require secure destruction
  if (
    input.wasteCategory === "Confidential Documents" &&
    input.dutyOfCareCompliant === false
  ) {
    errors.push("Confidential document disposal must be duty of care compliant — ensure cross-cut shredding or secure collection by a licensed provider per Data Protection Act 2018");
  }

  // Business rule: non-compliant status requires action
  if (
    input.complianceStatus === "Non-Compliant" &&
    !input.nextAuditDate
  ) {
    errors.push("A follow-up audit date is required for Non-Compliant waste categories — schedule a re-audit to verify corrective actions");
  }

  // Business rule: poor or replacement needed bins with compliant status
  if (
    input.binCondition &&
    (input.binCondition === "Poor" || input.binCondition === "Replacement Needed") &&
    input.complianceStatus === "Compliant"
  ) {
    errors.push("Bins in Poor condition or needing Replacement cannot be marked as Compliant — update compliance status to Action Required");
  }

  // Business rule: storage must be compliant for compliant status
  if (input.storageCompliant === false && input.complianceStatus === "Compliant") {
    errors.push("Waste storage is not compliant — status cannot be Compliant when storage does not meet requirements per Reg 25");
  }

  // Business rule: food waste should ideally have at least twice weekly collection
  if (
    input.wasteCategory === "Food Waste" &&
    input.collectionFrequency &&
    (input.collectionFrequency === "Fortnightly" || input.collectionFrequency === "Monthly")
  ) {
    errors.push("Food waste with fortnightly or monthly collection may cause hygiene issues — consider increasing collection frequency to at least weekly");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: HomeWasteManagementRow[],
): {
  total_audits: number;
  compliant_count: number;
  non_compliant_count: number;
  action_required_count: number;
  under_review_count: number;
  compliance_rate: number;
  contamination_rate: number;
  contamination_count: number;
  young_people_involvement_rate: number;
  total_annual_cost: number;
  average_annual_cost: number;
  by_waste_category: Record<string, number>;
  by_collection_frequency: Record<string, number>;
  by_bin_condition: Record<string, number>;
  by_compliance_status: Record<string, number>;
  bin_replacement_needed_count: number;
  poor_bin_count: number;
  duty_of_care_rate: number;
  waste_transfer_note_rate: number;
  carrier_licence_checked_rate: number;
  storage_compliant_rate: number;
  regulated_waste_count: number;
  unique_providers: number;
  unique_auditors: number;
  overdue_audits: number;
} {
  const total = rows.length;

  const compliantCount = rows.filter((r) => r.compliance_status === "Compliant").length;
  const nonCompliantCount = rows.filter((r) => r.compliance_status === "Non-Compliant").length;
  const actionRequiredCount = rows.filter((r) => r.compliance_status === "Action Required").length;
  const underReviewCount = rows.filter((r) => r.compliance_status === "Under Review").length;

  // Compliance rate
  const complianceRate = total > 0
    ? Math.round((compliantCount / total) * 1000) / 10
    : 0;

  // Contamination rate
  const contaminationCount = rows.filter((r) => r.contamination_found).length;
  const contaminationRate = total > 0
    ? Math.round((contaminationCount / total) * 1000) / 10
    : 0;

  // Young people involvement rate
  const ypInvolved = rows.filter((r) => r.young_people_involved).length;
  const ypRate = total > 0
    ? Math.round((ypInvolved / total) * 1000) / 10
    : 0;

  // Annual cost totals
  const withCosts = rows.filter((r) => r.annual_cost !== null && r.annual_cost > 0);
  const totalCost = withCosts.reduce((sum, r) => sum + (r.annual_cost ?? 0), 0);
  const avgCost = withCosts.length > 0
    ? Math.round((totalCost / withCosts.length) * 100) / 100
    : 0;

  // By waste category
  const byCategory: Record<string, number> = {};
  for (const c of WASTE_CATEGORIES) byCategory[c] = 0;
  for (const r of rows) byCategory[r.waste_category] = (byCategory[r.waste_category] || 0) + 1;

  // By collection frequency
  const byFrequency: Record<string, number> = {};
  for (const f of COLLECTION_FREQUENCIES) byFrequency[f] = 0;
  for (const r of rows) byFrequency[r.collection_frequency] = (byFrequency[r.collection_frequency] || 0) + 1;

  // By bin condition
  const byBinCondition: Record<string, number> = {};
  for (const bc of BIN_CONDITIONS) byBinCondition[bc] = 0;
  for (const r of rows) byBinCondition[r.bin_condition] = (byBinCondition[r.bin_condition] || 0) + 1;

  // By compliance status
  const byStatus: Record<string, number> = {};
  for (const cs of COMPLIANCE_STATUSES) byStatus[cs] = 0;
  for (const r of rows) byStatus[r.compliance_status] = (byStatus[r.compliance_status] || 0) + 1;

  // Bin condition counts
  const replacementNeeded = rows.filter((r) => r.bin_condition === "Replacement Needed").length;
  const poorBins = rows.filter((r) => r.bin_condition === "Poor").length;

  // Duty of care rate
  const docCompliant = rows.filter((r) => r.duty_of_care_compliant).length;
  const docRate = total > 0 ? Math.round((docCompliant / total) * 1000) / 10 : 0;

  // Waste transfer note rate
  const wtnHeld = rows.filter((r) => r.waste_transfer_note_held).length;
  const wtnRate = total > 0 ? Math.round((wtnHeld / total) * 1000) / 10 : 0;

  // Carrier licence checked rate
  const carrierChecked = rows.filter((r) => r.waste_carrier_licence_checked).length;
  const carrierRate = total > 0 ? Math.round((carrierChecked / total) * 1000) / 10 : 0;

  // Storage compliant rate
  const storageCompliant = rows.filter((r) => r.storage_compliant).length;
  const storageRate = total > 0 ? Math.round((storageCompliant / total) * 1000) / 10 : 0;

  // Regulated waste count
  const regulatedCount = rows.filter((r) =>
    REGULATED_WASTE_CATEGORIES.includes(r.waste_category),
  ).length;

  // Unique providers
  const uniqueProviders = new Set(
    rows.filter((r) => r.provider_name && r.provider_name.trim().length > 0).map((r) => r.provider_name),
  ).size;

  const uniqueAuditors = new Set(rows.map((r) => r.auditor_name)).size;

  // Overdue audits
  const now = new Date();
  const overdueAudits = rows.filter((r) => {
    if (!r.next_audit_date) return false;
    const nextDate = new Date(r.next_audit_date);
    return !isNaN(nextDate.getTime()) && nextDate < now;
  }).length;

  return {
    total_audits: total,
    compliant_count: compliantCount,
    non_compliant_count: nonCompliantCount,
    action_required_count: actionRequiredCount,
    under_review_count: underReviewCount,
    compliance_rate: complianceRate,
    contamination_rate: contaminationRate,
    contamination_count: contaminationCount,
    young_people_involvement_rate: ypRate,
    total_annual_cost: Math.round(totalCost * 100) / 100,
    average_annual_cost: avgCost,
    by_waste_category: byCategory,
    by_collection_frequency: byFrequency,
    by_bin_condition: byBinCondition,
    by_compliance_status: byStatus,
    bin_replacement_needed_count: replacementNeeded,
    poor_bin_count: poorBins,
    duty_of_care_rate: docRate,
    waste_transfer_note_rate: wtnRate,
    carrier_licence_checked_rate: carrierRate,
    storage_compliant_rate: storageRate,
    regulated_waste_count: regulatedCount,
    unique_providers: uniqueProviders,
    unique_auditors: uniqueAuditors,
    overdue_audits: overdueAudits,
  };
}

export function computeAlerts(
  rows: HomeWasteManagementRow[],
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

  const now = new Date();

  // Critical: regulated waste without transfer note
  for (const r of rows) {
    if (
      REGULATED_WASTE_CATEGORIES.includes(r.waste_category) &&
      !r.waste_transfer_note_held
    ) {
      alerts.push({
        type: "regulated_no_transfer_note",
        severity: "critical",
        message: `${r.waste_category} audit on ${r.audit_date} — waste transfer note not held. This is a legal requirement under Environmental Protection Act 1990 duty of care — obtain and file the transfer note immediately`,
        record_id: r.id,
      });
    }
  }

  // Critical: regulated waste without carrier licence verification
  for (const r of rows) {
    if (
      REGULATED_WASTE_CATEGORIES.includes(r.waste_category) &&
      !r.waste_carrier_licence_checked
    ) {
      alerts.push({
        type: "regulated_no_carrier_licence",
        severity: "critical",
        message: `${r.waste_category} audit on ${r.audit_date} — waste carrier licence not verified. Using an unlicensed carrier is a criminal offence — verify the carrier's registration with the Environment Agency`,
        record_id: r.id,
      });
    }
  }

  // Critical: clinical/sharps or hazardous waste non-compliant
  for (const r of rows) {
    if (
      (r.waste_category === "Clinical/Sharps" || r.waste_category === "Hazardous") &&
      r.compliance_status === "Non-Compliant"
    ) {
      alerts.push({
        type: "hazardous_non_compliant",
        severity: "critical",
        message: `${r.waste_category} waste management is Non-Compliant — this poses a health and safety risk to children, staff and visitors. Immediate corrective action required per Hazardous Waste Regulations 2005`,
        record_id: r.id,
      });
    }
  }

  // Critical: confidential documents non-compliant (data protection risk)
  for (const r of rows) {
    if (r.waste_category === "Confidential Documents" && !r.duty_of_care_compliant) {
      alerts.push({
        type: "confidential_not_compliant",
        severity: "critical",
        message: `Confidential document disposal is not duty of care compliant — this is a data protection breach risk under UK GDPR. Ensure secure cross-cut shredding or licensed collection is in place`,
        record_id: r.id,
      });
    }
  }

  // High: non-compliant waste category
  for (const r of rows) {
    if (
      r.compliance_status === "Non-Compliant" &&
      r.waste_category !== "Clinical/Sharps" &&
      r.waste_category !== "Hazardous"
    ) {
      alerts.push({
        type: "non_compliant",
        severity: "high",
        message: `${r.waste_category} waste management is Non-Compliant — address issues identified in the audit to meet Environmental Protection Act 1990 duty of care requirements`,
        record_id: r.id,
      });
    }
  }

  // High: bin replacement needed
  for (const r of rows) {
    if (r.bin_condition === "Replacement Needed") {
      alerts.push({
        type: "bin_replacement_needed",
        severity: "high",
        message: `${r.waste_category} bin requires replacement — damaged bins can cause hygiene issues, pest attraction, and do not maintain the standard expected of premises under Reg 25`,
        record_id: r.id,
      });
    }
  }

  // High: storage not compliant
  for (const r of rows) {
    if (!r.storage_compliant) {
      alerts.push({
        type: "storage_not_compliant",
        severity: "high",
        message: `${r.waste_category} storage is not compliant — waste must be stored securely and hygienically to maintain safe premises per Reg 25 and prevent environmental harm`,
        record_id: r.id,
      });
    }
  }

  // High: contamination found in recycling streams
  for (const r of rows) {
    if (r.contamination_found && r.waste_category.startsWith("Recycling")) {
      alerts.push({
        type: "recycling_contamination",
        severity: "high",
        message: `Contamination found in ${r.waste_category} — ${r.contamination_details ?? "details not provided"}. Contaminated recycling may be rejected by the processor, increasing disposal costs and environmental impact`,
        record_id: r.id,
      });
    }
  }

  // Medium: overdue audits
  for (const r of rows) {
    if (r.next_audit_date) {
      const nextDate = new Date(r.next_audit_date);
      if (!isNaN(nextDate.getTime()) && nextDate < now) {
        const daysPast = Math.floor((now.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: "audit_overdue",
          severity: "medium",
          message: `${r.waste_category} audit is ${daysPast} days overdue — schedule a re-audit to maintain compliance monitoring`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: poor bin condition
  for (const r of rows) {
    if (r.bin_condition === "Poor") {
      alerts.push({
        type: "bin_poor_condition",
        severity: "medium",
        message: `${r.waste_category} bin is in Poor condition — plan replacement or repair before it becomes unfit for purpose`,
        record_id: r.id,
      });
    }
  }

  // Medium: low young people involvement
  const ypInvolved = rows.filter((r) => r.young_people_involved).length;
  if (rows.length > 0 && ypInvolved === 0) {
    alerts.push({
      type: "no_yp_involvement",
      severity: "medium",
      message: `No young people involvement recorded across any waste management audits — consider educational activities about recycling and environmental responsibility to build life skills`,
    });
  }

  // Medium: duty of care not compliant for general waste
  for (const r of rows) {
    if (r.waste_category === "General Waste" && !r.duty_of_care_compliant) {
      alerts.push({
        type: "general_waste_no_doc",
        severity: "medium",
        message: `General waste duty of care is not compliant — even non-regulated waste requires duty of care compliance under Environmental Protection Act 1990`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: HomeWasteManagementRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const categoriesAudited = Object.entries(metrics.by_waste_category)
    .filter(([, count]) => count > 0)
    .length;
  insights.push(
    `[sky] ${metrics.total_audits} waste management ${metrics.total_audits === 1 ? "audit" : "audits"} recorded across ${categoriesAudited} waste categories. ` +
      `Compliance rate: ${metrics.compliance_rate}%. ` +
      `${metrics.non_compliant_count} non-compliant, ${metrics.action_required_count} requiring action. ` +
      `Total annual waste management cost: £${metrics.total_annual_cost.toLocaleString()}. ` +
      `${metrics.unique_providers} waste ${metrics.unique_providers === 1 ? "provider" : "providers"} used. ` +
      `Young people involved in ${metrics.young_people_involvement_rate}% of audits.`,
  );

  // Insight 2: Compliance and risk indicators
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority waste management alerts. ` +
        `Duty of care compliance: ${metrics.duty_of_care_rate}%. ` +
        `Waste transfer note rate: ${metrics.waste_transfer_note_rate}%. ` +
        `Carrier licence checked rate: ${metrics.carrier_licence_checked_rate}%. ` +
        `Contamination found in ${metrics.contamination_rate}% of audits. ` +
        `${metrics.bin_replacement_needed_count} ${metrics.bin_replacement_needed_count === 1 ? "bin needs" : "bins need"} replacement.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority waste management alerts. ` +
        `Duty of care rate: ${metrics.duty_of_care_rate}%. ` +
        `Storage compliance: ${metrics.storage_compliant_rate}%. ` +
        `${metrics.regulated_waste_count} regulated waste ${metrics.regulated_waste_count === 1 ? "category" : "categories"} managed. ` +
        `Continue monitoring waste management practices to maintain Reg 25 premises standards.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.contamination_rate > 20) {
    insights.push(
      `[reflect] Contamination was found in ${metrics.contamination_rate}% of waste audits. ` +
        `Are recycling instructions clearly displayed and accessible to children and staff? ` +
        `Could involving young people in designing recycling signage or monitoring reduce contamination rates while building environmental awareness?`,
    );
  } else if (metrics.young_people_involvement_rate < 30) {
    insights.push(
      `[reflect] Young people were involved in only ${metrics.young_people_involvement_rate}% of waste audits. ` +
        `Waste management and recycling provide practical opportunities for environmental education and life skills. ` +
        `How could the home increase young people's participation in recycling, composting, or waste reduction activities?`,
    );
  } else if (metrics.overdue_audits > 0) {
    insights.push(
      `[reflect] ${metrics.overdue_audits} waste ${metrics.overdue_audits === 1 ? "audit is" : "audits are"} overdue. ` +
        `Regular auditing ensures ongoing compliance with environmental legislation and maintains hygienic premises. ` +
        `Could waste audits be incorporated into the home's regular maintenance schedule to prevent gaps?`,
    );
  } else {
    insights.push(
      `[reflect] Is the home actively working to reduce overall waste production as part of the waste hierarchy? ` +
        `Beyond recycling, consider whether composting food waste, reducing single-use items, ` +
        `and choosing products with less packaging could be explored with young people as part of their environmental education.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listHomeWasteManagement(
  homeId: string,
  filters?: {
    wasteCategory?: WasteCategory;
    complianceStatus?: ComplianceStatus;
    binCondition?: BinCondition;
    limit?: number;
  },
): Promise<ServiceResult<HomeWasteManagementRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_home_waste_management") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.wasteCategory) q = q.eq("waste_category", filters.wasteCategory);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);
  if (filters?.binCondition) q = q.eq("bin_condition", filters.binCondition);

  q = q.order("audit_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getHomeWasteManagement(
  id: string,
): Promise<ServiceResult<HomeWasteManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_home_waste_management") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createHomeWasteManagement(input: {
  homeId: string;
  auditDate: string;
  auditorName: string;
  wasteCategory: WasteCategory;
  collectionFrequency: CollectionFrequency;
  providerName?: string | null;
  annualCost?: number | null;
  contaminationFound?: boolean;
  contaminationDetails?: string | null;
  binCondition: BinCondition;
  storageCompliant?: boolean;
  youngPeopleInvolved?: boolean;
  dutyOfCareCompliant?: boolean;
  wasteTransferNoteHeld?: boolean;
  wasteCarrierLicenceChecked?: boolean;
  nextAuditDate?: string | null;
  complianceStatus: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<HomeWasteManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateHomeWasteManagement({
    auditDate: input.auditDate,
    auditorName: input.auditorName,
    wasteCategory: input.wasteCategory,
    collectionFrequency: input.collectionFrequency,
    providerName: input.providerName,
    annualCost: input.annualCost,
    contaminationFound: input.contaminationFound,
    contaminationDetails: input.contaminationDetails,
    binCondition: input.binCondition,
    storageCompliant: input.storageCompliant,
    youngPeopleInvolved: input.youngPeopleInvolved,
    dutyOfCareCompliant: input.dutyOfCareCompliant,
    wasteTransferNoteHeld: input.wasteTransferNoteHeld,
    wasteCarrierLicenceChecked: input.wasteCarrierLicenceChecked,
    nextAuditDate: input.nextAuditDate,
    complianceStatus: input.complianceStatus,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_home_waste_management") as SB)
    .insert({
      home_id: input.homeId,
      audit_date: input.auditDate,
      auditor_name: input.auditorName,
      waste_category: input.wasteCategory,
      collection_frequency: input.collectionFrequency,
      provider_name: input.providerName ?? null,
      annual_cost: input.annualCost ?? null,
      contamination_found: input.contaminationFound ?? false,
      contamination_details: input.contaminationDetails ?? null,
      bin_condition: input.binCondition,
      storage_compliant: input.storageCompliant ?? false,
      young_people_involved: input.youngPeopleInvolved ?? false,
      duty_of_care_compliant: input.dutyOfCareCompliant ?? false,
      waste_transfer_note_held: input.wasteTransferNoteHeld ?? false,
      waste_carrier_licence_checked: input.wasteCarrierLicenceChecked ?? false,
      next_audit_date: input.nextAuditDate ?? null,
      compliance_status: input.complianceStatus,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateHomeWasteManagement(
  id: string,
  updates: Partial<{
    auditDate: string;
    auditorName: string;
    wasteCategory: WasteCategory;
    collectionFrequency: CollectionFrequency;
    providerName: string | null;
    annualCost: number | null;
    contaminationFound: boolean;
    contaminationDetails: string | null;
    binCondition: BinCondition;
    storageCompliant: boolean;
    youngPeopleInvolved: boolean;
    dutyOfCareCompliant: boolean;
    wasteTransferNoteHeld: boolean;
    wasteCarrierLicenceChecked: boolean;
    nextAuditDate: string | null;
    complianceStatus: ComplianceStatus;
    notes: string | null;
  }>,
): Promise<ServiceResult<HomeWasteManagementRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.auditDate !== undefined) mapped.audit_date = updates.auditDate;
  if (updates.auditorName !== undefined) mapped.auditor_name = updates.auditorName;
  if (updates.wasteCategory !== undefined) mapped.waste_category = updates.wasteCategory;
  if (updates.collectionFrequency !== undefined) mapped.collection_frequency = updates.collectionFrequency;
  if (updates.providerName !== undefined) mapped.provider_name = updates.providerName;
  if (updates.annualCost !== undefined) mapped.annual_cost = updates.annualCost;
  if (updates.contaminationFound !== undefined) mapped.contamination_found = updates.contaminationFound;
  if (updates.contaminationDetails !== undefined) mapped.contamination_details = updates.contaminationDetails;
  if (updates.binCondition !== undefined) mapped.bin_condition = updates.binCondition;
  if (updates.storageCompliant !== undefined) mapped.storage_compliant = updates.storageCompliant;
  if (updates.youngPeopleInvolved !== undefined) mapped.young_people_involved = updates.youngPeopleInvolved;
  if (updates.dutyOfCareCompliant !== undefined) mapped.duty_of_care_compliant = updates.dutyOfCareCompliant;
  if (updates.wasteTransferNoteHeld !== undefined) mapped.waste_transfer_note_held = updates.wasteTransferNoteHeld;
  if (updates.wasteCarrierLicenceChecked !== undefined) mapped.waste_carrier_licence_checked = updates.wasteCarrierLicenceChecked;
  if (updates.nextAuditDate !== undefined) mapped.next_audit_date = updates.nextAuditDate;
  if (updates.complianceStatus !== undefined) mapped.compliance_status = updates.complianceStatus;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_home_waste_management") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteHomeWasteManagement(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_home_waste_management") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

// -- Testing exports ----------------------------------------------------------

export const _testing = {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
  validateHomeWasteManagement,
};
