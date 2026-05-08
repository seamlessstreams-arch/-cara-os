"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPLAINTS & REPRESENTATIONS REGISTER
// Statutory Guidance on Complaints in Children's Social Care (2016)
// Children's Homes Quality Standards — Standard 3 (Rights & Responsibilities)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { useComplaints, useCreateComplaint, useUpdateComplaint } from "@/hooks/use-complaints";
import { getYPName } from "@/lib/seed-data";
import type {
  Complaint, ComplaintStatus, ComplaintOutcome, ComplaintCategory, ComplainantType,
} from "@/types/extended";
import {
  MessageCircle, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp,
  Sparkles, User, Calendar, Flag, Plus, Shield, AlertOctagon, Gavel,
  Search, Filter, ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/hooks/use-api";

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  received:            "Received",
  acknowledged:        "Acknowledged",
  under_investigation: "Under Investigation",
  response_sent:       "Response Sent",
  escalated:           "Escalated",
  closed:              "Closed",
};
const STATUS_COLOUR: Record<ComplaintStatus, string> = {
  received:            "bg-slate-100 text-slate-700 border-slate-200",
  acknowledged:        "bg-blue-50 text-blue-700 border-blue-200",
  under_investigation: "bg-amber-50 text-amber-700 border-amber-200",
  response_sent:       "bg-violet-50 text-violet-700 border-violet-200",
  escalated:           "bg-rose-50 text-rose-700 border-rose-200",
  closed:              "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const OUTCOME_COLOUR: Record<ComplaintOutcome, string> = {
  upheld:           "bg-red-50 text-red-700 border-red-200",
  partially_upheld: "bg-amber-50 text-amber-700 border-amber-200",
  not_upheld:       "bg-emerald-50 text-emerald-700 border-emerald-200",
  inconclusive:     "bg-slate-50 text-slate-600 border-slate-200",
  withdrawn:        "bg-slate-50 text-slate-500 border-slate-200",
  ongoing:          "bg-blue-50 text-blue-700 border-blue-200",
};
const OUTCOME_LABELS: Record<ComplaintOutcome, string> = {
  upheld:           "Upheld",
  partially_upheld: "Partially Upheld",
  not_upheld:       "Not Upheld",
  inconclusive:     "Inconclusive",
  withdrawn:        "Withdrawn",
  ongoing:          "Ongoing",
};

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  staff_conduct:        "Staff Conduct",
  care_practice:        "Care Practice",
  environment:          "Environment / Facilities",
  decisions_about_me:   "Decisions About Me",
  contact_family:       "Contact with Family",
  education_health:     "Education / Health",
  leaving_care:         "Leaving Care",
  other:                "Other",
};

const COMPLAINANT_LABELS: Record<ComplainantType, string> = {
  young_person: "Young Person",
  parent_carer: "Parent / Carer",
  advocate:     "Advocate / IRO",
  professional: "Professional",
  anonymous:    "Anonymous",
};

const COMPLAINT_EXPORT_COLS: ExportColumn<Complaint>[] = [
  { header: "Reference", accessor: (c) => c.reference },
  { header: "Date Received", accessor: (c) => c.date_received },
  { header: "Complainant", accessor: (c) => c.complainant_name },
  { header: "Complainant Type", accessor: (c) => COMPLAINANT_LABELS[c.complainant_type] ?? c.complainant_type },
  { header: "Category", accessor: (c) => CATEGORY_LABELS[c.category] ?? c.category },
  { header: "Young Person", accessor: (c) => c.child_id ? getYPName(c.child_id) : "" },
  { header: "Summary", accessor: (c) => c.summary },
  { header: "Stage", accessor: (c) => c.stage },
  { header: "Status", accessor: (c) => c.status },
  { header: "Outcome", accessor: (c) => c.outcome },
  { header: "Acknowledged", accessor: (c) => c.acknowledged_at },
  { header: "Response Sent", accessor: (c) => c.response_sent_at },
  { header: "Assigned To", accessor: (c) => c.assigned_to },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function workingDaysRemaining(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  if (due <= today) return 0;
  let count = 0;
  const d = new Date(today);
  while (d < due) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) count++;
  }
  return count;
}

function isOverdue(complaint: Complaint): boolean {
  if (complaint.status === "closed") return false;
  return new Date(complaint.response_due) < new Date();
}

// ── Complaint Card ────────────────────────────────────────────────────────────

function ComplaintCard({
  complaint,
  onUpdate,
  onAriaAnalysis,
  ariaBusy,
}: {
  complaint: Complaint;
  onUpdate: (id: string, data: Partial<Complaint>) => void;
  onAriaAnalysis: (c: Complaint) => void;
  ariaBusy: string | null;
}) {
  const [expanded, setExpanded] = useState(complaint.status !== "closed");
  const overdue  = isOverdue(complaint);
  const daysLeft = workingDaysRemaining(complaint.response_due);
  const ypName   = complaint.child_id ? getYPName(complaint.child_id) : null;

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden",
      overdue ? "border-red-200" :
      complaint.status === "closed" ? "border-emerald-100" :
      daysLeft <= 2 ? "border-amber-200" : "border-slate-200",
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold",
          complaint.status === "closed" ? "bg-emerald-100 text-emerald-700"
          : overdue ? "bg-red-100 text-red-700"
          : "bg-amber-100 text-amber-700",
        )}>
          {complaint.stage === "stage_1" ? "S1" : complaint.stage === "stage_2" ? "S2" : "LG"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-slate-800">{complaint.reference}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", STATUS_COLOUR[complaint.status])}>
              {STATUS_LABELS[complaint.status]}
            </Badge>
            {complaint.outcome && (
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", OUTCOME_COLOUR[complaint.outcome])}>
                {OUTCOME_LABELS[complaint.outcome]}
              </Badge>
            )}
            {overdue && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200">
                ⚠ Response overdue
              </Badge>
            )}
            {complaint.includes_safeguarding_element && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-rose-50 text-rose-700 border-rose-200">
                <Shield className="h-2.5 w-2.5 mr-0.5 inline" />Safeguarding element
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {COMPLAINANT_LABELS[complaint.complainant_type]}
              {complaint.complainant_name ? ` — ${complaint.complainant_name}` : ""}
            </span>
            {ypName && <><span>·</span><span>Re: {ypName}</span></>}
            <span>·</span>
            <span>{CATEGORY_LABELS[complaint.category]}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Received {formatDate(complaint.date_received)}
            </span>
          </div>

          {/* Timeline indicator */}
          {complaint.status !== "closed" && (
            <div className="mt-2 flex items-center gap-3 text-[10px]">
              <span className={cn(
                "font-medium",
                complaint.acknowledged_at ? "text-emerald-600" : "text-red-600",
              )}>
                {complaint.acknowledged_at ? `✓ Acknowledged ${formatDate(complaint.acknowledged_at)}` : `⚠ Acknowledgement due ${formatDate(complaint.acknowledgement_due)}`}
              </span>
              <span className="text-slate-300">·</span>
              <span className={cn("font-medium", overdue ? "text-red-600" : daysLeft <= 2 ? "text-amber-600" : "text-slate-500")}>
                Response due {formatDate(complaint.response_due)}
                {!overdue && daysLeft > 0 ? ` · ${daysLeft} working day${daysLeft !== 1 ? "s" : ""} left` : overdue ? " · OVERDUE" : ""}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-600 shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
          {/* Summary */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Summary</p>
            <p className="text-xs text-slate-700">{complaint.summary}</p>
            {complaint.full_detail && (
              <p className="text-xs text-slate-500 mt-1.5">{complaint.full_detail}</p>
            )}
          </div>

          {/* Acknowledgement action */}
          {!complaint.acknowledged_at && complaint.status === "received" && (
            <Button
              size="sm"
              onClick={() =>
                onUpdate(complaint.id, {
                  acknowledged_at: new Date().toISOString(),
                  status: "acknowledged",
                })
              }
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Record Acknowledgement
            </Button>
          )}

          {/* Investigation notes */}
          {complaint.investigation_notes && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Investigation Notes</p>
              <p className="text-xs text-slate-700">{complaint.investigation_notes}</p>
            </div>
          )}

          {/* Outcome & learning */}
          {complaint.outcome_detail && (
            <div className={cn(
              "rounded-xl border p-3",
              complaint.outcome ? OUTCOME_COLOUR[complaint.outcome] : "border-slate-200 bg-slate-50",
            )}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1 opacity-70">Outcome</p>
              <p className="text-xs">{complaint.outcome_detail}</p>
            </div>
          )}

          {complaint.lessons_learned && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
              <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-widest mb-1">
                Lessons Learned {complaint.learning_shared ? "· Shared with team ✓" : ""}
              </p>
              <p className="text-xs text-slate-700">{complaint.lessons_learned}</p>
            </div>
          )}

          {/* Timeline */}
          {complaint.timeline.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Timeline</p>
              <div className="space-y-2">
                {complaint.timeline.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-700">{entry.action}</span>
                      <span className="text-slate-400 ml-1.5">{formatDate(entry.date)}</span>
                      {entry.note && <p className="text-slate-500 mt-0.5">{entry.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ARIA analysis */}
          {complaint.aria_summary ? (
            <div className="rounded-xl border border-teal-100 bg-teal-50/40 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <p className="text-[10px] font-semibold text-teal-700 uppercase tracking-widest">ARIA Analysis</p>
              </div>
              <p className="text-xs text-slate-700">{complaint.aria_summary}</p>
            </div>
          ) : (
            <button
              onClick={() => onAriaAnalysis(complaint)}
              disabled={ariaBusy === complaint.id}
              className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800 disabled:opacity-50"
            >
              {ariaBusy === complaint.id
                ? <><Sparkles className="h-3.5 w-3.5 animate-spin" />ARIA analysing…</>
                : <><Sparkles className="h-3.5 w-3.5" />Generate ARIA analysis</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── New Complaint Form ────────────────────────────────────────────────────────

function NewComplaintDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Complaint>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    complainant_type: "young_person" as ComplainantType,
    complainant_name: "",
    child_id: "",
    category: "other" as ComplaintCategory,
    summary: "",
    date_received: new Date().toISOString().split("T")[0],
    includes_safeguarding_element: false,
  });

  const handleSave = async () => {
    if (!form.summary.trim() || !form.complainant_name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        child_id: form.child_id || null,
        created_by: "staff_darren",
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-indigo-600" />
            Log New Complaint
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Complainant type</label>
              <Select
                value={form.complainant_type}
                onValueChange={(v) => setForm((p) => ({ ...p, complainant_type: v as ComplainantType }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(COMPLAINANT_LABELS) as [ComplainantType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Category</label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v as ComplaintCategory }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORY_LABELS) as [ComplaintCategory, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Complainant name</label>
            <Input
              value={form.complainant_name}
              onChange={(e) => setForm((p) => ({ ...p, complainant_name: e.target.value }))}
              placeholder="Full name or 'Anonymous'"
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Date received</label>
              <Input
                type="date"
                value={form.date_received}
                onChange={(e) => setForm((p) => ({ ...p, date_received: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Young person (if applicable)</label>
              <Input
                value={form.child_id}
                onChange={(e) => setForm((p) => ({ ...p, child_id: e.target.value }))}
                placeholder="YP ID e.g. yp_jordan"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Summary of complaint <span className="text-red-500">*</span></label>
            <Textarea
              value={form.summary}
              onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
              placeholder="Describe the nature of the complaint…"
              rows={4}
              className="text-xs"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.includes_safeguarding_element}
              onChange={(e) => setForm((p) => ({ ...p, includes_safeguarding_element: e.target.checked }))}
              className="rounded"
            />
            <span className="text-xs text-slate-600">Contains a safeguarding element</span>
          </label>

          <p className="text-[10px] text-slate-400">
            Acknowledgement due within 3 working days · Response due within 10 working days
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !form.summary.trim() || !form.complainant_name.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {saving ? "Saving…" : "Log Complaint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ComplaintsPage() {
  const { currentUser } = useAuthContext();
  const complaintsQuery = useComplaints({ homeId: "home_oak" });
  const createComplaint = useCreateComplaint();
  const updateComplaint = useUpdateComplaint();

  const complaints = complaintsQuery.data?.data ?? [];
  const meta       = complaintsQuery.data?.meta;

  const [showNew, setShowNew]     = useState(false);
  const [ariaBusy, setAriaBusy]   = useState<string | null>(null);
  const [ariaError, setAriaError] = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [sortBy, setSortBy]       = useState<"date" | "reference" | "severity">("date");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ComplaintCategory>("all");
  const [viewTab, setViewTab]     = useState<"open" | "closed" | "all">("open");

  // Filtered complaints
  const filtered = useMemo(() => {
    let list = complaints;

    // Tab filter
    if (viewTab === "open") list = list.filter((c) => c.status !== "closed");
    else if (viewTab === "closed") list = list.filter((c) => c.status === "closed");

    // Category filter
    if (categoryFilter !== "all") list = list.filter((c) => c.category === categoryFilter);

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.reference.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.complainant_name.toLowerCase().includes(q) ||
        (c.child_id ? getYPName(c.child_id).toLowerCase().includes(q) : false) ||
        CATEGORY_LABELS[c.category].toLowerCase().includes(q)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "reference": return a.reference.localeCompare(b.reference);
        case "severity": {
          const stageOrder: Record<string, number> = { stage_2: 0, stage_1: 1 };
          return (stageOrder[a.stage] ?? 2) - (stageOrder[b.stage] ?? 2);
        }
        default: return (b.date_received ?? "").localeCompare(a.date_received ?? "");
      }
    });

    return list;
  }, [complaints, viewTab, categoryFilter, search, sortBy]);

  const openComplaints   = complaints.filter((c) => c.status !== "closed");
  const closedComplaints = complaints.filter((c) => c.status === "closed");
  const overdueCount     = openComplaints.filter(isOverdue).length;

  // Category counts for filter
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of complaints) {
      counts[c.category] = (counts[c.category] || 0) + 1;
    }
    return counts;
  }, [complaints]);

  const safeguardingCount = useMemo(
    () => openComplaints.filter((c) => c.includes_safeguarding_element).length,
    [openComplaints]
  );

  const handleUpdate = async (id: string, data: Partial<Complaint>) => {
    await updateComplaint.mutateAsync({ id, data });
  };

  const handleCreate = async (data: Partial<Complaint>) => {
    await createComplaint.mutateAsync(data);
  };

  const handleAriaAnalysis = async (complaint: Complaint) => {
    setAriaBusy(complaint.id);
    setAriaError(null);
    try {
      const ypName = complaint.child_id ? getYPName(complaint.child_id) : "not specified";
      const prompt = `You are ARIA, a regulatory compliance AI for a children's residential home. Analyse this complaint and provide a concise 2–3 sentence summary covering: nature and validity of the complaint, timeliness of response, outcome and learning. Note any quality standard implications. Be precise and child-rights focused.

Reference: ${complaint.reference}
Complainant: ${COMPLAINANT_LABELS[complaint.complainant_type]} — ${complaint.complainant_name}
Young Person: ${ypName}
Category: ${CATEGORY_LABELS[complaint.category]}
Date received: ${complaint.date_received} · Response due: ${complaint.response_due}
Status: ${STATUS_LABELS[complaint.status]}
Outcome: ${complaint.outcome ? OUTCOME_LABELS[complaint.outcome] : "pending"}
Summary: ${complaint.summary}
${complaint.outcome_detail ? `Outcome detail: ${complaint.outcome_detail}` : ""}
${complaint.lessons_learned ? `Learning: ${complaint.lessons_learned}` : ""}`;

      const response = await api.post<{ choices: { message: { content: string } }[] }>(
        "/aria/chat",
        { messages: [{ role: "user", content: prompt }], context: "complaint_analysis" },
      );

      const summary =
        response?.choices?.[0]?.message?.content ??
        `${complaint.reference} (${CATEGORY_LABELS[complaint.category]}) — ${complaint.outcome ? OUTCOME_LABELS[complaint.outcome] : "pending outcome"}. ${complaint.status === "closed" ? "Closed within statutory timeframe." : `Response due ${formatDate(complaint.response_due)}.`} ${complaint.lessons_learned ? "Learning documented." : "Learning pending."}`;

      await updateComplaint.mutateAsync({ id: complaint.id, data: { aria_summary: summary } });
    } catch {
      setAriaError("ARIA analysis failed — please try again");
    } finally {
      setAriaBusy(null);
    }
  };

  // Annual summary stats for Reg 45
  const currentYear = new Date().getFullYear();
  const thisYearComplaints = complaints.filter((c) =>
    c.date_received.startsWith(String(currentYear))
  );
  const upheldCount = thisYearComplaints.filter((c) => c.outcome === "upheld").length;
  const partialCount = thisYearComplaints.filter((c) => c.outcome === "partially_upheld").length;

  return (
    <PageShell
      title="Complaints & Representations"
      subtitle="Formal complaints register — statutory timelines, outcomes and learning"
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton<Complaint> filename="complaints-export" data={filtered} columns={COMPLAINT_EXPORT_COLS} label="Export" />
          <PrintButton title="Complaints & Representations" subtitle="Oak House — Complaints Register" targetId="complaints-content" />
          <SmartUploadButton
            variant="inline"
            label="Upload Complaint Document"
            uploadContext="Complaints & Representations — complaint letter, response or evidence document upload"
          />
          <Button
            size="sm"
            onClick={() => setShowNew(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Log Complaint
          </Button>
        </div>
      }
    >
      <div id="complaints-content" className="space-y-5">
      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Open Complaints",
            value: openComplaints.length,
            icon: MessageCircle,
            colour: openComplaints.length > 0 ? "text-amber-600" : "text-emerald-600",
            bg: openComplaints.length > 0 ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100",
          },
          {
            label: "Response Overdue",
            value: overdueCount,
            icon: AlertOctagon,
            colour: overdueCount > 0 ? "text-red-600" : "text-emerald-600",
            bg: overdueCount > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100",
          },
          {
            label: `${currentYear} Total`,
            value: thisYearComplaints.length,
            icon: Calendar,
            colour: "text-indigo-600",
            bg: "bg-indigo-50 border-indigo-100",
          },
          {
            label: "Upheld This Year",
            value: upheldCount + partialCount,
            icon: Flag,
            colour: (upheldCount + partialCount) > 2 ? "text-red-600" : "text-slate-600",
            bg: (upheldCount + partialCount) > 2 ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100",
          },
        ].map(({ label, value, icon: Icon, colour, bg }) => (
          <div key={label} className={cn("rounded-xl border p-3", bg)}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn("h-4 w-4 shrink-0", colour)} />
              <span className="text-[10px] text-slate-500 font-medium">{label}</span>
            </div>
            <p className={cn("text-lg font-bold", colour)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Safeguarding alert */}
      {safeguardingCount > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-800">
              {safeguardingCount} open complaint{safeguardingCount !== 1 ? "s" : ""} with safeguarding element
            </p>
            <p className="text-[11px] text-red-700 mt-0.5">
              These must be referred to the LADO alongside the complaint investigation process
            </p>
          </div>
        </div>
      )}

      {/* ── Reg 45 annual summary pill ── */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 flex items-center gap-3">
        <Gavel className="h-4 w-4 text-indigo-600 shrink-0" />
        <div className="text-xs text-slate-600">
          <span className="font-semibold text-indigo-700">Reg 45 Summary ({currentYear}) — </span>
          {thisYearComplaints.length} complaint{thisYearComplaints.length !== 1 ? "s" : ""} received ·{" "}
          {upheldCount} upheld · {partialCount} partially upheld ·{" "}
          {thisYearComplaints.filter((c) => c.outcome === "not_upheld").length} not upheld ·{" "}
          {thisYearComplaints.filter((c) => !c.outcome).length} pending outcome
        </div>
      </div>

      {/* ── Search + filter toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, summary, complainant…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {(["open", "closed", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setViewTab(t)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                viewTab === t
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {t === "open" ? `Open (${openComplaints.length})` : t === "closed" ? `Closed (${closedComplaints.length})` : `All (${complaints.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter + Sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as "all" | ComplaintCategory)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 outline-none"
        >
          <option value="all">All categories</option>
          {(Object.keys(CATEGORY_LABELS) as ComplaintCategory[]).map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]} ({categoryCounts[c] ?? 0})</option>
          ))}
        </select>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "reference" | "severity")}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 outline-none"
          >
            <option value="date">Date received</option>
            <option value="reference">Reference</option>
            <option value="severity">Stage (severity)</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      {(search || categoryFilter !== "all") && (
        <p className="text-xs text-slate-500">
          Showing {filtered.length} of {complaints.length} complaint{complaints.length !== 1 ? "s" : ""}
          {search && <span className="text-slate-400"> matching &ldquo;{search}&rdquo;</span>}
        </p>
      )}

      {/* ── Complaints list ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <MessageCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium">
            {search ? `No complaints match "${search}"` : "No complaints in this view"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {viewTab === "open" && filtered.length > 0 && (
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Open Complaints ({filtered.length})
            </p>
          )}
          {viewTab === "closed" && filtered.length > 0 && (
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Closed Complaints ({filtered.length})
            </p>
          )}
          {filtered.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              onUpdate={handleUpdate}
              onAriaAnalysis={handleAriaAnalysis}
              ariaBusy={ariaBusy}
            />
          ))}
          {ariaError && <p className="text-xs text-red-600 text-right">{ariaError}</p>}
        </div>
      )}

      {/* ── Regulatory note ── */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Regulatory Basis — </span>
        Children&apos;s Homes Quality Standards 2015, Standard 3 (Rights &amp; Responsibilities): every
        young person must know how to make a complaint and complaints must be taken seriously. Statutory
        Guidance on Representations and Complaints (2016): acknowledgement within 3 working days,
        Stage 1 response within 10 working days. All complaints and outcomes must be reported in Reg 45.
        A pattern of upheld complaints is a quality indicator assessed under ILACS.
      </div>

      </div>{/* close #complaints-content */}

      <NewComplaintDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onSave={handleCreate}
      />
    </PageShell>
  );
}
