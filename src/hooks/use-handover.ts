"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import { careToast } from "@/lib/toast";
import type { Task, Incident, Shift, YoungPerson } from "@/types";
import type { HandoverEntry, HandoverChildUpdate } from "@/types/extended";

interface HandoverResponse {
  data: {
    latest: HandoverEntry | null;
    history: HandoverEntry[];
    today_shifts: Shift[];
    pending_tasks: Task[];
    open_incidents: Incident[];
    young_people: YoungPerson[];
  };
}

interface CreateHandoverPayload {
  home_id?: string;
  shift_date?: string;
  shift_from: HandoverEntry["shift_from"];
  shift_to: HandoverEntry["shift_to"];
  handover_time?: string;
  completed_at?: string | null;
  outgoing_staff?: string[];
  incoming_staff?: string[];
  created_by?: string;
  signed_off_by?: string | null;
  child_updates?: HandoverChildUpdate[];
  general_notes?: string;
  flags?: string[];
  linked_incident_ids?: string[];
}

export function useHandover() {
  return useQuery({
    queryKey: ["handover"],
    queryFn: () => api.get<HandoverResponse>("/handover"),
  });
}

export function useCreateHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHandoverPayload) =>
      api.post<{ data: HandoverEntry }>("/handover", data),
    onSuccess: () => {
      careToast.handoverCreated();
      qc.invalidateQueries({ queryKey: ["handover"] });
    },
    onError: () => careToast.actionFailed("Create handover"),
  });
}
