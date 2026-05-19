"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FILING CABINET & SAVED TIME HOOKS
// React Query hooks for filing cabinet and saved-time dashboard
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { FilingCabinetItem, SavedTimeMetric } from "@/types/care-events";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FilingCabinetItemEnriched extends FilingCabinetItem {
  care_event: {
    id: string;
    title: string;
    category: string;
    status: string;
    event_date: string;
    staff_id: string;
  } | null;
  child_name: string | null;
}

export interface FilingCabinetMeta {
  total: number;
  verified: number;
  unverified: number;
  category_counts: Record<string, number>;
}

export interface SavedTimeMetricEnriched extends SavedTimeMetric {
  care_event: {
    id: string;
    title: string;
    category: string;
    event_date: string;
  } | null;
}

export interface SavedTimeMeta {
  total_minutes: number;
  total_hours: number;
  total_entries: number;
  by_route: Record<string, { minutes: number; count: number }>;
  by_staff: Record<string, { minutes: number; count: number; name: string }>;
  daily: Array<{ date: string; minutes: number }>;
  estimated_value_gbp: number;
}

// ── Filing Cabinet Hooks ──────────────────────────────────────────────────────

interface FilingParams {
  category?: string;
  child_id?: string;
  verified?: boolean;
  search?: string;
}

export function useFilingCabinet(params?: FilingParams) {
  const qs = new URLSearchParams();
  if (params?.category !== undefined) qs.set("category", params.category);
  if (params?.child_id) qs.set("child_id", params.child_id);
  if (params?.verified !== undefined) qs.set("verified", String(params.verified));
  if (params?.search) qs.set("search", params.search);
  const query = qs.toString() ? `?${qs.toString()}` : "";

  return useQuery<{ items: FilingCabinetItemEnriched[]; meta: FilingCabinetMeta }>({
    queryKey: ["filing-cabinet", params],
    queryFn: () => api.get(`/api/v1/filing-cabinet${query}`),
  });
}

export function useVerifyFilingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; verified_by: string }) =>
      api.patch("/api/v1/filing-cabinet", { ...vars, action: "verify" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["filing-cabinet"] }),
  });
}

// ── Saved Time Hooks ──────────────────────────────────────────────────────────

interface SavedTimeParams {
  staff_id?: string;
  route_type?: string;
  from_date?: string;
  to_date?: string;
}

export function useSavedTime(params?: SavedTimeParams) {
  const qs = new URLSearchParams();
  if (params?.staff_id) qs.set("staff_id", params.staff_id);
  if (params?.route_type) qs.set("route_type", params.route_type);
  if (params?.from_date) qs.set("from_date", params.from_date);
  if (params?.to_date) qs.set("to_date", params.to_date);
  const query = qs.toString() ? `?${qs.toString()}` : "";

  return useQuery<{ metrics: SavedTimeMetricEnriched[]; meta: SavedTimeMeta }>({
    queryKey: ["saved-time", params],
    queryFn: () => api.get(`/api/v1/saved-time${query}`),
  });
}
