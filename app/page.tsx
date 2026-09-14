"use client";

import { useEffect, useState } from "react";

type CheckResult = {
  healthy: boolean;
  httpStatus: number | null;
  responseTimeMs: number;
  checkedAt: string;
  expectedBody: string;
  bodyPreview?: string;
  error?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date(value));
}

export default function Home() {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function runCheck() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/check", {
        cache: "no-store"
      });
      const data = (await response.json()) as CheckResult;
      setResult(data);
    } catch {
      setError("Der Live-Check konnte nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialCheck() {
      try {
        const response = await fetch("/api/check", {
          cache: "no-store"
        });
        const data = (await response.json()) as CheckResult;

        if (isMounted) {
          setResult(data);
        }
      } catch {
        if (isMounted) {
          setError("Der Live-Check konnte nicht geladen werden.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialCheck();

    return () => {
      isMounted = false;
    };
  }, []);

  const statusLabel =
    isLoading && !result ? "PRUEFE" : result?.healthy ? "ONLINE" : "DOWN";
  const statusClass = result?.healthy ? "online" : "down";

  return (
    <main className="shell">
      <section className="status-panel" aria-labelledby="page-title">
        <div className="header-row">
          <div>
            <p className="eyebrow">Live Status</p>
            <h1 id="page-title">AppMethode Monitor</h1>
          </div>
          <div className={`status-badge ${statusClass}`} aria-live="polite">
            <span className="status-dot" aria-hidden="true" />
            {statusLabel}
          </div>
        </div>

        <dl className="details-grid">
          <div>
            <dt>Target</dt>
            <dd>https://appmethode.com/</dd>
          </div>
          <div>
            <dt>Expected response</dt>
            <dd>-</dd>
          </div>
          <div>
            <dt>HTTP Status</dt>
            <dd>{result?.httpStatus ?? "-"}</dd>
          </div>
          <div>
            <dt>Response Time</dt>
            <dd>{result ? `${result.responseTimeMs} ms` : "-"}</dd>
          </div>
          <div>
            <dt>Last checked</dt>
            <dd>{result ? formatDate(result.checkedAt) : "-"}</dd>
          </div>
          <div>
            <dt>Body preview</dt>
            <dd>{result?.bodyPreview ?? result?.error ?? "-"}</dd>
          </div>
        </dl>

        {error ? <p className="error-text">{error}</p> : null}

        <button
          className="check-button"
          type="button"
          onClick={() => void runCheck()}
          disabled={isLoading}
        >
          {isLoading ? "Pruefe..." : "Jetzt pruefen"}
        </button>
      </section>
    </main>
  );
}
