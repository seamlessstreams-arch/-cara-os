// ══════════════════════════════════════════════════════════════════════════════
// POST /api/cara/feedback
//
// Records user feedback on an Cara output (thumbs up/down, optional tags and
// free-text note). Stored in aria_feedback for quality improvement analytics.
//
// Body: { outputId, commandId, rating, note?, tags? }
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// ── Pure helpers (exported for testing) ────────────────────────────────────

export function validateRating(rating: unknown): rating is "positive" | "negative" {
  return rating === "positive" || rating === "negative";
}

export function validateTags(tags: unknown): tags is string[] {
  return Array.isArray(tags) && tags.every((t) => typeof t === "string" && t.length < 100);
}

export function sanitiseNote(note: unknown): string | null {
  if (typeof note !== "string") return null;
  const trimmed = note.trim().slice(0, 500);
  return trimmed || null;
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { outputId, commandId, rating, note, tags } = body;

    // Validate required fields
    if (!outputId || typeof outputId !== "string") {
      return NextResponse.json(
        { ok: false, error: "outputId is required" },
        { status: 400 },
      );
    }
    if (!commandId || typeof commandId !== "string") {
      return NextResponse.json(
        { ok: false, error: "commandId is required" },
        { status: 400 },
      );
    }
    if (!validateRating(rating)) {
      return NextResponse.json(
        { ok: false, error: "rating must be 'positive' or 'negative'" },
        { status: 400 },
      );
    }

    const sanitisedNote = sanitiseNote(note);
    const sanitisedTags = validateTags(tags) ? tags : [];

    // Attempt to store in Supabase
    if (isSupabaseEnabled()) {
      const sb = createServerClient();
      if (sb) {
        const { error } = await (sb.from("aria_feedback") as any).insert({
          output_id: outputId,
          command_id: commandId,
          rating,
          note: sanitisedNote,
          tags: sanitisedTags,
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error("[cara/feedback] Insert error:", error.message);
          // Non-fatal — still return success since feedback is best-effort
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        outputId,
        commandId,
        rating,
        note: sanitisedNote,
        tags: sanitisedTags,
        recordedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[cara/feedback] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to record feedback" },
      { status: 500 },
    );
  }
}
