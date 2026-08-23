// ══════════════════════════════════════════════════════════════════════════════
// CARA — FORM GOVERNANCE SERVICE
// Full lifecycle: template design → version management → submissions →
// review/approve workflows → audit logging.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type {
  FormTemplate, FormTemplateVersion, FormSubmission,
  FormAuditLog, FormFieldDefinition, FormApprovalStep,
  FormCategory, FormVersionStatus, FormSubmissionStatus,
  ServiceResult,
} from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Template CRUD ───────────────────────────────────────────────────────────

export async function listFormTemplates(
  homeId: string,
  opts?: { category?: FormCategory; active_only?: boolean },
): Promise<ServiceResult<FormTemplate[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("form_templates") as SB).select("*").eq("home_id", homeId);
  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.active_only !== false) q = q.eq("is_active", true);
  q = q.order("title");

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getFormTemplate(
  templateId: string,
): Promise<ServiceResult<FormTemplate>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("form_templates") as SB)
    .select("*")
    .eq("id", templateId)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createFormTemplate(input: {
  homeId: string;
  slug: string;
  title: string;
  description?: string;
  category: FormCategory;
  is_mandatory?: boolean;
  regulation_refs?: string[];
  created_by: string;
}): Promise<ServiceResult<FormTemplate>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("form_templates") as SB)
    .insert({
      home_id: input.homeId,
      slug: input.slug,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      is_mandatory: input.is_mandatory ?? false,
      regulation_refs: input.regulation_refs ?? [],
      created_by: input.created_by,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateFormTemplate(
  templateId: string,
  updates: Partial<Pick<FormTemplate, "title" | "description" | "category" | "is_active" | "is_mandatory" | "regulation_refs">>,
): Promise<ServiceResult<FormTemplate>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("form_templates") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", templateId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Version management ──────────────────────────────────────────────────────

export async function listTemplateVersions(
  templateId: string,
): Promise<ServiceResult<FormTemplateVersion[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("form_template_versions") as SB)
    .select("*")
    .eq("template_id", templateId)
    .order("version", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getLatestApprovedVersion(
  templateId: string,
): Promise<ServiceResult<FormTemplateVersion | null>> {
  const s = sb();
  if (!s) return { ok: true, data: null };

  const { data, error } = await (s.from("form_template_versions") as SB)
    .select("*")
    .eq("template_id", templateId)
    .eq("status", "approved")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? null };
}

export async function createTemplateVersion(input: {
  templateId: string;
  schema: FormFieldDefinition[];
  layout?: Record<string, unknown>;
  approval_chain?: FormApprovalStep[];
  validation_rules?: Record<string, unknown>;
  changelog?: string;
  created_by: string;
}): Promise<ServiceResult<FormTemplateVersion>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  // Get next version number
  const { data: existing } = await (s.from("form_template_versions") as SB)
    .select("version")
    .eq("template_id", input.templateId)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = (existing?.[0]?.version ?? 0) + 1;

  const { data, error } = await (s.from("form_template_versions") as SB)
    .insert({
      template_id: input.templateId,
      version: nextVersion,
      schema: input.schema,
      layout: input.layout ?? null,
      approval_chain: input.approval_chain ?? null,
      validation_rules: input.validation_rules ?? null,
      changelog: input.changelog ?? null,
      created_by: input.created_by,
      status: "draft",
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateVersionStatus(
  versionId: string,
  status: FormVersionStatus,
  userId: string,
): Promise<ServiceResult<FormTemplateVersion>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const updates: Record<string, unknown> = { status };
  if (status === "approved") {
    updates.approved_by = userId;
    updates.approved_at = new Date().toISOString();
    updates.published_at = new Date().toISOString();
    updates.published_by = userId;
  }

  const { data, error } = await (s.from("form_template_versions") as SB)
    .update(updates)
    .eq("id", versionId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Submissions ─────────────────────────────────────────────────────────────

export async function listFormSubmissions(
  homeId: string,
  opts?: {
    templateId?: string;
    status?: FormSubmissionStatus;
    childId?: string;
    staffId?: string;
    limit?: number;
  },
): Promise<ServiceResult<FormSubmission[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("form_submissions") as SB).select("*").eq("home_id", homeId);
  if (opts?.templateId) q = q.eq("template_id", opts.templateId);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.childId) q = q.eq("linked_child_id", opts.childId);
  if (opts?.staffId) q = q.eq("submitted_by", opts.staffId);
  q = q.order("created_at", { ascending: false }).limit(opts?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getFormSubmission(
  submissionId: string,
): Promise<ServiceResult<FormSubmission>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("form_submissions") as SB)
    .select("*")
    .eq("id", submissionId)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createFormSubmission(input: {
  homeId: string;
  templateId: string;
  versionId: string;
  data: Record<string, unknown>;
  linked_child_id?: string;
  linked_staff_id?: string;
  linked_incident_id?: string;
  due_date?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  created_by: string;
}): Promise<ServiceResult<FormSubmission>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("form_submissions") as SB)
    .insert({
      home_id: input.homeId,
      template_id: input.templateId,
      version_id: input.versionId,
      data: input.data,
      status: "draft",
      linked_child_id: input.linked_child_id ?? null,
      linked_staff_id: input.linked_staff_id ?? null,
      linked_incident_id: input.linked_incident_id ?? null,
      due_date: input.due_date ?? null,
      priority: input.priority ?? "medium",
      created_by: input.created_by,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  // Audit log
  await writeFormAudit(s, data.id, "created", null, input.created_by);

  return { ok: true, data };
}

export async function updateFormSubmission(
  submissionId: string,
  formData: Record<string, unknown>,
  userId: string,
  previousData?: Record<string, unknown>,
): Promise<ServiceResult<FormSubmission>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("form_submissions") as SB)
    .update({ data: formData, updated_at: new Date().toISOString() })
    .eq("id", submissionId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  // Compute field-level changes
  const changes = computeFieldChanges(previousData ?? {}, formData);
  await writeFormAudit(s, submissionId, "edited", changes, userId);

  return { ok: true, data };
}

export async function submitForm(
  submissionId: string,
  userId: string,
): Promise<ServiceResult<FormSubmission>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("form_submissions") as SB)
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      submitted_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  await writeFormAudit(s, submissionId, "submitted", null, userId);
  return { ok: true, data };
}

export async function reviewForm(
  submissionId: string,
  userId: string,
  action: "approve" | "reject" | "request_changes",
  notes?: string,
): Promise<ServiceResult<FormSubmission>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const statusMap: Record<string, FormSubmissionStatus> = {
    approve: "approved",
    reject: "rejected",
    request_changes: "changes_requested",
  };

  const updates: Record<string, unknown> = {
    status: statusMap[action],
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
    review_notes: notes ?? null,
    updated_at: new Date().toISOString(),
  };

  if (action === "approve") {
    updates.approved_by = userId;
    updates.approved_at = new Date().toISOString();
  }

  const { data, error } = await (s.from("form_submissions") as SB)
    .update(updates)
    .eq("id", submissionId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  await writeFormAudit(s, submissionId, action === "approve" ? "approved" : action === "reject" ? "rejected" : "changes_requested", null, userId, notes);
  return { ok: true, data };
}

export async function archiveSubmission(
  submissionId: string,
  userId: string,
): Promise<ServiceResult<FormSubmission>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("form_submissions") as SB)
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", submissionId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  await writeFormAudit(s, submissionId, "archived", null, userId);
  return { ok: true, data };
}

// ── Audit log helpers ───────────────────────────────────────────────────────

export async function getFormAuditLog(
  submissionId: string,
): Promise<ServiceResult<FormAuditLog[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("form_audit_logs") as SB)
    .select("*")
    .eq("submission_id", submissionId)
    .order("performed_at", { ascending: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

async function writeFormAudit(
  s: SB,
  submissionId: string,
  action: string,
  fieldChanges: Record<string, { old: unknown; new: unknown }> | null,
  userId: string,
  notes?: string,
): Promise<void> {
  await (s.from("form_audit_logs") as SB).insert({
    submission_id: submissionId,
    action,
    field_changes: fieldChanges,
    performed_by: userId,
    notes: notes ?? null,
  });
}

// ── Pure helpers ────────────────────────────────────────────────────────────

function computeFieldChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    const oldVal = oldData[key];
    const newVal = newData[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { old: oldVal ?? null, new: newVal ?? null };
    }
  }
  return changes;
}

/**
 * Validate form data against a field schema.
 * Returns an array of {field, message} errors — empty array means valid.
 */
export function validateFormData(
  schema: FormFieldDefinition[],
  data: Record<string, unknown>,
): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  for (const field of schema) {
    const value = data[field.name];

    // Conditional visibility — skip validation entirely if condition not met
    if (field.conditional_on) {
      const condField = field.conditional_on.field;
      const condValue = data[condField];
      let conditionMet = false;

      switch (field.conditional_on.operator) {
        case "equals": conditionMet = condValue === field.conditional_on.value; break;
        case "not_equals": conditionMet = condValue !== field.conditional_on.value; break;
        case "contains": conditionMet = String(condValue ?? "").includes(String(field.conditional_on.value)); break;
        case "greater_than": conditionMet = Number(condValue) > Number(field.conditional_on.value); break;
        case "less_than": conditionMet = Number(condValue) < Number(field.conditional_on.value); break;
      }

      if (!conditionMet) continue; // field not visible, skip all validation
    }

    // Required check
    if (field.required && (value === undefined || value === null || value === "")) {
      errors.push({ field: field.name, message: `${field.label} is required` });
      continue;
    }

    if (value === undefined || value === null || value === "") continue;

    // Type-specific validation
    if (field.validation) {
      const v = field.validation;
      if (typeof value === "string") {
        if (v.min_length && value.length < v.min_length) {
          errors.push({ field: field.name, message: v.message ?? `${field.label} must be at least ${v.min_length} characters` });
        }
        if (v.max_length && value.length > v.max_length) {
          errors.push({ field: field.name, message: v.message ?? `${field.label} must be at most ${v.max_length} characters` });
        }
        if (v.pattern && !new RegExp(v.pattern).test(value)) {
          errors.push({ field: field.name, message: v.message ?? `${field.label} format is invalid` });
        }
      }
      if (typeof value === "number") {
        if (v.min !== undefined && value < v.min) {
          errors.push({ field: field.name, message: v.message ?? `${field.label} must be at least ${v.min}` });
        }
        if (v.max !== undefined && value > v.max) {
          errors.push({ field: field.name, message: v.message ?? `${field.label} must be at most ${v.max}` });
        }
      }
    }
  }

  return errors;
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  computeFieldChanges,
  validateFormData,
};
