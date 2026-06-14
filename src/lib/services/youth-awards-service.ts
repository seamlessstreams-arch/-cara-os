// ==============================================================================
// CARA -- YOUTH AWARDS & ACCREDITED PROGRAMMES SERVICE
// Tracks young people's participation in accredited award schemes including
// Duke of Edinburgh (Bronze, Silver, Gold), ASDAN, AQA Unit Awards, John Muir
// Trust Award, Arts Award (Discover through Gold), Saltire Award, Sports
// Leaders UK, St John Ambulance Young First Aider, and other recognised
// achievement programmes.
//
// Records award sections/components, hours completed, assessor details,
// evidence gathering, milestone achievements, certificate receipt, and
// celebration of achievements. Links awards to pathway plans and ensures
// social workers are kept informed of progress.
//
// UK Regulatory Framework:
// CHR 2015 Reg 9 (quality of care — promoting development through purposeful
//   activities and achievement),
// CHR 2015 Reg 10 (health and education — broader educational achievement
//   including non-academic accreditation),
// CHR 2015 Reg 14 (care planning — linking achievements to pathway planning
//   and future outcomes),
// SCCIF: Experiences and progress — "Children make good progress in all areas
//   of their development. Their achievements are recognised and celebrated."
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const AWARD_SCHEMES = [
  "Duke of Edinburgh (Bronze)",
  "Duke of Edinburgh (Silver)",
  "Duke of Edinburgh (Gold)",
  "ASDAN",
  "AQA Unit Award",
  "John Muir Trust Award",
  "Arts Award (Discover)",
  "Arts Award (Explore)",
  "Arts Award (Bronze)",
  "Arts Award (Silver)",
  "Arts Award (Gold)",
  "Saltire Award",
  "Sports Leaders UK",
  "St John Ambulance Young First Aider",
  "Other",
] as const;
export type AwardScheme = (typeof AWARD_SCHEMES)[number];

export const SECTIONS = [
  "Volunteering",
  "Physical",
  "Skills",
  "Expedition",
  "Residential",
] as const;
export type Section = (typeof SECTIONS)[number];

export const ENGAGEMENT_LEVELS = [
  "Refused",
  "Reluctant",
  "Participated",
  "Engaged",
  "Enthusiastic",
] as const;
export type EngagementLevel = (typeof ENGAGEMENT_LEVELS)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const DOFE_SCHEMES: AwardScheme[] = [
  "Duke of Edinburgh (Bronze)",
  "Duke of Edinburgh (Silver)",
  "Duke of Edinburgh (Gold)",
];

export const ARTS_AWARD_SCHEMES: AwardScheme[] = [
  "Arts Award (Discover)",
  "Arts Award (Explore)",
  "Arts Award (Bronze)",
  "Arts Award (Silver)",
  "Arts Award (Gold)",
];

// Sections applicable to DofE levels
export const DOFE_BRONZE_SILVER_SECTIONS: Section[] = [
  "Volunteering",
  "Physical",
  "Skills",
  "Expedition",
];

export const DOFE_GOLD_SECTIONS: Section[] = [
  "Volunteering",
  "Physical",
  "Skills",
  "Expedition",
  "Residential",
];

// Engagement level numeric mapping for analysis
const ENGAGEMENT_NUMERIC: Record<string, number> = {
  Refused: 1,
  Reluctant: 2,
  Participated: 3,
  Engaged: 4,
  Enthusiastic: 5,
};

// -- Label maps ---------------------------------------------------------------

export const AWARD_SCHEME_LABELS: { scheme: AwardScheme; label: string }[] = [
  { scheme: "Duke of Edinburgh (Bronze)", label: "Duke of Edinburgh — Bronze" },
  { scheme: "Duke of Edinburgh (Silver)", label: "Duke of Edinburgh — Silver" },
  { scheme: "Duke of Edinburgh (Gold)", label: "Duke of Edinburgh — Gold" },
  { scheme: "ASDAN", label: "ASDAN" },
  { scheme: "AQA Unit Award", label: "AQA Unit Award" },
  { scheme: "John Muir Trust Award", label: "John Muir Trust Award" },
  { scheme: "Arts Award (Discover)", label: "Arts Award — Discover" },
  { scheme: "Arts Award (Explore)", label: "Arts Award — Explore" },
  { scheme: "Arts Award (Bronze)", label: "Arts Award — Bronze" },
  { scheme: "Arts Award (Silver)", label: "Arts Award — Silver" },
  { scheme: "Arts Award (Gold)", label: "Arts Award — Gold" },
  { scheme: "Saltire Award", label: "Saltire Award" },
  { scheme: "Sports Leaders UK", label: "Sports Leaders UK" },
  { scheme: "St John Ambulance Young First Aider", label: "St John Ambulance Young First Aider" },
  { scheme: "Other", label: "Other" },
];

export const SECTION_LABELS: { section: Section; label: string }[] = [
  { section: "Volunteering", label: "Volunteering" },
  { section: "Physical", label: "Physical" },
  { section: "Skills", label: "Skills" },
  { section: "Expedition", label: "Expedition" },
  { section: "Residential", label: "Residential (Gold only)" },
];

export const ENGAGEMENT_LEVEL_LABELS: { level: EngagementLevel; label: string }[] = [
  { level: "Refused", label: "Refused" },
  { level: "Reluctant", label: "Reluctant" },
  { level: "Participated", label: "Participated" },
  { level: "Engaged", label: "Engaged" },
  { level: "Enthusiastic", label: "Enthusiastic" },
];

// -- Row type -----------------------------------------------------------------

export interface YouthAwardsRow {
  id: string;
  home_id: string;
  young_person_name: string;
  record_date: string;
  supporting_staff: string;
  award_scheme: AwardScheme;
  section: Section | null;
  activity_description: string;
  hours_completed: number | null;
  hours_required: number | null;
  assessor_name: string | null;
  evidence_recorded: boolean;
  young_person_engaged: boolean;
  barriers_identified: string | null;
  support_provided: string | null;
  milestone_achieved: boolean;
  completion_date: string | null;
  certificate_received: boolean;
  celebrated_achievement: boolean;
  linked_to_pathway_plan: boolean;
  social_worker_informed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateYouthAward(input: {
  youngPersonName?: string;
  recordDate?: string;
  supportingStaff?: string;
  awardScheme?: string;
  section?: string | null;
  activityDescription?: string;
  hoursCompleted?: number | null;
  hoursRequired?: number | null;
  milestoneAchieved?: boolean;
  celebratedAchievement?: boolean;
  completionDate?: string | null;
  certificateReceived?: boolean;
  linkedToPathwayPlan?: boolean;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!input.youngPersonName || input.youngPersonName.trim().length === 0) {
    errors.push("Young person's name is required — every award record must identify the young person for care planning and Reg 14 pathway plan linkage");
  }

  if (!input.recordDate) {
    errors.push("Record date is required");
  } else {
    const dateObj = new Date(input.recordDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Record date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Record date cannot be in the future — awards activity must be recorded after it has taken place");
    }
  }

  if (!input.supportingStaff || input.supportingStaff.trim().length === 0) {
    errors.push("Supporting staff member is required — CHR 2015 Reg 9 requires that staff actively support young people's participation in activities and achievements");
  }

  if (!input.awardScheme || !(AWARD_SCHEMES as readonly string[]).includes(input.awardScheme)) {
    errors.push(`Award scheme must be one of: ${AWARD_SCHEMES.join(", ")}`);
  }

  if (!input.activityDescription || input.activityDescription.trim().length === 0) {
    errors.push("Activity description is required — recording what the young person did supports evidence gathering for the award and demonstrates purposeful activity provision (SCCIF: experiences and progress)");
  }

  // Section validation for DofE
  if (
    input.section &&
    !(SECTIONS as readonly string[]).includes(input.section)
  ) {
    errors.push(`Section must be one of: ${SECTIONS.join(", ")}`);
  }

  // Business rule: Residential section only valid for DofE Gold
  if (
    input.section === "Residential" &&
    input.awardScheme &&
    input.awardScheme !== "Duke of Edinburgh (Gold)"
  ) {
    errors.push("The Residential section is only available for Duke of Edinburgh Gold — Bronze and Silver awards have four sections: Volunteering, Physical, Skills, and Expedition");
  }

  // Business rule: DofE Gold Residential advisory — minimum 5 days
  if (
    input.awardScheme === "Duke of Edinburgh (Gold)" &&
    input.section === "Residential" &&
    input.hoursRequired !== null &&
    input.hoursRequired !== undefined &&
    input.hoursRequired < 40
  ) {
    // Advisory: 5 days residential = approximately 40 hours minimum
    errors.push("Duke of Edinburgh Gold Residential section requires a minimum of 5 days (approximately 40 hours) — verify hours_required reflects the full residential experience");
  }

  // Business rule: hours_completed cannot exceed hours_required
  if (
    input.hoursCompleted !== null &&
    input.hoursCompleted !== undefined &&
    input.hoursRequired !== null &&
    input.hoursRequired !== undefined &&
    input.hoursCompleted > input.hoursRequired
  ) {
    errors.push("Hours completed cannot exceed hours required — review the recorded hours for accuracy");
  }

  // Business rule: Milestone achieved but not celebrated — advisory
  if (input.milestoneAchieved === true && input.celebratedAchievement === false) {
    errors.push("A milestone has been achieved but not yet celebrated — SCCIF (experiences and progress) expects that children's achievements are recognised and celebrated. Consider how to mark this achievement with the young person");
  }

  // Business rule: Completion date set but certificate not received — advisory
  if (
    input.completionDate &&
    input.completionDate.trim().length > 0 &&
    input.certificateReceived === false
  ) {
    errors.push("Award has been completed but certificate has not yet been received — chase the awarding body for the certificate so the young person has tangible recognition of their achievement");
  }

  // Business rule: Not linked to pathway plan — advisory (Reg 14)
  if (input.linkedToPathwayPlan === false) {
    errors.push("This award activity is not linked to the young person's pathway plan — CHR 2015 Reg 14 requires that achievements, skills gained, and accreditation are reflected in pathway planning to support future outcomes and independence");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: YouthAwardsRow[],
): {
  total_records: number;
  unique_young_people: number;
  by_award_scheme: Record<string, number>;
  by_section: Record<string, number>;
  milestones_achieved: number;
  certificates_received: number;
  achievements_celebrated: number;
  linked_to_pathway_plan_count: number;
  social_workers_informed_count: number;
  evidence_recorded_count: number;
  engagement_rate: number;
  total_hours_completed: number;
  average_engagement: number;
  dofe_participants: number;
  completion_rate: number;
} {
  const total = rows.length;

  const uniqueYoungPeople = new Set(rows.map((r) => r.young_person_name.toLowerCase().trim()));

  // Award scheme breakdown
  const byAwardScheme: Record<string, number> = {};
  for (const scheme of AWARD_SCHEMES) byAwardScheme[scheme] = 0;
  for (const r of rows) byAwardScheme[r.award_scheme] = (byAwardScheme[r.award_scheme] || 0) + 1;

  // Section breakdown
  const bySection: Record<string, number> = {};
  for (const section of SECTIONS) bySection[section] = 0;
  for (const r of rows) {
    if (r.section) bySection[r.section] = (bySection[r.section] || 0) + 1;
  }

  const milestonesAchieved = rows.filter((r) => r.milestone_achieved).length;
  const certificatesReceived = rows.filter((r) => r.certificate_received).length;
  const achievementsCelebrated = rows.filter((r) => r.celebrated_achievement).length;
  const linkedToPathwayPlanCount = rows.filter((r) => r.linked_to_pathway_plan).length;
  const socialWorkersInformedCount = rows.filter((r) => r.social_worker_informed).length;
  const evidenceRecordedCount = rows.filter((r) => r.evidence_recorded).length;

  const engagementRate = total > 0
    ? Math.round((rows.filter((r) => r.young_person_engaged).length / total) * 1000) / 10
    : 0;

  const totalHoursCompleted = rows.reduce(
    (sum, r) => sum + (r.hours_completed ?? 0),
    0,
  );

  // Average engagement is derived from the boolean field; if more nuance needed, extend later
  const engagedCount = rows.filter((r) => r.young_person_engaged).length;
  const averageEngagement = total > 0
    ? Math.round((engagedCount / total) * 50) / 10
    : 0;

  const dofeParticipants = new Set(
    rows
      .filter((r) => (DOFE_SCHEMES as string[]).includes(r.award_scheme))
      .map((r) => r.young_person_name.toLowerCase().trim()),
  ).size;

  const completionRate = total > 0
    ? Math.round((rows.filter((r) => r.completion_date !== null).length / total) * 1000) / 10
    : 0;

  return {
    total_records: total,
    unique_young_people: uniqueYoungPeople.size,
    by_award_scheme: byAwardScheme,
    by_section: bySection,
    milestones_achieved: milestonesAchieved,
    certificates_received: certificatesReceived,
    achievements_celebrated: achievementsCelebrated,
    linked_to_pathway_plan_count: linkedToPathwayPlanCount,
    social_workers_informed_count: socialWorkersInformedCount,
    evidence_recorded_count: evidenceRecordedCount,
    engagement_rate: engagementRate,
    total_hours_completed: totalHoursCompleted,
    average_engagement: averageEngagement,
    dofe_participants: dofeParticipants,
    completion_rate: completionRate,
  };
}

export function computeAlerts(
  rows: YouthAwardsRow[],
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

  // High: Milestone achieved but not celebrated
  for (const r of rows) {
    if (r.milestone_achieved && !r.celebrated_achievement) {
      alerts.push({
        type: "milestone_not_celebrated",
        severity: "high",
        message: `${r.young_person_name} achieved a milestone in ${r.award_scheme} on ${r.record_date} but it has not been celebrated — SCCIF (experiences and progress) expects that children's achievements are recognised and celebrated. Young people in care deserve to have their successes marked and shared`,
        record_id: r.id,
      });
    }
  }

  // High: Award completed but certificate not received
  for (const r of rows) {
    if (r.completion_date && !r.certificate_received) {
      alerts.push({
        type: "certificate_outstanding",
        severity: "high",
        message: `${r.young_person_name} completed ${r.award_scheme} on ${r.completion_date} but the certificate has not been received — chase the awarding body to ensure the young person receives tangible evidence of their achievement`,
        record_id: r.id,
      });
    }
  }

  // High: Not linked to pathway plan
  for (const r of rows) {
    if (!r.linked_to_pathway_plan) {
      alerts.push({
        type: "not_linked_to_pathway_plan",
        severity: "high",
        message: `${r.young_person_name}'s ${r.award_scheme} activity on ${r.record_date} is not linked to their pathway plan — CHR 2015 Reg 14 requires that achievements and accreditation are reflected in pathway planning. Awards and skills gained should inform future outcomes`,
        record_id: r.id,
      });
    }
  }

  // High: Social worker not informed of milestone
  for (const r of rows) {
    if (r.milestone_achieved && !r.social_worker_informed) {
      alerts.push({
        type: "social_worker_not_informed",
        severity: "high",
        message: `${r.young_person_name} achieved a milestone in ${r.award_scheme} but the social worker has not been informed — sharing achievements with the wider professional network demonstrates good communication and ensures LAC reviews capture progress`,
        record_id: r.id,
      });
    }
  }

  // Medium: Evidence not recorded
  for (const r of rows) {
    if (!r.evidence_recorded && r.hours_completed && r.hours_completed > 0) {
      alerts.push({
        type: "evidence_not_recorded",
        severity: "medium",
        message: `Evidence has not been recorded for ${r.young_person_name}'s ${r.award_scheme} activity on ${r.record_date} — most award schemes require a portfolio of evidence. Ensure photographs, log books, or assessor sign-offs are being collected`,
        record_id: r.id,
      });
    }
  }

  // Medium: Barriers identified but no support provided
  for (const r of rows) {
    if (r.barriers_identified && r.barriers_identified.trim().length > 0 && (!r.support_provided || r.support_provided.trim().length === 0)) {
      alerts.push({
        type: "barriers_without_support",
        severity: "medium",
        message: `Barriers identified for ${r.young_person_name} in ${r.award_scheme} ("${r.barriers_identified.substring(0, 50)}...") but no support has been recorded — CHR 2015 Reg 9 requires that the home actively supports young people to overcome barriers to participation and achievement`,
        record_id: r.id,
      });
    }
  }

  // Medium: Young person not engaged
  for (const r of rows) {
    if (!r.young_person_engaged) {
      alerts.push({
        type: "young_person_disengaged",
        severity: "medium",
        message: `${r.young_person_name} was not engaged during ${r.award_scheme} activity on ${r.record_date} — explore barriers to engagement and consider whether the award scheme is appropriate for this young person's interests and abilities`,
        record_id: r.id,
      });
    }
  }

  // Medium: No DofE participation across the home
  const dofeCount = rows.filter((r) => (DOFE_SCHEMES as string[]).includes(r.award_scheme)).length;
  if (rows.length >= 10 && dofeCount === 0) {
    alerts.push({
      type: "no_dofe_participation",
      severity: "medium",
      message: "No Duke of Edinburgh participation has been recorded — DofE is a widely recognised award that develops independence, resilience, and life skills. Consider whether young people have been offered the opportunity and supported to participate",
    });
  }

  // Medium: Low celebration rate across all milestones
  const milestoneRows = rows.filter((r) => r.milestone_achieved);
  const celebratedMilestones = milestoneRows.filter((r) => r.celebrated_achievement).length;
  if (milestoneRows.length >= 3 && celebratedMilestones / milestoneRows.length < 0.5) {
    alerts.push({
      type: "low_celebration_rate",
      severity: "medium",
      message: `Only ${Math.round((celebratedMilestones / milestoneRows.length) * 100)}% of milestones have been celebrated — SCCIF inspectors look for evidence that achievements are recognised and celebrated. Young people in care may have had few experiences of success being acknowledged; celebration builds self-worth`,
    });
  }

  // Medium: Low pathway plan linkage rate
  const linkedCount = rows.filter((r) => r.linked_to_pathway_plan).length;
  if (rows.length >= 5 && linkedCount / rows.length < 0.3) {
    alerts.push({
      type: "low_pathway_plan_linkage",
      severity: "medium",
      message: `Only ${Math.round((linkedCount / rows.length) * 100)}% of award activities are linked to pathway plans — CHR 2015 Reg 14 requires that achievements and skills development inform pathway planning. Awards demonstrate capabilities and interests that should shape future planning`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: YouthAwardsRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const schemeBreakdown = Object.entries(metrics.by_award_scheme)
    .filter(([, count]) => count > 0)
    .map(([scheme, count]) => `${scheme}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} youth award ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_young_people} young ${metrics.unique_young_people === 1 ? "person" : "people"}. ` +
      `Awards: ${schemeBreakdown || "none recorded"}. ` +
      `DofE participants: ${metrics.dofe_participants}. ` +
      `Milestones achieved: ${metrics.milestones_achieved}. ` +
      `Certificates received: ${metrics.certificates_received}. ` +
      `Total hours completed: ${metrics.total_hours_completed}. ` +
      `Completion rate: ${metrics.completion_rate}%. ` +
      `Engagement rate: ${metrics.engagement_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Achievements celebrated: ${metrics.achievements_celebrated}/${metrics.milestones_achieved} milestones. ` +
        `Pathway plan linkage: ${metrics.linked_to_pathway_plan_count}/${metrics.total_records}. ` +
        `Social workers informed: ${metrics.social_workers_informed_count}/${metrics.total_records}. ` +
        `Evidence recorded: ${metrics.evidence_recorded_count}/${metrics.total_records}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority youth awards alerts. ` +
        `Achievements celebrated: ${metrics.achievements_celebrated}/${metrics.milestones_achieved} milestones. ` +
        `Pathway plan linkage: ${metrics.linked_to_pathway_plan_count}/${metrics.total_records}. ` +
        `Social workers informed: ${metrics.social_workers_informed_count}/${metrics.total_records}. ` +
        `Evidence recorded: ${metrics.evidence_recorded_count}/${metrics.total_records}. ` +
        `Continue supporting young people's participation in accredited programmes per CHR 2015 Reg 9.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.total_records === 0) {
    insights.push(
      `[reflect] No youth award activity has been recorded. Are young people being offered ` +
        `the opportunity to participate in accredited programmes such as Duke of Edinburgh, ` +
        `ASDAN, AQA Unit Awards, or Arts Award? CHR 2015 Reg 9 requires that the home ` +
        `promotes development through purposeful activities. Accredited awards provide ` +
        `structure, progression, and tangible recognition that can be transformative for ` +
        `young people in care who may have experienced disrupted education.`,
    );
  } else if (metrics.engagement_rate < 50 && metrics.total_records >= 5) {
    insights.push(
      `[reflect] Engagement rate of ${metrics.engagement_rate}% suggests young people may ` +
        `not be finding award activities motivating. Are the right award schemes being ` +
        `chosen for each young person's interests and abilities? CHR 2015 Reg 9 requires ` +
        `that activities are tailored to individual needs. Consider whether barriers ` +
        `(anxiety, past failure, peer pressure) need addressing before expecting engagement. ` +
        `The SCCIF looks for evidence that experiences are tailored and purposeful.`,
    );
  } else if (metrics.linked_to_pathway_plan_count / Math.max(metrics.total_records, 1) < 0.4) {
    insights.push(
      `[reflect] Only ${Math.round((metrics.linked_to_pathway_plan_count / Math.max(metrics.total_records, 1)) * 100)}% ` +
        `of award activities are linked to pathway plans. Are achievements being captured ` +
        `in care planning? CHR 2015 Reg 14 requires that pathway plans reflect a young ` +
        `person's skills, achievements, and accreditation. Awards demonstrate capabilities ` +
        `that should inform education, employment, and independence planning. Without this ` +
        `linkage, valuable evidence of progress may be lost at LAC reviews and transition ` +
        `planning meetings.`,
    );
  } else {
    insights.push(
      `[reflect] How does the home ensure that every young person has access to an ` +
        `accredited award programme that matches their interests and ability level? ` +
        `Not all young people will suit DofE — ASDAN, AQA Unit Awards, and Arts Award ` +
        `offer alternative pathways to accreditation. SCCIF inspectors look for a varied ` +
        `programme that enables all young people to achieve and have their achievements ` +
        `celebrated. Are staff trained to support award delivery? Are relationships with ` +
        `local providers and assessors established?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    awardScheme?: AwardScheme;
    youngPersonName?: string;
    limit?: number;
  },
): Promise<ServiceResult<YouthAwardsRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_youth_awards") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.awardScheme) q = q.eq("award_scheme", filters.awardScheme);
  if (filters?.youngPersonName) q = q.ilike("young_person_name", `%${filters.youngPersonName}%`);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<YouthAwardsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_youth_awards") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  youngPersonName: string;
  recordDate: string;
  supportingStaff: string;
  awardScheme: AwardScheme;
  section?: Section | null;
  activityDescription: string;
  hoursCompleted?: number | null;
  hoursRequired?: number | null;
  assessorName?: string | null;
  evidenceRecorded?: boolean;
  youngPersonEngaged?: boolean;
  barriersIdentified?: string | null;
  supportProvided?: string | null;
  milestoneAchieved?: boolean;
  completionDate?: string | null;
  certificateReceived?: boolean;
  celebratedAchievement?: boolean;
  linkedToPathwayPlan?: boolean;
  socialWorkerInformed?: boolean;
  notes?: string | null;
}): Promise<ServiceResult<YouthAwardsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateYouthAward({
    youngPersonName: input.youngPersonName,
    recordDate: input.recordDate,
    supportingStaff: input.supportingStaff,
    awardScheme: input.awardScheme,
    section: input.section,
    activityDescription: input.activityDescription,
    hoursCompleted: input.hoursCompleted,
    hoursRequired: input.hoursRequired,
    milestoneAchieved: input.milestoneAchieved,
    celebratedAchievement: input.celebratedAchievement,
    completionDate: input.completionDate,
    certificateReceived: input.certificateReceived,
    linkedToPathwayPlan: input.linkedToPathwayPlan,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_youth_awards") as SB)
    .insert({
      home_id: input.homeId,
      young_person_name: input.youngPersonName,
      record_date: input.recordDate,
      supporting_staff: input.supportingStaff,
      award_scheme: input.awardScheme,
      section: input.section ?? null,
      activity_description: input.activityDescription,
      hours_completed: input.hoursCompleted ?? null,
      hours_required: input.hoursRequired ?? null,
      assessor_name: input.assessorName ?? null,
      evidence_recorded: input.evidenceRecorded ?? false,
      young_person_engaged: input.youngPersonEngaged ?? false,
      barriers_identified: input.barriersIdentified ?? null,
      support_provided: input.supportProvided ?? null,
      milestone_achieved: input.milestoneAchieved ?? false,
      completion_date: input.completionDate ?? null,
      certificate_received: input.certificateReceived ?? false,
      celebrated_achievement: input.celebratedAchievement ?? false,
      linked_to_pathway_plan: input.linkedToPathwayPlan ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
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
    youngPersonName: string;
    recordDate: string;
    supportingStaff: string;
    awardScheme: AwardScheme;
    section: Section | null;
    activityDescription: string;
    hoursCompleted: number | null;
    hoursRequired: number | null;
    assessorName: string | null;
    evidenceRecorded: boolean;
    youngPersonEngaged: boolean;
    barriersIdentified: string | null;
    supportProvided: string | null;
    milestoneAchieved: boolean;
    completionDate: string | null;
    certificateReceived: boolean;
    celebratedAchievement: boolean;
    linkedToPathwayPlan: boolean;
    socialWorkerInformed: boolean;
    notes: string | null;
  }>,
): Promise<ServiceResult<YouthAwardsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.youngPersonName !== undefined) mapped.young_person_name = updates.youngPersonName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.supportingStaff !== undefined) mapped.supporting_staff = updates.supportingStaff;
  if (updates.awardScheme !== undefined) mapped.award_scheme = updates.awardScheme;
  if (updates.section !== undefined) mapped.section = updates.section;
  if (updates.activityDescription !== undefined) mapped.activity_description = updates.activityDescription;
  if (updates.hoursCompleted !== undefined) mapped.hours_completed = updates.hoursCompleted;
  if (updates.hoursRequired !== undefined) mapped.hours_required = updates.hoursRequired;
  if (updates.assessorName !== undefined) mapped.assessor_name = updates.assessorName;
  if (updates.evidenceRecorded !== undefined) mapped.evidence_recorded = updates.evidenceRecorded;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.barriersIdentified !== undefined) mapped.barriers_identified = updates.barriersIdentified;
  if (updates.supportProvided !== undefined) mapped.support_provided = updates.supportProvided;
  if (updates.milestoneAchieved !== undefined) mapped.milestone_achieved = updates.milestoneAchieved;
  if (updates.completionDate !== undefined) mapped.completion_date = updates.completionDate;
  if (updates.certificateReceived !== undefined) mapped.certificate_received = updates.certificateReceived;
  if (updates.celebratedAchievement !== undefined) mapped.celebrated_achievement = updates.celebratedAchievement;
  if (updates.linkedToPathwayPlan !== undefined) mapped.linked_to_pathway_plan = updates.linkedToPathwayPlan;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_youth_awards") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
  homeId: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_youth_awards") as SB)
    .delete()
    .eq("id", id)
    .eq("home_id", homeId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
