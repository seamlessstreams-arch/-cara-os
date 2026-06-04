import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SensoryEquipmentRecord } from "@/types/extended";

export function useSensoryEquipmentRecords() {
  return useQuery<SensoryEquipmentRecord[]>({
    queryKey: ["sensory-equipment-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/sensory-equipment-records");
      if (!res.ok) throw new Error("Failed to fetch sensory equipment records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateSensoryEquipmentRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SensoryEquipmentRecord>) => {
      const res = await fetch("/api/v1/sensory-equipment-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create sensory equipment record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sensory-equipment-records"] }),
  });
}
