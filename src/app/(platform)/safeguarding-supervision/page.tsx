"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, ChevronDown, ChevronUp, Shield, Clock, AlertTriangle, Users, Brain, Lock, Calendar, Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useSafeguardingSupervisionRecords } from "@/hooks/use-safeguarding-supervision-records";
import type { SafeguardingSupervisionRecord } from "@/types/extended";

/* ── helpers ─────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── component ───────────────────────────────────────────────────────────── */

export default function SafeguardingSupervisionPage() {
  const { data: records = [], isLoading } = useSafeguardingSupervisionRecords();
  const [superviseeFilter, setSuperviseeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const supervisees = useMemo(() => [...new Set(records.map(r => r.supervisee))], [records]);

  const filtered = useMemo(() => {
    let out = [...records];
    if (superviseeFilter !== "all") out = out.filter(r => r.supervisee === superviseeFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return out;
  }, [records, superviseeFilter, sortBy]);

  const sessionsThisMonth = records.filter(r => r.date >= d(-30)).length;
  const avgDuration = records.length ? Math.round(records.reduce((sum, r) => sum + r.duration_minutes, 0) / records.length) : 0;
  const highRiskCases = new Set(records.flatMap(r => r.cases_discussed)).size;
  const staffCovered = supervisees.length;

  const exportCols: ExportColumn<SafeguardingSupervisionRecord>[] = useMemo(() => [
    { header: "Date", accessor: (r) => r.date },
    { header: "Supervisee", accessor: (r) => getStaffName(r.supervisee) },
    { header: "Supervisor", accessor: (r) => getStaffName(r.supervisor) },
    { header: "Duration (min)", accessor: (r) => String(r.duration_minutes) },
    { header: "Cases Discussed", accessor: (r) => r.cases_discussed.map(id => getYPName(id)).join(", ") },
    { header: "Risk Themes", accessor: (r) => r.risk_themes.join("; ") },
    { header: "Emotional Impact", accessor: (r) => r.emotional_impact },
    { header: "Parallel Process Noted", accessor: (r) => r.parallel_process_noted || "—" },
    { header: "Actions Agreed", accessor: (r) => r.actions_agreed.map(a => `${a.action} (${getStaffName(a.owner)} by ${a.deadline})`).join("; ") },
    { header: "Next Session", accessor: (r) => r.next_session },
  ], []);

  if (isLoading) {
    return (
      <PageShell title="Safeguarding Supervision" subtitle="Specialist reflective supervision for staff working with children at high risk — distinct from line management">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Safeguarding Supervision"
      subtitle="Specialist reflective supervision for staff working with children at high risk — distinct from line management"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Safeguarding Supervision" />
          <ExportButton data={filtered} columns={exportCols} filename="safeguarding-supervision" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* info banner */}
        <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4 flex gap-3">
          <Shield className="h-5 w-5 text-indigo-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-indigo-900">Safeguarding supervision is a confidential reflective space</p>
            <p className="text-indigo-800">Distinct from line management, this supervision provides protected space for staff to reflect on the emotional impact of working with children at high risk. Content is held within statutory limits — disclosure is required only where a child is at risk of significant harm or where staff are unable to safeguard. Required by Working Together 2023 and Quality Standard 5.</p>
          </div>
        </div>

        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Sessions This Month", value: sessionsThisMonth, icon: Calendar, colour: "text-indigo-600" },
            { label: "Avg Duration (min)", value: avgDuration, icon: Clock, colour: "text-blue-600" },
            { label: "High-Risk Cases Discussed", value: highRiskCases, icon: AlertTriangle, colour: "text-amber-600" },
            { label: "Staff Covered", value: staffCovered, icon: Users, colour: "text-green-600" },
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
              <div className="w-56">
                <Label className="text-xs flex items-center gap-1"><Eye className="h-3 w-3" />Supervisee</Label>
                <Select value={superviseeFilter} onValueChange={setSuperviseeFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {supervisees.map(id => <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>)}
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

        {/* session cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expandedId === r.id;
            const hasParallel = r.parallel_process_noted.trim().length > 0;
            return (
              <Card key={r.id} className={cn(hasParallel && "border-purple-300 ring-1 ring-purple-200")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getStaffName(r.supervisee)}</CardTitle>
                        <Badge variant="outline" className="text-xs">Supervisor: {getStaffName(r.supervisor)}</Badge>
                        <Badge variant="outline" className="text-xs">{r.duration_minutes} min</Badge>
                        {r.cases_discussed.map(id => (
                          <Badge key={id} className="text-xs bg-amber-100 text-amber-800">{getYPName(id)}</Badge>
                        ))}
                        {hasParallel && (
                          <Badge className="text-xs bg-purple-100 text-purple-800 flex items-center gap-1">
                            <Brain className="h-3 w-3" />Parallel process
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex flex-wrap gap-1">
                      {r.risk_themes.map(t => (
                        <Badge key={t} variant="outline" className="text-xs bg-red-50 text-red-800 border-red-200">{t}</Badge>
                      ))}
                    </div>

                    <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                      <p className="text-xs font-semibold text-pink-800 mb-1">Emotional impact on staff</p>
                      <p className="text-sm text-pink-900">{r.emotional_impact}</p>
                    </div>

                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-2">Reflective questions explored</p>
                      <ul className="text-sm text-blue-900 space-y-1 list-disc list-inside">
                        {r.reflective_questions_explored.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>

                    {hasParallel && (
                      <div className="rounded-lg bg-purple-50 border border-purple-300 p-3">
                        <p className="text-xs font-semibold text-purple-800 mb-1 flex items-center gap-1">
                          <Brain className="h-3 w-3" />Parallel process noted (clinical signal)
                        </p>
                        <p className="text-sm text-purple-900">{r.parallel_process_noted}</p>
                      </div>
                    )}

                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-semibold text-green-800 mb-2">Actions agreed</p>
                      <ul className="text-sm text-green-900 space-y-1">
                        {r.actions_agreed.map((a, i) => (
                          <li key={i} className="flex flex-wrap gap-2">
                            <span>•</span>
                            <span className="flex-1">{a.action}</span>
                            <span className="text-xs text-green-700">{getStaffName(a.owner)} · by {a.deadline}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Supervisor observations</p>
                      <p className="text-sm text-amber-900">{r.supervisor_observations}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Next session</p>
                          <p className="text-sm text-slate-900">{r.next_session}</p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
                        <Lock className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Confidentiality</p>
                          <p className="text-sm text-slate-900">{r.confidentiality_note}</p>
                        </div>
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
          <p>Safeguarding supervision sits alongside, but is distinct from, line management supervision. It is required practice under Working Together to Safeguard Children (2023) and is a key component of meeting Quality Standard 5 — the protection of children. Specialist supervision provides reflective space focused on the emotional and clinical impact of safeguarding work, supports staff resilience, and surfaces clinical signals such as parallel process that line management is not designed to hold. Records are stored within restricted access and disclosure is governed by safeguarding statutory thresholds.</p>
        </div>
      </div>
    </PageShell>
  );
}
