"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANUAL DEVELOPMENT PLAN
//
// The Cara Development Planner offers "Generate Plan with Cara" (which works)
// and "Manual Plan" (which did nothing, #934 baseline). The manual route is the
// one that matters when Cara is unavailable — and on this tenant Cara is
// unavailable, because the AI credits are exhausted.
//
// The plan is created EMPTY of actions on purpose. Cara's generated plans come
// with proposed actions; a manual plan's actions are the manager's to write,
// and pre-filling them would put words in a development conversation that has
// not happened yet.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { api } from "@/hooks/use-api";
import { PATHWAY_STAGE_LABELS, PATHWAY_STAGE_ORDER, type PathwayStage } from "@/types/extended";

export function ManualDevelopmentPlanDialog({
  open, onOpenChange, staff, homeId = "home_oak",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  staff: { id: string; full_name: string }[];
  homeId?: string;
}) {
  const uid = useId();
  const qc = useQueryClient();
  const [staffId, setStaffId] = useState("");
  const [title, setTitle] = useState("");
  const [fromStage, setFromStage] = useState<PathwayStage | "">("");
  const [toStage, setToStage] = useState<PathwayStage | "">("");
  const [reviewDate, setReviewDate] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.post("/workforce/development-plans", {
        staff_id: staffId,
        home_id: homeId,
        title: title.trim(),
        from_stage: fromStage,
        to_stage: toStage,
        status: "draft",
        // Written by the manager on the plan itself. An auto-filled action is
        // a development conversation nobody had.
        actions: [],
        cara_generated: false,
        ...(reviewDate ? { review_date: reviewDate } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workforce", "development-plans"] });
      setStaffId(""); setTitle(""); setFromStage(""); setToStage(""); setReviewDate("");
      onOpenChange(false);
    },
  });

  const stageSelect = (label: string, id: string, value: string, onChange: (v: string) => void) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label} *</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent>
          {PATHWAY_STAGE_ORDER.map((s) => (
            <SelectItem key={s} value={s}>{PATHWAY_STAGE_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) create.reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New development plan</DialogTitle></DialogHeader>
        <p className="-mt-2 text-xs text-[var(--cs-text-muted)]">
          Creates the plan as a draft. Its actions are added on the plan itself, after the
          conversation — it starts empty rather than pre-filled.
        </p>

        <div className="space-y-4 py-2">
          <div>
            <label htmlFor={`${uid}-staff`} className="mb-1 block text-sm font-medium">Staff member *</label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger id={`${uid}-staff`}><SelectValue placeholder="Choose a staff member" /></SelectTrigger>
              <SelectContent>
                {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor={`${uid}-title`} className="mb-1 block text-sm font-medium">Plan title *</label>
            <Input id={`${uid}-title`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Progression to Senior RSW" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stageSelect("From", `${uid}-from`, fromStage, (v) => setFromStage(v as PathwayStage))}
            {stageSelect("To", `${uid}-to`, toStage, (v) => setToStage(v as PathwayStage))}
          </div>

          <div>
            <label htmlFor={`${uid}-review`} className="mb-1 block text-sm font-medium">Review date</label>
            <Input id={`${uid}-review`} type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
          </div>
        </div>

        {create.isError && (
          <p className="text-sm text-red-600">
            No plan was created — {create.error instanceof Error && create.error.message ? create.error.message : "the request failed"}.
            Your entries are still here; try again.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!staffId || !title.trim() || !fromStage || !toStage || create.isPending}
            className="gap-1.5"
          >
            {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Create plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
