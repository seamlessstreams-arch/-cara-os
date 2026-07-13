// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 32 DEPLOYMENT-SUITABILITY ENGINE (Phase 4 · Workforce · Module 1)
//
// The audit's confirmed Workforce gap: Cara has a mature per-staff compliance
// verdict (computeStaffCompliance), a Reg 32/33 fitness gate, agency vetting, and
// a separate rota/cover layer — but NOTHING joins a staff member's suitability to
// their actual shift deployment. A suspended / DBS-overdue / training-expired
// person on the rota is silently treated as available.
//
// This is the bridge: given the rota assignments, the staff records, and the
// ALREADY-COMPUTED compliance verdicts, it projects — per assigned shift —
// whether that person is fit to be deployed. Pure + read-only: it reuses existing
// engine output, invents nothing, and changes no record. DETECT / ADVISE ONLY —
// it never edits the rota; a manager decides.
//
// Honesty rule (deliberately conservative, mirroring the emergency-followups
// engine): the engine only says "must NOT deploy" when the data is unambiguous —
// employment suspended / left / inactive. Genuine Reg 32 compliance gaps (expired
// mandatory training, DBS overdue for renewal) are "deploy with attention": real,
// surfaced, named — but a judgement for the manager, not an automatic bar.
// Developmental gaps (overdue supervision/appraisal) are NOT deployment concerns.
// ══════════════════════════════════════════════════════════════════════════════

/** A rota assignment (one Shift row = one staff assignment). */
export interface Reg32Shift {
  id: string;
  staff_id: string;
  date: string; // YYYY-MM-DD
  shift_type: string;
  home_id: string;
  is_open_shift?: boolean;
  status?: string;
}

/** The staff facts the engine gates on directly (employment is not on the
 *  compliance row, so it is read straight off the staff record). */
export interface Reg32Staff {
  id: string;
  full_name: string;
  role: string;
  home_id: string;
  employment_status?: string; // active | probation | suspended | notice_period | left | ...
  is_active?: boolean;
}

/** The compliance engine's per-staff verdict, distilled to what deployment
 *  cares about. The route maps StaffComplianceRow → this; the engine stays
 *  decoupled and independently testable. */
export interface ComplianceVerdictLite {
  staff_id: string;
  level: "critical" | "attention" | "compliant";
  /** Deployment-relevant reasons only (expired mandatory training, DBS overdue).
   *  Purely developmental items (supervision/appraisal) are excluded upstream. */
  deployment_reasons: string[];
}

export type Suitability = "suitable" | "deploy_with_attention" | "unsuitable";

export interface ShiftSuitability {
  shift_id: string;
  staff_id: string;
  staff_name: string;
  role: string;
  date: string;
  shift_type: string;
  home_id: string;
  suitability: Suitability;
  /** Source-attributed, human-readable — never asserts more than the data shows. */
  reasons: string[];
}

export interface Reg32DeploymentBoard {
  from_date: string;
  to_date: string;
  /** Assigned shifts assessed in the window. */
  assessed: number;
  /** Open/unfilled shifts in the window (no person to assess). */
  unassigned: number;
  summary: { unsuitable: number; deploy_with_attention: number; suitable: number };
  /** Worst-first, then by date. */
  shifts: ShiftSuitability[];
}

const HARD_BARS: Record<string, string> = {
  suspended: "Suspended from duty — must not be deployed",
  left: "No longer employed — remove from the rota",
  leaver: "No longer employed — remove from the rota",
  dismissed: "No longer employed — remove from the rota",
  terminated: "No longer employed — remove from the rota",
};

const RANK: Record<Suitability, number> = { unsuitable: 0, deploy_with_attention: 1, suitable: 2 };

function isAssigned(s: Reg32Shift): boolean {
  return (
    !!s.staff_id &&
    s.is_open_shift !== true &&
    s.status !== "cancelled" &&
    s.status !== "no_show"
  );
}

/**
 * Project deployment suitability across the rota window. Pure.
 * @param fromDate/toDate inclusive YYYY-MM-DD bounds (the caller picks the window).
 */
export function computeDeploymentSuitability(input: {
  shifts: readonly Reg32Shift[];
  staff: readonly Reg32Staff[];
  compliance: readonly ComplianceVerdictLite[];
  fromDate: string;
  toDate: string;
}): Reg32DeploymentBoard {
  const from = input.fromDate.slice(0, 10);
  const to = input.toDate.slice(0, 10);
  const staffById = new Map(input.staff.map((s) => [s.id, s]));
  const verdictById = new Map(input.compliance.map((c) => [c.staff_id, c]));

  const inWindow = input.shifts.filter((s) => {
    const d = s.date.slice(0, 10);
    return d >= from && d <= to;
  });

  const unassigned = inWindow.filter((s) => !isAssigned(s)).length;

  const shifts: ShiftSuitability[] = inWindow
    .filter(isAssigned)
    .map((shift) => {
      const staff = staffById.get(shift.staff_id);
      const base = {
        shift_id: shift.id,
        staff_id: shift.staff_id,
        date: shift.date.slice(0, 10),
        shift_type: shift.shift_type,
        home_id: shift.home_id,
      };

      // Assigned to a staff_id with no matching record — a data gap, not a clean bill.
      if (!staff) {
        return {
          ...base,
          staff_name: shift.staff_id,
          role: "",
          suitability: "deploy_with_attention" as Suitability,
          reasons: ["Assigned staff record not found — verify who is rostered"],
        };
      }

      const reasons: string[] = [];
      let suitability: Suitability = "suitable";

      // 1) Hard employment bars — unambiguous "must not deploy".
      const status = (staff.employment_status ?? "").toLowerCase();
      const inactive = staff.is_active === false;
      if (HARD_BARS[status]) {
        suitability = "unsuitable";
        reasons.push(HARD_BARS[status]);
      } else if (inactive) {
        suitability = "unsuitable";
        reasons.push("Marked inactive — must not be deployed");
      }

      // 2) Reg 32 compliance gaps — real, named, but a manager's judgement.
      const verdict = verdictById.get(shift.staff_id);
      if (
        suitability !== "unsuitable" &&
        verdict &&
        (verdict.level === "critical" || verdict.deployment_reasons.length > 0)
      ) {
        suitability = "deploy_with_attention";
        reasons.push(
          ...(verdict.deployment_reasons.length > 0
            ? verdict.deployment_reasons
            : ["Critical compliance gap on record"]),
        );
      }

      if (reasons.length === 0) reasons.push("No deployment blockers on record");

      return { ...base, staff_name: staff.full_name, role: staff.role, suitability, reasons };
    })
    .sort((a, b) => RANK[a.suitability] - RANK[b.suitability] || a.date.localeCompare(b.date));

  return {
    from_date: from,
    to_date: to,
    assessed: shifts.length,
    unassigned,
    summary: {
      unsuitable: shifts.filter((s) => s.suitability === "unsuitable").length,
      deploy_with_attention: shifts.filter((s) => s.suitability === "deploy_with_attention").length,
      suitable: shifts.filter((s) => s.suitability === "suitable").length,
    },
    shifts,
  };
}

/**
 * Distil a compliance row into the deployment-relevant reasons only. Kept here so
 * the route and tests share one honest mapping. Supervision/appraisal are
 * deliberately excluded — they are not deployment bars.
 */
export function deploymentReasonsFromCompliance(row: {
  training?: { expired?: number; outstanding?: number; expired_courses?: string[] };
  dbs?: { due_for_renewal?: boolean; on_update_service?: boolean };
}): string[] {
  const out: string[] = [];
  const expired = row.training?.expired ?? 0;
  if (expired > 0) {
    const courses = (row.training?.expired_courses ?? []).filter(Boolean);
    out.push(
      courses.length > 0
        ? `Mandatory training expired: ${courses.join(", ")}`
        : `${expired} mandatory training expired`,
    );
  }
  if (row.dbs?.due_for_renewal && !row.dbs?.on_update_service) {
    out.push("Enhanced DBS overdue for renewal (Reg 32)");
  }
  return out;
}
