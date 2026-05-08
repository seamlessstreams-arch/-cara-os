import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EqualityInitiative } from "@/types/extended";

const KEY = "equality-initiatives";

export function useEqualityInitiatives() {
  return useQuery<{ data: EqualityInitiative[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/equality-initiatives").then((r) => r.json()),
  });
}

export function useCreateEqualityInitiative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EqualityInitiative>) =>
      fetch("/api/v1/equality-initiatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
