// ══════════════════════════════════════════════════════════════════════════════
// CARA — QUALITY-GATE ENFORCEMENT API
//
// GET  → the gate board: every open record run against its natural closing move,
//        blocked-first, so a manager can see what is stuck and exactly why.
// POST → evaluate a proposed transition { recordType, recordId, targetStatus }
//        against the live record and return the decision (allowed / blocked).
//
// This is the read/advisory surface. Hard enforcement lives at the record's own
// transition endpoint (e.g. incidents/[id] refuses an unsafe close with 422).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { readJsonBody } from "@/lib/http/read-json";
import { buildGateBoard, evaluateTransition } from "@/lib/quality-gates/quality-gate-engine";
import type { GateBoardInput, GateIncident, GateMissingEpisode, GateRestraint, GateTask } from "@/lib/quality-gates/types";

export const dynamic = "force-dynamic";

const hasOversight = (i: Record<string, unknown>): boolean => !!(i.oversight_note || i.oversight_by || i.oversight_at);

function mapIncidents(store: ReturnType<typeof getStore>): GateIncident[] {
  return ((store.incidents ?? []) as unknown as Array<Record<string, unknown>>).map((i) => ({
    id: String(i.id),
    status: String(i.status ?? "open"),
    requires_oversight: !!i.requires_oversight,
    has_oversight: hasOversight(i),
    child_id: i.child_id ? String(i.child_id) : undefined,
  }));
}
function mapRestraints(store: ReturnType<typeof getStore>): GateRestraint[] {
  return ((store.restraints ?? []) as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    review_status: String(r.review_status ?? "pending"),
    child_debriefed: !!r.child_debriefed,
    child_id: r.child_id ? String(r.child_id) : undefined,
  }));
}
function mapMissing(store: ReturnType<typeof getStore>): GateMissingEpisode[] {
  const returnInterviews = (store.returnInterviews ?? []) as Array<{ episode_id?: string; missing_episode_id?: string; child_id?: string }>;
  return ((store.missingEpisodes ?? []) as unknown as Array<Record<string, unknown>>).map((m) => ({
    id: String(m.id),
    status: String(m.status ?? "active"),
    has_return_interview: returnInterviews.some((ri) => ri.episode_id === m.id || ri.missing_episode_id === m.id || (!!m.child_id && ri.child_id === m.child_id)),
    child_id: m.child_id ? String(m.child_id) : undefined,
  }));
}
function mapTasks(store: ReturnType<typeof getStore>): GateTask[] {
  return ((store.tasks ?? []) as unknown as Array<Record<string, unknown>>).map((t) => ({
    id: String(t.id),
    status: String(t.status ?? ""),
    requires_sign_off: !!t.requires_sign_off,
    signed_off: !!(t.signed_off_by || t.signed_off_at),
    child_id: t.linked_child_id ? String(t.linked_child_id) : undefined,
  }));
}

function buildInput(store: ReturnType<typeof getStore>): GateBoardInput {
  return {
    homeId: "home_oak",
    asOf: new Date().toISOString().slice(0, 10),
    incidents: mapIncidents(store),
    restraints: mapRestraints(store),
    missingEpisodes: mapMissing(store),
    tasks: mapTasks(store),
  };
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const store = getStore();
    return NextResponse.json({ data: buildGateBoard(buildInput(store)) });
  } catch (err) {
    console.error("[quality-gate] board failed", err);
    return NextResponse.json({ error: "Failed to build gate board" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const jb = await readJsonBody(req);
    if (!jb.ok) return jb.response;
    const body = jb.data as { recordType?: string; recordId?: string; targetStatus?: string };
    if (!body.recordType || !body.recordId || !body.targetStatus) {
      return NextResponse.json({ error: "recordType, recordId and targetStatus are required" }, { status: 400 });
    }

    const store = getStore();
    const rt = body.recordType;
    const rid = body.recordId;

    if (rt === "incidents") {
      const inc = mapIncidents(store).find((i) => i.id === rid);
      if (!inc) return NextResponse.json({ error: "Incident not found" }, { status: 404 });
      return NextResponse.json({ data: evaluateTransition({ recordType: "incidents", targetStatus: body.targetStatus, incident: inc }) });
    }
    if (rt === "restraints") {
      const rst = mapRestraints(store).find((r) => r.id === rid);
      if (!rst) return NextResponse.json({ error: "Restraint not found" }, { status: 404 });
      return NextResponse.json({ data: evaluateTransition({ recordType: "restraints", targetStatus: body.targetStatus, restraint: rst }) });
    }
    if (rt === "missingEpisodes") {
      const m = mapMissing(store).find((x) => x.id === rid);
      if (!m) return NextResponse.json({ error: "Missing episode not found" }, { status: 404 });
      return NextResponse.json({ data: evaluateTransition({ recordType: "missingEpisodes", targetStatus: body.targetStatus, missingEpisode: m }) });
    }
    if (rt === "tasks") {
      const t = mapTasks(store).find((x) => x.id === rid);
      if (!t) return NextResponse.json({ error: "Task not found" }, { status: 404 });
      return NextResponse.json({ data: evaluateTransition({ recordType: "tasks", targetStatus: body.targetStatus, task: t }) });
    }
    return NextResponse.json({ error: `Unsupported recordType: ${rt}` }, { status: 400 });
  } catch (err) {
    console.error("[quality-gate] evaluate failed", err);
    return NextResponse.json({ error: "Failed to evaluate transition" }, { status: 500 });
  }
}
