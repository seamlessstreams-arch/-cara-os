"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = "/api/intelligence";

async function ilFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ── Attention Items (Manager Control Centre) ─────────────────────────────────

export function useAttentionItems(params?: {
  homeId?: string;
  status?: string;
  urgency?: string;
  category?: string;
}) {
  const query = new URLSearchParams();
  if (params?.homeId) query.set("homeId", params.homeId);
  if (params?.status) query.set("status", params.status);
  if (params?.urgency) query.set("urgency", params.urgency);
  if (params?.category) query.set("category", params.category);

  return useQuery({
    queryKey: ["il", "attention-items", params],
    queryFn: () => ilFetch<{ ok: boolean; items: unknown[]; persisted: boolean }>(`/attention-items?${query}`),
  });
}

export function useCreateAttentionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/attention-items", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "attention-items"] });
    },
  });
}

export function useUpdateAttentionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/attention-items", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "attention-items"] });
    },
  });
}

// ── HR Risk Command Centre ───────────────────────────────────────────────────

export function useHrRisk() {
  return useQuery({
    queryKey: ["il", "hr-risk"],
    queryFn: () =>
      ilFetch<{
        ok: boolean;
        cases: unknown[];
        overdueTasks: unknown[];
        recruitment: unknown[];
        persisted: boolean;
      }>(`/hr-risk`),
  });
}

export function useHrInspection() {
  return useQuery({
    queryKey: ["il", "hr-inspection"],
    queryFn: () =>
      ilFetch<{
        ok: boolean;
        workforce: unknown;
        recruitment: unknown[];
        cases: unknown[];
        chronology: unknown[];
        suspensions: unknown[];
        lado: unknown[];
        compliance: unknown[];
        oversight: unknown[];
        persisted: boolean;
      }>(`/hr-inspection`),
  });
}

// ── ARIA suggestions (review queue + detail) ─────────────────────────────────

export function useAriaSuggestions(params?: { homeId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.homeId) query.set("homeId", params.homeId);
  if (params?.status) query.set("status", params.status);
  return useQuery({
    queryKey: ["il", "aria-suggestions", params],
    queryFn: () => ilFetch<{ ok: boolean; items: unknown[]; persisted: boolean }>(`/aria-suggestions?${query}`),
  });
}

export function useAriaSuggestion(id?: string) {
  return useQuery({
    queryKey: ["il", "aria-suggestion", id],
    queryFn: () => ilFetch<{ ok: boolean; item: unknown; persisted: boolean }>(`/aria-suggestions?id=${id}`),
    enabled: !!id,
  });
}

export function useUpdateAriaSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/aria-suggestions", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "aria-suggestions"] });
      qc.invalidateQueries({ queryKey: ["il", "aria-suggestion"] });
    },
  });
}

// ── Evidence (Ofsted Evidence Room) ──────────────────────────────────────────

export function useEvidenceItems(params?: {
  homeId?: string;
  judgementArea?: string;
  category?: string;
}) {
  const query = new URLSearchParams();
  if (params?.homeId) query.set("homeId", params.homeId);
  if (params?.judgementArea) query.set("judgementArea", params.judgementArea);
  if (params?.category) query.set("category", params.category);

  return useQuery({
    queryKey: ["il", "evidence", params],
    queryFn: () => ilFetch<{ ok: boolean; items: unknown[]; persisted: boolean }>(`/evidence?${query}`),
  });
}

export function useCreateEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/evidence", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "evidence"] });
    },
  });
}

export function useEvidenceGaps(params?: { homeId?: string }) {
  const query = new URLSearchParams();
  if (params?.homeId) query.set("homeId", params.homeId);
  return useQuery({
    queryKey: ["il", "evidence-gaps", params],
    queryFn: () =>
      ilFetch<{
        ok: boolean;
        gaps: unknown[];
        totalGaps: number;
        criticalCount: number;
        highCount: number;
        gapsByType: Record<string, number>;
        persisted: boolean;
      }>(`/evidence-gaps?${query}`),
  });
}

// ── Progress (Child Progress & Outcomes) ─────────────────────────────────────

export function useProgressGoals(childId?: string) {
  const query = new URLSearchParams({ type: "goals" });
  if (childId) query.set("childId", childId);

  return useQuery({
    queryKey: ["il", "progress", "goals", childId],
    queryFn: () => ilFetch<{ ok: boolean; data: unknown[]; persisted: boolean }>(`/progress?${query}`),
  });
}

export function useProgressEntries(childId?: string) {
  const query = new URLSearchParams({ type: "entries" });
  if (childId) query.set("childId", childId);

  return useQuery({
    queryKey: ["il", "progress", "entries", childId],
    queryFn: () => ilFetch<{ ok: boolean; data: unknown[]; persisted: boolean }>(`/progress?${query}`),
  });
}

export function useProgressSnapshots(childId?: string) {
  const query = new URLSearchParams({ type: "snapshots" });
  if (childId) query.set("childId", childId);

  return useQuery({
    queryKey: ["il", "progress", "snapshots", childId],
    queryFn: () => ilFetch<{ ok: boolean; data: unknown[]; persisted: boolean }>(`/progress?${query}`),
  });
}

export function useCreateProgressRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/progress", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "progress"] });
    },
  });
}

// ── Learning Review (Incident-to-Learning Loop) ──────────────────────────────

export function useLearningReviews(params?: {
  homeId?: string;
  incidentId?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.homeId) query.set("homeId", params.homeId);
  if (params?.incidentId) query.set("incidentId", params.incidentId);
  if (params?.status) query.set("status", params.status);

  return useQuery({
    queryKey: ["il", "learning-review", params],
    queryFn: () => ilFetch<{ ok: boolean; reviews: unknown[]; persisted: boolean }>(`/learning-review?${query}`),
  });
}

export function useCreateLearningReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/learning-review", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "learning-review"] });
    },
  });
}

export function useUpdateLearningReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/learning-review", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "learning-review"] });
    },
  });
}

// ── Voice (Voice of the Child) ───────────────────────────────────────────────

export function useVoiceEntries(params?: {
  childId?: string;
  homeId?: string;
  category?: string;
}) {
  const query = new URLSearchParams();
  if (params?.childId) query.set("childId", params.childId);
  if (params?.homeId) query.set("homeId", params.homeId);
  if (params?.category) query.set("category", params.category);

  return useQuery({
    queryKey: ["il", "voice", params],
    queryFn: () => ilFetch<{ ok: boolean; entries: unknown[]; persisted: boolean }>(`/voice?${query}`),
  });
}

export function useCreateVoiceEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/voice", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "voice"] });
    },
  });
}

// ── Smart Links ──────────────────────────────────────────────────────────────

export function useSmartLinks(params?: {
  sourceType?: string;
  sourceId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.sourceType) query.set("sourceType", params.sourceType);
  if (params?.sourceId) query.set("sourceId", params.sourceId);

  return useQuery({
    queryKey: ["il", "smart-links", params],
    queryFn: () => ilFetch<{ ok: boolean; links: unknown[]; persisted: boolean }>(`/smart-links?${query}`),
    enabled: !!params?.sourceId,
  });
}

export function useSmartLinkSuggestions() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch<{ ok: boolean; suggestions: unknown[] }>("/smart-links", {
        method: "POST",
        body: JSON.stringify({ ...data, action: "suggest" }),
      }),
  });
}

export function useCreateSmartLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/smart-links", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "smart-links"] });
    },
  });
}

// ── Reg 44 ───────────────────────────────────────────────────────────────────

export function useReg44Visits(params?: { homeId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.homeId) query.set("homeId", params.homeId);
  if (params?.status) query.set("status", params.status);

  return useQuery({
    queryKey: ["il", "reg44", params],
    queryFn: () => ilFetch<{ ok: boolean; visits: unknown[]; persisted: boolean }>(`/reg44?${query}`),
  });
}

export function useCreateReg44Visit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/reg44", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "reg44"] });
    },
  });
}

export function useReg44Actions(params?: { homeId?: string; visitId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.homeId) query.set("homeId", params.homeId);
  if (params?.visitId) query.set("visitId", params.visitId);
  if (params?.status) query.set("status", params.status);

  return useQuery({
    queryKey: ["il", "reg44-actions", params],
    queryFn: () => ilFetch<{ ok: boolean; actions: unknown[]; persisted: boolean }>(`/reg44-actions?${query}`),
  });
}

export function useCreateReg44Action() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/reg44-actions", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "reg44-actions"] });
    },
  });
}

export function useUpdateReg44Action() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/reg44-actions", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "reg44-actions"] });
    },
  });
}

// ── Reg 45 ───────────────────────────────────────────────────────────────────

export function useReg45Reviews(params?: { homeId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.homeId) query.set("homeId", params.homeId);
  if (params?.status) query.set("status", params.status);

  return useQuery({
    queryKey: ["il", "reg45", params],
    queryFn: () => ilFetch<{ ok: boolean; reviews: unknown[]; persisted: boolean }>(`/reg45?${query}`),
  });
}

export function useCreateReg45Review() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/reg45", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "reg45"] });
    },
  });
}

export function useUpdateReg45Review() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/reg45", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "reg45"] });
    },
  });
}

export function useReg45Evidence(params?: { homeId?: string }) {
  const query = new URLSearchParams();
  if (params?.homeId) query.set("homeId", params.homeId);

  return useQuery({
    queryKey: ["il", "reg45-evidence", params],
    queryFn: () => ilFetch<{ ok: boolean; evidence: unknown[]; persisted: boolean }>(`/reg45-evidence?${query}`),
  });
}

// ── Competence (Staff Passport) ──────────────────────────────────────────────

export function useCompetenceRecords(params?: { homeId?: string; staffId?: string }) {
  const query = new URLSearchParams();
  if (params?.homeId) query.set("homeId", params.homeId);
  if (params?.staffId) query.set("staffId", params.staffId);

  return useQuery({
    queryKey: ["il", "competence", params],
    queryFn: () => ilFetch<{ ok: boolean; records: unknown[]; persisted: boolean }>(`/competence?${query}`),
  });
}

export function useCreateCompetenceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/competence", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "competence"] });
    },
  });
}

// ── Provider Oversight ───────────────────────────────────────────────────────

export function useProviderSummaries(params?: { homeId?: string; providerId?: string }) {
  const query = new URLSearchParams();
  if (params?.homeId) query.set("homeId", params.homeId);
  if (params?.providerId) query.set("providerId", params.providerId);

  return useQuery({
    queryKey: ["il", "oversight", params],
    queryFn: () => ilFetch<{ ok: boolean; summaries: unknown[]; persisted: boolean }>(`/oversight?${query}`),
  });
}

export function useCreateProviderSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch("/oversight", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "oversight"] });
    },
  });
}

// ── Humanised Oversight ──────────────────────────────────────────────────────

export function useGenerateOversight() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      ilFetch<{ ok: boolean; draft: unknown }>("/humanised-oversight", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}
