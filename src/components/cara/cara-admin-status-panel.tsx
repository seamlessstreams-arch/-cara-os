"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraAdminStatusPanel
//
// Admin-level Cara configuration status panel. Shows detailed system health
// for privileged roles (registered_manager, responsible_individual, admin)
// and a simple "being set up" message for everyone else.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface SystemHealthResponse {
  status: string;
  provider: {
    configured: boolean;
    name?: string;
  };
  model: {
    name?: string;
  };
  database: {
    connected: boolean;
  };
  toolRegistry: {
    count: number;
  };
  missing?: string[];
  timestamp: string;
}

// Roles that can see detailed admin info
const ADMIN_ROLES = new Set(["registered_manager", "responsible_individual", "admin", "super_admin"]);

// ── Component ─────────────────────────────────────────────────────────────

export function CaraAdminStatusPanel() {
  const { currentRole } = useAuthContext();
  const isAdmin = ADMIN_ROLES.has(currentRole);

  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cara/system-health");
      if (!res.ok) throw new Error(`Health check failed (${res.status})`);
      const data: SystemHealthResponse = await res.json();
      setHealth(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch system health");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchHealth();
    }
  }, [isAdmin, fetchHealth]);

  const handleTestCara = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/cara/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Respond with: Cara is operational.",
          conversationId: `test_${Date.now()}`,
        }),
      });
      if (!res.ok) throw new Error(`Test failed (${res.status})`);
      setTestResult("Cara responded successfully.");
    } catch (err) {
      setTestResult(
        `Test failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setTestLoading(false);
    }
  };

  // Non-admin view
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            Cara Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-800">
              Cara is being set up by your administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Admin view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            Cara Configuration Status
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1"
            onClick={fetchHealth}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
            <span className="text-xs text-red-800">{error}</span>
          </div>
        )}

        {health && (
          <div className="space-y-2">
            {/* Provider */}
            <div className="flex items-center justify-between rounded-lg border border-[var(--cs-border)] px-3 py-2">
              <span className="text-xs font-medium text-[var(--cs-text-secondary)]">Provider</span>
              <div className="flex items-center gap-1.5">
                {health.provider.configured ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className="text-xs text-[var(--cs-text-secondary)]">
                  {health.provider.configured
                    ? health.provider.name ?? "Connected"
                    : "Not Connected"}
                </span>
              </div>
            </div>

            {/* Model */}
            <div className="flex items-center justify-between rounded-lg border border-[var(--cs-border)] px-3 py-2">
              <span className="text-xs font-medium text-[var(--cs-text-secondary)]">Model</span>
              <span className="text-xs text-[var(--cs-text-secondary)]">
                {health.model.name ?? "Not set"}
              </span>
            </div>

            {/* Database */}
            <div className="flex items-center justify-between rounded-lg border border-[var(--cs-border)] px-3 py-2">
              <span className="text-xs font-medium text-[var(--cs-text-secondary)]">Database</span>
              <div className="flex items-center gap-1.5">
                {health.database.connected ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className="text-xs text-[var(--cs-text-secondary)]">
                  {health.database.connected ? "Connected" : "Not Connected"}
                </span>
              </div>
            </div>

            {/* Tool Registry */}
            <div className="flex items-center justify-between rounded-lg border border-[var(--cs-border)] px-3 py-2">
              <span className="text-xs font-medium text-[var(--cs-text-secondary)]">Tool Registry</span>
              <span className="text-xs text-[var(--cs-text-secondary)]">
                {health.toolRegistry.count} tools registered
              </span>
            </div>

            {/* Missing items */}
            {health.missing && health.missing.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider mb-1">
                  Missing Configuration
                </p>
                <ul className="space-y-0.5">
                  {health.missing.map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-xs text-amber-700">
                      <span className="mt-0.5 block h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Test button */}
            <div className="pt-2">
              <Button
                size="sm"
                className="w-full bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white text-xs gap-1.5"
                onClick={handleTestCara}
                disabled={testLoading}
              >
                {testLoading ? (
                  <><RefreshCw className="h-3 w-3 animate-spin" />Testing...</>
                ) : (
                  <><Sparkles className="h-3 w-3" />Test Cara</>
                )}
              </Button>

              {testResult && (
                <div className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
                  testResult.startsWith("Test failed")
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-green-200 bg-green-50 text-green-800"
                }`}>
                  {testResult}
                </div>
              )}
            </div>

            {/* Last checked timestamp */}
            {lastChecked && (
              <div className="text-[9px] text-[var(--cs-text-muted)] text-right pt-1">
                Last checked: {lastChecked}
              </div>
            )}
          </div>
        )}

        {!health && !error && loading && (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-4 w-4 animate-spin text-[var(--cs-text-muted)]" />
            <span className="ml-2 text-xs text-[var(--cs-text-muted)]">Loading status...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
