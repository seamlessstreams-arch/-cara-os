import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SafeTouchProtocolRecord } from "@/types/extended";

export function useSafeTouchProtocolRecords(childId?: string) {
  return useQuery<SafeTouchProtocolRecord[]>({
    queryKey: ["safe-touch-protocol-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/safe-touch-protocol-records?child_id=${childId}`
        : "/api/v1/safe-touch-protocol-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch safe touch protocol records");
      return res.json();
    },
  });
}

export function useCreateSafeTouchProtocolRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SafeTouchProtocolRecord>) => {
      const res = await fetch("/api/v1/safe-touch-protocol-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create safe touch protocol record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["safe-touch-protocol-records"] }),
  });
}
