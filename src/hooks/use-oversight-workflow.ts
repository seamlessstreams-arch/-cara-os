"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Management Oversight (workflow) hooks
//
// Client access to the deterministic workflow-assurance engine:
//   useOversightWorkflowExample  → GET  worked example (curl-equivalent)
//   useGenerateManagementOversight → POST generate oversight for a workflow
//   useWorkflowSignOff           → POST role-gated final sign-off
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "./use-api";
import type {
  OversightInput,
  OversightResult,
  WorkflowSignOffResult,
} from "@/lib/oversight/types";

export interface OversightExamplePayload {
  example: boolean;
  input: OversightInput;
  result: OversightResult;
  disclaimer: string;
}
interface ExampleResponse {
  data: OversightExamplePayload;
}
interface GenerateResponse {
  data: { result: OversightResult; disclaimer: string };
}
interface SignOffResponse {
  data: WorkflowSignOffResult;
}

/** Deterministic worked example — lets the page render immediately, even in prod with no AI key. */
export function useOversightWorkflowExample() {
  return useQuery({
    queryKey: ["oversight-workflow-example"],
    queryFn: () => api.get<ExampleResponse>("/oversight-workflow"),
    staleTime: 5 * 60 * 1000,
  });
}

/** Generate management oversight for an arbitrary workflow payload. */
export function useGenerateManagementOversight() {
  return useMutation({
    mutationFn: (input: Partial<OversightInput>) =>
      api.post<GenerateResponse>("/oversight-workflow", input),
  });
}

export interface SignOffVars {
  /** Original input — preferred: the server regenerates the result authoritatively. */
  input?: OversightInput;
  /** Or a prior result (kept for flexibility; the role gate is always server-derived). */
  oversightResult?: OversightResult;
  finalProfessionalOversight: string;
  childAddressedOversight?: string;
  confirmActionsAssigned: boolean;
  confirmTimescalesRecorded: boolean;
  confirmRisksEscalated: boolean;
  confirmChildFacingSafeOrSuppressed: boolean;
  oversightChildModeRequested?: boolean;
  contradictionsUnresolved?: boolean;
  overrideReason?: string;
}

/** Attempt final sign-off. Returns signed/blocked + blockers (always HTTP 200). */
export function useWorkflowSignOff() {
  return useMutation({
    mutationFn: (vars: SignOffVars) =>
      api.post<SignOffResponse>("/oversight-workflow/sign-off", vars),
  });
}

// ─── Oversight from a real record ────────────────────────────────────────────

export interface OversightRecordOption {
  id: string;
  recordType: string;
  reference: string;
  type: string;
  severity: string;
  date: string;
  childName: string;
  requiresOversight: boolean;
  oversightDone: boolean;
}
interface RecordListResponse {
  data: { records: OversightRecordOption[] };
}
export interface FromRecordPayload {
  record: { id: string; reference: string; type: string; severity: string; date: string; childName: string };
  input: OversightInput;
  result: OversightResult;
  disclaimer: string;
}
interface FromRecordResponse {
  data: FromRecordPayload;
}

/** Recent records (incidents) available to run oversight on — for the picker. */
export function useOversightRecordList() {
  return useQuery({
    queryKey: ["oversight-record-list"],
    queryFn: () => api.get<RecordListResponse>("/oversight-workflow/from-record"),
    staleTime: 60 * 1000,
  });
}

/** Generate oversight for a specific real record (incident). Enabled only when an id is given. */
export function useOversightFromRecord(id: string | null) {
  return useQuery({
    queryKey: ["oversight-from-record", id],
    queryFn: () =>
      api.get<FromRecordResponse>(`/oversight-workflow/from-record?recordType=incident&id=${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}
