// ══════════════════════════════════════════════════════════════════════════════
// CARA — KNOWLEDGE GRAPH (Layer 5) · types
//
// Connects children, risks, locations and professionals into a graph and derives
// CROSS-ENTITY insights humans don't easily see — e.g. a community location that
// recurs across several children's incidents (a contextual-safeguarding
// hotspot), a risk shared across a cohort, or a social worker spanning multiple
// children (a coordination opportunity). Deterministic — no model calls.
// ══════════════════════════════════════════════════════════════════════════════

import type { Confidence } from "@/lib/cara-reasoning/types";

export type { Confidence };

export type GraphNodeType = "child" | "risk" | "location" | "professional" | "incident_type";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  /** How many edges touch this node (degree) — useful for sizing in a UI. */
  degree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
}

export type InsightSeverity = "info" | "watch" | "priority";

export interface GraphInsight {
  kind: string;
  title: string;
  detail: string;
  /** Node ids involved, so a UI can highlight them. */
  entities: string[];
  severity: InsightSeverity;
  confidence: Confidence;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  insights: GraphInsight[];
  stats: { children: number; risks: number; locations: number; professionals: number; edges: number };
  confidence: Confidence;
  disclaimer: string;
  engineVersion: string;
  generatedAt: string;
}

// ─── Input (normalised; assembled in the route from the store) ──────────────────

export interface GraphChild {
  id: string;
  name: string;
  riskFlags: string[];
  socialWorker?: string;
}

export interface GraphIncident {
  childId: string;
  type: string;
  location?: string | null;
  date: string;
}

export interface KnowledgeGraphInput {
  children: GraphChild[];
  incidents: GraphIncident[];
  windowDays: number;
  today: string;
}

export const KNOWLEDGE_GRAPH_VERSION = "1.0.0";

export const KNOWLEDGE_GRAPH_DISCLAIMER =
  "The knowledge graph surfaces deterministic cross-entity connections (shared locations, risks and professionals) for the team to consider — particularly through a contextual-safeguarding lens. Connections are prompts for professional curiosity, not conclusions.";
