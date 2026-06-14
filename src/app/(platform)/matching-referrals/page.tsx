"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown, ChevronUp, UserPlus, CheckCircle2, XCircle,
  Clock, AlertTriangle, Plus, ArrowUpDown, Search, Scale, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useMatchingReferrals, useCreateMatchingReferral } from "@/hooks/use-matching-referrals";
import type { MatchingReferral, ReferralStatus, MatchScore, ImpactOnCurrent, MatchDomain } from "@/types/extended";
import { REFERRAL_STATUS_LABEL, MATCH_SCORE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── UI metadata ──────────────────────────────────────────────────────── */

const STATUS_META: Record<ReferralStatus, { label: string; colour: string }> = {
  received:    { label: "Received",    colour: "bg-gray-100 text-gray-700" },
  shortlisted: { label: "Shortlisted", colour: "bg-blue-100 text-blue-700" },
  assessment:  { label: "Assessment",  colour: "bg-purple-100 text-purple-700" },
  panel:       { label: "Panel",       colour: "bg-amber-100 text-amber-700" },
  accepted:    { label: "Accepted",    colour: "bg-green-100 text-green-700" },
  declined:    { label: "Declined",    colour: "bg-red-100 text-red-700" },
  withdrawn:   { label: "Withdrawn",   colour: "bg-gray-100 text-gray-500" },
};

const MATCH_META: Record<MatchScore, { label: string; colour: string }> = {
  strong:     { label: "Strong Match",   colour: "bg-green-100 text-green-700" },
  moderate:   { label: "Moderate Match", colour: "bg-amber-100 text-amber-700" },
  weak:       { label: "Weak Match",     colour: "bg-orange-100 text-orange-700" },
  unsuitable: { label: "Unsuitable",     colour: "bg-red-100 text-red-700" },
};

const RISK_COLOUR: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

export default function MatchingReferralsPage() {
  const { data: res, isLoading } = useMatchingReferrals();
  const data: MatchingReferral[] = res?.data ?? [];

  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMatch, setFilterMatch] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const createReferral = useCreateMatchingReferral();
  const [mrForm, setMrForm] = useState({ child_name: "", age: "", gender: "", local_authority: "", social_worker: "", placement_type: "", presenting_needs: "", risk_factors: "" });
  const setMR = (k: string, v: unknown) => setMrForm((p) => ({ ...p, [k]: v }));

  const handleAddReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mrForm.child_name.trim()) { toast.error("Child name is required."); return; }
    await createReferral.mutateAsync({ child_name: mrForm.child_name.trim(), age: parseInt(mrForm.age) || 0, gender: mrForm.gender, local_authority: mrForm.local_authority.trim(), social_worker: mrForm.social_worker.trim(), referral_date: new Date().toISOString().slice(0, 10), status: "received", assigned_to: "", overall_match: "moderate", match_domains: [], impact_on_current: [], strengths: [], concerns: [], conditions: [], decision_date: null, decision_by: null, decision_rationale: "", placement_type: mrForm.placement_type, presenting_needs: mrForm.presenting_needs.split("\n").filter(Boolean), risk_factors: mrForm.risk_factors.split("\n").filter(Boolean), created_at: new Date().toISOString() });
    toast.success("Referral added.");
    setMrForm({ child_name: "", age: "", gender: "", local_authority: "", social_worker: "", placement_type: "", presenting_needs: "", risk_factors: "" });
    setShowDialog(false);
  };

  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter((r) => !["declined", "withdrawn", "accepted"].includes(r.status)).length,
    accepted: data.filter((r) => r.status === "accepted").length,
    declined: data.filter((r) => r.status === "declined").length,
    avgAge: data.length > 0 ? Math.round(data.reduce((s, r) => s + r.age, 0) / data.length) : 0,
  }), [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (filterMatch !== "all") list = list.filter((r) => r.overall_match === filterMatch);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.child_name.toLowerCase().includes(q) || r.local_authority.toLowerCase().includes(q) || r.presenting_needs.join(" ").toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":  return a.child_name.localeCompare(b.child_name);
        case "match": return Object.keys(MATCH_META).indexOf(a.overall_match) - Object.keys(MATCH_META).indexOf(b.overall_match);
        case "age":   return a.age - b.age;
        default:      return b.referral_date.localeCompare(a.referral_date);
      }
    });
    return list;
  }, [data, filterStatus, filterMatch, search, sortBy]);

  const exportCols: ExportColumn<MatchingReferral>[] = [
    { header: "Child Name", accessor: (r) => r.child_name },
    { header: "Age", accessor: (r) => String(r.age) },
    { header: "Gender", accessor: (r) => r.gender },
    { header: "Local Authority", accessor: (r) => r.local_authority },
    { header: "Social Worker", accessor: (r) => r.social_worker },
    { header: "Referral Date", accessor: (r) => r.referral_date },
    { header: "Status", accessor: (r) => STATUS_META[r.status]?.label ?? r.status },
    { header: "Overall Match", accessor: (r) => MATCH_META[r.overall_match]?.label ?? r.overall_match },
    { header: "Placement Type", accessor: (r) => r.placement_type },
    { header: "Presenting Needs", accessor: (r) => r.presenting_needs.join("; ") },
    { header: "Risk Factors", accessor: (r) => r.risk_factors.join("; ") },
    { header: "Strengths", accessor: (r) => r.strengths.join("; ") },
    { header: "Concerns", accessor: (r) => r.concerns.join("; ") },
    { header: "Decision Rationale", accessor: (r) => r.decision_rationale },
  ];

  if (isLoading) return <PageShell title="Matching & Referrals" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Matching & Referrals"
      subtitle="Reg 14 — Referral assessment, matching analysis and placement decisions"
      caraContext={{ pageTitle: "Matching & Referrals", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="matching-referrals" />
          <PrintButton title="Matching & Referrals" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Referral
          </button>
          <CaraStudioQuickActionButton context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Referrals", v: stats.total, icon: UserPlus, c: "text-blue-600" },
            { l: "Active", v: stats.active, icon: Clock, c: "text-amber-600" },
            { l: "Accepted", v: stats.accepted, icon: CheckCircle2, c: "text-green-600" },
            { l: "Declined", v: stats.declined, icon: XCircle, c: "text-red-600" },
            { l: "Avg Age", v: stats.avgAge, icon: UserPlus, c: "text-purple-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search referrals…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.keys(STATUS_META) as ReferralStatus[]).map((k) => <SelectItem key={k} value={k}>{STATUS_META[k].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterMatch} onValueChange={setFilterMatch}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Match" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Matches</SelectItem>
              {(Object.keys(MATCH_META) as MatchScore[]).map((k) => <SelectItem key={k} value={k}>{MATCH_META[k].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="date">Referral Date</option>
              <option value="name">Name</option>
              <option value="match">Match Score</option>
              <option value="age">Age</option>
            </select>
          </div>
        </div>

        {filtered.map((ref) => (
          <div key={ref.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === ref.id ? null : ref.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{ref.child_name}</h3>
                    <span className="text-xs text-muted-foreground">Age {ref.age} · {ref.gender}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[ref.status].colour)}>{STATUS_META[ref.status].label}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", MATCH_META[ref.overall_match].colour)}>{MATCH_META[ref.overall_match].label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ref.local_authority} · {ref.placement_type} · Referred {ref.referral_date}</p>
                </div>
              </div>
              {expanded === ref.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === ref.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Social Worker:</span> {ref.social_worker}</div>
                  <div><span className="text-muted-foreground">Assigned To:</span> {getStaffName(ref.assigned_to)}</div>
                  <div><span className="text-muted-foreground">Placement Type:</span> {ref.placement_type}</div>
                  {ref.decision_date && <div><span className="text-muted-foreground">Decision Date:</span> {ref.decision_date}</div>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Presenting Needs</h4>
                    <div className="flex flex-wrap gap-1">{ref.presenting_needs.map((n: string, i: number) => <span key={i} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{n}</span>)}</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3">
                    <h4 className="text-sm font-semibold text-red-800 mb-2">Risk Factors</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs text-red-900">{ref.risk_factors.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Matching Analysis</h4>
                  <div className="space-y-2">
                    {ref.match_domains.map((md: MatchDomain, i: number) => (
                      <div key={i} className="rounded border p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{md.domain}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", MATCH_META[md.score].colour)}>{MATCH_META[md.score].label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{md.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Impact on Current Residents</h4>
                  <div className="space-y-2">
                    {ref.impact_on_current.map((ic: ImpactOnCurrent, i: number) => (
                      <div key={i} className="rounded border p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{getYPName(ic.young_person_id)}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", RISK_COLOUR[ic.risk])}>{ic.risk.charAt(0).toUpperCase() + ic.risk.slice(1)} Risk</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{ic.detail}</p>
                        {ic.mitigations.length > 0 && (
                          <ul className="list-disc list-inside text-xs text-muted-foreground">
                            {ic.mitigations.map((m: string, j: number) => <li key={j}>{m}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-green-50 p-3">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-900">{ref.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-2">Concerns</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-900">{ref.concerns.map((c: string, i: number) => <li key={i}>{c}</li>)}</ul>
                  </div>
                </div>

                {ref.conditions.length > 0 && (
                  <div className="rounded-lg bg-purple-50 p-3">
                    <h4 className="text-sm font-semibold text-purple-800 mb-2">Conditions for Acceptance</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-purple-900">{ref.conditions.map((c: string, i: number) => <li key={i}>{c}</li>)}</ol>
                  </div>
                )}

                <div className="rounded-lg bg-gray-50 border p-3">
                  <h4 className="text-sm font-semibold mb-1">Decision / Rationale</h4>
                  <p className="text-sm text-muted-foreground">{ref.decision_rationale}</p>
                  {ref.decision_by && <p className="text-xs text-muted-foreground mt-1">Decision by: {getStaffName(ref.decision_by)} on {ref.decision_date}</p>}
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 14 — Admissions</strong> — Before admitting a child, the registered person must assess whether the placement is suitable, including impact on existing children. This tool documents the matching process, impact assessments, and decision rationale required by regulation.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Referral</DialogTitle></DialogHeader>
          <form onSubmit={handleAddReferral} className="grid gap-3 py-2">
            <input placeholder="Child name *" className="rounded border px-3 py-2 text-sm" value={mrForm.child_name} onChange={(e) => setMR("child_name", e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Age" className="rounded border px-3 py-2 text-sm" value={mrForm.age} onChange={(e) => setMR("age", e.target.value)} />
              <select className="rounded border px-3 py-2 text-sm" value={mrForm.gender} onChange={(e) => setMR("gender", e.target.value)}><option value="">Gender…</option><option value="Male">Male</option><option value="Female">Female</option><option value="Non-binary">Non-binary</option></select>
            </div>
            <input placeholder="Local Authority" className="rounded border px-3 py-2 text-sm" value={mrForm.local_authority} onChange={(e) => setMR("local_authority", e.target.value)} />
            <input placeholder="Social Worker name" className="rounded border px-3 py-2 text-sm" value={mrForm.social_worker} onChange={(e) => setMR("social_worker", e.target.value)} />
            <select className="rounded border px-3 py-2 text-sm" value={mrForm.placement_type} onChange={(e) => setMR("placement_type", e.target.value)}><option value="">Placement type…</option><option value="Long-term residential">Long-term residential</option><option value="Emergency placement">Emergency placement</option><option value="Planned move from foster care">Planned move from foster care</option><option value="Step-down from secure">Step-down from secure</option></select>
            <textarea placeholder="Presenting needs (one per line)" rows={3} className="rounded border px-3 py-2 text-sm" value={mrForm.presenting_needs} onChange={(e) => setMR("presenting_needs", e.target.value)} />
            <textarea placeholder="Risk factors (one per line)" rows={2} className="rounded border px-3 py-2 text-sm" value={mrForm.risk_factors} onChange={(e) => setMR("risk_factors", e.target.value)} />
            <DialogFooter>
              <button type="button" onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={createReferral.isPending} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">{createReferral.isPending ? "Saving…" : "Add Referral"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Professional Contact"
        category="professional_contact"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Matching & Referrals — placement referrals, matching assessments, capacity, compatibility, placement planning, admissions, Ofsted evidence, placement stability, Reg 45"
        recordType="placement_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
