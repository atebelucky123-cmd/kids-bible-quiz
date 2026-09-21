import { useEffect, useState } from 'react';
import { api, ApiError, type Question, type QuestionInput } from '../lib/api';
import { QuestionForm } from '../components/QuestionForm';

export function Questions() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Question | 'new' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function reload() {
    api
      .listQuestions()
      .then(setQuestions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }

  useEffect(reload, []);

  async function handleSave(input: QuestionInput) {
    if (editing && editing !== 'new') {
      await api.updateQuestion(editing.id, input);
    } else {
      await api.createQuestion(input);
    }
    setEditing(null);
    reload();
  }

  async function handleToggleActive(q: Question) {
    setActionError(null);
    try {
      await api.updateQuestion(q.id, { isActive: !q.isActive });
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update question');
    }
  }

  async function handleDelete(q: Question) {
    if (!confirm(`Delete "${q.questionText}"? This cannot be undone.`)) return;
    setActionError(null);
    try {
      await api.deleteQuestion(q.id);
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete question');
    }
  }

  const filtered = (questions ?? []).filter((q) =>
    q.questionText.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Questions</h1>
          <p>The question bank students draw from, filtered by age range at quiz time.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
          + Add Question
        </button>
      </div>

      <div className="toolbar">
        <input
          placeholder="Search question text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="error-text">{error}</p>}
      {actionError && <p className="error-text">{actionError}</p>}

      {questions && (
        <div className="card" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">No questions match this search.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Age Range</th>
                  <th>Correct Answer</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id}>
                    <td style={{ maxWidth: 360 }}>{q.questionText}</td>
                    <td>
                      {q.ageMin}–{q.ageMax}
                    </td>
                    <td>
                      {q.correctOption}: {q[`option${q.correctOption}` as 'optionA']}
                    </td>
                    <td>
                      <span className={`badge ${q.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {q.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-ghost" onClick={() => setEditing(q)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => handleToggleActive(q)}>
                          {q.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => handleDelete(q)}>
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
        <QuestionForm
          initial={editing === 'new' ? undefined : editing}
          onSubmit={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
