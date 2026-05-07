import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OrthoRecord } from "@/types/extended";

const KEY = "ortho-records";

export function useOrthoRecords() {
  return useQuery<{ data: OrthoRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/ortho-records").then((r) => r.json()),
  });
}

export function useCreateOrthoRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<OrthoRecord>) =>
      fetch("/api/v1/ortho-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
