import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Disclosure } from "@/types/extended";

const KEY = "disclosures";

export function useDisclosures() {
  return useQuery<{ data: Disclosure[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/disclosures").then((r) => r.json()),
  });
}

export function useCreateDisclosure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Disclosure>) =>
      fetch("/api/v1/disclosures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
