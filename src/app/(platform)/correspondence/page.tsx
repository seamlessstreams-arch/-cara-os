"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CORRESPONDENCE LOG
// Tracks all incoming and outgoing professional correspondence: emails,
// letters, phone calls, and formal notices from social workers, IROs,
// local authorities, Ofsted, courts, and other external stakeholders.
// Supports Reg 36 (Review of Quality of Care), Schedule 4, and provides
// evidence trail for inspection.
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
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  Search, ArrowUpDown, X, Plus, Mail, Phone, FileText,
  CheckCircle2, AlertTriangle, Clock, User, Calendar,
  ChevronDown, ChevronUp, Shield, ArrowUpRight, ArrowDownLeft,
  Send, Inbox, Reply,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Direction = "incoming" | "outgoing";
type Method = "email" | "letter" | "phone_call" | "meeting" | "formal_notice" | "other";
type Priority = "urgent" | "normal" | "low";
type CorrStatus = "pending" | "actioned" | "filed" | "awaiting_response";

interface CorrespondenceEntry {
  id: string;
  date: string;
  time: string;
  direction: Direction;
  method: Method;
  priority: Priority;
  status: CorrStatus;
  subject: string;
  from_name: string;
  from_role: string;
  to_name: string;
  to_role: string;
  summary: string;
  action_required: string | null;
  action_due: string | null;
  child_id: string | null;
  recorded_by: string;
  created_at: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const METHOD_CONFIG: Record<Method, { label: string; icon: React.ElementType; colour: string }> = {
  email:         { label: "Email",         icon: Mail,     colour: "bg-blue-100 text-blue-700"   },
  letter:        { label: "Letter",        icon: FileText, colour: "bg-amber-100 text-amber-700" },
  phone_call:    { label: "Phone Call",    icon: Phone,    colour: "bg-green-100 text-green-700" },
  meeting:       { label: "Meeting",       icon: User,     colour: "bg-purple-100 text-purple-700" },
  formal_notice: { label: "Formal Notice", icon: Shield,   colour: "bg-red-100 text-red-700"     },
  other:         { label: "Other",         icon: FileText, colour: "bg-gray-100 text-gray-600"   },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; colour: string }> = {
  urgent: { label: "Urgent", colour: "bg-red-100 text-red-700"    },
  normal: { label: "Normal", colour: "bg-blue-100 text-blue-700"  },
  low:    { label: "Low",    colour: "bg-gray-100 text-gray-600"  },
};

const STATUS_CONFIG: Record<CorrStatus, { label: string; colour: string }> = {
  pending:           { label: "Pending",           colour: "bg-yellow-100 text-yellow-700" },
  actioned:          { label: "Actioned",          colour: "bg-green-100 text-green-700"   },
  filed:             { label: "Filed",             colour: "bg-gray-100 text-gray-600"     },
  awaiting_response: { label: "Awaiting Response", colour: "bg-blue-100 text-blue-700"     },
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10);
};

const SEED: CorrespondenceEntry[] = [
  {
    id: "cor_001", date: d(-1), time: "09:15", direction: "incoming", method: "email",
    priority: "urgent", status: "actioned",
    subject: "Safeguarding disclosure — Alex W",
    from_name: "Karen Holding", from_role: "Social Worker (Derby City)",
    to_name: "Darren Laville", to_role: "Registered Manager",
    summary: "Follow-up email regarding Alex's safeguarding disclosure. SW requesting written chronology of events, risk assessment update, and confirmation of referral to MASH. Deadline: end of day.",
    action_required: "Chronology sent. Risk assessment updated and emailed back. MASH referral confirmed.",
    action_due: d(-1), child_id: "yp_alex", recorded_by: "staff_darren", created_at: d(-1) + "T09:15:00Z",
  },
  {
    id: "cor_002", date: d(-2), time: "14:30", direction: "outgoing", method: "phone_call",
    priority: "normal", status: "filed",
    subject: "Jordan's LAC review preparation",
    from_name: "Anna Richards", from_role: "Key Worker",
    to_name: "Michael Osei", to_role: "Social Worker (Notts CC)",
    summary: "Called to discuss preparation for Jordan's upcoming LAC review. Agreed on agenda items: placement stability, education progress, and contact arrangements. SW will send updated care plan by Friday.",
    action_required: null, action_due: null, child_id: "yp_jordan", recorded_by: "staff_anna", created_at: d(-2) + "T14:30:00Z",
  },
  {
    id: "cor_003", date: d(-3), time: "10:00", direction: "incoming", method: "letter",
    priority: "normal", status: "filed",
    subject: "Reg 44 visit report — March 2026",
    from_name: "Independent Visitor", from_role: "Regulation 44 Visitor",
    to_name: "Darren Laville", to_role: "Registered Manager",
    summary: "Monthly Reg 44 visit report received. Overall positive assessment. Three recommendations: update fire drill log, review medication storage temperature monitoring, improve signage for visitors.",
    action_required: "Three recommendations to be actioned within 28 days. Tasks created.",
    action_due: d(25), child_id: null, recorded_by: "staff_darren", created_at: d(-3) + "T10:00:00Z",
  },
  {
    id: "cor_004", date: d(-4), time: "16:45", direction: "outgoing", method: "email",
    priority: "normal", status: "awaiting_response",
    subject: "Casey's medication review — GP appointment outcome",
    from_name: "Chervelle Brooks", from_role: "Key Worker",
    to_name: "Fiona Brennan", to_role: "Social Worker (Derbyshire CC)",
    summary: "Emailed social worker with outcome of Casey's GP medication review. No dosage change. GP recommended sleep hygiene review. Follow-up appointment in 3 months. Requested SW confirmation of health plan update.",
    action_required: "Awaiting SW confirmation of health plan update",
    action_due: d(3), child_id: "yp_casey", recorded_by: "staff_chervelle", created_at: d(-4) + "T16:45:00Z",
  },
  {
    id: "cor_005", date: d(-5), time: "11:00", direction: "incoming", method: "phone_call",
    priority: "urgent", status: "actioned",
    subject: "School exclusion notification — Alex",
    from_name: "Mrs. Thompson", from_role: "Head of Inclusion (Derby AP)",
    to_name: "Edward Mombe", to_role: "Key Worker",
    summary: "School called to notify of Alex's fixed-term exclusion. One day for verbal altercation with TA. Reintegration meeting required before return. School offered reduced timetable option for two weeks.",
    action_required: "Reintegration meeting booked. SW and Virtual School Head notified. Emergency PEP requested.",
    action_due: d(-3), child_id: "yp_alex", recorded_by: "staff_edward", created_at: d(-5) + "T11:00:00Z",
  },
  {
    id: "cor_006", date: d(-7), time: "09:00", direction: "incoming", method: "formal_notice",
    priority: "urgent", status: "actioned",
    subject: "Ofsted notification — monitoring visit scheduled",
    from_name: "Ofsted", from_role: "HM Chief Inspector",
    to_name: "Darren Laville", to_role: "Registered Manager",
    summary: "Formal notification of Ofsted monitoring visit. Inspector assigned. Date confirmed for two weeks' time. Focus areas: safeguarding practice, quality of care records, and management oversight.",
    action_required: "Preparation plan created. Staff briefed. Documentation audit scheduled. Pre-inspection walkthrough booked.",
    action_due: d(7), child_id: null, recorded_by: "staff_darren", created_at: d(-7) + "T09:00:00Z",
  },
  {
    id: "cor_007", date: d(0), time: "08:30", direction: "incoming", method: "email",
    priority: "normal", status: "pending",
    subject: "Training certificates — Team Teach refresher",
    from_name: "Team Teach Ltd", from_role: "Training Provider",
    to_name: "Darren Laville", to_role: "Registered Manager",
    summary: "Certificates for recent Team Teach refresher training session received. Five staff members certified. Certificates valid until March 2027.",
    action_required: "Certificates to be filed in individual staff training records. Training matrix to be updated.",
    action_due: d(7), child_id: null, recorded_by: "staff_darren", created_at: d(0) + "T08:30:00Z",
  },
  {
    id: "cor_008", date: d(-1), time: "13:00", direction: "outgoing", method: "email",
    priority: "normal", status: "filed",
    subject: "Monthly placement summary — all children",
    from_name: "Darren Laville", from_role: "Registered Manager",
    to_name: "Multiple SWs", to_role: "Social Workers",
    summary: "Monthly placement summary sent to all allocated social workers. Covered: attendance updates, wellbeing observations, key achievements, and any concerns for each child.",
    action_required: null, action_due: null, child_id: null, recorded_by: "staff_darren", created_at: d(-1) + "T13:00:00Z",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CorrespondencePage() {
  const { currentUser } = useAuthContext();

  const [entries, setEntries] = useState<CorrespondenceEntry[]>(SEED);
  const [search, setSearch] = useState("");
  const [dirFilter, setDirFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<"all" | "pending" | "urgent">("all");

  // new form
  const [nDir, setNDir] = useState<Direction | "">("");
  const [nMethod, setNMethod] = useState<Method | "">("");
  const [nPriority, setNPriority] = useState<Priority>("normal");
  const [nSubject, setNSubject] = useState("");
  const [nFromName, setNFromName] = useState("");
  const [nFromRole, setNFromRole] = useState("");
  const [nToName, setNToName] = useState("");
  const [nToRole, setNToRole] = useState("");
  const [nSummary, setNSummary] = useState("");
  const [nAction, setNAction] = useState("");
  const [nChild, setNChild] = useState("");

  const childIds = ["yp_alex", "yp_jordan", "yp_casey"];

  /* ── filtering ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (tab === "pending") list = list.filter(e => e.status === "pending" || e.status === "awaiting_response");
    if (tab === "urgent") list = list.filter(e => e.priority === "urgent");
    if (dirFilter !== "all") list = list.filter(e => e.direction === dirFilter);
    if (methodFilter !== "all") list = list.filter(e => e.method === methodFilter);
    if (statusFilter !== "all") list = list.filter(e => e.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.subject.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.from_name.toLowerCase().includes(q) ||
        e.to_name.toLowerCase().includes(q) ||
        e.from_role.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.created_at.localeCompare(a.created_at);
        case "oldest": return a.created_at.localeCompare(b.created_at);
        case "priority": {
          const po: Record<Priority, number> = { urgent: 0, normal: 1, low: 2 };
          return po[a.priority] - po[b.priority];
        }
        default: return 0;
      }
    });
    return list;
  }, [entries, search, dirFilter, methodFilter, statusFilter, sortBy, tab]);

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total: entries.length,
    pending: entries.filter(e => e.status === "pending" || e.status === "awaiting_response").length,
    urgent: entries.filter(e => e.priority === "urgent").length,
    incoming: entries.filter(e => e.direction === "incoming").length,
    outgoing: entries.filter(e => e.direction === "outgoing").length,
  }), [entries]);

  /* ── export ─────────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<CorrespondenceEntry>[] = [
    { header: "ID", accessor: r => r.id },
    { header: "Date", accessor: r => r.date },
    { header: "Time", accessor: r => r.time },
    { header: "Direction", accessor: r => r.direction === "incoming" ? "Incoming" : "Outgoing" },
    { header: "Method", accessor: r => METHOD_CONFIG[r.method].label },
    { header: "Priority", accessor: r => PRIORITY_CONFIG[r.priority].label },
    { header: "Status", accessor: r => STATUS_CONFIG[r.status].label },
    { header: "Subject", accessor: r => r.subject },
    { header: "From", accessor: r => `${r.from_name} (${r.from_role})` },
    { header: "To", accessor: r => `${r.to_name} (${r.to_role})` },
    { header: "Summary", accessor: r => r.summary },
    { header: "Action Required", accessor: r => r.action_required || "" },
    { header: "Action Due", accessor: r => r.action_due || "" },
    { header: "Child", accessor: r => r.child_id ? getYPName(r.child_id) : "N/A" },
    { header: "Recorded By", accessor: r => getStaffName(r.recorded_by) },
  ];

  /* ── mark actioned ──────────────────────────────────────────────────────── */
  const markActioned = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: "actioned" as CorrStatus } : e));
  };

  /* ── create ─────────────────────────────────────────────────────────────── */
  const handleCreate = () => {
    if (!nDir || !nMethod || !nSubject || !nSummary) return;
    const entry: CorrespondenceEntry = {
      id: `cor_${Date.now()}`,
      date: todayStr(),
      time: new Date().toTimeString().slice(0, 5),
      direction: nDir as Direction,
      method: nMethod as Method,
      priority: nPriority,
      status: "pending",
      subject: nSubject,
      from_name: nFromName,
      from_role: nFromRole,
      to_name: nToName,
      to_role: nToRole,
      summary: nSummary,
      action_required: nAction || null,
      action_due: null,
      child_id: nChild || null,
      recorded_by: currentUser?.id || "staff_darren",
      created_at: new Date().toISOString(),
    };
    setEntries(prev => [entry, ...prev]);
    setShowNew(false);
    setNDir(""); setNMethod(""); setNPriority("normal"); setNSubject("");
    setNFromName(""); setNFromRole(""); setNToName(""); setNToRole("");
    setNSummary(""); setNAction(""); setNChild("");
  };

  return (
    <PageShell
      title="Correspondence Log"
      subtitle="Professional communications and formal correspondence"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Correspondence Log" subtitle="Oak House — Professional Communications" />
          <ExportButton data={filtered} columns={exportCols} filename="correspondence-log" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Log Correspondence
          </Button>
        </div>
      }
    >
      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total",    value: stats.total, icon: Mail, c: "text-blue-600" },
          { label: "Pending",  value: stats.pending, icon: Clock, c: "text-amber-600" },
          { label: "Urgent",   value: stats.urgent, icon: AlertTriangle, c: "text-red-600" },
          { label: "Incoming", value: stats.incoming, icon: Inbox, c: "text-green-600" },
          { label: "Outgoing", value: stats.outgoing, icon: Send, c: "text-indigo-600" },
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

      {/* ── Pending alert ─────────────────────────────────────────────────────── */}
      {stats.pending > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 mb-6 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {stats.pending} item{stats.pending !== 1 ? "s" : ""} pending action or awaiting response.
          </p>
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "all", label: "All", count: entries.length },
          { key: "pending", label: "Pending / Awaiting", count: stats.pending },
          { key: "urgent", label: "Urgent", count: stats.urgent },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
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
        <Select value={dirFilter} onValueChange={setDirFilter}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Direction" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="incoming">Incoming</SelectItem>
            <SelectItem value="outgoing">Outgoing</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {(Object.entries(METHOD_CONFIG) as [Method, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(STATUS_CONFIG) as [CorrStatus, { label: string }][]).map(([k, v]) => (
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
              <SelectItem value="priority">By Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        {(search || dirFilter !== "all" || methodFilter !== "all" || statusFilter !== "all") && " (filtered)"}
      </p>

      {/* ── Cards ─────────────────────────────────────────────────────────────── */}
      <div className="space-y-3" id="correspondence-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No correspondence found</p>
          </div>
        )}

        {filtered.map(entry => {
          const isOpen = expandedId === entry.id;
          const mc = METHOD_CONFIG[entry.method];
          const pc = PRIORITY_CONFIG[entry.priority];
          const sc = STATUS_CONFIG[entry.status];
          const Icon = mc.icon;

          return (
            <div key={entry.id} className={cn("rounded-lg border bg-card overflow-hidden",
              entry.direction === "incoming" ? "border-l-4 border-l-green-400" : "border-l-4 border-l-blue-400"
            )}>
              <button
                onClick={() => setExpandedId(isOpen ? null : entry.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className={cn("rounded-full p-1.5 shrink-0", mc.colour)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{entry.subject}</span>
                    <Badge variant="outline" className="text-xs">
                      {entry.direction === "incoming" ? <ArrowDownLeft className="h-3 w-3 mr-0.5" /> : <ArrowUpRight className="h-3 w-3 mr-0.5" />}
                      {entry.direction === "incoming" ? "In" : "Out"}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", mc.colour)}>{mc.label}</Badge>
                    <Badge variant="outline" className={cn("text-xs", sc.colour)}>{sc.label}</Badge>
                    {entry.priority === "urgent" && (
                      <Badge variant="outline" className={cn("text-xs", pc.colour)}>{pc.label}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.direction === "incoming" ? `From: ${entry.from_name}` : `To: ${entry.to_name}`} · {formatDate(entry.date)}
                    {entry.child_id && ` · ${getYPName(entry.child_id)}`}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-muted-foreground">From:</span> <span className="font-medium">{entry.from_name}</span> ({entry.from_role})</div>
                    <div><span className="text-muted-foreground">To:</span> <span className="font-medium">{entry.to_name}</span> ({entry.to_role})</div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Summary</p>
                    <p className="text-sm">{entry.summary}</p>
                  </div>
                  {entry.action_required && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Action</p>
                      <p className="text-sm">{entry.action_required}</p>
                      {entry.action_due && <p className="text-xs text-muted-foreground mt-1">Due: {formatDate(entry.action_due)}</p>}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{getStaffName(entry.recorded_by)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(entry.date)} at {entry.time}</span>
                  </div>
                  {(entry.status === "pending" || entry.status === "awaiting_response") && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => markActioned(entry.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Actioned
                      </Button>
                    </div>
                  )}
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
              <strong>Regulation 36 (Review of Quality of Care)</strong> and <strong>Schedule 4</strong> require the
              registered person to maintain records of all significant communications. A correspondence log provides
              evidence of professional engagement, timely responses, and accountability. Ofsted inspectors expect
              to see an audit trail of communications with social workers, IROs, and external professionals.
            </p>
          </div>
        </div>
      </div>

      {/* ══ New Dialog ════════════════════════════════════════════════════════ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Correspondence</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Direction *</label>
                <Select value={nDir} onValueChange={v => setNDir(v as Direction)}>
                  <SelectTrigger><SelectValue placeholder="In / Out" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Method *</label>
                <Select value={nMethod} onValueChange={v => setNMethod(v as Method)}>
                  <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(METHOD_CONFIG) as [Method, { label: string }][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subject *</label>
              <Input placeholder="Subject line" value={nSubject} onChange={e => setNSubject(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">From Name</label>
                <Input placeholder="Sender" value={nFromName} onChange={e => setNFromName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">From Role</label>
                <Input placeholder="Role" value={nFromRole} onChange={e => setNFromRole(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">To Name</label>
                <Input placeholder="Recipient" value={nToName} onChange={e => setNToName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">To Role</label>
                <Input placeholder="Role" value={nToRole} onChange={e => setNToRole(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <Select value={nPriority} onValueChange={v => setNPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Linked Child</label>
              <Select value={nChild} onValueChange={setNChild}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Summary *</label>
              <Textarea placeholder="Summary of the communication..." value={nSummary} onChange={e => setNSummary(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Action Required</label>
              <Textarea placeholder="Any follow-up actions..." value={nAction} onChange={e => setNAction(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nDir || !nMethod || !nSubject || !nSummary}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
