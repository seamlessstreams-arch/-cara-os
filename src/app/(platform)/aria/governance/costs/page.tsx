// ══════════════════════════════════════════════════════════════════════════════
// Aria Governance — Cost Control Page
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";
import { AriaCostEstimate } from "@/components/aria/AriaCostEstimate";

interface CostSummary {
  period: string;
  organisationId: string;
  summary: {
    totalCost: number;
    totalRequests: number;
    byProvider: Record<string, { cost: number; requests: number }>;
    byTaskType: Record<string, { cost: number; requests: number }>;
  };
  limits: {
    perRequest: number;
    dailyPerUser: number;
    dailyPerHome: number;
    monthlyPerOrg: number;
  };
}

export default function AriaCostsPage() {
  const [data, setData] = useState<CostSummary | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCosts();
  }, [period]);

  async function loadCosts() {
    setLoading(true);
    try {
      const res = await fetch(`/api/aria/costs?organisationId=org-default&period=${period}`);
      const json = await res.json();
      setData(json);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cost Control</h1>
          <p className="text-muted-foreground mt-1">
            Monitor AI spending with per-request, daily, and monthly limits.
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(["day", "week", "month"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium ${
                period === p ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"
              }`}
            >
              {p === "day" ? "Today" : p === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading cost data...</div>
      ) : data?.limits && data?.summary ? (
        <>
          {/* Budget overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AriaCostEstimate
              estimatedCost={0}
              actualCost={data.summary.totalCost}
              provider="openai"
              model="aggregate"
              dailyUsed={data.summary.totalCost}
              dailyLimit={data.limits.dailyPerHome}
              monthlyUsed={data.summary.totalCost}
              monthlyLimit={data.limits.monthlyPerOrg}
            />

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Configured Limits</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Per request</span>
                  <span className="font-medium">£{(data.limits.perRequest ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily per user</span>
                  <span className="font-medium">£{(data.limits.dailyPerUser ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily per home</span>
                  <span className="font-medium">£{(data.limits.dailyPerHome ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly per org</span>
                  <span className="font-medium">£{(data.limits.monthlyPerOrg ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Period Summary</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total requests</span>
                  <span className="font-medium">{data.summary.totalRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total cost</span>
                  <span className="font-medium">£{(data.summary.totalCost ?? 0).toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg per request</span>
                  <span className="font-medium">
                    £{data.summary.totalRequests > 0
                      ? (data.summary.totalCost / data.summary.totalRequests).toFixed(4)
                      : "0.0000"
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Provider breakdown */}
          {Object.keys(data.summary.byProvider).length > 0 && (
            <div className="rounded-lg border border-border bg-card">
              <div className="p-4 border-b border-border">
                <h4 className="text-sm font-semibold">Cost by Provider</h4>
              </div>
              <div className="divide-y divide-border">
                {Object.entries(data.summary.byProvider).map(([name, info]) => (
                  <div key={name} className="px-4 py-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{name.replace(/_/g, " ")}</span>
                      <span className="text-xs text-muted-foreground ml-2">({info.requests} requests)</span>
                    </div>
                    <span className="text-sm font-medium">£{(info.cost ?? 0).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">No cost data available</div>
      )}
    </div>
  );
}
