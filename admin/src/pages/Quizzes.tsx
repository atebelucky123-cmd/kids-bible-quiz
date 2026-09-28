import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Quiz, type QuizInput } from '../lib/api';
import { QuizForm } from '../components/QuizForm';

export function Quizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .listQuizzes()
      .then(setQuizzes)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'));
  }, []);

  // A new quiz has no questions yet, so go straight to its page to add them.
  async function handleCreate(input: QuizInput) {
    const quiz = await api.createQuiz(input);
    navigate(`/quizzes/${quiz.id}`);
  }

  const filtered = (quizzes ?? []).filter((q) => q.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Quizzes</h1>
          <p>Named quizzes students pick from, each with its own curated question set. Click a quiz to manage it.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
          + Add Quiz
        </button>
      </div>

      <div className="toolbar">
        <input placeholder="Search quiz title…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <p className="error-text">{error}</p>}

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
                  <tr
                    key={q.id}
                    className="clickable-row"
                    tabIndex={0}
                    onClick={() => navigate(`/quizzes/${q.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/quizzes/${q.id}`);
                    }}
                  >
                    <td style={{ color: 'var(--cobalt)', fontWeight: 600 }}>{q.title}</td>
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
                    <td className="row-chevron">›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {creating && <QuizForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />}
    </div>
  );
}
