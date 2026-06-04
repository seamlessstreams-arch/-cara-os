import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ShiftNoteRecord } from "@/types/extended";

export function useShiftNoteRecords() {
  return useQuery<ShiftNoteRecord[]>({
    queryKey: ["shift-note-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/shift-note-records");
      if (!res.ok) throw new Error("Failed to fetch shift note records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateShiftNoteRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<ShiftNoteRecord, "id">) => {
      const res = await fetch("/api/v1/shift-note-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create shift note record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift-note-records"] }),
  });
}
