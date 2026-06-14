// ==============================================================================
// CARA -- LETTERBOX & INDIRECT CONTACT SERVICE
// Tracks indirect contact arrangements between looked-after children and birth
// families or significant others, including letterbox exchanges, content screening,
// emotional impact assessment, child wishes, therapeutic input, facilitator
// involvement, and letterbox agreement management.
//
// Covers: Letter exchanges, card exchanges, photo exchanges, memory box items,
// drawings and artwork, approved gifts, supervised emails, content screening
// and appropriateness, child support to write, child wishes and feelings,
// emotional impact assessment (mood after contact), facilitator records,
// therapeutic input, letterbox agreements, frequency scheduling, withheld
// content, and returned-for-amendment tracking.
//
// UK Regulatory Framework:
// CHR 2015 Reg 7 (contact arrangements),
// Children Act 1989 s34 (contact with children in care),
// Adoption and Children Act 2002 s46 (post-adoption contact),
// Children Act 1989 s1 (paramountcy principle — child's welfare),
// Working Together to Safeguard Children 2023.
//
// SCCIF: Overall experiences — "Children maintain important relationships safely.
// Indirect contact is carefully managed, content is screened for appropriateness,
// children are supported to participate, their wishes and feelings are considered,
// and the emotional impact of contact is assessed and responded to. Letterbox
// agreements are in place and reviewed regularly."
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RELATIONSHIPS = [
  "Birth Mother",
  "Birth Father",
  "Birth Sibling",
  "Adoptive Family",
  "Former Foster Carer",
  "Extended Family",
  "Other",
] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

export const CONTACT_DIRECTIONS = [
  "Child to Contact",
  "Contact to Child",
  "Two-Way Exchange",
] as const;
export type ContactDirection = (typeof CONTACT_DIRECTIONS)[number];

export const CONTACT_METHODS = [
  "Letter",
  "Card",
  "Photo Exchange",
  "Memory Box Item",
  "Drawing/Artwork",
  "Gift — Approved",
  "Email — Supervised",
  "Other",
] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const CHILD_MOODS = [
  "Happy",
  "Neutral",
  "Sad",
  "Anxious",
  "Upset",
  "Confused",
  "Indifferent",
] as const;
export type ChildMood = (typeof CHILD_MOODS)[number];

export const FREQUENCIES = [
  "Monthly",
  "Quarterly",
  "Biannually",
  "Annually",
  "Birthdays/Christmas Only",
  "Ad Hoc",
] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const STATUSES = [
  "Sent",
  "Received",
  "Screened — Withheld",
  "Returned for Amendment",
  "Pending Review",
  "Cancelled",
] as const;
export type Status = (typeof STATUSES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const BIRTH_FAMILY_RELATIONSHIPS: Relationship[] = [
  "Birth Mother",
  "Birth Father",
  "Birth Sibling",
  "Extended Family",
];

export const NEGATIVE_MOODS: ChildMood[] = [
  "Sad",
  "Anxious",
  "Upset",
  "Confused",
];

export const COMPLETED_STATUSES: Status[] = [
  "Sent",
  "Received",
];

// -- Label maps ---------------------------------------------------------------

export const RELATIONSHIP_LABELS: { relationship: Relationship; label: string }[] = [
  { relationship: "Birth Mother", label: "Birth Mother" },
  { relationship: "Birth Father", label: "Birth Father" },
  { relationship: "Birth Sibling", label: "Birth Sibling" },
  { relationship: "Adoptive Family", label: "Adoptive Family" },
  { relationship: "Former Foster Carer", label: "Former Foster Carer" },
  { relationship: "Extended Family", label: "Extended Family" },
  { relationship: "Other", label: "Other" },
];

export const CONTACT_DIRECTION_LABELS: { direction: ContactDirection; label: string }[] = [
  { direction: "Child to Contact", label: "Child to Contact" },
  { direction: "Contact to Child", label: "Contact to Child" },
  { direction: "Two-Way Exchange", label: "Two-Way Exchange" },
];

export const CONTACT_METHOD_LABELS: { method: ContactMethod; label: string }[] = [
  { method: "Letter", label: "Letter" },
  { method: "Card", label: "Card" },
  { method: "Photo Exchange", label: "Photo Exchange" },
  { method: "Memory Box Item", label: "Memory Box Item" },
  { method: "Drawing/Artwork", label: "Drawing/Artwork" },
  { method: "Gift — Approved", label: "Gift (Approved)" },
  { method: "Email — Supervised", label: "Email (Supervised)" },
  { method: "Other", label: "Other" },
];

export const CHILD_MOOD_LABELS: { mood: ChildMood; label: string }[] = [
  { mood: "Happy", label: "Happy" },
  { mood: "Neutral", label: "Neutral" },
  { mood: "Sad", label: "Sad" },
  { mood: "Anxious", label: "Anxious" },
  { mood: "Upset", label: "Upset" },
  { mood: "Confused", label: "Confused" },
  { mood: "Indifferent", label: "Indifferent" },
];

export const FREQUENCY_LABELS: { frequency: Frequency; label: string }[] = [
  { frequency: "Monthly", label: "Monthly" },
  { frequency: "Quarterly", label: "Quarterly" },
  { frequency: "Biannually", label: "Biannually" },
  { frequency: "Annually", label: "Annually" },
  { frequency: "Birthdays/Christmas Only", label: "Birthdays/Christmas Only" },
  { frequency: "Ad Hoc", label: "Ad Hoc" },
];

export const STATUS_LABELS: { status: Status; label: string }[] = [
  { status: "Sent", label: "Sent" },
  { status: "Received", label: "Received" },
  { status: "Screened — Withheld", label: "Screened (Withheld)" },
  { status: "Returned for Amendment", label: "Returned for Amendment" },
  { status: "Pending Review", label: "Pending Review" },
  { status: "Cancelled", label: "Cancelled" },
];

// -- Row type -----------------------------------------------------------------

export interface LetterboxContactRow {
  id: string;
  home_id: string;
  child_name: string;
  contact_person_name: string;
  relationship: Relationship;
  contact_direction: ContactDirection;
  scheduled_date: string;
  actual_date: string | null;
  contact_method: ContactMethod;
  content_screened: boolean;
  content_appropriate: boolean;
  content_concerns: string | null;
  child_supported_to_write: boolean;
  child_wishes_considered: boolean;
  emotional_impact_assessed: boolean;
  child_mood_after: ChildMood;
  facilitator_name: string;
  social_worker_aware: boolean;
  therapeutic_input: boolean;
  letterbox_agreement_in_place: boolean;
  frequency_agreed: Frequency;
  next_scheduled_date: string | null;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateLetterboxContact(input: {
  childName?: string;
  contactPersonName?: string;
  relationship?: string;
  contactDirection?: string;
  scheduledDate?: string;
  actualDate?: string | null;
  contactMethod?: string;
  contentScreened?: boolean;
  contentAppropriate?: boolean;
  contentConcerns?: string | null;
  childMoodAfter?: string;
  facilitatorName?: string;
  frequencyAgreed?: string;
  nextScheduledDate?: string | null;
  status?: string;
  letterboxAgreementInPlace?: boolean;
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
  if (!input.contactDirection || !(CONTACT_DIRECTIONS as readonly string[]).includes(input.contactDirection)) {
    errors.push(`Contact direction must be one of: ${CONTACT_DIRECTIONS.join(", ")}`);
  }
  if (!input.scheduledDate) {
    errors.push("Scheduled date is required");
  } else {
    const dateObj = new Date(input.scheduledDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Scheduled date must be a valid date");
    }
  }
  if (!input.contactMethod || !(CONTACT_METHODS as readonly string[]).includes(input.contactMethod)) {
    errors.push(`Contact method must be one of: ${CONTACT_METHODS.join(", ")}`);
  }
  if (input.childMoodAfter && !(CHILD_MOODS as readonly string[]).includes(input.childMoodAfter)) {
    errors.push(`Child mood after must be one of: ${CHILD_MOODS.join(", ")}`);
  }
  if (!input.facilitatorName || input.facilitatorName.trim().length === 0) {
    errors.push("Facilitator name is required");
  }
  if (input.frequencyAgreed && !(FREQUENCIES as readonly string[]).includes(input.frequencyAgreed)) {
    errors.push(`Frequency agreed must be one of: ${FREQUENCIES.join(", ")}`);
  }
  if (input.status && !(STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  // Business rule: actual date should not be before scheduled date
  if (input.actualDate && input.scheduledDate) {
    const actual = new Date(input.actualDate);
    const scheduled = new Date(input.scheduledDate);
    if (!isNaN(actual.getTime()) && !isNaN(scheduled.getTime())) {
      // Allow actual date to be up to 30 days before scheduled (re-scheduling flexibility)
      const thirtyDaysBefore = new Date(scheduled);
      thirtyDaysBefore.setDate(thirtyDaysBefore.getDate() - 30);
      if (actual < thirtyDaysBefore) {
        errors.push("Actual date is more than 30 days before the scheduled date — please verify");
      }
    }
  }

  // Business rule: content must be screened before marking as sent/received
  if (
    input.status &&
    (COMPLETED_STATUSES as string[]).includes(input.status) &&
    input.contentScreened === false
  ) {
    errors.push("Content must be screened before contact can be marked as Sent or Received — CHR 2015 Reg 7 requires appropriate safeguarding of contact");
  }

  // Business rule: content concerns should be documented if content is not appropriate
  if (
    input.contentAppropriate === false &&
    (!input.contentConcerns || input.contentConcerns.trim().length === 0)
  ) {
    errors.push("Content concerns must be documented when content is flagged as not appropriate");
  }

  // Business rule: withheld content must have concerns documented
  if (
    input.status === "Screened — Withheld" &&
    (!input.contentConcerns || input.contentConcerns.trim().length === 0)
  ) {
    errors.push("Content concerns must be documented when content is withheld — the reason for withholding must be recorded for the child's records and for review");
  }

  // Business rule: letterbox agreement should be in place for ongoing contact
  if (
    input.frequencyAgreed &&
    input.frequencyAgreed !== "Ad Hoc" &&
    input.letterboxAgreementInPlace === false
  ) {
    errors.push("A letterbox agreement should be in place when regular contact frequency is agreed — this protects both the child and the contact person");
  }

  // Business rule: next scheduled date should be in the future
  if (input.nextScheduledDate) {
    const nextDate = new Date(input.nextScheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(nextDate.getTime())) {
      errors.push("Next scheduled date must be a valid date");
    } else if (nextDate < today) {
      errors.push("Next scheduled date should not be in the past");
    }
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: LetterboxContactRow[],
): {
  total_contacts: number;
  by_relationship: Record<string, number>;
  by_contact_method: Record<string, number>;
  by_contact_direction: Record<string, number>;
  content_screening_rate: number;
  appropriateness_rate: number;
  concern_rate: number;
  child_support_rate: number;
  child_wishes_rate: number;
  emotional_impact_rate: number;
  by_mood_after: Record<string, number>;
  agreement_rate: number;
  withheld_count: number;
  completion_rate: number;
  unique_children: number;
  unique_contacts: number;
  social_worker_aware_rate: number;
  therapeutic_input_rate: number;
  overdue_scheduled_count: number;
} {
  const total = rows.length;

  const boolRate = (field: keyof LetterboxContactRow, subset?: LetterboxContactRow[]) => {
    const pool = subset ?? rows;
    const count = pool.filter((r) => r[field] === true).length;
    return pool.length > 0 ? Math.round((count / pool.length) * 1000) / 10 : 0;
  };

  // Relationship breakdown
  const byRelationship: Record<string, number> = {};
  for (const rel of RELATIONSHIPS) byRelationship[rel] = 0;
  for (const r of rows) byRelationship[r.relationship] = (byRelationship[r.relationship] || 0) + 1;

  // Contact method breakdown
  const byContactMethod: Record<string, number> = {};
  for (const cm of CONTACT_METHODS) byContactMethod[cm] = 0;
  for (const r of rows) byContactMethod[r.contact_method] = (byContactMethod[r.contact_method] || 0) + 1;

  // Contact direction breakdown
  const byContactDirection: Record<string, number> = {};
  for (const cd of CONTACT_DIRECTIONS) byContactDirection[cd] = 0;
  for (const r of rows) byContactDirection[r.contact_direction] = (byContactDirection[r.contact_direction] || 0) + 1;

  // Mood after breakdown
  const byMoodAfter: Record<string, number> = {};
  for (const m of CHILD_MOODS) byMoodAfter[m] = 0;
  for (const r of rows) byMoodAfter[r.child_mood_after] = (byMoodAfter[r.child_mood_after] || 0) + 1;

  // Screened content — appropriateness rate (of those screened)
  const screenedRows = rows.filter((r) => r.content_screened);
  const appropriatenessRate = screenedRows.length > 0
    ? Math.round((screenedRows.filter((r) => r.content_appropriate).length / screenedRows.length) * 1000) / 10
    : 0;

  // Concern rate (of total)
  const concernRate = total > 0
    ? Math.round((rows.filter((r) => r.content_concerns && r.content_concerns.trim().length > 0).length / total) * 1000) / 10
    : 0;

  // Withheld count
  const withheldCount = rows.filter((r) => r.status === "Screened — Withheld").length;

  // Completion rate (Sent or Received vs total)
  const completedCount = rows.filter((r) => (COMPLETED_STATUSES as string[]).includes(r.status)).length;
  const completionRate = total > 0
    ? Math.round((completedCount / total) * 1000) / 10
    : 0;

  // Unique children and contacts
  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const uniqueContacts = new Set(rows.map((r) => r.contact_person_name)).size;

  // Overdue scheduled contacts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueScheduledCount = rows.filter((r) => {
    if (r.status !== "Pending Review") return false;
    const scheduled = new Date(r.scheduled_date);
    return scheduled < today;
  }).length;

  return {
    total_contacts: total,
    by_relationship: byRelationship,
    by_contact_method: byContactMethod,
    by_contact_direction: byContactDirection,
    content_screening_rate: boolRate("content_screened"),
    appropriateness_rate: appropriatenessRate,
    concern_rate: concernRate,
    child_support_rate: boolRate("child_supported_to_write"),
    child_wishes_rate: boolRate("child_wishes_considered"),
    emotional_impact_rate: boolRate("emotional_impact_assessed"),
    by_mood_after: byMoodAfter,
    agreement_rate: boolRate("letterbox_agreement_in_place"),
    withheld_count: withheldCount,
    completion_rate: completionRate,
    unique_children: uniqueChildren,
    unique_contacts: uniqueContacts,
    social_worker_aware_rate: boolRate("social_worker_aware"),
    therapeutic_input_rate: boolRate("therapeutic_input"),
    overdue_scheduled_count: overdueScheduledCount,
  };
}

export function computeAlerts(
  rows: LetterboxContactRow[],
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

  // Critical: Unscreened content sent or received
  for (const r of rows) {
    if (
      (COMPLETED_STATUSES as string[]).includes(r.status) &&
      !r.content_screened
    ) {
      alerts.push({
        type: "unscreened_content_completed",
        severity: "critical",
        message: `${r.contact_method} for ${r.child_name} from/to ${r.contact_person_name} was marked as ${r.status} without content screening — all indirect contact must be screened per CHR 2015 Reg 7 to safeguard the child`,
        record_id: r.id,
      });
    }
  }

  // Critical: Inappropriate content not withheld
  for (const r of rows) {
    if (
      !r.content_appropriate &&
      r.content_screened &&
      r.status !== "Screened — Withheld" &&
      r.status !== "Returned for Amendment" &&
      r.status !== "Cancelled"
    ) {
      alerts.push({
        type: "inappropriate_not_withheld",
        severity: "critical",
        message: `${r.contact_method} for ${r.child_name} from ${r.contact_person_name} was flagged as inappropriate but has not been withheld or returned for amendment — inappropriate content must not reach the child without review`,
        record_id: r.id,
      });
    }
  }

  // High: Child's wishes not considered
  for (const r of rows) {
    if (
      !r.child_wishes_considered &&
      (COMPLETED_STATUSES as string[]).includes(r.status)
    ) {
      alerts.push({
        type: "wishes_not_considered",
        severity: "high",
        message: `${r.child_name}'s wishes and feelings were not recorded for ${r.contact_method} contact with ${r.contact_person_name} — Children Act 1989 s1 requires the child's views to be ascertained and given due weight`,
        record_id: r.id,
      });
    }
  }

  // High: No letterbox agreement for regular contact
  for (const r of rows) {
    if (
      !r.letterbox_agreement_in_place &&
      r.frequency_agreed !== "Ad Hoc" &&
      r.status !== "Cancelled"
    ) {
      alerts.push({
        type: "no_agreement",
        severity: "high",
        message: `No letterbox agreement is in place for ${r.child_name}'s ${r.frequency_agreed} contact with ${r.contact_person_name} (${r.relationship}) — an agreement should be established to clarify boundaries, expectations, and screening arrangements`,
        record_id: r.id,
      });
    }
  }

  // High: Repeated negative mood after contact without therapeutic input
  const childContactMoods: Record<string, { negative: number; therapeutic: boolean }> = {};
  for (const r of rows) {
    const key = `${r.child_name}::${r.contact_person_name}`;
    if (!childContactMoods[key]) childContactMoods[key] = { negative: 0, therapeutic: false };
    if ((NEGATIVE_MOODS as string[]).includes(r.child_mood_after)) {
      childContactMoods[key].negative++;
    }
    if (r.therapeutic_input) childContactMoods[key].therapeutic = true;
  }
  for (const [key, data] of Object.entries(childContactMoods)) {
    if (data.negative >= 2 && !data.therapeutic) {
      const [childName, contactName] = key.split("::");
      alerts.push({
        type: "repeated_negative_mood",
        severity: "high",
        message: `${childName} has shown negative emotional responses on ${data.negative} occasions after contact with ${contactName} but no therapeutic input has been provided — consider referring for therapeutic support to process contact-related feelings`,
      });
    }
  }

  // High: Social worker not aware of contact
  for (const r of rows) {
    if (
      !r.social_worker_aware &&
      (COMPLETED_STATUSES as string[]).includes(r.status)
    ) {
      alerts.push({
        type: "sw_not_aware",
        severity: "high",
        message: `${r.child_name}'s social worker is not aware of ${r.contact_method} contact with ${r.contact_person_name} (${r.relationship}) — the allocated social worker must be informed of all contact arrangements per Working Together 2023`,
        record_id: r.id,
      });
    }
  }

  // Medium: Emotional impact not assessed
  for (const r of rows) {
    if (
      !r.emotional_impact_assessed &&
      (COMPLETED_STATUSES as string[]).includes(r.status)
    ) {
      alerts.push({
        type: "no_emotional_assessment",
        severity: "medium",
        message: `Emotional impact not assessed for ${r.child_name} after ${r.contact_method} contact with ${r.contact_person_name} — staff should observe and record the child's emotional state after all contact`,
        record_id: r.id,
      });
    }
  }

  // Medium: Child not supported to write (outgoing contact)
  for (const r of rows) {
    if (
      r.contact_direction === "Child to Contact" &&
      !r.child_supported_to_write &&
      (COMPLETED_STATUSES as string[]).includes(r.status)
    ) {
      alerts.push({
        type: "child_not_supported",
        severity: "medium",
        message: `${r.child_name} was not supported to compose ${r.contact_method} to ${r.contact_person_name} — children should be offered age-appropriate help with writing, drawing, or selecting content for indirect contact`,
        record_id: r.id,
      });
    }
  }

  // Medium: Overdue scheduled contacts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of rows) {
    if (r.status === "Pending Review") {
      const scheduled = new Date(r.scheduled_date);
      if (scheduled < today) {
        alerts.push({
          type: "overdue_contact",
          severity: "medium",
          message: `${r.contact_method} contact for ${r.child_name} with ${r.contact_person_name} was scheduled for ${r.scheduled_date} and is now overdue — follow up to maintain the contact arrangement`,
          record_id: r.id,
        });
      }
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: LetterboxContactRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const relationshipBreakdown = Object.entries(metrics.by_relationship)
    .filter(([, count]) => count > 0)
    .map(([rel, count]) => `${rel}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_contacts} letterbox/indirect ${metrics.total_contacts === 1 ? "contact" : "contacts"} ` +
      `across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"} ` +
      `with ${metrics.unique_contacts} ${metrics.unique_contacts === 1 ? "contact person" : "contact people"}. ` +
      `Relationships: ${relationshipBreakdown || "none recorded"}. ` +
      `Content screening: ${metrics.content_screening_rate}%. ` +
      `Completion: ${metrics.completion_rate}%. ` +
      `Agreements in place: ${metrics.agreement_rate}%. ` +
      `Withheld: ${metrics.withheld_count}.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    const moodBreakdown = Object.entries(metrics.by_mood_after)
      .filter(([, count]) => count > 0)
      .map(([mood, count]) => `${mood}: ${count}`)
      .join(", ");

    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority letterbox alerts active. ` +
        `Child wishes considered: ${metrics.child_wishes_rate}%. ` +
        `Emotional impact assessed: ${metrics.emotional_impact_rate}%. ` +
        `Mood after contact: ${moodBreakdown}. ` +
        `Social worker aware: ${metrics.social_worker_aware_rate}%. ` +
        `${metrics.overdue_scheduled_count} overdue ${metrics.overdue_scheduled_count === 1 ? "contact" : "contacts"}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority letterbox alerts currently active. ` +
        `Child support rate: ${metrics.child_support_rate}%. ` +
        `Therapeutic input: ${metrics.therapeutic_input_rate}%. ` +
        `Content appropriateness: ${metrics.appropriateness_rate}%. ` +
        `Continue regular review of contact arrangements per CHR 2015 Reg 7 and Children Act 1989 s34.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  const negativeMoodCount = rows.filter((r) => (NEGATIVE_MOODS as string[]).includes(r.child_mood_after)).length;
  const negativeMoodRate = rows.length > 0 ? Math.round((negativeMoodCount / rows.length) * 1000) / 10 : 0;

  if (negativeMoodRate > 40) {
    insights.push(
      `[reflect] ${negativeMoodRate}% of contacts result in negative emotional responses ` +
        `(sad, anxious, upset, or confused). Are contact arrangements being regularly ` +
        `reviewed in light of their emotional impact on children? The paramountcy principle ` +
        `under Children Act 1989 s1 requires that the child's welfare is the paramount ` +
        `consideration. Where contact consistently causes distress, a multi-agency review ` +
        `should consider whether the current arrangement remains in the child's best interests.`,
    );
  } else if (metrics.content_screening_rate < 100 && metrics.total_contacts > 0) {
    insights.push(
      `[reflect] Content screening rate is ${metrics.content_screening_rate}%, below the ` +
        `required 100% standard. Are all staff aware that every piece of indirect contact ` +
        `— letters, cards, photos, gifts — must be screened before being passed to or from ` +
        `the child? Screening protects children from potentially distressing, manipulative, ` +
        `or inappropriate content. CHR 2015 Reg 7 requires that contact arrangements ` +
        `safeguard the child's welfare.`,
    );
  } else if (metrics.child_wishes_rate < 80) {
    insights.push(
      `[reflect] Children's wishes and feelings have been considered in only ` +
        `${metrics.child_wishes_rate}% of contacts. Are staff routinely asking children ` +
        `how they feel about indirect contact before it takes place, whether they want ` +
        `to participate, and what they would like to say or include? The child's voice ` +
        `must be central to all contact decisions under Children Act 1989 s1 and UNCRC Article 12.`,
    );
  } else {
    insights.push(
      `[reflect] Are letterbox agreements being reviewed at each statutory review to ` +
        `ensure they remain appropriate as children's needs and circumstances change? ` +
        `Do children understand the purpose of indirect contact and feel empowered to ` +
        `express their wishes about it? Staff should create a safe space for children ` +
        `to discuss their feelings about contact and should never pressure participation.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listLetterboxContacts(
  homeId: string,
  filters?: {
    relationship?: Relationship;
    contactMethod?: ContactMethod;
    status?: Status;
    childName?: string;
    limit?: number;
  },
): Promise<ServiceResult<LetterboxContactRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_letterbox_contact") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.relationship) q = q.eq("relationship", filters.relationship);
  if (filters?.contactMethod) q = q.eq("contact_method", filters.contactMethod);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.childName) q = q.eq("child_name", filters.childName);

  q = q.order("scheduled_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getLetterboxContact(
  id: string,
): Promise<ServiceResult<LetterboxContactRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_letterbox_contact") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createLetterboxContact(input: {
  homeId: string;
  childName: string;
  contactPersonName: string;
  relationship: Relationship;
  contactDirection: ContactDirection;
  scheduledDate: string;
  actualDate?: string | null;
  contactMethod: ContactMethod;
  contentScreened?: boolean;
  contentAppropriate?: boolean;
  contentConcerns?: string | null;
  childSupportedToWrite?: boolean;
  childWishesConsidered?: boolean;
  emotionalImpactAssessed?: boolean;
  childMoodAfter?: ChildMood;
  facilitatorName: string;
  socialWorkerAware?: boolean;
  therapeuticInput?: boolean;
  letterboxAgreementInPlace?: boolean;
  frequencyAgreed?: Frequency;
  nextScheduledDate?: string | null;
  status?: Status;
  notes?: string | null;
}): Promise<ServiceResult<LetterboxContactRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateLetterboxContact({
    childName: input.childName,
    contactPersonName: input.contactPersonName,
    relationship: input.relationship,
    contactDirection: input.contactDirection,
    scheduledDate: input.scheduledDate,
    actualDate: input.actualDate,
    contactMethod: input.contactMethod,
    contentScreened: input.contentScreened,
    contentAppropriate: input.contentAppropriate,
    contentConcerns: input.contentConcerns,
    childMoodAfter: input.childMoodAfter,
    facilitatorName: input.facilitatorName,
    frequencyAgreed: input.frequencyAgreed,
    nextScheduledDate: input.nextScheduledDate,
    status: input.status,
    letterboxAgreementInPlace: input.letterboxAgreementInPlace,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_letterbox_contact") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      contact_person_name: input.contactPersonName,
      relationship: input.relationship,
      contact_direction: input.contactDirection,
      scheduled_date: input.scheduledDate,
      actual_date: input.actualDate ?? null,
      contact_method: input.contactMethod,
      content_screened: input.contentScreened ?? false,
      content_appropriate: input.contentAppropriate ?? false,
      content_concerns: input.contentConcerns ?? null,
      child_supported_to_write: input.childSupportedToWrite ?? false,
      child_wishes_considered: input.childWishesConsidered ?? false,
      emotional_impact_assessed: input.emotionalImpactAssessed ?? false,
      child_mood_after: input.childMoodAfter ?? "Neutral",
      facilitator_name: input.facilitatorName,
      social_worker_aware: input.socialWorkerAware ?? false,
      therapeutic_input: input.therapeuticInput ?? false,
      letterbox_agreement_in_place: input.letterboxAgreementInPlace ?? false,
      frequency_agreed: input.frequencyAgreed ?? "Quarterly",
      next_scheduled_date: input.nextScheduledDate ?? null,
      status: input.status ?? "Pending Review",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateLetterboxContact(
  id: string,
  updates: Partial<{
    childName: string;
    contactPersonName: string;
    relationship: Relationship;
    contactDirection: ContactDirection;
    scheduledDate: string;
    actualDate: string | null;
    contactMethod: ContactMethod;
    contentScreened: boolean;
    contentAppropriate: boolean;
    contentConcerns: string | null;
    childSupportedToWrite: boolean;
    childWishesConsidered: boolean;
    emotionalImpactAssessed: boolean;
    childMoodAfter: ChildMood;
    facilitatorName: string;
    socialWorkerAware: boolean;
    therapeuticInput: boolean;
    letterboxAgreementInPlace: boolean;
    frequencyAgreed: Frequency;
    nextScheduledDate: string | null;
    status: Status;
    notes: string | null;
  }>,
): Promise<ServiceResult<LetterboxContactRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.contactPersonName !== undefined) mapped.contact_person_name = updates.contactPersonName;
  if (updates.relationship !== undefined) mapped.relationship = updates.relationship;
  if (updates.contactDirection !== undefined) mapped.contact_direction = updates.contactDirection;
  if (updates.scheduledDate !== undefined) mapped.scheduled_date = updates.scheduledDate;
  if (updates.actualDate !== undefined) mapped.actual_date = updates.actualDate;
  if (updates.contactMethod !== undefined) mapped.contact_method = updates.contactMethod;
  if (updates.contentScreened !== undefined) mapped.content_screened = updates.contentScreened;
  if (updates.contentAppropriate !== undefined) mapped.content_appropriate = updates.contentAppropriate;
  if (updates.contentConcerns !== undefined) mapped.content_concerns = updates.contentConcerns;
  if (updates.childSupportedToWrite !== undefined) mapped.child_supported_to_write = updates.childSupportedToWrite;
  if (updates.childWishesConsidered !== undefined) mapped.child_wishes_considered = updates.childWishesConsidered;
  if (updates.emotionalImpactAssessed !== undefined) mapped.emotional_impact_assessed = updates.emotionalImpactAssessed;
  if (updates.childMoodAfter !== undefined) mapped.child_mood_after = updates.childMoodAfter;
  if (updates.facilitatorName !== undefined) mapped.facilitator_name = updates.facilitatorName;
  if (updates.socialWorkerAware !== undefined) mapped.social_worker_aware = updates.socialWorkerAware;
  if (updates.therapeuticInput !== undefined) mapped.therapeutic_input = updates.therapeuticInput;
  if (updates.letterboxAgreementInPlace !== undefined) mapped.letterbox_agreement_in_place = updates.letterboxAgreementInPlace;
  if (updates.frequencyAgreed !== undefined) mapped.frequency_agreed = updates.frequencyAgreed;
  if (updates.nextScheduledDate !== undefined) mapped.next_scheduled_date = updates.nextScheduledDate;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_letterbox_contact") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteLetterboxContact(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_letterbox_contact") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
