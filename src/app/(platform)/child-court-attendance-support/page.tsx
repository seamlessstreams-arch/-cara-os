"use client";

import { useState, useMemo } from "react";
import {
  Scale,
  Shield,
  Users,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Calendar,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CourtAttendanceRecord,
  CourtAttendanceType,
  CourtChildRole,
} from "@/types/extended";
import {
  COURT_ATTENDANCE_TYPE_LABEL,
  COURT_CHILD_ROLE_LABEL,
} from "@/types/extended";
import { useCourtAttendanceRecords } from "@/hooks/use-court-attendance-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── constants ─────────────────────────────────────────────────────────── */

const COURT_TYPES: CourtAttendanceType[] = [
  "family_court_care_proceedings",
  "family_court_contact_private_law",
  "youth_court_criminal_defendant",
  "crown_court_witness",
  "magistrates_witness",
  "abe_interview",
  "court_familiarisation_visit",
  "other_tribunal",
];

const ROLE_COLOURS: Record<CourtChildRole, string> = {
  subject_of_proceedings: "bg-sky-100 text-sky-800",
  witness: "bg-teal-100 text-teal-800",
  defendant: "bg-amber-100 text-amber-800",
  special_party_re_w: "bg-purple-100 text-purple-800",
  observer_familiarisation: "bg-slate-100 text-slate-700",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildCourtAttendanceSupportPage() {
  const { data: response, isLoading } = useCourtAttendanceRecords();
  const data = response?.data ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCourt, setFilterCourt] = useState("all");
  const [sortBy, setSortBy] = useState("hearing");

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7);
    return {
      activeProceedings: data.filter(
        (r) => !r.outcomes || /pending|reserved|no further action.*sensitively/i.test(r.outcomes)
      ).length,
      thisMonth: data.filter((r) => r.hearing_date?.startsWith(monthStart)).length,
      specialMeasures: data.reduce((s, r) => s + r.special_measures_agreed.length, 0),
      followUpsDue: data.filter((r) => r.follow_up_date && r.follow_up_date >= today).length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterCourt !== "all") list = list.filter((r) => r.court_type === filterCourt);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          COURT_ATTENDANCE_TYPE_LABEL[r.court_type].toLowerCase().includes(q) ||
          COURT_CHILD_ROLE_LABEL[r.child_role].toLowerCase().includes(q) ||
          (r.court_location ?? "").toLowerCase().includes(q) ||
          (r.legal_rep ?? "").toLowerCase().includes(q) ||
          r.child_voice.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "yp":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "court":
          return COURT_ATTENDANCE_TYPE_LABEL[a.court_type].localeCompare(
            COURT_ATTENDANCE_TYPE_LABEL[b.court_type]
          );
        case "recorded":
          return b.recorded_date.localeCompare(a.recorded_date);
        default:
          return (b.hearing_date ?? "").localeCompare(a.hearing_date ?? "");
      }
    });
    return list;
  }, [data, filterCourt, search, sortBy]);

  const exportData = useMemo(
    () =>
      data.map((r) => ({
        youngPerson: getYPName(r.child_id),
        recordedDate: r.recorded_date,
        courtType: COURT_ATTENDANCE_TYPE_LABEL[r.court_type],
        childRole: COURT_CHILD_ROLE_LABEL[r.child_role],
        hearingDate: r.hearing_date ?? "",
        hearingTime: r.hearing_time ?? "",
        courtLocation: r.court_location ?? "",
        legalRep: r.legal_rep ?? "",
        guardianAdLitem: r.guardian_ad_litem ?? "",
        socialWorkerInvolved: r.social_worker_involved ?? "",
        specialMeasuresAgreed: r.special_measures_agreed.join("; "),
        preHearingPrep: r.pre_hearing_prep.join("; "),
        whoAttendsWithChild: r.who_attends_with_child.join("; "),
        travelArrangements: r.travel_arrangements ?? "",
        riskAssessmentDone: r.risk_assessment_done ? "Yes" : "No",
        riskFactors: r.risk_factors.join("; "),
        protectiveFactors: r.protective_factors.join("; "),
        outcomes: r.outcomes ?? "",
        postHearingSupport: r.post_hearing_support.join("; "),
        childVoice: r.child_voice,
        staffObservation: r.staff_observation,
        flagsConcerns: r.flags_concerns.join("; "),
        followUpDate: r.follow_up_date ?? "",
        keyWorker: getStaffName(r.key_worker),
      })),
    [data]
  );

  type CourtExportRow = (typeof exportData)[number];

  const exportCols: ExportColumn<CourtExportRow>[] = [
    { header: "Young Person", accessor: (r: CourtExportRow) => r.youngPerson },
    { header: "Recorded Date", accessor: (r: CourtExportRow) => r.recordedDate },
    { header: "Court Type", accessor: (r: CourtExportRow) => r.courtType },
    { header: "Child Role", accessor: (r: CourtExportRow) => r.childRole },
    { header: "Hearing Date", accessor: (r: CourtExportRow) => r.hearingDate },
    { header: "Hearing Time", accessor: (r: CourtExportRow) => r.hearingTime },
    { header: "Court Location", accessor: (r: CourtExportRow) => r.courtLocation },
    { header: "Legal Rep", accessor: (r: CourtExportRow) => r.legalRep },
    { header: "Guardian ad litem", accessor: (r: CourtExportRow) => r.guardianAdLitem },
    { header: "Social Worker", accessor: (r: CourtExportRow) => r.socialWorkerInvolved },
    { header: "Special Measures", accessor: (r: CourtExportRow) => r.specialMeasuresAgreed },
    { header: "Pre-Hearing Prep", accessor: (r: CourtExportRow) => r.preHearingPrep },
    { header: "Attends With Child", accessor: (r: CourtExportRow) => r.whoAttendsWithChild },
    { header: "Travel", accessor: (r: CourtExportRow) => r.travelArrangements },
    { header: "Risk Assessment", accessor: (r: CourtExportRow) => r.riskAssessmentDone },
    { header: "Risk Factors", accessor: (r: CourtExportRow) => r.riskFactors },
    { header: "Protective Factors", accessor: (r: CourtExportRow) => r.protectiveFactors },
    { header: "Outcomes", accessor: (r: CourtExportRow) => r.outcomes },
    { header: "Post-Hearing Support", accessor: (r: CourtExportRow) => r.postHearingSupport },
    { header: "Child Voice", accessor: (r: CourtExportRow) => r.childVoice },
    { header: "Staff Observation", accessor: (r: CourtExportRow) => r.staffObservation },
    { header: "Flags / Concerns", accessor: (r: CourtExportRow) => r.flagsConcerns },
    { header: "Follow-up Date", accessor: (r: CourtExportRow) => r.followUpDate },
    { header: "Key Worker", accessor: (r: CourtExportRow) => r.keyWorker },
  ];

  return (
    <PageShell
      title="Court Attendance Support"
      subtitle="Per-child preparation and support for family, criminal, youth and tribunal proceedings — child-led, trauma-informed, dignified"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="court-attendance-support" />
          <PrintButton title="Court Attendance Support" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <div id="print-area" className="space-y-6">
        {/* stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Active Proceedings", v: stats.activeProceedings, icon: Scale, c: "text-sky-600" },
            { l: "This Month's Hearings", v: stats.thisMonth, icon: Calendar, c: "text-teal-600" },
            { l: "Special Measures Agreed", v: stats.specialMeasures, icon: Shield, c: "text-purple-600" },
            { l: "Follow-ups Due", v: stats.followUpsDue, icon: AlertTriangle, c: "text-amber-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search child, court, role, location…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterCourt} onValueChange={setFilterCourt}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Court Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Court Types</SelectItem>
              {COURT_TYPES.map((c) => (
                <SelectItem key={c} value={c}>
                  {COURT_ATTENDANCE_TYPE_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="hearing">Hearing Date</option>
              <option value="recorded">Recorded Date</option>
              <option value="yp">Young Person</option>
              <option value="court">Court Type</option>
            </select>
          </div>
        </div>

        {/* records */}
        {filtered.map((rec) => (
          <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-sky-50/50"
            >
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-sky-600" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{getYPName(rec.child_id)}</h3>
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                      {COURT_ATTENDANCE_TYPE_LABEL[rec.court_type]}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        ROLE_COLOURS[rec.child_role]
                      )}
                    >
                      {COURT_CHILD_ROLE_LABEL[rec.child_role]}
                    </span>
                    {rec.hearing_date && (
                      <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-xs text-teal-800 inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {rec.hearing_date}
                        {rec.hearing_time ? ` · ${rec.hearing_time}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Key worker: {getStaffName(rec.key_worker)}
                    {rec.court_location ? ` · ${rec.court_location}` : ""}
                  </p>
                </div>
              </div>
              {expanded === rec.id ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {expanded === rec.id && (
              <div className="border-t p-4 space-y-4 bg-sky-50/30">
                {/* hearing details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {rec.hearing_date && (
                    <div>
                      <span className="text-muted-foreground">Hearing date:</span> {rec.hearing_date}
                    </div>
                  )}
                  {rec.hearing_time && (
                    <div>
                      <span className="text-muted-foreground">Time:</span> {rec.hearing_time}
                    </div>
                  )}
                  {rec.court_location && (
                    <div>
                      <span className="text-muted-foreground">Location:</span> {rec.court_location}
                    </div>
                  )}
                  {rec.legal_rep && (
                    <div className="col-span-2 md:col-span-3">
                      <span className="text-muted-foreground">Legal rep:</span> {rec.legal_rep}
                    </div>
                  )}
                  {rec.guardian_ad_litem && (
                    <div className="col-span-2 md:col-span-3">
                      <span className="text-muted-foreground">Guardian ad litem:</span>{" "}
                      {rec.guardian_ad_litem}
                    </div>
                  )}
                  {rec.social_worker_involved && (
                    <div className="col-span-2 md:col-span-3">
                      <span className="text-muted-foreground">Social worker:</span>{" "}
                      {rec.social_worker_involved}
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Recorded:</span> {rec.recorded_date}
                  </div>
                  {rec.follow_up_date && (
                    <div>
                      <span className="text-muted-foreground">Follow-up:</span> {rec.follow_up_date}
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Risk assessment:</span>{" "}
                    {rec.risk_assessment_done ? "Completed" : "Outstanding"}
                  </div>
                </div>

                {/* special measures */}
                {rec.special_measures_agreed.length > 0 && (
                  <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                    <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-1">
                      <Shield className="h-4 w-4" /> Special Measures Agreed
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.special_measures_agreed.map((m, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-white border border-purple-200 px-2 py-0.5 text-xs text-purple-900"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* pre-hearing prep */}
                <div>
                  <h4 className="text-sm font-semibold mb-1">Pre-Hearing Preparation</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {rec.pre_hearing_prep.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                {/* who attends */}
                <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
                  <h4 className="text-sm font-semibold text-teal-900 mb-2 flex items-center gap-1">
                    <Users className="h-4 w-4" /> Who Attends With Child
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-teal-900">
                    {rec.who_attends_with_child.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>

                {/* travel */}
                {rec.travel_arrangements && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Travel Arrangements</h4>
                    <p className="text-sm text-muted-foreground">{rec.travel_arrangements}</p>
                  </div>
                )}

                {/* risk + protective */}
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-sm font-semibold text-amber-900 mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Risk Factors
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-900">
                      {rec.risk_factors.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                    <h4 className="text-sm font-semibold text-emerald-900 mb-1">Protective Factors</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-emerald-900">
                      {rec.protective_factors.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* outcomes */}
                {rec.outcomes && (
                  <div className="rounded-lg bg-white border p-3">
                    <h4 className="text-sm font-semibold mb-1">Outcomes</h4>
                    <p className="text-sm text-muted-foreground">{rec.outcomes}</p>
                  </div>
                )}

                {/* post-hearing support */}
                <div>
                  <h4 className="text-sm font-semibold mb-1">Post-Hearing Support</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {rec.post_hearing_support.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                {/* child voice */}
                <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                  <h4 className="text-sm font-semibold text-sky-900 mb-1">Child&apos;s Voice</h4>
                  <p className="text-sm text-sky-900 italic">&ldquo;{rec.child_voice}&rdquo;</p>
                </div>

                {/* staff observation */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">Staff Observation</h4>
                  <p className="text-sm text-slate-800">{rec.staff_observation}</p>
                </div>

                {/* flags */}
                {rec.flags_concerns.length > 0 && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <h4 className="text-sm font-semibold text-red-900 mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Flags / Concerns
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-900">
                      {rec.flags_concerns.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* smart link panel */}
                <SmartLinkPanel sourceType="court-attendance-support" sourceId={rec.id} childId={rec.child_id} compact />
              </div>
            )}
          </div>
        ))}

        {/* regulatory footer */}
        <div className="rounded-lg border-l-4 border-sky-400 bg-sky-50 p-4 text-sm text-sky-900">
          <strong>Regulatory framework</strong> — Children Act 1989 s.41 (guardian ad litem);
          Re W (Children) [2010] UKSC 12 (child evidence in family proceedings); Achieving Best
          Evidence (ABE) guidance (MoJ); Youth Justice and Criminal Evidence Act 1999 (special
          measures, ss.16–33); Family Justice Council Children&apos;s Guide; Witness Service support;
          Working Together to Safeguard Children 2023; Children&apos;s Homes Quality Standards 7
          (Positive Relationships) and 9 (Protection); UNCRC Articles 12 (right to be heard) and 40
          (juvenile justice). Court attendance is always child-led, well-prepared, and supported by
          a trusted adult.
        </div>
      </div>
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
