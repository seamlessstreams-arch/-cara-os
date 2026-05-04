"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  LiversAnalysis,
  InterventionSession,
  LiversOutcomeRecord,
} from "@/types/extended";

type ListResponse<T> = { data: T[]; meta: Record<string, unknown> };
type SingleResponse<T> = { data: T };
type RolePayload = { user_role?: string };

// ── L.I.V.E.R.S. Analyses ────────────────────────────────────────────────────

export function useLiversAnalyses(params?: { childId?: string; homeId?: string }) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);

  return useQuery({
    queryKey: ["livers", "analyses", params],
    queryFn: () =>
      api.get<ListResponse<LiversAnalysis>>(`/livers?${query}`),
  });
}

export function useLiversAnalysis(id: string) {
  return useQuery({
    queryKey: ["livers", "analyses", id],
    queryFn: () => api.get<SingleResponse<LiversAnalysis>>(`/livers/${id}`),
    enabled: !!id,
  });
}

export function useCreateLiversAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LiversAnalysis> & RolePayload) =>
      api.post<SingleResponse<LiversAnalysis>>("/livers", data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["livers", "analyses"] });
      if (vars.child_id) {
        qc.invalidateQueries({ queryKey: ["livers", "analyses", { childId: vars.child_id }] });
      }
    },
  });
}

export function useUpdateLiversAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<LiversAnalysis> & RolePayload) =>
      api.patch<SingleResponse<LiversAnalysis>>(`/livers/${id}`, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["livers", "analyses"] });
      if (res.data?.id) {
        qc.invalidateQueries({ queryKey: ["livers", "analyses", res.data.id] });
      }
    },
  });
}

// ── Intervention Sessions ─────────────────────────────────────────────────────

export function useInterventionSessions(params?: {
  childId?: string;
  homeId?: string;
  liversId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("child_id", params.childId);
  if (params?.homeId) query.set("home_id", params.homeId);
  if (params?.liversId) query.set("livers_id", params.liversId);

  return useQuery({
    queryKey: ["livers", "intervention-sessions", params],
    queryFn: () =>
      api.get<ListResponse<InterventionSession>>(
        `/intervention-sessions?${query}`
      ),
  });
}

export function useInterventionSession(id: string) {
  return useQuery({
    queryKey: ["livers", "intervention-sessions", id],
    queryFn: () =>
      api.get<SingleResponse<InterventionSession>>(`/intervention-sessions/${id}`),
    enabled: !!id,
  });
}

export function useCreateInterventionSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InterventionSession> & RolePayload) =>
      api.post<SingleResponse<InterventionSession>>("/intervention-sessions", data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["livers", "intervention-sessions"] });
      if (vars.livers_analysis_id) {
        qc.invalidateQueries({
          queryKey: ["livers", "intervention-sessions", { liversId: vars.livers_analysis_id }],
        });
      }
    },
  });
}

export function useUpdateInterventionSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<InterventionSession> & RolePayload) =>
      api.patch<SingleResponse<InterventionSession>>(`/intervention-sessions/${id}`, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["livers", "intervention-sessions"] });
      if (res.data?.id) {
        qc.invalidateQueries({ queryKey: ["livers", "intervention-sessions", res.data.id] });
      }
    },
  });
}

// ── Intervention Outcomes ─────────────────────────────────────────────────────

export function useLiversOutcomeRecords(params?: {
  sessionId?: string;
  childId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.sessionId) query.set("session_id", params.sessionId);
  if (params?.childId) query.set("child_id", params.childId);

  return useQuery({
    queryKey: ["livers", "outcomes", params],
    queryFn: () =>
      api.get<ListResponse<LiversOutcomeRecord>>(
        `/intervention-outcomes?${query}`
      ),
    enabled: !!(params?.sessionId || params?.childId),
  });
}

export function useCreateLiversOutcome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LiversOutcomeRecord> & RolePayload) =>
      api.post<SingleResponse<LiversOutcomeRecord>>("/intervention-outcomes", data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["livers", "outcomes"] });
      qc.invalidateQueries({ queryKey: ["livers", "intervention-sessions"] });
      if (vars.intervention_session_id) {
        qc.invalidateQueries({
          queryKey: ["livers", "outcomes", { sessionId: vars.intervention_session_id }],
        });
      }
    },
  });
}
