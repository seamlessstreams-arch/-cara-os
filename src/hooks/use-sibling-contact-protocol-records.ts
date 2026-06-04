import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SiblingContactProtocolRecord } from "@/types/extended";

export function useSiblingContactProtocolRecords(childId?: string) {
  return useQuery<SiblingContactProtocolRecord[]>({
    queryKey: ["sibling-contact-protocol-records", childId],
    queryFn: async () => {
      const url = childId
        ? `/api/v1/sibling-contact-protocol-records?child_id=${childId}`
        : "/api/v1/sibling-contact-protocol-records";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch sibling contact protocol records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateSiblingContactProtocolRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<SiblingContactProtocolRecord, "id">) => {
      const res = await fetch("/api/v1/sibling-contact-protocol-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create sibling contact protocol record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sibling-contact-protocol-records"] }),
  });
}
