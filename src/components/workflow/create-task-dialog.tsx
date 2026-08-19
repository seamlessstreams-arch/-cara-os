"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CREATE-A-TASK FROM A WORKFLOW ACTION
//
// Four of the dead workflow buttons (#934 baseline) mean the same thing: turn
// what you are looking at into a piece of work someone owns. "Create Key Work
// Task", "Create Debrief Task", "Assign Task", "Assign Training" — all a task,
// differing only in category and what they link back to.
//
// Each opened nothing at all. The manager pressed it, read the suggested
// action next to it, and no task existed.
//
// The dialog PREFILLS from the thing it was launched from, but every prefilled
// field stays editable and the description is not invented — if the caller has
// no context to offer, the field starts empty rather than being filled with a
// plausible sentence nobody wrote.
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
import { careToast } from "@/lib/toast";
import { TASK_CATEGORIES, TASK_CATEGORY_LABELS, type TaskCategory, type TaskPriority } from "@/lib/constants";

const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

export interface TaskAssignee { id: string; full_name: string }

export interface CreateTaskDefaults {
  title: string;
  category: TaskCategory;
  priority?: TaskPriority;
  description?: string;
  /** Renders an escalation note and files the task as escalated. */
  escalateTo?: string;
  linkedIncidentId?: string;
  linkedChildId?: string;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  heading: string;
  blurb: string;
  defaults: CreateTaskDefaults;
  staff?: TaskAssignee[];
  homeId?: string;
}

/* The form mounts fresh per open session, keyed by the row's prefill, so the
 * seed is each field's useState initializer. Opening from a different row
 * remounts with that row's defaults — the old reset effect's job — and the
 * second row can no longer inherit the first row's prefill. */
export function CreateTaskDialog(props: CreateTaskDialogProps) {
  if (!props.open) return null;
  return <CreateTaskDialogForm key={`${props.defaults.title}|${props.defaults.category}`} {...props} />;
}

function CreateTaskDialogForm({
  open, onOpenChange, heading, blurb, defaults, staff, homeId = "home_oak",
}: CreateTaskDialogProps) {
  const uid = useId();
  const qc = useQueryClient();

  const [title, setTitle] = useState(defaults.title);
  const [description, setDescription] = useState(defaults.description ?? "");
  const [category, setCategory] = useState<TaskCategory>(defaults.category);
  const [priority, setPriority] = useState<TaskPriority>(defaults.priority ?? "medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.post("/tasks", {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status: "not_started",
        home_id: homeId,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
        linked_incident_id: defaults.linkedIncidentId ?? null,
        linked_child_id: defaults.linkedChildId ?? null,
        ...(defaults.escalateTo
          ? {
              escalated: true,
              escalated_to: defaults.escalateTo,
              escalation_reason: description.trim(),
            }
          : {}),
      }),
    onSuccess: () => {
      careToast.taskCreated(title.trim());
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) create.reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{heading}</DialogTitle></DialogHeader>
        <p className="-mt-2 text-xs text-[var(--cs-text-muted)]">{blurb}</p>

        <div className="space-y-4 py-2">
          <div>
            <label htmlFor={`${uid}-title`} className="mb-1 block text-sm font-medium">Task *</label>
            <Input id={`${uid}-title`} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label htmlFor={`${uid}-description`} className="mb-1 block text-sm font-medium">
              {defaults.escalateTo ? "Why this is being escalated *" : "Detail"}
            </label>
            <Textarea
              id={`${uid}-description`}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={defaults.escalateTo
                ? "What the responsible individual needs to know, and why it cannot be held here."
                : "What needs doing, and anything the person picking it up will need."}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${uid}-category`} className="mb-1 block text-sm font-medium">Category</label>
              <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                <SelectTrigger id={`${uid}-category`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{TASK_CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor={`${uid}-priority`} className="mb-1 block text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger id={`${uid}-priority`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {staff && (
              <div>
                <label htmlFor={`${uid}-assignee`} className="mb-1 block text-sm font-medium">Assign to</label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger id={`${uid}-assignee`}><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label htmlFor={`${uid}-due`} className="mb-1 block text-sm font-medium">Due</label>
              <Input id={`${uid}-due`} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>

        {create.isError && (
          <p className="text-sm text-red-600">
            No task was created — {create.error instanceof Error && create.error.message ? create.error.message : "the request failed"}.
            Your entries are still here; try again.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!title.trim() || (!!defaults.escalateTo && !description.trim()) || create.isPending}
            className="gap-1.5"
          >
            {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {defaults.escalateTo ? "Escalate" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
