"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { careToast } from "@/lib/toast";
import { api } from "./use-api";
import type { DailyLogEntry } from "@/types";

interface DailyLogParams {
  child_id?: string;
  date?: string;
  entry_type?: DailyLogEntry["entry_type"];
  days?: number;
}

interface DailyLogResponse {
  data: DailyLogEntry[];
  meta: { total: number; by_type: Record<string, number> };
}

interface CreateDailyLogPayload {
  child_id: string;
  entry_type: DailyLogEntry["entry_type"];
  content: string;
  mood_score?: number | null;
  is_significant?: boolean;
  requires_action?: boolean;
  action_notes?: string | null;
}

export function useDailyLog(params?: DailyLogParams) {
  const query = new URLSearchParams();
  if (params?.child_id) query.set("child_id", params.child_id);
  if (params?.date) query.set("date", params.date);
  if (params?.entry_type) query.set("entry_type", params.entry_type);
  if (params?.days !== undefined) query.set("days", String(params.days));

  return useQuery({
    queryKey: ["daily-log", params],
    queryFn: () => api.get<DailyLogResponse>(`/daily-log?${query}`),
  });
}

export function useCreateDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDailyLogPayload) =>
      api.post<{ data: DailyLogEntry }>("/daily-log", data),
    onSuccess: () => {
      careToast.dailyLogSaved();
      qc.invalidateQueries({ queryKey: ["daily-log"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => careToast.actionFailed("Save daily log"),
  });
}
