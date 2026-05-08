import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProfessionalNetworkContact } from "@/types/extended";

export function useProfessionalNetworkContacts(childId?: string) {
  return useQuery<ProfessionalNetworkContact[]>({
    queryKey: ["professional-network-contacts", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/professional-network-contacts?child_id=${childId}`
        : "/api/v1/professional-network-contacts";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch professional network contacts");
      return res.json();
    },
  });
}

export function useCreateProfessionalNetworkContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProfessionalNetworkContact>) => {
      const res = await fetch("/api/v1/professional-network-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create professional network contact");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional-network-contacts"] }),
  });
}
