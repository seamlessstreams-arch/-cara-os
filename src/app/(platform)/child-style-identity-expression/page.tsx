"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Shirt,
  Sparkles,
  Heart,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Star,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StyleRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  styleDescriptors: string[];
  identityElements: string[];
  meaningfulItems: { item: string; meaning: string }[];
  culturalDress: string[];
  genderExpressionNotes?: string;
  hairStyleCurrent: string;
  hairJourney: string[];
  accessoriesPreferences: string[];
  shoppingPreferences: string[];
  whatTheyAvoid: string[];
  bodyConfidence: "Building" | "Mixed" | "Stable" | "Strong";
  challengesNoted: string[];
  childVoice: string;
  staffObservation: string;
  flagsForReview: string[];
  reviewDate: string;
  keyWorker: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: StyleRecord[] = [
  {
    id: "sty-001",
    youngPerson: "yp_jordan",
    recordedDate: d(-14),
    styleDescriptors: [
      "Street style with faith touches",
      "Sportswear-led",
      "Crisp and clean",
      "Brand-aware but not flashy",
    ],
    identityElements: [
      "Pakistani heritage (Mum's side)",
      "Caribbean heritage (Dad's side)",
      "Muslim faith — visible at Eid and family events",
      "Football identity (Manchester United)",
      "Older brother to Casey within the home",
    ],
    meaningfulItems: [
      { item: "Pakistani shalwar kameez (cream and gold)", meaning: "Worn for Eid, family events, mosque visits. Mum's choice — a connection across separation." },
      { item: "Adidas Sambas (white/green)", meaning: "First trainers Jordan saved up and chose himself at Oak House. Symbol of belonging." },
      { item: "Black-and-white keffiyeh", meaning: "Worn occasionally as solidarity. Jordan articulate about why — staff supported informed choice." },
      { item: "Gold chain (small, kept in lockable drawer)", meaning: "Gift from Nan-Nan. Worn for special occasions only." },
      { item: "Manchester United away shirt", meaning: "Match-day uniform. Identity anchor." },
    ],
    culturalDress: [
      "Pakistani shalwar kameez (Eid, family events)",
      "Kufi cap (occasional, mosque)",
      "Caribbean colours — small accents (Jamaica wristband, occasional)",
    ],
    genderExpressionNotes: undefined,
    hairStyleCurrent: "Skin fade with textured top",
    hairJourney: [
      "Pre-care: hair often unkempt — no consistent barber",
      "First month at Oak House: mum-recommended barber Imran in Normanton",
      "Now: fade refresh every 3 weeks with Imran — non-negotiable in Jordan's diary",
      "Skincare routine added at age 14 (Jordan researched himself — staff supported)",
    ],
    accessoriesPreferences: [
      "White socks always (specific brand — Nike crew)",
      "Gold chain (special occasions)",
      "Apple Watch (birthday gift, age 14)",
      "Plain black cap (everyday)",
    ],
    shoppingPreferences: [
      "Adidas, Nike, North Face — quality over quantity",
      "Prefers shopping with key worker Anna (knows his taste)",
      "Will not wear fast fashion or knock-off brands",
      "Researches purchases first — informed buyer",
    ],
    whatTheyAvoid: [
      "Bright colours (other than team colours)",
      "Anything that looks 'tried too hard'",
      "Hand-me-downs from staff",
    ],
    bodyConfidence: "Stable",
    challengesNoted: [
      "Sometimes pressure from peers to wear specific brands",
      "Balancing faith expression with peer environment at school",
    ],
    childVoice:
      "I dress how I want to be seen. Tidy, sharp, respectful of where I'm from. The kameez is for Mum and Eid. The fade is for me.",
    staffObservation:
      "Jordan has a clear, confident sense of style that integrates faith, heritage, and modern street culture. Watches Casey's choices with quiet brotherly approval — sometimes offers gentle opinions when asked. Style is an identity anchor, not a fashion statement.",
    flagsForReview: [],
    reviewDate: d(76),
    keyWorker: "staff_anna",
  },
  {
    id: "sty-002",
    youngPerson: "yp_alex",
    recordedDate: d(-21),
    styleDescriptors: [
      "Oversized and gender-neutral",
      "Comfortable and unfussy",
      "Boxing-club practical",
      "Post-coming-out evolution",
    ],
    identityElements: [
      "Came out as non-binary at age 13 (Sept 2025)",
      "Pre-care: forced into feminine presentation by birth mother",
      "Now: actively shaping their own appearance",
      "Boxing club identity — Derby Amateur",
      "Arsenal supporter",
    ],
    meaningfulItems: [
      { item: "Charcoal oversized hoodie (first item bought after coming out)", meaning: "Purchased with key worker Edward. Marker of self-determination. Alex still wears it most weeks." },
      { item: "Boxing gloves (signed by coach)", meaning: "Recognition gift. Identity-shaping moment." },
      { item: "Baggy black jeans (multiple pairs, identical)", meaning: "Alex chose a 'uniform' — reduces decision load and feels right." },
      { item: "Plain black cap", meaning: "Alex's go-to. Anonymity and comfort." },
    ],
    culturalDress: [],
    genderExpressionNotes:
      "Alex uses they/them pronouns and prefers gender-neutral language around clothes ('top' not 'shirt/blouse', 'bottoms' not 'trousers/skirt'). No makeup is a deliberate choice — staff have been briefed never to suggest it. Alex is currently exploring chest binding (researched safely with key worker; GP and CAMHS aware) — first binder bought from a reputable source, used age-appropriately. Alex describes their style as 'just me, finally'.",
    hairStyleCurrent: "Cropped short (self-chosen)",
    hairJourney: [
      "Pre-care: long hair maintained by birth mother — Alex describes this as 'not mine'",
      "Week 2 at Oak House (age 12): asked to cut hair — supported with informed conversation",
      "First short cut at salon Anna recommended — Alex described as 'first time I looked in the mirror and saw me'",
      "Now: maintenance trim every 6 weeks — Alex books own appointments",
    ],
    accessoriesPreferences: [
      "Plain black cap (daily)",
      "Sports watch (functional, not jewellery)",
      "No earrings (Alex stopped wearing the ones birth mother chose)",
    ],
    shoppingPreferences: [
      "Men's section or unisex only — staff respect this without comment",
      "Prefers shopping with key worker Edward (calm pace, no pressure)",
      "Often shops online to avoid changing-room dysphoria",
      "Quality basics over trends",
    ],
    whatTheyAvoid: [
      "Anything tight or fitted on chest/hips",
      "Pink, pastels, anything 'feminine-coded'",
      "Changing rooms in busy shops",
      "Being asked 'are you sure?' about their choices",
    ],
    bodyConfidence: "Building",
    challengesNoted: [
      "Body dysphoria — particularly around chest and hips",
      "Some peer comments at school — Alex managing well with support",
      "Occasional dips around menstruation",
    ],
    childVoice:
      "Before, someone else picked my clothes and my hair. Now I pick. That's the whole thing. The hoodie, the cap, the fade — it's just me, finally.",
    staffObservation:
      "Alex's style journey is one of reclamation. Every choice is deliberate. Staff approach is to follow Alex's lead, never anticipate or suggest. Body confidence building steadily — boxing club has been transformational. CAMHS and GP aware of binder use; safety and technique reviewed.",
    flagsForReview: ["Binder use — 6-monthly safety check with GP", "Dysphoria pattern around menstruation"],
    reviewDate: d(20),
    keyWorker: "staff_edward",
  },
  {
    id: "sty-003",
    youngPerson: "yp_casey",
    recordedDate: d(-7),
    styleDescriptors: [
      "Bright and sparkly",
      "Soft and sensory-led",
      "Disability-affirming",
      "Joyful and self-celebrated",
    ],
    identityElements: [
      "Mixed Heritage (Black/White British)",
      "Autistic — sensory needs central",
      "ARFID — sensory awareness extends to clothing",
      "Younger 'sister' in the home — looks up to Jordan",
      "Artist — clothing as another canvas",
    ],
    meaningfulItems: [
      { item: "Butterfly hair clips (set of 12, pastel)", meaning: "Casey researched these for two weeks before choosing. Bought with own pocket money. Worn daily — different combinations." },
      { item: "Pink fleece-lined leggings (3 pairs, identical)", meaning: "Sensory-perfect. Casey will wear nothing else for school." },
      { item: "Tunics from sensory-friendly brand", meaning: "No zips, no stiff seams, no labels. Anna sourced — Casey approved each one." },
      { item: "Long hair (grown since age 11)", meaning: "Casey decided to grow it after seeing key worker Ellie's hair. Brushed gently each evening together." },
      { item: "Sparkly belt (chosen for art exhibition night)", meaning: "Casey's first 'occasion' choice. Felt brave. Wore it once and it was perfect." },
    ],
    culturalDress: [
      "Casey is exploring her mixed heritage gently — has asked about hair-care for mixed hair (Anna researching with culturally-informed stylist)",
    ],
    genderExpressionNotes:
      "Casey uses she/her and is comfortable with traditionally feminine choices — but only when chosen and only when sensory-safe. Staff are careful never to assume bright/sparkly = feminine pressure; for Casey it is sensory-led joy.",
    hairStyleCurrent: "Long, brushed, half-up with butterfly clips",
    hairJourney: [
      "Age 5-10: short — birth mother kept short for ease",
      "Age 11 at Oak House: Casey asked to grow it — staff supported with care plan for brushing tolerance",
      "Now (age 16): waist-length — brushing routine with Ellie each evening (regulating, bonding)",
      "Researching mixed-heritage hair-care with Anna's support — gentle, child-led pace",
    ],
    accessoriesPreferences: [
      "Butterfly hair clips (12+ rotated daily)",
      "Soft scrunchies (no metal)",
      "Sparkly belt (occasional, chosen)",
      "Smooth silicone watch (sensory-tolerable)",
    ],
    shoppingPreferences: [
      "Specific sensory-friendly brands only (researched and trusted)",
      "Shops with Anna or Ellie — pace is everything",
      "Often shops online with photos at home, returns the rest",
      "Repeat-buys identical items in multiples",
    ],
    whatTheyAvoid: [
      "Zips on torso (textile against skin)",
      "Any rough seams or labels",
      "Stiff fabrics (denim, polyester)",
      "Bright fluorescent lights in changing rooms",
      "Strangers commenting on her clothes",
    ],
    bodyConfidence: "Building",
    challengesNoted: [
      "Sensory rejection of new items — needs trial period at home",
      "Occasional shame from peer comments about repeating outfits — staff reframing as identity",
      "Growth/period changes affecting fit of trusted items",
    ],
    childVoice:
      "I like soft. I like sparkly. I like when my clothes don't fight me. Ellie said my hair looks like a river — that's why I'm growing it.",
    staffObservation:
      "Casey's style is sensory-affirming and joyful. The disability-affirming approach (sensory needs central, no neurotypical performance pressure) has unlocked confidence. Casey watches Jordan's choices admiringly — sometimes asks Jordan's opinion on accessories. Hair journey with Ellie is a regulation and attachment milestone.",
    flagsForReview: ["Mixed-heritage hair-care plan — culturally-informed stylist consultation"],
    reviewDate: d(35),
    keyWorker: "staff_chervelle",
  },
];

const exportCols: ExportColumn<StyleRecord>[] = [
  { header: "Young Person", accessor: (r: StyleRecord) => getYPName(r.youngPerson) },
  { header: "Recorded", accessor: (r: StyleRecord) => r.recordedDate },
  { header: "Style Descriptors", accessor: (r: StyleRecord) => r.styleDescriptors.join("; ") },
  { header: "Hair Style", accessor: (r: StyleRecord) => r.hairStyleCurrent },
  { header: "Cultural Dress", accessor: (r: StyleRecord) => r.culturalDress.join("; ") },
  { header: "Gender Expression Notes", accessor: (r: StyleRecord) => r.genderExpressionNotes ?? "" },
  { header: "Body Confidence", accessor: (r: StyleRecord) => r.bodyConfidence },
  { header: "Flags For Review", accessor: (r: StyleRecord) => r.flagsForReview.join("; ") },
  { header: "Review Date", accessor: (r: StyleRecord) => r.reviewDate },
  { header: "Key Worker", accessor: (r: StyleRecord) => getStaffName(r.keyWorker) },
];

const confidenceStyle: Record<StyleRecord["bodyConfidence"], string> = {
  Building: "bg-amber-100 text-amber-800",
  Mixed: "bg-orange-100 text-orange-800",
  Stable: "bg-sky-100 text-sky-800",
  Strong: "bg-emerald-100 text-emerald-800",
};

export default function ChildStyleIdentityExpressionPage() {
  const [search, setSearch] = useState("");
  const [filterConfidence, setFilterConfidence] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterConfidence !== "all") {
      items = items.filter((r) => r.bodyConfidence === filterConfidence);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((r) => {
        const haystack = [
          getYPName(r.youngPerson),
          ...r.styleDescriptors,
          ...r.identityElements,
          r.hairStyleCurrent,
          ...r.culturalDress,
          r.genderExpressionNotes ?? "",
          r.childVoice,
          r.staffObservation,
        ].join(" ").toLowerCase();
        return haystack.includes(q);
      });
    }
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "review":
          return a.reviewDate.localeCompare(b.reviewDate);
        case "recorded":
          return b.recordedDate.localeCompare(a.recordedDate);
        case "confidence": {
          const order: Record<StyleRecord["bodyConfidence"], number> = {
            Building: 0,
            Mixed: 1,
            Stable: 2,
            Strong: 3,
          };
          return order[a.bodyConfidence] - order[b.bodyConfidence];
        }
        default:
          return 0;
      }
    });
    return items;
  }, [search, filterConfidence, sortBy]);

  const totalProfiles = data.length;
  const genderAffirmingCount = data.filter((r) => r.genderExpressionNotes && r.genderExpressionNotes.length > 0).length;
  const buildingConfidenceCount = data.filter((r) => r.bodyConfidence === "Building").length;
  const today = d(0);
  const reviewsDue = data.filter((r) => r.reviewDate <= d(30)).length;

  return (
    <PageShell
      title="Style & Identity Expression"
      subtitle="Per-child style and identity expression — clothing, hair, accessories, cultural dress, gender expression"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="style-identity-expression" />
          <PrintButton title="Style & Identity Expression" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-rose-600">{totalProfiles}</p>
          <p className="text-xs text-muted-foreground">Style Profiles</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{genderAffirmingCount}</p>
          <p className="text-xs text-muted-foreground">Gender-Affirming Notes</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-600">{buildingConfidenceCount}</p>
          <p className="text-xs text-muted-foreground">Building Body Confidence</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{reviewsDue}</p>
          <p className="text-xs text-muted-foreground">Reviews Due (30d)</p>
        </div>
      </div>

      <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 mb-6 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
        <p className="text-sm text-rose-800">
          Identity expression is a child&apos;s right. Each profile records how the young person wants
          to be seen — their style, hair journey, cultural dress, gender expression, and the meaningful
          items that anchor them. This is not about shopping; this is about self.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search style, identity, voice..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border bg-white"
          />
        </div>
        <Select value={filterConfidence} onValueChange={setFilterConfidence}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Body Confidence" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Confidence</SelectItem>
            <SelectItem value="Building">Building</SelectItem>
            <SelectItem value="Mixed">Mixed</SelectItem>
            <SelectItem value="Stable">Stable</SelectItem>
            <SelectItem value="Strong">Strong</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="confidence">By Confidence</SelectItem>
              <SelectItem value="recorded">Most Recently Recorded</SelectItem>
              <SelectItem value="review">Earliest Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-rose-50/40 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Shirt className="h-5 w-5 text-rose-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(r.youngPerson)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {r.styleDescriptors.slice(0, 2).join(" · ")} &middot; Recorded {r.recordedDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", confidenceStyle[r.bodyConfidence])}>
                    {r.bodyConfidence}
                  </span>
                  <span className="hidden md:inline text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                    {r.hairStyleCurrent}
                  </span>
                  {r.flagsForReview.length > 0 && (
                    <Star className="h-4 w-4 text-amber-500" />
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-rose-50/30 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Shirt className="h-3 w-3 inline mr-1" />Style Descriptors
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {r.styleDescriptors.map((s, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <Sparkles className="h-3 w-3 inline mr-1" />Identity Elements
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {r.identityElements.map((e, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">{e}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                      <Heart className="h-3 w-3 inline mr-1" />Meaningful Items
                    </p>
                    <div className="space-y-1">
                      {r.meaningfulItems.map((m, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{m.item}</p>
                          <p className="text-xs text-muted-foreground">{m.meaning}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {r.culturalDress.length > 0 && (
                    <div className="bg-sky-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-sky-800 uppercase tracking-wide mb-1">Cultural Dress</p>
                      <ul className="space-y-1">
                        {r.culturalDress.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-sky-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {r.genderExpressionNotes && (
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Gender Expression Notes</p>
                      <p className="text-sm text-purple-900">{r.genderExpressionNotes}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Hair — Current</p>
                      <p className="text-sm font-medium mb-2">{r.hairStyleCurrent}</p>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Hair Journey</p>
                      <ul className="space-y-1">
                        {r.hairJourney.map((h, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-rose-600 mt-0.5">•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Accessories</p>
                      <ul className="space-y-1 mb-3">
                        {r.accessoriesPreferences.map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Sparkles className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Shopping Preferences</p>
                      <ul className="space-y-1">
                        {r.shoppingPreferences.map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-sky-600 mt-0.5">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {r.whatTheyAvoid.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What They Avoid</p>
                      <ul className="space-y-1">
                        {r.whatTheyAvoid.map((w, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-orange-600 mt-0.5">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-rose-100/60 rounded-lg p-3 border border-rose-200">
                    <p className="text-xs font-semibold text-rose-800 uppercase tracking-wide mb-1">Child Voice</p>
                    <p className="text-sm italic text-rose-900">&ldquo;{r.childVoice}&rdquo;</p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Staff Observation</p>
                    <p className="text-sm">{r.staffObservation}</p>
                  </div>

                  {r.challengesNoted.length > 0 && (
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide mb-1">Challenges Noted</p>
                      <ul className="space-y-1">
                        {r.challengesNoted.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-orange-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {r.flagsForReview.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <Star className="h-3 w-3 inline mr-1" />Flags For Review
                      </p>
                      <ul className="space-y-1">
                        {r.flagsForReview.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Star className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Recorded: {r.recordedDate}</span>
                    <span>Next review: {r.reviewDate}</span>
                    <span>Key worker: {getStaffName(r.keyWorker)}</span>
                    <span className={cn("px-2 py-0.5 rounded-full font-medium", confidenceStyle[r.bodyConfidence])}>
                      Body confidence: {r.bodyConfidence}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Style and identity expression supports Quality Standard 6
          (positive relationships and identity), Quality Standard 7 (health and wellbeing — including body
          image and gender-affirming care), the Equality Act 2010 (protected characteristics: gender
          reassignment, race, religion, disability), and UNCRC Articles 8 (right to identity), 13 (freedom
          of expression), 14 (freedom of thought, conscience and religion), and 30 (cultural identity).
          Records are co-authored with the young person and reviewed regularly. Today: {today}.
        </p>
      </div>
    </PageShell>
  );
}
