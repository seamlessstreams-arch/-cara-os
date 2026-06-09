import { describe, it, expect } from "vitest";
import {
  INCIDENT_TYPES, ENTRY_TYPES, buildWorkflowChecklist, pickLivePrompts,
  computeIncidentQualityGate, buildDeterministicDraft,
  CO_REGULATION_PROMPTS, CHILD_VOICE_PROMPTS, CHILD_DECLINED_PROMPTS,
  ARIA_INCIDENT_SYSTEM_PROMPT, INCIDENT_DISCLAIMER, REG40_WORDING,
} from "../aria-incident-engine";

const SESSION = {
  incident_type: "emotional_dysregulation",
  child_id: "yp_alex",
  started_at: "2026-06-09T19:42:00Z",
  ended_at: "2026-06-09T20:20:00Z",
  manager_notified: true,
  immediate_risk_level: "medium" as const,
};
const ENTRY = (entry_type: string, raw_text: string, timestamp = "2026-06-09T19:44:00Z") => ({ entry_type, raw_text, timestamp });

describe("workflow checklists", () => {
  it("provides a checklist for every incident type, always ending in manager review", () => {
    for (const t of INCIDENT_TYPES) {
      const steps = buildWorkflowChecklist(t.key);
      expect(steps.length).toBeGreaterThanOrEqual(5);
      expect(steps[steps.length - 1].key).toBe("manager_review");
      expect(steps[steps.length - 1].manager_review_required).toBe(true);
    }
  });

  it("matches the spec for the three worked examples", () => {
    const dys = buildWorkflowChecklist("emotional_dysregulation").map((s) => s.title.toLowerCase()).join(" | ");
    expect(dys).toMatch(/reduce demands/);
    expect(dys).toMatch(/child's voice/);
    expect(dys).toMatch(/restorative/);

    const missing = buildWorkflowChecklist("missing_from_home").map((s) => s.title.toLowerCase()).join(" | ");
    expect(missing).toMatch(/missing-from-care protocol/);
    expect(missing).toMatch(/police/);
    expect(missing).toMatch(/exploitation/);

    const pi = buildWorkflowChecklist("physical_intervention");
    const piText = pi.map((s) => s.title.toLowerCase()).join(" | ");
    expect(piText).toMatch(/de-escalation attempted/);
    expect(piText).toMatch(/start and end time/);
    expect(piText).toMatch(/body map/);
    expect(pi.some((s) => s.regulation_related)).toBe(true);
  });

  it("falls back to a sensible default for unmapped types", () => {
    const steps = buildWorkflowChecklist("room_search");
    expect(steps.map((s) => s.key)).toEqual(expect.arrayContaining(["safety", "context", "child_voice", "manager_review"]));
  });
});

describe("live prompts", () => {
  it("returns at most 6 brief prompts plus phrase and recording reminder", () => {
    for (const t of INCIDENT_TYPES) {
      for (const risk of ["low", "medium", "high"] as const) {
        const p = pickLivePrompts(t.key, risk);
        expect(p.immediate.length).toBeGreaterThan(0);
        expect(p.immediate.length).toBeLessThanOrEqual(6);
        for (const line of p.immediate) expect(line.length).toBeLessThan(95);
        expect(p.suggested_phrase.length).toBeGreaterThan(0);
        expect(p.recording_reminder).toMatch(/Record what happened before/);
      }
    }
  });

  it("puts safety first at high risk", () => {
    expect(pickLivePrompts("emotional_dysregulation", "high").immediate[0]).toMatch(/safety/i);
  });

  it("the co-regulation bank carries the core practice prompts", () => {
    const joined = CO_REGULATION_PROMPTS.join(" ");
    expect(joined).toMatch(/Lower your voice/);
    expect(joined).toMatch(/Name the feeling, not the behaviour/);
    expect(joined).toMatch(/what is the child communicating/);
  });
});

describe("quality gate", () => {
  it("flags missing child voice, de-escalation, follow-up and manager notification", () => {
    const gate = computeIncidentQualityGate({
      session: { ...SESSION, manager_notified: false },
      entries: [ENTRY("observation", "Became distressed after a phone call.")],
    });
    expect(gate.ready).toBe(false);
    expect(gate.missing.join(" | ")).toMatch(/Child's voice/);
    expect(gate.missing.join(" | ")).toMatch(/Staff response/);
    expect(gate.missing.join(" | ")).toMatch(/Manager/);
    expect(gate.missing.join(" | ")).toMatch(/Follow-up/);
  });

  it("passes a complete, professionally-worded session", () => {
    const gate = computeIncidentQualityGate({
      session: SESSION,
      entries: [
        ENTRY("observation", "Young person became distressed after family phone contact."),
        ENTRY("staff_action", "Staff reduced demands and offered space."),
        ENTRY("deescalation_attempt", "Staff offered a drink and reassurance."),
        ENTRY("child_voice", "He said the call made him miss home."),
        ENTRY("restorative_action", "Restorative conversation planned once settled."),
      ],
    });
    expect(gate.ready).toBe(true);
    expect(gate.missing).toHaveLength(0);
  });

  it("flags judgemental language via the shared recording-quality scorer", () => {
    const gate = computeIncidentQualityGate({
      session: SESSION,
      entries: [
        ENTRY("observation", "He kicked off and was being manipulative."),
        ENTRY("staff_action", "Gave space."),
        ENTRY("child_voice", "Said sorry."),
        ENTRY("restorative_action", "Chat planned."),
      ],
    });
    const lang = gate.checks.find((c) => c.key === "language")!;
    expect(lang.ok).toBe(false);
  });
});

describe("deterministic draft", () => {
  it("re-presents recorded facts only — every timeline text appears, nothing invented", () => {
    const entries = [
      ENTRY("observation", "Became distressed after family phone contact.", "2026-06-09T19:42:00Z"),
      ENTRY("staff_action", "Staff reduced demands and offered space.", "2026-06-09T19:44:00Z"),
      ENTRY("child_voice", "Said he missed home.", "2026-06-09T20:05:00Z"),
    ];
    const draft = buildDeterministicDraft({ session: SESSION, entries, child_name: "Alex" });
    for (const e of entries) expect(draft).toContain(e.raw_text);
    expect(draft).toContain("Alex");
    expect(draft).toContain("19:42");
    expect(draft).toMatch(/review, complete and confirm accuracy/);
  });

  it("prompts for missing child voice and uses the Reg 40 'consider' wording when manager not notified", () => {
    const draft = buildDeterministicDraft({
      session: { ...SESSION, manager_notified: false },
      entries: [ENTRY("observation", "x")],
      child_name: "Alex",
    });
    expect(draft).toMatch(/not yet captured/);
    expect(draft).toContain(REG40_WORDING);
    expect(draft).not.toMatch(/Regulation 40 is required/i);
  });

  it("orders the timeline by timestamp", () => {
    const draft = buildDeterministicDraft({
      session: SESSION,
      entries: [ENTRY("staff_action", "SECOND", "2026-06-09T20:00:00Z"), ENTRY("observation", "FIRST", "2026-06-09T19:42:00Z")],
      child_name: "Alex",
    });
    expect(draft.indexOf("FIRST")).toBeLessThan(draft.indexOf("SECOND"));
  });
});

describe("safety contract", () => {
  it("system prompt forbids invention, diagnosis, decisions and Reg-40 certainty", () => {
    expect(ARIA_INCIDENT_SYSTEM_PROMPT).toMatch(/NEVER invent facts/);
    expect(ARIA_INCIDENT_SYSTEM_PROMPT).toMatch(/NEVER diagnose/);
    expect(ARIA_INCIDENT_SYSTEM_PROMPT).toMatch(/NEVER make safeguarding decisions/);
    expect(ARIA_INCIDENT_SYSTEM_PROMPT).toMatch(/manager should consider whether notification is required/);
  });

  it("disclaimer states the design principle", () => {
    expect(INCIDENT_DISCLAIMER).toMatch(/staff decide/i);
    expect(INCIDENT_DISCLAIMER).toMatch(/never replaces professional judgement/i);
  });

  it("child-voice prompt banks cover capture and respectful decline", () => {
    expect(CHILD_VOICE_PROMPTS.join(" ")).toMatch(/what helped/i);
    expect(CHILD_DECLINED_PROMPTS.join(" ")).toMatch(/respected/);
  });

  it("entry types match the spec", () => {
    expect(ENTRY_TYPES.map((e) => e.key)).toEqual(expect.arrayContaining([
      "observation", "staff_action", "child_voice", "safety_update",
      "manager_notification", "restorative_action", "deescalation_attempt", "risk_change", "other",
    ]));
  });
});
