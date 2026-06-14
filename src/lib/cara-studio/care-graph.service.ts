// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — CARE KNOWLEDGE GRAPH SERVICE
//
// Builds and queries a knowledge graph that connects children, incidents,
// risks, protective factors, plans, actions, outcomes, staff, and evidence.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type {
  CaraStudioCareGraphNode,
  CaraStudioCareGraphEdge,
  CaraStudioNodeType,
} from "@/types/cara-studio";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

// ── Create / Upsert node ────────────────────────────────────────────────────

export async function upsertGraphNode(
  node: Omit<CaraStudioCareGraphNode, "id" | "created_at" | "updated_at"> & { id?: string },
): Promise<CaraStudioCareGraphNode | null> {
  const sb = createServerClient();
  if (!sb) return null;

  const { data, error } = await (sb.from("cara_studio_care_graph_nodes") as any)
    .upsert(
      { ...node, home_id: node.home_id || homeId(), updated_at: new Date().toISOString() },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error) {
    console.error("[cara-studio/care-graph] upsertGraphNode error:", error);
    return null;
  }
  return data as CaraStudioCareGraphNode;
}

// ── Create edge ─────────────────────────────────────────────────────────────

export async function createGraphEdge(
  edge: Omit<CaraStudioCareGraphEdge, "id" | "created_at" | "updated_at">,
): Promise<CaraStudioCareGraphEdge | null> {
  const sb = createServerClient();
  if (!sb) return null;

  const { data, error } = await (sb.from("cara_studio_care_graph_edges") as any)
    .insert(edge)
    .select()
    .single();

  if (error) {
    console.error("[cara-studio/care-graph] createGraphEdge error:", error);
    return null;
  }
  return data as CaraStudioCareGraphEdge;
}

// ── Query: get nodes by type ────────────────────────────────────────────────

export async function getNodesByType(
  nodeType: CaraStudioNodeType,
  childId?: string,
): Promise<CaraStudioCareGraphNode[]> {
  const sb = createServerClient();
  if (!sb) return getDemoNodes(nodeType);

  let query = (sb.from("cara_studio_care_graph_nodes") as any)
    .select("*")
    .eq("home_id", homeId())
    .eq("node_type", nodeType)
    .order("created_at", { ascending: false });

  if (childId) query = query.eq("linked_record_id", childId);

  const { data, error } = await query;
  if (error) {
    console.error("[cara-studio/care-graph] getNodesByType error:", error);
    return [];
  }
  return (data ?? []) as CaraStudioCareGraphNode[];
}

// ── Query: get edges from/to a node ─────────────────────────────────────────

export async function getEdgesForNode(
  nodeId: string,
  direction: "from" | "to" | "both" = "both",
): Promise<CaraStudioCareGraphEdge[]> {
  const sb = createServerClient();
  if (!sb) return [];

  if (direction === "from") {
    const { data } = await (sb.from("cara_studio_care_graph_edges") as any)
      .select("*").eq("from_node_id", nodeId);
    return (data ?? []) as CaraStudioCareGraphEdge[];
  }

  if (direction === "to") {
    const { data } = await (sb.from("cara_studio_care_graph_edges") as any)
      .select("*").eq("to_node_id", nodeId);
    return (data ?? []) as CaraStudioCareGraphEdge[];
  }

  const { data: fromData } = await (sb.from("cara_studio_care_graph_edges") as any)
    .select("*").eq("from_node_id", nodeId);
  const { data: toData } = await (sb.from("cara_studio_care_graph_edges") as any)
    .select("*").eq("to_node_id", nodeId);

  return [
    ...((fromData ?? []) as CaraStudioCareGraphEdge[]),
    ...((toData ?? []) as CaraStudioCareGraphEdge[]),
  ];
}

// ── Query: child knowledge graph ────────────────────────────────────────────

export interface ChildKnowledgeGraph {
  childNode: CaraStudioCareGraphNode | null;
  nodes: CaraStudioCareGraphNode[];
  edges: CaraStudioCareGraphEdge[];
}

export async function getChildKnowledgeGraph(childId: string): Promise<ChildKnowledgeGraph> {
  const sb = createServerClient();
  if (!sb) return getDemoChildGraph(childId);

  const { data: childNodes } = await (sb.from("cara_studio_care_graph_nodes") as any)
    .select("*")
    .eq("home_id", homeId())
    .eq("node_type", "child")
    .eq("linked_record_id", childId)
    .limit(1);

  const childNode = ((childNodes as CaraStudioCareGraphNode[] | null)?.[0]) ?? null;
  if (!childNode) return { childNode: null, nodes: [], edges: [] };

  const edges = await getEdgesForNode(childNode.id);
  const relatedNodeIds = new Set<string>();
  edges.forEach((e) => {
    relatedNodeIds.add(e.from_node_id);
    relatedNodeIds.add(e.to_node_id);
  });
  relatedNodeIds.delete(childNode.id);

  let nodes: CaraStudioCareGraphNode[] = [childNode];
  if (relatedNodeIds.size > 0) {
    const { data: relatedNodes } = await (sb.from("cara_studio_care_graph_nodes") as any)
      .select("*").in("id", Array.from(relatedNodeIds));
    nodes = [childNode, ...((relatedNodes ?? []) as CaraStudioCareGraphNode[])];
  }

  return { childNode, nodes, edges };
}

// ── Find connections ────────────────────────────────────────────────────────

export async function findConnections(nodeAId: string, nodeBId: string): Promise<CaraStudioCareGraphEdge[]> {
  const sb = createServerClient();
  if (!sb) return [];

  const { data } = await (sb.from("cara_studio_care_graph_edges") as any)
    .select("*")
    .or(
      `and(from_node_id.eq.${nodeAId},to_node_id.eq.${nodeBId}),` +
      `and(from_node_id.eq.${nodeBId},to_node_id.eq.${nodeAId})`,
    );

  return (data ?? []) as CaraStudioCareGraphEdge[];
}

// ── Auto-build graph from sources ───────────────────────────────────────────

export async function autoPopulateGraphForChild(childId: string): Promise<{ nodesCreated: number; edgesCreated: number }> {
  const sb = createServerClient();
  if (!sb) return { nodesCreated: 0, edgesCreated: 0 };

  let nodesCreated = 0;
  let edgesCreated = 0;

  const { data: existingChild } = await (sb.from("cara_studio_care_graph_nodes") as any)
    .select("id")
    .eq("home_id", homeId())
    .eq("node_type", "child")
    .eq("linked_record_id", childId)
    .limit(1);

  let childNodeId: string;
  if (!existingChild || existingChild.length === 0) {
    const node = await upsertGraphNode({
      home_id: homeId(), node_type: "child", linked_record_id: childId,
      linked_record_type: "young_person", label: `Child ${childId.slice(0, 8)}`,
      summary: null, metadata: {},
    });
    if (!node) return { nodesCreated: 0, edgesCreated: 0 };
    childNodeId = node.id;
    nodesCreated++;
  } else {
    childNodeId = existingChild[0].id;
  }

  const { data: sources } = await (sb.from("cara_studio_sources") as any)
    .select("id, source_type, title, summary")
    .eq("home_id", homeId())
    .eq("child_id", childId)
    .order("source_date", { ascending: false })
    .limit(50);

  if (sources) {
    for (const src of sources as Array<{ id: string; source_type: string; title: string | null; summary: string | null }>) {
      const nodeType = mapSourceTypeToNodeType(src.source_type);
      const node = await upsertGraphNode({
        home_id: homeId(), node_type: nodeType, linked_record_id: src.id,
        linked_record_type: "source", label: src.title ?? `${src.source_type} record`,
        summary: src.summary, metadata: { source_type: src.source_type },
      });
      if (node) {
        nodesCreated++;
        const edge = await createGraphEdge({
          from_node_id: childNodeId, to_node_id: node.id,
          relationship_type: "relates_to", strength: 0.8,
          evidence_source_id: src.id, confidence_score: 0.7,
        });
        if (edge) edgesCreated++;
      }
    }
  }

  return { nodesCreated, edgesCreated };
}

function mapSourceTypeToNodeType(sourceType: string): CaraStudioNodeType {
  const map: Record<string, CaraStudioNodeType> = {
    incident: "incident", risk_assessment: "risk", care_plan: "plan",
    placement_plan: "plan", safeguarding: "safeguarding_concern",
    staff_training: "training_need", management_oversight: "management_decision",
    supervision: "review",
  };
  return map[sourceType] ?? "evidence";
}

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoNodes(nodeType: CaraStudioNodeType): CaraStudioCareGraphNode[] {
  const now = new Date().toISOString();
  if (nodeType === "child") {
    return [{
      id: "demo-node-child-1", home_id: homeId(), node_type: "child",
      linked_record_id: "demo-child-1", linked_record_type: "young_person",
      label: "Alex (demo)", summary: "Young person with improving engagement",
      metadata: {}, created_at: now, updated_at: now,
    }];
  }
  return [];
}

function getDemoChildGraph(childId: string): ChildKnowledgeGraph {
  const now = new Date().toISOString();
  const childNode: CaraStudioCareGraphNode = {
    id: "demo-node-child-1", home_id: homeId(), node_type: "child",
    linked_record_id: childId, linked_record_type: "young_person",
    label: "Young Person (demo)", summary: "Demo knowledge graph node",
    metadata: {}, created_at: now, updated_at: now,
  };
  const relatedNodes: CaraStudioCareGraphNode[] = [
    { id: "demo-node-risk-1", home_id: homeId(), node_type: "risk", linked_record_id: null, linked_record_type: null, label: "Emotional dysregulation risk", summary: "Identified risk factor", metadata: { level: "medium" }, created_at: now, updated_at: now },
    { id: "demo-node-pf-1", home_id: homeId(), node_type: "protective_factor", linked_record_id: null, linked_record_type: null, label: "Strong key worker relationship", summary: "Protective factor supporting stability", metadata: {}, created_at: now, updated_at: now },
  ];
  const edges: CaraStudioCareGraphEdge[] = [
    { id: "demo-edge-1", from_node_id: childNode.id, to_node_id: "demo-node-risk-1", relationship_type: "relates_to", strength: 0.8, evidence_source_id: null, confidence_score: 0.75, created_at: now, updated_at: now },
    { id: "demo-edge-2", from_node_id: "demo-node-pf-1", to_node_id: childNode.id, relationship_type: "reduces_risk_of", strength: 0.9, evidence_source_id: null, confidence_score: 0.85, created_at: now, updated_at: now },
  ];
  return { childNode, nodes: [childNode, ...relatedNodes], edges };
}
