"use client";

import { useState, useMemo } from "react";
import {
  Award, Plus, Search, ArrowUpDown, Filter,
  Heart, Star, Users, ChevronDown, ChevronUp,
  MessageSquare,
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
  "school", "health_professional", "reg44_visitor", "neighbour", "other_professional",
] as const;
type Source = typeof SOURCES[number];
const SOURCE_LABELS: Record<Source, string> = {
  young_person: "Young Person", parent_carer: "Parent / Carer",
  social_worker: "Social Worker", irp: "IRO",
  school: "School / College", health_professional: "Health Professional",
  reg44_visitor: "Reg 44 Visitor", neighbour: "Neighbour / Community",
  other_professional: "Other Professional",
};

const CATEGORIES = [
  "care_quality", "staff_conduct", "environment", "communication",
  "activities", "education_support", "health_support", "family_contact",
  "overall_experience", "specific_staff",
] as const;
type Category = typeof CATEGORIES[number];
const CATEGORY_LABELS: Record<Category, string> = {
  care_quality: "Care Quality", staff_conduct: "Staff Conduct",
  environment: "Environment", communication: "Communication",
  activities: "Activities & Engagement", education_support: "Education Support",
  health_support: "Health Support", family_contact: "Family Contact",
  overall_experience: "Overall Experience", specific_staff: "Specific Staff Member",
};

interface Compliment {
  id: string;
  date: string;
  source: Source;
  sourceName: string;
  category: Category;
  relatedYP: string | null;
  relatedStaff: string | null;
  compliment: string;
  sharedWithTeam: boolean;
  sharedDate: string | null;
  addedToReg45: boolean;
  recordedBy: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: Compliment[] = [
  {
    id: "cmp_1", date: d(-2), source: "young_person", sourceName: "Jordan",
    category: "overall_experience", relatedYP: "yp_jordan", relatedStaff: null,
    compliment: "Jordan told their key worker: 'This is the best home I've ever lived in. I actually feel like I belong here.' This was spontaneous and unprompted during a key working session.",
    sharedWithTeam: true, sharedDate: d(-1), addedToReg45: true, recordedBy: "staff_anna",
  },
  {
    id: "cmp_2", date: d(-5), source: "social_worker", sourceName: "Sarah Mitchell",
    category: "communication", relatedYP: "yp_alex", relatedStaff: null,
    compliment: "Alex's social worker called to say she is 'really impressed with the quality and timeliness of communication from the home'. She specifically mentioned always feeling kept in the loop and appreciated the detailed daily updates during a difficult period.",
    sharedWithTeam: true, sharedDate: d(-4), addedToReg45: true, recordedBy: "staff_darren",
  },
  {
    id: "cmp_3", date: d(-7), source: "reg44_visitor", sourceName: "Independent Visitor",
    category: "environment", relatedYP: null, relatedStaff: null,
    compliment: "Reg 44 visitor noted in their report that the home has a genuinely warm and homely feel. They commented that bedrooms were personalised and the communal areas were clean, bright, and welcoming. Described the atmosphere as 'nurturing and child-focused'.",
    sharedWithTeam: true, sharedDate: d(-6), addedToReg45: true, recordedBy: "staff_darren",
  },
  {
    id: "cmp_4", date: d(-10), source: "parent_carer", sourceName: "Casey's Mother",
    category: "specific_staff", relatedYP: "yp_casey", relatedStaff: "staff_chervelle",
    compliment: "Casey's mother sent a card thanking Chervelle specifically for the care and attention she gives Casey. She wrote: 'I can see how much you care about my child and it makes such a difference knowing they're looked after so well.'",
    sharedWithTeam: true, sharedDate: d(-9), addedToReg45: true, recordedBy: "staff_darren",
  },
  {
    id: "cmp_5", date: d(-12), source: "school", sourceName: "Mrs Taylor (Headteacher)",
    category: "education_support", relatedYP: "yp_alex", relatedStaff: "staff_anna",
    compliment: "School headteacher emailed praising the home's engagement with PEP processes and attendance monitoring. Said the school-home partnership is 'one of the strongest we have with any placement'.",
    sharedWithTeam: true, sharedDate: d(-11), addedToReg45: true, recordedBy: "staff_anna",
  },
  {
    id: "cmp_6", date: d(-3), source: "health_professional", sourceName: "Dr Patel (CAMHS)",
    category: "health_support", relatedYP: "yp_casey", relatedStaff: null,
    compliment: "CAMHS clinician told the team the detailed observations provided by staff between sessions are 'invaluable' for therapeutic planning. Noted the consistency of the care approach supports Casey's therapeutic journey.",
    sharedWithTeam: true, sharedDate: d(-2), addedToReg45: false, recordedBy: "staff_chervelle",
  },
  {
    id: "cmp_7", date: d(-1), source: "young_person", sourceName: "Alex",
    category: "activities", relatedYP: "yp_alex", relatedStaff: "staff_edward",
    compliment: "Alex said the cooking sessions with Edward are their favourite activity. 'He actually teaches me properly and doesn't just do it for me. I made a whole pasta dish on my own!'",
    sharedWithTeam: false, sharedDate: null, addedToReg45: false, recordedBy: "staff_anna",
  },
  {
    id: "cmp_8", date: d(-14), source: "irp", sourceName: "Tom Richards (IRO)",
    category: "care_quality", relatedYP: "yp_jordan", relatedStaff: null,
    compliment: "Jordan's IRO praised the home's settling-in process at the LAC review. Said it was 'exemplary' and that the transition plan was one of the best he had seen. Noted Jordan's rapid progress as evidence of excellent care.",
    sharedWithTeam: true, sharedDate: d(-13), addedToReg45: true, recordedBy: "staff_darren",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function ComplimentsPage() {
  const [entries] = useState<Compliment[]>(SEED);
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
          e.sourceName.toLowerCase().includes(q)
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
  const addedToReg45 = entries.filter((e) => e.addedToReg45).length;
  const notShared = entries.filter((e) => !e.sharedWithTeam).length;

  const exportCols: ExportColumn<Compliment>[] = [
    { header: "ID", accessor: (r: Compliment) => r.id },
    { header: "Date", accessor: (r: Compliment) => r.date },
    { header: "Source Type", accessor: (r: Compliment) => SOURCE_LABELS[r.source] },
    { header: "Source Name", accessor: (r: Compliment) => r.sourceName },
    { header: "Category", accessor: (r: Compliment) => CATEGORY_LABELS[r.category] },
    { header: "Related YP", accessor: (r: Compliment) => r.relatedYP ? getYPName(r.relatedYP) : "" },
    { header: "Related Staff", accessor: (r: Compliment) => r.relatedStaff ? getStaffName(r.relatedStaff) : "" },
    { header: "Compliment", accessor: (r: Compliment) => r.compliment },
    { header: "Shared with Team", accessor: (r: Compliment) => r.sharedWithTeam ? "Yes" : "No" },
    { header: "Added to Reg 45", accessor: (r: Compliment) => r.addedToReg45 ? "Yes" : "No" },
    { header: "Recorded By", accessor: (r: Compliment) => getStaffName(r.recordedBy) },
  ];

  return (
    <PageShell
      title="Compliments Log"
      subtitle="Positive feedback, praise, and recognition from all stakeholders"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Compliments Log" />
          <ExportButton data={filtered} columns={exportCols} filename="compliments" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Compliment
          </Button>
        </div>
      }
    >
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
                      <p className="font-medium truncate">{entry.sourceName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.date} · {SOURCE_LABELS[entry.source]} · {CATEGORY_LABELS[entry.category]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.addedToReg45 && <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Reg 45</Badge>}
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
                      {entry.relatedYP && (
                        <div><span className="text-muted-foreground">Related YP:</span> <span className="font-medium">{getYPName(entry.relatedYP)}</span></div>
                      )}
                      {entry.relatedStaff && (
                        <div><span className="text-muted-foreground">Named Staff:</span> <span className="font-medium">{getStaffName(entry.relatedStaff)}</span></div>
                      )}
                      <div><span className="text-muted-foreground">Shared:</span> <span className={cn("font-medium", entry.sharedWithTeam ? "text-green-600" : "text-orange-600")}>{entry.sharedWithTeam ? `Yes (${entry.sharedDate})` : "Not yet"}</span></div>
                      <div><span className="text-muted-foreground">Recorded By:</span> <span className="font-medium">{getStaffName(entry.recordedBy)}</span></div>
                    </div>
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

      {/* ── placeholder dialog ──────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Compliment</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground text-sm">
            <Award className="h-10 w-10 mx-auto mb-3 text-amber-300" />
            <p>Full form will capture source, category,</p>
            <p>details, and whether to add to Reg 45 evidence.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
