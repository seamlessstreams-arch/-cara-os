import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildAskSnapshot } from "../build-snapshot";
import { answerQuestion, resolveChild, roleTier } from "../ask-cara-engine";
import { buildGroundingPack } from "../build-grounding";

// Real seeded store — Cara's information pull for a child must now include the
// calendar/diary (meetings, reviews, family time, appointments) and the child's
// own feedback, alongside the records and engines.
const snapshot = buildAskSnapshot(getStore());
const asOf = new Date().toISOString().slice(0, 10);
const ask = (question: string, role = "registered_manager") => answerQuestion({ question, asOf, role, snapshot });

describe("Ask CARA — child calendar, appointments & feedback", () => {
  it("snapshot carries the children's feedback (their words, sentiment, response)", () => {
    const fb = snapshot.feedback ?? [];
    expect(fb.length).toBeGreaterThan(0);
    const alex = fb.filter((f) => f.childId === "yp_alex");
    expect(alex.length).toBeGreaterThan(0);
    expect(typeof alex[0].text).toBe("string");
    expect(typeof alex[0].responded).toBe("boolean");
  });

  it("snapshot carries health appointments on record", () => {
    const ha = snapshot.healthAppointments ?? [];
    expect(ha.length).toBeGreaterThan(0);
    expect(ha[0].childId).toBeTruthy();
    expect(ha[0].date).toBeTruthy();
  });

  it("snapshot carries the per-child diary from the calendar projection", () => {
    // Structure guaranteed; content depends on seeded dates — never asserts counts.
    expect(Array.isArray(snapshot.childCalendar ?? [])).toBe(true);
    for (const c of snapshot.childCalendar ?? []) {
      expect(c.childId).toBeTruthy();
      expect(Array.isArray(c.upcoming)).toBe(true);
      expect(Array.isArray(c.attended)).toBe(true);
    }
  });

  it("routes 'what's coming up for Alex?' to the child calendar", () => {
    const a = ask("what's coming up for Alex?");
    expect(a.intent).toBe("child_calendar");
  });

  it("routes diary/appointment/meeting questions to the calendar", () => {
    expect(ask("what's on Alex's calendar?").intent).toBe("child_calendar");
    expect(ask("what appointments has Alex attended?").intent).toBe("child_calendar");
    expect(ask("any meetings planned this week?").intent).toBe("child_calendar"); // home level
  });

  it("routes 'what feedback has Alex given?' to the child's own feedback", () => {
    const a = ask("what feedback has Alex given?");
    expect(a.intent).toBe("child_feedback");
    expect(a.answered).toBe(true);
    expect(a.text.toLowerCase()).toContain("ignored"); // his seeded words surface
    expect(a.text).toContain("no response recorded"); // the accountability flag
  });

  it("does NOT steal neighbouring intents", () => {
    expect(ask("what's due this week?").intent).toBe("whats_due"); // home compliance keeps its skill
    expect(ask("how many incidents this week?").intent).toBe("incidents");
    expect(ask("tell me about Alex").intent).toBe("child_summary");
    expect(ask("who's overdue supervision?").intent).toBe("supervision"); // "supervision meeting" family stays put
  });

  it("grounds the LLM in the diary + feedback for a child question", () => {
    const answer = ask("tell me about Alex");
    const child = resolveChild("tell me about alex", snapshot);
    const pack = buildGroundingPack({ question: "tell me about Alex", snapshot, tier: roleTier("registered_manager"), answer, child, asOf });
    expect(pack).toContain("Their recent feedback");
    expect(pack).toContain("Health appointments on record");
  });
});
