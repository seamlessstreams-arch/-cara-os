"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { Audit } from "@/types/extended";

export interface AuditsResponse {
  data: Audit[];
  meta: { total: number; completed: number; scheduled: number; in_progress: number; overdue: number };
}

export function useAudits(params?: { status?: string; category?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  return useQuery({
    queryKey: ["audits", params],
    queryFn: () => api.get<AuditsResponse>(`/audits?${query}`),
  });
}

export function useCreateAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Audit>) => api.post<{ data: Audit }>("/audits", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audits"] }),
  });
}

export function useUpdateAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Audit> }) =>
      api.patch<{ data: Audit }>(`/audits/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audits"] }),
  });
}

export function useAudit(id: string) {
  return useQuery({
    queryKey: ["audit", id],
    queryFn: () => api.get<{ data: AuditDetail }>(`/audits/${id}`),
    enabled: !!id,
  });
}

export interface AuditFinding {
  id: string;
  area: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  standard_ref?: string;
  action_required: string;
  owner: string;
  due_date: string;
  status: "open" | "in_progress" | "resolved";
}

export interface AuditDetail extends Audit {
  completed_by_name: string | null;
  findings_detail: AuditFinding[];
  linked_training_needs: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
  }>;
}
