"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ArrowUpDown,
  Search,
  FileText,
  CalendarCheck,
  AlertTriangle,
  Users,
  Timer,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useReferralTrackerRecords, useCreateReferralTrackerRecord } from "@/hooks/use-referral-tracker-records";
import type { ReferralTrackerRecord, ReferralTrackerStatus } from "@/types/extended";
import { REFERRAL_TRACKER_STATUS_LABEL } from "@/types/extended";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local colour map ────────────────────────────────────────────────── */

const STATUS_META: Record<ReferralTrackerStatus, { colour: string }> = {
  received:         { colour: "bg-gray-100 text-gray-700" },
  screening:        { colour: "bg-blue-100 text-blue-700" },
  under_assessment: { colour: "bg-purple-100 text-purple-700" },
  matching_panel:   { colour: "bg-amber-100 text-amber-700" },
  accepted:         { colour: "bg-green-100 text-green-700" },
  declined:         { colour: "bg-red-100 text-red-700" },
  withdrawn:        { colour: "bg-gray-100 text-gray-500" },
  waitlisted:       { colour: "bg-indigo-100 text-indigo-700" },
};

/* ── page ────────────────────────────────────────────────────────────── */

export default function ReferralTrackerPage() {
  const { data: records = [], isLoading } = useReferralTrackerRecords();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const createReferral = useCreateReferralTrackerRecord();
  const [rfForm, setRfForm] = useState({ child_ref: "", age: "", gender: "male", referring_authority: "", social_worker_name: "", reason: "", referral_date: new Date().toISOString().slice(0, 10) });
  const setRF = (k: string, v: unknown) => setRfForm((p) => ({ ...p, [k]: v }));

  const handleSaveReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfForm.referring_authority.trim()) { toast.error("Referring authority is required."); return; }
    await createReferral.mutateAsync({ child_ref: rfForm.child_ref.trim() || `REF-${Date.now()}`, age: parseInt(rfForm.age) || 0, gender: rfForm.gender, referring_authority: rfForm.referring_authority.trim(), social_worker_name: rfForm.social_worker_name.trim(), referral_date: rfForm.referral_date, status: "received" as ReferralTrackerStatus, reason_for_placement: rfForm.reason.trim(), referral_documents_received: false, impact_assessment_completed: false, matching_panel_date: null, matching_panel_outcome: null, decision_date: null, admission_date: null, decline_reason: null, notes: "", timeline: [] });
    toast.success("Referral added.");
    setRfForm({ child_ref: "", age: "", gender: "male", referring_authority: "", social_worker_name: "", reason: "", referral_date: new Date().toISOString().slice(0, 10) });
    setShowNew(false);
  };
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  /* ── summary stats ─────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = records.length;
    const accepted = records.filter((r) => r.status === "accepted").length;
    const declined = records.filter((r) => r.status === "declined").length;
    const acceptedPct = total > 0 ? Math.round((accepted / total) * 100) : 0;
    const declinedPct = total > 0 ? Math.round((declined / total) * 100) : 0;

    const withDecision = records.filter((r) => r.decision_date && r.referral_date);
    const avgDays =
      withDecision.length > 0
        ? Math.round(
            withDecision.reduce((sum, r) => {
              const start = new Date(r.referral_date).getTime();
              const end = new Date(r.decision_date!).getTime();
              return sum + (end - start) / (1000 * 60 * 60 * 24);
            }, 0) / withDecision.length
          )
        : 0;

    return { total, accepted, declined, acceptedPct, declinedPct, avgDays };
  }, [records]);

  /* ── filtered / sorted ─────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.child_ref.toLowerCase().includes(q) ||
          r.referring_authority.toLowerCase().includes(q) ||
          r.social_worker_name.toLowerCase().includes(q) ||
          r.reason_for_placement.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_ref.localeCompare(b.child_ref);
        case "age":
          return a.age - b.age;
        case "status":
          return (
            Object.keys(STATUS_META).indexOf(a.status) -
            Object.keys(STATUS_META).indexOf(b.status)
          );
        default:
          return b.referral_date.localeCompare(a.referral_date);
      }
    });
    return list;
  }, [records, filterStatus, search, sortBy]);

  /* ── export ────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<ReferralTrackerRecord>[] = [
    { header: "Child Ref", accessor: (r) => r.child_ref },
    { header: "Age", accessor: (r) => String(r.age) },
    { header: "Gender", accessor: (r) => r.gender },
    { header: "Referring Authority", accessor: (r) => r.referring_authority },
    { header: "Social Worker", accessor: (r) => r.social_worker_name },
    { header: "Referral Date", accessor: (r) => r.referral_date },
    { header: "Status", accessor: (r) => REFERRAL_TRACKER_STATUS_LABEL[r.status] },
    { header: "Reason for Placement", accessor: (r) => r.reason_for_placement },
    { header: "Docs Received", accessor: (r) => r.referral_documents_received ? "Yes" : "No" },
    { header: "Impact Assessment", accessor: (r) => r.impact_assessment_completed ? "Completed" : "Pending" },
    { header: "Panel Date", accessor: (r) => r.matching_panel_date ?? "N/A" },
    { header: "Panel Outcome", accessor: (r) => r.matching_panel_outcome ?? "N/A" },
    { header: "Decision Date", accessor: (r) => r.decision_date ?? "N/A" },
    { header: "Admission Date", accessor: (r) => r.admission_date ?? "N/A" },
    { header: "Decline Reason", accessor: (r) => r.decline_reason ?? "N/A" },
    { header: "Notes", accessor: (r) => r.notes },
  ];

  if (isLoading) {
    return (
      <PageShell title="Referral Tracker" subtitle="Tracking incoming placement referrals from initial contact through to matching panel decision and outcome">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Referral Tracker"
      subtitle="Tracking incoming placement referrals from initial contact through to matching panel decision and outcome"
      ariaContext={{ pageTitle: "Referral Tracker", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="referral-tracker" />
          <PrintButton title="Referral Tracker" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Referral
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { l: "Total Referrals (12 mo)", v: stats.total, icon: UserPlus, c: "text-blue-600" },
            { l: "Accepted", v: `${stats.accepted} (${stats.acceptedPct}%)`, icon: CheckCircle2, c: "text-green-600" },
            { l: "Declined", v: `${stats.declined} (${stats.declinedPct}%)`, icon: XCircle, c: "text-red-600" },
            { l: "Avg Decision Time", v: `${stats.avgDays} days`, icon: Timer, c: "text-amber-600" },
            { l: "Active / In Progress", v: records.filter((r) => ["received", "screening", "under_assessment", "matching_panel", "waitlisted"].includes(r.status)).length, icon: Clock, c: "text-purple-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border bg-white p-4 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* ── filters ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search referrals..."
              className="w-full rounded-md border pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.keys(REFERRAL_TRACKER_STATUS_LABEL) as ReferralTrackerStatus[]).map((k) => (
                <SelectItem key={k} value={k}>{REFERRAL_TRACKER_STATUS_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="date">Referral Date</option>
              <option value="name">Child Ref</option>
              <option value="age">Age</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* ── referral cards ─────────────────────────────────────── */}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No referrals match your filters.</div>
        )}

        {filtered.map((ref) => {
          const isExpanded = expandedId === ref.id;

          return (
            <div key={ref.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : ref.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{ref.child_ref}</h3>
                      <span className="text-xs text-muted-foreground">
                        Age {ref.age} · {ref.gender}
                      </span>
                      <Badge className={cn("text-xs", STATUS_META[ref.status].colour)}>
                        {REFERRAL_TRACKER_STATUS_LABEL[ref.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ref.referring_authority} · {ref.reason_for_placement} · Referred {ref.referral_date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ref.referral_documents_received && (
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                      Docs
                    </Badge>
                  )}
                  {ref.impact_assessment_completed && (
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                      IA Done
                    </Badge>
                  )}
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t bg-slate-50 p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Social Worker:</span>{" "}
                      {ref.social_worker_name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reason:</span>{" "}
                      {ref.reason_for_placement}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Documents:</span>{" "}
                      <span className={ref.referral_documents_received ? "text-green-700" : "text-amber-600"}>
                        {ref.referral_documents_received ? "Received" : "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Impact Assessment:</span>{" "}
                      <span className={ref.impact_assessment_completed ? "text-green-700" : "text-amber-600"}>
                        {ref.impact_assessment_completed ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </div>

                  {(ref.matching_panel_date || ref.matching_panel_outcome) && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-green-700" />
                        <p className="text-sm font-medium text-green-800">Matching Panel</p>
                      </div>
                      {ref.matching_panel_date && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Date:</span> {ref.matching_panel_date}
                        </p>
                      )}
                      {ref.matching_panel_outcome && (
                        <p className="text-sm mt-1">{ref.matching_panel_outcome}</p>
                      )}
                    </div>
                  )}

                  {(ref.decision_date || ref.admission_date) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ref.decision_date && (
                        <div className="rounded-lg bg-white border p-3">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">Decision Date</p>
                          <p className="text-sm font-medium">{ref.decision_date}</p>
                        </div>
                      )}
                      {ref.admission_date && (
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarCheck className="h-4 w-4 text-blue-700" />
                            <p className="text-xs text-blue-800 font-medium">Planned Admission</p>
                          </div>
                          <p className="text-sm font-medium">{ref.admission_date}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {ref.decline_reason && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-700" />
                        <p className="text-sm font-medium text-red-800">Reason for Decline</p>
                      </div>
                      <p className="text-sm text-red-900">{ref.decline_reason}</p>
                    </div>
                  )}

                  {ref.notes && (
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                      <p className="text-sm">{ref.notes}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold mb-2">Referral Timeline</p>
                    <div className="space-y-2">
                      {ref.timeline.map((evt, idx) => (
                        <div key={idx} className="flex gap-3 text-sm">
                          <div className="flex flex-col items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                            {idx < ref.timeline.length - 1 && (
                              <div className="w-px flex-1 bg-blue-200" />
                            )}
                          </div>
                          <div className="pb-3">
                            <p className="text-xs text-muted-foreground">{evt.date}</p>
                            <p className="text-sm">{evt.event}</p>
                            <p className="text-xs text-muted-foreground">
                              By: {getStaffName(evt.by)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ── regulatory note ────────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
          <p>
            <strong>Regulation 14 (Admissions):</strong> Before admitting a child, the registered person
            must assess whether the child&apos;s placement in the home is in the best interests of the
            child and each child already living there. All referrals must be subject to a thorough
            matching and impact assessment process before any admission decision is made.
          </p>
          <p>
            <strong>Quality Standards (Standard 5 — Enjoying and Achieving):</strong> Matching decisions
            must consider the child&apos;s education, health, emotional and social needs alongside the
            impact on existing placements and the home&apos;s Statement of Purpose.
          </p>
          <p>
            <strong>Ofsted Expectation:</strong> Inspectors will examine the home&apos;s referral and
            matching process, including evidence of impact assessments, panel decisions, and the rationale
            for accepting or declining referrals. Homes should demonstrate that admissions are carefully
            planned and that children are only placed where their needs can be met.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Admissions & Referrals"
        category="professional_contact"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Referral Tracker — placement referrals, matching requests, commissioning, referral outcomes, placement decisions, matching criteria, new admissions pipeline, Annex A evidence"
        recordType="placement_plan"
        className="mt-6"
      />
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Referral</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveReferral} className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Child Ref</Label><Input className="mt-1" placeholder="e.g. REF-001" value={rfForm.child_ref} onChange={(e) => setRF("child_ref", e.target.value)} /></div>
              <div><Label>Age</Label><Input type="number" className="mt-1" placeholder="e.g. 14" value={rfForm.age} onChange={(e) => setRF("age", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Gender</Label><Select value={rfForm.gender} onValueChange={(v) => setRF("gender", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div><Label>Referral Date</Label><Input type="date" className="mt-1" value={rfForm.referral_date} onChange={(e) => setRF("referral_date", e.target.value)} /></div>
            </div>
            <div><Label>Referring Authority *</Label><Input className="mt-1" placeholder="e.g. Essex County Council" value={rfForm.referring_authority} onChange={(e) => setRF("referring_authority", e.target.value)} /></div>
            <div><Label>Social Worker Name</Label><Input className="mt-1" placeholder="Name of allocated social worker" value={rfForm.social_worker_name} onChange={(e) => setRF("social_worker_name", e.target.value)} /></div>
            <div><Label>Reason for Placement</Label><Textarea className="mt-1" rows={3} placeholder="Brief reason for placement referral" value={rfForm.reason} onChange={(e) => setRF("reason", e.target.value)} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={createReferral.isPending}>{createReferral.isPending ? "Saving…" : "Add Referral"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
