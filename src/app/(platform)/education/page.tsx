"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EDUCATION TRACKER
// Tracks school attendance, exclusions, PEP meetings, attainment, and
// education placement for each young person. Supports Reg 8 (Education),
// the Virtual School Head relationship, and Ofsted ILACS evidence.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
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
import { useCreateEducationRecord } from "@/hooks/use-education";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  Search, ArrowUpDown, X, Plus, GraduationCap, BookOpen,
  CheckCircle2, AlertTriangle, Clock, User, Calendar,
  ChevronDown, ChevronUp, School, TrendingUp, TrendingDown,
  XCircle, Shield, Award, FileText, Target, Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type EntryType = "attendance" | "exclusion" | "pep_meeting" | "attainment" | "provision_change" | "achievement" | "concern";
type AttendanceStatus = "present" | "absent_authorised" | "absent_unauthorised" | "late" | "excluded" | "part_day";

interface EducationEntry {
  id: string;
  child_id: string;
  date: string;
  type: EntryType;
  title: string;
  description: string;
  attendance_status: AttendanceStatus | null;
  school_name: string;
  recorded_by: string;
  outcome: string | null;
  follow_up_date: string | null;
  linked_pep: boolean;
  created_at: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<EntryType, { label: string; colour: string; icon: React.ElementType }> = {
  attendance:       { label: "Attendance",        colour: "bg-blue-100 text-blue-700",   icon: CheckCircle2 },
  exclusion:        { label: "Exclusion",         colour: "bg-red-100 text-red-700",     icon: XCircle      },
  pep_meeting:      { label: "PEP Meeting",       colour: "bg-purple-100 text-purple-700", icon: FileText   },
  attainment:       { label: "Attainment",        colour: "bg-green-100 text-green-700", icon: Award        },
  provision_change: { label: "Provision Change",  colour: "bg-orange-100 text-orange-700", icon: School     },
  achievement:      { label: "Achievement",       colour: "bg-emerald-100 text-emerald-700", icon: TrendingUp },
  concern:          { label: "Concern",           colour: "bg-amber-100 text-amber-700", icon: AlertTriangle },
};

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: "Present", absent_authorised: "Absent (Authorised)", absent_unauthorised: "Absent (Unauthorised)",
  late: "Late", excluded: "Excluded", part_day: "Part Day",
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10);
};

const SEED: EducationEntry[] = [
  {
    id: "edu_001", child_id: "yp_alex", date: d(-1), type: "attendance", title: "Full day attendance",
    description: "Alex attended all lessons. Positive feedback from English teacher — engaged well in creative writing task.",
    attendance_status: "present", school_name: "Derby Alternative Provision",
    recorded_by: "staff_edward", outcome: null, follow_up_date: null, linked_pep: false, created_at: d(-1) + "T16:00:00Z",
  },
  {
    id: "edu_002", child_id: "yp_alex", date: d(-3), type: "exclusion", title: "Fixed-term exclusion — 1 day",
    description: "Alex excluded for one day following verbal altercation with teaching assistant. Refused to leave classroom when asked. School applied fixed-term exclusion under behaviour policy.",
    attendance_status: "excluded", school_name: "Derby Alternative Provision",
    recorded_by: "staff_edward", outcome: "Reintegration meeting booked with inclusion lead. Key worker to attend.", follow_up_date: d(-1), linked_pep: false, created_at: d(-3) + "T14:00:00Z",
  },
  {
    id: "edu_003", child_id: "yp_jordan", date: d(-2), type: "attendance", title: "Full day attendance",
    description: "Jordan attended full day. Completed maths assessment — scored 72%. Teacher notes improvement in concentration.",
    attendance_status: "present", school_name: "Highfields Academy",
    recorded_by: "staff_anna", outcome: null, follow_up_date: null, linked_pep: false, created_at: d(-2) + "T16:00:00Z",
  },
  {
    id: "edu_004", child_id: "yp_casey", date: d(-2), type: "attendance", title: "Late arrival — transport issue",
    description: "Casey arrived 25 minutes late due to vehicle breakdown on the school run. School notified in advance.",
    attendance_status: "late", school_name: "Allestree Woodlands",
    recorded_by: "staff_chervelle", outcome: null, follow_up_date: null, linked_pep: false, created_at: d(-2) + "T09:30:00Z",
  },
  {
    id: "edu_005", child_id: "yp_jordan", date: d(-7), type: "pep_meeting", title: "PEP Review — Spring Term",
    description: "Personal Education Plan review held with Virtual School Head, designated teacher, and key worker. Jordan making expected progress in English and exceeding in PE. Maths remains below expected — additional 1:1 tutoring agreed.",
    attendance_status: null, school_name: "Highfields Academy",
    recorded_by: "staff_anna", outcome: "1:1 maths tutoring to start next week. Reading challenge participation agreed. Next PEP review: Summer term.", follow_up_date: d(56), linked_pep: true, created_at: d(-7) + "T14:30:00Z",
  },
  {
    id: "edu_006", child_id: "yp_casey", date: d(-5), type: "attainment", title: "English mock result — Grade 5",
    description: "Casey achieved Grade 5 in English Language mock exam. Significant improvement from Grade 3 in autumn term. Teacher impressed with essay structure development.",
    attendance_status: null, school_name: "Allestree Woodlands",
    recorded_by: "staff_chervelle", outcome: "Positive feedback shared with Casey. Achievement celebrated at house meeting.", follow_up_date: null, linked_pep: true, created_at: d(-5) + "T15:30:00Z",
  },
  {
    id: "edu_007", child_id: "yp_alex", date: d(-10), type: "pep_meeting", title: "Emergency PEP — post-exclusion",
    description: "Emergency PEP called following second exclusion this term. Discussed triggers, reintegration support, and whether provision remains suitable. Virtual School Head recommended additional behaviour support and possible assessment for EHCP.",
    attendance_status: null, school_name: "Derby Alternative Provision",
    recorded_by: "staff_darren", outcome: "EHCP assessment referral to be made. Behaviour support plan updated. Reduced timetable for 2 weeks. Key worker to do daily school check-ins.", follow_up_date: d(14), linked_pep: true, created_at: d(-10) + "T10:00:00Z",
  },
  {
    id: "edu_008", child_id: "yp_casey", date: d(-1), type: "achievement", title: "Selected for school debate team",
    description: "Casey selected to represent Year 11 in inter-school debate competition. Topic: social media impact. Casey enthusiastic and has begun research.",
    attendance_status: null, school_name: "Allestree Woodlands",
    recorded_by: "staff_chervelle", outcome: "Competition date: 3 weeks. Staff to support with practice sessions at home.", follow_up_date: d(21), linked_pep: false, created_at: d(-1) + "T16:30:00Z",
  },
  {
    id: "edu_009", child_id: "yp_alex", date: d(-15), type: "concern", title: "Persistent absence pattern",
    description: "School flagged that Alex's attendance has dropped to 76% this term. Three unauthorised absences in last two weeks — Alex refusing to attend on mornings after difficult evenings. Pattern emerging.",
    attendance_status: null, school_name: "Derby Alternative Provision",
    recorded_by: "staff_edward", outcome: "Attendance meeting with school booked. Morning routine review with Alex. Consider transport support.", follow_up_date: d(-10), linked_pep: false, created_at: d(-15) + "T10:00:00Z",
  },
  {
    id: "edu_010", child_id: "yp_jordan", date: d(-4), type: "achievement", title: "PE Award — Student of the Week",
    description: "Jordan received Student of the Week award for PE. Teacher praised leadership during team sports and positive attitude. Jordan visibly proud — brought certificate home.",
    attendance_status: null, school_name: "Highfields Academy",
    recorded_by: "staff_anna", outcome: "Certificate displayed in Jordan's room. Achievement shared at team meeting. Positive feedback to social worker.", follow_up_date: null, linked_pep: false, created_at: d(-4) + "T16:00:00Z",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function EducationPage() {
  const { currentUser } = useAuthContext();
  const createRecord = useCreateEducationRecord();

  const [entries, setEntries] = useState<EducationEntry[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<"all" | "concerns" | "achievements">("all");

  // new entry form
  const [nChild, setNChild] = useState("");
  const [nType, setNType] = useState<EntryType | "">("");
  const [nTitle, setNTitle] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nAttendance, setNAttendance] = useState<AttendanceStatus | "">("");
  const [nOutcome, setNOutcome] = useState("");

  const childIds = useMemo(() => [...new Set(entries.map(e => e.child_id))], [entries]);

  /* ── filtering ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (tab === "concerns") list = list.filter(e => e.type === "concern" || e.type === "exclusion");
    if (tab === "achievements") list = list.filter(e => e.type === "achievement" || e.type === "attainment");
    if (childFilter !== "all") list = list.filter(e => e.child_id === childFilter);
    if (typeFilter !== "all") list = list.filter(e => e.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        getYPName(e.child_id).toLowerCase().includes(q) ||
        e.school_name.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.created_at.localeCompare(a.created_at);
        case "oldest": return a.created_at.localeCompare(b.created_at);
        case "child":  return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "type":   return a.type.localeCompare(b.type);
        default: return 0;
      }
    });
    return list;
  }, [entries, search, childFilter, typeFilter, sortBy, tab]);

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const thisWeek = entries.filter(e => {
      const diff = (Date.now() - new Date(e.date).getTime()) / 86400000;
      return diff >= 0 && diff <= 7;
    });
    return {
      total: entries.length,
      concerns: entries.filter(e => e.type === "concern" || e.type === "exclusion").length,
      achievements: entries.filter(e => e.type === "achievement" || e.type === "attainment").length,
      pepMeetings: entries.filter(e => e.type === "pep_meeting").length,
      weekAttendance: thisWeek.filter(e => e.type === "attendance").length,
    };
  }, [entries]);

  /* ── per-child attendance ───────────────────────────────────────────────── */
  const childStats = useMemo(() => {
    const map = new Map<string, { present: number; total: number; exclusions: number; school: string }>();
    entries.forEach(e => {
      const cur = map.get(e.child_id) || { present: 0, total: 0, exclusions: 0, school: e.school_name };
      if (e.attendance_status) {
        cur.total++;
        if (e.attendance_status === "present") cur.present++;
        if (e.attendance_status === "excluded") cur.exclusions++;
      }
      cur.school = e.school_name;
      map.set(e.child_id, cur);
    });
    return map;
  }, [entries]);

  /* ── export ─────────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<EducationEntry>[] = [
    { header: "ID", accessor: r => r.id },
    { header: "Child", accessor: r => getYPName(r.child_id) },
    { header: "Date", accessor: r => r.date },
    { header: "Type", accessor: r => TYPE_CONFIG[r.type].label },
    { header: "Title", accessor: r => r.title },
    { header: "Description", accessor: r => r.description },
    { header: "Attendance", accessor: r => r.attendance_status ? ATTENDANCE_LABELS[r.attendance_status] : "" },
    { header: "School", accessor: r => r.school_name },
    { header: "Recorded By", accessor: r => getStaffName(r.recorded_by) },
    { header: "Outcome", accessor: r => r.outcome || "" },
    { header: "Follow-up Date", accessor: r => r.follow_up_date || "" },
    { header: "Linked to PEP", accessor: r => r.linked_pep ? "Yes" : "No" },
  ];

  /* ── create ─────────────────────────────────────────────────────────────── */
  const handleCreate = () => {
    if (!nChild || !nType || !nTitle || !nDesc) return;
    const entry: EducationEntry = {
      id: `edu_${Date.now()}`,
      child_id: nChild,
      date: todayStr(),
      type: nType as EntryType,
      title: nTitle,
      description: nDesc,
      attendance_status: nAttendance ? (nAttendance as AttendanceStatus) : null,
      school_name: entries.find(e => e.child_id === nChild)?.school_name || "Unknown",
      recorded_by: currentUser?.id || "staff_darren",
      outcome: nOutcome || null,
      follow_up_date: null,
      linked_pep: nType === "pep_meeting",
      created_at: new Date().toISOString(),
    };
    setEntries(prev => [entry, ...prev]);
    createRecord.mutate({ child_id: nChild, record_type: nType as "attendance" | "exclusion" | "pep_meeting" | "achievement" | "concern" | "placement_change", title: nTitle, date: todayStr(), details: nDesc, staff_id: currentUser?.id || "staff_darren", status: "open" }, { onSuccess: () => toast.success("Education entry saved"), onError: () => toast.error("Failed to save entry") });
    setShowNew(false);
    setNChild(""); setNType(""); setNTitle(""); setNDesc(""); setNAttendance(""); setNOutcome("");
  };

  return (
    <PageShell
      title="Education Tracker"
      subtitle="Attendance, attainment, PEPs, and education oversight"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Education Tracker" subtitle="Oak House — Education Records" />
          <ExportButton data={filtered} columns={exportCols} filename="education-tracker" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Entry
          </Button>
        </div>
      }
    >
      {/* ── Stats ────────────────────────────────────────────────────────────── */}
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
          { key: "all", label: "All Entries", count: entries.length },
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
            {(Object.entries(TYPE_CONFIG) as [EntryType, { label: string }][]).map(([k, v]) => (
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
          const tc = TYPE_CONFIG[entry.type];
          const Icon = tc.icon;

          return (
            <div key={entry.id} className="rounded-lg border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : entry.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
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
                    {getYPName(entry.child_id)} · {entry.school_name} · {formatDate(entry.date)}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Details</p>
                    <p className="text-sm">{entry.description}</p>
                  </div>
                  {entry.outcome && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Outcome / Actions</p>
                      <p className="text-sm">{entry.outcome}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{getStaffName(entry.recorded_by)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(entry.date)}</span>
                    {entry.follow_up_date && (
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Follow-up: {formatDate(entry.follow_up_date)}</span>
                    )}
                  </div>
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
              <label className="text-sm font-medium mb-1 block">Child *</label>
              <Select value={nChild} onValueChange={setNChild}>
                <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Entry Type *</label>
              <Select value={nType} onValueChange={v => setNType(v as EntryType)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_CONFIG) as [EntryType, { label: string }][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {nType === "attendance" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Attendance Status</label>
                <Select value={nAttendance} onValueChange={v => setNAttendance(v as AttendanceStatus)}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ATTENDANCE_LABELS) as [AttendanceStatus, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input placeholder="Brief title" value={nTitle} onChange={e => setNTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description *</label>
              <Textarea placeholder="Full details..." value={nDesc} onChange={e => setNDesc(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Outcome / Actions</label>
              <Textarea placeholder="Any outcomes or follow-up actions..." value={nOutcome} onChange={e => setNOutcome(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nChild || !nType || !nTitle || !nDesc || createRecord.isPending}>{createRecord.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Entry"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
