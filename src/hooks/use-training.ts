"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { TrainingRecord } from "@/types";

type TrainingMeta = {
  total: number;
  compliant: number;
  expiring: number;
  expired: number;
  not_started: number;
  rate: number;
};

export function useTraining(params?: { staff_id?: string; status?: string; category?: string }) {
  const query = new URLSearchParams();
  if (params?.staff_id) query.set("staff_id", params.staff_id);
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);

  return useQuery({
    queryKey: ["training", params],
    queryFn: () =>
      api.get<{ data: TrainingRecord[]; meta: TrainingMeta }>(`/training?${query}`),
  });
}

export function useAddTrainingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TrainingRecord>) =>
      api.post<{ data: TrainingRecord }>("/training", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training"] }),
  });
}

export function useUpdateTrainingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<TrainingRecord>) =>
      api.patch<{ data: TrainingRecord }>("/training", { id, ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training"] }),
  });
}
