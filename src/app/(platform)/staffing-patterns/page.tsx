"use client";

// CARA — Shift Patterns: set each staff member's working pattern.
// Weekly (fixed weekdays, e.g. RM Mon–Fri) or rotating (N on / M off, e.g. a
// deputy 2-on/4-off). Patterns drive the cover view and the generate-&-publish
// flow, so what's set here flows straight through.

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useShiftPatterns, useCreatePattern, useUpdatePattern, useDeletePattern, type ShiftPatternRow } from "@/hooks/use-shift-patterns";
import { patternWorksOn, type ShiftPattern } from "@/lib/rota/shift-patterns";
import { CalendarRange, Plus, Pencil, Trash2, Sun, Moon, CalendarCheck } from "lucide-react";

// Display Mon-first; values follow JS getUTCDay (0=Sun … 6=Sat).
const WEEKDAYS: { v: number; label: string }[] = [
  { v: 1, label: "Mon" }, { v: 2, label: "Tue" }, { v: 3, label: "Wed" }, { v: 4, label: "Thu" },
  { v: 5, label: "Fri" }, { v: 6, label: "Sat" }, { v: 0, label: "Sun" },
];
const SHIFT_TYPES: { v: string; label: string }[] = [
  { v: "day", label: "Day" }, { v: "waking_night", label: "Waking night" }, { v: "sleep_in", label: "Sleep-in" },
  { v: "short", label: "Short" }, { v: "handover", label: "Handover" }, { v: "on_call", label: "On call" }, { v: "training_day", label: "Training day" },
];
const NIGHT = new Set(["waking_night", "sleep_in"]);

interface FormState {
  id?: string;
  staff_id: string;
  name: string;
  kind: "weekly" | "rotating";
  weekdays: number[];
  cycle_on: number;
  cycle_off: number;
  anchor_date: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  active: boolean;
}

function blankForm(): FormState {
  const today = new Date().toISOString().slice(0, 10);
  return { staff_id: "", name: "", kind: "weekly", weekdays: [1, 2, 3, 4, 5], cycle_on: 2, cycle_off: 4, anchor_date: today, shift_type: "day", start_time: "08:00", end_time: "20:00", active: true };
}
function formFrom(p: ShiftPatternRow): FormState {
  return {
    id: p.id, staff_id: p.staff_id, name: p.name, kind: p.kind === "rotating" ? "rotating" : "weekly",
    weekdays: p.weekdays ?? [], cycle_on: p.cycle_on ?? 2, cycle_off: p.cycle_off ?? 4, anchor_date: (p.anchor_date ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10),
    shift_type: p.shift_type, start_time: p.start_time, end_time: p.end_time, active: p.active,
  };
}

// Live calendar preview of the pattern being set — the next 4 weeks, aligned to
// weekday columns so the rhythm of a rotating cycle is visible at a glance.
function PatternPreview({ form }: { form: FormState }) {
  const { cells, worked } = useMemo(() => {
    const candidate: ShiftPattern = {
      id: "preview", staff_id: form.staff_id || "preview", name: "preview", kind: form.kind,
      weekdays: form.weekdays, cycle_on: form.cycle_on, cycle_off: form.cycle_off, anchor_date: form.anchor_date,
      shift_type: form.shift_type, start_time: form.start_time, end_time: form.end_time, active: true, home_id: "home_oak",
    };
    const valid = form.kind === "weekly" ? form.weekdays.length > 0 : form.cycle_on >= 1 && !!form.anchor_date;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayMs = Date.parse(`${todayStr}T00:00:00Z`);
    const mondayOffset = (new Date(todayMs).getUTCDay() + 6) % 7; // back to this week's Monday
    const startMs = todayMs - mondayOffset * 864e5;
    const cells = Array.from({ length: 28 }, (_, i) => {
      const ms = startMs + i * 864e5;
      const date = new Date(ms).toISOString().slice(0, 10);
      return { date, num: new Date(ms).getUTCDate(), on: valid && patternWorksOn(candidate, date), past: date < todayStr };
    });
    return { cells, worked: cells.filter((c) => c.on && !c.past).length };
  }, [form]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Preview — next 4 weeks</Label>
        <span className="text-[11px] font-medium text-[var(--cs-teal)]">{worked} shift{worked === 1 ? "" : "s"}</span>
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-semibold uppercase tracking-wide text-[var(--cs-text-gentle)]">{d}</div>
        ))}
        {cells.map((c) => (
          <div key={c.date} title={c.date} className={`flex h-7 items-center justify-center rounded text-[10px] font-semibold ${c.on ? "bg-[var(--cs-teal)] text-white" : "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]"} ${c.past ? "opacity-40" : ""}`}>{c.num}</div>
        ))}
      </div>
    </div>
  );
}

export default function ShiftPatternsPage() {
  const { data: resp, isLoading, error } = useShiftPatterns();
  const data = resp?.data;
  const create = useCreatePattern();
  const update = useUpdatePattern();
  const del = useDeletePattern();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());
  const editing = !!form.id;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => { setForm(blankForm()); create.reset(); update.reset(); setOpen(true); };
  const openEdit = (p: ShiftPatternRow) => { setForm(formFrom(p)); create.reset(); update.reset(); setOpen(true); };
  const toggleWeekday = (v: number) => set("weekdays", form.weekdays.includes(v) ? form.weekdays.filter((d) => d !== v) : [...form.weekdays, v]);

  const valid = form.staff_id && (form.kind === "weekly" ? form.weekdays.length > 0 : form.cycle_on >= 1 && !!form.anchor_date);
  const pending = create.isPending || update.isPending;

  const submit = () => {
    if (!valid) return;
    const base = {
      staff_id: form.staff_id, name: form.name.trim() || undefined, kind: form.kind,
      shift_type: form.shift_type, start_time: form.start_time, end_time: form.end_time, active: form.active,
      ...(form.kind === "weekly" ? { weekdays: form.weekdays } : { cycle_on: form.cycle_on, cycle_off: form.cycle_off, anchor_date: form.anchor_date }),
    };
    if (form.id) update.mutate({ ...base, id: form.id }, { onSuccess: () => setOpen(false) });
    else create.mutate(base, { onSuccess: () => setOpen(false) });
  };

  const patterns = data?.patterns ?? [];

  return (
    <PageShell
      title="Shift Patterns"
      subtitle="Set each staff member's working pattern — it drives cover and the rota you publish."
      showQuickCreate={false}
      actions={<Button size="sm" onClick={openCreate} className="gap-1.5"><Plus className="h-4 w-4" /> Add pattern</Button>}
    >
      <div className="space-y-4">
        <p className="flex items-center gap-2 rounded-xl bg-[var(--cs-surface)] px-4 py-2.5 text-xs text-[var(--cs-text-secondary)]">
          <CalendarCheck className="h-4 w-4 text-[var(--cs-teal)]" />
          Patterns feed the <Link href="/staffing-cover" className="font-semibold text-[var(--cs-teal)] underline-offset-2 hover:underline">Staffing Cover</Link> view and the rota you generate &amp; publish from there.
        </p>

        {error && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Could not load patterns: {(error as Error).message}</CardContent></Card>}
        {isLoading && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Loading patterns…</CardContent></Card>}

        {data && patterns.length === 0 && (
          <Card><CardContent className="py-8 text-center text-sm text-[var(--cs-text-muted)]">No patterns set yet. Use <b>Add pattern</b> to set how each staff member works.</CardContent></Card>
        )}

        <CardErrorBoundary>
          <div className="grid gap-2.5">
            {patterns.map((p) => {
              const Icon = NIGHT.has(p.shift_type) ? Moon : Sun;
              return (
                <div key={p.id} className={`flex items-center justify-between gap-3 rounded-xl border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-3 ${p.active ? "" : "opacity-60"}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cs-text-muted)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--cs-navy)]">{p.staff_name} <span className="font-normal text-[var(--cs-text-muted)]">· {p.name}</span></p>
                      <p className="text-xs text-[var(--cs-text-secondary)]">{p.description} · {SHIFT_TYPES.find((s) => s.v === p.shift_type)?.label ?? p.shift_type} · {p.start_time}–{p.end_time}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.active ? "bg-[var(--cs-success-bg)] text-[var(--cs-success)]" : "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]"}`}>{p.active ? "Active" : "Paused"}</span>
                    <Button variant="ghost" size="sm" onClick={() => update.mutate({ id: p.id, staff_id: p.staff_id, kind: p.kind === "rotating" ? "rotating" : "weekly", weekdays: p.weekdays, cycle_on: p.cycle_on, cycle_off: p.cycle_off, anchor_date: p.anchor_date, shift_type: p.shift_type, start_time: p.start_time, end_time: p.end_time, active: !p.active })} className="text-xs">{p.active ? "Pause" : "Activate"}</Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)} aria-label="Edit pattern"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm(`Remove ${p.staff_name}'s pattern?`)) del.mutate(p.id); }} aria-label="Delete pattern"><Trash2 className="h-3.5 w-3.5 text-[var(--cs-risk)]" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardErrorBoundary>
      </div>

      {/* Create / edit pattern */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit pattern" : "Add pattern"}</DialogTitle>
            <DialogDescription>How does this staff member work? This drives their cover and the shifts you generate.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Staff member</Label>
              <Select value={form.staff_id} onValueChange={(v) => set("staff_id", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a staff member…" /></SelectTrigger>
                <SelectContent>{(data?.staff ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Pattern name (optional)</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. RM — Mon–Fri" className="mt-1 h-9" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <div className="mt-1 inline-flex rounded-lg border border-[var(--cs-border-subtle)] p-0.5">
                {(["weekly", "rotating"] as const).map((k) => (
                  <button key={k} type="button" onClick={() => set("kind", k)} className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors ${form.kind === k ? "bg-[var(--cs-teal)] text-white" : "text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)]"}`}>{k === "weekly" ? "Fixed weekdays" : "Rotating (on/off)"}</button>
                ))}
              </div>
            </div>

            {form.kind === "weekly" ? (
              <div>
                <Label className="text-xs">Working days</Label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {WEEKDAYS.map((d) => (
                    <button key={d.v} type="button" onClick={() => toggleWeekday(d.v)} className={`h-8 w-10 rounded-md text-xs font-semibold transition-colors ${form.weekdays.includes(d.v) ? "bg-[var(--cs-teal)] text-white" : "bg-[var(--cs-surface)] text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface-elevated)]"}`}>{d.label}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-[11px]">Days on</Label><Input type="number" min={1} max={14} value={form.cycle_on} onChange={(e) => set("cycle_on", Math.max(1, parseInt(e.target.value || "1", 10)))} className="mt-1 h-9" /></div>
                <div><Label className="text-[11px]">Days off</Label><Input type="number" min={0} max={14} value={form.cycle_off} onChange={(e) => set("cycle_off", Math.max(0, parseInt(e.target.value || "0", 10)))} className="mt-1 h-9" /></div>
                <div><Label className="text-[11px]">Cycle starts</Label><Input type="date" value={form.anchor_date} onChange={(e) => set("anchor_date", e.target.value)} className="mt-1 h-9" /></div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[11px]">Shift</Label>
                <Select value={form.shift_type} onValueChange={(v) => set("shift_type", v)}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIFT_TYPES.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-[11px]">Start</Label><Input value={form.start_time} onChange={(e) => set("start_time", e.target.value)} placeholder="08:00" className="mt-1 h-9" /></div>
              <div><Label className="text-[11px]">End</Label><Input value={form.end_time} onChange={(e) => set("end_time", e.target.value)} placeholder="20:00" className="mt-1 h-9" /></div>
            </div>

            <PatternPreview form={form} />

            {(create.isError || update.isError) && <p className="text-xs text-[var(--cs-risk)]">{((create.error || update.error) as Error)?.message || "Couldn't save — please try again."}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!valid || pending}>{pending ? "Saving…" : editing ? "Save changes" : "Add pattern"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
