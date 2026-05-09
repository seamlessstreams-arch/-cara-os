"use client";

import { useState, useMemo } from "react";
import {
  Shield,
  AlertTriangle,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Eye,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, formatDate } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { PreventScreeningRecord, PreventScreeningOutcome } from "@/types/extended";
import { PREVENT_SCREENING_OUTCOME_LABEL, PREVENT_CHANNEL_STATUS_LABEL } from "@/types/extended";
import { usePreventScreenings } from "@/hooks/use-prevent-screenings";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── colour maps ───────────────────────────────────────────────────────── */

const OUTCOME_COLOURS: Record<string, string> = {
  no_concerns: "bg-emerald-100 text-emerald-800",
  watchful_awareness: "bg-sky-100 text-sky-800",
  concerns_identified_internal_support: "bg-amber-100 text-amber-800",
  channel_discussion_considered: "bg-orange-100 text-orange-800",
  channel_referred: "bg-rose-100 text-rose-800",
  de_escalated_closed: "bg-slate-100 text-slate-700",
};

const CHANNEL_COLOURS: Record<string, string> = {
  considered_not_made: "bg-slate-100 text-slate-700",
  made_accepted: "bg-amber-100 text-amber-800",
  made_rejected: "bg-slate-100 text-slate-700",
  active_panel: "bg-rose-100 text-rose-800",
  closed: "bg-emerald-100 text-emerald-800",
};

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string;
  recordedDate: string;
  screeningOutcome: string;
  vulnerabilityFactorsCount: string;
  protectiveFactorsCount: string;
  identityIdeologyExposureNotes: string;
  onlineActivityFlagsCount: string;
  peerGroupNotes: string;
  childVoiceConsulted: string;
  childVoice: string;
  staffObservation: string;
  externalConsultationCount: string;
  channelReferralStatus: string;
  proportionalityReflection: string;
  reviewDate: string;
  flagsForReview: string;
  recordedBy: string;
}

const exportCols: ExportColumn<FlatRow>[] = [
  { header: "Young Person", accessor: (r: FlatRow) => r.youngPerson },
  { header: "Recorded Date", accessor: (r: FlatRow) => r.recordedDate },
  { header: "Screening Outcome", accessor: (r: FlatRow) => r.screeningOutcome },
  { header: "Vulnerability Factors", accessor: (r: FlatRow) => r.vulnerabilityFactorsCount },
  { header: "Protective Factors", accessor: (r: FlatRow) => r.protectiveFactorsCount },
  { header: "Identity / Ideology Notes", accessor: (r: FlatRow) => r.identityIdeologyExposureNotes },
  { header: "Online Activity Flags", accessor: (r: FlatRow) => r.onlineActivityFlagsCount },
  { header: "Peer Group Notes", accessor: (r: FlatRow) => r.peerGroupNotes },
  { header: "Child Voice Consulted", accessor: (r: FlatRow) => r.childVoiceConsulted },
  { header: "Child Voice", accessor: (r: FlatRow) => r.childVoice },
  { header: "Staff Observation", accessor: (r: FlatRow) => r.staffObservation },
  { header: "External Consultations", accessor: (r: FlatRow) => r.externalConsultationCount },
  { header: "Channel Referral Status", accessor: (r: FlatRow) => r.channelReferralStatus },
  { header: "Proportionality Reflection", accessor: (r: FlatRow) => r.proportionalityReflection },
  { header: "Review Date", accessor: (r: FlatRow) => r.reviewDate },
  { header: "Flags For Review", accessor: (r: FlatRow) => r.flagsForReview },
  { header: "Recorded By", accessor: (r: FlatRow) => r.recordedBy },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildPreventRadicalisationScreeningPage() {
  const { data: res, isLoading } = usePreventScreenings();
  const items = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterOutcome, setFilterOutcome] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const today = new Date();
    const in90d = new Date();
    in90d.setDate(in90d.getDate() + 90);

    const activeScreenings = items.length;
    const watchfulAwareness = items.filter((r) => r.screening_outcome === "watchful_awareness").length;
    const channelReferrals = items.filter((r) =>
      r.channel_referral_status === "made_accepted" ||
      r.channel_referral_status === "active_panel" ||
      r.channel_referral_status === "made_rejected"
    ).length;
    const reviewsDue = items.filter((r) => {
      const rv = new Date(r.review_date);
      return rv >= today && rv <= in90d;
    }).length;

    return { activeScreenings, watchfulAwareness, channelReferrals, reviewsDue };
  }, [items]);

  /* ── filter / sort ────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        (PREVENT_SCREENING_OUTCOME_LABEL[r.screening_outcome] ?? "").toLowerCase().includes(q) ||
        r.staff_observation.toLowerCase().includes(q) ||
        r.proportionality_reflection.toLowerCase().includes(q) ||
        (r.peer_group_notes ?? "").toLowerCase().includes(q) ||
        (r.identity_ideology_exposure_notes ?? "").toLowerCase().includes(q)
      );
    }
    if (filterOutcome !== "all") list = list.filter((r) => r.screening_outcome === filterOutcome);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.recorded_date.localeCompare(a.recorded_date)); break;
      case "child": out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
      case "outcome": out.sort((a, b) => a.screening_outcome.localeCompare(b.screening_outcome)); break;
      case "review": out.sort((a, b) => a.review_date.localeCompare(b.review_date)); break;
    }
    return out;
  }, [items, search, filterOutcome, sortBy]);

  /* ── export rows ──────────────────────────────────────────────────── */
  const exportRows = useMemo<FlatRow[]>(() =>
    items.map((r) => ({
      youngPerson: getYPName(r.child_id),
      recordedDate: formatDate(r.recorded_date),
      screeningOutcome: PREVENT_SCREENING_OUTCOME_LABEL[r.screening_outcome] ?? r.screening_outcome,
      vulnerabilityFactorsCount: String(r.vulnerability_factors_considered.length),
      protectiveFactorsCount: String(r.protective_factors_considered.length),
      identityIdeologyExposureNotes: r.identity_ideology_exposure_notes ?? "",
      onlineActivityFlagsCount: String(r.online_activity_flags.length),
      peerGroupNotes: r.peer_group_notes ?? "",
      childVoiceConsulted: r.child_voice_consulted ? "Yes" : "No",
      childVoice: r.child_voice ?? "",
      staffObservation: r.staff_observation,
      externalConsultationCount: String(r.external_consultation.length),
      channelReferralStatus: r.channel_referral_status ? (PREVENT_CHANNEL_STATUS_LABEL[r.channel_referral_status] ?? r.channel_referral_status) : "",
      proportionalityReflection: r.proportionality_reflection,
      reviewDate: formatDate(r.review_date),
      flagsForReview: r.flags_for_review ?? "",
      recordedBy: getStaffName(r.recorded_by),
    })), [items]);

  if (isLoading) {
    return <PageShell title="Child Prevent Radicalisation Screening" subtitle="Loading…"><div /></PageShell>;
  }

  return (
    <PageShell
      title="Child Prevent Radicalisation Screening"
      subtitle="Per-child Prevent duty screening — child-rights based, proportionate, and explicit about not conflating identity with risk"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Prevent Screening" />
          <ExportButton data={exportRows} columns={exportCols} filename="child-prevent-radicalisation-screening" />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active screenings", value: stats.activeScreenings, icon: Shield, colour: "text-sky-600" },
          { label: "Watchful awareness", value: stats.watchfulAwareness, icon: Eye, colour: stats.watchfulAwareness > 0 ? "text-sky-600" : "text-gray-400" },
          { label: "Channel referrals", value: stats.channelReferrals, icon: AlertTriangle, colour: stats.channelReferrals > 0 ? "text-rose-600" : "text-gray-400" },
          { label: "Reviews due (90d)", value: stats.reviewsDue, icon: ShieldCheck, colour: "text-teal-600" },
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
      <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 mb-6">
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <strong>Proportionate, child-rights based screening.</strong> The Prevent duty applies to every child in our care — the question is asked routinely. The answer must be honest and proportionate. We do not conflate faith identity, gender identity or normal teenage interests with risk. Vulnerability indicators are informed by BRIEF and ERG22+ frames but are never deterministic. The most important section on each record is the proportionality reflection — it is where we examine whether we are applying the duty rightly.
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
            placeholder="Search by child, outcome, observation or reflection…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterOutcome} onValueChange={setFilterOutcome}>
          <SelectTrigger className="w-[260px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            {Object.entries(PREVENT_SCREENING_OUTCOME_LABEL).map(([val, label]) => (
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
              <SelectItem value="outcome">Outcome</SelectItem>
              <SelectItem value="review">Review date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── records ────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-sky-100 bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-sky-50/40"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Shield className="h-4 w-4 text-sky-500" />
                    <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                    <span className="text-xs text-gray-500">— recorded {formatDate(r.recorded_date)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", OUTCOME_COLOURS[r.screening_outcome])}>
                      {PREVENT_SCREENING_OUTCOME_LABEL[r.screening_outcome]}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1",
                      r.child_voice_consulted ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"
                    )}>
                      {r.child_voice_consulted ? "Child voice consulted" : "Child voice not consulted"}
                    </span>
                    {r.channel_referral_status && (
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", CHANNEL_COLOURS[r.channel_referral_status])}>
                        Channel: {PREVENT_CHANNEL_STATUS_LABEL[r.channel_referral_status]}
                      </span>
                    )}
                    {r.flags_for_review && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> 1 review flag
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Review {formatDate(r.review_date)} · Recorded by {getStaffName(r.recorded_by)}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />}
              </button>

              {open && (
                <div className="border-t border-sky-100 px-4 pb-4 space-y-4">
                  {/* vulnerability + protective — two column */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="rounded-md bg-amber-50 border border-amber-100 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Vulnerability factors considered</h4>
                      {r.vulnerability_factors_considered.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">
                          {r.vulnerability_factors_considered.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-amber-700/70">None identified.</p>
                      )}
                      <p className="text-[11px] text-amber-700/70 mt-2 italic">BRIEF / ERG22+ informed — never deterministic.</p>
                    </div>
                    <div className="rounded-md bg-emerald-50 border border-emerald-100 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1">Protective factors considered</h4>
                      {r.protective_factors_considered.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-emerald-900 space-y-0.5">
                          {r.protective_factors_considered.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-emerald-700/70">None recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* identity / ideology */}
                  {r.identity_ideology_exposure_notes && (
                    <div className="rounded-md bg-indigo-50 border border-indigo-200 p-3">
                      <h4 className="text-xs font-semibold text-indigo-700 mb-1">Identity and ideology exposure — context</h4>
                      <p className="text-sm text-indigo-900">{r.identity_ideology_exposure_notes}</p>
                    </div>
                  )}

                  {/* online activity */}
                  <div className="rounded-md bg-sky-50 border border-sky-200 p-3">
                    <h4 className="text-xs font-semibold text-sky-700 mb-1">Online activity flags</h4>
                    {r.online_activity_flags.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-sky-900 space-y-0.5">
                        {r.online_activity_flags.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    ) : (
                      <p className="text-sm italic text-sky-700/70">None flagged.</p>
                    )}
                  </div>

                  {/* peer group */}
                  {r.peer_group_notes && (
                    <div className="rounded-md bg-teal-50 border border-teal-100 p-3">
                      <h4 className="text-xs font-semibold text-teal-700 mb-1">Peer group notes</h4>
                      <p className="text-sm text-teal-900">{r.peer_group_notes}</p>
                    </div>
                  )}

                  {/* child voice — only if consulted and shared */}
                  {r.child_voice_consulted && r.child_voice && (
                    <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                      <h4 className="text-xs font-semibold text-rose-700 mb-1">Child&apos;s voice (consulted)</h4>
                      <p className="text-sm italic text-rose-900">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                  )}

                  {/* staff observation */}
                  <div className="rounded-md bg-slate-50 border border-slate-200 p-3">
                    <h4 className="text-xs font-semibold text-slate-700 mb-1">Staff observation</h4>
                    <p className="text-sm text-slate-900">{r.staff_observation}</p>
                  </div>

                  {/* external consultation */}
                  {r.external_consultation.length > 0 && (
                    <div className="rounded-md bg-violet-50 border border-violet-200 p-3">
                      <h4 className="text-xs font-semibold text-violet-700 mb-1">External consultation</h4>
                      <ul className="text-sm text-violet-900 space-y-1.5">
                        {r.external_consultation.map((c, i) => (
                          <li key={i} className="border-l-2 border-violet-300 pl-2">
                            <p className="font-medium">{c.agency}{c.clinician ? ` — ${c.clinician}` : ""} · {formatDate(c.date)}</p>
                            <p className="text-violet-800/90">{c.outcome}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* channel referral status */}
                  {r.channel_referral_status && (
                    <div className="rounded-md bg-orange-50 border border-orange-200 p-3 inline-flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm text-orange-900">Channel referral: <span className="font-medium">{PREVENT_CHANNEL_STATUS_LABEL[r.channel_referral_status]}</span></span>
                    </div>
                  )}

                  {/* proportionality reflection — highlighted */}
                  <div className="rounded-md bg-gradient-to-br from-sky-50 to-teal-50 border-2 border-sky-300 p-4">
                    <h4 className="text-xs font-semibold text-sky-800 mb-1 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" /> Proportionality reflection
                    </h4>
                    <p className="text-sm text-sky-950 leading-relaxed">{r.proportionality_reflection}</p>
                  </div>

                  {/* flags for review */}
                  {r.flags_for_review && (
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Flags for review
                      </h4>
                      <p className="text-sm text-amber-900">{r.flags_for_review}</p>
                    </div>
                  )}

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="prevent-screenings" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-gray-500">
            No screenings match these filters.
          </div>
        )}
      </div>

      {/* ── regulatory footer ──────────────────────────────────────── */}
      <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-4 text-sm text-sky-900 mb-6">
        <strong>Regulatory framework.</strong> The Prevent duty is set out in the Counter-Terrorism and Security Act 2015 (s.26) and operationalised through the Prevent Duty Guidance (DfE, updated 2023) and the Channel Process (HMG 2020). Per-child screening is integrated with our wider safeguarding approach under KCSIE 2024 and Working Together to Safeguard Children 2023. We apply the duty in a way that is consistent with the Equality Act 2010 — particularly the protected characteristics of race and of religion or belief — and in awareness of successive David Anderson reviews of Prevent, which document the risks of disproportionate application. The screening contributes to evidence under the Children&apos;s Homes (England) Regulations 2015 — Quality Standard 9 (protection of children) — while honouring UNCRC Article 12 (the child&apos;s right to be heard), Article 14 (freedom of thought, conscience and religion) and Article 19 (protection from harm). This page exists to ensure the duty is applied; it exists equally to ensure it is not over-applied.
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
