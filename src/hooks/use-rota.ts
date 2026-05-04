"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { Shift, LeaveRequest } from "@/types";

export interface RotaMeta {
  week_start: string;
  week_end: string;
  on_shift_today: number;
  sleep_ins_tonight: number;
  open_shifts: number;
  on_leave_today: number;
  late_arrivals: number;
  open_shift_dates: { date: string; start: string; end: string; type: string }[];
}

export interface RotaResponse {
  shifts: Shift[];
  leave: LeaveRequest[];
  meta: RotaMeta;
}

export function useRota(weekStart: string) {
  return useQuery({
    queryKey: ["rota", weekStart],
    queryFn: () => api.get<RotaResponse>(`/rota?week_start=${weekStart}`),
    enabled: !!weekStart,
  });
}

export interface CreateShiftInput {
  staff_id: string;
  date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  notes?: string;
  home_id?: string;
}

export function useCreateShift(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShiftInput) =>
      api.post<{ data: Shift }>("/rota", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rota", weekStart] });
    },
  });
}

export interface AssignShiftInput {
  shift_date: string;
  start_time: string;
  staff_id: string;
}

export function useAssignShift(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignShiftInput) =>
      api.patch<{ data: Shift }>("/rota", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rota", weekStart] });
    },
  });
}
