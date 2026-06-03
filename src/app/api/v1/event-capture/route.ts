// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EVENT CAPTURE (write-path) API ROUTE
//
// GET  /api/v1/event-capture — pre-submission PREVIEW on a representative draft
//      (validation, duplicate check, routing, evidence) so a form can show the
//      consequences of submitting before anything is saved.
//
// POST /api/v1/event-capture — the REAL capture-once write path. Accepts a draft,
//      validates once, de-duplicates once, routes once, and PERSISTS a single
//      canonical CornerstoneEvent to the spine (store.cornerstoneEvents) on a
//      pass. Returns the capture result + the persisted event (or the hold
//      reason). External notifications stay gated; nothing is auto-sent.
//
// CHR 2015 Reg 13/36 — "enter once, surface everywhere".
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { buildLiveEventStream } from "@/lib/event-stream/live-event-stream";
import { computeEventCapture } from "@/lib/event-capture/event-capture-engine";
import { captureEvent, type CaptureDraft } from "@/lib/event-capture/capture-event-service";

export async function GET() {
  const events = buildLiveEventStream(getStore()).events;

  // Representative draft: a re-entry of the most recent incident (or first event),
  // which the capture preview should flag as a likely duplicate.
  const template = events.find((e) => e.eventType === "incident") ?? events[0];
  const draft = template
    ? { ...template, id: "draft-preview" }
    : {
        id: "draft-preview", eventType: "daily_log" as const, homeId: "home_oak", childId: "yp_alex",
        occurredAt: new Date().toISOString(), createdBy: "system", summary: "Draft entry",
        structuredTags: [], riskLevel: "low" as const, requiresApproval: false,
        linkedDocuments: [], linkedTasks: [], linkedRisks: [], linkedNotifications: [],
        audit: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, changeHistory: [] },
      };

  const result = computeEventCapture({ draft, existingEvents: events });
  return NextResponse.json({ data: result });
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const draft = (body?.draft ?? body) as CaptureDraft;
  if (!draft || typeof draft.eventType !== "string") {
    return NextResponse.json({ error: "A draft with at least an eventType is required." }, { status: 400 });
  }

  const outcome = captureEvent(draft, { force: !!body?.force });
  // 201 when a canonical event was persisted; 200 when held (validation/duplicate).
  return NextResponse.json({ data: outcome }, { status: outcome.persisted ? 201 : 200 });
}
