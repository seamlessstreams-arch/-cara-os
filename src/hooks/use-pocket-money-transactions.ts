import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PocketMoneyTransaction } from "@/types/extended";

export function usePocketMoneyTransactions(childId?: string) {
  return useQuery<PocketMoneyTransaction[]>({
    queryKey: ["pocket-money-transactions", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/pocket-money-transactions?child_id=${childId}`
        : "/api/v1/pocket-money-transactions";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
}

export function useCreatePocketMoneyTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PocketMoneyTransaction>) => {
      const res = await fetch("/api/v1/pocket-money-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pocket-money-transactions"] }),
  });
}
