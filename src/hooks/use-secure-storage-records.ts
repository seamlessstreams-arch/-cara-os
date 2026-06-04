import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SecureStorageRecord } from "@/types/extended";

export function useSecureStorageRecords() {
  return useQuery<SecureStorageRecord[]>({
    queryKey: ["secure-storage-records"],
    queryFn: async () => {
      const res = await fetch("/api/v1/secure-storage-records");
      if (!res.ok) throw new Error("Failed to fetch secure storage records");
      const json = await res.json(); return Array.isArray(json) ? json : (json?.data ?? []);
    },
  });
}

export function useCreateSecureStorageRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SecureStorageRecord>) => {
      const res = await fetch("/api/v1/secure-storage-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create secure storage record");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["secure-storage-records"] }),
  });
}
