// ══════════════════════════════════════════════════════════════════════════════
// Cara — Practice-pattern intake storage, roster, rate limit and audit (Phase 4)
//
// Storage: three record types in the generic_records catch-all, so Phase 4
// needs NO migration and touches no table definition:
//   practice_pattern_candidate — the review queue (4b → 4d)
//   trusted_voice              — the watchlist (4a; empty until the DPO signs off)
//   practice_pattern           — patterns approved at runtime, merged with the
//                                code-seeded library (4d, P4-6)
// With Supabase off (demo, tests) the same calls run on in-memory arrays.
//
// Audit: intake outcomes and review decisions go to cara_audit_logs, and the
// insert's `error` is READ. supabase-js does not throw on a failed insert, so
// a try/catch alone would lose the audit silently. What an unrecorded audit
// means is the caller's call: a review decision refuses to proceed (4d).
// ══════════════════════════════════════════════════════════════════════════════

import { randomUUID } from "node:crypto";
import { dal, genericTable } from "@/lib/db/dal";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { tenantHomeId } from "@/lib/supabase/tenant";
import type { RawClient } from "@/lib/supabase/loose-client";
import { PRACTICE_PATTERNS, type PracticePattern } from "./practice-patterns";
import type { PatternCandidate, RosterChild } from "./intake-pipeline";
import { mergeWithSeededLibrary, toPracticePattern } from "./review-queue";
import type { TrustedVoice } from "./trusted-voices";

// ── Stores ────────────────────────────────────────────────────────────────────

export const PATTERN_RECORD_TYPES = {
  candidate: "practice_pattern_candidate",
  voice: "trusted_voice",
  pattern: "practice_pattern",
} as const;

function memoryTable<T extends { id: string }>() {
  const rows: T[] = [];
  return {
    getAll: (): T[] => rows,
    create: (data: Partial<T>): T => {
      const row = { ...data, id: typeof data.id === "string" && data.id ? data.id : randomUUID() } as T;
      rows.push(row);
      return row;
    },
    update: (id: string, data: Partial<T>): T | null => {
      const i = rows.findIndex((r) => r.id === id);
      if (i === -1) return null;
      rows[i] = { ...rows[i], ...data };
      return rows[i];
    },
  };
}

const memCandidates = memoryTable<PatternCandidate>();
const memVoices = memoryTable<TrustedVoice>();
const memPatterns = memoryTable<PracticePattern>();

export const candidateStore = genericTable<PatternCandidate>(
  memCandidates.getAll,
  memCandidates.create,
  memCandidates.update,
  PATTERN_RECORD_TYPES.candidate,
);

export const voiceStore = genericTable<TrustedVoice>(
  memVoices.getAll,
  memVoices.create,
  memVoices.update,
  PATTERN_RECORD_TYPES.voice,
);

export const runtimePatternStore = genericTable<PracticePattern>(
  memPatterns.getAll,
  memPatterns.create,
  memPatterns.update,
  PATTERN_RECORD_TYPES.pattern,
);

// ── The merged practice library (P4-6) ────────────────────────────────────────

export interface PracticeLibrary {
  patterns: PracticePattern[];
  /** false = the runtime records could not be read; only the seeded library is here. */
  runtimeLoaded: boolean;
  /** Runtime records left out because they failed a check. */
  skipped: number;
}

/** Seeded patterns plus approved runtime ones. Says so when it is partial. */
export async function loadPracticeLibrary(): Promise<PracticeLibrary> {
  try {
    const runtime = await runtimePatternStore.findAll();
    return { ...mergeWithSeededLibrary(runtime), runtimeLoaded: true };
  } catch {
    return { patterns: [...PRACTICE_PATTERNS], runtimeLoaded: false, skipped: 0 };
  }
}

/** An approved runtime pattern already saved from this source link, if any (retry-safe approval). */
export async function findRuntimePatternBySourceUrl(url: string): Promise<PracticePattern | null> {
  const rows = await runtimePatternStore.findAll();
  for (const row of rows) {
    const p = toPracticePattern(row);
    if (p && p.source.url === url) return p;
  }
  return null;
}

// ── The roster the child-data gate screens against ────────────────────────────

export type RosterLoad = { ok: true; roster: RosterChild[] } | { ok: false; error: string };

/**
 * Every child the home has on record, current and past, read through the dal
 * (the in-memory store is empty on the live tenant). A failure is returned,
 * never swallowed: an unreadable roster is not a clean screen.
 */
export async function loadChildRoster(): Promise<RosterLoad> {
  try {
    const children = await dal.youngPeople.findAll();
    return {
      ok: true,
      roster: children.map((c) => ({
        first_name: c.first_name,
        last_name: c.last_name,
        preferred_name: c.preferred_name,
      })),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "roster read failed" };
  }
}

/** The approver's name from their staff record, or null when it cannot be resolved. */
export async function resolveStaffName(userId: string): Promise<string | null> {
  try {
    const s = await dal.staff.findById(userId);
    if (!s) return null;
    const full = (s.full_name ?? "").trim() || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim();
    return full || null;
  } catch {
    return null;
  }
}

// ── Rate limit (per person, per server instance) ──────────────────────────────

export const INTAKE_RATE_LIMIT = { windowMinutes: 10, maxSubmissions: 20 } as const;

const recentSubmissions = new Map<string, number[]>();

export function checkIntakeRateLimit(
  userId: string,
  nowMs: number = Date.now(),
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const windowMs = INTAKE_RATE_LIMIT.windowMinutes * 60_000;
  const recent = (recentSubmissions.get(userId) ?? []).filter((t) => nowMs - t < windowMs);
  if (recent.length >= INTAKE_RATE_LIMIT.maxSubmissions) {
    recentSubmissions.set(userId, recent);
    const oldest = recent[0] ?? nowMs;
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000)) };
  }
  recent.push(nowMs);
  recentSubmissions.set(userId, recent);
  return { allowed: true };
}

export function resetIntakeRateLimitForTests(): void {
  recentSubmissions.clear();
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export type IntakeAuditAction =
  | "pattern_candidate_submitted"
  | "pattern_candidate_merged"
  | "pattern_candidate_refused_at_intake"
  | "pattern_candidate_approved"
  | "pattern_candidate_rejected"
  | "pattern_decision_incomplete";

export interface IntakeAuditEntry {
  action: IntakeAuditAction;
  actorId: string;
  entityId: string | null;
  /** Reason codes or the reviewer's stated reason. Never the submitted note. */
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditWriteResult {
  recorded: boolean;
  error?: string;
}

const memAudit: Array<IntakeAuditEntry & { at: string }> = [];

/** The demo-mode audit trail (Supabase off). */
export function intakeAuditLogForTests(): ReadonlyArray<IntakeAuditEntry & { at: string }> {
  return memAudit;
}

export async function recordIntakeAudit(entry: IntakeAuditEntry): Promise<AuditWriteResult> {
  if (!isSupabaseEnabled()) {
    memAudit.push({ ...entry, at: new Date().toISOString() });
    return { recorded: true };
  }
  const client = createServerClient() as unknown as RawClient | null;
  if (!client) return { recorded: false, error: "no database client" };
  try {
    const { error } = (await client.from("cara_audit_logs").insert({
      home_id: tenantHomeId(),
      child_id: null,
      user_id: entry.actorId,
      action_type: entry.action,
      entity_type: PATTERN_RECORD_TYPES.candidate,
      entity_id: entry.entityId,
      metadata: { reason: entry.reason ?? null, ...(entry.metadata ?? {}) },
    })) as { error: { message?: string; code?: string } | null };
    if (error) {
      console.error(
        `[practice-patterns] audit write failed for "${entry.action}" (${error.code ?? "unknown"}): not recorded`,
      );
      return { recorded: false, error: error.message ?? "audit insert failed" };
    }
    return { recorded: true };
  } catch {
    console.error(`[practice-patterns] audit write threw for "${entry.action}": not recorded`);
    return { recorded: false, error: "audit insert threw" };
  }
}
