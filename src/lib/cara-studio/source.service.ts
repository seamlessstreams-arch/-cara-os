// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — SOURCE SERVICE
// Index, search, and manage internal evidence sources.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { CaraStudioSource } from "@/types/cara-studio";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function indexSource(source: Partial<CaraStudioSource>): Promise<CaraStudioSource | null> {
  const sb = createServerClient();
  if (!sb) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("aria_studio_sources") as any)
    .insert({
      home_id: source.home_id ?? homeId(),
      child_id: source.child_id ?? null,
      staff_id: source.staff_id ?? null,
      linked_record_id: source.linked_record_id ?? null,
      linked_record_type: source.linked_record_type ?? null,
      source_type: source.source_type,
      title: source.title ?? null,
      summary: source.summary ?? null,
      content: source.content ?? null,
      extracted_text: source.extracted_text ?? null,
      source_date: source.source_date ?? null,
      category: source.category ?? null,
      tags: source.tags ?? [],
      confidentiality_level: source.confidentiality_level ?? "standard",
      approval_status: source.approval_status ?? "approved",
      is_sensitive: source.is_sensitive ?? false,
      created_by: source.created_by ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[cara-studio] Failed to index source:", error);
    return null;
  }
  return data;
}

export async function listSources(
  hid: string,
  filters?: {
    childId?: string;
    sourceType?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  },
): Promise<CaraStudioSource[]> {
  const sb = createServerClient();
  if (!sb) return getDemoSources();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (sb.from("aria_studio_sources") as any)
    .select("*")
    .eq("home_id", hid)
    .is("archived_at", null)
    .order("source_date", { ascending: false })
    .limit(100);

  if (filters?.childId) query = query.eq("child_id", filters.childId);
  if (filters?.sourceType) query = query.eq("source_type", filters.sourceType);
  if (filters?.dateFrom) query = query.gte("source_date", filters.dateFrom);
  if (filters?.dateTo) query = query.lte("source_date", filters.dateTo);
  if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);

  const { data } = await query;
  return data ?? [];
}

export async function getSource(id: string): Promise<CaraStudioSource | null> {
  const sb = createServerClient();
  if (!sb) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (sb.from("aria_studio_sources") as any)
    .select("*")
    .eq("id", id)
    .single();
  return data ?? null;
}

export async function searchSources(hid: string, query: string): Promise<CaraStudioSource[]> {
  return listSources(hid, { search: query });
}

function getDemoSources(): CaraStudioSource[] {
  const now = new Date().toISOString();
  return [
    {
      id: "demo-src-1", home_id: homeId(), child_id: null, staff_id: null,
      linked_record_id: null, linked_record_type: null,
      source_type: "daily_log" as const, title: "Daily Log — 10 May 2026",
      summary: "Settled day. Jayden attended school fully, positive feedback from teaching staff. Enjoyed football after school.",
      content: null, extracted_text: null, source_date: now,
      category: "daily_recording", tags: ["positive", "education"],
      confidentiality_level: "standard", approval_status: "approved",
      is_sensitive: false, created_by: "staff_darren",
      created_at: now, updated_at: now, archived_at: null,
    },
    {
      id: "demo-src-2", home_id: homeId(), child_id: null, staff_id: null,
      linked_record_id: null, linked_record_type: null,
      source_type: "incident" as const, title: "Minor Incident — Peer Conflict",
      summary: "Brief verbal disagreement between two young people at tea time. De-escalated within 5 minutes. Both settled for the evening.",
      content: null, extracted_text: null, source_date: now,
      category: "incident", tags: ["peer_conflict", "de-escalated"],
      confidentiality_level: "standard", approval_status: "approved",
      is_sensitive: false, created_by: "staff_darren",
      created_at: now, updated_at: now, archived_at: null,
    },
    {
      id: "demo-src-3", home_id: homeId(), child_id: null, staff_id: null,
      linked_record_id: null, linked_record_type: null,
      source_type: "keywork" as const, title: "Key Work Session — Goals Review",
      summary: "Reviewed progress against placement plan goals. The young person identified three areas of pride and one worry about upcoming contact.",
      content: null, extracted_text: null, source_date: now,
      category: "keywork", tags: ["goals", "child_voice"],
      confidentiality_level: "standard", approval_status: "approved",
      is_sensitive: false, created_by: "staff_darren",
      created_at: now, updated_at: now, archived_at: null,
    },
  ];
}
