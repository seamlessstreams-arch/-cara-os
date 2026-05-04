"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, ChevronDown, ChevronUp, AlertTriangle, Clock, MapPin,
  TrendingUp, TrendingDown, Minus, ArrowUpDown, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type BehaviourType = "aggression" | "self_harm" | "absconding" | "property_damage" | "verbal_aggression" | "withdrawal" | "refusal" | "dysregulation";
type Intensity = "low" | "moderate" | "high" | "crisis";
type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

interface BehaviourEntry {
  id: string;
  date: string;
  time: string;
  timeOfDay: TimeOfDay;
  youngPersonId: string;
  behaviourType: BehaviourType;
  intensity: Intensity;
  location: string;
  antecedent: string;
  behaviour: string;
  consequence: string;
  duration: string;
  staffPresent: string[];
  deEscalationUsed: string[];
  outcome: string;
  triggerPattern: string | null;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_META: Record<BehaviourType, { label: string; color: string }> = {
  aggression: { label: "Aggression", color: "bg-red-100 text-red-800" },
  self_harm: { label: "Self-Harm", color: "bg-red-100 text-red-800" },
  absconding: { label: "Absconding", color: "bg-orange-100 text-orange-800" },
  property_damage: { label: "Property Damage", color: "bg-amber-100 text-amber-800" },
  verbal_aggression: { label: "Verbal Aggression", color: "bg-amber-100 text-amber-800" },
  withdrawal: { label: "Withdrawal", color: "bg-blue-100 text-blue-800" },
  refusal: { label: "Refusal", color: "bg-slate-100 text-slate-700" },
  dysregulation: { label: "Dysregulation", color: "bg-purple-100 text-purple-800" },
};

const INTENSITY_META: Record<Intensity, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-green-100 text-green-800" },
  moderate: { label: "Moderate", color: "bg-amber-100 text-amber-800" },
  high: { label: "High", color: "bg-orange-100 text-orange-800" },
  crisis: { label: "Crisis", color: "bg-red-100 text-red-800" },
};

const TOD_META: Record<TimeOfDay, { label: string }> = {
  morning: { label: "Morning (06:00-12:00)" },
  afternoon: { label: "Afternoon (12:00-18:00)" },
  evening: { label: "Evening (18:00-22:00)" },
  night: { label: "Night (22:00-06:00)" },
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: BehaviourEntry[] = [
  {
    id: "bm_001", date: d(-1), time: "19:30", timeOfDay: "evening",
    youngPersonId: "yp_casey", behaviourType: "withdrawal", intensity: "moderate",
    location: "Bedroom",
    antecedent: "Casey returned from grandmother's phone call. The call was shorter than usual — grandmother had to go early. Casey appeared disappointed and went straight to her room without speaking to staff.",
    behaviour: "Casey went to bedroom and refused to come out for dinner. Did not respond to knocks. Music playing loudly. When staff persisted (gently), Casey shouted 'leave me alone.'",
    consequence: "Staff respected Casey's wish for space. Left food outside door with a note saying 'We're here when you're ready.' Chervelle checked in after 30 minutes — Casey had eaten some food. Casey came to the lounge at 21:00 to watch TV quietly. No further incident.",
    duration: "90 minutes",
    staffPresent: ["staff_chervelle", "staff_ryan"],
    deEscalationUsed: ["Gave space", "Left food with supportive note", "Non-pressured check-in after 30 minutes", "Waited for Casey to emerge on her terms"],
    outcome: "Casey self-regulated and returned to communal area. No escalation. Good example of staff giving Casey autonomy while remaining available.",
    triggerPattern: "Disrupted family contact → withdrawal. Pattern identified: Casey withdraws when she feels abandoned or let down. Phone calls ending abruptly or being cancelled are consistent triggers.",
    notes: "This is a well-documented pattern. Casey withdraws rather than expressing disappointment verbally. Staff response was exemplary — no pressure, consistent availability.",
  },
  {
    id: "bm_002", date: d(-4), time: "23:45", timeOfDay: "night",
    youngPersonId: "yp_casey", behaviourType: "self_harm", intensity: "crisis",
    location: "Bedroom",
    antecedent: "Casey had been quiet all evening after social worker visit about LADO. Went to room at 21:00. Night staff heard distress at 23:45.",
    behaviour: "Casey attempted to scratch forearms with a broken pen. Staff intervened when they heard Casey crying. Superficial scratches noted on left forearm — no bleeding requiring medical attention.",
    consequence: "TCI techniques used. Physical intervention lasted 4 minutes (restraint to prevent further harm). Casey given space after, then accepted warm drink. Spoke with Chervelle the next morning. Safety plan reviewed. Broken pen removed — environmental check conducted.",
    duration: "20 minutes (from discovery to Casey settling)",
    staffPresent: ["staff_ryan", "staff_chervelle"],
    deEscalationUsed: ["Verbal reassurance", "TCI holding (4 minutes)", "Warm drink", "Distress tolerance toolkit", "Grounding exercises"],
    outcome: "Casey settled by 00:15. First aid administered for scratches. CAMHS crisis team contacted following morning. Safety plan updated. Incident log completed. Staff debrief conducted.",
    triggerPattern: "LADO-related stress → self-harm. Casey's self-harm incidents correlate strongly with LADO-related conversations and feelings of being 'in trouble' or 'not trusted.' Evening/night is the highest risk period.",
    notes: "Critical incident. All protocols followed. Staff response was compassionate and proportionate. Environmental check identified the broken pen as a risk item — all pens in Casey's room now checked.",
  },
  {
    id: "bm_003", date: d(-7), time: "07:45", timeOfDay: "morning",
    youngPersonId: "yp_jordan", behaviourType: "dysregulation", intensity: "high",
    location: "Kitchen / dining area",
    antecedent: "Morning routine disruption. Jordan's preferred cereal had run out. The replacement cereal was a different brand in a different box. Jordan was already slightly anxious about school (new teaching assistant starting).",
    behaviour: "Jordan became visibly distressed — hand-flapping, rocking, covering ears. When staff tried to offer alternatives, Jordan pushed the bowl off the table (smashed on floor). Jordan then ran to bedroom and slammed door. Meltdown lasted approximately 15 minutes.",
    consequence: "Staff followed ASD de-escalation protocol. Reduced sensory input. Did not follow Jordan immediately — gave 5 minutes of space. Then approached door and said 'Jordan, you're safe. I'm here.' Offered weighted blanket under door. Jordan took it. After 15 minutes, Jordan emerged calm. Staff offered toast (accepted food) and visual schedule was reviewed to reassure Jordan about the day ahead.",
    duration: "15 minutes (meltdown) + 10 minutes (recovery)",
    staffPresent: ["staff_anna"],
    deEscalationUsed: ["Reduced sensory input", "Gave space", "Minimal language", "Weighted blanket", "Visual schedule reassurance", "Offered familiar food alternative"],
    outcome: "Jordan recovered well. Ate toast. Went to school on time (slightly late but arrived calm). Anna informed school about the morning disruption so TA could adjust approach.",
    triggerPattern: "Routine disruption + existing anxiety = meltdown. Jordan's meltdowns consistently follow unexpected changes, especially when already anxious. Food-related changes are a specific trigger due to sensory preferences.",
    notes: "Anna handled this perfectly. The learning point is ensuring preferred foods are always in stock — added to the weekly shopping list protocol. A backup supply of Jordan's cereal now kept in the office cupboard.",
  },
  {
    id: "bm_004", date: d(-10), time: "16:30", timeOfDay: "afternoon",
    youngPersonId: "yp_alex", behaviourType: "verbal_aggression", intensity: "moderate",
    location: "Lounge",
    antecedent: "Alex had just received a phone call from his social worker saying that planned contact with his dad had been cancelled (dad didn't attend). Alex was visibly upset.",
    behaviour: "Alex swore loudly ('this is bullshit') and kicked the sofa cushion across the room. Shouted at staff: 'Why does everyone let me down?' and 'I don't care about any of this.' Paced around the lounge for several minutes.",
    consequence: "Staff (Ryan) stayed calm. Did not challenge the language in the moment. Ryan said 'I can see you're really disappointed, Alex.' Alex initially said 'don't talk to me' but after 5 minutes, sat down. Ryan suggested they go for a walk — Alex agreed. During the walk, Alex talked about feeling let down by his dad. Returned calm. No further incident.",
    duration: "10 minutes (outburst) + 20 minutes (walk/de-escalation)",
    staffPresent: ["staff_ryan"],
    deEscalationUsed: ["Calm, non-judgemental response", "Validated emotions", "Didn't challenge language", "Offered activity-based outlet (walk)", "Active listening during walk"],
    outcome: "Alex de-escalated well. Expressed feelings about dad during walk. Ryan documented and will raise at next key work session. SW informed about the impact of cancelled contact.",
    triggerPattern: "Cancelled family contact → verbal aggression. Alex's challenging behaviour is almost exclusively linked to family contact disappointment. He expresses hurt through anger. Activity-based de-escalation (walking, sports) is consistently effective.",
    notes: "Ryan's response was textbook. The key learning: don't address the behaviour (swearing, kicking cushion) in the moment — address the feeling. Alex processes emotions through physical activity. This is well-understood by the team.",
  },
  {
    id: "bm_005", date: d(-14), time: "18:00", timeOfDay: "evening",
    youngPersonId: "yp_casey", behaviourType: "absconding", intensity: "high",
    location: "Back garden → off-site",
    antecedent: "Casey had been scrolling on phone in garden. Staff believe Casey may have received a message from Marcus (phone monitoring confirmed post-incident). Casey became agitated, told staff she was 'going for a walk.'",
    behaviour: "Casey left via the back gate without permission. Staff called after her but Casey ran. Missing protocol activated within 15 minutes. Police contacted at 30 minutes. Casey located by police at a bus stop 3 hours later.",
    consequence: "Casey returned home safely. Return home interview conducted by Anna the next day. Casey said she 'just needed to get out' but denied going to meet Marcus. Phone records showed a message from an unknown number (suspected Marcus using a new number). Social worker and police informed. Contact restriction review meeting arranged.",
    duration: "3 hours missing",
    staffPresent: ["staff_anna", "staff_edward"],
    deEscalationUsed: ["Verbal — asked Casey to stay", "Called after Casey", "Missing protocol activated"],
    outcome: "Casey returned safely. No physical harm. Exploitation risk assessment updated. Phone monitoring reviewed — new number added to watch list. Back gate security reviewed. Incident reported as per Reg 35.",
    triggerPattern: "Contact from Marcus → agitation → absconding. Casey's absconding episodes are strongly linked to exploitation triggers. Contact from Marcus (or suspected associates) is the primary antecedent. Evening is the highest risk time.",
    notes: "Critical pattern. This confirms the link between Marcus contact and Casey's risk behaviours. The unknown number needs investigating. Back gate has been fitted with an alarm since this incident.",
  },
  {
    id: "bm_006", date: d(-21), time: "14:00", timeOfDay: "afternoon",
    youngPersonId: "yp_alex", behaviourType: "refusal", intensity: "low",
    location: "Bedroom / study area",
    antecedent: "Alex was asked to do his homework (maths revision). Alex had a difficult maths lesson at school and was frustrated.",
    behaviour: "Alex said 'I'm not doing it. Maths is stupid.' Went to bedroom and played on his phone instead. Refused twice when staff checked.",
    consequence: "Staff didn't push. Ryan said 'When you're ready, I'll help you with it — no rush.' After 40 minutes, Alex came downstairs and asked for help. Ryan sat with him and they did the maths together. Alex completed the homework.",
    duration: "40 minutes (refusal period)",
    staffPresent: ["staff_ryan"],
    deEscalationUsed: ["Offered help without pressure", "Gave autonomy and space", "Consistent availability"],
    outcome: "Alex completed homework with support. Positive ending. The pattern is consistent — Alex needs time to process frustration before he can re-engage.",
    triggerPattern: "Academic frustration → refusal → recovery. Alex's refusal behaviours are mild and consistently resolve when staff give him time and then offer non-judgemental support. Maths is the most common trigger.",
    notes: "Low-level. Normal teenage behaviour combined with academic anxiety. Ryan's approach is consistently effective. This is not a safeguarding or significant concern.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function BehaviourMappingPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "intensity" | "child">("date");
  const [filterChild, setFilterChild] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = [...data];
    if (filterChild !== "all") result = result.filter((e) => e.youngPersonId === filterChild);
    if (filterType !== "all") result = result.filter((e) => e.behaviourType === filterType);
    return result.sort((a, b) => {
      switch (sortBy) {
        case "intensity": {
          const order = { crisis: 0, high: 1, moderate: 2, low: 3 };
          return (order[a.intensity] ?? 4) - (order[b.intensity] ?? 4);
        }
        case "child": return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        default: return b.date.localeCompare(a.date);
      }
    });
  }, [data, sortBy, filterChild, filterType]);

  const exportData = useMemo(() => {
    return data.map((e) => ({
      date: e.date,
      time: e.time,
      child: getYPName(e.youngPersonId),
      type: TYPE_META[e.behaviourType].label,
      intensity: INTENSITY_META[e.intensity].label,
      location: e.location,
      antecedent: e.antecedent,
      behaviour: e.behaviour,
      consequence: e.consequence,
      duration: e.duration,
      staff: e.staffPresent.map((s) => getStaffName(s)).join(", "),
      triggerPattern: e.triggerPattern || "None identified",
    }));
  }, [data]);

  type ExportRow = (typeof exportData)[number];

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Date", accessor: (r: ExportRow) => r.date },
    { header: "Time", accessor: (r: ExportRow) => r.time },
    { header: "Child", accessor: (r: ExportRow) => r.child },
    { header: "Type", accessor: (r: ExportRow) => r.type },
    { header: "Intensity", accessor: (r: ExportRow) => r.intensity },
    { header: "Location", accessor: (r: ExportRow) => r.location },
    { header: "Antecedent", accessor: (r: ExportRow) => r.antecedent },
    { header: "Behaviour", accessor: (r: ExportRow) => r.behaviour },
    { header: "Consequence", accessor: (r: ExportRow) => r.consequence },
    { header: "Duration", accessor: (r: ExportRow) => r.duration },
    { header: "Staff", accessor: (r: ExportRow) => r.staff },
    { header: "Trigger Pattern", accessor: (r: ExportRow) => r.triggerPattern },
  ];

  /* pattern summary */
  const childPatterns = useMemo(() => {
    const map = new Map<string, { total: number; byType: Record<string, number>; byTime: Record<string, number>; topTrigger: string | null }>();
    for (const entry of data) {
      const existing = map.get(entry.youngPersonId) || { total: 0, byType: {}, byTime: {}, topTrigger: null };
      existing.total++;
      existing.byType[entry.behaviourType] = (existing.byType[entry.behaviourType] || 0) + 1;
      existing.byTime[entry.timeOfDay] = (existing.byTime[entry.timeOfDay] || 0) + 1;
      if (entry.triggerPattern) existing.topTrigger = entry.triggerPattern;
      map.set(entry.youngPersonId, existing);
    }
    return map;
  }, [data]);

  return (
    <PageShell
      title="Behaviour Mapping"
      subtitle="ABC Analysis · Trigger Patterns · De-Escalation · Antecedent–Behaviour–Consequence"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Behaviour Mapping" />
          <ExportButton data={exportData} columns={exportCols} filename="behaviour-mapping" />
        </div>
      }
    >
      <div id="print-area">
        {/* pattern summary per child */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {["yp_alex", "yp_jordan", "yp_casey"].map((ypId) => {
            const patterns = childPatterns.get(ypId);
            if (!patterns) return null;
            const topType = Object.entries(patterns.byType).sort((a, b) => b[1] - a[1])[0];
            const topTime = Object.entries(patterns.byTime).sort((a, b) => b[1] - a[1])[0];
            return (
              <Card key={ypId}>
                <CardContent className="pt-4 pb-3">
                  <p className="font-bold mb-1">{getYPName(ypId)}</p>
                  <p className="text-2xl font-bold">{patterns.total} <span className="text-sm font-normal text-muted-foreground">entries</span></p>
                  <div className="mt-1 space-y-0.5 text-xs">
                    {topType && <p className="text-muted-foreground">Most common: <span className="font-medium">{TYPE_META[topType[0] as BehaviourType]?.label}</span> ({topType[1]})</p>}
                    {topTime && <p className="text-muted-foreground">Peak time: <span className="font-medium">{TOD_META[topTime[0] as TimeOfDay]?.label}</span></p>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select className="text-sm border rounded px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="date">Date (newest)</option>
              <option value="intensity">Intensity (highest)</option>
              <option value="child">Child (A–Z)</option>
            </select>
          </div>
          <select className="text-sm border rounded px-2 py-1" value={filterChild} onChange={(e) => setFilterChild(e.target.value)}>
            <option value="all">All Children</option>
            <option value="yp_alex">{getYPName("yp_alex")}</option>
            <option value="yp_jordan">{getYPName("yp_jordan")}</option>
            <option value="yp_casey">{getYPName("yp_casey")}</option>
          </select>
          <select className="text-sm border rounded px-2 py-1" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            {(Object.entries(TYPE_META) as [BehaviourType, { label: string }][]).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
        </div>

        {/* behaviour entries */}
        <div className="space-y-3">
          {filtered.map((entry) => {
            const isOpen = expandedId === entry.id;
            return (
              <Card key={entry.id} className={cn(
                "border-l-4",
                entry.intensity === "crisis" ? "border-l-red-500" :
                entry.intensity === "high" ? "border-l-orange-400" :
                entry.intensity === "moderate" ? "border-l-amber-400" : "border-l-green-400"
              )}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : entry.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-600" />
                        {getYPName(entry.youngPersonId)}
                        <Badge variant="outline" className={TYPE_META[entry.behaviourType].color}>{TYPE_META[entry.behaviourType].label}</Badge>
                        <Badge variant="outline" className={INTENSITY_META[entry.intensity].color}>{INTENSITY_META[entry.intensity].label}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {entry.date} at {entry.time} · {entry.location} · Duration: {entry.duration} · Staff: {entry.staffPresent.map((s) => getStaffName(s)).join(", ")}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* ABC */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="font-medium text-xs text-blue-800 mb-1">A — Antecedent</p>
                        <p className="text-xs text-blue-700">{entry.antecedent}</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="font-medium text-xs text-amber-800 mb-1">B — Behaviour</p>
                        <p className="text-xs text-amber-700">{entry.behaviour}</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="font-medium text-xs text-green-800 mb-1">C — Consequence</p>
                        <p className="text-xs text-green-700">{entry.consequence}</p>
                      </div>
                    </div>

                    {/* de-escalation */}
                    <div>
                      <p className="font-medium text-xs mb-1">De-Escalation Techniques Used</p>
                      <div className="flex flex-wrap gap-1">
                        {entry.deEscalationUsed.map((tech, i) => (
                          <Badge key={i} variant="outline" className="bg-purple-50 text-purple-800 text-xs">{tech}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* outcome */}
                    <div>
                      <p className="font-medium text-xs mb-1">Outcome</p>
                      <p className="text-xs text-muted-foreground">{entry.outcome}</p>
                    </div>

                    {/* trigger pattern */}
                    {entry.triggerPattern && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-2">
                        <p className="font-medium text-xs text-purple-800 mb-1 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Identified Trigger Pattern</p>
                        <p className="text-xs text-purple-700">{entry.triggerPattern}</p>
                      </div>
                    )}

                    {/* notes */}
                    {entry.notes && (
                      <div>
                        <p className="font-medium text-xs mb-1">Staff Notes</p>
                        <p className="text-xs text-muted-foreground">{entry.notes}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Behaviour Mapping & ABC Analysis</p>
          <p>Behaviour mapping uses the Antecedent–Behaviour–Consequence (ABC) framework to identify patterns in children&apos;s behaviour. Understanding triggers (antecedents) and what happens after (consequences) allows staff to develop more effective behaviour support plans and de-escalation strategies. The Children&apos;s Homes Regulations 2015 and Quality Standards require that children&apos;s behaviour is understood in the context of their experiences and that responses are therapeutic, not punitive. Behaviour patterns should inform care planning, risk assessment updates, and therapeutic input. Data from behaviour mapping should be reviewed regularly by the RM and shared (appropriately) with CAMHS, social workers, and education professionals. Trends and patterns are more valuable than individual incidents.</p>
        </div>
      </div>
    </PageShell>
  );
}
