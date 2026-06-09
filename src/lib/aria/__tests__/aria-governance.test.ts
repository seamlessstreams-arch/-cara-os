// ══════════════════════════════════════════════════════════════════════════════
// Aria Intelligence — Governance System Tests
//
// Tests: model routing, sensitivity classification, redaction, provider
// blocking, role permissions, audit logging, approval workflow, cost limits,
// fallback behaviour, critical risk escalation, Perplexity safety enforcement.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import {
  classifyInputSensitivity,
  redactSensitiveData,
  validateProviderAllowedForSensitivity,
  blockUnsafeRouting,
  detectSafeguardingLanguage,
  detectHealthInformation,
  detectLegalLanguage,
  detectSelfHarmLanguage,
  detectExploitationIndicators,
  detectMissingFromCare,
  detectRestraintReferences,
  detectNames,
  detectDOBs,
  detectAddresses,
  detectSchoolNames,
  detectNHSInfo,
} from "../safety/data-protection";
import {
  validateRolePermission,
  canApprove,
  getMaxApprovalRisk,
  getAccessibleTasks,
} from "../rbac/ai-permissions";
import { AriaApprovalEngine } from "../approval/approval-engine";
import { AriaAuditLogger } from "../audit/audit-logger";
import { AriaCostControlService } from "../cost/cost-control";
import { AriaQualityAssuranceEngine } from "../qa/qa-engine";
import {
  AriaPermissionDeniedError,
  AriaSafetyBlockError,
  AriaCostLimitError,
} from "../core/errors";
import {
  TASKS_REQUIRING_APPROVAL,
  TASK_DEFAULT_RISK,
  PROVIDER_MAX_SENSITIVITY,
} from "../core/constants";
import type {
  AriaTaskResult,
  AriaTaskRequest,
  AriaRouteDecision,
} from "../core/types";

// ══════════════════════════════════════════════════════════════════════════════
// Sensitivity Classification
// ══════════════════════════════════════════════════════════════════════════════

describe("classifyInputSensitivity", () => {
  it("classifies public research as public", () => {
    const result = classifyInputSensitivity(
      "What are best practices for residential care staff training?",
      "public_research",
    );
    expect(result).toBe("public");
  });

  it("escalates to safeguarding_sensitive when safeguarding language detected", () => {
    const result = classifyInputSensitivity(
      "The child made a disclosure about physical abuse at home",
      "incident_summary",
    );
    expect(result).toBe("safeguarding_sensitive");
  });

  it("escalates to health_sensitive when health information present", () => {
    const result = classifyInputSensitivity(
      "Jordan has been prescribed Sertraline by CAMHS",
      "child_weekly_report",
    );
    expect(result).toBe("health_sensitive");
  });

  it("escalates to legal_sensitive when legal language present", () => {
    const result = classifyInputSensitivity(
      "The interim care order was granted by Family Court",
      "management_oversight",
    );
    expect(result).toBe("legal_sensitive");
  });

  it("classifies child-related tasks as child_sensitive when childId present", () => {
    const result = classifyInputSensitivity(
      "Generate a weekly report summary",
      "admin_summary",
      { childId: "child-jordan" },
    );
    expect(result).toBe("child_sensitive");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Detection Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("sensitivity detection functions", () => {
  it("detects safeguarding language", () => {
    expect(detectSafeguardingLanguage("safeguarding referral")).toBe(true);
    expect(detectSafeguardingLanguage("section 47 enquiry")).toBe(true);
    expect(detectSafeguardingLanguage("LADO referral made")).toBe(true);
    expect(detectSafeguardingLanguage("played football")).toBe(false);
  });

  it("detects health information", () => {
    expect(detectHealthInformation("prescribed medication for ADHD")).toBe(true);
    expect(detectHealthInformation("CAMHS appointment")).toBe(true);
    expect(detectHealthInformation("self-harm risk")).toBe(true);
    expect(detectHealthInformation("went to the park")).toBe(false);
  });

  it("detects legal language", () => {
    expect(detectLegalLanguage("interim care order")).toBe(true);
    expect(detectLegalLanguage("CAFCASS guardian")).toBe(true);
    expect(detectLegalLanguage("section 31 proceedings")).toBe(true);
    expect(detectLegalLanguage("daily routine")).toBe(false);
  });

  it("detects self-harm language", () => {
    expect(detectSelfHarmLanguage("self-harm marks")).toBe(true);
    expect(detectSelfHarmLanguage("suicidal ideation")).toBe(true);
    expect(detectSelfHarmLanguage("ligature risk")).toBe(true);
    expect(detectSelfHarmLanguage("happy mood")).toBe(false);
  });

  it("detects exploitation indicators", () => {
    expect(detectExploitationIndicators("CSE concerns")).toBe(true);
    expect(detectExploitationIndicators("county lines involvement")).toBe(true);
    expect(detectExploitationIndicators("grooming behaviours")).toBe(true);
    expect(detectExploitationIndicators("school attendance")).toBe(false);
  });

  it("detects missing from care language", () => {
    expect(detectMissingFromCare("missing from care episode")).toBe(true);
    expect(detectMissingFromCare("absconded from placement")).toBe(true);
    expect(detectMissingFromCare("return home interview")).toBe(true);
    expect(detectMissingFromCare("went to school")).toBe(false);
  });

  it("detects restraint references", () => {
    expect(detectRestraintReferences("physical restraint used")).toBe(true);
    expect(detectRestraintReferences("PRICE intervention")).toBe(true);
    expect(detectRestraintReferences("Team-Teach techniques")).toBe(true);
    expect(detectRestraintReferences("homework support")).toBe(false);
  });

  it("detects names", () => {
    expect(detectNames("Dr Smith reviewed")).toBe(true);
    expect(detectNames("Mrs Collins said")).toBe(true);
  });

  it("detects dates of birth", () => {
    expect(detectDOBs("DOB: 15/06/2010")).toBe(true);
    expect(detectDOBs("2010-06-15")).toBe(true);
  });

  it("detects addresses", () => {
    expect(detectAddresses("12 Oak Road")).toBe(true);
    expect(detectAddresses("SW1A 1AA")).toBe(true);
  });

  it("detects school names", () => {
    expect(detectSchoolNames("Oakfield Academy")).toBe(true);
    expect(detectSchoolNames("Riverside High School")).toBe(true);
  });

  it("detects NHS info", () => {
    expect(detectNHSInfo("NHS number 123 456 7890")).toBe(true);
    expect(detectNHSInfo("GP appointment")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Redaction
// ══════════════════════════════════════════════════════════════════════════════

describe("redactSensitiveData", () => {
  it("redacts email addresses", () => {
    const result = redactSensitiveData("Contact sarah@example.com for details");
    expect(result.redactedText).not.toContain("sarah@example.com");
    expect(result.redactedText).toContain("[EMAIL_1]");
    expect(result.sensitiveItemsDetected).toBeGreaterThan(0);
  });

  it("redacts UK postcodes", () => {
    const result = redactSensitiveData("Address: SW1A 2AA London");
    expect(result.redactedText).not.toContain("SW1A 2AA");
    expect(result.redactedText).toContain("[ADDRESS_1]");
  });

  it("redacts phone numbers", () => {
    const result = redactSensitiveData("Call 07700 900123 urgently");
    expect(result.redactedText).not.toContain("07700 900123");
    expect(result.redactedText).toContain("[PHONE_1]");
  });

  it("redacts titled names", () => {
    const result = redactSensitiveData("Dr Smith reviewed the medication");
    expect(result.redactedText).not.toContain("Dr Smith");
    expect(result.redactedText).toContain("[STAFF_1]");
  });

  it("redacts placement home names", () => {
    const result = redactSensitiveData("Placed at Chamberlain House since September");
    expect(result.redactedText).not.toContain("Chamberlain House");
    expect(result.redactedText).toContain("[HOME_1]");
  });

  it("creates redaction map without storing originals", () => {
    const result = redactSensitiveData("Dr Patel at Elm Lodge saw child");
    expect(result.redactionMap.length).toBeGreaterThan(0);
    // Map should not contain actual values
    for (const entry of result.redactionMap) {
      expect(entry.placeholder).toMatch(/\[\w+_\d+\]/);
      expect(entry.category).toBeDefined();
      expect(entry.originalLength).toBeGreaterThan(0);
    }
  });

  it("handles text with no sensitive data", () => {
    const result = redactSensitiveData("The young person had a good day today");
    expect(result.sensitiveItemsDetected).toBe(0);
    expect(result.redactedText).toBe("The young person had a good day today");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Provider Blocking
// ══════════════════════════════════════════════════════════════════════════════

describe("provider safety validation", () => {
  it("allows Azure for safeguarding_sensitive data", () => {
    expect(validateProviderAllowedForSensitivity("azure_openai", "safeguarding_sensitive")).toBe(true);
  });

  it("blocks Perplexity for anything above public", () => {
    expect(validateProviderAllowedForSensitivity("perplexity", "public")).toBe(true);
    expect(validateProviderAllowedForSensitivity("perplexity", "internal")).toBe(false);
    expect(validateProviderAllowedForSensitivity("perplexity", "child_sensitive")).toBe(false);
    expect(validateProviderAllowedForSensitivity("perplexity", "safeguarding_sensitive")).toBe(false);
  });

  it("blocks Mistral for child_sensitive data", () => {
    expect(validateProviderAllowedForSensitivity("mistral", "child_sensitive")).toBe(false);
  });

  it("allows Bedrock for all sensitivity levels", () => {
    expect(validateProviderAllowedForSensitivity("bedrock", "safeguarding_sensitive")).toBe(true);
    expect(validateProviderAllowedForSensitivity("bedrock", "legal_sensitive")).toBe(true);
    expect(validateProviderAllowedForSensitivity("bedrock", "health_sensitive")).toBe(true);
  });

  it("throws AriaSafetyBlockError for unsafe routing", () => {
    expect(() => blockUnsafeRouting("perplexity", "child_sensitive")).toThrow(AriaSafetyBlockError);
  });

  it("does not throw for safe routing", () => {
    expect(() => blockUnsafeRouting("azure_openai", "safeguarding_sensitive")).not.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Role Permissions
// ══════════════════════════════════════════════════════════════════════════════

describe("role-based AI permissions", () => {
  it("allows support workers to generate keywork session plans", () => {
    expect(() => validateRolePermission("support_worker", "keywork_session_plan")).not.toThrow();
  });

  it("blocks support workers from safeguarding analysis", () => {
    expect(() => validateRolePermission("support_worker", "safeguarding_analysis")).toThrow(AriaPermissionDeniedError);
  });

  it("blocks support workers from Reg 45 reports", () => {
    expect(() => validateRolePermission("support_worker", "reg45_report")).toThrow(AriaPermissionDeniedError);
  });

  it("allows registered managers to approve safeguarding analysis", () => {
    expect(canApprove("registered_manager", "safeguarding_analysis")).toBe(true);
  });

  it("prevents team leaders from approving safeguarding analysis", () => {
    expect(canApprove("team_leader", "safeguarding_analysis")).toBe(false);
  });

  it("returns correct max approval risk for roles", () => {
    expect(getMaxApprovalRisk("registered_manager")).toBe("critical");
    expect(getMaxApprovalRisk("deputy_manager")).toBe("high");
    expect(getMaxApprovalRisk("team_leader")).toBe("medium");
    expect(getMaxApprovalRisk("support_worker")).toBe("low");
  });

  it("inspector_readonly has very limited access", () => {
    const tasks = getAccessibleTasks("inspector_readonly");
    expect(tasks).toContain("evidence_search");
    expect(tasks).toContain("filing_cabinet_search");
    expect(tasks).not.toContain("safeguarding_analysis");
    expect(tasks).not.toContain("keywork_session_plan");
  });

  it("external_professional has limited access", () => {
    const tasks = getAccessibleTasks("external_professional");
    expect(tasks.length).toBeLessThanOrEqual(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Approval Engine
// ══════════════════════════════════════════════════════════════════════════════

describe("AriaApprovalEngine", () => {
  let engine: AriaApprovalEngine;

  beforeEach(() => {
    engine = new AriaApprovalEngine();
  });

  const mockResult: AriaTaskResult = {
    id: "result-001",
    taskType: "reg45_report",
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    riskLevel: "high",
    sensitivityLevel: "child_sensitive",
    output: "Draft report content...",
    approvalStatus: "draft_ai_generated",
    requiresApproval: true,
    redactionApplied: true,
    tokenUsage: { promptTokens: 500, completionTokens: 1000, totalTokens: 1500 },
    estimatedCost: 0.015,
    latencyMs: 3200,
    promptHash: "abc123",
    outputHash: "def456",
    generatedAt: "2026-05-16T12:00:00Z",
    metadata: {},
  };

  it("creates approval record", () => {
    const record = engine.createApprovalRecord(mockResult, "org-1", "home-oak");
    expect(record.status).toBe("draft_ai_generated");
    expect(record.taskType).toBe("reg45_report");
    expect(record.riskLevel).toBe("high");
  });

  it("allows registered manager to approve", () => {
    const record = engine.createApprovalRecord(mockResult, "org-1");
    engine.submitForReview(record.id, "user-1");
    const approved = engine.approve(record.id, "rm-user", "registered_manager", "Reviewed and agreed");
    expect(approved.status).toBe("approved");
    expect(approved.reviewedBy).toBe("rm-user");
  });

  it("blocks support worker from approving", () => {
    const record = engine.createApprovalRecord(mockResult, "org-1");
    engine.submitForReview(record.id, "user-1");
    expect(() => engine.approve(record.id, "sw-user", "support_worker")).toThrow(AriaPermissionDeniedError);
  });

  it("allows rejection with reason", () => {
    const record = engine.createApprovalRecord(mockResult, "org-1");
    engine.submitForReview(record.id, "user-1");
    const rejected = engine.reject(record.id, "rm-user", "registered_manager", "Needs more evidence");
    expect(rejected.status).toBe("rejected");
    expect(rejected.approvalNotes).toBe("Needs more evidence");
  });

  it("tracks amendment by human", () => {
    const record = engine.createApprovalRecord(mockResult, "org-1");
    const amended = engine.markAmended(record.id, "user-1");
    expect(amended.status).toBe("amended_by_human");
  });

  it("returns pending approvals", () => {
    engine.createApprovalRecord(mockResult, "org-1", "home-oak");
    engine.createApprovalRecord({ ...mockResult, id: "result-002" }, "org-1", "home-elm");
    const pending = engine.getPendingApprovals({ organisationId: "org-1" });
    expect(pending).toHaveLength(2);
  });

  it("identifies tasks requiring approval", () => {
    expect(engine.requiresApproval("safeguarding_analysis")).toBe(true);
    expect(engine.requiresApproval("reg45_report")).toBe(true);
    expect(engine.requiresApproval("keywork_session_plan")).toBe(false);
    expect(engine.requiresApproval("admin_summary")).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Audit Logger
// ══════════════════════════════════════════════════════════════════════════════

describe("AriaAuditLogger", () => {
  let logger: AriaAuditLogger;

  beforeEach(() => {
    logger = new AriaAuditLogger();
  });

  const mockRequest: AriaTaskRequest = {
    taskType: "keywork_session_plan",
    userId: "user-1",
    userRole: "support_worker",
    organisationId: "org-1",
    homeId: "home-oak",
    childId: "child-jordan",
    prompt: "Generate a keywork session",
  };

  const mockResult: AriaTaskResult = {
    id: "result-001",
    taskType: "keywork_session_plan",
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    riskLevel: "low",
    sensitivityLevel: "child_sensitive",
    output: "Session plan...",
    approvalStatus: "approved",
    requiresApproval: false,
    redactionApplied: true,
    tokenUsage: { promptTokens: 300, completionTokens: 800, totalTokens: 1100 },
    estimatedCost: 0.01,
    latencyMs: 2100,
    promptHash: "abc123",
    outputHash: "def456",
    generatedAt: "2026-05-16T12:00:00Z",
    metadata: {},
  };

  it("logs successful task execution", () => {
    const entry = logger.logTaskExecution(mockRequest, mockResult);
    expect(entry.userId).toBe("user-1");
    expect(entry.taskType).toBe("keywork_session_plan");
    expect(entry.provider).toBe("anthropic");
    expect(entry.status).toBe("success");
    expect(entry.childId).toBe("child-jordan");
  });

  it("logs safety events", () => {
    const event = logger.logSafetyEvent(
      "unsafe_routing_blocked",
      "high",
      "Attempt to route safeguarding data to Perplexity",
      {
        userId: "user-1",
        organisationId: "org-1",
        taskType: "safeguarding_analysis",
        provider: "perplexity",
        blocked: true,
      },
    );
    expect(event.type).toBe("unsafe_routing_blocked");
    expect(event.blocked).toBe(true);
  });

  it("never stores raw child-sensitive prompts", () => {
    const entry = logger.logTaskExecution(mockRequest, mockResult);
    // Entry should only have promptHash, never raw prompt
    expect(entry.promptHash).toBe("abc123");
    expect((entry as any).prompt).toBeUndefined();
    expect((entry as any).rawPrompt).toBeUndefined();
  });

  it("filters audit logs by organisation", () => {
    logger.logTaskExecution(mockRequest, mockResult);
    logger.logTaskExecution(
      { ...mockRequest, organisationId: "org-2" },
      { ...mockResult, id: "result-002" },
    );

    const logs = logger.getAuditLogs({ organisationId: "org-1" });
    expect(logs).toHaveLength(1);
    expect(logs[0].organisationId).toBe("org-1");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Cost Control
// ══════════════════════════════════════════════════════════════════════════════

describe("AriaCostControlService", () => {
  let costService: AriaCostControlService;

  beforeEach(() => {
    costService = new AriaCostControlService();
  });

  it("estimates cost before request", () => {
    const estimate = costService.estimateCost(
      "openai", "gpt-4o", 1000, 2000,
      { organisationId: "org-1" },
    );
    expect(estimate.estimatedCostGBP).toBeGreaterThan(0);
    expect(estimate.withinBudget).toBe(true);
  });

  it("blocks requests exceeding per-request limit", () => {
    // Set very low limit
    costService.updateLimits({ perRequestMax: 0.001 });
    expect(() => costService.enforceLimits(0.05, { organisationId: "org-1" })).toThrow(AriaCostLimitError);
  });

  it("selects cheaper models for low-risk simple tasks", () => {
    const model = costService.selectCostEfficientModel("openai", "low", "admin_summary");
    expect(model).toBe("gpt-4o-mini");
  });

  it("uses default model for high-risk tasks", () => {
    const model = costService.selectCostEfficientModel("openai", "high", "safeguarding_analysis");
    expect(model).toBe("gpt-4o");
  });

  it("records usage correctly", () => {
    costService.recordUsage({
      organisationId: "org-1",
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      inputTokens: 500,
      outputTokens: 1000,
      costGBP: 0.013,
      date: new Date().toISOString(),
    });

    const summary = costService.getUsageSummary("org-1", "day");
    expect(summary.totalCost).toBeCloseTo(0.013);
    expect(summary.requestCount).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Quality Assurance (Quick Check)
// ══════════════════════════════════════════════════════════════════════════════

describe("AriaQualityAssuranceEngine quickCheck", () => {
  let qaEngine: AriaQualityAssuranceEngine;

  beforeEach(() => {
    qaEngine = new AriaQualityAssuranceEngine();
  });

  it("scores well-written records highly", () => {
    const content = `
      Jordan said "I felt really happy today" after his keywork session.
      This demonstrates good progress towards his care plan goal of emotional regulation.
      Therefore I will follow up with the CAMHS team next week.
      I wonder if the positive weekend contributed to his mood improvement.
      Action: Book CAMHS review. Due: 23/05/2026.
    `;
    const result = qaEngine.quickCheck(content, "keywork_session");
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("flags brief records", () => {
    const result = qaEngine.quickCheck("Child was fine today.", "daily_log");
    expect(result.score).toBeLessThan(60);
    expect(result.issues.some(i => i.includes("brief"))).toBe(true);
  });

  it("flags missing voice of the child", () => {
    const content = "Staff completed activities with the young person. The day was routine.";
    const result = qaEngine.quickCheck(content, "daily_log");
    expect(result.issues.some(i => i.includes("voice of the child"))).toBe(true);
  });

  it("flags judgemental language", () => {
    const content = "The child was being naughty and attention-seeking all morning, which was very difficult to manage.";
    const result = qaEngine.quickCheck(content, "daily_log");
    expect(result.issues.some(i => i.includes("judgemental"))).toBe(true);
  });

  it("recognises professional curiosity", () => {
    const content = "Jordan seemed withdrawn today. I wonder if this is connected to the recent contact with his father. I'm curious about whether the change in routine has affected his mood. He said he felt ok but seemed tired.";
    const result = qaEngine.quickCheck(content, "daily_log");
    expect(result.strengths.some(s => s.includes("professional curiosity"))).toBe(true);
  });

  it("flags missing follow-up actions", () => {
    const content = "The incident occurred at 14:30. Staff managed the situation using de-escalation techniques. The child became calm after 20 minutes.";
    const result = qaEngine.quickCheck(content, "incident");
    expect(result.issues.some(i => i.includes("follow-up"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Constants Validation
// ══════════════════════════════════════════════════════════════════════════════

describe("configuration constants", () => {
  it("all tasks requiring approval are valid task types", () => {
    for (const task of TASKS_REQUIRING_APPROVAL) {
      expect(TASK_DEFAULT_RISK[task]).toBeDefined();
    }
  });

  it("critical tasks always require approval", () => {
    const criticalTasks = Object.entries(TASK_DEFAULT_RISK)
      .filter(([_, risk]) => risk === "critical")
      .map(([task]) => task);

    for (const task of criticalTasks) {
      expect(TASKS_REQUIRING_APPROVAL).toContain(task);
    }
  });

  it("Perplexity only allows public data", () => {
    const perplexityAllowed = PROVIDER_MAX_SENSITIVITY["perplexity"];
    expect(perplexityAllowed).toEqual(["public"]);
  });

  it("enterprise providers allow safeguarding data", () => {
    expect(PROVIDER_MAX_SENSITIVITY["azure_openai"]).toContain("safeguarding_sensitive");
    expect(PROVIDER_MAX_SENSITIVITY["bedrock"]).toContain("safeguarding_sensitive");
  });
});
