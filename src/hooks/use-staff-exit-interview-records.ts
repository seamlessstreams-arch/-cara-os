import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffExitInterviewRecord } from "@/types/extended";

export function useStaffExitInterviewRecords() {
  return useQuery<StaffExitInterviewRecord[]>({
    queryKey: ["staff-exit-interview-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-exit-interview-records");
      if (!res.ok) throw new Error("Failed to fetch staff exit interview records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateStaffExitInterviewRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffExitInterviewRecord, "id">) => {
      const res = await fetch("/api/v1/staff-exit-interview-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff exit interview record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-exit-interview-records"] }),
  });
}
