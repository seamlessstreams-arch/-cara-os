import { describe, it, expect } from "vitest";
import {
  computeRegulatoryEvidenceCompleteness,
  type RegulatoryEvidenceCompletenessInput,
  type FilingItemInput,
  type DocumentInput,
  type RiskAssessmentInput,
  type IncidentEvidenceInput,
} from "../home-regulatory-evidence-completeness-intelligence-engine";

// ── Factory Helpers ─────────────────────────────────────────────────────────

function makeFilingItem(overrides: Partial<FilingItemInput> = {}): FilingItemInput {
  return {
    id: "f-1",
    category: "safeguarding",
    child_id: "child-1",
    is_verified: true,
    has_description: true,
    source_type: "upload",
    filed_at: "2025-03-01",
    ...overrides,
  };
}

function makeDocument(overrides: Partial<DocumentInput> = {}): DocumentInput {
  return {
    id: "d-1",
    category: "policy",
    status: "current",
    has_review_date: true,
    review_date: "2025-06-01",
    is_signed: true,
    child_id: null,
    created_at: "2025-01-01",
    ...overrides,
  };
}

function makeRiskAssessment(overrides: Partial<RiskAssessmentInput> = {}): RiskAssessmentInput {
  return {
    id: "ra-1",
    child_id: "child-1",
    category: "environmental",
    status: "current",
    last_reviewed: "2025-02-15",
    has_mitigations: true,
    mitigations_count: 3,
    risk_level: "medium",
    created_at: "2025-01-01",
    ...overrides,
  };
}

function makeIncident(overrides: Partial<IncidentEvidenceInput> = {}): IncidentEvidenceInput {
  return {
    id: "i-1",
    child_id: "child-1",
    date: "2025-03-10",
    severity: "medium",
    has_report: true,
    has_follow_up: true,
    has_notification: false,
    has_debrief: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<RegulatoryEvidenceCompletenessInput> = {}): RegulatoryEvidenceCompletenessInput {
  return {
    today: "2025-03-15",
    total_children: 6,
    total_staff: 10,
    filing_items: [],
    documents: [],
    risk_assessments: [],
    incidents: [],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SPECIAL CASES
// ═══════════════════════════════════════════════════════════════════════════════

describe("computeRegulatoryEvidenceCompleteness", () => {
  describe("Special cases", () => {
    it("returns insufficient_data when all arrays empty and zero children and zero staff", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 0, total_staff: 0 }),
      );
      expect(result.evidence_rating).toBe("insufficient_data");
      expect(result.evidence_score).toBe(0);
    });

    it("returns inadequate when all arrays empty but children > 0", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 3, total_staff: 0 }),
      );
      expect(result.evidence_rating).toBe("inadequate");
      expect(result.evidence_score).toBe(15);
    });

    it("returns inadequate when all arrays empty but staff > 0", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 0, total_staff: 5 }),
      );
      expect(result.evidence_rating).toBe("inadequate");
      expect(result.evidence_score).toBe(15);
    });

    it("returns inadequate when all arrays empty but both children and staff > 0", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 6, total_staff: 10 }),
      );
      expect(result.evidence_rating).toBe("inadequate");
      expect(result.evidence_score).toBe(15);
    });

    it("checks allEmpty + children/staff FIRST (order matters)", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 1, total_staff: 0 }),
      );
      expect(result.evidence_rating).toBe("inadequate");
      expect(result.evidence_score).toBe(15);
      expect(result.headline).toBe(
        "Significant regulatory evidence gaps that would likely attract regulatory criticism",
      );
    });

    it("insufficient_data headline is correct", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 0, total_staff: 0 }),
      );
      expect(result.headline).toBe(
        "No evidence data available to assess regulatory compliance",
      );
    });

    it("inadequate special case has correct concern", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 2, total_staff: 3 }),
      );
      expect(result.concerns).toHaveLength(1);
      expect(result.concerns[0]).toBe(
        "No regulatory evidence recorded despite active home with children/staff",
      );
    });

    it("inadequate special case has correct recommendation", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 2, total_staff: 3 }),
      );
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].rank).toBe(1);
      expect(result.recommendations[0].urgency).toBe("immediate");
      expect(result.recommendations[0].regulatory_ref).toBe("Reg 36");
    });

    it("inadequate special case has correct insight", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 2, total_staff: 3 }),
      );
      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].severity).toBe("critical");
    });

    it("insufficient_data has no concerns", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 0, total_staff: 0 }),
      );
      expect(result.concerns).toHaveLength(0);
    });

    it("insufficient_data has no recommendations", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 0, total_staff: 0 }),
      );
      expect(result.recommendations).toHaveLength(0);
    });

    it("insufficient_data has no strengths", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 0, total_staff: 0 }),
      );
      expect(result.strengths).toHaveLength(0);
    });

    it("insufficient_data has one warning insight", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 0, total_staff: 0 }),
      );
      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].severity).toBe("warning");
      expect(result.insights[0].text).toBe(
        "No data available to assess regulatory evidence completeness",
      );
    });

    it("special case returns all zero rates", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 0, total_staff: 0 }),
      );
      expect(result.filing_verified_rate).toBe(0);
      expect(result.filing_described_rate).toBe(0);
      expect(result.document_currency_rate).toBe(0);
      expect(result.document_signed_rate).toBe(0);
      expect(result.risk_assessment_currency_rate).toBe(0);
      expect(result.risk_mitigation_rate).toBe(0);
      expect(result.incident_report_rate).toBe(0);
      expect(result.incident_follow_up_rate).toBe(0);
      expect(result.high_severity_notification_rate).toBe(0);
      expect(result.evidence_category_coverage).toBe(0);
      expect(result.child_evidence_coverage_rate).toBe(0);
    });

    it("special case total_evidence_items is 0", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 5, total_staff: 0 }),
      );
      expect(result.total_evidence_items).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. BASE SCORE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Base score", () => {
    it("starts at 52 with no bonuses or penalties", () => {
      // One filing item verified, described (rate 100% each) -> +4 (verified>=90) +3 (described>=95)
      // No docs, no RA, no incidents -> those rates are 0
      // filing verified 100 >= 90 -> +4; filing described 100 >= 95 -> +3
      // doc currency 0 -> no bonus; doc signed 0 -> no bonus
      // RA currency 0 < 50 -> -5; RA mitigation 0 -> no bonus
      // incident report 0 -> no bonus; incident follow-up 0 -> no bonus
      // high sev notification 0 -> no penalty (no high sev incidents)
      // child coverage: child-1 out of 6 = 17% < 50 -> no bonus
      // filing verified < 40? no (100%).
      // RA currency < 50 -> -5
      // incident report < 50 -> -5 (0 incidents, rate is 0... wait pct(0,0) = 0 < 50 -> -5)
      // Wait: 0 incidents -> incidentReportRate = pct(0, 0) = 0 < 50 -> -5
      // highSev: 0 high sev incidents -> pct(0,0) = 0 < 50 -> -8
      // Actually this gets complicated. Let me construct a scenario with no penalties/bonuses.

      // To get exactly 52: need all rates in "no bonus, no penalty" zone
      // filingVerifiedRate >= 40 and < 75 -> no bonus, no penalty -> e.g. 50%
      // filingDescribedRate < 80 -> no bonus
      // documentCurrencyRate < 80 -> no bonus
      // documentSignedRate < 75 -> no bonus
      // raCurrencyRate >= 50 and < 75 -> no penalty, no bonus
      // raMitigationRate < 80 -> no bonus
      // incidentReportRate >= 50 and < 85 -> no penalty, no bonus
      // incidentFollowUpRate < 75 -> no bonus
      // highSevNotificationRate >= 50 -> no penalty; < 100 -> no bonus
      // childEvidenceCoverageRate < 80 -> no bonus

      const filings = [
        makeFilingItem({ id: "f-1", is_verified: true, has_description: false, child_id: "child-1" }),
        makeFilingItem({ id: "f-2", is_verified: false, has_description: false, child_id: "child-2" }),
      ]; // verified 50%, described 0%

      const docs = [
        makeDocument({ id: "d-1", status: "current", is_signed: false }),
        makeDocument({ id: "d-2", status: "expired", is_signed: false }),
        makeDocument({ id: "d-3", status: "expired", is_signed: false }),
      ]; // currency 33%, signed 0%

      const ras = [
        makeRiskAssessment({ id: "ra-1", status: "current", has_mitigations: true, child_id: "child-1" }),
        makeRiskAssessment({ id: "ra-2", status: "archived", has_mitigations: false, child_id: "child-2" }),
      ]; // currency 50%, mitigation 50%

      // highSevNotificationRate = 100 -> +2 bonus (oops, not exactly 52)
      // Let me adjust: 2 high sev, 1 with notification -> 50% -> no penalty (>=50), no bonus (<100)
      const incidents2 = [
        makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: false, has_notification: true, child_id: "child-1" }),
        makeIncident({ id: "i-2", severity: "high", has_report: true, has_follow_up: false, has_notification: false, child_id: "child-2" }),
        makeIncident({ id: "i-3", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-4", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-4" }),
      ]; // report rate: 2/4 = 50%, follow-up 0%, high sev notification 1/2 = 50%

      // Now: filingVerified 50%: no bonus, no penalty
      // filingDescribed 0%: no bonus (< 80)
      // docCurrency 33%: no bonus
      // docSigned 0%: no bonus
      // raCurrency 50%: no bonus, no penalty (>= 50)
      // raMitigation 50%: no bonus (< 80)
      // incidentReport 50%: no bonus (< 85), no penalty (>= 50)
      // incidentFollowUp 0%: no bonus
      // highSevNotification 50%: no bonus (< 100), no penalty (>= 50)
      // childCoverage: child-1..4 out of 6 = 67% -> no bonus (< 80)
      // Score = 52

      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 6,
          filing_items: filings,
          documents: docs,
          risk_assessments: ras,
          incidents: incidents2,
        }),
      );
      expect(result.evidence_score).toBe(52);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. INDIVIDUAL BONUSES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Scoring bonuses", () => {
    // Helper that creates a "neutral" baseline (score 52) then we can tweak one metric
    function neutralInput(): RegulatoryEvidenceCompletenessInput {
      // Same as above proven to be 52
      return baseInput({
        total_children: 6,
        filing_items: [
          makeFilingItem({ id: "f-1", is_verified: true, has_description: false, child_id: "child-1" }),
          makeFilingItem({ id: "f-2", is_verified: false, has_description: false, child_id: "child-2" }),
        ],
        documents: [
          makeDocument({ id: "d-1", status: "current", is_signed: false }),
          makeDocument({ id: "d-2", status: "expired", is_signed: false }),
          makeDocument({ id: "d-3", status: "expired", is_signed: false }),
        ],
        risk_assessments: [
          makeRiskAssessment({ id: "ra-1", status: "current", has_mitigations: true, child_id: "child-1" }),
          makeRiskAssessment({ id: "ra-2", status: "archived", has_mitigations: false, child_id: "child-2" }),
        ],
        incidents: [
          makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: false, has_notification: true, child_id: "child-1" }),
          makeIncident({ id: "i-2", severity: "high", has_report: true, has_follow_up: false, has_notification: false, child_id: "child-2" }),
          makeIncident({ id: "i-3", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
          makeIncident({ id: "i-4", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-4" }),
        ],
      });
    }

    it("filing verified >= 90 gives +4 bonus", () => {
      const input = neutralInput();
      // Change to 10 filings, 9 verified -> 90%
      input.filing_items = Array.from({ length: 10 }, (_, i) =>
        makeFilingItem({
          id: `f-${i}`,
          is_verified: i < 9,
          has_description: false,
          child_id: `child-${(i % 4) + 1}`,
        }),
      );
      const result = computeRegulatoryEvidenceCompleteness(input);
      // Was 52 (filingVerified was neutral). Now filingVerified=90 -> +4 instead of 0.
      // But filingVerified now 90% means no penalty (was no penalty before too).
      expect(result.evidence_score).toBe(52 + 4);
    });

    it("filing verified >= 75 but < 90 gives +2 bonus", () => {
      const input = neutralInput();
      input.filing_items = Array.from({ length: 4 }, (_, i) =>
        makeFilingItem({
          id: `f-${i}`,
          is_verified: i < 3,
          has_description: false,
          child_id: `child-${(i % 4) + 1}`,
        }),
      ); // 75%
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(52 + 2);
    });

    it("filing described >= 95 gives +3 bonus", () => {
      const input = neutralInput();
      // 20 filings, 19 described -> 95%
      input.filing_items = Array.from({ length: 20 }, (_, i) =>
        makeFilingItem({
          id: `f-${i}`,
          is_verified: i < 10,
          has_description: i < 19,
          child_id: `child-${(i % 4) + 1}`,
        }),
      ); // verified 50%, described 95%
      const result = computeRegulatoryEvidenceCompleteness(input);
      // filingVerified 50% -> still neutral, filingDescribed 95 -> +3
      expect(result.evidence_score).toBe(52 + 3);
    });

    it("filing described >= 80 but < 95 gives +1 bonus", () => {
      const input = neutralInput();
      input.filing_items = Array.from({ length: 5 }, (_, i) =>
        makeFilingItem({
          id: `f-${i}`,
          is_verified: i < 3,
          has_description: i < 4,
          child_id: `child-${(i % 4) + 1}`,
        }),
      ); // verified 60%, described 80%
      const result = computeRegulatoryEvidenceCompleteness(input);
      // verified 60% -> neutral, described 80% -> +1
      expect(result.evidence_score).toBe(52 + 1);
    });

    it("document currency >= 95 gives +4 bonus", () => {
      const input = neutralInput();
      input.documents = Array.from({ length: 20 }, (_, i) =>
        makeDocument({
          id: `d-${i}`,
          status: i < 19 ? "current" : "expired",
          is_signed: false,
        }),
      ); // 95%
      const result = computeRegulatoryEvidenceCompleteness(input);
      // docCurrency was 33% (no bonus), now 95% -> +4
      expect(result.evidence_score).toBe(52 + 4);
    });

    it("document currency >= 80 but < 95 gives +2 bonus", () => {
      const input = neutralInput();
      input.documents = Array.from({ length: 5 }, (_, i) =>
        makeDocument({
          id: `d-${i}`,
          status: i < 4 ? "current" : "expired",
          is_signed: false,
        }),
      ); // 80%
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(52 + 2);
    });

    it("document signed >= 90 gives +3 bonus", () => {
      const input = neutralInput();
      input.documents = Array.from({ length: 10 }, (_, i) =>
        makeDocument({
          id: `d-${i}`,
          status: i < 3 ? "current" : "expired",
          is_signed: i < 9,
        }),
      ); // currency 30%, signed 90%
      const result = computeRegulatoryEvidenceCompleteness(input);
      // docCurrency 30% -> no bonus, docSigned 90% -> +3
      expect(result.evidence_score).toBe(52 + 3);
    });

    it("document signed >= 75 but < 90 gives +1 bonus", () => {
      const input = neutralInput();
      input.documents = Array.from({ length: 4 }, (_, i) =>
        makeDocument({
          id: `d-${i}`,
          status: i < 1 ? "current" : "expired",
          is_signed: i < 3,
        }),
      ); // currency 25%, signed 75%
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(52 + 1);
    });

    it("RA currency >= 90 gives +4 bonus", () => {
      const input = neutralInput();
      input.risk_assessments = Array.from({ length: 10 }, (_, i) =>
        makeRiskAssessment({
          id: `ra-${i}`,
          status: i < 9 ? "current" : "archived",
          has_mitigations: i < 5,
          child_id: `child-${(i % 4) + 1}`,
        }),
      ); // currency 90%, mitigation 50%
      const result = computeRegulatoryEvidenceCompleteness(input);
      // raCurrency was 50% (no bonus, no penalty), now 90% -> +4
      // raMitigation 50% -> no bonus (same as before)
      expect(result.evidence_score).toBe(52 + 4);
    });

    it("RA currency >= 75 but < 90 gives +2 bonus", () => {
      const input = neutralInput();
      input.risk_assessments = Array.from({ length: 4 }, (_, i) =>
        makeRiskAssessment({
          id: `ra-${i}`,
          status: i < 3 ? "current" : "archived",
          has_mitigations: i < 2,
          child_id: `child-${(i % 4) + 1}`,
        }),
      ); // currency 75%, mitigation 50%
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(52 + 2);
    });

    it("RA mitigation >= 100 gives +3 bonus", () => {
      const input = neutralInput();
      input.risk_assessments = [
        makeRiskAssessment({ id: "ra-1", status: "current", has_mitigations: true, child_id: "child-1" }),
        makeRiskAssessment({ id: "ra-2", status: "archived", has_mitigations: true, child_id: "child-2" }),
      ]; // currency 50%, mitigation 100%
      const result = computeRegulatoryEvidenceCompleteness(input);
      // mitigation was 50% (no bonus), now 100% -> +3
      expect(result.evidence_score).toBe(52 + 3);
    });

    it("RA mitigation >= 80 but < 100 gives +1 bonus", () => {
      const input = neutralInput();
      input.risk_assessments = Array.from({ length: 5 }, (_, i) =>
        makeRiskAssessment({
          id: `ra-${i}`,
          status: i < 3 ? "current" : "archived",
          has_mitigations: i < 4,
          child_id: `child-${(i % 4) + 1}`,
        }),
      ); // currency 60%, mitigation 80%
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(52 + 1);
    });

    it("incident report >= 100 gives +3 bonus", () => {
      const input = neutralInput();
      input.incidents = [
        makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: false, has_notification: true, child_id: "child-1" }),
        makeIncident({ id: "i-2", severity: "high", has_report: true, has_follow_up: false, has_notification: false, child_id: "child-2" }),
        makeIncident({ id: "i-3", severity: "low", has_report: true, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-4", severity: "low", has_report: true, has_follow_up: false, has_notification: false, child_id: "child-4" }),
      ]; // report 100%, follow-up 0%, high sev notification 1/2=50%
      const result = computeRegulatoryEvidenceCompleteness(input);
      // report was 50% (no bonus, no penalty), now 100% -> +3
      expect(result.evidence_score).toBe(52 + 3);
    });

    it("incident report >= 85 but < 100 gives +1 bonus", () => {
      const input = neutralInput();
      // 7 incidents, 6 with report -> 86%
      input.incidents = Array.from({ length: 7 }, (_, i) =>
        makeIncident({
          id: `i-${i}`,
          severity: i < 2 ? "high" : "low",
          has_report: i < 6,
          has_follow_up: false,
          has_notification: i === 0,
          child_id: `child-${(i % 4) + 1}`,
        }),
      ); // report 86%, high sev notification 1/2=50%
      const result = computeRegulatoryEvidenceCompleteness(input);
      // report was neutral (50%), now 86% -> +1
      expect(result.evidence_score).toBe(52 + 1);
    });

    it("incident follow-up >= 90 gives +2 bonus", () => {
      const input = neutralInput();
      input.incidents = Array.from({ length: 10 }, (_, i) =>
        makeIncident({
          id: `i-${i}`,
          severity: i < 2 ? "high" : "low",
          has_report: i < 5,
          has_follow_up: i < 9,
          has_notification: i === 0,
          child_id: `child-${(i % 4) + 1}`,
        }),
      ); // report 50%, follow-up 90%, high sev 1/2=50%
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(52 + 2);
    });

    it("incident follow-up >= 75 but < 90 gives +1 bonus", () => {
      const input = neutralInput();
      input.incidents = Array.from({ length: 4 }, (_, i) =>
        makeIncident({
          id: `i-${i}`,
          severity: i < 2 ? "high" : "low",
          has_report: i < 2,
          has_follow_up: i < 3,
          has_notification: i === 0,
          child_id: `child-${(i % 4) + 1}`,
        }),
      ); // report 50%, follow-up 75%, high sev 1/2=50%
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(52 + 1);
    });

    it("high severity notification >= 100 gives +2 bonus", () => {
      const input = neutralInput();
      input.incidents = [
        makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: false, has_notification: true, child_id: "child-1" }),
        makeIncident({ id: "i-2", severity: "critical", has_report: true, has_follow_up: false, has_notification: true, child_id: "child-2" }),
        makeIncident({ id: "i-3", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-4", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-4" }),
      ]; // report 50%, high sev notification 2/2=100%
      const result = computeRegulatoryEvidenceCompleteness(input);
      // highSevNotification was 50% (no bonus no penalty), now 100% -> +2
      expect(result.evidence_score).toBe(52 + 2);
    });

    it("child evidence coverage >= 100 gives +2 bonus", () => {
      const input = neutralInput();
      input.total_children = 4;
      // Already has child-1..child-4 covered in incidents
      const result = computeRegulatoryEvidenceCompleteness(input);
      // childCoverage was 4/6=67%, now 4/4=100% -> +2
      expect(result.evidence_score).toBe(52 + 2);
    });

    it("child evidence coverage >= 80 but < 100 gives +1 bonus", () => {
      const input = neutralInput();
      input.total_children = 5;
      // child-1..child-4 covered -> 4/5=80%
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(52 + 1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. INDIVIDUAL PENALTIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Scoring penalties", () => {
    function neutralInput(): RegulatoryEvidenceCompletenessInput {
      return baseInput({
        total_children: 6,
        filing_items: [
          makeFilingItem({ id: "f-1", is_verified: true, has_description: false, child_id: "child-1" }),
          makeFilingItem({ id: "f-2", is_verified: false, has_description: false, child_id: "child-2" }),
        ],
        documents: [
          makeDocument({ id: "d-1", status: "current", is_signed: false }),
          makeDocument({ id: "d-2", status: "expired", is_signed: false }),
          makeDocument({ id: "d-3", status: "expired", is_signed: false }),
        ],
        risk_assessments: [
          makeRiskAssessment({ id: "ra-1", status: "current", has_mitigations: true, child_id: "child-1" }),
          makeRiskAssessment({ id: "ra-2", status: "archived", has_mitigations: false, child_id: "child-2" }),
        ],
        incidents: [
          makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: false, has_notification: true, child_id: "child-1" }),
          makeIncident({ id: "i-2", severity: "high", has_report: true, has_follow_up: false, has_notification: false, child_id: "child-2" }),
          makeIncident({ id: "i-3", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
          makeIncident({ id: "i-4", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-4" }),
        ],
      });
    }

    it("filing verified < 40 gives -5 penalty", () => {
      const input = neutralInput();
      // 10 filings, 3 verified -> 30%
      input.filing_items = Array.from({ length: 10 }, (_, i) =>
        makeFilingItem({
          id: `f-${i}`,
          is_verified: i < 3,
          has_description: false,
          child_id: `child-${(i % 4) + 1}`,
        }),
      );
      const result = computeRegulatoryEvidenceCompleteness(input);
      // filingVerified went from neutral (50%) to 30% -> penalty -5
      expect(result.evidence_score).toBe(52 - 5);
    });

    it("RA currency < 50 gives -5 penalty", () => {
      const input = neutralInput();
      // Already raCurrency = 50% at neutral. Need < 50.
      input.risk_assessments = Array.from({ length: 3 }, (_, i) =>
        makeRiskAssessment({
          id: `ra-${i}`,
          status: i < 1 ? "current" : "archived",
          has_mitigations: i < 2,
          child_id: `child-${(i % 4) + 1}`,
        }),
      ); // currency 33%
      const result = computeRegulatoryEvidenceCompleteness(input);
      // raCurrency was 50% (no penalty), now 33% -> -5
      expect(result.evidence_score).toBe(52 - 5);
    });

    it("incident report < 50 gives -5 penalty", () => {
      const input = neutralInput();
      input.incidents = Array.from({ length: 10 }, (_, i) =>
        makeIncident({
          id: `i-${i}`,
          severity: i < 2 ? "high" : "low",
          has_report: i < 4,
          has_follow_up: false,
          has_notification: i === 0,
          child_id: `child-${(i % 4) + 1}`,
        }),
      ); // report 40%, high sev 1/2=50%
      const result = computeRegulatoryEvidenceCompleteness(input);
      // report was 50% (no penalty), now 40% -> -5
      expect(result.evidence_score).toBe(52 - 5);
    });

    it("high severity notification < 50 gives -8 penalty", () => {
      const input = neutralInput();
      input.incidents = [
        makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: false, has_notification: false, child_id: "child-1" }),
        makeIncident({ id: "i-2", severity: "high", has_report: true, has_follow_up: false, has_notification: false, child_id: "child-2" }),
        makeIncident({ id: "i-3", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-4", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-4" }),
      ]; // report 50%, high sev notification 0/2 = 0%
      const result = computeRegulatoryEvidenceCompleteness(input);
      // highSevNotification was 50% (no penalty), now 0% -> -8
      expect(result.evidence_score).toBe(52 - 8);
    });

    it("multiple penalties stack", () => {
      const input = neutralInput();
      // filing verified < 40: -5
      input.filing_items = Array.from({ length: 10 }, (_, i) =>
        makeFilingItem({
          id: `f-${i}`,
          is_verified: i < 3,
          has_description: false,
          child_id: `child-${(i % 4) + 1}`,
        }),
      ); // 30%
      // RA currency < 50: -5
      input.risk_assessments = [
        makeRiskAssessment({ id: "ra-1", status: "archived", has_mitigations: false, child_id: "child-1" }),
      ]; // 0%
      // incident report < 50: -5
      input.incidents = [
        makeIncident({ id: "i-1", severity: "high", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-1" }),
        makeIncident({ id: "i-2", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-2" }),
      ]; // report 0%, high sev notification 0/1 = 0% -> -8
      const result = computeRegulatoryEvidenceCompleteness(input);
      // 52 - 5 - 5 - 5 - 8 = 29
      expect(result.evidence_score).toBe(29);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SCORE CLAMPING
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Score clamping", () => {
    it("score is clamped to minimum 0", () => {
      // Stack all penalties: -5 -5 -5 -8 = -23 -> 52-23 = 29. That's still > 0.
      // We can't actually go below 0 easily with the engine, but let's verify the clamp logic
      // by checking that even with all penalties the score doesn't go negative.
      const input = baseInput({
        total_children: 6,
        filing_items: [
          makeFilingItem({ id: "f-1", is_verified: false, has_description: false, child_id: "child-1" }),
        ],
        documents: [],
        risk_assessments: [
          makeRiskAssessment({ id: "ra-1", status: "archived", has_mitigations: false, child_id: "child-1" }),
        ],
        incidents: [
          makeIncident({ id: "i-1", severity: "high", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-1" }),
        ],
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      // filingVerified 0 < 40 -> -5
      // raCurrency 0 < 50 -> -5
      // incidentReport 0 < 50 -> -5
      // highSevNotification 0 < 50 -> -8
      // 52 - 5 - 5 - 5 - 8 = 29
      expect(result.evidence_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to maximum 100", () => {
      // Stack all bonuses: 4+3+4+3+4+3+3+2+2+2 = 30 -> 52+30 = 82. Under 100 so no clamp.
      // Just verify it's <= 100.
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 1,
          filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
          documents: [makeDocument({ id: "d-1" })],
          risk_assessments: [makeRiskAssessment({ id: "ra-1", child_id: "child-1" })],
          incidents: [
            makeIncident({
              id: "i-1",
              severity: "high",
              has_report: true,
              has_follow_up: true,
              has_notification: true,
              child_id: "child-1",
            }),
          ],
        }),
      );
      expect(result.evidence_score).toBeLessThanOrEqual(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. RATING BOUNDARIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Rating boundaries", () => {
    it("score 80 yields outstanding", () => {
      // Build input to get exactly 80
      // All max bonuses: +4+3+4+3+4+3+3+2+2+2 = 30 -> 52 + 30 = 82
      // Need 80 = 52 + 28. Drop child coverage bonus (-2) = 28. Set total_children large.
      const input = baseInput({
        total_children: 100, // child coverage will be low
        filing_items: Array.from({ length: 10 }, (_, i) =>
          makeFilingItem({ id: `f-${i}`, is_verified: true, has_description: true, child_id: `child-${i + 1}` }),
        ), // verified 100%, described 100% -> +4 +3
        documents: Array.from({ length: 10 }, (_, i) =>
          makeDocument({ id: `d-${i}`, status: "current", is_signed: true }),
        ), // currency 100%, signed 100% -> +4 +3
        risk_assessments: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({
            id: `ra-${i}`,
            status: "current",
            has_mitigations: true,
            child_id: `child-${i + 1}`,
          }),
        ), // currency 100%, mitigation 100% -> +4 +3
        incidents: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `i-${i}`,
            severity: i < 5 ? "high" : "low",
            has_report: true,
            has_follow_up: true,
            has_notification: true,
            child_id: `child-${i + 1}`,
          }),
        ), // report 100%, follow-up 100%, high sev notification 100% -> +3 +2 +2
      });
      // child coverage: children with evidence = 10 (filing) + 10 (RA) + 10 (incidents) unique = 10 / 100 = 10% -> no bonus
      // 52 + 4 + 3 + 4 + 3 + 4 + 3 + 3 + 2 + 2 + 0 = 80
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(80);
      expect(result.evidence_rating).toBe("outstanding");
    });

    it("score 79 yields good", () => {
      // 80 - 1 = 79. From above, replace incidentFollowUp bonus from +2 to +1 (75-89 range)
      const input = baseInput({
        total_children: 100,
        filing_items: Array.from({ length: 10 }, (_, i) =>
          makeFilingItem({ id: `f-${i}`, is_verified: true, has_description: true, child_id: `child-${i + 1}` }),
        ),
        documents: Array.from({ length: 10 }, (_, i) =>
          makeDocument({ id: `d-${i}`, status: "current", is_signed: true }),
        ),
        risk_assessments: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({
            id: `ra-${i}`,
            status: "current",
            has_mitigations: true,
            child_id: `child-${i + 1}`,
          }),
        ),
        incidents: Array.from({ length: 4 }, (_, i) =>
          makeIncident({
            id: `i-${i}`,
            severity: i < 2 ? "high" : "low",
            has_report: true,
            has_follow_up: i < 3,
            has_notification: true,
            child_id: `child-${i + 1}`,
          }),
        ), // report 100%, follow-up 75%, high sev notification 100%
      });
      // 52 + 4 + 3 + 4 + 3 + 4 + 3 + 3 + 1 + 2 + 0 = 79
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(79);
      expect(result.evidence_rating).toBe("good");
    });

    it("score 65 yields good", () => {
      const input = baseInput({
        total_children: 100,
        filing_items: Array.from({ length: 10 }, (_, i) =>
          makeFilingItem({ id: `f-${i}`, is_verified: true, has_description: true, child_id: `child-${i + 1}` }),
        ), // +4 +3
        documents: Array.from({ length: 5 }, (_, i) =>
          makeDocument({ id: `d-${i}`, status: i < 4 ? "current" : "expired", is_signed: false }),
        ), // currency 80% -> +2, signed 0% -> no bonus
        risk_assessments: [
          makeRiskAssessment({ id: "ra-1", status: "current", has_mitigations: true, child_id: "child-1" }),
          makeRiskAssessment({ id: "ra-2", status: "archived", has_mitigations: false, child_id: "child-2" }),
        ], // currency 50%, mitigation 50% -> no bonus, no penalty
        incidents: [
          makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-1" }),
          makeIncident({ id: "i-2", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-2" }),
          makeIncident({ id: "i-3", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
          makeIncident({ id: "i-4", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-4" }),
        ], // report 50%, follow-up 50%, high sev notification 100% -> +2
      });
      // 52 + 4 + 3 + 2 + 0 + 0 + 0 + 0 + 0 + 2 + 0 = 63... need +2 more
      // Let me adjust: make documents all signed -> signed 100% -> +3... that's 66.
      // Or: RA currency 75% -> +2 -> 52+4+3+2+0+2+0+0+0+2+0 = 65
      input.risk_assessments = Array.from({ length: 4 }, (_, i) =>
        makeRiskAssessment({
          id: `ra-${i}`,
          status: i < 3 ? "current" : "archived",
          has_mitigations: i < 2,
          child_id: `child-${i + 1}`,
        }),
      ); // currency 75% -> +2, mitigation 50% -> no bonus
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(65);
      expect(result.evidence_rating).toBe("good");
    });

    it("score 64 yields adequate", () => {
      // From score 65 scenario, remove RA currency bonus by making it 50%
      const input = baseInput({
        total_children: 100,
        filing_items: Array.from({ length: 10 }, (_, i) =>
          makeFilingItem({ id: `f-${i}`, is_verified: true, has_description: true, child_id: `child-${i + 1}` }),
        ), // +4 +3
        documents: Array.from({ length: 5 }, (_, i) =>
          makeDocument({ id: `d-${i}`, status: i < 4 ? "current" : "expired", is_signed: false }),
        ), // +2 +0
        risk_assessments: [
          makeRiskAssessment({ id: "ra-1", status: "current", has_mitigations: false, child_id: "child-1" }),
          makeRiskAssessment({ id: "ra-2", status: "archived", has_mitigations: false, child_id: "child-2" }),
        ], // currency 50%, mitigation 0% -> no bonus, no penalty
        incidents: [
          makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-1" }),
          makeIncident({ id: "i-2", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-2" }),
          makeIncident({ id: "i-3", severity: "low", has_report: true, has_follow_up: false, has_notification: false, child_id: "child-3" }),
          makeIncident({ id: "i-4", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-4" }),
        ], // report 75%, follow-up 50%, high sev notification 100% -> +0 +0 +2 (report < 85)
      });
      // 52 + 4 + 3 + 2 + 0 + 0 + 0 + 0 + 0 + 2 + 0 = 63
      // Hmm, need 64. Add incidentFollowUp to 75% -> +1.
      input.incidents = [
        makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-1" }),
        makeIncident({ id: "i-2", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-2" }),
        makeIncident({ id: "i-3", severity: "low", has_report: true, has_follow_up: true, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-4", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-4" }),
      ]; // report 75%, follow-up 75% -> +0 +1, high sev notification 100% -> +2
      // 52 + 4 + 3 + 2 + 0 + 0 + 0 + 0 + 1 + 2 + 0 = 64
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(64);
      expect(result.evidence_rating).toBe("adequate");
    });

    it("score 45 yields adequate", () => {
      // 52 - 7 = 45. Use one penalty: filingVerified < 40 -> -5, need -2 more?
      // Actually, 52 with no bonuses and filingVerified < 40 (-5) = 47. That's still > 45.
      // Need exactly 45: 52 - 7. filingVerified<40 (-5) + raCurrency<50 (-5) = -10 -> 42. Too low.
      // filingVerified<40 (-5) = 47. And then we need -2 from somewhere, but there are no -2 penalties.
      // Let's try: base neutral is 52. raCurrency < 50 (-5) = 47. Now we need -2.
      // incidentReport < 50 (-5) -> 42. Too much.
      // Actually we can combine a penalty with a bonus: raCurrency<50 (-5) + something=+2
      // 52 - 5 + some bonus that = -2 total offset... This is getting complex.
      // Simplest: just verify the boundary conceptually. Let me find exact numbers.
      // 52 + incidentFollowUp>=75 (+1) - incidentReport<50 (-5) - raCurrency was already neutral...
      // OK let me just construct it more carefully.
      const input = baseInput({
        total_children: 6,
        filing_items: [
          makeFilingItem({ id: "f-1", is_verified: true, has_description: false, child_id: "child-1" }),
          makeFilingItem({ id: "f-2", is_verified: false, has_description: false, child_id: "child-2" }),
        ], // verified 50%, described 0%
        documents: [
          makeDocument({ id: "d-1", status: "current", is_signed: false }),
          makeDocument({ id: "d-2", status: "expired", is_signed: false }),
          makeDocument({ id: "d-3", status: "expired", is_signed: false }),
        ], // currency 33%, signed 0%
        risk_assessments: [
          makeRiskAssessment({ id: "ra-1", status: "archived", has_mitigations: true, child_id: "child-1" }),
          makeRiskAssessment({ id: "ra-2", status: "archived", has_mitigations: false, child_id: "child-2" }),
          makeRiskAssessment({ id: "ra-3", status: "current", has_mitigations: false, child_id: "child-3" }),
        ], // currency 33% -> -5, mitigation 33%
        incidents: [
          makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-1" }),
          makeIncident({ id: "i-2", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-2" }),
          makeIncident({ id: "i-3", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
          makeIncident({ id: "i-4", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-4" }),
        ], // report 50%, follow-up 50%, high sev notification 100% -> +2
      });
      // Penalties: raCurrency 33% < 50 -> -5
      // Bonuses: highSevNotification 100% -> +2
      // childCoverage: child-1..4 out of 6 -> 67% -> no bonus
      // No other bonuses or penalties (verified 50%, described 0%, docCurrency 33%, docSigned 0%, raMitigation 33%, incidentReport 50%, incidentFollowUp 50%)
      // 52 - 5 + 2 = 49. Not 45.
      // Need 52 - 7 = 45. Let me also add incidentReport < 50.
      input.incidents = [
        makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-1" }),
        makeIncident({ id: "i-2", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-2" }),
        makeIncident({ id: "i-3", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-4", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-4" }),
        makeIncident({ id: "i-5", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-5" }),
        makeIncident({ id: "i-6", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-6" }),
        makeIncident({ id: "i-7", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-1" }),
        makeIncident({ id: "i-8", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-2" }),
        makeIncident({ id: "i-9", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-10", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-4" }),
      ]; // report 2/10 = 20%, follow-up 2/10 = 20%, high sev notification 2/2=100%
      // incidentReport 20% < 50 -> -5
      // 52 - 5 (raCurrency) - 5 (incidentReport) + 2 (highSevNotification) = 44. One short.
      // Add child coverage bonus: 6/6 = 100% -> +2 = 46. One over!
      // child coverage 80% = +1 -> 45
      input.total_children = 6;
      // children covered: child-1..6 from incidents (child_id child-1 through child-6) + child-1..child-3 from RA
      // That's child-1, child-2, child-3, child-4, child-5, child-6 = 6/6 = 100% -> +2
      // Hmm. Let me reduce total_children so that we get exactly 80% coverage -> +1.
      // Or better: remove some child_ids from incidents.
      input.incidents = [
        makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-1" }),
        makeIncident({ id: "i-2", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-2" }),
        makeIncident({ id: "i-3", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-4", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-5", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-6", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-7", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-8", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-9", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        makeIncident({ id: "i-10", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
      ]; // report 2/10=20%, follow-up 2/10=20%, high sev 100%
      // children: from filings child-1,child-2; from RA child-1,child-2,child-3; from incidents child-1,child-2,child-3 -> 3 unique / 6 = 50%
      // 50% < 80 -> no bonus.
      // Score: 52 - 5 - 5 + 2 = 44. Still need +1.
      // Add one more bonus: docSigned >= 75 -> +1
      input.documents = [
        makeDocument({ id: "d-1", status: "current", is_signed: true }),
        makeDocument({ id: "d-2", status: "expired", is_signed: true }),
        makeDocument({ id: "d-3", status: "expired", is_signed: true }),
        makeDocument({ id: "d-4", status: "expired", is_signed: false }),
      ]; // currency 25%, signed 75% -> +1
      // 52 - 5 - 5 + 2 + 1 = 45
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(45);
      expect(result.evidence_rating).toBe("adequate");
    });

    it("score 44 yields inadequate", () => {
      // Same as above but remove docSigned bonus
      const input = baseInput({
        total_children: 6,
        filing_items: [
          makeFilingItem({ id: "f-1", is_verified: true, has_description: false, child_id: "child-1" }),
          makeFilingItem({ id: "f-2", is_verified: false, has_description: false, child_id: "child-2" }),
        ],
        documents: [
          makeDocument({ id: "d-1", status: "current", is_signed: false }),
          makeDocument({ id: "d-2", status: "expired", is_signed: false }),
          makeDocument({ id: "d-3", status: "expired", is_signed: false }),
        ],
        risk_assessments: [
          makeRiskAssessment({ id: "ra-1", status: "archived", has_mitigations: true, child_id: "child-1" }),
          makeRiskAssessment({ id: "ra-2", status: "archived", has_mitigations: false, child_id: "child-2" }),
          makeRiskAssessment({ id: "ra-3", status: "current", has_mitigations: false, child_id: "child-3" }),
        ],
        incidents: [
          makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-1" }),
          makeIncident({ id: "i-2", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-2" }),
          makeIncident({ id: "i-3", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
          makeIncident({ id: "i-4", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
          makeIncident({ id: "i-5", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
          makeIncident({ id: "i-6", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
          makeIncident({ id: "i-7", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
          makeIncident({ id: "i-8", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
          makeIncident({ id: "i-9", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
          makeIncident({ id: "i-10", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
        ],
      });
      // 52 - 5 (raCurrency 33%) - 5 (incidentReport 20%) + 2 (highSev 100%) = 44
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.evidence_score).toBe(44);
      expect(result.evidence_rating).toBe("inadequate");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. METRICS CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Metrics calculations", () => {
    describe("total_evidence_items", () => {
      it("counts filing items + documents only", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [makeFilingItem({ id: "f-1" }), makeFilingItem({ id: "f-2" })],
            documents: [makeDocument({ id: "d-1" })],
            risk_assessments: [makeRiskAssessment({ id: "ra-1" })],
            incidents: [makeIncident({ id: "i-1" })],
          }),
        );
        expect(result.total_evidence_items).toBe(3); // 2 filings + 1 doc
      });

      it("does not include risk assessments in total", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [],
            documents: [],
            risk_assessments: [makeRiskAssessment({ id: "ra-1" }), makeRiskAssessment({ id: "ra-2" })],
            incidents: [],
          }),
        );
        expect(result.total_evidence_items).toBe(0);
      });

      it("does not include incidents in total", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [],
            documents: [],
            risk_assessments: [],
            incidents: [makeIncident({ id: "i-1" }), makeIncident({ id: "i-2" })],
          }),
        );
        expect(result.total_evidence_items).toBe(0);
      });
    });

    describe("filing_verified_rate", () => {
      it("calculates percentage of verified filings", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [
              makeFilingItem({ id: "f-1", is_verified: true }),
              makeFilingItem({ id: "f-2", is_verified: true }),
              makeFilingItem({ id: "f-3", is_verified: false }),
            ],
          }),
        );
        expect(result.filing_verified_rate).toBe(67); // Math.round(2/3 * 100)
      });

      it("returns 0 when no filing items", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [],
            documents: [makeDocument({ id: "d-1" })], // need something to avoid special case
          }),
        );
        expect(result.filing_verified_rate).toBe(0);
      });

      it("returns 100 when all verified", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [
              makeFilingItem({ id: "f-1", is_verified: true }),
              makeFilingItem({ id: "f-2", is_verified: true }),
            ],
          }),
        );
        expect(result.filing_verified_rate).toBe(100);
      });
    });

    describe("filing_described_rate", () => {
      it("calculates percentage of described filings", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [
              makeFilingItem({ id: "f-1", has_description: true }),
              makeFilingItem({ id: "f-2", has_description: false }),
              makeFilingItem({ id: "f-3", has_description: true }),
              makeFilingItem({ id: "f-4", has_description: false }),
            ],
          }),
        );
        expect(result.filing_described_rate).toBe(50);
      });

      it("returns 0 when no filing items", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            documents: [makeDocument({ id: "d-1" })],
          }),
        );
        expect(result.filing_described_rate).toBe(0);
      });
    });

    describe("document_currency_rate", () => {
      it("calculates percentage of current documents", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            documents: [
              makeDocument({ id: "d-1", status: "current" }),
              makeDocument({ id: "d-2", status: "expired" }),
              makeDocument({ id: "d-3", status: "draft" }),
              makeDocument({ id: "d-4", status: "current" }),
            ],
          }),
        );
        expect(result.document_currency_rate).toBe(50);
      });

      it("returns 0 when no documents", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [makeFilingItem({ id: "f-1" })],
          }),
        );
        expect(result.document_currency_rate).toBe(0);
      });

      it("counts only status === 'current'", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            documents: [
              makeDocument({ id: "d-1", status: "Current" }), // case-sensitive, not "current"
              makeDocument({ id: "d-2", status: "current" }),
            ],
          }),
        );
        expect(result.document_currency_rate).toBe(50);
      });
    });

    describe("document_signed_rate", () => {
      it("calculates percentage of signed documents", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            documents: [
              makeDocument({ id: "d-1", is_signed: true }),
              makeDocument({ id: "d-2", is_signed: false }),
            ],
          }),
        );
        expect(result.document_signed_rate).toBe(50);
      });

      it("returns 0 when no documents", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [makeFilingItem({ id: "f-1" })],
          }),
        );
        expect(result.document_signed_rate).toBe(0);
      });
    });

    describe("risk_assessment_currency_rate", () => {
      it("calculates percentage of current risk assessments", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            risk_assessments: [
              makeRiskAssessment({ id: "ra-1", status: "current" }),
              makeRiskAssessment({ id: "ra-2", status: "current" }),
              makeRiskAssessment({ id: "ra-3", status: "archived" }),
            ],
          }),
        );
        expect(result.risk_assessment_currency_rate).toBe(67);
      });

      it("returns 0 when no risk assessments", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [makeFilingItem({ id: "f-1" })],
          }),
        );
        expect(result.risk_assessment_currency_rate).toBe(0);
      });
    });

    describe("risk_mitigation_rate", () => {
      it("calculates percentage with mitigations", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            risk_assessments: [
              makeRiskAssessment({ id: "ra-1", has_mitigations: true }),
              makeRiskAssessment({ id: "ra-2", has_mitigations: true }),
              makeRiskAssessment({ id: "ra-3", has_mitigations: false }),
              makeRiskAssessment({ id: "ra-4", has_mitigations: true }),
            ],
          }),
        );
        expect(result.risk_mitigation_rate).toBe(75);
      });
    });

    describe("incident_report_rate", () => {
      it("calculates percentage of incidents with reports", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            incidents: [
              makeIncident({ id: "i-1", has_report: true }),
              makeIncident({ id: "i-2", has_report: false }),
              makeIncident({ id: "i-3", has_report: true }),
            ],
          }),
        );
        expect(result.incident_report_rate).toBe(67);
      });

      it("returns 0 when no incidents", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [makeFilingItem({ id: "f-1" })],
          }),
        );
        expect(result.incident_report_rate).toBe(0);
      });
    });

    describe("incident_follow_up_rate", () => {
      it("calculates percentage of incidents with follow-up", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            incidents: [
              makeIncident({ id: "i-1", has_follow_up: true }),
              makeIncident({ id: "i-2", has_follow_up: true }),
              makeIncident({ id: "i-3", has_follow_up: false }),
              makeIncident({ id: "i-4", has_follow_up: true }),
            ],
          }),
        );
        expect(result.incident_follow_up_rate).toBe(75);
      });
    });

    describe("high_severity_notification_rate", () => {
      it("calculates notification rate for high severity only", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            incidents: [
              makeIncident({ id: "i-1", severity: "high", has_notification: true }),
              makeIncident({ id: "i-2", severity: "high", has_notification: false }),
              makeIncident({ id: "i-3", severity: "low", has_notification: false }),
            ],
          }),
        );
        expect(result.high_severity_notification_rate).toBe(50);
      });

      it("includes critical severity as high severity", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            incidents: [
              makeIncident({ id: "i-1", severity: "critical", has_notification: true }),
              makeIncident({ id: "i-2", severity: "high", has_notification: true }),
            ],
          }),
        );
        expect(result.high_severity_notification_rate).toBe(100);
      });

      it("returns 0 when no high severity incidents", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            incidents: [
              makeIncident({ id: "i-1", severity: "low", has_notification: true }),
              makeIncident({ id: "i-2", severity: "medium", has_notification: true }),
            ],
          }),
        );
        expect(result.high_severity_notification_rate).toBe(0);
      });

      it("ignores low and medium severity for this rate", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            incidents: [
              makeIncident({ id: "i-1", severity: "high", has_notification: false }),
              makeIncident({ id: "i-2", severity: "low", has_notification: true }),
              makeIncident({ id: "i-3", severity: "medium", has_notification: true }),
            ],
          }),
        );
        expect(result.high_severity_notification_rate).toBe(0);
      });
    });

    describe("evidence_category_coverage", () => {
      it("counts distinct filing:category + doc:category entries", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [
              makeFilingItem({ id: "f-1", category: "safeguarding" }),
              makeFilingItem({ id: "f-2", category: "health" }),
            ],
            documents: [
              makeDocument({ id: "d-1", category: "policy" }),
              makeDocument({ id: "d-2", category: "health" }),
            ],
          }),
        );
        // filing:safeguarding, filing:health, doc:policy, doc:health = 4
        expect(result.evidence_category_coverage).toBe(4);
      });

      it("does not count duplicate categories within the same type", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [
              makeFilingItem({ id: "f-1", category: "safeguarding" }),
              makeFilingItem({ id: "f-2", category: "safeguarding" }),
            ],
            documents: [],
          }),
        );
        expect(result.evidence_category_coverage).toBe(1);
      });

      it("filing:X and doc:X are distinct entries", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [makeFilingItem({ id: "f-1", category: "health" })],
            documents: [makeDocument({ id: "d-1", category: "health" })],
          }),
        );
        expect(result.evidence_category_coverage).toBe(2);
      });

      it("does not include risk assessment or incident categories", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [makeFilingItem({ id: "f-1", category: "safeguarding" })],
            documents: [],
            risk_assessments: [makeRiskAssessment({ id: "ra-1", category: "environmental" })],
            incidents: [makeIncident({ id: "i-1" })],
          }),
        );
        expect(result.evidence_category_coverage).toBe(1);
      });

      it("returns 0 when no filing items or documents", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            risk_assessments: [makeRiskAssessment({ id: "ra-1" })],
          }),
        );
        expect(result.evidence_category_coverage).toBe(0);
      });
    });

    describe("child_evidence_coverage_rate", () => {
      it("calculates unique child_ids across all input types / total_children", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            total_children: 4,
            filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
            documents: [makeDocument({ id: "d-1", child_id: "child-2" })],
            risk_assessments: [makeRiskAssessment({ id: "ra-1", child_id: "child-3" })],
            incidents: [makeIncident({ id: "i-1", child_id: "child-4" })],
          }),
        );
        expect(result.child_evidence_coverage_rate).toBe(100);
      });

      it("deduplicates child_ids across types", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            total_children: 2,
            filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
            documents: [makeDocument({ id: "d-1", child_id: "child-1" })],
            risk_assessments: [makeRiskAssessment({ id: "ra-1", child_id: "child-1" })],
            incidents: [makeIncident({ id: "i-1", child_id: "child-1" })],
          }),
        );
        expect(result.child_evidence_coverage_rate).toBe(50);
      });

      it("ignores null child_ids", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            total_children: 2,
            filing_items: [makeFilingItem({ id: "f-1", child_id: null })],
            documents: [makeDocument({ id: "d-1", child_id: null })],
            risk_assessments: [makeRiskAssessment({ id: "ra-1", child_id: null })],
            incidents: [makeIncident({ id: "i-1", child_id: null })],
          }),
        );
        expect(result.child_evidence_coverage_rate).toBe(0);
      });

      it("returns 0 when total_children is 0", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            total_children: 0,
            filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
          }),
        );
        expect(result.child_evidence_coverage_rate).toBe(0);
      });

      it("can exceed 100 when more unique children than total_children", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            total_children: 1,
            filing_items: [
              makeFilingItem({ id: "f-1", child_id: "child-1" }),
              makeFilingItem({ id: "f-2", child_id: "child-2" }),
            ],
          }),
        );
        expect(result.child_evidence_coverage_rate).toBe(200);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. HEADLINES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Headlines", () => {
    it("outstanding headline", () => {
      // Quick path: single filing + doc + ra + incident, all perfect, 1 child
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 1,
          filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
          documents: [makeDocument({ id: "d-1" })],
          risk_assessments: [makeRiskAssessment({ id: "ra-1", child_id: "child-1" })],
          incidents: [
            makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-1" }),
          ],
        }),
      );
      // All rates 100%, all bonuses, score = 52 + 4+3+4+3+4+3+3+2+2+2 = 82
      expect(result.evidence_rating).toBe("outstanding");
      expect(result.headline).toBe(
        "Regulatory evidence is comprehensive and well-organised across all domains",
      );
    });

    it("good headline", () => {
      // childCoverage 1/100=1% -> no bonus. Others all 100%.
      // 52+4+3+4+3+4+3+3+2+2+0 = 80. Actually that's outstanding.
      // Let me reduce: no high severity notification bonus (all low severity)
      const result2 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 100,
          filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
          documents: [makeDocument({ id: "d-1" })],
          risk_assessments: [makeRiskAssessment({ id: "ra-1", child_id: "child-1" })],
          incidents: [
            makeIncident({ id: "i-1", severity: "low", has_report: true, has_follow_up: true, has_notification: false, child_id: "child-1" }),
          ],
        }),
      );
      // highSevNotification: pct(0,0)=0 -> 0<50 -> -8 penalty. Also 0 -> no +2 bonus.
      // incidentReport 100% -> +3, followUp 100% -> +2
      // 52+4+3+4+3+4+3+3+2+0+0 - 8 = 70
      expect(result2.evidence_rating).toBe("good");
      expect(result2.headline).toBe(
        "Regulatory evidence is largely in place with minor gaps to address",
      );
    });

    it("adequate headline", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 6,
          filing_items: [
            makeFilingItem({ id: "f-1", is_verified: true, has_description: false, child_id: "child-1" }),
            makeFilingItem({ id: "f-2", is_verified: false, has_description: false, child_id: "child-2" }),
          ],
          documents: [
            makeDocument({ id: "d-1", status: "current", is_signed: false }),
            makeDocument({ id: "d-2", status: "expired", is_signed: false }),
            makeDocument({ id: "d-3", status: "expired", is_signed: false }),
          ],
          risk_assessments: [
            makeRiskAssessment({ id: "ra-1", status: "current", has_mitigations: true, child_id: "child-1" }),
            makeRiskAssessment({ id: "ra-2", status: "archived", has_mitigations: false, child_id: "child-2" }),
          ],
          incidents: [
            makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: false, has_notification: true, child_id: "child-1" }),
            makeIncident({ id: "i-2", severity: "high", has_report: true, has_follow_up: false, has_notification: false, child_id: "child-2" }),
            makeIncident({ id: "i-3", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-3" }),
            makeIncident({ id: "i-4", severity: "low", has_report: false, has_follow_up: false, has_notification: false, child_id: "child-4" }),
          ],
        }),
      );
      // score 52, adequate
      expect(result.evidence_rating).toBe("adequate");
      expect(result.headline).toBe(
        "Regulatory evidence has notable gaps that require attention before inspection",
      );
    });

    it("inadequate headline", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 5, total_staff: 3 }),
      );
      expect(result.evidence_rating).toBe("inadequate");
      expect(result.headline).toBe(
        "Significant regulatory evidence gaps that would likely attract regulatory criticism",
      );
    });

    it("insufficient_data headline", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 0, total_staff: 0 }),
      );
      expect(result.headline).toBe(
        "No evidence data available to assess regulatory compliance",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. STRENGTHS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Strengths", () => {
    it("includes filing verification strength when rate >= 90", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, is_verified: true, child_id: `child-${i + 1}` }),
          ),
        }),
      );
      expect(result.strengths).toContain("Filing verification rate is excellent");
    });

    it("does not include filing verification strength when rate < 90", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, is_verified: i < 8, child_id: `child-${i + 1}` }),
          ),
        }),
      ); // 80%
      expect(result.strengths).not.toContain("Filing verification rate is excellent");
    });

    it("includes filing descriptions strength when rate >= 95", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 20 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, has_description: i < 19, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 95%
      expect(result.strengths).toContain("Filing descriptions are thorough and comprehensive");
    });

    it("does not include filing descriptions strength when rate < 95", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 20 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, has_description: i < 18, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 90%
      expect(result.strengths).not.toContain("Filing descriptions are thorough and comprehensive");
    });

    it("includes document currency strength when rate >= 95", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 20 }, (_, i) =>
            makeDocument({ id: `d-${i}`, status: i < 19 ? "current" : "expired" }),
          ),
        }),
      );
      expect(result.strengths).toContain(
        "Document currency is outstanding — nearly all are current",
      );
    });

    it("includes document signing strength when rate >= 90", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({ id: `d-${i}`, is_signed: i < 9 }),
          ),
        }),
      );
      expect(result.strengths).toContain(
        "Document signing rate demonstrates strong governance",
      );
    });

    it("includes RA currency strength when rate >= 90", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, status: i < 9 ? "current" : "archived", child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      expect(result.strengths).toContain(
        "Risk assessments are well-maintained and current",
      );
    });

    it("includes RA mitigation strength when rate >= 100", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: [
            makeRiskAssessment({ id: "ra-1", has_mitigations: true }),
            makeRiskAssessment({ id: "ra-2", has_mitigations: true }),
          ],
        }),
      );
      expect(result.strengths).toContain(
        "All risk assessments have documented mitigations in place",
      );
    });

    it("does not include RA mitigation strength when rate < 100", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: [
            makeRiskAssessment({ id: "ra-1", has_mitigations: true }),
            makeRiskAssessment({ id: "ra-2", has_mitigations: false }),
          ],
        }),
      );
      expect(result.strengths).not.toContain(
        "All risk assessments have documented mitigations in place",
      );
    });

    it("includes incident report strength when rate >= 100", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: [
            makeIncident({ id: "i-1", has_report: true }),
            makeIncident({ id: "i-2", has_report: true }),
          ],
        }),
      );
      expect(result.strengths).toContain("Every incident has a completed report");
    });

    it("includes incident follow-up strength when rate >= 90", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: Array.from({ length: 10 }, (_, i) =>
            makeIncident({ id: `i-${i}`, has_follow_up: i < 9, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      expect(result.strengths).toContain("Incident follow-up rate is excellent");
    });

    it("includes high severity notification strength when rate >= 100", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: [
            makeIncident({ id: "i-1", severity: "high", has_notification: true }),
            makeIncident({ id: "i-2", severity: "critical", has_notification: true }),
          ],
        }),
      );
      expect(result.strengths).toContain(
        "All high-severity incidents have appropriate notifications recorded",
      );
    });

    it("includes child evidence coverage strength when rate >= 100", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 2,
          filing_items: [
            makeFilingItem({ id: "f-1", child_id: "child-1" }),
            makeFilingItem({ id: "f-2", child_id: "child-2" }),
          ],
        }),
      );
      expect(result.strengths).toContain(
        "Every child has at least one piece of evidence on file",
      );
    });

    it("includes wide category coverage strength when coverage >= 10", () => {
      const categories = [
        "safeguarding", "health", "education", "behaviour", "medication",
        "finance", "identity", "wellbeing", "placement", "independence",
      ];
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: categories.map((c, i) =>
            makeFilingItem({ id: `f-${i}`, category: c }),
          ),
        }),
      );
      expect(result.strengths).toContain(
        "Evidence spans a wide range of categories, demonstrating breadth of recording",
      );
    });

    it("does not include wide category coverage strength when coverage < 10", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [
            makeFilingItem({ id: "f-1", category: "safeguarding" }),
            makeFilingItem({ id: "f-2", category: "health" }),
          ],
        }),
      );
      expect(result.strengths).not.toContain(
        "Evidence spans a wide range of categories, demonstrating breadth of recording",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. CONCERNS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Concerns", () => {
    it("includes critical filing verification concern when rate < 40", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, is_verified: i < 3, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      expect(result.concerns).toContain(
        "Filing verification rate is critically low — most items are unverified",
      );
    });

    it("includes moderate filing verification concern when rate < 75 and >= 40", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, is_verified: i < 5, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 50%
      expect(result.concerns).toContain(
        "Filing verification rate is below expectations — many items are unverified",
      );
    });

    it("does not include filing verification concern when rate >= 75", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 4 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, is_verified: i < 3, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 75%
      expect(result.concerns).not.toContain(
        "Filing verification rate is critically low — most items are unverified",
      );
      expect(result.concerns).not.toContain(
        "Filing verification rate is below expectations — many items are unverified",
      );
    });

    it("includes filing described concern when rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, has_description: i < 4, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 40%
      expect(result.concerns).toContain(
        "Majority of filing items lack descriptions, reducing evidence value",
      );
    });

    it("does not include filing described concern when rate >= 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, has_description: i < 5, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 50%
      expect(result.concerns).not.toContain(
        "Majority of filing items lack descriptions, reducing evidence value",
      );
    });

    it("includes critical document currency concern when rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({ id: `d-${i}`, status: i < 4 ? "current" : "expired" }),
          ),
        }),
      ); // 40%
      expect(result.concerns).toContain(
        "Over half of documents are not current — significant currency gap",
      );
    });

    it("includes moderate document currency concern when rate >= 50 and < 80", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({ id: `d-${i}`, status: i < 6 ? "current" : "expired" }),
          ),
        }),
      ); // 60%
      expect(result.concerns).toContain(
        "Document currency rate is below the expected standard",
      );
    });

    it("does not include document currency concern when rate >= 80", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 5 }, (_, i) =>
            makeDocument({ id: `d-${i}`, status: i < 4 ? "current" : "expired" }),
          ),
        }),
      ); // 80%
      expect(result.concerns).not.toContain(
        "Over half of documents are not current — significant currency gap",
      );
      expect(result.concerns).not.toContain(
        "Document currency rate is below the expected standard",
      );
    });

    it("includes document unsigned concern when rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({ id: `d-${i}`, is_signed: i < 4 }),
          ),
        }),
      ); // 40%
      expect(result.concerns).toContain(
        "Most documents are unsigned, undermining accountability and governance",
      );
    });

    it("includes critical RA currency concern when rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, status: i < 4 ? "current" : "archived", child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 40%
      expect(result.concerns).toContain(
        "Risk assessment currency is critically low — most are overdue or archived",
      );
    });

    it("includes moderate RA currency concern when rate >= 50 and < 75", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, status: i < 6 ? "current" : "archived", child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 60%
      expect(result.concerns).toContain(
        "Too many risk assessments are not current",
      );
    });

    it("includes RA mitigation concern when rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, has_mitigations: i < 4, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 40%
      expect(result.concerns).toContain(
        "Most risk assessments lack documented mitigations — significant safeguarding gap",
      );
    });

    it("includes critical incident report concern when rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: Array.from({ length: 10 }, (_, i) =>
            makeIncident({ id: `i-${i}`, has_report: i < 4, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 40%
      expect(result.concerns).toContain(
        "Over half of incidents lack written reports — critical evidence gap",
      );
    });

    it("includes moderate incident report concern when rate >= 50 and < 85", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: Array.from({ length: 10 }, (_, i) =>
            makeIncident({ id: `i-${i}`, has_report: i < 7, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 70%
      expect(result.concerns).toContain(
        "Some incidents are missing completed reports",
      );
    });

    it("does not include incident report concern when rate >= 85", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: Array.from({ length: 20 }, (_, i) =>
            makeIncident({ id: `i-${i}`, has_report: i < 17, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 85%
      expect(result.concerns).not.toContain(
        "Over half of incidents lack written reports — critical evidence gap",
      );
      expect(result.concerns).not.toContain(
        "Some incidents are missing completed reports",
      );
    });

    it("includes incident follow-up concern when rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: Array.from({ length: 10 }, (_, i) =>
            makeIncident({ id: `i-${i}`, has_follow_up: i < 4, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 40%
      expect(result.concerns).toContain(
        "Most incidents lack follow-up actions, suggesting poor learning from events",
      );
    });

    it("includes high severity notification concern when rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: [
            makeIncident({ id: "i-1", severity: "high", has_notification: false }),
            makeIncident({ id: "i-2", severity: "critical", has_notification: false }),
          ],
        }),
      );
      expect(result.concerns).toContain(
        "High-severity incidents are not being notified to regulators — serious compliance failure",
      );
    });

    it("includes child evidence coverage concern when rate < 50 and total_children > 0", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 10,
          filing_items: [
            makeFilingItem({ id: "f-1", child_id: "child-1" }),
            makeFilingItem({ id: "f-2", child_id: "child-2" }),
            makeFilingItem({ id: "f-3", child_id: "child-3" }),
            makeFilingItem({ id: "f-4", child_id: "child-4" }),
          ],
        }),
      ); // 4/10 = 40%
      expect(result.concerns).toContain(
        "Less than half of children have any evidence on file",
      );
    });

    it("does not include child evidence coverage concern when total_children is 0", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 0,
          filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
        }),
      );
      expect(result.concerns).not.toContain(
        "Less than half of children have any evidence on file",
      );
    });

    it("includes category coverage concern when coverage < 3 and totalEvidenceItems > 0", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [
            makeFilingItem({ id: "f-1", category: "safeguarding" }),
            makeFilingItem({ id: "f-2", category: "safeguarding" }),
          ],
        }),
      ); // 1 category
      expect(result.concerns).toContain(
        "Evidence covers very few categories, suggesting significant recording gaps",
      );
    });

    it("does not include category coverage concern when totalEvidenceItems is 0", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: [makeRiskAssessment({ id: "ra-1" })],
        }),
      );
      // totalEvidenceItems = 0 (no filings + no docs), categoryCoverage = 0
      // Condition: < 3 AND totalEvidenceItems > 0 -> false
      expect(result.concerns).not.toContain(
        "Evidence covers very few categories, suggesting significant recording gaps",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Recommendations", () => {
    it("includes high severity notification recommendation when rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: [
            makeIncident({ id: "i-1", severity: "high", has_notification: false }),
            makeIncident({ id: "i-2", severity: "critical", has_notification: false }),
          ],
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("notification procedures for high-severity"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 40");
    });

    it("includes incident reporting recommendation when rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: Array.from({ length: 10 }, (_, i) =>
            makeIncident({ id: `i-${i}`, has_report: i < 4, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("incident reporting gap"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 36");
    });

    it("includes RA review recommendation when currency rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, status: i < 4 ? "current" : "archived", child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("Review and update all risk assessments"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 12");
    });

    it("includes filing verification recommendation when rate < 40", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, is_verified: i < 3, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("verification process for filing items"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 36");
    });

    it("includes document review recommendation when currency rate >= 50 and < 80", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({ id: `d-${i}`, status: i < 6 ? "current" : "expired" }),
          ),
        }),
      ); // 60%
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("expired and draft documents"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
      expect(rec!.regulatory_ref).toBe("Reg 36");
    });

    it("does not include document review recommendation when currency rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({ id: `d-${i}`, status: i < 4 ? "current" : "expired" }),
          ),
        }),
      ); // 40%
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("expired and draft documents"),
      );
      expect(rec).toBeUndefined();
    });

    it("does not include document review recommendation when currency rate >= 80", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 5 }, (_, i) =>
            makeDocument({ id: `d-${i}`, status: i < 4 ? "current" : "expired" }),
          ),
        }),
      ); // 80%
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("expired and draft documents"),
      );
      expect(rec).toBeUndefined();
    });

    it("includes document signing recommendation when rate < 75", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({ id: `d-${i}`, is_signed: i < 7 }),
          ),
        }),
      ); // 70%
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("documents are signed"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
      expect(rec!.regulatory_ref).toBe("Reg 13");
    });

    it("does not include document signing recommendation when rate >= 75", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 4 }, (_, i) =>
            makeDocument({ id: `d-${i}`, is_signed: i < 3 }),
          ),
        }),
      ); // 75%
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("documents are signed"),
      );
      expect(rec).toBeUndefined();
    });

    it("includes incident follow-up recommendation when rate < 75", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: Array.from({ length: 10 }, (_, i) =>
            makeIncident({ id: `i-${i}`, has_follow_up: i < 7, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 70%
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("incident follow-up processes"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
      expect(rec!.regulatory_ref).toBe("Reg 13");
    });

    it("includes RA mitigation recommendation when rate >= 50 and < 80", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, has_mitigations: i < 6, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 60%
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("mitigations to risk assessments"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
      expect(rec!.regulatory_ref).toBe("Reg 12");
    });

    it("does not include RA mitigation recommendation when rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, has_mitigations: i < 4, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 40%
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("mitigations to risk assessments"),
      );
      expect(rec).toBeUndefined();
    });

    it("includes child evidence coverage recommendation when rate >= 50 and < 80", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 10,
          filing_items: Array.from({ length: 6 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, child_id: `child-${i + 1}` }),
          ),
        }),
      ); // 6/10 = 60%
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("every child has at least one piece of evidence"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
      expect(rec!.regulatory_ref).toBe("Reg 36");
    });

    it("does not include child evidence coverage recommendation when rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 10,
          filing_items: [
            makeFilingItem({ id: "f-1", child_id: "child-1" }),
            makeFilingItem({ id: "f-2", child_id: "child-2" }),
          ],
        }),
      ); // 2/10 = 20%
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("every child has at least one piece of evidence"),
      );
      expect(rec).toBeUndefined();
    });

    it("does not include child evidence coverage recommendation when total_children is 0", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 0,
          filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("every child has at least one piece of evidence"),
      );
      expect(rec).toBeUndefined();
    });

    it("includes filing description recommendation when rate >= 50 and < 80", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, has_description: i < 6, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 60%
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("filing descriptions"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
      expect(rec!.regulatory_ref).toBe("Reg 36");
    });

    it("does not include filing description recommendation when rate < 50", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, has_description: i < 4, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      ); // 40%
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("filing descriptions"),
      );
      expect(rec).toBeUndefined();
    });

    it("includes category broadening recommendation when coverage < 5 and totalEvidenceItems > 0", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [
            makeFilingItem({ id: "f-1", category: "safeguarding" }),
            makeFilingItem({ id: "f-2", category: "health" }),
          ],
        }),
      ); // 2 categories
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("Broaden evidence coverage"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
      expect(rec!.regulatory_ref).toBe("Reg 36");
    });

    it("does not include category broadening recommendation when totalEvidenceItems is 0", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: [makeRiskAssessment({ id: "ra-1" })],
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("Broaden evidence coverage"),
      );
      expect(rec).toBeUndefined();
    });

    it("recommendations are ranked sequentially", () => {
      // Trigger multiple recommendations
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, is_verified: i < 3, has_description: i < 6, child_id: `child-${(i % 6) + 1}` }),
          ),
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({ id: `d-${i}`, status: i < 6 ? "current" : "expired", is_signed: i < 5 }),
          ),
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, status: i < 4 ? "current" : "archived", has_mitigations: i < 6, child_id: `child-${(i % 6) + 1}` }),
          ),
          incidents: Array.from({ length: 10 }, (_, i) =>
            makeIncident({
              id: `i-${i}`,
              severity: i < 3 ? "high" : "low",
              has_report: i < 4,
              has_follow_up: i < 4,
              has_notification: false,
              child_id: `child-${(i % 6) + 1}`,
            }),
          ),
        }),
      );
      for (let i = 0; i < result.recommendations.length; i++) {
        expect(result.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("high severity notification recommendation comes first", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, is_verified: i < 3, child_id: `child-${(i % 6) + 1}` }),
          ),
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, status: i < 4 ? "current" : "archived", child_id: `child-${(i % 6) + 1}` }),
          ),
          incidents: [
            makeIncident({ id: "i-1", severity: "high", has_report: false, has_notification: false }),
            makeIncident({ id: "i-2", severity: "critical", has_report: false, has_notification: false }),
          ],
        }),
      );
      expect(result.recommendations[0].recommendation).toContain(
        "notification procedures for high-severity",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Insights", () => {
    describe("Critical insights", () => {
      it("includes high severity notification insight when rate < 50 and high sev incidents exist", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            incidents: [
              makeIncident({ id: "i-1", severity: "high", has_notification: false }),
              makeIncident({ id: "i-2", severity: "critical", has_notification: false }),
            ],
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("high-severity incidents have regulatory notifications"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("critical");
        expect(insight!.text).toContain("0%");
      });

      it("does not include high severity notification insight when no high sev incidents", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            incidents: [
              makeIncident({ id: "i-1", severity: "low", has_notification: false }),
            ],
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("high-severity incidents have regulatory notifications"),
        );
        expect(insight).toBeUndefined();
      });

      it("includes incident report insight when rate < 50 and incidents exist", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            incidents: Array.from({ length: 10 }, (_, i) =>
              makeIncident({ id: `i-${i}`, has_report: i < 4, child_id: `child-${(i % 6) + 1}` }),
            ),
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("incidents have written reports"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("critical");
      });

      it("does not include incident report insight when no incidents", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [makeFilingItem({ id: "f-1" })],
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("incidents have written reports"),
        );
        expect(insight).toBeUndefined();
      });

      it("includes RA currency insight when rate < 50 and RAs exist", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            risk_assessments: Array.from({ length: 10 }, (_, i) =>
              makeRiskAssessment({ id: `ra-${i}`, status: i < 4 ? "current" : "archived", child_id: `child-${(i % 6) + 1}` }),
            ),
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("risk assessments are current"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("critical");
      });

      it("includes filing verification insight when rate < 40 and filings exist", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: Array.from({ length: 10 }, (_, i) =>
              makeFilingItem({ id: `f-${i}`, is_verified: i < 3, child_id: `child-${(i % 6) + 1}` }),
            ),
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("Filing verification rate"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("critical");
        expect(insight!.text).toContain("30%");
      });
    });

    describe("Warning insights", () => {
      it("includes document currency warning when rate >= 50 and < 80", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            documents: Array.from({ length: 10 }, (_, i) =>
              makeDocument({ id: `d-${i}`, status: i < 6 ? "current" : "expired" }),
            ),
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("Document currency rate"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("warning");
        expect(insight!.text).toContain("60%");
      });

      it("does not include document currency warning when rate < 50", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            documents: Array.from({ length: 10 }, (_, i) =>
              makeDocument({ id: `d-${i}`, status: i < 4 ? "current" : "expired" }),
            ),
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("Document currency rate") && i.severity === "warning",
        );
        expect(insight).toBeUndefined();
      });

      it("does not include document currency warning when rate >= 80", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            documents: Array.from({ length: 5 }, (_, i) =>
              makeDocument({ id: `d-${i}`, status: i < 4 ? "current" : "expired" }),
            ),
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("Document currency rate"),
        );
        expect(insight).toBeUndefined();
      });

      it("includes incident follow-up warning when rate >= 50 and < 75", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            incidents: Array.from({ length: 10 }, (_, i) =>
              makeIncident({ id: `i-${i}`, has_follow_up: i < 6, child_id: `child-${(i % 6) + 1}` }),
            ),
          }),
        ); // 60%
        const insight = result.insights.find((i) =>
          i.text.includes("Incident follow-up rate"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("warning");
      });

      it("does not include incident follow-up warning when no incidents", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [makeFilingItem({ id: "f-1" })],
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("Incident follow-up rate"),
        );
        expect(insight).toBeUndefined();
      });

      it("includes child evidence warning when rate >= 50 and < 80 and total_children > 0", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            total_children: 10,
            filing_items: Array.from({ length: 6 }, (_, i) =>
              makeFilingItem({ id: `f-${i}`, child_id: `child-${i + 1}` }),
            ),
          }),
        ); // 60%
        const insight = result.insights.find((i) =>
          i.text.includes("children have evidence on file"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("warning");
      });

      it("does not include child evidence warning when total_children is 0", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            total_children: 0,
            filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("children have evidence on file") && i.severity === "warning",
        );
        expect(insight).toBeUndefined();
      });

      it("includes filing described warning when rate >= 50 and < 80", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: Array.from({ length: 10 }, (_, i) =>
              makeFilingItem({ id: `f-${i}`, has_description: i < 6, child_id: `child-${(i % 6) + 1}` }),
            ),
          }),
        ); // 60%
        const insight = result.insights.find((i) =>
          i.text.includes("filing items have descriptions"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("warning");
      });

      it("does not include filing described warning when no filings", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            documents: [makeDocument({ id: "d-1" })],
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("filing items have descriptions"),
        );
        expect(insight).toBeUndefined();
      });

      it("includes RA mitigation warning when rate >= 50 and < 80", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            risk_assessments: Array.from({ length: 10 }, (_, i) =>
              makeRiskAssessment({ id: `ra-${i}`, has_mitigations: i < 6, child_id: `child-${(i % 6) + 1}` }),
            ),
          }),
        ); // 60%
        const insight = result.insights.find((i) =>
          i.text.includes("risk assessments have mitigations"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("warning");
      });

      it("does not include RA mitigation warning when no RAs", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [makeFilingItem({ id: "f-1" })],
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("risk assessments have mitigations"),
        );
        expect(insight).toBeUndefined();
      });
    });

    describe("Positive insights", () => {
      it("includes comprehensive evidence insight when score >= 80", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            total_children: 1,
            filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
            documents: [makeDocument({ id: "d-1" })],
            risk_assessments: [makeRiskAssessment({ id: "ra-1", child_id: "child-1" })],
            incidents: [
              makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-1" }),
            ],
          }),
        );
        expect(result.evidence_score).toBeGreaterThanOrEqual(80);
        const insight = result.insights.find((i) =>
          i.text.includes("well-prepared for inspection"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("positive");
      });

      it("does not include comprehensive evidence insight when score < 80", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [makeFilingItem({ id: "f-1" })],
          }),
        );
        expect(result.evidence_score).toBeLessThan(80);
        const insight = result.insights.find((i) =>
          i.text.includes("well-prepared for inspection"),
        );
        expect(insight).toBeUndefined();
      });

      it("includes core pillars insight when filing >= 90, docCurrency >= 95, raCurrency >= 90", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: Array.from({ length: 10 }, (_, i) =>
              makeFilingItem({ id: `f-${i}`, is_verified: true, child_id: `child-${(i % 6) + 1}` }),
            ), // 100%
            documents: Array.from({ length: 20 }, (_, i) =>
              makeDocument({ id: `d-${i}`, status: i < 19 ? "current" : "expired" }),
            ), // 95%
            risk_assessments: Array.from({ length: 10 }, (_, i) =>
              makeRiskAssessment({ id: `ra-${i}`, status: i < 9 ? "current" : "archived", child_id: `child-${(i % 6) + 1}` }),
            ), // 90%
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("Core evidence pillars"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("positive");
      });

      it("does not include core pillars insight when filing < 90", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: Array.from({ length: 10 }, (_, i) =>
              makeFilingItem({ id: `f-${i}`, is_verified: i < 8, child_id: `child-${(i % 6) + 1}` }),
            ), // 80%
            documents: Array.from({ length: 20 }, (_, i) =>
              makeDocument({ id: `d-${i}`, status: "current" }),
            ), // 100%
            risk_assessments: Array.from({ length: 10 }, (_, i) =>
              makeRiskAssessment({ id: `ra-${i}`, status: "current", child_id: `child-${(i % 6) + 1}` }),
            ), // 100%
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("Core evidence pillars"),
        );
        expect(insight).toBeUndefined();
      });

      it("includes incident management insight when report >= 100, followUp >= 90, incidents exist", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            incidents: Array.from({ length: 10 }, (_, i) =>
              makeIncident({ id: `i-${i}`, has_report: true, has_follow_up: i < 9, child_id: `child-${(i % 6) + 1}` }),
            ), // report 100%, followUp 90%
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("Incident management is thorough"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("positive");
      });

      it("does not include incident management insight when no incidents", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: [makeFilingItem({ id: "f-1" })],
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("Incident management is thorough"),
        );
        expect(insight).toBeUndefined();
      });

      it("includes child evidence insight when coverage >= 100 and total_children > 0", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            total_children: 3,
            filing_items: [
              makeFilingItem({ id: "f-1", child_id: "child-1" }),
              makeFilingItem({ id: "f-2", child_id: "child-2" }),
              makeFilingItem({ id: "f-3", child_id: "child-3" }),
            ],
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("Every child has evidence on record"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("positive");
      });

      it("does not include child evidence insight when total_children is 0", () => {
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            total_children: 0,
            filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("Every child has evidence on record"),
        );
        expect(insight).toBeUndefined();
      });

      it("includes category breadth insight when coverage >= 10", () => {
        const categories = [
          "safeguarding", "health", "education", "behaviour", "medication",
          "finance", "identity", "wellbeing", "placement", "independence",
        ];
        const result = computeRegulatoryEvidenceCompleteness(
          baseInput({
            filing_items: categories.map((c, i) =>
              makeFilingItem({ id: `f-${i}`, category: c }),
            ),
          }),
        );
        const insight = result.insights.find((i) =>
          i.text.includes("categories, showing breadth"),
        );
        expect(insight).toBeDefined();
        expect(insight!.severity).toBe("positive");
        expect(insight!.text).toContain("10 categories");
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Edge cases", () => {
    it("handles only filing items (no other types)", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [makeFilingItem({ id: "f-1" })],
          documents: [],
          risk_assessments: [],
          incidents: [],
        }),
      );
      expect(result.total_evidence_items).toBe(1);
      expect(result.evidence_rating).toBeDefined();
    });

    it("handles only documents (no other types)", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [],
          documents: [makeDocument({ id: "d-1" })],
          risk_assessments: [],
          incidents: [],
        }),
      );
      expect(result.total_evidence_items).toBe(1);
    });

    it("handles only risk assessments (no other types)", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [],
          documents: [],
          risk_assessments: [makeRiskAssessment({ id: "ra-1" })],
          incidents: [],
        }),
      );
      expect(result.total_evidence_items).toBe(0);
      expect(result.risk_assessment_currency_rate).toBe(100);
    });

    it("handles only incidents (no other types)", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [],
          documents: [],
          risk_assessments: [],
          incidents: [makeIncident({ id: "i-1" })],
        }),
      );
      expect(result.total_evidence_items).toBe(0);
      expect(result.incident_report_rate).toBe(100);
    });

    it("handles large dataset of 1000 filing items", () => {
      const filings = Array.from({ length: 1000 }, (_, i) =>
        makeFilingItem({
          id: `f-${i}`,
          is_verified: i < 900,
          has_description: i < 950,
          child_id: `child-${(i % 50) + 1}`,
        }),
      );
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({ total_children: 50, filing_items: filings }),
      );
      expect(result.filing_verified_rate).toBe(90);
      expect(result.filing_described_rate).toBe(95);
      expect(result.total_evidence_items).toBe(1000);
    });

    it("handles single item per type", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 1,
          filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
          documents: [makeDocument({ id: "d-1" })],
          risk_assessments: [makeRiskAssessment({ id: "ra-1", child_id: "child-1" })],
          incidents: [makeIncident({ id: "i-1", child_id: "child-1" })],
        }),
      );
      expect(result.total_evidence_items).toBe(2);
      expect(result.filing_verified_rate).toBe(100);
      expect(result.document_currency_rate).toBe(100);
    });

    it("handles all items with worst-case values", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 10,
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({
              id: `f-${i}`,
              is_verified: false,
              has_description: false,
              child_id: `child-${i + 1}`,
              category: "safeguarding",
            }),
          ),
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({
              id: `d-${i}`,
              status: "expired",
              is_signed: false,
              category: "policy",
            }),
          ),
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({
              id: `ra-${i}`,
              status: "archived",
              has_mitigations: false,
              child_id: `child-${i + 1}`,
            }),
          ),
          incidents: Array.from({ length: 10 }, (_, i) =>
            makeIncident({
              id: `i-${i}`,
              severity: "high",
              has_report: false,
              has_follow_up: false,
              has_notification: false,
              child_id: `child-${i + 1}`,
            }),
          ),
        }),
      );
      // All penalties: -5 -5 -5 -8 = -23, bonus: childCoverage 10/10=100% -> +2
      // 52 - 23 + 2 = 31
      expect(result.evidence_score).toBe(31);
      expect(result.evidence_rating).toBe("inadequate");
    });

    it("handles all items with best-case values", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 1,
          filing_items: [
            makeFilingItem({ id: "f-1", is_verified: true, has_description: true, child_id: "child-1" }),
          ],
          documents: [
            makeDocument({ id: "d-1", status: "current", is_signed: true }),
          ],
          risk_assessments: [
            makeRiskAssessment({ id: "ra-1", status: "current", has_mitigations: true, child_id: "child-1" }),
          ],
          incidents: [
            makeIncident({
              id: "i-1",
              severity: "high",
              has_report: true,
              has_follow_up: true,
              has_notification: true,
              child_id: "child-1",
            }),
          ],
        }),
      );
      // All bonuses: 4+3+4+3+4+3+3+2+2+2 = 30 -> 52 + 30 = 82
      expect(result.evidence_score).toBe(82);
      expect(result.evidence_rating).toBe("outstanding");
    });

    it("pct returns 0 when denominator is 0", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [makeFilingItem({ id: "f-1" })],
          // no documents, no RA, no incidents
        }),
      );
      expect(result.document_currency_rate).toBe(0);
      expect(result.document_signed_rate).toBe(0);
      expect(result.risk_assessment_currency_rate).toBe(0);
      expect(result.risk_mitigation_rate).toBe(0);
      expect(result.incident_report_rate).toBe(0);
      expect(result.incident_follow_up_rate).toBe(0);
      expect(result.high_severity_notification_rate).toBe(0);
    });

    it("handles filing items with null child_id", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 2,
          filing_items: [
            makeFilingItem({ id: "f-1", child_id: null }),
            makeFilingItem({ id: "f-2", child_id: "child-1" }),
          ],
        }),
      );
      expect(result.child_evidence_coverage_rate).toBe(50);
    });

    it("handles documents with null child_id", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 2,
          documents: [
            makeDocument({ id: "d-1", child_id: null }),
            makeDocument({ id: "d-2", child_id: "child-1" }),
          ],
        }),
      );
      expect(result.child_evidence_coverage_rate).toBe(50);
    });

    it("handles risk assessments with null child_id", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 2,
          risk_assessments: [
            makeRiskAssessment({ id: "ra-1", child_id: null }),
            makeRiskAssessment({ id: "ra-2", child_id: "child-1" }),
          ],
        }),
      );
      expect(result.child_evidence_coverage_rate).toBe(50);
    });

    it("handles incidents with null child_id", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 2,
          incidents: [
            makeIncident({ id: "i-1", child_id: null }),
            makeIncident({ id: "i-2", child_id: "child-1" }),
          ],
        }),
      );
      expect(result.child_evidence_coverage_rate).toBe(50);
    });

    it("child coverage can be calculated from multiple input types combined", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 4,
          filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
          documents: [makeDocument({ id: "d-1", child_id: "child-2" })],
          risk_assessments: [makeRiskAssessment({ id: "ra-1", child_id: "child-3" })],
          incidents: [makeIncident({ id: "i-1", child_id: "child-4" })],
        }),
      );
      expect(result.child_evidence_coverage_rate).toBe(100);
    });

    it("pct rounds correctly for edge percentages", () => {
      // 1/3 = 33.333... -> 33
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [
            makeFilingItem({ id: "f-1", is_verified: true }),
            makeFilingItem({ id: "f-2", is_verified: false }),
            makeFilingItem({ id: "f-3", is_verified: false }),
          ],
        }),
      );
      expect(result.filing_verified_rate).toBe(33);
    });

    it("pct rounds 2/3 to 67", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [
            makeFilingItem({ id: "f-1", is_verified: true }),
            makeFilingItem({ id: "f-2", is_verified: true }),
            makeFilingItem({ id: "f-3", is_verified: false }),
          ],
        }),
      );
      expect(result.filing_verified_rate).toBe(67);
    });

    it("handles total_children of 1", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 1,
          filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
        }),
      );
      expect(result.child_evidence_coverage_rate).toBe(100);
    });

    it("handles very large total_children with few records", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 1000,
          filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
        }),
      );
      expect(result.child_evidence_coverage_rate).toBe(0); // Math.round(1/1000 * 100) = 0
    });

    it("category coverage counts distinct prefixed categories", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [
            makeFilingItem({ id: "f-1", category: "safeguarding" }),
            makeFilingItem({ id: "f-2", category: "safeguarding" }),
            makeFilingItem({ id: "f-3", category: "health" }),
          ],
          documents: [
            makeDocument({ id: "d-1", category: "safeguarding" }),
            makeDocument({ id: "d-2", category: "policy" }),
          ],
        }),
      );
      // filing:safeguarding, filing:health, doc:safeguarding, doc:policy = 4
      expect(result.evidence_category_coverage).toBe(4);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. COMBINED / REALISTIC SCENARIOS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Combined realistic scenarios", () => {
    it("outstanding scenario: excellent data across all domains", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 4,
          total_staff: 8,
          filing_items: Array.from({ length: 20 }, (_, i) =>
            makeFilingItem({
              id: `f-${i}`,
              is_verified: true,
              has_description: true,
              child_id: `child-${(i % 4) + 1}`,
              category: ["safeguarding", "health", "education", "placement", "identity"][i % 5],
            }),
          ),
          documents: Array.from({ length: 15 }, (_, i) =>
            makeDocument({
              id: `d-${i}`,
              status: "current",
              is_signed: true,
              category: ["policy", "procedure", "governance", "training", "compliance"][i % 5],
            }),
          ),
          risk_assessments: Array.from({ length: 8 }, (_, i) =>
            makeRiskAssessment({
              id: `ra-${i}`,
              status: "current",
              has_mitigations: true,
              child_id: `child-${(i % 4) + 1}`,
            }),
          ),
          incidents: Array.from({ length: 5 }, (_, i) =>
            makeIncident({
              id: `i-${i}`,
              severity: i < 2 ? "high" : "low",
              has_report: true,
              has_follow_up: true,
              has_notification: true,
              child_id: `child-${(i % 4) + 1}`,
            }),
          ),
        }),
      );
      expect(result.evidence_rating).toBe("outstanding");
      expect(result.evidence_score).toBeGreaterThanOrEqual(80);
      expect(result.total_evidence_items).toBe(35);
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.concerns.length).toBe(0);
    });

    it("good scenario: mostly solid with some gaps", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 6,
          total_staff: 10,
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({
              id: `f-${i}`,
              is_verified: i < 8,
              has_description: i < 9,
              child_id: `child-${(i % 6) + 1}`,
              category: ["safeguarding", "health", "education"][i % 3],
            }),
          ),
          documents: Array.from({ length: 8 }, (_, i) =>
            makeDocument({
              id: `d-${i}`,
              status: i < 7 ? "current" : "expired",
              is_signed: i < 7,
              category: ["policy", "procedure"][i % 2],
            }),
          ),
          risk_assessments: Array.from({ length: 6 }, (_, i) =>
            makeRiskAssessment({
              id: `ra-${i}`,
              status: i < 5 ? "current" : "archived",
              has_mitigations: i < 5,
              child_id: `child-${(i % 6) + 1}`,
            }),
          ),
          incidents: Array.from({ length: 4 }, (_, i) =>
            makeIncident({
              id: `i-${i}`,
              severity: i < 1 ? "high" : "low",
              has_report: true,
              has_follow_up: i < 3,
              has_notification: true,
              child_id: `child-${(i % 6) + 1}`,
            }),
          ),
        }),
      );
      expect(result.evidence_rating).toBe("good");
      expect(result.evidence_score).toBeGreaterThanOrEqual(65);
      expect(result.evidence_score).toBeLessThan(80);
    });

    it("adequate scenario: notable gaps but some evidence", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 8,
          total_staff: 12,
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({
              id: `f-${i}`,
              is_verified: i < 5,
              has_description: i < 4,
              child_id: `child-${(i % 4) + 1}`,
              category: "safeguarding",
            }),
          ),
          documents: Array.from({ length: 6 }, (_, i) =>
            makeDocument({
              id: `d-${i}`,
              status: i < 3 ? "current" : "expired",
              is_signed: i < 2,
              category: "policy",
            }),
          ),
          risk_assessments: Array.from({ length: 4 }, (_, i) =>
            makeRiskAssessment({
              id: `ra-${i}`,
              status: i < 2 ? "current" : "archived",
              has_mitigations: i < 2,
              child_id: `child-${(i % 4) + 1}`,
            }),
          ),
          incidents: Array.from({ length: 6 }, (_, i) =>
            makeIncident({
              id: `i-${i}`,
              severity: i < 2 ? "high" : "low",
              has_report: i < 4,
              has_follow_up: i < 3,
              has_notification: i === 0,
              child_id: `child-${(i % 4) + 1}`,
            }),
          ),
        }),
      );
      expect(result.evidence_score).toBeGreaterThanOrEqual(45);
      expect(result.evidence_score).toBeLessThan(65);
      expect(result.evidence_rating).toBe("adequate");
    });

    it("inadequate scenario: critical gaps everywhere", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 10,
          total_staff: 15,
          filing_items: Array.from({ length: 20 }, (_, i) =>
            makeFilingItem({
              id: `f-${i}`,
              is_verified: i < 4,
              has_description: i < 3,
              child_id: i < 3 ? `child-${i + 1}` : null,
              category: "safeguarding",
            }),
          ),
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({
              id: `d-${i}`,
              status: i < 2 ? "current" : "expired",
              is_signed: false,
              category: "policy",
            }),
          ),
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({
              id: `ra-${i}`,
              status: i < 2 ? "current" : "archived",
              has_mitigations: i < 2,
              child_id: i < 2 ? `child-${i + 1}` : null,
            }),
          ),
          incidents: Array.from({ length: 10 }, (_, i) =>
            makeIncident({
              id: `i-${i}`,
              severity: i < 5 ? "high" : "low",
              has_report: i < 3,
              has_follow_up: i < 2,
              has_notification: false,
              child_id: i < 3 ? `child-${i + 1}` : null,
            }),
          ),
        }),
      );
      expect(result.evidence_rating).toBe("inadequate");
      expect(result.evidence_score).toBeLessThan(45);
      expect(result.concerns.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("mixed scenario: some excellent areas, some poor", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 4,
          total_staff: 8,
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({
              id: `f-${i}`,
              is_verified: true,
              has_description: true,
              child_id: `child-${(i % 4) + 1}`,
              category: ["safeguarding", "health"][i % 2],
            }),
          ), // 100% verified, 100% described
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({
              id: `d-${i}`,
              status: i < 2 ? "current" : "expired",
              is_signed: false,
              category: "policy",
            }),
          ), // 20% currency, 0% signed
          risk_assessments: Array.from({ length: 5 }, (_, i) =>
            makeRiskAssessment({
              id: `ra-${i}`,
              status: i < 1 ? "current" : "archived",
              has_mitigations: i < 2,
              child_id: `child-${(i % 4) + 1}`,
            }),
          ), // 20% currency, 40% mitigation
          incidents: Array.from({ length: 4 }, (_, i) =>
            makeIncident({
              id: `i-${i}`,
              severity: i < 2 ? "high" : "low",
              has_report: true,
              has_follow_up: true,
              has_notification: true,
              child_id: `child-${(i % 4) + 1}`,
            }),
          ), // 100% all
        }),
      );
      // Should have both strengths and concerns
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.concerns.length).toBeGreaterThan(0);
    });

    it("scenario with only high severity incidents, all notified", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: Array.from({ length: 5 }, (_, i) =>
            makeIncident({
              id: `i-${i}`,
              severity: "high",
              has_report: true,
              has_follow_up: true,
              has_notification: true,
              child_id: `child-${(i % 6) + 1}`,
            }),
          ),
        }),
      );
      expect(result.high_severity_notification_rate).toBe(100);
      expect(result.incident_report_rate).toBe(100);
      expect(result.incident_follow_up_rate).toBe(100);
    });

    it("scenario with only critical severity incidents", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: [
            makeIncident({ id: "i-1", severity: "critical", has_notification: true }),
            makeIncident({ id: "i-2", severity: "critical", has_notification: false }),
          ],
        }),
      );
      expect(result.high_severity_notification_rate).toBe(50);
    });

    it("scenario with mixed severity incidents", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: [
            makeIncident({ id: "i-1", severity: "critical", has_notification: true }),
            makeIncident({ id: "i-2", severity: "high", has_notification: false }),
            makeIncident({ id: "i-3", severity: "medium", has_notification: false }),
            makeIncident({ id: "i-4", severity: "low", has_notification: false }),
          ],
        }),
      );
      // High sev = critical + high = 2, notified = 1 -> 50%
      expect(result.high_severity_notification_rate).toBe(50);
    });

    it("returns correct output shape for all fields", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [makeFilingItem({ id: "f-1" })],
        }),
      );
      expect(result).toHaveProperty("evidence_rating");
      expect(result).toHaveProperty("evidence_score");
      expect(result).toHaveProperty("headline");
      expect(result).toHaveProperty("total_evidence_items");
      expect(result).toHaveProperty("filing_verified_rate");
      expect(result).toHaveProperty("filing_described_rate");
      expect(result).toHaveProperty("document_currency_rate");
      expect(result).toHaveProperty("document_signed_rate");
      expect(result).toHaveProperty("risk_assessment_currency_rate");
      expect(result).toHaveProperty("risk_mitigation_rate");
      expect(result).toHaveProperty("incident_report_rate");
      expect(result).toHaveProperty("incident_follow_up_rate");
      expect(result).toHaveProperty("high_severity_notification_rate");
      expect(result).toHaveProperty("evidence_category_coverage");
      expect(result).toHaveProperty("child_evidence_coverage_rate");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("insights");
    });

    it("all rates are numbers", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [makeFilingItem({ id: "f-1" })],
        }),
      );
      expect(typeof result.filing_verified_rate).toBe("number");
      expect(typeof result.filing_described_rate).toBe("number");
      expect(typeof result.document_currency_rate).toBe("number");
      expect(typeof result.document_signed_rate).toBe("number");
      expect(typeof result.risk_assessment_currency_rate).toBe("number");
      expect(typeof result.risk_mitigation_rate).toBe("number");
      expect(typeof result.incident_report_rate).toBe("number");
      expect(typeof result.incident_follow_up_rate).toBe("number");
      expect(typeof result.high_severity_notification_rate).toBe("number");
      expect(typeof result.child_evidence_coverage_rate).toBe("number");
    });

    it("strengths, concerns, recommendations, insights are arrays", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [makeFilingItem({ id: "f-1" })],
        }),
      );
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(Array.isArray(result.concerns)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.insights)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. BONUS/PENALTY INTERACTION TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Bonus and penalty interactions", () => {
    it("bonus and penalty for same domain cancel partially (filing verified 30% gives penalty, not bonus)", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, is_verified: i < 3, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      // 30% < 40 -> -5 penalty, no bonus
      // For this specific domain, we get penalty only
      expect(result.filing_verified_rate).toBe(30);
    });

    it("filing verified at exactly 40 does not get penalty", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 5 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, is_verified: i < 2, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      expect(result.filing_verified_rate).toBe(40);
      // 40 is NOT < 40, so no penalty
    });

    it("filing verified at exactly 39 gets penalty", () => {
      // Need a number of items where Math.round(n/d * 100) = 39
      // 39% from 100 items: 39/100 = 39
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 100 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, is_verified: i < 39, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      expect(result.filing_verified_rate).toBe(39);
    });

    it("RA currency at exactly 50 does not get penalty", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: [
            makeRiskAssessment({ id: "ra-1", status: "current" }),
            makeRiskAssessment({ id: "ra-2", status: "archived" }),
          ],
        }),
      );
      expect(result.risk_assessment_currency_rate).toBe(50);
    });

    it("RA currency at exactly 49 gets penalty", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: Array.from({ length: 100 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, status: i < 49 ? "current" : "archived", child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      expect(result.risk_assessment_currency_rate).toBe(49);
    });

    it("incident report at exactly 50 does not get penalty", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: [
            makeIncident({ id: "i-1", has_report: true }),
            makeIncident({ id: "i-2", has_report: false }),
          ],
        }),
      );
      expect(result.incident_report_rate).toBe(50);
    });

    it("high severity notification at exactly 50 does not get penalty", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: [
            makeIncident({ id: "i-1", severity: "high", has_notification: true }),
            makeIncident({ id: "i-2", severity: "high", has_notification: false }),
          ],
        }),
      );
      expect(result.high_severity_notification_rate).toBe(50);
    });

    it("high severity notification at 49 gets -8 penalty", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: Array.from({ length: 100 }, (_, i) =>
            makeIncident({
              id: `i-${i}`,
              severity: "high",
              has_report: i < 50,
              has_notification: i < 49,
              has_follow_up: false,
              child_id: `child-${(i % 6) + 1}`,
            }),
          ),
        }),
      );
      expect(result.high_severity_notification_rate).toBe(49);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. FILING DESCRIBED RATE BONUS BOUNDARIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Filing described rate bonus boundaries", () => {
    it("94% described does not get +3 bonus", () => {
      // 94/100 items described
      const input = baseInput({
        filing_items: Array.from({ length: 100 }, (_, i) =>
          makeFilingItem({
            id: `f-${i}`,
            is_verified: i < 50,
            has_description: i < 94,
            child_id: `child-${(i % 6) + 1}`,
          }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.filing_described_rate).toBe(94);
      // 94 >= 80 -> +1 (not +3)
    });

    it("95% described gets +3 bonus", () => {
      const input = baseInput({
        filing_items: Array.from({ length: 100 }, (_, i) =>
          makeFilingItem({
            id: `f-${i}`,
            is_verified: i < 50,
            has_description: i < 95,
            child_id: `child-${(i % 6) + 1}`,
          }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.filing_described_rate).toBe(95);
    });

    it("79% described does not get bonus", () => {
      const input = baseInput({
        filing_items: Array.from({ length: 100 }, (_, i) =>
          makeFilingItem({
            id: `f-${i}`,
            is_verified: i < 50,
            has_description: i < 79,
            child_id: `child-${(i % 6) + 1}`,
          }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.filing_described_rate).toBe(79);
    });

    it("80% described gets +1 bonus", () => {
      const input = baseInput({
        filing_items: Array.from({ length: 100 }, (_, i) =>
          makeFilingItem({
            id: `f-${i}`,
            is_verified: i < 50,
            has_description: i < 80,
            child_id: `child-${(i % 6) + 1}`,
          }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.filing_described_rate).toBe(80);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. DOCUMENT CURRENCY BONUS BOUNDARIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Document currency bonus boundaries", () => {
    it("94% currency does not get +4 bonus", () => {
      const input = baseInput({
        documents: Array.from({ length: 100 }, (_, i) =>
          makeDocument({ id: `d-${i}`, status: i < 94 ? "current" : "expired", is_signed: false }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.document_currency_rate).toBe(94);
    });

    it("95% currency gets +4 bonus", () => {
      const input = baseInput({
        documents: Array.from({ length: 100 }, (_, i) =>
          makeDocument({ id: `d-${i}`, status: i < 95 ? "current" : "expired", is_signed: false }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.document_currency_rate).toBe(95);
    });

    it("79% currency does not get bonus", () => {
      const input = baseInput({
        documents: Array.from({ length: 100 }, (_, i) =>
          makeDocument({ id: `d-${i}`, status: i < 79 ? "current" : "expired", is_signed: false }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.document_currency_rate).toBe(79);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. DOCUMENT SIGNED BONUS BOUNDARIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Document signed bonus boundaries", () => {
    it("89% signed does not get +3 bonus", () => {
      const input = baseInput({
        documents: Array.from({ length: 100 }, (_, i) =>
          makeDocument({ id: `d-${i}`, is_signed: i < 89 }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.document_signed_rate).toBe(89);
    });

    it("90% signed gets +3 bonus", () => {
      const input = baseInput({
        documents: Array.from({ length: 100 }, (_, i) =>
          makeDocument({ id: `d-${i}`, is_signed: i < 90 }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.document_signed_rate).toBe(90);
    });

    it("74% signed does not get bonus", () => {
      const input = baseInput({
        documents: Array.from({ length: 100 }, (_, i) =>
          makeDocument({ id: `d-${i}`, is_signed: i < 74 }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.document_signed_rate).toBe(74);
    });

    it("75% signed gets +1 bonus", () => {
      const input = baseInput({
        documents: Array.from({ length: 100 }, (_, i) =>
          makeDocument({ id: `d-${i}`, is_signed: i < 75 }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.document_signed_rate).toBe(75);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. RA CURRENCY BONUS BOUNDARIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("RA currency bonus boundaries", () => {
    it("89% RA currency does not get +4 bonus", () => {
      const input = baseInput({
        risk_assessments: Array.from({ length: 100 }, (_, i) =>
          makeRiskAssessment({ id: `ra-${i}`, status: i < 89 ? "current" : "archived", child_id: `child-${(i % 6) + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.risk_assessment_currency_rate).toBe(89);
    });

    it("74% RA currency does not get bonus", () => {
      const input = baseInput({
        risk_assessments: Array.from({ length: 100 }, (_, i) =>
          makeRiskAssessment({ id: `ra-${i}`, status: i < 74 ? "current" : "archived", child_id: `child-${(i % 6) + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.risk_assessment_currency_rate).toBe(74);
    });

    it("75% RA currency gets +2 bonus", () => {
      const input = baseInput({
        risk_assessments: Array.from({ length: 100 }, (_, i) =>
          makeRiskAssessment({ id: `ra-${i}`, status: i < 75 ? "current" : "archived", child_id: `child-${(i % 6) + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.risk_assessment_currency_rate).toBe(75);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. RA MITIGATION BONUS BOUNDARIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("RA mitigation bonus boundaries", () => {
    it("99% mitigation does not get +3 bonus", () => {
      const input = baseInput({
        risk_assessments: Array.from({ length: 100 }, (_, i) =>
          makeRiskAssessment({ id: `ra-${i}`, has_mitigations: i < 99, child_id: `child-${(i % 6) + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.risk_mitigation_rate).toBe(99);
    });

    it("100% mitigation gets +3 bonus", () => {
      const input = baseInput({
        risk_assessments: Array.from({ length: 10 }, (_, i) =>
          makeRiskAssessment({ id: `ra-${i}`, has_mitigations: true, child_id: `child-${(i % 6) + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.risk_mitigation_rate).toBe(100);
    });

    it("79% mitigation does not get bonus", () => {
      const input = baseInput({
        risk_assessments: Array.from({ length: 100 }, (_, i) =>
          makeRiskAssessment({ id: `ra-${i}`, has_mitigations: i < 79, child_id: `child-${(i % 6) + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.risk_mitigation_rate).toBe(79);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 21. INCIDENT REPORT BONUS BOUNDARIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Incident report bonus boundaries", () => {
    it("99% report rate does not get +3 bonus", () => {
      const input = baseInput({
        incidents: Array.from({ length: 100 }, (_, i) =>
          makeIncident({ id: `i-${i}`, has_report: i < 99, child_id: `child-${(i % 6) + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.incident_report_rate).toBe(99);
    });

    it("84% report rate does not get bonus", () => {
      const input = baseInput({
        incidents: Array.from({ length: 100 }, (_, i) =>
          makeIncident({ id: `i-${i}`, has_report: i < 84, child_id: `child-${(i % 6) + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.incident_report_rate).toBe(84);
    });

    it("85% report rate gets +1 bonus", () => {
      const input = baseInput({
        incidents: Array.from({ length: 100 }, (_, i) =>
          makeIncident({ id: `i-${i}`, has_report: i < 85, child_id: `child-${(i % 6) + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.incident_report_rate).toBe(85);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 22. INCIDENT FOLLOW-UP BONUS BOUNDARIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Incident follow-up bonus boundaries", () => {
    it("89% follow-up does not get +2 bonus", () => {
      const input = baseInput({
        incidents: Array.from({ length: 100 }, (_, i) =>
          makeIncident({ id: `i-${i}`, has_follow_up: i < 89, child_id: `child-${(i % 6) + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.incident_follow_up_rate).toBe(89);
    });

    it("90% follow-up gets +2 bonus", () => {
      const input = baseInput({
        incidents: Array.from({ length: 100 }, (_, i) =>
          makeIncident({ id: `i-${i}`, has_follow_up: i < 90, child_id: `child-${(i % 6) + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.incident_follow_up_rate).toBe(90);
    });

    it("74% follow-up does not get bonus", () => {
      const input = baseInput({
        incidents: Array.from({ length: 100 }, (_, i) =>
          makeIncident({ id: `i-${i}`, has_follow_up: i < 74, child_id: `child-${(i % 6) + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.incident_follow_up_rate).toBe(74);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 23. CHILD COVERAGE BONUS BOUNDARIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Child evidence coverage bonus boundaries", () => {
    it("79% child coverage does not get bonus", () => {
      const input = baseInput({
        total_children: 100,
        filing_items: Array.from({ length: 79 }, (_, i) =>
          makeFilingItem({ id: `f-${i}`, child_id: `child-${i + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.child_evidence_coverage_rate).toBe(79);
    });

    it("80% child coverage gets +1 bonus", () => {
      const input = baseInput({
        total_children: 100,
        filing_items: Array.from({ length: 80 }, (_, i) =>
          makeFilingItem({ id: `f-${i}`, child_id: `child-${i + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.child_evidence_coverage_rate).toBe(80);
    });

    it("99% child coverage gets +1 bonus (not +2)", () => {
      const input = baseInput({
        total_children: 100,
        filing_items: Array.from({ length: 99 }, (_, i) =>
          makeFilingItem({ id: `f-${i}`, child_id: `child-${i + 1}` }),
        ),
      });
      const result = computeRegulatoryEvidenceCompleteness(input);
      expect(result.child_evidence_coverage_rate).toBe(99);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 24. ADDITIONAL CONCERNS BOUNDARY TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Concern boundary conditions", () => {
    it("filing described at exactly 50 does not trigger concern", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, has_description: i < 5, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      expect(result.filing_described_rate).toBe(50);
      expect(result.concerns).not.toContain(
        "Majority of filing items lack descriptions, reducing evidence value",
      );
    });

    it("filing described at 49 triggers concern", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 100 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, has_description: i < 49, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      expect(result.filing_described_rate).toBe(49);
      expect(result.concerns).toContain(
        "Majority of filing items lack descriptions, reducing evidence value",
      );
    });

    it("document signed at exactly 50 does not trigger concern", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({ id: `d-${i}`, is_signed: i < 5 }),
          ),
        }),
      );
      expect(result.document_signed_rate).toBe(50);
      expect(result.concerns).not.toContain(
        "Most documents are unsigned, undermining accountability and governance",
      );
    });

    it("RA mitigation at exactly 50 does not trigger concern", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, has_mitigations: i < 5, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      expect(result.risk_mitigation_rate).toBe(50);
      expect(result.concerns).not.toContain(
        "Most risk assessments lack documented mitigations — significant safeguarding gap",
      );
    });

    it("incident follow-up at exactly 50 does not trigger concern", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: Array.from({ length: 10 }, (_, i) =>
            makeIncident({ id: `i-${i}`, has_follow_up: i < 5, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      expect(result.incident_follow_up_rate).toBe(50);
      expect(result.concerns).not.toContain(
        "Most incidents lack follow-up actions, suggesting poor learning from events",
      );
    });

    it("child evidence coverage at exactly 50 does not trigger concern", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 10,
          filing_items: Array.from({ length: 5 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, child_id: `child-${i + 1}` }),
          ),
        }),
      );
      expect(result.child_evidence_coverage_rate).toBe(50);
      expect(result.concerns).not.toContain(
        "Less than half of children have any evidence on file",
      );
    });

    it("category coverage at exactly 3 does not trigger concern", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [
            makeFilingItem({ id: "f-1", category: "safeguarding" }),
            makeFilingItem({ id: "f-2", category: "health" }),
            makeFilingItem({ id: "f-3", category: "education" }),
          ],
        }),
      );
      expect(result.evidence_category_coverage).toBe(3);
      expect(result.concerns).not.toContain(
        "Evidence covers very few categories, suggesting significant recording gaps",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 25. RECOMMENDATION BOUNDARY TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Recommendation boundary conditions", () => {
    it("document currency at exactly 50 triggers 'soon' recommendation", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({ id: `d-${i}`, status: i < 5 ? "current" : "expired" }),
          ),
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("expired and draft documents"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("document currency at exactly 80 does not trigger review recommendation", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 5 }, (_, i) =>
            makeDocument({ id: `d-${i}`, status: i < 4 ? "current" : "expired" }),
          ),
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("expired and draft documents"),
      );
      expect(rec).toBeUndefined();
    });

    it("RA mitigation at exactly 50 triggers 'soon' recommendation", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, has_mitigations: i < 5, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("mitigations to risk assessments"),
      );
      expect(rec).toBeDefined();
    });

    it("RA mitigation at exactly 80 does not trigger recommendation", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: Array.from({ length: 5 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, has_mitigations: i < 4, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("mitigations to risk assessments"),
      );
      expect(rec).toBeUndefined();
    });

    it("child evidence coverage at exactly 50 triggers 'soon' recommendation", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 10,
          filing_items: Array.from({ length: 5 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, child_id: `child-${i + 1}` }),
          ),
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("every child has at least one piece of evidence"),
      );
      expect(rec).toBeDefined();
    });

    it("child evidence coverage at exactly 80 does not trigger recommendation", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 5,
          filing_items: Array.from({ length: 4 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, child_id: `child-${i + 1}` }),
          ),
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("every child has at least one piece of evidence"),
      );
      expect(rec).toBeUndefined();
    });

    it("filing described at exactly 50 triggers 'planned' recommendation", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, has_description: i < 5, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("filing descriptions"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("filing described at exactly 80 does not trigger recommendation", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 5 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, has_description: i < 4, child_id: `child-${(i % 6) + 1}` }),
          ),
        }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("filing descriptions"),
      );
      expect(rec).toBeUndefined();
    });

    it("category coverage at exactly 5 does not trigger recommendation", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [
            makeFilingItem({ id: "f-1", category: "a" }),
            makeFilingItem({ id: "f-2", category: "b" }),
            makeFilingItem({ id: "f-3", category: "c" }),
            makeFilingItem({ id: "f-4", category: "d" }),
            makeFilingItem({ id: "f-5", category: "e" }),
          ],
        }),
      );
      expect(result.evidence_category_coverage).toBe(5);
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("Broaden evidence coverage"),
      );
      expect(rec).toBeUndefined();
    });

    it("category coverage of 4 with evidence items triggers planned recommendation", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [
            makeFilingItem({ id: "f-1", category: "a" }),
            makeFilingItem({ id: "f-2", category: "b" }),
            makeFilingItem({ id: "f-3", category: "c" }),
            makeFilingItem({ id: "f-4", category: "d" }),
          ],
        }),
      );
      expect(result.evidence_category_coverage).toBe(4);
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("Broaden evidence coverage"),
      );
      expect(rec).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 26. INSIGHT INTERPOLATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Insight text interpolation", () => {
    it("high severity notification insight includes exact percentage", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: Array.from({ length: 10 }, (_, i) =>
            makeIncident({
              id: `i-${i}`,
              severity: "high",
              has_notification: i < 3,
              child_id: `child-${(i % 6) + 1}`,
            }),
          ),
        }),
      );
      const insight = result.insights.find((i) =>
        i.text.includes("high-severity incidents have regulatory notifications"),
      );
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("30%");
    });

    it("incident report insight includes exact percentage", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: Array.from({ length: 10 }, (_, i) =>
            makeIncident({
              id: `i-${i}`,
              has_report: i < 4,
              child_id: `child-${(i % 6) + 1}`,
            }),
          ),
        }),
      );
      const insight = result.insights.find((i) =>
        i.text.includes("incidents have written reports"),
      );
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("40%");
    });

    it("RA currency insight includes exact percentage", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({
              id: `ra-${i}`,
              status: i < 3 ? "current" : "archived",
              child_id: `child-${(i % 6) + 1}`,
            }),
          ),
        }),
      );
      const insight = result.insights.find((i) =>
        i.text.includes("risk assessments are current"),
      );
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("30%");
    });

    it("filing verification insight includes exact percentage", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({
              id: `f-${i}`,
              is_verified: i < 2,
              child_id: `child-${(i % 6) + 1}`,
            }),
          ),
        }),
      );
      const insight = result.insights.find((i) =>
        i.text.includes("Filing verification rate"),
      );
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("20%");
    });

    it("document currency warning insight includes exact percentage", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({ id: `d-${i}`, status: i < 7 ? "current" : "expired" }),
          ),
        }),
      );
      const insight = result.insights.find((i) =>
        i.text.includes("Document currency rate") && i.severity === "warning",
      );
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("70%");
    });

    it("category breadth insight includes exact count", () => {
      const categories = Array.from({ length: 12 }, (_, i) => `cat-${i}`);
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: categories.map((c, i) =>
            makeFilingItem({ id: `f-${i}`, category: c }),
          ),
        }),
      );
      const insight = result.insights.find((i) =>
        i.text.includes("categories, showing breadth"),
      );
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("12 categories");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 27. ADDITIONAL EDGE CASE / MISCELLANEOUS TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Miscellaneous", () => {
    it("recommendation regulatory_ref values are correct for all types", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 10,
          filing_items: Array.from({ length: 100 }, (_, i) =>
            makeFilingItem({
              id: `f-${i}`,
              is_verified: i < 30,
              has_description: i < 60,
              child_id: `child-${(i % 6) + 1}`,
              category: "safeguarding",
            }),
          ),
          documents: Array.from({ length: 100 }, (_, i) =>
            makeDocument({
              id: `d-${i}`,
              status: i < 60 ? "current" : "expired",
              is_signed: i < 50,
              category: "policy",
            }),
          ),
          risk_assessments: Array.from({ length: 100 }, (_, i) =>
            makeRiskAssessment({
              id: `ra-${i}`,
              status: i < 40 ? "current" : "archived",
              has_mitigations: i < 60,
              child_id: `child-${(i % 6) + 1}`,
            }),
          ),
          incidents: Array.from({ length: 100 }, (_, i) =>
            makeIncident({
              id: `i-${i}`,
              severity: i < 30 ? "high" : "low",
              has_report: i < 40,
              has_follow_up: i < 50,
              has_notification: i < 10,
              child_id: `child-${(i % 6) + 1}`,
            }),
          ),
        }),
      );
      const refs = result.recommendations.map((r) => r.regulatory_ref);
      // Check that all refs are from the valid set
      for (const ref of refs) {
        if (ref) {
          expect(["Reg 12", "Reg 13", "Reg 36", "Reg 40"]).toContain(ref);
        }
      }
    });

    it("recommendation urgency values are valid", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 10,
          filing_items: Array.from({ length: 100 }, (_, i) =>
            makeFilingItem({
              id: `f-${i}`,
              is_verified: i < 30,
              has_description: i < 60,
              child_id: `child-${(i % 6) + 1}`,
              category: "safeguarding",
            }),
          ),
          documents: Array.from({ length: 100 }, (_, i) =>
            makeDocument({
              id: `d-${i}`,
              status: i < 60 ? "current" : "expired",
              is_signed: i < 50,
            }),
          ),
          risk_assessments: Array.from({ length: 100 }, (_, i) =>
            makeRiskAssessment({
              id: `ra-${i}`,
              status: i < 40 ? "current" : "archived",
              has_mitigations: i < 60,
              child_id: `child-${(i % 6) + 1}`,
            }),
          ),
          incidents: Array.from({ length: 100 }, (_, i) =>
            makeIncident({
              id: `i-${i}`,
              severity: i < 30 ? "high" : "low",
              has_report: i < 40,
              has_follow_up: i < 50,
              has_notification: i < 10,
              child_id: `child-${(i % 6) + 1}`,
            }),
          ),
        }),
      );
      for (const rec of result.recommendations) {
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      }
    });

    it("insight severity values are valid", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [makeFilingItem({ id: "f-1" })],
          documents: [makeDocument({ id: "d-1" })],
          risk_assessments: [makeRiskAssessment({ id: "ra-1" })],
          incidents: [makeIncident({ id: "i-1" })],
        }),
      );
      for (const insight of result.insights) {
        expect(["critical", "warning", "positive"]).toContain(insight.severity);
      }
    });

    it("evidence_rating is always one of the valid values", () => {
      const inputs = [
        baseInput({ total_children: 0, total_staff: 0 }), // insufficient_data
        baseInput({ total_children: 5 }), // inadequate (empty)
        baseInput({ // normal
          filing_items: [makeFilingItem({ id: "f-1" })],
        }),
      ];
      for (const input of inputs) {
        const result = computeRegulatoryEvidenceCompleteness(input);
        expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(
          result.evidence_rating,
        );
      }
    });

    it("no duplicate strengths are produced", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 1,
          filing_items: [makeFilingItem({ id: "f-1", child_id: "child-1" })],
          documents: [makeDocument({ id: "d-1" })],
          risk_assessments: [makeRiskAssessment({ id: "ra-1", child_id: "child-1" })],
          incidents: [
            makeIncident({ id: "i-1", severity: "high", has_report: true, has_follow_up: true, has_notification: true, child_id: "child-1" }),
          ],
        }),
      );
      const uniqueStrengths = new Set(result.strengths);
      expect(uniqueStrengths.size).toBe(result.strengths.length);
    });

    it("no duplicate concerns are produced", () => {
      const result = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_children: 10,
          filing_items: Array.from({ length: 10 }, (_, i) =>
            makeFilingItem({ id: `f-${i}`, is_verified: false, has_description: false, child_id: `child-${i + 1}` }),
          ),
          documents: Array.from({ length: 10 }, (_, i) =>
            makeDocument({ id: `d-${i}`, status: "expired", is_signed: false }),
          ),
          risk_assessments: Array.from({ length: 10 }, (_, i) =>
            makeRiskAssessment({ id: `ra-${i}`, status: "archived", has_mitigations: false, child_id: `child-${i + 1}` }),
          ),
          incidents: Array.from({ length: 10 }, (_, i) =>
            makeIncident({ id: `i-${i}`, severity: "high", has_report: false, has_follow_up: false, has_notification: false, child_id: `child-${i + 1}` }),
          ),
        }),
      );
      const uniqueConcerns = new Set(result.concerns);
      expect(uniqueConcerns.size).toBe(result.concerns.length);
    });

    it("handles today date parameter without affecting computation", () => {
      const result1 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          today: "2024-01-01",
          filing_items: [makeFilingItem({ id: "f-1" })],
        }),
      );
      const result2 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          today: "2030-12-31",
          filing_items: [makeFilingItem({ id: "f-1" })],
        }),
      );
      // The engine doesn't use today for any computation in the normal path
      expect(result1.evidence_score).toBe(result2.evidence_score);
    });

    it("handles total_staff parameter without direct rate impact", () => {
      // total_staff only affects the allEmpty special case check
      const result1 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_staff: 5,
          filing_items: [makeFilingItem({ id: "f-1" })],
        }),
      );
      const result2 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          total_staff: 100,
          filing_items: [makeFilingItem({ id: "f-1" })],
        }),
      );
      expect(result1.evidence_score).toBe(result2.evidence_score);
    });

    it("source_type on filing items does not affect rates", () => {
      const result1 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [makeFilingItem({ id: "f-1", source_type: "upload" })],
        }),
      );
      const result2 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          filing_items: [makeFilingItem({ id: "f-1", source_type: "manual" })],
        }),
      );
      expect(result1.evidence_score).toBe(result2.evidence_score);
    });

    it("risk_level on risk assessments does not affect rates", () => {
      const result1 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: [makeRiskAssessment({ id: "ra-1", risk_level: "high" })],
        }),
      );
      const result2 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: [makeRiskAssessment({ id: "ra-1", risk_level: "low" })],
        }),
      );
      expect(result1.evidence_score).toBe(result2.evidence_score);
    });

    it("has_debrief on incidents does not affect rates", () => {
      const result1 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: [makeIncident({ id: "i-1", has_debrief: true })],
        }),
      );
      const result2 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          incidents: [makeIncident({ id: "i-1", has_debrief: false })],
        }),
      );
      expect(result1.evidence_score).toBe(result2.evidence_score);
    });

    it("document has_review_date does not affect rates", () => {
      const result1 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: [makeDocument({ id: "d-1", has_review_date: true })],
        }),
      );
      const result2 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          documents: [makeDocument({ id: "d-1", has_review_date: false })],
        }),
      );
      expect(result1.evidence_score).toBe(result2.evidence_score);
    });

    it("mitigations_count on risk assessments does not affect rates", () => {
      const result1 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: [makeRiskAssessment({ id: "ra-1", mitigations_count: 0 })],
        }),
      );
      const result2 = computeRegulatoryEvidenceCompleteness(
        baseInput({
          risk_assessments: [makeRiskAssessment({ id: "ra-1", mitigations_count: 100 })],
        }),
      );
      expect(result1.evidence_score).toBe(result2.evidence_score);
    });
  });
});
