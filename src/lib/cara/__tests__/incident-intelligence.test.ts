import { describe, it, expect } from "vitest";
import { _testing, IncidentIntelligenceInputSchema } from "../incident-intelligence";

const { computeDeterministicAlerts, computeNextActions, buildIncidentReviewQuestion, mapRoleToCaraMode } = _testing;

// ── Helper ───────────────────────────────────────────────────────────────────

function makeInput(overrides: Record<string, unknown> = {}) {
  return IncidentIntelligenceInputSchema.parse({
    actorUserId: "user_123",
    actorRole: "registered_manager",
    incidentId: "inc_123",
    incidentType: "missing from care",
    severity: "high",
    description: "Young person left the home following family contact and returned after staff support.",
    immediateAction: "Staff followed missing protocol, notified manager and completed welfare check.",
    childId: "child_123",
    homeId: "home_123",
    reasoningMode: "incident_review",
    previousIncidentSummaries: [
      "Two previous incidents occurred after family contact.",
      "Sleep record shows reduced sleep for two nights before the incident.",
    ],
    suggestionIds: ["as_123"],
    ...overrides,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// INPUT VALIDATION
// ══════════════════════════════════════════════════════════════════════════════

describe("IncidentIntelligenceInputSchema", () => {
  it("parses a valid full input", () => {
    const result = IncidentIntelligenceInputSchema.safeParse({
      actorUserId: "user_1",
      actorRole: "registered_manager",
      incidentId: "inc_1",
      incidentType: "missing from care",
      severity: "high",
      description: "Child left the home.",
      childId: "child_1",
      homeId: "home_1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = IncidentIntelligenceInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid severity", () => {
    const result = IncidentIntelligenceInputSchema.safeParse({
      actorUserId: "u1",
      actorRole: "rsw",
      incidentId: "inc",
      incidentType: "other",
      severity: "extreme",
      description: "desc",
      childId: "c1",
      homeId: "h1",
    });
    expect(result.success).toBe(false);
  });

  it("defaults reasoningMode to incident_review", () => {
    const input = makeInput({});
    expect(input.reasoningMode).toBe("incident_review");
  });

  it("defaults previousIncidentSummaries to empty array", () => {
    const result = IncidentIntelligenceInputSchema.parse({
      actorUserId: "u1",
      actorRole: "rsw",
      incidentId: "inc",
      incidentType: "other",
      severity: "low",
      description: "desc",
      childId: "c1",
      homeId: "h1",
    });
    expect(result.previousIncidentSummaries).toEqual([]);
  });

  it("defaults suggestionIds to empty array", () => {
    const result = IncidentIntelligenceInputSchema.parse({
      actorUserId: "u1",
      actorRole: "rsw",
      incidentId: "inc",
      incidentType: "other",
      severity: "low",
      description: "desc",
      childId: "c1",
      homeId: "h1",
    });
    expect(result.suggestionIds).toEqual([]);
  });

  it("accepts all valid reasoning modes", () => {
    const modes = ["incident_review", "pattern_analysis", "safeguarding_check", "therapeutic_lens", "management_oversight"];
    for (const mode of modes) {
      const result = IncidentIntelligenceInputSchema.safeParse({
        actorUserId: "u1",
        actorRole: "rsw",
        incidentId: "inc",
        incidentType: "other",
        severity: "low",
        description: "desc",
        childId: "c1",
        homeId: "h1",
        reasoningMode: mode,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid severity levels", () => {
    for (const sev of ["low", "medium", "high", "critical"]) {
      const result = IncidentIntelligenceInputSchema.safeParse({
        actorUserId: "u1",
        actorRole: "rsw",
        incidentId: "inc",
        incidentType: "other",
        severity: sev,
        description: "desc",
        childId: "c1",
        homeId: "h1",
      });
      expect(result.success).toBe(true);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DETERMINISTIC ALERTS
// ══════════════════════════════════════════════════════════════════════════════

describe("computeDeterministicAlerts", () => {
  // ── Missing from care ──────────────────────────────────────────────────

  it("flags missing from care incidents with return interview requirement", () => {
    const input = makeInput({ incidentType: "missing from care", severity: "high" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "missing_from_care")).toBe(true);
    expect(alerts.find((a) => a.category === "missing_from_care")?.regulatoryRef).toContain("Reg 34");
  });

  it("flags high-severity missing with police/Ofsted notification requirement", () => {
    const input = makeInput({ incidentType: "missing from care", severity: "high" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "missing_high_risk")).toBe(true);
    expect(alerts.find((a) => a.category === "missing_high_risk")?.regulatoryRef).toContain("Reg 40");
  });

  it("flags critical-severity missing with police/Ofsted notification", () => {
    const input = makeInput({ incidentType: "missing from care", severity: "critical" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "missing_high_risk")).toBe(true);
  });

  it("does NOT flag missing_high_risk for low-severity missing", () => {
    const input = makeInput({ incidentType: "missing from care", severity: "low" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "missing_high_risk")).toBe(false);
  });

  it("does NOT flag missing_high_risk for medium-severity missing", () => {
    const input = makeInput({ incidentType: "missing from care", severity: "medium" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "missing_high_risk")).toBe(false);
  });

  // ── Restraint ──────────────────────────────────────────────────────────

  it("flags restraint incidents with written record requirement", () => {
    const input = makeInput({ incidentType: "restraint", severity: "high" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "restraint")).toBe(true);
    expect(alerts.find((a) => a.category === "restraint")?.regulatoryRef).toContain("Reg 35");
  });

  it("flags physical intervention", () => {
    const input = makeInput({ incidentType: "physical intervention", severity: "medium" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "restraint")).toBe(true);
  });

  // ── Safeguarding ───────────────────────────────────────────────────────

  it("flags safeguarding incidents with referral requirement", () => {
    const input = makeInput({ incidentType: "safeguarding concern", severity: "critical" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "safeguarding")).toBe(true);
    expect(alerts.find((a) => a.category === "safeguarding")?.severity).toBe("critical");
  });

  it("flags allegation incidents", () => {
    const input = makeInput({ incidentType: "allegation against staff", severity: "critical" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "safeguarding")).toBe(true);
  });

  it("flags disclosure incidents", () => {
    const input = makeInput({ incidentType: "disclosure", severity: "high" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "safeguarding")).toBe(true);
  });

  // ── Self-harm ──────────────────────────────────────────────────────────

  it("flags self-harm in description", () => {
    const input = makeInput({ description: "Young person engaged in self-harm behaviour.", severity: "high" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "self_harm")).toBe(true);
  });

  it("flags 'self harm' without hyphen", () => {
    const input = makeInput({ description: "Evidence of self harm marks noted.", severity: "medium" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "self_harm")).toBe(true);
  });

  it("flags suicide-related description", () => {
    const input = makeInput({ description: "Young person expressed suicidal thoughts.", severity: "critical" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "self_harm")).toBe(true);
  });

  it("does NOT flag self_harm when not in description", () => {
    const input = makeInput({ description: "Young person had a good day.", severity: "low" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "self_harm")).toBe(false);
  });

  // ── Contact pattern ────────────────────────────────────────────────────

  it("detects family contact pattern from previous incidents", () => {
    const input = makeInput({
      description: "Incident occurred after family contact.",
      previousIncidentSummaries: [
        "Incident after family contact visit.",
        "Another contact-related incident.",
      ],
    });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "contact_pattern")).toBe(true);
  });

  it("does NOT flag contact pattern with insufficient previous incidents", () => {
    const input = makeInput({
      description: "Incident after contact.",
      previousIncidentSummaries: ["One previous incident."],
    });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "contact_pattern")).toBe(false);
  });

  // ── Sleep pattern ──────────────────────────────────────────────────────

  it("detects sleep disruption pattern", () => {
    const input = makeInput({
      previousIncidentSummaries: ["Sleep disruption noted."],
    });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "sleep_pattern")).toBe(true);
  });

  it("does NOT flag sleep pattern when not in previous incidents", () => {
    const input = makeInput({
      previousIncidentSummaries: ["Good behaviour noted."],
    });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "sleep_pattern")).toBe(false);
  });

  // ── Management oversight ───────────────────────────────────────────────

  it("requires management oversight for high severity", () => {
    const input = makeInput({ severity: "high" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "management_oversight")).toBe(true);
  });

  it("requires management oversight for critical severity", () => {
    const input = makeInput({ severity: "critical" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "management_oversight")).toBe(true);
  });

  it("does NOT require management oversight for low severity", () => {
    const input = makeInput({ incidentType: "other incident", severity: "low" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "management_oversight")).toBe(false);
  });

  it("does NOT require management oversight for medium severity", () => {
    const input = makeInput({ incidentType: "other incident", severity: "medium" });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "management_oversight")).toBe(false);
  });

  // ── Generic / no alerts ────────────────────────────────────────────────

  it("returns empty alerts for a low-severity non-specific incident", () => {
    const input = makeInput({
      incidentType: "general",
      severity: "low",
      description: "Minor event with no concerns.",
      previousIncidentSummaries: [],
    });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.length).toBe(0);
  });

  // ── Combined scenarios ─────────────────────────────────────────────────

  it("generates multiple alerts for a complex missing-from-care incident", () => {
    const input = makeInput({
      incidentType: "missing from care",
      severity: "high",
      description: "Young person left following family contact.",
      previousIncidentSummaries: [
        "Previous missing after family contact.",
        "Sleep disruption noted before last incident.",
        "Another incident linked to contact.",
      ],
    });
    const alerts = computeDeterministicAlerts(input);
    expect(alerts.some((a) => a.category === "missing_from_care")).toBe(true);
    expect(alerts.some((a) => a.category === "missing_high_risk")).toBe(true);
    expect(alerts.some((a) => a.category === "contact_pattern")).toBe(true);
    expect(alerts.some((a) => a.category === "sleep_pattern")).toBe(true);
    expect(alerts.some((a) => a.category === "management_oversight")).toBe(true);
    expect(alerts.length).toBeGreaterThanOrEqual(5);
  });

  it("all alerts have severity, category and message", () => {
    const input = makeInput();
    const alerts = computeDeterministicAlerts(input);
    for (const alert of alerts) {
      expect(alert.severity).toBeTruthy();
      expect(alert.category).toBeTruthy();
      expect(alert.message).toBeTruthy();
      expect(alert.message.length).toBeGreaterThan(10);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// NEXT ACTIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("computeNextActions", () => {
  it("includes manager review for high severity", () => {
    const input = makeInput({ severity: "high" });
    const alerts = computeDeterministicAlerts(input);
    const actions = computeNextActions(input, alerts);
    expect(actions.some((a) => a.ownerRole === "Registered Manager" && a.priority === "today")).toBe(true);
  });

  it("includes manager review for critical severity", () => {
    const input = makeInput({ severity: "critical" });
    const alerts = computeDeterministicAlerts(input);
    const actions = computeNextActions(input, alerts);
    expect(actions.some((a) => a.title.includes("Registered Manager"))).toBe(true);
  });

  it("includes return interview for missing from care", () => {
    const input = makeInput({ incidentType: "missing from care" });
    const alerts = computeDeterministicAlerts(input);
    const actions = computeNextActions(input, alerts);
    expect(actions.some((a) => a.title.includes("return home interview"))).toBe(true);
  });

  it("includes risk assessment update for missing from care", () => {
    const input = makeInput({ incidentType: "missing from care" });
    const alerts = computeDeterministicAlerts(input);
    const actions = computeNextActions(input, alerts);
    expect(actions.some((a) => a.title.includes("risk assessment"))).toBe(true);
  });

  it("includes contact plan review when contact pattern detected", () => {
    const input = makeInput({
      description: "Incident after contact.",
      previousIncidentSummaries: [
        "Incident after family contact.",
        "Another contact-related incident.",
      ],
    });
    const alerts = computeDeterministicAlerts(input);
    const actions = computeNextActions(input, alerts);
    expect(actions.some((a) => a.title.toLowerCase().includes("contact plan"))).toBe(true);
  });

  it("includes key work session when contact pattern detected", () => {
    const input = makeInput({
      description: "Incident after contact.",
      previousIncidentSummaries: [
        "Incident after family contact.",
        "Another contact-related incident.",
      ],
    });
    const alerts = computeDeterministicAlerts(input);
    const actions = computeNextActions(input, alerts);
    expect(actions.some((a) => a.title.toLowerCase().includes("key work"))).toBe(true);
  });

  it("includes sleep plan review when sleep pattern detected", () => {
    const input = makeInput({
      previousIncidentSummaries: ["Sleep disruption noted."],
    });
    const alerts = computeDeterministicAlerts(input);
    const actions = computeNextActions(input, alerts);
    expect(actions.some((a) => a.title.toLowerCase().includes("sleep"))).toBe(true);
  });

  it("includes placing authority notification for high severity", () => {
    const input = makeInput({ severity: "high" });
    const alerts = computeDeterministicAlerts(input);
    const actions = computeNextActions(input, alerts);
    expect(actions.some((a) => a.title.includes("placing authority"))).toBe(true);
  });

  it("does NOT include placing authority notification for low severity", () => {
    const input = makeInput({ incidentType: "general", severity: "low", previousIncidentSummaries: [] });
    const alerts = computeDeterministicAlerts(input);
    const actions = computeNextActions(input, alerts);
    expect(actions.some((a) => a.title.includes("placing authority"))).toBe(false);
  });

  it("all actions have title, ownerRole, priority, rationale and source", () => {
    const input = makeInput();
    const alerts = computeDeterministicAlerts(input);
    const actions = computeNextActions(input, alerts);
    for (const action of actions) {
      expect(action.title).toBeTruthy();
      expect(action.ownerRole).toBeTruthy();
      expect(["immediate", "today", "this_week", "this_month"]).toContain(action.priority);
      expect(action.rationale).toBeTruthy();
      expect(["deterministic", "pattern", "cara"]).toContain(action.source);
    }
  });

  it("returns empty actions for a low-severity non-specific incident with no patterns", () => {
    const input = makeInput({
      incidentType: "general",
      severity: "low",
      description: "Minor event.",
      previousIncidentSummaries: [],
    });
    const alerts = computeDeterministicAlerts(input);
    const actions = computeNextActions(input, alerts);
    expect(actions.length).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// REVIEW QUESTION BUILDER
// ══════════════════════════════════════════════════════════════════════════════

describe("buildIncidentReviewQuestion", () => {
  it("includes incident type and severity", () => {
    const input = makeInput();
    const question = buildIncidentReviewQuestion(input);
    expect(question).toContain("missing from care");
    expect(question).toContain("high");
  });

  it("includes description", () => {
    const input = makeInput();
    const question = buildIncidentReviewQuestion(input);
    expect(question).toContain("Young person left the home");
  });

  it("includes immediate action when provided", () => {
    const input = makeInput();
    const question = buildIncidentReviewQuestion(input);
    expect(question).toContain("Staff followed missing protocol");
  });

  it("includes previous incident summaries", () => {
    const input = makeInput();
    const question = buildIncidentReviewQuestion(input);
    expect(question).toContain("Two previous incidents");
    expect(question).toContain("Sleep record shows");
  });

  it("uses incident_review mode by default — full review", () => {
    const input = makeInput({ reasoningMode: "incident_review" });
    const question = buildIncidentReviewQuestion(input);
    expect(question).toContain("full incident review");
  });

  it("uses pattern_analysis focus when specified", () => {
    const input = makeInput({ reasoningMode: "pattern_analysis" });
    const question = buildIncidentReviewQuestion(input);
    expect(question).toContain("patterns");
    expect(question).toContain("themes");
  });

  it("uses safeguarding_check focus when specified", () => {
    const input = makeInput({ reasoningMode: "safeguarding_check" });
    const question = buildIncidentReviewQuestion(input);
    expect(question).toContain("safeguarding");
    expect(question).toContain("LADO");
  });

  it("uses therapeutic_lens focus when specified", () => {
    const input = makeInput({ reasoningMode: "therapeutic_lens" });
    const question = buildIncidentReviewQuestion(input);
    expect(question).toContain("therapeutic");
    expect(question).toContain("communicating");
  });

  it("uses management_oversight focus when specified", () => {
    const input = makeInput({ reasoningMode: "management_oversight" });
    const question = buildIncidentReviewQuestion(input);
    expect(question).toContain("management oversight");
    expect(question).toContain("registered manager");
  });

  it("does NOT include immediate action when empty", () => {
    const input = makeInput({ immediateAction: "" });
    const question = buildIncidentReviewQuestion(input);
    expect(question).not.toContain("Immediate action taken");
  });

  it("does NOT include previous incidents section when empty", () => {
    const input = makeInput({ previousIncidentSummaries: [] });
    const question = buildIncidentReviewQuestion(input);
    expect(question).not.toContain("Previous connected incidents");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ROLE MAPPING
// ══════════════════════════════════════════════════════════════════════════════

describe("mapRoleToCaraMode", () => {
  it("maps rsw to practitioner", () => {
    expect(mapRoleToCaraMode("rsw")).toBe("practitioner");
  });

  it("maps senior to senior", () => {
    expect(mapRoleToCaraMode("senior")).toBe("senior");
  });

  it("maps registered_manager to registered_manager", () => {
    expect(mapRoleToCaraMode("registered_manager")).toBe("registered_manager");
  });

  it("maps deputy_manager to deputy_manager", () => {
    expect(mapRoleToCaraMode("deputy_manager")).toBe("deputy_manager");
  });

  it("maps ri to responsible_individual", () => {
    expect(mapRoleToCaraMode("ri")).toBe("responsible_individual");
  });

  it("maps operations to operations", () => {
    expect(mapRoleToCaraMode("operations")).toBe("operations");
  });

  it("maps director to director", () => {
    expect(mapRoleToCaraMode("director")).toBe("director");
  });

  it("maps commissioner to commissioner", () => {
    expect(mapRoleToCaraMode("commissioner")).toBe("commissioner");
  });

  it("defaults unknown roles to practitioner", () => {
    expect(mapRoleToCaraMode("unknown_role")).toBe("practitioner");
    expect(mapRoleToCaraMode("")).toBe("practitioner");
    expect(mapRoleToCaraMode("admin")).toBe("practitioner");
  });
});
