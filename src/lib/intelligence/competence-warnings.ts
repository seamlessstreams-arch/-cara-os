// ══════════════════════════════════════════════════════════════════════════════
// STAFF COMPETENCE WARNING ENGINE
//
// Deterministic checks against the staff competence passport. Flags
// restrictions, expired items, and competencies that prevent certain duties.
// ══════════════════════════════════════════════════════════════════════════════

import type { StaffCompetenceRecord, CompetenceWarning, Urgency } from "@/types/intelligence.layer";

export function getCompetenceWarnings(record: StaffCompetenceRecord): CompetenceWarning[] {
  const warnings: CompetenceWarning[] = [];
  const now = new Date();
  const daysSince = (dateStr?: string) => {
    if (!dateStr) return Infinity;
    return Math.floor((now.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  };

  // Shift lead
  if (!record.canLeadShift) {
    const reasons: string[] = [];
    if (!record.saferRecruitmentComplete) reasons.push("safer recruitment incomplete");
    if (!record.inductionComplete) reasons.push("induction not complete");
    if (!record.mandatoryTrainingComplete) reasons.push("mandatory training gaps");
    if (record.probationStatus === "in_progress" || record.probationStatus === "not_started") reasons.push("still in probation");
    warnings.push({
      type: "cannot_lead_shift",
      severity: "high",
      title: "Cannot lead shift",
      detail: reasons.length > 0
        ? `This staff member cannot lead a shift: ${reasons.join(", ")}.`
        : "This staff member is not approved to lead shifts.",
    });
  }

  // Medication
  if (!record.canAdministerMedication && record.medicationCompetency === false) {
    warnings.push({
      type: "cannot_administer_medication",
      severity: "high",
      title: "Cannot administer medication",
      detail: "Medication competency not completed. This staff member must not administer medication.",
    });
  }

  // Lone working
  if (!record.canLoneWork) {
    warnings.push({
      type: "cannot_lone_work",
      severity: "medium",
      title: "Cannot lone work",
      detail: "This staff member is not approved for lone working.",
    });
  }

  // DBS
  if (record.dbsStatus === "expired") {
    warnings.push({
      type: "dbs_expired",
      severity: "critical",
      title: "DBS check expired",
      detail: "Enhanced DBS check has expired. This must be renewed immediately. The staff member should not work unsupervised until renewed.",
    });
  } else if (record.dbsStatus === "due_renewal") {
    warnings.push({
      type: "dbs_due_renewal",
      severity: "high",
      title: "DBS renewal due",
      detail: "Enhanced DBS check is due for renewal. Arrange renewal before it expires.",
    });
  }

  // Supervision overdue
  const supervisionDays = daysSince(record.lastSupervisionDate);
  const maxSupervisionDays = record.supervisionFrequencyWeeks * 7;
  if (supervisionDays > maxSupervisionDays) {
    const severity: Urgency = supervisionDays > maxSupervisionDays * 2 ? "high" : "medium";
    warnings.push({
      type: "supervision_overdue",
      severity,
      title: "Supervision overdue",
      detail: record.lastSupervisionDate
        ? `Last supervision was ${supervisionDays} days ago (due every ${record.supervisionFrequencyWeeks} weeks).`
        : "No supervision date recorded.",
    });
  }

  // Training
  if (!record.mandatoryTrainingComplete) {
    warnings.push({
      type: "training_expired",
      severity: "high",
      title: "Mandatory training incomplete",
      detail: "One or more mandatory training courses are not complete. Check the training matrix.",
    });
  }

  // Safeguarding training
  if (record.safeguardingTrainingDate) {
    const days = daysSince(record.safeguardingTrainingDate);
    if (days > 365) {
      warnings.push({
        type: "training_expired",
        severity: "high",
        title: "Safeguarding training overdue for refresher",
        detail: `Last safeguarding training was ${days} days ago. Annual refresher recommended.`,
      });
    }
  }

  // Probation review overdue
  if (record.probationStatus === "in_progress" && record.probationEndDate) {
    if (new Date(record.probationEndDate) < now) {
      warnings.push({
        type: "probation_review_overdue",
        severity: "high",
        title: "Probation review overdue",
        detail: "Probation end date has passed without a recorded outcome. Complete the probation review.",
      });
    }
  }

  // Induction
  if (!record.inductionComplete) {
    warnings.push({
      type: "induction_incomplete",
      severity: "medium",
      title: "Induction not complete",
      detail: "Staff induction has not been completed. Complete all induction requirements.",
    });
  }

  // Active restrictions
  if (record.restrictions.length > 0) {
    for (const restriction of record.restrictions) {
      warnings.push({
        type: "restriction_active",
        severity: "high",
        title: "Active restriction",
        detail: restriction,
      });
    }
  }

  return warnings;
}
