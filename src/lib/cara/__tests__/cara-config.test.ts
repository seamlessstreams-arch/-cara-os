// ══════════════════════════════════════════════════════════════════════════════
// Tests — Cara Configuration Layer
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  getCaraConfig,
  getActiveSystemProfile,
  getToolRegistry,
  logInteraction,
  getInteractionLogs,
} from "../cara-config";

// ── 1. getCaraConfig returns valid config shape ────────────────────────────

describe("getCaraConfig", () => {
  it("returns a valid config shape", () => {
    const config = getCaraConfig();

    expect(config).toBeDefined();
    expect(config.id).toBe("config_default");
    expect(typeof config.provider).toBe("string");
    expect(config.provider.length).toBeGreaterThan(0);
    expect(typeof config.model).toBe("string");
    expect(config.model.length).toBeGreaterThan(0);
    expect(typeof config.enabled).toBe("boolean");
    expect(typeof config.temperature).toBe("number");
    expect(config.temperature).toBeGreaterThanOrEqual(0);
    expect(config.temperature).toBeLessThanOrEqual(2);
    expect(typeof config.max_tokens).toBe("number");
    expect(config.max_tokens).toBeGreaterThan(0);
    expect(typeof config.system_profile_id).toBe("string");
    expect(typeof config.created_at).toBe("string");
    expect(typeof config.updated_at).toBe("string");
  });
});

// ── 2. getActiveSystemProfile returns the default profile ──────────────────

describe("getActiveSystemProfile", () => {
  it("returns the default profile", () => {
    const profile = getActiveSystemProfile();

    expect(profile).toBeDefined();
    expect(profile.id).toBe("profile_cornerstone_cara_default");
    expect(profile.name).toContain("Cara");
    expect(profile.active).toBe(true);
    expect(typeof profile.system_prompt).toBe("string");
    expect(profile.system_prompt.length).toBeGreaterThan(0);
    expect(typeof profile.description).toBe("string");
  });

  // ── 3. System profile has all required safety rules ──────────────────────

  it("has all required safety rules", () => {
    const profile = getActiveSystemProfile();

    expect(Array.isArray(profile.safety_rules)).toBe(true);
    expect(profile.safety_rules.length).toBeGreaterThanOrEqual(10);

    // Every rule should be a non-empty string
    for (const rule of profile.safety_rules) {
      expect(typeof rule).toBe("string");
      expect(rule.length).toBeGreaterThan(0);
    }

    // Key safety rules must be present
    const rulesText = profile.safety_rules.join(" ");
    expect(rulesText).toContain("personal data");
    expect(rulesText).toContain("safeguarding");
    expect(rulesText).toContain("approval");
  });

  // ── 4. System profile has role rules for all 5 roles ─────────────────────

  it("has role rules for all 5 roles", () => {
    const profile = getActiveSystemProfile();
    const expectedRoles = [
      "support_worker",
      "team_leader",
      "deputy_manager",
      "registered_manager",
      "responsible_individual",
    ];

    expect(typeof profile.role_rules).toBe("object");

    for (const role of expectedRoles) {
      expect(profile.role_rules[role], `Missing role rule for: ${role}`).toBeDefined();
      expect(typeof profile.role_rules[role]).toBe("string");
      expect(profile.role_rules[role].length).toBeGreaterThan(0);
    }

    expect(Object.keys(profile.role_rules).length).toBe(5);
  });
});

// ── 5. getToolRegistry returns 12 tools ────────────────────────────────────

describe("getToolRegistry", () => {
  it("returns 12 tools", () => {
    const tools = getToolRegistry();

    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBe(12);
  });

  // ── 6. Each tool has allowed_roles, requires_approval, audit_required ────

  it("each tool has allowed_roles, requires_approval, and audit_required", () => {
    const tools = getToolRegistry();

    for (const tool of tools) {
      expect(tool.id, `Tool missing id`).toBeDefined();
      expect(tool.tool_name, `Tool ${tool.id} missing tool_name`).toBeDefined();
      expect(tool.description, `Tool ${tool.id} missing description`).toBeDefined();

      expect(
        Array.isArray(tool.allowed_roles),
        `Tool ${tool.id} allowed_roles should be an array`,
      ).toBe(true);
      expect(
        tool.allowed_roles.length,
        `Tool ${tool.id} should have at least one allowed role`,
      ).toBeGreaterThan(0);

      expect(
        typeof tool.requires_approval,
        `Tool ${tool.id} requires_approval should be boolean`,
      ).toBe("boolean");

      expect(
        typeof tool.audit_required,
        `Tool ${tool.id} audit_required should be boolean`,
      ).toBe("boolean");
    }
  });

  // ── 9. Tools requiring approval are correctly flagged ────────────────────

  it("tools requiring approval are correctly flagged", () => {
    const tools = getToolRegistry();
    const approvalTools = tools.filter((t) => t.requires_approval);

    // At least some tools require approval
    expect(approvalTools.length).toBeGreaterThan(0);

    // These specific tools must require approval
    const expectedApprovalTools = [
      "generate_child_weekly_summary",
      "draft_incident_analysis",
      "create_safeguarding_escalation",
      "update_risk_recommendation",
      "generate_reg45_evidence_pack",
      "produce_ofsted_readiness_summary",
    ];

    for (const toolName of expectedApprovalTools) {
      const tool = tools.find((t) => t.tool_name === toolName);
      expect(
        tool,
        `Tool ${toolName} should exist in registry`,
      ).toBeDefined();
      expect(
        tool!.requires_approval,
        `Tool ${toolName} should require approval`,
      ).toBe(true);
    }
  });

  // ── 10. Safeguarding tools require audit ─────────────────────────────────

  it("safeguarding tools require audit", () => {
    const tools = getToolRegistry();
    const safeguardingTools = tools.filter(
      (t) =>
        t.tool_name.includes("safeguarding") ||
        t.tool_name.includes("risk"),
    );

    expect(safeguardingTools.length).toBeGreaterThan(0);

    for (const tool of safeguardingTools) {
      expect(
        tool.audit_required,
        `Safeguarding tool ${tool.tool_name} must require audit`,
      ).toBe(true);
    }
  });
});

// ── 7 & 8. Interaction logging ─────────────────────────────────────────────

describe("logInteraction / getInteractionLogs", () => {
  // ── 7. logInteraction creates a log entry with auto-generated id and timestamp

  it("creates a log entry with auto-generated id and timestamp", () => {
    const entry = logInteraction({
      user_id: "staff_test",
      child_id: "child_1",
      conversation_id: "conv_test_001",
      request_type: "improve_writing",
      prompt_summary: "Test prompt",
      response_summary: "Test response",
      tools_used: ["improve_writing"],
      risk_level: "none",
      requires_review: false,
    });

    expect(entry).toBeDefined();
    expect(entry.id).toBeDefined();
    expect(typeof entry.id).toBe("string");
    expect(entry.id.startsWith("alog_")).toBe(true);
    expect(entry.created_at).toBeDefined();
    expect(typeof entry.created_at).toBe("string");
    // Should be a valid ISO date
    expect(new Date(entry.created_at).toISOString()).toBe(entry.created_at);
    expect(entry.user_id).toBe("staff_test");
    expect(entry.conversation_id).toBe("conv_test_001");
  });

  // ── 8. getInteractionLogs returns logged interactions

  it("returns logged interactions", () => {
    // Log two entries
    const first = logInteraction({
      user_id: "staff_a",
      child_id: null,
      conversation_id: "conv_a",
      request_type: "summarise_text",
      prompt_summary: "First entry",
      response_summary: "First response",
      tools_used: [],
      risk_level: "low",
      requires_review: false,
    });

    const second = logInteraction({
      user_id: "staff_b",
      child_id: "child_2",
      conversation_id: "conv_b",
      request_type: "draft_daily_log",
      prompt_summary: "Second entry",
      response_summary: "Second response",
      tools_used: ["draft_daily_log"],
      risk_level: "none",
      requires_review: false,
    });

    const logs = getInteractionLogs();

    // Should contain both entries
    expect(logs.length).toBeGreaterThanOrEqual(2);

    // Newest first — second entry should come before first
    const secondIdx = logs.findIndex((l) => l.id === second.id);
    const firstIdx = logs.findIndex((l) => l.id === first.id);
    expect(secondIdx).toBeLessThan(firstIdx);

    // Verify the entries are intact
    const foundSecond = logs.find((l) => l.id === second.id);
    expect(foundSecond).toBeDefined();
    expect(foundSecond!.user_id).toBe("staff_b");
    expect(foundSecond!.child_id).toBe("child_2");
  });
});
