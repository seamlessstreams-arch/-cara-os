import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SaltRecord } from "@/types/extended";

const KEY = "salt-records";

export function useSaltRecords() {
  return useQuery<{ data: SaltRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/salt-records").then((r) => r.json()),
  });
}

export function useCreateSaltRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SaltRecord>) =>
      fetch("/api/v1/salt-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
