"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Quality-Gate Enforcement hook (client)
// GET /api/v1/quality-gate → the gate board (what's blocked and why)
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import type { GateBoard } from "@/lib/quality-gates/types";

const KEY = "quality-gate";
const URL = "/api/v1/quality-gate";

export function useQualityGateBoard() {
  return useQuery<{ data: GateBoard }>({
    queryKey: [KEY],
    queryFn: () => fetch(URL).then((r) => r.json()),
    staleTime: 60 * 1000,
  });
}
