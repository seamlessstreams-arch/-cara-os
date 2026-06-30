import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listPairings,
  createPairing,
  updatePairing,
  PAIRING_TYPES,
  PAIRING_STATUSES,
  SESSION_OUTCOMES,
  SAFEGUARDING_FLAGS,
} from "@/lib/services/peer-mentoring-service";
import type {
  PairingType,
  PairingStatus,
} from "@/lib/services/peer-mentoring-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "pairing_types") return NextResponse.json({ ok: true, data: PAIRING_TYPES });
  if (type === "pairing_statuses") return NextResponse.json({ ok: true, data: PAIRING_STATUSES });
  if (type === "session_outcomes") return NextResponse.json({ ok: true, data: SESSION_OUTCOMES });
  if (type === "safeguarding_flags") return NextResponse.json({ ok: true, data: SAFEGUARDING_FLAGS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listPairings(homeId, {
    mentorId: searchParams.get("mentorId") ?? undefined,
    menteeId: searchParams.get("menteeId") ?? undefined,
    pairingType: (searchParams.get("pairingType") ?? undefined) as PairingType | undefined,
    pairingStatus: (searchParams.get("pairingStatus") ?? undefined) as PairingStatus | undefined,
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

  if (action === "create_pairing") {
    const result = await createPairing(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_pairing") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updatePairing(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
