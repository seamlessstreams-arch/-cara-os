"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD SKIN CONDITIONS
// Per-child skin condition management — eczema, acne, psoriasis, vitiligo,
// scarring and related conditions. Captures treatment plan, emollients and
// topicals, dermatology referral pathway, school PE / swimming considerations,
// body confidence support and sun safety. Aligned with NICE NG198 (atopic
// eczema), British Association of Dermatologists (BAD) acne guidance, MHRA
// isotretinoin pregnancy prevention programme, Children's Homes (England)
// Regulations 2015 Quality Standard 8 (Care Planning) and UNCRC Article 24.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Heart,
  Sun,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Pill,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Condition =
  | "Atopic eczema"
  | "Contact dermatitis"
  | "Acne — mild"
  | "Acne — moderate"
  | "Acne — severe"
  | "Psoriasis"
  | "Vitiligo"
  | "Keratosis pilaris"
  | "Scarring (managing)"
  | "Hidradenitis suppurativa"
  | "Mixed / multiple"
  | "Other";

type Severity = "Settled" | "Mild" | "Moderate" | "Severe" | "Flaring";

type Potency = "Mild" | "Moderate" | "Potent" | "Very potent";

type ReferralStatus = "Awaiting" | "Active" | "Discharged";

interface SkinRecord {
  id: string;
  youngPerson: string;
  planDate: string;
  condition: Condition;
  bodyAreasAffected: string[];
  severityNow: Severity;
  triggers: string[];
  dailyRoutine: string[];
  emollientName?: string;
  emollientFrequency?: string;
  topicalSteroid?: {
    name: string;
    potency: Potency;
    frequency: string;
    bodyArea: string;
  };
  systemicTreatment?: string;
  dermatologyReferral?: {
    service: string;
    status: ReferralStatus;
    consultant: string;
  };
  schoolConsiderations: string[];
  swimmingSafe: boolean;
  bodyConfidenceWork: string[];
  sunSafetyPlan: string[];
  productsAvoided: string[];
  childVoice: string;
  staffObservation: string;
  flagsConcerns: string[];
  reviewDate: string;
  keyWorker: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const today = d(0);
const in90 = d(90);

const SEVERITY_COLOURS: Record<Severity, string> = {
  Settled: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Mild: "bg-sky-100 text-sky-800 border-sky-200",
  Moderate: "bg-amber-100 text-amber-800 border-amber-200",
  Severe: "bg-orange-100 text-orange-800 border-orange-200",
  Flaring: "bg-rose-100 text-rose-800 border-rose-200",
};

const SEVERITY_RING: Record<Severity, string> = {
  Settled: "border-l-4 border-l-emerald-400",
  Mild: "border-l-4 border-l-sky-400",
  Moderate: "border-l-4 border-l-amber-400",
  Severe: "border-l-4 border-l-orange-500",
  Flaring: "border-l-4 border-l-rose-500",
};

const POTENCY_COLOUR: Record<Potency, string> = {
  Mild: "bg-emerald-50 text-emerald-700",
  Moderate: "bg-sky-50 text-sky-700",
  Potent: "bg-amber-50 text-amber-700",
  "Very potent": "bg-rose-50 text-rose-700",
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED: SkinRecord[] = [
  {
    id: "skn_001",
    youngPerson: "yp_casey",
    planDate: d(-21),
    condition: "Atopic eczema",
    bodyAreasAffected: [
      "Back of knees (popliteal fossae)",
      "Inner elbows (antecubital fossae)",
      "Neck and behind ears",
    ],
    severityNow: "Settled",
    triggers: [
      "House dust",
      "Wool fabrics and rough seams",
      "Periods of stress (school assessments, contact visits)",
      "Soap, bubble bath and fragranced shower gels",
      "Sweating during sport — settles with rinse and re-emollient",
    ],
    dailyRoutine: [
      "Morning: shower with warm (not hot) water, no soap on flare areas, pat dry, apply emollient within 3 minutes.",
      "Day: re-apply emollient at lunchtime if skin feels tight, especially in winter.",
      "Evening: bath with emollient bath additive, pat dry, full-body emollient before bed.",
      "Cotton bedding only, washed in non-bio detergent with second rinse cycle.",
      "Nails kept short to reduce scratch damage; cotton mittens available for night-time itch.",
    ],
    emollientName: "Doublebase gel",
    emollientFrequency: "Three times daily and after every bath/shower",
    topicalSteroid: {
      name: "Eumovate (clobetasone butyrate 0.05%)",
      potency: "Moderate",
      frequency: "Once daily, flares only, 7–14 days then step down",
      bodyArea: "Knees, elbows, neck — avoid face",
    },
    dermatologyReferral: undefined,
    schoolConsiderations: [
      "PE: emollient applied 30 minutes before to reduce friction; cotton sports kit preferred.",
      "Swimming: rinse off chlorine immediately after, re-apply emollient liberally — no exclusion needed.",
      "School holds spare tub of Doublebase in medical room (named, dated).",
      "Teachers aware that scratching may increase during exam stress — non-judgemental redirection.",
    ],
    swimmingSafe: true,
    bodyConfidenceWork: [
      "Casey is settled with appearance, prefers short sleeves in summer.",
      "Key worker reinforces neutral language — eczema described as 'sensitive skin that needs care', not as a flaw.",
    ],
    sunSafetyPlan: [
      "SPF 50 mineral (zinc oxide) sunscreen — fragrance-free, applied 20 minutes before going outside.",
      "Re-apply every 2 hours and after swimming or sweating.",
      "Hat and UV-protective t-shirt available for beach days.",
    ],
    productsAvoided: [
      "Fragranced soaps, bubble bath, shampoo on body",
      "Biological laundry detergent",
      "Wool and rough synthetic fabrics next to skin",
      "Lanolin-based creams (history of mild contact reaction)",
    ],
    childVoice:
      "It's mostly fine now. I just don't like when people stare at the bits behind my knees in summer. The cream feels weird but I know it works so I do it without being asked.",
    staffObservation:
      "Casey manages routine well with minimal prompting. Skin has been settled for 8 weeks with only one short flare following a stressful contact visit. Emollient adherence is excellent. Key worker reviews stock weekly to ensure Doublebase is never out at home or school.",
    flagsConcerns: [],
    reviewDate: d(-21 + 180),
    keyWorker: "staff_chervelle",
  },
  {
    id: "skn_002",
    youngPerson: "yp_alex",
    planDate: d(-45),
    condition: "Acne — moderate",
    bodyAreasAffected: [
      "Face — forehead, cheeks, jawline",
      "Upper back (shoulders)",
      "Upper chest",
    ],
    severityNow: "Moderate",
    triggers: [
      "Post-pubertal hormonal changes (started 14m ago)",
      "Sweating during boxing training without prompt shower",
      "Comedogenic hair products (gel previously used — now switched)",
      "Picking at lesions during periods of low mood — increases scarring risk",
    ],
    dailyRoutine: [
      "Morning: gentle non-soap face wash (Cetaphil), pat dry, apply Duac gel to affected areas only.",
      "Evening: face wash, then Differin (adapalene) 0.1% gel — pea-sized amount, whole face, avoiding eyes and lips.",
      "Shower immediately after boxing training; clean towel each time.",
      "Pillowcase changed twice a week.",
      "No picking — fidget tool kept by mirror as redirect; staff offer non-shaming reminders.",
    ],
    emollientName: "Cetraben light cream (non-comedogenic)",
    emollientFrequency: "Once daily after evening cleanse if skin feels dry from treatment",
    topicalSteroid: undefined,
    systemicTreatment:
      "Awaiting dermatology review for possible isotretinoin (Roaccutane) — currently on combined topical regimen (Differin + Duac). MHRA Pregnancy Prevention Programme and mental-health monitoring will apply if commenced.",
    dermatologyReferral: {
      service: "Local NHS Trust — Paediatric Dermatology",
      status: "Active",
      consultant: "Dr Connors (Consultant Dermatologist)",
    },
    schoolConsiderations: [
      "PE: Alex prefers to shower in private cubicle; school informed and accommodation in place.",
      "Swimming: chlorine can dry treated skin — emollient and SPF after lessons.",
      "Teachers briefed (with Alex's consent) not to comment on skin or any potential redness/peeling from treatment.",
      "Alex permitted to carry water bottle (Differin and Duac increase photosensitivity and dryness).",
    ],
    swimmingSafe: true,
    bodyConfidenceWork: [
      "Alex sometimes self-conscious — particularly around upper-back acne when changing for boxing or PE.",
      "Boxing gym: private shower cubicle agreed with coach; Alex does not need to expose back in shared changing area.",
      "Key worker has open, non-shaming conversations — reinforces that acne is medical, not a hygiene failure, and not Alex's fault.",
      "Encouraged identity beyond skin — boxing achievements, music interests celebrated.",
      "Mood monitoring weekly via key-work session — escalate if any low-mood pattern emerges, particularly if isotretinoin is started.",
    ],
    sunSafetyPlan: [
      "SPF 50 oil-free, non-comedogenic sunscreen — Differin and Duac significantly increase photosensitivity.",
      "Hat and shade-seeking advised between 11am and 3pm.",
      "Re-apply sunscreen every 2 hours outdoors and after sweating.",
      "If isotretinoin is started: stricter sun avoidance, lip balm with SPF, and education on photosensitivity reactions.",
    ],
    productsAvoided: [
      "Comedogenic hair gels and pomades",
      "Heavy oil-based moisturisers and body butters",
      "Harsh scrubs and exfoliating brushes (worsen inflammation)",
      "Alcohol-based toners (strip skin barrier and increase irritation)",
    ],
    childVoice:
      "It's getting better but my back is the bit I really hate. I don't want anyone making jokes in the changing room. I want to try the strong tablets if Dr Connors says they'll work — but I've read they can mess with your head so I want to talk it through properly first.",
    staffObservation:
      "Alex engages well with the topical regimen and adherence is consistent. Skin has improved on cheeks and forehead over 6 weeks; back acne slower to respond — hence the dermatology referral. Alex's voice is clear: wants treatment that works but has researched the risks and wants informed consent. Staff to support Dr Connors appointment, ensure mental-health baseline (PHQ-A) is documented before any isotretinoin start, and log MHRA Pregnancy Prevention Programme requirements as applicable.",
    flagsConcerns: [
      "Picking at lesions during low mood — increases scarring risk; redirect strategy in place.",
      "Isotretinoin discussion pending — psychiatric and pregnancy-prevention safeguards must be in place before start.",
    ],
    reviewDate: d(-45 + 90),
    keyWorker: "staff_edward",
  },
];

// ── Page Component ────────────────────────────────────────────────────────────

export default function ChildSkinConditionsPage() {
  const [search, setSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("severity");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const activePlans = SEED.length;
    const dermActive = SEED.filter(
      (r) => r.dermatologyReferral?.status === "Active"
    ).length;
    const severeFlaring = SEED.filter(
      (r) => r.severityNow === "Severe" || r.severityNow === "Flaring"
    ).length;
    const reviewsDue = SEED.filter((r) => r.reviewDate <= in90).length;
    return { activePlans, dermActive, severeFlaring, reviewsDue };
  }, []);

  // ── Filtering & Sorting ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...SEED];

    if (conditionFilter !== "all") {
      list = list.filter((r) => r.condition === conditionFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.youngPerson).toLowerCase().includes(q) ||
          r.condition.toLowerCase().includes(q) ||
          r.bodyAreasAffected.some((a) => a.toLowerCase().includes(q)) ||
          (r.emollientName?.toLowerCase().includes(q) ?? false) ||
          (r.topicalSteroid?.name.toLowerCase().includes(q) ?? false)
      );
    }

    const order: Severity[] = ["Settled", "Mild", "Moderate", "Severe", "Flaring"];
    list.sort((a, b) => {
      switch (sortBy) {
        case "severity":
          return order.indexOf(b.severityNow) - order.indexOf(a.severityNow);
        case "review_due":
          return a.reviewDate.localeCompare(b.reviewDate);
        case "young_person":
          return getYPName(a.youngPerson).localeCompare(
            getYPName(b.youngPerson)
          );
        case "condition":
          return a.condition.localeCompare(b.condition);
        default:
          return 0;
      }
    });

    return list;
  }, [search, conditionFilter, sortBy]);

  // ── Export columns ──────────────────────────────────────────────────────────

  const exportColumns: ExportColumn<SkinRecord>[] = [
    {
      header: "Young Person",
      accessor: (r: SkinRecord) => getYPName(r.youngPerson),
    },
    { header: "Plan Date", accessor: (r: SkinRecord) => r.planDate },
    { header: "Condition", accessor: (r: SkinRecord) => r.condition },
    {
      header: "Body Areas Affected",
      accessor: (r: SkinRecord) => r.bodyAreasAffected.join("; "),
    },
    { header: "Severity Now", accessor: (r: SkinRecord) => r.severityNow },
    {
      header: "Triggers",
      accessor: (r: SkinRecord) => r.triggers.join("; "),
    },
    {
      header: "Daily Routine",
      accessor: (r: SkinRecord) =>
        r.dailyRoutine.map((s, i) => `${i + 1}. ${s}`).join(" | "),
    },
    {
      header: "Emollient",
      accessor: (r: SkinRecord) =>
        r.emollientName
          ? `${r.emollientName} — ${r.emollientFrequency ?? ""}`
          : "",
    },
    {
      header: "Topical Steroid",
      accessor: (r: SkinRecord) =>
        r.topicalSteroid
          ? `${r.topicalSteroid.name} (${r.topicalSteroid.potency}) — ${r.topicalSteroid.frequency} — ${r.topicalSteroid.bodyArea}`
          : "",
    },
    {
      header: "Systemic Treatment",
      accessor: (r: SkinRecord) => r.systemicTreatment ?? "",
    },
    {
      header: "Dermatology Referral",
      accessor: (r: SkinRecord) =>
        r.dermatologyReferral
          ? `${r.dermatologyReferral.service} — ${r.dermatologyReferral.status} — ${r.dermatologyReferral.consultant}`
          : "None",
    },
    {
      header: "School Considerations",
      accessor: (r: SkinRecord) => r.schoolConsiderations.join("; "),
    },
    {
      header: "Swimming Safe",
      accessor: (r: SkinRecord) => (r.swimmingSafe ? "Yes" : "No"),
    },
    {
      header: "Body Confidence Work",
      accessor: (r: SkinRecord) => r.bodyConfidenceWork.join("; "),
    },
    {
      header: "Sun Safety Plan",
      accessor: (r: SkinRecord) => r.sunSafetyPlan.join("; "),
    },
    {
      header: "Products Avoided",
      accessor: (r: SkinRecord) => r.productsAvoided.join("; "),
    },
    { header: "Child Voice", accessor: (r: SkinRecord) => r.childVoice },
    {
      header: "Staff Observation",
      accessor: (r: SkinRecord) => r.staffObservation,
    },
    {
      header: "Flags / Concerns",
      accessor: (r: SkinRecord) => r.flagsConcerns.join("; "),
    },
    { header: "Review Date", accessor: (r: SkinRecord) => r.reviewDate },
    {
      header: "Key Worker",
      accessor: (r: SkinRecord) => getStaffName(r.keyWorker),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Skin Condition Plans"
      subtitle="Per-child dermatology care — emollients, topicals, dermatology referrals, school provision, body confidence and sun safety"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Skin Condition Plans" />
          <ExportButton<SkinRecord>
            data={filtered}
            columns={exportColumns}
            filename="child-skin-conditions"
          />
        </div>
      }
    >
      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Active Plans",
            value: stats.activePlans,
            icon: Sparkles,
            colour: "text-rose-500",
          },
          {
            label: "Dermatology Referrals Active",
            value: stats.dermActive,
            icon: Pill,
            colour: stats.dermActive > 0 ? "text-sky-600" : "text-slate-500",
          },
          {
            label: "Severe / Flaring",
            value: stats.severeFlaring,
            icon: Heart,
            colour:
              stats.severeFlaring > 0 ? "text-rose-600" : "text-slate-500",
          },
          {
            label: "Reviews Due (90d)",
            value: stats.reviewsDue,
            icon: Sun,
            colour: stats.reviewsDue > 0 ? "text-amber-600" : "text-slate-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border bg-card p-3 flex items-center gap-3"
          >
            <s.icon className={cn("h-5 w-5", s.colour)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters & Sort ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search young person, condition, body area, treatment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <Select value={conditionFilter} onValueChange={setConditionFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="Atopic eczema">Atopic eczema</SelectItem>
            <SelectItem value="Contact dermatitis">Contact dermatitis</SelectItem>
            <SelectItem value="Acne — mild">Acne — mild</SelectItem>
            <SelectItem value="Acne — moderate">Acne — moderate</SelectItem>
            <SelectItem value="Acne — severe">Acne — severe</SelectItem>
            <SelectItem value="Psoriasis">Psoriasis</SelectItem>
            <SelectItem value="Vitiligo">Vitiligo</SelectItem>
            <SelectItem value="Keratosis pilaris">Keratosis pilaris</SelectItem>
            <SelectItem value="Scarring (managing)">Scarring (managing)</SelectItem>
            <SelectItem value="Hidradenitis suppurativa">
              Hidradenitis suppurativa
            </SelectItem>
            <SelectItem value="Mixed / multiple">Mixed / multiple</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severity">Severity (highest first)</SelectItem>
              <SelectItem value="review_due">Review Due</SelectItem>
              <SelectItem value="young_person">Young Person (A–Z)</SelectItem>
              <SelectItem value="condition">Condition (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Skin Plan Cards ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No skin plans match your filters.
          </p>
        )}

        {filtered.map((rec) => {
          const expanded = expandedId === rec.id;
          const reviewOverdue = rec.reviewDate < today;

          return (
            <div
              key={rec.id}
              className={cn(
                "rounded-lg border bg-card overflow-hidden",
                SEVERITY_RING[rec.severityNow]
              )}
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedId(expanded ? null : rec.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Sparkles className="h-5 w-5 text-rose-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {getYPName(rec.youngPerson)}
                      </span>

                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100">
                        {rec.condition}
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                          SEVERITY_COLOURS[rec.severityNow]
                        )}
                      >
                        {rec.severityNow}
                      </span>

                      {rec.dermatologyReferral && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            rec.dermatologyReferral.status === "Active"
                              ? "bg-sky-100 text-sky-800"
                              : rec.dermatologyReferral.status === "Awaiting"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                          )}
                        >
                          Derm: {rec.dermatologyReferral.status}
                        </span>
                      )}

                      {rec.swimmingSafe && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
                          Swimming OK
                        </span>
                      )}

                      {reviewOverdue && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700">
                          Review overdue
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {rec.bodyAreasAffected.join(" • ")}
                      {rec.emollientName && ` — ${rec.emollientName}`}
                    </p>
                  </div>
                </div>
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Expanded Content */}
              {expanded && (
                <div className="border-t px-4 py-4 space-y-5">
                  {/* Body areas affected */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Body Areas Affected
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {rec.bodyAreasAffected.map((a, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-rose-50 text-rose-800 border border-rose-100"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Triggers */}
                  {rec.triggers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Triggers</h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.triggers.map((t, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-100"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Daily routine */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Daily Skincare Routine
                    </h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1.5 marker:font-semibold marker:text-foreground">
                      {rec.dailyRoutine.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Treatments grid */}
                  <div className="grid md:grid-cols-2 gap-3">
                    {/* Emollient */}
                    {rec.emollientName && (
                      <div className="rounded-md border bg-sky-50/40 p-3">
                        <h4 className="text-sm font-semibold mb-1 flex items-center gap-1 text-sky-900">
                          <Sparkles className="h-4 w-4" /> Emollient
                        </h4>
                        <p className="text-sm text-sky-900">
                          <strong>{rec.emollientName}</strong>
                        </p>
                        {rec.emollientFrequency && (
                          <p className="text-xs text-sky-800 mt-1">
                            {rec.emollientFrequency}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Topical steroid */}
                    {rec.topicalSteroid && (
                      <div className="rounded-md border bg-rose-50/40 p-3">
                        <h4 className="text-sm font-semibold mb-1 flex items-center gap-1 text-rose-900">
                          <Pill className="h-4 w-4" /> Topical Steroid
                        </h4>
                        <p className="text-sm text-rose-900">
                          <strong>{rec.topicalSteroid.name}</strong>
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              POTENCY_COLOUR[rec.topicalSteroid.potency]
                            )}
                          >
                            {rec.topicalSteroid.potency}
                          </span>
                        </div>
                        <p className="text-xs text-rose-800 mt-1.5">
                          {rec.topicalSteroid.frequency}
                        </p>
                        <p className="text-xs text-rose-800">
                          Apply to: {rec.topicalSteroid.bodyArea}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Systemic treatment */}
                  {rec.systemicTreatment && (
                    <div className="rounded-md border-l-4 border-l-amber-400 bg-amber-50/60 p-3">
                      <h4 className="text-sm font-semibold mb-1 text-amber-900">
                        Systemic Treatment
                      </h4>
                      <p className="text-sm text-amber-900">
                        {rec.systemicTreatment}
                      </p>
                    </div>
                  )}

                  {/* Dermatology referral */}
                  {rec.dermatologyReferral ? (
                    <div className="rounded-md border bg-muted/40 p-3">
                      <h4 className="text-sm font-semibold mb-1">
                        Dermatology Referral
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        <strong>{rec.dermatologyReferral.service}</strong> —{" "}
                        {rec.dermatologyReferral.consultant} —{" "}
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ml-1",
                            rec.dermatologyReferral.status === "Active"
                              ? "bg-sky-100 text-sky-800"
                              : rec.dermatologyReferral.status === "Awaiting"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                          )}
                        >
                          {rec.dermatologyReferral.status}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border bg-muted/40 p-3">
                      <h4 className="text-sm font-semibold mb-1">
                        Dermatology Referral
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        No active dermatology referral — managed in primary
                        care. Re-refer if condition worsens, fails to settle, or
                        psychosocial impact escalates.
                      </p>
                    </div>
                  )}

                  {/* School considerations */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      School &amp; PE / Swimming Considerations
                    </h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {rec.schoolConsiderations.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Swimming:{" "}
                      <strong>
                        {rec.swimmingSafe
                          ? "Safe with skincare prep"
                          : "Not currently advised — see plan"}
                      </strong>
                    </p>
                  </div>

                  {/* Body confidence work */}
                  {rec.bodyConfidenceWork.length > 0 && (
                    <div className="rounded-md border-l-4 border-l-rose-300 bg-rose-50/40 p-3">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-rose-900">
                        <Heart className="h-4 w-4" /> Body Confidence Support
                      </h4>
                      <ul className="list-disc list-inside text-sm text-rose-900 space-y-1">
                        {rec.bodyConfidenceWork.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sun safety */}
                  <div className="rounded-md border bg-amber-50/40 p-3">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1 text-amber-900">
                      <Sun className="h-4 w-4" /> Sun Safety Plan
                    </h4>
                    <ul className="list-disc list-inside text-sm text-amber-900 space-y-1">
                      {rec.sunSafetyPlan.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Products avoided */}
                  {rec.productsAvoided.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Products Avoided
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.productsAvoided.map((p, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 border"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Flags */}
                  {rec.flagsConcerns.length > 0 && (
                    <div className="rounded-md border-2 border-rose-200 bg-rose-50/60 p-3">
                      <h4 className="text-sm font-semibold mb-1 text-rose-900">
                        Flags &amp; Concerns
                      </h4>
                      <ul className="list-disc list-inside text-sm text-rose-900 space-y-1">
                        {rec.flagsConcerns.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Child voice */}
                  <div className="rounded-md border-l-4 border-l-sky-400 bg-sky-50/60 p-3">
                    <h4 className="text-sm font-semibold mb-1 text-sky-900">
                      Child&apos;s Voice
                    </h4>
                    <p className="text-sm italic text-sky-900">
                      &ldquo;{rec.childVoice}&rdquo;
                    </p>
                  </div>

                  {/* Staff observation */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      Staff Observation
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {rec.staffObservation}
                    </p>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      <strong>Plan Date:</strong> {rec.planDate}
                    </span>
                    <span
                      className={cn(
                        reviewOverdue && "text-rose-700 font-semibold"
                      )}
                    >
                      <strong>Next Review:</strong> {rec.reviewDate}
                    </span>
                    <span>
                      <strong>Key Worker:</strong>{" "}
                      {getStaffName(rec.keyWorker)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
        <p className="font-semibold mb-1">Regulatory Context</p>
        <p>
          Per-child skin condition plans align with NICE NG198 (atopic eczema in
          under-12s, with sibling guidance applied for older children),
          guidance from the British Association of Dermatologists (BAD)
          including BAD acne treatment standards, and the MHRA
          isotretinoin pregnancy prevention programme where systemic retinoid
          treatment is being considered. Plans support compliance with Quality
          Standard 8 (Care Planning) under The Children&apos;s Homes (England)
          Regulations 2015 and uphold the child&apos;s right to the highest
          attainable standard of health (UNCRC Article 24). Language is
          dignified and body-positive: skin conditions are framed as medical,
          not as a hygiene or identity failure. Plans are reviewed at every
          flare, on commencement of new treatment, and at minimum every 6
          months.
        </p>
      </div>
    </PageShell>
  );
}
