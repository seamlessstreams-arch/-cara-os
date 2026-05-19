"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useChosenFamilyRecords } from "@/hooks/use-chosen-family-records";
import type { ChosenFamilyRecord } from "@/types/extended";
import {
  CHOSEN_FAMILY_RELATIONSHIP_LABEL,
  CHOSEN_FAMILY_CONTACT_FREQUENCY_LABEL,
  CHOSEN_FAMILY_IMPORTANCE_LABEL,
} from "@/types/extended";
import {
  Heart,
  Users,
  Phone,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Search,
  Star,
  Shield,
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
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

const relationshipColour: Record<string, string> = {
  mentor: "bg-purple-100 text-purple-800",
  coach: "bg-amber-100 text-amber-800",
  teacher: "bg-blue-100 text-blue-800",
  faith_leader: "bg-emerald-100 text-emerald-800",
  neighbour: "bg-rose-100 text-rose-800",
  family_friend: "bg-pink-100 text-pink-800",
  ex_foster_carer: "bg-indigo-100 text-indigo-800",
  grandparent_figure: "bg-orange-100 text-orange-800",
  older_friend: "bg-cyan-100 text-cyan-800",
  sports_club_leader: "bg-yellow-100 text-yellow-800",
  other_significant_adult: "bg-slate-100 text-[var(--cs-navy)]",
};

const importanceColour: Record<string, string> = {
  significant: "bg-rose-50 text-rose-700 border border-rose-200",
  very_significant: "bg-rose-100 text-rose-800 border border-rose-300",
  like_family: "bg-purple-100 text-purple-800 border border-purple-300",
  central_figure: "bg-amber-100 text-amber-900 border border-amber-300",
};

const exportCols: ExportColumn<ChosenFamilyRecord>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Person", accessor: (r) => r.person_name },
  { header: "Relationship", accessor: (r) => CHOSEN_FAMILY_RELATIONSHIP_LABEL[r.relationship] },
  { header: "Years Known", accessor: (r) => r.years_known },
  { header: "Frequency", accessor: (r) => CHOSEN_FAMILY_CONTACT_FREQUENCY_LABEL[r.contact_frequency] },
  { header: "Importance", accessor: (r) => CHOSEN_FAMILY_IMPORTANCE_LABEL[r.importance_to_child] },
  { header: "Safeguarding Checked", accessor: (r) => r.safeguarding_checked ? "Yes" : "No" },
  { header: "Safeguarding Date", accessor: (r) => r.safeguarding_check_date ?? "—" },
  { header: "Child Initiated", accessor: (r) => r.child_initiated_relationship ? "Yes" : "No" },
  { header: "Reciprocal", accessor: (r) => r.reciprocal ? "Yes" : "No" },
  { header: "Review Date", accessor: (r) => r.review_date },
  { header: "Key Worker", accessor: (r) => getStaffName(r.key_worker) },
];

export default function ChosenFamilyTrackerPage() {
  const { data: res, isLoading } = useChosenFamilyRecords();
  const records = useMemo(() => res?.data ?? [], [res]);

  const [search, setSearch] = useState("");
  const [filterRel, setFilterRel] = useState("all");
  const [sortBy, setSortBy] = useState("importance");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          r.person_name.toLowerCase().includes(q) ||
          getYPName(r.child_id).toLowerCase().includes(q) ||
          CHOSEN_FAMILY_RELATIONSHIP_LABEL[r.relationship].toLowerCase().includes(q) ||
          r.how_met.toLowerCase().includes(q),
      );
    }
    if (filterRel !== "all") items = items.filter((r) => r.relationship === filterRel);

    const importanceRank: Record<string, number> = {
      central_figure: 4,
      like_family: 3,
      very_significant: 2,
      significant: 1,
    };

    items.sort((a, b) => {
      switch (sortBy) {
        case "importance":
          return (importanceRank[b.importance_to_child] ?? 0) - (importanceRank[a.importance_to_child] ?? 0);
        case "years":
          return b.years_known - a.years_known;
        case "child":
          return a.child_id.localeCompare(b.child_id);
        case "review":
          return a.review_date.localeCompare(b.review_date);
        default:
          return 0;
      }
    });
    return items;
  }, [records, search, filterRel, sortBy]);

  const total = records.length;
  const centralFigures = records.filter((r) => r.importance_to_child === "central_figure" || r.importance_to_child === "like_family").length;
  const safeguarded = records.filter((r) => r.safeguarding_checked).length;
  const weeklyOrMore = records.filter((r) => r.contact_frequency === "daily" || r.contact_frequency === "weekly").length;

  if (isLoading) {
    return (
      <PageShell title="Chosen Family Tracker" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cs-text-muted)]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Chosen Family Tracker"
      subtitle="Significant non-family adults in each child's life — chosen family is real family"
      ariaContext={{ pageTitle: "Chosen Family", sourceType: "contact_log" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="chosen-family-tracker" />
          <PrintButton title="Chosen Family" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <Users className="h-5 w-5 text-rose-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Significant Adults Tracked</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <Heart className="h-5 w-5 text-purple-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-purple-600">{centralFigures}</p>
          <p className="text-xs text-muted-foreground">Central / Like Family</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <Shield className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-600">{safeguarded}/{total}</p>
          <p className="text-xs text-muted-foreground">Safeguarding Checked</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <Phone className="h-5 w-5 text-amber-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-600">{weeklyOrMore}</p>
          <p className="text-xs text-muted-foreground">Contact This Month</p>
        </div>
      </div>

      <div className="rounded-lg bg-gradient-to-r from-rose-50 via-purple-50 to-amber-50 border border-rose-200 p-4 mb-6 flex items-start gap-3">
        <Heart className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-rose-900 font-medium mb-1">Family is more than blood.</p>
          <p className="text-sm text-rose-800">
            Chosen family — mentors, coaches, teachers, neighbours, faith elders, ex-carers — is a real
            protective factor for children in care, and especially for LGBTQ+ young people. We track these
            relationships, safeguard them properly, and treat them with the seriousness they deserve.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by person, child, or how they met..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-md border bg-white"
          />
        </div>
        <Select value={filterRel} onValueChange={setFilterRel}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Relationships" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Relationships</SelectItem>
            {Object.entries(CHOSEN_FAMILY_RELATIONSHIP_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="importance">By Importance</SelectItem>
              <SelectItem value="years">Years Known</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="review">Next Review</SelectItem>
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
                className="w-full flex items-center justify-between p-4 text-left hover:bg-rose-50/40 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Heart className="h-5 w-5 text-rose-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {getYPName(r.child_id)} &mdash; {r.person_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.years_known} {r.years_known === 1 ? "year" : "years"} known &middot; {CHOSEN_FAMILY_CONTACT_FREQUENCY_LABEL[r.contact_frequency].toLowerCase()} contact &middot; key worker {getStaffName(r.key_worker)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3 flex-wrap justify-end">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", relationshipColour[r.relationship])}>
                    {CHOSEN_FAMILY_RELATIONSHIP_LABEL[r.relationship]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-[var(--cs-text-secondary)]">
                    {CHOSEN_FAMILY_CONTACT_FREQUENCY_LABEL[r.contact_frequency]}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", importanceColour[r.importance_to_child])}>
                    {CHOSEN_FAMILY_IMPORTANCE_LABEL[r.importance_to_child]}
                  </span>
                  {r.safeguarding_checked && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                      <Shield className="h-3 w-3" />Safeguarded
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-rose-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide mb-1">How They Met</p>
                      <p className="text-sm">{r.how_met}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <Star className="h-3 w-3 inline mr-1" />Role Played in Child&apos;s Life
                      </p>
                      <ul className="text-sm space-y-0.5">
                        {r.role_played.map((role, i) => (
                          <li key={i}>&middot; {role}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Child&apos;s Voice — Why This Person Matters</p>
                    <p className="text-sm italic text-purple-900">&ldquo;{r.child_voice}&rdquo;</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Staff Observation</p>
                    <p className="text-sm">{r.staff_observation}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-cyan-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-cyan-800 uppercase tracking-wide mb-1">
                        <Phone className="h-3 w-3 inline mr-1" />Contact Types
                      </p>
                      <ul className="text-sm space-y-0.5">
                        {r.contact_type.map((c, i) => (
                          <li key={i}>&middot; {c}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                        <Shield className="h-3 w-3 inline mr-1" />Safeguarding
                      </p>
                      <p className="text-sm">
                        {r.safeguarding_checked
                          ? `Checked ${r.safeguarding_check_date ?? ""} — appropriate boundaries verified`
                          : "Not yet checked — to be progressed"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Protective Factors</p>
                      {r.protective_factors.length > 0 ? (
                        <ul className="text-sm space-y-0.5">
                          {r.protective_factors.map((p, i) => (
                            <li key={i}>&middot; {p}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">None recorded</p>
                      )}
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide mb-1">Risk Factors</p>
                      {r.risk_factors.length > 0 ? (
                        <ul className="text-sm space-y-0.5">
                          {r.risk_factors.map((rf, i) => (
                            <li key={i}>&middot; {rf}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">None identified</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", r.child_initiated_relationship ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-[var(--cs-text-secondary)]")}>
                      {r.child_initiated_relationship ? "Child sought this relationship" : "Adult-introduced, child embraced"}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", r.reciprocal ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                      {r.reciprocal ? "Reciprocal relationship" : "One-sided — monitor"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
                      Next review: {r.review_date}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-[var(--cs-text-secondary)]">
                      Key worker: {getStaffName(r.key_worker)}
                    </span>
                  </div>

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="chosen-family-records" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Quality Standard 7 (Positive Relationships) &middot; Working
          Together to Safeguard Children 2023 &middot; UNCRC Articles 8 (identity) and 12 (voice) &middot;
          Care Planning Regulations 2010 duty to maintain &ldquo;important relationships&rdquo; &middot;
          contextual safeguarding (Carlene Firmin). Linked to Family Contact, Attachment Profiles, Life Story
          Work, Cultural &amp; Religious Identity, and PEP records.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Family Contact"
        category="family_contact"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Chosen Family — significant relationships, friendships, mentors, support network, identity, belonging, placement stability, independence, contact arrangements, care plan"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
