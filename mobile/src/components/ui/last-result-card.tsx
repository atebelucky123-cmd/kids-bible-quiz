import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/theme';
import type { QuizAttemptSummary } from '@/lib/api';

export function LastResultCard({ result }: { result: QuizAttemptSummary }) {
  const percentage = result.percentage ?? Math.round((result.score / result.totalQuestions) * 100);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Last Result</Text>
      <Text style={styles.score}>
        {result.score} of {result.totalQuestions} correct
      </Text>
      <Text style={styles.percentage}>{percentage}%</Text>
    </View>
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
});
