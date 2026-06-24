// ══════════════════════════════════════════════════════════════════════════════
// CARA HEART — AntiCriminalisationDecisionEngine (pure / deterministic)
//
// Supports proportionate decision-making before, during and after police
// contact. NEVER blocks safeguarding, emergency, or statutory action.
// Supports thoughtful, defensible decision-making and recording.
//
// Principle: children in residential care should not be criminalised for
// behaviour that would be handled within the family home. At the same time,
// immediate risk, serious harm, and statutory duty always override this principle.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraPracticeRecord,
  PoliceDecisionSupport,
  IntelligenceAuditEntry,
  ImmediateRisk,
} from "../types";

const ENGINE = "AntiCriminalisationDecisionEngine";

export const ANTI_CRIMINALISATION_DISCLAIMER =
  "Anti-criminalisation guidance supports proportionate, defensible decision-making. It never overrides emergency, safeguarding, or statutory notification requirements. Where there is immediate risk of harm, follow emergency procedures without delay.";

/** Checks where police contact IS clearly recommended regardless of anti-criminalisation principles. */
const MANDATORY_POLICE_CHECKS: Array<{
  ruleId: string;
  check: (r: CaraPracticeRecord) => boolean;
  reason: string;
}> = [
  {
    ruleId: "AC_WEAPON",
    check: (r) => !!r.weaponConcern,
    reason: "A weapon concern is recorded. Police involvement may be required for immediate safety.",
  },
  {
    ruleId: "AC_SEXUAL_HARM",
    check: (r) => !!r.sexualHarmConcern,
    reason: "A sexual harm concern is recorded. Police involvement may form part of the safeguarding response.",
  },
  {
    ruleId: "AC_EXPLOITATION",
    check: (r) => !!r.exploitationConcern,
    reason: "An exploitation concern is recorded. Police may need to be involved as part of the multi-agency response.",
  },
  {
    ruleId: "AC_FIRE",
    check: (r) => !!r.fireSettingConcern,
    reason: "Fire-setting concern is recorded. Emergency services and police may be required.",
  },
  {
    ruleId: "AC_CRITICAL_RISK",
    check: (r) => r.immediateRisk === "critical",
    reason: "Immediate risk is critical. Emergency services and police may be required for immediate safety.",
  },
];

/** Determines whether anti-criminalisation reflection is relevant for this record. */
function isRelevant(record: CaraPracticeRecord): boolean {
  return (
    !!record.policeCalled ||
    !!record.policeConsidered ||
    record.type === "police_contact" ||
    !!record.propertyDamage ||
    !!record.missingFromCare ||
    !!record.weaponConcern ||
    !!record.sexualHarmConcern ||
    !!record.exploitationConcern ||
    !!record.fireSettingConcern ||
    record.immediateRisk === "critical"
  );
}

// Whole-word, negation-aware mention check: stops "hit" firing inside "white",
// and stops "No damage"/"No assault" injecting damage/assault alternatives.
const ACR_NEGATION_RE = /\b(no|not|never|without|denied|denies|cannot|nobody|none)\b|n['’]t\b/;
function acrNegated(lower: string, idx: number): boolean {
  let p = lower.slice(Math.max(0, idx - 25), idx);
  const s = Math.max(
    p.lastIndexOf("."), p.lastIndexOf("!"), p.lastIndexOf("?"),
    p.lastIndexOf(";"), p.lastIndexOf(","),
  );
  if (s >= 0) p = p.slice(s + 1);
  return ACR_NEGATION_RE.test(p);
}
function mentions(lower: string, regexes: RegExp[]): boolean {
  for (const re of regexes) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower)) !== null) {
      if (!acrNegated(lower, m.index)) return true;
    }
  }
  return false;
}

/** Alternatives to police involvement (context-appropriate suggestions). */
function buildAlternatives(record: CaraPracticeRecord): string[] {
  const alternatives: string[] = [];
  const lower = [record.description, record.staffResponse ?? ""].join(" ").toLowerCase();

  if (mentions(lower, [/\bproperty/g, /\bdamage/g])) {
    alternatives.push("Restorative conversation with the young person about the damage and repair");
    alternatives.push("Practical repair of the damage with the young person's involvement where safe");
    alternatives.push("Review whether the damage was linked to dysregulation that could be better supported");
  }

  if (record.missingFromCare) {
    alternatives.push("Complete the return home interview to understand the missing episode");
    alternatives.push("Review the missing from care plan and consider whether it needs updating");
    alternatives.push("Ensure the social worker and placing authority are notified");
  }

  if (mentions(lower, [/\bassault/g, /\bfight/g, /\bhit/g])) {
    alternatives.push("Ensure the safety of all involved before any further action");
    alternatives.push("Consult the manager and social worker before involving police for minor assaults");
    alternatives.push("Consider whether a peer restorative process is appropriate once all parties are safe");
  }

  if (alternatives.length === 0) {
    alternatives.push("Consultation with the registered manager before making the decision");
    alternatives.push("Contact with the social worker to agree the response");
    alternatives.push("Consideration of whether a restorative approach could address the situation");
  }

  return alternatives;
}

/** Restorative options (available once immediate safety is assured). */
function buildRestorativeOptions(record: CaraPracticeRecord): string[] {
  const options: string[] = [
    "A restorative conversation with the young person once they are regulated",
    "A key work session to explore what was happening for the young person and what support they need",
  ];

  if (record.propertyDamage) {
    options.push("Practical involvement of the young person in repairing or replacing what was damaged");
  }

  if (record.missingFromCare) {
    options.push(
      "A return home interview to understand the missing episode and what the young person needs to feel safe in the home",
    );
  }

  if (record.policeCalled) {
    options.push(
      "A de-brief conversation with the young person about the police involvement and how they felt about it",
    );
    options.push("Recording the young person's view about the police involvement in the record");
  }

  return options;
}

// ── Main engine function ──────────────────────────────────────────────────────

export interface AntiCriminalisationResult {
  review: PoliceDecisionSupport;
  audit: IntelligenceAuditEntry[];
}

export function runAntiCriminalisationEngine(
  record: CaraPracticeRecord,
  now: string = new Date().toISOString(),
): AntiCriminalisationResult {
  const audit: IntelligenceAuditEntry[] = [];

  if (!isRelevant(record)) {
    audit.push({
      ruleId: "AC_NOT_RELEVANT",
      engine: ENGINE,
      triggered: false,
      reason: "Record does not involve police contact or consideration — engine not activated.",
      severity: "info",
      timestamp: now,
    });
    return {
      review: {
        immediateRiskLevel: record.immediateRisk ?? "none",
        policeContactRecommended: false,
        alternativesConsidered: [],
        restorativeOptions: [],
        managerConsultationRequired: false,
        socialWorkerNotificationRequired: false,
        recordRationaleRequired: false,
      },
      audit,
    };
  }

  // ── Check mandatory police flags ──────────────────────────────────────────
  const mandatoryReasons: string[] = [];
  for (const check of MANDATORY_POLICE_CHECKS) {
    if (check.check(record)) {
      mandatoryReasons.push(check.reason);
      audit.push({
        ruleId: check.ruleId,
        engine: ENGINE,
        triggered: true,
        reason: check.reason,
        severity: "urgent",
        timestamp: now,
      });
    }
  }

  const policeRecommended = mandatoryReasons.length > 0;

  // ── Anti-criminalisation warning ──────────────────────────────────────────
  let acWarning: string | undefined;
  if (!policeRecommended && record.policeCalled) {
    acWarning =
      "Police contact was recorded. To support defensible anti-criminalisation practice, add the immediate risk level, your rationale for involving police, alternatives that were considered, and whether the manager was consulted.";

    audit.push({
      ruleId: "AC_POLICE_CALLED_REVIEW",
      engine: ENGINE,
      triggered: true,
      reason:
        "Police contact recorded without mandatory risk indicators. Anti-criminalisation rationale prompt applied.",
      severity: "warning",
      timestamp: now,
    });
  }

  if (!policeRecommended && record.policeConsidered && !record.policeCalled) {
    acWarning =
      "Police contact was considered but not pursued. Record the rationale for this decision, how safety was managed, and what alternative or restorative response was used. This supports a defensible record.";

    audit.push({
      ruleId: "AC_POLICE_CONSIDERED_NOT_CALLED",
      engine: ENGINE,
      triggered: true,
      reason: "Police was considered but not called. Prompt for rationale recording.",
      severity: "prompt",
      timestamp: now,
    });
  }

  // ── Manager and social worker notification ────────────────────────────────
  const managerRequired =
    !!record.policeCalled || !!record.policeConsidered || (record.immediateRisk ?? "none") !== "none";

  const swRequired =
    !!record.policeCalled ||
    !!record.exploitationConcern ||
    !!record.sexualHarmConcern ||
    !!record.missingFromCare;

  audit.push({
    ruleId: "AC_MANAGER_CONSULT",
    engine: ENGINE,
    triggered: managerRequired && !record.managerConsulted,
    reason: managerRequired
      ? record.managerConsulted
        ? "Manager consultation is recorded."
        : "Manager consultation required for police-related records."
      : "Manager consultation not required.",
    severity: managerRequired && !record.managerConsulted ? "warning" : "info",
    timestamp: now,
  });

  audit.push({
    ruleId: "AC_SW_NOTIFICATION",
    engine: ENGINE,
    triggered: swRequired && !record.socialWorkerNotified,
    reason: swRequired
      ? record.socialWorkerNotified
        ? "Social worker notification is recorded."
        : "Social worker notification required for this record type."
      : "Social worker notification not required.",
    severity: swRequired && !record.socialWorkerNotified ? "warning" : "info",
    timestamp: now,
  });

  return {
    review: {
      immediateRiskLevel: record.immediateRisk ?? "none",
      policeContactRecommended: policeRecommended,
      policeContactReason:
        policeRecommended
          ? `Police involvement may be required: ${mandatoryReasons.join("; ")}`
          : undefined,
      alternativesConsidered: buildAlternatives(record),
      restorativeOptions: buildRestorativeOptions(record),
      managerConsultationRequired: managerRequired,
      socialWorkerNotificationRequired: swRequired,
      recordRationaleRequired: !!record.policeCalled || !!record.policeConsidered,
      antiCriminalisationWarning: acWarning,
      safeguardingOverride:
        policeRecommended
          ? "Immediate safeguarding action may be required. Follow the home's safeguarding procedures, emergency protocols, and statutory notification requirements without delay."
          : undefined,
    },
    audit,
  };
}
