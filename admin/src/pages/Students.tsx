import { useEffect, useState } from 'react';
import { api, type Student } from '../lib/api';

export function Students() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listStudents()
      .then(setStudents)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p>Read-only — no contact details or password data are ever shown here.</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {students && (
        <div className="card" style={{ padding: 0 }}>
          {students.length === 0 ? (
            <div className="empty-state">No students have registered yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Attempts</th>
                  <th>Last Score</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.firstName} {s.middleName ? `${s.middleName} ` : ''}
                      {s.lastName}
                    </td>
                    <td>{s.age}</td>
                    <td>{s.attemptCount}</td>
                    <td>{s.lastResult ? `${Math.round(s.lastResult.percentage)}%` : '—'}</td>
                    <td>{new Date(s.joinedAt).toLocaleDateString()}</td>
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
