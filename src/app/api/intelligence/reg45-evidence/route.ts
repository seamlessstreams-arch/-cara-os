import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { reg45Evidence } from "@/lib/intelligence/fallback-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");

  if (!isSupabaseEnabled()) {
    let rows = [...reg45Evidence];
    if (homeId) rows = rows.filter((r) => r.home_id === homeId);
    return NextResponse.json({ ok: true, evidence: rows, persisted: true });
  }

  const supabase = createServerClient() as unknown as LooseSupabase;
  let query = supabase.from("reg45_evidence").select("*");
  if (homeId) query = query.eq("home_id", homeId);

  const { data, error } = await query.limit(100);
  if (error) { console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 }); }

  return NextResponse.json({ ok: true, evidence: data ?? [], persisted: true });
}
