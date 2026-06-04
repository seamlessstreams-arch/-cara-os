import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffReflectionRecord } from "@/types/extended";

export function useStaffReflectionRecords() {
  return useQuery<StaffReflectionRecord[]>({
    queryKey: ["staff-reflection-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-reflection-records");
      if (!res.ok) throw new Error("Failed to fetch staff reflection records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateStaffReflectionRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffReflectionRecord, "id">) => {
      const res = await fetch("/api/v1/staff-reflection-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff reflection record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-reflection-records"] }),
  });
}
