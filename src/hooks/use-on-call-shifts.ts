import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OnCallShift } from "@/types/extended";

const KEY = "on-call-shifts";

async function fetchRecords(): Promise<{ data: OnCallShift[] }> {
  const res = await fetch("/api/v1/on-call-shifts");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useOnCallShifts() {
  return useQuery({ queryKey: [KEY], queryFn: fetchRecords });
}

export function useCreateOnCallShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OnCallShift>) => {
      const res = await fetch("/api/v1/on-call-shifts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateOnCallShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<OnCallShift> & { id: string }) => {
      const res = await fetch("/api/v1/on-call-shifts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
