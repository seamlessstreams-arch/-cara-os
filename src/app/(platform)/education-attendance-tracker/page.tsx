"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, GraduationCap, CalendarCheck, UserX, Target,
  Loader2,
} from "lucide-react";
import { cn, daysFromNow } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { EduAttendanceRecord, EduProvision, EduSession, EduAttendanceCode } from "@/types/extended";
import { EDU_PROVISION_LABEL, EDU_SESSION_LABEL } from "@/types/extended";
import { useEduAttendanceRecords } from "@/hooks/use-edu-attendance-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const PROVISION_CLR: Record<EduProvision, string> = {
  school: "bg-blue-100 text-blue-800",
  college: "bg-indigo-100 text-indigo-800",
  pru: "bg-amber-100 text-amber-800",
  ap: "bg-purple-100 text-purple-800",
  eotas: "bg-orange-100 text-orange-800",
};

const CODE_CLR: Record<EduAttendanceCode, string> = {
  "/": "bg-green-100 text-green-800",
  "\\": "bg-green-100 text-green-800",
  "L": "bg-amber-100 text-amber-800",
  "I": "bg-blue-100 text-blue-800",
  "M": "bg-blue-100 text-blue-800",
  "E": "bg-purple-100 text-purple-800",
  "O": "bg-red-100 text-red-800",
  "U": "bg-red-100 text-red-800",
  "N": "bg-red-100 text-red-800",
};

const CODE_OPTIONS: { code: EduAttendanceCode; meaning: string }[] = [
  { code: "/", meaning: "Present (AM)" },
  { code: "\\", meaning: "Present (PM)" },
  { code: "L", meaning: "Late (before register closed)" },
  { code: "U", meaning: "Late after register closed (unauthorised)" },
  { code: "I", meaning: "Illness (authorised)" },
  { code: "M", meaning: "Medical/dental appointment" },
  { code: "E", meaning: "Excluded (no alternative provision)" },
  { code: "O", meaning: "Unauthorised absence (other)" },
  { code: "N", meaning: "Reason not yet provided" },
];

const BORDER_CODE: Record<EduAttendanceCode, string> = {
  "/": "border-l-green-500",
  "\\": "border-l-green-500",
  "L": "border-l-amber-500",
  "I": "border-l-blue-400",
  "M": "border-l-blue-400",
  "E": "border-l-purple-500",
  "O": "border-l-red-600",
  "U": "border-l-red-600",
  "N": "border-l-red-400",
};

const PRESENT_CODES: EduAttendanceCode[] = ["/", "\\", "L"];
const UNAUTH_CODES: EduAttendanceCode[] = ["O", "U", "N"];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function EducationAttendanceTrackerPage() {
  const { data: queryData, isLoading } = useEduAttendanceRecords();
  const data = queryData?.data ?? [];
  const [search, setSearch] = useState("");
  const [filterChild, setFilterChild] = useState("all");
  const [filterCode, setFilterCode] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r: EduAttendanceRecord) => {
      if (filterChild !== "all" && r.child_id !== filterChild) return false;
      if (filterCode !== "all" && r.attendance_code !== filterCode) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.code_meaning.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          EDU_PROVISION_LABEL[r.provision].toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "name-asc": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "code-asc": return a.attendance_code.localeCompare(b.attendance_code);
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterChild, filterCode, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const weekStart = daysFromNow(-7);
  const weekRecords = data.filter((r) => r.date >= weekStart);
  const weekPresent = weekRecords.filter((r) => PRESENT_CODES.includes(r.attendance_code)).length;
  const weekTotal = weekRecords.length || 1;
  const weekPct = Math.round((weekPresent / weekTotal) * 100);

  const weekUnauth = weekRecords.filter((r) => UNAUTH_CODES.includes(r.attendance_code)).length;

  // attendance % per child (overall in dataset)
  const ypIds = [...new Set(data.map(r => r.child_id))];
  const perChild = ypIds.map((id) => {
    const recs = data.filter((r) => r.child_id === id);
    const present = recs.filter((r) => PRESENT_CODES.includes(r.attendance_code)).length;
    const total = recs.length || 1;
    const pct = Math.round((present / total) * 100);
    return { id, pct, total: recs.length };
  });
  const meetingTarget = perChild.filter((c) => c.pct >= 95).length;

  const daysTracked = new Set(data.map((r) => r.date)).size;

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<EduAttendanceRecord>[] = [
    { header: "Date", accessor: (r: EduAttendanceRecord) => r.date },
    { header: "Young Person", accessor: (r: EduAttendanceRecord) => getYPName(r.child_id) },
    { header: "Provision", accessor: (r: EduAttendanceRecord) => EDU_PROVISION_LABEL[r.provision] },
    { header: "Session", accessor: (r: EduAttendanceRecord) => EDU_SESSION_LABEL[r.session] },
    { header: "Code", accessor: (r: EduAttendanceRecord) => r.attendance_code },
    { header: "Code Meaning", accessor: (r: EduAttendanceRecord) => r.code_meaning },
    { header: "Arrival", accessor: (r: EduAttendanceRecord) => r.arrival_time },
    { header: "Departure", accessor: (r: EduAttendanceRecord) => r.departure_time },
    { header: "Reason", accessor: (r: EduAttendanceRecord) => r.reason },
    { header: "Authorised", accessor: (r: EduAttendanceRecord) => r.authorised_absence ? "Yes" : "No" },
    { header: "Interventions", accessor: (r: EduAttendanceRecord) => r.interventions_used.join("; ") },
    { header: "Recorded By", accessor: (r: EduAttendanceRecord) => getStaffName(r.recorded_by) },
    { header: "Notes", accessor: (r: EduAttendanceRecord) => r.notes },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <PageShell title="Education Attendance Tracker" subtitle="Quality Standard 8 (Education) · Virtual School Oversight · Daily Attendance Monitoring">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Education Attendance Tracker"
      subtitle="Quality Standard 8 (Education) · Virtual School Oversight · Daily Attendance Monitoring"
      caraContext={{ pageTitle: "Education Attendance Tracker", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Education Attendance Tracker" />
          <ExportButton data={filtered} columns={exportCols} filename="education-attendance-tracker" />
          <CaraStudioQuickActionButton context={{ record_type: "education", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "This Week Attendance", value: `${weekPct}%`, icon: CalendarCheck, clr: "text-blue-600" },
            { label: "Unauthorised Absences (Week)", value: weekUnauth, icon: UserX, clr: "text-red-600" },
            { label: "Children Meeting 95%+ Target", value: `${meetingTarget}/${perChild.length}`, icon: Target, clr: "text-green-600" },
            { label: "Days Tracked", value: daysTracked, icon: GraduationCap, clr: "text-indigo-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── per-child attendance ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {perChild.map((c) => {
            const meets = c.pct >= 95;
            const concerning = c.pct < 90;
            return (
              <Card key={c.id} className={cn("border-l-4",
                meets ? "border-l-green-500" : concerning ? "border-l-red-500" : "border-l-amber-500")}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{getYPName(c.id)}</p>
                      <p className="text-xs text-muted-foreground">{c.total} session{c.total === 1 ? "" : "s"} recorded</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-2xl font-bold",
                        meets ? "text-green-600" : concerning ? "text-red-600" : "text-amber-600")}>
                        {c.pct}%
                      </p>
                      <Badge variant="outline" className={cn(
                        meets ? "bg-green-100 text-green-800"
                          : concerning ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800")}>
                        {meets ? "Meets target" : concerning ? "Below threshold" : "Concerning"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── alert banner ─────────────────────────────────────────────────── */}
        {weekUnauth > 0 && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">{weekUnauth} unauthorised absence(s) recorded this week</p>
              <p className="text-red-700">Each unauthorised absence (codes O, U, N) must be reported to the Virtual School and reviewed against the child&apos;s PEP. Consider whether the pattern indicates a need for an emergency PEP review or CME referral.</p>
            </div>
          </div>
        )}

        {meetingTarget === perChild.length && weekUnauth === 0 && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-3 mb-6 flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-green-800">All children currently meeting 95% attendance target</p>
              <p className="text-green-700">Continue daily monitoring and ensure PEP targets remain on track.</p>
            </div>
          </div>
        )}

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, reason, notes, provision..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterChild} onValueChange={setFilterChild}>
            <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => (
                <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCode} onValueChange={setFilterCode}>
            <SelectTrigger className="w-[220px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Attendance Codes</SelectItem>
              {CODE_OPTIONS.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code} — {c.meaning}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date (Newest First)</SelectItem>
              <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
              <SelectItem value="name-asc">Name A–Z</SelectItem>
              <SelectItem value="code-asc">Attendance Code</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            const isUnauth = UNAUTH_CODES.includes(r.attendance_code);
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_CODE[r.attendance_code])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)} — {r.date}
                        <Badge variant="outline" className={CODE_CLR[r.attendance_code]}>
                          {r.attendance_code} — {r.code_meaning}
                        </Badge>
                        <Badge variant="outline" className={PROVISION_CLR[r.provision]}>
                          {EDU_PROVISION_LABEL[r.provision]}
                        </Badge>
                        {isUnauth && (
                          <Badge variant="outline" className="bg-red-100 text-red-800">Unauthorised</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {EDU_SESSION_LABEL[r.session]}
                        {r.arrival_time && ` · Arrived ${r.arrival_time}`}
                        {r.departure_time && ` · Departed ${r.departure_time}`}
                        {" · Recorded by "}{getStaffName(r.recorded_by)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.authorised_absence && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">Authorised</Badge>
                      )}
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* session detail */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Session</p>
                        <p className="text-xs text-muted-foreground">{EDU_SESSION_LABEL[r.session]}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Provision</p>
                        <p className="text-xs text-muted-foreground">{EDU_PROVISION_LABEL[r.provision]}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Arrival</p>
                        <p className="text-xs text-muted-foreground">{r.arrival_time || "—"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Departure</p>
                        <p className="text-xs text-muted-foreground">{r.departure_time || "—"}</p>
                      </div>
                    </div>

                    {/* reason */}
                    {r.reason && (
                      <div className={cn(
                        "rounded-lg p-3",
                        isUnauth ? "bg-red-50" : r.authorised_absence ? "bg-blue-50" : "bg-amber-50"
                      )}>
                        <p className={cn(
                          "font-medium mb-1",
                          isUnauth ? "text-red-800" : r.authorised_absence ? "text-blue-800" : "text-amber-800"
                        )}>Reason</p>
                        <p className={cn(
                          "text-xs",
                          isUnauth ? "text-red-700" : r.authorised_absence ? "text-blue-700" : "text-amber-700"
                        )}>{r.reason}</p>
                      </div>
                    )}

                    {/* interventions */}
                    {r.interventions_used.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Interventions Used</p>
                        <ul className="list-disc list-inside space-y-1">
                          {r.interventions_used.map((i, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">{i}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* notes */}
                    {r.notes && (
                      <div>
                        <p className="font-medium mb-1">Notes</p>
                        <p className="text-muted-foreground">{r.notes}</p>
                      </div>
                    )}

                    {/* footer */}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Code: {r.attendance_code} ({r.code_meaning})</span>
                      <span>{r.authorised_absence ? "Authorised" : isUnauth ? "Unauthorised" : "Present"}</span>
                      <span>Recorded by {getStaffName(r.recorded_by)}</span>
                    </div>

                    {/* smart link panel */}
                    <SmartLinkPanel sourceType="edu_attendance" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Quality Standard 8 — the education standard requires the registered person to ensure each child has access to suitable educational provision and that their attendance and progress are actively monitored. Daily attendance must be recorded using the DfE statutory school attendance codes and shared with the Virtual School Head, who has statutory responsibility under the Children Act 2004 for monitoring the educational achievement of looked-after children. Unauthorised absences (codes O, U, N) and persistent absence (below 90%) trigger review of the Personal Education Plan (PEP). Sustained non-attendance must be reported to the Local Authority under the Children Missing Education (CME) duty (Education Act 1996, s.436A).</p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Education"
        category="education"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
