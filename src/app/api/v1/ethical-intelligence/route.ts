// ══════════════════════════════════════════════════════════════════════════════
// CARA — Ethical Intelligence API (the persisted cycle spine)
//
// GET  → list learning events (filter: childId / triggerRecordId / eventId),
//        each with its computed cycle status (Experience→…→Integration).
// POST → create an event, or append a stage record to one. Every stage append
//        is REFUSED unless traceable to a source record — "If Cara cannot
//        trace it, Cara cannot claim it."
//
// Deterministic; no model calls. Cara never makes the decisions it records.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { computeEthicalCycleStatus } from "@/lib/ethical-intelligence/ethical-intelligence-engine";
import {
  createEthicalEvent,
  getEthicalEvent,
  listEthicalEvents,
  recordAction,
  recordDecision,
  recordInsight,
  recordLearning,
  recordOutcome,
  updateIntegration,
} from "@/lib/ethical-intelligence/capture-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_REPORTS);
  if (auth instanceof NextResponse) return auth;

  const params = req.nextUrl.searchParams;
  const eventId = params.get("eventId");
  if (eventId) {
    const event = getEthicalEvent(eventId);
    if (!event) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ data: { event, status: computeEthicalCycleStatus(event) } });
  }

  const events = listEthicalEvents({
    childId: params.get("childId") ?? undefined,
    triggerRecordId: params.get("triggerRecordId") ?? undefined,
  });
  return NextResponse.json({
    data: events.map((event) => ({ event, status: computeEthicalCycleStatus(event) })),
    meta: { total: events.length },
  });
}

// Body shapes:
//   { kind: "event", ...CreateEthicalEventInput }
//   { kind: "insight" | "decision" | "action" | "outcome" | "learning" | "integration",
//     eventId, actor, ...stage fields }
export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.ADD_OVERSIGHT);
  if (auth instanceof NextResponse) return auth;

  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;

  const kind = typeof body.kind === "string" ? body.kind : "";
  const actor = typeof body.actor === "string" && body.actor.trim() ? body.actor : auth.userId;

  if (kind === "event") {
    const result = createEthicalEvent({
      createdBy: actor,
      homeId: str(body.homeId),
      childId: str(body.childId),
      childName: str(body.childName),
      trigger: (body.trigger ?? {}) as { recordType: string; recordId: string; note?: string },
      triggerSummary: str(body.triggerSummary) ?? "",
      whatHappened: str(body.whatHappened) ?? "",
      childExperience: str(body.childExperience),
      staffObserved: str(body.staffObserved),
    });
    if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 422 });
    return NextResponse.json(
      { data: { event: result.value, status: computeEthicalCycleStatus(result.value) } },
      { status: 201 },
    );
  }

  const eventId = str(body.eventId);
  if (!eventId) return NextResponse.json({ error: "eventId is required for stage records." }, { status: 422 });
  const sourceRecords = Array.isArray(body.sourceRecords) ? (body.sourceRecords as never[]) : [];

  const result = (() => {
    switch (kind) {
      case "insight":
        return recordInsight(eventId, actor, {
          informationKnown: strArr(body.informationKnown),
          interpretation: str(body.interpretation) ?? "",
          alternativeExplanations: strArr(body.alternativeExplanations),
          sourceRecords,
        });
      case "decision":
        return recordDecision(eventId, {
          decisionSummary: str(body.decisionSummary) ?? "",
          decisionMaker: str(body.decisionMaker) ?? "",
          decisionMakerRole: str(body.decisionMakerRole),
          evidence: strArr(body.evidence),
          sourceRecords,
        });
      case "action":
        return recordAction(eventId, actor, {
          actionTaken: str(body.actionTaken) ?? "",
          followUpRequired: strArr(body.followUpRequired),
          followUpOwner: str(body.followUpOwner),
          followUpDue: str(body.followUpDue),
          sourceRecords,
        });
      case "outcome":
        return recordOutcome(eventId, actor, {
          whatChanged: str(body.whatChanged) ?? "",
          direction: dir(body.direction),
          reviewedAt: str(body.reviewedAt),
          reviewedBy: str(body.reviewedBy),
          sourceRecords,
        });
      case "learning":
        return recordLearning(eventId, actor, {
          whatWasLearned: str(body.whatWasLearned) ?? "",
          toEmbedInPractice: strArr(body.toEmbedInPractice),
          embedTargets: strArr(body.embedTargets),
          embedded: body.embedded === true,
          sourceRecords,
        });
      case "integration":
        return updateIntegration(eventId, actor, (body.updates ?? {}) as Record<string, boolean | null>);
      default:
        return { ok: false as const, reason: `Unknown kind "${kind}". Expected event | insight | decision | action | outcome | learning | integration.` };
    }
  })();

  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 422 });
  const event = getEthicalEvent(eventId);
  return NextResponse.json(
    { data: { value: result.value, status: event ? computeEthicalCycleStatus(event) : null } },
    { status: 201 },
  );
}

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : []);
const dir = (v: unknown): "improved" | "no_change" | "worsened" | "too_early_to_say" =>
  v === "improved" || v === "no_change" || v === "worsened" ? v : "too_early_to_say";
