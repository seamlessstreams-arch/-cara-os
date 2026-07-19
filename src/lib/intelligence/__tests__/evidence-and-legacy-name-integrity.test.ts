import { describe, it, expect } from "vitest";
import {
  reg44Visits,
  reg44Actions,
  reg45Reviews,
  reg45Evidence,
  incidentLearningReviews,
  voiceEntries,
  progressGoals,
  progressEntries,
  outcomeSnapshots,
  evidenceItems,
  staffPassportRecords,
  providerHomeSummaries,
  providerOversightLog,
  attentionItems,
  caraSuggestions,
  hrCases,
  hrOverdueTasks,
  hrRecruitment,
  hrInspectionWorkforce,
  hrInspectionRecruitment,
  hrInspectionCases,
  hrInspectionChronology,
  hrInspectionSuspensions,
  hrInspectionLado,
  hrInspectionCompliance,
  hrInspectionOversight,
} from "@/lib/intelligence/fallback-store";
import { STAFF } from "@/lib/seed-data";

// Two guards closing out the fallback store's phantom-staff arc
// (PRs #767/#770/#771/#773/#774).
//
// 1. evidenceItems.created_by — the Ofsted Evidence Room's "Recorded by"
//    line — must name rostered staff. The seed shipped "Darren Laville",
//    "Sarah Mitchell", "James Connor", and "Margaret Thompson", none of whom
//    are on the fictionalised roster. External people do not record evidence
//    in the home's system: the independent visitor's name lives in the
//    reg44Visits.visitor_name free-text field, not here, so no external
//    allowance applies (the Reg 44 evidence item is recorded by the RM).
//
// 2. The legacy real names the fictionalised roster replaced —
//    "Darren Laville" and "Ryan Mitchell" — must not appear in ANY string of
//    any seeded fallback collection. Per-field guards cover fields with
//    strict semantics; this sweep catches the long tail (passport
//    compliments/restrictions, future seeds) where legitimate external
//    actors ("Ofsted Inspector", "Regional Inspector") make a
//    roster-membership rule impossible.
//
// The "Staff A–F" passport cast and its in-universe references (e.g.
// "Sarah Mitchell (Senior)" = Staff A) are a deliberately aliased demo
// universe — not covered by a roster rule, only by the banned-names sweep.
const ROSTER_NAMES = new Set(STAFF.map((s) => s.full_name));

const SEEDED_COLLECTIONS: Record<string, unknown> = {
  reg44Visits,
  reg44Actions,
  reg45Reviews,
  reg45Evidence,
  incidentLearningReviews,
  voiceEntries,
  progressGoals,
  progressEntries,
  outcomeSnapshots,
  evidenceItems,
  staffPassportRecords,
  providerHomeSummaries,
  providerOversightLog,
  attentionItems,
  caraSuggestions,
  hrCases,
  hrOverdueTasks,
  hrRecruitment,
  hrInspectionWorkforce,
  hrInspectionRecruitment,
  hrInspectionCases,
  hrInspectionChronology,
  hrInspectionSuspensions,
  hrInspectionLado,
  hrInspectionCompliance,
  hrInspectionOversight,
};

const BANNED_LEGACY_NAMES = ["Darren Laville", "Ryan Mitchell"];

describe("seeded evidence items reference only rostered staff", () => {
  it("has seeded evidence items to check — guards against a vacuous pass", () => {
    expect(evidenceItems.length).toBeGreaterThan(0);
  });

  it("resolves every evidence item's created_by to a rostered staff name", () => {
    const phantoms = evidenceItems
      .filter((e) => e.created_by && !ROSTER_NAMES.has(e.created_by))
      .map((e) => `${e.id}.created_by → "${e.created_by}"`);
    expect(phantoms, `phantom staff names in seeded evidence items: ${phantoms.join(", ")}`).toEqual([]);
  });
});

describe("legacy real names are banned from every seeded fallback collection", () => {
  it("has seeded collections to sweep — guards against a vacuous pass", () => {
    expect(evidenceItems.length).toBeGreaterThan(0);
    expect(staffPassportRecords.length).toBeGreaterThan(0);
  });

  it("contains no banned legacy name in any string value", () => {
    const hits: string[] = [];
    for (const [name, rows] of Object.entries(SEEDED_COLLECTIONS)) {
      const corpus = JSON.stringify(rows);
      for (const banned of BANNED_LEGACY_NAMES) {
        if (corpus.includes(banned)) hits.push(`${name} contains "${banned}"`);
      }
    }
    expect(hits, `banned legacy names in seeded collections: ${hits.join(", ")}`).toEqual([]);
  });
});
