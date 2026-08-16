"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — WORKFORCE CREATE DIALOGS
//
// The four workforce pages (observations, qualifications, appraisals,
// induction) each shipped a "New …" button with no handler at all: it
// rendered, it hovered, and clicking it did nothing — no dialog, no error, no
// explanation (#934 baseline). Each of the four already had a working POST
// route; only the way in was missing.
//
// These dialogs are that way in. They share one shell so the honest bits are
// written once: Save stays disabled until the fields the record cannot mean
// anything without are filled, a failed request says so instead of closing,
// and nothing is invented to fill a gap the user left — an optional field the
// user skipped is simply absent from the payload.
//
// The dialogs live in a component (not the page body), so every label id is
// instance-scoped with useId(): a file-scoped literal would collide the moment
// two of these render on one screen.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { api } from "@/hooks/use-api";
import { todayStr } from "@/lib/utils";
import {
  ALL_COMPETENCY_DOMAINS, COMPETENCY_DOMAIN_LABELS,
  type AppraisalType, type CompetencyDomain,
  type ObservationOutcome, type QualificationStatus,
} from "@/types/extended";

const HOME_ID = "home_oak";

export interface StaffOption { id: string; full_name: string }

/* ── shared shell ──────────────────────────────────────────────────────────── */

function RecordDialogShell({
  open, onOpenChange, title, blurb, canSave, pending, error, onSave, saveLabel, children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  blurb: string;
  canSave: boolean;
  pending: boolean;
  error: string;
  onSave: () => void;
  saveLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <p className="-mt-2 text-xs text-[var(--cs-text-muted)]">{blurb}</p>
        <div className="space-y-4 py-2">{children}</div>
        {error && (
          <p className="text-sm text-red-600">
            Nothing was saved — {error}. Your entries are still here; try again.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={!canSave || pending} className="gap-1.5">
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StaffField({
  id, label, value, onChange, staff,
}: { id: string; label: string; value: string; onChange: (v: string) => void; staff: StaffOption[] }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label} *</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}><SelectValue placeholder="Choose a staff member" /></SelectTrigger>
        <SelectContent>
          {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Message from a failed mutation, without leaking an object into the DOM. */
const errText = (e: unknown) => (e instanceof Error && e.message ? e.message : "the request failed");

/**
 * Trim, and drop the key entirely when the user left it blank.
 *
 * The point is that an untouched field must not reach the record at all.
 * posting `awarding_body: ""` writes an assertion nobody made — the same
 * fabricate-on-empty shape as the accident-book dialog that saved thirteen
 * blank fields and toasted success (#930). Absent reads as "not recorded";
 * empty-string reads as "recorded, and it is nothing".
 */
export function optional(fields: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    const t = v.trim();
    if (t) out[k] = t;
  }
  return out;
}

/** Split a textarea of one-per-line entries; blank lines are not entries. */
export const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

/* ── 1. Practice observation ───────────────────────────────────────────────── */

const OUTCOMES: { value: ObservationOutcome; label: string }[] = [
  { value: "outstanding", label: "Outstanding" },
  { value: "meets_standard", label: "Meets Standard" },
  { value: "developing", label: "Developing" },
  { value: "requires_support", label: "Requires Support" },
];

export function NewObservationDialog({
  open, onOpenChange, staff, observerId,
}: { open: boolean; onOpenChange: (v: boolean) => void; staff: StaffOption[]; observerId: string }) {
  const uid = useId();
  const qc = useQueryClient();
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [context, setContext] = useState("");
  const [outcome, setOutcome] = useState<ObservationOutcome | "">("");
  const [domains, setDomains] = useState<CompetencyDomain[]>([]);
  const [narrative, setNarrative] = useState("");
  const [strengths, setStrengths] = useState("");
  const [development, setDevelopment] = useState("");

  const reset = () => {
    setStaffId(""); setDate(todayStr()); setContext(""); setOutcome("");
    setDomains([]); setNarrative(""); setStrengths(""); setDevelopment("");
  };

  const create = useMutation({
    mutationFn: () =>
      api.post("/workforce/observations", {
        staff_id: staffId,
        home_id: HOME_ID,
        // Absent rather than "" when there is no signed-in user: an empty
        // observer id would read as an observation nobody made.
        ...optional({ observer_id: observerId }),
        observation_date: date,
        outcome,
        domains_observed: domains,
        narrative: narrative.trim(),
        strengths_noted: lines(strengths),
        areas_for_development: lines(development),
        ...optional({ context }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workforce", "observations"] });
      reset();
      onOpenChange(false);
    },
  });

  const toggleDomain = (d: CompetencyDomain) =>
    setDomains((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <RecordDialogShell
      open={open}
      onOpenChange={(v) => { if (!v) create.reset(); onOpenChange(v); }}
      title="Record a practice observation"
      blurb="What you saw, and what it evidenced. The staff member signs it off afterwards."
      canSave={!!staffId && !!outcome && !!narrative.trim()}
      pending={create.isPending}
      error={create.isError ? errText(create.error) : ""}
      onSave={() => create.mutate()}
      saveLabel="Save observation"
    >
      <StaffField id={`${uid}-staff`} label="Staff member observed" value={staffId} onChange={setStaffId} staff={staff} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${uid}-date`} className="mb-1 block text-sm font-medium">Date observed *</label>
          <Input id={`${uid}-date`} type="date" max={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${uid}-outcome`} className="mb-1 block text-sm font-medium">Outcome *</label>
          <Select value={outcome} onValueChange={(v) => setOutcome(v as ObservationOutcome)}>
            <SelectTrigger id={`${uid}-outcome`}><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {OUTCOMES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-context`} className="mb-1 block text-sm font-medium">Context</label>
        <Input id={`${uid}-context`} placeholder="e.g. handover, a de-escalation, a keywork session" value={context} onChange={(e) => setContext(e.target.value)} />
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium">Domains observed</span>
        <div className="flex flex-wrap gap-1.5">
          {ALL_COMPETENCY_DOMAINS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDomain(d)}
              aria-pressed={domains.includes(d)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                domains.includes(d)
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                  : "border-[var(--cs-border)] text-[var(--cs-text-secondary)]"
              }`}
            >
              {COMPETENCY_DOMAIN_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-narrative`} className="mb-1 block text-sm font-medium">What you observed *</label>
        <Textarea id={`${uid}-narrative`} rows={4} value={narrative} onChange={(e) => setNarrative(e.target.value)} placeholder="Describe the practice you saw, in your own words." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${uid}-strengths`} className="mb-1 block text-sm font-medium">Strengths</label>
          <Textarea id={`${uid}-strengths`} rows={3} value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="One per line" />
        </div>
        <div>
          <label htmlFor={`${uid}-development`} className="mb-1 block text-sm font-medium">Development areas</label>
          <Textarea id={`${uid}-development`} rows={3} value={development} onChange={(e) => setDevelopment(e.target.value)} placeholder="One per line" />
        </div>
      </div>
    </RecordDialogShell>
  );
}

/* ── 2. Qualification ──────────────────────────────────────────────────────── */

const QUAL_STATUSES: { value: QualificationStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "expired", label: "Expired" },
  { value: "exempt", label: "Exempt" },
];

export function NewQualificationDialog({
  open, onOpenChange, staff,
}: { open: boolean; onOpenChange: (v: boolean) => void; staff: StaffOption[] }) {
  const uid = useId();
  const qc = useQueryClient();
  const [staffId, setStaffId] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<QualificationStatus | "">("");
  const [awardingBody, setAwardingBody] = useState("");
  const [level, setLevel] = useState("");
  const [mandatory, setMandatory] = useState(false);
  const [completedAt, setCompletedAt] = useState("");
  const [expiry, setExpiry] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setStaffId(""); setName(""); setStatus(""); setAwardingBody(""); setLevel("");
    setMandatory(false); setCompletedAt(""); setExpiry(""); setNotes("");
  };

  const create = useMutation({
    mutationFn: () =>
      api.post("/workforce/qualifications", {
        staff_id: staffId,
        home_id: HOME_ID,
        qualification_name: name.trim(),
        status,
        mandatory,
        ...optional({ awarding_body: awardingBody, level, completed_at: completedAt, expiry_date: expiry, notes }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workforce", "qualifications"] });
      reset();
      onOpenChange(false);
    },
  });

  return (
    <RecordDialogShell
      open={open}
      onOpenChange={(v) => { if (!v) create.reset(); onOpenChange(v); }}
      title="Add a qualification"
      blurb="Level 3/4/5 diplomas and any award with an expiry the home has to track."
      canSave={!!staffId && !!name.trim() && !!status}
      pending={create.isPending}
      error={create.isError ? errText(create.error) : ""}
      onSave={() => create.mutate()}
      saveLabel="Save qualification"
    >
      <StaffField id={`${uid}-staff`} label="Staff member" value={staffId} onChange={setStaffId} staff={staff} />

      <div>
        <label htmlFor={`${uid}-name`} className="mb-1 block text-sm font-medium">Qualification *</label>
        <Input id={`${uid}-name`} placeholder="e.g. Level 3 Diploma for Residential Childcare" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${uid}-status`} className="mb-1 block text-sm font-medium">Status *</label>
          <Select value={status} onValueChange={(v) => setStatus(v as QualificationStatus)}>
            <SelectTrigger id={`${uid}-status`}><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {QUAL_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor={`${uid}-level`} className="mb-1 block text-sm font-medium">Level</label>
          <Input id={`${uid}-level`} placeholder="e.g. 3" value={level} onChange={(e) => setLevel(e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-body`} className="mb-1 block text-sm font-medium">Awarding body</label>
        <Input id={`${uid}-body`} placeholder="e.g. NCFE CACHE" value={awardingBody} onChange={(e) => setAwardingBody(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${uid}-completed`} className="mb-1 block text-sm font-medium">Completed on</label>
          <Input id={`${uid}-completed`} type="date" max={todayStr()} value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${uid}-expiry`} className="mb-1 block text-sm font-medium">Expires</label>
          <Input id={`${uid}-expiry`} type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} />
        Mandatory for this role
      </label>

      <div>
        <label htmlFor={`${uid}-notes`} className="mb-1 block text-sm font-medium">Notes</label>
        <Textarea id={`${uid}-notes`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </RecordDialogShell>
  );
}

/* ── 3. Appraisal ──────────────────────────────────────────────────────────── */

const APPRAISAL_TYPES: { value: AppraisalType; label: string }[] = [
  { value: "annual_appraisal", label: "Annual appraisal" },
  { value: "mid_year", label: "Mid-year review" },
  { value: "probation_review", label: "Probation review" },
  { value: "pip", label: "Performance improvement plan" },
];

export function NewAppraisalDialog({
  open, onOpenChange, staff, appraiserId,
}: { open: boolean; onOpenChange: (v: boolean) => void; staff: StaffOption[]; appraiserId: string }) {
  const uid = useId();
  const qc = useQueryClient();
  const [staffId, setStaffId] = useState("");
  const [type, setType] = useState<AppraisalType | "">("");
  const [date, setDate] = useState(todayStr());
  const [nextReview, setNextReview] = useState("");
  const [objectives, setObjectives] = useState("");

  const reset = () => {
    setStaffId(""); setType(""); setDate(todayStr()); setNextReview(""); setObjectives("");
  };

  const create = useMutation({
    mutationFn: () =>
      api.post("/workforce/appraisals", {
        staff_id: staffId,
        home_id: HOME_ID,
        ...optional({ appraiser_id: appraiserId }),
        appraisal_type: type,
        appraisal_date: date,
        // Scheduled, not judged: a rating and competency scores belong to the
        // conversation, not to the act of booking it. The route defaults
        // status to "scheduled" and competency_scores to {}.
        ...optional({ next_review_date: nextReview, objectives_next_period: objectives }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workforce", "appraisals"] });
      reset();
      onOpenChange(false);
    },
  });

  return (
    <RecordDialogShell
      open={open}
      onOpenChange={(v) => { if (!v) create.reset(); onOpenChange(v); }}
      title="Schedule an appraisal"
      blurb="This books the appraisal. The rating and competency scores are recorded in the appraisal itself, once it has happened."
      canSave={!!staffId && !!type && !!date}
      pending={create.isPending}
      error={create.isError ? errText(create.error) : ""}
      onSave={() => create.mutate()}
      saveLabel="Schedule appraisal"
    >
      <StaffField id={`${uid}-staff`} label="Staff member" value={staffId} onChange={setStaffId} staff={staff} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${uid}-type`} className="mb-1 block text-sm font-medium">Type *</label>
          <Select value={type} onValueChange={(v) => setType(v as AppraisalType)}>
            <SelectTrigger id={`${uid}-type`}><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {APPRAISAL_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor={`${uid}-date`} className="mb-1 block text-sm font-medium">Appraisal date *</label>
          <Input id={`${uid}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-next`} className="mb-1 block text-sm font-medium">Next review due</label>
        <Input id={`${uid}-next`} type="date" value={nextReview} onChange={(e) => setNextReview(e.target.value)} />
      </div>

      <div>
        <label htmlFor={`${uid}-objectives`} className="mb-1 block text-sm font-medium">Objectives to discuss</label>
        <Textarea id={`${uid}-objectives`} rows={3} value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="What this appraisal needs to cover." />
      </div>
    </RecordDialogShell>
  );
}

/* ── 4. Induction ──────────────────────────────────────────────────────────── */

export function NewInductionDialog({
  open, onOpenChange, staff, lineManagerId,
}: { open: boolean; onOpenChange: (v: boolean) => void; staff: StaffOption[]; lineManagerId: string }) {
  const uid = useId();
  const qc = useQueryClient();
  const [staffId, setStaffId] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [targetDate, setTargetDate] = useState("");
  const [managerId, setManagerId] = useState(lineManagerId);
  const [buddyId, setBuddyId] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setStaffId(""); setStartDate(todayStr()); setTargetDate("");
    setManagerId(lineManagerId); setBuddyId(""); setNotes("");
  };

  const create = useMutation({
    mutationFn: () =>
      api.post("/workforce/induction", {
        staff_id: staffId,
        home_id: HOME_ID,
        start_date: startDate,
        target_completion_date: targetDate,
        line_manager_id: managerId,
        // The checklist is not invented here — items are added on the
        // induction record itself, so an empty induction reads as empty.
        ...optional({ buddy_id: buddyId, notes }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workforce", "induction"] });
      reset();
      onOpenChange(false);
    },
  });

  return (
    <RecordDialogShell
      open={open}
      onOpenChange={(v) => { if (!v) create.reset(); onOpenChange(v); }}
      title="Start an induction"
      blurb="Opens the induction record. Checklist items are added to it afterwards — it starts empty rather than pre-ticked."
      canSave={!!staffId && !!startDate && !!targetDate && !!managerId}
      pending={create.isPending}
      error={create.isError ? errText(create.error) : ""}
      onSave={() => create.mutate()}
      saveLabel="Start induction"
    >
      <StaffField id={`${uid}-staff`} label="New starter" value={staffId} onChange={setStaffId} staff={staff} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${uid}-start`} className="mb-1 block text-sm font-medium">Start date *</label>
          <Input id={`${uid}-start`} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${uid}-target`} className="mb-1 block text-sm font-medium">Target completion *</label>
          <Input id={`${uid}-target`} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </div>
      </div>

      <StaffField id={`${uid}-manager`} label="Line manager" value={managerId} onChange={setManagerId} staff={staff} />

      <div>
        <label htmlFor={`${uid}-buddy`} className="mb-1 block text-sm font-medium">Buddy</label>
        <Select value={buddyId} onValueChange={setBuddyId}>
          <SelectTrigger id={`${uid}-buddy`}><SelectValue placeholder="Optional" /></SelectTrigger>
          <SelectContent>
            {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor={`${uid}-notes`} className="mb-1 block text-sm font-medium">Notes</label>
        <Textarea id={`${uid}-notes`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </RecordDialogShell>
  );
}
