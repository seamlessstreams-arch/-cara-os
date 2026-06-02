"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Heart,
  Shield,
  CalendarClock,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type {
  FriendshipMap,
  FriendEntry,
  FriendAgeCategory,
  FriendContext as FriendContextType,
  FriendshipQuality,
  FriendContactType,
  IsolationRisk,
} from "@/types/extended";
import {
  FRIEND_AGE_CATEGORY_LABEL,
  FRIEND_CONTEXT_LABEL,
  FRIENDSHIP_QUALITY_LABEL,
  FRIEND_CONTACT_TYPE_LABEL,
  ISOLATION_RISK_LABEL,
} from "@/types/extended";
import { useFriendshipMaps } from "@/hooks/use-friendship-maps";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────── */

const QUALITY_COLOURS: Record<FriendshipQuality, string> = {
  strong_positive: "bg-green-100 text-green-800",
  developing: "bg-blue-100 text-blue-800",
  casual: "bg-gray-100 text-gray-700",
  some_concerns: "bg-amber-100 text-amber-800",
  significant_concerns: "bg-red-100 text-red-800",
};

const RISK_COLOURS: Record<IsolationRisk, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const CONTEXT_COLOURS: Record<FriendContextType, string> = {
  school: "bg-blue-50 text-blue-700",
  sport_club: "bg-emerald-50 text-emerald-700",
  care_system_peer: "bg-purple-50 text-purple-700",
  cultural_community: "bg-pink-50 text-pink-700",
  online: "bg-indigo-50 text-indigo-700",
  neighbourhood: "bg-teal-50 text-teal-700",
  family_network: "bg-amber-50 text-amber-700",
};

/* ── export ───────────────────────────────────────────────────────────── */

const EXPORT_COLS: ExportColumn<FriendshipMap>[] = [
  { header: "Young Person",          accessor: (r: FriendshipMap) => getYPName(r.child_id) },
  { header: "Map Date",               accessor: (r: FriendshipMap) => r.map_date },
  { header: "Friends Mapped",         accessor: (r: FriendshipMap) => r.friends.length },
  { header: "Strong Friendships",     accessor: (r: FriendshipMap) => r.friends.filter((f) => f.quality_of_relationship === "strong_positive").length },
  { header: "Concerns Flagged",       accessor: (r: FriendshipMap) => r.friends.filter((f) => f.quality_of_relationship === "some_concerns" || f.quality_of_relationship === "significant_concerns").length },
  { header: "Isolation Risk",         accessor: (r: FriendshipMap) => ISOLATION_RISK_LABEL[r.isolation_risk] },
  { header: "Loneliness Factors",     accessor: (r: FriendshipMap) => r.loneliness_factors },
  { header: "Strengths",              accessor: (r: FriendshipMap) => r.friendship_strengths.join("; ") },
  { header: "Challenges",             accessor: (r: FriendshipMap) => r.friendship_challenges.join("; ") },
  { header: "Support Plan",           accessor: (r: FriendshipMap) => r.support_to_build_friendships.join("; ") },
  { header: "Reviewed Date",          accessor: (r: FriendshipMap) => r.reviewed_date },
  { header: "Reviewed By",            accessor: (r: FriendshipMap) => getStaffName(r.reviewed_by) },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function FriendshipMappingPage() {
  const { data: res, isLoading } = useFriendshipMaps();
  const records = res?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const childrenMapped = records.length;
    const strongFriendships = records.reduce(
      (s, m) => s + m.friends.filter((f) => f.quality_of_relationship === "strong_positive").length,
      0
    );
    const concernsFlagged = records.reduce(
      (s, m) =>
        s +
        m.friends.filter(
          (f) =>
            f.quality_of_relationship === "some_concerns" ||
            f.quality_of_relationship === "significant_concerns"
        ).length,
      0
    );
    // "Reviews due in next 30 days" = last reviewed >= 11 months ago (335 days)
    const reviewsDue = records.filter(
      (m) => m.reviewed_date <= new Date(Date.now() - 335 * 86400000).toISOString().slice(0, 10)
    ).length;
    return { childrenMapped, strongFriendships, concernsFlagged, reviewsDue };
  }, [records]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = records;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          getYPName(m.child_id).toLowerCase().includes(q) ||
          m.friends.some((f) => f.friend_initial.toLowerCase().includes(q))
      );
    }
    if (filterRisk !== "all") list = list.filter((m) => m.isolation_risk === filterRisk);
    const out = [...list];
    switch (sortBy) {
      case "name":
        out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id)));
        break;
      case "risk": {
        const order: Record<IsolationRisk, number> = { high: 0, medium: 1, low: 2 };
        out.sort((a, b) => order[a.isolation_risk] - order[b.isolation_risk]);
        break;
      }
      case "friends":
        out.sort((a, b) => b.friends.length - a.friends.length);
        break;
      case "review":
        out.sort((a, b) => a.reviewed_date.localeCompare(b.reviewed_date));
        break;
    }
    return out;
  }, [records, search, filterRisk, sortBy]);

  if (isLoading) {
    return (
      <PageShell
        title="Friendship Mapping"
        subtitle="Mapping each child's friendship network — quality, context, and contextual safeguarding considerations"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Friendship Mapping"
      subtitle="Mapping each child's friendship network — quality, context, and contextual safeguarding considerations"
      ariaContext={{ pageTitle: "Friendship Mapping", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Friendship Mapping" />
          <ExportButton data={records} columns={EXPORT_COLS} filename="friendship-mapping" />
          <AriaStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Children Mapped", value: stats.childrenMapped, icon: Users, colour: "text-blue-600" },
          { label: "Strong Friendships", value: stats.strongFriendships, icon: Heart, colour: "text-green-600" },
          { label: "Concerns Flagged", value: stats.concernsFlagged, icon: AlertTriangle, colour: stats.concernsFlagged > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Reviews Due (30 d)", value: stats.reviewsDue, icon: CalendarClock, colour: stats.reviewsDue > 0 ? "text-red-600" : "text-gray-400" },
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
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search children or friend initials…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-[170px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Isolation Risks</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="risk">Isolation Risk</SelectItem>
              <SelectItem value="friends"># of Friends</SelectItem>
              <SelectItem value="review">Reviewed Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((m) => {
          const open = expandedId === m.id;
          const strong = m.friends.filter((f) => f.quality_of_relationship === "strong_positive").length;
          const concerns = m.friends.filter(
            (f) => f.quality_of_relationship === "some_concerns" || f.quality_of_relationship === "significant_concerns"
          ).length;
          return (
            <div key={m.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(m.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Users className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getYPName(m.child_id)}</h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        RISK_COLOURS[m.isolation_risk]
                      )}
                    >
                      Isolation: {ISOLATION_RISK_LABEL[m.isolation_risk]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {m.friends.length} friends
                    </span>
                    {strong > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {strong} strong
                      </span>
                    )}
                    {concerns > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {concerns} concern{concerns === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Mapped {m.map_date} · Last reviewed {m.reviewed_date} by {getStaffName(m.reviewed_by)}
                  </p>
                </div>
                {open ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* friends list */}
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Friendship Network</h4>
                    <div className="space-y-3">
                      {m.friends.map((f, i) => (
                        <div key={i} className="rounded-md border p-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{f.friend_initial}</span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                QUALITY_COLOURS[f.quality_of_relationship]
                              )}
                            >
                              {FRIENDSHIP_QUALITY_LABEL[f.quality_of_relationship]}
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium",
                                CONTEXT_COLOURS[f.context]
                              )}
                            >
                              {FRIEND_CONTEXT_LABEL[f.context]}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                              {FRIEND_AGE_CATEGORY_LABEL[f.age_category]}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                              {FRIEND_CONTACT_TYPE_LABEL[f.contact_type]}
                            </span>
                            {f.friends_parents_known ? (
                              <span className="px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 inline-flex items-center gap-1">
                                <Shield className="h-3 w-3" /> Parents known
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700">
                                Parents not known
                              </span>
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>
                              <span className="text-gray-500">Duration:</span>{" "}
                              <span className="font-medium text-gray-700">{f.duration_of_friendship}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Frequency:</span>{" "}
                              <span className="font-medium text-gray-700">{f.frequency}</span>
                            </div>
                          </div>
                          <div className="mt-2 rounded bg-amber-50 p-2">
                            <p className="text-xs font-medium text-amber-700 mb-0.5">
                              Contextual safeguarding notes
                            </p>
                            <p className="text-xs text-amber-800">{f.contextual_safeguarding_notes}</p>
                          </div>
                          <div className="mt-2 rounded bg-blue-50 p-2">
                            <p className="text-xs font-medium text-blue-700 mb-0.5">Support needed</p>
                            <p className="text-xs text-blue-800">{f.support_needed}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* strengths / challenges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-green-50 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">
                        Friendship Strengths
                      </h4>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                        {(m.friendship_strengths ?? []).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md bg-amber-50 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">
                        Friendship Challenges
                      </h4>
                      <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                        {m.friendship_challenges.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* loneliness / isolation */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">
                      Loneliness &amp; Isolation Factors
                    </h4>
                    <p className="text-sm">{m.loneliness_factors}</p>
                  </div>

                  {/* support plan */}
                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">
                      Support to Build &amp; Sustain Friendships
                    </h4>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                      {m.support_to_build_friendships.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* review meta */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Map date:</span>{" "}
                      <span className="font-medium">{m.map_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Reviewed:</span>{" "}
                      <span className="font-medium">{m.reviewed_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Reviewed by:</span>{" "}
                      <span className="font-medium">{getStaffName(m.reviewed_by)}</span>
                    </div>
                  </div>

                  {/* smart links */}
                  <SmartLinkPanel sourceType="friendship-map" sourceId={m.id} childId={m.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Quality Standard 9 — Positive Relationships:</strong> Children in care must be
        supported to develop and sustain positive relationships with peers and trusted adults.
        Friendship mapping helps the home understand each child&apos;s social network, identify
        contextual safeguarding considerations (per Carlene Firmin&apos;s contextual safeguarding
        framework), and plan support that nurtures belonging while reducing isolation. Maps should
        be reviewed at least annually, after any significant change in the child&apos;s social
        world, and as part of placement and transition planning.
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Friendship Mapping — peer relationships, social connections, positive friendships, negative influences, isolation risk, peer pressure, social skills, care plan"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
