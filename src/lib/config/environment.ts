// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE vs LIVE ENVIRONMENT SEPARATION (Phase 1 infra · 2/3)
//
// A registered home needs a "practice" (training / sandbox) environment distinct
// from "live" (real children's data), so staff can be trained and features
// rehearsed without polluting real records, and so a practice instance can never
// perform a real outward action (a statutory notification, a durable write) as if
// it were live. This is the primitive that makes that distinction explicit.
//
// Built on the Module 8 feature-flag registry:
//   • Gated by isFeatureEnabled("practice_live_separation") — OPT-IN, default OFF.
//   • DEMO-SAFE: with the flag off (the demo's state) separation is INACTIVE, the
//     environment resolves to "live" (the single real instance) and every guard is
//     a no-op — the demo behaves exactly as before.
//   • FAIL-SAFE: when separation is ON but CARA_ENVIRONMENT is unset, the
//     environment resolves to "practice", never "live" — an unlabelled instance is
//     treated as a sandbox so real actions are withheld until it is explicitly
//     marked live.
//
// PURE — reads process.env only (via the flag registry). Safe to import anywhere.
// ══════════════════════════════════════════════════════════════════════════════

import { isFeatureEnabled } from "./feature-flags";

export type CaraEnvironment = "practice" | "live";

/** The environment variable that labels an instance when separation is active. */
const ENV_VAR = "CARA_ENVIRONMENT";

/** Is practice/live separation switched on? (Module 8 flag; default OFF.) */
export function isSeparationActive(): boolean {
  return isFeatureEnabled("practice_live_separation");
}

/**
 * The current environment.
 *   • Separation OFF (default/demo) → "live": one undifferentiated real instance.
 *   • Separation ON  → read CARA_ENVIRONMENT; "live" only when explicitly "live",
 *     otherwise "practice" (fail-safe for an unlabelled or mislabelled instance).
 */
export function getEnvironment(): CaraEnvironment {
  if (!isSeparationActive()) return "live";
  const raw = (process.env[ENV_VAR] ?? "").trim().toLowerCase();
  return raw === "live" ? "live" : "practice";
}

/** True when this instance is a practice/training/sandbox environment. */
export function isPractice(): boolean {
  return getEnvironment() === "practice";
}

/** True when this instance is the live (real children's data) environment. */
export function isLive(): boolean {
  return getEnvironment() === "live";
}

/**
 * Guard a LIVE-ONLY side effect (a real notification, an outward send, a durable
 * write that must not originate from a sandbox). Returns a block reason when the
 * instance is a practice environment, or null to proceed.
 *
 * No-op when separation is inactive (returns null), so existing callers that
 * adopt it are unaffected in the demo. Adoption at real call sites is incremental;
 * this is the primitive they consult.
 *
 *   const blocked = guardLiveAction("send Reg 40 notification");
 *   if (blocked) return { ok: false, reason: blocked };
 */
export function guardLiveAction(actionLabel: string): string | null {
  if (!isSeparationActive()) return null;
  if (isPractice()) {
    return `Blocked in practice environment: "${actionLabel}" is a live-only action. Switch to the live environment to perform it.`;
  }
  return null;
}

/** The environment label to stamp on records created by this instance, so
 *  practice-origin data is distinguishable from live. Null when separation is
 *  inactive (nothing to distinguish). */
export function environmentTag(): CaraEnvironment | null {
  return isSeparationActive() ? getEnvironment() : null;
}

export interface EnvironmentDescriptor {
  environment: CaraEnvironment;
  separationActive: boolean;
  /** Short banner text for the UI; null when separation is inactive. */
  banner: string | null;
  /** Whether live-only side effects are currently withheld. */
  liveActionsBlocked: boolean;
}

/** Describe the environment for a banner / status surface (no secrets). */
export function describeEnvironment(): EnvironmentDescriptor {
  const separationActive = isSeparationActive();
  const environment = getEnvironment();
  return {
    environment,
    separationActive,
    banner: separationActive
      ? environment === "practice"
        ? "PRACTICE environment — training/sandbox. Records here are not live and live-only actions are withheld."
        : "LIVE environment — real children's data."
      : null,
    liveActionsBlocked: separationActive && environment === "practice",
  };
}
