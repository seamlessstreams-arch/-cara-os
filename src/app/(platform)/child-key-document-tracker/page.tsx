"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD KEY DOCUMENT TRACKER
// Tracks the critical legal, identity, health and education documents the home
// holds on behalf of each young person — birth certificate, NHS card, passport,
// EHCP, court orders, IDs, etc. Required by Regulation 36 (records) and a vital
// part of preparation for transition to adulthood (handing the young person
// their own paperwork when they leave care).
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, AlertOctagon, ShieldCheck, CheckCircle2,
  FileText, Calendar, User, Eye, Lock, Package, BookOpen,
  Clock, Users, FileWarning, Stamp, Loader2,
} from "lucide-react";
import type { ChildKeyDocument, KeyDocStatus, KeyDocOriginalOrCopy } from "@/types/extended";
import { KEY_DOC_STATUS_LABEL, KEY_DOC_ORIGINAL_OR_COPY_LABEL } from "@/types/extended";
import { useChildKeyDocuments } from "@/hooks/use-child-key-documents";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<KeyDocStatus, { colour: string }> = {
  "held":             { colour: "bg-green-100 text-green-700" },
  "awaiting":         { colour: "bg-amber-100 text-amber-700" },
  "expired":          { colour: "bg-red-100 text-red-700" },
  "with_la":          { colour: "bg-blue-100 text-blue-700" },
  "with_family":      { colour: "bg-purple-100 text-purple-700" },
  "lost_replacing":   { colour: "bg-red-100 text-red-700" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

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

export default function ChildKeyDocumentTrackerPage() {
  const { data: queryData, isLoading } = useChildKeyDocuments();
  const items = queryData?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<KeyDocStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"yp" | "type" | "expiry" | "status">("yp");

  // ── Derived YP IDs ──────────────────────────────────────────────────────────

  const ypIds = useMemo(() => [...new Set(items.map(r => r.child_id))], [items]);

  // ── Filtering & Sorting ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let results = [...items];

    if (filterYP !== "all") {
      results = results.filter(r => r.child_id === filterYP);
    }
    if (filterStatus !== "all") {
      results = results.filter(r => r.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(r =>
        r.document_type.toLowerCase().includes(q) ||
        r.document_reference.toLowerCase().includes(q) ||
        getYPName(r.child_id).toLowerCase().includes(q) ||
        r.purpose_of_holding.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
      );
    }

    if (sortBy === "yp") {
      results.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id)));
    } else if (sortBy === "type") {
      results.sort((a, b) => a.document_type.localeCompare(b.document_type));
    } else if (sortBy === "expiry") {
      results.sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return 0;
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      });
    } else if (sortBy === "status") {
      results.sort((a, b) => a.status.localeCompare(b.status));
    }

    return results;
  }, [items, filterYP, filterStatus, searchQuery, sortBy]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalHeld = items.filter(r => r.status === "held").length;
    const expiring12mo = items.filter(r => {
      if (!r.expiry_date) return false;
      const days = daysUntil(r.expiry_date);
      return days <= 365 && days >= -365;
    }).length;
    const awaitingOrLost = items.filter(r => r.status === "awaiting" || r.status === "lost_replacing").length;

    // Children with full pack — every document for them is in "held" status
    const fullPack = ypIds.filter(ypId => {
      const ypDocs = items.filter(r => r.child_id === ypId);
      if (ypDocs.length === 0) return false;
      return ypDocs.every(r => r.status === "held");
    }).length;

    return { totalHeld, expiring12mo, awaitingOrLost, fullPack, totalChildren: ypIds.length };
  }, [items, ypIds]);

  // ── Export Columns ────────────────────────────────────────────────────────

  const exportCols: ExportColumn<ChildKeyDocument>[] = [
    { header: "ID", accessor: (r: ChildKeyDocument) => r.id },
    { header: "Young Person", accessor: (r: ChildKeyDocument) => getYPName(r.child_id) },
    { header: "Document Type", accessor: (r: ChildKeyDocument) => r.document_type },
    { header: "Reference", accessor: (r: ChildKeyDocument) => r.document_reference },
    { header: "Original/Copy", accessor: (r: ChildKeyDocument) => KEY_DOC_ORIGINAL_OR_COPY_LABEL[r.original_or_copy] },
    { header: "Status", accessor: (r: ChildKeyDocument) => KEY_DOC_STATUS_LABEL[r.status] },
    { header: "Location", accessor: (r: ChildKeyDocument) => r.location },
    { header: "Key Holder", accessor: (r: ChildKeyDocument) => getStaffName(r.key_holder) },
    { header: "Expiry Date", accessor: (r: ChildKeyDocument) => r.expiry_date || "N/A" },
    { header: "Renewal Required", accessor: (r: ChildKeyDocument) => r.renewal_required ? "Yes" : "No" },
    { header: "Child Aware", accessor: (r: ChildKeyDocument) => r.child_aware ? "Yes" : "No" },
    { header: "Child Can Request Sight", accessor: (r: ChildKeyDocument) => r.child_can_request_sight ? "Yes" : "No" },
    { header: "Transition Pack", accessor: (r: ChildKeyDocument) => r.part_of_transition_pack ? "Yes" : "No" },
    { header: "Purpose of Holding", accessor: (r: ChildKeyDocument) => r.purpose_of_holding },
    { header: "Last Reviewed", accessor: (r: ChildKeyDocument) => r.last_reviewed_date },
    { header: "Reviewed By", accessor: (r: ChildKeyDocument) => getStaffName(r.reviewed_by) },
    { header: "Access Log Entries", accessor: (r: ChildKeyDocument) => r.access_log.length.toString() },
  ];

  // ── Loading State ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageShell
        title="Child Key Document Tracker"
        subtitle="Critical legal, identity, health & education documents held for each young person — Reg 36 records and transition-to-adulthood preparation"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Child Key Document Tracker"
      subtitle="Critical legal, identity, health & education documents held for each young person — Reg 36 records and transition-to-adulthood preparation"
      caraContext={{ pageTitle: "Child Key Document Tracker", sourceType: "document" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Child Key Document Tracker" />
          <ExportButton data={filtered} columns={exportCols} filename="child-key-document-tracker" />
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Documents Held", value: stats.totalHeld, icon: ShieldCheck, c: "text-green-600" },
          { label: "Expiring (12 mo)", value: stats.expiring12mo, icon: AlertTriangle, c: "text-amber-600" },
          { label: "Awaiting / Lost", value: stats.awaitingOrLost, icon: FileWarning, c: "text-red-600" },
          { label: "Children Full Pack", value: `${stats.fullPack}/${stats.totalChildren}`, icon: Package, c: "text-blue-600" },
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

      {/* ── Alert Banner ───────────────────────────────────────────────────── */}
      {stats.awaitingOrLost > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-6 flex items-center gap-3">
          <AlertOctagon className="h-5 w-5 text-red-600 shrink-0" />
          <div className="text-sm text-red-800 dark:text-red-300">
            <strong>{stats.awaitingOrLost} document{stats.awaitingOrLost > 1 ? "s" : ""} awaiting receipt or being replaced.</strong>{" "}
            Missing key documents impede transition planning and can delay college, passport, and benefits applications. Chase weekly until resolved.
          </div>
        </div>
      )}

      {/* ── Filters & Search ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents, references, purpose..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Young People</SelectItem>
              {ypIds.map(id => (
                <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as KeyDocStatus | "all")}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(KEY_DOC_STATUS_LABEL) as [KeyDocStatus, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yp">By Young Person</SelectItem>
              <SelectItem value="type">By Document Type</SelectItem>
              <SelectItem value="expiry">By Expiry Date</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
          const sc = STATUS_CONFIG[doc.status];
          const days = doc.expiry_date ? daysUntil(doc.expiry_date) : null;
          const expiringSoon = days !== null && days <= 90 && days >= 0;
          const expired = days !== null && days < 0;

          return (
            <div
              key={doc.id}
              className={cn(
                "rounded-lg border bg-card overflow-hidden",
                (doc.status === "expired" || doc.status === "lost_replacing") && "border-red-200",
                doc.status === "awaiting" && "border-amber-200",
                expiringSoon && "border-amber-200",
              )}
            >
              <button
                onClick={() => setExpandedId(isOpen ? null : doc.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="rounded-full p-1.5 shrink-0 bg-blue-100 text-blue-700">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{doc.document_type}</span>
                    <Badge variant="outline" className="text-xs">
                      <User className="h-3 w-3 mr-0.5" />
                      {getYPName(doc.child_id)}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", sc.colour)}>{KEY_DOC_STATUS_LABEL[doc.status]}</Badge>
                    <Badge variant="outline" className="text-xs">
                      <Stamp className="h-3 w-3 mr-0.5" />
                      {KEY_DOC_ORIGINAL_OR_COPY_LABEL[doc.original_or_copy]}
                    </Badge>
                    {doc.part_of_transition_pack && (
                      <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                        <Package className="h-3 w-3 mr-0.5" />
                        Transition Pack
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ref: {doc.document_reference}
                    {" · "}
                    {doc.location}
                    {doc.expiry_date && (
                      <>
                        {" · "}
                        <Calendar className="inline h-3 w-3 mr-0.5" />
                        Expires: {formatDate(doc.expiry_date)}
                        {expired && <span className="text-red-600 font-semibold"> (expired {Math.abs(days!)}d ago)</span>}
                        {!expired && expiringSoon && <span className="text-amber-600 font-semibold"> ({days}d left)</span>}
                      </>
                    )}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-4 bg-muted/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Document Reference</p>
                      <p className="text-sm font-mono">{doc.document_reference}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Original / Copy</p>
                      <p className="text-sm">{KEY_DOC_ORIGINAL_OR_COPY_LABEL[doc.original_or_copy]}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Location</p>
                      <p className="text-sm flex items-center gap-1"><Lock className="h-3.5 w-3.5" />{doc.location}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Key Holder</p>
                      <p className="text-sm">{getStaffName(doc.key_holder)}</p>
                    </div>
                    {doc.expiry_date && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Expiry Date</p>
                        <p className={cn("text-sm",
                          expired && "text-red-600 font-semibold",
                          !expired && expiringSoon && "text-amber-600 font-semibold"
                        )}>
                          {formatDate(doc.expiry_date)}
                          {expired && ` (expired ${Math.abs(days!)} days ago)`}
                          {!expired && expiringSoon && ` (${days} days remaining)`}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Renewal Required</p>
                      <p className="text-sm">{doc.renewal_required ? "Yes" : "No"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Purpose of Holding</p>
                    <p className="text-sm">{doc.purpose_of_holding}</p>
                  </div>

                  {/* Child involvement flags */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className={cn("rounded-md border p-2 flex items-center gap-2 text-xs",
                      doc.child_aware ? "bg-green-50 border-green-200 text-green-800" : "bg-muted text-muted-foreground"
                    )}>
                      {doc.child_aware ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      Child aware: {doc.child_aware ? "Yes" : "No"}
                    </div>
                    <div className={cn("rounded-md border p-2 flex items-center gap-2 text-xs",
                      doc.child_can_request_sight ? "bg-green-50 border-green-200 text-green-800" : "bg-muted text-muted-foreground"
                    )}>
                      <Eye className="h-3.5 w-3.5" />
                      Can request sight: {doc.child_can_request_sight ? "Yes" : "No"}
                    </div>
                    <div className={cn("rounded-md border p-2 flex items-center gap-2 text-xs",
                      doc.part_of_transition_pack ? "bg-indigo-50 border-indigo-200 text-indigo-800" : "bg-muted text-muted-foreground"
                    )}>
                      <Package className="h-3.5 w-3.5" />
                      Transition pack: {doc.part_of_transition_pack ? "Yes" : "No"}
                    </div>
                  </div>

                  {/* Access log */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Access Log ({doc.access_log.length} entries)</p>
                    {doc.access_log.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No recorded access events.</p>
                    ) : (
                      <div className="space-y-1">
                        {doc.access_log.map((entry, i) => (
                          <div key={i} className="rounded-md border bg-background p-2 text-xs flex items-start gap-2">
                            <Clock className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                            <div className="flex-1">
                              <span className="font-medium">{formatDate(entry.date)}</span>
                              {" — "}
                              <span>{getStaffName(entry.accessor)}</span>
                              <p className="text-muted-foreground">{entry.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-2 border-t">
                    <span><Calendar className="inline h-3.5 w-3.5 mr-0.5" />Last reviewed: {formatDate(doc.last_reviewed_date)}</span>
                    <span><User className="inline h-3.5 w-3.5 mr-0.5" />Reviewed by: {getStaffName(doc.reviewed_by)}</span>
                  </div>

                  <SmartLinkPanel sourceType="key_document" sourceId={doc.id} childId={doc.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Context ─────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Regulatory Context</p>
            <p>
              <strong>Regulation 36 (Records)</strong> of the Children&apos;s Homes (England) Regulations 2015
              requires the registered person to maintain accurate, comprehensive records on each child, including
              identity, legal status, health and education documentation. Schedule 3 sets out specific record-keeping
              requirements covering personal history, plans, and key documents.
            </p>
            <p>
              The home holds these documents in trust for the young person. Quality Standard 7 (Positive Relationships)
              and Quality Standard 11 (Health & Wellbeing) both depend on the home being able to evidence and act on
              key information. Critically, this register supports <strong>preparation for transition to adulthood</strong>:
              when a young person moves on, they should leave with a complete set of their own documents — birth certificate,
              passport, NHS card, school records, pathway plan and identity papers — so they can access housing,
              employment, healthcare and benefits without delay. Children&apos;s right to see their own records
              (under GDPR / Data Protection Act 2018) is reflected in the &quot;child can request sight&quot; flag.
            </p>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Child Key Document Tracker — passport, birth certificate, NI number, red book, immunisation records, court orders, care plans, CLA documents, document location tracking"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
