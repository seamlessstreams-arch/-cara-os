import { describe, it, expect } from "vitest";
import { runCompletenessRules } from "../completeness-rules";

describe("runCompletenessRules", () => {
  // ── Guards ─────────────────────────────────────────────────────────────────
  it("returns nothing when text is too short", () => {
    expect(runCompletenessRules("short", "incident", "description")).toHaveLength(0);
  });

  it("returns nothing without a recordType", () => {
    const long = "Alex became very distressed and started shouting in the corridor. Staff intervened calmly.";
    expect(runCompletenessRules(long, undefined, "description")).toHaveLength(0);
  });

  // ── Incident: time ─────────────────────────────────────────────────────────
  it("flags incident description missing a time reference", () => {
    const text = "Alex became very distressed in the corridor. Staff intervened and supported Alex to their room.";
    const issues = runCompletenessRules(text, "incident", "description");
    expect(issues.some((i) => i.id === "wa-completeness-incident-time")).toBe(true);
  });

  it("does NOT flag incident description that includes a time", () => {
    const text = "At approximately 9pm Alex became distressed in the corridor. Staff intervened calmly.";
    const issues = runCompletenessRules(text, "incident", "description");
    expect(issues.some((i) => i.id === "wa-completeness-incident-time")).toBe(false);
  });

  it("accepts '21:30' as a valid time reference", () => {
    const text = "At 21:30 Alex became distressed. Staff responded immediately and supported Alex back to their room.";
    const issues = runCompletenessRules(text, "incident", "description");
    expect(issues.some((i) => i.id === "wa-completeness-incident-time")).toBe(false);
  });

  it("accepts 'evening' as a valid time reference", () => {
    const text = "During the evening Alex became very distressed. Staff intervened and were able to settle Alex.";
    const issues = runCompletenessRules(text, "incident", "description");
    expect(issues.some((i) => i.id === "wa-completeness-incident-time")).toBe(false);
  });

  // ── Incident: notification ─────────────────────────────────────────────────
  it("flags incident immediate_action missing notification reference", () => {
    const text = "Provided emotional support to Alex and sat with them until they were calm and settled.";
    const issues = runCompletenessRules(text, "incident", "immediate_action");
    expect(issues.some((i) => i.id === "wa-completeness-incident-notification")).toBe(true);
  });

  it("does NOT flag when manager notified", () => {
    const text = "Provided support to Alex. Notified the on-call manager and completed an incident record.";
    const issues = runCompletenessRules(text, "incident", "immediate_action");
    expect(issues.some((i) => i.id === "wa-completeness-incident-notification")).toBe(false);
  });

  // ── Risk assessment: contingency ───────────────────────────────────────────
  it("flags contingency_plan without action steps", () => {
    const text = "There are known risks around Alex going missing and being vulnerable to exploitation by peers.";
    const issues = runCompletenessRules(text, "risk_assessment", "contingency_plan");
    expect(issues.some((i) => i.id === "wa-completeness-risk-contingency-actions")).toBe(true);
  });

  it("does NOT flag contingency with if/then actions", () => {
    const text = "If Alex is not back by 10pm, staff must contact the on-call manager and notify the placing authority.";
    const issues = runCompletenessRules(text, "risk_assessment", "contingency_plan");
    expect(issues.some((i) => i.id === "wa-completeness-risk-contingency-actions")).toBe(false);
  });

  // ── Key work: child voice ──────────────────────────────────────────────────
  it("flags child_voice with no direct speech or attribution", () => {
    const text = "Alex appeared happy during the session and engaged well with the activities we had planned.";
    const issues = runCompletenessRules(text, "key_work", "child_voice");
    expect(issues.some((i) => i.id === "wa-completeness-keywork-child-voice-direct")).toBe(true);
  });

  it("does NOT flag child_voice that includes attribution", () => {
    const text = "Alex said that they were feeling much better this week and wanted to go to the cinema at the weekend.";
    const issues = runCompletenessRules(text, "key_work", "child_voice");
    expect(issues.some((i) => i.id === "wa-completeness-keywork-child-voice-direct")).toBe(false);
  });

  it("does NOT flag child_voice with direct speech markers (quotes)", () => {
    const text = "Alex told me 'I feel like nobody listens to me'. We explored this together during the session.";
    const issues = runCompletenessRules(text, "key_work", "child_voice");
    expect(issues.some((i) => i.id === "wa-completeness-keywork-child-voice-direct")).toBe(false);
  });

  // ── Handover ───────────────────────────────────────────────────────────────
  it("flags handover note with no forward reference", () => {
    const text = "Alex had a difficult evening. There was an incident in the lounge which has been recorded separately.";
    const issues = runCompletenessRules(text, "handover", "key_notes");
    expect(issues.some((i) => i.id === "wa-completeness-handover-forward-reference")).toBe(true);
  });

  it("does NOT flag handover with follow-up action", () => {
    const text = "Alex had a difficult evening. Remember to follow up with CAMHS tomorrow and check the appointment confirmation.";
    const issues = runCompletenessRules(text, "handover", "key_notes");
    expect(issues.some((i) => i.id === "wa-completeness-handover-forward-reference")).toBe(false);
  });

  // ── Daily log ──────────────────────────────────────────────────────────────
  it("flags daily log entry without wellbeing observation", () => {
    const text = "Alex attended school today. Returned home at 3:30pm and had dinner. Watched television in the evening.";
    const issues = runCompletenessRules(text, "daily_log", "content");
    expect(issues.some((i) => i.id === "wa-completeness-daily-log-wellbeing")).toBe(true);
  });

  it("does NOT flag daily log with mood/wellbeing reference", () => {
    const text = "Alex appeared calm and settled throughout the day. Attended school, returned home at 3:30pm and engaged well with dinner.";
    const issues = runCompletenessRules(text, "daily_log", "content");
    expect(issues.some((i) => i.id === "wa-completeness-daily-log-wellbeing")).toBe(false);
  });

  // ── fieldName scoping ──────────────────────────────────────────────────────
  it("does NOT fire field-specific rule when fieldName is different", () => {
    // incident-time rule is field-specific to 'description'; should not fire for 'follow_up'
    const text = "A follow-up call was made to the placing authority to share an update on the situation.";
    const issues = runCompletenessRules(text, "incident", "follow_up");
    expect(issues.some((i) => i.id === "wa-completeness-incident-time")).toBe(false);
  });

  // ── Mode scoping ───────────────────────────────────────────────────────────
  it("fires return-interview attribution rule only in safeguarding mode", () => {
    const text = "The young person was away from placement for two nights at an address in the local area.";
    const withSafeguarding = runCompletenessRules(text, "return_interview", "interview_notes", "safeguarding");
    const withStandard = runCompletenessRules(text, "return_interview", "interview_notes", "standard");
    expect(withSafeguarding.some((i) => i.id === "wa-completeness-return-interview-attribution")).toBe(true);
    expect(withStandard.some((i) => i.id === "wa-completeness-return-interview-attribution")).toBe(false);
  });

  // ── Issue shape ────────────────────────────────────────────────────────────
  it("emitted issues have the required shape", () => {
    const text = "Alex became very distressed in the corridor. Staff intervened and supported Alex back to their room.";
    const issues = runCompletenessRules(text, "incident", "description");
    const timeIssue = issues.find((i) => i.id === "wa-completeness-incident-time");
    expect(timeIssue).toBeDefined();
    expect(timeIssue!.start).toBe(0);
    expect(timeIssue!.end).toBe(0);
    expect(timeIssue!.requiresHumanJudgement).toBe(true);
    expect(timeIssue!.suggestions).toHaveLength(0);
    expect(timeIssue!.source).toBe("rule-engine");
  });
});
