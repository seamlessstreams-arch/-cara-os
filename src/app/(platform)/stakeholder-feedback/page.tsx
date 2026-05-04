"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, Star, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronUp, Users, Heart,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const SOURCES = [
  "young_person", "parent_carer", "social_worker", "irp",
  "school", "health_professional", "advocate", "neighbour", "other",
] as const;
type Source = typeof SOURCES[number];
const SOURCE_LABELS: Record<Source, string> = {
  young_person: "Young Person", parent_carer: "Parent / Carer",
  social_worker: "Social Worker", irp: "Independent Reviewing Officer",
  school: "School / College", health_professional: "Health Professional",
  advocate: "Advocate", neighbour: "Neighbour / Community", other: "Other",
};

const SENTIMENTS = ["positive", "mixed", "negative"] as const;
type Sentiment = typeof SENTIMENTS[number];
const SENTIMENT_COLORS: Record<Sentiment, string> = {
  positive: "bg-green-100 text-green-800",
  mixed: "bg-yellow-100 text-yellow-800",
  negative: "bg-red-100 text-red-800",
};

const METHODS = ["survey", "conversation", "letter", "email", "phone", "meeting", "reg44_visit"] as const;
type Method = typeof METHODS[number];
const METHOD_LABELS: Record<Method, string> = {
  survey: "Survey", conversation: "Conversation", letter: "Letter",
  email: "Email", phone: "Phone Call", meeting: "Meeting", reg44_visit: "Reg 44 Visit",
};

const THEMES = [
  "safety", "relationships", "communication", "activities",
  "food", "environment", "education", "health", "contact",
  "complaints", "praise", "suggestions",
] as const;
type Theme = typeof THEMES[number];
const THEME_LABELS: Record<Theme, string> = {
  safety: "Safety", relationships: "Relationships", communication: "Communication",
  activities: "Activities", food: "Food & Meals", environment: "Environment",
  education: "Education", health: "Health", contact: "Contact Arrangements",
  complaints: "Complaints", praise: "Praise", suggestions: "Suggestions",
};

interface FeedbackEntry {
  id: string;
  date: string;
  source: Source;
  sourceName: string;
  relatedYP: string | null;
  method: Method;
  sentiment: Sentiment;
  themes: Theme[];
  summary: string;
  directQuote: string | null;
  actionTaken: string | null;
  respondedBy: string;
  responseDate: string | null;
  acknowledged: boolean;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: FeedbackEntry[] = [
  {
    id: "fb_1", date: d(-3), source: "young_person", sourceName: "Alex",
    relatedYP: "yp_alex", method: "survey", sentiment: "positive",
    themes: ["relationships", "activities", "food"],
    summary: "Quarterly feedback survey. Alex rated overall experience 8/10. Particularly enjoys Friday movie nights and cooking sessions. Said staff 'always listen' when asked about feeling heard. Requested more trips out during weekends.",
    directQuote: "I like living here. The staff are nice and I feel safe.",
    actionTaken: "Activity calendar updated to include more weekend outings. Alex's suggestion added to next house meeting agenda.",
    respondedBy: "staff_anna", responseDate: d(-1), acknowledged: true,
  },
  {
    id: "fb_2", date: d(-7), source: "social_worker", sourceName: "Sarah Mitchell (LA SW)",
    relatedYP: "yp_jordan", method: "phone", sentiment: "positive",
    themes: ["safety", "communication", "praise"],
    summary: "Phone call from Jordan's social worker. Very pleased with progress since placement. Noted excellent communication from the home — always kept informed. Praised the settling-in plan and how staff managed initial anxieties.",
    directQuote: null,
    actionTaken: "Positive feedback shared with team. Letter to be added to Reg 45 evidence.",
    respondedBy: "staff_darren", responseDate: d(-7), acknowledged: true,
  },
  {
    id: "fb_3", date: d(-10), source: "parent_carer", sourceName: "Casey's Mother",
    relatedYP: "yp_casey", method: "conversation", sentiment: "mixed",
    themes: ["contact", "communication", "suggestions"],
    summary: "Casey's mother raised concerns about contact frequency during a visit. Feels she isn't being kept fully updated on Casey's daily life. Acknowledged the home is doing a good job overall but wants more regular phone updates between visits.",
    directQuote: null,
    actionTaken: "Agreed to provide weekly written update to mother in addition to contact sessions. Key worker to call mother every Wednesday evening.",
    respondedBy: "staff_chervelle", responseDate: d(-9), acknowledged: true,
  },
  {
    id: "fb_4", date: d(-14), source: "school", sourceName: "Mrs Taylor (Headteacher)",
    relatedYP: "yp_alex", method: "email", sentiment: "mixed",
    themes: ["education", "communication"],
    summary: "Email from school regarding Alex's attendance, which has dropped to 78%. Acknowledged the home's efforts to encourage attendance but asked for a joint meeting to develop an attendance action plan. Also praised the home for always responding promptly to school communications.",
    directQuote: null,
    actionTaken: "PEP meeting arranged. Education attendance plan being co-developed with school.",
    respondedBy: "staff_darren", responseDate: d(-13), acknowledged: true,
  },
  {
    id: "fb_5", date: d(-5), source: "irp", sourceName: "Independent Visitor",
    relatedYP: null, method: "reg44_visit", sentiment: "positive",
    themes: ["environment", "safety", "praise", "relationships"],
    summary: "Reg 44 visit feedback. Visitor noted the home was clean, warm, and felt like a family home. Spoke with all three young people who all expressed feeling safe. Staff were professional and warm. Minor recommendation about bathroom extractor fan.",
    directQuote: null,
    actionTaken: "Bathroom repair scheduled. Positive feedback circulated to team.",
    respondedBy: "staff_darren", responseDate: d(-4), acknowledged: true,
  },
  {
    id: "fb_6", date: d(-2), source: "young_person", sourceName: "Jordan",
    relatedYP: "yp_jordan", method: "conversation", sentiment: "positive",
    themes: ["relationships", "praise", "food"],
    summary: "Jordan spontaneously told key worker this is the best home they've lived in. Specifically mentioned liking having their own room decorated how they want, and that the food is good. Said they feel staff genuinely care.",
    directQuote: "This is the best place I've ever lived.",
    actionTaken: "Recorded and shared with team. Added to Reg 45 evidence as Voice of the Child.",
    respondedBy: "staff_anna", responseDate: d(-2), acknowledged: true,
  },
  {
    id: "fb_7", date: d(-20), source: "health_professional", sourceName: "Dr Patel (CAMHS)",
    relatedYP: "yp_casey", method: "meeting", sentiment: "positive",
    themes: ["health", "communication", "praise"],
    summary: "CAMHS review meeting. Dr Patel praised the home's consistent approach to supporting Casey's anxiety. Noted the home team's detailed observations are very helpful in planning therapeutic interventions. Recommended continuing current approach.",
    directQuote: null,
    actionTaken: "CAMHS recommendations integrated into care plan.",
    respondedBy: "staff_darren", responseDate: d(-20), acknowledged: true,
  },
  {
    id: "fb_8", date: d(-1), source: "young_person", sourceName: "Casey",
    relatedYP: "yp_casey", method: "survey", sentiment: "mixed",
    themes: ["activities", "suggestions", "food"],
    summary: "Quarterly feedback. Casey rated experience 7/10. Happy with most things but would like more vegetarian options on the menu. Also requested art supplies for their room. Said they sometimes wish it was quieter in the evenings.",
    directQuote: "I wish we could have more veggie meals.",
    actionTaken: "Menu planning to include more vegetarian options. Art supplies to be purchased. Evening routine to be discussed at team meeting.",
    respondedBy: "staff_chervelle", responseDate: null, acknowledged: false,
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function StakeholderFeedbackPage() {
  const [entries] = useState<FeedbackEntry[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.sourceName.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          (e.directQuote && e.directQuote.toLowerCase().includes(q))
      );
    }
    if (filterSource !== "all") list = list.filter((e) => e.source === filterSource);
    if (filterSentiment !== "all") list = list.filter((e) => e.sentiment === filterSentiment);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "source": return a.source.localeCompare(b.source);
        case "sentiment": return SENTIMENTS.indexOf(a.sentiment) - SENTIMENTS.indexOf(b.sentiment);
        default: return 0;
      }
    });
    return list;
  }, [entries, search, filterSource, filterSentiment, sortBy]);

  /* stats */
  const total = entries.length;
  const positive = entries.filter((e) => e.sentiment === "positive").length;
  const negative = entries.filter((e) => e.sentiment === "negative").length;
  const unacknowledged = entries.filter((e) => !e.acknowledged).length;

  const exportCols: ExportColumn<FeedbackEntry>[] = [
    { header: "ID", accessor: (r: FeedbackEntry) => r.id },
    { header: "Date", accessor: (r: FeedbackEntry) => r.date },
    { header: "Source Type", accessor: (r: FeedbackEntry) => SOURCE_LABELS[r.source] },
    { header: "Source Name", accessor: (r: FeedbackEntry) => r.sourceName },
    { header: "Related YP", accessor: (r: FeedbackEntry) => r.relatedYP ? getYPName(r.relatedYP) : "General" },
    { header: "Method", accessor: (r: FeedbackEntry) => METHOD_LABELS[r.method] },
    { header: "Sentiment", accessor: (r: FeedbackEntry) => r.sentiment },
    { header: "Themes", accessor: (r: FeedbackEntry) => r.themes.map((t: Theme) => THEME_LABELS[t]).join(", ") },
    { header: "Summary", accessor: (r: FeedbackEntry) => r.summary },
    { header: "Direct Quote", accessor: (r: FeedbackEntry) => r.directQuote ?? "" },
    { header: "Action Taken", accessor: (r: FeedbackEntry) => r.actionTaken ?? "" },
    { header: "Responded By", accessor: (r: FeedbackEntry) => getStaffName(r.respondedBy) },
    { header: "Response Date", accessor: (r: FeedbackEntry) => r.responseDate ?? "Pending" },
    { header: "Acknowledged", accessor: (r: FeedbackEntry) => r.acknowledged ? "Yes" : "No" },
  ];

  return (
    <PageShell
      title="Stakeholder Feedback"
      subtitle="Feedback from children, families, professionals, and the community"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Stakeholder Feedback" />
          <ExportButton data={filtered} columns={exportCols} filename="stakeholder-feedback" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Feedback
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Feedback", value: total, icon: MessageSquare, colour: "text-blue-600" },
            { label: "Positive", value: positive, icon: ThumbsUp, colour: "text-green-600" },
            { label: "Negative", value: negative, icon: ThumbsDown, colour: negative > 0 ? "text-red-600" : "text-slate-400" },
            { label: "Unacknowledged", value: unacknowledged, icon: AlertTriangle, colour: unacknowledged > 0 ? "text-orange-600" : "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── alerts ────────────────────────────────────────────── */}
        {unacknowledged > 0 && (
          <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <p className="text-sm text-orange-800">
                <strong>{unacknowledged}</strong> feedback item(s) awaiting acknowledgment and response.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search feedback, names, quotes…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterSentiment} onValueChange={setFilterSentiment}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              {SENTIMENTS.map((s) => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="source">Source Type</SelectItem>
                <SelectItem value="sentiment">Sentiment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No feedback matches your filters.</div>
          )}
          {filtered.map((entry) => {
            const isExpanded = expanded === entry.id;
            return (
              <div key={entry.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {entry.source === "young_person" ? (
                      <Heart className="h-5 w-5 text-pink-500 shrink-0" />
                    ) : (
                      <Users className="h-5 w-5 text-blue-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{entry.sourceName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.date} · {SOURCE_LABELS[entry.source]} · {METHOD_LABELS[entry.method]}
                        {entry.relatedYP && ` · Re: ${getYPName(entry.relatedYP)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!entry.acknowledged && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Pending</Badge>}
                    <Badge className={cn("text-xs", SENTIMENT_COLORS[entry.sentiment])}>
                      {entry.sentiment.charAt(0).toUpperCase() + entry.sentiment.slice(1)}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* themes */}
                    <div className="flex flex-wrap gap-1">
                      {entry.themes.map((t: Theme) => (
                        <Badge key={t} variant="outline" className="text-xs">{THEME_LABELS[t]}</Badge>
                      ))}
                    </div>

                    {/* summary */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Summary</p>
                      <p className="text-sm">{entry.summary}</p>
                    </div>

                    {/* direct quote */}
                    {entry.directQuote && (
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="h-4 w-4 text-pink-600" />
                          <p className="text-xs font-medium text-pink-700">Direct Quote</p>
                        </div>
                        <p className="text-sm italic">&ldquo;{entry.directQuote}&rdquo;</p>
                      </div>
                    )}

                    {/* action taken */}
                    {entry.actionTaken && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-medium text-green-700 mb-1">Action Taken</p>
                        <p className="text-sm">{entry.actionTaken}</p>
                      </div>
                    )}

                    {/* response info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Responded By:</span> <span className="font-medium">{getStaffName(entry.respondedBy)}</span></div>
                      <div><span className="text-muted-foreground">Response Date:</span> <span className="font-medium">{entry.responseDate ?? "Pending"}</span></div>
                      <div><span className="text-muted-foreground">Acknowledged:</span> <span className={cn("font-medium", entry.acknowledged ? "text-green-600" : "text-orange-600")}>{entry.acknowledged ? "Yes" : "No"}</span></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Quality Assurance:</strong> Feedback from all stakeholders must be recorded, acknowledged,
          and acted upon. Children&apos;s views are central to quality of care reviews (Reg 45). Feedback themes
          should inform service development and are subject to Ofsted inspection.
        </div>
      </div>

      {/* ── placeholder dialog ──────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Feedback</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground text-sm">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-blue-300" />
            <p>Full form will capture source, method, themes,</p>
            <p>feedback details, and action plan.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
