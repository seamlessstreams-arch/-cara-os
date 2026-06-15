// ══════════════════════════════════════════════════════════════════════════════
// CARA — KNOWLEDGE GRAPH ENGINE (Layer 5)
//
// buildKnowledgeGraph(input) → { nodes, edges, insights }. Pure + deterministic.
// Nodes: children, risks, locations, professionals, incident types. Edges connect
// a child to each. Insights are the cross-entity patterns: location hotspots
// shared across children, shared-risk cohorts, social workers spanning children,
// concentrated-risk children, and locations that recur for one child.
// ══════════════════════════════════════════════════════════════════════════════

import {
  KNOWLEDGE_GRAPH_VERSION,
  KNOWLEDGE_GRAPH_DISCLAIMER,
  type KnowledgeGraphInput,
  type KnowledgeGraph,
  type GraphNode,
  type GraphEdge,
  type GraphInsight,
  type GraphNodeType,
  type Confidence,
} from "./types";

const slug = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
const humanType = (t: string) => t.replace(/_/g, " ");

function sharedConfidence(count: number): Confidence {
  return count >= 4 ? "high" : count >= 3 ? "medium" : "low";
}

export function buildKnowledgeGraph(input: KnowledgeGraphInput): KnowledgeGraph {
  const nodes = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();

  const addNode = (id: string, type: GraphNodeType, label: string) => {
    if (!nodes.has(id)) nodes.set(id, { id, type, label, degree: 0 });
  };
  const addEdge = (source: string, target: string, type: string) => {
    const key = `${source}|${target}|${type}`;
    const existing = edgeMap.get(key);
    if (existing) existing.weight += 1;
    else edgeMap.set(key, { source, target, type, weight: 1 });
  };

  // Reverse indexes for cross-entity insights.
  const locationChildren = new Map<string, Set<string>>(); // locId → child node ids
  const riskChildren = new Map<string, Set<string>>();
  const professionalChildren = new Map<string, Set<string>>();
  const childLabel = new Map<string, string>();

  // ── Children + their risks + social worker ───────────────────────────────
  for (const c of input.children) {
    const cid = `child:${c.id}`;
    addNode(cid, "child", c.name);
    childLabel.set(cid, c.name);

    for (const flag of c.riskFlags ?? []) {
      if (!flag?.trim()) continue;
      const rid = `risk:${slug(flag)}`;
      addNode(rid, "risk", flag);
      addEdge(cid, rid, "has_risk");
      (riskChildren.get(rid) ?? riskChildren.set(rid, new Set()).get(rid)!).add(cid);
    }
    if (c.socialWorker?.trim()) {
      const pid = `prof:${slug(c.socialWorker)}`;
      addNode(pid, "professional", c.socialWorker);
      addEdge(cid, pid, "social_worker");
      (professionalChildren.get(pid) ?? professionalChildren.set(pid, new Set()).get(pid)!).add(cid);
    }
  }

  // ── Incidents → locations + types (within window) ────────────────────────
  const childLocationCount = new Map<string, number>(); // `${cid}|${locId}` → count
  for (const i of input.incidents) {
    const cid = `child:${i.childId}`;
    if (!nodes.has(cid)) continue; // ignore incidents for non-current children
    if (i.type?.trim()) {
      const tid = `type:${slug(i.type)}`;
      addNode(tid, "incident_type", humanType(i.type));
      addEdge(cid, tid, "incident_of_type");
    }
    if (i.location?.trim()) {
      const lid = `loc:${slug(i.location)}`;
      addNode(lid, "location", i.location);
      addEdge(cid, lid, "incident_at");
      (locationChildren.get(lid) ?? locationChildren.set(lid, new Set()).get(lid)!).add(cid);
      const k = `${cid}|${lid}`;
      childLocationCount.set(k, (childLocationCount.get(k) ?? 0) + 1);
    }
  }

  // ── Degrees ───────────────────────────────────────────────────────────────
  for (const e of edgeMap.values()) {
    const s = nodes.get(e.source);
    const t = nodes.get(e.target);
    if (s) s.degree += 1;
    if (t) t.degree += 1;
  }

  // ── Insights (the cross-entity patterns) ────────────────────────────────────
  const insights: GraphInsight[] = [];
  const nameOf = (cid: string) => childLabel.get(cid) ?? cid;

  // 1. Location hotspots shared by ≥2 children.
  for (const [lid, children] of locationChildren) {
    if (children.size >= 2) {
      const label = nodes.get(lid)?.label ?? lid;
      insights.push({
        kind: "location_hotspot",
        title: `Shared location: ${label}`,
        detail: `${children.size} children have incidents linked to "${label}". Consider a contextual-safeguarding view of this location.`,
        entities: [lid, ...children],
        severity: children.size >= 3 ? "priority" : "watch",
        confidence: sharedConfidence(children.size),
      });
    }
  }

  // 2. Shared-risk cohorts (≥2 children with the same risk).
  for (const [rid, children] of riskChildren) {
    if (children.size >= 2) {
      const label = nodes.get(rid)?.label ?? rid;
      insights.push({
        kind: "shared_risk_cohort",
        title: `Shared risk: ${label}`,
        detail: `${children.size} children share the recorded risk "${label}" — a cohort lens (and any common context) may help.`,
        entities: [rid, ...children],
        severity: children.size >= 3 ? "priority" : "watch",
        confidence: sharedConfidence(children.size),
      });
    }
  }

  // 3. Social worker spanning ≥2 children (coordination opportunity).
  for (const [pid, children] of professionalChildren) {
    if (children.size >= 2) {
      const label = nodes.get(pid)?.label ?? pid;
      insights.push({
        kind: "shared_professional",
        title: `Shared professional: ${label}`,
        detail: `${label} is the social worker for ${children.size} children — a coordination point for consistent practice.`,
        entities: [pid, ...children],
        severity: "info",
        confidence: sharedConfidence(children.size),
      });
    }
  }

  // 4. Concentrated-risk child (≥3 distinct recorded risks).
  for (const c of input.children) {
    const distinctRisks = new Set((c.riskFlags ?? []).filter((f) => f?.trim()).map((f) => slug(f)));
    if (distinctRisks.size >= 3) {
      const cid = `child:${c.id}`;
      insights.push({
        kind: "concentrated_risk",
        title: `${c.name} carries multiple concurrent risks`,
        detail: `${c.name} has ${distinctRisks.size} distinct recorded risk areas — ensure the plan holds them together rather than in silos.`,
        entities: [cid],
        severity: "watch",
        confidence: distinctRisks.size >= 4 ? "high" : "medium",
      });
    }
  }

  // 5. A location that recurs for a single child.
  for (const [k, count] of childLocationCount) {
    if (count >= 2) {
      const [cid, lid] = k.split("|");
      insights.push({
        kind: "recurring_location",
        title: `${nameOf(cid)} — repeated incidents at ${nodes.get(lid)?.label ?? lid}`,
        detail: `${count} incidents for ${nameOf(cid)} are linked to this location — worth understanding what about it raises risk.`,
        entities: [cid, lid],
        severity: "watch",
        confidence: sharedConfidence(count),
      });
    }
  }

  // Order: priority → watch → info, then by confidence.
  const sevRank = { priority: 0, watch: 1, info: 2 } as const;
  const confRank = { high: 0, medium: 1, low: 2 } as const;
  insights.sort((a, b) => sevRank[a.severity] - sevRank[b.severity] || confRank[a.confidence] - confRank[b.confidence]);

  const nodeList = [...nodes.values()];
  const countType = (t: GraphNodeType) => nodeList.filter((n) => n.type === t).length;

  return {
    nodes: nodeList,
    edges: [...edgeMap.values()],
    insights,
    stats: {
      children: countType("child"),
      risks: countType("risk"),
      locations: countType("location"),
      professionals: countType("professional"),
      edges: edgeMap.size,
    },
    confidence: insights.some((i) => i.confidence === "high") ? "high" : insights.length ? "medium" : "low",
    disclaimer: KNOWLEDGE_GRAPH_DISCLAIMER,
    engineVersion: KNOWLEDGE_GRAPH_VERSION,
    generatedAt: input.today,
  };
}
