// ══════════════════════════════════════════════════════════════════════════════
// CARA — WORKFORCE COMMAND API  (the org workforce dashboard, spec §1)
// GET /api/v1/workforce-command
//
// Composes the workforce layer into one manager landing view. Direct store reads
// for the light signals; internal fetch (graceful) reuses the retention-risk and
// ofsted-workforce-evidence routes so their fan-in logic isn't duplicated.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { StaffMember } from "@/types";
import { dal } from "@/lib/db";
import { computeSupervisionOverview, type ReflectiveSupervisionRecord, type StaffLite } from "@/lib/engines/supervision-engine";
import { computeWorkforceCommand, type WorkforceCommandInput } from "@/lib/engines/workforce-command-engine";
import { todayStr } from "@/lib/utils";

const SUPERVISEE_ROLES = new Set(["registered_manager", "deputy_manager", "team_leader", "residential_care_worker", "bank_staff"]);
const APPOINTED_STAGES = new Set(["appointed", "onboarding"]);
const CLOSED_STAGES = new Set(["appointed", "onboarding", "unsuccessful", "withdrawn"]);
const CLOSED_TASK = new Set(["completed", "cancelled", "closed", "done"]);
const staffName = (s: StaffMember) => s.full_name || [s.first_name, s.last_name].filter(Boolean).join(" ") || s.id;
const iso = (d: unknown) => (d ? String(d).slice(0, 10) : null);

async function fetchJson(baseUrl: string, route: string): Promise<any | null> {
  try {
    const res = await fetch(`${baseUrl}/api/v1/${route}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json())?.data ?? null;
  } catch { return null; }
}

export async function GET(req: Request) {
  const today = todayStr();
  const inDays = (d: unknown, n: number) => { const v = iso(d); return !!v && v >= today && (Date.parse(v) - Date.parse(today)) / 86_400_000 <= n; };
  const past = (d: unknown) => { const v = iso(d); return !!v && v < today; };

  const [allStaff, candidates, checks, inductions, supRecordsRaw, trainingList, tasksList] = await Promise.all([
    dal.staff.findAll(),
    dal.candidateProfiles.findAll(),
    // candidateChecks has no findAll — pull per candidate.
    (async () => {
      const cands = await dal.candidateProfiles.findAll();
      const nested = await Promise.all((cands ?? []).map((c) => dal.candidateChecks.findByCandidate(c.id)));
      return nested.flat().filter(Boolean);
    })(),
    dal.inductionRecords.findAll(),
    dal.reflectiveSupervisions.findAll(),
    dal.trainingRecords.findAll(),
    dal.tasks.findAll(),
  ]);

  const activeStaff = (allStaff ?? []).filter((s) => s.employment_status !== "left");
  const staff: StaffLite[] = activeStaff.filter((s) => SUPERVISEE_ROLES.has(String(s.role))).map((s) => ({ id: s.id, name: staffName(s), role: s.role }));

  // recruitment
  const appointed = (candidates ?? []).filter((c) => APPOINTED_STAGES.has(String(c.current_stage)) || c.appointed === true).length;
  const active = (candidates ?? []).filter((c) => !CLOSED_STAGES.has(String(c.current_stage))).length;

  // safer recruitment
  const verified = (checks ?? []).filter((c) => ["verified", "received", "override_approved", "not_required"].includes(String(c.status))).length;

  // onboarding
  const indCompleted = (inductions ?? []).filter((i) => String(i.overall_status) === "completed").length;
  const indInProgress = (inductions ?? []).length - indCompleted;

  // probation
  const inProbation = activeStaff.filter((s) => s.probation_end_date && iso(s.probation_end_date)! >= today);
  const probationDueSoon = inProbation.filter((s) => inDays(s.probation_end_date, 30)).length;

  // supervision (reuse slice 3 engine)
  const supRecords: ReflectiveSupervisionRecord[] = supRecordsRaw ?? [];
  const sup = computeSupervisionOverview({ records: supRecords, staff, today });

  // training
  const trExpired = (trainingList ?? []).filter((t) => String(t.status) === "expired" || past(t.expiry_date)).length;
  const trExpiring = (trainingList ?? []).filter((t) => String(t.status) !== "expired" && inDays(t.expiry_date, 30)).length;

  // tasks
  const openTasks = (tasksList ?? []).filter((t) => !CLOSED_TASK.has(String(t.status)));
  const overdueTasks = openTasks.filter((t) => past(t.due_date)).length;

  // internal fetch the two heavy composites (graceful)
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const [retentionData, ofstedData] = await Promise.all([
    fetchJson(baseUrl, "retention-risk"),
    fetchJson(baseUrl, "ofsted-workforce-evidence"),
  ]);

  const input: WorkforceCommandInput = {
    recruitment: { total: (candidates ?? []).length, active, appointed },
    safer_recruitment: { checks_tracked: (checks ?? []).length, verified, candidates: (candidates ?? []).length },
    onboarding: { total: (inductions ?? []).length, completed: indCompleted, in_progress: indInProgress },
    probation: { in_probation: inProbation.length, due_soon: probationDueSoon },
    supervision: { rate: sup.summary.supervision_rate, current: sup.summary.current, overdue: sup.summary.overdue, due_soon: sup.summary.due_soon, total: sup.summary.total_staff, wellbeing_concerns: sup.summary.wellbeing_concerns },
    training: { total: (trainingList ?? []).length, expired: trExpired, expiring: trExpiring },
    retention: retentionData?.summary ? { priority: retentionData.summary.priority, support: retentionData.summary.support, total: retentionData.summary.total } : null,
    ofsted: ofstedData?.overall ? { rating: ofstedData.overall.rating, red: ofstedData.overall.red, amber: ofstedData.overall.amber, green: ofstedData.overall.green } : null,
    tasks: { open: openTasks.length, overdue: overdueTasks },
  };

  const result = computeWorkforceCommand(input);

  // recent activity across the workforce modules (latest first)
  const recent_activity = [
    ...supRecords.map((r) => ({ kind: "supervision", label: `Reflective supervision — ${r.staff_name}`, when: iso(r.date), href: "/reflective-supervision" })),
    ...(candidates ?? []).map((c) => ({ kind: "recruitment", label: `Candidate — ${[c.first_name, c.last_name].filter(Boolean).join(" ")} (${String(c.current_stage).replace(/_/g, " ")})`, when: iso(c.updated_at) || iso(c.created_at), href: "/recruitment" })),
    ...(inductions ?? []).map((i) => ({ kind: "onboarding", label: `Induction — ${staffName((allStaff ?? []).find((s) => s.id === i.staff_id) || { id: i.staff_id })} (${String(i.overall_status).replace(/_/g, " ")})`, when: iso(i.start_date), href: "/staff-induction" })),
  ].filter((a) => a.when).sort((a, b) => String(b.when).localeCompare(String(a.when))).slice(0, 6);

  return NextResponse.json({ data: { ...result, recent_activity } });
}
