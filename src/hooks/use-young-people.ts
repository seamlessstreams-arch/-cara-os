"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { YoungPerson, StaffMember } from "@/types";

export interface YPEnriched extends YoungPerson {
  age: number;
  key_worker: StaffMember | null;
  secondary_worker: StaffMember | null;
  open_incidents: number;
  active_tasks: number;
  missing_episodes_total: number;
  last_log_date: string | null;
  active_medications: number;
  risk_flags_count: number;
}

export interface YPDetail extends YPEnriched {
  related: {
    incidents: import("@/types").Incident[];
    tasks: import("@/types").Task[];
    medications: import("@/types").Medication[];
    missing_episodes: unknown[];
    chronology: unknown[];
    care_forms: import("@/types").CareForm[];
    recent_log: import("@/types").DailyLogEntry[];
  };
  meta: {
    today: string;
    total_incidents: number;
    open_incidents: number;
    total_tasks: number;
    active_tasks: number;
  };
}

export function useYoungPerson(id: string) {
  return useQuery({
    queryKey: ["young-people", id],
    queryFn: () => api.get<{ data: YPEnriched; related: YPDetail["related"]; meta: YPDetail["meta"] }>(`/young-people/${id}`),
    enabled: !!id,
  });
}

export function useYoungPeople(status = "current") {
  return useQuery({
    queryKey: ["young-people", status],
    queryFn: () =>
      api.get<{ data: YPEnriched[]; meta: Record<string, number> }>(
        `/young-people?status=${status}`
      ),
  });
}

/**
 * Admit a child to the home — a direct create that persists via the dual-mode
 * dal (POST /api/v1/young-people → dal.youngPeople.create → the young_people
 * table on a live tenant). This is the plain "add a child" path; the full
 * admission-referral workflow is a separate, richer flow.
 */
export function useCreateYoungPerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<YoungPerson>) => api.post<{ data: YoungPerson }>("/young-people", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["young-people"] }),
  });
}

// ── Admit a child (referral-seeded intake) ────────────────────────────────────
// One request: creates the young person, files the initial referral through the
// smart-documents pipeline, seeds draft risk assessments from its extracted
// risk factors, and instantiates the New Placement Admission workflow as dated
// tasks. All deterministic — no AI credits involved.
export interface AdmitChildPayload extends Partial<YoungPerson> {
  referral_text?: string;
  referral_file_name?: string;
  referral_file_type?: string;
}

export interface AdmitChildResult {
  young_person: YoungPerson;
  tasks_created: { id: string; title: string; due_date: string; priority: string }[];
  document: { id: string; category: string; status: string; suggested_tasks: number } | null;
  risk_assessments: { id: string; domain: string }[];
}

export function useAdmitChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AdmitChildPayload) => api.post<{ data: AdmitChildResult }>("/admissions/admit", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["young-people"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["doc-intelligence"] });
    },
  });
}

/**
 * Edit a child's record — PATCH /api/v1/young-people/:id. Durable via the
 * dual-mode dal (the real young_people table on a live tenant). Identity and
 * tenancy fields (id, home_id) are fixed server-side; only real columns are
 * written. Permission-gated (child_record / edit).
 */
export function useUpdateYoungPerson(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<YoungPerson>) => api.patch<{ data: YoungPerson }>(`/young-people/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["young-people", id] });
      qc.invalidateQueries({ queryKey: ["young-people"] });
    },
  });
}

/**
 * Archive a child's record — DELETE /api/v1/young-people/:id. This is a SOFT
 * archive: it ends the placement (status "ended", placement_end = today) so the
 * child leaves the current roster, and never destroys the record. Permission-
 * gated as an edit.
 */
export function useArchiveYoungPerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ data: YoungPerson; archived: boolean }>(`/young-people/${id}`),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ["young-people", id] });
      qc.invalidateQueries({ queryKey: ["young-people"] });
    },
  });
}
