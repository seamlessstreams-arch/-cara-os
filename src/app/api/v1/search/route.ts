// ==============================================================================
// CORNERSTONE — SEARCH API ROUTE
//
// GET /api/v1/search?q=...&types=...&home_id=...&child_id=...&limit=...&offset=...
// Returns SearchResponse from the in-memory search engine.
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { search, type SearchResultType, type SearchResponse } from "@/lib/search/search-engine";

export const dynamic = "force-dynamic";

const VALID_TYPES = new Set<SearchResultType>([
  "child", "staff", "incident", "task", "daily_log", "care_event",
  "document", "risk_assessment", "care_plan", "review",
]);

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const q = params.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  // Parse comma-separated types
  let types: SearchResultType[] | undefined;
  const typesParam = params.get("types");
  if (typesParam) {
    const raw = typesParam.split(",").map((t) => t.trim()).filter(Boolean);
    const valid = raw.filter((t): t is SearchResultType => VALID_TYPES.has(t as SearchResultType));
    if (valid.length > 0) types = valid;
  }

  const home_id = params.get("home_id") ?? undefined;
  const child_id = params.get("child_id") ?? undefined;
  const limit = Math.min(Math.max(parseInt(params.get("limit") ?? "20", 10) || 20, 1), 100);
  const offset = Math.max(parseInt(params.get("offset") ?? "0", 10) || 0, 0);

  const response: SearchResponse = search({
    query: q,
    types,
    home_id,
    child_id,
    limit,
    offset,
  });

  return NextResponse.json(response);
}
