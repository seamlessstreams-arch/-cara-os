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
import { useYPFeedback, useCreateYPFeedback } from "@/hooks/use-yp-feedback";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { YPFeedbackEntry, YPFeedbackCategory, YPFeedbackMethod, YPFeedbackSentiment } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── config ────────────────────────────────────────────────────────────── */

const CAT_LABELS: Record<YPFeedbackCategory, string> = {
  food: "Food & Meals", activities: "Activities", staff: "Staff",
  bedroom: "Bedroom / Room", rules: "Rules & Boundaries",
  school_support: "School Support", feeling_safe: "Feeling Safe",
  being_listened_to: "Being Listened To", family_contact: "Family Contact", general: "General",
};

const METHOD_LABELS: Record<YPFeedbackMethod, string> = {
  verbal: "Verbal", written: "Written", art: "Artwork", meeting: "Children's Meeting",
  survey: "Survey", worry_box: "Worry Box", advocate: "Via Advocate",
};

const SENTIMENT_LABELS: Record<YPFeedbackSentiment, string> = {
  very_happy: "Very Happy", happy: "Happy", ok: "OK", unhappy: "Unhappy", very_unhappy: "Very Unhappy",
};
const SENTIMENT_EMOJIS: Record<YPFeedbackSentiment, string> = {
  very_happy: "😄", happy: "🙂", ok: "😐", unhappy: "😞", very_unhappy: "😢",
};
const SENTIMENT_COLOURS: Record<YPFeedbackSentiment, string> = {
  very_happy: "bg-green-100 text-green-800", happy: "bg-emerald-100 text-emerald-800",
  ok: "bg-amber-100 text-amber-800", unhappy: "bg-orange-100 text-orange-800",
  very_unhappy: "bg-red-100 text-red-800",
};


/* ── flat row ────────────────────────────────────────────────────────── */

interface FlatRow {
  child_id: string; date: string; category: string; method: string;
  sentiment: string; feedback: string; action_taken: string; action_by: string;
  response_given: string; child_satisfied: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",    accessor: (r: FlatRow) => r.child_id },
  { header: "Date",            accessor: (r: FlatRow) => r.date },
  { header: "Category",        accessor: (r: FlatRow) => r.category },
  { header: "Method",          accessor: (r: FlatRow) => r.method },
  { header: "Sentiment",       accessor: (r: FlatRow) => r.sentiment },
  { header: "Feedback",        accessor: (r: FlatRow) => r.feedback },
  { header: "Action Taken",    accessor: (r: FlatRow) => r.action_taken },
  { header: "Action By",       accessor: (r: FlatRow) => r.action_by },
  { header: "Response Given",  accessor: (r: FlatRow) => r.response_given },
  { header: "Child Satisfied", accessor: (r: FlatRow) => r.child_satisfied },
  { header: "Notes",           accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function YPFeedbackPage() {
  const { data: fbData, isLoading } = useYPFeedback();
  const createFeedback = useCreateYPFeedback();
  const data = fbData?.data ?? [];
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
    const responded = data.filter((f) => f.response_given_to_child).length;
    return { total, positive, negative, responded };
  }, [data]);

  const filtered = useMemo(() => {
    let list = data;
    if (search) { const q = search.toLowerCase(); list = list.filter((f) => getYPName(f.child_id).toLowerCase().includes(q) || f.feedback.toLowerCase().includes(q)); }
    if (filterCategory !== "all") list = list.filter((f) => f.category === filterCategory);
    const out = [...list];
    switch (sortBy) {
      case "date": out.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "sentiment": { const o: Record<string, number> = { very_unhappy: 0, unhappy: 1, ok: 2, happy: 3, very_happy: 4 }; out.sort((a, b) => o[a.sentiment] - o[b.sentiment]); break; }
      case "child": out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
    }
    return out;
  }, [data, search, filterCategory, sortBy]);

  const exportData = useMemo<FlatRow[]>(() =>
    data.map((f) => ({
      child_id: getYPName(f.child_id), date: f.date, category: CAT_LABELS[f.category],
      method: METHOD_LABELS[f.method], sentiment: SENTIMENT_LABELS[f.sentiment],
      feedback: f.feedback, action_taken: f.action_taken, action_by: getStaffName(f.action_by),
      response_given: f.response_given_to_child ? "Yes" : "No",
      child_satisfied: f.child_satisfied === true ? "Yes" : f.child_satisfied === false ? "No" : "Pending",
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
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <>
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
          const entries = data.filter((f) => f.child_id === ypId);
          const sentCounts = entries.reduce((acc, f) => { acc[f.sentiment] = (acc[f.sentiment] || 0) + 1; return acc; }, {} as Record<string, number>);
          return (
            <div key={ypId} className="rounded-lg border bg-white p-4">
              <h3 className="font-semibold">{getYPName(ypId)}</h3>
              <p className="text-xs text-gray-500 mt-1">{entries.length} feedback entries</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(sentCounts).map(([s, c]) => (
                  <span key={s} className={cn("px-2 py-0.5 rounded text-xs font-medium", SENTIMENT_COLOURS[s as YPFeedbackSentiment])}>
                    {SENTIMENT_EMOJIS[s as YPFeedbackSentiment]} {c}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {[...new Set(entries.map((f) => f.category))].map((cat) => (
                  <span key={cat} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">{CAT_LABELS[cat as YPFeedbackCategory]}</span>
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
                    <h3 className="font-semibold">{getYPName(f.child_id)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SENTIMENT_COLOURS[f.sentiment])}>{SENTIMENT_LABELS[f.sentiment]}</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-700">{CAT_LABELS[f.category]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{f.date} · {METHOD_LABELS[f.method]} · {getStaffName(f.collected_by)}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  <div className="mt-3 rounded-md bg-pink-50 border border-pink-200 p-3">
                    <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Feedback</h4>
                    <p className="text-sm text-pink-800">{f.feedback}</p>
                  </div>

                  {f.action_taken && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Action Taken</h4>
                      <p className="text-sm text-blue-800">{f.action_taken}</p>
                      <p className="text-xs text-blue-600 mt-1">By {getStaffName(f.action_by)}</p>
                    </div>
                  )}

                  {f.response_given_to_child && f.response_details && (
                    <div className="rounded-md bg-green-50 border border-green-200 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Response to Child — {f.response_date}</h4>
                      <p className="text-sm text-green-800">{f.response_details}</p>
                      {f.child_satisfied !== null && (
                        <p className="text-xs mt-1 font-medium">{f.child_satisfied ? <span className="text-green-700">✓ Child satisfied with response</span> : <span className="text-amber-700">○ Child not fully satisfied — follow up needed</span>}</p>
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

      </>
      )}

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
                  <SelectContent>{Object.entries(SENTIMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{SENTIMENT_EMOJIS[k as YPFeedbackSentiment]} {v}</SelectItem>)}</SelectContent>
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
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
