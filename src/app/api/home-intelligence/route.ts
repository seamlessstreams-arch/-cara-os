import { NextResponse } from "next/server";
import {
  generateHomeIntelligenceSummary,
  type ModuleIntelligenceScore,
} from "@/lib/home-intelligence";

// ── Chamberlain House demo module scores ───────────────────────────────────────────

const DEMO_MODULE_SCORES: ModuleIntelligenceScore[] = [
  // ── Child Experiences Domain ──
  { moduleId: "children-outcomes", moduleName: "Children Outcomes", domain: "child_experiences", overallScore: 82, rating: "outstanding" },
  { moduleId: "therapeutic", moduleName: "Therapeutic", domain: "child_experiences", overallScore: 78, rating: "good" },
  { moduleId: "pocket-money", moduleName: "Pocket Money", domain: "child_experiences", overallScore: 71, rating: "good" },
  { moduleId: "education", moduleName: "Education", domain: "child_experiences", overallScore: 85, rating: "outstanding" },

  // ── Safety & Protection Domain ──
  { moduleId: "safeguarding-oversight", moduleName: "Safeguarding Oversight", domain: "safety_protection", overallScore: 88, rating: "outstanding" },
  { moduleId: "child-exploitation-prevention", moduleName: "Child Exploitation Prevention", domain: "safety_protection", overallScore: 76, rating: "good" },
  { moduleId: "escalation-intelligence", moduleName: "Escalation Intelligence", domain: "safety_protection", overallScore: 73, rating: "good" },
  { moduleId: "contextual-safeguarding", moduleName: "Contextual Safeguarding", domain: "safety_protection", overallScore: 81, rating: "outstanding" },
  { moduleId: "night-monitoring", moduleName: "Night Monitoring", domain: "safety_protection", overallScore: 79, rating: "good" },

  // ── Leadership & Management Domain ──
  { moduleId: "regulatory", moduleName: "Regulatory", domain: "leadership_management", overallScore: 87, rating: "outstanding" },
  { moduleId: "regulatory-self-assessment", moduleName: "Regulatory Self-Assessment", domain: "leadership_management", overallScore: 75, rating: "good" },
  { moduleId: "quality-ecology", moduleName: "Quality Ecology", domain: "leadership_management", overallScore: 80, rating: "outstanding" },
  { moduleId: "lessons-learned", moduleName: "Lessons Learned", domain: "leadership_management", overallScore: 74, rating: "good" },

  // ── Workforce & Operations Domain ──
  { moduleId: "shift-intelligence", moduleName: "Shift Intelligence", domain: "workforce_operations", overallScore: 77, rating: "good" },
  { moduleId: "filing-cabinet", moduleName: "Filing Cabinet", domain: "workforce_operations", overallScore: 83, rating: "outstanding" },
  { moduleId: "hr-files", moduleName: "HR Files", domain: "workforce_operations", overallScore: 72, rating: "good" },
  { moduleId: "multi-agency", moduleName: "Multi-Agency", domain: "workforce_operations", overallScore: 79, rating: "good" },
];

export async function GET() {
  const result = generateHomeIntelligenceSummary({
    homeId: "home-oak-house",
    homeName: "Chamberlain House",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
    moduleScores: DEMO_MODULE_SCORES,
    expectedModuleCount: 17,
  });

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        generatedAt: new Date().toISOString(),
        engine: "home-intelligence-engine",
        version: "1.0.0",
      },
    },
  });
}
