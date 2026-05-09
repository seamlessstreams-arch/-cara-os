"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useFirstRelationshipRecords } from "@/hooks/use-first-relationship-records";
import type { FirstRelationshipRecord } from "@/types/extended";
import {
  FIRST_RELATIONSHIP_STATUS_LABEL,
  CONSENT_EDUCATION_LEVEL_LABEL,
  EXPLOITATION_RISK_SCREEN_LABEL,
} from "@/types/extended";
import {
  Heart,
  Shield,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Users,
  AlertTriangle,
  BookOpen,
  Search,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const statusColour: Record<string, string> = {
  expressing_interest: "bg-purple-100 text-purple-800 border-purple-200",
  first_crush: "bg-pink-100 text-pink-800 border-pink-200",
  early_relationship: "bg-rose-100 text-rose-800 border-rose-200",
  established_first_relationship: "bg-red-100 text-red-800 border-red-200",
  recently_ended: "bg-amber-100 text-amber-800 border-amber-200",
  not_currently_interested: "bg-slate-100 text-slate-800 border-slate-200",
};

const screenColour: Record<string, string> = {
  no_concerns: "bg-emerald-100 text-emerald-800 border-emerald-200",
  watch: "bg-amber-100 text-amber-800 border-amber-200",
  concerns_identified: "bg-orange-100 text-orange-800 border-orange-200",
  active_concerns_escalated: "bg-red-100 text-red-800 border-red-200",
};

const consentColour: Record<string, string> = {
  not_yet_introduced: "bg-slate-100 text-slate-800 border-slate-200",
  foundational: "bg-amber-100 text-amber-800 border-amber-200",
  developing: "bg-blue-100 text-blue-800 border-blue-200",
  confident: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const exportCols: ExportColumn<FirstRelationshipRecord>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Date", accessor: (r) => r.record_date },
  { header: "Status", accessor: (r) => FIRST_RELATIONSHIP_STATUS_LABEL[r.relationship_status] },
  { header: "Partner", accessor: (r) => r.partner_info ?? "—" },
  { header: "Partner Age", accessor: (r) => r.partner_age ?? "—" },
  { header: "Child-Led", accessor: (r) => r.child_led_disclosure ? "Yes" : "No" },
  { header: "Consent Education", accessor: (r) => CONSENT_EDUCATION_LEVEL_LABEL[r.consent_education_level] },
  { header: "Exploitation Screen", accessor: (r) => EXPLOITATION_RISK_SCREEN_LABEL[r.exploitation_risk_screen] },
  { header: "Risk Factors", accessor: (r) => r.risk_factors_noted.join("; ") },
  { header: "Protective Factors", accessor: (r) => r.protective_factors_noted.join("; ") },
  { header: "Support Offered", accessor: (r) => r.support_offered.join("; ") },
  { header: "Child Voice", accessor: (r) => r.child_voice },
  { header: "SW Notified", accessor: (r) => r.social_worker_notified ? "Yes" : "No" },
  { header: "Follow-up", accessor: (r) => r.follow_up_date },
  { header: "Key Worker", accessor: (r) => getStaffName(r.key_worker) },
];

export default function FirstRelationshipSupportPage() {
  const { data: res, isLoading } = useFirstRelationshipRecords();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [search, setSearch] = useState("");
  const [screenFilter, setScreenFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "screen" | "followup">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let r = records.filter((rec) => {
      const matchesSearch =
        !search ||
        getYPName(rec.child_id).toLowerCase().includes(search.toLowerCase()) ||
        FIRST_RELATIONSHIP_STATUS_LABEL[rec.relationship_status].toLowerCase().includes(search.toLowerCase()) ||
        (rec.partner_info ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesScreen = screenFilter === "all" || rec.exploitation_risk_screen === screenFilter;
      return matchesSearch && matchesScreen;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      if (sortBy === "screen") return a.exploitation_risk_screen.localeCompare(b.exploitation_risk_screen);
      if (sortBy === "followup") return a.follow_up_date.localeCompare(b.follow_up_date);
      return b.record_date.localeCompare(a.record_date);
    });
    return r;
  }, [records, search, screenFilter, sortBy]);

  const sevenDaysLater = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const inRelationship = records.filter((r) =>
      ["established_first_relationship", "early_relationship"].includes(r.relationship_status)
    ).length;
    const concerns = records.filter(
      (r) => r.exploitation_risk_screen === "concerns_identified" || r.exploitation_risk_screen === "active_concerns_escalated"
    ).length;
    const watching = records.filter((r) => r.exploitation_risk_screen === "watch").length;
    const followUpsDue = records.filter((r) => r.follow_up_date <= sevenDaysLater).length;
    return { inRelationship, concerns, watching, followUpsDue };
  }, [records, sevenDaysLater]);

  if (isLoading) {
    return (
      <PageShell title="First Relationship Support" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="First Relationship Support"
      ariaContext={{ pageTitle: "First Relationship Support", sourceType: "child_record" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="first-relationship-support" />
          <PrintButton title="First Relationship Support" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Heart className="h-4 w-4" />
            <span>In a relationship</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.inRelationship}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Shield className="h-4 w-4" />
            <span>Watch</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.watching}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span>Concerns flagged</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.concerns}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-600 text-sm mb-1">
            <Users className="h-4 w-4" />
            <span>Follow-ups due (7d)</span>
          </div>
          <div className="text-2xl font-semibold text-slate-900">{stats.followUpsDue}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search young person, status, partner..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select value={screenFilter} onValueChange={setScreenFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Exploitation screen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All screens</SelectItem>
            {Object.entries(EXPLOITATION_RISK_SCREEN_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="name">Young person A-Z</SelectItem>
            <SelectItem value="screen">Risk screen</SelectItem>
            <SelectItem value="followup">Follow-up date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full p-4 flex items-start justify-between gap-3 hover:bg-slate-50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-900">{getYPName(r.child_id)}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", statusColour[r.relationship_status] ?? "bg-slate-100 text-slate-800 border-slate-200")}>
                      {FIRST_RELATIONSHIP_STATUS_LABEL[r.relationship_status]}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", screenColour[r.exploitation_risk_screen] ?? "bg-slate-100 text-slate-800 border-slate-200")}>
                      {EXPLOITATION_RISK_SCREEN_LABEL[r.exploitation_risk_screen]}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", consentColour[r.consent_education_level] ?? "bg-slate-100 text-slate-800 border-slate-200")}>
                      Consent: {CONSENT_EDUCATION_LEVEL_LABEL[r.consent_education_level]}
                    </span>
                    {r.child_led_disclosure ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                        Child-led
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">
                    Recorded {r.record_date} · Follow-up {r.follow_up_date} · {getStaffName(r.key_worker)}
                  </div>
                  {r.partner_info ? (
                    <div className="text-sm text-slate-700 mt-1">{r.partner_info}</div>
                  ) : null}
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" /> Child Voice
                      </div>
                      <p className="text-sm text-slate-700 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Staff Observation</div>
                      <p className="text-sm text-slate-700">{r.staff_observation}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" /> RSE Topics Covered
                      </div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.rse_topics_covered.map((t, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-blue-500">·</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Support Offered</div>
                      <ul className="text-sm text-slate-700 space-y-1">
                        {r.support_offered.map((t, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-emerald-500">·</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {r.protective_factors_noted.length ? (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                        <div className="text-xs font-semibold text-emerald-700 uppercase mb-2">Protective Factors</div>
                        <ul className="text-sm text-emerald-900 space-y-1">
                          {r.protective_factors_noted.map((t, i) => (
                            <li key={i} className="flex gap-2">
                              <span>+</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {r.risk_factors_noted.length ? (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Risk Factors Noted</div>
                        <ul className="text-sm text-amber-900 space-y-1">
                          {r.risk_factors_noted.map((t, i) => (
                            <li key={i} className="flex gap-2">
                              <span>!</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Context &amp; Escalation</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {r.partner_age ? (
                          <div>
                            <span className="text-slate-500">Partner age:</span> <span className="text-slate-800">{r.partner_age}</span>
                            {typeof r.age_gap_ok === "boolean" ? (
                              <span className={cn("ml-2 text-xs", r.age_gap_ok ? "text-emerald-700" : "text-red-700")}>
                                {r.age_gap_ok ? "Age-appropriate" : "Age gap concern"}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        {r.how_they_met ? (
                          <div>
                            <span className="text-slate-500">How met:</span> <span className="text-slate-800">{r.how_they_met}</span>
                          </div>
                        ) : null}
                        {r.parent_carer_involved ? (
                          <div>
                            <span className="text-slate-500">Family aware:</span>{" "}
                            <span className="text-slate-800">{r.parent_carer_involved}</span>
                          </div>
                        ) : null}
                        <div>
                          <span className="text-slate-500">SW notified:</span>{" "}
                          <span className="text-slate-800">{r.social_worker_notified ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <SmartLinkPanel sourceType="first-relationship-records" sourceId={r.id} childId={r.child_id} compact />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-pink-200 bg-pink-50 p-4 text-sm text-pink-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          First relationships are a healthy, age-appropriate part of adolescence. Support is grounded in Quality Standard 9
          (Protection of Children) and the RSE statutory curriculum. Practice is informed by Working Together 2023,
          KCSIE 2024 (contextual safeguarding and CSE/CCE awareness), and the UNCRC Articles 12 (voice) and 16 (privacy).
          Disclosures are child-led, paced by the young person, and identity-affirming. Exploitation screening uses the
          Brook Traffic Light Tool framework. No information is shared with family or social workers without the young
          person&rsquo;s knowledge unless safeguarding thresholds are met.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
