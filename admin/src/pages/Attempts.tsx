import { useEffect, useState } from 'react';
import { api, type Attempt } from '../lib/api';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Attempts() {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'ALL' | 'IN_PROGRESS' | 'FINISHED'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      api
        .listAttempts({ status: status === 'ALL' ? undefined : status, search: search || undefined })
        .then(setAttempts)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
    }, 200);
    return () => clearTimeout(timeout);
  }, [status, search]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Attempts</h1>
          <p>Every quiz attempt, in progress or finished.</p>
        </div>
      </div>

      <div className="toolbar">
        <input
          placeholder="Search by student name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="ALL">All statuses</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="FINISHED">Finished</option>
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}

      {attempts && (
        <div className="card" style={{ padding: 0 }}>
          {attempts.length === 0 ? (
            <div className="empty-state">No attempts match this filter.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Age</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Score</th>
                  <th>Duration</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.student.firstName} {a.student.lastName}
                    </td>
                    <td>{a.student.age}</td>
                    <td>
                      <span className={`badge ${a.status === 'FINISHED' ? 'badge-finished' : 'badge-in-progress'}`}>
                        {a.status === 'FINISHED' ? 'Finished' : 'In progress'}
                      </span>
                    </td>
                    <td>
                      {a.currentQuestionIndex}/{a.totalQuestions}
                    </td>
                    <td>{a.percentage !== null ? `${Math.round(a.percentage)}%` : '—'}</td>
                    <td>{formatDuration(a.durationSeconds)}</td>
                    <td>{new Date(a.startedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
