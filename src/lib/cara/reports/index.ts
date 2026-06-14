// ══════════════════════════════════════════════════════════════════════════════
// Cara — REPORT SERVICES BARREL EXPORT
// ══════════════════════════════════════════════════════════════════════════════

// Report generation
export {
  generateChildReport,
  getReport,
  updateReportSection,
  rewriteSection,
} from "./report-generator";

// Section templates
export {
  REPORT_SECTION_TEMPLATES,
  getSectionsForReportType,
  getRequiredSections,
  getChildVoiceSections,
  getEvidenceSections,
} from "./report-templates";
export type { SectionTemplate } from "./report-templates";

// Approval workflow
export {
  submitForReview,
  approveReport,
  rejectReport,
  lockReport,
  archiveReport,
} from "./approval-workflow";

// Regulation 45 linking
export {
  linkReportToReg45,
  getReg45Evidence,
} from "./reg45-linking";

// Filing cabinet integration
export {
  fileLockedReport,
  buildReportFilingPath,
  previewFilingPath,
} from "./report-filing";
export type { ReportFilingResult } from "./report-filing";
