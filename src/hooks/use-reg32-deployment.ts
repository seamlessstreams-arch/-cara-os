"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { Reg32DeploymentBoard } from "@/lib/reg32-deployment/reg32-deployment-engine";

export type { Reg32DeploymentBoard };

type Response = { data: Reg32DeploymentBoard };

/** The Reg 32 deployment-suitability board (read-only). Optional staff filter. */
export function useReg32Deployment(params?: { staffId?: string }) {
  const qs = new URLSearchParams();
  if (params?.staffId) qs.set("staff_id", params.staffId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return useQuery({
    queryKey: ["reg32-deployment", params ?? null],
    queryFn: () => api.get<Response>(`/reg32-deployment${suffix}`),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
