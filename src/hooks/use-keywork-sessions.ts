"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";

export interface KeyworkSession {
  id: string;
  child_id: string;
  staff_id: string;
  session_date: string;
  duration_minutes: number;
  format: string;
  child_chose_format: boolean;
  themes_covered: string[];
  child_went_in_with: string;
  child_walked_out_with: string;
  what_child_brought_up: string;
  what_staff_brought_up: string;
  agreed_actions_staff: string[];
  agreed_actions_child: string[];
  child_satisfaction: number;
  follow_up_date: string;
  flags_raised: string[];
  notes?: string;
  home_id?: string;
  created_at?: string;
}

type ListResponse = { data: KeyworkSession[]; meta: { total: number; this_month: number } };
type SingleResponse = { data: KeyworkSession };

export function useKeyworkSessions(params?: { childId?: string }) {
  const qs = new URLSearchParams();
  if (params?.childId) qs.set("child_id", params.childId);
  return useQuery({
    queryKey: ["keywork-sessions", params],
    queryFn: () => api.get<ListResponse>(`/keywork-sessions?${qs.toString()}`),
  });
}

export function useCreateKeyworkSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<KeyworkSession>) =>
      api.post<SingleResponse>("/keywork-sessions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["keywork-sessions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateKeyworkSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<KeyworkSession>) =>
      api.patch<SingleResponse>(`/keywork-sessions/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["keywork-sessions"] });
    },
  });
}
