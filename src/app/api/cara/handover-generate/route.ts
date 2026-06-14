// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/handover-generate
//
// POST — Generates a shift handover briefing from today's records.
//        Aggregates daily logs, incidents, medication events, key work sessions,
//        and mood scores for the specified shift period, then formats them into
//        a structured handover note for the incoming team.
//
// This embodies the Cara principle: "Capture once, link intelligently,
// surface everywhere, never duplicate."
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { orchestrate } from "@/lib/cara/orchestrator";
import type { CaraRequest } from "@/lib/cara/orchestrator/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

interface HandoverGenerateRequest {
  homeId: string;
  userId: string;
  role: string;
  shiftDate: string;       // YYYY-MM-DD
  shiftPeriod: "morning" | "afternoon" | "night" | "full_day";
  includeModules?: string[];
}

interface ShiftData {
  dailyLogs: { child_name: string; entry_type: string; content: string; time: string; mood_score?: number }[];
  incidents: { reference: string; type: string; severity: string; description: string; child_name: string; time: string }[];
  medications: { child_name: string; medication: string; status: string; time: string; notes?: string }[];
  keyWork: { child_name: string; type: string; summary: string; mood_after?: number }[];
  concerns: { category: string; detail: string; child_name?: string }[];
  positives: { detail: string; child_name?: string }[];
}

// ── Demo handover data ───────────────────────────────────────────────────────

function getDemoShiftData(): ShiftData {
  return {
    dailyLogs: [
      { child_name: "Alex T", entry_type: "general", content: "Good morning. Alex woke up in a positive mood, had breakfast with staff. Talking about school project excitedly.", time: "07:30", mood_score: 4 },
      { child_name: "Alex T", entry_type: "education", content: "Alex attended school today — full day. Teacher reported good engagement in English and Art.", time: "15:45", mood_score: 4 },
      { child_name: "Jordan P", entry_type: "general", content: "Jordan had a quieter morning, requested time alone in room after breakfast. Came downstairs at 11am in better spirits.", time: "08:15", mood_score: 2 },
      { child_name: "Jordan P", entry_type: "activity", content: "Jordan joined the cooking activity this afternoon — made pasta from scratch. Seemed proud of the result.", time: "14:00", mood_score: 4 },
      { child_name: "Sam R", entry_type: "general", content: "Sam had a calm day. Completed homework independently and asked to go to the park with staff after tea.", time: "16:30", mood_score: 3 },
      { child_name: "Sam R", entry_type: "contact", content: "Phone call with mum scheduled for 5pm. Sam seemed slightly anxious beforehand but the call went well — 20 minutes, positive tone.", time: "17:20", mood_score: 3 },
    ],
    incidents: [
      { reference: "INC-2026-0121", type: "verbal_aggression", severity: "low", description: "Jordan became verbally frustrated when asked to tidy room. Used raised voice for 2 minutes. De-escalated by offering choice and giving 5 minutes space.", child_name: "Jordan P", time: "11:45" },
    ],
    medications: [
      { child_name: "Jordan P", medication: "Melatonin 2mg", status: "administered", time: "21:00" },
      { child_name: "Alex T", medication: "Vitamin D", status: "administered", time: "08:00" },
    ],
    keyWork: [
      { child_name: "Sam R", type: "informal_chat", summary: "Brief key work chat about upcoming DofE expedition. Sam is nervous but excited. Discussed what to pack.", mood_after: 4 },
    ],
    concerns: [
      { category: "wellbeing", detail: "Jordan's mood was low this morning. Monitor tomorrow — if pattern continues, consider speaking to CAMHS.", child_name: "Jordan P" },
    ],
    positives: [
      { detail: "Alex completed a full day at school — 5th consecutive day. Celebrate at team meeting.", child_name: "Alex T" },
      { detail: "Jordan joined cooking activity voluntarily and engaged well.", child_name: "Jordan P" },
      { detail: "Sam managed phone call with mum without needing staff support during the call.", child_name: "Sam R" },
    ],
  };
}

// ── Format shift data into context for Cara ──────────────────────────────────

function formatShiftDataForPrompt(data: ShiftData, shiftDate: string, shiftPeriod: string): string {
  const parts: string[] = [];

  parts.push(`═══ SHIFT DATA: ${shiftDate} (${shiftPeriod}) ═══\n`);

  if (data.dailyLogs.length > 0) {
    parts.push("── DAILY LOGS ──");
    for (const log of data.dailyLogs) {
      parts.push(`[${log.time}] ${log.child_name} (${log.entry_type}${log.mood_score ? `, mood: ${log.mood_score}/5` : ""}): ${log.content}`);
    }
    parts.push("");
  }

  if (data.incidents.length > 0) {
    parts.push("── INCIDENTS ──");
    for (const inc of data.incidents) {
      parts.push(`[${inc.time}] ${inc.reference} — ${inc.child_name}: ${inc.type} (${inc.severity}). ${inc.description}`);
    }
    parts.push("");
  }

  if (data.medications.length > 0) {
    parts.push("── MEDICATIONS ──");
    for (const med of data.medications) {
      parts.push(`[${med.time}] ${med.child_name}: ${med.medication} — ${med.status}${med.notes ? ` (${med.notes})` : ""}`);
    }
    parts.push("");
  }

  if (data.keyWork.length > 0) {
    parts.push("── KEY WORK SESSIONS ──");
    for (const kw of data.keyWork) {
      parts.push(`${kw.child_name} (${kw.type}): ${kw.summary}`);
    }
    parts.push("");
  }

  if (data.concerns.length > 0) {
    parts.push("── CONCERNS TO HAND OVER ──");
    for (const c of data.concerns) {
      parts.push(`⚠ ${c.child_name ? `${c.child_name} — ` : ""}${c.category}: ${c.detail}`);
    }
    parts.push("");
  }

  if (data.positives.length > 0) {
    parts.push("── POSITIVES ──");
    for (const p of data.positives) {
      parts.push(`✓ ${p.child_name ? `${p.child_name} — ` : ""}${p.detail}`);
    }
  }

  return parts.join("\n");
}

// ── Live data fetch ──────────────────────────────────────────────────────────

async function fetchLiveShiftData(homeId: string, shiftDate: string, _shiftPeriod: string): Promise<ShiftData> {
  const sb = createServerClient();
  if (!sb) return getDemoShiftData();

  const data: ShiftData = {
    dailyLogs: [],
    incidents: [],
    medications: [],
    keyWork: [],
    concerns: [],
    positives: [],
  };

  // Fetch daily logs
  const { data: logs } = await (sb.from("cs_daily_logs") as SB)
    .select("child_id, entry_type, content, time, mood_score")
    .eq("home_id", homeId)
    .eq("date", shiftDate)
    .order("time", { ascending: true })
    .limit(50);

  if (logs) {
    data.dailyLogs = (logs as { child_id: string; entry_type: string; content: string; time: string; mood_score?: number }[]).map((l) => ({
      child_name: l.child_id,
      entry_type: l.entry_type,
      content: l.content,
      time: l.time ?? "00:00",
      mood_score: l.mood_score ?? undefined,
    }));
  }

  // Fetch incidents
  const { data: incidents } = await (sb.from("cs_incidents") as SB)
    .select("reference, type, severity, description, child_id, time")
    .eq("home_id", homeId)
    .eq("date", shiftDate)
    .order("time", { ascending: true })
    .limit(20);

  if (incidents) {
    data.incidents = (incidents as { reference: string; type: string; severity: string; description: string; child_id: string; time: string }[]).map((i) => ({
      reference: i.reference,
      type: i.type,
      severity: i.severity,
      description: i.description,
      child_name: i.child_id,
      time: i.time ?? "00:00",
    }));
  }

  // Fetch key work sessions
  const { data: keyWork } = await (sb.from("cs_key_work_sessions") as SB)
    .select("child_id, type, child_voice, worker_observations, mood_after")
    .eq("home_id", homeId)
    .eq("date", shiftDate)
    .limit(10);

  if (keyWork) {
    data.keyWork = (keyWork as { child_id: string; type: string; child_voice: string; worker_observations: string; mood_after?: number }[]).map((kw) => ({
      child_name: kw.child_id,
      type: kw.type,
      summary: [kw.worker_observations, kw.child_voice].filter(Boolean).join(" | "),
      mood_after: kw.mood_after ?? undefined,
    }));
  }

  return data;
}

// ── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HandoverGenerateRequest;

    if (!body.homeId || !body.userId || !body.role) {
      return NextResponse.json(
        { error: "homeId, userId, and role are required" },
        { status: 400 },
      );
    }

    const shiftDate = body.shiftDate ?? new Date().toISOString().slice(0, 10);
    const shiftPeriod = body.shiftPeriod ?? "full_day";

    // Fetch shift data
    const shiftData = isSupabaseEnabled()
      ? await fetchLiveShiftData(body.homeId, shiftDate, shiftPeriod)
      : getDemoShiftData();

    const shiftContext = formatShiftDataForPrompt(shiftData, shiftDate, shiftPeriod);

    // Route through orchestrator for intelligent handover generation
    const request: CaraRequest = {
      userId: body.userId,
      homeId: body.homeId,
      role: body.role,
      query: `Generate a structured shift handover briefing for the incoming team based on today's shift data. Include: per-child summary, outstanding actions, concerns to monitor, medications given, incidents summary, and positives to celebrate. Format clearly with headings.`,
      sourceContext: shiftContext,
      requestedAction: "report",
      currentPage: "handover",
    };

    const response = await orchestrate(request);

    // Also return the raw data for the UI to display if preferred
    return NextResponse.json({
      ok: true,
      data: {
        handover: response,
        shiftData,
        shiftDate,
        shiftPeriod,
        childCount: new Set([
          ...shiftData.dailyLogs.map((l) => l.child_name),
          ...shiftData.incidents.map((i) => i.child_name),
        ]).size,
        incidentCount: shiftData.incidents.length,
        positiveCount: shiftData.positives.length,
      },
    });
  } catch (err) {
    console.error("[cara/handover-generate] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate handover briefing" },
      { status: 500 },
    );
  }
}
