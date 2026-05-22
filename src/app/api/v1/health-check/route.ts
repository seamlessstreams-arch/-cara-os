import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export async function GET(_req: NextRequest) {
  const store = getStore();
  const today = todayStr();

  // ── Safeguarding Score ─────────────────────────────────────────────────────
  const incidents = store.incidents ?? [];
  const openCritical = incidents.filter((i) => (i.status === "open" || i.status === "investigating") && i.severity === "critical");
  const openHigh = incidents.filter((i) => (i.status === "open" || i.status === "investigating") && i.severity === "high");
  const safeguardingScore = clamp(100 - (openCritical.length * 20) - (openHigh.length * 10));

  // ── Medication Score ───────────────────────────────────────────────────────
  const allMars = store.medicationAdministrations ?? [];
  const todayMars = allMars.filter((m) => m.scheduled_time?.startsWith(today));
  const givenToday = todayMars.filter((m) => m.status === "given");
  const medicationScore = todayMars.length > 0
    ? clamp(Math.round((givenToday.length / todayMars.length) * 100))
    : 95; // default to high if no scheduled meds today

  // ── Staffing Score ─────────────────────────────────────────────────────────
  const shifts = store.shifts ?? [];
  const todayShifts = shifts.filter((s) => s.date === today || s.start_time?.startsWith(today));
  const filledShifts = todayShifts.filter((s) => s.staff_id && s.status !== "open" && s.status !== "unfilled");
  const staffingScore = todayShifts.length > 0
    ? clamp(Math.round((filledShifts.length / todayShifts.length) * 100))
    : 85;

  // ── Compliance Score ───────────────────────────────────────────────────────
  const training = store.trainingRecords ?? [];
  const totalTraining = training.length || 1;
  const expiredTraining = training.filter((t) => t.expiry_date && t.expiry_date < today);
  const complianceScore = clamp(Math.round(((totalTraining - expiredTraining.length) / totalTraining) * 100));

  // ── Overall Score ──────────────────────────────────────────────────────────
  const overall = Math.round(
    (safeguardingScore * 0.35) +
    (medicationScore * 0.25) +
    (staffingScore * 0.20) +
    (complianceScore * 0.20)
  );

  // ── Risk Level ─────────────────────────────────────────────────────────────
  const riskLevel = overall >= 80 ? "low" : overall >= 60 ? "medium" : overall >= 40 ? "high" : "critical";

  // ── Action Plan ────────────────────────────────────────────────────────────
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
      overall,
      safeguarding: safeguardingScore,
      medication: medicationScore,
      staffing: staffingScore,
      compliance: complianceScore,
      risk_level: riskLevel,
      action_plan: actionPlan,
      last_updated: new Date().toISOString(),
    },
  });
}
