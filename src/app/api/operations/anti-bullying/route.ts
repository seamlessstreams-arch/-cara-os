import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listIncidents,
  createIncident,
  updateIncident,
  BULLYING_TYPES,
  BULLYING_SEVERITIES,
  INTERVENTION_TYPES,
  INCIDENT_OUTCOMES,
} from "@/lib/services/anti-bullying-service";
import type {
  BullyingType,
  BullyingSeverity,
  IncidentOutcome,
} from "@/lib/services/anti-bullying-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "bullying_types") {
    return NextResponse.json({ ok: true, data: BULLYING_TYPES });
  }
  if (type === "bullying_severities") {
    return NextResponse.json({ ok: true, data: BULLYING_SEVERITIES });
  }
  if (type === "intervention_types") {
    return NextResponse.json({ ok: true, data: INTERVENTION_TYPES });
  }
  if (type === "incident_outcomes") {
    return NextResponse.json({ ok: true, data: INCIDENT_OUTCOMES });
  }

  // Incidents (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listIncidents(homeId, {
    victimId: searchParams.get("victimId") ?? undefined,
    bullyingType: (searchParams.get("bullyingType") ?? undefined) as BullyingType | undefined,
    severity: (searchParams.get("severity") ?? undefined) as BullyingSeverity | undefined,
    outcome: (searchParams.get("outcome") ?? undefined) as IncidentOutcome | undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  if (action === "create_incident") {
    const result = await createIncident(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_incident") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateIncident(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
