import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InventoryItem } from "@/types/extended";

const KEY = "inventory-items";

export function useInventoryItems() {
  return useQuery<{ data: InventoryItem[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/inventory-items").then((r) => r.json()),
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InventoryItem>) =>
      fetch("/api/v1/inventory-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
