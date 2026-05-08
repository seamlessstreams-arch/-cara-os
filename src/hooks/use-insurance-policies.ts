import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InsurancePolicy } from "@/types/extended";

const KEY = "insurance-policies";

export function useInsurancePolicies() {
  return useQuery<{ data: InsurancePolicy[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/insurance-policies").then((r) => r.json()),
  });
}

export function useCreateInsurancePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InsurancePolicy>) =>
      fetch("/api/v1/insurance-policies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
