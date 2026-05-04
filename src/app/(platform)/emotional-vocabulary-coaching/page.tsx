"use client";

import { useState, useMemo } from "react";
import {
  MessageCircle,
  Heart,
  Brain,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Star,
  Smile,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type Framework =
  | "Zones of Regulation"
  | "Feelings Wheel (Plutchik)"
  | "RULER"
  | "How Are You Feeling Today"
  | "Bespoke"
  | "Mixed";

interface Breakthrough {
  date: string;
  description: string;
}

interface VocabRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  startingPosition: string;
  feelingsRecognised: string[];
  feelingsLearningNow: string[];
  confusionsCommon: string[];
  toolsInUse: string[];
  framework: Framework;
  breakthroughs: Breakthrough[];
  prefersSpoken: boolean;
  prefersWritten: boolean;
  prefersVisual: boolean;
  prefersBodyMapping: boolean;
  staffPhrasingTips: string[];
  childVoice: string;
  staffObservation: string;
  nextStep: string;
  reviewDate: string;
  keyWorker: string;
}

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const FRAMEWORK_COLOURS: Record<Framework, string> = {
  "Zones of Regulation": "bg-sky-100 text-sky-800",
  "Feelings Wheel (Plutchik)": "bg-violet-100 text-violet-800",
  RULER: "bg-teal-100 text-teal-800",
  "How Are You Feeling Today": "bg-amber-100 text-amber-800",
  Bespoke: "bg-pink-100 text-pink-800",
  Mixed: "bg-indigo-100 text-indigo-800",
};

/* ── seed ──────────────────────────────────────────────────────────────── */

const SEED: VocabRecord[] = [
  {
    id: "ev1",
    youngPerson: "yp_jordan",
    recordedDate: d(-12),
    startingPosition:
      "Jordan arrived already comfortable naming positive emotions (happy, excited, proud) and the big negative ones (angry, sad). Coaching now focuses on emotional nuance — distinguishing the family of feelings beneath each headline word, especially the difference between 'frustrated' and 'angry', and between 'disappointed' and 'sad'.",
    feelingsRecognised: [
      "happy",
      "excited",
      "proud",
      "angry",
      "sad",
      "scared",
      "nervous",
      "calm",
      "bored",
      "loved",
    ],
    feelingsLearningNow: [
      "frustrated (vs angry)",
      "disappointed (vs sad)",
      "homesick",
      "jealous",
      "embarrassed",
      "relieved",
    ],
    confusionsCommon: [
      "Names anger when the underlying feeling is frustration with self",
      "Defaults to 'sad' for any low mood — disappointed, lonely or homesick all collapse into 'sad'",
      "Confuses 'nervous' and 'excited' before football matches",
    ],
    toolsInUse: [
      "Plutchik feelings wheel laminated in keyworker session pack",
      "Football analogies: 'when the ref calls a foul vs when your team loses 5-0'",
      "Daily two-word check-in at handover ('one body word, one heart word')",
      "Voice notes on phone when too much to speak in person",
    ],
    framework: "Feelings Wheel (Plutchik)",
    breakthroughs: [
      {
        date: d(-30),
        description:
          "First spontaneous use of 'frustrated' — described losing at FIFA without using the word 'angry' for the first time.",
      },
      {
        date: d(-9),
        description:
          "Named 'homesick' after a contact call with grandma. Said 'I think it's not just sad, it's homesick — they're different.'",
      },
    ],
    prefersSpoken: true,
    prefersWritten: false,
    prefersVisual: true,
    prefersBodyMapping: false,
    staffPhrasingTips: [
      "Offer two options rather than open questions: 'frustrated or angry?' works better than 'how do you feel?'",
      "Use the football frame — Jordan engages when feelings are mapped to match scenarios",
      "Reflect, don't label: 'sounds like that was disappointing' rather than 'you must be angry'",
      "Avoid 'are you ok?' — Jordan always says yes. Try 'one word for how today landed?' instead",
    ],
    childVoice:
      "Sometimes I say angry because it's the easiest word, but it's not always right. The wheel helps because I can point to what's actually going on without having to find the word.",
    staffObservation:
      "Jordan's emotional vocabulary has visibly broadened over the last 6 weeks. Still defaults under stress but now self-corrects within a few minutes. Spoken work via the wheel is more productive than written exercises.",
    nextStep:
      "Introduce secondary emotions on the wheel (contempt, awe, remorse) over the next month. Begin pairing emotion words with body sensations to build interoceptive awareness.",
    reviewDate: d(21),
    keyWorker: "staff_anna",
  },
  {
    id: "ev2",
    youngPerson: "yp_alex",
    recordedDate: d(-18),
    startingPosition:
      "Alex arrived with a vocabulary effectively limited to two words: 'angry' and 'fine'. Early-life relational trauma had collapsed the emotional spectrum into a binary of activation versus shutdown. Coaching has been slow, careful, and child-led — building language as a way of organising experience that previously had no name.",
    feelingsRecognised: [
      "angry",
      "fine",
      "tired",
      "bored",
      "annoyed",
      "happy (rare)",
      "alone",
      "frustrated",
    ],
    feelingsLearningNow: [
      "hurt (vs angry)",
      "lonely (vs alone)",
      "hopeful",
      "betrayed",
      "ashamed",
      "tender",
      "grateful",
    ],
    confusionsCommon: [
      "'Angry' is the umbrella for hurt, scared, ashamed and disappointed",
      "'Fine' covers everything from genuinely settled to deeply dissociated",
      "Cannot yet distinguish 'lonely' from 'alone' — wants to but can't always feel the difference",
      "Hope feels unsafe — Alex can name it but flinches from sitting with it",
    ],
    toolsInUse: [
      "Poetry notebook (private, not shared with staff unless Alex chooses)",
      "Spotify playlist labelling — naming the feeling in each track",
      "Written sentence stems: 'today I was the kind of tired that...'",
      "Weekly creative writing slot with key worker — 20 minutes, no pressure to share",
    ],
    framework: "RULER",
    breakthroughs: [
      {
        date: d(-60),
        description:
          "First time used the word 'hurt' instead of 'angry' — about a missed contact with birth dad.",
      },
      {
        date: d(-22),
        description:
          "Wrote a poem in keyworker session that ended with 'betrayed'. First time naming this about birth family rejection. Asked if the word was 'allowed'. Significant.",
      },
      {
        date: d(-4),
        description:
          "Used 'hopeful' unprompted about college — flinched immediately afterwards but did not retract the word.",
      },
    ],
    prefersSpoken: false,
    prefersWritten: true,
    prefersVisual: false,
    prefersBodyMapping: false,
    staffPhrasingTips: [
      "Never push for verbal naming — Alex needs writing as the route in",
      "Validate without amplifying: 'that's a precise word' rather than 'wow, brilliant!'",
      "Don't read poetry unless explicitly invited — the offering is the point, not the content",
      "Use 'I wonder' framing: 'I wonder if there's a sharper word than angry for that one'",
      "When Alex says 'fine', repeat back gently with a question mark — 'fine?' Often opens space",
    ],
    childVoice:
      "I never had words for any of it. I just had angry and fine. The poems are the only way I can put a feeling somewhere outside myself. Sometimes I write a word and then I know that's what it was the whole time.",
    staffObservation:
      "Alex's progress is significant but fragile. Each new word is hard-won and protected. Naming 'betrayed' was a watershed — staff team agreed unanimously to follow Alex's pace and not chase the breakthrough. Written modality is unambiguously the channel.",
    nextStep:
      "Continue weekly writing slot. Introduce — only if Alex initiates — the language of grief (mourning what was lost, not just what hurt). Coordinate with CAMHS therapist on shared vocabulary before next session.",
    reviewDate: d(28),
    keyWorker: "staff_anna",
  },
  {
    id: "ev3",
    youngPerson: "yp_casey",
    recordedDate: d(-7),
    startingPosition:
      "Casey is at the foundational level of emotional literacy. The four basic feelings — happy, sad, angry, scared — are securely named. Anything more granular still resolves to 'good' or 'bad'. Zones of Regulation has been the right entry point because it is visual, colour-coded, and doesn't require reading fluency.",
    feelingsRecognised: ["happy", "sad", "angry", "scared", "tired", "good", "bad"],
    feelingsLearningNow: [
      "worried (vs scared)",
      "anxious",
      "embarrassed",
      "proud",
      "overwhelmed",
      "calm",
      "tummy feeling",
    ],
    confusionsCommon: [
      "'Bad' covers worried, embarrassed, overwhelmed and ashamed all at once",
      "'Tummy hurts' often means worried or anxious, not physical pain",
      "'Cross' and 'angry' used interchangeably; doesn't yet distinguish irritation",
      "Cannot yet name 'proud' — describes it as 'happy but bigger'",
    ],
    toolsInUse: [
      "Zones of Regulation poster on bedroom door (Blue / Green / Yellow / Red)",
      "How Are You Feeling Today fridge magnets for daily check-in",
      "Body map outline coloured in at bedtime to locate sensations",
      "Worry monster soft toy for posting written or drawn worries",
      "Picture cards (no text) for the new words being learned",
    ],
    framework: "Zones of Regulation",
    breakthroughs: [
      {
        date: d(-45),
        description:
          "First independent use of the Zones poster to ask for help — pointed at Yellow and said 'I'm here.' Did not need to explain why. Huge for Casey.",
      },
      {
        date: d(-15),
        description:
          "Used 'overwhelmed' instead of 'bad' after a busy school day. Body map showed feelings in chest and head, not stomach. Significant interoceptive moment.",
      },
    ],
    prefersSpoken: false,
    prefersWritten: false,
    prefersVisual: true,
    prefersBodyMapping: true,
    staffPhrasingTips: [
      "Always offer the visual first — Zones poster, picture cards, or body map. Words come second",
      "Ask 'where in your body?' before 'what are you feeling?'",
      "Keep new vocabulary to one or two words per week — don't overload",
      "Repeat the new word back into Casey's day naturally: 'oh that sounds worried, not scared'",
      "Praise the noticing, not the naming: 'good spotting' rather than 'well done for using that word'",
    ],
    childVoice:
      "The colours help because I don't have to find the word first. I can just point. And the tummy thing — sometimes the tummy is the worry, it's not actually my tummy. That's a new thing.",
    staffObservation:
      "Casey is making steady, age-appropriate progress on a foundational vocabulary that should arguably have been built years earlier. Zones of Regulation is doing the heavy lifting. Body mapping has been unexpectedly powerful — Casey makes the somatic-emotional link more readily than the verbal one.",
    nextStep:
      "Introduce 'proud' explicitly with concrete examples (after spelling test, after helping at dinner). Begin a feelings diary with stickers, not writing. Liaise with school SENCO on shared vocabulary so Casey hears the same words in both settings.",
    reviewDate: d(14),
    keyWorker: "staff_chervelle",
  },
];

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string;
  framework: string;
  recordedDate: string;
  reviewDate: string;
  keyWorker: string;
  feelingsRecognised: string;
  feelingsLearningNow: string;
  confusionsCommon: string;
  toolsInUse: string;
  modalities: string;
  staffPhrasingTips: string;
  breakthroughCount: number;
  childVoice: string;
  staffObservation: string;
  nextStep: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",          accessor: (r: FlatRow) => r.youngPerson },
  { header: "Framework",             accessor: (r: FlatRow) => r.framework },
  { header: "Recorded Date",         accessor: (r: FlatRow) => r.recordedDate },
  { header: "Review Date",           accessor: (r: FlatRow) => r.reviewDate },
  { header: "Key Worker",            accessor: (r: FlatRow) => r.keyWorker },
  { header: "Feelings Recognised",   accessor: (r: FlatRow) => r.feelingsRecognised },
  { header: "Feelings Learning",     accessor: (r: FlatRow) => r.feelingsLearningNow },
  { header: "Common Confusions",     accessor: (r: FlatRow) => r.confusionsCommon },
  { header: "Tools In Use",          accessor: (r: FlatRow) => r.toolsInUse },
  { header: "Modalities",            accessor: (r: FlatRow) => r.modalities },
  { header: "Staff Phrasing Tips",   accessor: (r: FlatRow) => r.staffPhrasingTips },
  { header: "Breakthroughs (count)", accessor: (r: FlatRow) => r.breakthroughCount },
  { header: "Child Voice",           accessor: (r: FlatRow) => r.childVoice },
  { header: "Staff Observation",     accessor: (r: FlatRow) => r.staffObservation },
  { header: "Next Step",             accessor: (r: FlatRow) => r.nextStep },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function EmotionalVocabularyCoachingPage() {
  const [data] = useState<VocabRecord[]>(SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterFramework, setFilterFramework] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const toggle = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const modalitiesFor = (r: VocabRecord) => {
    const out: string[] = [];
    if (r.prefersSpoken) out.push("Spoken");
    if (r.prefersWritten) out.push("Written");
    if (r.prefersVisual) out.push("Visual");
    if (r.prefersBodyMapping) out.push("Body mapping");
    return out;
  };

  /* ── stats ───────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const inCoaching = data.length;
    const totalRecognised = data.reduce(
      (s, r) => s + r.feelingsRecognised.length,
      0,
    );
    const ninetyDaysAgo = d(-90);
    const breakthroughsQuarter = data.reduce(
      (s, r) =>
        s + r.breakthroughs.filter((b) => b.date >= ninetyDaysAgo).length,
      0,
    );
    const reviewsDue = data.filter((r) => r.reviewDate <= d(14)).length;
    return { inCoaching, totalRecognised, breakthroughsQuarter, reviewsDue };
  }, [data]);

  /* ── filtered / sorted ───────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.youngPerson).toLowerCase().includes(q) ||
          r.framework.toLowerCase().includes(q) ||
          r.feelingsRecognised.some((f) => f.toLowerCase().includes(q)) ||
          r.feelingsLearningNow.some((f) => f.toLowerCase().includes(q)),
      );
    }
    if (filterFramework !== "all")
      list = list.filter((r) => r.framework === filterFramework);
    const out = [...list];
    switch (sortBy) {
      case "name":
        out.sort((a, b) =>
          getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson)),
        );
        break;
      case "review":
        out.sort((a, b) => a.reviewDate.localeCompare(b.reviewDate));
        break;
      case "vocabulary":
        out.sort(
          (a, b) =>
            b.feelingsRecognised.length - a.feelingsRecognised.length,
        );
        break;
      case "breakthroughs":
        out.sort((a, b) => b.breakthroughs.length - a.breakthroughs.length);
        break;
    }
    return out;
  }, [data, search, filterFramework, sortBy]);

  /* ── export ──────────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(
    () =>
      data.map((r) => ({
        youngPerson: getYPName(r.youngPerson),
        framework: r.framework,
        recordedDate: r.recordedDate,
        reviewDate: r.reviewDate,
        keyWorker: getStaffName(r.keyWorker),
        feelingsRecognised: r.feelingsRecognised.join("; "),
        feelingsLearningNow: r.feelingsLearningNow.join("; "),
        confusionsCommon: r.confusionsCommon.join("; "),
        toolsInUse: r.toolsInUse.join("; "),
        modalities: modalitiesFor(r).join("; "),
        staffPhrasingTips: r.staffPhrasingTips.join("; "),
        breakthroughCount: r.breakthroughs.length,
        childVoice: r.childVoice,
        staffObservation: r.staffObservation,
        nextStep: r.nextStep,
      })),
    [data],
  );

  return (
    <PageShell
      title="Emotional Vocabulary Coaching"
      subtitle="Per-child language work — what feelings each young person can name, what they confuse, the tools and frameworks in use, and the breakthroughs that change everything"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Emotional Vocabulary Coaching" />
          <ExportButton
            data={exportData}
            columns={EXPORT_COLS}
            filename="emotional-vocabulary-coaching"
          />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Children in Coaching",
            value: stats.inCoaching,
            icon: MessageCircle,
            colour: "text-violet-600",
          },
          {
            label: "Feelings Recognised (total)",
            value: stats.totalRecognised,
            icon: Smile,
            colour: "text-teal-600",
          },
          {
            label: "Breakthroughs (90 days)",
            value: stats.breakthroughsQuarter,
            icon: Star,
            colour:
              stats.breakthroughsQuarter > 0
                ? "text-amber-600"
                : "text-gray-400",
          },
          {
            label: "Reviews Due (14 d)",
            value: stats.reviewsDue,
            icon: Brain,
            colour: stats.reviewsDue > 0 ? "text-rose-600" : "text-gray-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border bg-white p-4 flex items-center gap-3"
          >
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search children, frameworks or feeling words…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterFramework} onValueChange={setFilterFramework}>
          <SelectTrigger className="w-[200px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frameworks</SelectItem>
            {(Object.keys(FRAMEWORK_COLOURS) as Framework[]).map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="review">Review Due</SelectItem>
              <SelectItem value="vocabulary">Vocabulary Size</SelectItem>
              <SelectItem value="breakthroughs">Breakthroughs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          const modalities = modalitiesFor(r);
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button
                onClick={() => toggle(r.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Heart className="h-4 w-4 text-violet-400" />
                    <h3 className="font-semibold">
                      {getYPName(r.youngPerson)}
                    </h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        FRAMEWORK_COLOURS[r.framework],
                      )}
                    >
                      {r.framework}
                    </span>
                    {modalities.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.feelingsRecognised.length} feelings recognised ·{" "}
                    {r.feelingsLearningNow.length} in progress ·{" "}
                    {r.breakthroughs.length} breakthroughs · key worker{" "}
                    {getStaffName(r.keyWorker)}
                  </p>
                </div>
                {open ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* meta */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Recorded:</span>{" "}
                      <span className="font-medium">{r.recordedDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Review:</span>{" "}
                      <span
                        className={cn(
                          "font-medium",
                          r.reviewDate <= d(0) ? "text-rose-600" : "",
                        )}
                      >
                        {r.reviewDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Key worker:</span>{" "}
                      <span className="font-medium">
                        {getStaffName(r.keyWorker)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Framework:</span>{" "}
                      <span className="font-medium">{r.framework}</span>
                    </div>
                  </div>

                  {/* starting position */}
                  <div className="rounded-md bg-violet-50 border border-violet-200 p-3">
                    <h4 className="text-xs font-semibold text-violet-700 mb-1">
                      Starting Position
                    </h4>
                    <p className="text-sm text-violet-900">
                      {r.startingPosition}
                    </p>
                  </div>

                  {/* feelings recognised + learning */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                      <h4 className="text-xs font-semibold text-teal-700 mb-2">
                        Feelings Recognised ({r.feelingsRecognised.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {r.feelingsRecognised.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-white text-teal-800 border border-teal-200"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-2">
                        Learning Now ({r.feelingsLearningNow.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {r.feelingsLearningNow.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-white text-amber-800 border border-amber-200"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* common confusions */}
                  <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                    <h4 className="text-xs font-semibold text-rose-700 mb-1">
                      Common Confusions
                    </h4>
                    <ul className="list-disc list-inside text-sm text-rose-900 space-y-0.5">
                      {r.confusionsCommon.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  {/* tools */}
                  <div className="rounded-md bg-sky-50 border border-sky-200 p-3">
                    <h4 className="text-xs font-semibold text-sky-700 mb-1">
                      Tools &amp; Visual Aids in Use
                    </h4>
                    <ul className="list-disc list-inside text-sm text-sky-900 space-y-0.5">
                      {r.toolsInUse.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* breakthroughs timeline */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">
                      Breakthroughs
                    </h4>
                    <div className="space-y-2">
                      {r.breakthroughs.map((b, i) => (
                        <div
                          key={i}
                          className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-medium text-amber-700">
                              {b.date}
                            </span>
                          </div>
                          <p className="text-sm text-amber-900 mt-1">
                            {b.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* staff phrasing tips */}
                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">
                      Staff Phrasing Tips
                    </h4>
                    <ul className="list-disc list-inside text-sm text-blue-900 space-y-0.5">
                      {r.staffPhrasingTips.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* child voice */}
                  {r.childVoice && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">
                        Child&apos;s Voice
                      </h4>
                      <p className="text-sm text-pink-900 italic">
                        &ldquo;{r.childVoice}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* staff observation */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">
                      Staff Observation
                    </h4>
                    <p className="text-sm">{r.staffObservation}</p>
                  </div>

                  {/* next step */}
                  <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                    <h4 className="text-xs font-semibold text-emerald-700 mb-1">
                      Next Step
                    </h4>
                    <p className="text-sm text-emerald-900">{r.nextStep}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 mb-6">
        <strong>Emotional Literacy &amp; Regulatory Frameworks:</strong> Many
        children in care arrive with limited emotional vocabulary as a
        consequence of early adversity — words for feelings simply weren&apos;t
        modelled or named. Building this vocabulary is a core therapeutic task
        and underpins regulation, relationships and recovery. This work draws
        on the Zones of Regulation (Leah Kuypers), the RULER approach (Mark
        Brackett, Yale Center for Emotional Intelligence) and Plutchik&apos;s
        wheel of emotions, delivered through trauma-informed practice. It
        supports Quality Standard 8 (Health &amp; Wellbeing) and the child&apos;s
        rights under UNCRC Articles 12 (right to be heard), 13 (freedom of
        expression) and 17 (access to information that supports their
        wellbeing).
      </div>
    </PageShell>
  );
}
