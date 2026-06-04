import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LocationAssessmentArea } from "@/types/extended";

export function useLocationAssessmentAreas() {
  return useQuery<LocationAssessmentArea[]>({
    queryKey: ["location-assessment-areas"],
    queryFn: async () => {
      const res = await fetch("/api/v1/location-assessment-areas");
      if (!res.ok) throw new Error("Failed to fetch location assessment areas");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateLocationAssessmentArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<LocationAssessmentArea>) => {
      const res = await fetch("/api/v1/location-assessment-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create location assessment area");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["location-assessment-areas"] }),
  });
}
