"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import { careToast } from "@/lib/toast";
import type { Incident } from "@/types";
import type { PIDebrief } from "@/types/extended";

export function useIncident(id: string) {
  return useQuery({
    queryKey: ["incidents", id],
    queryFn: () => api.get<{ data: Incident }>(`/incidents/${id}`),
    enabled: !!id,
  });
}

export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      api.patch<{ data: Incident }>(`/incidents/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["incidents", vars.id] });
    },
  });
}

export function useIncidents(params?: { status?: string; child_id?: string; needs_oversight?: boolean }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.child_id) query.set("child_id", params.child_id);
  if (params?.needs_oversight) query.set("needs_oversight", "true");

  return useQuery({
    queryKey: ["incidents", params],
    queryFn: () => api.get<{ data: Incident[]; meta: Record<string, number> }>(`/incidents?${query}`),
  });
}

export function useAddOversight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note, by, cara_assisted }: { id: string; note: string; by: string; cara_assisted?: boolean }) =>
      api.post(`/incidents/${id}/oversight`, { oversight_note: note, oversight_by: by, cara_assisted }),
    onSuccess: () => {
      careToast.oversightAdded();
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["health-check"] });
    },
    onError: () => careToast.actionFailed("Add oversight"),
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Incident>) => api.post<{ data: Incident; linked_updates: string[] }>("/incidents", data),
    onSuccess: (_res, data) => {
      careToast.incidentLogged(data.reference ?? "New incident");
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["health-check"] });
    },
    onError: () => careToast.actionFailed("Log incident"),
  });
}

// ── PI Debrief hooks ──────────────────────────────────────────────────────────

export function usePIDebriefs(params: { homeId: string }) {
  return useQuery({
    queryKey: ["pi-debriefs", params.homeId],
    queryFn: () =>
      api.get<{ data: PIDebrief[]; meta: { total: number; pending: number; incomplete: number; overdue: number } }>(
        `/pi-debriefs?home_id=${params.homeId}`
      ),
  });
}

export function usePIDebrief(id: string) {
  return useQuery({
    queryKey: ["pi-debriefs", id],
    queryFn: () => api.get<{ data: PIDebrief }>(`/pi-debriefs/${id}`),
    enabled: !!id,
  });
}

export function useUpdatePIDebrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PIDebrief> }) =>
      api.patch<{ data: PIDebrief }>(`/pi-debriefs/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pi-debriefs"] });
    },
  });
}

export function useCreatePIDebrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PIDebrief>) =>
      api.post<{ data: PIDebrief }>("/pi-debriefs", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pi-debriefs"] });
    },
  });
}
