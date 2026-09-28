import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, type Quiz, type QuizInput } from '../lib/api';
import { QuizForm } from '../components/QuizForm';

export function Quizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Quiz | 'new' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function reload() {
    api
      .listQuizzes()
      .then(setQuizzes)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }

  useEffect(reload, []);

  async function handleSave(input: QuizInput) {
    if (editing && editing !== 'new') {
      await api.updateQuiz(editing.id, input);
    } else {
      await api.createQuiz(input);
    }
    setEditing(null);
    reload();
  }

  async function handleToggleActive(q: Quiz) {
    setActionError(null);
    try {
      await api.updateQuiz(q.id, { isActive: !q.isActive });
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update quiz');
    }
  }

  async function handleDelete(q: Quiz) {
    if (!confirm(`Delete "${q.title}"? This cannot be undone.`)) return;
    setActionError(null);
    try {
      await api.deleteQuiz(q.id);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete quiz');
    }
  }

  const filtered = (quizzes ?? []).filter((q) => q.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Quizzes</h1>
          <p>Named quizzes students pick from, each with its own curated question set.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
          + Add Quiz
        </button>
      </div>

      <div className="toolbar">
        <input placeholder="Search quiz title…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <p className="error-text">{error}</p>}
      {actionError && <p className="error-text">{actionError}</p>}

      {quizzes && (
        <div className="card" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">No quizzes match this search.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Age Range</th>
                  <th>Questions</th>
                  <th>Time Limit</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <button
                        type="button"
                        onClick={() => navigate(`/quizzes/${q.id}`)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          font: 'inherit',
                          color: 'var(--cobalt)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {q.title}
                      </button>
                    </td>
                    <td>
                      {q.ageMin}–{q.ageMax}
                    </td>
                    <td>{q.questionCount}</td>
                    <td>{q.timeLimitSeconds}s</td>
                    <td>
                      <span className={`badge ${q.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {q.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="row-btn row-btn-edit" onClick={() => setEditing(q)}>
                          Edit
                        </button>
                        <button type="button" className="row-btn row-btn-toggle" onClick={() => handleToggleActive(q)}>
                          {q.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button type="button" className="row-btn row-btn-danger" onClick={() => handleDelete(q)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editing && (
        <QuizForm initial={editing === 'new' ? undefined : editing} onSubmit={handleSave} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}
