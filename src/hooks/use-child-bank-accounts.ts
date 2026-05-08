import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChildBankAccount } from "@/types/extended";

const KEY = "child-bank-accounts";
const API = "/api/v1/child-bank-accounts";

export function useChildBankAccounts(childId?: string) {
  return useQuery<{ data: ChildBankAccount[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateChildBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildBankAccount>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateChildBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildBankAccount> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
