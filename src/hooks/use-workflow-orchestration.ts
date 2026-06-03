"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WORKFLOW ORCHESTRATION HOOK
// React Query wrapper for /api/v1/workflow-orchestration
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { WorkflowOrchestrationResult } from "@/lib/workflow-orchestration/workflow-orchestration-engine";

interface WorkflowOrchestrationResponse {
  data: WorkflowOrchestrationResult;
}

export function useWorkflowOrchestration() {
  return useQuery({
    queryKey: ["workflow-orchestration"],
    queryFn: () => api.get<WorkflowOrchestrationResponse>("/workflow-orchestration"),
    refetchInterval: 60_000,
  });
}
