"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Search,
  Users,
  AlertTriangle,
  FileCheck,
  CalendarClock,
  Heart,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type {
  FamilyTimeSession,
  FamilyTimeLocation,
  FamilyTimeSupervisionLevel,
  FamilyTimePresentation,
} from "@/types/extended";
import {
  FAMILY_TIME_LOCATION_LABEL,
  FAMILY_TIME_SUPERVISION_LEVEL_LABEL,
  FAMILY_TIME_PRESENTATION_LABEL,
} from "@/types/extended";
import { useFamilyTimeSessions } from "@/hooks/use-family-time-sessions";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────── */

const LEVEL_COLOURS: Record<FamilyTimeSupervisionLevel, string> = {
  supervised:   "bg-red-100 text-red-800",
  supported:    "bg-amber-100 text-amber-800",
  unsupervised: "bg-green-100 text-green-800",
};

const PRESENTATION_COLOURS: Record<FamilyTimePresentation, string> = {
  settled:    "bg-green-100 text-green-800",
  excited:    "bg-blue-100 text-blue-800",
  anxious:    "bg-amber-100 text-amber-800",
  withdrawn:  "bg-purple-100 text-purple-800",
  resistant:  "bg-red-100 text-red-800",
};

const LOCATION_OPTIONS: FamilyTimeLocation[] = ["oak_house", "family_home", "contact_centre", "public_venue"];
const LEVEL_OPTIONS: FamilyTimeSupervisionLevel[] = ["supervised", "supported", "unsupervised"];

/* ── export columns ───────────────────────────────────────────────────── */

const EXPORT_COLS: ExportColumn<FamilyTimeSession>[] = [
  { header: "Young Person",       accessor: (r: FamilyTimeSession) => getYPName(r.child_id) },
  { header: "Date",               accessor: (r: FamilyTimeSession) => r.date },
  { header: "Time",               accessor: (r: FamilyTimeSession) => r.time },
  { header: "Duration (mins)",    accessor: (r: FamilyTimeSession) => r.duration_minutes },
  { header: "Location",           accessor: (r: FamilyTimeSession) => FAMILY_TIME_LOCATION_LABEL[r.location] },
  { header: "Family Member",      accessor: (r: FamilyTimeSession) => r.family_member },
  { header: "Family Member Name", accessor: (r: FamilyTimeSession) => r.family_member_name },
  { header: "Supervised By",      accessor: (r: FamilyTimeSession) => getStaffName(r.supervised_by) },
  { header: "Supervision Level",  accessor: (r: FamilyTimeSession) => FAMILY_TIME_SUPERVISION_LEVEL_LABEL[r.supervision_level] },
  { header: "Presentation Before",accessor: (r: FamilyTimeSession) => FAMILY_TIME_PRESENTATION_LABEL[r.child_presentation_before] },
  { header: "Concerns",           accessor: (r: FamilyTimeSession) => r.concerns_raised.join("; ") },
  { header: "Positives",          accessor: (r: FamilyTimeSession) => r.positive_observations.join("; ") },
  { header: "Child Voice After",  accessor: (r: FamilyTimeSession) => r.child_voice_after },
  { header: "Was It Safe",        accessor: (r: FamilyTimeSession) => (r.was_it_safe ? "Yes" : "No") },
  { header: "Report Sent to SW",  accessor: (r: FamilyTimeSession) => (r.report_sent_to_sw ? "Yes" : "No") },
  { header: "Report Sent Date",   accessor: (r: FamilyTimeSession) => r.report_sent_date },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function FamilyTimeSupervisionPage() {
  const { data: queryData, isLoading } = useFamilyTimeSessions();
  const records = queryData?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterChild, setFilterChild] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    const sessionsThisWeek = records.filter((s) => {
      const dt = new Date(s.date);
      return dt >= weekAgo && dt <= today;
    }).length;

    const childrenWithContact = new Set(records.map((s) => s.child_id)).size;
    const concernsRaised = records.reduce((acc, s) => acc + s.concerns_raised.length, 0);
    const reportsFiled = records.filter((s) => s.report_sent_to_sw).length;

    return { sessionsThisWeek, childrenWithContact, concernsRaised, reportsFiled };
  }, [records]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = records;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        getYPName(s.child_id).toLowerCase().includes(q) ||
        s.family_member_name.toLowerCase().includes(q) ||
        s.family_member.toLowerCase().includes(q),
      );
    }
    if (filterChild !== "all") list = list.filter((s) => s.child_id === filterChild);
    if (filterLevel !== "all") list = list.filter((s) => s.supervision_level === filterLevel);

    const out = [...list];
    switch (sortBy) {
      case "date_desc":
        out.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case "date_asc":
        out.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case "child":
        out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id)));
        break;
      case "concerns":
        out.sort((a, b) => b.concerns_raised.length - a.concerns_raised.length);
        break;
    }
    return out;
  }, [records, search, filterChild, filterLevel, sortBy]);

  return (
    <PageShell
      title="Family Time Supervision"
      subtitle="Detailed records of supervised family time (contact) sessions — interactions, child presentation, concerns and recommendations"
      ariaContext={{ pageTitle: "Family Time Supervision", sourceType: "contact_log" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Family Time Supervision Records" />
          <ExportButton data={records} columns={EXPORT_COLS} filename="family-time-supervision" />
          <AriaStudioQuickActionButton context={{ record_type: "supervision", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area" className="space-y-6">
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Sessions This Week",      value: stats.sessionsThisWeek,    icon: CalendarClock, colour: "text-blue-600" },
          { label: "Children with Contact",   value: stats.childrenWithContact, icon: Users,         colour: "text-indigo-600" },
          { label: "Concerns Raised",         value: stats.concernsRaised,      icon: AlertTriangle, colour: stats.concernsRaised > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Reports Filed",           value: stats.reportsFiled,        icon: FileCheck,     colour: "text-green-600" },
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

      {/* ── filters / sort ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search child or family member…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>

        <Select value={filterChild} onValueChange={setFilterChild}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {["yp_alex", "yp_jordan", "yp_casey"].map((id) => (
              <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {LEVEL_OPTIONS.map((lvl) => (
              <SelectItem key={lvl} value={lvl}>{FAMILY_TIME_SUPERVISION_LEVEL_LABEL[lvl]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Most Recent</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="concerns">Most Concerns</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((s) => {
          const open = expandedId === s.id;
          return (
            <div key={s.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(s.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Heart className="h-4 w-4 text-pink-500" />
                    <h3 className="font-semibold">
                      {getYPName(s.child_id)} — {s.family_member} ({s.family_member_name})
                    </h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", LEVEL_COLOURS[s.supervision_level])}>
                      {FAMILY_TIME_SUPERVISION_LEVEL_LABEL[s.supervision_level]}
                    </span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", PRESENTATION_COLOURS[s.child_presentation_before])}>
                      Before: {FAMILY_TIME_PRESENTATION_LABEL[s.child_presentation_before]}
                    </span>
                    {s.concerns_raised.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {s.concerns_raised.length} concern{s.concerns_raised.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {s.report_sent_to_sw && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 inline-flex items-center gap-1">
                        <FileCheck className="h-3 w-3" /> SW notified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {s.date} · {s.time} · {s.duration_minutes} mins · {FAMILY_TIME_LOCATION_LABEL[s.location]} · supervised by {getStaffName(s.supervised_by)}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* key details */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Family Member:</span> <span className="font-medium">{s.family_member}</span></div>
                    <div><span className="text-gray-500">Name:</span> <span className="font-medium">{s.family_member_name}</span></div>
                    <div><span className="text-gray-500">Location:</span> <span className="font-medium">{FAMILY_TIME_LOCATION_LABEL[s.location]}</span></div>
                    <div><span className="text-gray-500">Duration:</span> <span className="font-medium">{s.duration_minutes} mins</span></div>
                  </div>

                  {/* presentation */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Child Presentation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">Before</p>
                        <p className="text-sm">{FAMILY_TIME_PRESENTATION_LABEL[s.child_presentation_before]}</p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">During</p>
                        <p className="text-sm">{s.child_presentation_during}</p>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">After</p>
                        <p className="text-sm">{s.child_presentation_after}</p>
                      </div>
                    </div>
                  </div>

                  {/* interactions / warmth / boundaries */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-md bg-blue-50 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Interactions Observed</h4>
                      <p className="text-sm text-blue-900">{s.interactions_observed}</p>
                    </div>
                    <div className="rounded-md bg-pink-50 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Warmth &amp; Affection</h4>
                      <p className="text-sm text-pink-900">{s.warmth_affection_shown}</p>
                    </div>
                    <div className="rounded-md bg-purple-50 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Boundary Issues</h4>
                      <p className="text-sm text-purple-900">{s.boundary_issues || "None observed."}</p>
                    </div>
                  </div>

                  {/* positives / concerns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {s.positive_observations.length > 0 && (
                      <div className="rounded-md bg-green-50 p-3">
                        <h4 className="text-xs font-semibold text-green-700 mb-1">Positive Observations</h4>
                        <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                          {s.positive_observations.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    )}
                    {s.concerns_raised.length > 0 && (
                      <div className="rounded-md bg-amber-50 p-3">
                        <h4 className="text-xs font-semibold text-amber-700 mb-1">Concerns Raised</h4>
                        <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                          {s.concerns_raised.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* parent engagement / gifts / food / safety */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500 font-medium">Parent / Family Engagement:</span> {s.parent_engagement}</div>
                    <div className="inline-flex items-center gap-2">
                      <ShieldCheck className={cn("h-4 w-4", s.was_it_safe ? "text-green-600" : "text-red-600")} />
                      <span className="text-gray-500 font-medium">Was it safe?</span>
                      <span className={cn("font-medium", s.was_it_safe ? "text-green-700" : "text-red-700")}>
                        {s.was_it_safe ? "Yes" : "No"}
                      </span>
                    </div>
                    {s.gifts_exchanged && (
                      <div><span className="text-gray-500 font-medium">Gifts Exchanged:</span> {s.gifts_exchanged}</div>
                    )}
                    {s.food_shared_who && (
                      <div><span className="text-gray-500 font-medium">Food Shared:</span> {s.food_shared_who}</div>
                    )}
                  </div>

                  {/* incidents */}
                  {s.incidents_during && (
                    <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
                      <h4 className="text-xs font-semibold text-orange-700 mb-1">Incidents During Session</h4>
                      <p className="text-sm text-orange-800">{s.incidents_during}</p>
                    </div>
                  )}

                  {/* child voice */}
                  {s.child_voice_after && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Voice (After Session)</h4>
                      <p className="text-sm text-pink-800">{s.child_voice_after}</p>
                    </div>
                  )}

                  {/* recommendations */}
                  {s.recommendations_for_next.length > 0 && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Recommendations for Next Session</h4>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                        {s.recommendations_for_next.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* report status */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                    <FileCheck className={cn("h-4 w-4", s.report_sent_to_sw ? "text-green-600" : "text-gray-400")} />
                    {s.report_sent_to_sw
                      ? <span>Report sent to social worker on <span className="font-medium">{s.report_sent_date}</span></span>
                      : <span className="text-amber-700 font-medium">Report not yet sent to social worker</span>}
                  </div>

                  <SmartLinkPanel sourceType="family-time-session" sourceId={s.id} childId={s.child_id} compact />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
            No family time sessions match the current filters.
          </div>
        )}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Regulatory basis:</strong> The Care Planning, Placement and Case Review (England) Regulations 2010 require that arrangements for promoting contact with the child&apos;s family and significant others are recorded and reviewed. Children&apos;s Homes (England) Regulations 2015 — Quality Standard 9 (Positive Relationships, Reg 11) — places a duty on the home to help children develop and maintain positive relationships, and to record interactions, child presentation and any concerns from supervised family time. Reports of supervised contact must be shared with the responsible local authority and inform the child&apos;s care plan and LAC review.
      </div>
      </div>
      )}
      <CareEventsPanel
        title="Care Events — Family Contact"
        category="family_contact"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
