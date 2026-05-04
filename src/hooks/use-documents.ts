"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import { careToast } from "@/lib/toast";
import type { Document, DocumentReadReceipt } from "@/types";

export interface DocumentsResponse {
  data: Document[];
  receipts: DocumentReadReceipt[];
  meta: { total: number; requires_sign: number; expiring_soon: number; expired: number };
}

export function useDocuments(params?: { category?: string; requires_read_sign?: boolean }) {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.requires_read_sign) query.set("requires_read_sign", "true");
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => api.get<DocumentsResponse>(`/documents?${query}`),
  });
}

export function useSignDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, staffId }: { docId: string; staffId: string }) =>
      api.post(`/documents/${docId}/sign`, { staff_id: staffId }),
    onSuccess: () => {
      careToast.formSaved();
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: () => careToast.actionFailed("Sign document"),
  });
}
