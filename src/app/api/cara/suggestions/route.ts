// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/suggestions
//
// GET   — list suggestions with filters
// POST  — generate suggestions from an incident record
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  checkCaraAccess,
  type CaraActor,
  type CaraRole,
} from "@/lib/cara/cara-permissions";
import {
  generateIncidentSuggestions,
  persistSuggestions,
  getSuggestions,
  writeAuditEntry,
  type SuggestionFilters,
} from "@/lib/cara/cara-suggestions";
import type {
  CaraSuggestionStatus,
  CaraSuggestionRiskLevel,
} from "@/lib/cara/cara-suggestions-types";
import { readJsonBody } from "@/lib/http/read-json";

function actorFromBody(body: Record<string, unknown>): CaraActor | null {
  const userId = typeof body.actorUserId === "string" ? body.actorUserId : "";
  const role = typeof body.actorRole === "string" ? (body.actorRole as CaraRole) : "none";
  if (!userId) return null;
  return {
    userId,
    role,
    organisationId: typeof body.organisationId === "string" ? body.organisationId : undefined,
    homeId: typeof body.homeId === "string" ? body.homeId : undefined,
    staffSelfId: typeof body.staffSelfId === "string" ? body.staffSelfId : undefined,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const actorUserId = searchParams.get("actorUserId");
  if (!actorUserId) {
    return NextResponse.json({ error: "actorUserId query param is required" }, { status: 400 });
  }

  const actorRole = searchParams.get("actorRole") ?? "none";
  const actor: CaraActor = { userId: actorUserId, role: actorRole as CaraRole };

  const access = checkCaraAccess(actor, { permission: "cara.use" });
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  try {
    const filters: SuggestionFilters = {};
    const status = searchParams.get("status");
    if (status) filters.status = status as CaraSuggestionStatus;
    const relatedRecordType = searchParams.get("related_record_type");
    if (relatedRecordType) filters.relatedRecordType = relatedRecordType;
    const relatedRecordId = searchParams.get("related_record_id");
    if (relatedRecordId) filters.relatedRecordId = relatedRecordId;
    const childId = searchParams.get("child_id");
    if (childId) filters.childId = childId;
    const homeId = searchParams.get("home_id");
    if (homeId) filters.homeId = homeId;
    const riskLevel = searchParams.get("risk_level");
    if (riskLevel) filters.riskLevel = riskLevel as CaraSuggestionRiskLevel;

    const suggestions = await getSuggestions(filters);
    return NextResponse.json({ data: suggestions });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch suggestions", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const actor = actorFromBody(body);
  if (!actor) {
    return NextResponse.json({ error: "actorUserId is required" }, { status: 400 });
  }

  const access = checkCaraAccess(actor, { permission: "cara.generate_drafts" });
  if (!access.allowed) {
    return NextResponse.json({ error: "Access denied", reason: access.reason }, { status: 403 });
  }

  const incidentId = typeof body.incidentId === "string" ? body.incidentId : "";
  const incidentType = typeof body.incidentType === "string" ? body.incidentType : "";
  const severity = typeof body.severity === "string" ? body.severity : "";
  const description = typeof body.description === "string" ? body.description : "";

  if (!incidentId || !incidentType || !severity || !description) {
    return NextResponse.json(
      { error: "incidentId, incidentType, severity, and description are required" },
      { status: 400 },
    );
  }

  try {
    const { suggestions } = await generateIncidentSuggestions({
      incidentId,
      incidentType,
      severity,
      description,
      immediateAction: typeof body.immediateAction === "string" ? body.immediateAction : undefined,
      childId: typeof body.childId === "string" ? body.childId : undefined,
      staffId: typeof body.staffId === "string" ? body.staffId : undefined,
      homeId: typeof body.homeId === "string" ? body.homeId : undefined,
      organisationId: typeof body.organisationId === "string" ? body.organisationId : undefined,
    });

    const persisted = await persistSuggestions(suggestions, actor);

    await writeAuditEntry({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "suggestion_created",
      metadata: { incidentId, incidentType, severity, count: persisted.length },
    });

    return NextResponse.json({ data: persisted }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate suggestions", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
