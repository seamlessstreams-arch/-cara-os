// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/orchestrate/search
//
// Searches across Cara evidence tables and returns ranked results with
// excerpts and confidence scores. Used by the orchestrator UI to let users
// browse relevant evidence before or after an Cara query.
//
// POST body: { query, homeId, childId?, recordTypes?, dateRange? }
// dateRange: { from?: string, to?: string } (ISO date strings)
// recordTypes: string[] (e.g. ['daily_log_entries', 'incidents', 'keywork_sessions'])
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

// ── Source table configuration ──────────────────────────────────────────────

interface SourceTableConfig {
  table: string;
  label: string;
  dateColumn: string;
  textColumns: string[];
  childColumn: string;
  titleColumn?: string;
}

const SOURCE_TABLES: SourceTableConfig[] = [
  {
    table: "daily_log_entries",
    label: "Daily log",
    dateColumn: "date",
    textColumns: ["content", "notes"],
    childColumn: "child_id",
    titleColumn: undefined,
  },
  {
    table: "incidents",
    label: "Incident record",
    dateColumn: "incident_date",
    textColumns: ["summary", "description", "actions_taken", "manager_review"],
    childColumn: "child_id",
    titleColumn: "summary",
  },
  {
    table: "keywork_sessions",
    label: "Key work session",
    dateColumn: "session_date",
    textColumns: ["summary", "content", "child_voice", "outcome"],
    childColumn: "child_id",
    titleColumn: "summary",
  },
  {
    table: "risk_assessments",
    label: "Risk assessment",
    dateColumn: "updated_at",
    textColumns: ["risk_summary", "controls", "review_notes"],
    childColumn: "child_id",
    titleColumn: "risk_summary",
  },
  {
    table: "placement_plans",
    label: "Placement plan",
    dateColumn: "updated_at",
    textColumns: ["summary", "needs", "actions", "review_notes"],
    childColumn: "child_id",
    titleColumn: "summary",
  },
  {
    table: "management_oversight",
    label: "Management oversight",
    dateColumn: "created_at",
    textColumns: ["summary", "oversight", "actions", "analysis"],
    childColumn: "child_id",
    titleColumn: "summary",
  },
  {
    table: "generic_records",
    label: "Record",
    dateColumn: "created_at",
    textColumns: ["title", "content", "notes"],
    childColumn: "child_id",
    titleColumn: "title",
  },
  {
    table: "chronology_entries",
    label: "Chronology entry",
    dateColumn: "event_date",
    textColumns: ["title", "description"],
    childColumn: "child_id",
    titleColumn: "title",
  },
  {
    table: "care_plans",
    label: "Care plan",
    dateColumn: "updated_at",
    textColumns: ["summary", "objectives", "actions", "review_notes"],
    childColumn: "child_id",
    titleColumn: "summary",
  },
  {
    table: "lac_reviews",
    label: "LAC review",
    dateColumn: "review_date",
    textColumns: ["summary", "decisions", "child_views"],
    childColumn: "child_id",
    titleColumn: "summary",
  },
];

// ── Types ───────────────────────────────────────────────────────────────────

interface SearchResult {
  sourceTable: string;
  sourceLabel: string;
  sourceId: string;
  sourceDate: string | null;
  title: string | null;
  excerpt: string;
  confidence: number;
  childId: string | null;
}

interface SearchBody {
  query: string;
  homeId: string;
  childId?: string;
  recordTypes?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  maxResults?: number;
}

// ── Route Handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: SearchBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.query || typeof body.query !== "string" || body.query.trim().length < 2) {
    return NextResponse.json(
      { error: "query is required and must be at least 2 characters" },
      { status: 400 },
    );
  }

  if (!body.homeId || typeof body.homeId !== "string") {
    return NextResponse.json({ error: "homeId is required" }, { status: 400 });
  }

  // Cap max results
  const maxResults = Math.min(body.maxResults ?? 30, 50);

  // ── Offline/demo mode ─────────────────────────────────────────────────────

  if (!isSupabaseEnabled()) {
    return NextResponse.json({
      ok: true,
      data: {
        results: [],
        totalFound: 0,
        query: body.query,
        searchedTables: [],
      },
    });
  }

  const sb = createServerClient();
  if (!sb) {
    return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 });
  }

  // ── Determine which tables to search ──────────────────────────────────────

  let tablesToSearch = SOURCE_TABLES;

  if (body.recordTypes && Array.isArray(body.recordTypes) && body.recordTypes.length > 0) {
    tablesToSearch = SOURCE_TABLES.filter((t) =>
      body.recordTypes!.includes(t.table),
    );

    if (tablesToSearch.length === 0) {
      return NextResponse.json(
        { error: "None of the specified recordTypes are searchable." },
        { status: 400 },
      );
    }
  }

  // ── Search each table in parallel ─────────────────────────────────────────

  const searchTerms = body.query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .slice(0, 10); // Limit search terms

  if (searchTerms.length === 0) {
    return NextResponse.json({
      ok: true,
      data: { results: [], totalFound: 0, query: body.query, searchedTables: [] },
    });
  }

  const allResults: SearchResult[] = [];
  const searchedTables: string[] = [];

  const searchPromises = tablesToSearch.map(async (config) => {
    try {
      const results = await searchTable(sb, config, {
        homeId: body.homeId,
        childId: body.childId,
        searchTerms,
        dateRange: body.dateRange,
      });
      searchedTables.push(config.table);
      return results;
    } catch (err) {
      console.error(`[cara/orchestrate/search] Error searching ${config.table}:`, err);
      return [];
    }
  });

  const tableResults = await Promise.all(searchPromises);

  for (const results of tableResults) {
    allResults.push(...results);
  }

  // ── Rank results by confidence and recency ────────────────────────────────

  const rankedResults = allResults
    .sort((a, b) => {
      // Primary sort: confidence descending
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      // Secondary sort: date descending (most recent first)
      const dateA = a.sourceDate ? new Date(a.sourceDate).getTime() : 0;
      const dateB = b.sourceDate ? new Date(b.sourceDate).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, maxResults);

  return NextResponse.json({
    ok: true,
    data: {
      results: rankedResults,
      totalFound: allResults.length,
      returnedCount: rankedResults.length,
      query: body.query,
      searchedTables,
    },
  });
}

// ── Search a single table ───────────────────────────────────────────────────

async function searchTable(
  sb: NonNullable<ReturnType<typeof createServerClient>>,
  config: SourceTableConfig,
  params: {
    homeId: string;
    childId?: string;
    searchTerms: string[];
    dateRange?: { from?: string; to?: string };
  },
): Promise<SearchResult[]> {
  // Build the ilike filter — match any text column containing any search term
  // Using Supabase's .or() with ilike for text search
  const orConditions = config.textColumns
    .flatMap((col) =>
      params.searchTerms.map((term) => `${col}.ilike.%${term}%`),
    )
    .join(",");

  let query = (sb.from(config.table) as SB)
    .select(`id, ${config.dateColumn}, ${config.childColumn}, ${config.textColumns.join(", ")}`)
    .eq("home_id", params.homeId)
    .or(orConditions);

  // Filter by child if specified
  if (params.childId) {
    query = query.eq(config.childColumn, params.childId);
  }

  // Filter by date range
  if (params.dateRange?.from) {
    query = query.gte(config.dateColumn, params.dateRange.from);
  }
  if (params.dateRange?.to) {
    query = query.lte(config.dateColumn, params.dateRange.to);
  }

  // Limit results per table
  query = query.order(config.dateColumn, { ascending: false }).limit(20);

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  // Map rows to SearchResult and compute confidence
  return (data as Record<string, unknown>[]).map((row) => {
    const excerpt = buildExcerpt(row, config.textColumns, params.searchTerms);
    const confidence = computeConfidence(row, config.textColumns, params.searchTerms);

    return {
      sourceTable: config.table,
      sourceLabel: config.label,
      sourceId: row.id as string,
      sourceDate: row[config.dateColumn] as string | null,
      title: config.titleColumn ? (row[config.titleColumn] as string | null) : null,
      excerpt,
      confidence,
      childId: row[config.childColumn] as string | null,
    };
  });
}

// ── Build excerpt from matching text columns ────────────────────────────────

function buildExcerpt(
  row: Record<string, unknown>,
  textColumns: string[],
  searchTerms: string[],
): string {
  for (const col of textColumns) {
    const value = row[col];
    if (typeof value !== "string" || !value) continue;

    const lower = value.toLowerCase();
    // Find the first matching term's position
    for (const term of searchTerms) {
      const idx = lower.indexOf(term);
      if (idx !== -1) {
        // Extract a window around the match
        const start = Math.max(0, idx - 60);
        const end = Math.min(value.length, idx + term.length + 140);
        let excerpt = value.slice(start, end).trim();
        if (start > 0) excerpt = "..." + excerpt;
        if (end < value.length) excerpt = excerpt + "...";
        return excerpt;
      }
    }
  }

  // Fallback: return the beginning of the first non-empty text column
  for (const col of textColumns) {
    const value = row[col];
    if (typeof value === "string" && value.trim()) {
      return value.slice(0, 200).trim() + (value.length > 200 ? "..." : "");
    }
  }

  return "";
}

// ── Compute a relevance confidence score ────────────────────────────────────

function computeConfidence(
  row: Record<string, unknown>,
  textColumns: string[],
  searchTerms: string[],
): number {
  let matchCount = 0;
  let totalPossible = searchTerms.length * textColumns.length;

  for (const col of textColumns) {
    const value = row[col];
    if (typeof value !== "string" || !value) continue;

    const lower = value.toLowerCase();
    for (const term of searchTerms) {
      if (lower.includes(term)) {
        matchCount++;
      }
    }
  }

  if (totalPossible === 0) return 0;

  // Base confidence from term matches
  let confidence = matchCount / totalPossible;

  // Boost for recency (newer records get a slight boost)
  // Normalize to 0.0-1.0 range
  confidence = Math.min(1.0, Math.max(0.0, confidence));

  // Boost: multiple terms matching in same field increases confidence
  for (const col of textColumns) {
    const value = row[col];
    if (typeof value !== "string" || !value) continue;

    const lower = value.toLowerCase();
    const termsInField = searchTerms.filter((t) => lower.includes(t)).length;
    if (termsInField > 1) {
      confidence = Math.min(1.0, confidence + 0.1 * (termsInField - 1));
    }
  }

  return Math.round(confidence * 100) / 100;
}
