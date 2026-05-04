"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare, Plus, Search, ArrowUpDown, Filter,
  Star, ChevronDown, ChevronUp, Users, ClipboardCheck,
  ThumbsUp, AlertTriangle, Lightbulb, CheckCircle2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const VISITOR_ROLES = [
  "reg44", "social_worker", "family", "professional", "iro", "other",
] as const;
type VisitorRole = typeof VISITOR_ROLES[number];
const ROLE_LABELS: Record<VisitorRole, string> = {
  reg44: "Reg 44 Visitor",
  social_worker: "Social Worker",
  family: "Family Member",
  professional: "Professional",
  iro: "IRO",
  other: "Other Visitor",
};
const ROLE_COLOURS: Record<VisitorRole, string> = {
  reg44: "bg-purple-100 text-purple-800",
  social_worker: "bg-blue-100 text-blue-800",
  family: "bg-pink-100 text-pink-800",
  professional: "bg-teal-100 text-teal-800",
  iro: "bg-indigo-100 text-indigo-800",
  other: "bg-slate-100 text-slate-800",
};

interface VisitorFeedback {
  id: string;
  visitorName: string;
  visitorRole: VisitorRole;
  visitDate: string;
  rating: number;
  positives: string[];
  concerns: string[];
  suggestions: string[];
  actionTaken: string | null;
  respondedBy: string | null;
  childRelated: string | null;
  notes: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: VisitorFeedback[] = [
  {
    id: "vf_1",
    visitorName: "Margaret Thompson",
    visitorRole: "reg44",
    visitDate: d(-14),
    rating: 4,
    positives: [
      "Home is well-run with clear routines and structure",
      "Children appeared happy, settled, and well cared for",
      "Staff were warm, professional, and child-focused",
      "Documentation and records were in good order",
    ],
    concerns: [],
    suggestions: [
      "Improve the garden area to create a more inviting outdoor space for the children",
    ],
    actionTaken: "Garden improvement plan drawn up. Budget approved for new outdoor furniture and planting. Work scheduled for next month.",
    respondedBy: "staff_darren",
    childRelated: "All",
    notes: "Monthly Reg 44 independent visit. Margaret spoke with all three young people individually and reviewed a sample of records. Overall a very positive visit with one minor recommendation regarding the outdoor space.",
  },
  {
    id: "vf_2",
    visitorName: "Lisa Green",
    visitorRole: "social_worker",
    visitDate: d(-10),
    rating: 3,
    positives: [
      "Staff clearly care about Casey and understand his needs",
      "LADO process has been handled transparently and professionally",
      "Good communication between home and placing authority",
    ],
    concerns: [
      "Casey is increasingly disengaged from education and attendance has dropped",
    ],
    suggestions: [
      "Consider a PEP review to address educational disengagement",
      "Explore alternative education provisions if mainstream continues to be a challenge",
    ],
    actionTaken: "PEP review meeting arranged with school and virtual school head. Key worker to implement daily education check-in with Casey.",
    respondedBy: "staff_darren",
    childRelated: "Casey",
    notes: "Statutory visit for Casey. Lisa was generally positive about the placement and the quality of care. She raised valid concerns about educational engagement which the home is addressing proactively. Acknowledged the LADO referral was handled correctly and in a timely manner.",
  },
  {
    id: "vf_3",
    visitorName: "Jean (Alex's Grandmother)",
    visitorRole: "family",
    visitDate: d(-21),
    rating: 5,
    positives: [
      "Alex looks so well and happy since being placed at Oak House",
      "Staff are wonderful and make the family feel welcome",
      "The home environment is clean, warm, and feels like a real home",
      "Alex is clearly thriving and making progress",
    ],
    concerns: [],
    suggestions: [],
    actionTaken: null,
    respondedBy: null,
    childRelated: "Alex",
    notes: "Jean visited Alex for a family contact session. She was extremely positive about every aspect of the home and Alex's care. She became emotional expressing her gratitude to the staff team. This feedback was shared with the team during handover.",
  },
  {
    id: "vf_4",
    visitorName: "Dr K. Rahman (CAMHS)",
    visitorRole: "professional",
    visitDate: d(-7),
    rating: 4,
    positives: [
      "Impressed with the home's trauma-informed approach to care",
      "Medication management is excellent with thorough records",
      "Staff demonstrate strong understanding of Casey's mental health needs",
    ],
    concerns: [],
    suggestions: [
      "More regular communication about Casey's mental health between scheduled visits would be beneficial",
      "Consider implementing a brief weekly mood-tracking tool that staff can share with CAMHS",
    ],
    actionTaken: "Weekly CAMHS update email agreed with Dr Rahman. Staff to complete brief mood tracker for Casey each shift, shared fortnightly with CAMHS team.",
    respondedBy: "staff_darren",
    childRelated: "Casey",
    notes: "Dr Rahman visited to review Casey's therapeutic progress and medication. Very positive about the home's approach. Made helpful suggestions about improving communication between visits which have been implemented.",
  },
  {
    id: "vf_5",
    visitorName: "Sarah Mitchell",
    visitorRole: "iro",
    visitDate: d(-30),
    rating: 4,
    positives: [
      "Good placement where Alex is thriving",
      "Strong key working relationship between Alex and Ryan",
      "Care plan is being followed and outcomes are being met",
      "Alex expressed feeling safe and happy during the review",
    ],
    concerns: [],
    suggestions: [
      "Ensure life story work is progressed and documented",
    ],
    actionTaken: "Life story work sessions scheduled fortnightly with Ryan. Progress to be recorded and evidenced in care plan reviews.",
    respondedBy: "staff_darren",
    childRelated: "Alex",
    notes: "Alex's LAC review. Sarah was very pleased with the placement and Alex's progress. She noted the strong bond with key worker Ryan and the positive impact this is having. One recommendation around life story work which is now in progress.",
  },
];

/* ── stars renderer ──────────────────────────────────────────────────── */
function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
          )}
        />
      ))}
    </div>
  );
}

/* ── component ───────────────────────────────────────────────────────── */
export default function VisitorsFeedbackPage() {
  const [entries] = useState<VisitorFeedback[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.visitorName.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q) ||
          (e.childRelated && e.childRelated.toLowerCase().includes(q)) ||
          e.positives.some((p) => p.toLowerCase().includes(q)) ||
          e.concerns.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (filterRole !== "all") list = list.filter((e) => e.visitorRole === filterRole);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.visitDate.localeCompare(a.visitDate);
        case "role": return a.visitorRole.localeCompare(b.visitorRole);
        case "rating": return b.rating - a.rating;
        default: return 0;
      }
    });
    return list;
  }, [entries, search, filterRole, sortBy]);

  /* ── summary stats ───────────────────────────────────────────────── */
  const totalFeedback = entries.length;
  const avgRating = entries.length > 0
    ? (entries.reduce((sum, e) => sum + e.rating, 0) / entries.length).toFixed(1)
    : "0.0";
  const positivePercent = entries.length > 0
    ? Math.round((entries.filter((e) => e.rating >= 4).length / entries.length) * 100)
    : 0;
  const concernsRaised = entries.filter((e) => e.concerns.length > 0).length;

  /* ── export columns ──────────────────────────────────────────────── */
  const exportCols: ExportColumn<VisitorFeedback>[] = [
    { header: "ID", accessor: (r: VisitorFeedback) => r.id },
    { header: "Visitor Name", accessor: (r: VisitorFeedback) => r.visitorName },
    { header: "Visitor Role", accessor: (r: VisitorFeedback) => ROLE_LABELS[r.visitorRole] },
    { header: "Visit Date", accessor: (r: VisitorFeedback) => r.visitDate },
    { header: "Rating", accessor: (r: VisitorFeedback) => `${r.rating}/5` },
    { header: "Positives", accessor: (r: VisitorFeedback) => r.positives.join("; ") },
    { header: "Concerns", accessor: (r: VisitorFeedback) => r.concerns.join("; ") },
    { header: "Suggestions", accessor: (r: VisitorFeedback) => r.suggestions.join("; ") },
    { header: "Action Taken", accessor: (r: VisitorFeedback) => r.actionTaken ?? "" },
    { header: "Responded By", accessor: (r: VisitorFeedback) => r.respondedBy ? getStaffName(r.respondedBy) : "" },
    { header: "Child Related", accessor: (r: VisitorFeedback) => r.childRelated ?? "General" },
    { header: "Notes", accessor: (r: VisitorFeedback) => r.notes },
  ];

  return (
    <PageShell
      title="Visitors' Feedback"
      subtitle="Feedback from Reg 44 visitors, IROs, social workers, family members, and professionals"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Visitors' Feedback" />
          <ExportButton data={filtered} columns={exportCols} filename="visitors-feedback" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Feedback
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Feedback", value: totalFeedback, icon: MessageSquare, colour: "text-blue-600" },
            { label: "Average Rating", value: `${avgRating}/5`, icon: Star, colour: "text-amber-500" },
            { label: "Positive Feedback", value: `${positivePercent}%`, icon: ThumbsUp, colour: "text-green-600" },
            {
              label: "Concerns Raised",
              value: concernsRaised,
              icon: AlertTriangle,
              colour: concernsRaised > 0 ? "text-orange-600" : "text-slate-400",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={cn("h-5 w-5", s.colour)} />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── filters ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search visitors, notes, feedback..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visitors</SelectItem>
                {VISITOR_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="role">Visitor Role</SelectItem>
                <SelectItem value="rating">Rating (High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── feedback list ───────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No feedback matches your filters.</div>
          )}
          {filtered.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <div key={entry.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Users className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{entry.visitorName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.visitDate} · {ROLE_LABELS[entry.visitorRole]}
                        {entry.childRelated && ` · Re: ${entry.childRelated}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stars rating={entry.rating} />
                    <Badge className={cn("text-xs", ROLE_COLOURS[entry.visitorRole])}>
                      {ROLE_LABELS[entry.visitorRole]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* rating */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Rating:</span>
                      <Stars rating={entry.rating} />
                      <span className="text-sm font-medium">{entry.rating}/5</span>
                    </div>

                    {/* positives */}
                    {entry.positives.length > 0 && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                          <p className="text-xs font-medium text-green-700">Positives</p>
                        </div>
                        <ul className="space-y-1">
                          {entry.positives.map((p, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* concerns */}
                    {entry.concerns.length > 0 && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <p className="text-xs font-medium text-red-700">Concerns</p>
                        </div>
                        <ul className="space-y-1">
                          {entry.concerns.map((c, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* suggestions */}
                    {entry.suggestions.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <Lightbulb className="h-4 w-4 text-amber-600" />
                          <p className="text-xs font-medium text-amber-700">Suggestions</p>
                        </div>
                        <ul className="space-y-1">
                          {entry.suggestions.map((s, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* action taken */}
                    {entry.actionTaken && (
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <ClipboardCheck className="h-4 w-4 text-blue-600" />
                          <p className="text-xs font-medium text-blue-700">Action Taken</p>
                        </div>
                        <p className="text-sm">{entry.actionTaken}</p>
                      </div>
                    )}

                    {/* notes */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                      <p className="text-sm">{entry.notes}</p>
                    </div>

                    {/* response info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Responded By:</span>{" "}
                        <span className="font-medium">
                          {entry.respondedBy ? getStaffName(entry.respondedBy) : "Pending"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Child Related:</span>{" "}
                        <span className="font-medium">{entry.childRelated ?? "General"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rating:</span>{" "}
                        <span className="font-medium">{entry.rating}/5</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ─────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulatory Guidance:</strong> Regulation 44 of the Children&apos;s Homes (England) Regulations
          2015 requires monthly independent visits to monitor the home&apos;s effectiveness.
          All visitor feedback must be recorded, considered, and where appropriate acted upon.
          Listening to stakeholders and incorporating their feedback into the home&apos;s improvement
          plan demonstrates a commitment to continuous improvement and is a key area of Ofsted inspection.
        </div>
      </div>

      {/* ── placeholder dialog ────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Visitor Feedback</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground text-sm">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-blue-300" />
            <p>Full form will capture visitor details, role,</p>
            <p>rating, positives, concerns, suggestions,</p>
            <p>and actions taken.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
