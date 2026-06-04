import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProfessionalConsultation } from "@/types/extended";

export function useProfessionalConsultations(childId?: string) {
  return useQuery<ProfessionalConsultation[]>({
    queryKey: ["professional-consultations", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/professional-consultations?child_id=${childId}`
        : "/api/v1/professional-consultations";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch professional consultations");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateProfessionalConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProfessionalConsultation>) => {
      const res = await fetch("/api/v1/professional-consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create professional consultation");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional-consultations"] }),
  });
}
