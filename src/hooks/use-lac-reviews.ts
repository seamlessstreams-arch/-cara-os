"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { LACReview } from "@/types/extended";

interface LACResponse {
  data: LACReview[];
  meta: { total: number; overdue: number; next_due_date: string | null };
}

export function useLACReviews(params?: { childId?: string }) {
  const qs = new URLSearchParams();
  if (params?.childId) qs.set("child_id", params.childId);
  return useQuery({
    queryKey: ["lac-reviews", params?.childId],
    queryFn: () => api.get<LACResponse>(`/lac-reviews?${qs.toString()}`),
    staleTime: 30_000,
  });
}

export function useCreateLACReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LACReview>) => api.post<{ data: LACReview }>("/lac-reviews", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lac-reviews"] }),
  });
}

export function useUpdateLACReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string } & Partial<LACReview>) => api.patch<{ data: LACReview }>("/lac-reviews", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lac-reviews"] }),
  });
}
