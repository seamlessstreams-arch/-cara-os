"use client";

import { useState } from "react";
import {
  FileText, Edit, CheckCircle2,
  ChevronDown, ChevronUp, Calendar, Users,
  Shield, Heart, GraduationCap, Home,
  AlertTriangle,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── types ───────────────────────────────────────────────────────────── */
interface SoPSection {
  id: string;
  title: string;
  icon: React.ElementType;
  colour: string;
  content: string[];
  lastUpdated: string;
  requiresReview: boolean;
}

/* ── sections ────────────────────────────────────────────────────────── */
const SECTIONS: SoPSection[] = [
  {
    id: "range", title: "Range of Children", icon: Users, colour: "text-blue-600",
    lastUpdated: "2026-01-15", requiresReview: false,
    content: [
      "Oak House provides care for up to 4 children aged 10-17 years, of any gender.",
      "The home specialises in caring for children who have experienced trauma, attachment difficulties, and adverse childhood experiences.",
      "Children placed at Oak House may have experienced previous placement breakdowns and require a therapeutic, stable environment.",
      "The home does not accept young people who present an active risk of sexual harm to others, or whose primary needs are related to disability requiring specialist physical adaptations.",
    ],
  },
  {
    id: "ethos", title: "Ethos & Approach", icon: Heart, colour: "text-pink-600",
    lastUpdated: "2026-01-15", requiresReview: false,
    content: [
      "Oak House operates within a therapeutic care framework, informed by attachment theory and trauma-informed practice.",
      "We believe every child deserves to feel safe, valued, and heard. Our approach centres on building trusting relationships as the foundation for healing and growth.",
      "We use the PACE model (Playfulness, Acceptance, Curiosity, Empathy) as our primary relational approach.",
      "We work restoratively — focusing on repair rather than punishment, and understanding behaviour as communication.",
      "Every child is supported to reach their full potential through individualised care planning, education support, and life skills development.",
    ],
  },
  {
    id: "arrangements", title: "Care Arrangements", icon: Shield, colour: "text-green-600",
    lastUpdated: "2026-01-15", requiresReview: false,
    content: [
      "Each child has an allocated key worker who provides consistent one-to-one support through weekly key working sessions.",
      "Care plans are developed collaboratively with the child, their family, social worker, and relevant professionals.",
      "Daily routines provide structure and predictability while allowing flexibility to meet individual needs.",
      "Children are supported to maintain family contact where safe and appropriate to do so.",
      "Health needs are assessed and monitored, with timely access to medical, dental, and therapeutic services.",
      "Risk assessments are completed and regularly reviewed for each child.",
    ],
  },
  {
    id: "education", title: "Education", icon: GraduationCap, colour: "text-purple-600",
    lastUpdated: "2026-01-15", requiresReview: true,
    content: [
      "Oak House is committed to promoting educational achievement for all children in our care.",
      "Every child has a Personal Education Plan (PEP) that is reviewed termly.",
      "We work in close partnership with schools, colleges, and alternative provision to ensure continuity of education.",
      "Staff support homework, reading, and learning through a positive approach to education within the home.",
      "Where a child is not in education, the home will work urgently to secure appropriate provision.",
      "Children's educational progress is monitored and celebrated.",
    ],
  },
  {
    id: "staffing", title: "Staffing & Qualifications", icon: Users, colour: "text-teal-600",
    lastUpdated: "2026-01-15", requiresReview: false,
    content: [
      "The Registered Manager holds a Level 5 Diploma in Leadership and Management for Residential Childcare and is working towards Level 7.",
      "All residential staff are qualified or working towards the Level 3 Diploma in Residential Childcare.",
      "Staffing levels ensure a minimum of 2 staff on shift during waking hours, with 1 sleep-in or waking night staff.",
      "All staff receive comprehensive induction, regular supervision, and ongoing professional development.",
      "Safer recruitment practices are followed, including enhanced DBS checks, references, and values-based interviewing.",
      "The team includes a Deputy Manager, Senior Support Workers, and Residential Support Workers.",
    ],
  },
  {
    id: "premises", title: "Premises & Location", icon: Home, colour: "text-amber-600",
    lastUpdated: "2026-01-15", requiresReview: false,
    content: [
      "Oak House is a 4-bedroom detached property located in a residential area with good transport links.",
      "Each child has their own bedroom which they are encouraged to personalise.",
      "Communal areas include a lounge, dining room, kitchen, and garden.",
      "The property meets all health and safety requirements and is maintained to a high standard.",
      "A locality risk assessment is maintained and reviewed quarterly.",
      "The home has CCTV covering external areas for security purposes.",
    ],
  },
  {
    id: "complaints", title: "Complaints & Representations", icon: AlertTriangle, colour: "text-orange-600",
    lastUpdated: "2026-01-15", requiresReview: false,
    content: [
      "The home has a clear complaints procedure that is accessible to children, families, and professionals.",
      "Children are supported to make complaints and are provided with information about independent advocacy.",
      "All complaints are recorded, investigated, and responded to in a timely manner.",
      "Children are informed of their right to contact Ofsted directly.",
      "The Registered Manager monitors complaint themes and uses them to drive service improvement.",
    ],
  },
  {
    id: "fire", title: "Fire Safety & Emergency", icon: Shield, colour: "text-red-600",
    lastUpdated: "2026-01-15", requiresReview: false,
    content: [
      "A fire risk assessment is maintained and reviewed annually by a competent person.",
      "Fire drills are conducted monthly and recorded.",
      "All fire safety equipment is serviced regularly.",
      "Emergency evacuation procedures are displayed throughout the home.",
      "Emergency grab bags are maintained for each child containing essential documents and supplies.",
      "Business continuity plans are in place for major disruption events.",
    ],
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function StatementOfPurposePage() {
  const [expanded, setExpanded] = useState<string | null>("range");

  const lastFullReview = "2026-01-15";
  const nextReviewDue = "2026-07-15";
  const version = "3.2";
  const reviewsDue = SECTIONS.filter((s) => s.requiresReview).length;

  return (
    <PageShell
      title="Statement of Purpose"
      subtitle="Regulation 16 — The home's aims, objectives, and operational details"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Statement of Purpose — Oak House" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── header info ───────────────────────────────────────── */}
        <div className="rounded-xl border bg-white p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Home Name</p>
              <p className="font-bold text-lg">Oak House</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Registered Manager</p>
              <p className="font-medium">Darren Laville</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Ofsted URN</p>
              <p className="font-medium">SC XXXXXX</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Max Children</p>
              <p className="font-medium">4</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Version:</span>
              <span className="text-xs font-medium">{version}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Last Review:</span>
              <span className="text-xs font-medium">{lastFullReview}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Next Review:</span>
              <span className="text-xs font-medium">{nextReviewDue}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className={cn("h-3 w-3", reviewsDue > 0 ? "text-orange-600" : "text-green-600")} />
              <span className="text-xs">{reviewsDue > 0 ? `${reviewsDue} section(s) need review` : "All sections current"}</span>
            </div>
          </div>
        </div>

        {/* ── alert ─────────────────────────────────────────────── */}
        {reviewsDue > 0 && (
          <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <p className="text-sm text-orange-800">
                <strong>{reviewsDue}</strong> section(s) flagged for review — update to reflect current practice.
              </p>
            </div>
          </div>
        )}

        {/* ── sections ──────────────────────────────────────────── */}
        <div className="space-y-3">
          {SECTIONS.map((section) => {
            const isExpanded = expanded === section.id;
            const Icon = section.icon;

            return (
              <div key={section.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : section.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5", section.colour)} />
                    <div>
                      <p className="font-medium">{section.title}</p>
                      <p className="text-xs text-muted-foreground">Updated: {section.lastUpdated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.requiresReview && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Needs Review</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{section.content.length} points</Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4">
                    <ul className="space-y-3">
                      {section.content.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0", section.colour)} />
                          <p className="text-sm">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulation 16:</strong> The registered person must compile a statement of the aims and
          objectives of the children&apos;s home (the &quot;statement of purpose&quot;). This must be kept under review
          and revised when necessary. A copy must be sent to the Chief Inspector (Ofsted) and be available
          to children, parents, placing authorities, and staff. The Statement of Purpose must be reviewed
          at least annually and whenever a significant change is made to the home&apos;s operations.
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
