import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError, type Question, type QuestionInput, type Quiz } from '../lib/api';
import { QuestionForm } from '../components/QuestionForm';

export function QuizDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Question | 'new' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function reload() {
    api
      .getQuizQuestions(quizId)
      .then((data) => {
        setQuiz(data.quiz);
        setQuestions(data.questions);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'));
  }

  useEffect(reload, [quizId]);

  async function handleSave(input: QuestionInput) {
    if (editing && editing !== 'new') {
      await api.updateQuestion(editing.id, input);
    } else {
      await api.createQuestion(quizId, input);
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

  if (error) return <p className="error-text">{error}</p>;
  if (!quiz || !questions) return <div className="page-loading">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" className="btn btn-ghost" style={{ paddingLeft: 0 }} onClick={() => navigate('/quizzes')}>
            ← All Quizzes
          </button>
          <h1 style={{ marginTop: 4 }}>{quiz.title}</h1>
          <p>
            Ages {quiz.ageMin}–{quiz.ageMax} · {quiz.timeLimitSeconds}s per question ·{' '}
            <span className={`badge ${quiz.isActive ? 'badge-active' : 'badge-inactive'}`}>
              {quiz.isActive ? 'Active' : 'Inactive'}
            </span>
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
          + Add Question
        </button>
      </div>

      {actionError && <p className="error-text">{actionError}</p>}

      <div className="card" style={{ padding: 0 }}>
        {questions.length === 0 ? (
          <div className="empty-state">No questions in this quiz yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Correct Answer</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id}>
                  <td style={{ maxWidth: 360 }}>{q.questionText}</td>
                  <td>
                    {q.correctOption}: {q[`option${q.correctOption}` as 'optionA']}
                  </td>
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

      {editing && (
        <QuestionForm initial={editing === 'new' ? undefined : editing} onSubmit={handleSave} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}
