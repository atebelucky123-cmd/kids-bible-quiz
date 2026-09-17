import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CorrectAnswerOverlay, WrongAnswerBanner } from '@/components/ui/answer-feedback';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/ui/mascot';
import { Timer } from '@/components/ui/timer';
import { Brand, Spacing } from '@/constants/theme';
import { useCountdown } from '@/hooks/use-countdown';
import { useCurrentQuestion } from '@/hooks/use-current-question';
import { api, ApiError, type AnswerOption } from '@/lib/api';

const OPTION_KEYS: AnswerOption[] = ['A', 'B', 'C', 'D'];

// Scoring, the completed-quiz result screen, and the 70%-cheers audio are
// Phase 9 scope. Once every question here has been answered, this screen
// just shows a plain "all done" stub rather than a real result.
export default function QuizScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { state, reload } = useCurrentQuestion(Number(attemptId));
  const [selected, setSelected] = useState<AnswerOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wrongFeedback, setWrongFeedback] = useState(false);
  const [showCorrectOverlay, setShowCorrectOverlay] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  // Only known when we just completed it in this session (the answer
  // response carries the final score); reopening an already-finished
  // attempt via GET doesn't have this, so the stub below falls back to a
  // generic message in that case.
  const [finalScore, setFinalScore] = useState<{ score: number; totalQuestions: number } | null>(null);
  // Starts from the server's GET value and gets overridden directly after
  // a wrong-answer submission (which resets the retry window server-side)
  // — see handleSelect below.
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (state.status === 'ready') {
      setSecondsRemaining(state.data.secondsRemaining);
    } else if (state.status === 'error' && state.code === 'ATTEMPT_COMPLETE') {
      setQuizComplete(true);
    }
  }, [state]);

  const remaining = useCountdown(secondsRemaining);
  const expired = remaining <= 0;

  async function handleSelect(key: AnswerOption) {
    if (submitting || expired || showCorrectOverlay) return;
    setSelected(key);
    setSubmitting(true);
    setSubmitError(null);
    setWrongFeedback(false);
    try {
      const result = await api.submitAnswer(Number(attemptId), key);
      if (result.isQuizComplete) {
        setFinalScore({ score: result.score, totalQuestions: result.attempt.totalQuestions });
        setQuizComplete(true);
      } else if (result.correct) {
        setShowCorrectOverlay(true);
      } else {
        setWrongFeedback(true);
        setSelected(null);
        setSecondsRemaining(result.secondsRemaining ?? 0);
      }
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    setShowCorrectOverlay(false);
    setSelected(null);
    reload();
  }

  if (quizComplete) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <Mascot pose="star" size={140} />
          <Text style={styles.title}>All done!</Text>
          {finalScore ? (
            <Text style={styles.errorText}>
              You got {finalScore.score} of {finalScore.totalQuestions} correct. A proper results screen with your
              percentage is wired up in the next phase.
            </Text>
          ) : (
            <Text style={styles.errorText}>Your results screen is wired up in the next phase.</Text>
          )}
          <Button title="Back to Home" variant="primary" onPress={() => router.replace('/')} />
        </SafeAreaView>
      </View>
    );
  }

  if (state.status === 'loading') {
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

  const { question, currentQuestionIndex, totalQuestions } = state.data;
  const optionsDisabled = expired || submitting;
  const options: Record<AnswerOption, string> = {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  };

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

          <Text style={styles.counter}>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Text>

          <Timer remaining={remaining} />

          <Text style={styles.questionText}>{question.questionText}</Text>

          <View style={styles.options}>
            {OPTION_KEYS.map((key) => (
              <Pressable
                key={key}
                disabled={optionsDisabled}
                onPress={() => handleSelect(key)}
                style={[
                  styles.option,
                  selected === key && styles.optionSelected,
                  optionsDisabled && styles.optionDisabled,
                ]}>
                <Text style={[styles.optionText, selected === key && styles.optionTextSelected]}>
                  {options[key]}
                </Text>
              </Pressable>
            ))}
          </View>

          {wrongFeedback ? (
            <WrongAnswerBanner />
          ) : expired ? (
            <Text style={styles.expiredText}>Time&apos;s up! Answering is wired up in the next phase.</Text>
          ) : (
            <Text style={styles.hint}>Tap the answer you think is right.</Text>
          )}

          {submitError ? <Text style={styles.expiredText}>{submitError}</Text> : null}
        </ScrollView>
      </SafeAreaView>

      {showCorrectOverlay ? <CorrectAnswerOverlay onNext={handleNext} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.surface },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  title: { fontSize: 26, fontWeight: '800', color: Brand.ink },
  errorText: { fontSize: 15, color: Brand.ink, textAlign: 'center' },
  content: { padding: 24, gap: Spacing.four },
  link: { fontSize: 14, color: Brand.cobalt, fontWeight: '600' },
  homeButton: { alignSelf: 'flex-start' },
  counter: { fontSize: 14, fontWeight: '700', color: Brand.ink, textAlign: 'center' },
  questionText: { fontSize: 22, fontWeight: '800', color: Brand.ink, textAlign: 'center' },
  options: { gap: 12 },
  option: {
    borderWidth: 2,
    borderColor: Brand.ink,
    borderRadius: 16,
    backgroundColor: Brand.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionSelected: { backgroundColor: Brand.cobalt },
  optionDisabled: { opacity: 0.5 },
  optionText: { fontSize: 16, fontWeight: '700', color: Brand.ink, textAlign: 'center' },
  optionTextSelected: { color: Brand.white },
  hint: { fontSize: 13, color: Brand.cobalt, textAlign: 'center' },
  expiredText: { fontSize: 14, fontWeight: '700', color: '#c0392b', textAlign: 'center' },
});
