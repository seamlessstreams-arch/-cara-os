import { NextRequest, NextResponse } from "next/server";
import { storageFailure } from "@/lib/http/storage-error";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { reg45Evidence } from "@/lib/intelligence/fallback-store";

import type { SB as LooseSupabase } from "@/lib/supabase/loose-client";

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
  if (error) return storageFailure("Regulation 45 evidence", error);

  return NextResponse.json({ ok: true, evidence: data ?? [], persisted: true });
}
