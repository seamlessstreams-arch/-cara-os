import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SensoryRoomUsageRecord } from "@/types/extended";

export function useSensoryRoomUsageRecords(childId?: string) {
  return useQuery<SensoryRoomUsageRecord[]>({
    queryKey: ["sensory-room-usage-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/sensory-room-usage-records?child_id=${childId}`
        : "/api/v1/sensory-room-usage-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch sensory room usage records");
      return res.json();
    },
  });
}

export function useCreateSensoryRoomUsageRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<SensoryRoomUsageRecord, "id">) => {
      const res = await fetch("/api/v1/sensory-room-usage-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create sensory room usage record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sensory-room-usage-records"] }),
  });
}
