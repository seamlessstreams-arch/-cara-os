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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

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
  const today = new Date().toISOString().slice(0, 10);
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

  const today = new Date().toISOString().slice(0, 10);
  const todayDate = new Date();
  const sevenDaysAgo = new Date(todayDate.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const signals: TodaySignal[] = [];

  // 1. Incidents without oversight (HIGH)
  const { data: unreviewedIncidents } = await (sb.from("cs_incidents") as SB)
    .select("id, reference, type, severity, date, child_id")
    .eq("home_id", homeId)
    .is("oversight_by", null)
    .eq("requires_oversight", true)
    .gte("date", sevenDaysAgo)
    .order("date", { ascending: false });

  if (unreviewedIncidents && unreviewedIncidents.length > 0) {
    signals.push({
      id: `sig_incidents_${unreviewedIncidents.length}`,
      severity: unreviewedIncidents.length >= 3 ? "high" : "medium",
      category: "incident",
      title: `${unreviewedIncidents.length} incident${unreviewedIncidents.length > 1 ? "s" : ""} without management oversight`,
      detail: `Incidents ${unreviewedIncidents.map((i: { reference: string }) => i.reference).join(", ")} need RM oversight (Reg 40).`,
      actionRequired: "Review and add oversight comments",
      sourceModule: "incidents",
    });
  }

  // 2. Open safeguarding concerns (CRITICAL)
  const { data: openSafeguarding } = await (sb.from("cs_safeguarding_concerns") as SB)
    .select("id, category, child_id, created_at")
    .eq("home_id", homeId)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(10);

  if (openSafeguarding && openSafeguarding.length > 0) {
    signals.push({
      id: "sig_safeguarding_open",
      severity: "critical",
      category: "safeguarding",
      title: `${openSafeguarding.length} open safeguarding concern${openSafeguarding.length > 1 ? "s" : ""}`,
      detail: "Open safeguarding concerns require active management and multi-agency coordination.",
      actionRequired: "Review status and progress of all open safeguarding concerns",
      sourceModule: "safeguarding",
    });
  }

  // 3. Missing episodes without return interview (CRITICAL)
  const { data: missingNoInterview } = await (sb.from("cs_missing_episodes") as SB)
    .select("id, child_id, date_missing, date_returned")
    .eq("home_id", homeId)
    .not("date_returned", "is", null)
    .eq("return_interview_completed", false)
    .order("date_returned", { ascending: false })
    .limit(5);

  if (missingNoInterview && missingNoInterview.length > 0) {
    signals.push({
      id: "sig_return_interview",
      severity: "critical",
      category: "safeguarding",
      title: `${missingNoInterview.length} return interview${missingNoInterview.length > 1 ? "s" : ""} overdue`,
      detail: "Statutory guidance requires return interviews within 72 hours of a child returning from a missing episode.",
      actionRequired: "Arrange return interviews immediately",
      sourceModule: "missing_episodes",
    });
  }

  // 4. Key work sessions overdue (MEDIUM)
  const { data: recentKeyWork } = await (sb.from("cs_key_work_sessions") as SB)
    .select("id, child_id, date")
    .eq("home_id", homeId)
    .gte("date", new Date(todayDate.getTime() - 14 * 86400000).toISOString().slice(0, 10))
    .order("date", { ascending: false });

  const { data: children } = await (sb.from("cs_children_homes") as SB)
    .select("child_id")
    .eq("home_id", homeId)
    .eq("status", "active");

  if (children && recentKeyWork) {
    const childrenWithKeyWork = new Set((recentKeyWork as { child_id: string }[]).map((kw) => kw.child_id));
    const childrenMissingKeyWork = (children as { child_id: string }[]).filter(
      (c) => !childrenWithKeyWork.has(c.child_id)
    );
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
  }

  // 5. Daily log gaps (MEDIUM)
  const yesterday = new Date(todayDate.getTime() - 86400000).toISOString().slice(0, 10);
  const { data: yesterdayLogs, count: logCount } = await (sb.from("cs_daily_logs") as SB)
    .select("id", { count: "exact" })
    .eq("home_id", homeId)
    .eq("date", yesterday);

  if (children && logCount !== null && children.length > 0 && logCount < children.length) {
    const missing = children.length - logCount;
    signals.push({
      id: "sig_log_gap",
      severity: "medium",
      category: "compliance",
      title: `${missing} daily log${missing > 1 ? "s" : ""} missing from yesterday`,
      detail: `Only ${logCount} of ${children.length} young people had daily logs recorded yesterday. Reg 36 requires accurate and up-to-date records.`,
      actionRequired: "Speak with staff on yesterday's shift about completing records",
      sourceModule: "daily_log",
    });
  }

  // 6. Positive: Zero incidents today (POSITIVE)
  const { count: todayIncidents } = await (sb.from("cs_incidents") as SB)
    .select("id", { count: "exact" })
    .eq("home_id", homeId)
    .eq("date", today);

  if (todayIncidents === 0) {
    signals.push({
      id: "sig_no_incidents",
      severity: "positive",
      category: "positive",
      title: "No incidents recorded today",
      detail: "The home is running smoothly with no incidents so far today.",
      sourceModule: "incidents",
    });
  }

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

  // Get home name
  const { data: homeData } = await (sb.from("cs_homes") as SB)
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
    const homeId = req.nextUrl.searchParams.get("homeId") ?? "home_oak";

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: generateDemoBriefing(homeId) });
    }

    const briefing = await generateLiveBriefing(homeId);
    return NextResponse.json({ ok: true, data: briefing });
  } catch (err) {
    console.error("[cara/today-briefing] Error:", err);
    // Graceful fallback to demo
    const homeId = req.nextUrl.searchParams.get("homeId") ?? "home_oak";
    return NextResponse.json({ ok: true, data: generateDemoBriefing(homeId) });
  }
}
