"use client";

// CARA — Staffing Cover: the forward, anti-rota-blindness view.
// Day-by-day, day/night cover vs the home policy — under, over (with/without a
// reason), no-waking-night and phantom (scheduled-but-off) gaps, worst-first.

import React, { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardErrorBoundary } from "@/components/dashboard/card-error-boundary";
import { PrintButton } from "@/components/common/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStaffingCover, useLogCoverReason, useUpdateStaffingPolicy, type StaffingPolicyInput } from "@/hooks/use-staffing-cover";
import { CalendarRange, AlertTriangle, CheckCircle2, Sun, Moon, Users, PlusCircle, SlidersHorizontal } from "lucide-react";
import type { CoverSeverity, CoverStatus, PeriodCover } from "@/lib/rota/staffing-cover-engine";

const COVER_REASONS: { value: string; label: string }[] = [
  { value: "shadow_shift", label: "Shadow shift" },
  { value: "induction", label: "Induction" },
  { value: "training", label: "Training" },
  { value: "child_plan_adjustment", label: "Adjustment in a child's plan" },
  { value: "extra_support", label: "Extra support" },
  { value: "higher_ratio", label: "Higher staffing ratio" },
  { value: "other", label: "Other" },
];

const SEV_BAR: Record<CoverSeverity, string> = {
  critical: "border-l-[var(--cs-risk)]",
  high: "border-l-[var(--cs-warning)]",
  attention: "border-l-[var(--cs-teal)]",
  ok: "border-l-[var(--cs-border)]",
};
const STATUS_CHIP: Record<CoverStatus, string> = {
  under: "bg-[var(--cs-risk-bg)] text-[var(--cs-risk)]",
  no_waking_night: "bg-[var(--cs-warning-bg)] text-[var(--cs-warning)]",
  over_unexplained: "bg-[var(--cs-teal-bg)] text-[var(--cs-teal)]",
  over_explained: "bg-[var(--cs-surface)] text-[var(--cs-text-muted)]",
  met: "bg-[var(--cs-success-bg)] text-[var(--cs-success)]",
};
const STATUS_LABEL: Record<CoverStatus, string> = {
  under: "Under-covered",
  no_waking_night: "No waking night",
  over_unexplained: "Extra — explain",
  over_explained: "Extra (logged)",
  met: "Met",
};

function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function PeriodRow({ p, showDate, onAddReason }: { p: PeriodCover; showDate?: boolean; onAddReason?: (p: PeriodCover) => void }) {
  const Icon = p.period === "night" ? Moon : Sun;
  return (
    <div className={`rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface-elevated)] p-2.5 border-l-4 ${SEV_BAR[p.severity]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--cs-text-muted)]" />
          <div>
            {showDate && <p className="text-xs font-semibold text-[var(--cs-navy)]">{fmtDate(p.date)} · {p.period}</p>}
            <p className="text-xs text-[var(--cs-text-secondary)]">{p.message}</p>
            {p.phantom > 0 && <p className="mt-0.5 text-[11px] text-[var(--cs-warning)]">Scheduled but off: {p.phantom_names.join(", ")}</p>}
            {p.status === "over_explained" && p.reason && (
              <p className="mt-0.5 text-[11px] text-[var(--cs-text-muted)]">Reason logged: {p.reason.replace(/_/g, " ")}</p>
            )}
            {p.status === "over_unexplained" && onAddReason && (
              <button
                type="button"
                onClick={() => onAddReason(p)}
                className="mt-1 inline-flex items-center gap-1 rounded-md bg-[var(--cs-teal-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--cs-teal)] transition-colors hover:bg-[var(--cs-teal)] hover:text-white print:hidden"
              >
                <PlusCircle className="h-3 w-3" /> Add a reason
              </button>
            )}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CHIP[p.status]}`}>{STATUS_LABEL[p.status]}</span>
      </div>
    </div>
  );
}

export default function StaffingCoverPage() {
  const { data: resp, isLoading, error } = useStaffingCover();
  const o = resp?.data;

  const logReason = useLogCoverReason();
  const [target, setTarget] = useState<PeriodCover | null>(null);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");

  const openReason = (p: PeriodCover) => { setTarget(p); setReason(""); setComment(""); logReason.reset(); };
  const submitReason = () => {
    if (!target || !reason) return;
    logReason.mutate(
      { date: target.date, period: target.period, reason, comment },
      { onSuccess: () => setTarget(null) },
    );
  };

  const updatePolicy = useUpdateStaffingPolicy();
  const [policyOpen, setPolicyOpen] = useState(false);
  const [form, setForm] = useState<StaffingPolicyInput | null>(null);
  const openPolicy = () => {
    if (!o) return;
    setForm({ min_day: o.policy.min_day, min_night: o.policy.min_night, expected_day: o.policy.expected_day, expected_night: o.policy.expected_night, waking_night_required: o.policy.waking_night_required });
    updatePolicy.reset();
    setPolicyOpen(true);
  };
  const setField = (k: keyof StaffingPolicyInput, v: number | boolean) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const submitPolicy = () => { if (form) updatePolicy.mutate(form, { onSuccess: () => setPolicyOpen(false) }); };

  const byDate = useMemo(() => {
    const m = new Map<string, PeriodCover[]>();
    for (const p of o?.periods ?? []) {
      const arr = m.get(p.date) ?? [];
      arr.push(p);
      m.set(p.date, arr);
    }
    return [...m.entries()];
  }, [o]);

  return (
    <PageShell
      title="Staffing Cover"
      subtitle={o ? `${o.range.from} → ${o.range.to} · ${o.headline}` : "Forward cover vs the home's minimum and norm — defeating rota blindness."}
      showQuickCreate={false}
      actions={o ? <PrintButton title="Staffing Cover" subtitle={o.headline} targetId="staffing-cover-print" /> : undefined}
    >
      <div className="space-y-6">
        {error && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Could not load cover: {(error as Error).message}</CardContent></Card>}
        {isLoading && <Card><CardContent className="py-6 text-sm text-[var(--cs-text-muted)]">Building the cover picture…</CardContent></Card>}

        {o && (
          <div id="staffing-cover-print" className="space-y-6">
            {/* Policy + summary */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--cs-surface)] px-4 py-3 text-xs text-[var(--cs-text-secondary)]">
              <Users className="h-4 w-4 text-[var(--cs-teal)]" />
              <span>Policy — day min <b>{o.policy.min_day}</b> (norm {o.policy.expected_day}) · night min <b>{o.policy.min_night}</b> (norm {o.policy.expected_night}) · waking night {o.policy.waking_night_required ? "required" : "not required"}</span>
              <button
                type="button"
                onClick={openPolicy}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--cs-teal)] transition-colors hover:bg-[var(--cs-teal-bg)] print:hidden"
              >
                <SlidersHorizontal className="h-3 w-3" /> Edit policy
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { label: "Under-covered", value: o.summary.days_under, bad: o.summary.days_under > 0 },
                { label: "No waking night", value: o.summary.nights_no_waking, bad: o.summary.nights_no_waking > 0 },
                { label: "Extra to explain", value: o.summary.over_unexplained, bad: o.summary.over_unexplained > 0 },
                { label: "Scheduled-but-off", value: o.summary.phantom_days, bad: o.summary.phantom_days > 0 },
                { label: "Unfilled shifts", value: o.summary.open_shift_periods, bad: o.summary.open_shift_periods > 0 },
              ].map((c) => (
                <div key={c.label} className="rounded-xl bg-[var(--cs-surface)] px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted)]">{c.label}</p>
                  <p className={`mt-0.5 text-2xl font-extrabold tracking-tight ${c.bad ? "text-[var(--cs-warning)]" : "text-[var(--cs-navy)]"}`}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Needs attention (worst-first) */}
            <CardErrorBoundary>
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[var(--cs-warning)]" />
                  <CardTitle className="text-sm">Needs attention</CardTitle>
                </CardHeader>
                <CardContent>
                  {o.attention.length === 0 ? (
                    <p className="flex items-center gap-2 py-1 text-sm text-[var(--cs-text-secondary)]"><CheckCircle2 className="h-4 w-4 text-[var(--cs-success)]" /> Cover is complete across the fortnight — minimums met, waking-night in place, no unexplained extra.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {o.attention.map((p) => <PeriodRow key={`${p.date}-${p.period}`} p={p} showDate onAddReason={openReason} />)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardErrorBoundary>

            {/* Day-by-day */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <CalendarRange className="h-4 w-4 text-[var(--cs-teal)]" />
                <CardTitle className="text-sm">Day by day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {byDate.map(([date, periods]) => (
                    <div key={date}>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--cs-text-muted)]">{fmtDate(date)}</p>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {periods.map((p) => <PeriodRow key={p.period} p={p} onAddReason={openReason} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <p className="flex items-start gap-2 text-xs text-[var(--cs-text-gentle)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Cover counts only available staff — anyone on approved leave or off sick is removed, and unfilled shifts don&apos;t count, so hidden gaps surface. {o.projected_count > 0 ? `Includes ${o.projected_count} shift(s) projected from staff patterns where none is published yet. ` : ""}Extra cover above the norm asks for a reason rather than raising an alarm. It supports professional judgement — staffing decisions remain yours.
            </p>
          </div>
        )}
      </div>

      {/* Add-a-reason dialog — explains extra cover above the norm */}
      <Dialog open={!!target} onOpenChange={(v) => { if (!v) setTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reason for extra cover</DialogTitle>
            <DialogDescription>
              {target ? `${fmtDate(target.date)} · ${target.period} — ${target.effective} on shift vs a norm of ${target.expected}. Recording why keeps the rota honest rather than raising a false alarm.` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a reason…" /></SelectTrigger>
                <SelectContent>
                  {COVER_REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Comment (optional)</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="e.g. Shadowing a new starter on days this week." className="mt-1 text-sm" />
            </div>
            {logReason.isError && <p className="text-xs text-[var(--cs-risk)]">Couldn&apos;t log that just now — please try again.</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button>
            <Button onClick={submitReason} disabled={!reason || logReason.isPending}>
              {logReason.isPending ? "Logging…" : "Log reason"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit staffing policy — minimums + norms, updatable for need / risk */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Home staffing policy</DialogTitle>
            <DialogDescription>The minimum cover and the usual norm, per period. Update these for the home&apos;s current need or risk — the forward view re-checks against them straight away.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 rounded-lg bg-[var(--cs-surface)] p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-navy)]"><Sun className="h-3.5 w-3.5 text-[var(--cs-warning)]" /> Day</p>
                  <div><Label className="text-[11px]">Minimum</Label><Input type="number" min={0} max={20} value={form.min_day} onChange={(e) => setField("min_day", Math.max(0, parseInt(e.target.value || "0", 10)))} className="mt-1 h-9" /></div>
                  <div><Label className="text-[11px]">Norm</Label><Input type="number" min={0} max={20} value={form.expected_day} onChange={(e) => setField("expected_day", Math.max(0, parseInt(e.target.value || "0", 10)))} className="mt-1 h-9" /></div>
                </div>
                <div className="space-y-2 rounded-lg bg-[var(--cs-surface)] p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-navy)]"><Moon className="h-3.5 w-3.5 text-[var(--cs-teal)]" /> Night</p>
                  <div><Label className="text-[11px]">Minimum</Label><Input type="number" min={0} max={20} value={form.min_night} onChange={(e) => setField("min_night", Math.max(0, parseInt(e.target.value || "0", 10)))} className="mt-1 h-9" /></div>
                  <div><Label className="text-[11px]">Norm</Label><Input type="number" min={0} max={20} value={form.expected_night} onChange={(e) => setField("expected_night", Math.max(0, parseInt(e.target.value || "0", 10)))} className="mt-1 h-9" /></div>
                </div>
              </div>
              <div>
                <Label className="text-xs">Waking-night cover</Label>
                <div className="mt-1 inline-flex rounded-lg border border-[var(--cs-border-subtle)] p-0.5">
                  {[{ v: true, l: "Required" }, { v: false, l: "Not required" }].map((opt) => (
                    <button key={opt.l} type="button" onClick={() => setField("waking_night_required", opt.v)}
                      className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${form.waking_night_required === opt.v ? "bg-[var(--cs-teal)] text-white" : "text-[var(--cs-text-muted)] hover:bg-[var(--cs-surface)]"}`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-[var(--cs-text-gentle)]">The norm can&apos;t sit below the minimum — it&apos;ll be raised to match if needed.</p>
              {updatePolicy.isError && <p className="text-xs text-[var(--cs-risk)]">Couldn&apos;t save the policy just now — please try again.</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPolicyOpen(false)}>Cancel</Button>
            <Button onClick={submitPolicy} disabled={!form || updatePolicy.isPending}>{updatePolicy.isPending ? "Saving…" : "Save policy"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
