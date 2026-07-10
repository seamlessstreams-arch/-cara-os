// ==============================================================================
// CARA -- BIRTH FAMILY & PARENTAL CONTACT SUPPORT SERVICE
// Tracks birth family and parental contact support for looked-after children
// including pre-contact preparation, contact facilitation, post-contact debriefs,
// supervised contact, transport arrangements, venue booking, risk assessment
// updates, contact agreement reviews, mediation, therapeutic support, life story
// context work, and court order compliance.
//
// Covers: Pre-contact preparation with children, supervised and unsupervised
// contact facilitation, post-contact emotional debrief and support, transport
// arrangements to contact venues, venue booking and suitability assessment,
// risk assessment currency and updates, contact agreement review and revision,
// mediation between family members, therapeutic support referrals, life story
// work contextualising family relationships, court order compliance monitoring,
// child's views and wishes recording, safeguarding concern identification
// during contact, emotional response tracking, and social worker liaison.
//
// UK Regulatory Framework:
// CHR 2015 Reg 7 (contact with family/friends),
// Children Act 1989 s34 (presumption of contact),
// CHR 2015 Reg 12 (protection during contact),
// SCCIF: Overall experiences — "The home promotes contact unless it is
// not in children's interest."
// Care Planning Regulations 2010.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const FAMILY_ROLES = [
  "Birth Mother",
  "Birth Father",
  "Step-Parent",
  "Birth Sibling",
  "Half-Sibling",
  "Grandparent",
  "Aunt/Uncle",
  "Cousin",
  "Extended Family",
  "Former Carer",
  "Godparent",
  "Family Friend",
  "Other",
] as const;
export type FamilyRole = (typeof FAMILY_ROLES)[number];

export const SUPPORT_TYPES = [
  "Pre-Contact Preparation",
  "Contact Facilitation",
  "Post-Contact Debrief",
  "Supervised Contact",
  "Transport Arrangement",
  "Venue Booking",
  "Risk Assessment Update",
  "Contact Agreement Review",
  "Mediation",
  "Therapeutic Support",
  "Life Story Context",
  "Court Order Compliance",
] as const;
export type SupportType = (typeof SUPPORT_TYPES)[number];

export const EMOTIONAL_RESPONSES = [
  "Very Positive",
  "Positive",
  "Neutral",
  "Mixed",
  "Upset",
  "Distressed",
  "Angry",
  "Withdrawn",
] as const;
export type EmotionalResponse = (typeof EMOTIONAL_RESPONSES)[number];

export const STATUSES = [
  "Planned",
  "Completed",
  "Cancelled — by Home",
  "Cancelled — by Family",
  "Cancelled — by Child",
  "Suspended",
  "Under Review",
] as const;
export type Status = (typeof STATUSES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const NEGATIVE_EMOTIONAL_RESPONSES: EmotionalResponse[] = [
  "Upset",
  "Distressed",
  "Angry",
  "Withdrawn",
];

export const CANCELLED_STATUSES: Status[] = [
  "Cancelled — by Home",
  "Cancelled — by Family",
  "Cancelled — by Child",
];

export const SAFEGUARDING_SUPPORT_TYPES: SupportType[] = [
  "Supervised Contact",
  "Risk Assessment Update",
  "Court Order Compliance",
];

export const IMMEDIATE_FAMILY_ROLES: FamilyRole[] = [
  "Birth Mother",
  "Birth Father",
  "Step-Parent",
  "Birth Sibling",
  "Half-Sibling",
];

// -- Label maps ---------------------------------------------------------------

export const FAMILY_ROLE_LABELS: { role: FamilyRole; label: string }[] = [
  { role: "Birth Mother", label: "Birth Mother" },
  { role: "Birth Father", label: "Birth Father" },
  { role: "Step-Parent", label: "Step-Parent" },
  { role: "Birth Sibling", label: "Birth Sibling" },
  { role: "Half-Sibling", label: "Half-Sibling" },
  { role: "Grandparent", label: "Grandparent" },
  { role: "Aunt/Uncle", label: "Aunt / Uncle" },
  { role: "Cousin", label: "Cousin" },
  { role: "Extended Family", label: "Extended Family" },
  { role: "Former Carer", label: "Former Carer" },
  { role: "Godparent", label: "Godparent" },
  { role: "Family Friend", label: "Family Friend" },
  { role: "Other", label: "Other" },
];

export const SUPPORT_TYPE_LABELS: { type: SupportType; label: string }[] = [
  { type: "Pre-Contact Preparation", label: "Pre-Contact Preparation" },
  { type: "Contact Facilitation", label: "Contact Facilitation" },
  { type: "Post-Contact Debrief", label: "Post-Contact Debrief" },
  { type: "Supervised Contact", label: "Supervised Contact" },
  { type: "Transport Arrangement", label: "Transport Arrangement" },
  { type: "Venue Booking", label: "Venue Booking" },
  { type: "Risk Assessment Update", label: "Risk Assessment Update" },
  { type: "Contact Agreement Review", label: "Contact Agreement Review" },
  { type: "Mediation", label: "Mediation" },
  { type: "Therapeutic Support", label: "Therapeutic Support" },
  { type: "Life Story Context", label: "Life Story Context" },
  { type: "Court Order Compliance", label: "Court Order Compliance" },
];

export const EMOTIONAL_RESPONSE_LABELS: { response: EmotionalResponse; label: string }[] = [
  { response: "Very Positive", label: "Very Positive" },
  { response: "Positive", label: "Positive" },
  { response: "Neutral", label: "Neutral" },
  { response: "Mixed", label: "Mixed" },
  { response: "Upset", label: "Upset" },
  { response: "Distressed", label: "Distressed" },
  { response: "Angry", label: "Angry" },
  { response: "Withdrawn", label: "Withdrawn" },
];

export const STATUS_LABELS: { status: Status; label: string }[] = [
  { status: "Planned", label: "Planned" },
  { status: "Completed", label: "Completed" },
  { status: "Cancelled — by Home", label: "Cancelled — by Home" },
  { status: "Cancelled — by Family", label: "Cancelled — by Family" },
  { status: "Cancelled — by Child", label: "Cancelled — by Child" },
  { status: "Suspended", label: "Suspended" },
  { status: "Under Review", label: "Under Review" },
];

// -- Row type -----------------------------------------------------------------

export interface BirthFamilyContactSupportRow {
  id: string;
  home_id: string;
  child_name: string;
  contact_person_name: string;
  family_role: FamilyRole;
  support_type: SupportType;
  contact_date: string;
  support_provided_by: string;
  child_prepared: boolean;
  child_views_considered: boolean;
  risk_assessment_current: boolean;
  safeguarding_concerns: boolean;
  concern_details: string | null;
  contact_plan_followed: boolean;
  child_emotional_response: EmotionalResponse;
  support_after_contact: boolean;
  social_worker_informed: boolean;
  court_order_in_place: boolean;
  contact_frequency_agreed: string | null;
  next_contact_date: string | null;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateBirthFamilyContactSupport(input: {
  childName?: string;
  contactPersonName?: string;
  familyRole?: string;
  supportType?: string;
  contactDate?: string;
  supportProvidedBy?: string;
  safeguardingConcerns?: boolean;
  concernDetails?: string | null;
  childEmotionalResponse?: string;
  courtOrderInPlace?: boolean;
  contactPlanFollowed?: boolean;
  nextContactDate?: string | null;
  status?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.contactPersonName || input.contactPersonName.trim().length === 0) {
    errors.push("Contact person name is required");
  }

  if (!input.familyRole || !(FAMILY_ROLES as readonly string[]).includes(input.familyRole)) {
    errors.push(`Family role must be one of: ${FAMILY_ROLES.join(", ")}`);
  }

  if (!input.supportType || !(SUPPORT_TYPES as readonly string[]).includes(input.supportType)) {
    errors.push(`Support type must be one of: ${SUPPORT_TYPES.join(", ")}`);
  }

  if (!input.contactDate) {
    errors.push("Contact date is required");
  } else {
    const dateObj = new Date(input.contactDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Contact date must be a valid date");
    }
  }

  if (!input.supportProvidedBy || input.supportProvidedBy.trim().length === 0) {
    errors.push("Support provided by (staff name) is required");
  }

  if (
    input.childEmotionalResponse &&
    !(EMOTIONAL_RESPONSES as readonly string[]).includes(input.childEmotionalResponse)
  ) {
    errors.push(`Child emotional response must be one of: ${EMOTIONAL_RESPONSES.join(", ")}`);
  }

  if (input.status && !(STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  // Business rule: Safeguarding concerns must have details
  if (input.safeguardingConcerns && (!input.concernDetails || input.concernDetails.trim().length === 0)) {
    errors.push("Safeguarding concerns require detailed description per CHR 2015 Reg 12");
  }

  // Business rule: Supervised contact should have risk assessment confirmed
  if (input.supportType === "Supervised Contact" && input.safeguardingConcerns === undefined) {
    errors.push("Supervised contact records must indicate whether safeguarding concerns exist");
  }

  // Business rule: Court order compliance must confirm court order in place
  if (input.supportType === "Court Order Compliance" && input.courtOrderInPlace !== true) {
    errors.push("Court order compliance support type requires a court order to be in place");
  }

  // Business rule: Contact plan not followed should have notes
  if (input.contactPlanFollowed === false && input.status === "Completed") {
    // Soft validation — we allow it but encourage notes via alerts
  }

  // Business rule: Next contact date should not be in the past for planned contacts
  if (input.nextContactDate) {
    const nextDate = new Date(input.nextContactDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(nextDate.getTime())) {
      errors.push("Next contact date must be a valid date");
    } else if (nextDate < today && input.status === "Planned") {
      errors.push("Next contact date for planned contacts should not be in the past");
    }
  }

  // Business rule: Cancelled by child should consider child views
  if (input.status === "Cancelled — by Child" && input.childEmotionalResponse === undefined) {
    errors.push("When contact is cancelled by the child, their emotional response should be recorded to evidence their views were considered per Children Act 1989 s34");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: BirthFamilyContactSupportRow[],
): {
  total_records: number;
  by_family_role: Record<string, number>;
  by_support_type: Record<string, number>;
  by_emotional_response: Record<string, number>;
  preparation_rate: number;
  child_views_rate: number;
  risk_assessment_currency_rate: number;
  safeguarding_concern_rate: number;
  contact_plan_adherence_rate: number;
  post_contact_support_rate: number;
  cancellation_rate: number;
  cancellation_by_home: number;
  cancellation_by_family: number;
  cancellation_by_child: number;
  court_order_count: number;
  unique_children: number;
  unique_contacts: number;
} {
  const total = rows.length;

  // Family role breakdown
  const byFamilyRole: Record<string, number> = {};
  for (const fr of FAMILY_ROLES) byFamilyRole[fr] = 0;
  for (const r of rows) byFamilyRole[r.family_role] = (byFamilyRole[r.family_role] || 0) + 1;

  // Support type breakdown
  const bySupportType: Record<string, number> = {};
  for (const st of SUPPORT_TYPES) bySupportType[st] = 0;
  for (const r of rows) bySupportType[r.support_type] = (bySupportType[r.support_type] || 0) + 1;

  // Emotional response breakdown
  const byEmotional: Record<string, number> = {};
  for (const er of EMOTIONAL_RESPONSES) byEmotional[er] = 0;
  for (const r of rows) byEmotional[r.child_emotional_response] = (byEmotional[r.child_emotional_response] || 0) + 1;

  // Completed contacts for rate calculations
  const completedRows = rows.filter((r) => r.status === "Completed");
  const completedTotal = completedRows.length;

  // Preparation rate (for completed contacts)
  const preparationRate = completedTotal > 0
    ? Math.round((completedRows.filter((r) => r.child_prepared).length / completedTotal) * 1000) / 10
    : 0;

  // Child views rate
  const childViewsRate = completedTotal > 0
    ? Math.round((completedRows.filter((r) => r.child_views_considered).length / completedTotal) * 1000) / 10
    : 0;

  // Risk assessment currency rate
  const riskAssessmentRate = total > 0
    ? Math.round((rows.filter((r) => r.risk_assessment_current).length / total) * 1000) / 10
    : 0;

  // Safeguarding concern rate
  const safeguardingRate = total > 0
    ? Math.round((rows.filter((r) => r.safeguarding_concerns).length / total) * 1000) / 10
    : 0;

  // Contact plan adherence rate (for completed contacts)
  const contactPlanRate = completedTotal > 0
    ? Math.round((completedRows.filter((r) => r.contact_plan_followed).length / completedTotal) * 1000) / 10
    : 0;

  // Post-contact support rate (for completed contacts)
  const postContactRate = completedTotal > 0
    ? Math.round((completedRows.filter((r) => r.support_after_contact).length / completedTotal) * 1000) / 10
    : 0;

  // Cancellation rates
  const cancelledRows = rows.filter((r) => (CANCELLED_STATUSES as string[]).includes(r.status));
  const cancellationRate = total > 0
    ? Math.round((cancelledRows.length / total) * 1000) / 10
    : 0;
  const cancelByHome = rows.filter((r) => r.status === "Cancelled — by Home").length;
  const cancelByFamily = rows.filter((r) => r.status === "Cancelled — by Family").length;
  const cancelByChild = rows.filter((r) => r.status === "Cancelled — by Child").length;

  // Court order count
  const courtOrderCount = rows.filter((r) => r.court_order_in_place).length;

  // Unique children and contacts
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));
  const uniqueContacts = new Set(rows.map((r) => r.contact_person_name.toLowerCase().trim()));

  return {
    total_records: total,
    by_family_role: byFamilyRole,
    by_support_type: bySupportType,
    by_emotional_response: byEmotional,
    preparation_rate: preparationRate,
    child_views_rate: childViewsRate,
    risk_assessment_currency_rate: riskAssessmentRate,
    safeguarding_concern_rate: safeguardingRate,
    contact_plan_adherence_rate: contactPlanRate,
    post_contact_support_rate: postContactRate,
    cancellation_rate: cancellationRate,
    cancellation_by_home: cancelByHome,
    cancellation_by_family: cancelByFamily,
    cancellation_by_child: cancelByChild,
    court_order_count: courtOrderCount,
    unique_children: uniqueChildren.size,
    unique_contacts: uniqueContacts.size,
  };
}

export function computeAlerts(
  rows: BirthFamilyContactSupportRow[],
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

  // Critical: Safeguarding concerns with social worker not informed
  for (const r of rows) {
    if (r.safeguarding_concerns && !r.social_worker_informed) {
      alerts.push({
        type: "safeguarding_sw_not_informed",
        severity: "critical",
        message: `Safeguarding concerns identified during contact with ${r.contact_person_name} for ${r.child_name} on ${r.contact_date} but social worker has not been informed — immediate notification required per CHR 2015 Reg 12`,
        record_id: r.id,
      });
    }
  }

  // Critical: Risk assessment not current for supervised contact
  for (const r of rows) {
    if (r.support_type === "Supervised Contact" && !r.risk_assessment_current) {
      alerts.push({
        type: "supervised_no_risk_assessment",
        severity: "critical",
        message: `Supervised contact with ${r.contact_person_name} for ${r.child_name} on ${r.contact_date}: risk assessment is not current — contact should not proceed without an up-to-date risk assessment per CHR 2015 Reg 12`,
        record_id: r.id,
      });
    }
  }

  // Critical: Child distressed and no post-contact support
  for (const r of rows) {
    if (
      (r.child_emotional_response === "Distressed" || r.child_emotional_response === "Angry") &&
      !r.support_after_contact &&
      r.status === "Completed"
    ) {
      alerts.push({
        type: "distressed_no_support",
        severity: "critical",
        message: `${r.child_name} was ${r.child_emotional_response.toLowerCase()} after contact with ${r.contact_person_name} on ${r.contact_date} but no post-contact support was provided — immediate emotional support required per CHR 2015 Reg 7`,
        record_id: r.id,
      });
    }
  }

  // High: Contact plan not followed
  for (const r of rows) {
    if (!r.contact_plan_followed && r.status === "Completed") {
      alerts.push({
        type: "contact_plan_not_followed",
        severity: "high",
        message: `Contact plan was not followed for ${r.child_name}'s contact with ${r.contact_person_name} on ${r.contact_date} — review contact agreement and update as necessary per Care Planning Regulations 2010`,
        record_id: r.id,
      });
    }
  }

  // High: Child not prepared for contact
  for (const r of rows) {
    if (!r.child_prepared && r.status === "Completed") {
      alerts.push({
        type: "child_not_prepared",
        severity: "high",
        message: `${r.child_name} was not prepared before contact with ${r.contact_person_name} on ${r.contact_date} — pre-contact preparation is essential per SCCIF guidance on promoting positive contact experiences`,
        record_id: r.id,
      });
    }
  }

  // High: Child views not considered
  for (const r of rows) {
    if (!r.child_views_considered && r.status === "Completed") {
      alerts.push({
        type: "child_views_not_considered",
        severity: "high",
        message: `${r.child_name}'s views were not considered for contact with ${r.contact_person_name} on ${r.contact_date} — Children Act 1989 s34 requires the child's wishes and feelings to be ascertained`,
        record_id: r.id,
      });
    }
  }

  // High: Court order contact suspended
  for (const r of rows) {
    if (r.court_order_in_place && r.status === "Suspended") {
      alerts.push({
        type: "court_order_suspended",
        severity: "high",
        message: `Contact with ${r.contact_person_name} for ${r.child_name} is court-ordered but has been suspended — ensure legal authority for suspension and notify the court and social worker immediately`,
        record_id: r.id,
      });
    }
  }

  // High: Repeated negative emotional responses for same child
  const childEmotionalMap = new Map<string, BirthFamilyContactSupportRow[]>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    if (!childEmotionalMap.has(key)) childEmotionalMap.set(key, []);
    childEmotionalMap.get(key)!.push(r);
  }
  for (const [, childRows] of childEmotionalMap) {
    const negativeCount = childRows.filter(
      (r) => (NEGATIVE_EMOTIONAL_RESPONSES as string[]).includes(r.child_emotional_response),
    ).length;
    if (negativeCount >= 3) {
      alerts.push({
        type: "repeated_negative_response",
        severity: "high",
        message: `${childRows[0].child_name} has had ${negativeCount} negative emotional responses across contact sessions — review whether contact arrangements remain in the child's best interest per Children Act 1989 s34`,
      });
    }
  }

  // Medium: Overdue next contact dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of rows) {
    if (r.next_contact_date && r.status !== "Suspended" && r.status !== "Under Review") {
      const nextDate = new Date(r.next_contact_date);
      if (nextDate < today) {
        alerts.push({
          type: "overdue_contact",
          severity: "medium",
          message: `Next contact for ${r.child_name} with ${r.contact_person_name} was due on ${r.next_contact_date} and is now overdue — CHR 2015 Reg 7 requires the home to promote contact unless contrary to interests`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: High cancellation rate by home
  const homeRows = rows.filter((r) => r.status === "Cancelled — by Home");
  if (rows.length > 5 && homeRows.length / rows.length > 0.2) {
    alerts.push({
      type: "high_home_cancellation",
      severity: "medium",
      message: `${homeRows.length} contacts have been cancelled by the home (${Math.round((homeRows.length / rows.length) * 100)}%) — review whether the home is adequately facilitating contact per CHR 2015 Reg 7`,
    });
  }

  // Medium: No social worker informed across multiple records
  const swNotInformed = rows.filter((r) => !r.social_worker_informed && r.status === "Completed");
  if (swNotInformed.length >= 3) {
    alerts.push({
      type: "pattern_sw_not_informed",
      severity: "medium",
      message: `${swNotInformed.length} completed contact records have not informed the social worker — ensure systematic communication with social workers per Care Planning Regulations 2010`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: BirthFamilyContactSupportRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const roleBreakdown = Object.entries(metrics.by_family_role)
    .filter(([, count]) => count > 0)
    .map(([role, count]) => `${role}: ${count}`)
    .join(", ");

  const emotionalBreakdown = Object.entries(metrics.by_emotional_response)
    .filter(([, count]) => count > 0)
    .map(([response, count]) => `${response}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} birth family contact support ${metrics.total_records === 1 ? "record" : "records"} ` +
      `covering ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"} and ` +
      `${metrics.unique_contacts} unique ${metrics.unique_contacts === 1 ? "contact" : "contacts"}. ` +
      `Family roles: ${roleBreakdown || "none recorded"}. ` +
      `Emotional responses: ${emotionalBreakdown || "none recorded"}. ` +
      `Court orders in place: ${metrics.court_order_count}. ` +
      `Cancellation rate: ${metrics.cancellation_rate}% ` +
      `(Home: ${metrics.cancellation_by_home}, Family: ${metrics.cancellation_by_family}, Child: ${metrics.cancellation_by_child}).`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Preparation rate: ${metrics.preparation_rate}%. ` +
        `Child views considered: ${metrics.child_views_rate}%. ` +
        `Risk assessment currency: ${metrics.risk_assessment_currency_rate}%. ` +
        `Safeguarding concerns: ${metrics.safeguarding_concern_rate}%. ` +
        `Contact plan adherence: ${metrics.contact_plan_adherence_rate}%. ` +
        `Post-contact support: ${metrics.post_contact_support_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority contact alerts. ` +
        `Preparation rate: ${metrics.preparation_rate}%. ` +
        `Child views considered: ${metrics.child_views_rate}%. ` +
        `Risk assessment currency: ${metrics.risk_assessment_currency_rate}%. ` +
        `Contact plan adherence: ${metrics.contact_plan_adherence_rate}%. ` +
        `Post-contact support: ${metrics.post_contact_support_rate}%. ` +
        `Continue promoting positive family contact per CHR 2015 Reg 7.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.child_views_rate < 70 && metrics.total_records > 0) {
    insights.push(
      `[reflect] Child views are being considered in only ${metrics.child_views_rate}% of contact ` +
        `records. Are children being routinely asked about their wishes and feelings regarding ` +
        `family contact? The Children Act 1989 s34 establishes a presumption of contact but ` +
        `also requires that the child's wishes and feelings are ascertained. SCCIF inspectors ` +
        `will look for evidence that children's views genuinely shape contact arrangements, ` +
        `not just that contact happens. Every child should feel heard and empowered in decisions ` +
        `about their family relationships.`,
    );
  } else if (metrics.preparation_rate < 60 && metrics.total_records > 0) {
    insights.push(
      `[reflect] Pre-contact preparation rate is only ${metrics.preparation_rate}%. Are children ` +
        `being adequately prepared before family contact? Preparation helps children manage their ` +
        `emotions and expectations, reducing the risk of distress. CHR 2015 Reg 7 requires the ` +
        `home to promote contact, and this includes ensuring children are emotionally ready. ` +
        `Good preparation also supports post-contact debriefing and helps staff understand ` +
        `each child's evolving relationship with their birth family.`,
    );
  } else if (metrics.safeguarding_concern_rate > 20) {
    insights.push(
      `[reflect] Safeguarding concerns have been identified in ${metrics.safeguarding_concern_rate}% ` +
        `of contact records. Is the home's risk assessment process robust enough? Are contact ` +
        `arrangements being reviewed regularly in light of emerging concerns? CHR 2015 Reg 12 ` +
        `requires the home to protect children from harm, including during contact. Where ` +
        `safeguarding concerns arise, immediate action, social worker notification, and contact ` +
        `agreement review are essential. The presumption of contact under s34 does not override ` +
        `the child's safety.`,
    );
  } else {
    insights.push(
      `[reflect] How does the home balance promoting family contact with protecting children's ` +
        `emotional wellbeing? Are post-contact debriefs being used to inform future contact ` +
        `planning? Do children feel they can say no to contact without negative consequences? ` +
        `CHR 2015 Reg 7 creates a duty to promote contact, but SCCIF also expects the home ` +
        `to recognise when contact is not in the child's interest. The quality of contact ` +
        `matters as much as the frequency, and children's evolving views should continuously ` +
        `shape arrangements.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    familyRole?: FamilyRole;
    supportType?: SupportType;
    status?: Status;
    limit?: number;
  },
): Promise<ServiceResult<BirthFamilyContactSupportRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_birth_family_contact_support") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.familyRole) q = q.eq("family_role", filters.familyRole);
  if (filters?.supportType) q = q.eq("support_type", filters.supportType);
  if (filters?.status) q = q.eq("status", filters.status);

  q = q.order("contact_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<BirthFamilyContactSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_birth_family_contact_support") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  contactPersonName: string;
  familyRole: FamilyRole;
  supportType: SupportType;
  contactDate: string;
  supportProvidedBy: string;
  childPrepared?: boolean;
  childViewsConsidered?: boolean;
  riskAssessmentCurrent?: boolean;
  safeguardingConcerns?: boolean;
  concernDetails?: string | null;
  contactPlanFollowed?: boolean;
  childEmotionalResponse?: EmotionalResponse;
  supportAfterContact?: boolean;
  socialWorkerInformed?: boolean;
  courtOrderInPlace?: boolean;
  contactFrequencyAgreed?: string | null;
  nextContactDate?: string | null;
  status?: Status;
  notes?: string | null;
}): Promise<ServiceResult<BirthFamilyContactSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateBirthFamilyContactSupport({
    childName: input.childName,
    contactPersonName: input.contactPersonName,
    familyRole: input.familyRole,
    supportType: input.supportType,
    contactDate: input.contactDate,
    supportProvidedBy: input.supportProvidedBy,
    safeguardingConcerns: input.safeguardingConcerns,
    concernDetails: input.concernDetails,
    childEmotionalResponse: input.childEmotionalResponse,
    courtOrderInPlace: input.courtOrderInPlace,
    contactPlanFollowed: input.contactPlanFollowed,
    nextContactDate: input.nextContactDate,
    status: input.status,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_birth_family_contact_support") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      contact_person_name: input.contactPersonName,
      family_role: input.familyRole,
      support_type: input.supportType,
      contact_date: input.contactDate,
      support_provided_by: input.supportProvidedBy,
      child_prepared: input.childPrepared ?? false,
      child_views_considered: input.childViewsConsidered ?? false,
      risk_assessment_current: input.riskAssessmentCurrent ?? false,
      safeguarding_concerns: input.safeguardingConcerns ?? false,
      concern_details: input.concernDetails ?? null,
      contact_plan_followed: input.contactPlanFollowed ?? true,
      child_emotional_response: input.childEmotionalResponse ?? "Neutral",
      support_after_contact: input.supportAfterContact ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      court_order_in_place: input.courtOrderInPlace ?? false,
      contact_frequency_agreed: input.contactFrequencyAgreed ?? null,
      next_contact_date: input.nextContactDate ?? null,
      status: input.status ?? "Planned",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    childName: string;
    contactPersonName: string;
    familyRole: FamilyRole;
    supportType: SupportType;
    contactDate: string;
    supportProvidedBy: string;
    childPrepared: boolean;
    childViewsConsidered: boolean;
    riskAssessmentCurrent: boolean;
    safeguardingConcerns: boolean;
    concernDetails: string | null;
    contactPlanFollowed: boolean;
    childEmotionalResponse: EmotionalResponse;
    supportAfterContact: boolean;
    socialWorkerInformed: boolean;
    courtOrderInPlace: boolean;
    contactFrequencyAgreed: string | null;
    nextContactDate: string | null;
    status: Status;
    notes: string | null;
  }>,
): Promise<ServiceResult<BirthFamilyContactSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.contactPersonName !== undefined) mapped.contact_person_name = updates.contactPersonName;
  if (updates.familyRole !== undefined) mapped.family_role = updates.familyRole;
  if (updates.supportType !== undefined) mapped.support_type = updates.supportType;
  if (updates.contactDate !== undefined) mapped.contact_date = updates.contactDate;
  if (updates.supportProvidedBy !== undefined) mapped.support_provided_by = updates.supportProvidedBy;
  if (updates.childPrepared !== undefined) mapped.child_prepared = updates.childPrepared;
  if (updates.childViewsConsidered !== undefined) mapped.child_views_considered = updates.childViewsConsidered;
  if (updates.riskAssessmentCurrent !== undefined) mapped.risk_assessment_current = updates.riskAssessmentCurrent;
  if (updates.safeguardingConcerns !== undefined) mapped.safeguarding_concerns = updates.safeguardingConcerns;
  if (updates.concernDetails !== undefined) mapped.concern_details = updates.concernDetails;
  if (updates.contactPlanFollowed !== undefined) mapped.contact_plan_followed = updates.contactPlanFollowed;
  if (updates.childEmotionalResponse !== undefined) mapped.child_emotional_response = updates.childEmotionalResponse;
  if (updates.supportAfterContact !== undefined) mapped.support_after_contact = updates.supportAfterContact;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.courtOrderInPlace !== undefined) mapped.court_order_in_place = updates.courtOrderInPlace;
  if (updates.contactFrequencyAgreed !== undefined) mapped.contact_frequency_agreed = updates.contactFrequencyAgreed;
  if (updates.nextContactDate !== undefined) mapped.next_contact_date = updates.nextContactDate;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_birth_family_contact_support") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_birth_family_contact_support") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
