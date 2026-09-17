import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Mascot } from '@/components/ui/mascot';
import { Brand, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useCheersSound } from '@/hooks/use-cheers-sound';
import { useQuizResult } from '@/hooks/use-quiz-result';
import { api, ApiError } from '@/lib/api';

// Matches the two result variants in the approved UI design (Appendix C):
// above 70% plays the cheers/claps audio, 70% or below shows an
// encouragement message instead — both share the same layout.
export default function ResultScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { user } = useAuth();
  const { state } = useQuizResult(Number(attemptId));
  const cheersPlayer = useCheersSound();
  const hasPlayedRef = useRef(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === 'ready' && state.data.playCheers && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      cheersPlayer.seekTo(0);
      cheersPlayer.play();
    }
  }, [state, cheersPlayer]);

  async function handlePlayAgain() {
    setStartError(null);
    setStarting(true);
    try {
      const attempt = await api.startQuiz(false);
      router.replace({ pathname: '/quiz/[attemptId]', params: { attemptId: String(attempt.attemptId) } });
    } catch (err) {
      setStartError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setStarting(false);
    }
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

  const { score, totalQuestions, percentage, playCheers } = state.data;
  const roundedPercentage = Math.round(percentage);

  return (
    <View style={[styles.container, playCheers && styles.containerCelebrate]}>
      <SafeAreaView style={styles.centered}>
        <Mascot pose={playCheers ? 'star' : 'shrug'} size={140} />
        <Text style={styles.title}>Quiz Complete!</Text>
        <Text style={styles.percentage}>{roundedPercentage}%</Text>
        <Text style={styles.scoreLine}>
          {score} of {totalQuestions} correct
        </Text>

        {!playCheers ? (
          <Text style={styles.encouragement}>Good try, {user?.firstName}. Play again for more stars.</Text>
        ) : null}

        {startError ? <Text style={styles.errorText}>{startError}</Text> : null}

        <View style={styles.actions}>
          <Button title="Play Again" variant="primary" loading={starting} onPress={handlePlayAgain} />
          <Button title="Back to Home" variant="outline" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.surface },
  containerCelebrate: { backgroundColor: Brand.lime },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: Brand.ink },
  percentage: { fontSize: 48, fontWeight: '800', color: Brand.cobalt },
  scoreLine: { fontSize: 16, fontWeight: '600', color: Brand.ink },
  encouragement: { fontSize: 15, color: Brand.ink, textAlign: 'center', maxWidth: 280 },
  errorText: { fontSize: 14, color: '#c0392b', textAlign: 'center', fontWeight: '600' },
  actions: { gap: 12, width: '100%', marginTop: Spacing.four },
});
