"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Heart,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HandMetal,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SafeTouchProtocol {
  id: string;
  youngPerson: string;
  trauma_informed_basis: string;
  childAge: number;
  acceptableTouches: { type: string; context: string; childAgreed: boolean }[];
  unacceptableTouches: string[];
  greetingPreferences: string;
  comfortPreferences: string;
  physicalProximity: string;
  personalSpaceRequirements: string;
  triggers: string[];
  signsOfDistress: string[];
  responseIfTriggered: string[];
  childPreferredLanguage: string;
  reviewedDate: string;
  reviewedWith: string;
  reviewWithChild: boolean;
  childUnderstandsConsent: boolean;
  staffBriefingDate: string;
  notes: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: SafeTouchProtocol[] = [
  {
    id: "stp-001",
    youngPerson: "yp_alex",
    childAge: 13,
    trauma_informed_basis: "Witnessed domestic violence. Hypervigilant around male voices and sudden movements. Touch must be predictable and consensual. Building secure base through gradual relational repair.",
    acceptableTouches: [
      { type: "Hand on shoulder briefly", context: "When standing alongside, with verbal cue ('hand on shoulder OK?')", childAgreed: true },
      { type: "Hi-five / fist bump", context: "Greeting/celebration — initiated by Alex usually", childAgreed: true },
      { type: "Side hug", context: "Initiated by Alex, mainly with female key worker (Anna) at significant moments", childAgreed: true },
      { type: "Steadying hand if stumbling", context: "Brief, functional — verbalised after ('alright?')", childAgreed: true },
    ],
    unacceptableTouches: [
      "Front hugs from any staff",
      "Touching head or hair",
      "Approaching from behind to touch",
      "Holding hands while walking",
      "Tickling — never",
    ],
    greetingPreferences: "Verbal greeting first. Alex often initiates fist bump/hi-five. Don't approach for physical greeting — let Alex lead.",
    comfortPreferences: "When upset, prefers space first. Side-by-side seating helps. May invite hand on back AFTER calming. Never touch when crying — wait for invitation.",
    physicalProximity: "Comfortable with normal seating distance. Becomes uncomfortable if staff sit closer than 1m without invitation. Loves walking alongside (slight angle, not face-to-face).",
    personalSpaceRequirements: "Bedroom and personal space STRICTLY private. Always knock and wait. Never sit on Alex's bed without invitation. Personal items not handled.",
    triggers: [
      "Sudden touch from any direction",
      "Male voice raised + proximity",
      "Touch when emotionally elevated",
      "Restraint-style holds (NEVER use)",
    ],
    signsOfDistress: [
      "Stiffening posture",
      "Pulling arm back / shoulder hunch",
      "Eye contact avoidance",
      "Verbal protest — usually direct",
      "Withdrawal from interaction",
    ],
    responseIfTriggered: [
      "Move back at once and apologise",
      "Verbalise: 'Sorry — too much, I'll give you space'",
      "Don't try to repair physically",
      "Allow 30-60 mins recovery",
      "Note in shift log and inform key worker",
      "Address in next key work session if Alex wants",
    ],
    childPreferredLanguage: "Direct and simple. 'Hand on shoulder OK?' or 'High five?' Avoid clinical language. Don't ask 'can I have a hug' — Alex finds it awkward.",
    reviewedDate: d(-21),
    reviewedWith: "staff_edward",
    reviewWithChild: true,
    childUnderstandsConsent: true,
    staffBriefingDate: d(-18),
    notes: "Alex's protocol updated quarterly. Recent improvement: now occasionally initiates side-hugs with Anna at significant emotional moments. This is a major relational milestone. Continue current approach.",
  },
  {
    id: "stp-002",
    youngPerson: "yp_jordan",
    childAge: 13,
    trauma_informed_basis: "Long history of inconsistent caregiving. Touch from male staff may be uncomfortable due to past dynamics. Football contact normalises some male touch in safe context. Building trust through consistency.",
    acceptableTouches: [
      { type: "Handshake", context: "Greeting other adults, sometimes staff after success", childAgreed: true },
      { type: "Pat on back", context: "Brief, celebratory (e.g., after football match)", childAgreed: true },
      { type: "Hi-five / fist bump", context: "Routine — Jordan initiates often", childAgreed: true },
      { type: "Hand on shoulder", context: "From female staff Jordan trusts, brief, with verbal cue", childAgreed: true },
      { type: "Brief hug — significant moments", context: "Initiated by Jordan only, very rare", childAgreed: true },
    ],
    unacceptableTouches: [
      "Hugs from male staff (other than father figures specifically named)",
      "Touching face",
      "Restraint-style holds (only ever as last resort and per positive handling plan)",
      "Hand-holding",
      "Ruffling hair",
    ],
    greetingPreferences: "Verbal — 'Alright Jordan?' Fist bump if offered. Female staff may offer brief shoulder touch. Male staff: verbal only unless Jordan extends hand first.",
    comfortPreferences: "Doesn't typically seek comfort touch when upset. Football coach handshake/pat is meaningful. With key worker (Chervelle), may sit close. Verbal validation more impactful than touch.",
    physicalProximity: "Comfortable in group settings. Football team dynamics involve normal physical contact (back slaps, shoulder leans). One-to-one with male staff: maintain ~1m distance unless Jordan closes it.",
    personalSpaceRequirements: "Bedroom is sanctuary. Always knock. Phone particularly private — staff don't touch phone. Sports kit: respect that football kit is meaningful (don't move/hand kit without asking).",
    triggers: [
      "Touch from unfamiliar adult",
      "Restrictive touch (anything that feels like restraint)",
      "Touch during emotional escalation",
      "Touch around mother-related conversations",
    ],
    signsOfDistress: [
      "Posture tensing",
      "Stepping back",
      "Verbal challenge ('what are you doing')",
      "Sudden quietness",
      "Walking away",
    ],
    responseIfTriggered: [
      "Step back, raise hands open palms ('my bad')",
      "Verbalise: 'Sorry mate, didn't mean to'",
      "Don't pursue connection right away",
      "Note pattern if recurring with specific staff",
      "Discuss in supervision if relational dynamic emerges",
    ],
    childPreferredLanguage: "Casual, warm. 'Mate' acceptable. 'Bro' from older staff Jordan trusts. Don't be over-formal or clinical. Football language helps ('good game', 'top one').",
    reviewedDate: d(-14),
    reviewedWith: "staff_ryan",
    reviewWithChild: true,
    childUnderstandsConsent: true,
    staffBriefingDate: d(-10),
    notes: "Jordan's protocol works well. Football context provides safe normalisation of male touch. Watch for any stress around upcoming mother release — touch tolerance may temporarily reduce. Brief team if needed.",
  },
  {
    id: "stp-003",
    youngPerson: "yp_casey",
    childAge: 12,
    trauma_informed_basis: "ASD + early neglect. Sensory processing differences make most touch painful or overwhelming. Touch must be specific, predictable, and Casey-initiated. Deep pressure (weighted) tolerated; light touch is aversive.",
    acceptableTouches: [
      { type: "Weighted blanket adjustment", context: "When already in bed/relaxing, after verbal warning", childAgreed: true },
      { type: "Steadying hand if stumbling", context: "Functional only, brief, firm pressure (not light)", childAgreed: true },
      { type: "Casey-initiated hand-hold", context: "RARE — happens with specific staff (Anna only) at high-anxiety moments", childAgreed: true },
      { type: "Firm shoulder squeeze", context: "Casey may request this for grounding — DEEP pressure only", childAgreed: true },
    ],
    unacceptableTouches: [
      "Light/tickling touch (PHYSICALLY painful for Casey)",
      "Hugs of any kind",
      "Touching face, hair, head",
      "Hand-holding while walking",
      "Pat on back",
      "Hi-five (sensory aversion)",
      "Surprise/unexpected touch — extreme distress response",
    ],
    greetingPreferences: "Verbal + visual. 'Morning Casey, how are you?' with smile. NO physical greeting initiated by staff. Wait — Casey may wave or nod. Sometimes shows preferred toy as 'greeting'.",
    comfortPreferences: "Sensory tools more effective than touch. Weighted lap pad, fidgets, dim lighting. If Casey is at peak distress, OFFER weighted blanket but don't apply it — let Casey choose. Quiet presence is comfort.",
    physicalProximity: "Optimal: 1.5m or more. Casey will close distance if comfortable. Don't sit directly facing — side-on or angled is easier. Eye contact pressure to be minimised.",
    personalSpaceRequirements: "Bedroom layout VERY specific (Casey's choice). Don't move items. Don't enter without knocking AND waiting full 10 seconds. Sensory toys are not to be handled by staff.",
    triggers: [
      "Light or unexpected touch (extreme distress)",
      "Multiple people in close proximity",
      "Bright lights + touch combination",
      "Touch during transition periods",
      "Anyone touching Otter (stuffed toy) — strict no",
    ],
    signsOfDistress: [
      "Freeze response — going still",
      "Hands over ears",
      "Rocking",
      "Verbal scripting (repeating phrases)",
      "Quick withdrawal",
      "Vocal distress (guttural sounds)",
    ],
    responseIfTriggered: [
      "Move away IMMEDIATELY — increase distance",
      "STOP talking — silence is calming",
      "Offer sensory tools (weighted lap pad)",
      "Allow significant recovery time (often 20-40 mins)",
      "Document trigger in detail",
      "Review whether to escalate to OT/CAMHS if recurrent",
    ],
    childPreferredLanguage: "Concrete, literal. 'I'm going to put your blanket on now, ok?' (Casey nods or signs no). Avoid metaphor. Use Casey's chosen vocabulary (e.g. 'big feelings' rather than 'overwhelmed'). Visual cards available.",
    reviewedDate: d(-7),
    reviewedWith: "staff_anna",
    reviewWithChild: true,
    childUnderstandsConsent: true,
    staffBriefingDate: d(-5),
    notes: "Casey's protocol critical for safe practice. SaLT involved in protocol design. Sensory profile provides foundation. Any new staff requires ASD touch protocol training BEFORE working with Casey. Reviewed monthly.",
  },
];

const exportCols: ExportColumn<SafeTouchProtocol>[] = [
  { header: "Young Person", accessor: (r: SafeTouchProtocol) => getYPName(r.youngPerson) },
  { header: "Age", accessor: (r: SafeTouchProtocol) => String(r.childAge) },
  { header: "Trauma-Informed Basis", accessor: (r: SafeTouchProtocol) => r.trauma_informed_basis },
  { header: "Personal Space", accessor: (r: SafeTouchProtocol) => r.personalSpaceRequirements },
  { header: "Triggers Count", accessor: (r: SafeTouchProtocol) => String(r.triggers.length) },
  { header: "Last Reviewed", accessor: (r: SafeTouchProtocol) => r.reviewedDate },
  { header: "Reviewed With Child", accessor: (r: SafeTouchProtocol) => r.reviewWithChild ? "Yes" : "No" },
  { header: "Child Understands Consent", accessor: (r: SafeTouchProtocol) => r.childUnderstandsConsent ? "Yes" : "No" },
];

export default function SafeTouchProtocolPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((p) => p.youngPerson === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.youngPerson.localeCompare(b.youngPerson);
        case "review":
          return a.reviewedDate.localeCompare(b.reviewedDate);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, sortBy]);

  const allReviewedWithChild = data.every((p) => p.reviewWithChild);
  const allConsentUnderstood = data.every((p) => p.childUnderstandsConsent);
  const dueReview = data.filter((p) => p.reviewedDate < d(-30)).length;

  return (
    <PageShell
      title="Safe Touch Protocol"
      subtitle="Individual physical contact frameworks per child — trauma-informed, consent-led, sensory-aware"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="safe-touch-protocol" />
          <PrintButton title="Safe Touch Protocol" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{data.length}</p>
          <p className="text-xs text-muted-foreground">Active Protocols</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allReviewedWithChild ? "100%" : `${data.filter((p) => p.reviewWithChild).length}/${data.length}`}</p>
          <p className="text-xs text-muted-foreground">Reviewed With Child</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{allConsentUnderstood ? "100%" : `${data.filter((p) => p.childUnderstandsConsent).length}/${data.length}`}</p>
          <p className="text-xs text-muted-foreground">Consent Understood</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dueReview > 0 ? "text-amber-600" : "text-green-600")}>{dueReview}</p>
          <p className="text-xs text-muted-foreground">Due Review</p>
        </div>
      </div>

      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-pink-600 mt-0.5 shrink-0" />
        <p className="text-sm text-pink-800">
          Touch in our care is a relational, consensual act — never an assumption. Each child has a personalised
          protocol based on their trauma history, sensory profile, and stated preferences. All staff are
          briefed before working with each child.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="review">Earliest Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((protocol) => {
          const isExpanded = expandedId === protocol.id;
          return (
            <div key={protocol.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : protocol.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <HandMetal className="h-5 w-5 text-pink-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(protocol.youngPerson)} (age {protocol.childAge})</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{protocol.trauma_informed_basis}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {protocol.reviewWithChild && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Co-produced</span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Trauma-Informed Basis</p>
                    <p className="text-sm text-purple-900">{protocol.trauma_informed_basis}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      <CheckCircle className="h-3 w-3 inline mr-1" />Acceptable Touches
                    </p>
                    <div className="space-y-2">
                      {protocol.acceptableTouches.map((t, i) => (
                        <div key={i} className="bg-green-50 rounded-lg p-2 text-sm">
                          <p className="font-medium text-green-900">{t.type}</p>
                          <p className="text-xs text-green-700 mt-0.5">{t.context}</p>
                          {t.childAgreed && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-200 text-green-900 font-medium mt-1 inline-block">Child agreed</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">
                      <XCircle className="h-3 w-3 inline mr-1" />Unacceptable Touches
                    </p>
                    <ul className="space-y-1">
                      {protocol.unacceptableTouches.map((t, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <XCircle className="h-3 w-3 text-red-500 mt-1 shrink-0" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Greeting Preferences</p>
                      <p className="text-sm">{protocol.greetingPreferences}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Comfort Preferences</p>
                      <p className="text-sm">{protocol.comfortPreferences}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Physical Proximity</p>
                      <p className="text-sm">{protocol.physicalProximity}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Personal Space</p>
                      <p className="text-sm">{protocol.personalSpaceRequirements}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />Triggers
                    </p>
                    <ul className="space-y-1">
                      {protocol.triggers.map((t, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-red-600 mt-0.5">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Signs Of Distress</p>
                    <ul className="space-y-1">
                      {protocol.signsOfDistress.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">If Triggered: Response</p>
                    <ul className="space-y-1">
                      {protocol.responseIfTriggered.map((r, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Child&apos;s Preferred Language</p>
                    <p className="text-sm text-purple-900">{protocol.childPreferredLanguage}</p>
                  </div>

                  {protocol.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{protocol.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Shield className="h-3 w-3 inline mr-1" />Reviewed: {protocol.reviewedDate}</span>
                    <span>With: {getStaffName(protocol.reviewedWith)}</span>
                    <span>Staff briefed: {protocol.staffBriefingDate}</span>
                    {protocol.reviewWithChild && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Co-produced with child</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Safe touch protocols support Quality Standard 5 (protection
          of children), Quality Standard 7 (health and wellbeing), and the home&apos;s positive handling
          framework. Aligned with NICE guidelines on attachment, trauma-informed care principles, and
          children&apos;s right to bodily autonomy (UNCRC Article 19). Reviewed with each child quarterly
          minimum.
        </p>
      </div>
    </PageShell>
  );
}
