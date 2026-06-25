import { describe, it, expect } from "vitest";
import {
  summariseGatewayAudit,
  classifyRefusal,
  type AiGatewayAuditEntry,
} from "../audit-summary";

const NOW = "2026-06-25T12:00:00.000Z";

function entry(over: Partial<AiGatewayAuditEntry>): AiGatewayAuditEntry {
  return {
    at: NOW,
    purpose: "test",
    feature: "cara_text",
    method: "deterministic",
    sensitivity: "internal",
    identifiableDataSent: false,
    redactionCount: 0,
    ...over,
  };
}

describe("classifyRefusal", () => {
  it("maps the gateway's refusal strings to stable buckets", () => {
    expect(classifyRefusal("AI is disabled (CARA_AI_ENABLED=false).")).toBe("kill_switch");
    expect(classifyRefusal("No AI provider is configured (no API key).")).toBe("no_provider");
    expect(classifyRefusal("Estimated cost £0.9 exceeds the per-request limit £0.5.")).toBe("cost_limit");
    expect(classifyRefusal("Daily AI budget (£100) reached for the organisation.")).toBe("cost_limit");
    expect(classifyRefusal("Caller is not permitted to use AI.")).toBe("permission");
    expect(classifyRefusal("Data classified 'safeguarding_sensitive' must not be sent to an external model; answered deterministically.")).toBe("sensitivity_block");
    expect(classifyRefusal("AI provider unavailable; deterministic fallback returned.")).toBe("provider_unavailable");
    expect(classifyRefusal(undefined)).toBe("other");
    expect(classifyRefusal("something weird")).toBe("other");
  });
});

describe("summariseGatewayAudit", () => {
  it("returns honest zeros for an empty log (avoided_pct 0, NOT 100)", () => {
    const s = summariseGatewayAudit([], NOW);
    expect(s.total).toBe(0);
    expect(s.avoided_pct).toBe(0);
    expect(s.ai_calls).toBe(0);
    expect(s.avoided_calls).toBe(0);
    expect(s.by_feature).toEqual([]);
    expect(s.refused_by_reason).toEqual([]);
  });

  it("counts methods and computes avoided = deterministic + cache + refused", () => {
    const s = summariseGatewayAudit(
      [
        entry({ method: "deterministic" }),
        entry({ method: "deterministic" }),
        entry({ method: "cache" }),
        entry({ method: "ai" }),
        entry({ method: "refused", refusedReason: "No AI provider is configured (no API key)." }),
      ],
      NOW,
    );
    expect(s.total).toBe(5);
    expect(s.by_method).toEqual({ deterministic: 2, cache: 1, ai: 1, refused: 1 });
    expect(s.ai_calls).toBe(1);
    expect(s.avoided_calls).toBe(4);
    expect(s.avoided_pct).toBe(80);
    expect(s.deterministic_calls).toBe(3); // deterministic + cache
  });

  it("excludes entries outside the window", () => {
    const old = "2026-04-01T12:00:00.000Z"; // > 30 days before NOW
    const s = summariseGatewayAudit(
      [entry({ method: "ai", at: old }), entry({ method: "ai", at: NOW })],
      NOW,
    );
    expect(s.total).toBe(1);
    expect(s.ai_calls).toBe(1);
  });

  it("aggregates redaction events, redacted items and identifiable-sent", () => {
    const s = summariseGatewayAudit(
      [
        entry({ method: "ai", redactionCount: 3, identifiableDataSent: false }),
        entry({ method: "ai", redactionCount: 1, identifiableDataSent: true }),
        entry({ method: "deterministic", redactionCount: 0 }),
      ],
      NOW,
    );
    expect(s.redaction_events).toBe(2);
    expect(s.redacted_items).toBe(4);
    expect(s.identifiable_sent).toBe(1);
  });

  it("buckets refusals by reason (ordered) and surfaces sensitivity blocks", () => {
    const s = summariseGatewayAudit(
      [
        entry({ method: "refused", refusedReason: "No AI provider is configured (no API key)." }),
        entry({ method: "refused", refusedReason: "No AI provider is configured (no API key)." }),
        entry({ method: "refused", refusedReason: "Data classified 'safeguarding_sensitive' must not be sent to an external model; answered deterministically." }),
      ],
      NOW,
    );
    expect(s.sensitivity_blocks).toBe(1);
    // no_provider is ordered before sensitivity_block
    expect(s.refused_by_reason).toEqual([
      { reason: "no_provider", count: 2 },
      { reason: "sensitivity_block", count: 1 },
    ]);
  });

  it("aggregates per-feature totals (ai vs avoided), sorted by volume", () => {
    const s = summariseGatewayAudit(
      [
        entry({ feature: "incident_draft", method: "ai" }),
        entry({ feature: "incident_draft", method: "deterministic" }),
        entry({ feature: "incident_draft", method: "refused", refusedReason: "No AI provider is configured (no API key)." }),
        entry({ feature: "manager_assistant", method: "ai" }),
      ],
      NOW,
    );
    expect(s.by_feature[0]).toEqual({ feature: "incident_draft", total: 3, ai: 1, avoided: 2 });
    expect(s.by_feature[1]).toEqual({ feature: "manager_assistant", total: 1, ai: 1, avoided: 0 });
  });
});
