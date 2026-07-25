"use client";

import { useHomeName } from "@/hooks/use-home-profile";
import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Badge } from "@/components/ui/badge";
import { FlatList, FlatListRow, FlatListRowDetail, type RowSeverity } from "@/components/ui/list-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Eye, Calendar, User, CheckCircle2, AlertCircle, Clock,
  ChevronDown, ChevronUp, Plus, Flag, FileText, ArrowRight,
  CheckCheck, CircleDot, X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useReg44Visits, useCreateVisit, useUpdateRecommendation } from "@/hooks/use-reg44";
import { toast } from "sonner";
import type { Reg44VisitReport, Reg44Recommendation } from "@/types/extended";

// ── Helpers ───────────────────────────────────────────────────────────────────

const JUDGEMENT_CONFIG: Record<string, { label: string; colour: string; bg: string }> = {
  outstanding: { label: "Outstanding",    colour: "text-[--cs-success]", bg: "bg-[--cs-success-bg] border-[--cs-success-soft]" },
  good:         { label: "Good",           colour: "text-[--cs-info]",    bg: "bg-[--cs-info-bg] border-[--cs-info-soft]"       },
  requires_improvement: { label: "Requires Improvement", colour: "text-[--cs-warning]", bg: "bg-[--cs-warning-bg] border-[--cs-warning-soft]" },
  inadequate:   { label: "Inadequate",     colour: "text-[--cs-risk]",     bg: "bg-[--cs-risk-bg] border-[--cs-risk-soft]"         },
};

const JUDGEMENT_ROW: Record<string, RowSeverity> = {
  outstanding: "success", good: "info", requires_improvement: "warning", inadequate: "risk",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; colour: string }> = {
  outstanding: { label: "Outstanding", icon: AlertCircle, colour: "text-[--cs-risk]"    },
  in_progress: { label: "In Progress", icon: CircleDot,   colour: "text-[--cs-warning]"  },
  completed:   { label: "Completed",   icon: CheckCheck,  colour: "text-[--cs-success]" },
};

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function recommendationStatus(recs: Reg44Recommendation[]) {
  if (!recs.length) return { outstanding: 0, in_progress: 0, completed: 0, total: 0 };
  return recs.reduce(
    (acc, r) => {
      acc.total++;
      if (r.status === "completed") acc.completed++;
      else if (r.status === "in_progress") acc.in_progress++;
      else acc.outstanding++;
      return acc;
    },
    { outstanding: 0, in_progress: 0, completed: 0, total: 0 },
  );
}

// ── Recommendation row ────────────────────────────────────────────────────────

function RecommendationRow({ rec, visitId, onUpdate }: {
  rec: Reg44Recommendation;
  visitId: string;
  onUpdate: (args: { visit_id: string; recommendation_id: string; status: "completed" | "in_progress" | "outstanding" }) => void;
}) {
  const cfg = STATUS_CONFIG[rec.status] ?? STATUS_CONFIG.outstanding;
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", cfg.colour)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800">{rec.recommendation}</p>
        {rec.evidence_notes && <p className="text-xs text-slate-400 mt-0.5">{rec.evidence_notes}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Badge className={cn("text-[10px] rounded-full", {
          "bg-[--cs-risk-bg] text-[--cs-risk] border border-[--cs-risk-soft]":     rec.status === "outstanding",
          "bg-[--cs-warning-bg] text-[--cs-warning] border border-[--cs-warning-soft]": rec.status === "in_progress",
          "bg-[--cs-success-bg] text-[--cs-success] border border-[--cs-success-soft]": rec.status === "completed",
        })}>
          {rec.priority === "high" && <Flag className="h-2.5 w-2.5 mr-1 inline" />}
          {cfg.label}
        </Badge>
        {rec.status !== "completed" && (
          <div className="flex gap-1 ml-1">
            {rec.status === "outstanding" && (
              <button title="Mark In Progress" onClick={() => onUpdate({ visit_id: visitId, recommendation_id: rec.id, status: "in_progress" })} className="rounded-lg p-1 text-[--cs-warning] hover:bg-[--cs-warning-bg]">
                <CircleDot className="h-3.5 w-3.5" />
              </button>
            )}
            <button title="Mark Completed" onClick={() => onUpdate({ visit_id: visitId, recommendation_id: rec.id, status: "completed" })} className="rounded-lg p-1 text-[--cs-success] hover:bg-[--cs-success-bg]">
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Visit card ────────────────────────────────────────────────────────────────

function VisitCard({ visit, onUpdate }: {
  visit: Reg44VisitReport;
  onUpdate: (args: { visit_id: string; recommendation_id: string; status: "completed" | "in_progress" | "outstanding" }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const jCfg = JUDGEMENT_CONFIG[visit.overall_judgement] ?? JUDGEMENT_CONFIG.good;
  const recStats = recommendationStatus(visit.recommendations ?? []);
  const pctDone = recStats.total > 0 ? Math.round((recStats.completed / recStats.total) * 100) : 100;

  return (
    <div>
      <FlatListRow
        severity={JUDGEMENT_ROW[visit.overall_judgement] ?? "info"}
        className="items-center gap-4"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
          <Eye className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900">{formatDate(visit.visit_date)}</span>
              <span className={cn("text-[11px] font-semibold uppercase tracking-wide", jCfg.colour)}>
                {jCfg.label}
              </span>
              {visit.report_sent_to_ofsted && (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sent to Ofsted</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{visit.visitor}</span>
              {visit.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{visit.duration}</span>}
              {recStats.total > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {recStats.completed}/{recStats.total} recommendations complete
                </span>
              )}
            </div>
          </div>
          {recStats.total > 0 && (
            <div className="w-24 shrink-0 hidden sm:block">
              <Progress value={pctDone} className="h-1.5" />
              <span className="text-[10px] text-slate-400 mt-0.5 block text-right">{pctDone}%</span>
            </div>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </FlatListRow>

      {expanded && (
        <FlatListRowDetail className="space-y-4">
          {/* Visit summary */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {visit.children_spoken && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Children spoken with</div>
                <div className="text-sm text-slate-800">{visit.children_spoken}</div>
              </div>
            )}
            {visit.staff_spoken > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Staff spoken with</div>
                <div className="text-sm text-slate-800">{visit.staff_spoken}</div>
              </div>
            )}
            {visit.previous_actions_status && (
              <div className="col-span-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Previous actions status</div>
                <div className="text-sm text-slate-800">{visit.previous_actions_status}</div>
              </div>
            )}
          </div>

          {/* Records reviewed */}
          {visit.records_reviewed?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">Records reviewed</div>
              <div className="flex flex-wrap gap-1.5">
                {visit.records_reviewed.map((r, i) => (
                  <Badge key={i} className="text-[10px] rounded-full bg-slate-100 text-slate-600">{r}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {visit.strengths?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">Strengths</div>
              <ul className="space-y-1">
                {(visit.strengths ?? []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[--cs-success] shrink-0 mt-0.5" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for development */}
          {visit.areas_for_development?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">Areas for development</div>
              <ul className="space-y-1">
                {visit.areas_for_development.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <AlertCircle className="h-3.5 w-3.5 text-[--cs-warning] shrink-0 mt-0.5" />{a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {visit.recommendations?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">Recommendations</div>
              <div className="space-y-2">
                {(visit.recommendations ?? []).map((rec) => (
                  <RecommendationRow key={rec.id} rec={rec} visitId={visit.id} onUpdate={onUpdate} />
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {visit.notes && (
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-1">Notes</div>
              <p className="text-sm text-slate-700">{visit.notes}</p>
            </div>
          )}

          {/* Ofsted send info */}
          {visit.report_sent_to_ofsted && visit.report_sent_date && (
            <div className="rounded-xl bg-[--cs-success-bg] border border-[--cs-success-soft] px-4 py-2.5 flex items-center gap-2 text-sm text-[--cs-success]">
              <CheckCheck className="h-4 w-4 shrink-0" />
              Report sent to Ofsted on {formatDate(visit.report_sent_date)}
            </div>
          )}
        </FlatListRowDetail>
      )}
    </div>
  );
}

// ── Create visit modal ────────────────────────────────────────────────────────

const RECORDS_OPTIONS = [
  "Daily logs", "Medication records", "Incident reports", "Placement plans",
  "Care plans", "Risk assessments", "Missing from care records", "Restraint records",
  "Supervision records", "Training records", "Complaints log", "Financial records",
];

const JUDGEMENT_OPTIONS = [
  { value: "outstanding",          label: "Outstanding"          },
  { value: "good",                 label: "Good"                 },
  { value: "requires_improvement", label: "Requires Improvement" },
  { value: "inadequate",           label: "Inadequate"           },
];

function CreateVisitModal({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateVisit();
  const [form, setForm] = useState({
    visit_date: "",
    visitor: "",
    duration: "",
    children_spoken: "",
    staff_spoken: "",
    overall_judgement: "good",
    notes: "",
    previous_actions_status: "",
    report_sent_to_ofsted: false,
    report_sent_date: "",
  });
  const [records, setRecords] = useState<string[]>([]);
  const [strengths, setStrengths] = useState("");
  const [areasForDevelopment, setAreasForDevelopment] = useState("");
  const [recommendations, setRecommendations] = useState("");

  function toggleRecord(r: string) {
    setRecords((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.visit_date || !form.visitor) {
      toast.error("Visit date and visitor name are required");
      return;
    }
    try {
      await createMutation.mutateAsync({
        visit_date: form.visit_date,
        visitor: form.visitor,
        duration: form.duration,
        children_spoken: form.children_spoken,
        staff_spoken: Number(form.staff_spoken) || 0,
        overall_judgement: form.overall_judgement,
        notes: form.notes,
        previous_actions_status: form.previous_actions_status,
        report_sent_to_ofsted: form.report_sent_to_ofsted,
        report_sent_date: form.report_sent_to_ofsted ? form.report_sent_date : "",
        records_reviewed: records,
        strengths: strengths.split("\n").map((s) => s.trim()).filter(Boolean),
        areas_for_development: areasForDevelopment.split("\n").map((s) => s.trim()).filter(Boolean),
        recommendations: recommendations.split("\n").map((s) => s.trim()).filter(Boolean).map((text) => ({
          id: `rec_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          visit_id: "",
          recommendation: text,
          priority: "medium" as const,
          status: "outstanding" as const,
          evidence_notes: null,
          completed_at: null,
          rm_response: "",
        })),
      });
      onClose();
    } catch {
      // mutation handles toast
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">New Regulation 44 Visit</h2>
            <p className="text-xs text-slate-500 mt-0.5">Record an independent visitor&apos;s report</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Visit date *</label>
              <Input type="date" required value={form.visit_date} onChange={(e) => setForm((f) => ({ ...f, visit_date: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Visitor name *</label>
              <Input required placeholder="Independent visitor name" value={form.visitor} onChange={(e) => setForm((f) => ({ ...f, visitor: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Duration</label>
              <Input placeholder="e.g. 3 hours" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Children spoken with</label>
              <Input placeholder="e.g. All 3 children" value={form.children_spoken} onChange={(e) => setForm((f) => ({ ...f, children_spoken: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Number of staff spoken with</label>
              <Input type="number" min="0" value={form.staff_spoken} onChange={(e) => setForm((f) => ({ ...f, staff_spoken: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Overall judgement</label>
              <select value={form.overall_judgement} onChange={(e) => setForm((f) => ({ ...f, overall_judgement: e.target.value }))} className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {JUDGEMENT_OPTIONS.map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}
              </select>
            </div>
          </div>

          {/* Records reviewed */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Records reviewed</label>
            <div className="flex flex-wrap gap-2">
              {RECORDS_OPTIONS.map((r) => (
                <button type="button" key={r} onClick={() => toggleRecord(r)} className={cn("rounded-full px-3 py-1 text-xs border transition-colors", records.includes(r) ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Strengths (one per line)</label>
            <textarea rows={3} value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="e.g. Strong staff team culture" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Areas for development */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Areas for development (one per line)</label>
            <textarea rows={3} value={areasForDevelopment} onChange={(e) => setAreasForDevelopment(e.target.value)} placeholder="e.g. Handover documentation needs improvement" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Recommendations */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Recommendations (one per line)</label>
            <textarea rows={3} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} placeholder="e.g. Review behaviour support plans by March" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Previous actions */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Previous visit actions — status update</label>
            <Input placeholder="e.g. All actions from previous visit completed" value={form.previous_actions_status} onChange={(e) => setForm((f) => ({ ...f, previous_actions_status: e.target.value }))} />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Additional notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Ofsted send */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <input type="checkbox" id="sent_to_ofsted" checked={form.report_sent_to_ofsted} onChange={(e) => setForm((f) => ({ ...f, report_sent_to_ofsted: e.target.checked }))} className="rounded" />
            <label htmlFor="sent_to_ofsted" className="text-sm text-slate-700 font-medium cursor-pointer">Report has been sent to Ofsted</label>
            {form.report_sent_to_ofsted && (
              <Input type="date" className="ml-auto w-40" value={form.report_sent_date} onChange={(e) => setForm((f) => ({ ...f, report_sent_date: e.target.value }))} />
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving…" : "Save Visit Report"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Regulation44Page() {
  const homeName = useHomeName();
  const visitsQ = useReg44Visits();
  const updateRec = useUpdateRecommendation();
  const [showCreate, setShowCreate] = useState(false);

  const visits: Reg44VisitReport[] = (visitsQ.data?.data ?? []);

  // Compute summary stats
  const allRecs = visits.flatMap((v) => v.recommendations ?? []);
  const outstanding = allRecs.filter((r) => r.status === "outstanding").length;
  const inProgress  = allRecs.filter((r) => r.status === "in_progress").length;
  const completed   = allRecs.filter((r) => r.status === "completed").length;

  // Visit frequency check (must be at least monthly)
  const sortedDates = visits.map((v) => v.visit_date).sort((a, b) => b.localeCompare(a));
  const lastVisit = sortedDates[0];
  const daysSinceLastVisit = lastVisit
    ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / 86400000)
    : null;
  const visitDue = daysSinceLastVisit !== null && daysSinceLastVisit >= 25;

  return (
    <PageShell
      title="Regulation 44 Visits"
      subtitle={`Independent visitor reports — ${homeName}`}
      caraContext={{ pageTitle: "Regulation 44 — Independent Visiting", sourceType: "reg45" }}
      actions={
        <div className="flex items-center gap-2">
          <Button className="bg-slate-900 hover:bg-slate-800 h-9 text-sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />Record Visit
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "reg45", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <FileText className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{visits.length}</div>
            <div className="text-xs text-slate-500">Total visits</div>
          </div>
        </div>
        <div className={cn("rounded-2xl border px-4 py-3 flex items-center gap-3", visitDue ? "bg-[--cs-warning-bg] border-[--cs-warning-soft]" : "bg-white border-slate-200")}>
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", visitDue ? "bg-[--cs-warning-bg]" : "bg-slate-100")}>
            <Calendar className={cn("h-4 w-4", visitDue ? "text-[--cs-warning]" : "text-slate-600")} />
          </div>
          <div>
            <div className={cn("text-lg font-bold", visitDue ? "text-[--cs-warning]" : "text-slate-900")}>
              {daysSinceLastVisit !== null ? `${daysSinceLastVisit}d ago` : "—"}
            </div>
            <div className={cn("text-xs", visitDue ? "text-[--cs-warning]" : "text-slate-500")}>
              {visitDue ? "Visit overdue" : "Last visit"}
            </div>
          </div>
        </div>
        <div className={cn("rounded-2xl border px-4 py-3 flex items-center gap-3", outstanding > 0 ? "bg-[--cs-risk-bg] border-[--cs-risk-soft]" : "bg-white border-slate-200")}>
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", outstanding > 0 ? "bg-[--cs-risk-bg]" : "bg-slate-100")}>
            <AlertCircle className={cn("h-4 w-4", outstanding > 0 ? "text-[--cs-risk]" : "text-slate-600")} />
          </div>
          <div>
            <div className={cn("text-lg font-bold", outstanding > 0 ? "text-[--cs-risk]" : "text-slate-900")}>{outstanding}</div>
            <div className={cn("text-xs", outstanding > 0 ? "text-[--cs-risk]" : "text-slate-500")}>Outstanding</div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[--cs-success-bg] flex items-center justify-center">
            <CheckCheck className="h-4 w-4 text-[--cs-success]" />
          </div>
          <div>
            <div className="text-lg font-bold text-[--cs-success]">{completed}</div>
            <div className="text-xs text-slate-500">Completed</div>
          </div>
        </div>
      </div>

      {/* Outstanding recommendations summary */}
      {outstanding + inProgress > 0 && (
        <div className="rounded-2xl border border-[--cs-warning-soft] bg-[--cs-warning-bg] px-5 py-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="h-4 w-4 text-[--cs-warning]" />
            <span className="text-sm font-semibold text-[--cs-warning]">Open Recommendations</span>
          </div>
          <div className="flex gap-4 text-sm">
            {outstanding > 0 && <span className="text-[--cs-risk] font-medium">{outstanding} outstanding</span>}
            {inProgress  > 0 && <span className="text-[--cs-warning] font-medium">{inProgress} in progress</span>}
            {completed   > 0 && <span className="text-[--cs-success]">{completed} completed</span>}
          </div>
        </div>
      )}

      {/* Regulatory context */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 mb-5 flex items-start gap-3">
        <Eye className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-slate-700">
            <strong>Regulation 44 (Children&apos;s Homes Regulations 2015)</strong> requires the registered person to appoint an independent person to visit the home at least monthly. The visitor must produce a written report after each visit.
          </p>
          <div className="flex gap-3 mt-2">
            <Link href="/annex-a" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />Annex A readiness
            </Link>
            <Link href="/ri/reg45" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />Regulation 45 reports
            </Link>
          </div>
        </div>
      </div>

      {/* Visit list */}
      {visitsQ.isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : !visits.length ? (
        <div className="text-center py-16 text-slate-400">
          <Eye className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No Regulation 44 visits recorded yet</p>
          <p className="text-xs mt-1">Record the first independent visitor&apos;s report to start tracking compliance.</p>
          <Button className="mt-4 bg-slate-900 hover:bg-slate-800 h-9 text-sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />Record First Visit
          </Button>
        </div>
      ) : (
        <FlatList>
          {visits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} onUpdate={(args) => updateRec.mutate(args as Parameters<typeof updateRec.mutate>[0])} />
          ))}
        </FlatList>
      )}

      {showCreate && <CreateVisitModal onClose={() => setShowCreate(false)} />}
      <CaraPanel
        mode="assist"
        pageContext="Regulation 44 — Independent Visiting — monthly independent visitor records, children's views, staff interviews, premises checks, recommendations, RI responses, statutory compliance"
        recordType="reg45"
        className="mt-6"
      />
    </PageShell>
  );
}
