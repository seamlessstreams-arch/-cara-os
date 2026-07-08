import { describe, it, expect } from "vitest";
import { getChildTwin } from "@/lib/cpie/get-child-twin";
import { buildCpie360Spine } from "@/lib/cpie/child-360-spine";

describe("CPIE — Child-360 whole-child spine (consolidation)", () => {
  it("distils the canonical twin into the 360 lead spine", () => {
    const twin = getChildTwin("yp_alex")!;
    const spine = buildCpie360Spine(twin);
    expect(spine.who.toLowerCase()).toContain("football");
    expect(spine.strengths.length).toBeGreaterThan(0);
    expect(["improving", "stable", "declining", "not yet readable"]).toContain(spine.directionOfTravel);
    expect(spine.livedExperienceRead.length).toBeGreaterThan(0);
    expect(spine.engineVersion).toBe(twin.engineVersion);
  });

  it("is the SAME source the other consumers read — the spine matches the twin, not a re-derivation", () => {
    const twin = getChildTwin("yp_alex")!;
    const spine = buildCpie360Spine(twin);
    // The spine's reads are the twin's reads verbatim — one source of truth.
    expect(spine.directionOfTravel).toBe(twin.progress.data.trajectory ?? "not yet readable");
    expect(spine.emotionalStatus).toBe(twin.emotional.data.status ?? "unknown");
    expect(spine.relationalStatus).toBe(twin.relationships.data.relationalStatus ?? "developing");
    expect(spine.livedExperienceRead).toBe(twin.goodParenting.data.livedExperienceRead);
    expect(spine.curiosityPrompt).toBe(twin.curiosity.data.reflectiveQuestions[0]);
  });

  it("carries the child's own voice when the twin holds a quote", () => {
    const twin = getChildTwin("yp_alex")!;
    const spine = buildCpie360Spine(twin);
    // Alex has recorded quotes in the twin's voice dimension.
    expect(spine.childVoice).toBeTruthy();
  });

  it("degrades honestly for a sparse child (Casey) without throwing", () => {
    const twin = getChildTwin("yp_casey");
    expect(twin).toBeTruthy();
    const spine = buildCpie360Spine(twin!);
    // Still returns a valid spine; lived-experience read flags the gap.
    expect(spine.livedExperienceRead.toLowerCase()).toContain("care delivered more than a childhood");
    expect(typeof spine.who).toBe("string");
  });
});
