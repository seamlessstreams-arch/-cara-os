// ══════════════════════════════════════════════════════════════════════════════
// CARA — FEATURE FLAG REGISTRY (the single source of truth for operational toggles)
//
// Cara already had ~a dozen env-based toggles read ad hoc across the code, with
// two opposite polarities — some required ="true" (opt-in), others only disabled
// on ="false" (opt-out). Flipping a flag therefore had inconsistent effects and
// there was no catalogue of what existed. This is the typed registry the LEAF
// Phase-1 foundation calls for: ONE place that declares every operational flag —
// its env var, polarity, default, stability and description — behind a single
// isFeatureEnabled() reader.
//
// Design (mirrors ai-availability.ts, the AI kill-switch chokepoint):
//   • PURE — reads process.env only, no server-only APIs, safe to import anywhere.
//   • ADDITIVE — existing direct `process.env.X` reads keep working unchanged;
//     this documents + unifies them and is the home for NEW flags.
//   • DEMO-SAFE — the demo depends on no env being set, so every flag resolves to
//     its documented default with an empty environment (the demo's state).
//
// Convention for NEW functionality (per the master prompt): register the flag
// here as `opt_in` (default OFF) and gate the feature on isFeatureEnabled(), so
// substantial new behaviour ships dark until deliberately switched on.
// ══════════════════════════════════════════════════════════════════════════════

/** opt_in → OFF unless the env var is explicitly truthy (new/unproven features).
 *  opt_out → ON unless the env var is explicitly "false" (kill-switch style). */
export type FlagPolarity = "opt_in" | "opt_out";

/** How settled a flag is — surfaced for operators, not used in resolution. */
export type FlagStability = "stable" | "beta" | "experimental";

export interface FeatureFlag {
  /** Canonical id used in code (isFeatureEnabled("...")). */
  key: string;
  /** The environment variable that controls it. */
  env: string;
  polarity: FlagPolarity;
  /** Resolved value when the env var is unset — derived from polarity, stored
   *  explicitly for readability (asserted consistent in the tests). */
  default: boolean;
  stability: FlagStability;
  description: string;
}

// ── Registry ──────────────────────────────────────────────────────────────────
// Existing operational toggles are catalogued here (their readers still live at
// their call sites — this does not change their behaviour, it documents them and
// gives a single introspection point). New Phase-1 infra flags are opt-in.

const FLAGS = {
  // ── Access & security (existing kill-switches — opt-out) ──────────────────
  sensitive_access_enforced: {
    key: "sensitive_access_enforced",
    env: "SENSITIVE_ACCESS_ENFORCED",
    polarity: "opt_out",
    default: true,
    stability: "stable",
    description: "Server-side permission enforcement + access logging on confidential records.",
  },
  sensitive_employment_lockout: {
    key: "sensitive_employment_lockout",
    env: "SENSITIVE_EMPLOYMENT_LOCKOUT",
    polarity: "opt_out",
    default: true,
    stability: "stable",
    description: "Deny suspended/departed staff confidential records regardless of role (insider-threat control).",
  },
  sensitive_abac_shadow: {
    key: "sensitive_abac_shadow",
    env: "SENSITIVE_ABAC_SHADOW",
    polarity: "opt_out",
    default: true,
    stability: "stable",
    description: "Run the rich ABAC engine in advisory mode on sensitive access, logging divergence from the flat grant.",
  },
  shift_based_access_enforced: {
    key: "shift_based_access_enforced",
    env: "SHIFT_BASED_ACCESS_ENFORCED",
    polarity: "opt_out",
    default: true,
    stability: "stable",
    description: "Require general care staff to have an active shift to reach shift-gated resources.",
  },
  // ── Assistive features (existing — opt-out) ───────────────────────────────
  writing_assistant: {
    key: "writing_assistant",
    env: "WRITING_ASSISTANT_ENABLED",
    polarity: "opt_out",
    default: true,
    stability: "stable",
    description: "The inline care-recording writing assistant across record editors.",
  },
  ai_global: {
    key: "ai_global",
    env: "CARA_AI_ENABLED",
    polarity: "opt_out",
    default: true,
    stability: "stable",
    description: "Global AI kill-switch. Provider-key presence is a separate gate (see ai-availability.ts).",
  },
  // ── Phase-1 infra (new functionality — opt-in, ships dark) ────────────────
  practice_live_separation: {
    key: "practice_live_separation",
    env: "CARA_PRACTICE_LIVE_SEPARATION",
    polarity: "opt_in",
    default: false,
    stability: "beta",
    description: "Separate practice (training/sandbox) from live data — labelling + write-guard. Off in the demo.",
  },
  cron_scheduler: {
    key: "cron_scheduler",
    env: "CARA_CRON_ENABLED",
    polarity: "opt_in",
    default: false,
    stability: "beta",
    description: "Allow the scheduled-jobs endpoint to run due reminders / escalation sweeps (Vercel cron).",
  },
  // ── Phase-2 Operational Control ────────────────────────────────────────────
  automation_executor: {
    key: "automation_executor",
    env: "CARA_AUTOMATION_EXECUTOR",
    polarity: "opt_in",
    default: false,
    stability: "beta",
    description:
      "Let the automation engine EXECUTE safe rule actions (create task / notify / audit-log). Off = simulate-only (today's behaviour). Official-record actions always require human confirmation regardless.",
  },
  recurring_checks: {
    key: "recurring_checks",
    env: "CARA_RECURRING_CHECKS",
    polarity: "opt_in",
    default: false,
    stability: "beta",
    description:
      "Materialise the recurring compliance checks (fire alarm, medication audit, water temps, …) as tasks each period via the cron endpoint. Off = read-only engine, no tasks created.",
  },
  // ── Phase-5 Home-Ops ───────────────────────────────────────────────────────
  monitoring_plans_write: {
    key: "monitoring_plans_write",
    env: "CARA_MONITORING_PLANS_WRITE",
    polarity: "opt_in",
    default: false,
    stability: "beta",
    description:
      "Allow creating / updating / ending individual monitoring plans (observation levels are a restriction on the child — an official record). Off = the board stays read-only over seeded/existing plans; writes are a no-op. Writes are validator-gated (restriction acknowledged + rationale + child's views + 28-day review) and MANAGE_SAFEGUARDING-gated; never set automatically.",
  },
  // ── Doc-Version-Workflow ───────────────────────────────────────────────────
  doc_versioning_write: {
    key: "doc_versioning_write",
    env: "CARA_DOC_VERSIONING_WRITE",
    polarity: "opt_in",
    default: false,
    stability: "experimental",
    description:
      "Allow recording document versions into the generic versioning spine (append-only snapshots + supersession chain). Off = the record endpoint is a no-op; reads always work. No doc type consumes the spine until its own adoption module lands.",
  },
  // ── Phase-4 Workforce ──────────────────────────────────────────────────────
  candidate_to_staff_bridge: {
    key: "candidate_to_staff_bridge",
    env: "CARA_CANDIDATE_TO_STAFF_BRIDGE",
    polarity: "opt_in",
    default: false,
    stability: "beta",
    description:
      "Let a manager appoint a fully-cleared, appointed candidate into a real StaffMember record (creating an official record). Off = the appoint endpoint is a no-op. Gated by MANAGE_STAFF + the safer-recruitment 'cleared' gate; never automatic.",
  },
  voice_follow_through_write: {
    key: "voice_follow_through_write",
    env: "CARA_VOICE_FOLLOW_THROUGH_WRITE",
    polarity: "opt_in",
    default: false,
    stability: "experimental",
    description:
      "Enable creating and progressing child-voice concern loops (listen → act → explain back → review with child). Off = the follow-through board is read-only over seeded/existing loops; no stage transitions or new loops can be written.",
  },
} as const satisfies Record<string, FeatureFlag>;

export type FlagKey = keyof typeof FLAGS;

/** The full registry (read-only), keyed by canonical flag id. */
export const FEATURE_FLAGS: Readonly<Record<FlagKey, FeatureFlag>> = FLAGS;

/** All known flag keys. */
export const FLAG_KEYS = Object.keys(FLAGS) as FlagKey[];

const TRUTHY = new Set(["true", "1", "on", "yes", "enabled"]);
const FALSY = new Set(["false", "0", "off", "no", "disabled"]);

/**
 * Is this feature enabled in the current environment?
 *
 * Resolution: an unset (or unrecognised) env var yields the flag's documented
 * default; otherwise the env value is parsed truthy/falsy. Never throws — an
 * unknown key resolves to `false` (least-privilege) rather than crashing a caller.
 */
export function isFeatureEnabled(key: FlagKey): boolean {
  const flag = FLAGS[key];
  if (!flag) return false;
  const raw = (process.env[flag.env] ?? "").trim().toLowerCase();
  if (raw === "") return flag.default;
  if (TRUTHY.has(raw)) return true;
  if (FALSY.has(raw)) return false;
  return flag.default; // unrecognised value → documented default
}

export interface ResolvedFlag extends FeatureFlag {
  enabled: boolean;
  /** True when the resolved value differs from the documented default (an
   *  operator has overridden it via env). */
  overridden: boolean;
}

/** Resolve every flag's current state — for an operator/HQ inspection surface.
 *  Contains no secrets (flag metadata + booleans only). */
export function describeFlags(): ResolvedFlag[] {
  return FLAG_KEYS.map((key) => {
    const flag = FLAGS[key];
    const enabled = isFeatureEnabled(key);
    return { ...flag, enabled, overridden: enabled !== flag.default };
  });
}
