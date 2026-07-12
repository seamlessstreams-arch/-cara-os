// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/orchestrate/feedback
//
// Records user feedback on an orchestration session (1-5 star rating, optional
// free-text feedback, optional issue type). Saved to cara_user_feedback table.
//
// POST body: { sessionId, userId, rating, feedbackText?, issueType? }
// rating: integer 1-5
// issueType: 'inaccurate' | 'unhelpful' | 'unsafe' | 'slow' | 'other'
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { readJsonBody } from "@/lib/http/read-json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

const VALID_ISSUE_TYPES = ["inaccurate", "unhelpful", "unsafe", "slow", "incomplete", "other"];

interface FeedbackBody {
  sessionId: string;
  userId: string;
  rating: number;
  feedbackText?: string;
  issueType?: string;
}

export async function POST(req: NextRequest) {
  let body: FeedbackBody;

  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Validate required fields ──────────────────────────────────────────────

  if (!body.sessionId || typeof body.sessionId !== "string") {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  if (!body.userId || typeof body.userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (
    body.rating === undefined ||
    body.rating === null ||
    typeof body.rating !== "number" ||
    !Number.isInteger(body.rating) ||
    body.rating < 1 ||
    body.rating > 5
  ) {
    return NextResponse.json(
      { error: "rating is required and must be an integer between 1 and 5" },
      { status: 400 },
    );
  }

  // ── Validate optional fields ──────────────────────────────────────────────

  const feedbackText =
    typeof body.feedbackText === "string"
      ? body.feedbackText.trim().slice(0, 2000)
      : null;

  const issueType =
    typeof body.issueType === "string" && VALID_ISSUE_TYPES.includes(body.issueType)
      ? body.issueType
      : null;

  // Warn if invalid issue type was provided (but don't reject)
  if (body.issueType && !issueType) {
    console.warn(
      `[cara/orchestrate/feedback] Invalid issueType "${body.issueType}" — ignored. Valid types: ${VALID_ISSUE_TYPES.join(", ")}`,
    );
  }

  // ── Persist to database ───────────────────────────────────────────────────

  if (!isSupabaseEnabled()) {
    // Offline / demo mode — return success without persistence
    return NextResponse.json({
      ok: true,
      data: {
        sessionId: body.sessionId,
        userId: body.userId,
        rating: body.rating,
        feedbackText,
        issueType,
        recordedAt: new Date().toISOString(),
      },
    });
  }

  const sb = createServerClient();
  if (!sb) {
    return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 });
  }

  // ── Verify session exists ─────────────────────────────────────────────────

  const { data: session, error: sessionError } = await (sb.from("cara_sessions") as SB)
    .select("id")
    .eq("id", body.sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Session not found. Cannot record feedback for a non-existent session." },
      { status: 404 },
    );
  }

  // ── Check for duplicate feedback ──────────────────────────────────────────

  const { data: existingFeedback } = await (sb.from("cara_user_feedback") as SB)
    .select("id")
    .eq("session_id", body.sessionId)
    .eq("user_id", body.userId)
    .limit(1);

  if (existingFeedback && existingFeedback.length > 0) {
    // Update existing feedback instead of creating a duplicate
    const { data: updatedFeedback, error: updateError } = await (sb.from("cara_user_feedback") as SB)
      .update({
        rating: body.rating,
        feedback_text: feedbackText,
        issue_type: issueType,
      })
      .eq("id", existingFeedback[0].id)
      .select("id, created_at")
      .single();

    if (updateError) {
      console.error("[cara/orchestrate/feedback] Update error:", updateError.message);
      return NextResponse.json(
        { error: "Failed to update existing feedback." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      updated: true,
      data: {
        id: updatedFeedback.id,
        sessionId: body.sessionId,
        userId: body.userId,
        rating: body.rating,
        feedbackText,
        issueType,
        recordedAt: updatedFeedback.created_at,
      },
    });
  }

  // ── Insert new feedback record ────────────────────────────────────────────

  const { data: newFeedback, error: insertError } = await (sb.from("cara_user_feedback") as SB)
    .insert({
      session_id: body.sessionId,
      user_id: body.userId,
      rating: body.rating,
      feedback_text: feedbackText,
      issue_type: issueType,
    })
    .select("id, created_at")
    .single();

  if (insertError || !newFeedback) {
    console.error("[cara/orchestrate/feedback] Insert error:", insertError?.message);
    return NextResponse.json(
      { error: "Failed to record feedback." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: newFeedback.id,
      sessionId: body.sessionId,
      userId: body.userId,
      rating: body.rating,
      feedbackText,
      issueType,
      recordedAt: newFeedback.created_at,
    },
  });
}
