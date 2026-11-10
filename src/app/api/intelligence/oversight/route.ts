import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { storageFailure } from "@/lib/http/storage-error";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";
import { intelligenceScope } from "@/lib/intelligence/request-scope";
import { dal } from "@/lib/db";
import {
  providerHomeSummaries,
  providerOversightLog,
  nextFallbackId,
} from "@/lib/intelligence/fallback-store";

import type { SB as LooseSupabase } from "@/lib/supabase/loose-client";

// Responsible Individual provider-oversight.
//
// GET returns the home's period summaries and the RI oversight log. The log is
// the list the page renders — comment / action request / review / escalation,
// each with a status.
//
// POST adds one oversight-log entry. The page sends { notes, entryType }; the
// home and the author come from the session (never the request). It used to
// insert into provider_home_summaries (a period-metrics table) with columns it
// does not have, so on live every save failed. Entries now go to
// ri_oversight_notes (migration 20261110120000).

const ENTRY_TYPES = new Set(["comment", "action_request", "review", "escalation"]);

type RiOversightRow = {
  id: string;
  entry_type: string;
  content: string;
  status: string;
  author_id: string | null;
  created_at: string;
};

function toLogEntry(row: RiOversightRow, homeName: string) {
  return {
    id: row.id,
    date: typeof row.created_at === "string" ? row.created_at.slice(0, 10) : "",
    home: homeName,
    type: row.entry_type,
    content: row.content,
    author: row.author_id ?? "",
    status: row.status,
  };
}

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
  let summaryQuery = supabase.from("provider_home_summaries").select("*").order("period_end", { ascending: false });
  if (homeId) summaryQuery = summaryQuery.eq("home_id", homeId);
  const { data: summaries, error: summaryError } = await summaryQuery.limit(50);
  if (summaryError) return storageFailure("Management oversight records", summaryError);

  let logQuery = supabase.from("ri_oversight_notes").select("*").order("created_at", { ascending: false });
  if (homeId) logQuery = logQuery.eq("home_id", homeId);
  const { data: logRows, error: logError } = await logQuery.limit(100);
  if (logError) return storageFailure("Management oversight records", logError);

  const home = await dal.home.get().catch(() => null);
  const homeName = home?.name ?? "";
  const oversightLog = ((logRows ?? []) as RiOversightRow[]).map((r) => toLogEntry(r, homeName));

  return NextResponse.json({ ok: true, summaries: summaries ?? [], oversightLog, persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const scope = await intelligenceScope(request, body);
    if (scope instanceof NextResponse) return scope;
    const { homeId, actorUserId, actorRole } = scope;
    const { notes, entryType } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId is required" }, { status: 400 });
    }
    const content = typeof notes === "string" ? notes.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "An oversight comment is required" }, { status: 400 });
    }
    const type = typeof entryType === "string" && ENTRY_TYPES.has(entryType) ? entryType : "comment";

    if (!isSupabaseEnabled()) {
      const now = new Date().toISOString();
      const row = {
        id: nextFallbackId("ol"),
        date: now.slice(0, 10),
        home: (homeId as string) ?? "",
        type,
        content,
        author: (actorUserId as string) ?? "Regional Inspector",
        status: "open",
      };
      providerOversightLog.unshift(row);
      return NextResponse.json({ ok: true, entry: row, persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("ri_oversight_notes").insert({
      home_id: homeId,
      entry_type: type,
      content,
      status: "open",
      author_id: actorUserId,
    }).select().single();

    if (error) return storageFailure("Management oversight records", error);

    await writeIntelligenceAudit({
      homeId,
      entityType: "ri_oversight_note",
      entityId: data?.id,
      action: "ri_oversight_added",
      actorUserId: actorUserId ?? undefined,
      actorRole: actorRole ?? undefined,
      detail: { entryType: type },
    });

    return NextResponse.json({ ok: true, entry: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/oversight] POST error:", err);
    return NextResponse.json({ error: "Failed to add oversight entry" }, { status: 500 });
  }
}
