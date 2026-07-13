"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { GovernanceBoard } from "@/lib/doc-governance/doc-governance-engine";

export type { GovernanceBoard };

/** The cross-type document governance board (read-only). */
export function useDocumentGovernance() {
  return useQuery({
    queryKey: ["document-governance"],
    queryFn: () => api.get<{ data: GovernanceBoard }>("/document-governance"),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
