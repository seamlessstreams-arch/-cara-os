import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ClothingShoppingTrip } from "@/types/extended";

const KEY = "clothing-shopping-trips";
const API = "/api/v1/clothing-shopping-trips";

export function useClothingShoppingTrips(childId?: string) {
  return useQuery<{ data: ClothingShoppingTrip[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateClothingShoppingTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ClothingShoppingTrip>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateClothingShoppingTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ClothingShoppingTrip> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
