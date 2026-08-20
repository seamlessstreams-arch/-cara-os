// ══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION AUTH — gateway-level guarantees, no SDK and no key required.
//
// Uses the gateway's injectable deps (the same seams every other gateway test
// uses) so CI stays deterministic: no Claude login, no ANTHROPIC_API_KEY, no
// network. What must hold:
//
//   1. Serverless / CI context → the provider reports unavailable at
//      configuration time, indistinguishable from "not configured".
//   2. Provider unavailable → the gateway refuses and the caller's
//      deterministic floor is what runs (llmUsed=false, method=refused).
//   3. A £0 subscription call is still audited — authSource travels to the
//      audit entry, cost is £0, tokens are real.
//   4. Safeguarding-sensitive text never reaches the generation seam,
//      whichever way the call would have been authenticated.
//   5. The usage meter estimates £0 for subscription auth but keeps tokens.
// ══════════════════════════════════════════════════════════════════════════════

import { afterEach, describe, expect, it, vi } from "vitest";
import { invokeAiGateway, getAiGatewayAuditLog, __resetAiGatewayAuditLog } from "../ai-gateway";
import {
  subscriptionEnvironmentBlocked,
  isSubscriptionAuthAvailable,
  subscriptionTimeoutMs,
} from "../../providers/claude-subscription-provider";
import { getCaraProviderConfig } from "../../cara-provider";
import { estimateCostGbp } from "@/lib/hq/usage-meter";

afterEach(() => {
  vi.unstubAllEnvs();
  __resetAiGatewayAuditLog();
});

describe("subscription availability is opt-in and refuses hostile environments", () => {
  it("reports the serverless environment as blocked", () => {
    vi.stubEnv("VERCEL", "1");
    expect(subscriptionEnvironmentBlocked()).toContain("Vercel");
    vi.unstubAllEnvs();
    vi.stubEnv("AWS_LAMBDA_FUNCTION_NAME", "fn");
    expect(subscriptionEnvironmentBlocked()).toContain("Lambda");
  });

  it("reports CI as blocked, so the golden model path can never fire there", () => {
    vi.stubEnv("CI", "true");
    expect(subscriptionEnvironmentBlocked()).toContain("CI");
  });

  it("is unavailable unless AI_PROVIDER=claude_subscription is explicitly set", () => {
    vi.stubEnv("CI", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("AWS_LAMBDA_FUNCTION_NAME", "");
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("CARA_PROVIDER", "");
    expect(isSubscriptionAuthAvailable()).toBe(false);
  });

  it("getCaraProviderConfig degrades to configured:false in a blocked environment", () => {
    vi.stubEnv("AI_PROVIDER", "claude_subscription");
    vi.stubEnv("VERCEL", "1");
    const cfg = getCaraProviderConfig();
    expect(cfg.configured).toBe(false);
    expect(cfg.authSource).toBe("subscription");
    expect(cfg.reason).toContain("local/self-hosted");
  });

  it("keeps the recipient truthful: subscription auth still reports Anthropic", () => {
    vi.stubEnv("CI", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("AWS_LAMBDA_FUNCTION_NAME", "");
    vi.stubEnv("AI_PROVIDER", "claude_subscription");
    const cfg = getCaraProviderConfig();
    expect(cfg.configured).toBe(true);
    expect(cfg.providerId).toBe("anthropic"); // the risk register keys off this
    expect(cfg.authSource).toBe("subscription");
  });

  it("timeout defaults to 8s and honours CARA_REWRITE_TIMEOUT_MS", () => {
    vi.stubEnv("CARA_REWRITE_TIMEOUT_MS", "");
    expect(subscriptionTimeoutMs()).toBe(8000);
    vi.stubEnv("CARA_REWRITE_TIMEOUT_MS", "12000");
    expect(subscriptionTimeoutMs()).toBe(12000);
  });
});

describe("gateway behaviour under subscription auth", () => {
  it("provider unavailable → refused, and the caller's deterministic floor runs", async () => {
    const generate = vi.fn();
    const r = await invokeAiGateway(
      { purpose: "t", feature: "t", systemPrompt: "s", userPrompt: "improve this note", sensitivity: "internal" },
      { providerConfigured: () => false, generate },
    );
    expect(r.method).toBe("refused");
    expect(r.llmUsed).toBe(false);
    expect(generate).not.toHaveBeenCalled();
  });

  it("a £0 subscription call is audited with authSource and real tokens", async () => {
    vi.stubEnv("CI", "");
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("AWS_LAMBDA_FUNCTION_NAME", "");
    vi.stubEnv("AI_PROVIDER", "claude_subscription");
    const r = await invokeAiGateway(
      { purpose: "t", feature: "t", systemPrompt: "s", userPrompt: "improve this note", sensitivity: "internal" },
      {
        providerConfigured: () => true,
        aiKillSwitchOn: () => false,
        permitAi: () => true,
        isProviderAllowedForSensitivity: () => true,
        generate: async () => ({
          text: "Improved note.",
          llmUsed: true,
          providerId: "anthropic",
          authSource: "subscription",
          modelId: "claude-sonnet-5",
          tokensInput: 120,
          tokensOutput: 40,
        }),
      },
    );
    expect(r.llmUsed).toBe(true);
    expect(r.authSource).toBe("subscription");
    expect(r.costGbp).toBe(0); // £0 by definition — never a fabricated API spend
    expect(r.tokensInput).toBe(120); // ...but the model use is never hidden
    const audit = getAiGatewayAuditLog().at(-1);
    expect(audit?.authSource).toBe("subscription");
    expect(audit?.costGbp).toBe(0);
    expect(audit?.method).toBe("ai");
  });

  it("safeguarding-sensitive text never reaches the generation seam", async () => {
    const generate = vi.fn();
    const r = await invokeAiGateway(
      {
        purpose: "t",
        feature: "t",
        systemPrompt: "s",
        userPrompt: "a disclosure was made about the allegation",
        sensitivity: "safeguarding_sensitive",
      },
      { providerConfigured: () => true, aiKillSwitchOn: () => false, permitAi: () => true, generate },
    );
    expect(r.method).toBe("refused");
    expect(generate).not.toHaveBeenCalled();
  });
});

describe("usage meter under subscription auth", () => {
  it("estimates £0 for subscription calls while API-key pricing is unchanged", () => {
    const base = { feature: "t", model: "claude-sonnet-5", tokensInput: 1_000_000, tokensOutput: 0 };
    expect(estimateCostGbp({ ...base, authSource: "subscription" })).toBe(0);
    expect(estimateCostGbp({ ...base, authSource: "api_key" })).toBeGreaterThan(0);
    expect(estimateCostGbp(base)).toBeGreaterThan(0); // default stays api_key
  });
});
