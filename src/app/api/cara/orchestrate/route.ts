// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/orchestrate
//
// Main orchestration endpoint. Receives a user query with context and runs it
// through the full Cara Intelligence pipeline (routing, evidence, generation,
// safety, audit, cost tracking).
//
// POST body: { query, homeId, userId, role, childId?, sourceContext?,
//              requestedAction?, currentPage?, attachedDocuments?, voiceTranscript?,
//              saveIntent? }
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { orchestrate } from "@/lib/cara/orchestrator";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.query || !body.homeId || !body.userId || !body.role) {
      return NextResponse.json(
        { error: "Missing required fields: query, homeId, userId, role" },
        { status: 400 },
      );
    }

    // Create or retrieve session
    let sessionId: string | null = body.sessionId ?? null;

    if (!sessionId && isSupabaseEnabled()) {
      const sb = createServerClient();
      if (sb) {
        const { data, error } = await (sb.from("aria_sessions") as SB)
          .insert({
            home_id: body.homeId,
            user_id: body.userId,
            child_id: body.childId ?? null,
            page_context: body.currentPage ?? null,
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

    // Run the orchestration pipeline
    const result = await orchestrate({
      query: body.query,
      homeId: body.homeId,
      userId: body.userId,
      role: body.role,
      childId: body.childId,
      organisationId: body.organisationId,
      sourceContext: body.sourceContext,
      requestedAction: body.requestedAction,
      currentPage: body.currentPage,
      attachedDocuments: body.attachedDocuments,
      voiceTranscript: body.voiceTranscript,
      saveIntent: body.saveIntent,
    });

    // Persist message + route + safety + cost to session tables
    if (sessionId && isSupabaseEnabled()) {
      const sb = createServerClient();
      if (sb) {
        await persistSessionData(sb, sessionId, body, result as unknown as Record<string, unknown>);
      }
    }

    return NextResponse.json({
      ...result,
      sessionId,
    });
  } catch (error) {
    console.error("[api/cara/orchestrate] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown orchestration error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Persist full session data (messages, routes, safety, cost) ───────────────

async function persistSessionData(
  sb: NonNullable<ReturnType<typeof createServerClient>>,
  sessionId: string,
  body: Record<string, unknown>,
  result: Record<string, unknown>,
) {
  try {
    // Insert user message
    const { data: userMsg } = await (sb.from("aria_messages") as SB).insert({
      session_id: sessionId,
      role: "user",
      content: body.query as string,
      risk_level: "low",
    }).select("id").single();

    // Insert assistant message
    const { data: assistantMsg } = await (sb.from("aria_messages") as SB).insert({
      session_id: sessionId,
      role: "assistant",
      content: (result.answer as string) ?? "",
      agent_used: (result.agentUsed as string) ?? null,
      model_used: (result.modelProfile as string) ?? null,
      risk_level: (result.riskLevel as string) ?? "low",
      tokens_in: (result.cost as { inputTokens?: number })?.inputTokens ?? null,
      tokens_out: (result.cost as { outputTokens?: number })?.outputTokens ?? null,
      latency_ms: (result.cost as { latencyMs?: number })?.latencyMs ?? null,
    }).select("id").single();

    // Insert route decision
    await (sb.from("aria_routes") as SB).insert({
      session_id: sessionId,
      query: (body.query as string).slice(0, 2000),
      task_type: (result.agentUsed as string) ?? "unknown",
      selected_agent: (result.agentUsed as string) ?? "unknown",
      selected_model_profile: (result.modelProfile as string) ?? "balanced",
      risk_level: (result.riskLevel as string) ?? "low",
      requires_rag: Array.isArray(result.evidenceUsed) && (result.evidenceUsed as unknown[]).length > 0,
      requires_approval: (result.requiresApproval as boolean) ?? false,
      route_reason: null,
    });

    // Insert evidence items
    const evidenceUsed = result.evidenceUsed as Array<{
      sourceTable?: string;
      sourceId?: string;
      sourceTitle?: string;
      sourceExcerpt?: string;
      relevanceScore?: number;
      evidenceType?: string;
    }> | undefined;

    if (evidenceUsed && evidenceUsed.length > 0) {
      const evidenceRows = evidenceUsed.map((item) => ({
        session_id: sessionId,
        message_id: assistantMsg?.id ?? null,
        evidence_type: item.evidenceType ?? "record",
        evidence_id: item.sourceId ?? "unknown",
        title: item.sourceTitle ?? null,
        excerpt: item.sourceExcerpt?.slice(0, 500) ?? null,
        confidence: item.relevanceScore ?? 0.5,
        source_url: null,
      }));

      await (sb.from("aria_orchestration_evidence") as SB).insert(evidenceRows);
    }

    // Insert safety review if there are safety notes or blocked status
    const safetyNotes = result.safetyNotes as string[] | undefined;
    if (safetyNotes && safetyNotes.length > 0) {
      await (sb.from("aria_safety_reviews") as SB).insert({
        session_id: sessionId,
        message_id: assistantMsg?.id ?? null,
        risk_flags: safetyNotes,
        blocked: (result.blocked as boolean) ?? false,
        block_reason: (result.blockReason as string) ?? null,
        escalation_recommended: (result.escalationRecommended as boolean) ?? false,
      });
    }

    // Insert cost log
    const cost = result.cost as {
      modelId?: string;
      inputTokens?: number;
      outputTokens?: number;
      estimatedCostUsd?: number;
      latencyMs?: number;
    } | undefined;

    if (cost) {
      await (sb.from("aria_cost_logs") as SB).insert({
        session_id: sessionId,
        agent: (result.agentUsed as string) ?? "unknown",
        model: cost.modelId ?? "unknown",
        input_tokens: cost.inputTokens ?? 0,
        output_tokens: cost.outputTokens ?? 0,
        estimated_cost: cost.estimatedCostUsd ?? 0,
        latency_ms: cost.latencyMs ?? 0,
      });
    }

    // Update session risk level to match highest risk seen
    const riskLevel = result.riskLevel as string;
    if (riskLevel === "high" || riskLevel === "critical") {
      await (sb.from("aria_sessions") as SB)
        .update({ risk_level: riskLevel })
        .eq("id", sessionId);
    }
  } catch (err) {
    // Non-fatal — orchestration result already returned
    console.error("[api/cara/orchestrate] Session persistence error:", err);
  }
}
