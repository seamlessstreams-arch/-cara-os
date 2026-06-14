"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  CaraArtifact, CaraArtifactListResponse, CaraSource,
  CaraSourceListResponse, CaraGap, CaraGapListResponse,
  CaraQualityCheck, CaraGenerationRequest, CaraArtifactVersion,
  CaraArtifactReview, CaraStudioAuditLog,
} from "@/types/cara-studio";

// ── Artifact list ─────────────────────────────────────────────────────────────

interface ArtifactListParams {
  home_id?: string;
  status?: string;
  artifact_type?: string;
  child_id?: string;
  limit?: number;
  offset?: number;
}

export function useCaraArtifacts(params: ArtifactListParams = {}) {
  const search = new URLSearchParams();
  if (params.home_id) search.set("home_id", params.home_id);
  if (params.status) search.set("status", params.status);
  if (params.artifact_type) search.set("artifact_type", params.artifact_type);
  if (params.child_id) search.set("child_id", params.child_id);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));

  const query = search.toString();

  return useQuery({
    queryKey: ["cara-studio-artifacts", params],
    queryFn: () => api.get<CaraArtifactListResponse>(`/cara-studio/artifacts${query ? `?${query}` : ""}`),
    refetchInterval: 30000,
  });
}

// ── Single artifact ───────────────────────────────────────────────────────────

interface ArtifactDetailResponse {
  data: CaraArtifact;
  related: {
    versions: CaraArtifactVersion[];
    reviews: CaraArtifactReview[];
    actions: unknown[];
    qualityChecks: CaraQualityCheck[];
    auditLog: CaraStudioAuditLog[];
    sources: CaraSource[];
  };
}

export function useCaraArtifact(id: string | null) {
  return useQuery({
    queryKey: ["cara-studio-artifact", id],
    queryFn: () => api.get<ArtifactDetailResponse>(`/cara-studio/artifacts/${id}`),
    enabled: !!id,
  });
}

// ── Generate artifact (AI) ────────────────────────────────────────────────────

interface GenerateResult {
  data: CaraArtifact;
  meta: {
    sources_used: number;
    gaps_detected: number;
    model_used: string;
    is_stub: boolean;
  };
}

export function useGenerateCaraArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CaraGenerationRequest) =>
      api.post<GenerateResult>("/cara-studio/generate", request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cara-studio-artifacts"] });
      queryClient.invalidateQueries({ queryKey: ["cara-studio-gaps"] });
    },
  });
}

// ── Create draft artifact (manual) ────────────────────────────────────────────

export function useCreateCaraArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CaraArtifact>) =>
      api.post<{ data: CaraArtifact }>("/cara-studio/artifacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cara-studio-artifacts"] });
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

export function useUpdateCaraArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: ArtifactUpdatePayload) =>
      api.patch<{ data: CaraArtifact; qualityCheck?: CaraQualityCheck }>(
        `/cara-studio/artifacts/${id}`,
        data
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cara-studio-artifacts"] });
      queryClient.invalidateQueries({ queryKey: ["cara-studio-artifact", variables.id] });
    },
  });
}

// ── Delete artifact (soft) ────────────────────────────────────────────────────

export function useDeleteCaraArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ data: CaraArtifact }>(`/cara-studio/artifacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cara-studio-artifacts"] });
    },
  });
}

// ── Quality check ─────────────────────────────────────────────────────────────

export function useCaraQualityCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (artifactId: string) =>
      api.post<{ data: { artifact: CaraArtifact; qualityCheck: CaraQualityCheck } }>(
        "/cara-studio/quality-check",
        { artifact_id: artifactId }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cara-studio-artifacts"] });
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

export function useCaraSources(params: SourceListParams = {}) {
  const search = new URLSearchParams();
  if (params.home_id) search.set("home_id", params.home_id);
  if (params.child_id) search.set("child_id", params.child_id);
  if (params.source_type) search.set("source_type", params.source_type);
  if (params.limit) search.set("limit", String(params.limit));

  const query = search.toString();

  return useQuery({
    queryKey: ["cara-studio-sources", params],
    queryFn: () => api.get<CaraSourceListResponse>(`/cara-studio/sources${query ? `?${query}` : ""}`),
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

export function useCaraGaps(params: GapListParams = {}) {
  const search = new URLSearchParams();
  if (params.home_id) search.set("home_id", params.home_id);
  if (params.child_id) search.set("child_id", params.child_id);
  if (params.status) search.set("status", params.status);
  if (params.severity) search.set("severity", params.severity);
  if (params.refresh) search.set("refresh", "true");

  const query = search.toString();

  return useQuery({
    queryKey: ["cara-studio-gaps", params],
    queryFn: () => api.get<CaraGapListResponse>(`/cara-studio/gaps${query ? `?${query}` : ""}`),
    refetchInterval: 60000,
  });
}

export function useUpdateCaraGap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; status?: string; assigned_to?: string }) =>
      api.patch<{ data: CaraGap }>("/cara-studio/gaps", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cara-studio-gaps"] });
    },
  });
}
