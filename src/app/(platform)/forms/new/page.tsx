"use client";

// ══════════════════════════════════════════════════════════════════════════════
// GENERIC "NEW RECORD" PAGE — /forms/new?formId=<registry id>
//
// The global quick-create menu (and any "＋ New X" link) lists ~94 record types
// from src/config/form-registry.ts. Only a handful had a dedicated /X/new page;
// the rest linked to /X/new routes that never existed and 404'd on click. This
// page is the single generic destination: it looks the form up by id, pre-fills
// its title, collects the common record fields, and creates a CareForm of the
// right type via the forms API (dal.careForms → the care_forms table, so it
// persists on a live tenant). The new record opens at /forms/[id].
//
// It is deliberately a GENERAL capture (title, details, context, priority, due),
// not a per-type structured form — there is no field-schema source for the 94
// types. High-frequency structured capture (daily log, medication, incidents)
// still lives on each entity's own page; this makes every create button WORK
// instead of 404ing, and gives an auditable record for the long tail.
// ══════════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFormById } from "@/config/form-registry";
import { useCreateForm } from "@/hooks/use-forms";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useStaff } from "@/hooks/use-staff";
import { useCurrentUser } from "@/hooks/use-auth";
import { CARE_FORM_TYPE_LABELS, type CareFormType } from "@/lib/constants";
import type { CareForm } from "@/types";

// Best-effort map from a registry form to one of the fixed CareForm types. The
// record's title carries its real name regardless, so an imperfect match only
// affects filtering; anything unrecognised is honestly "other".
function inferType(formId: string, hay: string): CareFormType {
  const s = `${formId} ${hay}`.toLowerCase();
  if (/return.?from.?missing|missing.*(return|interview)/.test(s)) return "return_from_missing";
  if (/\bmissing\b/.test(s)) return "missing_person_protocol";
  if (/risk/.test(s)) return "risk_assessment";
  if (/behaviou?r/.test(s)) return "behaviour_record";
  if (/key.?work/.test(s)) return "key_work_session";
  if (/welfare/.test(s)) return "welfare_check";
  if (/medication|medicine|\bmar\b/.test(s)) return "medication_audit";
  if (/health|dental|optician|immunis|medical|seizure|epilep/.test(s)) return "health_record";
  if (/education|school|\bpep\b|homework|attendance/.test(s)) return "education_update";
  if (/contact|family|sibling|letterbox/.test(s)) return "contact_log";
  if (/lac.?review|review.*meeting/.test(s)) return "review_meeting_notes";
  if (/placement|discharge|transition|pathway/.test(s)) return "placement_review";
  if (/safeguard|allegation|referral|disclosure/.test(s)) return "safeguarding_referral";
  if (/supervision|appraisal|1.?to.?1|one.?to.?one/.test(s)) return "supervision_record";
  if (/court/.test(s)) return "court_report";
  if (/professional|consultation|meeting/.test(s)) return "professional_meeting";
  if (/fire|building|premises|environment|maintenance|vehicle|accident|health.?safety|h&s/.test(s)) return "health_safety_check";
  if (/daily|night|sleep|routine/.test(s)) return "daily_check";
  return "other";
}

const FIELD =
  "w-full rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-teal)]";

export default function NewFormPage() {
  const router = useRouter();
  const params = useSearchParams();
  const currentUser = useCurrentUser();
  const createForm = useCreateForm();

  const formId = params.get("formId") ?? "";
  const def = formId ? getFormById(formId) : undefined;
  const formType = useMemo(
    () => inferType(formId, `${def?.category ?? ""} ${def?.label ?? ""}`),
    [formId, def],
  );

  const ypQuery = useYoungPeople();
  const staffQuery = useStaff();
  const youngPeople = ypQuery.data?.data ?? [];
  const staff = (staffQuery.data?.data ?? []).filter((s) => s.is_active);

  const [title, setTitle] = useState(def?.label ?? "New record");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState<CareForm["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");
  const [childId, setChildId] = useState(params.get("childId") ?? "");
  const [staffId, setStaffId] = useState(params.get("staffId") ?? "");

  const needsChild = def?.requiresChild ?? false;
  const needsStaff = def?.requiresStaff ?? false;
  const blocked = (needsChild && !childId) || (needsStaff && !staffId) || !title.trim();

  function submit() {
    if (blocked || createForm.isPending) return;
    const payload: Partial<CareForm> = {
      title: title.trim(),
      form_type: formType,
      status: "draft",
      description: details.trim() || null,
      body: { details: details.trim(), form_registry_id: formId || null, source: "quick-create" },
      linked_child_id: childId || null,
      linked_staff_id: staffId || null,
      linked_incident_id: null,
      linked_shift_id: null,
      linked_task_id: null,
      priority,
      due_date: dueDate || null,
      tags: def?.category ? [def.category] : [],
      submitted_by: currentUser?.id ?? null,
    };
    createForm.mutate(payload, {
      onSuccess: (form) => router.push(`/forms/${form.id}`),
    });
  }

  return (
    <PageShell
      title={def ? `New — ${def.label}` : "New record"}
      description={def?.description ?? "Create a record. It will be saved to Forms where it can be completed, submitted and reviewed."}
    >
      <div className="mx-auto max-w-2xl space-y-4">
        {!def && formId && (
          <p className="rounded-md border border-[var(--cs-amber)] bg-[var(--cs-amber)]/10 px-3 py-2 text-sm text-[var(--cs-navy)]">
            Unknown form type &ldquo;{formId}&rdquo; — creating a general record instead.
          </p>
        )}

        <label className="block space-y-1">
          <span className="text-xs font-medium text-[var(--cs-slate)]">Title</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Record title" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Priority</span>
            <select className={FIELD} value={priority} onChange={(e) => setPriority(e.target.value as CareForm["priority"])}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Due date</span>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>

        {(needsChild || youngPeople.length > 0) && (
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">
              Child{needsChild ? " (required)" : " (optional)"}
            </span>
            <select className={FIELD} value={childId} onChange={(e) => setChildId(e.target.value)}>
              <option value="">— none —</option>
              {youngPeople.map((yp) => (
                <option key={yp.id} value={yp.id}>
                  {yp.first_name} {yp.last_name}
                </option>
              ))}
            </select>
          </label>
        )}

        {(needsStaff || staff.length > 0) && (
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">
              Staff member{needsStaff ? " (required)" : " (optional)"}
            </span>
            <select className={FIELD} value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">— none —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block space-y-1">
          <span className="text-xs font-medium text-[var(--cs-slate)]">Details</span>
          <textarea
            className={FIELD}
            rows={6}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="What do you need to record?"
          />
        </label>

        {createForm.isError && (
          <p className="text-sm text-[var(--cs-red)]">Couldn&rsquo;t save the record. Please try again.</p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={submit} disabled={blocked || createForm.isPending}>
            {createForm.isPending ? "Saving…" : "Create record"}
          </Button>
          <Link href="/forms" className="text-sm text-[var(--cs-slate)] hover:underline">
            Cancel
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
