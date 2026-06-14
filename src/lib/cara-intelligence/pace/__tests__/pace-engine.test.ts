import { describe, expect, it } from "vitest";
import { analyzePACE } from "../paceAnalyzer";
import { getPACEGuidance } from "../paceGuidanceEngine";
import { assistRecording } from "../paceRecordingAssistant";
import { scorePACE, type PACEScoreSignals } from "../paceQualityAssurance";

describe("PACE analyzer — recognising practice", () => {
  it("flags shaming language", () => {
    const r = analyzePACE({ text: "James was being naughty and attention seeking again, doing it on purpose to wind staff up.", context: "DAILY_LOG" });
    expect(r.flags.some((f) => f.flag === "SHAMING_LANGUAGE")).toBe(true);
    expect(r.score.dimensions.find((d) => d.key === "recording_objectivity")!.score).toBeLessThan(70);
  });

  it("flags 'why did you do that?' as poor curiosity (not PACE curiosity)", () => {
    const r = analyzePACE({ text: "I asked him why did you do that and told him to explain himself. He said nothing.", context: "KEY_WORK" });
    const curiosity = r.elements.find((e) => e.element === "CURIOSITY")!;
    expect(curiosity.present).toBe(false); // interrogation is not curiosity
    expect(r.recommendations.some((rec) => /wonder|non-judgemental|unfair|unsafe/i.test(rec.recommendation))).toBe(true);
  });

  it("flags missing child voice in a substantial record", () => {
    const r = analyzePACE({ text: "Staff completed the morning routine. The young person had breakfast and went to education. Activities were arranged for the afternoon and the home was tidied throughout the day by the team.", context: "DAILY_LOG" });
    expect(r.flags.some((f) => f.flag === "MISSING_CHILD_VOICE")).toBe(true);
    expect(r.childVoicePresent).toBe(false);
  });

  it("recognises genuine PACE practice and scores it higher", () => {
    const good = analyzePACE({
      text: "When Mia became upset I stayed calm and lowered my voice, giving her space. I said it makes sense that this felt hard and that she didn't have to manage that feeling on her own. I wondered if something had felt unfair. She told me she felt ignored. We kept everyone safe, and later we checked in and reconnected.",
      context: "DAILY_LOG",
    });
    const poor = analyzePACE({ text: "Mia kicked off for no reason, was non-compliant and defiant. Sanctioned her.", context: "DAILY_LOG" });
    expect(good.score.overall).toBeGreaterThan(poor.score.overall);
    expect(good.childVoicePresent).toBe(true);
    expect(good.connectBeforeCorrect).toBe(true);
  });

  it("unsafe behaviour still triggers boundary + safeguarding guidance", () => {
    const r = analyzePACE({ text: "During the incident the young person self-harmed and threatened staff with a knife.", context: "INCIDENT" });
    expect(r.professionalJudgementRequired).toBe(true);
    expect(r.flags.some((f) => f.flag === "PROFESSIONAL_JUDGEMENT_REQUIRED")).toBe(true);
    expect(r.flags.some((f) => f.flag === "UNSAFE_BOUNDARY")).toBe(true); // risk but no boundary recorded
    expect(r.managerReviewRequired).toBe(true);
  });

  it("triggers manager review + supervision on a low score", () => {
    const r = analyzePACE({ text: "He was naughty and manipulative, kicked off for no reason. I lost my temper and sanctioned him.", context: "DAILY_LOG" });
    expect(r.score.overall).toBeLessThan(50);
    expect(r.score.triggers).toContain("Needs manager review");
    expect(r.score.triggers).toContain("Needs reflective supervision");
    expect(r.managerReviewRequired).toBe(true);
  });
});

describe("PACE quality score", () => {
  it("computes a weighted 0-100 score with all eight dimensions", () => {
    const signals: PACEScoreSignals = {
      elementsPresent: new Set(["ACCEPTANCE", "EMPATHY", "CURIOSITY"]),
      connectBeforeCorrect: true, exploresNeed: true, childVoicePresent: true, hasRepair: true,
      hasDeescalation: true, hasRegulation: true, hasBoundary: true, blameBased: false, shaming: false,
      antiCuriosity: false, riskPresent: false, escalationEvidenced: false, riskyContext: false,
    };
    const s = scorePACE(signals);
    expect(s.dimensions).toHaveLength(8);
    expect(s.overall).toBeGreaterThan(80);
    expect(s.band).toBe("strong");
    expect(s.overall).toBeGreaterThanOrEqual(0);
    expect(s.overall).toBeLessThanOrEqual(100);
  });
});

describe("PACE recording assistant — never fabricates", () => {
  it("rewrites only wording the staff actually wrote", () => {
    const text = "He kicked off and was non-compliant.";
    const r = assistRecording({ text, context: "DAILY_LOG" });
    const rewrites = r.improvements.filter((i) => i.rewriteOf);
    expect(rewrites.length).toBeGreaterThan(0);
    // every rewrite targets a phrase that is genuinely in the source text
    expect(rewrites.every((i) => text.toLowerCase().includes(i.rewriteOf!.toLowerCase()))).toBe(true);
  });

  it("suggests missing areas without inventing events; skeleton contains the staff's own text", () => {
    const text = "Tom was upset this afternoon.";
    const r = assistRecording({ text, context: "DAILY_LOG" });
    expect(r.improvements.some((i) => i.area === "child_voice")).toBe(true);
    expect(r.draftSkeleton).toContain(text);
    // placeholders are bracketed prompts, not fabricated facts
    expect(r.draftSkeleton).toMatch(/\[.*\]/);
  });

  it("requires manager notification when risk is present", () => {
    const r = assistRecording({ text: "There was a physical intervention after the young person tried to abscond and self-harm.", context: "INCIDENT" });
    expect(r.managerNotificationRequired).toBe(true);
    expect(r.improvements.some((i) => i.area === "manager_notification")).toBe(true);
  });
});

describe("PACE guidance engine", () => {
  it("gives boundary + escalation guidance for physical intervention, no playfulness", () => {
    const g = getPACEGuidance("PHYSICAL_INTERVENTION");
    expect(g.holdBoundarySafely.join(" ")).toMatch(/restraint|last-resort|safe/i);
    expect(g.holdBoundarySafely.join(" ")).toMatch(/no playfulness/i);
    expect(g.whenToEscalate.join(" ")).toMatch(/manager|debrief|Regulation 40/i);
  });
  it("frames missing-from-care return relationally, avoiding 'why did you run off'", () => {
    const g = getPACEGuidance("MISSING_FROM_CARE");
    expect(g.whatNotToSay.join(" ").toLowerCase()).toContain("why did you run off");
    expect(g.whenToEscalate.join(" ")).toMatch(/return interview|exploitation|CSE|CCE/i);
  });
});
