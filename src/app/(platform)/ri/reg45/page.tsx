"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REGULATION 45 ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  useRiReg45Evidence, useCreateRiReg45Evidence, useUpdateRiReg45Evidence,
  useTrainingNeeds, useRiAlerts, useRiChallengeLogs,
} from "@/hooks/use-ri-learning";
import { useIncidents } from "@/hooks/use-incidents";
import { useAudits } from "@/hooks/use-audits";
import { useSupervisions } from "@/hooks/use-supervision";
import type { RiReg45Evidence } from "@/types/extended";
import { cn, formatDate } from "@/lib/utils";
import {
  FileText, Sparkles, CheckCircle2, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Send, BookOpen, ShieldCheck, ClipboardCheck,
  Users, Zap, Copy, ChevronRight,
} from "lucide-react";
import { api } from "@/hooks/use-api";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";


const STATUS_COLOURS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  reviewed: "bg-amber-100 text-amber-700",
  approved: "bg-violet-100 text-violet-700",
  submitted: "bg-emerald-100 text-emerald-700",
};

// ── Reg 45 record card ─────────────────────────────────────────────────────────
function Reg45Card({ record }: { record: RiReg45Evidence }) {
  const [expanded, setExpanded] = useState(false);
  const updateMutation = useUpdateRiReg45Evidence();

  const approve = () => updateMutation.mutate({ id: record.id, status: "approved" });
  const markSubmitted = () => updateMutation.mutate({ id: record.id, status: "submitted", submitted_to_ofsted: true, submitted_at: new Date().toISOString() });

  return (
    <Card className="border border-slate-100">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <FileText className="h-4.5 w-4.5 text-blue-600" style={{ width: "1.125rem", height: "1.125rem" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Reg 45 Report — {record.report_period}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDate(record.period_start)} → {formatDate(record.period_end)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge className={cn("text-[10px] h-4 px-1.5", STATUS_COLOURS[record.status])}>
                  {record.status.replace("_", " ")}
                </Badge>
                {record.submitted_to_ofsted && (
                  <Badge className="text-[10px] h-4 px-1.5 bg-emerald-100 text-emerald-700">Submitted</Badge>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => setExpanded((p) => !p)} className="text-slate-400 hover:text-slate-600 shrink-0 mt-1">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {expanded && record.aria_strengths && (
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            {[
              { label: "Strengths", content: record.aria_strengths, colour: "bg-emerald-50 border-emerald-100 text-emerald-900" },
              { label: "Weaknesses / Areas for Development", content: record.aria_weaknesses, colour: "bg-amber-50 border-amber-100 text-amber-900" },
              { label: "Improvement Areas", content: record.aria_improvement_areas, colour: "bg-blue-50 border-blue-100 text-blue-900" },
              { label: "Impact on Children", content: record.aria_child_impact, colour: "bg-violet-50 border-violet-100 text-violet-900" },
              { label: "Action Plan", content: record.aria_action_plan, colour: "bg-slate-50 border-slate-200 text-slate-800" },
              { label: "RI Statement", content: record.aria_ri_statement, colour: "bg-indigo-50 border-indigo-100 text-indigo-900" },
            ].filter((s) => !!s.content).map(({ label, content, colour }) => (
              <div key={label}>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                <div className={cn("rounded-lg border p-3", colour)}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2 flex-wrap pt-1">
              {record.status === "reviewed" && (
                <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={approve}>
                  <CheckCircle2 className="h-3 w-3" />
                  Approve Report
                </Button>
              )}
              {record.status === "approved" && !record.submitted_to_ofsted && (
                <Button size="sm" className="text-xs h-7 gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={markSubmitted}>
                  <Send className="h-3 w-3" />
                  Mark as Submitted to Ofsted
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Reg 45 Standards ──────────────────────────────────────────────────────────
interface Reg45Standard {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  colour: string;
  bg: string;
  border: string;
  sourceCategories: string[];
}

const REG45_STANDARDS: Reg45Standard[] = [
  {
    id: "quality_care",
    label: "Quality of Care",
    description: "Children's experiences, outcomes, voice and daily life",
    icon: CheckCircle2,
    colour: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    sourceCategories: ["Incidents", "Audits"],
  },
  {
    id: "staffing",
    label: "Staffing & Development",
    description: "Supervision, training compliance, workforce quality",
    icon: Users,
    colour: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    sourceCategories: ["Training", "Supervision"],
  },
  {
    id: "safeguarding",
    label: "Safeguarding",
    description: "Risk management, missing episodes, contextual risks",
    icon: ShieldCheck,
    colour: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    sourceCategories: ["Safeguarding"],
  },
  {
    id: "leadership",
    label: "Leadership & Management",
    description: "RI oversight, governance, challenge and quality assurance",
    icon: ClipboardCheck,
    colour: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    sourceCategories: ["Challenges", "Audits"],
  },
];

// ── Live evidence panel ───────────────────────────────────────────────────────
interface EvidenceItem {
  icon: React.ElementType;
  iconColour: string;
  category: string;
  title: string;
  detail: string;
  date: string;
}

function LiveEvidencePanel({ onUseContext }: { onUseContext: (text: string) => void }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [expandedStandards, setExpandedStandards] = useState<Set<string>>(new Set(REG45_STANDARDS.map((s) => s.id)));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: needsData } = useTrainingNeeds({ homeId: homeId });
  const { data: alertData } = useRiAlerts({ homeId: homeId });
  const { data: incidentsData } = useIncidents();
  const { data: auditsData } = useAudits();
  const { data: supervisionData } = useSupervisions();
  const { data: challengeData } = useRiChallengeLogs({ homeId: homeId });

  const items = useMemo((): EvidenceItem[] => {
    const out: EvidenceItem[] = [];

    // Completed training needs → Staffing
    (needsData?.data ?? [])
      .filter((n) => n.status === "completed" && n.completed_at)
      .forEach((n) =>
        out.push({
          icon: BookOpen,
          iconColour: "text-emerald-600",
          category: "Training",
          title: n.title,
          detail: `${n.need_type} — ${n.priority} priority, raised via ${n.identified_by.replace(/_/g, " ")}`,
          date: n.completed_at!,
        })
      );

    // Resolved RI alerts → Safeguarding
    (alertData?.data ?? [])
      .filter((a) => a.is_resolved && a.resolved_at)
      .forEach((a) =>
        out.push({
          icon: ShieldCheck,
          iconColour: "text-blue-600",
          category: "Safeguarding",
          title: a.title,
          detail: a.resolution_note ?? `${a.severity} severity alert resolved`,
          date: a.resolved_at!,
        })
      );

    // Closed incidents → Quality of Care
    (incidentsData?.data ?? [])
      .filter((i) => i.status === "closed" && i.oversight_note)
      .forEach((i) =>
        out.push({
          icon: AlertTriangle,
          iconColour: "text-amber-600",
          category: "Incidents",
          title: `${i.type.replace(/_/g, " ")} — ${i.severity} severity`,
          detail: i.oversight_note ?? "Incident closed with RI oversight",
          date: i.date,
        })
      );

    // Completed audits → Quality of Care or Leadership
    (auditsData?.data ?? [])
      .filter((a) => a.status === "completed" && a.score / Math.max(a.max_score, 1) >= 0.6)
      .forEach((a) =>
        out.push({
          icon: ClipboardCheck,
          iconColour: "text-violet-600",
          category: ["staffing", "general"].includes(a.category) ? "Challenges" : "Audits",
          title: a.title,
          detail: `Score: ${a.score}/${a.max_score} (${Math.round((a.score / Math.max(a.max_score, 1)) * 100)}%) — ${a.findings} finding${a.findings !== 1 ? "s" : ""}`,
          date: a.date,
        })
      );

    // Completed supervisions → Staffing
    (supervisionData?.data ?? [])
      .filter((s) => s.status === "completed" && s.actual_date)
      .slice(0, 6)
      .forEach((s) =>
        out.push({
          icon: Users,
          iconColour: "text-indigo-600",
          category: "Supervision",
          title: `Supervision completed — staff ${s.staff_id.replace("staff_", "")}`,
          detail: `Type: ${s.type.replace(/_/g, " ")}${s.wellbeing_score ? ` | Wellbeing: ${s.wellbeing_score}/10` : ""}`,
          date: s.actual_date!,
        })
      );

    // Resolved RI challenges → Leadership
    (challengeData?.data ?? [])
      .filter((c) => c.status === "resolved")
      .forEach((c) =>
        out.push({
          icon: CheckCircle2,
          iconColour: "text-emerald-600",
          category: "Challenges",
          title: `RI Challenge resolved — ${c.challenge_area.replace(/_/g, " ")}`,
          detail: c.manager_response ?? `${c.escalation_level} escalation challenge resolved`,
          date: c.updated_at ?? c.created_at,
        })
      );

    return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [needsData, alertData, incidentsData, auditsData, supervisionData, challengeData]);

  // Group items by standard
  const itemsByStandard = useMemo(() => {
    const result: Record<string, EvidenceItem[]> = {};
    REG45_STANDARDS.forEach((s) => {
      result[s.id] = items.filter((item) => s.sourceCategories.includes(item.category));
    });
    return result;
  }, [items]);

  const toggleStandard = (id: string) => {
    setExpandedStandards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const itemKey = (item: EvidenceItem) => `${item.category}-${item.title}-${item.date}`;

  const toggle = (item: EvidenceItem) => {
    const key = itemKey(item);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(items.map(itemKey)));
  const clearAll = () => setSelected(new Set());

  const buildContext = () => {
    const chosen = items.filter((i) => selected.has(itemKey(i)));
    if (chosen.length === 0) return;
    const text = REG45_STANDARDS.map((std) => {
      const stdItems = chosen.filter((i) => std.sourceCategories.includes(i.category));
      if (stdItems.length === 0) return null;
      return `${std.label}:\n` + stdItems.map((e) => `• ${e.title} (${new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}): ${e.detail}`).join("\n");
    }).filter(Boolean).join("\n\n");
    onUseContext(text);
  };

  return (
    <Card className="border border-emerald-100 bg-emerald-50/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600" />
            Evidence by Reg 45 Standard
            <Badge className="text-[10px] h-4 px-1.5 bg-emerald-100 text-emerald-700 border-emerald-200">
              {items.length} items
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <span className="text-xs text-emerald-700 font-semibold">{selected.size} selected</span>
            )}
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={selectAll}>All</Button>
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={clearAll}>Clear</Button>
            <Button
              size="sm"
              className="text-xs h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={selected.size === 0}
              onClick={buildContext}
            >
              <Copy className="h-3 w-3" />
              Use {selected.size > 0 ? selected.size : ""} items as ARIA context
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <p className="text-xs text-slate-500">
            Evidence auto-surfaced from completed training needs, resolved alerts, audits, and supervision — grouped by Reg 45 reporting standard. Select items to build ARIA context.
          </p>
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No completed evidence items found yet.</p>
          ) : (
            <div className="space-y-3">
              {REG45_STANDARDS.map((std) => {
                const stdItems = itemsByStandard[std.id] ?? [];
                const isExpanded = expandedStandards.has(std.id);
                const selectedInStd = stdItems.filter((i) => selected.has(itemKey(i))).length;
                const Icon = std.icon;
                return (
                  <div key={std.id} className={cn("rounded-2xl border overflow-hidden", std.border)}>
                    {/* Standard header */}
                    <button
                      onClick={() => toggleStandard(std.id)}
                      className={cn("w-full flex items-center gap-3 px-4 py-3 text-left", std.bg)}
                    >
                      <div className={cn("p-1.5 rounded-lg bg-white/70 shadow-sm")}>
                        <Icon className={cn("h-3.5 w-3.5", std.colour)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-bold", std.colour)}>{std.label}</span>
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-semibold", std.bg, std.colour)}>
                            {stdItems.length} item{stdItems.length !== 1 ? "s" : ""}
                          </span>
                          {selectedInStd > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                              {selectedInStd} selected
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{std.description}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                    </button>
                    {/* Items */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-50 bg-white">
                        {stdItems.length === 0 ? (
                          <div className="px-4 py-3 text-[11px] text-slate-400 italic">
                            No completed evidence items for this standard yet.
                          </div>
                        ) : (
                          stdItems.map((item) => {
                            const key = itemKey(item);
                            const isSelected = selected.has(key);
                            return (
                              <button
                                key={key}
                                onClick={() => toggle(item)}
                                className={cn(
                                  "w-full text-left px-4 py-2.5 transition-all flex items-start gap-3",
                                  isSelected ? "bg-emerald-50" : "hover:bg-slate-50"
                                )}
                              >
                                <item.icon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", item.iconColour)} />
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-semibold text-slate-800 leading-snug line-clamp-1">{item.title}</span>
                                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.detail}</p>
                                </div>
                                <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                                  {new Date(item.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                </span>
                                {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
    </Card>
  );
}

// ── Generate form ─────────────────────────────────────────────────────────────
function GenerateForm({
  evidenceNotes,
  setEvidenceNotes,
}: {
  evidenceNotes: string;
  setEvidenceNotes: (v: string) => void;
}) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [period, setPeriod] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const createMutation = useCreateRiReg45Evidence();

  const generate = async () => {
    if (!period || !periodStart || !periodEnd) return;
    setGenerating(true);
    try {
      const res = await api.post<{ data: { parsed?: Record<string, unknown> } }>(
        "/aria",
        {
          mode: "ri_reg45_generate",
          style: "reg_45_narrative",
          source_content: evidenceNotes || `Regulation 45 report for ${period}. Period: ${periodStart} to ${periodEnd}. Home: Oak House.`,
          page_context: "Regulation 45 Engine",
          record_type: "reg_45",
          user_role: "responsible_individual",
        }
      );
      const parsed = res.data?.parsed as Record<string, string> | undefined;
      if (parsed) setResult(parsed);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const save = () => {
    if (!result) return;
    createMutation.mutate(
      {
        home_id: homeId,
        report_period: period,
        period_start: periodStart,
        period_end: periodEnd,
        evidence_items: [],
        aria_strengths: result.strengths,
        aria_weaknesses: result.weaknesses,
        aria_improvement_areas: result.improvement_areas,
        aria_child_impact: result.child_impact,
        aria_action_plan: Array.isArray(result.action_plan) ? (result.action_plan as string[]).join("\n") : result.action_plan,
        aria_ri_statement: result.ri_statement,
        aria_generated_at: new Date().toISOString(),
        status: "in_progress",
        submitted_to_ofsted: false,
        created_by: currentUser?.id ?? "staff_darren",
      },
      { onSuccess: () => { setResult(null); setPeriod(""); setPeriodStart(""); setPeriodEnd(""); setEvidenceNotes(""); } }
    );
  };

  return (
    <Card className="border border-blue-100 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          Generate New Reg 45 Report with ARIA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Report Period</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Q1 2026"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Period Start</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Period End</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Evidence Context (optional)</label>
          <Textarea
            className="mt-1 text-sm"
            rows={3}
            placeholder="Paste key evidence, themes, or context for ARIA to use when drafting…"
            value={evidenceNotes}
            onChange={(e) => setEvidenceNotes(e.target.value)}
          />
        </div>
        <Button
          onClick={generate}
          disabled={!period || !periodStart || !periodEnd || generating}
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {generating ? "Generating Reg 45 with ARIA…" : "Generate Reg 45 Draft"}
        </Button>

        {result && (
          <div className="space-y-3 border-t border-blue-100 pt-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">ARIA Draft — Review before saving</p>
            {[
              { label: "Strengths", key: "strengths" },
              { label: "Weaknesses", key: "weaknesses" },
              { label: "Impact on Children", key: "child_impact" },
              { label: "RI Statement", key: "ri_statement" },
            ].map(({ label, key }) => result[key] && (
              <div key={key}>
                <p className="text-[11px] text-slate-500 mb-1">{label}</p>
                <div className="rounded-lg bg-white border border-slate-100 p-3">
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{result[key]}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={createMutation.isPending} className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {createMutation.isPending ? "Saving…" : "Save Draft"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setResult(null)}>Discard</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Reg45Page() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const { data, isLoading } = useRiReg45Evidence({ homeId: homeId });
  const records = data?.data ?? [];
  const [evidenceNotes, setEvidenceNotes] = useState("");

  return (
    <PageShell
      title="Regulation 45 Engine"
      subtitle="Evidence collection and Reg 45 report generation"
      ariaContext={{ pageTitle: "Regulation 45 Engine", sourceType: "reg45" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton
            title="Reg 45 Reports"
            subtitle="Oak House — Independent Person Reports"
            targetId="reg45-content"
          />
          <SmartUploadButton variant="inline" label="Upload Evidence" uploadContext="RI — Regulation 45 evidence upload" />
        </div>
      }
    >
      <div id="reg45-content" className="space-y-5 animate-fade-in">
        {/* Compliance notice */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed">
            <strong>Regulation 45 reports</strong> must be completed at least once every 6 months by the RI under Reg 45 of the Children's Homes (England) Regulations 2015. ARIA drafts are a starting point — all content must be reviewed, edited and approved by the RI before submission.
          </p>
        </div>

        {/* Live evidence basket */}
        <LiveEvidencePanel onUseContext={(text) => setEvidenceNotes((prev) => prev ? prev + "\n\n" + text : text)} />

        {/* Generate new */}
        <GenerateForm evidenceNotes={evidenceNotes} setEvidenceNotes={setEvidenceNotes} />

        {/* Existing records */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Previous Reports</h3>
          {isLoading ? (
            <div className="text-sm text-slate-500 text-center py-8">Loading…</div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No Reg 45 reports yet. Generate your first above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <Reg45Card key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
