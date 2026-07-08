import { describe, it, expect } from "vitest";
import { answerQuestion, askCARAOrchestrator } from "@/lib/ask-cara/ask-cara-engine";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { getStore } from "@/lib/db/store";

const snap = buildAskSnapshot(getStore());
const ask = (q: string, role = "registered_manager") =>
  answerQuestion({ question: q, asOf: new Date().toISOString().slice(0, 10), snapshot: snap, role });

describe("Ask CARA orchestrator — operational domains", () => {
  it("is the formal orchestrator (single front door)", () => {
    expect(askCARAOrchestrator).toBe(answerQuestion);
    expect(snap.ops).toBeTruthy();
  });

  it("answers health & safety questions from the premises picture", () => {
    const a = ask("What health and safety checks are overdue?");
    expect(a.intent).toBe("health_safety");
    expect(a.answered).toBe(true);
    expect(a.sources.length).toBeGreaterThan(0);
    // Honest about fire drills either way (count or missing-record nudge).
    expect(a.text.toLowerCase()).toContain("fire drill");
  });

  it("answers rota-safety questions for managers and denies care staff", () => {
    const a = ask("Is the rota safe this week?");
    expect(a.intent).toBe("rota_safety");
    expect(a.text.length).toBeGreaterThan(20);
    expect(ask("Is the rota safe this week?", "residential_care_worker").intent).toBe("access_denied");
  });

  it("answers staff wellbeing as an aggregate only (data minimisation)", () => {
    const a = ask("Are there any staff wellbeing concerns?");
    expect(a.intent).toBe("staff_wellbeing");
    expect(a.answered).toBe(true);
    expect(a.text.toLowerCase()).toContain("aggregate");
    // No individual named with a health detail — the aggregate framing line is present.
    expect(a.disclaimer?.toLowerCase()).toContain("individual");
  });

  it("keeps a named child's wellbeing question a CHILD question", () => {
    const a = ask("How is Alex's wellbeing?");
    expect(a.intent).not.toBe("staff_wellbeing");
  });

  it("answers Regulation 44 outstanding-actions questions", () => {
    const a = ask("What actions are outstanding from Regulation 44?");
    expect(a.intent).toBe("reg44");
    expect(a.answered).toBe(true);
    expect(a.text).toContain("Regulation 44");
  });

  it("what's-due now carries the compliance calendar", () => {
    const a = ask("What's due this week?");
    expect(a.intent).toBe("whats_due");
    expect(a.answered).toBe(true);
  });

  it("no regressions across the orchestrator's other domains", () => {
    expect(ask("What needs my attention?").intent).toBe("attention");
    expect(ask("Are we ready for inspection?").intent).toBe("inspection_readiness");
    expect(ask("What is the CARE model?").intent).toBe("practice_guidance");
    expect(ask("What triggers Alex?").intent).toBe("child_triggers");
    expect(ask("Who is on shift today?").intent).toBe("staffing");
  });
});
