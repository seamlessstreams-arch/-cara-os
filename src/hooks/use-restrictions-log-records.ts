import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RestrictionsLogRecord } from "@/types/extended";

async function fetchAll(childId?: string): Promise<RestrictionsLogRecord[]> {
  const url = childId
    ? `/api/v1/restrictions-log-records?child_id=${childId}`
    : "/api/v1/restrictions-log-records";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch restrictions log records");
  return res.json();
}

export function useRestrictionsLogRecords(childId?: string) {
  return useQuery<RestrictionsLogRecord[]>({
    queryKey: ["restrictions-log-records", childId ?? "all"],
    queryFn: () => fetchAll(childId),
  });
}

export function useCreateRestrictionsLogRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<RestrictionsLogRecord>) => {
      const res = await fetch("/api/v1/restrictions-log-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create restrictions log record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restrictions-log-records"] }),
  });
}
