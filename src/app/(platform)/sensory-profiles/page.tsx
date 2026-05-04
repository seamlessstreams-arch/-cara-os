"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Ear,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Eye,
  Hand,
  Volume2,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type SensoryDomain = "visual" | "auditory" | "tactile" | "gustatory" | "olfactory" | "proprioceptive" | "vestibular" | "interoceptive";
type ResponsePattern = "hyper_responsive" | "hypo_responsive" | "seeking" | "typical";
type ProfileStatus = "active" | "under_review" | "archived";

interface SensoryEntry {
  domain: SensoryDomain;
  responsePattern: ResponsePattern;
  triggers: string[];
  calming: string[];
  intensity: number; // 1–5
  notes: string;
}

interface Strategy {
  id: string;
  context: string; // e.g. "mealtimes", "bedtime", "school", "outings"
  strategy: string;
  effectivenessRating: number; // 1-5
  addedBy: string;
  addedDate: string;
}

interface SensoryProfile {
  id: string;
  youngPersonId: string;
  status: ProfileStatus;
  assessedBy: string;
  assessmentDate: string;
  reviewDate: string;
  diagnosis: string[];
  entries: SensoryEntry[];
  strategies: Strategy[];
  environmentalAdaptations: string[];
  communicationPreferences: string[];
  childViews: string;
  parentCarerViews: string;
  professionalInput: string;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const DOMAIN_LABELS: Record<SensoryDomain, string> = {
  visual: "Visual", auditory: "Auditory", tactile: "Tactile",
  gustatory: "Gustatory (Taste)", olfactory: "Olfactory (Smell)",
  proprioceptive: "Proprioceptive", vestibular: "Vestibular",
  interoceptive: "Interoceptive",
};

const DOMAIN_ICONS: Record<SensoryDomain, string> = {
  visual: "👁", auditory: "👂", tactile: "✋",
  gustatory: "👅", olfactory: "👃",
  proprioceptive: "🏋️", vestibular: "🔄",
  interoceptive: "❤️",
};

const RESPONSE_LABELS: Record<ResponsePattern, string> = {
  hyper_responsive: "Hyper-responsive", hypo_responsive: "Hypo-responsive",
  seeking: "Sensory Seeking", typical: "Typical",
};

const RESPONSE_COLOURS: Record<ResponsePattern, string> = {
  hyper_responsive: "bg-red-100 text-red-800",
  hypo_responsive: "bg-blue-100 text-blue-800",
  seeking: "bg-amber-100 text-amber-800",
  typical: "bg-green-100 text-green-800",
};

const STATUS_LABELS: Record<ProfileStatus, string> = {
  active: "Active", under_review: "Under Review", archived: "Archived",
};

const STATUS_COLOURS: Record<ProfileStatus, string> = {
  active: "bg-green-100 text-green-800",
  under_review: "bg-amber-100 text-amber-800",
  archived: "bg-gray-100 text-gray-700",
};

const SEED: SensoryProfile[] = [
  {
    id: "sp1", youngPersonId: "yp_alex", status: "active",
    assessedBy: "staff_anna", assessmentDate: d(-60), reviewDate: d(30),
    diagnosis: ["ADHD", "Sensory Processing Differences"],
    entries: [
      { domain: "auditory", responsePattern: "hyper_responsive", triggers: ["Sudden loud noises", "Multiple people talking", "Fire alarm drills", "TV at high volume"], calming: ["Noise-cancelling headphones", "Quiet space in bedroom", "Calm music"], intensity: 4, notes: "Covers ears and becomes distressed with unexpected loud sounds. Needs advance warning for fire drills." },
      { domain: "tactile", responsePattern: "seeking", triggers: [], calming: ["Weighted blanket at bedtime", "Fidget toys during homework", "Textured cushions"], intensity: 3, notes: "Seeks deep pressure. Responds well to firm hugs (when consented). Fidgets constantly — this is self-regulation, not misbehaviour." },
      { domain: "visual", responsePattern: "hyper_responsive", triggers: ["Bright fluorescent lights", "Flickering screens", "Busy visual environments"], calming: ["Dimmer lighting in bedroom", "Blue-light filter on devices", "Sunglasses outdoors"], intensity: 3, notes: "Finds bright lights overwhelming. Bedroom has dimmable lighting." },
      { domain: "proprioceptive", responsePattern: "seeking", triggers: [], calming: ["Trampolining", "Carrying heavy bags", "Wrestling/rough play (supervised)", "Gym workouts"], intensity: 4, notes: "Needs regular proprioceptive input through the day. Exercise before homework significantly improves focus." },
      { domain: "gustatory", responsePattern: "hyper_responsive", triggers: ["Strong flavours", "Mixed textures in food", "Spicy food"], calming: ["Plain foods available", "Separate food on plate", "Familiar menu items"], intensity: 3, notes: "Prefers bland foods. Will try new things if not pressured. No mixed-texture meals." },
      { domain: "interoceptive", responsePattern: "hypo_responsive", triggers: [], calming: ["Regular meal/drink reminders", "Visual schedule for meals", "Body check-in prompts"], intensity: 3, notes: "Doesn't always recognise hunger/thirst signals. Needs prompting for meals and hydration." },
    ],
    strategies: [
      { id: "s1", context: "Mealtimes", strategy: "Serve food components separately on plate. Offer familiar options alongside new foods without pressure. Allow Alex to leave table briefly if overwhelmed.", effectivenessRating: 4, addedBy: "staff_anna", addedDate: d(-55) },
      { id: "s2", context: "Homework", strategy: "Provide fidget toy and weighted lap pad. Allow movement breaks every 20 minutes. Complete 30-minute exercise before starting.", effectivenessRating: 5, addedBy: "staff_edward", addedDate: d(-50) },
      { id: "s3", context: "Bedtime", strategy: "Weighted blanket, dim lighting, 15 minutes of calm music. No screens 30 minutes before bed. Consistent routine essential.", effectivenessRating: 4, addedBy: "staff_anna", addedDate: d(-55) },
      { id: "s4", context: "Fire drills", strategy: "Give 2-minute warning. Provide ear defenders. Key worker stays alongside. Debrief afterwards.", effectivenessRating: 5, addedBy: "staff_darren", addedDate: d(-45) },
      { id: "s5", context: "Outings", strategy: "Plan quiet rest points during trips. Carry sensory kit (headphones, fidgets, sunglasses). Avoid peak-time shopping. Alex chooses seating position.", effectivenessRating: 4, addedBy: "staff_anna", addedDate: d(-40) },
    ],
    environmentalAdaptations: [
      "Dimmable lighting installed in bedroom",
      "Weighted blanket and lap pad provided",
      "Fidget toys available in communal areas and bedroom",
      "Noise-cancelling headphones (personal and spare set)",
      "Quiet retreat space identified (reading nook in lounge)",
      "Textured cushions on bedroom chair",
    ],
    communicationPreferences: [
      "Give advance warning of changes — minimum 30 minutes",
      "Use calm, steady tone — avoid raising voice",
      "One instruction at a time — allow processing time",
      "Visual schedule preferred alongside verbal",
      "Acknowledge sensory needs — never dismiss as 'fussing'",
    ],
    childViews: "Alex says the weighted blanket is 'the best thing ever' and likes having headphones for when it gets too noisy. Doesn't like being told to 'calm down' — prefers people to help find a quiet space. Wants staff to understand that fidgeting helps concentrate, not the opposite.",
    parentCarerViews: "",
    professionalInput: "OT assessment (Oct 2024) confirmed sensory processing differences consistent with ADHD profile. Recommended proprioceptive activities throughout the day and environmental modifications. Review in 6 months.",
    notes: "Profile developed collaboratively with Alex. Shared with school SENCO. Updated after OT assessment.",
  },
  {
    id: "sp2", youngPersonId: "yp_jordan", status: "active",
    assessedBy: "staff_chervelle", assessmentDate: d(-30), reviewDate: d(60),
    diagnosis: ["ASD (Level 1)", "Anxiety"],
    entries: [
      { domain: "auditory", responsePattern: "hyper_responsive", triggers: ["Background noise in busy rooms", "Cutlery on plates", "Hand dryers in public toilets", "Unexpected doorbells"], calming: ["Ear defenders", "Listening to own music", "Warning before noisy activities"], intensity: 5, notes: "Auditory sensitivity is the primary sensory challenge. Can trigger meltdowns if sustained." },
      { domain: "tactile", responsePattern: "hyper_responsive", triggers: ["Clothing labels/seams", "Unexpected touch from others", "Wet/slimy textures", "New fabrics"], calming: ["Soft cotton clothing only", "Seamless socks", "Labels removed from all clothing", "Personal space respected"], intensity: 4, notes: "All clothing labels must be removed. Only wears soft cotton. Physical contact must be initiated by Jordan." },
      { domain: "olfactory", responsePattern: "hyper_responsive", triggers: ["Strong cooking smells", "Cleaning products", "Perfume/aftershave", "Air fresheners"], calming: ["Good ventilation during cooking", "Unscented products used in Jordan's areas", "Open windows"], intensity: 4, notes: "Staff should avoid wearing strong fragrances around Jordan. Cleaning near Jordan's room done when they're out." },
      { domain: "visual", responsePattern: "typical", triggers: [], calming: [], intensity: 1, notes: "No significant visual sensitivities identified." },
      { domain: "vestibular", responsePattern: "hypo_responsive", triggers: [], calming: ["Rocking chair", "Swing in garden", "Spinning activities"], intensity: 3, notes: "Enjoys gentle rocking and swinging — finds it calming. Rocking chair in bedroom." },
      { domain: "proprioceptive", responsePattern: "seeking", triggers: [], calming: ["Deep pressure from weighted items", "Art activities (pressing/sculpting)", "Digging in garden"], intensity: 3, notes: "Clay modelling and gardening provide good proprioceptive input." },
    ],
    strategies: [
      { id: "s6", context: "Mornings", strategy: "Allow 15 minutes extra for dressing due to clothing sensitivities. Lay out pre-approved clothing the night before. Breakfast in quieter kitchen area if dining room is busy.", effectivenessRating: 5, addedBy: "staff_chervelle", addedDate: d(-28) },
      { id: "s7", context: "Social times", strategy: "Offer art/craft activity as social buffer. Don't require direct eye contact. Allow Jordan to join and leave group activities freely. Quiet card/signal to indicate needing a break.", effectivenessRating: 4, addedBy: "staff_chervelle", addedDate: d(-28) },
      { id: "s8", context: "Transitions", strategy: "5-minute, 2-minute, and 'now' warnings. Visual timer for timed activities. Transition objects (sketch pad) for moving between spaces. No rushed transitions.", effectivenessRating: 5, addedBy: "staff_ryan", addedDate: d(-25) },
      { id: "s9", context: "Hygiene", strategy: "Same brand of unscented soap/shampoo. Cotton towels only. Temperature control important — prefers warm not hot. Private bathroom time without rushing.", effectivenessRating: 4, addedBy: "staff_chervelle", addedDate: d(-28) },
    ],
    environmentalAdaptations: [
      "Rocking chair in bedroom",
      "Labels removed from all purchased clothing",
      "Unscented products only in Jordan's bathroom",
      "Garden swing available for self-regulation",
      "Art supplies always accessible in room",
      "Quiet signal card for staff",
      "Visual schedule board in bedroom",
    ],
    communicationPreferences: [
      "Allow 10-second processing time after questions",
      "Avoid idioms and sarcasm — use literal, clear language",
      "Written instructions alongside verbal where possible",
      "Don't require eye contact",
      "Use Jordan's name at start of sentences to gain attention",
      "Avoid open-ended questions — offer 2-3 choices instead",
    ],
    childViews: "Jordan says the rocking chair is really helpful when feeling worried. Likes that staff ask before touching. Wants people to know that needing quiet isn't being rude — it's 'recharging batteries.' Really enjoys art time because it's quiet and they can control the textures.",
    parentCarerViews: "Birth mum shared that Jordan has always been sensitive to sounds and textures. Used to cut labels out of school uniform from age 3. Always preferred plain food.",
    professionalInput: "CAMHS assessment (Jan 2025) — ASD Level 1 diagnosis. Sensory profile consistent with ASD presentation. Recommend minimal-change approach to routines and sensory environment. OT referral submitted for detailed sensory integration assessment.",
    notes: "Profile to be shared with school. OT assessment pending — will update profile once received. Jordan contributed artwork to illustrate their sensory world.",
  },
  {
    id: "sp3", youngPersonId: "yp_casey", status: "under_review",
    assessedBy: "staff_anna", assessmentDate: d(-90), reviewDate: d(-5),
    diagnosis: ["Possible sensory processing difficulties (under assessment)"],
    entries: [
      { domain: "auditory", responsePattern: "hypo_responsive", triggers: [], calming: [], intensity: 2, notes: "Sometimes doesn't respond to name being called. May need visual or tactile prompt to gain attention. Not a hearing issue — audiometry normal." },
      { domain: "tactile", responsePattern: "seeking", triggers: [], calming: ["Soft blanket", "Playdough/slime", "Warm baths"], intensity: 3, notes: "Loves soft textures. Seeks out tactile experiences. Enjoys messy play." },
      { domain: "vestibular", responsePattern: "seeking", triggers: [], calming: ["Running", "Climbing", "Spinning on office chair"], intensity: 3, notes: "Very active — needs lots of movement. Channel through sports and outdoor activities." },
      { domain: "visual", responsePattern: "typical", triggers: [], calming: [], intensity: 1, notes: "No notable visual sensitivities." },
      { domain: "proprioceptive", responsePattern: "seeking", triggers: [], calming: ["Bear hugs (when offered)", "Jumping on trampoline", "Carrying groceries", "Swimming"], intensity: 3, notes: "Gravitates toward heavy work activities. Responds well to structured exercise." },
    ],
    strategies: [
      { id: "s10", context: "Attention", strategy: "Use Casey's name + gentle touch on shoulder (with consent) to get attention. Stand in line of sight. Reduce background noise when giving instructions.", effectivenessRating: 4, addedBy: "staff_anna", addedDate: d(-85) },
      { id: "s11", context: "Calming", strategy: "Warm bath with bubbles. Soft blanket wrap on sofa. Reading together. Avoid overstimulating activities 1 hour before bed.", effectivenessRating: 4, addedBy: "staff_anna", addedDate: d(-85) },
      { id: "s12", context: "Energy management", strategy: "Morning outdoor activity (run/cycle). After-school sport or swimming. Trampoline breaks between homework tasks. Structured active play before quiet time.", effectivenessRating: 5, addedBy: "staff_edward", addedDate: d(-80) },
    ],
    environmentalAdaptations: [
      "Soft blankets available in lounge and bedroom",
      "Trampoline in garden accessible daily",
      "Sensory box with slime, playdough, stress balls",
      "Good lighting — no flickering bulbs",
    ],
    communicationPreferences: [
      "Get eye contact before speaking",
      "Use short, clear sentences",
      "Pair verbal with visual cues",
      "Check understanding by asking Casey to repeat back",
    ],
    childViews: "Casey loves being active and says running makes everything feel better. Likes soft things — especially the fluffy blanket. Sometimes doesn't hear people but 'it's not on purpose.'",
    parentCarerViews: "",
    professionalInput: "School SENCO has raised possible sensory processing concerns. Referral to OT for formal assessment submitted. Awaiting appointment.",
    notes: "Profile due for review — OT assessment still pending. Current strategies working well. Update once formal assessment completed.",
  },
];

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string; domain: string; responsePattern: string;
  intensity: string; triggers: string; calming: string;
  diagnosis: string; status: string; assessedBy: string;
  assessmentDate: string; reviewDate: string;
  strategies: string; environmentalAdaptations: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",   accessor: (r: FlatRow) => r.youngPerson },
  { header: "Domain",         accessor: (r: FlatRow) => r.domain },
  { header: "Response Pattern",accessor: (r: FlatRow) => r.responsePattern },
  { header: "Intensity (1-5)",accessor: (r: FlatRow) => r.intensity },
  { header: "Triggers",       accessor: (r: FlatRow) => r.triggers },
  { header: "Calming",        accessor: (r: FlatRow) => r.calming },
  { header: "Diagnosis",      accessor: (r: FlatRow) => r.diagnosis },
  { header: "Status",         accessor: (r: FlatRow) => r.status },
  { header: "Assessed By",    accessor: (r: FlatRow) => r.assessedBy },
  { header: "Assessment Date",accessor: (r: FlatRow) => r.assessmentDate },
  { header: "Review Date",    accessor: (r: FlatRow) => r.reviewDate },
  { header: "Strategies",     accessor: (r: FlatRow) => r.strategies },
  { header: "Env. Adaptations",accessor: (r: FlatRow) => r.environmentalAdaptations },
  { header: "Notes",          accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function SensoryProfilesPage() {
  const [data] = useState<SensoryProfile[]>(SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const active = data.filter((r) => r.status === "active").length;
    const underReview = data.filter((r) => r.status === "under_review").length;
    const hyperDomains = data.reduce((s, r) => s + r.entries.filter((e) => e.responsePattern === "hyper_responsive").length, 0);
    const totalStrategies = data.reduce((s, r) => s + r.strategies.length, 0);
    return { active, underReview, hyperDomains, totalStrategies };
  }, [data]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.youngPersonId).toLowerCase().includes(q) ||
        r.diagnosis.some((dx) => dx.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    const out = [...list];
    switch (sortBy) {
      case "name":   out.sort((a, b) => getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId))); break;
      case "review": out.sort((a, b) => a.reviewDate.localeCompare(b.reviewDate)); break;
      case "domains": out.sort((a, b) => b.entries.length - a.entries.length); break;
    }
    return out;
  }, [data, search, filterStatus, sortBy]);

  /* ── export data ──────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    data.flatMap((r) =>
      r.entries.map((e) => ({
        youngPerson: getYPName(r.youngPersonId),
        domain: DOMAIN_LABELS[e.domain],
        responsePattern: RESPONSE_LABELS[e.responsePattern],
        intensity: `${e.intensity}/5`,
        triggers: e.triggers.join("; "),
        calming: e.calming.join("; "),
        diagnosis: r.diagnosis.join(", "),
        status: STATUS_LABELS[r.status],
        assessedBy: getStaffName(r.assessedBy),
        assessmentDate: r.assessmentDate,
        reviewDate: r.reviewDate,
        strategies: r.strategies.map((s) => `${s.context}: ${s.strategy}`).join(" | "),
        environmentalAdaptations: r.environmentalAdaptations.join("; "),
        notes: e.notes,
      }))
    ), [data]);

  /* intensity bar colour */
  const intensityColour = (n: number) => n >= 4 ? "bg-red-500" : n >= 3 ? "bg-amber-500" : "bg-green-500";

  return (
    <PageShell
      title="Sensory Profiles"
      subtitle="Individual sensory assessments, triggers, calming strategies and environmental adaptations"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Sensory Profiles" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="sensory-profiles" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Profile
          </button>
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Profiles", value: stats.active, icon: Ear, colour: "text-blue-600" },
          { label: "Under Review", value: stats.underReview, icon: AlertTriangle, colour: stats.underReview > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Hyper-responsive Areas", value: stats.hyperDomains, icon: Volume2, colour: "text-red-600" },
          { label: "Total Strategies", value: stats.totalStrategies, icon: Hand, colour: "text-green-600" },
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

      {/* ── per-child summary ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {data.map((r) => {
          const hyper = r.entries.filter((e) => e.responsePattern === "hyper_responsive").length;
          const seeking = r.entries.filter((e) => e.responsePattern === "seeking").length;
          return (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{getYPName(r.youngPersonId)}</h3>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{STATUS_LABELS[r.status]}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{r.diagnosis.join(", ")}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {r.entries.map((e) => (
                  <span key={e.domain} className={cn("px-2 py-0.5 rounded text-xs font-medium", RESPONSE_COLOURS[e.responsePattern])} title={RESPONSE_LABELS[e.responsePattern]}>
                    {DOMAIN_ICONS[e.domain]} {DOMAIN_LABELS[e.domain].slice(0, 5)}
                  </span>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
                <div>Hyper: <span className="font-medium text-red-600">{hyper}</span></div>
                <div>Seeking: <span className="font-medium text-amber-600">{seeking}</span></div>
                <div>Strategies: <span className="font-medium text-green-600">{r.strategies.length}</span></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Review: {r.reviewDate <= d(0) ? <span className="text-red-600 font-medium">Overdue</span> : r.reviewDate}</p>
            </div>
          );
        })}
      </div>

      {/* ── alert for overdue reviews ──────────────────────────────── */}
      {data.some((r) => r.reviewDate <= d(0) && r.status !== "archived") && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Sensory Profile Review Overdue</p>
            <p className="text-sm text-amber-700">One or more profiles are past their review date. Please review and update to ensure strategies remain effective.</p>
          </div>
        </div>
      )}

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="profiles-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search children or diagnoses…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="review">Review Due</SelectItem>
              <SelectItem value="domains">Most Domains</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(r.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Ear className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getYPName(r.youngPersonId)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[r.status])}>{STATUS_LABELS[r.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{r.diagnosis.join(", ")} · {r.entries.length} domains assessed · {r.strategies.length} strategies</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* assessment info */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Assessed by:</span> <span className="font-medium">{getStaffName(r.assessedBy)}</span></div>
                    <div><span className="text-gray-500">Date:</span> <span className="font-medium">{r.assessmentDate}</span></div>
                    <div><span className="text-gray-500">Review:</span> <span className={cn("font-medium", r.reviewDate <= d(0) ? "text-red-600" : "")}>{r.reviewDate}</span></div>
                    <div><span className="text-gray-500">Diagnosis:</span> <span className="font-medium">{r.diagnosis.join(", ")}</span></div>
                  </div>

                  {/* sensory domain cards */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Sensory Domains</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {r.entries.map((e) => (
                        <div key={e.domain} className="rounded-md border p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{DOMAIN_ICONS[e.domain]}</span>
                              <span className="font-medium text-sm">{DOMAIN_LABELS[e.domain]}</span>
                            </div>
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", RESPONSE_COLOURS[e.responsePattern])}>{RESPONSE_LABELS[e.responsePattern]}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-500">Intensity:</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                              <div className={cn("h-2 rounded-full", intensityColour(e.intensity))} style={{ width: `${(e.intensity / 5) * 100}%` }} />
                            </div>
                            <span className="text-xs font-medium">{e.intensity}/5</span>
                          </div>
                          {e.triggers.length > 0 && (
                            <div className="mb-1">
                              <span className="text-xs font-medium text-red-700">Triggers:</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {e.triggers.map((t, i) => <span key={i} className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-xs">{t}</span>)}
                              </div>
                            </div>
                          )}
                          {e.calming.length > 0 && (
                            <div className="mb-1">
                              <span className="text-xs font-medium text-green-700">Calming:</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {e.calming.map((c, i) => <span key={i} className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs">{c}</span>)}
                              </div>
                            </div>
                          )}
                          {e.notes && <p className="text-xs text-gray-600 mt-1 italic">{e.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* strategies */}
                  {r.strategies.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">Strategies by Context</h4>
                      <div className="space-y-2">
                        {r.strategies.map((s) => (
                          <div key={s.id} className="rounded-md bg-gray-50 p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{s.context}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Effectiveness:</span>
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map((n) => (
                                    <div key={n} className={cn("h-2 w-4 rounded-sm", n <= s.effectivenessRating ? "bg-green-500" : "bg-gray-200")} />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{s.strategy}</p>
                            <p className="text-xs text-gray-400 mt-1">{getStaffName(s.addedBy)} · {s.addedDate}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* environmental adaptations */}
                  {r.environmentalAdaptations.length > 0 && (
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1">Environmental Adaptations</h4>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                        {r.environmentalAdaptations.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* communication preferences */}
                  {r.communicationPreferences.length > 0 && (
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1">Communication Preferences</h4>
                      <ul className="list-disc list-inside text-sm text-purple-800 space-y-0.5">
                        {r.communicationPreferences.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* child's view */}
                  {r.childViews && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Views</h4>
                      <p className="text-sm text-pink-800">{r.childViews}</p>
                    </div>
                  )}

                  {/* parent/carer views */}
                  {r.parentCarerViews && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Parent / Carer Views</h4>
                      <p className="text-sm">{r.parentCarerViews}</p>
                    </div>
                  )}

                  {/* professional input */}
                  {r.professionalInput && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Professional Input</h4>
                      <p className="text-sm">{r.professionalInput}</p>
                    </div>
                  )}

                  {/* notes */}
                  {r.notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4>
                      <p className="text-sm text-gray-700">{r.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>SEND &amp; Sensory Needs:</strong> Children with sensory processing differences must have individualised profiles that inform daily care. Strategies should be developed collaboratively with the child, regularly reviewed, and shared with all staff. Environmental adaptations must be implemented promptly. Sensory needs should never be treated as behavioural challenges.
      </div>

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Sensory Profile</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{["yp_alex","yp_jordan","yp_casey"].map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Diagnosis / Conditions</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. ASD, ADHD, SPD" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Assessment Date</label>
                <input type="date" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Review Date</label>
                <input type="date" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Initial Notes</label>
              <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Key observations and initial sensory presentation…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Create Profile</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
