"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { UploadedDocument, DocumentAuditEntry } from "@/types/documents";

type DocListMeta = {
  total: number;
  awaiting_review: number;
  high_risk: number;
  tasks_created: number;
  injection_detected: number;
};

type UploadPayload = {
  original_file_name: string;
  file_type?: string;
  file_size?: number;
  extracted_text: string;
  linked_child_id?: string | null;
  linked_staff_id?: string | null;
  linked_incident_id?: string | null;
  upload_context?: string | null;
};

type ApprovePayload = {
  docId: string;
  action: "approve" | "reject" | "request_review";
  approved_task_ids?: string[];
  create_evidence_link?: boolean;
  create_chronology?: boolean;
  rejection_reason?: string;
};

// ── List all documents ────────────────────────────────────────────────────────
export function useDocumentIntelligence(params?: { status?: string; risk_level?: string; category?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.risk_level) query.set("risk_level", params.risk_level);
  if (params?.category) query.set("category", params.category);
  return useQuery({
    queryKey: ["doc-intelligence", params],
    queryFn: () => api.get<{ data: UploadedDocument[]; meta: DocListMeta }>(`/doc-intelligence?${query}`),
    refetchInterval: 5000, // poll while documents may be analysing
  });
}

// ── Get single document ───────────────────────────────────────────────────────
export function useDocumentDetail(docId: string | null) {
  return useQuery({
    queryKey: ["doc-intelligence", docId],
    queryFn: () => api.get<{ data: UploadedDocument; audit_log: DocumentAuditEntry[] }>(`/doc-intelligence/${docId}`),
    enabled: !!docId,
  });
}

// ── Upload document ───────────────────────────────────────────────────────────
export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadPayload) =>
      api.post<{ data: UploadedDocument; cara_error?: string }>("/doc-intelligence", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-intelligence"] }),
  });
}

// ── Approve / reject / send for review ───────────────────────────────────────
export function useApproveDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, ...payload }: ApprovePayload) =>
      api.post<{ data: UploadedDocument; tasks_created: string[]; message: string }>(
        `/doc-intelligence/${docId}/approve`,
        payload,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-intelligence"] }),
  });
}

// ── Patch document ────────────────────────────────────────────────────────────
export function usePatchDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<UploadedDocument>) =>
      api.patch<{ data: UploadedDocument }>(`/doc-intelligence/${id}`, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-intelligence"] }),
  });
}
