// ══════════════════════════════════════════════════════════════════════════════
// SMART LINKING SERVICE
//
// Deterministic suggestion engine that proposes record links when a new
// record is created. No AI dependency — rules are based on record type
// and available context.
// ══════════════════════════════════════════════════════════════════════════════

import type { SmartLinkSuggestion } from "@/types/intelligence.layer";

export interface SmartLinkContext {
  sourceType: string;
  sourceId: string;
  childId?: string;
  staffId?: string;
  homeId: string;
  severity?: string;
  category?: string;
}

export function suggestSmartLinks(ctx: SmartLinkContext): SmartLinkSuggestion[] {
  const suggestions: SmartLinkSuggestion[] = [];

  switch (ctx.sourceType) {
    case "incident":
      if (ctx.childId) {
        suggestions.push(
          { targetType: "child_profile", relationship: "involves_child", reason: "Incident involves this child", autoLink: true },
          { targetType: "risk_assessment", relationship: "may_require_update", reason: "Risk assessment may need reviewing after this incident", autoLink: false },
          { targetType: "placement_plan", relationship: "may_require_update", reason: "Placement plan may need updating", autoLink: false },
          { targetType: "child_progress", relationship: "evidence_of_progress", reason: "Record as part of child's progress timeline", autoLink: false },
        );
      }
      suggestions.push(
        { targetType: "daily_log", relationship: "recorded_same_day", reason: "Link to the daily log entry for context", autoLink: false },
        { targetType: "inspection_evidence", relationship: "evidence_item", reason: "Add to Ofsted evidence room", autoLink: false },
        { targetType: "reg44_evidence", relationship: "evidence_for_reg44", reason: "Include in next Reg 44 report", autoLink: false },
        { targetType: "reg45_evidence", relationship: "evidence_for_reg45", reason: "Include in next Reg 45 review", autoLink: false },
        { targetType: "manager_oversight", relationship: "requires_oversight", reason: "Manager oversight needed", autoLink: false },
      );
      if (ctx.severity === "serious" || ctx.severity === "high") {
        suggestions.push(
          { targetType: "ri_notification", relationship: "requires_notification", reason: "RI may need to be notified of this serious incident", autoLink: false },
        );
      }
      break;

    case "key_work":
      if (ctx.childId) {
        suggestions.push(
          { targetType: "child_voice", relationship: "captures_voice", reason: "Capture the child's voice from this session", autoLink: false },
          { targetType: "child_progress", relationship: "evidence_of_progress", reason: "Link to a progress goal", autoLink: false },
          { targetType: "placement_plan", relationship: "informs_planning", reason: "Key work may inform placement planning", autoLink: false },
          { targetType: "inspection_evidence", relationship: "evidence_item", reason: "Add to evidence room — child voice and engagement", autoLink: false },
        );
      }
      break;

    case "complaint":
      suggestions.push(
        { targetType: "inspection_evidence", relationship: "evidence_item", reason: "Complaints are reviewed at inspection", autoLink: true },
        { targetType: "reg45_evidence", relationship: "evidence_for_reg45", reason: "Include in Reg 45 quality review", autoLink: false },
        { targetType: "manager_oversight", relationship: "requires_oversight", reason: "Manager oversight on complaint handling", autoLink: false },
      );
      if (ctx.childId) {
        suggestions.push(
          { targetType: "child_voice", relationship: "captures_voice", reason: "Complaint may reflect the child's views", autoLink: false },
        );
      }
      break;

    case "training_gap":
      if (ctx.staffId) {
        suggestions.push(
          { targetType: "staff_passport", relationship: "competence_gap", reason: "Update staff competence passport", autoLink: true },
          { targetType: "rota_warning", relationship: "restricts_duties", reason: "May affect shift allocation", autoLink: false },
          { targetType: "manager_dashboard", relationship: "requires_attention", reason: "Flag on manager control centre", autoLink: false },
        );
      }
      break;

    case "supervision":
      if (ctx.staffId) {
        suggestions.push(
          { targetType: "staff_passport", relationship: "supervision_completed", reason: "Update supervision record on passport", autoLink: true },
          { targetType: "inspection_evidence", relationship: "evidence_item", reason: "Supervision evidence for inspection", autoLink: false },
        );
      }
      break;

    case "daily_log":
      if (ctx.childId) {
        suggestions.push(
          { targetType: "child_progress", relationship: "evidence_of_progress", reason: "May evidence progress on a goal", autoLink: false },
          { targetType: "child_voice", relationship: "captures_voice", reason: "Daily log may contain the child's voice", autoLink: false },
        );
      }
      break;

    case "reg44_visit":
      suggestions.push(
        { targetType: "inspection_evidence", relationship: "evidence_item", reason: "Reg 44 visit is inspection evidence", autoLink: true },
        { targetType: "manager_dashboard", relationship: "requires_response", reason: "Manager response needed", autoLink: false },
        { targetType: "ri_oversight", relationship: "requires_ri_review", reason: "RI should review the Reg 44 report", autoLink: false },
      );
      break;

    case "missing_from_care":
      if (ctx.childId) {
        suggestions.push(
          { targetType: "risk_assessment", relationship: "may_require_update", reason: "Missing episode may change risk profile", autoLink: false },
          { targetType: "child_profile", relationship: "involves_child", reason: "Link to child profile", autoLink: true },
          { targetType: "inspection_evidence", relationship: "evidence_item", reason: "Missing episodes are reviewed at inspection", autoLink: true },
          { targetType: "manager_oversight", relationship: "requires_oversight", reason: "Manager oversight on return and follow-up", autoLink: false },
        );
      }
      break;

    default:
      if (ctx.childId) {
        suggestions.push(
          { targetType: "child_profile", relationship: "relates_to_child", reason: "Record relates to this child", autoLink: true },
        );
      }
      if (ctx.staffId) {
        suggestions.push(
          { targetType: "staff_passport", relationship: "relates_to_staff", reason: "Record relates to this staff member", autoLink: true },
        );
      }
      break;
  }

  return suggestions;
}
