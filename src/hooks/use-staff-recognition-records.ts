import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StaffRecognitionRecord } from "@/types/extended";

export function useStaffRecognitionRecords() {
  return useQuery<StaffRecognitionRecord[]>({
    queryKey: ["staff-recognition-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/staff-recognition-records");
      if (!res.ok) throw new Error("Failed to fetch staff recognition records");
      return res.json();
    },
  });
}

export function useCreateStaffRecognitionRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<StaffRecognitionRecord, "id">) => {
      const res = await fetch("/api/v1/staff-recognition-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create staff recognition record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff-recognition-records"] }),
  });
}
