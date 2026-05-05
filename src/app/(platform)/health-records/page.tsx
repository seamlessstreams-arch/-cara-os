"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HEALTH RECORDS
// Centralised health record for each young person: medical history,
// allergies, immunisations, health assessments, and health action plans.
// Supports Reg 7 (Health), Schedule 3 (Health Care), and Ofsted ILACS
// inspection evidence that health needs are identified and met.
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
import { useCreateHealthRecord } from "@/hooks/use-health-records";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  Search, ArrowUpDown, X, Plus, Stethoscope,
  CheckCircle2, AlertTriangle, Clock, User, Calendar,
  ChevronDown, ChevronUp, Shield, Heart, Brain, Eye,
  Pill, Syringe, FileText, Activity,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type RecordType = "health_assessment" | "immunisation" | "allergy" | "condition" | "referral" | "dental" | "optical" | "mental_health" | "growth" | "other";
type RecordStatus = "current" | "resolved" | "monitoring" | "referred" | "overdue";

interface HealthRecord {
  id: string;
  child_id: string;
  date: string;
  type: RecordType;
  title: string;
  details: string;
  professional: string;
  status: RecordStatus;
  follow_up_date: string | null;
  outcome: string | null;
  recorded_by: string;
  created_at: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<RecordType, { label: string; colour: string; icon: React.ElementType }> = {
  health_assessment: { label: "Health Assessment", colour: "bg-blue-100 text-blue-700",     icon: Stethoscope },
  immunisation:      { label: "Immunisation",      colour: "bg-emerald-100 text-emerald-700", icon: Syringe   },
  allergy:           { label: "Allergy",           colour: "bg-red-100 text-red-700",       icon: AlertTriangle },
  condition:         { label: "Condition",         colour: "bg-purple-100 text-purple-700", icon: Heart       },
  referral:          { label: "Referral",          colour: "bg-orange-100 text-orange-700", icon: FileText    },
  dental:            { label: "Dental",            colour: "bg-cyan-100 text-cyan-700",     icon: Heart       },
  optical:           { label: "Optical",           colour: "bg-indigo-100 text-indigo-700", icon: Eye         },
  mental_health:     { label: "Mental Health",     colour: "bg-rose-100 text-rose-700",     icon: Brain       },
  growth:            { label: "Growth & Weight",   colour: "bg-green-100 text-green-700",   icon: Activity    },
  other:             { label: "Other",             colour: "bg-gray-100 text-gray-600",     icon: FileText    },
};

const STATUS_CONFIG: Record<RecordStatus, { label: string; colour: string }> = {
  current:    { label: "Current",    colour: "bg-blue-100 text-blue-700"   },
  resolved:   { label: "Resolved",   colour: "bg-green-100 text-green-700" },
  monitoring: { label: "Monitoring", colour: "bg-amber-100 text-amber-700" },
  referred:   { label: "Referred",   colour: "bg-purple-100 text-purple-700" },
  overdue:    { label: "Overdue",    colour: "bg-red-100 text-red-700"     },
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10);
};

const SEED: HealthRecord[] = [
  {
    id: "hr_001", child_id: "yp_alex", date: d(-30), type: "health_assessment",
    title: "Initial Health Assessment",
    details: "Comprehensive health assessment completed within 20 days of placement. General health good. BMI within normal range. Immunisations up to date. Dental: some decay noted — dental appointment booked. Eyesight: normal. Hearing: normal. CAMHS referral recommended due to emotional regulation difficulties.",
    professional: "Dr. S. Patel (GP)", status: "current",
    follow_up_date: d(150), outcome: "Dental referral made. CAMHS referral submitted. Health action plan created.",
    recorded_by: "staff_darren", created_at: d(-30) + "T10:00:00Z",
  },
  {
    id: "hr_002", child_id: "yp_jordan", date: d(-60), type: "allergy",
    title: "Penicillin Allergy — documented",
    details: "Known allergy to Penicillin documented from referral paperwork. Allergic reaction: rash and swelling. GP confirmed allergy. Allergy band provided. All staff briefed. School nurse notified. Alternative antibiotics noted in health plan.",
    professional: "Dr. A. Khan (GP)", status: "current",
    follow_up_date: null, outcome: "Allergy documented in health plan, MAR, and school records. EpiPen not required — reaction is mild.",
    recorded_by: "staff_anna", created_at: d(-60) + "T09:00:00Z",
  },
  {
    id: "hr_003", child_id: "yp_casey", date: d(-14), type: "mental_health",
    title: "CAMHS Review — anxiety management",
    details: "CAMHS review session. Casey reports improved sleep over the past two weeks following sleep hygiene strategies. Anxiety levels reduced but still present around school transitions. Therapist recommends continuing current approach.",
    professional: "Dr. H. Williams (CAMHS)", status: "monitoring",
    follow_up_date: d(42), outcome: "Continue current strategies. Next review in 6 weeks. No medication change.",
    recorded_by: "staff_chervelle", created_at: d(-14) + "T14:00:00Z",
  },
  {
    id: "hr_004", child_id: "yp_casey", date: d(-7), type: "optical",
    title: "Eye test — prescription change",
    details: "Annual eye test at Specsavers. Slight prescription change detected. Casey has been reporting headaches during reading which is consistent with eye strain. New glasses ordered.",
    professional: "Specsavers Optometrist", status: "current",
    follow_up_date: d(3), outcome: "New glasses ordered. 7-10 day wait. Headaches expected to resolve.",
    recorded_by: "staff_diane", created_at: d(-7) + "T13:30:00Z",
  },
  {
    id: "hr_005", child_id: "yp_jordan", date: d(-90), type: "immunisation",
    title: "Flu vaccination",
    details: "Annual flu vaccination administered at school by school nurse. Jordan consented. No adverse reaction reported. Observed for 15 minutes post-vaccination.",
    professional: "School Nurse", status: "resolved",
    follow_up_date: null, outcome: "Vaccination recorded on health record. No side effects.",
    recorded_by: "staff_anna", created_at: d(-90) + "T11:00:00Z",
  },
  {
    id: "hr_006", child_id: "yp_alex", date: d(-20), type: "referral",
    title: "CAMHS Referral — emotional regulation",
    details: "Referral submitted to Derby CAMHS for emotional regulation assessment. Referral includes history of physical interventions, self-harm risk, and trauma background. Priority assessment requested given safeguarding context.",
    professional: "Dr. S. Patel (GP)", status: "referred",
    follow_up_date: d(10), outcome: "Referral accepted. Initial assessment booked — see appointments.",
    recorded_by: "staff_darren", created_at: d(-20) + "T10:00:00Z",
  },
  {
    id: "hr_007", child_id: "yp_casey", date: d(-120), type: "dental",
    title: "Dental check-up — routine",
    details: "6-monthly dental check-up. No new cavities. Good oral hygiene. One small filling from previous visit holding well. Next check-up in 6 months.",
    professional: "Mr. Ahmed (Dentist)", status: "resolved",
    follow_up_date: d(60), outcome: "Good dental health. Next check-up booked.",
    recorded_by: "staff_chervelle", created_at: d(-120) + "T10:00:00Z",
  },
  {
    id: "hr_008", child_id: "yp_alex", date: d(-45), type: "condition",
    title: "Asthma — mild, controlled",
    details: "Pre-existing asthma documented from referral. Mild, well-controlled with salbutamol inhaler PRN. No hospital admissions. Triggers: cold weather, exercise. Asthma plan in place.",
    professional: "Dr. S. Patel (GP)", status: "current",
    follow_up_date: d(90), outcome: "Inhaler available at home and school. Asthma plan reviewed annually.",
    recorded_by: "staff_darren", created_at: d(-45) + "T09:00:00Z",
  },
  {
    id: "hr_009", child_id: "yp_jordan", date: d(-10), type: "growth",
    title: "Height & weight check",
    details: "Routine height and weight check. Jordan: Height 152cm (50th percentile), Weight 43kg (45th percentile). BMI within healthy range. Growth tracking normal. No concerns.",
    professional: "School Nurse", status: "resolved",
    follow_up_date: d(180), outcome: "Growth within normal parameters. Next check in 6 months.",
    recorded_by: "staff_anna", created_at: d(-10) + "T11:00:00Z",
  },
  {
    id: "hr_010", child_id: "yp_casey", date: d(-2), type: "condition",
    title: "Sleep disturbance — ongoing monitoring",
    details: "Casey continues to experience intermittent sleep difficulties. Current approach: consistent bedtime routine, no screens 1hr before bed, calm environment. GP reviewed — no medication change. CAMHS monitoring.",
    professional: "Dr. L. Chen (GP)", status: "monitoring",
    follow_up_date: d(90), outcome: "Continue current sleep hygiene approach. Monitor and review at next GP appointment.",
    recorded_by: "staff_chervelle", created_at: d(-2) + "T09:00:00Z",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HealthRecordsPage() {
  const { currentUser } = useAuthContext();
  const createRecord = useCreateHealthRecord();

  const [entries, setEntries] = useState<HealthRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<"all" | "active" | "referrals">("all");

  // new form
  const [nChild, setNChild] = useState("");
  const [nType, setNType] = useState<RecordType | "">("");
  const [nTitle, setNTitle] = useState("");
  const [nDetails, setNDetails] = useState("");
  const [nProfessional, setNProfessional] = useState("");
  const [nOutcome, setNOutcome] = useState("");

  const childIds = useMemo(() => [...new Set(entries.map(e => e.child_id))], [entries]);

  /* ── filtering ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];
    if (tab === "active") list = list.filter(e => e.status === "current" || e.status === "monitoring" || e.status === "overdue");
    if (tab === "referrals") list = list.filter(e => e.type === "referral" || e.status === "referred");
    if (childFilter !== "all") list = list.filter(e => e.child_id === childFilter);
    if (typeFilter !== "all") list = list.filter(e => e.type === typeFilter);
    if (statusFilter !== "all") list = list.filter(e => e.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.details.toLowerCase().includes(q) ||
        e.professional.toLowerCase().includes(q) ||
        getYPName(e.child_id).toLowerCase().includes(q)
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
  }, [entries, search, childFilter, typeFilter, statusFilter, sortBy, tab]);

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total: entries.length,
    active: entries.filter(e => e.status === "current" || e.status === "monitoring").length,
    referrals: entries.filter(e => e.type === "referral" || e.status === "referred").length,
    overdue: entries.filter(e => e.follow_up_date && e.follow_up_date < todayStr() && e.status !== "resolved").length,
    allergies: entries.filter(e => e.type === "allergy").length,
  }), [entries]);

  /* ── per-child health summary ──────────────────────────────────────────── */
  const childHealth = useMemo(() => {
    const map = new Map<string, { conditions: number; allergies: number; overdue: number }>();
    entries.forEach(e => {
      const cur = map.get(e.child_id) || { conditions: 0, allergies: 0, overdue: 0 };
      if (e.type === "condition" && e.status === "current") cur.conditions++;
      if (e.type === "allergy") cur.allergies++;
      if (e.follow_up_date && e.follow_up_date < todayStr() && e.status !== "resolved") cur.overdue++;
      map.set(e.child_id, cur);
    });
    return map;
  }, [entries]);

  /* ── export ─────────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<HealthRecord>[] = [
    { header: "ID", accessor: r => r.id },
    { header: "Child", accessor: r => getYPName(r.child_id) },
    { header: "Date", accessor: r => r.date },
    { header: "Type", accessor: r => TYPE_CONFIG[r.type].label },
    { header: "Title", accessor: r => r.title },
    { header: "Details", accessor: r => r.details },
    { header: "Professional", accessor: r => r.professional },
    { header: "Status", accessor: r => STATUS_CONFIG[r.status].label },
    { header: "Follow-up Date", accessor: r => r.follow_up_date || "" },
    { header: "Outcome", accessor: r => r.outcome || "" },
    { header: "Recorded By", accessor: r => getStaffName(r.recorded_by) },
  ];

  /* ── create ─────────────────────────────────────────────────────────────── */
  const handleCreate = () => {
    if (!nChild || !nType || !nTitle || !nDetails) return;
    const entry: HealthRecord = {
      id: `hr_${Date.now()}`,
      child_id: nChild,
      date: todayStr(),
      type: nType as RecordType,
      title: nTitle,
      details: nDetails,
      professional: nProfessional,
      status: nType === "referral" ? "referred" : "current",
      follow_up_date: null,
      outcome: nOutcome || null,
      recorded_by: currentUser?.id || "staff_darren",
      created_at: new Date().toISOString(),
    };
    setEntries(prev => [entry, ...prev]);
    createRecord.mutate({ child_id: nChild, record_type: nType as "appointment" | "assessment" | "immunisation" | "allergy" | "action_plan" | "medication_change", title: nTitle, date: todayStr(), provider: nProfessional, notes: nDetails, staff_id: currentUser?.id || "staff_darren", status: "scheduled" });
    setShowNew(false);
    setNChild(""); setNType(""); setNTitle(""); setNDetails(""); setNProfessional(""); setNOutcome("");
  };

  return (
    <PageShell
      title="Health Records"
      subtitle="Medical history, assessments, and health action plans"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Health Records" subtitle="Oak House — Health & Welfare" />
          <ExportButton data={filtered} columns={exportCols} filename="health-records" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Record
          </Button>
        </div>
      }
    >
      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Records", value: stats.total, icon: FileText, c: "text-blue-600" },
          { label: "Active",        value: stats.active, icon: Activity, c: "text-green-600" },
          { label: "Referrals",     value: stats.referrals, icon: Stethoscope, c: "text-purple-600" },
          { label: "Overdue",       value: stats.overdue, icon: Clock, c: "text-red-600" },
          { label: "Allergies",     value: stats.allergies, icon: AlertTriangle, c: "text-amber-600" },
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

      {/* ── Overdue alert ─────────────────────────────────────────────────────── */}
      {stats.overdue > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-6 flex items-center gap-3">
          <Clock className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">
            {stats.overdue} health record{stats.overdue !== 1 ? "s have" : " has"} overdue follow-up dates.
          </p>
        </div>
      )}

      {/* ── Per-child health cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {childIds.map(cid => {
          const h = childHealth.get(cid) || { conditions: 0, allergies: 0, overdue: 0 };
          return (
            <div key={cid} className="rounded-lg border bg-card p-3">
              <p className="font-medium text-sm mb-1">{getYPName(cid)}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {h.conditions > 0 && <span>{h.conditions} active condition{h.conditions !== 1 ? "s" : ""}</span>}
                {h.allergies > 0 && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                    {h.allergies} allerg{h.allergies !== 1 ? "ies" : "y"}
                  </Badge>
                )}
                {h.overdue > 0 && (
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">{h.overdue} overdue</Badge>
                )}
                {h.conditions === 0 && h.allergies === 0 && <span>No active conditions</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "all", label: "All Records", count: entries.length },
          { key: "active", label: "Active / Monitoring", count: stats.active },
          { key: "referrals", label: "Referrals", count: stats.referrals },
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
        <Select value={childFilter} onValueChange={setChildFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Child" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(TYPE_CONFIG) as [RecordType, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(STATUS_CONFIG) as [RecordStatus, { label: string }][]).map(([k, v]) => (
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
        {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        {(search || childFilter !== "all" || typeFilter !== "all" || statusFilter !== "all") && " (filtered)"}
      </p>

      {/* ── Record Cards ──────────────────────────────────────────────────────── */}
      <div className="space-y-3" id="health-records-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No records found</p>
          </div>
        )}

        {filtered.map(entry => {
          const isOpen = expandedId === entry.id;
          const tc = TYPE_CONFIG[entry.type];
          const sc = STATUS_CONFIG[entry.status];
          const Icon = tc.icon;
          const isOverdue = entry.follow_up_date && entry.follow_up_date < todayStr() && entry.status !== "resolved";

          return (
            <div key={entry.id} className={cn("rounded-lg border bg-card overflow-hidden",
              isOverdue && "border-red-200"
            )}>
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
                    <Badge variant="outline" className={cn("text-xs", sc.colour)}>{sc.label}</Badge>
                    {isOverdue && (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Overdue</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getYPName(entry.child_id)} · {entry.professional} · {formatDate(entry.date)}
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
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Outcome</p>
                      <p className="text-sm">{entry.outcome}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{entry.professional}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(entry.date)}</span>
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Logged by: {getStaffName(entry.recorded_by)}</span>
                    {entry.follow_up_date && (
                      <span className={cn("flex items-center gap-1", isOverdue && "text-red-600 font-medium")}>
                        <Clock className="h-3.5 w-3.5" />Follow-up: {formatDate(entry.follow_up_date)}
                      </span>
                    )}
                  </div>
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
              <strong>Regulation 7 (Health)</strong> and <strong>Schedule 3 (Health Care)</strong> require the registered
              person to ensure each child&apos;s physical, emotional, and mental health needs are met. An Initial Health
              Assessment must be completed within 20 working days of placement, with Review Health Assessments annually
              (under 5s: 6-monthly). All health records must be maintained and made available to the responsible authority.
            </p>
          </div>
        </div>
      </div>

      {/* ══ New Dialog ════════════════════════════════════════════════════════ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Health Record</DialogTitle></DialogHeader>
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
              <label className="text-sm font-medium mb-1 block">Record Type *</label>
              <Select value={nType} onValueChange={v => setNType(v as RecordType)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_CONFIG) as [RecordType, { label: string }][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input placeholder="e.g. Annual dental check" value={nTitle} onChange={e => setNTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Details *</label>
              <Textarea placeholder="Full health record details..." value={nDetails} onChange={e => setNDetails(e.target.value)} rows={4} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Professional</label>
              <Input placeholder="Doctor / nurse name" value={nProfessional} onChange={e => setNProfessional(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Outcome</label>
              <Textarea placeholder="Outcome and next steps..." value={nOutcome} onChange={e => setNOutcome(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nChild || !nType || !nTitle || !nDetails}>Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
