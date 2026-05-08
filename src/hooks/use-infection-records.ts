import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfectionRecord } from "@/types/extended";

const KEY = "infection-records";

export function useInfectionRecords() {
  return useQuery<{ data: InfectionRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/infection-records").then((r) => r.json()),
  });
}

export function useCreateInfectionRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InfectionRecord>) =>
      fetch("/api/v1/infection-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
