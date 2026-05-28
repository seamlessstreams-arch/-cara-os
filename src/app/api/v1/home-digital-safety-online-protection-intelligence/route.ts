// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DIGITAL SAFETY & ONLINE PROTECTION INTELLIGENCE API ROUTE
// GET /api/v1/home-digital-safety-online-protection-intelligence
// Cross-domain composite: esafetyTrainingRecords + internetUsageLogs +
// socialMediaAssessments + onlineAccessAgreements + digitalLiteracyRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeDigitalSafetyOnlineProtection,
  type EsafetyTrainingRecordInput,
  type InternetUsageLogInput,
  type SocialMediaAssessmentInput,
  type OnlineAccessAgreementInput,
  type DigitalLiteracyRecordInput,
} from "@/lib/engines/home-digital-safety-online-protection-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawEsafetyTraining = (store.esafetyTrainingRecords ?? []) as any[];
    const esafety_training_records: EsafetyTrainingRecordInput[] = rawEsafetyTraining.map((t: any) => ({
      id: t.id ?? "",
      child_id: t.child_id ?? "",
      training_date: (t.training_date ?? today).toString(),
      training_type: t.training_type ?? "initial",
      topic: t.topic ?? "",
      completed: !!t.completed,
      completion_date: t.completion_date ?? null,
      assessment_score: t.assessment_score ?? null,
      passed: !!t.passed,
      trainer: t.trainer ?? "",
      next_due_date: t.next_due_date ?? null,
      overdue: !!t.overdue,
      child_engaged: !!t.child_engaged,
      child_understood: !!t.child_understood,
      follow_up_required: !!t.follow_up_required,
      follow_up_completed: !!t.follow_up_completed,
      notes: t.notes ?? "",
      created_at: (t.created_at ?? today).toString(),
    }));

    const rawInternetUsage = (store.internetUsageLogs ?? []) as any[];
    const internet_usage_logs: InternetUsageLogInput[] = rawInternetUsage.map((l: any) => ({
      id: l.id ?? "",
      child_id: l.child_id ?? "",
      log_date: (l.log_date ?? today).toString(),
      monitoring_active: !!l.monitoring_active,
      hours_online: l.hours_online ?? 0,
      sites_visited: l.sites_visited ?? 0,
      blocked_attempts: l.blocked_attempts ?? 0,
      flagged_content: !!l.flagged_content,
      flagged_content_category: l.flagged_content_category ?? null,
      action_taken: !!l.action_taken,
      action_description: l.action_description ?? null,
      parental_controls_enabled: !!l.parental_controls_enabled,
      age_appropriate_filters: !!l.age_appropriate_filters,
      reviewed_by_staff: !!l.reviewed_by_staff,
      review_date: l.review_date ?? null,
      risk_level: l.risk_level ?? "low",
      concerns_raised: !!l.concerns_raised,
      concern_description: l.concern_description ?? null,
      concern_resolved: !!l.concern_resolved,
      created_at: (l.created_at ?? today).toString(),
    }));

    const rawSocialMedia = (store.socialMediaAssessments ?? []) as any[];
    const social_media_assessments: SocialMediaAssessmentInput[] = rawSocialMedia.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      assessment_date: (a.assessment_date ?? today).toString(),
      platform: a.platform ?? "",
      account_known: !!a.account_known,
      privacy_settings_reviewed: !!a.privacy_settings_reviewed,
      privacy_settings_appropriate: !!a.privacy_settings_appropriate,
      risk_level: a.risk_level ?? "low",
      risks_identified: Array.isArray(a.risks_identified) ? a.risks_identified : [],
      mitigation_actions: Array.isArray(a.mitigation_actions) ? a.mitigation_actions : [],
      mitigation_completed: !!a.mitigation_completed,
      child_involved_in_assessment: !!a.child_involved_in_assessment,
      consent_obtained: !!a.consent_obtained,
      monitoring_plan_in_place: !!a.monitoring_plan_in_place,
      review_due_date: a.review_due_date ?? null,
      overdue: !!a.overdue,
      concerns_identified: !!a.concerns_identified,
      concerns_description: a.concerns_description ?? null,
      concerns_escalated: !!a.concerns_escalated,
      outcome: a.outcome ?? "",
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawAccessAgreements = (store.onlineAccessAgreements ?? []) as any[];
    const online_access_agreements: OnlineAccessAgreementInput[] = rawAccessAgreements.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      agreement_date: (a.agreement_date ?? today).toString(),
      agreement_type: a.agreement_type ?? "standard",
      signed_by_child: !!a.signed_by_child,
      signed_by_staff: !!a.signed_by_staff,
      signed_by_social_worker: !!a.signed_by_social_worker,
      terms_explained: !!a.terms_explained,
      child_understands_terms: !!a.child_understands_terms,
      devices_covered: Array.isArray(a.devices_covered) ? a.devices_covered : [],
      review_date: a.review_date ?? null,
      reviewed: !!a.reviewed,
      overdue: !!a.overdue,
      active: a.active !== false,
      breach_count: a.breach_count ?? 0,
      breach_actions_taken: !!a.breach_actions_taken,
      last_review_date: a.last_review_date ?? null,
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawDigitalLiteracy = (store.digitalLiteracyRecords ?? []) as any[];
    const digital_literacy_records: DigitalLiteracyRecordInput[] = rawDigitalLiteracy.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      activity_date: (r.activity_date ?? today).toString(),
      activity_type: r.activity_type ?? "workshop",
      topic: r.topic ?? "",
      skill_area: r.skill_area ?? "online_safety",
      completed: !!r.completed,
      engagement_level: r.engagement_level ?? "medium",
      progress_rating: r.progress_rating ?? 3,
      child_feedback_positive: !!r.child_feedback_positive,
      staff_assessment: r.staff_assessment ?? "",
      next_steps: r.next_steps ?? "",
      follow_up_date: r.follow_up_date ?? null,
      certification_earned: !!r.certification_earned,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeDigitalSafetyOnlineProtection({
      today,
      total_children,
      esafety_training_records,
      internet_usage_logs,
      social_media_assessments,
      online_access_agreements,
      digital_literacy_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
