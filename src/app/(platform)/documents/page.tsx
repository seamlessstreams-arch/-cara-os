"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  FileText, Upload, Search, FolderOpen, Eye,
  CheckSquare, AlertTriangle, Clock, Download, ExternalLink,
  History, Shield, Users, BookOpen, ClipboardList,
  Star, FileCheck, RefreshCw, Tag, Plus, CheckCircle2, ArrowUpDown,
} from "lucide-react";
import { getStaffName } from "@/lib/seed-data";
import { useStaff } from "@/hooks/use-staff";
import { useDocuments } from "@/hooks/use-documents";
import { useAuthContext } from "@/contexts/auth-context";
import { cn, formatDate, todayStr, daysFromNow } from "@/lib/utils";
import { DOCUMENT_CATEGORIES } from "@/lib/constants";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import type { Document, DocumentReadReceipt } from "@/types";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

type Tab = "library" | "read_sign" | "upload";
type CategoryFilter = "all" | string;

const DOCUMENT_EXPORT_COLS: ExportColumn<Document>[] = [
  { header: "Title", accessor: (d) => d.title },
  { header: "Category", accessor: (d) => d.category.replace(/_/g, " ") },
  { header: "File Name", accessor: (d) => d.file_name },
  { header: "Version", accessor: (d) => d.version },
  { header: "Tags", accessor: (d) => d.tags.join(", ") },
  { header: "Requires Sign-Off", accessor: (d) => d.requires_read_sign ? "Yes" : "No" },
  { header: "Expiry Date", accessor: (d) => d.expiry_date },
  { header: "Created", accessor: (d) => d.created_at },
];

const CAT_ICONS: Record<string, React.ElementType> = {
  policy: Shield,
  procedure: BookOpen,
  risk_assessment: AlertTriangle,
  care_plan: ClipboardList,
  behaviour_support: Star,
  missing_protocol: FileCheck,
  contract: FileText,
  reg44_report: FileCheck,
  ofsted_correspondence: ExternalLink,
  training_certificate: CheckSquare,
  default: FileText,
};

const CAT_COLORS: Record<string, string> = {
  policy: "bg-blue-100 text-blue-700",
  procedure: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]",
  risk_assessment: "bg-red-100 text-red-700",
  care_plan: "bg-emerald-100 text-emerald-700",
  behaviour_support: "bg-amber-100 text-amber-700",
  missing_protocol: "bg-rose-100 text-rose-700",
  contract: "bg-slate-100 text-[var(--cs-text-secondary)]",
  reg44_report: "bg-indigo-100 text-indigo-700",
  default: "bg-slate-100 text-[var(--cs-text-secondary)]",
};

const EMPTY_UPLOAD_FORM: {
  title: string; category: string; description: string;
  expiryDate: string; requiresReadSign: boolean; tags: string;
} = {
  title: "", category: DOCUMENT_CATEGORIES[0] ?? "policy",
  description: "", expiryDate: "", requiresReadSign: false, tags: "",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function DocumentCard({
  doc,
  isSigned,
  onSign,
}: {
  doc: Document;
  isSigned: boolean;
  onSign: () => void;
}) {
  const Icon = CAT_ICONS[doc.category] || CAT_ICONS.default;
  const colorClass = CAT_COLORS[doc.category] || CAT_COLORS.default;
  const isExpiringSoon = doc.expiry_date && doc.expiry_date <= daysFromNow(30);
  const isExpired = doc.expiry_date && doc.expiry_date < todayStr();

  return (
    <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 hover:shadow-md transition-all hover:-translate-y-0.5 space-y-3">
      <div className="flex items-start gap-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[var(--cs-navy)] line-clamp-2">{doc.title}</div>
          {doc.description && <div className="text-xs text-[var(--cs-text-muted)] mt-0.5 line-clamp-1">{doc.description}</div>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge className={cn("text-[9px] rounded-full", colorClass)}>
            {doc.category.replace(/_/g, " ")}
          </Badge>
          <div className="flex items-center gap-1 text-[10px] text-[var(--cs-text-muted)]">
            <History className="h-2.5 w-2.5" />v{doc.version}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-[var(--cs-text-muted)]">
        <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{formatFileSize(doc.file_size)}</span>
        {doc.expiry_date && (
          <span className={cn("flex items-center gap-1", isExpired ? "text-red-600 font-semibold" : isExpiringSoon ? "text-amber-600 font-medium" : "")}>
            <Clock className="h-3 w-3" />{isExpired ? "Expired" : "Expires"} {formatDate(doc.expiry_date)}
          </span>
        )}
      </div>

      {doc.requires_read_sign && (
        <div className="border-t border-[var(--cs-border-subtle)] pt-2">
          <div className="text-[10px] text-[var(--cs-text-muted)] mb-1">Read & sign progress shown in the Read & Sign tab.</div>
        </div>
      )}

      {doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doc.tags.map((tag) => (
            <span key={tag} className="text-[10px] bg-slate-100 text-[var(--cs-text-muted)] rounded-full px-2 py-0.5">{tag}</span>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-7 text-xs"
          disabled
          title="Document files are stored externally. Open from your file system."
        >
          <Eye className="h-3 w-3 mr-1" />View
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          disabled
          title="Download from your file system or request from your manager."
        >
          <Download className="h-3 w-3" />
        </Button>
        {doc.requires_read_sign && !isSigned && (
          <Button
            size="sm"
            className="flex-1 h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
            onClick={onSign}
          >
            <FileCheck className="h-3 w-3 mr-1" />Sign
          </Button>
        )}
        {doc.requires_read_sign && isSigned && (
          <Badge className="flex-1 h-7 flex items-center justify-center text-[10px] rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />Signed
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const staffQuery = useStaff();
  const allActiveStaff = (staffQuery.data?.data ?? []).filter((s) => s.is_active);
  const [tab, setTab] = useState<Tab>("library");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title" | "category">("date");
  const [catFilter, setCatFilter] = useState<CategoryFilter>("all");

  const { currentUser } = useAuthContext();
  const docsQuery = useDocuments();
  const documents = docsQuery.data?.data ?? [];
  const allReceipts = docsQuery.data?.receipts ?? [];

  // Track which docs the current user has personally signed this session
  const [signedByMe, setSignedByMe] = useState<Set<string>>(() => new Set<string>());
  useEffect(() => {
    if (allReceipts.length > 0) {
      setSignedByMe(new Set(
        allReceipts
          .filter((r) => r.staff_id === (currentUser?.id ?? "staff_darren") && r.signed_at)
          .map((r) => r.document_id)
      ));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docsQuery.data]);
  function handleSign(docId: string) {
    setSignedByMe((prev) => new Set([...prev, docId]));
  }

  // Upload form state
  const [uploadForm, setUploadForm] = useState(EMPTY_UPLOAD_FORM);
  const [uploadError, setUploadError] = useState("");
  const [uploadSaved, setUploadSaved] = useState(false);

  function handleUpload() {
    if (!uploadForm.title.trim()) { setUploadError("Document title is required."); return; }
    setUploadError("");
    setUploadSaved(true);
    setUploadForm(EMPTY_UPLOAD_FORM);
    setTimeout(() => setUploadSaved(false), 4000);
  }

  const filteredDocs = useMemo(() => {
    let list = documents;
    if (catFilter !== "all") list = list.filter((d) => d.category === catFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.title.toLowerCase().includes(q) || d.tags.some((t) => t.includes(q)));
    }
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "title": return a.title.localeCompare(b.title);
        case "category": return (a.category ?? "").localeCompare(b.category ?? "");
        default: return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      }
    });
    return list;
  }, [documents, catFilter, search, sortBy]);

  const stats = useMemo(() => {
    const activeCount = allActiveStaff.length;
    const requireSign = documents.filter((d) => d.requires_read_sign);
    const allSigned = requireSign.filter((d) => {
      const seedSigned = new Set(allReceipts.filter((r) => r.document_id === d.id && r.signed_at).map((r) => r.staff_id));
      if (signedByMe.has(d.id)) seedSigned.add(currentUser?.id ?? "staff_darren");
      return seedSigned.size >= activeCount;
    });
    const expiring = documents.filter((d) => d.expiry_date && d.expiry_date <= daysFromNow(30) && d.expiry_date >= todayStr());
    const expired = documents.filter((d) => d.expiry_date && d.expiry_date < todayStr());
    return { total: documents.length, requireSign: requireSign.length, allSigned: allSigned.length, expiring: expiring.length, expired: expired.length };
  }, [documents, signedByMe]);

  const tabs = [
    { id: "library" as Tab, label: "Document Library", icon: FolderOpen },
    { id: "read_sign" as Tab, label: "Read & Sign", icon: FileCheck },
    { id: "upload" as Tab, label: "Upload", icon: Upload },
  ];

  // Outstanding read-and-sign for current user (darren)
  const myOutstanding = documents.filter((d) => {
    if (!d.requires_read_sign) return false;
    return !signedByMe.has(d.id);
  });

  return (
    <PageShell
      title="Documents"
      subtitle="Secure document storage, version control, and mandatory read-and-sign"
      caraContext={{ pageTitle: "Documents", sourceType: "document" }}
      quickCreateContext={{ module: "documents", defaultTaskCategory: "compliance" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton<Document> filename="documents-export" data={filteredDocs} columns={DOCUMENT_EXPORT_COLS} label="Export" />
          <PrintButton title="Documents" subtitle="Chamberlain House — Document Repository" targetId="documents-content" />
          <Button variant="outline" size="sm" onClick={() => setTab("read_sign")}>
            <FileCheck className="h-3.5 w-3.5 mr-1" />Read & Sign
          </Button>
          <Button size="sm" onClick={() => setTab("upload")}>
            <Upload className="h-3.5 w-3.5 mr-1" />Upload Document
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "uploaded_document", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="documents-content" className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Documents", value: stats.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Require Sign", value: stats.requireSign, icon: FileCheck, color: "text-[var(--cs-cara-gold)]", bg: "bg-[var(--cs-cara-gold-bg)]" },
            { label: "Fully Signed", value: stats.allSigned, icon: CheckSquare, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Expiring Soon", value: stats.expiring, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Expired", value: stats.expired, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">{label}</div>
                  <div className={cn("mt-1 text-2xl font-bold", color)}>{value}</div>
                </div>
                <div className={cn("rounded-xl p-2", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* My outstanding sign-offs */}
        {myOutstanding.length > 0 && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <FileCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-900">
                You have {myOutstanding.length} document{myOutstanding.length > 1 ? "s" : ""} to read and sign
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {myOutstanding.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setTab("read_sign")}
                    className="text-xs bg-white border border-amber-200 text-amber-800 rounded-full px-3 py-1 hover:bg-amber-50"
                  >
                    {d.title} →
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                tab === id ? "bg-white text-[var(--cs-navy)] shadow-sm" : "text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Library tab */}
        {tab === "library" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="h-9 rounded-xl border border-[var(--cs-border)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All categories</option>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>
                ))}
              </select>
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "title" | "category")}
                  className="h-9 rounded-xl border border-[var(--cs-border)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Newest first</option>
                  <option value="title">Title A–Z</option>
                  <option value="category">Category</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  isSigned={signedByMe.has(doc.id)}
                  onSign={() => handleSign(doc.id)}
                />
              ))}
              {filteredDocs.length === 0 && (
                <div className="col-span-full py-16 text-center text-sm text-[var(--cs-text-muted)]">No documents match your search</div>
              )}
            </div>
          </div>
        )}

        {/* Read & Sign tab */}
        {tab === "read_sign" && (
          <div className="space-y-5">
            {documents.filter((d) => d.requires_read_sign).map((doc) => {
              const activeStaff = allActiveStaff;
              const seedSigned = allReceipts.filter((r) => r.document_id === doc.id && r.signed_at);
              const signedStaffIds = new Set([
                ...seedSigned.map((r) => r.staff_id),
                ...(signedByMe.has(doc.id) ? [currentUser?.id ?? "staff_darren"] : []),
              ]);
              const signed = activeStaff.filter((s) => signedStaffIds.has(s.id));
              const notSigned = activeStaff.filter((s) => !signedStaffIds.has(s.id));
              const pct = Math.round((signedStaffIds.size / activeStaff.length) * 100);
              const Icon = CAT_ICONS[doc.category] || CAT_ICONS.default;

              return (
                <Card key={doc.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", CAT_COLORS[doc.category] || CAT_COLORS.default)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-semibold text-[var(--cs-navy)]">{doc.title}</span>
                          <Badge className={cn("text-[9px] rounded-full", pct === 100 ? "bg-emerald-100 text-emerald-700" : pct > 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                            {pct}% signed
                          </Badge>
                        </div>
                        <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                          v{doc.version} · {formatDate(doc.updated_at)} · {doc.category.replace(/_/g, " ")}
                        </div>
                        <Progress value={pct} color={pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-amber-500" : "bg-red-500"} className="h-1.5 mt-2" />
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] mb-1.5">Signed ({signed.length})</div>
                            <div className="flex flex-wrap gap-1.5">
                              {signed.map((s) => (
                                <div key={s.id} className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                                  <CheckSquare className="h-2.5 w-2.5 text-emerald-600" />
                                  <span className="text-[10px] text-emerald-800">{s.first_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] mb-1.5">Outstanding ({notSigned.length})</div>
                            <div className="flex flex-wrap gap-1.5">
                              {notSigned.map((s) => (
                                <div key={s.id} className="flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5">
                                  <Clock className="h-2.5 w-2.5 text-red-500" />
                                  <span className="text-[10px] text-red-700">{s.first_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        {/* Sign button for current user if not yet signed */}
                        {!signedByMe.has(doc.id) && (
                          <Button
                            size="sm"
                            className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                            onClick={() => handleSign(doc.id)}
                          >
                            <FileCheck className="h-3 w-3 mr-1" />Mark as Read & Sign
                          </Button>
                        )}
                        {signedByMe.has(doc.id) && (
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />You signed this document
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          disabled
                          title="Email reminders require the notifications integration to be configured."
                        >
                          <Users className="h-3 w-3 mr-1" />Remind all
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          disabled
                          title="Sign-off reports can be exported once the document export feature is enabled."
                        >
                          <Download className="h-3 w-3 mr-1" />Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Upload tab */}
        {tab === "upload" && (
          <Card>
            <CardContent className="pt-6">
              <div className="max-w-lg mx-auto space-y-5">
                {uploadSaved && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />Document uploaded successfully.
                  </div>
                )}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                  <Upload className="h-10 w-10 text-[var(--cs-text-muted)] mx-auto mb-3" />
                  <div className="text-sm font-medium text-[var(--cs-text-secondary)]">Drop files here or click to browse</div>
                  <div className="text-xs text-[var(--cs-text-muted)] mt-1">PDF, Word, Excel up to 25MB</div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1">
                      Document title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter a clear document title..."
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1">Category</label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full h-9 rounded-xl border border-[var(--cs-border)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DOCUMENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1">Description (optional)</label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--cs-border)] p-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1">Expiry date (optional)</label>
                      <input
                        type="date"
                        value={uploadForm.expiryDate}
                        onChange={(e) => setUploadForm((f) => ({ ...f, expiryDate: e.target.value }))}
                        className="w-full h-9 rounded-xl border border-[var(--cs-border)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm text-[var(--cs-text-secondary)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={uploadForm.requiresReadSign}
                          onChange={(e) => setUploadForm((f) => ({ ...f, requiresReadSign: e.target.checked }))}
                          className="rounded"
                        />
                        Requires read &amp; sign
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1">Tags (comma-separated)</label>
                    <Input
                      placeholder="e.g. safeguarding, mandatory, policy"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm((f) => ({ ...f, tags: e.target.value }))}
                    />
                  </div>
                  {uploadError && <p className="text-xs text-red-600 font-medium">{uploadError}</p>}
                  <Button className="w-full" onClick={handleUpload}>
                    <Upload className="h-4 w-4 mr-2" />Upload Document
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Documents — policy documents, risk assessments, care plans, staff records, Ofsted correspondence, meeting minutes, statutory reports, version control, mandatory read-and-sign"
        recordType="uploaded_document"
        className="mt-6"
      />
    </PageShell>
  );
}
