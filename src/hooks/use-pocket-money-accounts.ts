import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PocketMoneyAccount } from "@/types/extended";

export function usePocketMoneyAccounts(childId?: string) {
  return useQuery<PocketMoneyAccount[]>({
    queryKey: ["pocket-money-accounts", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/pocket-money-accounts?child_id=${childId}`
        : "/api/v1/pocket-money-accounts";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
}

export function useCreatePocketMoneyAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PocketMoneyAccount>) => {
      const res = await fetch("/api/v1/pocket-money-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pocket-money-accounts"] }),
  });
}
