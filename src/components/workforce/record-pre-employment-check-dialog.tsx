"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORD A PRE-EMPLOYMENT CHECK
//
// The barred-list and prohibition checks had no field to live in, which is why
// /workforce/qualifications hardcoded `barred_list_checked: true` for every
// staff member and drew the badge unconditionally (#939). Removing the fake
// ones left a gap; this is where the real ones get recorded.
//
// A DATE and a NAME, not a tick. "Checked on 12 March by the registered
// manager" is the evidence Schedule 2 asks for. A boolean is a claim, and a
// claim is what invites the next `?? true`.
//
// Clearing is supported on purpose: a check recorded against the wrong person
// has to be correctable, and a cleared check reads as "not recorded", which is
// then the truth about it.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useId, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { api } from "@/hooks/use-api";
import { todayStr } from "@/lib/utils";

export interface PreEmploymentSubject {
  id: string;
  full_name: string;
  dbs_number: string | null;
  dbs_issue_date: string | null;
  right_to_work_checked_date: string | null;
  barred_list_checked_date: string | null;
  prohibition_checked_date: string | null;
}

const CHECKS = [
  { dateKey: "right_to_work_checked_date", byKey: "right_to_work_checked_by", label: "Right to work" },
  { dateKey: "barred_list_checked_date", byKey: "barred_list_checked_by", label: "Children's barred list" },
  { dateKey: "prohibition_checked_date", byKey: "prohibition_checked_by", label: "Prohibition / s.128 direction" },
] as const;

export function RecordPreEmploymentCheckDialog({
  open, onOpenChange, subject, checkedBy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subject: PreEmploymentSubject | null;
  checkedBy: string;
}) {
  const uid = useId();
  const qc = useQueryClient();
  // The dialog shows what is already recorded (an empty form would look like
  // nothing has ever been checked) until the manager edits; then their dates
  // win, and closing discards them so reopening re-reads the record.
  const recordedDates = useMemo<Record<string, string>>(() => ({
    right_to_work_checked_date: subject?.right_to_work_checked_date ?? "",
    barred_list_checked_date: subject?.barred_list_checked_date ?? "",
    prohibition_checked_date: subject?.prohibition_checked_date ?? "",
  }), [subject]);
  const [editedDates, setEditedDates] = useState<Record<string, string> | null>(null);
  const dates = editedDates ?? recordedDates;

  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, string | null> = {};
      for (const c of CHECKS) {
        const value = dates[c.dateKey]?.trim() ?? "";
        // "" means the manager cleared it — send null, which clears the column.
        body[c.dateKey] = value || null;
        body[c.byKey] = value ? checkedBy : null;
      }
      return api.patch(`/staff/${subject!.id}`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { save.reset(); setEditedDates(null); } onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pre-employment checks — {subject?.full_name}</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-xs text-[var(--cs-text-muted)]">
          Record the date each check was made. Leave a date empty if the check is not recorded —
          an empty field says the record is missing, which is what an inspector needs to see.
        </p>

        <div className="space-y-4 py-2">
          {CHECKS.map((c) => (
            <div key={c.dateKey}>
              <label htmlFor={`${uid}-${c.dateKey}`} className="mb-1 block text-sm font-medium">
                {c.label} — date checked
              </label>
              <Input
                id={`${uid}-${c.dateKey}`}
                type="date"
                // A check cannot have been made tomorrow; the route rejects it too.
                max={todayStr()}
                value={dates[c.dateKey] ?? ""}
                onChange={(e) => setEditedDates((p) => ({ ...(p ?? recordedDates), [c.dateKey]: e.target.value }))}
              />
            </div>
          ))}

          <p className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] p-2.5 text-xs text-[var(--cs-text-secondary)]">
            Saved against your name: <span className="font-medium">{checkedBy || "not signed in"}</span>.
            A check is evidence of who verified it, not just that someone did.
          </p>
        </div>

        {save.isError && (
          <p className="text-sm text-red-600">
            Nothing was saved — {save.error instanceof Error && save.error.message ? save.error.message : "the request failed"}.
            This staff member&apos;s record is unchanged.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!subject || !checkedBy || save.isPending} className="gap-1.5">
            {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save checks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
