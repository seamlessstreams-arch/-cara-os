import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DiversityCalendarEvent } from "@/types/extended";

const KEY = "diversity-calendar-events";
const API = "/api/v1/diversity-calendar-events";

export function useDiversityCalendarEvents() {
  return useQuery<{ data: DiversityCalendarEvent[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateDiversityCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DiversityCalendarEvent>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDiversityCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DiversityCalendarEvent> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
