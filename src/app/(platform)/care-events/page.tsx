"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertCircle, CheckCircle2, Clock, FileText, Loader2, Plus,
  RefreshCw, Search, Shield, Zap, ChevronRight, BookOpen,
  AlertTriangle, Lock, RotateCcw, ArrowUpRight, Eye, Route,
  FolderOpen, BarChart2, ListChecks,
} from "lucide-react";
import {
  useCareEvents, useCreateCareEvent, useSubmitCareEvent,
  useVerifyCareEvent, useReturnCareEvent, useLockCareEvent,
  useRetryCareEventRouting, useUpdateCareEventPrompts,
} from "@/hooks/use-care-events";
import { useYoungPeople } from "@/hooks/use-young-people";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import {
  CARE_EVENT_STATUS_LABEL, CARE_EVENT_CATEGORY_LABEL,
} from "@/types/care-events";
import type {
  CareEvent, CareEventCategory, EvidencePrompt,
} from "@/types/care-events";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Status colours ─────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  draft:                    { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
  submitted:                { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  routing:                  { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-400" },
  routed:                   { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
  manager_review_required:  { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  returned:                 { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  verified:                 { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  locked:                   { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  routing_failed:           { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

const CATEGORY_OPTIONS: { value: CareEventCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "behaviour", label: "Behaviour" },
  { value: "health", label: "Health" },
  { value: "medication", label: "Medication" },
  { value: "education", label: "Education" },
  { value: "family_contact", label: "Family Contact" },
  { value: "professional_contact", label: "Professional Contact" },
  { value: "safeguarding", label: "Safeguarding" },
  { value: "missing_episode", label: "Missing Episode" },
  { value: "physical_intervention", label: "Physical Intervention" },
  { value: "restraint", label: "Restraint" },
  { value: "complaint", label: "Complaint / Request" },
  { value: "activity", label: "Activity" },
  { value: "wellbeing", label: "Wellbeing" },
  { value: "sleep", label: "Sleep" },
  { value: "food", label: "Food / Nutrition" },
  { value: "finance", label: "Finance" },
  { value: "other", label: "Other" },
];

// ── StatusBadge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.draft;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", style.bg, style.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
      {CARE_EVENT_STATUS_LABEL[status as keyof typeof CARE_EVENT_STATUS_LABEL] ?? status}
    </span>
  );
}

// ── RoutingBadge ──────────────────────────────────────────────────────────

function RoutingFlags({ event }: { event: CareEvent }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {event.requires_manager_review && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">
          <AlertTriangle className="w-3 h-3" /> Manager review
        </span>
      )}
      {event.requires_reg40_triage && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-xs">
          <Shield className="w-3 h-3" /> Reg 40 triage
        </span>
      )}
      {event.contributes_to_reg45 && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
          <BookOpen className="w-3 h-3" /> Reg 45
        </span>
      )}
      {event.contributes_to_annex_a && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
          <FileText className="w-3 h-3" /> Annex A
        </span>
      )}
      {event.is_safeguarding && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-800 rounded text-xs font-semibold">
          <Shield className="w-3 h-3" /> Safeguarding
        </span>
      )}
    </div>
  );
}

// ── RoutingPreviewPanel ───────────────────────────────────────────────────

interface RoutingPreview {
  routes: string[];
  requires_manager_review: boolean;
  requires_reg40_triage: boolean;
  contributes_to_reg45: boolean;
  contributes_to_annex_a: boolean;
  evidence_prompts: EvidencePrompt[];
  background_jobs: string[];
}

const ROUTE_LABELS: Record<string, string> = {
  daily_log: "Daily running log",
  child_daily_summary: "Child daily summary",
  incident: "Incident record",
  missing_episode: "Missing episode record",
  physical_intervention: "Physical intervention record",
  health_record: "Health record",
  medication_record: "Medication record",
  education_record: "Education record",
  family_contact_record: "Family contact record",
  professional_contact_record: "Professional contact record",
  complaint_record: "Complaint record",
  safeguarding_record: "Safeguarding record",
  risk_assessment_task: "Risk assessment review task",
  behaviour_plan_task: "Behaviour plan review task",
  followup_task: "Follow-up task",
  management_oversight: "Management oversight queue",
  reg40_triage: "Regulation 40 triage queue",
  reg44_evidence: "Regulation 44 evidence",
  reg45_evidence: "Regulation 45 evidence bank",
  annex_a_evidence: "Annex A evidence bank",
  filing_cabinet: "Filing cabinet",
  saved_time: "Saved-time tracker",
};

const ROUTE_ICONS: Record<string, React.ReactNode> = {
  management_oversight: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
  reg40_triage: <Shield className="w-3.5 h-3.5 text-red-600" />,
  reg45_evidence: <BookOpen className="w-3.5 h-3.5 text-indigo-600" />,
  annex_a_evidence: <FileText className="w-3.5 h-3.5 text-purple-600" />,
  filing_cabinet: <FolderOpen className="w-3.5 h-3.5 text-orange-600" />,
  safeguarding_record: <Shield className="w-3.5 h-3.5 text-red-700" />,
};

function RoutingPreviewPanel({ preview }: { preview: RoutingPreview }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
        <div className="flex items-start gap-2">
          <Route className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Routing preview</p>
            <p className="text-xs text-blue-600 mt-0.5">
              When submitted, this event will automatically update {preview.routes.length} area{preview.routes.length !== 1 ? "s" : ""}.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {preview.routes.map((route) => (
          <div key={route} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded px-3 py-2">
            {ROUTE_ICONS[route] ?? <Zap className="w-3.5 h-3.5 text-slate-400" />}
            <span>{ROUTE_LABELS[route] ?? route}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {preview.requires_manager_review && (
          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded px-2 py-1">
            <AlertCircle className="w-3 h-3" /> Manager review required
          </span>
        )}
        {preview.requires_reg40_triage && (
          <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded px-2 py-1">
            <Shield className="w-3 h-3" /> Regulation 40 triage required
          </span>
        )}
        {preview.contributes_to_reg45 && (
          <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-2 py-1">
            <BookOpen className="w-3 h-3" /> Reg 45 evidence suggested
          </span>
        )}
        {preview.contributes_to_annex_a && (
          <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded px-2 py-1">
            <FileText className="w-3 h-3" /> Annex A evidence suggested
          </span>
        )}
      </div>

      {preview.evidence_prompts.length > 0 && (
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5" />
          {preview.evidence_prompts.length} evidence question{preview.evidence_prompts.length !== 1 ? "s" : ""} required before submission.
        </div>
      )}
    </div>
  );
}

// ── RoutingResultBanner ───────────────────────────────────────────────────

interface RoutingResult {
  text: string;
  areas: string[];
  records_updated?: number;
  tasks_created?: number;
  reg45_count?: number;
  annex_a_count?: number;
}

function RoutingResultBanner({ result }: { result: RoutingResult }) {
  const { text, areas, records_updated, tasks_created, reg45_count, annex_a_count } = result;
  const stats = [
    records_updated ? `${records_updated} record${records_updated !== 1 ? "s" : ""} updated` : null,
    tasks_created ? `${tasks_created} task${tasks_created !== 1 ? "s" : ""} created` : null,
    reg45_count ? `${reg45_count} Reg 45 evidence suggestion${reg45_count !== 1 ? "s" : ""}` : null,
    annex_a_count ? `${annex_a_count} Annex A update${annex_a_count !== 1 ? "s" : ""}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">{text}</p>
            {areas.length > 0 && (
              <p className="text-xs text-emerald-600 mt-1">Areas updated: {areas.join(", ")}</p>
            )}
          </div>
        </div>
      </div>
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <div key={s} className="flex items-center gap-2 bg-slate-50 rounded px-3 py-2 text-xs text-slate-700">
              <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
              {s}
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {([
          { label: "Reg 45 Evidence", href: "/regulation-45" },
          { label: "Annex A", href: "/annex-a" },
          { label: "Filing Cabinet", href: "/filing-cabinet" },
          { label: "Management Oversight", href: "/management-oversight" },
        ] as { label: string; href: string }[]).map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-100 bg-indigo-50 rounded px-2 py-0.5 hover:bg-indigo-100 transition-colors"
          >
            {link.label} →
          </a>
        ))}
      </div>
    </div>
  );
}

// ── EvidencePromptsForm ───────────────────────────────────────────────────

function EvidencePromptsForm({
  prompts,
  answers,
  onChange,
}: {
  prompts: EvidencePrompt[];
  answers: Record<string, string>;
  onChange: (answers: Record<string, string>) => void;
}) {
  if (prompts.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700">Evidence questions</p>
      {prompts.map((p) => (
        <div key={p.id} className="space-y-1">
          <label className="text-xs text-slate-600">
            {p.question}
            {p.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <Textarea
            rows={2}
            value={answers[p.id] ?? ""}
            onChange={(e) => onChange({ ...answers, [p.id]: e.target.value })}
            placeholder="Your answer…"
            className="text-sm"
          />
        </div>
      ))}
    </div>
  );
}

// ── CreateEventDialog ─────────────────────────────────────────────────────

function CreateEventDialog({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  const { data: ypData } = useYoungPeople();
  const createMutation = useCreateCareEvent();
  const submitMutation = useSubmitCareEvent();

  const [step, setStep] = useState<"form" | "routing-preview" | "prompts" | "done">("form");
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "general" as CareEventCategory,
    child_id: "",
    event_date: new Date().toISOString().slice(0, 10),
    event_time: new Date().toTimeString().slice(0, 5),
    mood_score: "" as string | number,
    is_significant: false,
  });
  const [createdEvent, setCreatedEvent] = useState<CareEvent | null>(null);
  const [routingPreview, setRoutingPreview] = useState<RoutingPreview | null>(null);
  const [evidenceAnswers, setEvidenceAnswers] = useState<Record<string, string>>({});
  const [routingResult, setRoutingResult] = useState<RoutingResult | null>(null);

  const yp = ypData?.data ?? [];

  function resetAndClose() {
    setStep("form");
    setForm({ title: "", content: "", category: "general", child_id: "", event_date: new Date().toISOString().slice(0, 10), event_time: new Date().toTimeString().slice(0, 5), mood_score: "", is_significant: false });
    setCreatedEvent(null);
    setRoutingPreview(null);
    setEvidenceAnswers({});
    setRoutingResult(null);
    onClose();
  }

  async function handleCreate() {
    const res = await createMutation.mutateAsync({
      title: form.title,
      content: form.content,
      category: form.category,
      child_id: form.child_id || undefined,
      event_date: form.event_date,
      event_time: form.event_time,
      mood_score: form.mood_score ? Number(form.mood_score) : undefined,
      is_significant: form.is_significant,
    });
    setCreatedEvent(res.data);
    const preview = res.routing_preview as RoutingPreview;
    setRoutingPreview(preview);
    // Always show routing preview so staff can see where the event will route
    setStep("routing-preview");
  }

  async function proceedFromPreview() {
    const prompts = (createdEvent?.evidence_prompts ?? []) as EvidencePrompt[];
    if (prompts.length > 0) {
      setStep("prompts");
    } else {
      await doSubmit(createdEvent!.id, {});
    }
  }

  async function doSubmit(eventId: string, answers: Record<string, string>) {
    const res = await submitMutation.mutateAsync({
      id: eventId,
      staff_signature: true,
      evidence_answers: answers,
    });
    const result = res.result;
    setRoutingResult({
      text: result?.routing_summary_text ?? "Entry submitted.",
      areas: result?.routing_summary?.areas_updated ?? [],
      records_updated: result?.routing_summary?.records_updated,
      tasks_created: result?.routing_summary?.tasks_created,
      reg45_count: result?.routing_summary?.reg45_count,
      annex_a_count: result?.routing_summary?.annex_a_count,
    });
    setStep("done");
  }

  const prompts = (createdEvent?.evidence_prompts ?? []) as EvidencePrompt[];
  const isLoading = createMutation.isPending || submitMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); }}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "form" && "New Care Event"}
            {step === "routing-preview" && "Routing preview"}
            {step === "prompts" && "Evidence questions"}
            {step === "done" && "Submitted — routing complete"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Category *</label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as CareEventCategory }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Young person</label>
                <Select value={form.child_id} onValueChange={(v) => setForm((f) => ({ ...f, child_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Not specific to a child —</SelectItem>
                    {yp.map((y: { id: string; first_name: string; last_name: string }) => (
                      <SelectItem key={y.id} value={y.id}>{y.first_name} {y.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Title *</label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Brief summary" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Full account *</label>
              <Textarea rows={5} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Describe what happened, when, who was involved, what actions were taken…" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Date</label>
                <Input type="date" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Time</label>
                <Input type="time" value={form.event_time} onChange={(e) => setForm((f) => ({ ...f, event_time: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Mood (1–10)</label>
                <Input type="number" min={1} max={10} value={form.mood_score} onChange={(e) => setForm((f) => ({ ...f, mood_score: e.target.value }))} placeholder="—" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_significant}
                onChange={(e) => setForm((f) => ({ ...f, is_significant: e.target.checked }))}
                className="rounded"
              />
              Mark as significant event
            </label>
          </div>
        )}

        {step === "routing-preview" && routingPreview && (
          <div className="py-2">
            <RoutingPreviewPanel preview={routingPreview} />
          </div>
        )}

        {step === "prompts" && createdEvent && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">Please answer the following questions before submitting. Required questions are marked <span className="text-red-500">*</span></p>
            <EvidencePromptsForm
              prompts={prompts}
              answers={evidenceAnswers}
              onChange={setEvidenceAnswers}
            />
          </div>
        )}

        {step === "done" && routingResult && (
          <div className="py-2">
            <RoutingResultBanner result={routingResult} />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            {step === "done" ? "Close" : "Cancel"}
          </Button>
          {step === "form" && (
            <Button
              onClick={handleCreate}
              disabled={isLoading || !form.title.trim() || !form.content.trim()}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
              Preview routing
            </Button>
          )}
          {step === "routing-preview" && createdEvent && (
            <Button
              onClick={proceedFromPreview}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {prompts.length > 0 ? "Answer evidence questions" : "Submit & route"}
            </Button>
          )}
          {step === "prompts" && createdEvent && (
            <Button
              onClick={() => doSubmit(createdEvent.id, evidenceAnswers)}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Submit & route
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── CareEventCard ─────────────────────────────────────────────────────────

function CareEventCard({ event, onAction }: {
  event: CareEvent;
  onAction: (action: string, event: CareEvent) => void;
}) {
  const categoryLabel = CARE_EVENT_CATEGORY_LABEL[event.category] ?? event.category;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusBadge status={event.status} />
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{categoryLabel}</span>
              {event.is_significant && (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Significant</span>
              )}
            </div>
            <h3 className="font-medium text-slate-900 text-sm truncate">
              <a
                href={`/care-events/${event.id}`}
                className="hover:text-indigo-700 hover:underline"
              >
                {event.title}
              </a>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDate(event.event_date)}{event.event_time ? ` at ${event.event_time}` : ""} · {(event as never as { staff_name?: string }).staff_name ?? event.staff_id}{event.child_id && <> · {(event as never as { child_name?: string }).child_name ?? event.child_id}</>}
            </p>
            <RoutingFlags event={event} />
          </div>

          <div className="flex flex-col gap-1.5 items-end shrink-0">
            {event.status === "draft" && (
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onAction("submit", event)}>
                Submit <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
            {event.status === "routing_failed" && (
              <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200" onClick={() => onAction("retry", event)}>
                <RefreshCw className="w-3 h-3 mr-1" /> Retry
              </Button>
            )}
            {event.status === "routed" && (
              <Button size="sm" variant="outline" className="text-xs h-7 text-emerald-700 border-emerald-200" onClick={() => onAction("verify", event)}>
                <CheckCircle2 className="w-3 h-3 mr-1" /> Verify
              </Button>
            )}
            {event.status === "manager_review_required" && (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="text-xs h-7 text-emerald-700 border-emerald-200" onClick={() => onAction("verify", event)}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Verify
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-7 text-orange-600 border-orange-200" onClick={() => onAction("return", event)}>
                  <RotateCcw className="w-3 h-3 mr-1" /> Return
                </Button>
              </div>
            )}
            {event.status === "verified" && (
              <Button size="sm" variant="outline" className="text-xs h-7 text-purple-700 border-purple-200" onClick={() => onAction("lock", event)}>
                <Lock className="w-3 h-3 mr-1" /> Lock
              </Button>
            )}
          </div>
        </div>

        {event.return_reason && (
          <div className="mt-3 text-xs text-orange-700 bg-orange-50 rounded p-2 border border-orange-100">
            <strong>Returned:</strong> {event.return_reason}
          </div>
        )}

        {event.routing_summary && (
          <div className="mt-2 text-xs text-indigo-600 bg-indigo-50 rounded p-1.5 flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            {event.routing_summary.areas_updated?.length > 0
              ? `Auto-updated: ${event.routing_summary.areas_updated.slice(0, 3).join(", ")}${event.routing_summary.areas_updated.length > 3 ? ` +${event.routing_summary.areas_updated.length - 3} more` : ""}`
              : "Routing complete"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Simple action dialogs ─────────────────────────────────────────────────

function ActionDialog({
  open, action, event, onClose,
}: { open: boolean; action: string; event: CareEvent | null; onClose: () => void }) {
  const verifyMutation = useVerifyCareEvent();
  const returnMutation = useReturnCareEvent();
  const lockMutation = useLockCareEvent();
  const retryMutation = useRetryCareEventRouting();

  const [notes, setNotes] = useState("");
  const [returnReason, setReturnReason] = useState("");

  const isLoading =
    verifyMutation.isPending || returnMutation.isPending ||
    lockMutation.isPending || retryMutation.isPending;

  if (!event) return null;

  async function handleConfirm() {
    if (!event) return;
    switch (action) {
      case "verify":
        await verifyMutation.mutateAsync({ id: event.id, manager_signature: true, manager_notes: notes || undefined });
        break;
      case "return":
        if (!returnReason.trim()) return;
        await returnMutation.mutateAsync({ id: event.id, return_reason: returnReason, manager_notes: notes || undefined });
        break;
      case "lock":
        await lockMutation.mutateAsync(event.id);
        break;
      case "retry":
        await retryMutation.mutateAsync(event.id);
        break;
    }
    setNotes("");
    setReturnReason("");
    onClose();
  }

  const titles: Record<string, string> = {
    verify: "Verify record",
    return: "Return for correction",
    lock: "Lock record",
    retry: "Retry failed routing",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[action] ?? action}</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-sm text-slate-600">{event.title}</p>

          {action === "return" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Reason for return *</label>
              <Textarea rows={3} value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="What needs to be corrected?" />
            </div>
          )}

          {(action === "verify") && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Manager notes (optional)</label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for the record" />
            </div>
          )}

          {action === "lock" && (
            <p className="text-sm text-slate-500">Once locked, this record cannot be directly edited. Only formal amendments will be permitted.</p>
          )}

          {action === "retry" && (
            <p className="text-sm text-slate-500">This will attempt to re-run any routes that failed during initial routing.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || (action === "return" && !returnReason.trim())}
            variant={action === "lock" ? "default" : "default"}
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

type FilterStatus = "all" | "draft" | "manager_review_required" | "routing_failed" | "verified" | "locked";

export default function CareEventsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ action: string; event: CareEvent } | null>(null);

  const { data, isLoading, refetch } = useCareEvents({ days: 30 });

  const events = data?.data ?? [];
  const meta = data?.meta;

  const filtered = useMemo(() => {
    let list = events;
    if (activeFilter !== "all") list = list.filter((e) => e.status === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.category.includes(q)
      );
    }
    return list;
  }, [events, activeFilter, search]);

  const counts = meta?.status_counts ?? {};

  const FILTERS: { id: FilterStatus; label: string }[] = [
    { id: "all", label: "All" },
    { id: "draft", label: "Drafts" },
    { id: "manager_review_required", label: "Needs review" },
    { id: "routing_failed", label: "Failed routing" },
    { id: "verified", label: "Verified" },
    { id: "locked", label: "Locked" },
  ];

  return (
    <PageShell
      title="Care Events"
      subtitle="Record, route and track care events across the home"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> New event
          </Button>
        </div>
      }
    >
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Today's events", value: filtered.filter((e) => e.event_date === new Date().toISOString().slice(0, 10)).length, icon: Clock, color: "text-slate-700" },
          { label: "Needs manager review", value: counts.manager_review_required ?? 0, icon: AlertCircle, color: "text-amber-600" },
          { label: "Reg 40 triage", value: filtered.filter((e) => e.requires_reg40_triage && e.status !== "verified" && e.status !== "locked").length, icon: AlertTriangle, color: "text-red-600" },
          { label: "Verified (30 days)", value: counts.verified ?? 0, icon: CheckCircle2, color: "text-emerald-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={cn("w-5 h-5", color)} />
              <div>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={activeFilter === f.id ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
              {f.id !== "all" && counts[f.id] ? (
                <span className="ml-1.5 bg-white/20 px-1 rounded text-xs">{counts[f.id]}</span>
              ) : null}
            </Button>
          ))}
        </div>
      </div>

      {/* Event list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No care events found</p>
          <p className="text-sm mt-1">
            {activeFilter !== "all" ? "Try changing the filter" : "Create the first event using the button above"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => (
            <CareEventCard
              key={event.id}
              event={event}
              onAction={(action, ev) => setActionDialog({ action, event: ev })}
            />
          ))}
        </div>
      )}

      {/* Reg 45 evidence queue summary */}
      {events.some((e) => e.contributes_to_reg45 && e.status === "verified") && (
        <Card className="mt-6 border-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Regulation 45 evidence bank
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-500">
              {events.filter((e) => e.contributes_to_reg45 && e.status === "verified").length} verified record(s) have been suggested as Regulation 45 evidence.
            </p>
            <Button size="sm" variant="link" className="px-0 text-indigo-600 text-xs mt-1">
              Review Regulation 45 evidence <ArrowUpRight className="w-3 h-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateEventDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <ActionDialog
        open={!!actionDialog}
        action={actionDialog?.action ?? ""}
        event={actionDialog?.event ?? null}
        onClose={() => setActionDialog(null)}
      />
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
