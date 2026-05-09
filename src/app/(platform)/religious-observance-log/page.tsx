"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  HeartHandshake,
  Calendar,
  BookOpen,
  Utensils,
  Shirt,
  Users,
  HandHeart,
  Leaf,
  PenLine,
  ScrollText,
  Loader2,
} from "lucide-react";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useReligiousObservanceRecords } from "@/hooks/use-religious-observance-records";
import type { ReligiousObservanceRecord } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const beliefBadgeColor = (faith: string) => {
  const f = faith.toLowerCase();
  if (f.includes("none") || f.includes("non-religious") || f.includes("nature"))
    return "bg-emerald-100 text-emerald-800";
  if (f.includes("christian")) return "bg-amber-100 text-amber-800";
  if (f.includes("muslim") || f.includes("islam")) return "bg-teal-100 text-teal-800";
  if (f.includes("jew")) return "bg-blue-100 text-blue-800";
  if (f.includes("hindu")) return "bg-orange-100 text-orange-800";
  if (f.includes("sikh")) return "bg-yellow-100 text-yellow-800";
  if (f.includes("buddh")) return "bg-rose-100 text-rose-800";
  if (f.includes("heritage") || f.includes("cultural"))
    return "bg-purple-100 text-purple-800";
  return "bg-slate-100 text-slate-800";
};

/* ── page ──────────────────────────────────────────────────────────── */

export default function ReligiousObservanceLogPage() {
  const { data: records = [], isLoading } = useReligiousObservanceRecords();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterChild, setFilterChild] = useState("all");
  const [sortBy, setSortBy] = useState("review_due");

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const in30 = useMemo(() => d(30), []);
  const in90 = useMemo(() => d(90), []);

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterChild !== "all") list = list.filter((r) => r.child_id === filterChild);
    list.sort((a, b) => {
      switch (sortBy) {
        case "review_due":
          return a.next_review_date.localeCompare(b.next_review_date);
        case "name":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "faith":
          return a.faith_or_belief.localeCompare(b.faith_or_belief);
        case "recent_review":
          return b.reviewed_date.localeCompare(a.reviewed_date);
        default:
          return 0;
      }
    });
    return list;
  }, [records, filterChild, sortBy]);

  const stats = useMemo(() => {
    const activeSupport = records.filter((r) => r.practices_supported.length > 0).length;
    const beliefs = new Set(records.map((r) => r.faith_or_belief.split(" (")[0].split(" — ")[0].trim())).size;
    const upcomingFestivals = records.reduce((acc, r) => {
      return (
        acc + r.festivals_observed.filter((f) => f.date >= today && f.date <= in90).length
      );
    }, 0);
    const reviewsDue30 = records.filter((r) => r.next_review_date <= in30).length;
    return { activeSupport, beliefs, upcomingFestivals, reviewsDue30 };
  }, [records, today, in30, in90]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const childIds = useMemo(() => [...new Set(records.map((r) => r.child_id))], [records]);

  const exportCols: ExportColumn<ReligiousObservanceRecord>[] = [
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Faith / Belief", accessor: (r) => r.faith_or_belief },
    { header: "Profile Summary", accessor: (r) => r.profile_summary },
    { header: "Regular Practices", accessor: (r) => r.regular_practices.join("; ") },
    { header: "Practices Supported", accessor: (r) => r.practices_supported.map((p) => `${p.practice} (last ${p.date_last}, next ${p.date_next}, by ${getStaffName(p.supported_by)})`).join("; ") },
    { header: "Dietary Needs Linked", accessor: (r) => r.dietary_needs_linked },
    { header: "Dress Code", accessor: (r) => r.dress_code },
    { header: "Festivals Observed", accessor: (r) => r.festivals_observed.map((f) => `${f.festival} (${f.date}) — ${f.plans_for_observance}`).join("; ") },
    { header: "Faith Leaders", accessor: (r) => r.faith_leaders.join("; ") },
    { header: "Place of Worship Preferences", accessor: (r) => r.place_of_worship_preferences },
    { header: "Spiritual Support", accessor: (r) => r.spiritual_support.join("; ") },
    { header: "Child Co-Authored", accessor: (r) => (r.child_authored ? "Yes" : "No") },
    { header: "Reviewed Date", accessor: (r) => r.reviewed_date },
    { header: "Reviewed With", accessor: (r) => getStaffName(r.reviewed_with) },
    { header: "Next Review", accessor: (r) => r.next_review_date },
    { header: "Notes", accessor: (r) => r.notes },
  ];

  if (isLoading) {
    return (
      <PageShell title="Religious & Belief Observance Log" subtitle="Recording and supporting each child's religious, spiritual or belief practices — at their pace, on their terms">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Religious & Belief Observance Log"
      subtitle="Recording and supporting each child's religious, spiritual or belief practices — at their pace, on their terms"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="religious-observance-log" />
          <PrintButton title="Religious & Belief Observance Log" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-emerald-700">{stats.activeSupport}</p><p className="text-xs text-muted-foreground">Children with Active Practice Support</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-purple-700">{stats.beliefs}</p><p className="text-xs text-muted-foreground">Faiths / Beliefs Represented</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><p className="text-2xl font-bold text-blue-700">{stats.upcomingFestivals}</p><p className="text-xs text-muted-foreground">Festivals Planned (next 90d)</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center"><p className={cn("text-2xl font-bold", stats.reviewsDue30 > 0 ? "text-amber-700" : "text-slate-700")}>{stats.reviewsDue30}</p><p className="text-xs text-muted-foreground">Reviews Due (30d)</p></CardContent></Card>
      </div>

      <div className="bg-gradient-to-r from-emerald-50 via-amber-50 to-purple-50 border border-emerald-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <HeartHandshake className="h-5 w-5 text-emerald-700 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-900">Respect for Every Belief — and the Right to None</p>
            <p className="text-xs text-emerald-800 mt-1">
              Oak House supports each child&apos;s religion, spirituality or belief — including the right to no religion at all — without pressure, judgement or assumption. We follow the child&apos;s lead, draw on family and cultural knowledge with consent, and never treat any tradition as more or less valid than another. A child&apos;s spiritual life is theirs to shape; our job is to make space for it.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterChild} onValueChange={setFilterChild}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map((id) => (
              <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="review_due">Review Due Soonest</SelectItem>
              <SelectItem value="recent_review">Most Recently Reviewed</SelectItem>
              <SelectItem value="name">Child Name</SelectItem>
              <SelectItem value="faith">Faith / Belief</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((rec) => {
          const expanded = expandedId === rec.id;
          const reviewSoon = rec.next_review_date <= in30;

          return (
            <Card key={rec.id} className="overflow-hidden">
              <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors py-4" onClick={() => toggle(rec.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-100"><Sparkles className="h-5 w-5 text-purple-600" /></div>
                    <div>
                      <CardTitle className="text-base">{getYPName(rec.child_id)}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge className={cn("text-xs", beliefBadgeColor(rec.faith_or_belief))}>{rec.faith_or_belief}</Badge>
                        {rec.child_authored && <Badge className="bg-blue-100 text-blue-800 text-xs"><PenLine className="h-3 w-3 mr-0.5" /> Child Co-Authored</Badge>}
                        {reviewSoon && <Badge className="bg-amber-100 text-amber-800 text-xs">Review Due {rec.next_review_date}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1"><BookOpen className="h-4 w-4" /> Belief Profile</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{rec.profile_summary}</p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-purple-800 flex items-center gap-1 mb-2"><Leaf className="h-4 w-4" /> Regular Practices</p>
                    <ul className="text-sm text-purple-900 space-y-1 list-disc list-inside">
                      {rec.regular_practices.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>

                  {rec.practices_supported.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1"><HandHeart className="h-4 w-4" /> Practices Supported by the Home</p>
                      <div className="space-y-1.5">
                        {rec.practices_supported.map((p, i) => (
                          <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs bg-muted/30 rounded p-2">
                            <div className="md:col-span-2 font-medium">{p.practice}</div>
                            <div className="text-muted-foreground">Last: {p.date_last} · Next: {p.date_next}</div>
                            <div className="text-muted-foreground">By {getStaffName(p.supported_by)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-1"><Utensils className="h-4 w-4" /> Dietary Needs (Linked)</p>
                      <p className="text-sm text-muted-foreground">{rec.dietary_needs_linked}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-1"><Shirt className="h-4 w-4" /> Dress Code</p>
                      <p className="text-sm text-muted-foreground">{rec.dress_code}</p>
                    </div>
                  </div>

                  {rec.festivals_observed.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1"><Calendar className="h-4 w-4" /> Festivals & Special Days</p>
                      <div className="space-y-2">
                        {rec.festivals_observed.map((f, i) => (
                          <div key={i} className="border rounded-lg p-2.5 bg-amber-50/50 border-amber-200">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-amber-900">{f.festival}</p>
                              <span className="text-xs text-amber-700">{f.date}</span>
                            </div>
                            <p className="text-xs text-amber-800 mb-1">{f.plans_for_observance}</p>
                            <p className="text-xs text-muted-foreground">Attending with: {f.attending_with}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-1"><Users className="h-4 w-4" /> Faith Leaders</p>
                      <ul className="text-sm text-muted-foreground space-y-0.5 list-disc list-inside">
                        {rec.faith_leaders.map((l, i) => <li key={i}>{l}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-1"><ScrollText className="h-4 w-4" /> Place of Worship Preferences</p>
                      <p className="text-sm text-muted-foreground">{rec.place_of_worship_preferences}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-emerald-800 flex items-center gap-1 mb-2"><Sparkles className="h-4 w-4" /> What Helps This Child Spiritually</p>
                    <ul className="text-sm text-emerald-900 space-y-1 list-disc list-inside">
                      {rec.spiritual_support.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  {rec.notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground italic">{rec.notes}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                    <div><p className="text-xs text-muted-foreground">Last Reviewed</p><p className="text-sm font-medium">{rec.reviewed_date}</p></div>
                    <div><p className="text-xs text-muted-foreground">Reviewed With</p><p className="text-sm font-medium">{getStaffName(rec.reviewed_with)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Next Review</p><p className={cn("text-sm font-medium", reviewSoon && "text-amber-700")}>{rec.next_review_date}</p></div>
                    <div><p className="text-xs text-muted-foreground">Co-Authored</p><p className="text-sm font-medium">{rec.child_authored ? "Yes" : "No"}</p></div>
                  </div>

                  <SmartLinkPanel sourceType="religious-observance-record" sourceId={rec.id} childId={rec.child_id} compact />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          UNCRC Article 30 protects every child&apos;s right to enjoy their own culture, profess and practise their own religion, or use their own language. Article 14 protects freedom of thought, conscience and religion — including the right to none. The Equality Act 2010 lists religion or belief (including the absence of belief) as a protected characteristic; Children&apos;s Homes Regulations 2015 Schedule 1 (Quality Standard 1 — Child-Centred Care) and Regulation 6 require care that respects each child&apos;s identity, including religion and culture. The Statement of Purpose, placement plans and dietary needs records must reflect and support this. Children should never feel pressured to adopt or abandon a belief — staff support practice, not promotion.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
