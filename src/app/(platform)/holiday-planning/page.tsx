"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOLIDAY & TRIP PLANNING
// Manages planned outings, day trips, holidays, and residential trips for young
// people. Includes risk assessments, consent tracking, itineraries, staffing
// ratios, and post-trip evaluations. Regulation 13 (engagement in activities)
// compliance.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { PrintButton } from "@/components/common/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  MapPin, CheckCircle2, Clock, Calendar, AlertTriangle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useTripPlans, useCreateTripPlan } from "@/hooks/use-trip-plans";
import type { TripPlan, TripType, TripStatus, TripRiskLevel, TripStaffRole } from "@/types/extended";
import { TRIP_TYPE_LABEL, TRIP_STATUS_LABEL, TRIP_RISK_LEVEL_LABEL, TRIP_STAFF_ROLE_LABEL } from "@/types/extended";
import { toast } from "sonner";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

// ── Config ───────────────────────────────────────────────────────────────────

const TRIP_TYPE_CONFIG: Record<TripType, { label: string; cls: string }> = {
  day_trip:           { label: "Day Trip",           cls: "bg-blue-50 text-blue-700 border-blue-200" },
  overnight:          { label: "Overnight",          cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  residential:        { label: "Residential",        cls: "bg-purple-50 text-purple-700 border-purple-200" },
  holiday:            { label: "Holiday",            cls: "bg-teal-50 text-teal-700 border-teal-200" },
  educational_visit:  { label: "Educational Visit",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  activity_outing:    { label: "Activity Outing",    cls: "bg-green-50 text-green-700 border-green-200" },
};

const STATUS_CONFIG: Record<TripStatus, { label: string; cls: string }> = {
  planning:    { label: "Planning",    cls: "bg-gray-50 text-gray-700 border-gray-200" },
  approved:    { label: "Approved",    cls: "bg-blue-50 text-blue-700 border-blue-200" },
  ready:       { label: "Ready",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "In Progress", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  completed:   { label: "Completed",   cls: "bg-green-50 text-green-700 border-green-200" },
  cancelled:   { label: "Cancelled",   cls: "bg-red-50 text-red-700 border-red-200" },
};

const RISK_CONFIG: Record<TripRiskLevel, { label: string; cls: string }> = {
  low:    { label: "Low",    cls: "bg-green-50 text-green-700 border-green-200" },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  high:   { label: "High",   cls: "bg-red-50 text-red-700 border-red-200" },
};

// ── Export columns ───────────────────────────────────────────────────────────

const TRIP_EXPORT_COLS: ExportColumn<TripPlan>[] = [
  { header: "Title", accessor: (r) => r.title },
  { header: "Type", accessor: (r) => TRIP_TYPE_CONFIG[r.trip_type].label },
  { header: "Destination", accessor: (r) => r.destination },
  { header: "Start Date", accessor: (r) => r.start_date },
  { header: "End Date", accessor: (r) => r.end_date },
  { header: "Status", accessor: (r) => STATUS_CONFIG[r.status].label },
  { header: "Young People", accessor: (r) => r.young_people.map((yp) => getYPName(yp.child_id)).join(", ") },
  { header: "Staff", accessor: (r) => r.staff_assigned.map((s) => getStaffName(s.staff_id)).join(", ") },
  { header: "Staff Ratio", accessor: (r) => r.staff_ratio },
  { header: "Risk Level", accessor: (r) => r.risk_assessment.overall_risk },
  { header: "Total Budget", accessor: (r) => `£${r.total_budget}` },
  { header: "Transport", accessor: (r) => r.transport },
  { header: "Manager Approved", accessor: (r) => r.manager_approval ? "Yes" : "No" },
];

// ── Star Rating ──────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={cn("text-sm", n <= rating ? "text-amber-400" : "text-slate-200")}>
          ★
        </span>
      ))}
    </span>
  );
}

// ── Trip Card ────────────────────────────────────────────────────────────────

function TripCard({ trip }: { trip: TripPlan }) {
  const [expanded, setExpanded] = useState(false);
  const typeCfg = TRIP_TYPE_CONFIG[trip.trip_type];
  const statusCfg = STATUS_CONFIG[trip.status];
  const riskCfg = RISK_CONFIG[trip.risk_assessment.overall_risk];

  const daysUntil = useMemo(() => {
    const diff = Math.ceil((new Date(trip.start_date).getTime() - Date.now()) / 86400000);
    return diff;
  }, [trip.start_date]);

  const budgetActual = trip.budget.reduce((s, b) => s + (b.actual ?? 0), 0);
  const budgetEstimated = trip.budget.reduce((s, b) => s + b.estimated, 0);
  const allConsent = trip.young_people.every((yp) => yp.consent_obtained);
  const allSWApproved = trip.social_worker_approval.every((a) => a.approved);

  return (
    <div className="rounded-2xl border bg-white overflow-hidden border-[var(--cs-border)] transition-all hover:shadow-sm">
      {/* ── Card header ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-100">
          <MapPin className="h-4 w-4 text-[var(--cs-text-secondary)]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-[var(--cs-navy)]">{trip.title}</span>
            {daysUntil > 0 && daysUntil <= 14 && trip.status !== "completed" && trip.status !== "cancelled" && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                <Clock className="h-2.5 w-2.5 mr-0.5 inline" />{daysUntil}d away
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--cs-text-muted)] flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {trip.start_date === trip.end_date ? trip.start_date : `${trip.start_date} — ${trip.end_date}`}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {trip.destination}
            </span>
            <span>·</span>
            <span>{trip.departure_time} — {trip.return_time}</span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", typeCfg.cls)}>
              {typeCfg.label}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", statusCfg.cls)}>
              {statusCfg.label}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", riskCfg.cls)}>
              Risk: {riskCfg.label}
            </Badge>
            {!allConsent && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5 inline" />Consent pending
              </Badge>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* ── Expanded content ────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-[var(--cs-border-subtle)] px-4 pb-4 pt-3 space-y-4">

          {/* Young People attending */}
          <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-2">Young People Attending</p>
            <div className="space-y-1.5">
              {trip.young_people.map((yp) => (
                <div key={yp.child_id} className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-[var(--cs-text-secondary)] w-24">{getYPName(yp.child_id)}</span>
                  {yp.consent_obtained ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className={cn("text-[10px]", yp.consent_obtained ? "text-green-600" : "text-red-600")}>
                    {yp.consent_obtained ? `Consent: ${yp.consent_from}` : "Consent pending"}
                  </span>
                  {yp.medical_info_shared && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">Med</Badge>
                  )}
                  {yp.behaviour_plan_shared && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)] border-[var(--cs-cara-gold-soft)]">BP</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Staff assigned */}
          <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-2">Staff Assigned — Ratio {trip.staff_ratio}</p>
            <div className="space-y-1">
              {trip.staff_assigned.map((s) => (
                <div key={s.staff_id} className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-[var(--cs-text-secondary)]">{getStaffName(s.staff_id)}</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)] capitalize">{s.role}</Badge>
                  {s.sleep_in && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-indigo-50 text-indigo-600 border-indigo-200">Sleep-in</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest">Risk Assessment</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", riskCfg.cls)}>
                  {riskCfg.label} Risk
                </Badge>
                {trip.risk_assessment.completed ? (
                  <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                    <CheckCircle2 className="h-3 w-3" />Completed
                  </span>
                ) : (
                  <span className="text-[10px] text-red-600 flex items-center gap-0.5">
                    <AlertTriangle className="h-3 w-3" />Incomplete
                  </span>
                )}
              </div>
            </div>
            {trip.risk_assessment.completed_by && (
              <p className="text-[10px] text-[var(--cs-text-muted)] mb-2">
                Completed by {getStaffName(trip.risk_assessment.completed_by)} on {trip.risk_assessment.completed_date}
              </p>
            )}
            <div className="space-y-2">
              {trip.risk_assessment.hazards.map((h, i) => (
                <div key={i} className="rounded-lg border border-[var(--cs-border)] bg-white p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-[var(--cs-text-secondary)]">{h.hazard}</span>
                    <span className="text-[9px] text-[var(--cs-text-muted)]">L:{h.likelihood} × I:{h.impact} = {h.likelihood * h.impact}</span>
                  </div>
                  <p className="text-[10px] text-[var(--cs-text-muted)]">{h.controls}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Itinerary timeline */}
          <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-2">Itinerary</p>
            <div className="relative pl-4 border-l-2 border-[var(--cs-border)] space-y-3">
              {trip.itinerary.map((item, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-white border-2 border-slate-300" />
                  <div className="text-xs">
                    <span className="font-bold text-[var(--cs-text-secondary)]">{item.time}</span>
                    <span className="mx-1.5 text-[var(--cs-text-gentle)]">—</span>
                    <span className="font-medium text-[var(--cs-text-secondary)]">{item.activity}</span>
                    {item.location && (
                      <span className="text-[var(--cs-text-muted)] ml-1">@ {item.location}</span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Budget table */}
          <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-2">Budget — £{trip.total_budget} total</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--cs-border)]">
                    <th className="text-left py-1 text-[10px] font-semibold text-[var(--cs-text-muted)]">Item</th>
                    <th className="text-right py-1 text-[10px] font-semibold text-[var(--cs-text-muted)]">Estimated</th>
                    <th className="text-right py-1 text-[10px] font-semibold text-[var(--cs-text-muted)]">Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.budget.map((b, i) => (
                    <tr key={i} className="border-b border-[var(--cs-border-subtle)] last:border-0">
                      <td className="py-1 text-[var(--cs-text-secondary)]">{b.item}</td>
                      <td className="py-1 text-right text-[var(--cs-text-secondary)]">£{b.estimated}</td>
                      <td className="py-1 text-right text-[var(--cs-text-secondary)]">{b.actual !== null ? `£${b.actual}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-300">
                    <td className="py-1 font-semibold text-[var(--cs-text-secondary)]">Total</td>
                    <td className="py-1 text-right font-semibold text-[var(--cs-text-secondary)]">£{budgetEstimated}</td>
                    <td className="py-1 text-right font-semibold text-[var(--cs-text-secondary)]">
                      {trip.budget.some((b) => b.actual !== null) ? `£${budgetActual}` : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Approvals */}
          <div className="rounded-xl border border-[var(--cs-border)] bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest mb-2">Approvals</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                {trip.manager_approval ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                )}
                <span className="text-[var(--cs-text-secondary)]">
                  Manager approval: {trip.manager_approval
                    ? `Approved by ${trip.manager_approved_by ? getStaffName(trip.manager_approved_by) : "—"}`
                    : "Pending"}
                </span>
              </div>
              {trip.social_worker_approval.map((sw) => (
                <div key={sw.child_id} className="flex items-center gap-2 text-xs">
                  {sw.approved ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span className="text-[var(--cs-text-secondary)]">
                    SW for {getYPName(sw.child_id)}: {sw.approved ? `Approved ${sw.approved_date}` : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Children's views — pink panel */}
          {trip.children_views && (
            <div className="rounded-xl border border-pink-100 bg-pink-50/40 p-3">
              <p className="text-[10px] font-semibold text-pink-700 uppercase tracking-widest mb-1">Children&apos;s Views</p>
              <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{trip.children_views}</p>
            </div>
          )}

          {/* Post-trip evaluation — green panel */}
          {trip.post_trip_evaluation && (
            <div className="rounded-xl border border-green-100 bg-green-50/40 p-3">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-semibold text-green-700 uppercase tracking-widest">Post-Trip Evaluation</p>
                <Stars rating={trip.post_trip_evaluation.rating} />
              </div>
              <div className="space-y-2 text-xs text-[var(--cs-text-secondary)] leading-relaxed">
                <div>
                  <span className="font-semibold text-green-700">Highlights: </span>
                  {trip.post_trip_evaluation.highlights}
                </div>
                {trip.post_trip_evaluation.concerns && (
                  <div>
                    <span className="font-semibold text-amber-700">Concerns: </span>
                    {trip.post_trip_evaluation.concerns}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-green-700">Would repeat: </span>
                  {trip.post_trip_evaluation.would_repeat ? "Yes" : "No"}
                </div>
                <div className="rounded-lg border border-green-200 bg-white/60 p-2 mt-1">
                  <p className="text-[10px] font-semibold text-green-600 uppercase tracking-widest mb-0.5">Child Feedback</p>
                  <p className="text-xs text-[var(--cs-text-secondary)] italic">{trip.post_trip_evaluation.child_feedback}</p>
                </div>
              </div>
            </div>
          )}

          {/* Emergency plan */}
          <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-3">
            <p className="text-[10px] font-semibold text-orange-700 uppercase tracking-widest mb-1">Emergency Plan</p>
            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{trip.emergency_plan}</p>
          </div>

          {/* Notes */}
          {trip.notes && (
            <div className="text-[10px] text-[var(--cs-text-muted)] px-1">
              <span className="font-semibold text-[var(--cs-text-muted)]">Notes: </span>{trip.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── New Trip Dialog ──────────────────────────────────────────────────────────

function NewTripDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<TripPlan>) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    trip_type: "day_trip" as TripType,
    destination: "",
    start_date: "",
    end_date: "",
    departure_time: "09:00",
    return_time: "17:00",
    transport: "Chamberlain House minibus",
    staff_ratio: "1:2",
    notes: "",
    children_views: "",
    emergency_plan: "",
  });

  const handleSave = () => {
    if (!form.title.trim() || !form.destination.trim() || !form.start_date) return;
    onSave({
      title: form.title,
      trip_type: form.trip_type,
      destination: form.destination,
      start_date: form.start_date,
      end_date: form.end_date || form.start_date,
      departure_time: form.departure_time,
      return_time: form.return_time,
      young_people: [],
      staff_assigned: [],
      staff_ratio: form.staff_ratio,
      risk_assessment: {
        completed: false,
        completed_by: null,
        completed_date: null,
        overall_risk: "low",
        hazards: [],
      },
      itinerary: [],
      budget: [],
      total_budget: 0,
      transport: form.transport,
      accommodation: null,
      emergency_plan: form.emergency_plan,
      social_worker_approval: [],
      manager_approval: false,
      manager_approved_by: null,
      children_views: form.children_views,
      post_trip_evaluation: null,
      status: "planning",
      notes: form.notes,
    });
    onClose();
    setForm((p) => ({ ...p, title: "", destination: "", start_date: "", end_date: "", notes: "", children_views: "", emergency_plan: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-blue-600" />
            Plan New Trip
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Trip title <span className="text-red-500">*</span></label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Lake District Weekend" className="h-8 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Trip type</label>
              <Select value={form.trip_type} onValueChange={(v) => setForm((p) => ({ ...p, trip_type: v as TripType }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TRIP_TYPE_CONFIG) as [TripType, { label: string }][]).map(([k, cfg]) => (
                    <SelectItem key={k} value={k} className="text-xs">{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Transport</label>
              <Input value={form.transport} onChange={(e) => setForm((p) => ({ ...p, transport: e.target.value }))} placeholder="e.g. Chamberlain House minibus" className="h-8 text-xs" />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Destination <span className="text-red-500">*</span></label>
            <Input value={form.destination} onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))} placeholder="e.g. Blackpool" className="h-8 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Start date <span className="text-red-500">*</span></label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">End date</label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} className="h-8 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Departure</label>
              <Input type="time" value={form.departure_time} onChange={(e) => setForm((p) => ({ ...p, departure_time: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Return</label>
              <Input type="time" value={form.return_time} onChange={(e) => setForm((p) => ({ ...p, return_time: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Staff ratio</label>
              <Input value={form.staff_ratio} onChange={(e) => setForm((p) => ({ ...p, staff_ratio: e.target.value }))} placeholder="1:2" className="h-8 text-xs" />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Children&apos;s views</label>
            <Textarea value={form.children_views} onChange={(e) => setForm((p) => ({ ...p, children_views: e.target.value }))} placeholder="What do the young people want from this trip?" rows={2} className="text-xs" />
          </div>

          <div>
            <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Emergency plan</label>
            <Textarea value={form.emergency_plan} onChange={(e) => setForm((p) => ({ ...p, emergency_plan: e.target.value }))} placeholder="Nearest A&E, return plan, medication arrangements..." rows={2} className="text-xs" />
          </div>

          <div>
            <label className="text-xs text-[var(--cs-text-muted)] font-medium mb-1 block">Notes</label>
            <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any additional notes..." rows={2} className="text-xs" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!form.title.trim() || !form.destination.trim() || !form.start_date} className="bg-blue-600 hover:bg-blue-700 text-white">
            Create Trip Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function HolidayPlanningPage() {
  const { data: raw, isLoading } = useTripPlans();
  const createMut = useCreateTripPlan();
  const trips = useMemo(() => raw?.data ?? [], [raw]);

  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "budget" | "rating">("date");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // ── Summary stats ────────────────────────────────────────────────
  const upcomingCount = useMemo(
    () => trips.filter((t) => ["planning", "approved", "ready", "in_progress"].includes(t.status) && new Date(t.start_date) >= new Date()).length,
    [trips],
  );

  const completedThisYear = useMemo(
    () => trips.filter((t) => t.status === "completed").length,
    [trips],
  );

  const totalSpend = useMemo(
    () => trips.reduce((sum, t) => {
      const actual = t.budget.reduce((s, b) => s + (b.actual ?? 0), 0);
      return sum + (actual > 0 ? actual : 0);
    }, 0),
    [trips],
  );

  const avgRating = useMemo(() => {
    const rated = trips.filter((t) => t.post_trip_evaluation);
    if (rated.length === 0) return 0;
    return +(rated.reduce((s, t) => s + (t.post_trip_evaluation?.rating ?? 0), 0) / rated.length).toFixed(1);
  }, [trips]);

  // ── Upcoming trips (next 3 future trips) ─────────────────────────
  const upcomingTrips = useMemo(
    () => trips
      .filter((t) => ["planning", "approved", "ready"].includes(t.status) && new Date(t.start_date) >= new Date())
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 3),
    [trips],
  );

  // ── Budget overview ──────────────────────────────────────────────
  const budgetByType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of trips) {
      const actual = t.budget.reduce((s, b) => s + (b.actual ?? 0), 0);
      if (actual > 0) {
        map[t.trip_type] = (map[t.trip_type] || 0) + actual;
      }
    }
    return map;
  }, [trips]);

  const completedTrips = useMemo(() => trips.filter((t) => t.status === "completed"), [trips]);
  const avgPerTrip = completedTrips.length > 0 ? Math.round(totalSpend / completedTrips.length) : 0;

  // ── Filter + sort ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = trips;

    if (typeFilter !== "all") list = list.filter((t) => t.trip_type === typeFilter);
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        t.young_people.some((yp) => getYPName(yp.child_id).toLowerCase().includes(q)) ||
        t.staff_assigned.some((s) => getStaffName(s.staff_id).toLowerCase().includes(q)),
      );
    }

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "budget": return b.total_budget - a.total_budget;
        case "rating":
          return (b.post_trip_evaluation?.rating ?? 0) - (a.post_trip_evaluation?.rating ?? 0);
        default: return b.start_date.localeCompare(a.start_date);
      }
    });

    return list;
  }, [trips, typeFilter, statusFilter, search, sortBy]);

  const handleAddTrip = (data: Partial<TripPlan>) => {
    createMut.mutate(data, {
      onSuccess: () => {
        toast.success("Trip plan created");
        setShowNew(false);
      },
    });
  };

  if (isLoading) {
    return (
      <PageShell title="Holiday & Trip Planning" subtitle="Loading…">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Holiday & Trip Planning"
      subtitle="Planned outings, day trips, holidays, and residential trips for young people"
      caraContext={{ pageTitle: "Holiday & Trip Planning", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={TRIP_EXPORT_COLS} filename="holiday-trip-planning" />
          <PrintButton title="Holiday & Trip Planning" />
          <Button size="sm" onClick={() => setShowNew(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />Plan Trip
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="holiday-planning-content" className="space-y-5 animate-fade-in">

        {/* ── Summary strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Upcoming Trips", value: upcomingCount, icon: Calendar, colour: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
            { label: "Completed This Year", value: completedThisYear, icon: CheckCircle2, colour: "text-green-600", bg: "bg-green-50 border-green-100" },
            { label: "Total Spend", value: `£${totalSpend}`, icon: MapPin, colour: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
            { label: "Avg Rating", value: avgRating > 0 ? `${avgRating} ★` : "—", icon: Clock, colour: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
          ].map(({ label, value, icon: Icon, colour, bg }) => (
            <div key={label} className={cn("rounded-2xl border p-4 text-center", bg)}>
              <Icon className={cn("h-4 w-4 mx-auto mb-1", colour)} />
              <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Upcoming trips timeline ────────────────────────────────── */}
        {upcomingTrips.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[var(--cs-text-secondary)] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Upcoming Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTrips.map((trip) => {
                  const daysAway = Math.ceil((new Date(trip.start_date).getTime() - Date.now()) / 86400000);
                  const statusCfg = STATUS_CONFIG[trip.status];
                  const allApproved = trip.manager_approval && trip.social_worker_approval.every((a) => a.approved);
                  const allConsent = trip.young_people.every((yp) => yp.consent_obtained);

                  return (
                    <div key={trip.id} className="flex items-center gap-3 rounded-xl border border-[var(--cs-border)] bg-white p-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-blue-700 leading-none">{daysAway}</span>
                        <span className="text-[9px] text-blue-500 font-medium">days</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[var(--cs-navy)]">{trip.title}</span>
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", statusCfg.cls)}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                          {trip.destination} — {trip.start_date}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {allApproved ? (
                            <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                              <CheckCircle2 className="h-3 w-3" />All approved
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                              <AlertTriangle className="h-3 w-3" />Approvals pending
                            </span>
                          )}
                          {allConsent ? (
                            <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                              <CheckCircle2 className="h-3 w-3" />Consent complete
                            </span>
                          ) : (
                            <span className="text-[10px] text-red-600 flex items-center gap-0.5">
                              <AlertTriangle className="h-3 w-3" />Consent pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Filter bar ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trips, destinations, staff, YP..." className="pl-9 h-8 text-xs" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] text-[var(--cs-text-secondary)] focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
              >
                <option value="all">All trip types</option>
                {(Object.entries(TRIP_TYPE_CONFIG) as [TripType, { label: string }][]).map(([k, cfg]) => (
                  <option key={k} value={k}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] text-[var(--cs-text-secondary)] focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
              >
                <option value="all">All statuses</option>
                {(Object.entries(STATUS_CONFIG) as [TripStatus, { label: string }][]).map(([k, cfg]) => (
                  <option key={k} value={k}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-lg border border-[var(--cs-border)] bg-white px-2.5 py-1 text-[11px] text-[var(--cs-text-secondary)] focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
              >
                <option value="date">Date (newest)</option>
                <option value="budget">Budget (highest)</option>
                <option value="rating">Rating (highest)</option>
              </select>
            </div>
          </div>
        </div>

        {(search || typeFilter !== "all" || statusFilter !== "all") && (
          <p className="text-xs text-[var(--cs-text-muted)]">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {search && <span> matching &ldquo;{search}&rdquo;</span>}
          </p>
        )}

        {/* ── Trip cards ─────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[var(--cs-text-muted)]">
            <MapPin className="h-10 w-10 text-[var(--cs-text-gentle)] mx-auto mb-3" />
            <p className="text-sm font-medium">
              {search ? `No trips match "${search}"` : "No trips planned yet"}
            </p>
            <p className="text-xs text-[var(--cs-text-muted)] mt-1">Plan a trip to start building your enrichment evidence.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}

        {/* ── Budget overview card ───────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[var(--cs-text-secondary)]">Budget Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">£{totalSpend}</div>
                <div className="text-[10px] text-[var(--cs-text-muted)]">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">£{avgPerTrip}</div>
                <div className="text-[10px] text-[var(--cs-text-muted)]">Avg Per Trip</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{completedTrips.length}</div>
                <div className="text-[10px] text-[var(--cs-text-muted)]">Trips Completed</div>
              </div>
            </div>
            {Object.keys(budgetByType).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest">Spend by Type</p>
                {(Object.entries(budgetByType) as [TripType, number][]).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", TRIP_TYPE_CONFIG[type]?.cls)}>
                      {TRIP_TYPE_CONFIG[type]?.label ?? type}
                    </Badge>
                    <span className="font-medium text-[var(--cs-text-secondary)]">£{amount}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Regulatory note ────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--cs-text-muted)]">
          <span className="font-semibold text-[var(--cs-text-secondary)]">Regulatory Basis — </span>
          Children&apos;s Homes (England) Regulations 2015, Regulation 13 (Engagement in Activities):
          The registered person must promote opportunities for each child to engage in and benefit from
          a range of activities. All trips and holidays for looked-after children require social worker
          consent (Regulation 5, Delegated Authority). Risk assessments must be completed for all outings.
          Staffing ratios should be determined by the individual needs of the young people, the nature
          of the activity, and the location. Post-trip evaluations and children&apos;s views evidence
          child-centred practice and feed into care planning.
        </div>
      </div>

      <NewTripDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onSave={handleAddTrip}
      />
      <CareEventsPanel
        title="Care Events — Activities"
        category="activity"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Holiday & Trip Planning — holiday consent, LA approval, passport, travel insurance, health needs abroad, risk assessment, cultural experience, aspirations, care plan evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
