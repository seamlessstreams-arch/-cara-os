"use client";

// React-Query hooks for the Cara Practice Intelligence API. These routes live at
// /api/cara/practice-intelligence/* (NOT under /api/v1), so we use a small local
// fetch helper that still forwards the demo x-user-id identity header.

import { useMutation, useQuery } from "@tanstack/react-query";
import type { CaraPracticeOutput, PracticeSourceType, CaraAssessmentType } from "@/lib/cara-practice/types";
import type { CaraDraftType, CaraDraftResult } from "@/lib/cara-practice/cara-draft";
import type { PracticeDashboard } from "@/lib/cara-practice/cara-dashboard";
import { currentUserId } from "@/lib/auth/current-user";

const ROOT = "/api/cara/practice-intelligence";

function userHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return { "x-user-id": currentUserId() };
}

async function practiceFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ROOT}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...userHeader(), ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Cara error ${res.status}`);
  }
  return res.json();
}

// ── Analyse ───────────────────────────────────────────────────────────────────
export interface AnalyseInput {
  text: string;
  sourceType: PracticeSourceType;
  sourceId?: string | null;
  childId?: string | null;
  staffId?: string | null;
  homeId?: string | null;
  assessmentType?: CaraAssessmentType;
  persist?: boolean;
}
export type AnalyseResponse = { data: CaraPracticeOutput & { assessmentId: string | null; persisted: boolean } };
export function useCaraPracticeAnalyse() {
  return useMutation({
    mutationFn: (input: AnalyseInput) => practiceFetch<AnalyseResponse>("/analyse", { method: "POST", body: JSON.stringify(input) }),
  });
}

// ── Draft ─────────────────────────────────────────────────────────────────────
export interface DraftInput {
  draftType: CaraDraftType;
  sourceType: PracticeSourceType;
  content: string;
  childId?: string | null;
  staffId?: string | null;
  homeId?: string | null;
}
export function useCaraPracticeDraft() {
  return useMutation({
    mutationFn: (input: DraftInput) => practiceFetch<{ data: CaraDraftResult }>("/draft", { method: "POST", body: JSON.stringify(input) }),
  });
}

// ── Threshold & LADO ──────────────────────────────────────────────────────────
export function useCaraThreshold() {
  return useMutation({
    mutationFn: (input: { childId?: string; concern: string; homeId?: string }) =>
      practiceFetch<{ data: Record<string, unknown> }>("/threshold", { method: "POST", body: JSON.stringify(input) }),
  });
}
export function useCaraLado() {
  return useMutation({
    mutationFn: (input: { childId?: string; staffId?: string; concern: string; homeId?: string }) =>
      practiceFetch<{ data: Record<string, unknown> }>("/lado", { method: "POST", body: JSON.stringify(input) }),
  });
}

// ── Manager review / resolution (persists decisions + rationale, audit trail) ──
export interface ReviewInput {
  entity: "flag" | "assessment" | "threshold";
  id: string;
  rationale?: string;
  decision?: string;
}
export function useCaraReview() {
  return useMutation({
    mutationFn: (input: ReviewInput) =>
      practiceFetch<{ data: Record<string, unknown> }>("/review", { method: "PATCH", body: JSON.stringify(input) }),
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function useCaraPracticeDashboard(homeId?: string, childId?: string) {
  const qs = new URLSearchParams();
  if (homeId) qs.set("homeId", homeId);
  if (childId) qs.set("childId", childId);
  const s = qs.toString();
  return useQuery({
    queryKey: ["cara-practice-dashboard", homeId ?? null, childId ?? null],
    queryFn: () => practiceFetch<{ data: PracticeDashboard & { meta: Record<string, unknown> } }>(`/dashboard${s ? `?${s}` : ""}`),
  });
}
