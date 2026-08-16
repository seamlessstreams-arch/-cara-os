"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPETENCE PASSPORT MANAGER ACTIONS
//
// "Schedule Supervision" and "Restrict Duty" sat in the Manager Actions card
// with no handler at all (#934 baseline), next to a working "Approve
// Competency". Restricting a staff member's duties is the most consequential
// control on the page — it is what stops someone administering medication or
// lone working — and it did nothing.
//
// Both dialogs pick the staff member from the ROSTER, not from the passport
// record's own id. The passport ids are the intelligence layer's ("staff-a"),
// and a supervision filed against one would reference a person the rota does
// not have.
//
// A restriction requires a reason. A restriction without one cannot be
// reviewed, lifted, or defended at inspection, so the field is mandatory
// rather than optional-and-usually-blank.
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
import { ilFetch } from "@/lib/intelligence/il-fetch";
import { todayStr } from "@/lib/utils";
import { SUPERVISION_TYPES, SUPERVISION_TYPE_LABELS, type SupervisionType } from "@/lib/constants";

export interface RosterStaff { id: string; full_name: string }

export interface ExistingRestriction {
  id: string;
  restriction: string;
  reason: string;
  appliedDate: string;
  appliedBy: string;
}

const errText = (e: unknown) => (e instanceof Error && e.message ? e.message : "the request failed");

/* ── Schedule a supervision ────────────────────────────────────────────────── */

export function ScheduleSupervisionDialog({
  open, onOpenChange, staff, supervisorId, homeId = "home_oak",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  staff: RosterStaff[];
  supervisorId: string;
  homeId?: string;
}) {
  const uid = useId();
  const qc = useQueryClient();
  const [staffId, setStaffId] = useState("");
  const [type, setType] = useState<SupervisionType | "">("");
  const [date, setDate] = useState("");
  const [points, setPoints] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.post("/supervision", {
        staff_id: staffId,
        supervisor_id: supervisorId || null,
        home_id: homeId,
        type,
        scheduled_date: date,
        status: "scheduled",
        // Not invented: an unwritten agenda is an empty string, and the
        // supervision record shows it as unwritten rather than as "none".
        discussion_points: points.trim(),
        actions_agreed: [],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supervision"] });
      qc.invalidateQueries({ queryKey: ["il", "competence"] });
      setStaffId(""); setType(""); setDate(""); setPoints("");
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) create.reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Schedule a supervision</DialogTitle></DialogHeader>
        <p className="-mt-2 text-xs text-[var(--cs-text-muted)]">
          Books the session. What was discussed is recorded on the supervision itself, afterwards.
        </p>

        <div className="space-y-4 py-2">
          <div>
            <label htmlFor={`${uid}-staff`} className="mb-1 block text-sm font-medium">Staff member *</label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger id={`${uid}-staff`}><SelectValue placeholder="Choose from the roster" /></SelectTrigger>
              <SelectContent>
                {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${uid}-type`} className="mb-1 block text-sm font-medium">Type *</label>
              <Select value={type} onValueChange={(v) => setType(v as SupervisionType)}>
                <SelectTrigger id={`${uid}-type`}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {SUPERVISION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{SUPERVISION_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor={`${uid}-date`} className="mb-1 block text-sm font-medium">Date *</label>
              <Input id={`${uid}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label htmlFor={`${uid}-points`} className="mb-1 block text-sm font-medium">Agenda</label>
            <Textarea id={`${uid}-points`} rows={3} value={points} onChange={(e) => setPoints(e.target.value)} placeholder="What this supervision needs to cover." />
          </div>
        </div>

        {create.isError && (
          <p className="text-sm text-red-600">
            Nothing was scheduled — {errText(create.error)}. Your entries are still here; try again.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!staffId || !type || !date || create.isPending} className="gap-1.5">
            {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Schedule supervision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Restrict duty ─────────────────────────────────────────────────────────── */

/** Common restrictions, offered as a starting point. Free text stays available
 *  because the list cannot anticipate every reason a duty is limited. */
const COMMON_RESTRICTIONS = [
  "Cannot administer medication",
  "Cannot lone work",
  "Cannot lead a shift",
  "Cannot supervise others",
  "Cannot transport young people",
];

export function RestrictDutyDialog({
  open, onOpenChange, passportStaffId, staffLabel, existing, appliedBy, homeId = "oak-house",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  passportStaffId: string;
  staffLabel: string;
  existing: ExistingRestriction[];
  appliedBy: string;
  homeId?: string;
}) {
  const uid = useId();
  const qc = useQueryClient();
  const [restriction, setRestriction] = useState("");
  const [reason, setReason] = useState("");

  const apply = useMutation({
    mutationFn: () =>
      ilFetch("/competence", {
        method: "POST",
        body: JSON.stringify({
          staffId: passportStaffId,
          homeId,
          // Existing restrictions are carried forward explicitly. The upsert
          // writes the column it is given, so sending only the new one would
          // delete every restriction already in force.
          restrictions: [
            ...existing,
            {
              id: `r_${existing.length + 1}_${todayStr()}`,
              restriction: restriction.trim(),
              reason: reason.trim(),
              appliedDate: todayStr(),
              appliedBy,
            },
          ],
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["il", "competence"] });
      setRestriction(""); setReason("");
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) apply.reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Restrict duty — {staffLabel}</DialogTitle></DialogHeader>
        <p className="-mt-2 text-xs text-[var(--cs-text-muted)]">
          Records a limit on what this staff member may do, and why. Both are needed: a
          restriction with no reason cannot be reviewed or lifted.
        </p>

        <div className="space-y-4 py-2">
          <div>
            <label htmlFor={`${uid}-restriction`} className="mb-1 block text-sm font-medium">Restriction *</label>
            <Input
              id={`${uid}-restriction`}
              value={restriction}
              onChange={(e) => setRestriction(e.target.value)}
              placeholder="What they may not do"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COMMON_RESTRICTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRestriction(r)}
                  className="rounded-full border border-[var(--cs-border)] px-2.5 py-1 text-xs text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)]"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor={`${uid}-reason`} className="mb-1 block text-sm font-medium">Reason *</label>
            <Textarea
              id={`${uid}-reason`}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why this restriction is being applied, and what would lift it."
            />
          </div>

          {existing.length > 0 && (
            <div className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] p-3">
              <p className="mb-1 text-xs font-medium text-[var(--cs-text-secondary)]">
                Already in force ({existing.length}) — these stay in place
              </p>
              <ul className="list-disc pl-4 text-xs text-[var(--cs-text-muted)]">
                {existing.map((r) => <li key={r.id}>{r.restriction}</li>)}
              </ul>
            </div>
          )}
        </div>

        {apply.isError && (
          <p className="text-sm text-red-600">
            The restriction was <strong>not</strong> applied — {errText(apply.error)}. This staff
            member&apos;s duties are unchanged. Try again.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => apply.mutate()}
            disabled={!restriction.trim() || !reason.trim() || apply.isPending}
            className="gap-1.5"
          >
            {apply.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Apply restriction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
