import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

// Read a DAL collection, defaulting to [] if the query fails or the table is
// absent (e.g. medication_administrations is not in the lean live baseline).
// Health-check is the PUBLIC deploy/uptime probe and carries the build marker,
// so it must never 500 — a missing source simply contributes no data.
async function safeList<T>(p: Promise<T[]>): Promise<T[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

const BUILD = () => ({
  commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown").slice(0, 9),
  ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
});

export async function GET(_req: NextRequest) {
  const today = todayStr();

  // Real data via the dual-mode DAL — the live tenant's Postgres when connected,
  // the in-memory store in demo mode. This route USED to read getStore()
  // directly, which is gated EMPTY on a live tenant: it then scored the absence
  // of data as near-perfection and reported a reassuring "96% / low risk" for a
  // home with no records at all. On a safeguarding surface, false confidence is
  // worse than showing nothing — hence the honest no-data path below.
  const [youngPeople, incidents, allMars, shifts, training] = await Promise.all([
    safeList(dal.youngPeople.findAll() as Promise<Record<string, unknown>[]>),
    safeList(dal.incidents.findAll() as Promise<Record<string, unknown>[]>),
    safeList(dal.medicationAdministrations.findAll() as Promise<Record<string, unknown>[]>),
    safeList(dal.shifts.findAll() as Promise<Record<string, unknown>[]>),
    safeList(dal.training.findAll() as Promise<Record<string, unknown>[]>),
  ]);

  // Nothing to assess — an empty or newly-provisioned home. Report it honestly
  // instead of fabricating a score. `assessed:false` is what the dashboard/
  // inspection surfaces branch on to show "No data yet".
  const hasData =
    youngPeople.length > 0 || incidents.length > 0 || allMars.length > 0 || shifts.length > 0 || training.length > 0;
  if (!hasData) {
    return NextResponse.json({
      data: {
        assessed: false,
        // Type-valid neutral placeholders; never rendered while assessed:false.
        overall: 0,
        safeguarding: 0,
        medication: 0,
        staffing: 0,
        compliance: 0,
        risk_level: "medium",
        action_plan: [],
        note: "No records yet — the home health score appears once children and daily records are added.",
        build: BUILD(),
        last_updated: new Date().toISOString(),
      },
    });
  }

  // ── Safeguarding ────────────────────────────────────────────────────────────
  const status = (i: Record<string, unknown>) => i.status as string;
  const severity = (i: Record<string, unknown>) => i.severity as string;
  const openCritical = incidents.filter((i) => (status(i) === "open" || status(i) === "under_review") && severity(i) === "critical");
  const openHigh = incidents.filter((i) => (status(i) === "open" || status(i) === "under_review") && severity(i) === "high");
  const safeguardingScore = clamp(100 - (openCritical.length * 20) - (openHigh.length * 10));

  // ── Medication ──────────────────────────────────────────────────────────────
  const todayMars = allMars.filter((m) => (m.scheduled_time as string | undefined)?.startsWith(today));
  const givenToday = todayMars.filter((m) => m.status === "given");
  const medicationScore = todayMars.length > 0
    ? clamp(Math.round((givenToday.length / todayMars.length) * 100))
    : 95; // no meds scheduled today → nothing to miss

  // ── Staffing ────────────────────────────────────────────────────────────────
  const todayShifts = shifts.filter((s) => s.date === today || (s.start_time as string | undefined)?.startsWith(today));
  const filledShifts = todayShifts.filter((s) => s.staff_id && !s.is_open_shift);
  const staffingScore = todayShifts.length > 0
    ? clamp(Math.round((filledShifts.length / todayShifts.length) * 100))
    : 85;

  // ── Compliance ──────────────────────────────────────────────────────────────
  const totalTraining = training.length || 1;
  const expiredTraining = training.filter((t) => t.expiry_date && (t.expiry_date as string) < today);
  const complianceScore = clamp(Math.round(((totalTraining - expiredTraining.length) / totalTraining) * 100));

  // ── Overall + risk ──────────────────────────────────────────────────────────
  const overall = Math.round(
    (safeguardingScore * 0.35) + (medicationScore * 0.25) + (staffingScore * 0.20) + (complianceScore * 0.20),
  );
  const riskLevel = overall >= 80 ? "low" : overall >= 60 ? "medium" : overall >= 40 ? "high" : "critical";

  // ── Action plan ─────────────────────────────────────────────────────────────
  const actionPlan: { issue: string; area: string; priority: string; due: string }[] = [];
  if (safeguardingScore < 80) {
    actionPlan.push({
      issue: `${openCritical.length + openHigh.length} open safeguarding incidents need management oversight`,
      area: "Safeguarding",
      priority: openCritical.length > 0 ? "critical" : "high",
      due: today,
    });
  }
  if (medicationScore < 90) {
    const missed = todayMars.length - givenToday.length;
    actionPlan.push({
      issue: `${missed} medication administration${missed !== 1 ? "s" : ""} outstanding today`,
      area: "Medication",
      priority: "high",
      due: today,
    });
  }
  if (staffingScore < 85) {
    const gaps = todayShifts.length - filledShifts.length;
    actionPlan.push({
      issue: `${gaps} shift gap${gaps !== 1 ? "s" : ""} require immediate cover`,
      area: "Staffing",
      priority: "high",
      due: today,
    });
  }
  if (complianceScore < 90) {
    actionPlan.push({
      issue: `${expiredTraining.length} training record${expiredTraining.length !== 1 ? "s" : ""} expired — renewal required`,
      area: "Compliance",
      priority: "medium",
      due: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });
  }

  return NextResponse.json({
    data: {
      assessed: true,
      overall,
      safeguarding: safeguardingScore,
      medication: medicationScore,
      staffing: staffingScore,
      compliance: complianceScore,
      risk_level: riskLevel,
      action_plan: actionPlan,
      build: BUILD(),
      last_updated: new Date().toISOString(),
    },
  });
}
