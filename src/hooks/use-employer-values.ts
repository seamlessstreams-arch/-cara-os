"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EmployerValuesProfile } from "@/lib/engines/values-match-engine";

export function useEmployerValues() {
  return useQuery<EmployerValuesProfile | null>({
    queryKey: ["employer-values"],
    queryFn: async () => {
      const res = await fetch("/api/v1/employer-values");
      if (!res.ok) throw new Error("Failed to fetch employer values");
      return (await res.json()).data;
    },
    refetchInterval: 120_000,
  });
}

export function useSaveEmployerValues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<EmployerValuesProfile>) => {
      const res = await fetch("/api/v1/employer-values", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to save employer values");
      return (await res.json()).data as EmployerValuesProfile;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employer-values"] });
      qc.invalidateQueries({ queryKey: ["values-match"] });
    },
  });
}
