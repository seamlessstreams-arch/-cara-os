import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TripPlan } from "@/types/extended";

const KEY = "trip-plans";
const API = "/api/v1/trip-plans";

export function useTripPlans() {
  return useQuery<{ data: TripPlan[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateTripPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TripPlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateTripPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TripPlan> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
