"use client";

import { useState, useMemo } from "react";
import {
  Eye, Search, ArrowUpDown,
  AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, MessageSquare, FileText,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useVisitorReports } from "@/hooks/use-visitor-reports";
import type { VisitorReport, VisitorRecommendation, VisitorChildView } from "@/types/extended";
import { VISITOR_VISIT_TYPE_LABEL } from "@/types/extended";

/* ── component ───────────────────────────────────────────────────────── */
export default function IndependentVisitorPage() {
  const { data: res, isLoading } = useVisitorReports();
  const reports: VisitorReport[] = res?.data ?? [];
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...reports];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.overall_findings.toLowerCase().includes(q) ||
          r.visitor_name.toLowerCase().includes(q) ||
          r.positive_observations.some((p) => p.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "type": return a.visit_type.localeCompare(b.visit_type);
        default: return 0;
      }
    });
    return list;
  }, [reports, search, sortBy]);

  const total = reports.length;
  const openRecs = reports.reduce((s, r) => s + r.recommendations.filter((rec: VisitorRecommendation) => rec.status === "open").length, 0);
  const lastVisit = reports.length > 0 ? [...reports].sort((a, b) => b.date.localeCompare(a.date))[0].date : "—";

  const exportCols: ExportColumn<VisitorReport>[] = [
    { header: "ID", accessor: (r: VisitorReport) => r.id },
    { header: "Date", accessor: (r: VisitorReport) => r.date },
    { header: "Visitor", accessor: (r: VisitorReport) => r.visitor_name },
    { header: "Type", accessor: (r: VisitorReport) => VISITOR_VISIT_TYPE_LABEL[r.visit_type] },
    { header: "Time", accessor: (r: VisitorReport) => `${r.arrival_time}–${r.departure_time}` },
    { header: "Areas Inspected", accessor: (r: VisitorReport) => r.areas_inspected.join(", ") },
    { header: "Children Spoken To", accessor: (r: VisitorReport) => r.child_views.filter((c: VisitorChildView) => c.spoken_to).length.toString() },
    { header: "Overall Findings", accessor: (r: VisitorReport) => r.overall_findings },
    { header: "Positive Observations", accessor: (r: VisitorReport) => r.positive_observations.join("; ") },
    { header: "Recommendations", accessor: (r: VisitorReport) => r.recommendations.map((rec: VisitorRecommendation) => `${rec.recommendation} (${rec.status})`).join("; ") },
    { header: "RM Response", accessor: (r: VisitorReport) => r.rm_response ?? "" },
    { header: "RM Response Date", accessor: (r: VisitorReport) => r.rm_response_date ?? "" },
  ];

  if (isLoading) return <PageShell title="Independent Visitor Reports" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Independent Visitor Reports"
      subtitle="Regulation 44 — monthly independent person's visits and reports"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Independent Visitor Reports" />
          <ExportButton data={filtered} columns={exportCols} filename="independent-visitor" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Visits", value: total, icon: Eye, colour: "text-blue-600" },
            { label: "Last Visit", value: lastVisit, icon: Clock, colour: "text-green-600" },
            { label: "Open Recommendations", value: openRecs, icon: AlertTriangle, colour: openRecs > 0 ? "text-orange-600" : "text-green-600" },
            { label: "Reports Received", value: reports.filter((r) => r.report_received).length, icon: FileText, colour: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search findings, observations…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="type">Visit Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((report) => {
            const isExpanded = expanded === report.id;
            const openCount = report.recommendations.filter((r: VisitorRecommendation) => r.status === "open").length;

            return (
              <div key={report.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : report.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Eye className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{report.date} — {report.visitor_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {VISITOR_VISIT_TYPE_LABEL[report.visit_type]} · {report.arrival_time}–{report.departure_time} · {report.recommendations.length} recommendation(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {openCount > 0 && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">{openCount} open</Badge>}
                    <Badge variant="outline" className="text-xs">{VISITOR_VISIT_TYPE_LABEL[report.visit_type]}</Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* areas inspected */}
                    <div className="flex flex-wrap gap-1">
                      {report.areas_inspected.map((area: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{area}</Badge>
                      ))}
                    </div>

                    {/* overall findings */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Overall Findings</p>
                      <p className="text-sm">{report.overall_findings}</p>
                    </div>

                    {/* children's views */}
                    <div>
                      <p className="text-sm font-medium mb-2">Children&apos;s Views</p>
                      <div className="space-y-2">
                        {report.child_views.map((cv: VisitorChildView, idx: number) => (
                          <div key={idx} className="rounded-lg border bg-pink-50 border-pink-200 p-3 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="h-3 w-3 text-pink-600" />
                              <span className="font-medium">{getYPName(cv.child_id)}</span>
                              {cv.private_conversation && <Badge variant="outline" className="text-[10px]">Private</Badge>}
                              {cv.concerns && <Badge variant="outline" className="text-[10px] border-red-300 text-red-700">Concerns</Badge>}
                            </div>
                            <p className="text-xs">{cv.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* positive observations */}
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-medium text-green-700 mb-2">Positive Observations</p>
                      <ul className="space-y-1">
                        {report.positive_observations.map((obs: string, i: number) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* recommendations */}
                    {report.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Recommendations</p>
                        <div className="space-y-2">
                          {report.recommendations.map((rec: VisitorRecommendation, idx: number) => (
                            <div key={idx} className={cn("rounded-lg border p-3 text-sm",
                              rec.status === "open" ? "bg-orange-50 border-orange-200" : "bg-white"
                            )}>
                              <div className="flex items-center gap-2 mb-1">
                                {rec.status === "actioned" ? <CheckCircle2 className="h-3 w-3 text-green-600" /> :
                                 rec.status === "noted" ? <CheckCircle2 className="h-3 w-3 text-blue-600" /> :
                                 <Clock className="h-3 w-3 text-orange-600" />}
                                <span className="font-medium">{rec.recommendation}</span>
                                <Badge variant="outline" className={cn("text-xs ml-auto",
                                  rec.priority === "high" ? "border-red-300 text-red-700" :
                                  rec.priority === "medium" ? "border-orange-300 text-orange-700" :
                                  "border-slate-300"
                                )}>{rec.priority}</Badge>
                              </div>
                              {rec.response && (
                                <div className="mt-1 pl-5">
                                  <p className="text-xs"><strong>Response:</strong> {rec.response}</p>
                                  {rec.response_date && <p className="text-xs text-muted-foreground">Responded: {rec.response_date}</p>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* RM response */}
                    {report.rm_response && (
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-medium text-blue-700 mb-1">RM Response ({report.rm_response_date})</p>
                        <p className="text-sm">{report.rm_response}</p>
                      </div>
                    )}

                    {/* staff on duty */}
                    <div className="text-sm text-muted-foreground">
                      Staff on duty: {report.staff_on_duty.map((s: string) => getStaffName(s)).join(", ")}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulation 44:</strong> An independent person must visit the home at least once a month.
          They must interview children (in private if requested), inspect the premises, and produce a
          written report. The registered person must respond to any recommendations and make the report
          available to Ofsted, the placing authority, and HMCI. At least one visit per year must be
          unannounced.
        </div>
      </div>
    </PageShell>
  );
}
