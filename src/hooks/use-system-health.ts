"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Continuous Health Check hook (client)
// GET /api/v1/system-health
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import type { SystemHealthReport } from "@/lib/system-health/types";

const KEY = "system-health";
const URL = "/api/v1/system-health";

export function useSystemHealth() {
  return useQuery<{ data: SystemHealthReport }>({
    queryKey: [KEY],
    queryFn: () => fetch(URL).then((r) => r.json()),
    staleTime: 2 * 60 * 1000,
  });
}
