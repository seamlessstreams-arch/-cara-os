"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { FlatList, FlatListRow, FlatListRowDetail, type RowSeverity } from "@/components/ui/list-row";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useLACReviews, useCreateLACReview } from "@/hooks/use-lac-reviews";
import { toast } from "sonner";
import type { LACReview, LACReviewType, LACReviewOutcome, LACChildParticipation, LACPlacementStability } from "@/types/extended";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  Gavel, Calendar, Clock, Users, CheckCircle2,
  AlertTriangle, FileText, Target, Star, Loader2
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const TYPE_META: Record<LACReviewType, { label: string; color: string }> = {
  initial:       { label: "Initial (20 days)",  color: "bg-blue-100 text-blue-800" },
  first_review:  { label: "First Review (3 months)", color: "bg-purple-100 text-purple-800" },
  subsequent:    { label: "Subsequent (6 monthly)",  color: "bg-green-100 text-green-800" },
  emergency:     { label: "Emergency Review",   color: "bg-red-100 text-red-800" },
  disruption:    { label: "Disruption Meeting",  color: "bg-orange-100 text-orange-800" },
};

const OUTCOME_META: Record<LACReviewOutcome, { label: string; color: string }> = {
  placement_continues: { label: "Placement Continues",  color: "bg-[--cs-success-bg] text-[--cs-success]" },
  placement_change:    { label: "Placement Change",     color: "bg-[--cs-risk-bg] text-[--cs-risk]" },
  care_plan_amended:   { label: "Care Plan Amended",    color: "bg-[--cs-warning-bg] text-[--cs-warning]" },
  actions_agreed:      { label: "Actions Agreed",       color: "bg-[--cs-info-bg] text-[--cs-info]" },
  return_home:         { label: "Return Home Plan",     color: "bg-purple-100 text-purple-700" },
};

const OUTCOME_TEXT: Record<LACReviewOutcome, string> = {
  placement_continues: "text-[--cs-success]",
  placement_change:    "text-[--cs-risk]",
  care_plan_amended:   "text-[--cs-warning]",
  actions_agreed:      "text-[--cs-info]",
  return_home:         "text-purple-700",
};

const STABILITY_ROW: Record<string, RowSeverity> = { stable: "success", some_concerns: "warning" };

const PARTICIPATION_META: Record<string, string> = {
  attended:           "Attended in person",
  views_submitted:    "Views submitted",
  advocate_attended:  "Advocate attended",
  did_not_participate:"Did not participate",
};

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<LACReview>[] = [
  { header: "ID",               accessor: (r: LACReview) => r.id },
  { header: "Young Person",     accessor: (r: LACReview) => getYPName(r.child_id) },
  { header: "Date",             accessor: (r: LACReview) => r.date },
  { header: "Type",             accessor: (r: LACReview) => TYPE_META[r.review_type].label },
  { header: "IRO",              accessor: (r: LACReview) => r.iro },
  { header: "Venue",            accessor: (r: LACReview) => r.venue },
  { header: "Participation",    accessor: (r: LACReview) => PARTICIPATION_META[r.child_participation] },
  { header: "Child Views",      accessor: (r: LACReview) => r.child_views },
  { header: "Outcome",          accessor: (r: LACReview) => OUTCOME_META[r.outcome].label },
  { header: "Recommendations",  accessor: (r: LACReview) => r.recommendations.join("; ") },
  { header: "Next Review",      accessor: (r: LACReview) => r.next_review_date },
  { header: "Stability",        accessor: (r: LACReview) => r.placement_stability },
  { header: "Notes",            accessor: (r: LACReview) => r.notes },
  { header: "Recorded By",      accessor: (r: LACReview) => getStaffName(r.recorded_by) },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function LACReviewsPage() {
  const { data: lacData, isLoading } = useLACReviews();
  const createReview = useCreateLACReview();
  const reviews = lacData?.data ?? [];
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const children = useMemo(() => {
    const ids = [...new Set(reviews.map((r) => r.child_id))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) => r.child_views.toLowerCase().includes(s) || r.recommendations.some((rec) => rec.toLowerCase().includes(s)) || r.notes.toLowerCase().includes(s));
    }
    if (childFilter !== "all") list = list.filter((r) => r.child_id === childFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":  return b.date.localeCompare(a.date);
        case "child": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "type":  return TYPE_META[a.review_type].label.localeCompare(TYPE_META[b.review_type].label);
        default:      return 0;
      }
    });
    return list;
  }, [reviews, search, childFilter, sortBy]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const pendingActions = reviews.flatMap((r) => r.actions_agreed).filter((a) => !a.completed).length;
    const nextReview = reviews.map((r) => r.next_review_date).filter(Boolean).sort()[0] || "—";
    const allStable = reviews.every((r) => r.placement_stability === "stable");
    return { total, pendingActions, nextReview, allStable };
  }, [reviews]);

  return (
    <PageShell
      title="LAC Reviews"
      subtitle="Looked-After Children review meetings — tracking outcomes, actions, and child participation"
      caraContext={{ pageTitle: "LAC Reviews", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="LAC Reviews" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="lac-reviews" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Review</Button>
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area" className="space-y-6">
        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Reviews",   value: stats.total,          icon: <Gavel className="h-4 w-4" />,          color: "text-blue-600" },
            { label: "Pending Actions",  value: stats.pendingActions, icon: <AlertTriangle className="h-4 w-4" />,  color: "text-amber-600" },
            { label: "Next Review",      value: stats.nextReview,     icon: <Calendar className="h-4 w-4" />,       color: "text-purple-600" },
            { label: "All Stable",       value: stats.allStable ? "Yes" : "No", icon: <CheckCircle2 className="h-4 w-4" />, color: stats.allStable ? "text-[--cs-success]" : "text-[--cs-risk]" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Per-child next review ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {children.map((c) => {
            const cr = reviews.filter((r) => r.child_id === c.id).sort((a, b) => b.date.localeCompare(a.date));
            const latest = cr[0];
            const pending = latest ? latest.actions_agreed.filter((a) => !a.completed).length : 0;
            return (
              <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setChildFilter(childFilter === c.id ? "all" : c.id)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{c.name}</p>
                    <Badge variant="outline">{cr.length} reviews</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Last: {latest?.date || "—"} ({latest ? TYPE_META[latest.review_type].label : "—"})</p>
                    <p>Next: {latest?.next_review_date || "—"}</p>
                    <div className="flex items-center justify-between">
                      <span>Stability: <span className={cn("font-medium", latest?.placement_stability === "stable" ? "text-[--cs-success]" : "text-amber-600")}>{latest?.placement_stability || "—"}</span></span>
                      {pending > 0 && <span className="text-amber-600">{pending} actions pending</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reviews…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Review list ──────────────────────────────────────────────────── */}
        <FlatList>
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No reviews match your filters.</p>}
          {filtered.map((r) => {
            const open = !!expanded[r.id];
            const typeM = TYPE_META[r.review_type];
            const outcomeM = OUTCOME_META[r.outcome];
            const pendingActions = r.actions_agreed.filter((a) => !a.completed).length;
            return (
              <div key={r.id}>
                <FlatListRow severity={STABILITY_ROW[r.placement_stability] ?? "risk"} onClick={() => toggle(r.id)} aria-expanded={open}>
                  <div className="flex items-start justify-between flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", typeM.color)}>{typeM.label}</Badge>
                        <span className={cn("text-[11px] font-semibold uppercase tracking-wide", OUTCOME_TEXT[r.outcome])}>{outcomeM.label}</span>
                        {pendingActions > 0 && <span className="text-[11px] font-semibold uppercase tracking-wide text-[--cs-warning]">{pendingActions} pending</span>}
                      </div>
                      <p className="font-semibold">{getYPName(r.child_id)} — LAC Review</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{r.date}</span>
                        <span>IRO: {r.iro}</span>
                        <span>{r.attendees.length} attendees</span>
                        <span>{PARTICIPATION_META[r.child_participation]}</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />}
                  </div>
                </FlatListRow>

                {open && (
                  <FlatListRowDetail className="text-sm">
                      {/* Attendees */}
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Attendees</p>
                        <div className="flex flex-wrap gap-1">
                          {r.attendees.map((a, i) => <Badge key={i} variant="secondary" className="text-xs">{a.name} ({a.role})</Badge>)}
                        </div>
                      </div>

                      {/* Child views */}
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Child&apos;s Views</p>
                        <div className="bg-pink-50 p-3 rounded-lg border border-pink-200 italic text-pink-900 text-xs">
                          {r.child_views}
                        </div>
                      </div>

                      {/* Key discussions */}
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Key Discussions</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          {r.key_discussions.map((kd, i) => <li key={i}>{kd}</li>)}
                        </ul>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Recommendations</p>
                        <ul className="space-y-1 text-xs">
                          {r.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-1"><Star className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />{rec}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Actions */}
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Actions Agreed</p>
                        <div className="space-y-1">
                          {r.actions_agreed.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {a.completed ? <CheckCircle2 className="h-3.5 w-3.5 text-[--cs-success]" /> : <Clock className="h-3.5 w-3.5 text-amber-600" />}
                              <span className={a.completed ? "line-through text-muted-foreground" : ""}>{a.action}</span>
                              <span className="text-muted-foreground">({a.owner})</span>
                              <Badge variant="outline" className="text-xs">Due: {a.due_date}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <div><p className="text-xs text-muted-foreground">Venue</p><p className="font-medium text-xs">{r.venue}</p></div>
                        <div><p className="text-xs text-muted-foreground">Next Review</p><p className="font-medium text-xs">{r.next_review_date}</p></div>
                        <div><p className="text-xs text-muted-foreground">Care Plan Updated</p><p className="font-medium text-xs">{r.care_plan_updated ? "Yes" : "No"}</p></div>
                      </div>

                      {r.notes && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="italic text-muted-foreground text-xs">{r.notes}</p>
                        </div>
                      )}
                      <SmartLinkPanel sourceType="lac_review" sourceId={r.id} childId={r.child_id} compact />
                  </FlatListRowDetail>
                )}
              </div>
            );
          })}
        </FlatList>

        {/* ── Guidance ─────────────────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Gavel className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              LAC reviews must take place within 20 working days of placement, then at 3 months, then every 6 months thereafter. The child&apos;s views must always be sought and recorded. The IRO chairs the review and monitors the care plan. All actions must be tracked to completion.
            </span>
          </CardContent>
        </Card>
      </div>
      )}

      {/* ── New review dialog ─────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record LAC Review</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const childId = fd.get("child_id") as string;
            const reviewType = fd.get("review_type") as string;
            if (!childId || !reviewType) return;
            createReview.mutate({
              child_id: childId, review_type: reviewType as LACReviewType,
              date: fd.get("date") as string || new Date().toISOString().slice(0, 10),
              iro: fd.get("iro") as string || "", venue: fd.get("venue") as string || "",
              attendees: [], child_participation: "attended" as LACChildParticipation,
              child_views: fd.get("child_views") as string || "",
              key_discussions: (fd.get("key_discussions") as string || "").split("\n").filter(Boolean),
              recommendations: [], outcome: "actions_agreed" as LACReviewOutcome, actions_agreed: [],
              next_review_date: fd.get("next_review_date") as string || "",
              placement_stability: "stable" as LACPlacementStability, care_plan_updated: false,
              notes: "", recorded_by: "staff_darren", home_id: "home_oak",
            }, {
              onSuccess: () => { toast.success("LAC review recorded"); setShowNew(false); },
              onError: () => toast.error("Failed to save review"),
            });
          }} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select name="child_id"><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input name="date" type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Review Type</label>
                <Select name="review_type"><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">IRO Name</label>
              <Input name="iro" placeholder="Independent Reviewing Officer" />
            </div>
            <div>
              <label className="text-sm font-medium">Venue</label>
              <Input name="venue" placeholder="Where was the review held?" />
            </div>
            <div>
              <label className="text-sm font-medium">Child&apos;s Views</label>
              <Textarea name="child_views" placeholder="Record the child's views in their own words…" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Key Discussions</label>
              <Textarea name="key_discussions" placeholder="Main topics discussed (one per line)" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Next Review Date</label>
              <Input name="next_review_date" type="date" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createReview.isPending}>{createReview.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Review"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Professional Contact"
        category="professional_contact"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="LAC Reviews — statutory LAC review records, care plan review outcomes, action points, IRO decisions, carer attendance, child participation, Annex A evidence, Reg 45 themes"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
