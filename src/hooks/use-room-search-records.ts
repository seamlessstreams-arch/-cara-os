import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RoomSearchRecord } from "@/types/extended";

export function useRoomSearchRecords(childId?: string) {
  return useQuery<RoomSearchRecord[]>({
    queryKey: ["room-search-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/room-search-records?child_id=${childId}`
        : "/api/v1/room-search-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch room search records");
      return res.json();
    },
  });
}

export function useCreateRoomSearchRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<RoomSearchRecord>) => {
      const res = await fetch("/api/v1/room-search-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create room search record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["room-search-records"] }),
  });
}
