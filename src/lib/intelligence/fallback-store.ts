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

import { isLiveTenant } from "@/lib/db/live-mode";

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
    assigned_to: "staff_darren",
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
    assigned_to: "staff_darren",
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
    assigned_to: "staff_ryan",
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
    assigned_to: "staff_darren",
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
    assigned_to: "staff_darren",
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
    assigned_to: "staff_darren",
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
    generated_by: "Olivia Hayes",
    approved_by: "Patricia Nolan (RI)",
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

// ─── Incident Learning Reviews ───────────────────────────────────────────────

export interface IntelligenceLearningReviewRow {
  id: string;
  home_id: string;
  child_id: string;
  incident_id: string;
  incident_date: string;
  incident_title: string;
  incident_category: string;
  severity: string; // low | medium | high | critical
  summary: string;
  staff_involved: string[];
  review_status: string; // required | in_progress | completed
  manager_notes: string;
  learning_summary: string;
  trigger_analysis: string | null;
  created_at: string;
  updated_at: string;
}

export const incidentLearningReviews: IntelligenceLearningReviewRow[] = [
  {
    id: "inc-1",
    home_id: "home_oak",
    child_id: "Child A",
    incident_id: "inc-1",
    incident_date: "2026-05-04",
    incident_title: "Physical intervention during peer conflict",
    incident_category: "Physical Intervention",
    severity: "high",
    summary:
      "Staff intervened using Team Teach holds after Child A attempted to assault Child B in the lounge. De-escalation attempted for 8 minutes prior. Hold lasted 3 minutes. Child calmed and went to quiet room.",
    staff_involved: ["Samuel Boateng", "Daniel Frost"],
    review_status: "required",
    manager_notes: "",
    learning_summary: "",
    trigger_analysis: null,
    created_at: "2026-05-04",
    updated_at: "2026-05-04",
  },
  {
    id: "inc-2",
    home_id: "home_oak",
    child_id: "Child B",
    incident_id: "inc-2",
    incident_date: "2026-05-03",
    incident_title: "Absent without permission - 45 minutes",
    incident_category: "Missing Episode",
    severity: "medium",
    summary:
      "Child B left the home without informing staff at 19:30. Located at local park by staff at 20:15. Returned willingly. No safeguarding concerns identified.",
    staff_involved: ["Tom Walker"],
    review_status: "in_progress",
    manager_notes:
      "Need to review whether boundary agreements are clear enough. Check if there is a pattern around evening times.",
    learning_summary: "",
    trigger_analysis: null,
    created_at: "2026-05-03",
    updated_at: "2026-05-03",
  },
  {
    id: "inc-3",
    home_id: "home_oak",
    child_id: "Child A",
    incident_id: "inc-3",
    incident_date: "2026-05-01",
    incident_title: "Property damage - bedroom door",
    incident_category: "Property Damage",
    severity: "medium",
    summary:
      "Child A kicked bedroom door causing damage to frame. Triggered by being asked to turn off gaming console at agreed bedtime. No injury. Child apologised next morning.",
    staff_involved: ["Daniel Frost"],
    review_status: "required",
    manager_notes: "",
    learning_summary: "",
    trigger_analysis: null,
    created_at: "2026-05-01",
    updated_at: "2026-05-01",
  },
  {
    id: "inc-4",
    home_id: "home_oak",
    child_id: "Child C",
    incident_id: "inc-4",
    incident_date: "2026-04-28",
    incident_title: "Verbal aggression towards staff",
    incident_category: "Verbal Aggression",
    severity: "low",
    summary:
      "Child C became verbally aggressive during homework time, using threatening language towards staff. Staff maintained calm approach. Child de-escalated within 10 minutes and completed work.",
    staff_involved: ["Samuel Boateng"],
    review_status: "completed",
    manager_notes:
      "Discussed with Samuel. His calm response was excellent. Child struggles with transitions — consider visual timer for homework sessions.",
    learning_summary:
      "Visual timers to be trialled for homework transitions. Staff response was proportionate and effective. No concerns raised.",
    trigger_analysis: null,
    created_at: "2026-04-28",
    updated_at: "2026-04-28",
  },
  {
    id: "inc-5",
    home_id: "home_oak",
    child_id: "Child B",
    incident_id: "inc-5",
    incident_date: "2026-04-25",
    incident_title: "Self-harm disclosure during key work",
    incident_category: "Safeguarding",
    severity: "critical",
    summary:
      "During key work session, Child B disclosed historical self-harm. No current marks observed. Child stated they feel safer now. CAMHS referral discussed and agreed.",
    staff_involved: ["Daniel Frost", "Tom Walker"],
    review_status: "in_progress",
    manager_notes:
      "CAMHS referral made same day. Placement plan updated. Supervision scheduled with Daniel to debrief.",
    learning_summary: "",
    trigger_analysis: null,
    created_at: "2026-04-25",
    updated_at: "2026-04-25",
  },
];

// ─── Voice of the Child entries ──────────────────────────────────────────────

export interface IntelligenceVoiceEntryRow {
  id: string;
  home_id: string;
  child_id: string;
  entry_date: string;
  category: string;
  child_words: string;
  summary: string;
  action_taken: string;
  staff_response: string;
  created_by: string; // staff member name
  linked_record_id: string | null;
  linked_record_type: string | null;
  created_at: string;
}

export const voiceEntries: IntelligenceVoiceEntryRow[] = [
  {
    id: "v1",
    home_id: "home_oak",
    child_id: "child-a",
    entry_date: "2026-05-04",
    category: "wishes_and_feelings",
    child_words: "I want to see my nan more. She always makes me feel calm and I miss her Sunday dinners.",
    summary: "Child expressed wish for increased contact with maternal grandmother.",
    action_taken: "Contact schedule reviewed. Additional fortnightly face-to-face visit arranged alongside weekly video calls.",
    staff_response: "We hear you. We have arranged an extra visit with your nan every two weeks. Would you like to help plan what you do together?",
    created_by: "Daniel Frost",
    linked_record_id: "Placement Plan - Family Time section",
    linked_record_type: "placement_plan",
    created_at: "2026-05-04",
  },
  {
    id: "v2",
    home_id: "home_oak",
    child_id: "child-a",
    entry_date: "2026-05-02",
    category: "food",
    child_words: "The food has been really good this week. I loved the pasta bake on Tuesday.",
    summary: "Positive feedback about meals this week.",
    action_taken: "Recipe added to regular rotation. Child invited to help cook next week.",
    staff_response: "That is great to hear! We will make sure we have pasta bake regularly. Would you like to help make it next Tuesday?",
    created_by: "Tom Walker",
    linked_record_id: null,
    linked_record_type: null,
    created_at: "2026-05-02",
  },
  {
    id: "v3",
    home_id: "home_oak",
    child_id: "child-a",
    entry_date: "2026-04-30",
    category: "safety",
    child_words: "I feel safe here now. I did not feel safe at my last place but here the staff actually listen.",
    summary: "Child expressed feeling safe at current placement. Positive comparison to previous placement.",
    action_taken: "Recorded as positive outcome. Shared with social worker (with consent). Discussed what makes them feel safe to inform practice.",
    staff_response: "We are so glad you feel safe here. That is really important to us. We will always listen to you.",
    created_by: "Daniel Frost",
    linked_record_id: "LAC Review - Safety & Wellbeing",
    linked_record_type: "lac_review",
    created_at: "2026-04-30",
  },
  {
    id: "v4",
    home_id: "home_oak",
    child_id: "child-a",
    entry_date: "2026-04-27",
    category: "activity",
    child_words: "Can we go swimming more? I used to go with my dad and it makes me feel happy.",
    summary: "Request for more swimming. Connection to positive memories with father.",
    action_taken: "Weekly swimming session arranged at local pool. Exploring whether father contact could include swimming as shared activity.",
    staff_response: "We would love to take you swimming more. How about every Saturday morning? We are also talking to your social worker about whether your dad could take you sometimes.",
    created_by: "Samuel Boateng",
    linked_record_id: "Activity Plan",
    linked_record_type: "activity_plan",
    created_at: "2026-04-27",
  },
  {
    id: "v5",
    home_id: "home_oak",
    child_id: "child-a",
    entry_date: "2026-04-25",
    category: "complaint",
    child_words: "I do not like being told to go to bed so early. None of my friends have to be in bed by nine.",
    summary: "Complaint about bedtime. Child feels it is too early compared to peers.",
    action_taken: "Bedtime reviewed in consultation with child. Agreed 9:30pm on school nights, 10pm on weekends. Reading time in room from 9pm.",
    staff_response: "We have heard your views and we have adjusted your bedtime. You can read in your room from 9pm and lights out at 9:30 on school nights.",
    created_by: "Daniel Frost",
    linked_record_id: "House Rules Review",
    linked_record_type: "house_rules",
    created_at: "2026-04-25",
  },
  {
    id: "v6",
    home_id: "home_oak",
    child_id: "child-a",
    entry_date: "2026-04-22",
    category: "relationship_with_staff",
    child_words: "Samuel is really sound. He does not talk to me like I am a little kid. He actually gets it.",
    summary: "Positive feedback about relationship with staff member Samuel.",
    action_taken: "Shared with Samuel (with consent). Noted in supervision. Highlights importance of age-appropriate communication.",
    staff_response: "Samuel will be pleased to hear that. It is important to us that you feel respected and understood.",
    created_by: "Daniel Frost",
    linked_record_id: null,
    linked_record_type: null,
    created_at: "2026-04-22",
  },
  {
    id: "v7",
    home_id: "home_oak",
    child_id: "child-a",
    entry_date: "2026-04-19",
    category: "bedroom",
    child_words: "Can I get some new posters for my room? I want to make it feel more like mine.",
    summary: "Request to personalise bedroom space.",
    action_taken: "Budget of twenty pounds allocated from personalisation fund. Shopping trip planned for weekend.",
    staff_response: "Absolutely! Your room should feel like yours. We have some money set aside for exactly this. Shall we go shopping on Saturday?",
    created_by: "Tom Walker",
    linked_record_id: null,
    linked_record_type: null,
    created_at: "2026-04-19",
  },
  {
    id: "v8",
    home_id: "home_oak",
    child_id: "child-a",
    entry_date: "2026-04-16",
    category: "education",
    child_words: "School is getting better. My new tutor actually explains things properly and does not shout.",
    summary: "Positive feedback about educational progress and tutor relationship.",
    action_taken: "Positive update shared with Virtual School. Tutor arrangement confirmed as ongoing.",
    staff_response: "That is brilliant news. We are really proud of how hard you have been working. Keep it up.",
    created_by: "Samuel Boateng",
    linked_record_id: "PEP - Education Progress",
    linked_record_type: "pep",
    created_at: "2026-04-16",
  },
  {
    id: "v9",
    home_id: "home_oak",
    child_id: "child-a",
    entry_date: "2026-04-12",
    category: "house_meeting",
    child_words: "I think we should have a movie night every Friday. Everyone in the house would like it.",
    summary: "Suggestion for weekly house activity raised at house meeting.",
    action_taken: "Voted on at house meeting - all young people agreed. Friday Movie Night added to weekly schedule from following week.",
    staff_response: "Great idea! Everyone voted yes so Friday Movie Night starts this week. You can take turns choosing the film.",
    created_by: "Daniel Frost",
    linked_record_id: null,
    linked_record_type: null,
    created_at: "2026-04-12",
  },
  {
    id: "v10",
    home_id: "home_oak",
    child_id: "child-a",
    entry_date: "2026-04-08",
    category: "general_wellbeing",
    child_words: "I am feeling a lot better than when I first came here. Things are not perfect but they are getting better.",
    summary: "Reflective statement about overall progress and wellbeing improvement.",
    action_taken: "Recorded as significant positive self-reflection. Discussed in key work what has helped. Shared at LAC review.",
    staff_response: "It takes courage to say that. You have worked really hard and we can see how far you have come. We are here for whatever comes next.",
    created_by: "Daniel Frost",
    linked_record_id: "Key Work Session - April",
    linked_record_type: "key_work",
    created_at: "2026-04-08",
  },
];

// ─── Child Progress goals / entries / outcome snapshots ─────────────────────

export interface IntelligenceProgressGoalRow {
  id: string;
  home_id: string;
  child_id: string;
  title: string;
  goal_area: string;
  description: string;
  target_date: string;
  status: string; // on_track | at_risk | achieved | not_started
  progress: number; // 0-100
  created_at: string;
}

export interface IntelligenceProgressEntryRow {
  id: string;
  home_id: string;
  child_id: string;
  entry_date: string;
  area: string;
  what_happened: string;
  impact_on_child: string;
  staff_member: string;
  created_at: string;
}

export interface IntelligenceOutcomeSnapshotRow {
  id: string;
  home_id: string;
  child_id: string;
  snapshot_date: string;
  education_score: number;
  education_previous_score: number;
  education_trend: string; // up | down | stable
  health_score: number;
  health_previous_score: number;
  health_trend: string;
  emotional_wellbeing_score: number;
  emotional_wellbeing_previous_score: number;
  emotional_wellbeing_trend: string;
  safety_score: number;
  safety_previous_score: number;
  safety_trend: string;
  relationships_score: number;
  relationships_previous_score: number;
  relationships_trend: string;
  independence_score: number;
  independence_previous_score: number;
  independence_trend: string;
  engagement_score: number;
  engagement_previous_score: number;
  engagement_trend: string;
  created_at: string;
}

export const progressGoals: IntelligenceProgressGoalRow[] = [
  {
    id: "g1",
    home_id: "home_oak",
    child_id: "child-a",
    title: "Achieve Grade 5 in English GCSE",
    goal_area: "education",
    status: "on_track",
    target_date: "2026-08-20",
    description:
      "Working with tutor twice weekly. Mock results showing steady improvement from Grade 3 to predicted Grade 5.",
    progress: 72,
    created_at: "2026-01-10",
  },
  {
    id: "g2",
    home_id: "home_oak",
    child_id: "child-a",
    title: "Manage anger without physical outbursts for 8 weeks",
    goal_area: "emotional_wellbeing",
    status: "at_risk",
    target_date: "2026-06-15",
    description:
      "Using breathing techniques and safe space. Had one incident in week 5 but recovered quickly with support.",
    progress: 55,
    created_at: "2026-02-15",
  },
  {
    id: "g3",
    home_id: "home_oak",
    child_id: "child-a",
    title: "Maintain weekly contact with maternal grandmother",
    goal_area: "relationships",
    status: "achieved",
    target_date: "2026-04-01",
    description:
      "Video calls every Wednesday established. Two face-to-face visits completed. Grandmother very positive about consistency.",
    progress: 100,
    created_at: "2026-01-20",
  },
  {
    id: "g4",
    home_id: "home_oak",
    child_id: "child-a",
    title: "Independently manage morning routine by July",
    goal_area: "independence",
    status: "not_started",
    target_date: "2026-07-30",
    description:
      "Wake up, shower, dress, breakfast, pack bag without staff prompts. Currently requires 2-3 prompts each morning.",
    progress: 15,
    created_at: "2026-03-01",
  },
];

export const progressEntries: IntelligenceProgressEntryRow[] = [
  { id: "p1", home_id: "home_oak", child_id: "child-a", entry_date: "2026-05-04", area: "education", what_happened: "Completed English mock exam independently. Showed real focus and determination throughout the paper.", impact_on_child: "Predicted grade moved from 4 to 5. Teacher noted significant improvement in essay structure.", staff_member: "Daniel Frost", created_at: "2026-05-04" },
  { id: "p2", home_id: "home_oak", child_id: "child-a", entry_date: "2026-05-02", area: "emotional_wellbeing", what_happened: "Used breathing techniques when frustrated with homework. Chose to go to quiet room rather than escalate.", impact_on_child: "First time choosing de-escalation independently without staff prompt. Major milestone.", staff_member: "Samuel Boateng", created_at: "2026-05-02" },
  { id: "p3", home_id: "home_oak", child_id: "child-a", entry_date: "2026-04-28", area: "relationships", what_happened: "Video called grandmother. Talked for 35 minutes about school and upcoming birthday plans.", impact_on_child: "Grandmother reported feeling much closer. Child asked if she could visit during half term.", staff_member: "Daniel Frost", created_at: "2026-04-28" },
  { id: "p4", home_id: "home_oak", child_id: "child-a", entry_date: "2026-04-25", area: "independence", what_happened: "Made own breakfast for the first time without being asked. Set alarm and got up 10 minutes early.", impact_on_child: "Small but significant step. Staff praised effort without overdoing it. Child seemed proud.", staff_member: "Tom Walker", created_at: "2026-04-25" },
  { id: "p5", home_id: "home_oak", child_id: "child-a", entry_date: "2026-04-22", area: "health", what_happened: "Attended dental appointment without anxiety. Previously refused all medical appointments.", impact_on_child: "Dentist gave positive feedback. No treatment needed. Agreed to 6-month check-up.", staff_member: "Samuel Boateng", created_at: "2026-04-22" },
  { id: "p6", home_id: "home_oak", child_id: "child-a", entry_date: "2026-04-18", area: "community", what_happened: "Joined local football club training session. Engaged well with peers and followed coach instructions.", impact_on_child: "Coach invited back next week. First sustained community activity in 8 months.", staff_member: "Tom Walker", created_at: "2026-04-18" },
  { id: "p7", home_id: "home_oak", child_id: "child-a", entry_date: "2026-04-15", area: "behaviour_support", what_happened: "Apologised unprompted to another young person after disagreement over TV remote.", impact_on_child: "Relationship repair happened naturally. Other YP accepted apology. No staff mediation needed.", staff_member: "Daniel Frost", created_at: "2026-04-15" },
  { id: "p8", home_id: "home_oak", child_id: "child-a", entry_date: "2026-04-10", area: "wishes_and_feelings", what_happened: "Shared in key work session that they would like to try cooking a meal for the house.", impact_on_child: "Activity scheduled for next week. Links to independence goal and building confidence.", staff_member: "Daniel Frost", created_at: "2026-04-10" },
];

export const outcomeSnapshots: IntelligenceOutcomeSnapshotRow[] = [
  {
    id: "snap-a-2026-05",
    home_id: "home_oak",
    child_id: "child-a",
    snapshot_date: "2026-05-01",
    education_score: 7, education_previous_score: 5, education_trend: "up",
    health_score: 6, health_previous_score: 6, health_trend: "stable",
    emotional_wellbeing_score: 5, emotional_wellbeing_previous_score: 4, emotional_wellbeing_trend: "up",
    safety_score: 8, safety_previous_score: 7, safety_trend: "up",
    relationships_score: 7, relationships_previous_score: 5, relationships_trend: "up",
    independence_score: 4, independence_previous_score: 4, independence_trend: "stable",
    engagement_score: 6, engagement_previous_score: 3, engagement_trend: "up",
    created_at: "2026-05-01",
  },
];

// ─── Inspection evidence items (Ofsted Evidence Room) ──────────────────────

export interface IntelligenceEvidenceItemRow {
  id: string;
  home_id: string;
  child_id: string | null;
  staff_id: string | null;
  source_record_type: string;
  source_record_id: string | null;
  title: string;
  description: string;
  category: string; // evidence category
  judgement_area: string | null;
  quality_indicator: number | null;
  evidence_date: string;
  created_by: string | null;
  created_at: string;
}

const _dRel = (n: number): string => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

export const evidenceItems: IntelligenceEvidenceItemRow[] = [
  { id: "ev_01", home_id: "h1", child_id: "c1", staff_id: null, source_record_type: "key_work", source_record_id: "kw_221", title: "Jordan expresses feeling settled and safe", description: "In key work session, Jordan shared that he feels safe at the home and has positive relationships with staff. He identified two staff members he would approach if worried.", category: "wishes_and_feelings", judgement_area: "overall_experiences_and_progress", quality_indicator: 92, evidence_date: _dRel(-3), created_by: "Daniel Frost", created_at: _dRel(-3) },
  { id: "ev_02", home_id: "h1", child_id: "c2", staff_id: null, source_record_type: "incident", source_record_id: "inc_145", title: "Casey supported through emotional crisis with de-escalation", description: "Staff used TCI de-escalation techniques when Casey became distressed. Physical intervention was avoided. Casey was offered a debrief and engaged well. Manager oversight completed within 24 hours.", category: "behaviour_support", judgement_area: "help_and_protection", quality_indicator: 88, evidence_date: _dRel(-5), created_by: "Olivia Hayes", created_at: _dRel(-5) },
  { id: "ev_03", home_id: "h1", child_id: null, staff_id: null, source_record_type: "supervision", source_record_id: "sup_098", title: "Staff supervision cycle completed on time", description: "All staff supervisions completed within the 6-week cycle. Reflective practice was evident in each record, with clear action points and follow-up from previous sessions.", category: "staff_supervision", judgement_area: "effectiveness_of_leaders", quality_indicator: 95, evidence_date: _dRel(-7), created_by: "Olivia Hayes", created_at: _dRel(-7) },
  { id: "ev_04", home_id: "h1", child_id: "c3", staff_id: null, source_record_type: "daily_log", source_record_id: "dl_1892", title: "Reece attends first full week of school", description: "Reece completed a full week of school attendance for the first time since placement. Staff provided consistent morning routines and positive reinforcement. School feedback was excellent.", category: "education", judgement_area: "overall_experiences_and_progress", quality_indicator: 90, evidence_date: _dRel(-10), created_by: "Samuel Boateng", created_at: _dRel(-10) },
  { id: "ev_05", home_id: "h1", child_id: "c1", staff_id: null, source_record_type: "risk_assessment", source_record_id: "ra_034", title: "Jordan's risk assessment reviewed following community incident", description: "Risk assessment updated promptly after Jordan was involved in a community incident. New control measures added, and Jordan was involved in reviewing the document. Social worker informed.", category: "risk_assessment", judgement_area: "help_and_protection", quality_indicator: 85, evidence_date: _dRel(-12), created_by: "Olivia Hayes", created_at: _dRel(-12) },
  { id: "ev_06", home_id: "h1", child_id: null, staff_id: null, source_record_type: "reg44_report", source_record_id: "r44_012", title: "Regulation 44 visit completed with positive findings", description: "Independent visitor completed quarterly visit. All children spoken to, records reviewed, environment inspected. Two recommendations made, both acknowledged and actioned by Registered Manager.", category: "regulation_44", judgement_area: "effectiveness_of_leaders", quality_indicator: 96, evidence_date: _dRel(-14), created_by: "Olivia Hayes", created_at: _dRel(-14) },
  { id: "ev_07", home_id: "h1", child_id: "c2", staff_id: null, source_record_type: "child_voice", source_record_id: "cv_067", title: "Casey contributes ideas for house improvements", description: "During house meeting, Casey suggested changes to the communal lounge layout and new activity ideas. Suggestions were recorded and two were implemented within the week.", category: "wishes_and_feelings", judgement_area: "overall_experiences_and_progress", quality_indicator: 80, evidence_date: _dRel(-16), created_by: "Daniel Frost", created_at: _dRel(-16) },
  { id: "ev_08", home_id: "h1", child_id: null, staff_id: null, source_record_type: "training_record", source_record_id: "tr_088", title: "Team completes refresher safeguarding training", description: "All permanent staff completed Level 3 safeguarding refresher within required timeframe. Agency staff completed induction-level safeguarding before shifts. Training matrix updated.", category: "safeguarding", judgement_area: "help_and_protection", quality_indicator: 94, evidence_date: _dRel(-18), created_by: "Olivia Hayes", created_at: _dRel(-18) },
  { id: "ev_09", home_id: "h1", child_id: "c3", staff_id: null, source_record_type: "placement_plan", source_record_id: "pp_019", title: "Reece's placement plan reviewed with positive trajectory", description: "Six-monthly placement plan review completed on time. Reece participated in the review and identified independence goals. Social worker and IRO attended. All actions from previous review completed.", category: "placement_planning", judgement_area: "effectiveness_of_leaders", quality_indicator: 91, evidence_date: _dRel(-21), created_by: "Olivia Hayes", created_at: _dRel(-21) },
  { id: "ev_10", home_id: "h1", child_id: "c1", staff_id: null, source_record_type: "medication_record", source_record_id: "med_340", title: "Medication administration records — zero errors this month", description: "Monthly medication audit completed. Zero administration errors, all records double-signed, stock reconciliation accurate. GP review appointments attended on time for all children.", category: "medication", judgement_area: "help_and_protection", quality_indicator: 97, evidence_date: _dRel(-4), created_by: "Olivia Hayes", created_at: _dRel(-4) },
  { id: "ev_11", home_id: "h1", child_id: "c2", staff_id: null, source_record_type: "key_work", source_record_id: "kw_225", title: "Casey discusses family contact and makes positive plans", description: "Casey and key worker discussed family time arrangements. Casey identified she would like more phone contact with her grandmother. Plan agreed and social worker informed.", category: "family_time", judgement_area: "overall_experiences_and_progress", quality_indicator: 82, evidence_date: _dRel(-8), created_by: "Daniel Frost", created_at: _dRel(-8) },
  { id: "ev_12", home_id: "h1", child_id: null, staff_id: null, source_record_type: "complaint", source_record_id: "cmp_011", title: "Complaint resolved within timescale with positive outcome", description: "Complaint from placing authority regarding communication about a medical appointment was investigated and resolved within 10 working days. Outcome letter sent. Process improvements identified and implemented.", category: "complaints", judgement_area: "effectiveness_of_leaders", quality_indicator: 78, evidence_date: _dRel(-25), created_by: "Olivia Hayes", created_at: _dRel(-25) },
];

// ─── Staff competence passport (rich JSON shape) ───────────────────────────

// The Supabase staff_competence_records table is a flat schema. The demo UI
// renders a richer per-staff payload (passport entries, warnings, restrictions,
// compliments). When Supabase is disabled we expose the rich shape directly
// under `richRecords` so the page can render the full demo without lossy
// flattening.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IntelligenceStaffPassportRecord = any;

export const staffPassportRecords: IntelligenceStaffPassportRecord[] = [
  { id: "staff-a", name: "Staff A - Sarah Mitchell", role: "Senior Residential Worker", startDate: "2022-03-15",
    passport: [
      { label: "DBS Status", status: "valid", detail: "Enhanced DBS - Update service registered", expiryDate: "2027-03-15" },
      { label: "References", status: "valid", detail: "2 satisfactory references on file" },
      { label: "Right to Work", status: "valid", detail: "British Citizen - passport verified" },
      { label: "Induction", status: "valid", detail: "Completed 18 Mar 2022" },
      { label: "Probation", status: "valid", detail: "Passed - June 2022" },
      { label: "Level 3 Diploma", status: "valid", detail: "Level 3 Children & Young People achieved 2023" },
      { label: "Mandatory Training", status: "valid", detail: "All 12 modules completed. Renewal Mar 2027" },
      { label: "Safeguarding Training", status: "valid", detail: "Level 3 - Refreshed Jan 2026", expiryDate: "2028-01-15" },
      { label: "Medication Competency", status: "valid", detail: "Assessed and signed off by manager", expiryDate: "2026-11-20" },
      { label: "Physical Intervention", status: "valid", detail: "Team Teach Level 2 - refreshed Feb 2026", expiryDate: "2027-02-10" },
      { label: "Last Supervision", status: "valid", detail: "28 Apr 2026 - next due 26 May 2026" },
      { label: "Last Appraisal", status: "valid", detail: "Annual appraisal completed Mar 2026" },
    ],
    competencyFlags: [
      { label: "Can Lead Shift", granted: true, grantedDate: "2023-06-01" },
      { label: "Can Administer Medication", granted: true, grantedDate: "2022-09-15" },
      { label: "Can Lone Work", granted: true, grantedDate: "2023-01-10" },
      { label: "Can Supervise Others", granted: true, grantedDate: "2024-03-01" },
    ],
    warnings: [], restrictions: [],
    compliments: [
      { id: "c1", text: "Brilliant handling of a difficult situation with Child A. Calm, professional, and child-centred throughout.", from: "Olivia Hayes (RM)", date: "2026-04-20" },
      { id: "c2", text: "Thank you for covering extra shifts this month without complaint. Really valued.", from: "Olivia Hayes (RM)", date: "2026-04-05" },
    ],
  },
  { id: "staff-b", name: "Staff B - James Cooper", role: "Residential Worker", startDate: "2023-09-01",
    passport: [
      { label: "DBS Status", status: "valid", detail: "Enhanced DBS", expiryDate: "2026-09-01" },
      { label: "References", status: "valid", detail: "2 satisfactory references on file" },
      { label: "Right to Work", status: "valid", detail: "British Citizen" },
      { label: "Induction", status: "valid", detail: "Completed Sep 2023" },
      { label: "Probation", status: "valid", detail: "Passed - March 2024" },
      { label: "Level 3 Diploma", status: "in_progress", detail: "Started Jan 2025 - Unit 4 of 8 complete" },
      { label: "Mandatory Training", status: "expiring", detail: "10 of 12 modules current. 2 due renewal", expiryDate: "2026-06-01" },
      { label: "Safeguarding Training", status: "valid", detail: "Level 2 - completed Oct 2025", expiryDate: "2027-10-15" },
      { label: "Medication Competency", status: "valid", detail: "Assessed by senior", expiryDate: "2026-12-01" },
      { label: "Physical Intervention", status: "valid", detail: "Team Teach Level 1", expiryDate: "2027-01-20" },
      { label: "Last Supervision", status: "expiring", detail: "15 Apr 2026 - overdue by 3 days" },
      { label: "Last Appraisal", status: "valid", detail: "Completed Jan 2026" },
    ],
    competencyFlags: [
      { label: "Can Lead Shift", granted: false },
      { label: "Can Administer Medication", granted: true, grantedDate: "2024-06-01" },
      { label: "Can Lone Work", granted: false },
      { label: "Can Supervise Others", granted: false },
    ],
    warnings: [
      { id: "w1", severity: "medium", title: "Supervision overdue", description: "Last supervision was 20 days ago. Monthly supervision required per Reg 33.", date: "2026-05-05" },
      { id: "w2", severity: "low", title: "2 training modules expiring", description: "Fire Safety and First Aid modules expire on 1 June 2026.", date: "2026-05-01" },
    ],
    restrictions: [],
    compliments: [
      { id: "c1", text: "Great relationship building with Child C. They really respond well to you.", from: "Sarah Mitchell (Senior)", date: "2026-03-15" },
    ],
  },
  { id: "staff-c", name: "Staff C - Tom Richards", role: "Residential Worker", startDate: "2024-06-01",
    passport: [
      { label: "DBS Status", status: "valid", detail: "Enhanced DBS", expiryDate: "2027-06-01" },
      { label: "References", status: "valid", detail: "2 satisfactory references" },
      { label: "Right to Work", status: "valid", detail: "Settled Status" },
      { label: "Induction", status: "valid", detail: "Completed Jun 2024" },
      { label: "Probation", status: "valid", detail: "Passed - Dec 2024" },
      { label: "Level 3 Diploma", status: "not_started", detail: "Scheduled to start Sep 2026" },
      { label: "Mandatory Training", status: "valid", detail: "All modules current" },
      { label: "Safeguarding Training", status: "valid", detail: "Level 2", expiryDate: "2027-07-01" },
      { label: "Medication Competency", status: "not_started", detail: "Assessment booked for June 2026" },
      { label: "Physical Intervention", status: "valid", detail: "Team Teach Level 1", expiryDate: "2027-03-01" },
      { label: "Last Supervision", status: "valid", detail: "1 May 2026" },
      { label: "Last Appraisal", status: "valid", detail: "Due Dec 2026 (first annual)" },
    ],
    competencyFlags: [
      { label: "Can Lead Shift", granted: false },
      { label: "Can Administer Medication", granted: false },
      { label: "Can Lone Work", granted: false },
      { label: "Can Supervise Others", granted: false },
    ],
    warnings: [
      { id: "w1", severity: "low", title: "Medication competency not yet assessed", description: "Cannot administer medication until assessment completed.", date: "2026-05-01" },
    ],
    restrictions: [
      { id: "r1", restriction: "Cannot administer medication", reason: "Competency assessment not yet completed", appliedDate: "2024-06-01", appliedBy: "Olivia Hayes" },
    ],
    compliments: [],
  },
  { id: "staff-d", name: "Staff D - Priya Patel", role: "Waking Night Worker", startDate: "2023-01-10",
    passport: [
      { label: "DBS Status", status: "valid", detail: "Enhanced DBS", expiryDate: "2026-01-10" },
      { label: "References", status: "valid", detail: "2 satisfactory references" },
      { label: "Right to Work", status: "valid", detail: "British Citizen" },
      { label: "Induction", status: "valid", detail: "Completed Jan 2023" },
      { label: "Probation", status: "valid", detail: "Passed - Jul 2023" },
      { label: "Level 3 Diploma", status: "valid", detail: "Achieved 2024" },
      { label: "Mandatory Training", status: "expired", detail: "3 modules expired in April 2026", expiryDate: "2026-04-01" },
      { label: "Safeguarding Training", status: "valid", detail: "Level 2", expiryDate: "2027-02-01" },
      { label: "Medication Competency", status: "valid", detail: "Night meds only", expiryDate: "2026-08-01" },
      { label: "Physical Intervention", status: "expired", detail: "Team Teach expired March 2026", expiryDate: "2026-03-01" },
      { label: "Last Supervision", status: "expired", detail: "Last session 2 Mar 2026 - 9 weeks overdue" },
      { label: "Last Appraisal", status: "valid", detail: "Completed Feb 2026" },
    ],
    competencyFlags: [
      { label: "Can Lead Shift", granted: false },
      { label: "Can Administer Medication", granted: true, grantedDate: "2023-08-01" },
      { label: "Can Lone Work", granted: true, grantedDate: "2023-09-15" },
      { label: "Can Supervise Others", granted: false },
    ],
    warnings: [
      { id: "w1", severity: "high", title: "Physical intervention training expired", description: "Team Teach certification expired March 2026. Cannot be involved in any physical interventions.", date: "2026-04-01" },
      { id: "w2", severity: "high", title: "Supervision severely overdue", description: "9 weeks since last supervision. Reg 33 requires monthly. Immediate action needed.", date: "2026-05-05" },
      { id: "w3", severity: "medium", title: "3 mandatory training modules expired", description: "Lone Working, Equality & Diversity, and Data Protection all expired.", date: "2026-04-15" },
    ],
    restrictions: [
      { id: "r1", restriction: "Cannot use physical intervention", reason: "Team Teach certification expired", appliedDate: "2026-04-01", appliedBy: "Olivia Hayes" },
    ],
    compliments: [
      { id: "c1", text: "Priya is always calm and reassuring during night shifts. The children feel safe with her.", from: "Olivia Hayes (RM)", date: "2026-02-20" },
    ],
  },
  { id: "staff-e", name: "Staff E - Marcus Williams", role: "Senior Residential Worker", startDate: "2021-11-01",
    passport: [
      { label: "DBS Status", status: "valid", detail: "Enhanced DBS - Update service", expiryDate: "2027-11-01" },
      { label: "References", status: "valid", detail: "2 satisfactory references" },
      { label: "Right to Work", status: "valid", detail: "British Citizen" },
      { label: "Induction", status: "valid", detail: "Completed Nov 2021" },
      { label: "Probation", status: "valid", detail: "Passed - May 2022" },
      { label: "Level 3 Diploma", status: "valid", detail: "Level 5 Leadership achieved 2025" },
      { label: "Mandatory Training", status: "valid", detail: "All 12 modules current" },
      { label: "Safeguarding Training", status: "valid", detail: "Level 3", expiryDate: "2027-09-01" },
      { label: "Medication Competency", status: "valid", detail: "Full competency", expiryDate: "2027-01-15" },
      { label: "Physical Intervention", status: "valid", detail: "Team Teach Level 2 - Trainer", expiryDate: "2027-06-01" },
      { label: "Last Supervision", status: "valid", detail: "30 Apr 2026" },
      { label: "Last Appraisal", status: "valid", detail: "Completed Nov 2025" },
    ],
    competencyFlags: [
      { label: "Can Lead Shift", granted: true, grantedDate: "2022-05-01" },
      { label: "Can Administer Medication", granted: true, grantedDate: "2022-03-01" },
      { label: "Can Lone Work", granted: true, grantedDate: "2022-06-15" },
      { label: "Can Supervise Others", granted: true, grantedDate: "2023-11-01" },
    ],
    warnings: [], restrictions: [],
    compliments: [
      { id: "c1", text: "Marcus is an outstanding practitioner. His approach with the most challenging children is exemplary.", from: "Ofsted Inspector", date: "2025-11-10" },
      { id: "c2", text: "Thank you for mentoring the new staff so effectively. They all speak highly of your support.", from: "Olivia Hayes (RM)", date: "2026-03-01" },
      { id: "c3", text: "Marcus handled the crisis brilliantly. Professional, proportionate and child-focused throughout.", from: "RI - Regional Manager", date: "2026-01-15" },
    ],
  },
  { id: "staff-f", name: "Staff F - Amy Green", role: "Residential Worker (New Starter)", startDate: "2026-04-14",
    passport: [
      { label: "DBS Status", status: "valid", detail: "Enhanced DBS received 10 Apr 2026" },
      { label: "References", status: "valid", detail: "2 satisfactory references" },
      { label: "Right to Work", status: "valid", detail: "British Citizen" },
      { label: "Induction", status: "in_progress", detail: "Week 3 of 6-week induction programme" },
      { label: "Probation", status: "in_progress", detail: "Started 14 Apr 2026 - 6 month period" },
      { label: "Level 3 Diploma", status: "not_started", detail: "To start after probation" },
      { label: "Mandatory Training", status: "in_progress", detail: "5 of 12 modules completed" },
      { label: "Safeguarding Training", status: "valid", detail: "Level 2 completed in induction week 1" },
      { label: "Medication Competency", status: "not_started", detail: "Scheduled for induction week 5" },
      { label: "Physical Intervention", status: "in_progress", detail: "Team Teach booked 20 May 2026" },
      { label: "Last Supervision", status: "valid", detail: "2 May 2026 (weekly during induction)" },
      { label: "Last Appraisal", status: "not_started", detail: "First appraisal due Oct 2026" },
    ],
    competencyFlags: [
      { label: "Can Lead Shift", granted: false },
      { label: "Can Administer Medication", granted: false },
      { label: "Can Lone Work", granted: false },
      { label: "Can Supervise Others", granted: false },
    ],
    warnings: [],
    restrictions: [
      { id: "r1", restriction: "Cannot lone work", reason: "Induction period - must be supernumerary", appliedDate: "2026-04-14", appliedBy: "Olivia Hayes" },
      { id: "r2", restriction: "Cannot administer medication", reason: "Not yet assessed", appliedDate: "2026-04-14", appliedBy: "Olivia Hayes" },
      { id: "r3", restriction: "Cannot use physical intervention", reason: "Training not yet completed", appliedDate: "2026-04-14", appliedBy: "Olivia Hayes" },
    ],
    compliments: [],
  },
];

// The Manager Control Centre (and any flat-schema consumer) reads the staff
// competence records in the flat snake_case shape the Supabase table uses. When
// Supabase is disabled we only exposed the rich `richRecords` shape, leaving the
// flat `records` array empty — so the dashboard's compliance metrics read zero.
// This derives a faithful flat record from the rich passport (no fabrication:
// "valid" passport entries map to complete/true, anything else to incomplete).
export function staffPassportToFlatRecord(
  rich: IntelligenceStaffPassportRecord,
): Record<string, unknown> {
  const passport: { label?: string; status?: string }[] = rich?.passport ?? [];
  const flags: { label?: string; granted?: boolean }[] = rich?.competencyFlags ?? [];
  const statusOf = (label: string) => passport.find((p) => p?.label === label)?.status;
  const isValid = (label: string) => statusOf(label) === "valid";
  const grantedOf = (label: string) => flags.some((f) => f?.label === label && f?.granted === true);
  const dbs = statusOf("DBS Status");
  const level3 = statusOf("Level 3 Diploma");
  const probation = statusOf("Probation");
  return {
    id: rich?.id,
    staff_id: rich?.id,
    staff_name: rich?.name ?? null,
    role: rich?.role ?? null,
    start_date: rich?.startDate ?? null,
    safer_recruitment_complete: isValid("DBS Status") && isValid("References") && isValid("Right to Work"),
    dbs_status: dbs === "valid" ? "clear" : dbs === "expiring" ? "expiring" : dbs ?? "not_started",
    references_received: isValid("References"),
    right_to_work: isValid("Right to Work"),
    induction_complete: isValid("Induction"),
    probation_status: probation === "valid" ? "passed" : probation ?? "not_started",
    level3_status: level3 === "valid" ? "complete" : level3 ?? "not_started",
    mandatory_training_complete: isValid("Mandatory Training"),
    safeguarding_training_current: isValid("Safeguarding Training"),
    medication_competency: isValid("Medication Competency"),
    physical_intervention_trained: isValid("Physical Intervention"),
    supervision_current: isValid("Last Supervision"),
    appraisal_current: isValid("Last Appraisal"),
    can_lead_shift: grantedOf("Can Lead Shift"),
    can_administer_medication: grantedOf("Can Administer Medication"),
    can_lone_work: grantedOf("Can Lone Work"),
    can_supervise_others: grantedOf("Can Supervise Others"),
    warnings_count: (rich?.warnings ?? []).length,
    restrictions: rich?.restrictions ?? [],
    compliments_count: (rich?.compliments ?? []).length,
  };
}

// ─── Provider oversight (rich provider/home summaries + oversight log) ─────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IntelligenceProviderHomeSummary = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IntelligenceProviderOversightEntry = any;

export const providerHomeSummaries: IntelligenceProviderHomeSummary[] = [
  {
    id: "oak-house",
    name: "Chamberlain House",
    manager: "Olivia Hayes",
    totalChildren: 3,
    capacity: 4,
    totalStaff: 12,
    inspectionReadiness: 88,
    openRisks: 2,
    seriousIncidents: 0,
    reg44Status: "completed",
    reg45Status: "completed",
    supervisionCompliance: 92,
    trainingCompliance: 95,
    recruitmentCompliance: 100,
    overdueActions: 3,
    complaints: 1,
    missingEpisodes: 1,
    caraRiskFlags: ["Staff supervision gap detected for 1 night worker"],
    lastReviewed: "2026-05-01",
  },
  {
    id: "birch-lodge",
    name: "Birch Lodge",
    manager: "Karen Thompson",
    totalChildren: 4,
    capacity: 4,
    totalStaff: 14,
    inspectionReadiness: 62,
    openRisks: 5,
    seriousIncidents: 2,
    reg44Status: "overdue",
    reg45Status: "due_soon",
    supervisionCompliance: 68,
    trainingCompliance: 71,
    recruitmentCompliance: 85,
    overdueActions: 11,
    complaints: 3,
    missingEpisodes: 4,
    caraRiskFlags: [
      "Pattern of missing episodes detected - 4 in 30 days",
      "Supervision compliance below 70% threshold",
      "3 staff have expired mandatory training",
      "Reg 44 overdue by 12 days",
    ],
    lastReviewed: "2026-04-18",
  },
  {
    id: "willow-place",
    name: "Willow Place",
    manager: "David Okonkwo",
    totalChildren: 3,
    capacity: 3,
    totalStaff: 10,
    inspectionReadiness: 94,
    openRisks: 1,
    seriousIncidents: 0,
    reg44Status: "completed",
    reg45Status: "completed",
    supervisionCompliance: 100,
    trainingCompliance: 98,
    recruitmentCompliance: 100,
    overdueActions: 1,
    complaints: 0,
    missingEpisodes: 0,
    caraRiskFlags: [],
    lastReviewed: "2026-05-03",
  },
];

export const providerOversightLog: IntelligenceProviderOversightEntry[] = [
  { id: "ol-1", date: "2026-05-03", home: "Willow Place", type: "review", content: "Monthly quality review completed. All areas meeting or exceeding standards. Commend David and team for consistent excellence.", author: "Regional Inspector", status: "closed" },
  { id: "ol-2", date: "2026-05-01", home: "Chamberlain House", type: "comment", content: "Noted improvement in recording quality following last visit. Progress entries are now timely and outcome-focused. One night staff supervision gap to address.", author: "Regional Inspector", status: "open" },
  { id: "ol-3", date: "2026-04-28", home: "Birch Lodge", type: "action_request", content: "Reg 44 visit now 12 days overdue. Manager to complete within 48 hours and submit report. Supervision compliance plan required by 5 May.", author: "Regional Inspector", status: "open" },
  { id: "ol-4", date: "2026-04-25", home: "Birch Lodge", type: "escalation", content: "Pattern of missing episodes identified - 4 in 30 days involving 2 different young people. Requesting immediate review of risk assessments and boundary agreements.", author: "Regional Inspector", status: "open" },
  { id: "ol-5", date: "2026-04-20", home: "Chamberlain House", type: "review", content: "Unannounced visit completed. Children appeared settled and engaged. Staff interactions observed as warm and appropriate. Minor recommendation around medication storage labelling.", author: "Regional Inspector", status: "closed" },
];

// ─── Manager attention items (Control Centre queue) ───────────────────────

export interface IntelligenceAttentionItemRow {
  id: string;
  home_id: string;
  title: string;
  category: string;
  urgency: string;
  status: string;
  child_id: string | null;
  staff_id: string | null;
  source_record_type: string | null;
  source_record_id: string | null;
  reason: string;
  suggested_action: string;
  due_date: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  escalated_to: string | null;
  escalated_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const _dRel2 = (n: number): string => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

export const attentionItems: IntelligenceAttentionItemRow[] = [
  { id: "att_001", home_id: "home_oak", title: "Serious incident report requires manager oversight", category: "serious_incident", urgency: "critical", status: "open", child_id: "Child A", staff_id: null, source_record_type: "incident", source_record_id: null, reason: "A serious incident was recorded on " + _dRel2(-1) + " involving Child A. No manager oversight has been added within the required 24-hour window. Ofsted notification may be required under Reg 40.", suggested_action: "Review the incident record, add your oversight analysis, and determine whether Ofsted notification is required. Consider whether a staff debrief and learning review are needed.", due_date: _dRel2(0), reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-1), updated_at: _dRel2(-1) },
  { id: "att_002", home_id: "home_oak", title: "Missing from care episode — return interview overdue", category: "missing_from_care", urgency: "critical", status: "open", child_id: "Child B", staff_id: null, source_record_type: "missing_episode", source_record_id: null, reason: "Child B returned from a missing episode 48 hours ago. The independent return interview has not been completed. This is a statutory requirement and the placing authority must be informed.", suggested_action: "Arrange the independent return interview urgently. Ensure the placing authority and police are informed of the return. Update the missing from care log with return details.", due_date: _dRel2(-1), reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-2), updated_at: _dRel2(-2) },
  { id: "att_003", home_id: "home_oak", title: "Incident log awaiting manager review", category: "incident_oversight", urgency: "high", status: "open", child_id: "Child C", staff_id: null, source_record_type: "incident", source_record_id: null, reason: "Three incident records from the past 5 days have no manager oversight recorded. Regulation 40 requires the registered person to ensure proper oversight of all significant events.", suggested_action: "Review each incident, add oversight notes covering your analysis of triggers, response quality, and follow-up actions needed. Link to relevant risk assessments.", due_date: _dRel2(1), reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-3), updated_at: _dRel2(-3) },
  { id: "att_004", home_id: "home_oak", title: "Medication audit discrepancy identified", category: "medication_check", urgency: "high", status: "open", child_id: "Child A", staff_id: "Staff Member D", source_record_type: "medication", source_record_id: null, reason: "The weekly medication count for Child A shows a discrepancy of 2 tablets of prescribed medication. This must be investigated and resolved immediately as per the home's medication policy.", suggested_action: "Conduct a full medication reconciliation. Check all MAR sheets against stock. Interview staff who administered medication during the relevant period. Record findings and any corrective action.", due_date: _dRel2(0), reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-1), updated_at: _dRel2(-1) },
  { id: "att_005", home_id: "home_oak", title: "Staff supervision overdue by 3 weeks", category: "supervision_overdue", urgency: "high", status: "open", child_id: null, staff_id: "Staff Member B", source_record_type: "supervision", source_record_id: null, reason: "Staff Member B has not had formal supervision for 7 weeks. The home's statement of purpose commits to supervision every 4 weeks. This is a common area of Ofsted scrutiny.", suggested_action: "Schedule supervision within the next 5 working days. Prepare agenda covering recent incidents, training needs, wellbeing, and professional development. Record on the supervision log.", due_date: _dRel2(5), reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-7), updated_at: _dRel2(-7) },
  { id: "att_006", home_id: "home_oak", title: "Risk assessment review overdue — self-harm", category: "risk_assessment_review", urgency: "high", status: "in_progress", child_id: "Child C", staff_id: null, source_record_type: "risk_assessment", source_record_id: null, reason: "Child C's self-harm risk assessment was last reviewed 8 weeks ago. The review frequency is set to 4-weekly due to active risk. A recent incident may indicate escalation.", suggested_action: "Complete the risk assessment review incorporating recent incident data. Consider whether the risk level or management strategies need updating. Consult with CAMHS if appropriate.", due_date: _dRel2(-3), reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-5), updated_at: _dRel2(-5) },
  { id: "att_007", home_id: "home_oak", title: "Placement plan update required", category: "placement_plan_update", urgency: "medium", status: "open", child_id: "Child A", staff_id: null, source_record_type: "placement_plan", source_record_id: null, reason: "Child A's placement plan has not been updated following the last LAC review held 2 weeks ago. The agreed actions from the review need to be incorporated into the plan.", suggested_action: "Update the placement plan to reflect the LAC review outcomes. Ensure all agreed actions are captured with responsible persons and timescales. Share the updated plan with the placing authority.", due_date: _dRel2(3), reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-10), updated_at: _dRel2(-10) },
  { id: "att_008", home_id: "home_oak", title: "Key work session overdue", category: "key_work_overdue", urgency: "medium", status: "open", child_id: "Child B", staff_id: "Staff Member E", source_record_type: "key_work", source_record_id: null, reason: "Child B has not had a recorded key work session for 3 weeks. The care plan specifies weekly key work. This is an important mechanism for capturing the child's voice and monitoring wellbeing.", suggested_action: "Schedule a key work session this week. Focus on the child's current wishes and feelings, any concerns, and progress against care plan targets. Record the session promptly.", due_date: _dRel2(2), reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-4), updated_at: _dRel2(-4) },
  { id: "att_009", home_id: "home_oak", title: "Wishes and feelings not captured this month", category: "wishes_feelings_missing", urgency: "medium", status: "open", child_id: "Child C", staff_id: null, source_record_type: "child_voice", source_record_id: null, reason: "No wishes and feelings entry has been recorded for Child C in the current calendar month. The voice of the child is a central focus for Ofsted inspections under the social care common inspection framework.", suggested_action: "Ensure the key worker captures Child C's wishes and feelings through an appropriate method (direct conversation, activity, creative work). Record in the child's voice where possible.", due_date: null, reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-6), updated_at: _dRel2(-6) },
  { id: "att_010", home_id: "home_oak", title: "Daily logs awaiting approval", category: "log_approval", urgency: "medium", status: "open", child_id: null, staff_id: null, source_record_type: "daily_log", source_record_id: null, reason: "Five daily log entries from the past 7 days have not been reviewed and approved by management. Regular log review demonstrates active oversight and ensures recording quality.", suggested_action: "Review each pending log entry for accuracy, completeness, and tone. Approve entries that meet the standard. Return any that need amendment with clear guidance for the author.", due_date: _dRel2(1), reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-2), updated_at: _dRel2(-2) },
  { id: "att_011", home_id: "home_oak", title: "Reg 44 visit action overdue", category: "reg44_action_overdue", urgency: "medium", status: "open", child_id: null, staff_id: null, source_record_type: "reg44_action", source_record_id: null, reason: "An action from the last Reg 44 independent visitor's report (dated " + _dRel2(-30) + ") regarding fire evacuation drill frequency remains incomplete. The action was due " + _dRel2(-7) + ".", suggested_action: "Complete the outstanding action or provide a written update to the independent visitor explaining the delay and revised timescale. Record completion evidence in the Reg 44 action tracker.", due_date: _dRel2(-7), reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-14), updated_at: _dRel2(-14) },
  { id: "att_012", home_id: "home_oak", title: "Training gap — physical intervention refresher", category: "training_gap", urgency: "medium", status: "open", child_id: null, staff_id: "Staff Member C", source_record_type: "training", source_record_id: null, reason: "Staff Member C's physical intervention certification expired 2 weeks ago. They must not be involved in any physical intervention until the refresher is completed. This affects shift planning.", suggested_action: "Book the next available physical intervention refresher course. Update the rota to ensure Staff Member C is always paired with a certified colleague until recertification. Notify Staff Member C in writing.", due_date: null, reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-14), updated_at: _dRel2(-14) },
  { id: "att_013", home_id: "home_oak", title: "Complaint from placing authority — response due", category: "complaint_open", urgency: "high", status: "in_progress", child_id: "Child B", staff_id: null, source_record_type: "complaint", source_record_id: null, reason: "A formal complaint was received from the placing authority for Child B regarding communication about a recent incident. The complaints procedure requires an initial response within 5 working days.", suggested_action: "Draft a response to the complaint. Review the incident communication timeline. Identify any gaps in the notification process and outline corrective steps. Log on the complaints register.", due_date: _dRel2(2), reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-3), updated_at: _dRel2(-3) },
  { id: "att_014", home_id: "home_oak", title: "Cara has detected a pattern — escalating behaviour", category: "cara_pattern", urgency: "medium", status: "open", child_id: "Child A", staff_id: null, source_record_type: "cara", source_record_id: null, reason: "Cara has identified a pattern of escalating behaviour incidents involving Child A over the past 14 days. The frequency has increased from 1 per week to 3 per week, with increasing severity. This may correlate with reduced family contact during the same period.", suggested_action: "Review the behaviour trend analysis. Consider whether the behaviour support plan needs updating. Explore the link to family contact patterns. Discuss with the team and consider a multi-agency strategy meeting.", due_date: null, reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-1), updated_at: _dRel2(-1) },
  { id: "att_015", home_id: "home_oak", title: "Reg 45 report — evidence gap in quality of care", category: "reg45_evidence_gap", urgency: "low", status: "open", child_id: null, staff_id: null, source_record_type: "reg45", source_record_id: null, reason: "The upcoming Reg 45 half-yearly report has a gap in evidencing quality of care outcomes for the current period. Specifically, there are limited recorded examples of how the home has responded to children's individual needs.", suggested_action: "Gather evidence from key work records, daily logs, and activity records that demonstrate individualised care. Ask staff to provide specific examples for each child. Compile into the evidence folder.", due_date: _dRel2(14), reviewed_by: null, reviewed_at: null, escalated_to: null, escalated_at: null, created_by: null, created_at: _dRel2(-7), updated_at: _dRel2(-7) },
];

// ─── Cara suggestions (review queue + detail) ────────────────────────────────

export interface CaraSuggestionLinkedRecord {
  id: string;
  linked_record_type: string;
  reason: string;
  suggested_action: string;
  risk_level: string;
}

export interface CaraSuggestionAuditEntry {
  id: string;
  action: string;
  actor_role: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CaraSuggestionRow {
  id: string;
  home_id: string;
  title: string;
  summary: string;
  reason: string;
  suggestion_type: string;
  related_record_type: string;
  related_record_id: string;
  child_name: string | null;
  risk_level: string;
  confidence_level: string;
  status: string;
  draft_text: string;
  final_text: string | null;
  rejection_reason: string | null;
  reviewer_role: string | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  committed_at: string | null;
  mock_mode: boolean;
  linked_records: CaraSuggestionLinkedRecord[];
  audit_timeline: CaraSuggestionAuditEntry[];
}

const _draft1 = `Cara suggested draft — requires manager review before saving.

I have reviewed this incident involving a physical intervention with Alex on 5 May 2026.

What was reviewed:
The incident record, the immediate action taken, the staff accounts, and the child's response following the incident.

What happened:
Alex became increasingly distressed during the evening routine. Staff report that verbal de-escalation, distraction, and offers of alternative activity were attempted before any physical intervention was considered. When Alex moved towards the kitchen area where other children were present and began throwing items, staff made the decision to use a brief physical intervention to guide Alex to a quieter space.

Impact on the child:
Alex was visibly distressed during and immediately after the intervention. Staff remained with Alex and offered comfort. Alex was able to talk about what happened approximately 30 minutes later. Alex's voice should be formally captured through key work.

Staff response:
Staff attempted proportionate de-escalation strategies before physical intervention. The intervention described appears brief and proportionate to the immediate risk. Staff remained with Alex afterwards and offered support.

Were existing plans followed:
The behaviour support plan includes guidance on de-escalation. The records suggest staff followed the plan. However, the plan may need reviewing if the triggers described are not currently captured in the plan.

Safeguarding considerations:
Any physical intervention involving a child requires consideration of whether the LADO threshold is met. On the basis of what is recorded, the intervention appears proportionate, but the manager should satisfy themselves of this and record their reasoning.

Has risk changed:
Three incidents involving similar behaviour within 14 days suggest the risk assessment may not fully reflect Alex's current presentation. A review of the risk assessment is recommended.

Management decision:
[To be completed by the Registered Manager]

Next actions:
- Key work session with Alex to capture wishes and feelings
- Risk assessment review
- Staff debrief
- Consider whether behaviour support plan update is needed
- Consider whether social worker and placing authority should be updated

Review timeframe:
Next review within 48 hours to confirm actions have been progressed.`;

const _caraBase = (overrides: Partial<CaraSuggestionRow>): CaraSuggestionRow => ({
  id: overrides.id ?? "as_x",
  home_id: "home_oak",
  title: "",
  summary: "",
  reason: "",
  suggestion_type: "management_oversight",
  related_record_type: "incident",
  related_record_id: "inc_000",
  child_name: null,
  risk_level: "medium",
  confidence_level: "medium",
  status: "awaiting_review",
  draft_text: "",
  final_text: null,
  rejection_reason: null,
  reviewer_role: null,
  created_at: new Date().toISOString(),
  approved_at: null,
  rejected_at: null,
  committed_at: null,
  mock_mode: false,
  linked_records: [],
  audit_timeline: [],
  ...overrides,
});

export const caraSuggestions: CaraSuggestionRow[] = [
  _caraBase({
    id: "as_001",
    title: "Management oversight required — physical intervention incident",
    summary: "A physical intervention was recorded. The Registered Manager should review the response, consider whether the intervention was proportionate, check that the child's voice has been captured, and record oversight.",
    reason: "Physical intervention incidents require immediate management oversight under Regulation 35 and the Quality Standards. The manager should evidence that the response was proportionate, that less restrictive measures were considered first, that the child was supported afterwards, and that staff are clear on the learning.",
    suggestion_type: "management_oversight",
    related_record_id: "inc_042",
    child_name: "Alex W",
    risk_level: "urgent",
    confidence_level: "high",
    reviewer_role: "Registered Manager",
    draft_text: _draft1,
    created_at: "2026-05-05T08:15:00Z",
    linked_records: [
      { id: "asl_001", linked_record_type: "risk_assessment", reason: "Three incidents in 14 days suggest the risk assessment may need updating to reflect Alex's current presentation.", suggested_action: "Review risk assessment — consider whether current risk level and strategies remain appropriate.", risk_level: "high" },
      { id: "asl_002", linked_record_type: "behaviour_support_plan", reason: "The triggers described in this incident may not be fully captured in the current behaviour support plan.", suggested_action: "Review behaviour support plan — check whether de-escalation strategies and triggers are current.", risk_level: "medium" },
      { id: "asl_003", linked_record_type: "key_work", reason: "The child's voice is not yet visible in the post-incident records.", suggested_action: "Arrange key work session to capture Alex's wishes, feelings, and experience of the incident.", risk_level: "medium" },
      { id: "asl_004", linked_record_type: "staff_debrief", reason: "Staff involved in physical interventions benefit from structured debrief.", suggested_action: "Arrange staff debrief to reflect on practice, explore what went well, and consider learning.", risk_level: "medium" },
    ],
    audit_timeline: [
      { id: "aud_001", action: "suggestion_created", actor_role: "system", created_at: "2026-05-05T08:15:00Z" },
      { id: "aud_002", action: "draft_generated", actor_role: "system", created_at: "2026-05-05T08:15:01Z", metadata: { ai_provider: "anthropic", mock_mode: false } },
      { id: "aud_003", action: "linked_records_suggested", actor_role: "system", created_at: "2026-05-05T08:15:02Z", metadata: { count: 4 } },
      { id: "aud_004", action: "suggestion_viewed", actor_role: "registered_manager", created_at: "2026-05-05T09:30:00Z" },
    ],
  }),
  _caraBase({ id: "as_002", title: "Risk assessment review — escalating behaviour pattern", summary: "Three incidents involving similar behaviour within 14 days. The current risk assessment may not reflect the child's present needs.", reason: "Pattern of three incidents in 14 days suggests the risk assessment requires review to ensure it reflects the child's current presentation.", suggestion_type: "risk_review", related_record_id: "inc_042", child_name: "Alex W", risk_level: "high", confidence_level: "high", reviewer_role: "Registered Manager", created_at: "2026-05-05T08:15:00Z" }),
  _caraBase({ id: "as_003", title: "Safeguarding review — consider whether threshold for LADO is met", summary: "The incident involves a staff member and a child. The manager should consider whether the threshold for LADO consultation has been met.", reason: "Any incident involving physical contact between staff and a child should be considered against the LADO threshold, even where the intervention was proportionate.", suggestion_type: "safeguarding_review", related_record_id: "inc_042", child_name: "Alex W", risk_level: "high", confidence_level: "medium", reviewer_role: "Registered Manager", created_at: "2026-05-05T08:15:00Z" }),
  _caraBase({ id: "as_004", title: "Staff debrief recommended — emotional incident", summary: "Staff involved in the incident should be offered a debrief to reflect on practice, consider what went well, what could be different, and whether support is needed.", reason: "Staff involved in emotional or high-intensity incidents benefit from structured debrief. This supports wellbeing and reflective practice.", suggestion_type: "staff_debrief", related_record_id: "inc_039", child_name: "Jordan M", risk_level: "medium", confidence_level: "high", reviewer_role: "Registered Manager", created_at: "2026-05-04T16:30:00Z" }),
  _caraBase({ id: "as_005", title: "Key work session — capture child's wishes and feelings", summary: "Following this incident, a key work session should be offered to the child to explore how they are feeling and what they need.", reason: "The child's voice is not yet visible in the post-incident records. A key work session provides the opportunity to capture wishes and feelings.", suggestion_type: "key_work", related_record_id: "inc_038", child_name: "Casey T", risk_level: "medium", confidence_level: "high", reviewer_role: "Registered Manager", created_at: "2026-05-04T14:00:00Z" }),
  _caraBase({ id: "as_006", title: "Behaviour support plan review — changed presentation", summary: "The child's recent behaviour pattern differs from what the current behaviour support plan describes. The plan may need updating.", reason: "When a child's presentation changes, the behaviour support plan should be reviewed to ensure strategies remain appropriate and trauma-informed.", suggestion_type: "behaviour_support_review", related_record_id: "inc_038", child_name: "Casey T", risk_level: "medium", confidence_level: "medium", created_at: "2026-05-04T14:00:00Z" }),
  _caraBase({ id: "as_007", title: "Placement plan review — changed presentation", summary: "Following the pattern of incidents, the placement plan should be reviewed to ensure it reflects the child's current needs and that support is appropriate.", reason: "Placement stability review should be considered where incident patterns suggest changed need.", suggestion_type: "plan_review", related_record_id: "inc_042", child_name: "Alex W", risk_level: "high", confidence_level: "medium", status: "approved", created_at: "2026-05-03T10:00:00Z" }),
  _caraBase({ id: "as_008", title: "Notification consideration — repeated incidents", summary: "Three incidents involving the same child in two weeks. Consider whether the social worker and placing authority should be updated.", reason: "Repeated incidents may require notification under Regulation 40. The social worker should be kept informed of patterns, not just individual events.", suggestion_type: "notification", related_record_id: "inc_040", child_name: "Jordan M", risk_level: "high", confidence_level: "high", status: "rejected", created_at: "2026-05-02T11:00:00Z" }),
  _caraBase({ id: "as_009", title: "Management oversight — minor damage incident", summary: "A minor damage incident was recorded. Management oversight should confirm the response was proportionate and the child was supported.", reason: "All incidents benefit from management oversight, even where severity is low.", suggestion_type: "management_oversight", related_record_id: "inc_037", child_name: "Casey T", risk_level: "low", confidence_level: "high", status: "committed", created_at: "2026-05-01T09:00:00Z" }),
];

// ─── HR Risk Command Centre ──────────────────────────────────────────────────

export interface HrCaseSummaryRow {
  id: string;
  staffName: string;
  caseType: string;
  riskLevel: string;
  status: string;
  safeguardingStatus: string;
  openedAt: string;
  daysSinceOpened: number;
  lastActionAt: string;
  caseOwner: string;
  riOversightRequired: boolean;
  riOversightCompleted: boolean;
  overdueTaskCount: number;
}

export interface HrTaskSummaryRow {
  id: string;
  title: string;
  linkedCaseId?: string;
  assignedTo: string;
  dueDate: string;
  daysOverdue: number;
  priority: string;
}

export interface HrRecruitmentSummaryRow {
  staffName: string;
  completedChecks: number;
  totalChecks: number;
  gateOutcome: string;
  criticalMissing: string[];
}

export const hrCases: HrCaseSummaryRow[] = [
  { id: "hrc_001", staffName: "Staff Member A", caseType: "safeguarding_allegation", riskLevel: "black", status: "investigation", safeguardingStatus: "lado_consulted", openedAt: "2026-04-28", daysSinceOpened: 7, lastActionAt: "2026-05-04", caseOwner: "Registered Manager", riOversightRequired: true, riOversightCompleted: false, overdueTaskCount: 1 },
  { id: "hrc_002", staffName: "Staff Member B", caseType: "disciplinary", riskLevel: "red", status: "meeting_scheduled", safeguardingStatus: "not_safeguarding", openedAt: "2026-04-15", daysSinceOpened: 20, lastActionAt: "2026-05-02", caseOwner: "Registered Manager", riOversightRequired: false, riOversightCompleted: false, overdueTaskCount: 0 },
  { id: "hrc_003", staffName: "Staff Member C", caseType: "sickness_absence", riskLevel: "amber", status: "open", safeguardingStatus: "not_safeguarding", openedAt: "2026-03-20", daysSinceOpened: 46, lastActionAt: "2026-04-28", caseOwner: "Deputy Manager", riOversightRequired: false, riOversightCompleted: false, overdueTaskCount: 2 },
  { id: "hrc_004", staffName: "Staff Member D", caseType: "suspension", riskLevel: "red", status: "suspended", safeguardingStatus: "safeguarding_open", openedAt: "2026-04-22", daysSinceOpened: 13, lastActionAt: "2026-05-01", caseOwner: "Registered Manager", riOversightRequired: true, riOversightCompleted: true, overdueTaskCount: 0 },
  { id: "hrc_005", staffName: "Staff Member E", caseType: "probation", riskLevel: "green", status: "open", safeguardingStatus: "not_safeguarding", openedAt: "2026-02-10", daysSinceOpened: 84, lastActionAt: "2026-04-30", caseOwner: "Deputy Manager", riOversightRequired: false, riOversightCompleted: false, overdueTaskCount: 0 },
  { id: "hrc_006", staffName: "Staff Member F", caseType: "grievance", riskLevel: "amber", status: "outcome_pending", safeguardingStatus: "not_safeguarding", openedAt: "2026-04-01", daysSinceOpened: 34, lastActionAt: "2026-04-25", caseOwner: "Registered Manager", riOversightRequired: false, riOversightCompleted: false, overdueTaskCount: 1 },
];

export const hrOverdueTasks: HrTaskSummaryRow[] = [
  { id: "hrt_001", title: "Schedule LADO strategy discussion", linkedCaseId: "hrc_001", assignedTo: "Registered Manager", dueDate: "2026-05-03", daysOverdue: 2, priority: "urgent" },
  { id: "hrt_002", title: "Send return-to-work meeting invite", linkedCaseId: "hrc_003", assignedTo: "Deputy Manager", dueDate: "2026-05-01", daysOverdue: 4, priority: "high" },
  { id: "hrt_003", title: "Chase occupational health referral", linkedCaseId: "hrc_003", assignedTo: "Deputy Manager", dueDate: "2026-04-28", daysOverdue: 7, priority: "medium" },
  { id: "hrt_004", title: "Outcome letter to be drafted", linkedCaseId: "hrc_006", assignedTo: "Registered Manager", dueDate: "2026-05-02", daysOverdue: 3, priority: "high" },
];

export const hrRecruitment: HrRecruitmentSummaryRow[] = [
  { staffName: "New Starter G", completedChecks: 14, totalChecks: 14, gateOutcome: "approved", criticalMissing: [] },
  { staffName: "New Starter H", completedChecks: 9, totalChecks: 14, gateOutcome: "blocked", criticalMissing: ["Enhanced DBS", "Second reference", "Barred list check", "Health declaration", "Manager sign-off"] },
  { staffName: "New Starter I", completedChecks: 12, totalChecks: 14, gateOutcome: "senior_risk_acceptance", criticalMissing: ["Qualification verification", "Induction plan"] },
];

// ─── HR Inspection Mode ──────────────────────────────────────────────────────

export interface HrInspectionWorkforce {
  totalStaff: number;
  permanentStaff: number;
  agencyStaff: number;
  vacancies: number;
  staffInProbation: number;
  staffSuspended: number;
  averageTenureMonths: number;
  turnoverLast12Months: number;
}

export const hrInspectionWorkforce: HrInspectionWorkforce = {
  totalStaff: 18, permanentStaff: 14, agencyStaff: 4, vacancies: 2,
  staffInProbation: 3, staffSuspended: 1, averageTenureMonths: 22, turnoverLast12Months: 4,
};

export const hrInspectionRecruitment: Array<Record<string, unknown>> = [
  { staffRef: "Staff Member G", startDate: "2026-04-01", dbsCleared: true, dbsDate: "2026-03-20", referencesReceived: true, referenceCount: 2, rightToWork: true, qualificationsVerified: true, healthDeclaration: true, safeguardingTraining: true, gateOutcome: "approved", outstandingItems: [] },
  { staffRef: "Staff Member H", startDate: "2026-04-15", dbsCleared: true, dbsDate: "2026-04-10", referencesReceived: false, referenceCount: 1, rightToWork: true, qualificationsVerified: true, healthDeclaration: true, safeguardingTraining: false, gateOutcome: "blocked", outstandingItems: ["Second reference", "Safeguarding training"] },
  { staffRef: "Staff Member I", startDate: "2026-03-10", dbsCleared: true, dbsDate: "2026-03-05", referencesReceived: true, referenceCount: 2, rightToWork: true, qualificationsVerified: false, healthDeclaration: true, safeguardingTraining: true, gateOutcome: "senior_risk_acceptance", outstandingItems: ["Qualification certificate — RI risk accepted pending verification"] },
];

export const hrInspectionCases: Array<Record<string, unknown>> = [
  { id: "hrc_001", staffRef: "Staff Member A", caseType: "safeguarding_allegation", riskLevel: "black", status: "investigation", safeguardingStatus: "lado_consulted", openedAt: "2026-04-28", daysDuration: 7, actionCount: 8, lettersIssued: 2, guardianReviews: 2, riOversightRequired: true, riOversightCompleted: false },
  { id: "hrc_002", staffRef: "Staff Member B", caseType: "disciplinary", riskLevel: "red", status: "meeting_scheduled", safeguardingStatus: "not_safeguarding", openedAt: "2026-04-15", daysDuration: 20, actionCount: 5, lettersIssued: 1, guardianReviews: 1, riOversightRequired: false, riOversightCompleted: false },
  { id: "hrc_003", staffRef: "Staff Member C", caseType: "sickness_absence", riskLevel: "amber", status: "open", safeguardingStatus: "not_safeguarding", openedAt: "2026-03-20", daysDuration: 46, actionCount: 3, lettersIssued: 1, guardianReviews: 0, riOversightRequired: false, riOversightCompleted: false },
  { id: "hrc_004", staffRef: "Staff Member D", caseType: "suspension", riskLevel: "red", status: "suspended", safeguardingStatus: "safeguarding_open", openedAt: "2026-04-22", daysDuration: 13, actionCount: 6, lettersIssued: 1, guardianReviews: 1, riOversightRequired: true, riOversightCompleted: true },
  { id: "hrc_006", staffRef: "Staff Member F", caseType: "grievance", riskLevel: "amber", status: "outcome_pending", safeguardingStatus: "not_safeguarding", openedAt: "2026-04-01", daysDuration: 34, actionCount: 7, lettersIssued: 2, guardianReviews: 1, riOversightRequired: false, riOversightCompleted: false },
  { id: "hrc_closed_001", staffRef: "Staff Member J", caseType: "conduct", riskLevel: "green", status: "closed", safeguardingStatus: "not_safeguarding", openedAt: "2026-01-10", closedAt: "2026-03-05", daysDuration: 54, actionCount: 9, lettersIssued: 3, guardianReviews: 2, riOversightRequired: false, riOversightCompleted: false, outcome: "Written warning issued" },
];

export const hrInspectionChronology: Array<Record<string, unknown>> = [
  { date: "2026-04-28", caseRef: "hrc_001", staffRef: "Staff Member A", event: "Safeguarding allegation received — child disclosed concern to key worker", significance: "critical" },
  { date: "2026-04-28", caseRef: "hrc_001", staffRef: "Staff Member A", event: "LADO consultation initiated within 1 hour of disclosure", significance: "critical" },
  { date: "2026-04-28", caseRef: "hrc_001", staffRef: "Staff Member A", event: "Staff member informed of allegation and precautionary measures", significance: "significant" },
  { date: "2026-04-22", caseRef: "hrc_004", staffRef: "Staff Member D", event: "Suspension decision taken — five risk factors assessed, alternatives considered and recorded", significance: "critical" },
  { date: "2026-04-22", caseRef: "hrc_004", staffRef: "Staff Member D", event: "Welfare plan established for suspended staff member", significance: "significant" },
  { date: "2026-04-15", caseRef: "hrc_002", staffRef: "Staff Member B", event: "Disciplinary concern raised following pattern of recording failures", significance: "significant" },
  { date: "2026-04-15", caseRef: "hrc_002", staffRef: "Staff Member B", event: "Investigation commenced — terms of reference drafted and shared", significance: "significant" },
  { date: "2026-04-01", caseRef: "hrc_006", staffRef: "Staff Member F", event: "Formal grievance submitted in writing", significance: "significant" },
  { date: "2026-03-20", caseRef: "hrc_003", staffRef: "Staff Member C", event: "Sickness absence exceeds trigger point (10 days rolling)", significance: "routine" },
  { date: "2026-03-05", caseRef: "hrc_closed_001", staffRef: "Staff Member J", event: "Conduct case closed — written warning issued following investigation", significance: "significant" },
];

export const hrInspectionSuspensions: Array<Record<string, unknown>> = [
  { staffRef: "Staff Member D", startDate: "2026-04-22", daysActive: 13, reason: "Safeguarding allegation — precautionary pending investigation", riskFactorsConsidered: true, alternativesConsidered: true, welfarePlanInPlace: true, reviewsDue: 2, reviewsCompleted: 1, ladoLinked: true, resolved: false },
  { staffRef: "Staff Member K", startDate: "2026-02-10", endDate: "2026-03-15", daysActive: 33, reason: "Serious conduct allegation", riskFactorsConsidered: true, alternativesConsidered: true, welfarePlanInPlace: true, reviewsDue: 3, reviewsCompleted: 3, ladoLinked: false, resolved: true, resolutionOutcome: "Returned to work with support plan" },
];

export const hrInspectionLado: Array<Record<string, unknown>> = [
  { staffRef: "Staff Member A", referralDate: "2026-04-28", allegationCategory: "Behaviour that may have harmed a child", status: "open", dbsReferralMade: false, ofstedNotified: true },
  { staffRef: "Staff Member L", referralDate: "2026-01-15", allegationCategory: "Conduct towards a child", ladoOutcome: "Unsubstantiated", status: "closed", dbsReferralMade: false, ofstedNotified: true, daysToResolution: 42 },
];

export const hrInspectionCompliance: Array<Record<string, unknown>> = [
  { staffRef: "Staff Member A", dbsStatus: "current", dbsUpdateServiceRegistered: true, mandatoryTrainingComplete: true, mandatoryTrainingGaps: [], lastSupervisionDate: "2026-04-20", supervisionOverdueDays: 0, lastAppraisalDate: "2025-11-15", appraisalOverdueDays: 0 },
  { staffRef: "Staff Member B", dbsStatus: "current", dbsUpdateServiceRegistered: false, mandatoryTrainingComplete: true, mandatoryTrainingGaps: [], lastSupervisionDate: "2026-04-18", supervisionOverdueDays: 0, lastAppraisalDate: "2025-10-20", appraisalOverdueDays: 0 },
  { staffRef: "Staff Member C", dbsStatus: "current", dbsUpdateServiceRegistered: true, mandatoryTrainingComplete: false, mandatoryTrainingGaps: ["First aid refresher"], lastSupervisionDate: "2026-03-10", supervisionOverdueDays: 12, lastAppraisalDate: "2025-09-15", appraisalOverdueDays: 0 },
  { staffRef: "Staff Member D", dbsStatus: "current", dbsUpdateServiceRegistered: true, mandatoryTrainingComplete: true, mandatoryTrainingGaps: [], lastSupervisionDate: "2026-04-10", supervisionOverdueDays: 0, lastAppraisalDate: "2025-08-01", appraisalOverdueDays: 90 },
  { staffRef: "Staff Member E", dbsStatus: "due_renewal", dbsUpdateServiceRegistered: false, mandatoryTrainingComplete: true, mandatoryTrainingGaps: [], lastSupervisionDate: "2026-04-25", supervisionOverdueDays: 0, lastAppraisalDate: "2026-01-10", appraisalOverdueDays: 0 },
  { staffRef: "Staff Member F", dbsStatus: "current", dbsUpdateServiceRegistered: true, mandatoryTrainingComplete: false, mandatoryTrainingGaps: ["Safeguarding refresher", "Medication administration"], lastSupervisionDate: "2026-02-20", supervisionOverdueDays: 30, lastAppraisalDate: "2025-12-05", appraisalOverdueDays: 0 },
];

export const hrInspectionOversight: Array<Record<string, unknown>> = [
  { caseRef: "hrc_004", staffRef: "Staff Member D", oversightType: "ri_review", completedBy: "Responsible Individual", completedAt: "2026-04-25", findingSummary: "Suspension decision proportionate. Welfare plan in place. LADO consultation timely.", actionsRequired: 1, actionsCompleted: 1 },
  { caseRef: "hrc_closed_001", staffRef: "Staff Member J", oversightType: "rm_quality_check", completedBy: "Registered Manager", completedAt: "2026-03-06", findingSummary: "Investigation thorough. Outcome proportionate. Learning actions identified and logged.", actionsRequired: 2, actionsCompleted: 2 },
  { caseRef: "hrc_001", staffRef: "Staff Member A", oversightType: "ri_review", completedBy: "Responsible Individual", completedAt: "2026-04-30", findingSummary: "LADO referral timely. Ofsted notified. Investigation in progress — next review 5 May.", actionsRequired: 2, actionsCompleted: 1 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
let idCounter = 1000;
export function nextFallbackId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// LIVE-TENANT SEED GATE — same contract as src/lib/db/store.ts.
//
// The /api/intelligence/* routes read Supabase when configured and fall back to
// these arrays when it is not. On a MISCONFIGURED live tenant (mode=live but
// keys absent or wrong) that fallback previously served this seeded fiction as
// the home's own records — the worst possible degrade. With this gate it
// degrades to EMPTY instead. Emptied IN PLACE at module load: imports are live
// bindings to these consts, and runtime pushes still work afterwards. The one
// seeded OBJECT export (hrInspectionWorkforce — summary counts for the demo HR
// inspection cockpit) is deliberately left: hollowing an object breaks its
// consumer's shape, and that route's array sections all empty correctly. Treat
// its live output as headers-over-empty until the HR domain gets real tables.
// ══════════════════════════════════════════════════════════════════════════════
if (isLiveTenant()) {
  for (const rows of [
    reg44Visits, reg44Actions, reg45Reviews, reg45Evidence,
    incidentLearningReviews, voiceEntries, progressGoals, progressEntries,
    outcomeSnapshots, evidenceItems, staffPassportRecords,
    providerHomeSummaries, providerOversightLog, attentionItems,
    caraSuggestions, hrCases, hrOverdueTasks, hrRecruitment,
    hrInspectionRecruitment, hrInspectionCases, hrInspectionChronology,
    hrInspectionSuspensions, hrInspectionLado, hrInspectionCompliance,
    hrInspectionOversight,
  ]) {
    rows.length = 0;
  }
}

