"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Heart, Lock, MessageCircle, BookOpen, Sparkles, ShieldCheck,
  Package, GraduationCap, HandHeart, Users, CheckCircle2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useMenstrualHealthPlans } from "@/hooks/use-menstrual-health-plans";
import type { MenstrualHealthPlan, MenstrualStage, MenstrualComfortLevel } from "@/types/extended";
import { MENSTRUAL_STAGE_LABEL, MENSTRUAL_COMFORT_LEVEL_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STAGE_CLR: Record<MenstrualStage, string> = {
  pre_puberty_awareness: "bg-sky-100 text-sky-800",
  early_signs_noted: "bg-violet-100 text-violet-800",
  started_menstruating: "bg-rose-100 text-rose-800",
  established: "bg-pink-100 text-pink-800",
  na_not_menstruating: "bg-slate-100 text-slate-700",
};

const STAGE_BORDER: Record<MenstrualStage, string> = {
  pre_puberty_awareness: "border-l-sky-300",
  early_signs_noted: "border-l-violet-400",
  started_menstruating: "border-l-rose-400",
  established: "border-l-pink-400",
  na_not_menstruating: "border-l-slate-300",
};

const COMFORT_CLR: Record<MenstrualComfortLevel, string> = {
  comfortable_discussing: "bg-emerald-50 text-emerald-700 border-emerald-200",
  developing_comfort: "bg-amber-50 text-amber-700 border-amber-200",
  reluctant: "bg-orange-50 text-orange-700 border-orange-200",
  private_staff_only: "bg-slate-50 text-slate-700 border-slate-200",
};

const STAGES: MenstrualStage[] = [
  "pre_puberty_awareness",
  "early_signs_noted",
  "started_menstruating",
  "established",
  "na_not_menstruating",
];

export default function MenstrualHealthTrackerPage() {
  const { data: res, isLoading } = useMenstrualHealthPlans();
  const data: MenstrualHealthPlan[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("review-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterStage !== "all" && r.child_initiation_stage !== filterStage) return false;
      if (filterYP !== "all" && r.child_id !== filterYP) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.conversations_with_child.toLowerCase().includes(q) ||
          r.education_delivered.join(" ").toLowerCase().includes(q) ||
          r.accessibility_of_products.toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "review-desc": return b.plan_reviewed_date.localeCompare(a.plan_reviewed_date);
        case "review-asc": return a.plan_reviewed_date.localeCompare(b.plan_reviewed_date);
        case "yp": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "stage": {
          const order: MenstrualStage[] = [
            "established",
            "started_menstruating",
            "early_signs_noted",
            "pre_puberty_awareness",
            "na_not_menstruating",
          ];
          return order.indexOf(a.child_initiation_stage) - order.indexOf(b.child_initiation_stage);
        }
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterStage, filterYP, sortBy]);

  const activePlans = useMemo(
    () => data.filter((r) => r.child_initiation_stage !== "na_not_menstruating").length,
    [data],
  );

  const educationDelivered = useMemo(
    () => data.filter((r) => r.education_delivered.length > 0).length,
    [data],
  );

  const reviewedIn90d = useMemo(() => {
    const cutoff = d(-90);
    return data.filter((r) => r.plan_reviewed_date >= cutoff).length;
  }, [data]);

  const yps = Array.from(new Set(data.map((r) => r.child_id)));

  const exportCols: ExportColumn<MenstrualHealthPlan>[] = [
    { header: "Child", accessor: (r) => getYPName(r.child_id) },
    { header: "Stage", accessor: (r) => MENSTRUAL_STAGE_LABEL[r.child_initiation_stage] },
    { header: "Consent / Age-appropriateness", accessor: (r) => r.child_informed_consent_age },
    { header: "Supporting Staff", accessor: (r) => getStaffName(r.supporting_staff) },
    { header: "Female Staff Only Preferred", accessor: (r) => r.preferred_female_staff_only ? "Yes" : "No" },
    { header: "Products Provided", accessor: (r) => r.products_provided.join("; ") },
    { header: "Child Chose Products", accessor: (r) => r.child_chosen_products ? "Yes" : "No" },
    { header: "Pain Management", accessor: (r) => r.pain_management },
    { header: "Education Delivered", accessor: (r) => r.education_delivered.join("; ") },
    { header: "Accessibility of Products", accessor: (r) => r.accessibility_of_products },
    { header: "Privacy Arrangements", accessor: (r) => r.privacy_arrangements },
    { header: "Family Conversations", accessor: (r) => r.family_conversations },
    { header: "School / Health Support", accessor: (r) => r.school_health_support },
    { header: "Conversations with Child", accessor: (r) => r.conversations_with_child },
    { header: "Child Comfort Level", accessor: (r) => MENSTRUAL_COMFORT_LEVEL_LABEL[r.child_comfort_level] },
    { header: "Plan Reviewed Date", accessor: (r) => r.plan_reviewed_date },
    { header: "Reviewed By", accessor: (r) => getStaffName(r.reviewed_by) },
    { header: "Confidentiality Note", accessor: (r) => r.confidentiality_note },
  ];

  if (isLoading) return <PageShell title="Menstrual Health Tracker" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Menstrual Health Tracker"
      subtitle="Quality Standard 7 (Health & wellbeing) · Period Products (Free Provision) Scotland Act principles applied as best practice · Sensitive record"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Menstrual Health Tracker" />
          <ExportButton data={filtered} columns={exportCols} filename="menstrual-health-tracker" />
        </div>
      }
    >
      <div id="print-area">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Active Plans", value: activePlans, icon: Heart, clr: "text-rose-600" },
            { label: "Education Delivered", value: educationDelivered, icon: GraduationCap, clr: "text-violet-600" },
            { label: "Plans Reviewed (90d)", value: reviewedIn90d, icon: CheckCircle2, clr: "text-emerald-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <HandHeart className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-rose-800 mb-1">A note on how we hold this</p>
            <p className="text-rose-700">
              Menstrual health is a private, personal part of growing up. Our role is quiet, practical and respectful: we make sure the right
              products are openly available, that pain is taken seriously, that conversations happen at the child&apos;s pace, and that no child ever
              has to ask twice for what they need. We follow the child&apos;s lead on language, on who supports them, on privacy, and on whether to
              involve family. Every child who menstruates &mdash; regardless of gender &mdash; receives care that is dignified, sensory-aware and
              shame-free. This record holds the support plan, never the cycle itself.
            </p>
          </div>
        </div>

        <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 mb-6 flex items-start gap-3">
          <Lock className="h-5 w-5 text-slate-700 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-800">
            <p className="font-semibold mb-0.5">Confidentiality</p>
            <p className="text-slate-700">
              Access to these records is limited to staff with an explicit, child-agreed need to know. Records are not visible in routine handover
              documents. Each child decides who within the staff team can read their plan. This is reviewed at every plan review.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search child, education, accessibility…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {yps.map((y) => (<SelectItem key={y} value={y}>{getYPName(y)}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-[210px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {STAGES.map((s) => (<SelectItem key={s} value={s}>{MENSTRUAL_STAGE_LABEL[s]}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="review-desc">Recently Reviewed</SelectItem>
              <SelectItem value="review-asc">Oldest Review</SelectItem>
              <SelectItem value="stage">By Stage</SelectItem>
              <SelectItem value="yp">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            const isActive = r.child_initiation_stage !== "na_not_menstruating";
            return (
              <Card
                key={r.id}
                className={cn("border-l-4", STAGE_BORDER[r.child_initiation_stage])}
              >
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className={STAGE_CLR[r.child_initiation_stage]}>
                          {MENSTRUAL_STAGE_LABEL[r.child_initiation_stage]}
                        </Badge>
                        <Badge variant="outline" className={COMFORT_CLR[r.child_comfort_level]}>
                          <MessageCircle className="h-3 w-3 mr-1" /> {MENSTRUAL_COMFORT_LEVEL_LABEL[r.child_comfort_level]}
                        </Badge>
                        {r.preferred_female_staff_only && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Female staff preferred
                          </Badge>
                        )}
                        {isActive && r.child_chosen_products && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <Sparkles className="h-3 w-3 mr-1" /> Child-chosen products
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Supporting staff: {getStaffName(r.supporting_staff)} · Last reviewed: {r.plan_reviewed_date}
                      </p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="font-semibold text-slate-800 flex items-center gap-1">
                        <Lock className="h-4 w-4" /> Confidentiality note for this record
                      </p>
                      <p className="text-slate-700 mt-1">{r.confidentiality_note}</p>
                    </div>

                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                      <p className="font-semibold text-rose-800 flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" /> Conversations with the child
                      </p>
                      <p className="text-rose-700 mt-1">{r.conversations_with_child}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <ShieldCheck className="h-4 w-4" /> Consent &amp; age-appropriateness
                        </p>
                        <p className="text-muted-foreground">{r.child_informed_consent_age}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Heart className="h-4 w-4" /> Pain management
                        </p>
                        <p className="text-muted-foreground">{r.pain_management}</p>
                      </div>
                    </div>

                    {r.products_provided.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Package className="h-4 w-4" /> Products provided (child-chosen)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {r.products_provided.map((p: string, i: number) => (
                            <Badge key={i} variant="outline" className="bg-pink-50 text-pink-800 border-pink-200">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {r.education_delivered.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <BookOpen className="h-4 w-4" /> Education delivered
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {r.education_delivered.map((e: string, i: number) => (
                            <Badge key={i} variant="outline" className="bg-violet-50 text-violet-800 border-violet-200">
                              {e}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1">Accessibility of products</p>
                        <p className="text-muted-foreground">{r.accessibility_of_products}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Privacy arrangements</p>
                        <p className="text-muted-foreground">{r.privacy_arrangements}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Users className="h-4 w-4" /> Family conversations
                        </p>
                        <p className="text-muted-foreground">{r.family_conversations}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" /> School / health support
                        </p>
                        <p className="text-muted-foreground">{r.school_health_support}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-between items-center pt-2 border-t text-xs text-muted-foreground gap-2">
                      <span>Reviewed by: {getStaffName(r.reviewed_by)}</span>
                      <span>Last review: {r.plan_reviewed_date}</span>
                    </div>

                    <SmartLinkPanel sourceType="menstrual-health-tracker" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>
            Children&apos;s Homes (England) Regulations 2015, Quality Standard 7 (Health &amp; wellbeing) &mdash; children must receive care that
            promotes their physical, emotional and sexual health, with access to appropriate health information and resources at a pace and in a
            way that is right for them. We apply the principles of the Period Products (Free Provision) Scotland Act 2021 as best practice:
            menstrual products are provided free, openly accessible, dignified to access, and offered in a way that respects choice (including
            sensory and identity-affirming options). This record holds the support plan only &mdash; we do not record cycle data. Cross-reference
            with the Personal Passport, Health Action Plan, and Key Work entries. Records are sensitive &mdash; access is limited to those with a
            legitimate, child-agreed need to know &mdash; and retained until the child&apos;s 25th birthday (or 75 years for looked-after children,
            per Reg 37).
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
