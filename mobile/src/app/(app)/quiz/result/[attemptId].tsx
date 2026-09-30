import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/ui/mascot';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useCheersSound } from '@/hooks/use-cheers-sound';
import { useQuizResult } from '@/hooks/use-quiz-result';
import type { AnswerOption, ReviewItem, ReviewOutcome } from '@/lib/api';

const OUTCOME_LABELS: Record<ReviewOutcome, string> = {
  CORRECT: 'Right first time!',
  CORRECT_AFTER_RETRY: 'Got it after trying again',
  MISSED: 'Skipped or ran out of time',
  NOT_ANSWERED: 'Not reached',
};

function optionText(item: ReviewItem, key: AnswerOption) {
  return item[`option${key}` as 'optionA'];
}

// One row of the answer review: the question, the right answer, and — when
// their first pick was different — what they chose first.
function ReviewRow({ item, index }: { item: ReviewItem; index: number }) {
  const gotItFirst = item.outcome === 'CORRECT';
  const wrongFirstPick = item.firstAnswer !== null && item.firstAnswer !== item.correctOption;

  return (
    <View style={[styles.reviewCard, gotItFirst && styles.reviewCardCorrect]}>
      <Text style={styles.reviewOutcome}>
        {index + 1}. {OUTCOME_LABELS[item.outcome]}
      </Text>
      <Text style={styles.reviewQuestion}>{item.questionText}</Text>
      <Text style={styles.reviewAnswer}>Answer: {optionText(item, item.correctOption)}</Text>
      {wrongFirstPick ? (
        <Text style={styles.reviewFirstPick}>You first picked: {optionText(item, item.firstAnswer!)}</Text>
      ) : null}
    </View>
  );
}

// Matches the two result variants in the approved UI design (Appendix C):
// above 70% plays the cheers/claps audio, 70% or below shows an
// encouragement message instead — both share the same layout. The answer
// review below them is a later addition, so children can learn from it.
export default function ResultScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { user } = useAuth();
  const { state } = useQuizResult(Number(attemptId));
  const cheersPlayer = useCheersSound();
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (state.status === 'ready' && state.data.playCheers && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      cheersPlayer.seekTo(0);
      cheersPlayer.play();
    }
  }, [state, cheersPlayer]);

  // "Play Again" no longer restarts the same quiz directly — a finished
  // attempt always sends the student back to the quiz picker, passing
  // restart=1 so any stray in-progress attempt gets finalized rather than
  // silently resumed.
  function handlePlayAgain() {
    router.replace({ pathname: '/quiz/choose', params: { restart: '1' } });
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
          <Button title="Back to Home" variant="primary" onPress={() => router.replace('/')} />
        </SafeAreaView>
      </View>
    );
  }

  const { score, totalQuestions, percentage, playCheers, review } = state.data;
  const roundedPercentage = Math.round(percentage);

  return (
    <View style={[styles.container, playCheers && styles.containerCelebrate]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summary}>
            <Mascot pose={playCheers ? 'star' : 'shrug'} size={140} />
            <Text style={styles.title}>Quiz Complete!</Text>
            <Text style={styles.percentage}>{roundedPercentage}%</Text>
            <Text style={styles.scoreLine}>
              {score} of {totalQuestions} right first time
            </Text>

            {!playCheers ? (
              <Text style={styles.encouragement}>Good try, {user?.firstName}. Play again for more stars.</Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Button title="Play Again" variant="primary" onPress={handlePlayAgain} />
            <Button title="Back to Home" variant="outline" onPress={() => router.replace('/')} />
          </View>

          {review.length > 0 ? (
            <View style={styles.review}>
              <Text style={styles.reviewTitle}>The Answers</Text>
              {review.map((item, index) => (
                <ReviewRow key={item.questionId} item={item} index={index} />
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.surface },
  containerCelebrate: { backgroundColor: Brand.lime },
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  content: { padding: 24, gap: Spacing.four },
  summary: { alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Brand.ink },
  percentage: { fontSize: 48, fontWeight: '800', color: Brand.cobalt },
  scoreLine: { fontSize: 16, fontWeight: '600', color: Brand.ink },
  encouragement: { fontSize: 15, color: Brand.ink, textAlign: 'center', maxWidth: 280 },
  errorText: { fontSize: 14, color: '#c0392b', textAlign: 'center', fontWeight: '600' },
  actions: { gap: 12, width: '100%' },
  review: { gap: 12 },
  reviewTitle: { fontSize: 18, fontWeight: '800', color: Brand.ink },
  reviewCard: {
    borderWidth: 2,
    borderColor: Brand.ink,
    borderRadius: 16,
    backgroundColor: Brand.white,
    padding: 14,
    gap: 4,
  },
  reviewCardCorrect: { borderColor: Brand.cobalt },
  reviewOutcome: { fontSize: 12, fontWeight: '800', color: Brand.cobalt, textTransform: 'uppercase' },
  reviewQuestion: { fontSize: 15, fontWeight: '700', color: Brand.ink },
  reviewAnswer: { fontSize: 14, fontWeight: '600', color: '#4d6600' },
  reviewFirstPick: { fontSize: 13, color: '#a3410a' },
});
