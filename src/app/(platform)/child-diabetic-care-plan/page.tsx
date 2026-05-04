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
  Activity, AlertTriangle, Droplet, ChevronUp, ChevronDown, ArrowUpDown, Search, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

interface DiabetesPlan {
  id: string;
  youngPerson: string;
  planDate: string;
  diabetesType: "Type 1" | "Type 2" | "MODY" | "Other";
  diagnosisDate: string;
  hba1cLatest?: string;
  hba1cTarget?: string;
  hba1cLastTaken?: string;
  cgmInUse: boolean;
  cgmDevice?: string;
  insulinPump: boolean;
  pumpDevice?: string;
  insulinRegime: { type: "Basal-bolus MDI" | "Pump CSII" | "Mixed twice daily"; details: string };
  basalInsulin?: { name: string; dose: string; timing: string };
  bolusInsulin?: { name: string; ratio: string; correction: string };
  carbCountingActive: boolean;
  hypoSymptoms: string[];
  hypoTreatmentSteps: string[];
  hyperSymptoms: string[];
  hyperTreatmentSteps: string[];
  ketoneTestingTrigger: string;
  sickDayRules: string[];
  schoolPlanInPlace: boolean;
  childCanSelfManage: "Fully" | "With prompts" | "Adult-administered" | "Building";
  emergencyContacts: { name: string; role: string; phone: string }[];
  dieticianReviewFrequency?: string;
  consultantReviewFrequency?: string;
  childVoice: string;
  staffObservation: string;
  flagsForReview: string[];
  reviewDate: string;
  keyWorker: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const parseHbA1c = (s?: string): number | null => {
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
};

const isOnTarget = (r: DiabetesPlan): boolean => {
  const latest = parseHbA1c(r.hba1cLatest);
  const target = parseHbA1c(r.hba1cTarget);
  if (latest == null || target == null) return false;
  return latest <= target + 5; // within 5 mmol/mol of target counts as on-target band
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: DiabetesPlan[] = [
  {
    id: "dcp_001",
    youngPerson: "yp_jordan",
    planDate: d(-28),
    diabetesType: "Type 1",
    diagnosisDate: d(-1490),
    hba1cLatest: "58 mmol/mol (7.5%)",
    hba1cTarget: "53 mmol/mol (7.0%)",
    hba1cLastTaken: d(-42),
    cgmInUse: true,
    cgmDevice: "Dexcom G7 (linked to Jordan's phone and Oak House on-call phone via Dexcom Follow)",
    insulinPump: false,
    insulinRegime: {
      type: "Basal-bolus MDI",
      details: "Multiple daily injections (MDI) — long-acting basal once daily plus rapid-acting bolus with each carbohydrate-containing meal/snack and for correction. Carb-counted ratios reviewed by paediatric diabetes team every 3 months.",
    },
    basalInsulin: {
      name: "Insulin glargine (Lantus) — long-acting",
      dose: "22 units subcut",
      timing: "Once daily at 21:00, alternating thigh/abdomen sites; site rotation chart in medication folder",
    },
    bolusInsulin: {
      name: "Insulin aspart (NovoRapid) — rapid-acting",
      ratio: "Breakfast 1:8 g · Lunch 1:10 g · Evening meal 1:10 g (units per gram of carbohydrate)",
      correction: "1 unit per 3.0 mmol/L above target of 7.0 mmol/L (no correction within 2 hours of previous bolus — stacking risk)",
    },
    carbCountingActive: true,
    hypoSymptoms: [
      "Shaky hands and trembling",
      "Sudden hunger or feeling 'wobbly'",
      "Pale, sweaty skin",
      "Headache and irritability ('hangry')",
      "Difficulty concentrating; quiet or withdrawn at school",
      "Tingling around lips",
    ],
    hypoTreatmentSteps: [
      "CONSCIOUS, CGM/finger prick <4.0 mmol/L: give 15g fast-acting carbs — 5 GlucoTabs OR 150ml fruit juice OR 5 jelly babies",
      "Wait 15 minutes — recheck blood glucose by finger prick (NOT CGM — lag time)",
      "If still <4.0 mmol/L: repeat fast carbs, recheck after 15 minutes",
      "Once ≥4.0 mmol/L: give 15–20g long-acting carb (slice of toast, cereal bar, banana) UNLESS meal is due within 30 minutes",
      "UNCONSCIOUS or unable to swallow: place in recovery position, DIAL 999, administer GlucaGen HypoKit IM (1mg) into outer thigh — staff trained competency on file",
      "Do NOT give anything by mouth if drowsy or fitting",
      "Notify Registered Manager and on-call diabetes nurse; log episode on CGM event diary and paper hypo log",
    ],
    hyperSymptoms: [
      "Excessive thirst (polydipsia) and dry mouth",
      "Frequent urination, including nocturnal enuresis",
      "Tiredness, lethargy, blurred vision",
      "Fruity (acetone) breath — DKA warning sign",
      "Nausea, vomiting, abdominal pain — DKA warning sign",
      "Rapid deep breathing (Kussmaul) — DKA warning sign",
    ],
    hyperTreatmentSteps: [
      "BG ≥ 14.0 mmol/L on two consecutive readings: test blood ketones via Optium meter (NOT urine ketones — less reliable)",
      "Blood ketones <0.6 mmol/L: give correction dose per ratio, encourage sugar-free fluids, recheck in 1 hour",
      "Blood ketones 0.6–1.5 mmol/L: give correction dose, push fluids, recheck BG and ketones in 1 hour, contact diabetes nurse same-day",
      "Blood ketones 1.5–3.0 mmol/L OR vomiting: contact diabetes team urgently, attend A&E if cannot reach team within 1 hour",
      "Blood ketones ≥3.0 mmol/L OR Kussmaul breathing OR vomiting + abdominal pain: TREAT AS DKA — DIAL 999, do not delay",
      "Never withhold insulin during high readings, even if not eating — basal insulin must continue",
    ],
    ketoneTestingTrigger: "Test blood ketones whenever BG ≥ 14.0 mmol/L on two consecutive checks; whenever Jordan feels unwell regardless of BG; during any illness with fever; if vomiting; if CGM shows trend arrow up two consecutive hours despite correction.",
    sickDayRules: [
      "NEVER stop basal insulin — continue Lantus 22u even if not eating",
      "Check BG every 2 hours, blood ketones every 4 hours (or more frequently if unwell)",
      "Encourage 100ml clear sugar-free fluid every hour if BG ≥10; switch to sugar-containing fluids (flat cola, dilute juice) if BG <10 and unable to eat",
      "Give correction insulin per usual ratio unless ketones ≥1.5 mmol/L (then increase per sick-day chart provided by diabetes team — laminated copy in medication folder)",
      "Contact paediatric diabetes nurse same day for any vomiting, ketones ≥1.5, BG persistently >14 despite corrections, or symptoms of DKA",
      "Document every reading, every dose, every fluid intake on the sick-day log sheet",
      "Do NOT send Jordan to school if unwell + ketones present; supervise closely at home",
    ],
    schoolPlanInPlace: true,
    childCanSelfManage: "With prompts",
    emergencyContacts: [
      { name: "Paediatric Diabetes Specialist Nurse (PDSN)", role: "Lead PDSN — Evelina London Children's Hospital", phone: "020 7188 4000 (bleep 0817)" },
      { name: "Dr Imogen Hartley", role: "Consultant Paediatric Endocrinologist — Evelina London", phone: "020 7188 4000" },
      { name: "Dr Helena Marsh", role: "GP — Northgate Health Centre", phone: "020 8123 4567" },
      { name: "Diabetes Out-of-Hours", role: "PDSN on-call (24h)", phone: "020 7188 7188" },
      { name: "Anna Coleman", role: "Key Worker, Oak House", phone: "07700 900112" },
      { name: "Oak House on-call", role: "Registered Manager (24h)", phone: "07700 900100" },
      { name: "NHS 111 / 999", role: "Out-of-hours / emergency (state Type 1 diabetes, possible DKA)", phone: "111 or 999" },
    ],
    dieticianReviewFrequency: "Every 6 months with paediatric diabetes dietician (carb-count refresher and growth review)",
    consultantReviewFrequency: "Every 3 months at Evelina paediatric diabetes clinic; HbA1c, growth, injection sites, mental health screen each visit",
    childVoice: "I've had it since I was little so it's just part of me now. The G7 is way better than finger pricks but I still hate it when it goes off in class. I want staff to ask me first before they jump in — I usually know what to do, I just need someone to remember to bring my snacks and check on me at PE. Hypos at night are scary so I like that mum and Anna both get the alerts.",
    staffObservation: "Jordan is competent and motivated with self-management but benefits from gentle prompts at mealtimes and pre-PE. Demonstrates accurate carb counting from food packaging and restaurant menus. Recent dip in HbA1c attributed to growth spurt and exam stress; diabetes team have adjusted bolus ratios accordingly. CGM share enabled to Anna's Oak House work phone and to consenting birth parent. Hypoglycaemia awareness intact. Staff have all completed Diabetes UK Type 1 training within last 12 months and hold current GlucaGen administration competency. Plan reviewed with school SENCO and PE department.",
    flagsForReview: [
      "HbA1c rose from 51 to 58 over last two reviews — discuss bolus ratios at next clinic",
      "Two overnight hypos this month — basal dose review with PDSN booked for next week",
      "Growth spurt recorded — re-weigh at next clinic to recalculate insulin sensitivity factor",
    ],
    reviewDate: d(62),
    keyWorker: "staff_anna",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ChildDiabeticCarePlanPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        getYPName(r.youngPerson).toLowerCase().includes(q) ||
        r.diabetesType.toLowerCase().includes(q) ||
        r.insulinRegime.type.toLowerCase().includes(q),
      );
    }
    if (filterType !== "all") rows = rows.filter((r) => r.diabetesType === filterType);
    rows.sort((a, b) =>
      sortBy === "newest"
        ? b.planDate.localeCompare(a.planDate)
        : a.planDate.localeCompare(b.planDate),
    );
    return rows;
  }, [data, search, filterType, sortBy]);

  const total = data.length;
  const onTarget = data.filter(isOnTarget).length;
  const selfManaging = data.filter((r) => r.childCanSelfManage === "Fully" || r.childCanSelfManage === "With prompts").length;
  const today = d(0);
  const ninetyDays = d(90);
  const reviewsDue90 = data.filter((r) => r.reviewDate >= today && r.reviewDate <= ninetyDays).length;

  const exportCols: ExportColumn<DiabetesPlan>[] = [
    { header: "Young Person", accessor: (r: DiabetesPlan) => getYPName(r.youngPerson) },
    { header: "Plan Date", accessor: (r: DiabetesPlan) => r.planDate },
    { header: "Diabetes Type", accessor: (r: DiabetesPlan) => r.diabetesType },
    { header: "Diagnosis Date", accessor: (r: DiabetesPlan) => r.diagnosisDate },
    { header: "HbA1c Latest", accessor: (r: DiabetesPlan) => r.hba1cLatest ?? "—" },
    { header: "HbA1c Target", accessor: (r: DiabetesPlan) => r.hba1cTarget ?? "—" },
    { header: "HbA1c Last Taken", accessor: (r: DiabetesPlan) => r.hba1cLastTaken ?? "—" },
    { header: "CGM In Use", accessor: (r: DiabetesPlan) => r.cgmInUse ? (r.cgmDevice ?? "Yes") : "No" },
    { header: "Insulin Pump", accessor: (r: DiabetesPlan) => r.insulinPump ? (r.pumpDevice ?? "Yes") : "No" },
    { header: "Insulin Regime", accessor: (r: DiabetesPlan) => `${r.insulinRegime.type} — ${r.insulinRegime.details}` },
    { header: "Basal Insulin", accessor: (r: DiabetesPlan) => r.basalInsulin ? `${r.basalInsulin.name} ${r.basalInsulin.dose} ${r.basalInsulin.timing}` : "—" },
    { header: "Bolus Insulin", accessor: (r: DiabetesPlan) => r.bolusInsulin ? `${r.bolusInsulin.name} ratio ${r.bolusInsulin.ratio} correction ${r.bolusInsulin.correction}` : "—" },
    { header: "Carb Counting", accessor: (r: DiabetesPlan) => r.carbCountingActive ? "Yes" : "No" },
    { header: "Hypo Symptoms", accessor: (r: DiabetesPlan) => r.hypoSymptoms.join("; ") },
    { header: "Hypo Treatment", accessor: (r: DiabetesPlan) => r.hypoTreatmentSteps.join("; ") },
    { header: "Hyper Symptoms", accessor: (r: DiabetesPlan) => r.hyperSymptoms.join("; ") },
    { header: "Hyper Treatment", accessor: (r: DiabetesPlan) => r.hyperTreatmentSteps.join("; ") },
    { header: "Ketone Testing Trigger", accessor: (r: DiabetesPlan) => r.ketoneTestingTrigger },
    { header: "Sick Day Rules", accessor: (r: DiabetesPlan) => r.sickDayRules.join("; ") },
    { header: "School Plan", accessor: (r: DiabetesPlan) => r.schoolPlanInPlace ? "Yes" : "No" },
    { header: "Self-Management", accessor: (r: DiabetesPlan) => r.childCanSelfManage },
    { header: "Dietician Review", accessor: (r: DiabetesPlan) => r.dieticianReviewFrequency ?? "—" },
    { header: "Consultant Review", accessor: (r: DiabetesPlan) => r.consultantReviewFrequency ?? "—" },
    { header: "Flags For Review", accessor: (r: DiabetesPlan) => r.flagsForReview.join("; ") },
    { header: "Review Date", accessor: (r: DiabetesPlan) => r.reviewDate },
    { header: "Key Worker", accessor: (r: DiabetesPlan) => getStaffName(r.keyWorker) },
  ];

  return (
    <PageShell
      title="Child Diabetic Care Plan"
      subtitle="Per-child Type 1/2 diabetes plan · NICE NG18 · JBDS-IP · Diabetes UK School Plan · Quality Standard 8"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Diabetic Care Plans" />
          <ExportButton data={data} columns={exportCols} filename="child-diabetic-care-plan" />
        </div>
      }
    >
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Plans", value: total, icon: Droplet, clr: "text-sky-600" },
            { label: "HbA1c On Target", value: onTarget, icon: Activity, clr: "text-green-600" },
            { label: "Self-Manages (Fully/Prompts)", value: selfManaging, icon: Activity, clr: "text-blue-600" },
            { label: "Reviews Due 90d", value: reviewsDue90, icon: Phone, clr: "text-amber-600" },
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
              placeholder="Search young person, diabetes type or regime..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Diabetes Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Type 1">Type 1</SelectItem>
              <SelectItem value="Type 2">Type 2</SelectItem>
              <SelectItem value="MODY">MODY</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
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
            const onTargetFlag = isOnTarget(r);
            const borderClr = r.diabetesType === "Type 1"
              ? "border-l-sky-500"
              : r.diabetesType === "Type 2"
                ? "border-l-blue-500"
                : "border-l-indigo-400";
            return (
              <Card key={r.id} className={cn("border-l-4", borderClr)}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.youngPerson)}
                        <Badge variant="outline" className="bg-sky-100 text-sky-800">{r.diabetesType}</Badge>
                        {r.hba1cLatest && (
                          <Badge variant="outline" className={cn(
                            onTargetFlag ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800",
                          )}>
                            HbA1c {r.hba1cLatest}{onTargetFlag ? " · on target" : " · above target"}
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">Self-manage: {r.childCanSelfManage}</Badge>
                        {r.cgmInUse && (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700">CGM</Badge>
                        )}
                        {r.insulinPump && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">Pump</Badge>
                        )}
                        {r.flagsForReview.length > 0 && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800">{r.flagsForReview.length} review flag{r.flagsForReview.length === 1 ? "" : "s"}</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Plan: {r.planDate} · Diagnosed: {r.diagnosisDate} · Key worker: {getStaffName(r.keyWorker)} · Review: {r.reviewDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-muted/50">{r.insulinRegime.type}</Badge>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    <div className="rounded p-2 border-l-4 border-l-sky-600 bg-sky-50">
                      <p className="text-xs font-semibold text-sky-900 flex items-center gap-1">
                        <Droplet className="h-3.5 w-3.5" /> Insulin Regime — {r.insulinRegime.type}
                      </p>
                      <p className="text-xs text-sky-800 mt-1">{r.insulinRegime.details}</p>
                      {r.cgmInUse && r.cgmDevice && (
                        <p className="text-xs text-sky-700 mt-1"><span className="font-medium">CGM: </span>{r.cgmDevice}</p>
                      )}
                      {r.insulinPump && r.pumpDevice && (
                        <p className="text-xs text-sky-700 mt-1"><span className="font-medium">Pump: </span>{r.pumpDevice}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded p-2 border-l-4 border-l-blue-700 bg-blue-50">
                        <p className="text-xs font-semibold text-blue-900">Basal (long-acting)</p>
                        {r.basalInsulin ? (
                          <>
                            <p className="text-xs mt-1">{r.basalInsulin.name}</p>
                            <p className="text-xs text-muted-foreground">{r.basalInsulin.dose}</p>
                            <p className="text-xs text-muted-foreground">{r.basalInsulin.timing}</p>
                          </>
                        ) : (
                          <p className="text-xs italic text-muted-foreground mt-1">Pump basal — see CSII profile</p>
                        )}
                      </div>
                      <div className="rounded p-2 border-l-4 border-l-indigo-600 bg-indigo-50">
                        <p className="text-xs font-semibold text-indigo-900">Bolus (rapid-acting)</p>
                        {r.bolusInsulin ? (
                          <>
                            <p className="text-xs mt-1">{r.bolusInsulin.name}</p>
                            <p className="text-xs text-muted-foreground"><span className="font-medium">Ratio: </span>{r.bolusInsulin.ratio}</p>
                            <p className="text-xs text-muted-foreground"><span className="font-medium">Correction: </span>{r.bolusInsulin.correction}</p>
                          </>
                        ) : (
                          <p className="text-xs italic text-muted-foreground mt-1">Not currently prescribed</p>
                        )}
                        {r.carbCountingActive && (
                          <Badge variant="outline" className="mt-1 bg-white">Carb counting active</Badge>
                        )}
                      </div>
                    </div>

                    {(r.hba1cLatest || r.hba1cTarget) && (
                      <div className="bg-muted/40 rounded p-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="rounded p-2 border bg-white">
                          <p className="text-xs font-semibold">Latest HbA1c</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.hba1cLatest ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">Taken: {r.hba1cLastTaken ?? "—"}</p>
                        </div>
                        <div className="rounded p-2 border bg-white">
                          <p className="text-xs font-semibold">Target HbA1c</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.hba1cTarget ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">NICE NG18 ≤48 mmol/mol where safe</p>
                        </div>
                        <div className={cn(
                          "rounded p-2 border",
                          onTargetFlag ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50",
                        )}>
                          <p className={cn("text-xs font-semibold", onTargetFlag ? "text-green-800" : "text-amber-800")}>
                            {onTargetFlag ? "Within target band" : "Above target band"}
                          </p>
                          <p className={cn("text-xs mt-0.5", onTargetFlag ? "text-green-700" : "text-amber-700")}>
                            Reviewed quarterly with paediatric diabetes team
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded p-2 border border-red-300 bg-red-50">
                        <p className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Hypoglycaemia (BG &lt; 4.0 mmol/L)
                        </p>
                        <p className="text-xs font-medium text-red-900 mt-1">Symptoms</p>
                        <ul className="space-y-0.5">
                          {r.hypoSymptoms.map((s, i) => (
                            <li key={i} className="text-xs text-red-900">• {s}</li>
                          ))}
                        </ul>
                        <p className="text-xs font-medium text-red-900 mt-2">Treatment (15-15 rule)</p>
                        <ul className="space-y-0.5">
                          {r.hypoTreatmentSteps.map((s, i) => (
                            <li key={i} className="text-xs text-red-900">{i + 1}. {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded p-2 border border-red-300 bg-red-50">
                        <p className="text-xs font-semibold text-red-800 mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Hyperglycaemia / DKA risk
                        </p>
                        <p className="text-xs font-medium text-red-900 mt-1">Symptoms</p>
                        <ul className="space-y-0.5">
                          {r.hyperSymptoms.map((s, i) => (
                            <li key={i} className="text-xs text-red-900">• {s}</li>
                          ))}
                        </ul>
                        <p className="text-xs font-medium text-red-900 mt-2">Treatment</p>
                        <ul className="space-y-0.5">
                          {r.hyperTreatmentSteps.map((s, i) => (
                            <li key={i} className="text-xs text-red-900">{i + 1}. {s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="rounded p-2 border border-amber-300 bg-amber-50">
                      <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Ketone Testing Trigger
                      </p>
                      <p className="text-xs text-amber-900">{r.ketoneTestingTrigger}</p>
                    </div>

                    <div className="rounded p-2 border border-amber-300 bg-amber-50">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Sick Day Rules</p>
                      <ul className="space-y-1">
                        {r.sickDayRules.map((s, i) => (
                          <li key={i} className="text-xs text-amber-900">• {s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-muted/30 rounded p-2">
                        <p className="text-xs font-medium mb-1">School / Education Plan</p>
                        <p className="text-xs text-muted-foreground">
                          {r.schoolPlanInPlace
                            ? "Diabetes UK School Plan in place — IHP shared with school nurse, SENCO and class teacher; spare hypo kit and HypoKit in school office; PE protocol agreed."
                            : "School plan NOT yet in place — escalate to Registered Manager and PDSN within 5 working days."}
                        </p>
                        {r.dieticianReviewFrequency && (
                          <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Dietician: </span>{r.dieticianReviewFrequency}</p>
                        )}
                        {r.consultantReviewFrequency && (
                          <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Consultant: </span>{r.consultantReviewFrequency}</p>
                        )}
                      </div>
                      <div className="bg-muted/30 rounded p-2">
                        <p className="text-xs font-medium mb-1 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Emergency Contacts
                        </p>
                        <ul className="space-y-0.5">
                          {r.emergencyContacts.map((c, i) => (
                            <li key={i} className="text-xs">
                              <span className="font-medium">{c.name}</span>
                              <span className="text-muted-foreground"> — {c.role}: {c.phone}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {r.flagsForReview.length > 0 && (
                      <div className="rounded p-2 border border-amber-300 bg-amber-50">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Flags for Next Clinical Review</p>
                        <ul className="space-y-0.5">
                          {r.flagsForReview.map((f, i) => (
                            <li key={i} className="text-xs text-amber-900">• {f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-purple-50 border border-purple-200 rounded p-2">
                      <p className="font-medium text-xs text-purple-800 mb-1">Child&apos;s Voice</p>
                      <p className="text-xs text-purple-700 italic">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>

                    <div className="bg-sky-50 border border-sky-200 rounded p-2">
                      <p className="font-medium text-xs text-sky-800 mb-1">Staff Observation</p>
                      <p className="text-xs text-sky-700">{r.staffObservation}</p>
                    </div>

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Plan logged by {getStaffName("staff_darren")} · Reviewed with {getStaffName(r.keyWorker)} · Next review: {r.reviewDate}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework — Per-child Diabetic Care Plans</p>
          <p>
            Every child or young person with diabetes living in a children&apos;s home must have an individualised written care plan that meets NICE NG18 (Diabetes — type 1 and type 2 in children and young people: diagnosis and management) and reflects the model published in the Diabetes UK School Plan / Individual Healthcare Plan template. The plan must specify the insulin regime (basal-bolus MDI or pump CSII), carbohydrate-to-insulin ratios, correction factors, hypoglycaemia recognition and the 15-15 treatment rule, hyperglycaemia and DKA recognition, ketone testing triggers, sick-day rules (never stop basal insulin), CGM/Libre alerts and the named clinicians at the local paediatric diabetes service. JBDS-IP guidance on the management of DKA in children and on inpatient diabetes care provides the underpinning emergency framework. Children&apos;s Homes (England) Regulations 2015, Quality Standard 8 (Health and wellbeing) requires the registered person to ensure each child&apos;s health needs are met and that staff are competent in administering prescribed medication, recognising acute deterioration and using rescue medication including IM glucagon (GlucaGen HypoKit). The plan must be shared with the child&apos;s school under the Supporting Pupils with Medical Conditions statutory guidance (DfE, 2015) and reviewed at every paediatric diabetes clinic appointment, after every severe hypoglycaemic episode or DKA admission, and at minimum every 6 months. The child&apos;s voice and lived expertise must be central to the plan, in line with UNCRC Article 24 (right to the highest attainable standard of health) and Article 12 (right to be heard). Data sharing of CGM follow alerts to staff and birth family must be governed by a written information-sharing agreement consistent with UK GDPR and the child&apos;s consent where competent.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
