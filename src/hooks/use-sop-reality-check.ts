"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { SopRealityCheck } from "@/lib/sop-reality-check/sop-reality-check-engine";

/**
 * Statement of Purpose Reality Check — the home's evidence and gaps across the
 * seven SOP assurance areas, with an inspection-risk report.
 */
export function useSopRealityCheck() {
  return useQuery({
    queryKey: ["sop-reality-check"],
    queryFn: async () => (await api.get<{ data: SopRealityCheck }>(`/sop-reality-check`)).data,
  });
}
