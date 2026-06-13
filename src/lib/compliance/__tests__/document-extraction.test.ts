import { describe, expect, it } from "vitest";
import { extractComplianceDocument } from "../document-extraction";

const TODAY = "2026-06-13";
function run(text: string, over: Partial<Parameters<typeof extractComplianceDocument>[0]> = {}) {
  return extractComplianceDocument({ text, today: TODAY, ...over });
}

describe("extractComplianceDocument — category inference", () => {
  it("infers statement of purpose, workforce/home dev plan, fire, H&S, insurance", () => {
    expect(run("This Statement of Purpose sets out…").category).toBe("statement_of_purpose");
    expect(run("Workforce Development Plan 2026").category).toBe("workforce_development_plan");
    expect(run("Home Development Plan — improvement actions").category).toBe("home_development_plan");
    expect(run("Annual Fire Risk Assessment for the premises").category).toBe("fire_risk_assessment");
    expect(run("Health and Safety check — water temperature log").category).toBe("health_safety_check");
    expect(run("Public Liability Insurance certificate").category).toBe("insurance_certificate");
  });
  it("honours a manual category override", () => {
    expect(run("ambiguous text", { category: "policy_document" }).category).toBe("policy_document");
    expect(run("ambiguous text", { category: "policy_document" }).categoryConfidence).toBe(1);
  });
  it("falls back to policy_document with low confidence", () => {
    const r = run("Some general notes with no clear type.");
    expect(r.category).toBe("policy_document");
    expect(r.categoryConfidence).toBeLessThan(0.5);
  });
});

describe("extractComplianceDocument — dates", () => {
  it("extracts review + expiry across formats and stamps canonical entries", () => {
    const r = run("Statement of Purpose.\nNext review date: 1 March 2027\nValid until 2026-12-31");
    expect(r.reviewDue).toBe("2027-03-01");
    expect(r.expiry).toBe("2026-12-31");
    const labels = r.aiResult.extracted_entities.dates.map((d) => d.label);
    expect(labels).toContain("Review due");
    expect(labels).toContain("Expiry");
  });
  it("flags an expired certificate as critical", () => {
    const r = run("Insurance certificate. Valid until 01/01/2026.");
    expect(r.expiry).toBe("2026-01-01");
    expect(r.riskLevel).toBe("critical");
    expect(r.riskFlags.some((f) => f.flag_type === "outdated_assessment")).toBe(true);
  });
  it("flags an overdue review as high", () => {
    const r = run("Fire risk assessment. Review by 1 January 2026.");
    expect(r.riskLevel).toBe("high");
    expect(r.riskFlags.some((f) => f.flag_type === "missing_review_date")).toBe(true);
  });
  it("flags a missing review date for a document that needs one", () => {
    const r = run("Statement of Purpose with no dates mentioned at all here.");
    expect(r.reviewDue).toBeNull();
    expect(r.riskFlags.some((f) => f.flag_type === "missing_review_date" && f.severity === "medium")).toBe(true);
  });
});

describe("extractComplianceDocument — actions", () => {
  const doc = `Home Development Plan
- Update the fire evacuation plan by 30 June 2026 (responsible: Olivia Hayes)
- Staff should complete safeguarding refresher training
* Must renew the minibus insurance urgently
Some narrative sentence that is not an action at all really.`;

  it("extracts bullet + cue lines as actions, with owner and due date", () => {
    const r = run(doc);
    expect(r.actions.length).toBeGreaterThanOrEqual(3);
    const fire = r.actions.find((a) => /fire evacuation/i.test(a.action));
    expect(fire?.due_date).toBe("2026-06-30");
    expect(fire?.responsible_person).toBe("Olivia Hayes");
  });
  it("maps actions to suggested tasks with priority (urgent for 'urgently'/overdue)", () => {
    const r = run(doc);
    const urgent = r.suggestedTasks.find((t) => /minibus insurance/i.test(t.title));
    expect(urgent?.priority).toBe("urgent");
    expect(r.suggestedTasks.every((t) => t.approved === false && t.created_task_id === null)).toBe(true);
  });
  it("flags when actions exist but none have an owner", () => {
    const r = run("Policy.\n- review the lone working procedure\n- update the contact list");
    expect(r.riskFlags.some((f) => f.flag_type === "no_responsible_person")).toBe(true);
  });
});
