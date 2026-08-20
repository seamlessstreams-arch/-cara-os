import "server-only";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SUBSCRIPTION AUTH AVAILABILITY (SDK-free, statically importable)
//
// The environment checks for the Claude-subscription auth route live here so
// getCaraProviderConfig can import them statically — no dynamic require, no
// SDK in the module graph. The Agent SDK itself is only loaded at call time
// inside claude-subscription-provider.ts.
// ══════════════════════════════════════════════════════════════════════════════

export const SUBSCRIPTION_TIMEOUT_ENV = "CARA_REWRITE_TIMEOUT_MS";
const DEFAULT_TIMEOUT_MS = 8_000;

export function subscriptionTimeoutMs(): number {
  const raw = Number.parseInt(process.env[SUBSCRIPTION_TIMEOUT_ENV] ?? "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

/**
 * Why subscription auth cannot run here, or null when the environment is fine.
 * Serverless means a multi-user deployment surface AND no logged-in Claude
 * environment — both disqualifying on their own. CI is blocked so tests can
 * never accidentally satisfy the availability check.
 */
export function subscriptionEnvironmentBlocked(): string | null {
  if (process.env.VERCEL) return "serverless (Vercel)";
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return "serverless (AWS Lambda)";
  if (process.env.CI) return "CI environment";
  return null;
}

/** Has the operator explicitly selected subscription auth? Opt-in only. */
export function subscriptionAuthSelected(): boolean {
  const provider = (process.env.CARA_PROVIDER ?? process.env.AI_PROVIDER ?? "").toLowerCase();
  return provider === "claude_subscription";
}

/**
 * Available ⇔ explicitly selected AND not in a blocked environment. A broken
 * SDK install or logged-out CLI surfaces as a call-time rejection instead,
 * which callers degrade from deterministically — indistinguishable from an
 * unconfigured provider, as required.
 */
export function isSubscriptionAuthAvailable(): boolean {
  return subscriptionAuthSelected() && subscriptionEnvironmentBlocked() === null;
}
