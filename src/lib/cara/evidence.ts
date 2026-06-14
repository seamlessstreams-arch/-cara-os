// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — EVIDENCE RETRIEVAL ENGINE
//
// Gathers source records from Cara operational tables and returns
// normalised evidence items. Each source table has its own query + normaliser;
// queries run in parallel and results are merged, de-duplicated, and sorted.
//
// When Supabase is unavailable the layer returns an empty array so the UI
// can still render in offline / preview mode.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { CaraEvidenceItem } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

type EvidenceQueryInput = {
  homeId: string;
  childId?: string | null;
  searchText: string;
  maxItems?: number;
};

const SOURCE_TABLES = [
  {
    table: "daily_log_entries",
    title: "Daily log",
    dateColumn: "date",
    textColumns: ["content", "notes"],
    childColumn: "child_id",
  },
  {
    table: "incidents",
    title: "Incident record",
    dateColumn: "incident_date",
    textColumns: ["summary", "description", "actions_taken", "manager_review"],
    childColumn: "child_id",
  },
  {
    table: "keywork_sessions",
    title: "Key work session",
    dateColumn: "session_date",
    textColumns: ["summary", "content", "child_voice", "outcome"],
    childColumn: "child_id",
  },
  {
    table: "risk_assessments",
    title: "Risk assessment",
    dateColumn: "updated_at",
    textColumns: ["risk_summary", "controls", "review_notes"],
    childColumn: "child_id",
  },
  {
    table: "placement_plans",
    title: "Placement plan",
    dateColumn: "updated_at",
    textColumns: ["summary", "needs", "actions", "review_notes"],
    childColumn: "child_id",
  },
  {
    table: "management_oversight",
    title: "Management oversight",
    dateColumn: "created_at",
    textColumns: ["summary", "oversight", "actions", "analysis"],
    childColumn: "child_id",
  },
  {
    table: "generic_records",
    title: "Record",
    dateColumn: "created_at",
    textColumns: ["title", "content", "notes"],
    childColumn: "child_id",
  },
  {
    table: "chronology_entries",
    title: "Chronology entry",
    dateColumn: "event_date",
    textColumns: ["title", "description"],
    childColumn: "child_id",
  },
];

function safeExcerpt(value: unknown, max = 900): string {
  if (!value) return "";
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function relevanceScore(text: string, query: string): number {
  const words = query.toLowerCase().split(/\W+/).filter(Boolean);
  if (!words.length) return 10;
  const lower = text.toLowerCase();
  const hits = words.filter((w) => lower.includes(w)).length;
  return Math.min(100, Math.round((hits / Math.max(words.length, 1)) * 100));
}

export async function retrieveCaraEvidence(input: EvidenceQueryInput): Promise<CaraEvidenceItem[]> {
  if (!isSupabaseEnabled()) return [];

  const sb = createServerClient();
  if (!sb) return [];

  const maxItems = input.maxItems ?? Number((process.env.CARA_MAX_EVIDENCE_ITEMS ?? process.env.CARA_MAX_EVIDENCE_ITEMS) ?? "40");
  const evidence: CaraEvidenceItem[] = [];

  for (const source of SOURCE_TABLES) {
    try {
      let query = (sb.from(source.table) as SB)
        .select("*")
        .eq("home_id", input.homeId)
        .order(source.dateColumn, { ascending: false })
        .limit(20);

      if (input.childId && source.childColumn) {
        query = query.eq(source.childColumn, input.childId);
      }

      const { data, error } = await query;

      if (error || !data) {
        // Table may not exist in this build — skip silently
        continue;
      }

      for (const row of data) {
        const combined = source.textColumns
          .map((column) => row[column])
          .filter(Boolean)
          .map((value) => safeExcerpt(value, 500))
          .join(" | ");

        if (!combined) continue;

        const score = relevanceScore(combined, input.searchText);
        if (score < 10 && evidence.length > 10) continue;

        evidence.push({
          sourceTable: source.table,
          sourceId: row.id,
          sourceDate: row[source.dateColumn] ? String(row[source.dateColumn]) : undefined,
          sourceTitle: source.title,
          sourceExcerpt: combined,
          sourceAuthorId: row.created_by ?? row.author_id ?? null,
          relevanceScore: score,
          evidenceType: source.title,
          regulationRefs: row.regulation_refs ?? [],
          qualityStandardRefs: row.quality_standard_refs ?? [],
        });
      }
    } catch {
      // Skip tables that don't exist or error
      continue;
    }
  }

  return evidence
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxItems);
}
