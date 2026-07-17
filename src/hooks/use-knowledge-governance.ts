"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  KnowledgeGovernanceSummary,
  EvidenceStatus,
} from "@/lib/knowledge-governance/knowledge-governance-engine";

export interface KnowledgeGovernanceData extends KnowledgeGovernanceSummary {
  evidenceLabels: Record<EvidenceStatus, string>;
  writeEnabled: boolean;
}

/** Governance over the practice KB: evidence weight, review status, §6 alerts. */
export function useKnowledgeGovernance() {
  return useQuery({
    queryKey: ["knowledge-governance"],
    queryFn: async () => (await api.get<{ data: KnowledgeGovernanceData }>(`/knowledge-governance`)).data,
  });
}
