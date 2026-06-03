// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORD QUALITY SCORE
//
// A deterministic assessment of how well a record is written, across the
// dimensions Ofsted actually scrutinises: is it complete, clear, professional,
// factual, child-centred, and does it address risk where relevant? Weak recording
// is one of the most common reasons a home is marked down — this turns recording
// quality into something measurable, coachable and improvable.
//
// All scores are 0-100. childCentredness and riskRelevance are the dimensions
// inspectors weigh most heavily for children's records.
// ══════════════════════════════════════════════════════════════════════════════

export type RecordQualityScore = {
  completeness: number;
  clarity: number;
  professionalLanguage: number;
  factuality: number;
  childCentredness: number;
  riskRelevance: number;
  missingFields: string[];
  ariaSuggestions: string[];
};
