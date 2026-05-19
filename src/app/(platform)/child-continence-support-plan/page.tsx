"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Droplet, Heart, Shield, ChevronUp, ChevronDown, ArrowUpDown, Search, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type { ContinencePlan, ContinencePresentation } from "@/types/extended";
import { CONTINENCE_PRESENTATION_LABEL } from "@/types/extended";
import { useContinencePlans } from "@/hooks/use-continence-plans";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

export default function ChildContinenceSupportPlanPage() {
  const { data: res, isLoading } = useContinencePlans();
  const data = res?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPresentation, setFilterPresentation] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        CONTINENCE_PRESENTATION_LABEL[r.presentation].toLowerCase().includes(q) ||
        r.presentation_duration.toLowerCase().includes(q),
      );
    }
    if (filterPresentation !== "all") rows = rows.filter((r) => r.presentation === filterPresentation);
    rows.sort((a, b) =>
      sortBy === "newest"
        ? b.plan_date.localeCompare(a.plan_date)
        : a.plan_date.localeCompare(b.plan_date),
    );
    return rows;
  }, [data, search, filterPresentation, sortBy]);

  const activePlans = data.filter((r) => r.presentation !== "resolved").length;
  const postTrauma = data.filter((r) => r.presentation === "post_trauma_onset").length;
  const externalEngaged = data.filter((r) => r.external_support_engaged.length > 0).length;
  const today = new Date().toISOString().slice(0, 10);
  const ninetyDaysDate = new Date();
  ninetyDaysDate.setDate(ninetyDaysDate.getDate() + 90);
  const ninetyDays = ninetyDaysDate.toISOString().slice(0, 10);
  const reviewsDue90 = data.filter((r) => r.review_date >= today && r.review_date <= ninetyDays).length;

  const exportCols: ExportColumn<ContinencePlan>[] = [
    { header: "Young Person", accessor: (r: ContinencePlan) => getYPName(r.child_id) },
    { header: "Plan Date", accessor: (r: ContinencePlan) => r.plan_date },
    { header: "Presentation", accessor: (r: ContinencePlan) => CONTINENCE_PRESENTATION_LABEL[r.presentation] },
    { header: "Duration", accessor: (r: ContinencePlan) => r.presentation_duration },
    { header: "Triggers / Links", accessor: (r: ContinencePlan) => r.triggers_links.join("; ") },
    { header: "Products In Use", accessor: (r: ContinencePlan) => r.products_in_use.join("; ") },
    { header: "Bed Protection", accessor: (r: ContinencePlan) => r.bed_protection_in_use.join("; ") },
    { header: "Fluid Plan", accessor: (r: ContinencePlan) => r.fluid_plan.join("; ") },
    { header: "Toileting Routines", accessor: (r: ContinencePlan) => r.toileting_routines.join("; ") },
    { header: "Alarm Therapy", accessor: (r: ContinencePlan) => r.alarm_therapy ?? "—" },
    { header: "Medication", accessor: (r: ContinencePlan) => r.medication ?? "—" },
    { header: "External Support", accessor: (r: ContinencePlan) => r.external_support_engaged.map((e) => `${e.service} (${e.clinician}, ${e.frequency})`).join("; ") },
    { header: "Child Language", accessor: (r: ContinencePlan) => r.child_language_used },
    { header: "Privacy Measures", accessor: (r: ContinencePlan) => r.privacy_measures.join("; ") },
    { header: "Laundry Routine", accessor: (r: ContinencePlan) => r.laundry_routine.join("; ") },
    { header: "Staff DO", accessor: (r: ContinencePlan) => r.staff_do_strategies.join("; ") },
    { header: "Staff DO NOT", accessor: (r: ContinencePlan) => r.staff_do_not_strategies.join("; ") },
    { header: "Progress Notes", accessor: (r: ContinencePlan) => r.progress_notes.join("; ") },
    { header: "Child Voice", accessor: (r: ContinencePlan) => r.child_voice },
    { header: "Staff Observation", accessor: (r: ContinencePlan) => r.staff_observation },
    { header: "Review Date", accessor: (r: ContinencePlan) => r.review_date },
    { header: "Key Worker", accessor: (r: ContinencePlan) => getStaffName(r.key_worker) },
  ];

  if (isLoading) {
    return (
      <PageShell
        title="Child Continence Support Plan"
        subtitle="Per-child, dignity-led continence support · NICE NG111 · NICE CG99 · ERIC framework · UNCRC Art. 12, 16, 24"
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Child Continence Support Plan"
      subtitle="Per-child, dignity-led continence support · NICE NG111 · NICE CG99 · ERIC framework · UNCRC Art. 12, 16, 24"
      ariaContext={{ pageTitle: "Continence Support Plans", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Continence Support Plans" />
          <ExportButton data={data} columns={exportCols} filename="child-continence-support-plan" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Plans", value: activePlans, icon: Droplet, clr: "text-sky-600" },
            { label: "Post-Trauma Onset", value: postTrauma, icon: Heart, clr: "text-teal-600" },
            { label: "External Support Engaged", value: externalEngaged, icon: Star, clr: "text-sky-700" },
            { label: "Reviews Due 90d", value: reviewsDue90, icon: Shield, clr: "text-teal-700" },
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

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search young person or presentation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterPresentation} onValueChange={setFilterPresentation}>
            <SelectTrigger className="w-[230px]"><SelectValue placeholder="Presentation" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Presentations</SelectItem>
              <SelectItem value="nocturnal_enuresis">Nocturnal enuresis</SelectItem>
              <SelectItem value="daytime_wetting">Daytime wetting</SelectItem>
              <SelectItem value="encopresis">Encopresis (soiling)</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
              <SelectItem value="post_trauma_onset">Post-trauma onset</SelectItem>
              <SelectItem value="developmental">Developmental — being patient</SelectItem>
              <SelectItem value="resolving">Resolving</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const borderClr = r.presentation === "resolved"
              ? "border-l-slate-300"
              : r.presentation === "resolving"
                ? "border-l-teal-300"
                : "border-l-sky-400";
            return (
              <Card key={r.id} className={cn("border-l-4", borderClr)}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className="bg-sky-100 text-sky-800">{CONTINENCE_PRESENTATION_LABEL[r.presentation]}</Badge>
                        {r.external_support_engaged.length > 0 && (
                          <Badge variant="outline" className="bg-teal-50 text-teal-700">External support engaged</Badge>
                        )}
                        {r.alarm_therapy && (
                          <Badge variant="outline" className="bg-sky-50 text-sky-700">Alarm trialled</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Plan: {r.plan_date} · Key worker: {getStaffName(r.key_worker)} · Review: {r.review_date}
                      </p>
                      <p className="text-xs text-muted-foreground italic">{r.presentation_duration}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div>
                      <p className="font-medium mb-1">Triggers / Links</p>
                      <ul className="space-y-0.5">
                        {r.triggers_links.map((t, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded p-2 border border-sky-200 bg-sky-50">
                        <p className="text-xs font-semibold text-sky-900 mb-1">Products In Use</p>
                        <ul className="space-y-0.5">
                          {r.products_in_use.map((p, i) => (
                            <li key={i} className="text-xs text-sky-900">• {p}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded p-2 border border-teal-200 bg-teal-50">
                        <p className="text-xs font-semibold text-teal-900 mb-1">Bed Protection</p>
                        <ul className="space-y-0.5">
                          {r.bed_protection_in_use.map((b, i) => (
                            <li key={i} className="text-xs text-teal-900">• {b}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded p-2 border border-sky-200 bg-sky-50/60">
                        <p className="text-xs font-semibold text-sky-900 mb-1">Fluid Plan</p>
                        <ul className="space-y-0.5">
                          {r.fluid_plan.map((f, i) => (
                            <li key={i} className="text-xs text-sky-900">• {f}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded p-2 border border-teal-200 bg-teal-50/60">
                        <p className="text-xs font-semibold text-teal-900 mb-1">Toileting Routines</p>
                        <ul className="space-y-0.5">
                          {r.toileting_routines.map((t, i) => (
                            <li key={i} className="text-xs text-teal-900">• {t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded p-2 border bg-muted/30">
                        <p className="text-xs font-semibold mb-1">Alarm Therapy</p>
                        <p className="text-xs text-muted-foreground">
                          {r.alarm_therapy ?? "Not currently in use"}
                        </p>
                      </div>
                      <div className="rounded p-2 border bg-muted/30">
                        <p className="text-xs font-semibold mb-1">Medication</p>
                        <p className="text-xs text-muted-foreground">
                          {r.medication ?? "None currently prescribed"}
                        </p>
                      </div>
                    </div>

                    {r.external_support_engaged.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">External Support Engaged</p>
                        <div className="space-y-1">
                          {r.external_support_engaged.map((e, i) => (
                            <div key={i} className="border rounded p-2 text-xs">
                              <p className="font-semibold">{e.service}</p>
                              <p className="text-muted-foreground">{e.clinician} · {e.frequency}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded p-2 border border-sky-300 bg-sky-50">
                      <p className="text-xs font-semibold text-sky-900 mb-1">Child&apos;s Own Language</p>
                      <p className="text-xs text-sky-900">{r.child_language_used}</p>
                    </div>

                    <div className="rounded p-3 border-2 border-teal-400 bg-teal-50">
                      <p className="text-xs font-semibold text-teal-900 mb-1 flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5" /> Privacy Measures — strictly upheld
                      </p>
                      <ul className="space-y-1">
                        {r.privacy_measures.map((m, i) => (
                          <li key={i} className="text-xs text-teal-900">• {m}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded p-2 border border-sky-200 bg-sky-50/40">
                      <p className="text-xs font-semibold text-sky-900 mb-1">Laundry Routine</p>
                      <ul className="space-y-0.5">
                        {r.laundry_routine.map((l, i) => (
                          <li key={i} className="text-xs text-sky-900">• {l}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded p-2 border border-teal-300 bg-teal-50">
                        <p className="text-xs font-semibold text-teal-900 mb-1">Staff DO</p>
                        <ul className="space-y-0.5">
                          {r.staff_do_strategies.map((s, i) => (
                            <li key={i} className="text-xs text-teal-900">• {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded p-2 border border-slate-300 bg-slate-50">
                        <p className="text-xs font-semibold text-[var(--cs-navy)] mb-1">Staff DO NOT</p>
                        <ul className="space-y-0.5">
                          {r.staff_do_not_strategies.map((s, i) => (
                            <li key={i} className="text-xs text-[var(--cs-navy)]">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {r.progress_notes.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Progress Notes</p>
                        <ul className="space-y-0.5">
                          {r.progress_notes.map((p, i) => (
                            <li key={i} className="text-xs text-muted-foreground">• {p}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">Child&apos;s Voice</p>
                      <p className="text-xs text-purple-700 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>

                    <div className="bg-sky-50 border border-sky-200 rounded p-2">
                      <p className="font-medium text-xs text-sky-800 mb-1">Staff Observation</p>
                      <p className="text-xs text-sky-700">{r.staff_observation}</p>
                    </div>

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Plan logged by {getStaffName("staff_darren")} · Reviewed with {getStaffName(r.key_worker)} · Next review: {r.review_date}
                    </div>

                    <SmartLinkPanel sourceType="continence-plan" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework — Continence Support</p>
          <p>
            Continence support for children in care must be dignity-led, child-paced and clinically informed. NICE NG111 (Bedwetting in under 19s) sets the standard for nocturnal enuresis: no fluid restriction, no punishment, no reward charts tied to dry nights, and a stepped approach progressing from reassurance and routine through alarm therapy to desmopressin only where appropriate. NICE CG99 (Constipation in children and young people) governs the assessment and management of soiling (encopresis), recognising that the majority of soiling presentations are secondary to underlying constipation and require disimpaction and maintenance regimens rather than behavioural interventions. The ERIC charity (The Children&apos;s Bowel &amp; Bladder Charity) provides the lived-experience framework most widely adopted in residential childcare and is the recommended source of resources, helpline support and family-facing language. Children&apos;s Homes (England) Regulations 2015, Quality Standard 8 (Health and wellbeing) requires the registered person to ensure each child receives healthcare that meets their needs, provided in a way that respects their dignity. UNCRC Article 12 (right to be heard), Article 16 (right to privacy) and Article 24 (right to the highest attainable standard of health) are central — privacy is not a soft consideration but a binding right, and continence presentations carry deep risk of shame that staff must actively guard against. Where presentation is post-trauma in onset, the plan must be held alongside the child&apos;s therapeutic work and never treated as a behavioural issue. Plans must be reviewed at least every 6 months, after every significant change, and at the child&apos;s request.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Health"
        category="health"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Continence Support Plans — bedwetting, enuresis, encopresis, bowel management, bladder training, dignity, night-time routine, referral, occupational therapy, care plan update"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
