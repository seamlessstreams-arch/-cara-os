"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  BookOpen,
  Users,
  Shield,
  Clock,
  Home,
  Heart,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import type { HouseRule, HouseRuleCategory } from "@/types/extended";
import { HOUSE_RULE_STATUS_LABEL } from "@/types/extended";
import { useHouseRules } from "@/hooks/use-house-rules";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ─── category meta ─── */
const categoryConfig: Record<HouseRuleCategory, { label: string; color: string; icon: typeof BookOpen }> = {
  boundaries: { label: "Boundaries", color: "bg-blue-100 text-blue-800", icon: Shield },
  routines: { label: "Routines", color: "bg-purple-100 text-purple-800", icon: Clock },
  respect: { label: "Respect", color: "bg-pink-100 text-pink-800", icon: Heart },
  safety: { label: "Safety", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  community: { label: "Community", color: "bg-green-100 text-green-800", icon: Home },
  technology: { label: "Technology", color: "bg-indigo-100 text-indigo-800", icon: BookOpen },
  visitors: { label: "Visitors", color: "bg-amber-100 text-amber-800", icon: Users },
};

/* ─── export columns ─── */
const exportCols: ExportColumn<HouseRule>[] = [
  { header: "Rule", accessor: (r) => r.title },
  { header: "Category", accessor: (r) => categoryConfig[r.category]?.label ?? r.category },
  { header: "Status", accessor: (r) => HOUSE_RULE_STATUS_LABEL[r.status] },
  { header: "Agreed", accessor: (r) => r.agreed_date },
  { header: "Review Due", accessor: (r) => r.review_date },
  { header: "Description", accessor: (r) => r.description },
  { header: "Child-Friendly Version", accessor: (r) => r.child_friendly_version },
  { header: "Rationale", accessor: (r) => r.rationale },
  { header: "Linked Right", accessor: (r) => r.linked_to_right },
  { header: "Amendments", accessor: (r) => r.amendments.length.toString() },
];

/* ─── component ─── */
export default function HouseRulesPage() {
  const { data: raw, isLoading } = useHouseRules();
  const rules = useMemo(() => raw?.data ?? [], [raw]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("category");

  if (isLoading) {
    return (
      <PageShell title="House Rules & Boundaries" subtitle="Loading…">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </PageShell>
    );
  }

  /* ─── computed ─── */
  const filtered = useMemo(() => {
    let list = [...rules];
    if (filterCategory !== "all") list = list.filter((r) => r.category === filterCategory);
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "category":
          return a.category.localeCompare(b.category);
        case "review":
          return a.review_date.localeCompare(b.review_date);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    return list;
  }, [rules, filterCategory, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const active = rules.filter((r) => r.status === "active").length;
    const underReview = rules.filter((r) => r.status === "under_review").length;
    const amended = rules.filter((r) => r.status === "amended").length;
    const totalAmendments = rules.reduce((sum, r) => sum + r.amendments.length, 0);
    return { active, underReview, amended, totalAmendments };
  }, [rules]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  /* ─── status badge ─── */
  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "under_review":
        return <Badge className="bg-amber-100 text-amber-800">Under Review</Badge>;
      case "amended":
        return <Badge className="bg-blue-100 text-blue-800">Amended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageShell
      title="House Rules & Boundaries"
      subtitle="Co-produced expectations — agreed with young people, linked to rights, regularly reviewed"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={rules} columns={exportCols} filename="house-rules" />
          <PrintButton title="House Rules & Boundaries" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active Rules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.underReview}</p>
            <p className="text-xs text-muted-foreground">Under Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.amended}</p>
            <p className="text-xs text-muted-foreground">Recently Amended</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats.totalAmendments}</p>
            <p className="text-xs text-muted-foreground">Total Amendments</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── co-production note ─── */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Co-Produced with Young People</p>
            <p className="text-xs text-emerald-700 mt-1">
              All house rules are discussed and agreed at house meetings. Young people can request
              amendments at any time. Rules are reviewed monthly and linked to UNCRC rights to
              ensure they are proportionate and child-centred.
            </p>
          </div>
        </div>
      </div>

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>

        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="under_review">Under Review</option>
          <option value="amended">Amended</option>
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="category">Category</option>
            <option value="review">Review Date</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {/* ─── rule cards ─── */}
      <div className="space-y-3">
        {filtered.map((rule) => {
          const expanded = expandedId === rule.id;
          const cfg = categoryConfig[rule.category];
          const Icon = cfg?.icon ?? BookOpen;

          return (
            <Card key={rule.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(rule.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-md", cfg?.color?.split(" ")[0] ?? "bg-gray-100")}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{rule.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cn("text-xs", cfg?.color)}>
                          {cfg?.label}
                        </Badge>
                        {statusBadge(rule.status)}
                        {rule.amendments.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {rule.amendments.length} amendment{rule.amendments.length > 1 ? "s" : ""}
                          </span>
                        )}
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
                <CardContent className="pt-0 pb-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">The Rule</p>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-1">Child-Friendly Version</p>
                    <p className="text-sm text-blue-700">{rule.child_friendly_version}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Why We Have This Rule</p>
                    <p className="text-sm text-muted-foreground">{rule.rationale}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">What Happens If Broken</p>
                    <p className="text-sm text-muted-foreground">{rule.consequences}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">{rule.linked_to_right}</span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Young People Consulted</p>
                    <div className="flex flex-wrap gap-1">
                      {rule.young_people_consulted.map((ypId) => (
                        <Badge key={ypId} variant="outline" className="text-xs">
                          {getYPName(ypId)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {rule.amendments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Amendment History</p>
                      <div className="space-y-2">
                        {rule.amendments.map((am, idx) => (
                          <div key={idx} className="border rounded-md p-2 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{am.change}</span>
                              <span className="text-xs text-muted-foreground">{am.date}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Reason: {am.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Agreed</p>
                      <p className="text-sm font-medium">{rule.agreed_date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Next Review</p>
                      <p className="text-sm font-medium">{rule.review_date}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          Regulation 19 of the Children&apos;s Homes Regulations 2015 requires that children are
          aware of and understand the home&apos;s rules. Rules must be proportionate, clearly
          communicated, and take account of children&apos;s views. The Quality Standards (Standard 3)
          emphasise that boundaries should be applied consistently, fairly, and with reference to the
          child&apos;s care plan. House rules are co-produced at house meetings, reviewed monthly,
          presented in child-friendly language, and linked to UNCRC rights to demonstrate
          proportionality.
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
