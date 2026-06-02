"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, Star, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronUp, Users, Heart, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { toast } from "sonner";
import { useStakeholderFeedbackRecords, useCreateStakeholderFeedbackRecord } from "@/hooks/use-stakeholder-feedback-records";
import type {
  StakeholderFeedbackRecord,
  StakeholderFeedbackSource,
  StakeholderFeedbackSentiment,
  StakeholderFeedbackMethod,
  StakeholderFeedbackTheme,
} from "@/types/extended";
import {
  STAKEHOLDER_FEEDBACK_SOURCE_LABEL,
  STAKEHOLDER_FEEDBACK_SENTIMENT_LABEL,
  STAKEHOLDER_FEEDBACK_METHOD_LABEL,
  STAKEHOLDER_FEEDBACK_THEME_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local config ───────────────────────────────────────────────────── */

const SENTIMENT_COLORS: Record<StakeholderFeedbackSentiment, string> = {
  positive: "bg-green-100 text-green-800",
  mixed: "bg-yellow-100 text-yellow-800",
  negative: "bg-red-100 text-red-800",
};

const SENTIMENTS: StakeholderFeedbackSentiment[] = ["positive", "mixed", "negative"];

/* ── component ───────────────────────────────────────────────────────── */
export default function StakeholderFeedbackPage() {
  const { data: records = [], isLoading } = useStakeholderFeedbackRecords();
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const createRecord = useCreateStakeholderFeedbackRecord();
  const [sfForm, setSfForm] = useState({ date: new Date().toISOString().slice(0, 10), source: "social_worker" as StakeholderFeedbackSource, source_name: "", method: "conversation" as StakeholderFeedbackMethod, sentiment: "positive" as StakeholderFeedbackSentiment, summary: "", direct_quote: "", action_taken: "" });
  const setSF = (k: string, v: unknown) => setSfForm((p) => ({ ...p, [k]: v }));

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sfForm.summary.trim()) { toast.error("Summary is required."); return; }
    await createRecord.mutateAsync({ date: sfForm.date, source: sfForm.source, source_name: sfForm.source_name.trim(), related_yp: null, method: sfForm.method, sentiment: sfForm.sentiment, themes: [], summary: sfForm.summary.trim(), direct_quote: sfForm.direct_quote.trim() || null, action_taken: sfForm.action_taken.trim() || null, responded_by: "staff_darren", response_date: null, acknowledged: false });
    toast.success("Stakeholder feedback recorded.");
    setSfForm({ date: new Date().toISOString().slice(0, 10), source: "social_worker", source_name: "", method: "conversation", sentiment: "positive", summary: "", direct_quote: "", action_taken: "" });
    setShowNew(false);
  };

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.source_name.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          (e.direct_quote && e.direct_quote.toLowerCase().includes(q))
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
  }, [records, search, filterSource, filterSentiment, sortBy]);

  /* stats */
  const total = records.length;
  const positive = records.filter((e) => e.sentiment === "positive").length;
  const negative = records.filter((e) => e.sentiment === "negative").length;
  const unacknowledged = records.filter((e) => !e.acknowledged).length;

  const exportCols: ExportColumn<StakeholderFeedbackRecord>[] = [
    { header: "ID", accessor: (r: StakeholderFeedbackRecord) => r.id },
    { header: "Date", accessor: (r: StakeholderFeedbackRecord) => r.date },
    { header: "Source Type", accessor: (r: StakeholderFeedbackRecord) => STAKEHOLDER_FEEDBACK_SOURCE_LABEL[r.source] },
    { header: "Source Name", accessor: (r: StakeholderFeedbackRecord) => r.source_name },
    { header: "Related YP", accessor: (r: StakeholderFeedbackRecord) => r.related_yp ? getYPName(r.related_yp) : "General" },
    { header: "Method", accessor: (r: StakeholderFeedbackRecord) => STAKEHOLDER_FEEDBACK_METHOD_LABEL[r.method] },
    { header: "Sentiment", accessor: (r: StakeholderFeedbackRecord) => STAKEHOLDER_FEEDBACK_SENTIMENT_LABEL[r.sentiment] },
    { header: "Themes", accessor: (r: StakeholderFeedbackRecord) => r.themes.map((t) => STAKEHOLDER_FEEDBACK_THEME_LABEL[t]).join(", ") },
    { header: "Summary", accessor: (r: StakeholderFeedbackRecord) => r.summary },
    { header: "Direct Quote", accessor: (r: StakeholderFeedbackRecord) => r.direct_quote ?? "" },
    { header: "Action Taken", accessor: (r: StakeholderFeedbackRecord) => r.action_taken ?? "" },
    { header: "Responded By", accessor: (r: StakeholderFeedbackRecord) => getStaffName(r.responded_by) },
    { header: "Response Date", accessor: (r: StakeholderFeedbackRecord) => r.response_date ?? "Pending" },
    { header: "Acknowledged", accessor: (r: StakeholderFeedbackRecord) => r.acknowledged ? "Yes" : "No" },
  ];

  if (isLoading) {
    return (
      <PageShell title="Stakeholder Feedback" subtitle="Feedback from children, families, professionals, and the community">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Stakeholder Feedback"
      subtitle="Feedback from children, families, professionals, and the community"
      ariaContext={{ pageTitle: "Stakeholder Feedback", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Stakeholder Feedback" />
          <ExportButton data={filtered} columns={exportCols} filename="stakeholder-feedback" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Feedback
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Feedback", value: total, icon: MessageSquare, colour: "text-blue-600" },
            { label: "Positive", value: positive, icon: ThumbsUp, colour: "text-green-600" },
            { label: "Negative", value: negative, icon: ThumbsDown, colour: negative > 0 ? "text-red-600" : "text-[var(--cs-text-muted)]" },
            { label: "Unacknowledged", value: unacknowledged, icon: AlertTriangle, colour: unacknowledged > 0 ? "text-orange-600" : "text-[var(--cs-text-muted)]" },
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
                {(Object.entries(STAKEHOLDER_FEEDBACK_SOURCE_LABEL) as [StakeholderFeedbackSource, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterSentiment} onValueChange={setFilterSentiment}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              {(Object.entries(STAKEHOLDER_FEEDBACK_SENTIMENT_LABEL) as [StakeholderFeedbackSentiment, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
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
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {entry.source === "young_person" ? (
                      <Heart className="h-5 w-5 text-pink-500 shrink-0" />
                    ) : (
                      <Users className="h-5 w-5 text-blue-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{entry.source_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.date} · {STAKEHOLDER_FEEDBACK_SOURCE_LABEL[entry.source]} · {STAKEHOLDER_FEEDBACK_METHOD_LABEL[entry.method]}
                        {entry.related_yp && ` · Re: ${getYPName(entry.related_yp)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!entry.acknowledged && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Pending</Badge>}
                    <Badge className={cn("text-xs", SENTIMENT_COLORS[entry.sentiment])}>
                      {STAKEHOLDER_FEEDBACK_SENTIMENT_LABEL[entry.sentiment]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* themes */}
                    <div className="flex flex-wrap gap-1">
                      {(entry.themes ?? []).map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">{STAKEHOLDER_FEEDBACK_THEME_LABEL[t]}</Badge>
                      ))}
                    </div>

                    {/* summary */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Summary</p>
                      <p className="text-sm">{entry.summary}</p>
                    </div>

                    {/* direct quote */}
                    {entry.direct_quote && (
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Star className="h-4 w-4 text-pink-600" />
                          <p className="text-xs font-medium text-pink-700">Direct Quote</p>
                        </div>
                        <p className="text-sm italic">&ldquo;{entry.direct_quote}&rdquo;</p>
                      </div>
                    )}

                    {/* action taken */}
                    {entry.action_taken && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-medium text-green-700 mb-1">Action Taken</p>
                        <p className="text-sm">{entry.action_taken}</p>
                      </div>
                    )}

                    {/* response info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Responded By:</span> <span className="font-medium">{getStaffName(entry.responded_by)}</span></div>
                      <div><span className="text-muted-foreground">Response Date:</span> <span className="font-medium">{entry.response_date ?? "Pending"}</span></div>
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
          <form onSubmit={handleSaveFeedback} className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Date</label><Input type="date" className="mt-1" value={sfForm.date} onChange={(e) => setSF("date", e.target.value)} /></div>
              <div><label className="text-sm font-medium">Source</label>
                <Select value={sfForm.source} onValueChange={(v) => setSF("source", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STAKEHOLDER_FEEDBACK_SOURCE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Source Name</label><Input className="mt-1" placeholder="Name of person or organisation" value={sfForm.source_name} onChange={(e) => setSF("source_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Method</label>
                <Select value={sfForm.method} onValueChange={(v) => setSF("method", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STAKEHOLDER_FEEDBACK_METHOD_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Sentiment</label>
                <Select value={sfForm.sentiment} onValueChange={(v) => setSF("sentiment", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STAKEHOLDER_FEEDBACK_SENTIMENT_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Summary *</label><Textarea className="mt-1" rows={3} placeholder="Summary of feedback…" value={sfForm.summary} onChange={(e) => setSF("summary", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Direct Quote</label><Textarea className="mt-1" rows={2} placeholder="Optional direct quote…" value={sfForm.direct_quote} onChange={(e) => setSF("direct_quote", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Action Taken</label><Textarea className="mt-1" rows={2} placeholder="Response or action…" value={sfForm.action_taken} onChange={(e) => setSF("action_taken", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createRecord.isPending}>{createRecord.isPending ? "Saving…" : "Save Feedback"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Stakeholder Feedback — commissioner feedback, LA feedback, family feedback, professional feedback, inspection feedback, quality improvement themes, Reg 45 evidence, Ofsted evidence"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
