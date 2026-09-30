import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError, type Question, type QuestionInput, type Quiz, type QuizInput } from '../lib/api';
import { QuestionForm } from '../components/QuestionForm';
import { QuizForm } from '../components/QuizForm';

export function QuizDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState(false);
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

  async function handleSaveQuiz(input: QuizInput) {
    await api.updateQuiz(quizId, input);
    setEditingQuiz(false);
    reload();
  }

  async function handleToggleQuizActive() {
    if (!quiz) return;
    setActionError(null);
    try {
      await api.updateQuiz(quizId, { isActive: !quiz.isActive });
      reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to update quiz');
    }
  }

  async function handleDeleteQuiz() {
    if (!quiz) return;
    if (!confirm(`Delete "${quiz.title}"? This cannot be undone.`)) return;
    setActionError(null);
    try {
      await api.deleteQuiz(quizId);
      navigate('/quizzes');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete quiz');
    }
  }

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

  const activeQuestions = questions.filter((q) => q.isActive).length;

  return (
    <div>
      <button type="button" className="btn btn-ghost" style={{ paddingLeft: 0 }} onClick={() => navigate('/quizzes')}>
        All Quizzes
      </button>

      <div className="page-header" style={{ marginTop: 4 }}>
        <div>
          <h1>{quiz.title}</h1>
          <p>
            <span className={`badge ${quiz.isActive ? 'badge-active' : 'badge-inactive'}`}>
              {quiz.isActive ? 'Active — shown to students' : 'Inactive — hidden from students'}
            </span>
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setEditingQuiz(true)}>
            Edit Details
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleToggleQuizActive}>
            {quiz.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDeleteQuiz}>
            Delete Quiz
          </button>
        </div>
      </div>

      <div className="stats-strip">
        <div className="stats-strip-item">
          <div className="stat-value">
            {quiz.ageMin}–{quiz.ageMax}
          </div>
          <div className="stat-label">Age range</div>
        </div>
        <div className="stats-strip-item">
          <div className="stat-value">{quiz.timeLimitSeconds}s</div>
          <div className="stat-label">Time per question</div>
        </div>
        <div className="stats-strip-item">
          <div className="stat-value">{questions.length}</div>
          <div className="stat-label">Questions</div>
        </div>
        <div className="stats-strip-item">
          <div className="stat-value">{activeQuestions}</div>
          <div className="stat-label">Active questions</div>
        </div>
      </div>

      {actionError && <p className="error-text">{actionError}</p>}

      <div className="page-header" style={{ marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 17, margin: 0 }}>Questions</h2>
          <p>Click a question to edit it.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
          + Add Question
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {questions.length === 0 ? (
          <div className="empty-state">No questions in this quiz yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Question</th>
                <th>Correct Answer</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr
                  key={q.id}
                  className="clickable-row"
                  tabIndex={0}
                  onClick={() => setEditing(q)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target === e.currentTarget) setEditing(q);
                  }}
                >
                  <td style={{ color: 'var(--text-secondary)' }}>{i + 1}</td>
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
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
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

      {editingQuiz && <QuizForm initial={quiz} onSubmit={handleSaveQuiz} onCancel={() => setEditingQuiz(false)} />}
      {editing && (
        <QuestionForm initial={editing === 'new' ? undefined : editing} onSubmit={handleSave} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}
