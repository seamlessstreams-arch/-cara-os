"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Knowledge Graph hook (OS Layer 5, client)
// GET /api/v1/knowledge-graph → the home's cross-entity graph + insights.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { KnowledgeGraph } from "@/lib/knowledge-graph/types";

interface KnowledgeGraphResponse {
  data: { graph: KnowledgeGraph };
}

export function useKnowledgeGraph() {
  return useQuery({
    queryKey: ["knowledge-graph"],
    queryFn: () => api.get<KnowledgeGraphResponse>("/knowledge-graph"),
    staleTime: 60 * 1000,
  });
}
