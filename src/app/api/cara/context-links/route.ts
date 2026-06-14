// ══════════════════════════════════════════════════════════════════════════════
// GET /api/cara/context-links
//
// Returns bidirectional record links that Cara has identified between records.
// Query params: sourceTable, recordId, status (optional)
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// ── Pure helpers (exported for testing) ────────────────────────────────────

export function validateTableName(table: unknown): boolean {
  if (typeof table !== "string") return false;
  // Only allow alphanumeric and underscores — prevents injection
  return /^[a-z_]{1,64}$/.test(table);
}

export function validateRecordId(id: unknown): boolean {
  if (typeof id !== "string") return false;
  return id.length > 0 && id.length <= 128;
}

export function getDemoLinks(sourceTable: string, recordId: string) {
  if (sourceTable === "incidents") {
    return [
      {
        id: "cl_001",
        direction: "outgoing",
        sourceTable: "incidents",
        sourceId: recordId,
        targetTable: "risk_assessments",
        targetId: "ra_012",
        relationshipType: "requires_review_of",
        description: "Incident may indicate risk assessment needs updating.",
        confidence: 87,
        status: "active",
        createdAt: "2026-05-05T08:30:00Z",
        createdBy: "cara",
      },
      {
        id: "cl_002",
        direction: "outgoing",
        sourceTable: "incidents",
        sourceId: recordId,
        targetTable: "supervisions",
        targetId: "sup_024",
        relationshipType: "informs",
        description: "Incident should be discussed in next supervision.",
        confidence: 91,
        status: "verified",
        createdAt: "2026-05-05T08:30:00Z",
        createdBy: "cara",
      },
    ];
  }
  return [];
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sourceTable = url.searchParams.get("sourceTable");
    const recordId = url.searchParams.get("recordId");
    const statusFilter = url.searchParams.get("status") ?? "active";

    if (!validateTableName(sourceTable)) {
      return NextResponse.json(
        { ok: false, error: "Invalid sourceTable parameter" },
        { status: 400 },
      );
    }
    if (!validateRecordId(recordId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid recordId parameter" },
        { status: 400 },
      );
    }

    // Try Supabase
    if (isSupabaseEnabled()) {
      const sb = createServerClient();
      if (sb) {
        const { data, error } = await (sb.from("cara_context_links") as any)
          .select("*")
          .or(`source_table.eq.${sourceTable},target_table.eq.${sourceTable}`)
          .or(`source_id.eq.${recordId},target_id.eq.${recordId}`)
          .eq("status", statusFilter)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!error && data) {
          return NextResponse.json({ ok: true, data });
        }
      }
    }

    // Demo fallback
    return NextResponse.json({
      ok: true,
      data: getDemoLinks(sourceTable!, recordId!),
    });
  } catch (err) {
    console.error("[cara/context-links] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch context links" },
      { status: 500 },
    );
  }
}
