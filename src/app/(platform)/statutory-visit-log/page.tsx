"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search, ChevronDown, ChevronUp, ArrowUpDown, Calendar,
  Clock, AlertTriangle, CheckCircle2, Shield, UserCheck,
  ClipboardList, Eye, Users, FileText, MessageSquare,
  Home, BookOpen, Heart, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useStatutoryVisitRecords } from "@/hooks/use-statutory-visit-records";
import type {
  StatutoryVisitRecord,
  StatutoryVisitType,
  StatutoryVisitChildPresented,
  StatutoryVisitActionAgreed,
} from "@/types/extended";
import {
  STATUTORY_VISIT_TYPE_LABEL,
  STATUTORY_VISIT_CHILD_PRESENTED_LABEL,
} from "@/types/extended";

/* ── local config (colours not serializable) ────────────────────────────── */

const PRESENTED_CLR: Record<StatutoryVisitChildPresented, string> = {
  settled: "bg-green-100 text-green-800",
  engaged: "bg-emerald-100 text-emerald-800",
  anxious: "bg-amber-100 text-amber-800",
  withdrawn: "bg-slate-100 text-[var(--cs-text-secondary)]",
  distressed: "bg-red-100 text-red-800",
};

const TYPE_CLR: Record<StatutoryVisitType, string> = {
  first_visit: "bg-purple-100 text-purple-800",
  first_6_week_review: "bg-indigo-100 text-indigo-800",
  routine_6_weekly: "bg-blue-100 text-blue-800",
  quarterly: "bg-cyan-100 text-cyan-800",
  six_monthly: "bg-teal-100 text-teal-800",
  pre_lac_review: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-navy)]",
  unannounced: "bg-rose-100 text-rose-800",
};

type SortOption = "date-desc" | "date-asc" | "due-soonest" | "type" | "child";

const fmt = (iso: string) => {
  if (!iso) return "—";
  const [y, m, day] = iso.split("-");
  return `${day}/${m}/${y}`;
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function StatutoryVisitLogPage() {
  const { data: records = [], isLoading } = useStatutoryVisitRecords();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterChild, setFilterChild] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const today = new Date().toISOString().slice(0, 10);

  /* ── filtered & sorted ─────────────────────────────────────────────────── */
  const processed = useMemo(() => {
    let result = [...records];

    if (filterChild !== "all") {
      result = result.filter((v) => v.child_id === filterChild);
    }
    if (filterType !== "all") {
      result = result.filter((v) => v.visit_type === filterType);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((v) =>
        v.social_worker.toLowerCase().includes(q) ||
        v.local_authority.toLowerCase().includes(q) ||
        STATUTORY_VISIT_TYPE_LABEL[v.visit_type].toLowerCase().includes(q) ||
        v.child_wishes_shared.toLowerCase().includes(q) ||
        v.social_worker_observations.toLowerCase().includes(q) ||
        v.key_discussions.some((k) => k.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case "date-desc":
        result.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case "date-asc":
        result.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "due-soonest":
        result.sort((a, b) => a.next_visit_due.localeCompare(b.next_visit_due));
        break;
      case "type":
        result.sort((a, b) => a.visit_type.localeCompare(b.visit_type));
        break;
      case "child":
        result.sort((a, b) => a.child_id.localeCompare(b.child_id));
        break;
    }

    return result;
  }, [records, search, sortBy, filterChild, filterType]);

  /* ── summary stats ─────────────────────────────────────────────────────── */
  const monthStart = today.slice(0, 7) + "-01";
  const visitsThisMonth = records.filter((v) => v.date >= monthStart).length;

  const aloneCount = records.filter((v) => v.saw_child_alone).length;
  const alonePct = records.length > 0 ? Math.round((aloneCount / records.length) * 100) : 0;

  const onTimeCount = records.filter((v) => v.within_timeframe).length;
  const onTimePct = records.length > 0 ? Math.round((onTimeCount / records.length) * 100) : 0;

  // closest next visit due (per young person)
  const uniqueChildren = [...new Set(records.map((v) => v.child_id))];
  const nextDueByChild = uniqueChildren.map((yp) => {
    const visits = records.filter((v) => v.child_id === yp);
    if (visits.length === 0) return null;
    const latest = visits.sort((a, b) => b.date.localeCompare(a.date))[0];
    return { yp, due: latest.next_visit_due };
  }).filter((x): x is { yp: string; due: string } => x !== null);

  const closestDue = nextDueByChild.length > 0
    ? nextDueByChild.reduce((min, cur) => cur.due < min.due ? cur : min)
    : null;

  // overdue / unfiled
  const overdueVisits = nextDueByChild.filter((n) => n.due < today);
  const unfiledReports = records.filter((v) => !v.report_filed_date);
  const declinedAlone = records.filter((v) => !v.saw_child_alone);

  /* ── export columns ────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<StatutoryVisitRecord>[] = [
    { header: "Date", accessor: (r: StatutoryVisitRecord) => r.date },
    { header: "Young Person", accessor: (r: StatutoryVisitRecord) => getYPName(r.child_id) },
    { header: "Visit Type", accessor: (r: StatutoryVisitRecord) => STATUTORY_VISIT_TYPE_LABEL[r.visit_type] },
    { header: "Social Worker", accessor: (r: StatutoryVisitRecord) => r.social_worker },
    { header: "Local Authority", accessor: (r: StatutoryVisitRecord) => r.local_authority },
    { header: "Duration (mins)", accessor: (r: StatutoryVisitRecord) => String(r.duration_minutes) },
    { header: "Saw Child Alone", accessor: (r: StatutoryVisitRecord) => r.saw_child_alone ? "Yes" : "No" },
    { header: "Alone Time (mins)", accessor: (r: StatutoryVisitRecord) => String(r.alone_time) },
    { header: "Child's Wishes", accessor: (r: StatutoryVisitRecord) => r.child_wishes_shared },
    { header: "Home Staff Present", accessor: (r: StatutoryVisitRecord) => r.home_staff_present.map((s: string) => getStaffName(s)).join(", ") },
    { header: "Areas Inspected", accessor: (r: StatutoryVisitRecord) => r.areas_inspected.join(", ") },
    { header: "Bedrooms Seen", accessor: (r: StatutoryVisitRecord) => r.bedrooms_seen ? "Yes" : "No" },
    { header: "Records Reviewed", accessor: (r: StatutoryVisitRecord) => r.records_reviewed.join(", ") },
    { header: "Child Presented", accessor: (r: StatutoryVisitRecord) => STATUTORY_VISIT_CHILD_PRESENTED_LABEL[r.child_presented] },
    { header: "Key Discussions", accessor: (r: StatutoryVisitRecord) => r.key_discussions.join("; ") },
    { header: "SW Observations", accessor: (r: StatutoryVisitRecord) => r.social_worker_observations },
    { header: "Actions Agreed", accessor: (r: StatutoryVisitRecord) => r.actions_agreed.map((a: StatutoryVisitActionAgreed) => `${a.action} (owner: ${a.owner.startsWith("staff_") ? getStaffName(a.owner) : a.owner}, by ${a.deadline})`).join("; ") },
    { header: "Next Visit Due", accessor: (r: StatutoryVisitRecord) => r.next_visit_due },
    { header: "Report Filed", accessor: (r: StatutoryVisitRecord) => r.report_filed_date || "Not filed" },
    { header: "Within Timeframe", accessor: (r: StatutoryVisitRecord) => r.within_timeframe ? "Yes" : "No" },
  ];

  if (isLoading) {
    return (
      <PageShell title="Statutory Visit Log" subtitle="Local authority social worker visits to each child — Care Planning Regulations 2010 and Quality Standard 4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Statutory Visit Log"
      subtitle="Local authority social worker visits to each child — Care Planning Regulations 2010 and Quality Standard 4"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Statutory Visit Log" />
          <ExportButton data={processed} columns={exportCols} filename="statutory-visit-log" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* ── Summary stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Visits This Month", value: visitsThisMonth, icon: Calendar, clr: "text-blue-600" },
            { label: "Saw Child Alone", value: `${alonePct}%`, icon: UserCheck, clr: alonePct >= 80 ? "text-green-600" : "text-amber-600" },
            { label: "Within Timeframe", value: `${onTimePct}%`, icon: CheckCircle2, clr: onTimePct >= 90 ? "text-green-600" : "text-amber-600" },
            {
              label: "Next Visit Due",
              value: closestDue ? fmt(closestDue.due) : "—",
              icon: Clock,
              clr: closestDue && closestDue.due < today ? "text-red-600" : "text-blue-600",
              sub: closestDue ? getYPName(closestDue.yp) : undefined,
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                {s.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Alerts ────────────────────────────────────────────────────── */}
        {(overdueVisits.length > 0 || unfiledReports.length > 0 || declinedAlone.length > 0) && (
          <div className="space-y-2">
            {overdueVisits.length > 0 && (
              <Card className="border-l-4 border-l-red-500 bg-red-50">
                <CardContent className="pt-3 pb-3">
                  <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {overdueVisits.length} child{overdueVisits.length !== 1 ? "ren have" : " has"} an overdue statutory visit
                  </p>
                  <ul className="text-xs text-red-700 mt-1.5 space-y-0.5">
                    {overdueVisits.map((o) => (
                      <li key={o.yp}>· {getYPName(o.yp)} — was due {fmt(o.due)}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {unfiledReports.length > 0 && (
              <Card className="border-l-4 border-l-amber-400 bg-amber-50">
                <CardContent className="pt-3 pb-3">
                  <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {unfiledReports.length} visit report{unfiledReports.length !== 1 ? "s" : ""} not yet filed by social worker
                  </p>
                  <ul className="text-xs text-amber-700 mt-1.5 space-y-0.5">
                    {unfiledReports.map((u) => (
                      <li key={u.id}>· {getYPName(u.child_id)} — visit {fmt(u.date)} ({u.social_worker})</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {declinedAlone.length > 0 && (
              <Card className="border-l-4 border-l-amber-400 bg-amber-50">
                <CardContent className="pt-3 pb-3">
                  <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    {declinedAlone.length} visit{declinedAlone.length !== 1 ? "s" : ""} where SW did not see child alone
                  </p>
                  <p className="text-xs text-amber-700 mt-1.5">
                    Statutory expectation is that SW sees and speaks with the child alone unless the child refuses or it is contrary to their welfare.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Filters & Sort ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search visits, SW, observations..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={filterChild} onValueChange={setFilterChild}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All children" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All children</SelectItem>
              {uniqueChildren.map((yp) => (
                <SelectItem key={yp} value={yp}>{getYPName(yp)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All visit types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visit types</SelectItem>
              {(Object.entries(STATUTORY_VISIT_TYPE_LABEL) as [StatutoryVisitType, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest first</SelectItem>
                <SelectItem value="date-asc">Oldest first</SelectItem>
                <SelectItem value="due-soonest">Next due soonest</SelectItem>
                <SelectItem value="type">Visit type</SelectItem>
                <SelectItem value="child">Young person</SelectItem>
              </SelectContent>
            </Select>
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
            const presentedClr = PRESENTED_CLR[visit.child_presented];
            const typeClr = TYPE_CLR[visit.visit_type];
            const isOverdue = visit.next_visit_due < today;
            const reportLate = !visit.report_filed_date;

            const borderClr = !visit.within_timeframe || reportLate
              ? "border-l-red-500"
              : !visit.saw_child_alone
              ? "border-l-amber-400"
              : "border-l-green-400";

            return (
              <Card key={visit.id} className={cn("border-l-4", borderClr)}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(visit.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(visit.child_id)}
                        <span className="text-muted-foreground font-normal text-sm">·</span>
                        <span className="text-sm font-normal text-muted-foreground">{fmt(visit.date)}</span>
                        <Badge variant="outline" className={typeClr}>
                          {STATUTORY_VISIT_TYPE_LABEL[visit.visit_type]}
                        </Badge>
                        <Badge variant="outline" className={presentedClr}>
                          Presented: {STATUTORY_VISIT_CHILD_PRESENTED_LABEL[visit.child_presented]}
                        </Badge>
                        {visit.saw_child_alone ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3 mr-0.5" /> Saw alone {visit.alone_time}m
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800">
                            <AlertTriangle className="h-3 w-3 mr-0.5" /> Not seen alone
                          </Badge>
                        )}
                        {!visit.within_timeframe && (
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            Out of timeframe
                          </Badge>
                        )}
                        {reportLate && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800">
                            Report not filed
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        SW: {visit.social_worker} · {visit.local_authority} · {visit.duration_minutes} mins
                        {" · "}Next due: <span className={cn(isOverdue && "text-red-600 font-medium")}>{fmt(visit.next_visit_due)}</span>
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* Child's wishes & feelings */}
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="font-medium text-purple-800 mb-1 flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" /> Child&apos;s Wishes &amp; Feelings
                      </p>
                      <p className="text-purple-700 text-xs">{visit.child_wishes_shared}</p>
                    </div>

                    {/* Areas inspected & bedrooms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Home className="h-3.5 w-3.5" /> Areas Inspected
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {visit.areas_inspected.map((area) => (
                            <Badge key={area} variant="outline" className="text-xs bg-slate-50">
                              {area}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Bedroom seen: <span className={cn("font-medium", visit.bedrooms_seen ? "text-green-700" : "text-red-700")}>{visit.bedrooms_seen ? "Yes" : "No"}</span>
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> Records Reviewed
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {visit.records_reviewed.map((rec) => (
                            <Badge key={rec} variant="outline" className="text-xs bg-slate-50">
                              {rec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Home staff present */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Home Staff Present
                      </p>
                      <p className="text-muted-foreground">
                        {visit.home_staff_present.length > 0
                          ? visit.home_staff_present.map((s) => getStaffName(s)).join(", ")
                          : "None recorded"}
                      </p>
                    </div>

                    {/* Key discussions */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" /> Key Discussions
                      </p>
                      <ul className="space-y-1">
                        {visit.key_discussions.map((kd, i) => (
                          <li key={i} className="text-muted-foreground text-xs flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                            {kd}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* SW observations */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium text-blue-800 mb-1 flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> Social Worker Observations
                      </p>
                      <p className="text-blue-700 text-xs">{visit.social_worker_observations}</p>
                    </div>

                    {/* Actions agreed */}
                    {visit.actions_agreed.length > 0 && (
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="font-medium text-emerald-800 mb-2 flex items-center gap-1">
                          <ClipboardList className="h-3.5 w-3.5" /> Actions Agreed
                        </p>
                        <div className="space-y-2">
                          {visit.actions_agreed.map((a, i) => (
                            <div key={i} className="text-xs bg-white rounded p-2 border border-emerald-100">
                              <p className="text-emerald-900 font-medium">{a.action}</p>
                              <p className="text-emerald-600 mt-1">
                                Owner: {a.owner.startsWith("staff_") ? getStaffName(a.owner) : a.owner}
                                {" · "}Deadline: {fmt(a.deadline)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance footer */}
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-2 border-t flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Next visit due: <span className={cn(isOverdue && "text-red-600 font-medium")}>{fmt(visit.next_visit_due)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        Report filed: {visit.report_filed_date ? fmt(visit.report_filed_date) : <span className="text-amber-600 font-medium">Not yet filed</span>}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5" />
                        Within timeframe: <span className={cn("font-medium", visit.within_timeframe ? "text-green-700" : "text-red-700")}>{visit.within_timeframe ? "Yes" : "No"}</span>
                      </span>
                    </div>

                    {/* SmartLinkPanel — child-level */}
                    <SmartLinkPanel
                      sourceType="statutory-visit-record"
                      sourceId={visit.id}
                      childId={visit.child_id}
                      compact
                    />
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
              <li><span className="font-medium">Care Planning, Placement &amp; Case Review (England) Regulations 2010, Reg 28</span> — Statutory visiting duties: the responsible authority must ensure a visit by a representative within 7 working days of placement, then within 6 weeks, then at intervals of not more than 6 weeks during the first year, and thereafter at intervals of not more than 3 months (or more often if the placement plan or child requires).</li>
              <li><span className="font-medium">Reg 28(4)</span> — On each visit the representative must, so far as reasonably practicable, see and speak to the child alone (unless the child, being of sufficient age and understanding, refuses).</li>
              <li><span className="font-medium">Quality Standard 4 (Children&apos;s Homes Regulations 2015)</span> — The enjoyment and achievement standard requires the home to support each child to participate in decisions about their care and have their wishes and feelings heard.</li>
              <li><span className="font-medium">Quality Standard 5</span> — The home enables children to maintain and develop relationships with those important to them, including their social worker, and supports effective placement reviews.</li>
            </ul>
            <p className="text-xs text-[var(--cs-text-muted)] mt-2">
              The home keeps its own log of statutory visits to evidence active partnership with placing authorities, monitor compliance with statutory timeframes, and ensure each child&apos;s voice is consistently captured.
            </p>
          </CardContent>
        </Card>

      </div>
    </PageShell>
  );
}
