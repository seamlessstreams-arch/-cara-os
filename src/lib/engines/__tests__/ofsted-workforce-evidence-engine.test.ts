import { describe, it, expect } from "vitest";
import { computeOfstedWorkforceEvidence, EVIDENCE_DISCLAIMER, type DomainInput } from "../ofsted-workforce-evidence-engine";

function dom(over: Partial<DomainInput> & { key: string }): DomainInput {
  return { label: over.key, rate: null, evidence: [], ...over };
}
function run(domains: DomainInput[]) {
  return computeOfstedWorkforceEvidence({ domains, home_name: "Chamberlain House", generated_on: "2026-06-09" });
}

describe("computeOfstedWorkforceEvidence", () => {
  it("applies RAG thresholds (green/amber/red)", () => {
    const r = run([
      dom({ key: "g", rate: 90, evidence: ["x"] }),
      dom({ key: "a", rate: 70, evidence: ["x"] }),
      dom({ key: "r", rate: 40, evidence: ["x"] }),
    ]);
    const byKey = Object.fromEntries(r.domains.map((d) => [d.key, d.status]));
    expect(byKey).toEqual({ g: "green", a: "amber", r: "red" });
  });

  it("marks no_data when rate is null and there is no evidence (never a fake green)", () => {
    const r = run([dom({ key: "empty", rate: null, evidence: [] })]);
    expect(r.domains[0].status).toBe("no_data");
    expect(r.domains[0].summary).toMatch(/No data/i);
  });

  it("falls back to a qualitative status when rate is null but evidence exists", () => {
    const r = run([dom({ key: "q", rate: null, evidence: ["led by RM"], qualitative_status: "green" })]);
    expect(r.domains[0].status).toBe("green");
  });

  it("honours custom good/ok thresholds", () => {
    const strict = run([dom({ key: "s", rate: 80, evidence: ["x"], good: 95, ok: 75 })]);
    expect(strict.domains[0].status).toBe("amber");
  });

  it("overall rating: any red → developing", () => {
    const r = run([dom({ key: "g", rate: 95, evidence: ["x"] }), dom({ key: "r", rate: 30, evidence: ["x"] })]);
    expect(r.overall.rating).toBe("developing");
    expect(r.overall.red).toBe(1);
  });

  it("overall rating: all green → strong; amber but no red → secure", () => {
    expect(run([dom({ key: "a", rate: 90, evidence: ["x"] }), dom({ key: "b", rate: 88, evidence: ["x"] })]).overall.rating).toBe("strong");
    expect(run([dom({ key: "a", rate: 90, evidence: ["x"] }), dom({ key: "b", rate: 70, evidence: ["x"] })]).overall.rating).toBe("secure");
  });

  it("overall rating: nothing measurable → insufficient_data", () => {
    expect(run([dom({ key: "x", rate: null, evidence: [] })]).overall.rating).toBe("insufficient_data");
  });

  it("carries numerator/denominator into the summary and the disclaimer", () => {
    const r = run([dom({ key: "sup", rate: 27, numerator: 3, denominator: 11, evidence: ["x"] })]);
    expect(r.domains[0].summary).toContain("(3/11)");
    expect(r.disclaimer).toBe(EVIDENCE_DISCLAIMER);
    expect(r.disclaimer).not.toMatch(/Ofsted approved/i);
  });

  it("is deterministic", () => {
    const d = [dom({ key: "a", rate: 80, evidence: ["x"] })];
    expect(run(d)).toEqual(run(d));
  });
});
