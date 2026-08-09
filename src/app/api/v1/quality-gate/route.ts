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
import { dal } from "@/lib/db";
import { readJsonBody } from "@/lib/http/read-json";
import { buildGateBoard, evaluateTransition } from "@/lib/quality-gates/quality-gate-engine";
import type { GateBoardInput, GateIncident, GateMissingEpisode, GateRestraint, GateTask } from "@/lib/quality-gates/types";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

const hasOversight = (i: Record<string, unknown>): boolean => !!(i.oversight_note || i.oversight_by || i.oversight_at);

function mapIncidents(list: unknown[]): GateIncident[] {
  return ((list ?? []) as unknown as Array<Record<string, unknown>>).map((i) => ({
    id: String(i.id),
    status: String(i.status ?? "open"),
    requires_oversight: !!i.requires_oversight,
    has_oversight: hasOversight(i),
    child_id: i.child_id ? String(i.child_id) : undefined,
  }));
}
function mapRestraints(list: unknown[]): GateRestraint[] {
  return ((list ?? []) as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    review_status: String(r.review_status ?? "pending"),
    child_debriefed: !!r.child_debriefed,
    child_id: r.child_id ? String(r.child_id) : undefined,
  }));
}
function mapMissing(missing: unknown[], returnInterviewsList: unknown[]): GateMissingEpisode[] {
  const returnInterviews = (returnInterviewsList ?? []) as Array<{ episode_id?: string; missing_episode_id?: string; child_id?: string }>;
  return ((missing ?? []) as unknown as Array<Record<string, unknown>>).map((m) => ({
    id: String(m.id),
    status: String(m.status ?? "active"),
    has_return_interview: returnInterviews.some((ri) => ri.episode_id === m.id || ri.missing_episode_id === m.id || (!!m.child_id && ri.child_id === m.child_id)),
    child_id: m.child_id ? String(m.child_id) : undefined,
  }));
}
function mapTasks(list: unknown[]): GateTask[] {
  return ((list ?? []) as unknown as Array<Record<string, unknown>>).map((t) => ({
    id: String(t.id),
    status: String(t.status ?? ""),
    requires_sign_off: !!t.requires_sign_off,
    signed_off: !!(t.signed_off_by || t.signed_off_at),
    child_id: t.linked_child_id ? String(t.linked_child_id) : undefined,
  }));
}

interface Collections {
  incidents: unknown[];
  restraints: unknown[];
  missingEpisodes: unknown[];
  returnInterviews: unknown[];
  tasks: unknown[];
}

async function loadCollections(): Promise<Collections> {
  const [incidents, restraints, missingEpisodes, returnInterviews, tasks] = await Promise.all([
    dal.incidents.findAll(),
    dal.restraints.findAll(),
    dal.missingEpisodes.findAll(),
    dal.returnInterviews.findAll(),
    dal.tasks.findAll(),
  ]);
  return { incidents, restraints, missingEpisodes, returnInterviews, tasks };
}

function buildInput(c: Collections): GateBoardInput {
  return {
    homeId: "home_oak",
    asOf: todayStr(),
    incidents: mapIncidents(c.incidents),
    restraints: mapRestraints(c.restraints),
    missingEpisodes: mapMissing(c.missingEpisodes, c.returnInterviews),
    tasks: mapTasks(c.tasks),
  };
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const collections = await loadCollections();
    return NextResponse.json({ data: buildGateBoard(buildInput(collections)) });
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

    const collections = await loadCollections();
    const rt = body.recordType;
    const rid = body.recordId;

    if (rt === "incidents") {
      const inc = mapIncidents(collections.incidents).find((i) => i.id === rid);
      if (!inc) return NextResponse.json({ error: "Incident not found" }, { status: 404 });
      return NextResponse.json({ data: evaluateTransition({ recordType: "incidents", targetStatus: body.targetStatus, incident: inc }) });
    }
    if (rt === "restraints") {
      const rst = mapRestraints(collections.restraints).find((r) => r.id === rid);
      if (!rst) return NextResponse.json({ error: "Restraint not found" }, { status: 404 });
      return NextResponse.json({ data: evaluateTransition({ recordType: "restraints", targetStatus: body.targetStatus, restraint: rst }) });
    }
    if (rt === "missingEpisodes") {
      const m = mapMissing(collections.missingEpisodes, collections.returnInterviews).find((x) => x.id === rid);
      if (!m) return NextResponse.json({ error: "Missing episode not found" }, { status: 404 });
      return NextResponse.json({ data: evaluateTransition({ recordType: "missingEpisodes", targetStatus: body.targetStatus, missingEpisode: m }) });
    }
    if (rt === "tasks") {
      const t = mapTasks(collections.tasks).find((x) => x.id === rid);
      if (!t) return NextResponse.json({ error: "Task not found" }, { status: 404 });
      return NextResponse.json({ data: evaluateTransition({ recordType: "tasks", targetStatus: body.targetStatus, task: t }) });
    }
    return NextResponse.json({ error: `Unsupported recordType: ${rt}` }, { status: 400 });
  } catch (err) {
    console.error("[quality-gate] evaluate failed", err);
    return NextResponse.json({ error: "Failed to evaluate transition" }, { status: 500 });
  }
}
