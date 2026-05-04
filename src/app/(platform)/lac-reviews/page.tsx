"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  Gavel, Calendar, Clock, Users, CheckCircle2,
  AlertTriangle, FileText, Target, Star
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type ReviewType = "initial" | "first_review" | "subsequent" | "emergency" | "disruption";
type ReviewOutcome = "placement_continues" | "placement_change" | "care_plan_amended" | "actions_agreed" | "return_home";

interface LACReview {
  id: string;
  youngPersonId: string;
  date: string;
  type: ReviewType;
  iro: string;
  venue: string;
  attendees: { name: string; role: string }[];
  childParticipation: "attended" | "views_submitted" | "advocate_attended" | "did_not_participate";
  childViews: string;
  keyDiscussions: string[];
  recommendations: string[];
  outcome: ReviewOutcome;
  actionsAgreed: { action: string; owner: string; dueDate: string; completed: boolean }[];
  nextReviewDate: string;
  placementStability: "stable" | "some_concerns" | "at_risk";
  carePlanUpdated: boolean;
  notes: string;
  recordedBy: string;
  createdAt: string;
}

const TYPE_META: Record<ReviewType, { label: string; color: string }> = {
  initial:       { label: "Initial (20 days)",  color: "bg-blue-100 text-blue-800" },
  first_review:  { label: "First Review (3 months)", color: "bg-purple-100 text-purple-800" },
  subsequent:    { label: "Subsequent (6 monthly)",  color: "bg-green-100 text-green-800" },
  emergency:     { label: "Emergency Review",   color: "bg-red-100 text-red-800" },
  disruption:    { label: "Disruption Meeting",  color: "bg-orange-100 text-orange-800" },
};

const OUTCOME_META: Record<ReviewOutcome, { label: string; color: string }> = {
  placement_continues: { label: "Placement Continues",  color: "bg-green-100 text-green-700" },
  placement_change:    { label: "Placement Change",     color: "bg-red-100 text-red-700" },
  care_plan_amended:   { label: "Care Plan Amended",    color: "bg-amber-100 text-amber-700" },
  actions_agreed:      { label: "Actions Agreed",       color: "bg-blue-100 text-blue-700" },
  return_home:         { label: "Return Home Plan",     color: "bg-purple-100 text-purple-700" },
};

const PARTICIPATION_META: Record<string, string> = {
  attended:           "Attended in person",
  views_submitted:    "Views submitted",
  advocate_attended:  "Advocate attended",
  did_not_participate:"Did not participate",
};

// ── Seed data ────────────────────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: LACReview[] = [
  {
    id: "lac_001", youngPersonId: "yp_alex", date: d(-14), type: "subsequent",
    iro: "Jane Andrews (IRO)", venue: "Oak House — Quiet Room",
    attendees: [
      { name: "Jane Andrews", role: "IRO" },
      { name: "Sarah Mitchell", role: "Social Worker" },
      { name: getStaffName("staff_darren"), role: "Registered Manager" },
      { name: getStaffName("staff_anna"), role: "Residential Worker" },
      { name: "Alex", role: "Young Person" },
      { name: "Ms Roberts", role: "Guardian" },
    ],
    childParticipation: "attended",
    childViews: "Alex said they feel happy and safe at Oak House. Wants to stay here until ready to move on. Excited about college application. Wants to cook more and learn to be independent. Would like to see family more often.",
    keyDiscussions: [
      "Placement stability — excellent progress, no concerns",
      "Education — college application for September, need consent urgently",
      "Independence skills — cooking, budgeting, travel all progressing well",
      "Emotional wellbeing — significant improvement in self-regulation",
      "Contact — family contact is positive, request for more frequent calls",
    ],
    recommendations: [
      "Placement to continue at Oak House — Alex thriving",
      "Expedite college consent from placing authority",
      "Increase family contact to fortnightly calls",
      "Continue key working with focus on independence",
      "Pathway plan to be reviewed and updated",
    ],
    outcome: "placement_continues",
    actionsAgreed: [
      { action: "Submit college consent request", owner: "Sarah Mitchell (SW)", dueDate: d(-7), completed: true },
      { action: "Update pathway plan", owner: getStaffName("staff_darren"), dueDate: d(14), completed: false },
      { action: "Arrange additional family contact", owner: "Sarah Mitchell (SW)", dueDate: d(0), completed: false },
      { action: "Book LAC health assessment", owner: getStaffName("staff_anna"), dueDate: d(21), completed: false },
    ],
    nextReviewDate: d(166), placementStability: "stable", carePlanUpdated: true,
    notes: "Very positive review. Alex participated fully and spoke confidently about achievements and goals. IRO praised the progress made.",
    recordedBy: "staff_darren", createdAt: d(-14),
  },
  {
    id: "lac_002", youngPersonId: "yp_jordan", date: d(-30), type: "subsequent",
    iro: "Michael Torres (IRO)", venue: "Oak House — Office",
    attendees: [
      { name: "Michael Torres", role: "IRO" },
      { name: "David Clarke", role: "Social Worker" },
      { name: getStaffName("staff_darren"), role: "Registered Manager" },
      { name: getStaffName("staff_ryan"), role: "Deputy Manager" },
      { name: "Jordan", role: "Young Person" },
    ],
    childParticipation: "attended",
    childViews: "Jordan said they want to stay at Oak House. Worried about moving on but knows it will happen eventually. Wants to keep playing football. Upset about mum cancelling contact but understands it's not their fault.",
    keyDiscussions: [
      "Placement stability — stable but Jordan anxious about transition",
      "Contact with mother — ongoing cancellations causing distress",
      "Emotional wellbeing — sleep disruption linked to contact anxiety",
      "Positive engagement with football — coach gives excellent feedback",
      "Housing and transition planning — need to start looking at options",
    ],
    recommendations: [
      "Placement continues — Jordan not ready for transition yet",
      "SW to address contact cancellations with mother directly",
      "Consider CAMHS referral for sleep and anxiety",
      "Begin gentle transition planning with PA involvement",
      "Continue football as positive activity",
    ],
    outcome: "actions_agreed",
    actionsAgreed: [
      { action: "Contact mother re cancelled visits", owner: "David Clarke (SW)", dueDate: d(-14), completed: true },
      { action: "CAMHS referral for sleep/anxiety", owner: getStaffName("staff_anna"), dueDate: d(-21), completed: true },
      { action: "Arrange PA introduction meeting", owner: "David Clarke (SW)", dueDate: d(7), completed: false },
      { action: "Start transition planning discussions", owner: getStaffName("staff_ryan"), dueDate: d(14), completed: false },
    ],
    nextReviewDate: d(150), placementStability: "some_concerns", carePlanUpdated: true,
    notes: "Jordan engaged well but became emotional when discussing contact. Staff supported throughout. IRO noted concerns about contact pattern.",
    recordedBy: "staff_darren", createdAt: d(-30),
  },
  {
    id: "lac_003", youngPersonId: "yp_casey", date: d(-7), type: "initial",
    iro: "Sarah Thompson (IRO)", venue: "Oak House — Quiet Room",
    attendees: [
      { name: "Sarah Thompson", role: "IRO" },
      { name: "Emma Watson", role: "Social Worker" },
      { name: getStaffName("staff_darren"), role: "Registered Manager" },
      { name: getStaffName("staff_chervelle"), role: "Key Worker" },
      { name: "Casey", role: "Young Person" },
    ],
    childParticipation: "attended",
    childViews: "Casey said they feel safe at Oak House and likes the other children. Glad to have their own room. Wants to continue at current school. Likes art and writing. Nervous about therapy sessions but willing to try.",
    keyDiscussions: [
      "Settling in — positive first three weeks, bonding well with peers",
      "Education — PEP needed, school consent required",
      "Previous placement concerns — disclosure noted, being sensitively managed",
      "Therapeutic support — expedited referral agreed",
      "Identity and cultural needs — key work sessions planned",
    ],
    recommendations: [
      "Placement appropriate and meeting Casey's needs",
      "Expedite therapy referral",
      "Arrange PEP meeting with school",
      "Key work focus on identity and heritage",
      "Monitor settled period — next review at 3 months",
    ],
    outcome: "placement_continues",
    actionsAgreed: [
      { action: "Therapy referral — expedite", owner: "Emma Watson (SW)", dueDate: d(0), completed: true },
      { action: "Arrange PEP at school", owner: getStaffName("staff_chervelle"), dueDate: d(14), completed: false },
      { action: "Consent for school info sharing", owner: "Emma Watson (SW)", dueDate: d(7), completed: true },
      { action: "Key work plan — identity focus", owner: getStaffName("staff_chervelle"), dueDate: d(14), completed: false },
    ],
    nextReviewDate: d(83), placementStability: "stable", carePlanUpdated: true,
    notes: "Good first review. Casey participated well — nervous but spoke clearly about feelings. All professionals agreed placement is meeting needs.",
    recordedBy: "staff_darren", createdAt: d(-7),
  },
];

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<LACReview>[] = [
  { header: "ID",               accessor: (r: LACReview) => r.id },
  { header: "Young Person",     accessor: (r: LACReview) => getYPName(r.youngPersonId) },
  { header: "Date",             accessor: (r: LACReview) => r.date },
  { header: "Type",             accessor: (r: LACReview) => TYPE_META[r.type].label },
  { header: "IRO",              accessor: (r: LACReview) => r.iro },
  { header: "Venue",            accessor: (r: LACReview) => r.venue },
  { header: "Participation",    accessor: (r: LACReview) => PARTICIPATION_META[r.childParticipation] },
  { header: "Child Views",      accessor: (r: LACReview) => r.childViews },
  { header: "Outcome",          accessor: (r: LACReview) => OUTCOME_META[r.outcome].label },
  { header: "Recommendations",  accessor: (r: LACReview) => r.recommendations.join("; ") },
  { header: "Next Review",      accessor: (r: LACReview) => r.nextReviewDate },
  { header: "Stability",        accessor: (r: LACReview) => r.placementStability },
  { header: "Notes",            accessor: (r: LACReview) => r.notes },
  { header: "Recorded By",      accessor: (r: LACReview) => getStaffName(r.recordedBy) },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function LACReviewsPage() {
  const [reviews, setReviews] = useState<LACReview[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const children = useMemo(() => {
    const ids = [...new Set(reviews.map((r) => r.youngPersonId))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) => r.childViews.toLowerCase().includes(s) || r.recommendations.some((rec) => rec.toLowerCase().includes(s)) || r.notes.toLowerCase().includes(s));
    }
    if (childFilter !== "all") list = list.filter((r) => r.youngPersonId === childFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":  return b.date.localeCompare(a.date);
        case "child": return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        case "type":  return TYPE_META[a.type].label.localeCompare(TYPE_META[b.type].label);
        default:      return 0;
      }
    });
    return list;
  }, [reviews, search, childFilter, sortBy]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const pendingActions = reviews.flatMap((r) => r.actionsAgreed).filter((a) => !a.completed).length;
    const nextReview = reviews.map((r) => r.nextReviewDate).filter(Boolean).sort()[0] || "—";
    const allStable = reviews.every((r) => r.placementStability === "stable");
    return { total, pendingActions, nextReview, allStable };
  }, [reviews]);

  return (
    <PageShell
      title="LAC Reviews"
      subtitle="Looked-After Children review meetings — tracking outcomes, actions, and child participation"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="LAC Reviews" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="lac-reviews" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Review</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Reviews",   value: stats.total,          icon: <Gavel className="h-4 w-4" />,          color: "text-blue-600" },
            { label: "Pending Actions",  value: stats.pendingActions, icon: <AlertTriangle className="h-4 w-4" />,  color: "text-amber-600" },
            { label: "Next Review",      value: stats.nextReview,     icon: <Calendar className="h-4 w-4" />,       color: "text-purple-600" },
            { label: "All Stable",       value: stats.allStable ? "Yes" : "No", icon: <CheckCircle2 className="h-4 w-4" />, color: stats.allStable ? "text-green-600" : "text-red-600" },
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
            const cr = reviews.filter((r) => r.youngPersonId === c.id).sort((a, b) => b.date.localeCompare(a.date));
            const latest = cr[0];
            const pending = latest ? latest.actionsAgreed.filter((a) => !a.completed).length : 0;
            return (
              <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setChildFilter(childFilter === c.id ? "all" : c.id)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{c.name}</p>
                    <Badge variant="outline">{cr.length} reviews</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Last: {latest?.date || "—"} ({latest ? TYPE_META[latest.type].label : "—"})</p>
                    <p>Next: {latest?.nextReviewDate || "—"}</p>
                    <div className="flex items-center justify-between">
                      <span>Stability: <span className={cn("font-medium", latest?.placementStability === "stable" ? "text-green-600" : "text-amber-600")}>{latest?.placementStability || "—"}</span></span>
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
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No reviews match your filters.</p>}
          {filtered.map((r) => {
            const open = !!expanded[r.id];
            const typeM = TYPE_META[r.type];
            const outcomeM = OUTCOME_META[r.outcome];
            const pendingActions = r.actionsAgreed.filter((a) => !a.completed).length;
            return (
              <Card key={r.id} className={cn("border-l-4", r.placementStability === "stable" ? "border-l-green-500" : r.placementStability === "some_concerns" ? "border-l-amber-400" : "border-l-red-500")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(r.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", typeM.color)}>{typeM.label}</Badge>
                        <Badge className={cn("text-xs", outcomeM.color)}>{outcomeM.label}</Badge>
                        {pendingActions > 0 && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">{pendingActions} pending</Badge>}
                      </div>
                      <p className="font-semibold">{getYPName(r.youngPersonId)} — LAC Review</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{r.date}</span>
                        <span>IRO: {r.iro}</span>
                        <span>{r.attendees.length} attendees</span>
                        <span>{PARTICIPATION_META[r.childParticipation]}</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-4 border-t pt-3 text-sm">
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
                          {r.childViews}
                        </div>
                      </div>

                      {/* Key discussions */}
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Key Discussions</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          {r.keyDiscussions.map((kd, i) => <li key={i}>{kd}</li>)}
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
                          {r.actionsAgreed.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {a.completed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Clock className="h-3.5 w-3.5 text-amber-600" />}
                              <span className={a.completed ? "line-through text-muted-foreground" : ""}>{a.action}</span>
                              <span className="text-muted-foreground">({a.owner})</span>
                              <Badge variant="outline" className="text-xs">Due: {a.dueDate}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <div><p className="text-xs text-muted-foreground">Venue</p><p className="font-medium text-xs">{r.venue}</p></div>
                        <div><p className="text-xs text-muted-foreground">Next Review</p><p className="font-medium text-xs">{r.nextReviewDate}</p></div>
                        <div><p className="text-xs text-muted-foreground">Care Plan Updated</p><p className="font-medium text-xs">{r.carePlanUpdated ? "Yes" : "No"}</p></div>
                      </div>

                      {r.notes && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="italic text-muted-foreground text-xs">{r.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

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

      {/* ── New review dialog ─────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record LAC Review</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium">Review Type</label>
                <Select><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">IRO Name</label>
              <Input placeholder="Independent Reviewing Officer" />
            </div>
            <div>
              <label className="text-sm font-medium">Venue</label>
              <Input placeholder="Where was the review held?" />
            </div>
            <div>
              <label className="text-sm font-medium">Child&apos;s Views</label>
              <Textarea placeholder="Record the child's views in their own words…" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Key Discussions</label>
              <Textarea placeholder="Main topics discussed (one per line)" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Next Review Date</label>
              <Input type="date" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Save Review</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
