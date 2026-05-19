"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Brain,
  GraduationCap,
  TrendingUp,
  Shield,
  Heart,
  Users,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { TherapeuticStaffTraining, TherapeuticChildImpact, TherapeuticCompetencyLevel } from "@/types/extended";
import { useTherapeuticStaffTraining } from "@/hooks/use-therapeutic-staff-training";
import { useTherapeuticChildImpact } from "@/hooks/use-therapeutic-child-impact";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── types ─────────────────────────────────────────────────────────────── */

// StaffTraining interface removed — using TherapeuticStaffTraining from @/types/extended
/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const COMPETENCY_LABELS: Record<TherapeuticCompetencyLevel, string> = {
  foundation: "Foundation", practitioner: "Practitioner", advanced: "Advanced",
};
const COMPETENCY_COLOURS: Record<TherapeuticCompetencyLevel, string> = {
  foundation: "bg-amber-100 text-amber-800",
  practitioner: "bg-blue-100 text-blue-800",
  advanced: "bg-green-100 text-green-800",
};
const COMPETENCY_SCORE: Record<TherapeuticCompetencyLevel, number> = {
  foundation: 1, practitioner: 2, advanced: 3,
};

/* ── seed data: staff training ─────────────────────────────────────────── */


/* ── seed data: child impact ───────────────────────────────────────────── */


/* ── export types ──────────────────────────────────────────────────────── */

interface FlatRow {
  staffName: string;
  staffId: string;
  competencyLevel: string;
  lastTraining: string;
  lastReflectivePractice: string;
  strengths: string;
  developmentNeeds: string;
  notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Staff Member", accessor: (r: FlatRow) => r.staffName },
  { header: "Staff ID", accessor: (r: FlatRow) => r.staffId },
  { header: "Competency Level", accessor: (r: FlatRow) => r.competencyLevel },
  { header: "Last Training", accessor: (r: FlatRow) => r.lastTraining },
  { header: "Last Reflective Practice", accessor: (r: FlatRow) => r.lastReflectivePractice },
  { header: "Areas of Strength", accessor: (r: FlatRow) => r.strengths },
  { header: "Development Needs", accessor: (r: FlatRow) => r.developmentNeeds },
  { header: "Notes", accessor: (r: FlatRow) => r.notes },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function TherapeuticCareModelPage() {
  const { data: staffResult } = useTherapeuticStaffTraining("home_oak");
  const staffData = staffResult?.data ?? [];
  const { data: impactResult } = useTherapeuticChildImpact(undefined, "home_oak");
  const impactData = impactResult?.data ?? [];
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);
  const [expandedImpact, setExpandedImpact] = useState<string | null>(null);

  const toggleStaff = (id: string) => setExpandedStaff((prev) => (prev === id ? null : id));
  const toggleImpact = (id: string) => setExpandedImpact((prev) => (prev === id ? null : id));

  /* ── stats ───────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const advanced = staffData.filter((s) => s.competencyLevel === "advanced").length;
    const avgScore = staffData.reduce((sum, s) => sum + COMPETENCY_SCORE[s.competencyLevel], 0) / staffData.length;
    const totalTrainingHours = staffData.reduce((sum, s) => sum + s.trainingCompleted.length * 6, 0);
    return { advanced, avgScore: avgScore.toFixed(1), totalTrainingHours };
  }, [staffData]);

  /* ── export data ─────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    staffData.map((s) => ({
      staffName: getStaffName(s.staffId),
      staffId: s.staffId,
      competencyLevel: COMPETENCY_LABELS[s.competencyLevel],
      lastTraining: s.trainingCompleted.length > 0
        ? s.trainingCompleted.sort((a, b) => b.date.localeCompare(a.date))[0].date
        : "N/A",
      lastReflectivePractice: s.lastReflectivePractice,
      strengths: s.areasOfStrength.join("; "),
      developmentNeeds: s.developmentNeeds.join("; "),
      notes: s.notes,
    })), [staffData]);

  return (
    <PageShell
      title="Therapeutic Care Model"
      subtitle="The Trauma-Informed, Attachment-Aware, Relational (TIAR) model underpinning practice at Oak House"
      ariaContext={{ pageTitle: "Therapeutic Care Model", sourceType: "care_plan" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Therapeutic Care Model" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="therapeutic-care-model" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── stat strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Staff at Advanced Level", value: stats.advanced, icon: GraduationCap, colour: "text-green-600" },
          { label: "Avg Competency Score", value: `${stats.avgScore}/3.0`, icon: TrendingUp, colour: "text-blue-600" },
          { label: "Training Hours (Team Total This Year)", value: stats.totalTrainingHours, icon: BookOpen, colour: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════ SECTION 1: MODEL OVERVIEW ═══════════ */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Model Overview — TIAR (Trauma-Informed, Attachment-Aware, Relational)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Core Principles */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Core Principles</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { principle: "Safety", description: "Creating physical and emotional safety through predictable environments, consistent adults, and attuned responses to distress. Young people must feel safe before they can begin to heal.", colour: "bg-green-50 border-green-200" },
                { principle: "Trustworthiness", description: "Adults are transparent, honest, and follow through on promises. Boundaries are clear and maintained. Staff do what they say they will do — reliability builds trust for children who have experienced broken promises.", colour: "bg-blue-50 border-blue-200" },
                { principle: "Choice", description: "Offering meaningful choices wherever possible to restore agency. Children who have experienced powerlessness need opportunities to exercise control in safe ways. Choice reduces shame and promotes engagement.", colour: "bg-amber-50 border-amber-200" },
                { principle: "Collaboration", description: "Working with young people, not doing to them. Decisions are made together where appropriate. Care planning is participatory. The young person's voice shapes their care and their daily life.", colour: "bg-purple-50 border-purple-200" },
                { principle: "Empowerment", description: "Building on strengths rather than focusing solely on deficits. Helping young people develop skills, confidence, and self-efficacy. Celebrating progress and reinforcing competence.", colour: "bg-pink-50 border-pink-200" },
              ].map((p) => (
                <div key={p.principle} className={cn("rounded-lg border p-3", p.colour)}>
                  <h4 className="font-semibold text-sm mb-1">{p.principle}</h4>
                  <p className="text-xs text-gray-700">{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Theoretical Underpinning */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Theoretical Underpinning</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { theory: "Attachment Theory (Bowlby)", summary: "Children develop internal working models of relationships based on early experiences. Secure attachment requires consistent, responsive caregiving. The care environment must provide a secure base." },
                { theory: "Trauma Recovery (Herman)", summary: "Recovery from trauma follows three stages: safety and stabilisation, remembrance and mourning, reconnection. You cannot rush stages — safety must be established first." },
                { theory: "ACEs Framework", summary: "Adverse Childhood Experiences have cumulative impact on development, health, and behaviour. Understanding ACEs helps us respond to behaviour with compassion rather than punishment." },
                { theory: "PACE (Hughes)", summary: "Playfulness, Acceptance, Curiosity, Empathy — a communication framework that conveys unconditional acceptance. Helps children feel understood rather than judged." },
                { theory: "Dyadic Developmental Psychotherapy", summary: "Therapeutic relationship repair through attuned, intersubjective experiences. The relationship IS the intervention — not something separate from daily care." },
              ].map((t) => (
                <div key={t.theory} className="rounded-md border bg-gray-50 p-3">
                  <h4 className="font-semibold text-xs text-gray-800 mb-1">{t.theory}</h4>
                  <p className="text-xs text-gray-600">{t.summary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Applied Through */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Applied Through</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { approach: "TCI (Therapeutic Crisis Intervention)", application: "Crisis prevention and de-escalation. Understanding behaviour as communication. Emotional first aid. Post-crisis learning (Life Space Interview).", icon: Shield },
                { approach: "PACE for Communication", application: "Playfulness to reduce shame. Acceptance of the child (not the behaviour). Curiosity about what lies beneath. Empathy for the child's inner world.", icon: Heart },
                { approach: "Restorative Justice for Conflict", application: "Repairing harm rather than punishing. Understanding impact. Taking responsibility. Making things right. Rebuilding relationships after conflict.", icon: Users },
                { approach: "Sensory Approaches for Regulation", application: "Identifying sensory needs and triggers. Providing sensory tools and accommodations. Co-regulation before self-regulation. Body-based approaches to calm.", icon: Lightbulb },
              ].map((a) => (
                <div key={a.approach} className="rounded-md border bg-white p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <a.icon className="h-4 w-4 text-purple-600" />
                    <h4 className="font-semibold text-xs text-gray-800">{a.approach}</h4>
                  </div>
                  <p className="text-xs text-gray-600">{a.application}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ SECTION 2: STAFF TRAINING ═══════════ */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-blue-600" />
          Staff Training in the Model
        </h2>
        <div className="space-y-3">
          {staffData.map((s) => {
            const open = expandedStaff === s.id;
            return (
              <div key={s.id} className="rounded-lg border bg-white">
                <button onClick={() => toggleStaff(s.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{getStaffName(s.staffId)}</span>
                      <Badge className={cn("text-xs", COMPETENCY_COLOURS[s.competencyLevel])}>
                        {COMPETENCY_LABELS[s.competencyLevel]}
                      </Badge>
                      {s.competencyLevel === "advanced" && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">Trains Others</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {s.trainingCompleted.length} courses completed · Last reflective practice: {s.lastReflectivePractice}
                    </p>
                  </div>
                  {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </button>

                {open && (
                  <div className="border-t px-4 pb-4 space-y-4">
                    {/* Training Completed */}
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">Training Completed</h4>
                      <div className="space-y-1">
                        {s.trainingCompleted.map((t, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span>{t.course}</span>
                            <span className="text-xs text-gray-500">{t.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Competency & Reflective Practice */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Competency Level:</span>{" "}
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", COMPETENCY_COLOURS[s.competencyLevel])}>
                          {COMPETENCY_LABELS[s.competencyLevel]}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Reflective Practice:</span>{" "}
                        <span className="font-medium">{s.lastReflectivePractice}</span>
                      </div>
                    </div>

                    {/* Strengths */}
                    <div className="rounded-md bg-green-50 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Areas of Strength</h4>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                        {s.areasOfStrength.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>

                    {/* Development Needs */}
                    <div className="rounded-md bg-amber-50 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Development Needs</h4>
                      <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                        {s.developmentNeeds.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                    </div>

                    {/* Notes */}
                    {s.notes && (
                      <div className="rounded-md bg-gray-50 p-3">
                        <h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4>
                        <p className="text-sm text-gray-700">{s.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════ SECTION 3: EVIDENCE OF IMPACT ═══════════ */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Evidence of Impact on Children&apos;s Outcomes
        </h2>
        <div className="space-y-3">
          {impactData.map((c) => {
            const open = expandedImpact === c.id;
            return (
              <div key={c.id} className="rounded-lg border bg-white">
                <button onClick={() => toggleImpact(c.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Heart className="h-4 w-4 text-pink-500" />
                      <span className="font-semibold text-sm">{getYPName(c.child_id)}</span>
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {c.keyOutcomes.length} key outcomes
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Review date: {c.reviewDate} · {c.modelApplication.length} model applications evidenced
                    </p>
                  </div>
                  {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </button>

                {open && (
                  <div className="border-t px-4 pb-4 space-y-4">
                    {/* Key Outcomes */}
                    <div className="mt-3 rounded-md bg-green-50 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Key Outcomes</h4>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                        {c.keyOutcomes.map((o, i) => <li key={i}>{o}</li>)}
                      </ul>
                    </div>

                    {/* Evidence of Progress */}
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Evidence of Progress</h4>
                      <p className="text-sm text-blue-800">{c.evidenceOfProgress}</p>
                    </div>

                    {/* Model Application */}
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">How the TIAR Model Is Applied</h4>
                      <ul className="list-disc list-inside text-sm text-purple-800 space-y-0.5">
                        {c.modelApplication.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>

                    {/* Review Date */}
                    <div className="text-sm text-gray-500">
                      Next review: <span className="font-medium text-gray-700">{c.reviewDate}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── regulatory note ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Regulatory Context:</strong> The Children&apos;s Homes (England) Regulations 2015, Quality Standard 6 (Positive Relationships) requires that staff understand and apply the home&apos;s therapeutic model consistently. The SCCIF (Social Care Common Inspection Framework) evaluates whether the model is clearly articulated, understood by all staff, and evidenced in practice and outcomes. Ofsted expects that the therapeutic model is not merely a written document but a living framework — observable in daily interactions, reflected in care planning, and demonstrably improving children&apos;s outcomes. This page evidences the home&apos;s commitment to continuous development in therapeutic practice.
      </div>
      <CareEventsPanel
        title="Care Events — Health & Wellbeing"
        category={["health", "wellbeing"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Therapeutic Care Model — therapeutic approach framework, trauma-informed practice, attachment-based care, PACE model, therapeutic relationships, evidence base, Reg 45 quality evidence"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
