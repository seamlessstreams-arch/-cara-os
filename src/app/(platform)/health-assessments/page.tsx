"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Plus,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Heart,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { HealthAssessment, HealthAssessmentType, HealthAssessmentStatus, SdqScores, SdqBand, HealthFollowUp, HealthNeed } from "@/types/extended";
import { HEALTH_ASSESSMENT_TYPE_LABEL, HEALTH_ASSESSMENT_STATUS_LABEL, SDQ_BAND_LABEL, HEALTH_FOLLOW_UP_STATUS_LABEL } from "@/types/extended";
import { useHealthAssessments, useCreateHealthAssessment } from "@/hooks/use-health-assessments";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── constants ─────────────────────────────────────────────────────────── */

const STATUS_META: Record<HealthAssessmentStatus, { label: string; colour: string }> = {
  completed: { label: "Completed",  colour: "bg-green-100 text-green-700" },
  scheduled: { label: "Scheduled",  colour: "bg-blue-100 text-blue-700" },
  overdue:   { label: "Overdue",    colour: "bg-red-100 text-red-700" },
  referred:  { label: "Referred",   colour: "bg-amber-100 text-amber-700" },
};

const SDQ_BAND_COLOUR: Record<SdqBand, string> = {
  normal: "bg-green-100 text-green-700", borderline: "bg-amber-100 text-amber-700", abnormal: "bg-red-100 text-red-700",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function HealthAssessmentsPage() {
  const { data: res, isLoading } = useHealthAssessments();
  const data = res?.data ?? [];
  const createMutation = useCreateHealthAssessment();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  const [draft, setDraft] = useState<Partial<HealthAssessment>>({});

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => ({
    total: data.length,
    completed: data.filter((a) => a.status === "completed").length,
    overdue: data.filter((a) => a.status === "overdue").length,
    pendingActions: data.flatMap((a) => a.follow_ups).filter((f) => f.status === "pending" || f.status === "overdue").length,
    avgSDQ: (() => {
      const scores = data.filter((a) => a.sdq_scores).map((a) => a.sdq_scores!.total);
      return scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
    })(),
  }), [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterType !== "all") list = list.filter((a) => a.type === filterType);
    if (filterYP !== "all") list = list.filter((a) => a.child_id === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.conducted_by.toLowerCase().includes(q) || (a.key_findings ?? []).join(" ").toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "type": return HEALTH_ASSESSMENT_TYPE_LABEL[a.type].localeCompare(HEALTH_ASSESSMENT_TYPE_LABEL[b.type]);
        case "yp":   return a.child_id.localeCompare(b.child_id);
        case "next": return a.next_due.localeCompare(b.next_due);
        default:     return b.date.localeCompare(a.date);
      }
    });
    return list;
  }, [data, filterType, filterYP, search, sortBy]);

  const exportData = useMemo(() => data.map((a) => ({
    youngPerson: getYPName(a.child_id),
    type: HEALTH_ASSESSMENT_TYPE_LABEL[a.type],
    status: STATUS_META[a.status].label,
    date: a.date,
    nextDue: a.next_due,
    conductedBy: a.conducted_by,
    location: a.location,
    keyFindings: (a.key_findings ?? []).join("; "),
    recommendations: (a.recommendations ?? []).join("; "),
    sdqTotal: a.sdq_scores ? String(a.sdq_scores.total) : "N/A",
    sdqBand: a.sdq_scores ? SDQ_BAND_LABEL[a.sdq_scores.band] : "N/A",
    healthNeeds: a.health_needs.map((h) => `${h.need}: ${h.how_met}`).join("; "),
    childView: a.child_view,
    notes: a.notes,
  })), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",   accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Type",           accessor: (r: typeof exportData[number]) => r.type },
    { header: "Status",         accessor: (r: typeof exportData[number]) => r.status },
    { header: "Date",           accessor: (r: typeof exportData[number]) => r.date },
    { header: "Next Due",       accessor: (r: typeof exportData[number]) => r.nextDue },
    { header: "Conducted By",   accessor: (r: typeof exportData[number]) => r.conductedBy },
    { header: "Location",       accessor: (r: typeof exportData[number]) => r.location },
    { header: "Key Findings",   accessor: (r: typeof exportData[number]) => r.keyFindings },
    { header: "Recommendations",accessor: (r: typeof exportData[number]) => r.recommendations },
    { header: "SDQ Total",      accessor: (r: typeof exportData[number]) => r.sdqTotal },
    { header: "SDQ Band",       accessor: (r: typeof exportData[number]) => r.sdqBand },
    { header: "Health Needs",   accessor: (r: typeof exportData[number]) => r.healthNeeds },
    { header: "Child View",     accessor: (r: typeof exportData[number]) => r.childView },
    { header: "Notes",          accessor: (r: typeof exportData[number]) => r.notes },
  ];

  const ypIds = [...new Set(data.map((a) => a.child_id))];

  const handleCreate = () => {
    createMutation.mutate(draft, {
      onSuccess: () => {
        setShowDialog(false);
        setDraft({});
        toast.success("Health assessment logged");
      },
    });
  };

  if (isLoading) return <PageShell title="Health Assessments" subtitle="LAC health assessments — IHA, RHA, dental, optician and SDQ tracking"><div className="p-8 text-center text-muted-foreground">Loading health assessments…</div></PageShell>;

  return (
    <PageShell
      title="Health Assessments"
      subtitle="LAC health assessments — IHA, RHA, dental, optician and SDQ tracking"
      caraContext={{ pageTitle: "Health Assessments", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="health-assessments" />
          <PrintButton title="Health Assessments" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> Log Assessment
          </button>
          <CaraStudioQuickActionButton context={{ record_type: "health", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total",           v: stats.total, icon: Stethoscope, c: "text-blue-600" },
            { l: "Completed",       v: stats.completed, icon: CheckCircle2, c: "text-green-600" },
            { l: "Overdue",         v: stats.overdue, icon: AlertTriangle, c: stats.overdue > 0 ? "text-red-600" : "text-gray-400" },
            { l: "Pending Actions", v: stats.pendingActions, icon: Clock, c: stats.pendingActions > 0 ? "text-amber-600" : "text-gray-400" },
            { l: "Avg SDQ",         v: stats.avgSDQ, icon: Heart, c: stats.avgSDQ > 17 ? "text-red-600" : "text-green-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {stats.overdue > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800"><strong>{stats.overdue} assessment{stats.overdue > 1 ? "s" : ""}</strong> overdue — book immediately.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assessments…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[190px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(HEALTH_ASSESSMENT_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="date">Date</option>
              <option value="type">Type</option>
              <option value="yp">Young Person</option>
              <option value="next">Next Due</option>
            </select>
          </div>
        </div>

        {filtered.map((assessment) => (
          <div key={assessment.id} className={cn("rounded-lg border bg-white overflow-hidden", assessment.status === "overdue" ? "border-l-4 border-l-red-400" : "")}>
            <button onClick={() => setExpanded(expanded === assessment.id ? null : assessment.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Stethoscope className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{getYPName(assessment.child_id)}</h3>
                    <span className="text-sm text-muted-foreground">— {HEALTH_ASSESSMENT_TYPE_LABEL[assessment.type]}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[assessment.status].colour)}>{STATUS_META[assessment.status].label}</span>
                    {assessment.sdq_scores && <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SDQ_BAND_COLOUR[assessment.sdq_scores.band])}>SDQ: {assessment.sdq_scores.total} ({SDQ_BAND_LABEL[assessment.sdq_scores.band]})</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{assessment.date} · {assessment.conducted_by} · Next due: {assessment.next_due}</p>
                </div>
              </div>
              {expanded === assessment.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === assessment.id && (
              <div className="border-t p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Location:</span> {assessment.location}</div>
                  <div><span className="text-muted-foreground">Conducted By:</span> {assessment.conducted_by}</div>
                  <div><span className="text-muted-foreground">Next Due:</span> <span className={assessment.next_due < today ? "text-red-600 font-medium" : ""}>{assessment.next_due}</span></div>
                  <div><span className="text-muted-foreground">Consent:</span> {assessment.consent.slice(0, 40)}…</div>
                </div>

                {assessment.sdq_scores && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="text-sm font-semibold mb-2">SDQ Scores</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {[
                        { l: "Emotional", v: assessment.sdq_scores.emotional },
                        { l: "Conduct", v: assessment.sdq_scores.conduct },
                        { l: "Hyperactivity", v: assessment.sdq_scores.hyperactivity },
                        { l: "Peer", v: assessment.sdq_scores.peer },
                        { l: "Prosocial", v: assessment.sdq_scores.prosocial },
                        { l: "Total", v: assessment.sdq_scores.total },
                      ].map((s) => (
                        <div key={s.l} className="text-center">
                          <p className="text-lg font-bold">{s.v}</p>
                          <p className="text-xs text-muted-foreground">{s.l}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-2">Band: <span className={cn("rounded-full px-2 py-0.5 font-medium", SDQ_BAND_COLOUR[assessment.sdq_scores.band])}>{SDQ_BAND_LABEL[assessment.sdq_scores.band]}</span></p>
                  </div>
                )}

                <div className="rounded-lg bg-blue-50 p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Key Findings</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-900">{assessment.key_findings.map((f, i) => <li key={i}>{f}</li>)}</ul>
                </div>

                <div className="rounded-lg bg-green-50 p-3">
                  <h4 className="text-sm font-semibold text-green-800 mb-1">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-green-900">{assessment.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>

                {assessment.health_needs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Health Needs</h4>
                    <div className="space-y-2">
                      {assessment.health_needs.map((h: HealthNeed, i: number) => (
                        <div key={i} className="rounded border p-2">
                          <p className="text-sm font-medium">{h.need}</p>
                          <p className="text-xs text-muted-foreground">{h.how_met}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assessment.follow_ups.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Follow-Up Actions</h4>
                    <div className="space-y-1">
                      {assessment.follow_ups.map((f: HealthFollowUp, i: number) => (
                        <div key={i} className="flex items-center justify-between rounded border p-2">
                          <div>
                            <p className="text-sm">{f.action}</p>
                            <p className="text-xs text-muted-foreground">{f.owner} · Due {f.due_date}</p>
                          </div>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                            f.status === "completed" ? "bg-green-100 text-green-700" :
                            f.status === "overdue" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          )}>{HEALTH_FOLLOW_UP_STATUS_LABEL[f.status]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                  <h4 className="text-sm font-semibold text-pink-800 mb-1">Child&apos;s View</h4>
                  <p className="text-sm text-pink-900">{assessment.child_view}</p>
                </div>

                {assessment.notes && (
                  <div className="rounded-lg bg-gray-50 border p-3">
                    <h4 className="text-sm font-semibold mb-1">Notes</h4>
                    <p className="text-sm text-muted-foreground">{assessment.notes}</p>
                  </div>
                )}

                <SmartLinkPanel sourceType="health-assessments" sourceId={assessment.id} childId={assessment.child_id} compact />
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Promoting the Health of Looked After Children (2015) / Reg 10</strong> — Every looked-after child must receive an Initial Health Assessment within 20 working days of becoming looked after, and Review Health Assessments annually (6-monthly for under-5s). The SDQ must be completed alongside health assessments to monitor emotional wellbeing.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Health Assessment</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm" value={draft.child_id ?? ""} onChange={(e) => setDraft({ ...draft, child_id: e.target.value })}><option value="">Young Person…</option>{ypIds.map((id) => <option key={id} value={id}>{getYPName(id)}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm" value={draft.type ?? ""} onChange={(e) => setDraft({ ...draft, type: e.target.value as HealthAssessmentType })}><option value="">Assessment type…</option>{Object.entries(HEALTH_ASSESSMENT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input type="date" className="rounded border px-3 py-2 text-sm" value={draft.date ?? ""} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            <input placeholder="Conducted by" className="rounded border px-3 py-2 text-sm" value={draft.conducted_by ?? ""} onChange={(e) => setDraft({ ...draft, conducted_by: e.target.value })} />
            <input placeholder="Location" className="rounded border px-3 py-2 text-sm" value={draft.location ?? ""} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            <textarea placeholder="Key findings (one per line)" rows={3} className="rounded border px-3 py-2 text-sm" value={(draft.key_findings ?? []).join("\n")} onChange={(e) => setDraft({ ...draft, key_findings: e.target.value.split("\n").filter(Boolean) })} />
            <textarea placeholder="Recommendations (one per line)" rows={2} className="rounded border px-3 py-2 text-sm" value={(draft.recommendations ?? []).join("\n")} onChange={(e) => setDraft({ ...draft, recommendations: e.target.value.split("\n").filter(Boolean) })} />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={handleCreate} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Log Assessment</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Health"
        category="health"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
