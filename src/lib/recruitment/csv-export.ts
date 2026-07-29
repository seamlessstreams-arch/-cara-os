// ══════════════════════════════════════════════════════════════════════════════
// Recruitment CSV exports
//
// Three shapes the Recruitment > Reports tab surfaces:
//   • audit        — one row per candidate with the full compliance snapshot
//   • time-to-appoint — one row per appointed candidate with stage-elapsed days
//   • scr          — Single Central Record (Ofsted-mandated) grid: candidate
//                    row + one column per SCR-relevant check
//
// No third-party CSV library — the shape is simple and quoted-string escaping
// is well-defined. Fields containing `,`, `"`, `\r`, or `\n` are double-quoted
// with any inner `"` doubled. Every row ends with `\r\n` (RFC 4180).
// ══════════════════════════════════════════════════════════════════════════════

import type { CandidateProfile, CandidateCheck, CheckType, CheckStatus } from "@/types/recruitment";

/** Escape one CSV cell per RFC 4180. */
export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[,"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Assemble rows into a CSV string with `\r\n` separators. */
export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

// ── Audit bundle ─────────────────────────────────────────────────────────────

/**
 * One row per candidate — the full compliance snapshot an inspector would
 * expect to see. Ordered by created_at descending so the most recent activity
 * is at the top.
 */
export function candidateAuditCsv(candidates: CandidateProfile[]): string {
  const header = [
    "Candidate ID", "First name", "Last name", "Preferred name", "Email", "Phone",
    "Date of birth", "Current stage", "Compliance status", "Risk level",
    "Shortlisted", "Appointed", "Source", "Vacancy", "Assigned manager",
    "Adjustments requested", "Adjustments notes", "Created", "Updated", "Notes",
  ];
  const rows = [...candidates]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .map((c) => [
      c.id, c.first_name, c.last_name, c.preferred_name, c.email, c.phone,
      c.dob, c.current_stage, c.compliance_status, c.risk_level,
      c.shortlisted, c.appointed, c.source, c.vacancy_id, c.assigned_manager_id,
      c.adjustments_requested, c.adjustments_notes, c.created_at, c.updated_at, c.notes,
    ]);
  return toCsv([header, ...rows]);
}

// ── Time to appoint ──────────────────────────────────────────────────────────

/**
 * One row per APPOINTED candidate. Time-to-appoint is (updated_at - created_at)
 * for candidates whose current_stage is "appointed" — an approximation, since
 * we don't store the stage-transition timestamps separately. Callers who need
 * per-stage elapsed times will need a stage_history table (not modelled today).
 */
export function timeToAppointCsv(candidates: CandidateProfile[]): string {
  const header = [
    "Candidate ID", "Name", "Vacancy", "Source", "Applied", "Appointed",
    "Days from application to appointment",
  ];
  const rows = candidates
    .filter((c) => c.current_stage === "appointed" && c.appointed)
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
    .map((c) => {
      const days = c.created_at && c.updated_at
        ? Math.max(0, Math.round(
            (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
          ))
        : "";
      return [
        c.id,
        `${c.first_name} ${c.last_name}`.trim(),
        c.vacancy_id,
        c.source,
        c.created_at,
        c.updated_at,
        days,
      ];
    });
  return toCsv([header, ...rows]);
}

// ── SCR (Single Central Record) ──────────────────────────────────────────────

/**
 * Ofsted's Single Central Record layout: one row per candidate, with a column
 * per SCR-relevant check. Values are the CheckStatus ("verified" / "received"
 * / "concern_flagged" etc.) so an inspector can see status at a glance.
 *
 * Only the checks Ofsted expects on the SCR for a children's home are
 * projected — internal-only checks (social_media, driving_licence) are
 * omitted from the export but preserved in the audit CSV.
 */
const SCR_CHECKS: readonly CheckType[] = [
  "enhanced_dbs",
  "barred_list",
  "right_to_work",
  "identity",
  "overseas_criminal_record",
  "professional_qualifications",
  "employment_history",
  "medical_fitness",
  "references",
  "safeguarding_training_check",
];

const SCR_HEADERS: Record<CheckType, string> = {
  enhanced_dbs: "Enhanced DBS",
  barred_list: "Barred list check",
  right_to_work: "Right to work",
  identity: "Identity verified",
  overseas_criminal_record: "Overseas criminal record",
  professional_qualifications: "Qualifications",
  employment_history: "Employment history",
  medical_fitness: "Medical fitness",
  references: "References",
  safeguarding_training_check: "Safeguarding training",
  // Not exported to SCR — kept off the header list.
  social_media: "",
  driving_licence: "",
};

/** For a given candidate + all their checks, return the most-recent status per SCR check type. */
function latestCheckStatus(checks: CandidateCheck[], type: CheckType): CheckStatus | "" {
  const matching = checks.filter((k) => k.check_type === type);
  if (matching.length === 0) return "";
  const latest = matching.reduce((a, b) => {
    const at = a.verified_at ?? a.received_at ?? a.requested_at ?? "";
    const bt = b.verified_at ?? b.received_at ?? b.requested_at ?? "";
    return bt > at ? b : a;
  });
  return latest.status;
}

/**
 * Combine per-candidate checks into the SCR grid. Candidates without checks
 * are still listed (with blank statuses) so the inspector can see the gap.
 */
export function scrCsv(
  candidates: CandidateProfile[],
  checksByCandidate: Map<string, CandidateCheck[]>,
): string {
  const header = [
    "Candidate ID", "Name", "Date of birth", "Current stage", "Appointed",
    ...SCR_CHECKS.map((t) => SCR_HEADERS[t]),
  ];
  const rows = [...candidates]
    .sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`))
    .map((c) => {
      const checks = checksByCandidate.get(c.id) ?? [];
      return [
        c.id,
        `${c.first_name} ${c.last_name}`.trim(),
        c.dob,
        c.current_stage,
        c.appointed,
        ...SCR_CHECKS.map((t) => latestCheckStatus(checks, t)),
      ];
    });
  return toCsv([header, ...rows]);
}
