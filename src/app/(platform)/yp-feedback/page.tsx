"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Star,
  ThumbsUp,
  Heart,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type FeedbackCategory = "food" | "activities" | "staff" | "bedroom" | "rules" | "school_support" | "feeling_safe" | "being_listened_to" | "family_contact" | "general";
type FeedbackMethod = "verbal" | "written" | "art" | "meeting" | "survey" | "worry_box" | "advocate";
type Sentiment = "very_happy" | "happy" | "ok" | "unhappy" | "very_unhappy";

interface FeedbackEntry {
  id: string;
  youngPersonId: string;
  date: string;
  category: FeedbackCategory;
  method: FeedbackMethod;
  sentiment: Sentiment;
  feedback: string;
  actionTaken: string;
  actionBy: string;
  responseGivenToChild: boolean;
  responseDate: string | null;
  responseDetails: string;
  childSatisfied: boolean | null;
  collectedBy: string;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CAT_LABELS: Record<FeedbackCategory, string> = {
  food: "Food & Meals", activities: "Activities", staff: "Staff",
  bedroom: "Bedroom / Room", rules: "Rules & Boundaries",
  school_support: "School Support", feeling_safe: "Feeling Safe",
  being_listened_to: "Being Listened To", family_contact: "Family Contact", general: "General",
};

const METHOD_LABELS: Record<FeedbackMethod, string> = {
  verbal: "Verbal", written: "Written", art: "Artwork", meeting: "Children's Meeting",
  survey: "Survey", worry_box: "Worry Box", advocate: "Via Advocate",
};

const SENTIMENT_LABELS: Record<Sentiment, string> = {
  very_happy: "Very Happy", happy: "Happy", ok: "OK", unhappy: "Unhappy", very_unhappy: "Very Unhappy",
};
const SENTIMENT_EMOJIS: Record<Sentiment, string> = {
  very_happy: "😄", happy: "🙂", ok: "😐", unhappy: "😞", very_unhappy: "😢",
};
const SENTIMENT_COLOURS: Record<Sentiment, string> = {
  very_happy: "bg-green-100 text-green-800", happy: "bg-emerald-100 text-emerald-800",
  ok: "bg-amber-100 text-amber-800", unhappy: "bg-orange-100 text-orange-800",
  very_unhappy: "bg-red-100 text-red-800",
};

const SEED: FeedbackEntry[] = [
  {
    id: "fb1", youngPersonId: "yp_alex", date: d(-3), category: "food",
    method: "meeting", sentiment: "happy",
    feedback: "Alex said they really like the new taco Tuesday idea and wants it to keep going. Also asked if they could help cook the tacos sometimes — said it would be good practice for when they move to supported living.",
    actionTaken: "Taco Tuesday confirmed as ongoing. Alex to help cook next Tuesday with Edward's support. Added to independence skills cooking practice.",
    actionBy: "staff_anna", responseGivenToChild: true, responseDate: d(-2),
    responseDetails: "Anna told Alex that taco Tuesday is staying and they can help cook next week. Alex was pleased.",
    childSatisfied: true, collectedBy: "staff_anna",
    notes: "Great feedback — linking food preferences to independence goals.",
  },
  {
    id: "fb2", youngPersonId: "yp_alex", date: d(-10), category: "being_listened_to",
    method: "verbal", sentiment: "ok",
    feedback: "Alex said sometimes they feel like decisions are made without them being asked. Mentioned the example of a new bedtime being decided without their input. 'I know I'm not 18 yet but it's my life.'",
    actionTaken: "Discussed with Alex — acknowledged their point. Agreed that any changes to Alex's routine will be discussed with them first. Review of how decisions are communicated to children.",
    actionBy: "staff_darren", responseGivenToChild: true, responseDate: d(-9),
    responseDetails: "Darren met with Alex and apologised for the bedtime change not being discussed. New process agreed — Alex will be consulted on routine changes.",
    childSatisfied: true, collectedBy: "staff_anna",
    notes: "Important feedback. Led to team discussion about participation in decision-making.",
  },
  {
    id: "fb3", youngPersonId: "yp_jordan", date: d(-5), category: "feeling_safe",
    method: "art", sentiment: "happy",
    feedback: "Jordan drew a picture of Oak House with a big heart around it and wrote 'my safe place' underneath. In conversation with Chervelle, Jordan said they feel safe here because 'nobody shouts and the doors don't slam.'",
    actionTaken: "No action needed — positive feedback. Artwork displayed (with permission) in Jordan's file. Shared with team as positive evidence of therapeutic environment.",
    actionBy: "staff_chervelle", responseGivenToChild: true, responseDate: d(-5),
    responseDetails: "Chervelle thanked Jordan for sharing. Asked if the picture could go in their life story book — Jordan said yes.",
    childSatisfied: true, collectedBy: "staff_chervelle",
    notes: "Significant positive feedback given Jordan's history. Evidence for Reg 45 — child feels safe.",
  },
  {
    id: "fb4", youngPersonId: "yp_jordan", date: d(-12), category: "bedroom",
    method: "worry_box", sentiment: "unhappy",
    feedback: "Anonymous worry box submission (handwriting identified as Jordan's): 'My room gets too hot at night and I can't sleep. The window doesn't open enough and the fan is too noisy.'",
    actionTaken: "Quieter fan purchased immediately. Discussed window restriction with RM — not possible to widen due to safety requirements but additional ventilation explored. Room temperature monitoring started.",
    actionBy: "staff_ryan", responseGivenToChild: true, responseDate: d(-11),
    responseDetails: "Ryan spoke to Jordan (sensitively, as submitted anonymously). New quiet fan provided. Jordan tested it and approved. Also offered to move to downstairs bedroom if heat persists in summer.",
    childSatisfied: true, collectedBy: "staff_anna",
    notes: "Good use of worry box. Responded within 24 hours. Jordan pleased with new fan.",
  },
  {
    id: "fb5", youngPersonId: "yp_casey", date: d(-2), category: "activities",
    method: "verbal", sentiment: "very_happy",
    feedback: "Casey said 'this is the best house ever because we do fun stuff at weekends!' Specifically mentioned the bowling trip and movie nights on Fridays. Wants to go swimming more often.",
    actionTaken: "Swimming added to activity schedule — fortnightly Saturdays. Casey to choose between local pool and leisure centre with slides.",
    actionBy: "staff_edward", responseGivenToChild: true, responseDate: d(-1),
    responseDetails: "Edward told Casey about the fortnightly swimming plan. Casey chose the leisure centre with slides. First trip this Saturday.",
    childSatisfied: true, collectedBy: "staff_anna",
    notes: "Lovely feedback. Activities programme clearly valued by Casey.",
  },
  {
    id: "fb6", youngPersonId: "yp_casey", date: d(-8), category: "family_contact",
    method: "verbal", sentiment: "unhappy",
    feedback: "Casey was upset after contact with mum and said: 'Mum was on her phone the whole time. I wanted to show her my school work but she wasn't looking.' Casey asked if someone could 'tell mum to put her phone away.'",
    actionTaken: "Acknowledged Casey's feelings. Discussed with social worker about addressing phone use in contact agreement. Post-contact routine activated — warm drink, quality time with key worker.",
    actionBy: "staff_anna", responseGivenToChild: true, responseDate: d(-7),
    responseDetails: "Anna validated Casey's feelings and explained that the social worker would talk to mum about phones. Reassured Casey that their school work is amazing and they'd display it in their bedroom.",
    childSatisfied: null, collectedBy: "staff_anna",
    notes: "Repeated concern. SW James Okafor contacted. Contact agreement to be amended to explicitly address phone use.",
  },
  {
    id: "fb7", youngPersonId: "yp_alex", date: d(-1), category: "staff",
    method: "survey", sentiment: "very_happy",
    feedback: "In the quarterly survey, Alex rated staff 5/5 for 'treating me with respect' and 4/5 for 'helping me prepare for the future.' Comment: 'Anna is brilliant. She actually listens and doesn't just say what she thinks I want to hear.'",
    actionTaken: "Positive feedback shared with Anna (with Alex's permission). Team briefing on what 'authentic listening' looks like — learning from this positive example.",
    actionBy: "staff_darren", responseGivenToChild: true, responseDate: d(-1),
    responseDetails: "Darren thanked Alex for the feedback and said it would help the team keep improving.",
    childSatisfied: true, collectedBy: "staff_darren",
    notes: "Quarterly satisfaction survey — overall scores improving. Alex's specific feedback about Anna is excellent evidence of relationship-based practice.",
  },
];

/* ── flat row ────────────────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string; date: string; category: string; method: string;
  sentiment: string; feedback: string; actionTaken: string; actionBy: string;
  responseGiven: string; childSatisfied: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",    accessor: (r: FlatRow) => r.youngPerson },
  { header: "Date",            accessor: (r: FlatRow) => r.date },
  { header: "Category",        accessor: (r: FlatRow) => r.category },
  { header: "Method",          accessor: (r: FlatRow) => r.method },
  { header: "Sentiment",       accessor: (r: FlatRow) => r.sentiment },
  { header: "Feedback",        accessor: (r: FlatRow) => r.feedback },
  { header: "Action Taken",    accessor: (r: FlatRow) => r.actionTaken },
  { header: "Action By",       accessor: (r: FlatRow) => r.actionBy },
  { header: "Response Given",  accessor: (r: FlatRow) => r.responseGiven },
  { header: "Child Satisfied", accessor: (r: FlatRow) => r.childSatisfied },
  { header: "Notes",           accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function YPFeedbackPage() {
  const [data] = useState<FeedbackEntry[]>(SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const stats = useMemo(() => {
    const total = data.length;
    const positive = data.filter((f) => ["very_happy", "happy"].includes(f.sentiment)).length;
    const negative = data.filter((f) => ["unhappy", "very_unhappy"].includes(f.sentiment)).length;
    const responded = data.filter((f) => f.responseGivenToChild).length;
    return { total, positive, negative, responded };
  }, [data]);

  const filtered = useMemo(() => {
    let list = data;
    if (search) { const q = search.toLowerCase(); list = list.filter((f) => getYPName(f.youngPersonId).toLowerCase().includes(q) || f.feedback.toLowerCase().includes(q)); }
    if (filterCategory !== "all") list = list.filter((f) => f.category === filterCategory);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "sentiment": { const o: Record<string, number> = { very_unhappy: 0, unhappy: 1, ok: 2, happy: 3, very_happy: 4 }; out.sort((a, b) => o[a.sentiment] - o[b.sentiment]); break; }
      case "child": out.sort((a, b) => getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId))); break;
    }
    return out;
  }, [data, search, filterCategory, sortBy]);

  const exportData = useMemo<FlatRow[]>(() =>
    data.map((f) => ({
      youngPerson: getYPName(f.youngPersonId), date: f.date, category: CAT_LABELS[f.category],
      method: METHOD_LABELS[f.method], sentiment: SENTIMENT_LABELS[f.sentiment],
      feedback: f.feedback, actionTaken: f.actionTaken, actionBy: getStaffName(f.actionBy),
      responseGiven: f.responseGivenToChild ? "Yes" : "No",
      childSatisfied: f.childSatisfied === true ? "Yes" : f.childSatisfied === false ? "No" : "Pending",
      notes: f.notes,
    })), [data]);

  return (
    <PageShell
      title="Young People's Feedback"
      subtitle="Capturing children's views, experiences and satisfaction — making their voice count"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Young People's Feedback" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="yp-feedback" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Record Feedback
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Feedback", value: stats.total, icon: MessageSquare, colour: "text-blue-600" },
          { label: "Positive", value: stats.positive, icon: ThumbsUp, colour: "text-green-600" },
          { label: "Needs Attention", value: stats.negative, icon: AlertTriangle, colour: stats.negative > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Responded To", value: `${stats.responded}/${stats.total}`, icon: Heart, colour: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* sentiment overview per child */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {["yp_alex", "yp_jordan", "yp_casey"].map((ypId) => {
          const entries = data.filter((f) => f.youngPersonId === ypId);
          const sentCounts = entries.reduce((acc, f) => { acc[f.sentiment] = (acc[f.sentiment] || 0) + 1; return acc; }, {} as Record<string, number>);
          return (
            <div key={ypId} className="rounded-lg border bg-white p-4">
              <h3 className="font-semibold">{getYPName(ypId)}</h3>
              <p className="text-xs text-gray-500 mt-1">{entries.length} feedback entries</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(sentCounts).map(([s, c]) => (
                  <span key={s} className={cn("px-2 py-0.5 rounded text-xs font-medium", SENTIMENT_COLOURS[s as Sentiment])}>
                    {SENTIMENT_EMOJIS[s as Sentiment]} {c}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {[...new Set(entries.map((f) => f.category))].map((cat) => (
                  <span key={cat} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{CAT_LABELS[cat as FeedbackCategory]}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div id="feedback-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search feedback…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="sentiment">Sentiment</SelectItem>
              <SelectItem value="child">Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {filtered.map((f) => {
          const open = expanded[f.id] ?? false;
          return (
            <div key={f.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(f.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{SENTIMENT_EMOJIS[f.sentiment]}</span>
                    <h3 className="font-semibold">{getYPName(f.youngPersonId)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SENTIMENT_COLOURS[f.sentiment])}>{SENTIMENT_LABELS[f.sentiment]}</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700">{CAT_LABELS[f.category]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{f.date} · {METHOD_LABELS[f.method]} · {getStaffName(f.collectedBy)}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  <div className="mt-3 rounded-md bg-pink-50 border border-pink-200 p-3">
                    <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Feedback</h4>
                    <p className="text-sm text-pink-800">{f.feedback}</p>
                  </div>

                  {f.actionTaken && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Action Taken</h4>
                      <p className="text-sm text-blue-800">{f.actionTaken}</p>
                      <p className="text-xs text-blue-600 mt-1">By {getStaffName(f.actionBy)}</p>
                    </div>
                  )}

                  {f.responseGivenToChild && f.responseDetails && (
                    <div className="rounded-md bg-green-50 border border-green-200 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Response to Child — {f.responseDate}</h4>
                      <p className="text-sm text-green-800">{f.responseDetails}</p>
                      {f.childSatisfied !== null && (
                        <p className="text-xs mt-1 font-medium">{f.childSatisfied ? <span className="text-green-700">✓ Child satisfied with response</span> : <span className="text-amber-700">○ Child not fully satisfied — follow up needed</span>}</p>
                      )}
                    </div>
                  )}

                  {f.notes && <div><h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4><p className="text-sm text-gray-700">{f.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Reg 7 — Voice of the Child:</strong> Children must be enabled to express their views, wishes and feelings. Feedback must be actively sought through multiple methods (verbal, written, artwork, surveys, meetings, worry boxes) and always responded to. Children must see that their feedback leads to real change. Every piece of feedback should be recorded, acted upon, and the response fed back to the child.
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Record Feedback</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Young Person</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{["yp_alex","yp_jordan","yp_casey"].map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Category</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Method</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(METHOD_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Sentiment</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(SENTIMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{SENTIMENT_EMOJIS[k as Sentiment]} {v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Feedback</label><textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="What did the child say/express?" /></div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Save Feedback</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
