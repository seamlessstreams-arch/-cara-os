"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Shield, ShieldCheck, Heart, Eye, BookOpen, Users, Sparkles,
  CheckCircle2, AlertCircle, GraduationCap, FileText, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useMedicationNearMisses } from "@/hooks/use-medication-near-misses";
import type { MedicationNearMiss, NearMissType, NearMissRiskGrade } from "@/types/extended";
import { NEAR_MISS_TYPE_LABEL, NEAR_MISS_RISK_GRADE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── UI metadata ──────────────────────────────────────────────────────── */

const TYPE_CONFIG: Record<NearMissType, { color: string; bg: string; border: string }> = {
  wrong_medication_selected:       { color: "text-rose-700",   bg: "bg-rose-50",   border: "border-rose-200"   },
  wrong_dose_calculated:           { color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  wrong_time:                      { color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200"  },
  missed_dose_almost_given_late:   { color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  allergy_nearly_missed:           { color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200"    },
  expired_medication_caught:       { color: "text-stone-700",  bg: "bg-stone-100", border: "border-stone-200"  },
  witness_procedure_not_followed:  { color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
  recording_error:                 { color: "text-[var(--cs-text-secondary)]",  bg: "bg-slate-100", border: "border-[var(--cs-border)]"  },
  storage_issue:                   { color: "text-teal-700",   bg: "bg-teal-50",   border: "border-teal-200"   },
};

const RISK_CONFIG: Record<NearMissRiskGrade, { color: string; bg: string; border: string }> = {
  low:      { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  medium:   { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  high:     { color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200"  },
  critical: { color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
};

function formatDate(s: string): string {
  if (!s) return "—";
  return new Date(s + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

export default function MedicationNearMissLogPage() {
  const { data: res, isLoading } = useMedicationNearMisses();
  const records: MedicationNearMiss[] = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "risk">("newest");

  const filtered = useMemo(() => {
    let list = [...records];
    if (typeFilter !== "all") list = list.filter((r) => r.near_miss_type === typeFilter);
    if (riskFilter !== "all") list = list.filter((r) => r.risk_grade === riskFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.what_nearly_happened.toLowerCase().includes(q) ||
        r.how_caught.toLowerCase().includes(q) ||
        NEAR_MISS_TYPE_LABEL[r.near_miss_type].toLowerCase().includes(q) ||
        getYPName(r.child_id).toLowerCase().includes(q) ||
        getStaffName(r.reported_by).toLowerCase().includes(q)
      );
    }
    const RISK_ORDER: Record<NearMissRiskGrade, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    switch (sortBy) {
      case "newest": list.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "oldest": list.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "risk": list.sort((a, b) => RISK_ORDER[a.risk_grade] - RISK_ORDER[b.risk_grade]); break;
    }
    return list;
  }, [records, typeFilter, riskFilter, search, sortBy]);

  const stats = useMemo(() => {
    const ninetyDaysAgo = d(-90);
    const thisQuarter = records.filter((r) => r.date >= ninetyDaysAgo).length;
    const typeCounts = records.reduce<Record<string, number>>((acc, r) => { acc[r.near_miss_type] = (acc[r.near_miss_type] || 0) + 1; return acc; }, {});
    const mostCommon = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    const learningEmbedded = records.filter((r) => r.debrief_held && r.systemic_changes.length > 0).length;
    return {
      thisQuarter,
      mostCommonType: mostCommon ? NEAR_MISS_TYPE_LABEL[mostCommon[0] as NearMissType] : "—",
      mostCommonCount: mostCommon ? mostCommon[1] : 0,
      learningEmbedded,
      total: records.length,
      becameErrors: 0,
    };
  }, [records]);

  const exportColumns = useMemo<ExportColumn<MedicationNearMiss>[]>(() => [
    { header: "Date", accessor: (r) => r.date },
    { header: "Time", accessor: (r) => r.time },
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Reported By", accessor: (r) => getStaffName(r.reported_by) },
    { header: "Type", accessor: (r) => NEAR_MISS_TYPE_LABEL[r.near_miss_type] },
    { header: "Risk Grade", accessor: (r) => NEAR_MISS_RISK_GRADE_LABEL[r.risk_grade] },
    { header: "What Nearly Happened", accessor: (r) => r.what_nearly_happened },
    { header: "How Caught", accessor: (r) => r.how_caught },
    { header: "Contributing Factors", accessor: (r) => r.contributing_factors.join("; ") },
    { header: "Child Informed", accessor: (r) => r.child_informed ? "Yes" : "No" },
    { header: "Debrief Held", accessor: (r) => r.debrief_held ? `Yes (${r.debrief_date})` : "No" },
    { header: "Learning Points", accessor: (r) => r.learning_points.join("; ") },
    { header: "Systemic Changes", accessor: (r) => r.systemic_changes.join("; ") },
    { header: "Training Arising", accessor: (r) => r.training_arising.join("; ") },
    { header: "Policy Arising", accessor: (r) => r.policy_arising },
    { header: "Pattern Check", accessor: (r) => r.pattern_check },
    { header: "Pharmacist Notified", accessor: (r) => r.reported_to_pharmacist ? "Yes" : "No" },
    { header: "Shareable Anonymously", accessor: (r) => r.shareable_anonymously ? "Yes" : "No" },
  ], []);

  const hasFilters = search || typeFilter !== "all" || riskFilter !== "all";

  if (isLoading) return <PageShell title="Medication Near-Miss Log" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Medication Near-Miss Log"
      subtitle="Quality Standard 7 — blame-free reporting of medication catches"
      ariaContext={{ pageTitle: "Medication Near-Miss Log", sourceType: "medication" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Medication Near-Miss Log" />
          <ExportButton<MedicationNearMiss> data={filtered} columns={exportColumns} filename="medication-near-miss-log" />
          <AriaStudioQuickActionButton context={{ record_type: "medication", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card className="border-[var(--cs-border)]"><CardContent className="p-3"><div className="text-[10px] font-medium text-[var(--cs-text-muted)] uppercase tracking-wide flex items-center gap-1"><Eye className="h-3 w-3" />Near misses (quarter)</div><div className="text-2xl font-bold text-blue-600 mt-0.5">{stats.thisQuarter}</div><div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{stats.total} total on record</div></CardContent></Card>
        <Card className="border-[var(--cs-border)]"><CardContent className="p-3"><div className="text-[10px] font-medium text-[var(--cs-text-muted)] uppercase tracking-wide flex items-center gap-1"><Filter className="h-3 w-3" />Most common type</div><div className="text-sm font-semibold text-[var(--cs-navy)] mt-1 leading-tight">{stats.mostCommonType}</div><div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">{stats.mostCommonCount} occurrence{stats.mostCommonCount !== 1 ? "s" : ""}</div></CardContent></Card>
        <Card className="border-[var(--cs-border)]"><CardContent className="p-3"><div className="text-[10px] font-medium text-[var(--cs-text-muted)] uppercase tracking-wide flex items-center gap-1"><BookOpen className="h-3 w-3" />Learning embedded</div><div className="text-2xl font-bold text-[var(--cs-aria-gold)] mt-0.5">{stats.learningEmbedded}<span className="text-sm text-[var(--cs-text-muted)] font-normal">/{stats.total}</span></div><div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">debrief + systemic change</div></CardContent></Card>
        <Card className="border-emerald-200 bg-emerald-50/40"><CardContent className="p-3"><div className="text-[10px] font-medium text-emerald-700 uppercase tracking-wide flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Became errors</div><div className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.becameErrors}</div><div className="text-[10px] text-emerald-700/80 mt-0.5">zero reached the child</div></CardContent></Card>
      </div>

      <div className="mb-5 rounded-lg border border-[var(--cs-aria-gold-soft)] bg-gradient-to-r from-[var(--cs-aria-gold-bg)] to-blue-50 p-4 flex items-start gap-3">
        <div className="rounded-lg bg-[var(--cs-aria-gold-bg)] p-2 flex-shrink-0"><Heart className="h-5 w-5 text-[var(--cs-aria-gold)]" /></div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Psychological safety — blame-free reporting</h3>
            <Badge className="text-[9px] px-1.5 py-0 bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border border-[var(--cs-aria-gold-soft)]"><Sparkles className="h-2.5 w-2.5 mr-0.5" />Mature culture</Badge>
          </div>
          <p className="text-xs text-[var(--cs-navy)]/90 leading-relaxed">
            A near-miss is not a failure — it is a system working. Every record below is a moment a colleague chose to surface
            a catch rather than hide it, so the home gets safer for the young people who live here. Reporting near-misses is a
            recognised marker of safety-culture maturity. Staff who report are thanked, not blamed. We learn loudly so we never
            have to apologise quietly.
          </p>
          <p className="text-[11px] text-[var(--cs-aria-gold)]/80 leading-relaxed mt-1.5">
            <strong>If in doubt, report it.</strong> The cost of a logged near-miss is a debrief and a learning point. The
            cost of an unreported one is the next child harmed by the same gap.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search near-misses..." className="h-8 pl-8 text-xs" /></div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 text-xs w-[210px]"><Filter className="h-3 w-3 mr-1 text-[var(--cs-text-muted)]" /><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.keys(NEAR_MISS_TYPE_LABEL) as NearMissType[]).map((t) => (<SelectItem key={t} value={t}>{NEAR_MISS_TYPE_LABEL[t]}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="h-8 text-xs w-[140px]"><SelectValue placeholder="Risk" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Grades</SelectItem>
            {(Object.keys(NEAR_MISS_RISK_GRADE_LABEL) as NearMissRiskGrade[]).map((r) => (<SelectItem key={r} value={r}>{NEAR_MISS_RISK_GRADE_LABEL[r]}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="h-8 text-xs w-[150px]"><ArrowUpDown className="h-3 w-3 mr-1 text-[var(--cs-text-muted)]" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="risk">By risk grade</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (<button type="button" onClick={() => { setSearch(""); setTypeFilter("all"); setRiskFilter("all"); }} className="text-[11px] text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] underline-offset-2 hover:underline">Clear filters</button>)}
      </div>

      <p className="text-[11px] text-[var(--cs-text-muted)] mb-3">Showing {filtered.length} of {records.length} record{records.length !== 1 ? "s" : ""}</p>

      <div className="space-y-3">
        {filtered.length === 0 && (<div className="text-center py-12 text-sm text-[var(--cs-text-muted)]">No near-misses match the current filters.</div>)}

        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;
          const tCfg = TYPE_CONFIG[r.near_miss_type];
          const rCfg = RISK_CONFIG[r.risk_grade];

          return (
            <div key={r.id} className={cn("rounded-lg border bg-white transition-all", r.risk_grade === "critical" && "ring-1 ring-rose-200 border-rose-200", r.risk_grade === "high" && "border-orange-200")}>
              <button type="button" onClick={() => setExpandedId(isExpanded ? null : r.id)} className="w-full flex items-start gap-3 p-4 text-left">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 flex-shrink-0"><ShieldCheck className="h-4 w-4 text-emerald-600" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-medium text-[var(--cs-text-muted)]">{formatDate(r.date)}</span>
                    <span className="text-[10px] text-[var(--cs-text-muted)]">{r.time}</span>
                    <span className="text-xs font-semibold text-[var(--cs-navy)]">— {NEAR_MISS_TYPE_LABEL[r.near_miss_type]}</span>
                    <span className="text-[11px] text-[var(--cs-text-muted)]">({getYPName(r.child_id)})</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge className={cn("text-[10px] px-2 py-0 border", tCfg.bg, tCfg.color, tCfg.border)}>{NEAR_MISS_TYPE_LABEL[r.near_miss_type]}</Badge>
                    <Badge className={cn("text-[10px] px-2 py-0 border", rCfg.bg, rCfg.color, rCfg.border)}>Risk: {NEAR_MISS_RISK_GRADE_LABEL[r.risk_grade]}</Badge>
                    {r.debrief_held && (<Badge className="text-[10px] px-2 py-0 bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border border-[var(--cs-aria-gold-soft)]"><BookOpen className="h-2.5 w-2.5 mr-0.5" />Debriefed</Badge>)}
                    {r.systemic_changes.length > 0 && (<Badge className="text-[10px] px-2 py-0 bg-blue-50 text-blue-700 border border-blue-200">Systemic change</Badge>)}
                    {r.shareable_anonymously && (<Badge className="text-[10px] px-2 py-0 bg-emerald-50 text-emerald-700 border border-emerald-200"><Users className="h-2.5 w-2.5 mr-0.5" />Shareable</Badge>)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-[var(--cs-text-muted)] hidden sm:inline">Reported by {getStaffName(r.reported_by)}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-4">
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />What nearly happened</h4>
                    <p className="text-xs text-amber-900 leading-relaxed">{r.what_nearly_happened}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                    <h4 className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mb-1 flex items-center gap-1"><Shield className="h-3 w-3" />How it was caught</h4>
                    <p className="text-xs text-emerald-900 leading-relaxed">{r.how_caught}</p>
                  </div>
                  {r.contributing_factors.length > 0 && (
                    <div><h4 className="text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1.5">Contributing factors</h4><div className="flex flex-wrap gap-1">{r.contributing_factors.map((f, i) => (<Badge key={i} className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200">{f}</Badge>))}</div></div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-1 flex items-center gap-1"><Heart className="h-3 w-3" />Young person — {getYPName(r.child_id)}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-blue-700/80 mb-1">{r.child_informed ? (<><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Informed at the time</>) : (<><AlertCircle className="h-3 w-3 text-amber-600" /> Not informed</>)}</div>
                      <p className="text-xs text-blue-900 leading-relaxed">{r.child_response}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] p-3">
                      <h4 className="text-[11px] font-semibold text-[var(--cs-aria-gold)] uppercase tracking-wide mb-1 flex items-center gap-1"><Users className="h-3 w-3" />Staff emotional impact</h4>
                      <p className="text-xs text-[var(--cs-navy)] leading-relaxed">{r.staff_emotional_impact}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--cs-border)] bg-slate-50 p-3 flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-[var(--cs-text-muted)] flex-shrink-0" />
                    <div className="flex-1 text-xs text-[var(--cs-text-secondary)]">{r.debrief_held ? (<span><strong>Debrief held</strong> on {formatDate(r.debrief_date)} — outcomes captured below.</span>) : (<span className="text-amber-700"><strong>Debrief outstanding</strong> — schedule before next shift cycle.</span>)}</div>
                  </div>
                  {r.learning_points.length > 0 && (
                    <div><h4 className="text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1.5 flex items-center gap-1"><BookOpen className="h-3 w-3" />Learning points</h4><ul className="space-y-1">{r.learning_points.map((l, i) => (<li key={i} className="text-xs text-[var(--cs-text-secondary)] leading-relaxed flex gap-2"><span className="text-[var(--cs-aria-gold)] flex-shrink-0">•</span><span>{l}</span></li>))}</ul></div>
                  )}
                  {r.systemic_changes.length > 0 && (
                    <div className="rounded-lg bg-blue-50/60 border border-blue-200 p-3"><h4 className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-1.5">Systemic changes implemented</h4><ul className="space-y-1">{r.systemic_changes.map((s, i) => (<li key={i} className="text-xs text-blue-900 leading-relaxed flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0 mt-0.5" /><span>{s}</span></li>))}</ul></div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {r.training_arising.length > 0 && (
                      <div><h4 className="text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1.5 flex items-center gap-1"><GraduationCap className="h-3 w-3" />Training arising</h4><ul className="space-y-1">{r.training_arising.map((t, i) => (<li key={i} className="text-xs text-[var(--cs-text-secondary)] leading-relaxed flex gap-2"><span className="text-[var(--cs-text-muted)] flex-shrink-0">•</span><span>{t}</span></li>))}</ul></div>
                    )}
                    {r.policy_arising && (
                      <div><h4 className="text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1.5 flex items-center gap-1"><FileText className="h-3 w-3" />Policy arising</h4><p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed">{r.policy_arising}</p></div>
                    )}
                  </div>
                  <div className="rounded-lg border border-[var(--cs-border)] p-3">
                    <h4 className="text-[11px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1.5">Pattern check &amp; escalation</h4>
                    <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed mb-2">{r.pattern_check}</p>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <Badge className={cn("text-[10px] px-2 py-0 border", r.would_escalate_if_recurred ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-50 text-[var(--cs-text-secondary)] border-[var(--cs-border)]")}>{r.would_escalate_if_recurred ? "Would escalate if recurred" : "No escalation trigger"}</Badge>
                      <Badge className={cn("text-[10px] px-2 py-0 border", r.reported_to_pharmacist ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-slate-50 text-[var(--cs-text-secondary)] border-[var(--cs-border)]")}>{r.reported_to_pharmacist ? "Pharmacist notified" : "Pharmacist not notified"}</Badge>
                      <Badge className={cn("text-[10px] px-2 py-0 border", r.shareable_anonymously ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-[var(--cs-text-secondary)] border-[var(--cs-border)]")}>{r.shareable_anonymously ? "Shareable for sector learning" : "Internal only"}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-[var(--cs-text-muted)] pt-1 border-t border-[var(--cs-border-subtle)]">
                    <span>Reported {formatDate(r.date)} {r.time} by {getStaffName(r.reported_by)}</span>
                    {r.debrief_held && <span>Debrief: {formatDate(r.debrief_date)}</span>}
                  </div>
                  <SmartLinkPanel sourceType="medication-near-miss" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-[var(--cs-border)] bg-slate-50 p-3">
        <p className="text-[10px] text-[var(--cs-text-muted)] leading-relaxed">
          <strong>Regulatory context:</strong> This log supports compliance with{" "}
          <strong>Quality Standard 7 — Health and Wellbeing</strong> of the Children&apos;s Homes (England) Regulations
          2015 and aligns with <strong>CQC medication safety standards</strong> and <strong>NICE NG5</strong> on
          medicines optimisation. A high near-miss reporting rate alongside zero or low actual-error rates is recognised
          by Ofsted and CQC as evidence of a mature, learning-focused safety culture — not a sign of poor practice.
          Records inform the medication errors register, supervision, training plans, and policy development. Anonymised
          learning is shared with the placing authorities&apos; safeguarding networks where appropriate.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Medication"
        category="medication"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
