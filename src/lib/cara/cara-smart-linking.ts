// ══════════════════════════════════════════════════════════════════════════════
// Cara — SMART LINKING
//
// Links Cara outputs bidirectionally to source records. When an Cara output
// is approved/committed, the smart linker:
//
// 1. Writes aria_context_links for every source record the context builder used
// 2. Updates the source record with an cara-related flag (where supported)
// 3. Creates backlinks so record pages can show "Cara was used here"
//
// This creates the full traceability chain:
//   Source records → aria_context_links → aria_request → aria_output
//   aria_output → aria_task_links → tasks
//   aria_output → committed_record_type/committed_record_id → destination
// ══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface SmartLink {
  id: string;
  outputId: string;
  sourceTable: string;
  sourceRecordId: string;
  linkType: "context_source" | "committed_to" | "task_created" | "manual";
  summary?: string;
  createdAt: string;
}

export interface SmartLinkRequest {
  outputId: string;
  requestId?: string;
  sourceTable: string;
  sourceRecordId: string;
  linkType: SmartLink["linkType"];
  summary?: string;
}

export interface RecordCaraUsage {
  outputId: string;
  outputLabel: string;
  commandId: string;
  generatedAt: string;
  status: string;
  confidence: string;
}

// ── Tables that support the aria_used flag ──────────────────────────────────

const CARA_FLAGGABLE_TABLES = new Set([
  "daily_log_entries",
  "incidents",
  "key_work_sessions",
  "care_forms",
  "handovers",
  "supervisions",
]);

// ══════════════════════════════════════════════════════════════════════════════
// WRITE LINKS
// ══════════════════════════════════════════════════════════════════════════════

export async function writeSmartLinks(
  links: SmartLinkRequest[],
): Promise<{ written: number }> {
  if (!isSupabaseEnabled() || links.length === 0) {
    return { written: 0 };
  }

  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return { written: 0 };
  const supabase = loose(supabaseRaw);

  const rows = links.map((link) => ({
    id: `aria_sl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    request_id: link.requestId ?? null,
    output_id: link.outputId,
    source_table: link.sourceTable,
    source_record_id: link.sourceRecordId,
    link_type: link.linkType,
    summary: link.summary?.slice(0, 500) ?? null,
  }));

  // Use aria_context_links table (already exists from migration 022)
  const { error } = await (supabase.from("aria_context_links") as any).insert(rows);
  if (error) {
    console.warn("[cara-smart-linking] writeSmartLinks failed:", error.message);
    return { written: 0 };
  }

  return { written: rows.length };
}

// ══════════════════════════════════════════════════════════════════════════════
// FLAG SOURCE RECORD
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Marks the source record with `aria_assist_used = true` so record pages
 * can show a badge. Only updates tables that have the column.
 */
export async function flagRecordAsCaraAssisted(
  sourceTable: string,
  sourceRecordId: string,
): Promise<boolean> {
  if (!isSupabaseEnabled()) return false;
  if (!CARA_FLAGGABLE_TABLES.has(sourceTable)) return false;

  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return false;
  const supabase = loose(supabaseRaw);

  // The column name varies — most use aria_assist_used, incidents use aria_oversight_used
  const column =
    sourceTable === "incidents" ? "aria_oversight_used" : "aria_assist_used";

  const { error } = await (supabase.from(sourceTable) as any)
    .update({ [column]: true })
    .eq("id", sourceRecordId);

  if (error) {
    console.warn(`[cara-smart-linking] flagRecord failed on ${sourceTable}:`, error.message);
    return false;
  }

  return true;
}

// ══════════════════════════════════════════════════════════════════════════════
// READ LINKS (for record pages — "Cara was used here")
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Given a source record, returns all Cara outputs that used it as context
 * or were committed to it.
 */
export async function getCaraUsageForRecord(
  sourceTable: string,
  sourceRecordId: string,
): Promise<RecordCaraUsage[]> {
  if (!isSupabaseEnabled()) return [];

  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return [];
  const supabase = loose(supabaseRaw);

  // Query context links that reference this record
  const { data: links, error } = await (supabase.from("aria_context_links") as any)
    .select("output_id, summary, created_at")
    .eq("source_table", sourceTable)
    .eq("source_record_id", sourceRecordId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !links || links.length === 0) return [];

  // Fetch the corresponding outputs
  const outputIds = [...new Set((links as Array<{ output_id: string }>).map((l) => l.output_id))];
  const { data: outputs } = await (supabase.from("aria_outputs") as any)
    .select("id, status, confidence, created_at, request_id")
    .in("id", outputIds);

  if (!outputs) return [];

  // Fetch the requests to get command IDs
  const requestIds = [...new Set(
    (outputs as Array<{ request_id: string | null }>)
      .map((o) => o.request_id)
      .filter(Boolean),
  )];

  let requestMap = new Map<string, { command_id: string }>();
  if (requestIds.length > 0) {
    const { data: requests } = await (supabase.from("aria_requests") as any)
      .select("id, command_id")
      .in("id", requestIds);
    if (requests) {
      requestMap = new Map(
        (requests as Array<{ id: string; command_id: string }>).map((r) => [r.id, r]),
      );
    }
  }

  return (outputs as Array<{
    id: string;
    status: string;
    confidence: string;
    created_at: string;
    request_id: string | null;
  }>).map((output) => ({
    outputId: output.id,
    outputLabel: "Cara suggested draft",
    commandId: output.request_id
      ? requestMap.get(output.request_id)?.command_id ?? "unknown"
      : "unknown",
    generatedAt: output.created_at,
    status: output.status,
    confidence: output.confidence,
  }));
}

// ── Commit linking ──────────────────────────────────────────────────────────

/**
 * When an Cara output is committed to a record, this writes the bidirectional
 * link and flags the destination record.
 */
export async function linkCommittedOutput(
  outputId: string,
  committedRecordType: string,
  committedRecordId: string,
): Promise<void> {
  await writeSmartLinks([
    {
      outputId,
      sourceTable: committedRecordType,
      sourceRecordId: committedRecordId,
      linkType: "committed_to",
      summary: `Cara output committed to ${committedRecordType} record`,
    },
  ]);

  // Attempt to flag the destination record
  await flagRecordAsCaraAssisted(committedRecordType, committedRecordId);
}

// ── Exports for testing ──────────────────────────────────────────────────────
export const _testing = {
  CARA_FLAGGABLE_TABLES,
};
