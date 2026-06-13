"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { StaffingCoverResult, StaffingPolicy } from "@/lib/rota/staffing-cover-engine";

export interface StaffingCoverData extends StaffingCoverResult {
  policy: StaffingPolicy;
  projected_count: number;
}

export function useStaffingCover(from?: string, to?: string) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const q = qs.toString();
  return useQuery({
    queryKey: ["staffing-cover", from, to],
    queryFn: () => api.get<{ data: StaffingCoverData }>(`/staffing-cover${q ? `?${q}` : ""}`),
    staleTime: 30_000,
  });
}

export interface CoverReasonInput {
  date: string;
  period: "day" | "night";
  reason: string;
  comment: string;
}

/**
 * Log a reason for extra cover. The POST recomputes on the same instance that
 * wrote the note and returns the updated picture, which we write straight into
 * the cache — so the row flips to "logged" without a refetch that might land on
 * a different (note-less) serverless instance in demo mode.
 */
export function useLogCoverReason(from?: string, to?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CoverReasonInput) =>
      api.post<{ data: StaffingCoverData }>("/staffing-cover", { ...input, from, to }),
    onSuccess: (resp) => {
      qc.setQueryData(["staffing-cover", from, to], resp);
    },
  });
}

export interface StaffingPolicyInput {
  min_day: number;
  min_night: number;
  expected_day: number;
  expected_night: number;
  waking_night_required: boolean;
}

/**
 * Update the home staffing policy (minimums + norms + waking-night rule) and
 * recompute. Same recompute-and-cache approach as logging a reason — the PUT
 * returns the freshly-analysed picture so the view reflects the new policy
 * without a refetch that might land on a stale serverless instance.
 */
export function useUpdateStaffingPolicy(from?: string, to?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policy: StaffingPolicyInput) =>
      api.patch<{ data: StaffingCoverData }>("/staffing-cover", { ...policy, from, to }),
    onSuccess: (resp) => {
      qc.setQueryData(["staffing-cover", from, to], resp);
    },
  });
}
