import { describe, it, expect } from "vitest";
import {
  computeRecordingQuality, scoreRecord, overallOf, bandOf,
  scoreCompleteness, scoreClarity, scoreProfessionalLanguage, scoreFactuality,
  scoreChildCentredness, scoreRiskRelevance,
  type RecordInput,
} from "../recording-quality-engine";

const rec = (o: Partial<RecordInput> & { id: string }): RecordInput => ({
  type: "daily_log", text: "", expected_fields: [], present_fields: [], ...o,
});

// ══════════════════════════════════════════════════════════════════════════════
describe("dimension scorers", () => {
  it("completeness reflects present vs expected and lists missing fields", () => {
    const r = scoreCompleteness(["a", "b", "c", "d"], ["a", "b"]);
    expect(r.score).toBe(50);
    expect(r.missing).toEqual(["c", "d"]);
    expect(scoreCompleteness([], []).score).toBe(100);
  });
  it("clarity rewards reasonable, punctuated narrative and penalises terse/run-on text", () => {
    expect(scoreClarity("Fine.")).toBe(30);
    expect(scoreClarity("Alex returned from school in a good mood and settled well at home this evening.")).toBe(95);
    const runon = "alex came back and then we had tea and then he watched tv and then he went to bed late again no full stops anywhere here at all today";
    expect(scoreClarity(runon)).toBeLessThanOrEqual(70);
  });
  it("professional language penalises labelling/informal terms", () => {
    expect(scoreProfessionalLanguage("Alex returned home and settled well.")).toBe(100);
    expect(scoreProfessionalLanguage("He kicked off and was being manipulative.")).toBe(100 - 44);
  });
  it("factuality rewards anchoring (time/quote), penalises speculation", () => {
    expect(scoreFactuality("At 16:30 Alex returned home.")).toBe(100);
    expect(scoreFactuality("I think he probably did it on purpose.")).toBe(88 - 32);
  });
  it("child-centredness rewards the child's voice and name, penalises staff-centric prose", () => {
    expect(scoreChildCentredness("Alex said he wanted to call his mum and felt happy afterwards.", "Alex")).toBeGreaterThanOrEqual(80);
    expect(scoreChildCentredness("I made him go to his room.", "Alex")).toBeLessThanOrEqual(35);
  });
  it("risk relevance only applies to risk-related records", () => {
    expect(scoreRiskRelevance("nothing of note happened during the quiet shift", false)).toBe(100);
    expect(scoreRiskRelevance("nothing of note happened during the quiet shift", true)).toBe(40);
    expect(scoreRiskRelevance("The risk was assessed, action taken and the social worker notified.", true)).toBeGreaterThanOrEqual(80);
  });
});

describe("scoreRecord", () => {
  it("scores a strong, child-centred record highly with no suggestions", () => {
    const s = scoreRecord(rec({
      id: "1", type: "daily_log",
      text: "At 16:30 Alex returned from school in a positive mood. Alex said he had enjoyed his art lesson and wanted to show staff his work. We agreed a plan for the weekend.",
      expected_fields: ["content"], present_fields: ["content"], child_name: "Alex",
    }));
    expect(s.completeness).toBe(100);
    expect(s.childCentredness).toBeGreaterThanOrEqual(80);
    expect(s.professionalLanguage).toBe(100);
    expect(overallOf(s)).toBeGreaterThanOrEqual(85);
    expect(bandOf(overallOf(s))).toBe("strong");
    expect(s.caraSuggestions).toHaveLength(0);
  });
  it("scores a poor record low and returns targeted suggestions", () => {
    const s = scoreRecord(rec({
      id: "2", type: "incident",
      text: "Kicked off. Naughty. I made him stop.",
      expected_fields: ["description", "immediate_action", "outcome"], present_fields: ["description"],
      child_name: "Alex", is_risk_related: true,
    }));
    expect(s.professionalLanguage).toBeLessThan(70);
    expect(s.childCentredness).toBeLessThanOrEqual(35);
    expect(s.riskRelevance).toBeLessThan(70);
    expect(s.missingFields).toEqual(["immediate_action", "outcome"]);
    expect(s.caraSuggestions.length).toBeGreaterThanOrEqual(3);
    expect(bandOf(overallOf(s))).toBe("poor");
  });
});

describe("computeRecordingQuality aggregate", () => {
  const r = computeRecordingQuality({
    records: [
      rec({ id: "good", type: "daily_log", text: "At 18:00 Casey said she wanted to bake and felt proud of her cake. A lovely evening.", expected_fields: ["content"], present_fields: ["content"], child_name: "Casey" }),
      rec({ id: "poor", type: "incident", text: "Kicked off. Naughty. I made him stop.", expected_fields: ["description", "immediate_action", "outcome"], present_fields: ["description"], child_name: "Alex", is_risk_related: true }),
      rec({ id: "mid", type: "keywork", text: "Met with Jordan. We talked about school. Jordan said it was going ok.", expected_fields: ["worker_observations"], present_fields: ["worker_observations"], child_name: "Jordan" }),
    ],
  });
  it("scores, bands and ranks records weakest-first", () => {
    expect(r.overview.records_scored).toBe(3);
    expect(r.records[0].id).toBe("poor");
    expect(r.records[0].band).toBe("poor");
  });
  it("computes dimension averages and the weakest dimension", () => {
    expect(r.overview.weakest_dimension).toBeTruthy();
    expect(r.overview.dimension_averages.childCentredness).toBeGreaterThan(0);
    expect(r.overview.below_threshold).toBeGreaterThanOrEqual(1);
  });
  it("raises an alert about the poor risk-related record", () => {
    expect(r.alerts.some((a) => a.severity === "high" && /poor quality and weak on risk/i.test(a.message))).toBe(true);
  });
});

describe("determinism", () => {
  it("returns identical output for identical input", () => {
    const input = { records: [rec({ id: "1", text: "Alex said he felt happy at 17:00.", expected_fields: ["content"], present_fields: ["content"], child_name: "Alex" })] };
    expect(JSON.stringify(computeRecordingQuality(input))).toBe(JSON.stringify(computeRecordingQuality(input)));
  });
});
