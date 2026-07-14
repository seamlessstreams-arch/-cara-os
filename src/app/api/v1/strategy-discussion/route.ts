// ══════════════════════════════════════════════════════════════════════════════
// CARA — Strategy Discussion Reasoning API
//
// GET  → list requests (childId/status filters), each with draft status, plus
//        the section labels + the Seven Threshold Reasoning Questions.
// POST → kind:"create"  — assemble a draft FROM THE CHILD'S RECORDS (incidents,
//                         behaviour log, escalation decisions, quoted voice,
//                         current plans) and persist it (traceability enforced);
//        kind:"section" — a named human edits a section;
//        kind:"answer"  — answer one of the Seven Questions;
//        kind:"thinking"— record interpretation / unknowns / alternatives;
//        kind:"decide"  — a NAMED manager judges the threshold, with mandatory
//                         reasoning either way. Cara never decides.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { getStore } from "@/lib/db/store";
import { computeStrategyDraftStatus } from "@/lib/strategy-discussion/assembly-engine";
import {
  answerThresholdQuestion,
  createStrategyRequest,
  getStrategyRequest,
  listStrategyRequests,
  recordManagerDecision,
  recordThinking,
  updateStrategySection,
} from "@/lib/strategy-discussion/request-service";
import {
  SEVEN_THRESHOLD_QUESTIONS,
  STRATEGY_SECTION_LABELS,
  type StrategySectionKey,
} from "@/lib/strategy-discussion/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_REPORTS);
  if (auth instanceof NextResponse) return auth;

  const params = req.nextUrl.searchParams;
  const status = params.get("status");
  const requests = listStrategyRequests({
    childId: params.get("childId") ?? undefined,
    status: status === "draft" || status === "manager_approved" || status === "not_pursued" ? status : undefined,
  });
  return NextResponse.json({
    data: requests.map((request) => ({ request, status: computeStrategyDraftStatus(request) })),
    meta: { total: requests.length },
    sections: STRATEGY_SECTION_LABELS,
    questions: SEVEN_THRESHOLD_QUESTIONS,
  });
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;
  const kind = typeof body.kind === "string" ? body.kind : "";

  if (kind === "create") {
    const auth = requirePermission(req, PERMISSIONS.EDIT_YOUNG_PEOPLE);
    if (auth instanceof NextResponse) return auth;

    const childId = str(body.childId);
    if (!childId) return NextResponse.json({ error: "childId is required — the draft assembles from the child's records." }, { status: 422 });

    // ── Assemble snapshots from the store (last 90 days of records) ──────────
    const store = getStore();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffIso = cutoff.toISOString().slice(0, 10);

    const incidents = store.incidents
      .filter((i) => i.child_id === childId && (i.date ?? "") >= cutoffIso)
      .map((i) => ({
        id: i.id,
        date: i.date,
        type: i.type,
        severity: i.severity,
        description: i.description ?? "",
        immediateAction: i.immediate_action,
      }));

    const behaviourEntries = store.behaviourLog
      .filter((b) => b.child_id === childId && (b.date ?? "") >= cutoffIso)
      .map((b) => ({
        id: b.id,
        date: b.date,
        direction: b.direction ?? "",
        intensity: b.intensity ?? "",
        trigger: b.trigger ?? "",
        behaviour: b.behaviour ?? "",
      }));

    // The child's own words — quoted spans the records already hold.
    const QUOTE = /(?:said|told (?:staff|us|me))[^"“]{0,40}["“]([^"”]{5,200})["”]/i;
    const childQuotes: Array<{ recordId: string; recordType: string; quote: string }> = [];
    for (const b of store.behaviourLog) {
      if (b.child_id !== childId) continue;
      for (const field of [b.behaviour, b.outcome, b.consequence]) {
        const m = field ? QUOTE.exec(field) : null;
        if (m) childQuotes.push({ recordId: b.id, recordType: "behaviourLog", quote: m[1] });
      }
    }

    const escalationDecisions = store.escalationDecisions
      .filter((d) => d.childId === childId)
      .map((d) => ({
        id: d.id,
        suggestedLevel: d.suggestedLevel,
        confirmedLevel: d.confirmedLevel,
        status: d.status,
        concernSummary: d.concernSummary,
      }));

    const currentPlans = store.behaviourSupportPlans
      .filter((p) => p.child_id === childId && p.status === "active")
      .map((p) => ({
        id: p.id,
        recordType: "behaviourSupportPlans",
        summary: `Behaviour support plan (active; last reviewed ${p.last_reviewed ?? "not recorded"})`,
      }));

    const sourceRecords = [
      ...incidents.map((i) => ({ recordType: "incidents", recordId: i.id })),
      ...behaviourEntries.slice(0, 12).map((b) => ({ recordType: "behaviourLog", recordId: b.id })),
    ];

    const result = createStrategyRequest(
      {
        childId,
        childName: str(body.childName),
        concernSummary: str(body.concernSummary) ?? "",
        raisedBy: str(body.actor) ?? auth.userId,
        incidents,
        behaviourEntries,
        escalationDecisions,
        childQuotes,
        currentPlans,
      },
      sourceRecords,
    );
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 422 });
    return NextResponse.json(
      { data: { request: result.value, status: computeStrategyDraftStatus(result.value) } },
      { status: 201 },
    );
  }

  const requestId = str(body.requestId);
  if (!requestId) return NextResponse.json({ error: "requestId is required." }, { status: 422 });

  if (kind === "section" || kind === "answer" || kind === "thinking") {
    const auth = requirePermission(req, PERMISSIONS.EDIT_YOUNG_PEOPLE);
    if (auth instanceof NextResponse) return auth;
    const actor = str(body.actor) ?? auth.userId;

    const result =
      kind === "section"
        ? updateStrategySection(requestId, actor, str(body.section) as StrategySectionKey, str(body.content) ?? "")
        : kind === "answer"
          ? answerThresholdQuestion(requestId, actor, str(body.question) ?? "", str(body.answer) ?? "")
          : recordThinking(requestId, actor, {
              interpretation: str(body.interpretation),
              unknown: str(body.unknown),
              alternativeExplanation: str(body.alternativeExplanation),
            });
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 422 });
    return NextResponse.json(
      { data: { request: result.value, status: computeStrategyDraftStatus(result.value) } },
      { status: 201 },
    );
  }

  if (kind === "decide") {
    const auth = requirePermission(req, PERMISSIONS.ADD_OVERSIGHT);
    if (auth instanceof NextResponse) return auth;

    const result = recordManagerDecision(requestId, {
      decidedBy: str(body.decidedBy) ?? "",
      decidedByRole: str(body.decidedByRole) ?? auth.role,
      requestDiscussion: body.requestDiscussion === true,
      reasoning: str(body.reasoning) ?? "",
      ethicalEventId: str(body.ethicalEventId),
    });
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 422 });
    const request = getStrategyRequest(requestId);
    return NextResponse.json(
      { data: { request, status: request ? computeStrategyDraftStatus(request) : null } },
      { status: 201 },
    );
  }

  return NextResponse.json(
    { error: `Unknown kind "${kind}". Expected create | section | answer | thinking | decide.` },
    { status: 422 },
  );
}

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
