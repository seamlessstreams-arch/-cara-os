"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Heart, Users, BookOpen, Sparkles, Home, Calendar, FileText, MessageCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useAdoptionRecords } from "@/hooks/use-adoption-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { AdoptionStatus, AdoptionIntroductionPhase, AdoptionRecord } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const STATUS_CLR: Record<AdoptionStatus, string> = {
  plan_being_explored: "bg-slate-100 text-slate-800",
  placement_order_granted: "bg-blue-100 text-blue-800",
  family_finding: "bg-amber-100 text-amber-800",
  matched: "bg-purple-100 text-purple-800",
  introductions: "bg-pink-100 text-pink-800",
  placed_for_adoption: "bg-teal-100 text-teal-800",
  adopted: "bg-green-100 text-green-800",
  plan_changed: "bg-gray-100 text-gray-800",
};

const STATUS_BORDER: Record<AdoptionStatus, string> = {
  plan_being_explored: "border-slate-400 bg-slate-50",
  placement_order_granted: "border-blue-400 bg-blue-50",
  family_finding: "border-amber-400 bg-amber-50",
  matched: "border-purple-400 bg-purple-50",
  introductions: "border-pink-400 bg-pink-50",
  placed_for_adoption: "border-teal-400 bg-teal-50",
  adopted: "border-green-400 bg-green-50",
  plan_changed: "border-gray-400 bg-gray-50",
};

const STATUS_LABEL: Record<AdoptionStatus, string> = {
  plan_being_explored: "Plan being explored",
  placement_order_granted: "Placement order granted",
  family_finding: "Family-finding",
  matched: "Matched",
  introductions: "Introductions",
  placed_for_adoption: "Placed for adoption",
  adopted: "Adopted",
  plan_changed: "Plan changed",
};

/* ── component ─────────────────────────────────────────────────────────────── */

export default function AdoptionSupportRecordsPage() {
  const { data: result, isLoading } = useAdoptionRecords();
  const records = result?.data ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("status");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const filtered = useMemo(() => {
    let out = [...records];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        r.child_initials.toLowerCase().includes(s) ||
        r.local_authority.toLowerCase().includes(s) ||
        STATUS_LABEL[r.adoption_status].toLowerCase().includes(s)
      );
    }
    if (statusFilter !== "all") out = out.filter(r => r.adoption_status === statusFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "initials": return a.child_initials.localeCompare(b.child_initials);
        case "review": return a.review_date.localeCompare(b.review_date);
        case "arrival": return a.arrival_date.localeCompare(b.arrival_date);
        default: {
          const ord: AdoptionStatus[] = [
            "introductions", "matched", "family_finding", "placement_order_granted",
            "plan_being_explored", "placed_for_adoption", "adopted", "plan_changed",
          ];
          return ord.indexOf(a.adoption_status) - ord.indexOf(b.adoption_status);
        }
      }
    });
    return out;
  }, [records, search, statusFilter, sortBy]);

  const activeCases = records.filter(r => r.adoption_status !== "adopted" && r.adoption_status !== "plan_changed").length;
  const withFamily = records.filter(r => r.adoption_status === "placed_for_adoption" || r.adoption_status === "introductions").length;
  const lifeStories = records.filter(r => r.life_story_completed).length;
  const awaitingMatching = records.filter(r => r.adoption_status === "family_finding" || r.adoption_status === "placement_order_granted").length;

  const exportCols: ExportColumn<AdoptionRecord>[] = useMemo(() => [
    { header: "Child", accessor: (r: AdoptionRecord) => r.child_initials },
    { header: "Age", accessor: (r: AdoptionRecord) => r.age },
    { header: "Arrival Date", accessor: (r: AdoptionRecord) => r.arrival_date },
    { header: "Adoption Status", accessor: (r: AdoptionRecord) => STATUS_LABEL[r.adoption_status] },
    { header: "Local Authority", accessor: (r: AdoptionRecord) => r.local_authority },
    { header: "Placement Order Date", accessor: (r: AdoptionRecord) => r.placement_order_date },
    { header: "Matching Panel Date", accessor: (r: AdoptionRecord) => r.matching_panel_date },
    { header: "Adoptive Family", accessor: (r: AdoptionRecord) => r.adoption_family_info },
    { header: "Life Story Completed", accessor: (r: AdoptionRecord) => r.life_story_completed ? "Yes" : "No" },
    { header: "Later Life Letter", accessor: (r: AdoptionRecord) => r.later_life_letter ? "Yes" : "No" },
    { header: "Contact Arrangements", accessor: (r: AdoptionRecord) => r.contact_arrangements },
    { header: "Internal Lead", accessor: (r: AdoptionRecord) => getStaffName(r.internal_lead) },
    { header: "Social Worker", accessor: (r: AdoptionRecord) => r.social_worker },
    { header: "Adoption Social Worker", accessor: (r: AdoptionRecord) => r.adoption_social_worker },
    { header: "Review Date", accessor: (r: AdoptionRecord) => r.review_date },
    { header: "Last Update", accessor: (r: AdoptionRecord) => r.last_update },
  ], []);

  if (isLoading) {
    return (
      <PageShell title="Adoption Support Records" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Adoption Support Records"
      subtitle="Tracking children whose care plan is adoption — preparation, introductions, post-placement support"
      ariaContext={{ pageTitle: "Adoption Support Records", sourceType: "child_record" }}
      actions={[
        <PrintButton key="p" title="Adoption Support Records" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="adoption-support-records" />,
        <AriaStudioQuickActionButton key="a" context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* sensitivity note */}
        <div className="rounded-lg border border-pink-200 bg-pink-50 p-4 text-sm text-pink-900 flex items-start gap-3">
          <Heart className="h-5 w-5 text-pink-600 mt-0.5" />
          <div>
            <p className="font-semibold">A positive permanence outcome</p>
            <p className="text-xs mt-1">Adoption is one of several routes to permanence and, when it is the right plan, can offer a child a lifelong family. Oak House&apos;s role is to prepare each child carefully — emotionally, practically and through life story work — so they arrive at their adoptive family with their history understood, their attachments honoured, and their voice heard. We hold transitions with care and continue to support the child where adopters welcome our involvement.</p>
          </div>
        </div>

        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Cases", value: activeCases, icon: Users, colour: "text-blue-600" },
            { label: "Currently With Adoptive Family", value: withFamily, icon: Home, colour: "text-teal-600" },
            { label: "Life Stories Complete", value: `${lifeStories}/${records.length}`, icon: BookOpen, colour: "text-purple-600" },
            { label: "Awaiting Matching", value: awaitingMatching, icon: Sparkles, colour: "text-amber-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* filters / sort */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Initials, local authority, status..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-52">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {(Object.keys(STATUS_CLR) as AdoptionStatus[]).map(s => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Stage priority</SelectItem>
                    <SelectItem value="initials">Initials</SelectItem>
                    <SelectItem value="arrival">Arrival date</SelectItem>
                    <SelectItem value="review">Review date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* expandable cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.adoption_status])}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{r.child_initials}</CardTitle>
                        <Badge className={cn("text-xs", STATUS_CLR[r.adoption_status])}>{STATUS_LABEL[r.adoption_status]}</Badge>
                        {r.life_story_completed && <Badge className="text-xs bg-purple-100 text-purple-800">Life Story Complete</Badge>}
                        {r.later_life_letter && <Badge className="text-xs bg-indigo-100 text-indigo-800">Later Life Letter</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Lead: {getStaffName(r.internal_lead)}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" />Key dates</p>
                        <ul className="text-xs space-y-0.5">
                          <li><span className="text-muted-foreground">Arrived at Oak House:</span> <strong>{r.arrival_date}</strong></li>
                          <li><span className="text-muted-foreground">Placement order:</span> <strong>{r.placement_order_date || "—"}</strong></li>
                          <li><span className="text-muted-foreground">Matching panel:</span> <strong>{r.matching_panel_date || "—"}</strong></li>
                          <li><span className="text-muted-foreground">Local authority:</span> <strong>{r.local_authority}</strong></li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Home className="h-3 w-3" />Adoptive family</p>
                        <p className="text-sm">{r.adoption_family_info}</p>
                      </div>
                    </div>

                    {/* introductions */}
                    {r.introduction_plan.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2 flex items-center gap-1"><Users className="h-3 w-3" />Introduction Plan</p>
                        <table className="w-full text-sm border">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-2 font-medium">Phase</th>
                              <th className="text-left p-2 font-medium">Dates</th>
                              <th className="text-left p-2 font-medium">Activities</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.introduction_plan.map((p: AdoptionIntroductionPhase, i: number) => (
                              <tr key={i} className="border-t align-top">
                                <td className="p-2 font-medium">{p.phase}</td>
                                <td className="p-2 whitespace-nowrap">{p.dates}</td>
                                <td className="p-2">{p.activities}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* preparation & goodbye */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1"><BookOpen className="h-3 w-3" />Preparation Activities</p>
                        <ul className="text-sm text-blue-900 list-disc list-inside space-y-0.5">{r.preparation_activities.map((a: string, i: number) => <li key={i}>{a}</li>)}</ul>
                      </div>
                      {r.goodbye_rituals_planned.length > 0 && (
                        <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                          <p className="text-xs font-semibold text-pink-800 mb-1 flex items-center gap-1"><Heart className="h-3 w-3" />Goodbye Rituals</p>
                          <ul className="text-sm text-pink-900 list-disc list-inside space-y-0.5">{r.goodbye_rituals_planned.map((g: string, i: number) => <li key={i}>{g}</li>)}</ul>
                        </div>
                      )}
                    </div>

                    {/* post-placement & support plan */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {r.support_provided_post_placement.length > 0 && (
                        <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
                          <p className="text-xs font-semibold text-teal-800 mb-1">Post-Placement Support Provided</p>
                          <ul className="text-sm text-teal-900 list-disc list-inside space-y-0.5">{r.support_provided_post_placement.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                        </div>
                      )}
                      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                        <p className="text-xs font-semibold text-purple-800 mb-1 flex items-center gap-1"><FileText className="h-3 w-3" />Adoption Support Plan</p>
                        <ul className="text-sm text-purple-900 list-disc list-inside space-y-0.5">{r.adoption_support_plan.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    </div>

                    {/* child voice */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1"><MessageCircle className="h-3 w-3" />Child&apos;s contribution & voice</p>
                      <p className="text-sm text-amber-900">{r.child_contribution}</p>
                    </div>

                    {/* contact / key worker involvement */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1">Contact arrangements</p>
                        <p className="text-muted-foreground">{r.contact_arrangements}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Home key worker involvement</p>
                        <p className="text-muted-foreground">{r.home_key_worker_involvement}</p>
                      </div>
                    </div>

                    {/* meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Internal lead: <strong>{getStaffName(r.internal_lead)}</strong></span>
                      <span>Social worker: <strong>{r.social_worker}</strong></span>
                      <span>Adoption social worker: <strong>{r.adoption_social_worker}</strong></span>
                      <span>Review: <strong>{r.review_date}</strong></span>
                      <span>Last update: <strong>{r.last_update}</strong></span>
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel sourceType="adoption_record" sourceId={r.id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Adoption and Children Act 2002 — sets the legal framework for adoption in England, including welfare paramountcy, placement orders, contact and adoption support services. Adoption Support Services Regulations 2005 — entitlement of adopted children and adoptive families to assessment for adoption support. Children&apos;s Homes (England) Regulations 2015 — the home must promote the welfare of each child, support permanence planning and prepare children for transitions in line with their care plan. Adoption Statutory Guidance 2013 — life story work, later life letters and well-planned introductions are core practice expectations. Records must be retained securely; later life information must be available to the child in adulthood.</p>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Adoption Support Records — post-adoption support, ASF, therapeutic intervention, contact arrangements, adoption breakdown prevention, support plans, court orders, letterbox"
        recordType="placement_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
