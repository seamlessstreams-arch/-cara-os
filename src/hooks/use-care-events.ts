"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { careToast } from "@/lib/toast";
import { toast } from "sonner";
import { api } from "./use-api";
import type {
  CareEvent, CareEventCategory, CareEventStatus,
  CreateCareEventPayload, SubmitCareEventPayload,
  VerifyCareEventPayload, ReturnCareEventPayload,
  AmendCareEventPayload,
} from "@/types/care-events";
import type { CareEventRoute, CareEventAuditLog } from "@/types/care-events";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CareEventsParams {
  child_id?: string;
  status?: CareEventStatus;
  category?: CareEventCategory;
  date?: string;
  days?: number;
  page?: number;
  limit?: number;
}

interface CareEventsResponse {
  data: CareEvent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    status_counts: Record<string, number>;
  };
}

interface CareEventDetailResponse {
  data: CareEvent & {
    routes: CareEventRoute[];
    audit_log: CareEventAuditLog[];
    routing_preview: string[];
  };
}

interface RoutingResult {
  success: boolean;
  routes_completed: number;
  routes_failed: number;
  routes_skipped: number;
  routing_summary: {
    records_updated: number;
    tasks_created: number;
    reg45_count: number;
    annex_a_count: number;
    areas_updated: string[];
  };
  routing_summary_text: string;
  errors: Array<{ route: string; error: string }>;
}

// ── List hook ─────────────────────────────────────────────────────────────────

export function useCareEvents(params?: CareEventsParams) {
  const query = new URLSearchParams();
  if (params?.child_id) query.set("child_id", params.child_id);
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  if (params?.date) query.set("date", params.date);
  if (params?.days !== undefined) query.set("days", String(params.days));
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));

  return useQuery({
    queryKey: ["care-events", params],
    queryFn: () => api.get<CareEventsResponse>(`/care-events?${query}`),
  });
}

// ── Single event hook ─────────────────────────────────────────────────────────

export function useCareEvent(id: string | null) {
  return useQuery({
    queryKey: ["care-event", id],
    queryFn: () => api.get<CareEventDetailResponse>(`/care-events/${id}`),
    enabled: !!id,
  });
}

// ── Create ────────────────────────────────────────────────────────────────────

export function useCreateCareEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCareEventPayload) =>
      api.post<{ data: CareEvent; routing_preview: object }>("/care-events", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["care-events"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => careToast.actionFailed("Create care event"),
  });
}

// ── Submit ────────────────────────────────────────────────────────────────────

export function useSubmitCareEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & SubmitCareEventPayload) =>
      api.patch<{ data: CareEvent; result: RoutingResult }>(`/care-events/${id}`, {
        action: "submit",
        ...payload,
      }),
    onSuccess: (response) => {
      const text = response.result?.routing_summary_text ?? "Entry submitted.";
      toast.success(text);
      qc.invalidateQueries({ queryKey: ["care-events"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["reg45-evidence"] });
      qc.invalidateQueries({ queryKey: ["annex-a-evidence"] });
    },
    onError: () => careToast.actionFailed("Submit care event"),
  });
}

// ── Verify ────────────────────────────────────────────────────────────────────

export function useVerifyCareEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & VerifyCareEventPayload) =>
      api.patch<{ data: CareEvent }>(`/care-events/${id}`, { action: "verify", ...payload }),
    onSuccess: () => {
      toast.success("Record verified and evidence approved.");
      qc.invalidateQueries({ queryKey: ["care-events"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["reg45-evidence"] });
      qc.invalidateQueries({ queryKey: ["annex-a-evidence"] });
    },
    onError: () => careToast.actionFailed("Verify care event"),
  });
}

// ── Return ────────────────────────────────────────────────────────────────────

export function useReturnCareEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & ReturnCareEventPayload) =>
      api.patch<{ data: CareEvent }>(`/care-events/${id}`, { action: "return", ...payload }),
    onSuccess: () => {
      toast.info("Record returned to staff for correction.");
      qc.invalidateQueries({ queryKey: ["care-events"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => careToast.actionFailed("Return care event"),
  });
}

// ── Amend ─────────────────────────────────────────────────────────────────────

export function useAmendCareEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & AmendCareEventPayload) =>
      api.patch<{ data: CareEvent; previous_version_id: string }>(`/care-events/${id}`, {
        action: "amend",
        ...payload,
      }),
    onSuccess: () => {
      toast.success("New version created. Amendment requires manager review.");
      qc.invalidateQueries({ queryKey: ["care-events"] });
    },
    onError: () => careToast.actionFailed("Amend care event"),
  });
}

// ── Lock ──────────────────────────────────────────────────────────────────────

export function useLockCareEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<{ data: CareEvent }>(`/care-events/${id}`, { action: "lock" }),
    onSuccess: () => {
      toast.success("Record locked.");
      qc.invalidateQueries({ queryKey: ["care-events"] });
    },
    onError: () => careToast.actionFailed("Lock care event"),
  });
}

// ── Retry failed routes ───────────────────────────────────────────────────────

export function useRetryCareEventRouting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<{ data: CareEvent; result: RoutingResult }>(`/care-events/${id}`, {
        action: "retry",
      }),
    onSuccess: (response) => {
      const { result } = response;
      if (result?.routes_failed === 0) {
        toast.success("Routing completed successfully.");
      } else {
        toast.warning(`Routing partially failed: ${result?.routes_failed} route(s) still failing.`);
      }
      qc.invalidateQueries({ queryKey: ["care-events"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => careToast.actionFailed("Retry routing"),
  });
}

// ── Update evidence prompts ───────────────────────────────────────────────────

export function useUpdateCareEventPrompts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, evidence_answers }: { id: string; evidence_answers: Record<string, string> }) =>
      api.patch<{ data: CareEvent }>(`/care-events/${id}`, {
        action: "update_prompts",
        evidence_answers,
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["care-event", variables.id] });
    },
    onError: () => careToast.actionFailed("Save evidence responses"),
  });
}
