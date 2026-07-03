import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listAdmissionWorkflows, createAdmissionWorkflow,
  getAdmissionStats,
} from "@/lib/services/yp-admission-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  // Stats
  if (type === "stats") {
    const result = await getAdmissionStats(homeId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // List workflows
  const result = await listAdmissionWorkflows(homeId, {
    phase: searchParams.get("phase") as any ?? undefined,
    limit: parseInt(searchParams.get("limit") ?? "50"),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const {
      homeId, childFirstName, childLastName, childDateOfBirth,
      childGender, referralSource, referringLa, createdBy,
      referralDate, referringSWName, referringSWPhone, referringSWEmail, notes,
    } = body;

    if (!homeId || !childFirstName || !childLastName || !childDateOfBirth || !childGender || !referralSource || !referringLa || !createdBy) {
      return NextResponse.json({
        error: "homeId, childFirstName, childLastName, childDateOfBirth, childGender, referralSource, referringLa, createdBy required",
      }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    const result = await createAdmissionWorkflow({
      homeId, childFirstName, childLastName, childDateOfBirth,
      childGender, referralSource, referringLa, createdBy,
      referralDate, referringSWName, referringSWPhone, referringSWEmail, notes,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
