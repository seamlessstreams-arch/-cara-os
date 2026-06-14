"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Search,
  Heart,
  Shield,
  Users,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  ExternalLink,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useLgbtqInclusionRecords } from "@/hooks/use-lgbtq-inclusion-records";
import type { LgbtqInclusionRecord, OutStatus } from "@/types/extended";
import { OUT_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── UI metadata ─────────────────────────────────────────────────────────── */

const outChip = (status: OutStatus) => {
  switch (status) {
    case "yes": return "bg-emerald-100 text-emerald-800";
    case "selectively": return "bg-teal-100 text-teal-800";
    case "no": return "bg-slate-100 text-[var(--cs-text-secondary)]";
    case "not_yet_decided": return "bg-purple-100 text-purple-800";
  }
};

export default function LGBTQInclusionRecordPage() {
  const { data: res, isLoading } = useLgbtqInclusionRecords();
  const data: LgbtqInclusionRecord[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const childIds = useMemo(() => [...new Set(data.map((r) => r.child_id))], [data]);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.child_id === filterYP);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.identity_as_shared.toLowerCase().includes(q) ||
          r.pronouns.toLowerCase().includes(q) ||
          r.external_support.some((s) => s.toLowerCase().includes(q)),
      );
    }
    items.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.child_id.localeCompare(b.child_id);
        case "review": return a.review_date.localeCompare(b.review_date);
        case "updated": return b.last_updated.localeCompare(a.last_updated);
        default: return 0;
      }
    });
    return items;
  }, [data, search, filterYP, sortBy]);

  const totalPlans = data.length;
  const consistencyCount = data.filter((r) => r.pronouns_used_consistently && r.preferred_name_used_consistently).length;
  const activeSupport = data.filter((r) => r.external_support.length > 0).length;
  const reviewsDue = data.filter((r) => {
    const days = (new Date(r.review_date).getTime() - Date.now()) / 86_400_000;
    return days <= 30;
  }).length;

  const exportCols: ExportColumn<LgbtqInclusionRecord>[] = [
    { header: "Young Person", accessor: (r: LgbtqInclusionRecord) => getYPName(r.child_id) },
    { header: "Identity (as shared)", accessor: (r: LgbtqInclusionRecord) => r.identity_as_shared },
    { header: "Pronouns", accessor: (r: LgbtqInclusionRecord) => r.pronouns },
    { header: "Preferred Name", accessor: (r: LgbtqInclusionRecord) => r.preferred_name ?? "" },
    { header: "Out at School", accessor: (r: LgbtqInclusionRecord) => OUT_STATUS_LABEL[r.out_at_school] },
    { header: "Out to Family", accessor: (r: LgbtqInclusionRecord) => OUT_STATUS_LABEL[r.out_to_family] },
    { header: "Pronouns Used Consistently", accessor: (r: LgbtqInclusionRecord) => (r.pronouns_used_consistently ? "Yes" : "No") },
    { header: "External Support Sources", accessor: (r: LgbtqInclusionRecord) => r.external_support.length.toString() },
    { header: "Last Updated", accessor: (r: LgbtqInclusionRecord) => r.last_updated },
    { header: "Review Date", accessor: (r: LgbtqInclusionRecord) => r.review_date },
    { header: "Key Worker", accessor: (r: LgbtqInclusionRecord) => getStaffName(r.key_worker) },
  ];

  if (isLoading) return <PageShell title="LGBTQ+ Inclusion Record" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="LGBTQ+ Inclusion Record"
      subtitle="Per-child record of identity affirmation, pronouns, allyship and support — child-led, child-paced"
      caraContext={{ pageTitle: "LGBTQ+ Inclusion Record", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="lgbtq-inclusion-record" />
          <PrintButton title="LGBTQ+ Inclusion Record" />
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{totalPlans}</p>
          <p className="text-xs text-muted-foreground">Inclusion Plans</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-teal-700">{consistencyCount}/{totalPlans}</p>
          <p className="text-xs text-muted-foreground">Pronouns / Name Consistency</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{activeSupport}</p>
          <p className="text-xs text-muted-foreground">Active External Support</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{reviewsDue}</p>
          <p className="text-xs text-muted-foreground">Reviews Due (30d)</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-900">
          This record is child-led and child-paced. Identity is shared on the young person&apos;s terms, with the
          people they choose. Staff affirm pronouns and preferred names without conditions, never disclose without
          consent, and never apply pressure to come out — at home, school, or anywhere else.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search identity, pronouns, support…"
            className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
          />
        </div>
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All Children" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map((c) => (
              <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="review">Earliest Review</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Sparkles className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {getYPName(r.child_id)}
                      {r.preferred_name ? ` · ${r.preferred_name.split(" ")[0]}` : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                        {r.identity_as_shared}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-medium">
                        {r.pronouns}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${outChip(r.out_at_school)}`}>
                        School: {OUT_STATUS_LABEL[r.out_at_school]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${outChip(r.out_to_family)}`}>
                        Family: {OUT_STATUS_LABEL[r.out_to_family]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {r.pronouns_used_consistently && r.preferred_name_used_consistently && (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">
                      <MessageCircle className="h-3 w-3 inline mr-1" />
                      Child Voice
                    </p>
                    <p className="text-sm text-purple-900 italic">&ldquo;{r.child_voice}&rdquo;</p>
                  </div>

                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-1">
                      Staff Observation
                    </p>
                    <p className="text-sm text-teal-900">{r.staff_observation}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Users className="h-3 w-3 inline mr-1" />
                        Who Knows (at child&apos;s pace)
                      </p>
                      <ul className="space-y-1">
                        {r.who_knows_at_child_pace.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-purple-600 mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <Shield className="h-3 w-3 inline mr-1" />
                        Identity-Affirming Actions
                      </p>
                      <ul className="space-y-1">
                        {r.identity_affirming_actions.map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Heart className="h-3 w-3 text-purple-500 mt-1 shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {r.challenges_faced.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1">
                        Challenges Faced
                      </p>
                      <ul className="space-y-1">
                        {r.challenges_faced.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <ExternalLink className="h-3 w-3 inline mr-1" />
                      External Support
                    </p>
                    <ul className="space-y-1">
                      {r.external_support.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-teal-600 mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Staff Actions This Month
                    </p>
                    <ul className="space-y-1">
                      {r.staff_actions_this_month.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {r.flags_concerns.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-rose-900 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        Flags / Things to Watch
                      </p>
                      <ul className="space-y-1">
                        {r.flags_concerns.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 text-rose-500 mt-1 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Last updated: {r.last_updated}
                    </span>
                    <span>Review due: {r.review_date}</span>
                    <span>Key worker: {getStaffName(r.key_worker)}</span>
                    {r.pronouns_used_consistently && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                        Pronouns consistent
                      </span>
                    )}
                    {r.preferred_name_used_consistently && (
                      <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-medium">
                        Preferred name consistent
                      </span>
                    )}
                  </div>

                  <SmartLinkPanel sourceType="lgbtq-inclusion-records" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> This record supports the Equality Act 2010 (protected
          characteristics including gender reassignment and sexual orientation), Children&apos;s Homes
          Regulations 2015 Quality Standard 6 (enjoyment and achievement) and Quality Standard 7 (positive
          relationships), Keeping Children Safe in Education 2024 (LGBTQ+ pupils and safeguarding), UNCRC
          Article 8 (right to identity), and Working Together to Safeguard Children 2023 (responding to
          children&apos;s individual needs). All disclosure, contact and visibility decisions remain with the
          young person.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing & Safeguarding"
        category={["wellbeing", "safeguarding"]}
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="LGBTQ+ Inclusion Record — gender identity support, sexual orientation records, pronoun preferences, transition support, peer support, inclusive care plans, equality evidence, Reg 45"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
