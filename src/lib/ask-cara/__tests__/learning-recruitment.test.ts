import { describe, it, expect } from "vitest";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { getStore } from "@/lib/db/store";

const snap = buildAskSnapshot(getStore());
const ask = (q: string, role = "registered_manager") =>
  answerQuestion({ question: q, asOf: new Date().toISOString().slice(0, 10), snapshot: snap, role });

describe("Ask CARA orchestrator — organisational learning + safer recruitment", () => {
  it("answers 'what themes are emerging from incidents?' from the §21 learning report", () => {
    const a = ask("What themes are emerging from incidents?");
    expect(a.intent).toBe("org_learning");
    expect(a.answered).toBe(true);
    expect(a.sources.some((s) => s.label === "Evidence items")).toBe(true);
    // Must NOT be hijacked by the generic incidents skill despite the keyword.
    expect(a.intent).not.toBe("incidents");
  });

  it("answers whole-team staff-file questions with DBS posture", () => {
    const a = ask("Are staff files compliant?");
    expect(a.intent).toBe("safer_recruitment");
    expect(a.answered).toBe(true);
    expect(a.text.toLowerCase()).toContain("dbs");
    expect(a.disclaimer?.toLowerCase()).toContain("remain the manager");
  });

  it("answers a NAMED staff member's file currency, framed as compliance not character", () => {
    const name = snap.staff[0]?.name.split(/\s+/)[0] ?? "Marcus";
    const a = ask(`Is ${name} safe to work?`);
    expect(a.intent).toBe("safer_recruitment");
    expect(a.answered).toBe(true);
    expect(a.text).toContain("file currency");
    expect(a.text.toLowerCase()).toContain("stays human");
  });

  it("both domains are management-gated", () => {
    expect(ask("What are we learning as an organisation?", "residential_care_worker").intent).toBe("access_denied");
    expect(ask("Are staff files compliant?", "residential_care_worker").intent).toBe("access_denied");
  });

  it("no regressions on neighbouring skills", () => {
    expect(ask("How many incidents this week?").intent).toBe("incidents");
    expect(ask("Who's overdue training?").intent).toBe("training");
    expect(ask("Is the rota safe this week?").intent).toBe("rota_safety");
    expect(ask("What triggers Alex?").intent).toBe("child_triggers");
  });
});
