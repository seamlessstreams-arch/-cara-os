"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — LOG A SAFEGUARDING CONCERN
//
// /safeguarding shipped a red "Log Concern" button with no handler at all
// (#934 baseline). On every other page an inert button is a nuisance; here it
// is the one that matters most — a worker who has just seen something presses
// it, nothing happens, and the concern goes unrecorded with no error to tell
// them so.
//
// A concern is an incident. The Concerns tab already reads open incidents of
// the safeguarding types, so recording one here puts it exactly where the tab
// is looking — no parallel collection, no second version of the truth.
//
// Deliberate: high and critical concerns are forced to require management
// oversight and the toggle is locked, because that is not a judgement the
// person recording gets to switch off. Missing from care is absent from the
// type list — it has its own flow on the MFC tab, which captures the time
// missing and the police reference this form does not ask for.
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
import { Loader2, ShieldAlert } from "lucide-react";
import { api } from "@/hooks/use-api";
import { todayStr, londonTimeStr } from "@/lib/utils";
import { INCIDENT_TYPE_LABELS, type IncidentSeverity, type IncidentType } from "@/lib/constants";

/** The safeguarding types this form covers — the same set the Concerns tab
 *  reads back, minus missing_from_care (recorded on the MFC tab instead). */
const CONCERN_TYPES: IncidentType[] = [
  "safeguarding_concern",
  "exploitation_concern",
  "contextual_safeguarding",
  "self_harm",
  "allegation",
];

const SEVERITIES: { value: IncidentSeverity; label: string; hint: string }[] = [
  { value: "low", label: "Low", hint: "Noted, monitor" },
  { value: "medium", label: "Medium", hint: "Needs follow-up" },
  { value: "high", label: "High", hint: "Action required now" },
  { value: "critical", label: "Critical", hint: "Immediate safeguarding action" },
];

/** Loose on purpose: the page passes its own enriched young-person rows, whose
 *  optional names are `string | null` rather than `string | undefined`. */
export interface ConcernChildOption {
  id: string;
  full_name?: string | null;
  preferred_name?: string | null;
}

const childLabel = (c: ConcernChildOption) => c.preferred_name || c.full_name || c.id;

export function LogConcernDialog({
  open, onOpenChange, youngPeople, reportedBy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  youngPeople: ConcernChildOption[];
  reportedBy: string;
}) {
  const uid = useId();
  const qc = useQueryClient();

  const [childId, setChildId] = useState("");
  const [type, setType] = useState<IncidentType | "">("");
  const [severity, setSeverity] = useState<IncidentSeverity | "">("");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(londonTimeStr());
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("");
  const [oversight, setOversight] = useState(false);

  // Not the recorder's call to make: a high or critical concern goes to a
  // manager whatever the toggle says.
  const forcedOversight = severity === "high" || severity === "critical";

  const reset = () => {
    setChildId(""); setType(""); setSeverity(""); setDate(todayStr());
    setTime(londonTimeStr()); setLocation(""); setDescription("");
    setAction(""); setOversight(false);
  };

  const create = useMutation({
    mutationFn: () =>
      api.post("/incidents", {
        child_id: childId,
        type,
        severity,
        date,
        time,
        location: location.trim() || null,
        description: description.trim(),
        immediate_action: action.trim(),
        reported_by: reportedBy,
        requires_oversight: forcedOversight || oversight,
        status: "open",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      reset();
      onOpenChange(false);
    },
  });

  const canSave = !!childId && !!type && !!severity && !!date && !!description.trim() && !!action.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) create.reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            Log a safeguarding concern
          </DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-xs text-[var(--cs-text-muted)]">
          This opens a safeguarding record on the Concerns tab. Record what you saw or were
          told, in your own words — you do not need to be certain for it to be worth recording.
        </p>

        <div className="space-y-4 py-2">
          <div>
            <label htmlFor={`${uid}-child`} className="mb-1 block text-sm font-medium">Young person *</label>
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger id={`${uid}-child`}><SelectValue placeholder="Who is this about?" /></SelectTrigger>
              <SelectContent>
                {youngPeople.map((c) => <SelectItem key={c.id} value={c.id}>{childLabel(c)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${uid}-type`} className="mb-1 block text-sm font-medium">Concern type *</label>
              <Select value={type} onValueChange={(v) => setType(v as IncidentType)}>
                <SelectTrigger id={`${uid}-type`}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CONCERN_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{INCIDENT_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor={`${uid}-severity`} className="mb-1 block text-sm font-medium">Severity *</label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as IncidentSeverity)}>
                <SelectTrigger id={`${uid}-severity`}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label} — {s.hint}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor={`${uid}-date`} className="mb-1 block text-sm font-medium">Date *</label>
              <Input id={`${uid}-date`} type="date" max={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor={`${uid}-time`} className="mb-1 block text-sm font-medium">Time</label>
              <Input id={`${uid}-time`} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div>
              <label htmlFor={`${uid}-location`} className="mb-1 block text-sm font-medium">Location</label>
              <Input id={`${uid}-location`} placeholder="Where" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>

          <div>
            <label htmlFor={`${uid}-description`} className="mb-1 block text-sm font-medium">What happened, or what were you told? *</label>
            <Textarea
              id={`${uid}-description`}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Facts first. If a child said something, use their words."
            />
          </div>

          <div>
            <label htmlFor={`${uid}-action`} className="mb-1 block text-sm font-medium">What you did straight away *</label>
            <Textarea
              id={`${uid}-action`}
              rows={3}
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. stayed with them, told the shift leader, called the duty social worker."
            />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={forcedOversight || oversight}
              disabled={forcedOversight}
              onChange={(e) => setOversight(e.target.checked)}
            />
            <span>
              Needs management oversight
              {forcedOversight && (
                <span className="ml-1 text-xs text-rose-600">
                  — required at this severity, so this cannot be turned off
                </span>
              )}
            </span>
          </label>
        </div>

        {create.isError && (
          <p className="text-sm text-red-600">
            This concern was <strong>not</strong> recorded —{" "}
            {create.error instanceof Error && create.error.message ? create.error.message : "the request failed"}.
            Nothing has been saved. Your entries are still here; try again, and tell the shift
            leader now if this cannot wait.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!canSave || create.isPending}
            className="gap-1.5 bg-rose-600 hover:bg-rose-700"
          >
            {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Log concern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
