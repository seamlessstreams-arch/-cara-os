import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  getSettings, getSetting, updateSetting, initializeSettings,
  DEFAULT_SETTINGS,
} from "@/lib/services/system-settings-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  // Defaults (no DB needed)
  if (type === "defaults") {
    return NextResponse.json({ ok: true, data: DEFAULT_SETTINGS });
  }

  // Single setting
  const key = searchParams.get("key");
  if (key) {
    const result = await getSetting(homeId, key);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: { key, value: result.data } });
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  // List settings
  const result = await getSettings(homeId, searchParams.get("category") as any ?? undefined);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, homeId, userId } = body;

    if (!homeId || !userId) {
      return NextResponse.json({ error: "homeId and userId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    // Initialize all defaults
    if (action === "initialize") {
      const result = await initializeSettings(homeId, userId);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: { initialized: result.data } }, { status: 201 });
    }

    // Update a single setting
    if (action === "update") {
      const { key, value } = body;
      if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
      const result = await updateSetting(homeId, key, value, userId);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json({ error: "action must be initialize or update" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
