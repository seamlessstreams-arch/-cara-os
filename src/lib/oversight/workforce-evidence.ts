// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Workforce Evidence Pack (Phase 8)
//
// Assembles the oversight summary into an audit-ready, inspector-facing document
// (sections + Reg alignment + the guarantees the engine upholds). Pure — surfaces
// existing records only.
// ══════════════════════════════════════════════════════════════════════════════

import { buildWorkforceOversight, type WorkforceOversightInput, type WorkforceOversight } from "./workforce-oversight";

export interface EvidenceSection {
  key: string;
  title: string;
  /** Children's Homes Regulations 2015 alignment (informative). */
  reg_alignment: string[];
  narrative: string;
  metrics: Record<string, number | string>;
  record_count: number;
}

export interface WorkforceEvidencePack {
  home_id: string;
  generated_at: string;
  period_days: number;
  title: string;
  summary: WorkforceOversight;
  sections: EvidenceSection[];
  /** Plain-English statements of what the engine guarantees (for inspectors). */
  guarantees: string[];
}

export function buildWorkforceEvidencePack(input: WorkforceOversightInput): WorkforceEvidencePack {
  const o = buildWorkforceOversight(input);

  const sections: EvidenceSection[] = [
    {
      key: "attendance_presence",
      title: "Attendance & presence verification",
      reg_alignment: ["Reg 31 (staffing)", "Reg 45 (registered manager review)"],
      narrative:
        `${o.attendance.clock_ins_today} clock-in(s) today, ${o.attendance.currently_on_shift} currently on shift. ` +
        `${o.presence.verified} of ${o.presence.total} sign-ins this period were presence-verified ` +
        `(${o.presence.unverified} unverified). Presence checks record method and outcome only — never location.`,
      metrics: {
        clock_ins_today: o.attendance.clock_ins_today,
        currently_on_shift: o.attendance.currently_on_shift,
        late_today: o.attendance.late_today,
        verified_sign_ins: o.presence.verified,
        unverified_sign_ins: o.presence.unverified,
      },
      record_count: input.verifications.length,
    },
    {
      key: "message_governance",
      title: "Message governance & records",
      reg_alignment: ["Reg 36 (records)", "Reg 35 (behaviour/records where converted)"],
      narrative:
        `${o.governance.conversions_total} message(s) were captured once as formal records/tasks this period; ` +
        `${o.governance.active_investigation_holds} message(s) are under investigation hold; ` +
        `${o.governance.retained_non_routine} message(s) carry a non-routine retention category. ` +
        `Messages are soft-deleted only — no hidden second record.`,
      metrics: {
        conversions_total: o.governance.conversions_total,
        active_investigation_holds: o.governance.active_investigation_holds,
        retained_non_routine: o.governance.retained_non_routine,
      },
      record_count: input.messageActions.length,
    },
    {
      key: "emergency_response",
      title: "Emergency response",
      reg_alignment: ["Reg 40 (notification of events) where applicable", "Reg 31 (staffing)"],
      narrative:
        `${o.emergencies.raised} emergency alert(s) this period (${o.emergencies.active} active, ` +
        `${o.emergencies.resolved} resolved), with ${o.emergencies.total_responders} staff response(s) logged. ` +
        `Broadcasts contain operational detail only — no child, safeguarding or medical information.`,
      metrics: {
        raised: o.emergencies.raised,
        active: o.emergencies.active,
        resolved: o.emergencies.resolved,
        total_responders: o.emergencies.total_responders,
      },
      record_count: input.emergencies.length,
    },
    {
      key: "safe_staffing",
      title: "Safe staffing",
      reg_alignment: ["Reg 31 (staffing)"],
      narrative:
        `Current safe-staffing status: ${o.staffing.severity}. ${o.staffing.on_shift_count} on shift now ` +
        `(minimum ${o.staffing.minimum_required}), ${o.staffing.open_alerts} open alert(s). ` +
        `Computed from real clock-in state, not the planned rota.`,
      metrics: {
        severity: o.staffing.severity,
        on_shift_count: o.staffing.on_shift_count,
        minimum_required: o.staffing.minimum_required,
        open_alerts: o.staffing.open_alerts,
      },
      record_count: o.staffing.open_alerts,
    },
  ];

  const guarantees = [
    "Sign-in presence checks store method and outcome only — never location coordinates; no continuous tracking, no biometrics.",
    "Emergency broadcasts contain operational detail only — no child, safeguarding, medical or placement information.",
    "Messages are soft-deleted only and are convertible once into formal records — no hidden second record.",
    "Shift-based access is enforced server-side; managers and senior leaders retain access off shift.",
    "Every sign-in, conversion, hold and emergency action is attributed and audited.",
  ];

  return {
    home_id: input.homeId,
    generated_at: o.generated_at,
    period_days: o.period_days,
    title: `Workforce evidence pack — ${input.homeId} (${o.period_days}-day period)`,
    summary: o,
    sections,
    guarantees,
  };
}
