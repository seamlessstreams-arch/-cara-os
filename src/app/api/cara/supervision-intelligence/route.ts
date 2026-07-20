// ════════════════════════════════════════════════════════════════════════��═════
// API: /api/cara/supervision-intelligence
//
// GET — Analyse supervision patterns for a home
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseSupervisions, type SupervisionRecord } from "@/lib/cara/supervision-intelligence";

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoData() {
  const today = new Date();
  const d = (daysAgo: number) => new Date(today.getTime() - daysAgo * 86400000).toISOString().slice(0, 10);
  const futureD = (daysAhead: number) => new Date(today.getTime() + daysAhead * 86400000).toISOString().slice(0, 10);

  const staffList = [
    { id: "staff_darren", name: "Olivia H" },
    { id: "staff_pat", name: "Pat M" },
    { id: "staff_sarah", name: "Sarah K" },
    { id: "staff_mark", name: "Mark T" },
    { id: "staff_lisa", name: "Lisa J" },
    { id: "staff_tom", name: "Tom R" },
  ];

  const records: SupervisionRecord[] = [
    // Darren — recent, good wellbeing
    {
      id: "sup_1", staffId: "staff_darren", staffName: "Olivia H",
      supervisorId: "staff_manager", supervisorName: "Clare W (RM)",
      date: d(10), type: "formal", durationMinutes: 60,
      themes: ["Practice", "Key Working", "Children's Progress"],
      actionsAgreed: [
        { id: "a1", description: "Complete trauma-informed practice module", dueDate: futureD(14), completed: false, category: "training" },
        { id: "a2", description: "Update Jordan's key work plan", dueDate: d(3), completed: true, completedDate: d(5), category: "practice" },
      ],
      wellbeingScore: 4,
      staffReflection: "Feeling positive about Jordan's progress. Team dynamics good.",
    },
    {
      id: "sup_2", staffId: "staff_darren", staffName: "Olivia H",
      supervisorId: "staff_manager", supervisorName: "Clare W (RM)",
      date: d(52), type: "formal", durationMinutes: 55,
      themes: ["Wellbeing", "Training", "Behaviour Management"],
      actionsAgreed: [
        { id: "a3", description: "Attend de-escalation refresher", dueDate: d(30), completed: true, completedDate: d(35), category: "training" },
      ],
      wellbeingScore: 3,
    },

    // Pat — overdue (last supervision 50 days ago)
    {
      id: "sup_3", staffId: "staff_pat", staffName: "Pat M",
      supervisorId: "staff_manager", supervisorName: "Clare W (RM)",
      date: d(50), type: "formal", durationMinutes: 45,
      themes: ["Recording", "Wellbeing", "Team Dynamics"],
      actionsAgreed: [
        { id: "a4", description: "Improve daily log quality — include child voice", dueDate: d(20), completed: false, category: "practice" },
        { id: "a5", description: "Complete safeguarding refresher", dueDate: d(10), completed: false, category: "training" },
      ],
      wellbeingScore: 2,
      staffReflection: "Feeling stretched. Lots of incidents recently.",
    },

    // Sarah — up to date, great performer
    {
      id: "sup_4", staffId: "staff_sarah", staffName: "Sarah K",
      supervisorId: "staff_manager", supervisorName: "Clare W (RM)",
      date: d(20), type: "formal", durationMinutes: 50,
      themes: ["Practice", "Children's Progress", "Regulation"],
      actionsAgreed: [
        { id: "a6", description: "Lead PACE training for new staff", dueDate: futureD(7), completed: false, category: "professional_development" },
        { id: "a7", description: "Complete Reg 44 prep documentation", dueDate: d(5), completed: true, completedDate: d(8), category: "compliance" },
      ],
      wellbeingScore: 4,
    },

    // Mark — declining wellbeing
    {
      id: "sup_5", staffId: "staff_mark", staffName: "Mark T",
      supervisorId: "staff_manager", supervisorName: "Clare W (RM)",
      date: d(15), type: "formal", durationMinutes: 40,
      themes: ["Wellbeing", "Behaviour Management", "Team Dynamics"],
      actionsAgreed: [
        { id: "a8", description: "Access EAP support", dueDate: futureD(7), completed: false, category: "wellbeing" },
      ],
      wellbeingScore: 2,
      staffReflection: "Finding it difficult after Jordan's recent incidents. Need more support.",
    },
    {
      id: "sup_6", staffId: "staff_mark", staffName: "Mark T",
      supervisorId: "staff_manager", supervisorName: "Clare W (RM)",
      date: d(55), type: "formal", durationMinutes: 45,
      themes: ["Practice", "Key Working"],
      actionsAgreed: [],
      wellbeingScore: 3,
    },

    // Lisa — up to date
    {
      id: "sup_7", staffId: "staff_lisa", staffName: "Lisa J",
      supervisorId: "staff_manager", supervisorName: "Clare W (RM)",
      date: d(25), type: "formal", durationMinutes: 55,
      themes: ["Training", "Safeguarding", "Recording"],
      actionsAgreed: [
        { id: "a9", description: "Complete Level 3 safeguarding training", dueDate: futureD(30), completed: false, category: "training" },
      ],
      wellbeingScore: 4,
    },

    // Tom — very overdue (last was 70 days ago)
    {
      id: "sup_8", staffId: "staff_tom", staffName: "Tom R",
      supervisorId: "staff_manager", supervisorName: "Clare W (RM)",
      date: d(70), type: "formal", durationMinutes: 35,
      themes: ["Recording", "Practice"],
      actionsAgreed: [
        { id: "a10", description: "Improve handover quality", dueDate: d(50), completed: false, category: "practice" },
        { id: "a11", description: "Complete behaviour management training", dueDate: d(40), completed: false, category: "training" },
      ],
      wellbeingScore: 3,
    },
  ];

  return { staffList, records };
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const homeId = req.nextUrl.searchParams.get("homeId") ?? "home_oak";

    // Demo mode (live version would pull from supervision table)
    const { staffList, records } = getDemoData();
    const analysis = analyseSupervisions(records, staffList, homeId);

    return NextResponse.json({ ok: true, data: analysis });
  } catch (err) {
    console.error("[cara/supervision-intelligence] GET error:", err);
    return NextResponse.json({ error: "Failed to analyse supervisions" }, { status: 500 });
  }
}
