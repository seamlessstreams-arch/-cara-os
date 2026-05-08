import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ContactDirectoryEntry } from "@/types/extended";

const KEY = "contact-directory-entries";
const API = "/api/v1/contact-directory-entries";

export function useContactDirectoryEntries() {
  return useQuery<{ data: ContactDirectoryEntry[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateContactDirectoryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContactDirectoryEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateContactDirectoryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContactDirectoryEntry> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
