"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Heart, ChevronDown, ChevronUp, ArrowUpDown, MessageCircle, Sparkles,
  HandHeart, CheckCircle2, AlertTriangle, Clock, Smile, Frown, BookOpen,
  PenTool, Footprints, Palette, UserRound, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { usePostIncidentChildDebriefs } from "@/hooks/use-post-incident-child-debriefs";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { PostIncidentChildDebrief, ChildDebriefMethod } from "@/types/extended";
import { CHILD_DEBRIEF_METHOD_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const daysBetween = (a: string, b: string) => {
  const ad = new Date(a).getTime();
  const bd = new Date(b).getTime();
  return Math.round(Math.abs(bd - ad) / (1000 * 60 * 60 * 24));
};

const METHOD_META: Record<ChildDebriefMethod, { label: string; color: string; icon: typeof MessageCircle }> = {
  conversation: { label: "Conversation", color: "bg-blue-100 text-blue-800", icon: MessageCircle },
  drawing: { label: "Drawing", color: "bg-pink-100 text-pink-800", icon: Palette },
  visual_cards: { label: "Visual Cards", color: "bg-purple-100 text-purple-800", icon: BookOpen },
  walk_and_talk: { label: "Walk-and-Talk", color: "bg-green-100 text-green-800", icon: Footprints },
  written: { label: "Written", color: "bg-amber-100 text-amber-800", icon: PenTool },
  through_advocate: { label: "Through Advocate", color: "bg-indigo-100 text-indigo-800", icon: UserRound },
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function PostIncidentDebriefWithChildPage() {
  const { data: records = [], isLoading } = usePostIncidentChildDebriefs();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"debrief_date" | "incident_date" | "child_id">("debrief_date");
  const [filterChild, setFilterChild] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = [...records];
    if (filterChild !== "all") result = result.filter((r) => r.child_id === filterChild);
    if (filterMethod !== "all") result = result.filter((r) => r.debrief_method === filterMethod);
    return result.sort((a, b) => {
      switch (sortBy) {
        case "incident_date":
          return b.incident_date.localeCompare(a.incident_date);
        case "child_id":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default:
          return b.debrief_date.localeCompare(a.debrief_date);
      }
    });
  }, [records, sortBy, filterChild, filterMethod]);

  /* summary stats */
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const debriefsThisMonth = records.filter((r) => r.debrief_date.startsWith(thisMonth)).length;
  const childLedCount = records.filter((r) => r.child_ready_to_debrief).length;
  const childLedPct = records.length > 0 ? Math.round((childLedCount / records.length) * 100) : 0;
  const acceptsOutcomeCount = records.filter((r) => r.child_accepts_outcome).length;
  const acceptsOutcomePct = records.length > 0 ? Math.round((acceptsOutcomeCount / records.length) * 100) : 0;
  const avgDays =
    records.length > 0
      ? Math.round(
          records.reduce((sum, r) => sum + daysBetween(r.incident_date, r.debrief_date), 0) / records.length,
        )
      : 0;

  /* export */
  const exportCols: ExportColumn<PostIncidentChildDebrief>[] = [
    { header: "ID", accessor: (r) => r.id },
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Incident Ref", accessor: (r) => r.incident_ref },
    { header: "Incident Date", accessor: (r) => r.incident_date },
    { header: "Debrief Date", accessor: (r) => r.debrief_date },
    { header: "Days Between", accessor: (r) => daysBetween(r.incident_date, r.debrief_date) },
    { header: "Method", accessor: (r) => CHILD_DEBRIEF_METHOD_LABEL[r.debrief_method] },
    { header: "Debriefed By", accessor: (r) => getStaffName(r.debrief_staff) },
    { header: "Child Ready", accessor: (r) => (r.child_ready_to_debrief ? "Yes" : "No") },
    { header: "Accepts Outcome", accessor: (r) => (r.child_accepts_outcome ? "Yes" : "No") },
    { header: "Follow-Up", accessor: (r) => r.follow_up_date },
    { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
  ];

  const uniqueChildren = Array.from(new Set(records.map((r) => r.child_id)));

  if (isLoading) {
    return (
      <PageShell title="Post-Incident Debrief with Child" subtitle="Restorative · Child-Led Reflection · Quality Standard 5 · Repair & Forward Planning">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Post-Incident Debrief with Child"
      subtitle="Restorative · Child-Led Reflection · Quality Standard 5 · Repair & Forward Planning"
      ariaContext={{ pageTitle: "Post-Incident Debrief with Child", sourceType: "incident" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Post-Incident Debrief with Child" />
          <ExportButton data={records} columns={exportCols} filename="child-debriefs" />
          <AriaStudioQuickActionButton context={{ record_type: "incident", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{debriefsThisMonth}</p>
              <p className="text-xs text-muted-foreground">Debriefs This Month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className={cn("text-2xl font-bold", childLedPct >= 80 ? "text-green-600" : "text-amber-600")}>
                {childLedPct}%
              </p>
              <p className="text-xs text-muted-foreground">Child-Led (Ready)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className={cn("text-2xl font-bold", acceptsOutcomePct >= 80 ? "text-green-600" : "text-amber-600")}>
                {acceptsOutcomePct}%
              </p>
              <p className="text-xs text-muted-foreground">Accepts Outcome</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{avgDays}</p>
              <p className="text-xs text-muted-foreground">Avg. Days from Incident</p>
            </CardContent>
          </Card>
        </div>

        {/* tender banner */}
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm text-rose-900">
              <p className="font-semibold mb-1">A child&apos;s voice after an incident matters.</p>
              <p className="text-rose-800">
                These conversations are led by the child, at their pace, in the way that suits them — a walk, a drawing,
                visual cards, or with their advocate beside them. We listen first. We do not press for words that aren&apos;t
                ready. The aim is repair and understanding, never blame. Records here capture what the child shared and
                the small, real changes we have agreed in response.
              </p>
            </div>
          </div>
        </div>

        {/* filters / sort */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[200px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debrief_date">Debrief date (newest)</SelectItem>
                <SelectItem value="incident_date">Incident date (newest)</SelectItem>
                <SelectItem value="child_id">Young person (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={filterChild} onValueChange={setFilterChild}>
            <SelectTrigger className="w-[200px] h-8 text-sm">
              <SelectValue placeholder="All children" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All children</SelectItem>
              {uniqueChildren.map((yp) => (
                <SelectItem key={yp} value={yp}>{getYPName(yp)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterMethod} onValueChange={setFilterMethod}>
            <SelectTrigger className="w-[200px] h-8 text-sm">
              <SelectValue placeholder="All methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              {(Object.keys(METHOD_META) as ChildDebriefMethod[]).map((m) => (
                <SelectItem key={m} value={m}>{METHOD_META[m].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* debrief cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const methodMeta = METHOD_META[r.debrief_method];
            const MethodIcon = methodMeta?.icon || MessageCircle;
            const days = daysBetween(r.incident_date, r.debrief_date);
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  r.child_ready_to_debrief ? "border-l-rose-400" : "border-l-amber-400",
                )}
              >
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <Sparkles className="h-4 w-4 text-rose-500" />
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className={methodMeta?.color}>
                          <MethodIcon className="h-3 w-3 mr-1" />
                          {methodMeta?.label}
                        </Badge>
                        {r.child_ready_to_debrief ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">Child ready</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800">Adapted approach</Badge>
                        )}
                        {r.child_accepts_outcome && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">Outcome accepted</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Incident {r.incident_ref} · {r.incident_date} → debrief {r.debrief_date} ({days} day{days === 1 ? "" : "s"} after) · with {getStaffName(r.debrief_staff)}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 shrink-0 mt-1" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* readiness */}
                    <div className="bg-muted/40 rounded p-2">
                      <p className="font-medium text-xs mb-1 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Readiness Indicators
                      </p>
                      <p className="text-xs text-muted-foreground">{r.readiness_indicators}</p>
                    </div>

                    {/* child's account */}
                    <div className="bg-rose-50 border border-rose-200 rounded p-2">
                      <p className="font-medium text-xs text-rose-900 mb-1 flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" /> Child&apos;s Account of What Happened
                      </p>
                      <p className="text-xs text-rose-900/90">{r.child_account_of_what_happened}</p>
                    </div>

                    {/* feelings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-orange-50 border border-orange-200 rounded p-2">
                        <p className="font-medium text-xs text-orange-800 mb-1 flex items-center gap-1">
                          <Frown className="h-3.5 w-3.5" /> Feelings Before / During
                        </p>
                        <p className="text-xs text-orange-700">{r.child_feelings_before_during}</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
                        <p className="font-medium text-xs text-emerald-800 mb-1 flex items-center gap-1">
                          <Smile className="h-3.5 w-3.5" /> Feelings Now
                        </p>
                        <p className="text-xs text-emerald-700">{r.child_feelings_now}</p>
                      </div>
                    </div>

                    {/* what they wish */}
                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">What the Child Wishes Had Been Different</p>
                      <p className="text-xs text-purple-700">{r.what_child_wishes_had_been_different}</p>
                    </div>

                    {/* what helped / didn't help */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="font-medium text-xs text-green-800 mb-1">What Helped</p>
                        <ul className="space-y-0.5">
                          {r.what_helped_child.map((item, i) => (
                            <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                              <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="font-medium text-xs text-amber-800 mb-1">What Did Not Help</p>
                        <ul className="space-y-0.5">
                          {r.what_did_not_help.map((item, i) => (
                            <li key={i} className="text-xs text-amber-700 flex items-start gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* requests for future */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Child&apos;s Requests for the Future</p>
                      <ul className="space-y-0.5">
                        {r.child_requests_for_future.map((item, i) => (
                          <li key={i} className="text-xs text-blue-700 flex items-start gap-1">
                            <span className="text-blue-600 shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* apologies */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-pink-50 border border-pink-200 rounded p-2">
                        <p className="font-medium text-xs text-pink-800 mb-1 flex items-center gap-1">
                          <HandHeart className="h-3.5 w-3.5" /> Apologies Offered (by child)
                        </p>
                        <p className="text-xs text-pink-700">{r.apologies_offered}</p>
                      </div>
                      <div className="bg-pink-50 border border-pink-200 rounded p-2">
                        <p className="font-medium text-xs text-pink-800 mb-1 flex items-center gap-1">
                          <HandHeart className="h-3.5 w-3.5" /> Apologies Received (to child)
                        </p>
                        <p className="text-xs text-pink-700">{r.apologies_received}</p>
                      </div>
                    </div>

                    {/* repairs */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
                      <p className="font-medium text-xs text-indigo-800 mb-1">Repairs Agreed</p>
                      <ul className="space-y-0.5">
                        {r.repairs_agreed.map((item, i) => (
                          <li key={i} className="text-xs text-indigo-700 flex items-start gap-1">
                            <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-indigo-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* support needed */}
                    <div>
                      <p className="font-medium text-xs mb-1">Support Needed Now</p>
                      <p className="text-xs text-muted-foreground">{r.support_needed_now}</p>
                    </div>

                    {/* footer */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t text-xs text-muted-foreground">
                      <span>Follow-up: <span className="font-medium text-foreground">{r.follow_up_date}</span></span>
                      <span>Recorded by: <span className="font-medium text-foreground">{getStaffName(r.recorded_by)}</span></span>
                    </div>

                    <SmartLinkPanel sourceType="post_incident_child_debrief" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Restorative Practice & Quality Standard 5</p>
          <p>
            The Children&apos;s Homes (England) Regulations 2015 — in particular Quality Standard 5 (Care Planning) and
            Quality Standard 3 (Protection of Children) — require that children are supported to express their views
            following any significant event, and that those views shape their care. Post-incident debriefs with children
            are held separately from staff debriefs and operate on restorative principles: the child leads the conversation,
            their pace is respected, and the focus is on understanding, repair, and forward planning rather than blame.
            Where a child is not yet ready to engage verbally, alternative methods (drawing, visual cards, walk-and-talk,
            written reflection, or advocacy support) are used. Records here are stored as part of the child&apos;s case file
            and reviewed at care plan reviews, behaviour support plan reviews, and where relevant by the Independent
            Reviewing Officer. Repairs agreed with the child must be tracked through to completion.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Behaviour & Safeguarding"
        category={["behaviour", "safeguarding", "physical_intervention"]}
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Post-Incident Debrief with Child — child's perspective on incident, impact, feelings, understanding, learning, agreement, future support, Regulation 40 evidence, safeguarding evidence"
        recordType="incident"
        className="mt-6"
      />
    </PageShell>
  );
}
