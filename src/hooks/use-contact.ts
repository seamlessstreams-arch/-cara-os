"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { ContactArrangement, ContactLog, ContactPerson } from "@/types/extended";

type ListResponse<T> = { data: T[]; meta: Record<string, number> };
type SingleResponse<T> = { data: T };

// ── Contact Persons ───────────────────────────────────────────────────────────

export function useContactPersons() {
  return useQuery({
    queryKey: ["contact-persons"],
    queryFn:  () => api.get<ListResponse<ContactPerson>>("/contact-persons"),
  });
}

export function useUpdateContactPerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactPerson> }) =>
      api.patch<SingleResponse<ContactPerson>>(`/contact-persons/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-persons"] });
      qc.invalidateQueries({ queryKey: ["contact-arrangements"] });
    },
  });
}

// ── Contact Arrangements ──────────────────────────────────────────────────────

export function useContactArrangements(params: { homeId?: string; childId?: string }) {
  const qs = params.childId
    ? `child_id=${params.childId}`
    : `home_id=${params.homeId}`;
  return useQuery({
    queryKey: ["contact-arrangements", params.homeId ?? params.childId],
    queryFn:  () =>
      api.get<ListResponse<ContactArrangement & { contact_person: ContactPerson | null }>>(`/contact-arrangements?${qs}`),
    enabled:  !!(params.homeId || params.childId),
  });
}

export function useUpdateContactArrangement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactArrangement> }) =>
      api.patch<SingleResponse<ContactArrangement>>(`/contact-arrangements/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-arrangements"] });
    },
  });
}

export function useCreateContactArrangement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContactArrangement>) =>
      api.post<SingleResponse<ContactArrangement>>("/contact-arrangements", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-arrangements"] });
    },
  });
}

// ── Contact Logs ──────────────────────────────────────────────────────────────

export function useContactLogs(params: { homeId?: string; childId?: string; arrangementId?: string }) {
  let qs = "";
  if (params.arrangementId) qs = `arrangement_id=${params.arrangementId}`;
  else if (params.childId)  qs = `child_id=${params.childId}`;
  else if (params.homeId)   qs = `home_id=${params.homeId}`;

  return useQuery({
    queryKey: ["contact-logs", params.homeId ?? params.childId ?? params.arrangementId],
    queryFn:  () =>
      api.get<ListResponse<ContactLog & { contact_person: ContactPerson | null }> & {
        meta: { total: number; concerns: number; cancelled: number; distress: number };
      }>(`/contact-logs?${qs}`),
    enabled: !!(params.homeId || params.childId || params.arrangementId),
  });
}

export function useContactLog(id: string) {
  return useQuery({
    queryKey: ["contact-logs", id],
    queryFn:  () => api.get<SingleResponse<ContactLog>>(`/contact-logs/${id}`),
    enabled:  !!id,
  });
}

export function useCreateContactLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContactLog>) =>
      api.post<SingleResponse<ContactLog>>("/contact-logs", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-logs"] });
    },
  });
}

export function useUpdateContactLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactLog> }) =>
      api.patch<SingleResponse<ContactLog>>(`/contact-logs/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-logs"] });
    },
  });
}
