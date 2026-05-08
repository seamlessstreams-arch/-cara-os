"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Search,
  Activity,
  Clipboard,
  Wrench,
  CalendarClock,
  AlertTriangle,
  GraduationCap,
  HandHelping,
  FileCheck2,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useOccupationalTherapyRecords } from "@/hooks/use-occupational-therapy-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { OccupationalTherapyRecord, OtSessionType, OtRecommendation } from "@/types/extended";
import { OT_SESSION_TYPE_LABEL } from "@/types/extended";

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const SESSION_TYPE_COLOURS: Record<OtSessionType, string> = {
  assessment: "bg-blue-100 text-blue-800",
  direct_intervention: "bg-green-100 text-green-800",
  consultation: "bg-purple-100 text-purple-800",
  review: "bg-amber-100 text-amber-800",
  sensory_diet_planning: "bg-pink-100 text-pink-800",
  equipment_recommendation: "bg-cyan-100 text-cyan-800",
  training_to_staff: "bg-indigo-100 text-indigo-800",
};

const SESSION_TYPES: OtSessionType[] = [
  "assessment",
  "direct_intervention",
  "consultation",
  "review",
  "sensory_diet_planning",
  "equipment_recommendation",
  "training_to_staff",
];

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  child_id: string;
  assessment_date: string;
  ot_name: string;
  ot_organisation: string;
  session_type: string;
  duration_minutes: string;
  location: string;
  focus_areas: string;
  assessment_tools: string;
  findings: string;
  sensory_profile: string;
  recommendations: string;
  sensory_diet: string;
  equipment_provided: string;
  staff_training: string;
  home_practice_advised: string;
  child_response: string;
  family_informed_date: string;
  progress_noted_since_last: string;
  next_review_date: string;
  report_provided: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",          accessor: (r: FlatRow) => r.child_id },
  { header: "Assessment Date",       accessor: (r: FlatRow) => r.assessment_date },
  { header: "OT Name",               accessor: (r: FlatRow) => r.ot_name },
  { header: "Organisation",          accessor: (r: FlatRow) => r.ot_organisation },
  { header: "Session Type",          accessor: (r: FlatRow) => r.session_type },
  { header: "Duration (mins)",       accessor: (r: FlatRow) => r.duration_minutes },
  { header: "Location",              accessor: (r: FlatRow) => r.location },
  { header: "Focus Areas",           accessor: (r: FlatRow) => r.focus_areas },
  { header: "Assessment Tools",      accessor: (r: FlatRow) => r.assessment_tools },
  { header: "Findings",              accessor: (r: FlatRow) => r.findings },
  { header: "Sensory Profile",       accessor: (r: FlatRow) => r.sensory_profile },
  { header: "Recommendations",       accessor: (r: FlatRow) => r.recommendations },
  { header: "Sensory Diet",          accessor: (r: FlatRow) => r.sensory_diet },
  { header: "Equipment Provided",    accessor: (r: FlatRow) => r.equipment_provided },
  { header: "Staff Training",        accessor: (r: FlatRow) => r.staff_training },
  { header: "Home Practice Advised", accessor: (r: FlatRow) => r.home_practice_advised },
  { header: "Child Response",        accessor: (r: FlatRow) => r.child_response },
  { header: "Family Informed",       accessor: (r: FlatRow) => r.family_informed_date },
  { header: "Progress Since Last",   accessor: (r: FlatRow) => r.progress_noted_since_last },
  { header: "Next Review",           accessor: (r: FlatRow) => r.next_review_date },
  { header: "Report Provided",       accessor: (r: FlatRow) => r.report_provided },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function OccupationalTherapyRecordsPage() {
  const { data: res, isLoading } = useOccupationalTherapyRecords();
  const data: OccupationalTherapyRecord[] = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterChild, setFilterChild] = useState("all");
  const [filterSession, setFilterSession] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");

  const toggle = (id: string) =>
    setExpandedId((cur) => (cur === id ? null : id));

  /* ── stats ───────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const today = d(0);
    const ninetyDaysAgo = d(-90);

    const childrenWithActiveOT = new Set(
      data
        .filter((r) => r.assessment_date >= ninetyDaysAgo)
        .map((r) => r.child_id)
    ).size;

    const sessionsThisQuarter = data.filter(
      (r) => r.assessment_date >= ninetyDaysAgo
    ).length;

    const reviewsDue = data.filter(
      (r) => r.next_review_date <= today
    ).length;

    const equipmentInPlace = data.reduce(
      (s, r) => s + r.equipment_provided.length,
      0
    );

    return { childrenWithActiveOT, sessionsThisQuarter, reviewsDue, equipmentInPlace };
  }, [data]);

  /* ── filtered + sorted ───────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.ot_name.toLowerCase().includes(q) ||
          r.findings.toLowerCase().includes(q) ||
          r.focus_areas.some((f) => f.toLowerCase().includes(q))
      );
    }
    if (filterChild !== "all") list = list.filter((r) => r.child_id === filterChild);
    if (filterSession !== "all") list = list.filter((r) => r.session_type === filterSession);

    const out = [...list];
    switch (sortBy) {
      case "date_desc":
        out.sort((a, b) => b.assessment_date.localeCompare(a.assessment_date));
        break;
      case "date_asc":
        out.sort((a, b) => a.assessment_date.localeCompare(b.assessment_date));
        break;
      case "review":
        out.sort((a, b) => a.next_review_date.localeCompare(b.next_review_date));
        break;
      case "child":
        out.sort((a, b) =>
          getYPName(a.child_id).localeCompare(getYPName(b.child_id))
        );
        break;
    }
    return out;
  }, [data, search, filterChild, filterSession, sortBy]);

  /* ── export rows ─────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(
    () =>
      data.map((r) => ({
        child_id: getYPName(r.child_id),
        assessment_date: r.assessment_date,
        ot_name: r.ot_name,
        ot_organisation: r.ot_organisation,
        session_type: OT_SESSION_TYPE_LABEL[r.session_type],
        duration_minutes: String(r.duration_minutes),
        location: r.location,
        focus_areas: r.focus_areas.join("; "),
        assessment_tools: r.assessment_tools.join("; "),
        findings: r.findings,
        sensory_profile: r.sensory_profile,
        recommendations: r.recommendations
          .map(
            (rec) =>
              `${rec.area} — ${rec.recommendation} (Freq: ${rec.frequency}; Equip: ${rec.equipment}; Support: ${rec.staff_support_level})`
          )
          .join(" | "),
        sensory_diet: r.sensory_diet.join("; "),
        equipment_provided: r.equipment_provided.join("; "),
        staff_training: r.staff_training,
        home_practice_advised: r.home_practice_advised.join("; "),
        child_response: r.child_response,
        family_informed_date: r.family_informed_date,
        progress_noted_since_last: r.progress_noted_since_last,
        next_review_date: r.next_review_date,
        report_provided: r.report_provided ? "Yes" : "No",
      })),
    [data]
  );

  /* ── loading state ───────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <PageShell
        title="Occupational Therapy Records"
        subtitle="OT input per child — assessments, recommendations, sensory diets and progress (QS 7)"
      >
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Occupational Therapy Records"
      subtitle="OT input per child — assessments, recommendations, sensory diets and progress (QS 7)"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Occupational Therapy Records" />
          <ExportButton
            data={exportData}
            columns={EXPORT_COLS}
            filename="occupational-therapy-records"
          />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active OT input", value: stats.childrenWithActiveOT, icon: Activity, colour: "text-blue-600" },
          { label: "Sessions this quarter", value: stats.sessionsThisQuarter, icon: Clipboard, colour: "text-green-600" },
          { label: "Reviews due", value: stats.reviewsDue, icon: CalendarClock, colour: stats.reviewsDue > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Equipment in place", value: stats.equipmentInPlace, icon: Wrench, colour: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── overdue review banner ──────────────────────────────────── */}
      {stats.reviewsDue > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">OT review overdue</p>
            <p className="text-sm text-amber-700">
              One or more children have an OT review date in the past. Please contact the relevant OT service to schedule the next session.
            </p>
          </div>
        </div>
      )}

      {/* ── filters / sort ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search child, OT, focus area or findings…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>

        <Select value={filterChild} onValueChange={setFilterChild}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All children</SelectItem>
            {["yp_alex", "yp_jordan", "yp_casey"].map((id) => (
              <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSession} onValueChange={setFilterSession}>
          <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All session types</SelectItem>
            {SESSION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{OT_SESSION_TYPE_LABEL[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest first</SelectItem>
              <SelectItem value="date_asc">Oldest first</SelectItem>
              <SelectItem value="review">Next review</SelectItem>
              <SelectItem value="child">Child name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── records ────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.length === 0 && (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
            No OT records match the current filters.
          </div>
        )}

        {filtered.map((r) => {
          const open = expandedId === r.id;
          const reviewOverdue = r.next_review_date <= d(0);

          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Activity className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SESSION_TYPE_COLOURS[r.session_type])}>
                      {OT_SESSION_TYPE_LABEL[r.session_type]}
                    </span>
                    {r.report_provided && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <FileCheck2 className="h-3 w-3" /> Report on file
                      </span>
                    )}
                    {reviewOverdue && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <AlertTriangle className="h-3 w-3" /> Review overdue
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.assessment_date} · {r.ot_name} ({r.ot_organisation}) · {r.duration_minutes} mins · {r.location}
                  </p>
                </div>
                {open
                  ? <ChevronUp className="h-5 w-5 text-gray-400" />
                  : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* meta row */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Date:</span> <span className="font-medium">{r.assessment_date}</span></div>
                    <div><span className="text-gray-500">Duration:</span> <span className="font-medium">{r.duration_minutes} mins</span></div>
                    <div><span className="text-gray-500">Family informed:</span> <span className="font-medium">{r.family_informed_date}</span></div>
                    <div><span className="text-gray-500">Next review:</span> <span className={cn("font-medium", reviewOverdue ? "text-red-600" : "")}>{r.next_review_date}</span></div>
                  </div>

                  {/* focus areas + tools */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Focus Areas</h4>
                      <ul className="list-disc list-inside text-sm space-y-0.5">
                        {r.focus_areas.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Assessment Tools</h4>
                      <ul className="list-disc list-inside text-sm space-y-0.5">
                        {r.assessment_tools.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* findings */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Findings</h4>
                    <p className="text-sm text-gray-800">{r.findings}</p>
                  </div>

                  {/* sensory profile */}
                  {r.sensory_profile && (
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Sensory Profile</h4>
                      <p className="text-sm text-purple-900">{r.sensory_profile}</p>
                    </div>
                  )}

                  {/* recommendations table */}
                  {r.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">Recommendations</h4>
                      <div className="overflow-x-auto rounded-md border">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                              <th className="px-3 py-2 text-left">Area</th>
                              <th className="px-3 py-2 text-left">Recommendation</th>
                              <th className="px-3 py-2 text-left">Frequency</th>
                              <th className="px-3 py-2 text-left">Equipment</th>
                              <th className="px-3 py-2 text-left">Staff Support</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {r.recommendations.map((rec, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 font-medium">{rec.area}</td>
                                <td className="px-3 py-2">{rec.recommendation}</td>
                                <td className="px-3 py-2 text-gray-600">{rec.frequency}</td>
                                <td className="px-3 py-2 text-gray-600">{rec.equipment}</td>
                                <td className="px-3 py-2 text-gray-600">{rec.staff_support_level}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* sensory diet + equipment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {r.sensory_diet.length > 0 && (
                      <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                        <h4 className="text-xs font-semibold text-pink-700 mb-1">Sensory Diet</h4>
                        <ul className="list-disc list-inside text-sm text-pink-900 space-y-0.5">
                          {r.sensory_diet.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {r.equipment_provided.length > 0 && (
                      <div className="rounded-md bg-cyan-50 border border-cyan-200 p-3">
                        <h4 className="text-xs font-semibold text-cyan-700 mb-1 flex items-center gap-1">
                          <Wrench className="h-3 w-3" /> Equipment Provided
                        </h4>
                        <ul className="list-disc list-inside text-sm text-cyan-900 space-y-0.5">
                          {r.equipment_provided.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* staff training */}
                  {r.staff_training && (
                    <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                      <h4 className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" /> Staff Training
                      </h4>
                      <p className="text-sm text-indigo-900">{r.staff_training}</p>
                    </div>
                  )}

                  {/* home practice */}
                  {r.home_practice_advised.length > 0 && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                        <HandHelping className="h-3 w-3" /> Home Practice Advised
                      </h4>
                      <ul className="list-disc list-inside text-sm text-blue-900 space-y-0.5">
                        {r.home_practice_advised.map((h, i) => <li key={i}>{h}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* child response + progress */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {r.child_response && (
                      <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                        <h4 className="text-xs font-semibold text-amber-700 mb-1">Child&apos;s Response</h4>
                        <p className="text-sm text-amber-900">{r.child_response}</p>
                      </div>
                    )}
                    {r.progress_noted_since_last && (
                      <div className="rounded-md bg-green-50 border border-green-200 p-3">
                        <h4 className="text-xs font-semibold text-green-700 mb-1">Progress Since Last</h4>
                        <p className="text-sm text-green-900">{r.progress_noted_since_last}</p>
                      </div>
                    )}
                  </div>

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="occupational-therapy-records" sourceId={r.id} childId={r.child_id} compact />

                  {/* logged-by */}
                  <div className="text-xs text-gray-400 pt-2 border-t">
                    Coordinated by {getStaffName("staff_anna")} · Reviewed by {getStaffName("staff_darren")} · Report on file: {r.report_provided ? "yes" : "no"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Quality Standard 7 — The Health and Wellbeing Standard:</strong> Children must be supported to access all health services they need, including specialist therapies. OT recommendations must be implemented consistently across the staff team, equipment provided as advised, and progress reviewed at agreed intervals. Sensory needs identified by an OT are clinical recommendations, not optional preferences — staff must be trained, supported and held accountable for implementation.
      </div>
    </PageShell>
  );
}
