"use client";

import { useState, useMemo } from "react";
import {
  Award, Plus, Search, ArrowUpDown, Filter,
  Heart, Star, Users, ChevronDown, ChevronUp,
  MessageSquare, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
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
import { useCompliments, useCreateCompliment } from "@/hooks/use-compliments";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { toast } from "sonner";
import type { Compliment, ComplimentSource, ComplimentCategory } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── config ──────────────────────────────────────────────────────────── */
const SOURCES: ComplimentSource[] = [
  "young_person", "parent_carer", "social_worker", "irp",
  "school", "health_professional", "reg44_visitor", "neighbour", "other_professional",
];
const SOURCE_LABELS: Record<ComplimentSource, string> = {
  young_person: "Young Person", parent_carer: "Parent / Carer",
  social_worker: "Social Worker", irp: "IRO",
  school: "School / College", health_professional: "Health Professional",
  reg44_visitor: "Reg 44 Visitor", neighbour: "Neighbour / Community",
  other_professional: "Other Professional",
};

const CATEGORIES: ComplimentCategory[] = [
  "care_quality", "staff_conduct", "environment", "communication",
  "activities", "education_support", "health_support", "family_contact",
  "overall_experience", "specific_staff",
];
const CATEGORY_LABELS: Record<ComplimentCategory, string> = {
  care_quality: "Care Quality", staff_conduct: "Staff Conduct",
  environment: "Environment", communication: "Communication",
  activities: "Activities & Engagement", education_support: "Education Support",
  health_support: "Health Support", family_contact: "Family Contact",
  overall_experience: "Overall Experience", specific_staff: "Specific Staff Member",
};

/* ── component ───────────────────────────────────────────────────────── */
export default function ComplimentsPage() {
  const { data: cmpData, isLoading } = useCompliments();
  const createCompliment = useCreateCompliment();
  const entries = cmpData?.data ?? [];
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.compliment.toLowerCase().includes(q) ||
          e.source_name.toLowerCase().includes(q)
      );
    }
    if (filterSource !== "all") list = list.filter((e) => e.source === filterSource);
    if (filterCategory !== "all") list = list.filter((e) => e.category === filterCategory);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "source": return a.source.localeCompare(b.source);
        case "category": return a.category.localeCompare(b.category);
        default: return 0;
      }
    });
    return list;
  }, [entries, search, filterSource, filterCategory, sortBy]);

  const total = entries.length;
  const fromYP = entries.filter((e) => e.source === "young_person").length;
  const addedToReg45 = entries.filter((e) => e.added_to_reg45).length;
  const notShared = entries.filter((e) => !e.shared_with_team).length;

  const exportCols: ExportColumn<Compliment>[] = [
    { header: "ID", accessor: (r: Compliment) => r.id },
    { header: "Date", accessor: (r: Compliment) => r.date },
    { header: "Source Type", accessor: (r: Compliment) => SOURCE_LABELS[r.source] },
    { header: "Source Name", accessor: (r: Compliment) => r.source_name },
    { header: "Category", accessor: (r: Compliment) => CATEGORY_LABELS[r.category] },
    { header: "Related YP", accessor: (r: Compliment) => r.related_yp ? getYPName(r.related_yp) : "" },
    { header: "Related Staff", accessor: (r: Compliment) => r.related_staff ? getStaffName(r.related_staff) : "" },
    { header: "Compliment", accessor: (r: Compliment) => r.compliment },
    { header: "Shared with Team", accessor: (r: Compliment) => r.shared_with_team ? "Yes" : "No" },
    { header: "Added to Reg 45", accessor: (r: Compliment) => r.added_to_reg45 ? "Yes" : "No" },
    { header: "Recorded By", accessor: (r: Compliment) => getStaffName(r.recorded_by) },
  ];

  return (
    <PageShell
      title="Compliments Log"
      subtitle="Positive feedback, praise, and recognition from all stakeholders"
      ariaContext={{ pageTitle: "Compliments Log", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Compliments Log" />
          <ExportButton data={filtered} columns={exportCols} filename="compliments" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Compliment
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Compliments", value: total, icon: Award, colour: "text-amber-600" },
            { label: "From Young People", value: fromYP, icon: Heart, colour: "text-pink-600" },
            { label: "In Reg 45 Evidence", value: addedToReg45, icon: Star, colour: "text-green-600" },
            { label: "Not Yet Shared", value: notShared, icon: Users, colour: notShared > 0 ? "text-blue-600" : "text-slate-400" },
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

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search compliments, names…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="source">Source</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No compliments match your filters.</div>
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
                      <Star className="h-5 w-5 text-amber-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{entry.source_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.date} · {SOURCE_LABELS[entry.source]} · {CATEGORY_LABELS[entry.category]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.added_to_reg45 && <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Reg 45</Badge>}
                    <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[entry.category]}</Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                      <div className="flex items-center gap-1 mb-2">
                        <Award className="h-4 w-4 text-amber-600" />
                        <p className="text-xs font-medium text-amber-700">Compliment</p>
                      </div>
                      <p className="text-sm">{entry.compliment}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {entry.related_yp && (
                        <div><span className="text-muted-foreground">Related YP:</span> <span className="font-medium">{getYPName(entry.related_yp)}</span></div>
                      )}
                      {entry.related_staff && (
                        <div><span className="text-muted-foreground">Named Staff:</span> <span className="font-medium">{getStaffName(entry.related_staff)}</span></div>
                      )}
                      <div><span className="text-muted-foreground">Shared:</span> <span className={cn("font-medium", entry.shared_with_team ? "text-green-600" : "text-orange-600")}>{entry.shared_with_team ? `Yes (${entry.shared_date})` : "Not yet"}</span></div>
                      <div><span className="text-muted-foreground">Recorded By:</span> <span className="font-medium">{getStaffName(entry.recorded_by)}</span></div>
                    </div>
                    {entry.related_yp && <SmartLinkPanel sourceType="compliment" sourceId={entry.id} childId={entry.related_yp} compact />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Positive Practice:</strong> Recording compliments supports Reg 45 quality of care reviews,
          team morale, and evidences the impact of care. Compliments from children are particularly valuable
          as Voice of the Child evidence. Share with the team and include in governance reports.
        </div>
      </div>
      )}

      {/* ── create dialog ──────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Compliment</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            createCompliment.mutate({
              date: fd.get("date") as string || new Date().toISOString().slice(0, 10),
              source: fd.get("source") as ComplimentSource,
              source_name: fd.get("source_name") as string,
              category: fd.get("category") as ComplimentCategory,
              compliment: fd.get("compliment") as string,
              related_yp: (fd.get("related_yp") as string) || null,
              related_staff: null,
              shared_with_team: false,
              shared_date: null,
              added_to_reg45: false,
              recorded_by: "staff_darren",
            } as Partial<Compliment>, {
              onSuccess: () => { toast.success("Compliment recorded"); setShowNew(false); },
              onError: () => toast.error("Failed to save"),
            });
          }} className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <div>
                <Label>Source Name</Label>
                <Input name="source_name" placeholder="e.g. Jordan, Sarah Mitchell" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Source Type</Label>
                <select name="source" required className="w-full rounded-md border px-3 py-2 text-sm">
                  {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <Label>Category</Label>
                <select name="category" required className="w-full rounded-md border px-3 py-2 text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Related Young Person</Label>
              <select name="related_yp" className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">None</option>
                {["yp_alex", "yp_jordan", "yp_casey"].map((id) => <option key={id} value={id}>{getYPName(id)}</option>)}
              </select>
            </div>
            <div>
              <Label>Compliment</Label>
              <Textarea name="compliment" placeholder="What was said or observed…" rows={3} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createCompliment.isPending}>
                {createCompliment.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving…</> : "Save Compliment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Compliments Log — positive feedback received from families, professionals, commissioners or community, staff achievements, Reg 44/45 evidence, inspection readiness"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
