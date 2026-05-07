import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MoneyRecord } from "@/types/extended";

const KEY = "money-records";

export function useMoneyRecords() {
  return useQuery<{ data: MoneyRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/money-records").then((r) => r.json()),
  });
}

export function useCreateMoneyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MoneyRecord>) =>
      fetch("/api/v1/money-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
