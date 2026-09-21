import { useEffect, useState } from 'react';
import { api, type Overview as OverviewData } from '../lib/api';

export function Overview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getOverview()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <div className="page-loading">Loading…</div>;

  const maxBandCount = Math.max(1, ...data.ageBandBreakdown.map((b) => b.attempts));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>A snapshot of the question bank and student activity.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{data.counts.students}</div>
          <div className="stat-label">Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.counts.questions}</div>
          <div className="stat-label">Questions ({data.counts.activeQuestions} active)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.counts.attempts}</div>
          <div className="stat-label">Quiz Attempts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.counts.completedAttempts}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.completionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Attempts by age band</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: -6 }}>
          A display grouping for reporting only — questions themselves keep a freeform age range.
        </p>
        {data.ageBandBreakdown.map((band) => (
          <div className="age-band-row" key={band.band}>
            <span className="age-band-label">{band.band}</span>
            <div className="age-band-bar-track">
              <div
                className="age-band-bar-fill"
                style={{ width: `${(band.attempts / maxBandCount) * 100}%` }}
              />
            </div>
            <span className="age-band-count">{band.attempts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
