"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock,
  Users, ArrowUpDown, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useStaffDebriefRecords } from "@/hooks/use-staff-debrief-records";
import type {
  StaffDebriefRecord,
  StaffDebriefType,
  StaffDebriefStatus,
  StaffDebriefEmotionalImpact,
} from "@/types/extended";
import {
  STAFF_DEBRIEF_TYPE_LABEL,
  STAFF_DEBRIEF_STATUS_LABEL,
  STAFF_DEBRIEF_EMOTIONAL_IMPACT_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── local config ─────────────────────────────────────────────────────── */

const TYPE_META: Record<StaffDebriefType, { color: string }> = {
  post_incident: { color: "bg-amber-100 text-amber-800" },
  post_restraint: { color: "bg-red-100 text-red-800" },
  post_missing: { color: "bg-orange-100 text-orange-800" },
  critical_event: { color: "bg-red-100 text-red-800" },
  emotional_support: { color: "bg-blue-100 text-blue-800" },
  tci_reflection: { color: "bg-purple-100 text-purple-800" },
};

const STATUS_META: Record<StaffDebriefStatus, { color: string }> = {
  completed: { color: "bg-green-100 text-green-800" },
  scheduled: { color: "bg-blue-100 text-blue-800" },
  overdue: { color: "bg-red-100 text-red-800" },
  declined: { color: "bg-slate-100 text-[var(--cs-text-secondary)]" },
};

const IMPACT_META: Record<StaffDebriefEmotionalImpact, { color: string }> = {
  low: { color: "text-green-700" },
  moderate: { color: "text-amber-700" },
  high: { color: "text-orange-700" },
  significant: { color: "text-red-700" },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function StaffDebriefLogPage() {
  const { data: records = [], isLoading } = useStaffDebriefRecords();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "impact" | "type">("date");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = [...records];
    if (filterType !== "all") result = result.filter((d) => d.type === filterType);
    return result.sort((a, b) => {
      switch (sortBy) {
        case "impact": {
          const order: Record<StaffDebriefEmotionalImpact, number> = { significant: 0, high: 1, moderate: 2, low: 3 };
          return (order[a.emotional_impact] ?? 4) - (order[b.emotional_impact] ?? 4);
        }
        case "type": return a.type.localeCompare(b.type);
        default: return b.date.localeCompare(a.date);
      }
    });
  }, [records, sortBy, filterType]);

  const exportData = useMemo(() => {
    return records.map((d) => ({
      date: d.date,
      type: STAFF_DEBRIEF_TYPE_LABEL[d.type],
      triggerEvent: d.trigger_event,
      triggerDate: d.trigger_date,
      staffInvolved: d.staff_involved.map((s) => getStaffName(s)).join(", "),
      facilitatedBy: getStaffName(d.facilitated_by),
      status: STAFF_DEBRIEF_STATUS_LABEL[d.status],
      emotionalImpact: STAFF_DEBRIEF_EMOTIONAL_IMPACT_LABEL[d.emotional_impact],
      followUpNeeded: d.follow_up_needed ? "Yes" : "No",
    }));
  }, [records]);

  type ExportRow = (typeof exportData)[number];

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Date", accessor: (r) => r.date },
    { header: "Type", accessor: (r) => r.type },
    { header: "Trigger", accessor: (r) => r.triggerEvent },
    { header: "Staff Involved", accessor: (r) => r.staffInvolved },
    { header: "Facilitated By", accessor: (r) => r.facilitatedBy },
    { header: "Status", accessor: (r) => r.status },
    { header: "Impact", accessor: (r) => r.emotionalImpact },
    { header: "Follow-Up", accessor: (r) => r.followUpNeeded },
  ];

  const completedCount = records.filter((d) => d.status === "completed").length;
  const highImpactCount = records.filter((d) => d.emotional_impact === "high" || d.emotional_impact === "significant").length;
  const followUpCount = records.filter((d) => d.follow_up_needed).length;

  if (isLoading) {
    return (
      <PageShell title="Staff Debrief Log" subtitle="Post-Incident · Emotional Support · TCI Reflections · Staff Welfare">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Debrief Log"
      subtitle="Post-Incident · Emotional Support · TCI Reflections · Staff Welfare"
      caraContext={{ pageTitle: "Staff Debrief Log", sourceType: "pi_debrief" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Debrief Log" />
          <ExportButton data={exportData} columns={exportCols} filename="staff-debrief-log" />
          <CaraStudioQuickActionButton context={{ record_type: "incident", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{records.length}</p>
              <p className="text-xs text-muted-foreground">Total Debriefs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className={cn("text-2xl font-bold", highImpactCount > 0 ? "text-red-600" : "text-green-600")}>{highImpactCount}</p>
              <p className="text-xs text-muted-foreground">High / Significant Impact</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className={cn("text-2xl font-bold", followUpCount > 0 ? "text-amber-600" : "text-green-600")}>{followUpCount}</p>
              <p className="text-xs text-muted-foreground">Follow-Up Needed</p>
            </CardContent>
          </Card>
        </div>

        {/* filter + sort */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select className="text-sm border rounded px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="date">Date (newest)</option>
              <option value="impact">Impact (highest)</option>
              <option value="type">Type</option>
            </select>
          </div>
          <select className="text-sm border rounded px-2 py-1" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            {(Object.keys(STAFF_DEBRIEF_TYPE_LABEL) as StaffDebriefType[]).map((key) => (
              <option key={key} value={key}>{STAFF_DEBRIEF_TYPE_LABEL[key]}</option>
            ))}
          </select>
        </div>

        {/* debrief cards */}
        <div className="space-y-3">
          {filtered.map((debrief) => {
            const isOpen = expandedId === debrief.id;
            return (
              <Card key={debrief.id} className={cn(
                "border-l-4",
                debrief.emotional_impact === "significant" || debrief.emotional_impact === "high" ? "border-l-red-500" :
                debrief.emotional_impact === "moderate" ? "border-l-amber-400" : "border-l-green-400"
              )}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : debrief.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        {STAFF_DEBRIEF_TYPE_LABEL[debrief.type]}
                        <Badge variant="outline" className={STATUS_META[debrief.status].color}>{STAFF_DEBRIEF_STATUS_LABEL[debrief.status]}</Badge>
                        <Badge variant="outline" className={cn("text-xs", debrief.emotional_impact === "significant" || debrief.emotional_impact === "high" ? "bg-red-100 text-red-800" : debrief.emotional_impact === "moderate" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800")}>
                          {STAFF_DEBRIEF_EMOTIONAL_IMPACT_LABEL[debrief.emotional_impact]} Impact
                        </Badge>
                        {debrief.confidential && <Badge variant="outline" className="bg-slate-100 text-[var(--cs-text-secondary)]">Confidential</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {debrief.date} · Staff: {debrief.staff_involved.map((s) => getStaffName(s)).join(", ")} · Facilitated by: {getStaffName(debrief.facilitated_by)}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* trigger event */}
                    <div className="bg-muted/40 rounded p-2">
                      <p className="font-medium text-xs mb-1">Trigger Event ({debrief.trigger_date})</p>
                      <p className="text-xs text-muted-foreground">{debrief.trigger_event}</p>
                    </div>

                    {/* what went well / improve */}
                    {(debrief.what_went_well.length > 0 || debrief.what_could_improve.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {debrief.what_went_well.length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <p className="font-medium text-xs text-green-800 mb-1">What Went Well</p>
                            <ul className="space-y-0.5">
                              {debrief.what_went_well.map((item, i) => (
                                <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                                  <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {debrief.what_could_improve.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded p-2">
                            <p className="font-medium text-xs text-amber-800 mb-1">Areas for Improvement</p>
                            <ul className="space-y-0.5">
                              {debrief.what_could_improve.map((item, i) => (
                                <li key={i} className="text-xs text-amber-700 flex items-start gap-1">
                                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* staff feelings */}
                    {debrief.staff_feelings && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="font-medium text-xs text-blue-800 mb-1 flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> Staff Feelings</p>
                        <p className="text-xs text-blue-700">{debrief.staff_feelings}</p>
                      </div>
                    )}

                    {/* support offered */}
                    {debrief.support_offered.length > 0 && (
                      <div>
                        <p className="font-medium text-xs mb-1 flex items-center gap-1"><Users className="h-3.5 w-3.5 text-purple-600" /> Support Offered</p>
                        <ul className="space-y-0.5">
                          {debrief.support_offered.map((s, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                              <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-purple-600" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* learning points */}
                    {debrief.learning_points.length > 0 && (
                      <div>
                        <p className="font-medium text-xs mb-1 flex items-center gap-1"><Brain className="h-3.5 w-3.5 text-blue-600" /> Learning Points</p>
                        <ul className="space-y-0.5">
                          {debrief.learning_points.map((lp, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="text-blue-600 shrink-0">•</span>
                              <span>{lp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* follow-up */}
                    {debrief.follow_up_needed && debrief.follow_up_details && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="font-medium text-xs text-amber-800 mb-1 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Follow-Up Required</p>
                        <p className="text-xs text-amber-700">{debrief.follow_up_details}</p>
                      </div>
                    )}

                    {/* notes */}
                    {debrief.notes && (
                      <div>
                        <p className="font-medium text-xs mb-1">RM Notes</p>
                        <p className="text-xs text-muted-foreground">{debrief.notes}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Staff Debrief & Welfare</p>
          <p>Staff debriefs are an essential part of post-incident learning and staff welfare. The Children&apos;s Homes Regulations 2015 and Quality Standards require that staff are supported following incidents and that learning is used to improve practice. All staff involved in restraints must be offered a debrief within 24 hours. Emotional debriefs should be offered after any distressing event. TCI (Therapeutic Crisis Intervention) reflections should be conducted quarterly to review the home&apos;s use of therapeutic approaches. Staff wellbeing is a leadership responsibility — the RM must ensure that debriefs are conducted sensitively and that staff have access to external support (EAP, counselling) when needed. Debrief records are confidential where marked.</p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Behaviour & Debriefs"
        category={["behaviour", "physical_intervention", "safeguarding"]}
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Staff Debrief Log — post-incident emotional support, staff welfare, supervisor check-in, practice reflection, learning from incidents, wellbeing, resilience, vicarious trauma"
        recordType="incident"
        className="mt-6"
      />
    </PageShell>
  );
}
