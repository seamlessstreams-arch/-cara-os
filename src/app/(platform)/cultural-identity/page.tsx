"use client";

import { useState } from "react";
import {
  Globe, Search, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Heart, Star,
  BookOpen, Users, Music,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
interface IdentityArea {
  area: string;
  childView: string;
  currentSupport: string;
  status: "well_supported" | "needs_attention" | "exploring";
}

interface CulturalPlan {
  id: string;
  youngPersonId: string;
  ethnicity: string;
  heritage: string;
  religion: string;
  firstLanguage: string;
  otherLanguages: string[];
  dietaryNeeds: string;
  identityAreas: IdentityArea[];
  celebrations: string[];
  resources: string[];
  actionPlan: string;
  lastReviewed: string;
  nextReview: string;
  reviewedBy: string;
  childContributed: boolean;
  notes: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: CulturalPlan[] = [
  {
    id: "ci_1", youngPersonId: "yp_alex",
    ethnicity: "White British", heritage: "Birmingham, West Midlands",
    religion: "No religion (Alex's choice)", firstLanguage: "English",
    otherLanguages: [], dietaryNeeds: "No specific dietary requirements",
    identityAreas: [
      { area: "Cultural heritage", childView: "Alex identifies as being from Birmingham and is proud of this. Enjoys local culture and sports.", currentSupport: "Staff support Alex's connection to local identity through activities, trips, and celebrating local events.", status: "well_supported" },
      { area: "Gender identity", childView: "Alex identifies as male and is comfortable with this.", currentSupport: "Supported through normal daily interactions. Alex hasn't raised any questions about gender identity.", status: "well_supported" },
      { area: "Hobbies & interests as identity", childView: "Alex strongly identifies with cooking and music. These are important parts of who Alex is.", currentSupport: "Cooking sessions with staff. Music equipment in room. Encouraged to explore these interests.", status: "well_supported" },
      { area: "Family identity", childView: "Alex values their relationship with mum. Family history is important to Alex.", currentSupport: "Life story work includes family history. Regular contact with mum maintained. Photo album in room.", status: "well_supported" },
      { area: "Digital identity", childView: "Alex's online identity is important to them. Social media presence is a part of how Alex sees themselves.", currentSupport: "Staff support safe online engagement. Recent challenges with social media being addressed through key work.", status: "needs_attention" },
    ],
    celebrations: ["Alex's birthday", "Christmas (family tradition)", "Bonfire Night"],
    resources: ["Local youth club", "Cooking classes at community centre", "Music lessons available"],
    actionPlan: "Continue supporting Alex's passions for cooking and music. Address social media/digital identity challenges through key work — helping Alex develop a healthy online identity. Maintain family connections through contact and life story work.",
    lastReviewed: d(-30), nextReview: d(60), reviewedBy: "staff_anna",
    childContributed: true,
    notes: "Alex has a strong sense of self. Main focus is supporting healthy digital identity given recent social media issues. Life story work is progressing well and strengthening Alex's connection to family heritage.",
  },
  {
    id: "ci_2", youngPersonId: "yp_jordan",
    ethnicity: "Mixed — White British / Black Caribbean", heritage: "Parents from Birmingham and Jamaica",
    religion: "Christian (Church of England — mother's tradition)", firstLanguage: "English",
    otherLanguages: ["Some Jamaican Patois (from grandparents)"],
    dietaryNeeds: "No specific dietary requirements. Enjoys Caribbean food.",
    identityAreas: [
      { area: "Dual heritage identity", childView: "Jordan is proud of both sides of their heritage. Sometimes feels caught between two cultures. Wants to learn more about Jamaican roots.", currentSupport: "Staff have sourced books and media about Caribbean culture. Cooking Caribbean meals together. Exploring family history.", status: "exploring" },
      { area: "Religion & faith", childView: "Jordan attended church with mum before care. Hasn't asked to attend recently but keeps a Bible in their room.", currentSupport: "Offered to facilitate church attendance if Jordan wishes. Bible respected as personal item. Staff aware of Christian holidays.", status: "well_supported" },
      { area: "Hair & appearance", childView: "Jordan's hair is important to their identity. Wants to learn more about caring for their hair type.", currentSupport: "Staff have researched and purchased appropriate hair care products. Barbershop identified that specialises in afro-textured hair.", status: "well_supported" },
      { area: "Language & culture", childView: "Jordan enjoys when grandmother uses Patois phrases. Wants to learn more.", currentSupport: "Grandmother's language use celebrated and encouraged during contact. Staff learning key phrases.", status: "exploring" },
      { area: "Racial identity", childView: "Jordan has experienced some racial microaggressions at school. Processing what it means to be mixed-race.", currentSupport: "Key work sessions exploring identity. School notified about incidents. Anti-racism resources used in sessions.", status: "needs_attention" },
    ],
    celebrations: ["Jordan's birthday", "Christmas", "Jamaican Independence Day (Aug 6)", "Black History Month"],
    resources: ["Caribbean Cultural Centre (Birmingham)", "Mixed-race identity books", "Hair care specialist", "School diversity programme"],
    actionPlan: "Priority: supporting Jordan with racial identity and any discrimination experienced. Continue exploring dual heritage through food, culture, and family history. Maintain hair care routine. Facilitate church attendance if requested. Support connection with grandmother's cultural traditions.",
    lastReviewed: d(-14), nextReview: d(76), reviewedBy: "staff_anna",
    childContributed: true,
    notes: "Jordan's cultural identity is complex and needs sensitive, ongoing support. The dual heritage aspect is something Jordan is actively exploring and should be led by them. School microaggressions are being addressed but require vigilance. Hair care was a gap that has now been filled — Jordan was very pleased.",
  },
  {
    id: "ci_3", youngPersonId: "yp_casey",
    ethnicity: "White British", heritage: "Coventry, West Midlands",
    religion: "No religion (Casey's choice — mother is Catholic)",
    firstLanguage: "English", otherLanguages: [],
    dietaryNeeds: "Recently expressed preference for vegetarian meals",
    identityAreas: [
      { area: "Creative identity", childView: "Casey strongly identifies as an artist. Art is central to who Casey is. College art course is hugely important.", currentSupport: "Art supplies provided. Portfolio supported. Artwork displayed in home. College placement nurtured.", status: "well_supported" },
      { area: "Dietary identity", childView: "Casey recently expressed wanting to be vegetarian. This is connected to values and identity, not just preference.", currentSupport: "Menu planning updated to include vegetarian options. Casey involved in meal planning. Dietary choice respected and celebrated.", status: "well_supported" },
      { area: "Emotional identity", childView: "Casey is learning that having anxiety doesn't define who they are. Separating self from condition is an ongoing process.", currentSupport: "CAMHS supporting this distinction. Key work explores strengths alongside challenges. Identity not defined by diagnosis.", status: "exploring" },
      { area: "Family identity", childView: "Casey has a strong bond with mum. Family identity is important. Wants to understand more about Catholic heritage even though they're not religious.", currentSupport: "Regular contact with mum. Life story work includes family history. Cultural aspects of Catholicism explored through conversation.", status: "well_supported" },
      { area: "Independence identity", childView: "Casey is becoming more aware of themselves as someone moving towards independence. Wants to be self-sufficient.", currentSupport: "Transition planning underway. Life skills being developed. Casey's growing independence is celebrated and encouraged.", status: "well_supported" },
    ],
    celebrations: ["Casey's birthday", "Christmas (with mum)", "National Art Day"],
    resources: ["City College Art Department", "Local art gallery (exhibitions)", "Vegetarian cooking resources", "CAMHS therapeutic resources"],
    actionPlan: "Continue supporting Casey's artistic identity — this is a major protective factor. Respect and support vegetarian choice. Help Casey develop a positive self-identity that acknowledges but is not defined by anxiety. Support growing independence identity through transition planning.",
    lastReviewed: d(-45), nextReview: d(45), reviewedBy: "staff_chervelle",
    childContributed: true,
    notes: "Casey's identity is primarily shaped by their creativity and growing independence. Supporting the vegetarian choice was important to Casey and they were pleased it was taken seriously. The ongoing work with CAMHS on separating identity from diagnosis is crucial.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function CulturalIdentityPage() {
  const [plans] = useState<CulturalPlan[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const reviewsDue = plans.filter((p) => p.nextReview < today).length;
  const needsAttention = plans.reduce((s, p) => s + p.identityAreas.filter((a) => a.status === "needs_attention").length, 0);

  const STATUS_COLORS: Record<string, string> = {
    well_supported: "bg-green-100 text-green-800",
    needs_attention: "bg-orange-100 text-orange-800",
    exploring: "bg-blue-100 text-blue-800",
  };

  const exportCols: ExportColumn<CulturalPlan>[] = [
    { header: "Young Person", accessor: (r: CulturalPlan) => getYPName(r.youngPersonId) },
    { header: "Ethnicity", accessor: (r: CulturalPlan) => r.ethnicity },
    { header: "Heritage", accessor: (r: CulturalPlan) => r.heritage },
    { header: "Religion", accessor: (r: CulturalPlan) => r.religion },
    { header: "First Language", accessor: (r: CulturalPlan) => r.firstLanguage },
    { header: "Dietary Needs", accessor: (r: CulturalPlan) => r.dietaryNeeds },
    { header: "Identity Areas", accessor: (r: CulturalPlan) => r.identityAreas.map((a: IdentityArea) => `${a.area}: ${a.status}`).join("; ") },
    { header: "Action Plan", accessor: (r: CulturalPlan) => r.actionPlan },
    { header: "Celebrations", accessor: (r: CulturalPlan) => r.celebrations.join(", ") },
    { header: "Last Reviewed", accessor: (r: CulturalPlan) => r.lastReviewed },
    { header: "Next Review", accessor: (r: CulturalPlan) => r.nextReview },
    { header: "Child Contributed", accessor: (r: CulturalPlan) => r.childContributed ? "Yes" : "No" },
    { header: "Notes", accessor: (r: CulturalPlan) => r.notes },
  ];

  return (
    <PageShell
      title="Cultural & Identity Plans"
      subtitle="Supporting each child's cultural heritage, identity, and sense of self"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Cultural & Identity Plans" />
          <ExportButton data={plans} columns={exportCols} filename="cultural-identity" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Plans", value: plans.length, icon: Globe, colour: "text-blue-600" },
            { label: "Needs Attention", value: needsAttention, icon: AlertTriangle, colour: needsAttention > 0 ? "text-orange-600" : "text-green-600" },
            { label: "Reviews Due", value: reviewsDue, icon: Star, colour: reviewsDue > 0 ? "text-orange-600" : "text-slate-400" },
            { label: "Child Contributed", value: plans.filter((p) => p.childContributed).length, icon: Heart, colour: "text-pink-600" },
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

        {/* ── plans ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {plans.map((plan) => {
            const isExpanded = expanded === plan.id;
            const attention = plan.identityAreas.filter((a) => a.status === "needs_attention").length;

            return (
              <div key={plan.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : plan.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Globe className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(plan.youngPersonId)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan.ethnicity} · {plan.religion} · Reviewed: {plan.lastReviewed}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {attention > 0 && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">{attention} attention</Badge>}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* profile */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Heritage:</span> <span className="font-medium">{plan.heritage}</span></div>
                      <div><span className="text-muted-foreground">Language:</span> <span className="font-medium">{plan.firstLanguage}{plan.otherLanguages.length > 0 ? `, ${plan.otherLanguages.join(", ")}` : ""}</span></div>
                      <div><span className="text-muted-foreground">Dietary:</span> <span className="font-medium">{plan.dietaryNeeds}</span></div>
                    </div>

                    {/* identity areas */}
                    <div>
                      <p className="text-sm font-medium mb-2">Identity Areas</p>
                      <div className="space-y-2">
                        {plan.identityAreas.map((area: IdentityArea, idx: number) => (
                          <div key={idx} className={cn("rounded-lg border p-3 text-sm",
                            area.status === "well_supported" ? "bg-green-50 border-green-200" :
                            area.status === "needs_attention" ? "bg-orange-50 border-orange-200" :
                            "bg-blue-50 border-blue-200"
                          )}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{area.area}</span>
                              <Badge className={cn("text-xs ml-auto", STATUS_COLORS[area.status])}>
                                {area.status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <div className="rounded-lg bg-pink-50 border border-pink-200 p-2 mb-2">
                              <p className="text-xs font-medium text-pink-700 mb-0.5">Child&apos;s View</p>
                              <p className="text-xs">{area.childView}</p>
                            </div>
                            <p className="text-xs"><strong>Current Support:</strong> {area.currentSupport}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* celebrations */}
                    <div className="flex flex-wrap gap-1">
                      <span className="text-sm font-medium mr-2">Celebrations:</span>
                      {plan.celebrations.map((c, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                      ))}
                    </div>

                    {/* resources */}
                    <div className="flex flex-wrap gap-1">
                      <span className="text-sm font-medium mr-2">Resources:</span>
                      {plan.resources.map((r, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-blue-50">{r}</Badge>
                      ))}
                    </div>

                    {/* action plan */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Action Plan</p>
                      <p className="text-sm">{plan.actionPlan}</p>
                    </div>

                    {/* notes */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                      <p className="text-sm">{plan.notes}</p>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Reviewed by {getStaffName(plan.reviewedBy)} · Child contributed: {plan.childContributed ? "Yes" : "No"} · Next review: {plan.nextReview}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Identity & Culture:</strong> Regulation 5 requires that each child&apos;s cultural, linguistic,
          and religious identity is understood, respected, and promoted. The home must ensure that children
          can maintain connections to their cultural heritage and that staff are equipped to support diverse
          identities. Identity plans should be developed with the child and reviewed regularly as part of
          care planning.
        </div>
      </div>
    </PageShell>
  );
}
