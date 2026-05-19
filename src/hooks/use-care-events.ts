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

interface CareEventVersionHistoryItem {
  id: string;
  version: number;
  amended_at: string | null;
  amendment_reason: string | null;
  amended_by_name: string | null;
}

interface CareEventDetailResponse {
  data: CareEvent & {
    routes: CareEventRoute[];
    audit_log: CareEventAuditLog[];
    routing_preview: string[];
    staff_name: string | null;
    child_name: string | null;
    verified_by_name: string | null;
    version_history: CareEventVersionHistoryItem[];
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
    // Poll faster if any events are in transient routing states
    refetchInterval: (query) => {
      const data = query.state.data?.data ?? [];
      const hasRouting = data.some((e) => e.status === "routing" || e.status === "submitted");
      return hasRouting ? 5_000 : 30_000;
    },
  });
}

// ── Single event hook ─────────────────────────────────────────────────────────

export function useCareEvent(id: string | null) {
  return useQuery({
    queryKey: ["care-event", id],
    queryFn: () => api.get<CareEventDetailResponse>(`/care-events/${id}`),
    enabled: !!id,
    // Poll faster when in transient routing states
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === "routing" || status === "submitted") return 5_000; // 5s while routing
      if (status === "routed" || status === "manager_review_required") return 30_000; // 30s pending review
      return 60_000; // 60s for stable states
    },
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

// ── Background jobs ───────────────────────────────────────────────────────────

import type { CareEventJob } from "@/types/care-events";

interface JobsResponse {
  data: CareEventJob[];
  meta: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

interface RunJobsResponse {
  processed: number;
  completed: number;
  failed: number;
  results: Array<{
    job_id: string;
    job_type: string;
    care_event_id: string;
    status: "completed" | "failed" | "skipped";
    error?: string;
  }>;
}

/**
 * List background jobs for a specific care event.
 * Polls every 5 s while any job is processing or pending.
 */
export function useCareEventJobs(careEventId: string | null) {
  return useQuery({
    queryKey: ["care-event-jobs", careEventId],
    queryFn: () =>
      api.get<JobsResponse>(`/care-events/jobs?care_event_id=${careEventId}`),
    enabled: !!careEventId,
    refetchInterval: (query) => {
      const jobs = query.state.data?.data ?? [];
      const hasActive = jobs.some(
        (j) => j.status === "pending" || j.status === "processing" || j.status === "retry_required"
      );
      return hasActive ? 5_000 : 30_000;
    },
  });
}

/**
 * Trigger background job processing for a specific care event.
 * Manager+ permission required.
 */
export function useRunCareEventJobs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ care_event_id, job_type }: { care_event_id?: string; job_type?: string }) =>
      api.post<RunJobsResponse>("/care-events/jobs", { care_event_id, job_type }),
    onSuccess: (response, variables) => {
      const { processed, completed, failed } = response;
      if (failed === 0) {
        toast.success(`Background jobs complete: ${completed} of ${processed} processed.`);
      } else {
        toast.warning(`Jobs partially complete: ${completed} of ${processed} succeeded, ${failed} failed.`);
      }
      qc.invalidateQueries({ queryKey: ["care-event-jobs", variables.care_event_id] });
      qc.invalidateQueries({ queryKey: ["care-events"] });
      qc.invalidateQueries({ queryKey: ["reg45"] });
      qc.invalidateQueries({ queryKey: ["annex-a"] });
    },
    onError: () => careToast.actionFailed("Run background jobs"),
  });
}
