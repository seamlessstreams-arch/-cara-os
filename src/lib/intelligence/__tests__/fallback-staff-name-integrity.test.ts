import { describe, it, expect } from "vitest";
import {
  voiceEntries,
  incidentLearningReviews,
  progressEntries,
  reg45Reviews,
  providerHomeSummaries,
} from "@/lib/intelligence/fallback-store";
import { STAFF } from "@/lib/seed-data";

// Sibling of the id guards (reg44-staff-integrity, reg44-action-staff-
// integrity, contact-log-staff-integrity) for the fallback store's NAME-typed
// staff fields. voiceEntries.created_by is documented "staff member name",
// and every render site shows these values verbatim (children/voice,
// incidents/learning-review "Staff involved: …", children/progress "by …",
// quality/reg-45 "Approved by …", provider-oversight "Manager: …") — so a
// name that is on no roster puts a phantom person on screen. This seed
// shipped "Sarah Mitchell", "James Cooper", "Tom Richards", and
// "Darren Laville" — none of whom exist in the fictionalised roster. Same
// class as PRs #767/#770/#771/#773, in name-typed fields instead of ids.
//
// Deliberately NOT covered: evidenceItems (a separate demo universe under
// home "h1" with its own children) and staffPassportRecords (self-contained
// "Staff A–F" aliased personas) — both are excluded until their surfaces are
// aligned; reg44Visits.visitor_name (external independent visitor, free
// text); and prose narrative, which a field test cannot see.
//
// A trailing role parenthetical is allowed — "Patricia Nolan (RI)" names the
// rostered RI with her role, matching how the field renders.
const ROSTER_NAMES = new Set(STAFF.map((s) => s.full_name));
const bare = (v: string) => v.replace(/\s*\([^)]*\)\s*$/, "");
const isRostered = (v: string) => ROSTER_NAMES.has(bare(v));
const SEEDED_HOME = "home_oak";

describe("seeded fallback name-typed staff fields reference only rostered people", () => {
  const voice = voiceEntries.filter((v) => v.home_id === SEEDED_HOME);
  const reviews = incidentLearningReviews.filter((r) => r.home_id === SEEDED_HOME);
  const progress = progressEntries.filter((p) => p.home_id === SEEDED_HOME);
  const reg45 = reg45Reviews.filter((r) => r.home_id === SEEDED_HOME);

  it("has seeded rows in every guarded collection — guards against a vacuous pass", () => {
    expect(voice.length).toBeGreaterThan(0);
    expect(reviews.length).toBeGreaterThan(0);
    expect(progress.length).toBeGreaterThan(0);
    expect(reg45.length).toBeGreaterThan(0);
  });

  it("resolves every voice entry's created_by to a rostered staff name", () => {
    const phantoms = voice
      .filter((v) => v.created_by && !isRostered(v.created_by))
      .map((v) => `${v.id}.created_by → "${v.created_by}"`);
    expect(phantoms, `phantom staff names in seeded voice entries: ${phantoms.join(", ")}`).toEqual([]);
  });

  it("resolves every learning review's staff_involved to rostered staff names", () => {
    const phantoms: string[] = [];
    for (const review of reviews) {
      for (const name of review.staff_involved) {
        if (name && !isRostered(name)) phantoms.push(`${review.id}.staff_involved → "${name}"`);
      }
    }
    expect(phantoms, `phantom staff names in seeded learning reviews: ${phantoms.join(", ")}`).toEqual([]);
  });

  it("resolves every progress entry's staff_member to a rostered staff name", () => {
    const phantoms = progress
      .filter((p) => p.staff_member && !isRostered(p.staff_member))
      .map((p) => `${p.id}.staff_member → "${p.staff_member}"`);
    expect(phantoms, `phantom staff names in seeded progress entries: ${phantoms.join(", ")}`).toEqual([]);
  });

  it("resolves every Reg 45 review's generated_by and approved_by to rostered staff names", () => {
    const phantoms: string[] = [];
    for (const review of reg45) {
      for (const field of ["generated_by", "approved_by"] as const) {
        const name = review[field];
        if (name && !isRostered(name)) phantoms.push(`${review.id}.${field} → "${name}"`);
      }
    }
    expect(phantoms, `phantom staff names in seeded Reg 45 reviews: ${phantoms.join(", ")}`).toEqual([]);
  });

  it("names a rostered manager on the home's own provider summary", () => {
    const oak = providerHomeSummaries.find((h) => h.name === "Chamberlain House");
    expect(oak, "Chamberlain House summary missing — vacuous pass").toBeTruthy();
    expect(
      isRostered(oak.manager),
      `provider summary manager → "${oak.manager}" is not on the roster`,
    ).toBe(true);
  });
});
