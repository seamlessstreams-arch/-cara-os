"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  Clock,
  Sun,
  Moon,
  Coffee,
  BookOpen,
  Heart,
  ArrowUpDown,
  CheckCircle2,
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
interface RoutineSlot {
  time: string;
  activity: string;
  support: string;
  flexibility: string;
}

interface DailyRoutinePlan {
  id: string;
  youngPersonId: string;
  createdBy: string;
  createdDate: string;
  reviewDate: string;
  status: "active" | "under_review";
  weekdayRoutine: RoutineSlot[];
  weekendRoutine: RoutineSlot[];
  sensoryConsiderations: string[];
  transitionSupport: string[];
  childInput: string;
  flexibility: string;
  notes: string;
}

/* ─── seed data ─── */
const plans: DailyRoutinePlan[] = [
  {
    id: "drp_001",
    youngPersonId: "yp_alex",
    createdBy: "staff_anna",
    createdDate: d(-60),
    reviewDate: d(30),
    status: "active",
    weekdayRoutine: [
      { time: "07:00", activity: "Wake-up (alarm clock — Alex self-manages)", support: "Staff available if needed, not intrusive", flexibility: "Can snooze once — 7:15 final" },
      { time: "07:15", activity: "Shower and get dressed", support: "Independent — uniform laid out night before", flexibility: "Alex prefers shower in morning, not evening" },
      { time: "07:45", activity: "Breakfast (kitchen)", support: "Staff present, cereal/toast available, Alex makes own", flexibility: "Can eat in room if feeling overwhelmed (rare)" },
      { time: "08:15", activity: "Leave for school (staff drive)", support: "Quick check: bag, lunch, phone, homework", flexibility: "Walking with friend Kieran on Thursdays" },
      { time: "15:30", activity: "Return from school", support: "Snack available, debrief if Alex wants to talk", flexibility: "Can go to Kieran's with permission (24h notice)" },
      { time: "16:00", activity: "Free time / homework", support: "Staff help with homework if asked", flexibility: "Homework can be done before or after dinner" },
      { time: "17:30", activity: "Dinner (all together)", support: "Family mealtime — phones away", flexibility: "Alex excused if genuinely unwell" },
      { time: "18:00", activity: "Free time / activities", support: "Options offered but not forced", flexibility: "Gaming, reading, garden, TV — Alex's choice" },
      { time: "20:00", activity: "Wind-down begins", support: "Gentle prompt from staff", flexibility: "Can start earlier if tired" },
      { time: "20:45", activity: "Shower if not done in AM, teeth, PJs", support: "Independent", flexibility: "Alex manages own hygiene routine" },
      { time: "21:15", activity: "Reading in bed", support: "Phone charging outside room from now", flexibility: "Can read as long as wants — light off by 21:45" },
      { time: "21:30", activity: "Lights out", support: "Staff says goodnight at door", flexibility: "Can have 15 extra mins on Fridays" },
    ],
    weekendRoutine: [
      { time: "08:00–09:00", activity: "Wake naturally (no alarm)", support: "Breakfast available until 10am", flexibility: "No set wake time — rest is important" },
      { time: "10:00", activity: "Morning activity or free time", support: "Staff offer activity options", flexibility: "Alex can choose to do nothing — that's valid" },
      { time: "12:30", activity: "Lunch", support: "Flexible timing on weekends", flexibility: "Can be later if out with Nan" },
      { time: "Afternoon", activity: "Contact with Nan (monthly) or free time", support: "Transport to Nan's if needed", flexibility: "Alex manages own time at Nan's" },
      { time: "17:30", activity: "Dinner together", support: "Same as weekday", flexibility: "Can be later if returning from activity" },
      { time: "Evening", activity: "Family time / free time", support: "Film night offered Saturdays", flexibility: "No obligation to participate" },
      { time: "22:00", activity: "Bedtime (30min later than weekday)", support: "Same wind-down routine", flexibility: "Consistent — Alex chose this time" },
    ],
    sensoryConsiderations: [
      "Alex not sensory-sensitive — standard environment fine",
      "Prefers quiet for homework (bedroom, not communal area)",
    ],
    transitionSupport: [
      "5-minute warning before transitions (leaving for school, dinner, bedtime)",
      "Visual timer on kitchen wall for shared reference",
      "Alex responds well to predictability — consistency is key",
    ],
    childInput: "Alex helped create this routine and chose the bedtime, homework flexibility, and Thursday walking arrangement. Alex said 'I like knowing what's happening but I don't want to be bossed around.' Reviewed together monthly.",
    flexibility: "This is a guide, not a rigid schedule. If Alex has a bad day, routine adapts. The goal is structure that supports, not controls. Staff use judgement about when flexibility is more important than consistency.",
    notes: "Alex thrives with routine — becomes anxious when things are unpredictable. This plan provides the structure Alex needs while respecting their growing independence. Alex is proud of self-managing their alarm clock and morning routine.",
  },
  {
    id: "drp_002",
    youngPersonId: "yp_jordan",
    createdBy: "staff_anna",
    createdDate: d(-45),
    reviewDate: d(15),
    status: "active",
    weekdayRoutine: [
      { time: "07:00", activity: "Gentle wake (staff knock + verbal — never sudden)", support: "Anna or known staff — never someone unfamiliar. Soft voice. Wait for response.", flexibility: "Jordan may need 10 minutes to orientate — that's OK" },
      { time: "07:15", activity: "Sensory regulation activity (5 min)", support: "Weighted lap pad, stretching, or fidget time", flexibility: "Jordan chooses activity — changes daily" },
      { time: "07:25", activity: "Wash and dress (support as needed)", support: "Staff available outside door. Help with buttons if asked. All clothes soft/tagless.", flexibility: "Jordan may need help on hard days — not a regression" },
      { time: "07:45", activity: "Breakfast (quiet kitchen or bedroom if needed)", support: "Limited choices (not overwhelming). Same bowl/cup. Plain foods.", flexibility: "Can eat in room on high-anxiety days — no judgement" },
      { time: "08:30", activity: "Leave for school (staff drive — same route always)", support: "Same route, same music (calm playlist), minimal talking unless Jordan initiates", flexibility: "If Jordan distressed, 5 min calming before car" },
      { time: "15:15", activity: "Return from school — decompression time", support: "30 minutes ALONE in room. Staff do not disturb. Snack left outside door.", flexibility: "This is non-negotiable — Jordan needs it. Can be longer." },
      { time: "15:45", activity: "Quiet activity (drawing, sensory play, audio book)", support: "Staff available in communal area — Jordan joins when ready", flexibility: "Jordan initiates when ready to be social" },
      { time: "17:30", activity: "Dinner (seated but can leave if overwhelmed)", support: "Jordan's place always same seat. Noise kept low. Simple food.", flexibility: "Can eat separately if group dining too much" },
      { time: "18:00", activity: "Free time — structured options available", support: "Offer 2 choices max (decision fatigue is real for Jordan)", flexibility: "Colouring, garden, TV, baking with staff" },
      { time: "19:30", activity: "Bath/shower (warm, dim lighting, unscented products)", support: "Staff nearby but not in room. Towel warmed on radiator.", flexibility: "Bath preferred on hard days (calming). Shower on OK days." },
      { time: "20:00", activity: "Bedtime routine begins — PJs, teeth, comfort items", support: "Staff sit with Jordan if requested. Weighted blanket. Audio stories.", flexibility: "Routine is sacred — same every night. Predictability = safety." },
      { time: "20:30", activity: "In bed — audio book or rain sounds", support: "Night light ON (never off). Door ajar. Staff check in 15 min.", flexibility: "Jordan may not sleep until later — rest is enough" },
      { time: "21:00", activity: "Target lights-out (may be later)", support: "Staff check. If awake, brief reassurance then leave.", flexibility: "Never forced to sleep — pressure worsens insomnia" },
    ],
    weekendRoutine: [
      { time: "Natural waking", activity: "No alarm — Jordan wakes naturally", support: "Breakfast available when ready (same food, same bowl)", flexibility: "May sleep until 9am — that's fine and needed" },
      { time: "Morning", activity: "Low-demand activities — sensory, drawing, garden", support: "Staff follow Jordan's lead entirely", flexibility: "Weekends are lower-demand by design" },
      { time: "12:00", activity: "Lunch (simple, predictable)", support: "Same principles as weekday meals", flexibility: "Flexible timing" },
      { time: "Afternoon", activity: "Sibling contact (Tyler — monthly) or quiet day", support: "Activity-based contact at soft play or park", flexibility: "Jordan can end contact early if overwhelmed" },
      { time: "17:30", activity: "Dinner", support: "Same as weekday", flexibility: "Same as weekday" },
      { time: "Evening", activity: "Calm activities only — no stimulating content/games", support: "Staff offer baking, sensory activity, colouring", flexibility: "Jordan often asks to help bake — a connecting activity" },
      { time: "21:00", activity: "Bedtime (30 min later)", support: "Same routine — just later start", flexibility: "Consistency even on weekends important for Jordan" },
    ],
    sensoryConsiderations: [
      "No strong scents (cleaning products, cooking smells can trigger)",
      "Soft fabrics only — no tags, no rough textures",
      "Noise levels kept low — advance warning of loud activities",
      "Dim lighting preferred — no harsh fluorescents",
      "Same cup, plate, seat, position every time — sameness = safety",
      "Approach from front with verbal warning — never from behind",
    ],
    transitionSupport: [
      "10-minute warning, 5-minute warning, 1-minute warning before every transition",
      "Visual schedule on Jordan's wall — photos not words",
      "Now/Next board used throughout the day",
      "Timer visible for any timed activity (not hidden)",
      "Transitions are the hardest part of Jordan's day — allow extra time always",
      "If transition fails, return to previous activity and try again in 5 min",
    ],
    childInput: "Jordan contributed to this plan through 1:1 work with Anna using symbols and choices. Jordan chose the bath/shower preference, the bedroom eating option, and the decompression time after school. Jordan said (via communication board): 'I need my quiet time. Don't take it away.'",
    flexibility: "Jordan's routine is more structured than other children's because predictability is a core therapeutic need. However, 'structure' means 'consistent and expected' not 'rigid and inflexible.' On bad days, expectations reduce. The routine is a scaffold, not a cage.",
    notes: "This plan was developed in consultation with Jordan's OT, therapist, and previous placement. Every element has a therapeutic rationale. Staff must understand WHY the routine matters — it's not about rules, it's about creating felt safety for a child whose early life was chaotic and unpredictable.",
  },
  {
    id: "drp_003",
    youngPersonId: "yp_casey",
    createdBy: "staff_chervelle",
    createdDate: d(-30),
    reviewDate: d(60),
    status: "active",
    weekdayRoutine: [
      { time: "07:15", activity: "Wake-up (phone alarm — Casey self-manages entirely)", support: "Staff knock once at 7:30 if not up. No nagging.", flexibility: "Casey is 15 — trusted to manage own morning" },
      { time: "07:30", activity: "Shower, dress, sort self out", support: "Fully independent. Staff don't hover.", flexibility: "Casey's routine, Casey's way" },
      { time: "07:50", activity: "Breakfast (cereal, toast — self-serve)", support: "Casey makes own breakfast. Chat with staff if they want.", flexibility: "Can grab something quick if running late" },
      { time: "08:15", activity: "Leave for school (bus — independent)", support: "Bus pass kept by Casey. Staff wave goodbye.", flexibility: "Casey travels independently — graduated freedom earned" },
      { time: "15:45", activity: "Home from school", support: "Brief 'how was your day' — Casey can engage or not", flexibility: "May go to friend's house with notice — that's fine" },
      { time: "16:00–17:30", activity: "Free time — gaming, phone, chill", support: "Not structured. Casey earns this autonomy.", flexibility: "Total freedom in this window — Casey's own time" },
      { time: "17:30", activity: "Dinner together", support: "Casey expected at table — community time", flexibility: "Can be excused early if genuine reason" },
      { time: "18:00", activity: "Free time / homework / activities", support: "Staff available if wanted. Not imposed.", flexibility: "Casey manages own homework schedule" },
      { time: "21:30", activity: "Gaming off (Casey sets own alarm for this)", support: "Trust-based — Casey manages this themselves now", flexibility: "Was staff-managed, now self-managed. Huge progress." },
      { time: "22:00", activity: "Phone on Do Not Disturb, shower, wind down", support: "Casey activates DND themselves", flexibility: "Self-managed — took 3 months to build to this" },
      { time: "22:30", activity: "Bed — music or podcast", support: "Staff check-in (brief — 'night Casey')", flexibility: "Casey's bedtime appropriate for age 15" },
    ],
    weekendRoutine: [
      { time: "Whenever", activity: "Wake naturally — no set time", support: "Breakfast available until 11am", flexibility: "Casey might sleep until 10 — normal for a 15-year-old" },
      { time: "Morning/Afternoon", activity: "Casey's plans — friends, gaming, out, or nothing", support: "Staff know where Casey is but don't control", flexibility: "Casey manages own social life with minimal oversight" },
      { time: "17:30", activity: "Dinner (if home — Casey sometimes eats at Jade's)", support: "Let staff know if not eating at home", flexibility: "Autonomy about where to eat — normal for 15yo" },
      { time: "Evening", activity: "Free — gaming, TV, phone", support: "Staff around for chat if wanted", flexibility: "Casey increasingly independent" },
      { time: "23:00", activity: "Bedtime (1hr later weekends)", support: "Same DND/wind-down routine", flexibility: "Appropriate for age and day after" },
    ],
    sensoryConsiderations: [
      "No sensory needs identified — Casey is neurotypical",
      "Prefers personal space respected — staff knock, wait, enter",
    ],
    transitionSupport: [
      "Casey doesn't need transition support — age-appropriate executive function",
      "Verbal reminders appreciated (not demanded): 'dinner in 10 if you want it'",
      "Casey responds better to invitations than instructions",
    ],
    childInput: "Casey co-authored this routine entirely. Casey's key phrase: 'Just treat me like a normal teenager.' The progression from staff-managed to self-managed gaming/phone/bedtime was Casey's idea and has been a major success. Casey said: 'When you trust me, I actually do the right thing.'",
    flexibility: "Casey's routine is deliberately the least structured. At 15 with no additional needs, Casey should be managing most of their own life. Staff provide the safety net, not the structure. Casey has earned trust through consistent responsible behaviour. The routine will continue to loosen as Casey approaches 16.",
    notes: "Casey's routine reflects their age and capacity. Compared to when Casey arrived (high structure, staff-managed everything, resistance and conflict), the current self-managed approach has resulted in fewer incidents, better relationships with staff, and improved school attendance. Trust breeds responsibility.",
  },
];

/* ─── export columns ─── */
const exportCols: ExportColumn<DailyRoutinePlan>[] = [
  { header: "Young Person", accessor: (r: DailyRoutinePlan) => getYPName(r.youngPersonId) },
  { header: "Created By", accessor: (r: DailyRoutinePlan) => getStaffName(r.createdBy) },
  { header: "Created", accessor: (r: DailyRoutinePlan) => r.createdDate },
  { header: "Review Due", accessor: (r: DailyRoutinePlan) => r.reviewDate },
  { header: "Status", accessor: (r: DailyRoutinePlan) => r.status.replace("_", " ") },
  { header: "Weekday Steps", accessor: (r: DailyRoutinePlan) => r.weekdayRoutine.length.toString() },
  { header: "Weekend Steps", accessor: (r: DailyRoutinePlan) => r.weekendRoutine.length.toString() },
  { header: "Sensory Needs", accessor: (r: DailyRoutinePlan) => r.sensoryConsiderations.length.toString() },
  { header: "Child Input", accessor: (r: DailyRoutinePlan) => r.childInput },
];

/* ─── component ─── */
export default function DailyRoutinePlansPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState("all");
  const [viewMode, setViewMode] = useState<"weekday" | "weekend">("weekday");

  const filtered = useMemo(() => {
    let list = [...plans];
    if (filterYP !== "all") list = list.filter((r) => r.youngPersonId === filterYP);
    return list;
  }, [filterYP]);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <PageShell
      title="Daily Routine Plans"
      subtitle="Personalised daily structures for each young person — predictability, choice, and age-appropriate independence"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={plans} columns={exportCols} filename="daily-routine-plans" />
          <PrintButton title="Daily Routine Plans" />
        </div>
      }
    >
      {/* ─── key principle ─── */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <Heart className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Individualised, Not Institutional</p>
            <p className="text-xs text-blue-700 mt-1">
              Every child&apos;s routine is different because every child is different. Routines are
              co-produced with children, adapted to their needs, and regularly reviewed. Structure
              provides safety — not control. A good routine says &quot;we thought about what YOU
              need&quot; not &quot;everyone does the same thing.&quot;
            </p>
          </div>
        </div>
      </div>

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterYP}
          onChange={(e) => setFilterYP(e.target.value)}
        >
          <option value="all">All Young People</option>
          <option value="yp_alex">Alex</option>
          <option value="yp_jordan">Jordan</option>
          <option value="yp_casey">Casey</option>
        </select>

        <div className="flex items-center gap-1 ml-auto border rounded-md overflow-hidden">
          <button
            className={cn("px-3 py-1.5 text-sm", viewMode === "weekday" ? "bg-blue-100 text-blue-800" : "bg-white")}
            onClick={() => setViewMode("weekday")}
          >
            Weekday
          </button>
          <button
            className={cn("px-3 py-1.5 text-sm", viewMode === "weekend" ? "bg-blue-100 text-blue-800" : "bg-white")}
            onClick={() => setViewMode("weekend")}
          >
            Weekend
          </button>
        </div>
      </div>

      {/* ─── routine cards ─── */}
      <div className="space-y-4">
        {filtered.map((plan) => {
          const expanded = expandedId === plan.id;
          const routine = viewMode === "weekday" ? plan.weekdayRoutine : plan.weekendRoutine;

          return (
            <Card key={plan.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(plan.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{getYPName(plan.youngPersonId)}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-green-100 text-green-800">{plan.status === "active" ? "Active" : "Under Review"}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {plan.weekdayRoutine.length} weekday steps · {plan.weekendRoutine.length} weekend steps
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Review Due</p>
                      <p className="text-sm">{plan.reviewDate}</p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* routine timeline */}
                  <div>
                    <p className="text-sm font-medium mb-3 flex items-center gap-1">
                      {viewMode === "weekday" ? <Sun className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
                      {viewMode === "weekday" ? "Weekday" : "Weekend"} Routine
                    </p>
                    <div className="space-y-2">
                      {routine.map((slot, idx) => (
                        <div key={idx} className="flex items-start gap-3 border-l-2 border-blue-200 pl-3 py-1">
                          <div className="min-w-[60px]">
                            <span className="text-xs font-mono font-medium text-blue-700">{slot.time}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{slot.activity}</p>
                            {slot.support && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                <span className="font-medium">Support:</span> {slot.support}
                              </p>
                            )}
                            {slot.flexibility && (
                              <p className="text-xs text-green-700 mt-0.5">
                                <span className="font-medium">Flex:</span> {slot.flexibility}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* sensory considerations */}
                  {plan.sensoryConsiderations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Sensory Considerations</p>
                      <ul className="space-y-1">
                        {plan.sensoryConsiderations.map((sc, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-purple-400 mt-1.5">•</span> {sc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* transition support */}
                  <div>
                    <p className="text-sm font-medium mb-2">Transition Support</p>
                    <ul className="space-y-1">
                      {plan.transitionSupport.map((ts, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-400 mt-1.5">•</span> {ts}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* child input */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Child&apos;s Input
                    </p>
                    <p className="text-sm text-green-700">{plan.childInput}</p>
                  </div>

                  {/* flexibility statement */}
                  <div>
                    <p className="text-sm font-medium mb-1">Flexibility Statement</p>
                    <p className="text-sm text-muted-foreground">{plan.flexibility}</p>
                  </div>

                  {/* notes */}
                  <div className="bg-muted/30 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Staff Notes</p>
                    <p className="text-sm text-muted-foreground">{plan.notes}</p>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Created By</p>
                      <p className="text-sm font-medium">{getStaffName(plan.createdBy)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">{plan.createdDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Review</p>
                      <p className="text-sm font-medium">{plan.reviewDate}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          Quality Standard 1 (Child-Centred Care) requires that daily life in the home is organised
          around the individual needs of each child. Regulation 6 (Quality and Purpose of Care)
          requires that care meets each child&apos;s needs as set out in their placement plan.
          Routines should be personalised, age-appropriate, and promote independence while providing
          the predictability that children who have experienced trauma need. Ofsted examines whether
          daily life feels &quot;homely&quot; and individualised, not institutional or one-size-fits-all.
        </p>
      </div>
    </PageShell>
  );
}
