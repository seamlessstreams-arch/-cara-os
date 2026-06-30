import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listErrors,
  createError,
  updateError,
  ERROR_TYPES,
  ERROR_SEVERITIES,
  ROOT_CAUSES,
  INVESTIGATION_STATUSES,
} from "@/lib/services/medication-errors-service";
import type {
  ErrorType,
  ErrorSeverity,
  RootCause,
  InvestigationStatus,
} from "@/lib/services/medication-errors-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "error_types") return NextResponse.json({ ok: true, data: ERROR_TYPES });
  if (type === "error_severities") return NextResponse.json({ ok: true, data: ERROR_SEVERITIES });
  if (type === "root_causes") return NextResponse.json({ ok: true, data: ROOT_CAUSES });
  if (type === "investigation_statuses") return NextResponse.json({ ok: true, data: INVESTIGATION_STATUSES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listErrors(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    errorType: (searchParams.get("errorType") ?? undefined) as ErrorType | undefined,
    errorSeverity: (searchParams.get("errorSeverity") ?? undefined) as ErrorSeverity | undefined,
    investigationStatus: (searchParams.get("investigationStatus") ?? undefined) as InvestigationStatus | undefined,
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

  if (action === "create_error") {
    const result = await createError(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_error") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateError(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
