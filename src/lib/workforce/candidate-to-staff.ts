// ══════════════════════════════════════════════════════════════════════════════
// CARA — CANDIDATE → STAFF BRIDGE (Phase 4 · Workforce · Module 3)
//
// The audit's other confirmed Workforce gap: the recruitment pipeline dead-ends
// at stage "appointed" and creates NOTHING — no StaffMember, no link. The staff
// layer is a separate seed-only dataset with no inbound path from recruitment, so
// a newly-hired person never becomes a real staff record (and so never appears on
// the rota, in compliance, or in the Reg 32 deployment board M1/M2 built).
//
// This bridges it. Pure here: the appointment GATE and the field MAPPING. The
// impure store write + audit live in the route. Two hard rules, both enforced
// deterministically before anything is created:
//   • Human-initiated only — the bridge is an explicit manager POST, never an
//     automatic side-effect of reaching "appointed" (master-prompt: never
//     auto-create official records without human confirmation).
//   • Safeguarding gate — a candidate can only become staff once their
//     safer-recruitment compliance is "cleared" (all Reg 32 checks complete) and
//     they are actually at the "appointed" stage; and never twice.
// ══════════════════════════════════════════════════════════════════════════════

import type { SystemRole, EmploymentType, EmploymentStatus } from "@/lib/constants";
import type { CandidateProfile, Vacancy, ConditionalOffer } from "@/types/recruitment";

// ── role_code / employment_type mapping ──────────────────────────────────────

const ROLE_CODE_MAP: Record<string, SystemRole> = {
  RM: "registered_manager",
  RI: "responsible_individual",
  DM: "deputy_manager",
  DEPUTY: "deputy_manager",
  TL: "team_leader",
  SENIOR: "team_leader",
  RCW: "residential_care_worker",
  SCW: "residential_care_worker",
  CW: "residential_care_worker",
  BANK: "bank_staff",
};

/** Vacancy role_code → a canonical SystemRole. Unknown codes are the safe
 *  default (residential_care_worker) rather than a guess at seniority. */
export function roleFromVacancyCode(code?: string | null): SystemRole {
  if (!code) return "residential_care_worker";
  return ROLE_CODE_MAP[code.trim().toUpperCase()] ?? "residential_care_worker";
}

/** Vacancy employment_type → StaffMember EmploymentType (they overlap but the
 *  staff enum also has "volunteer"; anything unrecognised → permanent). */
export function employmentTypeFrom(vType?: string | null): EmploymentType {
  const v = (vType ?? "").toLowerCase();
  return v === "permanent" || v === "fixed_term" || v === "bank" || v === "agency" ? v : "permanent";
}

function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

// ── Appointment gate (pure) ──────────────────────────────────────────────────

export interface AppointmentInput {
  candidate: Pick<CandidateProfile, "id" | "current_stage" | "compliance_status">;
  /** id of a staff record already linked to this candidate, if any (idempotency). */
  existingStaffId: string | null;
}

export interface AppointmentAssessment {
  appointable: boolean;
  blockers: string[];
}

/**
 * Decide whether a candidate may be turned into a staff record. Deterministic and
 * conservative — every failing condition is named so the manager sees exactly
 * what stands in the way.
 */
export function assessAppointment(input: AppointmentInput): AppointmentAssessment {
  const blockers: string[] = [];
  if (input.existingStaffId) {
    blockers.push(`Already appointed to staff (${input.existingStaffId})`);
  }
  if (input.candidate.current_stage !== "appointed") {
    blockers.push(
      `Candidate is at stage "${input.candidate.current_stage}", not "appointed" — advance the pipeline first`,
    );
  }
  if (input.candidate.compliance_status !== "cleared") {
    blockers.push(
      `Safer-recruitment compliance is "${input.candidate.compliance_status}", not "cleared" — all Reg 32 checks must be complete`,
    );
  }
  return { appointable: blockers.length === 0, blockers };
}

// ── Field mapping (pure) ─────────────────────────────────────────────────────

/** The business fields of a new staff record. The store layer adds id + audit. */
export interface MappedStaff {
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: SystemRole;
  job_title: string;
  employment_type: EmploymentType;
  employment_status: EmploymentStatus;
  start_date: string;
  end_date: null;
  probation_end_date: string | null;
  contracted_hours: number;
  hourly_rate: null;
  annual_salary: number | null;
  payroll_id: null;
  dbs_number: string | null;
  dbs_issue_date: string | null;
  dbs_update_service: boolean;
  emergency_contact_name: null;
  emergency_contact_phone: null;
  next_supervision_due: null;
  next_appraisal_due: null;
  avatar_url: null;
  home_id: string;
  is_active: boolean;
  /** Back-link to the candidate this record was created from (reverse lookup +
   *  idempotency). */
  candidate_id: string;
}

/** Minimal DBS-check shape the mapping needs (a CandidateCheck of type enhanced_dbs). */
export interface DbsCheckLite {
  certificate_number: string | null;
  verified_at: string | null;
  received_at: string | null;
}

/**
 * Map an appointed candidate (+ their vacancy, offer and DBS check) onto a new
 * staff record. Pure and total — missing optionals fall back to safe, honest
 * defaults (never fabricates a DBS number or a salary that wasn't offered).
 */
export function mapCandidateToStaff(args: {
  candidate: CandidateProfile;
  vacancy?: Vacancy | null;
  offer?: ConditionalOffer | null;
  dbsCheck?: DbsCheckLite | null;
  nowIso: string;
}): MappedStaff {
  const { candidate, vacancy, offer, dbsCheck, nowIso } = args;
  const today = nowIso.slice(0, 10);
  const start = offer?.proposed_start_date?.slice(0, 10) || today;
  const probMonths = offer?.probation_months ?? 0;

  return {
    first_name: candidate.first_name,
    last_name: candidate.last_name,
    full_name: `${candidate.first_name} ${candidate.last_name}`.trim(),
    email: candidate.email ?? null,
    phone: candidate.phone ?? null,
    role: roleFromVacancyCode(vacancy?.role_code),
    job_title: vacancy?.title || "Residential Care Worker",
    employment_type: employmentTypeFrom(vacancy?.employment_type),
    employment_status: probMonths > 0 ? "probation" : "active",
    start_date: start,
    end_date: null,
    probation_end_date: probMonths > 0 ? addMonths(start, probMonths) : null,
    contracted_hours: offer?.hours ?? vacancy?.hours ?? 0,
    hourly_rate: null,
    annual_salary: offer?.salary ?? null,
    payroll_id: null,
    dbs_number: dbsCheck?.certificate_number ?? null,
    dbs_issue_date: (dbsCheck?.verified_at ?? dbsCheck?.received_at)?.slice(0, 10) ?? null,
    dbs_update_service: false,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    next_supervision_due: null,
    next_appraisal_due: null,
    avatar_url: null,
    home_id: candidate.home_id,
    is_active: true,
    candidate_id: candidate.id,
  };
}
