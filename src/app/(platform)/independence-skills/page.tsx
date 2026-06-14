"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUpDown,
  Search,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, YOUNG_PEOPLE } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useIndependenceSkillsRecords, useCreateIndependenceSkillsRecord } from "@/hooks/use-independence-skills-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { IndependenceSkillsRecord, IndependenceSkillProficiency, IndependenceSkillCategory } from "@/types/extended";
import { INDEPENDENCE_SKILL_PROFICIENCY_LABEL, INDEPENDENCE_SKILL_CATEGORY_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── constants ─────────────────────────────────────────────────────────── */

const PROF_META: Record<IndependenceSkillProficiency, { label: string; colour: string; order: number }> = {
  not_started: { label: "Not Started", colour: "bg-gray-100 text-gray-700", order: 0 },
  emerging:    { label: "Emerging",    colour: "bg-red-100 text-red-700",   order: 1 },
  developing:  { label: "Developing",  colour: "bg-amber-100 text-amber-700", order: 2 },
  competent:   { label: "Competent",   colour: "bg-blue-100 text-blue-700", order: 3 },
  independent: { label: "Independent", colour: "bg-green-100 text-green-700", order: 4 },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function IndependenceSkillsPage() {
  const { data: res, isLoading } = useIndependenceSkillsRecords();
  const data: IndependenceSkillsRecord[] = res?.data ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [filterProf, setFilterProf] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showDialog, setShowDialog] = useState(false);

  const createRecord = useCreateIndependenceSkillsRecord();
  const [isForm, setIsForm] = useState({ child_id: "", skill_name: "", category: "cooking" as IndependenceSkillCategory, proficiency: "not_started" as IndependenceSkillProficiency, date: new Date().toISOString().slice(0, 10), evidence: "", next_step: "" });
  const setIS = (k: string, v: unknown) => setIsForm((p) => ({ ...p, [k]: v }));

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isForm.child_id) { toast.error("Please select a young person."); return; }
    if (!isForm.skill_name.trim()) { toast.error("Skill name is required."); return; }
    const skill = { id: crypto.randomUUID(), name: isForm.skill_name.trim(), category: isForm.category, proficiency: isForm.proficiency, target_date: "", last_assessed: isForm.date, assessed_by: "staff_darren", evidence: isForm.evidence.trim(), next_step: isForm.next_step.trim() };
    await createRecord.mutateAsync({ child_id: isForm.child_id, review_date: isForm.date, reviewer: "staff_darren", overall_readiness: 50, skills: [skill], strengths: [], areas_for_development: [], child_view: "", pathway_notes: "", created_at: new Date().toISOString() });
    toast.success("Independence skill record added.");
    setIsForm({ child_id: "", skill_name: "", category: "cooking", proficiency: "not_started", date: new Date().toISOString().slice(0, 10), evidence: "", next_step: "" });
    setShowDialog(false);
  };

  /* ── per-child summary stats ─────────────────────────────────────────── */
  const ypSummaries = useMemo(() => data.map((r) => {
    const total = r.skills.length;
    const independent = r.skills.filter((s) => s.proficiency === "independent").length;
    const competent   = r.skills.filter((s) => s.proficiency === "competent").length;
    const notStarted  = r.skills.filter((s) => s.proficiency === "not_started").length;
    return { ...r, total, independent, competent, notStarted };
  }), [data]);

  /* ── overall stats ────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const allSkills = data.flatMap((r) => r.skills);
    return {
      total: allSkills.length,
      independent: allSkills.filter((s) => s.proficiency === "independent").length,
      competent:   allSkills.filter((s) => s.proficiency === "competent").length,
      developing:  allSkills.filter((s) => s.proficiency === "developing").length,
      emerging:    allSkills.filter((s) => s.proficiency === "emerging").length,
      notStarted:  allSkills.filter((s) => s.proficiency === "not_started").length,
    };
  }, [data]);

  /* ── filtered skills across all YP ───────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data.flatMap((r) => r.skills.map((s) => ({ ...s, child_id: r.child_id, review_date: r.review_date })));
    if (filterYP !== "all") list = list.filter((s) => s.child_id === filterYP);
    if (filterProf !== "all") list = list.filter((s) => s.proficiency === filterProf);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.evidence.toLowerCase().includes(q) || INDEPENDENCE_SKILL_CATEGORY_LABEL[s.category].toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "proficiency": return PROF_META[a.proficiency].order - PROF_META[b.proficiency].order;
        case "category":    return INDEPENDENCE_SKILL_CATEGORY_LABEL[a.category].localeCompare(INDEPENDENCE_SKILL_CATEGORY_LABEL[b.category]);
        case "target":      return a.target_date.localeCompare(b.target_date);
        default:            return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [data, filterYP, filterProf, search, sortBy]);

  /* ── export ──────────────────────────────────────────────────────────── */
  const exportData = useMemo(() => data.flatMap((r) => r.skills.map((s) => ({
    youngPerson: getYPName(r.child_id),
    skill: s.name,
    category: INDEPENDENCE_SKILL_CATEGORY_LABEL[s.category],
    proficiency: PROF_META[s.proficiency].label,
    targetDate: s.target_date,
    lastAssessed: s.last_assessed,
    evidence: s.evidence,
    nextStep: s.next_step,
    overallReadiness: r.overall_readiness,
    childView: r.child_view,
    strengths: r.strengths.join("; "),
    areasForDevelopment: r.areas_for_development.join("; "),
    pathwayNotes: r.pathway_notes,
  }))), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",      accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Skill",             accessor: (r: typeof exportData[number]) => r.skill },
    { header: "Category",          accessor: (r: typeof exportData[number]) => r.category },
    { header: "Proficiency",       accessor: (r: typeof exportData[number]) => r.proficiency },
    { header: "Target Date",       accessor: (r: typeof exportData[number]) => r.targetDate },
    { header: "Last Assessed",     accessor: (r: typeof exportData[number]) => r.lastAssessed },
    { header: "Evidence",          accessor: (r: typeof exportData[number]) => r.evidence },
    { header: "Next Step",         accessor: (r: typeof exportData[number]) => r.nextStep },
    { header: "Overall Readiness", accessor: (r: typeof exportData[number]) => String(r.overallReadiness) },
    { header: "Child View",        accessor: (r: typeof exportData[number]) => r.childView },
    { header: "Strengths",         accessor: (r: typeof exportData[number]) => r.strengths },
    { header: "Areas for Dev",     accessor: (r: typeof exportData[number]) => r.areasForDevelopment },
    { header: "Pathway Notes",     accessor: (r: typeof exportData[number]) => r.pathwayNotes },
  ];

  /* ── readiness colour ────────────────────────────────────────────────── */
  const readinessColour = (n: number) =>
    n >= 4 ? "text-green-600" : n >= 3 ? "text-amber-600" : "text-red-600";

  if (isLoading) return <PageShell title="Independence Skills Tracker" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <PageShell
      title="Independence Skills Tracker"
      subtitle="Pathway to Independence — practical life skills assessment and tracking"
      caraContext={{ pageTitle: "Independence Skills Tracker", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="independence-skills" />
          <PrintButton title="Independence Skills Tracker" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Skill
          </button>
          <CaraStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { l: "Total Skills", v: stats.total, icon: Star, c: "text-gray-700" },
            { l: "Independent",  v: stats.independent, icon: CheckCircle2, c: "text-green-600" },
            { l: "Competent",    v: stats.competent, icon: TrendingUp, c: "text-blue-600" },
            { l: "Developing",   v: stats.developing, icon: Clock, c: "text-amber-600" },
            { l: "Emerging",     v: stats.emerging, icon: AlertCircle, c: "text-red-600" },
            { l: "Not Started",  v: stats.notStarted, icon: AlertCircle, c: "text-gray-400" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* ── per-child readiness cards ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ypSummaries.map((r) => (
            <div key={r.id} className="rounded-lg border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                <span className={cn("text-lg font-bold", readinessColour(r.overall_readiness))}>
                  {r.overall_readiness}/5
                </span>
              </div>
              {/* proficiency bar */}
              <div className="flex h-3 rounded-full overflow-hidden border">
                {(["independent","competent","developing","emerging","not_started"] as IndependenceSkillProficiency[]).map((p) => {
                  const count = r.skills.filter((s) => s.proficiency === p).length;
                  if (!count) return null;
                  const pct = (count / r.total) * 100;
                  return <div key={p} className={cn("h-full", PROF_META[p].colour.split(" ")[0])} style={{ width: `${pct}%` }} />;
                })}
              </div>
              <div className="flex flex-wrap gap-1 text-xs">
                {(["independent","competent","developing","emerging","not_started"] as IndependenceSkillProficiency[]).map((p) => {
                  const count = r.skills.filter((s) => s.proficiency === p).length;
                  if (!count) return null;
                  return <span key={p} className={cn("rounded-full px-2 py-0.5", PROF_META[p].colour)}>{count} {PROF_META[p].label}</span>;
                })}
              </div>
              <p className="text-xs text-muted-foreground">{r.total} skills tracked · Reviewed {r.review_date}</p>
            </div>
          ))}
        </div>

        {/* ── filters ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search skills…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Children" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {data.map((r) => <SelectItem key={r.child_id} value={r.child_id}>{getYPName(r.child_id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterProf} onValueChange={setFilterProf}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Proficiency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {Object.entries(PROF_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="name">Skill Name</option>
              <option value="proficiency">Proficiency</option>
              <option value="category">Category</option>
              <option value="target">Target Date</option>
            </select>
          </div>
        </div>

        {/* ── expandable cards per YP ───────────────────────────────────── */}
        {data.filter((r) => filterYP === "all" || r.child_id === filterYP).map((rec) => (
          <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === rec.id ? null : rec.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <h3 className="font-semibold">{getYPName(rec.child_id)}</h3>
                  <p className="text-xs text-muted-foreground">{rec.skills.length} skills · Readiness {rec.overall_readiness}/5 · Reviewed {rec.review_date}</p>
                </div>
              </div>
              {expanded === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === rec.id && (
              <div className="border-t p-4 space-y-4">
                {/* skills table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-3">Skill</th>
                        <th className="pb-2 pr-3">Category</th>
                        <th className="pb-2 pr-3">Proficiency</th>
                        <th className="pb-2 pr-3">Target</th>
                        <th className="pb-2 pr-3">Evidence</th>
                        <th className="pb-2">Next Step</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rec.skills.map((sk) => (
                        <tr key={sk.id} className="border-b last:border-0">
                          <td className="py-2 pr-3 font-medium">{sk.name}</td>
                          <td className="py-2 pr-3">{INDEPENDENCE_SKILL_CATEGORY_LABEL[sk.category]}</td>
                          <td className="py-2 pr-3"><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PROF_META[sk.proficiency].colour)}>{PROF_META[sk.proficiency].label}</span></td>
                          <td className="py-2 pr-3 whitespace-nowrap">{sk.target_date}</td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground max-w-[250px]">{sk.evidence}</td>
                          <td className="py-2 text-xs max-w-[200px]">{sk.next_step}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* strengths / areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-green-50 p-3">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">Strengths</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-900">
                      {rec.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-2">Areas for Development</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-900">
                      {rec.areas_for_development.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                </div>

                {/* child view */}
                <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                  <h4 className="text-sm font-semibold text-pink-800 mb-1">Child&apos;s View</h4>
                  <p className="text-sm text-pink-900 italic">&ldquo;{rec.child_view}&rdquo;</p>
                </div>

                {/* pathway notes */}
                <div className="rounded-lg bg-blue-50 p-3">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Pathway Notes</h4>
                  <p className="text-sm text-blue-900">{rec.pathway_notes}</p>
                </div>

                <SmartLinkPanel sourceType="independence-skills-records" sourceId={rec.id} childId={rec.child_id} compact />
              </div>
            )}
          </div>
        ))}

        {/* ── regulatory note ───────────────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 5 / Reg 12 / Reg 13</strong> — Children&apos;s homes must help children develop skills, confidence, and independence for adult life. The independence skills tracker supports pathway planning and evidences how the home prepares young people for leaving care.
        </div>
      </div>

      {/* ── dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Independence Skill</DialogTitle></DialogHeader>
          <form onSubmit={handleAddSkill} className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm" value={isForm.child_id} onChange={(e) => setIS("child_id", e.target.value)}><option value="">Select Young Person…</option>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <option key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</option>)}</select>
            <input placeholder="Skill name *" className="rounded border px-3 py-2 text-sm" value={isForm.skill_name} onChange={(e) => setIS("skill_name", e.target.value)} />
            <select className="rounded border px-3 py-2 text-sm" value={isForm.category} onChange={(e) => setIS("category", e.target.value)}><option value="">Select Category…</option>{Object.entries(INDEPENDENCE_SKILL_CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm" value={isForm.proficiency} onChange={(e) => setIS("proficiency", e.target.value)}><option value="">Select Proficiency…</option>{Object.entries(PROF_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            <input type="date" className="rounded border px-3 py-2 text-sm" value={isForm.date} onChange={(e) => setIS("date", e.target.value)} />
            <textarea placeholder="Evidence" rows={2} className="rounded border px-3 py-2 text-sm" value={isForm.evidence} onChange={(e) => setIS("evidence", e.target.value)} />
            <input placeholder="Next step" className="rounded border px-3 py-2 text-sm" value={isForm.next_step} onChange={(e) => setIS("next_step", e.target.value)} />
            <DialogFooter>
              <button type="button" onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={createRecord.isPending} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">{createRecord.isPending ? "Saving…" : "Add Skill"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Activities"
        category="activity"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Independence Skills Tracker — life skills, daily living, cooking, finances, self-care, transport, employment skills, aspirations, pathway plan, leaving care, Reg 45 evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
