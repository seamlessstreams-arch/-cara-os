// ══════════════════════════════════════════════════════════════════════════════
// Cara — SHIFT SAFETY CHECKER
//
// Analyses current shift context and identifies safety concerns before
// they become incidents. Pure deterministic function — no AI calls.
//
// Checks:
//   - Staff:child ratio compliance (CHR 2015 Reg 22 / Standard 15.4)
//   - Lone working risks
//   - Staff qualifications vs child needs (medications, restraint-trained)
//   - Known triggers in the upcoming period (contact, transitions)
//   - Handover completeness
//   - Environmental checks overdue
//   - Emergency preparedness gaps
//
// Output: prioritised list of safety signals with regulatory references.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export interface ShiftContext {
  homeId: string;
  shiftType: "day" | "evening" | "waking_night" | "sleep_in";
  staffOnDuty: StaffMember[];
  childrenPresent: ChildPresence[];
  scheduledEvents: ScheduledEvent[];
  lastHandoverComplete: boolean;
  lastFireDrill?: string;         // ISO date
  lastEnvironmentCheck?: string;  // ISO date
  medicationsToAdminister: MedicationDue[];
  openRisks: OpenRisk[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: "senior" | "residential" | "agency" | "sleep_in";
  qualifications: string[];       // e.g. ["medication", "restraint", "first_aid", "senior_on_duty"]
  hoursWorkedToday: number;
  isKeyWorkerFor?: string[];      // child IDs
}

export interface ChildPresence {
  id: string;
  name: string;
  riskLevel: "high" | "medium" | "low";
  needsPresent: string[];         // e.g. ["medication", "1:1", "bed_routine_support"]
  hasScheduledContact: boolean;
  behaviourSupportPlanActive: boolean;
  knownTriggers?: string[];
}

export interface ScheduledEvent {
  time: string;                   // HH:MM
  type: "family_contact" | "professional_visit" | "activity" | "appointment" | "transition" | "medication";
  childId?: string;
  description: string;
  requiresStaff?: number;
}

export interface MedicationDue {
  childId: string;
  childName: string;
  medicationName: string;
  dueTime: string;               // HH:MM
  requiresTrainedStaff: boolean;
  isControlled: boolean;
}

export interface OpenRisk {
  id: string;
  childId: string;
  category: string;
  level: "high" | "medium" | "low";
  description: string;
  mitigations: string[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface SafetySignal {
  id: string;
  severity: "critical" | "high" | "medium" | "advisory";
  category: SafetyCategory;
  title: string;
  description: string;
  regulation?: string;
  action: string;
  affectsChildren?: string[];
}

export type SafetyCategory =
  | "staffing"
  | "lone_working"
  | "medication"
  | "qualifications"
  | "triggers"
  | "handover"
  | "environment"
  | "emergency"
  | "workload";

export interface ShiftSafetyResult {
  shiftType: string;
  checkedAt: string;
  overallRisk: "safe" | "concerns" | "unsafe";
  signals: SafetySignal[];
  staffChildRatio: string;
  compliance: { met: number; total: number };
  summary: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

// Minimum ratios per shift type (staff:children)
const MIN_RATIOS: Record<string, { ratio: number; minStaff: number }> = {
  day: { ratio: 0.5, minStaff: 2 },          // 1 staff per 2 children, min 2
  evening: { ratio: 0.5, minStaff: 2 },      // 1 staff per 2 children, min 2
  waking_night: { ratio: 0.33, minStaff: 1 }, // 1 staff per 3 children, min 1
  sleep_in: { ratio: 0.25, minStaff: 1 },    // 1 staff per 4 children, min 1
};

const MAX_HOURS_WITHOUT_BREAK = 10;
const FIRE_DRILL_MAX_DAYS = 28;
const ENVIRONMENT_CHECK_MAX_DAYS = 7;

// ── Checker ─────────────────────────────────────────────────────────────────

export function checkShiftSafety(ctx: ShiftContext): ShiftSafetyResult {
  const signals: SafetySignal[] = [];
  let complianceChecks = 0;
  let complianceMet = 0;

  // ─── 1. Staffing ratio ────────────────────────────────────────────────────
  complianceChecks++;
  const ratioReq = MIN_RATIOS[ctx.shiftType] ?? MIN_RATIOS.day;
  const staffCount = ctx.staffOnDuty.length;
  const childCount = ctx.childrenPresent.length;
  const actualRatio = childCount > 0 ? staffCount / childCount : 1;

  if (staffCount < ratioReq.minStaff) {
    signals.push({
      id: "staffing_below_minimum",
      severity: "critical",
      category: "staffing",
      title: "Below minimum staffing level",
      description: `${staffCount} staff on duty — minimum is ${ratioReq.minStaff} for a ${ctx.shiftType.replace("_", " ")} shift.`,
      regulation: "CHR 2015 Reg 22 (Staffing)",
      action: "Contact on-call manager immediately to arrange additional cover",
    });
  } else if (actualRatio < ratioReq.ratio) {
    signals.push({
      id: "staffing_ratio_low",
      severity: "high",
      category: "staffing",
      title: "Staff:child ratio below safe level",
      description: `Current ratio is 1:${Math.round(1 / actualRatio)} — should be at least 1:${Math.round(1 / ratioReq.ratio)} for this shift type.`,
      regulation: "CHR 2015 Reg 22 / Staffing Schedule",
      action: "Assess whether additional staff can be brought in or activities adjusted",
    });
  } else {
    complianceMet++;
  }

  // ─── 2. Lone working ─────────────────────────────────────────────────────
  complianceChecks++;
  if (staffCount === 1 && childCount > 0) {
    const highRiskChildren = ctx.childrenPresent.filter((c) => c.riskLevel === "high");
    if (highRiskChildren.length > 0) {
      signals.push({
        id: "lone_working_high_risk",
        severity: "critical",
        category: "lone_working",
        title: "Lone working with high-risk young person",
        description: `Single staff member on duty with ${highRiskChildren.length} high-risk young person(s): ${highRiskChildren.map((c) => c.name).join(", ")}.`,
        regulation: "CHR 2015 Reg 13(2) / Lone Working Policy",
        action: "Arrange second staff member immediately. If not possible, contact on-call manager and log decision",
        affectsChildren: highRiskChildren.map((c) => c.id),
      });
    } else {
      signals.push({
        id: "lone_working",
        severity: "medium",
        category: "lone_working",
        title: "Lone working",
        description: "Single staff member on duty. Ensure lone working protocol is followed.",
        regulation: "Lone Working Policy",
        action: "Confirm phone charged, doors secured, check-in times agreed with on-call",
      });
    }
  } else {
    complianceMet++;
  }

  // ─── 3. Senior cover ──────────────────────────────────────────────────────
  complianceChecks++;
  const hasSenior = ctx.staffOnDuty.some(
    (s) => s.role === "senior" || s.qualifications.includes("senior_on_duty")
  );
  if (!hasSenior && ctx.shiftType !== "sleep_in") {
    signals.push({
      id: "no_senior_cover",
      severity: "medium",
      category: "qualifications",
      title: "No senior staff on shift",
      description: "No senior or designated senior-on-duty staff member present.",
      regulation: "CHR 2015 Reg 13 (Leadership)",
      action: "Confirm who holds senior responsibility. Update on-call manager",
    });
  } else {
    complianceMet++;
  }

  // ─── 4. Medication competence ─────────────────────────────────────────────
  if (ctx.medicationsToAdminister.length > 0) {
    complianceChecks++;
    const medTrainedStaff = ctx.staffOnDuty.filter((s) =>
      s.qualifications.includes("medication")
    );

    if (medTrainedStaff.length === 0) {
      signals.push({
        id: "no_medication_trained",
        severity: "critical",
        category: "medication",
        title: "No medication-trained staff on duty",
        description: `${ctx.medicationsToAdminister.length} medication(s) due this shift but no trained administrator present.`,
        regulation: "CHR 2015 Reg 23 (Health) / Medication Policy",
        action: "Contact manager immediately. Do NOT administer medication without training",
        affectsChildren: [...new Set(ctx.medicationsToAdminister.map((m) => m.childId))],
      });
    } else {
      complianceMet++;
    }

    // Controlled drugs need two people
    const controlled = ctx.medicationsToAdminister.filter((m) => m.isControlled);
    if (controlled.length > 0) {
      complianceChecks++;
      if (medTrainedStaff.length < 2) {
        signals.push({
          id: "controlled_drug_witness",
          severity: "high",
          category: "medication",
          title: "Controlled drug — no second witness available",
          description: `Controlled medication due (${controlled.map((m) => m.medicationName).join(", ")}) but fewer than 2 trained staff to witness.`,
          regulation: "Controlled Drugs Policy / Misuse of Drugs Regulations 2001",
          action: "Arrange second trained person or contact pharmacist for guidance",
        });
      } else {
        complianceMet++;
      }
    }
  }

  // ─── 5. Restraint-trained staff vs BSP children ───────────────────────────
  const bspChildren = ctx.childrenPresent.filter((c) => c.behaviourSupportPlanActive);
  if (bspChildren.length > 0) {
    complianceChecks++;
    const restraintTrained = ctx.staffOnDuty.filter((s) =>
      s.qualifications.includes("restraint")
    );
    if (restraintTrained.length === 0) {
      signals.push({
        id: "no_restraint_trained",
        severity: "high",
        category: "qualifications",
        title: "No restraint-trained staff on shift",
        description: `${bspChildren.length} young person(s) with active behaviour support plans but no restraint-trained staff present.`,
        regulation: "CHR 2015 Reg 35 (Behaviour Management)",
        action: "Assess risk. Prioritise de-escalation. Contact on-call if escalation occurs",
        affectsChildren: bspChildren.map((c) => c.id),
      });
    } else {
      complianceMet++;
    }
  }

  // ─── 6. First aid cover ───────────────────────────────────────────────────
  complianceChecks++;
  const firstAidTrained = ctx.staffOnDuty.filter((s) =>
    s.qualifications.includes("first_aid")
  );
  if (firstAidTrained.length === 0) {
    signals.push({
      id: "no_first_aid",
      severity: "medium",
      category: "qualifications",
      title: "No first-aid trained staff on shift",
      description: "No staff with current first aid certificate on duty.",
      regulation: "Health and Safety at Work Act / CHR 2015 Reg 23",
      action: "Ensure emergency services number accessible. Log gap in shift record",
    });
  } else {
    complianceMet++;
  }

  // ─── 7. Known triggers in upcoming events ─────────────────────────────────
  const contactEvents = ctx.scheduledEvents.filter((e) => e.type === "family_contact");
  for (const event of contactEvents) {
    if (event.childId) {
      const child = ctx.childrenPresent.find((c) => c.id === event.childId);
      if (child && child.knownTriggers?.some((t) => t.toLowerCase().includes("contact"))) {
        signals.push({
          id: `trigger_contact_${event.childId}`,
          severity: "medium",
          category: "triggers",
          title: `Family contact — known trigger for ${child.name}`,
          description: `${child.name} has family contact scheduled at ${event.time}. Contact is a known trigger.`,
          action: "Review BSP. Plan pre/post-contact support. Ensure familiar staff available",
          affectsChildren: [child.id],
        });
      }
    }
  }

  // ─── 8. Handover completeness ─────────────────────────────────────────────
  complianceChecks++;
  if (!ctx.lastHandoverComplete) {
    signals.push({
      id: "handover_incomplete",
      severity: "medium",
      category: "handover",
      title: "Handover not completed",
      description: "Previous shift handover has not been marked as complete. Critical information may have been missed.",
      regulation: "CHR 2015 Reg 36 (Records)",
      action: "Read handover notes immediately. Contact previous shift lead if gaps identified",
    });
  } else {
    complianceMet++;
  }

  // ─── 9. Fire drill overdue ────────────────────────────────────────────────
  complianceChecks++;
  if (ctx.lastFireDrill) {
    const daysSince = Math.round((Date.now() - new Date(ctx.lastFireDrill).getTime()) / 86400000);
    if (daysSince > FIRE_DRILL_MAX_DAYS) {
      signals.push({
        id: "fire_drill_overdue",
        severity: "medium",
        category: "emergency",
        title: "Fire drill overdue",
        description: `Last fire drill was ${daysSince} days ago (maximum interval: ${FIRE_DRILL_MAX_DAYS} days).`,
        regulation: "Regulatory Reform (Fire Safety) Order 2005 / Reg 25",
        action: "Schedule fire drill this shift or next. Log delay reason",
      });
    } else {
      complianceMet++;
    }
  } else {
    signals.push({
      id: "fire_drill_no_record",
      severity: "high",
      category: "emergency",
      title: "No fire drill record found",
      description: "No record of a fire drill on file. This may be a recording gap or a genuine omission.",
      regulation: "Regulatory Reform (Fire Safety) Order 2005",
      action: "Check fire drill log. If not conducted within 28 days, schedule immediately",
    });
  }

  // ─── 10. Environment check overdue ────────────────────────────────────────
  complianceChecks++;
  if (ctx.lastEnvironmentCheck) {
    const daysSince = Math.round((Date.now() - new Date(ctx.lastEnvironmentCheck).getTime()) / 86400000);
    if (daysSince > ENVIRONMENT_CHECK_MAX_DAYS) {
      signals.push({
        id: "environment_check_overdue",
        severity: "advisory",
        category: "environment",
        title: "Environment safety check overdue",
        description: `Last check was ${daysSince} days ago (recommended weekly).`,
        action: "Complete environment check during this shift",
      });
    } else {
      complianceMet++;
    }
  }

  // ─── 11. Staff fatigue ────────────────────────────────────────────────────
  const fatiguedStaff = ctx.staffOnDuty.filter((s) => s.hoursWorkedToday >= MAX_HOURS_WITHOUT_BREAK);
  if (fatiguedStaff.length > 0) {
    signals.push({
      id: "staff_fatigue",
      severity: "medium",
      category: "workload",
      title: "Staff fatigue risk",
      description: `${fatiguedStaff.map((s) => s.name).join(", ")} ha${fatiguedStaff.length > 1 ? "ve" : "s"} been on duty ${fatiguedStaff[0].hoursWorkedToday}+ hours without adequate break.`,
      regulation: "Working Time Regulations 1998 / CHR 2015 Reg 22",
      action: "Arrange break cover or shift swap. Document in shift record",
    });
  }

  // ─── 12. High-risk children needing 1:1 ──────────────────────────────────
  const needs1to1 = ctx.childrenPresent.filter((c) => c.needsPresent.includes("1:1"));
  if (needs1to1.length > 0 && staffCount <= needs1to1.length) {
    signals.push({
      id: "insufficient_for_1to1",
      severity: "high",
      category: "staffing",
      title: "Insufficient staff for 1:1 support",
      description: `${needs1to1.length} young person(s) require 1:1 support but only ${staffCount} staff on duty (also need to cover other children).`,
      regulation: "Placement Plan / CHR 2015 Reg 14",
      action: "Request additional staff. If not possible, risk-assess and log decision",
      affectsChildren: needs1to1.map((c) => c.id),
    });
  }

  // ─── Calculate overall risk ───────────────────────────────────────────────
  const criticalCount = signals.filter((s) => s.severity === "critical").length;
  const highCount = signals.filter((s) => s.severity === "high").length;

  let overallRisk: ShiftSafetyResult["overallRisk"];
  if (criticalCount > 0) overallRisk = "unsafe";
  else if (highCount > 0) overallRisk = "concerns";
  else overallRisk = "safe";

  // ─── Build summary ────────────────────────────────────────────────────────
  const parts: string[] = [];
  if (criticalCount > 0) parts.push(`${criticalCount} critical issue${criticalCount > 1 ? "s" : ""} requiring immediate action.`);
  if (highCount > 0) parts.push(`${highCount} high-priority concern${highCount > 1 ? "s" : ""}.`);
  const mediumCount = signals.filter((s) => s.severity === "medium").length;
  if (mediumCount > 0) parts.push(`${mediumCount} item${mediumCount > 1 ? "s" : ""} to monitor.`);
  if (signals.length === 0) parts.push("All safety checks passed. Shift is fully compliant.");

  return {
    shiftType: ctx.shiftType,
    checkedAt: new Date().toISOString(),
    overallRisk,
    signals: signals.sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity)),
    staffChildRatio: `${staffCount}:${childCount}`,
    compliance: { met: complianceMet, total: complianceChecks },
    summary: parts.join(" "),
  };
}

function severityOrder(s: SafetySignal["severity"]): number {
  switch (s) {
    case "critical": return 0;
    case "high": return 1;
    case "medium": return 2;
    case "advisory": return 3;
  }
}
