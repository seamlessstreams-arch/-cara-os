import { describe, it, expect } from "vitest";
import { buildKnowledgeGraph } from "../knowledge-graph-engine";
import type { KnowledgeGraphInput } from "../types";

function inp(over: Partial<KnowledgeGraphInput> = {}): KnowledgeGraphInput {
  return { children: [], incidents: [], windowDays: 180, today: "2026-06-15", ...over };
}

describe("buildKnowledgeGraph", () => {
  it("builds nodes and edges from children, risks, locations and professionals", () => {
    const g = buildKnowledgeGraph(
      inp({
        children: [{ id: "a", name: "Alex", riskFlags: ["missing from care"], socialWorker: "Karen Holding" }],
        incidents: [{ childId: "a", type: "missing_from_care", location: "Community Park", date: "2026-06-01" }],
      }),
    );
    expect(g.nodes.some((n) => n.id === "child:a" && n.type === "child")).toBe(true);
    expect(g.nodes.some((n) => n.type === "risk")).toBe(true);
    expect(g.nodes.some((n) => n.type === "location")).toBe(true);
    expect(g.nodes.some((n) => n.type === "professional")).toBe(true);
    expect(g.stats.children).toBe(1);
    expect(g.edges.length).toBeGreaterThanOrEqual(3);
  });

  it("flags a location hotspot shared across children (priority at 3)", () => {
    const g = buildKnowledgeGraph(
      inp({
        children: [
          { id: "a", name: "Alex", riskFlags: [] },
          { id: "b", name: "Bo", riskFlags: [] },
          { id: "c", name: "Cy", riskFlags: [] },
        ],
        incidents: [
          { childId: "a", type: "missing_from_care", location: "Riverside", date: "2026-06-01" },
          { childId: "b", type: "incident", location: "Riverside", date: "2026-06-02" },
          { childId: "c", type: "incident", location: "Riverside", date: "2026-06-03" },
        ],
      }),
    );
    const h = g.insights.find((i) => i.kind === "location_hotspot");
    expect(h?.title).toMatch(/Riverside/);
    expect(h?.severity).toBe("priority"); // 3 children
  });

  it("flags a shared-risk cohort and a shared professional", () => {
    const g = buildKnowledgeGraph(
      inp({
        children: [
          { id: "a", name: "Alex", riskFlags: ["child exploitation"], socialWorker: "Karen Holding" },
          { id: "b", name: "Bo", riskFlags: ["child exploitation"], socialWorker: "Karen Holding" },
        ],
      }),
    );
    expect(g.insights.some((i) => i.kind === "shared_risk_cohort" && /exploitation/i.test(i.title))).toBe(true);
    const prof = g.insights.find((i) => i.kind === "shared_professional");
    expect(prof?.severity).toBe("info");
    expect(prof?.title).toMatch(/Karen Holding/);
  });

  it("flags a concentrated-risk child (≥3 distinct risks)", () => {
    const g = buildKnowledgeGraph(
      inp({ children: [{ id: "a", name: "Alex", riskFlags: ["missing from care", "child exploitation", "self-harm"] }] }),
    );
    const ins = g.insights.find((i) => i.kind === "concentrated_risk");
    expect(ins?.title).toMatch(/Alex carries multiple/);
  });

  it("flags a location that recurs for a single child", () => {
    const g = buildKnowledgeGraph(
      inp({
        children: [{ id: "a", name: "Alex", riskFlags: [] }],
        incidents: [
          { childId: "a", type: "incident", location: "Bedroom", date: "2026-06-01" },
          { childId: "a", type: "incident", location: "Bedroom", date: "2026-06-05" },
        ],
      }),
    );
    expect(g.insights.some((i) => i.kind === "recurring_location" && /Bedroom/.test(i.title))).toBe(true);
  });

  it("ignores incidents for non-current children", () => {
    const g = buildKnowledgeGraph(
      inp({ children: [{ id: "a", name: "Alex", riskFlags: [] }], incidents: [{ childId: "ghost", type: "incident", location: "X", date: "2026-06-01" }] }),
    );
    expect(g.nodes.some((n) => n.id === "child:ghost")).toBe(false);
    expect(g.stats.locations).toBe(0); // the ghost incident's location is not added
  });

  it("is deterministic", () => {
    const i = inp({
      children: [
        { id: "a", name: "Alex", riskFlags: ["x"], socialWorker: "Sw" },
        { id: "b", name: "Bo", riskFlags: ["x"], socialWorker: "Sw" },
      ],
      incidents: [{ childId: "a", type: "t", location: "L", date: "2026-06-01" }],
    });
    expect(buildKnowledgeGraph(i)).toEqual(buildKnowledgeGraph(i));
  });
});
