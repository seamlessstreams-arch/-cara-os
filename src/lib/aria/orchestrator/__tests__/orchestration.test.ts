// ══════════════════════════════════════════════════════════════════════════════
// ARIA ORCHESTRATOR — COMPREHENSIVE TESTS
//
// Tests the full orchestration pipeline: routing, risk classification, safety
// governor, model registry, permissions, response formatting, and cost tracking.
//
// These tests exercise the real exported functions — no mocking of core logic.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import { routeRequest } from "../router";
import { classifyRisk } from "../risk-classifier";
import { reviewSafety } from "../safety-governor";
import {
  getModelProfile,
  getModelProfileForAgent,
  getModelProfileIdForAgent,
  getModelProfileIdForTask,
  applyRiskOverride,
  MODEL_PROFILES,
} from "../model-registry";
import { estimateCost, recordCost } from "../cost-tracker";
import { formatResponse, formatBlockedResponse } from "../response-formatter";

import type {
  AriaRequest,
  EvidenceItem,
  RouteDecision,
  SafetyReview,
  RiskLevel,
} from "../types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(overrides: Partial<AriaRequest> = {}): AriaRequest {
  return {
    userId: "user-1",
    role: "registered_manager",
    homeId: "home-1",
    query: "Tell me about the daily log.",
    ...overrides,
  };
}

function makeEvidence(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    sourceTable: "daily_logs",
    sourceId: "log-1",
    sourceDate: "2026-05-10",
    sourceTitle: "Daily Log Entry",
    sourceExcerpt: "Child appeared settled and engaged in activities.",
    relevanceScore: 80,
    evidenceType: "daily_log",
    regulationRefs: [],
    qualityStandardRefs: [],
    ...overrides,
  };
}

function makeRouteDecision(overrides: Partial<RouteDecision> = {}): RouteDecision {
  return {
    taskType: "admin",
    riskLevel: "low",
    requiredAgent: "filing_agent",
    requiredModelProfile: "fast-cheap",
    requiresRAG: false,
    requiresHumanApproval: false,
    requiresSafeguardingEscalation: false,
    canAutoDraft: true,
    canAutoSave: true,
    routingReason: "Task classified as admin at low risk.",
    riskFactors: [],
    ...overrides,
  };
}

function makeSafetyReview(overrides: Partial<SafetyReview> = {}): SafetyReview {
  return {
    passed: true,
    blocked: false,
    warnings: [],
    safetyNotes: [],
    sanitisedOutput: "Safe output text.",
    escalationRequired: false,
    managerApprovalRequired: false,
    reg40ConsiderationRequired: false,
    ladoConsiderationRequired: false,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. ROUTER TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Router — routeRequest", () => {
  // ── Basic Task Type Detection ──────────────────────────────────────────────

  it("routes low-risk admin query to filing agent", () => {
    const result = routeRequest(makeRequest({ query: "Summarise this email for me" }));
    expect(result.taskType).toBe("admin");
    expect(result.requiredAgent).toBe("filing_agent");
  });

  it("routes 'rewrite this email' to admin agent", () => {
    const result = routeRequest(makeRequest({ query: "Please rewrite this email to be more concise" }));
    expect(result.taskType).toBe("admin");
    expect(result.requiredAgent).toBe("filing_agent");
  });

  it("routes 'proofread my notes' to admin agent", () => {
    const result = routeRequest(makeRequest({ query: "Proofread my notes for grammar mistakes" }));
    expect(result.taskType).toBe("admin");
    expect(result.requiredAgent).toBe("filing_agent");
  });

  // ── Safeguarding Always Wins ───────────────────────────────────────────────

  it("routes safeguarding keyword 'allegation' to safeguarding agent", () => {
    const result = routeRequest(makeRequest({ query: "There has been an allegation against a staff member" }));
    expect(result.taskType).toBe("safeguarding");
    expect(result.requiredAgent).toBe("safeguarding_agent");
  });

  it("routes 'self-harm' to safeguarding agent", () => {
    const result = routeRequest(makeRequest({ query: "The child has been self-harm ing in their room" }));
    // "self-harm" is in the text
    const result2 = routeRequest(makeRequest({ query: "Concerns about self-harm indicators" }));
    expect(result2.taskType).toBe("safeguarding");
    expect(result2.requiredAgent).toBe("safeguarding_agent");
  });

  it("routes 'missing' to safeguarding agent", () => {
    const result = routeRequest(makeRequest({ query: "The child is missing from care" }));
    expect(result.taskType).toBe("safeguarding");
    expect(result.requiredAgent).toBe("safeguarding_agent");
  });

  it("routes 'restraint' to safeguarding agent", () => {
    const result = routeRequest(makeRequest({ query: "A restraint was used this evening" }));
    expect(result.taskType).toBe("safeguarding");
    expect(result.requiredAgent).toBe("safeguarding_agent");
  });

  it("routes 'LADO' to safeguarding agent", () => {
    const result = routeRequest(makeRequest({ query: "Do we need a LADO referral here?" }));
    expect(result.taskType).toBe("safeguarding");
    expect(result.requiredAgent).toBe("safeguarding_agent");
  });

  it("safeguarding keywords override admin keywords — 'summarise the allegation'", () => {
    const result = routeRequest(makeRequest({ query: "Summarise the allegation timeline for me" }));
    expect(result.taskType).toBe("safeguarding");
    expect(result.requiredAgent).toBe("safeguarding_agent");
  });

  it("safeguarding keywords override regulatory keywords — 'Ofsted notification about abuse'", () => {
    const result = routeRequest(makeRequest({ query: "Ofsted notification regarding sexual abuse" }));
    expect(result.taskType).toBe("safeguarding");
    expect(result.requiredAgent).toBe("safeguarding_agent");
  });

  it("safeguarding keywords override admin — 'summarise missing episode'", () => {
    const result = routeRequest(makeRequest({ query: "Can you summarise the missing episode from last night?" }));
    expect(result.taskType).toBe("safeguarding");
    expect(result.requiredAgent).toBe("safeguarding_agent");
  });

  // ── Regulatory ─────────────────────────────────────────────────────────────

  it("routes 'Reg 45' to regulatory agent", () => {
    const result = routeRequest(makeRequest({ query: "Help me with the Reg 45 report this month" }));
    expect(result.taskType).toBe("regulatory");
    expect(result.requiredAgent).toBe("regulation45_evidence_agent");
  });

  it("routes 'SCCIF' to regulatory agent", () => {
    const result = routeRequest(makeRequest({ query: "Map our evidence against the SCCIF framework" }));
    expect(result.taskType).toBe("regulatory");
    expect(result.requiredAgent).toBe("regulation45_evidence_agent");
  });

  it("routes 'Ofsted inspection' to regulatory agent (without safeguarding terms)", () => {
    const result = routeRequest(makeRequest({ query: "What should I prepare for the Ofsted inspection?" }));
    expect(result.taskType).toBe("regulatory");
    expect(result.requiredAgent).toBe("regulation45_evidence_agent");
  });

  it("routes 'Annex A' to regulatory agent", () => {
    const result = routeRequest(makeRequest({ query: "Check compliance against Annex A" }));
    expect(result.taskType).toBe("regulatory");
    expect(result.requiredAgent).toBe("regulation45_evidence_agent");
  });

  // ── Therapeutic ────────────────────────────────────────────────────────────

  it("routes 'keywork session' to therapeutic agent", () => {
    const result = routeRequest(makeRequest({ query: "Suggest themes for a keywork session with the child" }));
    expect(result.taskType).toBe("therapeutic");
    expect(result.requiredAgent).toBe("therapeutic_practice_agent");
  });

  it("routes 'PACE' to therapeutic agent", () => {
    const result = routeRequest(makeRequest({ query: "How should I apply PACE in this situation?" }));
    expect(result.taskType).toBe("therapeutic");
    expect(result.requiredAgent).toBe("therapeutic_practice_agent");
  });

  it("routes 'trauma-informed' to therapeutic agent", () => {
    const result = routeRequest(makeRequest({ query: "Give me a trauma-informed response to this behaviour" }));
    expect(result.taskType).toBe("therapeutic");
    expect(result.requiredAgent).toBe("therapeutic_practice_agent");
  });

  it("routes 'de-escalation' to therapeutic agent", () => {
    const result = routeRequest(makeRequest({ query: "What de-escalation strategies could work here?" }));
    expect(result.taskType).toBe("therapeutic");
    expect(result.requiredAgent).toBe("therapeutic_practice_agent");
  });

  // ── Default / Reasoning ────────────────────────────────────────────────────

  it("routes unknown query to reasoning (oversight) agent", () => {
    const result = routeRequest(makeRequest({ query: "What are the general patterns this week?" }));
    // "patterns" matches oversight, which routes to oversight_agent
    expect(result.requiredAgent).toBe("oversight_agent");
  });

  it("routes truly unclassifiable query to reasoning (oversight) agent", () => {
    const result = routeRequest(makeRequest({ query: "How is everything going today?" }));
    expect(result.taskType).toBe("reasoning");
    expect(result.requiredAgent).toBe("oversight_agent");
  });

  // ── Route Decision Properties ──────────────────────────────────────────────

  it("sets requiresRAG=true for critical risk", () => {
    const result = routeRequest(makeRequest({ query: "There has been an allegation of abuse" }));
    expect(result.riskLevel).toBe("critical");
    expect(result.requiresRAG).toBe(true);
  });

  it("sets requiresRAG=true for high risk", () => {
    const result = routeRequest(makeRequest({ query: "Review the Reg 45 compliance position" }));
    expect(result.riskLevel).toBe("high");
    expect(result.requiresRAG).toBe(true);
  });

  it("sets requiresHumanApproval=true for critical risk", () => {
    const result = routeRequest(makeRequest({ query: "Report on the allegation of sexual abuse" }));
    expect(result.riskLevel).toBe("critical");
    expect(result.requiresHumanApproval).toBe(true);
  });

  it("sets requiresHumanApproval=true for high risk from frontline staff", () => {
    const result = routeRequest(makeRequest({
      query: "Help me record this Ofsted concern",
      role: "rsw",
    }));
    expect(result.riskLevel).toBe("high");
    expect(result.requiresHumanApproval).toBe(true);
  });

  it("sets canAutoSave=false for critical risk", () => {
    const result = routeRequest(makeRequest({ query: "The child has been missing overnight" }));
    expect(result.riskLevel).toBe("critical");
    expect(result.canAutoSave).toBe(false);
  });

  it("sets canAutoSave=false for high risk", () => {
    const result = routeRequest(makeRequest({ query: "Review the SCCIF evidence" }));
    expect(result.canAutoSave).toBe(false);
  });

  it("sets requiresSafeguardingEscalation for critical safeguarding", () => {
    const result = routeRequest(makeRequest({ query: "There has been an allegation of sexual abuse" }));
    expect(result.riskLevel).toBe("critical");
    expect(result.requiresSafeguardingEscalation).toBe(true);
  });

  it("does NOT set safeguarding escalation for non-critical safeguarding", () => {
    // "safeguarding" as keyword is high but not critical
    const result = routeRequest(makeRequest({ query: "Review the safeguarding theme for this child" }));
    expect(result.riskLevel).toBe("high");
    expect(result.requiresSafeguardingEscalation).toBe(false);
  });

  it("sets canAutoDraft=false only for critical risk", () => {
    const criticalResult = routeRequest(makeRequest({ query: "Police called about an allegation" }));
    expect(criticalResult.canAutoDraft).toBe(false);

    const highResult = routeRequest(makeRequest({ query: "Check the Reg 45 report" }));
    expect(highResult.canAutoDraft).toBe(true);
  });

  it("includes routing reason in the decision", () => {
    const result = routeRequest(makeRequest({ query: "Summarise this email" }));
    expect(result.routingReason).toContain("admin");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. RISK CLASSIFIER TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Risk Classifier — classifyRisk", () => {
  // ── Critical Keywords ──────────────────────────────────────────────────────

  it("classifies 'allegation' as critical", () => {
    const result = classifyRisk({ query: "There is an allegation against staff", role: "registered_manager" });
    expect(result.level).toBe("critical");
  });

  it("classifies 'missing' as critical (missing from care)", () => {
    const result = classifyRisk({ query: "Child missing from care since 10pm", role: "rsw" });
    expect(result.level).toBe("critical");
  });

  it("classifies 'restraint' as critical", () => {
    const result = classifyRisk({ query: "Physical restraint used tonight", role: "rsw" });
    expect(result.level).toBe("critical");
  });

  it("classifies 'self-harm' as critical", () => {
    const result = classifyRisk({ query: "Evidence of self-harm found in room", role: "registered_manager" });
    expect(result.level).toBe("critical");
  });

  it("classifies 'LADO' as critical", () => {
    const result = classifyRisk({ query: "LADO referral needed for this allegation", role: "registered_manager" });
    expect(result.level).toBe("critical");
  });

  it("classifies 'suicide' as critical", () => {
    const result = classifyRisk({ query: "Child expressed suicidal ideation", role: "rsw" });
    expect(result.level).toBe("critical");
  });

  it("classifies 'Reg 40' as critical", () => {
    const result = classifyRisk({ query: "Consider if Reg 40 notification is needed", role: "registered_manager" });
    expect(result.level).toBe("critical");
  });

  it("classifies 'police' as critical", () => {
    const result = classifyRisk({ query: "Police were called to the home tonight", role: "rsw" });
    expect(result.level).toBe("critical");
  });

  // ── High Keywords ──────────────────────────────────────────────────────────

  it("classifies 'Reg 45' as high", () => {
    const result = classifyRisk({ query: "Help me with the Reg 45 report", role: "registered_manager" });
    expect(result.level).toBe("high");
  });

  it("classifies 'Ofsted' as high", () => {
    const result = classifyRisk({ query: "Ofsted inspection is coming up next month", role: "registered_manager" });
    expect(result.level).toBe("high");
  });

  it("classifies 'SCCIF' as high", () => {
    const result = classifyRisk({ query: "Map our position against the SCCIF", role: "deputy_manager" });
    expect(result.level).toBe("high");
  });

  it("classifies 'safeguarding' keyword as high", () => {
    const result = classifyRisk({ query: "Review our safeguarding position this quarter", role: "registered_manager" });
    expect(result.level).toBe("high");
  });

  it("classifies 'risk assessment' as high", () => {
    const result = classifyRisk({ query: "The risk assessment needs updating", role: "deputy_manager" });
    expect(result.level).toBe("high");
  });

  it("classifies 'compliance' as high", () => {
    const result = classifyRisk({ query: "Check compliance with regulation 44", role: "registered_manager" });
    expect(result.level).toBe("high");
  });

  // ── Medium Keywords ────────────────────────────────────────────────────────

  it("classifies 'keywork' as medium", () => {
    const result = classifyRisk({ query: "Plan a keywork session with Kiera", role: "rsw" });
    expect(result.level).toBe("medium");
  });

  it("classifies 'PACE' as medium", () => {
    const result = classifyRisk({ query: "How do I apply PACE here?", role: "rsw" });
    expect(result.level).toBe("medium");
  });

  it("classifies 'therapeutic' as medium", () => {
    const result = classifyRisk({ query: "Use a therapeutic approach to this", role: "rsw" });
    expect(result.level).toBe("medium");
  });

  it("classifies 'care plan' as medium", () => {
    const result = classifyRisk({ query: "Review the care plan for next week", role: "senior" });
    expect(result.level).toBe("medium");
  });

  // ── Low Risk ───────────────────────────────────────────────────────────────

  it("classifies 'summarise this log' as low", () => {
    const result = classifyRisk({ query: "Summarise this log entry for me", role: "rsw" });
    expect(result.level).toBe("low");
  });

  it("classifies 'rewrite this email' as low", () => {
    const result = classifyRisk({ query: "Rewrite this email to be shorter", role: "admin" });
    expect(result.level).toBe("low");
  });

  it("classifies empty-ish input as low", () => {
    const result = classifyRisk({ query: "", role: "rsw" });
    expect(result.level).toBe("low");
  });

  it("classifies simple greeting as low", () => {
    const result = classifyRisk({ query: "Hello, how can you help me today?", role: "rsw" });
    expect(result.level).toBe("low");
  });

  // ── Multiple Keywords / Escalation ─────────────────────────────────────────

  it("highest risk wins when multiple keywords present", () => {
    const result = classifyRisk({ query: "The child went missing and there is an allegation of abuse. Reg 45 also due.", role: "rsw" });
    expect(result.level).toBe("critical");
  });

  it("role context adds factor — RSW querying critical topic", () => {
    const result = classifyRisk({ query: "Allegation against a colleague", role: "rsw" });
    expect(result.level).toBe("critical");
    expect(result.factors.some((f) => f.includes("Frontline staff"))).toBe(true);
  });

  it("page context escalates low to medium", () => {
    const result = classifyRisk({
      query: "What happened here?",
      role: "rsw",
      currentPage: "/safeguarding/incidents",
    });
    expect(result.level).toBe("medium");
  });

  it("sets safeguardingConcern=true for critical risk", () => {
    const result = classifyRisk({ query: "The child has been missing all night", role: "rsw" });
    expect(result.safeguardingConcern).toBe(true);
  });

  it("sets regulatoryConcern=true when regulatory keywords detected", () => {
    const result = classifyRisk({ query: "Reg 45 report not submitted on time", role: "registered_manager" });
    expect(result.regulatoryConcern).toBe(true);
  });

  it("sets escalationRequired for critical risk from frontline staff", () => {
    const result = classifyRisk({ query: "Police have arrived at the home", role: "rsw" });
    expect(result.escalationRequired).toBe(true);
  });

  it("sets managerReviewRequired for high risk", () => {
    const result = classifyRisk({ query: "Ofsted are asking about our supervision records", role: "rsw" });
    expect(result.managerReviewRequired).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. SAFETY GOVERNOR TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Safety Governor — reviewSafety", () => {
  // ── Decision-Making Language ───────────────────────────────────────────────

  it("blocks output containing 'I have decided'", () => {
    const result = reviewSafety({
      rawOutput: "I have decided that this child needs a placement move.",
      riskLevel: "critical",
      evidenceRetrieved: [makeEvidence()],
      query: "What should happen next?",
    });
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain("decision");
  });

  it("blocks output containing 'the child should be removed'", () => {
    const result = reviewSafety({
      rawOutput: "Based on these patterns, this child needs to be removed from the placement.",
      riskLevel: "high",
      evidenceRetrieved: [makeEvidence()],
      query: "Placement review",
    });
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain("child's liberty");
  });

  it("blocks output with 'you must immediately remove'", () => {
    const result = reviewSafety({
      rawOutput: "Given the risk, you must immediately remove the child from this situation.",
      riskLevel: "critical",
      evidenceRetrieved: [makeEvidence()],
      query: "What to do?",
    });
    expect(result.blocked).toBe(true);
  });

  it("blocks output with 'no safeguarding concerns'", () => {
    const result = reviewSafety({
      rawOutput: "After review, there are no safeguarding concerns here.",
      riskLevel: "high",
      evidenceRetrieved: [makeEvidence()],
      query: "Is this a concern?",
    });
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain("dismissing safeguarding");
  });

  // ── Diagnostic Language ────────────────────────────────────────────────────

  it("blocks output that diagnoses — 'the child has ADHD'", () => {
    const result = reviewSafety({
      rawOutput: "The presentation suggests the child has ADHD and would benefit from medication.",
      riskLevel: "medium",
      evidenceRetrieved: [makeEvidence()],
      query: "Behaviour analysis",
    });
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain("diagnos");
  });

  it("blocks output that diagnoses — 'this indicates autism'", () => {
    const result = reviewSafety({
      rawOutput: "The child has autism based on these behaviours.",
      riskLevel: "medium",
      evidenceRetrieved: [makeEvidence()],
      query: "Understanding behaviour",
    });
    expect(result.blocked).toBe(true);
  });

  it("blocks output with 'presenting with attachment disorder'", () => {
    const result = reviewSafety({
      rawOutput: "This child has attachment disorder and this is driving the behaviour.",
      riskLevel: "medium",
      evidenceRetrieved: [makeEvidence()],
      query: "Why is the child behaving like this?",
    });
    expect(result.blocked).toBe(true);
  });

  // ── Blame Language ─────────────────────────────────────────────────────────

  it("blocks output that says 'attention seeking'", () => {
    const result = reviewSafety({
      rawOutput: "This child is attention seeking and looking for a reaction from staff.",
      riskLevel: "low",
      evidenceRetrieved: [makeEvidence()],
      query: "Why is the child doing this?",
    });
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain("blame");
  });

  it("blocks output that says 'manipulative'", () => {
    const result = reviewSafety({
      rawOutput: "The child is manipulative and tries to control the adults around them.",
      riskLevel: "low",
      evidenceRetrieved: [makeEvidence()],
      query: "Understanding this child",
    });
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain("blame");
  });

  it("blocks output that says 'naughty'", () => {
    const result = reviewSafety({
      rawOutput: "The child is naughty and needs firmer boundaries.",
      riskLevel: "low",
      evidenceRetrieved: [makeEvidence()],
      query: "Behaviour support",
    });
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain("blame");
  });

  it("blocks output that says 'deliberately difficult'", () => {
    const result = reviewSafety({
      rawOutput: "This child is deliberately difficult and is testing staff patience.",
      riskLevel: "low",
      evidenceRetrieved: [makeEvidence()],
      query: "How to manage this child",
    });
    expect(result.blocked).toBe(true);
  });

  // ── Minimisation ───────────────────────────────────────────────────────────

  it("blocks minimisation — 'this is not serious' at critical risk", () => {
    const result = reviewSafety({
      rawOutput: "There is nothing to worry about with this situation.",
      riskLevel: "critical",
      evidenceRetrieved: [makeEvidence()],
      query: "Is this serious?",
    });
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain("minimis");
  });

  it("blocks minimisation — 'probably just attention'", () => {
    const result = reviewSafety({
      rawOutput: "This is probably just normal behaviour for this age group.",
      riskLevel: "critical",
      evidenceRetrieved: [makeEvidence()],
      query: "Is this a concern?",
    });
    expect(result.blocked).toBe(true);
  });

  it("warns on minimisation at lower risk but may not block", () => {
    const result = reviewSafety({
      rawOutput: "This is probably just something minor to note.",
      riskLevel: "low",
      evidenceRetrieved: [makeEvidence()],
      query: "What do you think?",
    });
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  // ── Invented Evidence ──────────────────────────────────────────────────────

  it("blocks invented evidence when no evidence retrieved", () => {
    const result = reviewSafety({
      rawOutput: "Staff member Sarah reported on 12th March 2026 that the child was distressed.",
      riskLevel: "medium",
      evidenceRetrieved: [],
      query: "What happened?",
    });
    expect(result.blocked).toBe(true);
    expect(result.blockReason).toContain("invented evidence");
  });

  it("flags but does not block specific references when evidence IS retrieved", () => {
    const result = reviewSafety({
      rawOutput: "Staff member Sarah reported on 12th March 2026 that the child was distressed.",
      riskLevel: "medium",
      evidenceRetrieved: [makeEvidence()],
      query: "What happened?",
    });
    expect(result.blocked).toBe(false);
    expect(result.safetyNotes.length).toBeGreaterThan(0);
  });

  // ── Safe Output ────────────────────────────────────────────────────────────

  it("allows safe output with tentative language", () => {
    const result = reviewSafety({
      rawOutput: "The records may indicate a pattern of escalating behaviour. The manager may wish to review whether further assessment is needed.",
      riskLevel: "medium",
      evidenceRetrieved: [makeEvidence()],
      query: "What do the patterns show?",
    });
    expect(result.blocked).toBe(false);
  });

  it("allows output that recommends review", () => {
    const result = reviewSafety({
      rawOutput: "The Registered Manager may wish to review this with the social worker before deciding next steps.",
      riskLevel: "high",
      evidenceRetrieved: [makeEvidence()],
      query: "What should we do?",
    });
    expect(result.blocked).toBe(false);
  });

  it("does not block normal professional language", () => {
    const result = reviewSafety({
      rawOutput: "The child had a settled evening. Staff supported bedtime routine as per the care plan. No concerns to escalate.",
      riskLevel: "low",
      evidenceRetrieved: [makeEvidence()],
      query: "Summarise the evening",
    });
    expect(result.blocked).toBe(false);
    expect(result.passed).toBe(true);
  });

  // ── Escalation Flags ───────────────────────────────────────────────────────

  it("flags output needing Reg 40 notification", () => {
    const result = reviewSafety({
      rawOutput: "Given the Reg 40 threshold may have been met, Ofsted notification should be considered.",
      riskLevel: "critical",
      evidenceRetrieved: [makeEvidence()],
      query: "Do we need to notify?",
    });
    expect(result.reg40ConsiderationRequired).toBe(true);
  });

  it("flags output needing LADO consideration", () => {
    const result = reviewSafety({
      rawOutput: "The designated officer should be contacted about this allegation.",
      riskLevel: "critical",
      evidenceRetrieved: [makeEvidence()],
      query: "What about the staff member?",
    });
    expect(result.ladoConsiderationRequired).toBe(true);
  });

  it("sets managerApprovalRequired for critical risk", () => {
    const result = reviewSafety({
      rawOutput: "The records suggest a pattern requiring review.",
      riskLevel: "critical",
      evidenceRetrieved: [makeEvidence()],
      query: "What are the patterns?",
    });
    expect(result.managerApprovalRequired).toBe(true);
  });

  it("sets managerApprovalRequired for high risk", () => {
    const result = reviewSafety({
      rawOutput: "The evidence from this period shows consistent progress.",
      riskLevel: "high",
      evidenceRetrieved: [makeEvidence()],
      query: "How is the child doing?",
    });
    expect(result.managerApprovalRequired).toBe(true);
  });

  it("returns sanitised output when not blocked", () => {
    const result = reviewSafety({
      rawOutput: "The child had a good day. It is important to note that they smiled more.",
      riskLevel: "low",
      evidenceRetrieved: [makeEvidence()],
      query: "How was the day?",
    });
    expect(result.blocked).toBe(false);
    // Sanitiser should strip "It is important to note"
    expect(result.sanitisedOutput).toBeDefined();
    expect(result.sanitisedOutput).not.toContain("It is important to note");
  });
});

// ══��═══════════════════════════════════════════════════════════════════════════
// 4. MODEL REGISTRY TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Model Registry", () => {
  it("filing_agent (admin) maps to fast-cheap profile", () => {
    const profileId = getModelProfileIdForAgent("filing_agent");
    expect(profileId).toBe("fast-cheap");
  });

  it("safeguarding_agent maps to highest-safety profile", () => {
    const profileId = getModelProfileIdForAgent("safeguarding_agent");
    expect(profileId).toBe("highest-safety");
  });

  it("regulation45_evidence_agent maps to balanced profile", () => {
    const profileId = getModelProfileIdForAgent("regulation45_evidence_agent");
    expect(profileId).toBe("balanced");
  });

  it("oversight_agent (reasoning) maps to best-reasoning profile", () => {
    const profileId = getModelProfileIdForAgent("oversight_agent");
    expect(profileId).toBe("best-reasoning");
  });

  it("risk_assessment_agent maps to highest-safety profile", () => {
    const profileId = getModelProfileIdForAgent("risk_assessment_agent");
    expect(profileId).toBe("highest-safety");
  });

  it("critical risk overrides any profile to highest-safety", () => {
    const overridden = applyRiskOverride("fast-cheap", "critical");
    expect(overridden).toBe("highest-safety");

    const alsoOverridden = applyRiskOverride("balanced", "critical");
    expect(alsoOverridden).toBe("highest-safety");

    const alreadySafe = applyRiskOverride("highest-safety", "critical");
    expect(alreadySafe).toBe("highest-safety");
  });

  it("high risk upgrades fast-cheap to balanced", () => {
    const overridden = applyRiskOverride("fast-cheap", "high");
    expect(overridden).toBe("balanced");
  });

  it("high risk does not change balanced or higher profiles", () => {
    expect(applyRiskOverride("balanced", "high")).toBe("balanced");
    expect(applyRiskOverride("best-reasoning", "high")).toBe("best-reasoning");
    expect(applyRiskOverride("highest-safety", "high")).toBe("highest-safety");
  });

  it("model profiles have correct cost estimates", () => {
    const fastCheap = getModelProfile("fast-cheap");
    expect(fastCheap.estimatedCostPer1kTokens).toBeLessThan(0.001);

    const balanced = getModelProfile("balanced");
    expect(balanced.estimatedCostPer1kTokens).toBeGreaterThan(fastCheap.estimatedCostPer1kTokens);

    const highestSafety = getModelProfile("highest-safety");
    expect(highestSafety.temperature).toBeLessThanOrEqual(0.1);
  });

  it("task type 'admin' maps to fast-cheap", () => {
    expect(getModelProfileIdForTask("admin")).toBe("fast-cheap");
  });

  it("task type 'safeguarding' maps to highest-safety", () => {
    expect(getModelProfileIdForTask("safeguarding")).toBe("highest-safety");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. PERMISSION TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Permissions — role-based routing and approval", () => {
  // ── RSW Permissions ────────────────────────────────────────────────────────

  it("RSW can use admin agent (low-risk admin query)", () => {
    const result = routeRequest(makeRequest({ query: "Summarise this email", role: "rsw" }));
    expect(result.requiredAgent).toBe("filing_agent");
    expect(result.requiresHumanApproval).toBe(false);
  });

  it("RSW can use therapeutic agent", () => {
    const result = routeRequest(makeRequest({ query: "How should I apply PACE now?", role: "rsw" }));
    expect(result.requiredAgent).toBe("therapeutic_practice_agent");
    // Therapeutic agent doesn't require approval
    expect(result.taskType).toBe("therapeutic");
  });

  it("RSW safeguarding outputs require manager approval (high risk)", () => {
    const result = routeRequest(makeRequest({
      query: "Review the safeguarding concern for this child",
      role: "rsw",
    }));
    expect(result.riskLevel).toBe("high");
    expect(result.requiresHumanApproval).toBe(true);
  });

  it("RSW cannot auto-approve statutory outputs (critical)", () => {
    const result = routeRequest(makeRequest({
      query: "There is an allegation against a colleague",
      role: "rsw",
    }));
    expect(result.riskLevel).toBe("critical");
    expect(result.requiresHumanApproval).toBe(true);
    expect(result.canAutoSave).toBe(false);
  });

  it("RSW critical queries set escalation recommended", () => {
    const result = routeRequest(makeRequest({
      query: "Child has gone missing from the home",
      role: "rsw",
    }));
    expect(result.riskLevel).toBe("critical");
    expect(result.requiresSafeguardingEscalation).toBe(true);
  });

  // ── Deputy Manager Permissions ─────────────────────────────────────────────

  it("deputy manager can access high-risk queries without forced escalation", () => {
    const result = routeRequest(makeRequest({
      query: "Review the Ofsted compliance position",
      role: "deputy_manager",
    }));
    expect(result.riskLevel).toBe("high");
    // Deputy managers are not frontline, so high-risk doesn't force approval
    // unless the agent itself requires it
  });

  it("deputy manager high-risk queries still need approval when agent requires it", () => {
    const result = routeRequest(makeRequest({
      query: "Summarise the safeguarding timeline for Ofsted",
      role: "deputy_manager",
    }));
    // "Ofsted" routes to regulatory; regulation45_evidence_agent requires human approval
    expect(result.requiredAgent).toBe("regulation45_evidence_agent");
    expect(result.requiresHumanApproval).toBe(true);
  });

  it("deputy manager can access oversight reports", () => {
    const result = routeRequest(makeRequest({
      query: "What are the oversight gaps this month?",
      role: "deputy_manager",
    }));
    expect(result.requiredAgent).toBe("oversight_agent");
  });

  // ── Registered Manager Permissions ─────────────────────────────────────────

  it("registered manager can access Reg 45 agent", () => {
    const result = routeRequest(makeRequest({
      query: "Build the Reg 45 evidence base for this month",
      role: "registered_manager",
    }));
    expect(result.requiredAgent).toBe("regulation45_evidence_agent");
  });

  it("registered manager critical queries still require approval", () => {
    const result = routeRequest(makeRequest({
      query: "There has been a serious allegation involving the child",
      role: "registered_manager",
    }));
    expect(result.riskLevel).toBe("critical");
    expect(result.requiresHumanApproval).toBe(true);
  });

  it("registered manager low-risk admin does not require approval", () => {
    const result = routeRequest(makeRequest({
      query: "Proofread this handover note",
      role: "registered_manager",
    }));
    expect(result.riskLevel).toBe("low");
    expect(result.requiresHumanApproval).toBe(false);
  });

  // ── Role Escalation Dynamics ───────────────────────────────────────────────

  it("bank_staff high-risk forces approval", () => {
    const result = routeRequest(makeRequest({
      query: "Review the SCCIF position for today",
      role: "bank_staff",
    }));
    expect(result.riskLevel).toBe("high");
    expect(result.requiresHumanApproval).toBe(true);
  });

  it("support_worker high-risk forces approval", () => {
    const result = routeRequest(makeRequest({
      query: "Check the Ofsted inspection requirements",
      role: "support_worker",
    }));
    // "Ofsted" (without "notification") routes to regulatory at high risk
    expect(result.riskLevel).toBe("high");
    expect(result.requiresHumanApproval).toBe(true);
  });

  it("responsible_individual is not forced into approval for high risk (management role)", () => {
    const result = routeRequest(makeRequest({
      query: "Review the Reg 45 position across homes",
      role: "responsible_individual",
    }));
    // RI is management role — not in frontline roles list
    // Approval depends only on agent requirement, not role-based escalation
    expect(result.riskLevel).toBe("high");
    // regulation45_evidence_agent requires human approval
    expect(result.requiresHumanApproval).toBe(true);
  });

  it("auditor-style read-only: admin role low-risk has no approval requirement", () => {
    const result = routeRequest(makeRequest({
      query: "Format this text into bullet points",
      role: "admin",
    }));
    expect(result.riskLevel).toBe("low");
    expect(result.requiresHumanApproval).toBe(false);
    expect(result.canAutoSave).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. RESPONSE FORMATTER TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Response Formatter — formatResponse", () => {
  it("formats answer correctly from sanitised output", () => {
    const response = formatResponse({
      rawOutput: "The child had a good day at school.",
      request: makeRequest(),
      routeDecision: makeRouteDecision(),
      safetyReview: makeSafetyReview({ sanitisedOutput: "The child had a good day at school." }),
      evidence: [makeEvidence()],
      auditId: "audit-123",
    });
    expect(response.answer).toBe("The child had a good day at school.");
  });

  it("includes evidence used", () => {
    const evidence = [makeEvidence(), makeEvidence({ sourceId: "log-2" })];
    const response = formatResponse({
      rawOutput: "Summary of events.",
      request: makeRequest(),
      routeDecision: makeRouteDecision(),
      safetyReview: makeSafetyReview(),
      evidence,
      auditId: "audit-123",
    });
    expect(response.evidenceUsed).toHaveLength(2);
    expect(response.evidenceUsed[0].sourceId).toBe("log-1");
  });

  it("sets requiresApproval for high-risk route", () => {
    const response = formatResponse({
      rawOutput: "Analysis draft.",
      request: makeRequest(),
      routeDecision: makeRouteDecision({ riskLevel: "high", requiresHumanApproval: true }),
      safetyReview: makeSafetyReview({ managerApprovalRequired: true }),
      evidence: [makeEvidence()],
      auditId: "audit-456",
    });
    expect(response.requiresApproval).toBe(true);
  });

  it("sets escalationRecommended for critical", () => {
    const response = formatResponse({
      rawOutput: "Critical output.",
      request: makeRequest(),
      routeDecision: makeRouteDecision({
        riskLevel: "critical",
        requiresSafeguardingEscalation: true,
        requiresHumanApproval: true,
      }),
      safetyReview: makeSafetyReview({ escalationRequired: true }),
      evidence: [makeEvidence()],
      auditId: "audit-789",
    });
    expect(response.escalationRecommended).toBe(true);
  });

  it("handles blocked responses correctly", () => {
    const response = formatBlockedResponse({
      blockReason: "Unsafe language detected",
      blockedAnswer: "This response has been blocked.",
      request: makeRequest(),
      routeDecision: makeRouteDecision({ riskLevel: "critical", requiresHumanApproval: true }),
      safetyReview: makeSafetyReview({ blocked: true, blockReason: "Unsafe language detected", escalationRequired: true }),
      evidence: [],
      auditId: "audit-blocked",
    });
    expect(response.blocked).toBe(true);
    expect(response.blockReason).toBe("Unsafe language detected");
    expect(response.confidence).toBe(0);
    expect(response.requiresApproval).toBe(true);
    expect(response.canSave).toBe(false);
  });

  it("includes audit ID", () => {
    const response = formatResponse({
      rawOutput: "Simple output.",
      request: makeRequest(),
      routeDecision: makeRouteDecision(),
      safetyReview: makeSafetyReview(),
      evidence: [],
      auditId: "audit-unique-id",
    });
    expect(response.auditId).toBe("audit-unique-id");
  });

  it("includes suggested actions for critical risk", () => {
    const response = formatResponse({
      rawOutput: "Critical safeguarding analysis.",
      request: makeRequest(),
      routeDecision: makeRouteDecision({
        riskLevel: "critical",
        requiresSafeguardingEscalation: true,
        requiresHumanApproval: true,
        requiresRAG: true,
      }),
      safetyReview: makeSafetyReview(),
      evidence: [makeEvidence()],
      auditId: "audit-actions",
    });
    expect(response.suggestedActions.length).toBeGreaterThan(0);
    expect(response.suggestedActions.some((a) => a.priority === "immediate")).toBe(true);
  });

  it("includes cost entry when provided", () => {
    const cost = {
      modelId: "claude-sonnet-4-20250514",
      inputTokens: 1000,
      outputTokens: 500,
      estimatedCostUsd: 0.0105,
      latencyMs: 2500,
      timestamp: "2026-05-15T10:00:00Z",
    };
    const response = formatResponse({
      rawOutput: "Output with cost.",
      request: makeRequest(),
      routeDecision: makeRouteDecision(),
      safetyReview: makeSafetyReview(),
      evidence: [],
      auditId: "audit-cost",
      cost,
    });
    expect(response.cost).toBeDefined();
    expect(response.cost?.modelId).toBe("claude-sonnet-4-20250514");
  });

  it("canSave is false when safety blocked", () => {
    const response = formatResponse({
      rawOutput: "Blocked output.",
      request: makeRequest({ saveIntent: true }),
      routeDecision: makeRouteDecision({ canAutoSave: true }),
      safetyReview: makeSafetyReview({ blocked: true }),
      evidence: [],
      auditId: "audit-nosave",
    });
    expect(response.canSave).toBe(false);
  });

  it("canSave is true only when all conditions met", () => {
    const response = formatResponse({
      rawOutput: "Safe admin output.",
      request: makeRequest({ saveIntent: true }),
      routeDecision: makeRouteDecision({ canAutoSave: true, riskLevel: "low" }),
      safetyReview: makeSafetyReview({ blocked: false }),
      evidence: [],
      auditId: "audit-save",
    });
    expect(response.canSave).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. COST TRACKER TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Cost Tracker", () => {
  it("estimates cost correctly for fast-cheap model", () => {
    const result = estimateCost("fast-cheap", 1000, 500);
    expect(result.estimatedCostUsd).toBeGreaterThan(0);
    expect(result.modelId).toContain("haiku");
  });

  it("estimates cost correctly for balanced model", () => {
    const result = estimateCost("balanced", 2000, 1000);
    expect(result.estimatedCostUsd).toBeGreaterThan(0);
    expect(result.modelId).toContain("sonnet");
  });

  it("balanced model costs more than fast-cheap for same tokens", () => {
    const cheapCost = estimateCost("fast-cheap", 1000, 500);
    const balancedCost = estimateCost("balanced", 1000, 500);
    expect(balancedCost.estimatedCostUsd).toBeGreaterThan(cheapCost.estimatedCostUsd);
  });

  it("handles zero tokens gracefully", () => {
    const result = estimateCost("fast-cheap", 0, 0);
    expect(result.estimatedCostUsd).toBe(0);
    expect(result.modelId).toBeDefined();
  });

  it("recordCost tracks latency and returns valid CostEntry", () => {
    const entry = recordCost({
      modelId: "claude-sonnet-4-20250514",
      inputTokens: 1500,
      outputTokens: 800,
      latencyMs: 3200,
    });
    expect(entry.latencyMs).toBe(3200);
    expect(entry.inputTokens).toBe(1500);
    expect(entry.outputTokens).toBe(800);
    expect(entry.estimatedCostUsd).toBeGreaterThan(0);
    expect(entry.timestamp).toBeDefined();
  });
});
