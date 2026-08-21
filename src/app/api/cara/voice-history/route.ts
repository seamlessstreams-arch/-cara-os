// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/voice-history
//
// GET endpoint that fetches recent cara_sessions where task_type =
// 'voice_reflection' FOR THE CALLER THEMSELVES. Identity is taken from the
// validated session, never from query parameters: these are personal
// reflective journals, and the route previously scoped by a client-supplied
// homeId while ignoring userId entirely. Returns the last 20 sessions with
// their structured outputs. Degrades to demo data when Supabase is off.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { getRequestIdentity } from "@/lib/auth-guard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export interface VoiceHistoryEntry {
  id: string;
  createdAt: string;
  transcript: string;
  structuredOutput: string;
  riskLevel: string;
  agentUsed: string;
  status: string;
  inputType: string;
}

// ── Demo data for graceful degradation ───────────────────────────────────────

const DEMO_HISTORY: VoiceHistoryEntry[] = [
  {
    id: "demo-voice-001",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    transcript:
      "Shift handover — Jake had a good afternoon. Completed his homework without prompting. Ate dinner well. No concerns to pass on to night staff. Medication administered at 6pm as per MAR.",
    structuredOutput:
      "**Handover Summary**\n\n**Child:** Jake\n**Shift period:** Afternoon\n\n**Key observations:**\n- Homework completed independently (positive engagement)\n- Good appetite at dinner\n- No behavioural concerns\n\n**Medication:** Administered at 18:00 as per MAR\n\n**Actions for night staff:** None — routine evening expected.",
    riskLevel: "low",
    agentUsed: "voice_reflection_agent",
    status: "completed",
    inputType: "handover",
  },
  {
    id: "demo-voice-002",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    transcript:
      "Reflective journal — Today was tough. I felt out of my depth when Mia escalated during the morning routine. I stayed calm but afterwards felt shaky. I think I need more de-escalation training. Going to ask about this in supervision.",
    structuredOutput:
      "**Reflective Journal Entry**\n\n**Factual:**\n- Mia escalated during morning routine\n- Staff member maintained calm exterior\n\n**Reflective:**\n- Felt out of depth during the incident\n- Physical response (shakiness) after the event\n- Self-identified training need: de-escalation\n\n**Actions:**\n- Raise de-escalation training need in next supervision\n\n**Staff wellbeing note:** Staff member demonstrating healthy reflective practice. Consider check-in.",
    riskLevel: "medium",
    agentUsed: "voice_reflection_agent",
    status: "completed",
    inputType: "reflection",
  },
  {
    id: "demo-voice-003",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    transcript:
      "Supervision prep — Things I want to discuss: my progress with the Level 3 qualification, how to handle bedtime refusals better, and whether we can update the risk assessment for Tyler since his behaviour has improved significantly over the past month.",
    structuredOutput:
      "**Supervision Preparation**\n\n**Topics to discuss:**\n1. Level 3 qualification progress (development)\n2. Bedtime refusal strategies (practice support)\n3. Tyler risk assessment review — behaviour improvement noted over past month (positive update)\n\n**Suggested record type:** supervision_note",
    riskLevel: "low",
    agentUsed: "voice_reflection_agent",
    status: "completed",
    inputType: "supervision_prep",
  },
];

export async function GET(req: NextRequest) {
  try {
    // Who is asking comes from the validated session, never from the query
    // string. These are personal reflective journals: the caller's own home and
    // own id are the only ones they may read with.
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10),
      50,
    );

    // ── Try Supabase first ─────────────────────────────────────────────────
    if (isSupabaseEnabled()) {
      const sb = createServerClient();
      if (sb) {
        try {
          // Fetch sessions with task_type = voice_reflection.
          // user_id is the privacy guarantee — a reflective journal belongs to
          // the person who recorded it, not to everyone rostered at the home.
          // home_id is defence in depth on top of it.
          let query = (sb.from("cara_sessions") as SB)
            .select("id, created_at, status, risk_level, task_type, page_context")
            .eq("user_id", identity.userId)
            .eq("task_type", "voice_reflection");
          if (identity.homeId) query = query.eq("home_id", identity.homeId);

          const { data: sessions, error } = await query
            .order("created_at", { ascending: false })
            .limit(limit);

          if (error) {
            console.error("[api/cara/voice-history] Session query error:", error.message);
            // Fall through to demo data
          } else if (sessions && sessions.length > 0) {
            // For each session, fetch messages
            const entries: VoiceHistoryEntry[] = [];

            for (const session of sessions) {
              const { data: messages } = await (sb.from("cara_messages") as SB)
                .select("role, content, agent_used, risk_level")
                .eq("session_id", session.id)
                .order("created_at", { ascending: true })
                .limit(10);

              const userMsg = messages?.find((m: { role: string }) => m.role === "user");
              const assistantMsg = messages?.find((m: { role: string }) => m.role === "assistant");

              entries.push({
                id: session.id,
                createdAt: session.created_at,
                transcript: userMsg?.content ?? "",
                structuredOutput: assistantMsg?.content ?? "",
                riskLevel: session.risk_level ?? "low",
                agentUsed: assistantMsg?.agent_used ?? "voice_reflection_agent",
                status: session.status ?? "completed",
                inputType: session.page_context ?? "auto",
              });
            }

            return NextResponse.json({
              data: entries,
              meta: { total: entries.length, source: "database" },
            });
          }
        } catch (err) {
          console.error("[api/cara/voice-history] Database error:", err);
          // Fall through to demo data
        }
      }
    }

    // ── Graceful degradation — return demo data ──────────────────────────────
    return NextResponse.json({
      data: DEMO_HISTORY,
      meta: { total: DEMO_HISTORY.length, source: "demo" },
    });
  } catch (error) {
    console.error("[api/cara/voice-history] Error:", error);
    console.error("[api] unhandled route error:", error);
    const message = "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
