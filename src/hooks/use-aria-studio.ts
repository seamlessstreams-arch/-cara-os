"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  AriaArtifact, AriaArtifactListResponse, AriaSource,
  AriaSourceListResponse, AriaGap, AriaGapListResponse,
  AriaQualityCheck, AriaGenerationRequest, AriaArtifactVersion,
  AriaArtifactReview, AriaStudioAuditLog,
} from "@/types/aria-studio";

// ── Artifact list ─────────────────────────────────────────────────────────────

interface ArtifactListParams {
  home_id?: string;
  status?: string;
  artifact_type?: string;
  child_id?: string;
  limit?: number;
  offset?: number;
}

export function useAriaArtifacts(params: ArtifactListParams = {}) {
  const search = new URLSearchParams();
  if (params.home_id) search.set("home_id", params.home_id);
  if (params.status) search.set("status", params.status);
  if (params.artifact_type) search.set("artifact_type", params.artifact_type);
  if (params.child_id) search.set("child_id", params.child_id);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));

  const query = search.toString();

  return useQuery({
    queryKey: ["aria-studio-artifacts", params],
    queryFn: () => api.get<AriaArtifactListResponse>(`/api/v1/aria-studio/artifacts${query ? `?${query}` : ""}`),
    refetchInterval: 30000,
  });
}

// ── Single artifact ───────────────────────────────────────────────────────────

interface ArtifactDetailResponse {
  data: AriaArtifact;
  related: {
    versions: AriaArtifactVersion[];
    reviews: AriaArtifactReview[];
    actions: unknown[];
    qualityChecks: AriaQualityCheck[];
    auditLog: AriaStudioAuditLog[];
    sources: AriaSource[];
  };
}

export function useAriaArtifact(id: string | null) {
  return useQuery({
    queryKey: ["aria-studio-artifact", id],
    queryFn: () => api.get<ArtifactDetailResponse>(`/api/v1/aria-studio/artifacts/${id}`),
    enabled: !!id,
  });
}

// ── Generate artifact (AI) ────────────────────────────────────────────────────

interface GenerateResult {
  data: AriaArtifact;
  meta: {
    sources_used: number;
    gaps_detected: number;
    model_used: string;
    is_stub: boolean;
  };
}

export function useGenerateAriaArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: AriaGenerationRequest) =>
      api.post<GenerateResult>("/api/v1/aria-studio/generate", request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aria-studio-artifacts"] });
      queryClient.invalidateQueries({ queryKey: ["aria-studio-gaps"] });
    },
  });
}

// ── Create draft artifact (manual) ────────────────────────────────────────────

export function useCreateAriaArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AriaArtifact>) =>
      api.post<{ data: AriaArtifact }>("/api/v1/aria-studio/artifacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aria-studio-artifacts"] });
    },
  });
}

// ── Update artifact (edit + workflow actions) ─────────────────────────────────

interface ArtifactUpdatePayload {
  id: string;
  action?: "submit" | "approve" | "request_changes" | "reject" | "commit" | "archive" | "recover" | "quality_check" | "edit";
  actor_id?: string;
  generated_content?: string;
  change_summary?: string;
  comment?: string;
  changes?: string;
  reason?: string;
  title?: string;
  framework?: string;
  tone?: string;
  creative_mode?: string;
}

export function useUpdateAriaArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: ArtifactUpdatePayload) =>
      api.patch<{ data: AriaArtifact; qualityCheck?: AriaQualityCheck }>(
        `/api/v1/aria-studio/artifacts/${id}`,
        data
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["aria-studio-artifacts"] });
      queryClient.invalidateQueries({ queryKey: ["aria-studio-artifact", variables.id] });
    },
  });
}

// ── Delete artifact (soft) ────────────────────────────────────────────────────

export function useDeleteAriaArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ data: AriaArtifact }>(`/api/v1/aria-studio/artifacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aria-studio-artifacts"] });
    },
  });
}

// ── Quality check ─────────────────────────────────────────────────────────────

export function useAriaQualityCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (artifactId: string) =>
      api.post<{ data: { artifact: AriaArtifact; qualityCheck: AriaQualityCheck } }>(
        "/api/v1/aria-studio/quality-check",
        { artifact_id: artifactId }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aria-studio-artifacts"] });
    },
  });
}

// ── Sources ───────────────────────────────────────────────────────────────────

interface SourceListParams {
  home_id?: string;
  child_id?: string;
  source_type?: string;
  limit?: number;
}

export function useAriaSources(params: SourceListParams = {}) {
  const search = new URLSearchParams();
  if (params.home_id) search.set("home_id", params.home_id);
  if (params.child_id) search.set("child_id", params.child_id);
  if (params.source_type) search.set("source_type", params.source_type);
  if (params.limit) search.set("limit", String(params.limit));

  const query = search.toString();

  return useQuery({
    queryKey: ["aria-studio-sources", params],
    queryFn: () => api.get<AriaSourceListResponse>(`/api/v1/aria-studio/sources${query ? `?${query}` : ""}`),
    staleTime: 60000,
  });
}

// ── Gaps ──────────────────────────────────────────────────────────────────────

interface GapListParams {
  home_id?: string;
  child_id?: string;
  status?: string;
  severity?: string;
  refresh?: boolean;
}

export function useAriaGaps(params: GapListParams = {}) {
  const search = new URLSearchParams();
  if (params.home_id) search.set("home_id", params.home_id);
  if (params.child_id) search.set("child_id", params.child_id);
  if (params.status) search.set("status", params.status);
  if (params.severity) search.set("severity", params.severity);
  if (params.refresh) search.set("refresh", "true");

  const query = search.toString();

  return useQuery({
    queryKey: ["aria-studio-gaps", params],
    queryFn: () => api.get<AriaGapListResponse>(`/api/v1/aria-studio/gaps${query ? `?${query}` : ""}`),
    refetchInterval: 60000,
  });
}

export function useUpdateAriaGap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; status?: string; assigned_to?: string }) =>
      api.patch<{ data: AriaGap }>("/api/v1/aria-studio/gaps", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aria-studio-gaps"] });
    },
  });
}
