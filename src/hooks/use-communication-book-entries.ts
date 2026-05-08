import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CommunicationBookEntry } from "@/types/extended";

const KEY = "communication-book-entries";
const API = "/api/v1/communication-book-entries";

export function useCommunicationBookEntries() {
  return useQuery<{ data: CommunicationBookEntry[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateCommunicationBookEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CommunicationBookEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCommunicationBookEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CommunicationBookEntry> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
