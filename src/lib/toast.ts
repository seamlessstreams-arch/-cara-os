// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TOAST HELPERS
// Typed wrappers around sonner for consistent toast messages across the app.
// ══════════════════════════════════════════════════════════════════════════════

import { toast } from "sonner";

/** Success toast with a green checkmark */
export function toastSuccess(message: string, description?: string) {
  toast.success(message, { description });
}

/** Error toast with a red indicator */
export function toastError(message: string, description?: string) {
  toast.error(message, { description: description ?? "Please try again or contact support." });
}

/** Warning toast */
export function toastWarning(message: string, description?: string) {
  toast.warning(message, { description });
}

/** Info toast */
export function toastInfo(message: string, description?: string) {
  toast.info(message, { description });
}

/** Loading toast that can be resolved later */
export function toastLoading(message: string) {
  return toast.loading(message);
}

/** Resolve a loading toast */
export function toastDismiss(id: string | number) {
  toast.dismiss(id);
}

// ── Contextual toast presets ────────────────────────────────────────────────

export const careToast = {
  taskCompleted: (title: string) =>
    toastSuccess("Task completed", title),

  taskCreated: (title: string) =>
    toastSuccess("Task created", title),

  taskSignedOff: (title: string) =>
    toastSuccess("Task signed off", `Manager oversight recorded for "${title}"`),

  incidentLogged: (ref: string) =>
    toastSuccess("Incident logged", `Reference: ${ref}`),

  oversightAdded: () =>
    toastSuccess("Oversight added", "Management oversight has been recorded."),

  dailyLogSaved: () =>
    toastSuccess("Daily log saved", "Entry recorded successfully."),

  medicationRecorded: () =>
    toastSuccess("Medication recorded", "Administration logged."),

  handoverCreated: () =>
    toastSuccess("Handover created", "Shift handover notes saved."),

  documentUploaded: (name: string) =>
    toastSuccess("Document uploaded", name),

  safeguardingFlagged: () =>
    toastWarning("Safeguarding flag raised", "This has been escalated for review."),

  formSaved: () =>
    toastSuccess("Form saved", "Record updated successfully."),

  actionFailed: (action: string) =>
    toastError(`${action} failed`, "Please try again."),
};
