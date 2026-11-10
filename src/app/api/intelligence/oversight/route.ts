import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { storageFailure } from "@/lib/http/storage-error";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";
import { intelligenceScope } from "@/lib/intelligence/request-scope";
import {
  providerHomeSummaries,
  providerOversightLog,
  nextFallbackId,
} from "@/lib/intelligence/fallback-store";
import { todayStr } from "@/lib/utils";

import type { SB as LooseSupabase } from "@/lib/supabase/loose-client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Live: the session's home, never ?homeId= (see request-scope.ts).
  const scope = await intelligenceScope(request, { homeId: searchParams.get("homeId") });
  if (scope instanceof NextResponse) return scope;
  const { homeId } = scope;

  if (!isSupabaseEnabled()) {
    let rows = [...providerHomeSummaries];
    if (homeId) rows = rows.filter((r) => r.id === homeId || r.name === homeId);
    return NextResponse.json({
      ok: true,
      summaries: [],
      richSummaries: rows,
      oversightLog: [...providerOversightLog],
      persisted: true,
    });
  }

  // provider_home_summaries is keyed by period (period_start / period_end).
  // This used to order by `summary_date` and filter on `provider_id`; the live
  // table has neither, so every read failed (42703). The restore migration
  // (20260918120000) recorded the drift and left it for this route to fix.
  const supabase = createServerClient() as unknown as LooseSupabase;
  let query = supabase.from("provider_home_summaries").select("*").order("period_end", { ascending: false });

  if (homeId) query = query.eq("home_id", homeId);

  const { data, error } = await query.limit(50);
  if (error) return storageFailure("Management oversight records", error);

  return NextResponse.json({ ok: true, summaries: data ?? [], persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const scope = await intelligenceScope(request, body);
    if (scope instanceof NextResponse) return scope;
    const { homeId, actorUserId, actorRole } = scope;
    const { providerId, summaryDate, occupancy, staffingLevel, incidentCount, complaintCount, reg44Status, reg45Status, overallRating, notes } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId is required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      const now = new Date().toISOString();
      const row = {
        id: nextFallbackId("ol"),
        date: now.slice(0, 10),
        home: (homeId as string) ?? "",
        type: (body.entryType as string) ?? "comment",
        content: (notes as string) ?? "",
        author: (actorUserId as string) ?? "Regional Inspector",
        status: "open",
      };
      providerOversightLog.unshift(row);
      return NextResponse.json({ ok: true, summary: row, persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("provider_home_summaries").insert({
      home_id: homeId,
      provider_id: providerId ?? null,
      summary_date: summaryDate ?? todayStr(),
      occupancy: occupancy ?? null,
      staffing_level: staffingLevel ?? null,
      incident_count: incidentCount ?? 0,
      complaint_count: complaintCount ?? 0,
      reg44_status: reg44Status ?? null,
      reg45_status: reg45Status ?? null,
      overall_rating: overallRating ?? null,
      notes: notes ?? null,
      created_by: actorUserId ?? null,
    }).select().single();

    if (error) return storageFailure("Management oversight records", error);

    await writeIntelligenceAudit({
      homeId,
      entityType: "provider_home_summary",
      entityId: data?.id,
      action: "record_created",
      actorUserId: actorUserId ?? undefined,
      actorRole: actorRole ?? undefined,
    });

    return NextResponse.json({ ok: true, summary: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/oversight] POST error:", err);
    return NextResponse.json({ error: "Failed to create provider summary" }, { status: 500 });
  }
}
