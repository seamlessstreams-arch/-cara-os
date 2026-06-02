"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search, ChevronDown, ChevronUp, ArrowUpDown, Calendar,
  Clock, AlertTriangle, CheckCircle2, Shield, Moon,
  ClipboardList, Eye, Users, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useUnannouncedVisitRecords } from "@/hooks/use-unannounced-visit-records";
import type {
  UnannouncedVisitRecord,
  UnannouncedVisitType,
  UnannouncedVisitOverallAssessment,
  UnannouncedVisitActionRequired,
} from "@/types/extended";
import {
  UNANNOUNCED_VISIT_TYPE_LABEL,
  UNANNOUNCED_VISIT_OVERALL_ASSESSMENT_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local config ─────────────────────────────────────────────────────────── */

const ASSESSMENT_CLR: Record<UnannouncedVisitOverallAssessment, string> = {
  good: "bg-green-100 text-green-800",
  requires_attention: "bg-amber-100 text-amber-800",
  immediate_action_needed: "bg-red-100 text-red-800",
};

const TYPE_CLR: Record<UnannouncedVisitType, string> = {
  ri_monitoring: "bg-purple-100 text-purple-800",
  management_spot_check: "bg-blue-100 text-blue-800",
  external_professional: "bg-indigo-100 text-indigo-800",
  ofsted: "bg-rose-100 text-rose-800",
};

const fmt = (iso: string) => {
  const [y, m, day] = iso.split("-");
  return `${day}/${m}/${y}`;
};

const isNightVisit = (time: string): boolean => {
  const hour = parseInt(time.split(":")[0], 10);
  return hour >= 22 || hour < 6;
};

type SortOption = "date-desc" | "date-asc" | "type" | "assessment";

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function UnannouncedVisitsLogPage() {
  const { data: records = [], isLoading } = useUnannouncedVisitRecords();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<UnannouncedVisitType | "all">("all");

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

  /* ── filtered & sorted ─────────────────────────────────────────────────── */
  const processed = useMemo(() => {
    let result = [...records];

    if (filterType !== "all") {
      result = result.filter((v) => v.visit_type === filterType);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((v) =>
        v.findings.toLowerCase().includes(q) ||
        UNANNOUNCED_VISIT_TYPE_LABEL[v.visit_type].toLowerCase().includes(q) ||
        v.visitor.toLowerCase().includes(q) ||
        v.areas_inspected.some((a) => a.toLowerCase().includes(q)) ||
        v.positive_observations.some((o) => o.toLowerCase().includes(q)) ||
        v.concerns.some((c) => c.toLowerCase().includes(q))
      );
    }

    const ASSESSMENT_ORDER: Record<UnannouncedVisitOverallAssessment, number> = { immediate_action_needed: 0, requires_attention: 1, good: 2 };

    switch (sortBy) {
      case "date-desc":
        result.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case "date-asc":
        result.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "type":
        result.sort((a, b) => a.visit_type.localeCompare(b.visit_type));
        break;
      case "assessment":
        result.sort((a, b) => ASSESSMENT_ORDER[a.overall_assessment] - ASSESSMENT_ORDER[b.overall_assessment]);
        break;
    }

    return result;
  }, [records, search, sortBy, filterType]);

  /* ── summary stats ─────────────────────────────────────────────────────── */
  const now = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().slice(0, 10);

  const visitsThisQuarter = records.filter((v) => v.date >= quarterStart).length;
  const nightVisits = records.filter((v) => isNightVisit(v.time_of_visit)).length;
  const outstandingActions = records.reduce(
    (sum, v) => sum + v.actions_required.filter((a) => a.deadline >= d(0) || a.deadline >= d(-7)).length,
    0
  );
  const assessmentBreakdown = {
    good: records.filter((v) => v.overall_assessment === "good").length,
    attention: records.filter((v) => v.overall_assessment === "requires_attention").length,
    immediate: records.filter((v) => v.overall_assessment === "immediate_action_needed").length,
  };

  /* ── export columns ────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<UnannouncedVisitRecord>[] = [
    { header: "Date", accessor: (r: UnannouncedVisitRecord) => r.date },
    { header: "Time", accessor: (r: UnannouncedVisitRecord) => r.time_of_visit },
    { header: "Visit Type", accessor: (r: UnannouncedVisitRecord) => UNANNOUNCED_VISIT_TYPE_LABEL[r.visit_type] },
    { header: "Visitor", accessor: (r: UnannouncedVisitRecord) => r.visitor.startsWith("staff_") ? getStaffName(r.visitor) : r.visitor },
    { header: "Areas Inspected", accessor: (r: UnannouncedVisitRecord) => r.areas_inspected.join(", ") },
    { header: "Children Spoken To", accessor: (r: UnannouncedVisitRecord) => r.children_spoken_to.join(", ") },
    { header: "Staff On Duty", accessor: (r: UnannouncedVisitRecord) => r.staff_on_duty.map((s: string) => getStaffName(s)).join(", ") },
    { header: "Findings", accessor: (r: UnannouncedVisitRecord) => r.findings },
    { header: "Positive Observations", accessor: (r: UnannouncedVisitRecord) => r.positive_observations.join("; ") },
    { header: "Concerns", accessor: (r: UnannouncedVisitRecord) => r.concerns.join("; ") },
    { header: "Actions Required", accessor: (r: UnannouncedVisitRecord) => r.actions_required.map((a: UnannouncedVisitActionRequired) => a.description).join("; ") },
    { header: "Overall Assessment", accessor: (r: UnannouncedVisitRecord) => UNANNOUNCED_VISIT_OVERALL_ASSESSMENT_LABEL[r.overall_assessment] },
    { header: "Follow-Up Date", accessor: (r: UnannouncedVisitRecord) => r.follow_up_date },
  ];

  if (isLoading) {
    return (
      <PageShell title="Unannounced Visits Log" subtitle="Management, RI, and external oversight visits — demonstrating active monitoring under Regulation 44/45">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Unannounced Visits Log"
      subtitle="Management, RI, and external oversight visits — demonstrating active monitoring under Regulation 44/45"
      ariaContext={{ pageTitle: "Unannounced Visits Log", sourceType: "home_check" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Unannounced Visits Log" />
          <ExportButton data={processed} columns={exportCols} filename="unannounced-visits-log" />
          <AriaStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* ── Summary stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Visits This Quarter", value: visitsThisQuarter, icon: Calendar, clr: "text-blue-600" },
            { label: "Night Visits", value: nightVisits, icon: Moon, clr: "text-indigo-600" },
            { label: "Outstanding Actions", value: outstandingActions, icon: AlertTriangle, clr: outstandingActions > 0 ? "text-amber-600" : "text-green-600" },
            { label: "Assessment Breakdown", value: `${assessmentBreakdown.good}G / ${assessmentBreakdown.attention}A / ${assessmentBreakdown.immediate}I`, icon: Shield, clr: assessmentBreakdown.immediate > 0 ? "text-red-600" : "text-green-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filters & Sort ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search visits, findings, concerns..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as UnannouncedVisitType | "all")}
          >
            <option value="all">All visit types</option>
            {(Object.entries(UNANNOUNCED_VISIT_TYPE_LABEL) as [UnannouncedVisitType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="type">Visit type</option>
              <option value="assessment">Assessment (urgent first)</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {processed.length} visit{processed.length !== 1 ? "s" : ""}
        </p>

        {/* ── Visit cards ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          {processed.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Eye className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium">No visits match your criteria</p>
            </div>
          )}

          {processed.map((visit) => {
            const isOpen = expandedId === visit.id;
            const assessmentClr = ASSESSMENT_CLR[visit.overall_assessment];
            const typeClr = TYPE_CLR[visit.visit_type];
            const isNight = isNightVisit(visit.time_of_visit);
            const borderClr = visit.overall_assessment === "immediate_action_needed"
              ? "border-l-red-500"
              : visit.overall_assessment === "requires_attention"
              ? "border-l-amber-400"
              : "border-l-green-400";

            return (
              <Card key={visit.id} className={cn("border-l-4", borderClr)}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(visit.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {fmt(visit.date)} at {visit.time_of_visit}
                        {isNight && <Moon className="h-3.5 w-3.5 text-indigo-500" />}
                        <Badge variant="outline" className={typeClr}>
                          {UNANNOUNCED_VISIT_TYPE_LABEL[visit.visit_type]}
                        </Badge>
                        <Badge variant="outline" className={assessmentClr}>
                          {UNANNOUNCED_VISIT_OVERALL_ASSESSMENT_LABEL[visit.overall_assessment]}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {visit.visitor.startsWith("staff_") ? getStaffName(visit.visitor) : visit.visitor}
                        {" · "}
                        {visit.areas_inspected.length} area{visit.areas_inspected.length !== 1 ? "s" : ""} inspected
                        {visit.children_spoken_to.length > 0 && ` · ${visit.children_spoken_to.length} child${visit.children_spoken_to.length !== 1 ? "ren" : ""} spoken to`}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* Areas inspected */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <ClipboardList className="h-3.5 w-3.5" /> Areas Inspected
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {visit.areas_inspected.map((area) => (
                          <Badge key={area} variant="outline" className="text-xs bg-slate-50">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Staff on duty */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Staff on Duty
                      </p>
                      <p className="text-muted-foreground">
                        {visit.staff_on_duty.map((s) => getStaffName(s)).join(", ")}
                      </p>
                    </div>

                    {/* Children spoken to */}
                    {visit.children_spoken_to.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Children Spoken To</p>
                        <p className="text-muted-foreground">{visit.children_spoken_to.join(", ")}</p>
                      </div>
                    )}

                    {/* Findings */}
                    <div>
                      <p className="font-medium mb-1">Findings</p>
                      <p className="text-muted-foreground">{visit.findings}</p>
                    </div>

                    {/* Positive observations */}
                    {visit.positive_observations.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="font-medium text-green-800 mb-2 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Positive Observations
                        </p>
                        <ul className="space-y-1">
                          {visit.positive_observations.map((obs, i) => (
                            <li key={i} className="text-green-700 text-xs flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                              {obs}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Concerns */}
                    {(visit.concerns?.length ?? 0) > 0 && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="font-medium text-amber-800 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Concerns
                        </p>
                        <ul className="space-y-1">
                          {(visit.concerns ?? []).map((concern, i) => (
                            <li key={i} className="text-amber-700 text-xs flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions required */}
                    {visit.actions_required.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="font-medium text-blue-800 mb-2 flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" /> Actions Required
                        </p>
                        <div className="space-y-2">
                          {visit.actions_required.map((action, i) => (
                            <div key={i} className="text-xs bg-white rounded p-2 border border-blue-100">
                              <p className="text-blue-900 font-medium">{action.description}</p>
                              <p className="text-blue-600 mt-1">
                                Owner: {action.owner.startsWith("staff_") ? getStaffName(action.owner) : action.owner}
                                {" · "}Deadline: {fmt(action.deadline)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
                      <Clock className="h-3.5 w-3.5" />
                      Follow-up due: {fmt(visit.follow_up_date)}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── Regulatory note ──────────────────────────────────────────── */}
        <Card className="bg-slate-50 border-[var(--cs-border)]">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-[var(--cs-text-secondary)] flex items-center gap-1.5 mb-2">
              <Shield className="h-3.5 w-3.5" /> Regulatory Framework
            </p>
            <ul className="text-xs text-[var(--cs-text-secondary)] space-y-1">
              <li><span className="font-medium">Regulation 44</span> — An independent person must visit the home at least once per month and produce a written report on the conduct of the home.</li>
              <li><span className="font-medium">Regulation 45</span> — The registered person must review the quality of care at least every 6 months and produce a written report, consulting the independent visitor&apos;s reports.</li>
              <li><span className="font-medium">Quality Standard 25</span> — The registered person ensures effective governance, with systems to monitor the quality of care and address shortfalls promptly.</li>
            </ul>
            <p className="text-xs text-[var(--cs-text-muted)] mt-2">
              Unannounced visits at varied times (including nights and weekends) demonstrate robust oversight and ensure standards are consistently maintained outside of planned visits.
            </p>
          </CardContent>
        </Card>

      </div>
      <CareEventsPanel
        title="Care Events — Regulatory Visits"
        category="general"
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Unannounced Visits Log — Reg 44 unannounced visits, RI visits, local authority visits, Ofsted visits, visit outcomes, actions raised, compliance evidence, inspector notes"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
