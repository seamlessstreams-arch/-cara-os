"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import {
  Briefcase, FileText, Upload, ChevronRight, Search,
  FolderOpen, Users, Award, ShieldCheck, Filter,
  CheckCircle2, Clock,
} from "lucide-react";
import Link from "next/link";
import { useDocumentIntelligence } from "@/hooks/use-doc-intelligence";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { useStaff } from "@/hooks/use-staff";
import { getStaffName as seedGetStaffName } from "@/lib/seed-data";
import { DOCUMENT_CATEGORY_LABELS, type DocumentIntelCategory } from "@/types/documents";
import type { UploadedDocument } from "@/types/documents";

// Evidence-relevant categories
const EVIDENCE_CATEGORIES: { key: DocumentIntelCategory | "all"; label: string }[] = [
  { key: "all", label: "All Categories" },
  { key: "training_certificate", label: "Training Certs" },
  { key: "supervision_record_doc", label: "Supervision" },
  { key: "probation_review", label: "Probation" },
  { key: "reference", label: "References" },
  { key: "dbs_certificate", label: "DBS" },
  { key: "right_to_work", label: "Right to Work" },
];

const STATUS_COLOUR: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  actioned: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
  pending: "bg-slate-100 text-[var(--cs-text-secondary)]",
  analysing: "bg-indigo-100 text-indigo-700",
  rejected: "bg-red-100 text-red-700",
  archived: "bg-slate-100 text-[var(--cs-text-muted)]",
};

// ── Export columns ────────────────────────────────────────────────────────────

const EVIDENCE_EXPORT_COLS: ExportColumn<UploadedDocument>[] = [
  { header: "Filename", accessor: (r) => r.original_file_name },
  { header: "Staff", accessor: (r) => r.linked_staff_id ? seedGetStaffName(r.linked_staff_id) : "" },
  { header: "Category", accessor: (r) => r.document_category ? DOCUMENT_CATEGORY_LABELS[r.document_category] ?? r.document_category : "" },
  { header: "Status", accessor: (r) => r.document_status },
  { header: "Risk Level", accessor: (r) => r.ai_risk_level ?? "" },
  { header: "Uploaded", accessor: (r) => r.created_at?.split("T")[0] ?? "" },
  { header: "Approved", accessor: (r) => r.approved_at?.split("T")[0] ?? "" },
  { header: "File Type", accessor: (r) => r.file_type },
];

export default function EvidencePortfolioPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<DocumentIntelCategory | "all">("all");

  const docsQuery  = useDocumentIntelligence();
  const staffQuery = useStaff();

  const allDocs = docsQuery.data?.data ?? [];
  const staff   = staffQuery.data?.data ?? [];

  const getStaffName = (id: string | undefined | null) => {
    if (!id) return null;
    return staff.find((s) => s.id === id)?.full_name ?? null;
  };

  // Stats
  const stats = useMemo(() => {
    const staffDocs = allDocs.filter((d) => d.linked_staff_id);
    const staffWithEvidence = new Set(staffDocs.map((d) => d.linked_staff_id)).size;
    const categories = new Set(allDocs.map((d) => d.document_category).filter(Boolean)).size;
    const approved = allDocs.filter((d) => d.document_status === "approved").length;
    const pending = allDocs.filter((d) => d.document_status === "pending" || d.document_status === "review").length;

    return {
      totalDocs: allDocs.length,
      staffWithEvidence,
      categories,
      approved,
      pending,
      totalStaff: staff.length,
    };
  }, [allDocs, staff]);

  // Filter docs
  const filteredDocs = useMemo(() => {
    let docs = allDocs;

    if (categoryFilter !== "all") {
      docs = docs.filter((d) => d.document_category === categoryFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter((d) => {
        const fileName = d.original_file_name?.toLowerCase() ?? "";
        const staffName = getStaffName(d.linked_staff_id)?.toLowerCase() ?? "";
        const category = d.document_category ? DOCUMENT_CATEGORY_LABELS[d.document_category]?.toLowerCase() ?? "" : "";
        return fileName.includes(q) || staffName.includes(q) || category.includes(q);
      });
    }

    return docs;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDocs, staff, categoryFilter, search]);

  // Group filtered docs by staff
  const docsByStaff = useMemo(() => {
    const grouped: Record<string, typeof filteredDocs> = {};
    staff.forEach((s) => {
      const docs = filteredDocs.filter((d) => d.linked_staff_id === s.id);
      if (docs.length > 0) grouped[s.id] = docs;
    });
    return grouped;
  }, [filteredDocs, staff]);

  const unlinkedDocs = useMemo(() =>
    filteredDocs.filter((d) => !d.linked_staff_id && !d.linked_child_id && !d.linked_incident_id),
  [filteredDocs]);

  // Category counts for filter tabs
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<DocumentIntelCategory, number>> = {};
    allDocs.forEach((d) => {
      if (d.document_category) {
        counts[d.document_category] = (counts[d.document_category] ?? 0) + 1;
      }
    });
    return counts;
  }, [allDocs]);

  return (
    <PageShell
      title="Evidence Portfolio"
      subtitle="CPD evidence, certificates & practice documentation for all staff"
      caraContext={{ pageTitle: "CPD & Practice Evidence Portfolio", sourceType: "staff" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            filename="evidence-portfolio"
            columns={EVIDENCE_EXPORT_COLS}
            data={filteredDocs}
            label="Export"
          />
          <PrintButton title="Evidence Portfolio" subtitle="CPD & Practice Evidence" targetId="evidence-content" />
          <SmartUploadButton
            variant="inline"
            label="Upload Evidence"
            uploadContext="Workforce Evidence Portfolio — CPD certificate, observation, or practice evidence upload"
          />
          <CaraStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="evidence-content" className="space-y-0">

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <FolderOpen className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-[var(--cs-navy)] tabular-nums">{stats.totalDocs}</div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Total Documents</div>
        </div>
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <Users className="h-4 w-4 text-blue-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-blue-700 tabular-nums">
            {stats.staffWithEvidence}/{stats.totalStaff}
          </div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Staff with Evidence</div>
        </div>
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <Award className="h-4 w-4 text-[var(--cs-cara-gold)] mx-auto mb-1" />
          <div className="text-lg font-bold text-[var(--cs-cara-gold)] tabular-nums">{stats.categories}</div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Categories</div>
        </div>
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <CheckCircle2 className={cn("h-4 w-4 mx-auto mb-1", stats.approved > 0 ? "text-emerald-500" : "text-[var(--cs-text-gentle)]")} />
          <div className={cn("text-lg font-bold tabular-nums", stats.approved > 0 ? "text-emerald-700" : "text-[var(--cs-text-muted)]")}>{stats.approved}</div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Approved</div>
        </div>
        <div className="rounded-xl border border-[var(--cs-border)] bg-white p-3 text-center">
          <Clock className={cn("h-4 w-4 mx-auto mb-1", stats.pending > 0 ? "text-amber-500" : "text-[var(--cs-text-gentle)]")} />
          <div className={cn("text-lg font-bold tabular-nums", stats.pending > 0 ? "text-amber-700" : "text-[var(--cs-text-muted)]")}>{stats.pending}</div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">Pending Review</div>
        </div>
      </div>

      {/* Search + Category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <input
            type="text"
            placeholder="Search by filename, staff name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--cs-border)] bg-white py-1.5 pl-9 pr-3 text-xs text-[var(--cs-text-secondary)] placeholder:text-[var(--cs-text-muted)] focus:border-[var(--cs-cara-gold)] focus:ring-1 focus:ring-[var(--cs-cara-gold)]/30 outline-none transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {EVIDENCE_CATEGORIES.map(({ key, label }) => {
            const count = key === "all" ? allDocs.length : (categoryCounts[key] ?? 0);
            if (key !== "all" && count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                  categoryFilter === key
                    ? "bg-[var(--cs-navy)] text-white border-[var(--cs-navy)]"
                    : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:border-indigo-300",
                )}
              >
                {label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload CTA */}
      <div className="rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/40 p-6 text-center">
        <Upload className="h-8 w-8 mx-auto mb-2 text-indigo-400" />
        <p className="text-sm font-semibold text-indigo-800 mb-1">Upload CPD or Practice Evidence</p>
        <p className="text-xs text-indigo-600 mb-3">Certificates, reflective accounts, observation reports, training records</p>
        <SmartUploadButton
          variant="button"
          label="Upload Evidence Document"
          uploadContext="Workforce Evidence Portfolio — staff CPD evidence upload"
        />
      </div>

      {/* Staff without evidence alert */}
      {stats.staffWithEvidence < stats.totalStaff && stats.totalStaff > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700">
              {stats.totalStaff - stats.staffWithEvidence} staff member{stats.totalStaff - stats.staffWithEvidence !== 1 ? "s" : ""} with no linked evidence
            </p>
            <p className="text-[11px] text-amber-600">
              Ofsted inspectors may request evidence of CPD for any staff member during inspection
            </p>
          </div>
        </div>
      )}

      {/* By staff member */}
      {Object.keys(docsByStaff).length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest">By Staff Member</p>
          {Object.entries(docsByStaff).map(([staffId, docs]) => {
            const member = staff.find((s) => s.id === staffId);
            if (!member) return null;
            return (
              <div key={staffId} className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-[var(--cs-border-subtle)]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                      {member.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--cs-navy)]">{member.full_name}</p>
                      <p className="text-xs text-[var(--cs-text-muted)]">
                        {docs.length} document{docs.length !== 1 ? "s" : ""}
                        {member.job_title && <span className="text-[var(--cs-text-muted)]"> · {member.job_title}</span>}
                      </p>
                    </div>
                  </div>
                  <Link href={`/workforce/staff/${staffId}`}>
                    <ChevronRight className="h-4 w-4 text-[var(--cs-text-gentle)] hover:text-[var(--cs-text-muted)] transition-colors" />
                  </Link>
                </div>
                <div className="divide-y divide-slate-50">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 px-4 py-2.5">
                      <FileText className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--cs-navy)] truncate">{doc.original_file_name}</p>
                        <p className="text-[10px] text-[var(--cs-text-muted)]">
                          {doc.document_category ? DOCUMENT_CATEGORY_LABELS[doc.document_category] : "Uncategorised"}
                          {doc.created_at && <span> · {new Date(doc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                        </p>
                      </div>
                      {doc.document_status && (
                        <Badge className={cn("text-[9px] px-1.5 py-0 rounded-full border-0", STATUS_COLOUR[doc.document_status] ?? "bg-slate-100 text-[var(--cs-text-muted)]")}>
                          {doc.document_status.replace(/_/g, " ")}
                        </Badge>
                      )}
                      {doc.ai_risk_level && doc.ai_risk_level !== "low" && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          doc.ai_risk_level === "critical" ? "bg-red-100 text-red-700"
                          : doc.ai_risk_level === "high" ? "bg-orange-100 text-orange-700"
                          : "bg-amber-100 text-amber-700",
                        )}>
                          {doc.ai_risk_level}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unlinked documents */}
      {unlinkedDocs.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-widest">General Evidence</p>
          <div className="rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden">
            <div className="divide-y divide-slate-50">
              {unlinkedDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-2.5">
                  <FileText className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--cs-navy)] truncate">{doc.original_file_name}</p>
                    <p className="text-[10px] text-[var(--cs-text-muted)]">
                      {doc.document_category ? DOCUMENT_CATEGORY_LABELS[doc.document_category] : "Uncategorised"}
                      {doc.created_at && <span> · {new Date(doc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                    </p>
                  </div>
                  {doc.document_status && (
                    <Badge className={cn("text-[9px] px-1.5 py-0 rounded-full border-0", STATUS_COLOUR[doc.document_status] ?? "bg-slate-100 text-[var(--cs-text-muted)]")}>
                      {doc.document_status.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {filteredDocs.length === 0 && allDocs.length > 0 && (
        <div className="text-center py-8 text-[var(--cs-text-muted)]">
          <Search className="h-6 w-6 mx-auto mb-2 text-[var(--cs-text-gentle)]" />
          <p className="text-sm">No documents match your search</p>
          <p className="text-xs mt-1">Try adjusting the search or category filter</p>
        </div>
      )}

      {allDocs.length === 0 && (
        <div className="text-center py-8 text-[var(--cs-text-muted)]">
          <Briefcase className="h-8 w-8 mx-auto mb-2 text-[var(--cs-text-gentle)]" />
          <p className="text-sm">No evidence uploaded yet</p>
          <p className="text-xs mt-1">Upload CPD certificates, observation reports, or training records above</p>
        </div>
      )}

      <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-4 py-3 text-xs text-[var(--cs-text-muted)]">
        <span className="font-semibold text-[var(--cs-text-secondary)]">ILACS Inspection Note — </span>
        Ofsted inspectors may request evidence of staff CPD and professional development during inspection.
        This portfolio provides a single location for all workforce development evidence, accessible during
        Reg 44 visits and full Ofsted inspections.
      </div>
      </div>{/* close #evidence-content */}
      <CaraPanel
        mode="assist"
        pageContext="CPD & Practice Evidence Portfolio — continuing professional development, CPD certificates, practice observations, reflective logs, training evidence, Reg 34 compliance, Ofsted workforce evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}
