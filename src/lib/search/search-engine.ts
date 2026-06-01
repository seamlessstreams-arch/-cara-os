// ==============================================================================
// CORNERSTONE — FULL-TEXT SEARCH ENGINE
//
// Pure deterministic search across the in-memory store.
// Indexes children, staff, incidents, tasks, daily logs, and care events.
// Multi-term AND matching with relevance scoring and snippet generation.
// ==============================================================================

import { getStore } from "@/lib/db/store";

// ── Types ────────────────────────────────────────────────────────────────────

export type SearchResultType =
  | "child"
  | "staff"
  | "incident"
  | "task"
  | "daily_log"
  | "care_event"
  | "document"
  | "risk_assessment"
  | "care_plan"
  | "review";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  snippet: string;
  relevance: number;
  url: string;
  icon: string;
  date?: string;
  child_id?: string;
  child_name?: string;
  risk_level?: string;
  status?: string;
}

export interface SearchOptions {
  query: string;
  types?: SearchResultType[];
  home_id?: string;
  child_id?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  took_ms: number;
  facets: { type: string; count: number }[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize a string for matching: lowercase, trimmed. */
function norm(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().trim();
}

/** Split a query into individual search terms. */
function terms(query: string): string[] {
  return norm(query)
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Score how well a single term matches a field value.
 *   exact match   → 100
 *   starts-with   → 80
 *   contains       → 60
 *   partial (any char overlap > 50%) → 40
 *   no match       → 0
 */
function scoreTerm(term: string, field: string): number {
  const f = norm(field);
  const t = norm(term);
  if (!t || !f) return 0;
  if (f === t) return 100;
  if (f.startsWith(t)) return 80;
  if (f.includes(t)) return 60;
  // Check individual words in the field
  const words = f.split(/\s+/);
  for (const w of words) {
    if (w === t) return 100;
    if (w.startsWith(t)) return 80;
  }
  // Partial: at least 60% of term chars found in order in field
  let matchCount = 0;
  let pos = 0;
  for (const ch of t) {
    const idx = f.indexOf(ch, pos);
    if (idx >= 0) {
      matchCount++;
      pos = idx + 1;
    }
  }
  if (matchCount / t.length >= 0.6) return 40;
  return 0;
}

/**
 * Check if ALL search terms appear somewhere across the combined text fields.
 * Returns the average relevance score, or 0 if any term fails to match.
 */
function multiTermScore(searchTerms: string[], fields: string[]): number {
  const combined = fields.map(norm).join(" ");
  const scores: number[] = [];

  for (const term of searchTerms) {
    // Best score for this term across all fields
    let best = 0;
    for (const field of fields) {
      const s = scoreTerm(term, field);
      if (s > best) best = s;
    }
    // Also check combined text for contains
    if (best === 0 && combined.includes(term)) {
      best = 60;
    }
    if (best === 0) return 0; // AND semantics: every term must match
    scores.push(best);
  }

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Generate a snippet: up to 100 chars around the first match, with **bold**.
 */
function makeSnippet(searchTerms: string[], fields: string[]): string {
  const combined = fields.filter(Boolean).join(" — ");
  const lower = combined.toLowerCase();

  // Find the first matching term position
  let firstPos = -1;
  let matchTerm = "";
  for (const t of searchTerms) {
    const pos = lower.indexOf(t);
    if (pos >= 0 && (firstPos < 0 || pos < firstPos)) {
      firstPos = pos;
      matchTerm = t;
    }
  }

  if (firstPos < 0) {
    // No direct match found — return start of combined
    return combined.slice(0, 100) + (combined.length > 100 ? "..." : "");
  }

  // Extract window around match
  const windowStart = Math.max(0, firstPos - 40);
  const windowEnd = Math.min(combined.length, firstPos + matchTerm.length + 60);
  let snippet = combined.slice(windowStart, windowEnd);

  if (windowStart > 0) snippet = "..." + snippet;
  if (windowEnd < combined.length) snippet = snippet + "...";

  // Bold all matching terms
  for (const t of searchTerms) {
    const regex = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    snippet = snippet.replace(regex, "**$1**");
  }

  return snippet;
}

/** Build a child name lookup map. */
function childNameMap(): Map<string, string> {
  const store = getStore();
  const map = new Map<string, string>();
  for (const yp of store.youngPeople ?? []) {
    const name = yp.preferred_name
      ? `${yp.preferred_name} ${yp.last_name}`
      : `${yp.first_name} ${yp.last_name}`;
    map.set(yp.id, name);
  }
  return map;
}

// ── Indexers ─────────────────────────────────────────────────────────────────

function indexChildren(searchTerms: string[], childNames: Map<string, string>): SearchResult[] {
  const store = getStore();
  const results: SearchResult[] = [];

  for (const yp of store.youngPeople ?? []) {
    const name = childNames.get(yp.id) ?? `${yp.first_name} ${yp.last_name}`;
    const fields = [
      yp.first_name,
      yp.last_name,
      yp.preferred_name ?? "",
      yp.local_authority,
      yp.social_worker_name,
      yp.placement_type,
      yp.legal_status,
      yp.school_name ?? "",
      yp.gender,
      yp.ethnicity ?? "",
      ...(yp.risk_flags ?? []),
      ...(yp.allergies ?? []),
    ];

    const score = multiTermScore(searchTerms, fields);
    if (score === 0) continue;

    results.push({
      id: yp.id,
      type: "child",
      title: name,
      subtitle: `${yp.local_authority} — ${yp.placement_type}`,
      snippet: makeSnippet(searchTerms, fields),
      relevance: score,
      url: `/young-people/${yp.id}`,
      icon: "User",
      date: yp.placement_start,
      child_id: yp.id,
      child_name: name,
      risk_level: yp.risk_flags?.length > 0 ? "flagged" : undefined,
      status: yp.status,
    });
  }

  return results;
}

function indexStaff(searchTerms: string[]): SearchResult[] {
  const store = getStore();
  const results: SearchResult[] = [];

  for (const s of store.staff ?? []) {
    const fields = [
      s.first_name,
      s.last_name,
      s.full_name,
      s.email ?? "",
      s.job_title,
      s.role,
      s.employment_type,
      s.payroll_id ?? "",
    ];

    const score = multiTermScore(searchTerms, fields);
    if (score === 0) continue;

    results.push({
      id: s.id,
      type: "staff",
      title: s.full_name,
      subtitle: s.job_title,
      snippet: makeSnippet(searchTerms, fields),
      relevance: score,
      url: `/staff/${s.id}`,
      icon: "Users",
      date: s.start_date,
      status: s.is_active ? "active" : "inactive",
    });
  }

  return results;
}

function indexIncidents(searchTerms: string[], childNames: Map<string, string>): SearchResult[] {
  const store = getStore();
  const results: SearchResult[] = [];

  for (const inc of store.incidents ?? []) {
    const childName = childNames.get(inc.child_id) ?? "";
    const fields = [
      inc.reference,
      inc.type?.replace(/_/g, " ") ?? "",
      inc.severity,
      inc.description,
      inc.immediate_action,
      inc.location ?? "",
      childName,
      inc.outcome ?? "",
    ];

    const score = multiTermScore(searchTerms, fields);
    if (score === 0) continue;

    results.push({
      id: inc.id,
      type: "incident",
      title: `${inc.reference} — ${inc.type?.replace(/_/g, " ") ?? "Incident"}`,
      subtitle: `${inc.severity} severity — ${childName}`,
      snippet: makeSnippet(searchTerms, fields),
      relevance: score,
      url: `/incidents?id=${inc.id}`,
      icon: "AlertTriangle",
      date: inc.date,
      child_id: inc.child_id,
      child_name: childName,
      risk_level: inc.severity,
      status: inc.status,
    });
  }

  return results;
}

function indexTasks(searchTerms: string[], childNames: Map<string, string>): SearchResult[] {
  const store = getStore();
  const results: SearchResult[] = [];

  for (const task of store.tasks ?? []) {
    const childName = task.linked_child_id ? (childNames.get(task.linked_child_id) ?? "") : "";
    const fields = [
      task.title,
      task.description,
      task.category,
      task.priority,
      task.status,
      ...(task.tags ?? []),
      childName,
    ];

    const score = multiTermScore(searchTerms, fields);
    if (score === 0) continue;

    results.push({
      id: task.id,
      type: "task",
      title: task.title,
      subtitle: `${task.priority} priority — ${task.status.replace(/_/g, " ")}`,
      snippet: makeSnippet(searchTerms, fields),
      relevance: score,
      url: `/tasks?id=${task.id}`,
      icon: "CheckSquare",
      date: task.due_date ?? task.created_at,
      child_id: task.linked_child_id ?? undefined,
      child_name: childName || undefined,
      status: task.status,
    });
  }

  return results;
}

function indexDailyLog(searchTerms: string[], childNames: Map<string, string>): SearchResult[] {
  const store = getStore();
  const results: SearchResult[] = [];

  for (const entry of store.dailyLog ?? []) {
    const childName = childNames.get(entry.child_id) ?? "";
    const fields = [
      entry.content,
      entry.entry_type,
      childName,
    ];

    const score = multiTermScore(searchTerms, fields);
    if (score === 0) continue;

    results.push({
      id: entry.id,
      type: "daily_log",
      title: `${entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1)} — ${childName}`,
      subtitle: `${entry.date} at ${entry.time}`,
      snippet: makeSnippet(searchTerms, fields),
      relevance: score,
      url: `/young-people/${entry.child_id}?tab=daily-log`,
      icon: "BookOpen",
      date: entry.date,
      child_id: entry.child_id,
      child_name: childName,
    });
  }

  return results;
}

function indexCareEvents(searchTerms: string[], childNames: Map<string, string>): SearchResult[] {
  const store = getStore();
  const results: SearchResult[] = [];

  for (const evt of store.careEvents ?? []) {
    // Only index current versions
    if (evt.is_current_version === false) continue;

    const childName = evt.child_id ? (childNames.get(evt.child_id) ?? "") : "";
    const fields = [
      evt.title,
      evt.content,
      evt.category?.replace(/_/g, " ") ?? "",
      childName,
    ];

    const score = multiTermScore(searchTerms, fields);
    if (score === 0) continue;

    results.push({
      id: evt.id,
      type: "care_event",
      title: evt.title,
      subtitle: `${evt.category?.replace(/_/g, " ") ?? "Event"} — ${childName || "Home-wide"}`,
      snippet: makeSnippet(searchTerms, fields),
      relevance: score,
      url: `/care-events?id=${evt.id}`,
      icon: "HeartPulse",
      date: evt.event_date,
      child_id: evt.child_id ?? undefined,
      child_name: childName || undefined,
      status: evt.status,
    });
  }

  return results;
}

// ── Faceting ─────────────────────────────────────────────────────────────────

function buildFacets(results: SearchResult[]): { type: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of results) {
    counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

// ── Sort ─────────────────────────────────────────────────────────────────────

function sortResults(results: SearchResult[]): SearchResult[] {
  return results.sort((a, b) => {
    // Primary: relevance descending
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    // Secondary: date descending (most recent first)
    const da = a.date ?? "";
    const db = b.date ?? "";
    return db.localeCompare(da);
  });
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Full search across all record types with filtering, pagination, and faceting.
 */
export function search(options: SearchOptions): SearchResponse {
  const start = performance.now();
  const { query, types, home_id, child_id, limit = 20, offset = 0 } = options;

  const searchTerms = terms(query);
  if (searchTerms.length === 0) {
    return {
      results: [],
      total: 0,
      query,
      took_ms: 0,
      facets: [],
    };
  }

  const childNames = childNameMap();
  let allResults: SearchResult[] = [];

  // Determine which types to search
  const searchTypes = new Set<SearchResultType>(
    types ?? ["child", "staff", "incident", "task", "daily_log", "care_event"],
  );

  if (searchTypes.has("child")) allResults.push(...indexChildren(searchTerms, childNames));
  if (searchTypes.has("staff")) allResults.push(...indexStaff(searchTerms));
  if (searchTypes.has("incident")) allResults.push(...indexIncidents(searchTerms, childNames));
  if (searchTypes.has("task")) allResults.push(...indexTasks(searchTerms, childNames));
  if (searchTypes.has("daily_log")) allResults.push(...indexDailyLog(searchTerms, childNames));
  if (searchTypes.has("care_event")) allResults.push(...indexCareEvents(searchTerms, childNames));

  // Filter by home_id if provided
  if (home_id) {
    const store = getStore();
    const homeChildIds = new Set((store.youngPeople ?? []).filter((yp) => yp.home_id === home_id).map((yp) => yp.id));
    const homeStaffIds = new Set((store.staff ?? []).filter((s) => s.home_id === home_id).map((s) => s.id));
    allResults = allResults.filter((r) => {
      if (r.type === "child") return homeChildIds.has(r.id);
      if (r.type === "staff") return homeStaffIds.has(r.id);
      if (r.child_id) return homeChildIds.has(r.child_id);
      return true;
    });
  }

  // Filter by child_id if provided
  if (child_id) {
    allResults = allResults.filter((r) => {
      if (r.type === "child") return r.id === child_id;
      return r.child_id === child_id;
    });
  }

  // Build facets before pagination
  const facets = buildFacets(allResults);

  // Sort
  sortResults(allResults);

  const total = allResults.length;
  const paginated = allResults.slice(offset, offset + limit);

  return {
    results: paginated,
    total,
    query,
    took_ms: Math.round((performance.now() - start) * 100) / 100,
    facets,
  };
}

/** Search only children. */
export function searchChildren(query: string): SearchResult[] {
  return search({ query, types: ["child"] }).results;
}

/** Search only staff. */
export function searchStaff(query: string): SearchResult[] {
  return search({ query, types: ["staff"] }).results;
}

/** Search only incidents. */
export function searchIncidents(query: string): SearchResult[] {
  return search({ query, types: ["incident"] }).results;
}

/** Search only tasks. */
export function searchTasks(query: string): SearchResult[] {
  return search({ query, types: ["task"] }).results;
}

/** Search everything with an optional limit. */
export function searchAll(query: string, limit?: number): SearchResponse {
  return search({ query, limit: limit ?? 20 });
}
