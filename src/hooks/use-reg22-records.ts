import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Reg22Record } from "@/types/extended";

export function useReg22Records() {
  return useQuery<Reg22Record[]>({
    queryKey: ["reg22-records"],
    queryFn: () => fetch("/api/v1/reg22-records").then((r) => r.json()),
  });
}

export function useCreateReg22Record() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Reg22Record>) =>
      fetch("/api/v1/reg22-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reg22-records"] }),
  });
}
