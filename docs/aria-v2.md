# ARIA V2 — Pattern Intelligence Layer

V2 adds proactive intelligence on top of V1's suggestion workflow. Where V1 reacts to individual incidents, V2 detects patterns across incidents, identifies children whose voice is missing from the records, and generates a unified alert stream combining behavioural patterns, voice gaps, compliance drift, and regulatory triggers.

---

## Architecture

```
Incident data ──┐
                 ├──▶ Pattern Detection Engine ──┐
Child records ──┘                                 │
                                                  ├──▶ Proactive Alerts Engine ──▶ Dashboard
Child voice data ──▶ Voice Gap Analysis ──────────┤
                                                  │
Compliance data ──▶ Compliance Checks ────────────┘
```

## Pattern Detection Engine

File: `src/lib/aria/aria-pattern-engine.ts`

### Pattern Types

| Type | What it detects | Severity |
|------|----------------|----------|
| `escalation` | Incident severity increasing over time for a child | High |
| `frequency_cluster` | 3+ incidents within a 7-day window for a child | Medium–High |
| `time_of_day` | 40%+ of incidents concentrated in one time period | Medium |
| `staff_correlation` | Staff member with 2x+ average incident involvement | Medium |
| `trigger_pattern` | Same incident type recurring 3+ times for a child | Medium–High |
| `missing_oversight` | Incidents without management oversight past 2-day SLA | Medium–High |
| `cross_child` | High volume affecting multiple children in one week | High–Critical |

### Configuration

```typescript
interface PatternScanConfig {
  homeId: string;
  lookbackDays?: number;       // default: 30
  minClusterSize?: number;     // default: 3
  escalationWindowDays?: number; // default: 14
}
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `scanForPatterns(incidents, config)` | Run all 7 pattern detectors against incident data |
| `patternsToAlerts(patterns, homeId)` | Convert detected patterns to `PatternAlert` objects |

### Time-of-Day Buckets

| Bucket | Hours |
|--------|-------|
| Morning | 6–9am |
| Late morning | 9am–12pm |
| Afternoon | 12–3pm |
| Late afternoon | 3–6pm |
| Evening | 6–9pm |
| Bedtime | 9pm–1am |
| Night | 1–6am |

## Child Voice Gap Analysis

File: `src/lib/aria/aria-voice-gap-analysis.ts`

### Gap Types

| Type | What it detects | Severity |
|------|----------------|----------|
| `no_key_work` | No key work or 1:1 records exist for the child | High |
| `key_work_overdue` | Last key work exceeds the configured maximum days | Medium–High |
| `missing_direct_quotes` | Fewer than 2 records with direct quotes in 30 days | Medium–High |
| `post_incident_voice_missing` | No voice record within 3 days of a medium+ incident | High–Urgent |
| `narrow_voice_coverage` | Records cover fewer than 4 of 10 wellbeing themes | Medium–High |
| `silent_child` | Records exist but none contain the child's voice in 30 days | Urgent |

### Wellbeing Themes (10)

safety, belonging, identity, family relationships, friendships, education, health & wellbeing, future aspirations, fears & concerns, things they love

### Configuration

```typescript
interface VoiceGapScanConfig {
  keyWorkMaxDaysBetween?: number;    // default: 14
  directQuoteMinPerMonth?: number;   // default: 2
  postIncidentVoiceMaxDays?: number; // default: 3
  minThemeCoverage?: number;         // default: 4
}
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `scanVoiceGaps(records, incidents, children, config)` | Run all gap detectors per child |
| `summariseVoiceGaps(gaps, totalChildren)` | Build dashboard summary with counts and worst gap |

## Proactive Alerts Engine

File: `src/lib/aria/aria-proactive-alerts.ts`

Combines all intelligence sources into a single prioritised alert stream.

### Alert Sources

| Source | Input | What it produces |
|--------|-------|------------------|
| `pattern_engine` | Incident records | Behavioural and incident patterns |
| `voice_gap` | Child records, incidents | Missing or thin child voice |
| `compliance` | Compliance checks | Overdue reviews, expired documents |
| `regulatory` | Compliance checks (reg44, reg45, etc.) | Regulatory requirement breaches |

### Key Functions

| Function | Purpose |
|----------|---------|
| `runProactiveAlertScan(input)` | Run all engines and produce unified alert stream |
| `buildAlertDashboardSummary(result)` | Build dashboard summary with counts by source |

### Alert Structure

```typescript
interface ProactiveAlert {
  id: string;
  source: AlertSource;
  category: string;
  title: string;
  description: string;
  severity: "urgent" | "high" | "medium" | "low";
  childId: string | null;
  recommendation: string;
  reflectivePrompt: string;
  evidenceSummary: string;
  detectedAt: string;
  actionRequired: boolean;
}
```

### Scan Result

```typescript
interface AlertScanResult {
  alerts: ProactiveAlert[];           // unified, severity-sorted
  patternAlerts: PatternAlert[];      // for the patterns page
  voiceGaps: VoiceGap[];             // for voice analysis
  voiceGapSummary: VoiceGapSummary;  // for dashboard widget
  complianceGaps: ComplianceCheck[]; // overdue items
  totalAlerts: number;
  urgentCount: number;
  highCount: number;
}
```

## UI — Pattern Intelligence Dashboard

File: `src/app/(platform)/intelligence/aria/pattern-intelligence/page.tsx`

Route: `/intelligence/aria/pattern-intelligence`

### Features

- **Headline stats**: 7 cards (total, urgent, high, patterns, voice gaps, compliance, children affected)
- **Voice gap summary strip**: child voice position overview with link to Voice of the Child
- **Filters**: source (pattern/voice gap/compliance/regulatory), severity, status
- **Alert list**: expandable rows with severity border, source badge, child badge, ARIA recommendation, evidence count, detection timestamp
- **Actions per alert**: Acknowledge, View in Patterns, View Child

### Navigation

Added to Aria nav group as "Pattern Intelligence" with Brain icon.

## Integration Points

### With V1 Suggestions

V2 patterns can trigger V1 suggestion generation:
- An escalation pattern for a child → generates `risk_review` and `plan_review` suggestions
- A missing oversight pattern → generates `management_oversight` suggestions
- A post-incident voice gap → generates `key_work` suggestion

### With Existing Pages

- Pattern alerts feed the existing `/patterns` page (uses `PatternAlert` type from `src/types/extended.ts`)
- Voice gaps link to `/intelligence/aria/voice-of-child` for detailed analysis
- Compliance gaps link to the relevant compliance tracking pages

## File Index

| File | Purpose |
|------|---------|
| `src/lib/aria/aria-pattern-engine.ts` | Pattern detection (7 detectors) |
| `src/lib/aria/aria-voice-gap-analysis.ts` | Child voice gap analysis (6 gap types) |
| `src/lib/aria/aria-proactive-alerts.ts` | Unified alert engine |
| `src/app/(platform)/intelligence/aria/pattern-intelligence/page.tsx` | Dashboard UI |

## Regulatory Value

This layer provides evidence for Ofsted that the home:
- Uses data to identify emerging patterns before they escalate
- Monitors the visibility of each child's voice in the records
- Tracks compliance and regulatory obligations proactively
- Supports managers with professional-quality reflective prompts
- Does not replace professional judgement — strengthens it
