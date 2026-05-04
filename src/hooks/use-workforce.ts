"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WORKFORCE INTELLIGENCE HOOKS
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  StaffCompetencyProfile,
  DevelopmentPlan,
  PracticeObservation,
  SuccessionPlan,
  AppraisalRecord,
  InductionRecord,
  QualificationRecord,
} from "@/types/extended";

type ListResponse<T> = { data: T[]; meta: Record<string, unknown> };
type SingleResponse<T> = { data: T };

// ── Competency Profiles ───────────────────────────────────────────────────────

export function useCompetencyProfiles(params?: { homeId?: string }) {
  const qs = params?.homeId ? `?home_id=${params.homeId}` : "";
  return useQuery({
    queryKey: ["workforce", "competency-profiles", params],
    queryFn: () => api.get<ListResponse<StaffCompetencyProfile>>(`/workforce/competency-profiles${qs}`),
  });
}

export function useStaffCompetencyProfile(staffId: string) {
  return useQuery({
    queryKey: ["workforce", "competency-profiles", staffId],
    queryFn: () =>
      api.get<SingleResponse<StaffCompetencyProfile>>(`/workforce/competency-profiles?staff_id=${staffId}`),
    enabled: !!staffId,
  });
}

export function useUpdateCompetencyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffCompetencyProfile> }) =>
      api.patch<SingleResponse<StaffCompetencyProfile>>(`/workforce/competency-profiles/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workforce", "competency-profiles"] }),
  });
}

// ── Development Plans ─────────────────────────────────────────────────────────

export function useDevelopmentPlans(params?: { staffId?: string; status?: string }) {
  const parts: string[] = [];
  if (params?.staffId) parts.push(`staff_id=${params.staffId}`);
  if (params?.status) parts.push(`status=${params.status}`);
  const qs = parts.length ? `?${parts.join("&")}` : "";

  return useQuery({
    queryKey: ["workforce", "development-plans", params],
    queryFn: () => api.get<ListResponse<DevelopmentPlan>>(`/workforce/development-plans${qs}`),
  });
}

export function useCreateDevelopmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DevelopmentPlan>) =>
      api.post<SingleResponse<DevelopmentPlan>>("/workforce/development-plans", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workforce", "development-plans"] }),
  });
}

export function useUpdateDevelopmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DevelopmentPlan> }) =>
      api.patch<SingleResponse<DevelopmentPlan>>(`/workforce/development-plans/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workforce", "development-plans"] }),
  });
}

// ── Practice Observations ─────────────────────────────────────────────────────

export function usePracticeObservations(params?: { staffId?: string }) {
  const qs = params?.staffId ? `?staff_id=${params.staffId}` : "";
  return useQuery({
    queryKey: ["workforce", "observations", params],
    queryFn: () => api.get<ListResponse<PracticeObservation>>(`/workforce/observations${qs}`),
  });
}

export function useCreatePracticeObservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PracticeObservation>) =>
      api.post<SingleResponse<PracticeObservation>>("/workforce/observations", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workforce", "observations"] }),
  });
}

// ── Succession Plans ──────────────────────────────────────────────────────────

export function useSuccessionPlans(params?: { homeId?: string }) {
  const qs = params?.homeId ? `?home_id=${params.homeId}` : "";
  return useQuery({
    queryKey: ["workforce", "succession", params],
    queryFn: () => api.get<ListResponse<SuccessionPlan>>(`/workforce/succession${qs}`),
  });
}

export function useCreateSuccessionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SuccessionPlan>) =>
      api.post<SingleResponse<SuccessionPlan>>("/workforce/succession", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workforce", "succession"] }),
  });
}

// ── Appraisals ────────────────────────────────────────────────────────────────

export function useAppraisals(params?: { staffId?: string; status?: string }) {
  const parts: string[] = [];
  if (params?.staffId) parts.push(`staff_id=${params.staffId}`);
  if (params?.status) parts.push(`status=${params.status}`);
  const qs = parts.length ? `?${parts.join("&")}` : "";

  return useQuery({
    queryKey: ["workforce", "appraisals", params],
    queryFn: () => api.get<ListResponse<AppraisalRecord>>(`/workforce/appraisals${qs}`),
  });
}

export function useCreateAppraisal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AppraisalRecord>) =>
      api.post<SingleResponse<AppraisalRecord>>("/workforce/appraisals", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workforce", "appraisals"] }),
  });
}

export function useUpdateAppraisal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AppraisalRecord> }) =>
      api.patch<SingleResponse<AppraisalRecord>>(`/workforce/appraisals/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workforce", "appraisals"] }),
  });
}

// ── Induction Records ─────────────────────────────────────────────────────────

export function useInductionRecords(params?: { staffId?: string; status?: string }) {
  const parts: string[] = [];
  if (params?.staffId) parts.push(`staff_id=${params.staffId}`);
  if (params?.status) parts.push(`status=${params.status}`);
  const qs = parts.length ? `?${parts.join("&")}` : "";

  return useQuery({
    queryKey: ["workforce", "induction", params],
    queryFn: () => api.get<ListResponse<InductionRecord>>(`/workforce/induction${qs}`),
  });
}

export function useStaffInductionRecord(staffId: string) {
  return useQuery({
    queryKey: ["workforce", "induction", staffId],
    queryFn: () =>
      api.get<SingleResponse<InductionRecord>>(`/workforce/induction?staff_id=${staffId}`),
    enabled: !!staffId,
  });
}

// ── Qualifications ────────────────────────────────────────────────────────────

export function useQualifications(params?: { staffId?: string; expiringDays?: number }) {
  const parts: string[] = [];
  if (params?.staffId) parts.push(`staff_id=${params.staffId}`);
  if (params?.expiringDays) parts.push(`expiring_days=${params.expiringDays}`);
  const qs = parts.length ? `?${parts.join("&")}` : "";

  return useQuery({
    queryKey: ["workforce", "qualifications", params],
    queryFn: () => api.get<ListResponse<QualificationRecord>>(`/workforce/qualifications${qs}`),
  });
}

export function useCreateQualification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<QualificationRecord>) =>
      api.post<SingleResponse<QualificationRecord>>("/workforce/qualifications", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workforce", "qualifications"] }),
  });
}
