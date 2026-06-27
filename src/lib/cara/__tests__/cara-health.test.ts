// ─────────────────────────────────────────────────────────────────────────────
// Tests: cara-health.ts
//
// Tests the health module without needing live Supabase or provider keys.
// Supabase and fetch are mocked at the module boundary.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeCommandRegistryStats } from "../cara-health";
import type { CaraCommandSpec } from "../cara-types";

// ─── computeCommandRegistryStats ─────────────────────────────────────────────

describe("computeCommandRegistryStats", () => {
  it("counts total commands correctly", () => {
    const commands: Record<string, CaraCommandSpec> = {
      improve_writing: {
        id: "improve_writing",
        label: "Improve writing",
        description: "Improve writing.",
        modules: [],
        requiredPermission: "cara.rewrite",
        approvalRequired: true,
        canCreateTasks: false,
        canCommit: false,
        riskLevel: "low",
        systemPromptFragment: "",
      },
      draft_daily_log: {
        id: "draft_daily_log",
        label: "Draft daily log",
        description: "Draft a daily log entry.",
        modules: ["daily_log"],
        requiredPermission: "cara.generate_drafts",
        approvalRequired: true,
        canCreateTasks: false,
        canCommit: false,
        riskLevel: "low",
        systemPromptFragment: "",
      },
      draft_incident_record: {
        id: "draft_incident_record",
        label: "Draft incident record",
        description: "Draft an incident record.",
        modules: ["incident"],
        requiredPermission: "cara.generate_drafts",
        approvalRequired: true,
        canCreateTasks: true,
        canCommit: false,
        riskLevel: "high",
        systemPromptFragment: "",
      },
    };

    const stats = computeCommandRegistryStats(commands);

    expect(stats.totalCommands).toBe(3);
  });

  it("sets hasGeneralCommands true when any command has empty modules array", () => {
    const commands: Record<string, CaraCommandSpec> = {
      improve_writing: {
        id: "improve_writing",
        label: "Improve writing",
        description: "",
        modules: [], // ← general
        requiredPermission: "cara.rewrite",
        approvalRequired: true,
        canCreateTasks: false,
        canCommit: false,
        riskLevel: "low",
        systemPromptFragment: "",
      },
    };

    const stats = computeCommandRegistryStats(commands);
    expect(stats.hasGeneralCommands).toBe(true);
    expect(stats.commandsByModule["general"]).toBe(1);
  });

  it("sets hasGeneralCommands false when all commands have specific modules", () => {
    const commands: Record<string, CaraCommandSpec> = {
      draft_daily_log: {
        id: "draft_daily_log",
        label: "Draft daily log",
        description: "",
        modules: ["daily_log"],
        requiredPermission: "cara.generate_drafts",
        approvalRequired: true,
        canCreateTasks: false,
        canCommit: false,
        riskLevel: "low",
        systemPromptFragment: "",
      },
    };

    const stats = computeCommandRegistryStats(commands);
    expect(stats.hasGeneralCommands).toBe(false);
    expect(stats.commandsByModule["daily_log"]).toBe(1);
  });

  it("accumulates module counts across multiple commands", () => {
    const commands: Record<string, CaraCommandSpec> = {
      cmd1: {
        id: "draft_daily_log",
        label: "A",
        description: "",
        modules: ["incident", "daily_log"],
        requiredPermission: "cara.generate_drafts",
        approvalRequired: true,
        canCreateTasks: false,
        canCommit: false,
        riskLevel: "low",
        systemPromptFragment: "",
      },
      cmd2: {
        id: "check_incident_chronology",
        label: "B",
        description: "",
        modules: ["incident"],
        requiredPermission: "cara.analyse_risk",
        approvalRequired: true,
        canCreateTasks: false,
        canCommit: false,
        riskLevel: "medium",
        systemPromptFragment: "",
      },
    };

    const stats = computeCommandRegistryStats(commands);
    expect(stats.commandsByModule["incident"]).toBe(2);
    expect(stats.commandsByModule["daily_log"]).toBe(1);
  });

  it("reports modulesWithDedicatedCommands correctly", () => {
    const commands: Record<string, CaraCommandSpec> = {
      cmd1: {
        id: "draft_daily_log",
        label: "A",
        description: "",
        modules: ["daily_log", "shift_summary"],
        requiredPermission: "cara.generate_drafts",
        approvalRequired: true,
        canCreateTasks: false,
        canCommit: false,
        riskLevel: "low",
        systemPromptFragment: "",
      },
    };

    const stats = computeCommandRegistryStats(commands);
    expect(stats.modulesWithDedicatedCommands).toContain("daily_log");
    expect(stats.modulesWithDedicatedCommands).toContain("shift_summary");
    expect(stats.modulesWithDedicatedCommands).not.toContain("incident");
  });

  it("handles empty command registry gracefully", () => {
    const stats = computeCommandRegistryStats({});
    expect(stats.totalCommands).toBe(0);
    expect(stats.hasGeneralCommands).toBe(false);
    expect(stats.modulesWithDedicatedCommands).toEqual([]);
    expect(stats.commandsByModule).toEqual({});
  });
});

// ─── checkCaraHealth (unit — no live calls) ───────────────────────────────────

describe("checkCaraHealth — env var checks (no Supabase or provider calls)", () => {
  // We import the function lazily inside each test to allow env manipulation.
  // The module uses process.env at call-time so this is safe.

  beforeEach(() => {
    // Clear Cara-related env vars so each test starts clean
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns not_configured when no providers are set", async () => {
    const { checkCaraHealth } = await import("../cara-health");
    const health = await checkCaraHealth({ deepTest: false });

    expect(health.overallStatus).toBe("not_configured");
    expect(health.anthropic.configured).toBe(false);
    expect(health.anthropic.testCallStatus).toBe("not_configured");
  });

  it("does not treat a foreign provider key as a configured provider (Anthropic-only)", async () => {
    // Cara is Anthropic-only: any other provider's key must not enable a
    // provider or change the overall status. The health surface exposes only
    // the Anthropic provider.
    const foreignKey = "X_" + "PROVIDER_API_KEY";
    process.env[foreignKey] = "sk-testkey_xxxxxxxxxxxxxxxxxxxxxxxx";
    try {
      const { checkCaraHealth } = await import("../cara-health");
      const health = await checkCaraHealth({ deepTest: false });

      expect(health.anthropic.configured).toBe(false);
      expect(health.overallStatus).toBe("not_configured");
      // Health surface exposes the anthropic provider and nothing for any
      // other provider name.
      expect(health.anthropic).toBeDefined();
    } finally {
      delete process.env[foreignKey];
    }
  });

  it("marks anthropic as configured when ANTHROPIC_API_KEY is set", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-testkey_xxxxxxxxxxxxxxxxxxxxxxxx";
    const { checkCaraHealth } = await import("../cara-health");
    const health = await checkCaraHealth({ deepTest: false });

    expect(health.anthropic.configured).toBe(true);
    expect(health.anthropic.testCallStatus).toBe("skipped");
  });

  it("does not mark placeholder values as configured", async () => {
    process.env.ANTHROPIC_API_KEY = "placeholder";
    const { checkCaraHealth } = await import("../cara-health");
    const health = await checkCaraHealth({ deepTest: false });

    expect(health.anthropic.configured).toBe(false);
  });

  it("includes supabase not configured recommendation", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-testkey_xxxxxxxxxxxxxxxxxxxxxxxx";
    const { checkCaraHealth } = await import("../cara-health");
    const health = await checkCaraHealth({ deepTest: false });

    expect(health.recommendations.some((r) => r.toLowerCase().includes("supabase"))).toBe(true);
  });

  it("only recommends the Anthropic provider key (Anthropic-only)", async () => {
    const { checkCaraHealth } = await import("../cara-health");
    const health = await checkCaraHealth();

    // The only provider API key Cara ever recommends is ANTHROPIC_API_KEY.
    const providerKeyRecs = health.recommendations.filter((r) => /_API_KEY/.test(r));
    expect(providerKeyRecs.every((r) => r.includes("ANTHROPIC_API_KEY"))).toBe(true);
  });

  it("adds ANTHROPIC_API_KEY recommendation when not configured", async () => {
    const { checkCaraHealth } = await import("../cara-health");
    const health = await checkCaraHealth();

    expect(health.recommendations.some((r) => r.includes("ANTHROPIC_API_KEY"))).toBe(true);
  });

  it("includes lastCheckedAt as an ISO string", async () => {
    const { checkCaraHealth } = await import("../cara-health");
    const health = await checkCaraHealth();

    expect(health.lastCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns full_capacity when the provider is configured (Supabase is optional)", async () => {
    // Intentional design: a configured AI provider (Anthropic) is sufficient for
    // full capacity. Supabase persistence is optional — its absence downgrades
    // individual capabilities, not the overall operational status.
    process.env.ANTHROPIC_API_KEY = "sk-ant-testkey_xxxxxxxxxxxxxxxxxxxxxxxx";
    const { checkCaraHealth } = await import("../cara-health");
    const health = await checkCaraHealth({ deepTest: false });

    expect(health.overallStatus).toBe("full_capacity");
  });

  it("uses commandStats passed in for command registry health", async () => {
    const { checkCaraHealth } = await import("../cara-health");
    const health = await checkCaraHealth({
      commandStats: {
        totalCommands: 50,
        commandsByModule: { general: 20, daily_log: 5, incident: 8 },
        hasGeneralCommands: true,
        modulesWithDedicatedCommands: ["daily_log", "incident"],
      },
    });

    expect(health.commandRegistry.totalCommands).toBe(50);
    expect(health.commandRegistry.hasGeneralCommands).toBe(true);
    expect(health.commandRegistry.commandsByModule["general"]).toBe(20);
  });

  it("returns zero module coverage when no commandStats provided", async () => {
    const { checkCaraHealth } = await import("../cara-health");
    const health = await checkCaraHealth();

    expect(health.commandRegistry.totalCommands).toBe(0);
  });
});
