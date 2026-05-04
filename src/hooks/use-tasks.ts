"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import { careToast } from "@/lib/toast";
import type { Task } from "@/types";

export function useTasks(params?: { assigned_to?: string; status?: string; priority?: string; category?: string; overdue?: boolean }) {
  const query = new URLSearchParams();
  if (params?.assigned_to) query.set("assigned_to", params.assigned_to);
  if (params?.status) query.set("status", params.status);
  if (params?.priority) query.set("priority", params.priority);
  if (params?.category) query.set("category", params.category);
  if (params?.overdue) query.set("overdue", "true");

  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => api.get<{ data: Task[]; meta: Record<string, number> }>(`/tasks?${query}`),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, by, note }: { id: string; by: string; note?: string }) =>
      api.patch(`/tasks/${id}`, { action: "complete", completed_by: by, evidence_note: note }),
    onSuccess: () => {
      careToast.taskCompleted("Task marked as complete");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["health-check"] });
    },
    onError: () => careToast.actionFailed("Complete task"),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Task>) => api.post<{ data: Task }>("/tasks", data),
    onSuccess: (_res, data) => {
      careToast.taskCreated(data.title ?? "New task");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => careToast.actionFailed("Create task"),
  });
}

/** Fetch a single task by ID. Falls back to seed data if API fails. */
export function useTask(id: string | null) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: () => api.get<{ data: Task }>(`/tasks/${id}`),
    enabled: !!id,
    select: (res) => res.data,
  });
}

/** Update task fields (title, description, status, priority, due_date, etc.) */
export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      api.patch<{ data: Task }>(`/tasks/${id}`, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ["task", id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** Sign off a completed task */
export function useSignOffTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, by }: { id: string; by: string }) =>
      api.patch<{ data: Task }>(`/tasks/${id}`, {
        action: "sign_off",
        signed_off_by: by,
        signed_off_at: new Date().toISOString(),
      }),
    onSuccess: (_res, { id }) => {
      careToast.taskSignedOff("Task");
      qc.invalidateQueries({ queryKey: ["task", id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => careToast.actionFailed("Sign off task"),
  });
}

/** Escalate a task to a senior staff member */
export function useEscalateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      escalated_to,
      reason,
    }: {
      id: string;
      escalated_to: string;
      reason: string;
    }) =>
      api.patch<{ data: Task }>(`/tasks/${id}`, {
        action: "escalate",
        escalated: true,
        escalated_to,
        escalation_reason: reason,
        escalated_at: new Date().toISOString(),
      }),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ["task", id] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/** Cancel / archive a task */
export function useCancelTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      api.patch<{ data: Task }>(`/tasks/${id}`, { status: "cancelled" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
