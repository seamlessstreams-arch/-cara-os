"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type { WarmWelcomePack } from "@/types/extended";
import { useWarmWelcomePacks } from "@/hooks/use-warm-welcome-packs";
import {
  ChevronUp,
  ChevronDown,
  Gift,
  Heart,
  Home,
  CheckCircle2,
  Package,
  Star,
  ArrowUpDown,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */


/* ─── seed data ─── */

/* ─── export columns ─── */
const exportCols: ExportColumn<WarmWelcomePack>[] = [
  { header: "Young Person", accessor: (r: WarmWelcomePack) => getYPName(r.child_id) },
  { header: "Prepared By", accessor: (r: WarmWelcomePack) => getStaffName(r.preparedBy) },
  { header: "Prepared Date", accessor: (r: WarmWelcomePack) => r.preparedDate },
  { header: "Admission Date", accessor: (r: WarmWelcomePack) => r.admissionDate },
  { header: "Status", accessor: (r: WarmWelcomePack) => r.status },
  { header: "Items", accessor: (r: WarmWelcomePack) => r.items.length.toString() },
  { header: "Personalised Items", accessor: (r: WarmWelcomePack) => r.items.filter((i) => i.personalised).length.toString() },
  { header: "Child Feedback", accessor: (r: WarmWelcomePack) => r.childFeedback ?? "N/A" },
];

/* ─── component ─── */
export default function WarmWelcomePacksPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const { data: result, isLoading } = useWarmWelcomePacks(undefined, "home_oak");
  const packs = result?.data ?? [];

  const filtered = useMemo(() => {
    let list = [...packs];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.admissionDate.localeCompare(a.admissionDate);
        case "name":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default:
          return 0;
      }
    });
    return list;
  }, [filterStatus, sortBy]);

  const stats = useMemo(() => {
    const total = packs.length;
    const delivered = packs.filter((p) => p.status === "delivered").length;
    const preparing = packs.filter((p) => p.status === "preparing").length;
    const avgItems = Math.round(packs.reduce((s, p) => s + (p.items?.length ?? 0), 0) / packs.length);
    const personalisedPct = Math.round(
      (packs.reduce((s, p) => s + (p.items ?? []).filter((i) => i.personalised).length, 0) /
        packs.reduce((s, p) => s + (p.items?.length ?? 0), 0)) * 100
    );
    return { total, delivered, preparing, avgItems, personalisedPct };
  }, [packs]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const statusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case "preparing":
        return <Badge className="bg-amber-100 text-amber-800">Preparing</Badge>;
      case "template":
        return <Badge variant="outline">Template</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case "bedroom": return <Home className="h-3 w-3" />;
      case "comfort": return <Heart className="h-3 w-3" />;
      case "personal": return <Star className="h-3 w-3" />;
      case "food": return <Gift className="h-3 w-3" />;
      default: return <Package className="h-3 w-3" />;
    }
  };

  return (
    <PageShell
      title="Warm Welcome Packs"
      subtitle="Personalised admission preparation — making children feel expected, wanted, and valued from day one"
      ariaContext={{ pageTitle: "Warm Welcome Packs", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={packs} columns={exportCols} filename="welcome-packs" />
          <PrintButton title="Warm Welcome Packs" />
          <AriaStudioQuickActionButton context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Packs Created</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.delivered}</p>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.preparing}</p>
            <p className="text-xs text-muted-foreground">In Preparation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.avgItems}</p>
            <p className="text-xs text-muted-foreground">Avg Items/Pack</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats.personalisedPct}%</p>
            <p className="text-xs text-muted-foreground">Personalised</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── philosophy note ─── */}
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <Heart className="h-5 w-5 text-pink-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-pink-800">Our Welcome Philosophy</p>
            <p className="text-xs text-pink-700 mt-1">
              Every child arriving at Chamberlain House should feel expected, wanted, and thought about.
              Welcome packs are personalised using advance information — never generic.
              First impressions matter: a child who feels welcomed is more likely to settle,
              attach, and thrive. We ask: &quot;Would a good parent do this for their child?&quot;
            </p>
          </div>
        </div>
      </div>

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="delivered">Delivered</option>
          <option value="preparing">Preparing</option>
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Admission Date</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* ─── pack cards ─── */}
      <div className="space-y-4">
        {filtered.map((pack) => {
          const expanded = expandedId === pack.id;
          const personalisedCount = pack.items.filter((i) => i.personalised).length;

          return (
            <Card key={pack.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(pack.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-pink-100">
                      <Gift className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {getYPName(pack.child_id)} — {pack.status === "preparing" ? "Upcoming" : "Admission"}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {statusBadge(pack.status)}
                        <span className="text-xs text-muted-foreground">
                          {pack.items.length} items ({personalisedCount} personalised)
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pack.admissionDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  {expanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* items checklist */}
                  <div>
                    <p className="text-sm font-medium mb-2">Pack Contents</p>
                    <div className="space-y-1.5">
                      {pack.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <div className={cn(
                            "mt-0.5 shrink-0",
                            item.provided ? "text-green-600" : "text-gray-300"
                          )}>
                            {item.provided ? <CheckCircle2 className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cn(!item.provided && "text-muted-foreground")}>{item.item}</span>
                              {item.personalised && (
                                <Badge className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0">
                                  <Star className="h-2.5 w-2.5 mr-0.5" /> Personal
                                </Badge>
                              )}
                            </div>
                            {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* personal touches */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Heart className="h-4 w-4 text-pink-600" /> Personal Touches
                    </p>
                    <ul className="space-y-1">
                      {pack.personalTouches.map((pt, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-pink-400 mt-1.5">♥</span> {pt}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* first night plan */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-indigo-800 mb-1">First Night Plan</p>
                    <p className="text-sm text-indigo-700">{pack.firstNightPlan}</p>
                  </div>

                  {/* key worker intro */}
                  <div>
                    <p className="text-sm font-medium mb-1">Key Worker Introduction</p>
                    <p className="text-sm text-muted-foreground">{pack.keyWorkerIntro}</p>
                  </div>

                  {/* child feedback */}
                  {pack.childFeedback && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800 mb-1">Child&apos;s Feedback</p>
                      <p className="text-sm text-green-700">{pack.childFeedback}</p>
                    </div>
                  )}

                  {/* notes */}
                  {pack.notes && (
                    <div className="bg-muted/30 rounded-md p-3">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{pack.notes}</p>
                    </div>
                  )}

                  {/* footer */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Prepared By</p>
                      <p className="text-sm font-medium">{getStaffName(pack.preparedBy)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Prepared</p>
                      <p className="text-sm font-medium">{pack.preparedDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Admission</p>
                      <p className="text-sm font-medium">{pack.admissionDate}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-[var(--cs-border)] rounded-lg p-4">
        <p className="text-sm font-medium text-[var(--cs-text-secondary)] mb-1">Regulatory Context</p>
        <p className="text-xs text-[var(--cs-text-secondary)]">
          Quality Standard 1 (Child-Centred Care) requires that children feel welcome, safe, and
          valued from the point of admission. Regulation 14 (Admissions) requires preparation for
          the child&apos;s arrival. The SCCIF examines whether children feel they &quot;belong&quot;
          and whether the home makes efforts to understand and meet their individual needs from
          day one. Personalised welcome packs demonstrate that the child was expected, thought
          about, and prepared for — not just &quot;placed.&quot;
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Warm Welcome Packs — new admission welcome packs, placement information, house rules, key contacts, rights and entitlements, initial settling-in support, placement plan evidence"
        recordType="placement_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
