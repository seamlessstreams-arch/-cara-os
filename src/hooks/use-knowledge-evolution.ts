"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Knowledge Evolution hook (client)
// GET /api/v1/knowledge-evolution → per-entry lifecycle + evolution proposals
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import type { KnowledgeEvolutionReport } from "@/lib/knowledge-evolution/types";

const KEY = "knowledge-evolution";
const URL = "/api/v1/knowledge-evolution";

export function useKnowledgeEvolution() {
  return useQuery<{ data: KnowledgeEvolutionReport }>({
    queryKey: [KEY],
    queryFn: () => fetch(URL).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });
}
