// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD VOICE FOLLOW-THROUGH (§5.2 closed loop)
//
// GET  /api/v1/voice-follow-through            → all loops + detections
// GET  /api/v1/voice-follow-through?child_id=… → one child's loops + detections
// POST                                          → open a loop / log a repeat raise
// PATCH                                         → move a loop one stage forward
//
// Reads are always on — the board and its Scenario J detections are
// intelligence over existing records. WRITES are gated behind the opt-in flag
// voice_follow_through_write (default OFF), the LEAF convention for new write
// paths: the surface ships visible, the pen ships dark.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import {
  computeVoiceFollowThrough,
  validateTransition,
  VOICE_LOOP_STAGES,
  type VoiceConcernLoop,
  type VoiceLoopStage,
} from "@/lib/voice-of-child/voice-follow-through-engine";

export const dynamic = "force-dynamic";

const str = (v: unknown): string => (typeof v === "string" ? v : "");

export async function GET(req: NextRequest) {
  try {
    const childId = new URL(req.url).searchParams.get("child_id");
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;

    const loops = (getStore().voiceConcernLoops ?? []).filter(
      (l) => !childId || l.child_id === childId,
    );
    const result = computeVoiceFollowThrough(loops, new Date());
    return NextResponse.json({
      data: { ...result, writeEnabled: isFeatureEnabled("voice_follow_through_write") },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Open a new loop, or log a repeat raise onto an existing one. */
export async function POST(req: NextRequest) {
  try {
    if (!isFeatureEnabled("voice_follow_through_write")) {
      return NextResponse.json(
        { error: "Voice follow-through writing is not enabled (voice_follow_through_write)." },
        { status: 403 },
      );
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const actor = identity.userId;
    const now = new Date().toISOString();
    const store = getStore();

    // Repeat raise: the recurrence IS the signal, so it lands on the same loop.
    if (body?.repeat_of) {
      const denied0 = assertChildHomeAccess(identity, str(body.child_id) || null);
      if (denied0) return denied0;
      const existing = (store.voiceConcernLoops ?? []).find((l) => l.id === String(body.repeat_of));
      if (!existing) return NextResponse.json({ error: "Loop not found" }, { status: 404 });
      existing.raised_dates = [...existing.raised_dates, now];
      existing.updated_at = now;
      existing.updated_by = actor;
      return NextResponse.json({ data: existing });
    }

    if (!body?.child_id || !str(body.concern).trim()) {
      return NextResponse.json({ error: "child_id and concern are required" }, { status: 400 });
    }
    const denied = assertChildHomeAccess(identity, String(body.child_id));
    if (denied) return denied;

    const loop: VoiceConcernLoop = {
      id: generateId("vloop"),
      child_id: String(body.child_id),
      home_id: String(body.home_id ?? store.home.id ?? ""),
      concern: str(body.concern).trim(),
      raised_via: str(body.raised_via) || "not recorded",
      raised_dates: [now],
      stage: "listened",
      stage_changed_at: now,
      owner_id: null,
      agreed_action: "",
      task_id: null,
      explain_back_note: "",
      explained_at: null,
      review_with_child_note: "",
      reviewed_at: null,
      created_at: now,
      updated_at: now,
      created_by: actor,
      updated_by: actor,
    };
    store.voiceConcernLoops.push(loop);
    return NextResponse.json({ data: loop }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Move a loop one stage forward. The engine's validateTransition is the law. */
export async function PATCH(req: NextRequest) {
  try {
    if (!isFeatureEnabled("voice_follow_through_write")) {
      return NextResponse.json(
        { error: "Voice follow-through writing is not enabled (voice_follow_through_write)." },
        { status: 403 },
      );
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    if (!body?.id || !body?.to) {
      return NextResponse.json({ error: "id and to (target stage) are required" }, { status: 400 });
    }

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const store = getStore();
    const loop = (store.voiceConcernLoops ?? []).find((l) => l.id === String(body.id));
    if (!loop) return NextResponse.json({ error: "Loop not found" }, { status: 404 });
    const denied = assertChildHomeAccess(identity, loop.child_id);
    if (denied) return denied;

    const to = String(body.to) as VoiceLoopStage;
    const patch = {
      owner_id: body.owner_id === undefined ? undefined : (body.owner_id ? String(body.owner_id) : null),
      agreed_action: body.agreed_action === undefined ? undefined : str(body.agreed_action),
      explain_back_note: body.explain_back_note === undefined ? undefined : str(body.explain_back_note),
      review_with_child_note:
        body.review_with_child_note === undefined ? undefined : str(body.review_with_child_note),
    };
    const invalid = validateTransition(loop, to, patch);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 422 });

    const now = new Date().toISOString();
    if (patch.owner_id !== undefined) loop.owner_id = patch.owner_id;
    if (patch.agreed_action !== undefined) loop.agreed_action = patch.agreed_action;
    if (patch.explain_back_note !== undefined) loop.explain_back_note = patch.explain_back_note;
    if (patch.review_with_child_note !== undefined) loop.review_with_child_note = patch.review_with_child_note;
    if (to === "explained_back") loop.explained_at = now;
    if (to === "reviewed_with_child") loop.reviewed_at = now;
    loop.stage = to;
    loop.stage_changed_at = now;
    loop.updated_at = now;
    loop.updated_by = identity.userId;

    return NextResponse.json({ data: loop, stages: VOICE_LOOP_STAGES });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
