import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SensoryProfileRecord } from "@/types/extended";

export function useSensoryProfileRecords(childId?: string) {
  return useQuery<SensoryProfileRecord[]>({
    queryKey: ["sensory-profile-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/sensory-profile-records?child_id=${childId}`
        : "/api/v1/sensory-profile-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch sensory profile records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateSensoryProfileRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SensoryProfileRecord>) => {
      const res = await fetch("/api/v1/sensory-profile-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create sensory profile record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sensory-profile-records"] }),
  });
}
