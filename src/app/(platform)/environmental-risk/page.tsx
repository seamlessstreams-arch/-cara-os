"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Clock,
  Loader2,
} from "lucide-react";
import { toast }        from "sonner";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type {
  EnvironmentalRisk,
  EnvRiskCategory,
  EnvRiskLevel,
  EnvAssessmentStatus,
} from "@/types/extended";
import {
  ENV_RISK_CATEGORY_LABEL,
  ENV_RISK_LEVEL_LABEL,
  ENV_ASSESSMENT_STATUS_LABEL,
} from "@/types/extended";
import { useEnvironmentalRisks, useCreateEnvironmentalRisk } from "@/hooks/use-environmental-risks";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── label / colour maps ──────────────────────────────────────────────── */

const CAT_LABELS  = ENV_RISK_CATEGORY_LABEL;
const RISK_LABELS = ENV_RISK_LEVEL_LABEL;

const RISK_COLOURS: Record<EnvRiskLevel, string> = {
  low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};

const STATUS_LABELS  = ENV_ASSESSMENT_STATUS_LABEL;
const STATUS_COLOURS: Record<EnvAssessmentStatus, string> = {
  current: "bg-green-100 text-green-800", due_review: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800", archived: "bg-gray-100 text-gray-700",
};

/* ── flat row ────────────────────────────────────────────────────────── */

interface FlatRow {
  category: string; location: string; hazard: string; who_at_risk: string;
  risk_level: string; residual_risk: string; status: string;
  assessed_by: string; assessment_date: string; review_date: string;
  controls: string; incident_history: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Category",        accessor: (r: FlatRow) => r.category },
  { header: "Location",        accessor: (r: FlatRow) => r.location },
  { header: "Hazard",          accessor: (r: FlatRow) => r.hazard },
  { header: "Who at Risk",     accessor: (r: FlatRow) => r.who_at_risk },
  { header: "Risk Level",      accessor: (r: FlatRow) => r.risk_level },
  { header: "Residual Risk",   accessor: (r: FlatRow) => r.residual_risk },
  { header: "Status",          accessor: (r: FlatRow) => r.status },
  { header: "Assessed By",     accessor: (r: FlatRow) => r.assessed_by },
  { header: "Assessment Date", accessor: (r: FlatRow) => r.assessment_date },
  { header: "Review Date",     accessor: (r: FlatRow) => r.review_date },
  { header: "Controls",        accessor: (r: FlatRow) => r.controls },
  { header: "Incident History", accessor: (r: FlatRow) => r.incident_history },
  { header: "Notes",           accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function EnvironmentalRiskPage() {
  const { data: queryData, isLoading } = useEnvironmentalRisks();
  const data = queryData?.data ?? [];
  const createMutation = useCreateEnvironmentalRisk();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("risk");
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ── create-form state ── */
  const [formCategory, setFormCategory] = useState<string>("");
  const [formRiskLevel, setFormRiskLevel] = useState<string>("");
  const [formLocation, setFormLocation] = useState("");
  const [formHazard, setFormHazard] = useState("");
  const [formWhoAtRisk, setFormWhoAtRisk] = useState("");

  const resetForm = () => {
    setFormCategory("");
    setFormRiskLevel("");
    setFormLocation("");
    setFormHazard("");
    setFormWhoAtRisk("");
  };

  const handleCreate = () => {
    if (!formCategory || !formRiskLevel || !formLocation || !formHazard) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate(
      {
        category: formCategory as EnvRiskCategory,
        risk_level: formRiskLevel as EnvRiskLevel,
        location: formLocation,
        hazard: formHazard,
        who_at_risk: formWhoAtRisk.split(",").map((s) => s.trim()).filter(Boolean),
      },
      {
        onSuccess: () => {
          toast.success("Environmental risk assessment created");
          setDialogOpen(false);
          resetForm();
        },
        onError: () => toast.error("Failed to create assessment"),
      },
    );
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── loading state ── */
  if (isLoading) {
    return (
      <PageShell title="Environmental Risk Assessments" subtitle="Hazard identification, control measures and residual risk management across the home">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  const stats = (() => {
    const total = data.filter((r) => r.status !== "archived").length;
    const highCritical = data.filter((r) => ["high", "critical"].includes(r.risk_level) && r.status !== "archived").length;
    const controlled = data.filter((r) => r.residual_risk === "low" && r.status !== "archived").length;
    const reviewDue = data.filter((r) => ["due_review", "overdue"].includes(r.status)).length;
    return { total, highCritical, controlled, reviewDue };
  })();

  const filtered = (() => {
    let list = data;
    if (search) { const q = search.toLowerCase(); list = list.filter((r) => r.hazard.toLowerCase().includes(q) || r.location.toLowerCase().includes(q)); }
    if (filterRisk !== "all") list = list.filter((r) => r.risk_level === filterRisk);
    const out = [...list];
    switch (sortBy) {
      case "risk": { const o: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }; out.sort((a, b) => o[a.risk_level] - o[b.risk_level]); break; }
      case "review": out.sort((a, b) => a.review_date.localeCompare(b.review_date)); break;
      case "category": out.sort((a, b) => a.category.localeCompare(b.category)); break;
    }
    return out;
  })();

  const exportData: FlatRow[] = data.map((r) => ({
    category: CAT_LABELS[r.category], location: r.location, hazard: r.hazard,
    who_at_risk: r.who_at_risk.join(", "), risk_level: RISK_LABELS[r.risk_level],
    residual_risk: RISK_LABELS[r.residual_risk], status: STATUS_LABELS[r.status],
    assessed_by: getStaffName(r.assessed_by), assessment_date: r.assessment_date,
    review_date: r.review_date, controls: r.controls.map((c) => c.measure).join("; "),
    incident_history: r.incident_history, notes: r.notes,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const in14 = (() => { const dt = new Date(); dt.setDate(dt.getDate() + 14); return dt.toISOString().slice(0, 10); })();

  return (
    <PageShell
      title="Environmental Risk Assessments"
      subtitle="Hazard identification, control measures and residual risk management across the home"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Environmental Risk Assessments" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="environmental-risk" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Assessment
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Assessments", value: stats.total, icon: MapPin, colour: "text-blue-600" },
          { label: "High/Critical Risks", value: stats.highCritical, icon: AlertTriangle, colour: stats.highCritical > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Well Controlled", value: stats.controlled, icon: Shield, colour: "text-green-600" },
          { label: "Reviews Due", value: stats.reviewDue, icon: Clock, colour: stats.reviewDue > 0 ? "text-amber-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {stats.reviewDue > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Risk Assessments Due for Review</p>
            <p className="text-sm text-amber-700">{stats.reviewDue} assessment(s) are due or overdue for review. Environmental risk assessments must be reviewed regularly and after any incident.</p>
          </div>
        </div>
      )}

      <div id="risk-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search hazards or locations…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            {Object.entries(RISK_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="risk">Risk Level</SelectItem>
              <SelectItem value="review">Review Due</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(r.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{r.location}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", RISK_COLOURS[r.risk_level])}>Risk: {RISK_LABELS[r.risk_level]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", RISK_COLOURS[r.residual_risk])}>Residual: {RISK_LABELS[r.residual_risk]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{STATUS_LABELS[r.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{CAT_LABELS[r.category]} · {r.controls.length} controls · Review {r.review_date}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Hazard</h4>
                    <p className="text-sm">{r.hazard}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Who at risk:</span> <span className="font-medium">{r.who_at_risk.join(", ")}</span></div>
                    <div><span className="text-gray-500">Assessed by:</span> <span className="font-medium">{getStaffName(r.assessed_by)}</span></div>
                    <div><span className="text-gray-500">Date:</span> <span className="font-medium">{r.assessment_date}</span></div>
                    <div><span className="text-gray-500">Review:</span> <span className={cn("font-medium", r.review_date <= in14 ? "text-amber-600" : "")}>{r.review_date}</span></div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1"><span className={cn("px-2 py-1 rounded text-xs font-medium", RISK_COLOURS[r.risk_level])}>Initial: {RISK_LABELS[r.risk_level]}</span></div>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center gap-1"><span className={cn("px-2 py-1 rounded text-xs font-medium", RISK_COLOURS[r.residual_risk])}>Residual: {RISK_LABELS[r.residual_risk]}</span></div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Control Measures</h4>
                    {r.controls.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        {c.effective ? <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />}
                        <div>
                          <p className="text-sm">{c.measure}</p>
                          <p className="text-xs text-gray-400">{getStaffName(c.implemented_by)} · {c.date_implemented} · {c.effective ? "Effective" : "Needs review"}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {r.additional_actions.length > 0 && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Additional Actions Required</h4>
                      <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                        {r.additional_actions.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Incident History</h4>
                    <p className="text-sm">{r.incident_history}</p>
                  </div>

                  {r.notes && <div><h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4><p className="text-sm text-gray-700">{r.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Health &amp; Safety at Work Act / Reg 25:</strong> The registered person must ensure the premises are safe, well-maintained and appropriate. Environmental risk assessments must identify hazards, assess likelihood and severity, implement control measures, and calculate residual risk. Assessments must be reviewed regularly, after any incident, and when circumstances change (new admission, building work, seasonal changes).
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Environmental Risk Assessment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Category</label>
                <Select value={formCategory} onValueChange={setFormCategory}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Risk Level</label>
                <Select value={formRiskLevel} onValueChange={setFormRiskLevel}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(RISK_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Location</label><input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Main kitchen" /></div>
            <div><label className="text-sm font-medium">Hazard Description</label><textarea rows={2} value={formHazard} onChange={(e) => setFormHazard(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Describe the hazard…" /></div>
            <div><label className="text-sm font-medium">Who is at Risk?</label><input value={formWhoAtRisk} onChange={(e) => setFormWhoAtRisk(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Young people, Staff, Visitors" /></div>
          </div>
          <DialogFooter>
            <button onClick={() => { setDialogOpen(false); resetForm(); }} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating…" : "Create Assessment"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
