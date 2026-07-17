// ══════════════════════════════════════════════════════════════════════════════
// CARA — RELATIONAL RHYTHM (doctrine 2.1.3)
//
// GET   /api/v1/relational-rhythm   → the home's circles, themes, gratitude,
//                                     and the concerns still needing a home
// POST                               → capture what came out of a circle
// PATCH                              → switch a circle on or off / retime it
//
// Circles are relational structures, not compliance tasks. There is no endpoint
// here that returns an attendance figure or a missed-circle alert, because the
// engine has no function that could compute one.
//
// Reads are always on. WRITES are gated behind the opt-in flag
// relational_rhythm_write (default OFF).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import {
  buildRhythmView,
  validateCircleNote,
  CIRCLE_DEFINITIONS,
  type CircleKind,
  type CircleNote,
} from "@/lib/relational-rhythm/rhythm-engine";

export const dynamic = "force-dynamic";

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim()) : [];

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const store = getStore();
    const homeId = identity.homeId;
    const scoped = <T extends { home_id: string }>(rows: T[]): T[] =>
      homeId ? rows.filter((r) => r.home_id === homeId) : rows;

    const view = buildRhythmView(
      scoped(store.circleRhythms ?? []),
      scoped(store.circleNotes ?? []),
      new Date(),
    );

    return NextResponse.json({
      data: {
        ...view,
        definitions: CIRCLE_DEFINITIONS,
        writeEnabled: isFeatureEnabled("relational_rhythm_write"),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Capture what came out of a circle. A few words is plenty. */
export async function POST(req: NextRequest) {
  try {
    if (!isFeatureEnabled("relational_rhythm_write")) {
      return NextResponse.json(
        { error: "Circle capture is not enabled (relational_rhythm_write)." },
        { status: 403 },
      );
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const patch = {
      kind: str(body.kind),
      date: str(body.date),
      themes: strList(body.themes),
      gratitude: strList(body.gratitude),
      emerging_concerns: strList(body.emerging_concerns),
    };
    const problem = validateCircleNote(patch);
    if (problem) return NextResponse.json({ error: problem }, { status: 422 });

    const now = new Date().toISOString();
    const note: CircleNote = {
      id: generateId("cno"),
      home_id: identity.homeId ?? "home_oak",
      kind: patch.kind as CircleKind,
      date: patch.date,
      facilitated_by: identity.userId,
      themes: patch.themes,
      gratitude: patch.gratitude,
      emerging_concerns: patch.emerging_concerns,
      created_at: now,
      created_by: identity.userId,
    };
    getStore().circleNotes.push(note);

    const store = getStore();
    const view = buildRhythmView(store.circleRhythms ?? [], store.circleNotes ?? [], new Date());
    return NextResponse.json(
      {
        data: {
          note,
          ...view,
          // Recording a concern here is a handoff, not a resolution — say so at
          // the moment of writing, not only on the dashboard.
          handoffReminder:
            note.emerging_concerns.length > 0
              ? "Captured. What you raised still needs to go where it belongs — a circle is where it was said, not where it gets dealt with."
              : null,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Configure the rhythm: switch a circle on or off. Configurable is the point —
 *  a home that doesn't want a midweek circle should be able to say so, and
 *  nothing should nag it afterwards. */
export async function PATCH(req: NextRequest) {
  try {
    if (!isFeatureEnabled("relational_rhythm_write")) {
      return NextResponse.json(
        { error: "Rhythm configuration is not enabled (relational_rhythm_write)." },
        { status: 403 },
      );
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    if (identity.role !== "registered_manager" && identity.role !== "deputy_manager") {
      return NextResponse.json(
        { error: "The home's rhythm is set by a manager." },
        { status: 403 },
      );
    }

    const id = str(body.id);
    const rhythm = (getStore().circleRhythms ?? []).find((r) => r.id === id);
    if (!rhythm) return NextResponse.json({ error: `No circle "${id}" in the rhythm.` }, { status: 404 });

    if (typeof body.enabled === "boolean") rhythm.enabled = body.enabled;
    if (str(body.starts_at)) rhythm.starts_at = str(body.starts_at);
    rhythm.updated_at = new Date().toISOString();

    const store = getStore();
    const view = buildRhythmView(store.circleRhythms ?? [], store.circleNotes ?? [], new Date());
    return NextResponse.json({ data: view });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
