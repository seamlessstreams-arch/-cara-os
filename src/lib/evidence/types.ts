// ══════════════════════════════════════════════════════════════════════════════
// CARA — INSPECTION EVIDENCE PACK TYPES
// Type definitions for the Inspection Evidence Pack Generator.
// Used by the engine, API route, hook, and view component.
// ══════════════════════════════════════════════════════════════════════════════

export interface EvidenceSection {
  id: string;
  title: string;
  description: string;
  ofsted_reference?: string;
  data_sources: string[];
  items: EvidenceItem[];
  score?: number;
  rating?: "outstanding" | "good" | "adequate" | "inadequate" | "not_assessed";
  summary: string;
}

export interface EvidenceItem {
  id: string;
  type: string;
  title: string;
  date: string;
  summary: string;
  linked_record_type: string;
  linked_record_id: string;
  child_id?: string;
  staff_id?: string;
  risk_level?: string;
  tags: string[];
}

export interface InspectionEvidencePack {
  generated_at: string;
  generated_by: string;
  home_id: string;
  home_name: string;
  period_from: string;
  period_to: string;
  overall_rating: string;
  overall_score: number | null; // null when no section could be scored at all
  sections: EvidenceSection[];
  strengths: string[];
  areas_for_improvement: string[];
  outstanding_actions: EvidenceItem[];
  total_evidence_items: number;
  children_count: number;
  staff_count: number;
}
