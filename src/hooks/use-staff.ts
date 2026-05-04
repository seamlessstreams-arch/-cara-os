"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { StaffMember, TrainingRecord, Supervision, Task } from "@/types";

export interface StaffEnriched extends StaffMember {
  is_on_shift_today: boolean;
  today_shift_type: string | null;
  today_shift_status: string | null;
  supervision_overdue: boolean;
  supervision_days_until_due: number | null;
  training_total_count: number;
  training_expired_count: number;
  training_expiring_count: number;
  active_tasks: number;
  overdue_tasks: number;
  is_on_leave_today: boolean;
  notifications_unread: number;
}

export function useStaff(params?: { role?: string; status?: string; employment_type?: string }) {
  const query = new URLSearchParams();
  if (params?.role) query.set("role", params.role);
  if (params?.status) query.set("status", params.status);
  if (params?.employment_type) query.set("employment_type", params.employment_type);

  return useQuery({
    queryKey: ["staff", params],
    queryFn: () =>
      api.get<{ data: StaffEnriched[]; meta: Record<string, number> }>(`/staff?${query}`),
  });
}

export interface StaffProfileResponse {
  data: StaffEnriched;
  related: {
    training: TrainingRecord[];
    supervisions: Supervision[];
    tasks: Task[];
  };
}

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: ["staff", id],
    queryFn: () => api.get<StaffProfileResponse>(`/staff/${id}`),
    enabled: !!id,
  });
}
