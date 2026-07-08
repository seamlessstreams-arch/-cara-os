// ══════════════════════════════════════════════════════════════════════════════
// CARA — Management Oversight · record hydration
//
// Pure mappers from real store records into an OversightInput, so a manager can
// run workflow assurance on an ACTUAL event (not just the demo example). No store
// access here — callers inject the records — so this stays deterministic + testable.
// ══════════════════════════════════════════════════════════════════════════════

import type { Incident, YoungPerson } from "@/types";
import type {
  OversightInput,
  OversightMode,
  RecordType,
  RiskLevel,
  ReferralKind,
  ReferralOrNotification,
} from "./types";

// IncidentType → oversight RecordType.
const RECORD_TYPE_MAP: Record<string, RecordType> = {
  physical_intervention: "physical_intervention",
  missing_from_care: "missing_episode",
  medication_error: "medication",
  allegation: "allegation",
  safeguarding_concern: "safeguarding",
  contextual_safeguarding: "safeguarding",
  exploitation_concern: "safeguarding",
  complaint: "complaint",
  self_harm: "incident",
  damage_to_property: "incident",
  behaviour_incident: "incident",
  bullying: "incident",
  online_safety: "incident",
  police_involvement: "incident",
  hospital_attendance: "incident",
  other: "other",
};

const SEVERITIES: RiskLevel[] = ["low", "medium", "high", "critical"];

/** A debrief record linked to an incident (structurally typed to avoid import coupling). */
export interface IncidentDebriefLike {
  type?: string;
  child_perspective?: string;
  what_happened?: string;
  what_worked_well?: string;
  lessons_learned?: string[];
  changes_needed?: string[];
  staff_involved?: string[];
}

export interface IncidentHydrationContext {
  youngPerson?: YoungPerson;
  /** Debriefs linked to this incident. */
  debriefs?: IncidentDebriefLike[];
  /** Other incidents for the SAME child (used for recent-context + pattern signals). */
  recentIncidents?: Incident[];
  today: string;
  oversightMode?: OversightMode;
  reviewedByRole?: string;
  /** Distilled practice-lens context: the child's Digital Twin read (via the
   * CPIE chokepoint — never raw records) + training rows for involved staff. */
  practiceLens?: {
    childTriggers?: string[];
    childWhatHelps?: string[];
    childPhrasesThatEscalate?: string[];
    childStrengths?: string[];
    staffTraining?: { staffName: string; course: string; status: string; mandatory?: boolean }[];
  };
}

function ageFromDob(dob: string | null | undefined, today: string): number | undefined {
  if (!dob) return undefined;
  const b = new Date(dob);
  const t = new Date(today);
  if (isNaN(b.getTime()) || isNaN(t.getTime())) return undefined;
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age >= 0 && age < 130 ? age : undefined;
}

function notificationToReferralKind(role: string, name: string): ReferralKind {
  const s = `${role} ${name}`.toLowerCase();
  if (/police|mash/.test(s)) return "police";
  if (/lado|designated officer/.test(s)) return "local_authority_designated_officer";
  if (/social worker/.test(s)) return "social_worker";
  if (/placing|local authority/.test(s)) return "placing_authority";
  if (/parent|carer|mother|father|person with pr/.test(s)) return "parent_or_person_with_pr";
  if (/ambulance|nhs|paramedic|hospital/.test(s)) return "health";
  if (/ofsted/.test(s)) return "Ofsted";
  if (/camhs/.test(s)) return "CAMHS";
  if (/health|gp|doctor|nurse/.test(s)) return "health";
  return "other";
}

/** Map a stored Incident (+ injected related records) into an OversightInput. */
export function incidentToOversightInput(incident: Incident, ctx: IncidentHydrationContext): OversightInput {
  const text = `${incident.description ?? ""} ${incident.immediate_action ?? ""}`.toLowerCase();
  const type = incident.type as string;
  const recordType = RECORD_TYPE_MAP[type] ?? "incident";
  const behaviourLed = recordType === "incident" || recordType === "physical_intervention";

  const yp = ctx.youngPerson;
  const childName = yp ? yp.preferred_name || yp.first_name : undefined;

  // ── safeguarding / risk signals ──────────────────────────────────────────
  const restraintUsed = type === "physical_intervention";
  const missingFromCare = type === "missing_from_care";
  const medicationError = type === "medication_error";
  const allegation = type === "allegation";
  const disclosure = /disclos/.test(text);
  const exploitationConcern =
    type === "exploitation_concern" || type === "contextual_safeguarding" || /exploit|county lines|carry items/.test(text);
  const selfHarmConcern = type === "self_harm" || /self-harm|self harm|harm (?:themselves|himself|herself)/.test(text);
  const injury = !!incident.body_map_required || /injur|bruise|wound|hurt/.test(text);
  const policeInvolved =
    type === "police_involvement" || (incident.notifications ?? []).some((n) => /police|mash/i.test(`${n.role} ${n.name}`));
  const emergencyServicesInvolved =
    type === "hospital_attendance" ||
    (incident.notifications ?? []).some((n) => /ambulance|999|nhs|paramedic/i.test(`${n.role} ${n.name} ${n.method}`));

  // ── recent context + pattern (from sibling incidents) ────────────────────
  const recent = (ctx.recentIncidents ?? []).filter((i) => i.id !== incident.id);
  const countType = (pred: (i: Incident) => boolean) => recent.filter(pred).length;
  const recentPhysicalInterventionsCount = countType((i) => i.type === "physical_intervention");
  const recentMissingEpisodesCount = countType((i) => i.type === "missing_from_care");
  const recentSafeguardingConcernsCount = countType((i) =>
    ["safeguarding_concern", "allegation", "exploitation_concern", "contextual_safeguarding"].includes(i.type as string),
  );
  const recentMedicationConcernsCount = countType((i) => i.type === "medication_error");
  const sameTypeRecent = countType((i) => i.type === incident.type);
  const repeatedPattern = sameTypeRecent >= 1; // at least one prior of the same type

  // ── referrals / notifications ────────────────────────────────────────────
  const referrals: ReferralOrNotification[] = (incident.notifications ?? []).map((n) => ({
    type: notificationToReferralKind(n.role, n.name),
    required: true,
    completed: !!n.notified_at,
    completedAt: n.notified_at ?? undefined,
    reason: n.acknowledged ? undefined : "Notification made; acknowledgement not yet confirmed.",
  }));

  // ── debriefs ─────────────────────────────────────────────────────────────
  const debriefs = ctx.debriefs ?? [];
  const childDebriefDone = debriefs.some((d) => !!d.child_perspective || /child/i.test(d.type ?? ""));
  const staffDebriefDone = debriefs.some((d) => (d.staff_involved?.length ?? 0) > 0 || /staff|post_incident/i.test(d.type ?? ""));
  const debriefRequired = restraintUsed || incident.severity === "high" || incident.severity === "critical";

  const oversightDone = !!incident.oversight_by;

  return {
    oversightMode: ctx.oversightMode ?? "both",
    recordType,
    childName,
    childAge: ageFromDob(yp?.date_of_birth, ctx.today),
    reviewedByRole: ctx.reviewedByRole ?? "registered_manager",
    recordDate: incident.date,
    summary: incident.description ?? undefined,
    // The full practice-intelligence lens: raw narrative for the contextual-
    // safeguarding scan + the twin/training distillation supplied by the route.
    practiceLensContext: {
      narrativeText: `${incident.description ?? ""} ${incident.immediate_action ?? ""}`.trim(),
      ...(ctx.practiceLens ?? {}),
    },
    existingRiskLevel: SEVERITIES.includes(incident.severity as RiskLevel) ? (incident.severity as RiskLevel) : undefined,

    // Evidence-quality flags — honestly derived from what the record actually
    // contains, so genuine recording gaps surface (false = not evidenced).
    chronologyClear: !!incident.description,
    staffActionsRecorded: !!incident.immediate_action,
    responsiblePersonRecorded: !!incident.reported_by,
    timescaleRecorded: !!(incident.date && incident.time),
    childVoiceCaptured:
      childDebriefDone || /\b(said|told|stated|expressed|felt|wanted|asked|disclosed|reported|voiced)\b/i.test(text),
    childPresentationRecorded: /calm|distress|agitat|settled|presented|mood|upset|anxious|withdrawn|tearful|angry|quiet|happy|cooperat/i.test(
      text,
    ),
    antecedentsIncluded: behaviourLed
      ? /following|after|when|became|trigger|escalat|led to|in response|prior to|build|leading up/i.test(text)
      : undefined,
    injuriesRecordedOrRuledOut: incident.body_map_required ? incident.body_map_completed : undefined,
    notificationsCompleted: (incident.notifications?.length ?? 0) > 0,
    outcomeRecorded: incident.status === "closed" ? !!incident.outcome : undefined,
    lessonsLearnedRecorded: !!incident.lessons_learned,
    managementActionRecorded: incident.requires_oversight ? !!incident.oversight_note : undefined,

    // risk / safeguarding signals
    restraintUsed: restraintUsed || undefined,
    missingFromCare: missingFromCare || undefined,
    medicationError: medicationError || undefined,
    allegation: allegation || undefined,
    disclosure: disclosure || undefined,
    exploitationConcern: exploitationConcern || undefined,
    selfHarmConcern: selfHarmConcern || undefined,
    injury: injury || undefined,
    policeInvolved: policeInvolved || undefined,
    emergencyServicesInvolved: emergencyServicesInvolved || undefined,
    repeatedPattern: repeatedPattern || undefined,

    childContext: yp
      ? {
          livedExperienceSummary: yp.risk_flags?.length ? `Known risk areas: ${yp.risk_flags.join(", ")}.` : undefined,
          importantPeople: [yp.social_worker_name].filter(Boolean) as string[],
          equalityIdentityNeeds: [yp.ethnicity, yp.religion].filter(Boolean) as string[],
        }
      : undefined,

    recentContext: recent.length
      ? {
          recentIncidentsCount: recent.length,
          recentPhysicalInterventionsCount,
          recentMissingEpisodesCount,
          recentSafeguardingConcernsCount,
          recentMedicationConcernsCount,
          timeframeDays: 90,
        }
      : undefined,

    patternContext: repeatedPattern
      ? {
          repeatedThemes: [`Repeated ${recordType.replace(/_/g, " ")} events`],
          patternConfidence: sameTypeRecent >= 2 ? "high" : "medium",
          patternDirection: "unknown",
        }
      : undefined,

    referralContext: referrals.length
      ? {
          referralsAndNotifications: referrals,
          referralsRequiredButNotCompleted: referrals.filter((r) => !r.completed),
        }
      : undefined,

    workflowCompletionContext: {
      workflowName: `${incident.reference ?? incident.id} follow-up`,
      workflowSteps: [
        { stepName: "Incident record completed", required: true, completed: !!incident.description },
        { stepName: "Manager oversight", required: !!incident.requires_oversight, completed: oversightDone },
      ],
      associatedPaperwork: incident.body_map_required
        ? [{ paperworkType: "body_map", required: true, status: incident.body_map_completed ? "complete" : "outstanding" }]
        : [],
      staffDebrief: debriefRequired
        ? { required: true, status: staffDebriefDone ? "required_completed" : "required_not_completed" }
        : undefined,
      childDebrief: debriefRequired
        ? { required: true, status: childDebriefDone ? "required_completed" : "required_not_completed" }
        : undefined,
      actionTrackerUpdated: (incident.linked_task_ids?.length ?? 0) > 0 ? true : undefined,
    },

    managementAccountabilityContext: {
      registeredManagerOversightCompleted: oversightDone,
      managementResponseStatus: oversightDone ? "appropriate" : undefined,
    },

    proportionalityAssessment: restraintUsed
      ? {
          // The record's own oversight note, if present, is taken as the manager's
          // proportionality judgement; otherwise this is left for review.
          leastRestrictiveOptionConsidered: oversightDone || undefined,
          interventionProportionate: oversightDone || undefined,
          dignityMaintained: oversightDone || undefined,
          rationaleRecorded: !!incident.immediate_action || undefined,
        }
      : undefined,
  };
}
