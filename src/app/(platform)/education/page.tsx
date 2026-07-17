"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — EDUCATION TRACKER
// Tracks school attendance, exclusions, PEP meetings, attainment, and
// education placement for each young person. Supports Reg 8 (Education),
// the Virtual School Head relationship, and Ofsted ILACS evidence.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { WritingToChildPanel } from "@/components/writing-to-child/writing-to-child-panel";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { useEducationRecords, useCreateEducationRecord } from "@/hooks/use-education";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { EducationRecord, EducationRecordType, EducationAttendanceStatus } from "@/types/extended";
import {
  Search, ArrowUpDown, X, Plus, GraduationCap, BookOpen,
  CheckCircle2, AlertTriangle, Clock, User, Calendar,
  ChevronDown, ChevronUp, School, TrendingUp,
  XCircle, Shield, Award, FileText, Loader2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<EducationRecordType, { label: string; colour: string; icon: React.ElementType }> = {
  attendance:       { label: "Attendance",        colour: "bg-blue-100 text-blue-700",   icon: CheckCircle2 },
  exclusion:        { label: "Exclusion",         colour: "bg-red-100 text-red-700",     icon: XCircle      },
  pep_meeting:      { label: "PEP Meeting",       colour: "bg-purple-100 text-purple-700", icon: FileText   },
  attainment:       { label: "Attainment",        colour: "bg-green-100 text-green-700", icon: Award        },
  provision_change: { label: "Provision Change",  colour: "bg-orange-100 text-orange-700", icon: School     },
  achievement:      { label: "Achievement",       colour: "bg-emerald-100 text-emerald-700", icon: TrendingUp },
  concern:          { label: "Concern",           colour: "bg-amber-100 text-amber-700", icon: AlertTriangle },
  // §5.18 disruption events — school instability is a care-planning event.
  suspension:         { label: "Suspension",          colour: "bg-red-100 text-red-700",     icon: XCircle },
  managed_move:       { label: "Managed Move",        colour: "bg-orange-100 text-orange-700", icon: School },
  reduced_timetable:  { label: "Reduced Timetable",   colour: "bg-amber-100 text-amber-700", icon: AlertTriangle },
  informal_send_home: { label: "Informal Send-Home",  colour: "bg-red-100 text-red-700",     icon: AlertTriangle },
};

const ATTENDANCE_LABELS: Record<EducationAttendanceStatus, string> = {
  present: "Present", absent_authorised: "Absent (Authorised)", absent_unauthorised: "Absent (Unauthorised)",
  late: "Late", excluded: "Excluded", part_day: "Part Day",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function EducationPage() {
  const { currentUser } = useAuthContext();
  const { data: response, isLoading } = useEducationRecords();
  const createRecord = useCreateEducationRecord();

  const records = response?.data ?? [];

  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<"all" | "concerns" | "achievements">("all");

  // new entry form
  const [nChild, setNChild] = useState("");
  const [nType, setNType] = useState<EducationRecordType | "">("");
  const [nTitle, setNTitle] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nAttendance, setNAttendance] = useState<EducationAttendanceStatus | "">("");
  const [nOutcome, setNOutcome] = useState("");

  const childIds = useMemo(() => [...new Set(records.map(e => e.child_id))], [records]);

  /* ── filtering ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (tab === "concerns") list = list.filter(e => e.record_type === "concern" || e.record_type === "exclusion");
    if (tab === "achievements") list = list.filter(e => e.record_type === "achievement" || e.record_type === "attainment");
    if (childFilter !== "all") list = list.filter(e => e.child_id === childFilter);
    if (typeFilter !== "all") list = list.filter(e => e.record_type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.details ?? "").toLowerCase().includes(q) ||
        getYPName(e.child_id).toLowerCase().includes(q) ||
        (e.school ?? "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return (b.created_at ?? "").localeCompare(a.created_at ?? "");
        case "oldest": return (a.created_at ?? "").localeCompare(b.created_at ?? "");
        case "child":  return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "type":   return a.record_type.localeCompare(b.record_type);
        default: return 0;
      }
    });
    return list;
  }, [records, search, childFilter, typeFilter, sortBy, tab]);

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const thisWeek = records.filter(e => {
      const diff = (Date.now() - new Date(e.date).getTime()) / 86400000;
      return diff >= 0 && diff <= 7;
    });
    return {
      total: records.length,
      concerns: records.filter(e => e.record_type === "concern" || e.record_type === "exclusion").length,
      achievements: records.filter(e => e.record_type === "achievement" || e.record_type === "attainment").length,
      pepMeetings: records.filter(e => e.record_type === "pep_meeting").length,
      weekAttendance: thisWeek.filter(e => e.record_type === "attendance").length,
    };
  }, [records]);

  /* ── per-child attendance ───────────────────────────────────────────────── */
  const childStats = useMemo(() => {
    const map = new Map<string, { present: number; total: number; exclusions: number; school: string }>();
    records.forEach(e => {
      const cur = map.get(e.child_id) || { present: 0, total: 0, exclusions: 0, school: e.school ?? "" };
      if (e.attendance_status) {
        cur.total++;
        if (e.attendance_status === "present") cur.present++;
        if (e.attendance_status === "excluded") cur.exclusions++;
      }
      cur.school = e.school ?? "";
      map.set(e.child_id, cur);
    });
    return map;
  }, [records]);

  /* ── export ─────────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<EducationRecord>[] = [
    { header: "ID", accessor: (r: EducationRecord) => r.id },
    { header: "Child", accessor: (r: EducationRecord) => getYPName(r.child_id) },
    { header: "Date", accessor: (r: EducationRecord) => r.date },
    { header: "Type", accessor: (r: EducationRecord) => TYPE_CONFIG[r.record_type].label },
    { header: "Title", accessor: (r: EducationRecord) => r.title },
    { header: "Description", accessor: (r: EducationRecord) => r.details ?? "" },
    { header: "Attendance", accessor: (r: EducationRecord) => r.attendance_status ? ATTENDANCE_LABELS[r.attendance_status] : "" },
    { header: "School", accessor: (r: EducationRecord) => r.school ?? "" },
    { header: "Recorded By", accessor: (r: EducationRecord) => getStaffName(r.staff_id) },
    { header: "Outcome", accessor: (r: EducationRecord) => r.outcome ?? "" },
    { header: "Follow-up Date", accessor: (r: EducationRecord) => r.follow_up_date ?? "" },
    { header: "Linked to PEP", accessor: (r: EducationRecord) => r.linked_pep ? "Yes" : "No" },
  ];

  /* ── create ─────────────────────────────────────────────────────────────── */
  const handleCreate = () => {
    if (!nChild || !nType || !nTitle || !nDesc) return;
    createRecord.mutate(
      {
        child_id: nChild,
        record_type: nType as EducationRecordType,
        title: nTitle,
        date: todayStr(),
        details: nDesc,
        school: records.find(e => e.child_id === nChild)?.school || undefined,
        attendance_status: nAttendance ? (nAttendance as EducationAttendanceStatus) : null,
        linked_pep: nType === "pep_meeting",
        outcome: nOutcome || undefined,
        staff_id: currentUser?.id || "staff_darren",
        status: "open",
      },
      {
        onSuccess: () => toast.success("Education entry saved"),
        onError: () => toast.error("Failed to save entry"),
      },
    );
    setShowNew(false);
    setNChild(""); setNType(""); setNTitle(""); setNDesc(""); setNAttendance(""); setNOutcome("");
  };

  if (isLoading) {
    return (
      <PageShell title="Education Tracker" subtitle="Attendance, attainment, PEPs, and education oversight">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Education Tracker"
      subtitle="Attendance, attainment, PEPs, and education oversight"
      caraContext={{ pageTitle: "Education Tracker", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Education Tracker" subtitle="Education Records" />
          <ExportButton data={filtered} columns={exportCols} filename="education-tracker" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Entry
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "education", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >      <CaraPanel mode="assist" pageContext="Education Tracker — attendance, attainment, Personal Education Plans, school engagement, exclusions, Children Act 1989" recordType="education_record" userRole="registered_manager" className="mb-2" />      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Entries", value: stats.total, icon: BookOpen, c: "text-blue-600" },
          { label: "Concerns",      value: stats.concerns, icon: AlertTriangle, c: "text-red-600" },
          { label: "Achievements",  value: stats.achievements, icon: Award, c: "text-green-600" },
          { label: "PEP Meetings",  value: stats.pepMeetings, icon: FileText, c: "text-purple-600" },
          { label: "This Week",     value: stats.weekAttendance, icon: Calendar, c: "text-indigo-600" },
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

      {/* ── Concern alert ────────────────────────────────────────────────────── */}
      {stats.concerns > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {stats.concerns} education concern{stats.concerns !== 1 ? "s" : ""} or exclusion{stats.concerns !== 1 ? "s" : ""} recorded — review required.
          </p>
        </div>
      )}

      {/* ── Per-child attendance cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {childIds.map(cid => {
          const s = childStats.get(cid);
          const pct = s && s.total > 0 ? Math.round((s.present / s.total) * 100) : null;
          return (
            <div key={cid} className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm">{getYPName(cid)}</p>
                {pct !== null && (
                  <Badge variant="outline" className={cn("text-xs",
                    pct >= 95 ? "bg-green-50 text-green-700" :
                    pct >= 90 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                  )}>
                    {pct}% attendance
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span><School className="inline h-3 w-3 mr-0.5" />{s?.school || "—"}</span>
                {s && s.exclusions > 0 && (
                  <span className="text-red-600">{s.exclusions} exclusion{s.exclusions !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "all", label: "All Entries", count: records.length },
          { key: "concerns", label: "Concerns & Exclusions", count: stats.concerns },
          { key: "achievements", label: "Achievements", count: stats.achievements },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label} <span className="text-xs ml-1 text-muted-foreground">({t.count})</span>
          </button>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5"><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
        <Select value={childFilter} onValueChange={setChildFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Child" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(TYPE_CONFIG) as [EducationRecordType, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
        {(search || childFilter !== "all" || typeFilter !== "all") && " (filtered)"}
      </p>

      {/* ── Entry Cards ───────────────────────────────────────────────────────── */}
      <div className="space-y-3" id="education-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No entries found</p>
          </div>
        )}

        {filtered.map(entry => {
          const isOpen = expandedId === entry.id;
          const tc = TYPE_CONFIG[entry.record_type];
          const Icon = tc.icon;

          return (
            <div key={entry.id} className="rounded-lg border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : entry.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                aria-expanded={isOpen}
                aria-label={`Expand education entry: ${entry.title} for ${getYPName(entry.child_id)}`}
              >
                <div className={cn("rounded-full p-1.5 shrink-0", tc.colour)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{entry.title}</span>
                    <Badge variant="outline" className={cn("text-xs", tc.colour)}>{tc.label}</Badge>
                    {entry.linked_pep && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">PEP Linked</Badge>
                    )}
                    {entry.attendance_status && (
                      <Badge variant="outline" className="text-xs">{ATTENDANCE_LABELS[entry.attendance_status]}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getYPName(entry.child_id)} · {entry.school ?? "—"} · {formatDate(entry.date)}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Details</p>
                    <p className="text-sm">{entry.details}</p>
                  </div>
                  {entry.outcome && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Outcome / Actions</p>
                      <p className="text-sm">{entry.outcome}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{getStaffName(entry.staff_id)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(entry.date)}</span>
                    {entry.follow_up_date && (
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Follow-up: {formatDate(entry.follow_up_date)}</span>
                    )}
                  </div>
                  {(entry as never as { care_event_id?: string }).care_event_id && (
                    <Link
                      href={`/care-events/${(entry as never as { care_event_id: string }).care_event_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <Sparkles className="h-3 w-3" />
                      Logged from Care Event
                    </Link>
                  )}
                  <SmartLinkPanel sourceType="education" sourceId={entry.id} childId={entry.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ───────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Regulatory Context</p>
            <p>
              <strong>Regulation 8 (Education)</strong> requires the registered person to promote the educational
              achievement of each child. The home must monitor attendance, support PEP processes, liaise with the
              Virtual School Head, and ensure suitable education provision. <strong>Ofsted ILACS</strong> inspectors
              assess the quality of education support through attendance data, PEP evidence, and documented outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* ══ New Entry Dialog ══════════════════════════════════════════════════ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Education Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label htmlFor="edu-child" className="text-sm font-medium mb-1 block">Child *</label>
              <Select value={nChild} onValueChange={setNChild}>
                <SelectTrigger id="edu-child"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="edu-type" className="text-sm font-medium mb-1 block">Entry Type *</label>
              <Select value={nType} onValueChange={v => setNType(v as EducationRecordType)}>
                <SelectTrigger id="edu-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_CONFIG) as [EducationRecordType, { label: string }][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {nType === "attendance" && (
              <div>
                <label htmlFor="edu-attendance" className="text-sm font-medium mb-1 block">Attendance Status</label>
                <Select value={nAttendance} onValueChange={v => setNAttendance(v as EducationAttendanceStatus)}>
                  <SelectTrigger id="edu-attendance"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ATTENDANCE_LABELS) as [EducationAttendanceStatus, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label htmlFor="edu-title" className="text-sm font-medium mb-1 block">Title *</label>
              <Input id="edu-title" placeholder="Brief title" value={nTitle} onChange={e => setNTitle(e.target.value)} />
            </div>
            <div>
              <label htmlFor="edu-desc" className="text-sm font-medium mb-1 block">Description *</label>
              <Textarea id="edu-desc" placeholder="Full details..." value={nDesc} onChange={e => setNDesc(e.target.value)} rows={3} />
            </div>
            <div>
              <label htmlFor="edu-outcome" className="text-sm font-medium mb-1 block">Outcome / Actions</label>
              <Textarea id="edu-outcome" placeholder="Any outcomes or follow-up actions..." value={nOutcome} onChange={e => setNOutcome(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nChild || !nType || !nTitle || !nDesc || createRecord.isPending}>{createRecord.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Entry"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Care Events pipeline — education events routed here */}
      <CareEventsPanel
        title="Care Events — Education"
        category="education"
        days={28}
        defaultCollapsed
      />
      <div className="mt-4">
        <WritingToChildPanel defaultRecordType="education" showRecordTypeSelect={false} showAdvanced={false} title="Writing to the Child — check this education record" />
      </div>
    </PageShell>
  );
}
