"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { useCaseFileAudits } from "@/hooks/use-case-file-audits";
import type { CaseFileAudit } from "@/types/extended";
import {
  CASE_FILE_AUDIT_TYPE_LABEL,
  CASE_FILE_ACTION_STATUS_LABEL,
  RAG_RATING_LABEL,
} from "@/types/extended";
import type { RagRating, CaseFileActionStatus } from "@/types/extended";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Gauge,
  ClipboardList,
  ListChecks,
  CalendarClock,
  MessageCircle,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const ragClasses = (r: RagRating) => {
  switch (r) {
    case "green": return "bg-green-100 text-green-800 border-green-200";
    case "amber": return "bg-amber-100 text-amber-800 border-amber-200";
    case "red": return "bg-red-100 text-red-800 border-red-200";
  }
};

const ragDot = (r: RagRating) =>
  cn(
    "h-2.5 w-2.5 rounded-full inline-block",
    r === "green" && "bg-green-500",
    r === "amber" && "bg-amber-500",
    r === "red" && "bg-red-500"
  );

const actionStatusBadge = (s: CaseFileActionStatus) => {
  switch (s) {
    case "open": return <Badge variant="outline">Open</Badge>;
    case "in_progress": return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
    case "complete": return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
    case "overdue": return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
  }
};

const exportCols: ExportColumn<CaseFileAudit>[] = [
  { header: "Audit ID", accessor: (r) => r.id },
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Audit Date", accessor: (r) => r.audit_date },
  { header: "Auditor", accessor: (r) => getStaffName(r.auditor) },
  { header: "Audit Type", accessor: (r) => CASE_FILE_AUDIT_TYPE_LABEL[r.audit_type] },
  { header: "Overall RAG", accessor: (r) => RAG_RATING_LABEL[r.overall_rag_rating] },
  { header: "Overall Score", accessor: (r) => r.overall_score.toFixed(1) },
  { header: "Sections Audited", accessor: (r) => r.sections_audited.length.toString() },
  { header: "Strengths", accessor: (r) => r.strengths_identified.join("; ") },
  { header: "Gaps", accessor: (r) => r.gaps_identified.join("; ") },
  { header: "Priority Actions Open", accessor: (r) => r.priority_actions.filter((a) => a.status !== "complete").length.toString() },
  { header: "Child Contributed", accessor: (r) => (r.child_contributed_to_audit ? "Yes" : "No") },
  { header: "Next Audit Due", accessor: (r) => r.next_audit_due },
];

export default function CaseFileAuditPage() {
  const { data: res, isLoading } = useCaseFileAudits();
  const data = useMemo(() => res?.data ?? [], [res]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterRag, setFilterRag] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  if (isLoading) {
    return (
      <PageShell title="Case File Audit" subtitle="Quality audits of individual children's case files — Quality Standard 13 & Reg 36">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const filtered = (() => {
    let list = [...data];
    if (filterRag !== "all") list = list.filter((r) => r.overall_rag_rating === filterRag);
    if (filterType !== "all") list = list.filter((r) => r.audit_type === filterType);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.audit_date.localeCompare(a.audit_date);
        case "score": return a.overall_score - b.overall_score;
        case "rag": {
          const order: Record<string, number> = { red: 0, amber: 1, green: 2 };
          return (order[a.overall_rag_rating] ?? 0) - (order[b.overall_rag_rating] ?? 0);
        }
        case "name": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "due": return a.next_audit_due.localeCompare(b.next_audit_due);
        default: return 0;
      }
    });
    return list;
  })();

  const stats = (() => {
    const avg = data.reduce((s, a) => s + a.overall_score, 0) / (data.length || 1);
    const green = data.filter((a) => a.overall_rag_rating === "green").length;
    const amberRed = data.filter((a) => a.overall_rag_rating === "amber" || a.overall_rag_rating === "red").length;
    const openActions = data.reduce((s, a) => s + (a.priority_actions ?? []).filter((p) => p.status !== "complete").length, 0);
    return { avg: avg.toFixed(1), green, amberRed, openActions };
  })();

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);
  const filesNeedingAttention = data.filter((a) => a.overall_rag_rating === "red" || a.overall_rag_rating === "amber");

  return (
    <PageShell
      title="Case File Audit"
      subtitle="Quality audits of individual children's case files — Quality Standard 13 & Reg 36"
      caraContext={{ pageTitle: "Case File Audit", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="case-file-audits" />
          <PrintButton title="Case File Audit" />
          <CaraStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.avg}</p>
              <span className="text-sm text-muted-foreground">/ 5</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avg overall score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.green}</p>
            <p className="text-xs text-muted-foreground">Green-rated files</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.amberRed}</p>
            <p className="text-xs text-muted-foreground">Amber / Red files</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.openActions}</p>
            <p className="text-xs text-muted-foreground">Priority actions open</p>
          </CardContent>
        </Card>
      </div>

      {filesNeedingAttention.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Files requiring immediate attention</p>
              <ul className="text-xs text-red-700 mt-1 space-y-0.5">
                {filesNeedingAttention.map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <span className={ragDot(a.overall_rag_rating)} />
                    <span className="font-medium">{getYPName(a.child_id)}</span>
                    <span className="text-red-600">
                      — {RAG_RATING_LABEL[a.overall_rag_rating]} rating ({a.overall_score.toFixed(1)}/5), {(a.priority_actions ?? []).filter((p) => p.status !== "complete").length} open action(s)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterRag} onValueChange={setFilterRag}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="RAG Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All RAG Ratings</SelectItem>
            <SelectItem value="green">Green</SelectItem>
            <SelectItem value="amber">Amber</SelectItem>
            <SelectItem value="red">Red</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Audit Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Audit Types</SelectItem>
            {(Object.keys(CASE_FILE_AUDIT_TYPE_LABEL) as Array<keyof typeof CASE_FILE_AUDIT_TYPE_LABEL>).map((k) => (
              <SelectItem key={k} value={k}>{CASE_FILE_AUDIT_TYPE_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Audit Date</SelectItem>
              <SelectItem value="score">Score (low first)</SelectItem>
              <SelectItem value="rag">RAG (Red first)</SelectItem>
              <SelectItem value="name">Young Person</SelectItem>
              <SelectItem value="due">Next Audit Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((audit) => {
          const isExpanded = expandedId === audit.id;
          const openActions = audit.priority_actions.filter((a) => a.status !== "complete").length;

          return (
            <Card key={audit.id} className="overflow-hidden">
              <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors py-4" onClick={() => toggle(audit.id)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("p-2 rounded-full shrink-0", audit.overall_rag_rating === "green" && "bg-green-100", audit.overall_rag_rating === "amber" && "bg-amber-100", audit.overall_rag_rating === "red" && "bg-red-100")}>
                      <FileSearch className={cn("h-5 w-5", audit.overall_rag_rating === "green" && "text-green-600", audit.overall_rag_rating === "amber" && "text-amber-600", audit.overall_rag_rating === "red" && "text-red-600")} />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{getYPName(audit.child_id)}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge className={cn("border", ragClasses(audit.overall_rag_rating))}>{RAG_RATING_LABEL[audit.overall_rag_rating]}</Badge>
                        <Badge variant="outline">{CASE_FILE_AUDIT_TYPE_LABEL[audit.audit_type]}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{audit.audit_date}</span>
                        <span className="text-xs text-muted-foreground">Auditor: {getStaffName(audit.auditor)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-semibold tabular-nums">{audit.overall_score.toFixed(1)}<span className="text-xs text-muted-foreground"> / 5</span></div>
                      <div className="text-[11px] text-muted-foreground">{openActions} open action{openActions === 1 ? "" : "s"}</div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 pb-5 space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" />Sections Audited</p>
                    <div className="space-y-2">
                      {audit.sections_audited.map((s, idx) => (
                        <div key={idx} className="rounded-md border p-3 bg-muted/20">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={ragDot(s.rag_rating)} />
                              <span className="text-sm font-medium truncate">{s.section}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={cn("border", ragClasses(s.rag_rating))}>{RAG_RATING_LABEL[s.rag_rating]}</Badge>
                              <span className="text-xs font-semibold tabular-nums">{s.score}/5</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">{s.findings}</p>
                          {(s.required_actions?.length ?? 0) > 0 && (
                            <ul className="text-xs mt-2 list-disc pl-4 space-y-0.5">{(s.required_actions ?? []).map((a, i) => (<li key={i}>{a}</li>))}</ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />Strengths Identified</p>
                      <ul className="text-sm list-disc pl-4 space-y-1">{audit.strengths_identified.map((str, i) => (<li key={i}>{str}</li>))}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-600" />Gaps Identified</p>
                      {audit.gaps_identified.length > 0 ? (
                        <ul className="text-sm list-disc pl-4 space-y-1">{audit.gaps_identified.map((g, i) => (<li key={i}>{g}</li>))}</ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No gaps identified.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5" />Priority Actions</p>
                    {audit.priority_actions.length > 0 ? (
                      <div className="space-y-2">
                        {audit.priority_actions.map((p, i) => (
                          <div key={i} className="flex flex-wrap items-center justify-between gap-2 border rounded-md p-2.5">
                            <div className="min-w-0">
                              <p className="text-sm">{p.action}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">Owner: {getStaffName(p.owner)} • Deadline: {p.deadline}</p>
                            </div>
                            {actionStatusBadge(p.status)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No priority actions arising from this audit.</p>
                    )}
                  </div>

                  <div className="rounded-md border p-3 bg-blue-50/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-800 mb-1 flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Child Contributed to Audit: {audit.child_contributed_to_audit ? "Yes" : "No"}
                    </p>
                    <p className="text-sm text-blue-900/80 italic">{audit.child_observation}</p>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Next audit due: {audit.next_audit_due}
                  </div>

                  <SmartLinkPanel sourceType="case-file-audits" sourceId={audit.id} childId={audit.child_id} compact />
                </CardContent>
              )}
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10 border rounded-md">No audits match the current filters.</div>
        )}
      </div>

      <div className="mt-8 rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">Regulatory basis</p>
        <p>Quality Standard 13 (the leadership and management standard) requires the registered manager to lead and manage the home effectively, including the quality assurance of records and care planning for each child.</p>
        <p>Regulation 36 (records about children) requires accurate, current and retained case file records. Routine case file audits provide evidence that children&apos;s records meet these standards and that gaps generate timely action.</p>
      </div>
      <CareEventsPanel
        title="Care Events — Audit & Compliance"
        category="general"
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Case File Audit — compliance audit of individual child records, documentation gaps, care plan currency, review dates, missing consents, Reg 45 evidence, Annex A readiness"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
