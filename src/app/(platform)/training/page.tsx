"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TRAINING & COMPLIANCE
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  GraduationCap, Search, Plus, AlertTriangle, CheckCircle2, Clock,
  XCircle, Shield, Loader2, Sparkles, Brain, ChevronRight, FileText,
  ArrowUpDown, Filter, BarChart3, Users,
} from "lucide-react";
import { getStaffName } from "@/lib/seed-data";
import { useTraining, useAddTrainingRecord } from "@/hooks/use-training";
import type { TrainingRecord } from "@/types";
import { useCreateTrainingNeed } from "@/hooks/use-ri-learning";
import { useStaff } from "@/hooks/use-staff";
import { cn, formatDate } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import { TRAINING_CATEGORIES } from "@/lib/constants";
import type { TrainingCategory } from "@/lib/constants";
import Link from "next/link";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const STATUS_STYLES: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  compliant:     { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2,  label: "Compliant"     },
  expiring_soon: { color: "bg-amber-100 text-amber-700",     icon: Clock,         label: "Expiring Soon"  },
  expired:       { color: "bg-red-100 text-red-700",          icon: XCircle,       label: "Expired"        },
  not_started:   { color: "bg-slate-100 text-slate-600",     icon: AlertTriangle, label: "Not Started"   },
};

const CATEGORY_LABELS: Record<TrainingCategory, string> = {
  mandatory:            "Mandatory",
  safeguarding:         "Safeguarding",
  medication:           "Medication",
  first_aid:            "First Aid",
  fire_safety:          "Fire Safety",
  restraint:            "Restraint / PBS",
  mental_health:        "Mental Health",
  data_protection:      "Data Protection",
  health_and_safety:    "Health & Safety",
  food_hygiene:         "Food Hygiene",
  equality_diversity:   "Equality & Diversity",
  trauma_informed:      "Trauma-Informed",
  professional_development: "Professional Development",
};

const TRAINING_EXPORT_COLS: ExportColumn<TrainingRecord>[] = [
  { header: "Course", accessor: (t) => t.course_name },
  { header: "Staff", accessor: (t) => getStaffName(t.staff_id) },
  { header: "Category", accessor: (t) => CATEGORY_LABELS[t.category as TrainingCategory] ?? t.category },
  { header: "Provider", accessor: (t) => t.provider },
  { header: "Completed", accessor: (t) => t.completed_date },
  { header: "Expiry", accessor: (t) => t.expiry_date },
  { header: "Status", accessor: (t) => t.status },
  { header: "Mandatory", accessor: (t) => t.is_mandatory ? "Yes" : "No" },
  { header: "Notes", accessor: (t) => t.notes },
];

// ── Add Record dialog ──────────────────────────────────────────────────────────
function AddRecordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [staffId, setStaffId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [category, setCategory] = useState<TrainingCategory>("mandatory");
  const [provider, setProvider] = useState("");
  const [completedDate, setCompletedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [notes, setNotes] = useState("");

  const staffQuery = useStaff();
  const activeStaff = (staffQuery.data?.data ?? []).filter((s) => s.is_active);
  const addMutation = useAddTrainingRecord();

  const reset = () => {
    setStaffId(""); setCourseName(""); setCategory("mandatory"); setProvider("");
    setCompletedDate(""); setExpiryDate(""); setIsMandatory(true); setNotes("");
  };

  const handleSubmit = () => {
    if (!staffId || !courseName) return;
    addMutation.mutate(
      {
        staff_id: staffId,
        course_name: courseName,
        category,
        provider: provider || null,
        completed_date: completedDate || null,
        expiry_date: expiryDate || null,
        certificate_url: null,
        is_mandatory: isMandatory,
        notes: notes || null,
        home_id: homeId,
      },
      { onSuccess: () => { reset(); onClose(); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-blue-600" />
            Add Training Record
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Staff Member</label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select staff…" /></SelectTrigger>
              <SelectContent>
                {activeStaff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name} — {s.job_title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Course Name</label>
            <Input className="mt-1" placeholder="e.g. Safeguarding Level 3" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Category</label>
              <Select value={category} onValueChange={(v) => setCategory(v as TrainingCategory)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRAINING_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Provider</label>
              <Input className="mt-1" placeholder="e.g. SCIE, In-house" value={provider} onChange={(e) => setProvider(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Completed Date</label>
              <input type="date" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Expiry Date</label>
              <input type="date" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mandatory-check"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="mandatory-check" className="text-sm text-slate-700">Mandatory training</label>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Notes (optional)</label>
            <Textarea className="mt-1 text-sm" rows={2} placeholder="Any notes about this record…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!staffId || !courseName || addMutation.isPending} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {addMutation.isPending ? "Saving…" : "Add Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── ARIA Compliance Report panel ──────────────────────────────────────────────
type ComplianceReport = {
  summary: string;
  compliance_narrative: string;
  risk_areas: string[];
  recommended_actions: string[];
  priority_courses: string[];
  reg45_impact: string;
};

function ComplianceReportPanel({
  rate, expired, expiring, total,
}: {
  rate: number; expired: number; expiring: number; total: number;
}) {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.post<{ data: { parsed?: ComplianceReport } }>(
        "/aria",
        {
          mode: "training_needs_analysis",
          style: "provider_summary",
          source_content: [
            `Training compliance report for Oak House.`,
            `Overall compliance rate: ${rate}%.`,
            `Total records: ${total}. Expired: ${expired}. Expiring soon: ${expiring}.`,
            `${expired > 0 ? `${expired} mandatory training records have expired — staff should not work unsupervised until recertified.` : "No expired records."}`,
            `${expiring > 0 ? `${expiring} records expiring within 90 days require renewal planning.` : "No imminent renewals."}`,
            `Provide a compliance narrative, risk areas, recommended actions, priority courses for renewal, and Reg 45 impact statement.`,
          ].join(" "),
          page_context: "Training & Compliance — Compliance Report",
          record_type: "compliance_report",
          user_role: "registered_manager",
        }
      );
      const parsed = res.data?.parsed;
      if (parsed) setReport(parsed);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-900">ARIA Compliance Report</p>
            <p className="text-xs text-indigo-600">AI narrative with risk areas and recommended actions</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={generate}
          disabled={loading}
          className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
        >
          <Sparkles className={cn("h-3.5 w-3.5", loading && "animate-pulse")} />
          {loading ? "Generating…" : report ? "Regenerate" : "Generate Report"}
        </Button>
      </div>

      {report && (
        <div className="space-y-3 border-t border-indigo-100 pt-3">
          <p className="text-sm text-indigo-900 leading-relaxed">{report.compliance_narrative}</p>

          {report.risk_areas?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Risk Areas</p>
              <div className="space-y-1">
                {report.risk_areas.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.recommended_actions?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Recommended Actions</p>
              <div className="space-y-1">
                {report.recommended_actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-white border border-slate-100 rounded-lg px-3 py-1.5">
                    <ChevronRight className="h-3 w-3 shrink-0 mt-0.5 text-slate-400" />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.reg45_impact && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
              <p className="text-[11px] font-semibold text-blue-700 mb-1">Reg 45 Impact</p>
              <p className="text-xs text-blue-800 leading-relaxed">{report.reg45_impact}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Link href="/learning/training-needs">
              <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-violet-700 border-violet-200">
                <Brain className="h-3 w-3" />
                View Training Needs
              </Button>
            </Link>
            <Link href="/ri/reg45">
              <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-blue-700 border-blue-200">
                <FileText className="h-3 w-3" />
                Reg 45 Engine
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

type SortKey = "name" | "status" | "expiry" | "category" | "staff";
type CategoryFilter = "all" | TrainingCategory;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TrainingPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [view, setView] = useState<"matrix" | "list">("matrix");
  const [showAdd, setShowAdd] = useState(false);
  const [needCreated, setNeedCreated] = useState<Set<string>>(new Set());

  const trainingQuery = useTraining();
  const staffQuery = useStaff();
  const createNeed = useCreateTrainingNeed();

  const allRecords = trainingQuery.data?.data ?? [];
  const meta = trainingQuery.data?.meta;
  const activeStaff = (staffQuery.data?.data ?? []).filter((s) => s.role !== "responsible_individual");
  const courses = useMemo(() => [...new Set(allRecords.map((t) => t.course_name))], [allRecords]);

  // Available categories in the data
  const availableCategories = useMemo(() => {
    const cats = new Set(allRecords.map((r) => r.category));
    return Array.from(cats).sort() as TrainingCategory[];
  }, [allRecords]);

  // Category counts for the filter
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of allRecords) {
      counts[r.category] = (counts[r.category] || 0) + 1;
    }
    return counts;
  }, [allRecords]);

  // Per-staff compliance for matrix view
  const staffCompliance = useMemo(() => {
    const map: Record<string, { total: number; compliant: number }> = {};
    for (const staff of activeStaff) {
      const staffRecords = allRecords.filter((r) => r.staff_id === staff.id);
      const compliantCount = staffRecords.filter((r) => r.status === "compliant").length;
      map[staff.id] = { total: staffRecords.length, compliant: compliantCount };
    }
    return map;
  }, [activeStaff, allRecords]);

  // Status order for sorting
  const STATUS_ORDER: Record<string, number> = { expired: 0, expiring_soon: 1, not_started: 2, compliant: 3 };

  const filtered = useMemo(() => {
    let list = [...allRecords];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.course_name.toLowerCase().includes(q) ||
        getStaffName(t.staff_id).toLowerCase().includes(q) ||
        (t.provider ?? "").toLowerCase().includes(q)
      );
    }
    if (filterStatus) list = list.filter((t) => t.status === filterStatus);
    if (categoryFilter !== "all") list = list.filter((t) => t.category === categoryFilter);

    // Sort
    list.sort((a, b) => {
      switch (sortKey) {
        case "name": return a.course_name.localeCompare(b.course_name);
        case "staff": return getStaffName(a.staff_id).localeCompare(getStaffName(b.staff_id));
        case "expiry": {
          const ae = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
          const be = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
          return ae - be;
        }
        case "category": return (CATEGORY_LABELS[a.category as TrainingCategory] ?? a.category).localeCompare(CATEGORY_LABELS[b.category as TrainingCategory] ?? b.category);
        case "status":
        default:
          return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
      }
    });
    return list;
  }, [allRecords, search, filterStatus, categoryFilter, sortKey]);

  const isLoading = trainingQuery.isPending || staffQuery.isPending;

  const handleCreateNeed = (record: { id: string; course_name: string; staff_id: string; status: string; category: string }) => {
    const priority = record.status === "expired" ? "urgent" : "high";
    createNeed.mutate(
      {
        home_id: homeId,
        identified_by: "aria",
        need_type: record.category === "safeguarding" ? "safeguarding"
          : record.category === "medication" ? "medication"
          : record.category === "restraint" ? "de_escalation"
          : "safeguarding",
        title: `Renewal required: ${record.course_name} — ${getStaffName(record.staff_id)}`,
        description: `${record.status === "expired" ? "Expired" : "Expiring soon"}: ${record.course_name} for ${getStaffName(record.staff_id)}. Renewal must be arranged promptly.`,
        priority,
        status: "identified",
        aria_evidence: `Training record status: ${record.status}. Auto-generated from Training & Compliance matrix.`,
        created_by: currentUser?.id ?? "staff_darren",
      },
      {
        onSuccess: () => setNeedCreated((prev) => new Set(prev).add(record.id)),
      }
    );
  };

  return (
    <PageShell
      title="Training & Compliance"
      subtitle={
        meta
          ? `${meta.rate}% overall compliance · ${meta.expired} expired · ${meta.expiring} expiring`
          : "Loading…"
      }
      showQuickCreate={false}
      actions={
        <div className="flex gap-2">
          <ExportButton<TrainingRecord> filename="training-export" data={filtered} columns={TRAINING_EXPORT_COLS} label="Export" />
          <PrintButton title="Training Records" subtitle="Oak House — Staff Training & Compliance" targetId="training-content" />
          <SmartUploadButton variant="inline" label="Upload Certificate" uploadContext="Training — certificate upload" />
          <Button size="sm" className="gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Record
          </Button>
        </div>
      }
    >
      <div id="training-content" className="space-y-5 animate-fade-in">

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Records", value: meta?.total ?? "—", colour: "text-slate-700", bg: "bg-slate-50", icon: GraduationCap },
            { label: "Compliant", value: meta?.compliant ?? "—", colour: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2 },
            { label: "Expiring Soon", value: meta?.expiring ?? "—", colour: "text-amber-700", bg: "bg-amber-50", icon: Clock },
            { label: "Expired", value: meta?.expired ?? "—", colour: "text-red-700", bg: "bg-red-50", icon: XCircle },
            { label: "Not Started", value: meta?.not_started ?? "—", colour: "text-slate-600", bg: "bg-slate-50", icon: AlertTriangle },
            { label: "Active Staff", value: activeStaff.length, colour: "text-blue-700", bg: "bg-blue-50", icon: Users },
          ].map(({ label, value, colour, bg, icon: Icon }) => (
            <div key={label} className={cn("rounded-xl border border-slate-100 p-3", bg)}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn("h-3.5 w-3.5 shrink-0", colour)} />
                <span className="text-[10px] text-slate-500 font-medium">{label}</span>
              </div>
              <div className={cn("text-lg font-bold tabular-nums", colour)}>{value}</div>
            </div>
          ))}
        </div>

        {/* Compliance rate bar */}
        {meta && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Overall Compliance
              </span>
              <span className={cn(
                "font-bold tabular-nums",
                meta.rate >= 90 ? "text-emerald-600" : meta.rate >= 75 ? "text-amber-600" : "text-red-600",
              )}>
                {meta.rate}%
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  meta.rate >= 90 ? "bg-emerald-500" : meta.rate >= 75 ? "bg-amber-500" : "bg-red-500",
                )}
                style={{ width: `${meta.rate}%` }}
              />
            </div>
          </div>
        )}

        {/* Alert banner — expired */}
        {meta && meta.expired > 0 && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-red-800">
                  {meta.expired} training record{meta.expired > 1 ? "s" : ""} expired
                </div>
                <div className="text-xs text-red-600 mt-0.5">
                  Staff with expired mandatory training should not work unsupervised until recertified.
                </div>
              </div>
            </div>
            <Link href="/learning/training-needs" className="shrink-0">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 gap-1.5">
                <Brain className="h-3.5 w-3.5" />
                Training Needs
              </Button>
            </Link>
          </div>
        )}

        {/* ARIA Compliance Report */}
        {meta && (
          <ComplianceReportPanel
            rate={meta.rate}
            expired={meta.expired}
            expiring={meta.expiring}
            total={meta.total}
          />
        )}

        {/* Filters + view toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course, staff, or provider…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {Object.entries(STATUS_STYLES).map(([key, cfg]) => (
              <Button
                key={key}
                variant={filterStatus === key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(filterStatus === key ? null : key)}
                className="gap-1"
              >
                <cfg.icon className="h-3 w-3" />{cfg.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            <Button variant={view === "matrix" ? "default" : "outline"} size="sm" onClick={() => setView("matrix")}>Matrix</Button>
            <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>List</Button>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
            >
              <option value="all">All categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c} ({categoryCounts[c] ?? 0})</option>
              ))}
            </select>
          </div>

          {/* Sort (list view) */}
          {view === "list" && (
            <div className="flex items-center gap-1.5 ml-auto">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
              >
                <option value="status">By status (urgent first)</option>
                <option value="expiry">By expiry date</option>
                <option value="name">By course name</option>
                <option value="staff">By staff member</option>
                <option value="category">By category</option>
              </select>
            </div>
          )}
        </div>

        {/* Results count */}
        {(search || filterStatus || categoryFilter !== "all") && (
          <p className="text-xs text-slate-500">
            Showing {filtered.length} of {allRecords.length} record{allRecords.length !== 1 ? "s" : ""}
            {search && <span className="text-slate-400"> matching &ldquo;{search}&rdquo;</span>}
          </p>
        )}

        {/* Regulatory note */}
        {meta && meta.expired > 0 && meta.rate < 100 && (
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
            <Shield className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700">
              <span className="font-semibold">Reg 33 — Fitness of workers.</span>{" "}
              Staff must hold qualifications, skills, and experience necessary for the work they perform. Expired training must be renewed promptly.
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {/* Matrix View */}
        {!isLoading && view === "matrix" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 w-[180px] sticky left-0 bg-slate-50 z-10">Staff</th>
                    {courses.map((course) => (
                      <th key={course} className="py-3 px-2 text-center text-[10px] font-medium text-slate-600 min-w-[100px]">
                        <div className="truncate max-w-[90px] mx-auto" title={course}>{course}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeStaff.map((staff) => {
                    const sc = staffCompliance[staff.id];
                    const pct = sc && sc.total > 0 ? Math.round((sc.compliant / sc.total) * 100) : null;
                    return (
                    <tr key={staff.id} className="border-b hover:bg-slate-50/50">
                      <td className="py-2 px-4 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2">
                          <Avatar name={staff.full_name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-slate-900">{staff.full_name}</div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400">{staff.job_title}</span>
                              {pct !== null && (
                                <span className={cn(
                                  "text-[9px] font-semibold tabular-nums",
                                  pct >= 90 ? "text-emerald-600" : pct >= 75 ? "text-amber-600" : "text-red-600",
                                )}>
                                  {pct}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {courses.map((course) => {
                        const record = allRecords.find((t) => t.staff_id === staff.id && t.course_name === course);
                        if (!record) {
                          return <td key={course} className="py-2 px-2 text-center"><div className="text-[10px] text-slate-300">—</div></td>;
                        }
                        const cfg = STATUS_STYLES[record.status] ?? STATUS_STYLES.not_started;
                        const Icon = cfg.icon;
                        return (
                          <td key={course} className="py-2 px-2 text-center">
                            <div
                              className={cn(
                                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-medium",
                                cfg.color
                              )}
                              title={record.expiry_date ? `${record.status === "expired" ? "Expired" : "Expires"} ${formatDate(record.expiry_date)}` : cfg.label}
                            >
                              <Icon className="h-3 w-3" />
                              {record.expiry_date ? formatDate(record.expiry_date).split(",")[0] : cfg.label}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* List View */}
        {!isLoading && view === "list" && (
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border bg-white p-12 text-center">
                <GraduationCap className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                <div className="text-sm text-slate-500">No training records match your filters</div>
              </div>
            ) : (
              filtered.map((record) => {
                const cfg = STATUS_STYLES[record.status] ?? STATUS_STYLES.not_started;
                const Icon = cfg.icon;
                const isActionable = record.status === "expired" || record.status === "expiring_soon";
                const alreadyCreated = needCreated.has(record.id);
                return (
                  <div key={record.id} className={cn(
                    "rounded-xl border bg-white p-4 flex items-center gap-4 hover:shadow-sm transition-all",
                    record.status === "expired" ? "border-red-200" : record.status === "expiring_soon" ? "border-amber-200" : "border-slate-100"
                  )}>
                    <div className={cn("rounded-full p-2 shrink-0", cfg.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">{record.course_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{getStaffName(record.staff_id)}</span>
                        {record.provider && <span className="text-slate-400">via {record.provider}</span>}
                        {record.category && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {CATEGORY_LABELS[record.category as TrainingCategory] ?? record.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        {record.expiry_date && (
                          <div className={cn(
                            "text-xs font-medium",
                            record.status === "expired" ? "text-red-600"
                            : record.status === "expiring_soon" ? "text-amber-600"
                            : "text-slate-500"
                          )}>
                            {record.status === "expired" ? "Expired" : "Expires"} {formatDate(record.expiry_date)}
                          </div>
                        )}
                        <Badge className={cn("text-[9px] rounded-full mt-0.5", cfg.color)}>{cfg.label}</Badge>
                      </div>
                      {record.is_mandatory && (
                        <Shield className="h-4 w-4 text-blue-400 shrink-0" aria-label="Mandatory" />
                      )}
                      {/* Quick-action: push to Learning Studio */}
                      {isActionable && (
                        alreadyCreated ? (
                          <Link href="/learning/training-needs">
                            <Button size="sm" variant="ghost" className="text-[10px] h-6 gap-0.5 text-violet-600 px-2">
                              <CheckCircle2 className="h-3 w-3" />
                              Need created
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px] h-6 gap-0.5 text-violet-700 border-violet-200 hover:bg-violet-50 px-2 shrink-0"
                            onClick={() => handleCreateNeed(record)}
                            disabled={createNeed.isPending}
                          >
                            <Brain className="h-3 w-3" />
                            Create Need
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {showAdd && <AddRecordDialog open onClose={() => setShowAdd(false)} />}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
