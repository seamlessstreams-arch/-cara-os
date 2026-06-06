"use client";

import React from "react";

/**
 * Isolates a single dashboard card. If a card throws during render (e.g. an
 * intelligence payload is missing an expected array), only that card shows a
 * small, calm fallback — the rest of the dashboard keeps working instead of the
 * whole page falling to the platform error boundary.
 *
 * The fallback reads as a graceful "not available yet" empty state (not an alarming
 * error), and offers a Retry that fully RE-MOUNTS the child — so a transient or
 * now-resolved data issue recovers without a page reload.
 */
interface Props { children: React.ReactNode; label?: string; }
interface State { hasError: boolean; retryKey: number; }

export class CardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryKey: 0 };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Card-level isolation: log for diagnostics, but don't propagate.
    if (typeof console !== "undefined") {
      console.warn("[dashboard card] failed to render:", error);
    }
  }

  private retry = () => this.setState((s) => ({ hasError: false, retryKey: s.retryKey + 1 }));

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-dashed border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 min-h-[88px] flex flex-col items-center justify-center gap-1.5 text-center">
          <p className="text-xs font-medium text-[var(--cs-text-muted)]">
            {this.props.label ? `${this.props.label} — not available yet` : "Not available yet"}
          </p>
          <button type="button" onClick={this.retry} className="text-[11px] text-[var(--cs-teal)] hover:underline">
            Retry
          </button>
        </div>
      );
    }
    // Bump the key on retry so the child fully re-mounts (re-runs its hooks + render).
    return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
  }
}
