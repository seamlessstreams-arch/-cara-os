import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildAskSnapshot } from "../build-snapshot";
import { answerQuestion, resolveChild, roleTier } from "../ask-cara-engine";
import { buildRecordCatalogue, searchCatalogue, labelOf } from "../record-catalogue";
import { buildGroundingPack } from "../build-grounding";

// "ASK CARA MUST BE ABLE TO ACCESS THE COMPLETE APPLICATION" — the universal
// catalogue introspects EVERY store collection at runtime, so any record the
// specialists don't cover is still answerable, tier-scoped, never invented.
const snapshot = buildAskSnapshot(getStore());
const asOf = new Date().toISOString().slice(0, 10);
const ask = (question: string, role = "registered_manager") => answerQuestion({ question, asOf, role, snapshot });

describe("Ask CARA — universal record catalogue (complete application)", () => {
  it("introspects the whole store — hundreds of collections, current and future", () => {
    const cat = buildRecordCatalogue(getStore());
    expect(cat.length).toBeGreaterThan(400);
    const keys = new Set(cat.map((e) => e.key));
    for (const k of ["chronology", "handovers", "welfareChecks", "vehicleChecks", "vacancies"]) expect(keys.has(k)).toBe(true);
  });

  it("tier-gates management-sensitive collections by name heuristics", () => {
    const cat = buildRecordCatalogue(getStore());
    expect(cat.find((e) => e.key === "trainingRecords")?.tier).toBe("management");
    expect(cat.find((e) => e.key === "vacancies")?.tier).toBe("management");
    expect(cat.find((e) => e.key === "chronology")?.tier).toBe("care_team");
  });

  it("labelOf reads camelCase keys as words", () => {
    expect(labelOf("welfareChecks")).toBe("welfare checks");
    expect(labelOf("caraIncidentSessions")).toBe("cara incident sessions");
  });

  it("searchCatalogue matches record nouns, not generic words", () => {
    const cat = snapshot.catalogue!;
    expect(searchCatalogue("any chronology entries for Alex?", cat)[0]?.key).toBe("chronology");
    expect(searchCatalogue("what happened today?", cat)).toHaveLength(0); // generic → no match
  });

  it("answers a collection question the specialists don't cover", () => {
    const a = ask("how many chronology entries do we have?");
    expect(a.intent).toBe("record_lookup");
    expect(a.answered).toBe(true);
    expect(a.text).toMatch(/\d+ chronology record/);
  });

  it("child-scopes a lookup when a child is named", () => {
    const a = ask("any chronology entries for Alex?");
    expect(a.intent).toBe("record_lookup");
    expect(a.text).toContain("for Alex");
  });

  it("honestly gates a management-only collection for a care worker", () => {
    const rm = ask("any vacancies open at the moment?");
    expect(rm.intent).toBe("record_lookup");
    const cw = ask("any vacancies open at the moment?", "residential_care_worker");
    expect(cw.intent).toBe("access_denied");
  });

  it("specialists still win — the catalogue never steals routed intents", () => {
    expect(ask("how many incidents this week?").intent).toBe("incidents");
    expect(ask("tell me about Alex").intent).toBe("child_summary");
    expect(ask("are we recording strengths enough?").intent).toBe("strengths_recording");
    expect(ask("what does our policy say about missing from care?").intent).toBe("policy_guidance");
  });

  it("the LLM grounding carries the record index of the complete application", () => {
    const answer = ask("how is the home doing?");
    const pack = buildGroundingPack({ question: "how is the home doing?", snapshot, tier: roleTier("registered_manager"), answer, child: null, asOf });
    expect(pack).toContain("RECORD INDEX");
    expect(pack).toMatch(/\w+\(\d+\)/); // label(count) entries
  });

  it("the strengths champion is a display name, not a raw staff id", () => {
    const a = ask("are we recording strengths enough?");
    expect(a.text).not.toMatch(/\bstaff_[a-z]+ is the standout/);
  });
});
