import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TransportLogRecord } from "@/types/extended";

export function useTransportLogRecords() {
  return useQuery<TransportLogRecord[]>({
    queryKey: ["transport-log-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/transport-log-records");
      if (!res.ok) throw new Error("Failed to fetch transport log records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateTransportLogRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<TransportLogRecord, "id">) => {
      const res = await fetch("/api/v1/transport-log-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create transport log record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transport-log-records"] }),
  });
}
