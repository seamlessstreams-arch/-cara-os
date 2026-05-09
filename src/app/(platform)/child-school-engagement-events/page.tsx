"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Users,
  Star,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Camera,
  Award,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, formatDate } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { SchoolEngagementEvent } from "@/types/extended";
import { SCHOOL_EVENT_TYPE_LABEL } from "@/types/extended";
import { useSchoolEngagementEvents } from "@/hooks/use-school-engagement-events";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── colour maps ───────────────────────────────────────────────────────── */

const EVENT_COLOURS: Record<string, string> = {
  parents_evening: "bg-teal-100 text-teal-800",
  options_evening: "bg-indigo-100 text-indigo-800",
  prize_giving_awards: "bg-amber-100 text-amber-800",
  sports_day: "bg-emerald-100 text-emerald-800",
  school_production_play: "bg-purple-100 text-purple-800",
  concert_performance: "bg-purple-100 text-purple-800",
  leavers_assembly: "bg-rose-100 text-rose-800",
  prom: "bg-pink-100 text-pink-800",
  open_evening: "bg-blue-100 text-blue-800",
  pep_attendance: "bg-slate-100 text-slate-800",
  subject_taster_fair: "bg-cyan-100 text-cyan-800",
};

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string;
  eventDate: string;
  eventType: string;
  schoolName: string;
  attendedBy: string;
  birthFamilyAttended: string;
  socialWorkerAttended: string;
  childWantedHomeAttendance: string;
  achievements: string;
  photosTakenWithConsent: string;
  photosLocation: string;
  feedbackFromSchool: string;
  followUpActions: string;
  childVoice: string;
  staffObservation: string;
  flagsConcerns: string;
  recordedBy: string;
}

const exportCols: ExportColumn<FlatRow>[] = [
  { header: "Young Person", accessor: (r: FlatRow) => r.youngPerson },
  { header: "Event Date", accessor: (r: FlatRow) => r.eventDate },
  { header: "Event Type", accessor: (r: FlatRow) => r.eventType },
  { header: "School", accessor: (r: FlatRow) => r.schoolName },
  { header: "Attended By (Home)", accessor: (r: FlatRow) => r.attendedBy },
  { header: "Birth Family Attended", accessor: (r: FlatRow) => r.birthFamilyAttended },
  { header: "Social Worker Attended", accessor: (r: FlatRow) => r.socialWorkerAttended },
  { header: "Child Wanted Home Attendance", accessor: (r: FlatRow) => r.childWantedHomeAttendance },
  { header: "Achievements", accessor: (r: FlatRow) => r.achievements },
  { header: "Photos w/ Consent", accessor: (r: FlatRow) => r.photosTakenWithConsent },
  { header: "Photos Location", accessor: (r: FlatRow) => r.photosLocation },
  { header: "School Feedback", accessor: (r: FlatRow) => r.feedbackFromSchool },
  { header: "Follow-up Actions", accessor: (r: FlatRow) => r.followUpActions },
  { header: "Child Voice", accessor: (r: FlatRow) => r.childVoice },
  { header: "Staff Observation", accessor: (r: FlatRow) => r.staffObservation },
  { header: "Flags / Concerns", accessor: (r: FlatRow) => r.flagsConcerns },
  { header: "Recorded By", accessor: (r: FlatRow) => r.recordedBy },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildSchoolEngagementEventsPage() {
  const { data: res, isLoading } = useSchoolEngagementEvents();
  const items = res?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  if (isLoading) {
    return <PageShell title="School Engagement Events" subtitle="Loading…"><div /></PageShell>;
  }

  /* ── stats ────────────────────────────────────────────────────────── */
  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  const ytdISO = yearStart.toISOString().slice(0, 10);
  const eventsYTD = items.filter((r) => r.event_date >= ytdISO).length;
  const photosKept = items.filter((r) => r.photos_taken_with_consent).length;
  const swAttended = items.filter((r) => r.social_worker_attended).length;
  const achievementsRecognised = items.reduce((acc, r) => acc + r.child_achievements_recognised.length, 0);
  const stats = { eventsYTD, photosKept, swAttended, achievementsRecognised };

  /* ── filter / sort ────────────────────────────────────────────────── */
  let list = items as SchoolEngagementEvent[];
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((r) =>
      getYPName(r.child_id).toLowerCase().includes(q) ||
      r.school_name.toLowerCase().includes(q) ||
      r.event_type.toLowerCase().includes(q) ||
      r.what_happened.toLowerCase().includes(q)
    );
  }
  if (filterType !== "all") list = list.filter((r) => r.event_type === filterType);
  const filtered = [...list];
  switch (sortBy) {
    case "date": filtered.sort((a, b) => b.event_date.localeCompare(a.event_date)); break;
    case "child": filtered.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
    case "type": filtered.sort((a, b) => a.event_type.localeCompare(b.event_type)); break;
    case "attendance": filtered.sort((a, b) => b.attended_by.length - a.attended_by.length); break;
  }

  /* ── export rows ──────────────────────────────────────────────────── */
  const exportRows: FlatRow[] = items.map((r) => ({
    youngPerson: getYPName(r.child_id),
    eventDate: formatDate(r.event_date),
    eventType: SCHOOL_EVENT_TYPE_LABEL[r.event_type] ?? r.event_type,
    schoolName: r.school_name,
    attendedBy: r.attended_by.map((s) => getStaffName(s)).join("; "),
    birthFamilyAttended: r.birth_family_attended ? "Yes" : "No",
    socialWorkerAttended: r.social_worker_attended ? "Yes" : "No",
    childWantedHomeAttendance: r.child_wanted_home_attendance ? "Yes" : "No",
    achievements: r.child_achievements_recognised.join("; "),
    photosTakenWithConsent: r.photos_taken_with_consent ? "Yes" : "No",
    photosLocation: r.photos_location ?? "",
    feedbackFromSchool: r.feedback_from_school,
    followUpActions: r.follow_up_actions.join("; "),
    childVoice: r.child_voice,
    staffObservation: r.staff_observation,
    flagsConcerns: r.flags_concerns ?? "",
    recordedBy: getStaffName(r.recorded_by),
  }));

  return (
    <PageShell
      title="School Engagement Events"
      subtitle="Showing up — every parents&apos; evening, every prize-giving, every prom. Corporate parenting evidenced."
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="School Engagement Events" />
          <ExportButton data={exportRows} columns={exportCols} filename="school-engagement-events" />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Events attended (YTD)", value: stats.eventsYTD, icon: Calendar, colour: "text-teal-600" },
          { label: "Photos kept (with consent)", value: stats.photosKept, icon: Camera, colour: "text-amber-600" },
          { label: "Social worker attended", value: stats.swAttended, icon: Users, colour: "text-purple-600" },
          { label: "Achievements recognised", value: stats.achievementsRecognised, icon: Award, colour: "text-emerald-600" },
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

      {/* ── opening note ──────────────────────────────────────────── */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 mb-6">
        <div className="flex items-start gap-2">
          <Star className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>The home shows up.</strong> Looked-after children should never be the child sitting alone at the leavers&apos; assembly or scanning the crowd at sports day for a face that doesn&apos;t come. This page records every school occasion the home attended, who else came, what the child achieved, and how it felt to them. Photos are kept only with the child&apos;s informed consent and stored where they choose.
          </div>
        </div>
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by child, school, event, or detail…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[230px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All event types</SelectItem>
            {Object.entries(SCHOOL_EVENT_TYPE_LABEL).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most recent</SelectItem>
              <SelectItem value="child">Child name</SelectItem>
              <SelectItem value="type">Event type</SelectItem>
              <SelectItem value="attendance">Attendance count</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── records ────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expandedId === r.id;
          const totalAttendees =
            r.attended_by.length +
            (r.birth_family_attended ? 1 : 0) +
            (r.social_worker_attended ? 1 : 0);
          return (
            <div key={r.id} className="rounded-lg border border-amber-100 bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-amber-50/40"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Calendar className="h-4 w-4 text-teal-500" />
                    <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                    <span className="text-sm text-gray-600">— {r.school_name}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", EVENT_COLOURS[r.event_type])}>{SCHOOL_EVENT_TYPE_LABEL[r.event_type]}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-800 inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {totalAttendees} attended
                    </span>
                    {r.photos_taken_with_consent && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                        <Camera className="h-3 w-3" /> Photos kept
                      </span>
                    )}
                    {r.child_achievements_recognised.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                        <Award className="h-3 w-3" /> {r.child_achievements_recognised.length} achievement{r.child_achievements_recognised.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDate(r.event_date)} · From the home: {r.attended_by.map((s) => getStaffName(s)).join(", ")} · Recorded by {getStaffName(r.recorded_by)}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />}
              </button>

              {open && (
                <div className="border-t border-amber-100 px-4 pb-4 space-y-4">
                  {/* what happened */}
                  <div className="rounded-md bg-gray-50 p-3 mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">What happened</h4>
                    <p className="text-sm">{r.what_happened}</p>
                  </div>

                  {/* who turned up */}
                  <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                    <h4 className="text-xs font-semibold text-teal-700 mb-1 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> Team around the child — who turned up
                    </h4>
                    <ul className="text-sm text-teal-900 space-y-0.5">
                      <li><span className="font-medium">From the home:</span> {r.attended_by.map((s) => getStaffName(s)).join(", ")}</li>
                      {r.birth_family_attended && (
                        <li><span className="font-medium">Birth family:</span> Yes</li>
                      )}
                      <li><span className="font-medium">Social worker:</span> {r.social_worker_attended ? "Yes" : "Not on this occasion"}</li>
                      <li><span className="font-medium">Child wanted home there:</span> {r.child_wanted_home_attendance ? "Yes — explicitly requested" : "Did not specify"}</li>
                    </ul>
                  </div>

                  {/* achievements */}
                  {r.child_achievements_recognised.length > 0 && (
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" /> Achievements recognised
                      </h4>
                      <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                        {r.child_achievements_recognised.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* photos */}
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5" /> Photos
                    </h4>
                    {r.photos_taken_with_consent ? (
                      <p className="text-sm text-amber-900">
                        <span className="font-medium">Taken with consent.</span> Stored: {r.photos_location ?? "location not recorded"}
                      </p>
                    ) : (
                      <p className="text-sm italic text-amber-700/70">No photos taken / kept on this occasion.</p>
                    )}
                  </div>

                  {/* school feedback + follow-ups */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                      <h4 className="text-xs font-semibold text-indigo-700 mb-1">Feedback from school</h4>
                      <p className="text-sm text-indigo-900">{r.feedback_from_school}</p>
                    </div>
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Follow-up actions</h4>
                      {r.follow_up_actions.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-blue-900 space-y-0.5">
                          {r.follow_up_actions.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-blue-700/70">No follow-up actions.</p>
                      )}
                    </div>
                  </div>

                  {/* child voice */}
                  <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                    <h4 className="text-xs font-semibold text-rose-700 mb-1">Child&apos;s voice</h4>
                    <p className="text-sm italic text-rose-900">&ldquo;{r.child_voice}&rdquo;</p>
                  </div>

                  {/* staff observation */}
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-xs font-semibold text-amber-700 mb-1">Staff observation</h4>
                    <p className="text-sm text-amber-900">{r.staff_observation}</p>
                  </div>

                  {/* flags */}
                  {r.flags_concerns && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">Flags / concerns</h4>
                      <p className="text-sm text-red-900">{r.flags_concerns}</p>
                    </div>
                  )}

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="school-engagement-events" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-gray-500">
            No records match these filters.
          </div>
        )}
      </div>

      {/* ── regulatory footer ──────────────────────────────────────── */}
      <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-4 text-sm text-teal-900 mb-6">
        <strong>Regulatory framework.</strong> Attendance at school events sits within the Statutory Guidance on Promoting the Education of Looked-After and Previously Looked-After Children (DfE 2018), the Children&apos;s Homes (England) Regulations 2015 — Quality Standard 5 (education) and Quality Standard 7 (positive relationships) — and the corporate parenting principles set out in the Children Act 2004 (as amended by the Children and Social Work Act 2017). UNCRC Article 12 (the right to be heard) and Article 28 (the right to education) underpin our practice. Photos are kept only with the child&apos;s informed consent and stored according to the home&apos;s privacy and life-story policy. The home turning up — in numbers, alongside birth family, social worker, mentors and friends&apos; families — is the visible evidence of corporate parenting in action.
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
