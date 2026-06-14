// ══════════════════════════════════════════════════════════════════════════════
// Cara Governance — Provider Management Page
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface ProviderInfo {
  name: string;
  displayName: string;
  available: boolean;
  capabilities: Record<string, boolean | number | string | string[]>;
  models: string[];
  defaultModel: string;
}

export default function CaraProvidersPage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latency?: number; error?: string }>>({});

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const res = await fetch("/api/cara/providers");
      const data = await res.json();
      setProviders(data.providers ?? []);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  async function testProvider(name: string) {
    setTestingProvider(name);
    try {
      const res = await fetch("/api/cara/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: name }),
      });
      const data = await res.json();
      setTestResults(prev => ({
        ...prev,
        [name]: { success: data.connected ?? false, latency: data.latencyMs, error: data.error },
      }));
    } catch {
      setTestResults(prev => ({ ...prev, [name]: { success: false, error: "Network error" } }));
    } finally {
      setTestingProvider(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Providers</h1>
        <p className="text-muted-foreground mt-1">
          Configured providers, their capabilities, and current availability status.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading providers...</div>
      ) : (
        <div className="space-y-4">
          {providers.map(provider => (
            <div key={provider.name} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${provider.available ? "bg-emerald-500" : "bg-gray-300"}`} />
                  <div>
                    <h3 className="text-sm font-semibold">{provider.displayName}</h3>
                    <p className="text-xs text-muted-foreground">{provider.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {testResults[provider.name] && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      testResults[provider.name].success
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {testResults[provider.name].success
                        ? `Connected (${testResults[provider.name].latency}ms)`
                        : testResults[provider.name].error ?? "Failed"
                      }
                    </span>
                  )}
                  <button
                    onClick={() => testProvider(provider.name)}
                    disabled={testingProvider === provider.name || !provider.available}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted disabled:opacity-50"
                  >
                    {testingProvider === provider.name ? "Testing..." : "Test Connection"}
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                <InfoChip label="Default Model" value={provider.defaultModel} />
                <InfoChip label="Models" value={`${provider.models.length} available`} />
                <InfoChip label="Governance" value={String(provider.capabilities.governanceLevel ?? "standard")} />
                <InfoChip label="Data Residency" value={Array.isArray(provider.capabilities.dataResidency) ? provider.capabilities.dataResidency.join(", ") : "—"} />
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(provider.capabilities)
                  .filter(([key, val]) => typeof val === "boolean" && val)
                  .map(([key]) => (
                    <span key={key} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
