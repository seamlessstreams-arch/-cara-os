"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — ABC Behaviour Patterns hook (client) · §16
// GET /api/v1/abc-behaviour → per-child A→B→C chains for the visual
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import type { ABCReport } from "@/lib/abc-behaviour/types";

export function useABCBehaviour() {
  return useQuery<{ data: ABCReport }>({
    queryKey: ["abc-behaviour"],
    queryFn: () => fetch("/api/v1/abc-behaviour").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });
}
