// ══════════════════════════════════════════════════════════════════════════════
// CARA — DOOR OR WALL (experience-of-help, doctrine 2.2.5)
//
// GET  /api/v1/experience-of-help → per child: what they said about how our help
//                                   feels, whose view it is, and the barriers our
//                                   own records prove we made
// POST                             → record a reflection (a human's answer only)
//
// Cara never picks the lens. It never has, and there is no code path here that
// could — see the engine header. What it does is ask, hold the answer, keep
// whose-view-it-is attached to it, and name the barriers we made so they cannot
// be quietly re-read as the child not engaging.
//
// The system-side barriers are COMPOSED from engines that already own those
// facts (voice follow-through; agreed interventions vs sessions) — never
// re-derived here.
//
// Reads always on. WRITES gated behind opt-in help_reflection_write (default OFF).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import { computeVoiceFollowThrough } from "@/lib/voice-of-child/voice-follow-through-engine";
import {
  buildExperienceOfHelp,
  validateReflection,
  HELP_LENSES,
  type HelpLens,
  type HelpReflection,
  type ReflectionSource,
  type SystemBarrier,
} from "@/lib/experience-of-help/experience-of-help-engine";

export const dynamic = "force-dynamic";

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim()) : [];

/** Barriers this home made, proved by records the other engines already own. */
function deriveSystemBarriers(childIds: Set<string>, now: Date): SystemBarrier[] {
  const store = getStore();
  const out: SystemBarrier[] = [];

  // 1. Something they raised, with nothing visibly done (voice follow-through).
  try {
    const voice = computeVoiceFollowThrough(store.voiceConcernLoops ?? [], now);
    for (const d of voice.detections) {
      if (d.key !== "voice_without_response" && d.key !== "explain_back_overdue" && d.key !== "stalled_loop") continue;
      if (!childIds.has(d.childId)) continue;
      out.push({
        id: `sb_voice_${d.loopId}`,
        childId: d.childId,
        origin: "voice",
        what: d.headline,
        since: d.evidence.raisedDates[0] ?? "",
      });
    }
  } catch {
    // A source Cara cannot read contributes nothing — it must never contribute
    // a false clean sheet either, so nothing is inferred from the failure.
  }

  // 2. Support agreed in a formulation with no sessions on record.
  try {
    const sessions = store.traumaTherapyLogs ?? [];
    for (const f of store.multiDisciplinaryFormulations ?? []) {
      if (!childIds.has(f.child_id)) continue;
      if ((f.agreed_interventions ?? []).length === 0) continue;
      if (sessions.some((s) => s.child_id === f.child_id)) continue;
      out.push({
        id: `sb_support_${f.id}`,
        childId: f.child_id,
        origin: "support",
        what: `${f.agreed_interventions.length} intervention(s) agreed on ${f.formulation_date.slice(0, 10)}, no sessions on record`,
        since: f.formulation_date.slice(0, 10),
      });
    }
  } catch {
    /* see above */
  }

  return out;
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const childId = new URL(req.url).searchParams.get("child_id");
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;

    const store = getStore();
    const homeId = identity.homeId;
    const children = (store.youngPeople ?? [])
      .filter(
        (c) =>
          c.status === "current" &&
          (!homeId || c.home_id === homeId) &&
          (!childId || c.id === childId),
      )
      .map((c) => ({ id: c.id, name: c.preferred_name || c.first_name }));
    const childIds = new Set(children.map((c) => c.id));

    const view = buildExperienceOfHelp({
      children,
      reflections: (store.helpReflections ?? []).filter((r) => childIds.has(r.child_id)),
      barriers: deriveSystemBarriers(childIds, new Date()),
      now: new Date(),
    });

    return NextResponse.json({
      data: { ...view, lenses: HELP_LENSES, writeEnabled: isFeatureEnabled("help_reflection_write") },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Record what a child (or their family, or the team) said. */
export async function POST(req: NextRequest) {
  try {
    if (!isFeatureEnabled("help_reflection_write")) {
      return NextResponse.json(
        { error: "Recording a reflection is not enabled (help_reflection_write)." },
        { status: 403 },
      );
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const childId = str(body.child_id);
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;

    const patch = {
      source: str(body.source),
      lens: str(body.lens),
      their_words: str(body.their_words),
      one_change: str(body.one_change),
      safety_consideration: str(body.safety_consideration),
    };
    const problem = validateReflection(patch);
    if (problem) return NextResponse.json({ error: problem }, { status: 422 });

    const child = (getStore().youngPeople ?? []).find((c) => c.id === childId);
    if (!child) return NextResponse.json({ error: "No such child." }, { status: 404 });

    const now = new Date().toISOString();
    const reflection: HelpReflection = {
      id: generateId("hr"),
      home_id: child.home_id,
      child_id: childId,
      recorded_on: now.slice(0, 10),
      source: patch.source as ReflectionSource,
      lens: patch.lens as HelpLens,
      their_words: patch.their_words,
      system_barriers_named: strList(body.system_barriers_named),
      one_change: patch.one_change,
      safety_consideration: patch.safety_consideration,
      recorded_by: identity.userId,
      created_at: now,
    };
    getStore().helpReflections.push(reflection);

    return NextResponse.json(
      {
        data: {
          reflection,
          // Said at the moment of writing, not only on a dashboard.
          note:
            reflection.source === "team_view"
              ? "Recorded as the team's view. Cara will keep showing that this child has not been asked — because they haven't."
              : "Recorded in their words. Worth telling them what changes because of it.",
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
