"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ChevronUp, ChevronDown, MapPin, AlertTriangle, Clock,
  CheckCircle2, MessageCircle, Shield, ArrowUpDown, Loader2,
} from "lucide-react";
import { useReturnInterviews } from "@/hooks/use-return-interviews";
import type { ReturnInterview, ReturnInterviewStatus, ReturnInterviewAction, ReturnInterviewActionStatus } from "@/types/extended";
import { RETURN_INTERVIEW_STATUS_LABEL, RETURN_INTERVIEW_ACTION_STATUS_LABEL } from "@/types/extended";

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STATUS_CLR: Record<ReturnInterviewStatus, string> = {
  completed: "bg-green-100 text-green-800",
  offered_declined: "bg-amber-100 text-amber-800",
  pending: "bg-blue-100 text-blue-800",
  not_yet_due: "bg-gray-100 text-gray-800",
};

const ACTION_CLR: Record<ReturnInterviewActionStatus, string> = {
  completed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  pending: "bg-gray-100 text-gray-800",
};

export default function MissingReturnInterviewsPage() {
  const { data: res, isLoading } = useReturnInterviews();
  const interviews: ReturnInterview[] = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = useMemo(() => {
    let list = [...interviews];
    if (filterYP !== "all") list = list.filter((r) => r.child_id === filterYP);
    if (filterStatus !== "all") list = list.filter((r) => r.interview_status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.missing_episode_date.localeCompare(a.missing_episode_date);
        case "name": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "status": return a.interview_status.localeCompare(b.interview_status);
        default: return 0;
      }
    });
    return list;
  }, [interviews, filterYP, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const total = interviews.length;
    const completed = interviews.filter((r) => r.interview_status === "completed").length;
    const declined = interviews.filter((r) => r.interview_status === "offered_declined").length;
    const exploitationFlags = interviews.filter((r) => r.exploitation_concerns).length;
    const within72h = interviews.filter((r) => {
      if (!r.interview_date) return false;
      const ret = new Date(r.return_date).getTime();
      const inter = new Date(r.interview_date).getTime();
      return (inter - ret) <= 72 * 60 * 60 * 1000;
    }).length;
    return { total, completed, declined, exploitationFlags, within72h };
  }, [interviews]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const exportCols: ExportColumn<ReturnInterview>[] = [
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Missing Date", accessor: (r) => r.missing_episode_date },
    { header: "Return Date", accessor: (r) => r.return_date },
    { header: "Interview Date", accessor: (r) => r.interview_date ?? "N/A" },
    { header: "Interviewed By", accessor: (r) => getStaffName(r.interviewed_by) },
    { header: "Status", accessor: (r) => RETURN_INTERVIEW_STATUS_LABEL[r.interview_status] },
    { header: "Independent", accessor: (r) => r.independent_of_home ? "Yes" : "No" },
    { header: "Exploitation Concerns", accessor: (r) => r.exploitation_concerns ? "Yes" : "No" },
    { header: "Push Factors", accessor: (r) => r.push_factors.join("; ") },
    { header: "Pull Factors", accessor: (r) => r.pull_factors.join("; ") },
    { header: "Actions", accessor: (r) => String(r.actions_agreed.length) },
  ];

  if (isLoading) return <PageShell title="Missing — Return Home Interviews" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Missing — Return Home Interviews"
      subtitle="Statutory interviews within 72 hours of return from missing episodes"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={interviews} columns={exportCols} filename="return-interviews" />
          <PrintButton title="Missing — Return Home Interviews" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Episodes</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-green-700">{stats.completed}</p><p className="text-xs text-muted-foreground">Interviews Done</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-amber-700">{stats.declined}</p><p className="text-xs text-muted-foreground">Declined</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-blue-700">{stats.within72h}</p><p className="text-xs text-muted-foreground">Within 72hrs</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><p className={cn("text-2xl font-bold", stats.exploitationFlags > 0 ? "text-red-700" : "text-green-700")}>{stats.exploitationFlags}</p><p className="text-xs text-muted-foreground">Exploitation Flags</p></CardContent></Card>
      </div>

      {stats.exploitationFlags > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Exploitation Concerns Identified</p>
              <p className="text-xs text-red-700 mt-1">
                {interviews.filter((r) => r.exploitation_concerns).map((r) => `${getYPName(r.child_id)} (${r.missing_episode_date})`).join("; ")} — multi-agency response active.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select className="border rounded-md px-3 py-1.5 text-sm" value={filterYP} onChange={(e) => setFilterYP(e.target.value)}>
          <option value="all">All Young People</option>
          <option value="yp_alex">{getYPName("yp_alex")}</option>
          <option value="yp_jordan">{getYPName("yp_jordan")}</option>
          <option value="yp_casey">{getYPName("yp_casey")}</option>
        </select>
        <select className="border rounded-md px-3 py-1.5 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {(Object.keys(RETURN_INTERVIEW_STATUS_LABEL) as ReturnInterviewStatus[]).map((k) => (
            <option key={k} value={k}>{RETURN_INTERVIEW_STATUS_LABEL[k]}</option>
          ))}
        </select>
        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select className="border rounded-md px-3 py-1.5 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Most Recent</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((interview) => {
          const expanded = expandedId === interview.id;
          return (
            <Card key={interview.id} className={cn("overflow-hidden", interview.exploitation_concerns && "border-red-200")}>
              <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors py-4" onClick={() => toggle(interview.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", interview.exploitation_concerns ? "bg-red-100" : interview.interview_status === "completed" ? "bg-green-100" : "bg-amber-100")}>
                      <MapPin className={cn("h-5 w-5", interview.exploitation_concerns ? "text-red-600" : interview.interview_status === "completed" ? "text-green-600" : "text-amber-600")} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{getYPName(interview.child_id)} — {interview.missing_episode_date}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={STATUS_CLR[interview.interview_status]}>{RETURN_INTERVIEW_STATUS_LABEL[interview.interview_status]}</Badge>
                        {interview.exploitation_concerns && <Badge className="bg-red-100 text-red-800">Exploitation Concern</Badge>}
                        {interview.independent_of_home && <Badge variant="outline" className="text-xs">Independent</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Interviewer</p>
                      <p className="text-sm">{getStaffName(interview.interviewed_by)}</p>
                    </div>
                    {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {interview.declined_reason && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                      <p className="text-sm font-medium text-amber-800">Reason Declined</p>
                      <p className="text-sm text-amber-700 mt-1">{interview.declined_reason}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Where They Went</p>
                      <p className="text-sm">{interview.where_went}</p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Who With</p>
                      <p className="text-sm">{interview.who_with}</p>
                    </div>
                  </div>

                  {interview.duration && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" /> Duration: {interview.duration}</span>
                      <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" /> Location: {interview.location}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Push Factors (away from home)</p>
                      <ul className="space-y-1">{interview.push_factors.map((f, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-red-400 mt-1.5">•</span> {f}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-1"><MapPin className="h-4 w-4" /> Pull Factors (toward destination)</p>
                      <ul className="space-y-1">{interview.pull_factors.map((f, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-blue-400 mt-1.5">•</span> {f}</li>)}</ul>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1"><Shield className="h-4 w-4 text-orange-600" /> Risks Identified</p>
                    <ul className="space-y-1">{interview.risks_identified.map((r, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-orange-400 mt-1.5">•</span> {r}</li>)}</ul>
                  </div>

                  {interview.exploitation_concerns && interview.exploitation_details && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 flex items-center gap-1"><Shield className="h-4 w-4" /> Exploitation Concerns</p>
                      <p className="text-sm text-red-700 mt-1">{interview.exploitation_details}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 flex items-center gap-1"><MessageCircle className="h-4 w-4" /> Child&apos;s View on Safety</p>
                    <p className="text-sm text-blue-700 mt-1">{interview.child_view_on_safety}</p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> What Would Help</p>
                    <p className="text-sm text-green-700 mt-1">{interview.what_would_help}</p>
                  </div>

                  {interview.actions_agreed.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Actions Agreed</p>
                      <div className="space-y-2">
                        {interview.actions_agreed.map((act: ReturnInterviewAction, i: number) => (
                          <div key={i} className="border rounded-md p-2 flex items-center justify-between">
                            <div>
                              <p className="text-sm">{act.action}</p>
                              <p className="text-xs text-muted-foreground">{getStaffName(act.owner)} · by {act.deadline}</p>
                            </div>
                            <Badge className={cn("text-xs", ACTION_CLR[act.status])}>{RETURN_INTERVIEW_ACTION_STATUS_LABEL[act.status]}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Shared With</p>
                    <div className="flex flex-wrap gap-1">{interview.shared_with.map((s: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}</div>
                  </div>

                  <div className="bg-muted/30 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{interview.notes}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div><p className="text-xs text-muted-foreground">Missing</p><p className="text-sm font-medium">{interview.missing_episode_date}</p></div>
                    <div><p className="text-xs text-muted-foreground">Returned</p><p className="text-sm font-medium">{interview.return_date}</p></div>
                    <div><p className="text-xs text-muted-foreground">Interview</p><p className="text-sm font-medium">{interview.interview_date ?? "N/A"}</p></div>
                  </div>

                  <SmartLinkPanel sourceType="missing-return-interviews" sourceId={interview.id} childId={interview.child_id} compact />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          Statutory guidance on children who run away or go missing from home or care (2014) requires
          that all children are offered an independent return home interview within 72 hours of their
          return. Regulation 34 of the Children&apos;s Homes Regulations 2015 requires the registered
          person to take steps to locate missing children and report to appropriate persons.
        </p>
      </div>
    </PageShell>
  );
}
