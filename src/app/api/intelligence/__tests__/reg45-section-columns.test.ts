import { describe, it, expect } from "vitest";
import { reg45SectionColumns } from "@/app/api/intelligence/reg45/route";

// Before this, the Reg 45 PATCH accepted exactly three keys — `content`,
// `findings`, `recommendations` — and mapped them onto the wrong columns:
// `title` and `content` BOTH wrote quality_of_care_summary. Eleven of the
// twelve narrative sections could not be saved at all, which is why the
// "Request Cara Draft" buttons had nowhere to put a draft even before the
// question of who writes it.
//
// The allowlist is the same shape as the reg44 response fields (#936) and the
// competence columns (#939): name what is writable, so a caller cannot reach
// past it into the rest of the review.

describe("reg45SectionColumns — the section you name is the section written", () => {
  it("maps each section to its own column", () => {
    expect(reg45SectionColumns({ safeguardingSummary: "text" })).toEqual({ safeguarding_summary: "text" });
    expect(reg45SectionColumns({ childrenViews: "text" })).toEqual({ children_views: "text" });
    expect(reg45SectionColumns({ improvementActions: "text" })).toEqual({ improvement_actions: "text" });
  });

  it("no longer collapses two sections onto one column", () => {
    const cols = reg45SectionColumns({ qualityOfCareSummary: "A", outcomesSummary: "B" });
    expect(cols).toEqual({ quality_of_care_summary: "A", outcomes_summary: "B" });
  });

  it("covers all twelve sections", () => {
    const all = reg45SectionColumns({
      qualityOfCareSummary: "1", childrenExperiencesSummary: "2", outcomesSummary: "3",
      safeguardingSummary: "4", leadershipSummary: "5", strengths: "6", weaknesses: "7",
      improvementActions: "8", childrenViews: "9", parentsViews: "10",
      placingAuthorityViews: "11", staffViews: "12",
    });
    expect(Object.keys(all)).toHaveLength(12);
  });

  it("writes nothing for a section that was not supplied", () => {
    const cols = reg45SectionColumns({ strengths: "text" });
    expect(cols).not.toHaveProperty("weaknesses");
    expect(cols).not.toHaveProperty("approved_by");
  });

  it("ignores keys that are not sections — the door does not open onto the rest of the review", () => {
    expect(reg45SectionColumns({ approvedBy: "someone", status: "approved", id: "r1" })).toEqual({});
  });

  it("treats a blank string as not supplied, so a draft cannot erase a written section", () => {
    expect(reg45SectionColumns({ strengths: "" })).toEqual({});
    expect(reg45SectionColumns({ strengths: "   " })).toEqual({});
  });

  it("ignores a non-string value rather than coercing it", () => {
    expect(reg45SectionColumns({ strengths: 42 })).toEqual({});
    expect(reg45SectionColumns({ strengths: null })).toEqual({});
  });
});
