// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/recording-quality
//
// POST — Score a single recording for quality dimensions
// GET  — Score a batch of recent recordings for a home/child
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { scoreRecordingQuality, scoreBatch, type RecordingInput } from "@/lib/cara/recording-quality";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

// ── POST: Score a single recording ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, entryType, moodScore, isSignificant, childName } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const input: RecordingInput = {
      content,
      entryType: entryType ?? "general",
      moodScore: moodScore ?? null,
      isSignificant: isSignificant ?? false,
      childName: childName ?? undefined,
    };

    const score = scoreRecordingQuality(input);
    return NextResponse.json({ ok: true, data: score });
  } catch (err) {
    console.error("[cara/recording-quality] POST error:", err);
    return NextResponse.json({ error: "Failed to score recording" }, { status: 500 });
  }
}

// ── GET: Batch score recent recordings ───────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const homeId = req.nextUrl.searchParams.get("homeId") ?? "home_oak";
    const childId = req.nextUrl.searchParams.get("childId");
    const days = parseInt(req.nextUrl.searchParams.get("days") ?? "7", 10);

    if (!isSupabaseEnabled()) {
      // Demo batch scoring
      const demoInputs: RecordingInput[] = [
        { content: "Alex had a good day. Went to school.", entryType: "general", moodScore: 4 },
        { content: 'Jordan was quiet this morning. Said "I just want to be left alone" when offered breakfast. Went to room at 8:15am. Came down at 10am in better spirits. Staff used PACE approach — offered choice of activities. Jordan chose cooking. Made pasta from scratch — seemed proud. Mood lifted noticeably by lunchtime.', entryType: "general", moodScore: 3, isSignificant: false },
        { content: 'Sam had a phone call with mum at 5pm. Was slightly anxious beforehand — fidgeting, asked twice if the call was definitely happening. The call lasted 20 minutes. Sam said afterwards "it was nice, she asked about my DofE". No distress observed. Will monitor mood over next 24 hours as previous calls have sometimes led to low mood the following day.', entryType: "contact", moodScore: 3 },
        { content: "Incident occurred. Verbal aggression.", entryType: "incident", isSignificant: true },
        { content: 'Key work session with Sam today. Discussed the upcoming DofE expedition. Sam expressed nervousness about sleeping away from home but said "I really want to do it". We talked about what to pack and coping strategies. Agreed action: Sam will write a list of worries to bring to next session. Follow-up session booked for Thursday.', entryType: "key_work", moodScore: 4 },
      ];

      const batchResult = scoreBatch(demoInputs);
      const individualScores = demoInputs.map((input, i) => ({
        index: i,
        entryType: input.entryType,
        ...scoreRecordingQuality(input),
      }));

      return NextResponse.json({
        ok: true,
        data: {
          batch: batchResult,
          individual: individualScores,
          period: { days, homeId, childId },
        },
      });
    }

    // Live: fetch recent daily logs
    const sb = createServerClient();
    if (!sb) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

    let query = (sb.from("cs_daily_logs") as SB)
      .select("content, entry_type, mood_score, is_significant, child_id, date, time, created_at")
      .eq("home_id", homeId)
      .gte("date", cutoff)
      .order("date", { ascending: false })
      .limit(50);

    if (childId) {
      query = query.eq("child_id", childId);
    }

    const { data: logs } = await query;

    if (!logs || logs.length === 0) {
      return NextResponse.json({
        ok: true,
        data: { batch: scoreBatch([]), individual: [], period: { days, homeId, childId } },
      });
    }

    const inputs: RecordingInput[] = (logs as { content: string; entry_type: string; mood_score: number | null; is_significant: boolean; child_id: string; date: string; time: string; created_at: string }[]).map((log) => ({
      content: log.content ?? "",
      entryType: log.entry_type ?? "general",
      moodScore: log.mood_score,
      isSignificant: log.is_significant ?? false,
      recordedAt: log.created_at,
      eventTime: log.time ? `${log.date}T${log.time}` : log.date,
    }));

    const batchResult = scoreBatch(inputs);
    const individualScores = inputs.map((input, i) => ({
      index: i,
      entryType: input.entryType,
      ...scoreRecordingQuality(input),
    }));

    return NextResponse.json({
      ok: true,
      data: {
        batch: batchResult,
        individual: individualScores,
        period: { days, homeId, childId },
      },
    });
  } catch (err) {
    console.error("[cara/recording-quality] GET error:", err);
    return NextResponse.json({ error: "Failed to score batch" }, { status: 500 });
  }
}
