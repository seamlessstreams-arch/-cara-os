"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — APPOINTMENTS
// Tracks all appointments for young people: medical, dental, CAMHS, LAC
// reviews, court, optician, social worker visits, etc. Supports Reg 7
// (Health), Reg 8 (Education), Reg 36 (Review of Quality of Care),
// and Schedule 3 (Health Care) evidence.
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
  Search, ArrowUpDown, X, Plus, CalendarDays,
  CheckCircle2, AlertTriangle, Clock, User, Calendar,
  ChevronDown, ChevronUp, Stethoscope, Heart, Brain,
  Eye, Shield, MapPin, XCircle, Phone,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type AppointmentType =
  | "gp" | "dental" | "optician" | "camhs" | "hospital"
  | "lac_review" | "pep_meeting" | "social_worker" | "court"
  | "therapy" | "specialist" | "immunisation" | "other";

type AppointmentStatus = "scheduled" | "attended" | "cancelled" | "missed" | "rescheduled";

interface Appointment {
  id: string;
  child_id: string;
  date: string;
  time: string;
  type: AppointmentType;
  title: string;
  location: string;
  professional_name: string;
  description: string;
  status: AppointmentStatus;
  outcome: string | null;
  transport_arranged: boolean;
  escort_staff: string | null;
  follow_up_date: string | null;
  recorded_by: string;
  created_at: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AppointmentType, { label: string; colour: string; icon: React.ElementType }> = {
  gp:            { label: "GP",             colour: "bg-blue-100 text-blue-700",     icon: Stethoscope },
  dental:        { label: "Dental",         colour: "bg-cyan-100 text-cyan-700",     icon: Heart       },
  optician:      { label: "Optician",       colour: "bg-indigo-100 text-indigo-700", icon: Eye         },
  camhs:         { label: "CAMHS",          colour: "bg-purple-100 text-purple-700", icon: Brain       },
  hospital:      { label: "Hospital",       colour: "bg-red-100 text-red-700",       icon: Stethoscope },
  lac_review:    { label: "LAC Review",     colour: "bg-orange-100 text-orange-700", icon: Calendar    },
  pep_meeting:   { label: "PEP Meeting",    colour: "bg-amber-100 text-amber-700",   icon: Calendar    },
  social_worker: { label: "Social Worker",  colour: "bg-green-100 text-green-700",   icon: User        },
  court:         { label: "Court",          colour: "bg-slate-100 text-slate-700",   icon: Shield      },
  therapy:       { label: "Therapy",        colour: "bg-rose-100 text-rose-700",     icon: Heart       },
  specialist:    { label: "Specialist",     colour: "bg-teal-100 text-teal-700",     icon: Stethoscope },
  immunisation:  { label: "Immunisation",   colour: "bg-emerald-100 text-emerald-700", icon: Shield    },
  other:         { label: "Other",          colour: "bg-gray-100 text-gray-600",     icon: Calendar    },
};

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; colour: string }> = {
  scheduled:   { label: "Scheduled",   colour: "bg-blue-100 text-blue-700"   },
  attended:    { label: "Attended",    colour: "bg-green-100 text-green-700" },
  cancelled:   { label: "Cancelled",   colour: "bg-gray-100 text-gray-500"  },
  missed:      { label: "Missed",      colour: "bg-red-100 text-red-700"    },
  rescheduled: { label: "Rescheduled", colour: "bg-amber-100 text-amber-700" },
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10);
};

const SEED: Appointment[] = [
  {
    id: "apt_001", child_id: "yp_alex", date: d(2), time: "10:30",
    type: "camhs", title: "CAMHS Assessment — Follow-up",
    location: "Derby CAMHS Centre, London Road", professional_name: "Dr. Sarah Collins",
    description: "Follow-up assessment after recent safeguarding disclosure. Focus on emotional wellbeing, anxiety levels, and coping strategies. Key worker to attend.",
    status: "scheduled", outcome: null, transport_arranged: true, escort_staff: "staff_edward",
    follow_up_date: null, recorded_by: "staff_darren", created_at: d(-5) + "T09:00:00Z",
  },
  {
    id: "apt_002", child_id: "yp_jordan", date: d(5), time: "14:00",
    type: "dental", title: "Routine dental check-up",
    location: "Smile Dental Practice, Normanton Road", professional_name: "Mr. Ahmed",
    description: "6-monthly routine dental check. Jordan not been to dentist since placement started — first appointment here.",
    status: "scheduled", outcome: null, transport_arranged: true, escort_staff: "staff_anna",
    follow_up_date: null, recorded_by: "staff_anna", created_at: d(-3) + "T10:00:00Z",
  },
  {
    id: "apt_003", child_id: "yp_casey", date: d(-2), time: "09:00",
    type: "gp", title: "GP — Medication review",
    location: "Littleover Surgery", professional_name: "Dr. L. Chen",
    description: "Review of current medication. Discussion about sleep difficulties and whether dosage adjustment needed.",
    status: "attended", outcome: "Medication dosage unchanged. GP recommended sleep hygiene review. Follow-up in 3 months. No side effects reported.", transport_arranged: true, escort_staff: "staff_chervelle",
    follow_up_date: d(90), recorded_by: "staff_chervelle", created_at: d(-10) + "T09:00:00Z",
  },
  {
    id: "apt_004", child_id: "yp_alex", date: d(-5), time: "11:00",
    type: "social_worker", title: "Statutory visit — Karen Holding",
    location: "Oak House", professional_name: "Karen Holding",
    description: "Statutory social worker visit. Discussed recent incidents, school situation, and Alex's feelings about upcoming court date. Alex engaged but became upset towards the end.",
    status: "attended", outcome: "Alex shared concerns about court. SW agreed to arrange pre-court visit. Additional CAMHS referral discussed. Next visit in 4 weeks.", transport_arranged: false, escort_staff: null,
    follow_up_date: d(23), recorded_by: "staff_edward", created_at: d(-14) + "T09:00:00Z",
  },
  {
    id: "apt_005", child_id: "yp_casey", date: d(-7), time: "13:30",
    type: "optician", title: "Eye test",
    location: "Specsavers, Derby City Centre", professional_name: "Optometrist",
    description: "Annual eye test. Casey has been complaining of headaches during reading.",
    status: "attended", outcome: "Slight prescription change. New glasses ordered — will be ready in 7-10 days. Headaches likely linked to eye strain.", transport_arranged: true, escort_staff: "staff_diane",
    follow_up_date: d(3), recorded_by: "staff_diane", created_at: d(-14) + "T10:00:00Z",
  },
  {
    id: "apt_006", child_id: "yp_jordan", date: d(-3), time: "10:00",
    type: "lac_review", title: "LAC Review — 6 month",
    location: "County Hall, Nottingham (virtual option)", professional_name: "Ruth Chambers (IRO)",
    description: "6-month Looked After Child review. Key worker, social worker, and IRO in attendance. Jordan participated for first part of meeting.",
    status: "attended", outcome: "Placement confirmed as meeting needs. Education on track. Contact plan reviewed — additional phone contact with grandmother agreed. Health assessments up to date.", transport_arranged: false, escort_staff: null,
    follow_up_date: d(180), recorded_by: "staff_anna", created_at: d(-30) + "T09:00:00Z",
  },
  {
    id: "apt_007", child_id: "yp_alex", date: d(-10), time: "14:30",
    type: "therapy", title: "Play therapy session",
    location: "The Therapy Hub, Derby", professional_name: "Lisa Baines (Play Therapist)",
    description: "Weekly play therapy session. Alex has been attending for 8 weeks. Therapist reports good engagement.",
    status: "missed", outcome: "Alex refused to attend. Was distressed following school exclusion earlier that day. Therapist notified. Session rebooked.", transport_arranged: true, escort_staff: "staff_edward",
    follow_up_date: d(-3), recorded_by: "staff_edward", created_at: d(-17) + "T09:00:00Z",
  },
  {
    id: "apt_008", child_id: "yp_casey", date: d(7), time: "10:00",
    type: "immunisation", title: "HPV vaccination — dose 2",
    location: "School nurse, Allestree Woodlands", professional_name: "School Nurse",
    description: "Second dose of HPV vaccination. Consent form already returned. Casey aware and agreeable.",
    status: "scheduled", outcome: null, transport_arranged: false, escort_staff: null,
    follow_up_date: null, recorded_by: "staff_chervelle", created_at: d(-2) + "T09:00:00Z",
  },
  {
    id: "apt_009", child_id: "yp_alex", date: d(14), time: "10:00",
    type: "court", title: "Family court hearing",
    location: "Derby Family Court", professional_name: "Judge TBC",
    description: "Family court hearing regarding Section 31 application. Alex does not attend but has been told about the hearing. Guardian ad litem report expected.",
    status: "scheduled", outcome: null, transport_arranged: false, escort_staff: null,
    follow_up_date: null, recorded_by: "staff_darren", created_at: d(-7) + "T09:00:00Z",
  },
  {
    id: "apt_010", child_id: "yp_jordan", date: d(1), time: "15:00",
    type: "gp", title: "Allergy management review",
    location: "GP Surgery, Allestree", professional_name: "Dr. A. Khan",
    description: "Review of Penicillin allergy documentation. Need updated allergy action plan for school and home file.",
    status: "scheduled", outcome: null, transport_arranged: true, escort_staff: "staff_anna",
    follow_up_date: null, recorded_by: "staff_anna", created_at: d(-4) + "T09:00:00Z",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const { currentUser } = useAuthContext();

  const [entries, setEntries] = useState<Appointment[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("soonest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past" | "all">("upcoming");

  // new form
  const [nChild, setNChild] = useState("");
  const [nType, setNType] = useState<AppointmentType | "">("");
  const [nTitle, setNTitle] = useState("");
  const [nDate, setNDate] = useState("");
  const [nTime, setNTime] = useState("");
  const [nLocation, setNLocation] = useState("");
  const [nProfessional, setNProfessional] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nTransport, setNTransport] = useState(false);

  const childIds = useMemo(() => [...new Set(entries.map(e => e.child_id))], [entries]);
  const today = todayStr();

  /* ── filtering ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (tab === "upcoming") list = list.filter(e => e.date >= today && e.status === "scheduled");
    if (tab === "past") list = list.filter(e => e.date < today || e.status !== "scheduled");
    if (childFilter !== "all") list = list.filter(e => e.child_id === childFilter);
    if (typeFilter !== "all") list = list.filter(e => e.type === typeFilter);
    if (statusFilter !== "all") list = list.filter(e => e.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.professional_name.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        getYPName(e.child_id).toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "soonest": return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
        case "latest":  return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
        case "child":   return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "type":    return a.type.localeCompare(b.type);
        default: return 0;
      }
    });
    return list;
  }, [entries, search, childFilter, typeFilter, statusFilter, sortBy, tab, today]);

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    upcoming:  entries.filter(e => e.date >= today && e.status === "scheduled").length,
    attended:  entries.filter(e => e.status === "attended").length,
    missed:    entries.filter(e => e.status === "missed").length,
    thisWeek:  entries.filter(e => {
      const diff = (new Date(e.date).getTime() - Date.now()) / 86400000;
      return diff >= 0 && diff <= 7 && e.status === "scheduled";
    }).length,
    total: entries.length,
  }), [entries, today]);

  /* ── export ─────────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<Appointment>[] = [
    { header: "ID", accessor: r => r.id },
    { header: "Child", accessor: r => getYPName(r.child_id) },
    { header: "Date", accessor: r => r.date },
    { header: "Time", accessor: r => r.time },
    { header: "Type", accessor: r => TYPE_CONFIG[r.type].label },
    { header: "Title", accessor: r => r.title },
    { header: "Location", accessor: r => r.location },
    { header: "Professional", accessor: r => r.professional_name },
    { header: "Status", accessor: r => STATUS_CONFIG[r.status].label },
    { header: "Outcome", accessor: r => r.outcome || "" },
    { header: "Transport", accessor: r => r.transport_arranged ? "Yes" : "No" },
    { header: "Escort", accessor: r => r.escort_staff ? getStaffName(r.escort_staff) : "" },
    { header: "Recorded By", accessor: r => getStaffName(r.recorded_by) },
    { header: "Follow-up", accessor: r => r.follow_up_date || "" },
  ];

  /* ── mark attended ──────────────────────────────────────────────────────── */
  const markAttended = (id: string) => {
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, status: "attended" as AppointmentStatus } : e
    ));
  };

  /* ── create ─────────────────────────────────────────────────────────────── */
  const handleCreate = () => {
    if (!nChild || !nType || !nTitle || !nDate || !nTime) return;
    const apt: Appointment = {
      id: `apt_${Date.now()}`,
      child_id: nChild,
      date: nDate,
      time: nTime,
      type: nType as AppointmentType,
      title: nTitle,
      location: nLocation,
      professional_name: nProfessional,
      description: nDesc,
      status: "scheduled",
      outcome: null,
      transport_arranged: nTransport,
      escort_staff: null,
      follow_up_date: null,
      recorded_by: currentUser?.id || "staff_darren",
      created_at: new Date().toISOString(),
    };
    setEntries(prev => [apt, ...prev]);
    setShowNew(false);
    setNChild(""); setNType(""); setNTitle(""); setNDate(""); setNTime("");
    setNLocation(""); setNProfessional(""); setNDesc(""); setNTransport(false);
  };

  return (
    <PageShell
      title="Appointments"
      subtitle="Medical, review, and professional appointments"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Appointments" subtitle="Oak House — Health & Welfare" />
          <ExportButton data={filtered} columns={exportCols} filename="appointments" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Appointment
          </Button>
        </div>
      }
    >
      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Upcoming",   value: stats.upcoming, icon: CalendarDays, c: "text-blue-600" },
          { label: "This Week",  value: stats.thisWeek, icon: Clock, c: "text-indigo-600" },
          { label: "Attended",   value: stats.attended, icon: CheckCircle2, c: "text-green-600" },
          { label: "Missed",     value: stats.missed, icon: XCircle, c: "text-red-600" },
          { label: "Total",      value: stats.total, icon: Calendar, c: "text-slate-600" },
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

      {/* ── Missed alert ─────────────────────────────────────────────────────── */}
      {stats.missed > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-6 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">
            {stats.missed} missed appointment{stats.missed !== 1 ? "s" : ""} — missed health appointments must be followed up and rebooked.
          </p>
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "upcoming", label: "Upcoming", count: stats.upcoming },
          { key: "past", label: "Past", count: entries.length - stats.upcoming },
          { key: "all", label: "All", count: entries.length },
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
            {(Object.entries(TYPE_CONFIG) as [AppointmentType, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(STATUS_CONFIG) as [AppointmentStatus, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="soonest">Soonest First</SelectItem>
              <SelectItem value="latest">Latest First</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} appointment{filtered.length !== 1 ? "s" : ""}
        {(search || childFilter !== "all" || typeFilter !== "all" || statusFilter !== "all") && " (filtered)"}
      </p>

      {/* ── Appointment Cards ─────────────────────────────────────────────────── */}
      <div className="space-y-3" id="appointments-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No appointments found</p>
          </div>
        )}

        {filtered.map(apt => {
          const isOpen = expandedId === apt.id;
          const tc = TYPE_CONFIG[apt.type];
          const sc = STATUS_CONFIG[apt.status];
          const Icon = tc.icon;
          const isPast = apt.date < today;
          const isToday = apt.date === today;

          return (
            <div key={apt.id} className={cn("rounded-lg border bg-card overflow-hidden",
              isToday && apt.status === "scheduled" && "border-blue-300 ring-1 ring-blue-200"
            )}>
              <button
                onClick={() => setExpandedId(isOpen ? null : apt.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className={cn("rounded-full p-1.5 shrink-0", tc.colour)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{apt.title}</span>
                    <Badge variant="outline" className={cn("text-xs", tc.colour)}>{tc.label}</Badge>
                    <Badge variant="outline" className={cn("text-xs", sc.colour)}>{sc.label}</Badge>
                    {isToday && apt.status === "scheduled" && (
                      <Badge className="text-xs bg-blue-600 text-white">TODAY</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getYPName(apt.child_id)} · {formatDate(apt.date)} at {apt.time} · {apt.location}
                  </p>
                </div>
                {apt.transport_arranged && (
                  <Badge variant="outline" className="text-xs shrink-0">🚗 Transport</Badge>
                )}
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Details</p>
                    <p className="text-sm">{apt.description}</p>
                  </div>
                  {apt.outcome && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Outcome</p>
                      <p className="text-sm">{apt.outcome}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{apt.professional_name}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{apt.location}</span>
                    {apt.escort_staff && (
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Escort: {getStaffName(apt.escort_staff)}</span>
                    )}
                    {apt.follow_up_date && (
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Follow-up: {formatDate(apt.follow_up_date)}</span>
                    )}
                  </div>
                  {apt.status === "scheduled" && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => markAttended(apt.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Attended
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
              <strong>Regulation 7 (Health)</strong> requires the registered person to ensure each child&apos;s health needs
              are met, including routine and specialist appointments. <strong>Schedule 3</strong> mandates documented
              health care plans. Missed appointments must be rebooked promptly — persistent missed health appointments
              may indicate a safeguarding concern and must be escalated.
            </p>
          </div>
        </div>
      </div>

      {/* ══ New Dialog ════════════════════════════════════════════════════════ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Appointment</DialogTitle></DialogHeader>
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
              <label className="text-sm font-medium mb-1 block">Appointment Type *</label>
              <Select value={nType} onValueChange={v => setNType(v as AppointmentType)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_CONFIG) as [AppointmentType, { label: string }][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input placeholder="e.g. GP — Annual health check" value={nTitle} onChange={e => setNTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Date *</label>
                <Input type="date" value={nDate} onChange={e => setNDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Time *</label>
                <Input type="time" value={nTime} onChange={e => setNTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <Input placeholder="Clinic / hospital address" value={nLocation} onChange={e => setNLocation(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Professional Name</label>
              <Input placeholder="Doctor / therapist name" value={nProfessional} onChange={e => setNProfessional(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea placeholder="Reason for appointment, preparation needed..." value={nDesc} onChange={e => setNDesc(e.target.value)} rows={3} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={nTransport} onChange={e => setNTransport(e.target.checked)} className="rounded" />
              Transport arranged
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nChild || !nType || !nTitle || !nDate || !nTime}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
