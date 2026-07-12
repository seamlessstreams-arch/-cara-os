import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { persistRecruitmentCandidate } from "@/lib/supabase/recruitment-persist";
import { evaluateCandidateRules } from "@/lib/recruitment-rules";
import type { CandidateProfile } from "@/types/recruitment";
import { readJsonBody } from "@/lib/http/read-json";

// ─────────────────────────────────────────────────────────────────────────────
// Base recruitment endpoint — the recruitment overview dashboard.
//
// IMPORTANT: this dedicated route exists because there was no base
// `recruitment/route.ts`, so GET /api/v1/recruitment fell through to the generic
// catch-all (`/api/v1/[...slug]`), whose SLUG_MAP maps "recruitment" → the
// conditionalOffers collection. That returned a raw `{ data: ConditionalOffer[] }`
// list, but the page consumes a RecruitmentOverview ({ candidates, vacancies,
// alerts, stats }). Its defensive `data?.candidates ?? []` fallbacks meant the
// dashboard rendered SILENTLY EMPTY (no candidates, zero stats) regardless of
// the real data. This route returns the real overview.
// ─────────────────────────────────────────────────────────────────────────────

const TERMINAL_STAGES = new Set(["appointed", "unsuccessful", "withdrawn"]);

function daysBetweenDays(fromIso: string, today: string): number {
  return Math.max(0, Math.floor(
    (new Date(today).getTime() - new Date((fromIso ?? today).slice(0, 10)).getTime()) / 86_400_000,
  ));
}

// Build the candidate SUMMARY for the overview list. Compliance score, risk and
// blockers are computed from real data via the same rules engine the detail route
// uses; the heavy per-record detail arrays (checks/references/…) are left empty —
// they are only shown on the per-candidate detail page (/recruitment/[id]).
function buildCandidateSummary(candidate: CandidateProfile, today: string) {
  const checks = db.candidateChecks.findByCandidate(candidate.id);
  const references = db.candidateReferences.findByCandidate(candidate.id);
  const gaps = db.gapExplanations.findByCandidate(candidate.id);
  const offerRaw = db.conditionalOffers.findByCandidate(candidate.id) ?? null;
  const vacancy = candidate.vacancy_id ? db.vacancies.findById(candidate.vacancy_id) : null;
  const role_applied = (vacancy as { title?: string } | undefined)?.title ?? "Care Worker";

  const rules = evaluateCandidateRules(candidate, checks, references, gaps, offerRaw);

  const requiredChecks = checks.filter((c) => c.required);
  const verifiedChecks = requiredChecks.filter(
    (c) => c.status === "verified" || c.status === "override_approved",
  );
  const compliance_score = requiredChecks.length > 0
    ? Math.round((verifiedChecks.length / requiredChecks.length) * 100)
    : 0;

  const days_in_stage = daysBetweenDays(candidate.updated_at, today);

  const detail = {
    id: candidate.id,
    first_name: candidate.first_name,
    last_name: candidate.last_name,
    email: candidate.email,
    phone: candidate.phone ?? null,
    role_applied,
    stage: candidate.current_stage,
    source: candidate.source ?? null,
    cv_url: candidate.cv_url ?? null,
    compliance_score,
    risk_level: candidate.risk_level,
    days_in_stage,
    days_total: daysBetweenDays(candidate.created_at, today),
    manager_assigned: candidate.assigned_manager_id ?? null,
    interview_date: null,
    interview_notes: null,
    offer_date: offerRaw?.conditional_offer_sent_at ?? null,
    start_date: offerRaw?.proposed_start_date ?? null,
    notes: candidate.notes ?? null,
    blocker_summary: rules.blockers.map((b) => b.message),
    next_actions: rules.auto_tasks.map((t) => t.title),
    checks: [],
    references: [],
    employment_history: [],
    employment_gaps: [],
    interviews: [],
    offer: null,
    audit: [],
    home_id: candidate.home_id,
    created_at: candidate.created_at,
    updated_at: candidate.updated_at,
    created_by: candidate.created_by,
    updated_by: candidate.created_by,
  };

  return {
    detail,
    isActive: !TERMINAL_STAGES.has(candidate.current_stage),
    isBlocked: rules.blockers.length > 0,
    exceptionalStart: !!offerRaw?.exceptional_start,
    isAppointed: candidate.current_stage === "appointed",
    daysToAppoint: detail.days_total,
  };
}

// ── GET /api/v1/recruitment ──────────────────────────────────────────────────
export async function GET(_req: NextRequest) {
  const today = new Date().toISOString().slice(0, 10);

  const profiles = db.candidateProfiles.findAll();
  const built = profiles.map((c) => buildCandidateSummary(c, today));
  const candidates = built.map((b) => b.detail);

  const vacancies = db.vacancies.findAll();

  // Compliance alerts: each blocker on each candidate surfaces as an alert.
  const alerts = built.flatMap((b) =>
    b.detail.blocker_summary.map((issue) => ({
      candidate_id: b.detail.id,
      candidate_name: `${b.detail.first_name} ${b.detail.last_name}`,
      issue,
      severity: "critical" as const,
      check_type: null,
    })),
  );

  const appointed = built.filter((b) => b.isAppointed);
  const avgDaysToAppoint = appointed.length > 0
    ? Math.round(appointed.reduce((s, b) => s + b.daysToAppoint, 0) / appointed.length)
    : 0;

  const stats = {
    total_active: built.filter((b) => b.isActive).length,
    blocked: built.filter((b) => b.isBlocked).length,
    exceptional_starts: built.filter((b) => b.exceptionalStart).length,
    avg_days_to_appoint: avgDaysToAppoint,
  };

  return NextResponse.json({ data: { candidates, vacancies, alerts, stats } });
}

// ── POST /api/v1/recruitment ─────────────────────────────────────────────────
// Creates a new candidate at the "enquiry" stage.
export async function POST(req: NextRequest) {
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_RECRUITMENT);
  if (auth instanceof NextResponse) return auth;

  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const first_name = typeof body.first_name === "string" ? body.first_name.trim() : "";
  const last_name = typeof body.last_name === "string" ? body.last_name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!first_name || !last_name) {
    return NextResponse.json({ error: "first_name and last_name are required" }, { status: 400 });
  }

  const created = db.candidateProfiles.create({
    home_id: "home_oak",
    first_name,
    last_name,
    email,
    phone: typeof body.phone === "string" ? body.phone : null,
    source: (typeof body.source === "string" ? body.source : null) as CandidateProfile["source"],
    vacancy_id: typeof body.vacancy_id === "string" ? body.vacancy_id : null,
    current_stage: "enquiry",
    risk_level: "low",
    assigned_manager_id: null,
    notes: null,
    cv_url: null,
    created_by: "staff_darren",
  } as Partial<CandidateProfile>);

  void persistRecruitmentCandidate(created); // best-effort write-through (no-op when off)

  const today = new Date().toISOString().slice(0, 10);
  return NextResponse.json({ data: buildCandidateSummary(created, today).detail }, { status: 201 });
}
