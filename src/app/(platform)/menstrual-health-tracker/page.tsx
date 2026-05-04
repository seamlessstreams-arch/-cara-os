"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Heart, Lock, MessageCircle, BookOpen, Sparkles, ShieldCheck,
  Package, GraduationCap, HandHeart, Users, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type Stage =
  | "Pre-puberty awareness"
  | "Early signs noted"
  | "Started menstruating"
  | "Established"
  | "N/A — not menstruating";

type ComfortLevel =
  | "Comfortable discussing"
  | "Developing comfort"
  | "Reluctant"
  | "Private — staff only when needed";

interface MenstrualPlan {
  id: string;
  youngPerson: string;
  childInitiationStage: Stage;
  childInformedConsentAge: string;
  supportingStaff: string;
  preferredFemaleStaffOnly: boolean;
  productsProvided: string[];
  childChosenProducts: boolean;
  painManagement: string;
  educationDelivered: string[];
  accessibilityOfProducts: string;
  privacyArrangements: string;
  familyConversations: string;
  schoolHealthSupport: string;
  conversationsWithChild: string;
  childComfortLevel: ComfortLevel;
  planReviewedDate: string;
  reviewedBy: string;
  confidentialityNote: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const STAGE_CLR: Record<Stage, string> = {
  "Pre-puberty awareness": "bg-sky-100 text-sky-800",
  "Early signs noted": "bg-violet-100 text-violet-800",
  "Started menstruating": "bg-rose-100 text-rose-800",
  "Established": "bg-pink-100 text-pink-800",
  "N/A — not menstruating": "bg-slate-100 text-slate-700",
};

const STAGE_BORDER: Record<Stage, string> = {
  "Pre-puberty awareness": "border-l-sky-300",
  "Early signs noted": "border-l-violet-400",
  "Started menstruating": "border-l-rose-400",
  "Established": "border-l-pink-400",
  "N/A — not menstruating": "border-l-slate-300",
};

const COMFORT_CLR: Record<ComfortLevel, string> = {
  "Comfortable discussing": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Developing comfort": "bg-amber-50 text-amber-700 border-amber-200",
  "Reluctant": "bg-orange-50 text-orange-700 border-orange-200",
  "Private — staff only when needed": "bg-slate-50 text-slate-700 border-slate-200",
};

const STAGES: Stage[] = [
  "Pre-puberty awareness",
  "Early signs noted",
  "Started menstruating",
  "Established",
  "N/A — not menstruating",
];

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: MenstrualPlan[] = [
  {
    id: "mh_casey",
    youngPerson: "yp_casey",
    childInitiationStage: "Established",
    childInformedConsentAge: "Plan co-developed with Casey (age-appropriate, ongoing consent revisited at each review)",
    supportingStaff: "staff_anna",
    preferredFemaleStaffOnly: true,
    productsProvided: [
      "Organic cotton pads (light/regular/night)",
      "Period pants (Casey's preference)",
      "Reusable pad option (offered, Casey trying gradually)",
      "Heat pack",
    ],
    childChosenProducts: true,
    painManagement:
      "Casey has discussed pain management with the GP. A warm wheat bag and quiet bedroom time are first-line. Paracetamol available per agreed protocol. Casey tracks comfort in their own way — staff do not require disclosure of cycle dates.",
    educationDelivered: [
      "Age-appropriate menstrual health conversation (led by Anna)",
      "Sensory considerations for product choice",
      "Cycle tracking apps reviewed together — Casey chose not to use one",
      "Body autonomy and consent reinforced",
    ],
    accessibilityOfProducts:
      "Discreet supply in Casey's bedroom drawer (replenished weekly without prompt). Spare basket in the upstairs bathroom available to all children. Travel pouch packed for school bag.",
    privacyArrangements:
      "Casey can request the upstairs bathroom be reserved when needed — no questions asked. A small 'green dot' magnet on the bathroom door communicates privacy without verbal disclosure. Bedroom door always respected.",
    familyConversations:
      "Discussed at LAC review with Casey's agreement. Casey chose not to involve birth family on this topic at present — wish respected and recorded.",
    schoolHealthSupport:
      "School pastoral lead aware that Casey may need to leave class for the bathroom without challenge. School nurse offered as additional support — Casey declined for now but knows the option remains.",
    conversationsWithChild:
      "Casey has named Anna as their preferred staff member for any practical conversations. Casey uses they/them pronouns and has asked that we use neutral language ('your period' rather than gendered phrasing). This is honoured throughout the home.",
    childComfortLevel: "Private — staff only when needed",
    planReviewedDate: d(-21),
    reviewedBy: "staff_darren",
    confidentialityNote:
      "This plan is shared only with the small circle of staff Casey has agreed to. Not visible in shared handover documents. Casey reviews who can see this at every plan review.",
  },
  {
    id: "mh_alex",
    youngPerson: "yp_alex",
    childInitiationStage: "N/A — not menstruating",
    childInformedConsentAge: "Pre-puberty awareness conversation — age-appropriate, child-led, staff-supported",
    supportingStaff: "staff_chervelle",
    preferredFemaleStaffOnly: false,
    productsProvided: [],
    childChosenProducts: false,
    painManagement: "Not applicable. General wellbeing supported through usual care planning.",
    educationDelivered: [
      "Universal puberty awareness conversation (all children, age-appropriate)",
      "Period products are normal household items — Alex knows where the spare basket is and that it is for anyone who needs it",
      "Open-door approach: Alex knows he can ask any staff member about any health topic",
    ],
    accessibilityOfProducts:
      "Spare basket in the upstairs bathroom is openly available to all children, family members and visitors who need it (Period Products (Free Provision) Scotland Act principle applied as best practice).",
    privacyArrangements:
      "All children are taught to respect bathroom privacy and the 'green dot' system. Alex understands the principle.",
    familyConversations: "No specific conversations needed at this stage.",
    schoolHealthSupport:
      "School delivers age-appropriate RSHE — Alex has engaged well. No additional health input required.",
    conversationsWithChild:
      "Alex has had a brief, age-appropriate conversation about periods being a normal part of life and not a topic for teasing or shame. He responded with maturity and curiosity. No further action.",
    childComfortLevel: "Comfortable discussing",
    planReviewedDate: d(-45),
    reviewedBy: "staff_darren",
    confidentialityNote:
      "Record kept as part of universal best practice — every child has a menstrual health awareness record so that no child feels singled out. Visible only to those with a legitimate need.",
  },
  {
    id: "mh_jordan",
    youngPerson: "yp_jordan",
    childInitiationStage: "N/A — not menstruating",
    childInformedConsentAge: "Pre-puberty awareness conversation — age-appropriate, child-led, staff-supported",
    supportingStaff: "staff_mirela",
    preferredFemaleStaffOnly: false,
    productsProvided: [],
    childChosenProducts: false,
    painManagement: "Not applicable.",
    educationDelivered: [
      "Universal puberty awareness conversation (age-appropriate)",
      "Period products are openly stocked — Jordan understands they are for anyone who needs them",
      "Discussion about respect and challenging stigma if heard among peers",
    ],
    accessibilityOfProducts:
      "Spare basket in the upstairs bathroom is openly available to all. Jordan knows where it is and what it's for.",
    privacyArrangements:
      "House privacy norms apply equally to all children. Jordan respects bathroom door signals.",
    familyConversations: "No specific conversations needed at this stage.",
    schoolHealthSupport:
      "School delivers age-appropriate RSHE. No additional input required.",
    conversationsWithChild:
      "Jordan engaged in a short conversation with Mirela about periods being normal and never something to mock. Jordan asked thoughtful questions and the topic was handled briefly and matter-of-factly.",
    childComfortLevel: "Comfortable discussing",
    planReviewedDate: d(-60),
    reviewedBy: "staff_darren",
    confidentialityNote:
      "Record kept as part of universal best practice. Visible only to those with a legitimate need.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function MenstrualHealthTrackerPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("review-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterStage !== "all" && r.childInitiationStage !== filterStage) return false;
      if (filterYP !== "all" && r.youngPerson !== filterYP) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          getYPName(r.youngPerson).toLowerCase().includes(q) ||
          r.conversationsWithChild.toLowerCase().includes(q) ||
          r.educationDelivered.join(" ").toLowerCase().includes(q) ||
          r.accessibilityOfProducts.toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "review-desc": return b.planReviewedDate.localeCompare(a.planReviewedDate);
        case "review-asc": return a.planReviewedDate.localeCompare(b.planReviewedDate);
        case "yp": return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "stage": {
          const order: Stage[] = [
            "Established",
            "Started menstruating",
            "Early signs noted",
            "Pre-puberty awareness",
            "N/A — not menstruating",
          ];
          return order.indexOf(a.childInitiationStage) - order.indexOf(b.childInitiationStage);
        }
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterStage, filterYP, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const activePlans = useMemo(
    () => data.filter((r) => r.childInitiationStage !== "N/A — not menstruating").length,
    [data],
  );

  const educationDelivered = useMemo(
    () => data.filter((r) => r.educationDelivered.length > 0).length,
    [data],
  );

  const reviewedIn90d = useMemo(() => {
    const cutoff = d(-90);
    return data.filter((r) => r.planReviewedDate >= cutoff).length;
  }, [data]);

  const yps = Array.from(new Set(data.map((r) => r.youngPerson)));

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<MenstrualPlan>[] = [
    { header: "Child", accessor: (r: MenstrualPlan) => getYPName(r.youngPerson) },
    { header: "Stage", accessor: (r: MenstrualPlan) => r.childInitiationStage },
    { header: "Consent / Age-appropriateness", accessor: (r: MenstrualPlan) => r.childInformedConsentAge },
    { header: "Supporting Staff", accessor: (r: MenstrualPlan) => getStaffName(r.supportingStaff) },
    { header: "Female Staff Only Preferred", accessor: (r: MenstrualPlan) => r.preferredFemaleStaffOnly ? "Yes" : "No" },
    { header: "Products Provided", accessor: (r: MenstrualPlan) => r.productsProvided.join("; ") },
    { header: "Child Chose Products", accessor: (r: MenstrualPlan) => r.childChosenProducts ? "Yes" : "No" },
    { header: "Pain Management", accessor: (r: MenstrualPlan) => r.painManagement },
    { header: "Education Delivered", accessor: (r: MenstrualPlan) => r.educationDelivered.join("; ") },
    { header: "Accessibility of Products", accessor: (r: MenstrualPlan) => r.accessibilityOfProducts },
    { header: "Privacy Arrangements", accessor: (r: MenstrualPlan) => r.privacyArrangements },
    { header: "Family Conversations", accessor: (r: MenstrualPlan) => r.familyConversations },
    { header: "School / Health Support", accessor: (r: MenstrualPlan) => r.schoolHealthSupport },
    { header: "Conversations with Child", accessor: (r: MenstrualPlan) => r.conversationsWithChild },
    { header: "Child Comfort Level", accessor: (r: MenstrualPlan) => r.childComfortLevel },
    { header: "Plan Reviewed Date", accessor: (r: MenstrualPlan) => r.planReviewedDate },
    { header: "Reviewed By", accessor: (r: MenstrualPlan) => getStaffName(r.reviewedBy) },
    { header: "Confidentiality Note", accessor: (r: MenstrualPlan) => r.confidentialityNote },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

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
        {/* ── stat strip ───────────────────────────────────────────────────── */}
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

        {/* ── tender banner ────────────────────────────────────────────────── */}
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

        {/* ── confidentiality strip ────────────────────────────────────────── */}
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

        {/* ── filters ──────────────────────────────────────────────────────── */}
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
              {STAGES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
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

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            const isActive = r.childInitiationStage !== "N/A — not menstruating";
            return (
              <Card
                key={r.id}
                className={cn("border-l-4", STAGE_BORDER[r.childInitiationStage])}
              >
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.youngPerson)}
                        <Badge variant="outline" className={STAGE_CLR[r.childInitiationStage]}>
                          {r.childInitiationStage}
                        </Badge>
                        <Badge variant="outline" className={COMFORT_CLR[r.childComfortLevel]}>
                          <MessageCircle className="h-3 w-3 mr-1" /> {r.childComfortLevel}
                        </Badge>
                        {r.preferredFemaleStaffOnly && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Female staff preferred
                          </Badge>
                        )}
                        {isActive && r.childChosenProducts && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <Sparkles className="h-3 w-3 mr-1" /> Child-chosen products
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Supporting staff: {getStaffName(r.supportingStaff)} · Last reviewed: {r.planReviewedDate}
                      </p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* confidentiality reminder */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="font-semibold text-slate-800 flex items-center gap-1">
                        <Lock className="h-4 w-4" /> Confidentiality note for this record
                      </p>
                      <p className="text-slate-700 mt-1">{r.confidentialityNote}</p>
                    </div>

                    {/* conversations led by child */}
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                      <p className="font-semibold text-rose-800 flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" /> Conversations with the child
                      </p>
                      <p className="text-rose-700 mt-1">{r.conversationsWithChild}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <ShieldCheck className="h-4 w-4" /> Consent &amp; age-appropriateness
                        </p>
                        <p className="text-muted-foreground">{r.childInformedConsentAge}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Heart className="h-4 w-4" /> Pain management
                        </p>
                        <p className="text-muted-foreground">{r.painManagement}</p>
                      </div>
                    </div>

                    {/* products */}
                    {r.productsProvided.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Package className="h-4 w-4" /> Products provided (child-chosen)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {r.productsProvided.map((p, i) => (
                            <Badge key={i} variant="outline" className="bg-pink-50 text-pink-800 border-pink-200">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* education */}
                    {r.educationDelivered.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <BookOpen className="h-4 w-4" /> Education delivered
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {r.educationDelivered.map((e, i) => (
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
                        <p className="text-muted-foreground">{r.accessibilityOfProducts}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Privacy arrangements</p>
                        <p className="text-muted-foreground">{r.privacyArrangements}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <Users className="h-4 w-4" /> Family conversations
                        </p>
                        <p className="text-muted-foreground">{r.familyConversations}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" /> School / health support
                        </p>
                        <p className="text-muted-foreground">{r.schoolHealthSupport}</p>
                      </div>
                    </div>

                    {/* footer */}
                    <div className="flex flex-wrap justify-between items-center pt-2 border-t text-xs text-muted-foreground gap-2">
                      <span>Reviewed by: {getStaffName(r.reviewedBy)}</span>
                      <span>Last review: {r.planReviewedDate}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>
            Children&apos;s Homes (England) Regulations 2015, Quality Standard 7 (Health &amp; wellbeing) &mdash; children must receive care that
            promotes their physical, emotional and sexual health, with access to appropriate health information and resources at a pace and in a
            way that is right for them. We apply the principles of the Period Products (Free Provision) Scotland Act 2021 as best practice:
            menstrual products are provided free, openly accessible, dignified to access, and offered in a way that respects choice (including
            sensory and identity-affirming options). This record holds the support plan only &mdash; we do not record cycle data. Cross-reference
            with the Personal Passport, Health Action Plan, and Key Work entries. Casey&apos;s pronouns (they/them) are used throughout and the
            plan is reviewed in partnership with Casey at every review point. Records are sensitive &mdash; access is limited to those with a
            legitimate, child-agreed need to know &mdash; and retained until the child&apos;s 25th birthday (or 75 years for looked-after children,
            per Reg 37).
          </p>
        </div>
      </div>
    </PageShell>
  );
}
