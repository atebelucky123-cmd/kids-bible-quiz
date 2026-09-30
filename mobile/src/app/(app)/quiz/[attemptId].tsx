import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CorrectAnswerOverlay, WrongAnswerBanner } from '@/components/ui/answer-feedback';
import { AnswerOptionButton } from '@/components/ui/answer-option';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/ui/mascot';
import { PastQuestionView } from '@/components/ui/past-question';
import { Timer } from '@/components/ui/timer';
import { Brand, Spacing } from '@/constants/theme';
import { useCountdown, type CountdownStart } from '@/hooks/use-countdown';
import { preloadCheersSound } from '@/hooks/use-cheers-sound';
import { useCurrentQuestion } from '@/hooks/use-current-question';
import { api, ApiError, type AnswerOption } from '@/lib/api';

const OPTION_KEYS: AnswerOption[] = ['A', 'B', 'C', 'D'];

function goToResult(attemptId: string) {
  router.replace({ pathname: '/quiz/result/[attemptId]', params: { attemptId } });
}

// React Native's Alert does nothing on web, where the app is previewed
// during development.
function confirmAction(title: string, message: string, confirmText: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Keep Playing', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}

// Set once a question's timer runs out: the server has already moved the
// quiz on, and revealed this question's answer so it can be shown.
type TimeUpState = { correctOption: AnswerOption | null; isQuizComplete: boolean };

export default function QuizScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { state, reload } = useCurrentQuestion(Number(attemptId));
  const [selected, setSelected] = useState<AnswerOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wrongFeedback, setWrongFeedback] = useState(false);
  // The full-screen "Well done!", and what its Next button does — it's
  // shared by the current question and a skipped one answered on return.
  const [correctOverlayNext, setCorrectOverlayNext] = useState<(() => void) | null>(null);
  const [timeUp, setTimeUp] = useState<TimeUpState | null>(null);
  // An earlier question being looked at via Previous, by position; null
  // means the child is on their current question.
  const [viewing, setViewing] = useState<number | null>(null);
  // Starts from the server's GET value and gets replaced directly after a
  // wrong-answer submission (which resets the retry window server-side) —
  // see handleSelect below. Tagged with its question so a leftover zero
  // from the previous question is never mistaken for this one running out.
  const [timer, setTimer] = useState<CountdownStart & { questionId: number | null }>({
    seconds: 0,
    questionId: null,
  });
  // The question a timeout skip was already sent for, so the countdown
  // sitting at zero across re-renders can't send it twice.
  const timedOutQuestionRef = useRef<number | null>(null);

  const currentQuestion = state.status === 'ready' ? state.data.question : null;
  const questionId = currentQuestion?.id ?? null;
  const showCorrectOverlay = correctOverlayNext !== null;

  // Start fetching the result screen's cheers sound while the quiz is played.
  useEffect(() => {
    preloadCheersSound();
  }, []);

  useEffect(() => {
    if (state.status === 'ready' && state.data.question) {
      setTimer({ seconds: state.data.secondsRemaining, questionId: state.data.question.id });
    } else if (
      state.status === 'error' &&
      (state.code === 'ATTEMPT_COMPLETE' || state.code === 'ATTEMPT_FINISHED')
    ) {
      // Reopening the app after already finishing (or quitting) this
      // attempt — the result already exists, so go straight to it instead
      // of showing an error for a perfectly normal state.
      goToResult(attemptId);
    }
  }, [state, attemptId]);

  const remaining = useCountdown(timer);
  const expired = questionId !== null && timer.questionId === questionId && remaining <= 0;
  const busy = submitting || showCorrectOverlay || timeUp !== null;

  async function handleTimeUp(id: number) {
    if (timedOutQuestionRef.current === id) return;
    timedOutQuestionRef.current = id;
    setWrongFeedback(false);
    setSelected(null);
    try {
      const result = await api.skipQuestion(Number(attemptId), id, true);
      setTimeUp({ correctOption: result.correctOption, isQuizComplete: result.isQuizComplete });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'QUESTION_CHANGED') {
        // Already moved on (e.g. this was retried after a network blip).
        reload();
      } else {
        timedOutQuestionRef.current = null;
        setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      }
    }
  }

  // The current question's clock keeps running while looking back, so this
  // can fire then too — the time's-up screen is waiting when they return.
  useEffect(() => {
    if (expired && questionId !== null && !submitting && !showCorrectOverlay && !timeUp) {
      handleTimeUp(questionId);
    }
  }, [expired, questionId, submitting, showCorrectOverlay, timeUp]);

  function resetForNextQuestion() {
    setCorrectOverlayNext(null);
    setTimeUp(null);
    setSelected(null);
    setWrongFeedback(false);
    setSubmitError(null);
    reload();
  }

  function backToCurrent() {
    setViewing(null);
    reload();
  }

  async function handleSelect(key: AnswerOption) {
    if (busy || expired) return;
    setSelected(key);
    setSubmitting(true);
    setSubmitError(null);
    setWrongFeedback(false);
    try {
      const result = await api.submitAnswer(Number(attemptId), key);
      if (result.isQuizComplete) {
        goToResult(attemptId);
      } else if (result.correct) {
        setCorrectOverlayNext(() => resetForNextQuestion);
      } else {
        setWrongFeedback(true);
        setSelected(null);
        setTimer({ seconds: result.secondsRemaining ?? 0, questionId });
      }
    } catch (err) {
      setSelected(null);
      if (err instanceof ApiError && err.code === 'TIME_UP' && questionId !== null) {
        // The phone's countdown and the server's clock can disagree by a
        // moment — the server's decision wins.
        handleTimeUp(questionId);
      } else {
        setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    if (busy || questionId === null) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await api.skipQuestion(Number(attemptId), questionId);
      if (result.isQuizComplete) {
        goToResult(attemptId);
      } else {
        resetForNextQuestion();
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'QUESTION_CHANGED') {
        resetForNextQuestion();
      } else {
        setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function quit() {
    try {
      await api.quitQuiz(Number(attemptId));
      goToResult(attemptId);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  }

  function handleQuit() {
    confirmAction(
      'Quit this quiz?',
      "You'll see your score so far. Questions you didn't reach won't count.",
      'Quit',
      quit
    );
  }

  function handleFinish() {
    confirmAction('Finish the quiz?', "Questions you skipped won't count.", 'Finish', quit);
  }

  if (state.status === 'loading' && viewing === null) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator color={Brand.cobalt} size="large" />
        </SafeAreaView>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.errorText}>{state.message}</Text>
          <Button title="Try Again" variant="outline" onPress={reload} />
          <Text style={styles.link} onPress={() => router.replace('/')}>
            Back to Home
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  const data = state.status === 'ready' ? state.data : null;

  function renderCurrent() {
    if (!data) return null;
    const { currentQuestionIndex, totalQuestions } = data;
    const canGoBack = currentQuestionIndex > 0;

    // Every question reached, but some skipped ones are still open.
    if (data.atEnd || !currentQuestion) {
      return (
        <View style={styles.endBox}>
          <View style={styles.endMascot}>
            <Mascot pose="wave" size={120} />
          </View>
          <Text style={styles.endTitle}>Almost done!</Text>
          <Text style={styles.endText}>
            You skipped {data.openSkipped} {data.openSkipped === 1 ? 'question' : 'questions'}. Go back and try{' '}
            {data.openSkipped === 1 ? 'it' : 'them'}, or finish the quiz now.
          </Text>
          <Button
            title="Go Back to Skipped"
            variant="primary"
            onPress={() => setViewing(data.firstOpenPosition ?? totalQuestions - 1)}
          />
          <Button title="Finish Quiz" variant="outline" onPress={handleFinish} />
        </View>
      );
    }

    const optionsDisabled = expired || busy;
    return (
      <>
        <Text style={styles.counter}>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </Text>

        <Timer remaining={remaining} />

        <Text style={styles.questionText}>{currentQuestion.questionText}</Text>

        <View style={styles.options}>
          {OPTION_KEYS.map((key) => (
            <AnswerOptionButton
              key={key}
              label={currentQuestion[`option${key}` as 'optionA']}
              onPress={() => handleSelect(key)}
              disabled={optionsDisabled}
              selected={selected === key}
              revealed={timeUp?.correctOption === key}
            />
          ))}
        </View>

        {timeUp ? (
          <View style={styles.timeUpBox}>
            <Text style={styles.expiredText}>Time&apos;s up! The right answer is highlighted in green.</Text>
            <Button
              title={timeUp.isQuizComplete ? 'See My Results' : 'Next Question'}
              variant="primary"
              onPress={() => (timeUp.isQuizComplete ? goToResult(attemptId) : resetForNextQuestion())}
            />
          </View>
        ) : wrongFeedback ? (
          <WrongAnswerBanner />
        ) : expired ? (
          <Text style={styles.expiredText}>Time&apos;s up!</Text>
        ) : (
          <Text style={styles.hint}>Tap the answer you think is right.</Text>
        )}

        {submitError ? <Text style={styles.expiredText}>{submitError}</Text> : null}

        {!timeUp ? (
          <View style={styles.footer}>
            <Button title="Skip Question" variant="primary" onPress={handleSkip} disabled={busy || expired} />
            {canGoBack ? (
              <Button
                title="Previous Question"
                variant="primary"
                onPress={() => setViewing(currentQuestionIndex - 1)}
                disabled={busy}
              />
            ) : null}
            <Text style={styles.quitLink} onPress={handleQuit}>
              Quit Quiz
            </Text>
          </View>
        ) : null}
      </>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel="Back to Home"
            hitSlop={10}
            onPress={() => router.replace('/')}
            style={styles.homeButton}>
            <Ionicons name="home" size={24} color={Brand.cobalt} />
          </Pressable>

          {viewing !== null && data ? (
            <PastQuestionView
              key={viewing}
              attemptId={Number(attemptId)}
              position={viewing}
              onPrevious={() => setViewing(viewing - 1)}
              onNext={() => (viewing + 1 >= data.currentQuestionIndex ? backToCurrent() : setViewing(viewing + 1))}
              nextIsCurrent={viewing + 1 >= data.currentQuestionIndex}
              onQuizComplete={() => goToResult(attemptId)}
              onCorrect={(quizComplete) =>
                setCorrectOverlayNext(() => () => {
                  setCorrectOverlayNext(null);
                  if (quizComplete) goToResult(attemptId);
                  else backToCurrent();
                })
              }
            />
          ) : (
            renderCurrent()
          )}
        </ScrollView>
      </SafeAreaView>

      {correctOverlayNext ? <CorrectAnswerOverlay onNext={correctOverlayNext} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.surface },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  errorText: { fontSize: 15, color: Brand.ink, textAlign: 'center' },
  content: { padding: 24, gap: Spacing.four },
  link: { fontSize: 14, color: Brand.cobalt, fontWeight: '600' },
  homeButton: { alignSelf: 'flex-start' },
  counter: { fontSize: 14, fontWeight: '700', color: Brand.ink, textAlign: 'center' },
  questionText: { fontSize: 22, fontWeight: '800', color: Brand.ink, textAlign: 'center' },
  options: { gap: 12 },
  hint: { fontSize: 13, color: Brand.cobalt, textAlign: 'center' },
  expiredText: { fontSize: 14, fontWeight: '700', color: '#c0392b', textAlign: 'center' },
  timeUpBox: { gap: 12 },
  footer: { gap: 14, marginTop: Spacing.two },
  quitLink: { fontSize: 14, fontWeight: '700', color: '#c0392b', textAlign: 'center', paddingVertical: 4 },
  endBox: { alignItems: 'stretch', gap: 16, paddingTop: Spacing.four },
  endMascot: { alignItems: 'center' },
  endTitle: { fontSize: 24, fontWeight: '800', color: Brand.ink, textAlign: 'center' },
  endText: { fontSize: 16, color: Brand.ink, textAlign: 'center' },
});
