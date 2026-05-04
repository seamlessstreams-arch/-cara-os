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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  CheckCircle2, Clock, AlertTriangle, FileText, BookOpen,
  Shield, Users, ClipboardCheck, Calendar, User,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DocumentCategory = "handbook" | "policy" | "procedure" | "briefing" | "training";

interface Acknowledgement {
  staffId: string;
  acknowledgedDate: string | null;
}

interface AcknowledgementDocument {
  id: string;
  title: string;
  version: string | null;
  issuedDate: string;
  requiredBy: string;
  issuedBy: string;
  category: DocumentCategory;
  acknowledgements: Acknowledgement[];
  notes: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; colour: string; icon: typeof FileText }> = {
  handbook:  { label: "Handbook",  colour: "bg-blue-100 text-blue-700",   icon: BookOpen },
  policy:    { label: "Policy",    colour: "bg-purple-100 text-purple-700", icon: Shield },
  procedure: { label: "Procedure", colour: "bg-amber-100 text-amber-700", icon: ClipboardCheck },
  briefing:  { label: "Briefing",  colour: "bg-indigo-100 text-indigo-700", icon: FileText },
  training:  { label: "Training",  colour: "bg-green-100 text-green-700", icon: Users },
};

// ── Date Helper ───────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10);
};

// ── Staff IDs ─────────────────────────────────────────────────────────────────

const ALL_STAFF = [
  "staff_darren", "staff_ryan", "staff_anna", "staff_chervelle",
  "staff_edward", "staff_lackson", "staff_mirela",
];

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED_DOCUMENTS: AcknowledgementDocument[] = [
  {
    id: "ack_001",
    title: "Staff Handbook",
    version: "v6.1",
    issuedDate: d(-30),
    requiredBy: d(-23),
    issuedBy: "staff_darren",
    category: "handbook",
    acknowledgements: [
      { staffId: "staff_darren", acknowledgedDate: d(-29) },
      { staffId: "staff_ryan", acknowledgedDate: d(-28) },
      { staffId: "staff_anna", acknowledgedDate: d(-27) },
      { staffId: "staff_chervelle", acknowledgedDate: d(-26) },
      { staffId: "staff_edward", acknowledgedDate: d(-25) },
      { staffId: "staff_lackson", acknowledgedDate: d(-24) },
      { staffId: "staff_mirela", acknowledgedDate: d(-23) },
    ],
    notes: "Full handbook reissue following annual review. All staff acknowledged within the required 7-day window.",
  },
  {
    id: "ack_002",
    title: "Updated Safeguarding Policy",
    version: "v4.2",
    issuedDate: d(-30),
    requiredBy: d(-23),
    issuedBy: "staff_darren",
    category: "policy",
    acknowledgements: [
      { staffId: "staff_darren", acknowledgedDate: d(-30) },
      { staffId: "staff_ryan", acknowledgedDate: d(-29) },
      { staffId: "staff_anna", acknowledgedDate: d(-28) },
      { staffId: "staff_chervelle", acknowledgedDate: d(-27) },
      { staffId: "staff_edward", acknowledgedDate: d(-26) },
      { staffId: "staff_lackson", acknowledgedDate: d(-25) },
      { staffId: "staff_mirela", acknowledgedDate: d(-24) },
    ],
    notes: "Updated to reflect revised KCSIE 2025 guidance and local LSCP procedures. Key changes highlighted in team meeting.",
  },
  {
    id: "ack_003",
    title: "Revised Missing from Care Procedure",
    version: null,
    issuedDate: d(-14),
    requiredBy: d(-7),
    issuedBy: "staff_darren",
    category: "procedure",
    acknowledgements: [
      { staffId: "staff_darren", acknowledgedDate: d(-14) },
      { staffId: "staff_ryan", acknowledgedDate: d(-13) },
      { staffId: "staff_anna", acknowledgedDate: d(-12) },
      { staffId: "staff_chervelle", acknowledgedDate: d(-11) },
      { staffId: "staff_edward", acknowledgedDate: d(-10) },
      { staffId: "staff_lackson", acknowledgedDate: null },
      { staffId: "staff_mirela", acknowledgedDate: null },
    ],
    notes: "New procedure following multi-agency review. Incorporates updated police notification timescales and return home interview requirements.",
  },
  {
    id: "ack_004",
    title: "TCI Refresher Briefing (2025)",
    version: null,
    issuedDate: d(-7),
    requiredBy: d(0),
    issuedBy: "staff_ryan",
    category: "briefing",
    acknowledgements: [
      { staffId: "staff_darren", acknowledgedDate: d(-7) },
      { staffId: "staff_ryan", acknowledgedDate: d(-6) },
      { staffId: "staff_anna", acknowledgedDate: null },
      { staffId: "staff_chervelle", acknowledgedDate: d(-5) },
      { staffId: "staff_edward", acknowledgedDate: null },
      { staffId: "staff_lackson", acknowledgedDate: null },
      { staffId: "staff_mirela", acknowledgedDate: null },
    ],
    notes: "Summary briefing of key updates from 2025 TCI refresher training. Staff must acknowledge before next shift.",
  },
  {
    id: "ack_005",
    title: "GDPR Annual Refresher",
    version: null,
    issuedDate: d(-60),
    requiredBy: d(-53),
    issuedBy: "staff_darren",
    category: "training",
    acknowledgements: [
      { staffId: "staff_darren", acknowledgedDate: d(-60) },
      { staffId: "staff_ryan", acknowledgedDate: d(-59) },
      { staffId: "staff_anna", acknowledgedDate: d(-58) },
      { staffId: "staff_chervelle", acknowledgedDate: d(-57) },
      { staffId: "staff_edward", acknowledgedDate: d(-56) },
      { staffId: "staff_lackson", acknowledgedDate: d(-55) },
      { staffId: "staff_mirela", acknowledgedDate: d(-54) },
    ],
    notes: "Annual data protection refresher. All staff completed within first week of issue.",
  },
  {
    id: "ack_006",
    title: "Medication Administration Update",
    version: null,
    issuedDate: d(-21),
    requiredBy: d(-14),
    issuedBy: "staff_darren",
    category: "procedure",
    acknowledgements: [
      { staffId: "staff_darren", acknowledgedDate: d(-21) },
      { staffId: "staff_ryan", acknowledgedDate: d(-20) },
      { staffId: "staff_anna", acknowledgedDate: d(-19) },
      { staffId: "staff_chervelle", acknowledgedDate: d(-18) },
      { staffId: "staff_edward", acknowledgedDate: d(-17) },
      { staffId: "staff_lackson", acknowledgedDate: null },
      { staffId: "staff_mirela", acknowledgedDate: d(-16) },
    ],
    notes: "Updated medication administration procedure following audit findings. Lackson to acknowledge on return from leave (expected back " + d(3) + ").",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const dt = new Date(iso);
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getCompletionCount(doc: AcknowledgementDocument): number {
  return doc.acknowledgements.filter(a => a.acknowledgedDate !== null).length;
}

function getTotalCount(doc: AcknowledgementDocument): number {
  return doc.acknowledgements.length;
}

function isComplete(doc: AcknowledgementDocument): boolean {
  return getCompletionCount(doc) === getTotalCount(doc);
}

function hasOverdue(doc: AcknowledgementDocument): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return !isComplete(doc) && doc.requiredBy < today;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function StaffHandbookAcknowledgementsPage() {
  const [documents] = useState<AcknowledgementDocument[]>(SEED_DOCUMENTS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "complete" | "incomplete">("all");
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | "all">("all");
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
      results.sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime());
    } else {
      results.sort((a, b) => a.category.localeCompare(b.category));
    }

    return results;
  }, [documents, filterStatus, filterCategory, searchQuery, sortBy]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalDocs = documents.length;
    const fullyAcknowledged = documents.filter(doc => isComplete(doc)).length;
    const fullyAcknowledgedPct = Math.round((fullyAcknowledged / totalDocs) * 100);
    const overdueCount = documents.filter(doc => hasOverdue(doc)).length;

    // Staff with outstanding reads
    const staffOutstanding = new Set<string>();
    documents.forEach(doc => {
      doc.acknowledgements.forEach(a => {
        if (a.acknowledgedDate === null) {
          staffOutstanding.add(a.staffId);
        }
      });
    });

    return { totalDocs, fullyAcknowledged, fullyAcknowledgedPct, overdueCount, staffOutstandingCount: staffOutstanding.size };
  }, [documents]);

  // ── Export Columns ────────────────────────────────────────────────────────

  const exportCols: ExportColumn<AcknowledgementDocument>[] = [
    { header: "ID", accessor: (r: AcknowledgementDocument) => r.id },
    { header: "Title", accessor: (r: AcknowledgementDocument) => r.title },
    { header: "Version", accessor: (r: AcknowledgementDocument) => r.version || "N/A" },
    { header: "Category", accessor: (r: AcknowledgementDocument) => CATEGORY_CONFIG[r.category].label },
    { header: "Issued Date", accessor: (r: AcknowledgementDocument) => r.issuedDate },
    { header: "Required By", accessor: (r: AcknowledgementDocument) => r.requiredBy },
    { header: "Issued By", accessor: (r: AcknowledgementDocument) => getStaffName(r.issuedBy) },
    { header: "Acknowledged", accessor: (r: AcknowledgementDocument) => `${getCompletionCount(r)}/${getTotalCount(r)}` },
    { header: "Status", accessor: (r: AcknowledgementDocument) => isComplete(r) ? "Complete" : hasOverdue(r) ? "Overdue" : "Pending" },
    { header: "Notes", accessor: (r: AcknowledgementDocument) => r.notes },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

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
          onChange={e => setFilterCategory(e.target.value as DocumentCategory | "all")}
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
                      {cc.label}
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
                    Issued: {formatDate(doc.issuedDate)}
                    {" · "}
                    Required by: {formatDate(doc.requiredBy)}
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
                      <p className="text-sm">{getStaffName(doc.issuedBy)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Issued Date</p>
                      <p className="text-sm">{formatDate(doc.issuedDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Required By</p>
                      <p className="text-sm">{formatDate(doc.requiredBy)}</p>
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
                            <tr key={ack.staffId} className="border-t">
                              <td className="px-3 py-1.5 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                {getStaffName(ack.staffId)}
                              </td>
                              <td className="px-3 py-1.5">
                                {ack.acknowledgedDate ? (
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
                                {ack.acknowledgedDate ? formatDate(ack.acknowledgedDate) : "—"}
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
                    <span><Calendar className="inline h-3.5 w-3.5 mr-0.5" />Issued: {formatDate(doc.issuedDate)}</span>
                    <span><User className="inline h-3.5 w-3.5 mr-0.5" />By: {getStaffName(doc.issuedBy)}</span>
                    <span><Clock className="inline h-3.5 w-3.5 mr-0.5" />Due: {formatDate(doc.requiredBy)}</span>
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
    </PageShell>
  );
}
