import { useState, type FormEvent } from 'react';
import { ApiError, type AnswerOption, type Question, type QuestionInput } from '../lib/api';

type Props = {
  initial?: Question;
  onSubmit: (input: QuestionInput) => Promise<void>;
  onCancel: () => void;
};

const OPTION_KEYS: { key: 'optionA' | 'optionB' | 'optionC' | 'optionD'; letter: AnswerOption }[] = [
  { key: 'optionA', letter: 'A' },
  { key: 'optionB', letter: 'B' },
  { key: 'optionC', letter: 'C' },
  { key: 'optionD', letter: 'D' },
];

export function QuestionForm({ initial, onSubmit, onCancel }: Props) {
  const [questionText, setQuestionText] = useState(initial?.questionText ?? '');
  const [options, setOptions] = useState({
    optionA: initial?.optionA ?? '',
    optionB: initial?.optionB ?? '',
    optionC: initial?.optionC ?? '',
    optionD: initial?.optionD ?? '',
  });
  const [correctOption, setCorrectOption] = useState<AnswerOption>(initial?.correctOption ?? 'A');
  const [ageMin, setAgeMin] = useState(initial?.ageMin ?? 5);
  const [ageMax, setAgeMax] = useState(initial?.ageMax ?? 12);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        questionText,
        ...options,
        correctOption,
        ageMin: Number(ageMin),
        ageMax: Number(ageMax),
        isActive,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save question');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{initial ? 'Edit Question' : 'Add Question'}</h2>

        <div className="field">
          <label htmlFor="questionText">Question</label>
          <textarea
            id="questionText"
            rows={2}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            required
          />
        </div>

        <div className="option-row">
          {OPTION_KEYS.map(({ key, letter }) => (
            <div className="field" key={key}>
              <label htmlFor={key}>Option {letter}</label>
              <input
                id={key}
                value={options[key]}
                onChange={(e) => setOptions((prev) => ({ ...prev, [key]: e.target.value }))}
                required
              />
            </div>
          ))}
        </div>

        <div className="option-row">
          <div className="field">
            <label htmlFor="correctOption">Correct Answer</label>
            <select
              id="correctOption"
              value={correctOption}
              onChange={(e) => setCorrectOption(e.target.value as AnswerOption)}
            >
              {OPTION_KEYS.map(({ letter }) => (
                <option key={letter} value={letter}>
                  Option {letter}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />{' '}
              Active (shown in new quizzes)
            </label>
          </div>
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

        {error && <p className="error-text">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Question'}
          </button>
        </div>
      </form>
    </div>
  );
}
