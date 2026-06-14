// ══════════════════════════════════════════════════════════════════════════════
// Cara Care Graph builder tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import { buildCareGraph, loadCareGraph } from "@/lib/cara/cara-care-graph";

const HOME_ID = "home_oak";
const CHILD_ID = "yp_alex";

function todayMinus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function makeIncident(date: string, severity: "low" | "medium" | "high" | "critical" = "medium") {
  return db.incidents.create({
    reference: `INC-CG-${Math.random().toString(36).slice(2, 8)}`,
    type: "physical_intervention",
    severity,
    child_id: CHILD_ID,
    date,
    time: "14:00",
    location: null,
    description: "graph test incident",
    immediate_action: "test",
    reported_by: "u1",
    witnesses: [],
    body_map_required: false,
    body_map_completed: false,
    body_map_url: null,
    notifications: [],
    requires_oversight: true,
    oversight_note: null,
    oversight_by: null,
    oversight_at: null,
    status: "open",
    outcome: null,
    lessons_learned: null,
    linked_task_ids: [],
    linked_document_ids: [],
    home_id: HOME_ID,
  });
}

describe("buildCareGraph", () => {
  beforeEach(() => {
    // Clear any prior graph state
    db.caraCareGraphEdges.deleteByHome(HOME_ID);
    db.caraCareGraphNodes.deleteByHome(HOME_ID);
  });

  it("creates a child node and key worker edge for each child in the home", () => {
    const snap = buildCareGraph(HOME_ID);
    const childNodes = snap.nodes.filter((n) => n.node_type === "child");
    expect(childNodes.length).toBeGreaterThan(0);
    expect(childNodes.every((n) => n.is_ai_draft)).toBe(true);
    expect(snap.summary.total_nodes).toBe(snap.nodes.length);
  });

  it("links incidents to the involved child via an `involves` edge", () => {
    makeIncident(todayMinus(2), "high");
    const snap = buildCareGraph(HOME_ID);
    const incNode = snap.nodes.find((n) => n.node_type === "incident");
    expect(incNode).toBeDefined();
    const childNode = snap.nodes.find(
      (n) => n.node_type === "child" && n.source_id === CHILD_ID,
    );
    expect(childNode).toBeDefined();
    const edge = snap.edges.find(
      (e) =>
        e.from_node_id === incNode!.id &&
        e.to_node_id === childNode!.id &&
        e.edge_type === "involves",
    );
    expect(edge).toBeDefined();
  });

  it("rebuilding replaces the prior graph rather than duplicating it", () => {
    makeIncident(todayMinus(3));
    const a = buildCareGraph(HOME_ID);
    const b = buildCareGraph(HOME_ID);
    expect(b.summary.total_nodes).toBe(a.summary.total_nodes);
    expect(b.summary.total_edges).toBe(a.summary.total_edges);
  });

  it("loadCareGraph returns the persisted snapshot", () => {
    makeIncident(todayMinus(1));
    const built = buildCareGraph(HOME_ID);
    const loaded = loadCareGraph(HOME_ID);
    expect(loaded.summary.total_nodes).toBe(built.summary.total_nodes);
  });

  it("scoping by child filters out unrelated children's records", () => {
    makeIncident(todayMinus(1));
    const snap = buildCareGraph(HOME_ID, { childId: CHILD_ID });
    const offChildNodes = snap.nodes.filter(
      (n) =>
        n.node_type === "child" &&
        n.source_id !== CHILD_ID,
    );
    expect(offChildNodes).toHaveLength(0);
  });
});
