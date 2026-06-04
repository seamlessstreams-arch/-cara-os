import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { Task } from "@/types/index";
import type { CareEvent } from "@/types/care-events";

// ── Shared task + care event enriched type ────────────────────────────────────

export interface OversightTask extends Task {
  care_event: Pick<CareEvent, "id" | "title" | "category" | "event_date" | "status" | "staff_id" | "child_id"> | null;
}

interface OversightMeta {
  total: number;
  active: number;
  urgent: number;
  overdue: number;
}

// ── Management Oversight Queue ────────────────────────────────────────────────

export function useManagementOversight(params?: { status?: string; priority?: string; child_id?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.priority) searchParams.set("priority", params.priority);
  if (params?.child_id) searchParams.set("child_id", params.child_id);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["management-oversight", params],
    queryFn: () =>
      api.get<{ data: OversightTask[]; meta: OversightMeta }>(
        `/management-oversight${qs ? `?${qs}` : ""}`
      ),
  });
}

export function useCompleteOversightTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { task_id: string; completed_by: string; evidence_note?: string }) =>
      api.patch<{ data: Task }>("/management-oversight", { ...payload, action: "complete" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["management-oversight"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["care-events"] });
    },
  });
}

// ── Regulation 40 Triage Queue ────────────────────────────────────────────────

export interface Reg40Task extends Task {
  care_event: {
    id: string;
    title: string;
    category: string;
    event_date: string;
    status: string;
    staff_id: string;
    child_id: string | null;
    content_excerpt: string;
  } | null;
}

interface Reg40Meta {
  total: number;
  active: number;
  overdue: number;
  care_events_pending_triage: number;
}

export function useReg40Triage(params?: { status?: string; child_id?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.child_id) searchParams.set("child_id", params.child_id);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["reg40-triage", params],
    queryFn: () =>
      api.get<{ data: Reg40Task[]; meta: Reg40Meta }>(
        `/reg40-triage${qs ? `?${qs}` : ""}`
      ),
  });
}

export function useTriageReg40Task() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      task_id: string;
      action: "complete" | "notify_ofsted" | "no_notification_required";
      completed_by: string;
      evidence_note?: string;
    }) => api.patch<{ data: Task }>("/reg40-triage", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reg40-triage"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      // a notify_ofsted triage queues a pending notifiable event
      queryClient.invalidateQueries({ queryKey: ["notifiable-events"] });
      queryClient.invalidateQueries({ queryKey: ["notifiable-events-intelligence"] });
    },
  });
}
