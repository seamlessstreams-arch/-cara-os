"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, ChevronDown, ChevronUp, Phone, AlertTriangle, ShieldCheck, Clock, Users, Filter, PhoneCall, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useOnCallShifts } from "@/hooks/use-on-call-shifts";
import type { OnCallShift, OnCallRole, OnCallShiftPattern } from "@/types/extended";
import { ON_CALL_ROLE_LABEL, ON_CALL_SHIFT_PATTERN_LABEL } from "@/types/extended";

/* ── component ─────────────────────────────────────────────────────────────── */

export default function OnCallRotaPage() {
  const { data: res, isLoading } = useOnCallShifts();
  const data: OnCallShift[] = res?.data ?? [];

  const [roleFilter, setRoleFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <PageShell title="On-Call Rota" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const staffIds = [...new Set(data.map(r => r.on_call_staff))];
  const allRoles: OnCallRole[] = ["first_line_rm", "second_line_deputy", "senior_practitioner_cover"];

  const filtered = useMemo(() => {
    let out = [...data];
    if (roleFilter !== "all") out = out.filter(r => r.role === roleFilter);
    if (staffFilter !== "all") out = out.filter(r => r.on_call_staff === staffFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.date_from.localeCompare(b.date_from) : b.date_from.localeCompare(a.date_from));
    return out;
  }, [data, roleFilter, staffFilter, sortBy]);

  const fourteenDaysAgo = new Date(); fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().slice(0, 10);
  const shiftsThisFortnight = data.filter(r => r.date_from >= fourteenDaysAgoStr).length;
  const totalCalls = data.reduce((sum, r) => sum + r.calls_received.length, 0);
  const criticalIncidents = data.reduce((sum, r) => sum + r.critical_incidents_handled, 0);
  const avgCallsPerShift = data.length ? (totalCalls / data.length).toFixed(1) : "0";

  const exportCols: ExportColumn<OnCallShift>[] = useMemo(() => [
    { header: "From", accessor: (r: OnCallShift) => r.date_from },
    { header: "To", accessor: (r: OnCallShift) => r.date_to },
    { header: "Role", accessor: (r: OnCallShift) => ON_CALL_ROLE_LABEL[r.role] },
    { header: "On-Call Staff", accessor: (r: OnCallShift) => getStaffName(r.on_call_staff) },
    { header: "Backup Staff", accessor: (r: OnCallShift) => getStaffName(r.backup_staff) },
    { header: "Contact Number", accessor: (r: OnCallShift) => r.contact_number },
    { header: "Shift Pattern", accessor: (r: OnCallShift) => ON_CALL_SHIFT_PATTERN_LABEL[r.shift_pattern] },
    { header: "Calls Received", accessor: (r: OnCallShift) => r.calls_received.length },
    { header: "Critical Incidents", accessor: (r: OnCallShift) => r.critical_incidents_handled },
    { header: "Routine Calls", accessor: (r: OnCallShift) => r.routine_calls_handled },
    { header: "Advisory Calls", accessor: (r: OnCallShift) => r.advisory_calls_handled },
    { header: "Staff Wellbeing", accessor: (r: OnCallShift) => r.staff_wellbeing_during_on_call },
    { header: "Feedback", accessor: (r: OnCallShift) => r.feedback_on_arrangements },
    { header: "Review Notes", accessor: (r: OnCallShift) => r.review_notes },
  ], []);

  return (
    <PageShell
      title="On-Call Rota"
      subtitle="Duty cover providing 24/7 escalation route — managers and senior practitioners ensuring staff and children are never without support"
      actions={[
        <PrintButton key="p" title="On-Call Rota" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="on-call-rota" />,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* info banner */}
        <div className="rounded-lg bg-sky-50 border border-sky-200 p-4 flex gap-3">
          <ShieldCheck className="h-5 w-5 text-sky-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-sky-900">On-call cover is a vital safety net</p>
            <p className="text-sky-800">A robust on-call rota ensures that staff supporting children in the home always have access to a senior decision-maker. First-line on-call sits with the Registered Manager, with deputy and senior practitioner cover layered behind. Required by Quality Standard 13 (the leadership and management standard) and underpins Reg 33 oversight expectations.</p>
          </div>
        </div>

        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Shifts This Fortnight", value: shiftsThisFortnight, icon: Clock, colour: "text-sky-600" },
            { label: "Calls Received Total", value: totalCalls, icon: PhoneCall, colour: "text-blue-600" },
            { label: "Critical Incidents", value: criticalIncidents, icon: AlertTriangle, colour: "text-amber-600" },
            { label: "Avg Calls / Shift", value: avgCallsPerShift, icon: Phone, colour: "text-green-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* filters / sort */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="w-64">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {allRoles.map(r => <SelectItem key={r} value={r}>{ON_CALL_ROLE_LABEL[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-56">
                <Label className="text-xs flex items-center gap-1"><Users className="h-3 w-3" />On-Call Staff</Label>
                <Select value={staffFilter} onValueChange={setStaffFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {staffIds.map(id => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* shift cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expandedId === r.id;
            const hasCritical = r.critical_incidents_handled > 0;
            return (
              <Card key={r.id} className={cn(hasCritical && "border-amber-300 ring-1 ring-amber-200")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getStaffName(r.on_call_staff)}</CardTitle>
                        <Badge variant="outline" className="text-xs">{ON_CALL_ROLE_LABEL[r.role]}</Badge>
                        <Badge variant="outline" className="text-xs">{ON_CALL_SHIFT_PATTERN_LABEL[r.shift_pattern]}</Badge>
                        <Badge className="text-xs bg-blue-100 text-blue-800">{r.calls_received.length} call{r.calls_received.length === 1 ? "" : "s"}</Badge>
                        {hasCritical && (
                          <Badge className="text-xs bg-amber-100 text-amber-800 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />Critical incident
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{r.date_from}{r.date_from !== r.date_to ? ` → ${r.date_to}` : ""}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-3 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
                        <Users className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Backup</p>
                          <p className="text-sm text-slate-900">{getStaffName(r.backup_staff)}</p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
                        <Phone className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Contact number</p>
                          <p className="text-sm text-slate-900 font-mono">{r.contact_number}</p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
                        <Clock className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Pattern</p>
                          <p className="text-sm text-slate-900">{ON_CALL_SHIFT_PATTERN_LABEL[r.shift_pattern]}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800">Critical</p>
                        <p className="text-2xl font-bold text-amber-900">{r.critical_incidents_handled}</p>
                      </div>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-800">Advisory</p>
                        <p className="text-2xl font-bold text-blue-900">{r.advisory_calls_handled}</p>
                      </div>
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-semibold text-green-800">Routine</p>
                        <p className="text-2xl font-bold text-green-900">{r.routine_calls_handled}</p>
                      </div>
                    </div>

                    {r.calls_received.length > 0 ? (
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                          <PhoneCall className="h-3 w-3" />Call log ({r.calls_received.length})
                        </p>
                        <ul className="space-y-2">
                          {r.calls_received.map((c, i) => (
                            <li key={i} className="border-l-2 border-slate-300 pl-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono text-slate-600">{c.datetime}</span>
                                <Badge variant="outline" className="text-xs">{c.call_type}</Badge>
                                <Badge variant="outline" className="text-xs">{c.duration_mins} min</Badge>
                                {c.escalated && <Badge className="text-xs bg-amber-100 text-amber-800">Escalated</Badge>}
                              </div>
                              <p className="text-xs text-slate-700 mt-0.5">From: {c.from_contact}</p>
                              <p className="text-sm text-slate-900 mt-1">{c.outcome}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-900">
                        Quiet shift — no calls received.
                      </div>
                    )}

                    <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 flex gap-2 items-start">
                      <Heart className="h-4 w-4 text-pink-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-pink-800">Staff wellbeing during on-call</p>
                        <p className="text-sm text-pink-900">{r.staff_wellbeing_during_on_call}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Feedback on arrangements</p>
                        <p className="text-sm text-blue-900">{r.feedback_on_arrangements}</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Review notes</p>
                        <p className="text-sm text-amber-900">{r.review_notes}</p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory framework</p>
          <p>The on-call rota is the operational expression of Quality Standard 13 — the leadership and management standard — which requires that the home is led and managed by people who provide direction, support and guidance, including outside of office hours. It also supports the Independent Person's monitoring under Reg 33 by evidencing that escalation routes exist and are used appropriately. On-call records form part of the home's audit trail, demonstrating the responsiveness of senior staff, the calibration of decision thresholds, and the wellbeing impact of out-of-hours cover on the people who provide it.</p>
        </div>
      </div>
    </PageShell>
  );
}
