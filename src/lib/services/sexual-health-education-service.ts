// ==============================================================================
// CARA -- SEXUAL HEALTH & RELATIONSHIPS EDUCATION SERVICE
// Tracks sexual health and relationships education sessions for looked-after
// children including RSE lessons, 1-to-1 discussions, C-Card scheme access,
// clinic appointments, GP referrals, pregnancy test support, STI screening
// support, contraception advice, healthy relationships sessions, consent
// education, online safety (sexual content), CSE awareness, puberty support,
// gender identity support, LGBTQ+ support, and body confidence sessions.
//
// Covers: Age-appropriate RSE delivery, Gillick competency assessment, Fraser
// guideline application, consent and confidentiality processes, safeguarding
// concern identification and referral, Brook and GUM clinic referral tracking,
// school awareness coordination, social worker notification for safeguarding,
// young person engagement monitoring, resource provision tracking, follow-up
// scheduling, and multi-agency coordination for sexual health education.
//
// UK Regulatory Framework:
// CHR 2015 Reg 10 (health), Reg 13 (healthcare provision),
// DfE RSHE statutory guidance 2020,
// Gillick competency, Fraser guidelines,
// Brook guidance,
// SCCIF: Health — "The home supports age-appropriate sexual health education."
// NICE PH51 (contraception), BASHH guidelines.
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const SESSION_TYPES = [
  "RSE Lesson",
  "1-to-1 Discussion",
  "C-Card Scheme Access",
  "Clinic Appointment",
  "GP Referral",
  "Pregnancy Test Support",
  "STI Screening Support",
  "Contraception Advice",
  "Healthy Relationships Session",
  "Consent Education",
  "Online Safety — Sexual Content",
  "CSE Awareness",
  "Puberty Support",
  "Gender Identity Support",
  "LGBTQ+ Support",
  "Body Confidence",
] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const CLINICAL_SESSION_TYPES: SessionType[] = [
  "Clinic Appointment",
  "GP Referral",
  "Pregnancy Test Support",
  "STI Screening Support",
  "Contraception Advice",
  "C-Card Scheme Access",
];

export const SAFEGUARDING_SENSITIVE_TYPES: SessionType[] = [
  "CSE Awareness",
  "Online Safety — Sexual Content",
  "Pregnancy Test Support",
  "STI Screening Support",
];

export const EDUCATION_SESSION_TYPES: SessionType[] = [
  "RSE Lesson",
  "Consent Education",
  "Healthy Relationships Session",
  "Puberty Support",
  "Body Confidence",
];

export const IDENTITY_SESSION_TYPES: SessionType[] = [
  "Gender Identity Support",
  "LGBTQ+ Support",
  "Body Confidence",
];

// -- Label maps ---------------------------------------------------------------

export const SESSION_TYPE_LABELS: { type: SessionType; label: string }[] = [
  { type: "RSE Lesson", label: "RSE Lesson" },
  { type: "1-to-1 Discussion", label: "1-to-1 Discussion" },
  { type: "C-Card Scheme Access", label: "C-Card Scheme Access" },
  { type: "Clinic Appointment", label: "Clinic Appointment" },
  { type: "GP Referral", label: "GP Referral" },
  { type: "Pregnancy Test Support", label: "Pregnancy Test Support" },
  { type: "STI Screening Support", label: "STI Screening Support" },
  { type: "Contraception Advice", label: "Contraception Advice" },
  { type: "Healthy Relationships Session", label: "Healthy Relationships Session" },
  { type: "Consent Education", label: "Consent Education" },
  { type: "Online Safety — Sexual Content", label: "Online Safety — Sexual Content" },
  { type: "CSE Awareness", label: "CSE Awareness" },
  { type: "Puberty Support", label: "Puberty Support" },
  { type: "Gender Identity Support", label: "Gender Identity Support" },
  { type: "LGBTQ+ Support", label: "LGBTQ+ Support" },
  { type: "Body Confidence", label: "Body Confidence" },
];

// -- Row type -----------------------------------------------------------------

export interface SexualHealthEducationRow {
  id: string;
  home_id: string;
  child_name: string;
  session_date: string;
  facilitator_name: string;
  session_type: SessionType;
  age_appropriate: boolean;
  gillick_competent: boolean | null;
  consent_given: boolean;
  confidentiality_explained: boolean;
  safeguarding_concerns: boolean;
  concern_details: string | null;
  referral_made: boolean;
  referral_service: string | null;
  school_aware: boolean;
  social_worker_informed: boolean;
  young_person_engaged: boolean;
  resources_provided: boolean;
  follow_up_required: boolean;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateSexualHealthEducation(input: {
  childName?: string;
  sessionDate?: string;
  facilitatorName?: string;
  sessionType?: string;
  gillickCompetent?: boolean | null;
  safeguardingConcerns?: boolean;
  concernDetails?: string | null;
  referralMade?: boolean;
  referralService?: string | null;
  consentGiven?: boolean;
  confidentialityExplained?: boolean;
  followUpRequired?: boolean;
  followUpDate?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.sessionDate) {
    errors.push("Session date is required");
  } else {
    const dateObj = new Date(input.sessionDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Session date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Session date cannot be in the future");
    }
  }

  if (!input.facilitatorName || input.facilitatorName.trim().length === 0) {
    errors.push("Facilitator name is required");
  }

  if (!input.sessionType || !(SESSION_TYPES as readonly string[]).includes(input.sessionType)) {
    errors.push(`Session type must be one of: ${SESSION_TYPES.join(", ")}`);
  }

  // Business rule: Safeguarding concerns must have details
  if (input.safeguardingConcerns && (!input.concernDetails || input.concernDetails.trim().length === 0)) {
    errors.push("Concern details are required when safeguarding concerns are identified");
  }

  // Business rule: Safeguarding concerns should trigger social worker notification
  if (input.safeguardingConcerns && input.sessionType) {
    // Advisory — logged as warning but not blocking
  }

  // Business rule: Referrals must specify the service
  if (input.referralMade && (!input.referralService || input.referralService.trim().length === 0)) {
    errors.push("Referral service must be specified when a referral is made (e.g. Brook, GUM clinic, GP)");
  }

  // Business rule: Consent is critical for clinical sessions
  if (
    input.sessionType &&
    (CLINICAL_SESSION_TYPES as string[]).includes(input.sessionType) &&
    input.consentGiven === false
  ) {
    errors.push("Clinical sessions (clinic appointments, screening, contraception) require consent — record why consent was not given in notes");
  }

  // Business rule: Confidentiality must always be explained
  if (input.confidentialityExplained === false) {
    errors.push("Confidentiality must be explained before any sexual health session — this is a Fraser guidelines requirement");
  }

  // Business rule: Follow-up date should be provided if follow-up required
  if (input.followUpRequired && !input.followUpDate) {
    errors.push("Follow-up date should be specified when follow-up is required");
  }

  // Business rule: Follow-up date should be in the future
  if (input.followUpDate) {
    const followDate = new Date(input.followUpDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(followDate.getTime())) {
      errors.push("Follow-up date must be a valid date");
    } else if (followDate < today) {
      errors.push("Follow-up date should not be in the past");
    }
  }

  // Business rule: Gillick competency should only be assessed for under-16s
  // (we cannot verify age here, but we flag if it is explicitly set for non-clinical)
  if (
    input.gillickCompetent !== null &&
    input.gillickCompetent !== undefined &&
    input.sessionType &&
    !(CLINICAL_SESSION_TYPES as string[]).includes(input.sessionType) &&
    !(SAFEGUARDING_SENSITIVE_TYPES as string[]).includes(input.sessionType) &&
    input.sessionType !== "1-to-1 Discussion"
  ) {
    // Advisory only — Gillick is typically relevant for clinical/sensitive sessions
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: SexualHealthEducationRow[],
): {
  total_sessions: number;
  unique_children: number;
  by_session_type: Record<string, number>;
  engagement_rate: number;
  referral_rate: number;
  safeguarding_concern_rate: number;
  consent_rate: number;
  confidentiality_rate: number;
  age_appropriate_rate: number;
  follow_up_rate: number;
  resources_rate: number;
  school_aware_rate: number;
  social_worker_informed_rate: number;
  clinical_session_count: number;
  education_session_count: number;
  identity_session_count: number;
} {
  const total = rows.length;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Session type breakdown
  const bySessionType: Record<string, number> = {};
  for (const st of SESSION_TYPES) bySessionType[st] = 0;
  for (const r of rows) bySessionType[r.session_type] = (bySessionType[r.session_type] || 0) + 1;

  // Boolean rates
  const engagementRate = total > 0
    ? Math.round((rows.filter((r) => r.young_person_engaged).length / total) * 1000) / 10
    : 0;

  const referralRate = total > 0
    ? Math.round((rows.filter((r) => r.referral_made).length / total) * 1000) / 10
    : 0;

  const safeguardingConcernRate = total > 0
    ? Math.round((rows.filter((r) => r.safeguarding_concerns).length / total) * 1000) / 10
    : 0;

  const consentRate = total > 0
    ? Math.round((rows.filter((r) => r.consent_given).length / total) * 1000) / 10
    : 0;

  const confidentialityRate = total > 0
    ? Math.round((rows.filter((r) => r.confidentiality_explained).length / total) * 1000) / 10
    : 0;

  const ageAppropriateRate = total > 0
    ? Math.round((rows.filter((r) => r.age_appropriate).length / total) * 1000) / 10
    : 0;

  const followUpRate = total > 0
    ? Math.round((rows.filter((r) => r.follow_up_required).length / total) * 1000) / 10
    : 0;

  const resourcesRate = total > 0
    ? Math.round((rows.filter((r) => r.resources_provided).length / total) * 1000) / 10
    : 0;

  const schoolAwareRate = total > 0
    ? Math.round((rows.filter((r) => r.school_aware).length / total) * 1000) / 10
    : 0;

  const socialWorkerInformedRate = total > 0
    ? Math.round((rows.filter((r) => r.social_worker_informed).length / total) * 1000) / 10
    : 0;

  // Category counts
  const clinicalSessionCount = rows.filter(
    (r) => (CLINICAL_SESSION_TYPES as string[]).includes(r.session_type),
  ).length;

  const educationSessionCount = rows.filter(
    (r) => (EDUCATION_SESSION_TYPES as string[]).includes(r.session_type),
  ).length;

  const identitySessionCount = rows.filter(
    (r) => (IDENTITY_SESSION_TYPES as string[]).includes(r.session_type),
  ).length;

  return {
    total_sessions: total,
    unique_children: uniqueChildren.size,
    by_session_type: bySessionType,
    engagement_rate: engagementRate,
    referral_rate: referralRate,
    safeguarding_concern_rate: safeguardingConcernRate,
    consent_rate: consentRate,
    confidentiality_rate: confidentialityRate,
    age_appropriate_rate: ageAppropriateRate,
    follow_up_rate: followUpRate,
    resources_rate: resourcesRate,
    school_aware_rate: schoolAwareRate,
    social_worker_informed_rate: socialWorkerInformedRate,
    clinical_session_count: clinicalSessionCount,
    education_session_count: educationSessionCount,
    identity_session_count: identitySessionCount,
  };
}

export function computeAlerts(
  rows: SexualHealthEducationRow[],
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

  // Critical: Safeguarding concern without social worker notification
  for (const r of rows) {
    if (r.safeguarding_concerns && !r.social_worker_informed) {
      alerts.push({
        type: "safeguarding_sw_not_informed",
        severity: "critical",
        message: `Safeguarding concern identified for ${r.child_name} on ${r.session_date} but social worker has not been informed — CHR 2015 Reg 13 and local safeguarding procedures require immediate notification of the allocated social worker when sexual health safeguarding concerns arise`,
        record_id: r.id,
      });
    }
  }

  // Critical: Consent not given for clinical session
  for (const r of rows) {
    if (
      (CLINICAL_SESSION_TYPES as string[]).includes(r.session_type) &&
      !r.consent_given
    ) {
      alerts.push({
        type: "clinical_no_consent",
        severity: "critical",
        message: `Clinical session (${r.session_type}) for ${r.child_name} on ${r.session_date} proceeded without consent — Fraser guidelines and Gillick competency assessment must be completed before clinical sexual health interventions for under-16s`,
        record_id: r.id,
      });
    }
  }

  // Critical: Confidentiality not explained
  for (const r of rows) {
    if (!r.confidentiality_explained) {
      alerts.push({
        type: "confidentiality_not_explained",
        severity: "critical",
        message: `Confidentiality was not explained to ${r.child_name} before ${r.session_type} session on ${r.session_date} — Fraser guidelines require that young people understand the limits of confidentiality before any sexual health discussion`,
        record_id: r.id,
      });
    }
  }

  // High: Not age-appropriate
  for (const r of rows) {
    if (!r.age_appropriate) {
      alerts.push({
        type: "not_age_appropriate",
        severity: "high",
        message: `Session (${r.session_type}) for ${r.child_name} on ${r.session_date} was flagged as not age-appropriate — DfE RSHE statutory guidance 2020 requires all sexual health education to be delivered in an age-appropriate manner`,
        record_id: r.id,
      });
    }
  }

  // High: Young person not engaged in safeguarding-sensitive sessions
  for (const r of rows) {
    if (
      (SAFEGUARDING_SENSITIVE_TYPES as string[]).includes(r.session_type) &&
      !r.young_person_engaged
    ) {
      alerts.push({
        type: "disengaged_safeguarding_session",
        severity: "high",
        message: `${r.child_name} was not engaged during ${r.session_type} on ${r.session_date} — disengagement in safeguarding-sensitive sessions may indicate underlying concerns that require further exploration`,
        record_id: r.id,
      });
    }
  }

  // High: Safeguarding concerns with no referral
  for (const r of rows) {
    if (r.safeguarding_concerns && !r.referral_made) {
      alerts.push({
        type: "safeguarding_no_referral",
        severity: "high",
        message: `Safeguarding concern for ${r.child_name} on ${r.session_date} but no referral has been made — consider whether a referral to MASH, police, or specialist service is required under local safeguarding procedures`,
        record_id: r.id,
      });
    }
  }

  // High: Multiple CSE awareness sessions for same child (pattern concern)
  const childCSEMap = new Map<string, SexualHealthEducationRow[]>();
  for (const r of rows) {
    if (r.session_type === "CSE Awareness") {
      const key = r.child_name.toLowerCase().trim();
      if (!childCSEMap.has(key)) childCSEMap.set(key, []);
      childCSEMap.get(key)!.push(r);
    }
  }
  for (const [, childRows] of childCSEMap) {
    if (childRows.length >= 3) {
      alerts.push({
        type: "repeated_cse_sessions",
        severity: "high",
        message: `${childRows[0].child_name} has had ${childRows.length} CSE awareness sessions — repeated sessions may indicate ongoing risk that requires multi-agency review and enhanced protective measures`,
      });
    }
  }

  // High: Overdue follow-up dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of rows) {
    if (r.follow_up_required && r.follow_up_date) {
      const followDate = new Date(r.follow_up_date);
      if (followDate < today) {
        alerts.push({
          type: "overdue_follow_up",
          severity: "high",
          message: `Follow-up for ${r.child_name} was due on ${r.follow_up_date} and is now overdue — sexual health follow-up should not be delayed as it may relate to ongoing health needs or safeguarding`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: Low engagement rate across sessions
  const engaged = rows.filter((r) => r.young_person_engaged).length;
  if (rows.length >= 5 && engaged / rows.length < 0.6) {
    alerts.push({
      type: "low_engagement_rate",
      severity: "medium",
      message: `Only ${Math.round((engaged / rows.length) * 100)}% of sexual health education sessions show young person engagement — review delivery methods and consider whether sessions are being tailored to individual needs and maturity levels`,
    });
  }

  // Medium: No resources provided across multiple sessions
  const resourced = rows.filter((r) => r.resources_provided).length;
  if (rows.length >= 5 && resourced / rows.length < 0.3) {
    alerts.push({
      type: "low_resource_rate",
      severity: "medium",
      message: `Resources were provided in only ${Math.round((resourced / rows.length) * 100)}% of sessions — Brook guidance recommends providing age-appropriate take-away materials to reinforce learning`,
    });
  }

  // Medium: School not aware for education sessions
  const educationRows = rows.filter(
    (r) => (EDUCATION_SESSION_TYPES as string[]).includes(r.session_type),
  );
  const schoolNotAware = educationRows.filter((r) => !r.school_aware);
  if (educationRows.length >= 3 && schoolNotAware.length >= 2) {
    alerts.push({
      type: "school_not_aware",
      severity: "medium",
      message: `${schoolNotAware.length} RSE/education sessions have not been coordinated with the young person's school — DfE RSHE 2020 requires consistency between home and school RSE delivery`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: SexualHealthEducationRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_session_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_sessions} sexual health education ${metrics.total_sessions === 1 ? "session" : "sessions"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Sessions: ${typeBreakdown || "none recorded"}. ` +
      `Clinical sessions: ${metrics.clinical_session_count}. ` +
      `Education sessions: ${metrics.education_session_count}. ` +
      `Identity support sessions: ${metrics.identity_session_count}. ` +
      `Engagement rate: ${metrics.engagement_rate}%. ` +
      `Consent rate: ${metrics.consent_rate}%. ` +
      `Confidentiality explained: ${metrics.confidentiality_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Safeguarding concern rate: ${metrics.safeguarding_concern_rate}%. ` +
        `Referral rate: ${metrics.referral_rate}%. ` +
        `Age-appropriate rate: ${metrics.age_appropriate_rate}%. ` +
        `Resources provided: ${metrics.resources_rate}%. ` +
        `Follow-up required: ${metrics.follow_up_rate}%. ` +
        `School aware: ${metrics.school_aware_rate}%. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority sexual health education alerts. ` +
        `Safeguarding concern rate: ${metrics.safeguarding_concern_rate}%. ` +
        `Referral rate: ${metrics.referral_rate}%. ` +
        `Age-appropriate rate: ${metrics.age_appropriate_rate}%. ` +
        `Resources provided: ${metrics.resources_rate}%. ` +
        `Follow-up required: ${metrics.follow_up_rate}%. ` +
        `School aware: ${metrics.school_aware_rate}%. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%. ` +
        `Continue delivering age-appropriate RSE per DfE 2020 statutory guidance.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.safeguarding_concern_rate > 20 && metrics.total_sessions > 0) {
    insights.push(
      `[reflect] ${metrics.safeguarding_concern_rate}% of sexual health sessions have raised ` +
        `safeguarding concerns. Is the home adequately identifying and responding to sexual health ` +
        `safeguarding risks? CHR 2015 Reg 13 requires robust healthcare provision including ` +
        `sexual health, and the home must ensure that safeguarding pathways are clear and timely. ` +
        `Are all concerns being appropriately escalated to the allocated social worker and, where ` +
        `necessary, to MASH or police? Are staff confident in applying Gillick competency and ` +
        `Fraser guidelines when making decisions about confidentiality and disclosure?`,
    );
  } else if (metrics.confidentiality_rate < 100 && metrics.total_sessions > 0) {
    insights.push(
      `[reflect] Confidentiality was not explained in all sessions (${metrics.confidentiality_rate}%). ` +
        `Fraser guidelines are explicit that young people must understand the limits of ` +
        `confidentiality before any sexual health discussion. This is not optional — it is a ` +
        `legal and ethical requirement. Are all staff trained in how to explain confidentiality ` +
        `in an age-appropriate way? Do young people understand that confidentiality may be ` +
        `breached if there is a safeguarding concern? Is this being documented consistently?`,
    );
  } else if (metrics.engagement_rate < 70 && metrics.total_sessions > 3) {
    insights.push(
      `[reflect] Engagement rate of ${metrics.engagement_rate}% suggests that some young people ` +
        `may not be connecting with the RSE provision. Are sessions being tailored to individual ` +
        `maturity levels, cultural backgrounds, and personal circumstances? DfE RSHE 2020 ` +
        `statutory guidance emphasises that RSE must be inclusive, sensitive, and responsive. ` +
        `For looked-after children who may have experienced trauma, abuse, or exploitation, ` +
        `the approach to sexual health education must be particularly thoughtful and ` +
        `trauma-informed. Is the home using Brook or other specialist resources?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home ensure that sexual health and relationships education is ` +
        `genuinely responsive to each young person's needs, rather than a one-size-fits-all ` +
        `programme? Looked-after children may have complex histories including abuse, ` +
        `exploitation, or early sexualisation. The DfE RSHE 2020 guidance, combined with ` +
        `CHR 2015 Reg 10 and Reg 13, requires the home to provide comprehensive, ` +
        `age-appropriate sexual health education that addresses consent, healthy relationships, ` +
        `online safety, and identity. Are Gillick competency and Fraser guidelines being ` +
        `applied consistently for under-16s accessing clinical services?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    sessionType?: SessionType;
    limit?: number;
  },
): Promise<ServiceResult<SexualHealthEducationRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_sexual_health_education") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.sessionType) q = q.eq("session_type", filters.sessionType);

  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<SexualHealthEducationRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_sexual_health_education") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  sessionDate: string;
  facilitatorName: string;
  sessionType: SessionType;
  ageAppropriate?: boolean;
  gillickCompetent?: boolean | null;
  consentGiven?: boolean;
  confidentialityExplained?: boolean;
  safeguardingConcerns?: boolean;
  concernDetails?: string | null;
  referralMade?: boolean;
  referralService?: string | null;
  schoolAware?: boolean;
  socialWorkerInformed?: boolean;
  youngPersonEngaged?: boolean;
  resourcesProvided?: boolean;
  followUpRequired?: boolean;
  followUpDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<SexualHealthEducationRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateSexualHealthEducation({
    childName: input.childName,
    sessionDate: input.sessionDate,
    facilitatorName: input.facilitatorName,
    sessionType: input.sessionType,
    gillickCompetent: input.gillickCompetent,
    safeguardingConcerns: input.safeguardingConcerns,
    concernDetails: input.concernDetails,
    referralMade: input.referralMade,
    referralService: input.referralService,
    consentGiven: input.consentGiven,
    confidentialityExplained: input.confidentialityExplained,
    followUpRequired: input.followUpRequired,
    followUpDate: input.followUpDate,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_sexual_health_education") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      session_date: input.sessionDate,
      facilitator_name: input.facilitatorName,
      session_type: input.sessionType,
      age_appropriate: input.ageAppropriate ?? true,
      gillick_competent: input.gillickCompetent ?? null,
      consent_given: input.consentGiven ?? true,
      confidentiality_explained: input.confidentialityExplained ?? true,
      safeguarding_concerns: input.safeguardingConcerns ?? false,
      concern_details: input.concernDetails ?? null,
      referral_made: input.referralMade ?? false,
      referral_service: input.referralService ?? null,
      school_aware: input.schoolAware ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      young_person_engaged: input.youngPersonEngaged ?? true,
      resources_provided: input.resourcesProvided ?? false,
      follow_up_required: input.followUpRequired ?? false,
      follow_up_date: input.followUpDate ?? null,
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
    sessionDate: string;
    facilitatorName: string;
    sessionType: SessionType;
    ageAppropriate: boolean;
    gillickCompetent: boolean | null;
    consentGiven: boolean;
    confidentialityExplained: boolean;
    safeguardingConcerns: boolean;
    concernDetails: string | null;
    referralMade: boolean;
    referralService: string | null;
    schoolAware: boolean;
    socialWorkerInformed: boolean;
    youngPersonEngaged: boolean;
    resourcesProvided: boolean;
    followUpRequired: boolean;
    followUpDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<SexualHealthEducationRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.facilitatorName !== undefined) mapped.facilitator_name = updates.facilitatorName;
  if (updates.sessionType !== undefined) mapped.session_type = updates.sessionType;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.gillickCompetent !== undefined) mapped.gillick_competent = updates.gillickCompetent;
  if (updates.consentGiven !== undefined) mapped.consent_given = updates.consentGiven;
  if (updates.confidentialityExplained !== undefined) mapped.confidentiality_explained = updates.confidentialityExplained;
  if (updates.safeguardingConcerns !== undefined) mapped.safeguarding_concerns = updates.safeguardingConcerns;
  if (updates.concernDetails !== undefined) mapped.concern_details = updates.concernDetails;
  if (updates.referralMade !== undefined) mapped.referral_made = updates.referralMade;
  if (updates.referralService !== undefined) mapped.referral_service = updates.referralService;
  if (updates.schoolAware !== undefined) mapped.school_aware = updates.schoolAware;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.resourcesProvided !== undefined) mapped.resources_provided = updates.resourcesProvided;
  if (updates.followUpRequired !== undefined) mapped.follow_up_required = updates.followUpRequired;
  if (updates.followUpDate !== undefined) mapped.follow_up_date = updates.followUpDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_sexual_health_education") as SB)
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

  const { error } = await (client.from("cs_sexual_health_education") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
