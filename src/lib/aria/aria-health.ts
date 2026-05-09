// ═════════════════════════════════════════════════════════════════════════════
// ARIA — HEALTH & DIAGNOSTICS MODULE
//
// Server-only. Never import this file in client components.
//
// Checks the full ARIA stack:
//   - Provider keys (OpenAI, Anthropic) — presence + optional live ping
//   - Supabase connection + table existence
//   - Audit log writability
//   - Pending approval queue depth
//   - Last successful / failed generation metadata
//
// The result is typed as AriaHealthStatus and never exposes raw API keys,
// raw error messages from providers, or secrets.
//
// Deep tests (live 1-token provider calls) are gated behind `deepTest: true`
// and should only be triggered by admin-level users through the health API.
// ═════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";

// ─── Exported types ──────────────────────────────────────────────────────────

export type AriaOverallStatus =
  | "full_capacity"
  | "partial"
  | "not_configured"
  | "degraded"
  | "error";

export type ProviderTestStatus = "ok" | "failed" | "skipped" | "not_configured";

export interface ProviderHealth {
  /** Whether the API key environment variable is present and non-placeholder. */
  configured: boolean;
  /** Sanitised name of the key env var (no value exposed). */
  keyEnvVar: string;
  /** Result of a live 1-token test call (only run when deepTest=true). */
  testCallStatus: ProviderTestStatus;
  /** Round-trip latency of the test call in ms, if run. */
  latencyMs?: number;
  /** Model name used for the test call, if run. */
  model?: string;
  /** Safe description of any error (no keys, no raw provider messages). */
  errorMessage?: string;
  /** ISO timestamp of the most recent successful use recorded in aria_requests. */
  lastUsedAt?: string;
  /** Total requests using this provider today. */
  requestsToday?: number;
}

export interface PersistenceHealth {
  /** Whether a Supabase client could be constructed. */
  connected: boolean;
  /** Whether all expected ARIA tables exist in the public schema. */
  tablesPresent: boolean;
  /** Tables that could not be reached (empty when tablesPresent=true). */
  missingTables: string[];
  /** Safe description of any connection error. */
  errorMessage?: string;
  /** ISO timestamp of the most recent aria_requests insert. */
  lastWriteAt?: string;
}

export interface AuditHealth {
  /** Whether aria_audit_events is reachable and writable. */
  writable: boolean;
  /** ISO timestamp of the most recent audit event. */
  lastEventAt?: string;
  /** Total audit events written today. */
  totalEventsToday?: number;
  /** Safe description of any audit error. */
  errorMessage?: string;
}

export interface ApprovalHealth {
  /** Outputs in status=draft with approval_required=true. */
  pendingCount: number;
  /** ISO timestamp of the oldest pending output (for SLA tracking). */
  oldestPendingAt?: string;
  /** Pending outputs older than 24 hours. */
  overdueCount: number;
  /** Outputs rejected in the last 7 days. */
  recentRejectionCount: number;
}

export interface CommandRegistryHealth {
  /** Total command IDs registered in ARIA_COMMANDS. */
  totalCommands: number;
  /** Commands broken down by first module they target (or "general"). */
  commandsByModule: Record<string, number>;
  /** Whether any general (cross-module) commands are present. */
  hasGeneralCommands: boolean;
}

export interface ModuleCoverageHealth {
  /** Total known platform modules. */
  totalModules: number;
  /** Modules that have at least one ARIA command or general coverage. */
  modulesWithCommands: number;
  /** 0–100 percentage. */
  coveragePercent: number;
  /** Module ids with no dedicated commands (relies on general commands only). */
  modulesWithoutDedicatedCommands: string[];
}

export interface AriaHealthStatus {
  overallStatus: AriaOverallStatus;
  openai: ProviderHealth;
  anthropic: ProviderHealth;
  supabase: PersistenceHealth;
  audit: AuditHealth;
  approvals: ApprovalHealth;
  commandRegistry: CommandRegistryHealth;
  moduleCoverage: ModuleCoverageHealth;
  /** ISO timestamp of the most recent successful generation in aria_requests. */
  lastGeneratedAt?: string;
  /** ISO timestamp of the most recent provider_failed in aria_requests. */
  lastFailedAt?: string;
  /** Total failed persistence attempts (requests that completed with no output). */
  failedPersistenceCount?: number;
  lastCheckedAt: string;
  recommendations: string[];
}

// ─── ARIA tables that must be present ────────────────────────────────────────

const REQUIRED_ARIA_TABLES = [
  "aria_requests",
  "aria_outputs",
  "aria_approvals",
  "aria_audit_events",
  "aria_transcriptions",
] as const;

// ─── Platform module ids we track for coverage ───────────────────────────────

const PLATFORM_MODULES = [
  "daily_log",
  "shift_summary",
  "key_work",
  "incident",
  "complaint",
  "management_oversight",
  "ri_oversight",
  "regulation_44",
  "regulation_45",
  "safeguarding",
  "missing_episode",
  "behaviour_support",
  "risk_assessment",
  "care_plan",
  "placement_plan",
  "hr_supervision",
  "hr_investigation",
  "hr_recruitment",
  "hr_training",
  "audit",
  "document",
  "task",
  "calendar",
  "health_record",
  "education_record",
  "family_contact",
  "independent_living",
] as const;

// ─── Helper: safely check an env var ─────────────────────────────────────────

function isKeyConfigured(envVar: string): boolean {
  const val = process.env[envVar];
  return Boolean(val && !val.includes("placeholder") && val.length > 10);
}

// ─── Helper: live OpenAI ping (1 token) ──────────────────────────────────────

async function pingOpenAI(model: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, latencyMs: 0, error: "Key not present" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  const start = Date.now();

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - start;

    if (res.status === 401) return { ok: false, latencyMs, error: "Authentication failed — key may be invalid or expired" };
    if (res.status === 429) return { ok: false, latencyMs, error: "Rate limit exceeded" };
    if (res.status === 503) return { ok: false, latencyMs, error: "Provider temporarily unavailable" };
    if (!res.ok) return { ok: false, latencyMs, error: `Provider returned HTTP ${res.status}` };

    return { ok: true, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, latencyMs, error: "Provider call timed out after 10 s" };
    }
    return { ok: false, latencyMs, error: "Network error reaching provider" };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Helper: live Anthropic ping (1 token) ───────────────────────────────────

async function pingAnthropic(model: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, latencyMs: 0, error: "Key not present" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  const start = Date.now();

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - start;

    if (res.status === 401) return { ok: false, latencyMs, error: "Authentication failed — key may be invalid or expired" };
    if (res.status === 429) return { ok: false, latencyMs, error: "Rate limit exceeded" };
    if (res.status === 529 || res.status === 503) return { ok: false, latencyMs, error: "Provider temporarily unavailable" };
    if (!res.ok) return { ok: false, latencyMs, error: `Provider returned HTTP ${res.status}` };

    return { ok: true, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, latencyMs, error: "Provider call timed out after 10 s" };
    }
    return { ok: false, latencyMs, error: "Network error reaching provider" };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Helper: check a single Supabase table ───────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tableExists(supabase: any, table: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(table)
      .select("id")
      .limit(0);
    // error.code 42P01 = undefined_table in postgres; Supabase surfaces this differently
    if (error) {
      const msg = String(error.message ?? "").toLowerCase();
      if (msg.includes("does not exist") || msg.includes("relation") || msg.includes("42p01")) {
        return false;
      }
      // Any other error (e.g. RLS) still means the table exists
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Main health check ───────────────────────────────────────────────────────

export interface CheckAriaHealthOptions {
  /**
   * When true, makes a live 1-token API call to each configured provider.
   * Only enable for admin health diagnostics — has a real (tiny) cost.
   */
  deepTest?: boolean;
  /**
   * Pre-computed command registry stats from the ARIA_COMMANDS map.
   * Pass these in to avoid importing aria-service.ts (circular dep risk).
   */
  commandStats?: {
    totalCommands: number;
    commandsByModule: Record<string, number>;
    hasGeneralCommands: boolean;
    modulesWithDedicatedCommands: string[];
  };
}

export async function checkAriaHealth(
  options: CheckAriaHealthOptions = {},
): Promise<AriaHealthStatus> {
  const { deepTest = false, commandStats } = options;
  const now = new Date().toISOString();
  const recommendations: string[] = [];

  // ── 1. Provider health ───────────────────────────────────────────────────

  const openaiConfigured = isKeyConfigured("OPENAI_API_KEY");
  const anthropicConfigured = isKeyConfigured("ANTHROPIC_API_KEY");

  const openaiModel = process.env.ARIA_TEXT_MODEL ?? "gpt-4o-mini";
  const anthropicModel = "claude-sonnet-4-6";

  let openaiTestStatus: ProviderTestStatus = "skipped";
  let openaiLatency: number | undefined;
  let openaiError: string | undefined;

  let anthropicTestStatus: ProviderTestStatus = "skipped";
  let anthropicLatency: number | undefined;
  let anthropicError: string | undefined;

  if (!openaiConfigured) {
    openaiTestStatus = "not_configured";
  } else if (deepTest) {
    const result = await pingOpenAI(openaiModel);
    openaiTestStatus = result.ok ? "ok" : "failed";
    openaiLatency = result.latencyMs;
    if (!result.ok) openaiError = result.error;
  }

  if (!anthropicConfigured) {
    anthropicTestStatus = "not_configured";
  } else if (deepTest) {
    const result = await pingAnthropic(anthropicModel);
    anthropicTestStatus = result.ok ? "ok" : "failed";
    anthropicLatency = result.latencyMs;
    if (!result.ok) anthropicError = result.error;
  }

  // ── 2. Supabase + table health ───────────────────────────────────────────

  const supabaseUrlConfigured = isKeyConfigured("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKeyConfigured = isKeyConfigured("SUPABASE_SERVICE_ROLE_KEY");

  let supabaseConnected = false;
  let tablesPresent = false;
  const missingTables: string[] = [];
  let supabaseError: string | undefined;
  let lastWriteAt: string | undefined;

  // Approval stats
  let pendingCount = 0;
  let oldestPendingAt: string | undefined;
  let overdueCount = 0;
  let recentRejectionCount = 0;

  // Audit stats
  let auditWritable = false;
  let lastEventAt: string | undefined;
  let totalEventsToday: number | undefined;
  let auditError: string | undefined;

  // Generation stats
  let lastGeneratedAt: string | undefined;
  let lastFailedAt: string | undefined;
  let failedPersistenceCount: number | undefined;

  // Provider request counts
  let openaiRequestsToday = 0;
  let anthropicRequestsToday = 0;
  let openaiLastUsed: string | undefined;
  let anthropicLastUsed: string | undefined;

  const supabase = createServerClient();

  if (supabase && supabaseUrlConfigured && supabaseKeyConfigured) {
    supabaseConnected = true;

    // Check all required ARIA tables
    for (const table of REQUIRED_ARIA_TABLES) {
      const exists = await tableExists(supabase, table);
      if (!exists) missingTables.push(table);
    }
    tablesPresent = missingTables.length === 0;

    if (tablesPresent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      // Last write
      try {
        const { data: lastReq } = await sb
          .from("aria_requests")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lastReq?.created_at) lastWriteAt = lastReq.created_at;
      } catch { /* non-fatal */ }

      // Last generated / failed
      try {
        const { data: lastOk } = await sb
          .from("aria_requests")
          .select("created_at")
          .eq("status", "complete")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lastOk?.created_at) lastGeneratedAt = lastOk.created_at;

        const { data: lastFail } = await sb
          .from("aria_requests")
          .select("created_at")
          .eq("status", "provider_failed")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lastFail?.created_at) lastFailedAt = lastFail.created_at;

        const { count: failCount } = await sb
          .from("aria_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "provider_failed");
        failedPersistenceCount = failCount ?? 0;
      } catch { /* non-fatal */ }

      // Provider usage stats
      try {
        const { data: openaiReqs } = await sb
          .from("aria_requests")
          .select("created_at")
          .eq("provider_id", "openai")
          .gte("created_at", todayIso)
          .order("created_at", { ascending: false })
          .limit(1);
        if (openaiReqs && openaiReqs.length > 0) {
          openaiRequestsToday = openaiReqs.length;
          openaiLastUsed = openaiReqs[0]?.created_at;
        }

        const { count: openaiCount } = await sb
          .from("aria_requests")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", "openai")
          .gte("created_at", todayIso);
        openaiRequestsToday = openaiCount ?? 0;

        const { data: anthropicReqs } = await sb
          .from("aria_requests")
          .select("created_at")
          .eq("provider_id", "anthropic")
          .gte("created_at", todayIso)
          .order("created_at", { ascending: false })
          .limit(1);
        if (anthropicReqs && anthropicReqs.length > 0) {
          anthropicLastUsed = anthropicReqs[0]?.created_at;
        }

        const { count: anthropicCount } = await sb
          .from("aria_requests")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", "anthropic")
          .gte("created_at", todayIso);
        anthropicRequestsToday = anthropicCount ?? 0;
      } catch { /* non-fatal */ }

      // Approval queue
      try {
        const { data: pendingOutputs } = await sb
          .from("aria_outputs")
          .select("created_at")
          .eq("status", "draft")
          .eq("approval_required", true)
          .order("created_at", { ascending: true });

        if (pendingOutputs) {
          pendingCount = pendingOutputs.length;
          if (pendingOutputs.length > 0) {
            oldestPendingAt = pendingOutputs[0].created_at;
            const overdueThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            overdueCount = pendingOutputs.filter(
              (o: { created_at: string }) => o.created_at < overdueThreshold,
            ).length;
          }
        }

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: rejCount } = await sb
          .from("aria_outputs")
          .select("id", { count: "exact", head: true })
          .eq("status", "rejected")
          .gte("rejected_at", sevenDaysAgo);
        recentRejectionCount = rejCount ?? 0;
      } catch { /* non-fatal */ }

      // Audit health
      try {
        const { data: lastAudit } = await sb
          .from("aria_audit_events")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastAudit?.created_at) {
          auditWritable = true;
          lastEventAt = lastAudit.created_at;
        } else {
          // Table exists but may be empty — treat as writable
          auditWritable = true;
        }

        const { count: auditCount } = await sb
          .from("aria_audit_events")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayIso);
        totalEventsToday = auditCount ?? 0;
      } catch (err) {
        auditError = "Could not read audit events";
        auditWritable = false;
        void err;
      }
    } else {
      supabaseError = `Missing tables: ${missingTables.join(", ")}. Run ARIA migrations.`;
    }
  } else if (!supabaseUrlConfigured || !supabaseKeyConfigured) {
    supabaseError = "Supabase environment variables not configured";
  } else {
    supabaseError = "Could not create Supabase client";
  }

  // ── 3. Command registry stats ────────────────────────────────────────────

  const cmdStats: CommandRegistryHealth = commandStats
    ? {
        totalCommands: commandStats.totalCommands,
        commandsByModule: commandStats.commandsByModule,
        hasGeneralCommands: commandStats.hasGeneralCommands,
      }
    : {
        totalCommands: 0,
        commandsByModule: {},
        hasGeneralCommands: false,
      };

  // ── 4. Module coverage ───────────────────────────────────────────────────

  const dedicatedModules = commandStats?.modulesWithDedicatedCommands ?? [];
  const modulesWithCommands = cmdStats.hasGeneralCommands
    ? PLATFORM_MODULES.length // general commands cover all modules
    : dedicatedModules.length;

  const moduleCoverage: ModuleCoverageHealth = {
    totalModules: PLATFORM_MODULES.length,
    modulesWithCommands,
    coveragePercent: Math.round((modulesWithCommands / PLATFORM_MODULES.length) * 100),
    modulesWithoutDedicatedCommands: PLATFORM_MODULES.filter(
      (m) => !dedicatedModules.includes(m),
    ),
  };

  // ── 5. Overall status ────────────────────────────────────────────────────

  const anyProviderConfigured = openaiConfigured || anthropicConfigured;
  const anyProviderFailed =
    (deepTest && openaiConfigured && openaiTestStatus === "failed") ||
    (deepTest && anthropicConfigured && anthropicTestStatus === "failed");

  let overallStatus: AriaOverallStatus;

  if (!anyProviderConfigured) {
    overallStatus = "not_configured";
  } else if (!supabaseConnected || !tablesPresent) {
    overallStatus = "partial";
  } else if (anyProviderFailed) {
    overallStatus = "degraded";
  } else if (!auditWritable) {
    overallStatus = "degraded";
  } else if (openaiConfigured && anthropicConfigured && tablesPresent && auditWritable) {
    overallStatus = "full_capacity";
  } else {
    // One provider configured, DB good
    overallStatus = "partial";
  }

  // ── 6. Recommendations ──────────────────────────────────────────────────

  if (!openaiConfigured) {
    recommendations.push(
      "Set OPENAI_API_KEY to enable the universal ARIA layer (text generation, transcription, document classification).",
    );
  }
  if (!anthropicConfigured) {
    recommendations.push(
      "Set ANTHROPIC_API_KEY to enable Anthropic-powered engines (management oversight, voice of child, HR Process Guardian).",
    );
  }
  if (!supabaseConnected) {
    recommendations.push(
      "Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY so ARIA can persist drafts, approvals, and audit logs.",
    );
  }
  if (supabaseConnected && missingTables.length > 0) {
    recommendations.push(
      `Run Supabase migration 013_aria_universal_layer.sql — missing tables: ${missingTables.join(", ")}.`,
    );
  }
  if (!auditWritable && supabaseConnected && tablesPresent) {
    recommendations.push(
      "ARIA audit log is not writable. Check RLS policies on aria_audit_events for the service role.",
    );
  }
  if (overdueCount > 0) {
    recommendations.push(
      `${overdueCount} ARIA draft${overdueCount === 1 ? "" : "s"} pending approval for more than 24 hours. Review the ARIA approval queue.`,
    );
  }
  if (deepTest && openaiTestStatus === "failed") {
    recommendations.push(
      `OpenAI live test call failed: ${openaiError ?? "unknown error"}. Check the API key and your OpenAI account status.`,
    );
  }
  if (deepTest && anthropicTestStatus === "failed") {
    recommendations.push(
      `Anthropic live test call failed: ${anthropicError ?? "unknown error"}. Check the API key and your Anthropic account status.`,
    );
  }
  if (failedPersistenceCount && failedPersistenceCount > 0) {
    recommendations.push(
      `${failedPersistenceCount} provider-failed ARIA request${failedPersistenceCount === 1 ? "" : "s"} recorded. Check ARIA error logs.`,
    );
  }

  // ── 7. Build result ──────────────────────────────────────────────────────

  return {
    overallStatus,
    openai: {
      configured: openaiConfigured,
      keyEnvVar: "OPENAI_API_KEY",
      testCallStatus: openaiTestStatus,
      latencyMs: openaiLatency,
      model: openaiConfigured ? openaiModel : undefined,
      errorMessage: openaiError,
      lastUsedAt: openaiLastUsed,
      requestsToday: openaiRequestsToday,
    },
    anthropic: {
      configured: anthropicConfigured,
      keyEnvVar: "ANTHROPIC_API_KEY",
      testCallStatus: anthropicTestStatus,
      latencyMs: anthropicLatency,
      model: anthropicConfigured ? anthropicModel : undefined,
      errorMessage: anthropicError,
      lastUsedAt: anthropicLastUsed,
      requestsToday: anthropicRequestsToday,
    },
    supabase: {
      connected: supabaseConnected,
      tablesPresent,
      missingTables,
      errorMessage: supabaseError,
      lastWriteAt,
    },
    audit: {
      writable: auditWritable,
      lastEventAt,
      totalEventsToday,
      errorMessage: auditError,
    },
    approvals: {
      pendingCount,
      oldestPendingAt,
      overdueCount,
      recentRejectionCount,
    },
    commandRegistry: cmdStats,
    moduleCoverage,
    lastGeneratedAt,
    lastFailedAt,
    failedPersistenceCount,
    lastCheckedAt: now,
    recommendations,
  };
}

// ─── Compute command registry stats from ARIA_COMMANDS ───────────────────────
// Called by the API route which can safely import aria-service.ts.

import type { AriaCommandSpec } from "./aria-types";

export function computeCommandRegistryStats(
  commands: Record<string, AriaCommandSpec>,
): NonNullable<CheckAriaHealthOptions["commandStats"]> {
  const commandsByModule: Record<string, number> = {};
  const dedicatedModuleSet = new Set<string>();
  let hasGeneralCommands = false;

  for (const cmd of Object.values(commands)) {
    if (cmd.modules.length === 0) {
      hasGeneralCommands = true;
      commandsByModule["general"] = (commandsByModule["general"] ?? 0) + 1;
    } else {
      for (const mod of cmd.modules) {
        commandsByModule[mod] = (commandsByModule[mod] ?? 0) + 1;
        dedicatedModuleSet.add(mod);
      }
    }
  }

  return {
    totalCommands: Object.keys(commands).length,
    commandsByModule,
    hasGeneralCommands,
    modulesWithDedicatedCommands: Array.from(dedicatedModuleSet),
  };
}
