// ══════════════════════════════════════════════════════════════════════════════
// Cara Governance — Safety & Redaction Page
// ══════════════════════════════════════════════════════════════════════════════

"use client";

const SENSITIVITY_LEVELS = [
  { level: "public", description: "No personal data — safe for any provider", colour: "bg-emerald-100 text-emerald-800" },
  { level: "internal", description: "Internal business data — most providers allowed", colour: "bg-blue-100 text-blue-800" },
  { level: "confidential", description: "Organisation-sensitive — governed providers only", colour: "bg-amber-100 text-amber-800" },
  { level: "child_sensitive", description: "Child personal data — redaction required", colour: "bg-orange-100 text-orange-800" },
  { level: "safeguarding_sensitive", description: "Safeguarding concerns — Anthropic (Claude)", colour: "bg-red-100 text-red-800" },
  { level: "legal_sensitive", description: "Legal proceedings — enterprise providers only", colour: "bg-violet-100 text-violet-800" },
  { level: "staff_sensitive", description: "Staff personal matters — enterprise providers only", colour: "bg-pink-100 text-pink-800" },
  { level: "health_sensitive", description: "Health data — enterprise providers with UK residency", colour: "bg-rose-100 text-rose-800" },
];

const PROVIDER_CLEARANCE = [
  { provider: "Anthropic", maxSensitivity: "safeguarding_sensitive", residency: "US/EU", governance: "enterprise" },
  { provider: "Mistral", maxSensitivity: "internal", residency: "EU", governance: "standard" },
  { provider: "Voyage AI", maxSensitivity: "child_sensitive", residency: "US", governance: "standard" },
  { provider: "Cohere", maxSensitivity: "internal", residency: "US/CA", governance: "standard" },
  { provider: "Perplexity", maxSensitivity: "public", residency: "US", governance: "standard" },
];

const REDACTION_CATEGORIES = [
  { category: "Child Names", placeholder: "[CHILD_1], [CHILD_2]...", detection: "NER + pattern matching" },
  { category: "Staff Names", placeholder: "[STAFF_1], [STAFF_2]...", detection: "NER + pattern matching" },
  { category: "Dates of Birth", placeholder: "[DOB_REDACTED]", detection: "Date patterns with context" },
  { category: "Addresses", placeholder: "[ADDRESS_REDACTED]", detection: "UK postcode + street patterns" },
  { category: "Phone Numbers", placeholder: "[PHONE_REDACTED]", detection: "UK mobile/landline patterns" },
  { category: "Email Addresses", placeholder: "[EMAIL_REDACTED]", detection: "Standard email regex" },
  { category: "NHS Numbers", placeholder: "[NHS_REDACTED]", detection: "3-3-4 digit pattern" },
  { category: "School Names", placeholder: "[SCHOOL_REDACTED]", detection: "Pattern + keyword matching" },
  { category: "Home Names", placeholder: "[HOME_REDACTED]", detection: "Configured home names" },
  { category: "Local Authorities", placeholder: "[LA_REDACTED]", detection: "Known LA name list" },
];

export default function CaraSafetyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Safety & Data Protection</h1>
        <p className="text-muted-foreground mt-1">
          PII detection, automatic redaction, sensitivity classification, and provider restrictions.
        </p>
      </div>

      {/* Sensitivity Levels */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold">Data Sensitivity Classification</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Input is automatically classified. Higher sensitivity restricts which providers can be used.
          </p>
        </div>
        <div className="divide-y divide-border">
          {SENSITIVITY_LEVELS.map(s => (
            <div key={s.level} className="px-4 py-2.5 flex items-center gap-3">
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${s.colour}`}>
                {s.level.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-muted-foreground">{s.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Clearance */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold">Provider Security Clearance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Each provider has a maximum sensitivity level it can handle. Data above this threshold is blocked.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-4 py-2 text-left font-medium">Provider</th>
                <th className="px-4 py-2 text-left font-medium">Max Sensitivity</th>
                <th className="px-4 py-2 text-left font-medium">Data Residency</th>
                <th className="px-4 py-2 text-left font-medium">Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PROVIDER_CLEARANCE.map(p => (
                <tr key={p.provider}>
                  <td className="px-4 py-2 font-medium">{p.provider}</td>
                  <td className="px-4 py-2">{p.maxSensitivity.replace(/_/g, " ")}</td>
                  <td className="px-4 py-2 text-muted-foreground">{p.residency}</td>
                  <td className="px-4 py-2">
                    <span className={`px-1.5 py-0.5 rounded ${
                      p.governance === "enterprise" ? "bg-violet-100 text-violet-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {p.governance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Redaction Rules */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold">Automatic PII Redaction</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personal data is automatically detected and replaced with placeholder tokens before external processing.
            Original data never leaves the system.
          </p>
        </div>
        <div className="divide-y divide-border">
          {REDACTION_CATEGORIES.map(r => (
            <div key={r.category} className="px-4 py-2.5 grid grid-cols-3 gap-4 text-xs">
              <span className="font-medium">{r.category}</span>
              <span className="font-mono text-violet-700 dark:text-violet-400">{r.placeholder}</span>
              <span className="text-muted-foreground">{r.detection}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety rules summary */}
      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
        <h4 className="text-sm font-medium text-red-800 dark:text-red-300">Safety Blocks</h4>
        <ul className="mt-2 space-y-1 text-xs text-red-700 dark:text-red-400">
          <li>• Perplexity is permanently blocked for any request containing safeguarding, child protection, or exploitation language</li>
          <li>• Requests classified above a provider&apos;s clearance are blocked immediately — no fallback to lower-security provider</li>
          <li>• Self-harm or exploitation indicators trigger immediate safety escalation</li>
          <li>• All routing blocks are logged in the audit trail with reason codes</li>
        </ul>
      </div>
    </div>
  );
}
