// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/training-compliance
//
// GET — Analyse training compliance for home staff
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseTrainingCompliance, type StaffTrainingRecord } from "@/lib/cara/training-compliance";

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoData(): StaffTrainingRecord[] {
  const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
  const fd = (daysAhead: number) => new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);

  return [
    {
      staffId: "staff_sarah",
      staffName: "Sarah T",
      role: "senior",
      startDate: d(730), // 2 years ago
      trainings: [
        { id: "t1", courseId: "c_sg", courseName: "Safeguarding Level 3", category: "safeguarding", completedDate: d(60), expiryDate: fd(305), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t2", courseId: "c_fa", courseName: "First Aid at Work", category: "first_aid", completedDate: d(200), expiryDate: fd(165), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t3", courseId: "c_fs", courseName: "Fire Safety", category: "fire_safety", completedDate: d(90), expiryDate: fd(275), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t4", courseId: "c_med", courseName: "Medication Administration", category: "medication", completedDate: d(120), expiryDate: fd(245), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t5", courseId: "c_pi", courseName: "Physical Intervention", category: "restraint", completedDate: d(150), expiryDate: fd(215), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t6", courseId: "c_mh", courseName: "Mental Health Awareness", category: "mental_health", completedDate: d(180), status: "completed", mandatory: false },
        { id: "t7", courseId: "c_dp", courseName: "Data Protection / GDPR", category: "data_protection", completedDate: d(300), expiryDate: fd(65), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t8", courseId: "c_ed", courseName: "Equality & Diversity", category: "equality_diversity", completedDate: d(200), status: "completed", mandatory: true },
      ],
      qualifications: [
        { id: "q1", name: "Level 3 Diploma in Residential Childcare", level: "L3", status: "completed" },
        { id: "q2", name: "Level 5 Diploma in Leadership", level: "L5", status: "in_progress", progress: 65, expectedCompletion: fd(180) },
      ],
    },
    {
      staffId: "staff_mike",
      staffName: "Mike R",
      role: "residential",
      startDate: d(540),
      trainings: [
        { id: "t9", courseId: "c_sg", courseName: "Safeguarding Level 3", category: "safeguarding", completedDate: d(45), expiryDate: fd(320), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t10", courseId: "c_fa", courseName: "First Aid at Work", category: "first_aid", completedDate: d(330), expiryDate: d(5), status: "expired", mandatory: true, renewalMonths: 12 },
        { id: "t11", courseId: "c_fs", courseName: "Fire Safety", category: "fire_safety", completedDate: d(100), expiryDate: fd(265), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t12", courseId: "c_med", courseName: "Medication Administration", category: "medication", completedDate: d(180), expiryDate: fd(185), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t13", courseId: "c_pi", courseName: "Physical Intervention", category: "restraint", completedDate: d(200), expiryDate: fd(25), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t14", courseId: "c_dp", courseName: "Data Protection / GDPR", category: "data_protection", completedDate: d(300), expiryDate: d(30), status: "expired", mandatory: true, renewalMonths: 12 },
        { id: "t15", courseId: "c_ed", courseName: "Equality & Diversity", category: "equality_diversity", completedDate: d(200), status: "completed", mandatory: true },
      ],
      qualifications: [
        { id: "q3", name: "Level 3 Diploma in Residential Childcare", level: "L3", status: "completed" },
      ],
    },
    {
      staffId: "staff_emma",
      staffName: "Emma L",
      role: "senior",
      startDate: d(900),
      trainings: [
        { id: "t16", courseId: "c_sg", courseName: "Safeguarding Level 3", category: "safeguarding", completedDate: d(30), expiryDate: fd(335), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t17", courseId: "c_fa", courseName: "First Aid at Work", category: "first_aid", completedDate: d(100), expiryDate: fd(265), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t18", courseId: "c_fs", courseName: "Fire Safety", category: "fire_safety", completedDate: d(60), expiryDate: fd(305), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t19", courseId: "c_med", courseName: "Medication Administration", category: "medication", completedDate: d(90), expiryDate: fd(275), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t20", courseId: "c_pi", courseName: "Physical Intervention", category: "restraint", completedDate: d(120), expiryDate: fd(245), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t21", courseId: "c_mh", courseName: "Mental Health Awareness", category: "mental_health", completedDate: d(150), status: "completed", mandatory: false },
        { id: "t22", courseId: "c_dp", courseName: "Data Protection / GDPR", category: "data_protection", completedDate: d(200), expiryDate: fd(165), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t23", courseId: "c_ed", courseName: "Equality & Diversity", category: "equality_diversity", completedDate: d(100), status: "completed", mandatory: true },
        { id: "t24", courseId: "c_fh", courseName: "Food Hygiene Level 2", category: "food_hygiene", completedDate: d(200), status: "completed", mandatory: false },
      ],
      qualifications: [
        { id: "q4", name: "Level 3 Diploma in Residential Childcare", level: "L3", status: "completed" },
        { id: "q5", name: "Level 5 Diploma in Leadership", level: "L5", status: "completed" },
      ],
    },
    {
      staffId: "staff_james",
      staffName: "James K",
      role: "residential",
      startDate: d(60), // New starter (within 90 days)
      trainings: [
        { id: "t25", courseId: "c_sg", courseName: "Safeguarding Level 3", category: "safeguarding", completedDate: d(14), expiryDate: fd(351), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t26", courseId: "c_fa", courseName: "First Aid at Work", category: "first_aid", status: "booked", mandatory: true, renewalMonths: 12 },
        { id: "t27", courseId: "c_fs", courseName: "Fire Safety", category: "fire_safety", completedDate: d(7), expiryDate: fd(358), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t28", courseId: "c_med", courseName: "Medication Administration", category: "medication", status: "not_started", mandatory: true, renewalMonths: 12 },
        { id: "t29", courseId: "c_pi", courseName: "Physical Intervention", category: "restraint", status: "booked", mandatory: true, renewalMonths: 12 },
        { id: "t30", courseId: "c_dp", courseName: "Data Protection / GDPR", category: "data_protection", completedDate: d(50), expiryDate: fd(315), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t31", courseId: "c_ed", courseName: "Equality & Diversity", category: "equality_diversity", completedDate: d(55), status: "completed", mandatory: true },
      ],
      qualifications: [
        { id: "q6", name: "Level 3 Diploma in Residential Childcare", level: "L3", status: "in_progress", progress: 20, expectedCompletion: fd(540) },
      ],
    },
    {
      staffId: "staff_lisa",
      staffName: "Lisa M",
      role: "residential",
      startDate: d(400),
      trainings: [
        { id: "t32", courseId: "c_sg", courseName: "Safeguarding Level 3", category: "safeguarding", completedDate: d(80), expiryDate: fd(285), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t33", courseId: "c_fa", courseName: "First Aid at Work", category: "first_aid", completedDate: d(150), expiryDate: fd(215), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t34", courseId: "c_fs", courseName: "Fire Safety", category: "fire_safety", completedDate: d(50), expiryDate: fd(315), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t35", courseId: "c_med", courseName: "Medication Administration", category: "medication", completedDate: d(100), expiryDate: fd(265), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t36", courseId: "c_pi", courseName: "Physical Intervention", category: "restraint", completedDate: d(130), expiryDate: fd(235), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t37", courseId: "c_dp", courseName: "Data Protection / GDPR", category: "data_protection", completedDate: d(200), expiryDate: fd(165), status: "completed", mandatory: true, renewalMonths: 12 },
        { id: "t38", courseId: "c_ed", courseName: "Equality & Diversity", category: "equality_diversity", completedDate: d(300), status: "completed", mandatory: true },
        { id: "t39", courseId: "c_ic", courseName: "Infection Control", category: "infection_control", completedDate: d(200), status: "completed", mandatory: false },
      ],
      qualifications: [
        { id: "q7", name: "Level 3 Diploma in Residential Childcare", level: "L3", status: "completed" },
      ],
    },
  ];
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const homeId = req.nextUrl.searchParams.get("homeId") ?? "home_oak";
    const records = getDemoData();
    const analysis = analyseTrainingCompliance(records, homeId);

    return NextResponse.json({ ok: true, data: analysis });
  } catch (err) {
    console.error("[cara/training-compliance] GET error:", err);
    return NextResponse.json({ error: "Failed to analyse training compliance" }, { status: 500 });
  }
}
