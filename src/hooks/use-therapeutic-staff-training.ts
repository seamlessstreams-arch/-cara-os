"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TherapeuticStaffTraining } from "@/types/extended";

const KEY = "therapeutic-staff-training";

export function useTherapeuticStaffTraining(homeId?: string) {
  const qs = homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: TherapeuticStaffTraining[] }>({
    queryKey: [KEY, homeId],
    queryFn: () => fetch(`/api/v1/therapeutic-staff-training${qs}`).then((r) => r.json()),
  });
}

export function useCreateTherapeuticStaffTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TherapeuticStaffTraining>) =>
      fetch("/api/v1/therapeutic-staff-training", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
