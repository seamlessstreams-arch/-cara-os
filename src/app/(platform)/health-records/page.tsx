"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HEALTH RECORDS
// Centralised health record for each young person: medical history,
// allergies, immunisations, health assessments, and health action plans.
// Supports Reg 7 (Health), Schedule 3 (Health Care), and Ofsted ILACS
// inspection evidence that health needs are identified and met.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
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
import { useHealthRecords, useCreateHealthRecord } from "@/hooks/use-health-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { HealthRecordEntry, HealthRecordType, HealthRecordStatus } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import {
  Search, ArrowUpDown, X, Plus, Stethoscope,
  AlertTriangle, Clock, User, Calendar,
  ChevronDown, ChevronUp, Shield, Heart, Brain, Eye,
  Syringe, FileText, Activity, Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<HealthRecordType, { label: string; colour: string; icon: React.ElementType }> = {
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

const STATUS_CONFIG: Record<HealthRecordStatus, { label: string; colour: string }> = {
  current:    { label: "Current",    colour: "bg-blue-100 text-blue-700"   },
  resolved:   { label: "Resolved",   colour: "bg-green-100 text-green-700" },
  monitoring: { label: "Monitoring", colour: "bg-amber-100 text-amber-700" },
  referred:   { label: "Referred",   colour: "bg-purple-100 text-purple-700" },
  overdue:    { label: "Overdue",    colour: "bg-red-100 text-red-700"     },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function HealthRecordsPage() {
  const { currentUser } = useAuthContext();
  const { data: response, isLoading } = useHealthRecords();
  const createRecord = useCreateHealthRecord();

  const records = response?.data ?? [];

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
  const [nType, setNType] = useState<HealthRecordType | "">("");
  const [nTitle, setNTitle] = useState("");
  const [nDetails, setNDetails] = useState("");
  const [nProfessional, setNProfessional] = useState("");
  const [nOutcome, setNOutcome] = useState("");

  const childIds = useMemo(() => [...new Set(records.map(e => e.child_id))], [records]);

  /* ── filtering ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (tab === "active") list = list.filter(e => e.status === "current" || e.status === "monitoring" || e.status === "overdue");
    if (tab === "referrals") list = list.filter(e => e.record_type === "referral" || e.status === "referred");
    if (childFilter !== "all") list = list.filter(e => e.child_id === childFilter);
    if (typeFilter !== "all") list = list.filter(e => e.record_type === typeFilter);
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
        case "newest": return (b.created_at ?? "").localeCompare(a.created_at ?? "");
        case "oldest": return (a.created_at ?? "").localeCompare(b.created_at ?? "");
        case "child":  return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "type":   return a.record_type.localeCompare(b.record_type);
        default: return 0;
      }
    });
    return list;
  }, [records, search, childFilter, typeFilter, statusFilter, sortBy, tab]);

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total: records.length,
    active: records.filter(e => e.status === "current" || e.status === "monitoring").length,
    referrals: records.filter(e => e.record_type === "referral" || e.status === "referred").length,
    overdue: records.filter(e => e.follow_up_date && e.follow_up_date < todayStr() && e.status !== "resolved").length,
    allergies: records.filter(e => e.record_type === "allergy").length,
  }), [records]);

  /* ── per-child health summary ──────────────────────────────────────────── */
  const childHealth = useMemo(() => {
    const map = new Map<string, { conditions: number; allergies: number; overdue: number }>();
    records.forEach(e => {
      const cur = map.get(e.child_id) || { conditions: 0, allergies: 0, overdue: 0 };
      if (e.record_type === "condition" && e.status === "current") cur.conditions++;
      if (e.record_type === "allergy") cur.allergies++;
      if (e.follow_up_date && e.follow_up_date < todayStr() && e.status !== "resolved") cur.overdue++;
      map.set(e.child_id, cur);
    });
    return map;
  }, [records]);

  /* ── export ─────────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<HealthRecordEntry>[] = [
    { header: "ID", accessor: (r: HealthRecordEntry) => r.id },
    { header: "Child", accessor: (r: HealthRecordEntry) => getYPName(r.child_id) },
    { header: "Date", accessor: (r: HealthRecordEntry) => r.date },
    { header: "Type", accessor: (r: HealthRecordEntry) => TYPE_CONFIG[r.record_type].label },
    { header: "Title", accessor: (r: HealthRecordEntry) => r.title },
    { header: "Details", accessor: (r: HealthRecordEntry) => r.details },
    { header: "Professional", accessor: (r: HealthRecordEntry) => r.professional },
    { header: "Status", accessor: (r: HealthRecordEntry) => STATUS_CONFIG[r.status].label },
    { header: "Follow-up Date", accessor: (r: HealthRecordEntry) => r.follow_up_date ?? "" },
    { header: "Outcome", accessor: (r: HealthRecordEntry) => r.outcome ?? "" },
    { header: "Recorded By", accessor: (r: HealthRecordEntry) => getStaffName(r.staff_id) },
  ];

  /* ── create ─────────────────────────────────────────────────────────────── */
  const handleCreate = () => {
    if (!nChild || !nType || !nTitle || !nDetails) return;
    createRecord.mutate(
      {
        child_id: nChild,
        date: todayStr(),
        record_type: nType as HealthRecordType,
        title: nTitle,
        details: nDetails,
        professional: nProfessional,
        status: nType === "referral" ? "referred" : "current",
        follow_up_date: null,
        outcome: nOutcome || null,
        staff_id: currentUser?.id || "staff_darren",
      },
      {
        onSuccess: () => toast.success("Health record saved"),
        onError: () => toast.error("Failed to save record"),
      },
    );
    setShowNew(false);
    setNChild(""); setNType(""); setNTitle(""); setNDetails(""); setNProfessional(""); setNOutcome("");
  };

  if (isLoading) {
    return (
      <PageShell title="Health Records" subtitle="Medical history, assessments, and health action plans">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Health Records"
      subtitle="Medical history, assessments, and health action plans"
      caraContext={{ pageTitle: "Health Records", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Health Records" subtitle="Chamberlain House — Health & Welfare" />
          <ExportButton data={filtered} columns={exportCols} filename="health-records" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Record
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "health", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <CaraPanel
        mode="assist"
        pageContext="Health Records — medical history, assessments, health action plans, Regulation 7"
        recordType="health_record"
        userRole="registered_manager"
        className="mb-5"
      />
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
          { key: "all", label: "All Records", count: records.length },
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
            {(Object.entries(TYPE_CONFIG) as [HealthRecordType, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(STATUS_CONFIG) as [HealthRecordStatus, { label: string }][]).map(([k, v]) => (
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
          const tc = TYPE_CONFIG[entry.record_type];
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
                aria-expanded={isOpen}
                aria-label={`Expand health record: ${entry.title} for ${getYPName(entry.child_id)}`}
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
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Logged by: {getStaffName(entry.staff_id)}</span>
                    {entry.follow_up_date && (
                      <span className={cn("flex items-center gap-1", isOverdue && "text-red-600 font-medium")}>
                        <Clock className="h-3.5 w-3.5" />Follow-up: {formatDate(entry.follow_up_date)}
                      </span>
                    )}
                  </div>
                  {(entry as never as { care_event_id?: string }).care_event_id && (
                    <Link
                      href={`/care-events/${(entry as never as { care_event_id: string }).care_event_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <Stethoscope className="h-3 w-3" />
                      Logged from Care Event
                    </Link>
                  )}
                  <SmartLinkPanel sourceType="health_record" sourceId={entry.id} childId={entry.child_id} compact />
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
              <label htmlFor="hr-child" className="text-sm font-medium mb-1 block">Child *</label>
              <Select value={nChild} onValueChange={setNChild}>
                <SelectTrigger id="hr-child"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="hr-type" className="text-sm font-medium mb-1 block">Record Type *</label>
              <Select value={nType} onValueChange={v => setNType(v as HealthRecordType)}>
                <SelectTrigger id="hr-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_CONFIG) as [HealthRecordType, { label: string }][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="hr-title" className="text-sm font-medium mb-1 block">Title *</label>
              <Input id="hr-title" placeholder="e.g. Annual dental check" value={nTitle} onChange={e => setNTitle(e.target.value)} />
            </div>
            <div>
              <label htmlFor="hr-details" className="text-sm font-medium mb-1 block">Details *</label>
              <Textarea id="hr-details" placeholder="Full health record details..." value={nDetails} onChange={e => setNDetails(e.target.value)} rows={4} />
            </div>
            <div>
              <label htmlFor="hr-professional" className="text-sm font-medium mb-1 block">Professional</label>
              <Input id="hr-professional" placeholder="Doctor / nurse name" value={nProfessional} onChange={e => setNProfessional(e.target.value)} />
            </div>
            <div>
              <label htmlFor="hr-outcome" className="text-sm font-medium mb-1 block">Outcome</label>
              <Textarea id="hr-outcome" placeholder="Outcome and next steps..." value={nOutcome} onChange={e => setNOutcome(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nChild || !nType || !nTitle || !nDetails || createRecord.isPending}>{createRecord.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Record"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Care Events pipeline — health &amp; medication events routed here */}
      <CareEventsPanel
        title="Care Events — Health &amp; Medication"
        category={["health", "medication"]}
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
