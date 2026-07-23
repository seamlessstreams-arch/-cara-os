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

  // A domain with no source records is UNMEASURED, not perfect. Scoring the
  // absence of data as a high number is what let a home with one child, one
  // staff member and nothing else recorded report 99% overall and 100%
  // safeguarding — the defaults (medication ?? 95, staffing ?? 85, compliance
  // 1/1) simply outvoted the one real signal. Each domain below returns null
  // when it has nothing to measure, and the overall score averages only the
  // domains that ARE measured, so an unmeasured domain can neither flatter nor
  // penalise the home.

  // ── Safeguarding ────────────────────────────────────────────────────────────
  // What this scores is the home's RESPONSE to concerns — how much is sitting
  // open and unresolved. With no incidents on record there is no response to
  // judge, so it is unmeasured. Scoring it on the children alone would put a
  // home that has never recorded an incident on the same 100% as one that
  // handled fifty of them well, which is the flattery this whole route is
  // being fixed to stop.
  const status = (i: Record<string, unknown>) => i.status as string;
  const severity = (i: Record<string, unknown>) => i.severity as string;
  const openCritical = incidents.filter((i) => (status(i) === "open" || status(i) === "under_review") && severity(i) === "critical");
  const openHigh = incidents.filter((i) => (status(i) === "open" || status(i) === "under_review") && severity(i) === "high");
  const safeguardingScore = incidents.length > 0
    ? clamp(100 - (openCritical.length * 20) - (openHigh.length * 10))
    : null;

  // ── Medication ──────────────────────────────────────────────────────────────
  // Unmeasured until doses are actually scheduled — "no medication round today"
  // is not a 95% administration record.
  const todayMars = allMars.filter((m) => (m.scheduled_time as string | undefined)?.startsWith(today));
  const givenToday = todayMars.filter((m) => m.status === "given");
  const medicationScore = todayMars.length > 0
    ? clamp(Math.round((givenToday.length / todayMars.length) * 100))
    : null;

  // ── Staffing ────────────────────────────────────────────────────────────────
  // Unmeasured until shifts exist for today — an empty rota is not 85% covered.
  const todayShifts = shifts.filter((s) => s.date === today || (s.start_time as string | undefined)?.startsWith(today));
  const filledShifts = todayShifts.filter((s) => s.staff_id && !s.is_open_shift);
  const staffingScore = todayShifts.length > 0
    ? clamp(Math.round((filledShifts.length / todayShifts.length) * 100))
    : null;

  // ── Compliance ──────────────────────────────────────────────────────────────
  // Unmeasured until training is recorded. The old `training.length || 1` made
  // an empty register read as 1-of-1 current = 100%, which is the exact inverse
  // of the truth: nothing is evidenced.
  const expiredTraining = training.filter((t) => t.expiry_date && (t.expiry_date as string) < today);
  const complianceScore = training.length > 0
    ? clamp(Math.round(((training.length - expiredTraining.length) / training.length) * 100))
    : null;

  // ── Overall + risk ──────────────────────────────────────────────────────────
  // Weighted mean over measured domains only, with the weights renormalised so
  // the result stays on a 0-100 scale. Null when nothing is measured.
  const domains = [
    { key: "safeguarding", score: safeguardingScore, weight: 0.35 },
    { key: "medication", score: medicationScore, weight: 0.25 },
    { key: "staffing", score: staffingScore, weight: 0.20 },
    { key: "compliance", score: complianceScore, weight: 0.20 },
  ];
  const measured = domains.filter((d) => d.score !== null);
  const weightSum = measured.reduce((s, d) => s + d.weight, 0);

  // Renormalising is right for a partial picture but wrong for a sliver of one.
  // Live Oak House had only staffing measured — today's shift-fill rate, weight
  // 0.20 — and reported "100% overall, low risk" while safeguarding (weight
  // 0.35) had nothing behind it at all. Renormalising over 20% of the model
  // hands the whole verdict to its shallowest domain.
  //
  // So a whole-home score needs a majority of the weighted model behind it.
  // Below that the domain scores still stand on their own; what is withheld is
  // the summary, because that is the number people act on.
  const MIN_COVERAGE = 0.5;
  const overall = weightSum >= MIN_COVERAGE
    ? Math.round(measured.reduce((s, d) => s + (d.score as number) * d.weight, 0) / weightSum)
    : null;
  const unmeasured = domains.filter((d) => d.score === null).map((d) => d.key);
  const coveragePct = Math.round(weightSum * 100);

  // Risk is only claimable where there is enough to judge.
  const riskLevel = overall === null ? null
    : overall >= 80 ? "low" : overall >= 60 ? "medium" : overall >= 40 ? "high" : "critical";

  // ── Action plan ─────────────────────────────────────────────────────────────
  // Only a MEASURED domain can raise an action — an unmeasured one has no
  // finding to act on, and inventing one would be the same fabrication in
  // reverse. The gap itself is surfaced separately, as `unmeasured`.
  const actionPlan: { issue: string; area: string; priority: string; due: string }[] = [];
  if (safeguardingScore !== null && safeguardingScore < 80) {
    actionPlan.push({
      issue: `${openCritical.length + openHigh.length} open safeguarding incidents need management oversight`,
      area: "Safeguarding",
      priority: openCritical.length > 0 ? "critical" : "high",
      due: today,
    });
  }
  if (medicationScore !== null && medicationScore < 90) {
    const missed = todayMars.length - givenToday.length;
    actionPlan.push({
      issue: `${missed} medication administration${missed !== 1 ? "s" : ""} outstanding today`,
      area: "Medication",
      priority: "high",
      due: today,
    });
  }
  if (staffingScore !== null && staffingScore < 85) {
    const gaps = todayShifts.length - filledShifts.length;
    actionPlan.push({
      issue: `${gaps} shift gap${gaps !== 1 ? "s" : ""} require immediate cover`,
      area: "Staffing",
      priority: "high",
      due: today,
    });
  }
  if (complianceScore !== null && complianceScore < 90) {
    actionPlan.push({
      issue: `${expiredTraining.length} training record${expiredTraining.length !== 1 ? "s" : ""} expired — renewal required`,
      area: "Compliance",
      priority: "medium",
      due: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });
  }

  const UNMEASURED_LABEL: Record<string, string> = {
    safeguarding: "no incidents recorded to assess the response to",
    medication: "no medication scheduled today",
    staffing: "no shifts on today's rota",
    compliance: "no training records yet",
  };
  const gapList = unmeasured.map((k) => `${k} (${UNMEASURED_LABEL[k]})`).join(", ");
  const note = unmeasured.length === 0
    ? undefined
    : overall === null
      // Too little of the model is evidenced to summarise it at all. Name the
      // one thing that would change that rather than leaving a bare dash.
      ? `Not enough recorded to score the home yet — only ${coveragePct}% of the health model has evidence behind it. Still to record: ${gapList}.`
      : `Not yet measured: ${gapList}. The score covers ${coveragePct}% of the health model — only what has been recorded.`;

  return NextResponse.json({
    data: {
      // assessed:false when NOTHING could be measured — the card shows its
      // "No data yet" state rather than a score built from no evidence.
      assessed: overall !== null,
      overall,
      safeguarding: safeguardingScore,
      medication: medicationScore,
      staffing: staffingScore,
      compliance: complianceScore,
      // Which domains have no source records, so the UI can say "not yet
      // measured" against them instead of rendering an invented number.
      unmeasured,
      note,
      risk_level: riskLevel,
      action_plan: actionPlan,
      build: BUILD(),
      last_updated: new Date().toISOString(),
    },
  });
}
