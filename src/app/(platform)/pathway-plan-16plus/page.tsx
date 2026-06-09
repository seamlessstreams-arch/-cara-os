"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Calendar, FileText, GraduationCap,
  Heart, Home, Briefcase, Users, Target, ShieldAlert, Wrench, Phone,
  Loader2, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, YOUNG_PEOPLE, STAFF } from "@/lib/seed-data";
import { usePathwayPlans, useCreatePathwayPlan } from "@/hooks/use-pathway-plans";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { PathwayPlan, PathwayPlanStatus, PathwaySkillLevel } from "@/types/extended";
import { PATHWAY_PLAN_STATUS_LABEL, PATHWAY_SKILL_LEVEL_LABEL } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const STATUS_CLR: Record<PathwayPlanStatus, string> = {
  pre_pathway_15plus: "bg-amber-100 text-amber-800",
  active_16_18: "bg-blue-100 text-blue-800",
  active_18plus_formerly_looked_after: "bg-purple-100 text-purple-800",
  closed_at_25: "bg-green-100 text-green-800",
};

const STATUS_BORDER: Record<PathwayPlanStatus, string> = {
  pre_pathway_15plus: "border-amber-400 bg-amber-50",
  active_16_18: "border-blue-400 bg-blue-50",
  active_18plus_formerly_looked_after: "border-purple-400 bg-purple-50",
  closed_at_25: "border-green-400 bg-green-50",
};

const SKILL_CLR: Record<PathwaySkillLevel, string> = {
  established: "bg-green-100 text-green-800",
  developing: "bg-blue-100 text-blue-800",
  emerging: "bg-amber-100 text-amber-800",
  not_yet: "bg-gray-100 text-gray-700",
};

/* ── component ─────────────────────────────────────────────────────────────── */

export default function PathwayPlan16PlusPage() {
  const { data: res, isLoading } = usePathwayPlans();
  const plans: PathwayPlan[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("review");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const createPlan = useCreatePathwayPlan();
  const [ppForm, setPpForm] = useState({ child_id: "", personal_advisor: "", accommodation: "", aspirations: "" });
  const setPP = (k: string, v: unknown) => setPpForm((p) => ({ ...p, [k]: v }));

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ppForm.child_id) { toast.error("Please select a young person."); return; }
    const yp = YOUNG_PEOPLE.find((y) => y.id === ppForm.child_id);
    const today = new Date().toISOString().slice(0, 10);
    const reviewDate = new Date(); reviewDate.setMonth(reviewDate.getMonth() + 6);
    await createPlan.mutateAsync({ child_id: ppForm.child_id, child_initials: yp ? `${yp.first_name[0]}${yp.last_name[0]}` : "??", age: yp?.date_of_birth ? Math.floor((Date.now() - new Date(yp.date_of_birth).getTime()) / 31557600000) : 16, status: "active_16_18" as PathwayPlanStatus, plan_version: "1.0", last_review_date: today, personal_advisor: ppForm.personal_advisor.trim(), social_worker: "", accommodation: ppForm.accommodation.trim(), education_employment_training: "", health_needs: [], financial_support: [], support_network: [], aspirations: ppForm.aspirations.split("\n").filter(Boolean), risks: [], independent_living_skills: {}, next_review_date: reviewDate.toISOString().slice(0, 10), contact_arrangements: "", statutory_16plus_review_schedule: "Every 6 months" });
    toast.success("Pathway plan created.");
    setPpForm({ child_id: "", personal_advisor: "", accommodation: "", aspirations: "" });
    setShowNew(false);
  };

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);
  const today = new Date().toISOString().slice(0, 10);
  const in30 = (() => { const dt = new Date(); dt.setDate(dt.getDate() + 30); return dt.toISOString().slice(0, 10); })();

  const displayName = (r: PathwayPlan) =>
    r.child_id ? getYPName(r.child_id) : r.child_initials;

  const filtered = useMemo(() => {
    let out = [...plans];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(
        r =>
          displayName(r).toLowerCase().includes(s) ||
          r.accommodation.toLowerCase().includes(s) ||
          r.personal_advisor.toLowerCase().includes(s),
      );
    }
    if (statusFilter !== "all") out = out.filter(r => r.status === statusFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return displayName(a).localeCompare(displayName(b));
        case "age":
          return a.age - b.age;
        case "status":
          return a.status.localeCompare(b.status);
        default: {
          // review: soonest next review first; closed/N/A at the end
          const av = a.next_review_date.startsWith("N/A") ? "9999-12-31" : a.next_review_date;
          const bv = b.next_review_date.startsWith("N/A") ? "9999-12-31" : b.next_review_date;
          return av.localeCompare(bv);
        }
      }
    });
    return out;
  }, [plans, search, statusFilter, sortBy]);

  const activePlans = plans.filter(
    r =>
      r.status === "active_16_18" ||
      r.status === "active_18plus_formerly_looked_after" ||
      r.status === "pre_pathway_15plus",
  ).length;
  const cohort16to18 = plans.filter(r => r.status === "active_16_18").length;
  const cohort18plus = plans.filter(r => r.status === "active_18plus_formerly_looked_after").length;
  const reviewsDue30 = plans.filter(
    r =>
      !r.next_review_date.startsWith("N/A") &&
      r.next_review_date >= today &&
      r.next_review_date <= in30,
  ).length;

  const exportCols: ExportColumn<PathwayPlan>[] = useMemo(
    () => [
      { header: "Young Person", accessor: (r: PathwayPlan) => displayName(r) },
      { header: "Age", accessor: (r: PathwayPlan) => String(r.age) },
      { header: "Status", accessor: (r: PathwayPlan) => PATHWAY_PLAN_STATUS_LABEL[r.status] },
      { header: "Plan Version", accessor: (r: PathwayPlan) => r.plan_version },
      { header: "Last Review", accessor: (r: PathwayPlan) => r.last_review_date },
      { header: "Next Review", accessor: (r: PathwayPlan) => r.next_review_date },
      { header: "Personal Advisor", accessor: (r: PathwayPlan) => r.personal_advisor },
      { header: "Social Worker", accessor: (r: PathwayPlan) => r.social_worker },
      { header: "Accommodation", accessor: (r: PathwayPlan) => r.accommodation },
      { header: "EET", accessor: (r: PathwayPlan) => r.education_employment_training },
      { header: "Health Needs", accessor: (r: PathwayPlan) => r.health_needs.join("; ") },
      { header: "Financial Support", accessor: (r: PathwayPlan) => r.financial_support.join("; ") },
      { header: "Support Network", accessor: (r: PathwayPlan) => r.support_network.join("; ") },
      { header: "Aspirations", accessor: (r: PathwayPlan) => r.aspirations.join("; ") },
      { header: "Risks", accessor: (r: PathwayPlan) => r.risks.join("; ") },
      {
        header: "Independent Living Skills",
        accessor: (r: PathwayPlan) =>
          Object.entries(r.independent_living_skills)
            .map(([k, v]) => `${k}: ${PATHWAY_SKILL_LEVEL_LABEL[v]}`)
            .join("; "),
      },
      { header: "Contact Arrangements", accessor: (r: PathwayPlan) => r.contact_arrangements },
      { header: "Statutory Review Schedule", accessor: (r: PathwayPlan) => r.statutory_16plus_review_schedule },
    ],
    [],
  );

  if (isLoading) {
    return (
      <PageShell
        title="Pathway Plan (16+)"
        subtitle="Statutory pathway planning for care leavers — Children (Leaving Care) Act 2000 / Children Act 1989 (S23B-D) / Care Leavers Regs 2010"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Pathway Plan (16+)"
      subtitle="Statutory pathway planning for care leavers — Children (Leaving Care) Act 2000 / Children Act 1989 (S23B-D) / Care Leavers Regs 2010"
      ariaContext={{ pageTitle: "Pathway Plan (16+)", sourceType: "care_plan" }}
      actions={[
        <PrintButton key="p" title="Pathway Plan (16+)" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="pathway-plan-16plus" />,
        <Button key="new" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />New Plan</Button>,
        <AriaStudioQuickActionButton key="a" context={{ record_type: "placement_plan", record_id: "home_oak", home_id: "home_oak" }} />,
      ]}
    >
      <div id="print-area" className="space-y-6">
        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Plans", value: activePlans, icon: FileText, colour: "text-blue-600" },
            { label: "16-18 Cohort", value: cohort16to18, icon: GraduationCap, colour: "text-purple-600" },
            { label: "18+ Cohort", value: cohort18plus, icon: Users, colour: "text-teal-600" },
            { label: "Reviews Due (30d)", value: reviewsDue30, icon: Calendar, colour: "text-amber-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* continuity-of-care note */}
        <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 flex items-start gap-3">
          <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">Continuity-of-care record</p>
            <p className="text-sm text-blue-800 mt-0.5">
              This page tracks former Chamberlain House residents now in pathway services. All currently
              resident young people (Alex, Jordan, Casey) are below 16 and remain on Care Plans
              (not yet Pathway Plans). Records below relate to former residents under continuing
              Staying Close arrangements — anonymised where appropriate.
            </p>
          </div>
        </div>

        {/* filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Initials, accommodation, PA…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-56">
                <Label className="text-xs flex items-center gap-1">
                  <Filter className="h-3 w-3" />Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pre_pathway_15plus">{PATHWAY_PLAN_STATUS_LABEL.pre_pathway_15plus}</SelectItem>
                    <SelectItem value="active_16_18">{PATHWAY_PLAN_STATUS_LABEL.active_16_18}</SelectItem>
                    <SelectItem value="active_18plus_formerly_looked_after">{PATHWAY_PLAN_STATUS_LABEL.active_18plus_formerly_looked_after}</SelectItem>
                    <SelectItem value="closed_at_25">{PATHWAY_PLAN_STATUS_LABEL.closed_at_25}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1">
                  <ArrowUpDown className="h-3 w-3" />Sort
                </Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="review">Next Review</SelectItem>
                    <SelectItem value="age">Age</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* plan cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expandedId === r.id;
            const reviewSoon =
              !r.next_review_date.startsWith("N/A") &&
              r.next_review_date >= today &&
              r.next_review_date <= in30;
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.status])}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{displayName(r)}</CardTitle>
                        <Badge variant="outline" className="text-xs">Age {r.age}</Badge>
                        <Badge className={cn("text-xs", STATUS_CLR[r.status])}>{PATHWAY_PLAN_STATUS_LABEL[r.status]}</Badge>
                        <Badge variant="outline" className="text-xs">{r.plan_version}</Badge>
                        {reviewSoon && (
                          <Badge className="text-xs bg-amber-100 text-amber-800">
                            Review due {r.next_review_date}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Last review: {r.last_review_date}
                        </span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    {/* core meta */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <Users className="h-3 w-3" />Personal Advisor
                        </p>
                        <p>{r.personal_advisor}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <Users className="h-3 w-3" />Social Worker
                        </p>
                        <p>{r.social_worker}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <Home className="h-3 w-3" />Accommodation
                        </p>
                        <p>{r.accommodation}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />Education / Employment / Training
                        </p>
                        <p>{r.education_employment_training}</p>
                      </div>
                    </div>

                    {/* lists grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                        <p className="text-xs font-semibold text-rose-800 mb-1 flex items-center gap-1">
                          <Heart className="h-3 w-3" />Health Needs
                        </p>
                        <ul className="text-sm text-rose-900 list-disc list-inside space-y-0.5">
                          {r.health_needs.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                        <p className="text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" />Financial Support
                        </p>
                        <ul className="text-sm text-emerald-900 list-disc list-inside space-y-0.5">
                          {r.financial_support.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                        <p className="text-xs font-semibold text-indigo-800 mb-1 flex items-center gap-1">
                          <Users className="h-3 w-3" />Support Network
                        </p>
                        <ul className="text-sm text-indigo-900 list-disc list-inside space-y-0.5">
                          {r.support_network.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                        <p className="text-xs font-semibold text-sky-800 mb-1 flex items-center gap-1">
                          <Target className="h-3 w-3" />Aspirations
                        </p>
                        <ul className="text-sm text-sky-900 list-disc list-inside space-y-0.5">
                          {r.aspirations.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* risks */}
                    {r.risks.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" />Risks
                        </p>
                        <ul className="text-sm text-amber-900 list-disc list-inside space-y-0.5">
                          {r.risks.map((rs, i) => <li key={i}>{rs}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* independent living skills */}
                    <div>
                      <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                        <Wrench className="h-3 w-3" />Independent Living Skills
                      </p>
                      <table className="w-full text-sm border">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium">Skill</th>
                            <th className="text-left p-2 font-medium">Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(r.independent_living_skills).map(([skill, level]) => (
                            <tr key={skill} className="border-t">
                              <td className="p-2">{skill}</td>
                              <td className="p-2">
                                <Badge className={cn("text-xs", SKILL_CLR[level])}>{PATHWAY_SKILL_LEVEL_LABEL[level]}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* contact + review schedule */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <Phone className="h-3 w-3" />Contact Arrangements
                        </p>
                        <p className="text-muted-foreground">{r.contact_arrangements}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />Statutory 16+ Review Schedule
                        </p>
                        <p className="text-muted-foreground">{r.statutory_16plus_review_schedule}</p>
                      </div>
                    </div>

                    {/* smart link panel */}
                    {r.child_id && <SmartLinkPanel sourceType="pathway_plan" sourceId={r.id} childId={r.child_id} compact />}

                    {/* footer meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3">
                      <span>Last Review: <strong>{r.last_review_date}</strong></span>
                      <span>
                        Next Review:{" "}
                        <strong className={cn(reviewSoon && "text-amber-700")}>
                          {r.next_review_date}
                        </strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Plan Version: <strong>{r.plan_version}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        Maintained by Chamberlain House continuity record (RM:{" "}
                        <strong>{getStaffName("staff_darren")}</strong>, Senior:{" "}
                        <strong>{getStaffName("staff_ryan")}</strong>)
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-lg border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            No pathway plans match your filters.
          </div>
        )}

        {/* alerts: reviews due */}
        {reviewsDue30 > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                {reviewsDue30} statutory review(s) due within 30 days
              </p>
              <ul className="text-sm text-amber-800 mt-1 list-disc list-inside">
                {plans
                  .filter(
                    r =>
                      !r.next_review_date.startsWith("N/A") &&
                      r.next_review_date >= today &&
                      r.next_review_date <= in30,
                  )
                  .map(r => (
                    <li key={r.id}>
                      {displayName(r)} — due {r.next_review_date} (PA: {r.personal_advisor.split("—")[0].trim()})
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>
            The Pathway Plan is a statutory document required under the Children (Leaving Care)
            Act 2000, the Children Act 1989 (sections 23B-D), and the Care Leavers (England)
            Regulations 2010. A Pathway Plan must be prepared for every &quot;eligible&quot;,
            &quot;relevant&quot; and &quot;former relevant&quot; child, must replace the Care
            Plan from age 16, and must address accommodation, education/employment/training,
            health, financial support, family/support network, and contingency planning. Plans
            must be reviewed at least every six months and at any time of significant change.
            A Personal Advisor must be allocated and must remain in contact until the young
            person is 25. This page acts as the home&apos;s continuity-of-care record and does
            not replace the local authority&apos;s statutory Pathway Plan document held by the
            Leaving Care Team.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Care Planning"
        category={["general", "education", "finance"]}
        days={28}
        defaultCollapsed
      />
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Pathway Plan</DialogTitle></DialogHeader>
          <form onSubmit={handleSavePlan} className="space-y-3 py-2">
            <div><Label>Young Person *</Label><Select value={ppForm.child_id} onValueChange={(v) => setPP("child_id", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select young person…" /></SelectTrigger><SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => (<SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Personal Advisor</Label><Select value={ppForm.personal_advisor} onValueChange={(v) => setPP("personal_advisor", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select staff…" /></SelectTrigger><SelectContent><SelectItem value="">TBC</SelectItem>{STAFF.filter((s) => s.employment_status === "active").map((s) => (<SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Current Accommodation</Label><Input className="mt-1" placeholder="e.g. Chamberlain House" value={ppForm.accommodation} onChange={(e) => setPP("accommodation", e.target.value)} /></div>
            <div><Label>Aspirations (one per line)</Label><Textarea className="mt-1" rows={3} placeholder="Young person's goals and aspirations…" value={ppForm.aspirations} onChange={(e) => setPP("aspirations", e.target.value)} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={createPlan.isPending}>{createPlan.isPending ? "Saving…" : "Create Plan"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
