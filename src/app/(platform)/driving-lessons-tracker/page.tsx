"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Car, BookOpen, CheckCircle, ChevronUp, ChevronDown, ArrowUpDown, Search, Award, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type { DrivingRecord, DrivingStage, DrivingFundingSource, DrivingTheoryAttempt, DrivingPracticalAttempt } from "@/types/extended";
import { DRIVING_STAGE_LABEL, DRIVING_FUNDING_SOURCE_LABEL } from "@/types/extended";
import { useDrivingRecords } from "@/hooks/use-driving-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const STAGE_CLR: Record<DrivingStage, string> = {
  awaiting_17th_birthday: "bg-gray-100 text-gray-800",
  provisional_applied: "bg-sky-100 text-sky-800",
  provisional_held: "bg-sky-100 text-sky-800",
  theory_studying: "bg-blue-100 text-blue-800",
  theory_passed: "bg-indigo-100 text-indigo-800",
  practical_lessons: "bg-blue-100 text-blue-800",
  practical_booked: "bg-amber-100 text-amber-800",
  practical_passed: "bg-green-100 text-green-800",
  full_licence: "bg-emerald-100 text-emerald-800",
};

const FUNDING_CLR: Record<DrivingFundingSource, string> = {
  leaving_care_grant: "bg-teal-100 text-teal-800",
  pocket_money: "bg-yellow-100 text-yellow-800",
  family_contribution: "bg-purple-100 text-purple-800",
  mixed: "bg-blue-100 text-blue-800",
};

const STAGES: DrivingStage[] = [
  "awaiting_17th_birthday", "provisional_applied", "provisional_held",
  "theory_studying", "theory_passed", "practical_lessons",
  "practical_booked", "practical_passed", "full_licence",
];

const fmtGBP = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n);

/* ── component ─────────────────────────────────────────────────────────────── */

export default function DrivingLessonsTrackerPage() {
  const { data: queryData, isLoading } = useDrivingRecords();
  const data = queryData?.data ?? [];
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        getYPName(r.child_id).toLowerCase().includes(s) ||
        (r.instructor ?? "").toLowerCase().includes(s) ||
        DRIVING_STAGE_LABEL[r.stage].toLowerCase().includes(s)
      );
    }
    if (stageFilter !== "all") out = out.filter(r => r.stage === stageFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "name": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "hours": return b.hours_logged - a.hours_logged;
        case "cost": return b.cost_so_far - a.cost_so_far;
        case "stage": return STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage);
        default: return 0;
      }
    });
    return out;
  }, [data, search, stageFilter, sortBy]);

  const inTraining = data.filter(r =>
    r.stage === "theory_studying" || r.stage === "practical_lessons" || r.stage === "practical_booked"
  ).length;
  const theoryPassedCount = data.filter(r =>
    r.theory_attempts.some(t => t.result === "pass") ||
    r.stage === "theory_passed" || r.stage === "practical_lessons" ||
    r.stage === "practical_booked" || r.stage === "practical_passed" || r.stage === "full_licence"
  ).length;
  const totalHours = data.reduce((s, r) => s + r.hours_logged, 0);
  const totalCost = data.reduce((s, r) => s + r.cost_so_far, 0);

  const exportCols: ExportColumn<DrivingRecord>[] = useMemo(() => [
    { header: "Young Person", accessor: (r: DrivingRecord) => getYPName(r.child_id) },
    { header: "Recorded Date", accessor: (r: DrivingRecord) => r.recorded_date },
    { header: "Stage", accessor: (r: DrivingRecord) => DRIVING_STAGE_LABEL[r.stage] },
    { header: "Provisional Number", accessor: (r: DrivingRecord) => r.provisional_number ?? "" },
    { header: "Theory Attempts", accessor: (r: DrivingRecord) => r.theory_attempts.map(t => `${t.date} ${t.result}${t.score ? ` (${t.score})` : ""}`).join("; ") },
    { header: "Practical Attempts", accessor: (r: DrivingRecord) => r.practical_attempts.map(p => `${p.date} ${p.result}${p.faults ? ` (${p.faults})` : ""}`).join("; ") },
    { header: "Lessons Completed", accessor: (r: DrivingRecord) => r.lessons_completed_total },
    { header: "Lessons Booked", accessor: (r: DrivingRecord) => r.lessons_booked_total },
    { header: "Hours Logged", accessor: (r: DrivingRecord) => r.hours_logged },
    { header: "Hourly Rate", accessor: (r: DrivingRecord) => fmtGBP(r.hourly_rate) },
    { header: "Cost So Far", accessor: (r: DrivingRecord) => fmtGBP(r.cost_so_far) },
    { header: "Funding Source", accessor: (r: DrivingRecord) => DRIVING_FUNDING_SOURCE_LABEL[r.funding_source] },
    { header: "Instructor", accessor: (r: DrivingRecord) => r.instructor ?? "" },
    { header: "Next Lesson", accessor: (r: DrivingRecord) => r.next_lesson ?? "" },
    { header: "Child Voice", accessor: (r: DrivingRecord) => r.child_voice },
    { header: "Staff Observation", accessor: (r: DrivingRecord) => r.staff_observation },
    { header: "Review Date", accessor: (r: DrivingRecord) => r.review_date },
    { header: "Key Worker", accessor: (r: DrivingRecord) => getStaffName(r.key_worker) },
  ], []);

  if (isLoading) {
    return (
      <PageShell
        title="Driving Lessons Tracker"
        subtitle="Provisional licence, theory and practical progress for over-17s — Pathway Plan and Care Leavers (England) Regulations 2010"
      >
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Driving Lessons Tracker"
      subtitle="Provisional licence, theory and practical progress for over-17s — Pathway Plan and Care Leavers (England) Regulations 2010"
      caraContext={{ pageTitle: "Driving Lessons Tracker", sourceType: "child_record" }}
      actions={[
        <PrintButton key="p" title="Driving Lessons Tracker" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="driving-lessons-tracker" />,
        <CaraStudioQuickActionButton key="a" context={{ record_type: "education", record_id: "home_oak", home_id: "home_oak" }} />,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "In Training", value: inTraining, icon: Car, colour: "text-sky-600" },
            { label: "Theory Passed", value: theoryPassedCount, icon: BookOpen, colour: "text-blue-600" },
            { label: "Hours Logged", value: totalHours, icon: CheckCircle, colour: "text-indigo-600" },
            { label: "Total Cost", value: fmtGBP(totalCost), icon: Award, colour: "text-teal-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* filter bar */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Name, instructor, stage…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-52">
                <Label className="text-xs">Stage</Label>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stages</SelectItem>
                    {STAGES.map(s => <SelectItem key={s} value={s}>{DRIVING_STAGE_LABEL[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="stage">Stage</SelectItem>
                    <SelectItem value="hours">Hours Logged</SelectItem>
                    <SelectItem value="cost">Cost So Far</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* records */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            const theoryPassed = r.theory_attempts.some(t => t.result === "pass");
            const practicalPassed = r.practical_attempts.some(p => p.result === "pass");
            const nextMilestone =
              r.stage === "awaiting_17th_birthday" ? "Reach 17th birthday" :
              r.stage === "provisional_applied" ? "Receive provisional licence" :
              r.stage === "provisional_held" ? "Begin theory revision" :
              r.stage === "theory_studying" ? "Book theory test" :
              r.stage === "theory_passed" ? "Begin practical lessons" :
              r.stage === "practical_lessons" ? "Book practical test" :
              r.stage === "practical_booked" ? "Sit practical test" :
              r.stage === "practical_passed" ? "Receive full licence" :
              "Full licence held";

            return (
              <Card key={r.id} className="border-l-4 border-sky-400 bg-sky-50/30">
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getYPName(r.child_id)}</CardTitle>
                        <Badge className={cn("text-xs", STAGE_CLR[r.stage])}>{DRIVING_STAGE_LABEL[r.stage]}</Badge>
                        <Badge variant="outline" className="text-xs">{r.hours_logged} hrs</Badge>
                        <Badge variant="outline" className="text-xs">{fmtGBP(r.cost_so_far)}</Badge>
                        <Badge className={cn("text-xs", FUNDING_CLR[r.funding_source])}>{DRIVING_FUNDING_SOURCE_LABEL[r.funding_source]}</Badge>
                        {theoryPassed && <Badge className="text-xs bg-indigo-100 text-indigo-800">Theory passed</Badge>}
                        {practicalPassed && <Badge className="text-xs bg-green-100 text-green-800">Practical passed</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Recorded: {r.recorded_date}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg border bg-white p-3 space-y-1">
                        <p className="text-xs font-semibold text-sky-800 flex items-center gap-1"><Car className="h-3 w-3" />Provisional</p>
                        <p className="text-xs">Number: <span className="font-mono">{r.provisional_number ?? "—"}</span></p>
                        <p className="text-xs">Next milestone: <strong>{nextMilestone}</strong></p>
                      </div>
                      <div className="rounded-lg border bg-white p-3 space-y-1">
                        <p className="text-xs font-semibold text-blue-800 flex items-center gap-1"><BookOpen className="h-3 w-3" />Lessons</p>
                        <p className="text-xs">Completed: <strong>{r.lessons_completed_total}</strong> of {r.lessons_booked_total} booked</p>
                        <p className="text-xs">Hours logged: <strong>{r.hours_logged}</strong> @ {fmtGBP(r.hourly_rate)}/hr</p>
                        {r.next_lesson && <p className="text-xs">Next lesson: <strong>{r.next_lesson}</strong></p>}
                      </div>
                    </div>

                    {/* theory attempts */}
                    <div>
                      <p className="text-xs font-semibold mb-1 flex items-center gap-1"><BookOpen className="h-3 w-3" />Theory Test Attempts</p>
                      {r.theory_attempts.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No theory attempts recorded yet.</p>
                      ) : (
                        <ul className="text-sm space-y-1">
                          {r.theory_attempts.map((t, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="font-medium">{t.date}</span>
                              <Badge className={cn("text-xs", t.result === "pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{t.result}</Badge>
                              {t.score && <span className="text-xs text-muted-foreground">{t.score}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* practical attempts */}
                    <div>
                      <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Car className="h-3 w-3" />Practical Test Attempts</p>
                      {r.practical_attempts.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No practical attempts recorded yet.</p>
                      ) : (
                        <ul className="text-sm space-y-1">
                          {r.practical_attempts.map((p, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="font-medium">{p.date}</span>
                              <Badge className={cn("text-xs", p.result === "pass" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>{p.result}</Badge>
                              {p.faults && <span className="text-xs text-muted-foreground">{p.faults}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* funding breakdown */}
                    <div className="rounded-lg border bg-white p-3 text-xs space-y-1">
                      <p className="font-semibold text-teal-800 flex items-center gap-1"><Award className="h-3 w-3" />Funding</p>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", FUNDING_CLR[r.funding_source])}>{DRIVING_FUNDING_SOURCE_LABEL[r.funding_source]}</Badge>
                        <span>Cost so far: <strong>{fmtGBP(r.cost_so_far)}</strong></span>
                        {r.hourly_rate > 0 && <span>Hourly rate: <strong>{fmtGBP(r.hourly_rate)}</strong></span>}
                      </div>
                    </div>

                    {/* child voice */}
                    <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                      <p className="text-xs font-semibold text-sky-800 mb-1">Child&apos;s Voice</p>
                      <p className="text-sm italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>

                    {/* staff observation */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Staff Observation</p>
                      <p className="text-sm">{r.staff_observation}</p>
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel sourceType="driving_record" sourceId={r.id} childId={r.child_id} compact />

                    {/* meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {r.instructor && <span>Instructor: <strong>{r.instructor}</strong></span>}
                      <span>Key Worker: <strong>{getStaffName(r.key_worker)}</strong></span>
                      <span>Review Date: <strong>{r.review_date}</strong></span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Driving lessons for care leavers are recorded against the young person&apos;s Pathway Plan under the Care Leavers (England) Regulations 2010. Funding decisions follow the Local Authority Leaving Care policy on driving lessons (Leaving Care Grant contributions, with documented contribution from the young person where appropriate). Lessons must be delivered by an Approved Driving Instructor (ADI) registered with the DVSA, and theory/practical tests booked through DVSA standards. All progress, costs and the young person&apos;s voice are reviewed at each Pathway Plan review.</p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Education"
        category="education"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Driving Lessons Tracker — theory test, practical test, lessons booked, instructor, hours logged, leaving care, independence, personal transport, pathway plan, funding"
        recordType="education"
        className="mt-6"
      />
    </PageShell>
  );
}
