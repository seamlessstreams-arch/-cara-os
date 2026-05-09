"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF HANDBOOK ACKNOWLEDGEMENTS
// Tracks which staff members have read and acknowledged receipt of key
// documents — the staff handbook, updated policies, procedure changes,
// safeguarding briefings, etc. Supports Regulation 33 (fitness of workers)
// and Schedule 1 requirement to keep records of training and development.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  CheckCircle2, Clock, AlertTriangle, FileText, BookOpen,
  Shield, Users, ClipboardCheck, Calendar, User, Loader2,
} from "lucide-react";
import { useStaffHandbookAcknowledgementRecords } from "@/hooks/use-staff-handbook-acknowledgement-records";
import type { StaffHandbookAcknowledgementRecord, StaffHandbookDocumentCategory } from "@/types/extended";
import { STAFF_HANDBOOK_DOCUMENT_CATEGORY_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Config (icon not serializable — kept local) ─────────────────────────────

const CATEGORY_CONFIG: Record<StaffHandbookDocumentCategory, { colour: string; icon: typeof FileText }> = {
  handbook:  { colour: "bg-blue-100 text-blue-700",   icon: BookOpen },
  policy:    { colour: "bg-purple-100 text-purple-700", icon: Shield },
  procedure: { colour: "bg-amber-100 text-amber-700", icon: ClipboardCheck },
  briefing:  { colour: "bg-indigo-100 text-indigo-700", icon: FileText },
  training:  { colour: "bg-green-100 text-green-700", icon: Users },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const dt = new Date(iso);
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getCompletionCount(doc: StaffHandbookAcknowledgementRecord): number {
  return doc.acknowledgements.filter(a => a.acknowledged_date !== null).length;
}

function getTotalCount(doc: StaffHandbookAcknowledgementRecord): number {
  return doc.acknowledgements.length;
}

function isComplete(doc: StaffHandbookAcknowledgementRecord): boolean {
  return getCompletionCount(doc) === getTotalCount(doc);
}

function hasOverdue(doc: StaffHandbookAcknowledgementRecord): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return !isComplete(doc) && doc.required_by < today;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function StaffHandbookAcknowledgementsPage() {
  const { data: documents = [], isLoading } = useStaffHandbookAcknowledgementRecords();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "complete" | "incomplete">("all");
  const [filterCategory, setFilterCategory] = useState<StaffHandbookDocumentCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"issued" | "category">("issued");

  // ── Filtering & Sorting ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let results = [...documents];

    if (filterStatus === "complete") {
      results = results.filter(doc => isComplete(doc));
    } else if (filterStatus === "incomplete") {
      results = results.filter(doc => !isComplete(doc));
    }

    if (filterCategory !== "all") {
      results = results.filter(doc => doc.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(doc =>
        doc.title.toLowerCase().includes(q) ||
        doc.notes.toLowerCase().includes(q) ||
        (doc.version && doc.version.toLowerCase().includes(q))
      );
    }

    if (sortBy === "issued") {
      results.sort((a, b) => new Date(b.issued_date).getTime() - new Date(a.issued_date).getTime());
    } else {
      results.sort((a, b) => a.category.localeCompare(b.category));
    }

    return results;
  }, [documents, filterStatus, filterCategory, searchQuery, sortBy]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalDocs = documents.length;
    const fullyAcknowledged = documents.filter(doc => isComplete(doc)).length;
    const fullyAcknowledgedPct = totalDocs > 0 ? Math.round((fullyAcknowledged / totalDocs) * 100) : 0;
    const overdueCount = documents.filter(doc => hasOverdue(doc)).length;

    // Staff with outstanding reads
    const staffOutstanding = new Set<string>();
    documents.forEach(doc => {
      doc.acknowledgements.forEach(a => {
        if (a.acknowledged_date === null) {
          staffOutstanding.add(a.staff_id);
        }
      });
    });

    return { totalDocs, fullyAcknowledged, fullyAcknowledgedPct, overdueCount, staffOutstandingCount: staffOutstanding.size };
  }, [documents]);

  // ── Export Columns ────────────────────────────────────────────────────────

  const exportCols: ExportColumn<StaffHandbookAcknowledgementRecord>[] = [
    { header: "ID", accessor: (r: StaffHandbookAcknowledgementRecord) => r.id },
    { header: "Title", accessor: (r: StaffHandbookAcknowledgementRecord) => r.title },
    { header: "Version", accessor: (r: StaffHandbookAcknowledgementRecord) => r.version || "N/A" },
    { header: "Category", accessor: (r: StaffHandbookAcknowledgementRecord) => STAFF_HANDBOOK_DOCUMENT_CATEGORY_LABEL[r.category] },
    { header: "Issued Date", accessor: (r: StaffHandbookAcknowledgementRecord) => r.issued_date },
    { header: "Required By", accessor: (r: StaffHandbookAcknowledgementRecord) => r.required_by },
    { header: "Issued By", accessor: (r: StaffHandbookAcknowledgementRecord) => getStaffName(r.issued_by) },
    { header: "Acknowledged", accessor: (r: StaffHandbookAcknowledgementRecord) => `${getCompletionCount(r)}/${getTotalCount(r)}` },
    { header: "Status", accessor: (r: StaffHandbookAcknowledgementRecord) => isComplete(r) ? "Complete" : hasOverdue(r) ? "Overdue" : "Pending" },
    { header: "Notes", accessor: (r: StaffHandbookAcknowledgementRecord) => r.notes },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageShell title="Staff Handbook Acknowledgements" subtitle="Track staff acknowledgement of key documents, policies, and procedure updates">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Handbook Acknowledgements"
      subtitle="Track staff acknowledgement of key documents, policies, and procedure updates"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Handbook Acknowledgements" subtitle="Oak House — Document Acknowledgement Records" />
          <ExportButton data={filtered} columns={exportCols} filename="staff-handbook-acknowledgements" />
        </div>
      }
    >
      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Documents Issued", value: stats.totalDocs, icon: FileText, c: "text-blue-600" },
          { label: "Fully Acknowledged", value: stats.fullyAcknowledged, icon: CheckCircle2, c: "text-green-600" },
          { label: "Completion Rate", value: `${stats.fullyAcknowledgedPct}%`, icon: ClipboardCheck, c: "text-emerald-600" },
          { label: "Staff Outstanding", value: stats.staffOutstandingCount, icon: Users, c: "text-amber-600" },
          { label: "Overdue", value: stats.overdueCount, icon: AlertTriangle, c: "text-red-600" },
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
      {stats.overdueCount > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-6 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div className="text-sm text-red-800 dark:text-red-300">
            <strong>{stats.overdueCount} document{stats.overdueCount > 1 ? "s have" : " has"} overdue acknowledgements.</strong>{" "}
            Staff must read and acknowledge all documents within the required timeframe. Outstanding acknowledgements must be followed up in supervision.
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
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as "all" | "complete" | "incomplete")}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="complete">Fully Acknowledged</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as StaffHandbookDocumentCategory | "all")}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="all">All Categories</option>
          <option value="handbook">Handbook</option>
          <option value="policy">Policy</option>
          <option value="procedure">Procedure</option>
          <option value="briefing">Briefing</option>
          <option value="training">Training</option>
        </select>

        <button
          onClick={() => setSortBy(sortBy === "issued" ? "category" : "issued")}
          className="flex items-center gap-1 rounded-md border bg-background px-2 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortBy === "issued" ? "By Issued Date" : "By Category"}
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
          const IconComp = cc.icon;
          const completed = getCompletionCount(doc);
          const total = getTotalCount(doc);
          const complete = isComplete(doc);
          const overdue = hasOverdue(doc);

          return (
            <div key={doc.id} className={cn("rounded-lg border bg-card overflow-hidden",
              overdue && "border-red-200",
              !complete && !overdue && "border-amber-200"
            )}>
              <button onClick={() => setExpandedId(isOpen ? null : doc.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors">
                <div className={cn("rounded-full p-1.5 shrink-0", cc.colour)}>
                  <IconComp className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{doc.title}</span>
                    {doc.version && (
                      <Badge variant="outline" className="text-xs">{doc.version}</Badge>
                    )}
                    <Badge variant="outline" className={cn("text-xs", cc.colour)}>
                      {STAFF_HANDBOOK_DOCUMENT_CATEGORY_LABEL[doc.category]}
                    </Badge>
                    {complete ? (
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-0.5" />Complete
                      </Badge>
                    ) : overdue ? (
                      <Badge variant="outline" className="text-xs bg-red-100 text-red-700">
                        <AlertTriangle className="h-3 w-3 mr-0.5" />Overdue
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700">
                        <Clock className="h-3 w-3 mr-0.5" />Pending
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Issued: {formatDate(doc.issued_date)}
                    {" · "}
                    Required by: {formatDate(doc.required_by)}
                    {" · "}
                    <span className={cn(
                      complete ? "text-green-600" : overdue ? "text-red-600 font-semibold" : "text-amber-600"
                    )}>
                      {completed}/{total} acknowledged
                    </span>
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Issued By</p>
                      <p className="text-sm">{getStaffName(doc.issued_by)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Issued Date</p>
                      <p className="text-sm">{formatDate(doc.issued_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Required By</p>
                      <p className="text-sm">{formatDate(doc.required_by)}</p>
                    </div>
                  </div>

                  {/* ── Acknowledgement Table ───────────────────────────────── */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Staff Acknowledgements</p>
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left px-3 py-1.5 font-medium text-xs">Staff Member</th>
                            <th className="text-left px-3 py-1.5 font-medium text-xs">Status</th>
                            <th className="text-left px-3 py-1.5 font-medium text-xs">Date Acknowledged</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doc.acknowledgements.map(ack => (
                            <tr key={ack.staff_id} className="border-t">
                              <td className="px-3 py-1.5 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                {getStaffName(ack.staff_id)}
                              </td>
                              <td className="px-3 py-1.5">
                                {ack.acknowledged_date ? (
                                  <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                                    <CheckCircle2 className="h-3.5 w-3.5" />Acknowledged
                                  </span>
                                ) : (
                                  <span className={cn(
                                    "inline-flex items-center gap-1 text-xs font-medium",
                                    overdue ? "text-red-600" : "text-amber-600"
                                  )}>
                                    <Clock className="h-3.5 w-3.5" />{overdue ? "Overdue" : "Pending"}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground">
                                {ack.acknowledged_date ? formatDate(ack.acknowledged_date) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── Notes ───────────────────────────────────────────────── */}
                  {doc.notes && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p>
                      <p className="text-sm">{doc.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span><Calendar className="inline h-3.5 w-3.5 mr-0.5" />Issued: {formatDate(doc.issued_date)}</span>
                    <span><User className="inline h-3.5 w-3.5 mr-0.5" />By: {getStaffName(doc.issued_by)}</span>
                    <span><Clock className="inline h-3.5 w-3.5 mr-0.5" />Due: {formatDate(doc.required_by)}</span>
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
              <strong>Regulation 33 (Fitness of Workers)</strong> requires that all persons employed
              at the home understand the policies and procedures in place and are competent to carry
              out their duties. Documenting acknowledgement of key documents provides evidence that
              staff have been informed of, and accepted responsibility for, understanding these
              requirements.
            </p>
            <p>
              <strong>Schedule 1</strong> of the Children&apos;s Homes (England) Regulations 2015
              requires the registered person to maintain records of training and professional
              development for each member of staff. Handbook acknowledgement tracking forms part
              of this record, demonstrating that staff are kept up to date with procedural changes,
              safeguarding updates, and organisational expectations.
            </p>
            <p>
              Ofsted inspectors routinely check that staff can articulate key policies and that
              there is documentary evidence of dissemination. This tracker supports a
              &quot;Good&quot; or &quot;Outstanding&quot; judgement by evidencing a systematic
              approach to staff awareness.
            </p>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
