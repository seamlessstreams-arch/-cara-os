/**
 * In-memory fallback store for the Intelligence Layer.
 *
 * The intelligence routes (`/api/intelligence/*`) are designed to read/write
 * Supabase when it is configured. In dev/demo environments where Supabase is
 * disabled, those routes used to return empty arrays — forcing pages to embed
 * large hardcoded DEMO_ seed arrays.
 *
 * This module provides a server-side, module-scope, mutable in-memory store
 * pre-seeded with the same demo data so the live update architecture works
 * end-to-end without Supabase.
 */

export interface IntelligenceReg44VisitRow {
  id: string;
  home_id: string;
  visit_date: string;
  visitor_name: string;
  status: string; // reportStatus: scheduled | in_progress | submitted | reviewed | closed
  summary: string | null;
  strengths: string | null;
  concerns: string | null;
  children_views_summary: string | null;
  staff_views_summary: string | null;
  manager_response: string | null;
  ri_response: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntelligenceReg44ActionRow {
  id: string;
  visit_id: string;
  home_id: string;
  title: string;
  description: string;
  priority: string; // low | medium | high | urgent
  assigned_to: string;
  due_date: string;
  status: string; // open | in_progress | overdue | completed
  manager_response: string | null;
  completed_at: string | null;
  evidence_item_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntelligenceReg45ReviewRow {
  id: string;
  home_id: string;
  period_start: string;
  period_end: string;
  status: string; // draft | in_progress | approved | published
  quality_of_care_summary: string | null;
  children_experiences_summary: string | null;
  outcomes_summary: string | null;
  safeguarding_summary: string | null;
  leadership_summary: string | null;
  strengths: string | null;
  weaknesses: string | null;
  improvement_actions: string | null;
  children_views: string | null;
  parents_views: string | null;
  placing_authority_views: string | null;
  staff_views: string | null;
  generated_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntelligenceReg45EvidenceRow {
  id: string;
  home_id: string;
  category: string;
  count: number;
  examples: string[];
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

// ─── Reg 44 visits ───────────────────────────────────────────────────────────
export const reg44Visits: IntelligenceReg44VisitRow[] = [
  {
    id: "v1",
    home_id: "home_oak",
    visit_date: d(-12),
    visitor_name: "Margaret Thornton",
    status: "submitted",
    summary:
      "Monthly unannounced visit conducted. Spoke with three young people and two members of staff. Reviewed daily logs, medication records, and the complaints register. The home presents as warm, personalised, and well-maintained. Young people appeared relaxed and engaged positively with staff.",
    strengths:
      "Excellent key-work sessions observed with detailed records. Young people spoke positively about recent activities including a camping trip. Medication administration records are thorough and up to date. Staff morale appeared high with good teamwork evident during the visit.",
    concerns:
      "One fire drill was missed in the previous month due to a staffing issue. The privacy lock on Bedroom 3 was reported as faulty by the young person. Wi-Fi filtering records had not been reviewed since last month.",
    children_views_summary:
      "All three young people said they feel safe. One young person asked for more variety in evening meals. Another praised the new games room setup. The youngest child shared they enjoy their key-work sessions and feel listened to.",
    staff_views_summary:
      "Staff reported feeling well-supported by the Registered Manager. One staff member raised a concern about the night-shift handover process being too brief. The deputy highlighted positive progress with a complex placement.",
    manager_response: null,
    ri_response: null,
    created_by: "system",
    created_at: d(-12),
    updated_at: d(-12),
  },
  {
    id: "v2",
    home_id: "home_oak",
    visit_date: d(-45),
    visitor_name: "Margaret Thornton",
    status: "reviewed",
    summary:
      "Scheduled visit. Reviewed safeguarding records, supervision logs, and the Statement of Purpose. Met with all young people individually. The home continues to operate to a high standard with strong management oversight.",
    strengths:
      "Supervision records are fully up to date for all staff. The home has implemented a new voice-of-the-child feedback system that young people are engaging with well. Risk assessments have been reviewed following recent incidents and are comprehensive.",
    concerns:
      "Minor maintenance issue with the garden fence panel. One young person expressed frustration about contact arrangements with their social worker. Staff training matrix shows one member is overdue for PRICE refresher.",
    children_views_summary:
      "Young people feel settled. Two expressed interest in having a say in menu planning. One young person was pleased their room had been redecorated.",
    staff_views_summary:
      "Staff felt well-prepared for the recent Ofsted monitoring visit. The team requested additional training on online safety given emerging concerns across the sector.",
    manager_response:
      "Thank you for the thorough visit. The fence panel has been repaired. I have escalated the contact concern to the placing authority. The overdue PRICE training is booked for next week.",
    ri_response:
      "Pleased with the overall quality of care. The manager response addresses all concerns appropriately. I note the proactive approach to online safety training. I will follow up on the contact issue at the next RI visit.",
    created_by: "system",
    created_at: d(-45),
    updated_at: d(-30),
  },
  {
    id: "v3",
    home_id: "home_oak",
    visit_date: d(-75),
    visitor_name: "David Henshaw",
    status: "closed",
    summary:
      "Unannounced visit during evening hours. Observed bedtime routines and evening activities. Reviewed incident logs and restraint records from the previous month.",
    strengths:
      "Bedtime routines were calm and well-structured. Staff used excellent de-escalation skills during a minor disagreement between two young people. Evening activities were age-appropriate and enjoyed by all.",
    concerns:
      "One restraint record lacked the required debrief notes from the young person. The kitchen deep-clean schedule was one week behind.",
    children_views_summary:
      "Young people were relaxed during the visit. One child said evening routines were better since the new rota was introduced. Another asked if they could have later bedtimes at weekends.",
    staff_views_summary:
      "Night staff felt the handover had improved following the manager implementing a structured template. One member asked about career progression opportunities.",
    manager_response:
      "The restraint debrief has now been completed retrospectively. Kitchen deep-clean has been brought up to date. I have reviewed the weekend bedtime request and will discuss with the team.",
    ri_response:
      "All actions addressed promptly. Satisfied with the response to the restraint concern. Will monitor kitchen compliance at next visit.",
    created_by: "system",
    created_at: d(-75),
    updated_at: d(-60),
  },
  {
    id: "v4",
    home_id: "home_oak",
    visit_date: d(-135),
    visitor_name: "Margaret Thornton",
    status: "closed",
    summary:
      "Quarterly themed visit focusing on education and health outcomes. Reviewed PEPs, health assessments, and SDQ scores. Met with the designated education lead and health coordinator.",
    strengths:
      "All PEPs are up to date. School attendance is above 90% for all young people. Health assessments completed within timescales. One young person achieved a significant academic milestone.",
    concerns: "No concerns identified during this visit.",
    children_views_summary:
      "Young people spoke positively about educational support. One child was proud of their recent school award.",
    staff_views_summary:
      "Staff appreciated the themed approach. The education lead felt the home prioritises education well.",
    manager_response:
      "Pleased with the positive findings. We will continue to prioritise educational attainment and health outcomes.",
    ri_response: null,
    created_by: "system",
    created_at: d(-135),
    updated_at: d(-120),
  },
];

// ─── Reg 44 actions ──────────────────────────────────────────────────────────
export const reg44Actions: IntelligenceReg44ActionRow[] = [
  {
    id: "a1",
    visit_id: "v1",
    home_id: "home_oak",
    title: "Conduct missed fire drill",
    description:
      "A fire drill was missed in the previous month. Arrange and complete a fire drill within 7 days, ensuring all young people and staff participate. Record outcomes and any issues identified.",
    priority: "high",
    assigned_to: "Darren Laville (RM)",
    due_date: d(-5),
    status: "overdue",
    manager_response: null,
    completed_at: null,
    evidence_item_id: null,
    created_by: "system",
    created_at: d(-12),
    updated_at: d(-12),
  },
  {
    id: "a2",
    visit_id: "v1",
    home_id: "home_oak",
    title: "Repair privacy lock on Bedroom 3",
    description:
      "The privacy lock on Bedroom 3 has been reported as faulty by the young person. Arrange for repair or replacement to ensure the young person's right to privacy is upheld.",
    priority: "medium",
    assigned_to: "Darren Laville (RM)",
    due_date: d(2),
    status: "in_progress",
    manager_response: "Maintenance contractor booked for this week.",
    completed_at: null,
    evidence_item_id: null,
    created_by: "system",
    created_at: d(-12),
    updated_at: d(-5),
  },
  {
    id: "a3",
    visit_id: "v1",
    home_id: "home_oak",
    title: "Review Wi-Fi filtering records",
    description:
      "Wi-Fi filtering records have not been reviewed since last month. Review and update the filtering logs, ensuring all content restrictions are appropriate and documented.",
    priority: "medium",
    assigned_to: "Ryan Mitchell (Deputy)",
    due_date: d(5),
    status: "open",
    manager_response: null,
    completed_at: null,
    evidence_item_id: null,
    created_by: "system",
    created_at: d(-12),
    updated_at: d(-12),
  },
  {
    id: "a4",
    visit_id: "v2",
    home_id: "home_oak",
    title: "Repair garden fence panel",
    description:
      "Minor maintenance issue with the garden fence panel identified during visit. Repair or replace to maintain secure boundary.",
    priority: "low",
    assigned_to: "Darren Laville (RM)",
    due_date: d(-30),
    status: "completed",
    manager_response:
      "Fence panel repaired by contractor on the day following the visit.",
    completed_at: d(-40),
    evidence_item_id: null,
    created_by: "system",
    created_at: d(-45),
    updated_at: d(-40),
  },
  {
    id: "a5",
    visit_id: "v2",
    home_id: "home_oak",
    title: "Book PRICE refresher training",
    description:
      "One staff member is overdue for PRICE refresher training. Book onto the next available course and confirm date.",
    priority: "high",
    assigned_to: "Darren Laville (RM)",
    due_date: d(-25),
    status: "completed",
    manager_response: "Training booked and completed on target date.",
    completed_at: d(-28),
    evidence_item_id: null,
    created_by: "system",
    created_at: d(-45),
    updated_at: d(-28),
  },
  {
    id: "a6",
    visit_id: "v3",
    home_id: "home_oak",
    title: "Complete retrospective restraint debrief",
    description:
      "One restraint record lacked the required debrief notes from the young person. Complete the debrief and update the restraint record.",
    priority: "urgent",
    assigned_to: "Darren Laville (RM)",
    due_date: d(-70),
    status: "completed",
    manager_response:
      "Debrief completed with the young person. Record updated with their views and feelings about the incident.",
    completed_at: d(-72),
    evidence_item_id: null,
    created_by: "system",
    created_at: d(-75),
    updated_at: d(-72),
  },
];

// ─── Reg 45 reviews ──────────────────────────────────────────────────────────
export const reg45Reviews: IntelligenceReg45ReviewRow[] = [
  {
    id: "r1",
    home_id: "home_oak",
    period_start: "2025-11-01",
    period_end: "2026-04-30",
    status: "draft",
    quality_of_care_summary:
      "The quality of care during this period has been consistently good. The home has maintained a warm, nurturing environment where children feel safe and valued. Key-work sessions have been delivered regularly with detailed, child-centred records. Placement plans have been reviewed within timescales and reflect the individual needs of each young person. The home has successfully managed one new admission and one planned move-on during this period.",
    children_experiences_summary:
      "Children report feeling listened to and cared for. The voice-of-the-child system has been embedded successfully with regular contributions from all young people. Children have participated in menu planning, activity choices, and house meetings. One young person raised concerns about contact arrangements which were promptly addressed. All children have expressed that they feel safe in the home.",
    outcomes_summary:
      "Educational outcomes have been positive with school attendance above 92% for all young people. Two children achieved academic milestones. Health assessments are up to date. SDQ scores show improvement for two out of three young people. Independence skills development is ongoing with age-appropriate targets being met.",
    safeguarding_summary: null,
    leadership_summary: null,
    strengths:
      "Strong key-working relationships. Consistent staffing team. Excellent partnership working with education providers. Proactive approach to training and development. Children feel genuinely listened to and their views shape practice.",
    weaknesses: null,
    improvement_actions: null,
    children_views:
      "All three young people contributed to this review. Key themes include: feeling safe and cared for, wanting more variety in evening activities, appreciation for the camping trip and outdoor activities, positive relationships with key workers. One young person asked for more weekend outings.",
    parents_views:
      "Two parents contributed via telephone consultation. Both expressed satisfaction with the care provided. One parent praised the communication from the home. Another noted improvements in their child's behaviour since placement.",
    placing_authority_views: null,
    staff_views:
      "Staff completed anonymous feedback forms. Key themes: feeling well-supported by management, good team dynamics, appreciation for regular supervision, desire for additional training on adolescent mental health, positive about the new voice-of-the-child system.",
    generated_by: null,
    approved_by: null,
    approved_at: null,
    created_at: "2026-05-01",
    updated_at: "2026-05-03",
  },
  {
    id: "r2",
    home_id: "home_oak",
    period_start: "2025-05-01",
    period_end: "2025-10-31",
    status: "approved",
    quality_of_care_summary:
      "Care quality throughout this period was strong and consistent. The home maintained its child-centred ethos with individualised approaches to each young person. Risk assessments were reviewed promptly following incidents. The Statement of Purpose was updated to reflect the current cohort and staffing. All regulatory notifications were made within required timescales.",
    children_experiences_summary:
      "Children reported positive experiences overall. The home introduced a new feedback mechanism which all children engaged with. House meetings were held monthly with actions followed through. One young person successfully transitioned to a semi-independence placement with planned support.",
    outcomes_summary:
      "Education attendance averaged 91%. Health assessments completed within timescales for all children. Two young people commenced therapeutic interventions. SDQ scores stable or improving for all young people. Pathway planning commenced for the eldest young person with good progress on independence skills.",
    safeguarding_summary:
      "Three safeguarding concerns were raised during the period — all were managed appropriately with timely notifications and multi-agency collaboration. LADO threshold was not met on any occasion. Missing episodes remained low (two instances, both under 30 minutes). Return home interviews completed within 72 hours.",
    leadership_summary:
      "Management oversight has been robust throughout the period. Supervision compliance was 100% with no cancellations by management. The manager completed further development in therapeutic care approaches. The RI conducted regular visits with actions addressed promptly. Ofsted monitoring visit in August 2025 noted continued good practice.",
    strengths:
      "Consistent staff team with low turnover. Robust safeguarding practice. Strong educational outcomes. Effective multi-agency working. Children's voices genuinely influencing practice. Manager oversight visible and embedded.",
    weaknesses:
      "Medication competency training for one staff member delayed. Garden maintenance occasionally falling behind schedule. Evening activity planning could be more varied. Night-shift handover process needed strengthening.",
    improvement_actions:
      "1. All staff to achieve medication competency by end of next period. 2. Implement structured evening activity planner. 3. Revise night-shift handover template and provide training. 4. Establish quarterly garden maintenance contract.",
    children_views:
      "Children reported feeling safe, cared for, and listened to. They appreciated the variety of activities offered and the support with education. One young person gave positive feedback about their move-on support.",
    parents_views:
      "All contactable parents expressed satisfaction. Feedback highlighted good communication from the home and visible improvements in children's wellbeing and behaviour.",
    placing_authority_views:
      "Three placing authorities provided feedback. All rated the home positively. Key themes: good communication, prompt notification of issues, children making progress, effective partnership working. One authority praised the home's approach to a complex safeguarding concern.",
    staff_views:
      "Staff feedback was positive. Team morale is high. Staff feel supported and valued. Key requests included additional therapeutic training and team-building activities.",
    generated_by: "Darren Laville",
    approved_by: "Sarah Mitchell (RI)",
    approved_at: "2025-11-15",
    created_at: "2025-10-20",
    updated_at: "2025-11-15",
  },
];

// ─── Reg 45 evidence ─────────────────────────────────────────────────────────
export const reg45Evidence: IntelligenceReg45EvidenceRow[] = [
  { id: "e1", home_id: "home_oak", category: "Daily Logs", count: 547, examples: ["Positive interactions", "Activity records", "Bedtime routines"] },
  { id: "e2", home_id: "home_oak", category: "Key-Work Sessions", count: 36, examples: ["Individual targets", "Child voice recorded", "Progress noted"] },
  { id: "e3", home_id: "home_oak", category: "Incident Records", count: 8, examples: ["De-escalation successful", "Debrief completed", "Notification sent"] },
  { id: "e4", home_id: "home_oak", category: "Reg 44 Reports", count: 6, examples: ["Monthly visits", "Actions completed", "RI oversight evidenced"] },
  { id: "e5", home_id: "home_oak", category: "Supervision Records", count: 24, examples: ["Monthly for all staff", "Safeguarding discussed", "Wellbeing checks"] },
  { id: "e6", home_id: "home_oak", category: "Health Assessments", count: 6, examples: ["Initial health", "Review health", "Dental checks"] },
  { id: "e7", home_id: "home_oak", category: "Education Records", count: 12, examples: ["PEP reviews", "Attendance data", "Achievement records"] },
  { id: "e8", home_id: "home_oak", category: "Voice of the Child", count: 18, examples: ["House meetings", "Wishes & feelings", "Feedback forms"] },
  { id: "e9", home_id: "home_oak", category: "Training Records", count: 14, examples: ["Mandatory courses", "Specialist training", "Refreshers"] },
  { id: "e10", home_id: "home_oak", category: "Complaints & Compliments", count: 5, examples: ["1 complaint resolved", "4 compliments received"] },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
let idCounter = 1000;
export function nextFallbackId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}
