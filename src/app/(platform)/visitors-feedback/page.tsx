"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare, Plus, Search, ArrowUpDown, Filter,
  Star, ChevronDown, ChevronUp, Users, ClipboardCheck,
  ThumbsUp, AlertTriangle, Lightbulb, CheckCircle2,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { toast } from "sonner";
import { useVisitorsFeedbackRecords, useCreateVisitorsFeedbackRecord } from "@/hooks/use-visitors-feedback-records";
import type { VisitorsFeedbackRecord, VisitorsFeedbackRole } from "@/types/extended";
import { VISITORS_FEEDBACK_ROLE_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local config ───────────────────────────────────────────────────────── */

const VISITOR_ROLES: VisitorsFeedbackRole[] = ["reg44", "social_worker", "family", "professional", "iro", "other"];

const ROLE_COLOURS: Record<VisitorsFeedbackRole, string> = {
  reg44: "bg-purple-100 text-purple-800",
  social_worker: "bg-blue-100 text-blue-800",
  family: "bg-pink-100 text-pink-800",
  professional: "bg-teal-100 text-teal-800",
  iro: "bg-indigo-100 text-indigo-800",
  other: "bg-slate-100 text-[var(--cs-navy)]",
};

/* ── stars renderer ────────────────────────────────────────────────────── */
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

/* ── component ──────────────────────────────────────────────────────────── */
export default function VisitorsFeedbackPage() {
  const { data: entries = [], isLoading } = useVisitorsFeedbackRecords();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const createFeedback = useCreateVisitorsFeedbackRecord();
  const [vfForm, setVfForm] = useState({ visitor_name: "", visitor_role: "reg44" as VisitorsFeedbackRole, visit_date: new Date().toISOString().slice(0, 10), rating: "3", positives: "", concerns: "", suggestions: "", notes: "" });
  const setVF = (k: string, v: unknown) => setVfForm((p) => ({ ...p, [k]: v }));

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vfForm.visitor_name.trim()) { toast.error("Visitor name is required."); return; }
    await createFeedback.mutateAsync({ visitor_name: vfForm.visitor_name.trim(), visitor_role: vfForm.visitor_role, visit_date: vfForm.visit_date, rating: parseInt(vfForm.rating) || 3, positives: vfForm.positives.split("\n").filter(Boolean), concerns: vfForm.concerns.split("\n").filter(Boolean), suggestions: vfForm.suggestions.split("\n").filter(Boolean), action_taken: null, responded_by: null, child_related: null, notes: vfForm.notes.trim() });
    toast.success("Visitor feedback recorded.");
    setVfForm({ visitor_name: "", visitor_role: "reg44", visit_date: new Date().toISOString().slice(0, 10), rating: "3", positives: "", concerns: "", suggestions: "", notes: "" });
    setShowNew(false);
  };

  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.visitor_name.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q) ||
          (e.child_related && e.child_related.toLowerCase().includes(q)) ||
          e.positives.some((p) => p.toLowerCase().includes(q)) ||
          e.concerns.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (filterRole !== "all") list = list.filter((e) => e.visitor_role === filterRole);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.visit_date.localeCompare(a.visit_date);
        case "role": return a.visitor_role.localeCompare(b.visitor_role);
        case "rating": return b.rating - a.rating;
        default: return 0;
      }
    });
    return list;
  }, [entries, search, filterRole, sortBy]);

  /* ── summary stats ──────────────────────────────────────────────────── */
  const totalFeedback = entries.length;
  const avgRating = entries.length > 0
    ? (entries.reduce((sum, e) => sum + e.rating, 0) / entries.length).toFixed(1)
    : "0.0";
  const positivePercent = entries.length > 0
    ? Math.round((entries.filter((e) => e.rating >= 4).length / entries.length) * 100)
    : 0;
  const concernsRaised = entries.filter((e) => e.concerns.length > 0).length;

  /* ── export columns ─────────────────────────────────────────────────── */
  const exportCols: ExportColumn<VisitorsFeedbackRecord>[] = [
    { header: "ID", accessor: (r: VisitorsFeedbackRecord) => r.id },
    { header: "Visitor Name", accessor: (r: VisitorsFeedbackRecord) => r.visitor_name },
    { header: "Visitor Role", accessor: (r: VisitorsFeedbackRecord) => VISITORS_FEEDBACK_ROLE_LABEL[r.visitor_role] },
    { header: "Visit Date", accessor: (r: VisitorsFeedbackRecord) => r.visit_date },
    { header: "Rating", accessor: (r: VisitorsFeedbackRecord) => `${r.rating}/5` },
    { header: "Positives", accessor: (r: VisitorsFeedbackRecord) => r.positives.join("; ") },
    { header: "Concerns", accessor: (r: VisitorsFeedbackRecord) => r.concerns.join("; ") },
    { header: "Suggestions", accessor: (r: VisitorsFeedbackRecord) => r.suggestions.join("; ") },
    { header: "Action Taken", accessor: (r: VisitorsFeedbackRecord) => r.action_taken ?? "" },
    { header: "Responded By", accessor: (r: VisitorsFeedbackRecord) => r.responded_by ? getStaffName(r.responded_by) : "" },
    { header: "Child Related", accessor: (r: VisitorsFeedbackRecord) => r.child_related ?? "General" },
    { header: "Notes", accessor: (r: VisitorsFeedbackRecord) => r.notes },
  ];

  if (isLoading) {
    return (
      <PageShell title="Visitors' Feedback" subtitle="Feedback from Reg 44 visitors, IROs, social workers, family members, and professionals">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Visitors' Feedback"
      subtitle="Feedback from Reg 44 visitors, IROs, social workers, family members, and professionals"
      ariaContext={{ pageTitle: "Visitors' Feedback", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Visitors' Feedback" />
          <ExportButton data={filtered} columns={exportCols} filename="visitors-feedback" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Feedback
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Feedback", value: totalFeedback, icon: MessageSquare, colour: "text-blue-600" },
            { label: "Average Rating", value: `${avgRating}/5`, icon: Star, colour: "text-amber-500" },
            { label: "Positive Feedback", value: `${positivePercent}%`, icon: ThumbsUp, colour: "text-green-600" },
            {
              label: "Concerns Raised",
              value: concernsRaised,
              icon: AlertTriangle,
              colour: concernsRaised > 0 ? "text-orange-600" : "text-[var(--cs-text-muted)]",
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

        {/* ── filters ────────────────────────────────────────────────── */}
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
                  <SelectItem key={r} value={r}>{VISITORS_FEEDBACK_ROLE_LABEL[r]}</SelectItem>
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

        {/* ── feedback list ──────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No feedback matches your filters.</div>
          )}
          {filtered.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <div key={entry.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Users className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{entry.visitor_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.visit_date} · {VISITORS_FEEDBACK_ROLE_LABEL[entry.visitor_role]}
                        {entry.child_related && ` · Re: ${entry.child_related}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Stars rating={entry.rating} />
                    <Badge className={cn("text-xs", ROLE_COLOURS[entry.visitor_role])}>
                      {VISITORS_FEEDBACK_ROLE_LABEL[entry.visitor_role]}
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
                    {entry.action_taken && (
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <div className="flex items-center gap-1 mb-1">
                          <ClipboardCheck className="h-4 w-4 text-blue-600" />
                          <p className="text-xs font-medium text-blue-700">Action Taken</p>
                        </div>
                        <p className="text-sm">{entry.action_taken}</p>
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
                          {entry.responded_by ? getStaffName(entry.responded_by) : "Pending"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Child Related:</span>{" "}
                        <span className="font-medium">{entry.child_related ?? "General"}</span>
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

        {/* ── regulatory note ────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulatory Guidance:</strong> Regulation 44 of the Children&apos;s Homes (England) Regulations
          2015 requires monthly independent visits to monitor the home&apos;s effectiveness.
          All visitor feedback must be recorded, considered, and where appropriate acted upon.
          Listening to stakeholders and incorporating their feedback into the home&apos;s improvement
          plan demonstrates a commitment to continuous improvement and is a key area of Ofsted inspection.
        </div>
      </div>

      {/* ── placeholder dialog ───────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Visitor Feedback</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveFeedback} className="space-y-3 py-2">
            <div><label className="text-sm font-medium">Visitor Name *</label><Input className="mt-1" placeholder="Full name" value={vfForm.visitor_name} onChange={(e) => setVF("visitor_name", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Role</label>
                <Select value={vfForm.visitor_role} onValueChange={(v) => setVF("visitor_role", v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(VISITORS_FEEDBACK_ROLE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium">Visit Date</label><Input type="date" className="mt-1" value={vfForm.visit_date} onChange={(e) => setVF("visit_date", e.target.value)} /></div>
            </div>
            <div><label className="text-sm font-medium">Rating (1–5)</label><Input type="number" min="1" max="5" className="mt-1" value={vfForm.rating} onChange={(e) => setVF("rating", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Positives</label><Textarea className="mt-1" rows={2} placeholder="One per line…" value={vfForm.positives} onChange={(e) => setVF("positives", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Concerns</label><Textarea className="mt-1" rows={2} placeholder="One per line…" value={vfForm.concerns} onChange={(e) => setVF("concerns", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Suggestions</label><Textarea className="mt-1" rows={2} placeholder="One per line…" value={vfForm.suggestions} onChange={(e) => setVF("suggestions", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Notes</label><Textarea className="mt-1" rows={2} placeholder="Additional notes…" value={vfForm.notes} onChange={(e) => setVF("notes", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createFeedback.isPending}>{createFeedback.isPending ? "Saving…" : "Save Feedback"}</Button>
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
        pageContext="Visitors' Feedback — visitor feedback forms, professional feedback, family/carer feedback, quality improvement evidence, Reg 44 feedback evidence, Reg 45 quality evidence, inspection readiness"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
