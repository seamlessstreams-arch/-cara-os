import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ContactPlan } from "@/types/extended";

const KEY = "contact-plans";

export function useContactPlans() {
  return useQuery<{ data: ContactPlan[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/contact-plans").then((r) => r.json()),
  });
}

export function useCreateContactPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContactPlan>) =>
      fetch("/api/v1/contact-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
