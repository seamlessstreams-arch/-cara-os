"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  BookOpen,
  Heart,
  Shield,
  Users,
  Star,
  CheckCircle,
  Lightbulb,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChildFriendlyPolicy } from "@/types/extended";
import { POLICY_AREA_LABEL, POLICY_AUDIENCE_AGE_LABEL, POLICY_FORMAT_LABEL } from "@/types/extended";
import type { PolicyArea, PolicyFormat } from "@/types/extended";
import { useChildFriendlyPolicies } from "@/hooks/use-child-friendly-policies";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── config ──────────────────────────────────────────────────────────────────
const areaIcons: Record<string, typeof BookOpen> = {
  safety: Shield,
  behaviour: Heart,
  voice: Users,
  privacy: Eye,
  health: Heart,
  education: BookOpen,
  wellbeing: Heart,
  rights: Star,
};

const areaColour: Record<string, string> = {
  safety: "bg-red-100 text-red-800",
  behaviour: "bg-purple-100 text-purple-800",
  voice: "bg-blue-100 text-blue-800",
  privacy: "bg-slate-100 text-slate-800",
  health: "bg-green-100 text-green-800",
  education: "bg-amber-100 text-amber-800",
  wellbeing: "bg-pink-100 text-pink-800",
  rights: "bg-emerald-100 text-emerald-800",
};

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<ChildFriendlyPolicy>[] = [
  { header: "Title", accessor: (r: ChildFriendlyPolicy) => r.title },
  { header: "Area", accessor: (r: ChildFriendlyPolicy) => POLICY_AREA_LABEL[r.area] },
  { header: "Audience", accessor: (r: ChildFriendlyPolicy) => POLICY_AUDIENCE_AGE_LABEL[r.audience_age] },
  { header: "Format", accessor: (r: ChildFriendlyPolicy) => POLICY_FORMAT_LABEL[r.format] },
  { header: "Parent Policy", accessor: (r: ChildFriendlyPolicy) => r.parent_policy_name },
  { header: "Version", accessor: (r: ChildFriendlyPolicy) => r.child_friendly_version },
  { header: "Last Updated", accessor: (r: ChildFriendlyPolicy) => r.last_updated },
  { header: "Reviewed With Children", accessor: (r: ChildFriendlyPolicy) => r.reviewed_with_children_date },
  { header: "Authored By", accessor: (r: ChildFriendlyPolicy) => getStaffName(r.authored_by) },
];

// ── component ───────────────────────────────────────────────────────────────
export default function ChildFriendlyPoliciesPage() {
  const { data: res, isLoading } = useChildFriendlyPolicies();
  const items = res?.data ?? [];

  const [filterArea, setFilterArea] = useState("all");
  const [filterFormat, setFilterFormat] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterArea !== "all") list = list.filter((p) => p.area === filterArea);
    if (filterFormat !== "all") list = list.filter((p) => p.format === filterFormat);

    list.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "updated":
          return b.last_updated.localeCompare(a.last_updated);
        case "area":
          return a.area.localeCompare(b.area);
        default:
          return 0;
      }
    });
    return list;
  }, [items, filterArea, filterFormat, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10);

  const totalPolicies = items.length;
  const coProduced = items.filter((p) => p.child_co_production_contributors.length > 0).length;
  const reviewedRecently = items.filter((p) => p.reviewed_with_children_date >= ninetyDaysAgoStr).length;
  const areasCovered = new Set(items.map((p) => p.area)).size;

  if (isLoading) {
    return <PageShell title="Child-Friendly Policies" subtitle="Plain-language, accessible policies — co-produced with children, designed to be read by them"><p>Loading…</p></PageShell>;
  }

  return (
    <PageShell
      title="Child-Friendly Policies"
      subtitle="Plain-language, accessible policies — co-produced with children, designed to be read by them"
      ariaContext={{ pageTitle: "Child-Friendly Policies", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="child-friendly-policies" />
          <PrintButton title="Child-Friendly Policies" />
          <AriaStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalPolicies}</p>
          <p className="text-xs text-muted-foreground">Total Policies</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{coProduced}</p>
          <p className="text-xs text-muted-foreground">Co-Produced</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{reviewedRecently}</p>
          <p className="text-xs text-muted-foreground">Reviewed (90 days)</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{areasCovered}</p>
          <p className="text-xs text-muted-foreground">Areas Covered</p>
        </div>
      </div>

      {/* ── philosophy banner ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
        <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          A policy a child can&apos;t read isn&apos;t a policy that protects them. Every parent policy has a
          child-friendly version. They&apos;re displayed around the home, in welcome packs, and reviewed with
          children — never just a box-ticking exercise.
        </p>
      </div>

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Areas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {(Object.keys(POLICY_AREA_LABEL) as PolicyArea[]).map((key) => (
              <SelectItem key={key} value={key}>{POLICY_AREA_LABEL[key]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterFormat} onValueChange={setFilterFormat}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Formats" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            {(Object.keys(POLICY_FORMAT_LABEL) as PolicyFormat[]).map((key) => (
              <SelectItem key={key} value={key}>{POLICY_FORMAT_LABEL[key]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="title">By Title</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
              <SelectItem value="area">By Area</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── policy cards ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No policies match your filters.</div>
        )}
        {filtered.map((policy) => {
          const isExpanded = expandedId === policy.id;
          const AreaIcon = areaIcons[policy.area] || BookOpen;

          return (
            <div key={policy.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : policy.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <AreaIcon className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{policy.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {policy.parent_policy_name} ({policy.parent_policy_version}) &middot; {POLICY_FORMAT_LABEL[policy.format]} &middot; {POLICY_AUDIENCE_AGE_LABEL[policy.audience_age]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", areaColour[policy.area])}>
                    {POLICY_AREA_LABEL[policy.area]}
                  </span>
                  {policy.child_co_production_contributors.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Co-produced</span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Plain-English Summary</p>
                    <p className="text-sm text-amber-900">{policy.plain_english_summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What This Means</p>
                      <ul className="space-y-1">
                        {policy.what_this_means.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What You Can Expect</p>
                      <ul className="space-y-1">
                        {policy.what_you_can_expect.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Your Rights</p>
                      <ul className="space-y-1">
                        {policy.your_rights.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Star className="h-3 w-3 text-emerald-500 mt-1 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Your Responsibilities</p>
                      <ul className="space-y-1">
                        {policy.your_responsibilities.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Who Can Help</p>
                    <ul className="space-y-1">
                      {policy.who_can_help.map((h, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Heart className="h-3 w-3 text-pink-500 mt-1 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Children&apos;s Feedback</p>
                    <p className="text-sm text-purple-900 italic">&ldquo;{policy.child_feedback}&rdquo;</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Last updated: {policy.last_updated}</span>
                    <span>Reviewed with children: {policy.reviewed_with_children_date}</span>
                    <span>Authored: {getStaffName(policy.authored_by)}</span>
                    <span>Co-produced with: {policy.child_co_production_contributors.length} young {policy.child_co_production_contributors.length === 1 ? "person" : "people"}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Child-friendly policies meet UNCRC Article 12 (right to be heard),
          Article 17 (access to information), and Quality Standard 1 (child-centred care). Policies are
          co-produced with children where possible, displayed around the home, included in welcome packs, and
          reviewed in children&apos;s meetings. Provided in accessible formats per Equality Act 2010.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Child-Friendly Policies — simplified policy guides for children, house rules explained, complaint process for children, rights guides, information about staying safe, participation"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
