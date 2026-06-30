import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listProfiles,
  createProfile,
  updateProfile,
  SENSORY_DOMAINS,
  SENSITIVITY_LEVELS,
  ADAPTATION_TYPES,
  PROFILE_STATUSES,
} from "@/lib/services/sensory-profile-service";
import type {
  SensoryDomain,
  SensitivityLevel,
  ProfileStatus,
} from "@/lib/services/sensory-profile-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "sensory_domains") return NextResponse.json({ ok: true, data: SENSORY_DOMAINS });
  if (type === "sensitivity_levels") return NextResponse.json({ ok: true, data: SENSITIVITY_LEVELS });
  if (type === "adaptation_types") return NextResponse.json({ ok: true, data: ADAPTATION_TYPES });
  if (type === "profile_statuses") return NextResponse.json({ ok: true, data: PROFILE_STATUSES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listProfiles(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    sensoryDomain: (searchParams.get("sensoryDomain") ?? undefined) as SensoryDomain | undefined,
    sensitivityLevel: (searchParams.get("sensitivityLevel") ?? undefined) as SensitivityLevel | undefined,
    profileStatus: (searchParams.get("profileStatus") ?? undefined) as ProfileStatus | undefined,
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

  if (action === "create_profile") {
    const result = await createProfile(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_profile") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateProfile(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
