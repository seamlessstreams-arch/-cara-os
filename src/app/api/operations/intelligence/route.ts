import { readJsonBody } from "@/lib/http/read-json";
import { enumParam } from "@/lib/http/enum-param";
import { CARA_RECOMMENDATION_SEVERITY_VALUES, CARA_RECOMMENDATION_STATUS_VALUES, CARA_RECOMMENDATION_TYPE_VALUES } from "@/types/operations";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecommendations, acknowledgeRecommendation,
  actionRecommendation, dismissRecommendation,
  getRecommendationStats,
} from "@/lib/services/cara-intelligence";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const recTypeParam = enumParam("recType", searchParams.get("recType"), CARA_RECOMMENDATION_TYPE_VALUES);
  if (!recTypeParam.ok) return recTypeParam.response;
  const severityParam = enumParam("severity", searchParams.get("severity"), CARA_RECOMMENDATION_SEVERITY_VALUES);
  if (!severityParam.ok) return severityParam.response;
  const statusParam = enumParam("status", searchParams.get("status"), CARA_RECOMMENDATION_STATUS_VALUES);
  if (!statusParam.ok) return statusParam.response;
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  // Stats
  if (type === "stats") {
    const result = await getRecommendationStats(homeId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // List recommendations with optional filters
  const result = await listRecommendations(homeId, {
    type: recTypeParam.value,
    severity: severityParam.value,
    status: statusParam.value,
    childId: searchParams.get("childId") ?? undefined,
    staffId: searchParams.get("staffId") ?? undefined,
    limit: parseInt(searchParams.get("limit") ?? "50"),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { action, id, userId, actionTaken, reason } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    switch (action) {
      case "acknowledge": {
        const result = await acknowledgeRecommendation(id, userId);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, data: result.data });
      }
      case "action": {
        if (!actionTaken) return NextResponse.json({ error: "actionTaken required" }, { status: 400 });
        const result = await actionRecommendation(id, userId, actionTaken);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, data: result.data });
      }
      case "dismiss": {
        if (!reason) return NextResponse.json({ error: "reason required" }, { status: 400 });
        const result = await dismissRecommendation(id, userId, reason);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, data: result.data });
      }
      default:
        return NextResponse.json({ error: "action must be acknowledge, action, or dismiss" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
