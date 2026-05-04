// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CARE FORMS HOOKS
// React Query wrappers for the /api/v1/forms endpoint.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-auth";
import type { CareForm } from "@/types";

const API = "/api/v1/forms";

function currentUserId(): string {
  if (typeof window === "undefined") return "staff_darren";
  try {
    const raw = localStorage.getItem("cs_user_id");
    return raw ?? "staff_darren";
  } catch {
    return "staff_darren";
  }
}

function authHeaders() {
  return { "Content-Type": "application/json", "X-User-Id": currentUserId() };
}

// ── Response shape ────────────────────────────────────────────────────────────

interface FormsListResponse {
  data: CareForm[];
  meta: {
    total: number;
    draft: number;
    pending_review: number;
    approved: number;
    overdue: number;
    urgent: number;
  };
}

interface FormResponse {
  data: CareForm;
}

// ── Query keys ────────────────────────────────────────────────────────────────

export const FORM_KEYS = {
  all:   ["forms"] as const,
  list:  (params?: Record<string, string>) => ["forms", "list", params] as const,
  detail: (id: string) => ["forms", "detail", id] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useForms(params?: Record<string, string>) {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return useQuery<FormsListResponse>({
    queryKey: FORM_KEYS.list(params),
    queryFn: async () => {
      const res = await fetch(`${API}${query}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch forms");
      return res.json();
    },
  });
}

export function useForm(id: string) {
  return useQuery<CareForm>({
    queryKey: FORM_KEYS.detail(id),
    queryFn: async () => {
      const res = await fetch(`${API}/${id}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Form not found");
      const json: FormResponse = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
}

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation<CareForm, Error, Partial<CareForm>>({
    mutationFn: async (data) => {
      const res = await fetch(API, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create form");
      const json: FormResponse = await res.json();
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FORM_KEYS.all }),
  });
}

export function useUpdateForm() {
  const qc = useQueryClient();
  return useMutation<CareForm, Error, { id: string } & Partial<CareForm>>({
    mutationFn: async ({ id, ...data }) => {
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update form");
      const json: FormResponse = await res.json();
      return json.data;
    },
    onSuccess: (form) => {
      qc.invalidateQueries({ queryKey: FORM_KEYS.all });
      qc.setQueryData(FORM_KEYS.detail(form.id), form);
    },
  });
}

export function useSubmitForm() {
  const qc = useQueryClient();
  return useMutation<CareForm, Error, { id: string; submitted_by?: string }>({
    mutationFn: async ({ id, ...rest }) => {
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ action: "submit", ...rest }),
      });
      if (!res.ok) throw new Error("Failed to submit form");
      const json: FormResponse = await res.json();
      return json.data;
    },
    onSuccess: (form) => {
      qc.invalidateQueries({ queryKey: FORM_KEYS.all });
      qc.setQueryData(FORM_KEYS.detail(form.id), form);
    },
  });
}

export function useApproveForm() {
  const qc = useQueryClient();
  return useMutation<CareForm, Error, { id: string; approved_by?: string; review_notes?: string }>({
    mutationFn: async ({ id, ...rest }) => {
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ action: "approve", ...rest }),
      });
      if (!res.ok) throw new Error("Failed to approve form");
      const json: FormResponse = await res.json();
      return json.data;
    },
    onSuccess: (form) => {
      qc.invalidateQueries({ queryKey: FORM_KEYS.all });
      qc.setQueryData(FORM_KEYS.detail(form.id), form);
    },
  });
}
