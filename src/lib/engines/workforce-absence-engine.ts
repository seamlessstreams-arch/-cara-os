// ══════════════════════════════════════════════════════════════════════════════
// CARA — Workforce Absence & Pattern engine (pure, deterministic)
//
// Turns sickness records into occupational-health intelligence: the Bradford
// Factor (S²×D over a rolling year), spell-count triggers (e.g. 3+ separate
// absences in 90 days), long-term and currently-absent flags, outstanding
// return-to-work interviews, work-related absence and OH referrals. Per staff
// + home roll-up, worst-first. `today` injected; unit-testable.
//
// It supports professional judgement — patterns are prompts for a conversation,
// never automatic conclusions about a person.
// ══════════════════════════════════════════════════════════════════════════════

export type AbsenceLevel = "critical" | "attention" | "ok";

export interface AbsenceRecordLite {
  staff_id: string;
  date_started: string;
  date_ended: string | null;
  total_days: number;
  category: string; // short_term | long_term | intermittent | work_related
  reason: string;
  rtw_status: string; // not_required | scheduled | completed | overdue
  occupational_health_referral: boolean;
}
export interface AbsenceStaffLite {
  id: string;
  full_name: string;
}

export interface AbsenceFlag {
  severity: "critical" | "attention";
  text: string;
}
export interface AbsenceStaffRow {
  staff_id: string;
  full_name: string;
  level: AbsenceLevel;
  spells_12m: number;
  days_12m: number;
  bradford: number;
  spells_90d: number;
  currently_absent: boolean;
  long_term: boolean;
  rtw_overdue: boolean;
  oh_referral: boolean;
  work_related: boolean;
  last_absence: string | null;
  flags: AbsenceFlag[];
}
export interface WorkforceAbsenceResult {
  date: string;
  total_staff: number;
  summary: {
    with_concern: number;
    currently_absent: number;
    rtw_overdue: number;
    long_term: number;
    bradford_trigger: number;
    spell_trigger: number;
  };
  headline: string;
  rows: AbsenceStaffRow[];
}

export interface WorkforceAbsenceInput {
  today: string;
  staff: AbsenceStaffLite[];
  records: AbsenceRecordLite[];
  /** Bradford thresholds (classic policy bands). */
  bradfordReview?: number; // default 200 → attention
  bradfordFormal?: number; // default 400 → critical
  /** Separate spells within this many days triggers a review. */
  spellTriggerCount?: number; // default 3
  spellTriggerDays?: number; // default 90
  longTermDays?: number; // default 28
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);
}

const LEVEL_RANK: Record<AbsenceLevel, number> = { critical: 0, attention: 1, ok: 2 };

export function computeWorkforceAbsence(input: WorkforceAbsenceInput): WorkforceAbsenceResult {
  const bradfordReview = input.bradfordReview ?? 200;
  const bradfordFormal = input.bradfordFormal ?? 400;
  const spellCount = input.spellTriggerCount ?? 3;
  const spellDays = input.spellTriggerDays ?? 90;
  const longTermDays = input.longTermDays ?? 28;
  const today = input.today;

  const byStaff = new Map<string, AbsenceRecordLite[]>();
  for (const r of input.records) {
    const arr = byStaff.get(r.staff_id) ?? [];
    arr.push(r);
    byStaff.set(r.staff_id, arr);
  }

  const rows: AbsenceStaffRow[] = input.staff.map((s) => {
    const all = byStaff.get(s.id) ?? [];
    const in12m = all.filter((r) => r.date_started && daysBetween(r.date_started, today) <= 365 && daysBetween(r.date_started, today) >= 0);
    const spells12 = in12m.length;
    const days12 = in12m.reduce((sum, r) => sum + (Number(r.total_days) || 0), 0);
    const bradford = spells12 * spells12 * days12;
    const spells90 = in12m.filter((r) => daysBetween(r.date_started, today) <= spellDays).length;
    const currentlyAbsent = all.some((r) => !r.date_ended && r.date_started <= today);
    const longTerm = all.some((r) => (Number(r.total_days) || 0) >= longTermDays || (!r.date_ended && daysBetween(r.date_started, today) >= longTermDays));
    const rtwOverdue = all.some((r) => r.rtw_status === "overdue");
    const ohReferral = all.some((r) => r.occupational_health_referral);
    const workRelated = in12m.some((r) => r.category === "work_related");
    const lastAbsence = all.reduce<string | null>((latest, r) => (!latest || r.date_started > latest ? r.date_started : latest), null);

    const flags: AbsenceFlag[] = [];
    if (currentlyAbsent && longTerm) flags.push({ severity: "critical", text: "Long-term absence — currently off" });
    else if (longTerm) flags.push({ severity: "critical", text: "Long-term absence in the last year" });
    if (rtwOverdue) flags.push({ severity: "critical", text: "Return-to-work interview overdue" });
    if (bradford >= bradfordFormal) flags.push({ severity: "critical", text: `Bradford Factor ${bradford} — formal review` });
    else if (bradford >= bradfordReview) flags.push({ severity: "attention", text: `Bradford Factor ${bradford} — review trigger` });
    if (spells90 >= spellCount) flags.push({ severity: "attention", text: `${spells90} separate absences in ${spellDays} days` });
    if (workRelated) flags.push({ severity: "attention", text: "Work-related absence — review risk assessment" });
    if (ohReferral) flags.push({ severity: "attention", text: "Occupational health referral open" });

    const level: AbsenceLevel = flags.some((f) => f.severity === "critical") ? "critical" : flags.length ? "attention" : "ok";

    return {
      staff_id: s.id,
      full_name: s.full_name,
      level,
      spells_12m: spells12,
      days_12m: days12,
      bradford,
      spells_90d: spells90,
      currently_absent: currentlyAbsent,
      long_term: longTerm,
      rtw_overdue: rtwOverdue,
      oh_referral: ohReferral,
      work_related: workRelated,
      last_absence: lastAbsence,
      flags,
    };
  });

  rows.sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || b.bradford - a.bradford || a.full_name.localeCompare(b.full_name));

  const summary = {
    with_concern: rows.filter((r) => r.level !== "ok").length,
    currently_absent: rows.filter((r) => r.currently_absent).length,
    rtw_overdue: rows.filter((r) => r.rtw_overdue).length,
    long_term: rows.filter((r) => r.long_term).length,
    bradford_trigger: rows.filter((r) => r.bradford >= bradfordReview).length,
    spell_trigger: rows.filter((r) => r.spells_90d >= spellCount).length,
  };

  const bits: string[] = [];
  const crit = rows.filter((r) => r.level === "critical").length;
  if (crit) bits.push(`${crit} critical`);
  if (summary.with_concern - crit > 0) bits.push(`${summary.with_concern - crit} to review`);
  if (summary.currently_absent) bits.push(`${summary.currently_absent} currently off`);
  const headline = bits.length ? bits.join(" · ") : "No absence concerns";

  return { date: today, total_staff: rows.length, summary, headline, rows };
}
