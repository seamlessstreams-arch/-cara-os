// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/voice-process
//
// POST endpoint that takes a transcript + metadata and sends it through the
// orchestration pipeline with taskType hinted as "voice_reflection".
//
// Body: { transcript, actorUserId, actorRole, homeId, organisationId,
//         childId?, sourceModule?, inputType? }
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { orchestrate } from "@/lib/cara/orchestrator";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export interface VoiceProcessRequest {
  transcript: string;
  actorUserId: string;
  actorRole: string;
  homeId: string;
  organisationId?: string;
  childId?: string;
  sourceModule?: string;
  inputType?: "dictation" | "reflection" | "supervision_prep" | "handover" | "other";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VoiceProcessRequest;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!body.transcript || body.transcript.trim().length < 5) {
      return NextResponse.json(
        { error: "Transcript is required and must be at least 5 characters." },
        { status: 400 },
      );
    }

    if (!body.actorUserId || !body.actorRole || !body.homeId) {
      return NextResponse.json(
        { error: "Missing required fields: actorUserId, actorRole, homeId" },
        { status: 400 },
      );
    }

    // ── Build CaraRequest with voice_reflection hint ─────────────────────────
    const caraRequest = {
      query: body.transcript,
      voiceTranscript: body.transcript,
      userId: body.actorUserId,
      role: body.actorRole,
      homeId: body.homeId,
      organisationId: body.organisationId,
      childId: body.childId,
      sourceContext: body.inputType
        ? `Voice input type: ${body.inputType}`
        : "Voice input type: auto-detect",
      requestedAction: "voice_reflection",
      currentPage: body.sourceModule ?? "voice-intelligence",
    };

    // ── Create session for tracking ──────────────────────────────────────────
    let sessionId: string | null = null;

    if (isSupabaseEnabled()) {
      const sb = createServerClient();
      if (sb) {
        const { data, error } = await (sb.from("aria_sessions") as SB)
          .insert({
            home_id: body.homeId,
            user_id: body.actorUserId,
            child_id: body.childId ?? null,
            page_context: "voice-intelligence",
            task_type: "voice_reflection",
            risk_level: "low",
            status: "active",
          })
          .select("id")
          .single();

        if (!error && data) {
          sessionId = data.id;
        }
      }
    }

    // ── Run orchestration ────────────────────────────────────────────────────
    const result = await orchestrate(caraRequest);

    // ── Persist session data ─────────────────────────────────────────────────
    if (sessionId && isSupabaseEnabled()) {
      const sb = createServerClient();
      if (sb) {
        try {
          // Store the user message (transcript)
          await (sb.from("aria_messages") as SB).insert({
            session_id: sessionId,
            role: "user",
            content: body.transcript.slice(0, 5000),
            risk_level: result.riskLevel ?? "low",
          });

          // Store the assistant response
          await (sb.from("aria_messages") as SB).insert({
            session_id: sessionId,
            role: "assistant",
            content: result.answer ?? "",
            agent_used: result.agentUsed ?? null,
            model_used: result.modelProfile ?? null,
            risk_level: result.riskLevel ?? "low",
          });

          // Update session with final risk level
          await (sb.from("aria_sessions") as SB)
            .update({
              risk_level: result.riskLevel ?? "low",
              status: "completed",
            })
            .eq("id", sessionId);
        } catch (err) {
          // Non-fatal — the response is already built
          console.error("[api/cara/voice-process] Session persistence error:", err);
        }
      }
    }

    // ── Return response ──────────────────────────────────────────────────────
    return NextResponse.json({
      ...result,
      sessionId,
      inputType: body.inputType ?? "auto",
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/cara/voice-process] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown voice processing error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
