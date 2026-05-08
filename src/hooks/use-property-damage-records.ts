import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PropertyDamageRecord } from "@/types/extended";

export function usePropertyDamageRecords() {
  return useQuery<PropertyDamageRecord[]>({
    queryKey: ["property-damage-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/property-damage-records");
      if (!res.ok) throw new Error("Failed to fetch property damage records");
      return res.json();
    },
  });
}

export function useCreatePropertyDamageRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PropertyDamageRecord>) => {
      const res = await fetch("/api/v1/property-damage-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create property damage record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["property-damage-records"] }),
  });
}
