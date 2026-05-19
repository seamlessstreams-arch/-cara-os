"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { VehiclePreUseCheck } from "@/types/extended";

const KEY = "vehicle-pre-use-checks";

export function useVehiclePreUseChecks(homeId?: string) {
  const qs = homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: VehiclePreUseCheck[] }>({
    queryKey: [KEY, homeId],
    queryFn: () => fetch(`/api/v1/vehicle-pre-use-checks${qs}`).then((r) => r.json()),
  });
}

export function useCreateVehiclePreUseCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VehiclePreUseCheck>) =>
      fetch("/api/v1/vehicle-pre-use-checks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
