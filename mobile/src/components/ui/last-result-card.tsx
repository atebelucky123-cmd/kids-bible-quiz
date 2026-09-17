import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/theme';
import type { QuizAttemptSummary } from '@/lib/api';

export function LastResultCard({ result }: { result: QuizAttemptSummary }) {
  // Round only for display — the 70%-cheers decision itself is always
  // made server-side against the raw percentage (spec Section 15).
  const percentage = Math.round(result.percentage ?? (result.score / result.totalQuestions) * 100);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/quiz/result/[attemptId]', params: { attemptId: String(result.id) } })}
      style={styles.card}>
      <Text style={styles.title}>Last Result</Text>
      <Text style={styles.score}>
        {result.score} of {result.totalQuestions} correct
      </Text>
      <Text style={styles.percentage}>{percentage}%</Text>
      <Text style={styles.link}>View full result</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: Brand.ink,
    borderRadius: 16,
    backgroundColor: Brand.surface,
    padding: 16,
    gap: 4,
  },
  title: { fontSize: 12, fontWeight: '800', color: Brand.ink, letterSpacing: 1, textTransform: 'uppercase' },
  score: { fontSize: 16, fontWeight: '600', color: Brand.ink },
  percentage: { fontSize: 24, fontWeight: '800', color: Brand.cobalt },
  link: { fontSize: 13, color: Brand.cobalt, fontWeight: '600', marginTop: 4 },
});
