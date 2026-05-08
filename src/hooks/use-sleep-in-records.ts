import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SleepInRecord } from "@/types/extended";

export function useSleepInRecords() {
  return useQuery<SleepInRecord[]>({
    queryKey: ["sleep-in-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/sleep-in-records");
      if (!res.ok) throw new Error("Failed to fetch sleep-in records");
      return res.json();
    },
  });
}

export function useCreateSleepInRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<SleepInRecord, "id">) => {
      const res = await fetch("/api/v1/sleep-in-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create sleep-in record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sleep-in-records"] }),
  });
}
