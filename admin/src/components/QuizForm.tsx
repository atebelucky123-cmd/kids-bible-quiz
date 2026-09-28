import { useState, type FormEvent } from 'react';
import { ApiError, type Quiz, type QuizInput } from '../lib/api';

type Props = {
  initial?: Quiz;
  onSubmit: (input: QuizInput) => Promise<void>;
  onCancel: () => void;
};

export function QuizForm({ initial, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [ageMin, setAgeMin] = useState(initial?.ageMin ?? 5);
  const [ageMax, setAgeMax] = useState(initial?.ageMax ?? 12);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(initial?.timeLimitSeconds ?? 30);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        title,
        ageMin: Number(ageMin),
        ageMax: Number(ageMax),
        timeLimitSeconds: Number(timeLimitSeconds),
        isActive,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save quiz');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{initial ? 'Edit Quiz' : 'Add Quiz'}</h2>

        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="option-row">
          <div className="field">
            <label htmlFor="ageMin">Minimum Age</label>
            <input
              id="ageMin"
              type="number"
              min={5}
              max={12}
              value={ageMin}
              onChange={(e) => setAgeMin(Number(e.target.value))}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="ageMax">Maximum Age</label>
            <input
              id="ageMax"
              type="number"
              min={5}
              max={12}
              value={ageMax}
              onChange={(e) => setAgeMax(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="option-row">
          <div className="field">
            <label htmlFor="timeLimitSeconds">Time Per Question (seconds)</label>
            <input
              id="timeLimitSeconds"
              type="number"
              min={5}
              max={600}
              value={timeLimitSeconds}
              onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
              required
            />
          </div>
          <div className="field">
            <label>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />{' '}
              Active (shown to students)
            </label>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
}
