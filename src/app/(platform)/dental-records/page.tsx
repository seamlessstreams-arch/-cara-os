"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — DENTAL RECORDS
// Tracks dental care for each child: registrations, check-ups, treatments,
// daily oral hygiene, anxiety, reasonable adjustments, and recall intervals.
// Required by Quality Standard 7 (Health & Wellbeing) and NICE oral health
// guidelines for looked-after children.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Search, ArrowUpDown, X, ChevronUp, ChevronDown, Smile,
  CheckCircle2, AlertTriangle, Clock, Stethoscope, Shield,
  CalendarDays, Sparkles, FileText, User, Heart, ClipboardList,
} from "lucide-react";
import type {
  DentalRecord, DentalRegistrationStatus, DentalRecallInterval,
  DentalOralHygienePractice, DentalCheckUpEntry,
} from "@/types/extended";
import {
  DENTAL_REGISTRATION_STATUS_LABEL,
  DENTAL_RECALL_INTERVAL_LABEL,
} from "@/types/extended";
import { useDentalRecords } from "@/hooks/use-dental-records";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DentalRegistrationStatus, { colour: string }> = {
  active_nhs:             { colour: "bg-green-100 text-green-700 border-green-200" },
  active_private:         { colour: "bg-blue-100 text-blue-700 border-blue-200" },
  awaiting_registration:  { colour: "bg-amber-100 text-amber-700 border-amber-200" },
  inactive:               { colour: "bg-gray-100 text-gray-600 border-gray-200" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DentalRecordsPage() {
  const { data: raw, isLoading } = useDentalRecords();
  const records = raw?.data ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("nextDue");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  /* ── Filtering & sort ───────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (statusFilter !== "all") {
      list = list.filter(r => r.registration_status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        r.dental_practice.toLowerCase().includes(q) ||
        r.dentist_name.toLowerCase().includes(q) ||
        r.current_treatment_notes.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "nextDue":   return a.next_check_up_due.localeCompare(b.next_check_up_due);
        case "lastVisit": return b.last_check_up_date.localeCompare(a.last_check_up_date);
        case "child":     return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "status":    return a.registration_status.localeCompare(b.registration_status);
        default: return 0;
      }
    });
    return list;
  }, [records, search, statusFilter, sortBy]);

  /* ── Stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const registered = records.filter(r =>
      r.registration_status === "active_nhs" || r.registration_status === "active_private"
    ).length;
    const upToDate = records.filter(r => r.next_check_up_due >= today).length;
    const treatmentInProgress = records.filter(r =>
      /treat|filling|in progress|caries|cavity/i.test(r.current_treatment_notes) &&
      !/no further|stable|no active/i.test(r.current_treatment_notes)
    ).length;
    const adjusted = records.filter(r => r.reasonable_adjustments.length >= 3).length;
    return { registered, upToDate, treatmentInProgress, adjusted };
  }, [records, today]);

  /* ── Export ─────────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<DentalRecord>[] = [
    { header: "ID",                    accessor: (r: DentalRecord) => r.id },
    { header: "Child",                 accessor: (r: DentalRecord) => getYPName(r.child_id) },
    { header: "Practice",              accessor: (r: DentalRecord) => r.dental_practice },
    { header: "Dentist",               accessor: (r: DentalRecord) => r.dentist_name },
    { header: "Registered",            accessor: (r: DentalRecord) => r.registered_date },
    { header: "Status",                accessor: (r: DentalRecord) => DENTAL_REGISTRATION_STATUS_LABEL[r.registration_status] },
    { header: "Last Check-up",         accessor: (r: DentalRecord) => r.last_check_up_date },
    { header: "Next Due",              accessor: (r: DentalRecord) => r.next_check_up_due },
    { header: "Recall",                accessor: (r: DentalRecord) => DENTAL_RECALL_INTERVAL_LABEL[r.recall_interval] },
    { header: "Current Treatment",     accessor: (r: DentalRecord) => r.current_treatment_notes },
    { header: "Anxiety",               accessor: (r: DentalRecord) => r.anxiety_around_dentistry },
    { header: "Reasonable Adjustments",accessor: (r: DentalRecord) => r.reasonable_adjustments.join("; ") },
    { header: "Attitude",              accessor: (r: DentalRecord) => r.child_attitude_to_dentistry },
    { header: "Orthodontics",          accessor: (r: DentalRecord) => r.orthodontics },
    { header: "Fluoride Supplements",  accessor: (r: DentalRecord) => r.fluoride_supplements ? "Yes" : "No" },
    { header: "Child Aware",           accessor: (r: DentalRecord) => r.child_aware ? "Yes" : "No" },
    { header: "Review Date",           accessor: (r: DentalRecord) => r.review_date },
    { header: "Recorded By",           accessor: (r: DentalRecord) => getStaffName(r.recorded_by) },
  ];

  /* ── Loading ────────────────────────────────────────────────────────────── */
  if (isLoading) return <PageShell title="Dental Records" subtitle="Registrations, check-ups, and treatment for each child"><div /></PageShell>;

  return (
    <PageShell
      title="Dental Records"
      subtitle="Registrations, check-ups, and treatment for each child"
      caraContext={{ pageTitle: "Dental Records", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Dental Records" />
          <ExportButton data={filtered} columns={exportCols} filename="dental-records" />
          <CaraStudioQuickActionButton context={{ record_type: "health", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Children registered",    value: stats.registered,          icon: Smile,         c: "text-cyan-600"  },
          { label: "Up to date",             value: stats.upToDate,            icon: CheckCircle2,  c: "text-green-600" },
          { label: "Treatments in progress", value: stats.treatmentInProgress, icon: Stethoscope,   c: "text-amber-600" },
          { label: "Adjusted approach",      value: stats.adjusted,            icon: Sparkles,      c: "text-purple-600"},
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

      {/* ── Filters ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search child, practice, dentist..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.keys(STATUS_CONFIG) as DentalRegistrationStatus[]).map(s => (
              <SelectItem key={s} value={s}>{DENTAL_REGISTRATION_STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nextDue">Next Check-up Due</SelectItem>
              <SelectItem value="lastVisit">Last Visit</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        {(search || statusFilter !== "all") && " (filtered)"}
      </p>

      {/* ── Records ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3" id="dental-records-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Smile className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No dental records found</p>
          </div>
        )}

        {filtered.map(rec => {
          const isOpen = expandedId === rec.id;
          const sc = STATUS_CONFIG[rec.registration_status];
          const overdue = rec.next_check_up_due < today;
          const dueSoon = !overdue && rec.next_check_up_due <= new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().slice(0, 10);

          return (
            <div
              key={rec.id}
              className={cn(
                "rounded-lg border bg-card overflow-hidden",
                overdue && "border-[var(--cs-risk-soft)] ring-1 ring-[var(--cs-risk-soft)]"
              )}
            >
              <button
                onClick={() => setExpandedId(isOpen ? null : rec.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="rounded-full p-1.5 shrink-0 bg-cyan-100 text-cyan-700">
                  <Smile className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{getYPName(rec.child_id)}</span>
                    <Badge variant="outline" className={cn("text-xs", sc.colour)}>
                      {DENTAL_REGISTRATION_STATUS_LABEL[rec.registration_status]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {DENTAL_RECALL_INTERVAL_LABEL[rec.recall_interval]}
                    </Badge>
                    {overdue && (
                      <Badge className="text-xs bg-red-600 text-white">OVERDUE</Badge>
                    )}
                    {dueSoon && (
                      <Badge className="text-xs bg-amber-500 text-white">DUE SOON</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rec.dental_practice} · {rec.dentist_name} · Next due {rec.next_check_up_due}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-4 space-y-4 bg-muted/30">
                  {/* Registration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Practice</p>
                      <p>{rec.dental_practice}</p>
                      <p className="text-xs text-muted-foreground">Dentist: {rec.dentist_name}</p>
                      <p className="text-xs text-muted-foreground">Registered: {rec.registered_date}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Recall</p>
                      <p>{DENTAL_RECALL_INTERVAL_LABEL[rec.recall_interval]}</p>
                      <p className="text-xs text-muted-foreground">Last check-up: {rec.last_check_up_date}</p>
                      <p className="text-xs text-muted-foreground">Next due: {rec.next_check_up_due}</p>
                    </div>
                  </div>

                  {/* Daily oral hygiene */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5" /> Daily Oral Hygiene
                    </p>
                    <ul className="space-y-1">
                      {rec.daily_oral_hygiene.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          {p.completed
                            ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            : <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          }
                          <span className={cn(!p.completed && "text-muted-foreground")}>{p.practice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Current treatment */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5" /> Current Treatment
                    </p>
                    <p className="text-sm">{rec.current_treatment_notes}</p>
                  </div>

                  {/* Anxiety & adjustments */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" /> Anxiety Around Dentistry
                      </p>
                      <p className="text-sm">{rec.anxiety_around_dentistry}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> Reasonable Adjustments
                      </p>
                      {rec.reasonable_adjustments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">None recorded</p>
                      ) : (
                        <ul className="text-sm list-disc list-inside space-y-0.5">
                          {rec.reasonable_adjustments.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Attitude / orthodontics / fluoride */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Child's Attitude</p>
                      <p>{rec.child_attitude_to_dentistry}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Orthodontics</p>
                      <p>{rec.orthodontics}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Fluoride / Awareness</p>
                      <p>Fluoride supplements: <strong>{rec.fluoride_supplements ? "Yes" : "No"}</strong></p>
                      <p>Child aware of plan: <strong>{rec.child_aware ? "Yes" : "No"}</strong></p>
                    </div>
                  </div>

                  {/* Check-ups history */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> Check-up History
                    </p>
                    <div className="space-y-2">
                      {rec.check_ups_history.map((c, i) => (
                        <div key={i} className="rounded border bg-background p-3 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{c.date}</Badge>
                            <span className="text-xs text-muted-foreground">{c.dentist}</span>
                          </div>
                          <p><span className="font-medium">Findings: </span>{c.findings}</p>
                          <p><span className="font-medium">Recommended: </span>{c.treatment_recommended}</p>
                          <p><span className="font-medium">Received: </span>{c.treatment_received}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1 border-t">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Review date: {rec.review_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> Recorded by: {getStaffName(rec.recorded_by)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> {rec.id}
                    </span>
                  </div>

                  {/* Smart Links */}
                  <SmartLinkPanel sourceType="dental-records" sourceId={rec.id} childId={rec.child_id} compact />
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
              <strong>Quality Standard 7 (Health & Wellbeing)</strong> requires the registered person to ensure each
              child is registered with a dentist and that their oral health needs are met. <strong>NICE guideline NG194</strong>
              {" "}and the NICE oral health guidance for looked-after children recommend recall intervals tailored to risk
              (3-12 monthly), daily fluoride toothpaste use, and reasonable adjustments for anxiety or sensory needs.
              Missed dental appointments must be rebooked promptly and recorded. Children should be supported to
              understand their own oral health and participate in decisions about their care.
            </p>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Health"
        category="health"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Dental Records — dental appointments, dentist name, treatments, NHS/private, x-rays, decay, fillings, extractions, orthodontics, AHA dental health, consent, LAC health"
        recordType="health"
        className="mt-6"
      />
    </PageShell>
  );
}
