import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WrongAnswerBanner } from '@/components/ui/answer-feedback';
import { AnswerOptionButton } from '@/components/ui/answer-option';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/ui/timer';
import { Brand } from '@/constants/theme';
import { useCountdown, type CountdownStart } from '@/hooks/use-countdown';
import { api, ApiError, type AnswerOption, type PastQuestion } from '@/lib/api';

const OPTION_KEYS: AnswerOption[] = ['A', 'B', 'C', 'D'];
const NO_CLOCK: CountdownStart = { seconds: 0 };

type Props = {
  attemptId: number;
  position: number;
  onPrevious: () => void;
  // Forward one question, or back to the child's current question
  // (nextIsCurrent — decided by the quiz screen, which owns that).
  onNext: () => void;
  nextIsCurrent: boolean;
  onQuizComplete: () => void;
  // A right answer: the quiz screen shows the full-screen "Well done!" (it
  // has to cover the whole screen, which this view can't from inside the
  // scroll area), then moves on.
  onCorrect: (quizComplete: boolean) => void;
};

// An earlier question, reached with Previous. Answered and timed-out
// questions are read-only with the answer shown; a skipped one can still
// be answered, on its own timer.
export function PastQuestionView({
  attemptId,
  position,
  onPrevious,
  onNext,
  nextIsCurrent,
  onQuizComplete,
  onCorrect,
}: Props) {
  const [data, setData] = useState<PastQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AnswerOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [wrongFeedback, setWrongFeedback] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [timer, setTimer] = useState<CountdownStart>({ seconds: 0 });
  const [currentClock, setCurrentClock] = useState<CountdownStart | null>(null);
  const timedOutRef = useRef(false);

  const load = useCallback(async () => {
    setData(null);
    setError(null);
    setSelected(null);
    setWrongFeedback(false);
    timedOutRef.current = false;
    try {
      const result = await api.getPastQuestion(attemptId, position);
      setData(result);
      setTimer({ seconds: result.secondsRemaining ?? 0 });
      setCurrentClock(result.currentSecondsRemaining === null ? null : { seconds: result.currentSecondsRemaining });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  }, [attemptId, position]);

  useEffect(() => {
    load();
  }, [load]);

  const remaining = useCountdown(timer);
  const currentRemaining = useCountdown(currentClock ?? NO_CLOCK);
  const isOpen = data?.state === 'OPEN';
  const expired = isOpen && remaining <= 0;

  // This question's own timer ran out: close it and show the answer.
  useEffect(() => {
    if (!expired || !data || submitting || timedOutRef.current) return;
    timedOutRef.current = true;
    api
      .timeoutPastQuestion(attemptId, position)
      .then((result) => {
        setData({ ...data, state: 'CLOSED', correctOption: result.correctOption });
        setQuizComplete(result.isQuizComplete);
      })
      .catch(() => load());
  }, [expired, data, submitting, attemptId, position, load]);

  async function handleSelect(key: AnswerOption) {
    if (!isOpen || submitting || expired) return;
    setSelected(key);
    setSubmitting(true);
    setWrongFeedback(false);
    setError(null);
    try {
      const result = await api.answerPastQuestion(attemptId, position, key);
      if (result.correct) {
        onCorrect(result.isQuizComplete);
      } else {
        setWrongFeedback(true);
        setSelected(null);
        setTimer({ seconds: result.secondsRemaining ?? 0 });
      }
    } catch (err) {
      setSelected(null);
      if (err instanceof ApiError && (err.code === 'TIME_UP' || err.code === 'QUESTION_CLOSED')) {
        load();
      } else {
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        {error ? (
          <>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Back to My Question" variant="outline" onPress={onNext} />
          </>
        ) : (
          <ActivityIndicator color={Brand.cobalt} size="large" />
        )}
      </View>
    );
  }

  const { question } = data;
  const status =
    data.state === 'DONE'
      ? 'You got this one right.'
      : data.state === 'CLOSED'
        ? 'Time ran out on this one. The right answer is in green.'
        : 'You skipped this one. You can still answer it!';

  return (
    <View style={styles.container}>
      <Text style={styles.lookingBack}>LOOKING BACK</Text>
      <Text style={styles.counter}>
        Question {position + 1} of {data.totalQuestions}
      </Text>

      {isOpen ? <Timer remaining={remaining} /> : null}

      <Text style={styles.questionText}>{question.questionText}</Text>

      <View style={styles.options}>
        {OPTION_KEYS.map((key) => (
          <AnswerOptionButton
            key={key}
            label={question[`option${key}` as 'optionA']}
            onPress={() => handleSelect(key)}
            disabled={!isOpen || submitting || expired}
            selected={selected === key}
            revealed={data.correctOption === key}
          />
        ))}
      </View>

      {wrongFeedback ? <WrongAnswerBanner /> : <Text style={styles.status}>{status}</Text>}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {currentClock ? (
        <Text style={styles.clockNote}>
          {currentRemaining > 0
            ? `Your current question's timer is still running (${currentRemaining}s left).`
            : "Your current question's time has run out."}
        </Text>
      ) : null}

      {quizComplete ? (
        <Button title="See My Results" variant="primary" onPress={onQuizComplete} />
      ) : (
        <View style={styles.nav}>
          {position > 0 ? (
            <Button title="Previous" variant="outline" onPress={onPrevious} style={styles.navButton} />
          ) : null}
          <Button
            title={nextIsCurrent ? 'Back to My Question' : 'Next'}
            variant="secondary"
            onPress={onNext}
            style={styles.navButton}
          />
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 48 },
  lookingBack: { fontSize: 12, fontWeight: '800', color: Brand.cobalt, textAlign: 'center', letterSpacing: 1 },
  counter: { fontSize: 14, fontWeight: '700', color: Brand.ink, textAlign: 'center' },
  questionText: { fontSize: 22, fontWeight: '800', color: Brand.ink, textAlign: 'center' },
  options: { gap: 12 },
  status: { fontSize: 14, fontWeight: '700', color: Brand.cobalt, textAlign: 'center' },
  clockNote: { fontSize: 13, color: '#a3410a', textAlign: 'center' },
  errorText: { fontSize: 14, fontWeight: '700', color: '#c0392b', textAlign: 'center' },
  nav: { flexDirection: 'row', gap: 12 },
  navButton: { flex: 1 },
});
