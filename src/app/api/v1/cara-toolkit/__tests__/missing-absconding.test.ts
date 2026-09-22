import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/v1/cara-toolkit/missing-absconding/route";

// The page has fetched this route since it was written; the route did not
// exist, so the page rendered its error state on every tenant.
describe("GET /api/v1/cara-toolkit/missing-absconding", () => {
  it("answers the analysis shape the page renders", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(typeof data.totalEpisodes).toBe("number");
    expect(Array.isArray(data.episodes)).toBe(true);
    expect(Array.isArray(data.riskLevelBreakdown)).toBe(true);
    expect(data.riskLevelBreakdown.map((r: { level: string }) => r.level)).toEqual(["critical", "high", "medium", "low"]);
    expect(["green", "amber", "red", "grey"]).toContain(data.overallSignal);
    expect(typeof data.regulatoryNote).toBe("string");
    for (const e of data.episodes) {
      expect(e.childInitials).not.toMatch(/\s/); // initials, never a name
      expect(typeof e.currentlyMissing).toBe("boolean");
    }
    if (data.totalEpisodes === 0) expect(data.overallSignal).toBe("grey");
  });
});
