// A visit is a projection of the persisted report. These pin the parts the
// Quality → Reg 44 page and the dashboards depend on.
import { describe, it, expect } from "vitest";
import { projectReg44Visit, reportFromLegacyVisit, trackerStatusOf } from "../visit-projection";
import { reg44Visits } from "@/lib/intelligence/fallback-store";
import type { PersistedReg44Report } from "../report-lifecycle";

const legacy = reg44Visits[0];
const base = (): PersistedReg44Report => reportFromLegacyVisit(legacy);

describe("projectReg44Visit", () => {
  it("keeps id, home, visit_date and visitor from the report meta", () => {
    const v = projectReg44Visit(base());
    expect(v.id).toBe(legacy.id);
    expect(v.home_id).toBe(legacy.home_id);
    expect(v.visit_date).toBe(legacy.visit_date);
    expect(v.visitor_name).toBe(legacy.visitor_name);
    expect(v.month).toBe(legacy.visit_date.slice(0, 7));
  });

  it("surfaces only sections that have real words — never a visitor prompt", () => {
    const r = base();
    r.status = "draft"; r.locked = false; r.signedSections = null; // an unsigned report reads its working sections
    r.sections = r.sections!.map((s) => (s.key === "O" ? { ...s, status: "needs_visitor_input", visitorMustComplete: true, content: "Visitor to record recommendations." } : s));
    const v = projectReg44Visit(r);
    expect(v.summary).toBe(legacy.summary);
    expect(v.concerns).toBeNull();
  });

  it("exports the frozen sections for a signed report", () => {
    const r = base();
    r.locked = true; r.status = "signed";
    r.signedSections = r.sections!.map((s) => (s.key === "A" ? { ...s, content: "Signed words." } : s));
    r.sections = r.sections!.map((s) => (s.key === "A" ? { ...s, content: "Later words." } : s));
    expect(projectReg44Visit(r).summary).toBe("Signed words.");
  });

  it("derives tracker status: draft → submitted (signed) → reviewed (manager responded)", () => {
    const r = base();
    r.status = "draft"; r.locked = false; r.managerResponse = null;
    expect(trackerStatusOf(r)).toBe("draft");
    r.status = "signed"; r.locked = true;
    expect(trackerStatusOf(r)).toBe("submitted");
    r.managerResponse = { text: "Done.", at: "t", by: "rm" };
    expect(trackerStatusOf(r)).toBe("reviewed");
  });

  it("a report with no meta still yields a usable visit_date (first of its month)", () => {
    const r = base();
    r.draft = { ...r.draft, meta: undefined as never };
    expect(projectReg44Visit(r).visit_date).toBe(`${r.month}-01`);
  });
});

describe("reportFromLegacyVisit (demo seeding)", () => {
  it("round-trips the legacy paragraphs through the section map", () => {
    const v = projectReg44Visit(base());
    expect(v.summary).toBe(legacy.summary);
    expect(v.strengths).toBe(legacy.strengths);
    expect(v.concerns).toBe(legacy.concerns);
    expect(v.children_views_summary).toBe(legacy.children_views_summary);
    expect(v.staff_views_summary).toBe(legacy.staff_views_summary);
  });

  it("a legacy 'submitted' visit becomes a signed, locked report with a frozen snapshot", () => {
    const r = reportFromLegacyVisit({ ...legacy, status: "submitted" });
    expect(r.status).toBe("signed");
    expect(r.locked).toBe(true);
    expect(r.signedSnapshot).not.toBeNull();
    expect(r.auditTrail.map((a) => a.action)).toContain("signed");
  });
});
