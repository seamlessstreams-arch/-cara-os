"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DOCUMENT EXPIRY TRACKER
// Tracks expiry dates for all critical documents — DBS checks, training
// certificates, insurance, vehicle MOTs, policy review dates, fire equipment
// servicing, etc. Ensures the home maintains compliance with Regulation 40
// (staff fitness), Schedule 2 checks, and supports Ofsted readiness.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { cn, formatDate } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import type { TrackedDocument, DocExpiryCategory, DocExpiryStatus } from "@/types/extended";
import { DOC_EXPIRY_CATEGORY_LABEL, DOC_EXPIRY_STATUS_LABEL } from "@/types/extended";
import { useTrackedDocuments } from "@/hooks/use-tracked-documents";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, AlertOctagon, Shield, ShieldCheck,
  CheckCircle2, Clock, Calendar, FileText, Car, Flame,
  ClipboardCheck, User, BookOpen, Loader2,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<DocExpiryCategory, { label: string; colour: string; icon: typeof FileText }> = {
  staff_compliance: { label: "Staff Compliance", colour: "bg-blue-100 text-blue-700", icon: User },
  home_compliance:  { label: "Home Compliance",  colour: "bg-purple-100 text-purple-700", icon: ShieldCheck },
  policy_review:    { label: "Policy Review",    colour: "bg-indigo-100 text-indigo-700", icon: BookOpen },
  vehicle:          { label: "Vehicle",          colour: "bg-amber-100 text-amber-700", icon: Car },
  equipment:        { label: "Equipment",        colour: "bg-green-100 text-green-700", icon: Flame },
};

const STATUS_CONFIG: Record<DocExpiryStatus, { label: string; colour: string }> = {
  current:       { label: "Current",       colour: "bg-green-100 text-green-700" },
  expiring_soon: { label: "Expiring Soon", colour: "bg-amber-100 text-amber-700" },
  overdue:       { label: "Overdue",       colour: "bg-red-100 text-red-700" },
  renewed:       { label: "Renewed",       colour: "bg-blue-100 text-blue-700" },
};

// ── Status Logic ──────────────────────────────────────────────────────────────

function computeStatus(expiryDate: string): DocExpiryStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 30) return "expiring_soon";
  return "current";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function DocumentExpiryTrackerPage() {
  const { data: queryData, isLoading } = useTrackedDocuments();
  const documents = queryData?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<DocExpiryCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<DocExpiryStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"expiry" | "category">("expiry");

  // ── Filtering & Sorting ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let results = [...documents];

    if (filterCategory !== "all") {
      results = results.filter(doc => doc.category === filterCategory);
    }
    if (filterStatus !== "all") {
      results = results.filter(doc => doc.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(doc =>
        doc.title.toLowerCase().includes(q) ||
        (doc.related_to && getStaffName(doc.related_to).toLowerCase().includes(q)) ||
        doc.notes.toLowerCase().includes(q)
      );
    }

    if (sortBy === "expiry") {
      results.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
    } else {
      results.sort((a, b) => a.category.localeCompare(b.category));
    }

    return results;
  }, [documents, filterCategory, filterStatus, searchQuery, sortBy]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = documents.length;
    const overdue = documents.filter(doc => doc.status === "overdue").length;
    const expiringSoon = documents.filter(doc => doc.status === "expiring_soon").length;
    const current = documents.filter(doc => doc.status === "current" || doc.status === "renewed").length;
    return { total, overdue, expiringSoon, current };
  }, [documents]);

  // ── Export Columns ────────────────────────────────────────────────────────

  const exportCols: ExportColumn<TrackedDocument>[] = [
    { header: "ID", accessor: (r: TrackedDocument) => r.id },
    { header: "Title", accessor: (r: TrackedDocument) => r.title },
    { header: "Category", accessor: (r: TrackedDocument) => CATEGORY_CONFIG[r.category].label },
    { header: "Related To", accessor: (r: TrackedDocument) => r.related_to ? getStaffName(r.related_to) : "N/A" },
    { header: "Issued Date", accessor: (r: TrackedDocument) => r.issued_date || "N/A" },
    { header: "Expiry Date", accessor: (r: TrackedDocument) => r.expiry_date },
    { header: "Days Until Expiry", accessor: (r: TrackedDocument) => daysUntil(r.expiry_date).toString() },
    { header: "Status", accessor: (r: TrackedDocument) => STATUS_CONFIG[r.status].label },
    { header: "Renewal Owner", accessor: (r: TrackedDocument) => getStaffName(r.renewal_owner) },
    { header: "Notes", accessor: (r: TrackedDocument) => r.notes },
    { header: "Last Renewed", accessor: (r: TrackedDocument) => r.last_renewed || "N/A" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageShell
        title="Document Expiry Tracker"
        subtitle="Track and manage expiry dates for all critical compliance documents"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Document Expiry Tracker"
      subtitle="Track and manage expiry dates for all critical compliance documents"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Document Expiry Tracker" subtitle="Oak House — Compliance Management" />
          <ExportButton data={filtered} columns={exportCols} filename="document-expiry-tracker" />
        </div>
      }
    >
      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Tracked", value: stats.total, icon: FileText, c: "text-blue-600" },
          { label: "Overdue", value: stats.overdue, icon: AlertOctagon, c: "text-red-600" },
          { label: "Expiring (30 days)", value: stats.expiringSoon, icon: AlertTriangle, c: "text-amber-600" },
          { label: "All Current", value: stats.current, icon: CheckCircle2, c: "text-green-600" },
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

      {/* ── Overdue Alert Banner ───────────────────────────────────────────── */}
      {stats.overdue > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-6 flex items-center gap-3">
          <AlertOctagon className="h-5 w-5 text-red-600 shrink-0" />
          <div className="text-sm text-red-800 dark:text-red-300">
            <strong>{stats.overdue} document{stats.overdue > 1 ? "s" : ""} overdue!</strong>{" "}
            Immediate action required to maintain compliance. Overdue documents may impact Ofsted judgement and staff deployment.
          </div>
        </div>
      )}

      {/* ── Filters & Search ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as DocExpiryCategory | "all")}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="staff_compliance">Staff Compliance</option>
            <option value="home_compliance">Home Compliance</option>
            <option value="policy_review">Policy Review</option>
            <option value="vehicle">Vehicle</option>
            <option value="equipment">Equipment</option>
          </select>
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as DocExpiryStatus | "all")}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="current">Current</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="overdue">Overdue</option>
          <option value="renewed">Renewed</option>
        </select>

        <button
          onClick={() => setSortBy(sortBy === "expiry" ? "category" : "expiry")}
          className="flex items-center gap-1 rounded-md border bg-background px-2 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortBy === "expiry" ? "By Expiry" : "By Category"}
        </button>
      </div>

      {/* ── Document List ──────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No documents found</p>
          </div>
        )}

        {filtered.map(doc => {
          const isOpen = expandedId === doc.id;
          const cc = CATEGORY_CONFIG[doc.category];
          const sc = STATUS_CONFIG[doc.status];
          const days = daysUntil(doc.expiry_date);
          const IconComp = cc.icon;

          return (
            <div key={doc.id} className={cn("rounded-lg border bg-card overflow-hidden",
              doc.status === "overdue" && "border-red-200",
              doc.status === "expiring_soon" && "border-amber-200"
            )}>
              <button onClick={() => setExpandedId(isOpen ? null : doc.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors">
                <div className={cn("rounded-full p-1.5 shrink-0", cc.colour)}>
                  <IconComp className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{doc.title}</span>
                    {doc.related_to && (
                      <Badge variant="outline" className="text-xs">
                        <User className="h-3 w-3 mr-0.5" />
                        {getStaffName(doc.related_to)}
                      </Badge>
                    )}
                    <Badge variant="outline" className={cn("text-xs", sc.colour)}>{sc.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Expires: {formatDate(doc.expiry_date)}
                    {" · "}
                    {days < 0
                      ? <span className="text-red-600 font-semibold">{Math.abs(days)} days overdue</span>
                      : days <= 30
                        ? <span className="text-amber-600 font-semibold">{days} days remaining</span>
                        : <span>{days} days remaining</span>
                    }
                    {" · "}
                    Owner: {getStaffName(doc.renewal_owner)}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Category</p>
                      <p className="text-sm">{cc.label}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Renewal Lead Time</p>
                      <p className="text-sm">{doc.renewal_lead_time} days</p>
                    </div>
                    {doc.issued_date && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Issued Date</p>
                        <p className="text-sm">{formatDate(doc.issued_date)}</p>
                      </div>
                    )}
                    {doc.last_renewed && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Last Renewed</p>
                        <p className="text-sm">{formatDate(doc.last_renewed)}</p>
                      </div>
                    )}
                  </div>
                  {doc.notes && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p>
                      <p className="text-sm">{doc.notes}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span><Calendar className="inline h-3.5 w-3.5 mr-0.5" />Expiry: {formatDate(doc.expiry_date)}</span>
                    <span><User className="inline h-3.5 w-3.5 mr-0.5" />Owner: {getStaffName(doc.renewal_owner)}</span>
                    <span><Clock className="inline h-3.5 w-3.5 mr-0.5" />Lead time: {doc.renewal_lead_time}d</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Context ─────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Regulatory Context</p>
            <p>
              <strong>Regulation 40 (Fitness of Workers)</strong> requires that all persons working at the
              home are of integrity and good character, with appropriate qualifications, skills, and experience.
              Schedule 2 of the Children&apos;s Homes (England) Regulations 2015 specifies the information required
              in respect of persons working at the home, including enhanced DBS checks, references, and proof
              of identity and qualifications.
            </p>
            <p>
              Proactive document expiry tracking ensures no staff member operates with lapsed credentials,
              that insurance and safety certificates remain valid, and that policy reviews happen on schedule.
              This directly supports <strong>Ofsted readiness</strong> by evidencing a well-managed,
              compliant home where safeguarding is prioritised through robust administrative oversight.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
