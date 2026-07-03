// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/pattern-detection
//
// GET  — Analyse patterns for a child over a configurable window
// POST — Analyse patterns from provided event data (for testing/preview)
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { analysePatterns, type TimelineEvent } from "@/lib/cara/pattern-detection";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoEvents(childId: string): TimelineEvent[] {
  const today = new Date();
  const d = (daysAgo: number) => new Date(today.getTime() - daysAgo * 86400000).toISOString().slice(0, 10);

  return [
    // Sunday pattern — incidents cluster on Sundays (contact day)
    { id: "evt_1", date: d(3), time: "18:30", category: "incident", severity: 3, childId, tags: ["verbal"], moodBefore: 4, moodAfter: 2 },
    { id: "evt_2", date: d(10), time: "19:15", category: "incident", severity: 2, childId, tags: ["verbal"], moodBefore: 3, moodAfter: 2 },
    { id: "evt_3", date: d(17), time: "18:00", category: "aggression", severity: 3, childId, moodBefore: 3, moodAfter: 1 },
    { id: "evt_4", date: d(24), time: "17:45", category: "incident", severity: 2, childId, tags: ["property"], moodBefore: 4, moodAfter: 2 },

    // Family contact preceding negative events
    { id: "evt_5", date: d(3), time: "15:00", category: "family_contact", childId, moodBefore: 3, moodAfter: 2 },
    { id: "evt_6", date: d(10), time: "15:00", category: "family_contact", childId, moodBefore: 4, moodAfter: 3 },
    { id: "evt_7", date: d(17), time: "14:30", category: "family_contact", childId, moodBefore: 3, moodAfter: 2 },
    { id: "evt_8", date: d(24), time: "15:00", category: "family_contact", childId, moodBefore: 4, moodAfter: 2 },

    // Sleep disruption pattern — evening
    { id: "evt_9", date: d(2), time: "22:30", category: "sleep_disruption", childId },
    { id: "evt_10", date: d(5), time: "23:00", category: "sleep_disruption", childId },
    { id: "evt_11", date: d(9), time: "22:15", category: "sleep_disruption", childId },
    { id: "evt_12", date: d(14), time: "23:30", category: "sleep_disruption", childId },

    // Positive activities — increasing trend
    { id: "evt_13", date: d(25), category: "positive_activity", childId, tags: ["cooking"] },
    { id: "evt_14", date: d(20), category: "positive_activity", childId, tags: ["sports"] },
    { id: "evt_15", date: d(15), category: "positive_activity", childId, tags: ["cooking"] },
    { id: "evt_16", date: d(10), category: "positive_activity", childId, tags: ["music"] },
    { id: "evt_17", date: d(7), category: "positive_activity", childId, tags: ["DofE"] },
    { id: "evt_18", date: d(5), category: "positive_activity", childId, tags: ["cooking"] },
    { id: "evt_19", date: d(3), category: "positive_activity", childId, tags: ["sports"] },
    { id: "evt_20", date: d(1), category: "positive_activity", childId, tags: ["art"] },

    // Key work sessions
    { id: "evt_21", date: d(21), category: "key_work", childId },
    { id: "evt_22", date: d(14), category: "key_work", childId },
    { id: "evt_23", date: d(7), category: "key_work", childId },

    // Mood low events
    { id: "evt_24", date: d(3), time: "17:00", category: "mood_low", childId, moodBefore: 2, moodAfter: 2 },
    { id: "evt_25", date: d(10), time: "16:30", category: "mood_low", childId, moodBefore: 2, moodAfter: 2 },

    // School absence
    { id: "evt_26", date: d(8), category: "school_absence", childId },
    { id: "evt_27", date: d(11), category: "school_absence", childId },
  ];
}

// ── GET: Analyse patterns from database ─────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const childId = req.nextUrl.searchParams.get("childId") ?? "child_jordan";
    const homeId = req.nextUrl.searchParams.get("homeId") ?? "home_oak";
    const days = parseInt(req.nextUrl.searchParams.get("days") ?? "28", 10);

    if (!isSupabaseEnabled()) {
      // Demo mode
      const demoEvents = getDemoEvents(childId);
      const analysis = analysePatterns(demoEvents, childId, days);
      return NextResponse.json({ ok: true, data: analysis });
    }

    // Live mode — aggregate from multiple tables
    const sb = createServerClient();
    if (!sb) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const events: TimelineEvent[] = [];

    // Fetch incidents
    const { data: incidents } = await (sb.from("cs_incidents") as SB)
      .select("id, date, time, type, severity, child_id")
      .eq("home_id", homeId)
      .eq("child_id", childId)
      .gte("date", cutoff);

    if (incidents) {
      for (const inc of incidents as { id: string; date: string; time?: string; type?: string; severity?: number; child_id: string }[]) {
        events.push({
          id: inc.id,
          date: inc.date,
          time: inc.time,
          category: mapIncidentType(inc.type),
          severity: inc.severity,
          childId: inc.child_id,
        });
      }
    }

    // Fetch daily logs for mood/activity
    const { data: logs } = await (sb.from("cs_daily_logs") as SB)
      .select("id, date, time, entry_type, mood_score, is_significant, child_id, content")
      .eq("home_id", homeId)
      .eq("child_id", childId)
      .gte("date", cutoff);

    if (logs) {
      for (const log of logs as { id: string; date: string; time?: string; entry_type: string; mood_score?: number; is_significant?: boolean; child_id: string; content?: string }[]) {
        const cat = mapLogType(log.entry_type, log.mood_score, log.content);
        if (cat) {
          events.push({
            id: log.id,
            date: log.date,
            time: log.time,
            category: cat,
            childId: log.child_id,
            context: log.content,
          });
        }
      }
    }

    // Fetch missing episodes
    const { data: missing } = await (sb.from("cs_missing_episodes") as SB)
      .select("id, date, time_noticed, child_id")
      .eq("home_id", homeId)
      .eq("child_id", childId)
      .gte("date", cutoff);

    if (missing) {
      for (const ep of missing as { id: string; date: string; time_noticed?: string; child_id: string }[]) {
        events.push({
          id: ep.id,
          date: ep.date,
          time: ep.time_noticed,
          category: "missing",
          childId: ep.child_id,
          severity: 4,
        });
      }
    }

    const analysis = analysePatterns(events, childId, days);
    return NextResponse.json({ ok: true, data: analysis });
  } catch (err) {
    console.error("[cara/pattern-detection] GET error:", err);
    return NextResponse.json({ error: "Failed to analyse patterns" }, { status: 500 });
  }
}

// ── POST: Analyse provided events ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { events, childId, days } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "events array is required" }, { status: 400 });
    }

    const analysis = analysePatterns(events, childId ?? "child_unknown", days ?? 28);
    return NextResponse.json({ ok: true, data: analysis });
  } catch (err) {
    console.error("[cara/pattern-detection] POST error:", err);
    return NextResponse.json({ error: "Failed to analyse patterns" }, { status: 500 });
  }
}

// ── Type mapping helpers ────────────────────────────────────────────────────

function mapIncidentType(type?: string): TimelineEvent["category"] {
  if (!type) return "incident";
  const t = type.toLowerCase();
  if (t.includes("restraint")) return "restraint";
  if (t.includes("missing") || t.includes("absent")) return "missing";
  if (t.includes("self") && t.includes("harm")) return "self_harm";
  if (t.includes("aggression") || t.includes("assault")) return "aggression";
  if (t.includes("damage") || t.includes("property")) return "property_damage";
  if (t.includes("police")) return "police_involvement";
  return "incident";
}

function mapLogType(entryType: string, mood?: number, content?: string): TimelineEvent["category"] | null {
  const t = entryType.toLowerCase();
  if (t === "contact" || t === "family_contact") return "family_contact";
  if (t === "key_work") return "key_work";
  if (t === "positive" || t === "activity") return "positive_activity";
  if (t === "education" && content?.toLowerCase().includes("absent")) return "school_absence";
  if (mood !== undefined && mood <= 2) return "mood_low";
  if (mood !== undefined && mood >= 4) return "mood_high";
  return null; // Skip general entries without clear category
}
