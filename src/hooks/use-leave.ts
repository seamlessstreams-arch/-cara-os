"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { LeaveRequest } from "@/types";

export interface LeaveMeta {
  total: number;
  approved: number;
  pending: number;
  on_leave_today: number;
  sick_last_30_days: number;
  sick_instances_last_30: number;
  annual_days_last_30: number;
  toil_days_last_30: number;
}

export function useLeave(params?: {
  staff_id?: string;
  status?: string;
  leave_type?: string;
  since?: string;
}) {
  const query = new URLSearchParams();
  if (params?.staff_id) query.set("staff_id", params.staff_id);
  if (params?.status) query.set("status", params.status);
  if (params?.leave_type) query.set("leave_type", params.leave_type);
  if (params?.since) query.set("since", params.since);

  return useQuery({
    queryKey: ["leave", params],
    queryFn: () =>
      api.get<{ data: LeaveRequest[]; meta: LeaveMeta }>(`/leave?${query}`),
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LeaveRequest>) => api.post<{ data: LeaveRequest }>("/leave", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave"] });
    },
  });
}
