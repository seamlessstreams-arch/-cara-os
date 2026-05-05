"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Moon, Clock, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Eye, ShieldAlert, Pill, ArrowUpDown, Users, Loader2,
} from "lucide-react";
import { useNightLogs } from "@/hooks/use-night-logs";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { NightCheckStatus, NightLogEntry } from "@/types/extended";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const CHECK_STATUS_META: Record<string, { label: string; color: string }> = {
  asleep: { label: "Asleep", color: "bg-green-100 text-green-800" },
  awake_settled: { label: "Awake (Settled)", color: "bg-blue-100 text-blue-800" },
  awake_unsettled: { label: "Awake (Unsettled)", color: "bg-amber-100 text-amber-800" },
  not_in_room: { label: "Not in Room", color: "bg-red-100 text-red-800" },
  refused_entry: { label: "Refused Entry", color: "bg-purple-100 text-purple-800" },
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function NightLogPage() {
  const { data: nlData, isLoading } = useNightLogs();
  const data: NightLogEntry[] = nlData?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "incidents">("date");

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      switch (sortBy) {
        case "incidents": return b.incidents.length - a.incidents.length;
        default: return b.date.localeCompare(a.date);
      }
    });
  }, [data, sortBy]);

  const exportData = useMemo(() => {
    return data.flatMap((entry) =>
      entry.checks.map((chk) => ({
        date: entry.date,
        wakingStaff: entry.waking_night_staff.map((s) => getStaffName(s)).join(", "),
        checkTime: chk.time,
        child: getYPName(chk.child_id),
        status: CHECK_STATUS_META[chk.status]?.label || chk.status,
        notes: chk.notes,
        incidentCount: entry.incidents.length,
      }))
    );
  }, [data]);

  type ExportRow = (typeof exportData)[number];

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Date", accessor: (r: ExportRow) => r.date },
    { header: "Waking Night Staff", accessor: (r: ExportRow) => r.wakingStaff },
    { header: "Check Time", accessor: (r: ExportRow) => r.checkTime },
    { header: "Child", accessor: (r: ExportRow) => r.child },
    { header: "Status", accessor: (r: ExportRow) => r.status },
    { header: "Notes", accessor: (r: ExportRow) => r.notes },
    { header: "Incidents", accessor: (r: ExportRow) => String(r.incidentCount) },
  ];

  const totalChecks = data.reduce((s, e) => s + e.checks.length, 0);
  const totalIncidents = data.reduce((s, e) => s + e.incidents.length, 0);
  const nightsWithConcerns = data.filter((e) => e.concerns).length;

  return (
    <PageShell
      title="Night Log"
      subtitle="Waking Night Records · Night Checks · Incidents · Security"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Night Log" />
          <ExportButton data={exportData} columns={exportCols} filename="night-log" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading night logs…</span>
        </div>
      ) : (
      <div id="print-area">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{data.length}</p>
              <p className="text-xs text-muted-foreground">Night Logs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{totalChecks}</p>
              <p className="text-xs text-muted-foreground">Total Checks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className={cn("text-2xl font-bold", totalIncidents > 0 ? "text-amber-600" : "text-green-600")}>{totalIncidents}</p>
              <p className="text-xs text-muted-foreground">Incidents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className={cn("text-2xl font-bold", nightsWithConcerns > 0 ? "text-red-600" : "text-green-600")}>{nightsWithConcerns}</p>
              <p className="text-xs text-muted-foreground">Nights with Concerns</p>
            </CardContent>
          </Card>
        </div>

        {/* sort */}
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="text-sm border rounded px-2 py-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="date">Date (newest)</option>
            <option value="incidents">Incidents (most first)</option>
          </select>
        </div>

        {/* night log entries */}
        <div className="space-y-3">
          {sorted.map((entry) => {
            const isOpen = expandedId === entry.id;
            const hasIncidents = entry.incidents.length > 0;
            const hasConcerns = !!entry.concerns;
            return (
              <Card key={entry.id} className={cn(
                "border-l-4",
                hasConcerns ? "border-l-red-500" : hasIncidents ? "border-l-amber-400" : "border-l-green-400"
              )}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : entry.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Moon className="h-4 w-4 text-blue-600" />
                        Night of {entry.date}
                        {hasIncidents && <Badge variant="outline" className="bg-amber-100 text-amber-800">{entry.incidents.length} incident(s)</Badge>}
                        {hasConcerns && <Badge variant="outline" className="bg-red-100 text-red-800">Concerns</Badge>}
                        {!hasIncidents && !hasConcerns && <Badge variant="outline" className="bg-green-100 text-green-800">Uneventful</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {entry.shift_start}–{entry.shift_end} · Waking night: {entry.waking_night_staff.map((s) => getStaffName(s)).join(", ")}
                        {entry.sleep_in_staff && ` · Sleep-in: ${getStaffName(entry.sleep_in_staff)}`}
                        · {entry.checks.length} checks
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* handover from day */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Handover from Day Shift</p>
                      <p className="text-xs text-blue-700">{entry.handover_from_day}</p>
                    </div>

                    {/* concerns */}
                    {entry.concerns && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="font-medium text-xs text-red-800 mb-1 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Concerns Raised</p>
                        <p className="text-xs text-red-700">{entry.concerns}</p>
                      </div>
                    )}

                    {/* incidents */}
                    {entry.incidents.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1"><ShieldAlert className="h-4 w-4 text-amber-500" /> Incidents</p>
                        {entry.incidents.map((inc, i) => (
                          <div key={i} className="bg-amber-50 border border-amber-200 rounded p-2 mb-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 text-[10px]">{inc.time}</Badge>
                              {inc.child_id && <span className="text-xs font-medium">{getYPName(inc.child_id)}</span>}
                              <Badge variant="outline" className="text-[10px]">{inc.incident_type.replace(/_/g, " ")}</Badge>
                            </div>
                            <p className="text-xs mb-1">{inc.description}</p>
                            <p className="text-xs text-muted-foreground"><strong>Action:</strong> {inc.action_taken}</p>
                            {inc.escalated && <p className="text-xs text-red-700 mt-0.5">Escalated to: {inc.escalated_to}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* checks timeline per child */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1"><Eye className="h-4 w-4 text-purple-600" /> Night Checks</p>
                      {["yp_alex", "yp_jordan", "yp_casey"].map((ypId) => {
                        const childChecks = entry.checks.filter((c) => c.child_id === ypId);
                        if (childChecks.length === 0) return null;
                        return (
                          <div key={ypId} className="mb-2">
                            <p className="text-xs font-medium mb-1">{getYPName(ypId)}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                              {childChecks.map((chk, i) => (
                                <div key={i} className="bg-muted/40 rounded p-1.5 text-[10px]">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-medium">{chk.time}</span>
                                    <Badge variant="outline" className={cn("text-[9px] px-1 py-0", CHECK_STATUS_META[chk.status]?.color)}>
                                      {CHECK_STATUS_META[chk.status]?.label}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground">{chk.notes}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* medication */}
                    {entry.medication_given.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1"><Pill className="h-4 w-4 text-green-600" /> Medication Given During Night</p>
                        {entry.medication_given.map((med, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 mb-1 text-xs">
                            <span className="font-medium">{med.time}</span> — {getYPName(med.child_id)}: {med.medication} ({med.dose}). {med.notes}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* security checks */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-600" /> Security Checks</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {entry.security_checks.map((sec, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs bg-muted/40 rounded p-1.5">
                            {sec.status === "secure" ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-red-600 shrink-0" />
                            )}
                            <span>{sec.time} — {sec.item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* summary */}
                    <div>
                      <p className="font-medium mb-1">Night Summary</p>
                      <p className="text-xs text-muted-foreground">{entry.summary}</p>
                    </div>

                    {/* handover to morning */}
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <p className="font-medium text-xs text-green-800 mb-1">Handover to Morning Shift</p>
                      <p className="text-xs text-green-700">{entry.handover_to_morning}</p>
                    </div>

                    <SmartLinkPanel sourceType="night_log" sourceId={entry.id} childId="yp_alex" compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Night Care Standards</p>
          <p>Waking night staff must complete checks at the frequency set by each child&apos;s risk assessment and care plan. Standard checks are hourly for low-risk children, 45 minutes for medium risk, and 30 minutes for high-risk children. All checks must be recorded with the time, child&apos;s status, and any observations. Night staff must remain awake and alert throughout the waking night shift. Security checks must be completed at the start of the night and at least once during the shift. Any incidents must be documented immediately and escalated where appropriate. The night log forms part of the home&apos;s daily record and is subject to review by the RM, Reg 44 visitor, and Ofsted inspectors.</p>
        </div>
      </div>
      )}
    </PageShell>
  );
}
