"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FIRE RISK ASSESSMENT
// Documents the home's fire risk assessment: hazards identified, controls in
// place, residual risk levels, people at risk, and additional control measures
// required. Distinct from fire drills — this is the underpinning assessment
// that drives evacuation procedures, equipment provision, and staff training.
// Required by the Regulatory Reform (Fire Safety) Order 2005 and Quality
// Standard 25 (Health & Wellbeing) of the Children's Homes Regulations 2015.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useFireRiskItems } from "@/hooks/use-fire-risk-items";
import type {
  FireRiskItem, FireRiskCategory, FireRiskLevel, FireRiskStatus,
} from "@/types/extended";
import {
  FIRE_RISK_CATEGORY_LABEL, FIRE_RISK_LEVEL_LABEL, FIRE_RISK_STATUS_LABEL,
} from "@/types/extended";
import {
  Flame, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX,
  ChevronUp, ChevronDown, ArrowUpDown, Calendar, User,
  CheckCircle2, Clock, ListChecks, MapPin, Users, BookOpen,
  CircleDot, Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Config ────────────────────────────────────────────────────────────────────

const RISK_LEVEL_CONFIG: Record<FireRiskLevel, { colour: string; ring: string; icon: React.ElementType }> = {
  low:    { colour: "bg-green-100 text-green-700 border-green-200",   ring: "border-green-200",  icon: ShieldCheck },
  medium: { colour: "bg-amber-100 text-amber-700 border-amber-200",   ring: "border-amber-200",  icon: ShieldAlert },
  high:   { colour: "bg-red-100 text-red-700 border-red-200",         ring: "border-red-300",    icon: ShieldX },
};

const STATUS_CONFIG: Record<FireRiskStatus, { colour: string; icon: React.ElementType }> = {
  implemented:  { colour: "bg-green-100 text-green-700 border-green-200",   icon: CheckCircle2 },
  in_progress:  { colour: "bg-blue-100 text-blue-700 border-blue-200",      icon: Clock },
  outstanding:  { colour: "bg-red-100 text-red-700 border-red-200",         icon: AlertTriangle },
};

const CATEGORY_CONFIG: Record<FireRiskCategory, string> = {
  fire_spread:      "bg-red-50 text-red-700",
  means_of_escape:  "bg-orange-50 text-orange-700",
  detection:        "bg-blue-50 text-blue-700",
  suppression:      "bg-cyan-50 text-cyan-700",
  human_factors:    "bg-purple-50 text-purple-700",
  storage:          "bg-slate-50 text-slate-700",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function FireRiskAssessmentPage() {
  const { data: res, isLoading } = useFireRiskItems();
  const items = res?.data ?? [];

  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("risk_high");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const areas = useMemo(() => Array.from(new Set(items.map(i => i.area))).sort(), [items]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (areaFilter !== "all") list = list.filter(i => i.area === areaFilter);
    if (riskFilter !== "all") list = list.filter(i => i.residual_risk_level === riskFilter);
    if (statusFilter !== "all") list = list.filter(i => i.status === statusFilter);

    const riskOrder: Record<FireRiskLevel, number> = { high: 0, medium: 1, low: 2 };
    list.sort((a, b) => {
      switch (sortBy) {
        case "risk_high":   return riskOrder[a.residual_risk_level] - riskOrder[b.residual_risk_level];
        case "risk_low":    return riskOrder[b.residual_risk_level] - riskOrder[a.residual_risk_level];
        case "due_soonest": return a.target_completion_date.localeCompare(b.target_completion_date);
        case "area":        return a.area.localeCompare(b.area);
        case "status":      return a.status.localeCompare(b.status);
        default:            return 0;
      }
    });
    return list;
  }, [items, areaFilter, riskFilter, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const total = items.length;
    const outstanding = items.filter(i => i.status === "outstanding").length;
    const high = items.filter(i => i.residual_risk_level === "high").length;
    const nextReview = items.reduce((min, i) => i.next_review_date < min ? i.next_review_date : min, "9999-12-31");
    return { total, outstanding, high, nextReview };
  }, [items]);

  const exportCols: ExportColumn<FireRiskItem>[] = [
    { header: "ID",                    accessor: (r: FireRiskItem) => r.id },
    { header: "Area",                  accessor: (r: FireRiskItem) => r.area },
    { header: "Risk Category",         accessor: (r: FireRiskItem) => FIRE_RISK_CATEGORY_LABEL[r.risk_category] },
    { header: "Hazard",                accessor: (r: FireRiskItem) => r.hazard_identified },
    { header: "Current Controls",      accessor: (r: FireRiskItem) => r.current_controls.join("; ") },
    { header: "Residual Risk",         accessor: (r: FireRiskItem) => FIRE_RISK_LEVEL_LABEL[r.residual_risk_level] },
    { header: "People At Risk",        accessor: (r: FireRiskItem) => r.people_at_risk.join(", ") },
    { header: "Additional Controls",   accessor: (r: FireRiskItem) => r.additional_controls_required.join("; ") },
    { header: "Responsible Owner",     accessor: (r: FireRiskItem) => getStaffName(r.responsible_owner) },
    { header: "Target Completion",     accessor: (r: FireRiskItem) => r.target_completion_date },
    { header: "Status",                accessor: (r: FireRiskItem) => FIRE_RISK_STATUS_LABEL[r.status] },
    { header: "Last Review",           accessor: (r: FireRiskItem) => r.last_review_date },
    { header: "Next Review",           accessor: (r: FireRiskItem) => r.next_review_date },
    { header: "Assessed By",           accessor: (r: FireRiskItem) => getStaffName(r.assessed_by) },
  ];

  if (isLoading) {
    return (
      <PageShell
        title="Fire Risk Assessment"
        subtitle="Hazards, controls, and remedial actions under the Regulatory Reform (Fire Safety) Order 2005"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Fire Risk Assessment"
      subtitle="Hazards, controls, and remedial actions under the Regulatory Reform (Fire Safety) Order 2005"
      ariaContext={{ pageTitle: "Fire Risk Assessment", sourceType: "home_check" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Fire Risk Assessment" />
          <ExportButton data={filtered} columns={exportCols} filename="fire-risk-assessment" />
          <AriaStudioQuickActionButton context={{ record_type: "risk_assessment", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Hazards",     value: stats.total,                          icon: Flame,           c: "text-red-600" },
          { label: "Outstanding",       value: stats.outstanding,                    icon: AlertTriangle,   c: stats.outstanding > 0 ? "text-red-600" : "text-muted-foreground" },
          { label: "High-Risk Items",   value: stats.high,                           icon: ShieldX,         c: stats.high > 0 ? "text-red-600" : "text-muted-foreground" },
          { label: "Next Review",       value: formatDate(stats.nextReview),         icon: Calendar,        c: "text-indigo-600" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-3 flex items-center gap-3">
            <s.icon className={cn("h-5 w-5", s.c)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {(stats.outstanding > 0 || stats.high > 0) && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800 dark:text-red-300">
            <p className="font-semibold">Action required</p>
            <p>
              {stats.outstanding} outstanding control{stats.outstanding === 1 ? "" : "s"} and {stats.high} high-risk
              hazard{stats.high === 1 ? "" : "s"} require attention. Outstanding items must be progressed without
              delay and recorded in the action plan below.
            </p>
          </div>
        </div>
      )}

      {/* Filters / sort */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Area" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Risk Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="implemented">Implemented</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="outstanding">Outstanding</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="risk_high">Highest Risk First</SelectItem>
              <SelectItem value="risk_low">Lowest Risk First</SelectItem>
              <SelectItem value="due_soonest">Target Date (Soonest)</SelectItem>
              <SelectItem value="area">Area (A-Z)</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} hazard{filtered.length !== 1 ? "s" : ""} shown
      </p>

      {/* List */}
      <div className="space-y-3" id="fire-risk-assessment-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Flame className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No hazards match the selected filters</p>
          </div>
        )}

        {filtered.map(item => {
          const isOpen = expandedId === item.id;
          const rl = RISK_LEVEL_CONFIG[item.residual_risk_level];
          const sc = STATUS_CONFIG[item.status];
          const RiskIcon = rl.icon;
          const StatusIcon = sc.icon;
          const isUrgent = item.status === "outstanding";

          return (
            <div
              key={item.id}
              className={cn(
                "rounded-lg border bg-card overflow-hidden transition-shadow",
                isUrgent && "border-red-200 shadow-sm",
                item.residual_risk_level === "high" && !isUrgent && "border-red-100",
              )}
            >
              <button
                onClick={() => setExpandedId(isOpen ? null : item.id)}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className={cn("rounded-full p-1.5 shrink-0 border", rl.colour)}>
                  <RiskIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="inline-flex items-center gap-1 text-sm font-medium">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {item.area}
                    </span>
                    <span className={cn("text-[11px] px-1.5 py-0.5 rounded border", CATEGORY_CONFIG[item.risk_category], "border-transparent")}>
                      {FIRE_RISK_CATEGORY_LABEL[item.risk_category]}
                    </span>
                    <span className={cn("text-[11px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1", rl.colour)}>
                      <CircleDot className="h-3 w-3" /> {FIRE_RISK_LEVEL_LABEL[item.residual_risk_level]} risk
                    </span>
                    <span className={cn("text-[11px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1", sc.colour)}>
                      <StatusIcon className="h-3 w-3" /> {FIRE_RISK_STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 line-clamp-2">{item.hazard_identified}</p>
                  <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-3 flex-wrap">
                    <span><User className="inline h-3.5 w-3.5 mr-0.5" />{getStaffName(item.responsible_owner)}</span>
                    <span><Calendar className="inline h-3.5 w-3.5 mr-0.5" />Target: {formatDate(item.target_completion_date)}</span>
                    <span><BookOpen className="inline h-3.5 w-3.5 mr-0.5" />Assessed: {getStaffName(item.assessed_by)}</span>
                  </p>
                </div>
                {isOpen
                  ? <ChevronUp className="h-4 w-4 shrink-0 mt-1" />
                  : <ChevronDown className="h-4 w-4 shrink-0 mt-1" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-4 bg-muted/30">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Hazard Identified
                    </p>
                    <p className="text-sm">{item.hazard_identified}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 inline-flex items-center gap-1">
                      <ListChecks className="h-3.5 w-3.5" /> Current Controls In Place
                    </p>
                    {item.current_controls.length === 0 ? (
                      <p className="text-sm italic text-muted-foreground">No controls recorded</p>
                    ) : (
                      <ul className="text-sm list-disc pl-5 space-y-0.5">
                        {item.current_controls.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 inline-flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Additional Controls Required
                    </p>
                    {item.additional_controls_required.length === 0 ? (
                      <p className="text-sm italic text-muted-foreground">
                        No further controls identified — risk reduced to acceptable level.
                      </p>
                    ) : (
                      <ul className="text-sm list-disc pl-5 space-y-0.5">
                        {item.additional_controls_required.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded border bg-card p-2">
                      <p className="font-semibold text-muted-foreground uppercase mb-1">
                        <Users className="inline h-3.5 w-3.5 mr-1" />People At Risk
                      </p>
                      <p>{item.people_at_risk.join(", ") || "—"}</p>
                    </div>
                    <div className="rounded border bg-card p-2">
                      <p className="font-semibold text-muted-foreground uppercase mb-1">
                        <User className="inline h-3.5 w-3.5 mr-1" />Responsible Owner
                      </p>
                      <p>{getStaffName(item.responsible_owner)}</p>
                    </div>
                    <div className="rounded border bg-card p-2">
                      <p className="font-semibold text-muted-foreground uppercase mb-1">
                        <Calendar className="inline h-3.5 w-3.5 mr-1" />Target Completion
                      </p>
                      <p>{formatDate(item.target_completion_date)}</p>
                    </div>
                    <div className="rounded border bg-card p-2">
                      <p className="font-semibold text-muted-foreground uppercase mb-1">
                        <Calendar className="inline h-3.5 w-3.5 mr-1" />Review Cycle
                      </p>
                      <p>
                        Last: {formatDate(item.last_review_date)} · Next: {formatDate(item.next_review_date)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Regulatory note */}
      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Regulatory Context</p>
            <p>
              The <strong>Regulatory Reform (Fire Safety) Order 2005</strong> requires the responsible person
              (the Registered Manager) to carry out and regularly review a suitable and sufficient fire risk
              assessment, identifying hazards, the people at risk, and the control measures in place.
              <strong> Quality Standard 25 (Health & Wellbeing)</strong> and <strong>Regulation 23 (Fitness of
              premises)</strong> of the Children's Homes (England) Regulations 2015 require the home to be
              physically safe, with effective fire precautions appropriate to the needs of the children
              accommodated. This assessment underpins fire drills, equipment provision, staff training, and
              individual risk assessments where a child's needs or behaviour create elevated fire risk.
            </p>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Safety"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Fire Risk Assessment — fire hazards, fire detection systems, means of escape, fire extinguishers, fire doors, evacuation plan, responsible person, Reg 31, RRFSO, Ofsted"
        recordType="risk_assessment"
        className="mt-6"
      />
    </PageShell>
  );
}
