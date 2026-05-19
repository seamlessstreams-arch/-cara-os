"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown, ChevronUp, Brain, ArrowUpDown, Search,
  AlertTriangle, Users, Layers, Info, CalendarClock,
  Shield, Lightbulb, ClipboardList, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMultiDisciplinaryFormulations } from "@/hooks/use-multi-disciplinary-formulations";
import type { MultiDisciplinaryFormulation, FormulationModel } from "@/types/extended";
import { FORMULATION_MODEL_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const MODEL_COLOURS: Record<FormulationModel, string> = {
  "5ps": "bg-blue-100 text-blue-800",
  cognitive_behavioural: "bg-indigo-100 text-indigo-800",
  attachment_based: "bg-pink-100 text-pink-800",
  trauma_informed: "bg-purple-100 text-purple-800",
  systemic: "bg-emerald-100 text-emerald-800",
  integrated: "bg-amber-100 text-amber-800",
};

const renderParticipant = (p: string) => p.startsWith("staff_") ? getStaffName(p) : p;

export default function MultiDisciplinaryFormulationPage() {
  const { data: res, isLoading } = useMultiDisciplinaryFormulations();
  const data: MultiDisciplinaryFormulation[] = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterModel, setFilterModel] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const stats = useMemo(() => {
    const active = data.length;
    const reviewDue = data.filter((f) => f.next_review_date <= d(30)).length;
    const avgParticipants = data.length === 0 ? 0 : Math.round((data.reduce((s, f) => s + f.participants_attended.length, 0) / data.length) * 10) / 10;
    const modelsUsed = new Set(data.map((f) => f.model_used)).size;
    return { active, reviewDue, avgParticipants, modelsUsed };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((f) =>
        getYPName(f.child_id).toLowerCase().includes(q) ||
        FORMULATION_MODEL_LABEL[f.model_used].toLowerCase().includes(q) ||
        f.key_hypotheses.some((h) => h.toLowerCase().includes(q))
      );
    }
    if (filterModel !== "all") list = list.filter((f) => f.model_used === filterModel);
    switch (sortBy) {
      case "name": list.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
      case "review": list.sort((a, b) => a.next_review_date.localeCompare(b.next_review_date)); break;
      default: list.sort((a, b) => b.formulation_date.localeCompare(a.formulation_date));
    }
    return list;
  }, [data, search, filterModel, sortBy]);

  interface FlatRow {
    youngPerson: string; version: number; formulationDate: string; modelUsed: string;
    participants: string; presentingDifficulties: string; predisposing: string;
    precipitating: string; perpetuating: string; protective: string; keyHypotheses: string;
    agreedInterventions: string; riskFactors: string; childContribution: string;
    internalLead: string; nextReviewDate: string; shareableSummary: string;
  }

  const exportData = useMemo<FlatRow[]>(() => data.map((f) => ({
    youngPerson: getYPName(f.child_id),
    version: f.version,
    formulationDate: f.formulation_date,
    modelUsed: FORMULATION_MODEL_LABEL[f.model_used],
    participants: f.participants_attended.map(renderParticipant).join("; "),
    presentingDifficulties: f.presenting_difficulties.join("; "),
    predisposing: f.predisposing.join("; "),
    precipitating: f.precipitating.join("; "),
    perpetuating: f.perpetuating.join("; "),
    protective: f.protective.join("; "),
    keyHypotheses: f.key_hypotheses.join("; "),
    agreedInterventions: f.agreed_interventions.join("; "),
    riskFactors: f.risk_factors.join("; "),
    childContribution: f.child_contribution,
    internalLead: getStaffName(f.internal_lead),
    nextReviewDate: f.next_review_date,
    shareableSummary: f.shareable_summary,
  })), [data]);

  const EXPORT_COLS: ExportColumn<FlatRow>[] = [
    { header: "Young Person", accessor: (r) => r.youngPerson },
    { header: "Version", accessor: (r) => r.version },
    { header: "Formulation Date", accessor: (r) => r.formulationDate },
    { header: "Model Used", accessor: (r) => r.modelUsed },
    { header: "Participants", accessor: (r) => r.participants },
    { header: "Presenting Difficulties", accessor: (r) => r.presentingDifficulties },
    { header: "Predisposing", accessor: (r) => r.predisposing },
    { header: "Precipitating", accessor: (r) => r.precipitating },
    { header: "Perpetuating", accessor: (r) => r.perpetuating },
    { header: "Protective", accessor: (r) => r.protective },
    { header: "Key Hypotheses", accessor: (r) => r.keyHypotheses },
    { header: "Agreed Interventions", accessor: (r) => r.agreedInterventions },
    { header: "Risk Factors", accessor: (r) => r.riskFactors },
    { header: "Child Contribution", accessor: (r) => r.childContribution },
    { header: "Internal Lead", accessor: (r) => r.internalLead },
    { header: "Next Review", accessor: (r) => r.nextReviewDate },
    { header: "Shareable Summary", accessor: (r) => r.shareableSummary },
  ];

  if (isLoading) return <PageShell title="Multi-Disciplinary Formulation" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Multi-Disciplinary Formulation"
      subtitle="Collaborative psychological case formulation across CAMHS, social work, education and home staff — aligned with NICE and BPS principles"
      ariaContext={{ pageTitle: "Multi-Disciplinary Formulation", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Multi-Disciplinary Formulation" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="multi-disciplinary-formulation" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-900">
          <strong>A formulation is a working hypothesis, not a diagnosis.</strong>{" "}
          It is the team&apos;s best shared understanding of why this child is presenting in this way, at this time, and what is most likely to help.
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Formulations", value: stats.active, icon: Brain, colour: "text-blue-600" },
          { label: "Review Due (30 d)", value: stats.reviewDue, icon: AlertTriangle, colour: stats.reviewDue > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Avg Participants", value: stats.avgParticipants, icon: Users, colour: "text-emerald-600" },
          { label: "Models Used", value: stats.modelsUsed, icon: Layers, colour: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search children, model or hypothesis…" className="pl-9" />
        </div>
        <Select value={filterModel} onValueChange={setFilterModel}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            {(Object.keys(FORMULATION_MODEL_LABEL) as FormulationModel[]).map((k) => <SelectItem key={k} value={k}>{FORMULATION_MODEL_LABEL[k]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-gray-500" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="review">Review Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {filtered.map((f) => {
          const open = expandedId === f.id;
          const reviewDue = f.next_review_date <= d(30);
          return (
            <div key={f.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(f.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Brain className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getYPName(f.child_id)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", MODEL_COLOURS[f.model_used])}>{FORMULATION_MODEL_LABEL[f.model_used]}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">v{f.version}</span>
                    {reviewDue && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Review Due</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Formulated {f.formulation_date} · {f.participants_attended.length} participants · Lead: {getStaffName(f.internal_lead)} · Next review {f.next_review_date}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Date:</span> <span className="font-medium">{f.formulation_date}</span></div>
                    <div><span className="text-gray-500">Model:</span> <span className="font-medium">{FORMULATION_MODEL_LABEL[f.model_used]}</span></div>
                    <div><span className="text-gray-500">Lead:</span> <span className="font-medium">{getStaffName(f.internal_lead)}</span></div>
                    <div><span className="text-gray-500">Next review:</span> <span className={cn("font-medium", f.next_review_date <= d(0) ? "text-red-600" : "")}>{f.next_review_date}</span></div>
                  </div>

                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Participants</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {f.participants_attended.map((p: string, i: number) => (
                        <span key={i} className={cn("px-2 py-0.5 rounded text-xs", p.startsWith("staff_") ? "bg-blue-100 text-blue-800" : "bg-white border text-gray-700")}>{renderParticipant(p)}</span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" /> Presenting Difficulties</h4>
                    <ul className="list-disc list-inside text-sm text-gray-800 space-y-0.5">{f.presenting_difficulties.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Predisposing — &quot;What made this child vulnerable?&quot;</h4>
                      <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">{f.predisposing.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
                    </div>
                    <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
                      <h4 className="text-xs font-semibold text-orange-700 mb-1">Precipitating — &quot;What triggered things now?&quot;</h4>
                      <ul className="list-disc list-inside text-sm text-orange-900 space-y-0.5">{f.precipitating.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
                    </div>
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">Perpetuating — &quot;What keeps it going?&quot;</h4>
                      <ul className="list-disc list-inside text-sm text-red-900 space-y-0.5">{f.perpetuating.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
                    </div>
                    <div className="rounded-md bg-green-50 border border-green-200 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Protective — &quot;What is helping?&quot;</h4>
                      <ul className="list-disc list-inside text-sm text-green-900 space-y-0.5">{f.protective.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
                    </div>
                  </div>

                  <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                    <h4 className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1"><Lightbulb className="h-3.5 w-3.5" /> Key Hypotheses</h4>
                    <ul className="list-disc list-inside text-sm text-purple-900 space-y-1">{f.key_hypotheses.map((h: string, i: number) => <li key={i}>{h}</li>)}</ul>
                  </div>

                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">Agreed Interventions</h4>
                    <ul className="list-disc list-inside text-sm text-blue-900 space-y-0.5">{f.agreed_interventions.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
                  </div>

                  <div className="rounded-md bg-red-50 border border-red-200 p-3">
                    <h4 className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Risk Factors</h4>
                    <ul className="list-disc list-inside text-sm text-red-900 space-y-0.5">{f.risk_factors.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
                  </div>

                  <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                    <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Contribution</h4>
                    <p className="text-sm text-pink-900">{f.child_contribution}</p>
                  </div>

                  <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                    <h4 className="text-xs font-semibold text-emerald-700 mb-1">Shareable Summary — Child-Friendly Version</h4>
                    <p className="text-sm text-emerald-900">{f.shareable_summary}</p>
                  </div>

                  <div className="rounded-md bg-gray-100 border border-gray-300 p-3">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">Confidential Notes — Restricted Access</h4>
                    <p className="text-sm text-gray-800">{f.confidential_notes}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Next formulation review: <span className="font-medium text-gray-700">{f.next_review_date}</span>
                  </div>

                  <SmartLinkPanel sourceType="multi-disciplinary-formulation" sourceId={f.id} childId={f.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Regulatory and professional standards:</strong>{" "}
        Multi-disciplinary formulation aligns with the British Psychological Society&apos;s Good Practice Guidelines on the Use of Psychological Formulation (BPS, 2011) and underpins NICE-recommended care planning for children with mental health and developmental needs.
      </div>
      <CareEventsPanel
        title="Care Events — Health & Wellbeing"
        category={["health", "wellbeing"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Multi-Disciplinary Formulation — clinical formulation, CAMHS, psychology, social work, education, therapeutic formulation, shared understanding, intervention planning, care plan evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
