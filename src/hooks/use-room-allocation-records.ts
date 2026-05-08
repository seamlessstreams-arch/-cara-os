import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RoomAllocationRecord } from "@/types/extended";

export function useRoomAllocationRecords(childId?: string) {
  return useQuery<RoomAllocationRecord[]>({
    queryKey: ["room-allocation-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/room-allocation-records?child_id=${childId}`
        : "/api/v1/room-allocation-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch room allocation records");
      return res.json();
    },
  });
}

export function useCreateRoomAllocationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<RoomAllocationRecord>) => {
      const res = await fetch("/api/v1/room-allocation-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create room allocation record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["room-allocation-records"] }),
  });
}
