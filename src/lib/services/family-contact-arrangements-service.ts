// ==============================================================================
// CARA -- SIBLING & FAMILY CONTACT ARRANGEMENTS SERVICE
// Tracks scheduled and completed contact between children in residential care
// and their family members, including siblings, parents, grandparents and
// extended family, monitoring contact quality, child emotional wellbeing,
// risk assessment, and safeguarding concerns.
//
// Covers: Contact scheduling and completion, relationship tracking, contact
// type management (supervised/unsupervised, phone, video, letterbox, overnight,
// holiday, indirect, court ordered), child mood before and after contact,
// contact quality assessment, supervisor allocation, risk assessment, concern
// logging, social worker notification, and next contact planning.
//
// UK Regulatory Framework:
// CHR 2015 Reg 7 (children's plan must include contact arrangements with
// parents, relatives and friends — contact should be promoted unless not in
// the child's best interests),
// Children Act 1989 s34 (contact with parents and relatives for children in
// care — presumption of reasonable contact),
// CHR 2015 Reg 12 (children's protection — risk assessment of contact to
// ensure child safety during family interactions),
// CHR 2015 Reg 22 (review of quality of care — contact arrangements should
// be reviewed as part of ongoing care quality).
//
// SCCIF: Overall experiences and progress -- "Children enjoy positive contact
// with family when safe." Ofsted inspectors assess whether contact arrangements
// promote positive family relationships, whether children's wishes about
// contact are respected, whether risk assessments are completed, and whether
// contact is appropriately supervised when necessary.
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RELATIONSHIPS = [
  "Mother",
  "Father",
  "Sibling",
  "Grandparent",
  "Aunt/Uncle",
  "Cousin",
  "Step-parent",
  "Foster Carer",
  "Other Family Member",
  "Friend",
  "Other",
] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

export const CONTACT_TYPES = [
  "Face-to-Face Supervised",
  "Face-to-Face Unsupervised",
  "Phone Call",
  "Video Call",
  "Letter/Letterbox",
  "Email/Message",
  "Overnight Stay",
  "Holiday Contact",
  "Indirect — via Social Worker",
  "Court Ordered",
] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const CHILD_MOODS_BEFORE = [
  "Happy",
  "Anxious",
  "Reluctant",
  "Distressed",
  "Neutral",
  "Excited",
] as const;
export type ChildMoodBefore = (typeof CHILD_MOODS_BEFORE)[number];

export const CHILD_MOODS_AFTER = [
  "Happy",
  "Anxious",
  "Upset",
  "Distressed",
  "Neutral",
  "Unsettled",
  "Positive",
] as const;
export type ChildMoodAfter = (typeof CHILD_MOODS_AFTER)[number];

export const CONTACT_QUALITIES = [
  "Positive",
  "Mixed",
  "Difficult",
  "Did Not Proceed",
] as const;
export type ContactQuality = (typeof CONTACT_QUALITIES)[number];

export const STATUSES = [
  "Confirmed",
  "Completed",
  "Cancelled",
  "Rescheduled",
  "Refused by Child",
  "Refused by Contact",
  "Suspended by Court",
] as const;
export type Status = (typeof STATUSES)[number];

// -- Label maps ---------------------------------------------------------------

export const RELATIONSHIP_LABELS: { relationship: Relationship; label: string }[] = [
  { relationship: "Mother", label: "Mother" },
  { relationship: "Father", label: "Father" },
  { relationship: "Sibling", label: "Sibling (brother/sister)" },
  { relationship: "Grandparent", label: "Grandparent" },
  { relationship: "Aunt/Uncle", label: "Aunt/Uncle" },
  { relationship: "Cousin", label: "Cousin" },
  { relationship: "Step-parent", label: "Step-parent" },
  { relationship: "Foster Carer", label: "Former Foster Carer" },
  { relationship: "Other Family Member", label: "Other Family Member" },
  { relationship: "Friend", label: "Friend" },
  { relationship: "Other", label: "Other" },
];

export const CONTACT_TYPE_LABELS: { type: ContactType; label: string; supervised: boolean }[] = [
  { type: "Face-to-Face Supervised", label: "Face-to-Face (Supervised)", supervised: true },
  { type: "Face-to-Face Unsupervised", label: "Face-to-Face (Unsupervised)", supervised: false },
  { type: "Phone Call", label: "Phone Call", supervised: false },
  { type: "Video Call", label: "Video Call", supervised: false },
  { type: "Letter/Letterbox", label: "Letter / Letterbox Contact", supervised: false },
  { type: "Email/Message", label: "Email / Text Message", supervised: false },
  { type: "Overnight Stay", label: "Overnight Stay", supervised: false },
  { type: "Holiday Contact", label: "Holiday Contact", supervised: false },
  { type: "Indirect — via Social Worker", label: "Indirect (via Social Worker)", supervised: true },
  { type: "Court Ordered", label: "Court Ordered Contact", supervised: true },
];

export const MOOD_BEFORE_LABELS: { mood: ChildMoodBefore; label: string; concern_level: number }[] = [
  { mood: "Happy", label: "Happy", concern_level: 0 },
  { mood: "Excited", label: "Excited", concern_level: 0 },
  { mood: "Neutral", label: "Neutral", concern_level: 1 },
  { mood: "Anxious", label: "Anxious", concern_level: 2 },
  { mood: "Reluctant", label: "Reluctant", concern_level: 3 },
  { mood: "Distressed", label: "Distressed", concern_level: 4 },
];

export const MOOD_AFTER_LABELS: { mood: ChildMoodAfter; label: string; concern_level: number }[] = [
  { mood: "Happy", label: "Happy", concern_level: 0 },
  { mood: "Positive", label: "Positive", concern_level: 0 },
  { mood: "Neutral", label: "Neutral", concern_level: 1 },
  { mood: "Anxious", label: "Anxious", concern_level: 2 },
  { mood: "Unsettled", label: "Unsettled", concern_level: 3 },
  { mood: "Upset", label: "Upset", concern_level: 3 },
  { mood: "Distressed", label: "Distressed", concern_level: 4 },
];

export const CONTACT_QUALITY_LABELS: { quality: ContactQuality; label: string }[] = [
  { quality: "Positive", label: "Positive — Enjoyable for child" },
  { quality: "Mixed", label: "Mixed — Some positive, some difficult moments" },
  { quality: "Difficult", label: "Difficult — Child or contact struggled" },
  { quality: "Did Not Proceed", label: "Did Not Proceed" },
];

export const STATUS_LABELS: { status: Status; label: string }[] = [
  { status: "Confirmed", label: "Confirmed — Scheduled" },
  { status: "Completed", label: "Completed" },
  { status: "Cancelled", label: "Cancelled" },
  { status: "Rescheduled", label: "Rescheduled" },
  { status: "Refused by Child", label: "Refused by Child" },
  { status: "Refused by Contact", label: "Refused by Contact Person" },
  { status: "Suspended by Court", label: "Suspended by Court Order" },
];

// -- Row type -----------------------------------------------------------------

export interface FamilyContactArrangementsRow {
  id: string;
  home_id: string;
  child_name: string;
  contact_person_name: string;
  relationship: Relationship;
  contact_type: ContactType;
  scheduled_date: string;
  actual_date: string | null;
  duration_minutes: number | null;
  location: string | null;
  supervisor_name: string | null;
  child_wishes_considered: boolean;
  child_mood_before: ChildMoodBefore;
  child_mood_after: ChildMoodAfter;
  contact_quality: ContactQuality;
  risk_assessed: boolean;
  concerns_raised: boolean;
  concern_details: string | null;
  social_worker_notified: boolean;
  outcome_notes: string;
  next_contact_date: string | null;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateFamilyContactArrangement(input: {
  childName?: string;
  contactPersonName?: string;
  relationship?: string;
  contactType?: string;
  scheduledDate?: string;
  actualDate?: string | null;
  durationMinutes?: number | null;
  supervisorName?: string | null;
  childWishesConsidered?: boolean;
  childMoodBefore?: string;
  childMoodAfter?: string;
  contactQuality?: string;
  riskAssessed?: boolean;
  concernsRaised?: boolean;
  concernDetails?: string | null;
  socialWorkerNotified?: boolean;
  outcomeNotes?: string;
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

  if (!input.relationship || !(RELATIONSHIPS as readonly string[]).includes(input.relationship)) {
    errors.push(`Relationship must be one of: ${RELATIONSHIPS.join(", ")}`);
  }

  if (!input.contactType || !(CONTACT_TYPES as readonly string[]).includes(input.contactType)) {
    errors.push(`Contact type must be one of: ${CONTACT_TYPES.join(", ")}`);
  }

  if (!input.scheduledDate) {
    errors.push("Scheduled date is required");
  } else {
    const dateObj = new Date(input.scheduledDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Scheduled date must be a valid date");
    }
  }

  if (!input.childMoodBefore || !(CHILD_MOODS_BEFORE as readonly string[]).includes(input.childMoodBefore)) {
    errors.push(`Child mood before must be one of: ${CHILD_MOODS_BEFORE.join(", ")}`);
  }

  if (!input.childMoodAfter || !(CHILD_MOODS_AFTER as readonly string[]).includes(input.childMoodAfter)) {
    errors.push(`Child mood after must be one of: ${CHILD_MOODS_AFTER.join(", ")}`);
  }

  if (!input.contactQuality || !(CONTACT_QUALITIES as readonly string[]).includes(input.contactQuality)) {
    errors.push(`Contact quality must be one of: ${CONTACT_QUALITIES.join(", ")}`);
  }

  if (!input.status || !(STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  if (!input.outcomeNotes || input.outcomeNotes.trim().length === 0) {
    errors.push("Outcome notes are required — describe what happened during or as a result of the contact");
  }

  // Business rule: supervised contact must have supervisor name
  if (
    input.contactType &&
    (input.contactType === "Face-to-Face Supervised" || input.contactType === "Court Ordered") &&
    (!input.supervisorName || input.supervisorName.trim().length === 0) &&
    input.status === "Completed"
  ) {
    errors.push("Supervisor name is required for supervised or court-ordered contact sessions that have been completed");
  }

  // Business rule: actual date required for completed contact
  if (input.status === "Completed" && !input.actualDate) {
    errors.push("Actual date is required when contact status is Completed");
  }

  // Business rule: actual date should not be before scheduled date
  if (input.actualDate && input.scheduledDate) {
    const actual = new Date(input.actualDate);
    const scheduled = new Date(input.scheduledDate);
    if (!isNaN(actual.getTime()) && !isNaN(scheduled.getTime())) {
      const diffDays = Math.abs((actual.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        errors.push("Actual date is more than 30 days from scheduled date — verify this is correct");
      }
    }
  }

  // Business rule: duration must be positive
  if (input.durationMinutes !== null && input.durationMinutes !== undefined && input.durationMinutes <= 0) {
    errors.push("Duration must be a positive number of minutes");
  }

  // Business rule: very long durations should be checked
  if (input.durationMinutes !== null && input.durationMinutes !== undefined && input.durationMinutes > 480) {
    errors.push("Duration exceeds 8 hours — verify this is correct for this contact type");
  }

  // Business rule: concerns raised must have details
  if (input.concernsRaised === true && (!input.concernDetails || input.concernDetails.trim().length === 0)) {
    errors.push("Concern details are required when concerns have been raised — document what happened per Reg 12");
  }

  // Business rule: concerns raised require social worker notification
  if (input.concernsRaised === true && input.socialWorkerNotified === false) {
    errors.push("Social worker must be notified when safeguarding concerns are raised during contact per Reg 12");
  }

  // Business rule: risk assessment should be completed for face-to-face contact
  if (
    input.contactType &&
    (input.contactType.startsWith("Face-to-Face") || input.contactType === "Overnight Stay" || input.contactType === "Holiday Contact") &&
    input.riskAssessed === false
  ) {
    errors.push("Risk assessment is required for face-to-face, overnight, and holiday contact per Reg 12 — ensure risks to the child have been evaluated");
  }

  // Business rule: child wishes should be considered
  if (input.childWishesConsidered === false && input.status !== "Suspended by Court") {
    errors.push("Child's wishes should be considered regarding contact arrangements — Children Act 1989 s34 and Reg 7 require the child's feelings to be given due weight");
  }

  // Business rule: child distressed after contact should trigger concern
  if (input.childMoodAfter === "Distressed" && input.concernsRaised === false) {
    errors.push("Child was distressed after contact — consider whether concerns should be raised and documented per Reg 12");
  }

  // Business rule: overnight stay requires risk assessment
  if (input.contactType === "Overnight Stay" && input.riskAssessed === false) {
    errors.push("Overnight stays require a thorough risk assessment — this must be completed before the stay takes place per Reg 12");
  }

  // Business rule: next contact date for completed regular contacts
  if (
    input.status === "Completed" &&
    input.contactQuality !== "Did Not Proceed" &&
    !input.nextContactDate &&
    input.contactType !== "Letter/Letterbox" &&
    input.contactType !== "Email/Message"
  ) {
    errors.push("Next contact date should be planned for completed contacts to maintain consistency in family relationships per Reg 7");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: FamilyContactArrangementsRow[],
): {
  total_contacts: number;
  completed_count: number;
  cancelled_count: number;
  refused_by_child_count: number;
  refused_by_contact_count: number;
  suspended_count: number;
  rescheduled_count: number;
  confirmed_count: number;
  completion_rate: number;
  by_relationship: Record<string, number>;
  by_contact_type: Record<string, number>;
  by_status: Record<string, number>;
  by_mood_before: Record<string, number>;
  by_mood_after: Record<string, number>;
  by_quality: Record<string, number>;
  mood_improvement_rate: number;
  mood_deterioration_rate: number;
  concern_rate: number;
  child_wishes_rate: number;
  risk_assessment_rate: number;
  supervision_rate: number;
  average_duration: number;
  unique_children: number;
  unique_contacts: number;
  sw_notification_rate: number;
  positive_quality_rate: number;
  difficult_quality_rate: number;
} {
  const total = rows.length;

  const completedCount = rows.filter((r) => r.status === "Completed").length;
  const cancelledCount = rows.filter((r) => r.status === "Cancelled").length;
  const refusedByChild = rows.filter((r) => r.status === "Refused by Child").length;
  const refusedByContact = rows.filter((r) => r.status === "Refused by Contact").length;
  const suspendedCount = rows.filter((r) => r.status === "Suspended by Court").length;
  const rescheduledCount = rows.filter((r) => r.status === "Rescheduled").length;
  const confirmedCount = rows.filter((r) => r.status === "Confirmed").length;

  // Completion rate (completed / (total - suspended))
  const actionable = total - suspendedCount;
  const completionRate = actionable > 0
    ? Math.round((completedCount / actionable) * 1000) / 10
    : 0;

  // Relationship breakdown
  const byRelationship: Record<string, number> = {};
  for (const rel of RELATIONSHIPS) byRelationship[rel] = 0;
  for (const r of rows) byRelationship[r.relationship] = (byRelationship[r.relationship] || 0) + 1;

  // Contact type breakdown
  const byType: Record<string, number> = {};
  for (const ct of CONTACT_TYPES) byType[ct] = 0;
  for (const r of rows) byType[r.contact_type] = (byType[r.contact_type] || 0) + 1;

  // Status breakdown
  const byStatus: Record<string, number> = {};
  for (const s of STATUSES) byStatus[s] = 0;
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

  // Mood before breakdown
  const byMoodBefore: Record<string, number> = {};
  for (const m of CHILD_MOODS_BEFORE) byMoodBefore[m] = 0;
  for (const r of rows) byMoodBefore[r.child_mood_before] = (byMoodBefore[r.child_mood_before] || 0) + 1;

  // Mood after breakdown
  const byMoodAfter: Record<string, number> = {};
  for (const m of CHILD_MOODS_AFTER) byMoodAfter[m] = 0;
  for (const r of rows) byMoodAfter[r.child_mood_after] = (byMoodAfter[r.child_mood_after] || 0) + 1;

  // Quality breakdown
  const byQuality: Record<string, number> = {};
  for (const q of CONTACT_QUALITIES) byQuality[q] = 0;
  for (const r of rows) byQuality[r.contact_quality] = (byQuality[r.contact_quality] || 0) + 1;

  // Mood improvement rate: mood was negative before and positive/neutral after
  const negativeMoodsBefore = ["Anxious", "Reluctant", "Distressed"];
  const positiveMoodsAfter = ["Happy", "Positive", "Neutral"];
  const completedRows = rows.filter((r) => r.status === "Completed");
  const moodImproved = completedRows.filter(
    (r) => negativeMoodsBefore.includes(r.child_mood_before) && positiveMoodsAfter.includes(r.child_mood_after),
  ).length;
  const negativeBeforeCount = completedRows.filter((r) => negativeMoodsBefore.includes(r.child_mood_before)).length;
  const moodImprovementRate = negativeBeforeCount > 0
    ? Math.round((moodImproved / negativeBeforeCount) * 1000) / 10
    : 0;

  // Mood deterioration: mood was positive before and negative after
  const positiveMoodsBefore = ["Happy", "Excited", "Neutral"];
  const negativeMoodsAfter = ["Anxious", "Upset", "Distressed", "Unsettled"];
  const moodDeteriorated = completedRows.filter(
    (r) => positiveMoodsBefore.includes(r.child_mood_before) && negativeMoodsAfter.includes(r.child_mood_after),
  ).length;
  const positiveBeforeCount = completedRows.filter((r) => positiveMoodsBefore.includes(r.child_mood_before)).length;
  const moodDeteriorationRate = positiveBeforeCount > 0
    ? Math.round((moodDeteriorated / positiveBeforeCount) * 1000) / 10
    : 0;

  // Concern rate
  const concernCount = rows.filter((r) => r.concerns_raised).length;
  const concernRate = total > 0 ? Math.round((concernCount / total) * 1000) / 10 : 0;

  // Child wishes rate
  const wishesCount = rows.filter((r) => r.child_wishes_considered).length;
  const wishesRate = total > 0 ? Math.round((wishesCount / total) * 1000) / 10 : 0;

  // Risk assessment rate (for face-to-face and overnight contacts)
  const riskRequired = rows.filter((r) =>
    r.contact_type.startsWith("Face-to-Face") ||
    r.contact_type === "Overnight Stay" ||
    r.contact_type === "Holiday Contact",
  );
  const riskDone = riskRequired.filter((r) => r.risk_assessed).length;
  const riskRate = riskRequired.length > 0
    ? Math.round((riskDone / riskRequired.length) * 1000) / 10
    : 0;

  // Supervision rate (supervised contact types)
  const supervisedTypes = ["Face-to-Face Supervised", "Court Ordered", "Indirect — via Social Worker"];
  const supervisedCount = rows.filter((r) => supervisedTypes.includes(r.contact_type)).length;
  const supervisionRate = total > 0
    ? Math.round((supervisedCount / total) * 1000) / 10
    : 0;

  // Average duration (completed contacts with duration)
  const withDuration = completedRows.filter((r) => r.duration_minutes !== null && r.duration_minutes > 0);
  const totalDuration = withDuration.reduce((sum, r) => sum + (r.duration_minutes ?? 0), 0);
  const avgDuration = withDuration.length > 0
    ? Math.round((totalDuration / withDuration.length) * 10) / 10
    : 0;

  // Unique children and contacts
  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const uniqueContacts = new Set(rows.map((r) => r.contact_person_name)).size;

  // Social worker notification rate (when concerns raised)
  const withConcerns = rows.filter((r) => r.concerns_raised);
  const swNotified = withConcerns.filter((r) => r.social_worker_notified).length;
  const swRate = withConcerns.length > 0
    ? Math.round((swNotified / withConcerns.length) * 1000) / 10
    : 100;

  // Quality rates
  const positiveQuality = completedRows.filter((r) => r.contact_quality === "Positive").length;
  const positiveRate = completedRows.length > 0
    ? Math.round((positiveQuality / completedRows.length) * 1000) / 10
    : 0;

  const difficultQuality = completedRows.filter((r) => r.contact_quality === "Difficult").length;
  const difficultRate = completedRows.length > 0
    ? Math.round((difficultQuality / completedRows.length) * 1000) / 10
    : 0;

  return {
    total_contacts: total,
    completed_count: completedCount,
    cancelled_count: cancelledCount,
    refused_by_child_count: refusedByChild,
    refused_by_contact_count: refusedByContact,
    suspended_count: suspendedCount,
    rescheduled_count: rescheduledCount,
    confirmed_count: confirmedCount,
    completion_rate: completionRate,
    by_relationship: byRelationship,
    by_contact_type: byType,
    by_status: byStatus,
    by_mood_before: byMoodBefore,
    by_mood_after: byMoodAfter,
    by_quality: byQuality,
    mood_improvement_rate: moodImprovementRate,
    mood_deterioration_rate: moodDeteriorationRate,
    concern_rate: concernRate,
    child_wishes_rate: wishesRate,
    risk_assessment_rate: riskRate,
    supervision_rate: supervisionRate,
    average_duration: avgDuration,
    unique_children: uniqueChildren,
    unique_contacts: uniqueContacts,
    sw_notification_rate: swRate,
    positive_quality_rate: positiveRate,
    difficult_quality_rate: difficultRate,
  };
}

export function computeAlerts(
  rows: FamilyContactArrangementsRow[],
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

  // Critical: concerns raised but social worker not notified
  for (const r of rows) {
    if (r.concerns_raised && !r.social_worker_notified) {
      alerts.push({
        type: "concerns_sw_not_notified",
        severity: "critical",
        message: `Safeguarding concerns raised during contact between ${r.child_name} and ${r.contact_person_name} (${r.relationship}) but social worker has not been notified — immediate notification required per Reg 12`,
        record_id: r.id,
      });
    }
  }

  // Critical: child distressed after contact with no concerns documented
  for (const r of rows) {
    if (r.child_mood_after === "Distressed" && !r.concerns_raised && r.status === "Completed") {
      alerts.push({
        type: "distressed_no_concerns",
        severity: "critical",
        message: `${r.child_name} was distressed after contact with ${r.contact_person_name} (${r.relationship}) but no concerns have been documented — review whether safeguarding concerns should be raised per Reg 12`,
        record_id: r.id,
      });
    }
  }

  // Critical: face-to-face or overnight contact without risk assessment
  for (const r of rows) {
    if (
      (r.contact_type.startsWith("Face-to-Face") || r.contact_type === "Overnight Stay" || r.contact_type === "Holiday Contact") &&
      !r.risk_assessed &&
      r.status === "Completed"
    ) {
      alerts.push({
        type: "no_risk_assessment",
        severity: "critical",
        message: `${r.contact_type} between ${r.child_name} and ${r.contact_person_name} completed without risk assessment — this is required per Reg 12 to ensure child safety`,
        record_id: r.id,
      });
    }
  }

  // High: repeated difficult contact quality with same contact person
  const contactPairQuality = new Map<string, { difficult: number; total: number }>();
  for (const r of rows) {
    if (r.status !== "Completed") continue;
    const key = `${r.child_name}|${r.contact_person_name}`;
    if (!contactPairQuality.has(key)) contactPairQuality.set(key, { difficult: 0, total: 0 });
    const entry = contactPairQuality.get(key)!;
    entry.total++;
    if (r.contact_quality === "Difficult") entry.difficult++;
  }
  for (const [key, counts] of contactPairQuality) {
    if (counts.difficult >= 2 && counts.difficult / counts.total >= 0.5) {
      const [childName, contactName] = key.split("|");
      alerts.push({
        type: "repeated_difficult_contact",
        severity: "high",
        message: `${counts.difficult} of ${counts.total} completed contacts between ${childName} and ${contactName} were rated Difficult — review contact arrangements and consider whether adjustments are needed to protect the child's wellbeing`,
      });
    }
  }

  // High: child repeatedly refusing contact
  const childRefusals = new Map<string, number>();
  for (const r of rows) {
    if (r.status === "Refused by Child") {
      childRefusals.set(r.child_name, (childRefusals.get(r.child_name) || 0) + 1);
    }
  }
  for (const [childName, count] of childRefusals) {
    if (count >= 2) {
      alerts.push({
        type: "repeated_child_refusal",
        severity: "high",
        message: `${childName} has refused contact ${count} times — explore reasons with the child sensitively and update care plan to reflect their wishes per s34 Children Act 1989`,
      });
    }
  }

  // High: child wishes not considered
  for (const r of rows) {
    if (!r.child_wishes_considered && r.status !== "Suspended by Court") {
      alerts.push({
        type: "wishes_not_considered",
        severity: "high",
        message: `Child's wishes were not considered for contact between ${r.child_name} and ${r.contact_person_name} — Reg 7 and s34 Children Act 1989 require the child's feelings about contact to be ascertained`,
        record_id: r.id,
      });
    }
  }

  // High: mood deteriorated from positive to distressed
  for (const r of rows) {
    if (
      r.status === "Completed" &&
      (r.child_mood_before === "Happy" || r.child_mood_before === "Excited") &&
      (r.child_mood_after === "Distressed" || r.child_mood_after === "Upset")
    ) {
      alerts.push({
        type: "mood_severe_deterioration",
        severity: "high",
        message: `${r.child_name}'s mood changed from ${r.child_mood_before} to ${r.child_mood_after} during contact with ${r.contact_person_name} — review what happened and consider support needed`,
        record_id: r.id,
      });
    }
  }

  // Medium: supervised contact without supervisor name
  for (const r of rows) {
    if (
      (r.contact_type === "Face-to-Face Supervised" || r.contact_type === "Court Ordered") &&
      (!r.supervisor_name || r.supervisor_name.trim().length === 0) &&
      r.status === "Completed"
    ) {
      alerts.push({
        type: "no_supervisor_recorded",
        severity: "medium",
        message: `Supervised contact between ${r.child_name} and ${r.contact_person_name} has no supervisor name recorded — ensure supervision is documented for audit trail`,
        record_id: r.id,
      });
    }
  }

  // Medium: cancelled contacts without rescheduling
  for (const r of rows) {
    if (r.status === "Cancelled" && !r.next_contact_date) {
      alerts.push({
        type: "cancelled_no_reschedule",
        severity: "medium",
        message: `Contact between ${r.child_name} and ${r.contact_person_name} was cancelled with no next contact date scheduled — consider rescheduling to maintain family relationships per Reg 7`,
        record_id: r.id,
      });
    }
  }

  // Medium: contact refused by family member
  for (const r of rows) {
    if (r.status === "Refused by Contact") {
      alerts.push({
        type: "contact_refused_by_family",
        severity: "medium",
        message: `${r.contact_person_name} (${r.relationship}) refused contact with ${r.child_name} — consider the impact on the child and whether social worker involvement is needed`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: FamilyContactArrangementsRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  insights.push(
    `[sky] ${metrics.total_contacts} family contact ${metrics.total_contacts === 1 ? "record" : "records"} for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"} with ${metrics.unique_contacts} family ${metrics.unique_contacts === 1 ? "member" : "members"}. ` +
      `${metrics.completed_count} completed, ${metrics.cancelled_count} cancelled, ${metrics.refused_by_child_count} refused by child. ` +
      `Completion rate: ${metrics.completion_rate}%. ` +
      `Average duration: ${metrics.average_duration} minutes. ` +
      `Positive quality rate: ${metrics.positive_quality_rate}%. ` +
      `Child wishes considered in ${metrics.child_wishes_rate}% of contacts.`,
  );

  // Insight 2: Safety and wellbeing indicators
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority family contact alerts. ` +
        `Concern rate: ${metrics.concern_rate}%. ` +
        `Risk assessment completion: ${metrics.risk_assessment_rate}%. ` +
        `Mood deterioration rate: ${metrics.mood_deterioration_rate}%. ` +
        `Social worker notification rate for concerns: ${metrics.sw_notification_rate}%. ` +
        `${metrics.difficult_quality_rate}% of completed contacts rated Difficult.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority family contact alerts. ` +
        `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
        `Mood improvement rate: ${metrics.mood_improvement_rate}% (children who arrived anxious/reluctant left feeling positive). ` +
        `Supervision rate: ${metrics.supervision_rate}%. ` +
        `Continue supporting positive family contact to promote children's wellbeing per Reg 7.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.refused_by_child_count > 0) {
    insights.push(
      `[reflect] ${metrics.refused_by_child_count} ${metrics.refused_by_child_count === 1 ? "contact was" : "contacts were"} refused by children. ` +
        `What are the underlying reasons for refusal, and how is the home creating safe opportunities for children to express their feelings about contact? ` +
        `Are alternative forms of contact being explored when face-to-face contact is too difficult?`,
    );
  } else if (metrics.mood_deterioration_rate > 20) {
    insights.push(
      `[reflect] ${metrics.mood_deterioration_rate}% of children experienced mood deterioration during contact. ` +
        `What support is provided to children before, during, and after contact to help them manage their emotions? ` +
        `Are post-contact debriefs happening with key workers to process the child's experience?`,
    );
  } else if (metrics.cancelled_count > 0) {
    insights.push(
      `[reflect] ${metrics.cancelled_count} ${metrics.cancelled_count === 1 ? "contact was" : "contacts were"} cancelled. ` +
        `What impact do cancellations have on children's emotional wellbeing and trust? ` +
        `How does the home support children when planned contact does not go ahead, and are patterns of cancellation being addressed with families?`,
    );
  } else {
    insights.push(
      `[reflect] Are contact arrangements being regularly reviewed to ensure they continue to meet children's changing needs? ` +
        `As children grow, their preferences for contact type and frequency may evolve. ` +
        `How does the home ensure sibling relationships are actively maintained when siblings are placed separately?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listFamilyContactArrangements(
  homeId: string,
  filters?: {
    childName?: string;
    relationship?: Relationship;
    contactType?: ContactType;
    status?: Status;
    limit?: number;
  },
): Promise<ServiceResult<FamilyContactArrangementsRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_family_contact_arrangements") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.childName) q = q.eq("child_name", filters.childName);
  if (filters?.relationship) q = q.eq("relationship", filters.relationship);
  if (filters?.contactType) q = q.eq("contact_type", filters.contactType);
  if (filters?.status) q = q.eq("status", filters.status);

  q = q.order("scheduled_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getFamilyContactArrangement(
  id: string,
): Promise<ServiceResult<FamilyContactArrangementsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_family_contact_arrangements") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createFamilyContactArrangement(input: {
  homeId: string;
  childName: string;
  contactPersonName: string;
  relationship: Relationship;
  contactType: ContactType;
  scheduledDate: string;
  actualDate?: string | null;
  durationMinutes?: number | null;
  location?: string | null;
  supervisorName?: string | null;
  childWishesConsidered?: boolean;
  childMoodBefore: ChildMoodBefore;
  childMoodAfter: ChildMoodAfter;
  contactQuality: ContactQuality;
  riskAssessed?: boolean;
  concernsRaised?: boolean;
  concernDetails?: string | null;
  socialWorkerNotified?: boolean;
  outcomeNotes: string;
  nextContactDate?: string | null;
  status: Status;
  notes?: string | null;
}): Promise<ServiceResult<FamilyContactArrangementsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateFamilyContactArrangement({
    childName: input.childName,
    contactPersonName: input.contactPersonName,
    relationship: input.relationship,
    contactType: input.contactType,
    scheduledDate: input.scheduledDate,
    actualDate: input.actualDate,
    durationMinutes: input.durationMinutes,
    supervisorName: input.supervisorName,
    childWishesConsidered: input.childWishesConsidered,
    childMoodBefore: input.childMoodBefore,
    childMoodAfter: input.childMoodAfter,
    contactQuality: input.contactQuality,
    riskAssessed: input.riskAssessed,
    concernsRaised: input.concernsRaised,
    concernDetails: input.concernDetails,
    socialWorkerNotified: input.socialWorkerNotified,
    outcomeNotes: input.outcomeNotes,
    nextContactDate: input.nextContactDate,
    status: input.status,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_family_contact_arrangements") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      contact_person_name: input.contactPersonName,
      relationship: input.relationship,
      contact_type: input.contactType,
      scheduled_date: input.scheduledDate,
      actual_date: input.actualDate ?? null,
      duration_minutes: input.durationMinutes ?? null,
      location: input.location ?? null,
      supervisor_name: input.supervisorName ?? null,
      child_wishes_considered: input.childWishesConsidered ?? false,
      child_mood_before: input.childMoodBefore,
      child_mood_after: input.childMoodAfter,
      contact_quality: input.contactQuality,
      risk_assessed: input.riskAssessed ?? false,
      concerns_raised: input.concernsRaised ?? false,
      concern_details: input.concernDetails ?? null,
      social_worker_notified: input.socialWorkerNotified ?? false,
      outcome_notes: input.outcomeNotes,
      next_contact_date: input.nextContactDate ?? null,
      status: input.status,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateFamilyContactArrangement(
  id: string,
  updates: Partial<{
    childName: string;
    contactPersonName: string;
    relationship: Relationship;
    contactType: ContactType;
    scheduledDate: string;
    actualDate: string | null;
    durationMinutes: number | null;
    location: string | null;
    supervisorName: string | null;
    childWishesConsidered: boolean;
    childMoodBefore: ChildMoodBefore;
    childMoodAfter: ChildMoodAfter;
    contactQuality: ContactQuality;
    riskAssessed: boolean;
    concernsRaised: boolean;
    concernDetails: string | null;
    socialWorkerNotified: boolean;
    outcomeNotes: string;
    nextContactDate: string | null;
    status: Status;
    notes: string | null;
  }>,
): Promise<ServiceResult<FamilyContactArrangementsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.contactPersonName !== undefined) mapped.contact_person_name = updates.contactPersonName;
  if (updates.relationship !== undefined) mapped.relationship = updates.relationship;
  if (updates.contactType !== undefined) mapped.contact_type = updates.contactType;
  if (updates.scheduledDate !== undefined) mapped.scheduled_date = updates.scheduledDate;
  if (updates.actualDate !== undefined) mapped.actual_date = updates.actualDate;
  if (updates.durationMinutes !== undefined) mapped.duration_minutes = updates.durationMinutes;
  if (updates.location !== undefined) mapped.location = updates.location;
  if (updates.supervisorName !== undefined) mapped.supervisor_name = updates.supervisorName;
  if (updates.childWishesConsidered !== undefined) mapped.child_wishes_considered = updates.childWishesConsidered;
  if (updates.childMoodBefore !== undefined) mapped.child_mood_before = updates.childMoodBefore;
  if (updates.childMoodAfter !== undefined) mapped.child_mood_after = updates.childMoodAfter;
  if (updates.contactQuality !== undefined) mapped.contact_quality = updates.contactQuality;
  if (updates.riskAssessed !== undefined) mapped.risk_assessed = updates.riskAssessed;
  if (updates.concernsRaised !== undefined) mapped.concerns_raised = updates.concernsRaised;
  if (updates.concernDetails !== undefined) mapped.concern_details = updates.concernDetails;
  if (updates.socialWorkerNotified !== undefined) mapped.social_worker_notified = updates.socialWorkerNotified;
  if (updates.outcomeNotes !== undefined) mapped.outcome_notes = updates.outcomeNotes;
  if (updates.nextContactDate !== undefined) mapped.next_contact_date = updates.nextContactDate;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_family_contact_arrangements") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteFamilyContactArrangement(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_family_contact_arrangements") as SB)
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
  validateFamilyContactArrangement,
};
