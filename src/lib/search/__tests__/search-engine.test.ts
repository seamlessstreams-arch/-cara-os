import { describe, it, expect } from "vitest";
import { search, searchChildren, searchStaff, searchIncidents, searchTasks, searchAll } from "../search-engine";

describe("Search Engine", () => {
  // ── Empty / trivial queries ─────────────────────────────────────────────
  describe("empty queries", () => {
    it("returns no results for an empty query", () => {
      const r = search({ query: "" });
      expect(r.total).toBe(0);
      expect(r.results).toHaveLength(0);
    });
    it("returns no results for whitespace", () => {
      expect(search({ query: "   " }).total).toBe(0);
    });
  });

  // ── Findability ─────────────────────────────────────────────────────────
  describe("findability", () => {
    it("finds the demo child 'Alex' when searching children", () => {
      const results = searchChildren("alex");
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.type === "child")).toBe(true);
      expect(results.some((r) => /alex/i.test(r.title))).toBe(true);
    });

    it("returns a well-formed SearchResult shape", () => {
      const r = searchChildren("alex")[0];
      expect(r).toBeDefined();
      expect(r.id).toBeTruthy();
      expect(r.type).toBe("child");
      expect(r.title).toBeTruthy();
      expect(typeof r.relevance).toBe("number");
      expect(r.url).toMatch(/^\//);
    });
  });

  // ── Type isolation ──────────────────────────────────────────────────────
  describe("type-scoped helpers", () => {
    it("searchChildren returns only children", () => {
      expect(searchChildren("a").every((r) => r.type === "child")).toBe(true);
    });
    it("searchStaff returns only staff", () => {
      expect(searchStaff("a").every((r) => r.type === "staff")).toBe(true);
    });
    it("searchIncidents returns only incidents", () => {
      expect(searchIncidents("a").every((r) => r.type === "incident")).toBe(true);
    });
    it("searchTasks returns only tasks", () => {
      expect(searchTasks("a").every((r) => r.type === "task")).toBe(true);
    });
    it("type filter in search() restricts result types", () => {
      const r = search({ query: "a", types: ["child"] });
      expect(r.results.every((res) => res.type === "child")).toBe(true);
    });
  });

  // ── Relevance + facets + pagination ─────────────────────────────────────
  describe("ranking and response", () => {
    it("results are sorted by relevance descending", () => {
      const r = search({ query: "a", limit: 50 });
      for (let i = 1; i < r.results.length; i++) {
        expect(r.results[i - 1].relevance).toBeGreaterThanOrEqual(r.results[i].relevance);
      }
    });

    it("builds type facets with counts", () => {
      const r = searchAll("a");
      expect(Array.isArray(r.facets)).toBe(true);
      if (r.facets.length > 0) {
        expect(r.facets[0]).toHaveProperty("type");
        expect(r.facets[0]).toHaveProperty("count");
      }
    });

    it("respects the limit (pagination)", () => {
      const r = search({ query: "a", limit: 3 });
      expect(r.results.length).toBeLessThanOrEqual(3);
      // total reflects all matches, not just the page
      expect(r.total).toBeGreaterThanOrEqual(r.results.length);
    });

    it("offset paginates past the first page", () => {
      const page1 = search({ query: "a", limit: 2, offset: 0 });
      const page2 = search({ query: "a", limit: 2, offset: 2 });
      if (page1.total > 2) {
        const ids1 = page1.results.map((r) => r.id);
        const ids2 = page2.results.map((r) => r.id);
        expect(ids2.some((id) => !ids1.includes(id))).toBe(true);
      }
    });

    it("reports a took_ms timing", () => {
      const r = search({ query: "alex" });
      expect(typeof r.took_ms).toBe("number");
      expect(r.took_ms).toBeGreaterThanOrEqual(0);
    });
  });

  // ── child_id filter ─────────────────────────────────────────────────────
  describe("child_id filter", () => {
    it("restricts results to a specific child", () => {
      const r = search({ query: "a", child_id: "yp_alex", limit: 50 });
      for (const res of r.results) {
        const matchesChild = res.type === "child" ? res.id === "yp_alex" : res.child_id === "yp_alex";
        expect(matchesChild).toBe(true);
      }
    });
  });
});
