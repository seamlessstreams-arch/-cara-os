// ══════════════════════════════════════════════════════════════════════════════
// CARA — KNOWLEDGE BASE API
// GET /api/v1/cara-knowledge-base
//        ?type=model|concept|skills_framework|regulation|source
//        ?status=approved|pending_review|all  (default: approved)
//        ?tag=<tag>
//        → { heart, entries, meta }
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  KB_HEART,
  KB_ALL_ENTRIES,
  KB_ENTRIES,
  allTags,
} from "@/lib/cara/knowledge-base";
import type { KBEntryType } from "@/lib/cara/knowledge-base";

const VALID_TYPES: KBEntryType[] = [
  "model",
  "concept",
  "skills_framework",
  "regulation",
  "source",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type");
  const statusParam = searchParams.get("status") ?? "approved";
  const tagParam = searchParams.get("tag");

  const pool =
    statusParam === "all"
      ? KB_ALL_ENTRIES
      : statusParam === "pending_review"
        ? KB_ALL_ENTRIES.filter((e) => e.status === "pending_review")
        : KB_ENTRIES;

  let entries = pool;

  if (typeParam && VALID_TYPES.includes(typeParam as KBEntryType)) {
    entries = entries.filter((e) => e.type === (typeParam as KBEntryType));
  }

  if (tagParam) {
    const t = tagParam.toLowerCase();
    entries = entries.filter((e) =>
      e.tags.some((x) => x.toLowerCase().includes(t)),
    );
  }

  const typeCounts = VALID_TYPES.reduce(
    (acc, t) => {
      acc[t] = KB_ENTRIES.filter((e) => e.type === t).length;
      return acc;
    },
    {} as Record<KBEntryType, number>,
  );

  return NextResponse.json({
    data: {
      heart: KB_HEART,
      entries,
      meta: {
        total: entries.length,
        totalApproved: KB_ENTRIES.length,
        totalPendingReview: KB_ALL_ENTRIES.filter((e) => e.status === "pending_review")
          .length,
        typeCounts,
        tags: allTags(),
        schemaVersion: "0.1.0",
      },
    },
  });
}
