// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/today-briefing
//
// GET — Generates an Cara morning briefing for the Registered Manager.
//       Aggregates signals across all home systems to surface what needs
//       attention today: overdue items, risk changes, compliance gaps,
//       upcoming deadlines, unresolved incidents, missing oversight, and
//       positive progress to celebrate.
//
// This is the "tell me what I need to know" intelligence layer.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { isLiveTenant } from "@/lib/db/live-mode";
import { tenantHomeId } from "@/lib/supabase/tenant";
import { todayStr } from "@/lib/utils";
import type { SB } from "@/lib/supabase/loose-client";
import { dal } from "@/lib/db/dal";

// ── Signal Types ─────────────────────────────────────────────────────────────

export type SignalSeverity = "critical" | "high" | "medium" | "low" | "positive";
export type SignalCategory =
  | "safeguarding"
  | "incident"
  | "compliance"
  | "oversight"
  | "staffing"
  | "health"
  | "education"
  | "wellbeing"
  | "deadline"
  | "positive";

export interface TodaySignal {
  id: string;
  severity: SignalSeverity;
  category: SignalCategory;
  title: string;
  detail: string;
  actionRequired?: string;
  childName?: string;
  dueDate?: string;
  sourceModule: string;
  sourceId?: string;
}

export interface TodayBriefing {
  date: string;
  homeId: string;
  homeName: string;
  generatedAt: string;
  signalCount: number;
  criticalCount: number;
  highCount: number;
  positiveCount: number;
  signals: TodaySignal[];
  summary: string;
  topPriorities: string[];
}

// ── Demo Briefing Generator ──────────────────────────────────────────────────

function generateDemoBriefing(homeId: string): TodayBriefing {
  const today = todayStr();
  const todayDate = new Date();
  const dayOfWeek = todayDate.toLocaleDateString("en-GB", { weekday: "long" });

  const signals: TodaySignal[] = [
    // Critical
    {
      id: "sig_001",
      severity: "critical",
      category: "safeguarding",
      title: "Return interview overdue",
      detail: "Alex's return interview from missing episode on 14 May has not been completed. Statutory requirement is within 72 hours of return.",
      actionRequired: "Complete return interview today — assign to key worker or independent person",
      childName: "Alex T",
      dueDate: today,
      sourceModule: "missing_episodes",
      sourceId: "me_001",
    },
    // High
    {
      id: "sig_002",
      severity: "high",
      category: "oversight",
      title: "3 incidents without management oversight",
      detail: "Three incidents from this week have not yet received management oversight. Reg 40 requires the RM to monitor the effectiveness of care.",
      actionRequired: "Review and add oversight comments to incidents INC-2026-0118, INC-2026-0119, INC-2026-0120",
      sourceModule: "incidents",
    },
    {
      id: "sig_003",
      severity: "high",
      category: "compliance",
      title: "Reg 44 visit due in 3 days",
      detail: "The independent visitor's monthly Reg 44 visit is scheduled for 19 May. Ensure all records are up to date and young people are prepared to participate.",
      actionRequired: "Brief staff at handover, confirm visitor attendance, update recording log",
      dueDate: new Date(todayDate.getTime() + 3 * 86400000).toISOString().slice(0, 10),
      sourceModule: "compliance",
    },
    {
      id: "sig_004",
      severity: "high",
      category: "staffing",
      title: "Night shift cover gap tomorrow",
      detail: "No confirmed night waking staff for tomorrow's shift (17 May). Current rota shows a vacancy. Minimum staffing per statement of purpose: 2 staff overnight.",
      actionRequired: "Arrange night cover — contact agency or request overtime from staff",
      dueDate: new Date(todayDate.getTime() + 86400000).toISOString().slice(0, 10),
      sourceModule: "rota",
    },
    // Medium
    {
      id: "sig_005",
      severity: "medium",
      category: "health",
      title: "Medication review meeting tomorrow",
      detail: "Jordan's CAMHS medication review is scheduled for tomorrow at 2pm. Ensure behaviour logs from the last 4 weeks are prepared.",
      actionRequired: "Print/export behaviour log summary for CAMHS clinician",
      childName: "Jordan P",
      dueDate: new Date(todayDate.getTime() + 86400000).toISOString().slice(0, 10),
      sourceModule: "health",
    },
    {
      id: "sig_006",
      severity: "medium",
      category: "education",
      title: "PEP meeting scheduled — no key worker assigned",
      detail: "Sam's Personal Education Plan meeting is next Tuesday but no key worker has been assigned to attend. Social worker expects home representation.",
      actionRequired: "Assign key worker to attend PEP meeting on 20 May",
      childName: "Sam R",
      dueDate: new Date(todayDate.getTime() + 4 * 86400000).toISOString().slice(0, 10),
      sourceModule: "education",
    },
    {
      id: "sig_007",
      severity: "medium",
      category: "deadline",
      title: "Key work sessions due this week",
      detail: "2 young people are due key work sessions this week: Alex T (last session 12 days ago) and Jordan P (14 days). Care plans specify fortnightly key work.",
      actionRequired: "Schedule key work sessions with Alex and Jordan before Friday",
      sourceModule: "key_work",
    },
    {
      id: "sig_008",
      severity: "medium",
      category: "compliance",
      title: "Supervision overdue for 1 staff member",
      detail: "Pat M's formal supervision was due 10 May but has not been recorded. Reg 33 requires regular supervision. Overdue by 6 days.",
      actionRequired: "Book and conduct supervision with Pat M this week",
      sourceModule: "supervision",
    },
    // Low
    {
      id: "sig_009",
      severity: "low",
      category: "wellbeing",
      title: "Jordan's mood improving — 3 consecutive positive days",
      detail: "Daily logs show Jordan has had 3 consecutive days with mood score 4+ (Good/Very Good). This follows a period of low mood last week.",
      childName: "Jordan P",
      sourceModule: "daily_log",
    },
    // Positive
    {
      id: "sig_010",
      severity: "positive",
      category: "positive",
      title: "Alex attended school all week",
      detail: "Alex achieved 100% school attendance this week (Mon-Fri). This is the first full week since placement. Consider acknowledging and celebrating this.",
      actionRequired: "Celebrate achievement — verbal praise, pocket money bonus consideration",
      childName: "Alex T",
      sourceModule: "education",
    },
    {
      id: "sig_011",
      severity: "positive",
      category: "positive",
      title: "Zero incidents in the last 48 hours",
      detail: "No incidents have been recorded in the past 2 days. The team is maintaining a calm and consistent environment.",
      sourceModule: "incidents",
    },
    {
      id: "sig_012",
      severity: "positive",
      category: "positive",
      title: "Sam completed DofE volunteering section",
      detail: "Sam finished the required hours for the volunteering section of their Bronze DofE. Assessor report received and verified.",
      childName: "Sam R",
      sourceModule: "youth_awards",
    },
  ];

  const criticalCount = signals.filter((s) => s.severity === "critical").length;
  const highCount = signals.filter((s) => s.severity === "high").length;
  const positiveCount = signals.filter((s) => s.severity === "positive").length;

  const topPriorities: string[] = [];
  if (criticalCount > 0) {
    topPriorities.push(`${criticalCount} critical item${criticalCount > 1 ? "s" : ""} requiring immediate action`);
  }
  if (highCount > 0) {
    topPriorities.push(`${highCount} high-priority item${highCount > 1 ? "s" : ""} for today`);
  }
  topPriorities.push(`${positiveCount} positive developments to celebrate with the team`);

  const summary = `Good morning. It's ${dayOfWeek} ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long" })}. ` +
    `Cara has identified ${signals.length} signals across Chamberlain House today. ` +
    (criticalCount > 0
      ? `There ${criticalCount === 1 ? "is" : "are"} ${criticalCount} critical item${criticalCount > 1 ? "s" : ""} requiring immediate attention. `
      : "No critical concerns today. ") +
    (positiveCount > 0
      ? `On a positive note, there ${positiveCount === 1 ? "is" : "are"} ${positiveCount} achievement${positiveCount > 1 ? "s" : ""} worth celebrating.`
      : "");

  return {
    date: today,
    homeId,
    homeName: "Chamberlain House",
    generatedAt: new Date().toISOString(),
    signalCount: signals.length,
    criticalCount,
    highCount,
    positiveCount,
    signals,
    summary,
    topPriorities,
  };
}

// ── Live Briefing (Supabase) ─────────────────────────────────────────────────

async function generateLiveBriefing(homeId: string): Promise<TodayBriefing> {
  const sb = createServerClient();
  if (!sb) return generateDemoBriefing(homeId);

  const today = todayStr();
  const todayDate = new Date();
  const sevenDaysAgo = new Date(todayDate.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const fourteenDaysAgo = new Date(todayDate.getTime() - 14 * 86400000).toISOString().slice(0, 10);
  const yesterday = new Date(todayDate.getTime() - 86400000).toISOString().slice(0, 10);
  const signals: TodaySignal[] = [];

  // Canonical, live-safe reads via the dual-mode dal. The briefing previously
  // read a PARALLEL cs_* schema (cs_incidents / cs_safeguarding_concerns /
  // cs_missing_episodes / cs_children_homes / cs_daily_logs) that nothing writes
  // to on a live tenant, so it always surfaced zero signals. These hit the
  // tables the rest of Cara actually uses — incidents / missing_episodes /
  // young_people / daily_log_entries — plus cs_key_work_sessions, which IS the
  // canonical key-work table (read here via dal.keyWorkingSessions).
  const [incidents, missingEpisodes, keyWork, currentChildren, logs] = await Promise.all([
    dal.incidents.findAll(),
    dal.missingEpisodes.findAll(),
    dal.keyWorkingSessions.findAll(),
    dal.youngPeople.findAll().then((all) => all.filter((c) => c.status === "current")),
    dal.dailyLog.findAll(),
  ]);

  // 1. Incidents without management oversight in the last 7 days (HIGH)
  const unreviewedIncidents = incidents
    .filter((i) => i.requires_oversight && !i.oversight_by && i.date >= sevenDaysAgo)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (unreviewedIncidents.length > 0) {
    signals.push({
      id: `sig_incidents_${unreviewedIncidents.length}`,
      severity: unreviewedIncidents.length >= 3 ? "high" : "medium",
      category: "incident",
      title: `${unreviewedIncidents.length} incident${unreviewedIncidents.length > 1 ? "s" : ""} without management oversight`,
      detail: `Incidents ${unreviewedIncidents.map((i) => i.reference).join(", ")} need RM oversight (Reg 40).`,
      actionRequired: "Review and add oversight comments",
      sourceModule: "incidents",
    });
  }

  // 2. Missing episodes returned without a recorded return interview (CRITICAL)
  const returnInterviewsOverdue = missingEpisodes
    .filter((m) => m.date_returned && !m.return_interview_date)
    .sort((a, b) => (b.date_returned ?? "").localeCompare(a.date_returned ?? ""));
  if (returnInterviewsOverdue.length > 0) {
    signals.push({
      id: "sig_return_interview",
      severity: "critical",
      category: "safeguarding",
      title: `${returnInterviewsOverdue.length} return interview${returnInterviewsOverdue.length > 1 ? "s" : ""} overdue`,
      detail: "Statutory guidance requires return interviews within 72 hours of a child returning from a missing episode.",
      actionRequired: "Arrange return interviews immediately",
      sourceModule: "missing_episodes",
    });
  }

  // 3. Key work sessions overdue — no session in the last 14 days (MEDIUM)
  const childrenWithRecentKeyWork = new Set(
    keyWork.filter((k) => k.date >= fourteenDaysAgo).map((k) => k.child_id),
  );
  const childrenMissingKeyWork = currentChildren.filter((c) => !childrenWithRecentKeyWork.has(c.id));
  if (childrenMissingKeyWork.length > 0) {
    signals.push({
      id: "sig_key_work_overdue",
      severity: "medium",
      category: "deadline",
      title: `${childrenMissingKeyWork.length} young ${childrenMissingKeyWork.length > 1 ? "people" : "person"} overdue key work session`,
      detail: "Care plans specify fortnightly key work sessions. No sessions recorded in the last 14 days for these young people.",
      actionRequired: "Schedule key work sessions this week",
      sourceModule: "key_work",
    });
  }

  // 4. Daily log gaps from yesterday (MEDIUM)
  if (currentChildren.length > 0) {
    const childrenLoggedYesterday = new Set(
      logs.filter((l) => l.date.slice(0, 10) === yesterday).map((l) => l.child_id),
    );
    if (childrenLoggedYesterday.size < currentChildren.length) {
      const missingLogs = currentChildren.length - childrenLoggedYesterday.size;
      signals.push({
        id: "sig_log_gap",
        severity: "medium",
        category: "compliance",
        title: `${missingLogs} daily log${missingLogs > 1 ? "s" : ""} missing from yesterday`,
        detail: `Only ${childrenLoggedYesterday.size} of ${currentChildren.length} young people had daily logs recorded yesterday. Reg 36 requires accurate and up-to-date records.`,
        actionRequired: "Speak with staff on yesterday's shift about completing records",
        sourceModule: "daily_log",
      });
    }
  }

  // 5. Positive: no incidents recorded today (POSITIVE)
  const incidentsToday = incidents.filter((i) => i.date.slice(0, 10) === today).length;
  if (incidentsToday === 0) {
    signals.push({
      id: "sig_no_incidents",
      severity: "positive",
      category: "positive",
      title: "No incidents recorded today",
      detail: "The home is running smoothly with no incidents so far today.",
      sourceModule: "incidents",
    });
  }

  // (The previous "open safeguarding concerns" signal read cs_safeguarding_concerns,
  // for which there is no canonical table or writer on a live tenant. Omitted
  // rather than fabricated from an unrelated source; reinstate when a discrete
  // safeguarding-concern record type exists.)

  // Sort: critical first, then high, medium, low, positive
  const severityOrder: Record<SignalSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, positive: 4 };
  signals.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const criticalCount = signals.filter((s) => s.severity === "critical").length;
  const highCount = signals.filter((s) => s.severity === "high").length;
  const positiveCount = signals.filter((s) => s.severity === "positive").length;
  const dayOfWeek = todayDate.toLocaleDateString("en-GB", { weekday: "long" });

  const topPriorities: string[] = [];
  if (criticalCount > 0) topPriorities.push(`${criticalCount} critical item${criticalCount > 1 ? "s" : ""} requiring immediate action`);
  if (highCount > 0) topPriorities.push(`${highCount} high-priority item${highCount > 1 ? "s" : ""} for today`);
  if (positiveCount > 0) topPriorities.push(`${positiveCount} positive development${positiveCount > 1 ? "s" : ""}`);

  const summary = `Good morning. It's ${dayOfWeek} ${todayDate.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}. ` +
    `Cara has identified ${signals.length} signals across your home today. ` +
    (criticalCount > 0
      ? `There ${criticalCount === 1 ? "is" : "are"} ${criticalCount} critical item${criticalCount > 1 ? "s" : ""} requiring immediate attention. `
      : "No critical concerns today. ") +
    (positiveCount > 0
      ? `On a positive note, there ${positiveCount === 1 ? "is" : "are"} ${positiveCount} positive development${positiveCount > 1 ? "s" : ""} to celebrate.`
      : "");

  // Get home name. The home lives in `homes` (live, typed); `cs_homes` has no
  // migration, so the old read returned null and the briefing's home name was
  // blank on a live tenant.
  const { data: homeData } = await (sb.from("homes") as SB)
    .select("name")
    .eq("id", homeId)
    .single();

  return {
    date: today,
    homeId,
    homeName: homeData?.name ?? "Your Home",
    generatedAt: new Date().toISOString(),
    signalCount: signals.length,
    criticalCount,
    highCount,
    positiveCount,
    signals,
    summary,
    topPriorities,
  };
}

// ── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const homeId = req.nextUrl.searchParams.get("homeId") ?? (isLiveTenant() ? tenantHomeId() : "home_oak");

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: generateDemoBriefing(homeId) });
    }

    const briefing = await generateLiveBriefing(homeId);
    return NextResponse.json({ ok: true, data: briefing });
  } catch (err) {
    console.error("[cara/today-briefing] Error:", err);
    const homeId = req.nextUrl.searchParams.get("homeId") ?? (isLiveTenant() ? tenantHomeId() : "home_oak");
    // A live tenant hitting a transient error must NOT fall back to demo —
    // that would surface "Chamberlain House" as their home name on any glitch.
    // Return a real error; the frontend already handles missing data.
    if (isSupabaseEnabled()) {
      return NextResponse.json({ ok: false, error: "Failed to generate briefing" }, { status: 503 });
    }
    // Demo mode: the fallback is fine (and expected) here.
    return NextResponse.json({ ok: true, data: generateDemoBriefing(homeId) });
  }
}
