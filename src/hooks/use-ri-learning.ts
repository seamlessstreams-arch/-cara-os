"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RI COMMAND CENTRE + LEARNING STUDIO HOOKS
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  RiChallengeLog,
  RiGovernanceReport,
  RiReg45Evidence,
  RiAlert,
  Reg44Visit,
  LearningProject,
  GeneratedResource,
  TrainingNeed,
  KnowledgeGap,
  ResourceLibraryEntry,
} from "@/types/extended";

type ListResponse<T> = { data: T[]; meta: Record<string, unknown> };
type SingleResponse<T> = { data: T };

// ══════════════════════════════════════════════════════════════════════════════
// RI COMMAND CENTRE
// ══════════════════════════════════════════════════════════════════════════════

// ── RI Challenge Logs ─────────────────────────────────────────────────────────

export function useRiChallengeLogs(params: { homeId: string }) {
  return useQuery({
    queryKey: ["ri", "challenge-logs", params.homeId],
    queryFn: () =>
      api.get<ListResponse<RiChallengeLog>>(
        `/ri/challenge-logs?home_id=${params.homeId}`
      ),
  });
}

export function useRiChallengeLog(id: string) {
  return useQuery({
    queryKey: ["ri", "challenge-logs", id],
    queryFn: () => api.get<SingleResponse<RiChallengeLog>>(`/ri/challenge-logs/${id}`),
    enabled: !!id,
  });
}

export function useCreateRiChallengeLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RiChallengeLog>) =>
      api.post<SingleResponse<RiChallengeLog>>("/ri/challenge-logs", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ri", "challenge-logs"] });
      qc.invalidateQueries({ queryKey: ["ri", "alerts"] });
    },
  });
}

export function useUpdateRiChallengeLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<RiChallengeLog>) =>
      api.patch<SingleResponse<RiChallengeLog>>(`/ri/challenge-logs/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ri", "challenge-logs"] });
    },
  });
}

// ── RI Governance Reports ─────────────────────────────────────────────────────

export function useRiGovernanceReports(params: { homeId: string }) {
  return useQuery({
    queryKey: ["ri", "governance-reports", params.homeId],
    queryFn: () =>
      api.get<ListResponse<RiGovernanceReport>>(
        `/ri/governance-reports?home_id=${params.homeId}`
      ),
  });
}

export function useCreateRiGovernanceReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RiGovernanceReport>) =>
      api.post<SingleResponse<RiGovernanceReport>>("/ri/governance-reports", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ri", "governance-reports"] });
    },
  });
}

export function useUpdateRiGovernanceReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<RiGovernanceReport>) =>
      api.patch<SingleResponse<RiGovernanceReport>>(`/ri/governance-reports/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ri", "governance-reports"] });
    },
  });
}

// ── RI Reg 45 Evidence ────────────────────────────────────────────────────────

export function useRiReg45Evidence(params: { homeId: string }) {
  return useQuery({
    queryKey: ["ri", "reg45", params.homeId],
    queryFn: () =>
      api.get<ListResponse<RiReg45Evidence>>(
        `/ri/reg45?home_id=${params.homeId}`
      ),
  });
}

export function useRiReg45Record(id: string) {
  return useQuery({
    queryKey: ["ri", "reg45", id],
    queryFn: () => api.get<SingleResponse<RiReg45Evidence>>(`/ri/reg45/${id}`),
    enabled: !!id,
  });
}

export function useCreateRiReg45Evidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RiReg45Evidence>) =>
      api.post<SingleResponse<RiReg45Evidence>>("/ri/reg45", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ri", "reg45"] });
    },
  });
}

export function useUpdateRiReg45Evidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<RiReg45Evidence>) =>
      api.patch<SingleResponse<RiReg45Evidence>>(`/ri/reg45/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ri", "reg45"] });
    },
  });
}

// ── RI Alerts ─────────────────────────────────────────────────────────────────

export function useRiAlerts(params: { homeId: string }) {
  return useQuery({
    queryKey: ["ri", "alerts", params.homeId],
    queryFn: () =>
      api.get<ListResponse<RiAlert> & { meta: { critical: number; unresolved: number } }>(
        `/ri/alerts?home_id=${params.homeId}`
      ),
  });
}

export function useCreateRiAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RiAlert>) =>
      api.post<SingleResponse<RiAlert>>("/ri/alerts", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ri", "alerts"] });
    },
  });
}

export function useResolveRiAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolution_note, resolved_by }: { id: string; resolution_note: string; resolved_by: string }) =>
      api.patch<SingleResponse<RiAlert>>(`/ri/alerts/${id}`, {
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by,
        resolution_note,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ri", "alerts"] });
    },
  });
}

// ── Reg 44 Visits ─────────────────────────────────────────────────────────────

export function useReg44Visits(params: { homeId: string }) {
  return useQuery({
    queryKey: ["ri", "reg44", params.homeId],
    queryFn: () =>
      api.get<ListResponse<Reg44Visit> & { meta: { scheduled: number; open_actions: number } }>(
        `/ri/reg44?home_id=${params.homeId}`
      ),
  });
}

export function useReg44Visit(id: string) {
  return useQuery({
    queryKey: ["ri", "reg44", id],
    queryFn: () => api.get<{ data: Reg44Visit }>(`/ri/reg44/${id}`),
    enabled: !!id,
  });
}

export function useUpdateReg44Visit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Reg44Visit> }) =>
      api.patch<{ data: Reg44Visit }>(`/ri/reg44/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ri", "reg44"] });
    },
  });
}

export function useCreateReg44Visit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Reg44Visit>) =>
      api.post<{ data: Reg44Visit }>("/ri/reg44", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ri", "reg44"] });
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// LEARNING STUDIO
// ══════════════════════════════════════════════════════════════════════════════

// ── Learning Projects ─────────────────────────────────────────────────────────

export function useLearningProjects(params: { homeId: string }) {
  return useQuery({
    queryKey: ["learning", "projects", params.homeId],
    queryFn: () =>
      api.get<ListResponse<LearningProject>>(
        `/learning/projects?home_id=${params.homeId}`
      ),
  });
}

export function useLearningProject(id: string) {
  return useQuery({
    queryKey: ["learning", "projects", id],
    queryFn: () => api.get<SingleResponse<LearningProject>>(`/learning/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateLearningProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LearningProject>) =>
      api.post<SingleResponse<LearningProject>>("/learning/projects", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning", "projects"] });
    },
  });
}

export function useUpdateLearningProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<LearningProject>) =>
      api.patch<SingleResponse<LearningProject>>(`/learning/projects/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning", "projects"] });
    },
  });
}

// ── Generated Resources ───────────────────────────────────────────────────────

export function useGeneratedResources(params: { homeId: string; projectId?: string }) {
  const query = new URLSearchParams({ home_id: params.homeId });
  if (params.projectId) query.set("project_id", params.projectId);
  return useQuery({
    queryKey: ["learning", "resources", params.homeId, params.projectId],
    queryFn: () =>
      api.get<ListResponse<GeneratedResource>>(`/learning/resources?${query}`),
  });
}

export function useGeneratedResource(id: string) {
  return useQuery({
    queryKey: ["learning", "resources", id],
    queryFn: () => api.get<SingleResponse<GeneratedResource>>(`/learning/resources/${id}`),
    enabled: !!id,
  });
}

export function useCreateGeneratedResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GeneratedResource>) =>
      api.post<SingleResponse<GeneratedResource>>("/learning/resources", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning", "resources"] });
      qc.invalidateQueries({ queryKey: ["learning", "library"] });
    },
  });
}

export function useUpdateGeneratedResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<GeneratedResource>) =>
      api.patch<SingleResponse<GeneratedResource>>(`/learning/resources/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning", "resources"] });
      qc.invalidateQueries({ queryKey: ["learning", "library"] });
    },
  });
}

// ── Training Needs ────────────────────────────────────────────────────────────

export function useTrainingNeeds(params: { homeId: string }) {
  return useQuery({
    queryKey: ["learning", "training-needs", params.homeId],
    queryFn: () =>
      api.get<ListResponse<TrainingNeed> & { meta: { urgent: number; total: number } }>(
        `/learning/training-needs?home_id=${params.homeId}`
      ),
  });
}

export function useTrainingNeed(id: string) {
  return useQuery({
    queryKey: ["learning", "training-needs", id],
    queryFn: () => api.get<SingleResponse<TrainingNeed>>(`/learning/training-needs/${id}`),
    enabled: !!id,
  });
}

export function useCreateTrainingNeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TrainingNeed>) =>
      api.post<SingleResponse<TrainingNeed>>("/learning/training-needs", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning", "training-needs"] });
    },
  });
}

export function useUpdateTrainingNeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<TrainingNeed>) =>
      api.patch<SingleResponse<TrainingNeed>>(`/learning/training-needs/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning", "training-needs"] });
      qc.invalidateQueries({ queryKey: ["learning", "projects"] });
    },
  });
}

// ── Knowledge Gaps ────────────────────────────────────────────────────────────

export function useKnowledgeGaps(params: { homeId: string }) {
  return useQuery({
    queryKey: ["learning", "knowledge-gaps", params.homeId],
    queryFn: () =>
      api.get<ListResponse<KnowledgeGap>>(
        `/learning/knowledge-gaps?home_id=${params.homeId}`
      ),
  });
}

export function useCreateKnowledgeGap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<KnowledgeGap>) =>
      api.post<SingleResponse<KnowledgeGap>>("/learning/knowledge-gaps", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning", "knowledge-gaps"] });
      qc.invalidateQueries({ queryKey: ["learning", "training-needs"] });
    },
  });
}

// ── Resource Library ──────────────────────────────────────────────────────────

export function useResourceLibrary(params: { homeId: string }) {
  return useQuery({
    queryKey: ["learning", "library", params.homeId],
    queryFn: () =>
      api.get<ListResponse<ResourceLibraryEntry>>(
        `/learning/library?home_id=${params.homeId}`
      ),
  });
}

export function useCreateResourceLibraryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ResourceLibraryEntry>) =>
      api.post<SingleResponse<ResourceLibraryEntry>>("/learning/library", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning", "library"] });
    },
  });
}

export function useUpdateResourceLibraryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<ResourceLibraryEntry>) =>
      api.patch<SingleResponse<ResourceLibraryEntry>>(`/learning/library/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning", "library"] });
    },
  });
}
