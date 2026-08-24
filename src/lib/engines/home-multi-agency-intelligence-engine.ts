// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME MULTI-AGENCY INTELLIGENCE ENGINE
// Home-level: aggregates multi-agency meetings, professional attendance,
// IRO correspondence, police contacts, and partnership working quality.
// Working Together 2023: "Inter-agency cooperation."
// CHR 2015 Reg 5/22: "Engaging with partner agencies."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export interface MultiAgencyMeetingInput {
  id: string;
  child_id: string;
  meeting_type: string;
  meeting_status: string;           // scheduled | completed | cancelled | postponed
  date: string;
  child_participation: string;
  action_items_count: number;
  actions_completed: number;
  attendees_count: number;
}

export interface ProfessionalMeetingInput {
  id: string;
  child_id: string;
  meeting_date: string;
  meeting_type: string;
  child_attended: boolean;
  agencies_present: string[];
  actions_for_home_count: number;
  report_submitted: boolean;
  home_contribution: string;
}

export interface IROCorrespondenceInput {
  id: string;
  child_id: string;
  date: string;
  direction: string;                // from_iro | to_iro
  response_required: boolean;
  response_sent: boolean;
  response_deadline: string;
  formal_dispute: boolean;
}

export interface PoliceContactInput {
  id: string;
  child_id: string;
  contact_date: string;
  home_protocol_followed: boolean;
  concordat_principles_applied: boolean;
  appropriate_adult_present: boolean;
  restorative_opportunity: boolean;
  follow_up_required: boolean;
  follow_up_action: string | null;
}

export interface HomeMultiAgencyInput {
  today: string;
  multi_agency_meetings: MultiAgencyMeetingInput[];
  professional_meetings: ProfessionalMeetingInput[];
  iro_correspondence: IROCorrespondenceInput[];
  police_contacts: PoliceContactInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type MultiAgencyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface MeetingProfile {
  total_meetings_90d: number;
  completed_meetings: number;
  cancelled_meetings: number;
  child_participation_rate: number | null;
  action_completion_rate: number | null;
  by_type: Record<string, number>;
}

export interface ProfMeetingProfile {
  total_90d: number;
  child_attendance_rate: number | null;
  report_submission_rate: number | null;
  avg_agencies_per_meeting: number | null;
  unique_agencies: number;
}

export interface IROProfile {
  total_correspondence: number;
  response_compliance_rate: number | null;
  overdue_responses: number;
  formal_disputes: number;
}

export interface PoliceContactProfile {
  total_contacts_90d: number;
  protocol_compliance_rate: number | null;
  concordat_rate: number | null;
  appropriate_adult_rate: number | null;
  restorative_rate: number | null;
}

export interface HomeMultiAgencyResult {
  multi_agency_rating: MultiAgencyRating;
  multi_agency_score: number | null;
  headline: string;
  meetings: MeetingProfile;
  professional_meetings: ProfMeetingProfile;
  iro: IROProfile;
  police: PoliceContactProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeMultiAgency(
  input: HomeMultiAgencyInput,
): HomeMultiAgencyResult {
  const { today, multi_agency_meetings, professional_meetings, iro_correspondence, police_contacts, total_children } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0 && multi_agency_meetings.length === 0 && professional_meetings.length === 0) {
    return {
      multi_agency_rating: "insufficient_data",
      multi_agency_score: 0,
      headline: "No multi-agency data available for analysis.",
      meetings: { total_meetings_90d: 0, completed_meetings: 0, cancelled_meetings: 0, child_participation_rate: null, action_completion_rate: null, by_type: {} },
      professional_meetings: { total_90d: 0, child_attendance_rate: null, report_submission_rate: null, avg_agencies_per_meeting: 0, unique_agencies: 0 },
      iro: { total_correspondence: 0, response_compliance_rate: null, overdue_responses: 0, formal_disputes: 0 },
      police: { total_contacts_90d: 0, protocol_compliance_rate: null, concordat_rate: null, appropriate_adult_rate: null, restorative_rate: null },
      strengths: [],
      concerns: ["No multi-agency partnership data — collaboration cannot be assessed."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Multi-Agency Meetings (90d) ───────────────────────────────────────
  const meetings90d = multi_agency_meetings.filter(m => {
    const d = daysBetween(m.date, today);
    return d >= 0 && d <= 90;
  });

  const completedMeetings = meetings90d.filter(m => m.meeting_status === "completed").length;
  const cancelledMeetings = meetings90d.filter(m => m.meeting_status === "cancelled").length;
  const withParticipation = meetings90d.filter(m =>
    m.meeting_status === "completed" && m.child_participation !== "" && m.child_participation !== "none",
  );
  const childParticipationRate = pct(withParticipation.length, completedMeetings);
  const totalActions = meetings90d.reduce((sum, m) => sum + m.action_items_count, 0);
  const completedActions = meetings90d.reduce((sum, m) => sum + m.actions_completed, 0);
  const actionCompletionRate = pct(completedActions, totalActions);

  const byType: Record<string, number> = {};
  for (const m of meetings90d) {
    byType[m.meeting_type] = (byType[m.meeting_type] ?? 0) + 1;
  }

  const meetingProfile: MeetingProfile = {
    total_meetings_90d: meetings90d.length,
    completed_meetings: completedMeetings,
    cancelled_meetings: cancelledMeetings,
    child_participation_rate: childParticipationRate,
    action_completion_rate: actionCompletionRate,
    by_type: byType,
  };

  // ── Professional Meetings (90d) ───────────────────────────────────────
  const profMeetings90d = professional_meetings.filter(m => {
    const d = daysBetween(m.meeting_date, today);
    return d >= 0 && d <= 90;
  });

  const childAttendanceRate = pct(
    profMeetings90d.filter(m => m.child_attended).length,
    profMeetings90d.length,
  );
  const reportSubmissionRate = pct(
    profMeetings90d.filter(m => m.report_submitted).length,
    profMeetings90d.length,
  );
  const allAgencies = new Set<string>();
  let totalAgencies = 0;
  for (const m of profMeetings90d) {
    totalAgencies += m.agencies_present.length;
    for (const a of m.agencies_present) allAgencies.add(a);
  }
  const avgAgencies = profMeetings90d.length > 0
    ? Math.round((totalAgencies / profMeetings90d.length) * 10) / 10
    : null;

  const profMeetingProfile: ProfMeetingProfile = {
    total_90d: profMeetings90d.length,
    child_attendance_rate: childAttendanceRate,
    report_submission_rate: reportSubmissionRate,
    avg_agencies_per_meeting: avgAgencies,
    unique_agencies: allAgencies.size,
  };

  // ── IRO Correspondence ────────────────────────────────────────────────
  const iroRequiringResponse = iro_correspondence.filter(c => c.response_required);
  const iroResponseSent = iroRequiringResponse.filter(c => c.response_sent).length;
  const responseComplianceRate = pct(iroResponseSent, iroRequiringResponse.length);
  const overdueIRO = iroRequiringResponse.filter(c =>
    !c.response_sent && daysBetween(c.response_deadline, today) > 0,
  ).length;
  const formalDisputes = iro_correspondence.filter(c => c.formal_dispute).length;

  const iroProfile: IROProfile = {
    total_correspondence: iro_correspondence.length,
    response_compliance_rate: responseComplianceRate,
    overdue_responses: overdueIRO,
    formal_disputes: formalDisputes,
  };

  // ── Police Contacts (90d) ─────────────────────────────────────────────
  const policeContacts90d = police_contacts.filter(c => {
    const d = daysBetween(c.contact_date, today);
    return d >= 0 && d <= 90;
  });

  const protocolRate = pct(
    policeContacts90d.filter(c => c.home_protocol_followed).length,
    policeContacts90d.length,
  );
  const concordatRate = pct(
    policeContacts90d.filter(c => c.concordat_principles_applied).length,
    policeContacts90d.length,
  );
  const appropriateAdultRate = pct(
    policeContacts90d.filter(c => c.appropriate_adult_present).length,
    policeContacts90d.length,
  );
  const restorativeRate = pct(
    policeContacts90d.filter(c => c.restorative_opportunity).length,
    policeContacts90d.length,
  );

  const policeProfile: PoliceContactProfile = {
    total_contacts_90d: policeContacts90d.length,
    protocol_compliance_rate: protocolRate,
    concordat_rate: concordatRate,
    appropriate_adult_rate: appropriateAdultRate,
    restorative_rate: restorativeRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80
  let score = 52;

  // mod1: Meeting action completion (±5) — partnership actions followed through
  if (totalActions === 0) {
    score += (completedMeetings > 0 ? 2 : 0);
  } else {
    if (actionCompletionRate >= 90) score += 5;
    else if (actionCompletionRate >= 70) score += 3;
    else if (actionCompletionRate >= 50) score += 0;
    else score -= 5;
  }

  // mod2: Child participation (±4) — child's voice in multi-agency
  if (completedMeetings === 0) {
    score += 0;
  } else {
    if (childParticipationRate >= 80) score += 4;
    else if (childParticipationRate >= 60) score += 2;
    else if (childParticipationRate >= 40) score += 0;
    else score -= 4;
  }

  // mod3: IRO response compliance (±4) — statutory correspondence
  if (iroRequiringResponse.length === 0) {
    score += 2; // No IRO correspondence requiring response = neutral-positive
  } else {
    if (responseComplianceRate >= 100 && overdueIRO === 0) score += 4;
    else if (responseComplianceRate >= 80) score += 2;
    else if (responseComplianceRate >= 50) score += 0;
    else score -= 4;
  }

  // mod4: Report submission (±3) — professional accountability
  if (profMeetings90d.length === 0) {
    score += 1;
  } else {
    if (reportSubmissionRate >= 90) score += 3;
    else if (reportSubmissionRate >= 70) score += 1;
    else if (reportSubmissionRate >= 50) score += 0;
    else score -= 3;
  }

  // mod5: Police protocol compliance (±4) — safeguarding in police contacts
  if (policeContacts90d.length === 0) {
    score += 2; // No police contacts = positive
  } else {
    if (protocolRate >= 100 && concordatRate >= 80) score += 4;
    else if (protocolRate >= 80) score += 2;
    else if (protocolRate >= 60) score += 0;
    else score -= 4;
  }

  // mod6: Partnership breadth (±3) — diverse agencies engaged
  if (allAgencies.size >= 5) score += 3;
  else if (allAgencies.size >= 3) score += 1;
  else if (allAgencies.size >= 1) score += 0;
  else score -= 3;

  // mod7: Meeting cancellation rate (±3) — reliability of multi-agency engagement
  if (meetings90d.length === 0) {
    score += 0;
  } else {
    const cancellationRate = pct(cancelledMeetings, meetings90d.length);
    if (cancellationRate === 0) score += 3;
    else if (cancellationRate <= 15) score += 1;
    else if (cancellationRate <= 30) score += 0;
    else score -= 3;
  }

  // mod8: Formal disputes (±2) — relationship quality with IRO
  if (formalDisputes === 0) score += 2;
  else if (formalDisputes === 1) score += 0;
  else score -= 2;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let multi_agency_rating: MultiAgencyRating;
  if (score >= 80) multi_agency_rating = "outstanding";
  else if (score >= 65) multi_agency_rating = "good";
  else if (score >= 45) multi_agency_rating = "adequate";
  else multi_agency_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (actionCompletionRate >= 90 && totalActions > 0) strengths.push(`${actionCompletionRate}% of multi-agency actions completed — the home follows through on partnership commitments.`);
  if (childParticipationRate >= 80 && completedMeetings > 0) strengths.push(`${childParticipationRate}% child participation in multi-agency meetings — children's voices are central to planning.`);
  if (responseComplianceRate >= 100 && iroRequiringResponse.length > 0) strengths.push("100% IRO response compliance — statutory correspondence is prompt and thorough.");
  if (reportSubmissionRate >= 90 && profMeetings90d.length > 0) strengths.push(`${reportSubmissionRate}% report submission rate for professional meetings — strong accountability.`);
  if (protocolRate >= 100 && policeContacts90d.length > 0) strengths.push("100% protocol compliance in police contacts — safeguarding children's rights in every interaction.");
  if (allAgencies.size >= 5) strengths.push(`${allAgencies.size} unique agencies engaged — broad multi-agency network supporting children.`);

  // Concerns
  if (overdueIRO > 0) concerns.push(`${overdueIRO} overdue IRO response${overdueIRO > 1 ? "s" : ""} — statutory correspondence must be timely.`);
  if (formalDisputes >= 2) concerns.push(`${formalDisputes} formal IRO disputes — relationship with reviewing officers may need repair.`);
  if (cancelledMeetings >= 3) concerns.push(`${cancelledMeetings} cancelled multi-agency meetings in 90 days — partnership engagement may be faltering.`);
  if (actionCompletionRate < 50 && totalActions > 0) concerns.push(`Only ${actionCompletionRate}% of multi-agency actions completed — the home may be seen as an unreliable partner.`);
  if (childParticipationRate < 40 && completedMeetings > 0) concerns.push(`Only ${childParticipationRate}% child participation in meetings — Article 12 UNCRC requires their voice.`);
  if (protocolRate < 80 && policeContacts90d.length > 0) concerns.push(`Police contact protocol compliance only ${protocolRate}% — children's rights may not be consistently protected.`);

  // Recommendations
  if (overdueIRO > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Respond to all outstanding IRO correspondence immediately — overdue responses risk statutory escalation.", urgency: "immediate", regulatory_ref: "Reg 5" });
  }
  if (actionCompletionRate < 70 && totalActions > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Improve multi-agency action follow-through — assign named owners and track in supervision.", urgency: "soon", regulatory_ref: "WT 2023" });
  }
  if (childParticipationRate < 60 && completedMeetings > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Enhance child participation in multi-agency meetings through preparation, advocacy, and accessible formats.", urgency: "soon", regulatory_ref: "Reg 7" });
  }
  if (reportSubmissionRate < 70 && profMeetings90d.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Submit reports for all professional meetings — this demonstrates the home's voice and professional accountability.", urgency: "planned", regulatory_ref: "Reg 22" });
  }
  if (protocolRate < 100 && policeContacts90d.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Ensure 100% protocol compliance in all police contacts — review Concordat principles with all staff.", urgency: "soon", regulatory_ref: "Concordat" });
  }

  // Cara Insights
  if (actionCompletionRate >= 90 && childParticipationRate >= 80 && responseComplianceRate >= 100 && reportSubmissionRate >= 90) {
    insights.push({ text: "Multi-agency partnership is exemplary. Actions are completed, children participate, IRO correspondence is timely, and professional reports are submitted. Ofsted will recognise this as outstanding collaborative practice.", severity: "positive" });
  }
  if (formalDisputes >= 2 && overdueIRO >= 2) {
    insights.push({ text: `${formalDisputes} formal disputes and ${overdueIRO} overdue responses to IROs. The relationship with independent reviewing officers appears strained — consider requesting a professional meeting to rebuild trust.`, severity: "critical" });
  }
  if (cancelledMeetings >= 3 && actionCompletionRate < 50) {
    insights.push({ text: "High meeting cancellation rate combined with low action completion suggests the home is struggling to maintain effective multi-agency partnerships. This will concern Ofsted during inspection.", severity: "warning" });
  }
  if (restorativeRate >= 50 && policeContacts90d.length >= 2) {
    insights.push({ text: `${restorativeRate}% of police contacts resulted in restorative opportunities — the home is actively diverting children from criminalisation.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  const totalMeetings = meetings90d.length + profMeetings90d.length;
  let headline: string;
  if (multi_agency_rating === "outstanding") {
    headline = `Outstanding multi-agency partnership — ${totalMeetings} meetings, ${allAgencies.size} agencies engaged.`;
  } else if (multi_agency_rating === "good") {
    headline = `Good partnership working — ${actionCompletionRate}% action completion. ${concerns.length > 0 ? concerns.length + " area" + (concerns.length > 1 ? "s" : "") + " for improvement." : ""}`;
  } else if (multi_agency_rating === "adequate") {
    headline = `Multi-agency working needs improvement — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified.`;
  } else {
    headline = `Multi-agency partnership is inadequate — significant gaps in meeting attendance, action completion, or statutory correspondence.`;
  }

  return {
    multi_agency_rating,
    multi_agency_score: score,
    headline,
    meetings: meetingProfile,
    professional_meetings: profMeetingProfile,
    iro: iroProfile,
    police: policeProfile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
