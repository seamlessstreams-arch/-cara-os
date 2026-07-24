"use client";

// ══════════════════════════════════════════════════════════════════════════════
// YOUNG PERSON — EDIT DETAILS DIALOG (shared)
//
// One editable form for a child's core record, reused wherever "correct these
// details" is needed: the child's record page and the admit success screen.
// It PATCHes only the fields that actually changed (so the audit trail shows
// real before→after edits, not noise), via the dual-mode dal — durable on live.
// Identity/tenancy (id, home_id) are fixed server-side; key-worker assignment is
// a separate flow (it needs a staff picker) and is intentionally not here.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateYoungPerson } from "@/hooks/use-young-people";
import { LEGAL_STATUSES, PLACEMENT_STATUSES } from "@/lib/young-people/field-options";
import type { YoungPerson } from "@/types";

const FIELD =
  "w-full rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-teal)]";

// Open the native date picker on any click/focus, not just the tiny glyph
// (mirrors the admit form — easy to miss in the dark theme).
function openPicker(e: { currentTarget: EventTarget & HTMLInputElement }) {
  const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
  try { el.showPicker?.(); } catch { /* not user-activated / unsupported */ }
}

/** The subset of YoungPerson this dialog edits, plus the required id. */
export type EditableChild = Partial<YoungPerson> & { id: string };

const ARRAY_FIELDS = new Set(["allergies", "risk_flags"]);
// Blank in these = null (nullable columns); the rest keep their string.
const NULLABLE_FIELDS = new Set([
  "preferred_name", "ethnicity", "religion", "placement_end",
  "social_worker_phone", "social_worker_email", "iro_name", "iro_phone",
  "dietary_requirements", "gp_name", "gp_phone", "school_name", "school_contact",
]);
const REQUIRED_FIELDS: { key: keyof FormState; label: string }[] = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "date_of_birth", label: "Date of birth" },
  { key: "placement_start", label: "Placement start" },
  { key: "local_authority", label: "Local authority" },
];

interface FormState {
  first_name: string; last_name: string; preferred_name: string;
  date_of_birth: string; gender: string; ethnicity: string; religion: string;
  placement_start: string; placement_end: string; placement_type: string;
  legal_status: string; local_authority: string; status: YoungPerson["status"];
  social_worker_name: string; social_worker_phone: string; social_worker_email: string;
  iro_name: string; iro_phone: string;
  dietary_requirements: string; allergies: string; gp_name: string; gp_phone: string;
  risk_flags: string;
  school_name: string; school_contact: string;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-xs font-medium text-[var(--cs-slate)]">{children}</span>
);
const Section = ({ title }: { title: string }) => (
  <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--cs-slate)] pt-1">{title}</h4>
);

function toForm(c: EditableChild): FormState {
  return {
    first_name: c.first_name ?? "", last_name: c.last_name ?? "", preferred_name: c.preferred_name ?? "",
    date_of_birth: c.date_of_birth ?? "", gender: c.gender ?? "", ethnicity: c.ethnicity ?? "", religion: c.religion ?? "",
    placement_start: c.placement_start ?? "", placement_end: c.placement_end ?? "", placement_type: c.placement_type ?? "",
    legal_status: c.legal_status ?? "", local_authority: c.local_authority ?? "", status: c.status ?? "current",
    social_worker_name: c.social_worker_name ?? "", social_worker_phone: c.social_worker_phone ?? "", social_worker_email: c.social_worker_email ?? "",
    iro_name: c.iro_name ?? "", iro_phone: c.iro_phone ?? "",
    dietary_requirements: c.dietary_requirements ?? "", allergies: (c.allergies ?? []).join(", "),
    gp_name: c.gp_name ?? "", gp_phone: c.gp_phone ?? "", risk_flags: (c.risk_flags ?? []).join(", "),
    school_name: c.school_name ?? "", school_contact: c.school_contact ?? "",
  };
}

/** Normalise one form field to its stored typed value (array / null / string). */
function normalise(key: keyof FormState, raw: string): unknown {
  const v = raw.trim();
  if (ARRAY_FIELDS.has(key)) return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
  if (NULLABLE_FIELDS.has(key)) return v || null;
  return v;
}

/** The child's current value for a field, normalised the same way, for diffing. */
function currentValue(c: EditableChild, key: keyof FormState): unknown {
  if (ARRAY_FIELDS.has(key)) return ((c[key as keyof YoungPerson] as string[] | undefined) ?? []);
  const val = c[key as keyof YoungPerson];
  if (NULLABLE_FIELDS.has(key)) return (val as string | null | undefined) || null;
  return (val as string | undefined) ?? "";
}

export function YoungPersonEditDialog({
  child, open, onOpenChange, onSaved,
}: {
  child: EditableChild;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: (updated: YoungPerson) => void;
}) {
  const update = useUpdateYoungPerson(child.id);
  const [form, setForm] = useState<FormState>(() => toForm(child));

  // Re-seed the form to a fresh copy of the child's values each time the dialog
  // opens (and if the target child changes while open) — the React-endorsed
  // "adjust state during render" pattern, so cancelling always discards edits.
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const openSig = open ? child.id : null;
  if (openSig !== seededFor) {
    setSeededFor(openSig);
    if (openSig) setForm(toForm(child));
  }

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSave() {
    for (const { key, label } of REQUIRED_FIELDS) {
      if (!String(form[key]).trim()) { toast.error(`${label} is required.`); return; }
    }
    // Send only the fields that actually changed — a real edit, not a rewrite.
    const patch: Record<string, unknown> = {};
    (Object.keys(form) as (keyof FormState)[]).forEach((key) => {
      const next = normalise(key, String(form[key]));
      const now = currentValue(child, key);
      if (JSON.stringify(next) !== JSON.stringify(now)) patch[key] = next;
    });

    if (Object.keys(patch).length === 0) {
      toast.info("No changes to save.");
      onOpenChange(false);
      return;
    }

    try {
      const res = await update.mutateAsync(patch);
      toast.success("Record updated.");
      onSaved?.(res.data);
      onOpenChange(false);
    } catch {
      toast.error("Could not save the changes. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit details</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto space-y-5 py-2 pr-1">
          <Section title="Identity" />
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1"><Label>First name *</Label><Input value={form.first_name} onChange={set("first_name")} /></label>
            <label className="block space-y-1"><Label>Last name *</Label><Input value={form.last_name} onChange={set("last_name")} /></label>
            <label className="block space-y-1"><Label>Preferred name</Label><Input value={form.preferred_name} onChange={set("preferred_name")} /></label>
            <label className="block space-y-1"><Label>Gender</Label><Input value={form.gender} onChange={set("gender")} /></label>
            <label className="block space-y-1"><Label>Date of birth *</Label><Input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} onClick={openPicker} onFocus={openPicker} /></label>
            <label className="block space-y-1"><Label>Ethnicity</Label><Input value={form.ethnicity} onChange={set("ethnicity")} /></label>
            <label className="block space-y-1"><Label>Religion</Label><Input value={form.religion} onChange={set("religion")} /></label>
          </div>

          <Section title="Placement" />
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1"><Label>Placement start *</Label><Input type="date" value={form.placement_start} onChange={set("placement_start")} onClick={openPicker} onFocus={openPicker} /></label>
            <label className="block space-y-1"><Label>Placement end</Label><Input type="date" value={form.placement_end} onChange={set("placement_end")} onClick={openPicker} onFocus={openPicker} /></label>
            <label className="block space-y-1"><Label>Placement type</Label><Input value={form.placement_type} onChange={set("placement_type")} placeholder="e.g. Long-term" /></label>
            <label className="block space-y-1"><Label>Local authority *</Label><Input value={form.local_authority} onChange={set("local_authority")} /></label>
            <label className="block space-y-1"><Label>Legal status</Label>
              <select className={FIELD} value={form.legal_status} onChange={set("legal_status")}>
                <option value="">—</option>
                {LEGAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="block space-y-1"><Label>Status</Label>
              <select className={FIELD} value={form.status} onChange={set("status")}>
                {PLACEMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
          </div>

          <Section title="Professionals" />
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1"><Label>Social worker</Label><Input value={form.social_worker_name} onChange={set("social_worker_name")} /></label>
            <label className="block space-y-1"><Label>Social worker phone</Label><Input value={form.social_worker_phone} onChange={set("social_worker_phone")} /></label>
            <label className="block space-y-1 col-span-2"><Label>Social worker email</Label><Input type="email" value={form.social_worker_email} onChange={set("social_worker_email")} /></label>
            <label className="block space-y-1"><Label>IRO name</Label><Input value={form.iro_name} onChange={set("iro_name")} /></label>
            <label className="block space-y-1"><Label>IRO phone</Label><Input value={form.iro_phone} onChange={set("iro_phone")} /></label>
          </div>

          <Section title="Health & safety" />
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 col-span-2"><Label>Dietary requirements</Label><Input value={form.dietary_requirements} onChange={set("dietary_requirements")} /></label>
            <label className="block space-y-1 col-span-2"><Label>Allergies <span className="text-[var(--cs-slate)]">(comma-separated)</span></Label><Input value={form.allergies} onChange={set("allergies")} placeholder="e.g. Penicillin, Peanuts" /></label>
            <label className="block space-y-1 col-span-2"><Label>Risk flags <span className="text-[var(--cs-slate)]">(comma-separated)</span></Label><Input value={form.risk_flags} onChange={set("risk_flags")} placeholder="e.g. missing, CSE" /></label>
            <label className="block space-y-1"><Label>GP name</Label><Input value={form.gp_name} onChange={set("gp_name")} /></label>
            <label className="block space-y-1"><Label>GP phone</Label><Input value={form.gp_phone} onChange={set("gp_phone")} /></label>
          </div>

          <Section title="Education" />
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1"><Label>School name</Label><Input value={form.school_name} onChange={set("school_name")} /></label>
            <label className="block space-y-1"><Label>School contact</Label><Input value={form.school_contact} onChange={set("school_contact")} /></label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={update.isPending}>Cancel</Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving…</> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
