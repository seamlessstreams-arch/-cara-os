import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";
import {
  providerHomeSummaries,
  providerOversightLog,
  nextFallbackId,
} from "@/lib/intelligence/fallback-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const providerId = searchParams.get("providerId");

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

  const supabase = createServerClient() as unknown as LooseSupabase;
  let query = supabase.from("provider_home_summaries").select("*").order("summary_date", { ascending: false });

  if (homeId) query = query.eq("home_id", homeId);
  if (providerId) query = query.eq("provider_id", providerId);

  const { data, error } = await query.limit(50);
  if (error) { console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 }); }

  return NextResponse.json({ ok: true, summaries: data ?? [], persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { homeId, providerId, summaryDate, occupancy, staffingLevel, incidentCount, complaintCount, reg44Status, reg45Status, overallRating, notes, actorUserId, actorRole } = body;

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
      summary_date: summaryDate ?? new Date().toISOString().split("T")[0],
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

    if (error) { console.error("[api] server error:", error); return NextResponse.json({ error: "A server error occurred." }, { status: 500 }); }

    await writeIntelligenceAudit({
      homeId,
      entityType: "provider_home_summary",
      entityId: data?.id,
      action: "record_created",
      actorUserId,
      actorRole,
    });

    return NextResponse.json({ ok: true, summary: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/oversight] POST error:", err);
    return NextResponse.json({ error: "Failed to create provider summary" }, { status: 500 });
  }
}
