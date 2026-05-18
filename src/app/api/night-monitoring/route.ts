// ══════════════════════════════════════════════════════════════════════════════
// Night Monitoring & Sleep API Route
//
// GET  ?homeId=...&mode=dashboard|metrics|shift&date=...
// POST { action: "evaluate"|"metrics", ... }
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateNightShiftCompliance,
  calculateHomeNightMetrics,
  getNightIncidentTypeLabel,
  getSleepStatusLabel,
} from "@/lib/night-monitoring";
import type { NightShift, NightCheckPlan, NightCheck, NightIncident, SleepPattern } from "@/lib/night-monitoring";

// ── Demo Data ──────────────────────────────────────────────────────────────

const CHECK_PLANS: NightCheckPlan[] = [
  { childId: "child-alex", childName: "Alex Turner", frequency: "30_min", riskLevel: "standard" },
  { childId: "child-jordan", childName: "Jordan Clarke", frequency: "30_min", riskLevel: "enhanced", specialInstructions: "New admission — monitor settling", knownSleepIssues: ["Night terrors history"] },
  { childId: "child-sam", childName: "Sam Patel", frequency: "60_min", riskLevel: "standard" },
];

function generateNightChecks(date: string, children: string[]): NightCheck[] {
  const checks: NightCheck[] = [];
  const statuses: Array<"asleep" | "awake_settled"> = ["asleep", "asleep"];
  for (let hour = 22; hour < 31; hour++) {
    const h = hour >= 24 ? hour - 24 : hour;
    for (const childId of children) {
      const freq = CHECK_PLANS.find(p => p.childId === childId)?.frequency;
      if (freq === "60_min" && hour % 2 !== 0) continue;
      checks.push({
        id: `chk-${date}-${childId}-${h}`,
        childId,
        childName: CHECK_PLANS.find(p => p.childId === childId)?.childName ?? childId,
        timestamp: `${date}T${String(h).padStart(2, "0")}:${hour % 2 === 0 ? "00" : "30"}:00Z`,
        status: Math.random() > 0.9 ? "awake_settled" : "asleep",
        observation: "Sleeping peacefully",
        checkedBy: "staff-wn-01",
        doorOpen: true,
      });
    }
  }
  return checks;
}

const DEMO_SHIFTS: NightShift[] = Array.from({ length: 14 }, (_, i) => {
  const day = 16 - i;
  const dateStr = `2026-05-${String(day).padStart(2, "0")}`;
  const hasIncident = i === 2 || i === 7;
  return {
    id: `shift-${dateStr}`,
    homeId: "home-oak",
    date: dateStr,
    startTime: `${dateStr}T22:00:00Z`,
    endTime: `2026-05-${String(day + 1).padStart(2, "0")}T07:00:00Z`,
    staffOnDuty: ["staff-wn-01"],
    staffCount: 1,
    requiredStaffCount: 1,
    checks: generateNightChecks(dateStr, ["child-alex", "child-jordan", "child-sam"]),
    incidents: hasIncident ? [{
      id: `inc-${dateStr}`,
      childId: "child-jordan",
      childName: "Jordan Clarke",
      timestamp: `${dateStr}T02:30:00Z`,
      type: i === 2 ? "nightmare" as const : "noise_disturbance" as const,
      severity: "low" as const,
      description: i === 2 ? "Night terror episode — woke distressed, calmed within 10 mins" : "Playing music at 2am, asked to turn off",
      actionTaken: i === 2 ? "Sat with child, offered warm drink, read story until settled" : "Reminded about house rules, turned music off",
      escalated: false,
      resolved: true,
      resolvedTime: `${dateStr}T02:45:00Z`,
      recordedBy: "staff-wn-01",
    }] : [],
    handoverCompleted: i !== 5, // one shift missed handover
    handoverNotes: i !== 5 ? "All children settled. No concerns to carry forward." : undefined,
    handoverTime: i !== 5 ? `2026-05-${String(day + 1).padStart(2, "0")}T07:00:00Z` : undefined,
    allChecksCompleted: i !== 3, // one shift had incomplete checks
    missedChecks: i === 3 ? 2 : 0,
  };
});

const DEMO_SLEEP_PATTERNS: SleepPattern[] = Array.from({ length: 14 }, (_, i) => {
  const day = 16 - i;
  const dateStr = `2026-05-${String(day).padStart(2, "0")}`;
  return [
    { childId: "child-alex", childName: "Alex Turner", date: dateStr, estimatedSleepTime: "22:30", estimatedWakeTime: "07:00", totalSleepHours: 8.5, wakingEpisodes: 0, overallQuality: "good" as const },
    { childId: "child-jordan", childName: "Jordan Clarke", date: dateStr, estimatedSleepTime: "23:00", estimatedWakeTime: "06:00", totalSleepHours: i === 2 || i === 7 ? 5.5 : 7.0, wakingEpisodes: i === 2 ? 2 : i === 7 ? 1 : 0, overallQuality: (i === 2 || i === 7 ? "poor" : "fair") as "poor" | "fair" | "good", notes: i === 2 ? "Night terror disturbed sleep" : undefined },
    { childId: "child-sam", childName: "Sam Patel", date: dateStr, estimatedSleepTime: "21:30", estimatedWakeTime: "07:30", totalSleepHours: 10, wakingEpisodes: 0, overallQuality: "good" as const },
  ];
}).flat();

// ── GET Handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") ?? "home-oak";
  const mode = searchParams.get("mode") ?? "dashboard";
  const date = searchParams.get("date");

  const now = new Date().toISOString();

  if (mode === "shift" && date) {
    const shift = DEMO_SHIFTS.find(s => s.date === date);
    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }
    const compliance = evaluateNightShiftCompliance(shift, CHECK_PLANS);
    const patterns = DEMO_SLEEP_PATTERNS.filter(sp => sp.date === date);
    return NextResponse.json({ compliance, shift, sleepPatterns: patterns });
  }

  if (mode === "metrics") {
    const metrics = calculateHomeNightMetrics(DEMO_SHIFTS, CHECK_PLANS, DEMO_SLEEP_PATTERNS, homeId, now);
    return NextResponse.json(metrics);
  }

  // Dashboard mode
  const metrics = calculateHomeNightMetrics(DEMO_SHIFTS, CHECK_PLANS, DEMO_SLEEP_PATTERNS, homeId, now);
  const lastShift = DEMO_SHIFTS[0];
  const lastShiftCompliance = evaluateNightShiftCompliance(lastShift, CHECK_PLANS);

  return NextResponse.json({
    metrics: {
      totalNightsRecorded: metrics.totalNightsRecorded,
      overallComplianceRate: metrics.overallComplianceRate,
      averageCheckCompletionRate: metrics.averageCheckCompletionRate,
      handoverCompletionRate: metrics.handoverCompletionRate,
      totalIncidents30Days: metrics.totalIncidents30Days,
      averageSleepHours: metrics.averageSleepHours,
      poorSleepRate: metrics.poorSleepRate,
      missedCheckRate: metrics.missedCheckRate,
      nightsWithIssues: metrics.nightsWithIssues,
    },
    lastShift: {
      date: lastShift.date,
      compliant: lastShiftCompliance.isCompliant,
      staffCount: lastShift.staffCount,
      checksRecorded: lastShiftCompliance.totalChecksRecorded,
      checkRate: lastShiftCompliance.checkCompletionRate,
      incidents: lastShift.incidents.length,
      handoverCompleted: lastShift.handoverCompleted,
    },
    childrenWithSleepIssues: metrics.childrenWithSleepIssues,
    incidentsByType: metrics.incidentsByType,
    recentShifts: metrics.recentShifts,
    checkPlans: CHECK_PLANS.map(p => ({
      childId: p.childId,
      childName: p.childName,
      frequency: p.frequency,
      riskLevel: p.riskLevel,
    })),
  });
}

// ── POST Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (action === "evaluate") {
    const { shift, checkPlans } = body;
    if (!shift || !checkPlans) {
      return NextResponse.json({ error: "shift and checkPlans required" }, { status: 400 });
    }
    const result = evaluateNightShiftCompliance(shift, checkPlans);
    return NextResponse.json(result);
  }

  if (action === "metrics") {
    const { shifts, checkPlans, sleepPatterns, homeId } = body;
    if (!shifts || !checkPlans || !homeId) {
      return NextResponse.json({ error: "shifts, checkPlans, homeId required" }, { status: 400 });
    }
    const result = calculateHomeNightMetrics(shifts, checkPlans, sleepPatterns ?? [], homeId);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
