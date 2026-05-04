"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CARE FORM DETAIL PAGE
// View, edit, submit, and approve a single care form.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft, FileText, CheckCircle2, Clock, XCircle,
  AlertTriangle, Archive, Pencil, Save, X, Loader2,
  AlertCircle, Heart, CalendarDays, User, Tag, ChevronRight,
  Shield, UserCheck, Send,
} from "lucide-react";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useForm, useUpdateForm, useSubmitForm, useApproveForm } from "@/hooks/use-forms";
import { useStaff } from "@/hooks/use-staff";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useCurrentUser } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import {
  CARE_FORM_TYPE_LABELS, CARE_FORM_TYPES, CARE_FORM_STATUSES,
} from "@/lib/constants";
import type { CareForm } from "@/types";
import { PrintButton } from "@/components/common/print-button";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";

// ── Status display ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; border: string; icon: React.ElementType }> = {
  draft:          { label: "Draft",          color: "text-slate-500",   bgColor: "bg-slate-100",   border: "border-l-slate-400",   icon: Pencil        },
  submitted:      { label: "Submitted",      color: "text-blue-600",    bgColor: "bg-blue-100",    border: "border-l-blue-500",    icon: Clock         },
  pending_review: { label: "Pending Review", color: "text-amber-600",   bgColor: "bg-amber-100",   border: "border-l-amber-500",   icon: AlertTriangle  },
  approved:       { label: "Approved",       color: "text-emerald-600", bgColor: "bg-emerald-100", border: "border-l-emerald-500", icon: CheckCircle2  },
  rejected:       { label: "Rejected",       color: "text-red-600",     bgColor: "bg-red-100",     border: "border-l-red-500",     icon: XCircle       },
  archived:       { label: "Archived",       color: "text-slate-400",   bgColor: "bg-slate-100",   border: "border-l-slate-300",   icon: Archive       },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800",       border: "border-l-red-600"   },
  high:   { label: "High",   color: "bg-orange-100 text-orange-800", border: "border-l-orange-500" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800",     border: "border-l-blue-400"  },
  low:    { label: "Low",    color: "bg-slate-100 text-slate-600",   border: "border-l-slate-300"  },
};

// ── Submit panel ──────────────────────────────────────────────────────────────

function SubmitPanel({
  formId,
  currentUserId,
  onSuccess,
}: { formId: string; currentUserId: string; onSuccess: () => void }) {
  const submitForm = useSubmitForm();
  const [confirm, setConfirm] = useState(false);

  function handleSubmit() {
    submitForm.mutate(
      { id: formId, submitted_by: currentUserId },
      { onSuccess },
    );
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4 text-blue-500 shrink-0" />
        <span className="text-sm font-semibold text-blue-800">Submit for Review</span>
      </div>
      <p className="text-xs text-blue-700">
        Once submitted, this form will be sent to a manager for review and approval.
        You can still edit a draft but not a submitted form.
      </p>
      {!confirm ? (
        <Button size="sm" onClick={() => setConfirm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Send className="h-3.5 w-3.5 mr-1.5" />Submit Form
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitForm.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitForm.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Submitting…</> : "Confirm Submit"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
        </div>
      )}
    </div>
  );
}

// ── Approve panel ─────────────────────────────────────────────────────────────

function ApprovePanel({
  formId,
  currentUserId,
  onSuccess,
}: { formId: string; currentUserId: string; onSuccess: () => void }) {
  const approveForm = useApproveForm();
  const [reviewNotes, setReviewNotes] = useState("");

  function handleApprove() {
    approveForm.mutate(
      { id: formId, approved_by: currentUserId, review_notes: reviewNotes || undefined },
      { onSuccess },
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="text-sm font-semibold text-emerald-800">Manager Sign-Off</span>
      </div>
      <div>
        <label className="text-xs font-semibold text-emerald-700 block mb-1.5">Review Notes (optional)</label>
        <textarea
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          rows={2}
          placeholder="Add any notes or observations before approving…"
          className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400"
        />
      </div>
      <Button
        size="sm"
        onClick={handleApprove}
        disabled={approveForm.isPending}
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {approveForm.isPending
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Approving…</>
          : <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Approve Form</>
        }
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function FormDetailPage() {
  const { formId } = useParams<{ formId: string }>();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { can } = usePermissions();
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<CareForm>>({});
  const [actionSuccess, setActionSuccess] = useState("");

  const { data: form, isLoading, isError } = useForm(formId ?? "");
  const updateForm = useUpdateForm();

  // Seed edit draft when form loads or we enter edit mode
  useEffect(() => {
    if (form && editing) {
      setEditDraft({
        title: form.title,
        description: form.description ?? "",
        priority: form.priority,
        form_type: form.form_type,
        due_date: form.due_date ?? "",
        linked_child_id: form.linked_child_id ?? "",
        linked_staff_id: form.linked_staff_id ?? "",
        tags: form.tags,
      });
    }
  }, [form, editing]);

  const canEdit    = can(PERMISSIONS.EDIT_FORMS);
  const canSubmit  = can(PERMISSIONS.SUBMIT_FORMS);
  const canApprove = can(PERMISSIONS.APPROVE_FORMS);

  const isDraft     = form?.status === "draft";
  const isSubmitted = form?.status === "submitted" || form?.status === "pending_review";
  const isApproved  = form?.status === "approved";

  function handleSave() {
    if (!form) return;
    updateForm.mutate(
      { id: form.id, ...editDraft },
      { onSuccess: () => { setEditing(false); } },
    );
  }

  function handleActionSuccess(msg: string) {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(""), 3000);
  }

  const staffQuery = useStaff();
  const ypQuery = useYoungPeople();
  const activeStaff = (staffQuery.data?.data ?? []).filter((s) => s.is_active && s.role !== "responsible_individual");
  const activeYP = ypQuery.data?.data ?? [];

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageShell title="Form" subtitle="Loading…" showQuickCreate={false}>
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          <span className="text-sm">Loading form…</span>
        </div>
      </PageShell>
    );
  }

  if (isError || !form) {
    return (
      <PageShell title="Form not found" subtitle="" showQuickCreate={false}>
        <div className="max-w-md mx-auto mt-12 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-sm text-slate-600">This form could not be found. It may have been deleted.</p>
          <Link href="/forms">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1" />Back to Forms</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const stat = STATUS_CONFIG[form.status] ?? STATUS_CONFIG.draft;
  const prio = PRIORITY_CONFIG[form.priority];
  const StatusIcon = stat.icon;
  const typeLabel = CARE_FORM_TYPE_LABELS[form.form_type as keyof typeof CARE_FORM_TYPE_LABELS] ?? form.form_type;
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = form.due_date && form.due_date < today && !isApproved;

  return (
    <PageShell
      title={editing ? "Editing Form" : form.title}
      subtitle={editing ? "Make your changes and save below" : `${typeLabel} · ${stat.label}`}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title={form.title || "Care Form"} subtitle="Oak House — Care Form Record" targetId="form-detail-content" />
          <SmartUploadButton
            variant="icon"
            linkedChildId={form.linked_child_id ?? undefined}
            uploadContext={`Care Form: ${form.title} — supporting document upload`}
          />
          <Link href="/forms">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />All Forms
            </Button>
          </Link>
          {canEdit && isDraft && !editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" />Edit
            </Button>
          )}
          {editing && (
            <>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateForm.isPending}
              >
                {updateForm.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Saving…</> : <><Save className="h-3.5 w-3.5 mr-1" />Save</>}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      }
    >
      <div id="form-detail-content" className="max-w-3xl space-y-5">

        {/* ── Success banner ──────────────────────────────────────────────── */}
        {actionSuccess && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2 text-emerald-700 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />{actionSuccess}
          </div>
        )}

        {/* ── Status + priority banner ────────────────────────────────────── */}
        <div className={cn("rounded-2xl border border-l-4 bg-white p-4 flex items-center gap-3", prio.border)}>
          <div className={cn("rounded-full p-2 shrink-0", stat.bgColor)}>
            <StatusIcon className={cn("h-5 w-5", stat.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("rounded-full border-0 text-xs", stat.bgColor, stat.color)}>{stat.label}</Badge>
              <Badge className={cn("rounded-full border-0 text-xs", prio.color)}>{prio.label} Priority</Badge>
              <Badge variant="outline" className="rounded-full text-xs">{typeLabel}</Badge>
              {isOverdue && (
                <Badge variant="destructive" className="rounded-full text-xs gap-1">
                  <AlertTriangle className="h-3 w-3" />Overdue
                </Badge>
              )}
            </div>
            {form.description && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{form.description}</p>
            )}
          </div>
        </div>

        {/* ── Action panels ───────────────────────────────────────────────── */}
        {canSubmit && isDraft && !editing && (
          <SubmitPanel
            formId={form.id}
            currentUserId={currentUser?.id ?? "staff_darren"}
            onSuccess={() => handleActionSuccess("Form submitted for review.")}
          />
        )}

        {canApprove && isSubmitted && (
          <ApprovePanel
            formId={form.id}
            currentUserId={currentUser?.id ?? "staff_darren"}
            onSuccess={() => handleActionSuccess("Form approved.")}
          />
        )}

        {/* ── Edit form ───────────────────────────────────────────────────── */}
        {editing && (
          <div className="rounded-2xl border bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Edit Form Details</h3>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Title <span className="text-red-500">*</span></label>
              <Input
                value={editDraft.title ?? ""}
                onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Form title"
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Description</label>
              <textarea
                value={(editDraft.description as string) ?? ""}
                onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                rows={3}
                placeholder="Optional description or notes…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Form Type</label>
                <select
                  value={editDraft.form_type ?? form.form_type}
                  onChange={(e) => setEditDraft((d) => ({ ...d, form_type: e.target.value as CareForm["form_type"] }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {CARE_FORM_TYPES.map((t) => (
                    <option key={t} value={t}>{CARE_FORM_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Priority</label>
                <select
                  value={editDraft.priority ?? form.priority}
                  onChange={(e) => setEditDraft((d) => ({ ...d, priority: e.target.value as CareForm["priority"] }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {(["low", "medium", "high", "urgent"] as const).map((p) => (
                    <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Due Date</label>
                <Input
                  type="date"
                  value={(editDraft.due_date as string) ?? ""}
                  onChange={(e) => setEditDraft((d) => ({ ...d, due_date: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Linked Young Person</label>
                <select
                  value={(editDraft.linked_child_id as string) ?? ""}
                  onChange={(e) => setEditDraft((d) => ({ ...d, linked_child_id: e.target.value || null }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">None</option>
                  {activeYP.map((yp) => (
                    <option key={yp.id} value={yp.id}>{yp.preferred_name ?? `${yp.first_name} ${yp.last_name}`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Linked Staff Member</label>
              <select
                value={(editDraft.linked_staff_id as string) ?? ""}
                onChange={(e) => setEditDraft((d) => ({ ...d, linked_staff_id: e.target.value || null }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">None</option>
                {activeStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>

            {updateForm.isError && (
              <p className="text-xs text-red-600 font-medium">Failed to save changes. Please try again.</p>
            )}
          </div>
        )}

        {/* ── Form detail grid ────────────────────────────────────────────── */}
        {!editing && (
          <div className="rounded-2xl border bg-white p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Form Details</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Form Type</span>
                <span className="text-slate-800">{typeLabel}</span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Priority</span>
                <Badge className={cn("rounded-full border-0 text-xs", prio.color)}>{prio.label}</Badge>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
                <Badge className={cn("rounded-full border-0 text-xs", stat.bgColor, stat.color)}>{stat.label}</Badge>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Due Date</span>
                <span className={cn("font-medium", isOverdue ? "text-red-600" : "text-slate-800")}>
                  {form.due_date ? formatRelative(form.due_date) : <span className="text-slate-400 font-normal italic">No due date</span>}
                </span>
              </div>

              {form.linked_child_id && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Young Person</span>
                  <div className="flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 text-rose-400" />
                    <span className="text-slate-800">{getYPName(form.linked_child_id)}</span>
                  </div>
                </div>
              )}

              {form.linked_staff_id && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Linked Staff</span>
                  <div className="flex items-center gap-2">
                    <Avatar name={getStaffName(form.linked_staff_id)} size="xs" />
                    <span className="text-slate-800">{getStaffName(form.linked_staff_id)}</span>
                  </div>
                </div>
              )}

              {form.linked_incident_id && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Linked Incident</span>
                  <span className="text-slate-800 font-mono text-xs">{form.linked_incident_id.replace("inc_", "INC-")}</span>
                </div>
              )}

              {form.tags.length > 0 && (
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map((tag) => (
                      <span key={tag} className="text-xs text-slate-500 bg-slate-50 rounded-full px-2.5 py-0.5 border border-slate-200">
                        <Tag className="h-3 w-3 inline mr-1" />#{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {form.description && (
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Description</span>
                  <p className="text-slate-700 text-sm leading-relaxed">{form.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Submission record ───────────────────────────────────────────── */}
        {form.submitted_by && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Send className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-sm font-semibold text-blue-800">Submitted</span>
            </div>
            <div className="flex items-center gap-2">
              <Avatar name={getStaffName(form.submitted_by)} size="xs" />
              <span className="text-sm text-blue-700">
                {getStaffName(form.submitted_by)}
                {form.submitted_at && ` · ${formatDate(form.submitted_at)}`}
              </span>
            </div>
          </div>
        )}

        {/* ── Approval record ─────────────────────────────────────────────── */}
        {form.approved_by && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold text-emerald-800">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <Avatar name={getStaffName(form.approved_by)} size="xs" />
              <span className="text-sm text-emerald-700">
                {getStaffName(form.approved_by)}
                {form.approved_at && ` · ${formatDate(form.approved_at)}`}
              </span>
            </div>
            {form.review_notes && (
              <p className="mt-2 text-xs text-emerald-700 italic border-t border-emerald-200 pt-2">
                "{form.review_notes}"
              </p>
            )}
          </div>
        )}

        {/* ── Audit trail ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border bg-white p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Audit</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Created</span>
              <span className="text-slate-700">{formatDate(form.created_at)} by {getStaffName(form.created_by)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Last updated</span>
              <span className="text-slate-700">{formatDate(form.updated_at)} by {getStaffName(form.updated_by)}</span>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}
