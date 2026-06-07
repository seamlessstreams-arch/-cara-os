"use client";

// React-Query hooks for the ARIA Practice Intelligence API. These routes live at
// /api/aria/practice-intelligence/* (NOT under /api/v1), so we use a small local
// fetch helper that still forwards the demo x-user-id identity header.

import { useMutation, useQuery } from "@tanstack/react-query";
import type { AriaPracticeOutput, PracticeSourceType, AriaAssessmentType } from "@/lib/aria-practice/types";
import type { AriaDraftType, AriaDraftResult } from "@/lib/aria-practice/aria-draft";
import type { PracticeDashboard } from "@/lib/aria-practice/aria-dashboard";

const ROOT = "/api/aria/practice-intelligence";

function userHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const id = localStorage.getItem("cs_user_id");
  return id ? { "x-user-id": id } : {};
}

async function practiceFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ROOT}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...userHeader(), ...(options?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `ARIA error ${res.status}`);
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
  assessmentType?: AriaAssessmentType;
  persist?: boolean;
}
export type AnalyseResponse = { data: AriaPracticeOutput & { assessmentId: string | null; persisted: boolean } };
export function useAriaPracticeAnalyse() {
  return useMutation({
    mutationFn: (input: AnalyseInput) => practiceFetch<AnalyseResponse>("/analyse", { method: "POST", body: JSON.stringify(input) }),
  });
}

// ── Draft ─────────────────────────────────────────────────────────────────────
export interface DraftInput {
  draftType: AriaDraftType;
  sourceType: PracticeSourceType;
  content: string;
  childId?: string | null;
  staffId?: string | null;
  homeId?: string | null;
}
export function useAriaPracticeDraft() {
  return useMutation({
    mutationFn: (input: DraftInput) => practiceFetch<{ data: AriaDraftResult }>("/draft", { method: "POST", body: JSON.stringify(input) }),
  });
}

// ── Threshold & LADO ──────────────────────────────────────────────────────────
export function useAriaThreshold() {
  return useMutation({
    mutationFn: (input: { childId?: string; concern: string; homeId?: string }) =>
      practiceFetch<{ data: Record<string, unknown> }>("/threshold", { method: "POST", body: JSON.stringify(input) }),
  });
}
export function useAriaLado() {
  return useMutation({
    mutationFn: (input: { childId?: string; staffId?: string; concern: string; homeId?: string }) =>
      practiceFetch<{ data: Record<string, unknown> }>("/lado", { method: "POST", body: JSON.stringify(input) }),
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function useAriaPracticeDashboard(homeId?: string, childId?: string) {
  const qs = new URLSearchParams();
  if (homeId) qs.set("homeId", homeId);
  if (childId) qs.set("childId", childId);
  const s = qs.toString();
  return useQuery({
    queryKey: ["aria-practice-dashboard", homeId ?? null, childId ?? null],
    queryFn: () => practiceFetch<{ data: PracticeDashboard & { meta: Record<string, unknown> } }>(`/dashboard${s ? `?${s}` : ""}`),
  });
}
