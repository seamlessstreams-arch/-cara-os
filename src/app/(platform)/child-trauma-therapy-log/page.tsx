"use client";

import { useState } from "react";
import {
  Heart,
  Brain,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type {
  TraumaTherapyLog,
  TherapyModality,
  TherapySessionFormat,
  TherapyPresentation,
} from "@/types/extended";
import {
  THERAPY_MODALITY_LABEL,
  THERAPY_SESSION_FORMAT_LABEL,
  THERAPY_PRESENTATION_LABEL,
} from "@/types/extended";
import { useTraumaTherapyLogs } from "@/hooks/use-trauma-therapy-logs";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── colour maps ───────────────────────────────────────────────────── */

const MODALITY_COLOURS: Record<TherapyModality, string> = {
  tf_cbt: "bg-violet-100 text-violet-800",
  emdr: "bg-violet-100 text-violet-800",
  play_therapy: "bg-teal-100 text-teal-800",
  art_therapy: "bg-teal-100 text-teal-800",
  narrative_therapy: "bg-indigo-100 text-indigo-800",
  ddp: "bg-purple-100 text-purple-800",
  theraplay: "bg-purple-100 text-purple-800",
  cbt_general: "bg-blue-100 text-blue-800",
  person_centred: "bg-emerald-100 text-emerald-800",
  sand_tray: "bg-amber-100 text-amber-800",
  mixed: "bg-slate-100 text-[var(--cs-navy)]",
  other: "bg-gray-100 text-gray-700",
};

const PRESENTATION_COLOURS: Record<TherapyPresentation, string> = {
  engaged: "bg-emerald-100 text-emerald-800",
  withdrawn: "bg-slate-100 text-[var(--cs-text-secondary)]",
  avoidant: "bg-amber-100 text-amber-800",
  distressed: "bg-rose-100 text-rose-800",
  mixed: "bg-indigo-100 text-indigo-800",
  building_trust: "bg-teal-100 text-teal-800",
};

/* ── flat row for export ───────────────────────────────────────────── */

interface FlatRow {
  child_id: string;
  session_date: string;
  modality: string;
  therapist_name: string;
  therapist_service: string;
  session_format: string;
  session_length_minutes: string;
  attended: string;
  reason_if_missed: string;
  general_theme_broad: string;
  child_presentation: string;
  pre_session_mood_rating: string;
  post_session_mood_rating: string;
  mood_change: string;
  escalation_flags_count: string;
  child_voice_shared: string;
  staff_observation: string;
  next_session: string;
  recorded_by: string;
}

const exportCols: ExportColumn<FlatRow>[] = [
  { header: "Young Person", accessor: (r: FlatRow) => r.child_id },
  { header: "Session Date", accessor: (r: FlatRow) => r.session_date },
  { header: "Modality", accessor: (r: FlatRow) => r.modality },
  { header: "Therapist", accessor: (r: FlatRow) => r.therapist_name },
  { header: "Service", accessor: (r: FlatRow) => r.therapist_service },
  { header: "Format", accessor: (r: FlatRow) => r.session_format },
  { header: "Length (min)", accessor: (r: FlatRow) => r.session_length_minutes },
  { header: "Attended", accessor: (r: FlatRow) => r.attended },
  { header: "Reason If Missed", accessor: (r: FlatRow) => r.reason_if_missed },
  { header: "General Theme (broad)", accessor: (r: FlatRow) => r.general_theme_broad },
  { header: "Child Presentation", accessor: (r: FlatRow) => r.child_presentation },
  { header: "Pre-Session Mood (1-5)", accessor: (r: FlatRow) => r.pre_session_mood_rating },
  { header: "Post-Session Mood (1-5)", accessor: (r: FlatRow) => r.post_session_mood_rating },
  { header: "Mood Change", accessor: (r: FlatRow) => r.mood_change },
  { header: "Escalation Flags", accessor: (r: FlatRow) => r.escalation_flags_count },
  { header: "Child Voice (if shared)", accessor: (r: FlatRow) => r.child_voice_shared },
  { header: "Staff Observation", accessor: (r: FlatRow) => r.staff_observation },
  { header: "Next Session", accessor: (r: FlatRow) => r.next_session },
  { header: "Recorded By", accessor: (r: FlatRow) => r.recorded_by },
];

/* ── component ─────────────────────────────────────────────────────── */

export default function ChildTraumaTherapyLogPage() {
  const { data: res, isLoading } = useTraumaTherapyLogs();
  const items = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterModality, setFilterModality] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  /* ── loading ──────────────────────────────────────────────────── */
  if (isLoading) return <PageShell title="Child Trauma Therapy Log" subtitle="Per-child trauma therapy attendance and observable presentation — therapeutic content stays in the therapy room"><div /></PageShell>;

  /* ── stats ────────────────────────────────────────────────────── */
  const stats = (() => {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const in14d = new Date();
    in14d.setDate(in14d.getDate() + 14);

    const sessionsThisMonth = items.filter((r) => {
      const sd = new Date(r.session_date);
      return sd >= monthAgo && sd <= today;
    }).length;

    const monthRecords = items.filter((r) => {
      const sd = new Date(r.session_date);
      return sd >= monthAgo && sd <= today;
    });
    const attended = monthRecords.filter((r) => r.attended).length;
    const attendancePct = monthRecords.length === 0 ? 0 : Math.round((attended / monthRecords.length) * 100);

    const escalationFlagsThisMonth = monthRecords.reduce((acc, r) => acc + r.escalation_flags.length, 0);

    const upcoming = items.filter((r) => {
      if (!r.next_session) return false;
      const ns = new Date(r.next_session);
      return ns >= today && ns <= in14d;
    }).length;

    return { sessionsThisMonth, attendancePct, escalationFlagsThisMonth, upcoming };
  })();

  /* ── filter / sort ────────────────────────────────────────────── */
  const filtered = (() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        THERAPY_MODALITY_LABEL[r.modality].toLowerCase().includes(q) ||
        r.therapist_name.toLowerCase().includes(q) ||
        r.therapist_service.toLowerCase().includes(q) ||
        r.general_theme_broad.toLowerCase().includes(q)
      );
    }
    if (filterModality !== "all") list = list.filter((r) => r.modality === filterModality);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.session_date.localeCompare(a.session_date)); break;
      case "child": out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
      case "modality": out.sort((a, b) => a.modality.localeCompare(b.modality)); break;
      case "moodChange": out.sort((a, b) => (b.post_session_mood_rating - b.pre_session_mood_rating) - (a.post_session_mood_rating - a.pre_session_mood_rating)); break;
    }
    return out;
  })();

  /* ── export rows ──────────────────────────────────────────────── */
  const exportRows: FlatRow[] = items.map((r) => ({
    child_id: getYPName(r.child_id),
    session_date: r.session_date,
    modality: THERAPY_MODALITY_LABEL[r.modality],
    therapist_name: r.therapist_name,
    therapist_service: r.therapist_service,
    session_format: THERAPY_SESSION_FORMAT_LABEL[r.session_format],
    session_length_minutes: String(r.session_length_minutes),
    attended: r.attended ? "Attended" : "Missed",
    reason_if_missed: r.reason_if_missed ?? "",
    general_theme_broad: r.general_theme_broad,
    child_presentation: THERAPY_PRESENTATION_LABEL[r.child_presentation],
    pre_session_mood_rating: String(r.pre_session_mood_rating),
    post_session_mood_rating: String(r.post_session_mood_rating),
    mood_change: String(r.post_session_mood_rating - r.pre_session_mood_rating),
    escalation_flags_count: String(r.escalation_flags.length),
    child_voice_shared: r.child_voice_shared ?? "",
    staff_observation: r.staff_observation,
    next_session: r.next_session ?? "",
    recorded_by: getStaffName(r.recorded_by),
  }));

  return (
    <PageShell
      title="Child Trauma Therapy Log"
      subtitle="Per-child trauma therapy attendance and observable presentation — therapeutic content stays in the therapy room"
      ariaContext={{ pageTitle: "Child Trauma Therapy Log", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Trauma Therapy Log" />
          <ExportButton data={exportRows} columns={exportCols} filename="child-trauma-therapy-log" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Sessions this month", value: stats.sessionsThisMonth, icon: Brain, colour: "text-violet-600" },
          { label: "Attendance %", value: `${stats.attendancePct}%`, icon: Heart, colour: stats.attendancePct >= 85 ? "text-emerald-600" : "text-amber-600" },
          { label: "Escalation flags this month", value: stats.escalationFlagsThisMonth, icon: AlertTriangle, colour: stats.escalationFlagsThisMonth > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Sessions next 14d", value: stats.upcoming, icon: Calendar, colour: "text-teal-600" },
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
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 mb-6">
        <div className="flex items-start gap-2">
          <Sparkles className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
          <div>
            <strong>Therapeutic confidence held.</strong> Staff record the broad theme of each session, observable presentation, and the support given between sessions — never the specific disclosures or content of therapy. What the child shares with their therapist stays in that room. This log exists to coordinate care around the work, not to look inside it.
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
            placeholder="Search by child, modality, therapist or theme…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterModality} onValueChange={setFilterModality}>
          <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modalities</SelectItem>
            {(Object.entries(THERAPY_MODALITY_LABEL) as [TherapyModality, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
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
              <SelectItem value="modality">Modality</SelectItem>
              <SelectItem value="moodChange">Mood change</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── records ────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expandedId === r.id;
          const moodDelta = r.post_session_mood_rating - r.pre_session_mood_rating;
          return (
            <div key={r.id} className="rounded-lg border border-violet-100 bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-violet-50/40"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Brain className="h-4 w-4 text-[var(--cs-aria-gold)]" />
                    <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                    <span className="text-sm text-gray-600">— {r.therapist_name}</span>
                    <span className="text-xs text-gray-400">({r.therapist_service})</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", MODALITY_COLOURS[r.modality])}>{THERAPY_MODALITY_LABEL[r.modality]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", PRESENTATION_COLOURS[r.child_presentation])}>{THERAPY_PRESENTATION_LABEL[r.child_presentation]}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      r.attended ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    )}>
                      {r.attended ? "Attended" : "Missed"}
                    </span>
                    {r.attended && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1",
                        moodDelta > 0 ? "bg-teal-100 text-teal-800" : moodDelta < 0 ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-[var(--cs-text-secondary)]"
                      )}>
                        <Heart className="h-3 w-3" />
                        Mood {moodDelta > 0 ? `+${moodDelta}` : moodDelta}
                      </span>
                    )}
                    {r.escalation_flags.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {r.escalation_flags.length} flag{r.escalation_flags.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Session {r.session_date} · {THERAPY_SESSION_FORMAT_LABEL[r.session_format]} · {r.session_length_minutes} min · Recorded by {getStaffName(r.recorded_by)}
                    {r.next_session ? ` · Next ${r.next_session}` : ""}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />}
              </button>

              {open && (
                <div className="border-t border-violet-100 px-4 pb-4 space-y-4">
                  {/* general theme */}
                  <div className="rounded-md bg-gray-50 p-3 mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">General theme (broad — agreed with therapist)</h4>
                    <p className="text-sm">{r.general_theme_broad}</p>
                    {!r.attended && r.reason_if_missed && (
                      <p className="text-xs text-amber-700 mt-2"><strong>Reason missed:</strong> {r.reason_if_missed}</p>
                    )}
                  </div>

                  {/* mood scale */}
                  <div className="rounded-md bg-violet-50 border border-violet-200 p-3">
                    <h4 className="text-xs font-semibold text-violet-700 mb-2">Mood — pre and post session</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-violet-700/80 mb-1">Before</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium",
                              n <= r.pre_session_mood_rating ? "bg-violet-500 text-white" : "bg-violet-100 text-violet-400"
                            )}>{n}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-violet-700/80 mb-1">After</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium",
                              n <= r.post_session_mood_rating ? "bg-teal-500 text-white" : "bg-teal-100 text-teal-400"
                            )}>{n}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* regulation + between-session */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-teal-50 p-3">
                      <h4 className="text-xs font-semibold text-teal-700 mb-1">Regulation strategies used after</h4>
                      {r.regulation_strategies_used_after.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-teal-900 space-y-0.5">
                          {r.regulation_strategies_used_after.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-teal-700/70">None recorded.</p>
                      )}
                    </div>
                    <div className="rounded-md bg-emerald-50 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1">Between-session support</h4>
                      {r.between_session_support ? (
                        <p className="text-sm text-emerald-900">{r.between_session_support}</p>
                      ) : (
                        <p className="text-sm italic text-emerald-700/70">None recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* child voice — only if shared */}
                  {r.child_voice_shared && (
                    <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                      <h4 className="text-xs font-semibold text-rose-700 mb-1">Child&apos;s voice (only what the child chose to share)</h4>
                      <p className="text-sm italic text-rose-900">&ldquo;{r.child_voice_shared}&rdquo;</p>
                    </div>
                  )}

                  {/* staff observation */}
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-xs font-semibold text-amber-700 mb-1">Staff observation (observable presentation only)</h4>
                    <p className="text-sm text-amber-900">{r.staff_observation}</p>
                  </div>

                  {/* escalation flags */}
                  {r.escalation_flags.length > 0 && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Escalation flags
                      </h4>
                      <ul className="list-disc list-inside text-sm text-red-900 space-y-0.5">
                        {r.escalation_flags.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* next session */}
                  {r.next_session && (
                    <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3 inline-flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm text-indigo-900">Next session: <span className="font-medium">{r.next_session}</span></span>
                    </div>
                  )}

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="trauma-therapy-log" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-gray-500">
            No sessions match these filters.
          </div>
        )}
      </div>

      {/* ── regulatory footer ──────────────────────────────────────── */}
      <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-4 text-sm text-violet-900 mb-6">
        <strong>Regulatory framework.</strong> Trauma therapy work in the home is governed by the standards of the practitioner&apos;s registering body — BPS, BACP or UKCP for psychologists and psychotherapists, BAAT for art therapists, and BAPT for play therapists. Specific modalities follow their evidence base: TF-CBT (Cohen, Mannarino &amp; Deblinger), EMDR (EMDR Institute / EMDR UK), and DDP (DDP Network). In line with the Children&apos;s Homes (England) Regulations 2015 — Quality Standard 8 (care planning) — staff hold therapeutic confidence by recording broad themes only, with the explicit consent of the child and the therapist on what gets shared with the home. UNCRC Article 24 (the right to the highest attainable standard of health) underpins our duty to keep these therapies accessible and well-supported between sessions.
      </div>
      <CareEventsPanel
        title="Care Events — Health & Wellbeing"
        category={["health", "wellbeing"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Child Trauma Therapy Log — therapy attendance, therapist, session presentation, observable impact, CAMHS, trauma-informed care, therapeutic relationship, PEP, care plan integration"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
