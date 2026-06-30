import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listIncidents,
  createIncident,
  updateIncident,
  listAgreements,
  createAgreement,
  updateAgreement,
  ONLINE_RISK_CATEGORIES,
  INCIDENT_SEVERITIES,
  DEVICE_AGREEMENT_STATUSES,
  SAFETY_CHECK_RESULTS,
} from "@/lib/services/online-safety-service";
import type {
  OnlineRiskCategory,
  IncidentSeverity,
  DeviceAgreementStatus,
} from "@/lib/services/online-safety-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "risk_categories") {
    return NextResponse.json({ ok: true, data: ONLINE_RISK_CATEGORIES });
  }
  if (type === "incident_severities") {
    return NextResponse.json({ ok: true, data: INCIDENT_SEVERITIES });
  }
  if (type === "agreement_statuses") {
    return NextResponse.json({ ok: true, data: DEVICE_AGREEMENT_STATUSES });
  }
  if (type === "check_results") {
    return NextResponse.json({ ok: true, data: SAFETY_CHECK_RESULTS });
  }

  // Agreements
  if (type === "agreements") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listAgreements(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      status: (searchParams.get("status") ?? undefined) as DeviceAgreementStatus | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Incidents (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listIncidents(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    riskCategory: (searchParams.get("riskCategory") ?? undefined) as OnlineRiskCategory | undefined,
    severity: (searchParams.get("severity") ?? undefined) as IncidentSeverity | undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
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
  if (action === "create_agreement") {
    const result = await createAgreement(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_agreement") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateAgreement(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
