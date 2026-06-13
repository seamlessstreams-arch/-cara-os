"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ComplianceOversightResult } from "@/lib/compliance/compliance-oversight-engine";
import type { DocumentAiResult, DocumentIntelCategory, DocumentIntelRisk, DocumentIntelStatus } from "@/types/documents";

export interface ComplianceDocRow {
  id: string;
  original_file_name: string;
  upload_context: string | null;
  document_category: DocumentIntelCategory | null;
  category_label?: string;
  document_status: DocumentIntelStatus;
  ai_risk_level: DocumentIntelRisk | null;
  ai_summary: string | null;
  ai_result: DocumentAiResult | null;
  tasks_created: string[];
  uploaded_at: string;
}

export function useComplianceOversight() {
  return useQuery({
    queryKey: ["compliance-oversight"],
    queryFn: () => api.get<{ data: ComplianceOversightResult }>("/compliance-oversight"),
    staleTime: 30_000,
  });
}

export function useComplianceDocuments() {
  return useQuery({
    queryKey: ["compliance-documents"],
    queryFn: () => api.get<{ data: { documents: ComplianceDocRow[] } }>("/compliance-documents"),
    staleTime: 30_000,
  });
}

function useInvalidateCompliance() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["compliance-documents"] });
    qc.invalidateQueries({ queryKey: ["compliance-oversight"] });
  };
}

export interface IngestInput {
  text: string;
  title?: string;
  fileName?: string;
  category?: DocumentIntelCategory | null;
}

/** Have Cara read a compliance document — returns the extracted result. */
export function useIngestComplianceDoc() {
  const invalidate = useInvalidateCompliance();
  return useMutation({
    mutationFn: (input: IngestInput) => api.post<{ data: ComplianceDocRow }>("/compliance-documents", input),
    onSuccess: invalidate,
  });
}

/** Turn a document's suggested actions into tracked compliance tasks. */
export function useTrackComplianceActions() {
  const invalidate = useInvalidateCompliance();
  return useMutation({
    mutationFn: (vars: { documentId: string; taskIds?: string[] }) =>
      api.post<{ data: { created_count: number; created_task_ids: string[]; all_tracked: boolean } }>(`/compliance-documents/${vars.documentId}/track`, { taskIds: vars.taskIds }),
    onSuccess: invalidate,
  });
}
